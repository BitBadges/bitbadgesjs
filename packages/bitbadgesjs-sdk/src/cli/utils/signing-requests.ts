import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { parseBrowserTxRequest, parseBrowserTxResult, type BrowserTxRequestV2, type BrowserTxResultV2 } from '../../core/browser-signing.js';
import { getConfigPath } from './config.js';
import { verifyBrowserReceipt } from '../../core/browser-receipt.js';

type RecordData = { version: 1; createdAt: number; request: BrowserTxRequestV2; url?: string; result?: BrowserTxResultV2 };
const recordSchema = z
  .object({
    version: z.literal(1),
    createdAt: z.number().int().safe().positive(),
    request: z.unknown(),
    url: z.string().url().optional(),
    result: z.unknown().optional()
  })
  .strict();
const validId = /^[a-f0-9]{32}$/;
const directory = () => path.join(path.dirname(getConfigPath()), 'signing-requests');

function privateDirectory(create = false): string {
  const dir = directory();
  if (create) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const stat = fs.lstatSync(dir);
  if (!stat.isDirectory() || (process.platform !== 'win32' && (stat.mode & 0o077) !== 0))
    throw new Error('Signing request directory must be a private directory (mode 0700).');
  return dir;
}

function recordPath(id: string, create = false): string {
  if (!validId.test(id)) throw new Error('Invalid signing request ID. Use bb dev requests list.');
  return path.join(privateDirectory(create), `${id}.json`);
}

function readRecord(id: string): RecordData {
  const file = recordPath(id);
  if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Signing request record cannot be a symbolic link.');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > 128 * 1024 || (process.platform !== 'win32' && (stat.mode & 0o077) !== 0))
      throw new Error('Signing request record must be a private, bounded file.');
    const raw = recordSchema.parse(JSON.parse(fs.readFileSync(fd, 'utf8')));
    const request = parseBrowserTxRequest(raw.request, raw.createdAt);
    if (request.requestId !== id) throw new Error('Signing request record identity mismatch.');
    return { ...raw, request, result: raw.result === undefined ? undefined : parseBrowserTxResult(raw.result, request) };
  } finally {
    fs.closeSync(fd);
  }
}

function updateRecord(record: RecordData): void {
  const file = recordPath(record.request.requestId);
  const temporary = `${file}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(record), { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

export function saveSigningRequest(input: BrowserTxRequestV2): void {
  const createdAt = Date.now();
  const request = parseBrowserTxRequest(input, createdAt);
  fs.writeFileSync(recordPath(request.requestId, true), JSON.stringify({ version: 1, createdAt, request }), { mode: 0o600, flag: 'wx' });
}

export function setSigningRequestUrl(id: string, url: string): void {
  const record = readRecord(id);
  if (record.url || record.result) throw new Error('Signing request already has a listener or final result.');
  new URL(url);
  updateRecord({ ...record, url });
}

export function finishSigningRequest(id: string, input: unknown): void {
  const record = readRecord(id);
  if (record.result) throw new Error('Signing request already has a final result.');
  updateRecord({ ...record, result: parseBrowserTxResult(input, record.request) });
}

export function listSigningRequests(): string[] {
  if (!fs.existsSync(directory())) return [];
  return fs
    .readdirSync(privateDirectory())
    .filter((file) => /^[a-f0-9]{32}\.json$/.test(file))
    .map((file) => file.slice(0, -5))
    .sort();
}

async function listenerIsActive(record: RecordData): Promise<boolean> {
  if (!record.url || Date.now() >= record.request.expiresAt) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1000);
  try {
    const link = new URL(record.url);
    const callback = new URL(link.searchParams.get('return') || '');
    const state = link.searchParams.get('state');
    if (
      callback.protocol !== 'http:' ||
      !['127.0.0.1', 'localhost'].includes(callback.hostname) ||
      callback.username ||
      callback.password ||
      !callback.port ||
      callback.pathname !== '/callback' ||
      !state
    )
      return false;
    const probe = new URL(`http://127.0.0.1:${callback.port}/status`);
    probe.searchParams.set('state', state);
    const response = await fetch(probe, { signal: controller.signal, redirect: 'error' });
    if (!response.ok) return false;
    const result = (await response.json()) as { requestId?: string; pending?: boolean };
    return result.requestId === record.request.requestId && result.pending === true && Date.now() < record.request.expiresAt;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function getSigningRequestStatus(id: string, resume = false, verify = false) {
  let record = readRecord(id);
  const active = !record.result && (await listenerIsActive(record));
  // A callback may arrive while the listener probe is in flight.
  record = readRecord(id);
  const canResume = active && !record.result;
  const result = record.result;
  const outcome = result?.outcome ?? (canResume ? 'pending' : 'unknown');
  const receipt = verify && result && (result.outcome === 'submitted' || result.outcome === 'signed') ? await verifyBrowserReceipt(record.request, result) : undefined;
  return {
    requestId: id,
    outcome: receipt?.status ?? outcome,
    expectedAddress: record.request.expectedAddress,
    network: record.request.network,
    expiresAt: record.request.expiresAt,
    confirmed: receipt?.confirmed ?? false,
    verification: receipt?.confirmed ? 'chain-confirmed' : 'unverified',
    ...(receipt ? { receipt } : {}),
    retrySafe: false,
    canResume,
    ...(result ? { result } : {}),
    ...(result?.outcome === 'submitted' ? { txHash: result.hash } : {}),
    ...(resume && canResume ? { signUrl: record.url } : {}),
    nextStep: canResume
      ? 'Keep the original CLI running. Resume returns the same signing URL; do not start another payment.'
      : outcome === 'unknown'
        ? 'Submission may have occurred. Check wallet activity and chain status before creating a new request.'
        : outcome === 'submitted'
          ? 'Inspect chain execution with bb tx status / bb tx wait, then check the invoice or subscription state.'
          : outcome === 'signed'
            ? 'Signed bytes are not proof of submission. Broadcast only through an authorized signing workflow.'
            : 'Review the recorded result. This command does not create or submit a replacement request.'
  };
}
