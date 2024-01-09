import { DeliverTxResponse } from "@cosmjs/stargate"
import { AddressList, AmountTrackerIdDetails, NumberType, Protocol, UintRange, convertUintRange } from "bitbadgesjs-proto"

import { ChallengeParams, VerifyChallengeOptions, convertChallengeParams } from "blockin"
import { BatchBadgeDetails } from "../batch-utils"
import { BroadcastPostBody } from "../node-rest-api/broadcast"
import { TransferActivityDoc, convertTransferActivityDoc } from "./activity"
import { BadgeMetadataDetails, BitBadgesCollection, convertBitBadgesCollection } from "./collections"
import { AddressListEditKey, BalanceDocWithDetails, ChallengeDetails, ChallengeTrackerIdDetails, ClaimAlertDoc, CustomListPage, CustomPage, FollowDetailsDoc, QueueDoc, RefreshDoc, StatusDoc, convertBalanceDocWithDetails, convertClaimAlertDoc, convertFollowDetailsDoc, convertQueueDoc, convertRefreshDoc, convertStatusDoc } from "./db"
import { AddressListWithMetadata, Metadata, convertAddressListWithMetadata, convertMetadata } from "./metadata"
import { OffChainBalancesMap } from "./transfers"
import { SupportedChain } from "./types"
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./users"


/**
 * If an error occurs, the response will be an ErrorResponse.
 *
 * 400 - Bad Request (e.g. invalid request body)
 * 401 - Unauthorized (e.g. invalid session cookie; must sign in with Blockin)
 * 500 - Internal Server Error
 *
 * @typedef {Object} ErrorResponse
 * @category API / Indexer
 */
export interface ErrorResponse {
  /**
   * Serialized error object for debugging purposes. Technical users can use this to debug issues.
   */
  error?: any;
  /**
   * UX-friendly error message that can be displayed to the user. Always present if error.
   */
  message: string;
  /**
   * Authentication error. Present if the user is not authenticated.
   */
  unauthorized?: boolean;
}

/**
 * @category API / Indexer
 */
export interface GetStatusRouteRequestBody { }

/**
 * @category API / Indexer
 */
export interface GetStatusRouteSuccessResponse<T extends NumberType> {
  /**
   * Includes status details about the indexer / blockchain.
   */
  status: StatusDoc<T>;
}

/**
 * @category API / Indexer
 */
export type GetStatusRouteResponse<T extends NumberType> = ErrorResponse | GetStatusRouteSuccessResponse<T>;

/**
 * Converts a GetStatusRouteSuccessResponse to another NumberType.
 *
 * @category API / Indexer
 */
export function convertGetStatusRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetStatusRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetStatusRouteSuccessResponse<U> {
  return {
    status: convertStatusDoc(item.status, convertFunction),
  };
}

/**
 * @category API / Indexer
 */
export interface GetSearchRouteRequestBody {
  //If true, we will skip all collection queries.
  noCollections?: boolean;
  //If true, we will skip all account queries.
  noAccounts?: boolean;
  //If true, we will skip all address list queries.
  noAddressLists?: boolean;
  //If true, we will skip all badge queries.
  noBadges?: boolean;
  //If true, we will limit collection results to a single collection.
  specificCollectionId?: NumberType;
}

/**
 * @category API / Indexer
 *
 * @typedef {Object} GetSearchRouteSuccessResponse
 */
export interface GetSearchRouteSuccessResponse<T extends NumberType> {
  collections: BitBadgesCollection<T>[],
  accounts: BitBadgesUserInfo<T>[],
  addressLists: AddressListWithMetadata<T>[],
  badges: {
    badgeIds: UintRange<T>[],
    collection: BitBadgesCollection<T>,
  }[],
}

/**
 * @category API / Indexer
 */
export type GetSearchRouteResponse<T extends NumberType> = ErrorResponse | GetSearchRouteSuccessResponse<T>;

/**
 * Converts a GetSearchRouteSuccessResponse to another NumberType.
 *
 * @category API / Indexer
 */
export function convertGetSearchRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetSearchRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetSearchRouteSuccessResponse<U> {
  return {
    ...item,
    collections: item.collections.map((collection) => convertBitBadgesCollection(collection, convertFunction)),
    accounts: item.accounts.map((account) => convertBitBadgesUserInfo(account, convertFunction)),
    addressLists: item.addressLists.map((addressList) => convertAddressListWithMetadata(addressList, convertFunction)),
    badges: item.badges.map((badge) => ({
      badgeIds: badge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
      collection: convertBitBadgesCollection(badge.collection, convertFunction),
    })),
  };
}

/**
 * Defines the options for fetching metadata.
 *
 * @typedef {Object} MetadataFetchOptions
 * @property {boolean} [doNotFetchCollectionMetadata] - If true, collection metadata will not be fetched.
 * @property {NumberType[] | UintRange<NumberType>[]} [metadataIds] - If present, the metadata corresponding to the specified metadata IDs will be fetched. See documentation for how to determine metadata IDs.
 * @property {string[]} [uris] - If present, the metadata corresponding to the specified URIs will be fetched.
 * @property {NumberType[] | UintRange<NumberType>[]} [badgeIds] - If present, the metadata corresponding to the specified badge IDs will be fetched.
 *
 * @category API / Indexer
 */
export interface MetadataFetchOptions {
  /**
   * If true, collection metadata will not be fetched.
   */
  doNotFetchCollectionMetadata?: boolean;
  /**
   * If present, the metadata corresponding to the specified metadata IDs will be fetched.
   * Metadata IDs are helpful when determining UNQIUE URIs to be fetched.
   *
   * If badges 1-10000 all share the same URI, they will have the same single metadata ID.
   * If badge 1 has a different URI than badges 2-10000, badge 1 will have a different metadata ID than the rest/
   *
   * We scan in increasing order of badge IDs, so metadata ID 1 will be for badge 1-X, metadata ID 2 will be for badge X+1-Y, etc.
   *
   * ID 0 = Collection metadata fetch
   * ID 1 = First badge metadata fetch
   * ID 2 = Second badge metadata fetch (if present)
   * And so on
   * Learn more in documentation.
   */
  metadataIds?: NumberType[] | UintRange<NumberType>[];
  /**
   * If present, the metadata corresponding to the specified URIs will be fetched.
   */
  uris?: string[];
  /**
   * If present, the metadata corresponding to the specified badge IDs will be fetched.
   */
  badgeIds?: NumberType[] | UintRange<NumberType>[];
}

