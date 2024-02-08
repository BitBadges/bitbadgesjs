import { BadgeMetadata, BigIntify, NumberType, UintRange, convertUintRange } from "bitbadgesjs-proto";
import { removeUintRangesFromUintRanges, searchUintRangesForId, sortUintRangesAndMergeIfNecessary } from "./uintRanges";
import { MetadataFetchOptions } from "./types/api";
import { BitBadgesCollection } from "./types/collections";
import { getCurrentValueForTimeline } from "./timelines";

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
 *
 * @category Metadata
*/
export const getMetadataIdForBadgeId = (badgeId: bigint, badgeUris: BadgeMetadata<bigint>[]) => {
  let batchIdx = 1n;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {
      const [idx, found] = searchUintRangesForId(badgeId, badgeUri.badgeIds);
      if (found) {
        const badgeUintRange = badgeUri.badgeIds[Number(idx)];
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
 * @category Metadata
 */
export const getMetadataIdsForUri = (uri: string, badgeUris: BadgeMetadata<bigint>[]) => {
  let batchIdx = 1n;
  const metadataIds: bigint[] = [];
  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {
      if (badgeUri.uri === uri) {
        metadataIds.push(batchIdx);
        continue
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

          for (const badgeUintRange of badgeUri.badgeIds) {
            if (num >= badgeUintRange.start && num <= badgeUintRange.end) {
              // return batchIdx + num - badgeUintRange.start;
              metadataIds.push(batchIdx + num - badgeUintRange.start);
            }

            batchIdx += badgeUintRange.end - badgeUintRange.start + 1n;
          }
        }
      } else {
        for (const badgeUintRange of badgeUri.badgeIds) {
          batchIdx += badgeUintRange.end - badgeUintRange.start + 1n;
        }
      }
    } else {
      if (badgeUri.uri === uri) {
        // return batchIdx;
        metadataIds.push(batchIdx);
      }
      batchIdx++;
    }
  }

  return metadataIds;
}

/**
 * This returns the max metadataId for a collection based on its badge metadata.
 *
 * @category Metadata
*/
export function getMaxMetadataId(badgeUris: BadgeMetadata<bigint>[]) {
  if (badgeUris.length === 0) {
    return 0n;
  }

  let metadataId = 0n; // Start at 1 because batch 0 is reserved for collection metadata

  for (const badgeUri of badgeUris) {
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

/**
 * @category Metadata
 */
export function getUrisForMetadataIds(metadataIds: bigint[], collectionUri: string, badgeUris: BadgeMetadata<bigint>[]) {
  let uris: string[] = [];
  if (metadataIds.find((id) => id === 0n)) {
    uris.push(collectionUri);
  }

  let batchIdx = 1n;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {
      for (const badgeUintRange of badgeUri.badgeIds) {
        const start = batchIdx;
        const end = batchIdx + badgeUintRange.end - badgeUintRange.start;
        for (const metadataId of metadataIds) {
          if (metadataId >= start && metadataId <= end) {
            uris.push(badgeUri.uri.replace("{id}", (metadataId - start + badgeUintRange.start).toString()));
          }
        }

        batchIdx += badgeUintRange.end - badgeUintRange.start + 1n;
      }
    } else {
      if (metadataIds.find((id) => id === batchIdx)) {
        uris.push(badgeUri.uri);
      }
      batchIdx++;
    }
  }

  return uris;
}

/**
 * @category Metadata
 */
export function getBadgeIdsForMetadataId(metadataId: bigint, badgeUris: BadgeMetadata<bigint>[]) {
  let batchIdx = 1n;

  for (const badgeUri of badgeUris) {
    if (badgeUri.uri.includes("{id}")) {

      for (const badgeUintRange of badgeUri.badgeIds) {
        const start = batchIdx;
        const end = batchIdx + badgeUintRange.end - badgeUintRange.start;
        if (metadataId >= start && metadataId <= end) {
          return [{ start: metadataId - start + badgeUintRange.start, end: metadataId - start + badgeUintRange.start }];
        }

        batchIdx += badgeUintRange.end - badgeUintRange.start + 1n;
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

function getCurrentMetadata(collection: BitBadgesCollection<bigint>) {
  const collectionMetadata = getCurrentValueForTimeline(collection.collectionMetadataTimeline)?.collectionMetadata;
  const badgeMetadata = getCurrentValueForTimeline(collection.badgeMetadataTimeline)?.badgeMetadata ?? []

  return {
    collectionMetadata,
    badgeMetadata
  };
}

/**
 * Prunes the metadata to fetch based on the cached collection and the metadata fetch request
 *
 * @category Metadata
 */
export const pruneMetadataToFetch = (cachedCollection: BitBadgesCollection<bigint>, metadataFetchReq?: MetadataFetchOptions) => {
  if (!cachedCollection) throw new Error('Collection does not exist');

  const metadataToFetch: Required<MetadataFetchOptions> = {
    doNotFetchCollectionMetadata: cachedCollection.cachedCollectionMetadata !== undefined || metadataFetchReq?.doNotFetchCollectionMetadata || false,
    uris: [],
    badgeIds: [],
    metadataIds: [],
  };

  if (metadataFetchReq) {
    const { collectionMetadata, badgeMetadata } = getCurrentMetadata(cachedCollection);

    //See if we already have the metadata corresponding to the uris
    if (metadataFetchReq.uris) {
      for (const uri of metadataFetchReq.uris) {
        if (!cachedCollection.cachedBadgeMetadata.find(x => x.uri === uri)) {
          metadataToFetch.uris.push(uri);
        }
      }
    }

    const metadataIdsToCheck: bigint[] = [];
    //See if we already have the metadata corresponding to the metadataIds
    if (metadataFetchReq.metadataIds) {
      for (const metadataId of metadataFetchReq.metadataIds) {
        const metadataIdCastedAsUintRange = metadataId as UintRange<NumberType>;
        const metadataIdCastedAsNumber = metadataId as NumberType;

        if (typeof metadataIdCastedAsNumber === 'object' && metadataIdCastedAsUintRange.start && metadataIdCastedAsUintRange.end) {
          //Is a UintRange, need to check start -> end metadata ID
          const uintRange = convertUintRange(metadataIdCastedAsUintRange, BigIntify);
          for (let i = uintRange.start; i <= uintRange.end; i++) {
            metadataIdsToCheck.push(BigInt(i));
          }
        } else {
          metadataIdsToCheck.push(BigInt(metadataIdCastedAsNumber));
        }
      }
    }

    //Check if we have all metadata corresponding to the badgeIds
    if (metadataFetchReq.badgeIds) {
      for (const badgeId of metadataFetchReq.badgeIds) {
        const badgeIdCastedAsUintRange = badgeId as UintRange<NumberType>;
        const badgeIdCastedAsNumber = badgeId as NumberType;

        if (typeof badgeIdCastedAsNumber === 'object' && badgeIdCastedAsUintRange.start && badgeIdCastedAsUintRange.end) {
          let badgeIdsLeft = [convertUintRange(badgeIdCastedAsUintRange, BigIntify)]

          //Intutition: check singular, starting badge ID. If it is same as others, handle all together. Else, just handle that and continue
          while (badgeIdsLeft.length > 0) {
            const currBadgeUintRange = badgeIdsLeft[0];

            const metadataId = getMetadataIdForBadgeId(BigInt(currBadgeUintRange.start), badgeMetadata);
            if (metadataId === -1) break

            metadataIdsToCheck.push(BigInt(metadataId));

            //Remove other badgeIds that map to the same metadataId and add any remaining back to the queue
            const otherMatchingBadgeUintRanges = getBadgeIdsForMetadataId(BigInt(metadataId), badgeMetadata);
            const [remaining,] = removeUintRangesFromUintRanges(otherMatchingBadgeUintRanges, badgeIdsLeft);
            badgeIdsLeft = remaining
            badgeIdsLeft = sortUintRangesAndMergeIfNecessary(badgeIdsLeft, true)
          }

        } else {
          //Is a singular badgeId
          const metadataId = getMetadataIdForBadgeId(BigInt(badgeIdCastedAsNumber), badgeMetadata);
          if (metadataId === -1) break
          metadataIdsToCheck.push(BigInt(metadataId));
        }
      }
    }

    //Check if we have the URIs yet in the cached metadata. If not, add to the list of URIs to fetch
    const uris = getUrisForMetadataIds(metadataIdsToCheck, collectionMetadata?.uri || '', badgeMetadata);
    for (const uri of uris) {
      const existingMetadata = cachedCollection.cachedBadgeMetadata.find(x => x.uri === uri);
      if (!existingMetadata) metadataToFetch.uris.push(uri);
    }
  }



  return {
    ...metadataToFetch,
    uris: metadataToFetch.uris ?? [],
  } as { doNotFetchCollectionMetadata: boolean, uris: string[] };
}
