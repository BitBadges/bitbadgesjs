import { UintRange } from "bitbadgesjs-proto";
import { insertRangeToUintRanges, removeIdsFromUintRange, searchUintRangesForId } from "./uintRanges";
import { Metadata } from "./types/metadata";
import { MetadataMap } from "./types/types";

/**
 * To keep track of metadata for badges and load it dynamically, we store it in a map: MetadataMap.
 *
 * The keys are the metadataId (see metadataIds for how these are calculated).
 * The values are { metadata, uri, badgeIds } where this object represents the metadata fetched by a uri
 * which correspond to the badgeIds.
 *
 * Keeping track of metadata in this way allows us to load metadata dynamically and only when needed.
 * However, it does get confusing when we need to update the metadata map. This file contains the logic
 * for updating the metadata map in an efficient way.
 *
 * updateMetadataMap - updates the metadata map with the given metadata and badgeIds fetched from the given uri. Replaces existing metadata for badgeIds, if any.
 * getMetadataForBadgeId - returns the metadata for a given badgeId
 * getMetadataMapObjForBadgeId - returns the { metadata, uri, badgeIds } object for a given badgeId
 *
 * setMetadataPropertyForAllMapEntries - sets a specific (key, value) pair for all metadata entries in the metadata map
 */



/**
 * Update the metadataMap with the given metadata and badgeIds fetched from the given uri.
 *
 * Note that this function does not mutate the metadataMap, but instead returns a new one.
 *
 * @param {MetadataMap} currMetadataMap - The current metadata map
 * @param {Metadata} metadata - The metadata to update the map with
 * @param {UintRange} badgeIds - The badge IDs that correspond to the metadata
 * @param {string} uri - The URI that the metadata was fetched from
 */
export const updateMetadataMap = (currMetadataMap: MetadataMap, metadata: Metadata, badgeIds: UintRange, uri: string) => {
  let currentMetadata = metadata;

  let keys = Object.keys(currMetadataMap);
  let values = Object.values(currMetadataMap);

  const startBadgeId = badgeIds.start;
  const endBadgeId = badgeIds.end;

  //Remove the badge IDs from the metadata map that we are updating
  for (let i = 0; i < keys.length; i++) {
    const val = values[i];
    if (!val) continue; //For TS

    for (let j = 0; j < val.badgeIds.length; j++) {
      val.badgeIds = [...val.badgeIds.slice(0, j), ...removeIdsFromUintRange({ start: startBadgeId, end: endBadgeId }, val.badgeIds[j]), ...val.badgeIds.slice(j + 1)]
    }
  }

  //If the metadata we are updating is already in the map, we can just insert the badge IDs
  let currMetadataMapExists = false;
  for (let i = 0; i < keys.length; i++) {
    const val = values[i];
    if (!val) continue; //For TS

    if (JSON.stringify(val.metadata) === JSON.stringify(currentMetadata)) {
      currMetadataMapExists = true;
      val.badgeIds = val.badgeIds.length > 0 ? insertRangeToUintRanges({ start: startBadgeId, end: endBadgeId }, val.badgeIds) : [{ start: startBadgeId, end: endBadgeId }];
    }
  }

  //Recreate the map with the updated badge IDs
  //If some metadata no longer has any badge IDs, we can remove it from the map
  let currIdx = 0;
  currMetadataMap = {};
  for (let i = 0; i < keys.length; i++) {
    const val = values[i];
    if (!val || val.badgeIds.length === 0) {
      continue;
    }
    currMetadataMap[currIdx] = values[i];
    currIdx++;
  }

  //If the metadata we are updating is not in the map, we can append it to the end of the map
  if (!currMetadataMapExists) {
    currMetadataMap[Object.keys(currMetadataMap).length] = {
      metadata: { ...currentMetadata },
      badgeIds: [{
        start: startBadgeId,
        end: endBadgeId,
      }],
      uri: uri
    }
  }

  return currMetadataMap;
}


/**
 * Returns the { metadata, uri, badgeIds } metadata object from the MetadataMap for a specific badgeId.
 *
 * If the badgeId does not exist in the MetadataMap, returns undefined.
 *
 * @param {bigint} badgeId - The badge ID to search for
 * @param {MetadataMap} metadataMap - The metadata map to search in
 *
 * @returns {MetadataMapObj | undefined} - The metadata object for the badgeId, or undefined if it does not exist
 */
export function getMetadataMapObjForBadgeId(badgeId: bigint, metadataMap: MetadataMap) {
  let currentMetadata = undefined;
  for (const val of Object.values(metadataMap)) {
    if (!val) continue; //For TS

    const [_idx, found] = searchUintRangesForId(badgeId, val.badgeIds)
    if (found) {
      return val;
    }
  }

  return currentMetadata;
}

/**
 * Returns the metadata from the MetadataMap for a specific badgeId.
 *
 * If the badgeId does not exist in the MetadataMap, returns undefined.
 *
 * @param {bigint} badgeId - The badge ID to search for
 * @param {MetadataMap} metadataMap - The metadata map to search in
 *
 * @returns {Metadata | undefined} - The metadata for the badgeId, or undefined if it does not exist
 */
export function getMetadataForBadgeId(badgeId: bigint, metadataMap: MetadataMap) {
  return getMetadataMapObjForBadgeId(badgeId, metadataMap)?.metadata;
}

export function bigIntMin(a: bigint, b: bigint): bigint {
  return a > b ? b : a;
}


/**
 * For each badgeId in badgeIds, populates the metadata map with the given key, value JSON property pair.
 *
 * If you want to update the entire metadata (not just a specific key value pair), use updateMetadataMap instead.
 *
 * This is typically used when customizing or creating a badge.
 *
 * @example
 * Use this function to set the "name" property of all badges to "test" via setMetadataPropertyForAllMapEntries(metadataMap, badgeIds, uri, "name", "test")
 *
 * @param {MetadataMap} metadataMap - The metadata map to update
 * @param {UintRange[]} badgeIds - The badge IDs to update
 * @param {string} uri - The URI that the metadata was fetched from (can use a placeholder like "Manual" and update it later)
 * @param {string} key - The key to update
 * @param {any} value - The value to update
 */
export const setMetadataPropertyForAllMapEntries = (metadataMap: MetadataMap, badgeIds: UintRange[], uri: string, key: string, value: any) => {
  for (const badgeUintRange of badgeIds) {

    //Otherwise, we are updating a specific key value pair for each
    for (let id = badgeUintRange.start; id <= badgeUintRange.end; id++) {
      let newMetadata = {} as Metadata;
      const values = Object.values(metadataMap);
      const uintRangeToUpdate = { start: id, end: id };

      for (let i = 0; i < values.length; i++) {
        const val = values[i];
        if (!val) continue; //For TS

        //Find the idx where id is in the badgeIds array
        const [idx, found] = searchUintRangesForId(id, val.badgeIds)
        if (found) {
          //If multiple sequential badge IDs have the same metadata and are in the ranges we want to update,
          //we can batch update all these together
          const foundUintRange = val.badgeIds[idx];
          const endIdToUpdate = bigIntMin(foundUintRange.end, badgeUintRange.end);
          uintRangeToUpdate.end = endIdToUpdate;

          id = endIdToUpdate; //Set id to the end of the range we are updating so we can skip to the next range (will be incremented by 1 at the end of the loop)

          newMetadata = { ...val.metadata, [key]: value };
          break;
        }
      }

      metadataMap = updateMetadataMap(metadataMap, newMetadata, uintRangeToUpdate, uri ?? 'Manual');
    }
  }

  return metadataMap;
}
