import { BadgeUri } from "bitbadgesjs-proto";
import { searchUintRangesForId } from "./uintRanges";
import { BitBadgeCollection } from "./types/api";

/**
 * This is the logic we use to deterministically compute the metadataId for a collection in our indexer.
 * This function returns the metadata ID for a specific badge ID. -1 if not found
 *
 * @example
 * Metadata ID 0 = collectionMetadata (reserved)
 * Metadata ID 1 = metadata ID for 1st badge(s)
 * Metadata ID 2 = metadata ID for 2nd badge(s)
 * And so on
 *
 * @param {bigint} badgeId - The badge ID to get the metadata ID for
 * @param {BadgeUri[]} badgeUris - The badge URIs for the collection
 *
 * @remarks
 * The metadataId for the metadata document is calculated deterministically from badgeUris field
 * metadataId == 0 - collection metadata
 * metadataId > 0 - badge metadata
 *
 * Pseudocode for calculating metadataId:
 * metadataId = 1
 * for each badgeUri in badgeUris: //Linear iteration
 *  if badgeUri.uri.contains("{id}"):
 *    for each id in badgeUri.badgeIds:
 *      fetch metadata from badgeUri.uri.replace("{id}", id)
 *      store metadata in database with metadataId = metadataId and badgeIds = [{start: id, end: id}]
 *  else:
 *   fetch metadata from badgeUri.uri
 *   store metadata in database with metadataId = metadataId and badgeIds = badgeUri.badgeIds
 *  metadataId++
*/
export const getMetadataIdForBadgeId = (badgeId: bigint, badgeUris: BadgeUri[]) => {
  let batchIdx = 1n;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {
      const [idx, found] = searchUintRangesForId(badgeId, badgeUri.badgeIds);
      if (found) {
        const badgeUintRange = badgeUri.badgeIds[idx];
        return batchIdx + badgeId - badgeUintRange.start;
      }

      for (const badgeUintRange of badgeUri.badgeIds) {
        batchIdx += badgeUintRange.end - badgeUintRange.start + 1n;
      }
    } else {
      const [_idx, found] = searchUintRangesForId(badgeId, badgeUri.badgeIds);
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
 *
 * @param {BitBadgeCollection} collection - The collection to get the max metadata ID for
*/
export function getMaxMetadataId(collection: BitBadgeCollection) {
  let metadataId = 1n; // Start at 1 because batch 0 is reserved for collection metadata

  for (const badgeUri of collection.badgeUris) {
    // If the URI contains {id}, each badge ID will belong to its own private batch
    if (badgeUri.uri.includes("{id}")) {
      for (const badgeUintRange of badgeUri.badgeIds) {
        metadataId += badgeUintRange.end - badgeUintRange.start + 1n;
      }
    } else {
      metadataId++;
    }
  }

  return metadataId;
}
