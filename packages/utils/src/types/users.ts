import { NumberType, StringNumber } from "bitbadgesjs-proto"
import { AnnouncementActivityItem, ReviewActivityItem, TransferActivityItem, convertAnnouncementActivityItem, convertReviewActivityItem, convertTransferActivityItem } from "./activity"
import { PaginationInfo } from "./api"
import { AccountDoc, BalanceDoc, ProfileDoc, convertAccountDoc, convertBalanceDoc, convertProfileDoc } from "./db"
import { deepCopy } from "./utils"

/**
 * BitBadgesUserInfo is the type for accounts returned by the BitBadges API. It includes all information about an account.
 *
 * @typedef {Object} BitBadgesUserInfo
 * @extends {ProfileDoc}
 * @extends {AccountDoc}
 *
 * @property {string} [resolvedName] - The resolved name of the account (e.g. ENS name).
 * @property {string} [avatar] - The avatar of the account.
 * @property {Coin} [balance] - The balance of the account ($BADGE).
 * @property {boolean} [airdropped] - Indicates whether the account has claimed their airdrop.
 * @property {BalanceDoc[]} collected - A list of badges that the account has collected. Paginated and fetches and needed.
 * @property {TransferActivityItem[]} activity - A list of transfer activity items for the account. Paginated and fetches and needed.
 * @property {AnnouncementActivityItem[]} announcements - A list of announcement activity items for the account. Paginated and fetches and needed.
 * @property {ReviewActivityItem[]} reviews - A list of review activity items for the account. Paginated and fetches and needed.
 * @property {PaginationInfo} pagination - Pagination information for each of the profile information.
 *
 * @remarks
 * collected, activity, announcements, and reviews are profile information that is dynamically loaded as needed from the API.
 * The pagination object holds the bookmark and hasMore information for each of collected, activity, announcements, and reviews.
 *
 * For typical fetches, collected, activity, announcements, and reviews will be empty arrays and are to be loaded as needed (pagination will be set to hasMore == true).
 */
export interface BitBadgesUserInfo<T extends NumberType> extends ProfileDoc<T>, AccountDoc<T> {
  resolvedName?: string
  avatar?: string

  airdropped?: boolean

  //Dynamically loaded as needed
  collected: BalanceDoc<T>[],
  activity: TransferActivityItem<T>[],
  announcements: AnnouncementActivityItem<T>[],
  reviews: ReviewActivityItem<T>[],
  pagination: {
    activity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  },
}

export type b_BitBadgesUserInfo = BitBadgesUserInfo<bigint>
export type s_BitBadgesUserInfo = BitBadgesUserInfo<string>
export type n_BitBadgesUserInfo = BitBadgesUserInfo<number>
export type d_BitBadgesUserInfo = BitBadgesUserInfo<StringNumber>

export function convertBitBadgesUserInfo<T extends NumberType, U extends NumberType>(item: BitBadgesUserInfo<T>, convertFunction: (item: T) => U): BitBadgesUserInfo<U> {
  return deepCopy({
    ...convertProfileDoc(item, convertFunction),
    ...convertAccountDoc(item, convertFunction),
    resolvedName: item.resolvedName,
    avatar: item.avatar,
    airdropped: item.airdropped,
    collected: item.collected.map((balance) => convertBalanceDoc(balance, convertFunction)),
    activity: item.activity.map((activityItem) => convertTransferActivityItem(activityItem, convertFunction)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementActivityItem(activityItem, convertFunction)),
    reviews: item.reviews.map((activityItem) => convertReviewActivityItem(activityItem, convertFunction)),
    pagination: {
      activity: item.pagination.activity,
      announcements: item.pagination.announcements,
      collected: item.pagination.collected,
      reviews: item.pagination.reviews,
    }
  })
}
