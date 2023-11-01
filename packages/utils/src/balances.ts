import { Balance, UintRange, UserBalance, deepCopy } from "bitbadgesjs-proto";
import { UniversalPermissionDetails } from "./overlaps";
import { safeAddUints, safeSubtractUints } from "./math";
import { getOverlapsAndNonOverlaps } from "./overlaps";
import { BitBadgesCollection } from "./types/collections";
import { CollectionInfoBase } from "./types/db";
import { searchUintRangesForId, sortUintRangesAndMergeIfNecessary } from "./uintRanges";

/**
 * Creates a blank balance object with empty balances and approvals.
 *
 * This appends the defaults according to the collection's specified ones. Override this for the "Mint" address (bc it has no approvals).
 * @category Balances
*/
export function getBlankBalance(nonMintApproval: boolean, collection?: BitBadgesCollection<bigint> | CollectionInfoBase<bigint>): UserBalance<bigint> {
  if (nonMintApproval && !collection) {
    throw new Error("Cannot create a blank balance for a non-mint approval without a collection. Must know default details");
  }

  const blankBalance: UserBalance<bigint> = {
    balances: [],
    incomingApprovals: collection ? collection.defaultUserIncomingApprovals : [],
    outgoingApprovals: collection ? collection.defaultUserOutgoingApprovals : [],
    autoApproveSelfInitiatedIncomingTransfers: collection ? collection.defaultAutoApproveSelfInitiatedIncomingTransfers : false,
    autoApproveSelfInitiatedOutgoingTransfers: collection ? collection.defaultAutoApproveSelfInitiatedOutgoingTransfers : false,
    userPermissions: collection ? collection.defaultUserPermissions : {
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
    },
  }

  return deepCopy(blankBalance);
}

/**
 * Find the balance amount for a specific badge ID at a specific time within a set of balances. Returns x0 if not found.
 *
 * @param id - The Badge ID to search for.
 * @param time - The time to search for.
 * @param balances - The set of balances to search.
 * @category Balances
*/
export const getBalanceForIdAndTime = (id: bigint, time: bigint, balances: Balance<bigint>[]) => {
  let amount = 0n;
  for (const balance of balances) {
    const [_idx, found] = searchUintRangesForId(id, balance.badgeIds);
    const [_, foundTime] = searchUintRangesForId(time, balance.ownershipTimes);
    if (found && foundTime) {
      amount += balance.amount;
    }
  }
  return amount;
}

/**
 * Returns all matching balances for a specific Badge ID.
 * @category Balances
*/
export function getBalancesForId(badgeId: bigint, balances: Balance<bigint>[]) {
  let matchingBalances: Balance<bigint>[] = [];

  for (let balance of balances) {
    let [_, found] = searchUintRangesForId(badgeId, balance.badgeIds);
    if (found) {
      matchingBalances.push(balance);
    }
  }

  return deepCopy(matchingBalances);
}

/**
 * Returns all matching balances for a specific time
 * @category Balances
*/
export function getBalancesForTime(time: bigint, balances: Balance<bigint>[]) {
  let matchingBalances: Balance<bigint>[] = [];

  for (let balance of balances) {
    let [_, found] = searchUintRangesForId(time, balance.ownershipTimes);
    if (found) {
      matchingBalances.push(balance);
    }
  }

  return deepCopy(matchingBalances);
}

/**
 * Filters out all balances with amount == 0.
 * @category Balances
*/
export function filterZeroBalances(balances: Balance<bigint>[]) {
  let newBalances = [];
  for (let i = 0; i < balances.length; i++) {
    let balance = balances[i];
    if (balance.amount > 0) {
      newBalances.push(balance);
    }
  }

  return newBalances;
}

/**
 * Returns true if some balances exceed the specified threshold balances.
 * @category Balances
*/
export function doBalancesExceedThreshold(balances: Balance<bigint>[], thresholdBalances: Balance<bigint>[]) {
  //Check if we exceed the threshold; will underflow if we do exceed it
  let thresholdCopy = deepCopyBalances(thresholdBalances);

  try {
    subtractBalances(balances, thresholdCopy)
  } catch (e) {
    return true;
  }

  return false;
}

