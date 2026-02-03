import type { NumberType } from '../common/string-numbers.js';
import { BigIntify } from '../common/string-numbers.js';

import { BaseNumberTypeClass, ConvertOptions, getConverterFunction } from '@/common/base.js';
import { BaseTypedArray } from '@/common/typed-arrays.js';
import type { CollectionId, iUintRange } from '@/interfaces/types/core.js';
import { bigIntMin } from '../common/math.js';
import { UintRange, UintRangeArray } from './uintRanges.js';

/**
 * @category Interfaces
 */
export interface iBatchTokenDetails {
  /** The collection ID of this element's token details. */
  collectionId: CollectionId;
  /** The corresponding token IDs for this collection ID. */
  tokenIds: iUintRange[];
}

/**
 * @category Batch Utils
 */
export class BatchTokenDetails extends BaseNumberTypeClass<BatchTokenDetails> implements iBatchTokenDetails {
  collectionId: CollectionId;
  tokenIds: UintRangeArray;

  constructor(data: iBatchTokenDetails) {
    super();
    this.collectionId = data.collectionId;
    this.tokenIds = UintRangeArray.From(data.tokenIds);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): BatchTokenDetails {
    return new BatchTokenDetails({
      ...this,
      collectionId: this.collectionId,
      tokenIds: this.tokenIds.map((x) => x.convert(convertFunction))
    });
  }

  /**
   * Checks if the token details overlap with another set of token details.
   */
  doesNotOverlap(other: iBatchTokenDetails[] | iBatchTokenDetails) {
    const otherArr: BatchTokenDetailsArray = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return true;

    return this.tokenIds.getOverlaps(matchingElem.tokenIds).length === 0;
  }

  /**
   * Checks if the token details are a subset of another set of token details (i.e. all tokenIds are in the other set).
   */
  isSubsetOf(other: iBatchTokenDetails[] | iBatchTokenDetails): boolean {
    const otherArr: BatchTokenDetailsArray = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return false;

    const [remaining] = this.tokenIds.getOverlapDetails(matchingElem.tokenIds);
    return remaining.length == 0;
  }

  /**
   * Checks if the token details are not in another set of token details (i.e. none of the token IDs are in the other set).
   */
  noneIn(other: iBatchTokenDetails[] | iBatchTokenDetails): boolean {
    const otherArr: BatchTokenDetailsArray = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    const matchingElem = otherArr.find((x) => x.collectionId === this.collectionId);
    if (!matchingElem) return true;

    return this.tokenIds.getOverlaps(matchingElem.tokenIds).length === 0;
  }

  toArray(): BatchTokenDetailsArray {
    return new BatchTokenDetailsArray(this.clone());
  }
}

/**
 * @category Batch Utils
 */
export class BatchTokenDetailsArray extends BaseTypedArray<BatchTokenDetailsArray, BatchTokenDetails> {
  static From(arr: iBatchTokenDetails[] | iBatchTokenDetails | BatchTokenDetailsArray): BatchTokenDetailsArray {
    const wrappedArr = Array.isArray(arr) ? arr : [arr];
    return new BatchTokenDetailsArray(...wrappedArr.map((i) => new BatchTokenDetails(i)));
  }

  /**
   * @hidden
   */
  push(...items: iBatchTokenDetails[] | BatchTokenDetailsArray): number {
    return super.push(...items.map((i) => new BatchTokenDetails(i)));
  }

  /**
   * @hidden
   */
  fill(value: iBatchTokenDetails, start?: number | undefined, end?: number | undefined): this {
    return super.fill(new BatchTokenDetails(value), start, end);
  }

  /**
   * @hidden
   */
  with(index: number, value: iBatchTokenDetails): BatchTokenDetailsArray {
    return super.with(index, new BatchTokenDetails(value));
  }

  /**
   * @hidden
   */
  unshift(...items: iBatchTokenDetails[] | BatchTokenDetailsArray): number {
    return super.unshift(...items.map((i) => new BatchTokenDetails(i)));
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): BatchTokenDetailsArray {
    return new BatchTokenDetailsArray(...this.map((x) => x.convert(convertFunction)));
  }

  /**
   * Adds token details to the batch details array. If the collectionId already exists, it will merge the tokenIds.
   */
  add(other: iBatchTokenDetails[] | iBatchTokenDetails | BatchTokenDetailsArray) {
    const otherArr: BatchTokenDetails[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

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
  remove(other: iBatchTokenDetails[] | iBatchTokenDetails | BatchTokenDetailsArray) {
    const otherArr: BatchTokenDetails[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

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
  isSubsetOf(other: iBatchTokenDetails[] | iBatchTokenDetails | BatchTokenDetailsArray) {
    const otherArr: BatchTokenDetails[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    return this.every((x) => x.isSubsetOf(otherArr));
  }

  /**
   * Checks if the token details do not overlap with another set of token details (i.e. none of the token IDs are in the other set).
   */
  noneIn(other: iBatchTokenDetails[] | iBatchTokenDetails | BatchTokenDetailsArray) {
    const otherArr: BatchTokenDetails[] = BatchTokenDetailsArray.From(Array.isArray(other) ? other : [other]);

    return this.every((x) => x.noneIn(otherArr));
  }

  /**
   * Get specific tokens for the batch details. Useful for displaying tokens on a page.
   *
   * Assums that tokenIds are sorted, merged, and non-overlapping.
   */
  getPage(_pageNumber: number, _pageSize: number, sortBy?: 'newest' | 'oldest' | undefined): BatchTokenDetailsArray {
    if (this.length === 0) return BatchTokenDetailsArray.From([]);
    if (this[0].tokenIds.length === 0) return BatchTokenDetailsArray.From([]);

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
    const tokenIdsToDisplay = BatchTokenDetailsArray.From([]);

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
          const tokenIdsToDisplayIds = UintRangeArray.From([]);
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
