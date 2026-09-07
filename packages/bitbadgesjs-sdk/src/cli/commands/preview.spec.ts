/**
 * preview.ts coverage (ticket 0430) — previously zero specs anywhere.
 * ensureTxWrapper normalization + command surface (flag/arg drift).
 * The indexer upload + URL assembly are network paths (integration
 * territory; no runCli in unit specs, per project convention).
 */

import { previewCommand, ensureTxWrapper, resolveFrontendBaseForCli } from './preview.js';

describe('preview ensureTxWrapper', () => {
  it('returns a {messages:[...]} body unchanged', () => {
    const tx = { messages: [{ typeUrl: '/x.Msg', value: { a: 1 } }] };
    expect(ensureTxWrapper(tx)).toBe(tx);
  });
  it('wraps a bare {typeUrl,value} Msg into a single-message body', () => {
    const msg = { typeUrl: '/x.Msg', value: { a: 1 } };
    expect(ensureTxWrapper(msg)).toEqual({ messages: [msg] });
  });
  it('unwraps a `bb build` envelope so the printed next-step command works', () => {
    // `bb build … --output-file tx.json` writes {ok, data, hint, …}, and the
    // hint tells the user to run `bb preview tx.json`. Without this the very
    // command we print fails with invalid_shape.
    const msg = { typeUrl: '/tokenization.MsgCreateCollection', value: { a: 1 } };
    const envelope = { ok: true, data: msg, warnings: [], hint: 'Next: …', error: null };
    expect(ensureTxWrapper(envelope)).toEqual({ messages: [msg] });
  });

  it('unwraps an envelope that already holds a full tx body', () => {
    const tx = { messages: [{ typeUrl: '/x.Msg', value: { a: 1 } }] };
    expect(ensureTxWrapper({ ok: true, data: tx, error: null })).toEqual(tx);
  });

  it('leaves a failed envelope alone rather than previewing null data', () => {
    const failed = { ok: false, data: null, error: { code: 'boom', message: 'no' } };
    expect(ensureTxWrapper(failed)).toBe(failed);
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
  it('exposes --frontend-url with no hard default, so the network can decide', () => {
    const opt = (previewCommand as any).options.find((o: any) => o.long === '--frontend-url');
    expect(opt).toBeDefined();
    expect(opt.defaultValue).toBeUndefined();
  });
  it('exposes --open (review-and-sign in the browser), default off', () => {
    const opt = (previewCommand as any).options.find((o: any) => o.long === '--open');
    expect(opt).toBeDefined();
    expect(opt.defaultValue).toBe(false);
  });
});

describe('frontend base follows the network', () => {
  // The tx is uploaded to whichever indexer --network selects, but the printed
  // link was hard-defaulted to https://bitbadges.io. So `bb preview --local`
  // uploaded locally and handed back a mainnet URL whose prv_ code does not
  // exist there — a dead link, with no error to tell anyone.
  it('points local uploads at the local frontend', () => {
    expect(resolveFrontendBaseForCli({ local: true })).toBe('http://localhost:3000');
    expect(resolveFrontendBaseForCli({ network: 'local' })).toBe('http://localhost:3000');
  });

  it('points testnet uploads at the testnet frontend', () => {
    expect(resolveFrontendBaseForCli({ testnet: true })).toBe('https://testnet.bitbadges.io');
    expect(resolveFrontendBaseForCli({ network: 'testnet' })).toBe('https://testnet.bitbadges.io');
  });

  it('defaults to mainnet', () => {
    expect(resolveFrontendBaseForCli({})).toBe('https://bitbadges.io');
  });

  it('always honors an explicit --frontend-url', () => {
    expect(resolveFrontendBaseForCli({ local: true, frontendUrl: 'https://staging.bitbadges.io' })).toBe('https://staging.bitbadges.io');
  });
});

