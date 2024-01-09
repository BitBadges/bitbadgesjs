import { Balance, Transfer, convertBalance, convertTransfer } from "bitbadgesjs-proto";
import { NumberType } from "./string-numbers";
import { deepCopy } from "./utils";

/**
 * @category Balances
 *
 * @typedef {Object} OffChainBalancesMap
 *
 * OffChainBalancesMap is a map of cosmos addresses or listIDs to an array of balances. This is the expected format
 * for collections with off-chain balances. Host this on your server in JSON format.
 */
export interface OffChainBalancesMap<T extends NumberType> {
  [cosmosAddressOrListId: string]: Balance<T>[]
}

/**
 * @category Balances
 */
export function convertOffChainBalancesMap<T extends NumberType, U extends NumberType>(item: OffChainBalancesMap<T>, convertFunction: (item: T) => U): OffChainBalancesMap<U> {
  const newMap: OffChainBalancesMap<U> = {};
  for (const [key, value] of Object.entries(item)) {
    newMap[key] = value.map((balance) => convertBalance(balance, convertFunction));
  }

  return newMap;
}

/**
 * TransferWithIncrements is a type that is used to better handle batch transfers, potentially with incremented badgeIDs.
 *
 * @typedef {Object} TransferWithIncrements
 * @extends {Transfer}
 *
 * @property {NumberType} [toAddressesLength] - The number of addresses to send the badges to. This takes priority over toAddresses.length (used when you don't know exact addresses (i.e. you know number of codes)).
 * @property {NumberType} [incrementBadgeIdsBy] - The number to increment the badgeIDs by for each transfer.
 * @property {NumberType} [incrementOwnershipTimesBy] - The number to increment the ownershipTimes by for each transfer.
 *
 *
 * @remarks
 * For example, if you have 100 addresses and want to send 1 badge to each address,
 * you would set toAddressesLength to 100 and incrementIdsBy to 1. This would send badgeIDs 1 to the first address,
 * 2 to the second, and so on.
 *
 * @see
 * This type is compatible with the getBalancesAfterTransfers function and the getTransfersFromTransfersWithIncrements function.
 *
 * @category Balances
 */
export interface TransferWithIncrements<T extends NumberType> extends Transfer<T> {
  toAddressesLength?: T; //This takes priority over toAddresses.length (used when you don't have exact addresses but have a length (i.e. number of codes))
  incrementBadgeIdsBy?: T;
  incrementOwnershipTimesBy?: T;
}

/**
 * @category Balances
 */
export function convertTransferWithIncrements<T extends NumberType, U extends NumberType>(item: TransferWithIncrements<T>, convertFunction: (item: T) => U): TransferWithIncrements<U> {
  return deepCopy({
    ...item,
    ...convertTransfer(item, convertFunction),
    toAddressesLength: item.toAddressesLength ? convertFunction(item.toAddressesLength) : undefined,
    incrementBadgeIdsBy: item.incrementBadgeIdsBy ? convertFunction(item.incrementBadgeIdsBy) : undefined,
    incrementOwnershipTimesBy: item.incrementOwnershipTimesBy ? convertFunction(item.incrementOwnershipTimesBy) : undefined,
  })
}
