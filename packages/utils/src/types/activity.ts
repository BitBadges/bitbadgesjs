import { Balance } from "bitbadgesjs-proto";

/**
 * Activity item that serves as the base type for all activity items.
 * @typedef {Object} ActivityItem
 * @property {string} method - The type of activity (e.g. "Review", "Transfer", "Announcement", "Mint", "Claim").
 * @property {bigint} timestamp - The timestamp of the activity (in milliseconds since the UNIX epoch (Date.now())).
 * @property {bigint} block - The block number of the activity.
 */
export interface ActivityItem {
  method: string;
  timestamp: bigint;
  block: bigint;
}

/**
 * Type for review activity items that extends the base ActivityItem interface.
 * @typedef {Object} ReviewActivityItem
 * @property {string} method - The type of activity, which is always "Review".
 * @property {string} review - The review text (max 2048 characters).
 * @property {bigint} stars - The number of stars given (1-5).
 * @property {string} from - The cosmos address of the user who gave the review.
 * @property {bigint} [collectionId] - The collection ID of the collection that was reviewed.
 * @property {string} [reviewedAddress] - The cosmos address of the user who gave the review.
 */
export interface ReviewActivityItem extends ActivityItem {
  review: string;
  stars: bigint;
  from: string;
  collectionId?: bigint;
  reviewedAddress?: string;
}

/**
 * Type for announcement activity items that extends the base ActivityItem interface.
 * @typedef {Object} AnnouncementActivityItem
 * @property {string} method - The type of activity, which is always "Announcement".
 * @property {string} announcement - The announcement text (max 2048 characters).
 * @property {string} from - The cosmos address of the user who made the announcement.
 * @property {bigint} collectionId - The collection ID of the collection that was announced.
 */
export interface AnnouncementActivityItem extends ActivityItem {
  announcement: string;
  from: string;
  collectionId: bigint;
}

/**
 * Type for transfer activity items that extends the base ActivityItem interface.
 * @typedef {Object} TransferActivityItem
 * @property {string[]} to - The list of account numbers that received the transfer.
 * @property {(string | 'Mint')[]} from - The list of account numbers that sent the transfer ('Mint' is used as a special address when minting or claiming).
 * @property {Balance[]} balances - The list of balances and badge IDs that were transferred.
 * @property {bigint} collectionId - The collection ID of the collection that was transferred.
 * @property {bigint} [claimId] - The claim ID of the claim (if method = "Claim").
 * @property {string} method - The type of activity, which can be "Transfer", "Mint", or "Claim".
 */
export interface TransferActivityItem extends ActivityItem {
  to: string[];
  from: (string | 'Mint')[];
  balances: Balance[];
  collectionId: bigint;
  claimId?: bigint;
}
