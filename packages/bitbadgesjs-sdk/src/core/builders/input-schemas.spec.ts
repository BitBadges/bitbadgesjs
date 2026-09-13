import { parseBuilderInput, getBuilderInputSchema } from './input-schemas.js';
import { buildSubscription } from './subscription.js';

describe('shared builder input schemas', () => {
  it('describes the actual subscription fields and rejects unsupported promises', () => {
    expect(getBuilderInputSchema('subscription').required).toContain('interval');
    expect(() => parseBuilderInput('subscription', { interval: 'monthly', prorations: true })).toThrow();
    expect(() => buildSubscription({ interval: 'monthly', price: 5, denom: 'BADGE', recipient: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm', uri: 'https://example.com/meta.json', refunds: true } as any)).toThrow();
  });

  it('validates nested inputs without changing the supplied data', () => {
    const params = { interval: 'monthly', payouts: [{ recipient: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm', amount: 5, denom: 'BADGE' }] };
    expect(parseBuilderInput('subscription', params)).toEqual(params);
    expect(() => parseBuilderInput('subscription', { ...params, payouts: [{ ...params.payouts[0], hiddenFee: 2 }] })).toThrow();
    expect(() => parseBuilderInput('subscription', { ...params, payouts: [{ ...params.payouts[0], amount: '5' }] })).toThrow();
    expect(() => getBuilderInputSchema('not-a-standard')).toThrow();
  });
});
