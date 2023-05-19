import { s_UserBalance } from "bitbadgesjs-proto"
import nano from "nano"
import { AnnouncementActivityItem, AnnouncementActivityItemBase, convertFromAnnouncementActivityItem, convertFromReviewActivityItem, convertFromTransferActivityItem, convertToAnnouncementActivityItem, convertToReviewActivityItem, convertToTransferActivityItem, ReviewActivityItem, ReviewActivityItemBase, s_AnnouncementActivityItem, s_ReviewActivityItem, s_TransferActivityItem, TransferActivityItem, TransferActivityItemBase } from "./activity"
import { Account, AccountBase, BalanceDocument, BalanceDocumentBase, ClaimDocument, Collection, convertFromBalanceDocument, convertFromClaimDocument, convertToBalanceDocument, convertToClaimDocument, s_Account, s_BalanceDocument, s_ClaimDocument, s_Collection, s_MetadataDoc } from "./db"
import { Metadata } from "./metadata"
import { MetadataMap } from "./types"


/**
 * Type for CouchDB pagination information.
 * @typedef {Object} PaginationInfo
 * @property {string} bookmark - The bookmark to be used to fetch the next X documents. Initially, bookmark should be '' (empty string) to fetch the first X documents. Each time the next X documents are fetched, the bookmark should be updated to the bookmark returned by the previous fetch.
 * @property {boolean} hasMore - Indicates whether there are more documents to be fetched. Once hasMore is false, all documents have been fetched.
 */
export interface PaginationInfo {
  bookmark: string,
  hasMore: boolean,
}

/**
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'badge' }).
 *
 * @typedef {Object} CoinBase
 * @property {bigint | string} amount - The amount of the coin.
 * @property {string} denom - The denomination of the coin.
 */
export interface CoinBase {
  amount: bigint | string,
  denom: string,
}

/**
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'badge' }).
 * @typedef {Object} Coin
 * @extends {CoinBase}
 *
 * @see CoinBase
 */
export interface Coin extends CoinBase {
  amount: bigint,
}

/**
 * Type for Cosmos SDK Coin information with support for bigint amounts (e.g. { amount: 1000000, denom: 'badge' }).
 * @typedef {Object} s_Coin
 * @extends {CoinBase}
 *
 * @see CoinBase
 */
export interface s_Coin extends CoinBase {
  amount: string,
}

export function convertToCoin(s_item: s_Coin): Coin {
  return {
    ...s_item,
    amount: BigInt(s_item.amount),
  }
}

export function convertFromCoin(item: Coin): s_Coin {
  return {
    ...item,
    amount: item.amount.toString(),
  }
}

/**
 * BitBadgesUserInfo is the type for accounts returned by the BitBadges API
 *
 * @typedef {Object} BitBadgesUserInfoBase
 * @extends {AccountBase}
 *
 * @property {string} [resolvedName] - The resolved name of the account (e.g. ENS name).
 * @property {string} [avatar] - The avatar of the account.
 * @property {CoinBase} [balance] - The balance of the account ($BADGE).
 * @property {boolean} [airdropped] - Indicates whether the account has claimed their airdrop.
 * @property {BalanceDocument[]} collected - A list of badges that the account has collected.
 * @property {TransferActivityItem[]} activity - A list of transfer activity items for the account.
 * @property {AnnouncementActivityItem[]} announcements - A list of announcement activity items for the account.
 * @property {ReviewActivityItem[]} reviews - A list of review activity items for the account.
 * @property {PaginationInfo} pagination - Pagination information for each of the profile information.
 *
 * @remarks
 * collected, activity, announcements, and reviews are profile information that is dynamically loaded as needed from the API.
 * The pagination object holds the bookmark and hasMore information for each of collected, activity, announcements, and reviews.
 *
 * For typical fetches, collected, activity, announcements, and reviews will be empty arrays and are to be loaded as needed (pagination will be set to hasMore == true).
 */
export interface BitBadgesUserInfoBase extends AccountBase {
  resolvedName?: string
  avatar?: string

  balance?: CoinBase
  airdropped?: boolean

  //Dynamically loaded as needed
  collected: BalanceDocumentBase[],
  activity: TransferActivityItemBase[],
  announcements: AnnouncementActivityItemBase[],
  reviews: ReviewActivityItemBase[],
  pagination: {
    activity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  },
}


