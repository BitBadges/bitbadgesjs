import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { iCosmosCoinWrapperPathAddObject, iDenomUnit } from '@/interfaces/badges/core.js';
import { badges } from '@/proto/index.js';
import type { NumberType } from '../common/string-numbers.js';
import { UintRangeArray } from './uintRanges.js';

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
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'badge' }).
 *
 * @category Balances
 */
export class CosmosCoinWrapperPathAddObject<T extends NumberType>
  extends BaseNumberTypeClass<CosmosCoinWrapperPathAddObject<T>>
  implements iCosmosCoinWrapperPathAddObject<T>
{
  denom: string;
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  symbol: string;
  denomUnits: DenomUnit<T>[];

  constructor(data: iCosmosCoinWrapperPathAddObject<T>) {
    super();
    this.denom = data.denom;
    this.badgeIds = UintRangeArray.From(data.badgeIds);
    this.ownershipTimes = UintRangeArray.From(data.ownershipTimes);
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
      badgeIds: UintRangeArray.From(data.badgeIds).convert(convertFunction),
      ownershipTimes: UintRangeArray.From(data.ownershipTimes).convert(convertFunction),
      symbol: data.symbol,
      denomUnits: data.denomUnits.map((unit) => DenomUnit.fromProto(unit, convertFunction))
    });
  }
}
