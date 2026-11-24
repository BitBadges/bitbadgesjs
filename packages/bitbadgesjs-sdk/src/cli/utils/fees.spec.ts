import { resolveCliFee, sweepAmount } from './fees.js';

describe('CLI transaction fees', () => {
  it('uses simulated gas with the 18-decimal price (10000000000 abadge/gas) even when the CLI fee defaults to zero', () => {
    expect(resolveCliFee(520001, 400000, '0')).toEqual({ gas: '520001', amount: '5200010000000000', denom: 'abadge' });
    expect(resolveCliFee(120000, 200000)).toEqual({ gas: '200000', amount: '2000000000000000', denom: 'abadge' });
  });
  it('rejects underpriced overrides and invalid or oversized gas', () => {
    expect(() => resolveCliFee(520001, 400000, '5000')).toThrow(/fee/i);
    for (const gas of [NaN, 0, -1, 1.5, 100000001]) expect(() => resolveCliFee(gas)).toThrow(/gas/i);
    expect(() => resolveCliFee(100000, 100000001)).toThrow(/gas/i);
    expect(() => resolveCliFee(100000, 200000, '1.5')).toThrow(/fee/i);
  });
  it('reserves the fee from BADGE, but never subtracts BADGE fees from another asset', () => {
    expect(sweepAmount('abadge', 10_000_000_000_000_000n, 10_000_000_000_000_000n, '2000000000000000')).toBe(8_000_000_000_000_000n);
    expect(sweepAmount('ibc/USDC', 100n, 2_000_000_000_000_000n, '2000000000000000')).toBe(100n);
    expect(() => sweepAmount('ibc/USDC', 100n, 1_999_999_999_999_999n, '2000000000000000')).toThrow(/abadge/i);
    expect(() => sweepAmount('abadge', 2_000_000_000_000_000n, 2_000_000_000_000_000n, '2000000000000000')).toThrow(/balance/i);
  });
});
