import { UintRangeBase, UintRange, convertToUintRange, convertFromUintRange, s_UintRange, MerkleChallenge, MerkleChallengeBase, MustOwnBadges, MustOwnBadgesBase, convertFromMerkleChallenge, convertFromMustOwnBadges, convertToMerkleChallenge, convertToMustOwnBadges, s_MerkleChallenge, s_MustOwnBadges, Balance, BalanceBase, convertFromBalance, convertToBalance, s_Balance } from "./typeUtils";

export interface UserApprovedOutgoingTransferTimelineBase {
  approvedOutgoingTransfers: UserApprovedOutgoingTransferBase[];
  timelineTimes: UintRangeBase[];
}

export interface UserApprovedOutgoingTransferTimeline extends UserApprovedOutgoingTransferTimelineBase {
  approvedOutgoingTransfers: UserApprovedOutgoingTransfer[];
  timelineTimes: UintRange[];
}

export interface s_UserApprovedOutgoingTransferTimeline extends UserApprovedOutgoingTransferTimelineBase {
  approvedOutgoingTransfers: s_UserApprovedOutgoingTransfer[];
  timelineTimes: s_UintRange[];
}

export function convertToUserApprovedOutgoingTransferTimeline(s_timeline: s_UserApprovedOutgoingTransferTimeline): UserApprovedOutgoingTransferTimeline {
  return {
    ...s_timeline,
    approvedOutgoingTransfers: s_timeline.approvedOutgoingTransfers.map(convertToUserApprovedOutgoingTransfer),
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange)
  };
}

export function convertFromUserApprovedOutgoingTransferTimeline(timeline: UserApprovedOutgoingTransferTimeline): s_UserApprovedOutgoingTransferTimeline {
  return {
    ...timeline,
    approvedOutgoingTransfers: timeline.approvedOutgoingTransfers.map(convertFromUserApprovedOutgoingTransfer),
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange)
  };
}

export interface UserApprovedOutgoingTransferBase {
  toMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRangeBase[];
  badgeIds: UintRangeBase[];
  ownedTimes: UintRangeBase[];
  allowedCombinations: IsUserOutgoingTransferAllowedBase[];
  approvalDetails: OutgoingApprovalDetailsBase[];
}

export interface UserApprovedOutgoingTransfer extends UserApprovedOutgoingTransferBase {
  transferTimes: UintRange[];
  badgeIds: UintRange[];
  ownedTimes: UintRange[];
  allowedCombinations: IsUserOutgoingTransferAllowed[];
  approvalDetails: OutgoingApprovalDetails[];
}

export interface s_UserApprovedOutgoingTransfer extends UserApprovedOutgoingTransferBase {
  transferTimes: s_UintRange[];
  badgeIds: s_UintRange[];
  ownedTimes: s_UintRange[];
  allowedCombinations: s_IsUserOutgoingTransferAllowed[];
  approvalDetails: s_OutgoingApprovalDetails[];
}

export function convertToUserApprovedOutgoingTransfer(s_transfer: s_UserApprovedOutgoingTransfer): UserApprovedOutgoingTransfer {
  return {
    ...s_transfer,
    transferTimes: s_transfer.transferTimes.map(convertToUintRange),
    badgeIds: s_transfer.badgeIds.map(convertToUintRange),
    ownedTimes: s_transfer.ownedTimes.map(convertToUintRange),
    allowedCombinations: s_transfer.allowedCombinations.map(convertToIsUserOutgoingTransferAllowed),
    approvalDetails: s_transfer.approvalDetails.map(convertToOutgoingApprovalDetails)
  };
}

export function convertFromUserApprovedOutgoingTransfer(transfer: UserApprovedOutgoingTransfer): s_UserApprovedOutgoingTransfer {
  return {
    ...transfer,
    transferTimes: transfer.transferTimes.map(convertFromUintRange),
    badgeIds: transfer.badgeIds.map(convertFromUintRange),
    ownedTimes: transfer.ownedTimes.map(convertFromUintRange),
    allowedCombinations: transfer.allowedCombinations.map(convertFromIsUserOutgoingTransferAllowed),
    approvalDetails: transfer.approvalDetails.map(convertFromOutgoingApprovalDetails)
  };
}

