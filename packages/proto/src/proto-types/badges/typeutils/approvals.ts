import { NumberType } from "../string-numbers";
import { UserPermissions, convertUserPermissions } from "./permissions";
import { Balance, MerkleChallenge, MustOwnBadges, UintRange, convertBalance, convertMerkleChallenge, convertMustOwnBadges, convertUintRange, deepCopy } from "./typeUtils";

/**
 * UserBalanceStore is the store for the user balances for a collection.
 *
 * It consists of a list of balances, a list of approved outgoing transfers, and a list of approved incoming transfers,
 * as well as the permissions for updating the approved incoming/outgoing transfers.
 *
 * Upon initialization, all fields (minus the balances) are set to the defaults specified by the collection.
 *
 * The outgoing transfers can be used to allow / disallow transfers which are sent from this user.
 * If a transfer has no match, then it is disallowed by default, unless from == initiatedBy (i.e. initiated by this user)
 * and autoApproveSelfInitiatedOutgoingTransfers is set to true.
 *
 * The incoming transfers can be used to allow / disallow transfers which are sent to this user.
 * If a transfer has no match, then it is disallowed by default, unless to == initiatedBy (i.e. initiated by this user)
 * and autoApproveSelfInitiatedIncomingTransfers is set to true.
 *
 * Note that the user approved transfers are only checked if the collection approved transfers do not specify to override
 * the user approved transfers.
 *
 * The permissions are used to determine whether the user can update the approved incoming/outgoing transfers and auto approvals.
 *
 * @typedef {Object} UserBalanceStore
 * @property {Balance[]} balances - The balances of the user.
 * @property {UserIncomingApproval[]} incomingApprovals - The incoming approvals of the user.
 * @property {UserOutgoingApproval[]} outgoingApprovals - The outgoing approvals of the user.
 * @property {UserPermissions} userPermissions - The permissions of the user.
 * @property {boolean} autoApproveSelfInitiatedOutgoingTransfers - Whether or not to auto approve self initiated outgoing transfers.
 * @property {boolean} autoApproveSelfInitiatedIncomingTransfers - Whether or not to auto approve self initiated incoming transfers.
 */
export interface UserBalanceStore<T extends NumberType> {
  balances: Balance<T>[];
  incomingApprovals: UserIncomingApproval<T>[];
  outgoingApprovals: UserOutgoingApproval<T>[];
  userPermissions: UserPermissions<T>;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
}

/**
 *
 */
export function convertUserBalanceStore<T extends NumberType, U extends NumberType>(store: UserBalanceStore<T>, convertFunction: (item: T) => U): UserBalanceStore<U> {
  return deepCopy({
    ...store,
    balances: store.balances.map((b) => convertBalance(b, convertFunction)),
    incomingApprovals: store.incomingApprovals.map((b) => convertUserIncomingApproval(b, convertFunction)),
    outgoingApprovals: store.outgoingApprovals.map((b) => convertUserOutgoingApproval(b, convertFunction)),
    userPermissions: convertUserPermissions(store.userPermissions, convertFunction)
  })
}




/**
 * UserOutgoingApproval defines the rules for the approval of an outgoing transfer from a user.
 *
 * @typedef {Object} UserOutgoingApproval
 * @property {string} toListId - The list ID for the user(s) who can receive the badges.
 * @property {string} initiatedByListId - The list ID for the user(s) who can initiate the transfer.
 * @property {UintRange[]} transferTimes - The times allowed for the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs that can be transferred.
 * @property {UintRange[]} ownershipTimes - The ownership times of the badges that can be transferred
 * @property {string} approvalId - The unique ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} amountTrackerId - The ID of the approval tracker. This is the key used to track tallies.
 * @property {string} challengeTrackerId - The ID of the challenge tracker. This is the key used to track used leaves for challenges.
 * @property {string} uri - The URI of the approval.
 * @property {string} customData - Arbitrary custom data of the approval.
 * @property {OutgoingApprovalCriteria[]} approvalCriteria - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 */
