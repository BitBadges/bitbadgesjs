import { b_IdRange } from "bitbadgesjs-proto";

/**
 * Sorts and merges a list of IdRanges. If ranges overlap, they are merged.
 *
 * @example
 * [{start: 1, end: 3}, {start: 2, end: 4}] => [{start: 1, end: 4}]
 *
 * @param {b_IdRange[]} idRanges - The list of IdRanges to sort and merge.
 *
 * @remarks
 * Returns a new array but also does modify the original.
 */
export function sortIdRangesAndMergeIfNecessary(idRanges: b_IdRange[]) {
  //Insertion sort in order of range.Start. If two have same range.Start, sort by range.End.
  for (let i = 1; i < idRanges.length; i++) {
    const idRange = idRanges[i];
    let j = i - 1;
    while (j >= 0 && idRanges[j].start > idRange.start) {
      idRanges[j + 1] = idRanges[j];
      j--;
    }
    idRanges[j + 1] = idRange;
  }

  //Merge overlapping ranges
  for (let i = 1; i < idRanges.length; i++) {
    const idRange = idRanges[i];
    const prevIdRange = idRanges[i - 1];

    if (idRange.start <= prevIdRange.end + 1n) {
      prevIdRange.end = idRange.end;
      idRanges.splice(i, 1);
      i--;
    }
  }
  return idRanges;
}

function createIdRange(start: bigint, end: bigint) {
  return {
    start: start,
    end: end,
  }
}

/**
 * Given a range of Ids to remove, remove them from a target rangeObject.
 *
 * @param {b_IdRange} rangeToRemove - The range of Ids to remove
 * @param {b_IdRange} rangeObject - The range of Ids to remove from
 *
 * @remarks
 * Can return an empty array, or an array of 1 or 2 IdRanges.
 *
 */
export function removeIdsFromIdRange(rangeToRemove: b_IdRange, rangeObject: b_IdRange) {
  let idxsToRemove = rangeToRemove;
  let newIdRanges: b_IdRange[] = [];


  if (idxsToRemove.start > rangeObject.start && idxsToRemove.end < rangeObject.end) {
    // Completely in the middle; Split into two ranges
    newIdRanges.push(createIdRange(rangeObject.start, idxsToRemove.start - 1n));
    newIdRanges.push(createIdRange(idxsToRemove.end + 1n, rangeObject.end));
  } else if (idxsToRemove.start <= rangeObject.start && idxsToRemove.end >= rangeObject.end) {
    // Overlaps both; remove whole thing
    // Do nothing
  } else if (idxsToRemove.start <= rangeObject.start && idxsToRemove.end < rangeObject.end && idxsToRemove.end >= rangeObject.start) {
    // Still have some left at the end
    newIdRanges.push(createIdRange(idxsToRemove.end + 1n, rangeObject.end));
  } else if (idxsToRemove.start > rangeObject.start && idxsToRemove.end >= rangeObject.end && idxsToRemove.start <= rangeObject.end) {
    // Still have some left at the start
    newIdRanges.push(createIdRange(rangeObject.start, idxsToRemove.start - 1n));
  } else {
    // Doesn't overlap at all; keep everything
    newIdRanges.push(createIdRange(rangeObject.start, rangeObject.end));
  }

  return newIdRanges;
}

/**
 * Search ID ranges for a specific ID. Return (idx, true) if found. And (-1, false) if not.
 *
 * @param {bigint} id - The ID to search for
 * @param {b_IdRange[]} idRanges - The list of IdRanges to search
 */
export function searchIdRangesForId(id: bigint, idRanges: b_IdRange[]): [number, boolean] {
  idRanges = sortIdRangesAndMergeIfNecessary(idRanges) // Just in case

  //Binary search because ID ranges will be sorted
  let low = 0;
  let high = idRanges.length - 1;
  while (low <= high) {
    let median = Math.floor((low + high) / 2);
    let currRange = idRanges[median];
    if (currRange.start <= id && currRange.end >= id) {
      return [median, true];
    } else if (currRange.start > id) {
      high = median - 1;
    } else {
      low = median + 1;
    }
  }
  return [-1, false] as [number, boolean];
}