export interface IsUserOutgoingTransferAllowedBase {
  invertTo: boolean;
  invertInitiatedBy: boolean;
  invertTransferTimes: boolean;
  invertBadgeIds: boolean;
  invertOwnedTimes: boolean;
  isAllowed: boolean;
}

export interface IsUserOutgoingTransferAllowed extends IsUserOutgoingTransferAllowedBase { }

export interface s_IsUserOutgoingTransferAllowed extends IsUserOutgoingTransferAllowedBase { }

export function convertToIsUserOutgoingTransferAllowed(s_allowed: s_IsUserOutgoingTransferAllowed): IsUserOutgoingTransferAllowed {
  return {
    ...s_allowed
  };
}

export function convertFromIsUserOutgoingTransferAllowed(allowed: IsUserOutgoingTransferAllowed): s_IsUserOutgoingTransferAllowed {
  return {
    ...allowed
  };
}

export interface OutgoingApprovalDetailsBase {
  approvalId: string;
  uri: string;
  customData: string;

  mustOwnBadges: MustOwnBadgesBase[];
  merkleChallenges: MerkleChallengeBase[];
  predeterminedBalances: PredeterminedBalancesBase;
  approvalAmounts: ApprovalAmountsBase;
  maxNumTransfers: MaxNumTransfersBase;

  requireToEqualsInitiatedBy: boolean;
  requireToDoesNotEqualInitiatedBy: boolean;
}

export interface OutgoingApprovalDetails extends OutgoingApprovalDetailsBase {
  mustOwnBadges: MustOwnBadges[];
  merkleChallenges: MerkleChallenge[];
  predeterminedBalances: PredeterminedBalances;
  approvalAmounts: ApprovalAmounts;
  maxNumTransfers: MaxNumTransfers;
}

export interface s_OutgoingApprovalDetails extends OutgoingApprovalDetailsBase {
  mustOwnBadges: s_MustOwnBadges[];
  merkleChallenges: s_MerkleChallenge[];
  predeterminedBalances: s_PredeterminedBalances;
  approvalAmounts: s_ApprovalAmounts;
  maxNumTransfers: s_MaxNumTransfers;
}

export function convertToOutgoingApprovalDetails(s_details: s_OutgoingApprovalDetails): OutgoingApprovalDetails {
  return {
    ...s_details,
    mustOwnBadges: s_details.mustOwnBadges.map(convertToMustOwnBadges),
    merkleChallenges: s_details.merkleChallenges.map(convertToMerkleChallenge),
    predeterminedBalances: convertToPredeterminedBalances(s_details.predeterminedBalances),
    approvalAmounts: convertToApprovalAmounts(s_details.approvalAmounts),
    maxNumTransfers: convertToMaxNumTransfers(s_details.maxNumTransfers)
  };
}

export function convertFromOutgoingApprovalDetails(details: OutgoingApprovalDetails): s_OutgoingApprovalDetails {
  return {
    ...details,
    mustOwnBadges: details.mustOwnBadges.map(convertFromMustOwnBadges),
    merkleChallenges: details.merkleChallenges.map(convertFromMerkleChallenge),
    predeterminedBalances: convertFromPredeterminedBalances(details.predeterminedBalances),
    approvalAmounts: convertFromApprovalAmounts(details.approvalAmounts),
    maxNumTransfers: convertFromMaxNumTransfers(details.maxNumTransfers)
  };
}

export interface PredeterminedBalancesBase {
  manualBalances: ManualBalancesBase[];
  incrementedBalances: IncrementedBalancesBase;
  orderCalculationMethod: PredeterminedOrderCalculationMethodBase;
}

export interface PredeterminedBalances extends PredeterminedBalancesBase {
  manualBalances: ManualBalances[];
  incrementedBalances: IncrementedBalances;
  orderCalculationMethod: PredeterminedOrderCalculationMethod;
}

