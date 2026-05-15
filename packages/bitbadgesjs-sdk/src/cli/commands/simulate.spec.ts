/**
 * simulate.ts coverage (ticket 0430) — previously zero specs anywhere.
 * ensureTxWrapper is the load-bearing input-normalization helper; the
 * command surface guards flag drift. Network paths are integration
 * territory (no runCli in unit specs, per project convention).
 */

import { simulateCommand, ensureTxWrapper } from './simulate.js';

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
