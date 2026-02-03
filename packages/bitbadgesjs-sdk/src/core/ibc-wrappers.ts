import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, CustomTypeClass } from '@/common/base.js';
import { iConversion, iConversionSideA, iConversionSideAWithDenom, iConversionWithoutDenom, iCosmosCoinBackedPathAddObject, iCosmosCoinWrapperPathAddObject, iAliasPathAddObject, iDenomUnit, iDenomUnitWithDetails, iInvariantsAddObject, iPathMetadata, iPathMetadataWithDetails } from '@/interfaces/types/core.js';
import { badges as protobadges } from '@/proto/index.js';
import type { NumberType } from '../common/string-numbers.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { Balance } from './balances.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';

/**
 * @category Interfaces
 */
export class ConversionSideAWithDenom extends BaseNumberTypeClass<ConversionSideAWithDenom> implements iConversionSideAWithDenom {
  amount: string | number;
  denom: string;

  constructor(data: iConversionSideAWithDenom) {
    super();
    this.amount = data.amount;
    this.denom = data.denom;
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ConversionSideAWithDenom {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ConversionSideAWithDenom;
  }

  static fromProto(data: protobadges.ConversionSideAWithDenom, convertFunction: (val: string | number) => T): ConversionSideAWithDenom {
    return new ConversionSideAWithDenom({
      amount: convertFunction(data.amount),
      denom: data.denom
    });
  }
}

/**
 * @category Interfaces
 */
export class ConversionSideA extends BaseNumberTypeClass<ConversionSideA> implements iConversionSideA {
  amount: string | number;

  constructor(data: iConversionSideA) {
    super();
    this.amount = data.amount;
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ConversionSideA {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ConversionSideA;
  }

  static fromProto(data: protobadges.ConversionSideA, convertFunction: (val: string | number) => T): ConversionSideA {
    return new ConversionSideA({
      amount: convertFunction(data.amount)
    });
  }
}

/**
 * @category Interfaces
 */
export class Conversion extends BaseNumberTypeClass<Conversion> implements iConversion {
  sideA: ConversionSideAWithDenom;
  sideB: Balance[];

  constructor(data: iConversion) {
    super();
    this.sideA = new ConversionSideAWithDenom(data.sideA);
    this.sideB = data.sideB.map((balance) => new Balance(balance));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): Conversion {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Conversion;
  }

  static fromProto(data: protobadges.Conversion, convertFunction: (val: string | number) => T): Conversion {
    return new Conversion({
      sideA: data.sideA ? ConversionSideAWithDenom.fromProto(data.sideA, convertFunction) : { amount: convertFunction('0'), denom: '' },
      sideB: data.sideB.map((balance) => Balance.fromProto(balance, convertFunction))
    });
  }

  toProto(): protobadges.Conversion {
    return new protobadges.Conversion({
      sideA: this.sideA
        ? new protobadges.ConversionSideAWithDenom({
            amount: this.sideA.amount.toString(),
            denom: this.sideA.denom
          })
        : undefined,
      sideB: this.sideB.map((balance) => balance.toProto())
    });
  }
}

/**
 * @category Interfaces
 */
export class ConversionWithoutDenom extends BaseNumberTypeClass<ConversionWithoutDenom> implements iConversionWithoutDenom {
  sideA: ConversionSideA;
  sideB: Balance[];

