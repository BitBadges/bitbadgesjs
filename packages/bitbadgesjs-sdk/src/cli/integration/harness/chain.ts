/**
 * Chain + indexer helpers — wait for tx to commit, extract collectionId
 * from tx events, poll the indexer until a collection is queryable.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { loadIntegrationEnv } from './preflight.js';

export interface DeployedTx {
  txHash: string;
  /** Chain code (0 = success). */
  code: number;
  /** First collectionId emitted in events, if any. */
  collectionId?: string;
  /** Block height the tx landed in. */
  height?: number;
  rawLog?: string;
  /**
   * For multi-msg envelopes the chain-binary emits one tx per msg in
   * sequence. `txHash`/`code`/`collectionId` reflect the FIRST tx; the
   * rest land here so callers that care (e.g. asserting all sub-txs
   * succeeded) can inspect them. Empty for single-msg deploys.
   */
  additionalTxs: DeployedTx[];
}

/**
 * Pipe a msg/tx JSON through `bb deploy --with-keyring --from <persona>
 * --local` and execute the printed command synchronously. Returns the
 * tx hash + result extracted from the RPC.
 */
/** Shared real-time sleep. Use sparingly — see pollBalance/poll helpers
 *  which early-exit and are almost always preferable to a fixed sleep. */
export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function deployMsgViaKeyring(
  msgFilePath: string,
  signerName: string,
  network: 'mainnet' | 'testnet' | 'local' = 'local',
  extraDeployFlags: string[] = []
): Promise<DeployedTx> {
  const env = loadIntegrationEnv();
  const cliEntry = path.resolve(__dirname, '../../../../dist/cjs/cli/index.js');
  const networkFlag = `--${network}`;

  // 1. Broadcast via `bb deploy --with-keyring --exec` so a create +
  // later collectionId "0" is rewritten with the new collection id
  // between txs. Print-only is refused for that bundle. Timeout is
  // generous: each step may sleep 6s plus an LCD poll.
  const stdout = execFileSync(
    'node',
    [cliEntry, 'deploy', '--with-keyring', '--exec', '--from', signerName, '--keyring-backend', env.keyringBackend, '--msg-file', msgFilePath, networkFlag, ...extraDeployFlags],
    { encoding: 'utf-8', env: { ...process.env, BB_QUIET: '1' }, timeout: 180000 }
  );
  let primary: string;
  let extras: string[] = [];
  try {
    const env0398 = JSON.parse(stdout);
    if (!env0398?.ok || typeof env0398?.data?.txHash !== 'string') {
      throw new Error(`deploy --with-keyring --exec envelope missing data.txHash:\n${stdout.slice(0, 800)}`);
    }
    primary = env0398.data.txHash;
    const additional = Array.isArray(env0398.data.additionalTxs) ? env0398.data.additionalTxs : [];
    extras = additional.map((t: { txHash?: string }) => t.txHash).filter((h: unknown): h is string => typeof h === 'string');
  } catch (e) {
    throw new Error(`deployMsgViaKeyring failed to parse --exec envelope:\n${String(stdout).slice(0, 800)}\n${e}`);
  }

  // 3. Poll the RPC for each tx result.
  const primaryTx = await waitForTx(primary);
  const additionalTxs: DeployedTx[] = [];
  for (const h of extras) {
    additionalTxs.push(await waitForTx(h));
  }
  return { ...primaryTx, additionalTxs };
}

export async function waitForTx(txHash: string, timeoutMs = 30000): Promise<DeployedTx> {
  const env = loadIntegrationEnv();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const url = `${env.rpcUrl}/tx?hash=0x${txHash}`;
    try {
      const res = execFileSync('curl', ['-sS', url], { encoding: 'utf-8', timeout: 5000 }).toString();
      const parsed = JSON.parse(res);
      if (!parsed.error) {
        const tr = parsed.result?.tx_result ?? {};
        const events: Array<{ type: string; attributes: Array<{ key: string; value: string }> }> = tr.events ?? [];
        let collectionId: string | undefined;
        for (const e of events) {
          for (const a of e.attributes ?? []) {
            if (a.key === 'collectionId' && !collectionId) collectionId = a.value;
          }
        }
        return {
          txHash,
          code: Number(tr.code ?? 0),
          collectionId,
          height: Number(parsed.result?.height ?? 0),
          rawLog: tr.log,
          additionalTxs: []
        };
      }
    } catch {
      // ignore; retry
    }
    await sleep(300);
  }
  throw new Error(`Timed out waiting for tx ${txHash} after ${timeoutMs}ms`);
}

