import { isAddressValid } from '../address-converter/converter.js';
import { GO_MAX_UINT_64 as MAX } from '../common/math.js';
import { CollectionApproval } from './approvals.js';
import { CollectionPermissions, UserPermissions } from './permissions.js';
import { CollectionInvariants } from './misc.js';
import { buildMsg, frozenPermissions, defaultBalances } from './builders/shared.js';
import { MsgUpdateUserApprovals } from '../transactions/messages/bitbadges/tokenization/msgUpdateUserApprovals.js';
import { MsgSetOutgoingApproval } from '../transactions/messages/bitbadges/tokenization/msgSetOutgoingApproval.js';
import { MsgTransferTokens } from '../transactions/messages/bitbadges/tokenization/msgTransferTokens.js';

type Range = { start: bigint; end: bigint };
export type SubscriptionUpgradeNativeProfile = {
  version: 2;
  operator: string;
  escrowStoreId: bigint;
  denom: string;
  duration: bigint;
  tiers: { tokenId: bigint; price: bigint }[];
  payouts: { recipient: string; weightBps: bigint }[];
};
export type SubscriptionUpgradeNativeOffer = {
  collectionId: bigint;
  operator: string;
  subscriber: string;
  initiator: string;
  approvalId: string;
  createdAt: bigint;
  expiresAt: bigint;
  targetTokenId: bigint;
  tierCount: bigint;
  ownershipTimes: Range[];
  payments: { to: string; amount: bigint; denom: string }[];
  source?: { tokenId: bigint; escrow: string; ownershipTimes: Range[] };
};
export const SUBSCRIPTION_UPGRADE_APPROVALS = {
  inventory: 'subscription-v2-inventory',
  delivery: 'subscription-v2-delivery',
  surrender: 'subscription-v2-surrender'
} as const;
const full = () => [{ start: 1n, end: MAX }];
const serialize = (v: unknown) => JSON.stringify(v, (_, n) => (typeof n === 'bigint' ? n.toString() : n));
function uint(n: bigint, zero = false) {
  if (typeof n !== 'bigint' || n < (zero ? 0n : 1n) || n > MAX) throw new Error('Invalid subscription integer.');
}
function wallet(address: string) {
  if (!address.startsWith('bb1') || !isAddressValid(address)) throw new Error('Invalid subscription wallet.');
}
function ranges(input: Range[]) {
  if (!Array.isArray(input) || !input.length) throw new Error('Missing ownership ranges.');
  let end = 0n;
  for (const r of input) {
    uint(r.start);
    uint(r.end);
    if (r.start <= end || r.end < r.start) throw new Error('Ownership ranges must be ordered and disjoint.');
    end = r.end;
  }
}
function validateProfile(p: SubscriptionUpgradeNativeProfile) {
  if (p.version !== 2) throw new Error('Unsupported subscription profile.');
  wallet(p.operator);
  uint(p.escrowStoreId);
  uint(p.duration);
  if (!p.denom || !p.tiers.length || !p.payouts.length) throw new Error('Missing subscription terms.');
  p.tiers.forEach((t, i) => {
    uint(t.price);
    if (t.tokenId !== BigInt(i + 1)) throw new Error('Tier IDs must be consecutive from one.');
  });
  let weight = 0n;
  for (const payout of p.payouts) {
    wallet(payout.recipient);
    uint(payout.weightBps);
    weight += payout.weightBps;
  }
  if (weight !== 10000n) throw new Error('Payout weights must total 10000.');
}
function validateOffer(o: SubscriptionUpgradeNativeOffer) {
  [o.operator, o.subscriber, o.initiator].forEach(wallet);
  [o.collectionId, o.createdAt, o.expiresAt, o.targetTokenId, o.tierCount].forEach((n) => uint(n));
  ranges(o.ownershipTimes);
  if (
    !o.approvalId ||
    o.operator === o.subscriber ||
    o.targetTokenId > o.tierCount ||
    o.expiresAt < o.createdAt ||
    o.ownershipTimes[0].start < o.createdAt ||
    o.expiresAt > o.ownershipTimes[0].end
  )
    throw new Error('Invalid exact subscription offer.');
  if (!o.payments.length || new Set(o.payments.map((p) => p.denom)).size !== 1) throw new Error('One payment denomination is required.');
  let total = 0n;
  for (const p of o.payments) {
    wallet(p.to);
    uint(p.amount);
    total += p.amount;
    if (!p.denom) throw new Error('Missing denomination.');
  }
  uint(total);
  if (o.source) {
    wallet(o.source.escrow);
    uint(o.source.tokenId);
    ranges(o.source.ownershipTimes);
    if (
      new Set([o.operator, o.subscriber, o.source.escrow]).size !== 3 ||
      o.source.tokenId === o.targetTokenId ||
      o.source.tokenId > o.tierCount ||
      o.initiator !== o.subscriber ||
      serialize(o.source.ownershipTimes) !== serialize(o.ownershipTimes)
    )
      throw new Error('Upgrade must exchange the same exact ownership ranges.');
  }
}
const balance = (id: bigint, times: Range[], amount = 1n) => ({ amount, tokenIds: [{ start: id, end: id }], ownershipTimes: times });
const once = (id: string) => ({
  overallMaxNumTransfers: 1n,
  perToAddressMaxNumTransfers: 0n,
  perFromAddressMaxNumTransfers: 0n,
  perInitiatedByAddressMaxNumTransfers: 0n,
  amountTrackerId: id,
  resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
});
const exact = (balances: ReturnType<typeof balance>[]) => ({
  manualBalances: [{ balances }],
  incrementedBalances: {
    startBalances: [],
    incrementTokenIdsBy: 0n,
    incrementOwnershipTimesBy: 0n,
    durationFromTimestamp: 0n,
    allowOverrideTimestamp: false,
    recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n },
    allowOverrideWithAnyValidToken: false,
    allowAmountScaling: false,
    maxScalingMultiplier: 0n
  },
  orderCalculationMethod: {
    useOverallNumTransfers: true,
    usePerToAddressNumTransfers: false,
    usePerFromAddressNumTransfers: false,
    usePerInitiatedByAddressNumTransfers: false,
    useMerkleChallengeLeafIndex: false,
    challengeTrackerId: ''
  }
});

