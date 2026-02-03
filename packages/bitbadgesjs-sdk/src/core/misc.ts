import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type { BitBadgesAddress, iAliasPath, iAliasPathWithDetails, iAssetInfoDoc, iCosmosCoinWrapperPath, iCosmosCoinWrapperPathWithDetails, iPoolInfo, iPoolInfoVolume, iUpdateHistory, UNIXMilliTimestamp } from '@/api-indexer/docs-types/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, CustomTypeClass, deepCopyPrimitives } from '@/common/base.js';
import { Conversion, ConversionWithoutDenom, DenomUnit, DenomUnitWithDetails, PathMetadata, PathMetadataWithDetails } from '@/core/ibc-wrappers.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers.js';
import type { CollectionId, iAmountTrackerIdDetails, iApprovalIdentifierDetails, iCoinTransfer, iCollectionInvariants, iCollectionMetadata, iCosmosCoinBackedPath, iDynamicStore, iDynamicStoreValue, iETHSignatureChallenge, iETHSignatureProof, iMerkleChallenge, iMerklePathItem, iMerkleProof, iMustOwnToken, iMustOwnTokens, iPathMetadata, iPrecalculateBalancesFromApprovalDetails, iPrecalculationOptions, iTokenMetadata, iVoter, iVoteProof, iVotingChallenge } from '../interfaces/types/core.js';
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
export class TokenMetadata extends BaseNumberTypeClass<TokenMetadata> implements iTokenMetadata {
  uri: string;
  tokenIds: UintRangeArray;
  customData: string;

