import { StringNumber, TransferWithType, convertTransfer } from "bitbadgesjs-proto";
import { NumberType } from "./string-numbers";

/**
 * TransferWithIncrements is a type that is used to better handle batch transfers, potentially with incremented badgeIDs.
 *
 * @typedef {Object} TransferWithIncrementsWithType
 * @extends {TransferWithType}
 *
 * @property {NumberType} [toAddressesLength] - The number of addresses to send the badges to. This takes priority over toAddresses.length (used when you don't know exact addresses (i.e. you know number of codes)).
 * @property {NumberType} [incrementIdsBy] - The number to increment the badgeIDs by for each transfer.
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
export interface TransferWithIncrementsWithType<T extends NumberType> extends TransferWithType<T> {
  toAddressesLength?: T; //This takes priority over toAddresses.length (used when you don't have exact addresses but have a length (i.e. number of codes))
  incrementIdsBy?: T;
}

export type TransferWithIncrements = TransferWithIncrementsWithType<bigint>;
export type s_TransferWithIncrements = TransferWithIncrementsWithType<string>;
export type n_TransferWithIncrements = TransferWithIncrementsWithType<number>;
export type d_TransferWithIncrements = TransferWithIncrementsWithType<StringNumber>;

export function convertTransferWithIncrements<T extends NumberType, U extends NumberType>(item: TransferWithIncrementsWithType<T>, convertFunction: (item: T) => U): TransferWithIncrementsWithType<U> {
  return {
    ...item,
    ...convertTransfer(item, convertFunction),
    toAddressesLength: item.toAddressesLength ? convertFunction(item.toAddressesLength) : undefined,
    incrementIdsBy: item.incrementIdsBy ? convertFunction(item.incrementIdsBy) : undefined,
  }
}
