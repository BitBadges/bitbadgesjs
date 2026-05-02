/**
 * LLM provider abstraction for BitBadgesBuilderAgent.
 *
 * The agent's optional self-driving loop is model-agnostic — Anthropic
 * was the first provider, OpenAI is the second, and Gemini / xAI /
 * Ollama / etc. drop in by adding a new file under this directory.
 *
 * Internal canonical message shape: Anthropic-style content blocks
 * (`text`, `tool_use`, `tool_result`). Anthropic providers pass these
 * through; OpenAI / others translate at the boundary in `chat()`.
 * This keeps the existing loop + token-type inference code paths
 * minimally affected.
 */

/** Per-provider construction config — passed once via `init`. */
export interface LLMProviderConfig {
  apiKey?: string;
  /** OAuth bearer token (Anthropic-only today; ignored by other providers). */
  authToken?: string;
  /** Custom base URL for proxies / gateways. */
  baseURL?: string;
  /** Pre-built SDK client — bypasses internal SDK loading + credential checks. */
  client?: any;
  /** Provider-specific options pass-through. */
  options?: Record<string, unknown>;
}

/** Tool registry input — provider-neutral schema. */
export interface ProviderToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
  /**
   * Optional Anthropic prompt-cache marker — the loop sets this on the
   * last tool to mark a cache boundary. Other providers ignore.
   */
  cacheControl?: { type: 'ephemeral' };
}

/**
 * Internal canonical message shape — mirrors Anthropic's native
 * content-block format. Providers translate to their own wire shape.
 */
export interface ProviderMessage {
  role: 'user' | 'assistant';
  content: any; // string OR array of content blocks (text / tool_use / tool_result)
}

/** Unified system block — supports cache marker like Anthropic's. */
export interface ProviderSystemBlock {
  type: 'text';
  text: string;
  cacheControl?: { type: 'ephemeral' };
}

/** Provider-neutral chat-call args. */
export interface ProviderChatArgs {
  model: string;
  /** Either a flat string OR an array of system blocks (cache-marked). */
  system: string | ProviderSystemBlock[];
  messages: ProviderMessage[];
  /** Pre-translated by the provider's `toolsForRequest`. */
  tools?: unknown;
  maxTokens?: number;
  temperature?: number;
  /** Anthropic-style timeout passed to the SDK request. */
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

/** Provider-neutral tool-call shape. */
export interface ProviderToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** Provider-neutral usage shape — mirrors Anthropic field names internally. */
export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
}

/**
 * Provider-neutral chat response.
 *
 * `rawAssistantMessage` is the assistant message in the INTERNAL
 * canonical shape (Anthropic-style content blocks). The agent loop
 * pushes this directly into its messages array so subsequent rounds
 * carry the same shape across providers.
 */
export interface ProviderChatResponse {
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'other';
  /** Concatenated text blocks from the assistant turn (empty string when none). */
  text: string;
  /** Tool calls extracted from the assistant turn. */
  toolCalls: ProviderToolCall[];
  /** Token usage for this round. */
  usage: ProviderUsage;
  /**
   * Assistant message in canonical shape — what the loop appends to
   * its message history before issuing tool results. Always uses
   * Anthropic-style content blocks regardless of provider.
   */
  rawAssistantMessage: ProviderMessage;
}

/** The provider contract. */
export interface LLMProvider {
  /** Stable identifier, e.g. 'anthropic' / 'openai'. */
  readonly name: string;

  /** One-time client init from config + env. Throws on missing creds. */
  init(config: LLMProviderConfig): Promise<void> | void;

  /** Translate the agent's tool registry into the provider's tool schema. */
  toolsForRequest(tools: ProviderToolDefinition[]): unknown;

  /** Make one chat call. */
  chat(args: ProviderChatArgs): Promise<ProviderChatResponse>;

  /** Default model id when caller didn't override. */
  defaultModel(): string;

  /**
   * Provider-specific raw client, exposed for legacy code paths
   * (Anthropic-only callers like the indexer's healthCheck probe
   * sometimes still want it). May be null when init didn't run.
   */
  readonly client: any;
}
