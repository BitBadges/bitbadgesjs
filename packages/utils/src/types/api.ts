import { DeliverTxResponse } from "@cosmjs/stargate"
import { AddressMapping, ApprovalTrackerIdDetails, UintRange } from "bitbadgesjs-proto"
import { BroadcastPostBody } from "bitbadgesjs-provider"
import { ChallengeParams } from "blockin"
import { TransferActivityInfo, convertTransferActivityInfo } from "./activity"
import { BadgeMetadataDetails, BitBadgesCollection, convertBadgeMetadataDetails, convertBitBadgesCollection } from "./collections"
import { ApprovalsTrackerInfo, BalanceInfo, ChallengeDetails, MerkleChallengeIdDetails, MerkleChallengeInfo, StatusInfo, convertApprovalsTrackerInfo, convertBalanceInfo, convertMerkleChallengeInfo, convertStatusInfo } from "./db"
import { Metadata, convertMetadata } from "./metadata"
import { NumberType } from "./string-numbers"
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
export interface GetStatusRouteSuccessResponse<T extends NumberType> {
  status: StatusInfo<T>;
}
export type GetStatusRouteResponse<T extends NumberType> = ErrorResponse | GetStatusRouteSuccessResponse<T>;
export function convertGetStatusRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetStatusRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetStatusRouteSuccessResponse<U> {
  return {
    status: convertStatusInfo(item.status, convertFunction),
  }
}


export interface GetSearchRouteRequestBody { }
export interface GetSearchRouteSuccessResponse<T extends NumberType> {
  collections: BitBadgesCollection<T>[],
  accounts: BitBadgesUserInfo<T>[],
}
export type GetSearchRouteResponse<T extends NumberType> = ErrorResponse | GetSearchRouteSuccessResponse<T>;
export function convertGetSearchRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetSearchRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetSearchRouteSuccessResponse<U> {
  return {
    collections: item.collections.map((collection) => convertBitBadgesCollection(collection, convertFunction)),
    accounts: item.accounts.map((account) => convertBitBadgesUserInfo(account, convertFunction)),
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
 */
export interface MetadataFetchOptions {
  doNotFetchCollectionMetadata?: boolean,
  metadataIds?: NumberType[] | UintRange<NumberType>[],
  uris?: string[],
  badgeIds?: NumberType[] | UintRange<NumberType>[],
}

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
 * @property {ApprovalTrackerIdDetails<NumberType>[]} [approvalsTrackerIdsToFetch] - If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
 */
export interface GetAdditionalCollectionDetailsRequestBody {
  viewsToFetch?: {
    viewKey: CollectionViewKey,
    bookmark: string
  }[],
  fetchTotalAndMintBalances?: boolean,
  merkleChallengeIdsToFetch?: string[],
  approvalsTrackerIdsToFetch?: ApprovalTrackerIdDetails<NumberType>[],
  //customQueries?: { db: string, selector: any, key: string }[],
  //TODO: we can add fully custom queries here (i.e. supply own Mango selector)
}

export interface GetMetadataForCollectionRequestBody {
  metadataToFetch?: MetadataFetchOptions,
}

export interface GetCollectionBatchRouteRequestBody {
  collectionsToFetch: ({ collectionId: NumberType } & GetMetadataForCollectionRequestBody & GetAdditionalCollectionDetailsRequestBody)[],
}
export interface GetCollectionBatchRouteSuccessResponse<T extends NumberType> {
  collections: BitBadgesCollection<T>[]
}
export type GetCollectionBatchRouteResponse<T extends NumberType> = ErrorResponse | GetCollectionBatchRouteSuccessResponse<T>;
export function convertGetCollectionBatchRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetCollectionBatchRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetCollectionBatchRouteSuccessResponse<U> {
  return {
    collections: item.collections.map((collection) => convertBitBadgesCollection(collection, convertFunction)),
  }
}

export interface GetCollectionByIdRouteRequestBody extends GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody { }
export interface GetCollectionRouteSuccessResponse<T extends NumberType> {
  collection: BitBadgesCollection<T>,
}
export type GetCollectionRouteResponse<T extends NumberType> = ErrorResponse | GetCollectionRouteSuccessResponse<T>;
export function convertGetCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetCollectionRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetCollectionRouteSuccessResponse<U> {
  return {
    collection: convertBitBadgesCollection(item.collection, convertFunction),
  }
}

export interface GetOwnersForBadgeRouteRequestBody {
  bookmark?: string,
}
export interface GetOwnersForBadgeRouteSuccessResponse<T extends NumberType> {
  owners: BalanceInfo<T>[],
  pagination: PaginationInfo,
}
export type GetOwnersForBadgeRouteResponse<T extends NumberType> = ErrorResponse | GetOwnersForBadgeRouteSuccessResponse<T>;
export function convertGetOwnersForBadgeRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetOwnersForBadgeRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetOwnersForBadgeRouteSuccessResponse<U> {
  return {
    owners: item.owners.map((balance) => convertBalanceInfo(balance, convertFunction)),
    pagination: item.pagination,
  }
}

export interface GetMetadataForCollectionRouteRequestBody {
  metadataToFetch: MetadataFetchOptions,
}
export interface GetMetadataForCollectionRouteSuccessResponse<T extends NumberType> {
  collectionMetadata?: Metadata<T>,
  badgeMetadata?: BadgeMetadataDetails<T>[],
}
export type GetMetadataForCollectionRouteResponse<T extends NumberType> = ErrorResponse | GetMetadataForCollectionRouteSuccessResponse<T>;
export function convertGetMetadataForCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetMetadataForCollectionRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetMetadataForCollectionRouteSuccessResponse<U> {
  return {
    collectionMetadata: item.collectionMetadata ? convertMetadata(item.collectionMetadata, convertFunction) : undefined,
    badgeMetadata: item.badgeMetadata ? item.badgeMetadata.map(x => convertBadgeMetadataDetails(x, convertFunction)) : undefined,
  }
}

export interface GetBadgeBalanceByAddressRouteRequestBody { }
export interface GetBadgeBalanceByAddressRouteSuccessResponse<T extends NumberType> {
  balance: BalanceInfo<T>,
}
export type GetBadgeBalanceByAddressRouteResponse<T extends NumberType> = ErrorResponse | GetBadgeBalanceByAddressRouteSuccessResponse<T>;
export function convertGetBadgeBalanceByAddressRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetBadgeBalanceByAddressRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetBadgeBalanceByAddressRouteSuccessResponse<U> {
  return {
    balance: convertBalanceInfo(item.balance, convertFunction),
  }
}

export interface GetBadgeActivityRouteRequestBody {
  bookmark?: string,
}
export interface GetBadgeActivityRouteSuccessResponse<T extends NumberType> {
  activity: TransferActivityInfo<T>[],
  pagination: PaginationInfo,
}
export type GetBadgeActivityRouteResponse<T extends NumberType> = ErrorResponse | GetBadgeActivityRouteSuccessResponse<T>;
export function convertGetBadgeActivityRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetBadgeActivityRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetBadgeActivityRouteSuccessResponse<U> {
  return {
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)),
    pagination: item.pagination,
  }
}

