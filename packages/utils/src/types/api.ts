import { Coin } from "@cosmjs/stargate"
import { AccountDocument, BalanceDocument, CollectionDocument, MetadataDocument } from "./db"
import { BalancesMap, ClaimDocumentWithTrees, MetadataMap } from "./types"
import nano from "nano"
import { UserBalance } from "bitbadgesjs-proto"
import { AnnouncementActivityItem, ReviewActivityItem, TransferActivityItem } from "./activity"
import { Metadata } from "./metadata"


/**
 * CouchDB Pagination Information
 *
 * bookmark is the bookmark to be used to fetch the next X documents.
 * Initially, bookamrk should be '' (empty string) to fetch the first X documents.
 * Each time the next X documents are fetched, the bookmark should be updated to the bookmark returned by the previous fetch.
 *
 * hasMore is true if there are more documents to be fetched. Once hasMore is false, all documents have been fetched.
 */
export interface PaginationInfo {
  bookmark: string,
  hasMore: boolean,
}

/**
 * BitBadgesUserInfo is the type of document for accounts returned by the BitBadges API
 *
 * resolvedName and avatar are the resolved name and avatar of the account (e.g. ENS name and avatar)
 * balance is the balance of the account ($BADGE)
 * airdropped is true if the account has claimed their airdropp
 *
 * collected, activity, announcements, and reviews are profile information that is dynamically loaded as needed
 * pagination is the pagination information for each of the profile information
 *
 * For typical fetches, collected, activity, announcements, and reviews will be empty and will be loaded as needed (pagination will be set to hasMore == true)
 * This information is only needed when viewing a user's profile
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
 * It extends the base collection document with additional information:
 * managerInfo is the account information of the manager of this collection
 * collectionMetadata is the metadata of this collection
 * badgeMetadata is the metadata of each badge in this collection
 * activity, announcements, reviews, claims, and balances are information that is dynamically loaded as needed
 *
 * Note that the collectionMetadata, badgeMetadata, activity, announcements, reviews, claims, and balances fields are
 * dynamically fetched from the DB as needed. They may be empty or missing information when the collection is first fetched.
 *
 * Use updateMetadataMap from metadata.ts to update the badgeMetadata and collectionMetadata fields.
 *
 * Use the corresponding API routes with bookmarks to fetch the activity, announcements, reviews, claims, and balances fields.
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
  claims: ClaimDocumentWithTrees[],
}

/**
 * Information returned by the REST API for a Cosmos account from a BitBadges node
 *
 * This should be converted into AccountDocument or BitBadgesUserInfo before being returned by the BitBadges API for consistency
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
