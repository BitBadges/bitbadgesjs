import { GO_MAX_UINT_64 } from '../common/math.js';
import { AddressList } from './addressLists.js';
import { BigIntify } from '../common/string-numbers.js';
import { CollectionApprovalWithDetails } from './approvals.js';
import { buildSubscription } from './builders/subscription.js';
import { userRecurringApproval } from './subscriptions.js';
import { UintRangeArray } from './uintRanges.js';
import { planSubscriptionChange } from './subscriptionPlanChange.js';

const recipient = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';
function tier(tokenId: bigint, price: number) {
  const raw = buildSubscription({ interval: 'daily', price, denom: 'BADGE', recipient, uri: 'https://example.com/tier.json' }).value
    .collectionApprovals[0];
  const result = new CollectionApprovalWithDetails({
    ...raw,
    fromList: AddressList.Reserved('Mint'),
    toList: AddressList.AllAddresses(),
    initiatedByList: AddressList.AllAddresses()
  }).convert(BigIntify);
  result.tokenIds = UintRangeArray.From([{ start: tokenId, end: tokenId }]);
  result.approvalCriteria!.predeterminedBalances!.incrementedBalances.startBalances[0].tokenIds = result.tokenIds;
  result.approvalId = `tier-${tokenId}`;
  return result;
}
const source = tier(1n, 5);
const target = tier(2n, 8);
const now = 1000n;
const paidUntil = 100000000n;
const balances = [{ amount: 1n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: paidUntil }] }];
const consent = userRecurringApproval({
  subscriptionApproval: source,
  firstIntervalStartTime: paidUntil + 1n,
  ubadgeTipAmount: 0n,
  transferTimes: UintRangeArray.FullRanges(),
  approvalId: 'old',
  tokenIds: source.tokenIds,
  denom: 'ubadge'
});
const args = { source, target, balances, incomingApprovals: [consent], approvalId: 'new', now };

it('replaces source consent, binds target price, and preserves paid access and unrelated consent', () => {
  const other = { ...consent, approvalId: 'unrelated', tokenIds: [{ start: 3n, end: 3n }] };
  const result = planSubscriptionChange({ ...args, incomingApprovals: [consent, other] });
  expect(result.effectiveAt).toBe(paidUntil + 1n);
  expect(result.incomingApprovals.map((a) => a.approvalId)).toEqual(['unrelated', 'new']);
  expect(result.incomingApprovals[1].approvalCriteria?.coinTransfers?.[0].coins[0].amount).toBe(8000000000n);
  expect(balances[0].ownershipTimes[0].end).toBe(paidUntil);
});

it('waits for already purchased future periods rather than only current access', () => {
  const result = planSubscriptionChange({
    ...args,
    balances: [...balances, { ...balances[0], ownershipTimes: [{ start: paidUntil + 100n, end: paidUntil + 1000n }] }]
  });
  expect(result.effectiveAt).toBe(paidUntil + 1001n);
});

it('binds every same-denomination coin entry in a merchant payout', () => {
  const split = target.clone();
  const extra = split.approvalCriteria!.coinTransfers![0].coins[0].clone();
  extra.amount = 2000000000n;
  split.approvalCriteria!.coinTransfers![0].coins.push(extra);
  const result = planSubscriptionChange({ ...args, target: split });
  expect(result.incomingApprovals.at(-1)!.approvalCriteria!.coinTransfers![0].coins[0].amount).toBe(10000000000n);
});

it('rejects unknown balances, no remaining paid access, and the same tier', () => {
  expect(() => planSubscriptionChange({ ...args, balances: undefined })).toThrow('Subscription_Change_Unavailable');
  expect(() => planSubscriptionChange({ ...args, balances: [] })).toThrow('Subscription_Change_No_Paid_Access');
  expect(() => planSubscriptionChange({ ...args, target: source })).toThrow('Subscription_Change_Different_Tier');
});

it('rejects a target with existing access or consent instead of discarding that schedule', () => {
  expect(() => planSubscriptionChange({ ...args, balances: [...balances, { ...balances[0], tokenIds: target.tokenIds }] })).toThrow(
    'Subscription_Change_Target_Active'
  );
  expect(() =>
    planSubscriptionChange({
      ...args,
      incomingApprovals: [...args.incomingApprovals, { ...consent, approvalId: 'target-consent', tokenIds: target.tokenIds }]
    })
  ).toThrow('Subscription_Change_Target_Active');
});

it('rejects a target whose transfer window cannot cover the first charge', () => {
  expect(() =>
    planSubscriptionChange({ ...args, target: new CollectionApprovalWithDetails({ ...target, transferTimes: [{ start: 1n, end: 2n }] }) })
  ).toThrow('Subscription_Change_Target_Expired');
});

it('rejects invalid clock bounds and reimbursement overflow before emitting consent', () => {
  for (const invalidNow of [0n, -1n, GO_MAX_UINT_64 + 1n]) {
    expect(() => planSubscriptionChange({ ...args, now: invalidNow })).toThrow('Invalid_format');
  }
  expect(() => planSubscriptionChange({ ...args, tip: GO_MAX_UINT_64 })).toThrow('Invalid_format');
  const split = target.clone();
  split.approvalCriteria!.coinTransfers![0].coins[0].amount = GO_MAX_UINT_64;
  split.approvalCriteria!.coinTransfers![0].coins.push({ amount: 1n, denom: 'ubadge' } as any);
  expect(() => planSubscriptionChange({ ...args, target: split })).toThrow('Invalid_format');
  expect(() =>
    planSubscriptionChange({ ...args, balances: [{ ...balances[0], ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 - 1n }] }] })
  ).toThrow('Subscription_Change_No_Paid_Access');
});
