/**
 * One normalizer for every command that takes a transaction. Three copies of
 * this logic had drifted: only `preview` unwrapped the `bb build` envelope, so
 * `bb simulate tx.json` and `bb check tx.json` rejected the very file that
 * `bb build --output-file tx.json` writes.
 */
import { describeShape, ensureTxWrapper } from './txInput.js';

const msg = { typeUrl: '/tokenization.MsgCreateCollection', value: { collectionId: '0' } };

describe('ensureTxWrapper', () => {
  it('passes a tx body through unchanged', () => {
    const tx = { messages: [msg], memo: 'm' };
    expect(ensureTxWrapper(tx)).toBe(tx);
  });

  it('wraps a bare Msg', () => {
    expect(ensureTxWrapper(msg)).toEqual({ messages: [msg] });
  });

  it('unwraps a `bb build --output-file` envelope holding a single Msg', () => {
    const envelope = { ok: true, data: msg, warnings: [], hint: 'Next: …', error: null };
    expect(ensureTxWrapper(envelope)).toEqual({ messages: [msg] });
  });

  it('unwraps an envelope holding a full tx body', () => {
    const tx = { messages: [msg] };
    expect(ensureTxWrapper({ ok: true, data: tx, error: null })).toEqual(tx);
  });

  it('leaves a failed envelope alone so the shape error reports it', () => {
    const failed = { ok: false, data: null, error: { code: 'boom' } };
    expect(ensureTxWrapper(failed)).toBe(failed);
  });

  it('passes through anything else untouched', () => {
    expect(ensureTxWrapper(null)).toBeNull();
    expect(ensureTxWrapper('-')).toBe('-');
    const weird = { foo: 'bar' };
    expect(ensureTxWrapper(weird)).toBe(weird);
    const noValue = { typeUrl: '/x.Msg' };
    expect(ensureTxWrapper(noValue)).toBe(noValue);
  });
});

describe('describeShape', () => {
  it('names what the caller actually passed', () => {
    expect(describeShape(null)).toBe('null');
    expect(describeShape([1, 2])).toBe('array (length 2)');
    expect(describeShape({ ok: true, data: 1 })).toBe('object with keys [ok, data]');
    expect(describeShape('x')).toBe('string');
  });
});
