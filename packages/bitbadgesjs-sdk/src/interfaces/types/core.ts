//IMPORTANT: Keep all imports type-safe by using the `type` keyword. If not, this will mess up the circular dependency check.

import type { BitBadgesAddress, iTokenMetadataDetails, iCollectionMetadataDetails } from '@/api-indexer/index.js';
import type { iMetadata } from '@/api-indexer/metadata/metadata.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iCosmosCoin } from '@/core/coin.js';

/**
 * @category Interfaces
 */
export interface iUintRange {
  /**
   * The start of the range.
   */
  start: string | number;

  /**
   * The end of the range, inclusive.
   */
  end: string | number;
}

/**
 * @category Interfaces
 */
export interface iTokenMetadata {
  /**
   * The URI where to fetch the token metadata from.
   */
  uri: string;

  /**
   * The token IDs corresponding to the URI.
   */
  tokenIds: iUintRange[];

  /**
   * Arbitrary custom data that can be stored on-chain
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iCollectionMetadata {
  /**
   * The URI where to fetch the collection metadata from.
   */
  uri: string;

  /**
   * Arbitrary custom data that can be stored on-chain
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iPathMetadata {
  /**
   * The URI (Uniform Resource Identifier) associated with the path metadata.
   */
  uri: string;

  /**
   * Custom data or additional information related to the path metadata.
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iPathMetadataWithDetails extends iPathMetadata {
  /**
   * The fetched metadata from the URI.
   */
  metadata?: iMetadata;
}

/**
 * @category Interfaces
 */
export interface iMustOwnTokens {
  /**
   * The collection IDs to own.
   */
  collectionId: CollectionId;

  /**
   * The min/max acceptable amount of tokens that must be owned (can be any values, including 0-0).
   */
  amountRange: iUintRange;

  /**
   * The range of the times that the tokens must be owned.
   */
  ownershipTimes: iUintRange[];

  /**
   * The range of the token IDs that must be owned.
   */
  tokenIds: iUintRange[];

  /**
   * Whether or not to override the ownershipTimes with the current time.
   */
  overrideWithCurrentTime: boolean;

  /**
   * Whether or not the user must own all the specified tokens. If false, we will accept if they meet criteria for at least one token.
   */
  mustSatisfyForAllAssets: boolean;

  /**
   * The party to check ownership for. Options are "initiator", "sender", or "recipient". Defaults to "initiator" if empty.
   */
  ownershipCheckParty?: string;
}

/**
 * @category Interfaces
 */
export interface iBalance {
  /**
   * The amount or balance of the owned token.
   */
  amount: string | number;

  /**
   * The token IDs corresponding to the balance.
   */
  tokenIds: iUintRange[];