/**
 * Attempts to add a balance to the current amounts. Then, it checks if it exceeds some threshold.
 *
 * Note this function modifies the inputted currTallyBalances
 * @category Balances
*/
export function addBalancesAndCheckIfExceedsThreshold(currTally: Balance<bigint>[], toAdd: Balance<bigint>[], threshold: Balance<bigint>[]) {

  //If we transferAsMuchAsPossible, we need to increment the currTally by all that we can
  //We then need to return the updated toAdd
  currTally = addBalances(toAdd, currTally);

  //Check if we exceed the threshold; will underflow if we do exceed it
  let doExceed = doBalancesExceedThreshold(currTally, threshold);
  if (doExceed) {
    return true;
  }

  return false;
}

/**
 * Checks if two balances are equal. Flag to check if the balances with zero amounts should be checked as well.
 * @category Balances
*/
export function areBalancesEqual(expected: Balance<bigint>[], actual: Balance<bigint>[], checkZeroBalances: boolean) {
  expected = deepCopyBalances(expected);
  actual = deepCopyBalances(actual);

  if (!checkZeroBalances) {
    expected = filterZeroBalances(expected);
    actual = filterZeroBalances(actual);
  }

  try {
    actual = subtractBalances(expected, actual);
  } catch (e) {
    return false;
  }

  if (actual.length !== 0) {
    return false;
  }

  return true;
}

export function deepCopyBalances(balances: Balance<bigint>[]) {
  let newBalances = [];
  for (let i = 0; i < balances.length; i++) {
    let approval = balances[i];
    let balanceToAdd: Balance<bigint> = {
      amount: approval.amount,
      badgeIds: [],
      ownershipTimes: []
    };

    for (let j = 0; j < approval.badgeIds.length; j++) {
      let badgeId = approval.badgeIds[j];
      balanceToAdd.badgeIds.push({
        start: badgeId.start,
        end: badgeId.end
      });
    }

    for (let k = 0; k < approval.ownershipTimes.length; k++) {
      let time = approval.ownershipTimes[k];
      balanceToAdd.ownershipTimes.push({
        start: time.start,
        end: time.end
      });
    }

    newBalances.push(balanceToAdd);
  }

  return newBalances;
}

/**
 * Updates the balance for what it currently is to newAmount.
 *
 * @param newBalance - The new balance to set.
 * @param balances - The set of balances to update.
 *
 * @remarks
 * Updates the balances object directly and returns it. Does not create a new object.
 * @category Balances
*/
export function updateBalances(newBalance: Balance<bigint>, balances: Balance<bigint>[]) {
  // We do a delete then set. Can maybe optimize in future.
  balances = deleteBalances(newBalance.badgeIds, newBalance.ownershipTimes, balances);
  balances = setBalance(newBalance, balances);

  return balances;
}


/**
 * Adds the balanceToAdd to the existing balances.
 * @category Balances
*/
export function addBalance(existingBalances: Balance<bigint>[], balanceToAdd: Balance<bigint>, allowNegative?: boolean) {
  const currBalances = getBalancesForIds(balanceToAdd.badgeIds, balanceToAdd.ownershipTimes, existingBalances);

  for (let balance of currBalances) {
    balance.amount = safeAddUints(balance.amount, balanceToAdd.amount, allowNegative);

    existingBalances = updateBalances(balance, existingBalances);
  }

  return existingBalances;
}

/**
 * Adds multiple balances to the existing balances.
 * @category Balances
*/
export function addBalances(balancesToAdd: Balance<bigint>[], balances: Balance<bigint>[], allowNegative?: boolean) {

  for (let balance of balancesToAdd) {
    balances = addBalance(balances, balance, allowNegative);
  }

  return balances;
}

/**
 * Subtracts the balanceToRemove from the existing balances.
 *
 * Throws an error if the balances underflow.
 * @category Balances
*/
export function subtractBalance(balances: Balance<bigint>[], balanceToRemove: Balance<bigint>, allowUnderflow?: boolean) {
  const currBalances = getBalancesForIds(balanceToRemove.badgeIds, balanceToRemove.ownershipTimes, balances);

  for (let currBalanceObj of currBalances) {
    // Use BigInt for safe subtraction
    currBalanceObj.amount = safeSubtractUints(currBalanceObj.amount, balanceToRemove.amount, allowUnderflow);

    balances = updateBalances(currBalanceObj, balances);
  }

  return balances;
}

