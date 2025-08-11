import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type {
  BitBadgesAddress,
  iCosmosCoinWrapperPath,
  iCosmosCoinWrapperPathWithDetails,
  iUpdateHistory,
  UNIXMilliTimestamp
} from '@/api-indexer/docs-types/interfaces.js';
import { TokenMetadataDetails, CollectionMetadataDetails } from '@/api-indexer/metadata/badgeMetadata.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';
import {
  BaseNumberTypeClass,
  convertClassPropertiesAndMaintainNumberTypes,
  ConvertOptions,
  CustomTypeClass,
  deepCopyPrimitives
} from '@/common/base.js';
import { DenomUnit, DenomUnitWithDetails } from '@/core/ibc-wrappers.js';
import { Balance } from '@/core/balances.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers.js';
import type {
  CollectionId,
  iAmountTrackerIdDetails,
  iApprovalIdentifierDetails,
  iTokenMetadata,
  iTokenMetadataTimeline,
  iTokenMetadataTimelineWithDetails,
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
  iMustOwnToken,
  iMustOwnTokens,
  iOffChainBalancesMetadata,
  iOffChainBalancesMetadataTimeline,
  iStandardsTimeline,
  iTimelineItem,
  iETHSignatureChallenge,
  iETHSignatureProof,
  iCollectionInvariants
} from '../interfaces/types/core.js';
import * as protobadges from '../proto/badges/index.js';
import { AddressList } from './addressLists.js';
import { CosmosCoin } from './coin.js';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps.js';
import { GetFirstMatchOnly, getOverlapsAndNonOverlaps } from './overlaps.js';
import { TimedUpdatePermission, TimedUpdateWithTokenIdsPermission } from './permissions.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { AllDefaultValues, getPotentialUpdatesForTimelineValues, getUpdateCombinationsToCheck } from './validate-utils.js';

/**
 * TokenMetadata is used to represent the metadata for a range of token IDs.
 * The metadata can be hosted via a URI (via uri) or stored on-chain (via customData).
 *
 * We take first-match only for the token IDs.
 * If a token ID is in multiple TokenMetadata, we take the first match in a linear search.
 *
 * @category Collections
 */
export class TokenMetadata<T extends NumberType> extends BaseNumberTypeClass<TokenMetadata<T>> implements iTokenMetadata<T> {
  uri: string;
  tokenIds: UintRangeArray<T>;
  customData: string;

  constructor(tokenMetadata: iTokenMetadata<T>) {
    super();
    this.uri = tokenMetadata.uri;
    this.tokenIds = UintRangeArray.From(tokenMetadata.tokenIds);
    this.customData = tokenMetadata.customData;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): TokenMetadata<U> {
    return new TokenMetadata<U>(
      deepCopyPrimitives({
        uri: this.uri,
        tokenIds: this.tokenIds.map((b) => b.convert(convertFunction)),
        customData: this.customData
      })
    );
  }

