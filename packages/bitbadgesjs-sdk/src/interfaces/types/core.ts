//IMPORTANT: Keep all imports type-safe by using the `type` keyword. If not, this will mess up the circular dependency check.

import type { iPrecalculationOptions } from '@/api-indexer/docs-types/interfaces.js';
import type { BitBadgesAddress, iTokenMetadataDetails, iCollectionMetadataDetails } from '@/api-indexer/index.js';
import type { iMetadata } from '@/api-indexer/metadata/metadata.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iCosmosCoin } from '@/core/coin.js';

/**
 * @category Interfaces
 */
export interface iUintRange<T extends NumberType> {
  /**
   * The start of the range.
   */
  start: T;

  /**
   * The end of the range, inclusive.
   */
  end: T;
}

/**
 * @category Interfaces
 */
export interface iTokenMetadata<T extends NumberType> {
  /**
   * The URI where to fetch the token metadata from.
   */
  uri: string;

  /**
   * The token IDs corresponding to the URI.
   */
  tokenIds: iUintRange<T>[];

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
export interface iMustOwnTokens<T extends NumberType> {
  /**
   * The collection IDs to own.
   */
  collectionId: CollectionId;

  /**
   * The min/max acceptable amount of tokens that must be owned (can be any values, including 0-0).
   */
  amountRange: iUintRange<T>;

  /**
   * The range of the times that the tokens must be owned.
   */
  ownershipTimes: iUintRange<T>[];

  /**
   * The range of the token IDs that must be owned.
   */
  tokenIds: iUintRange<T>[];

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
export interface iBalance<T extends NumberType> {
  /**
   * The amount or balance of the owned token.
   */
  amount: T;

  /**
   * The token IDs corresponding to the balance.
   */
  tokenIds: iUintRange<T>[];

