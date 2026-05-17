/**
 * `bitbadges-cli swap` — cross-chain swap helpers built on the consolidated
 * `/swap/*` indexer endpoints (assets, chains, balances, estimate, track,
 * status) plus BitBadges' own activity/intent routes.
 *
 * Wallet-agnostic. This command never signs or broadcasts — it only
 * inspects swap state (assets, chains, balances, route estimates, tx
 * tracking, recent activity, listed intents). Signing happens through
 * `deploy` / external wallets, and the broadcast tx-hash is what gets
 * fed into `swap track`.
 *
 * All subcommands fall through `apiRequest` (the same client `bb api`
 * uses), so `--network` / `--testnet` / `--local` / `--url` / `--api-key`
 * flags behave identically.
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireSkipGoDenom } from '../utils/denom.js';
import { appendQuery } from '../utils/list-options.js';
import {
  addDeployOptions,
  isDeployRequested,
  browserBroadcast,
  type DeployOpts,
} from '../utils/deploy-options.js';

// ── swap execute: BitBadges-only detection + signing-flag handoff ───────
//
// `bb swap estimate` returns `estimate.skipGoMsgs` — either a single
// BitBadges-native gamm swap (the only thing the existing deploy signing
// flags can actually sign+broadcast: one Cosmos tx on the BitBadges
// chain), or a Skip:Go-rerouted route (EVM / IBC multi-hop / another
// Cosmos chain) which we deliberately do NOT auto-execute. Detection is
// whole-route, not per-msg first-hop.

interface MultiChainMsg {
  chain_id: string;
  path: string[];
  msg: string;
  msg_type_url: string;
}
interface SkipGoMsg {
  multi_chain_msg?: MultiChainMsg;
  evm_tx?: unknown;
}

function isBitBadgesChain(id?: string): boolean {
  return !!id && id.startsWith('bitbadges');
}

/** Unwrap `{ success, estimate }` or a bare estimate object. */
function extractEstimate(input: any): any {
  if (input && typeof input === 'object' && input.estimate && typeof input.estimate === 'object') {
    return input.estimate;
  }
  return input;
}

export type BitBadgesOnlyClassification =
  | { ok: true; built: { typeUrl: string; value: any }; chainId: string; tokenInSeed?: string }
  | { ok: false; reason: string };

/**
 * Returns the signable `{ typeUrl, value }` when the estimate is a single
 * BitBadges-native gamm swap; otherwise `{ ok: false, reason }`. Pure +
 * exported so the spec can assert the three routing branches directly.
 *
 * The typeUrl is the TxModal alias (`gamm/SwapExactAmountIn`) the `/sign`
 * page's messageTypes registry is keyed by — mirrors the frontend's
 * `parseSkipGoMsgsToTxInfo`. Passing the proto type URL would resolve to a
 * registry miss and the wallet could not reconstruct the msg.
 */