/**
 * Supported view keys for fetching additional collection details.
 *
 * @category API / Indexer
 */
export type CollectionViewKey = 'transferActivity' | 'reviews' | 'owners';

/**
 * Defines the options for fetching additional collection details.
 *
 * A view is a way of fetching additional details about a collection, and these will be queryable in the response via the `views` property.
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 * If the bookmark is not supplied, the first page will be returned.
 *
 * We support the following views:
 * - `transferActivity` - Fetches the latest activity for the collection.
 * - `latestAnnouncements` - Fetches the latest announcements for the collection.
 * - `reviews` - Fetches the latest reviews for the collection.
 * - `owners` - Fetches the owners of the collection sequentially in random order.
 * - `merkleChallenges` - Fetches the merkle challenges for the collection in random order.
 * - `approvalTrackers` - Fetches the approvals trackers for the collection in random order.
 *
 * @typedef {Object} GetAdditionalCollectionDetailsRequestBody
 * @property {{ viewType: string, bookmark: string }[]} [viewsToFetch] - If present, the specified views will be fetched.
 * @property {boolean} [fetchTotalAndMintBalances] - If true, the total and mint balances will be fetched.
 * @property {string[]} [challengeTrackersToFetch] - If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
 * @property {AmountTrackerIdDetails<NumberType>[]} [approvalTrackersToFetch] - If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
 * @category API / Indexer
 */
export interface GetAdditionalCollectionDetailsRequestBody {
  /**
   * If present, the specified views will be fetched.
   */
  viewsToFetch?: {
    //The base view type to fetch.
    viewType: CollectionViewKey;
    //A unique view ID. This is used for pagination. All fetches w/ same ID should be made with same criteria.
    viewId: string;
    //A bookmark to pass in for pagination. "" for first request.
    bookmark: string;
  }[];

  /**
   * If true, the total and mint balances will be fetched and will be put in owners[].
   *
   * collection.owners.find(x => x.cosmosAddresss === 'Mint')
   */
  fetchTotalAndMintBalances?: boolean;
  /**
   * If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
   */
  challengeTrackersToFetch?: ChallengeTrackerIdDetails<NumberType>[];
  /**
   * If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
   */
  approvalTrackersToFetch?: AmountTrackerIdDetails<NumberType>[];
  /**
   * If true, we will append defaults with empty values.
   */
  handleAllAndAppendDefaults?: boolean;
}

/**
 * @category API / Indexer
 */
export interface GetMetadataForCollectionRequestBody {
  /**
   * If present, we will fetch the metadata corresponding to the specified options.
   *
   * Consider using pruneMetadataToFetch for filtering out previously fetched metadata.
   */
  metadataToFetch?: MetadataFetchOptions;
}

/**
 * @category API / Indexer
 */
export interface GetCollectionBatchRouteRequestBody {
  collectionsToFetch: ({
    /**
     * The ID of the collection to fetch.
     */
    collectionId: NumberType
  } & GetMetadataForCollectionRequestBody & GetAdditionalCollectionDetailsRequestBody)[];
}

/**
 * @category API / Indexer
 */
export interface GetCollectionBatchRouteSuccessResponse<T extends NumberType> {
  collections: BitBadgesCollection<T>[];
}

/**
 * @category API / Indexer
 */
export type GetCollectionBatchRouteResponse<T extends NumberType> = ErrorResponse | GetCollectionBatchRouteSuccessResponse<T>;

/**
 * Converts a GetCollectionBatchRouteSuccessResponse to another NumberType.
 *
 * @category API / Indexer
 */
export function convertGetCollectionBatchRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetCollectionBatchRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetCollectionBatchRouteSuccessResponse<U> {
  return {
    collections: item.collections.map((collection) => convertBitBadgesCollection(collection, convertFunction)),
  };
}

/**
 * @category API / Indexer
 */
export interface GetCollectionByIdRouteRequestBody extends GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody { }

/**
 * @category API / Indexer
 */
export interface GetCollectionRouteSuccessResponse<T extends NumberType> {
  collection: BitBadgesCollection<T>;
}

/**
 * @category API / Indexer
 */
export type GetCollectionRouteResponse<T extends NumberType> = ErrorResponse | GetCollectionRouteSuccessResponse<T>;

/**
 * Converts a GetCollectionRouteSuccessResponse to another NumberType.
 *
 * @category API / Indexer
 */
export function convertGetCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetCollectionRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetCollectionRouteSuccessResponse<U> {
  return {
    collection: convertBitBadgesCollection(item.collection, convertFunction),
  };
}

/**
 * @category API / Indexer
 */
export interface GetOwnersForBadgeRouteRequestBody {
  /**
   * The pagination bookmark for where to start the request. Bookmarks are obtained via the previous response. "" for first request.
   */
  bookmark?: string;
}

/**
 * @category API / Indexer
 */
export interface GetOwnersForBadgeRouteSuccessResponse<T extends NumberType> {
  /**
   * Represents a list of owners balance details.
   */
  owners: BalanceDocWithDetails<T>[];
  /**
   * Represents pagination information.
   */
  pagination: PaginationInfo;
}

/**
 * @category API / Indexer
 */
export type GetOwnersForBadgeRouteResponse<T extends NumberType> = ErrorResponse | GetOwnersForBadgeRouteSuccessResponse<T>;

/**
 * Converts a GetOwnersForBadgeRouteSuccessResponse to another NumberType.
 *
 * @category API / Indexer
 */
export function convertGetOwnersForBadgeRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetOwnersForBadgeRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetOwnersForBadgeRouteSuccessResponse<U> {
  return {
    owners: item.owners.map((balance) => convertBalanceDocWithDetails(balance, convertFunction)),
    pagination: item.pagination,
  };
}


/**
 * @category API / Indexer
 */
export interface GetBadgeBalanceByAddressRouteRequestBody { }

/**
 * @category API / Indexer
 */
