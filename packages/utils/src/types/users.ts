import { NumberType } from "bitbadgesjs-proto"
import { AnnouncementInfo, ReviewInfo, TransferActivityInfo, convertAnnouncementInfo, convertReviewInfo, convertTransferActivityInfo } from "./activity"
import { PaginationInfo } from "./api"
import { AccountInfoBase, BalanceInfo, Identified, ProfileInfoBase, convertAccountInfo, convertBalanceInfo, convertProfileInfo } from "./db"
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
 */
export interface BitBadgesUserInfo<T extends NumberType> extends ProfileInfoBase<T>, AccountInfoBase<T>, Identified {
  resolvedName?: string
  avatar?: string

  airdropped?: boolean

  //Dynamically loaded as needed
  collected: BalanceInfo<T>[],
  activity: TransferActivityInfo<T>[],
  announcements: AnnouncementInfo<T>[],
  reviews: ReviewInfo<T>[],

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
    ...convertAccountInfo({ ...item, _id: '' }, convertFunction),
    resolvedName: item.resolvedName,
    avatar: item.avatar,
    airdropped: item.airdropped,
    collected: item.collected.map((balance) => convertBalanceInfo(balance, convertFunction)).map(x => removeCouchDBDetails(x)),
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    reviews: item.reviews.map((activityItem) => convertReviewInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    views: item.views,
    _rev: undefined,
    _deleted: undefined,
  })

  return removeCouchDBDetails(converted);
}
