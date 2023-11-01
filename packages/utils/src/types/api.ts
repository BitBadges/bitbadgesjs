import { DeliverTxResponse } from "@cosmjs/stargate"
import { AddressMapping, AmountTrackerIdDetails, NumberType, UintRange, convertUintRange } from "bitbadgesjs-proto"
import { BroadcastPostBody } from "bitbadgesjs-provider"
import { ChallengeParams } from "blockin"
import { TransferActivityInfo, convertTransferActivityInfo } from "./activity"
import { BadgeMetadataDetails, BitBadgesCollection, convertBadgeMetadataDetails, convertBitBadgesCollection } from "./collections"
import { ApprovalsTrackerInfo, BalanceInfoWithDetails, ChallengeDetails, MerkleChallengeIdDetails, MerkleChallengeInfo, MerkleChallengeTrackerIdDetails, QueueInfo, StatusInfo, convertApprovalsTrackerInfo, convertBalanceInfoWithDetails, convertMerkleChallengeInfo, convertQueueItem, convertStatusInfo } from "./db"
import { AddressMappingWithMetadata, Metadata, convertAddressMappingWithMetadata, convertMetadata } from "./metadata"
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
  //Serialized error object for debugging purposes. Advanced users can use this to debug issues.
  error?: any;
  //UX-friendly error message that can be displayed to the user. Always present if error.
  message: string;
  //Authentication error. Present if the user is not authenticated.
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
  status: StatusInfo<T>;
}
/**
 * @category API / Indexer
 */
export type GetStatusRouteResponse<T extends NumberType> = ErrorResponse | GetStatusRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetStatusRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetStatusRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetStatusRouteSuccessResponse<U> {
  return {
    status: convertStatusInfo(item.status, convertFunction),
  }
}


/**
 * @category API / Indexer
 */
export interface GetSearchRouteRequestBody { }
/**
 * @category API / Indexer
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
 * @category API / Indexer
 */
export function convertGetSearchRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetSearchRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetSearchRouteSuccessResponse<U> {
  return {
    ...item,
    collections: item.collections.map((collection) => convertBitBadgesCollection(collection, convertFunction)),
    accounts: item.accounts.map((account) => convertBitBadgesUserInfo(account, convertFunction)),
    addressMappings: item.addressMappings.map((addressMapping) => convertAddressMappingWithMetadata(addressMapping, convertFunction)),
    badges: item.badges.map((badge) => ({
      badgeIds: badge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
      collection: convertBitBadgesCollection(badge.collection, convertFunction),
    })),
  }
}

/**
 * Defines the options for fetching metadata.
 *
 * @typedef {Object} MetadataFetchOptions
 * @property {boolean} [doNotFetchCollectionMetadata] - If true, collection metadata will not be fetched.
 * @property {NumberType[] | UintRange<NumberType>[]} [metadataIds] - If present, the metadata corresponding to the specified metadata IDs will be fetched. See documentation for how to determine metadata IDs.
 * @property {string[]} [uris] - If present, the metadata corresponding to the specified URIs will be fetched.
 * @property {NumberType[] | UintRange<NumberType>[]} [badgeIds] - If present, the metadata corresponding to the specified badge IDs will be fetched.
 * @category API / Indexer
 */
export interface MetadataFetchOptions {
  doNotFetchCollectionMetadata?: boolean,
  metadataIds?: NumberType[] | UintRange<NumberType>[],
  uris?: string[],
  badgeIds?: NumberType[] | UintRange<NumberType>[],
}

/**
 * @category API / Indexer
 */
export type CollectionViewKey = 'latestActivity' | 'latestAnnouncements' | 'latestReviews' | 'owners' | 'merkleChallenges' | 'approvalsTrackers';

