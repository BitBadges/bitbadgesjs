import { BigIntify, IdRange } from "bitbadgesjs-proto";
import { insertRangeToIdRanges, removeIdsFromIdRange, searchIdRangesForId } from "./idRanges";
import { Metadata, convertMetadata } from "./types/metadata";
import { BadgeMetadataDetails } from "./types/collections";

/**
 * To keep track of metadata for badges and load it dynamically, we store it in an array: BadgeMetadataDetails<T>[].
 *
 * The values are { metadata, uri, badgeIds, metadataId } where this object represents the metadata fetched by a uri or metadataId
 * which correspond to the badgeIds.
 *
 * Keeping track of metadata in this way allows us to load metadata dynamically and only when needed.
 * However, it does get confusing when we need to update this array. This file contains the logic
 * for updating the metadata in an efficient way.
 *
 * updateBadgeMetadata - updates the metadata array to include the given metadata and badgeIds fetched from the given uri. Replaces existing metadata for badgeIds, if any.
 * getMetadataForBadgeId - returns just the metadata for a given badgeId
 * getMetadataddDetailsForBadgeId - returns the { metadata, uri, badgeIds, metadata } object for a given badgeId
 *
 * setMetadataPropertyForAll - sets a specific (key, value) pair for all metadata entries in the array
 */

/**
 * Removes the metadata from the BadgeMetadataDetails<bigint>[] for specific badgeIds.
 *
 * Note that this function does not mutate the metadataArr, but instead returns a new one.
 *
 * @param {BadgeMetadataDetails<bigint>[]} currBadgeMetadata - The current metadata array
 * @param {IdRange<bigint>[]} badgeIds - The badge IDs to remove the metadata for
 *
 * @returns {BadgeMetadataDetails<bigint>[]} - The new metadata array with the metadata removed
 */
export const removeBadgeMetadata = (currBadgeMetadata: BadgeMetadataDetails<bigint>[], badgeIds: IdRange<bigint>[]) => {
  const dummyMetadata = { name: "metadataToRemove", description: "metadataToRemove", image: "metadataToRemove" };
  const uniqueBadgeMetadataDetails = {
    metadata: convertMetadata(dummyMetadata, BigIntify),
    badgeIds,
  }
  const newBadgeMetadata = updateBadgeMetadata(currBadgeMetadata, uniqueBadgeMetadataDetails);

  return newBadgeMetadata.filter((val) => val && val.metadata.name !== "metadataToRemove");
}


/**
 * Update the metadataArr with the given metadata and badgeIds fetched from the given uri.
 *
 * Note that this function does not mutate the metadataArr, but instead returns a new one.
 *
 * @param {BadgeMetadataDetails<bigint>[]} currBadgeMetadata - The current metadata array
 * @param {Metadata<bigint>} metadata - The metadata to update the array with
 * @param {IdRange<bigint>} badgeIds - The badge IDs that correspond to the metadata
 * @param {string} uri - The URI that the metadata was fetched from
 */
export const updateBadgeMetadata = (currBadgeMetadata: BadgeMetadataDetails<bigint>[], newBadgeMetadataDetails: BadgeMetadataDetails<bigint>) => {
  let currentMetadata = newBadgeMetadataDetails.metadata;

  for (const badgeIdRange of newBadgeMetadataDetails.badgeIds) {
    const startBadgeId = badgeIdRange.start;
    const endBadgeId = badgeIdRange.end;

    //Remove the badge IDs that we are updating from the metadata array
    for (let i = 0; i < currBadgeMetadata.length; i++) {
      const val = currBadgeMetadata[i];
      if (!val) continue; //For TS

      for (let j = 0; j < val.badgeIds.length; j++) {
        val.badgeIds = [...val.badgeIds.slice(0, j), ...removeIdsFromIdRange({ start: startBadgeId, end: endBadgeId }, val.badgeIds[j]), ...val.badgeIds.slice(j + 1)]
      }
    }

    //If the metadata we are updating is already in the array (with matching uri and id), we can just insert the badge IDs
    let currBadgeMetadataExists = false;
    for (let i = 0; i < currBadgeMetadata.length; i++) {
      const val = currBadgeMetadata[i];
      if (!val) continue; //For TS

      if (JSON.stringify(val.metadata) === JSON.stringify(currentMetadata) && val.uri === newBadgeMetadataDetails.uri && val.metadataId === newBadgeMetadataDetails.metadataId) {
        currBadgeMetadataExists = true;
        val.badgeIds = val.badgeIds.length > 0 ? insertRangeToIdRanges({ start: startBadgeId, end: endBadgeId }, val.badgeIds) : [{ start: startBadgeId, end: endBadgeId }];
      }
    }

    //Recreate the array with the updated badge IDs
    //If some metadata object no longer has any corresponding badge IDs, we can remove it from the array
    currBadgeMetadata = currBadgeMetadata.filter((val) => val && val.badgeIds.length > 0);

    //If we did not find the metadata in the array and metadata !== undefined, we need to add it
    if (!currBadgeMetadataExists) {
      currBadgeMetadata.push({
        metadata: { ...currentMetadata },
        badgeIds: [{
          start: startBadgeId,
          end: endBadgeId,
        }],
        uri: newBadgeMetadataDetails.uri,
        metadataId: newBadgeMetadataDetails.metadataId,
      })
    }
  }

  return currBadgeMetadata;
}


