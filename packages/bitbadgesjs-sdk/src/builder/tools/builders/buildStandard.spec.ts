import { callTool } from '../registry.js';
import { buildSubscription } from '../../../core/builders/subscription.js';
import { normalizeToCreateOrUpdate } from '../../../cli/utils/normalizeMsg.js';
import { listStandardBuilders } from '../../../core/builders/input-schemas.js';
import { validateAddress } from '../../sdk/addressUtils.js';

describe('standard builder adapters', () => {
  it.each(listStandardBuilders())('builds the shipped $id example and rejects unsupported fields', async ({ id, example }) => {
    expect(example).toBeDefined();
    const addresses = JSON.stringify(example).match(/bb1[a-z0-9]+/g) ?? [];
    for (const address of addresses) expect(validateAddress(address).valid).toBe(true);
    const name = `build_${id.replace(/-/g, '_')}`;
    const result = await callTool(name, example);
    expect(result.isError).not.toBe(true);
    expect(result.result?.typeUrl).toMatch(/^\/tokenization\.Msg/);
    const unsupported = await callTool(name, { ...example, unsupportedGuardrail: true });
    expect(unsupported.isError).toBe(true);
    expect(unsupported.text).toContain('unsupportedGuardrail');
  });
  const params = { interval: 'monthly', price: 5, denom: 'BADGE', recipient: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm', uri: 'https://example.com/meta.json' };
  it('builds through the same core operation as the CLI', async () => {
    const result = await callTool('build_subscription', params);
    expect(result.isError).not.toBe(true);
    expect(result.result).toEqual(normalizeToCreateOrUpdate(buildSubscription(params)));
  });

  it('rejects unsupported terms rather than quietly creating a different contract', async () => {
    expect((await callTool('build_subscription', { ...params, prorations: true })).isError).toBe(true);
  });
});