/**
 * Defines the options for fetching additional collection details.
 *
 * A view is a way of fetching additional details about a collectionm, and these will be queryable in the response via the `views` property.
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
  viewsToFetch?: {
    viewKey: CollectionViewKey,
    bookmark: string
  }[],

  fetchTotalAndMintBalances?: boolean,
  merkleChallengeIdsToFetch?: MerkleChallengeTrackerIdDetails<NumberType>[],
  approvalsTrackerIdsToFetch?: AmountTrackerIdDetails<NumberType>[],
  handleAllAndAppendDefaults?: boolean
  //customQueries?: { db: string, selector: any, key: string }[],
  //TODO: we can add fully custom queries here (i.e. supply own Mango selector)
}

/**
 * @category API / Indexer
 */
export interface GetMetadataForCollectionRequestBody {
  metadataToFetch?: MetadataFetchOptions,
}

/**
 * @category API / Indexer
 */
export interface GetCollectionBatchRouteRequestBody {
  collectionsToFetch: ({ collectionId: NumberType } & GetMetadataForCollectionRequestBody & GetAdditionalCollectionDetailsRequestBody)[],
}
/**
 * @category API / Indexer
 */
export interface GetCollectionBatchRouteSuccessResponse<T extends NumberType> {
  collections: BitBadgesCollection<T>[]
}
/**
 * @category API / Indexer
 */
export type GetCollectionBatchRouteResponse<T extends NumberType> = ErrorResponse | GetCollectionBatchRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetCollectionBatchRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetCollectionBatchRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetCollectionBatchRouteSuccessResponse<U> {
  return {
    collections: item.collections.map((collection) => convertBitBadgesCollection(collection, convertFunction)),
  }
}

/**
 * @category API / Indexer
 */
export interface GetCollectionByIdRouteRequestBody extends GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody { }
/**
 * @category API / Indexer
 */
export interface GetCollectionRouteSuccessResponse<T extends NumberType> {
  collection: BitBadgesCollection<T>,
}
/**
 * @category API / Indexer
 */
export type GetCollectionRouteResponse<T extends NumberType> = ErrorResponse | GetCollectionRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetCollectionRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetCollectionRouteSuccessResponse<U> {
  return {
    collection: convertBitBadgesCollection(item.collection, convertFunction),
  }
}

/**
 * @category API / Indexer
 */
export interface GetOwnersForBadgeRouteRequestBody {
  bookmark?: string,
}
/**
 * @category API / Indexer
 */
export interface GetOwnersForBadgeRouteSuccessResponse<T extends NumberType> {
  owners: BalanceInfoWithDetails<T>[],
  pagination: PaginationInfo,
}
/**
 * @category API / Indexer
 */
export type GetOwnersForBadgeRouteResponse<T extends NumberType> = ErrorResponse | GetOwnersForBadgeRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetOwnersForBadgeRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetOwnersForBadgeRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetOwnersForBadgeRouteSuccessResponse<U> {
  return {
    owners: item.owners.map((balance) => convertBalanceInfoWithDetails(balance, convertFunction)),
    pagination: item.pagination,
  }
}

/**
 * @category API / Indexer
 */
export interface GetMetadataForCollectionRouteRequestBody {
  metadataToFetch: MetadataFetchOptions,
}
/**
 * @category API / Indexer
 */
export interface GetMetadataForCollectionRouteSuccessResponse<T extends NumberType> {
  collectionMetadata?: Metadata<T>,
  badgeMetadata?: BadgeMetadataDetails<T>[],
}
/**
 * @category API / Indexer
 */
export type GetMetadataForCollectionRouteResponse<T extends NumberType> = ErrorResponse | GetMetadataForCollectionRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetMetadataForCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetMetadataForCollectionRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetMetadataForCollectionRouteSuccessResponse<U> {
  return {
    collectionMetadata: item.collectionMetadata ? convertMetadata(item.collectionMetadata, convertFunction) : undefined,
    badgeMetadata: item.badgeMetadata ? item.badgeMetadata.map(x => convertBadgeMetadataDetails(x, convertFunction)) : undefined,
  }
}