export interface GetBadgeBalanceByAddressRouteSuccessResponse<T extends NumberType> {
  balance: BalanceDocWithDetails<T>;
}

/**
 * @category API / Indexer
 */
export type GetBadgeBalanceByAddressRouteResponse<T extends NumberType> =
  ErrorResponse | GetBadgeBalanceByAddressRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertGetBadgeBalanceByAddressRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetBadgeBalanceByAddressRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetBadgeBalanceByAddressRouteSuccessResponse<U> {
  return {
    balance: convertBalanceDocWithDetails(item.balance, convertFunction),
  };
}

/**
 * @category API / Indexer
 */
export interface GetBadgeActivityRouteRequestBody {
  /**
   * An optional bookmark for pagination. Bookmarks are obtained via the previous response. "" for first request.
   */
  bookmark?: string;
}

/**
 * @category API / Indexer
 */
export interface GetBadgeActivityRouteSuccessResponse<T extends NumberType> {
  /**
   * Array of transfer activity information.
   */
  activity: TransferActivityDoc<T>[];

  /**
   * Pagination information.
   */
  pagination: PaginationInfo;
}

/**
 * @category API / Indexer
 */
export type GetBadgeActivityRouteResponse<T extends NumberType> =
  ErrorResponse | GetBadgeActivityRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertGetBadgeActivityRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetBadgeActivityRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetBadgeActivityRouteSuccessResponse<U> {
  return {
    activity: item.activity.map((activityItem) => convertTransferActivityDoc(activityItem, convertFunction)),
    pagination: item.pagination,
  };
}

/**
 * @category API / Indexer
 */
export interface RefreshMetadataRouteRequestBody { }

/**
 * @category API / Indexer
 */
export interface RefreshMetadataRouteSuccessResponse<T extends NumberType> {
  /**
   * A success message.
   */
  successMessage: string;
}

/**
 * @category API / Indexer
 */
export type RefreshMetadataRouteResponse<T extends NumberType> =
  ErrorResponse | RefreshMetadataRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertRefreshMetadataRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: RefreshMetadataRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): RefreshMetadataRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface RefreshStatusRouteRequestBody<T extends NumberType> {

}

/**
 * @category API / Indexer
 */
export interface RefreshStatusRouteSuccessResponse<T extends NumberType> {
  /**
   * Boolean indicating if the collection is currently in the queue.
   */
  inQueue: boolean;

  /**
   * Array of error documents corresponding to the collection.
   */
  errorDocs: QueueDoc<T>[];

  /**
   * The status information corresponding to the collection.
   */
  refreshDoc: RefreshDoc<T>;
}

/**
 * @category API / Indexer
 */
export type RefreshStatusRouteResponse<T extends NumberType> =
  ErrorResponse | RefreshStatusRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertRefreshStatusRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: RefreshStatusRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): RefreshStatusRouteSuccessResponse<U> {
  return {
    ...item,
    errorDocs: item.errorDocs.map((errorDoc) => convertQueueDoc(errorDoc, convertFunction)),
    refreshDoc: convertRefreshDoc(item.refreshDoc, convertFunction),
  };
}

/**
 * Type to allow specifying codes and passwords for a merkle challenge.
 *
 * We only support storing codes and passwords for merkle challenges created by BitBadges via IPFS.
 * The IPFS CID of the merkle challenge is used to identify the merkle challenge.
 *
 * Note that we only support storing a set of codes and passwords once per unique CID.
 *
 * @category API / Indexer
 */
export interface CodesAndPasswords {
  /**
   * The IPFS CID of the merkle challenge.
   */
  cid: string;
  codes: string[];
  password: string;
}

/**
 * @category API / Indexer
 */
export interface GetAllCodesAndPasswordsRouteRequestBody { }

/**
 * @category API / Indexer
 */
export interface GetAllCodesAndPasswordsRouteSuccessResponse<T extends NumberType> {
  codesAndPasswords: CodesAndPasswords[];
}

/**
 * @category API / Indexer
 */
export type GetAllCodesAndPasswordsRouteResponse<T extends NumberType> =
  ErrorResponse | GetAllCodesAndPasswordsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertGetAllCodesAndPasswordsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetAllCodesAndPasswordsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetAllCodesAndPasswordsRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetCodeForPasswordRouteRequestBody { }

/**
 * @category API / Indexer
 */
export interface GetCodeForPasswordRouteSuccessResponse<T extends NumberType> {
  code: string;
}

/**
 * @category API / Indexer
 */
export type GetCodeForPasswordRouteResponse<T extends NumberType> =
  ErrorResponse | GetCodeForPasswordRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertGetCodeForPasswordRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetCodeForPasswordRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetCodeForPasswordRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddAnnouncementRouteRequestBody {
  /**
   * The announcement text (1 to 2048 characters).
   */
  announcement: string;
}

/**
 * @category API / Indexer
 */
export interface AddAnnouncementRouteSuccessResponse<T extends NumberType> {
  /**
   * Boolean indicating success.
   */
  success: boolean;
}

/**
 * @category API / Indexer
 */
export type AddAnnouncementRouteResponse<T extends NumberType> =
  ErrorResponse | AddAnnouncementRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertAddAnnouncementRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: AddAnnouncementRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): AddAnnouncementRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface DeleteReviewRouteRequestBody {
  /**
   * The review ID to delete.
   */
  reviewId: string;
}

/**
 * @category API / Indexer
 */
export interface DeleteReviewRouteSuccessResponse<T extends NumberType> {
  /**
   * Boolean indicating success.
   */
  success: boolean;
}

/**
 * @category API / Indexer
 */
export type DeleteReviewRouteResponse<T extends NumberType> =
  ErrorResponse | DeleteReviewRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertDeleteReviewRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: DeleteReviewRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): DeleteReviewRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface DeleteAnnouncementRouteRequestBody { }

/**
 * @category API / Indexer
 */
export interface DeleteAnnouncementRouteSuccessResponse<T extends NumberType> {
  /**
   * Boolean indicating success.
   */
  success: boolean;
}

/**
 * @category API / Indexer
 */
