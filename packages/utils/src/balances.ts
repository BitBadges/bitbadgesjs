import { Balance, IdRange, UserBalance } from "bitbadgesjs-proto";
import { getIdxSpanForRange, insertRangeToIdRanges, removeIdsFromIdRange, searchIdRangesForId, sortIdRangesAndMergeIfNecessary } from "./idRanges";
import { safeAddUints, safeSubtractUints } from "./math";

/**
 * Creates a blank balance object with empty balances and approvals
 */
export const getBlankBalance = () => {
  const blankBalance: UserBalance = {
    balances: [],
    approvals: [],
  }
  return blankBalance;
}

/**
 * Find the balance / supply of a specific id within a set of balances.Returns x0 if not found.
 *
 * @param id - The ID to search for.
 * @param balances - The set of balances to search.
 */
export const getBalanceForId = (id: bigint, balances: Balance[]) => {
  for (const balance of balances) {
    const [_idx, found] = searchIdRangesForId(id, balance.badgeIds);
    if (found) {
      return balance.amount;
    }
  }
  return 0n;
}

/**
 * Updates the balance for a specific id from what it currently is to newAmount.
 *
 * @param ranges - The ID ranges to update.
 * @param newAmount - The new amount to set.
 * @param balances - The set of balances to update.
 *
 * @remarks
 * Updates the balances object directly and returns it. Does not create a new object.
 */
export function updateBalancesForIdRanges(ranges: IdRange[], newAmount: bigint, balances: Balance[]) {
  //Can maybe optimize this in the future by doing this all in one loop instead of deleting then setting
  ranges = sortIdRangesAndMergeIfNecessary(ranges)
  balances = deleteBalanceForIdRanges(ranges, balances)
  balances = setBalanceForIdRanges(ranges, newAmount, balances)

  return balances
}

/**
 * Gets the balances for specified ID ranges.
 *
 * Returns a new Balance[] where only the specified ID ranges and their balances are included.
 * Sets balance amount == 0 objects for IDs that are not found.
 *
 * @param badgeIds - The ID ranges to search for.
 * @param currentUserBalances - The set of balances to search.
 *
 * @remarks
 * Returns a new object but also modifies the original.
 */
export function getBalancesForIdRanges(badgeIds: IdRange[], currentUserBalances: Balance[]) {
  let balanceObjectsForSpecifiedRanges: Balance[] = []
  badgeIds = sortIdRangesAndMergeIfNecessary(badgeIds)
  let idRangesNotFound = badgeIds

  for (let userBalanceObj of currentUserBalances) {
    //For each specified range, search the current userBalanceObj's IdRanges to see if there is any overlap.
    //If so, we add the overlapping range and current balance to the new []*types.Balances to be returned.

    for (const idRange of badgeIds) {
      const [idxSpan, found] = getIdxSpanForRange(idRange, userBalanceObj.badgeIds)

      if (found) {
        //Set newIdRanges to the ranges where there is overlap
        let newIdRanges = userBalanceObj.badgeIds.slice(idxSpan.start, idxSpan.end + 1)

        //Remove everything before the start of the range. Only need to remove from idx 0 since it is sorted.
        if (idRange.start > 0 && newIdRanges.length > 0) {
          let everythingBefore: IdRange = {
            start: 0n,
            end: idRange.start - 1n,
          }

          let idRangesWithEverythingBeforeRemoved = removeIdsFromIdRange(everythingBefore, newIdRanges[0])
          idRangesWithEverythingBeforeRemoved = idRangesWithEverythingBeforeRemoved.concat(newIdRanges.slice(1))
          newIdRanges = idRangesWithEverythingBeforeRemoved
        }

        //Remove everything after the end of the range. Only need to remove from last idx since it is sorted.
        if (newIdRanges.length > 0) {
          const rangeToTrim = newIdRanges[newIdRanges.length - 1];

          if (idRange.end < rangeToTrim.end) {
            let everythingAfter: IdRange = {
              start: idRange.end + 1n,
              end: rangeToTrim.end,
            }

            let idRangesWithEverythingAfterRemoved = newIdRanges.slice(0, newIdRanges.length - 1)
            idRangesWithEverythingAfterRemoved = idRangesWithEverythingAfterRemoved.concat(removeIdsFromIdRange(everythingAfter, rangeToTrim))
            newIdRanges = idRangesWithEverythingAfterRemoved
          }
        }

        for (let newIdRange of newIdRanges) {
          let newNotFoundRanges: IdRange[] = []
          for (let idRangeNotFound of idRangesNotFound) {
            newNotFoundRanges = newNotFoundRanges.concat(removeIdsFromIdRange(newIdRange, idRangeNotFound))
          }
          idRangesNotFound = newNotFoundRanges
        }

        balanceObjectsForSpecifiedRanges = updateBalancesForIdRanges(newIdRanges, userBalanceObj.amount, balanceObjectsForSpecifiedRanges)
      }
    }
  }

  //Update balance objects with IDs where balance == 0
  if (idRangesNotFound.length > 0) {
    let updatedBalances: Balance[] = []
    updatedBalances.push({
      amount: 0n,
      badgeIds: idRangesNotFound,
    })
    updatedBalances = updatedBalances.concat(balanceObjectsForSpecifiedRanges)

    return updatedBalances
  } else {
    return balanceObjectsForSpecifiedRanges
  }
}