/**
 * @category API / Indexer
 */
export interface GetBadgeBalanceByAddressRouteRequestBody {
  doNotHandleAllAndAppendDefaults?: boolean,
}
/**
 * @category API / Indexer
 */
export interface GetBadgeBalanceByAddressRouteSuccessResponse<T extends NumberType> {
  balance: BalanceInfoWithDetails<T>,
}
/**
 * @category API / Indexer
 */
export type GetBadgeBalanceByAddressRouteResponse<T extends NumberType> = ErrorResponse | GetBadgeBalanceByAddressRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetBadgeBalanceByAddressRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetBadgeBalanceByAddressRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetBadgeBalanceByAddressRouteSuccessResponse<U> {
  return {
    balance: convertBalanceInfoWithDetails(item.balance, convertFunction),
  }
}

/**
 * @category API / Indexer
 */
export interface GetBadgeActivityRouteRequestBody {
  bookmark?: string,
}
/**
 * @category API / Indexer
 */
export interface GetBadgeActivityRouteSuccessResponse<T extends NumberType> {
  activity: TransferActivityInfo<T>[],
  pagination: PaginationInfo,
}
/**
 * @category API / Indexer
 */
export type GetBadgeActivityRouteResponse<T extends NumberType> = ErrorResponse | GetBadgeActivityRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetBadgeActivityRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetBadgeActivityRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetBadgeActivityRouteSuccessResponse<U> {
  return {
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)),
    pagination: item.pagination,
  }
}

/**
 * @category API / Indexer
 */
export interface RefreshMetadataRouteRequestBody { }
/**
 * @category API / Indexer
 */
export interface RefreshMetadataRouteSuccessResponse<T extends NumberType> {
  successMessage: string,
}
/**
 * @category API / Indexer
 */
export type RefreshMetadataRouteResponse<T extends NumberType> = ErrorResponse | RefreshMetadataRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertRefreshMetadataRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: RefreshMetadataRouteSuccessResponse<T>, convertFunction: (item: T) => U): RefreshMetadataRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface RefreshStatusRouteRequestBody<T extends NumberType> {
  collectionId: T,
}
/**
 * @category API / Indexer
 */
export interface RefreshStatusRouteSuccessResponse<T extends NumberType> {
  inQueue: boolean,
  errorDocs: QueueInfo<T>[],
}
/**
 * @category API / Indexer
 */
export type RefreshStatusRouteResponse<T extends NumberType> = ErrorResponse | RefreshStatusRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertRefreshStatusRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: RefreshStatusRouteSuccessResponse<T>, convertFunction: (item: T) => U): RefreshStatusRouteSuccessResponse<U> {
  return {
    ...item,
    errorDocs: item.errorDocs.map((errorDoc) => convertQueueItem(errorDoc, convertFunction)),
  };
}


/**
 * Type to allow you to specify the codes and passwords for a merkle challenge.
 *
 * We only support storing codes and passwords for merkle challenges created by BitBadges via IPFS. The IPFS CID of the merkle challenge is used to identify the merkle challenge.
 *
 * Note that we only support storing a set of codes and passwords once per unique CID.
 *
 * @category API / Indexer
 */
export interface CodesAndPasswords {
  cid: string,
  codes: string[],
  password: string,
}

/**
 * @category API / Indexer
 */
export interface GetAllCodesAndPasswordsRouteRequestBody { }
/**
 * @category API / Indexer
 */
export interface GetAllCodesAndPasswordsRouteSuccessResponse<T extends NumberType> {
  codesAndPasswords: CodesAndPasswords[],
}
/**
 * @category API / Indexer
 */
export type GetAllCodesAndPasswordsRouteResponse<T extends NumberType> = ErrorResponse | GetAllCodesAndPasswordsRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetAllCodesAndPasswordsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetAllCodesAndPasswordsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetAllCodesAndPasswordsRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetMerkleChallengeCodeViaPasswordRouteRequestBody { }
/**
 * @category API / Indexer
 */