/**
 * Fund a persona from another (rich) persona via `bitbadgeschaind tx bank send`.
 * Useful in setUp before a test that requires the target persona to have
 * a specific denom in their wallet. Returns the tx result.
 *
 * On a fresh local chain, only certain keys (alice) have a genesis allocation
 * across multiple denoms; charlie/bob typically start with dust. Tests that
 * need a payer/buyer/contributor to actually pay should call this first.
 */
export async function fundPersona(
  fromName: string,
  toAddress: string,
  amount: string,
  denom: string,
  options: { network?: 'mainnet' | 'testnet' | 'local'; fees?: string } = {}
): Promise<DeployedTx> {
  const env = loadIntegrationEnv();
  const network = options.network ?? 'local';
  const chainId = network === 'testnet' ? 'bitbadges-2' : 'bitbadges-1';
  const nodeUrl = network === 'local' ? 'http://localhost:26657' : env.rpcUrl;
  let out: string;
  // Same sequence-mismatch retry as deployMsgViaKeyring — bank send is
  // routinely called back-to-back from spec beforeAll() blocks, which
  // hits the same chain-binary race when the previous tx is in mempool.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      out = execFileSync(
        env.chainBin,
        [
          'tx', 'bank', 'send', fromName, toAddress, `${amount}${denom}`,
          '--from', fromName,
          '--chain-id', chainId,
          '--node', nodeUrl,
          '--keyring-backend', env.keyringBackend,
          '--gas', 'auto', '--gas-adjustment', '1.3',
          ...(options.fees ? ['--fees', options.fees] : ['--gas-prices', '10ubadge']),
          '--yes',
          '--output', 'json'
        ],
        { encoding: 'utf-8', timeout: 30000 }
      ).toString();
      break;
    } catch (err: any) {
      const stderr = String(err?.stderr ?? '') + String(err?.stdout ?? '');
      if (/account sequence mismatch/i.test(stderr) && attempt < 2) {
        await sleep(2000);
        continue;
      }
      throw new Error(`fundPersona failed (attempt ${attempt + 1}): ${stderr.slice(0, 400)}`);
    }
  }
  const m = out!.match(/"txhash":\s*"([A-F0-9]+)"/);
  if (!m) throw new Error(`fundPersona: no txhash in output:\n${out!}`);
  return await waitForTx(m[1]);
}

/** Block until the indexer has indexed a collection (returns 200 on GET). */
export async function waitForIndexerCollection(collectionId: string, timeoutMs = 30000): Promise<void> {
  const env = loadIntegrationEnv();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = execFileSync(
        'curl',
        ['-sS', '-o', '/dev/null', '-w', '%{http_code}', `${env.indexerUrl}/api/v0/collection/${collectionId}`],
        { encoding: 'utf-8', timeout: 5000 }
      ).toString().trim();
      if (res === '200') return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  throw new Error(
    `Indexer did not surface collection ${collectionId} after ${timeoutMs}ms. ` +
      `This usually means the indexer is lagging — check that it's running and processing blocks ` +
      `(curl ${env.indexerUrl}/api/v0/status), or bump timeoutMs if the chain is slow.`
  );
}

/**
 * Read an account's on-chain bank balance for one denom (base units,
 * bigint; 0n if absent). Queries the chain binary like fundPersona so
 * it reflects committed state. This is the economic-outcome primitive:
 * status strings / tx.code can't catch a payout that credited the wrong
 * party or an escrow that never drained — a balance read can.
 */
export function getBankBalance(
  address: string,
  denom: string,
  network: 'mainnet' | 'testnet' | 'local' = 'local'
): bigint {
  const env = loadIntegrationEnv();
  const nodeUrl = network === 'local' ? 'http://localhost:26657' : env.rpcUrl;
  try {
    const out = execFileSync(
      env.chainBin,
      ['query', 'bank', 'balances', address, '--node', nodeUrl, '--output', 'json'],
      { encoding: 'utf-8', timeout: 15000 }
    ).toString();
    const parsed = JSON.parse(out);
    const row = (parsed.balances ?? []).find((b: any) => b.denom === denom);
    return BigInt(row?.amount ?? '0');
  } catch {
    return 0n;
  }
}

