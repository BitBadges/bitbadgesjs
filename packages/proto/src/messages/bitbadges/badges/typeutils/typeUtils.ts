import { UserApprovedOutgoingTransferTimelineBase, UserApprovedIncomingTransferTimelineBase, UserApprovedOutgoingTransferTimeline, UserApprovedIncomingTransferTimeline, s_UserApprovedOutgoingTransferTimeline, s_UserApprovedIncomingTransferTimeline, convertToUserApprovedOutgoingTransferTimeline, convertToUserApprovedIncomingTransferTimeline, convertFromUserApprovedOutgoingTransferTimeline, convertFromUserApprovedIncomingTransferTimeline, CollectionApprovedTransfer, CollectionApprovedTransferBase, convertFromCollectionApprovedTransfer, convertToCollectionApprovedTransfer, s_CollectionApprovedTransfer } from "./approvedTransfers";
import { UserPermissionsBase, UserPermissions, s_UserPermissions, convertToUserPermissions, convertFromUserPermissions } from "./permissions";

export interface UserBalanceBase {
  balances: BalanceBase[];
  approvedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimelineBase[];
  approvedIncomingTransfersTimeline: UserApprovedIncomingTransferTimelineBase[];
  userPermissions: UserPermissionsBase;
}

export interface UserBalance extends UserBalanceBase {
  balances: Balance[];
  approvedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimeline[];
  approvedIncomingTransfersTimeline: UserApprovedIncomingTransferTimeline[];
  userPermissions: UserPermissions;
}

export interface s_UserBalance extends UserBalanceBase {
  balances: s_Balance[];
  approvedOutgoingTransfersTimeline: s_UserApprovedOutgoingTransferTimeline[];
  approvedIncomingTransfersTimeline: s_UserApprovedIncomingTransferTimeline[];
  userPermissions: s_UserPermissions;
}

export function convertToUserBalance(s_balance: s_UserBalance): UserBalance {
  return {
    ...s_balance,
    balances: s_balance.balances.map(convertToBalance),
    approvedOutgoingTransfersTimeline: s_balance.approvedOutgoingTransfersTimeline.map(convertToUserApprovedOutgoingTransferTimeline),
    approvedIncomingTransfersTimeline: s_balance.approvedIncomingTransfersTimeline.map(convertToUserApprovedIncomingTransferTimeline),
    userPermissions: convertToUserPermissions(s_balance.userPermissions)
  }
}

export function convertFromUserBalance(balance: UserBalance): s_UserBalance {
  return {
    ...balance,
    balances: balance.balances.map(convertFromBalance),
    approvedOutgoingTransfersTimeline: balance.approvedOutgoingTransfersTimeline.map(convertFromUserApprovedOutgoingTransferTimeline),
    approvedIncomingTransfersTimeline: balance.approvedIncomingTransfersTimeline.map(convertFromUserApprovedIncomingTransferTimeline),
    userPermissions: convertFromUserPermissions(balance.userPermissions)
  }
}

export interface UintRangeBase {
  start: bigint | string;
  end: bigint | string;
}

export interface UintRange extends UintRangeBase {
  start: bigint;
  end: bigint;
}

export interface s_UintRange extends UintRangeBase {
  start: string;
  end: string;
}

export function convertToUintRange(s_range: s_UintRange): UintRange {
  return {
    ...s_range,
    start: BigInt(s_range.start),
    end: BigInt(s_range.end)
  }
}

export function convertFromUintRange(range: UintRange): s_UintRange {
  return {
    ...range,
    start: range.start.toString(),
    end: range.end.toString()
  }
}

export interface BadgeMetadataBase {
  uri: string
  customData: string
  badgeIds: UintRangeBase[]
}

export interface BadgeMetadata extends BadgeMetadataBase {
  badgeIds: UintRange[]
}

export interface s_BadgeMetadata extends BadgeMetadataBase {
  badgeIds: s_UintRange[]
}

export function convertToBadgeMetadata(s_uri: s_BadgeMetadata): BadgeMetadata {
  return {
    ...s_uri,
    badgeIds: s_uri.badgeIds.map(convertToUintRange)
  }
}

