import { b_IdRange } from "bitbadgesjs-proto";
import { METADATA_PAGE_LIMIT } from "./constants";
import { sortIdRangesAndMergeIfNecessary } from "./idRanges";
import { bigIntMin, getMetadataForBadgeId } from "./metadataMaps";
import { getMetadataIdForBadgeId } from "./metadataIds";
import { b_BitBadgesCollection } from "./types/collections";

/**
 * For a multicollection display, return the badges to be shown on a specific page.
 *
 * @param {{ collection: b_BitBadgesCollection, badgeIds: b_IdRange[] }[]} collectionObjectsToDisplay - The collections to display.
 * @param {bigint | string | number} _pageNumber - The page number of the display
 * @param {bigint | string | number} _pageSize - The page size of the display
 *
 * Assumes that badgeIds are sorted, merged, and non-overlapping.
 *
 * Return value is an array of { collection, badgeIds } objects.
 */
export function getBadgesToDisplay(
  collectionObjectsToDisplay: {
    collection: b_BitBadgesCollection,
    badgeIds: b_IdRange[]
  }[] = [],
  _pageNumber: bigint | string | number,
  _pageSize: bigint | string | number,
) {
  const pageNumber = BigInt(_pageNumber);
  const pageSize = BigInt(_pageSize);

  const startIdxNum = BigInt((pageNumber - 1n) * pageSize);
  const badgeIdsToDisplay: { collection: b_BitBadgesCollection, badgeIds: b_IdRange[] }[] = [];

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
        const badgeIdsToDisplayIds: b_IdRange[] = [];
        if (numEntriesLeftToHandle > 0) {
          const endBadgeId = bigIntMin(currBadgeId + numEntriesLeftToHandle - 1n, range.end);
          badgeIdsToDisplayIds.push({ start: currBadgeId, end: endBadgeId });
        }

        badgeIdsToDisplay.push({
          collection: collectionObj.collection,
          badgeIds: sortIdRangesAndMergeIfNecessary(badgeIdsToDisplayIds)
        });

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
 * @param {b_IdRange[]} _badgeIdsToDisplay - The badgeIds to display
 * @param {b_BitBadgesCollection} collection - The collection details
 */
export function getMetadataIdsToFetch(_badgeIdsToDisplay: b_IdRange[], collection: b_BitBadgesCollection) {
  const badgeIdsToDisplay = sortIdRangesAndMergeIfNecessary(_badgeIdsToDisplay);

  const metadataIds: bigint[] = [];
  const lastMetadataId = -1000000;
  for (let i = 0; i < badgeIdsToDisplay.length; i++) {
    for (let id = badgeIdsToDisplay[i].start; id <= badgeIdsToDisplay[i].end; id++) {
      if (!getMetadataForBadgeId(id, collection.badgeMetadata)) {
        const metadataId = getMetadataIdForBadgeId(id, collection.badgeUris);
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
