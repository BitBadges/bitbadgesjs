import type { NumberType } from '../common/string-numbers.js';
import { BigIntify } from '../common/string-numbers.js';

import type { CollectionId, iUintRange } from '@/interfaces/types/core.js';
import { bigIntMin } from '../common/math.js';
import { BaseNumberTypeClass, ConvertOptions, getConverterFunction } from '@/common/base.js';
import { UintRangeArray, UintRange } from './uintRanges.js';
import { BaseTypedArray } from '@/common/typed-arrays.js';

/**
 * @category Interfaces
 */
export interface iBatchTokenDetails<T extends NumberType> {
  /** The collection ID of this element's token details. */
  collectionId: CollectionId;
  /** The corresponding token IDs for this collection ID. */
  badgeIds: iUintRange<T>[];
}

/**
 * @category Batch Utils
 */
export class BatchTokenDetails<T extends NumberType> extends BaseNumberTypeClass<BatchTokenDetails<T>> implements iBatchTokenDetails<T> {
  collectionId: CollectionId;
  badgeIds: UintRangeArray<T>;

  constructor(data: iBatchTokenDetails<T>) {
    super();
    this.collectionId = data.collectionId;
    this.badgeIds = UintRangeArray.From(data.badgeIds);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BatchTokenDetails<U> {
    return new BatchTokenDetails<U>({
      ...this,
      collectionId: this.collectionId,
      badgeIds: this.badgeIds.map((x) => x.convert(convertFunction))
    });
  }

  /**
   * Checks if the token details overlap with another set of token details.
   */
  doesNotOverlap(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T>) {
    const otherArr: BatchTokenDetailsArray<T> = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return true;

    return this.badgeIds.getOverlaps(matchingElem.badgeIds).length === 0;
  }

  /**
   * Checks if the token details are a subset of another set of token details (i.e. all badgeIds are in the other set).
   */
  isSubsetOf(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T>): boolean {
    const otherArr: BatchTokenDetailsArray<T> = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return false;

    const [remaining] = this.badgeIds.getOverlapDetails(matchingElem.badgeIds);
    return remaining.length == 0;
  }

  /**
   * Checks if the token details are not in another set of token details (i.e. none of the token IDs are in the other set).
   */
  noneIn(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T>): boolean {
    const otherArr: BatchTokenDetailsArray<T> = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return true;

    return this.badgeIds.getOverlaps(matchingElem.badgeIds).length === 0;
  }

  toArray(): BatchTokenDetailsArray<T> {
    return new BatchTokenDetailsArray(this.clone());
  }
}

/**
 * @category Batch Utils
 */
export class BatchTokenDetailsArray<T extends NumberType> extends BaseTypedArray<BatchTokenDetailsArray<T>, BatchTokenDetails<T>> {
  static From<T extends NumberType>(arr: iBatchTokenDetails<T>[] | iBatchTokenDetails<T> | BatchTokenDetailsArray<T>): BatchTokenDetailsArray<T> {
    const wrappedArr = Array.isArray(arr) ? arr : [arr];
    return new BatchTokenDetailsArray(...wrappedArr.map((i) => new BatchTokenDetails(i)));
  }

  /**
   * @hidden
   */
  push(...items: iBatchTokenDetails<T>[] | BatchTokenDetailsArray<T>): number {
    return super.push(...items.map((i) => new BatchTokenDetails(i)));
  }

  /**
   * @hidden
   */
  fill(value: iBatchTokenDetails<T>, start?: number | undefined, end?: number | undefined): this {
    return super.fill(new BatchTokenDetails(value), start, end);
  }

  /**
   * @hidden
   */
  with(index: number, value: iBatchTokenDetails<T>): BatchTokenDetailsArray<T> {
    return super.with(index, new BatchTokenDetails(value));
  }

  /**
   * @hidden
   */
  unshift(...items: iBatchTokenDetails<T>[] | BatchTokenDetailsArray<T>): number {
    return super.unshift(...items.map((i) => new BatchTokenDetails(i)));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BatchTokenDetailsArray<U> {
    return new BatchTokenDetailsArray<U>(...this.map((x) => x.convert(convertFunction)));
  }

  /**
   * Adds token details to the batch details array. If the collectionId already exists, it will merge the badgeIds.
   */
  add(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T> | BatchTokenDetailsArray<T>) {
    const otherArr: BatchTokenDetails<T>[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    let arr = BatchTokenDetailsArray.From(this);
    for (const badgeIdObj of otherArr) {
      const badgeIdsToAdd = badgeIdObj.badgeIds;
      const existingIdx = arr.findIndex((x) => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].badgeIds = UintRangeArray.From([...arr[existingIdx].badgeIds, ...badgeIdsToAdd]).sortAndMerge();
      } else {
        arr.push(
          new BatchTokenDetails({
            collectionId: badgeIdObj.collectionId,
            badgeIds: badgeIdsToAdd
          })
        );
      }
    }

    arr = BatchTokenDetailsArray.From(arr.filter((x) => x.badgeIds.length > 0));
    this.length = 0;
    this.push(...arr);
  }

  /**
   * Removes token details from the batch details array. If the collectionId already exists, it will remove the badgeIds.
   */
  remove(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T> | BatchTokenDetailsArray<T>) {
    const otherArr: BatchTokenDetails<T>[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    let arr = BatchTokenDetailsArray.From(this);
    for (const badgeIdObj of otherArr) {
      const badgeIdsToRemove = badgeIdObj.badgeIds;

      const existingIdx = arr.findIndex((x) => x.collectionId == badgeIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].badgeIds.remove(badgeIdsToRemove);
      }
    }

    arr = BatchTokenDetailsArray.From(arr.filter((x) => x.badgeIds.length > 0));
    this.length = 0;
    this.push(...arr);
  }

  /**
   * Checks if the token details completely overlap with another set of token details (i.e. all badgeIds are in the other set).
   */
  isSubsetOf(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T> | BatchTokenDetailsArray<T>) {
    const otherArr: BatchTokenDetails<T>[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    return this.every((x) => x.isSubsetOf(otherArr));
  }

  /**
   * Checks if the token details do not overlap with another set of token details (i.e. none of the token IDs are in the other set).
   */
  noneIn(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T> | BatchTokenDetailsArray<T>) {
    const otherArr: BatchTokenDetails<T>[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    return this.every((x) => x.noneIn(otherArr));
  }

  /**
   * Get specific tokens for the batch details. Useful for displaying tokens on a page.
   *
   * Assums that badgeIds are sorted, merged, and non-overlapping.
   */
  getPage(_pageNumber: number, _pageSize: number, sortBy?: 'newest' | 'oldest' | undefined): BatchTokenDetailsArray<T> {
    if (this.length === 0) return BatchTokenDetailsArray.From<T>([]);
    if (this[0].badgeIds.length === 0) return BatchTokenDetailsArray.From<T>([]);

    const converterFunction = getConverterFunction(this[0].badgeIds[0].start);

    const collectionObjectsToDisplay = BatchTokenDetailsArray.From(this.map((x) => x.convert(BigIntify)));
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
    const badgeIdsToDisplay = BatchTokenDetailsArray.From<bigint>([]);

    let currIdx = 0n;
    let numEntriesLeftToHandle = pageSize;

    for (const collectionObj of collectionObjectsToDisplay) {
      for (const range of collectionObj.badgeIds) {
        const numBadgesInRange = range.end - range.start + 1n;

        // If we have reached the start of the page, handle this range
        if (currIdx + numBadgesInRange >= startIdxNum) {
          //Find token ID to start at
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
            new BatchTokenDetails({
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