export interface s_PredeterminedBalances extends PredeterminedBalancesBase {
  manualBalances: s_ManualBalances[];
  incrementedBalances: s_IncrementedBalances;
  orderCalculationMethod: s_PredeterminedOrderCalculationMethod;
}

export function convertToPredeterminedBalances(s_balances: s_PredeterminedBalances): PredeterminedBalances {
  return {
    ...s_balances,
    manualBalances: s_balances.manualBalances.map(convertToManualBalances),
    incrementedBalances: convertToIncrementedBalances(s_balances.incrementedBalances),
    orderCalculationMethod: convertToPredeterminedOrderCalculationMethod(s_balances.orderCalculationMethod)
  };
}

export function convertFromPredeterminedBalances(balances: PredeterminedBalances): s_PredeterminedBalances {
  return {
    ...balances,
    manualBalances: balances.manualBalances.map(convertFromManualBalances),
    incrementedBalances: convertFromIncrementedBalances(balances.incrementedBalances),
    orderCalculationMethod: convertFromPredeterminedOrderCalculationMethod(balances.orderCalculationMethod)
  };
}

export interface ManualBalancesBase {
  balances: BalanceBase[];
}

export interface ManualBalances extends ManualBalancesBase {
  balances: Balance[];
}

export interface s_ManualBalances extends ManualBalancesBase {
  balances: s_Balance[];
}

export function convertToManualBalances(s_balances: s_ManualBalances): ManualBalances {
  return {
    ...s_balances,
    balances: s_balances.balances.map(convertToBalance)
  };
}

export function convertFromManualBalances(balances: ManualBalances): s_ManualBalances {
  return {
    ...balances,
    balances: balances.balances.map(convertFromBalance)
  };
}

export interface IncrementedBalancesBase {
  startBalances: BalanceBase[];
  incrementBadgeIdsBy: bigint | string;
  incrementOwnedTimesBy: bigint | string;
}

export interface IncrementedBalances extends IncrementedBalancesBase {
  startBalances: Balance[];
  incrementBadgeIdsBy: bigint;
  incrementOwnedTimesBy: bigint;
}

export interface s_IncrementedBalances extends IncrementedBalancesBase {
  startBalances: s_Balance[];
  incrementBadgeIdsBy: string;
  incrementOwnedTimesBy: string;
}

export function convertToIncrementedBalances(s_balances: s_IncrementedBalances): IncrementedBalances {
  return {
    ...s_balances,
    startBalances: s_balances.startBalances.map(convertToBalance),
    incrementBadgeIdsBy: BigInt(s_balances.incrementBadgeIdsBy),
    incrementOwnedTimesBy: BigInt(s_balances.incrementOwnedTimesBy)
  };
}

export function convertFromIncrementedBalances(balances: IncrementedBalances): s_IncrementedBalances {
  return {
    ...balances,
    startBalances: balances.startBalances.map(convertFromBalance),
    incrementBadgeIdsBy: balances.incrementBadgeIdsBy.toString(),
    incrementOwnedTimesBy: balances.incrementOwnedTimesBy.toString()
  };
}

export interface PredeterminedOrderCalculationMethodBase {
  useOverallNumTransfers: boolean;
  usePerToAddressNumTransfers: boolean;
  usePerFromAddressNumTransfers: boolean;
  usePerInitiatedByAddressNumTransfers: boolean;
  useMerkleChallengeLeafIndex: boolean;
}

export interface PredeterminedOrderCalculationMethod extends PredeterminedOrderCalculationMethodBase { }

export interface s_PredeterminedOrderCalculationMethod extends PredeterminedOrderCalculationMethodBase { }

export function convertToPredeterminedOrderCalculationMethod(s_method: s_PredeterminedOrderCalculationMethod): PredeterminedOrderCalculationMethod {
  return {
    ...s_method
  };
}

export function convertFromPredeterminedOrderCalculationMethod(method: PredeterminedOrderCalculationMethod): s_PredeterminedOrderCalculationMethod {
  return {
    ...method
  };
}

export interface ApprovalAmountsBase {
  overallApprovalAmount: bigint | string;
  perToAddressApprovalAmount: bigint | string;
  perFromAddressApprovalAmount: bigint | string;
  perInitiatedByAddressApprovalAmount: bigint | string;
}

