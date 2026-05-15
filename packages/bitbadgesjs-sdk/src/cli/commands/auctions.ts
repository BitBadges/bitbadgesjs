/**
 * `bitbadges-cli auctions` — end-user surface for the Auction standard.
 * Mirrors the FE's `AuctionView` + `AuctionBidsTab`.
 */

import { Command } from 'commander';
import { resolveApprovalId } from '../utils/approval-id-options.js';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import { addDeployOptions, runEmitOrDeploy } from '../utils/deploy-options.js';
import { normalizeCollection, validateCollectionOrExit } from '../utils/collection-options.js';
import { resolveAmount } from '../utils/amount.js';
import {
  doesCollectionFollowAuctionProtocol,
  validateAuctionCollection,
  extractAuctionDetails,
  getAuctionStatus,
  buildAuctionBidApproval,
  buildAcceptAuctionBidMsg
} from '../../core/auctions.js';
import { UintRangeArray } from '../../core/uintRanges.js';
async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}
function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, validateAuctionCollection, 'Auction');
}

export const auctionsCommand = new Command('auctions').description(
  'End-user surface for the Auction standard — list / show / status / place-bid / cancel-bid / accept-bid. Build new via `bb build auction`.'
);

addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('list')
      .description('Browse Auction collections.')
      .option('--open', 'Only return bidding/accepting auctions (omit sold / expired)', false)
  )
).action(async (opts: NetworkFlags & OutputFlags & { open?: boolean }) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'auction' });
    const all: any[] = res?.collections?.auction ?? res?.collections ?? [];
    let collections = all.filter((c: any) => doesCollectionFollowAuctionProtocol(c));
    if (opts.open) {
      collections = collections.filter((c: any) => {
        const d = extractAuctionDetails(c.collectionApprovals);
        if (!d) return false;
        const s = getAuctionStatus(d, c);
        return s === 'bidding' || s === 'accepting';
      });
    }
    const summary = collections.map((c: any) => {
      const d = extractAuctionDetails(c.collectionApprovals);
      return {
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        sellerAddress: d?.sellerAddress ?? null,
        bidDeadline: d?.bidDeadline?.toString() ?? null,
        acceptDeadline: d?.acceptDeadline?.toString() ?? null,
        status: d ? getAuctionStatus(d, c) : 'sold'
      };
    });
    emit(summary, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('show')
      .description('Render auction details — seller / deadline / status / mint approval.')
      .argument('<collection-id>', 'Auction collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'auctions show');
    const details = extractAuctionDetails(collection.collectionApprovals);
    const status = details ? getAuctionStatus(details, collection) : 'sold';
    emit({
      collectionId: String(collectionId),
      sellerAddress: details?.sellerAddress ?? null,
      bidDeadline: details?.bidDeadline?.toString() ?? null,
      acceptDeadline: details?.acceptDeadline?.toString() ?? null,
      mintApprovalId: details?.mintApproval?.approvalId ?? null,
      mintEscrowAddress: collection.mintEscrowAddress ?? null,
      status
    }, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('status')
      .description('Resolve current status: bidding / accepting / sold / expired.')
      .argument('<collection-id>', 'Auction collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'auctions status');
    const details = extractAuctionDetails(collection.collectionApprovals);
    const status = details ? getAuctionStatus(details, collection) : 'sold';
    emit({ collectionId: String(collectionId), status }, opts);
  } catch (err) { emitError(err); }
});

addDeployOptions(
addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('place-bid')
      .description('Emit MsgSetIncomingApproval that places a bid on the auction. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Auction collection ID')
      .requiredOption('--creator <address>', 'Bidder address (bb1...) — strict; run `bb account convert` for 0x')
      .requiredOption('--amount <n>', 'Bid amount. Display units when --denom is a symbol (BADGE → 1.5 BADGE), base units when --denom is a chain denom (ubadge / ibc/...). Use --base-units to force base-units.')
      .requiredOption('--denom <symbol|denom>', 'Payment denom. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
      .option('--base-units', 'Treat --amount as already-in-base-units')
      .option('--approval-id <id>', 'Approval id for the bid (random by default)')
  )
)).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; amount: string; denom: string; baseUnits?: boolean; approvalId?: string }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const { denom: paymentDenom, amount: paymentAmountStr } = resolveAmount(
        opts.amount,
        opts.denom,
        Boolean(opts.baseUnits),
        { amountFlag: '--amount', denomFlag: '--denom' }
      );
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'auctions place-bid');
      const details = extractAuctionDetails(collection.collectionApprovals);
      if (!details || !details.mintApproval) {
        process.stderr.write('Error: auction has already settled (no mint approval present); cannot place new bids.\n');
        process.exit(2);
      }
      const transferTimes = details.acceptDeadline > 0n
        ? UintRangeArray.From([{ start: 1n, end: details.acceptDeadline }])
        : UintRangeArray.FullRanges();
      const approvalId = resolveApprovalId(opts);
      const approval = buildAuctionBidApproval({
        bidderAddress: creator,
        tokenId: 1n,
        tokenAmount: 1n,
        paymentDenom,
        paymentAmount: BigInt(paymentAmountStr),
        transferTimes,
        approvalId
      });
      await runEmitOrDeploy({
        typeUrl: '/tokenization.MsgSetIncomingApproval',
        value: { creator, collectionId: String(collectionId), approval }
      }, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
    } catch (err) { emitError(err); }
  }
).addHelpText('after', `
Examples:
  $ bb auctions place-bid 42 --creator bb1abc...xyz --amount 25 --denom USDC | bb deploy
  $ bb auctions place-bid 42 --creator bb1abc...xyz --amount 25000000 --denom USDC --base-units | bb deploy
`);

