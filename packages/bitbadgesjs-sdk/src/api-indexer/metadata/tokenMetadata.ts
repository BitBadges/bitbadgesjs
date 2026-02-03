import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { bigIntMin, safeAddKeepLeft } from '@/common/math.js';
import { Stringify, type NumberType } from '@/common/string-numbers.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import * as protobadges from '@/proto/badges/metadata_pb.js';
import type { iUintRange } from '@/interfaces/types/core.js';
import type { iMetadata } from './metadata.js';
import { Metadata } from './metadata.js';

//TODO: Make an Array wrapper class for the util functions? Also add to BitBadgesCollection?

/**
 * To keep track of metadata for tokens and load it dynamically, we store it in an array: TokenMetadataDetails[].
 *
 * The values are { metadata, uri, tokenIds, } where this object represents the metadata fetched by a uri
 * which correspond to the tokenIds.
 *
 * Keeping track of metadata in this way allows us to load metadata dynamically and only when needed.
 * However, it does get confusing when we need to update this array. This file contains the logic
 * for updating the metadata in an efficient way.
 *
 * updateTokenMetadata - updates the metadata array to include the given metadata and tokenIds fetched from the given uri. Replaces existing metadata for tokenIds, if any.
 * getMetadataForTokenId - returns just the metadata for a given tokenId
 * getMetadataddDetailsForTokenId - returns the { metadata, uri, tokenIds, metadata } object for a given tokenId
 *
 * setMetadataPropertyForAll - sets a specific (key, value) pair for all metadata entries in the array
 */

/**
 * @category Interfaces
 */
export interface iTokenMetadataDetails {
  /** The token IDs that correspond to the metadata */
  tokenIds: iUintRange[];
  /** The metadata fetched by the URI */
  metadata?: iMetadata;
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
export interface iCollectionMetadataDetails {
  /** The metadata fetched by the URI */
  metadata?: iMetadata;
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
export class CollectionMetadataDetails extends BaseNumberTypeClass<CollectionMetadataDetails> implements iCollectionMetadataDetails {
  metadata?: Metadata;
  uri: string;
  fetchedUri?: string | undefined;
  customData: string;
  toUploadToIpfs?: boolean;

  constructor(data: iCollectionMetadataDetails) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CollectionMetadataDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionMetadataDetails;
  }

  toProto(): protobadges.CollectionMetadata {
    return new protobadges.CollectionMetadata(this.convert(Stringify));
  }
}

/**
 * @inheritDoc iTokenMetadataDetails
 * @category Collections
 */
export class TokenMetadataDetails extends BaseNumberTypeClass<TokenMetadataDetails> implements iTokenMetadataDetails {
  tokenIds: UintRangeArray;
  metadata?: Metadata;
  uri: string;
  fetchedUri?: string | undefined;
  customData: string;
  toUploadToIpfs?: boolean;

  constructor(data: iTokenMetadataDetails) {
    super();
    this.tokenIds = UintRangeArray.From(data.tokenIds);
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.uri = data.uri;
    this.fetchedUri = data.fetchedUri;
    this.customData = data.customData;
    this.toUploadToIpfs = data.toUploadToIpfs;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): TokenMetadataDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as TokenMetadataDetails;
  }

  /**
   * Removes the metadata from the TokenMetadataDetails[] for specific token IDs.
   *
   * Note that this function does not mutate the metadataArr, but instead returns a new one.
   */
  static removeTokenMetadata = (currTokenMetadata: TokenMetadataDetails[], tokenIds: UintRange[]) => {
    const dummyMetadata = new Metadata({
      name: 'metadataToRemove',
      description: 'metadataToRemove',
      image: 'metadataToRemove'
    });
    const uniqueTokenMetadataDetails = new TokenMetadataDetails({
      metadata: dummyMetadata,
      tokenIds,
      uri: '',
      customData: ''
    });
    const newTokenMetadata = TokenMetadataDetails.updateTokenMetadata(currTokenMetadata, uniqueTokenMetadataDetails);

    return newTokenMetadata.filter((val) => val && val.metadata?.name !== 'metadataToRemove');
  };

  /**
   * Update the metadataArr with the given metadata and tokenIds fetched from the given uri.
   *
   * Note that this function does not mutate the metadataArr, but instead returns a new one.
   */
  static updateTokenMetadata = (currTokenMetadata: TokenMetadataDetails[], newTokenMetadataDetails: TokenMetadataDetails) => {
    return TokenMetadataDetails.batchUpdateTokenMetadata(currTokenMetadata, [newTokenMetadataDetails]);
  };

