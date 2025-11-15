import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import {
  iCosmosCoinBackedPathAddObject,
  iCosmosCoinWrapperPathAddObject,
  iDenomUnit,
  iDenomUnitWithDetails,
  iInvariantsAddObject
} from '@/interfaces/types/core.js';
import { badges as protobadges } from '@/proto/index.js';
import type { NumberType } from '../common/string-numbers.js';
import { Balance } from './balances.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';

/**
 * @category Interfaces
 */
export class DenomUnit<T extends NumberType> extends BaseNumberTypeClass<DenomUnit<T>> implements iDenomUnit<T> {
  decimals: T;
  symbol: string;
  isDefaultDisplay: boolean;

  constructor(data: iDenomUnit<T>) {
    super();
    this.decimals = data.decimals;
    this.symbol = data.symbol;
    this.isDefaultDisplay = data.isDefaultDisplay;
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
      isDefaultDisplay: data.isDefaultDisplay
    });
  }
}

/**
 * @inheritDoc iDenomUnitWithDetails
 * @category Interfaces
 */
export class DenomUnitWithDetails<T extends NumberType> extends DenomUnit<T> implements iDenomUnitWithDetails<T> {
  metadata?: Metadata<T>;

  constructor(data: iDenomUnitWithDetails<T>) {
    super(data);
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): DenomUnitWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DenomUnitWithDetails<U>;
  }

  static fromProto<T extends NumberType>(data: protobadges.DenomUnit, convertFunction: (val: NumberType) => T): DenomUnitWithDetails<T> {
    return new DenomUnitWithDetails({
      decimals: convertFunction(data.decimals),
      symbol: data.symbol,
      isDefaultDisplay: data.isDefaultDisplay
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
  balances: Balance<T>[];
  symbol: string;
  denomUnits: DenomUnit<T>[];
  allowOverrideWithAnyValidToken: boolean;
  allowCosmosWrapping: boolean;

  constructor(data: iCosmosCoinWrapperPathAddObject<T>) {
    super();
    this.denom = data.denom;
    this.balances = data.balances.map((balance) => new Balance(balance));
    this.symbol = data.symbol;
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnit(unit));
    this.allowOverrideWithAnyValidToken = data.allowOverrideWithAnyValidToken;
    this.allowCosmosWrapping = data.allowCosmosWrapping;
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
      balances: data.balances.map((balance) => Balance.fromProto(balance, convertFunction)),
      symbol: data.symbol,
      denomUnits: data.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction)),
      allowOverrideWithAnyValidToken: data.allowOverrideWithAnyValidToken,
      allowCosmosWrapping: data.allowCosmosWrapping
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
  ibcDenom: string;
  balances: Balance<T>[];
  ibcAmount: T;

  constructor(data: iCosmosCoinBackedPathAddObject<T>) {
    super();
    this.ibcDenom = data.ibcDenom;
    this.balances = data.balances.map((balance) => new Balance(balance));
    this.ibcAmount = data.ibcAmount;
  }

  getNumberFieldNames(): string[] {
    return ['ibcAmount'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CosmosCoinBackedPathAddObject<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinBackedPathAddObject<U>;
  }

  static fromProto<T extends NumberType>(
    data: protobadges.CosmosCoinBackedPathAddObject,
    convertFunction: (val: NumberType) => T
  ): CosmosCoinBackedPathAddObject<T> {
    return new CosmosCoinBackedPathAddObject({
      ibcDenom: data.ibcDenom,
      balances: data.balances.map((balance) => Balance.fromProto(balance, convertFunction)),
      ibcAmount: convertFunction(data.ibcAmount)
    });
  }

  toProto(): protobadges.CosmosCoinBackedPathAddObject {
    return new protobadges.CosmosCoinBackedPathAddObject({
      ibcDenom: this.ibcDenom,
      balances: this.balances.map((balance) => balance.toProto()),
      ibcAmount: this.ibcAmount.toString()
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
