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
import { validatePaymentRequestV2Collection, extractPaymentRequestV2Details, buildPaymentRequestV2PayMsg } from '../../core/payment-requests-v2.js';

const isV2 = (collection: any) => collection?.standards?.some((s: string) => s === 'PaymentRequestV2' || s === 'PaymentLinkV1');
function v2Summary(collection: any) {
  const terms = extractPaymentRequestV2Details(collection);
  if (!terms) throw new Error('Invalid payment obligation collection');
  const marker = terms.kind === 'invoice' ? 'PaymentRequestV2' : 'PaymentLinkV1';
  return { collectionId: String(collection.collectionId ?? collection._docId ?? ''), ...terms, state: collection.standardsInfo?.[marker] ?? { progress: 'unknown', lifecycle: 'unknown', status: 'unknown' } };
}

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}

/**
 * Validate that the fetched collection conforms to the PaymentRequest
 * protocol. On failure, write structured errors to stderr and exit 2 —
 * same gate as the frontend view's short-circuit.
 */
function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, isV2(collection) ? validatePaymentRequestV2Collection : validatePaymentRequestCollection, 'PaymentRequest');
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
    let collections = all.filter((c: any) => isV2(c) ? validatePaymentRequestV2Collection(c).valid : doesCollectionFollowPaymentRequestProtocol(c));

    if (opts.mine) {
      const bb1 = requireBb1Address(opts.mine, '--mine');
      collections = collections.filter((c: any) => {
        if (isV2(c)) return extractPaymentRequestV2Details(c)!.obligations.some((o) => !o.payouts.some((p) => p.recipient === bb1) && (o.payer.kind === 'anyone' || o.payer.addresses.includes(bb1)));
        const details = extractPaymentRequestDetails(c.collectionApprovals);
        return details?.payerAddress === bb1;
      });
    }
    if (opts.open) {
      collections = collections.filter((c: any) => {
        if (isV2(c)) { const state = v2Summary(c).state; return state.lifecycle === 'open' && state.progress !== 'paid' && state.progress !== 'unknown'; }
        const details = extractPaymentRequestDetails(c.collectionApprovals);
        if (!details) return false;
        return resolveStatus(c, details.expirationTime) === 'pending';
      });
    }

    const summary = collections.map((c: any) => {
      if (isV2(c)) return v2Summary(c);
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
    if (isV2(collection)) { emit(v2Summary(collection), opts); return; }
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
    if (isV2(collection)) { emit({ collectionId, ...v2Summary(collection).state }, opts); return; }
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
      .option('--obligation <id>', 'V2 obligation ID (required for a collection with multiple obligations)')
      .option('--units <integer>', 'V2 partial-payment quanta (default 1)', '1')
      .requiredOption('--creator <address>', 'Payer address (bb1.../0x — auto-normalized)')
  )
)).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; obligation?: string; units?: string }) => {
  try {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests pay');
    if (isV2(collection)) {
      const terms = extractPaymentRequestV2Details(collection)!;
      const obligationId = opts.obligation ?? (terms.obligations.length === 1 ? terms.obligations[0].id : undefined);
      if (!obligationId) throw new Error('Specify --obligation for a collection with multiple obligations');
      const msg = buildPaymentRequestV2PayMsg(creator, collectionId, collection, obligationId, opts.units ?? '1');
      await runEmitOrDeploy(msg, opts, { emit: (m) => emit(m, opts), expectedAddress: creator });
      return;
    }
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    if (details.payerAddress !== 'All' && creator !== details.payerAddress) {
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
    if (isV2(collection)) throw new Error('V2 direct payments do not have a deny or cancellation action');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    if (!details.denyApproval) throw new Error('Public payment requests cannot be denied; they remain open until paid or expired.');
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
