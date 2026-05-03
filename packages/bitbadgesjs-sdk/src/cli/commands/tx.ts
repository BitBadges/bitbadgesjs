/**
 * `bitbadges-cli tx` — chain RPC tx-status verb.
 *
 * Closes the post-broadcast loop. After `deploy` returns a txHash, agents
 * need to confirm the tx actually committed; the indexer doesn't expose a
 * tx-by-hash route, so we hit the LCD REST endpoint
 * (`/cosmos/tx/v1beta1/txs/{hash}`) directly. Same `nodeUrl` plumbing
 * `deploy` already uses via `NETWORK_CONFIGS[network].nodeUrl`.
 */
import { Command } from 'commander';
import { addNetworkOptions, resolveNetwork, type NetworkOptions } from '../utils/io.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import {
  Envelope,
  addFormatOptions,
  errorEnvelope,
  resolveFormat,
  successEnvelope,
  writeJsonEnvelope
} from '../utils/envelope.js';

interface TxStatusData {
  /** Which RPC family found the tx. `cosmos` = LCD; `evm` = JSON-RPC. */
  via: 'cosmos' | 'evm';
  hash: string;
  height: string;
  code: number;
  codespace?: string;
  log?: string;
  gasWanted?: string;
  gasUsed?: string;
  timestamp?: string;
  events?: Array<{ type: string; attributes: Array<{ key: string; value: string }> }>;
  collectionId?: string;
}

interface NodeUrlOptions extends NetworkOptions {
  nodeUrl?: string;
  evmRpcUrl?: string;
}

function getNodeUrl(opts: NodeUrlOptions): string {
  if (opts.nodeUrl) return opts.nodeUrl;
  const network = resolveNetwork(opts) as NetworkMode;
  return NETWORK_CONFIGS[network].nodeUrl;
}

function getEvmRpcUrl(opts: NodeUrlOptions): string {
  if (opts.evmRpcUrl) return opts.evmRpcUrl;
  const network = resolveNetwork(opts) as NetworkMode;
  return NETWORK_CONFIGS[network].evmRpcUrl;
}

function normalizeHash(hash: string): string {
  // LCD accepts both upper and lower case hex; strip any leading 0x.
  return hash.replace(/^0x/i, '').toUpperCase();
}

interface FetchResult {
  found: boolean;
  /** Which RPC family produced the result. */
  via?: 'cosmos' | 'evm';
  /** Raw `tx_response` from LCD when found via cosmos. */
  txResponse?: any;
  /** Normalized data shape when found via EVM (skips the LCD-specific path). */
  evmData?: TxStatusData;
  /** HTTP status when the tx wasn't found or the upstream errored. */
  httpStatus?: number;
  /** Error body / message when the upstream returned a non-200. */
  errorBody?: any;
}

