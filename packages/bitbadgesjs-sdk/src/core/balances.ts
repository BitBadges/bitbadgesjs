import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iBalance, iUintRange } from '@/interfaces/types/core.js';
import { BaseNumberTypeClass, ConvertOptions, deepCopyPrimitives, getConverterFunction } from '@/common/base.js';
import * as protobadges from '@/proto/badges/balances_pb.js';
import { AddressList } from './addressLists.js';
import { castNumberType, safeAdd, safeSubtract } from '../common/math.js';
import type { UniversalPermissionDetails } from './overlaps.js';
import { getOverlapsAndNonOverlaps } from './overlaps.js';
import type { NumberType } from '../common/string-numbers.js';
import { BigIntify, Stringify } from '../common/string-numbers.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { BaseTypedArray } from '@/common/typed-arrays.js';

/**
 * Balance is used to represent a balance of a token.
 * A user owns x(amount) of the token IDs (tokenIds) from a specific collection (collectionId) for a range of times (ownershipTimes).
 *
 * @category Balances
 *
 * @see [BitBadges Documentation - Balances](https://docs.bitbadges.io/for-developers/core-concepts/balances)
 */
export class Balance extends BaseNumberTypeClass<Balance> implements iBalance {
  amount: string | number;
  tokenIds: UintRangeArray;
  ownershipTimes: UintRangeArray;

  constructor(balance: iBalance) {
    super();
    this.amount = balance.amount;
    this.tokenIds = UintRangeArray.From(balance.tokenIds);
    this.ownershipTimes = UintRangeArray.From(balance.ownershipTimes);
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): Balance {
    return new Balance(
      deepCopyPrimitives({
        amount: convertFunction(this.amount),
        tokenIds: this.tokenIds.map((b) => b.convert(convertFunction)),
        ownershipTimes: this.ownershipTimes.map((b) => b.convert(convertFunction))
      })
    );
  }