export interface GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<T extends NumberType> {
  code: string,
}
/**
 * @category API / Indexer
 */
export type GetMerkleChallengeCodeViaPasswordRouteResponse<T extends NumberType> = ErrorResponse | GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetMerkleChallengeCodeViaPasswordRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddAnnouncementRouteRequestBody {
  announcement: string, //1 to 2048 characters
}
/**
 * @category API / Indexer
 */
export interface AddAnnouncementRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
/**
 * @category API / Indexer
 */
export type AddAnnouncementRouteResponse<T extends NumberType> = ErrorResponse | AddAnnouncementRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertAddAnnouncementRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddAnnouncementRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddAnnouncementRouteSuccessResponse<U> {
  return { ...item };
}


/**
 * @category API / Indexer
 */
export interface DeleteReviewRouteRequestBody {
  reviewId: string
}
/**
 * @category API / Indexer
 */
export interface DeleteReviewRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
/**
 * @category API / Indexer
 */
export type DeleteReviewRouteResponse<T extends NumberType> = ErrorResponse | DeleteReviewRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertDeleteReviewRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: DeleteReviewRouteSuccessResponse<T>, convertFunction: (item: T) => U): DeleteReviewRouteSuccessResponse<U> {
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
  success: boolean
}
/**
 * @category API / Indexer
 */
export type DeleteAnnouncementRouteResponse<T extends NumberType> = ErrorResponse | DeleteAnnouncementRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertDeleteAnnouncementRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: DeleteAnnouncementRouteSuccessResponse<T>, convertFunction: (item: T) => U): DeleteAnnouncementRouteSuccessResponse<U> {
  return { ...item };
}


/**
 * @category API / Indexer
 */
export interface AddReviewForCollectionRouteRequestBody {
  review: string, //1 to 2048 characters
  stars: NumberType, //1 to 5
}
/**
 * @category API / Indexer
 */
export interface AddReviewForCollectionRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
/**
 * @category API / Indexer
 */
export type AddReviewForCollectionRouteResponse<T extends NumberType> = ErrorResponse | AddReviewForCollectionRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertAddReviewForCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddReviewForCollectionRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddReviewForCollectionRouteSuccessResponse<U> {
  return { ...item };
}

/**
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
 * If the bookmark is not supplied, the first page will be returned.
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
 * @property {boolean} [fetchBalance] - If true, the balance will be fetched from the blockchain.
 * @property {boolean} [noExternalCalls] - If true, only fetches local information. Nothing external like resolved names, avatars, etc.
 */
/**
 * @category API / Indexer
 */
export type AccountFetchDetails = {
  address?: string,
  username?: string,
  fetchSequence?: boolean,
  fetchBalance?: boolean,
  noExternalCalls?: boolean,
  viewsToFetch?: {
    viewKey: AccountViewKey,
    bookmark: string,
    // mangoQuerySelector?: nano.MangoSelector
    // TODO: Allow users to specify their own mango query selector here. For now, we map the viewKey to a mango query selector.
  }[],
}

/**
 * @category API / Indexer
 */
export interface GetAccountsRouteRequestBody {
  accountsToFetch: AccountFetchDetails[],
}

/**
 * @category API / Indexer
 */
export interface GetAccountsRouteSuccessResponse<T extends NumberType> {
  accounts: BitBadgesUserInfo<T>[],
}
/**
 * @category API / Indexer
 */
export type GetAccountsRouteResponse<T extends NumberType> = ErrorResponse | GetAccountsRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetAccountsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetAccountsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetAccountsRouteSuccessResponse<U> {
  return {
    accounts: item.accounts.map((account) => convertBitBadgesUserInfo(account, convertFunction)),
  }
}

/**
 * @category API / Indexer
 */
