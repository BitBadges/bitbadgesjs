import { UserBalance } from "bitbadgesjs-proto"
import nano from "nano"
import { AnnouncementActivityItem, ReviewActivityItem, TransferActivityItem } from "./activity"
import { AccountDocument, BalanceDocument, ClaimDocument, CollectionDocument, MetadataDocument } from "./db"
import { Metadata } from "./metadata"
import { BalancesMap, MetadataMap } from "./types"


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
 * @typedef {Object} Coin
 * @property {bigint} amount - The amount of the coin.
 * @property {string} denom - The denomination of the coin.
 */
export interface Coin {
  amount: bigint,
  denom: string,
}

/**
 * BitBadgesUserInfo is the type for accounts returned by the BitBadges API
 *
 * @typedef {Object} BitBadgesUserInfo
 * @extends {AccountDocument}
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
export interface BitBadgesUserInfo extends AccountDocument {
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
 * BitBadgeCollection is the type of document for collections returned by the BitBadges API
 *
 * @typedef {Object} BitBadgeCollection
 * @extends {CollectionDocument} The base collection document
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
export interface BitBadgeCollection extends CollectionDocument {
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
 * Information returned by the REST API getAccount route
 *
 * Note this should be converted into AccountDocument or BitBadgesUserInfo before being returned by the BitBadges API for consistency
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
  collection: BitBadgeCollection,
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
  accountInfo?: BitBadgesUserInfo;
}

export interface GetBadgeBalanceResponse {
  error?: any;
  balance?: UserBalance;
}

export interface GetOwnersResponse {
  owners: number[],
  balances: BalancesMap
}

export interface GetPortfolioResponse {
  collected: BalanceDocument[],
  activity: TransferActivityItem[],
  announcements: AnnouncementActivityItem[],
  reviews: ReviewActivityItem[],
  pagination: {
    userActivity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  }
}

export interface SearchResponse {
  accounts: BitBadgesUserInfo[],
  collections: (MetadataDocument & nano.DocumentGetResponse)[],
}


export interface GetBalanceResponse {
  error?: any;
  balance?: UserBalance;
}
