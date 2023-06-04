import { NumberType, StringNumber } from "bitbadgesjs-proto";
import { AnnouncementActivityItemWithType, ReviewActivityItemWithType, TransferActivityItemWithType, convertAnnouncementActivityItem, convertReviewActivityItem, convertTransferActivityItem } from "./activity";
import { BalanceDocWithType, ClaimInfoWithType, CollectionDocWithType, convertBalanceDoc, convertClaimInfo, convertCollectionDoc } from "./db";
import { MetadataWithType, convertMetadata } from "./metadata";
import { MetadataMapWithType, convertMetadataMap } from "./types";
import { BitBadgesUserInfoWithType, convertBitBadgesUserInfo } from "./users";

/**
 * BitBadgesCollection is the type for collections returned by the BitBadges API. It extends the base CollectionDoc type
 * and adds additional accompanying information.
 *
 * @typedef {Object} BitBadgesCollection
 * @extends {CollectionDocWithType} The base collection document
 *
 * @property {BitBadgesUserInfoWithType} managerInfo - The account information of the manager of this collection
 * @property {MetadataWithType} collectionMetadata - The metadata of this collection
 * @property {MetadataMapWithType} badgeMetadata - The metadata of each badge in this collection stored in a map by metadataId (see how we calculate metadataId in the docs)
 * @property {TransferActivityItemWithType[]} activity - The transfer activity of this collection
 * @property {AnnouncementActivityItemWithType[]} announcements - The announcement activity of this collection
 * @property {ReviewActivityItemWithType[]} reviews - The review activity of this collection
 * @property {BalanceDocWithType[]} balances - The badge balance documents for this collection
 * @property {ClaimInfoWithType[]} claims - The claims of this collection
 *
 * @remarks
 * Note that the collectionMetadata, badgeMetadata, activity, announcements, reviews, claims, and balances fields are
 * dynamically fetched from the DB as needed. They may be empty or missing information when the collection is first fetched.
 * You are responsible for fetching the missing information as needed from the corresponding API routes.
 *
 * @see
 * Use updateMetadataMap to update the metadata fields.
 */
export interface BitBadgesCollectionWithType<T extends NumberType> extends CollectionDocWithType<T> {
  managerInfo: BitBadgesUserInfoWithType<T>;

  //The following are to be fetched dynamically and as needed from the DB
  collectionMetadata: MetadataWithType<T>;
  badgeMetadata: MetadataMapWithType<T>
  activity: TransferActivityItemWithType<T>[],
  announcements: AnnouncementActivityItemWithType<T>[],
  reviews: ReviewActivityItemWithType<T>[],
  balances: BalanceDocWithType<T>[],
  claims: ClaimInfoWithType<T>[],
}

export type BitBadgesCollection = BitBadgesCollectionWithType<bigint>;
export type s_BitBadgesCollection = BitBadgesCollectionWithType<string>;
export type n_BitBadgesCollection = BitBadgesCollectionWithType<number>;
export type d_BitBadgesCollection = BitBadgesCollectionWithType<StringNumber>;

export function convertBitBadgesCollection<T extends NumberType, U extends NumberType>(item: BitBadgesCollectionWithType<T>, convertFunction: (item: T) => U): BitBadgesCollectionWithType<U> {
  return {
    ...item,
    ...convertCollectionDoc(item, convertFunction),
    managerInfo: convertBitBadgesUserInfo(item.managerInfo, convertFunction),
    collectionMetadata: convertMetadata(item.collectionMetadata, convertFunction),
    badgeMetadata: convertMetadataMap(item.badgeMetadata, convertFunction),
    activity: item.activity.map((activityItem) => convertTransferActivityItem(activityItem, convertFunction)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementActivityItem(activityItem, convertFunction)),
    reviews: item.reviews.map((activityItem) => convertReviewActivityItem(activityItem, convertFunction)),
    balances: item.balances.map((balance) => convertBalanceDoc(balance, convertFunction)),
    claims: item.claims.map((claim) => convertClaimInfo(claim, convertFunction)),
  }
}
