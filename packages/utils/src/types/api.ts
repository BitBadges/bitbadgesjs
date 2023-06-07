import { DeliverTxResponse } from "@cosmjs/stargate"
import { BroadcastPostBody } from "bitbadgesjs-provider"
import { ChallengeParams } from "blockin"
import { TransferActivityInfo } from "./activity"
import { BitBadgesCollection } from "./collections"
import { BalanceInfo, LeavesDetails, StatusInfo } from "./db"
import { Metadata } from "./metadata"
import { JSPrimitiveNumberType } from "./string-numbers"
import { BalancesMap, MetadataMap, SupportedChain } from "./types"
import { BitBadgesUserInfo } from "./users"

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
  //Authentication error. Present if the user is not authenticated.
  unauthorized?: boolean;
}

export interface GetStatusRouteRequestBody { }
export interface GetStatusRouteSuccessResponse {
  status: StatusInfo<string>;
}
export type GetStatusRouteResponse = ErrorResponse | GetStatusRouteSuccessResponse;


export interface GetSearchRouteRequestBody { }
export interface GetSearchRouteSuccessResponse {
  collections: BitBadgesCollection<string>[],
  accounts: BitBadgesUserInfo<string>[],
}
export type GetSearchRouteResponse = ErrorResponse | GetSearchRouteSuccessResponse;

export interface GetCollectionBatchRouteRequestBody {
  collectionIds: JSPrimitiveNumberType[],
  startMetadataIds?: JSPrimitiveNumberType[],
}
export interface GetCollectionBatchRouteSuccessResponse {
  collections: BitBadgesCollection<string>[]
}
export type GetCollectionBatchRouteResponse = ErrorResponse | GetCollectionBatchRouteSuccessResponse;

export interface CollectionResponsePagination {
  activity: PaginationInfo
  announcements: PaginationInfo
  reviews: PaginationInfo,
  balances: PaginationInfo,
  claims: PaginationInfo,
}

export interface GetCollectionByIdRouteRequestBody {
  startMetadataId?: JSPrimitiveNumberType,
  activityBookmark?: string,
  announcementsBookmark?: string,
  reviewsBookmark?: string,
  balancesBookmark?: string,
  claimsBookmark?: string,
}
export interface GetCollectionRouteSuccessResponse {
  collection: BitBadgesCollection<string>,
}
export type GetCollectionRouteResponse = ErrorResponse | GetCollectionRouteSuccessResponse;

export interface GetOwnersForBadgeRouteRequestBody {
  bookmark?: string,
}
export interface GetOwnersForBadgeRouteSuccessResponse {
  balances: BalanceInfo<string>[],
}
export type GetOwnersForBadgeRouteResponse = ErrorResponse | GetOwnersForBadgeRouteSuccessResponse;

export interface GetMetadataForCollectionRouteRequestBody {
  startMetadataId?: JSPrimitiveNumberType,
}
export interface GetMetadataForCollectionRouteSuccessResponse {
  collectionMetadata?: Metadata<string>,
  badgeMetadata?: MetadataMap<string>,
}
export type GetMetadataForCollectionRouteResponse = ErrorResponse | GetMetadataForCollectionRouteSuccessResponse;

export interface GetBadgeBalanceByAddressRouteRequestBody { }
export interface GetBadgeBalanceByAddressRouteSuccessResponse {
  balance: BalanceInfo<string>,
}
export type GetBadgeBalanceByAddressRouteResponse = ErrorResponse | GetBadgeBalanceByAddressRouteSuccessResponse;

