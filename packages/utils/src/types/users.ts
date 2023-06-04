import { NumberType, StringNumber } from "bitbadgesjs-proto"
import { AnnouncementActivityItemWithType, ReviewActivityItemWithType, TransferActivityItemWithType, convertAnnouncementActivityItem, convertReviewActivityItem, convertTransferActivityItem } from "./activity"
import { PaginationInfo } from "./api"
import { AccountDocWithType, BalanceDocWithType, ProfileDocWithType, convertAccountDoc, convertBalanceDoc, convertProfileDoc } from "./db"

/**
 * BitBadgesUserInfo is the type for accounts returned by the BitBadges API. It includes all information about an account.
 *
 * @typedef {Object} BitBadgesUserInfoWithType
 * @extends {ProfileDocWithType}
 * @extends {AccountDocWithType}
 *
 * @property {string} [resolvedName] - The resolved name of the account (e.g. ENS name).
 * @property {string} [avatar] - The avatar of the account.
 * @property {CoinWithType} [balance] - The balance of the account ($BADGE).
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
export interface BitBadgesUserInfoWithType<T extends NumberType> extends ProfileDocWithType<T>, AccountDocWithType<T> {
  resolvedName?: string
  avatar?: string

  airdropped?: boolean

  //Dynamically loaded as needed
  collected: BalanceDocWithType<T>[],
  activity: TransferActivityItemWithType<T>[],
  announcements: AnnouncementActivityItemWithType<T>[],
  reviews: ReviewActivityItemWithType<T>[],
  pagination: {
    activity: PaginationInfo,
    announcements: PaginationInfo,
    collected: PaginationInfo,
    reviews: PaginationInfo,
  },
}

export type BitBadgesUserInfo = BitBadgesUserInfoWithType<bigint>
export type s_BitBadgesUserInfo = BitBadgesUserInfoWithType<string>
export type n_BitBadgesUserInfo = BitBadgesUserInfoWithType<number>
export type d_BitBadgesUserInfo = BitBadgesUserInfoWithType<StringNumber>

export function convertBitBadgesUserInfo<T extends NumberType, U extends NumberType>(item: BitBadgesUserInfoWithType<T>, convertFunction: (item: T) => U): BitBadgesUserInfoWithType<U> {
  return {
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
  }
}
