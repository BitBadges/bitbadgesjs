/**
 * BitBadgesAgent — open-source AI builder for BitBadges collections.
 *
 * Users bring their own Anthropic API key. BitBadges never sees keys
 * nor proxies requests. The full prompt, tools, validation fix loop,
 * and session storage are bundled.
 *
 * Zero-config:
 * ```ts
 * const agent = new BitBadgesAgent({ anthropicKey: process.env.ANTHROPIC_API_KEY });
 * const result = await agent.build('create a subscription token for $10/mo');
 * console.log(result.transaction);
 * ```
 */

import { handleGetTransaction } from '../tools/index.js';
import { getAllSkillInstructions, type SkillInstruction } from '../resources/skillInstructions.js';
import { getAnthropicClient } from './anthropicClient.js';
import { AbortedError, BitBadgesAgentError, QuotaExceededError, ValidationFailedError } from './errors.js';
import { substituteImages, collectImageReferences, type ImageMap } from './images.js';
import { resolveModel, type ModelInfo } from './models.js';
import { assemblePromptParts, assembleExportPrompt, buildFixPrompt, buildSystemPrompt, getSystemPromptHash } from './prompt.js';
import { MemoryStore, type KVStore } from './sessionStore.js';
import { createAgentToolRegistry, type AgentToolRegistry } from './toolAdapter.js';
import { runAgentLoop } from './loop.js';
import { runValidationGate, type ValidationGateResult } from './validation.js';
import type {
  AgentHooks,
  BitBadgesAgentOptions,
  BuildMode,
  BuildOptions,
  BuildResult,
  BuildTrace,
  StructuredError,
  ValidationStrictness,
  Warning
} from './types.js';

const DEFAULTS = {
  model: 'sonnet' as const,
  validation: 'strict' as ValidationStrictness,
  maxRounds: 8,
  fixLoopMaxRounds: 3,
  maxTokensPerBuild: 1_500_000,
  anthropicTimeoutMs: 120_000,
  sessionTtlSeconds: 2 * 60 * 60
};

export class BitBadgesAgent {
  private readonly options: BitBadgesAgentOptions;
  private readonly model: ModelInfo;
  private readonly registry: AgentToolRegistry;
  private readonly sessionStore: KVStore;
  private readonly hooks: AgentHooks;
  private client: any = null;
  /**
   * Per-build abort controllers. A Set rather than a single field so
   * concurrent `build()` calls on one agent instance (common in Express
   * servers) don't clobber each other. `agent.abort()` aborts every
   * in-flight build.
   */
  private readonly inFlightControllers = new Set<AbortController>();

