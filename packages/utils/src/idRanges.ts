import { IdRange } from "bitbadgesjs-proto";

export function sortIdRangesAndMergeIfNecessary(idRanges: IdRange[]) {
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

    if (idRange.start <= prevIdRange.end + 1) {
      prevIdRange.end = idRange.end;
      idRanges.splice(i, 1);
      i--;
    }
  }
  return idRanges;
}



export function getIdRangesToInsertToStorage(idRanges: IdRange[]) {
  var newIdRanges: IdRange[] = [];
  for (let range of idRanges) {
    newIdRanges.push(getIdRangeToInsert(range.start, range.end));
  }
  return newIdRanges;
}

function createIdRange(start: number, end: number) {
  return {
    start: start,
    end: end,
  }
}

// Removes the ids spanning from rangeToRemove.start to rangeToRemove.end from the rangeObject.
export function removeIdsFromIdRange(rangeToRemove: IdRange, rangeObject: IdRange) {
  rangeToRemove = normalizeIdRange(rangeToRemove)
  rangeObject = normalizeIdRange(rangeObject)

  let idxsToRemove = rangeToRemove;

  let newIdRanges: IdRange[] = [];


  if (idxsToRemove.start > rangeObject.start && idxsToRemove.end < rangeObject.end) {
    // Completely in the middle; Split into two ranges
    newIdRanges.push(createIdRange(rangeObject.start, idxsToRemove.start - 1));
    newIdRanges.push(createIdRange(idxsToRemove.end + 1, rangeObject.end));
  } else if (idxsToRemove.start <= rangeObject.start && idxsToRemove.end >= rangeObject.end) {
    // Overlaps both; remove whole thing
    // Do nothing
  } else if (idxsToRemove.start <= rangeObject.start && idxsToRemove.end < rangeObject.end && idxsToRemove.end >= rangeObject.start) {
    // Still have some left at the end
    newIdRanges.push(createIdRange(idxsToRemove.end + 1, rangeObject.end));
  } else if (idxsToRemove.start > rangeObject.start && idxsToRemove.end >= rangeObject.end && idxsToRemove.start <= rangeObject.end) {
    // Still have some left at the start
    newIdRanges.push(createIdRange(rangeObject.start, idxsToRemove.start - 1));
  } else {
    // Doesn't overlap at all; keep everything
    newIdRanges.push(createIdRange(rangeObject.start, rangeObject.end));
  }


  // //add everything before rangeToRemove.start
  // if (rangeObject.start < rangeToRemove.start) {
  //     newIdRanges.push(getIdRangeToInsert(rangeObject.start, rangeToRemove.start - 1));
  // }



  // //add everything after rangeToRemove.end
  // if (rangeObject.end > rangeToRemove.end) {
  //     newIdRanges.push(getIdRangeToInsert(rangeToRemove.end + 1, rangeObject.end));
  // }

  return newIdRanges;
}


// Search ID ranges for a specific ID. Return (idx, true) if found. And (-1, false) if not.
export function searchIdRangesForId(id: number, idRanges: IdRange[]): [number, boolean] {
  //Binary search because ID ranges will be sorted
  let low = 0;
  let high = idRanges.length - 1;
  while (low <= high) {
    let median = Math.floor((low + high) / 2);
    let currRange = normalizeIdRange(idRanges[median]);
    if (currRange.start <= id && currRange.end >= id) {
      return [median, true];
    } else if (currRange.start > id) {
      high = median - 1;
    } else {
      low = median + 1;
    }
  }
  return [-1, false];
}

// Search a set of ranges to find what indexes a specific ID range overlaps. Return overlapping idxs as a IdRange, true if found. And empty IdRang, false if not
export function getIdxSpanForRange(targetRange: IdRange, targetIdRanges: IdRange[]): [IdRange, boolean] {
  //its search for start, if found set to that
  //if not found, set to insertIdx + 0 (because we already incremented by 1)
  //if end is found, set to that
  //else set to insertIdx - 1 (because we already incremented by 1)
  targetRange = normalizeIdRange(targetRange)
  let idRanges = targetIdRanges;

  let res = searchIdRangesForId(targetRange.start, idRanges)
  let startIdx = res[0];
  let startFound = res[1];
  if (!startFound) {
    startIdx = getIdxToInsertForNewId(targetRange.start, idRanges)
  }

  let res2 = searchIdRangesForId(targetRange.end, idRanges)
  let endIdx = res2[0];
  let endFound = res2[1];
  if (!endFound) {
    endIdx = getIdxToInsertForNewId(targetRange.end, idRanges) - 1
  }

  if (startIdx <= endIdx) {
    return [{
      start: startIdx,
      end: endIdx,
    }, true]
  } else {
    return [{} as IdRange, false]
  }
}

// Handle the case where it omits an empty IdRange because Start && End == 0. This is in the case where we have a non-empty balance and an empty idRanges.
export function getIdRangesWithOmitEmptyCaseHandled(ids: IdRange[]) {
  if (ids.length == 0) {
    ids = [getIdRangeToInsert(0, 0)];
  }
  return ids
}

