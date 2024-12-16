import type { BitBadgesAddress, iUpdateHistory, UNIXMilliTimestamp } from '@/api-indexer/docs/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, CustomTypeClass, deepCopyPrimitives } from '@/common/base.js';
import type {
  iAmountTrackerIdDetails,
  iApprovalIdentifierDetails,
  iBadgeMetadata,
  iBadgeMetadataTimeline,
  iBadgeMetadataTimelineWithDetails,
  iCoinTransfer,
  iCollectionMetadata,
  iCollectionMetadataTimeline,
  iCollectionMetadataTimelineWithDetails,
  iCustomDataTimeline,
  iIsArchivedTimeline,
  iManagerTimeline,
  iMerkleChallenge,
  iMerklePathItem,
  iMerkleProof,
  iMustOwnBadges,
  iOffChainBalancesMetadata,
  iOffChainBalancesMetadataTimeline,
  iStandardsTimeline,
  iTimelineItem,
  iZkProof,
  iZkProofSolution
} from '../interfaces/badges/core.js';
import * as badges from '../proto/badges/index.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers.js';
import { AddressList } from './addressLists.js';
import { CosmosCoin } from './coin.js';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps.js';
import { GetFirstMatchOnly, getOverlapsAndNonOverlaps } from './overlaps.js';
import { TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission } from './permissions.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { AllDefaultValues, getPotentialUpdatesForTimelineValues, getUpdateCombinationsToCheck } from './validate-utils.js';
import { BadgeMetadataDetails, CollectionMetadataDetails } from '@/api-indexer/metadata/badgeMetadata.js';

/**
 * BadgeMetadata is used to represent the metadata for a range of badge IDs.
 * The metadata can be hosted via a URI (via uri) or stored on-chain (via customData).
 *
 * We take first-match only for the badge IDs.
 * If a badge ID is in multiple BadgeMetadata, we take the first match in a linear search.
 *
 * @category Collections
 */
export class BadgeMetadata<T extends NumberType> extends BaseNumberTypeClass<BadgeMetadata<T>> implements iBadgeMetadata<T> {
  uri: string;
  badgeIds: UintRangeArray<T>;
  customData: string;

