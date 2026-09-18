import { parseBuilderInput, getBuilderInputSchema } from './input-schemas.js';
import { buildSubscription } from './subscription.js';

describe('shared builder input schemas', () => {
  it('describes the actual subscription fields and rejects unsupported promises', () => {
    const schema = getBuilderInputSchema('subscription');
    expect(schema.properties).toHaveProperty('interval');
    expect(schema.properties).toHaveProperty('operatorProfile');
    expect(schema.properties).toHaveProperty('version');
    const legacy = { price: 5, denom: 'BADGE', recipient: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm', uri: 'https://example.com/meta.json' };
    expect(() => buildSubscription(legacy)).toThrow(/interval/i);
    expect(() => buildSubscription({ ...legacy, version: '1' })).toThrow(/interval/i);
    expect(() => buildSubscription({ ...legacy, interval: 'monthly' })).not.toThrow();
    expect(() => buildSubscription({ ...legacy, version: '2', interval: 'monthly' })).toThrow();
    expect(() => buildSubscription({ version: '2', uri: legacy.uri })).toThrow(/profile/i);
    expect(() => parseBuilderInput('subscription', { interval: 'monthly', prorations: true })).toThrow();
    expect(() =>
      buildSubscription({
        interval: 'monthly',
        price: 5,
        denom: 'BADGE',
        recipient: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm',
        uri: 'https://example.com/meta.json',
        refunds: true
      } as any)
    ).toThrow();
  });

  it('validates nested inputs without changing the supplied data', () => {
    const params = { interval: 'monthly', payouts: [{ recipient: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm', amount: 5, denom: 'BADGE' }] };
    expect(parseBuilderInput('subscription', params)).toEqual(params);
    expect(() => parseBuilderInput('subscription', { ...params, payouts: [{ ...params.payouts[0], hiddenFee: 2 }] })).toThrow();
    expect(() => parseBuilderInput('subscription', { ...params, payouts: [{ ...params.payouts[0], amount: '5' }] })).toThrow();
    expect(() => getBuilderInputSchema('not-a-standard')).toThrow();
  });
});
