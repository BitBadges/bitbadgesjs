import { IdRange, NumberType, convertIdRange } from "bitbadgesjs-proto";
import { deepCopy } from "./utils";

/**
 * Metadata is the information about badges and badge collections that is not stored on the blockchain.
 *
 * @typedef {Object} Metadata
 * @property {string} name - The name of the badge or badge collection.
 * @property {string} description - The description of the badge or badge collection.
 * @property {string} image - The image of the badge or badge collection.
 * @property {string} [creator] - The creator of the badge or badge collection.
 * @property {IdRange} [validFrom] - The start time in milliseconds to end time in milliseconds of the badge or badge collection.
 * @property {string} [color] - The color of the badge or badge collection.
 * @property {string} [category] - The category of the badge or badge collection (e.g. "Education", "Attendance").
 * @property {string} [externalUrl] - The external URL of the badge or badge collection.
 * @property {string[]} [tags] - The tags of the badge or badge collection.
 *
 * @property {boolean} [_isUpdating] - Field used to indicate whether the metadata is in the refresh queue or not (being updated). Do not set this field manually. It will be set by the SDK / API.
 */
export interface Metadata<T extends NumberType> {
  _isUpdating?: boolean;

  name: string;
  description: string;
  image: string;
  time?: IdRange<T>;
  validFrom?: IdRange<T>;
  color?: string;
  category?: string;
  externalUrl?: string;
  tags?: string[];
  hidden?: boolean;
  references?: string[];
}

export function convertMetadata<T extends NumberType, U extends NumberType>(item: Metadata<T>, convertFunction: (item: T) => U): Metadata<U> {
  return deepCopy({
    ...item,
    time: item.time ? convertIdRange(item.time, convertFunction) : undefined,
    validFrom: item.validFrom ? convertIdRange(item.validFrom, convertFunction) : undefined,
  })
}