/**
 * Poll an account's balance until `predicate(amount)` holds or timeout,
 * then return the final amount. EARLY-EXIT — returns the instant the
 * condition is met (don't replace with a fixed sleep). Use to assert a
 * payout landed / escrow drained / refund received despite indexer or
 * block lag. Throws with the last-seen value on timeout.
 */
export async function pollBalance(
  address: string,
  denom: string,
  predicate: (amount: bigint) => boolean,
  opts: { timeoutMs?: number; intervalMs?: number; network?: 'mainnet' | 'testnet' | 'local'; label?: string } = {}
): Promise<bigint> {
  const timeoutMs = opts.timeoutMs ?? 30000;
  const intervalMs = opts.intervalMs ?? 1500;
  const start = Date.now();
  let last = 0n;
  while (Date.now() - start < timeoutMs) {
    last = getBankBalance(address, denom, opts.network ?? 'local');
    if (predicate(last)) return last;
    await sleep(intervalMs);
  }
  throw new Error(
    `pollBalance timed out after ${timeoutMs}ms for ${opts.label ?? `${address} ${denom}`}: ` +
      `last seen ${last} (predicate never satisfied)`
  );
}

/**
 * Read how many of `tokenId` (default 1) `address` holds in a collection,
 * via the indexer balance doc (base units, bigint; 0n if none/absent).
 * The token-holding analogue of getBankBalance — for membership tokens,
 * quest-token receipt, custom-2fa holdings (no coin denom involved).
 */
export function getCollectionTokenAmount(
  collectionId: string,
  address: string,
  tokenId = 1
): bigint {
  const env = loadIntegrationEnv();
  try {
    const out = execFileSync(
      'curl',
      ['-sS', `${env.indexerUrl}/api/v0/collection/${collectionId}/balance/${address}`],
      { encoding: 'utf-8', timeout: 5000 }
    ).toString();
    const doc = JSON.parse(out);
    const balances: any[] = (doc?.balance?.balances ?? doc?.balances ?? []) as any[];
    let total = 0n;
    for (const b of balances) {
      const inRange = (b.tokenIds ?? []).some(
        (r: any) => BigInt(r.start) <= BigInt(tokenId) && BigInt(tokenId) <= BigInt(r.end)
      );
      if (inRange) total += BigInt(b.amount ?? '0');
    }
    return total;
  } catch {
    return 0n;
  }
}

/** Early-exit poll of getCollectionTokenAmount (indexer lag tolerant). */
export async function pollTokenAmount(
  collectionId: string,
  address: string,
  predicate: (amount: bigint) => boolean,
  opts: { tokenId?: number; timeoutMs?: number; intervalMs?: number; label?: string } = {}
): Promise<bigint> {
  const timeoutMs = opts.timeoutMs ?? 30000;
  const intervalMs = opts.intervalMs ?? 1500;
  const start = Date.now();
  let last = 0n;
  while (Date.now() - start < timeoutMs) {
    last = getCollectionTokenAmount(collectionId, address, opts.tokenId ?? 1);
    if (predicate(last)) return last;
    await sleep(intervalMs);
  }
  throw new Error(
    `pollTokenAmount timed out after ${timeoutMs}ms for ${opts.label ?? `${address}@${collectionId}#${opts.tokenId ?? 1}`}: last seen ${last}`
  );
}

/** Fund several personas from one rich signer (sequential — fundPersona
 *  already retries on sequence mismatch). Convenience for multi-party
 *  cluster setup (alice → bob/dave/charlie funding in one call). */
export async function fundMany(
  fromName: string,
  items: Array<{ toAddress: string; amount: string; denom: string }>,
  options: { network?: 'mainnet' | 'testnet' | 'local'; fees?: string } = {}
): Promise<void> {
  for (const it of items) {
    await fundPersona(fromName, it.toAddress, it.amount, it.denom, options);
  }
}

/**
 * Write a msg/tx wrapper JSON to a tmp file and return the path.
 * Convenience wrapper used in many specs.
 */
export function writeMsgToTmp(data: any, suffix = 'msg'): string {
  const p = path.join(os.tmpdir(), `bb-integ-${suffix}-${crypto.randomBytes(4).toString('hex')}.json`);
  fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data), 'utf-8');
  return p;
}
