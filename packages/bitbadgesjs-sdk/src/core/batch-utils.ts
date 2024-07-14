import type { NumberType } from '../common/string-numbers.js';
import { BigIntify } from '../common/string-numbers.js';

import type { iUintRange } from '@/interfaces/badges/core.js';
import { bigIntMin } from '../common/math.js';
import { BaseNumberTypeClass, getConverterFunction } from '@/common/base.js';
import { UintRangeArray, UintRange } from './uintRanges.js';
import { BaseTypedArray } from '@/common/typed-arrays.js';

/**
 * @category Interfaces
 */
export interface iBatchBadgeDetails<T extends NumberType> {
  /** The collection ID of this element's badge details. */
  collectionId: T;
  /** The corresponding badge IDs for this collection ID. */
  badgeIds: iUintRange<T>[];
}

/**
 * @category Batch Utils
 */
export class BatchBadgeDetails<T extends NumberType> extends BaseNumberTypeClass<BatchBadgeDetails<T>> implements iBatchBadgeDetails<T> {
  collectionId: T;
  badgeIds: UintRangeArray<T>;

  constructor(data: iBatchBadgeDetails<T>) {
    super();
    this.collectionId = data.collectionId;
    this.badgeIds = UintRangeArray.From(data.badgeIds);
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BatchBadgeDetails<U> {
    return new BatchBadgeDetails<U>({
      ...this,
      collectionId: convertFunction(this.collectionId),
      badgeIds: this.badgeIds.map((x) => x.convert(convertFunction))
    });
  }

  /**
   * Checks if the badge details overlap with another set of badge details.
   */
  doesNotOverlap(other: iBatchBadgeDetails<T>[] | iBatchBadgeDetails<T>) {
    const otherArr: BatchBadgeDetailsArray<T> = BatchBadgeDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return true;

    return this.badgeIds.getOverlaps(matchingElem.badgeIds).length === 0;
  }

  /**
   * Checks if the badge details are a subset of another set of badge details (i.e. all badgeIds are in the other set).
   */
  isSubsetOf(other: iBatchBadgeDetails<T>[] | iBatchBadgeDetails<T>): boolean {
    const otherArr: BatchBadgeDetailsArray<T> = BatchBadgeDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return false;

    const [remaining] = this.badgeIds.getOverlapDetails(matchingElem.badgeIds);
    return remaining.length == 0;
  }

  /**
   * Checks if the badge details are not in another set of badge details (i.e. none of the badgeIds are in the other set).
   */
  noneIn(other: iBatchBadgeDetails<T>[] | iBatchBadgeDetails<T>): boolean {
    const otherArr: BatchBadgeDetailsArray<T> = BatchBadgeDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return true;

    return this.badgeIds.getOverlaps(matchingElem.badgeIds).length === 0;
  }

  toArray(): BatchBadgeDetailsArray<T> {
    return new BatchBadgeDetailsArray(this.clone());
  }
}

/**
 * @category Batch Utils
 */
export class BatchBadgeDetailsArray<T extends NumberType> extends BaseTypedArray<BatchBadgeDetailsArray<T>, BatchBadgeDetails<T>> {
  static From<T extends NumberType>(arr: iBatchBadgeDetails<T>[] | iBatchBadgeDetails<T> | BatchBadgeDetailsArray<T>): BatchBadgeDetailsArray<T> {
    const wrappedArr = Array.isArray(arr) ? arr : [arr];
    return new BatchBadgeDetailsArray(...wrappedArr.map((i) => new BatchBadgeDetails(i)));
  }

  /**
   * @hidden
   */
  push(...items: iBatchBadgeDetails<T>[] | BatchBadgeDetailsArray<T>): number {
    return super.push(...items.map((i) => new BatchBadgeDetails(i)));
  }

  /**
   * @hidden
   */
  fill(value: iBatchBadgeDetails<T>, start?: number | undefined, end?: number | undefined): this {
    return super.fill(new BatchBadgeDetails(value), start, end);
  }

  /**
   * @hidden
   */
  with(index: number, value: iBatchBadgeDetails<T>): BatchBadgeDetailsArray<T> {
    return super.with(index, new BatchBadgeDetails(value));
  }

  /**
   * @hidden
   */
  unshift(...items: iBatchBadgeDetails<T>[] | BatchBadgeDetailsArray<T>): number {
    return super.unshift(...items.map((i) => new BatchBadgeDetails(i)));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BatchBadgeDetailsArray<U> {
    return new BatchBadgeDetailsArray<U>(...this.map((x) => x.convert(convertFunction)));
  }

  /**
   * Adds badge details to the batch details array. If the collectionId already exists, it will merge the badgeIds.
   */
  add(other: iBatchBadgeDetails<T>[] | iBatchBadgeDetails<T> | BatchBadgeDetailsArray<T>) {
    const otherArr: BatchBadgeDetails<T>[] = BatchBadgeDetailsArray.From(Array.isArray(other) ? other : [other]);

    let arr = BatchBadgeDetailsArray.From(this);
    for (const badgeIdObj of otherArr) {
      const badgeIdsToAdd = badgeIdObj.badgeIds;
      const existingIdx = arr.findIndex((x) => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].badgeIds = UintRangeArray.From([...arr[existingIdx].badgeIds, ...badgeIdsToAdd]).sortAndMerge();
      } else {
        arr.push(
          new BatchBadgeDetails({
            collectionId: badgeIdObj.collectionId,
            badgeIds: badgeIdsToAdd
          })
        );
      }
    }

    arr = BatchBadgeDetailsArray.From(arr.filter((x) => x.badgeIds.length > 0));
    this.length = 0;
    this.push(...arr);
  }