  toProto(): protobadges.TokenMetadata {
    return new protobadges.TokenMetadata({
      uri: this.uri,
      tokenIds: this.tokenIds.map((b) => b.toProto()),
      customData: this.customData
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TokenMetadata<U> {
    return TokenMetadata.fromProto(protobadges.TokenMetadata.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TokenMetadata<U> {
    return TokenMetadata.fromProto(protobadges.TokenMetadata.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protobadges.TokenMetadata, convertFunction: (item: NumberType) => U): TokenMetadata<U> {
    return new TokenMetadata<U>({
      uri: item.uri,
      tokenIds: item.tokenIds.map((b) => UintRange.fromProto(b, convertFunction)),
      customData: item.customData
    });
  }

  /**
   * Get first matches for the token metadata (i.e. if there are duplicated token IDs, we take the first match in a linear search).
   */
  static getFirstMatches<T extends NumberType>(tokenMetadata: TokenMetadata<T>[]): TokenMetadata<T>[] {
    const metadataArr = tokenMetadata.map((b) => b.clone());
    for (let i = 0; i < metadataArr.length; i++) {
      const metadata = metadataArr[i];
      for (let j = i + 1; j < metadataArr.length; j++) {
        const otherMetadata = metadataArr[j];
        otherMetadata.tokenIds.remove(metadata.tokenIds);
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

  toProto(): protobadges.CollectionMetadata {
    return new protobadges.CollectionMetadata({
      uri: this.uri,
      customData: this.customData
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CollectionMetadata {
    return CollectionMetadata.fromProto(protobadges.CollectionMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CollectionMetadata {
    return CollectionMetadata.fromProto(protobadges.CollectionMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.CollectionMetadata): CollectionMetadata {
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

  toProto(): protobadges.OffChainBalancesMetadata {
    return new protobadges.OffChainBalancesMetadata({
      uri: this.uri,
      customData: this.customData
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): OffChainBalancesMetadata {
    return OffChainBalancesMetadata.fromProto(protobadges.OffChainBalancesMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): OffChainBalancesMetadata {
    return OffChainBalancesMetadata.fromProto(protobadges.OffChainBalancesMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.OffChainBalancesMetadata): OffChainBalancesMetadata {
    return new OffChainBalancesMetadata({
      uri: item.uri,
      customData: item.customData
    });
  }
}

/**
 * @category Approvals / Transferability
 */
export class CoinTransfer<T extends NumberType> extends BaseNumberTypeClass<CoinTransfer<T>> implements iCoinTransfer<T> {
  to: BitBadgesAddress;
  coins: CosmosCoin<T>[];
  overrideFromWithApproverAddress: boolean;
  overrideToWithInitiator: boolean;

  constructor(coinTransfer: iCoinTransfer<T>) {
    super();
    this.to = coinTransfer.to;
    this.coins = coinTransfer.coins.map((b) => new CosmosCoin(b));
    this.overrideFromWithApproverAddress = coinTransfer.overrideFromWithApproverAddress;
    this.overrideToWithInitiator = coinTransfer.overrideToWithInitiator;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CoinTransfer<U> {
    return new CoinTransfer<U>({
      to: this.to,
      coins: this.coins.map((b) => b.convert(convertFunction)),
      overrideFromWithApproverAddress: this.overrideFromWithApproverAddress,
      overrideToWithInitiator: this.overrideToWithInitiator
    });
  }

  toProto(): protobadges.CoinTransfer {
    return new protobadges.CoinTransfer(this.convert(Stringify));
  }

  static fromProto<U extends NumberType>(item: protobadges.CoinTransfer, convertFunction: (item: NumberType) => U): CoinTransfer<U> {
    return new CoinTransfer<U>({
      to: item.to,
      coins: item.coins.map((b) => CosmosCoin.fromProto(b, convertFunction)),
      overrideFromWithApproverAddress: item.overrideFromWithApproverAddress,
      overrideToWithInitiator: item.overrideToWithInitiator
    });
  }

  toBech32Addresses(prefix: string): CoinTransfer<T> {
    return new CoinTransfer({
      ...this,
      to: getConvertFunctionFromPrefix(prefix)(this.to)
    });
  }
}

/**
 * ApprovalIdentifierDetails is used to represent an exact approval.
 *
 * @category Approvals / Transferability
 */
export class ApprovalIdentifierDetails<T extends NumberType>
  extends BaseNumberTypeClass<ApprovalIdentifierDetails<T>>
  implements iApprovalIdentifierDetails<T>
{
  approvalId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  version: T;
  constructor(approvalIdDetails: iApprovalIdentifierDetails<T>) {
    super();
    this.approvalId = approvalIdDetails.approvalId;
    this.approvalLevel = approvalIdDetails.approvalLevel;
    this.approverAddress = approvalIdDetails.approverAddress;
    this.version = approvalIdDetails.version;
  }

  getNumberFieldNames(): string[] {
    return ['version'];
  }

  static required(): ApprovalIdentifierDetails<NumberType> {
    return new ApprovalIdentifierDetails({
      approvalId: '',
      approvalLevel: '',
      approverAddress: '',
      version: '0'
    });
  }

  toProto(): protobadges.ApprovalIdentifierDetails {
    return new protobadges.ApprovalIdentifierDetails(this.clone().toJson());
  }

  clone(): ApprovalIdentifierDetails<T> {
    return new ApprovalIdentifierDetails<T>({ ...this });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalIdentifierDetails<U> {
    return ApprovalIdentifierDetails.fromProto(protobadges.ApprovalIdentifierDetails.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalIdentifierDetails<U> {
    return ApprovalIdentifierDetails.fromProto(protobadges.ApprovalIdentifierDetails.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protobadges.ApprovalIdentifierDetails,
    convertFunction: (item: NumberType) => U
  ): ApprovalIdentifierDetails<U> {
    return new ApprovalIdentifierDetails<U>({
      approvalId: item.approvalId,
      approvalLevel: item.approvalLevel,
      approverAddress: item.approverAddress,
      version: convertFunction(item.version)
    });
  }

  toBech32Addresses(prefix: string): ApprovalIdentifierDetails<T> {
    return new ApprovalIdentifierDetails<T>({
      ...this,
      approverAddress: getConvertFunctionFromPrefix(prefix)(this.approverAddress)
    });
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
  collectionId: CollectionId;
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
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AmountTrackerIdDetails<U> {
    return new AmountTrackerIdDetails<U>(
      deepCopyPrimitives({
        collectionId: this.collectionId,
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
 * MustOwnToken is used to represent a must own token for an approval.
 *
 * @category Approvals / Transferability
 */
export class MustOwnTokens<T extends NumberType> extends BaseNumberTypeClass<MustOwnTokens<T>> implements iMustOwnTokens<T> {
  amountRange: UintRange<T>;
  tokenIds: UintRangeArray<T>;
  overrideWithCurrentTime: boolean;
  mustSatisfyForAllAssets: boolean;
  ownershipTimes: UintRangeArray<T>;
  collectionId: string;
  ownershipCheckParty?: string;

  constructor(mustOwnToken: iMustOwnToken<T>) {
    super();
    this.amountRange = new UintRange<T>(mustOwnToken.amountRange);
    this.tokenIds = UintRangeArray.From(mustOwnToken.tokenIds);
    this.overrideWithCurrentTime = mustOwnToken.overrideWithCurrentTime;
    this.mustSatisfyForAllAssets = mustOwnToken.mustSatisfyForAllAssets;
    this.ownershipTimes = UintRangeArray.From(mustOwnToken.ownershipTimes);
    this.collectionId = mustOwnToken.collectionId;
    this.ownershipCheckParty = mustOwnToken.ownershipCheckParty;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MustOwnTokens<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MustOwnTokens<U>;
  }

  toProto(): protobadges.MustOwnTokens {
    return new protobadges.MustOwnTokens(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MustOwnTokens<U> {
    return MustOwnTokens.fromProto(protobadges.MustOwnTokens.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MustOwnTokens<U> {
    return MustOwnTokens.fromProto(protobadges.MustOwnTokens.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protobadges.MustOwnTokens, convertFunction: (item: NumberType) => U): MustOwnTokens<U> {
    return new MustOwnTokens<U>({
      amountRange: item.amountRange
        ? new UintRange(item.amountRange).convert(convertFunction)
        : new UintRange({ start: 0n, end: 0n }).convert(convertFunction),
      tokenIds: item.tokenIds ? UintRangeArray.From(item.tokenIds).convert(convertFunction) : new UintRangeArray<U>(),
      overrideWithCurrentTime: item.overrideWithCurrentTime,
      mustSatisfyForAllAssets: item.mustSatisfyForAllAssets,
      ownershipTimes: item.ownershipTimes ? UintRangeArray.From(item.ownershipTimes).convert(convertFunction) : new UintRangeArray<U>(),
      collectionId: item.collectionId,
      ownershipCheckParty: item.ownershipCheckParty
    });
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
  leafSigner: string;

  constructor(merkleChallenge: iMerkleChallenge<T>) {
    super();
    this.root = merkleChallenge.root;
    this.expectedProofLength = merkleChallenge.expectedProofLength;
    this.useCreatorAddressAsLeaf = merkleChallenge.useCreatorAddressAsLeaf;
    this.maxUsesPerLeaf = merkleChallenge.maxUsesPerLeaf;
    this.uri = merkleChallenge.uri;
    this.customData = merkleChallenge.customData;
    this.challengeTrackerId = merkleChallenge.challengeTrackerId;
    this.leafSigner = merkleChallenge.leafSigner;
  }

  static required(): MerkleChallenge<NumberType> {
    return new MerkleChallenge({
      root: '',
      expectedProofLength: 0,
      useCreatorAddressAsLeaf: false,
      maxUsesPerLeaf: 0,
      uri: '',
      customData: '',
      challengeTrackerId: '',
      leafSigner: ''
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
        challengeTrackerId: this.challengeTrackerId,
        leafSigner: this.leafSigner
      })
    );
  }

  toProto(): protobadges.MerkleChallenge {
    return new protobadges.MerkleChallenge(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MerkleChallenge<U> {
    return MerkleChallenge.fromProto(protobadges.MerkleChallenge.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MerkleChallenge<U> {
    return MerkleChallenge.fromProto(protobadges.MerkleChallenge.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protobadges.MerkleChallenge, convertFunction: (item: NumberType) => U): MerkleChallenge<U> {
    return new MerkleChallenge<U>({
      root: item.root,
      expectedProofLength: convertFunction(BigInt(item.expectedProofLength)),
      useCreatorAddressAsLeaf: item.useCreatorAddressAsLeaf,
      maxUsesPerLeaf: convertFunction(BigInt(item.maxUsesPerLeaf)),
      uri: item.uri,
      customData: item.customData,
      challengeTrackerId: item.challengeTrackerId,
      leafSigner: item.leafSigner
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

  toProto(): protobadges.MerklePathItem {
    return new protobadges.MerklePathItem(this.clone().toJson());
  }

  clone(): MerklePathItem {
    return new MerklePathItem({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MerklePathItem {
    return MerklePathItem.fromProto(protobadges.MerklePathItem.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MerklePathItem {
    return MerklePathItem.fromProto(protobadges.MerklePathItem.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.MerklePathItem): MerklePathItem {
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
  leafSignature: string;

  constructor(merkleProof: iMerkleProof) {
    super();
    this.aunts = merkleProof.aunts.map((b) => new MerklePathItem(b));
    this.leaf = merkleProof.leaf;
    this.leafSignature = merkleProof.leafSignature;
  }

  static required(): MerkleProof {
    return new MerkleProof({
      aunts: [],
      leaf: '',
      leafSignature: ''
    });
  }

  toProto(): protobadges.MerkleProof {
    return new protobadges.MerkleProof(this.clone().toJson());
  }

  clone(): MerkleProof {
    return new MerkleProof({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MerkleProof {
    return MerkleProof.fromProto(protobadges.MerkleProof.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MerkleProof {
    return MerkleProof.fromProto(protobadges.MerkleProof.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.MerkleProof): MerkleProof {
    return new MerkleProof({
      aunts: item.aunts.map((b) => MerklePathItem.fromProto(b)),
      leaf: item.leaf,
      leafSignature: item.leafSignature
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

  toProto(): protobadges.ManagerTimeline {
    return new protobadges.ManagerTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ManagerTimeline<U> {
    return ManagerTimeline.fromProto(protobadges.ManagerTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ManagerTimeline<U> {
    return ManagerTimeline.fromProto(protobadges.ManagerTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protobadges.ManagerTimeline, convertFunction: (item: NumberType) => U): ManagerTimeline<U> {
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

  toBech32Addresses(prefix: string): ManagerTimeline<T> {
    return new ManagerTimeline({
      ...this,
      manager: getConvertFunctionFromPrefix(prefix)(this.manager)
    });
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

  toProto(): protobadges.CollectionMetadataTimeline {
    return new protobadges.CollectionMetadataTimeline(this.convert(Stringify));
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

  toProto(): protobadges.CollectionMetadataTimeline {
    return new protobadges.CollectionMetadataTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionMetadataTimeline<U> {
    return CollectionMetadataTimeline.fromProto(protobadges.CollectionMetadataTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionMetadataTimeline<U> {
    return CollectionMetadataTimeline.fromProto(protobadges.CollectionMetadataTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protobadges.CollectionMetadataTimeline,
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
export class TokenMetadataTimelineWithDetails<T extends NumberType>
  extends BaseNumberTypeClass<TokenMetadataTimelineWithDetails<T>>
  implements iTokenMetadataTimelineWithDetails<T>
{
  tokenMetadata: TokenMetadataDetails<T>[];
  timelineTimes: UintRangeArray<T>;

  constructor(tokenMetadataTimeline: iTokenMetadataTimelineWithDetails<T>) {
    super();
    this.timelineTimes = UintRangeArray.From(tokenMetadataTimeline.timelineTimes);
    this.tokenMetadata = tokenMetadataTimeline.tokenMetadata.map((b) => new TokenMetadataDetails(b));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): TokenMetadataTimelineWithDetails<U> {
    return new TokenMetadataTimelineWithDetails<U>(
      deepCopyPrimitives({
        tokenMetadata: this.tokenMetadata.map((b) => b.convert(convertFunction)),
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): protobadges.TokenMetadataTimeline {
    return new protobadges.TokenMetadataTimeline(this.convert(Stringify));
  }
}

/**
 * TokenMetadataTimeline represents the value of the token metadata over time
 *
 * @category Timelines
 */
export class TokenMetadataTimeline<T extends NumberType> extends BaseNumberTypeClass<TokenMetadataTimeline<T>> implements iTokenMetadataTimeline<T> {
  tokenMetadata: TokenMetadata<T>[];
  timelineTimes: UintRangeArray<T>;

  constructor(tokenMetadataTimeline: iTokenMetadataTimeline<T>) {
    super();
    this.timelineTimes = UintRangeArray.From(tokenMetadataTimeline.timelineTimes);
    this.tokenMetadata = tokenMetadataTimeline.tokenMetadata.map((b) => new TokenMetadata(b));
  }

  static required(): TokenMetadataTimeline<NumberType> {
    return new TokenMetadataTimeline({
      tokenMetadata: [],
      timelineTimes: []
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): TokenMetadataTimeline<U> {
    return new TokenMetadataTimeline<U>(
      deepCopyPrimitives({
        tokenMetadata: this.tokenMetadata.map((b) => b.convert(convertFunction)),
        timelineTimes: this.timelineTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): protobadges.TokenMetadataTimeline {
    return new protobadges.TokenMetadataTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TokenMetadataTimeline<U> {
    return TokenMetadataTimeline.fromProto(protobadges.TokenMetadataTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TokenMetadataTimeline<U> {
    return TokenMetadataTimeline.fromProto(protobadges.TokenMetadataTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protobadges.TokenMetadataTimeline,
    convertFunction: (item: NumberType) => U
  ): TokenMetadataTimeline<U> {
    return new TokenMetadataTimeline<U>({
      tokenMetadata: item.tokenMetadata.map((b) => TokenMetadata.fromProto(b, convertFunction)),
      timelineTimes: item.timelineTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  /**
   * Wrapper for {@link validateTokenMetadataUpdate}
   */
  static validateUpdate<T extends NumberType>(
    oldTokenMetadata: TokenMetadataTimeline<T>[],
    newTokenMetadata: TokenMetadataTimeline<T>[],
    canUpdateTokenMetadata: TimedUpdateWithTokenIdsPermission<T>[]
  ): Error | null {
    return validateTokenMetadataUpdate(
      oldTokenMetadata.map((b) => b.convert(BigIntify)),
      newTokenMetadata.map((b) => b.convert(BigIntify)),
      canUpdateTokenMetadata.map((b) => b.convert(BigIntify))
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

  toProto(): protobadges.OffChainBalancesMetadataTimeline {
    return new protobadges.OffChainBalancesMetadataTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): OffChainBalancesMetadataTimeline<U> {
    return OffChainBalancesMetadataTimeline.fromProto(protobadges.OffChainBalancesMetadataTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): OffChainBalancesMetadataTimeline<U> {
    return OffChainBalancesMetadataTimeline.fromProto(
      protobadges.OffChainBalancesMetadataTimeline.fromJsonString(jsonString, options),
      convertFunction
    );
  }

  static fromProto<U extends NumberType>(
    item: protobadges.OffChainBalancesMetadataTimeline,
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

  toProto(): protobadges.CustomDataTimeline {
    return new protobadges.CustomDataTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CustomDataTimeline<U> {
    return CustomDataTimeline.fromProto(protobadges.CustomDataTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CustomDataTimeline<U> {
    return CustomDataTimeline.fromProto(protobadges.CustomDataTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protobadges.CustomDataTimeline, convertFunction: (item: NumberType) => U): CustomDataTimeline<U> {
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

  toProto(): protobadges.StandardsTimeline {
    return new protobadges.StandardsTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): StandardsTimeline<U> {
    return StandardsTimeline.fromProto(protobadges.StandardsTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): StandardsTimeline<U> {
    return StandardsTimeline.fromProto(protobadges.StandardsTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protobadges.StandardsTimeline, convertFunction: (item: NumberType) => U): StandardsTimeline<U> {
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

  toProto(): protobadges.IsArchivedTimeline {
    return new protobadges.IsArchivedTimeline(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IsArchivedTimeline<U> {
    return IsArchivedTimeline.fromProto(protobadges.IsArchivedTimeline.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IsArchivedTimeline<U> {
    return IsArchivedTimeline.fromProto(protobadges.IsArchivedTimeline.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protobadges.IsArchivedTimeline, convertFunction: (item: NumberType) => U): IsArchivedTimeline<U> {
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

const castTokenMetadataToUniversalPermission = <T extends NumberType>(tokenMetadata: TokenMetadata<T>[]): UniversalPermission[] => {
  if (tokenMetadata.length === 0) {
    return [];
  }

  const castedPermissions: UniversalPermission[] = [];
  for (const metadata of tokenMetadata) {
    castedPermissions.push({
      ...AllDefaultValues,
      tokenIds: metadata.tokenIds.convert(BigIntify),
      usesTokenIds: true,
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
export function validateTokenMetadataUpdate<T extends NumberType>(
  oldTokenMetadata: TokenMetadataTimeline<T>[],
  newTokenMetadata: TokenMetadataTimeline<T>[],
  canUpdateTokenMetadata: TimedUpdateWithTokenIdsPermission<T>[]
): Error | null {
  const { times: oldTimes, values: oldValues } = getTokenMetadataTimesAndValues(oldTokenMetadata.map((b) => b.convert(BigIntify)));
  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  const { times: newTimes, values: newValues } = getTokenMetadataTimesAndValues(newTokenMetadata.map((b) => b.convert(BigIntify)));
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  const detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, [], function (oldValue: any, newValue: any) {
    const oldTokenMetadata = oldValue as TokenMetadata<T>[];
    const firstMatchesForOld = GetFirstMatchOnly(castTokenMetadataToUniversalPermission(oldTokenMetadata));

    const newTokenMetadata = newValue as TokenMetadata<T>[];
    const firstMatchesForNew = GetFirstMatchOnly(castTokenMetadataToUniversalPermission(newTokenMetadata));

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
      tokenIds: UintRangeArray.From([x.tokenId]),
      ownershipTimes: UintRangeArray.From([x.ownershipTime]),
      transferTimes: UintRangeArray.From([x.transferTime]),
      toList: x.toList,
      fromList: x.fromList,
      initiatedByList: x.initiatedByList
    };
    return result;
  });

  const err = TimedUpdateWithTokenIdsPermission.check(
    details,
    canUpdateTokenMetadata.map((b) => b.convert(BigIntify))
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
        tokenId: new UintRange({ start: 1n, end: 1n }),
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
          tokenId: new UintRange({ start: 1n, end: 1n }),
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
        tokenId: new UintRange({ start: 1n, end: 1n }),
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
          tokenId: new UintRange({ start: 1n, end: 1n }),
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
      tokenId: new UintRange({ start: 1n, end: 1n }),
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
        tokenId: new UintRange({ start: 1n, end: 1n }),
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
            tokenId: new UintRange({ start: 1n, end: 1n }),
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
            tokenId: new UintRange({ start: 1n, end: 1n }),
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
                tokenId: new UintRange({ start: 1n, end: 1n }),
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
export function getTokenMetadataTimesAndValues<T extends NumberType>(
  timeline: TokenMetadataTimeline<T>[]
): { times: UintRangeArray<T>[]; values: TokenMetadata<T>[][] } {
  const times: UintRangeArray<T>[] = [];
  const values: TokenMetadata<T>[][] = [];

  for (const timelineVal of timeline) {
    times.push(timelineVal.timelineTimes);
    values.push(timelineVal.tokenMetadata);
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
 * @inheritDoc iCosmosCoinWrapperPath
 * @category Indexer
 */
export class CosmosCoinWrapperPath<T extends NumberType> extends CustomTypeClass<CosmosCoinWrapperPath<T>> implements iCosmosCoinWrapperPath<T> {
  address: string;
  denom: string;
  balances: Balance<T>[];
  symbol: string;
  denomUnits: DenomUnit<T>[];
  allowOverrideWithAnyValidToken: boolean;

  constructor(data: iCosmosCoinWrapperPath<T>) {
    super();
    this.address = data.address;
    this.denom = data.denom;
    this.balances = data.balances.map((balance) => new Balance(balance));
    this.symbol = data.symbol;
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnit(unit));
    this.allowOverrideWithAnyValidToken = data.allowOverrideWithAnyValidToken;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CosmosCoinWrapperPath<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinWrapperPath<U>;
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.CosmosCoinWrapperPath,
    convertFunction: (item: NumberType) => U
  ): CosmosCoinWrapperPath<U> {
    const denomUnits = protoMsg.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction));
    return new CosmosCoinWrapperPath<NumberType>({
      address: protoMsg.address,
      denom: protoMsg.denom,
      balances: protoMsg.balances.map((balance) => Balance.fromProto(balance, convertFunction)),
      symbol: protoMsg.symbol,
      denomUnits: denomUnits,
      allowOverrideWithAnyValidToken: protoMsg.allowOverrideWithAnyValidToken
    }).convert(convertFunction);
  }
}

/**
 * @inheritDoc iCosmosCoinWrapperPathWithDetails
 * @category Indexer
 */
export class CosmosCoinWrapperPathWithDetails<T extends NumberType> extends CosmosCoinWrapperPath<T> implements iCosmosCoinWrapperPathWithDetails<T> {
  metadata?: Metadata<T>;
  denomUnits: DenomUnitWithDetails<T>[];

  constructor(data: iCosmosCoinWrapperPathWithDetails<T>) {
    super(data);
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnitWithDetails(unit));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CosmosCoinWrapperPathWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinWrapperPathWithDetails<U>;
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.CosmosCoinWrapperPath,
    convertFunction: (item: NumberType) => U
  ): CosmosCoinWrapperPathWithDetails<U> {
    const denomUnits = protoMsg.denomUnits.map((unit) => DenomUnitWithDetails.fromProto(unit, convertFunction));
    return new CosmosCoinWrapperPathWithDetails<NumberType>({
      address: protoMsg.address,
      denom: protoMsg.denom,
      balances: protoMsg.balances.map((balance) => Balance.fromProto(balance, convertFunction)),
      symbol: protoMsg.symbol,
      denomUnits: denomUnits,
      allowOverrideWithAnyValidToken: protoMsg.allowOverrideWithAnyValidToken
    }).convert(convertFunction);
  }
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

/**
 * ETHSignatureChallenge is used to represent an Ethereum signature challenge for an approval.
 *
 * @category Approvals / Transferability
 */
export class ETHSignatureChallenge extends CustomTypeClass<ETHSignatureChallenge> implements iETHSignatureChallenge {
  signer: string;
  challengeTrackerId: string;
  uri: string;
  customData: string;

  constructor(ethSignatureChallenge: iETHSignatureChallenge) {
    super();
    this.signer = ethSignatureChallenge.signer;
    this.challengeTrackerId = ethSignatureChallenge.challengeTrackerId;
    this.uri = ethSignatureChallenge.uri;
    this.customData = ethSignatureChallenge.customData;
  }

  static required(): ETHSignatureChallenge {
    return new ETHSignatureChallenge({
      signer: '',
      challengeTrackerId: '',
      uri: '',
      customData: ''
    });
  }

  toProto(): protobadges.ETHSignatureChallenge {
    return new protobadges.ETHSignatureChallenge(this.clone().toJson());
  }

  clone(): ETHSignatureChallenge {
    return new ETHSignatureChallenge({ ...this });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ETHSignatureChallenge {
    // ETHSignatureChallenge doesn't have number fields, so conversion is a no-op
    return new ETHSignatureChallenge({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ETHSignatureChallenge {
    return ETHSignatureChallenge.fromProto(protobadges.ETHSignatureChallenge.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ETHSignatureChallenge {
    return ETHSignatureChallenge.fromProto(protobadges.ETHSignatureChallenge.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.ETHSignatureChallenge): ETHSignatureChallenge {
    return new ETHSignatureChallenge({
      signer: item.signer,
      challengeTrackerId: item.challengeTrackerId,
      uri: item.uri,
      customData: item.customData
    });
  }
}

/**
 * ETHSignatureProof is used to represent an Ethereum signature proof.
 * The ETH signature proof is used to prove that a specific nonce was signed by an Ethereum address.
 *
 * @category Approvals / Transferability
 */
export class ETHSignatureProof extends CustomTypeClass<ETHSignatureProof> implements iETHSignatureProof {
  nonce: string;
  signature: string;

  constructor(ethSignatureProof: iETHSignatureProof) {
    super();
    this.nonce = ethSignatureProof.nonce;
    this.signature = ethSignatureProof.signature;
  }

  static required(): ETHSignatureProof {
    return new ETHSignatureProof({
      nonce: '',
      signature: ''
    });
  }

  toProto(): protobadges.ETHSignatureProof {
    return new protobadges.ETHSignatureProof(this.clone().toJson());
  }

  clone(): ETHSignatureProof {
    return new ETHSignatureProof({ ...this });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ETHSignatureProof {
    // ETHSignatureProof doesn't have number fields, so conversion is a no-op
    return new ETHSignatureProof({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ETHSignatureProof {
    return ETHSignatureProof.fromProto(protobadges.ETHSignatureProof.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ETHSignatureProof {
    return ETHSignatureProof.fromProto(protobadges.ETHSignatureProof.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.ETHSignatureProof): ETHSignatureProof {
    return new ETHSignatureProof({
      nonce: item.nonce,
      signature: item.signature
    });
  }
}

/**
 * CollectionInvariants defines the invariants that apply to a collection.
 * These are set upon genesis and cannot be modified.
 *
 * @category Interfaces
 */
export class CollectionInvariants extends CustomTypeClass<CollectionInvariants> implements iCollectionInvariants {
  /**
   * If true, all ownership times must be full ranges [{ start: 1, end: GoMaxUInt64 }].
   * This prevents time-based restrictions on token ownership.
   */
  noCustomOwnershipTimes: boolean;

  constructor(data: iCollectionInvariants) {
    super();
    this.noCustomOwnershipTimes = data.noCustomOwnershipTimes;
  }

  toProto(): protobadges.CollectionInvariants {
    return new protobadges.CollectionInvariants(this.toJson());
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CollectionInvariants {
    return CollectionInvariants.fromProto(protobadges.CollectionInvariants.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CollectionInvariants {
    return CollectionInvariants.fromProto(protobadges.CollectionInvariants.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.CollectionInvariants): CollectionInvariants {
    return new CollectionInvariants({
      noCustomOwnershipTimes: item.noCustomOwnershipTimes
    });
  }
}