export interface ApprovalAmounts extends ApprovalAmountsBase {
  overallApprovalAmount: bigint;
  perToAddressApprovalAmount: bigint;
  perFromAddressApprovalAmount: bigint;
  perInitiatedByAddressApprovalAmount: bigint;
}

export interface s_ApprovalAmounts extends ApprovalAmountsBase {
  overallApprovalAmount: string;
  perToAddressApprovalAmount: string;
  perFromAddressApprovalAmount: string;
  perInitiatedByAddressApprovalAmount: string;
}

export function convertToApprovalAmounts(s_amounts: s_ApprovalAmounts): ApprovalAmounts {
  return {
    ...s_amounts,
    overallApprovalAmount: BigInt(s_amounts.overallApprovalAmount),
    perToAddressApprovalAmount: BigInt(s_amounts.perToAddressApprovalAmount),
    perFromAddressApprovalAmount: BigInt(s_amounts.perFromAddressApprovalAmount),
    perInitiatedByAddressApprovalAmount: BigInt(s_amounts.perInitiatedByAddressApprovalAmount)
  };
}

export function convertFromApprovalAmounts(amounts: ApprovalAmounts): s_ApprovalAmounts {
  return {
    ...amounts,
    overallApprovalAmount: amounts.overallApprovalAmount.toString(),
    perToAddressApprovalAmount: amounts.perToAddressApprovalAmount.toString(),
    perFromAddressApprovalAmount: amounts.perFromAddressApprovalAmount.toString(),
    perInitiatedByAddressApprovalAmount: amounts.perInitiatedByAddressApprovalAmount.toString()
  };
}

export interface MaxNumTransfersBase {
  overallMaxNumTransfers: bigint | string;
  perToAddressMaxNumTransfers: bigint | string;
  perFromAddressMaxNumTransfers: bigint | string;
  perInitiatedByAddressMaxNumTransfers: bigint | string;
}

export interface MaxNumTransfers extends MaxNumTransfersBase {
  overallMaxNumTransfers: bigint;
  perToAddressMaxNumTransfers: bigint;
  perFromAddressMaxNumTransfers: bigint;
  perInitiatedByAddressMaxNumTransfers: bigint;
}

export interface s_MaxNumTransfers extends MaxNumTransfersBase {
  overallMaxNumTransfers: string;
  perToAddressMaxNumTransfers: string;
  perFromAddressMaxNumTransfers: string;
  perInitiatedByAddressMaxNumTransfers: string;
}

export function convertToMaxNumTransfers(s_amounts: s_MaxNumTransfers): MaxNumTransfers {
  return {
    ...s_amounts,
    overallMaxNumTransfers: BigInt(s_amounts.overallMaxNumTransfers),
    perToAddressMaxNumTransfers: BigInt(s_amounts.perToAddressMaxNumTransfers),
    perFromAddressMaxNumTransfers: BigInt(s_amounts.perFromAddressMaxNumTransfers),
    perInitiatedByAddressMaxNumTransfers: BigInt(s_amounts.perInitiatedByAddressMaxNumTransfers)
  };
}

export function convertFromMaxNumTransfers(amounts: MaxNumTransfers): s_MaxNumTransfers {
  return {
    ...amounts,
    overallMaxNumTransfers: amounts.overallMaxNumTransfers.toString(),
    perToAddressMaxNumTransfers: amounts.perToAddressMaxNumTransfers.toString(),
    perFromAddressMaxNumTransfers: amounts.perFromAddressMaxNumTransfers.toString(),
    perInitiatedByAddressMaxNumTransfers: amounts.perInitiatedByAddressMaxNumTransfers.toString()
  };
}



export interface UserApprovedIncomingTransferTimelineBase {
  approvedIncomingTransfers: UserApprovedIncomingTransferBase[];
  timelineTimes: UintRangeBase[];
}

export interface UserApprovedIncomingTransferTimeline extends UserApprovedIncomingTransferTimelineBase {
  approvedIncomingTransfers: UserApprovedIncomingTransfer[];
  timelineTimes: UintRange[];
}

