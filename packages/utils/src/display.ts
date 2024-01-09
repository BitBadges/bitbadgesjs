import { BadgeMetadata, UintRange } from "bitbadgesjs-proto";
import { bigIntMin, getMetadataForBadgeId } from "./badgeMetadata";
import { METADATA_PAGE_LIMIT } from "./constants";
import { getMetadataIdForBadgeId } from "./metadataIds";
import { BadgeMetadataDetails } from "./types/collections";
import { sortUintRangesAndMergeIfNecessary } from "./uintRanges";
import { BatchBadgeDetails } from "./batch-utils";

/**
 * For a multicollection display, return the badges to be shown on a specific page.
 *
 * @param {{ collection: bigint, badgeIds: UintRange<bigint>[] }[]} collectionObjectsToDisplay - The collections to display.
 * @param {number} _pageNumber - The page number of the display
 * @param {number} _pageSize - The page size of the display
 *
 * Assumes that badgeIds are sorted, merged, and non-overlapping.
 *
 * Return value is an array of { collection, badgeIds } objects.
 */
export function getBadgesToDisplay(
  collectionObjectsToDisplay: BatchBadgeDetails<bigint>[] = [],
  _pageNumber: number,
  _pageSize: number,
  sortBy?: 'newest' | 'oldest' | undefined
): BatchBadgeDetails<bigint>[] {
  const pageNumber = BigInt(_pageNumber);
  const pageSize = BigInt(_pageSize);

  if (sortBy === 'newest') {
    const totalNumPages = Math.ceil(Number(collectionObjectsToDisplay.reduce((acc, curr) => {
      const numBadges = curr.badgeIds.reduce((acc, curr) => acc + (curr.end - curr.start + 1n), 0n);
      return acc + numBadges;
    }, 0n)) / _pageSize);

    return getBadgesToDisplay(collectionObjectsToDisplay, Number(totalNumPages - _pageNumber + 1), _pageSize, undefined);
  }

  const startIdxNum = BigInt((pageNumber - 1n) * pageSize);
  const badgeIdsToDisplay: BatchBadgeDetails<bigint>[] = [];

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
        const badgeIdsToDisplayIds: UintRange<bigint>[] = [];
        if (numEntriesLeftToHandle > 0) {
          const endBadgeId = bigIntMin(currBadgeId + numEntriesLeftToHandle - 1n, range.end);
          if (currBadgeId <= endBadgeId) {
            badgeIdsToDisplayIds.push({ start: currBadgeId, end: endBadgeId });
          }
        }

        const badgeIdsToAdd = sortUintRangesAndMergeIfNecessary(badgeIdsToDisplayIds, true)

        badgeIdsToDisplay.push({
          collectionId: collectionObj.collectionId,
          badgeIds: badgeIdsToAdd
        });

        const numBadgesAdded = badgeIdsToAdd.reduce((acc, curr) => acc + (curr.end - curr.start + 1n), 0n);

        numEntriesLeftToHandle -= numBadgesAdded;

        if (numEntriesLeftToHandle <= 0) break;
      }

      currIdx += numBadgesInRange;
    }
  }

  return badgeIdsToDisplay;
}

/**
 * Returns an array of metadataIds that we need to fetch from the indexer.
 *
 * The indexer handles metadata in batches of METADATA_PAGE_LIMIT = 100 documents at a time,
 * so this will return an array of metadataIds that we need to fetch.
 *
 * Note: By default, we batch update metadata for METADATA_PAGE_LIMIT badges at a time (i.e. metadataId + METADATA_PAGE_LIMIT)
 * The return value of this function is an array of starting metadataIds only.
 * For example, if we need to fetch metadata for badges 0-99, 200-299, 400-499, ...
 * then this function will return [0, 200, 400, ...].
 *
 * Assumes that badgeIdsToDisplay has no overlapping ranges.
 *
 * @param {UintRange<bigint>[]} _badgeIdsToDisplay - The badgeIds to display
 * @param {BadgeMetadataDetails<bigint>[]} currBadgeMetadataMap - The current badge metadata map that has been fetched
 * @param {BadgeMetadata<bigint>[]} badgeMetadata - The badge metadata of the collection
 */
export function getMetadataIdsToFetch(_badgeIdsToDisplay: UintRange<bigint>[], currBadgeMetadataMap: BadgeMetadataDetails<bigint>[], badgeMetadata: BadgeMetadata<bigint>[]) {
  const badgeIdsToDisplay = sortUintRangesAndMergeIfNecessary(_badgeIdsToDisplay, true);

  const metadataIds: bigint[] = [];
  const lastMetadataId = -1000000;
  for (let i = 0; i < badgeIdsToDisplay.length; i++) {
    for (let id = badgeIdsToDisplay[i].start; id <= badgeIdsToDisplay[i].end; id++) {
      if (!getMetadataForBadgeId(id, currBadgeMetadataMap)) {
        const metadataId = getMetadataIdForBadgeId(id, badgeMetadata);
        if (metadataId !== -1) {
          // If we have a gap of more than METADATA_PAGE_LIMIT, then we fetch a new batch starting at this metadataId
          if (lastMetadataId + METADATA_PAGE_LIMIT <= metadataId) {
            metadataIds.push(metadataId);
            id += BigInt(METADATA_PAGE_LIMIT) - 1n;
          }
        }
      }
    }
  }

  return metadataIds;
}