export function convertFromBadgeMetadata(uri: BadgeMetadata): s_BadgeMetadata {
  return {
    ...uri,
    badgeIds: uri.badgeIds.map(convertFromUintRange)
  }
}

export interface CollectionMetadataBase {
  uri: string
  customData: string
}

export interface CollectionMetadata extends CollectionMetadataBase { }

export interface s_CollectionMetadata extends CollectionMetadataBase { }

export function convertToCollectionMetadata(s_uri: s_CollectionMetadata): CollectionMetadata {
  return {
    ...s_uri,
  }
}

export function convertFromCollectionMetadata(uri: CollectionMetadata): s_CollectionMetadata {
  return {
    ...uri,
  }
}

export interface OffChainBalancesMetadataBase {
  uri: string
  customData: string
}

export interface OffChainBalancesMetadata extends OffChainBalancesMetadataBase { }

export interface s_OffChainBalancesMetadata extends OffChainBalancesMetadataBase { }

export function convertToOffChainBalancesMetadata(s_uri: s_OffChainBalancesMetadata): OffChainBalancesMetadata {
  return {
    ...s_uri,
  }
}

export function convertFromOffChainBalancesMetadata(uri: OffChainBalancesMetadata): s_OffChainBalancesMetadata {
  return {
    ...uri,
  }
}

export interface MustOwnBadgesBase {
  collectionId: bigint | string;

  amountRange: UintRangeBase;
  ownedTimes: UintRangeBase[];
  badgeIds: UintRangeBase[];
}

export interface s_MustOwnBadges extends MustOwnBadgesBase {
  collectionId: string;

  amountRange: s_UintRange;
  ownedTimes: s_UintRange[];
  badgeIds: s_UintRange[];
}

export interface MustOwnBadges extends MustOwnBadgesBase {
  collectionId: bigint;

  amountRange: UintRange;
  ownedTimes: UintRange[];
  badgeIds: UintRange[];
}

export function convertToMustOwnBadges(s_badges: s_MustOwnBadges): MustOwnBadges {
  return {
    ...s_badges,
    collectionId: BigInt(s_badges.collectionId),
    amountRange: convertToUintRange(s_badges.amountRange),
    ownedTimes: s_badges.ownedTimes.map(convertToUintRange),
    badgeIds: s_badges.badgeIds.map(convertToUintRange)
  }
}

export function convertFromMustOwnBadges(badgesRange: MustOwnBadges): s_MustOwnBadges {
  return {
    ...badgesRange,
    collectionId: badgesRange.collectionId.toString(),
    amountRange: convertFromUintRange(badgesRange.amountRange),
    ownedTimes: badgesRange.ownedTimes.map(convertFromUintRange),
    badgeIds: badgesRange.badgeIds.map(convertFromUintRange)
  }
}

export interface InheritedBalanceBase {
  badgeIds: UintRangeBase[];
  parentCollectionId: bigint | string;
  parentBadgeIds: UintRangeBase[];
}

export interface InheritedBalance extends InheritedBalanceBase {
  badgeIds: UintRange[];
  parentCollectionId: bigint;
  parentBadgeIds: UintRange[];
}

export interface s_InheritedBalance extends InheritedBalanceBase {
  badgeIds: s_UintRange[];
  parentCollectionId: string;
  parentBadgeIds: s_UintRange[];
}

export function convertToInheritedBalance(s_balance: s_InheritedBalance): InheritedBalance {
  return {
    ...s_balance,
    badgeIds: s_balance.badgeIds.map(convertToUintRange),
    parentCollectionId: BigInt(s_balance.parentCollectionId),
    parentBadgeIds: s_balance.parentBadgeIds.map(convertToUintRange)
  }
}

export function convertFromInheritedBalance(balance: InheritedBalance): s_InheritedBalance {
  return {
    ...balance,
    badgeIds: balance.badgeIds.map(convertFromUintRange),
    parentCollectionId: balance.parentCollectionId.toString(),
    parentBadgeIds: balance.parentBadgeIds.map(convertFromUintRange)
  }
}


export interface BalanceBase {
  amount: bigint | string;
  badgeIds: UintRangeBase[]
  ownedTimes: UintRangeBase[]
}

