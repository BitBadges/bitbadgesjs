import { BalanceWithType, convertBalance } from "bitbadgesjs-proto";
import { NumberType, StringNumber } from "./string-numbers";

export type ReviewMethod = 'Review';
export type TransferMethod = 'Transfer' | 'Mint' | 'Claim';
export type AnnouncementMethod = 'Announcement';
export type ActivityMethod = ReviewMethod | TransferMethod | AnnouncementMethod;

/**
 * Activity item that serves as the base type for all activity items.
 * @typedef {Object} ActivityItemWithType
 * @property {ActivityMethod} method - The type of activity (e.g. "Review", "Transfer", "Announcement", "Mint", "Claim").
 * @property {NumberType} timestamp - The timestamp of the activity.
 * @property {NumberType} block - The block number of the activity.
 */

export interface ActivityItemWithType<T extends NumberType> {
  method: ActivityMethod;
  timestamp: T;
  block: T;
}

export type ActivityItem = ActivityItemWithType<bigint>;
export type s_ActivityItem = ActivityItemWithType<string>;
export type n_ActivityItem = ActivityItemWithType<number>;
export type d_ActivityItem = ActivityItemWithType<StringNumber>;

export function convertActivityItem<T extends NumberType, U extends NumberType>(item: ActivityItemWithType<T>, convertFunction: (item: T) => U): ActivityItemWithType<U> {
  return {
    ...item,
    timestamp: convertFunction(item.timestamp),
    block: convertFunction(item.block)
  }
}

/**
 * Type for review activity items that extends the base ActivityItem interface.
 * @typedef {Object} ReviewActivityItemWithType
 * @extends ActivityItemWithType
 *
 * @property {ReviewMethod} method - The type of activity, which will always be "Review".
 * @property {string} review - The review text (max 2048 characters).
 * @property {NumberType} stars - The number of stars given (1-5).
 * @property {string} from - The cosmos address of the user who gave the review.
 * @property {NumberType} [collectionId] - The collection ID of the collection that was reviewed.
 * @property {string} [reviewedAddress] - The cosmos address of the user who gave the review.
 */

export interface ReviewActivityItemWithType<T extends NumberType> extends ActivityItemWithType<T> {
  method: ReviewMethod;
  review: string;
  stars: T;
  from: string;
  collectionId?: T;
  reviewedAddress?: string;
}

export type ReviewActivityItem = ReviewActivityItemWithType<bigint>;
export type s_ReviewActivityItem = ReviewActivityItemWithType<string>;
export type n_ReviewActivityItem = ReviewActivityItemWithType<number>;
export type d_ReviewActivityItem = ReviewActivityItemWithType<StringNumber>;

export function convertReviewActivityItem<T extends NumberType, U extends NumberType>(item: ReviewActivityItemWithType<T>, convertFunction: (item: T) => U): ReviewActivityItemWithType<U> {
  return {
    ...item,
    ...convertActivityItem(item, convertFunction),
    method: item.method,
    stars: convertFunction(item.stars),
    collectionId: item.collectionId ? convertFunction(item.collectionId) : undefined
  }
}

/**
 * Type for announcement activity items that extends the base ActivityItem interface.
 * @typedef {Object} AnnouncementActivityItemWithType
 * @extends ActivityItemWithType
 *
 * @property {AnnouncementMethod} method - The type of activity, which is always "Announcement".
 * @property {string} announcement - The announcement text (max 2048 characters).
 * @property {string} from - The cosmos address of the user who made the announcement.
 * @property {NumberType} collectionId - The collection ID of the collection that was announced.
 */
export interface AnnouncementActivityItemWithType<T extends NumberType> extends ActivityItemWithType<T> {
  method: AnnouncementMethod;
  announcement: string;
  from: string;
  collectionId: T;
}

export type AnnouncementActivityItem = AnnouncementActivityItemWithType<bigint>;
export type s_AnnouncementActivityItem = AnnouncementActivityItemWithType<string>;
export type n_AnnouncementActivityItem = AnnouncementActivityItemWithType<number>;
export type d_AnnouncementActivityItem = AnnouncementActivityItemWithType<StringNumber>;

export function convertAnnouncementActivityItem<T extends NumberType, U extends NumberType>(item: AnnouncementActivityItemWithType<T>, convertFunction: (item: T) => U): AnnouncementActivityItemWithType<U> {
  return {
    ...item,
    ...convertActivityItem(item, convertFunction),
    method: item.method,
    collectionId: convertFunction(item.collectionId)
  }
}

/**
 * Type for transfer activity items that extends the base ActivityItem interface.
 * @typedef {Object} TransferActivityItemWithType
 * @property {string[]} to - The list of account numbers that received the transfer.
 * @property {(string | 'Mint')[]} from - The list of account numbers that sent the transfer ('Mint' is used as a special address when minting or claiming).
 * @property {BalanceWithType[]} balances - The list of balances and badge IDs that were transferred.
 * @property {NumberType} collectionId - The collection ID of the collection that was transferred.
 * @property {NumberType} [claimId] - The claim ID of the claim (if method = "Claim").
 * @property {TransferMethod} method - The type of activity, which can be "Transfer", "Mint", or "Claim".
 */
export interface TransferActivityItemWithType<T extends NumberType> extends ActivityItemWithType<T> {
  method: TransferMethod;
  to: string[];
  from: (string | 'Mint')[];
  balances: BalanceWithType<T>[];
  collectionId: T;
  claimId?: T;
}

export type TransferActivityItem = TransferActivityItemWithType<bigint>;
export type s_TransferActivityItem = TransferActivityItemWithType<string>;
export type n_TransferActivityItem = TransferActivityItemWithType<number>;
export type d_TransferActivityItem = TransferActivityItemWithType<StringNumber>;

export function convertTransferActivityItem<T extends NumberType, U extends NumberType>(item: TransferActivityItemWithType<T>, convertFunction: (item: T) => U): TransferActivityItemWithType<U> {
  return {
    ...item,
    ...convertActivityItem(item, convertFunction),
    method: item.method,
    balances: item.balances.map((x) => convertBalance(x, convertFunction)),
    collectionId: convertFunction(item.collectionId),
    claimId: item.claimId ? convertFunction(item.claimId) : undefined
  }
}