export interface s_UserApprovedIncomingTransferTimeline extends UserApprovedIncomingTransferTimelineBase {
  approvedIncomingTransfers: s_UserApprovedIncomingTransfer[];
  timelineTimes: s_UintRange[];
}

export function convertToUserApprovedIncomingTransferTimeline(s_timeline: s_UserApprovedIncomingTransferTimeline): UserApprovedIncomingTransferTimeline {
  return {
    ...s_timeline,
    approvedIncomingTransfers: s_timeline.approvedIncomingTransfers.map(convertToUserApprovedIncomingTransfer),
    timelineTimes: s_timeline.timelineTimes.map(convertToUintRange)
  };
}

export function convertFromUserApprovedIncomingTransferTimeline(timeline: UserApprovedIncomingTransferTimeline): s_UserApprovedIncomingTransferTimeline {
  return {
    ...timeline,
    approvedIncomingTransfers: timeline.approvedIncomingTransfers.map(convertFromUserApprovedIncomingTransfer),
    timelineTimes: timeline.timelineTimes.map(convertFromUintRange)
  };
}

export interface UserApprovedIncomingTransferBase {
  fromMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRangeBase[];
  badgeIds: UintRangeBase[];
  ownedTimes: UintRangeBase[];
  allowedCombinations: IsUserIncomingTransferAllowedBase[];
  approvalDetails: IncomingApprovalDetailsBase[];
}

export interface UserApprovedIncomingTransfer extends UserApprovedIncomingTransferBase {
  transferTimes: UintRange[];
  badgeIds: UintRange[];
  ownedTimes: UintRange[];
  allowedCombinations: IsUserIncomingTransferAllowed[];
  approvalDetails: IncomingApprovalDetails[];
}

export interface s_UserApprovedIncomingTransfer extends UserApprovedIncomingTransferBase {
  transferTimes: s_UintRange[];
  badgeIds: s_UintRange[];
  ownedTimes: s_UintRange[];
  allowedCombinations: s_IsUserIncomingTransferAllowed[];
  approvalDetails: s_IncomingApprovalDetails[];
}

export function convertToUserApprovedIncomingTransfer(s_transfer: s_UserApprovedIncomingTransfer): UserApprovedIncomingTransfer {
  return {
    ...s_transfer,
    transferTimes: s_transfer.transferTimes.map(convertToUintRange),
    badgeIds: s_transfer.badgeIds.map(convertToUintRange),
    ownedTimes: s_transfer.ownedTimes.map(convertToUintRange),
    allowedCombinations: s_transfer.allowedCombinations.map(convertToIsUserIncomingTransferAllowed),
    approvalDetails: s_transfer.approvalDetails.map(convertToIncomingApprovalDetails)
  };
}

export function convertFromUserApprovedIncomingTransfer(transfer: UserApprovedIncomingTransfer): s_UserApprovedIncomingTransfer {
  return {
    ...transfer,
    transferTimes: transfer.transferTimes.map(convertFromUintRange),
    badgeIds: transfer.badgeIds.map(convertFromUintRange),
    ownedTimes: transfer.ownedTimes.map(convertFromUintRange),
    allowedCombinations: transfer.allowedCombinations.map(convertFromIsUserIncomingTransferAllowed),
    approvalDetails: transfer.approvalDetails.map(convertFromIncomingApprovalDetails)
  };
}

export interface IsUserIncomingTransferAllowedBase {
  invertFrom: boolean;
  invertInitiatedBy: boolean;
  invertTransferTimes: boolean;
  invertBadgeIds: boolean;
  invertOwnedTimes: boolean;
  isAllowed: boolean;
}

export interface IsUserIncomingTransferAllowed extends IsUserIncomingTransferAllowedBase { }

export interface s_IsUserIncomingTransferAllowed extends IsUserIncomingTransferAllowedBase { }

export function convertToIsUserIncomingTransferAllowed(s_allowed: s_IsUserIncomingTransferAllowed): IsUserIncomingTransferAllowed {
  return {
    ...s_allowed
  };
}

