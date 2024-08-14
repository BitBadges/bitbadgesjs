import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import { bigIntMin, safeAddKeepLeft } from '@/common/math.js';
import { Stringify, type NumberType } from '@/common/string-numbers.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import { badges } from '@/proto/index.js';
import type { iUintRange } from '@/interfaces/badges/core.js';
import type { iMetadata } from './metadata.js';
import { Metadata } from './metadata.js';

//TODO: Make an Array wrapper class for the util functions? Also add to BitBadgesCollection?

/**
 * To keep track of metadata for badges and load it dynamically, we store it in an array: BadgeMetadataDetails<T>[].
 *
 * The values are { metadata, uri, badgeIds, } where this object represents the metadata fetched by a uri
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
 * @category Interfaces
 */
export interface iBadgeMetadataDetails<T extends NumberType> {
  /** The badge IDs that correspond to the metadata */
  badgeIds: iUintRange<T>[];
  /** The metadata fetched by the URI */
  metadata?: iMetadata<T>;
  /** The URI that the metadata was fetched from. This is the original on-chain URI, so may still have placeholders (i.e. {id} or {address}) */
  uri: string;
  /** The URI that the metadata was fetched from with placeholders replaced. */
  fetchedUri?: string;
  /** Custom data */
  customData: string;
  /** Flag to denote if the metadata is new and should be updated. Used internally. */
  toUploadToIpfs?: boolean;
}

/**
 * @category Interfaces
 */
export interface iCollectionMetadataDetails<T extends NumberType> {
  /** The metadata fetched by the URI */
  metadata?: iMetadata<T>;
  /** The URI that the metadata was fetched from. This is the original on-chain URI, so may still have placeholders (i.e. {id} or {address}) */
  uri: string;
  /** The URI that the metadata was fetched from with placeholders replaced. */
  fetchedUri?: string;
  /** Custom data */
  customData: string;
  /** Flag to denote if the metadata is new and should be updated. Used internally. */
  toUploadToIpfs?: boolean;
}

/**
 * @inheritDoc iCollectionMetadataDetails
 * @category Collections
 */
export class CollectionMetadataDetails<T extends NumberType>
  extends BaseNumberTypeClass<CollectionMetadataDetails<T>>
  implements iCollectionMetadataDetails<T>
{
  metadata?: Metadata<T>;
  uri: string;
  fetchedUri?: string | undefined;
  customData: string;
  toUploadToIpfs?: boolean;

  constructor(data: iCollectionMetadataDetails<T>) {
    super();
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.uri = data.uri;
    this.fetchedUri = data.fetchedUri;
    this.customData = data.customData;
    this.toUploadToIpfs = data.toUploadToIpfs;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CollectionMetadataDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CollectionMetadataDetails<U>;
  }

  toProto(): badges.CollectionMetadata {
    return new badges.CollectionMetadata(this.convert(Stringify));
  }
}

/**
 * @inheritDoc iBadgeMetadataDetails
 * @category Collections
 */
export class BadgeMetadataDetails<T extends NumberType> extends BaseNumberTypeClass<BadgeMetadataDetails<T>> implements iBadgeMetadataDetails<T> {
  badgeIds: UintRangeArray<T>;
  metadata?: Metadata<T>;
  uri: string;
  fetchedUri?: string | undefined;
  customData: string;
  toUploadToIpfs?: boolean;

  constructor(data: iBadgeMetadataDetails<T>) {
    super();
    this.badgeIds = UintRangeArray.From(data.badgeIds);
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.uri = data.uri;
    this.fetchedUri = data.fetchedUri;
    this.customData = data.customData;
    this.toUploadToIpfs = data.toUploadToIpfs;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BadgeMetadataDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BadgeMetadataDetails<U>;
  }

