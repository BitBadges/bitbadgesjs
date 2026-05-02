/**
 * Anthropic provider — wraps `@anthropic-ai/sdk` behind the
 * `LLMProvider` interface. Internally uses the existing
 * `anthropicClient.ts` loader so peer-dep resolution and credential
 * handling stay identical to before the multi-provider refactor.
 */

import { getAnthropicClient } from '../anthropicClient.js';
import { AnthropicAuthError } from '../errors.js';
import type {
  LLMProvider,
  LLMProviderConfig,
  ProviderChatArgs,
  ProviderChatResponse,
  ProviderToolDefinition,
  ProviderMessage,
  ProviderToolCall
} from './types.js';

const DEFAULT_MODEL = 'claude-sonnet-4-6';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  client: any = null;

  async init(config: LLMProviderConfig): Promise<void> {
    if (this.client) return;
    this.client = await getAnthropicClient({
      client: config.client,
      apiKey: config.apiKey,
      authToken: config.authToken,
      baseURL: config.baseURL
    });
  }

  defaultModel(): string {
    return DEFAULT_MODEL;
  }

  /**
   * Anthropic tools shape: `{ name, description, input_schema, cache_control? }`.
   * Mirrors what `toolAdapter` already produces today.
   */
  toolsForRequest(tools: ProviderToolDefinition[]): unknown {
    return tools.map((t) => {
      const out: Record<string, unknown> = {
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema
      };
      if (t.cacheControl) out.cache_control = t.cacheControl;
      return out;
    });
  }

  async chat(args: ProviderChatArgs): Promise<ProviderChatResponse> {
    if (!this.client) {
      throw new Error('AnthropicProvider.chat called before init()');
    }

    // Anthropic system field accepts either a string or an array of
    // text blocks with optional cache markers — translate from our
    // unified shape.
    const system =
      typeof args.system === 'string'
        ? args.system
        : args.system.map((b) => {
            const out: Record<string, unknown> = { type: 'text', text: b.text };
            if (b.cacheControl) out.cache_control = b.cacheControl;
            return out;
          });

    const params: Record<string, unknown> = {
      model: args.model,
      max_tokens: args.maxTokens ?? 8192,
      system,
      messages: args.messages,
      stream: false
    };
    if (args.tools !== undefined) params.tools = args.tools;
    if (args.temperature !== undefined) params.temperature = args.temperature;

    const requestOpts: Record<string, unknown> = {};
    if (args.timeoutMs !== undefined) requestOpts.timeout = args.timeoutMs;
    if (args.abortSignal) requestOpts.signal = args.abortSignal;

    let response: any;
    try {
      response = await this.client.messages.create(params, requestOpts);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        throw new AnthropicAuthError(err?.message);
      }
      throw err;
    }

    return normalizeAnthropicResponse(response);
  }
}

/**
 * Convert an Anthropic `Message` into our provider-neutral response.
 * Stop reasons: `tool_use` → `tool_use`, `end_turn` → `end_turn`,
 * `max_tokens` → `max_tokens`, anything else → `other`.
 */
export function normalizeAnthropicResponse(response: any): ProviderChatResponse {
  const content = Array.isArray(response?.content) ? response.content : [];
  const textBlocks = content.filter((b: any) => b?.type === 'text');
  const text = textBlocks.map((b: any) => b.text).join('\n');

  const toolCalls: ProviderToolCall[] = content
    .filter((b: any) => b?.type === 'tool_use')
    .map((b: any) => ({
      id: typeof b.id === 'string' ? b.id : '',
      name: typeof b.name === 'string' ? b.name : '',
      arguments: (b.input && typeof b.input === 'object') ? (b.input as Record<string, unknown>) : {}
    }));

  let stopReason: ProviderChatResponse['stopReason'] = 'other';
  switch (response?.stop_reason) {
    case 'end_turn':
      stopReason = 'end_turn';
      break;
    case 'tool_use':
      stopReason = 'tool_use';
      break;
    case 'max_tokens':
      stopReason = 'max_tokens';
      break;
    default:
      stopReason = 'other';
  }

  const usage = response?.usage ?? {};
  const rawAssistantMessage: ProviderMessage = {
    role: 'assistant',
    content
  };

  return {
    stopReason,
    text,
    toolCalls,
    usage: {
      inputTokens: Number(usage.input_tokens ?? 0) || 0,
      outputTokens: Number(usage.output_tokens ?? 0) || 0,
      cacheCreationTokens: Number(usage.cache_creation_input_tokens ?? 0) || 0,
      cacheReadTokens: Number(usage.cache_read_input_tokens ?? 0) || 0
    },
    rawAssistantMessage
  };
}