export function buildSubscriptionUpgradeCollection({ profile, uri }: { profile: SubscriptionUpgradeNativeProfile; uri: string }) {
  validateProfile(profile);
  if (!uri) throw new Error('Collection metadata URI is required.');
  const ids = [{ start: 1n, end: BigInt(profile.tiers.length) }];
  const base = { transferTimes: full(), ownershipTimes: full(), tokenIds: ids, version: 0n };
  const criteria = {
    approvalAmounts: {
      overallApprovalAmount: 0n,
      perToAddressApprovalAmount: 0n,
      perFromAddressApprovalAmount: 0n,
      perInitiatedByAddressApprovalAmount: 0n,
      amountTrackerId: '',
      resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
    },
    maxNumTransfers: { ...once(''), overallMaxNumTransfers: 0n },
    autoDeletionOptions: { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false }
  };
  const inventory = { amount: MAX, tokenIds: ids, ownershipTimes: full() };
  return buildMsg({
    standards: ['Subscriptions'],
    validTokenIds: ids,
    customData: serialize({ subscriptionUpgrade: profile }),
    collectionMetadata: { uri, customData: '' },
    tokenMetadata: [{ uri, customData: '', tokenIds: ids }],
    collectionPermissions: frozenPermissions(),
    defaultBalances: defaultBalances({ autoApproveAllIncomingTransfers: false }),
    invariants: { noCustomOwnershipTimes: false, maxSupplyPerId: 0n, noForcefulPostMintTransfers: true, disablePoolCreation: true },
    collectionApprovals: [
      {
        ...base,
        approvalId: SUBSCRIPTION_UPGRADE_APPROVALS.inventory,
        fromListId: 'Mint',
        toListId: profile.operator,
        initiatedByListId: profile.operator,
        approvalCriteria: {
          ...criteria,
          mustPrioritize: true,
          overridesFromOutgoingApprovals: true,
          predeterminedBalances: exact([inventory]),
          maxNumTransfers: once('subscription-v2-inventory')
        }
      },
      {
        ...base,
        approvalId: SUBSCRIPTION_UPGRADE_APPROVALS.delivery,
        fromListId: profile.operator,
        toListId: 'All',
        initiatedByListId: 'All',
        approvalCriteria: { ...criteria }
      },
      {
        ...base,
        approvalId: SUBSCRIPTION_UPGRADE_APPROVALS.surrender,
        fromListId: '!Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        approvalCriteria: {
          ...criteria,
          requireFromEqualsInitiatedBy: true,
          dynamicStoreChallenges: [{ storeId: profile.escrowStoreId, ownershipCheckParty: 'recipient' }]
        }
      }
    ]
  });
}

