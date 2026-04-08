/**
 * Recurring payment builder — creates a user incoming approval for
 * receiving subscription-style recurring payments.
 *
 * This is the subscriber-side approval that allows a subscription
 * collection to mint tokens to the user on a recurring schedule.
 *
 * @module core/builders/recurring-payment
 */
import {
  FOREVER,
  resolveCoin,
  toBaseUnits,
  parseDuration,
  durationToTimestamp,
  uniqueId,
  buildUserApprovalMsg
} from './shared.js';

export interface RecurringPaymentParams {
  collectionId: string; // subscription collection ID
  amount: number; // payment amount per interval (display units)
  denom: string; // payment coin (USDC, BADGE)
  interval: string; // "daily", "monthly", "annually", or shorthand
  recipient: string; // who receives payments (bb1...)
  expiration?: string; // total subscription duration, default "365d"
}

export function buildRecurringPayment(params: RecurringPaymentParams): any {
  const coin = resolveCoin(params.denom);
  const baseAmount = toBaseUnits(params.amount, coin.decimals);
  const intervalMs = parseDuration(params.interval);
  const expirationTs = durationToTimestamp(params.expiration || '365d');
  const id = uniqueId('recurring');

  const approval = {
    approvalId: id,
    fromListId: 'Mint',
    initiatedByListId: 'All',
    transferTimes: [{ start: '1', end: expirationTs }],
    tokenIds: [{ start: '1', end: '1' }],
    ownershipTimes: FOREVER,
    version: '0',
    approvalCriteria: {
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }],
          incrementTokenIdsBy: '0',
          incrementOwnershipTimesBy: '0',
          durationFromTimestamp: intervalMs,
          allowOverrideTimestamp: true,
          recurringOwnershipTimes: {
            startTime: String(Date.now()),
            intervalLength: intervalMs,
            chargePeriodLength: intervalMs
          },
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: '0'
        },
        orderCalculationMethod: {
          useOverallNumTransfers: false,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: true,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '1',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: id,
        resetTimeIntervals: {
          startTime: String(Date.now()),
          intervalLength: intervalMs
        }
      },
      coinTransfers: [
        {
          to: params.recipient,
          coins: [{ amount: baseAmount, denom: coin.denom }],
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true
        }
      ]
    }
  };

  return {
    ...buildUserApprovalMsg({ collectionId: params.collectionId, incomingApprovals: [approval] }),
    _meta: {
      description: `Recurring: ${params.amount} ${coin.symbol} every ${params.interval} to ${params.recipient}`,
      collectionId: params.collectionId
    }
  };
}
