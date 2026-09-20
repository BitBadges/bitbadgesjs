import { z } from 'zod';
import { OpenAIProvider } from '../../src/builder/agent/providers/openai.js';

const meteredResponse = z
  .object({
    choices: z.array(z.object({ message: z.object({}).passthrough() }).passthrough()).min(1),
    usage: z.object({ prompt_tokens: z.number().int().nonnegative(), completion_tokens: z.number().int().nonnegative() })
  })
  .passthrough();

export async function createOpenRouterProvider(apiKey: string, fetcher: typeof fetch = fetch) {
  if (!apiKey) throw new Error('OpenRouter credential is required');
  const provider = new OpenAIProvider();
  await provider.init({
    client: {
      chat: {
        completions: {
          create: async (params: Record<string, unknown>) => {
            const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              redirect: 'error',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...params, stream: false, provider: { require_parameters: true } })
            });
            if (!response.ok) throw new Error(`OpenRouter request failed (${response.status})`);
            return meteredResponse.parse(await response.json());
          }
        }
      }
    }
  });
  return provider;
}
