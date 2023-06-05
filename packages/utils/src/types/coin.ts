import { NumberType, StringNumber } from "./string-numbers";
import { deepCopy } from "./utils";

/**
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'badge' }).
 *
 * @typedef {Object} CosmosCoin
 * @property {NumberType} amount - The amount of the coin.
 * @property {string} denom - The denomination of the coin.
 */
export interface CosmosCoin<T extends NumberType> {
  amount: T,
  denom: string,
}

export type b_CosmosCoin = CosmosCoin<bigint>;
export type s_CosmosCoin = CosmosCoin<string>;
export type n_CosmosCoin = CosmosCoin<number>;
export type d_CosmosCoin = CosmosCoin<StringNumber>;

export function convertCosmosCoin<T extends NumberType, U extends NumberType>(item: CosmosCoin<T>, convertFunction: (item: T) => U): CosmosCoin<U> {
  return deepCopy({
    ...item,
    amount: convertFunction(item.amount),
  })
}