  constructor(options: BitBadgesAgentOptions) {
    if (!options) {
      throw new BitBadgesAgentError('BitBadgesAgent requires options', 'INVALID_OPTIONS');
    }
    // Resolve Anthropic creds up front so we can fail fast with a clear error.
    const envAnthropicKey = typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined;
    const envAnthropicAuth =
      typeof process !== 'undefined' ? process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_OAUTH_TOKEN : undefined;
    const hasAnthropicCreds =
      !!options.anthropicClient ||
      !!options.anthropicKey ||
      !!options.anthropicAuthToken ||
      !!envAnthropicKey ||
      !!envAnthropicAuth;
    if (!hasAnthropicCreds) {
      throw new BitBadgesAgentError(
        'BitBadgesAgent requires Anthropic credentials. Provide one of: `anthropicKey` (API key), `anthropicAuthToken` (OAuth), `anthropicClient` (pre-built), or set ANTHROPIC_API_KEY / ANTHROPIC_OAUTH_TOKEN in the environment. BitBadges never stores API keys.',
        'MISSING_ANTHROPIC_CREDS'
      );
    }

    if (options.skills && options.skills.length > 0) {
      const valid = new Set(getAllSkillInstructions().map((s) => s.id));
      const bad = options.skills.filter((s) => !valid.has(s));
      if (bad.length > 0) {
        throw new BitBadgesAgentError(
          `Unknown skills: ${bad.join(', ')}. Valid skills: ${[...valid].sort().join(', ')}`,
          'INVALID_SKILLS'
        );
      }
    }

    // Resolve BitBadges API credentials — used by query/search tools.
    const envBbKey = typeof process !== 'undefined' ? process.env.BITBADGES_API_KEY : undefined;
    const envBbUrl = typeof process !== 'undefined' ? process.env.BITBADGES_API_URL : undefined;
    const resolvedBitbadgesApiKey = options.bitbadgesApiKey ?? envBbKey;
    const resolvedBitbadgesApiUrl = options.bitbadgesApiUrl ?? envBbUrl;

    // Inject BitBadges API creds into every tool call so query/search/simulate
    // tools work without the LLM having to know about credentials.
    const defaultArgs: Record<string, unknown> = {};
    if (resolvedBitbadgesApiKey) defaultArgs.apiKey = resolvedBitbadgesApiKey;
    if (resolvedBitbadgesApiUrl) defaultArgs.apiUrl = resolvedBitbadgesApiUrl;

    this.options = options;
    this.model = resolveModel(options.model ?? DEFAULTS.model);
    this.registry = createAgentToolRegistry({
      remove: options.tools?.remove,
      add: options.tools?.add,
      defaultArgs
    });
    this.sessionStore = options.sessionStore ?? new MemoryStore();
    this.hooks = options.hooks ?? {};

    // One-time construction-time warning: if the configured skill set
    // includes any skill whose instructions reference on-chain collection
    // IDs (e.g. smart-token → collections 42 / 87) AND no bitbadgesApiKey
    // is configured, the agent won't be able to call query_collection to
    // fetch those live examples. The build still runs, but the LLM loses
    // a useful grounding signal.
    if (!resolvedBitbadgesApiKey && options.skills && options.skills.length > 0) {
      const allSkills = getAllSkillInstructions();
      const skillsWithRefs = allSkills.filter(
        (s) => options.skills!.includes(s.id) && (s.referenceCollectionIds?.length ?? 0) > 0
      );
      if (skillsWithRefs.length > 0 && options.debug) {
        console.warn(
          `[BitBadgesAgent] Skills ${skillsWithRefs.map((s) => s.id).join(', ')} reference on-chain collections ` +
            `but no bitbadgesApiKey is configured. query_collection calls will fail mid-loop. ` +
            `Set bitbadgesApiKey or BITBADGES_API_KEY env to enable.`
        );
      }
    }
  }

  /** Cancel every in-flight build on this agent instance. */
  abort(): void {
    for (const c of this.inFlightControllers) c.abort();
  }

  /** The resolved Anthropic model info (id + pricing) for this agent. */
  get modelInfo(): ModelInfo {
    return this.model;
  }

  /** Read-only view of the tool registry. */
  get tools(): AgentToolRegistry {
    return this.registry;
  }

  /** Helper — substitute IMAGE_N placeholders in a transaction with caller-provided URLs/bytes. */
  substituteImages<T>(transaction: T, images: ImageMap): T {
    return substituteImages(transaction, images);
  }

  /** Helper — list IMAGE_N tokens referenced in a transaction. */
  collectImageReferences(transaction: any): string[] {
    return collectImageReferences(transaction);
  }

  /**
   * List every skill available to this agent. Respects the
   * constructor's `skills` whitelist if one was set — returns only
   * the allowed subset. Zero network, synchronous.
   *
   * Useful for building a skill picker UI or logging what's on offer.
   */
  listSkills(): SkillInstruction[] {
    const all = getAllSkillInstructions();
    if (!this.options.skills || this.options.skills.length === 0) return all;
    const allowed = new Set(this.options.skills);
    return all.filter((s) => allowed.has(s.id));
  }

  /**
   * Look up a single skill by id. Returns `null` when the id isn't
   * recognized (or isn't allowed by the constructor whitelist).
   */
  describeSkill(id: string): SkillInstruction | null {
    if (this.options.skills && this.options.skills.length > 0) {
      if (!this.options.skills.includes(id)) return null;
    }
    return getAllSkillInstructions().find((s) => s.id === id) ?? null;
  }

