import { Balance, Transfer, UintRange } from "bitbadgesjs-proto";
import { addBalance, addBalances, subtractBalances } from "./balances";
import { OffChainBalancesMap, TransferWithIncrements } from "./types/transfers";
import { deepCopy } from "./types/utils";
import { convertToCosmosAddress } from "./chains";

/**
 * Given some transfers (potentially incremented), return the balance map to store as a JSON for a collection with off-chain balances.
 *
 * @category Balances
 *
 * @param {TransferWithIncrements<bigint>[]} transfers - The transfers to process.
 */
export const createBalanceMapForOffChainBalances = async (transfersWithIncrements: TransferWithIncrements<bigint>[]) => {
  const balanceMap: OffChainBalancesMap<bigint> = {};

  const transfers = getTransfersFromTransfersWithIncrements(transfersWithIncrements);
  //Calculate new balances of the toAddresses
  for (let idx = 0; idx < transfers.length; idx++) {
    const transfer = transfers[idx];
    for (let j = 0; j < transfer.toAddresses.length; j++) {
      const address = transfer.toAddresses[j];
      const cosmosAddress = convertToCosmosAddress(address);

      //currBalance is used as a Balance[] type to be compatible with addBalancesForUintRanges
      const currBalances = balanceMap[cosmosAddress] ? balanceMap[cosmosAddress] : [];
      balanceMap[cosmosAddress] = addBalances(transfer.balances, currBalances);
    }
  }

  return balanceMap;
}

/**
 * Gets the badge IDs to be transferred for a given transfer with increments.
 * @example
 * For a transfer with balances: [{ badgeIds: [{ start: 1n, end: 1n }], amount: 1n }], incrementIdsBy: 1n, toAddressesLength: 1000
 * We return { badgeIds: [{ start: 1n, end: 1000n }] because we increment the badgeIds by 1 each time.
 *
 * @category Balances
 *
 * @param {TransferWithIncrements<bigint>[]} transfers - The list of transfers with increments.
 * @returns {Balance<bigint>} The balances to be transferred.
 */
export const getAllBadgeIdsToBeTransferred = (transfers: TransferWithIncrements<bigint>[]) => {
  const allBadgeIds: UintRange<bigint>[] = [];
  for (const transfer of transfers) {
    for (const balance of transfer.balances) {

      //toAddressesLength takes priority
      const _numRecipients = transfer.toAddressesLength ? transfer.toAddressesLength : transfer.toAddresses ? transfer.toAddresses.length : 0;
      const numRecipients = BigInt(_numRecipients);

      const badgeIds = deepCopy(balance.badgeIds);
      const ownershipTimes = deepCopy(balance.ownershipTimes);

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementBadgeIdsBy && !transfer.incrementOwnershipTimesBy) {
        allBadgeIds.push(...deepCopy(badgeIds));
      } else {
        for (let i = 0; i < numRecipients; i++) {
          allBadgeIds.push(...deepCopy(badgeIds));

          for (const badgeId of badgeIds) {
            badgeId.start += transfer.incrementBadgeIdsBy || 0n;
            badgeId.end += transfer.incrementBadgeIdsBy || 0n;
          }

          for (const ownershipTime of ownershipTimes) {
            ownershipTime.start += transfer.incrementOwnershipTimesBy || 0n;
            ownershipTime.end += transfer.incrementOwnershipTimesBy || 0n;
          }
        }
      }
    }
  }

  return allBadgeIds;
}


/**
 * Gets the balances to be transferred for a given transfer with increments.
 * @example
 * For a transfer with balances: [{ badgeIds: [{ start: 1n, end: 1n }], amount: 1n }], incrementIdsBy: 1n, toAddressesLength: 1000
 * We return [{ badgeIds: [{ start: 1n, end: 1000n }], amount: 1n }] because we transfer x1 badge to 1000 addresses
 * and increment the badgeIds by 1 each time.
 *
 *
 * This is really inefficient and should be optimized for large N.
 *
 * @category Balances
 *
 * @param {TransferWithIncrements<bigint>[]} transfers - The list of transfers with increments.
 * @returns {Balance<bigint>} The balances to be transferred.
 */
export const getAllBalancesToBeTransferred = (transfers: TransferWithIncrements<bigint>[]) => {
  let startBalances: Balance<bigint>[] = [];
  for (const transfer of transfers) {
    for (const balance of transfer.balances) {

      //toAddressesLength takes priority
      const _numRecipients = transfer.toAddressesLength ? transfer.toAddressesLength : transfer.toAddresses ? transfer.toAddresses.length : 0;
      const numRecipients = BigInt(_numRecipients);

      const badgeIds = deepCopy(balance.badgeIds);
      const ownershipTimes = deepCopy(balance.ownershipTimes);

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementBadgeIdsBy && !transfer.incrementOwnershipTimesBy) {
        startBalances = addBalance(startBalances, {
          amount: balance.amount * numRecipients,
          badgeIds,
          ownershipTimes,
        }, true);
      } else {
        //TODO: This is not efficient, we should be able to LeetCode optimize this somehow. Imagine a claim with 100000000 possible claims
        for (let i = 0; i < numRecipients; i++) {
          startBalances = addBalance(startBalances, {
            amount: balance.amount,
            badgeIds,
            ownershipTimes,
          }, true);

          for (const badgeId of badgeIds) {
            badgeId.start += transfer.incrementBadgeIdsBy || 0n;
            badgeId.end += transfer.incrementBadgeIdsBy || 0n;
          }

          for (const ownershipTime of ownershipTimes) {
            ownershipTime.start += transfer.incrementOwnershipTimesBy || 0n;
            ownershipTime.end += transfer.incrementOwnershipTimesBy || 0n;
          }

        }
      }
    }
  }

  return startBalances;
}

