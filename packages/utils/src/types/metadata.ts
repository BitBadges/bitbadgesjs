import { UintRange, NumberType, convertUintRange, AddressMapping } from "bitbadgesjs-proto";
import { deepCopy } from "./utils";

/**
 * Metadata is the information about badges and badge collections that is not stored on the blockchain.
 *
 * @typedef {Object} Metadata
 * @property {string} name - The name of the badge or badge collection.
 * @property {string} description - The description of the badge or badge collection.
 * @property {string} image - The image of the badge or badge collection.
 * @property {string} [creator] - The creator of the badge or badge collection.
 * @property {UintRange} [validFrom] - The start time in milliseconds to end time in milliseconds of the badge or badge collection.
 * @property {string} [color] - The color of the badge or badge collection.
 * @property {string} [category] - The category of the badge or badge collection (e.g. "Education", "Attendance").
 * @property {string} [externalUrl] - The external URL of the badge or badge collection.
 * @property {string[]} [tags] - The tags of the badge or badge collection
 * @property {UintRange[]} [times] - Arbitrary times in milliseconds. For example, use this for event times.
 *
 * @property {bigint} [fetchedAtBlock] - Block of fetch time
 * @property {bigint} [fetchedAt] - UNIX milliseconds the metadata was cached / fetched at
 * @property {boolean} [_isUpdating] - Field used to indicate whether the metadata is in the refresh queue or not (being updated). Do not set this field manually. It will be set by the SDK / API.
 *
 * @category API / Indexer
 */
export interface Metadata<T extends NumberType> {
  _isUpdating?: boolean;

  fetchedAt?: T
  fetchedAtBlock?: T

  name: string;
  description: string;
  image: string;
  times?: UintRange<T>[];
  validFrom?: UintRange<T>[];
  color?: string;
  category?: string;
  externalUrl?: string;
  tags?: string[];
}

/**
 * @category API / Indexer
 */
export function convertMetadata<T extends NumberType, U extends NumberType>(item: Metadata<T>, convertFunction: (item: T) => U): Metadata<U> {
  return deepCopy({
    ...item,
    validFrom: item.validFrom ? item.validFrom.map((UintRange) => convertUintRange(UintRange, convertFunction)) : undefined,
    times: item.times ? item.times.map((UintRange) => convertUintRange(UintRange, convertFunction)) : undefined,
    fetchedAt: item.fetchedAt ? convertFunction(item.fetchedAt) : undefined,
    fetchedAtBlock: item.fetchedAtBlock ? convertFunction(item.fetchedAtBlock) : undefined,
  })
}


/**
 * @category API / Indexer
 */
export interface AddressMappingWithMetadata<T extends NumberType> extends AddressMapping {
  metadata?: Metadata<T>
}

/**
 * @category API / Indexer
 */
export function convertAddressMappingWithMetadata<T extends NumberType, U extends NumberType>(item: AddressMappingWithMetadata<T>, convertFunction: (item: T) => U): AddressMappingWithMetadata<U> {
  return deepCopy({
    ...item,
    metadata: item.metadata ? convertMetadata(item.metadata, convertFunction) : undefined,
  })
}