export interface RefreshMetadataRouteRequestBody { }
export interface RefreshMetadataRouteSuccessResponse<T extends NumberType> {
  successMessage: string,
}
export type RefreshMetadataRouteResponse<T extends NumberType> = ErrorResponse | RefreshMetadataRouteSuccessResponse<T>;
export function convertRefreshMetadataRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: RefreshMetadataRouteSuccessResponse<T>, convertFunction: (item: T) => U): RefreshMetadataRouteSuccessResponse<U> {
  return { ...item };
}

/**
 * Type to allow you to specify the codes and passwords for a merkle challenge.
 *
 * We only support storing codes and passwords for merkle challenges created by BitBadges via IPFS. The IPFS CID of the merkle challenge is used to identify the merkle challenge.
 *
 * Note that we only support storing a set of codes and passwords once per unique CID.
 */
export interface CodesAndPasswords {
  cid: string,
  codes: string[],
  password: string,
}

export interface GetAllCodesAndPasswordsRouteRequestBody { }
export interface GetAllCodesAndPasswordsRouteSuccessResponse<T extends NumberType> {
  codesAndPasswords: CodesAndPasswords[],
}
export type GetAllCodesAndPasswordsRouteResponse<T extends NumberType> = ErrorResponse | GetAllCodesAndPasswordsRouteSuccessResponse<T>;
export function convertGetAllCodesAndPasswordsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetAllCodesAndPasswordsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetAllCodesAndPasswordsRouteSuccessResponse<U> {
  return { ...item };
}

export interface GetMerkleChallengeCodeViaPasswordRouteRequestBody { }
export interface GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<T extends NumberType> {
  code: string,
}
export type GetMerkleChallengeCodeViaPasswordRouteResponse<T extends NumberType> = ErrorResponse | GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<T>;
export function convertGetMerkleChallengeCodeViaPasswordRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<U> {
  return { ...item };
}