export interface GetAccountRouteRequestBody {
  fetchSequence?: boolean,
  fetchBalance?: boolean,
  noExternalCalls?: boolean,
  fetchHidden?: boolean,
  viewsToFetch?: {
    viewKey: AccountViewKey,
    bookmark: string
  }[],
  //customQueries?: { db: string, selector: any, key: string }[],
  //TODO: we can add fully custom queries here (i.e. supply own Mango selector)
}

/**
 * @category API / Indexer
 */
export type GetAccountRouteSuccessResponse<T extends NumberType> = BitBadgesUserInfo<T>;
/**
 * @category API / Indexer
 */
export type GetAccountRouteResponse<T extends NumberType> = ErrorResponse | GetAccountRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetAccountRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetAccountRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetAccountRouteSuccessResponse<U> {
  return convertBitBadgesUserInfo(item, convertFunction);
}

/**
 * @category API / Indexer
 */
export interface AddReviewForUserRouteRequestBody {
  review: string, //1 to 2048 characters
  stars: NumberType, //1 to 5
}
/**
 * @category API / Indexer
 */
export interface AddReviewForUserRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
/**
 * @category API / Indexer
 */
export type AddReviewForUserRouteResponse<T extends NumberType> = ErrorResponse | AddReviewForUserRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertAddReviewForUserRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddReviewForUserRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddReviewForUserRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface UpdateAccountInfoRouteRequestBody<T extends NumberType> {
  discord?: string,
  twitter?: string,
  github?: string,
  telegram?: string,
  seenActivity?: NumberType,
  readme?: string,

  onlyShowApproved?: boolean
  shownBadges?: {
    collectionId: T,
    badgeIds: UintRange<T>[],
  }[],
  hiddenBadges?: {
    collectionId: T,
    badgeIds: UintRange<T>[],
  }[],

  customPages?: {
    title: string,
    description: string,
    badges: {
      collectionId: T,
      badgeIds: UintRange<T>[],
    }[]
  }[]

  profilePicUrl?: string
  username?: string

  profilePicImageFile?: any
}

/**
 * @category API / Indexer
 */
export interface UpdateAccountInfoRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
/**
 * @category API / Indexer
 */
export type UpdateAccountInfoRouteResponse<T extends NumberType> = ErrorResponse | UpdateAccountInfoRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertUpdateAccountInfoRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: UpdateAccountInfoRouteSuccessResponse<T>, convertFunction: (item: T) => U): UpdateAccountInfoRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddBalancesToOffChainStorageRouteRequestBody {
  balances: OffChainBalancesMap<NumberType>;
  method: 'ipfs' | 'centralized';
  collectionId: NumberType;
}
/**
 * @category API / Indexer
 */
export interface AddBalancesToOffChainStorageRouteSuccessResponse<T extends NumberType> {
  uri?: string,
  result: {
    cid?: string,
    // path: string,
  }
}
/**
 * @category API / Indexer
 */
export type AddBalancesToOffChainStorageRouteResponse<T extends NumberType> = ErrorResponse | AddBalancesToOffChainStorageRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertAddBalancesToOffChainStorageRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddBalancesToOffChainStorageRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddBalancesToOffChainStorageRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddMetadataToIpfsRouteRequestBody {
  collectionMetadata?: Metadata<NumberType>,
  badgeMetadata?: BadgeMetadataDetails<NumberType>[] | Metadata<NumberType>[],
}
/**
 * @category API / Indexer
 */
export interface AddMetadataToIpfsRouteSuccessResponse<T extends NumberType> {
  collectionMetadataResult?: {
    cid: string,
    // path: string,
  },
  badgeMetadataResults: {
    cid: string,
    // path: string,
  }[],
  allResults: {
    cid: string,
    // path: string,
  }[]
}
/**
 * @category API / Indexer
 */
