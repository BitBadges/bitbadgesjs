/**
 * OpenAI provider — peer-dep-safe wrapper around the `openai` npm
 * package. Implements the `LLMProvider` interface so the agent's
 * self-driving loop can run against `gpt-4o-mini` / etc. with no
 * other code changes.
 *
 * Translation responsibilities:
 *  - Tool format: `{ name, description, inputSchema }` →
 *    `{ type: 'function', function: { name, description, parameters } }`
 *  - Messages: agent loop's Anthropic-shaped content blocks
 *    (`tool_use` / `tool_result`) → OpenAI `assistant.tool_calls` /
 *    `role: 'tool'` messages.
 *  - Stop reasons: `'tool_calls'` → `tool_use`, `'stop'` → `end_turn`,
 *    `'length'` → `max_tokens`, everything else → `other`.
 *  - Usage: `prompt_tokens` / `completion_tokens` →
 *    `inputTokens` / `outputTokens`. OpenAI doesn't surface
 *    cache usage in a comparable way, so cache fields stay 0.
 */

import { PeerDependencyError } from '../errors.js';
import type {
  LLMProvider,
  LLMProviderConfig,
  ProviderChatArgs,
  ProviderChatResponse,
  ProviderToolDefinition,
  ProviderMessage,
  ProviderToolCall
} from './types.js';

const DEFAULT_MODEL = 'gpt-4o-mini';

let cachedSdk: any | null = null;

/**
 * Dynamically load the `openai` npm package — kept off the SDK's
 * direct `dependencies` so users only pay for it when they pick the
 * OpenAI provider. Resolution mirrors the Anthropic loader's
 * bun-link / npm-link aware strategy.
 */
async function loadOpenAiSdk(): Promise<any> {
  if (cachedSdk) return cachedSdk;

  let mod: any;
  let lastError: unknown = null;

  const tryStrategies: Array<() => Promise<any> | any> = [
    async () => {
      const modSpecifier = 'openai';
      return await (Function('s', 'return import(s)') as any)(modSpecifier);
    },
    async () => {
      if (typeof process === 'undefined') throw new Error('no process');
      const m = await import('module');
      const createRequire = (m as any).createRequire ?? (m as any).default?.createRequire;
      const req = createRequire(process.cwd() + '/package.json');
      return req('openai');
    },
    async () => {
      // eslint-disable-next-line no-eval
      const fn: string | undefined = (0, eval)(`typeof __filename !== 'undefined' ? __filename : undefined`);
      if (!fn) throw new Error('no CJS anchor');
      const m = await import('module');
      const createRequire = (m as any).createRequire ?? (m as any).default?.createRequire;
      const req = createRequire(fn);
      return req('openai');
    }
  ];

  for (const strategy of tryStrategies) {
    try {
      mod = await strategy();
      if (mod) break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!mod) {
    throw new PeerDependencyError(
      `\`openai\` is required to use the openai provider but could not be resolved. ` +
        `Install it in your project: npm install openai. ` +
        (lastError ? `Last resolution error: ${(lastError as any)?.message ?? String(lastError)}` : '')
    );
  }

  // The OpenAI package's default export is the constructor; cover
  // both ESM (`mod.default`) and CJS (`mod` itself) shapes.
  cachedSdk = mod.default ?? mod.OpenAI ?? mod;
  return cachedSdk;
}

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  client: any = null;

  async init(config: LLMProviderConfig): Promise<void> {
    if (this.client) return;
    if (config.client) {
      this.client = config.client;
      return;
    }
    const apiKey = config.apiKey ?? (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined);
    if (!apiKey) {
      throw new PeerDependencyError(
        'No OpenAI credentials found. Provide `apiKey` (or set OPENAI_API_KEY) when constructing BitBadgesBuilderAgent with provider: "openai".'
      );
    }
    const Ctor = await loadOpenAiSdk();
    const opts: Record<string, unknown> = { apiKey };
    if (config.baseURL) opts.baseURL = config.baseURL;
    this.client = new Ctor(opts);
  }

  defaultModel(): string {
    return DEFAULT_MODEL;
  }

  toolsForRequest(tools: ProviderToolDefinition[]): unknown {
    // OpenAI ignores `cache_control` — drop silently.
    return tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema
      }
    }));
  }

  async chat(args: ProviderChatArgs): Promise<ProviderChatResponse> {
    if (!this.client) {
      throw new Error('OpenAIProvider.chat called before init()');
    }

    const systemText =
      typeof args.system === 'string'
        ? args.system
        : args.system.map((b) => b.text).join('\n\n');

    const messages = [
      { role: 'system' as const, content: systemText },
      ...messagesToOpenAi(args.messages)
    ];

    const params: Record<string, unknown> = {
      model: args.model,
      messages,
      max_tokens: args.maxTokens ?? 8192
    };
    if (args.tools !== undefined) {
      params.tools = args.tools;
      params.tool_choice = 'auto';
    }
    if (args.temperature !== undefined) params.temperature = args.temperature;

    const requestOpts: Record<string, unknown> = {};
    if (args.timeoutMs !== undefined) requestOpts.timeout = args.timeoutMs;
    if (args.abortSignal) requestOpts.signal = args.abortSignal;

    const response: any = await this.client.chat.completions.create(params, requestOpts);
    return normalizeOpenAiResponse(response);
  }
}