export function inspectSubscriptionUpgradeCollection(collection: any): SubscriptionUpgradeNativeProfile | null {
  try {
    const raw = JSON.parse(collection.customData).subscriptionUpgrade;
    const profile: SubscriptionUpgradeNativeProfile = {
      ...raw,
      escrowStoreId: BigInt(raw.escrowStoreId),
      duration: BigInt(raw.duration),
      tiers: raw.tiers.map((t: any) => ({ tokenId: BigInt(t.tokenId), price: BigInt(t.price) })),
      payouts: raw.payouts.map((p: any) => ({ recipient: p.recipient, weightBps: BigInt(p.weightBps) }))
    };
    const expected = buildSubscriptionUpgradeCollection({ profile, uri: 'ipfs://profile-check' }).value;
    const approvals = (v: any[]) =>
      v
        .map((a) => new CollectionApproval({ ...a, uri: '', customData: '', version: 0n }).toProto().toJson())
        .sort((a: any, b: any) => a.approvalId.localeCompare(b.approvalId));
    if (serialize(approvals(collection.collectionApprovals)) !== serialize(approvals(expected.collectionApprovals))) return null;
    if (
      serialize(new CollectionPermissions(collection.collectionPermissions).toProto().toJson()) !==
      serialize(new CollectionPermissions(expected.collectionPermissions).toProto().toJson())
    )
      return null;
    if (
      serialize(new CollectionInvariants(collection.invariants).toProto().toJson()) !==
      serialize(new CollectionInvariants(expected.invariants).toProto().toJson())
    )
      return null;
    if (serialize(collection.validTokenIds) !== serialize(expected.validTokenIds) || serialize(collection.standards) !== serialize(['Subscriptions']))
      return null;
    if (Object.keys(collection.collectionPermissions).some((k) => !(k in expected.collectionPermissions))) return null;
    const defaults = collection.defaultBalances;
    if (
      !defaults ||
      defaults.autoApproveAllIncomingTransfers ||
      !defaults.autoApproveSelfInitiatedIncomingTransfers ||
      !defaults.autoApproveSelfInitiatedOutgoingTransfers ||
      defaults.balances?.length ||
      defaults.incomingApprovals?.length ||
      defaults.outgoingApprovals?.length
    )
      return null;
    if (
      Object.keys(defaults.userPermissions ?? {}).some((k) => !(k in expected.defaultBalances.userPermissions)) ||
      serialize(new UserPermissions(defaults.userPermissions ?? {}).toProto().toJson()) !==
        serialize(new UserPermissions(expected.defaultBalances.userPermissions).toProto().toJson())
    )
      return null;
    if (
      collection.isArchived ||
      collection.aliasPaths?.length ||
      collection.aliasPathsToAdd?.length ||
      collection.cosmosCoinWrapperPaths?.length ||
      collection.cosmosCoinWrapperPathsToAdd?.length
    )
      return null;
    return profile;
  } catch {
    return null;
  }
}

export function buildSubscriptionUpgradeEscrow(o: SubscriptionUpgradeNativeOffer) {
  validateOffer(o);
  if (!o.source) throw new Error('Escrow requires a source entitlement.');
  const forbidden = { permanentlyPermittedTimes: [], permanentlyForbiddenTimes: full() };
  const permission = { ...forbidden, initiatedByListId: 'All', tokenIds: full(), ownershipTimes: full(), transferTimes: full(), approvalId: 'All' };
  return new MsgUpdateUserApprovals<bigint>({
    creator: o.source.escrow,
    collectionId: o.collectionId.toString(),
    updateIncomingApprovals: true,
    incomingApprovals: [
      {
        approvalId: 'subscription-v2-intake',
        fromListId: o.subscriber,
        initiatedByListId: o.subscriber,
        tokenIds: [{ start: o.source.tokenId, end: o.source.tokenId }],
        ownershipTimes: o.source.ownershipTimes,
        transferTimes: [{ start: o.createdAt, end: o.expiresAt }],
        approvalCriteria: exactIntake(o)
      }
    ],
    updateOutgoingApprovals: true,
    outgoingApprovals: [],
    updateAutoApproveAllIncomingTransfers: true,
    autoApproveAllIncomingTransfers: false,
    updateAutoApproveSelfInitiatedIncomingTransfers: true,
    autoApproveSelfInitiatedIncomingTransfers: false,
    updateAutoApproveSelfInitiatedOutgoingTransfers: true,
    autoApproveSelfInitiatedOutgoingTransfers: false,
    updateUserPermissions: true,
    userPermissions: {
      canUpdateIncomingApprovals: [{ ...permission, fromListId: 'All' }],
      canUpdateOutgoingApprovals: [{ ...permission, toListId: 'All' }],
      canUpdateAutoApproveAllIncomingTransfers: [forbidden],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [forbidden],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [forbidden]
    }
  } as any);
}
function exactIntake(o: SubscriptionUpgradeNativeOffer) {
  return { predeterminedBalances: exact([balance(o.source!.tokenId, o.source!.ownershipTimes)]), maxNumTransfers: once('subscription-v2-intake') };
}