export interface AddAnnouncementRouteRequestBody {
  announcement: string, //1 to 2048 characters
}
export interface AddAnnouncementRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
export type AddAnnouncementRouteResponse<T extends NumberType> = ErrorResponse | AddAnnouncementRouteSuccessResponse<T>;
export function convertAddAnnouncementRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddAnnouncementRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddAnnouncementRouteSuccessResponse<U> {
  return { ...item };
}

export interface AddReviewForCollectionRouteRequestBody {
  review: string, //1 to 2048 characters
  stars: NumberType, //1 to 5
}
export interface AddReviewForCollectionRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
export type AddReviewForCollectionRouteResponse<T extends NumberType> = ErrorResponse | AddReviewForCollectionRouteSuccessResponse<T>;
export function convertAddReviewForCollectionRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddReviewForCollectionRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddReviewForCollectionRouteSuccessResponse<U> {
  return { ...item };
}

export type AccountViewKey = 'latestActivity' | 'latestAnnouncements' | 'latestReviews' | 'badgesCollected';

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
 */
export type AccountFetchDetails = {
  address?: string,
  username?: string,
  fetchSequence?: boolean,
  fetchBalance?: boolean,
  viewsToFetch?: {
    viewKey: AccountViewKey,
    bookmark: string,
    // mangoQuerySelector?: nano.MangoSelector
    // TODO: Allow users to specify their own mango query selector here. For now, we map the viewKey to a mango query selector.
  }[],
}

export interface GetAccountsRouteRequestBody {
  accountsToFetch: AccountFetchDetails[],
}

export interface GetAccountsRouteSuccessResponse<T extends NumberType> {
  accounts: BitBadgesUserInfo<T>[],
}
export type GetAccountsRouteResponse<T extends NumberType> = ErrorResponse | GetAccountsRouteSuccessResponse<T>;
export function convertGetAccountsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetAccountsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetAccountsRouteSuccessResponse<U> {
  return {
    accounts: item.accounts.map((account) => convertBitBadgesUserInfo(account, convertFunction)),
  }
}

export interface GetAccountRouteRequestBody {
  fetchSequence?: boolean,
  fetchBalance?: boolean,
  viewsToFetch?: {
    viewKey: AccountViewKey,
    bookmark: string
  }[],
  //customQueries?: { db: string, selector: any, key: string }[],
  //TODO: we can add fully custom queries here (i.e. supply own Mango selector)
}
export type GetAccountRouteSuccessResponse<T extends NumberType> = BitBadgesUserInfo<T>;
export type GetAccountRouteResponse<T extends NumberType> = ErrorResponse | GetAccountRouteSuccessResponse<T>;
export function convertGetAccountRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetAccountRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetAccountRouteSuccessResponse<U> {
  return convertBitBadgesUserInfo(item, convertFunction);
}

export interface AddReviewForUserRouteRequestBody {
  review: string, //1 to 2048 characters
  stars: NumberType, //1 to 5
}
export interface AddReviewForUserRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
export type AddReviewForUserRouteResponse<T extends NumberType> = ErrorResponse | AddReviewForUserRouteSuccessResponse<T>;
export function convertAddReviewForUserRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddReviewForUserRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddReviewForUserRouteSuccessResponse<U> {
  return { ...item };
}

export interface UpdateAccountInfoRouteRequestBody {
  discord?: string,
  twitter?: string,
  github?: string,
  telegram?: string,
  seenActivity?: NumberType,
  readme?: string,
}
export interface UpdateAccountInfoRouteSuccessResponse<T extends NumberType> {
  success: boolean
}
export type UpdateAccountInfoRouteResponse<T extends NumberType> = ErrorResponse | UpdateAccountInfoRouteSuccessResponse<T>;
export function convertUpdateAccountInfoRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: UpdateAccountInfoRouteSuccessResponse<T>, convertFunction: (item: T) => U): UpdateAccountInfoRouteSuccessResponse<U> {
  return { ...item };
}

export interface AddBalancesToIpfsRouteRequestBody {
  balances: OffChainBalancesMap<NumberType>,
}
export interface AddBalancesToIpfsRouteSuccessResponse<T extends NumberType> {
  result: {
    cid: string,
    path: string,
  }
}
export type AddBalancesToIpfsRouteResponse<T extends NumberType> = ErrorResponse | AddBalancesToIpfsRouteSuccessResponse<T>;
export function convertAddBalancesToIpfsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddBalancesToIpfsRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddBalancesToIpfsRouteSuccessResponse<U> {
  return { ...item };
}

