/**
 * Provider dispatcher.
 *
 * Adding a new LLM provider is a one-file drop-in:
 *   1. Implement `LLMProvider` (see `./types.ts`) under `./<name>.ts`.
 *   2. Add the case below.
 *   3. Document the credentials it needs.
 *
 * No agent-loop changes required.
 */

import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import type { LLMProvider } from './types.js';

export type ProviderName = 'anthropic' | 'openai';

/** Supported provider names — narrow union for IntelliSense. */
export const SUPPORTED_PROVIDERS: readonly ProviderName[] = ['anthropic', 'openai'] as const;

export function getProvider(name: ProviderName | string | undefined): LLMProvider {
  const resolved = (name ?? 'anthropic') as ProviderName;
  switch (resolved) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(
        `Unknown LLM provider "${resolved}". Supported: ${SUPPORTED_PROVIDERS.join(', ')}.`
      );
  }
}

export type {
  LLMProvider,
  LLMProviderConfig,
  ProviderChatArgs,
  ProviderChatResponse,
  ProviderToolDefinition,
  ProviderMessage,
  ProviderUsage,
  ProviderToolCall,
  ProviderSystemBlock
} from './types.js';
export { AnthropicProvider } from './anthropic.js';
export { OpenAIProvider } from './openai.js';