  constructor(data: iConversionWithoutDenom) {
    super();
    this.sideA = new ConversionSideA(data.sideA);
    this.sideB = data.sideB.map((balance) => new Balance(balance));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ConversionWithoutDenom {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ConversionWithoutDenom;
  }

  static fromProto(data: protobadges.ConversionWithoutDenom, convertFunction: (val: string | number) => T): ConversionWithoutDenom {
    return new ConversionWithoutDenom({
      sideA: data.sideA ? ConversionSideA.fromProto(data.sideA, convertFunction) : { amount: convertFunction('0') },
      sideB: data.sideB.map((balance) => Balance.fromProto(balance, convertFunction))
    });
  }

  toProto(): protobadges.ConversionWithoutDenom {
    return new protobadges.ConversionWithoutDenom({
      sideA: this.sideA
        ? new protobadges.ConversionSideA({
            amount: this.sideA.amount.toString()
          })
        : undefined,
      sideB: this.sideB.map((balance) => balance.toProto())
    });
  }
}

/**
 * @category Interfaces
 */
export class DenomUnit extends BaseNumberTypeClass<DenomUnit> implements iDenomUnit {
  decimals: string | number;
  symbol: string;
  isDefaultDisplay: boolean;
  metadata: PathMetadata;

  constructor(data: iDenomUnit) {
    super();
    this.decimals = data.decimals;
    this.symbol = data.symbol;
    this.isDefaultDisplay = data.isDefaultDisplay;
    this.metadata = new PathMetadata(data.metadata);
  }

  getNumberFieldNames(): string[] {
    return ['decimals'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): DenomUnit {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DenomUnit;
  }

  static fromProto(data: protobadges.DenomUnit, convertFunction: (val: string | number) => T): DenomUnit {
    return new DenomUnit({
      decimals: convertFunction(data.decimals),
      symbol: data.symbol,
      isDefaultDisplay: data.isDefaultDisplay,
      metadata: data.metadata ? PathMetadata.fromProto(data.metadata) : { uri: '', customData: '' }
    });
  }
}

/**
 * PathMetadata represents the metadata for paths (alias paths and cosmos coin wrapper paths).
 *
 * @category Collections
 */
export class PathMetadata extends CustomTypeClass<PathMetadata> implements iPathMetadata {
  uri: string;
  customData: string;

  constructor(pathMetadata: iPathMetadata) {
    super();
    this.uri = pathMetadata.uri;
    this.customData = pathMetadata.customData;
  }