/**
 * Translate the agent loop's Anthropic-style messages into OpenAI's
 * chat-completions format.
 */
export function messagesToOpenAi(messages: ProviderMessage[]): any[] {
  const out: any[] = [];
  for (const msg of messages) {
    if (msg.role === 'user') {
      // User message either is a plain string or contains text +
      // tool_result blocks. Tool results become standalone OpenAI
      // `role: 'tool'` messages; remaining text concatenates into
      // a single user content string.
      if (typeof msg.content === 'string') {
        out.push({ role: 'user', content: msg.content });
        continue;
      }
      if (!Array.isArray(msg.content)) continue;
      const textParts: string[] = [];
      const toolMessages: any[] = [];
      for (const block of msg.content) {
        if (!block || typeof block !== 'object') continue;
        if (block.type === 'tool_result') {
          toolMessages.push({
            role: 'tool',
            tool_call_id: block.tool_use_id,
            content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '')
          });
        } else if (block.type === 'text' && typeof block.text === 'string') {
          textParts.push(block.text);
        }
      }
      if (textParts.length > 0) {
        out.push({ role: 'user', content: textParts.join('\n') });
      }
      out.push(...toolMessages);
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        out.push({ role: 'assistant', content: msg.content });
        continue;
      }
      if (!Array.isArray(msg.content)) continue;
      const textParts: string[] = [];
      const toolCalls: any[] = [];
      for (const block of msg.content) {
        if (!block || typeof block !== 'object') continue;
        if (block.type === 'text' && typeof block.text === 'string') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            type: 'function',
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input ?? {})
            }
          });
        }
      }
      const assistantMsg: Record<string, unknown> = { role: 'assistant' };
      // OpenAI requires content to be a string OR null. Empty string
      // is allowed but null is the cleaner signal when the assistant
      // turn was tool-call-only.
      assistantMsg.content = textParts.length > 0 ? textParts.join('\n') : null;
      if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls;
      out.push(assistantMsg);
    }
  }
  return out;
}

/**
 * Convert an OpenAI ChatCompletion into our provider-neutral
 * response. The assistant message is reconstructed in
 * Anthropic-style content blocks so the agent loop can append it
 * to its history without provider-aware branching.
 */
export function normalizeOpenAiResponse(response: any): ProviderChatResponse {
  const choice = response?.choices?.[0] ?? {};
  const message = choice?.message ?? {};
  const finishReason = choice?.finish_reason;

  const contentBlocks: any[] = [];
  if (typeof message.content === 'string' && message.content.length > 0) {
    contentBlocks.push({ type: 'text', text: message.content });
  }

  const toolCalls: ProviderToolCall[] = [];
  if (Array.isArray(message.tool_calls)) {
    for (const call of message.tool_calls) {
      if (!call || call.type !== 'function' || !call.function) continue;
      let parsedArgs: Record<string, unknown> = {};
      const raw = call.function.arguments;
      if (typeof raw === 'string') {
        try {
          parsedArgs = raw.trim() ? JSON.parse(raw) : {};
        } catch {
          // Malformed JSON args from the model — surface as empty
          // and let tool execution surface a clearer downstream
          // error. Rare; matches OpenAI's documented behavior.
          parsedArgs = {};
        }
      } else if (raw && typeof raw === 'object') {
        parsedArgs = raw as Record<string, unknown>;
      }
      const id = typeof call.id === 'string' ? call.id : '';
      const name = typeof call.function.name === 'string' ? call.function.name : '';
      toolCalls.push({ id, name, arguments: parsedArgs });
      contentBlocks.push({ type: 'tool_use', id, name, input: parsedArgs });
    }
  }

  let stopReason: ProviderChatResponse['stopReason'];
  switch (finishReason) {
    case 'tool_calls':
      stopReason = 'tool_use';
      break;
    case 'stop':
      stopReason = 'end_turn';
      break;
    case 'length':
      stopReason = 'max_tokens';
      break;
    default:
      stopReason = 'other';
  }

  const usage = response?.usage ?? {};
  const text = contentBlocks
    .filter((b) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');

  return {
    stopReason,
    text,
    toolCalls,
    usage: {
      inputTokens: Number(usage.prompt_tokens ?? 0) || 0,
      outputTokens: Number(usage.completion_tokens ?? 0) || 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0
    },
    rawAssistantMessage: {
      role: 'assistant',
      content: contentBlocks
    }
  };
}
