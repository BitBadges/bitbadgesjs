import type { NumberType } from '@/common/string-numbers.js';
import type { iApprovalInfoDetails, iIncomingApprovalCriteriaWithDetails } from '@/core/approvals.js';
import type { iAddressList, iBalance, iCoinTransfer, iMerkleChallenge, iMustOwnBadge, iUintRange } from './core.js';

/**
 * @category Interfaces
 */
export interface iDynamicStoreChallenge<T extends NumberType> {
  /** The ID of the dynamic store to check. */
  storeId: T;
}

/**
 * @category Interfaces
 */
export interface iUserOutgoingApproval<T extends NumberType> {
  /** The list ID for the user(s) who is sending the badges. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  toListId: string;
  /** The list ID for the user(s) who initiate the transfer. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  initiatedByListId: string;
  /** The times allowed for the transfer transaction. */
  transferTimes: iUintRange<T>[];
  /** The badge IDs to be transferred. */
  badgeIds: iUintRange<T>[];
  /** The ownership times of the badges being transferred. */
  ownershipTimes: iUintRange<T>[];
  /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
  approvalId: string;
  /** The URI of the approval. */
  uri?: string;
  /** Arbitrary custom data of the approval */
  customData?: string;
  /** The criteria to be met. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc. */
  approvalCriteria?: iOutgoingApprovalCriteria<T>;
  /** The version of the approval. */
  version: T;
}

/**
 * @category Interfaces
 */
export interface iOutgoingApprovalCriteria<T extends NumberType> {
  /** The $BADGE transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer<T>[];
  /** The list of must own badges that need valid proofs to be approved. */
  mustOwnBadges?: iMustOwnBadge<T>[];
  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge<T>[];
  /** The predetermined balances for each transfer. These allow approvals to use predetermined balance amounts rather than an incrementing tally system. */
  predeterminedBalances?: iPredeterminedBalances<T>;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts<T>;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers<T>;
  /** Whether the to address must equal the initiatedBy address. */
  requireToEqualsInitiatedBy?: boolean;
  /** Whether the to address must not equal the initiatedBy  address. */
  requireToDoesNotEqualInitiatedBy?: boolean;
  /** Whether the approval should be deleted after one use. */
  autoDeletionOptions?: iAutoDeletionOptions;
  /** The list of dynamic store challenges that the initiator must pass for approval. */
  dynamicStoreChallenges?: iDynamicStoreChallenge<T>[];
}

/**
 * @category Interfaces
 */
export interface iPredeterminedBalances<T extends NumberType> {
  /** Manually define the balances for each transfer. Cannot be used with incrementedBalances. Order number corresponds to the index of the balance in the array. */
  manualBalances: iManualBalances<T>[];
  /** Define a starting balance and increment the badge IDs and owned times by a certain amount after each transfer. Cannot be used with manualBalances. Order number corresponds to number of times we increment. */
  incrementedBalances: iIncrementedBalances<T>;
  /** The order calculation method. */
  orderCalculationMethod: iPredeterminedOrderCalculationMethod;
}

/**
 * @category Interfaces
 */
export interface iManualBalances<T extends NumberType> {
  /** The list of balances for each transfer. Order number corresponds to the index of the balance in the array. */
  balances: iBalance<T>[];
}

/**
 * @category Interfaces
 */
export interface iRecurringOwnershipTimes<T extends NumberType> {
  /** The start time of the recurring ownership times. */
  startTime: T;
  /** The interval length of the recurring ownership times. */
  intervalLength: T;
  /** Grace period length of when this is valid. */
  chargePeriodLength: T;
}

/**
 * @category Interfaces
 */
export interface iIncrementedBalances<T extends NumberType> {
  /** The starting balances for each transfer. Order number corresponds to the number of times we increment. */
  startBalances: iBalance<T>[];
  /** The amount to increment the badge IDs by after each transfer. */
  incrementBadgeIdsBy: T;
  /** The amount to increment the owned times by after each transfer. Incompatible with durationFromTimestamp. */
  incrementOwnershipTimesBy: T;
  /** The number of unix milliseconds to approve starting from now. Incompatible with incrementOwnershipTimesBy. */
  durationFromTimestamp: T;
  /** Whether to allow the override timestamp to be used. */
  allowOverrideTimestamp: boolean;
  /** The recurring ownership times for the approval. */
  recurringOwnershipTimes: iRecurringOwnershipTimes<T>;
  /** Whether to allow the override with any valid badge. */
  allowOverrideWithAnyValidBadge: boolean;
}

