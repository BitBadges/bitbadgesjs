/**
 * Shared types for BitBadgesBuilderAgent.
 *
 * Public types are re-exported from the package entry (`bitbadges/builder/agent`).
 * Internal-only types stay here and are imported by filename within the agent/ dir.
 */

import type { KVStore } from './sessionStore.js';

/** High-level build mode passed to the agent. */
export type BuildMode = 'create' | 'update' | 'refine';

/** Validation strictness setting. */
export type ValidationStrictness = 'strict' | 'lenient' | 'off';

/** Friendly model name (alias) — resolved to the actual Anthropic model ID internally. */
export type ModelName = 'haiku' | 'sonnet' | 'opus';

/** Cost/quality metadata for each supported model. */
export interface ModelInfo {
  /** Anthropic model ID (e.g. "claude-opus-4-7"). */
  id: string;
  /** USD per 1M input tokens. */
  inputPerMTok: number;
  /** USD per 1M output tokens. */
  outputPerMTok: number;
}

/** Structured token usage event from the agent loop. */
export interface TokenUsage {
  /** Input tokens consumed this round (excludes cached tokens). */
  inputTokens: number;
  /** Output tokens generated this round. */
  outputTokens: number;
  /**
   * Tokens written to Anthropic's prompt cache this round (cache miss
   * on the stable prefix — cost ~1.25x regular input). Zero on cache
   * hits or when caching is disabled.
   */
  cacheCreationTokens: number;
  /**
   * Tokens read from cache this round (cost ~0.1x regular input).
   * This is where the cost savings come from; a healthy cache-hit
   * setup has cacheReadTokens >> inputTokens on steady-state traffic.
   */
  cacheReadTokens: number;
  /** Which round this event fired on (0-indexed). */
  round: number;
  /** Cumulative input+output tokens for this build (excludes cache counters). */
  cumulativeTokens: number;
  /** Cumulative cache-creation tokens across rounds. */
  cumulativeCacheCreationTokens: number;
  /** Cumulative cache-read tokens across rounds. */
  cumulativeCacheReadTokens: number;
  /** Cumulative USD cost for this build (includes cache multipliers). */
  cumulativeCostUsd: number;
  /** Model used. */
  model: string;
}

/** A single tool call + result. */
export interface ToolCallEvent {
  /** Tool name (e.g. "add_approval"). */
  name: string;
  /** Arguments passed to the tool. */
  input: unknown;
  /** Parsed output if JSON, otherwise the raw string. */
  output: unknown;
  /** Execution time in ms. */
  durationMs: number;
  /** Round (0-indexed) this tool was called in. */
  round: number;
}

/** Warning surfaced from the agent (non-fatal). */
export interface Warning {
  /** Category (e.g. "simulation", "advisory", "prompt"). */
  category: string;
  /** Human-readable message. */
  message: string;
}

/** A structured validation / simulation / review error. */
export interface StructuredError {
  /** Error code — one of 'validation' | 'standards' | 'simulation' | 'review'. */
  code: string;
  /** Human-readable message. */
  message: string;
  /** Optional field path (e.g. "messages[0].value.approvals[2].approvalId"). */
  path?: string;
  /** Optional remediation hint from the SDK's error pattern registry. */
  fixHint?: string;
}

/** Prompt-assembly context — passed to `buildSystemPrompt` and `assemblePromptParts`. */
export interface PromptContext {
  creatorAddress: string;
  prompt: string;
  selectedSkills: string[];
  promptSkillIds: string[];
  contextHelpers?: any;
  metadata?: any;
  /** Names of uploaded image placeholders (e.g. ["IMAGE_1", "IMAGE_2"]). */
  availableImagePlaceholders?: string[];
  isRefinement: boolean;
  isUpdate: boolean;
  existingCollectionId?: string;
  /** Session ID for refinement messages. */
  sessionId?: string;
  /** Original prompt from the first build (for refinement context). */
  originalPrompt?: string;
  /** Chronological list of prior refinement prompts (excludes current + original). */
  priorRefinePrompts?: string[];
  /** Condensed +/- diff log across transaction versions. */
  diffLog?: string;
}

export interface PromptParts {
  systemPrompt: string;
  /** Legacy single-string user message (stable + dynamic concatenated). */
  userMessage: string;
  /**
   * Structured user-message content blocks. The first block (when
   * present and non-empty) is marked `cache_control: ephemeral` —
   * this is the stable skills prefix shared across requests with the
   * same canonical skill set. Dynamic per-request content (request
   * header, metadata, refinement history, prompt) sits in the
   * trailing block with no cache mark.
   *
   * Consumers that need raw text should read `userMessage`; the agent
   * loop reads `userContent` to get the cache boundaries.
   */
  userContent: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>;
  communitySkillsIncluded: string[];
}

/**
 * Pluggable community-skill fetcher. The SDK has no DB dependency —
 * callers (e.g. the indexer) wire a Mongo/Redis/file-backed fetcher here.
 * Returning an empty array is fine and fully supported (zero-config mode).
 */
