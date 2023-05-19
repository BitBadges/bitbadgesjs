import { Balance, BalanceBase, convertFromBalance, convertToBalance, s_Balance } from "bitbadgesjs-proto";

/**
 * Activity item that serves as the base type for all activity items.
 * @typedef {Object} ActivityItemBase
 * @property {string} method - The type of activity (e.g. "Review", "Transfer", "Announcement", "Mint", "Claim").
 * @property {bigint | string} timestamp - The timestamp of the activity (in milliseconds since the UNIX epoch (Date.now())).
 * @property {bigint | string} block - The block number of the activity.
 */
export interface ActivityItemBase {
  method: string;
  timestamp: bigint | string;
  block: bigint | string;
}

/**
 * Activity item that serves as the base type for all activity items.
 * @typedef {Object} ActivityItem
 * @extends ActivityItemBase
 */
export interface ActivityItem extends ActivityItemBase {
  timestamp: bigint;
  block: bigint;
}

/**
 * Activity item that serves as the base type for all activity items.
 * @typedef {Object} s_ActivityItem
 * @extends ActivityItemBase
 */
export interface s_ActivityItem extends ActivityItemBase {
  timestamp: string;
  block: string;
}

/**
 * Function that converts from s_ActivityItem to ActivityItem.
 */
export function convertToActivityItem(s_item: s_ActivityItem): ActivityItem {
  return {
    ...s_item,
    timestamp: BigInt(s_item.timestamp),
    block: BigInt(s_item.block)
  }
}

/**
 * Function that converts from ActivityItem to s_ActivityItem.
 */
export function convertFromActivityItem(item: ActivityItem): s_ActivityItem {
  return {
    ...item,
    timestamp: item.timestamp.toString(),
    block: item.block.toString()
  }
}


/**
 * Type for review activity items that extends the base ActivityItem interface.
 * @typedef {Object} ReviewActivityItemBase
 * @extends ActivityItemBase
 *
 * @property {string} method - The type of activity, which is always "Review".
 * @property {string} review - The review text (max 2048 characters).
 * @property {bigint | string} stars - The number of stars given (1-5).
 * @property {string} from - The cosmos address of the user who gave the review.
 * @property {bigint | string} [collectionId] - The collection ID of the collection that was reviewed.
 * @property {string} [reviewedAddress] - The cosmos address of the user who gave the review.
 */
export interface ReviewActivityItemBase extends ActivityItemBase {
  review: string;
  stars: bigint | string;
  from: string;
  collectionId?: bigint | string;
  reviewedAddress?: string;
}

/**
 * Type for review activity items that extends the base ActivityItem interface.
 *
 * @typedef {Object} ReviewActivityItem
 * @extends ReviewActivityItemBase
 *
 * @see ReviewActivityItemBase
 */
export interface ReviewActivityItem extends ActivityItem {
  review: string;
  from: string;
  reviewedAddress?: string;

  collectionId?: bigint;
  stars: bigint;
}

/**
 * Type for review activity items that extends the base ActivityItem interface.
 *
 * @typedef {Object} s_ReviewActivityItem
 * @extends ReviewActivityItemBase
 *
 * @see ReviewActivityItemBase
 */
export interface s_ReviewActivityItem extends s_ActivityItem {
  review: string;
  from: string;
  reviewedAddress?: string;

  collectionId?: string;
  stars: string;
}

/**
 * Function that converts from s_ReviewActivityItem to ReviewActivityItem.
 */
export function convertToReviewActivityItem(s_item: s_ReviewActivityItem): ReviewActivityItem {
  return {
    ...s_item,
    stars: BigInt(s_item.stars),
    collectionId: s_item.collectionId ? BigInt(s_item.collectionId) : undefined,
    timestamp: BigInt(s_item.timestamp),
    block: BigInt(s_item.block)
  }
}
/**
 * Function that converts from ReviewActivityItem to s_ReviewActivityItem.
 */
export function convertFromReviewActivityItem(item: ReviewActivityItem): s_ReviewActivityItem {
  return {
    ...item,
    stars: item.stars.toString(),
    collectionId: item.collectionId ? item.collectionId.toString() : undefined,
    timestamp: item.timestamp.toString(),
    block: item.block.toString()
  }
}


