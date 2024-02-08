import { ApprovalIdentifierDetails, Balance, JSPrimitiveNumberType, convertBalance } from "bitbadgesjs-proto";
import mongoose from "mongoose";
import { NumberType } from "./string-numbers";
import { deepCopy } from "./utils";
import { Doc } from "./db";

/**
 * Activity item that serves as the base type for all activity items.
 *
 * @property {NumberType} timestamp - The timestamp of the activity.
 * @property {NumberType} block - The block number of the activity.
 * @category API / Indexer
 */
export interface ActivityInfoBase<T extends NumberType> {
  _notificationsHandled?: boolean;
  timestamp: T;
  block: T;
}
/**
 * @category API / Indexer
 */
export type ActivityDoc<T extends NumberType> = ActivityInfoBase<T> & { _docId: string, _id?: string };

/**
 * @category API / Indexer
 */
export function convertActivityDoc<T extends NumberType, U extends NumberType>(item: ActivityDoc<T>, convertFunction: (item: T) => U): ActivityDoc<U> {
  return deepCopy({
    ...item,
    timestamp: convertFunction(item.timestamp),
    block: convertFunction(item.block)
  })
}

/**
 * Type for review activity items that extends the base ActivityDoc interface.
 * @typedef {Object} ReviewInfoBase
 * @extends ActivityInfoBase
 *
 * @property {string} review - The review text (max 2048 characters).
 * @property {NumberType} stars - The number of stars given (1-5).
 * @property {string} from - The cosmos address of the user who gave the review.
 * @property {NumberType} [collectionId] - The collection ID of the collection that was reviewed.
 * @property {string} [reviewedAddress] - The cosmos address of the user who the review is for.
 * @category API / Indexer
 */
export interface ReviewInfoBase<T extends NumberType> extends ActivityInfoBase<T> {
  review: string;
  stars: T;
  from: string;
  collectionId?: T;
  reviewedAddress?: string;
}
/**
 * @category API / Indexer
 */
export type ReviewDoc<T extends NumberType> = ReviewInfoBase<T> & { _docId: string, _id?: string };

/**
 * @category API / Indexer
 */
export function convertReviewDoc<T extends NumberType, U extends NumberType>(item: ReviewDoc<T>, convertFunction: (item: T) => U): ReviewDoc<U> {
  return deepCopy({
    ...item,
    ...convertActivityDoc(item, convertFunction),
    stars: convertFunction(item.stars),
    collectionId: item.collectionId ? convertFunction(item.collectionId) : undefined
  })
}

/**
 * Type for announcement activity items that extends the base ActivityDoc interface.
 * @typedef {Object} AnnouncementInfoBase
 * @extends ActivityInfoBase
 *
 * @property {string} announcement - The announcement text (max 2048 characters).
 * @property {string} from - The cosmos address of the user who made the announcement.
 * @property {NumberType} collectionId - The collection ID of the collection that was announced.
 *
 * @category API / Indexer
 */
export interface AnnouncementInfoBase<T extends NumberType> extends ActivityInfoBase<T> {
  announcement: string;
  from: string;
  collectionId: T;
}
/**
 * @category API / Indexer
 */
export type AnnouncementDoc<T extends NumberType> = AnnouncementInfoBase<T> & { _docId: string, _id?: string };

/**
 * @category API / Indexer
 */
export function convertAnnouncementDoc<T extends NumberType, U extends NumberType>(item: AnnouncementDoc<T>, convertFunction: (item: T) => U): AnnouncementDoc<U> {
  return deepCopy({
    ...item,
    ...convertActivityDoc(item, convertFunction),

    collectionId: convertFunction(item.collectionId)
  })
}

/**
 * Type for transfer activity items that extends the base ActivityDoc interface.
 * @typedef {Object} TransferActivityInfoBase
 * @property {string[]} to - The list of account numbers that received the transfer.
 * @property {string} from - The list of account numbers that sent the transfer ('Mint' is used as a special address when minting or claiming).
 * @property {Balance<T>[]} balances - The list of balances and badge IDs that were transferred.
 * @property {NumberType} collectionId - The collection ID of the collection that was transferred.
 * @property {string} memo - The memo of the transfer.
 * @property {ApprovalIdentifierDetails} precalculateBalancesFromApproval - Which approval to use to precalculate the balances.
 * @property {ApprovalIdentifierDetails[]} prioritizedApprovals - The prioritized approvals of the transfer.
 * @property {boolean} onlyCheckPrioritizedApprovals - Whether or not to only check prioritized approvals.
 * @property {string} initiatedBy - The cosmos address of the user who initiated the transfer.
 * @property {string} [txHash] - The transaction hash of the transfer.
 *
 * @category API / Indexer
 */
export interface TransferActivityInfoBase<T extends NumberType> extends ActivityInfoBase<T> {
  to: string[];
  from: string;
  balances: Balance<T>[];
  collectionId: T;
  memo?: string;
  precalculateBalancesFromApproval?: ApprovalIdentifierDetails;
  prioritizedApprovals?: ApprovalIdentifierDetails[];
  onlyCheckPrioritizedApprovals?: boolean;

  initiatedBy: string;

  txHash?: string;
}

