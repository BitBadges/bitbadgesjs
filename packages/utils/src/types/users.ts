import { NumberType } from "bitbadgesjs-proto"
import { AnnouncementInfo, ReviewInfo, TransferActivityInfo, convertAnnouncementDoc, convertReviewDoc, convertTransferActivityDoc } from "./activity"
import { PaginationInfo } from "./api"
import { AccountInfoBase, BalanceInfo, CouchDBDetailsExcluded, ProfileInfoBase, convertAccountDoc, convertBalanceDoc, convertProfileDoc } from "./db"
import { deepCopy, removeCouchDBDetails } from "./utils"

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
 * @property {BalanceDoc[]} collected - A list of badges that the account has collected. Paginated and fetches and needed.
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
 */
export interface BitBadgesUserInfo<T extends NumberType> extends ProfileInfoBase<T>, AccountInfoBase<T>, CouchDBDetailsExcluded {
  resolvedName?: string
  avatar?: string

  airdropped?: boolean

  //Dynamically loaded as needed
  collected: BalanceInfo<T>[],
  activity: TransferActivityInfo<T>[],
  announcements: AnnouncementInfo<T>[],
  reviews: ReviewInfo<T>[],
  pagination: {
    activity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  },
}

export function convertBitBadgesUserInfo<T extends NumberType, U extends NumberType>(item: BitBadgesUserInfo<T>, convertFunction: (item: T) => U): BitBadgesUserInfo<U> {
  const converted = deepCopy({
    ...convertProfileDoc({ ...item, _id: '', _rev: '' }, convertFunction),
    ...convertAccountDoc({ ...item, _id: '', _rev: '' }, convertFunction),
    resolvedName: item.resolvedName,
    avatar: item.avatar,
    airdropped: item.airdropped,
    collected: item.collected.map((balance) => convertBalanceDoc({ ...balance, _id: '', _rev: '' }, convertFunction)).map(x => removeCouchDBDetails(x)),
    activity: item.activity.map((activityItem) => convertTransferActivityDoc({ ...activityItem, _id: '', _rev: '' }, convertFunction)).map(x => removeCouchDBDetails(x)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementDoc({ ...activityItem, _id: '', _rev: '' }, convertFunction)).map(x => removeCouchDBDetails(x)),
    reviews: item.reviews.map((activityItem) => convertReviewDoc({ ...activityItem, _id: '', _rev: '' }, convertFunction)).map(x => removeCouchDBDetails(x)),
    pagination: {
      activity: item.pagination.activity,
      announcements: item.pagination.announcements,
      collected: item.pagination.collected,
      reviews: item.pagination.reviews,
    },
  })

  return removeCouchDBDetails(converted);
}
