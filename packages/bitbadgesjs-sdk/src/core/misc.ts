import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type {
  BitBadgesAddress,
  iAliasPath,
  iAliasPathWithDetails,
  iAssetInfoDoc,
  iCosmosCoinWrapperPath,
  iCosmosCoinWrapperPathWithDetails,
  iPoolInfo,
  iPoolInfoVolume,
  iUpdateHistory,
  UNIXMilliTimestamp
} from '@/api-indexer/docs-types/interfaces.js';
import {
  BaseNumberTypeClass,
  convertClassPropertiesAndMaintainNumberTypes,
  ConvertOptions,
  CustomTypeClass,
  deepCopyPrimitives
} from '@/common/base.js';
import { Conversion, ConversionWithoutDenom, DenomUnit, DenomUnitWithDetails, PathMetadata, PathMetadataWithDetails } from '@/core/ibc-wrappers.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers.js';
import type {
  CollectionId,
  iAmountTrackerIdDetails,
  iApprovalIdentifierDetails,
  iCoinTransfer,
  iCollectionInvariants,
  iCollectionMetadata,
  iCosmosCoinBackedPath,
  iDynamicStore,
  iDynamicStoreValue,
  iETHSignatureChallenge,
  iETHSignatureProof,
  iMerkleChallenge,
  iMerklePathItem,
  iMerkleProof,
  iMustOwnToken,
  iMustOwnTokens,
  iPathMetadata,
  iPrecalculateBalancesFromApprovalDetails,
  iPrecalculationOptions,
  iTokenMetadata,
  iVoter,
  iVoteProof,
  iVotingChallenge
} from '../interfaces/types/core.js';
import * as protobadges from '../proto/badges/index.js';
import * as protobadgesDynamicStores from '../proto/badges/dynamic_stores_pb.js';
import { CosmosCoin, iCosmosCoin } from './coin.js';
import type { UniversalPermission } from './overlaps.js';
import { GetFirstMatchOnly, getOverlapsAndNonOverlaps } from './overlaps.js';
import { ActionPermission, TokenIdsActionPermission } from './permissions.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { AllDefaultValues } from './validate-utils.js';

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
 * PrecalculateBalancesFromApprovalDetails defines the details for precalculating balances from an approval.
 *
 * @category Approvals / Transferability
 */
