import { createOpenRouterProvider } from './openrouter.js';

const completion = {
  choices: [{ message: { content: '{"disposition":"clarify"}' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 12, completion_tokens: 7 }
};

it('sends authenticated tool conversations only to OpenRouter with no retries', async () => {
  const fetcher = jest.fn().mockResolvedValue({ ok: true, json: async () => completion });
  const provider = await createOpenRouterProvider('synthetic-key', fetcher);
  const result = await provider.chat({
    model: 'vendor/model-version',
    system: 'Build.',
    maxTokens: 99,
    messages: [
      { role: 'assistant', content: [{ type: 'tool_use', id: 'one', name: 'build_subscription', input: {} }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'one', content: '{"ok":true}' }] }
    ],
    tools: provider.toolsForRequest([{ name: 'build_subscription', description: 'Build', inputSchema: { type: 'object' } }])
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
  expect(options.headers.Authorization).toBe('Bearer synthetic-key');
  expect(options.redirect).toBe('error');
  expect(JSON.parse(options.body)).toMatchObject({
    model: 'vendor/model-version',
    max_tokens: 99,
    provider: { require_parameters: true },
    messages: [{ role: 'system' }, { role: 'assistant', tool_calls: [{ id: 'one' }] }, { role: 'tool', tool_call_id: 'one' }]
  });
  expect(result.usage).toMatchObject({ inputTokens: 12, outputTokens: 7 });
});

it('rejects missing credentials and unmetered or failed responses', async () => {
  const fetcher = jest.fn();
  await expect(createOpenRouterProvider('', fetcher)).rejects.toThrow(/credential/i);
  expect(fetcher).not.toHaveBeenCalled();
  for (const response of [
    { ok: false, status: 429 },
    { ok: true, json: async () => ({ ...completion, usage: undefined }) },
    { ok: true, json: async () => ({ ...completion, usage: { prompt_tokens: -1, completion_tokens: 7 } }) },
    { ok: true, json: async () => ({ error: { message: 'synthetic secret' } }) }
  ]) {
    fetcher.mockReset().mockResolvedValue(response);
    const provider = await createOpenRouterProvider('synthetic-key', fetcher);
    await expect(provider.chat({ model: 'vendor/model', system: 'Build', messages: [] })).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  }
});
