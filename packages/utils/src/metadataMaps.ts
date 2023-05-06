import { IdRange } from "bitbadgesjs-proto";
import { insertRangeToIdRanges, removeIdsFromIdRange, searchIdRangesForId } from "./idRanges";
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
 */
export const updateMetadataMap = (currMetadataMap: MetadataMap, metadata: Metadata, badgeIds: IdRange, uri: string) => {
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
      val.badgeIds = [...val.badgeIds.slice(0, j), ...removeIdsFromIdRange({ start: startBadgeId, end: endBadgeId }, val.badgeIds[j]), ...val.badgeIds.slice(j + 1)]
    }
  }

  //If the metadata we are updating is already in the map, we can just insert the badge IDs
  let currMetadataMapExists = false;
  for (let i = 0; i < keys.length; i++) {
    const val = values[i];
    if (!val) continue; //For TS

    if (JSON.stringify(val.metadata) === JSON.stringify(currentMetadata)) {
      currMetadataMapExists = true;
      val.badgeIds = val.badgeIds.length > 0 ? insertRangeToIdRanges({ start: startBadgeId, end: endBadgeId }, val.badgeIds) : [{ start: startBadgeId, end: endBadgeId }];
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
 */
export function getMetadataMapObjForBadgeId(badgeId: number, metadataMap: MetadataMap) {
  let currentMetadata = undefined;
  for (const val of Object.values(metadataMap)) {
    if (!val) continue; //For TS

    const [_idx, found] = searchIdRangesForId(badgeId, val.badgeIds)
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
 */
export function getMetadataForBadgeId(badgeId: number, metadataMap: MetadataMap) {
  return getMetadataMapObjForBadgeId(badgeId, metadataMap)?.metadata;
}

/**
 * For each badgeId in badgeIds, populates the metadata map with the given key value pair.
 *
 * If metadataToSet is provided, we are overwriting all metadata for the badgeIds (i.e. setting metadata for all badgeIds to metadataToSet).
 * Note you can also just use updateMetadataMap for this.
 *
 * Otherwise, we are updating a specific key value pair within each badge's existing metadata.
 *
 * For example, if we want to set all badges to have "name" = "test", we can call setMetadataPropertyForAllMapEntries(metadataMap, badgeIds, uri, "name", "test")
 *
 * This is typically used when customizing or creating a badge. If this is the case, you can set the uri to "Manual" for now.
 */
export const setMetadataPropertyForAllMapEntries = (metadataMap: MetadataMap, badgeIds: IdRange[], uri: string, key: string, value: any, metadataToSet?: Metadata) => {
  for (const badgeIdRange of badgeIds) {
    //If we are overwriting all metadata, we can just update the metadata map for all badge IDs to metadataToSet
    if (metadataToSet) {
      metadataMap = updateMetadataMap(metadataMap, metadataToSet, badgeIdRange, uri ?? 'Manual');
    } else {
      //Otherwise, we are updating a specific key value pair for each
      for (let id = badgeIdRange.start; id <= badgeIdRange.end; id++) {
        let newMetadata = {} as Metadata;
        const values = Object.values(metadataMap);
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
            const endIdToUpdate = Math.min(foundIdRange.end, badgeIdRange.end);
            idRangeToUpdate.end = endIdToUpdate;

            id = endIdToUpdate; //Set id to the end of the range we are updating so we can skip to the next range (will be incremented by 1 at the end of the loop)

            newMetadata = { ...val.metadata, [key]: value };
            break;
          }
        }

        metadataMap = updateMetadataMap(metadataMap, newMetadata, idRangeToUpdate, uri ?? 'Manual');
      }
    }
  }

  return metadataMap;
}
