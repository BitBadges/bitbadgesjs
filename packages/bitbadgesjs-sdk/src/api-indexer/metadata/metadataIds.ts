import { safeSubtractKeepLeft, safeAddKeepRight, safeAddKeepLeft } from '@/common/math.js';
import { BigIntify, NumberType } from '@/common/string-numbers.js';
import type { TokenMetadata } from '@/core/misc.js';
import type { UintRange } from '@/core/uintRanges.js';
import { UintRangeArray } from '@/core/uintRanges.js';
import { getConverterFunction } from '@/common/base.js';

/**
 * This function returns the [Metadata ID](https://docs.bitbadges.io/for-developers/bitbadges-sdk/common-snippets/metadata-ids)
 * for a specific token ID. Returns -1 if not found.
 *
 * @remarks
 * The token metadata array is the timeline values (TokenMetadataTimeline.tokenMetadata), not the cached fetched values
 * from the API.
 *
 * @example
 * ```ts
 * import { getMetadataIdForTokenId } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection = { ... }
 * const tokenId = 123n
 * const metadataId = getMetadataIdForTokenId(tokenId, collection.getTokenMetadataTimelineValue())
 * ```
 *
 * @example
 * This can also be used with the BitBadges collection interface
 * ```ts
 * import { BitBadgesCollection } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection = { ... }
 * const tokenId = 123n
 * const metadataId = collection.getMetadataIdForTokenId(tokenId)
 * ```
 *
 * @category Metadata IDs
 */
export const getMetadataIdForTokenId = (tokenId: T, tokenMetadata: TokenMetadata[]) => {
  let batchIdx = 1n;

  for (const tokenUri of tokenMetadata) {
    if (tokenUri.uri.includes('{id}')) {
      const [idx, found] = tokenUri.tokenIds.search(tokenId);
      if (found) {
        const tokenUintRange = tokenUri.tokenIds[Number(idx)];
        return safeSubtractKeepLeft(safeAddKeepRight(batchIdx, tokenId), tokenUintRange.start);
      }

      batchIdx = safeAddKeepLeft(batchIdx, tokenUri.tokenIds.size());
    } else {
      const found = tokenUri.tokenIds.searchIfExists(tokenId);
      if (found) {
        return batchIdx;
      }
      batchIdx++;
    }
  }

  return -1;
};

/**
 * This function returns the [Metadata IDs](https://docs.bitbadges.io/for-developers/bitbadges-sdk/common-snippets/metadata-ids)
 * for a specific token URI. Returns an empty array if not found.
 *
 * @remarks
 * The token metadata array is the timeline values (TokenMetadataTimeline.tokenMetadata), not the cached fetched values
 * from the API.
 *
 * @example
 * ```ts
 * import { getMetadataIdsForUri } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection = { ... }
 * const uri = 'https://bitbadges.io/collection/1/badge/1'
 * const metadataIds = getMetadataIdsForUri(uri, collection.getTokenMetadataTimelineValue())
 * ```
 *
 * @example
 * This can also be used with the BitBadges collection interface
 * ```ts
 * import { BitBadgesCollection } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection = { ... }
 * const uri = 'https://bitbadges.io/collection/1/badge/1'
 * const metadataIds = collection.getMetadataIdsForUri(uri)
 * ```
 *
 * @category Metadata IDs
 */
export const getMetadataIdsForUri = (uri: string, tokenMetadata: TokenMetadata[]) => {
  if (tokenMetadata.length === 0) {
    return [];
  }

  const converterFunction = getConverterFunction(tokenMetadata[0].tokenIds[0].start);
  const converted = tokenMetadata.map((x) => x.convert(BigIntify));

  let batchIdx = 1n;
  const metadataIds: bigint[] = [];
  for (const tokenUri of converted) {
    if (tokenUri.uri.includes('{id}')) {
      if (tokenUri.uri === uri) {
        metadataIds.push(batchIdx);
        continue;
      }

      //Check if uri has a number value that replaces {id}

      //Check if everythin up to {id} is the same
      const uriPrefix = tokenUri.uri.split('{id}')[0];
      const numSubstringIdxStart = uriPrefix.length;
      if (uri.startsWith(uriPrefix)) {
        //Check if everything after {id} is the same
        const uriSuffix = tokenUri.uri.split('{id}')[1];
        const numSubstringIdxEnd = uri.length - uriSuffix.length;
        if (uri.endsWith(uriSuffix)) {
          //Check if the number value is within the range of tokenIds
          const numSubstring = uri.substring(numSubstringIdxStart, numSubstringIdxEnd);
          const num = BigInt(numSubstring);

          for (const tokenUintRange of tokenUri.tokenIds) {
            if (num >= tokenUintRange.start && num <= tokenUintRange.end) {
              // return batchIdx + num - tokenUintRange.start;
              metadataIds.push(batchIdx + num - tokenUintRange.start);
            }

            batchIdx += tokenUintRange.end - tokenUintRange.start + 1n;
          }
        }
      } else {
        for (const tokenUintRange of tokenUri.tokenIds) {
          batchIdx += tokenUintRange.end - tokenUintRange.start + 1n;
        }
      }
    } else {
      if (tokenUri.uri === uri) {
        // return batchIdx;
        metadataIds.push(batchIdx);
      }
      batchIdx++;
    }
  }

  return metadataIds.map((x) => converterFunction(x));
};