export function classifyBitBadgesOnlySwap(estimateInput: any): BitBadgesOnlyClassification {
  const estimate = extractEstimate(estimateInput);
  if (!estimate || typeof estimate !== 'object') {
    return { ok: false, reason: 'estimate payload missing or not an object' };
  }
  if (estimateInput && estimateInput.success === false) {
    return { ok: false, reason: 'estimate did not succeed; nothing to execute' };
  }
  if (estimate.autoRedirectedToWETH) {
    return { ok: false, reason: 'route auto-redirected to WETH (bridge unwrap requires a second tx)' };
  }
  if (estimate.rerouted) {
    return { ok: false, reason: 'route was rerouted through Skip:Go (not a pure BitBadges-native swap)' };
  }
  const msgs: SkipGoMsg[] = Array.isArray(estimate.skipGoMsgs) ? estimate.skipGoMsgs : [];
  if (msgs.length !== 1) {
    return { ok: false, reason: `route has ${msgs.length} message(s); BitBadges-only is exactly 1` };
  }
  const m = msgs[0];
  if (m.evm_tx) {
    return { ok: false, reason: 'route contains an EVM tx' };
  }
  const mc = m.multi_chain_msg;
  if (!mc) {
    return { ok: false, reason: 'message has neither multi_chain_msg nor evm_tx' };
  }
  if (!isBitBadgesChain(mc.chain_id)) {
    return { ok: false, reason: `message targets non-BitBadges chain "${mc.chain_id}"` };
  }
  if (Array.isArray(estimate.assetPath) && estimate.assetPath.some((p: any) => !isBitBadgesChain(p?.chainId))) {
    return { ok: false, reason: 'asset path leaves the BitBadges chain' };
  }
  const tu = mc.msg_type_url || '';
  if (tu.includes('WithIBCTransfer')) {
    return { ok: false, reason: 'swap includes an IBC transfer leg (lands on another chain)' };
  }
  if (!tu.includes('SwapExactAmountIn')) {
    return { ok: false, reason: `unsupported msg_type_url "${tu}" for BitBadges-only execute` };
  }
  let value: any;
  try {
    value = typeof mc.msg === 'string' ? JSON.parse(mc.msg) : mc.msg;
  } catch (e: any) {
    return { ok: false, reason: `failed to parse multi_chain_msg.msg JSON: ${e?.message || e}` };
  }
  const tokenInSeed =
    value && value.tokenIn && value.tokenIn.amount != null && value.tokenIn.denom
      ? `${value.tokenIn.amount}${value.tokenIn.denom}`
      : undefined;
  return { ok: true, built: { typeUrl: 'gamm/SwapExactAmountIn', value }, chainId: mc.chain_id, tokenInSeed };
}

class SwapExecuteError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Shared by `bb swap execute` and `bb swap estimate --execute`.
 *
 * - BitBadges-only → emit the signable msg (default; pipeable into
 *   `bb deploy`) or, with `--browser`, broadcast via the canonical
 *   `/sign` handoff and optionally auto-`bb swap track`.
 * - Anything else → emit the estimate (so it stays usable) then throw an
 *   explicit NOT_IMPLEMENTED. No partial execution, no orchestrator.
 */
async function runSwapExecute(estimateInput: any, opts: any): Promise<void> {
  const cls = classifyBitBadgesOnlySwap(estimateInput);

  if (!cls.ok) {
    process.stderr.write(
      `\nNot a BitBadges-only swap (${cls.reason}). Cross-chain / EVM / multi-hop ` +
        `auto-execute is NOT implemented. The estimate is returned below — sign it ` +
        `in your wallet via the /sign page, broadcast the first tx, then run ` +
        `\`bb swap track <tx-hash>\`.\n`
    );
    emit({ executable: false, reason: cls.reason, estimate: extractEstimate(estimateInput) }, opts);
    throw new SwapExecuteError(
      'NOT_IMPLEMENTED',
      `Cross-chain / EVM / multi-hop swap auto-execute is not supported (${cls.reason}). ` +
        `Use the /sign page to sign the returned estimate, then \`bb swap track\`.`
    );
  }

  const estimate = extractEstimate(estimateInput);
  const flagged = !!estimate.complianceNotPassedWarning || !!estimate.lowLiquidityWarning;
  if (flagged) {
    const parts = [
      estimate.complianceNotPassedWarning ? 'compliance not passed' : null,
      estimate.lowLiquidityWarning ? 'low liquidity' : null,
    ].filter(Boolean);
    process.stderr.write(
      `\nWarning: route flagged — ${parts.join(' + ')}.` +
        `${estimate.complianceErrorMessage ? ' ' + estimate.complianceErrorMessage : ''}\n`
    );
  }

  if (!isDeployRequested(opts)) {
    // Default: emit the signable msg so `bb swap execute … | bb deploy`
    // and scripting keep working (same contract as every tx-emitting cmd).
    emit(cls.built, opts);
    return;
  }

  if (flagged && !opts.force) {
    throw new SwapExecuteError(
      'FLAGGED_ROUTE',
      'Route is flagged (compliance / low-liquidity). Re-run with --force to broadcast anyway.'
    );
  }

  if (opts.burner) {
    throw new SwapExecuteError(
      'INVALID_INPUT',
      '--burner is CREATE-collection only and cannot sign a gamm swap. Use --browser, ' +
        'or omit the flag to emit the msg and pipe into `bb deploy`.'
    );
  }

  // --browser → reuse the canonical /sign handoff. Multi-msg capable; its
  // messageTypes registry already maps gamm/SwapExactAmountIn.
  const { payload } = await browserBroadcast([cls.built], opts as DeployOpts);
  if (payload?.error) {
    emit(payload, opts);
    throw new SwapExecuteError('BROADCAST_FAILED', `Browser broadcast cancelled or rejected: ${payload.error}`);
  }

  let track: any;
  if (opts.track && payload?.success && payload?.txHash) {
    try {
      const body: Record<string, string> = { txHash: payload.txHash, chainId: cls.chainId };
      if (cls.tokenInSeed) body.tokenIn = cls.tokenInSeed;
      track = await callApi('POST', '/swap/track', opts, body);
    } catch (e: any) {
      track = { tracked: false, error: e?.message || String(e) };
    }
  }
  emit(track ? { ...payload, track } : payload, opts);
  if (!payload?.success) {
    throw new SwapExecuteError('BROADCAST_FAILED', 'Broadcast did not report success.');
  }
}