/**
 * @category API / Indexer
 */
export type TransferActivityDoc<T extends NumberType> = TransferActivityInfoBase<T> & { _docId: string, _id?: string };


/**
 * @category API / Indexer
 */
export function convertTransferActivityDoc<T extends NumberType, U extends NumberType>(item: TransferActivityDoc<T>, convertFunction: (item: T) => U): TransferActivityDoc<U> {
  return deepCopy({
    ...item,
    ...convertActivityDoc(item, convertFunction),

    balances: item.balances.map((x) => convertBalance(x, convertFunction)),
    collectionId: convertFunction(item.collectionId),
  })
}
/**
 * Type for list activity items that extends the base ActivityDoc interface.
 *
 * @typedef {Object} ListActivityInfoBase
 * @property {string} listId - The list ID of the list.
 * @property {boolean} [addedToList] - Whether or not the address is included in the list. Note that this could mean added to an whitelist or a blacklist
 * @property {string[]} [addresses] - The list of addresses that were added or removed from the list.
 *
 * @category API / Indexer
 */
export interface ListActivityInfoBase<T extends NumberType> extends ActivityInfoBase<T> {
  listId: string;
  addedToList?: boolean;
  addresses?: string[];
  txHash?: string;
}


/**
 * @category API / Indexer
 */
export type ListActivityDoc<T extends NumberType> = ListActivityInfoBase<T> & { _docId: string, _id?: string };


/**
 * @category API / Indexer
 */
export function convertListActivityDoc<T extends NumberType, U extends NumberType>(item: ListActivityDoc<T>, convertFunction: (item: T) => U): ListActivityDoc<U> {
  return deepCopy({
    ...item,
    ...convertActivityDoc(item, convertFunction),

  })
}

/**
 * ClaimAlertInfoBase represents a document for a claim alert.
 * This is used to alert users of a claim that has been made for them.
 *
 * @category API / Indexer
 *
 *@typedef {Object} ClaimAlertInfoBase
 *
 * @property {string} code - The code of the claim alert
 * @property {string[]} cosmosAddresses - The cosmos addresses of the users that have been alerted
 * @property {NumberType} collectionId - The collection ID of the claim alert
 * @property {NumberType} createdTimestamp - The timestamp of when this claim alert was created (milliseconds since epoch)
 * @property {string} [message] - The message of the claim alert
 */
export interface ClaimAlertInfoBase<T extends NumberType> extends ActivityInfoBase<T> {
  code?: string;
  cosmosAddresses: string[];
  collectionId: T;
  message?: string;
}

/**
 * @category API / Indexer
 */
export type ClaimAlertDoc<T extends NumberType> = ClaimAlertInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertClaimAlertDoc<T extends NumberType, U extends NumberType>(item: ClaimAlertDoc<T>, convertFunction: (item: T) => U): ClaimAlertDoc<U> {
  return deepCopy({
    ...item,
    ...convertActivityDoc(item, convertFunction),

    collectionId: convertFunction(item.collectionId),
  })
}

const { Schema } = mongoose;

export const ListActivitySchema = new Schema<ListActivityDoc<JSPrimitiveNumberType>>({
  _docId: String,
  _notificationsHandled: Boolean,
  listId: String,
  addedToList: Boolean,
  addresses: [String],
  timestamp: Schema.Types.Mixed,
  block: Schema.Types.Mixed,
  txHash: String,
});

export const TransferActivitySchema = new Schema<TransferActivityDoc<JSPrimitiveNumberType>>({
  _docId: String,
  to: [String],
  from: String,
  _notificationsHandled: Boolean,
  balances: [Schema.Types.Mixed],
  collectionId: Schema.Types.Mixed,
  timestamp: Schema.Types.Mixed,
  block: Schema.Types.Mixed,
  memo: String,
  precalculateBalancesFromApproval: Schema.Types.Mixed,
  prioritizedApprovals: [Schema.Types.Mixed],
  onlyCheckPrioritizedApprovals: Boolean,
  initiatedBy: String,
  txHash: String,
});
export const ReviewSchema = new Schema<ReviewDoc<JSPrimitiveNumberType>>({
  _docId: String,
  review: String,
  stars: Schema.Types.Mixed,
  timestamp: Schema.Types.Mixed,
  block: Schema.Types.Mixed,
  from: String,
  collectionId: Schema.Types.Mixed,
  reviewedAddress: String,
});

export const AnnouncementSchema = new Schema<AnnouncementDoc<JSPrimitiveNumberType>>({
  _docId: String,
  announcement: String,
  timestamp: Schema.Types.Mixed,
  block: Schema.Types.Mixed,
  from: String,
  collectionId: Schema.Types.Mixed,
});


export const ClaimAlertSchema = new Schema<ClaimAlertDoc<JSPrimitiveNumberType>>({
  _docId: String,
  _notificationsHandled: Boolean,
  code: String, // String type for code
  cosmosAddresses: [String], // Array of string for cosmosAddresses
  collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
  timestamp: Schema.Types.Mixed, // Mixed type for timestamp (number type)
  block: Schema.Types.Mixed, // Mixed type for block (number type)
  message: String, // String type for message
});
