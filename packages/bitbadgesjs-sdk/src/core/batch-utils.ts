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
  tokenIds: iUintRange<T>[];
}

/**
 * @category Batch Utils
 */
export class BatchTokenDetails<T extends NumberType> extends BaseNumberTypeClass<BatchTokenDetails<T>> implements iBatchTokenDetails<T> {
  collectionId: CollectionId;
  tokenIds: UintRangeArray<T>;

  constructor(data: iBatchTokenDetails<T>) {
    super();
    this.collectionId = data.collectionId;
    this.tokenIds = UintRangeArray.From(data.tokenIds);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BatchTokenDetails<U> {
    return new BatchTokenDetails<U>({
      ...this,
      collectionId: this.collectionId,
      tokenIds: this.tokenIds.map((x) => x.convert(convertFunction))
    });
  }

  /**
   * Checks if the token details overlap with another set of token details.
   */
  doesNotOverlap(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T>) {
    const otherArr: BatchTokenDetailsArray<T> = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return true;

    return this.tokenIds.getOverlaps(matchingElem.tokenIds).length === 0;
  }

  /**
   * Checks if the token details are a subset of another set of token details (i.e. all tokenIds are in the other set).
   */
  isSubsetOf(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T>): boolean {
    const otherArr: BatchTokenDetailsArray<T> = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return false;

    const [remaining] = this.tokenIds.getOverlapDetails(matchingElem.tokenIds);
    return remaining.length == 0;
  }

  /**
   * Checks if the token details are not in another set of token details (i.e. none of the token IDs are in the other set).
   */
  noneIn(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T>): boolean {
    const otherArr: BatchTokenDetailsArray<T> = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return true;

    return this.tokenIds.getOverlaps(matchingElem.tokenIds).length === 0;
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
   * Adds token details to the batch details array. If the collectionId already exists, it will merge the tokenIds.
   */
  add(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T> | BatchTokenDetailsArray<T>) {
    const otherArr: BatchTokenDetails<T>[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    let arr = BatchTokenDetailsArray.From(this);
    for (const tokenIdObj of otherArr) {
      const tokenIdsToAdd = tokenIdObj.tokenIds;
      const existingIdx = arr.findIndex((x) => x.collectionId == tokenIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].tokenIds = UintRangeArray.From([...arr[existingIdx].tokenIds, ...tokenIdsToAdd]).sortAndMerge();
      } else {
        arr.push(
          new BatchTokenDetails({
            collectionId: tokenIdObj.collectionId,
            tokenIds: tokenIdsToAdd
          })
        );
      }
    }

    arr = BatchTokenDetailsArray.From(arr.filter((x) => x.tokenIds.length > 0));
    this.length = 0;
    this.push(...arr);
  }

  /**
   * Removes token details from the batch details array. If the collectionId already exists, it will remove the tokenIds.
   */
  remove(other: iBatchTokenDetails<T>[] | iBatchTokenDetails<T> | BatchTokenDetailsArray<T>) {
    const otherArr: BatchTokenDetails<T>[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    let arr = BatchTokenDetailsArray.From(this);
    for (const tokenIdObj of otherArr) {
      const tokenIdsToRemove = tokenIdObj.tokenIds;

      const existingIdx = arr.findIndex((x) => x.collectionId == tokenIdObj.collectionId);
      if (existingIdx != -1) {
        arr[existingIdx].tokenIds.remove(tokenIdsToRemove);
      }
    }

    arr = BatchTokenDetailsArray.From(arr.filter((x) => x.tokenIds.length > 0));
    this.length = 0;
    this.push(...arr);
  }

  /**
   * Checks if the token details completely overlap with another set of token details (i.e. all tokenIds are in the other set).
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
   * Assums that tokenIds are sorted, merged, and non-overlapping.
   */
  getPage(_pageNumber: number, _pageSize: number, sortBy?: 'newest' | 'oldest' | undefined): BatchTokenDetailsArray<T> {
    if (this.length === 0) return BatchTokenDetailsArray.From<T>([]);
    if (this[0].tokenIds.length === 0) return BatchTokenDetailsArray.From<T>([]);

    const converterFunction = getConverterFunction(this[0].tokenIds[0].start);

    const collectionObjectsToDisplay = BatchTokenDetailsArray.From(this.map((x) => x.convert(BigIntify)));
    const pageNumber = BigInt(_pageNumber);
    const pageSize = BigInt(_pageSize);

    if (sortBy === 'newest') {
      const totalNumPages = Math.ceil(
        Number(
          collectionObjectsToDisplay.reduce((acc, curr) => {
            const numBadges = curr.tokenIds.reduce((acc, curr) => acc + (curr.end - curr.start + 1n), 0n);
            return acc + numBadges;
          }, 0n)
        ) / _pageSize
      );

      return this.getPage(totalNumPages - _pageNumber + 1, _pageSize, undefined);
    }

    const startIdxNum = BigInt((pageNumber - 1n) * pageSize);
    const tokenIdsToDisplay = BatchTokenDetailsArray.From<bigint>([]);

    let currIdx = 0n;
    let numEntriesLeftToHandle = pageSize;

    for (const collectionObj of collectionObjectsToDisplay) {
      for (const range of collectionObj.tokenIds) {
        const numBadgesInRange = range.end - range.start + 1n;

        // If we have reached the start of the page, handle this range
        if (currIdx + numBadgesInRange >= startIdxNum) {
          //Find token ID to start at
          let currTokenId = range.start;
          if (currIdx < startIdxNum) {
            currTokenId = range.start + (startIdxNum - currIdx);
          }

          //Iterate through the range and add tokenIds to the array, until we have added enough
          const tokenIdsToDisplayIds = UintRangeArray.From<bigint>([]);
          if (numEntriesLeftToHandle > 0) {
            const endTokenId = bigIntMin(currTokenId + numEntriesLeftToHandle - 1n, range.end);
            if (currTokenId <= endTokenId) {
              tokenIdsToDisplayIds.push(new UintRange({ start: currTokenId, end: endTokenId }));
            }
          }

          const tokenIdsToAdd = tokenIdsToDisplayIds.clone().sortAndMerge();

          tokenIdsToDisplay.push(
            new BatchTokenDetails({
              collectionId: collectionObj.collectionId,
              tokenIds: tokenIdsToAdd
            })
          );

          const numBadgesAdded = tokenIdsToAdd.reduce((acc, curr) => acc + (curr.end - curr.start + 1n), 0n);

          numEntriesLeftToHandle -= numBadgesAdded;

          if (numEntriesLeftToHandle <= 0) break;
        }

        currIdx += numBadgesInRange;
      }
    }

    return tokenIdsToDisplay.convert(converterFunction);
  }
}
