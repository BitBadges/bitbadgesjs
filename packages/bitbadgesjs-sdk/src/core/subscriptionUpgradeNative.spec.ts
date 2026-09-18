import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import {
  buildSubscriptionUpgradeCollection,
  inspectSubscriptionUpgradeCollection,
  buildSubscriptionUpgradeEscrow,
  buildSubscriptionUpgradeOffer,
  buildSubscriptionUpgradeTransfers
} from './subscriptionUpgradeNative.js';
const addr = (n: string) => convertToBitBadgesAddress(`0x${n.repeat(40)}`);
const operator = addr('1'),
  subscriber = addr('2'),
  escrow = addr('3');
const profile = {
  version: 2 as const,
  operator,
  escrowStoreId: 1n,
  denom: 'ubadge',
  duration: 1000n,
  tiers: [
    { tokenId: 1n, price: 10n },
    { tokenId: 2n, price: 20n }
  ],
  payouts: [{ recipient: operator, weightBps: 10000n }]
};
const offer = {
  collectionId: 1n,
  operator,
  subscriber,
  initiator: subscriber,
  approvalId: 'quote-unique',
  createdAt: 100n,
  expiresAt: 150n,
  targetTokenId: 2n,
  ownershipTimes: [
    { start: 100n, end: 200n },
    { start: 300n, end: 500n }
  ],
  payments: [{ to: operator, amount: 20n, denom: 'ubadge' }],
  tierCount: 2n,
  source: {
    tokenId: 1n,
    escrow,
    ownershipTimes: [
      { start: 100n, end: 200n },
      { start: 300n, end: 500n }
    ]
  }
};
it('recognizes only frozen v2 profiles and rejects added transfer escapes', () => {
  const built = buildSubscriptionUpgradeCollection({ profile, uri: 'ipfs://membership' }).value;
  expect(inspectSubscriptionUpgradeCollection(built)).toEqual(profile);
  built.collectionApprovals.push({ ...built.collectionApprovals[1], approvalId: 'escape', fromListId: 'All' });
  expect(inspectSubscriptionUpgradeCollection(built)).toBeNull();
});
it('rejects mutable permissions, open incoming defaults, and wrappers', () => {
  for (const mutate of [
    (x: any) => (x.collectionPermissions.canUpdateCollectionApprovals = []),
    (x: any) => (x.defaultBalances.autoApproveAllIncomingTransfers = true),
    (x: any) => (x.cosmosCoinWrapperPaths = [{}])
  ]) {
    const built = buildSubscriptionUpgradeCollection({ profile, uri: 'ipfs://membership' }).value;
    mutate(built);
    expect(inspectSubscriptionUpgradeCollection(built)).toBeNull();
  }
});
it('locks sink ownership to source wallet and cannot reopen outgoing approvals', () => {
  const message = buildSubscriptionUpgradeEscrow(offer);
  expect(message.incomingApprovals![0].fromListId).toBe(subscriber);
  expect(message.autoApproveAllIncomingTransfers).toBe(false);
  expect(message.autoApproveSelfInitiatedOutgoingTransfers).toBe(false);
  expect(message.userPermissions!.canUpdateOutgoingApprovals[0].permanentlyForbiddenTimes[0].end).toBe(18446744073709551615n);
});
it('binds exact disjoint ranges and all-tier zero guard without clearing other offers', () => {
  const message = buildSubscriptionUpgradeOffer(offer);
  expect(message.approval.toListId).toBe(subscriber);
  expect(message.approval.approvalCriteria?.predeterminedBalances?.manualBalances[0].balances[0].ownershipTimes.length).toBe(2);
  expect(message.approval.approvalCriteria?.mustOwnTokens![1].tokenIds[0]).toMatchObject({ start: 1n, end: 2n });
  expect(message.approval.approvalCriteria?.mustOwnTokens![1].amountRange).toMatchObject({ start: 0n, end: 0n });
  expect(message.toProto().toJson()).not.toHaveProperty('outgoingApprovals');
  const tx = buildSubscriptionUpgradeTransfers(offer, { surrender: 0n, delivery: 0n, outgoing: 1n, intake: 0n });
  expect(tx.transfers.map((t) => t.from)).toEqual([subscriber, operator]);
  expect(tx.transfers[1].prioritizedApprovals![1].version).toBe(1n);
});
it('rejects changed exchange ranges, expired-at-start offers, invalid recipients and excessive amounts', () => {
  expect(() => buildSubscriptionUpgradeOffer({ ...offer, ownershipTimes: [{ start: 100n, end: 101n }] })).toThrow();
  expect(() => buildSubscriptionUpgradeOffer({ ...offer, expiresAt: 99n })).toThrow();
  expect(() => buildSubscriptionUpgradeOffer({ ...offer, subscriber: operator })).toThrow();
  expect(() => buildSubscriptionUpgradeOffer({ ...offer, payments: [{ to: operator, denom: 'ubadge', amount: 18446744073709551616n }] })).toThrow();
});
it('supports future-only upgrades and requires the on-chain escrow intake version', () => {
  const future = {
    ...offer,
    ownershipTimes: [{ start: 300n, end: 500n }],
    source: { ...offer.source, ownershipTimes: [{ start: 300n, end: 500n }] }
  };
  expect(() => buildSubscriptionUpgradeOffer(future).toProto()).not.toThrow();
  expect(() => buildSubscriptionUpgradeTransfers(future, { surrender: 0n, delivery: 0n, outgoing: 0n })).toThrow('intake');
});
it('does not treat default permission locks as the supported profile', () => {
  const built = buildSubscriptionUpgradeCollection({ profile, uri: 'ipfs://membership' }).value;
  built.defaultBalances.userPermissions.canUpdateIncomingApprovals = [
    {
      fromListId: 'All',
      initiatedByListId: 'All',
      tokenIds: [{ start: '1', end: '2' }],
      ownershipTimes: [{ start: '1', end: '100' }],
      transferTimes: [{ start: '1', end: '100' }],
      approvalId: 'All',
      permanentlyForbiddenTimes: [{ start: '1', end: '100' }],
      permanentlyPermittedTimes: []
    }
  ];
  expect(inspectSubscriptionUpgradeCollection(built)).toBeNull();
});