export interface Balance extends BalanceBase {
  amount: bigint;
  badgeIds: UintRange[];
  ownedTimes: UintRange[];
}

export interface s_Balance extends BalanceBase {
  amount: string;
  badgeIds: s_UintRange[];
  ownedTimes: s_UintRange[];
}

export function convertToBalance(s_balance: s_Balance): Balance {
  return {
    ...s_balance,
    amount: BigInt(s_balance.amount),
    badgeIds: s_balance.badgeIds.map(convertToUintRange),
    ownedTimes: s_balance.ownedTimes.map(convertToUintRange)
  }
}

export function convertFromBalance(balance: Balance): s_Balance {
  return {
    ...balance,
    amount: balance.amount.toString(),
    badgeIds: balance.badgeIds.map(convertFromUintRange),
    ownedTimes: balance.ownedTimes.map(convertFromUintRange)
  }
}

export interface AddressMappingBase {
  mappingId: string;

  addresses: string[];
  includeAddresses: boolean;

  uri: string;
  customData: string;
}

export interface AddressMapping extends AddressMappingBase {
}

export interface s_AddressMapping extends AddressMappingBase {
}

export function convertToAddressMapping(s_mapping: s_AddressMapping): AddressMapping {
  return {
    ...s_mapping,
  }
}

export function convertFromAddressMapping(mapping: AddressMapping): s_AddressMapping {
  return {
    ...mapping,
  }
}



export interface TransferBase {
  from: string
  toAddresses: string[]
  balances: BalanceBase[]
  precalculateFromApproval: ApprovalIdDetailsBase
  merkleProofs: MerkleProof[]
  memo: string
}

export interface Transfer extends TransferBase {
  balances: Balance[]
  precalculateFromApproval: ApprovalIdDetails
  merkleProofs: MerkleProof[]
}

export interface s_Transfer extends TransferBase {
  balances: s_Balance[]
  precalculateFromApproval: s_ApprovalIdDetails
  merkleProofs: MerkleProof[]
}

export function convertToTransfer(s_transfer: s_Transfer): Transfer {
  return {
    ...s_transfer,
    balances: s_transfer.balances.map(convertToBalance),
    precalculateFromApproval: convertToApprovalIdDetails(s_transfer.precalculateFromApproval),
  }
}

export function convertFromTransfer(transfer: Transfer): s_Transfer {
  return {
    ...transfer,
    balances: transfer.balances.map(convertFromBalance),
    precalculateFromApproval: convertFromApprovalIdDetails(transfer.precalculateFromApproval),
  }
}

export interface ApprovalIdDetailsBase {
  approvalId: string
  approvalLevel: string
  address: string
}

export interface ApprovalIdDetails extends ApprovalIdDetailsBase {
}

export interface s_ApprovalIdDetails extends ApprovalIdDetailsBase { }

export function convertToApprovalIdDetails(s_approvalIdDetails: s_ApprovalIdDetails): ApprovalIdDetails {
  return {
    ...s_approvalIdDetails,
  }
}

export function convertFromApprovalIdDetails(approvalIdDetails: ApprovalIdDetails): s_ApprovalIdDetails {
  return {
    ...approvalIdDetails,
  }
}

export interface MerkleChallengeBase {
  root: string
  expectedProofLength: bigint | string;
  useCreatorAddressAsLeaf: boolean
  maxOneUsePerLeaf: boolean
  useLeafIndexForTransferOrder: boolean
  challengeId: string
}

export interface MerkleChallenge extends MerkleChallengeBase {
  expectedProofLength: bigint;
}

export interface s_MerkleChallenge extends MerkleChallengeBase {
  expectedProofLength: string;
}

export function convertToMerkleChallenge(s_challenge: s_MerkleChallenge): MerkleChallenge {
  return {
    ...s_challenge,
    expectedProofLength: BigInt(s_challenge.expectedProofLength)
  }
}

export function convertFromMerkleChallenge(challenge: MerkleChallenge): s_MerkleChallenge {
  return {
    ...challenge,
    expectedProofLength: challenge.expectedProofLength.toString()
  }
}

export interface MerklePathItem {
  aunt: string
  onRight: boolean
}

export interface MerkleProof {
  aunts: MerklePathItem[]
  leaf: string
}

