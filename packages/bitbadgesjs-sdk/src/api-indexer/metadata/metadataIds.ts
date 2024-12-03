import { safeSubtractKeepLeft, safeAddKeepRight, safeAddKeepLeft } from '@/common/math.js';
import { BigIntify, NumberType } from '@/common/string-numbers.js';
import type { BadgeMetadata } from '@/core/misc.js';
import type { UintRange } from '@/core/uintRanges.js';
import { UintRangeArray } from '@/core/uintRanges.js';
import { getConverterFunction } from '@/common/base.js';

/**
 * This function returns the [Metadata ID](https://docs.bitbadges.io/for-developers/bitbadges-sdk/common-snippets/metadata-ids)
 * for a specific badge ID. Returns -1 if not found.
 *
 * @remarks
 * The badge metadata array is the timeline values (BadgeMetadataTimeline.badgeMetadata), not the cached fetched values
 * from the API.
 *
 * @example
 * ```ts
 * import { getMetadataIdForBadgeId } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection<bigint> = { ... }
 * const badgeId = 123n
 * const metadataId = getMetadataIdForBadgeId(badgeId, collection.getBadgeMetadataTimelineValue())
 * ```
 *
 * @example
 * This can also be used with the BitBadges collection interface
 * ```ts
 * import { BitBadgesCollection } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection<bigint> = { ... }
 * const badgeId = 123n
 * const metadataId = collection.getMetadataIdForBadgeId(badgeId)
 * ```
 *
 * @category Metadata IDs
 */
