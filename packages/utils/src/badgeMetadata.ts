import { BigIntify, UintRange, deepCopy } from "bitbadgesjs-proto";
import { BadgeMetadataDetails } from "./types/collections";
import { Metadata, convertMetadata } from "./types/metadata";
import { removeUintRangeFromUintRange, searchUintRangesForId, sortUintRangesAndMergeIfNecessary } from "./uintRanges";
import { SHA256 } from "crypto-js";
import { compareObjects } from "./utils/compare";

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
 *
 * @category Metadata
 */

/**
 * Removes the metadata from the BadgeMetadataDetails<bigint>[] for specific badgeIds.
 *
 * Note that this function does not mutate the metadataArr, but instead returns a new one.
 *
 * @param {BadgeMetadataDetails<bigint>[]} currBadgeMetadata - The current metadata array
 * @param {UintRange<bigint>[]} badgeIds - The badge IDs to remove the metadata for
 *
 * @returns {BadgeMetadataDetails<bigint>[]} - The new metadata array with the metadata removed
 *
 * @category Metadata
 */
export const removeBadgeMetadata = (currBadgeMetadata: BadgeMetadataDetails<bigint>[], badgeIds: UintRange<bigint>[]) => {
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
 * @param {UintRange<bigint>} badgeIds - The badge IDs that correspond to the metadata
 * @param {string} uri - The URI that the metadata was fetched from
 *
 *
 * @category Metadata
 */
export const updateBadgeMetadata = (currBadgeMetadata: BadgeMetadataDetails<bigint>[], newBadgeMetadataDetails: BadgeMetadataDetails<bigint>) => {
  return batchUpdateBadgeMetadata(currBadgeMetadata, [newBadgeMetadataDetails]);
}

/**
 * Batch update the metadataArr with the given metadata and badgeIds fetched from the given uri.
 *
 * @category Metadata
 */
export const batchUpdateBadgeMetadata = (currBadgeMetadata: BadgeMetadataDetails<bigint>[], newBadgeMetadataDetailsArr: BadgeMetadataDetails<bigint>[]) => {


  const allBadgeIds = sortUintRangesAndMergeIfNecessary(deepCopy(newBadgeMetadataDetailsArr.map(x => x.badgeIds).flat()), true);
  for (let i = 0; i < currBadgeMetadata.length; i++) {
    const val = currBadgeMetadata[i];
    if (!val) continue; //For TS

    const [remaining, _] = removeUintRangeFromUintRange(allBadgeIds, val.badgeIds);
    val.badgeIds = remaining;
  }

  currBadgeMetadata = currBadgeMetadata.filter((val) => val && val.badgeIds.length > 0);


  const hashTable = new Map<string, number>();
  for (let i = 0; i < currBadgeMetadata.length; i++) {
    const metadataDetails = currBadgeMetadata[i];
    const hashedMetadata = SHA256(JSON.stringify(metadataDetails.metadata)).toString();
    hashTable.set(hashedMetadata, i);
  }

  for (const newBadgeMetadataDetails of newBadgeMetadataDetailsArr) {
    let currentMetadata = newBadgeMetadataDetails.metadata;
    for (const badgeUintRange of newBadgeMetadataDetails.badgeIds) {
      const startBadgeId = badgeUintRange.start;
      const endBadgeId = badgeUintRange.end;

      //If the metadata we are updating is already in the array (with matching uri and id), we can just insert the badge IDs
      let currBadgeMetadataExists = false;
      const idx = hashTable.get(SHA256(JSON.stringify(currentMetadata)).toString());
      if (idx) {
        const val = currBadgeMetadata[idx];
        if (!val) continue; //For TS

        if (val.uri === newBadgeMetadataDetails.uri && val.metadataId === newBadgeMetadataDetails.metadataId && val.customData === newBadgeMetadataDetails.customData && val.toUpdate === newBadgeMetadataDetails.toUpdate && compareObjects(val.metadata, currentMetadata)) {
          currBadgeMetadataExists = true;
          if (val.badgeIds.length > 0) {
            val.badgeIds = [...val.badgeIds, { start: startBadgeId, end: endBadgeId }];
            val.badgeIds = sortUintRangesAndMergeIfNecessary(val.badgeIds, true)
          } else {
            val.badgeIds = [{ start: startBadgeId, end: endBadgeId }];
          }
        }
      }

      //Recreate the array with the updated badge IDs
      //If some metadata object no longer has any corresponding badge IDs, we can remove it from the array

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
          customData: newBadgeMetadataDetails.customData,
          toUpdate: newBadgeMetadataDetails.toUpdate,
        })

        const hashedMetadata = SHA256(JSON.stringify(newBadgeMetadataDetails.metadata)).toString();
        hashTable.set(hashedMetadata, currBadgeMetadata.length - 1);
      }
    }
  }

  currBadgeMetadata = currBadgeMetadata.filter((val) => val && val.badgeIds.length > 0);
  return currBadgeMetadata;
}