export interface AddMetadataToIpfsRouteRequestBody {
  collectionMetadata?: Metadata<NumberType>,
  badgeMetadata?: BadgeMetadataDetails<NumberType>[] | Metadata<NumberType>[],
}
export interface AddMetadataToIpfsRouteSuccessResponse<T extends NumberType> {
  collectionMetadataResult?: {
    cid: string,
    path: string,
  },
  badgeMetadataResults: {
    cid: string,
    path: string,
  }[],
  allResults: {
    cid: string,
    path: string,
  }[]
}
export type AddMetadataToIpfsRouteResponse<T extends NumberType> = ErrorResponse | AddMetadataToIpfsRouteSuccessResponse<T>;
export function convertAddMetadataToIpfsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddMetadataToIpfsRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddMetadataToIpfsRouteSuccessResponse<U> {
  return { ...item };
}

export interface AddMerkleChallengeToIpfsRouteRequestBody {
  name: string,
  description: string,
  challengeDetails?: ChallengeDetails<NumberType>,
}
export interface AddMerkleChallengeToIpfsRouteSuccessResponse<T extends NumberType> {
  result: {
    cid: string,
    path: string,
  }
}
export type AddMerkleChallengeToIpfsRouteResponse<T extends NumberType> = ErrorResponse | AddMerkleChallengeToIpfsRouteSuccessResponse<T>;
export function convertAddMerkleChallengeToIpfsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: AddMerkleChallengeToIpfsRouteSuccessResponse<T>, convertFunction: (item: T) => U): AddMerkleChallengeToIpfsRouteSuccessResponse<U> {
  return { ...item };
}

export interface GetSignInChallengeRouteRequestBody {
  chain: SupportedChain,
  address: string,
  hours?: NumberType,
}
export interface GetSignInChallengeRouteSuccessResponse<T extends NumberType> {
  nonce: string,
  params: ChallengeParams,
  blockinMessage: string,
}
export type GetSignInChallengeRouteResponse<T extends NumberType> = ErrorResponse | GetSignInChallengeRouteSuccessResponse<T>;
export function convertGetSignInChallengeRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetSignInChallengeRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetSignInChallengeRouteSuccessResponse<U> {
  return { ...item };
}

export interface VerifySignInRouteRequestBody {
  chain: SupportedChain,
  originalBytes: any
  signatureBytes: any
}
export interface VerifySignInRouteSuccessResponse<T extends NumberType> {
  success: boolean,
  successMessage: string,
}
export type VerifySignInRouteResponse<T extends NumberType> = ErrorResponse | VerifySignInRouteSuccessResponse<T>;
export function convertVerifySignInRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: VerifySignInRouteSuccessResponse<T>, convertFunction: (item: T) => U): VerifySignInRouteSuccessResponse<U> {
  return { ...item };
}

export interface SignOutRequestBody { }
export interface SignOutSuccessResponse<T extends NumberType> {
  success: boolean,
}
export type SignOutResponse<T extends NumberType> = ErrorResponse | SignOutSuccessResponse<T>;
export function convertSignOutSuccessResponse<T extends NumberType, U extends NumberType>(item: SignOutSuccessResponse<T>, convertFunction: (item: T) => U): SignOutSuccessResponse<U> {
  return { ...item };
}

export interface GetBrowseCollectionsRouteRequestBody { }
export interface GetBrowseCollectionsRouteSuccessResponse<T extends NumberType> {
  [category: string]: BitBadgesCollection<T>[],
}
export type GetBrowseCollectionsRouteResponse<T extends NumberType> = ErrorResponse | GetBrowseCollectionsRouteSuccessResponse<T>;
export function convertGetBrowseCollectionsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetBrowseCollectionsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetBrowseCollectionsRouteSuccessResponse<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value.map((collection) => convertBitBadgesCollection(collection, convertFunction))];
  }));
}

export type BroadcastTxRouteRequestBody = BroadcastPostBody;
// export interface BroadcastTxRouteSuccessResponse<T extends NumberType> {
//   //TODO:`
// }

export type BroadcastTxRouteSuccessResponse<T extends NumberType> = any;
export type BroadcastTxRouteResponse<T extends NumberType> = ErrorResponse | BroadcastTxRouteSuccessResponse<T>;
export function convertBroadcastTxRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: BroadcastTxRouteSuccessResponse<T>, convertFunction: (item: T) => U): BroadcastTxRouteSuccessResponse<U> {
  return { ...item };
}

export type SimulateTxRouteRequestBody = BroadcastPostBody;
// export interface SimulateTxRouteSuccessResponse<T extends NumberType> {
//   //TODO:
// }
export type SimulateTxRouteSuccessResponse<T extends NumberType> = any;

