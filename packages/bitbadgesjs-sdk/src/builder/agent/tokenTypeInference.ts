/**
 * Smart token-type inference.
 *
 * Given a natural-language build prompt plus whatever prior context is
 * available (existing transaction in update mode, original intent +
 * recent refinement turns in refine mode), picks at most one
 * token-type skill id. Returns `null` whenever the answer isn't a
 * high-confidence match — a freestyle build with no token-type skill
 * is an explicitly valid outcome.
 *
 * Two signals, in order:
 *   1. Deterministic standards → skill mapping. If the existing
 *      transaction (session or on-chain snapshot) already declares a
 *      `standards` array that matches a known token type, we accept
 *      that immediately — no LLM call needed. This is the dominant
 *      signal for update/refine flows where the user prompt is often
 *      just "fix this" or "raise the supply".
 *   2. A small-model classification call (Anthropic Haiku or
 *      OpenAI gpt-4o-mini) against the enriched prompt (original
 *      intent + recent refinement turns + current prompt + standards
 *      hint when available). Strict JSON output contract; only
 *      `confidence: "high"` results are accepted. The provider's
 *      `classify()` method handles native schema enforcement on
 *      OpenAI; Anthropic relies on the tuned system-prompt contract.
 */

import { getAllSkillInstructions, type SkillInstruction } from '../resources/skillInstructions.js';
import type { AgentHooks, BuildMode } from './types.js';
import type { LLMProvider, ProviderJsonSchema } from './providers/types.js';

export interface TokenTypeInferenceInput {
  /** Current user prompt (create) or refinement turn (refine) or update instruction (update). */
  prompt: string;
  /** Build mode — affects how prior context is folded into the inference prompt. */
  mode?: BuildMode;
  /** Restrict inference to this subset of token-type skill ids (useful when the agent has a `skills` whitelist). */
  allowedTokenTypeIds?: string[];
  /** The first-turn prompt for a refinement chain. Surfaces the real intent when the current turn is vague. */
  originalPrompt?: string;
  /** Prior refinement turns (most recent last). Capped to the last 3 before being included in the inference prompt. */
  priorRefinePrompts?: string[];
  /** The existing collection transaction (session snapshot for refine, on-chain snapshot for update). */
  existingTransaction?: any;
  /** Explicit standards list override — if set, takes precedence over `existingTransaction.standards`. */
  existingStandards?: string[];

  /** LLM provider — used to dispatch the classification call. Each provider picks its own small/fast classify model. */
  provider: LLMProvider;
  /** Override the provider's default classify model (e.g. `'gpt-4o-mini'`, `'claude-haiku-4-5-20251001'`). */
  modelId?: string;
  /** Per-inference timeout (ms). Default: 30_000. */
  timeoutMs?: number;
  abortSignal?: AbortSignal;
  debug?: boolean;
  hooks?: AgentHooks;
}

export interface TokenTypeInferenceResult {
  /** Picked skill id, or null when confidence was not `high` / no clear match / inference failed. */
  tokenType: string | null;
  /** `'high'` → accepted. `'low'` / `null` → we force `tokenType` to null. */
  confidence: 'high' | 'low' | null;
  /** Which signal produced the pick (useful for UI and debug). */
  source: 'standards' | 'llm' | null;
  /** Short reasoning string, useful for UI surfacing. Empty when null. */
  reasoning?: string;
  /** Token usage from the LLM call — absent when inference came from the standards fast-path or failed. */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    costUsd: number;
    model: string;
  };
}

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_PRIOR_REFINE_PROMPTS = 3;

/**
 * Standard-name → token-type skill id. Derived from each skill's
 * "Required standards" stanza — kept as a typed constant so callers
 * (and tests) can audit the full mapping without parsing summaries at
 * runtime.
 */
export const STANDARD_TO_TOKEN_TYPE: ReadonlyArray<{ standard: string; skillId: string }> = [
  { standard: 'Smart Token', skillId: 'smart-token' },
  { standard: 'Fungible Token', skillId: 'fungible-token' },
  { standard: 'NFT Collection', skillId: 'nft-collection' },
  { standard: 'Subscription', skillId: 'subscription' },
  { standard: 'Custom 2FA', skillId: 'custom-2fa' },
  { standard: 'Payment Protocol', skillId: 'payment-protocol' },
  { standard: 'Credit Token', skillId: 'credit-token' },
  { standard: 'Address List', skillId: 'address-list' },
  { standard: 'Quest', skillId: 'quest' },
  { standard: 'Bounty', skillId: 'bounty' },
  { standard: 'PaymentRequest', skillId: 'payment-request' },
  { standard: 'Crowdfund', skillId: 'crowdfund' },
  { standard: 'Auction', skillId: 'auction' },
  { standard: 'Products', skillId: 'product-catalog' },
  { standard: 'Prediction Market', skillId: 'prediction-market' },
  { standard: 'Liquidity Pools', skillId: 'liquidity-pools' }
];

/**
 * Returns every token-type skill id currently known to the SDK.
 * Drives the frontend's marketplace and the inference prompt catalog.
 */