  toProto(): protobadges.PathMetadata {
    return new protobadges.PathMetadata({
      uri: this.uri,
      customData: this.customData
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PathMetadata {
    return PathMetadata.fromProto(protobadges.PathMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PathMetadata {
    return PathMetadata.fromProto(protobadges.PathMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.PathMetadata): PathMetadata {
    return new PathMetadata({
      uri: item.uri,
      customData: item.customData
    });
  }
}

/**
 * PathMetadataWithDetails represents the metadata for paths with fetched metadata details.
 *
 * @category Collections
 */
export class PathMetadataWithDetails extends PathMetadata implements iPathMetadataWithDetails {
  metadata?: Metadata;

  constructor(pathMetadata: iPathMetadataWithDetails) {
    super(pathMetadata);
    this.metadata = pathMetadata.metadata ? new Metadata(pathMetadata.metadata) : undefined;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PathMetadataWithDetails {
    return new PathMetadataWithDetails({
      uri: this.uri,
      customData: this.customData,
      metadata: this.metadata ? this.metadata.convert(convertFunction, options) : undefined
    });
  }
}

/**
 * @inheritDoc iDenomUnitWithDetails
 * @category Interfaces
 */
export class DenomUnitWithDetails extends DenomUnit implements iDenomUnitWithDetails {
  override metadata: PathMetadataWithDetails;

  constructor(data: iDenomUnitWithDetails) {
    super(data);
    this.metadata = new PathMetadataWithDetails(data.metadata);
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): DenomUnitWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DenomUnitWithDetails;
  }

  static fromProto(data: protobadges.DenomUnit, convertFunction: (val: string | number) => T): DenomUnitWithDetails {
    return new DenomUnitWithDetails({
      decimals: convertFunction(data.decimals),
      symbol: data.symbol,
      isDefaultDisplay: data.isDefaultDisplay,
      metadata: data.metadata
        ? {
            uri: data.metadata.uri,
            customData: data.metadata.customData,
            metadata: undefined
          }
        : { uri: '', customData: '', metadata: undefined }
    });
  }
}

/**
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'ubadge' }).
 *
 * @category Balances
 */
export class CosmosCoinWrapperPathAddObject extends BaseNumberTypeClass<CosmosCoinWrapperPathAddObject> implements iCosmosCoinWrapperPathAddObject {
  denom: string;
  conversion: ConversionWithoutDenom;
  symbol: string;
  denomUnits: DenomUnit[];
  allowOverrideWithAnyValidToken: boolean;
  metadata: PathMetadata;

  constructor(data: iCosmosCoinWrapperPathAddObject) {
    super();
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CosmosCoinWrapperPathAddObject {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinWrapperPathAddObject;
  }

  static fromProto(data: protobadges.CosmosCoinWrapperPathAddObject, convertFunction: (val: string | number) => T): CosmosCoinWrapperPathAddObject {
    return new CosmosCoinWrapperPathAddObject({
      denom: data.denom,
      conversion: data.conversion ? ConversionWithoutDenom.fromProto(data.conversion, convertFunction) : { sideA: { amount: convertFunction('0') }, sideB: [] },
      symbol: data.symbol,
      denomUnits: data.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction)),
      allowOverrideWithAnyValidToken: data.allowOverrideWithAnyValidToken,
      metadata: data.metadata ? PathMetadata.fromProto(data.metadata) : { uri: '', customData: '' }
    });
  }

  toProto(): protobadges.CosmosCoinWrapperPathAddObject {
    return new protobadges.CosmosCoinWrapperPathAddObject({
      denom: this.denom,
      conversion: this.conversion.toProto(),
      symbol: this.symbol,
      denomUnits: this.denomUnits.map((unit) => {
        const protoUnit = new protobadges.DenomUnit({
          decimals: unit.decimals.toString(),
          symbol: unit.symbol,
          isDefaultDisplay: unit.isDefaultDisplay
        });
        protoUnit.metadata = unit.metadata.toProto();
        return protoUnit;
      }),
      allowOverrideWithAnyValidToken: this.allowOverrideWithAnyValidToken,
      metadata: this.metadata.toProto()
    });
  }
}

/**
 * Alias (non-wrapping) path add object.
 *
 * @category Balances
 */
export class AliasPathAddObject extends BaseNumberTypeClass<AliasPathAddObject> implements iAliasPathAddObject {
  denom: string;
  conversion: ConversionWithoutDenom;
  symbol: string;
  denomUnits: DenomUnit[];
  metadata: PathMetadata;

  constructor(data: iAliasPathAddObject) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AliasPathAddObject {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AliasPathAddObject;
  }

  static fromProto(data: protobadges.AliasPathAddObject, convertFunction: (val: string | number) => T): AliasPathAddObject {
    return new AliasPathAddObject({
      denom: data.denom,
      conversion: data.conversion ? ConversionWithoutDenom.fromProto(data.conversion, convertFunction) : { sideA: { amount: convertFunction('0') }, sideB: [] },
      symbol: data.symbol,
      denomUnits: data.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction)),
      metadata: data.metadata ? PathMetadata.fromProto(data.metadata) : { uri: '', customData: '' }
    });
  }

  toProto(): protobadges.AliasPathAddObject {
    return new protobadges.AliasPathAddObject({
      denom: this.denom,
      conversion: this.conversion.toProto(),
      symbol: this.symbol,
      denomUnits: this.denomUnits.map((unit) => {
        const protoUnit = new protobadges.DenomUnit({
          decimals: unit.decimals.toString(),
          symbol: unit.symbol,
          isDefaultDisplay: unit.isDefaultDisplay
        });
        protoUnit.metadata = unit.metadata.toProto();
        return protoUnit;
      }),
      metadata: this.metadata.toProto()
    });
  }
}

/**
 * Type for Cosmos SDK Coin backed path information with support for bigint amounts.
 *
 * @category Balances
 */
export class CosmosCoinBackedPathAddObject extends BaseNumberTypeClass<CosmosCoinBackedPathAddObject> implements iCosmosCoinBackedPathAddObject {
  conversion: Conversion;

  constructor(data: iCosmosCoinBackedPathAddObject) {
    super();
    this.conversion = new Conversion(data.conversion);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CosmosCoinBackedPathAddObject {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinBackedPathAddObject;
  }

  static fromProto(data: protobadges.CosmosCoinBackedPathAddObject, convertFunction: (val: string | number) => T): CosmosCoinBackedPathAddObject {
    return new CosmosCoinBackedPathAddObject({
      conversion: data.conversion ? Conversion.fromProto(data.conversion, convertFunction) : { sideA: { amount: convertFunction('0'), denom: '' }, sideB: [] }
    });
  }

  toProto(): protobadges.CosmosCoinBackedPathAddObject {
    return new protobadges.CosmosCoinBackedPathAddObject({
      conversion: this.conversion
        ? new protobadges.Conversion({
            sideA: this.conversion.sideA
              ? new protobadges.ConversionSideAWithDenom({
                  amount: this.conversion.sideA.amount.toString(),
                  denom: this.conversion.sideA.denom
                })
              : undefined,
            sideB: this.conversion.sideB.map((balance) => balance.toProto())
          })
        : undefined
    });
  }
}

/**
 * InvariantsAddObject is used for adding invariants without specifying addresses.
 * Addresses are generated by the keeper and stored in the collection.
 *
 * @category Balances
 */
export class InvariantsAddObject extends BaseNumberTypeClass<InvariantsAddObject> implements iInvariantsAddObject {
  noCustomOwnershipTimes: boolean;
  maxSupplyPerId: string | number;
  cosmosCoinBackedPath?: CosmosCoinBackedPathAddObject;
  noForcefulPostMintTransfers: boolean;
  disablePoolCreation: boolean;

  constructor(data: iInvariantsAddObject) {
    super();
    this.noCustomOwnershipTimes = data.noCustomOwnershipTimes;
    this.maxSupplyPerId = data.maxSupplyPerId;
    this.cosmosCoinBackedPath = data.cosmosCoinBackedPath ? new CosmosCoinBackedPathAddObject(data.cosmosCoinBackedPath) : undefined;
    this.noForcefulPostMintTransfers = data.noForcefulPostMintTransfers;
    this.disablePoolCreation = data.disablePoolCreation;
  }

  getNumberFieldNames(): string[] {
    return ['maxSupplyPerId'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): InvariantsAddObject {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as InvariantsAddObject;
  }

  static fromProto(data: protobadges.InvariantsAddObject, convertFunction: (val: string | number) => T): InvariantsAddObject {
    return new InvariantsAddObject({
      noCustomOwnershipTimes: data.noCustomOwnershipTimes,
      maxSupplyPerId: convertFunction(data.maxSupplyPerId),
      cosmosCoinBackedPath: data.cosmosCoinBackedPath ? CosmosCoinBackedPathAddObject.fromProto(data.cosmosCoinBackedPath, convertFunction) : undefined,
      noForcefulPostMintTransfers: data.noForcefulPostMintTransfers,
      disablePoolCreation: data.disablePoolCreation
    });
  }

  toProto(): protobadges.InvariantsAddObject {
    return new protobadges.InvariantsAddObject({
      noCustomOwnershipTimes: this.noCustomOwnershipTimes,
      maxSupplyPerId: this.maxSupplyPerId.toString(),
      cosmosCoinBackedPath: this.cosmosCoinBackedPath ? this.cosmosCoinBackedPath.toProto() : undefined,
      noForcefulPostMintTransfers: this.noForcefulPostMintTransfers,
      disablePoolCreation: this.disablePoolCreation
    });
  }
}
