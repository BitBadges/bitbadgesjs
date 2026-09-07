/**
 * simulate.ts coverage (ticket 0430) — previously zero specs anywhere.
 * ensureTxWrapper is the load-bearing input-normalization helper; the
 * command surface guards flag drift. Network paths are integration
 * territory (no runCli in unit specs, per project convention).
 */

import { simulateCommand, ensureTxWrapper, requiresApiKey } from './simulate.js';

describe('simulate ensureTxWrapper', () => {
  it('returns a {messages:[...]} body unchanged', () => {
    const tx = { messages: [{ typeUrl: '/x.Msg', value: { a: 1 } }], memo: 'm' };
    expect(ensureTxWrapper(tx)).toBe(tx);
  });
  it('wraps a bare {typeUrl,value} Msg into a single-message body', () => {
    const msg = { typeUrl: '/x.Msg', value: { a: 1 } };
    expect(ensureTxWrapper(msg)).toEqual({ messages: [msg] });
  });
  it('passes a non-object through untouched', () => {
    expect(ensureTxWrapper(null)).toBeNull();
    expect(ensureTxWrapper('-')).toBe('-');
    expect(ensureTxWrapper(42 as any)).toBe(42);
  });
  it('passes an object that is neither messages-shaped nor a Msg through untouched (→ shape error downstream)', () => {
    const weird = { foo: 'bar' };
    expect(ensureTxWrapper(weird)).toBe(weird);
    // typeUrl present but no value → NOT a valid Msg, passthrough
    const noValue = { typeUrl: '/x.Msg' };
    expect(ensureTxWrapper(noValue)).toBe(noValue);
  });
});

describe('simulateCommand shape', () => {
  it('takes a single <input> argument', () => {
    expect(simulateCommand.name()).toBe('simulate');
    expect((simulateCommand as any)._args.map((a: any) => a.name())).toEqual(['input']);
  });
  it('exposes the documented flags', () => {
    const flags = (simulateCommand as any).options.map((o: any) => o.long);
    for (const f of ['--creator', '--events', '--condensed', '--output-file']) {
      expect(flags).toContain(f);
    }
  });
});

describe('simulate API-key gating', () => {
  // The local indexer serves /api/v0/simulate without an API key, and the
  // command's own error text tells the user to "pass --network local".
  // Gating local on a key made that advice a dead end: following it produced
  // the same error, which an agent cannot recover from.
  it('does not require a key on local', () => {
    expect(requiresApiKey({ network: 'local' })).toBe(false);
    expect(requiresApiKey({ local: true })).toBe(false);
  });

  it('does not require a key when --url points at a local indexer', () => {
    expect(requiresApiKey({ url: 'http://localhost:3001' })).toBe(false);
    expect(requiresApiKey({ url: 'http://127.0.0.1:3001' })).toBe(false);
  });

  it('still requires a key on mainnet and testnet', () => {
    expect(requiresApiKey({})).toBe(true);
    expect(requiresApiKey({ network: 'mainnet' })).toBe(true);
    expect(requiresApiKey({ testnet: true })).toBe(true);
    expect(requiresApiKey({ url: 'https://api.bitbadges.io' })).toBe(true);
  });
});
