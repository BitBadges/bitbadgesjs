import { NumberType } from "../..";;
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

export function convertCosmosCoin<T extends NumberType, U extends NumberType>(item: CosmosCoin<T>, convertFunction: (item: T) => U): CosmosCoin<U> {
  return deepCopy({
    ...item,
    amount: convertFunction(item.amount),
  })
}