/**
 * Increments the balance to all ids specified in ranges.
 *
 * @param userBalanceInfo - The user balance info to update.
 * @param ranges - The ID ranges to update.
 * @param balanceToAdd - The balance to add.
 */
export function addBalancesForIdRanges(userBalanceInfo: UserBalance, ranges: IdRange[], balanceToAdd: bigint) {
  let currBalances = getBalancesForIdRanges(ranges, userBalanceInfo.balances);

  for (let currBalanceObj of currBalances) {
    let newBalance = safeAddUints(currBalanceObj.amount, balanceToAdd);
    userBalanceInfo.balances = updateBalancesForIdRanges(currBalanceObj.badgeIds, newBalance, userBalanceInfo.balances);
  }

  return userBalanceInfo
}

/**
 * Decrements the balance to all ids specified in ranges.
 *
 * @param userBalanceInfo - The user balance info to update.
 * @param ranges - The ID ranges to update.
 * @param balanceToRemove - The balance to remove.
 *
 * @remarks
 * Will throw an error if the resulting balance is negative.
 */
export function subtractBalancesForIdRanges(userBalanceInfo: UserBalance, ranges: IdRange[], balanceToRemove: bigint) {
  let currBalances = getBalancesForIdRanges(ranges, userBalanceInfo.balances);
  for (let currBalanceObj of currBalances) {
    let newBalance = safeSubtractUints(currBalanceObj.amount, balanceToRemove);
    userBalanceInfo.balances = updateBalancesForIdRanges(currBalanceObj.badgeIds, newBalance, userBalanceInfo.balances);
  }

  return userBalanceInfo;
}

/**
 * Sets the balance amount to zero for specified ID ranges.
 *
 * @param balanceObjects - The balance objects to update.
 * @param ranges - The ID ranges to update.
 */
export function deleteBalanceForIdRanges(ranges: IdRange[], balanceObjects: Balance[]) {
  let newBalances: Balance[] = [];
  for (let balanceObj of balanceObjects) {
    for (let rangeToDelete of ranges) {
      let currRanges = balanceObj.badgeIds;

      let [idxSpan, found] = getIdxSpanForRange(rangeToDelete, currRanges);

      if (found) {
        if (idxSpan.end == 0) {
          idxSpan.end = idxSpan.start;
        }

        //Remove the ids within the rangeToDelete from existing ranges
        let newIdRanges = currRanges.slice(0, idxSpan.start);
        for (let i = idxSpan.start; i <= idxSpan.end; i++) {
          newIdRanges = newIdRanges.concat(removeIdsFromIdRange(rangeToDelete, currRanges[i]));
        }
        newIdRanges = newIdRanges.concat(currRanges.slice(idxSpan.end + 1));
        balanceObj.badgeIds = newIdRanges;
      }
    }

    // If we don't have any corresponding IDs, don't store this anymore
    if (balanceObj.badgeIds.length > 0) {
      newBalances.push(balanceObj);
    }
  }

  return newBalances
}

/**
 * Sets the balance for a specific id. Assumes all badge IDs specified do not exist.
 *
 * @param ranges - The ID ranges to update.
 * @param amount - The balance to set.
 * @param balanceObjects - The balance objects to update.
 *
 * @remarks
 * Assumes balance does not exist already. If it does, it may cause unexpected behavior.
 */
export function setBalanceForIdRanges(ranges: IdRange[], amount: bigint, balanceObjects: Balance[]) {
  if (amount === 0n) {
    return balanceObjects;
  }

  let [idx, found] = searchBalances(amount, balanceObjects);

  let newBalances: Balance[] = [];
  if (!found) {
    //We don't have an existing object with such a balance
    newBalances = newBalances.concat(balanceObjects.slice(0, idx));
    newBalances.push({
      amount: amount,
      badgeIds: ranges,
    });
    newBalances = newBalances.concat(balanceObjects.slice(idx));
  } else {
    newBalances = balanceObjects;
    for (let rangeToAdd of ranges) {
      newBalances[idx].badgeIds = insertRangeToIdRanges(rangeToAdd, newBalances[idx].badgeIds);
    }

  }

  return newBalances
}


/**
 * Searches for a target amount in a list of balance objects.
 * Returns [idxFoundAt, true] if found, else [idxToInsertAt, false].
 *
 * @param targetAmount - The target amount to search for.
 * @param balanceObjects - The balance objects to search.
 *
 * @remarks Assumes balance objects are sorted.
 */
export function searchBalances(targetAmount: bigint, balanceObjects: Balance[]) {
  // Balances will be sorted, so we can binary search to get the targetIdx.
  let balanceLow = 0;
  let balanceHigh = balanceObjects.length - 1;
  let median = 0;
  let hasEntryWithSameBalance = false;
  let idx = 0;

  while (balanceLow <= balanceHigh) {
    median = Math.floor((balanceLow + balanceHigh) / 2);
    if (balanceObjects[median].amount === targetAmount) {
      hasEntryWithSameBalance = true;
      break;
    } else if (balanceObjects[median].amount > targetAmount) {
      balanceHigh = median - 1;
    } else {
      balanceLow = median + 1;
    }
  }

  if (balanceObjects.length != 0) {
    idx = median + 1
    if (targetAmount <= balanceObjects[median].amount) {
      idx = median
    }
  }

  return [idx, hasEntryWithSameBalance] as [number, boolean]
}
