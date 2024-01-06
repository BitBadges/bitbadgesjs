import { AddressMapping, ApprovalCriteria, CollectionApproval, CollectionApprovalPermission, CollectionPermissions, NumberType, UintRange, UserBalanceStore, UserIncomingApprovalPermission, UserOutgoingApprovalPermission, UserPermissions, convertApprovalCriteria, convertCollectionApproval, convertCollectionApprovalPermission, convertCollectionPermissions, convertUintRange, convertUserBalanceStore, convertUserIncomingApprovalPermission, convertUserOutgoingApprovalPermission, convertUserPermissions } from "bitbadgesjs-proto";
import { AnnouncementDoc, ReviewDoc, TransferActivityDoc, convertAnnouncementDoc, convertReviewDoc, convertTransferActivityDoc } from "./activity";
import { PaginationInfo } from "./api";
import { ApprovalInfoDetails, ApprovalsTrackerDoc, BalanceDocWithDetails, CollectionInfoBase, MerkleChallengeDoc, MerkleChallengeWithDetails, convertApprovalInfoDetails, convertApprovalsTrackerDoc, convertBalanceDocWithDetails, convertCollectionDoc, convertMerkleChallengeDoc } from "./db";
import { Metadata, convertMetadata } from "./metadata";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails, convertUserIncomingApprovalWithDetails, convertUserOutgoingApprovalWithDetails } from "./users";
import { deepCopy } from "./utils";

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


/**
 * @category Approvals / Transferability
 */
export interface UserIncomingApprovalPermissionWithDetails<T extends NumberType> extends UserIncomingApprovalPermission<T> {
  fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;
}

/**
 * @category Approvals / Transferability
 */
export function convertUserIncomingApprovalPermissionWithDetails<T extends NumberType, U extends NumberType>(item: UserIncomingApprovalPermissionWithDetails<T>, convertFunction: (item: T) => U): UserIncomingApprovalPermissionWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertUserIncomingApprovalPermission(item, convertFunction),
    fromMapping: item.fromMapping,
    initiatedByMapping: item.initiatedByMapping,
  })
}

/**
 * @category Approvals / Transferability
 */
export interface UserOutgoingApprovalPermissionWithDetails<T extends NumberType> extends UserOutgoingApprovalPermission<T> {
  toMapping: AddressMapping;
  initiatedByMapping: AddressMapping;
}

/**
 * @category Approvals / Transferability
 */
export function convertUserOutgoingApprovalPermissionWithDetails<T extends NumberType, U extends NumberType>(item: UserOutgoingApprovalPermissionWithDetails<T>, convertFunction: (item: T) => U): UserOutgoingApprovalPermissionWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertUserOutgoingApprovalPermission(item, convertFunction),
    toMapping: item.toMapping,
    initiatedByMapping: item.initiatedByMapping,
  })
}

/**
 * @category Approvals / Transferability
 */
export interface CollectionPermissionsWithDetails<T extends NumberType> extends CollectionPermissions<T> {
  canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails<T>[];
}

/**
 * @category Approvals / Transferability
 */
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
export interface UserPermissionsWithDetails<T extends NumberType> extends UserPermissions<T> {
  canUpdateIncomingApprovals: UserIncomingApprovalPermissionWithDetails<T>[];
  canUpdateOutgoingApprovals: UserOutgoingApprovalPermissionWithDetails<T>[];
}

/**
 * @category Approvals / Transferability
 */
