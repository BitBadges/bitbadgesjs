import { CosmosCoinUtils, RoundingMode, cosmosDecToString, cosmosPercentToString, createCosmosCoin } from './coin-utils.js';

const USDC_DETAILS = { symbol: 'USDC', decimals: 6 } as any;
const BADGE_DETAILS = { symbol: 'BADGE', decimals: 6 } as any;

describe('CosmosCoinUtils — display ↔ raw conversion', () => {
  it('integer raw amount converts cleanly to display', () => {
    const c = CosmosCoinUtils.fromRawAmount('1000000', 'ibc/usdc', USDC_DETAILS);
    expect(c.getDisplayAmountString()).toBe('1');
    expect(c.getDisplayAmount()).toBe(1);
    expect(c.toCoin()).toEqual({ denom: 'ibc/usdc', amount: '1000000' });
  });

  it('preserves all decimal digits at full precision', () => {
    const c = CosmosCoinUtils.fromRawAmount('1234567', 'ibc/usdc', USDC_DETAILS);
    expect(c.getDisplayAmountString()).toBe('1.234567');
  });

  it('zero-decimal denoms emit the raw integer string', () => {
    const c = CosmosCoinUtils.fromRawAmount('42', 'ubadge'); // no coinDetails
    expect(c.getDisplayAmountString()).toBe('42');
  });

  it('truncates extra precision with ROUND_DOWN by default', () => {
    const c = CosmosCoinUtils.fromRawAmount('1234567', 'ibc/usdc', USDC_DETAILS);
    expect(c.getDisplayAmountString(2)).toBe('1.23');
  });

  it('rounds up when ROUND_UP requested and the next digit is >= 5', () => {
    const c = CosmosCoinUtils.fromRawAmount('1234567', 'ibc/usdc', USDC_DETAILS);
    expect(c.getDisplayAmountString(3, RoundingMode.ROUND_UP)).toBe('1.235');
  });

  it('fromDisplayAmount round-trips with raw (full precision keeps trailing zeros)', () => {
    const c = CosmosCoinUtils.fromDisplayAmount('1.5', 'ibc/usdc', 6, USDC_DETAILS);
    expect(c.getRawAmountString()).toBe('1500000');
    expect(c.getDisplayAmountString()).toBe('1.500000');
    expect(c.getDisplayAmountString(1)).toBe('1.5');
  });

  it('fromDisplayAmount truncates excess decimals (ROUND_DOWN)', () => {
    const c = CosmosCoinUtils.fromDisplayAmount('1.234567890', 'ibc/usdc', 6, USDC_DETAILS);
    expect(c.getRawAmountString()).toBe('1234567');
  });

  it('fromDisplayAmount rounds up when requested', () => {
    const c = CosmosCoinUtils.fromDisplayAmount('1.2345678', 'ibc/usdc', 6, USDC_DETAILS, RoundingMode.ROUND_UP);
    expect(c.getRawAmountString()).toBe('1234568');
  });
});

describe('CosmosCoinUtils — arithmetic', () => {
  const a = CosmosCoinUtils.fromRawAmount('1000', 'ibc/usdc', USDC_DETAILS);
  const b = CosmosCoinUtils.fromRawAmount('250', 'ibc/usdc', USDC_DETAILS);

  it('adds same-denom', () => {
    expect(a.add(b).amount).toBe(1250n);
  });

  it('subtracts same-denom', () => {
    expect(a.subtract(b).amount).toBe(750n);
  });

  it('rejects cross-denom add', () => {
    const other = CosmosCoinUtils.fromRawAmount('100', 'ubadge', BADGE_DETAILS);
    expect(() => a.add(other)).toThrow(/different denoms/);
  });

  it('multiplies by a factor with ROUND_DOWN by default', () => {
    expect(a.multiply(1.5).amount).toBe(1500n);
  });

  it('multiplies with ROUND_UP', () => {
    const c = CosmosCoinUtils.fromRawAmount('10', 'ibc/usdc', USDC_DETAILS);
    expect(c.multiply(0.105, RoundingMode.ROUND_UP).amount).toBe(2n); // 10 * 0.105 = 1.05 → round up to 2
  });

  it('divides by an integer', () => {
    expect(a.divide(4).amount).toBe(250n);
  });

  it('divides by a decimal preserving precision', () => {
    expect(a.divide(2.5).amount).toBe(400n); // 1000 / 2.5
  });

  it('compares with isGreaterThan / isLessThan / isZero', () => {
    expect(a.isGreaterThan(b)).toBe(true);
    expect(b.isLessThan(a)).toBe(true);
    expect(a.isZero()).toBe(false);
    expect(CosmosCoinUtils.fromRawAmount('0', 'ibc/usdc').isZero()).toBe(true);
  });
});

describe('CosmosCoinUtils — slippage', () => {
  it('computes positive slippage when actual < expected', () => {
    const slip = CosmosCoinUtils.calculateSlippage(1000n, 990n, 4);
    expect(slip).toBeCloseTo(1, 3); // 1%
  });

  it('returns 0 when expected is zero', () => {
    expect(CosmosCoinUtils.calculateSlippage(0n, 100n)).toBe(0);
  });

  it('computes min-amount-after-slippage', () => {
    expect(CosmosCoinUtils.calculateMinAmount(1000n, 0.005)).toBe(995n);
  });

  it('instance methods proxy to statics', () => {
    const actual = CosmosCoinUtils.fromRawAmount('990', 'ibc/usdc');
    expect(actual.calculateSlippage(1000n, 4)).toBeCloseTo(1, 3);
    expect(actual.calculateMinAmount(0.01).amount).toBe(980n); // 990 * 0.99 = 980.1 → ROUND_DOWN
  });
});

describe('CosmosCoinUtils — USD value', () => {
  it('returns null when no price', () => {
    const c = CosmosCoinUtils.fromDisplayAmount('5', 'ibc/usdc', 6, USDC_DETAILS);
    expect(c.getUsdValue(null)).toBeNull();
    expect(c.getUsdValueString(undefined)).toBeNull();
  });

  it('computes USD value rounded to 2 dp by default', () => {
    const c = CosmosCoinUtils.fromDisplayAmount('5', 'ibc/usdc', 6, USDC_DETAILS);
    expect(c.getUsdValue(1.0)).toBeCloseTo(5, 2);
    expect(c.getUsdValueString(1.234567)).toBe('$6.17');
  });
});

describe('helpers', () => {
  it('createCosmosCoin builds an instance', () => {
    const c = createCosmosCoin('ibc/usdc', 1000n, USDC_DETAILS);
    expect(c.amount).toBe(1000n);
    expect(c.denom).toBe('ibc/usdc');
  });

  it('cosmosDecToString trims trailing zeros', () => {
    expect(cosmosDecToString(0.020, 3)).toBe('0.02');
    expect(cosmosDecToString(0, 3, 2)).toBe('0.00');
    expect(cosmosDecToString(1.5)).toBe('1.5');
  });

  it('cosmosPercentToString formats decimal as %', () => {
    expect(cosmosPercentToString(0.005)).toBe('0.5%');
    expect(cosmosPercentToString(0.123, 1)).toBe('12.3%');
  });
});
