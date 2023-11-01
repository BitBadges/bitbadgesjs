import { AddressMapping, NumberType, UserIncomingApproval, UserOutgoingApproval, convertIncomingApprovalCriteria, convertOutgoingApprovalCriteria, convertUserIncomingApproval, convertUserOutgoingApproval } from "bitbadgesjs-proto"
import { AnnouncementInfo, ReviewInfo, TransferActivityInfo, convertAnnouncementInfo, convertReviewInfo, convertTransferActivityInfo } from "./activity"
import { PaginationInfo } from "./api"
import { AccountInfoBase, ApprovalsTrackerInfo, BalanceInfoWithDetails, ClaimAlertInfo, Identified, MerkleChallengeInfo, ProfileInfoBase, convertAccountInfo, convertApprovalsTrackerInfo, convertBalanceInfoWithDetails, convertClaimAlertInfo, convertMerkleChallengeInfo, convertProfileInfo } from "./db"
import { AddressMappingWithMetadata, convertAddressMappingWithMetadata } from "./metadata"
import { deepCopy, removeCouchDBDetails } from "./utils"


/**
 * @category Approvals / Transferability
 */
export interface UserOutgoingApprovalWithDetails<T extends NumberType> extends UserOutgoingApproval<T> {
  toMapping: AddressMapping;
  // fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;
}

/**
 * @category Approvals / Transferability
 */
export function convertUserOutgoingApprovalWithDetails<T extends NumberType, U extends NumberType>(item: UserOutgoingApprovalWithDetails<T>, convertFunction: (item: T) => U): UserOutgoingApprovalWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertUserOutgoingApproval(item, convertFunction),
    //TODO: Don't know why this is needed. When commented out, it says incompatible types
    approvalCriteria: item.approvalCriteria ? convertOutgoingApprovalCriteria(item.approvalCriteria, convertFunction) : undefined,
  })
}



/**
 * @category Approvals / Transferability
 */
export interface UserIncomingApprovalWithDetails<T extends NumberType> extends UserIncomingApproval<T> {
  // toMapping: AddressMapping;
  fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;
}

/**
 * @category Approvals / Transferability
 */
export function convertUserIncomingApprovalWithDetails<T extends NumberType, U extends NumberType>(item: UserIncomingApprovalWithDetails<T>, convertFunction: (item: T) => U): UserIncomingApprovalWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertUserIncomingApproval(item, convertFunction),
    approvalCriteria: item.approvalCriteria ? convertIncomingApprovalCriteria(item.approvalCriteria, convertFunction) : undefined,
  })
}



/**
 * BitBadgesUserInfo is the type for accounts returned by the BitBadges API. It includes all information about an account.
 *
 * @typedef {Object} BitBadgesUserInfo
 * @extends {ProfileInfoBase}
 * @extends {AccountInfoBase}
 *
 * @property {string} [resolvedName] - The resolved name of the account (e.g. ENS name).
 * @property {string} [avatar] - The avatar of the account.
 * @property {Coin} [balance] - The balance of the account ($BADGE).
 * @property {boolean} [airdropped] - Indicates whether the account has claimed their airdrop.
 * @property {BalanceDoc[]} collected - A list of badges that the account has collected. Paginated and fetches as needed.
 * @property {TransferActivityDoc[]} activity - A list of transfer activity items for the account. Paginated and fetches and needed.
 * @property {AnnouncementDoc[]} announcements - A list of announcement activity items for the account. Paginated and fetches and needed.
 * @property {ReviewDoc[]} reviews - A list of review activity items for the account. Paginated and fetches and needed.
 * @property {PaginationInfo} pagination - Pagination information for each of the profile information.
 *
 * @remarks
 * collected, activity, announcements, and reviews are profile information that is dynamically loaded as needed from the API.
 * The pagination object holds the bookmark and hasMore information for each of collected, activity, announcements, and reviews.
 *
 * For typical fetches, collected, activity, announcements, and reviews will be empty arrays and are to be loaded as needed (pagination will be set to hasMore == true).
 *
 * @category API / Indexer
 */
export interface BitBadgesUserInfo<T extends NumberType> extends ProfileInfoBase<T>, AccountInfoBase<T>, Identified {
  resolvedName?: string
  avatar?: string

  airdropped?: boolean

  address: string

  //Dynamically loaded as needed
  collected: BalanceInfoWithDetails<T>[],
  activity: TransferActivityInfo<T>[],
  announcements: AnnouncementInfo<T>[],
  reviews: ReviewInfo<T>[],
  merkleChallenges: MerkleChallengeInfo<T>[],
  approvalsTrackers: ApprovalsTrackerInfo<T>[],
  addressMappings: AddressMappingWithMetadata<T>[],
  claimAlerts: ClaimAlertInfo<T>[],

  views: {
    [viewKey: string]: {
      ids: string[],
      type: string,
      pagination: PaginationInfo,
    } | undefined
  }
}


export function convertBitBadgesUserInfo<T extends NumberType, U extends NumberType>(item: BitBadgesUserInfo<T>, convertFunction: (item: T) => U): BitBadgesUserInfo<U> {
  const converted = deepCopy({
    ...convertProfileInfo({ ...item, _id: '' }, convertFunction),
    //This is because if we spread ...item, we overwrite the profile info converted stuff
    ...convertAccountInfo({
      _id: '',
      cosmosAddress: item.cosmosAddress,
      ethAddress: item.ethAddress,
      accountNumber: item.accountNumber,
      username: item.username,
      sequence: item.sequence,
      balance: item.balance,
      publicKey: item.publicKey,
      chain: item.chain,
    }, convertFunction),
    address: item.address,
    resolvedName: item.resolvedName,
    avatar: item.avatar,
    airdropped: item.airdropped,
    collected: item.collected.map((balance) => convertBalanceInfoWithDetails(balance, convertFunction)).map(x => removeCouchDBDetails(x)),
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    reviews: item.reviews.map((activityItem) => convertReviewInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    merkleChallenges: item.merkleChallenges.map((challenge) => convertMerkleChallengeInfo(challenge, convertFunction)).map(x => removeCouchDBDetails(x)),
    approvalsTrackers: item.approvalsTrackers.map((tracker) => convertApprovalsTrackerInfo(tracker, convertFunction)).map(x => removeCouchDBDetails(x)),
    addressMappings: item.addressMappings.map((mapping) => convertAddressMappingWithMetadata(mapping, convertFunction)),
    claimAlerts: item.claimAlerts.map((alert) => convertClaimAlertInfo(alert, convertFunction)),
    views: item.views,
    _rev: undefined,
    _deleted: undefined,
  })

  return removeCouchDBDetails(converted);
}