addDeployOptions(
addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('cancel-bid')
      .description('Emit MsgDeleteIncomingApproval that cancels a bid. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Auction collection ID')
      .argument('<approval-id>', 'Bid approval id to cancel')
      .requiredOption('--creator <address>', 'Bidder address (bb1.../0x — auto-normalized)')
  )
)).action(async (collectionId: string, approvalId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    await runEmitOrDeploy({
      typeUrl: '/tokenization.MsgDeleteIncomingApproval',
      value: { creator, collectionId: String(collectionId), approvalId }
    }, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
  } catch (err) { emitError(err); }
}).addHelpText('after', `
Examples:
  $ bb auctions cancel-bid 42 a1b2c3d4e5f6 --creator bb1abc...xyz | bb deploy
`);

addDeployOptions(
addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('accept-bid')
      .description('Seller-only: emit MsgTransferTokens that fulfills a bid (mint prize to bidder + take payment). Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Auction collection ID')
      .argument('<bid-approval-id>', 'Bid approval id (the bidder\'s incoming-approval id)')
      .requiredOption('--creator <address>', 'Seller address (bb1.../0x — auto-normalized)')
      .requiredOption('--bidder <address>', 'Bidder address (the bid approval\'s owner)')
  )
)).action(
  async (
    collectionId: string,
    bidApprovalId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; bidder: string }
  ) => {
    try {
      const seller = requireBb1AddressStrict(opts.creator, '--creator');
      const bidder = requireBb1AddressStrict(opts.bidder, '--bidder');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'auctions accept-bid');
      const details = extractAuctionDetails(collection.collectionApprovals);
      if (!details || !details.mintApproval) {
        process.stderr.write('Error: auction has already settled; no mint approval to fire.\n');
        process.exit(2);
      }
      if (seller !== details.sellerAddress) {
        process.stderr.write(
          `Warning: --creator ${seller} does not match seller ${details.sellerAddress}. The mint approval will reject this tx.\n`
        );
      }
      await runEmitOrDeploy(
        buildAcceptAuctionBidMsg(seller, String(collectionId), bidApprovalId, bidder, details.mintApproval.approvalId),
        opts,
        { emit: (m) => emit(m, opts), expectedAddress: seller }
      );
    } catch (err) { emitError(err); }
  }
).addHelpText('after', `
Examples:
  $ bb auctions accept-bid 42 a1b2c3d4e5f6 --creator bb1seller...xyz --bidder bb1buyer...xyz | bb deploy
`);

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build auction ...` (the canonical builder) instead.
