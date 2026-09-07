import { resolveCliFee, sweepAmount } from './fees.js';

describe('CLI transaction fees', () => {
  it('uses simulated gas with the v35 price even when the CLI fee defaults to zero', () => {
    expect(resolveCliFee(520001, 400000, '0')).toEqual({ gas: '520001', amount: '5200010', denom: 'ubadge' });
    expect(resolveCliFee(120000, 200000)).toEqual({ gas: '200000', amount: '2000000', denom: 'ubadge' });
  });
  it('rejects underpriced overrides and invalid or oversized gas', () => {
    expect(() => resolveCliFee(520001, 400000, '5000')).toThrow(/fee/i);
    for (const gas of [NaN, 0, -1, 1.5, 100000001]) expect(() => resolveCliFee(gas)).toThrow(/gas/i);
    expect(() => resolveCliFee(100000, 100000001)).toThrow(/gas/i);
    expect(() => resolveCliFee(100000, 200000, '1.5')).toThrow(/fee/i);
  });
  it('reserves the fee from BADGE, but never subtracts BADGE fees from another asset', () => {
    expect(sweepAmount('ubadge', 10000000n, 10000000n, '2000000')).toBe(8000000n);
    expect(sweepAmount('ibc/USDC', 100n, 2000000n, '2000000')).toBe(100n);
    expect(() => sweepAmount('ibc/USDC', 100n, 1999999n, '2000000')).toThrow(/ubadge/i);
    expect(() => sweepAmount('ubadge', 2000000n, 2000000n, '2000000')).toThrow(/balance/i);
  });
});
