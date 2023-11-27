import { DeliverTxResponse } from "@cosmjs/stargate"
import { AddressMapping, AmountTrackerIdDetails, NumberType, UintRange, convertUintRange } from "bitbadgesjs-proto"

import { ChallengeParams } from "blockin"
import { TransferActivityInfo, convertTransferActivityInfo } from "./activity"
import { BadgeMetadataDetails, BitBadgesCollection, convertBadgeMetadataDetails, convertBitBadgesCollection } from "./collections"
import { ApprovalsTrackerInfo, BalanceInfoWithDetails, ChallengeDetails, MerkleChallengeIdDetails, MerkleChallengeInfo, ChallengeTrackerIdDetails, QueueInfo, StatusInfo, convertApprovalsTrackerInfo, convertBalanceInfoWithDetails, convertMerkleChallengeInfo, convertQueueItem, convertStatusInfo } from "./db"
import { AddressMappingWithMetadata, Metadata, convertAddressMappingWithMetadata, convertMetadata } from "./metadata"
import { OffChainBalancesMap } from "./transfers"
import { SupportedChain } from "./types"
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./users"
import { BroadcastPostBody } from "../node-rest-api/broadcast"


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
   * Serialized error object for debugging purposes. Advanced users can use this to debug issues.
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
   * Represents the status information.
   */
  status: StatusInfo<T>;
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
    status: convertStatusInfo(item.status, convertFunction),
  };
}

/**
 * @category API / Indexer
 */
export interface GetSearchRouteRequestBody { }

/**
 * @category API / Indexer
 *
 * @typedef {Object} GetSearchRouteSuccessResponse
 */
export interface GetSearchRouteSuccessResponse<T extends NumberType> {
  collections: BitBadgesCollection<T>[],
  accounts: BitBadgesUserInfo<T>[],
  addressMappings: AddressMappingWithMetadata<T>[],
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
    addressMappings: item.addressMappings.map((addressMapping) => convertAddressMappingWithMetadata(addressMapping, convertFunction)),
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
   * If present, the metadata corresponding to the specified metadata IDs will be fetched. See documentation for how to determine metadata IDs.
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
export type CollectionViewKey = 'latestActivity' | 'latestAnnouncements' | 'latestReviews' | 'owners' | 'merkleChallenges' | 'approvalsTrackers';

/**
 * Defines the options for fetching additional collection details.
 *
 * A view is a way of fetching additional details about a collection, and these will be queryable in the response via the `views` property.
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 * If the bookmark is not supplied, the first page will be returned.
 *
 * We support the following views:
 * - `latestActivity` - Fetches the latest activity for the collection.
 * - `latestAnnouncements` - Fetches the latest announcements for the collection.
 * - `latestReviews` - Fetches the latest reviews for the collection.
 * - `owners` - Fetches the owners of the collection sequentially in random order.
 * - `merkleChallenges` - Fetches the merkle challenges for the collection in random order.
 * - `approvalsTrackers` - Fetches the approvals trackers for the collection in random order.
 *
 * @typedef {Object} GetAdditionalCollectionDetailsRequestBody
 * @property {{ viewKey: CollectionViewKey, bookmark: string }[]} [viewsToFetch] - If present, the specified views will be fetched.
 * @property {boolean} [fetchTotalAndMintBalances] - If true, the total and mint balances will be fetched.
 * @property {string[]} [merkleChallengeIdsToFetch] - If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
 * @property {AmountTrackerIdDetails<NumberType>[]} [approvalsTrackerIdsToFetch] - If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
 * @category API / Indexer
 */
export interface GetAdditionalCollectionDetailsRequestBody {
  /**
   * If present, the specified views will be fetched.
   */
  viewsToFetch?: {
    viewKey: CollectionViewKey;
    bookmark: string;
  }[];
  /**
   * If true, the total and mint balances will be fetched and will be put in owners[].
   */
  fetchTotalAndMintBalances?: boolean;
  /**
   * If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
   */
  merkleChallengeIdsToFetch?: ChallengeTrackerIdDetails<NumberType>[];
  /**
   * If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
   */
  approvalsTrackerIdsToFetch?: AmountTrackerIdDetails<NumberType>[];
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
  owners: BalanceInfoWithDetails<T>[];
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
    owners: item.owners.map((balance) => convertBalanceInfoWithDetails(balance, convertFunction)),
    pagination: item.pagination,
  };
}


