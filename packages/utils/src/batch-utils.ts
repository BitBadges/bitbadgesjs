import { UintRange } from "bitbadgesjs-proto";
import { removeUintRangesFromUintRanges, sortUintRangesAndMergeIfNecessary } from "./uintRanges";
import { NumberType } from "./types/string-numbers";

export interface BatchBadgeDetails<T extends NumberType> {
  collectionId: T
  badgeIds: UintRange<T>[]
}

export const noneInBatchArray = (arr: BatchBadgeDetails<bigint>[], badgeIdObj: BatchBadgeDetails<bigint>) => {
  const matchingElem = arr.find(x => x.collectionId === badgeIdObj.collectionId);
  if (!matchingElem) return true;

  const [_, removed] = removeUintRangesFromUintRanges(matchingElem.badgeIds, badgeIdObj.badgeIds);
  return removed.length == 0
}


export const allInBatchArray = (arr: BatchBadgeDetails<bigint>[], badgeIdObj: BatchBadgeDetails<bigint>) => {
  const matchingElem = arr.find(x => x.collectionId === badgeIdObj.collectionId);
  if (!matchingElem) return false;

  const [remaining] = removeUintRangesFromUintRanges(matchingElem.badgeIds, badgeIdObj.badgeIds);
  return remaining.length == 0
}

export const addToBatchArray = (
  arr: BatchBadgeDetails<bigint>[],
  badgeIdObjsToAdd: BatchBadgeDetails<bigint>[]
) => {
  for (const badgeIdObj of badgeIdObjsToAdd) {
    const badgeIdsToAdd = badgeIdObj.badgeIds
    const existingIdx = arr.findIndex(
      (x) => x.collectionId == badgeIdObj.collectionId
    )
    if (existingIdx != -1) {
      arr[existingIdx].badgeIds = sortUintRangesAndMergeIfNecessary(
        [...arr[existingIdx].badgeIds, ...badgeIdsToAdd],
        true
      )
    } else {
      arr.push({
        collectionId: badgeIdObj.collectionId,
        badgeIds: badgeIdsToAdd,
      })
    }
  }

  return arr.filter((x) => x.badgeIds.length > 0)
}

export const removeFromBatchArray = (
  arr: BatchBadgeDetails<bigint>[],
  badgeIdObjsToRemove: BatchBadgeDetails<bigint>[]
) => {
  for (const badgeIdObj of badgeIdObjsToRemove) {
    const badgeIdsToRemove = badgeIdObj.badgeIds

    const existingIdx = arr.findIndex(
      (x) => x.collectionId == badgeIdObj.collectionId
    )
    if (existingIdx != -1) {
      const [remaining] = removeUintRangesFromUintRanges(
        badgeIdsToRemove,
        arr[existingIdx].badgeIds
      )
      arr[existingIdx].badgeIds = remaining
    }
  }

  return arr.filter((x) => x.badgeIds.length > 0)
}