export type CommunitySkillsFetcher = (
  promptSkillIds: string[],
  creatorAddress: string
) => Promise<Array<{ name: string; promptText: string }>>;

/**
 * Pluggable on-chain snapshot resolver for update flows.
 * Returns the current on-chain collection doc (or null) for diff-based review.
 */
export type OnChainSnapshotFetcher = (
  collectionId: string
) => Promise<any | null>;

/**
 * Pluggable transaction simulator.
 * Default: no-op (returns `{ valid: true }`), so zero-config consumers
 * skip simulation. The indexer injects its LCD-based simulator to get the
 * full quality gate.
 */
export type TransactionSimulator = (
  transaction: any,
  options: { creatorAddress: string; abortSignal?: AbortSignal }
) => Promise<{ valid: boolean; gasUsed?: string; error?: string }>;

/** Per-build context helpers (address lists, referenced collections, etc.). */
export interface ContextHelpers {
  referencedCollectionIds?: string[];
  referencedStoreIds?: string[];
  labeledAddressLists?: Array<{ label: string; addresses: string[] }>;
  labeledCollections?: Array<{ label: string; id?: string }>;
  labeledStores?: Array<{ label: string; id?: string }>;
  labeledClaims?: Array<{ label: string; mode: 'text' | 'builder'; description?: string; plugins?: any[] }>;
}

/**
 * Custom tool consumers can register via `tools.add`.
 * `definition` is the Anthropic Tool schema; `execute` receives
 * the parsed args and returns any JSON-serializable result.
 */
export interface CustomTool {
  definition: {
    name: string;
    description: string;
    input_schema: {
      type: 'object';
      properties?: Record<string, unknown>;
      required?: string[];
    };
  };
  execute: (args: any, ctx: ToolExecutionContext) => Promise<any> | any;
}

export interface ToolExecutionContext {
  sessionId: string;
  callerAddress: string;
}

/**
 * Generic mid-build log entry — catch-all for observability signals
 * that don't fit the more specific hooks. Emitted for round
 * boundaries, AI text output, validation gate pass/fail, mid-build
 * errors, and other diagnostic info. Indexers typically wire this
 * to their session-log / dev-replay / audit pipelines.
 */
export interface AgentLogEntry {
  type: 'info' | 'ai_text' | 'validation' | 'error';
  label: string;
  data?: unknown;
}

/**
 * Hook callbacks.
 *
 * `onTokenUsage` is **load-bearing**: it is awaited, and any thrown
 * error or rejected Promise propagates out of `agent.build()`. This
 * is how consumers enforce per-build quotas — throw from
 * `onTokenUsage` when the caller's budget is exhausted and the loop
 * aborts cleanly.
 *
 * `onCompletion` is awaited (in the success path) and fire-and-forget
 * (in the error path, via the outer finally). It always fires exactly
 * once per build.
 *
 * The rest (`onToolCall`, `onStatusUpdate`, `onLog`) are
 * observability-only — fire-and-forget, rejections swallowed so a
 * misbehaving logger can't hang a build.
 */
export interface AgentHooks {
  onTokenUsage?: (usage: TokenUsage) => void | Promise<void>;
  onToolCall?: (event: ToolCallEvent) => void | Promise<void>;
  onStatusUpdate?: (status: string) => void | Promise<void>;
  onCompletion?: (trace: BuildTrace) => void | Promise<void>;
  /**
   * Generic log sink for mid-build diagnostic events. Fired for
   * round starts, AI text output, validation gate results, and
   * intermediate errors. Consumers typically pipe this into their
   * session-log / dev-replay tooling.
   */
  onLog?: (entry: AgentLogEntry) => void | Promise<void>;
}

/** Full trace of a single build — passed to `onCompletion` and returned in `BuildResult.trace`. */
export interface BuildTrace {
  systemPrompt: string;
  userMessage: string;
  messages: any[];
  toolCalls: ToolCallEvent[];
  rounds: number;
  fixRounds: number;
  /**
   * Cumulative input+output tokens for the build. For cache breakdowns
   * see `cacheCreationTokens` / `cacheReadTokens`.
   */
  tokensUsed: number;
  /** Cumulative tokens written to Anthropic's prompt cache. */
  cacheCreationTokens: number;
  /** Cumulative tokens served from cache (cheap reads). */
  cacheReadTokens: number;
  costUsd: number;
  model: string;
  systemPromptHash: string;
}