  toProto(): protobadges.Balance {
    return new protobadges.Balance(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): Balance {
    return Balance.fromProto(protobadges.Balance.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): Balance {
    return Balance.fromProto(protobadges.Balance.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.Balance, convertFunction: (item: string | number) => U): Balance {
    return new Balance({
      amount: convertFunction(BigInt(item.amount)),
      tokenIds: item.tokenIds.map((b) => UintRange.fromProto(b, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((b) => UintRange.fromProto(b, convertFunction))
    });
  }

  toArray(): BalanceArray {
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
export const applyIncrementsToBalances = (startBalances: iBalance[], incrementTokenIdsBy: T, incrementOwnershipTimesBy: T, numIncrements: T, durationFromTimestamp: T, blockTime: T) => {
  let balancesToReturn = BalanceArray.From(startBalances).clone();

  balancesToReturn = BalanceArray.From(
    startBalances.map((x) => {
      const tokenIdsIncrement = castNumberType(incrementTokenIdsBy, BigInt(incrementTokenIdsBy) * BigInt(numIncrements));
      const ownershipTimesIncrement = castNumberType(incrementOwnershipTimesBy, BigInt(incrementOwnershipTimesBy) * BigInt(numIncrements));

      return new Balance({
        ...x,
        tokenIds: x.tokenIds.map((y) => {
          return {
            start: safeAdd(y.start, tokenIdsIncrement),
            end: safeAdd(y.end, tokenIdsIncrement)
          };
        }),
        ownershipTimes:
          BigInt(durationFromTimestamp) > 0n
            ? [
                {
                  start: blockTime,
                  end: safeSubtract(safeAdd(blockTime, durationFromTimestamp), castNumberType(blockTime, 1n))
                }
              ]
            : x.ownershipTimes.map((y) => {
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
 * Find the balance amount for a specific token ID at a specific time within a set of balances. Returns x0 if not found.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @param id - The Token ID to search for.
 * @param time - The time to search for.
 * @param balances - The set of balances to search.
 * @category Balances
 */
export const getBalanceForIdAndTime = (id: T, time: T, balances: iBalance[]) => {
  const convertFunction = getConverterFunction(id);
  let amount = 0n;
  for (const balance of BalanceArray.From(balances)) {
    const found = balance.tokenIds.searchIfExists(id);
    const foundTime = balance.ownershipTimes.searchIfExists(time);
    if (found && foundTime) {
      amount += BigInt(balance.amount);
    }
  }
  return convertFunction(amount);
};

/**
 * Returns all matching balances for a specific token ID. Returns a new BalanceArray.
 *
 * @remarks
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function getBalancesForId(tokenId: T, balances: iBalance[]): BalanceArray {
  const matchingBalances: BalanceArray = BalanceArray.From([]);

  for (const balance of BalanceArray.From(balances)) {
    if (balance.tokenIds.searchIfExists(tokenId)) {
      matchingBalances.push(
        new Balance({
          ...balance,
          tokenIds: [{ start: tokenId, end: tokenId }]
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
export function getBalancesForTime(time: T, balances: iBalance[]): BalanceArray {
  const matchingBalances: BalanceArray = BalanceArray.From([]);

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
export function filterZeroBalances(balances: iBalance[]) {
  const newBalances: BalanceArray = BalanceArray.From([]);
  const balanceArr = BalanceArray.From(balances);
  for (let i = 0; i < balanceArr.length; i++) {
    const balance = balanceArr[i];
    if (BigInt(balance.amount) > 0 && balance.tokenIds.length > 0 && balance.ownershipTimes.length > 0) {
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
export function doBalancesExceedThreshold(balances: iBalance[], thresholdBalances: iBalance[]) {
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
export function addBalancesAndCheckIfExceedsThreshold(currTally: iBalance[], toAdd: iBalance[], threshold: iBalance[]) {
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
export function areBalancesEqual(expected: iBalance[], actual: iBalance[], checkZeroBalances: boolean) {
  expected = BalanceArray.From(expected).clone();
  actual = BalanceArray.From(actual).clone();

  if (!checkZeroBalances) {
    expected = filterZeroBalances(expected);
    actual = filterZeroBalances(actual);
  }

  expected = handleDuplicateTokenIdsInBalances(expected);
  actual = handleDuplicateTokenIdsInBalances(actual);

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
export function updateBalances(newBalance: iBalance, balances: iBalance[]): BalanceArray {
  let balanceArr = BalanceArray.From(balances).clone();

  // We do a delete then set. Can maybe optimize in future.
  balanceArr = deleteBalances(newBalance.tokenIds, newBalance.ownershipTimes, balanceArr);
  balanceArr = setBalance(newBalance, balanceArr);

  return balanceArr;
}

function getConverterFunctionForBalances(balance: iBalance | iBalance[]): (item: string | number) => T {
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
export function addBalance(existingBalances: iBalance[], balanceToAdd: iBalance): BalanceArray {
  const currBalances = getBalancesForIds(balanceToAdd.tokenIds, balanceToAdd.ownershipTimes, existingBalances);
  let existing = BalanceArray.From(existingBalances).clone();
  existing = deleteBalances(balanceToAdd.tokenIds, balanceToAdd.ownershipTimes, existing);
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
export function addBalances(balancesToAdd: iBalance[], balances: iBalance[]): BalanceArray {
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
export function subtractBalance(balances: iBalance[], balanceToRemove: iBalance, allowUnderflow?: boolean): BalanceArray {
  const currBalances = getBalancesForIds(balanceToRemove.tokenIds, balanceToRemove.ownershipTimes, balances);
  let balancesArr = BalanceArray.From(balances).clone();

  balancesArr = deleteBalances(balanceToRemove.tokenIds, balanceToRemove.ownershipTimes, balancesArr);

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
export function subtractBalances(balancesToSubtract: iBalance[], balances: iBalance[], allowUnderflow?: boolean): BalanceArray {
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
function setBalance(newBalance: iBalance, balances: iBalance[]): BalanceArray {
  let newBalances = BalanceArray.From(balances).clone();

  if (newBalance.amount === 0n) {
    return newBalances;
  }

  newBalances.push(newBalance);
  newBalances = cleanBalances(newBalances);
  newBalances = sortBalancesByAmount(newBalances);

  return newBalances;
}

function setBalances(newBalances: iBalance[], balances: iBalance[]): BalanceArray {
  let newBalancesArr = BalanceArray.From(balances).clone();

  newBalancesArr.push(...newBalances.filter((x) => x.amount !== 0n));
  newBalancesArr = cleanBalances(newBalancesArr);
  newBalancesArr = sortBalancesByAmount(newBalancesArr);

  return newBalancesArr;
}

/**
 * Gets the balances for specified ID ranges.
 *
 * Returns a BalanceArray.From where only the specified ID ranges and their balances are included.
 * Sets balance amount == 0 objects for IDs that are not found.
 *
 * @remarks
 * Returns a new object but also modifies the original.
 *
 * Can also be used via the corresponding method with same name on {@link BalanceArray}
 *
 * @category Balances
 */
export function getBalancesForIds(idRanges: iUintRange[], times: iUintRange[], balances: iBalance[]): BalanceArray {
  if (idRanges.length === 0) {
    throw new Error('invalid idRanges');
  }
  const convertFunction = getConverterFunction(idRanges[0].start);

  const fetchedBalances: BalanceArray = BalanceArray.From([]);

  const currPermissionDetails: UniversalPermissionDetails[] = [];
  //assumes balances are sorted and non-overlapping
  for (const balanceObj of balances) {
    for (const currRange of balanceObj.tokenIds) {
      for (const currTime of balanceObj.ownershipTimes) {
        currPermissionDetails.push({
          tokenId: new UintRange(currRange).convert(BigIntify),
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
        tokenId: new UintRange(rangeToFetch).convert(BigIntify),
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
        tokenIds: [overlap.tokenId],
        ownershipTimes: [overlap.ownershipTime]
      })
    );
  }

  // For those that were in toFetch but not currBalances, we return amount == 0
  for (const detail of inSecondButNotFirst) {
    fetchedBalances.push(
      new Balance({
        amount: 0n,
        tokenIds: [detail.tokenId],
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
function deleteBalances(rangesToDelete: iUintRange[], timesToDelete: iUintRange[], balances: iBalance[]): BalanceArray {
  if (balances.length === 0) {
    return BalanceArray.From([]);
  }

  const convertFunction = getConverterFunctionForBalances(balances);
  const newBalances: BalanceArray = BalanceArray.From([]);

  const toDeletePermissionDetails: UniversalPermissionDetails[] = [];
  for (const rangeToDelete of rangesToDelete) {
    for (const timeToDelete of timesToDelete) {
      toDeletePermissionDetails.push({
        tokenId: new UintRange(rangeToDelete).convert(BigIntify),
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
    for (const currRange of balanceObj.tokenIds) {
      for (const currTime of balanceObj.ownershipTimes) {
        currPermissionDetails.push({
          tokenId: new UintRange(currRange).convert(BigIntify),
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
        new Balance({
          amount: BigInt(balanceObj.amount),
          tokenIds: [remainingBalance.tokenId],
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
export function sortBalancesByAmount(balances: iBalance[]) {
  return BalanceArray.From(
    balances.sort((a, b) => {
      return a.amount > b.amount ? 1 : -1;
    })
  );
}

/**
 * Cleans balances. Merges overlapping tokenIds and ownershipTimes, sorts by amounts, and handles duplicate tokenIds.
 *
 * @category Balances
 */
export function cleanBalances(balancesArr: iBalance[]) {
  let balances = BalanceArray.From(balancesArr);
  for (const balance of balances) {
    balance.tokenIds.sortAndMerge();
    balance.ownershipTimes.sortAndMerge();
  }
  balances = sortBalancesByAmount(balances);

  //we also see if we can merge cross-balances
  const newBalances: BalanceArray = BalanceArray.From([]);
  for (let i = 0; i < balances.length; i++) {
    const currBalance = balances[i];

    let merged = false;
    for (let j = 0; j < newBalances.length; j++) {
      const newBalance = newBalances[j];

      //If the balances are equal, we merge them
      if (currBalance.amount == newBalance.amount) {
        //If the balances are equal, we merge them
        if (uintRangeArrsEqual(currBalance.tokenIds, newBalance.tokenIds)) {
          newBalance.ownershipTimes.push(...currBalance.ownershipTimes);
          newBalance.ownershipTimes.sortAndMerge();
          merged = true;
          break;
        } else if (uintRangeArrsEqual(currBalance.ownershipTimes, newBalance.ownershipTimes)) {
          newBalance.tokenIds.push(...currBalance.tokenIds);
          newBalance.tokenIds.sortAndMerge();
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
export function uintRangeArrsEqual(arr1: UintRangeArray, arr2: UintRangeArray) {
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
 * Sorts and merges balances. Precondition that all tokenIds and ownershipTimes are non-overlapping.
 *
 * @param balances - The balances to sort and merge.
 *
 * @category Balances
 */
export function sortAndMergeBalances(balances: iBalance[]) {
  balances = handleDuplicateTokenIdsInBalances(balances);
  balances = cleanBalances(balances);
  balances = sortBalancesByAmount(balances);

  return balances;
}

/**
 * Handles duplicate tokenIds in balances. Returns a new BalanceArray.
 *
 * For example, if we have x1 of ID 1 and x1 of ID 1, we will return x2 of ID 1.
 *
 * @category Balances
 */
export function handleDuplicateTokenIdsInBalances(balances: iBalance[]) {
  let newBalances: BalanceArray = BalanceArray.From([]);
  newBalances.addBalances(balances);
  return newBalances;
}

interface BalanceFunctions {
  getBalanceForIdAndTime: (tokenId: T, ownedTime: T) => T;
  getBalancesForId: (tokenId: T) => BalanceArray;
  getBalancesForTime: (ownedTime: T) => BalanceArray;
  filterZeroBalances: () => void;
  subsetOf: (threshold: iBalance[]) => boolean;
  equalBalances: (other: iBalance[], checkZeroBalances?: boolean) => boolean;
  updateBalances: (newBalance: iBalance) => void;
  addBalances: (balancesToAdd: iBalance[]) => void;
  addBalance: (balanceToAdd: iBalance) => void;
  subtractBalances: (balancesToSubtract: iBalance[], allowUnderflow: boolean) => void;
  subtractBalance: (balanceToSubtract: iBalance, allowUnderflow: boolean) => void;
  sortBalancesByAmount: () => void;
  applyIncrements: (incrementTokenIdsBy: T, incrementOwnershipTimesBy: T, numIncrements: T, durationFromTimestamp: T, blockTime: T) => void;
}

/**
 * @category Balances
 */
export class BalanceArray extends BaseTypedArray<BalanceArray, Balance> implements BalanceFunctions {
  static From(arr: iBalance[] | iBalance | BalanceArray): BalanceArray {
    const wrappedArr = Array.isArray(arr) ? arr : [arr];
    return new BalanceArray(...wrappedArr.map((x) => new Balance(x)));
  }

  /**
   * @hidden
   */
  push(...items: iBalance[] | BalanceArray): number {
    return super.push(...items.map((i) => new Balance(i)));
  }

  /**
   * @hidden
   */
  fill(value: iBalance, start?: number | undefined, end?: number | undefined): this {
    return super.fill(new Balance(value), start, end);
  }

  /**
   * @hidden
   */
  with(index: number, value: iBalance): BalanceArray {
    return super.with(index, new Balance(value));
  }

  /**
   * @hidden
   */
  unshift(...items: iBalance[] | BalanceArray): number {
    return super.unshift(...items.map((i) => new Balance(i)));
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): BalanceArray {
    return BalanceArray.From(this.map((x) => x.convert(convertFunction)));
  }

  clone(): BalanceArray {
    return BalanceArray.From(this.map((x) => x.clone()));
  }

  /**
   * {@inheritDoc getBalanceForIdAndTime}
   */
  getBalanceForIdAndTime(tokenId: T, ownedTime: T) {
    return getBalanceForIdAndTime(tokenId, ownedTime, this);
  }

  /**
   * {@inheritDoc getBalancesForId}
   */
  getBalancesForId(tokenId: T) {
    return getBalancesForId(tokenId, this);
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
    const newBalances = this.filter((x) => BigInt(x.amount) !== BigInt(0) && x.tokenIds.length > 0 && x.ownershipTimes.length > 0);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * Checks if the current balances are a subset of the threshold balances (i.e. doesn't exceed the threshold).
   */
  subsetOf(threshold: iBalance[] | BalanceArray) {
    const res = doBalancesExceedThreshold(
      this.map((x) => x.convert(BigIntify)),
      BalanceArray.From(threshold).map((x) => x.convert(BigIntify))
    );
    return !res;
  }

  /**
   * {@inheritDoc areBalancesEqual}
   */
  equalBalances(other: iBalance[] | BalanceArray, checkZeroBalances = false) {
    return areBalancesEqual(
      this.map((x) => x.convert(BigIntify)),
      BalanceArray.From(other).map((x) => x.convert(BigIntify)),
      checkZeroBalances
    );
  }

  /**
   * {@inheritDoc updateBalances}
   */
  updateBalances(newBalance: iBalance): this {
    const newBalances = updateBalances(newBalance, this);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc addBalances}
   */
  addBalances(balancesToAdd: iBalance[] | BalanceArray): this {
    const newBalances = addBalances(balancesToAdd, this);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc addBalance}
   */
  addBalance(balanceToAdd: iBalance): this {
    const newBalances = addBalance(this, balanceToAdd);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc subtractBalances}
   */
  subtractBalances(balancesToSubtract: iBalance[] | BalanceArray, allowNegatives = false) {
    const newBalances = subtractBalances(balancesToSubtract, this, allowNegatives);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * {@inheritDoc subtractBalance}
   */
  subtractBalance(balanceToSubtract: iBalance, allowUnderflow: boolean) {
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
  applyIncrements(incrementTokenIdsBy: T, incrementOwnershipTimesBy: T, numIncrements: T, durationFromTimestamp: T, blockTime: T) {
    const newBalances = applyIncrementsToBalances(this, incrementTokenIdsBy, incrementOwnershipTimesBy, numIncrements, durationFromTimestamp, blockTime);
    this.length = 0;
    this.push(...newBalances);
    return this;
  }

  /**
   * Gets all token IDs from the balances (sorted and merged).
   */
  getAllTokenIds() {
    const tokenIds = new UintRangeArray();
    for (const balance of this) {
      tokenIds.push(...balance.tokenIds);
    }
    return tokenIds.clone().sortAndMerge();
  }
}