  /**
   * Removes badge details from the batch details array. If the collectionId already exists, it will remove the badgeIds.
   */
  remove(other: iBatchBadgeDetails<T>[] | iBatchBadgeDetails<T> | BatchBadgeDetailsArray<T>) {
    const otherArr: BatchBadgeDetails<T>[] = BatchBadgeDetailsArray.From(Array.isArray(other) ? other : [other]);

    let arr = BatchBadgeDetailsArray.From(this);
    for (const badgeIdObj of otherArr) {
      const badgeIdsToRemove = badgeIdObj.badgeIds;

      const existingIdx = arr.findIndex((x) => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].badgeIds.remove(badgeIdsToRemove);
      }
    }

    arr = BatchBadgeDetailsArray.From(arr.filter((x) => x.badgeIds.length > 0));
    this.length = 0;
    this.push(...arr);
  }

  /**
   * Checks if the badge details completely overlap with another set of badge details (i.e. all badgeIds are in the other set).
   */
  isSubsetOf(other: iBatchBadgeDetails<T>[] | iBatchBadgeDetails<T> | BatchBadgeDetailsArray<T>) {
    const otherArr: BatchBadgeDetails<T>[] = BatchBadgeDetailsArray.From(Array.isArray(other) ? other : [other]);

    return this.every((x) => x.isSubsetOf(otherArr));
  }

  /**
   * Checks if the badge details do not overlap with another set of badge details (i.e. none of the badgeIds are in the other set).
   */
  noneIn(other: iBatchBadgeDetails<T>[] | iBatchBadgeDetails<T> | BatchBadgeDetailsArray<T>) {
    const otherArr: BatchBadgeDetails<T>[] = BatchBadgeDetailsArray.From(Array.isArray(other) ? other : [other]);

    return this.every((x) => x.noneIn(otherArr));
  }

  /**
   * Get specific badges for the batch details. Useful for displaying badges on a page.
   *
   * Assums that badgeIds are sorted, merged, and non-overlapping.
   */
  getPage(_pageNumber: number, _pageSize: number, sortBy?: 'newest' | 'oldest' | undefined): BatchBadgeDetailsArray<T> {
    if (this.length === 0) return BatchBadgeDetailsArray.From<T>([]);

    const converterFunction = getConverterFunction(this[0].collectionId);

    const collectionObjectsToDisplay = BatchBadgeDetailsArray.From(this.map((x) => x.convert(BigIntify)));
    const pageNumber = BigInt(_pageNumber);
    const pageSize = BigInt(_pageSize);

    if (sortBy === 'newest') {
      const totalNumPages = Math.ceil(
        Number(
          collectionObjectsToDisplay.reduce((acc, curr) => {
            const numBadges = curr.badgeIds.reduce((acc, curr) => acc + (curr.end - curr.start + 1n), 0n);
            return acc + numBadges;
          }, 0n)
        ) / _pageSize
      );

      return this.getPage(totalNumPages - _pageNumber + 1, _pageSize, undefined);
    }

    const startIdxNum = BigInt((pageNumber - 1n) * pageSize);
    const badgeIdsToDisplay = BatchBadgeDetailsArray.From<bigint>([]);

    let currIdx = 0n;
    let numEntriesLeftToHandle = pageSize;

    for (const collectionObj of collectionObjectsToDisplay) {
      for (const range of collectionObj.badgeIds) {
        const numBadgesInRange = range.end - range.start + 1n;

        // If we have reached the start of the page, handle this range
        if (currIdx + numBadgesInRange >= startIdxNum) {
          //Find badge ID to start at
          let currBadgeId = range.start;
          if (currIdx < startIdxNum) {
            currBadgeId = range.start + (startIdxNum - currIdx);
          }

          //Iterate through the range and add badgeIds to the array, until we have added enough
          const badgeIdsToDisplayIds = UintRangeArray.From<bigint>([]);
          if (numEntriesLeftToHandle > 0) {
            const endBadgeId = bigIntMin(currBadgeId + numEntriesLeftToHandle - 1n, range.end);
            if (currBadgeId <= endBadgeId) {
              badgeIdsToDisplayIds.push(new UintRange({ start: currBadgeId, end: endBadgeId }));
            }
          }

          const badgeIdsToAdd = badgeIdsToDisplayIds.clone().sortAndMerge();

          badgeIdsToDisplay.push(
            new BatchBadgeDetails({
              collectionId: collectionObj.collectionId,
              badgeIds: badgeIdsToAdd
            })
          );

          const numBadgesAdded = badgeIdsToAdd.reduce((acc, curr) => acc + (curr.end - curr.start + 1n), 0n);

          numEntriesLeftToHandle -= numBadgesAdded;

          if (numEntriesLeftToHandle <= 0) break;
        }

        currIdx += numBadgesInRange;
      }
    }

    return badgeIdsToDisplay.convert(converterFunction);
  }
}
