import { UintRange } from "bitbadgesjs-proto";
import { bigIntMax, bigIntMin } from "./badgeMetadata";

/**
 * Sorts and merges a list of UintRanges. If ranges overlap, they are merged.
 *
 * @example
 * [{start: 1, end: 3}, {start: 2, end: 4}] => [{start: 1, end: 4}]
 *
 * @param {UintRange<bigint>[]} UintRanges - The list of UintRanges to sort and merge.
 *
 * @remarks
 * Returns a new array but also does modify the original.
 */
export function sortUintRangesAndMergeIfNecessary(uintRanges: UintRange<bigint>[]) {
  //Insertion sort in order of range.Start. If two have same range.Start, sort by range.End.
  for (let i = 1; i < uintRanges.length; i++) {
    const uintRange = uintRanges[i];
    let j = i - 1;
    while (j >= 0 && uintRanges[j].start > uintRange.start) {
      uintRanges[j + 1] = uintRanges[j];
      j--;
    }
    uintRanges[j + 1] = uintRange;
  }

  //Merge overlapping ranges
  for (let i = 1; i < uintRanges.length; i++) {
    const uintRange = uintRanges[i];
    const prevUintRange = uintRanges[i - 1];

    if (uintRange.start <= prevUintRange.end + 1n) {
      prevUintRange.end = uintRange.end;
      uintRanges.splice(i, 1);
      i--;
    }
  }
  return uintRanges;
}

function createUintRange(start: bigint, end: bigint) {
  return {
    start: start,
    end: end,
  }
}

/**
 * Deep copy a list of UintRanges.
 *
 * @param {UintRange<bigint>[]} ranges - The list of UintRanges to copy
 */
export function deepCopyRanges(ranges: UintRange<bigint>[]) {
  let newRanges = [];
  for (let i = 0; i < ranges.length; i++) {
    let rangeObject = ranges[i];
    newRanges.push(createUintRange(rangeObject.start, rangeObject.end));
  }
  return newRanges;
}

/**
 * Search ID ranges for a specific ID. Return boolean if found.
 *
 * @param {bigint} id - The ID to search for
 * @param {UintRange<bigint>[]} uintRanges - The list of UintRanges to search
 */
export function searchUintRangesForId(id: bigint, uintRanges: UintRange<bigint>[]): [bigint, boolean] {
  let ranges = deepCopyRanges(uintRanges)
  ranges = sortUintRangesAndMergeIfNecessary(ranges)

  // Binary search because ID ranges will be sorted
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    let median = Math.floor((low + high) / 2);

    let currRange = ranges[median];

    if (currRange.start <= id && currRange.end >= id) {
      return [BigInt(median), true]
    } else if (currRange.start > id) {
      high = median - 1;
    } else {
      low = median + 1;
    }
  }

  return [BigInt(-1), false];
}

/**
 * Invert a list of UintRanges (i.e. get all values up to some max ID not in current list)
 *
 * @param {UintRange<bigint>[]} uintRanges - The list of UintRanges to invert
 * @param {bigint} maxId - The max ID to invert up to
 */
export function invertUintRanges(uintRanges: UintRange<bigint>[], minId: bigint, maxId: bigint) {
  let ranges = [];
  ranges.push(createUintRange(minId, maxId));

  for (let i = 0; i < uintRanges.length; i++) {
    let uintRange = uintRanges[i];
    let newRanges = [] as UintRange<bigint>[];
    for (let j = 0; j < ranges.length; j++) {
      let rangeObject = ranges[j];
      let [rangesAfterRemoval, _] = removeUintsFromUintRange(uintRange, rangeObject);
      newRanges = newRanges.concat(rangesAfterRemoval);
    }
    ranges = newRanges;
  }

  return ranges;
}


/**
 * Removes all ids within an id range from an id range.
 * Removing can make this range be split into 0, 1, or 2 new ranges.
 * Returns [remaining, removed] ranges.
 *
 * @param {UintRange<bigint>} idxsToRemove - The range of Ids to remove
 * @param {UintRange<bigint>} rangeObject - The range of Ids to remove from
 */
