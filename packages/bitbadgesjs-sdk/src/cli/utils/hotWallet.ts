/**
 * Hot-wallet helpers for the CLI.
 *
 * A "hot wallet" here is a throwaway Cosmos signer the CLI generates per
 * broadcast so users (and agents) can create collections without bringing
 * their own wallet. The wallet signs exactly one tx and is intentionally
 * disposable: collection ownership is captured by the `manager` field on
 * the msg, not the signer, so the hot wallet has no lasting authority.
 *
 * Keys are persisted in plaintext under `~/.bitbadges/hot-wallets/` (or
 * `$BITBADGES_CONFIG_DIR/hot-wallets/`) with mode 0600. This is the
 * intentional tradeoff — these wallets are short-lived and low-value, so
 * the ability to recover dust or resume an interrupted broadcast matters
 * more than keystore encryption.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';

import { GenericCosmosAdapter } from '../../signing/adapters/GenericCosmosAdapter.js';
import { BitBadgesSigningClient } from '../../signing/BitBadgesSigningClient.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import { encodeMsgFromJson } from '../../transactions/messages/fromJson.js';
import {
  isCollectionMsg,
  coerceToUniversal,
  normalizeToCreateOrUpdate,
  TYPE_URL_CREATE,
  TYPE_URL_UNIVERSAL
} from './normalizeMsg.js';

// ── Types ────────────────────────────────────────────────────────────────────

export type HotWalletNetwork = NetworkMode;

export type HotWalletStatus =
  | 'pending'
  | 'funded'
  | 'broadcast'
  | 'failed'
  | 'swept';

export interface HotWalletRecord {
  version: 1;
  address: string;
  mnemonic: string;
  network: HotWalletNetwork;
  chainId: string;
  createdAt: string;
  status: HotWalletStatus;
  manager?: string;
  msgTypeUrl?: string;
  txHash?: string;
  collectionId?: string;
  error?: string;
  filePath?: string; // populated on read, not stored
}

// ── Store ────────────────────────────────────────────────────────────────────

function hotWalletDir(): string {
  const base = process.env.BITBADGES_CONFIG_DIR || path.join(os.homedir(), '.bitbadges');
  return path.join(base, 'hot-wallets');
}

function ensureDir(): string {
  const dir = hotWalletDir();
  if (!fs.existsSync(dir)) {
    // 0700 so siblings can't enumerate hot wallets
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  return dir;
}

function recordFilename(record: HotWalletRecord): string {
  const safeTs = record.createdAt.replace(/[:.]/g, '-');
  return `${safeTs}-${record.address}.json`;
}

export function saveHotWallet(record: HotWalletRecord): string {
  const dir = ensureDir();
  const filePath = path.join(dir, recordFilename(record));
  const { filePath: _omit, ...toWrite } = record;
  fs.writeFileSync(filePath, JSON.stringify(toWrite, null, 2), { mode: 0o600 });
  return filePath;
}

export function updateHotWallet(filePath: string, patch: Partial<HotWalletRecord>): HotWalletRecord {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const record = JSON.parse(raw) as HotWalletRecord;
  const next: HotWalletRecord = { ...record, ...patch };
  delete (next as any).filePath;
  fs.writeFileSync(filePath, JSON.stringify(next, null, 2), { mode: 0o600 });
  return { ...next, filePath };
}

export function listHotWallets(): HotWalletRecord[] {
  const dir = hotWalletDir();
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const records: HotWalletRecord[] = [];
  for (const name of entries) {
    const filePath = path.join(dir, name);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as HotWalletRecord;
      records.push({ ...parsed, filePath });
    } catch {
      // Skip unreadable / malformed files rather than erroring out — the
      // user might have hand-edited one.
    }
  }
  records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return records;
}

export function findHotWallet(selector: string): HotWalletRecord | undefined {
  if (fs.existsSync(selector)) {
    const raw = fs.readFileSync(selector, 'utf-8');
    return { ...(JSON.parse(raw) as HotWalletRecord), filePath: selector };
  }
  return listHotWallets().find((r) => r.address === selector || r.filePath === selector);
}

export function deleteHotWallet(filePath: string): void {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// ── Wallet generation ────────────────────────────────────────────────────────

/**
 * Generate a fresh Cosmos hot wallet and persist it to disk under the
 * given network. Uses ethers' random HD wallet (mnemonic-seeded secp256k1
 * on the standard Ethereum derivation path — matches what the rest of the
 * SDK does for server-side Cosmos signing).
 */
