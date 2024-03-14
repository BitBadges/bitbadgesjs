import type { JsonValue, JsonReadOptions } from '@bufbuild/protobuf';
import type { iUintRange } from '@/interfaces/badges/core';
import { BaseNumberTypeClass, deepCopyPrimitives, getConverterFunction } from '@/common/base';
import { safeSubtract, safeAddKeepLeft, GO_MAX_UINT_64, safeSubtractKeepLeft, bigIntMin, castNumberType, bigIntMax } from '../common/math';
import type { NumberType } from '../common/string-numbers';
import { Stringify } from '../common/string-numbers';
import * as proto from '@/proto';
import { BaseTypedArray } from '@/common/typed-arrays';

/**
 * UintRange represents a range of numbers from some start ID to some end ID, inclusive.
 *
 * See https://docs.bitbadges.io/for-developers/core-concepts/uint-ranges for more information.
 *
 * @category Uint Ranges
 */
export class UintRange<T extends NumberType> extends BaseNumberTypeClass<UintRange<T>> implements iUintRange<T> {
  start: T;
  end: T;

  constructor(uintRange: iUintRange<T>) {
    super();
    this.start = uintRange.start;
    this.end = uintRange.end;
  }

  getNumberFieldNames(): string[] {
    return ['start', 'end'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UintRange<U> {
    return new UintRange<U>(
      deepCopyPrimitives({
        start: convertFunction(this.start),
        end: convertFunction(this.end)
      })
    );
  }

  toProto(): proto.badges.UintRange {
    return new proto.badges.UintRange(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UintRange<U> {
    return UintRange.fromProto(proto.badges.UintRange.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UintRange<U> {
    return UintRange.fromProto(proto.badges.UintRange.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.UintRange, convertFunction: (item: NumberType) => U): UintRange<U> {
    return new UintRange<U>({
      start: convertFunction(BigInt(item.start)),
      end: convertFunction(BigInt(item.end))
    });
  }

  /**
   * Returns the size of the range (i.e. end - start + 1).
   */
  size(): T {
    const diff = safeSubtract(this.end, this.start, true);
    return safeAddKeepLeft(diff, 1);
  }

  /**
   * Returns true if the range is full (i.e. start = 1 and end = 18446744073709551615).
   *
   * This is considered full in the context of badge IDs and times.
   */
  isFull() {
    return BigInt(this.start) == 1n && BigInt(this.end) == GO_MAX_UINT_64;
  }

  /**
   * Returns a new UintRange from 1 to 18446744073709551615 (max uint64).
   */
  static FullRange(): UintRange<bigint> {
    return new UintRange({
      start: 1n,
      end: GO_MAX_UINT_64
    });
  }

  /**
   * Returns a new UintRangeArray from 1 to 18446744073709551615 (max uint64).
   */
  static FullRanges(): UintRangeArray<bigint> {
    return UintRangeArray.From([UintRange.FullRange()]);
  }

  static From<T extends NumberType>(val: T): UintRange<T> {
    return new UintRange({
      start: val,
      end: val
    });
  }

  /**
   * Returns true if the range overlaps with the other range.
   */
  overlaps(other: iUintRange<T>[] | iUintRange<T> | UintRangeArray<T>): boolean {
    const otherArr = UintRangeArray.From(Array.isArray(other) ? other : [other]);
    try {
      otherArr.sortAndMerge().assertNoOverlaps([this]);
    } catch (e) {
      return true;
    }
    return false;
  }

  /**
   * Returns a new UintRangeArray that is the result of inverting the current range (i.e. getting all values within the bounds that are not in the current range).
   */
  invert(minId: NumberType = 1n, maxId: NumberType = GO_MAX_UINT_64): UintRangeArray<T> {
    const converterFunction = getConverterFunction(this.start);
    const bounds = new UintRange({ start: minId, end: maxId }).convert(converterFunction);

    return UintRangeArray.From([this]).invert(bounds);
  }

  /**
   * Searches for a specific ID within the range.
   */
  search(id: NumberType): boolean {
    return BigInt(this.start) <= BigInt(id) && BigInt(this.end) >= BigInt(id);
  }

  protected static createUintRange<T extends NumberType>(start: T, end: T) {
    return new UintRange({
      start: deepCopyPrimitives(start),
      end: deepCopyPrimitives(end)
    });
  }

  /**
   * Returns the [inCurrentButNotInToCheck, overlaps].
   */
  getOverlapDetails(toCheck: iUintRange<T> | iUintRange<T>[] | UintRangeArray<T>): [UintRangeArray<T>, UintRangeArray<T>] {
    if (Array.isArray(toCheck)) {
      const [remaining, removed] = UintRangeArray.From([this]).getOverlapDetails(toCheck);

      return [remaining, removed];
    }

    const rangeObject = new UintRange({ start: this.start, end: this.end });
    const idxsToRemove = toCheck;
    if (idxsToRemove.end < rangeObject.start || idxsToRemove.start > rangeObject.end) {
      // idxsToRemove doesn't overlap with rangeObject, so nothing is removed
      return [UintRangeArray.From([rangeObject]), UintRangeArray.From([])];
    }

    const newRanges = UintRangeArray.From<T>([]);
    let removedRanges = UintRangeArray.From<T>([]);
    if (idxsToRemove.start <= rangeObject.start && idxsToRemove.end >= rangeObject.end) {
      // idxsToRemove fully contains rangeObject, so nothing is left
      return [newRanges, UintRangeArray.From([rangeObject])];
    }

    if (idxsToRemove.start > rangeObject.start) {
      // There's a range before idxsToRemove
      // Underflow is not possible because idxsToRemove.start > rangeObject.start
      newRanges.push(
        new UintRange({
          start: rangeObject.start,
          end: safeSubtractKeepLeft(idxsToRemove.start, 1n)
        })
      );

      //get min of idxsToRemove.end and rangeObject.end
      const minEnd = bigIntMin(BigInt(idxsToRemove.end), BigInt(rangeObject.end));

      removedRanges.push(
        new UintRange({
          start: idxsToRemove.start,
          end: castNumberType(idxsToRemove.end, minEnd)
        })
      );
    }

    if (idxsToRemove.end < rangeObject.end) {
      // There's a range after idxsToRemove
      // Overflow is not possible because idxsToRemove.end < rangeObject.end
      newRanges.push(
        new UintRange({
          start: safeAddKeepLeft(idxsToRemove.end, 1n),
          end: rangeObject.end
        })
      );

      const maxStart = bigIntMax(BigInt(idxsToRemove.start), BigInt(rangeObject.start));

      removedRanges.push(
        new UintRange({
          start: castNumberType(idxsToRemove.start, maxStart),
          end: idxsToRemove.end
        })
      );
    }

    if (idxsToRemove.end < rangeObject.end && idxsToRemove.start > rangeObject.start) {
      // idxsToRemove is in the middle of rangeObject
      removedRanges = UintRangeArray.From([idxsToRemove]);
    }

    return [newRanges, removedRanges];
  }

  /**
   * Returns the overlap between the current range and the provided range.
   */
  getOverlaps(toRemove: iUintRange<T> | iUintRange<T>[] | UintRangeArray<T>): UintRangeArray<T> {
    return this.getOverlapDetails(toRemove)[1];
  }

  toArray(): UintRangeArray<T> {
    return UintRangeArray.From([this.clone()]);
  }
}

/**
 * @category Uint Ranges
 */
export class UintRangeArray<T extends NumberType> extends BaseTypedArray<UintRangeArray<T>, UintRange<T>> {
  /**
   * Returns a new UintRangeArray from 1 to 18446744073709551615 (max uint64).
   */
  static FullRanges(): UintRangeArray<bigint> {
    return new UintRangeArray(UintRange.FullRange());
  }

  static From<T extends NumberType>(arr: iUintRange<T>[] | iUintRange<T> | UintRangeArray<T>): UintRangeArray<T> {
    const wrappedArr = Array.isArray(arr) ? arr : [arr];
    return new UintRangeArray(...wrappedArr.map((i) => new UintRange(i)));
  }

  /**
   * @hidden
   */
  push(...items: iUintRange<T>[]): number {
    return super.push(...items.map((i) => new UintRange(i)));
  }
  /**
   * @hidden
   */
  fill(value: iUintRange<T>, start?: number | undefined, end?: number | undefined): this {
    return super.fill(new UintRange(value), start, end);
  }
  /**
   * @hidden
   */
  with(index: number, value: iUintRange<T>): UintRangeArray<T> {
    return super.with(index, new UintRange(value));
  }
  /**
   * @hidden
   */
  unshift(...items: iUintRange<T>[]): number {
    return super.unshift(...items.map((i) => new UintRange(i)));
  }

  /**
   * Gets the total number of IDs covered by a list of UintRanges.
   * for example, [{start: 1, end: 3}, {start: 5, end: 7}] would return 6.
   */
  size(): T {
    let sum: T = 0n as T;
    for (const range of this) {
      sum = safeAddKeepLeft(range.size(), sum);
    }

    return sum;
  }

  clone(): UintRangeArray<T> {
    return UintRangeArray.From(this.map((x) => x.clone()));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UintRangeArray<U> {
    return UintRangeArray.From<U>(this.map((x) => x.convert(convertFunction)));
  }

  /**
   * Checks if the provided id ranges are full (i.e. they cover all possible IDs from 1 to max uint64).
   */
  isFull(): boolean {
    const clone = this.clone().sortAndMerge();
    return clone.length == 1 && clone[0].isFull();
  }

  /**
   * Checks if any of the array's elements overlap with each other.
   *
   * @remarks
   * Overlap here is considered inclusive, so [1, 10] and [10, 20] would be considered overlapping. [1, 10] and [11, 20] would not be considered overlapping.
   */
  hasOverlaps(): boolean {
    for (let i = 0; i < this.length; i++) {
      const range = this[i];
      for (let j = i + 1; j < this.length; j++) {
        const otherRange = this[j];
        if (range.overlaps(otherRange)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Sorts and merges a list of UintRanges. If ranges overlap, they are merged.
   *
   * @example
   * [{start: 1, end: 3}, {start: 2, end: 4}] => [{start: 1, end: 4}]
   *
   * @remarks
   * Does not return a new list. Modifies the list in place. To get a new list, use `clone().sortAndMerge()`.
   */
  sortAndMerge() {
    if (this.length <= 1) return this;

    //Insertion sort in order of range.Start. If two have same range.Start, sort by range.End.
    for (let i = 1; i < this.length; i++) {
      const uintRange = this[i];
      let j = i - 1;
      while (j >= 0 && this[j].start > uintRange.start) {
        this[j + 1] = this[j];
        j--;
      }
      this[j + 1] = uintRange;
    }

    //Merge overlapping ranges
    const mergedRanges = UintRangeArray.From<T>([]);
    let currRange = this[0];
    for (let i = 1; i < this.length; i++) {
      const range = this[i];
      if (BigInt(range.start) <= BigInt(currRange.end) + 1n) {
        if (BigInt(range.end) > BigInt(currRange.end)) {
          currRange.end = range.end;
        }
      } else {
        mergedRanges.push(currRange);
        currRange = range;
      }
    }
    mergedRanges.push(currRange);

    this.length = 0;
    this.push(...mergedRanges);
    return this;
  }

  /**
   * Invert a list of UintRanges (i.e. get all values in some bounds not in current list) in-place.
   */
  invert(bounds: iUintRange<T>) {
    let ranges = UintRangeArray.From([bounds]);
    const uintRanges = UintRangeArray.From(this);

    for (let i = 0; i < uintRanges.length; i++) {
      const uintRange = uintRanges[i];
      let newRanges = UintRangeArray.From<T>([]);
      for (let j = 0; j < ranges.length; j++) {
        const rangeObject = ranges[j];
        const [rangesAfterRemoval] = rangeObject.getOverlapDetails(uintRange);
        newRanges = UintRangeArray.From(newRanges.concat(rangesAfterRemoval));
      }
      ranges = newRanges;
    }

    this.length = 0;
    this.push(...ranges);
    return this;
  }

  /**
   * Wrapper for invert that returns a new list instead of modifying the current list.
   */
  toInverted(bounds: iUintRange<T>): UintRangeArray<T> {
    return this.clone().invert(bounds);
  }

  /**
   * Gets the overlap details between two lists of UintRanges.
   * Returns a tuple of [remainingInThis, overlaps, remainingInOther].
   */
  getOverlapDetails(idsToRemove: iUintRange<T>[] | iUintRange<T> | UintRangeArray<T>): [UintRangeArray<T>, UintRangeArray<T>, UintRangeArray<T>] {
    const [remaining, removed] = this.getRemainingAndRemoved(idsToRemove);
    const [remainingInOther] = UintRangeArray.From(idsToRemove).getRemainingAndRemoved(this);
    return [remaining, removed, remainingInOther];
  }

  /**
   * Gets the overlap between the current range and another
   */
  getOverlaps(idsToRemove: iUintRange<T> | iUintRange<T>[] | UintRangeArray<T>): UintRangeArray<T> {
    return this.getOverlapDetails(idsToRemove)[1];
  }

  private getRemainingAndRemoved(idsToRemove: iUintRange<T> | iUintRange<T>[] | UintRangeArray<T>): [UintRangeArray<T>, UintRangeArray<T>] {
    const wrappedArr: UintRange<T>[] = Array.isArray(idsToRemove) ? idsToRemove.map((i) => new UintRange(i)) : [new UintRange(idsToRemove)];
    let rangeToRemoveFrom = this.clone().sortAndMerge();

    if (wrappedArr.length === 0) {
      return [rangeToRemoveFrom, UintRangeArray.From([])];
    }

    let removedRanges = UintRangeArray.From<T>([]);
    for (let i = 0; i < wrappedArr.length; i++) {
      const handledValue = wrappedArr[i];
      let newRanges = UintRangeArray.From<T>([]);
      for (let j = 0; j < rangeToRemoveFrom.length; j++) {
        const oldPermittedTime = rangeToRemoveFrom[j];
        const [rangesAfterRemoval, removed] = oldPermittedTime.getOverlapDetails(handledValue);
        newRanges = UintRangeArray.From(newRanges.concat(rangesAfterRemoval));
        removedRanges = UintRangeArray.From(removedRanges.concat(removed));
      }
      rangeToRemoveFrom = newRanges;
    }

    return [rangeToRemoveFrom, removedRanges];
  }

  /**
   * Remove a range from the current range in-place
   */
  remove(idsToRemove: iUintRange<T>[] | iUintRange<T> | UintRangeArray<T>): this {
    const [remaining] = this.getOverlapDetails(idsToRemove);
    this.length = 0;
    this.push(...remaining);
    return this;
  }

  /**
   * Search ID ranges for a specific ID. Return [idx, found], where idx is the index of the range that contains the ID, and found is true if the ID was found.
   *
   * If you just want one or the other, use searchIndex() or searchIfExists().
   */
  search(id: NumberType): [bigint, boolean] {
    const ranges = this.clone().sortAndMerge();
    const converterFunction = getConverterFunction(ranges[0].start);
    id = converterFunction(id);

    // Binary search because ID ranges will be sorted
    let low = 0;
    let high = ranges.length - 1;
    while (low <= high) {
      const median = Math.floor((low + high) / 2);

      const currRange = ranges[median];

      if (currRange.search(id)) {
        return [BigInt(median), true];
      } else if (currRange.start > id) {
        high = median - 1;
      } else {
        low = median + 1;
      }
    }

    return [BigInt(-1), false];
  }

  /**
   * Search ID ranges for a specific ID. Return true, if found.
   */
  searchIfExists(val: NumberType): boolean {
    return this.search(val)[1];
  }

  /**
   * Search for the first index of an element that includes the provided value.
   */
  searchIndex(val: NumberType): bigint {
    return this.search(val)[0];
  }

  /**
   * Asserts two UintRanges[] do not overlap at all with each other.
   * For example, if we have a list of permitted and forbidden times, we want to make sure that the forbidden times do not overlap with the permitted times.
   */
  assertNoOverlaps(overlappingRange: iUintRange<T>[]) {
    const rangeToCheck = this.clone().sortAndMerge();

    // Check that for old times, there is 100% overlap with new times and 0% overlap with the opposite
    for (let i = 0; i < rangeToCheck.length; i++) {
      const oldAllowedTime = rangeToCheck[i];
      for (let j = 0; j < overlappingRange.length; j++) {
        const newAllowedTime = overlappingRange[j];
        // Check that the new time completely overlaps with the old time
        const [, removed] = oldAllowedTime.getOverlapDetails(newAllowedTime);
        if (removed.length > 0) {
          throw new Error('RangesOverlap');
        }
      }
    }
  }
}