/**
 * @category API / Indexer
 */
export interface GetMetadataForCollectionRouteRequestBody {
  /**
   * The metadata options to fetch.
   */
  metadataToFetch: MetadataFetchOptions;
}

/**
 * @category API / Indexer
 */
export interface GetMetadataForCollectionRouteSuccessResponse<T extends NumberType> {
  collectionMetadata?: Metadata<T>;
  badgeMetadata?: BadgeMetadataDetails<T>[];
}

/**
 * @category API / Indexer
 */
export type GetMetadataForCollectionRouteResponse<T extends NumberType> =
  ErrorResponse | GetMetadataForCollectionRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 * @param item - The input success response.
 * @param convertFunction - A function to convert the type.
 * @returns The converted success response.
 */
export function convertGetMetadataForCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetMetadataForCollectionRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetMetadataForCollectionRouteSuccessResponse<U> {
  return {
    collectionMetadata: item.collectionMetadata ? convertMetadata(item.collectionMetadata, convertFunction) : undefined,
    badgeMetadata: item.badgeMetadata ? item.badgeMetadata.map(x => convertBadgeMetadataDetails(x, convertFunction)) : undefined,
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
  balance: BalanceInfoWithDetails<T>;
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
    balance: convertBalanceInfoWithDetails(item.balance, convertFunction),
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
  activity: TransferActivityInfo<T>[];

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
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)),
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
  /**
   * The collection ID to refresh.
   */
  collectionId: T;
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
  errorDocs: QueueInfo<T>[];
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
    errorDocs: item.errorDocs.map((errorDoc) => convertQueueItem(errorDoc, convertFunction)),
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
export type AccountViewKey = 'latestActivity' | 'latestAnnouncements' | 'latestReviews' | 'badgesCollected' | 'addressMappings' | 'latestClaimAlerts' | 'latestAddressMappings' | 'explicitlyIncludedAddressMappings' | 'explicitlyExcludedAddressMappings' | 'badgesCollectedWithHidden' | 'createdBy' | 'managing'


/**
 * This defines the options for fetching additional account details.
 *
 * A view is a way of fetching additional details about an account, and these will be queryable in the response via the `views` property.
 *
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 *
 * We support the following views:
 * - `latestActivity` - Fetches the latest activity for the account.
 * - `latestAnnouncements` - Fetches the latest announcements for the account.
 * - `latestReviews` - Fetches the latest reviews for the account.
 * - `badgesCollected` - Fetches the badges collected by the account sequentially in random order.
 *
 * @typedef {Object} AccountFetchDetails
 *
 * @property {string} [address] - If present, the account corresponding to the specified address will be fetched. Please only specify one of `address` or `username`.
 * @property {string} [username] - If present, the account corresponding to the specified username will be fetched. Please only specify one of `address` or `username`.
 * @property {boolean} [fetchSequence] - If true, the sequence will be fetched from the blockchain.
 * @property {boolean} [fetchBalance] - If true, the $BADGE balance will be fetched from the blockchain.
 * @property {boolean} [noExternalCalls] - If true, only fetches local information stored in DB. Nothing external like resolved names, avatars, etc.
 * @property {Array<{ viewKey: AccountViewKey, bookmark: string }>} [viewsToFetch] - An array of views to fetch with associated bookmarks.
 *
 * @category API / Indexer
 */