export async function generateHotWallet(network: HotWalletNetwork): Promise<{
  record: HotWalletRecord;
  filePath: string;
  adapter: GenericCosmosAdapter;
}> {
  const { Wallet } = await import('ethers');
  const ephemeral = Wallet.createRandom();
  const mnemonic = ephemeral.mnemonic?.phrase;
  if (!mnemonic) {
    throw new Error('Failed to generate random mnemonic');
  }

  const chainId = NETWORK_CONFIGS[network].cosmosChainId;
  const adapter = await GenericCosmosAdapter.fromMnemonic(mnemonic, chainId);

  const record: HotWalletRecord = {
    version: 1,
    address: adapter.address,
    mnemonic,
    network,
    chainId,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  const filePath = saveHotWallet(record);
  return { record: { ...record, filePath }, filePath, adapter };
}

export async function loadHotWalletAdapter(record: HotWalletRecord): Promise<GenericCosmosAdapter> {
  return GenericCosmosAdapter.fromMnemonic(record.mnemonic, record.chainId);
}

// ── Balance + account polling ────────────────────────────────────────────────

/**
 * Query bank balance for an address. Returns 0 if the account is unknown.
 * We fetch via the node LCD directly rather than using
 * BitBadgesSigningClient because this is a read path that doesn't need a
 * signer bound to the balance's address.
 */
export async function fetchBalance(nodeUrl: string, address: string, denom = 'ubadge'): Promise<bigint> {
  const axios = (await import('axios')).default;
  try {
    const res = await axios.get(`${nodeUrl}/cosmos/bank/v1beta1/balances/${address}/by_denom`, {
      params: { denom }
    });
    const amount = res.data?.balance?.amount;
    return amount ? BigInt(amount) : 0n;
  } catch {
    return 0n;
  }
}

/**
 * True once the account exists on-chain with either a non-zero account
 * number (set when any funds first land) or a non-zero balance. For brand
 * new chains where account 0 is a legitimate account, we additionally
 * check the balance so callers don't false-positive on an uninitialized
 * local chain.
 */
export async function accountIsFunded(nodeUrl: string, address: string): Promise<boolean> {
  const balance = await fetchBalance(nodeUrl, address);
  if (balance > 0n) return true;
  // Fallback: check the raw auth endpoint in case someone funds via a
  // zero-amount tx (rare but legal).
  const axios = (await import('axios')).default;
  try {
    const res = await axios.get(`${nodeUrl}/cosmos/auth/v1beta1/accounts/${address}`);
    return !!res.data?.account;
  } catch {
    return false;
  }
}

/** Poll `accountIsFunded` until it returns true or the timeout elapses. */
export async function waitForAccount(
  nodeUrl: string,
  address: string,
  opts: { timeoutMs?: number; intervalMs?: number; onTick?: (elapsedMs: number) => void } = {}
): Promise<boolean> {
  const timeout = opts.timeoutMs ?? 60_000;
  const interval = opts.intervalMs ?? 2_000;
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await accountIsFunded(nodeUrl, address)) return true;
    if (opts.onTick) opts.onTick(Date.now() - started);
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

// ── Faucet ───────────────────────────────────────────────────────────────────

export async function requestFaucet(apiUrl: string, address: string, apiKey?: string): Promise<void> {
  const axios = (await import('axios')).default;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  await axios.post(`${apiUrl}/api/v0/faucet`, { address }, { headers });
}

// ── Msg validation ───────────────────────────────────────────────────────────

/**
 * Decide whether a msg is a supported create-collection shape for the
 * hot-wallet path. Accepts: MsgCreateCollection (already narrowed), and
 * MsgUniversalUpdateCollection in "new collection" mode (no collectionId,
 * or collectionId === '0'). Anything else (update, transfer, approval,
 * etc.) is rejected because the ephemeral signer can't meaningfully own
 * ongoing state.
 */
export function isSupportedHotWalletMsg(msg: any): boolean {
  if (!isCollectionMsg(msg)) return false;
  const t: string = (msg.typeUrl || '').trim();
  if (t === TYPE_URL_CREATE || t.endsWith('.MsgCreateCollection')) return true;
  if (t === TYPE_URL_UNIVERSAL || t.endsWith('.MsgUniversalUpdateCollection')) {
    const id = msg.value?.collectionId;
    if (id === undefined || id === null) return true;
    if (typeof id === 'string' && (id.trim() === '' || id.trim() === '0')) return true;
    if (typeof id === 'number' && id === 0) return true;
    return false;
  }
  return false;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export interface RunHotWalletBroadcastOptions {
  msg: any;
  network: HotWalletNetwork;
  apiUrl: string;
  nodeUrl: string;
  manager?: string;
  fund: 'faucet' | 'manual';
  apiKey?: string;
  fee?: { amount: string; denom: string };
  gas?: number;
  reuseRecord?: HotWalletRecord;
  nonInteractive?: boolean;
  pollTimeoutMs?: number;
}

export interface RunHotWalletBroadcastResult {
  success: boolean;
  txHash?: string;
  collectionId?: string;
  ephemeralAddress: string;
  recoveryPath: string;
  error?: string;
  paused?: boolean; // true when user chose to save-and-exit during polling
}

const DEFAULT_GAS = 400_000;

function isTTY(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function promptLine(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  try {
    return await new Promise<string>((resolve) => rl.question(question, (a) => resolve(a.trim())));
  } finally {
    rl.close();
  }
}

/**
 * Core hot-wallet broadcast flow. Reusable from both the top-level
 * `broadcast-with-hot-wallet` command and `hot-wallet resume`, so a
 * broadcast that gets interrupted mid-poll can be resumed later without
 * losing the funded wallet.
 */
export async function runHotWalletBroadcast(
  opts: RunHotWalletBroadcastOptions
): Promise<RunHotWalletBroadcastResult> {
  // 1. Validate msg shape up front — we never want to generate a wallet
  //    or hit the faucet for a msg that we'll refuse later.
  if (!isSupportedHotWalletMsg(opts.msg)) {
    throw new Error(
      `Unsupported msg for hot-wallet broadcast: ${opts.msg?.typeUrl}. ` +
        `Only MsgCreateCollection and MsgUniversalUpdateCollection (new, collectionId=0) are accepted — ` +
        `the ephemeral signer has no lasting authority, so updates/transfers/approvals cannot use this path.`
    );
  }

  // 2. Wallet: either reuse a provided record or generate fresh.
  let record: HotWalletRecord;
  let adapter: GenericCosmosAdapter;
  let recoveryPath: string;
  if (opts.reuseRecord) {
    record = opts.reuseRecord;
    recoveryPath = record.filePath || saveHotWallet(record);
    adapter = await loadHotWalletAdapter(record);
    process.stderr.write(`Reusing hot wallet ${record.address} (${recoveryPath})\n`);
  } else {
    const gen = await generateHotWallet(opts.network);
    record = gen.record;
    recoveryPath = gen.filePath;
    adapter = gen.adapter;
    process.stderr.write(`Generated hot wallet ${record.address}\n`);
    process.stderr.write(`Recovery file: ${recoveryPath}\n`);
  }

  // 3. Override msg fields on a Universal copy so one code path handles
  //    both Create and Universal inputs. We coerce → universal → override
  //    → normalize at the end so the final typeUrl is the narrow
  //    MsgCreateCollection the chain expects.
  const universal = coerceToUniversal(opts.msg);
  universal.value = { ...(universal.value || {}) };
  universal.value.creator = record.address;
  if (opts.manager) {
    universal.value.manager = opts.manager;
  }
  if (!universal.value.manager) {
    throw new Error(
      'Manager is required — either pass --manager bb1... or include a manager field on the input msg. Refusing to create an orphaned collection owned by the throwaway signer.'
    );
  }
  const narrowed = normalizeToCreateOrUpdate(universal);

  updateHotWallet(recoveryPath, {
    manager: universal.value.manager,
    msgTypeUrl: narrowed.typeUrl
  });

  // 4. Fund the wallet (or skip if it's already funded from a prior run).
  const alreadyFunded = await accountIsFunded(opts.nodeUrl, record.address);
  if (!alreadyFunded) {
    if (opts.fund === 'faucet') {
      process.stderr.write(`Requesting dust from faucet at ${opts.apiUrl} ...\n`);
      try {
        await requestFaucet(opts.apiUrl, record.address, opts.apiKey);
      } catch (err: any) {
        const msg = err?.response?.data?.errorMessage || err?.message || String(err);
        throw new Error(`Faucet request failed: ${msg}`);
      }
    } else {
      process.stderr.write(
        `\nManual funding required. Send any amount of BADGE to:\n  ${record.address}\non network "${opts.network}".\n`
      );
      if (opts.nonInteractive) {
        process.stderr.write(
          `Non-interactive mode — exiting. Run \`bitbadges-cli hot-wallet resume ${record.address}\` after funding.\n`
        );
        updateHotWallet(recoveryPath, { status: 'pending' });
        return { success: false, ephemeralAddress: record.address, recoveryPath, paused: true };
      }
      await promptLine('Press Enter once the funding tx has landed... ');
    }

    // 5. Poll for on-chain funding.
    const pollTimeout = opts.pollTimeoutMs ?? 60_000;
    let attempts = 0;
    // Outer loop lets the user extend polling past the first timeout
    // without losing the funded wallet. Every loop iteration is another
    // `pollTimeout`-ms window.
    while (true) {
      attempts++;
      process.stderr.write(`Waiting for account on-chain (up to ${Math.round(pollTimeout / 1000)}s)...\n`);
      const funded = await waitForAccount(opts.nodeUrl, record.address, { timeoutMs: pollTimeout });
      if (funded) break;

      if (opts.nonInteractive || !isTTY()) {
        process.stderr.write(
          `Still no account on-chain after ${Math.round(pollTimeout / 1000)}s. Non-interactive mode — saving and exiting.\n` +
            `Run \`bitbadges-cli hot-wallet resume ${record.address}\` to retry later.\n`
        );
        updateHotWallet(recoveryPath, { status: 'pending' });
        return { success: false, ephemeralAddress: record.address, recoveryPath, paused: true };
      }

      process.stderr.write(
        `\nStill no account after ${Math.round((pollTimeout * attempts) / 1000)}s. Your hot wallet is saved at ${recoveryPath}.\n`
      );
      const answer = (
        await promptLine('Keep waiting (w) / retry faucet (r) / pause & exit (p) / give up (g)? [w] ')
      ).toLowerCase();
      if (answer === '' || answer === 'w') continue;
      if (answer === 'r' && opts.fund === 'faucet') {
        try {
          await requestFaucet(opts.apiUrl, record.address, opts.apiKey);
          process.stderr.write('Faucet re-requested.\n');
        } catch (err: any) {
          process.stderr.write(`Re-request failed: ${err?.message || err}\n`);
        }
        continue;
      }
      if (answer === 'p') {
        updateHotWallet(recoveryPath, { status: 'pending' });
        return { success: false, ephemeralAddress: record.address, recoveryPath, paused: true };
      }
      if (answer === 'g') {
        updateHotWallet(recoveryPath, { status: 'failed', error: 'User gave up during polling' });
        return {
          success: false,
          ephemeralAddress: record.address,
          recoveryPath,
          error: 'Gave up during polling'
        };
      }
    }
  } else {
    process.stderr.write(`Hot wallet ${record.address} is already funded on-chain — skipping faucet.\n`);
  }

  updateHotWallet(recoveryPath, { status: 'funded' });

  // 6. Convert the JSON msg into a proto Message and broadcast. Wrap in
  //    try/catch so any failure mode updates the recovery file before we
  //    re-throw.
  let protoMsg;
  try {
    protoMsg = encodeMsgFromJson(narrowed);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    updateHotWallet(recoveryPath, { status: 'failed', error: `encode failed: ${errMsg}` });
    throw new Error(`Failed to encode msg for broadcast: ${errMsg}`);
  }

  const signingClient = new BitBadgesSigningClient({
    adapter,
    network: opts.network,
    apiUrl: opts.apiUrl,
    nodeUrl: opts.nodeUrl,
    apiKey: opts.apiKey
  });

  // Force a fresh account-info read — never trust the cached zero from an
  // earlier `accountIsFunded()` check that ran before the faucet landed.
  signingClient.clearCache();

  const fee = {
    amount: opts.fee?.amount ?? '0',
    denom: opts.fee?.denom ?? 'ubadge',
    gas: String(opts.gas ?? DEFAULT_GAS)
  };

  process.stderr.write(`Broadcasting tx (fee=${fee.amount}${fee.denom}, gas=${fee.gas})...\n`);
  const result = await signingClient.signAndBroadcast([protoMsg], {
    fee,
    simulate: false // skip auto-simulate: we want the deterministic zero-fee path
  });

  if (!result.success) {
    updateHotWallet(recoveryPath, {
      status: 'failed',
      error: result.error || `broadcast failed with code ${result.code}`,
      txHash: result.txHash || undefined
    });
    return {
      success: false,
      txHash: result.txHash,
      ephemeralAddress: record.address,
      recoveryPath,
      error: result.error || `broadcast failed with code ${result.code}`
    };
  }

  // Try to pull the created collection ID out of the broadcast response.
  // Sync broadcast responses don't include block events, so if the first
  // pass comes up empty we re-query the tx via LCD once the block lands.
  let collectionId = extractCollectionIdFromResponse(result.rawResponse);
  if (!collectionId && result.txHash) {
    collectionId = await fetchCollectionIdFromTx(opts.nodeUrl, result.txHash);
  }
  updateHotWallet(recoveryPath, {
    status: 'broadcast',
    txHash: result.txHash,
    collectionId
  });

  return {
    success: true,
    txHash: result.txHash,
    collectionId,
    ephemeralAddress: record.address,
    recoveryPath
  };
}

/**
 * Poll the LCD for a given tx hash and pull the created collection ID
 * out of its events. The sync-mode broadcast response returned from the
 * indexer doesn't include block events (check_tx runs before the block
 * commits), so we re-query once the block lands. We try up to ~6s — one
 * extra block at the current ~4s block time is plenty.
 */
async function fetchCollectionIdFromTx(nodeUrl: string, txHash: string): Promise<string | undefined> {
  const axios = (await import('axios')).default;
  const attempts = 3;
  const delayMs = 2_000;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await axios.get(`${nodeUrl}/cosmos/tx/v1beta1/txs/${txHash}`);
      const id = extractCollectionIdFromResponse(res.data);
      if (id) return id;
    } catch {
      // tx not yet indexed — wait and retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return undefined;
}

function extractCollectionIdFromResponse(raw: any): string | undefined {
  // tx_response.events is an array of { type, attributes: [{key,value}] }.
  // BitBadges chain attaches a `collectionId` attribute to the `indexer`
  // event on every universal_update_collection / create_collection tx,
  // so we scan every attribute across every event for the first match
  // rather than hard-coding a specific event type name.
  const events = raw?.tx_response?.events;
  if (!Array.isArray(events)) return undefined;
  for (const ev of events) {
    const attrs: Array<{ key?: string; value?: string }> = ev?.attributes || [];
    for (const a of attrs) {
      if (!a?.key) continue;
      const k = a.key.replace(/"/g, '');
      if (k === 'collectionId' || k === 'collection_id') {
        const v = a.value?.replace(/"/g, '');
        if (v && v !== '0') return v;
      }
    }
  }
  return undefined;
}

// ── Wallet picker ────────────────────────────────────────────────────────────

export interface WalletPickerChoice {
  kind: 'new' | 'reuse';
  record?: HotWalletRecord;
}

/**
 * Interactive picker. Shows the user's existing hot wallets on the given
 * network with live balances, plus a "create new" option. Non-TTY callers
 * bypass the prompt entirely and always get `{ kind: 'new' }`.
 */
export async function pickHotWallet(opts: {
  network: HotWalletNetwork;
  nodeUrl: string;
  forceNew?: boolean;
  reuseSelector?: string;
}): Promise<WalletPickerChoice> {
  if (opts.forceNew) return { kind: 'new' };
  if (opts.reuseSelector) {
    const rec = findHotWallet(opts.reuseSelector);
    if (!rec) throw new Error(`No hot wallet found for selector: ${opts.reuseSelector}`);
    if (rec.network !== opts.network) {
      throw new Error(
        `Hot wallet ${rec.address} is on network "${rec.network}" but you asked to broadcast on "${opts.network}". Refusing to cross networks.`
      );
    }
    return { kind: 'reuse', record: rec };
  }
  if (!isTTY()) return { kind: 'new' };

  const all = listHotWallets().filter((r) => r.network === opts.network);
  if (all.length === 0) return { kind: 'new' };

  // Fetch balances in parallel so the picker doesn't serialize N HTTPs
  const balances = await Promise.all(all.map((r) => fetchBalance(opts.nodeUrl, r.address).catch(() => 0n)));

  process.stderr.write(
    '\n' +
      '\x1b[33m⚠  HOT WALLET — throwaway burner keys, stored in plaintext.\x1b[0m\n' +
      `   Files live under ${hotWalletDir()} with mode 0600.\n` +
      `   Anyone with read access to that folder can spend the dust in these wallets.\n` +
      `   The collection itself is owned by --manager, not the hot wallet, so these keys\n` +
      `   are disposable by design. Don't reuse them for anything of value.\n\n` +
      `Pick a hot wallet for this broadcast (network: ${opts.network}):\n\n` +
      `  [0]  ✨ Create a new hot wallet\n`
  );
  all.forEach((r, i) => {
    const bal = balances[i];
    const balStr = bal === 0n ? '0' : bal.toString();
    const status = r.status.padEnd(9);
    process.stderr.write(
      `  [${i + 1}]  ${r.address}  bal: ${balStr}ubadge  status: ${status}  ${r.createdAt}\n`
    );
  });
  process.stderr.write('\n');

  while (true) {
    const answer = await promptLine(`Choose [0-${all.length}] (default 0): `);
    if (answer === '') return { kind: 'new' };
    const n = Number(answer);
    if (!Number.isInteger(n) || n < 0 || n > all.length) {
      process.stderr.write(`Invalid selection: ${answer}\n`);
      continue;
    }
    if (n === 0) return { kind: 'new' };
    const chosen = all[n - 1];
    if (chosen.status === 'broadcast') {
      const confirm = (
        await promptLine(
          `Wallet already broadcast tx ${chosen.txHash?.slice(0, 10)}... . Reuse anyway? [y/N] `
        )
      ).toLowerCase();
      if (confirm !== 'y' && confirm !== 'yes') continue;
    }
    return { kind: 'reuse', record: chosen };
  }
}
