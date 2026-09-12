import http from 'http';
import { bridgeSign } from './browser-bridge.js';

const signer = 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';
const payload = () => ({ version: 2 as const, requestId: 'a'.repeat(32), expectedAddress: signer, network: 'mainnet' as const, chain: 'cosmos' as const, chainId: 'bitbadges-1', evmChainId: '50024', expiresAt: Date.now() + 60000, signOnly: false, txsInfo: [{ type: 'MsgSend', msg: {} }] });
const get = (url: string) => new Promise<number>((resolve, reject) => {
  http.get(url, res => { res.resume(); res.on('end', () => resolve(res.statusCode!)); }).on('error', reject);
});

async function launch(mode: 'tx' | 'msg' = 'tx', timeoutMs = 3000) {
  let announce!: (url: URL) => void;
  const announced = new Promise<URL>(resolve => { announce = resolve; });
  const spy = jest.spyOn(process.stderr, 'write').mockImplementation(((chunk: string) => {
    const match = String(chunk).match(/https:\/\/example\.invalid\/sign[^\s]+/);
    if (match) announce(new URL(match[0]));
    return true;
  }) as any);
  const result = bridgeSign({ mode, payload: mode === 'tx' ? payload() : { message: 'hello' }, baseUrl: 'https://example.invalid', frontendUrl: 'https://example.invalid', noOpen: true, timeoutMs });
  const url = await announced;
  spy.mockRestore();
  const callback = new URL(url.searchParams.get('return')!);
  callback.searchParams.set('state', url.searchParams.get('state')!);
  return { callback, result, request: JSON.parse(Buffer.from(url.searchParams.get('payload_inline')!, 'base64url').toString('utf8')) };
}

describe('browser bridge loopback transport', () => {
  test('rejects wrong nonce and malformed outcome without settling, then accepts a bound submission', async () => {
    const { callback, result, request } = await launch();
    const wrong = new URL(callback);
    wrong.searchParams.set('state', 'wrong');
    expect(await get(wrong.toString())).toBe(403);
    expect(await get(callback.toString())).toBe(400);
    for (const [key, value] of Object.entries({ requestId: request.requestId, outcome: 'submitted', address: signer, network: 'mainnet', chain: 'cosmos', chainId: 'bitbadges-1', hash: 'A'.repeat(64) })) callback.searchParams.set(key, value);
    expect(await get(callback.toString())).toBe(200);
    expect(await result).toMatchObject({ outcome: 'submitted', hash: 'A'.repeat(64) });
  });
  test('cancel settles as cancelled rather than success', async () => {
    const { callback, result, request } = await launch();
    callback.searchParams.set('requestId', request.requestId);
    callback.searchParams.set('outcome', 'cancelled');
    expect(await get(callback.toString())).toBe(200);
    expect(await result).toMatchObject({ outcome: 'cancelled', error: 'User cancelled signing' });
  });
  test('legacy personal-sign callback remains compatible', async () => {
    const { callback, result } = await launch('msg');
    callback.searchParams.set('signature', 'legacy-signature');
    callback.searchParams.set('address', signer);
    expect(await get(callback.toString())).toBe(200);
    expect(await result).toMatchObject({ signature: 'legacy-signature', address: signer });
  });
  test('timeout reports uncertainty and closes listener', async () => {
    const { result } = await launch('tx', 30);
    await expect(result).rejects.toThrow(/may.*submitted|submission.*unknown/i);
  });
  test('transaction mode refuses old unbound requests before opening a listener', async () => {
    await expect(bridgeSign({ mode: 'tx', payload: { chain: 'cosmos', txsInfo: [] }, frontendUrl: 'https://example.invalid', baseUrl: 'https://example.invalid', noOpen: true })).rejects.toThrow();
  });
});