async function fetchCosmosTx(nodeUrl: string, hash: string): Promise<FetchResult> {
  const url = `${nodeUrl}/cosmos/tx/v1beta1/txs/${hash}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err: any) {
    throw new Error(`Failed to reach chain RPC at ${nodeUrl}: ${err?.message || err}`);
  }
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (res.status === 200 && body?.tx_response) {
    return { found: true, via: 'cosmos', txResponse: body.tx_response };
  }
  return { found: false, httpStatus: res.status, errorBody: body };
}

/**
 * Fetch a tx by EVM hash via JSON-RPC. BitBadges runs Cosmos+EVM, so txs
 * broadcast through `eth_sendRawTransaction` get a keccak256 hash that the
 * Cosmos LCD doesn't recognize. Falls through here when the LCD lookup
 * 404s and the hash looks EVM-shaped.
 *
 * `eth_getTransactionReceipt` returns `null` for unknown / unmined hashes
 * (not an error), so we treat null as "not yet found" rather than failure.
 */
async function fetchEvmTx(evmRpcUrl: string, hash: string): Promise<FetchResult> {
  const evmHash = '0x' + hash; // hash is already upper-hex with no prefix
  const reqBody = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getTransactionReceipt',
    params: [evmHash.toLowerCase()]
  };
  let res: Response;
  try {
    res = await fetch(evmRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
  } catch (err: any) {
    throw new Error(`Failed to reach EVM RPC at ${evmRpcUrl}: ${err?.message || err}`);
  }
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (res.status !== 200 || body?.error) {
    return { found: false, httpStatus: res.status, errorBody: body };
  }
  const receipt = body?.result;
  if (!receipt) {
    // null result → not yet mined / unknown. Treat as not found, but flag
    // 404-like so `tx wait` keeps polling.
    return { found: false, httpStatus: 404, errorBody: { code: 5, message: 'tx not found via EVM RPC' } };
  }
  // EVM status: '0x1' = success, '0x0' = revert.
  const success = receipt.status === '0x1';
  const heightHex = receipt.blockNumber as string | undefined;
  const gasUsedHex = receipt.gasUsed as string | undefined;
  const data: TxStatusData = {
    via: 'evm',
    hash: hash,
    height: heightHex ? String(parseInt(heightHex, 16)) : '',
    code: success ? 0 : 1,
    log: success ? undefined : 'EVM tx reverted',
    gasUsed: gasUsedHex ? String(parseInt(gasUsedHex, 16)) : undefined
  };
  return { found: true, via: 'evm', evmData: data };
}

/**
 * Fetch tx status, trying Cosmos LCD first and falling through to EVM RPC
 * on a 404. Cosmos hashes are 64 hex (sha256) and EVM hashes are 64 hex
 * (keccak256), so format alone doesn't disambiguate — we just try both.
 */
async function fetchTxStatus(nodeUrl: string, evmRpcUrl: string, hash: string): Promise<FetchResult> {
  const cosmos = await fetchCosmosTx(nodeUrl, hash);
  if (cosmos.found) return cosmos;
  // Only fall through to EVM on a 404; transient LCD errors shouldn't
  // mask themselves with an EVM 404. (404 from EVM gets swallowed too.)
  if (cosmos.httpStatus !== 404) return cosmos;
  try {
    const evm = await fetchEvmTx(evmRpcUrl, hash);
    if (evm.found) return evm;
    // EVM also said not-found → preserve the original LCD 404 for the
    // surface error, but tag the body so the caller knows we tried both.
    return {
      found: false,
      httpStatus: 404,
      errorBody: { tried: ['cosmos', 'evm'], cosmos: cosmos.errorBody, evm: evm.errorBody }
    };
  } catch (err: any) {
    // EVM RPC unreachable → still surface the original LCD 404 (the
    // common case) but include the EVM error in details for diagnostics.
    return {
      found: false,
      httpStatus: 404,
      errorBody: { tried: ['cosmos', 'evm'], cosmos: cosmos.errorBody, evm: { error: err?.message || String(err) } }
    };
  }
}

function extractCollectionId(events: any[] | undefined): string | undefined {
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

function shapeTxData(hash: string, txResponse: any): TxStatusData {
  return {
    via: 'cosmos',
    hash,
    height: String(txResponse.height ?? ''),
    code: Number(txResponse.code ?? 0),
    codespace: txResponse.codespace || undefined,
    log: txResponse.raw_log || txResponse.log || undefined,
    gasWanted: txResponse.gas_wanted ? String(txResponse.gas_wanted) : undefined,
    gasUsed: txResponse.gas_used ? String(txResponse.gas_used) : undefined,
    timestamp: txResponse.timestamp || undefined,
    events: txResponse.events || undefined,
    collectionId: extractCollectionId(txResponse.events)
  };
}

function dataFromResult(hash: string, result: FetchResult): TxStatusData {
  if (result.via === 'evm' && result.evmData) return result.evmData;
  return shapeTxData(hash, result.txResponse);
}

function renderText(data: TxStatusData): string {
  const lines: string[] = [];
  const status = data.code === 0 ? 'committed' : 'failed';
  lines.push(`Status:    ${status}  (code ${data.code}${data.codespace ? `, ${data.codespace}` : ''})`);
  lines.push(`Via:       ${data.via === 'evm' ? 'EVM RPC' : 'Cosmos LCD'}`);
  lines.push(`Hash:      ${data.hash}`);
  if (data.height) lines.push(`Height:    ${data.height}`);
  if (data.gasUsed) lines.push(`Gas used:  ${data.gasUsed}${data.gasWanted ? ` / ${data.gasWanted}` : ''}`);
  if (data.timestamp) lines.push(`Timestamp: ${data.timestamp}`);
  if (data.collectionId) lines.push(`Collection: ${data.collectionId}`);
  if (data.code !== 0 && data.log) lines.push('', `Log: ${data.log}`);
  return lines.join('\n');
}

function emitEnvelope(env: Envelope<unknown>, format: 'json' | 'text', textRender?: () => string): void {
  if (format === 'json') {
    writeJsonEnvelope(env);
  } else if (env.ok && textRender) {
    process.stdout.write(textRender() + '\n');
  } else if (!env.ok) {
    process.stderr.write(`Error: ${env.error?.message ?? 'unknown'}\n`);
  }
}

// ── tx (parent) ────────────────────────────────────────────────────────

export const txCommand = new Command('tx').description(
  'Chain-RPC tx queries — confirm a broadcast txHash committed (and surface its events).'
);

// ── tx status ──────────────────────────────────────────────────────────

addFormatOptions(
  addNetworkOptions(txCommand.command('status'))
    .description('Fetch one tx by hash. Tries Cosmos LCD first, falls through to EVM RPC for keccak256 hashes. Exit 0 on commit, 1 on chain-fail, 2 on RPC error / tx-not-found.')
    .argument('<hash>', 'Tx hash (Cosmos sha256 or EVM keccak256; with or without 0x prefix; case-insensitive)')
    .option('--node-url <url>', 'Chain LCD URL override (defaults to NETWORK_CONFIGS[network].nodeUrl)')
    .option('--evm-rpc-url <url>', 'EVM JSON-RPC URL override (defaults to NETWORK_CONFIGS[network].evmRpcUrl)')
).action(async (hash: string, opts: NodeUrlOptions & { format?: string; json?: boolean }) => {
  const nodeUrl = getNodeUrl(opts);
  const evmRpcUrl = getEvmRpcUrl(opts);
  const format = resolveFormat({ format: opts.format, json: opts.json });
  const normalized = normalizeHash(hash);

  let result: FetchResult;
  try {
    result = await fetchTxStatus(nodeUrl, evmRpcUrl, normalized);
  } catch (err: any) {
    emitEnvelope(errorEnvelope('rpc_error', err?.message || String(err)), format);
    process.exit(2);
  }

  if (!result.found) {
    const code = result.httpStatus === 404 ? 'not_found' : 'rpc_error';
    const msg =
      result.httpStatus === 404
        ? `Tx ${normalized} not found via Cosmos LCD or EVM RPC.`
        : `Upstream returned HTTP ${result.httpStatus} for ${normalized}.`;
    const hint = result.httpStatus === 404
      ? `Tx may not be indexed yet — try \`tx wait ${normalized} --timeout 60\`.`
      : undefined;
    emitEnvelope(errorEnvelope(code, msg, result.errorBody, hint), format);
    process.exit(2);
  }

  const data = dataFromResult(normalized, result);
  const env = successEnvelope(data);
  emitEnvelope(env, format, () => renderText(data));
  process.exit(data.code === 0 ? 0 : 1);
});