/**
 * Returns the { metadata, uri, badgeIds, customData } metadata object from the BadgeMetadataDetails<bigint>[] for a specific badgeId.
 *
 * If the badgeId does not exist in the BadgeMetadataDetails<bigint>[], returns undefined.
 *
 * @param {bigint} badgeId - The badge ID to search for
 * @param {BadgeMetadataDetails<bigint>[]} metadataArr - The metadata array to search in
 *
 * @returns {MetadataddDetails | undefined} - The metadata object for the badgeId, or undefined if it does not exist
 *
 * @category Metadata
 */
export function getMetadataDetailsForBadgeId(badgeId: bigint, metadataArr: BadgeMetadataDetails<bigint>[]) {
  let currentMetadata = undefined;
  for (const val of Object.values(metadataArr)) {
    if (!val) continue; //For TS

    const [_idx, found] = searchUintRangesForId(badgeId, val.badgeIds)
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
 *
 * @category Metadata
 */
export function getMetadataForBadgeId(badgeId: bigint, metadataArr: BadgeMetadataDetails<bigint>[]) {
  return getMetadataDetailsForBadgeId(badgeId, metadataArr)?.metadata;
}

export function bigIntMin(a: bigint, b: bigint): bigint {
  return a > b ? b : a;
}

export function bigIntMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
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
 * @param {UintRange<bigint>[]} badgeIds - The badge IDs to update
 * @param {string} key - The key to update
 * @param {any} value - The value to update
 *
 * @category Metadata
 */
export const setMetadataPropertyForSpecificBadgeIds = (metadataArr: BadgeMetadataDetails<bigint>[], badgeIds: UintRange<bigint>[], key: string, value: any) => {
  const toUpdateDetails = [];
  for (const badgeUintRange of badgeIds) {
    //We are updating a specific key value pair for each
    for (let id = badgeUintRange.start; id <= badgeUintRange.end; id++) {
      let newMetadata = {} as Metadata<bigint>;
      let uri = undefined;
      let metadataId = undefined;
      let customData = undefined;
      const UintRangeToUpdate = { start: id, end: id };

      for (let i = 0; i < metadataArr.length; i++) {
        const val = metadataArr[i];
        if (!val) continue; //For TS

        //Find the idx where id is in the badgeIds array
        const [idx, found] = searchUintRangesForId(id, val.badgeIds)
        if (found) {
          //If multiple sequential badge IDs have the same metadata and are in the ranges we want to update,
          //we can batch update all these together
          const foundUintRange = val.badgeIds[Number(idx)];
          const endIdToUpdate = bigIntMin(foundUintRange.end, badgeUintRange.end);
          UintRangeToUpdate.end = endIdToUpdate;

          id = endIdToUpdate; //Set id to the end of the range we are updating so we can skip to the next range (will be incremented by 1 at the end of the loop)

          newMetadata = { ...val.metadata, [key]: value };
          uri = val.uri;
          metadataId = val.metadataId;
          customData = val.customData;
          break;
        }
      }
      // console.log(metadataArr);
      toUpdateDetails.push({
        metadata: newMetadata,
        badgeIds: [UintRangeToUpdate],
        uri,
        metadataId,
        customData,
        toUpdate: true,
      });
    }
  }
  metadataArr = batchUpdateBadgeMetadata(metadataArr, toUpdateDetails);

  return metadataArr;
}