// ── swap (parent) ──────────────────────────────────────────────────────

export const swapCommand = new Command('swap').description(
  'Cross-chain swap helpers — assets, chains, balances, route estimates, tracking, activity. (Intent Exchange moved to top-level `bb intents`.)'
);

// ── swap assets ─────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('assets'))
    .description('List cross-chain assets (Skip:Go + BitBadges CoinsRegistry + verified asset metadata).')
    .option('--include-svm', 'Include Solana / SVM chain assets', false)
    .option('--include-cw20', 'Include CW20 token assets', false)
).action(async (opts: NetworkFlags & OutputFlags & { includeSvm?: boolean; includeCw20?: boolean }) => {
  try {
    const path = appendQuery('/swap/assets', {
      includeSvm: opts.includeSvm ? 'true' : undefined,
      includeCw20: opts.includeCw20 ? 'true' : undefined
    });
    const res = await callApi('GET', path, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── swap chains ─────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('chains'))
    .description('List cross-chain chain registry entries for BitBadges-allowed chains.')
    .option('--include-svm', 'Include Solana / SVM chains', false)
    .option('--only-testnets', 'Return testnets only', false)
).action(async (opts: NetworkFlags & OutputFlags & { includeSvm?: boolean; onlyTestnets?: boolean }) => {
  try {
    const path = appendQuery('/swap/chains', {
      includeSvm: opts.includeSvm ? 'true' : undefined,
      onlyTestnets: opts.onlyTestnets ? 'true' : undefined
    });
    const res = await callApi('GET', path, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── swap balances ───────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('balances'))
    .description(
      'Fetch consolidated balances. Pass a JSON object mapping chain_id → addresses array (or { address, denoms? }). Use "-" or @file.json to read from stdin/file. For BitBadges chains, response includes server-side wrappable amounts for verified badge denoms.'
    )
    .argument(
      '<chains-to-addresses-json>',
      'JSON like \'{"bitbadges-1": ["bb1..."], "1": [{"address": "0x...", "denoms": ["ethereum-native"]}]}\''
    )
).action(async (chainsArg: string, opts: NetworkFlags & OutputFlags) => {
  try {
    let raw = chainsArg;
    if (chainsArg === '-') raw = fs.readFileSync(0, 'utf-8');
    else if (chainsArg.startsWith('@')) raw = fs.readFileSync(chainsArg.slice(1), 'utf-8');
    const chains = JSON.parse(raw);
    const res = await callApi('POST', '/swap/balances', opts, { chains });
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── swap estimate ───────────────────────────────────────────────────────

addOutputFlags(
  addDeployOptions(
  addNetworkFlags(swapCommand.command('estimate'))
    .description('Estimate a swap from <from-denom> to <to-denom> for <amount>. Honors source/dest chain overrides. With --execute, sign+broadcast a BitBadges-only result via the deploy signing flags.')
    .argument('<from>', 'Token in denom (e.g. "ubadge")')
    .argument('<to>', 'Token out denom (e.g. "uusdc")')
    .argument('<amount>', 'Integer amount of token in (e.g. "1000000" for 1 BADGE at 6 decimals)')
    .option('--source-chain <id>', 'Source chain ID (defaults to "bitbadges-1")')
    .option('--dest-chain <id>', 'Destination chain ID (defaults to "bitbadges-1")')
    .option(
      '--addresses <json>',
      'JSON object mapping chain ID → address (e.g. \'{"bitbadges-1":"bb1...","1":"0x..."}\'). Required for cross-chain routes.'
    )
    .option('--slippage <pct>', 'Slippage tolerance percent (0-100)', '1')
    .option('--local-only', 'Restrict to BitBadges native pools (no Skip:Go rerouting). Both chains must be bitbadges-*.', false)
    .option('--execute', 'Sign + broadcast the estimate when it is a BitBadges-only swap. Reuses the deploy signing flags (--browser); refuses cross-chain / EVM / multi-hop.', false)
    .option('--force', 'With --execute --browser: broadcast even if the route is flagged (compliance / low-liquidity).', false)
    .option('--track', 'With --execute --browser: after a successful broadcast, auto-call `bb swap track` to seed the activity row.', false)
  )
).action(
  async (
    from: string,
    to: string,
    amount: string,
    opts: NetworkFlags &
      OutputFlags &
      DeployOpts & {
        sourceChain?: string;
        destChain?: string;
        addresses?: string;
        slippage?: string;
        localOnly?: boolean;
        execute?: boolean;
        force?: boolean;
        track?: boolean;
      }
  ) => {
    try {
      // Swap accepts origin-chain native denoms (uusdc / uatom / …) and
      // cross-chain ibc/... forms; validate against the permissive
      // Skip:Go contract rather than the strict BitBadges one.
      const fromDenom = requireSkipGoDenom(from, '<from> argument to bb swap estimate');
      const toDenom = requireSkipGoDenom(to, '<to> argument to bb swap estimate');
      const addresses = opts.addresses ? JSON.parse(opts.addresses) : {};
      const body = {
        tokenIn: `${amount}${fromDenom}`,
        tokenInChainId: opts.sourceChain ?? 'bitbadges-1',
        tokenOutDenom: toDenom,
        tokenOutChainId: opts.destChain ?? 'bitbadges-1',
        chainIdsToAddresses: addresses,
        slippageTolerancePercent: opts.slippage ?? '1',
        isLocalOnly: !!opts.localOnly
      };
      const res = await callApi('POST', '/swap/estimate', opts, body);
      if (opts.execute) {
        await runSwapExecute(res, opts);
      } else {
        emit(res, opts);
      }
    } catch (err) {
      emitError(err);
    }
  }
);

// ── swap execute ────────────────────────────────────────────────────────

addOutputFlags(
  addDeployOptions(
    addNetworkFlags(swapCommand.command('execute'))
      .description(
        'Sign + broadcast a BitBadges-only swap from a `bb swap estimate` result. ' +
          'Cross-chain / EVM / multi-hop estimates are returned but NOT auto-executed (throws not-implemented).'
      )
      .argument('[estimate]', "Estimate JSON: omit or '-' for stdin, @file.json, or inline JSON")
      .option('--force', 'Broadcast even if the route is flagged (compliance / low-liquidity).', false)
      .option('--track', 'After a successful broadcast, auto-call `bb swap track` to seed the activity row.', false)
  )
).action(
  async (
    estimateArg: string | undefined,
    opts: NetworkFlags & OutputFlags & DeployOpts & { force?: boolean; track?: boolean }
  ) => {
    try {
      let raw = estimateArg;
      if (!raw || raw === '-') raw = fs.readFileSync(0, 'utf-8');
      else if (raw.startsWith('@')) raw = fs.readFileSync(raw.slice(1), 'utf-8');
      const parsed = JSON.parse(raw);
      await runSwapExecute(parsed, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── swap track ──────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('track'))
    .description(
      'Initiate cross-chain tracking on a broadcast tx. Pairs with `bb swap status` to fetch the current state afterward.'
    )
    .argument('<tx-hash>', 'Broadcast tx hash (Cosmos sha256 or EVM keccak256)')
    .option('--chain-id <id>', 'Source chain ID (e.g. "bitbadges-1", "1")')
    .option('--token-in <amount-denom>', 'Optional token-in seed (e.g. "1000000ubadge") — surfaces in the swap activity row')
).action(
  async (
    txHash: string,
    opts: NetworkFlags & OutputFlags & { chainId?: string; tokenIn?: string }
  ) => {
    try {
      const body: Record<string, string> = { txHash };
      if (opts.chainId) body.chainId = opts.chainId;
      if (opts.tokenIn) body.tokenIn = opts.tokenIn;
      const res = await callApi('POST', '/swap/track', opts, body);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── swap status ─────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('status'))
    .description(
      'Fetch the current status of a tracked cross-chain tx. Use after `bb swap track`.'
    )
    .argument('<tx-hash>', 'Broadcast tx hash (Cosmos sha256 or EVM keccak256)')
    .option('--chain-id <id>', 'Source chain ID (e.g. "bitbadges-1", "1")')
).action(
  async (
    txHash: string,
    opts: NetworkFlags & OutputFlags & { chainId?: string }
  ) => {
    try {
      const path = appendQuery('/swap/status', {
        txHash,
        chainId: opts.chainId
      });
      const res = await callApi('GET', path, opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── swap activities ─────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('activities'))
    .description('List recent swap activities indexed by BitBadges.')
    .option('--bookmark <b>', 'Pagination bookmark from a previous response')
).action(async (opts: NetworkFlags & OutputFlags & { bookmark?: string }) => {
  try {
    const path = appendQuery('/swapActivities', { bookmark: opts.bookmark });
    const res = await callApi('GET', path, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// (Pools and asset-pairs are now top-level `bb pools` / `bb pairs` —
// see commands/pools.ts and commands/pairs.ts. Use registerPools(parent)
// / registerPairs(parent) from those modules to mount the subcommands
// under any parent — the deprecated `swap pools` / `swap asset-pairs`
// alias trees below reuse those same registrars so the surfaces stay
// in lock-step.)

import { registerPools } from './pools.js';
import { registerPairs } from './pairs.js';
import { emitDeprecation } from '../utils/deprecation.js';

// Deprecated `swap pools` — mounts the same subcommand tree as
// `bb pools`, but each terminal action emits a one-line banner first.
// The wrapping action is added via `.hook('preAction', ...)` so the
// banner fires for every nested subcommand without duplicating the
// emit at each leaf.
const swapPoolsAlias = swapCommand
  .command('pools')
  .description('Deprecated alias for `bb pools` — kept for one release.');
swapPoolsAlias.hook('preAction', () => {
  emitDeprecation('bb swap pools', 'bb pools');
});
registerPools(swapPoolsAlias);

const swapPairsAlias = swapCommand
  .command('asset-pairs')
  .description('Deprecated alias for `bb pairs` — kept for one release.');
swapPairsAlias.hook('preAction', () => {
  emitDeprecation('bb swap asset-pairs', 'bb pairs');
});
registerPairs(swapPairsAlias);

// (intents — moved to top-level `bb intents`, with create/fill/cancel/show
// added beyond the original swap-scoped list-only view.)
