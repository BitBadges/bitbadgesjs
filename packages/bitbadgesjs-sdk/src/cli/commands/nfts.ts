/**
 * `bitbadges-cli nfts` — orderbook surface for trading on any collection.
 * Mirrors the FE's OrderbookTab (~2252 LoC). NFTs aren't a standard but an
 * overlay — bid/listing approvals on the user side, recurring_script-style
 * matching for fills.
 *
 *   bid           — MsgSetIncomingApproval (token-id or collection-wide)
 *   list          — MsgSetOutgoingApproval (sell side)
 *   cancel        — MsgDelete{Incoming|Outgoing}Approval
 *   buy           — MsgTransferTokens fills a listing
 *   sell          — MsgTransferTokens fills a bid
 *   orders        — query open bids/listings for a token (or all my orders)
 *   history       — recent activity feed
 *   build         — alias for `bb build nft` (collection creation)
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
import { requireBb1Address, requireBb1AddressStrict } from '../utils/address.js';
import { requireBbDenom } from '../utils/denom.js';
import { resolveAmount } from '../utils/amount.js';
import { parseTimeFlag } from '../utils/time.js';
import {
  buildOrderbookBidApproval,
  buildOrderbookListingApproval,
  buildFillListingMsg,
  buildFillBidMsg
} from '../../core/bids.js';
import { UintRangeArray } from '../../core/uintRanges.js';

export const nftsCommand = new Command('nfts').description(
  'Orderbook trading on BitBadges collections — bid / list / cancel / buy / sell / orders / history / build.'
);

// ── bid (token-id OR collection-wide) ────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    nftsCommand
      .command('bid')
      .description(
        'Emit MsgSetIncomingApproval that places a bid on a token. Omit --token-id for a collection-wide bid (any token in the collection).'
      )
      .argument('<collection-id>', 'Collection ID')
      .requiredOption('--creator <address>', 'Bidder address (bb1...) — strict; run `bb account convert` for 0x')
      .requiredOption('--price <amount>', 'Bid amount. Display units for symbol denoms (USDC → 1.5 USDC), base units for chain denoms (ubadge / ibc/...). Use --base-units to force base-units.')
      .requiredOption('--denom <symbol|denom>', 'Payment denom. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
      .option('--base-units', 'Treat --price as already-in-base-units')
      .option('--token-id <n>', 'Specific token ID to bid on (omit for collection-wide bid)')
      .option('--token-amount <n>', 'Number of tokens (default 1)', '1')
      .option('--expiry <when>', 'Bid expiry: ms-since-epoch (1748140800000) or duration (7d, 24h, monthly). Default 7d.')
      .option('--approval-id <id>', 'Override the random approval id')
      .option('--max-fills <n>', 'Cap on partial fills (default 1)', '1')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & {
      creator: string; price: string; denom: string; baseUnits?: boolean;
      tokenId?: string; tokenAmount?: string; expiry?: string; approvalId?: string; maxFills?: string;
    }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const { denom: paymentDenom, amount: paymentAmountStr } = resolveAmount(
        opts.price,
        opts.denom,
        Boolean(opts.baseUnits),
        { amountFlag: '--price', denomFlag: '--denom' }
      );
      const end = opts.expiry ? parseTimeFlag(opts.expiry, '--expiry') : BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const approvalId = opts.approvalId ?? crypto.randomBytes(16).toString('hex');
      const approval = buildOrderbookBidApproval({
        address: creator,
        tokenId: opts.tokenId ? BigInt(opts.tokenId) : undefined,
        tokenAmount: BigInt(opts.tokenAmount ?? '1'),
        paymentAmount: BigInt(paymentAmountStr),
        paymentDenom,
        transferTimes: UintRangeArray.From([{ start: 1n, end }]),
        approvalId,
        maxNumTransfers: BigInt(opts.maxFills ?? '1')
      });
      emit({ typeUrl: '/tokenization.MsgSetIncomingApproval', value: { creator, collectionId: String(collectionId), approval } }, opts);
    } catch (err) { emitError(err); }
  }
);

// ── list (sell-side outgoing approval) ───────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    nftsCommand
      .command('list')
      .description('Emit MsgSetOutgoingApproval that lists a token for sale.')
      .argument('<collection-id>', 'Collection ID')
      .requiredOption('--creator <address>', 'Seller address (bb1...) — strict; run `bb account convert` for 0x')
      .requiredOption('--token-id <n>', 'Token ID to list')
      .requiredOption('--price <amount>', 'Asking price. Display units for symbol denoms, base units for chain denoms. Use --base-units to force base-units.')
      .requiredOption('--denom <symbol|denom>', 'Payment denom. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
      .option('--base-units', 'Treat --price as already-in-base-units')
      .option('--token-amount <n>', 'Number of tokens (default 1)', '1')
      .option('--max-sales <n>', 'Allow multiple fills of this listing (default 1)', '1')
      .option('--expiry <when>', 'Listing expiry: ms-since-epoch or duration (7d, 30d, monthly). Default 30d.')
      .option('--approval-id <id>', 'Override the random approval id')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & {
      creator: string; tokenId: string; price: string; denom: string; baseUnits?: boolean;
      tokenAmount?: string; maxSales?: string; expiry?: string; approvalId?: string;
    }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const { denom: paymentDenom, amount: paymentAmountStr } = resolveAmount(
        opts.price,
        opts.denom,
        Boolean(opts.baseUnits),
        { amountFlag: '--price', denomFlag: '--denom' }
      );
      const end = opts.expiry ? parseTimeFlag(opts.expiry, '--expiry') : BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const approvalId = opts.approvalId ?? crypto.randomBytes(16).toString('hex');
      const approval = buildOrderbookListingApproval({
        address: creator,
        tokenId: BigInt(opts.tokenId),
        tokenAmount: BigInt(opts.tokenAmount ?? '1'),
        paymentAmount: BigInt(paymentAmountStr),
        paymentDenom,
        transferTimes: UintRangeArray.From([{ start: 1n, end }]),
        approvalId,
        maxNumTransfers: BigInt(opts.maxSales ?? '1')
      });
      emit({ typeUrl: '/tokenization.MsgSetOutgoingApproval', value: { creator, collectionId: String(collectionId), approval } }, opts);
    } catch (err) { emitError(err); }
  }
);

// ── cancel ───────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    nftsCommand
      .command('cancel')
      .description('Cancel a bid or listing. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Collection ID')
      .argument('<approval-id>', 'Approval id to cancel')
      .requiredOption('--creator <address>', 'Order owner address (bb1.../0x — auto-normalized)')
      .requiredOption('--side <bid|listing>', 'Whether the approval is a bid (incoming) or listing (outgoing)')
  )
).action(
  async (
    collectionId: string,
    approvalId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; side: string }
  ) => {
    try {
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      if (opts.side !== 'bid' && opts.side !== 'listing') {
        process.stderr.write(`Error: --side must be "bid" or "listing" (got "${opts.side}").\n`);
        process.exit(2);
      }
      const typeUrl = opts.side === 'bid'
        ? '/tokenization.MsgDeleteIncomingApproval'
        : '/tokenization.MsgDeleteOutgoingApproval';
      emit({ typeUrl, value: { creator, collectionId: String(collectionId), approvalId } }, opts);
    } catch (err) { emitError(err); }
  }
);

// ── buy (fill a listing) ─────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    nftsCommand
      .command('buy')
      .description('Fill an existing listing. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Collection ID')
      .argument('<token-id>', 'Token ID being purchased')
      .requiredOption('--creator <address>', 'Buyer address (bb1.../0x — auto-normalized)')
      .requiredOption('--approval-id <id>', 'Listing approval id (the seller\'s outgoing approval)')
      .requiredOption('--seller <address>', 'Listing owner address')
      .option('--token-amount <n>', 'How many to buy (default 1)', '1')
  )
).action(
  async (
    collectionId: string,
    tokenId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; approvalId: string; seller: string; tokenAmount?: string }
  ) => {
    try {
      const buyer = requireBb1AddressStrict(opts.creator, '--creator');
      const seller = requireBb1AddressStrict(opts.seller, '--seller');
      emit(
        buildFillListingMsg(buyer, String(collectionId), {
          approvalId: opts.approvalId,
          approverAddress: seller,
          tokenId: BigInt(tokenId),
          tokenAmount: BigInt(opts.tokenAmount ?? '1')
        }),
        opts
      );
    } catch (err) { emitError(err); }
  }
);

// ── sell (fill a bid) ────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    nftsCommand
      .command('sell')
      .description('Fill an existing bid. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Collection ID')
      .argument('<token-id>', 'Token ID being sold')
      .requiredOption('--creator <address>', 'Seller address (bb1.../0x — auto-normalized)')
      .requiredOption('--approval-id <id>', 'Bid approval id (the bidder\'s incoming approval)')
      .requiredOption('--bidder <address>', 'Bid owner address')
      .option('--token-amount <n>', 'How many to sell (default 1)', '1')
  )
).action(
  async (
    collectionId: string,
    tokenId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; approvalId: string; bidder: string; tokenAmount?: string }
  ) => {
    try {
      const seller = requireBb1AddressStrict(opts.creator, '--creator');
      const bidder = requireBb1AddressStrict(opts.bidder, '--bidder');
      emit(
        buildFillBidMsg(seller, String(collectionId), {
          approvalId: opts.approvalId,
          approverAddress: bidder,
          tokenId: BigInt(tokenId),
          tokenAmount: BigInt(opts.tokenAmount ?? '1')
        }),
        opts
      );
    } catch (err) { emitError(err); }
  }
);

// ── orders (view open) ───────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    nftsCommand
      .command('orders')
      .description('Query open bids + listings for a token. Use --mine to scope to caller.')
      .argument('<collection-id>', 'Collection ID')
      .argument('<token-id>', 'Token ID')
      .option('--denom <symbol|denom>', 'Optional denom filter. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
      .option('--mine <address>', 'Restrict to orders owned by this address (bb1.../0x — auto-normalized)')
      .option('--collection-offers', 'Also include collection-wide bids', false)
  )
).action(
  async (
    collectionId: string,
    tokenId: string,
    opts: NetworkFlags & OutputFlags & { denom?: string; mine?: string; collectionOffers?: boolean }
  ) => {
    try {
      const denomFilter = opts.denom ? requireBbDenom(opts.denom, '--denom') : undefined;
      const params = denomFilter ? `?denom=${encodeURIComponent(denomFilter)}` : '';
      const [listings, offers, collectionOffers] = await Promise.all([
        callApi('GET', `/collection/${encodeURIComponent(collectionId)}/listings/${encodeURIComponent(tokenId)}${params}`, opts).catch(() => ({ listings: [] })),
        callApi('GET', `/collection/${encodeURIComponent(collectionId)}/offers/${encodeURIComponent(tokenId)}${params}`, opts).catch(() => ({ offers: [] })),
        opts.collectionOffers
          ? callApi('GET', `/collection/${encodeURIComponent(collectionId)}/collectionOffers${params}`, opts).catch(() => ({ offers: [] }))
          : Promise.resolve({ offers: [] })
      ]);

      let bids: any[] = offers?.offers ?? offers?.approvals ?? [];
      let asks: any[] = listings?.listings ?? listings?.approvals ?? [];
      let collBids: any[] = collectionOffers?.offers ?? collectionOffers?.approvals ?? [];

      if (opts.mine) {
        const bb1 = requireBb1Address(opts.mine, '--mine');
        bids = bids.filter((x: any) => (x.approverAddress ?? x.bidder ?? '') === bb1);
        asks = asks.filter((x: any) => (x.approverAddress ?? x.seller ?? '') === bb1);
        collBids = collBids.filter((x: any) => (x.approverAddress ?? x.bidder ?? '') === bb1);
      }

      emit(
        {
          collectionId: String(collectionId),
          tokenId: String(tokenId),
          bids,
          listings: asks,
          ...(opts.collectionOffers ? { collectionBids: collBids } : {})
        },
        opts
      );
    } catch (err) { emitError(err); }
  }
);

// ── history ─────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    nftsCommand
      .command('history')
      .description('Recent fills + activity for a token. Wraps /collection/:id/:tokenId/activity.')
      .argument('<collection-id>', 'Collection ID')
      .argument('<token-id>', 'Token ID')
      .option('--limit <n>', 'Max activity rows (default 50)', '50')
  )
).action(
  async (
    collectionId: string,
    tokenId: string,
    opts: NetworkFlags & OutputFlags & { limit?: string }
  ) => {
    try {
      const limit = Number(opts.limit ?? '50');
      const res = await callApi(
        'GET',
        `/collection/${encodeURIComponent(collectionId)}/${encodeURIComponent(tokenId)}/activity?limit=${limit}`,
        opts
      );
      emit(res, opts);
    } catch (err) { emitError(err); }
  }
);

// (No `build` alias — there's no dedicated NFT-collection builder; use
// `bb build listing` / `bb build bid` for low-level approval construction,
// or use this command's `bid` / `list` verbs which emit the approval
// msgs directly.)
