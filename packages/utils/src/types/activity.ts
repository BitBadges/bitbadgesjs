import { Balance, convertBalance } from "bitbadgesjs-proto";
import { NumberType, StringNumber } from "./string-numbers";
import { deepCopy } from "./utils";

export type ReviewMethod = 'Review';
export type TransferMethod = 'Transfer' | 'Mint' | 'Claim';
export type AnnouncementMethod = 'Announcement';
export type ActivityMethod = ReviewMethod | TransferMethod | AnnouncementMethod;

/**
 * Activity item that serves as the base type for all activity items.
 * @typedef {Object} ActivityItem
 * @property {ActivityMethod} method - The type of activity (e.g. "Review", "Transfer", "Announcement", "Mint", "Claim").
 * @property {NumberType} timestamp - The timestamp of the activity.
 * @property {NumberType} block - The block number of the activity.
 */

export interface ActivityItem<T extends NumberType> {
  method: ActivityMethod;
  timestamp: T;
  block: T;
}

export type b_ActivityItem = ActivityItem<bigint>;
export type s_ActivityItem = ActivityItem<string>;
export type n_ActivityItem = ActivityItem<number>;
export type d_ActivityItem = ActivityItem<StringNumber>;

export function convertActivityItem<T extends NumberType, U extends NumberType>(item: ActivityItem<T>, convertFunction: (item: T) => U): ActivityItem<U> {
  return deepCopy({
    ...item,
    timestamp: convertFunction(item.timestamp),
    block: convertFunction(item.block)
  })
}

/**
 * Type for review activity items that extends the base ActivityItem interface.
 * @typedef {Object} ReviewActivityItem
 * @extends ActivityItem
 *
 * @property {ReviewMethod} method - The type of activity, which will always be "Review".
 * @property {string} review - The review text (max 2048 characters).
 * @property {NumberType} stars - The number of stars given (1-5).
 * @property {string} from - The cosmos address of the user who gave the review.
 * @property {NumberType} [collectionId] - The collection ID of the collection that was reviewed.
 * @property {string} [reviewedAddress] - The cosmos address of the user who gave the review.
 */

export interface ReviewActivityItem<T extends NumberType> extends ActivityItem<T> {
  method: ReviewMethod;
  review: string;
  stars: T;
  from: string;
  collectionId?: T;
  reviewedAddress?: string;
}

export type b_ReviewActivityItem = ReviewActivityItem<bigint>;
export type s_ReviewActivityItem = ReviewActivityItem<string>;
export type n_ReviewActivityItem = ReviewActivityItem<number>;
export type d_ReviewActivityItem = ReviewActivityItem<StringNumber>;

export function convertReviewActivityItem<T extends NumberType, U extends NumberType>(item: ReviewActivityItem<T>, convertFunction: (item: T) => U): ReviewActivityItem<U> {
  return deepCopy({
    ...item,
    ...convertActivityItem(item, convertFunction),
    method: item.method,
    stars: convertFunction(item.stars),
    collectionId: item.collectionId ? convertFunction(item.collectionId) : undefined
  })
}

/**
 * Type for announcement activity items that extends the base ActivityItem interface.
 * @typedef {Object} AnnouncementActivityItem
 * @extends ActivityItem
 *
 * @property {AnnouncementMethod} method - The type of activity, which is always "Announcement".
 * @property {string} announcement - The announcement text (max 2048 characters).
 * @property {string} from - The cosmos address of the user who made the announcement.
 * @property {NumberType} collectionId - The collection ID of the collection that was announced.
 */
export interface AnnouncementActivityItem<T extends NumberType> extends ActivityItem<T> {
  method: AnnouncementMethod;
  announcement: string;
  from: string;
  collectionId: T;
}

export type b_AnnouncementActivityItem = AnnouncementActivityItem<bigint>;
export type s_AnnouncementActivityItem = AnnouncementActivityItem<string>;
export type n_AnnouncementActivityItem = AnnouncementActivityItem<number>;
export type d_AnnouncementActivityItem = AnnouncementActivityItem<StringNumber>;

export function convertAnnouncementActivityItem<T extends NumberType, U extends NumberType>(item: AnnouncementActivityItem<T>, convertFunction: (item: T) => U): AnnouncementActivityItem<U> {
  return deepCopy({
    ...item,
    ...convertActivityItem(item, convertFunction),
    method: item.method,
    collectionId: convertFunction(item.collectionId)
  })
}

/**
 * Type for transfer activity items that extends the base ActivityItem interface.
 * @typedef {Object} TransferActivityItem
 * @property {string[]} to - The list of account numbers that received the transfer.
 * @property {(string | 'Mint')[]} from - The list of account numbers that sent the transfer ('Mint' is used as a special address when minting or claiming).
 * @property {Balance[]} balances - The list of balances and badge IDs that were transferred.
 * @property {NumberType} collectionId - The collection ID of the collection that was transferred.
 * @property {NumberType} [claimId] - The claim ID of the claim (if method = "Claim").
 * @property {TransferMethod} method - The type of activity, which can be "Transfer", "Mint", or "Claim".
 */
export interface TransferActivityItem<T extends NumberType> extends ActivityItem<T> {
  method: TransferMethod;
  to: string[];
  from: (string | 'Mint')[];
  balances: Balance<T>[];
  collectionId: T;
  claimId?: T;
}

export type b_TransferActivityItem = TransferActivityItem<bigint>;
export type s_TransferActivityItem = TransferActivityItem<string>;
export type n_TransferActivityItem = TransferActivityItem<number>;
export type d_TransferActivityItem = TransferActivityItem<StringNumber>;

export function convertTransferActivityItem<T extends NumberType, U extends NumberType>(item: TransferActivityItem<T>, convertFunction: (item: T) => U): TransferActivityItem<U> {
  return deepCopy({
    ...item,
    ...convertActivityItem(item, convertFunction),
    method: item.method,
    balances: item.balances.map((x) => convertBalance(x, convertFunction)),
    collectionId: convertFunction(item.collectionId),
    claimId: item.claimId ? convertFunction(item.claimId) : undefined
  })
}
