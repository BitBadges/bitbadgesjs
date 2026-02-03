import type { NumberType } from '@/common/string-numbers.js';
import type { iApprovalInfoDetails, iIncomingApprovalCriteriaWithDetails } from '@/core/approvals.js';
import type { iAddressList, iBalance, iCoinTransfer, iETHSignatureChallenge, iMerkleChallenge, iMustOwnToken, iUintRange, iVotingChallenge } from './core.js';

/**
 * @category Interfaces
 */
export interface iDynamicStoreChallenge {
  /** The ID of the dynamic store to check. */
  storeId: string | number;
  /** The party to check ownership for. Options are "initiator", "sender", "recipient", or any valid bb1 address. If a valid bb1 address is provided, ownership will be checked for that specific address. This enables use cases like halt tokens where ownership is checked for an arbitrary address (e.g., halt token owner). Defaults to "initiator" if empty or if the value is not a recognized option or valid bb1 address. */
  ownershipCheckParty?: string;
}

/**
 * @category Interfaces
 */
export interface iAddressChecks {
  /** Require the address to be a WASM contract. */
  mustBeWasmContract?: boolean;
  /** Require the address to not be a WASM contract. */
  mustNotBeWasmContract?: boolean;
  /** Require the address to be a liquidity pool. */
  mustBeLiquidityPool?: boolean;
  /** Require the address to not be a liquidity pool. */
  mustNotBeLiquidityPool?: boolean;
}

/**
 * @category Interfaces
 */