export function convertUserPermissionsWithDetails<T extends NumberType, U extends NumberType>(item: UserPermissionsWithDetails<T>, convertFunction: (item: T) => U): UserPermissionsWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertUserPermissions(item, convertFunction),
    canUpdateIncomingApprovals: item.canUpdateIncomingApprovals.map((canUpdateUserIncomingApproval) => {
      return {
        ...canUpdateUserIncomingApproval,
        ...convertUserIncomingApprovalPermissionWithDetails(canUpdateUserIncomingApproval, convertFunction),
      }
    }),
    canUpdateOutgoingApprovals: item.canUpdateOutgoingApprovals.map((canUpdateUserOutgoingApproval) => {
      return {
        ...canUpdateUserOutgoingApproval,
        ...convertUserOutgoingApprovalPermissionWithDetails(canUpdateUserOutgoingApproval, convertFunction),
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
  details?: ApprovalInfoDetails<T>
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
    details: item.details ? convertApprovalInfoDetails(item.details, convertFunction) : undefined,
    approvalCriteria: item.approvalCriteria ? {
      ...convertApprovalCriteria(item.approvalCriteria, convertFunction),
    } : undefined,
  })
}

/**
 * @category Approvals / Transferability
 *
 * @property {UserOutgoingApprovalWithDetails[]} outgoingApprovals - The default user outgoing approvals for this collection, with off-chain metadata populated.
 * @property {UserIncomingApprovalWithDetails[]} incomingApprovals - The default user incoming approvals for this collection, with off-chain metadata populated.
 * @property {UserPermissionsWithDetails} userPermissions - The default user permissions for this collection, with off-chain metadata populated.
 */
export interface UserBalanceStoreWithDetails<T extends NumberType> extends UserBalanceStore<T> {
  outgoingApprovals: UserOutgoingApprovalWithDetails<T>[];
  incomingApprovals: UserIncomingApprovalWithDetails<T>[];
  userPermissions: UserPermissionsWithDetails<T>;
}

/**
 * @category Approvals / Transferability
 */
export function convertUserBalanceStoreWithDetails<T extends NumberType, U extends NumberType>(item: UserBalanceStoreWithDetails<T>, convertFunction: (item: T) => U): UserBalanceStoreWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertUserBalanceStore(item, convertFunction),
    outgoingApprovals: item.outgoingApprovals.map((outgoingApproval) => convertUserOutgoingApprovalWithDetails(outgoingApproval, convertFunction)),
    incomingApprovals: item.incomingApprovals.map((incomingApproval) => convertUserIncomingApprovalWithDetails(incomingApproval, convertFunction)),
    userPermissions: convertUserPermissionsWithDetails(item.userPermissions, convertFunction),
  })
}

/**
 * BitBadgesCollection is the type for collections returned by the BitBadges API. It extends the base CollectionDoc type
 * and adds additional accompanying Docrmation such as metadata, activity, balances, preferred chain, etc.
 *
 * @typedef {Object} BitBadgesCollection
 * @extends {CollectionInfoBase} The base collection document
 *
 * @property {CollectionApprovalWithDetails[]} collectionApprovals - The collection approvals for this collection, with off-chain metadata populated.
 * @property {CollectionPermissionsWithDetails} collectionPermissions - The collection permissions for this collection, with off-chain metadata populated.
 *
 * @property {Metadata} cachedCollectionMetadata - The fetched collection metadata for this collection. Will only be fetched if requested. It is your responsibility to join this data.
 * @property {BadgeMetadataDetails[]} cachedBadgeMetadata - The fetched badge metadata for this collection. Will only be fetched if requested. It is your responsibility to join this data.
 *
 * @property {UserBalanceStoreWithDetails} defaultBalances - The default balances for users upon genesis, with off-chain metadata populated.
 *
 * @property {TransferActivityDoc[]} activity - The fetched activity for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views.
 * @property {AnnouncementDoc[]} announcements - The fetched announcements for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views.
 * @property {ReviewDoc[]} reviews - The fetched reviews for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views.
 * @property {BalanceDocWithDetails[]} owners - The fetched owners of this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views.
 * @property {MerkleChallengeDoc[]} merkleChallenges - The fetched merkle challenges for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views.
 * @property {ApprovalsTrackerDoc[]} approvalsTrackers - The fetched approval trackers for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views.
 *
 * @property {Object} nsfw - The badge IDs in this collection that are marked as NSFW.
 * @property {Object} reported - The badge IDs in this collection that have been reported.
 *
 * @property {Object.<string, { ids: string[], type: string, pagination: PaginationInfo }>} views - The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more. To be used in conjunction with activity, announcements, reviews, owners, merkleChallenges, and approvalsTrackers. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs.
 *
 * @remarks
 * Note that returned collections will only fetch what is requested. It is your responsibility to join the data together (paginations, etc).
 *
 * See documentation for helper functions, examples, and tutorials on handling this data and paginations.
 *
 * @category API / Indexer
 */
