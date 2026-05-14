/**
 * Tests for the CLI denom validators.
 *
 * Two parallel validators — strict BitBadges-side and permissive Skip:Go
 * cross-chain. The strict one is the one that prevents the most common
 * user error: passing Noble's `uusdc` to a BitBadges auction bid.
 */
import { requireBbDenom, requireSkipGoDenom } from './denom.js';

describe('requireBbDenom', () => {
  it('accepts the BADGE symbol and returns ubadge', () => {
    expect(requireBbDenom('BADGE', 'place-bid')).toBe('ubadge');
    expect(requireBbDenom('badge', 'place-bid')).toBe('ubadge'); // case-insensitive
  });

  it('accepts the literal ubadge denom', () => {
    expect(requireBbDenom('ubadge', 'place-bid')).toBe('ubadge');
  });

  it('resolves USDC symbol to its ibc/... canonical form', () => {
    const out = requireBbDenom('USDC', 'place-bid');
    expect(out.startsWith('ibc/')).toBe(true);
    expect(out.length).toBe(4 + 64); // ibc/ + 64 hex chars
  });

  it('accepts an arbitrary ibc/<64-hex> form not in the registry', () => {
    const fake = 'ibc/' + 'A'.repeat(64);
    expect(requireBbDenom(fake, 'place-bid')).toBe(fake);
  });

  it('accepts a factory/... denom', () => {
    expect(requireBbDenom('factory/bb1abc/myunit', 'place-bid')).toBe('factory/bb1abc/myunit');
  });

  it('accepts badges:* denoms', () => {
    expect(requireBbDenom('badges:49:chaosnet', 'place-bid')).toBe('badges:49:chaosnet');
  });

  it('accepts badgeslp:* denoms (LP/prediction market deposit aliases)', () => {
    expect(requireBbDenom('badgeslp:99:utoken', '--denom')).toBe('badgeslp:99:utoken');
  });

  it('REJECTS uusdc with a clear hint', () => {
    expect(() => requireBbDenom('uusdc', 'place-bid')).toThrow(/not a valid BitBadges denom/);
    expect(() => requireBbDenom('uusdc', 'place-bid')).toThrow(/ibc/);
  });

  it('REJECTS uatom and uosmo similarly', () => {
    expect(() => requireBbDenom('uatom', 'place-bid')).toThrow(/not a valid BitBadges denom/);
    expect(() => requireBbDenom('uosmo', 'place-bid')).toThrow(/not a valid BitBadges denom/);
  });

  it('rejects empty and whitespace input', () => {
    expect(() => requireBbDenom('', 'place-bid')).toThrow(/Missing denom/);
    expect(() => requireBbDenom('   ', 'place-bid')).toThrow(/Missing denom/);
  });

  it('rejects unknown symbols with the registry list', () => {
    expect(() => requireBbDenom('XYZ', 'place-bid')).toThrow(/Unknown denom/);
    expect(() => requireBbDenom('XYZ', 'place-bid')).toThrow(/Supported symbols/);
  });

  it('rejects malformed ibc/ forms', () => {
    expect(() => requireBbDenom('ibc/short', 'place-bid')).toThrow();
    expect(() => requireBbDenom('ibc/' + 'Z'.repeat(64), 'place-bid')).toThrow(); // non-hex
  });

  it('includes the context label in error messages', () => {
    try {
      requireBbDenom('uusdc', '--denom for auction place-bid');
    } catch (e: any) {
      expect(e.message).toContain('--denom for auction place-bid');
    }
  });
});

describe('requireSkipGoDenom', () => {
  it('accepts uusdc (Noble origin denom)', () => {
    expect(requireSkipGoDenom('uusdc', 'swap')).toBe('uusdc');
  });

  it('accepts uatom (Hub origin denom)', () => {
    expect(requireSkipGoDenom('uatom', 'swap')).toBe('uatom');
  });

  it('accepts ubadge (BitBadges-side denom)', () => {
    expect(requireSkipGoDenom('ubadge', 'swap')).toBe('ubadge');
  });

  it('accepts ibc/... cross-chain denoms', () => {
    const ibc = 'ibc/' + 'A'.repeat(64);
    expect(requireSkipGoDenom(ibc, 'swap')).toBe(ibc);
  });

  it('rejects empty input', () => {
    expect(() => requireSkipGoDenom('', 'swap')).toThrow(/Missing denom/);
  });

  it('rejects denoms with leading/trailing whitespace', () => {
    expect(() => requireSkipGoDenom(' uusdc', 'swap')).toThrow(/whitespace/);
    expect(() => requireSkipGoDenom('uusdc ', 'swap')).toThrow(/whitespace/);
  });
});