/**
 * BitBadgesUserInfo is the type for accounts returned by the BitBadges API
 *
 * @typedef {Object} BitBadgesUserInfo
 * @extends {Account}
 *
 * @property {string} [resolvedName] - The resolved name of the account (e.g. ENS name).
 * @property {string} [avatar] - The avatar of the account.
 * @property {Coin} [balance] - The balance of the account ($BADGE).
 * @property {boolean} [airdropped] - Indicates whether the account has claimed their airdrop.
 * @property {BalanceDocument[]} collected - A list of badges that the account has collected.
 * @property {TransferActivityItem[]} activity - A list of transfer activity items for the account.
 * @property {AnnouncementActivityItem[]} announcements - A list of announcement activity items for the account.
 * @property {ReviewActivityItem[]} reviews - A list of review activity items for the account.
 * @property {PaginationInfo} pagination - Pagination information for each of the profile information.
 *
 * @remarks
 * collected, activity, announcements, and reviews are profile information that is dynamically loaded as needed from the API.
 * The pagination object holds the bookmark and hasMore information for each of collected, activity, announcements, and reviews.
 *
 * For typical fetches, collected, activity, announcements, and reviews will be empty arrays and are to be loaded as needed (pagination will be set to hasMore == true).
 */
export interface BitBadgesUserInfo extends Account {
  resolvedName?: string
  avatar?: string

  balance?: Coin
  airdropped?: boolean

  //Dynamically loaded as needed
  collected: BalanceDocument[],
  activity: TransferActivityItem[],
  announcements: AnnouncementActivityItem[],
  reviews: ReviewActivityItem[],
  pagination: {
    activity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  },
}

/**
 * s_BitBadgesUserInfo is the type for accounts returned by the BitBadges API
 *
 * @typedef {Object} s_BitBadgesUserInfo
 * @extends {s_Account}
 *
 * @property {string} [resolvedName] - The resolved name of the account (e.g. ENS name).
 * @property {string} [avatar] - The avatar of the account.
 * @property {s_Coin} [balance] - The balance of the account ($BADGE).
 * @property {boolean} [airdropped] - Indicates whether the account has claimed their airdrop.
 * @property {BalanceDocument[]} collected - A list of badges that the account has collected.
 * @property {TransferActivityItem[]} activity - A list of transfer activity items for the account.
 * @property {AnnouncementActivityItem[]} announcements - A list of announcement activity items for the account.
 * @property {ReviewActivityItem[]} reviews - A list of review activity items for the account.
 * @property {PaginationInfo} pagination - Pagination information for each of the profile information.
 *
 * @remarks
 * collected, activity, announcements, and reviews are profile information that is dynamically loaded as needed from the API.
 * The pagination object holds the bookmark and hasMore information for each of collected, activity, announcements, and reviews.
 *
 * For typical fetches, collected, activity, announcements, and reviews will be empty arrays and are to be loaded as needed (pagination will be set to hasMore == true).
 */
export interface s_BitBadgesUserInfo extends s_Account {
  resolvedName?: string
  avatar?: string

  balance?: s_Coin
  airdropped?: boolean

  //Dynamically loaded as needed
  collected: s_BalanceDocument[],
  activity: s_TransferActivityItem[],
  announcements: s_AnnouncementActivityItem[],
  reviews: s_ReviewActivityItem[],
  pagination: {
    activity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  },
}

export function convertToBitBadgesUserInfo(s_item: s_BitBadgesUserInfo): BitBadgesUserInfo {
  return {
    ...s_item,
    balance: s_item.balance ? convertToCoin(s_item.balance) : undefined,
    collected: s_item.collected.map(convertToBalanceDocument),
    activity: s_item.activity.map(convertToTransferActivityItem),
    announcements: s_item.announcements.map(convertToAnnouncementActivityItem),
    reviews: s_item.reviews.map(convertToReviewActivityItem),
    accountNumber: BigInt(s_item.accountNumber),
    createdAt: s_item.createdAt ? BigInt(s_item.createdAt) : undefined,
    seenActivity: s_item.seenActivity ? BigInt(s_item.seenActivity) : undefined,
  }
}

export function convertFromBitBadgesUserInfo(item: BitBadgesUserInfo): s_BitBadgesUserInfo {
  return {
    ...item,
    balance: item.balance ? convertFromCoin(item.balance) : undefined,
    collected: item.collected.map(convertFromBalanceDocument),
    activity: item.activity.map(convertFromTransferActivityItem),
    announcements: item.announcements.map(convertFromAnnouncementActivityItem),
    reviews: item.reviews.map(convertFromReviewActivityItem),
    accountNumber: item.accountNumber.toString(),
    createdAt: item.createdAt ? item.createdAt.toString() : undefined,
    seenActivity: item.seenActivity ? item.seenActivity.toString() : undefined,
  }
}

/**
 * BitBadgeCollection is the type of document for collections returned by the BitBadges API
 *
 * @typedef {Object} BitBadgeCollection
 * @extends {Collection} The base collection document
 *
 * @property {BitBadgesUserInfo} managerInfo - The account information of the manager of this collection
 * @property {Metadata} collectionMetadata - The metadata of this collection
 * @property {MetadataMap} badgeMetadata - The metadata of each badge in this collection stored in a map
 * @property {TransferActivityItem[]} activity - The transfer activity of this collection
 * @property {AnnouncementActivityItem[]} announcements - The announcement activity of this collection
 * @property {ReviewActivityItem[]} reviews - The review activity of this collection
 * @property {BalanceDocument[]} balances - The badge balances of this collection
 * @property {ClaimDocument[]} claims - The claims of this collection
 *
 * @remarks
 * Note that the collectionMetadata, badgeMetadata, activity, announcements, reviews, claims, and balances fields are
 * dynamically fetched from the DB as needed. They may be empty or missing information when the collection is first fetched.
 * You are responsible for fetching the missing information as needed from the corresponding API routes.
 *
 * @see
 * Use updateMetadataMap to update the metadata fields.
 */