/**
 * Type for announcement activity items that extends the base ActivityItem interface.
 * @typedef {Object} AnnouncementActivityItemBase
 * @extends ActivityItemBase
 *
 * @property {string} method - The type of activity, which is always "Announcement".
 * @property {string} announcement - The announcement text (max 2048 characters).
 * @property {string} from - The cosmos address of the user who made the announcement.
 * @property {bigint | string} collectionId - The collection ID of the collection that was announced.
 */
export interface AnnouncementActivityItemBase extends ActivityItemBase {
  announcement: string;
  from: string;
  collectionId: bigint | string;
}

/**
 * Type for announcement activity items that extends the base ActivityItem interface.
 * @typedef {Object} AnnouncementActivityItem
 * @extends AnnouncementActivityItemBase
 *
 * @see AnnouncementActivityItemBase
 */
export interface AnnouncementActivityItem extends ActivityItem {
  announcement: string;
  from: string;
  collectionId: bigint;
}

/**
 * Type for announcement activity items that extends the base ActivityItem interface.
 * @typedef {Object} s_AnnouncementActivityItem
 * @extends AnnouncementActivityItemBase
 *
 * @see AnnouncementActivityItemBase
 */
export interface s_AnnouncementActivityItem extends s_ActivityItem {
  announcement: string;
  from: string;
  collectionId: string;
}

/**
 * Function that converts from s_AnnouncementActivityItem to AnnouncementActivityItem.
 */
export function convertToAnnouncementActivityItem(s_item: s_AnnouncementActivityItem): AnnouncementActivityItem {
  return {
    ...s_item,
    collectionId: BigInt(s_item.collectionId),
    timestamp: BigInt(s_item.timestamp),
    block: BigInt(s_item.block)
  }
}

/**
 * Function that converts from AnnouncementActivityItem to s_AnnouncementActivityItem.
 */
export function convertFromAnnouncementActivityItem(item: AnnouncementActivityItem): s_AnnouncementActivityItem {
  return {
    ...item,
    collectionId: item.collectionId.toString(),
    timestamp: item.timestamp.toString(),
    block: item.block.toString()
  }
}

/**
 * Type for transfer activity items that extends the base ActivityItem interface.
 * @typedef {Object} TransferActivityItemBase
 * @property {string[]} to - The list of account numbers that received the transfer.
 * @property {(string | 'Mint')[]} from - The list of account numbers that sent the transfer ('Mint' is used as a special address when minting or claiming).
 * @property {Balance[]} balances - The list of balances and badge IDs that were transferred.
 * @property {bigint | string} collectionId - The collection ID of the collection that was transferred.
 * @property {bigint | string} [claimId] - The claim ID of the claim (if method = "Claim").
 * @property {string} method - The type of activity, which can be "Transfer", "Mint", or "Claim".
 */
export interface TransferActivityItemBase extends ActivityItemBase {
  to: string[];
  from: (string | 'Mint')[];
  balances: BalanceBase[];
  collectionId: bigint | string;
  claimId?: bigint | string;
}

/**
 * Type for transfer activity items that extends the base ActivityItem interface.
 *
 * @typedef {Object} s_TransferActivityItem
 * @extends TransferActivityItemBase
 *
 * @see TransferActivityItemBase
 */
export interface s_TransferActivityItem extends s_ActivityItem {
  to: string[];
  from: (string | 'Mint')[];
  collectionId: string;
  claimId?: string;
  balances: s_Balance[];
}

/**
 * Type for transfer activity items that extends the base ActivityItem interface.
 *
 * @typedef {Object} TransferActivityItem
 * @extends TransferActivityItemBase
 *
 * @see TransferActivityItemBase
 */
export interface TransferActivityItem extends ActivityItem {
  to: string[];
  from: (string | 'Mint')[];
  collectionId: bigint;
  claimId?: bigint;
  balances: Balance[];
}

export function convertToTransferActivityItem(s_item: s_TransferActivityItem): TransferActivityItem {
  return {
    ...s_item,
    collectionId: BigInt(s_item.collectionId),
    claimId: s_item.claimId ? BigInt(s_item.claimId) : undefined,
    balances: s_item.balances.map(b => convertToBalance(b)),
    timestamp: BigInt(s_item.timestamp),
    block: BigInt(s_item.block)
  }
}

export function convertFromTransferActivityItem(item: TransferActivityItem): s_TransferActivityItem {
  return {
    ...item,
    collectionId: item.collectionId.toString(),
    claimId: item.claimId ? item.claimId.toString() : undefined,
    balances: item.balances.map(b => convertFromBalance(b)),
    timestamp: item.timestamp.toString(),
    block: item.block.toString()
  }
}