  /**
   * Batch update the metadataArr with the given metadata and tokenIds fetched from the given
   */
  static batchUpdateTokenMetadata = (currTokenMetadata: TokenMetadataDetails[], newTokenMetadataDetailsArr: TokenMetadataDetails[]) => {
    const allTokenIdsToBeUpdated = UintRangeArray.From(newTokenMetadataDetailsArr.map((x) => x.tokenIds).flat()).sortAndMerge();
    for (let i = 0; i < currTokenMetadata.length; i++) {
      const val = currTokenMetadata[i];
      if (!val) continue; //For TS

      val.tokenIds.remove(allTokenIdsToBeUpdated);
    }

    currTokenMetadata = currTokenMetadata.filter((val) => val && val.tokenIds.length > 0);

    const currMetadataStrs = currTokenMetadata.map((x) => JSON.stringify(x.metadata)).sort((a, b) => a.localeCompare(b));

    for (const newTokenMetadataDetails of newTokenMetadataDetailsArr) {
      const currentMetadata = newTokenMetadataDetails.metadata;

      for (const tokenUintRange of newTokenMetadataDetails.tokenIds) {
        const startTokenId = tokenUintRange.start;
        const endTokenId = tokenUintRange.end;

        //If the metadata we are updating is already in the array (with matching uri and id), we can just insert the token IDs
        let currTokenMetadataExists = false;
        const currStr = JSON.stringify(currentMetadata);
        const idx = currMetadataStrs.indexOf(currStr);

        if (idx !== -1) {
          const val = currTokenMetadata[idx];
          if (!val) continue; //For TS

          if (val.uri === newTokenMetadataDetails.uri && val.customData === newTokenMetadataDetails.customData && val.toUploadToIpfs === newTokenMetadataDetails.toUploadToIpfs && val.fetchedUri === newTokenMetadataDetails.fetchedUri && ((currentMetadata === undefined && undefined === val.metadata) || val.metadata?.equals(currentMetadata))) {
            currTokenMetadataExists = true;
            const newUintRange = new UintRange({ start: startTokenId, end: endTokenId });
            if (val.tokenIds.length > 0) {
              val.tokenIds.push(newUintRange);
              val.tokenIds.sortAndMerge();
            } else {
              val.tokenIds = UintRangeArray.From([newUintRange]);
            }
          }
        }

        //Recreate the array with the updated token IDs
        //If some metadata object no longer has any corresponding token IDs, we can remove it from the array

        //If we did not find the metadata in the array and metadata !== undefined, we need to add it
        if (!currTokenMetadataExists) {
          currTokenMetadata.push(
            new TokenMetadataDetails({
              metadata: currentMetadata ? { ...currentMetadata } : undefined,
              tokenIds: [
                {
                  start: startTokenId,
                  end: endTokenId
                }
              ],
              uri: newTokenMetadataDetails.uri,
              fetchedUri: newTokenMetadataDetails.fetchedUri,
              customData: newTokenMetadataDetails.customData,
              toUploadToIpfs: newTokenMetadataDetails.toUploadToIpfs
            })
          );

          const hashedMetadataStr = JSON.stringify(newTokenMetadataDetails.metadata);
          currMetadataStrs.push(hashedMetadataStr);
          currMetadataStrs.sort((a, b) => a.localeCompare(b));
        }
      }
    }

    currTokenMetadata = currTokenMetadata.filter((val) => val && val.tokenIds.length > 0);
    return currTokenMetadata;
  };

  /**
   * Returns the { metadata, uri, tokenIds, customData } metadata object from the TokenMetadataDetails[] for a specific tokenId.
   *
   * If the tokenId does not exist in the TokenMetadataDetails[], returns undefined.
   */
  static getMetadataDetailsForTokenId(tokenId: T, metadataArr: TokenMetadataDetails[]): TokenMetadataDetails | undefined {
    for (const val of Object.values(metadataArr)) {
      if (!val) continue; //For TS

      if (val.tokenIds.searchIfExists(tokenId)) {
        return val;
      }
    }

    return undefined;
  }

  /**
   * Returns the metadata from the TokenMetadataDetails[] for a specific tokenId.
   *
   * If the tokenId does not exist in the TokenMetadataDetails[], returns undefined.
   */
  static getMetadataForTokenId(tokenId: T, metadataArr: TokenMetadataDetails[]) {
    return TokenMetadataDetails.getMetadataDetailsForTokenId(tokenId, metadataArr)?.metadata;
  }

  /**
   * For each tokenId in tokenIds, populates the metadata array with the given key, value JSON property pair.
   *
   * If you want to update the entire metadata (not just a specific key value pair), use updateTokenMetadata instead.
   *
   * This is typically used when customizing or creating a token.
   *
   * @example
   * Use this function to set the "name" property of all tokens to "test" via setMetadataPropertyForAll(metadataArr, tokenIds, uri, "name", "test")
   */
  static setMetadataPropertyForSpecificIds = (metadataArr: TokenMetadataDetails[], tokenIds: UintRange[], key: string, value: any) => {
    const toUploadToIpfsDetails: TokenMetadataDetails[] = [];
    for (const tokenUintRange of tokenIds) {
      //We are updating a specific key value pair for each
      for (let id = tokenUintRange.start; id <= tokenUintRange.end; id = safeAddKeepLeft(id, 1)) {
        let newMetadata = {} as Metadata;
        let uri = '';
        let customData = '';
        const uintRangeToUpdate = new UintRange({ start: id, end: id });

        for (let i = 0; i < metadataArr.length; i++) {
          const val = metadataArr[i];
          if (!val || !val.metadata) continue; //For TS

          //Find the idx where id is in the tokenIds array
          const [idx, found] = val.tokenIds.search(id);
          if (found) {
            //If multiple sequential token IDs have the same metadata and are in the ranges we want to update,
            //we can batch update all these together
            const foundUintRange = val.tokenIds[Number(idx)];
            const endIdToUpdate = bigIntMin(foundUintRange.end, tokenUintRange.end);
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
          new TokenMetadataDetails({
            metadata: newMetadata,
            tokenIds: [uintRangeToUpdate],
            uri,
            customData,
            toUploadToIpfs: true
          })
        );
      }
    }
    metadataArr = TokenMetadataDetails.batchUpdateTokenMetadata(metadataArr, toUploadToIpfsDetails);

    return metadataArr;
  };

  toProto(): protobadges.TokenMetadata {
    return new protobadges.TokenMetadata(this.convert(Stringify));
  }
}
