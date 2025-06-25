import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { iCosmosCoinWrapperPathAddObject } from '@/interfaces/badges/core.js';
import { badges } from '@/proto/index.js';
import type { NumberType } from '../common/string-numbers.js';
import { UintRangeArray } from './uintRanges.js';

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

  constructor(data: iCosmosCoinWrapperPathAddObject<T>) {
    super();
    this.denom = data.denom;
    this.badgeIds = UintRangeArray.From(data.badgeIds);
    this.ownershipTimes = UintRangeArray.From(data.ownershipTimes);
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
      ownershipTimes: UintRangeArray.From(data.ownershipTimes).convert(convertFunction)
    });
  }
}
