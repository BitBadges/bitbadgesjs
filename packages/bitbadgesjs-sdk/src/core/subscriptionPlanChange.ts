import { GO_MAX_UINT_64 } from '../common/math.js';
import { UintRangeArray } from './uintRanges.js';
import { getSubscriptionAccessStatus, isSubscriptionFaucetApproval, isUserRecurringApprovalForTier, userRecurringApproval } from './subscriptions.js';
import type { iCollectionApproval, iUserIncomingApproval } from '../interfaces/types/approvals.js';
import type { iBalance } from '../interfaces/types/core.js';

export function planSubscriptionChange({
  source,
  target,
  balances,
  incomingApprovals,
  approvalId,
  tip = 0n,
  now = BigInt(Date.now())
}: {
  source: iCollectionApproval<bigint>;
  target: iCollectionApproval<bigint>;
  balances: readonly iBalance<bigint>[] | undefined;
  incomingApprovals: iUserIncomingApproval<bigint>[] | undefined;
  approvalId: string;
  tip?: bigint;
  now?: bigint;
}) {
  if (!balances || !incomingApprovals) throw new Error('Subscription_Change_Unavailable');
  if (new Set(incomingApprovals.map((a) => a.approvalId)).size !== incomingApprovals.length) throw new Error('Invalid_format');
  if (!isSubscriptionFaucetApproval(source) || !isSubscriptionFaucetApproval(target) || tip < 0n) throw new Error('Invalid_format');
  const sourceToken = source.tokenIds[0].start;
  const targetToken = target.tokenIds[0].start;
  if (sourceToken === targetToken) throw new Error('Subscription_Change_Different_Tier');
  const sourceAccess = getSubscriptionAccessStatus(sourceToken, balances, now);
  const paidUntil = sourceAccess.subscribedTimes?.filter((range) => range.end >= now).at(-1)?.end;
  if (paidUntil === undefined || paidUntil >= GO_MAX_UINT_64) throw new Error('Subscription_Change_No_Paid_Access');
  const targetAccess = getSubscriptionAccessStatus(targetToken, balances, now);
  if (targetAccess.subscribedTimes?.some((range) => range.end >= now) || incomingApprovals.some((a) => isUserRecurringApprovalForTier(a, target))) {
    throw new Error('Subscription_Change_Target_Active');
  }
  if (!approvalId || incomingApprovals.some((a) => a.approvalId === approvalId)) throw new Error('Invalid_format');
  const effectiveAt = paidUntil + 1n;
  const duration = target.approvalCriteria!.predeterminedBalances!.incrementedBalances.durationFromTimestamp;
  if (effectiveAt + duration - 1n > GO_MAX_UINT_64) throw new Error('Subscription_Change_No_Paid_Access');
  const chargeLength = duration < 604800000n ? duration : 604800000n;
  const chargeStartsAt = effectiveAt > chargeLength ? effectiveAt - chargeLength : 1n;
  const earliestCharge = chargeStartsAt > now ? chargeStartsAt : now;
  if (!target.transferTimes.some((range) => range.start < effectiveAt && range.end >= earliestCharge)) {
    throw new Error('Subscription_Change_Target_Expired');
  }
  const denom = target.approvalCriteria!.coinTransfers![0].coins[0].denom;
  const replacement = userRecurringApproval({
    subscriptionApproval: target,
    firstIntervalStartTime: effectiveAt,
    ubadgeTipAmount: tip,
    tokenIds: [{ start: targetToken, end: targetToken }],
    transferTimes: UintRangeArray.From([{ start: now, end: GO_MAX_UINT_64 }]),
    approvalId,
    denom
  });
  return {
    effectiveAt,
    chargeStartsAt: earliestCharge,
    incomingApprovals: [...incomingApprovals.filter((a) => !isUserRecurringApprovalForTier(a, source)), replacement]
  };
}
