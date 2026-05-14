/**
 * `bitbadges-cli prediction-markets` — end-user surface for the Prediction
 * Market standard. Mirrors the FE's `prediction/*` components.
 *
 *   list / show / status                — reads
 *   buy-yes / buy-no                    — MsgSetIncomingApproval
 *   sell-yes / sell-no                  — MsgSetOutgoingApproval
 *   cancel <approval-id>                — MsgDelete{Incoming|Outgoing}Approval
 *   deposit                             — MsgTransferTokens minting YES+NO 1:1
 *   redeem                              — burn-and-redeem (active / push / wins)
 *   resolve                             — verifier MsgCastVote (yes/no/push)
 *   build                               — alias for `bb build prediction-market`
 */

import { Command } from 'commander';
import * as crypto from 'node:crypto';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1Address } from '../utils/address.js';
import {
  validatePredictionMarketCollection,
  classifySettlementApproval,
  derivePredictionMarketStatusFallback,
  buildPredictionMarketBuyIntent,
  buildPredictionMarketSellIntent,
  buildPredictionMarketDepositMsg,
  buildPredictionMarketRedeemTx,
  buildPredictionMarketResolveTx
} from '../../core/prediction-markets.js';
import { UintRangeArray } from '../../core/uintRanges.js';
async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  return res?.collection ?? res;
}
function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  const result = validatePredictionMarketCollection(collection);
  if (!result.valid) {
    process.stderr.write(`Error: collection is not a valid Prediction Market (failed in ${ctx}):\n`);
    for (const e of result.errors) process.stderr.write(`  - ${e}\n`);
    if (result.warnings.length > 0) {
      process.stderr.write('Warnings:\n');
      for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
    }
    process.exit(2);
  }
  if (result.warnings.length > 0 && process.env.BB_QUIET !== '1') {
    process.stderr.write(`Warnings for ${ctx}:\n`);
    for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
  }
}

/** Resolve settlement approval ids by inspecting collection approvals. */
function findSettlementApprovals(collection: any): {
  mintApprovalId?: string;
  redeemApprovalId?: string;
  yesWinsApprovalId?: string;
  noWinsApprovalId?: string;
  pushYesApprovalId?: string;
  pushNoApprovalId?: string;
} {
  const found: Record<string, string> = {};
  for (const a of collection.collectionApprovals ?? []) {
    const cls = classifySettlementApproval(a);
    if (cls === 'wins-yes' && !found.yesWinsApprovalId) found.yesWinsApprovalId = a.approvalId;
    else if (cls === 'wins-no' && !found.noWinsApprovalId) found.noWinsApprovalId = a.approvalId;
    else if (cls === 'push') {
      const tokenId = String(a.tokenIds?.[0]?.start ?? '');
      if (tokenId === '1' && !found.pushYesApprovalId) found.pushYesApprovalId = a.approvalId;
      else if (tokenId === '2' && !found.pushNoApprovalId) found.pushNoApprovalId = a.approvalId;
    }
    // mint approval: from='Mint', to=user (mints YES+NO 1:1).
    if (a.fromListId === 'Mint' && (a.approvalCriteria?.coinTransfers?.length ?? 0) > 0 && !found.mintApprovalId) {
      found.mintApprovalId = a.approvalId;
    }
    // pre-settlement redeem: !Mint -> burn, no coinTransfers (pair-burn returns deposit denom via on-chain logic).
    if (
      a.fromListId === '!Mint' &&
      a.toListId === 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv' &&
      (a.approvalCriteria?.coinTransfers?.length ?? 0) > 0 &&
      cls === 'unknown' &&
      !found.redeemApprovalId
    ) {
      found.redeemApprovalId = a.approvalId;
    }
  }
  return found;
}

export const predictionMarketsCommand = new Command('prediction-markets').description(
  'End-user surface for the Prediction Market standard — list / show / status / buy / sell / cancel / deposit / redeem / resolve. Build new via `bb build prediction-market`.'
);