export type DeleteAnnouncementRouteResponse<T extends NumberType> =
  ErrorResponse | DeleteAnnouncementRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertDeleteAnnouncementRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: DeleteAnnouncementRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): DeleteAnnouncementRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddReviewForCollectionRouteRequestBody {
  /**
   * The review text (1 to 2048 characters).
   */
  review: string;

  /**
   * The star rating (1 to 5).
   */
  stars: NumberType;
}

/**
 * @category API / Indexer
 */
export interface AddReviewForCollectionRouteSuccessResponse<T extends NumberType> {
  /**
   * Boolean indicating success.
   */
  success: boolean;
}

/**
 * @category API / Indexer
 */
export type AddReviewForCollectionRouteResponse<T extends NumberType> =
  ErrorResponse | AddReviewForCollectionRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertAddReviewForCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: AddReviewForCollectionRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): AddReviewForCollectionRouteSuccessResponse<U> {
  return { ...item };
}


/**
 * The supported view keys for fetching account details.
 *
 * @category API / Indexer
 */
export type AccountViewKey = 'createdLists' | 'privateLists' | 'authCodes' | 'transferActivity' | 'reviews' | 'badgesCollected' | 'latestClaimAlerts'
  | 'addressLists' | 'latestAddressLists' | 'explicitlyIncludedAddressLists' | 'explicitlyExcludedAddressLists' | 'badgesCollectedWithHidden'
  | 'createdBy' | 'managing' | 'listsActivity'


/**
 * This defines the options for fetching additional account details.
 *
 * A view is a way of fetching additional details about an account, and these will be queryable in the response via the `views` property.
 *
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 *
 * We support the following views:
 * - `transferActivity` - Fetches the latest activity for the account.
 * - `latestAnnouncements` - Fetches the latest announcements for the account.
 * - `reviews` - Fetches the latest reviews for the account.
 * - `badgesCollected` - Fetches the badges collected by the account sequentially in random order.
 *
 * @typedef {Object} AccountFetchDetails
 *
 * @property {string} [address] - If present, the account corresponding to the specified address will be fetched. Please only specify one of `address` or `username`.
 * @property {string} [username] - If present, the account corresponding to the specified username will be fetched. Please only specify one of `address` or `username`.
 * @property {boolean} [fetchSequence] - If true, the sequence will be fetched from the blockchain.
 * @property {boolean} [fetchBalance] - If true, the $BADGE balance will be fetched from the blockchain.
 * @property {boolean} [noExternalCalls] - If true, only fetches local information stored in DB. Nothing external like resolved names, avatars, etc.
 * @property {Array<{ viewType: string, bookmark: string }>} [viewsToFetch] - An array of views to fetch with associated bookmarks.
 *
 * @category API / Indexer
 */
export type AccountFetchDetails = {
  address?: string;
  username?: string;
  //If true, we will fetch the sequence from the blockchain.
  fetchSequence?: boolean;
  //If true, we will fetch the $BADGE balance from the blockchain.
  fetchBalance?: boolean;
  //If true, we will avoid external API calls.
  noExternalCalls?: boolean;
  //An array of views to fetch
  viewsToFetch?: {
    //Unique view ID. Used for pagination. All fetches w/ same ID should be made with same criteria.
    viewId: string,
    //The base view type to fetch.
    viewType: AccountViewKey,
    //If defined, we will filter the view to only include the specified collections.
    specificCollections?: BatchBadgeDetails<NumberType>[];
    //If defined, we will filter the view to only include the specified lists.
    specificLists?: string[];
    //A bookmark to pass in for pagination. "" for first request.
    bookmark: string
  }[];
};


/**
 * @category API / Indexer
 */
export interface GetAccountsRouteRequestBody {
  accountsToFetch: AccountFetchDetails[];
}

/**
 * @category API / Indexer
 */
export interface GetAccountsRouteSuccessResponse<T extends NumberType> {
  accounts: BitBadgesUserInfo<T>[];
}

/**
 * @category API / Indexer
 */
export type GetAccountsRouteResponse<T extends NumberType> = ErrorResponse | GetAccountsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertGetAccountsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetAccountsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetAccountsRouteSuccessResponse<U> {
  return {
    accounts: item.accounts.map((account) => convertBitBadgesUserInfo(account, convertFunction)),
  };
}

/**
 * @category API / Indexer
 */
export interface GetAccountRouteRequestBody extends Omit<AccountFetchDetails, 'address' | 'username'> { }

/**
 * @category API / Indexer
 */
export type GetAccountRouteSuccessResponse<T extends NumberType> = BitBadgesUserInfo<T>;

/**
 * @category API / Indexer
 */
export type GetAccountRouteResponse<T extends NumberType> =
  ErrorResponse | GetAccountRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertGetAccountRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetAccountRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetAccountRouteSuccessResponse<U> {
  return convertBitBadgesUserInfo(item, convertFunction);
}

/**
 * @category API / Indexer
 */
export interface AddReviewForUserRouteRequestBody {
  /**
   * The review text (1 to 2048 characters).
   */
  review: string;

  /**
   * The number of stars (1 to 5) for the review.
   */
  stars: NumberType;
}

/**
 * @category API / Indexer
 */
export interface AddReviewForUserRouteSuccessResponse<T extends NumberType> {
  /**
   * Indicates whether the review was added successfully.
   */
  success: boolean;
}

/**
 * @category API / Indexer
 */
export type AddReviewForUserRouteResponse<T extends NumberType> =
  ErrorResponse | AddReviewForUserRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertAddReviewForUserRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: AddReviewForUserRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): AddReviewForUserRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface UpdateAccountInfoRouteRequestBody<T extends NumberType> {
  /**
   * The Discord username.
   */
  discord?: string;

  /**
   * The Twitter username.
   */
  twitter?: string;

  /**
   * The GitHub username.
   */
  github?: string;

  /**
   * The Telegram username.
   */
  telegram?: string;

  /**
   * The last seen activity timestamp.
   */
  seenActivity?: NumberType;

  /**
   * The README details.
   */
  readme?: string;

  /**
   * The badges to hide and not view for this profile's portfolio
   */
  hiddenBadges?: BatchBadgeDetails<T>[];

  /**
   * The lists to hide and not view for this profile's portfolio
   */
  hiddenLists?: string[];

  /**
   * An array of custom pages on the user's portolio. Used to customize, sort, and group badges / lists into pages.
   */
  customPages?: {
    badges: CustomPage<T>[];
    lists: CustomListPage[];
  };

  /**
   * The watchlist of badges / lists
   */
  watchlists?: {
    badges: CustomPage<T>[];
    lists: CustomListPage[];
  };

  /**
   * The profile picture URL.
   */
  profilePicUrl?: string;

  /**
   * The username.
   */
  username?: string;

  /**
   * The profile picture image file. We will then upload to our CDN.
   */
  profilePicImageFile?: any;
}