export type AddMetadataToIpfsRouteResponse<T extends NumberType> = ErrorResponse | AddMetadataToIpfsRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertAddMetadataToIpfsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddMetadataToIpfsRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddMetadataToIpfsRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface AddApprovalDetailsToOffChainStorageRouteRequestBody {
  name: string,
  description: string,
  challengeDetails?: ChallengeDetails<NumberType>,
}
/**
 * @category API / Indexer
 */
export interface AddApprovalDetailsToOffChainStorageRouteSuccessResponse<T extends NumberType> {
  result: {
    cid: string,
    // path: string,
  }
}
/**
 * @category API / Indexer
 */
export type AddApprovalDetailsToOffChainStorageRouteResponse<T extends NumberType> = ErrorResponse | AddApprovalDetailsToOffChainStorageRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertAddApprovalDetailsToOffChainStorageRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddApprovalDetailsToOffChainStorageRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddApprovalDetailsToOffChainStorageRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetSignInChallengeRouteRequestBody {
  chain: SupportedChain,
  address: string,
  hours?: NumberType,
}
/**
 * @category API / Indexer
 */
export interface GetSignInChallengeRouteSuccessResponse<T extends NumberType> {
  nonce: string,
  params: ChallengeParams,
  blockinMessage: string,
}
/**
 * @category API / Indexer
 */
export type GetSignInChallengeRouteResponse<T extends NumberType> = ErrorResponse | GetSignInChallengeRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetSignInChallengeRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetSignInChallengeRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetSignInChallengeRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface VerifySignInRouteRequestBody {
  chain: SupportedChain,
  originalBytes: any
  signatureBytes: any
}
/**
 * @category API / Indexer
 */
export interface VerifySignInRouteSuccessResponse<T extends NumberType> {
  success: boolean,
  successMessage: string,
}
/**
 * @category API / Indexer
 */
export type VerifySignInRouteResponse<T extends NumberType> = ErrorResponse | VerifySignInRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertVerifySignInRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: VerifySignInRouteSuccessResponse<T>, convertFunction: (item: T) => U): VerifySignInRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface CheckSignInStatusRequestBody { }
/**
 * @category API / Indexer
 */
export interface CheckSignInStatusRequestSuccessResponse<T extends NumberType> {
  signedIn: boolean
}
/**
 * @category API / Indexer
 */
export type CheckSignInStatusResponse<T extends NumberType> = ErrorResponse | CheckSignInStatusRequestSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertCheckSignInStatusRequestSuccessResponse<T extends NumberType, U extends NumberType>(item: CheckSignInStatusRequestSuccessResponse<T>, convertFunction: (item: T) => U): CheckSignInStatusRequestSuccessResponse<U> {
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
  success: boolean,
}
/**
 * @category API / Indexer
 */
export type SignOutResponse<T extends NumberType> = ErrorResponse | SignOutSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertSignOutSuccessResponse<T extends NumberType, U extends NumberType>(item: SignOutSuccessResponse<T>, convertFunction: (item: T) => U): SignOutSuccessResponse<U> {
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
  collections: {
    [category: string]: BitBadgesCollection<T>[],
  },
  addressMappings: {
    [category: string]: AddressMappingWithMetadata<T>[],
  },
  profiles: {
    [category: string]: BitBadgesUserInfo<T>[],
  },
  activity: TransferActivityInfo<T>[],

}
/**
 * @category API / Indexer
 */
export type GetBrowseCollectionsRouteResponse<T extends NumberType> = ErrorResponse | GetBrowseCollectionsRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetBrowseCollectionsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetBrowseCollectionsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetBrowseCollectionsRouteSuccessResponse<U> {
  return {
    collections: Object.keys(item.collections).reduce((acc, category) => {
      acc[category] = item.collections[category].map((collection) => convertBitBadgesCollection(collection, convertFunction));
      return acc;
    }, {} as { [category: string]: BitBadgesCollection<U>[] }),
    addressMappings: Object.keys(item.addressMappings).reduce((acc, category) => {
      acc[category] = item.addressMappings[category].map((addressMapping) => convertAddressMappingWithMetadata(addressMapping, convertFunction));
      return acc;
    }, {} as { [category: string]: AddressMappingWithMetadata<U>[] }),
    profiles: Object.keys(item.profiles).reduce((acc, category) => {
      acc[category] = item.profiles[category].map((profile) => convertBitBadgesUserInfo(profile, convertFunction));
      return acc;
    }, {} as { [category: string]: BitBadgesUserInfo<U>[] }),
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)),
  }
}

