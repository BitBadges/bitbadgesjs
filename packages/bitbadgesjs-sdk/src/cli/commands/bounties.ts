/**
 * `bitbadges-cli bounties` — end-user surface for the Bounty standard,
 * mirroring the frontend's `BountyView`.
 *
 *   bounties list          — browse open Bounty collections
 *   bounties show          — render details (escrow, verifier, recipient, expiry, status)
 *   bounties accept        — verifier action: 2-msg vote + transfer (atomic via /sign or --burner; sequential via --with-keyring)
 *   bounties deny          — verifier action: same 2-msg shape targeting the deny approval
 *   bounties claim-refund  — single MsgTransferTokens against the expire approval (post-deadline)
 *   bounties status        — resolve accepted / denied / pending / expired
 *
 * Creator-side construction lives at `bb build bounty` — the
 * per-standard `build` subcommand was removed in CLI v2 (#0399).
 *
 * Every subcommand validates conformance via the SDK validators before
 * emitting anything. Accept/deny output is a multi-msg tx wrapper
 * `{messages: [...]}` — `bb deploy` was widened to accept this shape in
 * the same PR series.
 */

import { Command } from 'commander';
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
import {
  doesCollectionFollowBountyProtocol,
  validateBountyCollection,
  extractBountyDetails,
  deriveBountyStatusFallback,
  isExpireApprovalExecuted,
  buildBountyAcceptTx,
  buildBountyDenyTx,
  buildBountyRefundMsg,
  type BountyStatus
} from '../../core/bounties.js';

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  return res?.collection ?? res;
}

