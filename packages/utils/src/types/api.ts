import { s_UserBalance } from "bitbadgesjs-proto"
import { s_AnnouncementActivityItem, s_ReviewActivityItem, s_TransferActivityItem } from "./activity"
import { s_BitBadgesCollection } from "./collections"
import { s_BalanceDoc } from "./db"
import { s_Metadata } from "./metadata"
import { s_BitBadgesUserInfo } from "./users"


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
 * Information returned by the REST API getAccount route
 *
 * Note this should be converted into AccountDoc or BitBadgesUserInfo before being returned by the BitBadges API for consistency
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
  collection: s_BitBadgesCollection,
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
  collected: s_BalanceDoc[],
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
  collections: s_Metadata[],
}

export interface GetBalanceResponse {
  error?: any;
  balance?: s_UserBalance;
}