export const getMetadataIdForBadgeId = <T extends NumberType>(badgeId: T, badgeMetadata: BadgeMetadata<T>[]) => {
  let batchIdx = 1n;

  for (const badgeUri of badgeMetadata) {
    if (badgeUri.uri.includes('{id}')) {
      const [idx, found] = badgeUri.badgeIds.search(badgeId);
      if (found) {
        const badgeUintRange = badgeUri.badgeIds[Number(idx)];
        return safeSubtractKeepLeft(safeAddKeepRight(batchIdx, badgeId), badgeUintRange.start);
      }

      batchIdx = safeAddKeepLeft(batchIdx, badgeUri.badgeIds.size());
    } else {
      const found = badgeUri.badgeIds.searchIfExists(badgeId);
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
 * for a specific badge URI. Returns an empty array if not found.
 *
 * @remarks
 * The badge metadata array is the timeline values (BadgeMetadataTimeline.badgeMetadata), not the cached fetched values
 * from the API.
 *
 * @example
 * ```ts
 * import { getMetadataIdsForUri } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection<bigint> = { ... }
 * const uri = 'https://bitbadges.io/collection/1/badge/1'
 * const metadataIds = getMetadataIdsForUri(uri, collection.getBadgeMetadataTimelineValue())
 * ```
 *
 * @example
 * This can also be used with the BitBadges collection interface
 * ```ts
 * import { BitBadgesCollection } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection<bigint> = { ... }
 * const uri = 'https://bitbadges.io/collection/1/badge/1'
 * const metadataIds = collection.getMetadataIdsForUri(uri)
 * ```
 *
 * @category Metadata IDs
 */
export const getMetadataIdsForUri = <T extends NumberType>(uri: string, badgeMetadata: BadgeMetadata<T>[]) => {
  if (badgeMetadata.length === 0) {
    return [];
  }

  const converterFunction = getConverterFunction(badgeMetadata[0].badgeIds[0].start);
  const converted = badgeMetadata.map((x) => x.convert(BigIntify));

  let batchIdx = 1n;
  const metadataIds: bigint[] = [];
  for (const badgeUri of converted) {
    if (badgeUri.uri.includes('{id}')) {
      if (badgeUri.uri === uri) {
        metadataIds.push(batchIdx);
        continue;
      }

      //Check if uri has a number value that replaces {id}

      //Check if everythin up to {id} is the same
      const uriPrefix = badgeUri.uri.split('{id}')[0];
      const numSubstringIdxStart = uriPrefix.length;
      if (uri.startsWith(uriPrefix)) {
        //Check if everything after {id} is the same
        const uriSuffix = badgeUri.uri.split('{id}')[1];
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

  return metadataIds.map((x) => converterFunction(x));
};

/**
 * This returns the max [Metadata ID](https://docs.bitbadges.io/for-developers/bitbadges-sdk/common-snippets/metadata-ids)
 * for a collection.
 *
 * @category Metadata IDs
 */
export function getMaxMetadataId<T extends NumberType>(badgeMetadata: BadgeMetadata<T>[]) {
  if (badgeMetadata.length === 0) {
    return 0n;
  }

  let metadataId = 0n;
  for (const badgeUri of badgeMetadata) {
    // If the URI contains {id}, each badge ID will belong to its own private batch
    if (badgeUri.uri.includes('{id}')) {
      metadataId = safeAddKeepLeft(metadataId, badgeUri.badgeIds.size());
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
 * The badge metadata array is the timeline values (BadgeMetadataTimeline.badgeMetadata), not the cached fetched values
 * from the API.
 *
 * @example
 * ```ts
 * import { getUrisForMetadataId } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection<bigint> = { ... }
 * const metadataId = 123n
 * const uris = getUrisForMetadataId(metadataId, collection.getBadgeMetadataTimelineValue())
 * ```
 *
 * @example
 * This can also be used with the BitBadges collection interface
 * ```ts
 * import { BitBadgesCollection } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection<bigint> = { ... }
 * const metadataId = 123n
 * const uris = collection.getUrisForMetadataId(metadataId)
 * ```
 *
 * @category Metadata IDs
 */
export function getUrisForMetadataIds<T extends NumberType>(metadataIds: T[], collectionUri: string, _badgeUris: BadgeMetadata<T>[]) {
  const uris: string[] = [];
  if (metadataIds.find((id) => id === 0n)) {
    uris.push(collectionUri);
  }

  const badgeMetadata = _badgeUris.map((x) => x.convert(BigIntify));

  let batchIdx = 1n;

  for (const badgeUri of badgeMetadata) {
    if (badgeUri.uri.includes('{id}')) {
      for (const badgeUintRange of badgeUri.badgeIds) {
        const start = batchIdx;
        const end = batchIdx + badgeUintRange.end - badgeUintRange.start;
        for (const metadataId of metadataIds.map((x) => BigInt(x))) {
          if (metadataId >= start && metadataId <= end) {
            uris.push(badgeUri.uri.replace('{id}', (metadataId - start + badgeUintRange.start).toString()));
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
 * This return the badge IDs for a specific [Metadata ID](https://docs.bitbadges.io/for-developers/bitbadges-sdk/common-snippets/metadata-ids).
 * Returns an empty array if not found.
 *
 * @remarks
 * The badge metadata array is the timeline values (BadgeMetadataTimeline.badgeMetadata), not the cached fetched values
 * from the API.
 *
 * @example
 * ```ts
 * import { getBadgeIdsForMetadataId } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection<bigint> = { ... }
 * const metadataId = 123n
 * const badgeIds = getBadgeIdsForMetadataId(metadataId, collection.getBadgeMetadataTimelineValue())
 * ```
 *
 * @example
 * This can also be used with the BitBadges collection interface
 * ```ts
 * import { BitBadgesCollection } from 'bitbadgesjs-sdk'
 * const collection: BitBadgesCollection<bigint> = { ... }
 * const metadataId = 123n
 * const badgeIds = collection.getBadgeIdsForMetadataId(metadataId)
 * ```
 *
 * @category Metadata IDs
 */
export function getBadgeIdsForMetadataId<T extends NumberType>(_metadataId: T, _badgeUris: BadgeMetadata<T>[]): UintRange<T>[] {
  let batchIdx = 1n;

  const metadataId = BigInt(_metadataId);
  const badgeMetadata = _badgeUris.map((x) => x.convert(BigIntify));
  const converter = getConverterFunction(_badgeUris[0].badgeIds[0].start);

  for (const badgeUri of badgeMetadata) {
    if (badgeUri.uri.includes('{id}')) {
      for (const badgeUintRange of badgeUri.badgeIds) {
        const start = batchIdx;
        const end = batchIdx + badgeUintRange.end - badgeUintRange.start;
        if (metadataId >= start && metadataId <= end) {
          return UintRangeArray.From([{ start: metadataId - start + badgeUintRange.start, end: metadataId - start + badgeUintRange.start }]).convert(
            converter
          );
        }

        batchIdx += badgeUintRange.end - badgeUintRange.start + 1n;
      }
    } else {
      if (metadataId === batchIdx) {
        return badgeUri.badgeIds.convert(converter);
      }
      batchIdx++;
    }
  }

  return [];
}
