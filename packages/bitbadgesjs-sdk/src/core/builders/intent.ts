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
  mintToBurnBalances
} from './shared.js';

export interface IntentParams {
  address: string; // creator bb1... address
  payDenom: string; // what creator sends (USDC, BADGE)
  payAmount: number; // display units
  receiveDenom: string; // what creator receives
  receiveAmount: number; // display units
  expiration?: string; // duration shorthand, default "7d"
}

export function buildIntent(params: IntentParams): any {
  const payCoin = resolveCoin(params.payDenom);
  const receiveCoin = resolveCoin(params.receiveDenom);
  const payBase = toBaseUnits(params.payAmount, payCoin.decimals);
  const receiveBase = toBaseUnits(params.receiveAmount, receiveCoin.decimals);
  const expirationTs = durationToTimestamp(params.expiration || '7d');
  const id = uniqueId('intent');

  return {
    type: 'outgoing',
    approvalId: id,
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
      },
      requireToEqualsInitiatedBy: true
    },
    _meta: {
      description: `OTC Swap: ${params.payAmount} ${payCoin.symbol} → ${params.receiveAmount} ${receiveCoin.symbol}`,
      escrowCoins: [{ amount: payBase, denom: payCoin.denom }]
    }
  };
}
