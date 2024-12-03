import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iBalance, iUintRange } from '@/interfaces/badges/core.js';
import { BaseNumberTypeClass, deepCopyPrimitives, getConverterFunction } from '@/common/base.js';
import * as badges from '@/proto/badges/balances_pb.js';
import { AddressList } from './addressLists.js';
import { castNumberType, safeAdd, safeSubtract } from '../common/math.js';
import type { UniversalPermissionDetails } from './overlaps.js';
import { getOverlapsAndNonOverlaps } from './overlaps.js';
import type { NumberType } from '../common/string-numbers.js';
import { BigIntify, Stringify } from '../common/string-numbers.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { BaseTypedArray } from '@/common/typed-arrays.js';

/**
 * Balance is used to represent a balance of a badge.
 * A user owns x(amount) of the badge IDs (badgeIds) from a specific collection (collectionId) for a range of times (ownershipTimes).
 *
 * @category Balances
 *
 * @see [BitBadges Documentation - Balances](https://docs.bitbadges.io/for-developers/core-concepts/balances)
 */
export class Balance<T extends NumberType> extends BaseNumberTypeClass<Balance<T>> implements iBalance<T> {
  amount: T;
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;

  constructor(balance: iBalance<T>) {
    super();
    this.amount = balance.amount;
    this.badgeIds = UintRangeArray.From(balance.badgeIds);
    this.ownershipTimes = UintRangeArray.From(balance.ownershipTimes);
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): Balance<U> {
    return new Balance<U>(
      deepCopyPrimitives({
        amount: convertFunction(this.amount),
        badgeIds: this.badgeIds.map((b) => b.convert(convertFunction)),
        ownershipTimes: this.ownershipTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): badges.Balance {
    return new badges.Balance(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): Balance<U> {
    return Balance.fromProto(badges.Balance.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): Balance<U> {
    return Balance.fromProto(badges.Balance.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.Balance, convertFunction: (item: NumberType) => U): Balance<U> {
    return new Balance<U>({
      amount: convertFunction(BigInt(item.amount)),
      badgeIds: item.badgeIds.map((b) => UintRange.fromProto(b, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  toArray(): BalanceArray<T> {
    return BalanceArray.From([this.clone()]);
  }
}

/**
 * Applys increments to balances. Returns a new BalanceArray with the incremented balances.
 *
 * @remarks
 * Can also be used via the applyIncrements method on {@link BalanceArray}
 *
 * @category Balances
 */
export const applyIncrementsToBalances = <T extends NumberType>(
  startBalances: iBalance<T>[],
  incrementBadgeIdsBy: T,
  incrementOwnershipTimesBy: T,
  numIncrements: T
) => {
  let balancesToReturn = BalanceArray.From(startBalances).clone();

  balancesToReturn = BalanceArray.From(
    startBalances.map((x) => {
      const badgeIdsIncrement = castNumberType(incrementBadgeIdsBy, BigInt(incrementBadgeIdsBy) * BigInt(numIncrements));
      const ownershipTimesIncrement = castNumberType(incrementOwnershipTimesBy, BigInt(incrementOwnershipTimesBy) * BigInt(numIncrements));

      return new Balance({
        ...x,
        badgeIds: x.badgeIds.map((y) => {
          return {
            start: safeAdd(y.start, badgeIdsIncrement),
            end: safeAdd(y.end, badgeIdsIncrement)
          };
        }),
        ownershipTimes: x.ownershipTimes.map((y) => {
          return {
            start: safeAdd(y.start, ownershipTimesIncrement),
            end: safeAdd(y.end, ownershipTimesIncrement)
          };
        })
      });
    })
  );

  return balancesToReturn;
};

/**
 * Find the balance amount for a specific badge ID at a specific time within a set of balances. Returns x0 if not found.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @param id - The Badge ID to search for.
 * @param time - The time to search for.
 * @param balances - The set of balances to search.
 * @category Balances
 */
export const getBalanceForIdAndTime = <T extends NumberType>(id: T, time: T, balances: iBalance<T>[]) => {
  const convertFunction = getConverterFunction(id);
  let amount = 0n;
  for (const balance of BalanceArray.From(balances)) {
    const found = balance.badgeIds.searchIfExists(id);
    const foundTime = balance.ownershipTimes.searchIfExists(time);
    if (found && foundTime) {
      amount += BigInt(balance.amount);
    }
  }
  return convertFunction(amount);
};

/**
 * Returns all matching balances for a specific badge ID. Returns a new BalanceArray.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function getBalancesForId<T extends NumberType>(badgeId: T, balances: iBalance<T>[]): BalanceArray<T> {
  const matchingBalances: BalanceArray<T> = BalanceArray.From([]);

  for (const balance of BalanceArray.From(balances)) {
    if (balance.badgeIds.searchIfExists(badgeId)) {
      matchingBalances.push(
        new Balance({
          ...balance,
          badgeIds: [{ start: badgeId, end: badgeId }]
        })
      );
    }
  }

  return matchingBalances.clone();
}

/**
 * Returns all matching balances for a specific time via a new BalanceArray.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function getBalancesForTime<T extends NumberType>(time: T, balances: iBalance<T>[]): BalanceArray<T> {
  const matchingBalances: BalanceArray<T> = BalanceArray.From([]);

  for (const balance of BalanceArray.From(balances)) {
    const found = balance.ownershipTimes.searchIfExists(time);
    if (found) {
      matchingBalances.push(balance);
    }
  }

  return matchingBalances.clone();
}

/**
 * Filters out all balances with amount == 0. Returns a new BalanceArray.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function filterZeroBalances<T extends NumberType>(balances: iBalance<T>[]) {
  const newBalances: BalanceArray<T> = BalanceArray.From([]);
  const balanceArr = BalanceArray.From(balances);
  for (let i = 0; i < balanceArr.length; i++) {
    const balance = balanceArr[i];
    if (BigInt(balance.amount) > 0 && balance.badgeIds.length > 0 && balance.ownershipTimes.length > 0) {
      newBalances.push(balance);
    }
  }

  return newBalances;
}

/**
 * Returns true if some balances exceed the specified threshold balances.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function doBalancesExceedThreshold<T extends NumberType>(balances: iBalance<T>[], thresholdBalances: iBalance<T>[]) {
  //Check if we exceed the threshold; will underflow if we do exceed it
  const thresholdCopy = BalanceArray.From(thresholdBalances).clone();

  try {
    subtractBalances(balances, thresholdCopy, false);
  } catch (e) {
    return true;
  }

  return false;
}

/**
 * Attempts to add a balance to the current amounts. Then, it checks if it exceeds some threshold.
 *
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}.
 * Note this function modifies the inputted currTallyBalances
 *
 * @category Balances
 */
export function addBalancesAndCheckIfExceedsThreshold<T extends NumberType>(
  currTally: iBalance<T>[],
  toAdd: iBalance<T>[],
  threshold: iBalance<T>[]
) {
  //If we transferAsMuchAsPossible, we need to increment the currTally by all that we can
  //We then need to return the updated toAdd
  currTally = addBalances(toAdd, currTally);

  //Check if we exceed the threshold; will underflow if we do exceed it
  const doExceed = doBalancesExceedThreshold(currTally, threshold);
  if (doExceed) {
    return true;
  }

  return false;
}

/**
 * Checks if two balances are equal. Flag to check if the balances with zero amounts should be checked as well.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function areBalancesEqual<T extends NumberType>(expected: iBalance<T>[], actual: iBalance<T>[], checkZeroBalances: boolean) {
  expected = BalanceArray.From(expected).clone();
  actual = BalanceArray.From(actual).clone();

  if (!checkZeroBalances) {
    expected = filterZeroBalances(expected);
    actual = filterZeroBalances(actual);
  }

  expected = handleDuplicateBadgeIdsInBalances(expected);
  actual = handleDuplicateBadgeIdsInBalances(actual);

  try {
    actual = subtractBalances(expected, actual, false);
  } catch (e) {
    return false;
  }

  if (actual.length !== 0) {
    return false;
  }

  return true;
}

/**
 * Updates the balance for what it currently is to newAmount.
 *
 * @remarks
 * Returns a new BalanceArray. Does not modify the original.
 *
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function updateBalances<T extends NumberType>(newBalance: iBalance<T>, balances: iBalance<T>[]): BalanceArray<T> {
  let balanceArr = BalanceArray.From(balances).clone();

  // We do a delete then set. Can maybe optimize in future.
  balanceArr = deleteBalances(newBalance.badgeIds, newBalance.ownershipTimes, balanceArr);
  balanceArr = setBalance(newBalance, balanceArr);

  return balanceArr;
}

function getConverterFunctionForBalances<T extends NumberType>(balance: iBalance<T> | iBalance<T>[]): (item: NumberType) => T {
  if (Array.isArray(balance) && balance.length === 0) {
    throw new Error('invalid balance');
  }

  const balanceToCheck = Array.isArray(balance) ? balance[0] : balance;
  return getConverterFunction(balanceToCheck.amount);
}

/**
 * Adds the balanceToAdd to the existing balances. Returns a new BalanceArray.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function addBalance<T extends NumberType>(existingBalances: iBalance<T>[], balanceToAdd: iBalance<T>): BalanceArray<T> {
  const currBalances = getBalancesForIds(balanceToAdd.badgeIds, balanceToAdd.ownershipTimes, existingBalances);
  let existing = BalanceArray.From(existingBalances).clone();
  existing = deleteBalances(balanceToAdd.badgeIds, balanceToAdd.ownershipTimes, existing);
  for (const balance of currBalances) {
    balance.amount = safeAdd(balance.amount, balanceToAdd.amount);
  }

  existing = setBalances(currBalances, existing);

  return existing;
}

/**
 * Adds multiple balances to the existing balances. Returns a new BalanceArray.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function addBalances<T extends NumberType>(balancesToAdd: iBalance<T>[], balances: iBalance<T>[]): BalanceArray<T> {
  let balancesArr = BalanceArray.From(balances).clone();

  for (const balance of balancesToAdd) {
    balancesArr = addBalance(balancesArr, balance);
  }

  return balancesArr;
}

/**
 * Subtracts the balanceToRemove from the existing balances. Returns a new BalanceArray.
 *
 * Throws an error if the balances underflow.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function subtractBalance<T extends NumberType>(
  balances: iBalance<T>[],
  balanceToRemove: iBalance<T>,
  allowUnderflow?: boolean
): BalanceArray<T> {
  const currBalances = getBalancesForIds(balanceToRemove.badgeIds, balanceToRemove.ownershipTimes, balances);
  let balancesArr = BalanceArray.From(balances).clone();

  balancesArr = deleteBalances(balanceToRemove.badgeIds, balanceToRemove.ownershipTimes, balancesArr);

  for (const currBalanceObj of currBalances) {
    currBalanceObj.amount = safeSubtract(currBalanceObj.amount, balanceToRemove.amount, allowUnderflow);
  }

  balancesArr = setBalances(currBalances, balancesArr);

  return balancesArr;
}

/**
 * Subtracts multiple balances from the existing balances. Returns a new BalanceArray.
 *
 * Throws an error if the balances underflow.
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function subtractBalances<T extends NumberType>(
  balancesToSubtract: iBalance<T>[],
  balances: iBalance<T>[],
  allowUnderflow?: boolean
): BalanceArray<T> {
  let newBalances = BalanceArray.From(balances).clone();
  // console.log(JSON.stringify(balancesToSubtract));

  for (const balance of balancesToSubtract) {
    newBalances = subtractBalance(newBalances, balance, allowUnderflow);
  }

  return newBalances;
}

/**
 * Sets a balance to the existing balances.
 *
 * IMPORTANT: This does not check if the balance already exists. It assumes it does not. Use the delete functions first if necesary.
 * Use updateBalances if you want to update an existing balance.
 *
 * @hidden
 *
 * @category Balances
 */
function setBalance<T extends NumberType>(newBalance: iBalance<T>, balances: iBalance<T>[]): BalanceArray<T> {
  let newBalances = BalanceArray.From(balances).clone();

  if (newBalance.amount === 0n) {
    return newBalances;
  }

  newBalances.push(newBalance);
  newBalances = cleanBalances(newBalances);
  newBalances = sortBalancesByAmount(newBalances);

  return newBalances;
}

function setBalances<T extends NumberType>(newBalances: iBalance<T>[], balances: iBalance<T>[]): BalanceArray<T> {
  let newBalancesArr = BalanceArray.From(balances).clone();

  newBalancesArr.push(...newBalances.filter((x) => x.amount !== 0n));
  newBalancesArr = cleanBalances(newBalancesArr);
  newBalancesArr = sortBalancesByAmount(newBalancesArr);

  return newBalancesArr;
}

/**
 * Gets the balances for specified ID ranges.
 *
 * Returns a BalanceArray.From<T> where only the specified ID ranges and their balances are included.
 * Sets balance amount == 0 objects for IDs that are not found.
 *
 * @remarks
 * Returns a new object but also modifies the original.
 *
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function getBalancesForIds<T extends NumberType>(idRanges: iUintRange<T>[], times: iUintRange<T>[], balances: iBalance<T>[]): BalanceArray<T> {
  if (idRanges.length === 0) {
    throw new Error('invalid idRanges');
  }
  const convertFunction = getConverterFunction(idRanges[0].start);

  const fetchedBalances: BalanceArray<bigint> = BalanceArray.From([]);

  const currPermissionDetails: UniversalPermissionDetails[] = [];
  //assumes balances are sorted and non-overlapping
  for (const balanceObj of balances) {
    for (const currRange of balanceObj.badgeIds) {
      for (const currTime of balanceObj.ownershipTimes) {
        currPermissionDetails.push({
          badgeId: new UintRange(currRange).convert(BigIntify),
          ownershipTime: new UintRange(currTime).convert(BigIntify),
          transferTime: UintRange.FullRange(), // dummy range
          timelineTime: UintRange.FullRange(), // dummy range
          toList: AddressList.AllAddresses(),
          fromList: AddressList.AllAddresses(),
          initiatedByList: AddressList.AllAddresses(),
          approvalIdList: AddressList.AllAddresses(),

          arbitraryValue: balanceObj.amount,

          permanentlyPermittedTimes: UintRangeArray.From([]),
          permanentlyForbiddenTimes: UintRangeArray.From([])
        });
      }
    }
  }

  const toFetchPermissionDetails: UniversalPermissionDetails[] = [];
  for (const rangeToFetch of idRanges) {
    for (const timeToFetch of times) {
      toFetchPermissionDetails.push({
        badgeId: new UintRange(rangeToFetch).convert(BigIntify),
        ownershipTime: new UintRange(timeToFetch).convert(BigIntify),
        transferTime: UintRange.FullRange(), //dummy range
        timelineTime: UintRange.FullRange(), // dummy range
        toList: AddressList.AllAddresses(),
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        approvalIdList: AddressList.AllAddresses(),

        permanentlyPermittedTimes: UintRangeArray.From([]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        arbitraryValue: 0n
      });
    }
  }

  const [overlaps, , inSecondButNotFirst] = getOverlapsAndNonOverlaps(currPermissionDetails, toFetchPermissionDetails);

  // For all overlaps, we simply return the amount
  for (const overlapObject of overlaps) {
    const overlap = overlapObject.overlap;
    const amount = BigInt(overlapObject.firstDetails.arbitraryValue);

    fetchedBalances.push(
      new Balance({
        amount: amount,
        badgeIds: [overlap.badgeId],
        ownershipTimes: [overlap.ownershipTime]
      })
    );
  }

  // For those that were in toFetch but not currBalances, we return amount == 0
  for (const detail of inSecondButNotFirst) {
    fetchedBalances.push(
      new Balance({
        amount: 0n,
        badgeIds: [detail.badgeId],
        ownershipTimes: [detail.ownershipTime]
      })
    );
  }

  //Handle duplicates
  return fetchedBalances.convert(convertFunction);
}

/**
 * Deletes the balances for specified ID ranges and times.
 *
 * Modifies and returns the original balances object with the deleted balances removed.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
function deleteBalances<T extends NumberType>(
  rangesToDelete: iUintRange<T>[],
  timesToDelete: iUintRange<T>[],
  balances: iBalance<T>[]
): BalanceArray<T> {
  if (balances.length === 0) {
    return BalanceArray.From([]);
  }

  const convertFunction = getConverterFunctionForBalances(balances);
  const newBalances: BalanceArray<bigint> = BalanceArray.From([]);

  const toDeletePermissionDetails: UniversalPermissionDetails[] = [];
  for (const rangeToDelete of rangesToDelete) {
    for (const timeToDelete of timesToDelete) {
      toDeletePermissionDetails.push({
        badgeId: new UintRange(rangeToDelete).convert(BigIntify),
        ownershipTime: new UintRange(timeToDelete).convert(BigIntify),
        transferTime: UintRange.FullRange(), //dummy range
        timelineTime: UintRange.FullRange(), //dummy range
        toList: AddressList.AllAddresses(),
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        approvalIdList: AddressList.AllAddresses(),

        permanentlyPermittedTimes: UintRangeArray.From([]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        arbitraryValue: 0n
      });
    }
  }

  for (const balanceObj of balances) {
    const currPermissionDetails: UniversalPermissionDetails[] = [];
    for (const currRange of balanceObj.badgeIds) {
      for (const currTime of balanceObj.ownershipTimes) {
        currPermissionDetails.push({
          badgeId: new UintRange(currRange).convert(BigIntify),
          ownershipTime: new UintRange(currTime).convert(BigIntify),
          transferTime: UintRange.FullRange(), //dummy range
          timelineTime: UintRange.FullRange(), //dummy range
          toList: AddressList.AllAddresses(),
          fromList: AddressList.AllAddresses(),
          initiatedByList: AddressList.AllAddresses(),
          approvalIdList: AddressList.AllAddresses(),

          permanentlyPermittedTimes: UintRangeArray.From([]),
          permanentlyForbiddenTimes: UintRangeArray.From([]),
          arbitraryValue: balanceObj.amount
        });
      }
    }

    const [, inOldButNotNew] = getOverlapsAndNonOverlaps(currPermissionDetails, toDeletePermissionDetails);
    for (const remainingBalance of inOldButNotNew) {
      newBalances.push(
        new Balance<bigint>({
          amount: BigInt(balanceObj.amount),
          badgeIds: [remainingBalance.badgeId],
          ownershipTimes: [remainingBalance.ownershipTime]
        })
      );
    }
  }

  return BalanceArray.From(newBalances.map((x) => x.convert(convertFunction)));
}

/**
 * Sorts balances by their amount property. Returns a new BalanceArray.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function sortBalancesByAmount<T extends NumberType>(balances: iBalance<T>[]) {
  return BalanceArray.From(
    balances.sort((a, b) => {
      return a.amount > b.amount ? 1 : -1;
    })
  );
}

/**
 * Cleans balances. Merges overlapping badgeIds and ownershipTimes, sorts by amounts, and handles duplicate badgeIds.
 *
 * @category Balances
 */
export function cleanBalances<T extends NumberType>(balancesArr: iBalance<T>[]) {
  let balances = BalanceArray.From(balancesArr);
  for (const balance of balances) {
    balance.badgeIds.sortAndMerge();
    balance.ownershipTimes.sortAndMerge();
  }
  balances = sortBalancesByAmount(balances);

  //we also see if we can merge cross-balances
  const newBalances: BalanceArray<T> = BalanceArray.From([]);
  for (let i = 0; i < balances.length; i++) {
    const currBalance = balances[i];

    let merged = false;
    for (let j = 0; j < newBalances.length; j++) {
      const newBalance = newBalances[j];

      //If the balances are equal, we merge them
      if (currBalance.amount == newBalance.amount) {
        //If the balances are equal, we merge them
        if (uintRangeArrsEqual(currBalance.badgeIds, newBalance.badgeIds)) {
          newBalance.ownershipTimes.push(...currBalance.ownershipTimes);
          newBalance.ownershipTimes.sortAndMerge();
          merged = true;
          break;
        } else if (uintRangeArrsEqual(currBalance.ownershipTimes, newBalance.ownershipTimes)) {
          newBalance.badgeIds.push(...currBalance.badgeIds);
          newBalance.badgeIds.sortAndMerge();
          merged = true;
          break;
        }
      } else if (currBalance.amount > newBalance.amount) {
        j = newBalances.length;
        break;
      }
    }

    if (!merged) {
      newBalances.push(currBalance);
    }
  }

  return newBalances;
}

/**
 * @category Uint Ranges
 */
export function uintRangeArrsEqual<T extends NumberType>(arr1: UintRangeArray<T>, arr2: UintRangeArray<T>) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i].start !== arr2[i].start || arr1[i].end !== arr2[i].end) {
      return false;
    }
  }

  return true;
}

/**
 * Sorts and merges balances. Precondition that all badgeIds and ownershipTimes are non-overlapping.
 *
 * @param balances - The balances to sort and merge.
 *
 * @category Balances
 */
export function sortAndMergeBalances<T extends NumberType>(balances: iBalance<T>[]) {
  balances = handleDuplicateBadgeIdsInBalances(balances);
  balances = cleanBalances(balances);
  balances = sortBalancesByAmount(balances);

  return balances;
}

/**
 * Handles duplicate badgeIds in balances. Returns a new BalanceArray.
 *
 * For example, if we have x1 of ID 1 and x1 of ID 1, we will return x2 of ID 1.
 *
 * @category Balances
 */
export function handleDuplicateBadgeIdsInBalances<T extends NumberType>(balances: iBalance<T>[]) {
  let newBalances: BalanceArray<T> = BalanceArray.From([]);
  newBalances.addBalances(balances);
  return newBalances;
}

interface BalanceFunctions<T extends NumberType> {
  getBalanceForIdAndTime: (badgeId: T, ownedTime: T) => T;
  getBalancesForId: (badgeId: T) => BalanceArray<T>;
  getBalancesForTime: (ownedTime: T) => BalanceArray<T>;
  filterZeroBalances: () => void;
  subsetOf: (threshold: iBalance<T>[]) => boolean;
  equalBalances: (other: iBalance<T>[], checkZeroBalances?: boolean) => boolean;
  updateBalances: (newBalance: iBalance<T>) => void;
  addBalances: (balancesToAdd: iBalance<T>[]) => void;
  addBalance: (balanceToAdd: iBalance<T>) => void;
  subtractBalances: (balancesToSubtract: iBalance<T>[], allowUnderflow: boolean) => void;
  subtractBalance: (balanceToSubtract: iBalance<T>, allowUnderflow: boolean) => void;
  sortBalancesByAmount: () => void;
  applyIncrements: (incrementBadgeIdsBy: T, incrementOwnershipTimesBy: T, numIncrements: T) => void;
}

/**
 * @category Balances
 */
export class BalanceArray<T extends NumberType> extends BaseTypedArray<BalanceArray<T>, Balance<T>> implements BalanceFunctions<T> {
  static From<T extends NumberType>(arr: iBalance<T>[] | iBalance<T> | BalanceArray<T>): BalanceArray<T> {
    const wrappedArr = Array.isArray(arr) ? arr : [arr];
    return new BalanceArray(...wrappedArr.map((x) => new Balance(x)));
  }

  /**
   * @hidden
   */
  push(...items: iBalance<T>[] | BalanceArray<T>): number {
    return super.push(...items.map((i) => new Balance(i)));
  }

  /**
   * @hidden
   */
  fill(value: iBalance<T>, start?: number | undefined, end?: number | undefined): this {
    return super.fill(new Balance(value), start, end);
  }

  /**
   * @hidden
   */
  with(index: number, value: iBalance<T>): BalanceArray<T> {
    return super.with(index, new Balance(value));
  }

  /**
   * @hidden
   */
  unshift(...items: iBalance<T>[] | BalanceArray<T>): number {
    return super.unshift(...items.map((i) => new Balance(i)));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BalanceArray<U> {
    return BalanceArray.From(this.map((x) => x.convert(convertFunction)));
  }

  clone(): BalanceArray<T> {
    return BalanceArray.From(this.map((x) => x.clone()));
  }

  /**
   * {@inheritDoc getBalanceForIdAndTime}
   */
  getBalanceForIdAndTime(badgeId: T, ownedTime: T) {
    return getBalanceForIdAndTime(badgeId, ownedTime, this);
  }

  /**
   * {@inheritDoc getBalancesForId}
   */
  getBalancesForId(badgeId: T) {
    return getBalancesForId(badgeId, this);
  }

  /**
   * {@inheritDoc getBalancesForTime}
   */
  getBalancesForTime(ownedTime: T) {
    return getBalancesForTime(ownedTime, this);
  }

  /**
   * {@inheritDoc filterZeroBalances}
   */
  filterZeroBalances(): this {
    const newBalances = this.filter((x) => BigInt(x.amount) !== BigInt(0) && x.badgeIds.length > 0 && x.ownershipTimes.length > 0);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * Checks if the current balances are a subset of the threshold balances (i.e. doesn't exceed the threshold).
   */
  subsetOf(threshold: iBalance<T>[] | BalanceArray<T>) {
    const res = doBalancesExceedThreshold(
      this.map((x) => x.convert(BigIntify)),
      BalanceArray.From(threshold).map((x) => x.convert(BigIntify))
    );
    return !res;
  }

  /**
   * {@inheritDoc areBalancesEqual}
   */
  equalBalances(other: iBalance<T>[] | BalanceArray<T>, checkZeroBalances = false) {
    return areBalancesEqual(
      this.map((x) => x.convert(BigIntify)),
      BalanceArray.From(other).map((x) => x.convert(BigIntify)),
      checkZeroBalances
    );
  }

  /**
   * {@inheritDoc updateBalances}
   */
  updateBalances(newBalance: iBalance<T>): this {
    const newBalances = updateBalances(newBalance, this);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc addBalances}
   */
  addBalances(balancesToAdd: iBalance<T>[] | BalanceArray<T>): this {
    const newBalances = addBalances(balancesToAdd, this);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc addBalance}
   */
  addBalance(balanceToAdd: iBalance<T>): this {
    const newBalances = addBalance(this, balanceToAdd);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc subtractBalances}
   */
  subtractBalances(balancesToSubtract: iBalance<T>[] | BalanceArray<T>, allowNegatives = false) {
    const newBalances = subtractBalances(balancesToSubtract, this, allowNegatives);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc subtractBalance}
   */
  subtractBalance(balanceToSubtract: iBalance<T>, allowUnderflow: boolean) {
    return this.subtractBalances([balanceToSubtract], allowUnderflow);
  }

  /**
   * {@inheritDoc sortBalancesByAmount}
   */
  sortBalancesByAmount() {
    const newBalances = sortBalancesByAmount(this);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc applyIncrementsToBalances}
   */
  applyIncrements(incrementBadgeIdsBy: T, incrementOwnershipTimesBy: T, numIncrements: T) {
    const newBalances = applyIncrementsToBalances(this, incrementBadgeIdsBy, incrementOwnershipTimesBy, numIncrements);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * Gets all badge IDs from the balances (sorted and merged).
   */
  getAllBadgeIds() {
    const badgeIds = new UintRangeArray<T>();
    for (const balance of this) {
      badgeIds.push(...balance.badgeIds);
    }
    return badgeIds.clone().sortAndMerge();
  }
}
