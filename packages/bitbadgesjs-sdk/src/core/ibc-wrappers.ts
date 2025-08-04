import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { iCosmosCoinWrapperPathAddObject, iDenomUnit, iDenomUnitWithDetails } from '@/interfaces/badges/core.js';
import { badges } from '@/proto/index.js';
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

  static fromProto<T extends NumberType>(data: badges.DenomUnit, convertFunction: (val: NumberType) => T): DenomUnit<T> {
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

  static fromProto<T extends NumberType>(data: badges.DenomUnit, convertFunction: (val: NumberType) => T): DenomUnitWithDetails<T> {
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

  constructor(data: iCosmosCoinWrapperPathAddObject<T>) {
    super();
    this.denom = data.denom;
    this.balances = data.balances.map((balance) => new Balance(balance));
    this.symbol = data.symbol;
    this.denomUnits = data.denomUnits.map((unit) => new DenomUnit(unit));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CosmosCoinWrapperPathAddObject<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoinWrapperPathAddObject<U>;
  }

  static fromProto<T extends NumberType>(
    data: badges.CosmosCoinWrapperPathAddObject,
    convertFunction: (val: NumberType) => T
  ): CosmosCoinWrapperPathAddObject<T> {
    return new CosmosCoinWrapperPathAddObject({
      denom: data.denom,
      balances: data.balances.map((balance) => Balance.fromProto(balance, convertFunction)),
      symbol: data.symbol,
      denomUnits: data.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction))
    });
  }
}
