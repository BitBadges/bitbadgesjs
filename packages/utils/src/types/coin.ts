import { NumberType, StringNumber } from "./string-numbers";

/**
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'badge' }).
 *
 * @typedef {Object} CosmosCoinWithType
 * @property {NumberType} amount - The amount of the coin.
 * @property {string} denom - The denomination of the coin.
 */
export interface CosmosCoinWithType<T extends NumberType> {
  amount: T,
  denom: string,
}

export type CosmosCoin = CosmosCoinWithType<bigint>;
export type s_CosmosCoin = CosmosCoinWithType<string>;
export type n_CosmosCoin = CosmosCoinWithType<number>;
export type d_CosmosCoin = CosmosCoinWithType<StringNumber>;

export function convertCosmosCoin<T extends NumberType, U extends NumberType>(item: CosmosCoinWithType<T>, convertFunction: (item: T) => U): CosmosCoinWithType<U> {
  return {
    ...item,
    amount: convertFunction(item.amount),
  }
}
