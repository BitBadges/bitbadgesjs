/**
 * Intent (OTC swap) builder — creates a user outgoing approval for an atomic swap.
 *
 * The creator offers to trade payDenom for receiveDenom via dual coinTransfers
 * on the Intent Exchange collection. Token ID 1 is used as the vehicle —
 * the real swap happens entirely in coinTransfers.
 *
 * @module core/builders/intent
 */
import {
  FOREVER,
  resolveCoin,
  toBaseUnits,
  durationToTimestamp,
  uniqueId,
  mintToBurnBalances,
  buildUserApprovalMsg,
  approvalMetadata
} from './shared.js';

export interface IntentParams {
  address: string; // creator bb1... address
  collectionId: string; // Intent Exchange collection ID
  payDenom: string; // what creator sends (USDC, BADGE)
  payAmount: number; // display units
  receiveDenom: string; // what creator receives
  receiveAmount: number; // display units
  expiration?: string; // duration shorthand, default "7d"
}

export function buildIntent(params: IntentParams): any {
  const payCoin = resolveCoin(params.payDenom);
  const receiveCoin = resolveCoin(params.receiveDenom);
  // A same-denom intent is a no-op approval the chain accepts but with
  // no economic effect. The canonical `bb intents create` path already
  // rejects this (cli/commands/intents.ts); enforce it in the builder so
  // `bb build intent` inherits the same guard. Compare resolved denoms
  // so 'USDC' vs 'usdc' is also caught.
  if (payCoin.denom === receiveCoin.denom) {
    throw new Error('Intent pay and receive denoms must differ.');
  }
  const payBase = toBaseUnits(params.payAmount, payCoin.decimals);
  const receiveBase = toBaseUnits(params.receiveAmount, receiveCoin.decimals);
  const expirationTs = durationToTimestamp(params.expiration || '7d');
  const id = uniqueId('intent');

  const approval = {
    approvalId: id,
    ...approvalMetadata(
      'Intent',
      'Atomic OTC swap — pay one denom and receive another in a single transfer.'
    ),
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: [{ start: '1', end: expirationTs }],
    tokenIds: [{ start: '1', end: '1' }],
    ownershipTimes: FOREVER,
    version: '0',
    approvalCriteria: {
      predeterminedBalances: mintToBurnBalances(),
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: id,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      coinTransfers: [
        // 1. Filler pays creator the receive coin
        {
          to: params.address,
          coins: [{ amount: receiveBase, denom: receiveCoin.denom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        },
        // 2. Creator's escrow pays filler the pay coin
        {
          to: '',
          coins: [{ amount: payBase, denom: payCoin.denom }],
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true
        }
      ],
      autoDeletionOptions: {
        afterOneUse: true,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      }
      // No `requireToEqualsInitiatedBy` — the vehicle-token `to` is the
      // creator while the fill initiator is the filler, so `true` made
      // the approval structurally unfillable. The canonical
      // core/intents.ts (the `bb intents create` path) omits it too.
    }
  };

  return {
    ...buildUserApprovalMsg({ collectionId: params.collectionId, outgoingApprovals: [approval] }),
    _meta: {
      description: `OTC Swap: ${params.payAmount} ${payCoin.symbol} → ${params.receiveAmount} ${receiveCoin.symbol}`,
      collectionId: params.collectionId,
      escrowCoins: [{ amount: payBase, denom: payCoin.denom }]
    }
  };
}
