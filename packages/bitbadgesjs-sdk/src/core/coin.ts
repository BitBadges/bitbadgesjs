import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '../common/string-numbers.js';

/**
 * @category Interfaces
 */
export interface iCosmosCoin {
  /** The amount of the coin. */
  amount: string | number;
  /** The denomination of the coin (e.g. "ubadge"). */
  denom: string;
}

/**
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'ubadge' }).
 *
 * @category Balances
 */
export class CosmosCoin extends BaseNumberTypeClass<CosmosCoin> implements iCosmosCoin {
  amount: string | number;
  denom: string;

  constructor(data: iCosmosCoin) {
    super();
    this.amount = data.amount;
    this.denom = data.denom;
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CosmosCoin {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CosmosCoin;
  }

  static fromProto(data: { amount: string; denom: string }, convertFunction: (val: string | number) => T): CosmosCoin {
    return new CosmosCoin({
      amount: convertFunction(data.amount as any),
      denom: data.denom
    });
  }
}