export class PrecalculateBalancesFromApprovalDetails<T extends NumberType>
  extends BaseNumberTypeClass<PrecalculateBalancesFromApprovalDetails<T>>
  implements iPrecalculateBalancesFromApprovalDetails<T>
{
  approvalId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  version: T;
  precalculationOptions?: PrecalculationOptions<T>;

  constructor(data: iPrecalculateBalancesFromApprovalDetails<T>) {
    super();
    this.approvalId = data.approvalId;
    this.approvalLevel = data.approvalLevel;
    this.approverAddress = data.approverAddress;
    this.version = data.version;
    this.precalculationOptions = data.precalculationOptions ? new PrecalculationOptions(data.precalculationOptions) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['version'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PrecalculateBalancesFromApprovalDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PrecalculateBalancesFromApprovalDetails<U>;
  }

  toProto(): protobadges.PrecalculateBalancesFromApprovalDetails {
    return new protobadges.PrecalculateBalancesFromApprovalDetails(this.convert(Stringify).toJson());
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PrecalculateBalancesFromApprovalDetails<U> {
    return PrecalculateBalancesFromApprovalDetails.fromProto(
      protobadges.PrecalculateBalancesFromApprovalDetails.fromJson(jsonValue, options),
      convertFunction
    );
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PrecalculateBalancesFromApprovalDetails<U> {
    return PrecalculateBalancesFromApprovalDetails.fromProto(
      protobadges.PrecalculateBalancesFromApprovalDetails.fromJsonString(jsonString, options),
      convertFunction
    );
  }

  static fromProto<U extends NumberType>(
    item: protobadges.PrecalculateBalancesFromApprovalDetails,
    convertFunction: (item: NumberType) => U
  ): PrecalculateBalancesFromApprovalDetails<U> {
    return new PrecalculateBalancesFromApprovalDetails<U>({
      approvalId: item.approvalId,
      approvalLevel: item.approvalLevel,
      approverAddress: item.approverAddress,
      version: convertFunction(item.version),
      precalculationOptions: item.precalculationOptions ? PrecalculationOptions.fromProto(item.precalculationOptions, convertFunction) : undefined
    });
  }

  toBech32Addresses(prefix: string): PrecalculateBalancesFromApprovalDetails<T> {
    return new PrecalculateBalancesFromApprovalDetails<T>({
      ...this,
      approverAddress: getConvertFunctionFromPrefix(prefix)(this.approverAddress),
      precalculationOptions: this.precalculationOptions ? new PrecalculationOptions(this.precalculationOptions) : undefined
    });
  }
}

/**
 * PrecalculationOptions defines the options for precalculating the balances.
 *
 * @category Approvals / Transferability
 */
export class PrecalculationOptions<T extends NumberType> extends BaseNumberTypeClass<PrecalculationOptions<T>> implements iPrecalculationOptions<T> {
  overrideTimestamp?: T;
  tokenIdsOverride?: UintRangeArray<T>;

  constructor(data: iPrecalculationOptions<T>) {
    super();
    this.overrideTimestamp = data.overrideTimestamp;
    this.tokenIdsOverride = data.tokenIdsOverride ? UintRangeArray.From(data.tokenIdsOverride) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['overrideTimestamp'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PrecalculationOptions<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PrecalculationOptions<U>;
  }

  static fromProto<U extends NumberType>(
    proto: protobadges.PrecalculationOptions,
    convertFunction: (item: NumberType) => U
  ): PrecalculationOptions<U> {
    return new PrecalculationOptions({
      overrideTimestamp: convertFunction(proto.overrideTimestamp),
      tokenIdsOverride: proto.tokenIdsOverride ? UintRangeArray.From(proto.tokenIdsOverride).convert(convertFunction) : undefined
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
  ownershipCheckParty?: string;

  collectionId: string;
  constructor(mustOwnToken: iMustOwnToken<T>) {
    super();
    this.amountRange = new UintRange<T>(mustOwnToken.amountRange);
    this.tokenIds = UintRangeArray.From(mustOwnToken.tokenIds);
    this.overrideWithCurrentTime = mustOwnToken.overrideWithCurrentTime;
    this.mustSatisfyForAllAssets = mustOwnToken.mustSatisfyForAllAssets;
    this.ownershipTimes = UintRangeArray.From(mustOwnToken.ownershipTimes);
    this.ownershipCheckParty = mustOwnToken.ownershipCheckParty;
    this.collectionId = mustOwnToken.collectionId;
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
      ownershipCheckParty: item.ownershipCheckParty,
      collectionId: item.collectionId
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
 * Validates a state transition (old to new) for the timeline, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateIsArchivedUpdate<T extends NumberType>(
  oldIsArchived: boolean,
  newIsArchived: boolean,
  canArchiveCollection: ActionPermission<T>[]
): Error | null {
  // Check if there are any changes
  if (oldIsArchived === newIsArchived) {
    return null; // No changes
  }

  // Check if permission allows the update
  return ActionPermission.check(canArchiveCollection.map((b) => b.convert(BigIntify)));
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
 * Validates a state transition (old to new) for token metadata, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateTokenMetadataUpdate<T extends NumberType>(
  oldTokenMetadata: TokenMetadata<T>[],
  newTokenMetadata: TokenMetadata<T>[],
  canUpdateTokenMetadata: TokenIdsActionPermission<T>[]
): Error | null {
  // Check if there are any changes
  if (JSON.stringify(oldTokenMetadata) === JSON.stringify(newTokenMetadata)) {
    return null; // No changes
  }

  // Extract token IDs from the changes
  const tokenIds: UintRange<bigint>[] = [];
  const oldFirstMatches = GetFirstMatchOnly(castTokenMetadataToUniversalPermission(oldTokenMetadata));
  const newFirstMatches = GetFirstMatchOnly(castTokenMetadataToUniversalPermission(newTokenMetadata));
  const [overlapObjects, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(oldFirstMatches, newFirstMatches);

  for (const overlapObject of overlapObjects) {
    tokenIds.push(overlapObject.overlap.tokenId);
  }
  for (const detail of inOldButNotNew) {
    tokenIds.push(detail.tokenId);
  }
  for (const detail of inNewButNotOld) {
    tokenIds.push(detail.tokenId);
  }

  // Check if permission allows the update for these token IDs
  const details = tokenIds.map((tokenId) => ({
    tokenIds: UintRangeArray.From([tokenId])
  }));

  return TokenIdsActionPermission.check(
    details,
    canUpdateTokenMetadata.map((b) => b.convert(BigIntify))
  );
}

/**
 * Validates a state transition (old to new) for collection metadata, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateCollectionMetadataUpdate<T extends NumberType>(
  oldCollectionMetadata: iCollectionMetadata,
  newCollectionMetadata: iCollectionMetadata,
  canUpdateCollectionMetadata: ActionPermission<T>[]
): Error | null {
  // Check if there are any changes
  if (JSON.stringify(oldCollectionMetadata) === JSON.stringify(newCollectionMetadata)) {
    return null; // No changes
  }

  // Check if permission allows the update
  return ActionPermission.check(canUpdateCollectionMetadata.map((b) => b.convert(BigIntify)));
}

/**
 * Validates a state transition (old to new) for manager, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateManagerUpdate<T extends NumberType>(
  oldManager: BitBadgesAddress,
  newManager: BitBadgesAddress,
  canUpdateManager: ActionPermission<T>[]
): Error | null {
  // Check if there are any changes
  if (oldManager === newManager) {
    return null; // No changes
  }

  // Check if permission allows the update
  return ActionPermission.check(canUpdateManager.map((b) => b.convert(BigIntify)));
}

/**
 * Validates a state transition (old to new) for custom data, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateCustomDataUpdate<T extends NumberType>(
  oldCustomData: string,
  newCustomData: string,
  canUpdateCustomData: ActionPermission<T>[]
): Error | null {
  // Check if there are any changes
  if (oldCustomData === newCustomData) {
    return null; // No changes
  }

  // Check if permission allows the update
  return ActionPermission.check(canUpdateCustomData.map((b) => b.convert(BigIntify)));
}

/**
 * Validates a state transition (old to new) for standards, given the current permissions that are set.
 *
 * @remarks
 * Can also be used via the corresponding wrapper function in BitBadgesCollection
 *
 * @category Timelines
 */
export function validateStandardsUpdate<T extends NumberType>(
  oldStandards: string[],
  newStandards: string[],
  canUpdateStandards: ActionPermission<T>[]
): Error | null {
  // Check if there are any changes
  if (JSON.stringify(oldStandards) === JSON.stringify(newStandards)) {
    return null; // No changes
  }

  // Check if permission allows the update
  return ActionPermission.check(canUpdateStandards.map((b) => b.convert(BigIntify)));
}

/**
 * @inheritDoc iCosmosCoinWrapperPath
 * @category Indexer
 */
export class CosmosCoinWrapperPath<T extends NumberType> extends CustomTypeClass<CosmosCoinWrapperPath<T>> implements iCosmosCoinWrapperPath<T> {
  address: string;
  denom: string;
  conversion: ConversionWithoutDenom<T>;
  symbol: string;
  denomUnits: DenomUnit<T>[];
  allowOverrideWithAnyValidToken: boolean;
  metadata: PathMetadata;

  constructor(data: iCosmosCoinWrapperPath<T>) {
    super();
    this.address = data.address;
    this.denom = data.denom;
    this.conversion = new ConversionWithoutDenom(data.conversion);
    this.symbol = data.symbol;
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnit(unit));
    this.allowOverrideWithAnyValidToken = data.allowOverrideWithAnyValidToken;
    this.metadata = new PathMetadata(data.metadata);
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
      conversion: protoMsg.conversion
        ? ConversionWithoutDenom.fromProto(protoMsg.conversion, convertFunction)
        : { sideA: { amount: convertFunction('0') }, sideB: [] },
      symbol: protoMsg.symbol,
      denomUnits: denomUnits,
      allowOverrideWithAnyValidToken: protoMsg.allowOverrideWithAnyValidToken,
      metadata: protoMsg.metadata ? PathMetadata.fromProto(protoMsg.metadata) : { uri: '', customData: '' }
    }).convert(convertFunction);
  }
}

/**
 * @inheritDoc iAliasPath
 * @category Indexer
 */
export class AliasPath<T extends NumberType> extends CustomTypeClass<AliasPath<T>> implements iAliasPath<T> {
  denom: string;
  conversion: ConversionWithoutDenom<T>;
  symbol: string;
  denomUnits: DenomUnit<T>[];
  metadata: PathMetadata;

  constructor(data: iAliasPath<T>) {
    super();
    this.denom = data.denom;
    this.conversion = new ConversionWithoutDenom(data.conversion);
    this.symbol = data.symbol;
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnit(unit));
    this.metadata = new PathMetadata(data.metadata);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AliasPath<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AliasPath<U>;
  }

  static fromProto<U extends NumberType>(protoMsg: protobadges.AliasPath, convertFunction: (item: NumberType) => U): AliasPath<U> {
    const denomUnits = protoMsg.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction));
    return new AliasPath<NumberType>({
      denom: protoMsg.denom,
      conversion: protoMsg.conversion
        ? ConversionWithoutDenom.fromProto(protoMsg.conversion, convertFunction)
        : { sideA: { amount: convertFunction('0') }, sideB: [] },
      symbol: protoMsg.symbol,
      denomUnits: denomUnits,
      metadata: protoMsg.metadata ? PathMetadata.fromProto(protoMsg.metadata) : { uri: '', customData: '' }
    }).convert(convertFunction);
  }
}

/**
 * @inheritDoc iAliasPathWithDetails
 * @category Indexer
 */
export class AliasPathWithDetails<T extends NumberType> extends AliasPath<T> implements iAliasPathWithDetails<T> {
  override metadata: PathMetadataWithDetails<T>;
  override denomUnits: DenomUnitWithDetails<T>[];
  poolInfos?: PoolInfo<T>[] | undefined;
  assetPairInfos?: AssetInfoDoc<T>[] | undefined;

  constructor(data: iAliasPathWithDetails<T>) {
    super(data);
    this.metadata = new PathMetadataWithDetails(data.metadata);
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnitWithDetails(unit));
    this.poolInfos = data.poolInfos?.map((poolInfo) => {
      return new PoolInfo(poolInfo);
    });
    this.assetPairInfos = data.assetPairInfos?.map((assetPairInfo) => {
      return new AssetInfoDoc(assetPairInfo);
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AliasPathWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AliasPathWithDetails<U>;
  }
}

/**
 * @inheritDoc iCosmosCoinBackedPath
 * @category Core
 */
export class CosmosCoinBackedPath<T extends NumberType> extends CustomTypeClass<CosmosCoinBackedPath<T>> implements iCosmosCoinBackedPath<T> {
  address: string;
  conversion: Conversion<T>;

  constructor(data: iCosmosCoinBackedPath<T>) {
    super();
    this.address = data.address;
    this.conversion = new Conversion(data.conversion);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CosmosCoinBackedPath<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinBackedPath<U>;
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.CosmosCoinBackedPath,
    convertFunction: (item: NumberType) => U
  ): CosmosCoinBackedPath<U> {
    return new CosmosCoinBackedPath<NumberType>({
      address: protoMsg.address,
      conversion: protoMsg.conversion
        ? Conversion.fromProto(protoMsg.conversion, convertFunction)
        : { sideA: { amount: convertFunction('0'), denom: '' }, sideB: [] }
    }).convert(convertFunction);
  }
}

/**
 * @inheritDoc iPoolInfoVolume
 * @category Indexer
 */
export class PoolInfoVolume<T extends NumberType> extends CustomTypeClass<PoolInfoVolume<T>> implements iPoolInfoVolume<T> {
  daily: CosmosCoin<T>[];
  weekly: CosmosCoin<T>[];
  monthly: CosmosCoin<T>[];
  allTime: CosmosCoin<T>[];

  constructor(data: iPoolInfoVolume<T>) {
    super();
    this.daily = data.daily.map((coin) => new CosmosCoin(coin));
    this.weekly = data.weekly.map((coin) => new CosmosCoin(coin));
    this.monthly = data.monthly.map((coin) => new CosmosCoin(coin));
    this.allTime = data.allTime.map((coin) => new CosmosCoin(coin));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PoolInfoVolume<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PoolInfoVolume<U>;
  }
}

/**
 * @inheritDoc iPoolInfo
 * @category Indexer
 */
export class PoolInfo<T extends NumberType> extends CustomTypeClass<PoolInfo<T>> implements iPoolInfo<T> {
  poolId: string;
  address: string;
  allAssetDenoms: string[];
  poolParams?: {
    swapFee: string;
    exitFee: string;
  };
  volume: PoolInfoVolume<T>;
  lastVolumeUpdate: number;
  liquidity: CosmosCoin<T>[];
  lastLiquidityUpdate: number;

  constructor(data: iPoolInfo<T>) {
    super();
    this.poolId = data.poolId;
    this.address = data.address;
    this.allAssetDenoms = data.allAssetDenoms;
    this.poolParams = data.poolParams;
    this.volume = new PoolInfoVolume(data.volume);
    this.lastVolumeUpdate = data.lastVolumeUpdate;
    this.liquidity = data.liquidity.map((coin) => new CosmosCoin(coin));
    this.lastLiquidityUpdate = data.lastLiquidityUpdate;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PoolInfo<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PoolInfo<U>;
  }
}

/**
 * @inheritDoc iAssetInfoDoc
 * @category Indexer
 */
export class AssetInfoDoc<T extends NumberType> extends CustomTypeClass<AssetInfoDoc<T>> implements iAssetInfoDoc<T> {
  _docId: string;
  _id?: string;
  asset: string;
  symbol: string;
  price: number;
  lastUpdated: T;
  totalLiquidity: iCosmosCoin<T>[];
  volume7d: number;
  percentageChange24h: number;
  percentageChange7d: number;
  volume24h: number;
  recentPriceTrend?: {
    pricePoints: Array<{
      price: number;
      timestamp: T;
    }>;
  };
  verified?: boolean;
  calculationType?: string;

  constructor(data: iAssetInfoDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.asset = data.asset;
    this.symbol = data.symbol;
    this.price = data.price;
    this.lastUpdated = data.lastUpdated;
    this.totalLiquidity = data.totalLiquidity.map((coin) => new CosmosCoin(coin));
    this.volume7d = data.volume7d;
    this.volume24h = data.volume24h;
    this.percentageChange24h = data.percentageChange24h;
    this.percentageChange7d = data.percentageChange7d;
    this.recentPriceTrend = data.recentPriceTrend;
    this.verified = data.verified;
    this.calculationType = data.calculationType;
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdated'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AssetInfoDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AssetInfoDoc<U>;
  }
}

/**
 * @inheritDoc iCosmosCoinWrapperPathWithDetails
 * @category Indexer
 */
export class CosmosCoinWrapperPathWithDetails<T extends NumberType> extends CosmosCoinWrapperPath<T> implements iCosmosCoinWrapperPathWithDetails<T> {
  override metadata: PathMetadataWithDetails<T>;
  override denomUnits: DenomUnitWithDetails<T>[];
  poolInfos?: PoolInfo<T>[] | undefined;
  assetPairInfos?: AssetInfoDoc<T>[] | undefined;

  constructor(data: iCosmosCoinWrapperPathWithDetails<T>) {
    super(data);
    this.metadata = new PathMetadataWithDetails(data.metadata);
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnitWithDetails(unit));
    this.poolInfos = data.poolInfos?.map((poolInfo) => {
      return new PoolInfo(poolInfo);
    });
    this.assetPairInfos = data.assetPairInfos?.map((assetPairInfo) => {
      return new AssetInfoDoc(assetPairInfo);
    });
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
      conversion: protoMsg.conversion
        ? ConversionWithoutDenom.fromProto(protoMsg.conversion, convertFunction)
        : { sideA: { amount: convertFunction('0') }, sideB: [] },
      symbol: protoMsg.symbol,
      denomUnits: denomUnits,
      allowOverrideWithAnyValidToken: protoMsg.allowOverrideWithAnyValidToken,
      metadata: protoMsg.metadata ? PathMetadata.fromProto(protoMsg.metadata) : { uri: '', customData: '' }
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
 * Voter defines a voter with their address and weight.
 *
 * @category Approvals / Transferability
 */
export class Voter<T extends NumberType> extends BaseNumberTypeClass<Voter<T>> implements iVoter<T> {
  address: string;
  weight: T;

  constructor(voter: iVoter<T>) {
    super();
    this.address = voter.address;
    this.weight = voter.weight;
  }

  getNumberFieldNames(): string[] {
    return ['weight'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): Voter<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Voter<U>;
  }

  static fromProto<U extends NumberType>(item: protobadges.Voter, convertFunction: (item: NumberType) => U): Voter<U> {
    return new Voter<U>({
      address: item.address,
      weight: convertFunction(item.weight)
    });
  }
}

/**
 * VotingChallenge defines a rule for approval in the form of a voting/multi-sig challenge.
 * Requires a weighted quorum threshold to be met through votes from specified voters.
 * All challenges must be met with valid solutions for the transfer to be approved.
 *
 * IMPORTANT: Votes are stored separately and can be updated. The threshold is calculated as a percentage
 * of total possible weight (all voters), not just voted weight. If you update the proposal ID, then the
 * vote tracker will reset and start a new tally. We recommend using a unique proposal ID for each challenge
 * to prevent overlap and unexpected behavior.
 *
 * @category Approvals / Transferability
 */
export class VotingChallenge<T extends NumberType> extends BaseNumberTypeClass<VotingChallenge<T>> implements iVotingChallenge<T> {
  proposalId: string;
  quorumThreshold: T;
  voters: Voter<T>[];
  uri?: string;
  customData?: string;

  constructor(votingChallenge: iVotingChallenge<T>) {
    super();
    this.proposalId = votingChallenge.proposalId;
    this.quorumThreshold = votingChallenge.quorumThreshold;
    this.voters = votingChallenge.voters.map((voter) => new Voter(voter));
    this.uri = votingChallenge.uri;
    this.customData = votingChallenge.customData;
  }

  getNumberFieldNames(): string[] {
    return ['quorumThreshold'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): VotingChallenge<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as VotingChallenge<U>;
  }

  static fromProto<U extends NumberType>(item: protobadges.VotingChallenge, convertFunction: (item: NumberType) => U): VotingChallenge<U> {
    return new VotingChallenge<U>({
      proposalId: item.proposalId,
      quorumThreshold: convertFunction(item.quorumThreshold),
      voters: item.voters.map((voter) => Voter.fromProto(voter, convertFunction)),
      uri: item.uri || undefined,
      customData: item.customData || undefined
    });
  }
}

/**
 * VoteProof represents a vote cast for a voting challenge.
 *
 * @category Approvals / Transferability
 */
export class VoteProof<T extends NumberType> extends BaseNumberTypeClass<VoteProof<T>> implements iVoteProof<T> {
  proposalId: string;
  voter: string;
  yesWeight: T;

  constructor(voteProof: iVoteProof<T>) {
    super();
    this.proposalId = voteProof.proposalId;
    this.voter = voteProof.voter;
    this.yesWeight = voteProof.yesWeight;
  }

  getNumberFieldNames(): string[] {
    return ['yesWeight'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): VoteProof<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as VoteProof<U>;
  }

  static fromProto<U extends NumberType>(item: protobadges.VoteProof, convertFunction: (item: NumberType) => U): VoteProof<U> {
    return new VoteProof<U>({
      proposalId: item.proposalId,
      voter: item.voter,
      yesWeight: convertFunction(item.yesWeight)
    });
  }
}

/**
 * DynamicStore is a flexible storage object that can store arbitrary data.
 * It is identified by a unique ID assigned by the blockchain, which is a uint64 that increments.
 * Dynamic stores are created by users and can only be updated or deleted by their creator.
 * They provide a way to store custom data on-chain with proper access control.
 *
 * @category Collections
 */
export class DynamicStore<T extends NumberType> extends BaseNumberTypeClass<DynamicStore<T>> implements iDynamicStore<T> {
  storeId: T;
  createdBy: string;
  defaultValue: boolean;
  globalEnabled: boolean;
  uri: string;
  customData: string;

  constructor(dynamicStore: iDynamicStore<T>) {
    super();
    this.storeId = dynamicStore.storeId;
    this.createdBy = dynamicStore.createdBy;
    this.defaultValue = dynamicStore.defaultValue;
    this.globalEnabled = dynamicStore.globalEnabled;
    this.uri = dynamicStore.uri;
    this.customData = dynamicStore.customData;
  }

  getNumberFieldNames(): string[] {
    return ['storeId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): DynamicStore<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicStore<U>;
  }

  static fromProto<U extends NumberType>(item: protobadgesDynamicStores.DynamicStore, convertFunction: (item: NumberType) => U): DynamicStore<U> {
    return new DynamicStore<U>({
      storeId: convertFunction(item.storeId),
      createdBy: item.createdBy,
      defaultValue: item.defaultValue,
      globalEnabled: item.globalEnabled,
      uri: item.uri,
      customData: item.customData
    });
  }

  toProto(): protobadgesDynamicStores.DynamicStore {
    return new protobadgesDynamicStores.DynamicStore(this.convert(Stringify));
  }
}

/**
 * DynamicStoreValue stores a boolean value for a specific address in a dynamic store.
 * This allows the creator to set true/false values per address that can be checked during approval.
 *
 * @category Collections
 */
export class DynamicStoreValue<T extends NumberType> extends BaseNumberTypeClass<DynamicStoreValue<T>> implements iDynamicStoreValue<T> {
  storeId: T;
  address: string;
  value: boolean;

  constructor(dynamicStoreValue: iDynamicStoreValue<T>) {
    super();
    this.storeId = dynamicStoreValue.storeId;
    this.address = dynamicStoreValue.address;
    this.value = dynamicStoreValue.value;
  }

  getNumberFieldNames(): string[] {
    return ['storeId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): DynamicStoreValue<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicStoreValue<U>;
  }

  static fromProto<U extends NumberType>(
    item: protobadgesDynamicStores.DynamicStoreValue,
    convertFunction: (item: NumberType) => U
  ): DynamicStoreValue<U> {
    return new DynamicStoreValue<U>({
      storeId: convertFunction(item.storeId),
      address: item.address,
      value: item.value
    });
  }

  toProto(): protobadgesDynamicStores.DynamicStoreValue {
    return new protobadgesDynamicStores.DynamicStoreValue(this.convert(Stringify));
  }
}

/**
 * CollectionInvariants defines the invariants that apply to a collection.
 * These are set upon genesis and cannot be modified.
 *
 * @category Interfaces
 */
export class CollectionInvariants<T extends NumberType> extends BaseNumberTypeClass<CollectionInvariants<T>> implements iCollectionInvariants<T> {
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
  cosmosCoinBackedPath?: CosmosCoinBackedPath<T>;

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

  constructor(data: iCollectionInvariants<T>) {
    super();
    this.noCustomOwnershipTimes = data.noCustomOwnershipTimes;
    this.maxSupplyPerId = data.maxSupplyPerId;
    this.cosmosCoinBackedPath = data.cosmosCoinBackedPath ? new CosmosCoinBackedPath(data.cosmosCoinBackedPath) : undefined;
    this.noForcefulPostMintTransfers = data.noForcefulPostMintTransfers;
    this.disablePoolCreation = data.disablePoolCreation;
  }

  getNumberFieldNames(): string[] {
    return ['maxSupplyPerId']; // Include number fields
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionInvariants<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionInvariants<U>;
  }

  toProto(): protobadges.CollectionInvariants {
    return new protobadges.CollectionInvariants({
      noCustomOwnershipTimes: this.noCustomOwnershipTimes,
      maxSupplyPerId: this.maxSupplyPerId.toString(),
      cosmosCoinBackedPath: this.cosmosCoinBackedPath
        ? new protobadges.CosmosCoinBackedPath({
            address: this.cosmosCoinBackedPath.address,
            conversion: this.cosmosCoinBackedPath.conversion ? this.cosmosCoinBackedPath.conversion.toProto() : undefined
          })
        : undefined,
      noForcefulPostMintTransfers: this.noForcefulPostMintTransfers,
      disablePoolCreation: this.disablePoolCreation
    });
  }

  static fromJson<T extends NumberType>(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CollectionInvariants<T> {
    return CollectionInvariants.fromProto(protobadges.CollectionInvariants.fromJson(jsonValue, options), (val: NumberType) => val as T);
  }

  static fromJsonString<T extends NumberType>(jsonString: string, options?: Partial<JsonReadOptions>): CollectionInvariants<T> {
    return CollectionInvariants.fromProto(protobadges.CollectionInvariants.fromJsonString(jsonString, options), (val: NumberType) => val as T);
  }

  static fromProto<T extends NumberType>(item: protobadges.CollectionInvariants, convertFunction: (val: NumberType) => T): CollectionInvariants<T> {
    return new CollectionInvariants({
      noCustomOwnershipTimes: item.noCustomOwnershipTimes,
      maxSupplyPerId: convertFunction(item.maxSupplyPerId),
      cosmosCoinBackedPath: item.cosmosCoinBackedPath ? CosmosCoinBackedPath.fromProto(item.cosmosCoinBackedPath, convertFunction) : undefined,
      noForcefulPostMintTransfers: item.noForcefulPostMintTransfers,
      disablePoolCreation: item.disablePoolCreation
    });
  }
}