export interface BitBadgeCollection extends Collection {
  managerInfo: BitBadgesUserInfo;

  //The following are to be fetched dynamically and as needed from the DB
  collectionMetadata: Metadata,
  badgeMetadata: MetadataMap,
  activity: TransferActivityItem[],
  announcements: AnnouncementActivityItem[],
  reviews: ReviewActivityItem[],
  balances: BalanceDocument[],
  claims: ClaimDocument[],
}

/**
 * s_BitBadgeCollection is the type of document for collections returned by the BitBadges API
 *
 * @typedef {Object} s_BitBadgeCollection
 * @extends {s_Collection} The base collection document
 *
 * @see {BitBadgeCollection}
 */
export interface s_BitBadgeCollection extends s_Collection {
  managerInfo: s_BitBadgesUserInfo;

  //The following are to be fetched dynamically and as needed from the DB
  collectionMetadata: Metadata,
  badgeMetadata: MetadataMap,
  activity: s_TransferActivityItem[],
  announcements: s_AnnouncementActivityItem[],
  reviews: s_ReviewActivityItem[],
  balances: s_BalanceDocument[],
  claims: s_ClaimDocument[],
}

export function convertToBitBadgeCollection(s_item: s_BitBadgeCollection): BitBadgeCollection {
  return {
    ...s_item,
    managerInfo: convertToBitBadgesUserInfo(s_item.managerInfo),
    activity: s_item.activity.map(convertToTransferActivityItem),
    announcements: s_item.announcements.map(convertToAnnouncementActivityItem),
    reviews: s_item.reviews.map(convertToReviewActivityItem),
    balances: s_item.balances.map(convertToBalanceDocument),
    claims: s_item.claims.map(convertToClaimDocument),
    collectionId: BigInt(s_item.collectionId),
    nextBadgeId: BigInt(s_item.nextBadgeId),
    nextClaimId: BigInt(s_item.nextClaimId),
    standard: BigInt(s_item.standard),
    createdBlock: BigInt(s_item.createdBlock),
  }
}

export function convertFromBitBadgeCollection(item: BitBadgeCollection): s_BitBadgeCollection {
  return {
    ...item,
    managerInfo: convertFromBitBadgesUserInfo(item.managerInfo),
    activity: item.activity.map(convertFromTransferActivityItem),
    announcements: item.announcements.map(convertFromAnnouncementActivityItem),
    reviews: item.reviews.map(convertFromReviewActivityItem),
    balances: item.balances.map(convertFromBalanceDocument),
    claims: item.claims.map(convertFromClaimDocument),
    collectionId: item.collectionId.toString(),
    nextBadgeId: item.nextBadgeId.toString(),
    nextClaimId: item.nextClaimId.toString(),
    standard: item.standard.toString(),
    createdBlock: item.createdBlock.toString(),
  }
}

/**
 * Information returned by the REST API getAccount route
 *
 * Note this should be converted into Account or BitBadgesUserInfo before being returned by the BitBadges API for consistency
 */
export interface CosmosAccountResponse {
  account_number: number;
  sequence: number;
  pub_key: {
    key: string;
  }
  address: string;
}

/**
 * The following are API response types returned by the BitBadges API. See documentationfor more details.
 *
 * TODO: Make this complete and handle all API routes
 */

export interface CollectionResponse {
  collection: s_BitBadgeCollection,
  pagination: {
    activity: PaginationInfo
    announcements: PaginationInfo
    reviews: PaginationInfo,
    balances: PaginationInfo,
    claims: PaginationInfo,
  },
}

export interface GetCollectionResponse extends CollectionResponse {
  error?: any;
}

export interface GetAccountResponse {
  error?: any;
  accountInfo?: s_BitBadgesUserInfo;
}

export interface GetBadgeBalanceResponse {
  error?: any;
  balance?: s_UserBalance;
}

export interface GetOwnersResponse {
  owners: number[],
  balances: {
    [cosmosAddress: string]: s_UserBalance | undefined;
  }
}

export interface GetPortfolioResponse {
  collected: s_BalanceDocument[],
  activity: s_TransferActivityItem[],
  announcements: s_AnnouncementActivityItem[],
  reviews: s_ReviewActivityItem[],
  pagination: {
    userActivity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  }
}

export interface SearchResponse {
  accounts: s_BitBadgesUserInfo[],
  collections: (s_MetadataDoc & nano.DocumentGetResponse)[],
}


export interface GetBalanceResponse {
  error?: any;
  balance?: s_UserBalance;
}