/**
 * @category API / Indexer
 */
export interface UpdateAccountInfoRouteSuccessResponse<T extends NumberType> {
  /**
   * Indicates whether the update was successful.
   */
  success: boolean;
}

/**
 * @category API / Indexer
 */
export type UpdateAccountInfoRouteResponse<T extends NumberType> =
  ErrorResponse | UpdateAccountInfoRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertUpdateAccountInfoRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: UpdateAccountInfoRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): UpdateAccountInfoRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddBalancesToOffChainStorageRouteRequestBody {
  /**
   * A map of Cosmos addresses or list IDs -> Balance<NumberType>[].
   */
  balances: OffChainBalancesMap<NumberType>;

  /**
   * The method for storing balances (ipfs or centralized).
   */
  method: 'ipfs' | 'centralized';

  /**
   * The collection ID.
   */
  collectionId: NumberType;
}

/**
 * @category API / Indexer
 */
export interface AddBalancesToOffChainStorageRouteSuccessResponse<T extends NumberType> {
  /**
   * The URI of the stored data.
   */
  uri?: string;

  /**
   * The result object with CID.
   */
  result: {
    cid?: string;
  };
}

/**
 * @category API / Indexer
 */
export type AddBalancesToOffChainStorageRouteResponse<T extends NumberType> =
  ErrorResponse | AddBalancesToOffChainStorageRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertAddBalancesToOffChainStorageRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: AddBalancesToOffChainStorageRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): AddBalancesToOffChainStorageRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddMetadataToIpfsRouteRequestBody {
  /**
   * The collection metadata to add to IPFS
   */
  collectionMetadata?: Metadata<NumberType>,
  /**
   * The badge metadata to add to IPFS
   */
  badgeMetadata?: BadgeMetadataDetails<NumberType>[] | Metadata<NumberType>[],
}

/**
 * @category API / Indexer
 */
export interface AddMetadataToIpfsRouteSuccessResponse<T extends NumberType> {
  /**
   * The result for collection metadata.
   */
  collectionMetadataResult?: {
    cid: string;
  };

  /**
   * An array of badge metadata results, if applicable.
   */
  badgeMetadataResults: {
    cid: string;
  }[];

  /**
   * An array of all results (collection and badge metadata).
   */
  allResults: {
    cid: string;
  }[];
}

/**
 * @category API / Indexer
 */
export type AddMetadataToIpfsRouteResponse<T extends NumberType> =
  ErrorResponse | AddMetadataToIpfsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertAddMetadataToIpfsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: AddMetadataToIpfsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): AddMetadataToIpfsRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddApprovalDetailsToOffChainStorageRouteRequestBody {
  /**
   * The name of the approval.
   */
  name: string;

  /**
   * The description of the approval.
   */
  description: string;

  /**
   * The challenge details.
   */
  challengeDetails?: ChallengeDetails<NumberType>;
}

/**
 * @category API / Indexer
 */
export interface AddApprovalDetailsToOffChainStorageRouteSuccessResponse<T extends NumberType> {
  /**
   * The result with CID for IPFS.
   */
  result: {
    cid: string;
  };
}

/**
 * @category API / Indexer
 */
export type AddApprovalDetailsToOffChainStorageRouteResponse<T extends NumberType> =
  ErrorResponse | AddApprovalDetailsToOffChainStorageRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertAddApprovalDetailsToOffChainStorageRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: AddApprovalDetailsToOffChainStorageRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): AddApprovalDetailsToOffChainStorageRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetSignInChallengeRouteRequestBody {
  /**
   * The blockchain to be signed in with.
   */
  chain: SupportedChain;

  /**
   * The user's blockchain address (their native L1 address).
   */
  address: string;

  /**
   * The number of hours to be signed in for.
   */
  hours?: NumberType;
}

/**
 * @category API / Indexer
 */
export interface GetSignInChallengeRouteSuccessResponse<T extends NumberType> {
  /**
   * The nonce for the challenge.
   */
  nonce: string;

  /**
   * The challenge parameters.
   */
  params: ChallengeParams<T>;

  /**
   * The Blockin message to sign.
   */
  blockinMessage: string;
}

/**
 * @category API / Indexer
 */
export type GetSignInChallengeRouteResponse<T extends NumberType> =
  ErrorResponse | GetSignInChallengeRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertGetSignInChallengeRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetSignInChallengeRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetSignInChallengeRouteSuccessResponse<U> {
  return {
    ...item,
    params: convertChallengeParams(item.params, convertFunction),
  };
}

/**
 * @category API / Indexer
 */
export interface VerifySignInRouteRequestBody {
  /**
   * The chain to be signed in with.
   */
  chain: SupportedChain;

  /**
   * The original Blockin message
   */
  message: string;

  /**
   * The signature of the Blockin message
   */
  signature: string

  /**
   * Additional options for verifying the challenge.
   */
  options?: VerifyChallengeOptions;
}

/**
 * @category API / Indexer
 */
export interface VerifySignInRouteSuccessResponse<T extends NumberType> {
  /**
   * Indicates whether the verification was successful.
   */
  success: boolean;

  /**
   * The success message.
   */
  successMessage: string;
}

/**
 * @category API / Indexer
 */
export type VerifySignInRouteResponse<T extends NumberType> =
  ErrorResponse | VerifySignInRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item The input item to convert.
 * @param convertFunction Function to convert the item of type T to type U.
 * @returns The converted success response.
 */
export function convertVerifySignInRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: VerifySignInRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): VerifySignInRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface CheckSignInStatusRequestBody {
}

/**
 * @category API / Indexer
 */
export interface CheckSignInStatusRequestSuccessResponse<T extends NumberType> {
  /**
   * Indicates whether the user is signed in.
   */
  signedIn: boolean;
}