export type AccountFetchDetails = {
  address?: string;
  username?: string;
  fetchSequence?: boolean;
  fetchBalance?: boolean;
  noExternalCalls?: boolean;
  viewsToFetch?: { viewKey: AccountViewKey, bookmark: string }[];
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
export type GetAccountsRouteResponse<T extends NumberType> =
  ErrorResponse | GetAccountsRouteSuccessResponse<T>;

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
export interface GetAccountRouteRequestBody {
  /**
   * Indicates whether to fetch the account's sequence.
   */
  fetchSequence?: boolean;

  /**
   * Indicates whether to fetch the account's balance.
   */
  fetchBalance?: boolean;

  /**
   * Indicates whether to avoid external API calls.
   */
  noExternalCalls?: boolean;

  /**
   * Indicates whether to fetch hidden badges.
   */
  fetchHidden?: boolean;

  /**
   * An array of views to fetch.
   */
  viewsToFetch?: {
    viewKey: AccountViewKey;
    bookmark: string;
  }[];
}

/**
 * @category API / Indexer
 */
export type GetAccountRouteSuccessResponse<T extends NumberType> =
  BitBadgesUserInfo<T>;

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
  hiddenBadges?: {
    collectionId: T;
    badgeIds: UintRange<T>[];
  }[];

  /**
   * An array of custom pages on the user's portolio. Used to customize, sort, and group badges into pages.
   */
  customPages?: {
    title: string;
    description: string;
    badges: {
      collectionId: T;
      badgeIds: UintRange<T>[];
    }[];
  }[];

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
   * A map of Cosmos addresses or mapping IDs -> Balance<NumberType>[].
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
   * The collection metadata or an array of badge metadata details to add.
   */
  collectionMetadata?: Metadata<NumberType> | BadgeMetadataDetails<NumberType>[] | Metadata<NumberType>[];
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
   * The blockchain chain to be signed in with.
   */
  chain: SupportedChain;

  /**
   * The user's blockchain address (in their native address).
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
    params: {
      ...item.params,
      assets: item.params.assets?.map((asset) => ({
        ...asset,
        assetIds: asset.assetIds.map((assetId) => convertUintRange(assetId as UintRange<T>, convertFunction)),
        ownershipTimes: asset.ownershipTimes ? asset.ownershipTimes.map((ownershipTime) => convertUintRange(ownershipTime, convertFunction)) : undefined,
        mustOwnAmounts: convertUintRange(asset.mustOwnAmounts, convertFunction),
      })),
    },
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
   * The original bytes of the Blockin message
   */
  originalBytes: any;

  /**
   * The signature bytes of the Blockin message
   */
  signatureBytes: any;
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
  addressMappings: { [category: string]: AddressMappingWithMetadata<T>[] };
  profiles: { [category: string]: BitBadgesUserInfo<T>[] };
  activity: TransferActivityInfo<T>[];
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
    addressMappings: Object.keys(item.addressMappings).reduce((acc, category) => {
      acc[category] = item.addressMappings[category].map((addressMapping) =>
        convertAddressMappingWithMetadata(addressMapping, convertFunction)
      );
      return acc;
    }, {} as { [category: string]: AddressMappingWithMetadata<U>[] }),
    profiles: Object.keys(item.profiles).reduce((acc, category) => {
      acc[category] = item.profiles[category].map((profile) => convertBitBadgesUserInfo(profile, convertFunction));
      return acc;
    }, {} as { [category: string]: BitBadgesUserInfo<U>[] }),
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)),
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
    info: string;
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
export interface GetAddressMappingsRouteRequestBody {
  /**
   * The mapping IDs to fetch. Can be reserved or custom IDs.
   */
  mappingIds: string[];
}

/**
 * @category API / Indexer
 */
export interface GetAddressMappingsRouteSuccessResponse<T extends NumberType> {
  addressMappings: AddressMappingWithMetadata<T>[];
}

/**
 * @category API / Indexer
 */
export type GetAddressMappingsRouteResponse<T extends NumberType> = ErrorResponse | GetAddressMappingsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertGetAddressMappingsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetAddressMappingsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetAddressMappingsRouteSuccessResponse<U> {
  return { addressMappings: item.addressMappings.map((addressMapping) => convertAddressMappingWithMetadata(addressMapping, convertFunction)) };
}