/**
 * Returns the { metadata, uri, badgeIds } metadata object from the BadgeMetadataDetails<bigint>[] for a specific badgeId.
 *
 * If the badgeId does not exist in the BadgeMetadataDetails<bigint>[], returns undefined.
 *
 * @param {bigint} badgeId - The badge ID to search for
 * @param {BadgeMetadataDetails<bigint>[]} metadataArr - The metadata array to search in
 *
 * @returns {MetadataddDetails | undefined} - The metadata object for the badgeId, or undefined if it does not exist
 */
export function getMetadataDetailsForBadgeId(badgeId: bigint, metadataArr: BadgeMetadataDetails<bigint>[]) {
  let currentMetadata = undefined;
  for (const val of Object.values(metadataArr)) {
    if (!val) continue; //For TS

    const [_idx, found] = searchIdRangesForId(badgeId, val.badgeIds)
    if (found) {
      return val;
    }
  }

  return currentMetadata;
}

/**
 * Returns the metadata from the BadgeMetadataDetails<bigint>[] for a specific badgeId.
 *
 * If the badgeId does not exist in the BadgeMetadataDetails<bigint>[], returns undefined.
 *
 * @param {bigint} badgeId - The badge ID to search for
 * @param {BadgeMetadataDetails<bigint>[]} metadataArr - The metadata array to search in
 *
 * @returns {Metadata<bigint> | undefined} - The metadata for the badgeId, or undefined if it does not exist
 */
export function getMetadataForBadgeId(badgeId: bigint, metadataArr: BadgeMetadataDetails<bigint>[]) {
  return getMetadataDetailsForBadgeId(badgeId, metadataArr)?.metadata;
}

export function bigIntMin(a: bigint, b: bigint): bigint {
  return a > b ? b : a;
}


/**
 * For each badgeId in badgeIds, populates the metadata array with the given key, value JSON property pair.
 *
 * If you want to update the entire metadata (not just a specific key value pair), use updateBadgeMetadata instead.
 *
 * This is typically used when customizing or creating a badge.
 *
 * @example
 * Use this function to set the "name" property of all badges to "test" via setMetadataPropertyForAll(metadataArr, badgeIds, uri, "name", "test")
 *
 * @param {BadgeMetadataDetails<bigint>[]} metadataArr - The metadata array to update
 * @param {IdRange<bigint>[]} badgeIds - The badge IDs to update
 * @param {string} key - The key to update
 * @param {any} value - The value to update
 */
export const setMetadataPropertyForSpecificBadgeIds = (metadataArr: BadgeMetadataDetails<bigint>[], badgeIds: IdRange<bigint>[], key: string, value: any) => {
  for (const badgeIdRange of badgeIds) {
    //We are updating a specific key value pair for each
    for (let id = badgeIdRange.start; id <= badgeIdRange.end; id++) {
      let newMetadata = {} as Metadata<bigint>;
      let uri = undefined;
      let metadataId = undefined;
      const values = Object.values(metadataArr);
      const idRangeToUpdate = { start: id, end: id };

      for (let i = 0; i < values.length; i++) {
        const val = values[i];
        if (!val) continue; //For TS

        //Find the idx where id is in the badgeIds array
        const [idx, found] = searchIdRangesForId(id, val.badgeIds)
        if (found) {
          //If multiple sequential badge IDs have the same metadata and are in the ranges we want to update,
          //we can batch update all these together
          const foundIdRange = val.badgeIds[idx];
          const endIdToUpdate = bigIntMin(foundIdRange.end, badgeIdRange.end);
          idRangeToUpdate.end = endIdToUpdate;

          id = endIdToUpdate; //Set id to the end of the range we are updating so we can skip to the next range (will be incremented by 1 at the end of the loop)

          newMetadata = { ...val.metadata, [key]: value };
          uri = val.uri;
          metadataId = val.metadataId;
          break;
        }
      }

      metadataArr = updateBadgeMetadata(metadataArr, {
        metadata: newMetadata,
        badgeIds: [idRangeToUpdate],
        uri,
        metadataId,
      });
    }
  }

  return metadataArr;
}
