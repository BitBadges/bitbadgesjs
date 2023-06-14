import { Balance, convertBalance } from "bitbadgesjs-proto";
import { NumberType } from "./string-numbers";
import { deepCopy, getCouchDBDetails, removeCouchDBDetails } from "./utils";
import nano from "nano";
import { Identified, DeletableDocument } from "./db";

export type ReviewMethod = 'Review';
export type TransferMethod = 'Transfer' | 'Mint' | 'Claim';
export type AnnouncementMethod = 'Announcement';
export type ActivityMethod = ReviewMethod | TransferMethod | AnnouncementMethod;

/**
 * Activity item that serves as the base type for all activity items.
 * @typedef {Object} ActivityInfoBase
 * @property {ActivityMethod} method - The type of activity (e.g. "Review", "Transfer", "Announcement", "Mint", "Claim").
 * @property {NumberType} timestamp - The timestamp of the activity.
 * @property {NumberType} block - The block number of the activity.
 */
export interface ActivityInfoBase<T extends NumberType> {
  method: ActivityMethod;
  timestamp: T;
  block: T;
}
export type ActivityDoc<T extends NumberType> = ActivityInfoBase<T> & nano.Document & DeletableDocument;
export type ActivityInfo<T extends NumberType> = ActivityInfoBase<T> & Identified;

export function convertActivityInfo<T extends NumberType, U extends NumberType>(item: ActivityInfo<T>, convertFunction: (item: T) => U): ActivityInfo<U> {
  return deepCopy({
    ...item,
    timestamp: convertFunction(item.timestamp),
    block: convertFunction(item.block)
  })
}

export function convertActivityDoc<T extends NumberType, U extends NumberType>(item: ActivityDoc<T>, convertFunction: (item: T) => U): ActivityDoc<U> {
  return deepCopy({
    ...getCouchDBDetails(item),
    ...convertActivityInfo(removeCouchDBDetails(item), convertFunction)
  })
}

/**
 * Type for review activity items that extends the base ActivityDoc interface.
 * @typedef {Object} ReviewInfoBase
 * @extends ActivityInfoBase
 *
 * @property {ReviewMethod} method - The type of activity, which will always be "Review".
 * @property {string} review - The review text (max 2048 characters).
 * @property {NumberType} stars - The number of stars given (1-5).
 * @property {string} from - The cosmos address of the user who gave the review.
 * @property {NumberType} [collectionId] - The collection ID of the collection that was reviewed.
 * @property {string} [reviewedAddress] - The cosmos address of the user who gave the review.
 */

export interface ReviewInfoBase<T extends NumberType> extends ActivityInfoBase<T> {
  method: ReviewMethod;
  review: string;
  stars: T;
  from: string;
  collectionId?: T;
  reviewedAddress?: string;
}
export type ReviewDoc<T extends NumberType> = ReviewInfoBase<T> & nano.Document & DeletableDocument;
export type ReviewInfo<T extends NumberType> = ReviewInfoBase<T> & Identified;

export function convertReviewInfo<T extends NumberType, U extends NumberType>(item: ReviewInfo<T>, convertFunction: (item: T) => U): ReviewInfo<U> {
  return deepCopy({
    ...item,
    ...convertActivityInfo(item, convertFunction),
    method: item.method,
    stars: convertFunction(item.stars),
    collectionId: item.collectionId ? convertFunction(item.collectionId) : undefined
  })
}

export function convertReviewDoc<T extends NumberType, U extends NumberType>(item: ReviewDoc<T>, convertFunction: (item: T) => U): ReviewDoc<U> {
  return deepCopy({
    ...getCouchDBDetails(item),
    ...convertReviewInfo(removeCouchDBDetails(item), convertFunction)
  })
}

/**
 * Type for announcement activity items that extends the base ActivityDoc interface.
 * @typedef {Object} AnnouncementInfoBase
 * @extends ActivityInfoBase
 *
 * @property {AnnouncementMethod} method - The type of activity, which is always "Announcement".
 * @property {string} announcement - The announcement text (max 2048 characters).
 * @property {string} from - The cosmos address of the user who made the announcement.
 * @property {NumberType} collectionId - The collection ID of the collection that was announced.
 */
export interface AnnouncementInfoBase<T extends NumberType> extends ActivityInfoBase<T> {
  method: AnnouncementMethod;
  announcement: string;
  from: string;
  collectionId: T;
}
export type AnnouncementDoc<T extends NumberType> = AnnouncementInfoBase<T> & nano.Document & DeletableDocument;
export type AnnouncementInfo<T extends NumberType> = AnnouncementInfoBase<T> & Identified;

export function convertAnnouncementDoc<T extends NumberType, U extends NumberType>(item: AnnouncementDoc<T>, convertFunction: (item: T) => U): AnnouncementDoc<U> {
  return deepCopy({
    ...getCouchDBDetails(item),
    ...convertAnnouncementInfo(removeCouchDBDetails(item), convertFunction)
  })
}

export function convertAnnouncementInfo<T extends NumberType, U extends NumberType>(item: AnnouncementInfo<T>, convertFunction: (item: T) => U): AnnouncementInfo<U> {
  return deepCopy({
    ...item,
    ...convertActivityInfo(item, convertFunction),
    method: item.method,
    collectionId: convertFunction(item.collectionId)
  })
}

/**
 * Type for transfer activity items that extends the base ActivityDoc interface.
 * @typedef {Object} TransferActivityInfoBase
 * @property {string[]} to - The list of account numbers that received the transfer.
 * @property {(string | 'Mint')[]} from - The list of account numbers that sent the transfer ('Mint' is used as a special address when minting or claiming).
 * @property {Balance[]} balances - The list of balances and badge IDs that were transferred.
 * @property {NumberType} collectionId - The collection ID of the collection that was transferred.
 * @property {NumberType} [claimId] - The claim ID of the claim (if method = "Claim").
 * @property {TransferMethod} method - The type of activity, which can be "Transfer", "Mint", or "Claim".
 */
export interface TransferActivityInfoBase<T extends NumberType> extends ActivityInfoBase<T> {
  method: TransferMethod;
  to: string[];
  from: (string | 'Mint')[];
  balances: Balance<T>[];
  collectionId: T;
  claimId?: T;
}
export type TransferActivityDoc<T extends NumberType> = TransferActivityInfoBase<T> & nano.Document & DeletableDocument;
export type TransferActivityInfo<T extends NumberType> = TransferActivityInfoBase<T> & Identified;

export function convertTransferActivityDoc<T extends NumberType, U extends NumberType>(item: TransferActivityDoc<T>, convertFunction: (item: T) => U): TransferActivityDoc<U> {
  return deepCopy({
    ...getCouchDBDetails(item),
    ...convertTransferActivityInfo(removeCouchDBDetails(item), convertFunction)
  })
}

export function convertTransferActivityInfo<T extends NumberType, U extends NumberType>(item: TransferActivityInfo<T>, convertFunction: (item: T) => U): TransferActivityInfo<U> {
  return deepCopy({
    ...item,
    ...convertActivityInfo(item, convertFunction),
    method: item.method,
    balances: item.balances.map((x) => convertBalance(x, convertFunction)),
    collectionId: convertFunction(item.collectionId),
    claimId: item.claimId ? convertFunction(item.claimId) : undefined
  })
}
