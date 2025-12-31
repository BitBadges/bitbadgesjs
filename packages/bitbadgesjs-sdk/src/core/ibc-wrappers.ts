import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, CustomTypeClass } from '@/common/base.js';
import {
  iConversion,
  iConversionSideA,
  iConversionSideAWithDenom,
  iConversionWithoutDenom,
  iCosmosCoinBackedPathAddObject,
  iCosmosCoinWrapperPathAddObject,
  iAliasPathAddObject,
  iDenomUnit,
  iDenomUnitWithDetails,
  iInvariantsAddObject,
  iPathMetadata,
  iPathMetadataWithDetails
} from '@/interfaces/types/core.js';
import { badges as protobadges } from '@/proto/index.js';
import type { NumberType } from '../common/string-numbers.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { Balance } from './balances.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';

/**
 * @category Interfaces
 */
export class ConversionSideAWithDenom<T extends NumberType>
  extends BaseNumberTypeClass<ConversionSideAWithDenom<T>>
  implements iConversionSideAWithDenom<T>
{
  amount: T;
  denom: string;

  constructor(data: iConversionSideAWithDenom<T>) {
    super();
    this.amount = data.amount;
    this.denom = data.denom;
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ConversionSideAWithDenom<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ConversionSideAWithDenom<U>;
  }

  static fromProto<T extends NumberType>(
    data: protobadges.ConversionSideAWithDenom,
    convertFunction: (val: NumberType) => T
  ): ConversionSideAWithDenom<T> {
    return new ConversionSideAWithDenom({
      amount: convertFunction(data.amount),
      denom: data.denom
    });
  }
}

/**
 * @category Interfaces
 */
export class ConversionSideA<T extends NumberType> extends BaseNumberTypeClass<ConversionSideA<T>> implements iConversionSideA<T> {
  amount: T;

  constructor(data: iConversionSideA<T>) {
    super();
    this.amount = data.amount;
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ConversionSideA<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ConversionSideA<U>;
  }

  static fromProto<T extends NumberType>(data: protobadges.ConversionSideA, convertFunction: (val: NumberType) => T): ConversionSideA<T> {
    return new ConversionSideA({
      amount: convertFunction(data.amount)
    });
  }
}

/**
 * @category Interfaces
 */
export class Conversion<T extends NumberType> extends BaseNumberTypeClass<Conversion<T>> implements iConversion<T> {
  sideA: ConversionSideAWithDenom<T>;
  sideB: Balance<T>[];