/**
 * Subtracts multiple balances from the existing balances.
 *
 * Throws an error if the balances underflow.
 * @category Balances
*/
export function subtractBalances(balancesToSubtract: Balance<bigint>[], balances: Balance<bigint>[], allowUnderflow?: boolean) {
  for (let balance of balancesToSubtract) {
    balances = subtractBalance(balances, balance, allowUnderflow);
  }

  return balances;
}

/**
 * Sets a balance to the existing balances.
 * IMPORTANT: This does not check if the balance already exists. It assumes it does not. Use the delete functions first if necesary.
 * @category Balances
*/
export function setBalance(newBalance: Balance<bigint>, balances: Balance<bigint>[]) {
  if (newBalance.amount === 0n) {
    return balances;
  }

  balances.push(newBalance);
  balances = cleanBalances(balances);
  balances = sortBalancesByAmount(balances);

  return balances;
}

/**
 * Gets the balances for specified ID ranges.
 *
 * Returns a new Balance<bigint>[] where only the specified ID ranges and their balances are included.
 * Sets balance amount == 0 objects for IDs that are not found.
 *
 * @param badgeIds - The ID ranges to search for.
 * @param currentUserBalances - The set of balances to search.
 *
 * @remarks
 * Returns a new object but also modifies the original.
 * @category Balances
*/
export function getBalancesForIds(idRanges: UintRange<bigint>[], times: UintRange<bigint>[], balances: Balance<bigint>[]) {
  const fetchedBalances: Balance<bigint>[] = [];

  const currPermissionDetails: UniversalPermissionDetails[] = [];
  for (const balanceObj of balances) {
    for (const currRange of balanceObj.badgeIds) {
      for (const currTime of balanceObj.ownershipTimes) {
        currPermissionDetails.push({
          badgeId: currRange,
          ownershipTime: currTime,
          transferTime: { start: BigInt("18446744073709551615"), end: BigInt("18446744073709551615") }, // dummy range
          timelineTime: { start: BigInt("18446744073709551615"), end: BigInt("18446744073709551615") }, // dummy range
          toMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          fromMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          initiatedByMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          amountTrackerIdMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          challengeTrackerIdMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          arbitraryValue: balanceObj.amount,

          permittedTimes: [],
          forbiddenTimes: []
        });
      }
    }
  }

  const toFetchPermissionDetails: UniversalPermissionDetails[] = [];
  for (const rangeToFetch of idRanges) {
    for (const timeToFetch of times) {
      toFetchPermissionDetails.push({
        badgeId: rangeToFetch,
        ownershipTime: timeToFetch,
        transferTime: { start: BigInt("18446744073709551615"), end: BigInt("18446744073709551615") }, // dummy range
        timelineTime: { start: BigInt("18446744073709551615"), end: BigInt("18446744073709551615") }, // dummy range
        toMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
        fromMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
        initiatedByMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
        amountTrackerIdMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
        challengeTrackerIdMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },

        permittedTimes: [],
        forbiddenTimes: [],
        arbitraryValue: 0n,
      });
    }
  }

  const [overlaps, _x, inSecondButNotFirst] = getOverlapsAndNonOverlaps(currPermissionDetails, toFetchPermissionDetails);
  // For all overlaps, we simply return the amount
  for (const overlapObject of overlaps) {
    const overlap = overlapObject.overlap;
    const amount = BigInt(overlapObject.firstDetails.arbitraryValue);

    fetchedBalances.push({
      amount: amount,
      badgeIds: [overlap.badgeId],
      ownershipTimes: [overlap.ownershipTime],
    });
  }

  // For those that were in toFetch but not currBalances, we return amount == 0
  for (const detail of inSecondButNotFirst) {
    fetchedBalances.push({
      amount: 0n,
      badgeIds: [detail.badgeId],
      ownershipTimes: [detail.ownershipTime],
    });
  }

  return fetchedBalances;
}