export function convertFromIsUserIncomingTransferAllowed(allowed: IsUserIncomingTransferAllowed): s_IsUserIncomingTransferAllowed {
  return {
    ...allowed
  };
}

export interface IncomingApprovalDetailsBase {
  approvalId: string;
  uri: string;
  customData: string;

  mustOwnBadges: MustOwnBadgesBase[];
  merkleChallenges: MerkleChallengeBase[];
  predeterminedBalances: PredeterminedBalancesBase;
  approvalAmounts: ApprovalAmountsBase;
  maxNumTransfers: MaxNumTransfersBase;

  requireFromEqualsInitiatedBy: boolean;
  requireFromDoesNotEqualInitiatedBy: boolean;
}

export interface IncomingApprovalDetails extends IncomingApprovalDetailsBase {
  mustOwnBadges: MustOwnBadges[];
  merkleChallenges: MerkleChallenge[];
  predeterminedBalances: PredeterminedBalances;
  approvalAmounts: ApprovalAmounts;
  maxNumTransfers: MaxNumTransfers;
}

export interface s_IncomingApprovalDetails extends IncomingApprovalDetailsBase {
  mustOwnBadges: s_MustOwnBadges[];
  merkleChallenges: s_MerkleChallenge[];
  predeterminedBalances: s_PredeterminedBalances;
  approvalAmounts: s_ApprovalAmounts;
  maxNumTransfers: s_MaxNumTransfers;
}

export function convertToIncomingApprovalDetails(s_details: s_IncomingApprovalDetails): IncomingApprovalDetails {
  return {
    ...s_details,
    mustOwnBadges: s_details.mustOwnBadges.map(convertToMustOwnBadges),
    merkleChallenges: s_details.merkleChallenges.map(convertToMerkleChallenge),
    predeterminedBalances: convertToPredeterminedBalances(s_details.predeterminedBalances),
    approvalAmounts: convertToApprovalAmounts(s_details.approvalAmounts),
    maxNumTransfers: convertToMaxNumTransfers(s_details.maxNumTransfers)
  };
}

export function convertFromIncomingApprovalDetails(details: IncomingApprovalDetails): s_IncomingApprovalDetails {
  return {
    ...details,
    mustOwnBadges: details.mustOwnBadges.map(convertFromMustOwnBadges),
    merkleChallenges: details.merkleChallenges.map(convertFromMerkleChallenge),
    predeterminedBalances: convertFromPredeterminedBalances(details.predeterminedBalances),
    approvalAmounts: convertFromApprovalAmounts(details.approvalAmounts),
    maxNumTransfers: convertFromMaxNumTransfers(details.maxNumTransfers)
  };
}


export interface CollectionApprovedTransferBase {
  toMappingId: string;
  fromMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRangeBase[];
  badgeIds: UintRangeBase[];
  ownedTimes: UintRangeBase[];
  allowedCombinations: IsCollectionTransferAllowedBase[];
  approvalDetails: ApprovalDetailsBase[];
}

export interface CollectionApprovedTransfer extends CollectionApprovedTransferBase {
  transferTimes: UintRange[];
  badgeIds: UintRange[];
  ownedTimes: UintRange[];
  allowedCombinations: IsCollectionTransferAllowed[];
  approvalDetails: ApprovalDetails[];
}

export interface s_CollectionApprovedTransfer extends CollectionApprovedTransferBase {
  transferTimes: s_UintRange[];
  badgeIds: s_UintRange[];
  ownedTimes: s_UintRange[];
  allowedCombinations: s_IsCollectionTransferAllowed[];
  approvalDetails: s_ApprovalDetails[];
}

export function convertToCollectionApprovedTransfer(s_transfer: s_CollectionApprovedTransfer): CollectionApprovedTransfer {
  return {
    ...s_transfer,
    transferTimes: s_transfer.transferTimes.map(convertToUintRange),
    badgeIds: s_transfer.badgeIds.map(convertToUintRange),
    ownedTimes: s_transfer.ownedTimes.map(convertToUintRange),
    allowedCombinations: s_transfer.allowedCombinations.map(convertToIsCollectionTransferAllowed),
    approvalDetails: s_transfer.approvalDetails.map(convertToApprovalDetails)
  };
}

