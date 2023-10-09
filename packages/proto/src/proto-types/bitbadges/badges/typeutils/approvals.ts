import { NumberType } from "../string-numbers";
import { Balance, MerkleChallenge, MustOwnBadges, UintRange, convertBalance, convertMerkleChallenge, convertMustOwnBadges, convertUintRange, deepCopy } from "./typeUtils";


/**
 * UserOutgoingApproval represents a user's approved outgoing transfer.
 *
 * @typedef {Object} UserOutgoingApproval
 *@property {string} toMappingId - The mapping ID for the user(s) who is receiving the badges.
 * @property {string} initiatedByMappingId - The mapping ID for the user(s) who initiate the transfer.
 * @property {UintRange[]} transferTimes - The times of the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs to be transferred.
 * @property {UintRange[]} ownershipTimes - The ownership times of the badges being transferred
 * @property {string} approvalId - The ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} amountTrackerId - The ID of the approval tracker. This is the key used to track tallies.
 * @property {string} challengeTrackerId - The ID of the challenge tracker. This is the key used to track used leaves for challenges.
 * @property {ValueOptions} toMappingOptions - The options to manipulate the values for the toMappingId.
 * @property {ValueOptions} initiatedByMappingOptions - The options to manipulate the values for the initiatedByMappingId.
 * @property {ValueOptions} transferTimesOptions - The options to manipulate the values for the transferTimes.
 * @property {ValueOptions} badgeIdsOptions - The options to manipulate the values for the badgeIds.
 * @property {ValueOptions} ownershipTimesOptions - The options to manipulate the values for the ownershipTimes.
 * @property {ValueOptions} amountTrackerIdOptions - The options to manipulate the values for the amountTrackerId.
 * @property {ValueOptions} challengeTrackerIdOptions - The options to manipulate the values for the challengeTrackerId.
 * @property {boolean} isApproved - Whether this combination is allowed or not.
 * @property {IsUserOutgoingTransferAllowed[]} allowedCombinations - The allowed combinations of the transfer. Here, you can manipulate the default values (invert, all, none) and decide whether that combination is approved or not. Note this is first-match only.
 * @property {OutgoingApprovalCriteria[]} approvalCriteria - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 *
 */
export interface UserOutgoingApproval<T extends NumberType> {
  toMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  approvalId: string;
  amountTrackerId: string;
  challengeTrackerId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: OutgoingApprovalCriteria<T>;
}