/**
 * @category API / Indexer
 */
export type CheckSignInStatusResponse<T extends NumberType> = ErrorResponse | CheckSignInStatusRequestSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertCheckSignInStatusRequestSuccessResponse<T extends NumberType, U extends NumberType>(
  item: CheckSignInStatusRequestSuccessResponse<T>,
  convertFunction: (item: T) => U
): CheckSignInStatusRequestSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface SignOutRequestBody { }

/**
 * @category API / Indexer
 */
export interface SignOutSuccessResponse<T extends NumberType> {
  success: boolean;
}

/**
 * @category API / Indexer
 */
export type SignOutResponse<T extends NumberType> = ErrorResponse | SignOutSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertSignOutSuccessResponse<T extends NumberType, U extends NumberType>(
  item: SignOutSuccessResponse<T>,
  convertFunction: (item: T) => U
): SignOutSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetBrowseCollectionsRouteRequestBody { }

/**
 * @category API / Indexer
 */
export interface GetBrowseCollectionsRouteSuccessResponse<T extends NumberType> {
  collections: { [category: string]: BitBadgesCollection<T>[] };
  addressLists: { [category: string]: AddressListWithMetadata<T>[] };
  profiles: { [category: string]: BitBadgesUserInfo<T>[] };
  activity: TransferActivityDoc<T>[];
  badges: {
    [category: string]: {
      badgeIds: UintRange<T>[]
      collection: BitBadgesCollection<T>
    }[]
  }
}

/**
 * @category API / Indexer
 */
export type GetBrowseCollectionsRouteResponse<T extends NumberType> = ErrorResponse | GetBrowseCollectionsRouteSuccessResponse<T>;

/**
 *
 * Converts a GetBrowseCollectionsRouteSuccessResponse to a new type.
 *
 * @category API / Indexer
 */
export function convertGetBrowseCollectionsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetBrowseCollectionsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetBrowseCollectionsRouteSuccessResponse<U> {
  return {
    collections: Object.keys(item.collections).reduce((acc, category) => {
      acc[category] = item.collections[category].map((collection) => convertBitBadgesCollection(collection, convertFunction));
      return acc;
    }, {} as { [category: string]: BitBadgesCollection<U>[] }),
    addressLists: Object.keys(item.addressLists).reduce((acc, category) => {
      acc[category] = item.addressLists[category].map((addressList) =>
        convertAddressListWithMetadata(addressList, convertFunction)
      );
      return acc;
    }, {} as { [category: string]: AddressListWithMetadata<U>[] }),
    profiles: Object.keys(item.profiles).reduce((acc, category) => {
      acc[category] = item.profiles[category].map((profile) => convertBitBadgesUserInfo(profile, convertFunction));
      return acc;
    }, {} as { [category: string]: BitBadgesUserInfo<U>[] }),
    activity: item.activity.map((activityItem) => convertTransferActivityDoc(activityItem, convertFunction)),
    badges: Object.keys(item.badges).reduce((acc, category) => {
      acc[category] = item.badges[category].map((badge) => ({
        badgeIds: badge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
        collection: convertBitBadgesCollection(badge.collection, convertFunction),
      }));
      return acc;
    }, {} as { [category: string]: { badgeIds: UintRange<U>[]; collection: BitBadgesCollection<U> }[] }),
  };
}

/**
 * @category API / Indexer
 */
export type BroadcastTxRouteRequestBody = BroadcastPostBody;

/**
 * @category API / Indexer
 */
export interface BroadcastTxRouteSuccessResponse<T extends NumberType> {
  /**
   * The response from the blockchain for the broadcasted tx.
   * See Cosmos SDK documentation for what each field means.
   */
  tx_response: {
    code: number;
    codespace: string;
    data: string;
    events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
    gas_wanted: string;
    gas_used: string;
    height: string;
    Doc: string;
    logs: {
      events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
    }[];
    raw_log: string;
    timestamp: string;
    tx: object | null;
    txhash: string;
  };
}

/**
 * @category API / Indexer
 */
export type BroadcastTxRouteResponse<T extends NumberType> = ErrorResponse | BroadcastTxRouteSuccessResponse<T>;

/**
 *  @category API / Indexer
 */
export function convertBroadcastTxRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: BroadcastTxRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): BroadcastTxRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export type SimulateTxRouteRequestBody = BroadcastPostBody;

/**
 * @category API / Indexer
 */
export interface SimulateTxRouteSuccessResponse<T extends NumberType> {
  /**
   * How much gas was used in the simulation.
   */
  gas_info: { gas_used: string; gas_wanted: string };
  /**
   * The result of the simulation.
   */
  result: { data: string; log: string; events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[] };
}

/**
 * @category API / Indexer
 */
export type SimulateTxRouteResponse<T extends NumberType> = ErrorResponse | SimulateTxRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertSimulateTxRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: SimulateTxRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): SimulateTxRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface FetchMetadataDirectlyRouteRequestBody {
  uris: string[];
}

/**
 * @category API / Indexer
 */
export interface FetchMetadataDirectlyRouteSuccessResponse<T extends NumberType> {
  metadata: Metadata<T>[];
}

/**
 * @category API / Indexer
 */
export type FetchMetadataDirectlyRouteResponse<T extends NumberType> = ErrorResponse | FetchMetadataDirectlyRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertFetchMetadataDirectlyRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: FetchMetadataDirectlyRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): FetchMetadataDirectlyRouteSuccessResponse<U> {
  return { metadata: item.metadata.map((metadata) => convertMetadata(metadata, convertFunction)) };
}

/**
 * @category API / Indexer
 */
export interface GetTokensFromFaucetRouteRequestBody { }

/**
 * @category API / Indexer
 */
export type GetTokensFromFaucetRouteResponse<T extends NumberType> = DeliverTxResponse | ErrorResponse;

/**
 * @category API / Indexer
 */
export type GetTokensFromFaucetRouteSuccessResponse<T extends NumberType> = DeliverTxResponse;

/**
 * @category API / Indexer
 */
export function convertGetTokensFromFaucetRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetTokensFromFaucetRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetTokensFromFaucetRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetAddressListsRouteRequestBody {
  /**
   * The list IDs to fetch. Can be reserved or custom IDs.
   */
  listIds: string[];
}