addOutputFlags(
  addNetworkFlags(
    predictionMarketsCommand
      .command('list')
      .description('Browse Prediction Market collections.')
      .option('--open', 'Only return active markets', false)
  )
).action(async (opts: NetworkFlags & OutputFlags & { open?: boolean }) => {
  try {
    // /browse?category=predictionMarket is unreliable on local/testnet — the
    // indexer doesn't always tag PM rows under that key (was returning 0
    // rows even for known-good PM collections). The /predictions endpoint
    // is the authoritative list; it includes verifier/denom/prices/status.
    const res = await callApi('GET', '/predictions', opts);
    const all: any[] = res?.predictions ?? res?.markets ?? (Array.isArray(res) ? res : []);
    let collections = all;
    if (opts.open) {
      collections = collections.filter((c: any) => c?.status === 'active' || c?.status == null);
    }
    const summary = collections.map((c: any) => ({
      collectionId: String(c.collectionId ?? c._docId ?? ''),
      verifierAddress: c.verifierAddress ?? null,
      depositDenom: c.depositDenom ?? null,
      yesPrice: c.yesPrice ?? null,
      noPrice: c.noPrice ?? null,
      status: c.status ?? null
    }));
    emit(summary, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    predictionMarketsCommand
      .command('show')
      .description('Render market details — verifier / deadline / prices / status.')
      .argument('<collection-id>', 'Prediction Market collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'prediction-markets show');
    // Indexer also surfaces a `/predictions/:id` endpoint with verifier + prices.
    let marketData: any = null;
    try { marketData = await callApi('GET', `/predictions/${encodeURIComponent(collectionId)}`, opts); } catch { /* indexer may not have it yet */ }
    const settle = findSettlementApprovals(collection);
    const indexerStatus = collection?.standardsInfo?.['Prediction Market']?.status;
    emit({
      collectionId: String(collectionId),
      mintEscrowAddress: collection.mintEscrowAddress ?? null,
      settlementApprovals: settle,
      market: marketData ?? null,
      status: indexerStatus ?? derivePredictionMarketStatusFallback(BigInt(marketData?.resolutionDate ?? 0))
    }, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    predictionMarketsCommand
      .command('status')
      .description('Resolve current status: active / closed / resolved-yes / resolved-no / resolved-push.')
      .argument('<collection-id>', 'Prediction Market collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'prediction-markets status');
    const indexerStatus = collection?.standardsInfo?.['Prediction Market']?.status;
    let deadline = 0n;
    try {
      const m = await callApi('GET', `/predictions/${encodeURIComponent(collectionId)}`, opts);
      deadline = BigInt(m?.resolutionDate ?? 0);
    } catch { /* ignore */ }
    emit({
      collectionId: String(collectionId),
      status: indexerStatus ?? derivePredictionMarketStatusFallback(deadline)
    }, opts);
  } catch (err) { emitError(err); }
});

// ── Trade verbs ──────────────────────────────────────────────────────────

function buyAction(side: 'yes' | 'no') {
  return async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; tokenAmount: string; paymentAmount: string; denom: string; expiry?: string; approvalId?: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      await fetchCollection(collectionId, opts).then((c) => validateOrExit(c, `prediction-markets buy-${side}`));
      const end = opts.expiry ? BigInt(opts.expiry) : BigInt(Date.now() + 24 * 60 * 60 * 1000);
      const approvalId = opts.approvalId ?? crypto.randomBytes(16).toString('hex');
      const approval = buildPredictionMarketBuyIntent({
        address: creator,
        collectionId: String(collectionId),
        tokenId: side === 'yes' ? 1n : 2n,
        tokenAmount: BigInt(opts.tokenAmount),
        paymentDenom: opts.denom,
        paymentAmount: BigInt(opts.paymentAmount),
        transferTimes: UintRangeArray.From([{ start: 1n, end }]),
        approvalId
      });
      emit({ typeUrl: '/tokenization.MsgSetIncomingApproval', value: { creator, collectionId: String(collectionId), approval } }, opts);
    } catch (err) { emitError(err); }
  };
}

function sellAction(side: 'yes' | 'no') {
  return async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; tokenAmount: string; paymentAmount: string; denom: string; expiry?: string; approvalId?: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      await fetchCollection(collectionId, opts).then((c) => validateOrExit(c, `prediction-markets sell-${side}`));
      const end = opts.expiry ? BigInt(opts.expiry) : BigInt(Date.now() + 24 * 60 * 60 * 1000);
      const approvalId = opts.approvalId ?? crypto.randomBytes(16).toString('hex');
      const approval = buildPredictionMarketSellIntent({
        address: creator,
        collectionId: String(collectionId),
        tokenId: side === 'yes' ? 1n : 2n,
        tokenAmount: BigInt(opts.tokenAmount),
        paymentDenom: opts.denom,
        paymentAmount: BigInt(opts.paymentAmount),
        transferTimes: UintRangeArray.From([{ start: 1n, end }]),
        approvalId
      });
      emit({ typeUrl: '/tokenization.MsgSetOutgoingApproval', value: { creator, collectionId: String(collectionId), approval } }, opts);
    } catch (err) { emitError(err); }
  };
}

