import { NumberType } from "../string-numbers";
import { ValueOptions } from "./permissions";
import { Balance, MerkleChallenge, MustOwnBadges, UintRange, convertBalance, convertMerkleChallenge, convertMustOwnBadges, convertUintRange, deepCopy } from "./typeUtils";

/**
 * UserApprovedOutgoingTransferTimeline represents the user's outgoing approvals over time.
 *
 * @typedef {Object} UserApprovedOutgoingTransferTimeline
 * @property {UserApprovedOutgoingTransfer[]} approvedOutgoingTransfers - The list of approved outgoing transfers.
 * @property {UintRange[]} timelineTimes - The times that correspond to the approved outgoing transfers.
 */
export interface UserApprovedOutgoingTransferTimeline<T extends NumberType> {
  approvedOutgoingTransfers: UserApprovedOutgoingTransfer<T>[];
  timelineTimes: UintRange<T>[];
}

export function convertUserApprovedOutgoingTransferTimeline<T extends NumberType, U extends NumberType>(timeline: UserApprovedOutgoingTransferTimeline<T>, convertFunction: (item: T) => U): UserApprovedOutgoingTransferTimeline<U> {
  return deepCopy({
    ...timeline,
    approvedOutgoingTransfers: timeline.approvedOutgoingTransfers.map((b) => convertUserApprovedOutgoingTransfer(b, convertFunction)),
    timelineTimes: timeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}


/**
 * UserApprovedOutgoingTransfer represents a user's approved outgoing transfer.
 *
 * @typedef {Object} UserApprovedOutgoingTransfer
 * @property {string} toMappingId - The mapping ID for the user(s) who is receiving the badges.
 * @property {string} initiatedByMappingId - The mapping ID for the user(s) who initiate the transfer.
 * @property {UintRange[]} transferTimes - The times of the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs to be transferred.
 * @property {UintRange[]} ownedTimes - The ownership times of the badges being transferred
 * @property {IsUserOutgoingTransferAllowed[]} allowedCombinations - The allowed combinations of the transfer. Here, you can manipulate the default values (invert, all, none) and decide whether that combination is approved or not. Note this is first-match only.
 * @property {OutgoingApprovalDetails[]} approvalDetails - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 */
export interface UserApprovedOutgoingTransfer<T extends NumberType> {
  toMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownedTimes: UintRange<T>[];
  allowedCombinations: IsUserOutgoingTransferAllowed[];
  approvalDetails: OutgoingApprovalDetails<T>[];
}

export function convertUserApprovedOutgoingTransfer<T extends NumberType, U extends NumberType>(transfer: UserApprovedOutgoingTransfer<T>, convertFunction: (item: T) => U): UserApprovedOutgoingTransfer<U> {
  return deepCopy({
    ...transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownedTimes: transfer.ownedTimes.map((b) => convertUintRange(b, convertFunction)),
    //allowedCombinations: transfer.allowedCombinations.map((b) => convertIsUserOutgoingTransferAllowed(b, convertFunction)),
    approvalDetails: transfer.approvalDetails.map((b) => convertOutgoingApprovalDetails(b, convertFunction))
  })
}

/**
 * IsUserOutgoingTransferAllowed represents the allowed combinations of a user's outgoing transfer.
 * Here, you can manipulate the provided default values and say if it is allowed or not.
 * Note that we take first-match only.
 *
 * @typedef {Object} IsUserOutgoingTransferAllowed
 * @property {ValueOptions} toMappingOptions - The options to manipulate the values for the toMappingId.
 * @property {ValueOptions} initiatedByMappingOptions - The options to manipulate the values for the initiatedByMappingId.
 * @property {ValueOptions} transferTimesOptions - The options to manipulate the values for the transferTimes.
 * @property {ValueOptions} badgeIdsOptions - The options to manipulate the values for the badgeIds.
 * @property {ValueOptions} ownedTimesOptions - The options to manipulate the values for the ownedTimes.
 * @property {boolean} isAllowed - Whether this combination is allowed or not.
 */
export interface IsUserOutgoingTransferAllowed {
  toMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  isAllowed: boolean;
}

// export function convertIsUserOutgoingTransferAllowed<T extends NumberType, U extends NumberType>(allowed: IsUserOutgoingTransferAllowed<T>, _convertFunction: (item: T) => U): IsUserOutgoingTransferAllowed<U> {
//   return deepCopy({
//     ...allowed
//   })
// }

/**
 * OutgoingApprovalDetails represents the details of an outgoing approval.
 *
 * @typedef {Object} OutgoingApprovalDetails
 * @property {string} approvalId - The ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} uri - The URI of the approval.
 * @property {string} customData - Arbitrary custom data of the approval.
 * @property {MustOwnBadges[]} mustOwnBadges - The list of must own badges to be approved.
 * @property {MerkleChallenge[]} merkleChallenges - The list of merkle challenges that need valid proofs to be approved.
 * @property {PredeterminedBalances} predeterminedBalances - The predetermined balances for each transfer.
 * @property {ApprovalAmounts} approvalAmounts - The maximum approved amounts for this approval.
 * @property {MaxNumTransfers} maxNumTransfers - The max num transfers for this approval.
 * @property {boolean} requireToEqualsInitiatedBy - Whether the to address must equal the initiatedBy address.
 * @property {boolean} requireToDoesNotEqualInitiatedBy - Whether the to address must not equal the initiatedBy address.
 */
export interface OutgoingApprovalDetails<T extends NumberType> {
  approvalId: string;
  uri: string;
  customData: string;

  mustOwnBadges: MustOwnBadges<T>[];
  merkleChallenges: MerkleChallenge<T>[];
  predeterminedBalances: PredeterminedBalances<T>;
  approvalAmounts: ApprovalAmounts<T>;
  maxNumTransfers: MaxNumTransfers<T>;

  requireToEqualsInitiatedBy: boolean;
  requireToDoesNotEqualInitiatedBy: boolean;
}

export function convertOutgoingApprovalDetails<T extends NumberType, U extends NumberType>(details: OutgoingApprovalDetails<T>, convertFunction: (item: T) => U): OutgoingApprovalDetails<U> {
  return deepCopy({
    ...details,
    mustOwnBadges: details.mustOwnBadges.map((b) => convertMustOwnBadges(b, convertFunction)),
    merkleChallenges: details.merkleChallenges.map((b) => convertMerkleChallenge(b, convertFunction)),
    predeterminedBalances: convertPredeterminedBalances(details.predeterminedBalances, convertFunction),
    approvalAmounts: convertApprovalAmounts(details.approvalAmounts, convertFunction),
    maxNumTransfers: convertMaxNumTransfers(details.maxNumTransfers, convertFunction)
  })
}

/**
 * PredeterminedBalances represents the predetermined balances for an approval.
 * This allows you to define an approval where Transfer A happens first, then Transfer B, then Transfer C, etc.
 * The order of the transfers is defined by the orderCalculationMethod. The order number 0 represents the first transfer, 1 represents the second transfer, etc.
 *
 * IMPORTANT: if the calculated balances exceed the bounds of the badgeIds or ownedTimes of this approval, then the transfer will fail.
 *
 * @typedef {Object} PredeterminedBalances
 * @property {ManualBalances[]} manualBalances - Manually define the balances for each transfer. Cannot be used with incrementedBalances. Order number corresponds to the index of the balance in the array.
 * @property {IncrementedBalances} incrementedBalances - Define a starting balance and increment the badge IDs and owned times by a certain amount after each transfer. Cannot be used with manualBalances.
 *                                                       Order number corresponds to number of times we increment.
 * @property {PredeterminedOrderCalculationMethod} orderCalculationMethod - The order calculation method.
 */
export interface PredeterminedBalances<T extends NumberType> {
  manualBalances: ManualBalances<T>[];
  incrementedBalances: IncrementedBalances<T>;
  orderCalculationMethod: PredeterminedOrderCalculationMethod;
}

export function convertPredeterminedBalances<T extends NumberType, U extends NumberType>(balances: PredeterminedBalances<T>, convertFunction: (item: T) => U): PredeterminedBalances<U> {
  return deepCopy({
    ...balances,
    manualBalances: balances.manualBalances.map((b) => convertManualBalances(b, convertFunction)),
    incrementedBalances: convertIncrementedBalances(balances.incrementedBalances, convertFunction),
    // orderCalculationMethod: convertPredeterminedOrderCalculationMethod(balances.orderCalculationMethod, convertFunction)
  })
}

export interface ManualBalances<T extends NumberType> {
  balances: Balance<T>[];
}


/**
 * ManualBalances represents predetermined manually specified balances for transfers of an approval.
 *
 * @typedef {Object} ManualBalances
 * @property {Balance[]} balances - The list of balances for each transfer. Order number corresponds to the index of the balance in the array.
 */
export function convertManualBalances<T extends NumberType, U extends NumberType>(balances: ManualBalances<T>, convertFunction: (item: T) => U): ManualBalances<U> {
  return deepCopy({
    ...balances,
    balances: balances.balances.map((b) => convertBalance(b, convertFunction))
  })
}

/**
 * IncrementedBalances represents predetermined incremented balances for transfers of an approval.
 * You can define a starting balance and increment the badge IDs and owned times by a certain amount after each transfer.
 *
 * @typedef {Object} IncrementedBalances
 *
 * @property {Balance[]} startBalances - The starting balances for each transfer. Order number corresponds to the number of times we increment.
 * @property {T} incrementBadgeIdsBy - The amount to increment the badge IDs by after each transfer.
 * @property {T} incrementOwnedTimesBy - The amount to increment the owned times by after each transfer.
 */
export interface IncrementedBalances<T extends NumberType> {
  startBalances: Balance<T>[];
  incrementBadgeIdsBy: T;
  incrementOwnedTimesBy: T;
}

export function convertIncrementedBalances<T extends NumberType, U extends NumberType>(balances: IncrementedBalances<T>, convertFunction: (item: T) => U): IncrementedBalances<U> {
  return deepCopy({
    ...balances,
    startBalances: balances.startBalances.map((b) => convertBalance(b, convertFunction)),
    incrementBadgeIdsBy: convertFunction(balances.incrementBadgeIdsBy),
    incrementOwnedTimesBy: convertFunction(balances.incrementOwnedTimesBy)
  })
}

/**
 * PredeterminedOrderCalculationMethod represents the order calculation method for the predetermined balances.
 * Only one option can be true.
 *
 * @typedef {Object} PredeterminedOrderCalculationMethod
 * @property {boolean} useOverallNumTransfers - Use the overall number of transfers this approval has been used with as the order number. Ex: If this approval has been used 2 times by ANY address, then the order number for the next transfer will be 3.
 * @property {boolean} usePerToAddressNumTransfers - Use the number of times this approval has been used by each to address as the order number. Ex: If this approval has been used 2 times by to address A, then the order number for the next transfer by to address A will be 3.
 * @property {boolean} usePerFromAddressNumTransfers - Use the number of times this approval has been used by each from address as the order number. Ex: If this approval has been used 2 times by from address A, then the order number for the next transfer by from address A will be 3.
 * @property {boolean} usePerInitiatedByAddressNumTransfers - Use the number of times this approval has been used by each initiated by address as the order number. Ex: If this approval has been used 2 times by initiated by address A, then the order number for the next transfer by initiated by address A will be 3.
 * @property {boolean} useMerkleChallengeLeafIndex - Use the merkle challenge leaf index as the order number. Must specify ONE merkle challenge with the useLeafIndexForTransferOrder flag set to true. If so, we will use the leaf index of each merkle proof to calculate the order number.
 *                                                   This is used to reserve specific balances for specific leaves (such as codes or whitelist address leafs)
 */
export interface PredeterminedOrderCalculationMethod {
  useOverallNumTransfers: boolean;
  usePerToAddressNumTransfers: boolean;
  usePerFromAddressNumTransfers: boolean;
  usePerInitiatedByAddressNumTransfers: boolean;
  useMerkleChallengeLeafIndex: boolean;
}
// export function convertPredeterminedOrderCalculationMethod<T extends NumberType, U extends NumberType>(method: PredeterminedOrderCalculationMethod<T>, convertFunction: (item: T) => U): PredeterminedOrderCalculationMethod<U> {
//   return deepCopy({
//     ...method
//   })
// }

/**
 * ApprovalAmounts represents the maximum approved amounts for the badge IDs of this approval.
 * Can be set to 0 to represent an unlimited amount is approved.
 * Note that we only track the approval amounts if the approval is defined and not unlimited. Otherwise, we do not track the respective approval amount.
 *
 * @typedef {Object} ApprovalAmounts
 * @property {T} overallApprovalAmount - The overall maximum amount approved for the badgeIDs and ownedTimes. Running tally that includes all transfers that match this approval.
 * @property {T} perToAddressApprovalAmount - The maximum amount approved for the badgeIDs and ownedTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval.
 * @property {T} perFromAddressApprovalAmount - The maximum amount approved for the badgeIDs and ownedTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval.
 * @property {T} perInitiatedByAddressApprovalAmount - The maximum amount approved for the badgeIDs and ownedTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval.
 */
export interface ApprovalAmounts<T extends NumberType> {
  overallApprovalAmount: T;
  perToAddressApprovalAmount: T;
  perFromAddressApprovalAmount: T;
  perInitiatedByAddressApprovalAmount: T;
}

export function convertApprovalAmounts<T extends NumberType, U extends NumberType>(amounts: ApprovalAmounts<T>, convertFunction: (item: T) => U): ApprovalAmounts<U> {
  return deepCopy({
    ...amounts,
    overallApprovalAmount: convertFunction(amounts.overallApprovalAmount),
    perToAddressApprovalAmount: convertFunction(amounts.perToAddressApprovalAmount),
    perFromAddressApprovalAmount: convertFunction(amounts.perFromAddressApprovalAmount),
    perInitiatedByAddressApprovalAmount: convertFunction(amounts.perInitiatedByAddressApprovalAmount)
  })
}

/**
 * MaxNumTransfers represents the maximum number of transfers for the badge IDs and ownedTimes of this approval.
 *
 * Note that we only track the max num transfers if a) the max num transfers here is defined and not unlimited OR b) we need it for calculating the predetermined balances order (i.e. useXYZNumTransfers is set in the PredeterminedOrderCalculationMethod).
 * Otherwise, we do not track the respective number of transfers
 *
 * @typedef {Object} MaxNumTransfers
 * @property {T} overallMaxNumTransfers - The overall maximum number of transfers for the badgeIDs and ownedTimes. Running tally that includes all transfers that match this approval.
 * @property {T} perToAddressMaxNumTransfers - The maximum number of transfers for the badgeIDs and ownedTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval.
 * @property {T} perFromAddressMaxNumTransfers - The maximum number of transfers for the badgeIDs and ownedTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval.
 * @property {T} perInitiatedByAddressMaxNumTransfers - The maximum number of transfers for the badgeIDs and ownedTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval.
 */
export interface MaxNumTransfers<T extends NumberType> {
  overallMaxNumTransfers: T;
  perToAddressMaxNumTransfers: T;
  perFromAddressMaxNumTransfers: T;
  perInitiatedByAddressMaxNumTransfers: T;
}

export function convertMaxNumTransfers<T extends NumberType, U extends NumberType>(amounts: MaxNumTransfers<T>, convertFunction: (item: T) => U): MaxNumTransfers<U> {
  return deepCopy({
    ...amounts,
    overallMaxNumTransfers: convertFunction(amounts.overallMaxNumTransfers),
    perToAddressMaxNumTransfers: convertFunction(amounts.perToAddressMaxNumTransfers),
    perFromAddressMaxNumTransfers: convertFunction(amounts.perFromAddressMaxNumTransfers),
    perInitiatedByAddressMaxNumTransfers: convertFunction(amounts.perInitiatedByAddressMaxNumTransfers)
  })
}


/**
 * UserApprovedIncomingTransferTimeline represents the user's incoming approvals over time.
 *
 * @typedef {Object} UserApprovedIncomingTransferTimeline
 * @property {UserApprovedIncomingTransfer[]} approvedIncomingTransfers - The list of approved incoming transfers.
 * @property {UintRange[]} timelineTimes - The times that correspond to the approved incoming transfers.
 */
export interface UserApprovedIncomingTransferTimeline<T extends NumberType> {
  approvedIncomingTransfers: UserApprovedIncomingTransfer<T>[];
  timelineTimes: UintRange<T>[];
}

export function convertUserApprovedIncomingTransferTimeline<T extends NumberType, U extends NumberType>(timeline: UserApprovedIncomingTransferTimeline<T>, convertFunction: (item: T) => U): UserApprovedIncomingTransferTimeline<U> {
  return deepCopy({
    ...timeline,
    approvedIncomingTransfers: timeline.approvedIncomingTransfers.map((b) => convertUserApprovedIncomingTransfer(b, convertFunction)),
    timelineTimes: timeline.timelineTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * UserApprovedIncomingTransfer represents a user's approved incoming transfer.
 *
 * @typedef {Object} UserApprovedIncomingTransfer
 * @property {string} fromMappingId - The mapping ID for the user(s) who is sending the badges.
 * @property {string} initiatedByMappingId - The mapping ID for the user(s) who initiate the transfer.
 * @property {UintRange[]} transferTimes - The times of the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs to be transferred.
 * @property {UintRange[]} ownedTimes - The ownership times of the badges being transferred
 * @property {IsUserIncomingTransferAllowed[]} allowedCombinations - The allowed combinations of the transfer. Here, you can manipulate the default values (invert, all, none) and decide whether that combination is approved or not. Note this is first-match only.
 * @property {IncomingApprovalDetails[]} approvalDetails - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 */
export interface UserApprovedIncomingTransfer<T extends NumberType> {
  fromMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownedTimes: UintRange<T>[];
  allowedCombinations: IsUserIncomingTransferAllowed[];
  approvalDetails: IncomingApprovalDetails<T>[];
}

export function convertUserApprovedIncomingTransfer<T extends NumberType, U extends NumberType>(transfer: UserApprovedIncomingTransfer<T>, convertFunction: (item: T) => U): UserApprovedIncomingTransfer<U> {
  return deepCopy({
    ...transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownedTimes: transfer.ownedTimes.map((b) => convertUintRange(b, convertFunction)),
    //allowedCombinations: transfer.allowedCombinations.map((b) => convertIsUserIncomingTransferAllowed(b, convertFunction)),
    approvalDetails: transfer.approvalDetails.map((b) => convertIncomingApprovalDetails(b, convertFunction))
  })
}

/**
 * IsUserIncomingTransferAllowed represents the allowed combinations of a user's incoming transfer.
 *
 * Here, you can manipulate the provided default values and say if it is allowed or not.
 *
 * Note that we take first-match only.
 *
 * @typedef {Object} IsUserIncomingTransferAllowed
 * @property {ValueOptions} fromMappingOptions - The options to manipulate the values for the fromMappingId.
 * @property {ValueOptions} initiatedByMappingOptions - The options to manipulate the values for the initiatedByMappingId.
 * @property {ValueOptions} transferTimesOptions - The options to manipulate the values for the transferTimes.
 * @property {ValueOptions} badgeIdsOptions - The options to manipulate the values for the badgeIds.
 * @property {ValueOptions} ownedTimesOptions - The options to manipulate the values for the ownedTimes.
 * @property {boolean} isAllowed - Whether this combination is allowed or not.
 */
export interface IsUserIncomingTransferAllowed {
  fromMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  isAllowed: boolean;
}

// export function convertIsUserIncomingTransferAllowed<T extends NumberType, U extends NumberType>(allowed: IsUserIncomingTransferAllowed<T>, _convertFunction: (item: T) => U): IsUserIncomingTransferAllowed<U> {
//   return deepCopy({
//     ...allowed,
//   })
// }

/**
 * IncomingApprovalDetails represents the details of an incoming approval.
 *
 * @typedef {Object} IncomingApprovalDetails
 * @property {string} approvalId - The ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} uri - The URI of the approval.
 * @property {string} customData - Arbitrary custom data of the approval.
 *
 * @property {MustOwnBadges[]} mustOwnBadges - The list of must own badges to be approved.
 * @property {MerkleChallenge[]} merkleChallenges - The list of merkle challenges that need valid proofs to be approved.
 * @property {PredeterminedBalances} predeterminedBalances - The predetermined balances for each transfer.
 * @property {ApprovalAmounts} approvalAmounts - The maximum approved amounts for this approval.
 * @property {MaxNumTransfers} maxNumTransfers - The max num transfers for this approval.
 *
 * @property {boolean} requireFromEqualsInitiatedBy - Whether the from address must equal the initiatedBy address.
 * @property {boolean} requireFromDoesNotEqualInitiatedBy - Whether the from address must not equal the initiatedBy address.
 */
export interface IncomingApprovalDetails<T extends NumberType> {
  approvalId: string;
  uri: string;
  customData: string;

  mustOwnBadges: MustOwnBadges<T>[];
  merkleChallenges: MerkleChallenge<T>[];
  predeterminedBalances: PredeterminedBalances<T>;
  approvalAmounts: ApprovalAmounts<T>;
  maxNumTransfers: MaxNumTransfers<T>;

  requireFromEqualsInitiatedBy: boolean;
  requireFromDoesNotEqualInitiatedBy: boolean;
}

export function convertIncomingApprovalDetails<T extends NumberType, U extends NumberType>(details: IncomingApprovalDetails<T>, convertFunction: (item: T) => U): IncomingApprovalDetails<U> {
  return deepCopy({
    ...details,
    mustOwnBadges: details.mustOwnBadges.map((b) => convertMustOwnBadges(b, convertFunction)),
    merkleChallenges: details.merkleChallenges.map((b) => convertMerkleChallenge(b, convertFunction)),
    predeterminedBalances: convertPredeterminedBalances(details.predeterminedBalances, convertFunction),
    approvalAmounts: convertApprovalAmounts(details.approvalAmounts, convertFunction),
    maxNumTransfers: convertMaxNumTransfers(details.maxNumTransfers, convertFunction)
  })
}

/**
 * CollectionApprovedTransfer represents a collection's approved transfer.
 *
 * @typedef {Object} CollectionApprovedTransfer
 *
 * @property {string} toMappingId - The mapping ID for the user(s) who is receiving the badges.
 * @property {string} fromMappingId - The mapping ID for the user(s) who is sending the badges.
 * @property {string} initiatedByMappingId - The mapping ID for the user(s) who initiate the transfer.
 *
 * @property {UintRange[]} transferTimes - The times of the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs to be transferred.
 * @property {UintRange[]} ownedTimes - The ownership times of the badges being transferred
 *
 * @property {IsCollectionTransferAllowed[]} allowedCombinations - The allowed combinations of the transfer. Here, you can manipulate the default values (invert, all, none) and decide whether that combination is approved or not. Note this is first-match only.
 * @property {ApprovalDetails[]} approvalDetails - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 */
export interface CollectionApprovedTransfer<T extends NumberType> {
  toMappingId: string;
  fromMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownedTimes: UintRange<T>[];
  allowedCombinations: IsCollectionTransferAllowed[];
  approvalDetails: ApprovalDetails<T>[];
}

export function convertCollectionApprovedTransfer<T extends NumberType, U extends NumberType>(transfer: CollectionApprovedTransfer<T>, convertFunction: (item: T) => U): CollectionApprovedTransfer<U> {
  return deepCopy({
    ...transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownedTimes: transfer.ownedTimes.map((b) => convertUintRange(b, convertFunction)),
    //allowedCombinations: transfer.allowedCombinations.map((b) => convertIsCollectionTransferAllowed(b, convertFunction)),
    approvalDetails: transfer.approvalDetails.map((b) => convertApprovalDetails(b, convertFunction))
  })
}

/**
 * IsCollectionTransferAllowed represents the allowed combinations of a collection's transfer.
 *
 * Here, you can manipulate the provided default values and say if it is allowed or not.
 *
 * Note that we take first-match only.
 *
 * @typedef {Object} IsCollectionTransferAllowed
 * @property {ValueOptions} toMappingOptions - The options to manipulate the values for the toMappingId.
 * @property {ValueOptions} fromMappingOptions - The options to manipulate the values for the fromMappingId.
 * @property {ValueOptions} initiatedByMappingOptions - The options to manipulate the values for the initiatedByMappingId.
 * @property {ValueOptions} transferTimesOptions - The options to manipulate the values for the transferTimes.
 * @property {ValueOptions} badgeIdsOptions - The options to manipulate the values for the badgeIds.
 * @property {ValueOptions} ownedTimesOptions - The options to manipulate the values for the ownedTimes.
 * @property {boolean} isAllowed - Whether this combination is allowed or not.
 */
export interface IsCollectionTransferAllowed {
  toMappingOptions: ValueOptions;
  fromMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  isAllowed: boolean;
}

// export function convertIsCollectionTransferAllowed<T extends NumberType, U extends NumberType>(allowed: IsCollectionTransferAllowed<T>, _convertFunction: (item: T) => U): IsCollectionTransferAllowed<U> {
//   return deepCopy({
//     ...allowed
//   })
// }


/**
 * ApprovalDetails represents the details of an approval.
 *
 * @typedef {Object} ApprovalDetails
 * @property {string} approvalId - The ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} uri - The URI of the approval.
 * @property {string} customData - Arbitrary custom data of the approval.
 *
 * @property {MustOwnBadges[]} mustOwnBadges - The list of must own badges to be approved.
 * @property {MerkleChallenge[]} merkleChallenges - The list of merkle challenges that need valid proofs to be approved.
 * @property {PredeterminedBalances} predeterminedBalances - The predetermined balances for each transfer.
 * @property {ApprovalAmounts} approvalAmounts - The maximum approved amounts for this approval.
 * @property {MaxNumTransfers} maxNumTransfers - The max num transfers for this approval.
 *
 * @property {boolean} requireToEqualsInitiatedBy - Whether the to address must equal the initiatedBy address.
 * @property {boolean} requireFromEqualsInitiatedBy - Whether the from address must equal the initiatedBy address.
 * @property {boolean} requireToDoesNotEqualInitiatedBy - Whether the to address must not equal the initiatedBy address.
 * @property {boolean} requireFromDoesNotEqualInitiatedBy - Whether the from address must not equal the initiatedBy address.
 *
 * @property {boolean} overridesFromApprovedOutgoingTransfers - Whether this approval overrides the from address's approved outgoing transfers.
 * @property {boolean} overridesToApprovedIncomingTransfers - Whether this approval overrides the to address's approved incoming transfers.
 */
export interface ApprovalDetails<T extends NumberType> {
  approvalId: string;
  uri: string;
  customData: string;

  mustOwnBadges: MustOwnBadges<T>[];
  merkleChallenges: MerkleChallenge<T>[];
  predeterminedBalances: PredeterminedBalances<T>;
  approvalAmounts: ApprovalAmounts<T>;
  maxNumTransfers: MaxNumTransfers<T>;

  requireToEqualsInitiatedBy: boolean;
  requireFromEqualsInitiatedBy: boolean;
  requireToDoesNotEqualInitiatedBy: boolean;
  requireFromDoesNotEqualInitiatedBy: boolean;

  overridesFromApprovedOutgoingTransfers: boolean;
  overridesToApprovedIncomingTransfers: boolean;
}

export function convertApprovalDetails<T extends NumberType, U extends NumberType>(details: ApprovalDetails<T>, convertFunction: (item: T) => U): ApprovalDetails<U> {
  return deepCopy({
    ...details,
    mustOwnBadges: details.mustOwnBadges.map((b) => convertMustOwnBadges(b, convertFunction)),
    merkleChallenges: details.merkleChallenges.map((b) => convertMerkleChallenge(b, convertFunction)),
    predeterminedBalances: convertPredeterminedBalances(details.predeterminedBalances, convertFunction),
    approvalAmounts: convertApprovalAmounts(details.approvalAmounts, convertFunction),
    maxNumTransfers: convertMaxNumTransfers(details.maxNumTransfers, convertFunction)
  })
}
