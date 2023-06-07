import { NumberType } from "bitbadgesjs-proto";
import { AnnouncementInfo, ReviewInfo, TransferActivityInfo, convertAnnouncementDoc, convertReviewDoc, convertTransferActivityDoc } from "./activity";
import { BalanceInfo, ClaimInfoWithDetails, CollectionInfoBase, CouchDBDetailsExcluded, convertBalanceDoc, convertClaimInfoWithDetails, convertCollectionDoc } from "./db";
import { Metadata, convertMetadata } from "./metadata";
import { MetadataMap, convertMetadataMap } from "./types";
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./users";
import { deepCopy, removeCouchDBDetails } from "./utils";
import { CollectionResponsePagination } from "./api";

/**
 * BitBadgesCollection is the type for collections returned by the BitBadges API. It extends the base CollectionDoc type
 * and adds additional accompanying information.
 *
 * @typedef {Object} BitBadgesCollection
 * @extends {CollectionInfoBase} The base collection document
 *
 * @property {BitBadgesUserInfo} managerInfo - The account information of the manager of this collection
 * @property {Metadata} collectionMetadata - The metadata of this collection
 * @property {MetadataMap} badgeMetadata - The metadata of each badge in this collection stored in a map by metadataId (see how we calculate metadataId in the docs)
 * @property {TransferActivityDoc[]} activity - The transfer activity of this collection
 * @property {AnnouncementDoc[]} announcements - The announcement activity of this collection
 * @property {ReviewDoc[]} reviews - The review activity of this collection
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
export interface BitBadgesCollection<T extends NumberType> extends CollectionInfoBase<T>, CouchDBDetailsExcluded {
  managerInfo: BitBadgesUserInfo<T>;

  //The following are to be fetched dynamically and as needed from the DB
  collectionMetadata: Metadata<T>;
  badgeMetadata: MetadataMap<T>;
  activity: TransferActivityInfo<T>[],
  announcements: AnnouncementInfo<T>[],
  reviews: ReviewInfo<T>[],
  balances: BalanceInfo<T>[],
  claims: ClaimInfoWithDetails<T>[],

  pagination: CollectionResponsePagination
}

export function convertBitBadgesCollection<T extends NumberType, U extends NumberType>(item: BitBadgesCollection<T>, convertFunction: (item: T) => U): BitBadgesCollection<U> {
  return deepCopy({
    ...item,
    ...convertCollectionDoc({ ...item, _id: '', _rev: '' }, convertFunction),
    managerInfo: convertBitBadgesUserInfo(item.managerInfo, convertFunction),
    collectionMetadata: convertMetadata(item.collectionMetadata, convertFunction),
    badgeMetadata: convertMetadataMap(item.badgeMetadata, convertFunction),
    activity: item.activity.map((activityItem) => convertTransferActivityDoc({ ...activityItem, _id: '', _rev: '' }, convertFunction)).map(x => removeCouchDBDetails(x)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementDoc({ ...activityItem, _id: '', _rev: '' }, convertFunction)).map(x => removeCouchDBDetails(x)),
    reviews: item.reviews.map((activityItem) => convertReviewDoc({ ...activityItem, _id: '', _rev: '' }, convertFunction)).map(x => removeCouchDBDetails(x)),
    balances: item.balances.map((balance) => convertBalanceDoc({ ...balance, _id: '', _rev: '' }, convertFunction)).map(x => removeCouchDBDetails(x)),
    claims: item.claims.map((claim) => convertClaimInfoWithDetails(claim, convertFunction)),
    _id: undefined,
    _rev: undefined,
    _deleted: undefined,
  })
}
