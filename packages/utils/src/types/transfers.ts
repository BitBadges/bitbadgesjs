import { Transfer } from "bitbadgesjs-proto";

/**
 * TransferWithIncrements is a type that is used to better handle batch transfers, potentially with incremented badgeIDs.
 *
 * @typedef {Object} TransferWithIncrements
 * @extends {Transfer}
 *
 * @property {bigint} [toAddressesLength] - The number of addresses to send the badges to. This takes priority over toAddresses.length (used when you don't know exact addresses (i.e. you know number of codes)).
 * @property {bigint} [incrementIdsBy] - The number to increment the badgeIDs by for each transfer.
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
export interface TransferWithIncrements extends Transfer {
  toAddressesLength?: bigint; //This takes priority over toAddresses.length (used when you don't have exact addresses but have a length (i.e. number of codes))
  incrementIdsBy?: bigint;
}
