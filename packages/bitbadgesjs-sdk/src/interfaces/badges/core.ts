//IMPORTANT: Keep all imports type-safe by using the `type` keyword. If not, this will mess up the circular dependency check.

import type { iPrecalculationOptions } from '@/api-indexer/docs/interfaces.js';
import type { BitBadgesAddress, iBadgeMetadataDetails, iCollectionMetadataDetails } from '@/api-indexer/index.js';
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
export interface iBadgeMetadata<T extends NumberType> {
  /**
   * The URI where to fetch the badge metadata from.
   */
  uri: string;

  /**
   * The badge IDs corresponding to the URI.
   */
  badgeIds: iUintRange<T>[];

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
export interface iOffChainBalancesMetadata {
  /**
   * The URI where to fetch the off-chain balances metadata from.
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
export interface iMustOwnBadges<T extends NumberType> {
  /**
   * The collection ID of the badges to own.
   */
  collectionId: CollectionId;

  /**
   * The min/max acceptable amount of badges that must be owned (can be any values, including 0-0).
   */
  amountRange: iUintRange<T>;

  /**
   * The range of the times that the badges must be owned.
   */
  ownershipTimes: iUintRange<T>[];

  /**
   * The range of the badge IDs that must be owned.
   */
  badgeIds: iUintRange<T>[];

  /**
   * Whether or not to override the ownershipTimes with the current time.
   */
  overrideWithCurrentTime: boolean;

  /**
   * Whether or not the user must own all the specified badges. If false, we will accept if they meet criteria for at least one badge.
   */
  mustSatisfyForAllAssets: boolean;
}

/**
 * @category Interfaces
 */
export interface iBalance<T extends NumberType> {
  /**
   * The amount or balance of the owned badge.
   */
  amount: T;

  /**
   * The badge IDs corresponding to the balance.
   */
  badgeIds: iUintRange<T>[];

  /**
   * The times that the badge is owned from.
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

  /**
   * The affiliate address for the transfer.
   */
  affiliateAddress?: BitBadgesAddress;

  /**
   * The number of times to attempt approval validation. If 0 / not specified, we default to only one.
   */
  numAttempts?: T;
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
export interface iMustOwnBadge<T extends NumberType> {
  /**
   * The ID of the badge collection.
   */
  collectionId: CollectionId;

  /**
   * The range of badge amounts the user must own (min to max).
   */
  amountRange: iUintRange<T>;

  /**
   * The time ranges during which the user must own the badges.
   */
  ownershipTimes: iUintRange<T>[];

  /**
   * The badge IDs the user must own.
   */
  badgeIds: iUintRange<T>[];

  /**
   * If true, override ownershipTimes with the current time.
   */
  overrideWithCurrentTime: boolean;

  /**
   * If true, the user must meet ownership requirements for all specified badges; else, must meet requirements for any single badge.
   */
  mustSatisfyForAllAssets: boolean;
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
export interface iBadgeMetadataTimeline<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The badge metadata.
   */
  badgeMetadata: iBadgeMetadata<T>[];
}

/**
 * @category Interfaces
 */
export interface iBadgeMetadataTimelineWithDetails<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The badge metadata, with off-chain details populated.
   */
  badgeMetadata: iBadgeMetadataDetails<T>[];
}

/**
 * @category Interfaces
 */
export interface iOffChainBalancesMetadataTimeline<T extends NumberType> extends iTimelineItem<T> {
  /**
   * The off-chain balances metadata.
   */
  offChainBalancesMetadata: iOffChainBalancesMetadata;
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