/**
 * Deletes the balances for specified ID ranges and times.
 *
 * Modifies and returns the original balances object with the deleted balances removed.
 * @category Balances
*/
export function deleteBalances(rangesToDelete: UintRange<bigint>[], timesToDelete: UintRange<bigint>[], balances: Balance<bigint>[]): Balance<bigint>[] {
  let newBalances: Balance<bigint>[] = [];

  for (let balanceObj of balances) {
    let currPermissionDetails: UniversalPermissionDetails[] = [];
    for (let currRange of balanceObj.badgeIds) {
      for (let currTime of balanceObj.ownershipTimes) {
        currPermissionDetails.push({
          badgeId: currRange,
          ownershipTime: currTime,
          transferTime: { start: BigInt(Number.MAX_SAFE_INTEGER), end: BigInt(Number.MAX_SAFE_INTEGER) }, //dummy range
          timelineTime: { start: BigInt(Number.MAX_SAFE_INTEGER), end: BigInt(Number.MAX_SAFE_INTEGER) }, //dummy range
          toMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          fromMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          initiatedByMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          amountTrackerIdMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          challengeTrackerIdMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },

          permittedTimes: [],
          forbiddenTimes: [],
          arbitraryValue: 0n,
        });
      }
    }

    let toDeletePermissionDetails: UniversalPermissionDetails[] = [];
    for (let rangeToDelete of rangesToDelete) {
      for (let timeToDelete of timesToDelete) {
        toDeletePermissionDetails.push({
          badgeId: rangeToDelete,
          ownershipTime: timeToDelete,
          transferTime: { start: BigInt(Number.MAX_SAFE_INTEGER), end: BigInt(Number.MAX_SAFE_INTEGER) }, //dummy range
          timelineTime: { start: BigInt(Number.MAX_SAFE_INTEGER), end: BigInt(Number.MAX_SAFE_INTEGER) }, //dummy range
          toMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          fromMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          initiatedByMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          amountTrackerIdMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },
          challengeTrackerIdMapping: { addresses: ["Mint"], includeAddresses: false, mappingId: "", uri: "", customData: "", createdBy: "" },

          permittedTimes: [],
          forbiddenTimes: [],
          arbitraryValue: 0n,
        });
      }
    }

    let [_, inOldButNotNew, __] = getOverlapsAndNonOverlaps(currPermissionDetails, toDeletePermissionDetails);
    for (let remainingBalance of inOldButNotNew) {
      newBalances.push({
        amount: balanceObj.amount,
        badgeIds: [remainingBalance.badgeId],
        ownershipTimes: [remainingBalance.ownershipTime],
      });
    }
  }

  return newBalances;
}

/**
 * @category Balances
 */
export function sortBalancesByAmount(balances: Balance<bigint>[]) {
  return balances.sort((a, b) => {
    return a.amount > b.amount ? 1 : -1;
  });
}

export function cleanBalances(balances: Balance<bigint>[]) {
  for (let balance of balances) {
    balance.badgeIds = sortUintRangesAndMergeIfNecessary(balance.badgeIds, false);
    balance.ownershipTimes = sortUintRangesAndMergeIfNecessary(balance.ownershipTimes, false);
  }

  return balances
}

/**
 * Sorts and merges balances. Precondition that all badgeIds and ownershipTimes are non-overlapping.
 *
 * @param balances - The balances to sort and merge.
 *
 * @category Balances
 */
export function sortAndMergeBalances(balances: Balance<bigint>[]) {
  balances = handleDuplicateBadgeIdsInBalances(balances);
  balances = cleanBalances(balances);
  balances = sortBalancesByAmount(balances);

  return balances
}

/**
 * @category Balances
 */
export function handleDuplicateBadgeIdsInBalances(balances: Balance<bigint>[]) {
  let newBalances: Balance<bigint>[] = [];
  for (const balance of balances) {
    for (const badgeId of balance.badgeIds) {
      for (const time of balance.ownershipTimes) {
        newBalances = addBalance(newBalances, {
          amount: balance.amount,
          badgeIds: [badgeId],
          ownershipTimes: [time],
        });
      }
    }
  }

  return newBalances;
}
