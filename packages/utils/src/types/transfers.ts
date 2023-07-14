import { Balance, Transfer, convertBalance, convertTransfer } from "bitbadgesjs-proto";
import { NumberType } from "./string-numbers";
import { deepCopy } from "./utils";

export interface OffChainBalancesMap<T extends NumberType> {
  [cosmosAddress: string]: Balance<T>[]
}

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
 * @property {NumberType} [incrementOwnedTimesBy] - The number to increment the ownedTimes by for each transfer.
 *
 *
 * @remarks
 * For example, if you have 100 addresses and want to send 1 badge to each address,
 * you would set toAddressesLength to 100 and incrementIdsBy to 1. This would send badgeIDs 1 to the first address,
 * 2 to the second, and so on.
 *
 * @see
 * This type is compatible with the getBalancesAfterTransfers function and the getTransfersFromTransfersWithIncrements function.
 */
export interface TransferWithIncrements<T extends NumberType> extends Transfer<T> {
  toAddressesLength?: T; //This takes priority over toAddresses.length (used when you don't have exact addresses but have a length (i.e. number of codes))
  incrementBadgeIdsBy?: T;
  incrementOwnedTimesBy?: T;
}

export function convertTransferWithIncrements<T extends NumberType, U extends NumberType>(item: TransferWithIncrements<T>, convertFunction: (item: T) => U): TransferWithIncrements<U> {
  return deepCopy({
    ...item,
    ...convertTransfer(item, convertFunction),
    toAddressesLength: item.toAddressesLength ? convertFunction(item.toAddressesLength) : undefined,
    incrementBadgeIdsBy: item.incrementBadgeIdsBy ? convertFunction(item.incrementBadgeIdsBy) : undefined,
    incrementOwnedTimesBy: item.incrementOwnedTimesBy ? convertFunction(item.incrementOwnedTimesBy) : undefined,
  })
}
