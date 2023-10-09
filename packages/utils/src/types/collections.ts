import { AddressMapping, ApprovalCriteria, CollectionApproval, CollectionApprovalPermission, CollectionPermissions, NumberType, UintRange, convertApprovalCriteria, convertCollectionApproval, convertCollectionApprovalPermission, convertCollectionPermissions, convertUintRange } from "bitbadgesjs-proto";
import { AnnouncementInfo, ReviewInfo, TransferActivityInfo, convertAnnouncementInfo, convertReviewInfo, convertTransferActivityInfo } from "./activity";
import { PaginationInfo } from "./api";
import { ApprovalsTrackerInfo, BalanceInfoWithDetails, CollectionInfoBase, Identified, MerkleChallengeInfo, MerkleChallengeWithDetails, convertApprovalsTrackerInfo, convertBalanceInfoWithDetails, convertCollectionInfo, convertMerkleChallengeInfo, convertMerkleChallengeWithDetails } from "./db";
import { Metadata, convertMetadata } from "./metadata";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails, convertUserIncomingApprovalWithDetails, convertUserOutgoingApprovalWithDetails } from "./users";
import { deepCopy, removeCouchDBDetails } from "./utils";

/**
 * @category Metadata
 */
export interface BadgeMetadataDetails<T extends NumberType> {
  metadataId?: T,
  badgeIds: UintRange<T>[],
  metadata: Metadata<T>,
  uri?: string
  customData?: string

  toUpdate?: boolean
}

/**
 * @category Metadata
 */
export function convertBadgeMetadataDetails<T extends NumberType, U extends NumberType>(item: BadgeMetadataDetails<T>, convertFunction: (item: T) => U): BadgeMetadataDetails<U> {
  return deepCopy({
    ...item,
    metadataId: item.metadataId ? convertFunction(item.metadataId) : undefined,
    badgeIds: item.badgeIds.map((UintRange) => convertUintRange(UintRange, convertFunction)),
    metadata: convertMetadata(item.metadata, convertFunction),
  })
}

/**
 * @category Approvals / Transferability
 */
export interface CollectionApprovalPermissionWithDetails<T extends NumberType> extends CollectionApprovalPermission<T> {
  toMapping: AddressMapping;
  fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;
}


/**
 * @category Approvals / Transferability
 */
export function convertCollectionApprovalPermissionWithDetails<T extends NumberType, U extends NumberType>(item: CollectionApprovalPermissionWithDetails<T>, convertFunction: (item: T) => U): CollectionApprovalPermissionWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertCollectionApprovalPermission(item, convertFunction),
    toMapping: item.toMapping,
    fromMapping: item.fromMapping,
    initiatedByMapping: item.initiatedByMapping,
  })
}

export interface CollectionPermissionsWithDetails<T extends NumberType> extends CollectionPermissions<T> {
  canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails<T>[];
}

export function convertCollectionPermissionsWithDetails<T extends NumberType, U extends NumberType>(item: CollectionPermissionsWithDetails<T>, convertFunction: (item: T) => U): CollectionPermissionsWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertCollectionPermissions(item, convertFunction),
    canUpdateCollectionApprovals: item.canUpdateCollectionApprovals.map((canUpdateCollectionApproval) => {
      return {
        ...canUpdateCollectionApproval,
        ...convertCollectionApprovalPermissionWithDetails(canUpdateCollectionApproval, convertFunction),
      }
    }),
  })
}

/**
 * @category Approvals / Transferability
 */
export interface ApprovalCriteriaWithDetails<T extends NumberType> extends ApprovalCriteria<T> {
  merkleChallenge?: MerkleChallengeWithDetails<T>;
}

/**
 * @category Approvals / Transferability
 */
export interface CollectionApprovalWithDetails<T extends NumberType> extends CollectionApproval<T> {
  approvalCriteria?: ApprovalCriteriaWithDetails<T>;
  toMapping: AddressMapping;
  fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;
}

/**
 * @category Approvals / Transferability
 */
export function convertCollectionApprovalWithDetails<T extends NumberType, U extends NumberType>(item: CollectionApprovalWithDetails<T>, convertFunction: (item: T) => U): CollectionApprovalWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertCollectionApproval(item, convertFunction),
    approvalCriteria: item.approvalCriteria ? {
      ...convertApprovalCriteria(item.approvalCriteria, convertFunction),
      merkleChallenge: item.approvalCriteria.merkleChallenge ? convertMerkleChallengeWithDetails(item.approvalCriteria.merkleChallenge, convertFunction) : undefined,
    } : undefined,
  })
}


