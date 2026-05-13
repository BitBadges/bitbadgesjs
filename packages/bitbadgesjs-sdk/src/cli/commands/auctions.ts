/**
 * `bitbadges-cli auctions` — end-user surface for the Auction standard.
 * Mirrors the FE's `AuctionView` + `AuctionBidsTab`.
 */

import { Command } from 'commander';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { requireBb1Address } from '../utils/address.js';
import {
  doesCollectionFollowAuctionProtocol,
  validateAuctionCollection,
  extractAuctionDetails,
  deriveAuctionStatus,
  buildAuctionBidApproval,
  buildAcceptAuctionBidMsg
} from '../../core/auctions.js';
import { BitBadgesCollection } from '../../api-indexer/BitBadgesCollection.js';
import { BigIntify } from '../../common/string-numbers.js';
import { UintRangeArray } from '../../core/uintRanges.js';

interface NetworkFlags { testnet?: boolean; local?: boolean; url?: string; apiKey?: string; }
interface OutputFlags { outputFile?: string; condensed?: boolean; }

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL')
    .option('--api-key <key>', 'BitBadges API key');
}
function addOutputFlags(cmd: Command): Command {
  return cmd.option('--output-file <path>', 'Write to file').option('--condensed', 'Single-line JSON', false);
}
function emit(result: unknown, opts: OutputFlags): void {
  const formatted = opts.condensed ? JSON.stringify(result, jsonBigIntReplacer) : JSON.stringify(result, jsonBigIntReplacer, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
  } else process.stdout.write(formatted + '\n');
}
function jsonBigIntReplacer(_k: string, v: unknown): unknown { return typeof v === 'bigint' ? v.toString() : v; }
function emitError(err: unknown): never {
  const e = err as { message?: string; response?: unknown; hint?: string };
  if (e?.response !== undefined) process.stderr.write(JSON.stringify(e.response, null, 2) + '\n');
  else process.stderr.write(`Error: ${e?.message ?? String(err)}\n`);
  if (e?.hint) process.stderr.write(`Hint: ${e.hint}\n`);
  process.exit(1);
}
async function callApi(method: 'GET' | 'POST', path: string, opts: NetworkFlags, body?: unknown): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}
async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  const raw = res?.collection ?? res;
  if (!raw) return raw;
  try { return new BitBadgesCollection(raw).convert(BigIntify); } catch { return raw; }
}
function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  const result = validateAuctionCollection(collection);
  if (!result.valid) {
    process.stderr.write(`Error: collection is not a valid Auction (failed in ${ctx}):\n`);
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

export const auctionsCommand = new Command('auctions').description(
  'End-user surface for the Auction standard — list / show / status / place-bid / cancel-bid / accept-bid / build.'
);

addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('list')
      .description('Browse Auction collections.')
      .option('--open', 'Only return live auctions (not pending-settlement or settled)', false)
  )
).action(async (opts: NetworkFlags & OutputFlags & { open?: boolean }) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'auction' });
    const all: any[] = res?.collections?.auction ?? res?.collections ?? [];
    let collections = all.filter((c: any) => doesCollectionFollowAuctionProtocol(c));
    if (opts.open) {
      collections = collections.filter((c: any) => {
        const d = extractAuctionDetails(c.collectionApprovals);
        return d && deriveAuctionStatus(c.collectionApprovals, d.acceptDeadline) === 'live';
      });
    }
    const summary = collections.map((c: any) => {
      const d = extractAuctionDetails(c.collectionApprovals);
      return {
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        sellerAddress: d?.sellerAddress ?? null,
        acceptDeadline: d?.acceptDeadline?.toString() ?? null,
        status: d ? deriveAuctionStatus(c.collectionApprovals, d.acceptDeadline) : 'settled'
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
    const status = details ? deriveAuctionStatus(collection.collectionApprovals, details.acceptDeadline) : 'settled';
    emit({
      collectionId: String(collectionId),
      sellerAddress: details?.sellerAddress ?? null,
      acceptDeadline: details?.acceptDeadline?.toString() ?? null,
      mintApprovalId: details?.mintApproval.approvalId ?? null,
      mintEscrowAddress: collection.mintEscrowAddress ?? null,
      status
    }, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('status')
      .description('Resolve current status: live / pending-settlement / settled.')
      .argument('<collection-id>', 'Auction collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'auctions status');
    const details = extractAuctionDetails(collection.collectionApprovals);
    const status = details ? deriveAuctionStatus(collection.collectionApprovals, details.acceptDeadline) : 'settled';
    emit({ collectionId: String(collectionId), status }, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('place-bid')
      .description('Emit MsgSetIncomingApproval that places a bid on the auction. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Auction collection ID')
      .requiredOption('--creator <address>', 'Bidder address (bb1.../0x — auto-normalized)')
      .requiredOption('--amount <n>', 'Bid amount in base units')
      .requiredOption('--denom <denom>', 'Payment denom (uusdc / ubadge / ibc/...)')
      .option('--approval-id <id>', 'Approval id for the bid (random by default)')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; amount: string; denom: string; approvalId?: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'auctions place-bid');
      const details = extractAuctionDetails(collection.collectionApprovals);
      if (!details) {
        process.stderr.write('Error: auction has already settled (no mint approval present); cannot place new bids.\n');
        process.exit(2);
      }
      const transferTimes = details.acceptDeadline > 0n
        ? UintRangeArray.From([{ start: 1n, end: details.acceptDeadline }])
        : UintRangeArray.FullRanges();
      const approvalId = opts.approvalId ?? crypto.randomBytes(16).toString('hex');
      const approval = buildAuctionBidApproval({
        bidderAddress: creator,
        tokenId: 1n,
        tokenAmount: 1n,
        paymentDenom: opts.denom,
        paymentAmount: BigInt(opts.amount),
        transferTimes,
        approvalId
      });
      emit({
        typeUrl: '/tokenization.MsgSetIncomingApproval',
        value: { creator, collectionId: String(collectionId), approval }
      }, opts);
    } catch (err) { emitError(err); }
  }
);

addOutputFlags(
  addNetworkFlags(
    auctionsCommand
      .command('cancel-bid')
      .description('Emit MsgDeleteIncomingApproval that cancels a bid. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Auction collection ID')
      .argument('<approval-id>', 'Bid approval id to cancel')
      .requiredOption('--creator <address>', 'Bidder address (bb1.../0x — auto-normalized)')
  )
).action(async (collectionId: string, approvalId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    emit({
      typeUrl: '/tokenization.MsgDeleteIncomingApproval',
      value: { creator, collectionId: String(collectionId), approvalId }
    }, opts);
  } catch (err) { emitError(err); }
});

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
).action(
  async (
    collectionId: string,
    bidApprovalId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; bidder: string }
  ) => {
    try {
      const seller = requireBb1Address(opts.creator, '--creator');
      const bidder = requireBb1Address(opts.bidder, '--bidder');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'auctions accept-bid');
      const details = extractAuctionDetails(collection.collectionApprovals);
      if (!details) {
        process.stderr.write('Error: auction has already settled; no mint approval to fire.\n');
        process.exit(2);
      }
      if (seller !== details.sellerAddress) {
        process.stderr.write(
          `Warning: --creator ${seller} does not match seller ${details.sellerAddress}. The mint approval will reject this tx.\n`
        );
      }
      emit(
        buildAcceptAuctionBidMsg(seller, String(collectionId), bidApprovalId, bidder, details.mintApproval.approvalId),
        opts
      );
    } catch (err) { emitError(err); }
  }
);

auctionsCommand
  .command('build')
  .description('Alias for `bb build auction` — creator-side: construct a CREATE-COLLECTION tx for a new auction.')
  .helpOption(false).allowUnknownOption().allowExcessArguments()
  .action(async () => {
    const { buildCommand } = await import('./build.js');
    const argv = process.argv;
    const startIdx = argv.findIndex((a, i) => a === 'build' && argv[i - 1] === 'auctions');
    const forward = startIdx >= 0 ? argv.slice(startIdx + 1) : [];
    await buildCommand.parseAsync(['auction', ...forward], { from: 'user' });
  });