/**
 * Searches a set of ranges to find what indexes a specific ID range overlaps.
 * Returns overlapping idxs as a b_IdRange, true if found.
 * And empty b_IdRange, false if not.
 *
 * @param {b_IdRange} targetRange - The range to search for
 * @param {b_IdRange[]} targetIdRanges - The list of IdRanges to search
 *
 * @remarks
 * Returned range is inclusive (i.e. end idx also overlaps)
 */
export function getIdxSpanForRange(targetRange: b_IdRange, targetIdRanges: b_IdRange[]): [{ start: number, end: number }, boolean] {
  //its search for start, if found set to that
  //if not found, set to insertIdx + 0 (because we already incremented by 1)
  //if end is found, set to that
  //else set to insertIdx - 1 (because we already incremented by 1)
  let idRanges = targetIdRanges;

  let [startIdx, startFound] = searchIdRangesForId(targetRange.start, idRanges)
  if (!startFound) {
    startIdx = getIdxToInsertForNewId(targetRange.start, idRanges)
  }

  let [endIdx, endFound] = searchIdRangesForId(targetRange.end, idRanges)
  if (!endFound) {
    endIdx = getIdxToInsertForNewId(targetRange.end, idRanges) - 1
  }

  if (startIdx <= endIdx) {
    return [{
      start: startIdx,
      end: endIdx,
    }, true]
  } else {
    return [{
      start: -1,
      end: -1,
    }, false]
  }
}

/**
 * Assuming an id is not already in a range, gets the index to insert at.
 *
 * @example
 * [{ start: 10, end: 20 }, { start: 30, end: 40 }] and inserting id 25 would return index 1
 *
 * @param {bigint} id - The ID to add
 * @param {b_IdRange[]} targetIds - The list of IdRanges to insert to
 */
export function getIdxToInsertForNewId(id: bigint, targetIds: b_IdRange[]) {
  targetIds = sortIdRangesAndMergeIfNecessary(targetIds) // Just in case

  const [_, found] = searchIdRangesForId(id, targetIds)
  if (found) {
    throw new Error("ID already in range")
  }

  //Since we assume the id is not already in there, we can just compare start positions of the existing idRanges and see where it falls between
  let ids = targetIds;
  if (ids.length == 0) {
    return 0
  }


  if (ids[0].start > id) { //assumes not in already so we don't have to handle that case
    return 0
  } else if (ids[ids.length - 1].end < id) {
    return ids.length;
  }

  let low = 0;
  let high = ids.length - 2;
  let median = 0;
  while (low <= high) {
    median = Math.floor((low + high) / 2);
    let currRange = ids[median]
    let nextRange = ids[median + 1]

    if (currRange.start < id && nextRange.start > id) {
      break;
    } else if (currRange.start > id) {
      high = median - 1;
    } else {
      low = median + 1;
    }
  }


  let currRange = ids[median]
  let insertIdx = median + 1
  if (currRange.start <= id) {
    insertIdx = median
  }

  return insertIdx + 1;
}

// We inserted a new id at insertedAtIdx, this can cause the prev or next to have to merge if id + 1 or id - 1 overlaps with prev or next range. Handle this here.

/**
 * Merges the previous or next range, if overlap exists.
 *
 * @param {b_IdRange[]} targetIds - The list of IdRanges to insert to
 * @param {bigint | string | number} insertedAtIdx - The index where the new ID was inserted
 *
 * @example
 * [{ start: 10, end: 20 }, { start: 21, end: 40 }] would be merged into [{ start: 10, end: 40 }]
 */