export function convertFromCollectionApprovedTransfer(transfer: CollectionApprovedTransfer): s_CollectionApprovedTransfer {
  return {
    ...transfer,
    transferTimes: transfer.transferTimes.map(convertFromUintRange),
    badgeIds: transfer.badgeIds.map(convertFromUintRange),
    ownedTimes: transfer.ownedTimes.map(convertFromUintRange),
    allowedCombinations: transfer.allowedCombinations.map(convertFromIsCollectionTransferAllowed),
    approvalDetails: transfer.approvalDetails.map(convertFromApprovalDetails)
  };
}

export interface IsCollectionTransferAllowedBase {
  invertTo: boolean;
  invertFrom: boolean;
  invertInitiatedBy: boolean;
  invertTransferTimes: boolean;
  invertBadgeIds: boolean;
  invertOwnedTimes: boolean;
  isAllowed: boolean;
}

export interface IsCollectionTransferAllowed extends IsCollectionTransferAllowedBase { }

export interface s_IsCollectionTransferAllowed extends IsCollectionTransferAllowedBase { }

export function convertToIsCollectionTransferAllowed(s_allowed: s_IsCollectionTransferAllowed): IsCollectionTransferAllowed {
  return {
    ...s_allowed
  };
}

export function convertFromIsCollectionTransferAllowed(allowed: IsCollectionTransferAllowed): s_IsCollectionTransferAllowed {
  return {
    ...allowed
  };
}

export interface ApprovalDetailsBase {
  approvalId: string;
  uri: string;
  customData: string;

  mustOwnBadges: MustOwnBadgesBase[];
  merkleChallenges: MerkleChallengeBase[];
  predeterminedBalances: PredeterminedBalancesBase;
  approvalAmounts: ApprovalAmountsBase;
  maxNumTransfers: MaxNumTransfersBase;

  requireToEqualsInitiatedBy: boolean;
  requireFromEqualsInitiatedBy: boolean;
  requireToDoesNotEqualInitiatedBy: boolean;
  requireFromDoesNotEqualInitiatedBy: boolean;

  overridesFromApprovedOutgoingTransfers: boolean;
  overridesToApprovedIncomingTransfers: boolean;
}

export interface ApprovalDetails extends ApprovalDetailsBase {
  mustOwnBadges: MustOwnBadges[];
  merkleChallenges: MerkleChallenge[];
  predeterminedBalances: PredeterminedBalances;
  approvalAmounts: ApprovalAmounts;
  maxNumTransfers: MaxNumTransfers;
}

export interface s_ApprovalDetails extends ApprovalDetailsBase {
  mustOwnBadges: s_MustOwnBadges[];
  merkleChallenges: s_MerkleChallenge[];
  predeterminedBalances: s_PredeterminedBalances;
  approvalAmounts: s_ApprovalAmounts;
  maxNumTransfers: s_MaxNumTransfers;
}

export function convertToApprovalDetails(s_details: s_ApprovalDetails): ApprovalDetails {
  return {
    ...s_details,
    mustOwnBadges: s_details.mustOwnBadges.map(convertToMustOwnBadges),
    merkleChallenges: s_details.merkleChallenges.map(convertToMerkleChallenge),
    predeterminedBalances: convertToPredeterminedBalances(s_details.predeterminedBalances),
    approvalAmounts: convertToApprovalAmounts(s_details.approvalAmounts),
    maxNumTransfers: convertToMaxNumTransfers(s_details.maxNumTransfers)
  };
}

export function convertFromApprovalDetails(details: ApprovalDetails): s_ApprovalDetails {
  return {
    ...details,
    mustOwnBadges: details.mustOwnBadges.map(convertFromMustOwnBadges),
    merkleChallenges: details.merkleChallenges.map(convertFromMerkleChallenge),
    predeterminedBalances: convertFromPredeterminedBalances(details.predeterminedBalances),
    approvalAmounts: convertFromApprovalAmounts(details.approvalAmounts),
    maxNumTransfers: convertFromMaxNumTransfers(details.maxNumTransfers)
  };
}