export interface BitBadgesCollection<T extends NumberType> extends CollectionInfoBase<T> {
  collectionApprovals: CollectionApprovalWithDetails<T>[];
  collectionPermissions: CollectionPermissionsWithDetails<T>;

  defaultBalances: UserBalanceStoreWithDetails<T>;

  //The following are to be fetched dynamically and as needed from the DB
  cachedCollectionMetadata?: Metadata<T>;
  cachedBadgeMetadata: BadgeMetadataDetails<T>[];
  activity: TransferActivityDoc<T>[],
  announcements: AnnouncementDoc<T>[],
  reviews: ReviewDoc<T>[],
  owners: BalanceDocWithDetails<T>[],
  merkleChallenges: MerkleChallengeDoc<T>[],
  approvalsTrackers: ApprovalsTrackerDoc<T>[],

  nsfw?: { badgeIds: UintRange<T>[], reason: string };
  reported?: { badgeIds: UintRange<T>[], reason: string };

  views: {
    [viewId: string]: {
      ids: string[],
      type: string,
      pagination: PaginationInfo,
    } | undefined
  }
}

export function convertBitBadgesCollection<T extends NumberType, U extends NumberType>(item: BitBadgesCollection<T>, convertFunction: (item: T) => U): BitBadgesCollection<U> {
  return deepCopy({
    ...item,
    ...convertCollectionDoc({ ...item, _legacyId: item.collectionId.toString() }, convertFunction),
    collectionApprovals: item.collectionApprovals.map((collectionApproval) => convertCollectionApprovalWithDetails(collectionApproval, convertFunction)),
    defaultBalances: convertUserBalanceStoreWithDetails(item.defaultBalances, convertFunction),
    collectionPermissions: convertCollectionPermissionsWithDetails(item.collectionPermissions, convertFunction),
    cachedCollectionMetadata: item.cachedCollectionMetadata ? convertMetadata(item.cachedCollectionMetadata, convertFunction) : undefined,
    cachedBadgeMetadata: item.cachedBadgeMetadata.map((metadata) => convertBadgeMetadataDetails(metadata, convertFunction)),
    activity: item.activity.map((activityItem) => convertTransferActivityDoc(activityItem, convertFunction)),
    announcements: item.announcements.map((activityItem) => convertAnnouncementDoc(activityItem, convertFunction)),
    reviews: item.reviews.map((activityItem) => convertReviewDoc(activityItem, convertFunction)),
    owners: item.owners.map((balance) => convertBalanceDocWithDetails(balance, convertFunction)),
    merkleChallenges: item.merkleChallenges.map((merkleChallenge) => convertMerkleChallengeDoc(merkleChallenge, convertFunction)),
    approvalsTrackers: item.approvalsTrackers.map((approvalsTracker) => convertApprovalsTrackerDoc(approvalsTracker, convertFunction)),
    _rev: undefined,
    _deleted: undefined,

    nsfw: item.nsfw ? { ...item.nsfw, badgeIds: item.nsfw.badgeIds.map((UintRange) => convertUintRange(UintRange, convertFunction)) } : undefined,
    reported: item.reported ? { ...item.reported, badgeIds: item.reported.badgeIds.map((UintRange) => convertUintRange(UintRange, convertFunction)) } : undefined,
  })
}