// Gets the number range to insert with the additional convention of storing end = 0 when end == start
export function getIdRangeToInsert(start: number, end: number) {
  if (end < start) {
    throw new Error('End cannot be less than start');
  }

  return {
    start: start,
    end: end
  }
}

// Normalizes an existing ID range with the additional convention of storing end == 0 when end == start
export function normalizeIdRange(rangeToNormalize: IdRange) {
  if (!rangeToNormalize.end) {
    rangeToNormalize.end = rangeToNormalize.start
  }

  return {
    start: rangeToNormalize.start,
    end: rangeToNormalize.end
  }
}

// Assumes id is not already in a range. Gets the index to insert at. Ex. [10, 20, 30] and inserting 25 would return index 2
export function getIdxToInsertForNewId(id: number, targetIds: IdRange[]) {
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
    let currRange = normalizeIdRange(ids[median]);
    let nextRange = normalizeIdRange(ids[median + 1]);

    if (currRange.start < id && nextRange.start > id) {
      break;
    } else if (currRange.start > id) {
      high = median - 1;
    } else {
      low = median + 1;
    }
  }


  let currRange = normalizeIdRange(ids[median]);
  let insertIdx = median + 1
  if (currRange.start <= id) {
    insertIdx = median
  }

  return insertIdx + 1;
}

// We inserted a new id at insertedAtIdx, this can cause the prev or next to have to merge if id + 1 or id - 1 overlaps with prev or next range. Handle this here.
export function mergePrevOrNextIfPossible(targetIds: IdRange[], insertedAtIdx: number) {
  //Handle cases where we need to merge with the previous or next range
  let needToMergeWithPrev = false;
  let needToMergeWithNext = false;
  let prevStartIdx = 0;
  let nextEndIdx = 0;
  let ids = targetIds;

  let id = normalizeIdRange(ids[insertedAtIdx]);
  let idStart = id.start;
  let idEnd = id.end;



  if (insertedAtIdx > 0) {
    let prev = normalizeIdRange(ids[insertedAtIdx - 1]);
    prevStartIdx = prev.start;
    let prevEndIdx = prev.end;

    if (prevEndIdx + 1 == idStart) {
      needToMergeWithPrev = true;
    }
  }

  if (insertedAtIdx < ids.length - 1) {
    let next = normalizeIdRange(ids[insertedAtIdx + 1]);
    let nextStartIdx = next.start;
    nextEndIdx = next.end;

    if (nextStartIdx - 1 == idEnd) {
      needToMergeWithNext = true;
    }
  }

  let mergedIds = [] as IdRange[];
  // 4 Cases: Need to merge with both, just next, just prev, or neither
  if (needToMergeWithPrev && needToMergeWithNext) {
    mergedIds = mergedIds.concat(ids.slice(0, insertedAtIdx - 1));
    mergedIds.push(getIdRangeToInsert(prevStartIdx, nextEndIdx));
    mergedIds = mergedIds.concat(ids.slice(insertedAtIdx + 2));
  } else if (needToMergeWithPrev) {
    mergedIds = mergedIds.concat(ids.slice(0, insertedAtIdx - 1));
    mergedIds.push(getIdRangeToInsert(prevStartIdx, idEnd));
    mergedIds = mergedIds.concat(ids.slice(insertedAtIdx + 1));
  } else if (needToMergeWithNext) {
    mergedIds = mergedIds.concat(ids.slice(0, insertedAtIdx));
    mergedIds.push(getIdRangeToInsert(idStart, nextEndIdx));
    mergedIds = mergedIds.concat(ids.slice(insertedAtIdx + 2));
  } else {
    mergedIds = ids;
  }

  return mergedIds
}

// Inserts a range into its correct position. Assumes range is already deleted and not present at all, so we only search for where start fits in.
export function insertRangeToIdRanges(rangeToAdd: IdRange, targetIds: IdRange[]) {
  let ids = targetIds;
  let newIds = [] as IdRange[];
  let insertIdAtIdx = 0;
  rangeToAdd = rangeToAdd;
  let lastRange = ids[ids.length - 1];

  //Three cases: Goes at beginning, end, or somewhere in the middle
  if (ids[0].start > rangeToAdd.end) {
    newIds.push(getIdRangeToInsert(rangeToAdd.start, rangeToAdd.end));
    newIds = newIds.concat(ids);
  } else if (lastRange && lastRange.end < rangeToAdd.start) {
    insertIdAtIdx = ids.length;
    newIds = newIds.concat(ids);
    newIds.push(getIdRangeToInsert(rangeToAdd.start, rangeToAdd.end));
  } else {
    insertIdAtIdx = getIdxToInsertForNewId(rangeToAdd.start, ids); //Only lookup start since we assume the whole range isn't included already
    newIds = newIds.concat(ids.slice(0, insertIdAtIdx));
    newIds.push(getIdRangeToInsert(rangeToAdd.start, rangeToAdd.end));
    newIds = newIds.concat(ids.slice(insertIdAtIdx));
  }

  newIds = mergePrevOrNextIfPossible(newIds, insertIdAtIdx)

  return newIds;
}


/**
 * Checks if the provided id ranges overlap with each other.
 */
export function checkIfIdRangesOverlap(idRanges: IdRange[]) {
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