export interface ManagerTimelineBase {
  manager: string
  timelineTimes: UintRangeBase[]
}

export interface ManagerTimeline extends ManagerTimelineBase {
  timelineTimes: UintRange[]
}

export interface s_ManagerTimeline extends ManagerTimelineBase {
  timelineTimes: s_UintRange[]
}

export function convertToManagerTimeline(s_timeline: s_ManagerTimeline): ManagerTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange)
  }
}

export function convertFromManagerTimeline(timeline: ManagerTimeline): s_ManagerTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange)
  }
}

export interface CollectionMetadataTimelineBase {
  collectionMetadata: CollectionMetadataBase
  timelineTimes: UintRangeBase[]
}

export interface CollectionMetadataTimeline extends CollectionMetadataTimelineBase {
  timelineTimes: UintRange[]
  collectionMetadata: CollectionMetadata
}

export interface s_CollectionMetadataTimeline extends CollectionMetadataTimelineBase {
  timelineTimes: s_UintRange[]
  collectionMetadata: s_CollectionMetadata
}

export function convertToCollectionMetadataTimeline(s_timeline: s_CollectionMetadataTimeline): CollectionMetadataTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange),
    collectionMetadata: convertToCollectionMetadata(s_timeline.collectionMetadata)
  }
}

export function convertFromCollectionMetadataTimeline(timeline: CollectionMetadataTimeline): s_CollectionMetadataTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange),
    collectionMetadata: convertFromCollectionMetadata(timeline.collectionMetadata)
  }
}

export interface BadgeMetadataTimelineBase {
  badgeMetadata: BadgeMetadataBase[]
  timelineTimes: UintRangeBase[]
}

export interface BadgeMetadataTimeline extends BadgeMetadataTimelineBase {
  timelineTimes: UintRange[]
  badgeMetadata: BadgeMetadata[]
}

export interface s_BadgeMetadataTimeline extends BadgeMetadataTimelineBase {
  timelineTimes: s_UintRange[]
  badgeMetadata: s_BadgeMetadata[]
}

export function convertToBadgeMetadataTimeline(s_timeline: s_BadgeMetadataTimeline): BadgeMetadataTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange),
    badgeMetadata: s_timeline.badgeMetadata.map(convertToBadgeMetadata)
  }
}

export function convertFromBadgeMetadataTimeline(timeline: BadgeMetadataTimeline): s_BadgeMetadataTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange),
    badgeMetadata: timeline.badgeMetadata.map(convertFromBadgeMetadata)
  }
}

export interface OffChainBalancesMetadataTimelineBase {
  offChainBalancesMetadata: OffChainBalancesMetadataBase
  timelineTimes: UintRangeBase[]
}

export interface OffChainBalancesMetadataTimeline extends OffChainBalancesMetadataTimelineBase {
  timelineTimes: UintRange[]
  offChainBalancesMetadata: OffChainBalancesMetadata
}

export interface s_OffChainBalancesMetadataTimeline extends OffChainBalancesMetadataTimelineBase {
  timelineTimes: s_UintRange[]
  offChainBalancesMetadata: s_OffChainBalancesMetadata
}

export function convertToOffChainBalancesMetadataTimeline(s_timeline: s_OffChainBalancesMetadataTimeline): OffChainBalancesMetadataTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange),
    offChainBalancesMetadata: convertToOffChainBalancesMetadata(s_timeline.offChainBalancesMetadata)
  }
}

export function convertFromOffChainBalancesMetadataTimeline(timeline: OffChainBalancesMetadataTimeline): s_OffChainBalancesMetadataTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange),
    offChainBalancesMetadata: convertFromOffChainBalancesMetadata(timeline.offChainBalancesMetadata)
  }
}

export interface CustomDataTimelineBase {
  customData: string
  timelineTimes: UintRangeBase[]
}

export interface CustomDataTimeline extends CustomDataTimelineBase {
  timelineTimes: UintRange[]
}

export interface s_CustomDataTimeline extends CustomDataTimelineBase {
  timelineTimes: s_UintRange[]
}

export function convertToCustomDataTimeline(s_timeline: s_CustomDataTimeline): CustomDataTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange)
  }
}