export function getTokenTypeSkillIds(): string[] {
  return getAllSkillInstructions()
    .filter((s) => s.category === 'token-type')
    .map((s) => s.id);
}

/** Returns the full `SkillInstruction` records for every token-type skill. */
export function getTokenTypeSkills(): SkillInstruction[] {
  return getAllSkillInstructions().filter((s) => s.category === 'token-type');
}

/**
 * Normalize the `standards` field off any existing-transaction shape
 * we might be handed. Tolerates undefined, arrays of strings, and
 * arrays of objects with a `name` — all shapes that have appeared in
 * the wild.
 */
export function extractStandards(transaction: any): string[] {
  if (!transaction) return [];
  const raw = transaction.standards ?? transaction.collection?.standards ?? transaction?.collections?.[0]?.standards;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string' && entry.trim()) out.push(entry.trim());
    else if (entry && typeof entry.name === 'string' && entry.name.trim()) out.push(entry.name.trim());
  }
  return out;
}

/**
 * Deterministic fast-path: map declared `standards` to a token-type
 * skill id. Returns null when nothing matches — we'd rather fall
 * through to the LLM than guess.
 */
export function inferFromStandards(standards: string[], allowedIds: Set<string>): string | null {
  for (const s of standards) {
    const match = STANDARD_TO_TOKEN_TYPE.find((m) => m.standard.toLowerCase() === s.toLowerCase());
    if (match && allowedIds.has(match.skillId)) return match.skillId;
  }
  return null;
}

/**
 * Build the system prompt that lists every token-type skill with a
 * one-line description and the strict JSON output contract.
 */
export function buildInferenceSystemPrompt(catalog: SkillInstruction[]): string {
  const lines = catalog.map((s) => `- \`${s.id}\` — ${s.name}: ${s.description}`).join('\n');
  return `You classify BitBadges token build requests into exactly one token-type skill — or none at all.

Available token types (pick ZERO or ONE):

${lines}

Output contract — respond with a single JSON object, no surrounding prose, no markdown fences:

{
  "id": "<one of the ids above, or null>",
  "confidence": "high" | "low",
  "reasoning": "<one short sentence>"
}

Rules:
- Only return a non-null \`id\` when the request maps unambiguously to that skill.
- If the request is vague, generic, covers multiple token types, or describes something unusual, return \`id: null\`. Freestyle is a valid outcome.
- \`confidence\` must be \`"high"\` to be acted on — anything else is treated as no match.
- When the context mentions existing \`standards: [...]\`, that is authoritative — match it directly.
- When the user prompt is a refinement like "fix this" or "raise the supply", rely on the original intent and prior turns rather than the short current turn.
- Never invent skill ids. Never return more than one.
- Keep \`reasoning\` under 20 words.`;
}

/**
 * Assemble the user-message body. For `refine` mode we prepend the
 * original intent + up to the last three refinement turns so a short
 * "fix this" doesn't strip the inference of its context. For `update`
 * mode we surface declared standards — the single strongest signal.
 */
export function buildInferenceUserPrompt(input: {
  prompt: string;
  mode?: BuildMode;
  originalPrompt?: string;
  priorRefinePrompts?: string[];
  existingStandards?: string[];
}): string {
  const parts: string[] = [];
  const mode = input.mode ?? 'create';

  if (input.existingStandards && input.existingStandards.length > 0) {
    parts.push(`Existing collection standards: ${JSON.stringify(input.existingStandards)}`);
  }

  if (mode === 'refine' || mode === 'update') {
    if (input.originalPrompt && input.originalPrompt.trim() && input.originalPrompt.trim() !== input.prompt.trim()) {
      parts.push(`Original build intent:\n${input.originalPrompt.trim()}`);
    }
    if (input.priorRefinePrompts && input.priorRefinePrompts.length > 0) {
      const tail = input.priorRefinePrompts
        .filter((p): p is string => typeof p === 'string' && !!p.trim())
        .slice(-MAX_PRIOR_REFINE_PROMPTS);
      if (tail.length > 0) {
        parts.push(`Prior ${mode === 'refine' ? 'refinement' : 'update'} turns (oldest → newest):\n${tail.map((p) => `- ${p.trim()}`).join('\n')}`);
      }
    }
    const currentLabel = mode === 'refine' ? 'Current refinement turn' : 'Current update instruction';
    parts.push(`${currentLabel}:\n${input.prompt.trim()}`);
  } else {
    parts.push(`User build request:\n${input.prompt.trim()}`);
  }

  return parts.join('\n\n');
}

/**
 * Validate a parsed classify response against the allow-list. Both
 * providers return a parsed object via `provider.classify()` — this
 * is the post-parse gate that enforces the SDK's `confidence: high`
 * contract independent of provider.
 */