export interface UserOutgoingApproval<T extends NumberType> {
  toListId: string;
  initiatedByListId: string;
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

const defaultEmptyCriteria = {
  "uri": "",
  "customData": "",
  "mustOwnBadges": [],
  "approvalAmounts": {
    "overallApprovalAmount": "0",
    "perFromAddressApprovalAmount": "0",
    "perToAddressApprovalAmount": "0",
    "perInitiatedByAddressApprovalAmount": "0"
  },
  "maxNumTransfers": {
    "overallMaxNumTransfers": "0",
    "perFromAddressMaxNumTransfers": "0",
    "perToAddressMaxNumTransfers": "0",
    "perInitiatedByAddressMaxNumTransfers": "0"
  },
  "predeterminedBalances": {
    "manualBalances": [],
    "incrementedBalances": {
      "startBalances": [
      ],
      "incrementBadgeIdsBy": "0",
      "incrementOwnershipTimesBy": "0"
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
    "expectedProofLength": "0",
    "useCreatorAddressAsLeaf": false,
    "maxUsesPerLeaf": "0",
    "uri": "",
    "customData": ""
  },
}

export function convertUserOutgoingApproval<T extends NumberType, U extends NumberType>(transfer: UserOutgoingApproval<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserOutgoingApproval<U> {
  const _transfer = populateOptionalFields ? {
    uri: '',
    customData: '',
    ...transfer,
    fromListOptions: undefined,
  } as Required<UserOutgoingApproval<T>> : transfer

  const defaultOutgoingApprovalCriteria = {
    ...defaultEmptyCriteria as any,
    "requireToEqualsInitiatedBy": false,
    "requireToDoesNotEqualInitiatedBy": false,
  }

  return deepCopy({
    ..._transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: transfer.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    approvalCriteria: populateOptionalFields ? convertOutgoingApprovalCriteria(getFilledOutObj(transfer.approvalCriteria, defaultOutgoingApprovalCriteria), convertFunction) : transfer.approvalCriteria ? convertOutgoingApprovalCriteria(transfer.approvalCriteria, convertFunction) : undefined,
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
 * IMPORTANT: if the balances of the transfer do not exactly match the predetermined balances, then the transfer will fail.
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

/**
 * ManualBalances represents predetermined manually specified balances for transfers of an approval with predetermined balances.
 *
 * @typedef {Object} ManualBalances
 * @property {Balance[]} balances - The list of balances for each transfer. Order number corresponds to the index of the balance in the array.
 */
export interface ManualBalances<T extends NumberType> {
  balances: Balance<T>[];
}

export function convertManualBalances<T extends NumberType, U extends NumberType>(balances: ManualBalances<T>, convertFunction: (item: T) => U): ManualBalances<U> {
  return deepCopy({
    ...balances,
    balances: balances.balances.map((b) => convertBalance(b, convertFunction))
  })
}

/**
 * IncrementedBalances represents predetermined incremented balances for transfers of an approval.
 * You can define a starting balance and increment the badge IDs and owned times by a certain amount.
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
 * PredeterminedOrderCalculationMethod represents the order calculation method for the predetermined balances. Only one option can be set to true.
 * For manual balances, the order number corresponds to the index of the balance in the array.
 * For incremented balances, the order number corresponds to the number of times we increment.
 *
 *
 * @typedef {Object} PredeterminedOrderCalculationMethod
 * @property {boolean} useOverallNumTransfers - Use the overall number of transfers this approval has been used with as the order number. Ex: If this approval has been used 2 times by ANY address, then the order number for the next transfer will be 3.
 * @property {boolean} usePerToAddressNumTransfers - Use the number of times this approval has been used by each to address as the order number. Ex: If this approval has been used 2 times by to address A, then the order number for the next transfer by to address A will be 3.
 * @property {boolean} usePerFromAddressNumTransfers - Use the number of times this approval has been used by each from address as the order number. Ex: If this approval has been used 2 times by from address A, then the order number for the next transfer by from address A will be 3.
 * @property {boolean} usePerInitiatedByAddressNumTransfers - Use the number of times this approval has been used by each initiated by address as the order number. Ex: If this approval has been used 2 times by initiated by address A, then the order number for the next transfer by initiated by address A will be 3.
 * @property {boolean} useMerkleChallengeLeafIndex - Use the merkle challenge leaf index as the order number. Must specify ONE merkle challenge with the useLeafIndexForTransferOrder flag set to true. If so, we will use the leaf index of each merkle proof to calculate the order number.
 *                                                   This is used to reserve specific balances for specific leaves (such as codes or allowlist address leafs)
 */
export interface PredeterminedOrderCalculationMethod {
  useOverallNumTransfers: boolean;
  usePerToAddressNumTransfers: boolean;
  usePerFromAddressNumTransfers: boolean;
  usePerInitiatedByAddressNumTransfers: boolean;
  useMerkleChallengeLeafIndex: boolean;
}


/**
 * ApprovalAmounts represents the maximum approved amounts for the badge IDs / ownership times of this approval.
 * Can be set to 0 to represent an unlimited amount is approved.
 * If set to non-zero value, we track the running tally of the amount approved for each badge ID / ownership time.
 * Once it reaches the max, no more transfers are allowed.
 *
 * Note that we only track the approval amounts if the approval is defined and not unlimited. If it is unlimited, we do not tally.
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
 * Can be set to 0 to represent an unlimited number of transfers.
 * If set to non-zero value, we track the running tally of the number of transfers for each badge ID / ownership time. Once it reaches the max, no more transfers are allowed.
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
 * @property {string} fromListId - The list ID for the user(s) who is sending the badges.
 * @property {string} initiatedByListId - The list ID for the user(s) who initiate the transfer.
 * @property {UintRange[]} transferTimes - The times of the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs to be transferred.
 * @property {UintRange[]} ownershipTimes - The ownership times of the badges being transferred
 * @property {string} approvalId - The ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} amountTrackerId - The ID of the approval tracker. This is the key used to track tallies.
 * @property {string} challengeTrackerId - The ID of the challenge tracker. This is the key used to track used leaves for challenges.
 * @property {string} uri - The URI of the approval.
 * @property {string} customData - Arbitrary custom data of the approval
 * @property {IncomingApprovalCriteria[]} approvalCriteria - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 */
export interface UserIncomingApproval<T extends NumberType> {
  fromListId: string;
  initiatedByListId: string;
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
    toListOptions: undefined,
  } as Required<UserIncomingApproval<T>> : transfer

  const defaultIncomingApprovalCriteria = {
    ...defaultEmptyCriteria as any,
    "requireFromEqualsInitiatedBy": false,
    "requireFromDoesNotEqualInitiatedBy": false,
  }

  return deepCopy({
    ..._transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: transfer.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    approvalCriteria: populateOptionalFields ? convertIncomingApprovalCriteria(getFilledOutObj(transfer.approvalCriteria, defaultIncomingApprovalCriteria), convertFunction) : transfer.approvalCriteria ? convertIncomingApprovalCriteria(transfer.approvalCriteria, convertFunction) : undefined,
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
 * @property {PredeterminedBalances} predeterminedBalances - The predetermined balances for each transfer using this approval.
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
 * @property {string} toListId - The list ID for the user(s) who is receiving the badges.
 * @property {string} fromListId - The list ID for the user(s) who is sending the badges.
 * @property {string} initiatedByListId - The list ID for the user(s) who initiate the transfer.
 *
 * @property {UintRange[]} transferTimes - The times of the transfer transaction.
 * @property {UintRange[]} badgeIds - The badge IDs to be transferred.
 * @property {UintRange[]} ownershipTimes - The ownership times of the badges being transferred
 *
 * @property {string} approvalId - The ID of the approval. Must not be a duplicate of another approval ID in the same timeline.
 * @property {string} amountTrackerId - The ID of the approval tracker. This is the key used to track tallies.
 * @property {string} challengeTrackerId - The ID of the challenge tracker. This is the key used to track used leaves for challenges.
 *
 * @property {string} uri - The URI of the approval.
 * @property {string} customData - Arbitrary custom data of the approval.
 *
 * @property {ApprovalCriteria[]} approvalCriteria - For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc.
 */
export interface CollectionApproval<T extends NumberType> {
  toListId: string;
  fromListId: string;
  initiatedByListId: string;
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

//Helper function to populate optional fields with default values
const getFilledOutObj = (obj: any, defaultValues: any) => {
  if (!obj) return defaultValues;

  const allKeys = Object.keys(defaultValues)

  const newObj: any = {};
  for (const key of allKeys) {
    newObj[key] = obj[key] ?? defaultValues[key]
  }
  return newObj;
}

export function convertCollectionApproval<T extends NumberType, U extends NumberType>(transfer: CollectionApproval<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): CollectionApproval<U> {
  const _transfer = populateOptionalFields ? {
    uri: '',
    customData: '',
    ...transfer,
  } as Required<CollectionApproval<T>> : transfer

  const defaultApprovalCriteria = {
    ...defaultEmptyCriteria as any,
    "requireToEqualsInitiatedBy": false,
    "requireFromEqualsInitiatedBy": false,
    "requireToDoesNotEqualInitiatedBy": false,
    "requireFromDoesNotEqualInitiatedBy": false,
    "overridesToIncomingApprovals": false,
    "overridesFromOutgoingApprovals": false
  }

  return deepCopy({
    ..._transfer,
    transferTimes: transfer.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: transfer.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: transfer.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    approvalCriteria: populateOptionalFields ? convertApprovalCriteria(getFilledOutObj(transfer.approvalCriteria, defaultApprovalCriteria), convertFunction) : transfer.approvalCriteria ? convertApprovalCriteria(transfer.approvalCriteria, convertFunction) : undefined,
  })
}


/**
 * ApprovalCriteria represents the criteria for an approval. The approvee must satisfy all of the criteria to be approved.
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
