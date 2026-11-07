/**
 * `bb deploy --gen-payload` input shapes. It must accept the same inputs as
 * `bb check` / `bb preview` / `bb deploy --browser`, in particular the
 * envelope that `bb build … --output-file` writes.
 */
import { normalizeMessages } from './gen-tx-payload.js';

const msg = { typeUrl: '/tokenization.MsgCreateCollection', value: { creator: 'bb1test' } };

describe('gen-payload normalizeMessages', () => {
  it('accepts a bare Msg', () => {
    expect(normalizeMessages(msg)).toEqual([msg]);
  });

  it('accepts an array of Msgs', () => {
    expect(normalizeMessages([msg, msg])).toHaveLength(2);
  });

  it('accepts a {messages:[...]} tx body', () => {
    expect(normalizeMessages({ messages: [msg] })).toEqual([msg]);
  });

  it('unwraps a `bb build` envelope holding a single Msg', () => {
    expect(normalizeMessages({ ok: true, data: msg, warnings: [] })).toEqual([msg]);
  });

  it('unwraps a `bb build` envelope holding a tx body', () => {
    expect(normalizeMessages({ ok: true, data: { messages: [msg, msg] } })).toHaveLength(2);
  });

  it('rejects a failed envelope with its original error', () => {
    expect(() => normalizeMessages({ ok: false, data: null, error: { code: 'cli_error', message: 'bad flag' } })).toThrow(/\[cli_error\] bad flag/);
  });

  it('rejects an empty messages array', () => {
    expect(() => normalizeMessages({ messages: [] })).toThrow(/empty/);
  });

  it('still rejects malformed messages', () => {
    expect(() => normalizeMessages({ foo: 1 })).toThrow(/typeUrl/);
  });
});