  constructor(tokenMetadata: iTokenMetadata) {
    super();
    this.uri = tokenMetadata.uri;
    this.tokenIds = UintRangeArray.From(tokenMetadata.tokenIds);
    this.customData = tokenMetadata.customData;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): TokenMetadata {
    return new TokenMetadata(
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

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): TokenMetadata {
    return TokenMetadata.fromProto(protobadges.TokenMetadata.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): TokenMetadata {
    return TokenMetadata.fromProto(protobadges.TokenMetadata.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.TokenMetadata, convertFunction: (item: string | number) => U): TokenMetadata {
    return new TokenMetadata({
      uri: item.uri,
      tokenIds: item.tokenIds.map((b) => UintRange.fromProto(b, convertFunction)),
      customData: item.customData
    });
  }

  /**
   * Get first matches for the token metadata (i.e. if there are duplicated token IDs, we take the first match in a linear search).
   */
  static getFirstMatches(tokenMetadata: TokenMetadata[]): TokenMetadata[] {
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
export class CoinTransfer extends BaseNumberTypeClass<CoinTransfer> implements iCoinTransfer {
  to: BitBadgesAddress;
  coins: CosmosCoin[];
  overrideFromWithApproverAddress: boolean;
  overrideToWithInitiator: boolean;

  constructor(coinTransfer: iCoinTransfer) {
    super();
    this.to = coinTransfer.to;
    this.coins = coinTransfer.coins.map((b) => new CosmosCoin(b));
    this.overrideFromWithApproverAddress = coinTransfer.overrideFromWithApproverAddress;
    this.overrideToWithInitiator = coinTransfer.overrideToWithInitiator;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CoinTransfer {
    return new CoinTransfer({
      to: this.to,
      coins: this.coins.map((b) => b.convert(convertFunction)),
      overrideFromWithApproverAddress: this.overrideFromWithApproverAddress,
      overrideToWithInitiator: this.overrideToWithInitiator
    });
  }

  toProto(): protobadges.CoinTransfer {
    return new protobadges.CoinTransfer(this.convert(Stringify));
  }

  static fromProto(item: protobadges.CoinTransfer, convertFunction: (item: string | number) => U): CoinTransfer {
    return new CoinTransfer({
      to: item.to,
      coins: item.coins.map((b) => CosmosCoin.fromProto(b, convertFunction)),
      overrideFromWithApproverAddress: item.overrideFromWithApproverAddress,
      overrideToWithInitiator: item.overrideToWithInitiator
    });
  }

  toBech32Addresses(prefix: string): CoinTransfer {
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
export class ApprovalIdentifierDetails extends BaseNumberTypeClass<ApprovalIdentifierDetails> implements iApprovalIdentifierDetails {
  approvalId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  version: string | number;
  constructor(approvalIdDetails: iApprovalIdentifierDetails) {
    super();
    this.approvalId = approvalIdDetails.approvalId;
    this.approvalLevel = approvalIdDetails.approvalLevel;
    this.approverAddress = approvalIdDetails.approverAddress;
    this.version = approvalIdDetails.version;
  }

  getNumberFieldNames(): string[] {
    return ['version'];
  }

  static required(): ApprovalIdentifierDetails {
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

  clone(): ApprovalIdentifierDetails {
    return new ApprovalIdentifierDetails({ ...this });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ApprovalIdentifierDetails {
    return ApprovalIdentifierDetails.fromProto(protobadges.ApprovalIdentifierDetails.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ApprovalIdentifierDetails {
    return ApprovalIdentifierDetails.fromProto(protobadges.ApprovalIdentifierDetails.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.ApprovalIdentifierDetails, convertFunction: (item: string | number) => U): ApprovalIdentifierDetails {
    return new ApprovalIdentifierDetails({
      approvalId: item.approvalId,
      approvalLevel: item.approvalLevel,
      approverAddress: item.approverAddress,
      version: convertFunction(item.version)
    });
  }

  toBech32Addresses(prefix: string): ApprovalIdentifierDetails {
    return new ApprovalIdentifierDetails({
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
export class PrecalculateBalancesFromApprovalDetails extends BaseNumberTypeClass<PrecalculateBalancesFromApprovalDetails> implements iPrecalculateBalancesFromApprovalDetails {
  approvalId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  version: string | number;
  precalculationOptions?: PrecalculationOptions;

  constructor(data: iPrecalculateBalancesFromApprovalDetails) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PrecalculateBalancesFromApprovalDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PrecalculateBalancesFromApprovalDetails;
  }

  toProto(): protobadges.PrecalculateBalancesFromApprovalDetails {
    return new protobadges.PrecalculateBalancesFromApprovalDetails(this.convert(Stringify).toJson());
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): PrecalculateBalancesFromApprovalDetails {
    return PrecalculateBalancesFromApprovalDetails.fromProto(protobadges.PrecalculateBalancesFromApprovalDetails.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): PrecalculateBalancesFromApprovalDetails {
    return PrecalculateBalancesFromApprovalDetails.fromProto(protobadges.PrecalculateBalancesFromApprovalDetails.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.PrecalculateBalancesFromApprovalDetails, convertFunction: (item: string | number) => U): PrecalculateBalancesFromApprovalDetails {
    return new PrecalculateBalancesFromApprovalDetails({
      approvalId: item.approvalId,
      approvalLevel: item.approvalLevel,
      approverAddress: item.approverAddress,
      version: convertFunction(item.version),
      precalculationOptions: item.precalculationOptions ? PrecalculationOptions.fromProto(item.precalculationOptions, convertFunction) : undefined
    });
  }

  toBech32Addresses(prefix: string): PrecalculateBalancesFromApprovalDetails {
    return new PrecalculateBalancesFromApprovalDetails({
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
export class PrecalculationOptions extends BaseNumberTypeClass<PrecalculationOptions> implements iPrecalculationOptions {
  overrideTimestamp?: string | number;
  tokenIdsOverride?: UintRangeArray;

  constructor(data: iPrecalculationOptions) {
    super();
    this.overrideTimestamp = data.overrideTimestamp;
    this.tokenIdsOverride = data.tokenIdsOverride ? UintRangeArray.From(data.tokenIdsOverride) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['overrideTimestamp'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PrecalculationOptions {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PrecalculationOptions;
  }

  static fromProto(proto: protobadges.PrecalculationOptions, convertFunction: (item: string | number) => U): PrecalculationOptions {
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
export class AmountTrackerIdDetails extends BaseNumberTypeClass<AmountTrackerIdDetails> implements iAmountTrackerIdDetails {
  collectionId: CollectionId;
  amountTrackerId: string;
  approvalId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  trackerType: string;
  approvedAddress: BitBadgesAddress;

  constructor(approvalIdDetails: iAmountTrackerIdDetails) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AmountTrackerIdDetails {
    return new AmountTrackerIdDetails(
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
export class MustOwnTokens extends BaseNumberTypeClass<MustOwnTokens> implements iMustOwnTokens {
  amountRange: UintRange;
  tokenIds: UintRangeArray;
  overrideWithCurrentTime: boolean;
  mustSatisfyForAllAssets: boolean;
  ownershipTimes: UintRangeArray;
  ownershipCheckParty?: string;

  collectionId: string;
  constructor(mustOwnToken: iMustOwnToken) {
    super();
    this.amountRange = new UintRange(mustOwnToken.amountRange);
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MustOwnTokens {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MustOwnTokens;
  }

  toProto(): protobadges.MustOwnTokens {
    return new protobadges.MustOwnTokens(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MustOwnTokens {
    return MustOwnTokens.fromProto(protobadges.MustOwnTokens.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MustOwnTokens {
    return MustOwnTokens.fromProto(protobadges.MustOwnTokens.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.MustOwnTokens, convertFunction: (item: string | number) => U): MustOwnTokens {
    return new MustOwnTokens({
      amountRange: item.amountRange ? new UintRange(item.amountRange).convert(convertFunction) : new UintRange({ start: 0n, end: 0n }).convert(convertFunction),
      tokenIds: item.tokenIds ? UintRangeArray.From(item.tokenIds).convert(convertFunction) : new UintRangeArray(),
      overrideWithCurrentTime: item.overrideWithCurrentTime,
      mustSatisfyForAllAssets: item.mustSatisfyForAllAssets,
      ownershipTimes: item.ownershipTimes ? UintRangeArray.From(item.ownershipTimes).convert(convertFunction) : new UintRangeArray(),
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
export class MerkleChallenge extends BaseNumberTypeClass<MerkleChallenge> implements iMerkleChallenge {
  root: string;
  expectedProofLength: string | number;
  useCreatorAddressAsLeaf: boolean;
  maxUsesPerLeaf: string | number;
  uri: string;
  customData: string;
  challengeTrackerId: string;
  leafSigner: string;

  constructor(merkleChallenge: iMerkleChallenge) {
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

  static required(): MerkleChallenge {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MerkleChallenge {
    return new MerkleChallenge(
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

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MerkleChallenge {
    return MerkleChallenge.fromProto(protobadges.MerkleChallenge.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MerkleChallenge {
    return MerkleChallenge.fromProto(protobadges.MerkleChallenge.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.MerkleChallenge, convertFunction: (item: string | number) => U): MerkleChallenge {
    return new MerkleChallenge({
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
export function validateIsArchivedUpdate(oldIsArchived: boolean, newIsArchived: boolean, canArchiveCollection: ActionPermission[]): Error | null {
  // Check if there are any changes
  if (oldIsArchived === newIsArchived) {
    return null; // No changes
  }

  // Check if permission allows the update
  return ActionPermission.check(canArchiveCollection.map((b) => b.convert(BigIntify)));
}

const castTokenMetadataToUniversalPermission = (tokenMetadata: TokenMetadata[]): UniversalPermission[] => {
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
export function validateTokenMetadataUpdate(oldTokenMetadata: TokenMetadata[], newTokenMetadata: TokenMetadata[], canUpdateTokenMetadata: TokenIdsActionPermission[]): Error | null {
  // Check if there are any changes
  if (JSON.stringify(oldTokenMetadata) === JSON.stringify(newTokenMetadata)) {
    return null; // No changes
  }

  // Extract token IDs from the changes
  const tokenIds: UintRange[] = [];
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
export function validateCollectionMetadataUpdate(oldCollectionMetadata: iCollectionMetadata, newCollectionMetadata: iCollectionMetadata, canUpdateCollectionMetadata: ActionPermission[]): Error | null {
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
export function validateManagerUpdate(oldManager: BitBadgesAddress, newManager: BitBadgesAddress, canUpdateManager: ActionPermission[]): Error | null {
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
export function validateCustomDataUpdate(oldCustomData: string, newCustomData: string, canUpdateCustomData: ActionPermission[]): Error | null {
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
export function validateStandardsUpdate(oldStandards: string[], newStandards: string[], canUpdateStandards: ActionPermission[]): Error | null {
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
export class CosmosCoinWrapperPath extends CustomTypeClass<CosmosCoinWrapperPath> implements iCosmosCoinWrapperPath {
  address: string;
  denom: string;
  conversion: ConversionWithoutDenom;
  symbol: string;
  denomUnits: DenomUnit[];
  allowOverrideWithAnyValidToken: boolean;
  metadata: PathMetadata;

  constructor(data: iCosmosCoinWrapperPath) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CosmosCoinWrapperPath {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinWrapperPath;
  }

  static fromProto(protoMsg: protobadges.CosmosCoinWrapperPath, convertFunction: (item: string | number) => U): CosmosCoinWrapperPath {
    const denomUnits = protoMsg.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction));
    return new CosmosCoinWrapperPath({
      address: protoMsg.address,
      denom: protoMsg.denom,
      conversion: protoMsg.conversion ? ConversionWithoutDenom.fromProto(protoMsg.conversion, convertFunction) : { sideA: { amount: convertFunction('0') }, sideB: [] },
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
export class AliasPath extends CustomTypeClass<AliasPath> implements iAliasPath {
  denom: string;
  conversion: ConversionWithoutDenom;
  symbol: string;
  denomUnits: DenomUnit[];
  metadata: PathMetadata;

  constructor(data: iAliasPath) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AliasPath {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AliasPath;
  }

  static fromProto(protoMsg: protobadges.AliasPath, convertFunction: (item: string | number) => U): AliasPath {
    const denomUnits = protoMsg.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction));
    return new AliasPath({
      denom: protoMsg.denom,
      conversion: protoMsg.conversion ? ConversionWithoutDenom.fromProto(protoMsg.conversion, convertFunction) : { sideA: { amount: convertFunction('0') }, sideB: [] },
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
export class AliasPathWithDetails extends AliasPath implements iAliasPathWithDetails {
  override metadata: PathMetadataWithDetails;
  override denomUnits: DenomUnitWithDetails[];
  poolInfos?: PoolInfo[] | undefined;
  assetPairInfos?: AssetInfoDoc[] | undefined;

  constructor(data: iAliasPathWithDetails) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AliasPathWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AliasPathWithDetails;
  }
}

/**
 * @inheritDoc iCosmosCoinBackedPath
 * @category Core
 */
export class CosmosCoinBackedPath extends CustomTypeClass<CosmosCoinBackedPath> implements iCosmosCoinBackedPath {
  address: string;
  conversion: Conversion;

  constructor(data: iCosmosCoinBackedPath) {
    super();
    this.address = data.address;
    this.conversion = new Conversion(data.conversion);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CosmosCoinBackedPath {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinBackedPath;
  }

  static fromProto(protoMsg: protobadges.CosmosCoinBackedPath, convertFunction: (item: string | number) => U): CosmosCoinBackedPath {
    return new CosmosCoinBackedPath({
      address: protoMsg.address,
      conversion: protoMsg.conversion ? Conversion.fromProto(protoMsg.conversion, convertFunction) : { sideA: { amount: convertFunction('0'), denom: '' }, sideB: [] }
    }).convert(convertFunction);
  }
}

/**
 * @inheritDoc iPoolInfoVolume
 * @category Indexer
 */
export class PoolInfoVolume extends CustomTypeClass<PoolInfoVolume> implements iPoolInfoVolume {
  daily: CosmosCoin[];
  weekly: CosmosCoin[];
  monthly: CosmosCoin[];
  allTime: CosmosCoin[];

  constructor(data: iPoolInfoVolume) {
    super();
    this.daily = data.daily.map((coin) => new CosmosCoin(coin));
    this.weekly = data.weekly.map((coin) => new CosmosCoin(coin));
    this.monthly = data.monthly.map((coin) => new CosmosCoin(coin));
    this.allTime = data.allTime.map((coin) => new CosmosCoin(coin));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PoolInfoVolume {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PoolInfoVolume;
  }
}

/**
 * @inheritDoc iPoolInfo
 * @category Indexer
 */
export class PoolInfo extends CustomTypeClass<PoolInfo> implements iPoolInfo {
  poolId: string;
  address: string;
  allAssetDenoms: string[];
  poolParams?: {
    swapFee: string;
    exitFee: string;
  };
  volume: PoolInfoVolume;
  lastVolumeUpdate: number;
  liquidity: CosmosCoin[];
  lastLiquidityUpdate: number;

  constructor(data: iPoolInfo) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PoolInfo {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PoolInfo;
  }
}

/**
 * @inheritDoc iAssetInfoDoc
 * @category Indexer
 */
export class AssetInfoDoc extends CustomTypeClass<AssetInfoDoc> implements iAssetInfoDoc {
  _docId: string;
  _id?: string;
  asset: string;
  symbol: string;
  price: number;
  lastUpdated: string | number;
  totalLiquidity: iCosmosCoin[];
  volume7d: number;
  percentageChange24h: number;
  percentageChange7d: number;
  volume24h: number;
  recentPriceTrend?: {
    pricePoints: Array<{
      price: number;
      timestamp: string | number;
    }>;
  };
  verified?: boolean;
  calculationType?: string;

  constructor(data: iAssetInfoDoc) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AssetInfoDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AssetInfoDoc;
  }
}

/**
 * @inheritDoc iCosmosCoinWrapperPathWithDetails
 * @category Indexer
 */
export class CosmosCoinWrapperPathWithDetails extends CosmosCoinWrapperPath implements iCosmosCoinWrapperPathWithDetails {
  override metadata: PathMetadataWithDetails;
  override denomUnits: DenomUnitWithDetails[];
  poolInfos?: PoolInfo[] | undefined;
  assetPairInfos?: AssetInfoDoc[] | undefined;

  constructor(data: iCosmosCoinWrapperPathWithDetails) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CosmosCoinWrapperPathWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinWrapperPathWithDetails;
  }

  static fromProto(protoMsg: protobadges.CosmosCoinWrapperPath, convertFunction: (item: string | number) => U): CosmosCoinWrapperPathWithDetails {
    const denomUnits = protoMsg.denomUnits.map((unit) => DenomUnitWithDetails.fromProto(unit, convertFunction));
    return new CosmosCoinWrapperPathWithDetails({
      address: protoMsg.address,
      denom: protoMsg.denom,
      conversion: protoMsg.conversion ? ConversionWithoutDenom.fromProto(protoMsg.conversion, convertFunction) : { sideA: { amount: convertFunction('0') }, sideB: [] },
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
export class UpdateHistory extends BaseNumberTypeClass<UpdateHistory> implements iUpdateHistory {
  txHash: string;
  block: string | number;
  blockTimestamp: UNIXMilliTimestamp;
  timestamp: UNIXMilliTimestamp;

  constructor(data: iUpdateHistory) {
    super();
    this.txHash = data.txHash;
    this.block = data.block;
    this.blockTimestamp = data.blockTimestamp;
    this.timestamp = data.timestamp;
  }

  getNumberFieldNames(): string[] {
    return ['block', 'blockTimestamp', 'timestamp'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UpdateHistory {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UpdateHistory;
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ETHSignatureChallenge {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ETHSignatureProof {
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
export class Voter extends BaseNumberTypeClass<Voter> implements iVoter {
  address: string;
  weight: string | number;

  constructor(voter: iVoter) {
    super();
    this.address = voter.address;
    this.weight = voter.weight;
  }

  getNumberFieldNames(): string[] {
    return ['weight'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): Voter {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Voter;
  }

  static fromProto(item: protobadges.Voter, convertFunction: (item: string | number) => U): Voter {
    return new Voter({
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
export class VotingChallenge extends BaseNumberTypeClass<VotingChallenge> implements iVotingChallenge {
  proposalId: string;
  quorumThreshold: string | number;
  voters: Voter[];
  uri?: string;
  customData?: string;

  constructor(votingChallenge: iVotingChallenge) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): VotingChallenge {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as VotingChallenge;
  }

  static fromProto(item: protobadges.VotingChallenge, convertFunction: (item: string | number) => U): VotingChallenge {
    return new VotingChallenge({
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
export class VoteProof extends BaseNumberTypeClass<VoteProof> implements iVoteProof {
  proposalId: string;
  voter: string;
  yesWeight: string | number;

  constructor(voteProof: iVoteProof) {
    super();
    this.proposalId = voteProof.proposalId;
    this.voter = voteProof.voter;
    this.yesWeight = voteProof.yesWeight;
  }

  getNumberFieldNames(): string[] {
    return ['yesWeight'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): VoteProof {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as VoteProof;
  }

  static fromProto(item: protobadges.VoteProof, convertFunction: (item: string | number) => U): VoteProof {
    return new VoteProof({
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
export class DynamicStore extends BaseNumberTypeClass<DynamicStore> implements iDynamicStore {
  storeId: string | number;
  createdBy: string;
  defaultValue: boolean;
  globalEnabled: boolean;
  uri: string;
  customData: string;

  constructor(dynamicStore: iDynamicStore) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): DynamicStore {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicStore;
  }

  static fromProto(item: protobadgesDynamicStores.DynamicStore, convertFunction: (item: string | number) => U): DynamicStore {
    return new DynamicStore({
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
export class DynamicStoreValue extends BaseNumberTypeClass<DynamicStoreValue> implements iDynamicStoreValue {
  storeId: string | number;
  address: string;
  value: boolean;

  constructor(dynamicStoreValue: iDynamicStoreValue) {
    super();
    this.storeId = dynamicStoreValue.storeId;
    this.address = dynamicStoreValue.address;
    this.value = dynamicStoreValue.value;
  }

  getNumberFieldNames(): string[] {
    return ['storeId'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): DynamicStoreValue {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicStoreValue;
  }

  static fromProto(item: protobadgesDynamicStores.DynamicStoreValue, convertFunction: (item: string | number) => U): DynamicStoreValue {
    return new DynamicStoreValue({
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
export class CollectionInvariants extends BaseNumberTypeClass<CollectionInvariants> implements iCollectionInvariants {
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
  cosmosCoinBackedPath?: CosmosCoinBackedPath;

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

  constructor(data: iCollectionInvariants) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CollectionInvariants {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionInvariants;
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

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CollectionInvariants {
    return CollectionInvariants.fromProto(protobadges.CollectionInvariants.fromJson(jsonValue, options), (val: string | number) => val as T);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CollectionInvariants {
    return CollectionInvariants.fromProto(protobadges.CollectionInvariants.fromJsonString(jsonString, options), (val: string | number) => val as T);
  }

  static fromProto(item: protobadges.CollectionInvariants, convertFunction: (val: string | number) => T): CollectionInvariants {
    return new CollectionInvariants({
      noCustomOwnershipTimes: item.noCustomOwnershipTimes,
      maxSupplyPerId: convertFunction(item.maxSupplyPerId),
      cosmosCoinBackedPath: item.cosmosCoinBackedPath ? CosmosCoinBackedPath.fromProto(item.cosmosCoinBackedPath, convertFunction) : undefined,
      noForcefulPostMintTransfers: item.noForcefulPostMintTransfers,
      disablePoolCreation: item.disablePoolCreation
    });
  }
}