export function convertUserOutgoingApproval<T extends NumberType, U extends NumberType>(transfer: UserOutgoingApproval<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserOutgoingApproval<U> {
  const _transfer = populateOptionalFields ? {
    uri: '',
    customData: '',
    ...transfer,
    fromMappingOptions: undefined,
  } as Required<UserOutgoingApproval<T>> : transfer

  return deepCopy({
    ..._transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: transfer.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    //allowedCombinations: transfer.allowedCombinations.map((b) => convertIsUserOutgoingTransferAllowed(b, convertFunction)),
    approvalCriteria: transfer.approvalCriteria ? convertOutgoingApprovalCriteria(transfer.approvalCriteria, convertFunction) : populateOptionalFields ?
      convertOutgoingApprovalCriteria(
        {
          "mustOwnBadges": [],
          "approvalAmounts": {
            "overallApprovalAmount": "0" as T,
            "perFromAddressApprovalAmount": "0" as T,
            "perToAddressApprovalAmount": "0" as T,
            "perInitiatedByAddressApprovalAmount": "0" as T
          },
          "maxNumTransfers": {
            "overallMaxNumTransfers": "0" as T,
            "perFromAddressMaxNumTransfers": "0" as T,
            "perToAddressMaxNumTransfers": "0" as T,
            "perInitiatedByAddressMaxNumTransfers": "0" as T
          },
          "predeterminedBalances": {
            "manualBalances": [],
            "incrementedBalances": {
              "startBalances": [
              ],
              "incrementBadgeIdsBy": "0" as T,
              "incrementOwnershipTimesBy": "0" as T
            },
            "orderCalculationMethod": {
              "useMerkleChallengeLeafIndex": false,
              "useOverallNumTransfers": false,
              "usePerFromAddressNumTransfers": false,
              "usePerInitiatedByAddressNumTransfers": false,
              "usePerToAddressNumTransfers": false
            }
          },
          "merkleChallenge": {
            "root": "",
            "expectedProofLength": "0" as T,
            "useCreatorAddressAsLeaf": false,
            "maxOneUsePerLeaf": false,
            "uri": "",
            "customData": ""
          },
          "requireToEqualsInitiatedBy": false,
          "requireToDoesNotEqualInitiatedBy": false,
        }, convertFunction) : undefined,
  })
}


/**
 * OutgoingApprovalCriteria represents the details of an outgoing approval.
 *
 * @typedef {Object} OutgoingApprovalCriteria
 * @property {MustOwnBadges[]} mustOwnBadges - The list of must own badges to be approved.
 * @property {MerkleChallenge} merkleChallenge - The list of merkle challenges that need valid proofs to be approved.
 * @property {PredeterminedBalances} predeterminedBalances - The predetermined balances for each transfer.
 * @property {ApprovalAmounts} approvalAmounts - The maximum approved amounts for this approval.
 * @property {MaxNumTransfers} maxNumTransfers - The max num transfers for this approval.
 * @property {boolean} requireToEqualsInitiatedBy - Whether the to address must equal the initiatedBy address.
 * @property {boolean} requireToDoesNotEqualInitiatedBy - Whether the to address must not equal the initiatedBy address.
 */
export interface OutgoingApprovalCriteria<T extends NumberType> {
  mustOwnBadges?: MustOwnBadges<T>[];
  merkleChallenge?: MerkleChallenge<T>;
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;

  requireToEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;
}

export function convertOutgoingApprovalCriteria<T extends NumberType, U extends NumberType>(details: OutgoingApprovalCriteria<T>, convertFunction: (item: T) => U): OutgoingApprovalCriteria<U> {
  return deepCopy({
    ...details,
    mustOwnBadges: details.mustOwnBadges ? details.mustOwnBadges.map((b) => convertMustOwnBadges(b, convertFunction)) : undefined,
    merkleChallenge: details.merkleChallenge ? convertMerkleChallenge(details.merkleChallenge, convertFunction) : undefined,
    predeterminedBalances: details.predeterminedBalances ? convertPredeterminedBalances(details.predeterminedBalances, convertFunction) : undefined,
    approvalAmounts: details.approvalAmounts ? convertApprovalAmounts(details.approvalAmounts, convertFunction) : undefined,
    maxNumTransfers: details.maxNumTransfers ? convertMaxNumTransfers(details.maxNumTransfers, convertFunction) : undefined
  })
}

/**
 * PredeterminedBalances represents the predetermined balances for an approval.
 * This allows you to define an approval where Transfer A happens first, then Transfer B, then Transfer C, etc.
 * The order of the transfers is defined by the orderCalculationMethod. The order number 0 represents the first transfer, 1 represents the second transfer, etc.
 *
 * IMPORTANT: if the calculated balances exceed the bounds of the badgeIds or ownershipTimes of this approval, then the transfer will fail.
 *
 * @typedef {Object} PredeterminedBalances
 * @property {ManualBalances[]} manualBalances - Manually define the balances for each transfer. Cannot be used with incrementedBalances. Order number corresponds to the index of the balance in the array.
 * @property {IncrementedBalances} incrementedBalances - Define a starting balance and increment the badge IDs and owned times by a certain amount after each transfer. Cannot be used with manualBalances.
 *                                                       Order number corresponds to number of times we increment.
 * @property {PredeterminedOrderCalculationMethod} orderCalculationMethod - The order calculation method.
 * @property {string} precalculationId - The precalculation ID. Must not be a duplicate of another precalculation ID in the same timeline.
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
 * @property {T} incrementOwnershipTimesBy - The amount to increment the owned times by after each transfer.
 */
export interface IncrementedBalances<T extends NumberType> {
  startBalances: Balance<T>[];
  incrementBadgeIdsBy: T;
  incrementOwnershipTimesBy: T;
}

export function convertIncrementedBalances<T extends NumberType, U extends NumberType>(balances: IncrementedBalances<T>, convertFunction: (item: T) => U): IncrementedBalances<U> {
  return deepCopy({
    ...balances,
    startBalances: balances.startBalances.map((b) => convertBalance(b, convertFunction)),
    incrementBadgeIdsBy: convertFunction(balances.incrementBadgeIdsBy),
    incrementOwnershipTimesBy: convertFunction(balances.incrementOwnershipTimesBy)
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
 * @property {T} overallApprovalAmount - The overall maximum amount approved for the badgeIDs and ownershipTimes. Running tally that includes all transfers that match this approval.
 * @property {T} perToAddressApprovalAmount - The maximum amount approved for the badgeIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval.
 * @property {T} perFromAddressApprovalAmount - The maximum amount approved for the badgeIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval.
 * @property {T} perInitiatedByAddressApprovalAmount - The maximum amount approved for the badgeIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval.
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
 * MaxNumTransfers represents the maximum number of transfers for the badge IDs and ownershipTimes of this approval.
 *
 * Note that we only track the max num transfers if a) the max num transfers here is defined and not unlimited OR b) we need it for calculating the predetermined balances order (i.e. useXYZNumTransfers is set in the PredeterminedOrderCalculationMethod).
 * Otherwise, we do not track the respective number of transfers
 *
 * @typedef {Object} MaxNumTransfers
 * @property {T} overallMaxNumTransfers - The overall maximum number of transfers for the badgeIDs and ownershipTimes. Running tally that includes all transfers that match this approval.
 * @property {T} perToAddressMaxNumTransfers - The maximum number of transfers for the badgeIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval.
 * @property {T} perFromAddressMaxNumTransfers - The maximum number of transfers for the badgeIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval.
 * @property {T} perInitiatedByAddressMaxNumTransfers - The maximum number of transfers for the badgeIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval.
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
 * UserIncomingApproval represents a user's approved incoming transfer.
 *
 * @typedef {Object} UserIncomingApproval
 * @property {string} fromMappingId - The mapping ID for the user(s) who is sending the badges.
 * @property {string} initiatedByMappingId - The mapping ID for the user(s) who initiate the transfer.
 * @property {UintRange[]} transferTimes - The times of the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs to be transferred.
 * @property {UintRange[]} ownershipTimes - The ownership times of the badges being transferred
 * @property {string} approvalId - The ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} amountTrackerId - The ID of the approval tracker. This is the key used to track tallies.
 * @property {string} challengeTrackerId - The ID of the challenge tracker. This is the key used to track used leaves for challenges.
 * @property {IsUserIncomingTransferAllowed[]} allowedCombinations - The allowed combinations of the transfer. Here, you can manipulate the default values (invert, all, none) and decide whether that combination is approved or not. Note this is first-match only.
 * @property {IncomingApprovalCriteria[]} approvalCriteria - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 */
export interface UserIncomingApproval<T extends NumberType> {
  fromMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  approvalId: string;
  amountTrackerId: string;
  challengeTrackerId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: IncomingApprovalCriteria<T>;
}

export function convertUserIncomingApproval<T extends NumberType, U extends NumberType>(transfer: UserIncomingApproval<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserIncomingApproval<U> {
  const _transfer = populateOptionalFields ? {
    uri: '',
    customData: '',
    ...transfer,
    toMappingOptions: undefined,
  } as Required<UserIncomingApproval<T>> : transfer

  return deepCopy({
    ..._transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: transfer.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    approvalCriteria: transfer.approvalCriteria ? convertIncomingApprovalCriteria(transfer.approvalCriteria, convertFunction) : populateOptionalFields ?
      convertIncomingApprovalCriteria(
        {

          "mustOwnBadges": [],
          "approvalAmounts": {
            "overallApprovalAmount": "0" as T,
            "perFromAddressApprovalAmount": "0" as T,
            "perToAddressApprovalAmount": "0" as T,
            "perInitiatedByAddressApprovalAmount": "0" as T
          },
          "maxNumTransfers": {
            "overallMaxNumTransfers": "0" as T,
            "perFromAddressMaxNumTransfers": "0" as T,
            "perToAddressMaxNumTransfers": "0" as T,
            "perInitiatedByAddressMaxNumTransfers": "0" as T
          },
          "predeterminedBalances": {
            "manualBalances": [],
            "incrementedBalances": {
              "startBalances": [
              ],
              "incrementBadgeIdsBy": "0" as T,
              "incrementOwnershipTimesBy": "0" as T
            },
            "orderCalculationMethod": {
              "useMerkleChallengeLeafIndex": false,
              "useOverallNumTransfers": false,
              "usePerFromAddressNumTransfers": false,
              "usePerInitiatedByAddressNumTransfers": false,
              "usePerToAddressNumTransfers": false
            }
          },
          "merkleChallenge": {
            "root": "",
            "expectedProofLength": "0" as T,
            "useCreatorAddressAsLeaf": false,
            "maxOneUsePerLeaf": false,
            "uri": "",
            "customData": ""
          },
          "requireFromEqualsInitiatedBy": false,
          "requireFromDoesNotEqualInitiatedBy": false,
        }, convertFunction) : undefined,
  })
}

/**
 * IncomingApprovalCriteria represents the details of an incoming approval.
 *
 * @typedef {Object} IncomingApprovalCriteria
 * @property {string} uri - The URI of the approval.
 * @property {string} customData - Arbitrary custom data of the approval.
 *
 * @property {MustOwnBadges[]} mustOwnBadges - The list of must own badges to be approved.
 * @property {MerkleChallenge} merkleChallenge - The list of merkle challenges that need valid proofs to be approved.
 * @property {PredeterminedBalances} predeterminedBalances - The predetermined balances for each transfer.
 * @property {ApprovalAmounts} approvalAmounts - The maximum approved amounts for this approval.
 * @property {MaxNumTransfers} maxNumTransfers - The max num transfers for this approval.
 *
 * @property {boolean} requireFromEqualsInitiatedBy - Whether the from address must equal the initiatedBy address.
 * @property {boolean} requireFromDoesNotEqualInitiatedBy - Whether the from address must not equal the initiatedBy address.
 */
export interface IncomingApprovalCriteria<T extends NumberType> {
  mustOwnBadges?: MustOwnBadges<T>[];
  merkleChallenge?: MerkleChallenge<T>;
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;

  requireFromEqualsInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;
}

export function convertIncomingApprovalCriteria<T extends NumberType, U extends NumberType>(details: IncomingApprovalCriteria<T>, convertFunction: (item: T) => U): IncomingApprovalCriteria<U> {
  return deepCopy({
    ...details,
    mustOwnBadges: details.mustOwnBadges ? details.mustOwnBadges.map((b) => convertMustOwnBadges(b, convertFunction)) : undefined,
    merkleChallenge: details.merkleChallenge ? convertMerkleChallenge(details.merkleChallenge, convertFunction) : undefined,
    predeterminedBalances: details.predeterminedBalances ? convertPredeterminedBalances(details.predeterminedBalances, convertFunction) : undefined,
    approvalAmounts: details.approvalAmounts ? convertApprovalAmounts(details.approvalAmounts, convertFunction) : undefined,
    maxNumTransfers: details.maxNumTransfers ? convertMaxNumTransfers(details.maxNumTransfers, convertFunction) : undefined
  })
}

/**
 * CollectionApproval represents a collection's approved transfer.
 *
 * @typedef {Object} CollectionApproval
 *
 * @property {string} toMappingId - The mapping ID for the user(s) who is receiving the badges.
 * @property {string} fromMappingId - The mapping ID for the user(s) who is sending the badges.
 * @property {string} initiatedByMappingId - The mapping ID for the user(s) who initiate the transfer.
 *
 * @property {UintRange[]} transferTimes - The times of the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs to be transferred.
 * @property {UintRange[]} ownershipTimes - The ownership times of the badges being transferred
 *
 * @property {string} approvalId - The ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} amountTrackerId - The ID of the approval tracker. This is the key used to track tallies.
 * @property {string} challengeTrackerId - The ID of the challenge tracker. This is the key used to track used leaves for challenges.
 *
 * @property {ValueOptions} toMappingOptions - The options to manipulate the values for the toMappingId.
 * @property {ValueOptions} fromMappingOptions - The options to manipulate the values for the fromMappingId.
 * @property {ValueOptions} initiatedByMappingOptions - The options to manipulate the values for the initiatedByMappingId.
 * @property {ValueOptions} transferTimesOptions - The options to manipulate the values for the transferTimes.
 * @property {ValueOptions} badgeIdsOptions - The options to manipulate the values for the badgeIds.
 * @property {ValueOptions} ownershipTimesOptions - The options to manipulate the values for the ownershipTimes.
 * @property {ValueOptions} amountTrackerIdOptions - The options to manipulate the values for the amountTrackerId.
 * @property {ValueOptions} challengeTrackerIdOptions - The options to manipulate the values for the challengeTrackerId.
 * @property {boolean} isApproved - Whether this combination is allowed or not.
 * @property {IsCollectionTransferAllowed[]} allowedCombinations - The allowed combinations of the transfer. Here, you can manipulate the default values (invert, all, none) and decide whether that combination is approved or not. Note this is first-match only.
 * @property {ApprovalCriteria[]} approvalCriteria - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 */
export interface CollectionApproval<T extends NumberType> {
  toMappingId: string;
  fromMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  approvalId: string;
  amountTrackerId: string;
  challengeTrackerId: string;

  uri?: string;
  customData?: string;
  approvalCriteria?: ApprovalCriteria<T>;
}

export function convertCollectionApproval<T extends NumberType, U extends NumberType>(transfer: CollectionApproval<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): CollectionApproval<U> {
  const _transfer = populateOptionalFields ? {
    uri: '',
    customData: '',
    ...transfer,
  } as Required<CollectionApproval<T>> : transfer

  return deepCopy({
    ..._transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: transfer.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    approvalCriteria: transfer.approvalCriteria ? convertApprovalCriteria(transfer.approvalCriteria, convertFunction) : populateOptionalFields ?
      convertApprovalCriteria(
        {
          "mustOwnBadges": [],
          "approvalAmounts": {
            "overallApprovalAmount": "0" as T,
            "perFromAddressApprovalAmount": "0" as T,
            "perToAddressApprovalAmount": "0" as T,
            "perInitiatedByAddressApprovalAmount": "0" as T
          },
          "maxNumTransfers": {
            "overallMaxNumTransfers": "0" as T,
            "perFromAddressMaxNumTransfers": "0" as T,
            "perToAddressMaxNumTransfers": "0" as T,
            "perInitiatedByAddressMaxNumTransfers": "0" as T
          },
          "predeterminedBalances": {
            "manualBalances": [],
            "incrementedBalances": {
              "startBalances": [
              ],
              "incrementBadgeIdsBy": "0" as T,
              "incrementOwnershipTimesBy": "0" as T
            },
            "orderCalculationMethod": {
              "useMerkleChallengeLeafIndex": false,
              "useOverallNumTransfers": false,
              "usePerFromAddressNumTransfers": false,
              "usePerInitiatedByAddressNumTransfers": false,
              "usePerToAddressNumTransfers": false
            }
          },
          "merkleChallenge": {
            "root": "",
            "expectedProofLength": "0" as T,
            "useCreatorAddressAsLeaf": false,
            "maxOneUsePerLeaf": false,
            "uri": "",
            "customData": ""
          },
          "requireToEqualsInitiatedBy": false,
          "requireFromEqualsInitiatedBy": false,
          "requireToDoesNotEqualInitiatedBy": false,
          "requireFromDoesNotEqualInitiatedBy": false,
          "overridesToIncomingApprovals": false,
          "overridesFromOutgoingApprovals": false
        }, convertFunction) : undefined,
  })
}



// export function convertIsCollectionTransferAllowed<T extends NumberType, U extends NumberType>(allowed: IsCollectionTransferAllowed<T>, _convertFunction: (item: T) => U): IsCollectionTransferAllowed<U> {
//   return deepCopy({
//     ...allowed
//   })
// }


/**
 * ApprovalCriteria represents the details of an approval.
 *
 * @typedef {Object} ApprovalCriteria
 *
 * @property {MustOwnBadges[]} mustOwnBadges - The list of must own badges to be approved.
 * @property {MerkleChallenge} merkleChallenge - The list of merkle challenges that need valid proofs to be approved.
 * @property {PredeterminedBalances} predeterminedBalances - The predetermined balances for each transfer.
 * @property {ApprovalAmounts} approvalAmounts - The maximum approved amounts for this approval.
 * @property {MaxNumTransfers} maxNumTransfers - The max num transfers for this approval.
 *
 * @property {boolean} requireToEqualsInitiatedBy - Whether the to address must equal the initiatedBy address.
 * @property {boolean} requireFromEqualsInitiatedBy - Whether the from address must equal the initiatedBy address.
 * @property {boolean} requireToDoesNotEqualInitiatedBy - Whether the to address must not equal the initiatedBy address.
 * @property {boolean} requireFromDoesNotEqualInitiatedBy - Whether the from address must not equal the initiatedBy address.
 *
 * @property {boolean} overridesFromOutgoingApprovals - Whether this approval overrides the from address's approved outgoing transfers.
 * @property {boolean} overridesToIncomingApprovals - Whether this approval overrides the to address's approved incoming transfers.
 */
export interface ApprovalCriteria<T extends NumberType> {
  mustOwnBadges?: MustOwnBadges<T>[];
  merkleChallenge?: MerkleChallenge<T>;
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;

  requireToEqualsInitiatedBy?: boolean;
  requireFromEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;

  overridesFromOutgoingApprovals?: boolean;
  overridesToIncomingApprovals?: boolean;
}

export function convertApprovalCriteria<T extends NumberType, U extends NumberType>(details: ApprovalCriteria<T>, convertFunction: (item: T) => U): ApprovalCriteria<U> {
  return deepCopy({
    ...details,
    mustOwnBadges: details.mustOwnBadges ? details.mustOwnBadges.map((b) => convertMustOwnBadges(b, convertFunction)) : undefined,
    merkleChallenge: details.merkleChallenge ? convertMerkleChallenge(details.merkleChallenge, convertFunction) : undefined,
    predeterminedBalances: details.predeterminedBalances ? convertPredeterminedBalances(details.predeterminedBalances, convertFunction) : undefined,
    approvalAmounts: details.approvalAmounts ? convertApprovalAmounts(details.approvalAmounts, convertFunction) : undefined,
    maxNumTransfers: details.maxNumTransfers ? convertMaxNumTransfers(details.maxNumTransfers, convertFunction) : undefined
  })
}