  /**
   * Removes the metadata from the BadgeMetadataDetails<bigint>[] for specific badgeIds.
   *
   * Note that this function does not mutate the metadataArr, but instead returns a new one.
   */
  static removeBadgeMetadata = <T extends NumberType>(currBadgeMetadata: BadgeMetadataDetails<T>[], badgeIds: UintRange<T>[]) => {
    const dummyMetadata = new Metadata<T>({
      name: 'metadataToRemove',
      description: 'metadataToRemove',
      image: 'metadataToRemove'
    });
    const uniqueBadgeMetadataDetails = new BadgeMetadataDetails<T>({
      metadata: dummyMetadata,
      badgeIds,
      uri: '',
      customData: ''
    });
    const newBadgeMetadata = BadgeMetadataDetails.updateBadgeMetadata(currBadgeMetadata, uniqueBadgeMetadataDetails);

    return newBadgeMetadata.filter((val) => val && val.metadata?.name !== 'metadataToRemove');
  };

  /**
   * Update the metadataArr with the given metadata and badgeIds fetched from the given uri.
   *
   * Note that this function does not mutate the metadataArr, but instead returns a new one.
   */
  static updateBadgeMetadata = <T extends NumberType>(
    currBadgeMetadata: BadgeMetadataDetails<T>[],
    newBadgeMetadataDetails: BadgeMetadataDetails<T>
  ) => {
    return BadgeMetadataDetails.batchUpdateBadgeMetadata(currBadgeMetadata, [newBadgeMetadataDetails]);
  };

  /**
   * Batch update the metadataArr with the given metadata and badgeIds fetched from the given
   */
  static batchUpdateBadgeMetadata = <T extends NumberType>(
    currBadgeMetadata: BadgeMetadataDetails<T>[],
    newBadgeMetadataDetailsArr: BadgeMetadataDetails<T>[]
  ) => {
    const allBadgeIdsToBeUpdated = UintRangeArray.From(newBadgeMetadataDetailsArr.map((x) => x.badgeIds).flat()).sortAndMerge();
    for (let i = 0; i < currBadgeMetadata.length; i++) {
      const val = currBadgeMetadata[i];
      if (!val) continue; //For TS

      val.badgeIds.remove(allBadgeIdsToBeUpdated);
    }

    currBadgeMetadata = currBadgeMetadata.filter((val) => val && val.badgeIds.length > 0);

    const currMetadataStrs = currBadgeMetadata.map((x) => JSON.stringify(x.metadata)).sort((a, b) => a.localeCompare(b));

    for (const newBadgeMetadataDetails of newBadgeMetadataDetailsArr) {
      const currentMetadata = newBadgeMetadataDetails.metadata;

      for (const badgeUintRange of newBadgeMetadataDetails.badgeIds) {
        const startBadgeId = badgeUintRange.start;
        const endBadgeId = badgeUintRange.end;

        //If the metadata we are updating is already in the array (with matching uri and id), we can just insert the badge IDs
        let currBadgeMetadataExists = false;
        const currStr = JSON.stringify(currentMetadata);
        const idx = currMetadataStrs.indexOf(currStr);

        if (idx !== -1) {
          const val = currBadgeMetadata[idx];
          if (!val) continue; //For TS

          if (
            val.uri === newBadgeMetadataDetails.uri &&
            val.customData === newBadgeMetadataDetails.customData &&
            val.toUploadToIpfs === newBadgeMetadataDetails.toUploadToIpfs &&
            val.fetchedUri === newBadgeMetadataDetails.fetchedUri &&
            ((currentMetadata === undefined && undefined === val.metadata) || val.metadata?.equals(currentMetadata))
          ) {
            currBadgeMetadataExists = true;
            const newUintRange = new UintRange({ start: startBadgeId, end: endBadgeId });
            if (val.badgeIds.length > 0) {
              val.badgeIds.push(newUintRange);
              val.badgeIds.sortAndMerge();
            } else {
              val.badgeIds = UintRangeArray.From([newUintRange]);
            }
          }
        }

        //Recreate the array with the updated badge IDs
        //If some metadata object no longer has any corresponding badge IDs, we can remove it from the array

        //If we did not find the metadata in the array and metadata !== undefined, we need to add it
        if (!currBadgeMetadataExists) {
          currBadgeMetadata.push(
            new BadgeMetadataDetails({
              metadata: currentMetadata ? { ...currentMetadata } : undefined,
              badgeIds: [
                {
                  start: startBadgeId,
                  end: endBadgeId
                }
              ],
              uri: newBadgeMetadataDetails.uri,
              fetchedUri: newBadgeMetadataDetails.fetchedUri,
              customData: newBadgeMetadataDetails.customData,
              toUploadToIpfs: newBadgeMetadataDetails.toUploadToIpfs
            })
          );

          const hashedMetadataStr = JSON.stringify(newBadgeMetadataDetails.metadata);
          currMetadataStrs.push(hashedMetadataStr);
          currMetadataStrs.sort((a, b) => a.localeCompare(b));
        }
      }
    }

    currBadgeMetadata = currBadgeMetadata.filter((val) => val && val.badgeIds.length > 0);
    return currBadgeMetadata;
  };

