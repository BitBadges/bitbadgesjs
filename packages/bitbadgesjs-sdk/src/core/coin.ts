import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '../common/string-numbers';

/**
 * @category Interfaces
 */
export interface iCosmosCoin<T extends NumberType> {
  /** The amount of the coin. */
  amount: T;
  /** The denomination of the coin (e.g. "badge"). */
  denom: string;
}

/**
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'badge' }).
 *
 * @category Balances
 */
export class CosmosCoin<T extends NumberType> extends BaseNumberTypeClass<CosmosCoin<T>> implements iCosmosCoin<T> {
  amount: T;
  denom: string;

  constructor(data: iCosmosCoin<T>) {
    super();
    this.amount = data.amount;
    this.denom = data.denom;
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CosmosCoin<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CosmosCoin<U>;
  }

  static fromProto<T extends NumberType>(data: { amount: string; denom: string }, convertFunction: (val: NumberType) => T): CosmosCoin<T> {
    return new CosmosCoin({
      amount: data.amount as any,
      denom: data.denom
    });
  }
}