export interface iAltTimeChecks {
  /** Hours (0-23) when transfers should be denied. Uses UTC timezone. */
  offlineHours?: iUintRange[];
  /** Days (0-6, where 0=Sunday, 1=Monday, ..., 6=Saturday) when transfers should be denied. Uses UTC timezone. */
  offlineDays?: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iUserOutgoingApproval {
  /** The list ID for the user(s) who is sending the tokens. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  toListId: string;
  /** The list ID for the user(s) who initiate the transfer. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  initiatedByListId: string;
  /** The times allowed for the transfer transaction. */
  transferTimes: iUintRange[];
  /** The token IDs to be transferred. */
  tokenIds: iUintRange[];
  /** The ownership times of the tokens being transferred. */
  ownershipTimes: iUintRange[];
  /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
  approvalId: string;
  /** The URI of the approval. */
  uri?: string;
  /** Arbitrary custom data of the approval */
  customData?: string;
  /** The criteria to be met. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own tokens, etc. */
  approvalCriteria?: iOutgoingApprovalCriteria;
  /** The version of the approval. */
  version: string | number;
}

/**
 * @category Interfaces
 */
export interface iOutgoingApprovalCriteria {
  /** The BADGE or sdk.coin transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer[];
  /** The list of must own tokens that need valid proofs to be approved. */
  mustOwnTokens?: iMustOwnToken[];
  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge[];
  /** The predetermined balances for each transfer. These allow approvals to use predetermined balance amounts rather than an incrementing tally system. */
  predeterminedBalances?: iPredeterminedBalances;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers;
  /** Whether the to address must equal the initiatedBy address. */
  requireToEqualsInitiatedBy?: boolean;
  /** Whether the to address must not equal the initiatedBy  address. */
  requireToDoesNotEqualInitiatedBy?: boolean;
  /** Whether the approval should be deleted after one use. */
  autoDeletionOptions?: iAutoDeletionOptions;
  /** The list of dynamic store challenges that the initiator must pass for approval. */
  dynamicStoreChallenges?: iDynamicStoreChallenge[];
  /** The list of ETH signature challenges that the initiator must pass for approval. */
  ethSignatureChallenges?: iETHSignatureChallenge[];
  /** Address checks for recipient */
  recipientChecks?: iAddressChecks;
  /** Address checks for initiator */
  initiatorChecks?: iAddressChecks;
  /** Alternative time-based checks for approval denial (offline hours/days). */
  altTimeChecks?: iAltTimeChecks;
  /** If true, this approval must be explicitly prioritized in PrioritizedApprovals to be used. */
  mustPrioritize?: boolean;
  /** The list of voting challenges that must be satisfied for approval. */
  votingChallenges?: iVotingChallenge[];
}

/**
 * @category Interfaces
 */
export interface iPredeterminedBalances {
  /** Manually define the balances for each transfer. Cannot be used with incrementedBalances. Order number corresponds to the index of the balance in the array. */
  manualBalances: iManualBalances[];
  /** Define a starting balance and increment the token IDs and owned times by a certain amount after each transfer. Cannot be used with manualBalances. Order number corresponds to number of times we increment. */
  incrementedBalances: iIncrementedBalances;
  /** The order calculation method. */
  orderCalculationMethod: iPredeterminedOrderCalculationMethod;
}

/**
 * @category Interfaces
 */
export interface iManualBalances {
  /** The list of balances for each transfer. Order number corresponds to the index of the balance in the array. */
  balances: iBalance[];
}

/**
 * @category Interfaces
 */
export interface iRecurringOwnershipTimes {
  /** The start time of the recurring ownership times. */
  startTime: string | number;
  /** The interval length of the recurring ownership times. */
  intervalLength: string | number;
  /** Grace period length of when this is valid. */
  chargePeriodLength: string | number;
}

/**
 * @category Interfaces
 */
export interface iIncrementedBalances {
  /** The starting balances for each transfer. Order number corresponds to the number of times we increment. */
  startBalances: iBalance[];
  /** The amount to increment the token IDs by after each transfer. */
  incrementTokenIdsBy: string | number;
  /** The amount to increment the owned times by after each transfer. Incompatible with durationFromTimestamp. */
  incrementOwnershipTimesBy: string | number;
  /** The number of unix milliseconds to approve starting from now. Incompatible with incrementOwnershipTimesBy. */
  durationFromTimestamp: string | number;
  /** Whether to allow the override timestamp to be used. */
  allowOverrideTimestamp: boolean;
  /** The recurring ownership times for the approval. */
  recurringOwnershipTimes: iRecurringOwnershipTimes;
  /** Whether to allow the override with any valid ID. */
  allowOverrideWithAnyValidToken: boolean;
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
export interface iResetTimeIntervals {
  /** The start time of the first interval. */
  startTime: string | number;
  /** The length of the interval. */
  intervalLength: string | number;
}

/**
 * @category Interfaces
 */
export interface iApprovalAmounts {
  /** The overall maximum amount approved for the tokenIDs and ownershipTimes. Running tally that includes all transfers that match this approval. */
  overallApprovalAmount: string | number;
  /** The maximum amount approved for the tokenIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval. */
  perToAddressApprovalAmount: string | number;
  /** The maximum amount approved for the tokenIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval. */
  perFromAddressApprovalAmount: string | number;
  /** The maximum amount approved for the tokenIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval. */
  perInitiatedByAddressApprovalAmount: string | number;
  /** The ID of the approval tracker. This is the key used to track tallies. */
  amountTrackerId: string;
  /** The time intervals to reset the tracker at. */
  resetTimeIntervals: iResetTimeIntervals;
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
export interface iMaxNumTransfers {
  /** The overall maximum number of transfers for the tokenIDs and ownershipTimes. Running tally that includes all transfers that match this approval. */
  overallMaxNumTransfers: string | number;
  /** The maximum number of transfers for the tokenIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval. */
  perToAddressMaxNumTransfers: string | number;
  /** The maximum number of transfers for the tokenIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval. */
  perFromAddressMaxNumTransfers: string | number;
  /** The maximum number of transfers for the tokenIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval. */
  perInitiatedByAddressMaxNumTransfers: string | number;
  /** The ID of the approval tracker. This is the key used to track tallies. */
  amountTrackerId: string;
  /** The time intervals to reset the tracker at. */
  resetTimeIntervals: iResetTimeIntervals;
}

/**
 * @category Interfaces
 */
export interface iUserIncomingApproval {
  /** The list ID for the user(s) who is sending the tokens. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  fromListId: string;
  /** The list ID for the user(s) who initiate the transfer. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  initiatedByListId: string;
  /** The times allowed for the transfer transaction. */
  transferTimes: iUintRange[];
  /** The token IDs to be transferred. */
  tokenIds: iUintRange[];
  /** The ownership times of the tokens being transferred. */
  ownershipTimes: iUintRange[];
  /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
  approvalId: string;
  /** The URI of the approval. */
  uri?: string;
  /** Arbitrary custom data of the approval */
  customData?: string;
  /** The criteria to be met. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own tokens, etc. */
  approvalCriteria?: iIncomingApprovalCriteria;
  /** The version of the approval. */
  version: string | number;
}

/**
 * @category Interfaces
 */
export interface iIncomingApprovalCriteria {
  /** The BADGE or sdk.coin transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer[];
  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge[];
  /** The list of must own tokens that need valid proofs to be approved. */
  mustOwnTokens?: iMustOwnToken[];
  /** The predetermined balances for each transfer using this approval. */
  predeterminedBalances?: iPredeterminedBalances;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers;
  /** Whether the approval should be deleted after one use. */
  autoDeletionOptions?: iAutoDeletionOptions;
  /** Whether the from address must equal the initiatedBy address. */
  requireFromEqualsInitiatedBy?: boolean;
  /** Whether the from address must not equal the initiatedBy address. */
  requireFromDoesNotEqualInitiatedBy?: boolean;
  /** The list of dynamic store challenges that the initiator must pass for approval. */
  dynamicStoreChallenges?: iDynamicStoreChallenge[];
  /** The list of ETH signature challenges that the initiator must pass for approval. */
  ethSignatureChallenges?: iETHSignatureChallenge[];
  /** Address checks for sender */
  senderChecks?: iAddressChecks;
  /** Address checks for initiator */
  initiatorChecks?: iAddressChecks;
  /** Alternative time-based checks for approval denial (offline hours/days). */
  altTimeChecks?: iAltTimeChecks;
  /** If true, this approval must be explicitly prioritized in PrioritizedApprovals to be used. */
  mustPrioritize?: boolean;
  /** The list of voting challenges that must be satisfied for approval. */
  votingChallenges?: iVotingChallenge[];
}

/**
 * @category Interfaces
 */
export interface iCollectionApproval {
  /** The list ID for the user(s) who is receiving the tokens. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  toListId: string;
  /** The list ID for the user(s) who is sending the tokens. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  fromListId: string;
  /** The list ID for the user(s) who initiate the transfer. The ID is either registered on-chain for reusability or follows the reserved ID system. */
  initiatedByListId: string;
  /** The times allowed for the transfer transaction. */
  transferTimes: iUintRange[];
  /** The token IDs to be transferred. */
  tokenIds: iUintRange[];
  /** The ownership times of the tokens being transferred. */
  ownershipTimes: iUintRange[];
  /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
  approvalId: string;
  /** The URI of the approval. */
  uri?: string;
  /** Arbitrary custom data of the approval */
  customData?: string;
  /** The criteria to be met. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own tokens, etc. */
  approvalCriteria?: iApprovalCriteria;
  /** The version of the approval.0 */
  version: string | number;
}

/**
 * @category Interfaces
 */
export interface iApprovalCriteria {
  /** The BADGE or sdk.coin transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer[];
  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge[];
  /** The list of must own tokens that need valid proofs to be approved. */
  mustOwnTokens?: iMustOwnToken[];
  /** The predetermined balances for each transfer. These allow approvals to use predetermined balance amounts rather than an incrementing tally system. */
  predeterminedBalances?: iPredeterminedBalances;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers;
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
  userRoyalties?: iUserRoyalties;
  /** The list of dynamic store challenges that the initiator must pass for approval. */
  dynamicStoreChallenges?: iDynamicStoreChallenge[];
  /** The list of ETH signature challenges that the initiator must pass for approval. */
  ethSignatureChallenges?: iETHSignatureChallenge[];
  /** Address checks for sender */
  senderChecks?: iAddressChecks;
  /** Address checks for recipient */
  recipientChecks?: iAddressChecks;
  /** Address checks for initiator */
  initiatorChecks?: iAddressChecks;
  /** Alternative time-based checks for approval denial (offline hours/days). */
  altTimeChecks?: iAltTimeChecks;
  /** If true, this approval must be explicitly prioritized in PrioritizedApprovals to be used. */
  mustPrioritize?: boolean;
  /** The list of voting challenges that must be satisfied for approval. */
  votingChallenges?: iVotingChallenge[];
  /** If true, this collection approval allows backed minting operations (CosmosCoinBackedPath). When false, this approval cannot be used for transfers involving backed minting addresses. This prevents accidental allowances when toListIds is "All". */
  allowBackedMinting?: boolean;
  /** If true, this collection approval allows special wrapping operations (CosmosCoinWrapperPath). When false, this approval cannot be used for transfers involving wrapping addresses. This prevents accidental allowances when toListIds is "All". */
  allowSpecialWrapping?: boolean;
}

/**
 * @category Interfaces
 */
export interface iUserRoyalties {
  /** The percentage of the transfer amount to apply as royalties. 1 to 10000 represents basis points. */
  percentage: string | number;
  /** The payout address for the royalties. */
  payoutAddress: string;
}

/**
 * @category Interfaces
 */
export interface iUserIncomingApprovalWithDetails extends iUserIncomingApproval {
  /** The populated address list for fromListId */
  fromList: iAddressList;
  /** The populated address list for initiatedByListId */
  initiatedByList: iAddressList;
  approvalCriteria?: iIncomingApprovalCriteriaWithDetails;
  details?: iApprovalInfoDetails;
}