export function removeUintsFromUintRange(idxsToRemove: UintRange<bigint>, rangeObject: UintRange<bigint>) {
  if (idxsToRemove.end < rangeObject.start || idxsToRemove.start > rangeObject.end) {
    // idxsToRemove doesn't overlap with rangeObject, so nothing is removed
    return [[rangeObject], []];
  }

  let newRanges: UintRange<bigint>[] = [];
  let removedRanges: UintRange<bigint>[] = [];
  if (idxsToRemove.start <= rangeObject.start && idxsToRemove.end >= rangeObject.end) {
    // idxsToRemove fully contains rangeObject, so nothing is left
    return [newRanges, [rangeObject]];
  }

  if (idxsToRemove.start > rangeObject.start) {
    // There's a range before idxsToRemove
    // Underflow is not possible because idxsToRemove.start > rangeObject.start
    newRanges.push({
      start: rangeObject.start,
      end: idxsToRemove.start - 1n
    });

    //get min of idxsToRemove.end and rangeObject.end
    let minEnd = bigIntMin(idxsToRemove.end, rangeObject.end);

    removedRanges.push({
      start: idxsToRemove.start,
      end: minEnd
    });
  }

  if (idxsToRemove.end < rangeObject.end) {
    // There's a range after idxsToRemove
    // Overflow is not possible because idxsToRemove.end < rangeObject.end
    newRanges.push({
      start: idxsToRemove.end + 1n,
      end: rangeObject.end
    });

    let maxStart = bigIntMax(idxsToRemove.start, rangeObject.start);

    removedRanges.push({
      start: maxStart,
      end: idxsToRemove.end
    });
  }

  if (idxsToRemove.end < rangeObject.end && idxsToRemove.start > rangeObject.start) {
    // idxsToRemove is in the middle of rangeObject
    removedRanges = [idxsToRemove];
  }

  return [newRanges, removedRanges];
}


/**
 * Remove one range from another range.
 *
 * Returns [remaining, removed] ranges.
 *
 * @param {UintRange<bigint>[]} idsToRemove - The range of Ids to remove
 * @param {UintRange<bigint>[]} rangeToRemoveFrom - The range of Ids to remove from
 */
export function removeUintRangeFromUintRange(idsToRemove: UintRange<bigint>[], rangeToRemoveFrom: UintRange<bigint>[]): [UintRange<bigint>[], UintRange<bigint>[]] {
  if (idsToRemove.length === 0) {
    return [rangeToRemoveFrom, []];
  }

  let removedRanges: UintRange<bigint>[] = [];
  for (let i = 0; i < idsToRemove.length; i++) {
    let handledValue = idsToRemove[i];
    let newRanges: UintRange<bigint>[] = [];
    for (let j = 0; j < rangeToRemoveFrom.length; j++) {
      let oldPermittedTime = rangeToRemoveFrom[j];
      let [rangesAfterRemoval, removed] = removeUintsFromUintRange(handledValue, oldPermittedTime);
      newRanges = newRanges.concat(rangesAfterRemoval);
      removedRanges = removedRanges.concat(removed);
    }
    rangeToRemoveFrom = newRanges;
  }

  return [rangeToRemoveFrom, removedRanges];
}

/**
 * Asserts two UintRanges[] do not overlap at all with each other.
 * For example, if we have a list of permitted and forbidden times, we want to make sure that the forbidden times do not overlap with the permitted times.
 */
export function assertRangesDoNotOverlapAtAll(rangeToCheck: UintRange<bigint>[], overlappingRange: UintRange<bigint>[]) {
  // Check that for old times, there is 100% overlap with new times and 0% overlap with the opposite
  for (let i = 0; i < rangeToCheck.length; i++) {
    let oldAllowedTime = rangeToCheck[i];
    for (let j = 0; j < overlappingRange.length; j++) {
      let newAllowedTime = overlappingRange[j];
      // Check that the new time completely overlaps with the old time
      let [, removed] = removeUintsFromUintRange(newAllowedTime, oldAllowedTime);
      if (removed.length > 0) {
        throw new Error("RangesOverlap");
      }
    }
  }
}


/**
 * Checks if the provided id ranges overlap at all with each other.
 *
 * @remarks
 * Overlap here is considered inclusive, so [1, 10] and [10, 20] would be considered overlapping. [1, 10] and [11, 20] would not be considered overlapping.
 *
 * @param {UintRange<bigint>[]} uintRanges - The list of UintRanges to check
 */
export function checkIfUintRangesOverlap(uintRanges: UintRange<bigint>[]) {
  return uintRanges.some(({ start, end }, i) => {
    const start1 = start;
    const end1 = end
    return uintRanges.some(({ start, end }, j) => {
      const start2 = start;
      const end2 = end;
      if (i === j) {
        return false;
      }
      return start1 <= end2 && start2 <= end1;
    });
  });
}