/**
 * Converts a TransferWithIncrements<bigint>[] to a Transfer<bigint>[].
 *
 * Note that if there are N increments, this will create N transfers.
 *
 * @param {TransferWithIncrements<bigint>[]} transfersWithIncrements - The list of transfers with increments.
 *
 * @category Balances
 */
export const getTransfersFromTransfersWithIncrements = (transfersWithIncrements: TransferWithIncrements<bigint>[]) => {
  const transfers: Transfer<bigint>[] = [];
  for (const transferExtended of transfersWithIncrements) {
    const { toAddressesLength, incrementBadgeIdsBy, incrementOwnershipTimesBy, ...transfer } = transferExtended;
    const length = toAddressesLength ? Number(toAddressesLength) : transfer.toAddresses.length;

    //If badges are incremented, we create N unique transfers (one to each address).
    //Else, we can create one transfer with N addresses
    if (incrementBadgeIdsBy || incrementOwnershipTimesBy) {
      const currBalances = deepCopy(transfer.balances)
      for (let i = 0; i < length; i++) {
        transfers.push({
          ...transfer,
          toAddresses: [transfer.toAddresses[i]],
          balances: deepCopy(currBalances),
        })

        for (let j = 0; j < currBalances.length; j++) {
          if (incrementBadgeIdsBy) {
            for (const badgeId of currBalances[j].badgeIds) {
              badgeId.start += incrementBadgeIdsBy;
              badgeId.end += incrementBadgeIdsBy;
            }
          }

          if (incrementOwnershipTimesBy) {
            for (const badgeId of currBalances[j].ownershipTimes) {
              badgeId.start += incrementOwnershipTimesBy;
              badgeId.end += incrementOwnershipTimesBy;
            }
          }
        }
      }
    } else {
      transfers.push(transfer);
    }
  }

  return transfers;
}

/**
 * Returns the post balance after a transfer of x(amountToTransfer * numRecipients) from startBadgeId to endBadgeId
 *
 * @param {Balance<bigint>[]} balance - The balance to subtract from.
 * @param {bigint} startBadgeId - The start badge ID to subtract from.
 * @param {bigint} endBadgeId - The end badge ID to subtract from.
 * @param {bigint} amountToTransfer - The amount to subtract.
 * @param {bigint} numRecipients - The number of recipients to subtract from.
 *
 * @category Balances
 */
export const getBalanceAfterTransfer = (balance: Balance<bigint>[], startBadgeId: bigint, endBadgeId: bigint, ownershipTimeStart: bigint, ownershipTimeEnd: bigint, amountToTransfer: bigint, numRecipients: bigint, allowUnderflow?: boolean) => {
  const balanceCopy: Balance<bigint>[] = deepCopy(balance); //need a deep copy of the balance to not mess up calculations

  const newBalance = subtractBalances([
    {
      amount: amountToTransfer * numRecipients,
      badgeIds: [{ start: startBadgeId, end: endBadgeId }],
      ownershipTimes: [{ start: ownershipTimeStart, end: ownershipTimeEnd }],
    }
  ], balanceCopy, allowUnderflow);

  return newBalance;
}

/**
 * Returns the balance after a set of TransferWithIncrements<bigint>[].
 *
 * @param {Balance<bigint>[]} startBalance - The balance to subtract from.
 * @param {TransferWithIncrements<bigint>[]} transfers - The transfers that are being sent.
 *
 * @category Balances
 */
export const getBalancesAfterTransfers = (startBalance: Balance<bigint>[], transfers: TransferWithIncrements<bigint>[], allowUnderflow?: boolean) => {
  let endBalances: Balance<bigint>[] = deepCopy(startBalance); //need a deep copy of the balance to not mess up calculations
  for (const transfer of transfers) {
    for (const balance of transfer.balances) {

      //toAddressesLength takes priority
      const _numRecipients = transfer.toAddressesLength ? transfer.toAddressesLength : transfer.toAddresses ? transfer.toAddresses.length : 0;
      const numRecipients = BigInt(_numRecipients);

      const badgeIds = deepCopy(balance.badgeIds);
      const ownershipTimes = deepCopy(balance.ownershipTimes);

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementBadgeIdsBy && !transfer.incrementOwnershipTimesBy) {
        for (const badgeId of badgeIds) {
          for (const ownershipTime of ownershipTimes) {
            endBalances = getBalanceAfterTransfer(endBalances, badgeId.start, badgeId.end, ownershipTime.start, ownershipTime.end, balance.amount, numRecipients, allowUnderflow);
          }
        }
      } else {
        //If incrementIdsBy is set, then we need to increment the badgeIds after each transfer
        //TODO: This is not efficient, we should be able to LeetCode optimize this somehow. Imagine a claim with 100000000 possible claims.
        for (let i = 0; i < numRecipients; i++) {
          for (const badgeId of badgeIds) {
            for (const ownershipTime of ownershipTimes) {
              endBalances = getBalanceAfterTransfer(endBalances, badgeId.start, badgeId.end, ownershipTime.start, ownershipTime.end, balance.amount, 1n, allowUnderflow);
            }
          }

          for (const badgeId of badgeIds) {
            badgeId.start += transfer.incrementBadgeIdsBy || 0n;
            badgeId.end += transfer.incrementBadgeIdsBy || 0n;
          }

          for (const ownershipTime of ownershipTimes) {
            ownershipTime.start += transfer.incrementOwnershipTimesBy || 0n;
            ownershipTime.end += transfer.incrementOwnershipTimesBy || 0n;
          }
        }
      }
    }
  }

  return endBalances;
}
