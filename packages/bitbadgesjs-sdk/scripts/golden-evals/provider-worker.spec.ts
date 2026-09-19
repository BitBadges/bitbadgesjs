import { runProviderWorker } from './provider-worker.js';

it('never executes a model-requested network or signing tool', async () => {
  const call = jest.fn();
  const chat = jest
    .fn()
    .mockResolvedValue({
      toolCalls: [{ id: '1', name: 'get_review_url', arguments: {} }],
      usage: { inputTokens: 1, outputTokens: 1 },
      rawAssistantMessage: { role: 'assistant', content: [] },
      text: ''
    });
  const provider = { chat, toolsForRequest: (tools: unknown) => tools };
  await expect(
    runProviderWorker(
      {
        version: 1,
        task: { id: 'one', prompt: 'Build', context: {} },
        history: [],
        settings: { model: 'fixture', provider: 'fixture', maxInputTokens: 10000, maxOutputTokens: 100 }
      },
      provider,
      [],
      call
    )
  ).rejects.toThrow(/not allowed/);
  expect(call).not.toHaveBeenCalled();
});

it('uses provider usage, consumes bounded tools, then parses the final structured answer', async () => {
  const chat = jest
    .fn()
    .mockResolvedValueOnce({
      toolCalls: [{ id: '1', name: 'build_subscription', arguments: {} }],
      usage: { inputTokens: 10, outputTokens: 5 },
      rawAssistantMessage: { role: 'assistant', content: [] },
      text: ''
    })
    .mockResolvedValueOnce({
      toolCalls: [],
      usage: { inputTokens: 20, outputTokens: 10 },
      rawAssistantMessage: { role: 'assistant', content: [] },
      text: JSON.stringify({ disposition: 'clarify', reasonCode: 'missing-recipient', fields: ['recipient'], explanation: 'Who receives payment?' })
    });
  const call = jest.fn().mockResolvedValue({ isError: false, result: {} });
  const output = await runProviderWorker(
    {
      version: 1,
      task: { id: 'one', prompt: 'Build', context: {} },
      history: [],
      settings: { model: 'fixture', provider: 'fixture', maxInputTokens: 10000, maxOutputTokens: 100 }
    },
    { chat, toolsForRequest: (tools: unknown) => tools },
    [{ name: 'build_subscription', description: 'Build', inputSchema: { type: 'object' } }],
    call
  );
  expect(output.usage).toEqual({ inputTokens: 30, outputTokens: 15, toolCalls: 1 });
  expect(call).toHaveBeenCalledTimes(1);
  expect(output.response).toHaveProperty('disposition', 'clarify');
});
