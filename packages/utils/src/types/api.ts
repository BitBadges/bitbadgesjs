import { DeliverTxResponse } from "@cosmjs/stargate"
import { ChallengeParams } from "blockin"
import { AnnouncementActivityItem, ReviewActivityItem, TransferActivityItem } from "./activity"
import { BitBadgesCollection } from "./collections"
import { BalanceDoc, DbStatus, LeavesDetails } from "./db"
import { Metadata } from "./metadata"
import { BalancesMap, MetadataMap, SupportedChain } from "./types"
import { BitBadgesUserInfo } from "./users"
import { NumberType } from "bitbadgesjs-proto"

/**
 * If an error occurs, the response will be an ErrorResponse.
 *
 * 400 - Bad Request (e.g. invalid request body)
 * 401 - Unauthorized (e.g. invalid session cookie; must sign in with Blockin)
 * 500 - Internal Server Error
 *
 * @typedef {Object} ErrorResponse
 */
export interface ErrorResponse {
  //Serialized error object for debugging purposes. Advanced users can use this to debug issues.
  error?: any;
  //UX-friendly error message that can be displayed to the user. Always present if error.
  message: string;
}

export interface GetStatusRouteRequestBody { }
export interface GetStatusRouteSuccessResponse {
  status: DbStatus<string>;
}
export type GetStatusRouteResponse = ErrorResponse | GetStatusRouteSuccessResponse;


export interface GetSearchRouteRequestBody { }
export interface GetSearchRouteSuccessResponse {
  collections: BitBadgesCollection<string>[],
  accounts: BitBadgesUserInfo<string>[],
}
export type GetSearchRouteResponse = ErrorResponse | GetSearchRouteSuccessResponse;

export interface GetCollectionBatchRouteRequestBody { }
export interface GetCollectionBatchRouteSuccessResponse {
  collections: BitBadgesCollection<string>[],
}
export type GetCollectionBatchRouteResponse = ErrorResponse | GetCollectionBatchRouteSuccessResponse;

export interface GetCollectionByIdRouteSuccessResponse {
  startMetadataId?: NumberType,
  activityBookmark?: string,
  announcementsBookmark?: string,
  reviewsBookmark?: string,
  balancesBookmark?: string,
  claimsBookmark?: string,
}
export interface GetCollectionRouteSuccessResponse {
  collection: BitBadgesCollection<string>,
  pagination: {
    activity: PaginationInfo
    announcements: PaginationInfo
    reviews: PaginationInfo,
    balances: PaginationInfo,
    claims: PaginationInfo,
  },
}
export type GetCollectionQueryRouteResponse = ErrorResponse | GetCollectionRouteSuccessResponse;

export interface GetOwnersForCollectionRouteRequestBody {
  bookmark?: string,
}
export interface GetOwnersForCollectionRouteSuccessResponse {
  balances: BalanceDoc<string>[],
}
export type GetOwnersForCollectionRouteResponse = ErrorResponse | GetOwnersForCollectionRouteSuccessResponse;

export interface GetMetadataForCollectionRouteRequestBody {
  startMetadataId?: NumberType,
}
export interface GetMetadataForCollectionRouteSuccessResponse {
  collectionMetadata: Metadata<string>,
  badgeMetadata: MetadataMap<string>,
}
export type GetMetadataForCollectionRouteResponse = ErrorResponse | GetMetadataForCollectionRouteSuccessResponse;

export interface GetBadgeBalanceRouteRequestBody { }
export interface GetBadgeBalanceRouteSuccessResponse {
  balance: BalanceDoc<string>,
}
export type GetBadgeBalanceRouteResponse = ErrorResponse | GetBadgeBalanceRouteSuccessResponse;

export interface GetBadgeActivityRouteRequestBody {
  bookmark?: string,
}
export interface GetBadgeActivityRouteSuccessResponse {
  activity: TransferActivityItem<string>[],
  pagination: {
    activity: PaginationInfo
  },
}
export type GetBadgeActivityRouteResponse = ErrorResponse | GetBadgeActivityRouteSuccessResponse;

export interface RefreshMetadataRouteRequestBody { }
export interface RefreshMetadataRouteSuccessResponse {
  successMessage: string,
}
export type RefreshMetadataRouteResponse = ErrorResponse | RefreshMetadataRouteSuccessResponse;

export interface RefreshBadgeMetadataRouteRequestBody { }
export interface GetCodesRouteSuccessResponse {
  codes: string[][],
  passwords: string[],
}
export type GetCodesRouteResponse = ErrorResponse | GetCodesRouteSuccessResponse;

export interface GetPasswordAndCodesRouteRequestBody { }
export interface GetPasswordAndCodesRouteSuccessResponse {
  code: string,
}
export type GetPasswordAndCodesRouteResponse = ErrorResponse | GetPasswordAndCodesRouteSuccessResponse;

export interface AddAnnouncementRouteRequestBody {
  announcement: string, //1 to 2048 characters
}
export interface AddAnnouncementRouteSuccessResponse {
  success: boolean
}
export type AddAnnouncementRouteResponse = ErrorResponse | AddAnnouncementRouteSuccessResponse;

export interface AddReviewForCollectionRouteRequestBody {
  review: string, //1 to 2048 characters
  stars: NumberType, //1 to 5
}
export interface AddReviewForCollectionRouteSuccessResponse {
  success: boolean
}
export type AddReviewForCollectionRouteResponse = ErrorResponse | AddReviewForCollectionRouteSuccessResponse;