/**
 * @category Interfaces
 */
export interface iPredeterminedOrderCalculationMethod {
  /** Use the overall number of transfers this approval has been used with as the order number. Ex: If this approval has been used 2 times by ANY address, then the order number for the next transfer will be 3. */
  useOverallNumTransfers: boolean;
  /** Use the number of times this approval has been used by each to address as the order number. Ex: If this approval has been used 2 times by to address A, then the order number for the next transfer by to address A will be 3. */
  usePerToAddressNumTransfers: boolean;
  /** Use the number of times this approval has been used by each from address as the order number. Ex: If this approval has been used 2 times by from address A, then the order number for the next transfer by from address A will be 3. */
  usePerFromAddressNumTransfers: boolean;
  /** Use the number of times this approval has been used by each initiated by address as the order number. Ex: If this approval has been used 2 times by initiated by address A, then the order number for the next transfer by initiated by address A will be 3. */
  usePerInitiatedByAddressNumTransfers: boolean;
  /** Use the merkle challenge leaf index as the order number. Must specify ONE merkle challenge with the useLeafIndexForTransferOrder flag set to true. If so, we will use the leaf index of each merkle proof to calculate the order number. This is used to reserve specific balances for specific leaves (such as codes or whitelist address leafs) */
  useMerkleChallengeLeafIndex: boolean;
  /** Use the merkle challenge leaf index as the order number. Must specify ONE merkle challenge with the useLeafIndexForTransferOrder flag set to true. If so, we will use the leaf index of each merkle proof to calculate the order number. This is used to reserve specific balances for specific leaves (such as codes or whitelist address leafs) */
  challengeTrackerId: string;
}

/**
 * @category Interfaces
 */
export interface iResetTimeIntervals<T extends NumberType> {
  /** The start time of the first interval. */
  startTime: T;
  /** The length of the interval. */
  intervalLength: T;
}

/**
 * @category Interfaces
 */
export interface iApprovalAmounts<T extends NumberType> {
  /** The overall maximum amount approved for the badgeIDs and ownershipTimes. Running tally that includes all transfers that match this approval. */
  overallApprovalAmount: T;
  /** The maximum amount approved for the badgeIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval. */
  perToAddressApprovalAmount: T;
  /** The maximum amount approved for the badgeIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval. */
  perFromAddressApprovalAmount: T;
  /** The maximum amount approved for the badgeIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval. */
  perInitiatedByAddressApprovalAmount: T;
  /** The ID of the approval tracker. This is the key used to track tallies. */
  amountTrackerId: string;
  /** The time intervals to reset the tracker at. */
  resetTimeIntervals: iResetTimeIntervals<T>;
}

/**
 * @category Interfaces
 */
export interface iAutoDeletionOptions {
  /** Whether the approval should be deleted after one use. */
  afterOneUse: boolean;
  /** Whether the approval should be deleted after the overall max number of transfers threshold is met. */
  afterOverallMaxNumTransfers: boolean;
  /** Allow counterparty to purge this approval if they are the only initiator */
  allowCounterpartyPurge: boolean;
  /** Allow others to call PurgeApprovals on behalf of this approval owner */
  allowPurgeIfExpired: boolean;
}

/**
 * @category Interfaces
 */
export interface iMaxNumTransfers<T extends NumberType> {
  /** The overall maximum number of transfers for the badgeIDs and ownershipTimes. Running tally that includes all transfers that match this approval. */
  overallMaxNumTransfers: T;
  /** The maximum number of transfers for the badgeIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval. */
  perToAddressMaxNumTransfers: T;
  /** The maximum number of transfers for the badgeIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval. */
  perFromAddressMaxNumTransfers: T;
  /** The maximum number of transfers for the badgeIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval. */
  perInitiatedByAddressMaxNumTransfers: T;
  /** The ID of the approval tracker. This is the key used to track tallies. */
  amountTrackerId: string;
  /** The time intervals to reset the tracker at. */
  resetTimeIntervals: iResetTimeIntervals<T>;
}

/**
 * @category Interfaces
 */
export interface iUserIncomingApproval<T extends NumberType> {
  /** The list ID for the user(s) who is sending the badges. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  fromListId: string;
  /** The list ID for the user(s) who initiate the transfer. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  initiatedByListId: string;
  /** The times allowed for the transfer transaction. */
  transferTimes: iUintRange<T>[];
  /** The badge IDs to be transferred. */
  badgeIds: iUintRange<T>[];
  /** The ownership times of the badges being transferred. */
  ownershipTimes: iUintRange<T>[];
  /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
  approvalId: string;
  /** The URI of the approval. */
  uri?: string;
  /** Arbitrary custom data of the approval */
  customData?: string;
  /** The criteria to be met. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc. */
  approvalCriteria?: iIncomingApprovalCriteria<T>;
  /** The version of the approval. */
  version: T;
}

