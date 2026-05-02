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
  MAX_UINT64,
  FOREVER,
  BURN_ADDRESS,
  resolveCoin,
  toBaseUnits,
  durationToTimestamp,
  uniqueId,
  buildMsg,
  frozenPermissions,
  defaultBalances,
  metadataPlaceholders,
  mintToBurnBalances,
  zeroMaxTransfers
} from './shared.js';

export interface PaymentRequestParams {
  amount: number; // display units
  denom: string; // USDC, BADGE, etc.
  payer: string; // bb1... address — the human approver/payer
  recipient: string; // bb1... address — agent/merchant receiving funds
  expiration?: string; // duration shorthand, default "30d"
  name?: string;
  /**
   * Free-form rationale shown to the payer at approval time. Mirrors
   * Stripe Link's ≥100 char `context` requirement — agents must justify
   * the spend in human-readable terms. Surfaced via the off-chain
   * metadata sidecar (collection description), not on-chain proto fields.
   */
  context?: string;
}

export function buildPaymentRequest(params: PaymentRequestParams): any {
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
    },
    // Expire — anyone can mark expired after the approval window. No
    // coinTransfer; just records the terminal state.
    {
      fromListId: 'Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      approvalId: 'payment-request-expire',
      transferTimes: [{ start: String(BigInt(expirationTs) + 1n), end: MAX_UINT64 }],
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: {
          ...zeroMaxTransfers('payment-request-expire-tracker'),
          overallMaxNumTransfers: '1'
        },
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    }
  ];

  const description = params.context
    ? `${params.context}\n\nPayer: ${params.payer}\nAmount: ${params.amount} ${coin.symbol}`
    : `Payment request for ${params.amount} ${coin.symbol}`;

  const { collectionMetadata, tokenMetadata, placeholders } = metadataPlaceholders(
    params.name || 'Payment Request',
    description
  );

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
    collectionMetadata,
    tokenMetadata,
    metadataPlaceholders: placeholders
  });
}
