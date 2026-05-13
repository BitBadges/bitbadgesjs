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
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function deployMsgViaKeyring(
  msgFilePath: string,
  signerName: string,
  network: 'mainnet' | 'testnet' | 'local' = 'local',
  extraDeployFlags: string[] = []
): Promise<DeployedTx> {
  const env = loadIntegrationEnv();
  const cliEntry = path.resolve(__dirname, '../../../../dist/cjs/cli/index.js');
  const networkFlag = `--${network}`;

  // 1. Print the chain-binary command.
  const scriptPath = path.join(os.tmpdir(), `bb-deploy-${crypto.randomBytes(4).toString('hex')}.sh`);
  execFileSync(
    'node',
    [cliEntry, 'deploy', '--with-keyring', '--from', signerName, '--keyring-backend', env.keyringBackend, '--msg-file', msgFilePath, networkFlag, ...extraDeployFlags],
    { stdio: ['ignore', fs.openSync(scriptPath, 'w'), 'pipe'], encoding: 'utf-8', env: { ...process.env, BB_QUIET: '1' }, timeout: 15000 }
  );

  // 2. Execute the printed command. Retry once on "account sequence
  // mismatch" — concurrent specs under --runInBand can still see stale
  // sequence numbers when txs land back-to-back without the indexer
  // catching up. A 2s pause + retry is the cheapest fix.
  let out: string;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      out = execFileSync('bash', [scriptPath], { encoding: 'utf-8', timeout: 60000 }).toString();
      break;
    } catch (err: any) {
      const stderr = String(err?.stderr ?? '') + String(err?.stdout ?? '');
      const isSequenceMismatch = /account sequence mismatch/i.test(stderr);
      if (isSequenceMismatch && attempt < 2) {
        await sleep(2000);
        continue;
      }
      // Truncate the chain-binary's noisy `Usage:` dump in the error
      // message so the test failure is readable.
      const trimmed = stderr.split(/\n/).filter((l) => !l.startsWith('  ') && !l.startsWith('     ')).join('\n').slice(0, 800);
      throw new Error(`deployMsgViaKeyring failed (attempt ${attempt + 1}):\n${trimmed}`);
    }
  }
  // Multi-msg envelopes produce N "txhash: <hex>" lines (one per msg
  // sub-tx, since the chain-binary's tx subcommands only take one msg
  // each — see deploy.ts `buildKeyringMultiCommand`). Capture them all
  // so callers can assert on every sub-tx.
  const matches = [...out!.matchAll(/txhash: ([A-F0-9]+)/g)];
  if (matches.length === 0) {
    throw new Error(`Could not extract txhash from chain-binary output:\n${out!.slice(0, 800)}`);
  }
  const [primary, ...extras] = matches.map((m) => m[1]);

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
          '--fees', options.fees ?? '0ubadge',
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
 * Write a msg/tx wrapper JSON to a tmp file and return the path.
 * Convenience wrapper used in many specs.
 */
export function writeMsgToTmp(data: any, suffix = 'msg'): string {
  const p = path.join(os.tmpdir(), `bb-integ-${suffix}-${crypto.randomBytes(4).toString('hex')}.json`);
  fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data), 'utf-8');
  return p;
}