const tradeOpts = (cmd: Command, side: 'yes' | 'no', dir: 'buy' | 'sell') =>
  cmd
    .description(
      `Emit Msg${dir === 'buy' ? 'SetIncomingApproval' : 'SetOutgoingApproval'} that ${dir === 'buy' ? 'buys' : 'sells'} ${side.toUpperCase()} tokens (token-id ${side === 'yes' ? '1' : '2'}). Pipe to \`bb deploy\`.`
    )
    .argument('<collection-id>', 'Prediction Market collection ID')
    .requiredOption('--creator <address>', 'Trader address (bb1.../0x — auto-normalized)')
    .requiredOption('--token-amount <n>', `Quantity of ${side.toUpperCase()} tokens to ${dir}`)
    .requiredOption('--payment-amount <n>', 'Payment side amount in base units')
    .requiredOption('--denom <denom>', 'Payment denom (deposit-denom or badgeslp:* alias)')
    .option('--expiry <ms>', 'Approval expiry (ms-since-epoch). Defaults to 24h from now.')
    .option('--approval-id <id>', 'Override the random approval id');

addOutputFlags(addNetworkFlags(tradeOpts(predictionMarketsCommand.command('buy-yes'), 'yes', 'buy'))).action(buyAction('yes'));
addOutputFlags(addNetworkFlags(tradeOpts(predictionMarketsCommand.command('buy-no'), 'no', 'buy'))).action(buyAction('no'));
addOutputFlags(addNetworkFlags(tradeOpts(predictionMarketsCommand.command('sell-yes'), 'yes', 'sell'))).action(sellAction('yes'));
addOutputFlags(addNetworkFlags(tradeOpts(predictionMarketsCommand.command('sell-no'), 'no', 'sell'))).action(sellAction('no'));

// ── Cancel ───────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    predictionMarketsCommand
      .command('cancel')
      .description('Emit MsgDelete{Incoming|Outgoing}Approval to cancel a buy/sell order. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Prediction Market collection ID')
      .argument('<approval-id>', 'Approval id to cancel')
      .requiredOption('--creator <address>', 'Order owner (bb1.../0x — auto-normalized)')
      .requiredOption('--side <buy|sell>', 'Whether the order is a buy (incoming approval) or sell (outgoing approval)')
  )
).action(async (collectionId: string, approvalId: string, opts: NetworkFlags & OutputFlags & { creator: string; side: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    const isBuy = opts.side === 'buy';
    if (opts.side !== 'buy' && opts.side !== 'sell') {
      process.stderr.write(`Error: --side must be "buy" or "sell" (got "${opts.side}").\n`);
      process.exit(2);
    }
    emit({
      typeUrl: isBuy ? '/tokenization.MsgDeleteIncomingApproval' : '/tokenization.MsgDeleteOutgoingApproval',
      value: { creator, collectionId: String(collectionId), approvalId }
    }, opts);
  } catch (err) { emitError(err); }
});