// ── tx wait ────────────────────────────────────────────────────────────

addFormatOptions(
  addNetworkOptions(txCommand.command('wait'))
    .description('Poll until a tx commits or fails. Tries Cosmos LCD first, falls through to EVM RPC. Exit 0 on commit, 1 on chain-fail, 2 on timeout.')
    .argument('<hash>', 'Tx hash (Cosmos sha256 or EVM keccak256; with or without 0x prefix; case-insensitive)')
    .option('--node-url <url>', 'Chain LCD URL override')
    .option('--evm-rpc-url <url>', 'EVM JSON-RPC URL override (defaults to NETWORK_CONFIGS[network].evmRpcUrl)')
    .option('--timeout <seconds>', 'Max seconds to wait before exiting non-zero', '60')
    .option('--interval <seconds>', 'Polling interval', '2')
).action(
  async (
    hash: string,
    opts: NodeUrlOptions & { format?: string; json?: boolean; timeout?: string; interval?: string }
  ) => {
    const nodeUrl = getNodeUrl(opts);
    const evmRpcUrl = getEvmRpcUrl(opts);
    const format = resolveFormat({ format: opts.format, json: opts.json });
    const normalized = normalizeHash(hash);
    const timeoutMs = Math.max(1, Number(opts.timeout || '60')) * 1000;
    const intervalMs = Math.max(500, Number(opts.interval || '2') * 1000);
    const deadline = Date.now() + timeoutMs;

    let lastFetchErr: string | undefined;
    while (Date.now() < deadline) {
      let result: FetchResult;
      try {
        result = await fetchTxStatus(nodeUrl, evmRpcUrl, normalized);
      } catch (err: any) {
        lastFetchErr = err?.message || String(err);
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }
      if (result.found) {
        const data = dataFromResult(normalized, result);
        emitEnvelope(successEnvelope(data), format, () => renderText(data));
        process.exit(data.code === 0 ? 0 : 1);
      }
      // 404 = tx not yet indexed (on either side) → keep waiting.
      // Other non-200 → still poll; transient errors shouldn't kill the wait.
      lastFetchErr = result.httpStatus === 404 ? undefined : `upstream HTTP ${result.httpStatus}`;
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    const msg = `Timed out after ${opts.timeout || '60'}s waiting for ${normalized}.${lastFetchErr ? ` Last error: ${lastFetchErr}` : ''}`;
    const env = errorEnvelope(
      'timeout',
      msg,
      { hash: normalized, timeoutSeconds: Number(opts.timeout || '60') },
      `Re-run \`tx status ${normalized}\` later, or extend with --timeout <seconds>.`
    );
    emitEnvelope(env, format);
    process.exit(2);
  }
);
