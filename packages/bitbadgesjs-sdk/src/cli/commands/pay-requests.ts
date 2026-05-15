/**
 * `bitbadges-cli pay-requests` — end-user surface for the PaymentRequest
 * standard, mirroring the frontend's `PaymentRequestView`.
 *
 *   pay-requests list    — browse open PaymentRequest collections
 *   pay-requests show    — render details (amount, payer, recipient, expiry, status)
 *   pay-requests pay     — emit MsgTransferTokens targeting the pay approval
 *   pay-requests deny    — emit MsgTransferTokens targeting the deny approval
 *   pay-requests status  — fetch indexer status (paid / denied / pending / expired)
 *
 * Creator-side construction lives at `bb build payment-request` — the
 * per-standard `build` subcommand was removed in CLI v2 (#0399).
 *
 * Every subcommand validates standards conformance via the SDK's
 * `doesCollectionFollowPaymentRequestProtocol` + `validatePaymentRequestCollection`
 * before emitting anything. On mismatch we exit 2 with structured errors —
 * same short-circuit gate the frontend uses (lines 196-211 of
 * PaymentRequestView).
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
import { addDeployOptions, runEmitOrDeploy } from '../utils/deploy-options.js';
import { normalizeCollection, validateCollectionOrExit } from '../utils/collection-options.js';
import {
  doesCollectionFollowPaymentRequestProtocol,
  validatePaymentRequestCollection,
  extractPaymentRequestDetails,
  derivePaymentRequestStatusFallback,
  buildPaymentRequestPayMsg,
  buildPaymentRequestDenyMsg,
  type PaymentRequestStatus
} from '../../core/payment-requests.js';

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}

/**
 * Validate that the fetched collection conforms to the PaymentRequest
 * protocol. On failure, write structured errors to stderr and exit 2 —
 * same gate as the frontend view's short-circuit.
 */
function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, validatePaymentRequestCollection, 'PaymentRequest');
}

function resolveStatus(collection: any, expirationTime: bigint): PaymentRequestStatus {
  const indexerStatus = collection?.standardsInfo?.PaymentRequest?.status as PaymentRequestStatus | undefined;
  return indexerStatus ?? derivePaymentRequestStatusFallback(expirationTime);
}

// ── pay-requests (parent) ─────────────────────────────────────────────────

export const payRequestsCommand = new Command('pay-requests').description(
  'End-user surface for the PaymentRequest standard — list / show / pay / deny / status. Build new via `bb build payment-request`. Every action validates conformance before emitting.'
);

// ── pay-requests list ─────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('list')
      .description('Browse PaymentRequest collections. Optional filters scope to the active set.')
      .option('--mine <address>', 'Restrict to requests addressed to this payer (bb1.../0x — auto-normalized)')
      .option('--open', 'Only return pending (not paid/denied/expired) requests', false)
  )
).action(async (opts: NetworkFlags & OutputFlags & { mine?: string; open?: boolean }) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'paymentRequest' });
    const all: any[] = res?.collections?.paymentRequest ?? res?.collections ?? [];
    let collections = all.filter((c: any) => doesCollectionFollowPaymentRequestProtocol(c));

    if (opts.mine) {
      const bb1 = requireBb1Address(opts.mine, '--mine');
      collections = collections.filter((c: any) => {
        const details = extractPaymentRequestDetails(c.collectionApprovals);
        return details?.payerAddress === bb1;
      });
    }
    if (opts.open) {
      collections = collections.filter((c: any) => {
        const details = extractPaymentRequestDetails(c.collectionApprovals);
        if (!details) return false;
        return resolveStatus(c, details.expirationTime) === 'pending';
      });
    }

    const summary = collections.map((c: any) => {
      const details = extractPaymentRequestDetails(c.collectionApprovals)!;
      return {
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        payerAddress: details.payerAddress,
        recipientAddress: details.recipientAddress,
        paymentCoins: details.paymentCoins.map((coin) => ({ denom: coin.denom, amount: coin.amount.toString() })),
        expirationTime: details.expirationTime.toString(),
        status: resolveStatus(c, details.expirationTime)
      };
    });
    emit(summary, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── pay-requests show ─────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('show')
      .description('Render a PaymentRequest collection — amount, payer, recipient, expiry, status.')
      .argument('<collection-id>', 'PaymentRequest collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests show');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    emit(
      {
        collectionId: String(collectionId),
        payerAddress: details.payerAddress,
        recipientAddress: details.recipientAddress,
        paymentCoins: details.paymentCoins.map((coin) => ({
          denom: coin.denom,
          amount: coin.amount.toString()
        })),
        expirationTime: details.expirationTime.toString(),
        status: resolveStatus(collection, details.expirationTime)
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

// ── pay-requests status ───────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('status')
      .description('Resolve the current status: paid / denied / pending / expired.')
      .argument('<collection-id>', 'PaymentRequest collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests status');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    const status = resolveStatus(collection, details.expirationTime);
    emit({ collectionId: String(collectionId), status }, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── pay-requests pay ──────────────────────────────────────────────────────

addDeployOptions(
addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('pay')
      .description(
        'MsgTransferTokens targeting the pay approval. Emit (pipe to `bb deploy`) or broadcast inline with --browser/--burner.'
      )
      .argument('<collection-id>', 'PaymentRequest collection ID')
      .requiredOption('--creator <address>', 'Payer address (bb1.../0x — auto-normalized)')
  )
)).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests pay');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    if (creator !== details.payerAddress) {
      process.stderr.write(
        `Warning: --creator ${creator} does not match the request's payer ${details.payerAddress}. The on-chain approval will reject this tx.\n`
      );
    }
    const msg = buildPaymentRequestPayMsg(creator, String(collectionId), details.payApproval);
    await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
  } catch (err) {
    emitError(err);
  }
}).addHelpText('after', `
Examples:
  $ bb pay-requests pay 31 --creator bb1payer...xyz | bb deploy
`);

// ── pay-requests deny ─────────────────────────────────────────────────────

addDeployOptions(
addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('deny')
      .description(
        'MsgTransferTokens targeting the deny approval. Emit (pipe to `bb deploy`) or broadcast inline with --browser/--burner.'
      )
      .argument('<collection-id>', 'PaymentRequest collection ID')
      .requiredOption('--creator <address>', 'Payer address (bb1.../0x — auto-normalized)')
  )
)).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests deny');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    if (creator !== details.payerAddress) {
      process.stderr.write(
        `Warning: --creator ${creator} does not match the request's payer ${details.payerAddress}. The on-chain approval will reject this tx.\n`
      );
    }
    const msg = buildPaymentRequestDenyMsg(creator, String(collectionId), details.denyApproval);
    await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
  } catch (err) {
    emitError(err);
  }
}).addHelpText('after', `
Examples:
  $ bb pay-requests deny 31 --creator bb1payer...xyz | bb deploy
`);

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build payment-request ...` (the canonical builder) instead.