/**
 * @category API / Indexer
 */
export type BroadcastTxRouteRequestBody = BroadcastPostBody;
/**
 * @category API / Indexer
 */
export interface BroadcastTxRouteSuccessResponse<T extends NumberType> {
  tx_response: {
    code: number,
    codespace: string,
    data: string,
    events: {
      type: string,
      attributes: {
        key: string,
        value: string,
        index: boolean,
      }[]
    }[],
    gas_wanted: string,
    gas_used: string,
    height: string,
    info: string,
    logs: {
      events: {
        type: string,
        attributes: {
          key: string,
          value: string,
          index: boolean,
        }[]
      }[],
    }[],
    raw_log: string,
    timestamp: string,
    tx: object | null,
    txhash: string,
  } //TODO: This and simulate response should be exported from an official Cosmos library
}

/**
 * @category API / Indexer
 */
export type BroadcastTxRouteResponse<T extends NumberType> = ErrorResponse | BroadcastTxRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertBroadcastTxRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: BroadcastTxRouteSuccessResponse<T>, convertFunction: (item: T) => U): BroadcastTxRouteSuccessResponse<U> {
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
  gas_info: {
    gas_used: string,
    gas_wanted: string,
  },
  result: {
    data: string,
    log: string,
    events: {
      type: string,
      attributes: {
        key: string,
        value: string,
        index: boolean,
      }[]
    }[],
    msg_responses: any[]
  }
}

/**
 * @category API / Indexer
 */
export type SimulateTxRouteResponse<T extends NumberType> = ErrorResponse | SimulateTxRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertSimulateTxRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: SimulateTxRouteSuccessResponse<T>, convertFunction: (item: T) => U): SimulateTxRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface FetchMetadataDirectlyRouteRequestBody {
  uris: string[],
}
/**
 * @category API / Indexer
 */
export interface FetchMetadataDirectlyRouteSuccessResponse<T extends NumberType> {
  metadata: Metadata<T>[],
}
/**
 * @category API / Indexer
 */
export type FetchMetadataDirectlyRouteResponse<T extends NumberType> = ErrorResponse | FetchMetadataDirectlyRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertFetchMetadataDirectlyRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: FetchMetadataDirectlyRouteSuccessResponse<T>, convertFunction: (item: T) => U): FetchMetadataDirectlyRouteSuccessResponse<U> {
  return {
    metadata: item.metadata.map((metadata) => convertMetadata(metadata, convertFunction)),
  }
}

/**
 * @category API / Indexer
 */
export type GetTokensFromFaucetRouteRequestBody = {};
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
export function convertGetTokensFromFaucetRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetTokensFromFaucetRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetTokensFromFaucetRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * @category API / Indexer
 */
export interface GetAddressMappingsRouteRequestBody {
  mappingIds: string[],
  managerAddress?: string,
}

/**
 * @category API / Indexer
 */
export interface GetAddressMappingsRouteSuccessResponse<T extends NumberType> {
  addressMappings: AddressMappingWithMetadata<T>[],
}

/**
 * @category API / Indexer
 */
export type GetAddressMappingsRouteResponse<T extends NumberType> = ErrorResponse | GetAddressMappingsRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetAddressMappingsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetAddressMappingsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetAddressMappingsRouteSuccessResponse<U> {
  return {
    addressMappings: item.addressMappings.map((addressMapping) => convertAddressMappingWithMetadata(addressMapping, convertFunction)),
  }
}