export interface GetAccountsByAddressRouteRequestBody {
  addresses: string[],
}
export interface GetAccountsByAddressRouteSuccessResponse {
  accounts: BitBadgesUserInfo<string>[],
}
export type GetAccountsByAddressRouteResponse = ErrorResponse | GetAccountsByAddressRouteSuccessResponse;

export interface GetAccountRouteRequestBody {
  fetchFromBlockchain: boolean,
}
export type GetAccountRouteResponse = ErrorResponse | BitBadgesUserInfo<string>;

export interface GetPortfolioInfoRouteRequestBody {
  activityBookmark?: string,
  announcementsBookmark?: string,
  reviewsBookmark?: string,
  balancesBookmark?: string,
}

export interface GetPortfolioInfoRouteSuccessResponse {
  collected: BalanceDoc<string>[],
  activity: TransferActivityItem<string>[],
  announcements: AnnouncementActivityItem<string>[],
  reviews: ReviewActivityItem<string>[],
  pagination: {
    activity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  }
}
export type GetPortfolioInfoRouteResponse = ErrorResponse | GetPortfolioInfoRouteSuccessResponse;

export interface GetActivityRouteRequestBody {
  activityBookmark?: string,
  announcementsBookmark?: string,
}
export interface GetActivityForUserRouteSuccessResponse {
  activity: TransferActivityItem<string>[],
  announcements: AnnouncementActivityItem<string>[],
  pagination: {
    activity: PaginationInfo,
    announcements: PaginationInfo,
  }
}
export type GetActivityForUserRouteResponse = ErrorResponse | GetActivityForUserRouteSuccessResponse;

export interface AddReviewForUserRouteRequestBody {
  review: string, //1 to 2048 characters
  stars: NumberType, //1 to 5
}
export interface AddReviewForUserRouteSuccessResponse {
  success: boolean
}
export type AddReviewForUserRouteResponse = ErrorResponse | AddReviewForUserRouteSuccessResponse;

export interface UpdateAccountInfoRouteRequestBody {
  discord?: string,
  twitter?: string,
  github?: string,
  telegram?: string,
  seenActivity?: NumberType,
  readme?: string,
}
export interface UpdateAccountInfoRouteSuccessResponse {
  success: boolean
}
export type UpdateAccountInfoRouteResponse = ErrorResponse | UpdateAccountInfoRouteSuccessResponse;

export interface AddMetadataToIpfsRouteRequestBody {
  collectionMetadata?: Metadata<string>,
  badgeMetadata?: MetadataMap<string>,
  balances?: BalancesMap<string>,
}
export interface AddMetadataToIpfsRouteSuccessResponse {
  cid: string,
  path: string,
}
export type AddMetadataToIpfsRouteResponse = ErrorResponse | AddMetadataToIpfsRouteSuccessResponse;

export interface AddClaimToIpfsRouteSuccessResponse {
  name: string,
  description: string,
  leavesDetails: LeavesDetails,
  password?: string
}
export interface AddClaimToIpfsRouteSuccessResponse {
  cid: string,
  path: string,
}
export type AddClaimToIpfsRouteResponse = ErrorResponse | AddClaimToIpfsRouteSuccessResponse;

export interface GetChallengeRouteRequestBody {
  chain: SupportedChain,
  address: string,
  hours?: NumberType,
}
export interface GetChallengeRouteSuccessResponse {
  nonce: string,
  params: ChallengeParams,
  blockinMessage: string,
}
export type GetChallengeRouteResponse = ErrorResponse | GetChallengeRouteSuccessResponse;

export interface VerifyBlockinAndGrantSessionCookieRouteRequestBody {
  chain: SupportedChain,
  originalBytes: any
  signatureBytes: any
}
export interface VerifyBlockinAndGrantSessionCookieRouteSuccessResponse {
  success: boolean,
  successMessage: string,
}
export type VerifyBlockinAndGrantSessionCookieRouteResponse = ErrorResponse | VerifyBlockinAndGrantSessionCookieRouteSuccessResponse;

export interface RemoveBlockinSessionCookieRouteRequestBody { }
export interface RemoveBlockinSessionCookieRouteSuccessResponse {
  success: boolean,
}
export type RemoveBlockinSessionCookieRouteResponse = ErrorResponse | RemoveBlockinSessionCookieRouteSuccessResponse;

export interface GetBrowseCollectionsRouteRequestBody { }
export interface GetBrowseCollectionsRouteSuccessResponse {
  [category: string]: BitBadgesCollection<string>[],
}
export type GetBrowseCollectionsRouteResponse = ErrorResponse | GetBrowseCollectionsRouteSuccessResponse;

export interface BroadcastTxRouteRequestBody {
  //TODO: Raw TX Bytes
}
export interface BroadcastTxRouteSuccessResponse {
  //TODO:`
}
export type BroadcastTxRouteResponse = ErrorResponse | BroadcastTxRouteSuccessResponse;

export interface SimulateTxRouteRequestBody {
  //TODO: Raw TX Bytes
}
export interface SimulateTxRouteSuccessResponse {
  //TODO:
}
export type SimulateTxRouteResponse = ErrorResponse | SimulateTxRouteSuccessResponse;

export interface FetchMetadataDirectlyRouteRequestBody {
  uri: string,
}
export interface FetchMetadataDirectlyRouteSuccessResponse {
  metadata: Metadata<string>,
}
export type FetchMetadataDirectlyRouteResponse = ErrorResponse | FetchMetadataDirectlyRouteSuccessResponse;

export type SendTokensFromFaucetRouteResponse = DeliverTxResponse | ErrorResponse;

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
