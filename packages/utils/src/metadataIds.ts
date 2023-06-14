import { BadgeUri } from "bitbadgesjs-proto";
import { searchIdRangesForId } from "./idRanges";
import { BitBadgesCollection } from "./types/collections";
import { CollectionDoc } from "./types/db";

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
 * @param {BadgeUri<bigint>[]} badgeUris - The badge URIs for the collection
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
export const getMetadataIdForBadgeId = (badgeId: bigint, badgeUris: BadgeUri<bigint>[]) => {
  let batchIdx = 1n;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {
      const [idx, found] = searchIdRangesForId(badgeId, badgeUri.badgeIds);
      if (found) {
        const badgeIdRange = badgeUri.badgeIds[idx];
        return batchIdx + badgeId - badgeIdRange.start;
      }

      for (const badgeIdRange of badgeUri.badgeIds) {
        batchIdx += badgeIdRange.end - badgeIdRange.start + 1n;
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

export const getMetadataIdForUri = (uri: string, badgeUris: BadgeUri<bigint>[]) => {
  let batchIdx = 1n;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {
      if (badgeUri.uri === uri) {
        return batchIdx;
      }

      //Check if uri has a number value that replaces {id}

      //Check if everythin up to {id} is the same
      const uriPrefix = badgeUri.uri.split("{id}")[0];
      const numSubstringIdxStart = uriPrefix.length;
      if (uri.startsWith(uriPrefix)) {
        //Check if everything after {id} is the same
        const uriSuffix = badgeUri.uri.split("{id}")[1];
        const numSubstringIdxEnd = uri.length - uriSuffix.length;
        if (uri.endsWith(uriSuffix)) {
          //Check if the number value is within the range of badgeIds
          const numSubstring = uri.substring(numSubstringIdxStart, numSubstringIdxEnd);
          const num = BigInt(numSubstring);

          for (const badgeIdRange of badgeUri.badgeIds) {
            if (num >= badgeIdRange.start && num <= badgeIdRange.end) {
              return batchIdx + num - badgeIdRange.start;
            }

            batchIdx += badgeIdRange.end - badgeIdRange.start + 1n;
          }
        }
      } else {
        for (const badgeIdRange of badgeUri.badgeIds) {
          batchIdx += badgeIdRange.end - badgeIdRange.start + 1n;
        }
      }
    } else {
      if (badgeUri.uri === uri) {
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
 * @param {BitBadgesCollection<bigint>} collection - The collection to get the max metadata ID for
*/
export function getMaxMetadataId(collection: BitBadgesCollection<bigint> | CollectionDoc<bigint>) {
  let metadataId = 1n; // Start at 1 because batch 0 is reserved for collection metadata

  for (const badgeUri of collection.badgeUris) {
    // If the URI contains {id}, each badge ID will belong to its own private batch
    if (badgeUri.uri.includes("{id}")) {
      for (const badgeIdRange of badgeUri.badgeIds) {
        metadataId += badgeIdRange.end - badgeIdRange.start + 1n;
      }
    } else {
      metadataId++;
    }
  }

  return metadataId;
}


export function getUrisForMetadataIds(metadataIds: bigint[], collectionUri: string, badgeUris: BadgeUri<bigint>[]) {
  let uris: string[] = [];
  if (metadataIds.find((id) => id === 0n)) {
    uris.push(collectionUri);
  }

  let batchIdx = 1n;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {
      for (const badgeIdRange of badgeUri.badgeIds) {
        const start = batchIdx;
        const end = batchIdx + badgeIdRange.end - badgeIdRange.start;
        for (const metadataId of metadataIds) {
          if (metadataId >= start && metadataId <= end) {
            uris.push(badgeUri.uri.replace("{id}", (metadataId - start + badgeIdRange.start).toString()));
          }
        }

        batchIdx += badgeIdRange.end - badgeIdRange.start + 1n;
      }
    } else {
      uris.push(badgeUri.uri);
      batchIdx++;
    }
  }

  return uris;
}

export function getBadgeIdsForMetadataId(metadataId: bigint, badgeUris: BadgeUri<bigint>[]) {
  let batchIdx = 1n;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {

      for (const badgeIdRange of badgeUri.badgeIds) {
        const start = batchIdx;
        const end = batchIdx + badgeIdRange.end - badgeIdRange.start;
        if (metadataId >= start && metadataId <= end) {
          return [{ start: metadataId - start + badgeIdRange.start, end: metadataId - start + badgeIdRange.start }];
        }

        batchIdx += badgeIdRange.end - badgeIdRange.start + 1n;
      }
    } else {
      if (metadataId === batchIdx) {
        return badgeUri.badgeIds;
      }
      batchIdx++;
    }
  }

  return [];
}