/**
 * @category API / Indexer
 */
export interface UpdateAddressMappingsRouteRequestBody {
  /**
   * New address mappings to update.
   * Requester must be creator of the mappings.
   * Only applicable to off-chain balances.
   */
  addressMappings: AddressMapping[];
}

/**
 * @category API / Indexer
 */
export interface UpdateAddressMappingsRouteSuccessResponse<T extends NumberType> { }

/**
 * @category API / Indexer
 */
export type UpdateAddressMappingsRouteResponse<T extends NumberType> = ErrorResponse | UpdateAddressMappingsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertUpdateAddressMappingsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: UpdateAddressMappingsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): UpdateAddressMappingsRouteSuccessResponse<U> {
  return { ...item };
}


/**
 * @category API / Indexer
 */
export interface DeleteAddressMappingsRouteRequestBody {
  /**
   * The mapping IDs to delete.
   */
  mappingIds: string[];
}

/**
 * @category API / Indexer
 */
export interface DeleteAddressMappingsRouteSuccessResponse<T extends NumberType> { }

/**
 * @category API / Indexer
 */
export type DeleteAddressMappingsRouteResponse<T extends NumberType> = ErrorResponse | DeleteAddressMappingsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertDeleteAddressMappingsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: DeleteAddressMappingsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): DeleteAddressMappingsRouteSuccessResponse<U> {
  return {
    ...item,
  };
}

/**
 * @category API / Indexer
 */
export interface GetApprovalsRouteRequestBody {
  /**
   * The approval tracker IDs to fetch.
   */
  amountTrackerIds: AmountTrackerIdDetails<NumberType>[];
}

/**
 * @category API / Indexer
 */
export interface GetApprovalsRouteSuccessResponse<T extends NumberType> {
  approvalTrackers: ApprovalsTrackerInfo<T>[];
}

/**
 * @category API / Indexer
 */
export type GetApprovalsRouteResponse<T extends NumberType> = ErrorResponse | GetApprovalsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertGetApprovalsRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetApprovalsRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetApprovalsRouteSuccessResponse<U> {
  return {
    approvalTrackers: item.approvalTrackers.map((approvalTracker) => convertApprovalsTrackerInfo(approvalTracker, convertFunction)),
  };
}

/**
 * @category API / Indexer
 */
export interface GetChallengeTrackersRouteRequestBody {
  /**
   * The challenge tracker IDs to fetch.
   */
  challengeTrackerIds: MerkleChallengeIdDetails<NumberType>[];
}

/**
 * @category API / Indexer
 */
export interface GetChallengeTrackersRouteSuccessResponse<T extends NumberType> {
  challengeTrackers: MerkleChallengeInfo<T>[];
}

/**
 * @category API / Indexer
 */
export type GetChallengeTrackersRouteResponse<T extends NumberType> = ErrorResponse | GetChallengeTrackersRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertGetChallengeTrackersRouteSuccessResponse<T extends NumberType, U extends NumberType>(
  item: GetChallengeTrackersRouteSuccessResponse<T>,
  convertFunction: (item: T) => U
): GetChallengeTrackersRouteSuccessResponse<U> {
  return {
    challengeTrackers: item.challengeTrackers.map((merkleChallenge) => convertMerkleChallengeInfo(merkleChallenge, convertFunction)),
  };
}

/**
 * @category API / Indexer
 */
export interface SendClaimAlertsRouteRequestBody<T extends NumberType> {
  collectionId: T;
  code?: string;
  message?: string;
  recipientAddress: string;
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
 * @property {number} [total] - The total number of documents in this view. This is only returned for the first fetch (when bookmark is empty string). It is not returned for subsequent fetches.
 * @category API / Indexer
 */
export interface PaginationInfo {
  bookmark: string;
  hasMore: boolean;
  total?: number;
}

/**
 * Information returned by the REST API getAccount route.
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