function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  const result = validateBountyCollection(collection);
  if (!result.valid) {
    process.stderr.write(`Error: collection is not a valid Bounty (failed in ${ctx}):\n`);
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

function resolveStatus(collection: any, expirationTime: bigint): BountyStatus {
  const indexerStatus = collection?.standardsInfo?.Bounty?.status as BountyStatus | undefined;
  return indexerStatus ?? deriveBountyStatusFallback(expirationTime);
}

// ── bounties (parent) ────────────────────────────────────────────────────

export const bountiesCommand = new Command('bounties').description(
  'End-user surface for the Bounty standard — list / show / accept / deny / claim-refund / status. Build new via `bb build bounty`. Accept and deny emit a {messages:[vote, transfer]} multi-msg tx wrapper.'
);

// ── bounties list ────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    bountiesCommand
      .command('list')
      .description('Browse Bounty collections. Optional filters scope to caller + active set.')
      .option('--mine <address>', 'Restrict to bounties where caller is verifier / submitter / recipient (bb1.../0x — auto-normalized)')
      .option('--open', 'Only return pending (not accepted/denied/expired) bounties', false)
  )
).action(async (opts: NetworkFlags & OutputFlags & { mine?: string; open?: boolean }) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'bounty' });
    const all: any[] = res?.collections?.bounty ?? res?.collections ?? [];
    let collections = all.filter((c: any) => doesCollectionFollowBountyProtocol(c));

    if (opts.mine) {
      const bb1 = requireBb1Address(opts.mine, '--mine');
      collections = collections.filter((c: any) => {
        const details = extractBountyDetails(c.collectionApprovals);
        if (!details) return false;
        return (
          details.verifierAddress === bb1 ||
          details.submitterAddress === bb1 ||
          details.recipientAddress === bb1
        );
      });
    }
    if (opts.open) {
      collections = collections.filter((c: any) => {
        const details = extractBountyDetails(c.collectionApprovals);
        if (!details) return false;
        return resolveStatus(c, details.expirationTime) === 'pending';
      });
    }

    const summary = collections.map((c: any) => {
      const details = extractBountyDetails(c.collectionApprovals)!;
      return {
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        verifierAddress: details.verifierAddress,
        recipientAddress: details.recipientAddress,
        submitterAddress: details.submitterAddress,
        depositCoins: details.depositCoins.map((coin) => ({ denom: coin.denom, amount: coin.amount.toString() })),
        expirationTime: details.expirationTime.toString(),
        status: resolveStatus(c, details.expirationTime)
      };
    });
    emit(summary, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── bounties show ────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    bountiesCommand
      .command('show')
      .description('Render a Bounty collection — escrow balance, verifier, recipient, submitter, expiry, status.')
      .argument('<collection-id>', 'Bounty collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'bounties show');
    const details = extractBountyDetails(collection.collectionApprovals)!;
    const status = resolveStatus(collection, details.expirationTime);
    const expireExecuted = status === 'expired' && isExpireApprovalExecuted(details.expireApproval, collection);
    emit(
      {
        collectionId: String(collectionId),
        verifierAddress: details.verifierAddress,
        recipientAddress: details.recipientAddress,
        submitterAddress: details.submitterAddress,
        depositCoins: details.depositCoins.map((coin) => ({
          denom: coin.denom,
          amount: coin.amount.toString()
        })),
        expirationTime: details.expirationTime.toString(),
        mintEscrowAddress: collection.mintEscrowAddress ?? null,
        status,
        expireExecuted
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

// ── bounties status ──────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    bountiesCommand
      .command('status')
      .description('Resolve current status: accepted / denied / pending / expired (+ expireExecuted flag).')
      .argument('<collection-id>', 'Bounty collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'bounties status');
    const details = extractBountyDetails(collection.collectionApprovals)!;
    const status = resolveStatus(collection, details.expirationTime);
    const expireExecuted = status === 'expired' && isExpireApprovalExecuted(details.expireApproval, collection);
    emit({ collectionId: String(collectionId), status, expireExecuted }, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── bounties accept ──────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    bountiesCommand
      .command('accept')
      .description(
        'Verifier action: emit {messages:[MsgCastVote, MsgTransferTokens]} that votes yes + executes the accept approval. Pipe to `bb deploy`.'
      )
      .argument('<collection-id>', 'Bounty collection ID')
      .requiredOption('--creator <address>', 'Verifier address (bb1.../0x — auto-normalized)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'bounties accept');
    const details = extractBountyDetails(collection.collectionApprovals)!;
    if (creator !== details.verifierAddress) {
      process.stderr.write(
        `Warning: --creator ${creator} is not the verifier (${details.verifierAddress}). The vote will be rejected on-chain.\n`
      );
    }
    const tx = buildBountyAcceptTx(creator, String(collectionId), details.acceptApproval);
    emit(tx, opts);
  } catch (err) {
    emitError(err);
  }
}).addHelpText('after', `
Examples:
  $ bb bounties accept 17 --creator bb1verifier...xyz | bb deploy
`);

// ── bounties deny ────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    bountiesCommand
      .command('deny')
      .description(
        'Verifier action: emit {messages:[MsgCastVote, MsgTransferTokens]} that votes yes on the deny approval (refunds submitter). Pipe to `bb deploy`.'
      )
      .argument('<collection-id>', 'Bounty collection ID')
      .requiredOption('--creator <address>', 'Verifier address (bb1.../0x — auto-normalized)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'bounties deny');
    const details = extractBountyDetails(collection.collectionApprovals)!;
    if (creator !== details.verifierAddress) {
      process.stderr.write(
        `Warning: --creator ${creator} is not the verifier (${details.verifierAddress}). The vote will be rejected on-chain.\n`
      );
    }
    const tx = buildBountyDenyTx(creator, String(collectionId), details.denyApproval);
    emit(tx, opts);
  } catch (err) {
    emitError(err);
  }
}).addHelpText('after', `
Examples:
  $ bb bounties deny 17 --creator bb1verifier...xyz | bb deploy
`);

// ── bounties claim-refund ────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    bountiesCommand
      .command('claim-refund')
      .description(
        'Post-deadline refund: emit MsgTransferTokens against the expire approval. Pipe to `bb deploy`. The bounty is callable by anyone after the window closes, but funds always flow to the submitter.'
      )
      .argument('<collection-id>', 'Bounty collection ID')
      .requiredOption('--creator <address>', 'Address signing the refund tx (bb1.../0x — auto-normalized)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'bounties claim-refund');
    const details = extractBountyDetails(collection.collectionApprovals)!;
    const status = resolveStatus(collection, details.expirationTime);
    if (status !== 'expired') {
      process.stderr.write(
        `Warning: bounty status is "${status}", not "expired". The refund approval's transferTimes window does not start until after the deadline; the chain will reject this tx.\n`
      );
    }
    if (isExpireApprovalExecuted(details.expireApproval, collection)) {
      process.stderr.write('Warning: the expire approval has already been executed. Submitting again will be rejected on-chain.\n');
    }
    const msg = buildBountyRefundMsg(creator, String(collectionId), details.expireApproval);
    emit(msg, opts);
  } catch (err) {
    emitError(err);
  }
}).addHelpText('after', `
Examples:
  $ bb bounties claim-refund 17 --creator bb1submitter...xyz | bb deploy
`);

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build bounty ...` (the canonical builder) instead.
