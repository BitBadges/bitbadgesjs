import { UintRange } from "bitbadgesjs-proto";


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
 * @property {string[]} [tags] - The tags of the badge or badge collection.
 */
export interface Metadata {
  name: string;
  description: string;
  image: string;
  creator?: string;
  validFrom?: UintRange; //start time in milliseconds to end time in milliseconds
  color?: string;
  category?: string;
  externalUrl?: string;
  tags?: string[];
}