  /**
   * The times that the token is owned from.
   */
  ownershipTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iAddressList {
  /**
   * The ID of the address list.
   */
  listId: string;

  /**
   * The addresses of the address list. If this is a tracker list, the addresses are the tracker IDs.
   */
  addresses: string[];

  /**
   * Whether or not to include ONLY the addresses or include all EXCEPT the addresses.
   */
  whitelist: boolean;

  /**
   * The URI where to fetch the address list metadata from.
   */
  uri: string;

  /**
   * Arbitrary custom data that can be stored. Leave blank for no custom data.
   */
  customData: string;

  /**
   * The address that created the address list. Handled internally.
   */
  createdBy?: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iConversionSideAWithDenom {
  /** The amount of the cosmos coin (0 decimals). */
  amount: string | number;
  /** The denomination of the cosmos coin. */
  denom: string;
}

/**
 * @category Interfaces
 */
export interface iConversionSideA {
  /** The amount of the cosmos coin (0 decimals). */
  amount: string | number;
}

/**
 * @category Interfaces
 */
export interface iConversion {
  /** Side A: The cosmos coin side of the conversion (amount + denom). */
  sideA: iConversionSideAWithDenom;
  /** Side B: The badge balances side of the conversion. */
  sideB: iBalance[];
}

/**
 * @category Interfaces
 */
export interface iConversionWithoutDenom {
  /** Side A: The cosmos coin amount side of the conversion (amount only, denom stored separately). */
  sideA: iConversionSideA;
  /** Side B: The badge balances side of the conversion. */
  sideB: iBalance[];
}

/**
 * @category Interfaces
 */
export interface iDenomUnit {
  /** The number of decimal places for this denomination unit. */
  decimals: string | number;
  /** The symbol for this denomination unit. */
  symbol: string;
  /** Whether this denomination unit is the default display unit. */
  isDefaultDisplay: boolean;
  /** The metadata for this denomination unit. */
  metadata: iPathMetadata;
}

/**
 * @category Interfaces
 */
export interface iDenomUnitWithDetails extends iDenomUnit {
  /** Metadata object containing uri, customData, and fetched metadata. */
  metadata: iPathMetadataWithDetails;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinWrapperPathAddObject {
  /** The denom of the IBC wrapper path. */
  denom: string;

  /** The conversion between cosmos coin and badge balances. */
  conversion: iConversionWithoutDenom;

  /** The symbol for this IBC wrapper path. */
  symbol: string;

  /** The denomination units for this IBC wrapper path. */
  denomUnits: iDenomUnit[];

  /** Whether to allow override with any valid token. */
  allowOverrideWithAnyValidToken: boolean;

  /** The metadata for this wrapper path. */
  metadata: iPathMetadata;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinBackedPathAddObject {
  /** The conversion between IBC cosmos coin and badge balances. */
  conversion: iConversion;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinBackedPath {
  /** The address for this IBC backed path. */
  address: string;

  /** The conversion between IBC cosmos coin and badge balances. */
  conversion: iConversion;
}

/**
 * InvariantsAddObject is used for adding invariants without specifying addresses.
 * Addresses are generated by the keeper and stored in the collection.
 *
 * @category Interfaces
 */
export interface iInvariantsAddObject {
  /**
   * If true, all ownership times must be full ranges [{ start: 1, end: GoMaxUInt64 }].
   * This prevents time-based restrictions on token ownership.
   */
  noCustomOwnershipTimes: boolean;

  /**
   * Maximum supply per token ID. If set, no balance can exceed this amount.
   * This prevents any single token ID from having more than the specified supply.
   */
  maxSupplyPerId: string | number;

  /**
   * The IBC backed (sdk.coin) path for the collection. Only one path is allowed.
   * Address will be generated by the keeper.
   */
  cosmosCoinBackedPath?: iCosmosCoinBackedPathAddObject;

  /**
   * If true, disallows any collection approvals that have overridesFromOutgoingApprovals or overridesToIncomingApprovals set to true.
   * This prevents forceful post-mint transfers that bypass user-level approvals.
   */
  noForcefulPostMintTransfers: boolean;

  /**
   * If true, disallows pool creation with this collection's assets.
   * When true, any attempt to create a pool with badges assets from this collection will fail.
   */
  disablePoolCreation: boolean;
}

/**
 * @category Interfaces
 */
export interface iAliasPathAddObject {
  /** The denomination (denom) to be used for the alias. */
  denom: string;

  /** The conversion between cosmos coin and badge balances. */
  conversion: iConversionWithoutDenom;

  /** The symbol for the alias (e.g., "BADGE", "NFT"). */
  symbol: string;

  /** Denomination units for the alias. Defines how the coin can be displayed with different decimal places and symbols. */
  denomUnits: iDenomUnit[];

  /** The metadata for this alias path. */
  metadata: iPathMetadata;
}

/**
 * @category Interfaces
 */
export interface iTransfer {
  /**
   * The address to transfer from.
   */
  from: BitBadgesAddress;

  /**
   * The addresses to transfer to.
   */
  toAddresses: BitBadgesAddress[];

  /**
   * The balances to transfer.
   */
  balances: iBalance[];

  /**
   * If specified, we will precalculate from this approval and override the balances. This can only be used when the specified approval has predeterminedBalances set.
   */
  precalculateBalancesFromApproval?: iPrecalculateBalancesFromApprovalDetails;

  /**
   * The merkle proofs that satisfy the mkerkle challenges in the approvals. If the transfer deducts from multiple approvals, we check all the merkle proofs and assert at least one is valid for every challenge.
   */
  merkleProofs?: iMerkleProof[];

  /**
   * The ETH signature proofs that satisfy the ETH signature challenges in the approvals. If the transfer deducts from multiple approvals, we check all the ETH signature proofs and assert at least one is valid for every challenge.
   */
  ethSignatureProofs?: iETHSignatureProof[];

  /**
   * Arbitrary memo for the transfer.
   */
  memo?: string;

  /**
   * The prioritized approvals to use for the transfer. If specified, we will check these first.
   */
  prioritizedApprovals?: iApprovalIdentifierDetails[];

  /**
   * Whether or not to only check the prioritized approvals. If false, we will check all approvals with any prioritized first.
   *
   * This only applies to the "collection" level approvals specified.
   */
  onlyCheckPrioritizedCollectionApprovals?: boolean;

  /**
   * Whether or not to only check the prioritized approvals. If false, we will check all approvals with any prioritized first.
   *
   * This only applies to the "incoming" level approvals specified.
   */
  onlyCheckPrioritizedIncomingApprovals?: boolean;

  /**
   * Whether or not to only check the prioritized approvals. If false, we will check all approvals with any prioritized first.
   *
   * This only applies to the "outgoing" level approvals specified.
   */
  onlyCheckPrioritizedOutgoingApprovals?: boolean;
}

/**
 * @category Interfaces
 */
export interface iApprovalIdentifierDetails {
  /**
   * The approval ID of the approval.
   */
  approvalId: string;

  /**
   * The approval level of the approval "collection", "incoming", or "outgoing".
   */
  approvalLevel: string;

  /**
   * The address of the approval to check. If approvalLevel is "collection", this is blank "".
   */
  approverAddress: BitBadgesAddress;

  /**
   * The version of the approval.
   */
  version: string | number;
}

/**
 * @category Interfaces
 */
export interface iPrecalculationOptions {
  /** The timestamp to use for the transfer. */
  overrideTimestamp?: string | number;
  /** The token IDs to use for the transfer. */
  tokenIdsOverride?: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iPrecalculateBalancesFromApprovalDetails {
  /**
   * The approval ID of the approval.
   */
  approvalId: string;

  /**
   * The approval level of the approval "collection", "incoming", or "outgoing".
   */
  approvalLevel: string;

  /**
   * The address of the approval to check. If approvalLevel is "collection", this is blank "".
   */
  approverAddress: BitBadgesAddress;

  /**
   * The version of the approval.
   */
  version: string | number;

  /**
   * The options for precalculating the balances.
   */
  precalculationOptions?: iPrecalculationOptions;
}

/**
 * @category Interfaces
 */
export interface iCoinTransfer {
  /**
   * The recipient of the coin transfer. This should be a Bech32 BitBadges address.
   */
  to: BitBadgesAddress;
  /**
   * The coins
   */
  coins: iCosmosCoin[];
  /**
   * Whether or not to override the from address with the approver address.
   */
  overrideFromWithApproverAddress: boolean;
  /**
   * Whether or not to override the to address with the initiator of the transaction.
   */
  overrideToWithInitiator: boolean;
}

/** @category Interfaces */
export type CollectionId = string;

/**
 * @category Interfaces
 */
export interface iAmountTrackerIdDetails {
  /**
   * The collection ID for the approval.
   */
  collectionId: CollectionId;

  /**
   * The approval ID
   */
  approvalId: string;

  /**
   * The amount tracker ID of the approval.
   */
  amountTrackerId: string;

  /**
   * The approval level of the approval "collection", "incoming", or "outgoing".
   */
  approvalLevel: string;

  /**
   * The address of the approval to check.
   */
  approverAddress: BitBadgesAddress;

  /**
   * The type of tracker to check "overall", "to", "from", or "initiatedBy".
   */
  trackerType: string;

  /**
   * The address to check for the approval.
   */
  approvedAddress: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iMustOwnToken {
  /**
   * The ID of the collection.
   */
  collectionId: CollectionId;

  /**
   * The range of amounts the user must own (min to max).
   */
  amountRange: iUintRange;

  /**
   * The time ranges during which the user must own the tokens.
   */
  ownershipTimes: iUintRange[];

  /**
   * The token IDs the user must own.
   */
  tokenIds: iUintRange[];

  /**
   * If true, override ownershipTimes with the current time.
   */
  overrideWithCurrentTime: boolean;

  /**
   * If true, the user must meet ownership requirements for all specified tokens; else, must meet requirements for any single token.
   */
  mustSatisfyForAllAssets: boolean;

  /**
   * The party to check ownership for. Options are "initiator", "sender", or "recipient". Defaults to "initiator" if empty.
   */
  ownershipCheckParty?: string;
}

/**
 * @category Interfaces
 */
export interface iMerkleChallenge {
  /**
   * The root of the merkle tree.
   */
  root: string;

  /**
   * The expected proof length of the merkle proof.
   */
  expectedProofLength: string | number;

  /**
   * Whether or not to override any leaf value and use the creator address as the leaf. Used for whitelist trees.
   */
  useCreatorAddressAsLeaf: boolean;

  /**
   * Whether or not to enforce max uses per leaf. Used to prevent replay attacks.
   */
  maxUsesPerLeaf: string | number;

  /**
   * The URI where to fetch the merkle challenge metadata from.
   */
  uri: string;

  /**
   * Arbitrary custom data that can be stored on-chain.
   */
  customData: string;

  /**
   * Tracker ID details for the merkle challenge.
   */
  challengeTrackerId: string;

  /**
   * The signer of the leaf. Currently only supports ETH addresses.
   */
  leafSigner: string;
}

/**
 * @category Interfaces
 */
export interface iMerklePathItem {
  /**
   * The aunt of the merkle path item.
   */
  aunt: string;

  /**
   * Indicates whether the aunt node is on the right side of the path.
   */
  onRight: boolean;
}

/**
 * @category Interfaces
 */
export interface iMerkleProof {
  /**
   * The aunts of the merkle proof.
   */
  aunts: iMerklePathItem[];

  /**
   * The leaf of the merkle proof. If useCreatorAddressAsLeaf is true, this will be populated with the creator BitBadges address.
   */
  leaf: string;

  /**
   * The signature for the leaf. With an ETH message signature, sign(leaf + "-" + intendedBitBadgesAddress).
   */
  leafSignature: string;
}

/**
 * @category Interfaces
 */
export interface iETHSignatureChallenge {
  /**
   * The Ethereum address that must sign the nonce for verification.
   */
  signer: string;

  /**
   * The ID of this ETH signature challenge for tracking the number of uses per signature.
   */
  challengeTrackerId: string;

  /**
   * The URI associated with this ETH signature challenge, optionally providing metadata about the challenge.
   */
  uri: string;

  /**
   * Arbitrary custom data associated with this ETH signature challenge.
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iETHSignatureProof {
  /**
   * The nonce that was signed. The signature scheme is ETHSign(nonce + "-" + creatorAddress).
   */
  nonce: string;

  /**
   * The Ethereum signature of the nonce.
   */
  signature: string;
}

/**
 * @category Interfaces
 */
export interface iVoter {
  /**
   * The address of the voter.
   */
  address: string;

  /**
   * The weight of this voter's vote.
   */
  weight: string | number;
}

/**
 * @category Interfaces
 */
export interface iVotingChallenge {
  /**
   * The ID of this voting challenge for tracking votes (scoped like challengeTrackerId).
   * Format: collectionId-approverAddress-approvalLevel-approvalId-challengeId
   */
  proposalId: string;

  /**
   * The quorum threshold as a percentage (0-100) of total possible weight that must vote "yes".
   * Example: 50 means 50% of total voter weight must vote yes for approval.
   */
  quorumThreshold: string | number;

  /**
   * List of voters with their weights. Each voter can cast a weighted vote.
   */
  voters: iVoter[];

  /**
   * The URI associated with this voting challenge.
   */
  uri?: string;

  /**
   * Arbitrary custom data associated with this voting challenge.
   */
  customData?: string;
}

/**
 * VoteProof represents a vote cast for a voting challenge.
 *
 * @category Interfaces
 */
export interface iVoteProof {
  /**
   * The proposal ID this vote is for.
   */
  proposalId: string;

  /**
   * The address of the voter casting the vote.
   */
  voter: string;

  /**
   * The percentage weight (0-100) allocated to "yes" vote.
   * The remaining percentage (100 - yesWeight) is allocated to "no" vote.
   * Example: yesWeight=70 means 70% yes, 30% no.
   */
  yesWeight: string | number;
}

/**
 * DynamicStore is a flexible storage object that can store arbitrary data.
 * It is identified by a unique ID assigned by the blockchain, which is a uint64 that increments.
 * Dynamic stores are created by users and can only be updated or deleted by their creator.
 * They provide a way to store custom data on-chain with proper access control.
 *
 * @category Interfaces
 */
export interface iDynamicStore {
  /**
   * The unique identifier for this dynamic store. This is assigned by the blockchain.
   */
  storeId: string | number;

  /**
   * The address of the creator of this dynamic store.
   */
  createdBy: string;

  /**
   * The default value for uninitialized addresses (true/false).
   */
  defaultValue: boolean;

  /**
   * Global kill switch state (defaults to true on creation, can be toggled via UpdateDynamicStore).
   * When false, all approvals using this store via DynamicStoreChallenge will fail immediately.
   */
  globalEnabled: boolean;

  /**
   * URI for additional metadata or resources associated with this dynamic store.
   */
  uri: string;

  /**
   * Custom data field for storing arbitrary data associated with this dynamic store.
   */
  customData: string;
}

/**
 * DynamicStoreValue stores a boolean value for a specific address in a dynamic store.
 * This allows the creator to set true/false values per address that can be checked during approval.
 *
 * @category Interfaces
 */
export interface iDynamicStoreValue {
  /**
   * The unique identifier for this dynamic store.
   */
  storeId: string | number;

  /**
   * The address for which this value is stored.
   */
  address: string;

  /**
   * The boolean value (true/false).
   */
  value: boolean;
}

/**
 * @category Interfaces
 */

/**
 * CollectionInvariants defines the invariants that apply to a collection.
 * These are set upon genesis and cannot be modified.
 *
 * @category Interfaces
 */
export interface iCollectionInvariants {
  /**
   * If true, all ownership times must be full ranges [{ start: 1, end: GoMaxUInt64 }].
   * This prevents time-based restrictions on token ownership.
   */
  noCustomOwnershipTimes: boolean;

  /**
   * Maximum supply per token ID. If set, no balance can exceed this amount.
   * This prevents any single token ID from having more than the specified supply.
   */
  maxSupplyPerId: string | number;

  /**
   * The IBC backed (sdk.coin) path for the collection. Only one path is allowed.
   */
  cosmosCoinBackedPath?: iCosmosCoinBackedPath;

  /**
   * If true, disallows any collection approvals that have overridesFromOutgoingApprovals or overridesToIncomingApprovals set to true.
   * This prevents forceful post-mint transfers that bypass user-level approvals.
   */
  noForcefulPostMintTransfers: boolean;

  /**
   * If true, disallows pool creation with this collection's assets.
   * When true, any attempt to create a pool with badges assets from this collection will fail.
   */
  disablePoolCreation: boolean;
}