export function convertFromCustomDataTimeline(timeline: CustomDataTimeline): s_CustomDataTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange)
  }
}

export interface InheritedBalancesTimelineBase {
  inheritedBalances: InheritedBalanceBase[]
  timelineTimes: UintRangeBase[]
}

export interface InheritedBalancesTimeline extends InheritedBalancesTimelineBase {
  timelineTimes: UintRange[]
  inheritedBalances: InheritedBalance[]
}

export interface s_InheritedBalancesTimeline extends InheritedBalancesTimelineBase {
  timelineTimes: s_UintRange[]
  inheritedBalances: s_InheritedBalance[]
}

export function convertToInheritedBalancesTimeline(s_timeline: s_InheritedBalancesTimeline): InheritedBalancesTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange),
    inheritedBalances: s_timeline.inheritedBalances.map(convertToInheritedBalance)
  }
}

export function convertFromInheritedBalancesTimeline(timeline: InheritedBalancesTimeline): s_InheritedBalancesTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange),
    inheritedBalances: timeline.inheritedBalances.map(convertFromInheritedBalance)
  }
}

export interface StandardsTimelineBase {
  standards: string[]
  timelineTimes: UintRangeBase[]
}

export interface StandardsTimeline extends StandardsTimelineBase {
  timelineTimes: UintRange[]
}

export interface s_StandardsTimeline extends StandardsTimelineBase {
  timelineTimes: s_UintRange[]
}

export function convertToStandardsTimeline(s_timeline: s_StandardsTimeline): StandardsTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange)
  }
}

export function convertFromStandardsTimeline(timeline: StandardsTimeline): s_StandardsTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange)
  }
}

export interface ContractAddressTimelineBase {
  contractAddress: string
  timelineTimes: UintRangeBase[]
}

export interface ContractAddressTimeline extends ContractAddressTimelineBase {
  timelineTimes: UintRange[]
}

export interface s_ContractAddressTimeline extends ContractAddressTimelineBase {
  timelineTimes: s_UintRange[]
}

export function convertToContractAddressTimeline(s_timeline: s_ContractAddressTimeline): ContractAddressTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange)
  }

}

export function convertFromContractAddressTimeline(timeline: ContractAddressTimeline): s_ContractAddressTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange)
  }
}

export interface IsArchivedTimelineBase {
  isArchived: boolean
  timelineTimes: UintRangeBase[]
}

export interface IsArchivedTimeline extends IsArchivedTimelineBase {
  timelineTimes: UintRange[]
}

export interface s_IsArchivedTimeline extends IsArchivedTimelineBase {
  timelineTimes: s_UintRange[]
}

export function convertToIsArchivedTimeline(s_timeline: s_IsArchivedTimeline): IsArchivedTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange)
  }
}

export function convertFromIsArchivedTimeline(timeline: IsArchivedTimeline): s_IsArchivedTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange)
  }
}

export interface CollectionApprovedTransferTimelineBase {
  collectionApprovedTransfers: CollectionApprovedTransferBase[]
  timelineTimes: UintRangeBase[]
}

export interface CollectionApprovedTransferTimeline extends CollectionApprovedTransferTimelineBase {
  timelineTimes: UintRange[]
  collectionApprovedTransfers: CollectionApprovedTransfer[]
}

export interface s_CollectionApprovedTransferTimeline extends CollectionApprovedTransferTimelineBase {
  timelineTimes: s_UintRange[]
  collectionApprovedTransfers: s_CollectionApprovedTransfer[]
}

export function convertToCollectionApprovedTransferTimeline(s_timeline: s_CollectionApprovedTransferTimeline): CollectionApprovedTransferTimeline {
  return {
    ...s_timeline,
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange),
    collectionApprovedTransfers: s_timeline.collectionApprovedTransfers.map(convertToCollectionApprovedTransfer)
  }
}

export function convertFromCollectionApprovedTransferTimeline(timeline: CollectionApprovedTransferTimeline): s_CollectionApprovedTransferTimeline {
  return {
    ...timeline,
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange),
    collectionApprovedTransfers: timeline.collectionApprovedTransfers.map(convertFromCollectionApprovedTransfer)
  }
}