/**
 * This returns the max [Metadata ID](https://docs.bitbadges.io/for-developers/bitbadges-sdk/common-snippets/metadata-ids)
 * for a collection.
 *
 * @category Metadata IDs
 */
export function getMaxMetadataId(tokenMetadata: TokenMetadata[]) {
  if (tokenMetadata.length === 0) {
    return 0n;
  }

  let metadataId = 0n;
  for (const tokenUri of tokenMetadata) {
    // If the URI contains {id}, each token ID will belong to its own private batch
    if (tokenUri.uri.includes('{id}')) {
      metadataId = safeAddKeepLeft(metadataId, tokenUri.tokenIds.size());
    } else {
      metadataId++;
    }
  }

  return metadataId;
}

/**
 * This returns the URIs for a specific [Metadata ID](https://docs.bitbadges.io/for-developers/bitbadges-sdk/common-snippets/metadata-ids).
 * Returns an empty array if not found.
 *
 * @remarks
 * The token metadata array is the timeline values (TokenMetadataTimeline.tokenMetadata), not the cached fetched values
 * from the API.
 *
 * @example
 * ```ts
 * import { getUrisForMetadataId } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection = { ... }
 * const metadataId = 123n
 * const uris = getUrisForMetadataId(metadataId, collection.getTokenMetadataTimelineValue())
 * ```
 *
 * @example
 * This can also be used with the BitBadges collection interface
 * ```ts
 * import { BitBadgesCollection } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection = { ... }
 * const metadataId = 123n
 * const uris = collection.getUrisForMetadataId(metadataId)
 * ```
 *
 * @category Metadata IDs
 */
export function getUrisForMetadataIds(metadataIds: (string | number)[], collectionUri: string, _tokenUris: TokenMetadata[]) {
  const uris: string[] = [];
  if (metadataIds.find((id) => id === 0n)) {
    uris.push(collectionUri);
  }

  const tokenMetadata = _tokenUris.map((x) => x.convert(BigIntify));

  let batchIdx = 1n;

  for (const tokenUri of tokenMetadata) {
    if (tokenUri.uri.includes('{id}')) {
      for (const tokenUintRange of tokenUri.tokenIds) {
        const start = batchIdx;
        const end = batchIdx + tokenUintRange.end - tokenUintRange.start;
        for (const metadataId of metadataIds.map((x) => BigInt(x))) {
          if (metadataId >= start && metadataId <= end) {
            uris.push(tokenUri.uri.replace('{id}', (metadataId - start + tokenUintRange.start).toString()));
          }
        }

        batchIdx += tokenUintRange.end - tokenUintRange.start + 1n;
      }
    } else {
      if (metadataIds.find((id) => id === batchIdx)) {
        uris.push(tokenUri.uri);
      }
      batchIdx++;
    }
  }

  return uris;
}

/**
 * This return the token IDs for a specific [Metadata ID](https://docs.bitbadges.io/for-developers/bitbadges-sdk/common-snippets/metadata-ids).
 * Returns an empty array if not found.
 *
 * @remarks
 * The token metadata array is the timeline values (TokenMetadataTimeline.tokenMetadata), not the cached fetched values
 * from the API.
 *
 * @example
 * ```ts
 * import { getTokenIdsForMetadataId } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection = { ... }
 * const metadataId = 123n
 * const tokenIds = getTokenIdsForMetadataId(metadataId, collection.getTokenMetadataTimelineValue())
 * ```
 *
 * @example
 * This can also be used with the BitBadges collection interface
 * ```ts
 * import { BitBadgesCollection } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection = { ... }
 * const metadataId = 123n
 * const tokenIds = collection.getTokenIdsForMetadataId(metadataId)
 * ```
 *
 * @category Metadata IDs
 */
export function getTokenIdsForMetadataId(_metadataId: T, _tokenUris: TokenMetadata[]): UintRange[] {
  let batchIdx = 1n;

  const metadataId = BigInt(_metadataId);
  const tokenMetadata = _tokenUris.map((x) => x.convert(BigIntify));
  const converter = getConverterFunction(_tokenUris[0].tokenIds[0].start);

  for (const tokenUri of tokenMetadata) {
    if (tokenUri.uri.includes('{id}')) {
      for (const tokenUintRange of tokenUri.tokenIds) {
        const start = batchIdx;
        const end = batchIdx + tokenUintRange.end - tokenUintRange.start;
        if (metadataId >= start && metadataId <= end) {
          return UintRangeArray.From([{ start: metadataId - start + tokenUintRange.start, end: metadataId - start + tokenUintRange.start }]).convert(converter);
        }

        batchIdx += tokenUintRange.end - tokenUintRange.start + 1n;
      }
    } else {
      if (metadataId === batchIdx) {
        return tokenUri.tokenIds.convert(converter);
      }
      batchIdx++;
    }
  }

  return [];
}