export function buildSubscriptionUpgradeOffer(o: SubscriptionUpgradeNativeOffer) {
  validateOffer(o);
  const mustOwnTokens: any[] = [];
  if (o.source)
    mustOwnTokens.push({
      collectionId: o.collectionId.toString(),
      amountRange: { start: 1n, end: 1n },
      tokenIds: [{ start: o.source.tokenId, end: o.source.tokenId }],
      ownershipTimes: o.source.ownershipTimes,
      ownershipCheckParty: o.source.escrow,
      mustSatisfyForAllAssets: true
    });
  mustOwnTokens.push({
    collectionId: o.collectionId.toString(),
    amountRange: { start: 0n, end: 0n },
    tokenIds: [{ start: 1n, end: o.tierCount }],
    ownershipTimes: o.source ? [{ start: o.createdAt, end: MAX }] : o.ownershipTimes,
    ownershipCheckParty: o.subscriber,
    mustSatisfyForAllAssets: true
  });
  return new MsgSetOutgoingApproval<bigint>({
    creator: o.operator,
    collectionId: o.collectionId.toString(),
    approval: {
      approvalId: o.approvalId,
      toListId: o.subscriber,
      initiatedByListId: o.initiator,
      tokenIds: [{ start: o.targetTokenId, end: o.targetTokenId }],
      ownershipTimes: o.ownershipTimes,
      transferTimes: [{ start: o.createdAt, end: o.expiresAt }],
      approvalCriteria: {
        predeterminedBalances: exact([balance(o.targetTokenId, o.ownershipTimes)]),
        maxNumTransfers: once(o.approvalId),
        mustOwnTokens,
        coinTransfers: o.payments.map((p) => ({ to: p.to, coins: [{ denom: p.denom, amount: p.amount }] }))
      }
    }
  } as any);
}

export function buildSubscriptionUpgradeTransfers(
  o: SubscriptionUpgradeNativeOffer,
  versions: { surrender: bigint; delivery: bigint; outgoing: bigint; intake?: bigint }
) {
  validateOffer(o);
  Object.values(versions).forEach((v) => uint(v, true));
  if (o.source && versions.intake === undefined) throw new Error('Escrow intake approval version is required.');
  const prioritized = (approvalId: string, version: bigint, approvalLevel = 'collection', approverAddress = '') => ({
    approvalId,
    version,
    approvalLevel,
    approverAddress
  });
  const transfers: any[] = [];
  if (o.source)
    transfers.push({
      from: o.subscriber,
      toAddresses: [o.source.escrow],
      balances: [balance(o.source.tokenId, o.source.ownershipTimes)],
      prioritizedApprovals: [
        prioritized(SUBSCRIPTION_UPGRADE_APPROVALS.surrender, versions.surrender),
        prioritized('subscription-v2-intake', versions.intake!, 'incoming', o.source.escrow)
      ],
      onlyCheckPrioritizedCollectionApprovals: true,
      onlyCheckPrioritizedIncomingApprovals: true
    });
  transfers.push({
    from: o.operator,
    toAddresses: [o.subscriber],
    balances: [balance(o.targetTokenId, o.ownershipTimes)],
    prioritizedApprovals: [
      prioritized(SUBSCRIPTION_UPGRADE_APPROVALS.delivery, versions.delivery),
      prioritized(o.approvalId, versions.outgoing, 'outgoing', o.operator)
    ],
    onlyCheckPrioritizedCollectionApprovals: true,
    onlyCheckPrioritizedOutgoingApprovals: true
  });
  return new MsgTransferTokens<bigint>({ creator: o.initiator, collectionId: o.collectionId.toString(), transfers });
}

export function buildSubscriptionUpgradeInventory({
  profile,
  collectionId,
  version
}: {
  profile: SubscriptionUpgradeNativeProfile;
  collectionId: bigint;
  version: bigint;
}) {
  validateProfile(profile);
  uint(collectionId);
  uint(version, true);
  return new MsgTransferTokens<bigint>({
    creator: profile.operator,
    collectionId: collectionId.toString(),
    transfers: [
      {
        from: 'Mint',
        toAddresses: [profile.operator],
        balances: [{ amount: MAX, tokenIds: [{ start: 1n, end: BigInt(profile.tiers.length) }], ownershipTimes: full() }],
        prioritizedApprovals: [{ approvalId: SUBSCRIPTION_UPGRADE_APPROVALS.inventory, approvalLevel: 'collection', approverAddress: '', version }],
        onlyCheckPrioritizedCollectionApprovals: true
      }
    ]
  });
}