export interface GetBadgeActivityRouteRequestBody {
  bookmark?: string,
}
export interface GetBadgeActivityRouteSuccessResponse {
  activity: TransferActivityInfo<string>[],
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
export interface GetAllCodesAndPasswordsRouteSuccessResponse {
  codes: string[][],
  passwords: string[],
}
export type GetAllCodesAndPasswordsRouteResponse = ErrorResponse | GetAllCodesAndPasswordsRouteSuccessResponse;

export interface GetClaimCodeViaPasswordRouteRequestBody { }
export interface GetClaimCodeViaPasswordRouteSuccessResponse {
  code: string,
}
export type GetClaimCodeViaPasswordRouteResponse = ErrorResponse | GetClaimCodeViaPasswordRouteSuccessResponse;

export interface AddAnnouncementRouteRequestBody {
  announcement: string, //1 to 2048 characters
}
export interface AddAnnouncementRouteSuccessResponse {
  success: boolean
}
export type AddAnnouncementRouteResponse = ErrorResponse | AddAnnouncementRouteSuccessResponse;

export interface AddReviewForCollectionRouteRequestBody {
  review: string, //1 to 2048 characters
  stars: JSPrimitiveNumberType, //1 to 5
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
  fetchFromBlockchain?: boolean,
  activityBookmark?: string,
  announcementsBookmark?: string,
  reviewsBookmark?: string,
  balancesBookmark?: string,
  collectedBookmark?: string,
}
export type GetAccountRouteSuccessResponse = BitBadgesUserInfo<string>;
export type GetAccountRouteResponse = ErrorResponse | GetAccountRouteSuccessResponse;

export interface AddReviewForUserRouteRequestBody {
  review: string, //1 to 2048 characters
  stars: JSPrimitiveNumberType, //1 to 5
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
  seenActivity?: JSPrimitiveNumberType,
  readme?: string,
}
export interface UpdateAccountInfoRouteSuccessResponse {
  success: boolean
}
export type UpdateAccountInfoRouteResponse = ErrorResponse | UpdateAccountInfoRouteSuccessResponse;

export interface AddMetadataToIpfsRouteRequestBody {
  collectionMetadata?: Metadata<JSPrimitiveNumberType>,
  badgeMetadata?: MetadataMap<JSPrimitiveNumberType>,
  balances?: BalancesMap<JSPrimitiveNumberType>,
}
export interface AddMetadataToIpfsRouteSuccessResponse {
  cid: string,
  path: string,
}
export type AddMetadataToIpfsRouteResponse = ErrorResponse | AddMetadataToIpfsRouteSuccessResponse;

export interface AddClaimToIpfsRouteRequestBody {
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

export interface GetSignInChallengeRouteRequestBody {
  chain: SupportedChain,
  address: string,
  hours?: JSPrimitiveNumberType,
}
export interface GetSignInChallengeRouteSuccessResponse {
  nonce: string,
  params: ChallengeParams,
  blockinMessage: string,
}
export type GetSignInChallengeRouteResponse = ErrorResponse | GetSignInChallengeRouteSuccessResponse;

export interface VerifySignInRouteRequestBody {
  chain: SupportedChain,
  originalBytes: any
  signatureBytes: any
}
export interface VerifySignInRouteSuccessResponse {
  success: boolean,
  successMessage: string,
}
export type VerifySignInRouteResponse = ErrorResponse | VerifySignInRouteSuccessResponse;

export interface SignOutRequestBody { }
export interface SignOutSuccessResponse {
  success: boolean,
}
export type SignOutResponse = ErrorResponse | SignOutSuccessResponse;

export interface GetBrowseCollectionsRouteRequestBody { }
export interface GetBrowseCollectionsRouteSuccessResponse {
  [category: string]: BitBadgesCollection<string>[],
}
export type GetBrowseCollectionsRouteResponse = ErrorResponse | GetBrowseCollectionsRouteSuccessResponse;

export type BroadcastTxRouteRequestBody = BroadcastPostBody;
export interface BroadcastTxRouteSuccessResponse {
  //TODO:`
}
export type BroadcastTxRouteResponse = ErrorResponse | BroadcastTxRouteSuccessResponse;

export type SimulateTxRouteRequestBody = BroadcastPostBody;
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

export type GetTokensFromFaucetRouteRequestBody = {};
export type GetTokensFromFaucetRouteResponse = DeliverTxResponse | ErrorResponse;
export type GetTokensFromFaucetRouteSuccessResponse = DeliverTxResponse;

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
