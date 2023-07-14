import { UintRange, NumberType, convertUintRange } from "bitbadgesjs-proto";
import { AnnouncementInfo, ReviewInfo, TransferActivityInfo, convertAnnouncementInfo, convertReviewInfo, convertTransferActivityInfo } from "./activity";
import { BalanceInfo, MerkleChallengeInfoWithDetails, CollectionInfoBase, Identified, convertBalanceInfo, convertMerkleChallengeInfoWithDetails, convertCollectionInfo, ApprovalsTrackerInfo, convertApprovalsTrackerInfo } from "./db";
import { Metadata, convertMetadata } from "./metadata";
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./users";
import { deepCopy, removeCouchDBDetails } from "./utils";
import { PaginationInfo } from "./api";

export interface BadgeMetadataDetails<T extends NumberType> {
  metadataId?: T,
  badgeIds: UintRange<T>[],
  metadata: Metadata<T>,
  uri?: string
  customData?: string
}

export function convertBadgeMetadataDetails<T extends NumberType, U extends NumberType>(item: BadgeMetadataDetails<T>, convertFunction: (item: T) => U): BadgeMetadataDetails<U> {
  return deepCopy({
    ...item,
    metadataId: item.metadataId ? convertFunction(item.metadataId) : undefined,
    badgeIds: item.badgeIds.map((UintRange) => convertUintRange(UintRange, convertFunction)),
    metadata: convertMetadata(item.metadata, convertFunction),
  })
}

/**
 * BitBadgesCollection is the type for collections returned by the BitBadges API. It extends the base CollectionDoc type
 * and adds additional accompanying information.
 *
 * @typedef {Object} BitBadgesCollection
 * @extends {CollectionInfoBase} The base collection document
 *
 * @property {BitBadgesUserInfo} managerInfo - The account information of the current manager of this collection
 * @property {Metadata} collectionMetadata - The metadata of this collection
 * @property {Metadata[]} badgeMetadata - The metadata of each badge in this collection stored in a map by metadataId (see how we calculate metadataId in the docs)
 * @property {TransferActivityDoc[]} activity - The transfer activity of this collection
 * @property {AnnouncementDoc[]} announcements - The announcement activity of this collection
 * @property {ReviewDoc[]} reviews - The review activity of this collection
 * @property {BalanceDoc[]} owners - The badge balance documents for owners of this collection
 * @property {MerkleChallengeInfo[]} claims - The claims of this collection
 *
 * @remarks
 * Note that the collectionMetadata, badgeMetadata, activity, announcements, reviews, claims, and balances fields are
 * dynamically fetched from the DB as needed. They may be empty or missing information when the collection is first fetched.
 * You are responsible for fetching the missing information as needed from the corresponding API routes.
 *
 * See documentation for helper functions, examples, and tutorials on handling this data and paginations.
 */
export interface BitBadgesCollection<T extends NumberType> extends CollectionInfoBase<T>, Identified {
  managerInfo: BitBadgesUserInfo<T>;

  //The following are to be fetched dynamically and as needed from the DB
  collectionMetadata?: Metadata<T>;
  badgeMetadata: BadgeMetadataDetails<T>[];
  activity: TransferActivityInfo<T>[],
  announcements: AnnouncementInfo<T>[],
  reviews: ReviewInfo<T>[],
  owners: BalanceInfo<T>[],
  merkleChallenges: MerkleChallengeInfoWithDetails<T>[],
  approvalsTrackers: ApprovalsTrackerInfo<T>[],

  views: {
    [viewKey: string]: {
      ids: string[],
      type: string,
      pagination: PaginationInfo,
    } | undefined
  }
}

export function convertBitBadgesCollection<T extends NumberType, U extends NumberType>(item: BitBadgesCollection<T>, convertFunction: (item: T) => U): BitBadgesCollection<U> {
  return deepCopy({
    ...item,
    ...convertCollectionInfo(item, convertFunction),
    managerInfo: convertBitBadgesUserInfo(item.managerInfo, convertFunction),
    collectionMetadata: item.collectionMetadata ? convertMetadata(item.collectionMetadata, convertFunction) : undefined,
    badgeMetadata: item.badgeMetadata.map((metadata) => convertBadgeMetadataDetails(metadata, convertFunction)),
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    reviews: item.reviews.map((activityItem) => convertReviewInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    owners: item.owners.map((balance) => convertBalanceInfo(balance, convertFunction)).map(x => removeCouchDBDetails(x)),
    merkleChallenges: item.merkleChallenges.map((merkleChallenge) => convertMerkleChallengeInfoWithDetails(merkleChallenge, convertFunction)).map(x => removeCouchDBDetails(x)),
    approvalsTrackers: item.approvalsTrackers.map((approvalsTracker) => convertApprovalsTrackerInfo(approvalsTracker, convertFunction)).map(x => removeCouchDBDetails(x)),
    _rev: undefined,
    _deleted: undefined,
  })
}