  constructor(badgeMetadata: iBadgeMetadata<T>) {
    super();
    this.uri = badgeMetadata.uri;
    this.badgeIds = UintRangeArray.From(badgeMetadata.badgeIds);
    this.customData = badgeMetadata.customData;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BadgeMetadata<U> {
    return new BadgeMetadata<U>(
      deepCopyPrimitives({
        uri: this.uri,
        badgeIds: this.badgeIds.map((b) => b.convert(convertFunction)),
        customData: this.customData
      })
    );
  }

  toProto(): badges.BadgeMetadata {
    return new badges.BadgeMetadata({
      uri: this.uri,
      badgeIds: this.badgeIds.map((b) => b.toProto()),
      customData: this.customData
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): BadgeMetadata<U> {
    return BadgeMetadata.fromProto(badges.BadgeMetadata.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): BadgeMetadata<U> {
    return BadgeMetadata.fromProto(badges.BadgeMetadata.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.BadgeMetadata, convertFunction: (item: NumberType) => U): BadgeMetadata<U> {
    return new BadgeMetadata<U>({
      uri: item.uri,
      badgeIds: item.badgeIds.map((b) => UintRange.fromProto(b, convertFunction)),
      customData: item.customData
    });
  }

  /**
   * Get first matches for the badge metadata (i.e. if there are duplicated badge IDs, we take the first match in a linear search).
   */
  static getFirstMatches<T extends NumberType>(badgeMetadata: BadgeMetadata<T>[]): BadgeMetadata<T>[] {
    const metadataArr = badgeMetadata.map((b) => b.clone());
    for (let i = 0; i < metadataArr.length; i++) {
      const metadata = metadataArr[i];
      for (let j = i + 1; j < metadataArr.length; j++) {
        const otherMetadata = metadataArr[j];
        otherMetadata.badgeIds.remove(metadata.badgeIds);
      }
    }

    return metadataArr;
  }
}

/**
 * CollectionMetadata represents the metadata of the collection
 *
 * @category Collections
 */
export class CollectionMetadata extends CustomTypeClass<CollectionMetadata> implements iCollectionMetadata {
  uri: string;
  customData: string;

  constructor(collectionMetadata: iCollectionMetadata) {
    super();
    this.uri = collectionMetadata.uri;
    this.customData = collectionMetadata.customData;
  }

  toProto(): badges.CollectionMetadata {
    return new badges.CollectionMetadata({
      uri: this.uri,
      customData: this.customData
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CollectionMetadata {
    return CollectionMetadata.fromProto(badges.CollectionMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CollectionMetadata {
    return CollectionMetadata.fromProto(badges.CollectionMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(item: badges.CollectionMetadata): CollectionMetadata {
    return new CollectionMetadata({
      uri: item.uri,
      customData: item.customData
    });
  }
}

/**
 * OffChainBalancesMetadata represents the metadata of the off-chain balances
 *
 * @category Balances
 */
export class OffChainBalancesMetadata extends CustomTypeClass<OffChainBalancesMetadata> implements OffChainBalancesMetadata {
  uri: string;
  customData: string;

  constructor(offChainBalancesMetadata: iOffChainBalancesMetadata) {
    super();
    this.uri = offChainBalancesMetadata.uri;
    this.customData = offChainBalancesMetadata.customData;
  }

  toProto(): badges.OffChainBalancesMetadata {
    return new badges.OffChainBalancesMetadata({
      uri: this.uri,
      customData: this.customData
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OffChainBalancesMetadata {
    return OffChainBalancesMetadata.fromProto(badges.OffChainBalancesMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OffChainBalancesMetadata {
    return OffChainBalancesMetadata.fromProto(badges.OffChainBalancesMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(item: badges.OffChainBalancesMetadata): OffChainBalancesMetadata {
    return new OffChainBalancesMetadata({
      uri: item.uri,
      customData: item.customData
    });
  }
}

/**
 * MustOwnBadges are used to represent a challenge for an approved transfer where a user
 * must own min-max (amountRange) of the badges (badgeIds) from a specific collection (collectionId)
 * to be able to transfer the badges and be approved.
 *
 * @category Approvals / Transferability
 */
export class MustOwnBadges<T extends NumberType> extends BaseNumberTypeClass<MustOwnBadges<T>> implements iMustOwnBadges<T> {
  collectionId: T;
  amountRange: UintRange<T>;
  ownershipTimes: UintRangeArray<T>;
  badgeIds: UintRangeArray<T>;
  overrideWithCurrentTime: boolean;
  mustSatisfyForAllAssets: boolean;

  constructor(mustOwn: iMustOwnBadges<T>) {
    super();
    this.collectionId = mustOwn.collectionId;
    this.amountRange = new UintRange(mustOwn.amountRange);
    this.ownershipTimes = UintRangeArray.From(mustOwn.ownershipTimes);
    this.badgeIds = UintRangeArray.From(mustOwn.badgeIds);
    this.overrideWithCurrentTime = mustOwn.overrideWithCurrentTime;
    this.mustSatisfyForAllAssets = mustOwn.mustSatisfyForAllAssets;
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MustOwnBadges<U> {
    return new MustOwnBadges<U>(
      deepCopyPrimitives({
        collectionId: convertFunction(this.collectionId),
        amountRange: this.amountRange.convert(convertFunction),
        ownershipTimes: this.ownershipTimes.map((b) => b.convert(convertFunction)),
        badgeIds: this.badgeIds.map((b) => b.convert(convertFunction)),
        overrideWithCurrentTime: this.overrideWithCurrentTime,
        mustSatisfyForAllAssets: this.mustSatisfyForAllAssets
      })
    );
  }

  toProto(): badges.MustOwnBadges {
    return new badges.MustOwnBadges(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MustOwnBadges<U> {
    return MustOwnBadges.fromProto(badges.MustOwnBadges.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MustOwnBadges<U> {
    return MustOwnBadges.fromProto(badges.MustOwnBadges.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.MustOwnBadges, convertFunction: (item: NumberType) => U): MustOwnBadges<U> {
    if (!item.amountRange) {
      throw new Error('amountRange is required');
    }

    return new MustOwnBadges<U>({
      collectionId: convertFunction(BigInt(item.collectionId)),
      amountRange: UintRange.fromProto(item.amountRange, convertFunction),
      ownershipTimes: item.ownershipTimes.map((b) => UintRange.fromProto(b, convertFunction)),
      badgeIds: item.badgeIds.map((b) => UintRange.fromProto(b, convertFunction)),
      overrideWithCurrentTime: item.overrideWithCurrentTime,
      mustSatisfyForAllAssets: item.mustSatisfyForAllAssets
    });
  }
}

/**
 * @category Approvals / Transferability
 */
export class ZkProof extends CustomTypeClass<ZkProof> implements iZkProof {
  verificationKey: string;
  uri: string;
  customData: string;
  zkpTrackerId: string;

  constructor(zkProof: iZkProof) {
    super();
    this.verificationKey = zkProof.verificationKey;
    this.uri = zkProof.uri;
    this.zkpTrackerId = zkProof.zkpTrackerId;
    this.customData = zkProof.customData;
  }

  toProto(): badges.ZkProof {
    return new badges.ZkProof(this.clone().toJson());
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ZkProof {
    return ZkProof.fromProto(badges.ZkProof.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ZkProof {
    return ZkProof.fromProto(badges.ZkProof.fromJsonString(jsonString, options));
  }

  static fromProto(item: badges.ZkProof): ZkProof {
    return new ZkProof({ ...item });
  }
}

/**
 * @category Approvals / Transferability
 */
export class CoinTransfer<T extends NumberType> extends BaseNumberTypeClass<CoinTransfer<T>> implements iCoinTransfer<T> {
  to: BitBadgesAddress;
  coins: CosmosCoin<T>[];

  constructor(coinTransfer: iCoinTransfer<T>) {
    super();
    this.to = coinTransfer.to;
    this.coins = coinTransfer.coins.map((b) => new CosmosCoin(b));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CoinTransfer<U> {
    return new CoinTransfer<U>({
      to: this.to,
      coins: this.coins.map((b) => b.convert(convertFunction))
    });
  }

  toProto(): badges.CoinTransfer {
    return new badges.CoinTransfer(this.convert(Stringify));
  }

  static fromProto<U extends NumberType>(item: badges.CoinTransfer, convertFunction: (item: NumberType) => U): CoinTransfer<U> {
    return new CoinTransfer<U>({
      to: item.to,
      coins: item.coins.map((b) => CosmosCoin.fromProto(b, convertFunction))
    });
  }
}

/**
 * ZK proof solutions for proof approvals
 *
 * @category Approvals / Transferability
 */
export class ZkProofSolution extends CustomTypeClass<ZkProofSolution> implements iZkProofSolution {
  proof: string;
  publicInputs: string;

  constructor(zkProofSolution: iZkProofSolution) {
    super();
    this.proof = zkProofSolution.proof;
    this.publicInputs = zkProofSolution.publicInputs;
  }

  toProto(): badges.ZkProofSolution {
    return new badges.ZkProofSolution(this.clone().toJson());
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ZkProofSolution {
    return ZkProofSolution.fromProto(badges.ZkProofSolution.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ZkProofSolution {
    return ZkProofSolution.fromProto(badges.ZkProofSolution.fromJsonString(jsonString, options));
  }

  static fromProto(item: badges.ZkProofSolution): ZkProofSolution {
    return new ZkProofSolution({ ...item });
  }
}

/**
 * ApprovalIdentifierDetails is used to represent an exact approval.
 *
 * @category Approvals / Transferability
 */
export class ApprovalIdentifierDetails extends CustomTypeClass<ApprovalIdentifierDetails> implements ApprovalIdentifierDetails {
  approvalId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;

  constructor(approvalIdDetails: iApprovalIdentifierDetails) {
    super();
    this.approvalId = approvalIdDetails.approvalId;
    this.approvalLevel = approvalIdDetails.approvalLevel;
    this.approverAddress = approvalIdDetails.approverAddress;
  }

  static required(): ApprovalIdentifierDetails {
    return new ApprovalIdentifierDetails({
      approvalId: '',
      approvalLevel: '',
      approverAddress: ''
    });
  }

  toProto(): badges.ApprovalIdentifierDetails {
    return new badges.ApprovalIdentifierDetails(this.clone().toJson());
  }

  clone(): ApprovalIdentifierDetails {
    return new ApprovalIdentifierDetails({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ApprovalIdentifierDetails {
    return ApprovalIdentifierDetails.fromProto(badges.ApprovalIdentifierDetails.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ApprovalIdentifierDetails {
    return ApprovalIdentifierDetails.fromProto(badges.ApprovalIdentifierDetails.fromJsonString(jsonString, options));
  }

  static fromProto(item: badges.ApprovalIdentifierDetails): ApprovalIdentifierDetails {
    return new ApprovalIdentifierDetails({ ...item });
  }
}

/**
 * AmountTrackerIdDetails is used to represent an exact approval tracker ID.
 *
 * @category Approvals / Transferability
 */
export class AmountTrackerIdDetails<T extends NumberType>
  extends BaseNumberTypeClass<AmountTrackerIdDetails<T>>
  implements iAmountTrackerIdDetails<T>
{
  collectionId: T;
  amountTrackerId: string;
  approvalId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  trackerType: string;
  approvedAddress: BitBadgesAddress;

  constructor(approvalIdDetails: iAmountTrackerIdDetails<T>) {
    super();
    this.collectionId = approvalIdDetails.collectionId;
    this.amountTrackerId = approvalIdDetails.amountTrackerId;
    this.approvalLevel = approvalIdDetails.approvalLevel;
    this.approverAddress = approvalIdDetails.approverAddress;
    this.trackerType = approvalIdDetails.trackerType;
    this.approvedAddress = approvalIdDetails.approvedAddress;
    this.approvalId = approvalIdDetails.approvalId;
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AmountTrackerIdDetails<U> {
    return new AmountTrackerIdDetails<U>(
      deepCopyPrimitives({
        collectionId: convertFunction(this.collectionId),
        amountTrackerId: this.amountTrackerId,
        approvalLevel: this.approvalLevel,
        approverAddress: this.approverAddress,
        trackerType: this.trackerType,
        approvedAddress: this.approvedAddress,
        approvalId: this.approvalId
      })
    );
  }
}

/**
 * MerkleChallenge is used to represent a merkle challenge for an approval.
 *
 * @category Approvals / Transferability
 */
export class MerkleChallenge<T extends NumberType> extends BaseNumberTypeClass<MerkleChallenge<T>> implements iMerkleChallenge<T> {
  root: string;
  expectedProofLength: T;
  useCreatorAddressAsLeaf: boolean;
  maxUsesPerLeaf: T;
  uri: string;
  customData: string;
  challengeTrackerId: string;

  constructor(merkleChallenge: iMerkleChallenge<T>) {
    super();
    this.root = merkleChallenge.root;
    this.expectedProofLength = merkleChallenge.expectedProofLength;
    this.useCreatorAddressAsLeaf = merkleChallenge.useCreatorAddressAsLeaf;
    this.maxUsesPerLeaf = merkleChallenge.maxUsesPerLeaf;
    this.uri = merkleChallenge.uri;
    this.customData = merkleChallenge.customData;
    this.challengeTrackerId = merkleChallenge.challengeTrackerId;
  }

  static required(): MerkleChallenge<NumberType> {
    return new MerkleChallenge({
      root: '',
      expectedProofLength: 0,
      useCreatorAddressAsLeaf: false,
      maxUsesPerLeaf: 0,
      uri: '',
      customData: '',
      challengeTrackerId: ''
    });
  }

  getNumberFieldNames(): string[] {
    return ['expectedProofLength', 'maxUsesPerLeaf'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MerkleChallenge<U> {
    return new MerkleChallenge<U>(
      deepCopyPrimitives({
        root: this.root,
        expectedProofLength: convertFunction(this.expectedProofLength),
        useCreatorAddressAsLeaf: this.useCreatorAddressAsLeaf,
        maxUsesPerLeaf: convertFunction(this.maxUsesPerLeaf),
        uri: this.uri,
        customData: this.customData,
        challengeTrackerId: this.challengeTrackerId
      })
    );
  }

  toProto(): badges.MerkleChallenge {
    return new badges.MerkleChallenge(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MerkleChallenge<U> {
    return MerkleChallenge.fromProto(badges.MerkleChallenge.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MerkleChallenge<U> {
    return MerkleChallenge.fromProto(badges.MerkleChallenge.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.MerkleChallenge, convertFunction: (item: NumberType) => U): MerkleChallenge<U> {
    return new MerkleChallenge<U>({
      root: item.root,
      expectedProofLength: convertFunction(BigInt(item.expectedProofLength)),
      useCreatorAddressAsLeaf: item.useCreatorAddressAsLeaf,
      maxUsesPerLeaf: convertFunction(BigInt(item.maxUsesPerLeaf)),
      uri: item.uri,
      customData: item.customData,
      challengeTrackerId: item.challengeTrackerId
    });
  }
}

/**
 * MerklePathItem is used to represent a merkle path item.
 *
 * @category Approvals / Transferability
 */
export class MerklePathItem extends CustomTypeClass<MerklePathItem> {
  aunt: string;
  onRight: boolean;

  constructor(merklePathItem: iMerklePathItem) {
    super();
    this.aunt = merklePathItem.aunt;
    this.onRight = merklePathItem.onRight;
  }

  static required(): MerklePathItem {
    return new MerklePathItem({
      aunt: '',
      onRight: false
    });
  }

  toProto(): badges.MerklePathItem {
    return new badges.MerklePathItem(this.clone().toJson());
  }

  clone(): MerklePathItem {
    return new MerklePathItem({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MerklePathItem {
    return MerklePathItem.fromProto(badges.MerklePathItem.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MerklePathItem {
    return MerklePathItem.fromProto(badges.MerklePathItem.fromJsonString(jsonString, options));
  }

  static fromProto(item: badges.MerklePathItem): MerklePathItem {
    return new MerklePathItem({ ...item });
  }
}

/**
 * MerkleProof is used to represent a merkle proof.
 * The merkle proof is used to prove that a leaf is in a merkle tree.
 *
 * @category Approvals / Transferability
 */
export class MerkleProof extends CustomTypeClass<MerkleProof> implements MerkleProof {
  aunts: MerklePathItem[];
  leaf: string;

  constructor(merkleProof: iMerkleProof) {
    super();
    this.aunts = merkleProof.aunts.map((b) => new MerklePathItem(b));
    this.leaf = merkleProof.leaf;
  }

  static required(): MerkleProof {
    return new MerkleProof({
      aunts: [],
      leaf: ''
    });
  }

  toProto(): badges.MerkleProof {
    return new badges.MerkleProof(this.clone().toJson());
  }

  clone(): MerkleProof {
    return new MerkleProof({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MerkleProof {
    return MerkleProof.fromProto(badges.MerkleProof.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MerkleProof {
    return MerkleProof.fromProto(badges.MerkleProof.fromJsonString(jsonString, options));
  }

  static fromProto(item: badges.MerkleProof): MerkleProof {
    return new MerkleProof({
      aunts: item.aunts.map((b) => MerklePathItem.fromProto(b)),
      leaf: item.leaf
    });
  }
}

/**
 * Base type for the timeline types in the collection interface.
 *
 * @category Timelines
 */
export class TimelineItem<T extends NumberType> extends BaseNumberTypeClass<TimelineItem<T>> {
  timelineTimes: UintRangeArray<T>;

  constructor(timelineItem: iTimelineItem<T>) {
    super();
    this.timelineTimes = UintRangeArray.From(timelineItem.timelineTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): TimelineItem<U> {
    return new TimelineItem<U>(
      deepCopyPrimitives({
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }
}

/**
 * ManagerTimeline represents the value of the manager over time
 *
 * @category Timelines
 */
export class ManagerTimeline<T extends NumberType> extends BaseNumberTypeClass<ManagerTimeline<T>> implements iManagerTimeline<T> {
  manager: BitBadgesAddress;
  timelineTimes: UintRangeArray<T>;

  constructor(managerTimeline: iManagerTimeline<T>) {
    super();
    this.manager = managerTimeline.manager;
    this.timelineTimes = UintRangeArray.From(managerTimeline.timelineTimes);
  }

  static required(): ManagerTimeline<NumberType> {
    return new ManagerTimeline({
      manager: '',
      timelineTimes: []
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ManagerTimeline<U> {
    return new ManagerTimeline<U>(
      deepCopyPrimitives({
        manager: this.manager,
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.ManagerTimeline {
    return new badges.ManagerTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ManagerTimeline<U> {
    return ManagerTimeline.fromProto(badges.ManagerTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ManagerTimeline<U> {
    return ManagerTimeline.fromProto(badges.ManagerTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.ManagerTimeline, convertFunction: (item: NumberType) => U): ManagerTimeline<U> {
    return new ManagerTimeline<U>({
      manager: item.manager,
      timelineTimes: item.timelineTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  /**
   * Wrapper for {@link validateManagerUpdate}
   */
  static validateUpdate<T extends NumberType>(
    oldManager: ManagerTimeline<T>[],
    newManager: ManagerTimeline<T>[],
    canUpdateManager: TimedUpdatePermission<T>[]
  ): Error | null {
    return validateManagerUpdate(
      oldManager.map((b) => b.convert(BigIntify)),
      newManager.map((b) => b.convert(BigIntify)),
      canUpdateManager.map((b) => b.convert(BigIntify))
    );
  }
}

/**
 * @category Timelines
 */
export class CollectionMetadataTimelineWithDetails<T extends NumberType>
  extends BaseNumberTypeClass<CollectionMetadataTimelineWithDetails<T>>
  implements iCollectionMetadataTimelineWithDetails<T>
{
  collectionMetadata: CollectionMetadataDetails<T>;
  timelineTimes: UintRangeArray<T>;

  constructor(collectionMetadataTimeline: iCollectionMetadataTimelineWithDetails<T>) {
    super();
    this.collectionMetadata = new CollectionMetadataDetails(collectionMetadataTimeline.collectionMetadata);
    this.timelineTimes = UintRangeArray.From(collectionMetadataTimeline.timelineTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionMetadataTimelineWithDetails<U> {
    return new CollectionMetadataTimelineWithDetails<U>(
      deepCopyPrimitives({
        collectionMetadata: this.collectionMetadata.convert(convertFunction),
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.CollectionMetadataTimeline {
    return new badges.CollectionMetadataTimeline(this.convert(Stringify));
  }
}

/**
 * CollectionMetadataTimeline represents the value of the collection metadata over time
 *
 * @category Timelines
 */
export class CollectionMetadataTimeline<T extends NumberType>
  extends BaseNumberTypeClass<CollectionMetadataTimeline<T>>
  implements iCollectionMetadataTimeline<T>
{
  collectionMetadata: CollectionMetadata;
  timelineTimes: UintRangeArray<T>;

  constructor(collectionMetadataTimeline: iCollectionMetadataTimeline<T>) {
    super();
    this.collectionMetadata = new CollectionMetadata(collectionMetadataTimeline.collectionMetadata);
    this.timelineTimes = UintRangeArray.From(collectionMetadataTimeline.timelineTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionMetadataTimeline<U> {
    return new CollectionMetadataTimeline<U>(
      deepCopyPrimitives({
        collectionMetadata: this.collectionMetadata,
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.CollectionMetadataTimeline {
    return new badges.CollectionMetadataTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionMetadataTimeline<U> {
    return CollectionMetadataTimeline.fromProto(badges.CollectionMetadataTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionMetadataTimeline<U> {
    return CollectionMetadataTimeline.fromProto(badges.CollectionMetadataTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: badges.CollectionMetadataTimeline,
    convertFunction: (item: NumberType) => U
  ): CollectionMetadataTimeline<U> {
    if (item.collectionMetadata === undefined) {
      throw new Error('CollectionMetadataTimeline: invalid collectionMetadata');
    }

    return new CollectionMetadataTimeline<U>({
      collectionMetadata: CollectionMetadata.fromProto(item.collectionMetadata),
      timelineTimes: item.timelineTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  /**
   * Wrapper for {@link validateCollectionMetadataUpdate}
   */
  static validateUpdate<T extends NumberType>(
    oldCollectionMetadata: CollectionMetadataTimeline<T>[],
    newCollectionMetadata: CollectionMetadataTimeline<T>[],
    canUpdateCollectionMetadata: TimedUpdatePermission<T>[]
  ): Error | null {
    return validateCollectionMetadataUpdate(
      oldCollectionMetadata.map((b) => b.convert(BigIntify)),
      newCollectionMetadata.map((b) => b.convert(BigIntify)),
      canUpdateCollectionMetadata.map((b) => b.convert(BigIntify))
    );
  }
}

/**
 * @category Timelines
 */
export class BadgeMetadataTimelineWithDetails<T extends NumberType>
  extends BaseNumberTypeClass<BadgeMetadataTimelineWithDetails<T>>
  implements iBadgeMetadataTimelineWithDetails<T>
{
  badgeMetadata: BadgeMetadataDetails<T>[];
  timelineTimes: UintRangeArray<T>;

  constructor(badgeMetadataTimeline: iBadgeMetadataTimelineWithDetails<T>) {
    super();
    this.timelineTimes = UintRangeArray.From(badgeMetadataTimeline.timelineTimes);
    this.badgeMetadata = badgeMetadataTimeline.badgeMetadata.map((b) => new BadgeMetadataDetails(b));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): BadgeMetadataTimelineWithDetails<U> {
    return new BadgeMetadataTimelineWithDetails<U>(
      deepCopyPrimitives({
        badgeMetadata: this.badgeMetadata.map((b) => b.convert(convertFunction)),
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.BadgeMetadataTimeline {
    return new badges.BadgeMetadataTimeline(this.convert(Stringify));
  }
}

/**
 * BadgeMetadataTimeline represents the value of the badge metadata over time
 *
 * @category Timelines
 */
export class BadgeMetadataTimeline<T extends NumberType> extends BaseNumberTypeClass<BadgeMetadataTimeline<T>> implements iBadgeMetadataTimeline<T> {
  badgeMetadata: BadgeMetadata<T>[];
  timelineTimes: UintRangeArray<T>;

  constructor(badgeMetadataTimeline: iBadgeMetadataTimeline<T>) {
    super();
    this.timelineTimes = UintRangeArray.From(badgeMetadataTimeline.timelineTimes);
    this.badgeMetadata = badgeMetadataTimeline.badgeMetadata.map((b) => new BadgeMetadata(b));
  }

  static required(): BadgeMetadataTimeline<NumberType> {
    return new BadgeMetadataTimeline({
      badgeMetadata: [],
      timelineTimes: []
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BadgeMetadataTimeline<U> {
    return new BadgeMetadataTimeline<U>(
      deepCopyPrimitives({
        badgeMetadata: this.badgeMetadata.map((b) => b.convert(convertFunction)),
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.BadgeMetadataTimeline {
    return new badges.BadgeMetadataTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): BadgeMetadataTimeline<U> {
    return BadgeMetadataTimeline.fromProto(badges.BadgeMetadataTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): BadgeMetadataTimeline<U> {
    return BadgeMetadataTimeline.fromProto(badges.BadgeMetadataTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.BadgeMetadataTimeline, convertFunction: (item: NumberType) => U): BadgeMetadataTimeline<U> {
    return new BadgeMetadataTimeline<U>({
      badgeMetadata: item.badgeMetadata.map((b) => BadgeMetadata.fromProto(b, convertFunction)),
      timelineTimes: item.timelineTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  /**
   * Wrapper for {@link validateBadgeMetadataUpdate}
   */
  static validateUpdate<T extends NumberType>(
    oldBadgeMetadata: BadgeMetadataTimeline<T>[],
    newBadgeMetadata: BadgeMetadataTimeline<T>[],
    canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermission<T>[]
  ): Error | null {
    return validateBadgeMetadataUpdate(
      oldBadgeMetadata.map((b) => b.convert(BigIntify)),
      newBadgeMetadata.map((b) => b.convert(BigIntify)),
      canUpdateBadgeMetadata.map((b) => b.convert(BigIntify))
    );
  }
}

/**
 * OffChainBalancesMetadataTimeline represents the value of the off-chain balances metadata over time
 *
 * @category Timelines
 */
export class OffChainBalancesMetadataTimeline<T extends NumberType>
  extends BaseNumberTypeClass<OffChainBalancesMetadataTimeline<T>>
  implements iOffChainBalancesMetadataTimeline<T>
{
  offChainBalancesMetadata: OffChainBalancesMetadata;
  timelineTimes: UintRangeArray<T>;

  constructor(offChainBalancesMetadataTimeline: iOffChainBalancesMetadataTimeline<T>) {
    super();
    this.offChainBalancesMetadata = new OffChainBalancesMetadata(offChainBalancesMetadataTimeline.offChainBalancesMetadata);
    this.timelineTimes = UintRangeArray.From(offChainBalancesMetadataTimeline.timelineTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): OffChainBalancesMetadataTimeline<U> {
    return new OffChainBalancesMetadataTimeline<U>(
      deepCopyPrimitives({
        offChainBalancesMetadata: this.offChainBalancesMetadata,
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.OffChainBalancesMetadataTimeline {
    return new badges.OffChainBalancesMetadataTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): OffChainBalancesMetadataTimeline<U> {
    return OffChainBalancesMetadataTimeline.fromProto(badges.OffChainBalancesMetadataTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): OffChainBalancesMetadataTimeline<U> {
    return OffChainBalancesMetadataTimeline.fromProto(badges.OffChainBalancesMetadataTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: badges.OffChainBalancesMetadataTimeline,
    convertFunction: (item: NumberType) => U
  ): OffChainBalancesMetadataTimeline<U> {
    if (!item.offChainBalancesMetadata) {
      throw new Error('OffChainBalancesMetadataTimeline: offChainBalancesMetadata is required');
    }

    return new OffChainBalancesMetadataTimeline<U>({
      offChainBalancesMetadata: OffChainBalancesMetadata.fromProto(item.offChainBalancesMetadata),
      timelineTimes: item.timelineTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  /**
   * Wrapper for {@link validateOffChainBalancesMetadataUpdate}
   */
  static validateUpdate<T extends NumberType>(
    oldOffChainBalancesMetadata: OffChainBalancesMetadataTimeline<T>[],
    newOffChainBalancesMetadata: OffChainBalancesMetadataTimeline<T>[],
    canUpdateOffChainBalancesMetadata: TimedUpdatePermission<T>[]
  ): Error | null {
    return validateOffChainBalancesMetadataUpdate(
      oldOffChainBalancesMetadata.map((b) => b.convert(BigIntify)),
      newOffChainBalancesMetadata.map((b) => b.convert(BigIntify)),
      canUpdateOffChainBalancesMetadata.map((b) => b.convert(BigIntify))
    );
  }
}

/**
 * CustomDataTimeline represents the value of some arbitrary custom data over time
 *
 * @category Timelines
 */
export class CustomDataTimeline<T extends NumberType> extends BaseNumberTypeClass<CustomDataTimeline<T>> implements iCustomDataTimeline<T> {
  customData: string;
  timelineTimes: UintRangeArray<T>;

  constructor(customDataTimeline: iCustomDataTimeline<T>) {
    super();
    this.customData = customDataTimeline.customData;
    this.timelineTimes = UintRangeArray.From(customDataTimeline.timelineTimes);
  }

  static required(): CustomDataTimeline<NumberType> {
    return new CustomDataTimeline({
      customData: '',
      timelineTimes: []
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CustomDataTimeline<U> {
    return new CustomDataTimeline<U>(
      deepCopyPrimitives({
        customData: this.customData,
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.CustomDataTimeline {
    return new badges.CustomDataTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CustomDataTimeline<U> {
    return CustomDataTimeline.fromProto(badges.CustomDataTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CustomDataTimeline<U> {
    return CustomDataTimeline.fromProto(badges.CustomDataTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.CustomDataTimeline, convertFunction: (item: NumberType) => U): CustomDataTimeline<U> {
    return new CustomDataTimeline<U>({
      customData: item.customData,
      timelineTimes: item.timelineTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  /**
   * Wrapper for {@link validateCustomDataUpdate}
   */
  static validateUpdate<T extends NumberType>(
    oldCustomData: CustomDataTimeline<T>[],
    newCustomData: CustomDataTimeline<T>[],
    canUpdateCustomData: TimedUpdatePermission<T>[]
  ): Error | null {
    return validateCustomDataUpdate(
      oldCustomData.map((b) => b.convert(BigIntify)),
      newCustomData.map((b) => b.convert(BigIntify)),
      canUpdateCustomData.map((b) => b.convert(BigIntify))
    );
  }
}

/**
 * StandardsTimeline represents the value of the standards over time
 *
 * @category Timelines
 */
export class StandardsTimeline<T extends NumberType> extends BaseNumberTypeClass<StandardsTimeline<T>> implements iStandardsTimeline<T> {
  standards: string[];
  timelineTimes: UintRangeArray<T>;

  constructor(standardsTimeline: iStandardsTimeline<T>) {
    super();
    this.standards = standardsTimeline.standards;
    this.timelineTimes = UintRangeArray.From(standardsTimeline.timelineTimes);
  }

  static required(): StandardsTimeline<NumberType> {
    return new StandardsTimeline({
      standards: [],
      timelineTimes: []
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): StandardsTimeline<U> {
    return new StandardsTimeline<U>(
      deepCopyPrimitives({
        standards: this.standards,
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.StandardsTimeline {
    return new badges.StandardsTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): StandardsTimeline<U> {
    return StandardsTimeline.fromProto(badges.StandardsTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): StandardsTimeline<U> {
    return StandardsTimeline.fromProto(badges.StandardsTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.StandardsTimeline, convertFunction: (item: NumberType) => U): StandardsTimeline<U> {
    return new StandardsTimeline<U>({
      standards: item.standards,
      timelineTimes: item.timelineTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  /**
   * Wrapper for {@link validateStandardsUpdate}
   */
  static validateUpdate<T extends NumberType>(
    oldStandards: StandardsTimeline<T>[],
    newStandards: StandardsTimeline<T>[],
    canUpdateStandards: TimedUpdatePermission<T>[]
  ): Error | null {
    return validateStandardsUpdate(
      oldStandards.map((b) => b.convert(BigIntify)),
      newStandards.map((b) => b.convert(BigIntify)),
      canUpdateStandards.map((b) => b.convert(BigIntify))
    );
  }
}

/**
 * IsArchivedTimeline represents the value of isArchived over time
 *
 * @category Timelines
 */
export class IsArchivedTimeline<T extends NumberType> extends BaseNumberTypeClass<IsArchivedTimeline<T>> implements iIsArchivedTimeline<T> {
  isArchived: boolean;
  timelineTimes: UintRangeArray<T>;

  constructor(isArchivedTimeline: iIsArchivedTimeline<T>) {
    super();
    this.isArchived = isArchivedTimeline.isArchived;
    this.timelineTimes = UintRangeArray.From(isArchivedTimeline.timelineTimes);
  }

  static required(): IsArchivedTimeline<NumberType> {
    return new IsArchivedTimeline({
      isArchived: false,
      timelineTimes: []
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): IsArchivedTimeline<U> {
    return new IsArchivedTimeline<U>(
      deepCopyPrimitives({
        isArchived: this.isArchived,
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.IsArchivedTimeline {
    return new badges.IsArchivedTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IsArchivedTimeline<U> {
    return IsArchivedTimeline.fromProto(badges.IsArchivedTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IsArchivedTimeline<U> {
    return IsArchivedTimeline.fromProto(badges.IsArchivedTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.IsArchivedTimeline, convertFunction: (item: NumberType) => U): IsArchivedTimeline<U> {
    return new IsArchivedTimeline<U>({
      isArchived: item.isArchived,
      timelineTimes: item.timelineTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  /**
   * Wrapper for {@link validateIsArchivedUpdate}
   */
  static validateUpdate<T extends NumberType>(
    oldIsArchived: IsArchivedTimeline<T>[],
    newIsArchived: IsArchivedTimeline<T>[],
    canArchiveCollection: TimedUpdatePermission<T>[]
  ): Error | null {
    return validateIsArchivedUpdate(
      oldIsArchived.map((b) => b.convert(BigIntify)),
      newIsArchived.map((b) => b.convert(BigIntify)),
      canArchiveCollection.map((b) => b.convert(BigIntify))
    );
  }
}

/**
 * Validates a state transition (old to new) for the timeline, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateIsArchivedUpdate<T extends NumberType>(
  oldIsArchived: IsArchivedTimeline<T>[],
  newIsArchived: IsArchivedTimeline<T>[],
  canArchiveCollection: TimedUpdatePermission<T>[]
): Error | null {
  const { times: oldTimes, values: oldValues } = getIsArchivedTimesAndValues(oldIsArchived.map((b) => b.convert(BigIntify)));
  const { times: newTimes, values: newValues } = getIsArchivedTimesAndValues(newIsArchived.map((b) => b.convert(BigIntify)));

  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  const updatedTimelineTimes = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, false, getUpdatedBoolCombinations);
  const details = UintRangeArray.From(updatedTimelineTimes.map((x) => x.timelineTime));

  return TimedUpdatePermission.check(
    details,
    canArchiveCollection.map((b) => b.convert(BigIntify))
  );
}

const castBadgeMetadataToUniversalPermission = <T extends NumberType>(badgeMetadata: BadgeMetadata<T>[]): UniversalPermission[] => {
  if (badgeMetadata.length === 0) {
    return [];
  }

  const castedPermissions: UniversalPermission[] = [];
  for (const metadata of badgeMetadata) {
    castedPermissions.push({
      ...AllDefaultValues,
      badgeIds: metadata.badgeIds.convert(BigIntify),
      usesBadgeIds: true,
      arbitraryValue: metadata.uri + '<><><>' + metadata.customData
    });
  }
  return castedPermissions;
};

/**
 * Validates a state transition (old to new) for the timeline, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateBadgeMetadataUpdate<T extends NumberType>(
  oldBadgeMetadata: BadgeMetadataTimeline<T>[],
  newBadgeMetadata: BadgeMetadataTimeline<T>[],
  canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermission<T>[]
): Error | null {
  const { times: oldTimes, values: oldValues } = getBadgeMetadataTimesAndValues(oldBadgeMetadata.map((b) => b.convert(BigIntify)));
  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  const { times: newTimes, values: newValues } = getBadgeMetadataTimesAndValues(newBadgeMetadata.map((b) => b.convert(BigIntify)));
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  const detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, [], function (oldValue: any, newValue: any) {
    const oldBadgeMetadata = oldValue as BadgeMetadata<T>[];
    const firstMatchesForOld = GetFirstMatchOnly(castBadgeMetadataToUniversalPermission(oldBadgeMetadata));

    const newBadgeMetadata = newValue as BadgeMetadata<T>[];
    const firstMatchesForNew = GetFirstMatchOnly(castBadgeMetadataToUniversalPermission(newBadgeMetadata));

    const detailsToReturn: UniversalPermissionDetails[] = [];
    const [overlapObjects, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(firstMatchesForOld, firstMatchesForNew);
    for (const overlapObject of overlapObjects) {
      const overlap = overlapObject.overlap;
      const oldDetails = overlapObject.firstDetails;
      const newDetails = overlapObject.secondDetails;

      if (
        (oldDetails.arbitraryValue === null && newDetails.arbitraryValue !== null) ||
        (oldDetails.arbitraryValue !== null && newDetails.arbitraryValue === null)
      ) {
        detailsToReturn.push(overlap);
      } else {
        const oldVal = oldDetails.arbitraryValue as string;
        const newVal = newDetails.arbitraryValue as string;

        if (newVal !== oldVal) {
          detailsToReturn.push(overlap);
        }
      }
    }

    detailsToReturn.push(...inOldButNotNew);
    detailsToReturn.push(...inNewButNotOld);

    return detailsToReturn;
  });

  const details = detailsToCheck.map((x) => {
    const result = {
      timelineTimes: UintRangeArray.From([x.timelineTime]),
      badgeIds: UintRangeArray.From([x.badgeId]),
      ownershipTimes: UintRangeArray.From([x.ownershipTime]),
      transferTimes: UintRangeArray.From([x.transferTime]),
      toList: x.toList,
      fromList: x.fromList,
      initiatedByList: x.initiatedByList
    };
    return result;
  });

  const err = TimedUpdateWithBadgeIdsPermission.check(
    details,
    canUpdateBadgeMetadata.map((b) => b.convert(BigIntify))
  );
  if (err) {
    return err;
  }

  return null;
}

/**
 * Validates a state transition (old to new) for the timeline, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateCollectionMetadataUpdate<T extends NumberType>(
  oldCollectionMetadata: CollectionMetadataTimeline<T>[],
  newCollectionMetadata: CollectionMetadataTimeline<T>[],
  canUpdateCollectionMetadata: TimedUpdatePermission<T>[]
): Error | null {
  const { times: oldTimes, values: oldValues } = getCollectionMetadataTimesAndValues(oldCollectionMetadata.map((b) => b.convert(BigIntify)));
  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  const { times: newTimes, values: newValues } = getCollectionMetadataTimesAndValues(newCollectionMetadata.map((b) => b.convert(BigIntify)));
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  const detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, {}, function (oldValue: any, newValue: any) {
    const detailsToCheck: UniversalPermissionDetails[] = [];
    if (oldValue === null && newValue !== null) {
      detailsToCheck.push({
        timelineTime: new UintRange({ start: 1n, end: 1n }),
        badgeId: new UintRange({ start: 1n, end: 1n }),
        ownershipTime: new UintRange({ start: 1n, end: 1n }),
        transferTime: new UintRange({ start: 1n, end: 1n }),
        toList: AddressList.AllAddresses(),
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        approvalIdList: AddressList.AllAddresses(),
        permanentlyPermittedTimes: UintRangeArray.From([]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        arbitraryValue: undefined
      });
    } else {
      const oldVal = oldValue as CollectionMetadata;
      const newVal = newValue as CollectionMetadata;

      if (oldVal.uri !== newVal.uri || oldVal.customData !== newVal.customData) {
        detailsToCheck.push({
          timelineTime: new UintRange({ start: 1n, end: 1n }),
          badgeId: new UintRange({ start: 1n, end: 1n }),
          ownershipTime: new UintRange({ start: 1n, end: 1n }),
          transferTime: new UintRange({ start: 1n, end: 1n }),
          toList: AddressList.AllAddresses(),
          fromList: AddressList.AllAddresses(),
          initiatedByList: AddressList.AllAddresses(),
          approvalIdList: AddressList.AllAddresses(),

          permanentlyPermittedTimes: UintRangeArray.From([]),
          permanentlyForbiddenTimes: UintRangeArray.From([]),
          arbitraryValue: undefined
        });
      }
    }
    return detailsToCheck;
  });

  const details = UintRangeArray.From(
    detailsToCheck
      .map((x) => {
        return [x.timelineTime];
      })
      .flat()
  );

  const err = TimedUpdatePermission.check(
    details,
    canUpdateCollectionMetadata.map((b) => b.convert(BigIntify))
  );
  if (err) {
    return err;
  }

  return null;
}

/**
 * Validates a state transition (old to new) for the timeline, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateOffChainBalancesMetadataUpdate<T extends NumberType>(
  oldOffChainBalancesMetadata: OffChainBalancesMetadataTimeline<T>[],
  newOffChainBalancesMetadata: OffChainBalancesMetadataTimeline<T>[],
  canUpdateOffChainBalancesMetadata: TimedUpdatePermission<T>[]
): Error | null {
  const { times: oldTimes, values: oldValues } = getOffChainBalancesMetadataTimesAndValues(
    oldOffChainBalancesMetadata.map((b) => b.convert(BigIntify))
  );
  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  const { times: newTimes, values: newValues } = getOffChainBalancesMetadataTimesAndValues(
    newOffChainBalancesMetadata.map((b) => b.convert(BigIntify))
  );
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  const detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, {}, function (oldValue: any, newValue: any) {
    const detailsToCheck: UniversalPermissionDetails[] = [];

    if (oldValue === null && newValue !== null) {
      detailsToCheck.push({
        timelineTime: new UintRange({ start: 1n, end: 1n }),
        badgeId: new UintRange({ start: 1n, end: 1n }),
        ownershipTime: new UintRange({ start: 1n, end: 1n }),
        transferTime: new UintRange({ start: 1n, end: 1n }),
        toList: AddressList.AllAddresses(),
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        approvalIdList: AddressList.AllAddresses(),

        permanentlyPermittedTimes: UintRangeArray.From([]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        arbitraryValue: undefined
      });
    } else {
      const oldVal = oldValue as OffChainBalancesMetadata;
      const newVal = newValue as OffChainBalancesMetadata;

      if (oldVal.uri !== newVal.uri || oldVal.customData !== newVal.customData) {
        detailsToCheck.push({
          timelineTime: new UintRange({ start: 1n, end: 1n }),
          badgeId: new UintRange({ start: 1n, end: 1n }),
          ownershipTime: new UintRange({ start: 1n, end: 1n }),
          transferTime: new UintRange({ start: 1n, end: 1n }),
          toList: AddressList.AllAddresses(),
          fromList: AddressList.AllAddresses(),
          initiatedByList: AddressList.AllAddresses(),
          approvalIdList: AddressList.AllAddresses(),

          permanentlyPermittedTimes: UintRangeArray.From([]),
          permanentlyForbiddenTimes: UintRangeArray.From([]),
          arbitraryValue: undefined
        });
      }
    }
    return detailsToCheck;
  });

  const details = UintRangeArray.From(detailsToCheck.map((x) => x.timelineTime));

  const err = TimedUpdatePermission.check(
    details,
    canUpdateOffChainBalancesMetadata.map((b) => b.convert(BigIntify))
  );
  if (err) {
    return err;
  }

  return null;
}

/**
 * Validates if an update of standards (old -> new) is valid according to the permissions
 *
 * @category Validate Updates
 */
function getUpdatedStringCombinations(oldValue: any, newValue: any): UniversalPermissionDetails[] {
  const x: UniversalPermissionDetails[] = [];
  if ((oldValue === null && newValue !== null) || (oldValue !== null && newValue === null) || oldValue !== newValue) {
    x.push({
      timelineTime: new UintRange({ start: 1n, end: 1n }),
      badgeId: new UintRange({ start: 1n, end: 1n }),
      ownershipTime: new UintRange({ start: 1n, end: 1n }),
      transferTime: new UintRange({ start: 1n, end: 1n }),
      toList: AddressList.AllAddresses(),
      fromList: AddressList.AllAddresses(),
      initiatedByList: AddressList.AllAddresses(),
      approvalIdList: AddressList.AllAddresses(),

      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([]),
      arbitraryValue: undefined
    });
  }
  return x;
}

/**
 * @category Validate Updates
 */
function getUpdatedBoolCombinations(oldValue: any, newValue: any): UniversalPermissionDetails[] {
  if ((oldValue === null && newValue !== null) || (oldValue !== null && newValue === null) || oldValue !== newValue) {
    return [
      {
        timelineTime: new UintRange({ start: 1n, end: 1n }),
        badgeId: new UintRange({ start: 1n, end: 1n }),
        ownershipTime: new UintRange({ start: 1n, end: 1n }),
        transferTime: new UintRange({ start: 1n, end: 1n }),
        toList: AddressList.AllAddresses(),
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        approvalIdList: AddressList.AllAddresses(),

        permanentlyPermittedTimes: UintRangeArray.From([]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        arbitraryValue: undefined
      }
    ];
  }
  return [];
}

/**
 * Validates a state transition (old to new) for the timeline, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateManagerUpdate<T extends NumberType>(
  oldManager: ManagerTimeline<T>[],
  newManager: ManagerTimeline<T>[],
  canUpdateManager: TimedUpdatePermission<T>[]
): Error | null {
  const { times: oldTimes, values: oldValues } = getManagerTimesAndValues(oldManager.map((b) => b.convert(BigIntify)));
  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  const { times: newTimes, values: newValues } = getManagerTimesAndValues(newManager.map((b) => b.convert(BigIntify)));
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  const updatedTimelineTimes = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, '', getUpdatedStringCombinations);

  const details = UintRangeArray.From(updatedTimelineTimes.map((x) => x.timelineTime));

  const err = TimedUpdatePermission.check(
    details,
    canUpdateManager.map((b) => b.convert(BigIntify))
  );
  if (err) {
    return err;
  }

  return null;
}

/**
 * Validates a state transition (old to new) for the timeline, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateCustomDataUpdate<T extends NumberType>(
  oldCustomData: CustomDataTimeline<T>[],
  newCustomData: CustomDataTimeline<T>[],
  canUpdateCustomData: TimedUpdatePermission<T>[]
): Error | null {
  const { times: oldTimes, values: oldValues } = getCustomDataTimesAndValues(oldCustomData.map((b) => b.convert(BigIntify)));
  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  const { times: newTimes, values: newValues } = getCustomDataTimesAndValues(newCustomData.map((b) => b.convert(BigIntify)));
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  const updatedTimelineTimes = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, '', getUpdatedStringCombinations);

  const details = UintRangeArray.From(updatedTimelineTimes.map((x) => x.timelineTime));

  const err = TimedUpdatePermission.check(
    details,
    canUpdateCustomData.map((b) => b.convert(BigIntify))
  );
  if (err) {
    return err;
  }

  return null;
}

/**
 * Validates a state transition (old to new) for the timeline, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateStandardsUpdate<T extends NumberType>(
  oldStandards: StandardsTimeline<T>[],
  newStandards: StandardsTimeline<T>[],
  canUpdateStandards: TimedUpdatePermission<T>[]
): Error | null {
  const { times: oldTimes, values: oldValues } = getStandardsTimesAndValues(oldStandards.map((b) => b.convert(BigIntify)));
  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  const { times: newTimes, values: newValues } = getStandardsTimesAndValues(newStandards.map((b) => b.convert(BigIntify)));
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  const updatedTimelineTimes = getUpdateCombinationsToCheck(
    oldTimelineFirstMatches,
    newTimelineFirstMatches,
    [],
    function (oldValue: any, newValue: any): UniversalPermissionDetails[] {
      if ((oldValue == null && newValue != null) || (oldValue != null && newValue == null)) {
        return [
          {
            timelineTime: new UintRange({ start: 1n, end: 1n }),
            badgeId: new UintRange({ start: 1n, end: 1n }),
            ownershipTime: new UintRange({ start: 1n, end: 1n }),
            transferTime: new UintRange({ start: 1n, end: 1n }),
            toList: AddressList.AllAddresses(),
            fromList: AddressList.AllAddresses(),
            initiatedByList: AddressList.AllAddresses(),
            approvalIdList: AddressList.AllAddresses(),

            permanentlyPermittedTimes: UintRangeArray.From([]),
            permanentlyForbiddenTimes: UintRangeArray.From([]),
            arbitraryValue: undefined
          }
        ];
      } else if (oldValue.length != newValue.length) {
        return [
          {
            timelineTime: new UintRange({ start: 1n, end: 1n }),
            badgeId: new UintRange({ start: 1n, end: 1n }),
            ownershipTime: new UintRange({ start: 1n, end: 1n }),
            transferTime: new UintRange({ start: 1n, end: 1n }),
            toList: AddressList.AllAddresses(),
            fromList: AddressList.AllAddresses(),
            initiatedByList: AddressList.AllAddresses(),
            approvalIdList: AddressList.AllAddresses(),

            permanentlyPermittedTimes: UintRangeArray.From([]),
            permanentlyForbiddenTimes: UintRangeArray.From([]),
            arbitraryValue: undefined
          }
        ];
      } else {
        for (let i = 0; i < oldValue.length; i++) {
          if (oldValue[i] != newValue[i]) {
            return [
              {
                timelineTime: new UintRange({ start: 1n, end: 1n }),
                badgeId: new UintRange({ start: 1n, end: 1n }),
                ownershipTime: new UintRange({ start: 1n, end: 1n }),
                transferTime: new UintRange({ start: 1n, end: 1n }),
                toList: AddressList.AllAddresses(),
                fromList: AddressList.AllAddresses(),
                initiatedByList: AddressList.AllAddresses(),
                approvalIdList: AddressList.AllAddresses(),

                permanentlyPermittedTimes: UintRangeArray.From([]),
                permanentlyForbiddenTimes: UintRangeArray.From([]),
                arbitraryValue: undefined
              }
            ];
          }
        }
      }

      return [];
    }
  );

  const details = UintRangeArray.From(updatedTimelineTimes.map((x) => x.timelineTime));

  const err = TimedUpdatePermission.check(
    details,
    canUpdateStandards.map((b) => b.convert(BigIntify))
  );
  if (err) {
    return err;
  }

  return null;
}

/**
 * @category Timelines
 */
export function getIsArchivedTimesAndValues<T extends NumberType>(
  isArchivedTimeline: IsArchivedTimeline<T>[]
): { times: UintRangeArray<T>[]; values: boolean[] } {
  const times: UintRangeArray<T>[] = [];
  const values: boolean[] = [];

  for (const timelineVal of isArchivedTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.isArchived);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getOffChainBalancesMetadataTimesAndValues<T extends NumberType>(
  inheritedBalancesMetadata: OffChainBalancesMetadataTimeline<T>[]
): { times: UintRangeArray<T>[]; values: OffChainBalancesMetadata[] } {
  const times: UintRangeArray<T>[] = [];
  const values: OffChainBalancesMetadata[] = [];

  for (const timelineVal of inheritedBalancesMetadata) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.offChainBalancesMetadata);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getCollectionMetadataTimesAndValues<T extends NumberType>(
  timeline: CollectionMetadataTimeline<T>[]
): { times: UintRangeArray<T>[]; values: CollectionMetadata[] } {
  const times: UintRangeArray<T>[] = [];
  const values: CollectionMetadata[] = [];

  for (const timelineVal of timeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.collectionMetadata);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getBadgeMetadataTimesAndValues<T extends NumberType>(
  timeline: BadgeMetadataTimeline<T>[]
): { times: UintRangeArray<T>[]; values: BadgeMetadata<T>[][] } {
  const times: UintRangeArray<T>[] = [];
  const values: BadgeMetadata<T>[][] = [];

  for (const timelineVal of timeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.badgeMetadata);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getManagerTimesAndValues<T extends NumberType>(
  managerTimeline: ManagerTimeline<T>[]
): { times: UintRangeArray<T>[]; values: string[] } {
  const times: UintRangeArray<T>[] = [];
  const values: string[] = [];

  for (const timelineVal of managerTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.manager);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getCustomDataTimesAndValues<T extends NumberType>(
  customDataTimeline: CustomDataTimeline<T>[]
): { times: UintRangeArray<T>[]; values: string[] } {
  const times: UintRangeArray<T>[] = [];
  const values: string[] = [];

  for (const timelineVal of customDataTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.customData);
  }

  return { times, values };
}

/**
 * @category Timelines
 */
export function getStandardsTimesAndValues<T extends NumberType>(
  standardsTimeline: StandardsTimeline<T>[]
): { times: UintRangeArray<T>[]; values: string[][] } {
  const times: UintRangeArray<T>[] = [];
  const values: string[][] = [];

  for (const timelineVal of standardsTimeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.standards);
  }

  return { times, values };
}

/**
 * @inheritDoc iUpdateHistory
 * @category Indexer
 */
export class UpdateHistory<T extends NumberType> extends BaseNumberTypeClass<UpdateHistory<T>> implements iUpdateHistory<T> {
  txHash: string;
  block: T;
  blockTimestamp: UNIXMilliTimestamp<T>;
  timestamp: UNIXMilliTimestamp<T>;

  constructor(data: iUpdateHistory<T>) {
    super();
    this.txHash = data.txHash;
    this.block = data.block;
    this.blockTimestamp = data.blockTimestamp;
    this.timestamp = data.timestamp;
  }

  getNumberFieldNames(): string[] {
    return ['block', 'blockTimestamp', 'timestamp'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UpdateHistory<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UpdateHistory<U>;
  }
}
