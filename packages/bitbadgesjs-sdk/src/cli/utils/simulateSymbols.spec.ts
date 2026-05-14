/**
 * Tests for simulateSymbols.ts — pure-compute helpers for the simulate renderer.
 *
 * Covers:
 *   - formatHumanAmount (decimal formatting, sign, trailing-zero strip)
 *   - detectBalanceAliasSymbol (clean N-unit alias path detection)
 *
 * `resolveCoinSymbol` is not covered here — it consults the runtime coin
 * registry which is exercised by builder tests already.
 */

import { formatHumanAmount, detectBalanceAliasSymbol } from './simulateSymbols.js';

describe('formatHumanAmount', () => {
  it('falls back to integer string when decimals <= 0', () => {
    expect(formatHumanAmount(1234n, 0)).toBe('1234');
    expect(formatHumanAmount(1234n, -1)).toBe('1234');
  });

  it('formats with the supplied decimals', () => {
    expect(formatHumanAmount(1_000_000n, 6)).toBe('1');
    expect(formatHumanAmount(1_500_000n, 6)).toBe('1.5');
    expect(formatHumanAmount(1234n, 2)).toBe('12.34');
  });

  it('strips trailing zeros from the fractional part', () => {
    expect(formatHumanAmount(1_200_000n, 6)).toBe('1.2');
    expect(formatHumanAmount(1_000_000n, 6)).toBe('1');
  });

  it('zero-pads when the integer part is zero', () => {
    expect(formatHumanAmount(1n, 6)).toBe('0.000001');
    expect(formatHumanAmount(123n, 6)).toBe('0.000123');
  });

  it('preserves sign', () => {
    expect(formatHumanAmount(-1_500_000n, 6)).toBe('-1.5');
    expect(formatHumanAmount(-1n, 6)).toBe('-0.000001');
  });
});

describe('detectBalanceAliasSymbol', () => {
  // Alias path with one sideB entry (token 1 forever, amount 1).
  const aliasPath = {
    symbol: 'uno',
    denomUnits: [{ symbol: 'uno', isDefaultDisplay: true, decimals: 6 }],
    conversion: {
      sideB: [
        {
          amount: '1',
          tokenIds: [{ start: '1', end: '1' }],
          ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
        }
      ]
    }
  };

  const oneUnitBalance = [
    {
      amount: '1',
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: [{ start: '1', end: '18446744073709551615' }]
    }
  ];

  it('returns null when the collection has no alias paths', () => {
    expect(detectBalanceAliasSymbol(oneUnitBalance, undefined)).toBeNull();
    expect(detectBalanceAliasSymbol(oneUnitBalance, {})).toBeNull();
  });

  it('returns the symbol when balances cleanly encode 1× sideB', () => {
    const r = detectBalanceAliasSymbol(oneUnitBalance, { aliasPaths: [aliasPath] });
    expect(r).toEqual({ symbol: 'uno', amount: 1n, decimals: 6 });
  });

  it('detects an integer N > 1', () => {
    const balances = [{ ...oneUnitBalance[0], amount: '5' }];
    const r = detectBalanceAliasSymbol(balances, { aliasPaths: [aliasPath] });
    expect(r).toEqual({ symbol: 'uno', amount: 5n, decimals: 6 });
  });

  it('preserves negative sign (net-change Mint side)', () => {
    const balances = [{ ...oneUnitBalance[0], amount: '-3' }];
    const r = detectBalanceAliasSymbol(balances, { aliasPaths: [aliasPath] });
    expect(r).toEqual({ symbol: 'uno', amount: -3n, decimals: 6 });
  });

  it('returns null when token ID range does not match', () => {
    const wrongTokens = [{ ...oneUnitBalance[0], tokenIds: [{ start: '2', end: '2' }] }];
    expect(detectBalanceAliasSymbol(wrongTokens, { aliasPaths: [aliasPath] })).toBeNull();
  });

  it('returns null when amount is not evenly divisible by sideB.amount', () => {
    const fractional = [{ ...oneUnitBalance[0], amount: '1' }];
    const fracPath = { ...aliasPath, conversion: { sideB: [{ ...aliasPath.conversion.sideB[0], amount: '3' }] } };
    expect(detectBalanceAliasSymbol(fractional, { aliasPaths: [fracPath] })).toBeNull();
  });

  it('also consults cosmosCoinWrapperPaths', () => {
    const r = detectBalanceAliasSymbol(oneUnitBalance, { cosmosCoinWrapperPaths: [aliasPath] });
    expect(r?.symbol).toBe('uno');
  });
});