  /**
   * Assemble a one-shot prompt suitable for pasting into a raw LLM
   * UI (Claude.ai, ChatGPT, Gemini) that has no BitBadges tools
   * available. The returned string combines the export-mode system
   * prompt — which carries the full Output Format JSON spec — with
   * the assembled user message, so the model can emit the final
   * transaction JSON directly.
   *
   * Same inputs as `build()`. No Anthropic call is made.
   */
  async exportPrompt(
    prompt: string,
    options?: BuildOptions
  ): Promise<{ prompt: string; communitySkillsIncluded: string[] }> {
    if (!prompt || typeof prompt !== 'string') {
      throw new BitBadgesAgentError('`prompt` is required and must be a string', 'INVALID_PROMPT');
    }
    const creatorAddress =
      options?.creatorAddress ?? this.options.defaultCreatorAddress ?? 'bb1examplecreator000000000000000000000000';
    const mode: BuildMode = options?.mode ?? this.options.defaultMode ?? 'create';
    const effectiveSkills = this.options.skills
      ? (options?.selectedSkills ?? []).filter((s) => this.options.skills!.includes(s))
      : (options?.selectedSkills ?? []);

    return assembleExportPrompt(
      {
        prompt,
        creatorAddress,
        selectedSkills: effectiveSkills,
        promptSkillIds: options?.promptSkillIds ?? [],
        contextHelpers: options?.contextHelpers,
        metadata: options?.metadata,
        availableImagePlaceholders: options?.availableImagePlaceholders,
        isRefinement: mode === 'refine',
        isUpdate: mode === 'update',
        existingCollectionId: options?.existingCollectionId,
        sessionId: options?.sessionId,
        originalPrompt: options?.originalPrompt,
        priorRefinePrompts: options?.priorRefinePrompts,
        diffLog: options?.diffLog
      },
      { communitySkillsFetcher: this.options.communitySkillsFetcher }
    );
  }