/**
 * BitBadgesCollection is the type for collections returned by the BitBadges API. It extends the base CollectionDoc type
 * and adds additional accompanying information.
 *
 * @typedef {Object} BitBadgesCollection
 * @extends {CollectionInfoBase} The base collection document
 *
 * @property {Metadata} collectionMetadata - The metadata of this collection
 * @property {Metadata[]} badgeMetadata - The metadata of each badge in this collection stored in a map by metadataId (see how we calculate metadataId in the docs)
 * @property {TransferActivityDoc[]} activity - The transfer activity of this collection
 * @property {AnnouncementDoc[]} announcements - The announcement activity of this collection
 * @property {ReviewDoc[]} reviews - The review activity of this collection
 * @property {BalanceDoc[]} owners - The badge balance documents for owners of this collection
 * @property {MerkleChallengeInfo[]} claims - The claims of this collection
 * @property {ApprovalsTrackerInfo[]} approvalsTrackers - The approvals trackers of this collection
 *
 * @remarks
 * Note that the collectionMetadata, badgeMetadata, activity, announcements, reviews, claims, and balances fields are
 * dynamically fetched from the DB as needed. They may be empty or missing information when the collection is first fetched.
 * You are responsible for fetching the missing information as needed from the corresponding API routes.
 *
 * See documentation for helper functions, examples, and tutorials on handling this data and paginations.
 *
 * @category API / Indexer
 */
export interface BitBadgesCollection<T extends NumberType> extends CollectionInfoBase<T>, Identified {
  collectionApprovals: CollectionApprovalWithDetails<T>[];
  collectionPermissions: CollectionPermissionsWithDetails<T>;

  defaultUserOutgoingApprovals: UserOutgoingApprovalWithDetails<T>[];
  defaultUserIncomingApprovals: UserIncomingApprovalWithDetails<T>[];

  //The following are to be fetched dynamically and as needed from the DB
  cachedCollectionMetadata?: Metadata<T>;
  cachedBadgeMetadata: BadgeMetadataDetails<T>[];
  activity: TransferActivityInfo<T>[],
  announcements: AnnouncementInfo<T>[],
  reviews: ReviewInfo<T>[],
  owners: BalanceInfoWithDetails<T>[],
  merkleChallenges: MerkleChallengeInfo<T>[],
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
    collectionApprovals: item.collectionApprovals.map((collectionApproval) => convertCollectionApprovalWithDetails(collectionApproval, convertFunction)),
    defaultUserIncomingApprovals: item.defaultUserIncomingApprovals.map((userIncomingApproval) => convertUserIncomingApprovalWithDetails(userIncomingApproval, convertFunction)),
    defaultUserOutgoingApprovals: item.defaultUserOutgoingApprovals.map((userOutgoingApproval) => convertUserOutgoingApprovalWithDetails(userOutgoingApproval, convertFunction)),
    collectionPermissions: convertCollectionPermissionsWithDetails(item.collectionPermissions, convertFunction),
    cachedCollectionMetadata: item.cachedCollectionMetadata ? convertMetadata(item.cachedCollectionMetadata, convertFunction) : undefined,
    cachedBadgeMetadata: item.cachedBadgeMetadata.map((metadata) => convertBadgeMetadataDetails(metadata, convertFunction)),
    activity: item.activity.map((activityItem) => convertTransferActivityInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    reviews: item.reviews.map((activityItem) => convertReviewInfo(activityItem, convertFunction)).map(x => removeCouchDBDetails(x)),
    owners: item.owners.map((balance) => convertBalanceInfoWithDetails(balance, convertFunction)).map(x => removeCouchDBDetails(x)),
    merkleChallenges: item.merkleChallenges.map((merkleChallenge) => convertMerkleChallengeInfo(merkleChallenge, convertFunction)).map(x => removeCouchDBDetails(x)),
    approvalsTrackers: item.approvalsTrackers.map((approvalsTracker) => convertApprovalsTrackerInfo(approvalsTracker, convertFunction)).map(x => removeCouchDBDetails(x)),
    _rev: undefined,
    _deleted: undefined,
  })
}
