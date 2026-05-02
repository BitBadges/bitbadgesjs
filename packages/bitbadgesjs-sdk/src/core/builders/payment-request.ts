/**
 * PaymentRequest builder — creates a MsgUniversalUpdateCollection for a
 * no-escrow agent-initiated payment request.
 *
 * Inverse of Bounty: an agent (or any address) creates the collection
 * targeting a specific payer. The payer approves AND pays in a single
 * action — no escrow up front. The chain debits the payer's wallet at
 * approval time because the pay approval uses
 * `overrideFromWithApproverAddress: false`, and the proto default routes
 * the coin transfer's `from` to the initiator (the payer, scoped via
 * `initiatedByListId`).
 *
 * @module core/builders/payment-request
 */
import {
  FOREVER,
  BURN_ADDRESS,
  resolveCoin,
  toBaseUnits,
  durationToTimestamp,
  buildMsg,
  frozenPermissions,
  defaultBalances,
  mintToBurnBalances,
  zeroMaxTransfers,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError,
  approvalMetadata
} from './shared.js';

export interface PaymentRequestParams {
  amount: number; // display units
  denom: string; // USDC, BADGE, etc.
  payer: string; // bb1... address — the human approver/payer
  recipient: string; // bb1... address — agent/merchant receiving funds
  expiration?: string; // duration shorthand, default "30d"
  /** Pre-hosted collection metadata URI. If provided, name/image/description are ignored. */
  uri?: string;
  name?: string;
  image?: string;
  /**
   * Free-form rationale shown to the payer at approval time. Mirrors
   * Stripe Link's ≥100 char `context` requirement — agents must justify
   * the spend in human-readable terms. Used as the collection description
   * (in inline mode) or appended to the auto-generated default.
   */
  context?: string;
}

export function buildPaymentRequest(params: PaymentRequestParams): any {
  // Self-payments are a no-op that bypass the standard's intent. The
  // SDK validator + indexer-side verifier both enforce this; failing
  // fast at build time gives callers a clearer error than the chain
  // simulation reject.
  if (params.payer && params.recipient && params.payer === params.recipient) {
    throw new Error(
      `buildPaymentRequest: payer and recipient must be different addresses (got "${params.payer}" for both). A PaymentRequest is a payment from payer TO recipient.`
    );
  }
  const coin = resolveCoin(params.denom);
  const baseAmount = toBaseUnits(params.amount, coin.decimals);
  const expirationTs = durationToTimestamp(params.expiration || '30d');

  const collectionApprovals = [
    // Pay — payer approves, coin transfer fires from payer's wallet.
    // overrideFromWithApproverAddress: false → chain defaults the
    // coinTransfer's `from` to the initiator (the payer), debiting their
    // wallet at execution time. No escrow pre-funded.
    {
      fromListId: 'Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: params.payer,
      approvalId: 'payment-request-pay',
      ...approvalMetadata(
        'Pay',
        'Approve and pay from your wallet'
      ),
      transferTimes: [{ start: '1', end: expirationTs }],
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: {
          ...zeroMaxTransfers('payment-request-pay-tracker'),
          overallMaxNumTransfers: '1'
        },
        coinTransfers: [
          {
            to: params.recipient,
            coins: [{ amount: baseAmount, denom: coin.denom }],
            overrideFromWithApproverAddress: false,
            overrideToWithInitiator: false
          }
        ],
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Deny — payer rejects. No coinTransfer; the mint-to-burn vehicle
    // alone records the denial state for indexers/UIs.
    {
      fromListId: 'Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: params.payer,
      approvalId: 'payment-request-deny',
      ...approvalMetadata('Deny', 'Reject this payment request'),
      transferTimes: [{ start: '1', end: expirationTs }],
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: {
          ...zeroMaxTransfers('payment-request-deny-tracker'),
          overallMaxNumTransfers: '1'
        },
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    }
    // No expire approval — both pay and deny are time-gated to
    // [1, expirationTs], so neither can fire after the deadline.
    // Expiration is implicit; clients compute "expired" from the
    // current time vs. transferTimes[0].end.
  ];

  // PaymentRequest's description has a special semantic: --context is
  // the payer-facing rationale that the standard requires. If the
  // caller passes --context (and didn't pass --uri), use it as the
  // inline description verbatim; otherwise the caller MUST supply
  // --description (or --uri) explicitly.
  const description = params.context
    ? `${params.context}\n\nPayer: ${params.payer}\nAmount: ${params.amount} ${coin.symbol}`
    : undefined;

  const collectionSource = metadataFromFlat({
    uri: params.uri,
    name: params.name,
    description,
    image: params.image
  });
  if (!collectionSource) {
    throw new MetadataMissingError('payment-request collectionMetadata', ['name', 'image', 'description']);
  }

  return buildMsg({
    collectionApprovals,
    standards: ['PaymentRequest'],
    collectionPermissions: frozenPermissions(),
    defaultBalances: defaultBalances(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: true,
      disablePoolCreation: true
    },
    // No alias paths — PaymentRequest is a 1-of-1 receipt-style token.
    aliasPathsToAdd: [],
    // KEY INVERSION vs. Bounty: NO mintEscrowCoinsToTransfer. The pay
    // approval debits the payer's wallet directly via initiator routing
    // when they execute the approval — there's no pre-funded escrow.
    collectionMetadata: collectionSource,
    tokenMetadata: [tokenMetadataEntry(FOREVER, collectionSource, 'payment request receipt')]
  });
}
