/**
 * BitBadgesBuilderAgent — open-source AI builder for BitBadges collections.
 *
 * Users bring their own Anthropic API key. BitBadges never sees keys
 * nor proxies requests. The full prompt, tools, validation fix loop,
 * and session storage are bundled.
 *
 * Zero-config:
 * ```ts
 * const agent = new BitBadgesBuilderAgent({ anthropicKey: process.env.ANTHROPIC_API_KEY });
 * const result = await agent.build('create a subscription token for $10/mo');
 * console.log(result.transaction);
 * ```
 */

import { randomUUID } from 'crypto';
import { handleGetTransaction } from '../tools/index.js';
import { getOrCreateSession, drainReviewFlags, getReviewFlags } from '../session/sessionState.js';
import { getAllSkillInstructions, type SkillInstruction } from '../resources/skillInstructions.js';
import { getAnthropicClient } from './anthropicClient.js';
import { AbortedError, BitBadgesBuilderAgentError, ValidationFailedError } from './errors.js';
import { containsInjection } from './sanitize.js';
import { substituteImages, collectImageReferences, type ImageMap } from './images.js';
import { resolveModel, type ModelInfo } from './models.js';
import { assemblePromptParts, assembleExportPrompt, buildFixPrompt, buildSystemPrompt, getSystemPromptHash } from './prompt.js';
import { MemoryStore, type KVStore } from './sessionStore.js';
import { createAgentToolRegistry, type AgentToolRegistry } from './toolAdapter.js';
import { runAgentLoop } from './loop.js';
import { runValidationGate, type ValidationGateResult } from './validation.js';
import { inferTokenTypeFromPrompt, getTokenTypeSkills } from './tokenTypeInference.js';
import type { DesignDecisionsResult } from '../../core/review-types.js';
import type {
  AgentHooks,
  BitBadgesBuilderAgentOptions,
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

export class BitBadgesBuilderAgent {
  private readonly options: BitBadgesBuilderAgentOptions;
  private readonly model: ModelInfo;
  private readonly registry: AgentToolRegistry;
  private readonly sessionStore: KVStore;
  private readonly hooks: AgentHooks;
  private client: any = null;
  /**
   * Pending init promise for the Anthropic client. Shared across
   * concurrent `build()` calls so multiple parallel builds don't each
   * fire their own `getAnthropicClient()` init — the last one's result
   * would overwrite via `this.client ??=`, silently losing an earlier
   * init error and wasting work.
   */
  private clientInitPromise: Promise<any> | null = null;
  /**
   * Per-build abort controllers. A Set rather than a single field so
   * concurrent `build()` calls on one agent instance (common in Express
   * servers) don't clobber each other. `agent.abort()` aborts every
   * in-flight build.
   */
  private readonly inFlightControllers = new Set<AbortController>();

  constructor(options: BitBadgesBuilderAgentOptions) {
    if (!options) {
      throw new BitBadgesBuilderAgentError('BitBadgesBuilderAgent requires options', 'INVALID_OPTIONS');
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
      throw new BitBadgesBuilderAgentError(
        'BitBadgesBuilderAgent requires Anthropic credentials. Provide one of: `anthropicKey` (API key), `anthropicAuthToken` (OAuth), `anthropicClient` (pre-built), or set ANTHROPIC_API_KEY / ANTHROPIC_OAUTH_TOKEN in the environment. BitBadges never stores API keys.',
        'MISSING_ANTHROPIC_CREDS'
      );
    }

    if (options.skills && options.skills.length > 0) {
      const valid = new Set(getAllSkillInstructions().map((s) => s.id));
      const bad = options.skills.filter((s) => !valid.has(s));
      if (bad.length > 0) {
        throw new BitBadgesBuilderAgentError(
          `Unknown skills: ${bad.join(', ')}. Valid skills: ${[...valid].sort().join(', ')}`,
          'INVALID_SKILLS'
        );
      }
    }

    // Consumer-supplied systemPromptAppend + systemPrompt are
    // concatenated into / replace the system prompt. Callers running
    // untrusted values (end-user text) should sanitize before passing
    // either. Best-effort injection check so obvious "ignore your
    // instructions" input fails fast rather than silently subverting
    // the base prompt. Both slots are checked under the same policy.
    if (options.systemPromptAppend && containsInjection(options.systemPromptAppend)) {
      throw new BitBadgesBuilderAgentError(
        '`systemPromptAppend` contains prompt-injection patterns. Sanitize end-user input before passing.',
        'INVALID_SYSTEM_PROMPT_APPEND'
      );
    }
    if (options.systemPrompt && containsInjection(options.systemPrompt)) {
      throw new BitBadgesBuilderAgentError(
        '`systemPrompt` (full replace) contains prompt-injection patterns. The full-replace option bypasses base-prompt protections; sanitize first.',
        'INVALID_SYSTEM_PROMPT'
      );
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
          `[BitBadgesBuilderAgent] Skills ${skillsWithRefs.map((s) => s.id).join(', ')} reference on-chain collections ` +
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
      throw new BitBadgesBuilderAgentError('`prompt` is required and must be a string', 'INVALID_PROMPT');
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
      {
        communitySkillsFetcher: this.options.communitySkillsFetcher,
        // Thread the ctor's append slot through so exportPrompt produces
        // the same system-prompt shape as build(). Previously missed —
        // users setting systemPromptAppend saw their customization land
        // in interactive builds but not in exported prompts.
        systemPromptAppend: this.options.systemPromptAppend
      }
    );
  }

  /**
   * Main entry — build (or update/refine) a collection from a natural-language prompt.
   *
   * NOTE on prompt trust: the raw `prompt` argument is intentionally NOT
   * run through `containsInjection`. BitBadgesBuilderAgent is BYO-key; the
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
      throw new BitBadgesBuilderAgentError('`prompt` is required and must be a string', 'INVALID_PROMPT');
    }

    const creatorAddress = options?.creatorAddress ?? this.options.defaultCreatorAddress ?? 'bb1auto-creator';
    const mode: BuildMode = options?.mode ?? this.options.defaultMode ?? 'create';
    // Session IDs are guessable if we use `Math.random()`. CodeQL flags
    // this as a security smell (insecure randomness in security
    // context); `crypto.randomUUID()` is the right default. Callers
    // can still pass their own `sessionId`.
    const sessionId = options?.sessionId ?? `agent-${randomUUID()}`;

    // Pre-populate the SDK's in-process session with the creator
    // address. Session-mutating tools (set_standards, add_approval,
    // ...) default creator from context when they hit getOrCreateSession
    // for the first time — but if the LLM calls a non-session tool
    // first (search_knowledge_base, fetch_docs), the session is never
    // created with the creator and the final tx has `value.creator = ""`.
    // Pre-init here guarantees the creator lands on the template up
    // front, matching the legacy indexer flow that called
    // `getOrCreateSession(sid, safeCreatorAddress)` explicitly before
    // the agent loop.
    getOrCreateSession(sessionId, creatorAddress);

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
    // Resolve Anthropic client lazily — supports OAuth token, API key,
    // or a pre-built client. Concurrent builds share a single init
    // promise so we don't double-fire getAnthropicClient() on race.
    // Clearing clientInitPromise on failure allows subsequent retries
    // to re-attempt init after a transient error.
    if (!this.client) {
      if (!this.clientInitPromise) {
        this.clientInitPromise = getAnthropicClient({
          client: this.options.anthropicClient,
          apiKey: this.options.anthropicKey,
          authToken: this.options.anthropicAuthToken,
          baseURL: this.options.anthropicBaseUrl
        }).then(
          (c) => {
            this.client = c;
            return c;
          },
          (err) => {
            this.clientInitPromise = null;
            throw err;
          }
        );
      }
      await this.clientInitPromise;
    }

    // Merge per-build hook overrides on top of constructor hooks
    const hooks: AgentHooks = { ...this.hooks, ...(options?.hooks ?? {}) };
    const debug = !!this.options.debug;

    // Phase timing — each `logPhase()` emits an info entry via onLog
    // with durationMs since the mark was started. Consumers pipe these
    // into session logs / dashboards. Swallows throws so a misbehaving
    // log sink can't break a build. Cheap (Date.now + object literal).
    const buildStartMs = Date.now();
    const logPhase = (label: string, startMs: number, data?: unknown): void => {
      if (!hooks.onLog) return;
      try {
        const durationMs = Date.now() - startMs;
        const r = hooks.onLog({ type: 'info', label, durationMs, data });
        if (r && typeof (r as any).catch === 'function') (r as any).catch(() => {});
      } catch {
        // Observability hook — never let it break the build.
      }
    };

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
          `[BitBadgesBuilderAgent] Unknown selectedSkills dropped: ${unknown.join(', ')}. ` +
            `Valid skills: ${[...validIds].sort().join(', ')}`
        );
      }
    }

    // Load any prior conversation from the session store (for refinement across HTTP boundaries)
    let existingMessages: any[] | undefined;
    let existingSessionTransaction: any = null;
    try {
      const raw = await this.sessionStore.get(sessionId);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.messages)) existingMessages = parsed.messages;
        if (parsed && typeof parsed.transaction === 'object') existingSessionTransaction = parsed.transaction;
        // NOTE: we persist `reviewFlags` on the session snapshot below for
        // forensics / debugging, but we do NOT load them back into the
        // session accumulator on resume. Cumulative accumulation across
        // refinements is a UI concern: each build's BuildResult.reviewFlags
        // contains ONLY the flags raised in THAT build. Consumers (e.g.
        // the frontend AI builder) append + dedupe across builds to form
        // the cumulative list shown to the user.
      }
    } catch {
      // ignore — store read errors are non-fatal
    }

    // --- Smart token-type inference ----------------------------------
    // Runs only when the caller didn't supply a token-type skill. Non
    // token-type skills (community / additional-context) don't block
    // inference — they coexist with an inferred token type. For
    // refine/update flows we fold prior intent + existing standards
    // into the inference context, so a short "fix this" doesn't strip
    // the classifier of the signal it needs.
    const tokenTypeSkillIds = new Set(getTokenTypeSkills().map((s) => s.id));
    const effectiveSkillsHasTokenType = effectiveSkills.some((s) => tokenTypeSkillIds.has(s));
    const inferFlag =
      options?.autoInferTokenType ?? this.options.autoInferTokenType ?? true;
    const shouldInferTokenType =
      inferFlag &&
      !effectiveSkillsHasTokenType &&
      !!prompt &&
      !!this.client;

    let inferredTokenType: string | null | undefined = undefined;
    let inferredTokenTypeSource: 'standards' | 'llm' | undefined = undefined;
    let inferredTokenTypeReasoning: string | undefined = undefined;
    let finalSkills = effectiveSkills;

    if (shouldInferTokenType) {
      let existingSnapshot: any = null;
      if (options?.existingCollectionId && this.options.onChainSnapshotFetcher) {
        existingSnapshot = await this.options.onChainSnapshotFetcher(options.existingCollectionId).catch(() => null);
      }
      const inferenceCtx = {
        prompt,
        mode,
        originalPrompt: options?.originalPrompt,
        priorRefinePrompts: options?.priorRefinePrompts,
        existingTransaction: existingSessionTransaction ?? existingSnapshot,
        allowedTokenTypeIds: this.options.skills
          ? this.options.skills.filter((s) => tokenTypeSkillIds.has(s))
          : undefined,
        anthropicClient: this.client,
        abortSignal: signal,
        debug
      };
      const inferenceResult = await inferTokenTypeFromPrompt(inferenceCtx);
      inferredTokenType = inferenceResult.tokenType;
      if (inferenceResult.tokenType && inferenceResult.source) {
        inferredTokenTypeSource = inferenceResult.source;
        inferredTokenTypeReasoning = inferenceResult.reasoning;
        // Prepend (don't append) — token types are most load-bearing,
        // and buildSelectedSkillsSection sorts for cache stability so
        // order is purely a readability choice.
        finalSkills = [inferenceResult.tokenType, ...effectiveSkills];
      }

      // Fold the inference LLM call into the caller's token budget via
      // onTokenUsage. Round 0 signals "pre-build inference"; the
      // indexer's ledger sums inputTokens + outputTokens uniformly so
      // this keeps billing consistent with a normal round. Errors
      // propagate unchanged — the indexer's TokenLedger throws its
      // own error class and callers `instanceof`-check against it.
      if (inferenceResult.tokenUsage && hooks?.onTokenUsage) {
        await hooks.onTokenUsage({
          inputTokens: inferenceResult.tokenUsage.inputTokens,
          outputTokens: inferenceResult.tokenUsage.outputTokens,
          cacheCreationTokens: inferenceResult.tokenUsage.cacheCreationTokens,
          cacheReadTokens: inferenceResult.tokenUsage.cacheReadTokens,
          round: 0,
          cumulativeTokens: inferenceResult.tokenUsage.inputTokens + inferenceResult.tokenUsage.outputTokens,
          cumulativeCacheCreationTokens: inferenceResult.tokenUsage.cacheCreationTokens,
          cumulativeCacheReadTokens: inferenceResult.tokenUsage.cacheReadTokens,
          cumulativeCostUsd: inferenceResult.tokenUsage.costUsd,
          model: inferenceResult.tokenUsage.model
        });
      }

      if (hooks?.onLog) {
        try {
          hooks.onLog({
            type: 'info',
            label: 'token-type inferred',
            data: {
              inferred: inferenceResult.tokenType,
              source: inferenceResult.source,
              confidence: inferenceResult.confidence,
              reasoning: inferenceResult.reasoning
            }
          });
        } catch {
          // Observability hook — never let it break the build.
        }
      }
    }

    // Assemble prompt — honor `systemPrompt` full replace and `systemPromptAppend`
    const promptAssemblyStartMs = Date.now();
    const promptParts = await assemblePromptParts(
      {
        prompt,
        creatorAddress,
        selectedSkills: finalSkills,
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
    logPhase('prompt_assembly_complete', promptAssemblyStartMs);

    // --- onCompletion always-fires accumulator ---
    // Previously onCompletion was called only on success. The hook's
    // documented contract is observability-only + fire-and-forget —
    // callers doing cleanup (flush logs, record final state) need it
    // on failures too. We maintain a mutable accumulator and fire the
    // hook in the finally block below with whatever state was reached
    // before the throw.
    let accRounds = 0;
    let accFixRounds = 0;
    let accTotalTokens = 0;
    let accTotalCostUsd = 0;
    let accCacheCreationTokens = 0;
    let accCacheReadTokens = 0;
    let accMessages: any[] = [];
    let accToolCalls: any[] = [];
    let onCompletionFired = false;
    const fireOnCompletion = () => {
      if (onCompletionFired) return;
      onCompletionFired = true;
      if (!hooks.onCompletion) return;
      try {
        const r = hooks.onCompletion({
          systemPrompt: promptParts.systemPrompt,
          userMessage: promptParts.userMessage,
          messages: accMessages,
          toolCalls: accToolCalls,
          rounds: accRounds,
          fixRounds: accFixRounds,
          tokensUsed: accTotalTokens,
          cacheCreationTokens: accCacheCreationTokens,
          cacheReadTokens: accCacheReadTokens,
          costUsd: accTotalCostUsd,
          durationMs: Date.now() - buildStartMs,
          model: this.model.id,
          systemPromptHash
        });
        if (r && typeof (r as any).catch === 'function') (r as any).catch(() => {});
      } catch {
        // Swallow — observability hooks must not turn into build errors.
      }
    };

    try {
    // --- Run main agent loop ---
    const mainLoopStartMs = Date.now();
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
    logPhase('main_loop_complete', mainLoopStartMs, { rounds: loopResult.rounds, tokens: loopResult.totalTokens });

    let rounds = loopResult.rounds;
    let fixRounds = 0;
    let totalTokens = loopResult.totalTokens;
    let totalCostUsd = loopResult.totalCostUsd;
    let cacheCreationTokens = loopResult.cacheCreationTokens;
    let cacheReadTokens = loopResult.cacheReadTokens;

    // Sync accumulator so an onCompletion in the finally has current state.
    accRounds = rounds;
    accTotalTokens = totalTokens;
    accTotalCostUsd = totalCostUsd;
    accCacheCreationTokens = cacheCreationTokens;
    accCacheReadTokens = cacheReadTokens;
    accMessages = loopResult.messages;
    accToolCalls = loopResult.toolCalls;

    // --- Extract current transaction from the SDK session ---
    // Single call — the handler's result may wrap the tx (`{ transaction }`)
    // or return it directly; handle both without invoking twice.
    const txResponse: any = await handleGetTransaction({ sessionId } as any);
    let transaction = txResponse?.transaction ?? txResponse;
    // Sanity: if get_transaction gave us nothing (agent returned before
    // any session-mutating tool ran, or the handler failed silently),
    // fall back to a minimal shell rather than letting `undefined`
    // cascade through validation + downstream sanity checks.
    if (!transaction || typeof transaction !== 'object') {
      transaction = { messages: [] };
    }

    // --- Validation gate (unless off) ---
    const strictness: ValidationStrictness = this.options.validation ?? DEFAULTS.validation;
    let gate: ValidationGateResult | null = null;

    if (strictness !== 'off') {
      const validationGateStartMs = Date.now();
      gate = await runValidationGate({
        transaction,
        creatorAddress,
        abortSignal: signal,
        simulate: this.options.simulate,
        // Forward the gate's info/validation log entries to the
        // agent's onLog hook so consumers (indexer dev-replay) see
        // pass/fail + per-source error counts.
        onLog: hooks.onLog as any,
        onChainSnapshot: options?.existingCollectionId && this.options.onChainSnapshotFetcher
          ? await this.options.onChainSnapshotFetcher(options.existingCollectionId).catch(() => null)
          : undefined
      });
      logPhase('validation_gate_complete', validationGateStartMs, { valid: gate.valid, errorCount: gate.hardErrors.length });

      // --- Validation fix loop ---
      const fixLoopMax = this.options.fixLoopMaxRounds ?? DEFAULTS.fixLoopMaxRounds;
      const fixLoopStartMs = Date.now();
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

        // Keep accumulator aligned after each fix round so
        // onCompletion in the outer finally sees the latest state
        // even if the next iteration throws.
        accRounds = rounds;
        accFixRounds = fixRounds;
        accTotalTokens = totalTokens;
        accTotalCostUsd = totalCostUsd;
        accCacheCreationTokens = cacheCreationTokens;
        accCacheReadTokens = cacheReadTokens;
        accMessages = loopResult.messages;
        accToolCalls = [...accToolCalls, ...loopResult.toolCalls];

        const freshTxResp = await handleGetTransaction({ sessionId } as any);
        transaction = (freshTxResp as any)?.transaction ?? freshTxResp;

        gate = await runValidationGate({
          transaction,
          creatorAddress,
          abortSignal: signal,
          simulate: this.options.simulate,
          onLog: hooks.onLog as any
        });
      }
      // Only log fix-loop duration if we actually entered it.
      if (fixRounds > 0) {
        logPhase('fix_loop_complete', fixLoopStartMs, { fixRounds, finalValid: gate?.valid === true });
      }

      if (!gate.valid && strictness === 'strict') {
        const errors = structureErrors(gate);
        throw new ValidationFailedError(errors, transaction, [...gate.advisoryNotes]);
      }
    }

    // --- Persist session for refinement ---
    // Snapshot review flags BEFORE the drain below so future refinements
    // inherit them. This persists the union of (carried-forward + newly-added)
    // for this build — which is what we want the next refinement to see.
    const persistedReviewFlags = getReviewFlags(sessionId);
    try {
      await this.sessionStore.set(
        sessionId,
        JSON.stringify({
          messages: loopResult.messages,
          transaction,
          tokensUsed: totalTokens,
          reviewFlags: persistedReviewFlags
        }),
        { ttlSeconds: this.options.sessionTtlSeconds ?? DEFAULTS.sessionTtlSeconds }
      );
    } catch {
      // non-fatal
    }

    const buildDurationMs = Date.now() - buildStartMs;
    // Drain any review flags the agent self-surfaced via flag_review_item
    // during the build. Separate from the post-run LLM auditor (which is
    // gated by llmAuditorEnabled); these always surface regardless.
    const reviewFlags = drainReviewFlags(sessionId);
    logPhase('build_complete', buildStartMs, {
      valid: gate?.valid ?? true,
      rounds,
      fixRounds,
      tokens: totalTokens,
      reviewFlags: reviewFlags.length
    });

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
      durationMs: buildDurationMs,
      model: this.model.id,
      systemPromptHash
    };

    // Sync final accumulator state before firing onCompletion so both
    // the success path here and the finally-block path see the same
    // numbers.
    accRounds = rounds;
    accFixRounds = fixRounds;
    accTotalTokens = totalTokens;
    accTotalCostUsd = totalCostUsd;
    accCacheCreationTokens = cacheCreationTokens;
    accCacheReadTokens = cacheReadTokens;
    accMessages = loopResult.messages;
    // Fire completion hook on the success path. The outer finally
    // below ALSO calls fireOnCompletion() — it's idempotent, so if
    // we throw between here and the finally the hook still fires
    // exactly once.
    fireOnCompletion();

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
      designDecisions: gate?.designDecisions ?? null,
      tokensUsed: totalTokens,
      costUsd: totalCostUsd,
      rounds,
      fixRounds,
      durationMs: buildDurationMs,
      reviewFlags,
      trace,
      inferredTokenType,
      inferredTokenTypeSource,
      inferredTokenTypeReasoning,
      toString() {
        const msgCount = Array.isArray(this.transaction?.messages) ? this.transaction.messages.length : 0;
        const validityStr = this.valid ? 'valid' : `${this.errors.length} error${this.errors.length === 1 ? '' : 's'}`;
        const costStr = this.costUsd.toFixed(4);
        const cacheStr = this.trace.cacheReadTokens > 0
          ? `, cache ${this.trace.cacheReadTokens.toLocaleString()} read / ${this.trace.cacheCreationTokens.toLocaleString()} write`
          : '';
        return `BitBadgesBuilderAgent build: ${msgCount} message(s), ${validityStr}, ${this.tokensUsed.toLocaleString()} tokens${cacheStr}, $${costStr}, ${this.rounds} round(s)${this.fixRounds ? ` + ${this.fixRounds} fix` : ''}`;
      }
    };

      return result;
    } finally {
      // Always fire onCompletion, even on throw. Observability hooks
      // doing cleanup (flush logs, record final state) would otherwise
      // silently drop failed-build traces. Idempotent — if the success
      // path already fired it, this is a no-op.
      fireOnCompletion();
    }
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
   *
   * When `existingCollectionId` is supplied AND the agent was configured
   * with an `onChainSnapshotFetcher`, the validation gate pulls the live
   * on-chain snapshot for diff-based review — matching the update-mode
   * behavior inside `build()`.
   */
  async validate(
    transaction: any,
    options?: { creatorAddress?: string; existingCollectionId?: string; abortSignal?: AbortSignal }
  ): Promise<{
    valid: boolean;
    errors: StructuredError[];
    warnings: Warning[];
    validation: any;
    simulation: any | null;
    audit: any | null;
    designDecisions: DesignDecisionsResult | null;
  }> {
    const onChainSnapshot =
      options?.existingCollectionId && this.options.onChainSnapshotFetcher
        ? await this.options.onChainSnapshotFetcher(options.existingCollectionId).catch(() => null)
        : undefined;
    const gate = await runValidationGate({
      transaction,
      creatorAddress: options?.creatorAddress ?? this.options.defaultCreatorAddress ?? '',
      simulate: this.options.simulate,
      abortSignal: options?.abortSignal,
      onChainSnapshot
    });
    return {
      valid: gate.valid,
      errors: structureErrors(gate),
      warnings: gate.advisoryNotes.map((n) => ({ category: 'advisory', message: n })),
      validation: gate.validation,
      simulation: gate.simulation,
      audit: gate.audit,
      designDecisions: gate.designDecisions
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
