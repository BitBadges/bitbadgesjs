import { NumberType, StringNumber } from "bitbadgesjs-proto";
import { AnnouncementActivityItem, ReviewActivityItem, TransferActivityItem, convertAnnouncementActivityItem, convertReviewActivityItem, convertTransferActivityItem } from "./activity";
import { BalanceDoc, ClaimInfo, CollectionDoc, convertBalanceDoc, convertClaimInfo, convertCollectionDoc } from "./db";
import { Metadata, convertMetadata } from "./metadata";
import { MetadataMap, convertMetadataMap } from "./types";
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./users";
import { deepCopy } from "./utils";

/**
 * BitBadgesCollection is the type for collections returned by the BitBadges API. It extends the base CollectionDoc type
 * and adds additional accompanying information.
 *
 * @typedef {Object} BitBadgesCollection
 * @extends {CollectionDoc} The base collection document
 *
 * @property {BitBadgesUserInfo} managerInfo - The account information of the manager of this collection
 * @property {Metadata} collectionMetadata - The metadata of this collection
 * @property {MetadataMap} badgeMetadata - The metadata of each badge in this collection stored in a map by metadataId (see how we calculate metadataId in the docs)
 * @property {TransferActivityItem[]} activity - The transfer activity of this collection
 * @property {AnnouncementActivityItem[]} announcements - The announcement activity of this collection
 * @property {ReviewActivityItem[]} reviews - The review activity of this collection
 * @property {BalanceDoc[]} balances - The badge balance documents for this collection
 * @property {ClaimInfo[]} claims - The claims of this collection
 *
 * @remarks
 * Note that the collectionMetadata, badgeMetadata, activity, announcements, reviews, claims, and balances fields are
 * dynamically fetched from the DB as needed. They may be empty or missing information when the collection is first fetched.
 * You are responsible for fetching the missing information as needed from the corresponding API routes.
 *
 * @see
 * Use updateMetadataMap to update the metadata fields.
 */
export interface BitBadgesCollection<T extends NumberType> extends CollectionDoc<T> {
  managerInfo: BitBadgesUserInfo<T>;

  //The following are to be fetched dynamically and as needed from the DB
  collectionMetadata: Metadata<T>;
  badgeMetadata: MetadataMap<T>
  activity: TransferActivityItem<T>[],
  announcements: AnnouncementActivityItem<T>[],
  reviews: ReviewActivityItem<T>[],
  balances: BalanceDoc<T>[],
  claims: ClaimInfo<T>[],
}

export type b_BitBadgesCollection = BitBadgesCollection<bigint>;
export type s_BitBadgesCollection = BitBadgesCollection<string>;
export type n_BitBadgesCollection = BitBadgesCollection<number>;
export type d_BitBadgesCollection = BitBadgesCollection<StringNumber>;

export function convertBitBadgesCollection<T extends NumberType, U extends NumberType>(item: BitBadgesCollection<T>, convertFunction: (item: T) => U): BitBadgesCollection<U> {
  return deepCopy({
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
  })
}
