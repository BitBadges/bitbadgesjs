import { assertBrowserRequestBinding, parseBrowserTxRequest, parseBrowserTxResult } from './browser-signing.js';

const address = 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';
const now = 1800000000000;
const request = () => ({
  version: 2, requestId: 'a'.repeat(32), expectedAddress: address,
  network: 'mainnet', chain: 'cosmos', chainId: 'bitbadges-1', evmChainId: '50024',
  expiresAt: now + 60000, signOnly: false,
  txsInfo: [{ type: '/cosmos.bank.v1beta1.MsgSend', msg: { fromAddress: address, toAddress: address, amount: [{ denom: 'ibc/asset', amount: '9007199254740993' }] } }]
});

describe('browser transaction request contract', () => {
  test('preserves exact JSON amounts and returns a detached validated request', () => {
    const raw = request();
    const parsed = parseBrowserTxRequest(raw, now);
    expect(parsed).toEqual(raw);
    raw.txsInfo[0].msg.amount[0].amount = '1';
    expect(parsed.chain === 'cosmos' && (parsed.txsInfo[0].msg.amount as any)[0].amount).toBe('9007199254740993');
  });
  test.each([
    { expectedAddress: '' }, { expectedAddress: 'invalid' }, { expectedAddress: 'Mint' }, { expectedAddress: 'bbvaloper-invalid' }, { requestId: '' },
    { expiresAt: now }, { expiresAt: now + 1800001 }, { expiresAt: NaN },
    { chainId: 'other' }, { evmChainId: '90123' }, { network: 'invalid' },
    { txsInfo: [] }, { txsInfo: [{ type: '', msg: {} }] },
    { txsInfo: [{ type: 'MsgSend', msg: [] }] }, { version: 1 }, { extra: true }
  ])('rejects invalid or ambiguous request %j', (patch) => {
    expect(() => parseBrowserTxRequest({ ...request(), ...patch }, now)).toThrow();
  });
  test('rejects non-JSON and imprecise numeric message input', () => {
    for (const value of [NaN, Infinity, 9007199254740992, 1n, undefined, () => true]) {
      expect(() => parseBrowserTxRequest({ ...request(), txsInfo: [{ type: 'MsgSend', msg: { amount: value } }] }, now)).toThrow();
    }
  });
  test('binds account, network and both chain IDs at signing time', () => {
    const parsed = parseBrowserTxRequest(request(), now);
    const binding = { address, network: 'mainnet', chainId: 'bitbadges-1', evmChainId: '50024' };
    expect(() => assertBrowserRequestBinding(parsed, binding, now)).not.toThrow();
    for (const patch of [{ address: '' }, { network: 'local' }, { chainId: 'other' }, { evmChainId: '90123' }]) {
      expect(() => assertBrowserRequestBinding(parsed, { ...binding, ...patch }, now)).toThrow();
    }
    expect(() => assertBrowserRequestBinding(parsed, binding, parsed.expiresAt)).toThrow();
  });
  test('validates direct EVM requests and refuses sign-only for that mode', () => {
    const { txsInfo, ...base } = request();
    const raw = { ...base, chain: 'evm', chainId: '50024', tx: { to: '0x' + '1'.repeat(40), value: '5', data: '0x' } };
    expect(parseBrowserTxRequest(raw, now).chain).toBe('evm');
    expect(() => parseBrowserTxRequest({ ...raw, signOnly: true }, now)).toThrow();
  });
});

describe('browser transaction outcomes', () => {
  const successful = () => ({ requestId: request().requestId, address, network: 'mainnet', chain: 'cosmos', chainId: 'bitbadges-1', outcome: 'submitted', hash: 'A'.repeat(64) });
  test('a valid hash means submitted, never confirmed', () => {
    const parsed = parseBrowserTxRequest(request(), now);
    expect(parseBrowserTxResult(successful(), parsed).outcome).toBe('submitted');
    expect(() => parseBrowserTxResult({ ...successful(), outcome: 'confirmed' }, parsed)).toThrow();
  });
  test.each([{ requestId: 'b'.repeat(32) }, { address: 'invalid' }, { network: 'local' }, { chainId: 'other' }, { chain: 'evm' }, { hash: 'not-a-hash' }, { signedTx: 'AAAA' }])('rejects mismatched result %j', patch => {
    expect(() => parseBrowserTxResult({ ...successful(), ...patch }, parseBrowserTxRequest(request(), now))).toThrow();
  });
  test('cancelled/error settle without pretending signing occurred', () => {
    for (const outcome of ['cancelled', 'error']) {
      expect(parseBrowserTxResult({ requestId: request().requestId, outcome, error: 'Wallet closed' }, parseBrowserTxRequest(request(), now)).outcome).toBe(outcome);
    }
  });
  test('unknown is request-bound and cannot carry a success claim', () => {
    const parsed = parseBrowserTxRequest(request(), now);
    const result = { requestId: parsed.requestId, outcome: 'unknown', error: 'Check wallet activity before retrying' };
    expect(parseBrowserTxResult(result, parsed)).toEqual(result);
    expect(() => parseBrowserTxResult({ ...result, requestId: 'b'.repeat(32) }, parsed)).toThrow();
    expect(() => parseBrowserTxResult({ ...result, hash: 'A'.repeat(64) }, parsed)).toThrow();
  });
  test('sign-only rejects a submitted result, and broadcast rejects signed bytes', () => {
    const signOnly = parseBrowserTxRequest({ ...request(), signOnly: true }, now);
    expect(() => parseBrowserTxResult(successful(), signOnly)).toThrow();
    const { hash, ...base } = successful();
    expect(() => parseBrowserTxResult({ ...base, outcome: 'signed', signedTx: 'AAAA' }, parseBrowserTxRequest(request(), now))).toThrow();
    expect(parseBrowserTxResult({ ...base, outcome: 'signed', signedTx: 'AAAA' }, signOnly).outcome).toBe('signed');
    expect(() => parseBrowserTxResult({ ...base, outcome: 'signed', signedTx: 'AAAA'.repeat(1025) }, signOnly)).toThrow(/callback.*limit|limit.*callback/i);
  });
});