/**
 * @category API / Indexer
 */
export interface GetAddressListsRouteSuccessResponse<T extends NumberType> {
  addressLists: AddressListWithMetadata<T>[];
}

/**
 * @category API / Indexer
 */
export type GetAddressListsRouteResponse<T extends NumberType> = ErrorResponse | GetAddressListsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertGetAddressListsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetAddressListsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetAddressListsRouteSuccessResponse<U> {
  return { addressLists: item.addressLists.map((addressList) => convertAddressListWithMetadata(addressList, convertFunction)) };
}

/**
 * @category API / Indexer
 */
export interface UpdateAddressListsRouteRequestBody<T extends NumberType> {
  /**
   * New address lists to update.
   * Requester must be creator of the lists.
   * Only applicable to off-chain balances.
   */
  addressLists: (AddressList & {
    //Whether the list is private.
    private?: boolean;

    //Any edit keys to be used by others to add addresses to the list. Used for surveys
    editKeys?: AddressListEditKey<T>[];
  })[];
}

/**
 * @category API / Indexer
 */
export interface UpdateAddressListsRouteSuccessResponse<T extends NumberType> { }

/**
 * @category API / Indexer
 */
export type UpdateAddressListsRouteResponse<T extends NumberType> = ErrorResponse | UpdateAddressListsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertUpdateAddressListsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: UpdateAddressListsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): UpdateAddressListsRouteSuccessResponse<U> {
  return { ...item };
}


/**
 * @category API / Indexer
 */
export interface DeleteAddressListsRouteRequestBody {
  /**
   * The list IDs to delete.
   */
  listIds: string[];
}

/**
 * @category API / Indexer
 */
export interface DeleteAddressListsRouteSuccessResponse<T extends NumberType> { }

/**
 * @category API / Indexer
 */
export type DeleteAddressListsRouteResponse<T extends NumberType> = ErrorResponse | DeleteAddressListsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertDeleteAddressListsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: DeleteAddressListsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): DeleteAddressListsRouteSuccessResponse<U> {
  return {
    ...item,
  };
}

/**
 * @category API / Indexer
 */
export interface SendClaimAlertsRouteRequestBody<T extends NumberType> {
  claimAlerts: {
    collectionId: T;
    message?: string;
    recipientAddress: string;
  }[]
}

/**
 * @category API / Indexer
 */
export interface SendClaimAlertsRouteSuccessResponse<T extends NumberType> {
  success: boolean;
}

/**
 * @category API / Indexer
 */
export type SendClaimAlertsRouteResponse<T extends NumberType> = ErrorResponse | SendClaimAlertsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertSendClaimAlertsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: SendClaimAlertsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): SendClaimAlertsRouteSuccessResponse<U> {
  return {
    ...item,
  };
}

/**
 * Type for CouchDB pagination information.
 * @typedef {Object} PaginationInfo
 * @property {string} bookmark - The bookmark to be used to fetch the next X documents. Initially, bookmark should be '' (empty string) to fetch the first X documents. Each time the next X documents are fetched, the bookmark should be updated to the bookmark returned by the previous fetch.
 * @property {boolean} hasMore - Indicates whether there are more documents to be fetched. Once hasMore is false, all documents have been fetched.
 * @category API / Indexer
 */
export interface PaginationInfo {
  bookmark: string;
  hasMore: boolean;
}

/**
 * information returned by the REST API getAccount route.
 *
 * Note this should be converted into AccountDoc or BitBadgesUserInfo before being returned by the BitBadges API for consistency.
 *
 * @category API / Indexer
 */
export interface CosmosAccountResponse {
  account_number: number;
  sequence: number;
  pub_key: {
    key: string;
  };
  address: string;
}

/**
 * Generic route to verify any Blockin request. Does not sign you in with the API. Used for custom Blockin integrations.
 *
 * @category API / Indexer
 */
export interface GenericBlockinVerifyRouteRequestBody extends VerifySignInRouteRequestBody { }

/**
 * Generic route to verify any Blockin request. Does not sign you in with the API. Used for custom Blockin integrations.
 *
 * @category API / Indexer
 */
export interface GenericBlockinVerifyRouteSuccessResponse extends VerifySignInRouteSuccessResponse<NumberType> { }

/**
 * Generic route to verify any Blockin request. Does not sign you in with the API. Used for custom Blockin integrations.
 *
 * @category API / Indexer
 */
export type GenericBlockinVerifyRouteResponse = ErrorResponse | GenericBlockinVerifyRouteSuccessResponse;

/**
 * Generic route to verify any Blockin request. Does not sign you in with the API. Used for custom Blockin integrations.
 *
 * @category API / Indexer
 */
export function convertGenericBlockinVerifyRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GenericBlockinVerifyRouteSuccessResponse,
  convertFunction: (item: T) => U
): GenericBlockinVerifyRouteSuccessResponse {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface CreateBlockinAuthCodeRouteRequestBody {
  name: string;
  description: string;
  image: string;

  message: string;
  signature: string;
}

/**
 * @category API / Indexer
 */
export interface CreateBlockinAuthCodeRouteSuccessResponse { }

/**
 * @category API / Indexer
 */
export type CreateBlockinAuthCodeRouteResponse = ErrorResponse | CreateBlockinAuthCodeRouteSuccessResponse;

/**
 * @category API / Indexer
 */
export function convertCreateBlockinAuthCodeRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: CreateBlockinAuthCodeRouteSuccessResponse,
  convertFunction: (item: T) => U
): CreateBlockinAuthCodeRouteSuccessResponse {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetBlockinAuthCodeRouteRequestBody {
  signature: string
  options?: VerifyChallengeOptions
}

/**
 * @category API / Indexer
 */
export interface GetBlockinAuthCodeRouteSuccessResponse {
  /**
   * The corresponding message that was signed to obtain the signature.
   */
  message: string;
  /**
   * Verification response
   */
  verificationResponse: {
    /**
     * Returns whether the current (message, signature) pair is valid and verified (i.e. signature is valid and any assets are owned).
     */
    success: boolean;
    /**
     * Returns the message returned from verifying the signature.
     */
    verificationMessage: string;
  }
}

/**
 * @category API / Indexer
 */
export type GetBlockinAuthCodeRouteResponse = ErrorResponse | GetBlockinAuthCodeRouteSuccessResponse;

/**
 * @category API / Indexer
 */
export function convertGetBlockinAuthCodeRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetBlockinAuthCodeRouteSuccessResponse,
  convertFunction: (item: T) => U
): GetBlockinAuthCodeRouteSuccessResponse {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface DeleteBlockinAuthCodeRouteRequestBody {
  signature: string
}

/**
 * @category API / Indexer
 */
export interface DeleteBlockinAuthCodeRouteSuccessResponse { }

/**
 * @category API / Indexer
 */
export type DeleteBlockinAuthCodeRouteResponse = ErrorResponse | DeleteBlockinAuthCodeRouteSuccessResponse;

/**
 * @category API / Indexer
 */
export function convertDeleteBlockinAuthCodeRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: DeleteBlockinAuthCodeRouteSuccessResponse,
  convertFunction: (item: T) => U
): DeleteBlockinAuthCodeRouteSuccessResponse {
  return { ...item };
}


