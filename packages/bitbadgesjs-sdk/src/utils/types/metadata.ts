import { NumberType } from "../..";
import { AddressListDoc, convertAddressListDoc } from "./db";
import { deepCopy } from "./utils";
import { ListActivityDoc, convertListActivityDoc } from "./activity";
import { PaginationInfo } from "./api";

/**
 * Metadata is the information about badges and badge collections that is not stored on the blockchain.
 *
 * @typedef {Object} Metadata
 * @property {string} name - The name of the badge or badge collection.
 * @property {string} description - The description of the badge or badge collection.
 * @property {string} image - The image of the badge or badge collection.
 * @property {string} video - The video of the badge or badge collection. If a standard video is used, this should be a link to the video. We will use image as the poster image. If a youtube video is used, we embed it as an iframe.
 * @property {string} [creator] - The creator of the badge or badge collection.
 * @property {string} [color] - The color of the badge or badge collection.
 * @property {string} [category] - The category of the badge or badge collection (e.g. "Education", "Attendance").
 * @property {string} [externalUrl] - The external URL of the badge or badge collection.
 * @property {string[]} [tags] - The tags of the badge or badge collection
 *
 * @property {Object} [socials] - The socials for the metadata
 *
 * @property {Object} [offChainTransferabilityInfo] - The off-chain transferability info for the metadata
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
  video?: string;
  color?: string;
  category?: string;
  externalUrl?: string;
  tags?: string[];

  socials?: {
    [key: string]: string;
  }

  offChainTransferabilityInfo?: {
    host: string
    assignMethod: string
  }
}

/**
 * @category API / Indexer
 */
export function convertMetadata<T extends NumberType, U extends NumberType>(item: Metadata<T>, convertFunction: (item: T) => U): Metadata<U> {
  return deepCopy({
    ...item,
    fetchedAt: item.fetchedAt ? convertFunction(item.fetchedAt) : undefined,
    fetchedAtBlock: item.fetchedAtBlock ? convertFunction(item.fetchedAtBlock) : undefined,
  })
}


/**
 * @category API / Indexer
 *
 * @typedef {Object} BitBadgesAddressList
 * @property {string} metadata - The metadata of the address list.
 */
export interface BitBadgesAddressList<T extends NumberType> extends AddressListDoc<T> {
  metadata?: Metadata<T>
  listsActivity: ListActivityDoc<T>[]
  views: {
    [viewId: string]: {
      ids: string[],
      type: string,
      pagination: PaginationInfo,
    } | undefined
  }
}

/**
 * @category API / Indexer
 */
export function convertBitBadgesAddressList<T extends NumberType, U extends NumberType>(item: BitBadgesAddressList<T>, convertFunction: (item: T) => U): BitBadgesAddressList<U> {
  return deepCopy({
    ...convertAddressListDoc(item, convertFunction),
    metadata: item.metadata ? convertMetadata(item.metadata, convertFunction) : undefined,
    listsActivity: item.listsActivity.map((activity) => convertListActivityDoc(activity, convertFunction)),
    views: item.views,
  })
}