  /**
   * The times that the token is owned from.
   */
  ownershipTimes: iUintRange<T>[];
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
export interface iDenomUnit<T extends NumberType> {
  /** The number of decimal places for this denomination unit. */
  decimals: T;
  /** The symbol for this denomination unit. */
  symbol: string;
  /** Whether this denomination unit is the default display unit. */
  isDefaultDisplay: boolean;
}

/**
 * @category Interfaces
 */
export interface iDenomUnitWithDetails<T extends NumberType> extends iDenomUnit<T> {
  /** Optional metadata for this denomination unit. */
  metadata?: iMetadata<T>;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinWrapperPathAddObject<T extends NumberType> {
  /** The denom of the IBC wrapper path. */
  denom: string;

  /** The balances for this IBC wrapper path. */
  balances: iBalance<T>[];

  /** The symbol for this IBC wrapper path. */
  symbol: string;

  /** The denomination units for this IBC wrapper path. */
  denomUnits: iDenomUnit<T>[];

  /** Whether to allow override with any valid token. */
  allowOverrideWithAnyValidToken: boolean;

  /** Whether to allow cosmos wrapping. */
  allowCosmosWrapping: boolean;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinBackedPathAddObject<T extends NumberType> {
  /** The IBC denom of the backed path. */
  ibcDenom: string;

  /** The balances for this IBC backed path. */
  balances: iBalance<T>[];

  /** The IBC amount for this backed path. */
  ibcAmount: T;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinBackedPath<T extends NumberType> {
  /** The address for this IBC backed path. */
  address: string;

  /** The IBC denom of the backed path. */
  ibcDenom: string;

  /** The balances for this IBC backed path. */
  balances: iBalance<T>[];

  /** The IBC amount for this backed path. */
  ibcAmount: T;
}

/**
 * InvariantsAddObject is used for adding invariants without specifying addresses.
 * Addresses are generated by the keeper and stored in the collection.
 *
 * @category Interfaces
 */
export interface iInvariantsAddObject<T extends NumberType> {
  /**
   * If true, all ownership times must be full ranges [{ start: 1, end: GoMaxUInt64 }].
   * This prevents time-based restrictions on token ownership.
   */
  noCustomOwnershipTimes: boolean;

  /**
   * Maximum supply per token ID. If set, no balance can exceed this amount.
   * This prevents any single token ID from having more than the specified supply.
   */
  maxSupplyPerId: T;

  /**
   * The IBC backed (sdk.coin) path for the collection. Only one path is allowed.
   * Address will be generated by the keeper.
   */
  cosmosCoinBackedPath?: iCosmosCoinBackedPathAddObject<T>;

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
export interface iTransfer<T extends NumberType> {
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
  balances: iBalance<T>[];

  /**
   * If specified, we will precalculate from this approval and override the balances. This can only be used when the specified approval has predeterminedBalances set.
   */
  precalculateBalancesFromApproval?: iApprovalIdentifierDetails<T>;

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
  prioritizedApprovals?: iApprovalIdentifierDetails<T>[];

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

  /**
   * The precalculation options for the transfer.
   */
  precalculationOptions?: iPrecalculationOptions<T>;
}

/**
 * @category Interfaces
 */
export interface iApprovalIdentifierDetails<T extends NumberType> {
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
  version: T;
}

/**
 * @category Interfaces
 */
export interface iCoinTransfer<T extends NumberType> {
  /**
   * The recipient of the coin transfer. This should be a Bech32 BitBadges address.
   */
  to: BitBadgesAddress;
  /**
   * The coins
   */
  coins: iCosmosCoin<T>[];
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
export interface iAmountTrackerIdDetails<T extends NumberType> {
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
export interface iMustOwnToken<T extends NumberType> {
  /**
   * The ID of the collection.
   */
  collectionId: CollectionId;

  /**
   * The range of amounts the user must own (min to max).
   */
  amountRange: iUintRange<T>;

  /**
   * The time ranges during which the user must own the tokens.
   */
  ownershipTimes: iUintRange<T>[];

  /**
   * The token IDs the user must own.
   */
  tokenIds: iUintRange<T>[];

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
export interface iMerkleChallenge<T extends NumberType> {
  /**
   * The root of the merkle tree.
   */
  root: string;

  /**
   * The expected proof length of the merkle proof.
   */
  expectedProofLength: T;

  /**
   * Whether or not to override any leaf value and use the creator address as the leaf. Used for whitelist trees.
   */
  useCreatorAddressAsLeaf: boolean;

  /**
   * Whether or not to enforce max uses per leaf. Used to prevent replay attacks.
   */
  maxUsesPerLeaf: T;

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
export interface iTimelineItem<T extends NumberType> {
  /**
   * The times of the timeline item. Times in a timeline cannot overlap.
   */
  timelineTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iManagerTimeline<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The manager of the collection.
   */
  manager: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iCollectionMetadataTimeline<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The collection metadata.
   */
  collectionMetadata: iCollectionMetadata;
}

/**
 * @category Interfaces
 */
export interface iCollectionMetadataTimelineWithDetails<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The collection metadata, with off-chain details populated.
   */
  collectionMetadata: iCollectionMetadataDetails<T>;
}

/**
 * @category Interfaces
 */
export interface iTokenMetadataTimeline<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The token metadata.
   */
  tokenMetadata: iTokenMetadata<T>[];
}

/**
 * @category Interfaces
 */
export interface iTokenMetadataTimelineWithDetails<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The token metadata, with off-chain details populated.
   */
  tokenMetadata: iTokenMetadataDetails<T>[];
}

/**
 * @category Interfaces
 */
export interface iCustomDataTimeline<T extends NumberType> extends iTimelineItem<T> {
  /**
   * Arbitrary custom data.
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iStandardsTimeline<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The standards.
   */
  standards: string[];
}

/**
 * @category Interfaces
 */
export interface iIsArchivedTimeline<T extends NumberType> extends iTimelineItem<T> {
  /**
   * Whether the collection is archived.
   */
  isArchived: boolean;
}

/**
 * CollectionInvariants defines the invariants that apply to a collection.
 * These are set upon genesis and cannot be modified.
 *
 * @category Interfaces
 */
export interface iCollectionInvariants<T extends NumberType> {
  /**
   * If true, all ownership times must be full ranges [{ start: 1, end: GoMaxUInt64 }].
   * This prevents time-based restrictions on token ownership.
   */
  noCustomOwnershipTimes: boolean;

  /**
   * Maximum supply per token ID. If set, no balance can exceed this amount.
   * This prevents any single token ID from having more than the specified supply.
   */
  maxSupplyPerId: T;

  /**
   * The IBC backed (sdk.coin) path for the collection. Only one path is allowed.
   */
  cosmosCoinBackedPath?: iCosmosCoinBackedPath<T>;

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
