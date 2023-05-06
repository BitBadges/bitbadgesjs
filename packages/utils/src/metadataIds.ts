import { BadgeUri } from "bitbadgesjs-proto";
import { searchIdRangesForId } from "./idRanges";
import { BitBadgeCollection } from "./types/api";

/**
 * This is the logic we use to deterministically compute the metadataId for a collection in our indexer.
 *
 * We linearly iterate over BadgeUris which is a list of { uri, badgeIds } objects.
 *
 * If uri has "{id}" in it, we store each badge ID in badgeIds with its own unique metadataId and replace "{id}"" with the badge ID.
 * For example, { uri : "...{id}..", badgeIds: [{start: 1, end: 3}, {start: 5, end: 5}] } will be given four separate metadataIds.
 *
 * If uri does not have "{id}" in it, we store all badge IDs in badgeIds with the same metadataId.
 *
 * Batch 0 = collectionMetadata
 * Batch 1 = metadata for 1st badge(s)
 * Batch 2 = metadata for 2nd badge(s)
 * And so on
 *
 * This function returns the metadata ID for a specific badge ID. -1 if not found
*/
export const getMetadataIdForBadgeId = (badgeId: number, badgeUris: BadgeUri[]) => {
  let batchIdx = 1;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {
      const [idx, found] = searchIdRangesForId(badgeId, badgeUri.badgeIds);
      if (found) {
        const badgeIdRange = badgeUri.badgeIds[idx];
        return batchIdx + badgeId - Number(badgeIdRange.start);
      }

      for (const badgeIdRange of badgeUri.badgeIds) {
        batchIdx += Number(badgeIdRange.end) - Number(badgeIdRange.start) + 1;
      }
    } else {
      const [_idx, found] = searchIdRangesForId(badgeId, badgeUri.badgeIds);
      if (found) {
        return batchIdx;
      }
      batchIdx++;
    }
  }

  return -1;
}

/**
 * This returns the max metadataId for a collection
*/
export function getMaxMetadataId(collection: BitBadgeCollection) {
  let metadataId = 1; // Start at 1 because batch 0 is reserved for collection metadata

  for (const badgeUri of collection.badgeUris) {
    // If the URI contains {id}, each badge ID will belong to its own private batch
    if (badgeUri.uri.includes("{id}")) {
      for (const badgeIdRange of badgeUri.badgeIds) {
        metadataId += Number(badgeIdRange.end) - Number(badgeIdRange.start) + 1;
      }
    } else {
      metadataId++;
    }
  }

  return metadataId;
}