/**
 * @category Interfaces
 */
export interface iIncomingApprovalCriteria<T extends NumberType> {
  /** The $BADGE transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer<T>[];
  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge<T>[];
  /** The list of must own badges that need valid proofs to be approved. */
  mustOwnBadges?: iMustOwnBadge<T>[];
  /** The predetermined balances for each transfer using this approval. */
  predeterminedBalances?: iPredeterminedBalances<T>;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts<T>;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers<T>;
  /** Whether the approval should be deleted after one use. */
  autoDeletionOptions?: iAutoDeletionOptions;
  /** Whether the from address must equal the initiatedBy address. */
  requireFromEqualsInitiatedBy?: boolean;
  /** Whether the from address must not equal the initiatedBy address. */
  requireFromDoesNotEqualInitiatedBy?: boolean;
  /** The list of dynamic store challenges that the initiator must pass for approval. */
  dynamicStoreChallenges?: iDynamicStoreChallenge<T>[];
}

/**
 * @category Interfaces
 */
export interface iCollectionApproval<T extends NumberType> {
  /** The list ID for the user(s) who is receiving the badges. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  toListId: string;
  /** The list ID for the user(s) who is sending the badges. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  fromListId: string;
  /** The list ID for the user(s) who initiate the transfer. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  initiatedByListId: string;
  /** The times allowed for the transfer transaction. */
  transferTimes: iUintRange<T>[];
  /** The badge IDs to be transferred. */
  badgeIds: iUintRange<T>[];
  /** The ownership times of the badges being transferred. */
  ownershipTimes: iUintRange<T>[];
  /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
  approvalId: string;
  /** The URI of the approval. */
  uri?: string;
  /** Arbitrary custom data of the approval */
  customData?: string;
  /** The criteria to be met. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc. */
  approvalCriteria?: iApprovalCriteria<T>;
  /** The version of the approval.0 */
  version: T;
}

/**
 * @category Interfaces
 */
export interface iApprovalCriteria<T extends NumberType> {
  /** The $BADGE transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer<T>[];
  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge<T>[];
  /** The list of must own badges that need valid proofs to be approved. */
  mustOwnBadges?: iMustOwnBadge<T>[];
  /** The predetermined balances for each transfer. These allow approvals to use predetermined balance amounts rather than an incrementing tally system. */
  predeterminedBalances?: iPredeterminedBalances<T>;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts<T>;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers<T>;
  /** Whether the approval should be deleted after one use. */
  autoDeletionOptions?: iAutoDeletionOptions;
  /** Whether the to address must equal the initiatedBy address. */
  requireToEqualsInitiatedBy?: boolean;
  /** Whether the from address must equal the initiatedBy address. */
  requireFromEqualsInitiatedBy?: boolean;
  /** Whether the to address must not equal the initiatedBy address. */
  requireToDoesNotEqualInitiatedBy?: boolean;
  /** Whether the from address must not equal the initiatedBy address. */
  requireFromDoesNotEqualInitiatedBy?: boolean;
  /** Whether this approval overrides the from address's approved outgoing transfers. */
  overridesFromOutgoingApprovals?: boolean;
  /** Whether this approval overrides the to address's approved incoming transfers. */
  overridesToIncomingApprovals?: boolean;
  /** The royalties to apply to the transfer. */
  userRoyalties?: iUserRoyalties<T>;
  /** The list of dynamic store challenges that the initiator must pass for approval. */
  dynamicStoreChallenges?: iDynamicStoreChallenge<T>[];
}

/**
 * @category Interfaces
 */
export interface iUserRoyalties<T extends NumberType> {
  /** The percentage of the transfer amount to apply as royalties. 1 to 10000 represents basis points. */
  percentage: T;
  /** The payout address for the royalties. */
  payoutAddress: string;
}

/**
 * @category Interfaces
 */
export interface iUserIncomingApprovalWithDetails<T extends NumberType> extends iUserIncomingApproval<T> {
  /** The populated address list for fromListId */
  fromList: iAddressList;
  /** The populated address list for initiatedByListId */
  initiatedByList: iAddressList;
  approvalCriteria?: iIncomingApprovalCriteriaWithDetails<T>;
  details?: iApprovalInfoDetails;
}
