import { Balance, Transfer } from "bitbadgesjs-proto";
import { addBalance, addBalances, subtractBalances } from "./balances";
import { OffChainBalancesMap, TransferWithIncrements } from "./types/transfers";
import { deepCopy } from "./types/utils";

/**
 * Given some transfers (potentially incremented), return the balance map to store for a collection with off-chain balances.
 *
 * @param {TransferWithIncrements<bigint>[]} transfers - The transfers to process.
 */
export const createBalanceMapForOffChainBalances = async (transfers: TransferWithIncrements<bigint>[]) => {
  const balanceMap: OffChainBalancesMap<bigint> = {};

  //Calculate new balances of the toAddresses
  for (let idx = 0; idx < transfers.length; idx++) {
    const transfer = transfers[idx];
    for (let j = 0; j < transfer.toAddresses.length; j++) {
      const address = transfer.toAddresses[j];

      //currBalance is used as a Balance[] type to be compatible with addBalancesForUintRanges
      const currBalances = balanceMap[address] ? balanceMap[address] : [];
      balanceMap[address] = addBalances(transfer.balances, currBalances);
    }
  }

  return balanceMap;
}

/**
 * Gets the balances to be transferred for a given transfer with increments.
 * @example
 * For a transfer with balances: [{ badgeIds: [{ start: 1n, end: 1n }], amount: 1n }], incrementIdsBy: 1n, toAddressesLength: 1000
 * We return [{ badgeIds: [{ start: 1n, end: 1000n }], amount: 1n }] because we transfer x1 badge to 1000 addresses
 * and increment the badgeIds by 1 each time.
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
      const ownedTimes = deepCopy(balance.ownedTimes);

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementBadgeIdsBy && !transfer.incrementOwnedTimesBy) {
        startBalances = addBalance(startBalances, {
          amount: balance.amount * numRecipients,
          badgeIds,
          ownedTimes,
        });
      } else {
        //If incrementIdsBy is set, then we need to increment the badgeIds after each transfer
        //TODO: This is not efficient, we should be able to LeetCode optimize this somehow. Imagine a claim with 100000000 possible claims.
        for (let i = 0; i < numRecipients; i++) {
          startBalances = addBalance(startBalances, {
            amount: balance.amount,
            badgeIds,
            ownedTimes,
          });

          for (const badgeId of badgeIds) {
            badgeId.start += transfer.incrementBadgeIdsBy || 0n;
            badgeId.end += transfer.incrementBadgeIdsBy || 0n;
          }

          for (const ownedTime of ownedTimes) {
            ownedTime.start += transfer.incrementOwnedTimesBy || 0n;
            ownedTime.end += transfer.incrementOwnedTimesBy || 0n;
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
 */
export const getTransfersFromTransfersWithIncrements = (transfersWithIncrements: TransferWithIncrements<bigint>[]) => {
  const transfers: Transfer<bigint>[] = [];
  for (const transferExtended of transfersWithIncrements) {
    const { toAddressesLength, incrementBadgeIdsBy, incrementOwnedTimesBy, ...transfer } = transferExtended;
    const length = toAddressesLength ? Number(toAddressesLength) : transfer.toAddresses.length;

    //If badges are incremented, we create N unique transfers (one to each address).
    //Else, we can create one transfer with N addresses
    if (incrementBadgeIdsBy || incrementOwnedTimesBy) {
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

          if (incrementOwnedTimesBy) {
            for (const badgeId of currBalances[j].ownedTimes) {
              badgeId.start += incrementOwnedTimesBy;
              badgeId.end += incrementOwnedTimesBy;
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
 */
export const getBalanceAfterTransfer = (balance: Balance<bigint>[], startBadgeId: bigint, endBadgeId: bigint, ownedTimeStart: bigint, ownedTimeEnd: bigint, amountToTransfer: bigint, numRecipients: bigint) => {
  const balanceCopy: Balance<bigint>[] = deepCopy(balance); //need a deep copy of the balance to not mess up calculations

  const newBalance = subtractBalances([
    {
      amount: amountToTransfer * numRecipients,
      badgeIds: [{ start: startBadgeId, end: endBadgeId }],
      ownedTimes: [{ start: ownedTimeStart, end: ownedTimeEnd }],
    }
  ], balanceCopy)

  return newBalance;
}

/**
 * Returns the balance after a set of TransferWithIncrements<bigint>[].
 *
 * @param {Balance<bigint>[]} startBalance - The balance to subtract from.
 * @param {TransferWithIncrements<bigint>[]} transfers - The transfers that are being sent.
 */
export const getBalancesAfterTransfers = (startBalance: Balance<bigint>[], transfers: TransferWithIncrements<bigint>[]) => {
  let endBalances: Balance<bigint>[] = deepCopy(startBalance); //need a deep copy of the balance to not mess up calculations
  for (const transfer of transfers) {
    for (const balance of transfer.balances) {

      //toAddressesLength takes priority
      const _numRecipients = transfer.toAddressesLength ? transfer.toAddressesLength : transfer.toAddresses ? transfer.toAddresses.length : 0;
      const numRecipients = BigInt(_numRecipients);

      const badgeIds = deepCopy(balance.badgeIds);
      const ownedTimes = deepCopy(balance.ownedTimes);

      //If incrementIdsBy is not set, then we are not incrementing badgeIds and we can just batch calculate the balance
      if (!transfer.incrementBadgeIdsBy && !transfer.incrementOwnedTimesBy) {
        for (const badgeId of badgeIds) {
          for (const ownedTime of ownedTimes) {
            endBalances = getBalanceAfterTransfer(endBalances, badgeId.start, badgeId.end, ownedTime.start, ownedTime.end, balance.amount, numRecipients);
          }
        }
      } else {
        //If incrementIdsBy is set, then we need to increment the badgeIds after each transfer
        //TODO: This is not efficient, we should be able to LeetCode optimize this somehow. Imagine a claim with 100000000 possible claims.
        for (let i = 0; i < numRecipients; i++) {
          for (const badgeId of badgeIds) {
            for (const ownedTime of ownedTimes) {
              endBalances = getBalanceAfterTransfer(endBalances, badgeId.start, badgeId.end, ownedTime.start, ownedTime.end, balance.amount, 1n);
            }
          }

          for (const badgeId of badgeIds) {
            badgeId.start += transfer.incrementBadgeIdsBy || 0n;
            badgeId.end += transfer.incrementBadgeIdsBy || 0n;
          }

          for (const ownedTime of ownedTimes) {
            ownedTime.start += transfer.incrementOwnedTimesBy || 0n;
            ownedTime.end += transfer.incrementOwnedTimesBy || 0n;
          }
        }
      }
    }
  }

  return endBalances;
}
