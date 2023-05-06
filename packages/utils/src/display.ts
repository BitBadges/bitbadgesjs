import { IdRange } from "bitbadgesjs-proto";
import { METADATA_PAGE_LIMIT } from "./constants";
import { sortIdRangesAndMergeIfNecessary } from "./idRanges";
import { getMetadataForBadgeId } from "./metadataMaps";
import { getMetadataIdForBadgeId } from "./metadataIds";
import { BitBadgeCollection } from "./types/api";

/**
 * For a collection display, returns an array of length == pageSize denoting
 * the badgeIds that are to be shown on that page.
 *
 * Assumes that badgeIds are sorted, merged, and non-overlapping.
 *
 * Return value is an array of { collection, badgeIds } objects.
 */
export function getBadgeIdsToDisplay(
  collectionObjectsToDisplay: {
    collection: BitBadgeCollection,
    badgeIds: IdRange[]
  }[] = [],
  pageNumber: number,
  pageSize: number
) {
  const startIdxNum = (pageNumber - 1) * pageSize;
  const badgeIdsToDisplay: { collection: BitBadgeCollection, badgeIds: IdRange[] }[] = [];

  let currIdx = 0;
  let numEntriesLeftToHandle = pageSize;

  for (const collectionObj of collectionObjectsToDisplay) {
    for (const range of collectionObj.badgeIds) {
      const numBadgesInRange = Number(range.end) - Number(range.start) + 1;

      // If we have reached the start of the page, handle this range
      if (currIdx + numBadgesInRange >= startIdxNum) {
        //Find badge ID to start at
        let currBadgeId = Number(range.start);
        if (currIdx < startIdxNum) {
          currBadgeId = Number(range.start) + (startIdxNum - currIdx);
        }

        //Iterate through the range and add badgeIds to the array, until we have added enough
        const badgeIdsToDisplayIds: IdRange[] = [];
        if (numEntriesLeftToHandle > 0) {
          const endBadgeId = Math.min(currBadgeId + numEntriesLeftToHandle - 1, Number(range.end));
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
 */
export function getMetadataIdsToFetch(_badgeIdsToDisplay: IdRange[], collection: BitBadgeCollection) {
  const badgeIdsToDisplay = sortIdRangesAndMergeIfNecessary(_badgeIdsToDisplay);

  const metadataIds: number[] = [];
  const lastMetadataId = -1000000;
  for (let i = 0; i < badgeIdsToDisplay.length; i++) {
    for (let id = badgeIdsToDisplay[i].start; id <= badgeIdsToDisplay[i].end; id++) {
      if (!getMetadataForBadgeId(id, collection.badgeMetadata)) {
        const metadataId = getMetadataIdForBadgeId(id, collection.badgeUris);
        if (metadataId !== -1) {
          // If we have a gap of more than METADATA_PAGE_LIMIT, then we fetch a new batch starting at this metadataId
          if (lastMetadataId + METADATA_PAGE_LIMIT <= metadataId) {
            metadataIds.push(metadataId);
            id += METADATA_PAGE_LIMIT - 1;
          }
        }
      }
    }
  }

  return metadataIds;
}