/**
 * @category API / Indexer
 */
export interface UpdateAddressMappingsRouteRequestBody {
  addressMappings: AddressMapping[],
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
export function convertUpdateAddressMappingsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: UpdateAddressMappingsRouteSuccessResponse<T>, convertFunction: (item: T) => U): UpdateAddressMappingsRouteSuccessResponse<U> {
  return {
    ...item,
  }
}

/**
 * @category API / Indexer
 */
export interface DeleteAddressMappingsRouteRequestBody {
  mappingIds: string[],
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
export function convertDeleteAddressMappingsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: DeleteAddressMappingsRouteSuccessResponse<T>, convertFunction: (item: T) => U): DeleteAddressMappingsRouteSuccessResponse<U> {
  return {
    ...item,
  }
}


/**
 * @category API / Indexer
 */
export interface GetApprovalsRouteRequestBody {
  amountTrackerIds: AmountTrackerIdDetails<NumberType>[],
}

/**
 * @category API / Indexer
 */
export interface GetApprovalsRouteSuccessResponse<T extends NumberType> {
  approvalTrackers: ApprovalsTrackerInfo<T>[],
}

/**
 * @category API / Indexer
 */
export type GetApprovalsRouteResponse<T extends NumberType> = ErrorResponse | GetApprovalsRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetApprovalsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetApprovalsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetApprovalsRouteSuccessResponse<U> {
  return {
    approvalTrackers: item.approvalTrackers.map((approvalTracker) => convertApprovalsTrackerInfo(approvalTracker, convertFunction)),
  }
}

/**
 * @category API / Indexer
 */
export interface GetMerkleChallengeTrackersRouteRequestBody {
  merkleChallengeTrackerIds: MerkleChallengeIdDetails<NumberType>[],
}

/**
 * @category API / Indexer
 */
export interface GetMerkleChallengeTrackersRouteSuccessResponse<T extends NumberType> {
  merkleChallengeTrackers: MerkleChallengeInfo<T>[],
}

/**
 * @category API / Indexer
 */
export type GetMerkleChallengeTrackersRouteResponse<T extends NumberType> = ErrorResponse | GetMerkleChallengeTrackersRouteSuccessResponse<T>;
/**
 * @category API / Indexer
 */
export function convertGetMerkleChallengeTrackersRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetMerkleChallengeTrackersRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetMerkleChallengeTrackersRouteSuccessResponse<U> {
  return {
    merkleChallengeTrackers: item.merkleChallengeTrackers.map((merkleChallenge) => convertMerkleChallengeInfo(merkleChallenge, convertFunction)),
  }
}

/**
 * @category API / Indexer
 */
export interface SendClaimAlertsRouteRequestBody<T extends NumberType> {
  collectionId: T,
  code?: string;
  message?: string;
  recipientAddress: string;
};

/**
 * @category API / Indexer
 */
export interface SendClaimAlertsRouteSuccessResponse<T extends NumberType> {
  success: boolean,
}

/**
 * @category API / Indexer
 */
export type SendClaimAlertsRouteResponse<T extends NumberType> = ErrorResponse | SendClaimAlertsRouteSuccessResponse<T>;

/**
 * @category API / Indexer
 */
export function convertSendClaimAlertsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: SendClaimAlertsRouteSuccessResponse<T>, convertFunction: (item: T) => U): SendClaimAlertsRouteSuccessResponse<U> {
  return {
    ...item,
  }
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
  bookmark: string,
  hasMore: boolean,
  total?: number,
}

/**
 * Information returned by the REST API getAccount route
 *
 * Note this should be converted into AccountDoc or BitBadgesUserInfo before being returned by the BitBadges API for consistency
 * @category API / Indexer
 */
export interface CosmosAccountResponse {
  account_number: number;
  sequence: number;
  pub_key: {
    key: string;
  }
  address: string;
}