  /**
   * Returns the { metadata, uri, badgeIds, customData } metadata object from the BadgeMetadataDetails<bigint>[] for a specific badgeId.
   *
   * If the badgeId does not exist in the BadgeMetadataDetails<bigint>[], returns undefined.
   */
  static getMetadataDetailsForBadgeId<T extends NumberType>(badgeId: T, metadataArr: BadgeMetadataDetails<T>[]): BadgeMetadataDetails<T> | undefined {
    for (const val of Object.values(metadataArr)) {
      if (!val) continue; //For TS

      if (val.badgeIds.searchIfExists(badgeId)) {
        return val;
      }
    }

    return undefined;
  }

  /**
   * Returns the metadata from the BadgeMetadataDetails<bigint>[] for a specific badgeId.
   *
   * If the badgeId does not exist in the BadgeMetadataDetails<bigint>[], returns undefined.
   */
  static getMetadataForBadgeId<T extends NumberType>(badgeId: T, metadataArr: BadgeMetadataDetails<T>[]) {
    return BadgeMetadataDetails.getMetadataDetailsForBadgeId(badgeId, metadataArr)?.metadata;
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
   */
  static setMetadataPropertyForSpecificBadgeIds = <T extends NumberType>(
    metadataArr: BadgeMetadataDetails<T>[],
    badgeIds: UintRange<T>[],
    key: string,
    value: any
  ) => {
    const toUploadToIpfsDetails: BadgeMetadataDetails<T>[] = [];
    for (const badgeUintRange of badgeIds) {
      //We are updating a specific key value pair for each
      for (let id = badgeUintRange.start; id <= badgeUintRange.end; id = safeAddKeepLeft(id, 1)) {
        let newMetadata = {} as Metadata<T>;
        let uri = '';
        let customData = '';
        const uintRangeToUpdate = new UintRange<T>({ start: id, end: id });

        for (let i = 0; i < metadataArr.length; i++) {
          const val = metadataArr[i];
          if (!val || !val.metadata) continue; //For TS

          //Find the idx where id is in the badgeIds array
          const [idx, found] = val.badgeIds.search(id);
          if (found) {
            //If multiple sequential badge IDs have the same metadata and are in the ranges we want to update,
            //we can batch update all these together
            const foundUintRange = val.badgeIds[Number(idx)];
            const endIdToUpdate = bigIntMin(foundUintRange.end, badgeUintRange.end);
            uintRangeToUpdate.end = endIdToUpdate;

            id = endIdToUpdate; //Set id to the end of the range we are updating so we can skip to the next range (will be incremented by 1 at the end of the loop)

            newMetadata = new Metadata({ ...val.metadata, [key]: value });
            uri = val.uri;
            customData = val.customData;
            break;
          }
        }
        // console.log(metadataArr);
        toUploadToIpfsDetails.push(
          new BadgeMetadataDetails<T>({
            metadata: newMetadata,
            badgeIds: [uintRangeToUpdate],
            uri,
            customData,
            toUploadToIpfs: true
          })
        );
      }
    }
    metadataArr = BadgeMetadataDetails.batchUpdateBadgeMetadata<T>(metadataArr, toUploadToIpfsDetails);

    return metadataArr;
  };

  toProto(): badges.BadgeMetadata {
    return new badges.BadgeMetadata(this.convert(Stringify));
  }
}