/** Return value of `agent.build()`. Fully typed for IntelliSense. */
export interface BuildResult {
  /** True when validation passed (or strictness allowed partial results). */
  valid: boolean;
  /** The final composed transaction (parsed JSON object, not a string). */
  transaction: any;
  /** Structured errors, empty if valid. */
  errors: StructuredError[];
  /** Non-fatal warnings / advisory notes. */
  warnings: Warning[];
  /** Raw hard-error strings (kept for backwards compat with the indexer). */
  hardErrors: string[];
  /** Review/audit findings surfaced to the caller (design concerns, not blockers). */
  advisoryNotes: string[];
  /** Structural validation result from the SDK validator. */
  validation: any;
  /** Simulation result (null when simulator is not configured or skipped). */
  simulation: any | null;
  /** Audit shape with `findings` + `summary` + full `review`. */
  audit: any | null;
  /** Total tokens used across all rounds (input + output). */
  tokensUsed: number;
  /** USD cost across all rounds. */
  costUsd: number;
  /** Number of agent rounds executed. */
  rounds: number;
  /** Number of validation fix-loop rounds executed. */
  fixRounds: number;
  /** Full trace — messages, tool calls, etc. */
  trace: BuildTrace;
  /** Human-readable one-paragraph summary of what the build did. */
  toString(): string;
}

/** Options passed to `BitBadgesBuilderAgent` constructor. */
export interface BitBadgesBuilderAgentOptions {
  /** Anthropic API key — BYO. Falls back to ANTHROPIC_API_KEY env. */
  anthropicKey?: string;
  /** Anthropic OAuth bearer token — alternative to anthropicKey. Falls back to ANTHROPIC_AUTH_TOKEN / ANTHROPIC_OAUTH_TOKEN env. */
  anthropicAuthToken?: string;
  /** Optional pre-built Anthropic client (takes precedence over anthropicKey / anthropicAuthToken). */
  anthropicClient?: any;
  /** Optional custom Anthropic base URL (proxies, gateways, etc.). */
  anthropicBaseUrl?: string;

  /** BitBadges API key — used by query/search/simulate tools. Falls back to BITBADGES_API_KEY env. Optional — tools that need it fail clearly if missing. */
  bitbadgesApiKey?: string;
  /** BitBadges API URL override. Falls back to BITBADGES_API_URL env, then the production default. */
  bitbadgesApiUrl?: string;

  /** Friendly model name. Default: 'sonnet'. */
  model?: ModelName;
  /** Default build mode if not passed per-call. Default: 'create'. */
  defaultMode?: BuildMode;

  /** Validation strictness. Default: 'strict'. */
  validation?: ValidationStrictness;

  /** Max agent loop rounds. Default: 8. */
  maxRounds?: number;
  /** Max validation fix-loop rounds. Default: 3. */
  fixLoopMaxRounds?: number;
  /** Hard cap on tokens per build (aborts mid-loop). Default: 1_500_000. */
  maxTokensPerBuild?: number;
  /** Anthropic API timeout per request. Default: 120_000. */
  anthropicTimeoutMs?: number;

  /** Skill filter — narrows `SKILL_INSTRUCTIONS` to this subset if set. */
  skills?: string[];

  /** System prompt additions (APPENDED to the base prompt). */
  systemPromptAppend?: string;
  /** Full system prompt replacement. Advanced — disables QoL prompt hygiene. */
  systemPrompt?: string;

  /** Tool customization. */
  tools?: {
    /** Remove these builtin tools from the registry. */
    remove?: string[];
    /** Register custom tools on top of the builtins. */
    add?: CustomTool[];
  };

  /** Pluggable session store. Default: new MemoryStore(). */
  sessionStore?: KVStore;
  /**
   * TTL in seconds for persisted session snapshots (refinement replay).
   * Default: 7200 (2h). Raise for multi-day refinement flows; stores
   * that ignore TTL (e.g. a consumer Redis adapter with its own
   * eviction) may safely disregard this value.
   */
  sessionTtlSeconds?: number;

  /** Pluggable community-skills fetcher (indexer plugs in Mongo; default no-op). */
  communitySkillsFetcher?: CommunitySkillsFetcher;

  /** Pluggable on-chain snapshot resolver for update-mode diff review. */
  onChainSnapshotFetcher?: OnChainSnapshotFetcher;

  /** Pluggable transaction simulator. Default: no-op (returns valid:true). */
  simulate?: TransactionSimulator;

  /** Lifecycle hooks. */
  hooks?: AgentHooks;

  /** Log full prompt + responses to stderr. Default: false. */
  debug?: boolean;

  /** Default creator address (can be overridden per build). */
  defaultCreatorAddress?: string;
}

/** Options passed to `agent.build()`. Narrower than the constructor. */
export interface BuildOptions {
  creatorAddress?: string;
  sessionId?: string;
  mode?: BuildMode;
  selectedSkills?: string[];
  promptSkillIds?: string[];
  contextHelpers?: ContextHelpers;
  metadata?: any;
  availableImagePlaceholders?: string[];
  existingCollectionId?: string;
  originalPrompt?: string;
  priorRefinePrompts?: string[];
  diffLog?: string;
  abortSignal?: AbortSignal;
  /** Per-build hook overrides (merge on top of constructor hooks). */
  hooks?: AgentHooks;
}