export function validateInferenceObject(
  obj: unknown,
  allowedIds: Set<string>
): { tokenType: string | null; confidence: 'high' | 'low' | null; reasoning?: string } {
  if (!obj || typeof obj !== 'object') return { tokenType: null, confidence: null };
  const o = obj as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id : null;
  const confidence =
    o.confidence === 'high' || o.confidence === 'low' ? (o.confidence as 'high' | 'low') : null;
  const reasoning = typeof o.reasoning === 'string' ? (o.reasoning as string).slice(0, 240) : undefined;
  if (!id || !allowedIds.has(id) || confidence !== 'high') {
    return { tokenType: null, confidence, reasoning };
  }
  return { tokenType: id, confidence, reasoning };
}

/**
 * The strict JSON schema describing the classifier's expected output.
 * Used natively by OpenAI's structured-output mode and documented in
 * prose in the system prompt for Anthropic.
 */
export function buildInferenceSchema(allowedIds: string[]): ProviderJsonSchema {
  return {
    type: 'object',
    properties: {
      id: {
        // OpenAI strict mode supports `["string", "null"]` to express nullable.
        // Anthropic ignores schema entirely; the prose contract enforces it.
        type: ['string', 'null'],
        enum: [...allowedIds, null],
        description: 'One of the allowed token-type skill ids, or null if no high-confidence match.'
      },
      confidence: {
        type: 'string',
        enum: ['high', 'low'],
        description: 'Pick `high` only when the request maps unambiguously to the chosen id; `low` otherwise.'
      },
      reasoning: {
        type: 'string',
        description: 'One short sentence explaining the pick. Under 20 words.'
      }
    },
    required: ['id', 'confidence', 'reasoning'],
    additionalProperties: false
  };
}

/**
 * Run token-type inference. Never throws — returns a null pick on any
 * failure so the caller can proceed with a freestyle build.
 */
export async function inferTokenTypeFromPrompt(
  input: TokenTypeInferenceInput
): Promise<TokenTypeInferenceResult> {
  const { prompt, provider, abortSignal, debug } = input;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return { tokenType: null, confidence: null, source: null };
  }

  const allSkills = getTokenTypeSkills();
  const catalog = input.allowedTokenTypeIds?.length
    ? allSkills.filter((s) => input.allowedTokenTypeIds!.includes(s.id))
    : allSkills;
  if (catalog.length === 0) {
    return { tokenType: null, confidence: null, source: null };
  }
  const allowedIds = new Set(catalog.map((s) => s.id));

  // --- Signal 1: deterministic standards → skill ---------------------
  const standards =
    input.existingStandards && input.existingStandards.length > 0
      ? input.existingStandards
      : extractStandards(input.existingTransaction);

  const fromStandards = inferFromStandards(standards, allowedIds);
  if (fromStandards) {
    if (debug) {
      console.error(
        `[bitbadges-builder-agent] tokenTypeInference (standards fast-path) pick=${fromStandards} standards=${JSON.stringify(standards)}`
      );
    }
    return {
      tokenType: fromStandards,
      confidence: 'high',
      source: 'standards',
      reasoning: `Existing collection declares standards ${JSON.stringify(standards)}.`
    };
  }

  // --- Signal 2: provider-dispatched classification ------------------
  if (!provider) {
    return { tokenType: null, confidence: null, source: null };
  }

  const modelId = input.modelId ?? provider.defaultClassifyModel();
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const systemPrompt = buildInferenceSystemPrompt(catalog);
  const userPrompt = buildInferenceUserPrompt({
    prompt,
    mode: input.mode,
    originalPrompt: input.originalPrompt,
    priorRefinePrompts: input.priorRefinePrompts,
    existingStandards: standards
  });
  const schema = buildInferenceSchema([...allowedIds]);

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  if (abortSignal) {
    if (abortSignal.aborted) controller.abort();
    else abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await provider.classify({
      model: modelId,
      systemPrompt,
      userPrompt,
      schema,
      schemaName: 'bitbadges_token_type_inference',
      maxTokens: 200,
      temperature: 0,
      timeoutMs,
      abortSignal: controller.signal,
      systemCacheControl: { type: 'ephemeral' }
    });

    const validated = validateInferenceObject(response.parsed, allowedIds);

    const result: TokenTypeInferenceResult = {
      tokenType: validated.tokenType,
      confidence: validated.confidence,
      source: validated.tokenType ? 'llm' : null,
      reasoning: validated.reasoning,
      tokenUsage: {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cacheCreationTokens: response.usage.cacheCreationTokens ?? 0,
        cacheReadTokens: response.usage.cacheReadTokens ?? 0,
        costUsd: response.costUsd,
        model: response.model
      }
    };

    if (debug) {
      console.error(
        `[bitbadges-builder-agent] tokenTypeInference provider=${provider.name} model=${response.model} ` +
          `pick=${result.tokenType ?? 'null'} confidence=${result.confidence ?? 'null'} ` +
          `tokens_in=${response.usage.inputTokens} out=${response.usage.outputTokens}`
      );
    }

    return result;
  } catch (err) {
    if (debug) {
      console.warn('[bitbadges-builder-agent] tokenTypeInference failed:', err);
    }
    return { tokenType: null, confidence: null, source: null };
  } finally {
    clearTimeout(timeoutHandle);
  }
}
