/**
 * preview.ts coverage (ticket 0430) — previously zero specs anywhere.
 * ensureTxWrapper normalization + command surface (flag/arg drift).
 * The indexer upload + URL assembly are network paths (integration
 * territory; no runCli in unit specs, per project convention).
 */

import { previewCommand, ensureTxWrapper } from './preview.js';

describe('preview ensureTxWrapper', () => {
  it('returns a {messages:[...]} body unchanged', () => {
    const tx = { messages: [{ typeUrl: '/x.Msg', value: { a: 1 } }] };
    expect(ensureTxWrapper(tx)).toBe(tx);
  });
  it('wraps a bare {typeUrl,value} Msg into a single-message body', () => {
    const msg = { typeUrl: '/x.Msg', value: { a: 1 } };
    expect(ensureTxWrapper(msg)).toEqual({ messages: [msg] });
  });
  it('passes non-object / non-Msg input through (→ invalid_shape downstream)', () => {
    expect(ensureTxWrapper(undefined)).toBeUndefined();
    const weird = { not: 'a tx' };
    expect(ensureTxWrapper(weird)).toBe(weird);
  });
});

describe('previewCommand shape', () => {
  it('takes a single <input> argument', () => {
    expect(previewCommand.name()).toBe('preview');
    expect((previewCommand as any)._args.map((a: any) => a.name())).toEqual(['input']);
  });
  it('exposes --frontend-url with the bitbadges.io default', () => {
    const opt = (previewCommand as any).options.find((o: any) => o.long === '--frontend-url');
    expect(opt).toBeDefined();
    expect(opt.defaultValue).toBe('https://bitbadges.io');
  });
});