export type SimulateTxRouteResponse<T extends NumberType> = ErrorResponse | SimulateTxRouteSuccessResponse<T>;
export function convertSimulateTxRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: SimulateTxRouteSuccessResponse<T>, convertFunction: (item: T) => U): SimulateTxRouteSuccessResponse<U> {
  return { ...item };
}

export interface FetchMetadataDirectlyRouteRequestBody {
  uri: string,
}
export interface FetchMetadataDirectlyRouteSuccessResponse<T extends NumberType> {
  metadata: Metadata<T>,
}
export type FetchMetadataDirectlyRouteResponse<T extends NumberType> = ErrorResponse | FetchMetadataDirectlyRouteSuccessResponse<T>;
export function convertFetchMetadataDirectlyRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: FetchMetadataDirectlyRouteSuccessResponse<T>, convertFunction: (item: T) => U): FetchMetadataDirectlyRouteSuccessResponse<U> {
  return {
    metadata: convertMetadata(item.metadata, convertFunction),
  }
}

export type GetTokensFromFaucetRouteRequestBody = {};
export type GetTokensFromFaucetRouteResponse<T extends NumberType> = DeliverTxResponse | ErrorResponse;
export type GetTokensFromFaucetRouteSuccessResponse<T extends NumberType> = DeliverTxResponse;
export function convertGetTokensFromFaucetRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetTokensFromFaucetRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetTokensFromFaucetRouteSuccessResponse<U> {
  return { ...item };
}

export interface GetAddressMappingsRouteRequestBody {
  mappingIds: string[],
  managerAddress?: string,
}

export interface GetAddressMappingsRouteSuccessResponse<T extends NumberType> {
  addressMappings: AddressMapping[],
}

export type GetAddressMappingsRouteResponse<T extends NumberType> = ErrorResponse | GetAddressMappingsRouteSuccessResponse<T>;
export function convertGetAddressMappingsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetAddressMappingsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetAddressMappingsRouteSuccessResponse<U> {
  return {
    addressMappings: item.addressMappings,
  }
}


export interface GetApprovalsRouteRequestBody {
  approvalTrackerIds: ApprovalTrackerIdDetails<NumberType>[],
}

export interface GetApprovalsRouteSuccessResponse<T extends NumberType> {
  approvalTrackers: ApprovalsTrackerInfo<T>[],
}

export type GetApprovalsRouteResponse<T extends NumberType> = ErrorResponse | GetApprovalsRouteSuccessResponse<T>;
export function convertGetApprovalsRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetApprovalsRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetApprovalsRouteSuccessResponse<U> {
  return {
    approvalTrackers: item.approvalTrackers.map((approvalTracker) => convertApprovalsTrackerInfo(approvalTracker, convertFunction)),
  }
}

export interface GetMerkleChallengeTrackersRouteRequestBody {
  merkleChallengeTrackerIds: MerkleChallengeIdDetails<NumberType>[],
}

export interface GetMerkleChallengeTrackersRouteSuccessResponse<T extends NumberType> {
  merkleChallengeTrackers: MerkleChallengeInfo<T>[],
}

export type GetMerkleChallengeTrackersRouteResponse<T extends NumberType> = ErrorResponse | GetMerkleChallengeTrackersRouteSuccessResponse<T>;
export function convertGetMerkleChallengeTrackersRouteSuccessResponse<T extends NumberType, U extends NumberType>(item: GetMerkleChallengeTrackersRouteSuccessResponse<T>, convertFunction: (item: T) => U): GetMerkleChallengeTrackersRouteSuccessResponse<U> {
  return {
    merkleChallengeTrackers: item.merkleChallengeTrackers.map((merkleChallenge) => convertMerkleChallengeInfo(merkleChallenge, convertFunction)),
  }
}

/**
 * Type for CouchDB pagination information.
 * @typedef {Object} PaginationInfo
 * @property {string} bookmark - The bookmark to be used to fetch the next X documents. Initially, bookmark should be '' (empty string) to fetch the first X documents. Each time the next X documents are fetched, the bookmark should be updated to the bookmark returned by the previous fetch.
 * @property {boolean} hasMore - Indicates whether there are more documents to be fetched. Once hasMore is false, all documents have been fetched.
 * @property {number} [total] - The total number of documents in this view. This is only returned for the first fetch (when bookmark is empty string). It is not returned for subsequent fetches.
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
 */
export interface CosmosAccountResponse {
  account_number: number;
  sequence: number;
  pub_key: {
    key: string;
  }
  address: string;
}
