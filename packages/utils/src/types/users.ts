import { AddressMapping, NumberType, UserIncomingApproval, UserOutgoingApproval, convertIncomingApprovalCriteria, convertOutgoingApprovalCriteria, convertUserIncomingApproval, convertUserOutgoingApproval } from "bitbadgesjs-proto"
import { AnnouncementDoc, ListActivityDoc, ReviewDoc, TransferActivityDoc, convertAnnouncementDoc, convertListActivityDoc, convertReviewDoc, convertTransferActivityDoc } from "./activity"
import { PaginationInfo } from "./api"
import { AccountInfoBase, ApprovalsTrackerDoc, BalanceDocWithDetails, BlockinAuthSignatureDoc, ClaimAlertDoc, MerkleChallengeDoc, ProfileInfoBase, convertAccountDoc, convertApprovalsTrackerDoc, convertBalanceDocWithDetails, convertBlockinAuthSignatureDoc, convertClaimAlertDoc, convertMerkleChallengeDoc, convertProfileDoc } from "./db"
import { AddressMappingWithMetadata, convertAddressMappingWithMetadata } from "./metadata"
import { deepCopy } from "./utils"


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
 * BitBadgesUserInfo is the type for accounts returned by the BitBadges API. It includes all Docrmation about an account.
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
 * @property {PaginationInfo} pagination - Pagination Docrmation for each of the profile Docrmation.
 *
 * @property {Object} [nsfw] - Indicates whether the account is NSFW.
 * @property {Object} [reported] - Indicates whether the account has been reported.
 *
 * @property {string} address - The address of the account.
 *
 * @property {Object} nsfw - The badge IDs in this collection that are marked as NSFW.
 * @property {Object} reported - The badge IDs in this collection that have been reported.
 *
 * @property {Object.<string, { ids: string[], type: string, pagination: PaginationInfo }>} views - The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more. To be used in conjunction with activity, announcements, reviews, owners, merkleChallenges, and approvalsTrackers. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs.
 *
 * @property {Object} alias - Returns whether this account is an alias for a collection or mapping.
 *
 * @remarks
 * Note that returned user Docs will only fetch what is requested. It is your responsibility to join the data together (paginations, etc).
 * See documentation for helper functions, examples, and tutorials on handling this data and paginations.
 *
 * @category API / Indexer
 */
export interface BitBadgesUserInfo<T extends NumberType> extends ProfileInfoBase<T>, AccountInfoBase<T> {
  resolvedName?: string
  avatar?: string
  solAddress: string
  airdropped?: boolean
  address: string

  //Dynamically loaded as needed
  collected: BalanceDocWithDetails<T>[],
  activity: TransferActivityDoc<T>[],
  listsActivity: ListActivityDoc<T>[],
  announcements: AnnouncementDoc<T>[],
  reviews: ReviewDoc<T>[],
  merkleChallenges: MerkleChallengeDoc<T>[],
  approvalsTrackers: ApprovalsTrackerDoc<T>[],
  addressMappings: AddressMappingWithMetadata<T>[],
  claimAlerts: ClaimAlertDoc<T>[],
  authCodes: BlockinAuthSignatureDoc<T>[],

  nsfw?: { reason: string };
  reported?: { reason: string };

  views: {
    [viewId: string]: {
      ids: string[],
      type: string,
      pagination: PaginationInfo,
    } | undefined
  }

  alias?: {
    collectionId?: T,
    mappingId?: string
  }
}


export function convertBitBadgesUserInfo<T extends NumberType, U extends NumberType>(item: BitBadgesUserInfo<T>, convertFunction: (item: T) => U): BitBadgesUserInfo<U> {
  const converted = deepCopy({
    ...convertProfileDoc({ ...item, _legacyId: '', _id: '' }, convertFunction),
    //This is because if we spread ...item, we overwrite the profile Doc converted stuff
    ...convertAccountDoc({
      _legacyId: '',
      cosmosAddress: item.cosmosAddress,
      ethAddress: item.ethAddress,
      btcAddress: item.btcAddress,
      solAddress: item.solAddress,
      accountNumber: item.accountNumber,
      sequence: item.sequence,
      balance: item.balance,
      publicKey: item.publicKey,
      chain: item.chain,
    }, convertFunction),

    solAddress: item.solAddress,
    address: item.address,
    resolvedName: item.resolvedName,
    avatar: item.avatar,
    airdropped: item.airdropped,
    collected: item.collected.map((balance) => convertBalanceDocWithDetails(balance, convertFunction)),
    activity: item.activity.map((activityItem) => convertTransferActivityDoc(activityItem, convertFunction)),
    listsActivity: item.listsActivity.map((activityItem) => convertListActivityDoc(activityItem, convertFunction)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementDoc(activityItem, convertFunction)),
    reviews: item.reviews.map((activityItem) => convertReviewDoc(activityItem, convertFunction)),
    merkleChallenges: item.merkleChallenges.map((challenge) => convertMerkleChallengeDoc(challenge, convertFunction)),
    approvalsTrackers: item.approvalsTrackers.map((tracker) => convertApprovalsTrackerDoc(tracker, convertFunction)),
    addressMappings: item.addressMappings.map((mapping) => convertAddressMappingWithMetadata(mapping, convertFunction)),
    claimAlerts: item.claimAlerts.map((alert) => convertClaimAlertDoc(alert, convertFunction)),
    authCodes: item.authCodes.map((code) => convertBlockinAuthSignatureDoc(code, convertFunction)),
    alias: item.alias ? {
      collectionId: item.alias.collectionId ? convertFunction(item.alias.collectionId) : undefined,
      mappingId: item.alias.mappingId,
    } : undefined,
    views: item.views,
    _rev: undefined,
    _deleted: undefined,
  })

  return converted
}