export function mergePrevOrNextIfPossible(targetIds: b_IdRange[], _insertedAtIdx: bigint | number | string) {
  const insertedAtIdx = Number(_insertedAtIdx);

  //Handle cases where we need to merge with the previous or next range
  let needToMergeWithPrev = false;
  let needToMergeWithNext = false;
  let prevStartIdx = 0n;
  let nextEndIdx = 0n;
  let ids = targetIds;

  let id = ids[insertedAtIdx];
  let idStart = id.start;
  let idEnd = id.end;



  if (insertedAtIdx > 0) {
    let prev = ids[insertedAtIdx - 1];
    prevStartIdx = prev.start;
    let prevEndIdx = prev.end;

    if (prevEndIdx + 1n == idStart) {
      needToMergeWithPrev = true;
    }
  }

  if (insertedAtIdx < ids.length - 1) {
    let next = ids[insertedAtIdx + 1];
    let nextStartIdx = next.start;
    nextEndIdx = next.end;

    if (nextStartIdx - 1n == idEnd) {
      needToMergeWithNext = true;
    }
  }

  let mergedIds = [] as b_IdRange[];
  // 4 Cases: Need to merge with both, just next, just prev, or neither
  if (needToMergeWithPrev && needToMergeWithNext) {
    mergedIds = mergedIds.concat(ids.slice(0, insertedAtIdx - 1));
    mergedIds.push(createIdRange(prevStartIdx, nextEndIdx));
    mergedIds = mergedIds.concat(ids.slice(insertedAtIdx + 2));
  } else if (needToMergeWithPrev) {
    mergedIds = mergedIds.concat(ids.slice(0, insertedAtIdx - 1));
    mergedIds.push(createIdRange(prevStartIdx, idEnd));
    mergedIds = mergedIds.concat(ids.slice(insertedAtIdx + 1));
  } else if (needToMergeWithNext) {
    mergedIds = mergedIds.concat(ids.slice(0, insertedAtIdx));
    mergedIds.push(createIdRange(idStart, nextEndIdx));
    mergedIds = mergedIds.concat(ids.slice(insertedAtIdx + 2));
  } else {
    mergedIds = ids;
  }

  return mergedIds
}

/**
 * Insert a range into its correct position.
 *
 * @param {b_IdRange} rangeToAdd - The range to insert
 * @param {b_IdRange[]} targetIds - The list of IdRanges to insert to
 *
 * @remarks
 * IMPORTANT: Assumes range is already deleted and not present at all, so we only search for where start fits in.
 */
export function insertRangeToIdRanges(rangeToAdd: b_IdRange, targetIds: b_IdRange[]) {
  let ids = targetIds;
  let newIds = [] as b_IdRange[];
  let insertIdAtIdx = 0;
  rangeToAdd = rangeToAdd;
  let lastRange = ids[ids.length - 1];

  //Three cases: Goes at beginning, end, or somewhere in the middle
  if (ids[0].start > rangeToAdd.end) {
    newIds.push(createIdRange(rangeToAdd.start, rangeToAdd.end));
    newIds = newIds.concat(ids);
  } else if (lastRange && lastRange.end < rangeToAdd.start) {
    insertIdAtIdx = ids.length;
    newIds = newIds.concat(ids);
    newIds.push(createIdRange(rangeToAdd.start, rangeToAdd.end));
  } else {
    insertIdAtIdx = getIdxToInsertForNewId(rangeToAdd.start, ids); //Only lookup start since we assume the whole range isn't included already
    newIds = newIds.concat(ids.slice(0, insertIdAtIdx));
    newIds.push(createIdRange(rangeToAdd.start, rangeToAdd.end));
    newIds = newIds.concat(ids.slice(insertIdAtIdx));
  }

  newIds = mergePrevOrNextIfPossible(newIds, insertIdAtIdx)

  return newIds;
}


/**
 * Checks if the provided id ranges overlap at all with each other.
 *
 * @remarks
 * Overlap here is considered inclusive, so [1, 10] and [10, 20] would be considered overlapping. [1, 10] and [11, 20] would not be considered overlapping.
 *
 * @param {b_IdRange[]} idRanges - The list of IdRanges to check
 */
export function checkIfIdRangesOverlap(idRanges: b_IdRange[]) {
  return idRanges.some(({ start, end }, i) => {
    const start1 = start;
    const end1 = end
    return idRanges.some(({ start, end }, j) => {
      const start2 = start;
      const end2 = end;
      if (i === j) {
        return false;
      }
      return start1 <= end2 && start2 <= end1;
    });
  });
}
