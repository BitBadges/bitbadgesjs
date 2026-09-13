import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { bridgeSign } from '../auth/browser-bridge.js';
import { saveSigningRequest, setSigningRequestUrl, finishSigningRequest, getSigningRequestStatus, listSigningRequests } from './signing-requests.js';

const signer = 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';
const request = () => ({
  version: 2 as const,
  requestId: 'a'.repeat(32),
  expectedAddress: signer,
  network: 'mainnet' as const,
  chain: 'cosmos' as const,
  chainId: 'bitbadges-1',
  evmChainId: '50024',
  expiresAt: Date.now() + 60000,
  signOnly: false,
  txsInfo: [{ type: 'MsgSend', msg: {} }]
});
let directory: string;
const original = process.env.BITBADGES_CONFIG_DIR;
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-requests-'));
  process.env.BITBADGES_CONFIG_DIR = directory;
});
afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
  if (original === undefined) delete process.env.BITBADGES_CONFIG_DIR;
  else process.env.BITBADGES_CONFIG_DIR = original;
});

test('persists a private request and refuses overwriting its identity', async () => {
  const value = request();
  saveSigningRequest(value);
  const file = path.join(directory, 'signing-requests', `${value.requestId}.json`);
  if (process.platform !== 'win32') {
    expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    expect(fs.statSync(path.dirname(file)).mode & 0o777).toBe(0o700);
  }
  expect(JSON.parse(fs.readFileSync(file, 'utf8')).request).toEqual(value);
  expect(() => saveSigningRequest(value)).toThrow();
  expect(listSigningRequests()).toEqual([value.requestId]);
  expect(await getSigningRequestStatus(value.requestId)).toMatchObject({ outcome: 'unknown', retrySafe: false, canResume: false });
  await expect(getSigningRequestStatus('../config')).rejects.toThrow();
});

test('a stored callback remains unverified and bound to its original request', async () => {
  const value = request();
  saveSigningRequest(value);
  expect(() => finishSigningRequest(value.requestId, { requestId: 'b'.repeat(32), outcome: 'cancelled' })).toThrow();
  finishSigningRequest(value.requestId, {
    requestId: value.requestId,
    outcome: 'submitted',
    address: signer,
    network: 'mainnet',
    chain: 'cosmos',
    chainId: 'bitbadges-1',
    hash: 'A'.repeat(64)
  });
  expect(await getSigningRequestStatus(value.requestId, true)).toMatchObject({
    outcome: 'submitted',
    confirmed: false,
    verification: 'unverified',
    canResume: false,
    txHash: 'A'.repeat(64)
  });
  expect(() => finishSigningRequest(value.requestId, { requestId: value.requestId, outcome: 'cancelled' })).toThrow();
});

test('resumes the same live listener without creating or submitting a transaction', async () => {
  const value = request();
  saveSigningRequest(value);
  let announce!: (url: string) => void;
  const ready = new Promise<string>((resolve) => {
    announce = resolve;
  });
  const result = bridgeSign({
    mode: 'tx',
    payload: value,
    baseUrl: 'https://example.invalid',
    frontendUrl: 'https://example.invalid',
    noOpen: true,
    printUrl: false,
    timeoutMs: 1000,
    onReady: (url) => {
      setSigningRequestUrl(value.requestId, url);
      announce(url);
    }
  });
  const url = await ready;
  expect(await getSigningRequestStatus(value.requestId)).toMatchObject({ outcome: 'pending', canResume: true });
  expect((await getSigningRequestStatus(value.requestId)).signUrl).toBeUndefined();
  expect(await getSigningRequestStatus(value.requestId, true)).toMatchObject({ requestId: value.requestId, signUrl: url, retrySafe: false });
  const link = new URL(url);
  const callback = new URL(link.searchParams.get('return')!);
  callback.searchParams.set('state', link.searchParams.get('state')!);
  callback.searchParams.set('requestId', value.requestId);
  callback.searchParams.set('outcome', 'cancelled');
  await fetch(callback);
  finishSigningRequest(value.requestId, await result);
  expect(await getSigningRequestStatus(value.requestId, true)).toMatchObject({ outcome: 'cancelled', canResume: false });
  expect(listSigningRequests()).toEqual([value.requestId]);
});

test('expired requests cannot resume, and symlink records are refused', async () => {
  const value = request();
  saveSigningRequest(value);
  const clock = jest.spyOn(Date, 'now').mockReturnValue(value.expiresAt);
  try {
    expect(await getSigningRequestStatus(value.requestId, true)).toMatchObject({ outcome: 'unknown', canResume: false });
  } finally {
    clock.mockRestore();
  }
  const file = path.join(directory, 'signing-requests', `${value.requestId}.json`);
  fs.renameSync(file, `${file}.saved`);
  fs.symlinkSync(`${file}.saved`, file);
  await expect(getSigningRequestStatus(value.requestId)).rejects.toThrow();
});

test('uses OS permissions on Windows rather than rejecting synthetic POSIX mode bits', async () => {
  const value = request();
  saveSigningRequest(value);
  const file = path.join(directory, 'signing-requests', `${value.requestId}.json`);
  fs.chmodSync(file, 0o644);
  if (process.platform !== 'win32') await expect(getSigningRequestStatus(value.requestId)).rejects.toThrow(/private/);
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
  Object.defineProperty(process, 'platform', { value: 'win32' });
  try {
    expect(await getSigningRequestStatus(value.requestId)).toMatchObject({ outcome: 'unknown' });
    fs.renameSync(file, `${file}.saved`);
    fs.symlinkSync(`${file}.saved`, file);
    await expect(getSigningRequestStatus(value.requestId)).rejects.toThrow();
  } finally {
    Object.defineProperty(process, 'platform', platform);
  }
});