/**
 * @category API / Indexer
 */
export interface AddAddressToSurveyRouteRequestBody {
  address: string;
  editKey: string
}

/**
 * @category API / Indexer
 */
export interface AddAddressToSurveyRouteSuccessResponse { }

/**
 * @category API / Indexer
 */
export type AddAddressToSurveyRouteResponse = ErrorResponse | AddAddressToSurveyRouteSuccessResponse;

/**
 * @category API / Indexer
 */
export function convertAddAddressToSurveyRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: AddAddressToSurveyRouteSuccessResponse,
  convertFunction: (item: T) => U
): AddAddressToSurveyRouteSuccessResponse {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetFollowDetailsRouteRequestBody {
  cosmosAddress: string;

  followingBookmark?: string;
  followersBookmark?: string;

  protocol?: string;
}

/**
 * @category API / Indexer
 */
export interface GetFollowDetailsRouteSuccessResponse<T extends NumberType> extends FollowDetailsDoc<T> {
  followers: string[];
  following: string[];

  followersPagination: PaginationInfo;
  followingPagination: PaginationInfo;

  followingCollectionId: T;
}

/**
 * @category API / Indexer
 */
export type GetFollowDetailsRouteResponse<T extends NumberType> = ErrorResponse | GetFollowDetailsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertGetFollowDetailsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetFollowDetailsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetFollowDetailsRouteSuccessResponse<U> {
  return {
    ...item,
    ...convertFollowDetailsDoc(item, convertFunction),
    followingCollectionId: convertFunction(item.followingCollectionId),
  };
}


/**
 * @category API / Indexer
 */
export interface GetClaimAlertsForCollectionRouteRequestBody<T extends NumberType> {
  collectionId: T;
  bookmark: string;
}

/**
 * @category API / Indexer
 */
export interface GetClaimAlertsForCollectionRouteSuccessResponse<T extends NumberType> {
  claimAlerts: ClaimAlertDoc<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API / Indexer
 */
export type GetClaimAlertsForCollectionRouteResponse<T extends NumberType> = ErrorResponse | GetClaimAlertsForCollectionRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertGetClaimAlertsForCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetClaimAlertsForCollectionRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetClaimAlertsForCollectionRouteSuccessResponse<U> {
  return {
    ...item,
    claimAlerts: item.claimAlerts.map((claimAlert) => convertClaimAlertDoc(claimAlert, convertFunction)),
  };
}

/**
 * @category API / Indexer
 */
export interface GetProtocolsRouteRequestBody {
  names: string[];
}

/**
 * @category API / Indexer
 */
export interface GetProtocolsRouteSuccessResponse {
  protocols: Protocol[]
}

/**
 * @category API / Indexer
 */
export type GetProtocolsRouteResponse = ErrorResponse | GetProtocolsRouteSuccessResponse;

/**
 * @category API / Indexer
 */
export function convertGetProtocolsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetProtocolsRouteSuccessResponse,
  convertFunction: (item: T) => U
): GetProtocolsRouteSuccessResponse {
  return {
    ...item,
  };
}

/**
 * @category API / Indexer
 */
export interface GetCollectionForProtocolRouteRequestBody {
  name: string
  address: string
}

/**
 * @category API / Indexer
 */
export interface GetCollectionForProtocolRouteSuccessResponse<T extends NumberType> {
  collectionId: T
}

/**
 * @category API / Indexer
 */
export type GetCollectionForProtocolRouteResponse<T extends NumberType> = ErrorResponse | GetCollectionForProtocolRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertGetCollectionForProtocolRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetCollectionForProtocolRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetCollectionForProtocolRouteSuccessResponse<U> {
  return {
    ...item,
    collectionId: convertFunction(item.collectionId),
  };

}


/**
 * @category API / Indexer
 */
export interface FilterBadgesInCollectionRequestBody {
  //The collection ID to filter
  collectionId: NumberType
  //Limit to specific badge IDs. Leave undefined to not filter by badge ID.
  badgeIds?: UintRange<NumberType>[]
  //Limit to specific lists. Leave undefined to not filter by list.
  categories?: string[]
  //Limit to specific lists. Leave undefined to not filter by list.
  tags?: string[]

  //mostViewed is a special view that sorts by most viewed badges. May be incompatible with other filters.
  mostViewed?: 'daily' | 'allTime' | 'weekly' | 'monthly' | 'yearly'
  //Pagination bookmark. Leave undefined or "" for first request.
  bookmark?: string
}

/**
 * @category API / Indexer
 */
export interface FilterBadgesInCollectionSuccessResponse<T extends NumberType> {
  badgeIds: UintRange<T>[]
  pagination: PaginationInfo
}

/**
 * @category API / Indexer
 */
export type FilterBadgesInCollectionResponse<T extends NumberType> = ErrorResponse | FilterBadgesInCollectionSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertFilterBadgesInCollectionSuccessResponse<T extends NumberType, U extends NumberType>(
  item: FilterBadgesInCollectionSuccessResponse<T>,
  convertFunction: (item: T) => U
): FilterBadgesInCollectionSuccessResponse<U> {
  return {
    ...item,
    badgeIds: item.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
  };
}