// ── Deposit ──────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    predictionMarketsCommand
      .command('deposit')
      .description('Mint paired YES+NO tokens 1:1 against the deposit denom. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Prediction Market collection ID')
      .requiredOption('--creator <address>', 'Depositor address (bb1.../0x — auto-normalized)')
      .requiredOption('--amount <n>', 'Number of YES+NO pairs to mint (in base units of the deposit denom)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; amount: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'prediction-markets deposit');
    const settle = findSettlementApprovals(collection);
    if (!settle.mintApprovalId) {
      process.stderr.write('Error: no mint approval found on this prediction market.\n');
      process.exit(2);
    }
    emit(buildPredictionMarketDepositMsg(creator, String(collectionId), BigInt(opts.amount), settle.mintApprovalId), opts);
  } catch (err) { emitError(err); }
});

// ── Redeem ───────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    predictionMarketsCommand
      .command('redeem')
      .description('Build the redeem msgs for the appropriate state (active / push / yes-wins / no-wins). Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Prediction Market collection ID')
      .requiredOption('--creator <address>', 'Holder address (bb1.../0x — auto-normalized)')
      .requiredOption('--state <state>', 'Redeem state: active | push | yes-wins | no-wins')
      .option('--pair-amount <n>', 'Active-state: number of YES+NO pairs to burn (base units)')
      .option('--yes-balance <n>', 'Push/wins-state: caller-known YES balance')
      .option('--no-balance <n>', 'Push/wins-state: caller-known NO balance')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; state: string; pairAmount?: string; yesBalance?: string; noBalance?: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'prediction-markets redeem');
      const settle = findSettlementApprovals(collection);
      const state = opts.state as 'active' | 'push' | 'yes-wins' | 'no-wins';
      if (!['active', 'push', 'yes-wins', 'no-wins'].includes(state)) {
        process.stderr.write(`Error: --state must be one of active | push | yes-wins | no-wins (got "${opts.state}").\n`);
        process.exit(2);
      }
      const tx = buildPredictionMarketRedeemTx({
        creator,
        collectionId: String(collectionId),
        state,
        pairAmount: opts.pairAmount ? BigInt(opts.pairAmount) : undefined,
        yesBalance: opts.yesBalance ? BigInt(opts.yesBalance) : undefined,
        noBalance: opts.noBalance ? BigInt(opts.noBalance) : undefined,
        redeemApprovalId: settle.redeemApprovalId,
        yesWinsApprovalId: settle.yesWinsApprovalId,
        noWinsApprovalId: settle.noWinsApprovalId,
        pushYesApprovalId: settle.pushYesApprovalId,
        pushNoApprovalId: settle.pushNoApprovalId
      });
      if (tx.messages.length === 0) {
        process.stderr.write('No redeemable balance for the given state and inputs.\n');
        emit({ messages: [] }, opts);
        return;
      }
      emit(tx.messages.length === 1 ? tx.messages[0] : tx, opts);
    } catch (err) { emitError(err); }
  }
);

// ── Resolve (verifier) ───────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    predictionMarketsCommand
      .command('resolve')
      .description('Verifier-only: emit MsgCastVote (single for yes/no, 2-msg for push). Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Prediction Market collection ID')
      .requiredOption('--creator <address>', 'Verifier address (bb1.../0x — auto-normalized)')
      .requiredOption('--outcome <outcome>', 'yes | no | push')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; outcome: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'prediction-markets resolve');
    const settle = findSettlementApprovals(collection);
    const outcome = opts.outcome as 'yes' | 'no' | 'push';
    if (!['yes', 'no', 'push'].includes(outcome)) {
      process.stderr.write(`Error: --outcome must be one of yes | no | push (got "${opts.outcome}").\n`);
      process.exit(2);
    }
    const tx = buildPredictionMarketResolveTx(creator, String(collectionId), outcome, settle);
    emit(tx.messages.length === 1 ? tx.messages[0] : tx, opts);
  } catch (err) { emitError(err); }
});

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build prediction-market ...` (the canonical builder) instead.
