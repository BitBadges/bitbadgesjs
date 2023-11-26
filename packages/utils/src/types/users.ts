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
 * @property {SupportedChain} chain - The chain of the account.
 * @property {Coin} [balance] - The balance of the account ($BADGE).
 * @property {boolean} [airdropped] - Indicates whether the account has claimed their airdrop.
 * @property {BalanceDoc[]} collected - A list of badges that the account has collected. Paginated and fetched as needed. To be used in conjunction with views.
 * @property {TransferActivityDoc[]} activity - A list of transfer activity items for the account. Paginated and fetched as needed. To be used in conjunction with views.
 * @property {AnnouncementDoc[]} announcements - A list of announcement activity items for the account. Paginated and fetched as needed. To be used in conjunction with views.
 * @property {ReviewDoc[]} reviews - A list of review activity items for the account. Paginated and fetched as needed. To be used in conjunction with views.
 * @property {MerkleChallengeDoc[]} merkleChallenges - A list of merkle challenge activity items for the account. Paginated and fetched as needed. To be used in conjunction with views.
 * @property {ApprovalsTrackerDoc[]} approvalsTrackers - A list of approvals tracker activity items for the account. Paginated and fetched as needed. To be used in conjunction with views.
 * @property {AddressMappingWithMetadata[]} addressMappings - A list of address mappings for the account. Paginated and fetched as needed. To be used in conjunction with views.
 * @property {ClaimAlertDoc[]} claimAlerts - A list of claim alerts for the account. Paginated and fetched as needed. To be used in conjunction with views.
 * @property {PaginationInfo} pagination - Pagination information for each of the profile information.
 *
 * @property {Object} [nsfw] - Indicates whether the account is NSFW.
 * @property {Object} [reported] - Indicates whether the account has been reported.
 *
 * @property {string} address - The address of the account.
 *
 * @property {Object} nsfw - The badge IDs in this collection that are marked as NSFW.
 * @property {Object} reported - The badge IDs in this collection that have been reported.
 *
 * @property {Object.<string, { ids: string[], type: string, pagination: PaginationInfo }>} views - The views for this collection and their pagination info. Views will only include the doc _ids. Use the pagination to fetch more. To be used in conjunction with activity, announcements, reviews, owners, merkleChallenges, and approvalsTrackers. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs.
 *
 * @remarks
 * Note that returned user infos will only fetch what is requested. It is your responsibility to join the data together (paginations, etc).
 * See documentation for helper functions, examples, and tutorials on handling this data and paginations.
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

  nsfw?: { reason: string };
  reported?: { reason: string };

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
      solAddress: item.solAddress,
      accountNumber: item.accountNumber,
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