  /**
   * Main entry — build (or update/refine) a collection from a natural-language prompt.
   *
   * NOTE on prompt trust: the raw `prompt` argument is intentionally NOT
   * run through `containsInjection`. BitBadgesAgent is BYO-key; the
   * caller controls their own key and their own prompts, so screening
   * would just get in the way of legitimate uses (research, fine-tuning,
   * bots with well-formed prompts). Server-side consumers that expose
   * this agent to untrusted users (e.g. the BitBadges indexer) apply
   * `containsInjection` at their trust boundary before calling
   * `build()`. Community-skill text coming from third parties IS
   * sanitized here — see `prompt.ts` `fetchCommunitySkillsSection`.
   */
  async build(prompt: string, options?: BuildOptions): Promise<BuildResult> {
    if (!prompt || typeof prompt !== 'string') {
      throw new BitBadgesAgentError('`prompt` is required and must be a string', 'INVALID_PROMPT');
    }

    const creatorAddress = options?.creatorAddress ?? this.options.defaultCreatorAddress ?? 'bb1auto-creator';
    const mode: BuildMode = options?.mode ?? this.options.defaultMode ?? 'create';
    const sessionId = options?.sessionId ?? `agent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Per-build abort controller — tracked in the inFlightControllers
    // set so agent.abort() can cancel every concurrent build without
    // the last-writer-wins race a single instance field would create.
    const abortController = new AbortController();
    this.inFlightControllers.add(abortController);
    const signal = abortController.signal;
    const callerSignal = options?.abortSignal;
    if (callerSignal) {
      if (callerSignal.aborted) abortController.abort();
      else callerSignal.addEventListener('abort', () => abortController.abort(), { once: true });
    }

    try {
      return await this.runBuild(prompt, options, sessionId, mode, creatorAddress, signal);
    } finally {
      this.inFlightControllers.delete(abortController);
    }
  }

  private async runBuild(
    prompt: string,
    options: BuildOptions | undefined,
    sessionId: string,
    mode: BuildMode,
    creatorAddress: string,
    signal: AbortSignal
  ): Promise<BuildResult> {
    // Resolve Anthropic client lazily — supports OAuth token, API key, or a pre-built client.
    this.client ??= await getAnthropicClient({
      client: this.options.anthropicClient,
      apiKey: this.options.anthropicKey,
      authToken: this.options.anthropicAuthToken,
      baseURL: this.options.anthropicBaseUrl
    });

    // Merge per-build hook overrides on top of constructor hooks
    const hooks: AgentHooks = { ...this.hooks, ...(options?.hooks ?? {}) };
    const debug = !!this.options.debug;

    const requestedSkills = options?.selectedSkills ?? [];
    const effectiveSkills = this.options.skills
      ? requestedSkills.filter((s) => this.options.skills!.includes(s))
      : requestedSkills;

    // Unknown-skill warning — surface only in debug mode so we don't
    // spam production logs for callers passing arbitrary tags. No
    // throw: unknown IDs drop silently (getSkillContent returns null
    // and the section ends up empty), matching legacy behavior.
    if (debug && requestedSkills.length > 0) {
      const validIds = new Set(getAllSkillInstructions().map((s) => s.id));
      const unknown = requestedSkills.filter((s) => !validIds.has(s));
      if (unknown.length > 0) {
        console.warn(
          `[BitBadgesAgent] Unknown selectedSkills dropped: ${unknown.join(', ')}. ` +
            `Valid skills: ${[...validIds].sort().join(', ')}`
        );
      }
    }

    // Load any prior conversation from the session store (for refinement across HTTP boundaries)
    let existingMessages: any[] | undefined;
    try {
      const raw = await this.sessionStore.get(sessionId);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.messages)) existingMessages = parsed.messages;
      }
    } catch {
      // ignore — store read errors are non-fatal
    }

    // Assemble prompt — honor `systemPrompt` full replace and `systemPromptAppend`
    const promptParts = await assemblePromptParts(
      {
        prompt,
        creatorAddress,
        selectedSkills: effectiveSkills,
        promptSkillIds: options?.promptSkillIds ?? [],
        contextHelpers: options?.contextHelpers,
        metadata: options?.metadata,
        availableImagePlaceholders: options?.availableImagePlaceholders,
        isRefinement: mode === 'refine',
        isUpdate: mode === 'update',
        existingCollectionId: options?.existingCollectionId,
        sessionId,
        originalPrompt: options?.originalPrompt,
        priorRefinePrompts: options?.priorRefinePrompts,
        diffLog: options?.diffLog
      },
      {
        communitySkillsFetcher: this.options.communitySkillsFetcher,
        systemPromptOverride: this.options.systemPrompt,
        systemPromptAppend: this.options.systemPromptAppend
      }
    );

    const systemPromptHash = getSystemPromptHash(promptParts.systemPrompt);

    // --- Run main agent loop ---
    let loopResult = await runAgentLoop({
      client: this.client,
      systemPrompt: promptParts.systemPrompt,
      userMessage: promptParts.userMessage,
      userContent: promptParts.userContent,
      registry: this.registry,
      sessionId,
      creatorAddress,
      model: this.model,
      maxRounds: this.options.maxRounds ?? DEFAULTS.maxRounds,
      maxTokensPerBuild: this.options.maxTokensPerBuild ?? DEFAULTS.maxTokensPerBuild,
      anthropicTimeoutMs: this.options.anthropicTimeoutMs ?? DEFAULTS.anthropicTimeoutMs,
      existingMessages,
      abortSignal: signal,
      hooks,
      debug
    });

    let rounds = loopResult.rounds;
    let fixRounds = 0;
    let totalTokens = loopResult.totalTokens;
    let totalCostUsd = loopResult.totalCostUsd;
    let cacheCreationTokens = loopResult.cacheCreationTokens;
    let cacheReadTokens = loopResult.cacheReadTokens;

    // --- Extract current transaction from the SDK session ---
    // Single call — the handler's result may wrap the tx (`{ transaction }`)
    // or return it directly; handle both without invoking twice.
    const txResponse: any = await handleGetTransaction({ sessionId } as any);
    let transaction = txResponse?.transaction ?? txResponse;

    // --- Validation gate (unless off) ---
    const strictness: ValidationStrictness = this.options.validation ?? DEFAULTS.validation;
    let gate: ValidationGateResult | null = null;

    if (strictness !== 'off') {
      gate = await runValidationGate({
        transaction,
        creatorAddress,
        abortSignal: signal,
        simulate: this.options.simulate,
        onChainSnapshot: options?.existingCollectionId && this.options.onChainSnapshotFetcher
          ? await this.options.onChainSnapshotFetcher(options.existingCollectionId).catch(() => null)
          : undefined
      });

      // --- Validation fix loop ---
      const fixLoopMax = this.options.fixLoopMaxRounds ?? DEFAULTS.fixLoopMaxRounds;
      while (gate && !gate.valid && fixRounds < fixLoopMax) {
        fixRounds++;
        if (signal.aborted) throw new AbortedError(totalTokens);

        const fixUserMsg = buildFixPrompt(gate.hardErrors, gate.advisoryNotes, fixRounds, fixLoopMax);
        loopResult = await runAgentLoop({
          client: this.client,
          systemPrompt: promptParts.systemPrompt,
          userMessage: fixUserMsg,
          // Fix-round message is dynamic error guidance — no cache value
          // in marking it, so send as a plain string (no userContent).
          registry: this.registry,
          sessionId,
          creatorAddress,
          model: this.model,
          maxRounds: Math.max(2, Math.floor((this.options.maxRounds ?? DEFAULTS.maxRounds) / 2)),
          maxTokensPerBuild: this.options.maxTokensPerBuild ?? DEFAULTS.maxTokensPerBuild,
          anthropicTimeoutMs: this.options.anthropicTimeoutMs ?? DEFAULTS.anthropicTimeoutMs,
          existingMessages: loopResult.messages,
          abortSignal: signal,
          hooks,
          debug,
          startingTokens: totalTokens,
          startingCostUsd: totalCostUsd,
          startingCacheCreationTokens: cacheCreationTokens,
          startingCacheReadTokens: cacheReadTokens
        });
        rounds += loopResult.rounds;
        totalTokens = loopResult.totalTokens;
        totalCostUsd = loopResult.totalCostUsd;
        cacheCreationTokens = loopResult.cacheCreationTokens;
        cacheReadTokens = loopResult.cacheReadTokens;

        const freshTxResp = await handleGetTransaction({ sessionId } as any);
        transaction = (freshTxResp as any)?.transaction ?? freshTxResp;

        gate = await runValidationGate({
          transaction,
          creatorAddress,
          abortSignal: signal,
          simulate: this.options.simulate
        });
      }

      if (!gate.valid && strictness === 'strict') {
        const errors = structureErrors(gate);
        throw new ValidationFailedError(errors, transaction, [...gate.advisoryNotes]);
      }
    }

    // --- Persist session for refinement ---
    try {
      await this.sessionStore.set(
        sessionId,
        JSON.stringify({ messages: loopResult.messages, transaction, tokensUsed: totalTokens }),
        { ttlSeconds: DEFAULTS.sessionTtlSeconds }
      );
    } catch {
      // non-fatal
    }

    const trace: BuildTrace = {
      systemPrompt: promptParts.systemPrompt,
      userMessage: promptParts.userMessage,
      messages: loopResult.messages,
      toolCalls: loopResult.toolCalls,
      rounds,
      fixRounds,
      tokensUsed: totalTokens,
      cacheCreationTokens,
      cacheReadTokens,
      costUsd: totalCostUsd,
      model: this.model.id,
      systemPromptHash
    };

    // Fire completion hook
    try {
      const r = hooks.onCompletion?.(trace);
      if (r && typeof (r as any).catch === 'function') (r as any).catch(() => {});
    } catch { /* swallow */ }

    const warnings: Warning[] = gate ? gate.advisoryNotes.map((n) => ({ category: 'advisory', message: n })) : [];
    const structuredErrors = gate ? structureErrors(gate) : [];

    const result: BuildResult = {
      valid: gate ? gate.valid : true,
      transaction,
      errors: structuredErrors,
      warnings,
      hardErrors: gate?.hardErrors ?? [],
      advisoryNotes: gate?.advisoryNotes ?? [],
      validation: gate?.validation ?? { valid: true, issues: [] },
      simulation: gate?.simulation ?? null,
      audit: gate?.audit ?? null,
      tokensUsed: totalTokens,
      costUsd: totalCostUsd,
      rounds,
      fixRounds,
      trace,
      toString() {
        const msgCount = Array.isArray(this.transaction?.messages) ? this.transaction.messages.length : 0;
        const validityStr = this.valid ? 'valid' : `${this.errors.length} error${this.errors.length === 1 ? '' : 's'}`;
        const costStr = this.costUsd.toFixed(4);
        const cacheStr = this.trace.cacheReadTokens > 0
          ? `, cache ${this.trace.cacheReadTokens.toLocaleString()} read / ${this.trace.cacheCreationTokens.toLocaleString()} write`
          : '';
        return `BitBadgesAgent build: ${msgCount} message(s), ${validityStr}, ${this.tokensUsed.toLocaleString()} tokens${cacheStr}, $${costStr}, ${this.rounds} round(s)${this.fixRounds ? ` + ${this.fixRounds} fix` : ''}`;
      }
    };

    return result;
  }

  /**
   * Low-level escape hatch — re-export the system prompt for this agent's mode.
   * Useful for logging / prompt-regression testing.
   */
  getSystemPrompt(mode: BuildMode = 'create'): string {
    if (this.options.systemPrompt) return this.options.systemPrompt;
    const base = buildSystemPrompt(mode);
    return this.options.systemPromptAppend
      ? `${base}\n\n## Additional Guidance (from consumer)\n${this.options.systemPromptAppend}`
      : base;
  }