  constructor(data: iConversion<T>) {
    super();
    this.sideA = new ConversionSideAWithDenom(data.sideA);
    this.sideB = data.sideB.map((balance) => new Balance(balance));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): Conversion<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Conversion<U>;
  }

  static fromProto<T extends NumberType>(data: protobadges.Conversion, convertFunction: (val: NumberType) => T): Conversion<T> {
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
export class ConversionWithoutDenom<T extends NumberType>
  extends BaseNumberTypeClass<ConversionWithoutDenom<T>>
  implements iConversionWithoutDenom<T>
{
  sideA: ConversionSideA<T>;
  sideB: Balance<T>[];

  constructor(data: iConversionWithoutDenom<T>) {
    super();
    this.sideA = new ConversionSideA(data.sideA);
    this.sideB = data.sideB.map((balance) => new Balance(balance));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ConversionWithoutDenom<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ConversionWithoutDenom<U>;
  }

  static fromProto<T extends NumberType>(
    data: protobadges.ConversionWithoutDenom,
    convertFunction: (val: NumberType) => T
  ): ConversionWithoutDenom<T> {
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
export class DenomUnit<T extends NumberType> extends BaseNumberTypeClass<DenomUnit<T>> implements iDenomUnit<T> {
  decimals: T;
  symbol: string;
  isDefaultDisplay: boolean;
  metadata: PathMetadata;

  constructor(data: iDenomUnit<T>) {
    super();
    this.decimals = data.decimals;
    this.symbol = data.symbol;
    this.isDefaultDisplay = data.isDefaultDisplay;
    this.metadata = new PathMetadata(data.metadata);
  }

  getNumberFieldNames(): string[] {
    return ['decimals'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): DenomUnit<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DenomUnit<U>;
  }

  static fromProto<T extends NumberType>(data: protobadges.DenomUnit, convertFunction: (val: NumberType) => T): DenomUnit<T> {
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
export class PathMetadataWithDetails<T extends NumberType> extends PathMetadata implements iPathMetadataWithDetails<T> {
  metadata?: Metadata<T>;

  constructor(pathMetadata: iPathMetadataWithDetails<T>) {
    super(pathMetadata);
    this.metadata = pathMetadata.metadata ? new Metadata(pathMetadata.metadata) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PathMetadataWithDetails<U> {
    return new PathMetadataWithDetails<U>({
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
export class DenomUnitWithDetails<T extends NumberType> extends DenomUnit<T> implements iDenomUnitWithDetails<T> {
  override metadata: PathMetadataWithDetails<T>;

  constructor(data: iDenomUnitWithDetails<T>) {
    super(data);
    this.metadata = new PathMetadataWithDetails(data.metadata);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): DenomUnitWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DenomUnitWithDetails<U>;
  }

  static fromProto<T extends NumberType>(data: protobadges.DenomUnit, convertFunction: (val: NumberType) => T): DenomUnitWithDetails<T> {
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
export class CosmosCoinWrapperPathAddObject<T extends NumberType>
  extends BaseNumberTypeClass<CosmosCoinWrapperPathAddObject<T>>
  implements iCosmosCoinWrapperPathAddObject<T>
{
  denom: string;
  conversion: ConversionWithoutDenom<T>;
  symbol: string;
  denomUnits: DenomUnit<T>[];
  allowOverrideWithAnyValidToken: boolean;
  metadata: PathMetadata;

  constructor(data: iCosmosCoinWrapperPathAddObject<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CosmosCoinWrapperPathAddObject<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinWrapperPathAddObject<U>;
  }

  static fromProto<T extends NumberType>(
    data: protobadges.CosmosCoinWrapperPathAddObject,
    convertFunction: (val: NumberType) => T
  ): CosmosCoinWrapperPathAddObject<T> {
    return new CosmosCoinWrapperPathAddObject({
      denom: data.denom,
      conversion: data.conversion
        ? ConversionWithoutDenom.fromProto(data.conversion, convertFunction)
        : { sideA: { amount: convertFunction('0') }, sideB: [] },
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
export class AliasPathAddObject<T extends NumberType> extends BaseNumberTypeClass<AliasPathAddObject<T>> implements iAliasPathAddObject<T> {
  denom: string;
  conversion: ConversionWithoutDenom<T>;
  symbol: string;
  denomUnits: DenomUnit<T>[];
  metadata: PathMetadata;

  constructor(data: iAliasPathAddObject<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AliasPathAddObject<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AliasPathAddObject<U>;
  }

  static fromProto<T extends NumberType>(data: protobadges.AliasPathAddObject, convertFunction: (val: NumberType) => T): AliasPathAddObject<T> {
    return new AliasPathAddObject({
      denom: data.denom,
      conversion: data.conversion
        ? ConversionWithoutDenom.fromProto(data.conversion, convertFunction)
        : { sideA: { amount: convertFunction('0') }, sideB: [] },
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
export class CosmosCoinBackedPathAddObject<T extends NumberType>
  extends BaseNumberTypeClass<CosmosCoinBackedPathAddObject<T>>
  implements iCosmosCoinBackedPathAddObject<T>
{
  conversion: Conversion<T>;

  constructor(data: iCosmosCoinBackedPathAddObject<T>) {
    super();
    this.conversion = new Conversion(data.conversion);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CosmosCoinBackedPathAddObject<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinBackedPathAddObject<U>;
  }

  static fromProto<T extends NumberType>(
    data: protobadges.CosmosCoinBackedPathAddObject,
    convertFunction: (val: NumberType) => T
  ): CosmosCoinBackedPathAddObject<T> {
    return new CosmosCoinBackedPathAddObject({
      conversion: data.conversion
        ? Conversion.fromProto(data.conversion, convertFunction)
        : { sideA: { amount: convertFunction('0'), denom: '' }, sideB: [] }
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
export class InvariantsAddObject<T extends NumberType> extends BaseNumberTypeClass<InvariantsAddObject<T>> implements iInvariantsAddObject<T> {
  noCustomOwnershipTimes: boolean;
  maxSupplyPerId: T;
  cosmosCoinBackedPath?: CosmosCoinBackedPathAddObject<T>;
  noForcefulPostMintTransfers: boolean;
  disablePoolCreation: boolean;

  constructor(data: iInvariantsAddObject<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): InvariantsAddObject<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as InvariantsAddObject<U>;
  }

  static fromProto<T extends NumberType>(data: protobadges.InvariantsAddObject, convertFunction: (val: NumberType) => T): InvariantsAddObject<T> {
    return new InvariantsAddObject({
      noCustomOwnershipTimes: data.noCustomOwnershipTimes,
      maxSupplyPerId: convertFunction(data.maxSupplyPerId),
      cosmosCoinBackedPath: data.cosmosCoinBackedPath
        ? CosmosCoinBackedPathAddObject.fromProto(data.cosmosCoinBackedPath, convertFunction)
        : undefined,
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
