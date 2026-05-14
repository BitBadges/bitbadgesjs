/**
 * Tests for the shared amount-flex resolver.
 */
import { resolveAmount } from './amount.js';

const ctx = { amountFlag: '--amount', denomFlag: '--denom' };

describe('resolveAmount', () => {
  it('converts a symbol amount to base units via the registry decimals', () => {
    // BADGE has 9 decimals; 10 BADGE → 10_000_000_000 base units.
    const out = resolveAmount('10', 'BADGE', false, ctx);
    expect(out.denom).toBe('ubadge');
    expect(out.amount).toBe('10000000000');
  });

  it('passes a base-denom (ubadge) amount through verbatim', () => {
    const out = resolveAmount('100000000', 'ubadge', false, ctx);
    expect(out.denom).toBe('ubadge');
    expect(out.amount).toBe('100000000');
  });

  it('honors --base-units with a symbol denom (no decimal multiply)', () => {
    // 100000000 ubadge worth, expressed as base units with --base-units.
    const out = resolveAmount('100000000', 'BADGE', true, ctx);
    expect(out.denom).toBe('ubadge');
    expect(out.amount).toBe('100000000');
  });

  it('handles decimal-string symbol amounts (1.5 USDC → 1500000)', () => {
    // USDC has 6 decimals; 1.5 USDC → 1_500_000 base units.
    const out = resolveAmount('1.5', 'USDC', false, ctx);
    expect(out.amount).toBe('1500000');
  });

  it('strips underscores and commas from amount input', () => {
    const out = resolveAmount('1_000_000_000', 'ubadge', false, ctx);
    expect(out.amount).toBe('1000000000');

    const out2 = resolveAmount('1,000,000,000', 'ubadge', false, ctx);
    expect(out2.amount).toBe('1000000000');
  });

  it('rejects negative amounts', () => {
    expect(() => resolveAmount('-10', 'BADGE', false, ctx)).toThrow();
  });

  it('rejects non-integer amount when denom is a chain denom', () => {
    expect(() => resolveAmount('1.5', 'ubadge', false, ctx)).toThrow(/non-negative integer/);
  });

  it('rejects non-integer amount when --base-units is set', () => {
    expect(() => resolveAmount('1.5', 'BADGE', true, ctx)).toThrow(/non-negative integer/);
  });

  it('rejects an ibc/... amount that is non-integer', () => {
    const fake = 'ibc/' + 'A'.repeat(64);
    expect(() => resolveAmount('1.5', fake, false, ctx)).toThrow(/non-negative integer/);
  });

  it('REJECTS uusdc via requireBbDenom even on the amount path', () => {
    expect(() => resolveAmount('10', 'uusdc', false, ctx)).toThrow(/not a valid BitBadges denom/);
  });
});