  /**
   * Quick round-trip to verify credentials work. Makes a 1-token probe call
   * to Anthropic and (if configured) a small request against BitBadges API.
   * Returns a structured health report — does not throw on failure.
   */
  async healthCheck(): Promise<{
    anthropic: { ok: boolean; model?: string; error?: string };
    bitbadgesApi: { ok: boolean; configured: boolean; error?: string };
  }> {
    const report = {
      anthropic: { ok: false, error: undefined as string | undefined, model: undefined as string | undefined },
      bitbadgesApi: { ok: false, configured: false, error: undefined as string | undefined }
    };

    try {
      this.client ??= await getAnthropicClient({
        client: this.options.anthropicClient,
        apiKey: this.options.anthropicKey,
        authToken: this.options.anthropicAuthToken,
        baseURL: this.options.anthropicBaseUrl
      });
      await this.client.messages.create({
        model: this.model.id,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }]
      });
      report.anthropic.ok = true;
      report.anthropic.model = this.model.id;
    } catch (e: any) {
      report.anthropic.error = e?.message || String(e);
    }

    // BitBadges API is optional — only probe if configured.
    const envBbKey = typeof process !== 'undefined' ? process.env.BITBADGES_API_KEY : undefined;
    const hasBbKey = !!(this.options.bitbadgesApiKey || envBbKey);
    report.bitbadgesApi.configured = hasBbKey;
    if (hasBbKey) {
      try {
        const result = await this.registry.execute(
          'get_current_timestamp',
          {},
          { sessionId: 'healthcheck', callerAddress: this.options.defaultCreatorAddress ?? '' }
        );
        const parsed = JSON.parse(result);
        report.bitbadgesApi.ok = !parsed?.error;
        if (parsed?.error) report.bitbadgesApi.error = parsed.error;
      } catch (e: any) {
        report.bitbadgesApi.error = e?.message || String(e);
      }
    }

    return report;
  }

  /**
   * Validate an existing transaction object without running the agent
   * loop. Useful for CI checks or re-running validation after manual edits.
   */
  async validate(transaction: any, creatorAddress?: string): Promise<{
    valid: boolean;
    errors: StructuredError[];
    warnings: Warning[];
    validation: any;
    simulation: any | null;
    audit: any | null;
  }> {
    const gate = await runValidationGate({
      transaction,
      creatorAddress: creatorAddress ?? this.options.defaultCreatorAddress ?? '',
      simulate: this.options.simulate
    });
    return {
      valid: gate.valid,
      errors: structureErrors(gate),
      warnings: gate.advisoryNotes.map((n) => ({ category: 'advisory', message: n })),
      validation: gate.validation,
      simulation: gate.simulation,
      audit: gate.audit
    };
  }
}

function structureErrors(gate: ValidationGateResult): StructuredError[] {
  const errors: StructuredError[] = [];
  for (const raw of gate.hardErrors) {
    // Error strings start with a bracketed source tag: "[validation]", "[standards]", "[simulation]", "[review]".
    const tag = raw.match(/^\[(\w+)\]/)?.[1] ?? 'error';
    errors.push({ code: tag, message: raw.replace(/^\[\w+\]\s*/, '') });
  }
  return errors;
}
