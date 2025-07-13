import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, deepCopyPrimitives, getConverterFunction } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { BigIntify } from '@/common/string-numbers.js';
import { AddressList } from '@/core/addressLists.js';
import { generateAlias, getAliasDerivationKeysForBadge } from '@/core/aliases.js';
import { getMintApprovals, getNonMintApprovals, getUnhandledCollectionApprovals } from '@/core/approval-utils.js';
import { CollectionApprovalWithDetails, iCollectionApprovalWithDetails } from '@/core/approvals.js';
import {
  BadgeMetadataTimeline,
  BadgeMetadataTimelineWithDetails,
  CollectionMetadataTimelineWithDetails,
  CosmosCoinWrapperPathWithDetails,
  CustomDataTimeline,
  IsArchivedTimeline,
  ManagerTimeline,
  OffChainBalancesMetadataTimeline,
  StandardsTimeline
} from '@/core/misc.js';
import type { PermissionNameString } from '@/core/permission-utils.js';
import { getPermissionVariablesFromName } from '@/core/permission-utils.js';
import {
  ActionPermission,
  BadgeIdsActionPermission,
  CollectionApprovalPermissionWithDetails,
  CollectionPermissionsWithDetails,
  TimedUpdatePermission,
  TimedUpdateWithBadgeIdsPermission
} from '@/core/permissions.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import { UserBalanceStoreWithDetails } from '@/core/userBalances.js';
import type {
  CollectionId,
  iAddressList,
  iBadgeMetadataTimelineWithDetails,
  iCollectionMetadataTimelineWithDetails,
  iUintRange
} from '@/interfaces/badges/core.js';
import type { iCollectionPermissionsWithDetails } from '@/interfaces/badges/permissions.js';
import type { iUserBalanceStoreWithDetails } from '@/interfaces/badges/userBalances.js';
import type { BaseBitBadgesApi, PaginationInfo } from './base.js';
import { TransferActivityDoc } from './docs/activity.js';
import {
  ApprovalTrackerDoc,
  BadgeFloorPriceDoc,
  BalanceDocWithDetails,
  CollectionDoc,
  CollectionStatsDoc,
  MerkleChallengeTrackerDoc,
  UtilityPageDoc
} from './docs/docs.js';
import type {
  iApprovalTrackerDoc,
  iBadgeFloorPriceDoc,
  iBalanceDocWithDetails,
  iClaimDetails,
  iCollectionDoc,
  iCollectionStatsDoc,
  iCosmosCoinWrapperPathWithDetails,
  iMerkleChallengeTrackerDoc,
  iTransferActivityDoc,
  iUtilityPageDoc,
  NativeAddress
} from './docs/interfaces.js';
import { BadgeMetadataDetails, CollectionMetadataDetails } from './metadata/badgeMetadata.js';

import { convertToBitBadgesAddress } from '@/address-converter/converter.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';
import { ClaimDetails } from '@/core/approvals.js';
import { getCurrentValueForTimeline } from '@/core/timelines.js';
import typia from 'typia';
import {
  CollectionViewKey,
  FilterBadgesInCollectionSuccessResponse,
  GetAdditionalCollectionDetailsPayload,
  GetBadgeActivitySuccessResponse,
  GetBadgeBalanceByAddressSuccessResponse,
  GetCollectionRequestBody,
  GetMetadataForCollectionPayload,
  GetOwnersForBadgeSuccessResponse,
  iFilterBadgesInCollectionPayload,
  iFilterBadgesInCollectionSuccessResponse,
  iGetBadgeActivityPayload,
  iGetBadgeActivitySuccessResponse,
  iGetBadgeBalanceByAddressPayload,
  iGetBadgeBalanceByAddressSuccessResponse,
  iGetOwnersForBadgePayload,
  iGetOwnersForBadgeSuccessResponse,
  iRefreshMetadataPayload,
  iRefreshMetadataSuccessResponse,
  iRefreshStatusSuccessResponse,
  MetadataFetchOptions,
  RefreshMetadataSuccessResponse,
  RefreshStatusSuccessResponse
} from './requests/collections.js';
import { BitBadgesApiRoutes } from './requests/routes.js';

const NEW_COLLECTION_ID = '0';

/**
 * @category Interfaces
 */
export interface iBitBadgesCollection<T extends NumberType> extends iCollectionDoc<T> {
  /** The collection approvals for this collection, with off-chain metadata populated. */
  collectionApprovals: iCollectionApprovalWithDetails<T>[];
  /** The collection permissions for this collection, with off-chain metadata populated. */
  collectionPermissions: iCollectionPermissionsWithDetails<T>;

  /** The collection metadata timeline for this collection, with off-chain metadata populated. */
  collectionMetadataTimeline: iCollectionMetadataTimelineWithDetails<T>[];
  /** The badge metadata timeline for this collection, with off-chain metadata populated. */
  badgeMetadataTimeline: iBadgeMetadataTimelineWithDetails<T>[];

  /** The default balances for users upon genesis, with off-chain metadata populated. */
  defaultBalances: iUserBalanceStoreWithDetails<T>;
  /** The fetched activity for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  activity: iTransferActivityDoc<T>[];
  /** The fetched owners of this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  owners: iBalanceDocWithDetails<T>[];
  /** The fetched merkle challenge trackers for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  challengeTrackers: iMerkleChallengeTrackerDoc<T>[];
  /** The fetched approval trackers for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  approvalTrackers: iApprovalTrackerDoc<T>[];

  /** The listings for this collection. */
  listings: iUtilityPageDoc<T>[];

  /** The badge IDs in this collection that are marked as NSFW. */
  nsfw?: iCollectionNSFW<T>;
  /** The badge IDs in this collection that have been reported. */
  reported?: iCollectionNSFW<T>;

  /** The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs. */
  views: {
    [viewId: string]:
      | {
          ids: string[];
          type: string;
          pagination: PaginationInfo;
        }
      | undefined;
  };

  /** Details about any off-chain claims for this collection. Only applicable when outsourced to BitBadges. */
  claims: iClaimDetails<T>[];

  /** The stats for this collection. */
  stats?: iCollectionStatsDoc<T>;

  /** The floor prices for this collection. */
  badgeFloorPrices?: iBadgeFloorPriceDoc<T>[];

  /** The IBC wrapper paths for the collection, with off-chain metadata populated. */
  cosmosCoinWrapperPaths: iCosmosCoinWrapperPathWithDetails<T>[];
}

/**
 * @category Collections
 */
export interface iCollectionNSFW<T extends NumberType> {
  badgeIds: UintRangeArray<T>;
  reason: string;
}

/**
 * BitBadgesCollection is the type for collections returned by the BitBadges API. It extends the base CollectionDoc type
 * and adds additional accompanying Docrmation such as metadata, activity, balances, preferred chain, etc.
 *
 * @category Collections
 */
export class BitBadgesCollection<T extends NumberType>
  extends CollectionDoc<T>
  implements iBitBadgesCollection<T>, CustomType<BitBadgesCollection<T>>
{
  collectionApprovals: CollectionApprovalWithDetails<T>[];
  collectionPermissions: CollectionPermissionsWithDetails<T>;
  defaultBalances: UserBalanceStoreWithDetails<T>;

  collectionMetadataTimeline: CollectionMetadataTimelineWithDetails<T>[];
  badgeMetadataTimeline: BadgeMetadataTimelineWithDetails<T>[];

  activity: TransferActivityDoc<T>[];
  owners: BalanceDocWithDetails<T>[];
  challengeTrackers: MerkleChallengeTrackerDoc<T>[];
  approvalTrackers: ApprovalTrackerDoc<T>[];

  listings: UtilityPageDoc<T>[];

  claims: ClaimDetails<T>[];

  nsfw?: { badgeIds: UintRangeArray<T>; reason: string };
  reported?: { badgeIds: UintRangeArray<T>; reason: string };

  views: {
    [viewId: string]:
      | {
          ids: string[];
          type: string;
          pagination: PaginationInfo;
        }
      | undefined;
  };

  stats?: CollectionStatsDoc<T>;

  badgeFloorPrices?: iBadgeFloorPriceDoc<T>[] | undefined;

  cosmosCoinWrapperPaths: CosmosCoinWrapperPathWithDetails<T>[];

  constructor(data: iBitBadgesCollection<T>) {
    super(data);
    this.collectionApprovals = data.collectionApprovals.map((collectionApproval) => new CollectionApprovalWithDetails(collectionApproval));
    this.collectionPermissions = new CollectionPermissionsWithDetails(data.collectionPermissions);
    this.defaultBalances = new UserBalanceStoreWithDetails(data.defaultBalances);
    this.collectionMetadataTimeline = data.collectionMetadataTimeline.map(
      (collectionMetadata) => new CollectionMetadataTimelineWithDetails(collectionMetadata)
    );
    this.badgeMetadataTimeline = data.badgeMetadataTimeline.map((badgeMetadata) => new BadgeMetadataTimelineWithDetails(badgeMetadata));
    this.activity = data.activity.map((activityItem) => new TransferActivityDoc(activityItem));
    this.owners = data.owners.map((balance) => new BalanceDocWithDetails(balance));
    this.challengeTrackers = data.challengeTrackers.map((merkleChallenge) => new MerkleChallengeTrackerDoc(merkleChallenge));
    this.approvalTrackers = data.approvalTrackers.map((approvalTracker) => new ApprovalTrackerDoc(approvalTracker));
    this.listings = data.listings.map((listing) => new UtilityPageDoc(listing));
    this.nsfw = data.nsfw ? { ...data.nsfw, badgeIds: UintRangeArray.From(data.nsfw.badgeIds) } : undefined;
    this.reported = data.reported ? { ...data.reported, badgeIds: UintRangeArray.From(data.reported.badgeIds) } : undefined;
    this.views = data.views;
    this.claims = data.claims.map((x) => new ClaimDetails(x));
    this.stats = data.stats ? new CollectionStatsDoc(data.stats) : undefined;
    this.badgeFloorPrices = data.badgeFloorPrices?.map((x) => new BadgeFloorPriceDoc(x));
    this.cosmosCoinWrapperPaths = data.cosmosCoinWrapperPaths.map((x) => new CosmosCoinWrapperPathWithDetails(x));
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames()];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BitBadgesCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as BitBadgesCollection<U>;
  }

  clone(): BitBadgesCollection<T> {
    return super.clone() as BitBadgesCollection<T>;
  }

  /**
   * Get the cached collection metadata. This is the fetched metadata, not the timeline values.
   *
   * @example
   * ```ts
   * const collection: BitBadgesCollection<bigint> = { ... }
   * const metadata = collection.getCollectionMetadata()
   * const metadataImage = metadata.image
   * ```
   */
  getCollectionMetadata() {
    return getCurrentValueForTimeline(this.collectionMetadataTimeline)?.collectionMetadata.metadata;
  }

  getCollectionMetadataDetails() {
    return getCurrentValueForTimeline(this.collectionMetadataTimeline)?.collectionMetadata;
  }

  /**
   * Sets the collection metadata for certain times (defaults to all times).
   */
  setCollectionMetadataForTimes(metadata: CollectionMetadataDetails<T>, timelineTimesToSet?: iUintRange<T>[]) {
    const converterFunction = getConverterFunction(this.createdBlock);
    const fullTimeline: CollectionMetadataTimelineWithDetails<T>[] = timelineTimesToSet
      ? this.collectionMetadataTimeline
          .map((x) => x.clone())
          .map((x) => {
            const newTimes = x.timelineTimes.clone().remove(timelineTimesToSet);
            return new CollectionMetadataTimelineWithDetails({
              ...x,
              timelineTimes: newTimes
            });
          })
          .filter((x) => x.timelineTimes.length > 0)
      : [];

    fullTimeline.push(
      new CollectionMetadataTimelineWithDetails<NumberType>({
        collectionMetadata: metadata,
        timelineTimes: timelineTimesToSet ? UintRangeArray.From(timelineTimesToSet ?? []) : UintRangeArray.FullRanges()
      }).convert(converterFunction)
    );

    return fullTimeline;
  }

  /**
   * Sets the badge metadata for certain times (defaults to all times).
   */
  setBadgeMetadataForTimes(metadata: BadgeMetadataDetails<T>[], timelineTimesToSet?: iUintRange<T>[]) {
    const converterFunction = getConverterFunction(this.createdBlock);
    const fullTimeline: BadgeMetadataTimelineWithDetails<T>[] = timelineTimesToSet
      ? this.badgeMetadataTimeline
          .map((x) => x.clone())
          .map((x) => {
            const newTimes = x.timelineTimes.clone().remove(timelineTimesToSet);
            return new BadgeMetadataTimelineWithDetails({
              ...x,
              timelineTimes: newTimes
            });
          })
          .filter((x) => x.timelineTimes.length > 0)
      : [];

    fullTimeline.push(
      new BadgeMetadataTimelineWithDetails<NumberType>({
        badgeMetadata: metadata,
        timelineTimes: timelineTimesToSet ? UintRangeArray.From(timelineTimesToSet ?? []) : UintRangeArray.FullRanges()
      }).convert(converterFunction)
    );

    return fullTimeline;
  }

  getCurrentBadgeMetadata() {
    return getCurrentValueForTimeline(this.badgeMetadataTimeline)?.badgeMetadata.map((x) => x.clone()) ?? [];
  }

  /**
   * Get the metadata for a specific badge ID. This is the fetched metadata, not the timeline values.
   *
   * This only returns the metadata object (name, image, etc.) and not the URI or other accompanying details.
   * For those, use getBadgeMetadataDetails.
   *
   * @example
   * ```ts
   * const collection: BitBadgesCollection<bigint> = { ... }
   * const badgeId = 123n
   * const metadata = collection.getBadgeMetadata(badgeId)
   * const metadataImage = metadata.image
   * ```
   */
  getBadgeMetadata(badgeId: T) {
    return BadgeMetadataDetails.getMetadataForBadgeId(badgeId, this.getCurrentBadgeMetadata());
  }

  /**
   * Gets the details for a specific badge ID. This includes the metadata, URI, and custom data.
   *
   * If you only want the metadata, use getBadgeMetadata, or you can access it via result.metadata.
   */
  getBadgeMetadataDetails(badgeId: T) {
    return BadgeMetadataDetails.getMetadataDetailsForBadgeId(badgeId, this.getCurrentBadgeMetadata());
  }

  /**
   * Gets a UintRangeArray of 1 - Max Badge ID for the collection (i.e. [{ start: 1n, end: maxBadgeId }]).
   */
  getBadgeIdRange() {
    return UintRangeArray.From([{ start: 1n, end: this.getMaxBadgeId() }]);
  }

  /**
   * Gets default display currency, if set. Defaults to ubadge.
   */
  getDefaultDisplayCurrency() {
    return (
      this.getStandards()
        ?.find((x) => x.startsWith('DefaultDisplayCurrency'))
        ?.split(':')[1] ?? 'ubadge'
    );
  }

  private getBalanceInfo(address: NativeAddress, throwIfNotFound = true) {
    const convertedAddress = address === 'Mint' || address === 'Total' ? address : convertToBitBadgesAddress(address);
    const owner = this.owners.find((x) => x.bitbadgesAddress === convertedAddress);
    if (!owner && throwIfNotFound)
      throw new Error(`Owner not found for address ${address}. Balance not fetched yet. Missing doc for '${address}' in owners.`);

    return owner;
  }

  /**
   * Gets the badge balance document for a specific address from the cached owners array. Returns undefined if not fetched yet.
   * The balance document includes the balances, outgoing approvals, and other details. Use getBadgeBalances to only get the balances.
   *
   * @remarks
   * This does not fetch the balance from the API. It only returns the cached balance. To fetch the balance, this
   * can either be done directly, or if the collection balances are indexable
   * then the balances can also be fetched via the views and / or the other fetch methods.
   *
   * @example
   * ```ts
   * const collection: BitBadgesCollection<bigint> = { ... }
   * const address = 'bb1...'
   * const balance = collection.getBadgeBalance(address)
   * console.log(balance?.balances)
   * console.log(balance?.outgoingApprovals)
   * ```
   */
  getBadgeBalanceInfo(address: string) {
    return this.getBalanceInfo(address, false);
  }

  /**
   * Wrapper for {@link getBadgeBalanceInfo} that throws an error if the balance is not found in the document.
   */
  mustGetBadgeBalanceInfo(address: string) {
    return this.getBalanceInfo(address, true) as BalanceDocWithDetails<T>;
  }

  /**
   * Gets the badge balances for a specific address from the cached owners array. Returns undefined if not fetched yet.
   * This returns the balances only, not the other details. Use getBadgeBalanceInfo to get the other details for a user balance store
   * (approvals, etc.).
   *
   * @remarks
   * This does not fetch the balance from the API. It only returns the cached balance. To fetch the balance, this
   * can either be done directly, or if the collection balances are indexable (i.e. balances type is anything but Off-Chain - Non-Indexed),
   * then the balances can also be fetched via the views and / or the other fetch methods.
   *
   * @example
   * ```ts
   * const collection: BitBadgesCollection<bigint> = { ... }
   * const address = 'bb1...'
   * const balances = collection.getBadgeBalances(address)
   * console.log(balances)
   * ```
   */
  getBadgeBalances(address: string) {
    return this.getBadgeBalanceInfo(address)?.balances;
  }

  /**
   * Wrapper for {@link getBadgeBalances} that throws an error if the balance is not found in the document.
   */
  mustGetBadgeBalances(address: string) {
    return this.mustGetBadgeBalanceInfo(address).balances;
  }

  /**
   * Gets the maximum badge ID for the collection. Checks both the circulating supplys + genesis default balances.
   *
   * Precondition: The Total balance must be fetched.
   */
  getMaxBadgeId(): bigint {
    let maxBadgeId = 0n;
    for (const badgeIdRange of this.validBadgeIds.convert(BigIntify)) {
      if (badgeIdRange.end > maxBadgeId) {
        maxBadgeId = badgeIdRange.end;
      }
    }

    return maxBadgeId;
  }

  /**
   * For a metadata fetch request, prune the request to only request the metadata that is not already fetched.
   *
   * @example
   * ```ts
   * const collection: BitBadgesCollection<bigint> = { ... }
   * const metadataToFetch = collection.pruneMetadataToFetch({ badgeIds: [1n, 2n, 3n], uris: ['ipfs://...'] })
   * console.log(metadataToFetch)
   * ```
   */
  pruneMetadataToFetch(metadataToFetch: MetadataFetchOptions) {
    return pruneMetadataToFetch(this.convert(BigIntify), metadataToFetch);
  }

  /**
   * Validates if a state transition (old permissions -> new permissions) is valid. Must not update any
   * permanently frozen permissions.
   *
   * Wrapper for {@link CollectionPermissionsWithDetails.validateUpdate}.
   *
   * @see [Permissions Docs](https://docs.bitbadges.io/for-developers/core-concepts/permissions)
   *
   * @remarks
   * This is validating the updatability of the permissions. To validate whether a permission is executable,
   * use the checkCan* functions.
   */
  validatePermissionsUpdate(newPermissions: CollectionPermissionsWithDetails<T>): Error | null {
    const result = CollectionPermissionsWithDetails.validateUpdate(this.collectionPermissions, newPermissions);
    return result;
  }

  /**
   * Validates if a single permission type is updated correctly. Cannot edit anything permanently frozen.
   *
   * This is validating the updatability of the permissions. To validate whether a permission is executable,
   * use the checkCan* functions.
   *
   * @see [Permissions Docs](https://docs.bitbadges.io/for-developers/core-concepts/permissions)
   */
  validatePermissionUpdate(permissionName: PermissionNameString, newPermissions: any[]): Error | null {
    const { validatePermissionUpdateFunction } = getPermissionVariablesFromName(permissionName);
    const oldPermissions = this.collectionPermissions[permissionName as keyof CollectionPermissionsWithDetails<T>];
    const result: Error | null = validatePermissionUpdateFunction(oldPermissions, newPermissions);
    return result;
  }

  /**
   * Validates if a state transition (old approvals -> new approvals) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link CollectionApprovalWithDetails.validateUpdate}.
   */
  validateCollectionApprovalsUpdate(newApprovals: CollectionApprovalWithDetails<T>[]): Error | null {
    const result = CollectionApprovalWithDetails.validateUpdate(
      this.collectionApprovals,
      newApprovals,
      this.collectionPermissions.canUpdateCollectionApprovals
    );
    return result;
  }

  /**
   * Validates if a state transition (old badge metadata -> new badge metadata) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link BadgeMetadataTimeline.validateUpdate}.
   */
  validateBadgeMetadataUpdate(newBadgeMetadata: BadgeMetadataTimeline<T>[]): Error | null {
    const result = BadgeMetadataTimeline.validateUpdate(
      this.badgeMetadataTimeline,
      newBadgeMetadata,
      this.collectionPermissions.canUpdateBadgeMetadata
    );
    return result;
  }

  /**
   * Validates if a state transition (old off-chain balances metadata -> new off-chain balances metadata) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link OffChainBalancesMetadataTimeline.validateUpdate}.
   */
  validateOffChainBalancesMetadataUpdate(newOffChainBalancesMetadata: OffChainBalancesMetadataTimeline<T>[]): Error | null {
    const result = OffChainBalancesMetadataTimeline.validateUpdate(
      this.offChainBalancesMetadataTimeline,
      newOffChainBalancesMetadata,
      this.collectionPermissions.canUpdateOffChainBalancesMetadata
    );
    return result;
  }

  /**
   * Validates if a state transition (old custom data -> new custom data) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link CustomDataTimeline.validateUpdate}.
   */
  validateCustomDataUpdate(newCustomData: CustomDataTimeline<T>[]): Error | null {
    const result = CustomDataTimeline.validateUpdate(this.customDataTimeline, newCustomData, this.collectionPermissions.canUpdateCustomData);
    return result;
  }

  /**
   * Validates if a state transition (old standards -> new standards) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link StandardsTimeline.validateUpdate}.
   */
  validateStandardsUpdate(newStandards: StandardsTimeline<T>[]): Error | null {
    const result = StandardsTimeline.validateUpdate(this.standardsTimeline, newStandards, this.collectionPermissions.canUpdateStandards);
    return result;
  }

  /**
   * Validates if a state transition (old isArchived -> new isArchived) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link IsArchivedTimeline.validateUpdate}.
   */
  validateIsArchivedUpdate(newIsArchived: IsArchivedTimeline<T>[]): Error | null {
    const result = IsArchivedTimeline.validateUpdate(this.isArchivedTimeline, newIsArchived, this.collectionPermissions.canArchiveCollection);
    return result;
  }

  /**
   * Validates if a state transition (old manager -> new manager) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link ManagerTimeline.validateUpdate}.
   */
  validateManagerUpdate(newManager: ManagerTimeline<T>[]): Error | null {
    const result = ManagerTimeline.validateUpdate(this.managerTimeline, newManager, this.collectionPermissions.canUpdateManager);
    return result;
  }

  /**
   * Checks if this permission is executable at a specific time (Date.now() by default).
   *
   * Wrapper for {@link ActionPermission.check}.
   */
  checkCanDeleteCollection(time?: NumberType) {
    return ActionPermission.check(this.convert(BigIntify).collectionPermissions.canDeleteCollection, time ? BigInt(time) : BigInt(Date.now()));
  }

  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanArchiveCollection(timelineTimes: iUintRange<T>[], time?: NumberType) {
    return TimedUpdatePermission.check(
      UintRangeArray.From(timelineTimes.map((x) => new UintRange(x).convert(BigIntify))),
      this.convert(BigIntify).collectionPermissions.canArchiveCollection,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }

  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanUpdateManager(timelineTimes: iUintRange<T>[], time?: NumberType) {
    return TimedUpdatePermission.check(
      UintRangeArray.From(timelineTimes.map((x) => new UintRange(x).convert(BigIntify))),
      this.convert(BigIntify).collectionPermissions.canUpdateManager,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }

  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanUpdateOffChainBalancesMetadata(timelineTimes: iUintRange<T>[], time?: NumberType) {
    return TimedUpdatePermission.check(
      UintRangeArray.From(timelineTimes.map((x) => new UintRange(x).convert(BigIntify))),
      this.convert(BigIntify).collectionPermissions.canUpdateOffChainBalancesMetadata,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanUpdateStandards(timelineTimes: iUintRange<T>[], time?: NumberType) {
    return TimedUpdatePermission.check(
      UintRangeArray.From(timelineTimes.map((x) => new UintRange(x).convert(BigIntify))),
      this.convert(BigIntify).collectionPermissions.canUpdateStandards,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanUpdateCustomData(timelineTimes: iUintRange<T>[], time?: NumberType) {
    return TimedUpdatePermission.check(
      UintRangeArray.From(timelineTimes.map((x) => new UintRange(x).convert(BigIntify))),
      this.convert(BigIntify).collectionPermissions.canUpdateCustomData,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanUpdateCollectionMetadata(timelineTimes: iUintRange<T>[], time?: NumberType) {
    return TimedUpdatePermission.check(
      UintRangeArray.From(timelineTimes.map((x) => new UintRange(x).convert(BigIntify))),
      this.convert(BigIntify).collectionPermissions.canUpdateCollectionMetadata,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanUpdateValidBadgeIds(badgeIds: iUintRange<T>[], time?: NumberType) {
    return BadgeIdsActionPermission.check(
      badgeIds.map((x) => {
        return { badgeIds: UintRangeArray.From([x]).convert(BigIntify) };
      }),
      this.convert(BigIntify).collectionPermissions.canUpdateValidBadgeIds,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   */
  checkCanUpdateBadgeMetadata(details: { timelineTimes: iUintRange<NumberType>[]; badgeIds: iUintRange<NumberType>[] }[], time?: NumberType) {
    return TimedUpdateWithBadgeIdsPermission.check(
      details.map((x) => {
        return {
          ...x,
          timelineTimes: UintRangeArray.From(x.timelineTimes).convert(BigIntify),
          badgeIds: UintRangeArray.From(x.badgeIds).convert(BigIntify)
        };
      }),
      this.convert(BigIntify).collectionPermissions.canUpdateBadgeMetadata,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }

  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanUpdateCollectionApprovals(
    details: {
      timelineTimes: iUintRange<NumberType>[];
      badgeIds: iUintRange<NumberType>[];
      ownershipTimes: iUintRange<NumberType>[];
      transferTimes: iUintRange<NumberType>[];
      toList: iAddressList;
      fromList: iAddressList;
      initiatedByList: iAddressList;
      approvalIdList: iAddressList;
      amountTrackerIdList: iAddressList;
      challengeTrackerIdList: iAddressList;
    }[],
    time?: NumberType
  ) {
    return CollectionApprovalPermissionWithDetails.check(
      details.map((x) => {
        return {
          ...x,
          timelineTimes: UintRangeArray.From(x.timelineTimes).convert(BigIntify),
          badgeIds: UintRangeArray.From(x.badgeIds).convert(BigIntify),
          ownershipTimes: UintRangeArray.From(x.ownershipTimes).convert(BigIntify),
          transferTimes: UintRangeArray.From(x.transferTimes).convert(BigIntify),
          toList: new AddressList(x.toList),
          fromList: new AddressList(x.fromList),
          initiatedByList: new AddressList(x.initiatedByList),
          approvalIdList: new AddressList(x.approvalIdList),
          amountTrackerIdList: new AddressList(x.amountTrackerIdList),
          challengeTrackerIdList: new AddressList(x.challengeTrackerIdList)
        };
      }),
      this.convert(BigIntify).collectionPermissions.canUpdateCollectionApprovals,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }

  /**
   * Fetches and initializes a new BitBadgesCollection object from an API request. Must pass in a valid API instance.
   */
  static async FetchAndInitialize<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    options: { collectionId: CollectionId } & GetMetadataForCollectionPayload & GetAdditionalCollectionDetailsPayload
  ) {
    const collection = await BitBadgesCollection.GetCollections(api, { collectionsToFetch: [options] }).then((x) => x.collections[0]);
    if (!collection) throw new Error('No collection found');
    return new BitBadgesCollection(collection);
  }

  /**
   * Gets collections from the API. Must pass in a valid API instance.
   */
  static async GetCollections<T extends NumberType>(api: BaseBitBadgesApi<T>, body: iGetCollectionsPayload) {
    try {
      const validateRes: typia.IValidation<iGetCollectionsPayload> = typia.validate<iGetCollectionsPayload>(body ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.post<iGetCollectionsSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionsRoute()}`,
        body
      );
      return new GetCollectionsSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the badge balance for a specific address for a specific collection. Must pass in a valid API instance.
   */
  static async GetBadgeBalanceByAddress<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionId: CollectionId,
    address: string,
    payload?: iGetBadgeBalanceByAddressPayload
  ): Promise<GetBadgeBalanceByAddressSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetBadgeBalanceByAddressPayload> = typia.validate<iGetBadgeBalanceByAddressPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      api.assertPositiveCollectionId(collectionId);

      const response = await api.axios.get<iGetBadgeBalanceByAddressSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetBadgeBalanceByAddressRoute(collectionId, address)}`,
        { params: payload }
      );
      return new GetBadgeBalanceByAddressSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Fetches and initializes a batch of new BitBadgesCollection objects from an API request. Must pass in a valid API instance.
   */
  static async FetchAndInitializeBatch<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionsToFetch: ({ collectionId: CollectionId } & GetMetadataForCollectionPayload & GetAdditionalCollectionDetailsPayload)[]
  ) {
    const collection = await BitBadgesCollection.GetCollections(api, { collectionsToFetch: collectionsToFetch });
    return collection.collections.map((x) => (x ? new BitBadgesCollection(x) : undefined));
  }

  /**
   * Fetches the owner information (balances) for a specific address for the current collection. This will update the current collection with the new response information.
   *
   * @remarks
   * Returns the cached value if already fetched. Use forceful to force a new fetch.
   */
  async fetchBadgeBalances(api: BaseBitBadgesApi<T>, address: NativeAddress, forceful?: boolean) {
    const currOwnerInfo = this.getBadgeBalanceInfo(address);
    if (currOwnerInfo && !forceful) return currOwnerInfo;

    const newOwnerInfo = await BitBadgesCollection.GetBadgeBalanceByAddress(api, this.collectionId, address);
    this.owners = this.owners.filter((x) => x.bitbadgesAddress !== newOwnerInfo.bitbadgesAddress);
    this.owners.push(newOwnerInfo);
    return newOwnerInfo;
  }

  /**
   * Returns if a new collection API request body is redundant (meaning we already have the data cached).
   */
  isRedundantRequest(options: GetMetadataForCollectionPayload & GetAdditionalCollectionDetailsPayload) {
    options = this.prunePayload(options);
    const cachedCollection = this.convert(BigIntify);

    const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(cachedCollection, options.metadataToFetch);
    const shouldFetchMetadata =
      (prunedMetadataToFetch.uris && prunedMetadataToFetch.uris.length > 0) || !prunedMetadataToFetch.doNotFetchCollectionMetadata;
    const viewsToFetch = (options.viewsToFetch || []).filter((x) => this.viewHasMore(x.viewId));
    const hasTotal = cachedCollection.owners.find((x) => x.bitbadgesAddress === 'Total');
    const shouldFetchTotal = !hasTotal && options.fetchTotalBalances;

    const shouldFetchMerklechallengeTrackerIds =
      (options.challengeTrackersToFetch ?? []).find((x) => {
        const match = cachedCollection.challengeTrackers.find(
          (y) =>
            y.challengeTrackerId === x.challengeTrackerId &&
            x.approverAddress === y.approverAddress &&
            x.collectionId === y.collectionId &&
            x.approvalLevel === y.approvalLevel
        );
        return !match;
      }) !== undefined;
    const shouldFetchAmountTrackerIds =
      (options.approvalTrackersToFetch ?? []).find((x) => {
        const match = cachedCollection.approvalTrackers.find(
          (y) =>
            y.amountTrackerId === x.amountTrackerId &&
            x.approverAddress === y.approverAddress &&
            x.collectionId === y.collectionId &&
            y.approvedAddress === x.approvedAddress &&
            y.trackerType === x.trackerType
        );
        return !match;
      }) !== undefined;

    return !(
      shouldFetchMetadata ||
      viewsToFetch.length > 0 ||
      shouldFetchTotal ||
      shouldFetchMerklechallengeTrackerIds ||
      shouldFetchAmountTrackerIds ||
      options.fetchPrivateParams ||
      options.badgeFloorPricesToFetch
    );
  }

  /**
   * Prunes a new collection API request body to only request the data that is not already fetched.
   */
  prunePayload(options: GetMetadataForCollectionPayload & GetAdditionalCollectionDetailsPayload) {
    const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(this.convert(BigIntify), options.metadataToFetch);
    const prunedViewsToFetch = (options.viewsToFetch || []).filter((x) => this.viewHasMore(x.viewId));
    const prunedChallengeTrackersToFetch = (options.challengeTrackersToFetch || []).filter((x) => {
      return !this.challengeTrackers.find(
        (y) =>
          y.challengeTrackerId === x.challengeTrackerId &&
          x.approverAddress === y.approverAddress &&
          x.collectionId === y.collectionId &&
          x.approvalLevel === y.approvalLevel
      );
    });
    const prunedApprovalTrackersToFetch = (options.approvalTrackersToFetch || []).filter((x) => {
      return !this.approvalTrackers.find(
        (y) =>
          y.amountTrackerId === x.amountTrackerId &&
          x.approverAddress === y.approverAddress &&
          x.collectionId === y.collectionId &&
          y.approvedAddress === x.approvedAddress &&
          y.trackerType === x.trackerType
      );
    });
    const shouldFetchTotal = !this.owners.find((x) => x.bitbadgesAddress === 'Total') && options.fetchTotalBalances;

    return {
      collectionId: this.collectionId,
      ...options,
      metadataToFetch: prunedMetadataToFetch,
      viewsToFetch: prunedViewsToFetch,
      challengeTrackersToFetch: prunedChallengeTrackersToFetch,
      approvalTrackersToFetch: prunedApprovalTrackersToFetch,
      fetchTotalBalances: shouldFetchTotal
    } as GetMetadataForCollectionPayload & GetAdditionalCollectionDetailsPayload & { collectionId: CollectionId };
  }

  /**
   * Specify a new fetch request for the current collection. This will update the current collection with the new response information.
   * For example, paginations, metadata, views, etc. will all be handled automatically.
   */
  async fetchAndUpdate(
    api: BaseBitBadgesApi<T>,
    options: GetMetadataForCollectionPayload & GetAdditionalCollectionDetailsPayload,
    forceful?: boolean
  ) {
    if (!forceful) {
      if (this.isRedundantRequest(options)) return;
      options = this.prunePayload(options);
    }

    const collection = await BitBadgesCollection.GetCollections(api, {
      collectionsToFetch: [{ collectionId: this.collectionId, ...options }]
    }).then((x) => x.collections[0]);
    if (!collection) throw new Error('No collection found');

    this.updateWithNewResponse(collection, forceful);
  }

  /**
   * Updates the current collection with a new response from the API. If forceful is true, we fully overwrite the current collection with the new response.
   * Else, we will append the new response to the current collection while handling duplicates, paginations, etc.
   */
  updateWithNewResponse(newResponse: BitBadgesCollection<T>, forceful?: boolean) {
    if (forceful) {
      const newCollectionInfo = new BitBadgesCollection(newResponse);
      Object.assign(this, newCollectionInfo);
      return;
    } else {
      const newCollectionInfo = updateCollectionWithResponse(this, newResponse);
      Object.assign(this, newCollectionInfo);
      return;
    }
  }

  /**
   * Wrapper for {@link fetchAndUpdate} that fetches collection metadata.
   */
  async fetchMetadata(api: BaseBitBadgesApi<T>, options: GetMetadataForCollectionPayload, forceful?: boolean) {
    if (!forceful) {
      if (options.metadataToFetch) options.metadataToFetch = this.pruneMetadataToFetch(options.metadataToFetch);
    }

    await this.fetchAndUpdate(api, options, forceful);
  }

  /**
   * Returns if the view has more pages to fetch.
   */
  viewHasMore(viewId: string) {
    return this.views[viewId]?.pagination?.hasMore ?? true;
  }

  /**
   * Returns the pagination information for a specific view ({ hasMore, bookmark }).
   */
  getViewPagination(viewId: string) {
    return this.views[viewId]?.pagination;
  }

  /**
   * Returns the bookmark for a specific view. This is used to fetch the next page.
   */
  getViewBookmark(viewId: string) {
    return this.views[viewId]?.pagination?.bookmark;
  }

  /**
   * Fetches the next page for a specific view. This will update the current collection with the new response information (handling paginations).
   *
   * If the view has no more pages, this will do nothing.
   */
  async fetchNextForView(api: BaseBitBadgesApi<T>, viewType: CollectionViewKey, viewId: string, oldestFirst?: boolean, address?: string) {
    if (!this.viewHasMore(viewId)) return;

    await this.fetchAndUpdate(api, {
      viewsToFetch: [
        {
          viewType: viewType,
          viewId: viewId,
          bookmark: this.views[viewId]?.pagination?.bookmark || '',
          oldestFirst: oldestFirst,
          address: address
        }
      ]
    });
  }

  /**
   * Fetches the entire view (all pages) for a specific view. This will update the current collection with the new response information.
   *
   * There is a 1 second delay between each page fetch to prevent rate limiting.
   */
  async fetchAllForView(api: BaseBitBadgesApi<T>, viewType: CollectionViewKey, viewId: string, oldestFirst?: boolean, address?: string) {
    while (this.viewHasMore(viewId)) {
      await this.fetchNextForView(api, viewType, viewId, oldestFirst, address);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  /**
   * Type agnostic get view function. Uses the viewType to determine the type of view to fetch.
   */
  getView<KeyType extends CollectionViewKey>(viewType: KeyType, viewId: string): CollectionViewData<T>[KeyType] {
    switch (viewType) {
      case 'transferActivity':
        return this.getActivityView(viewId) as CollectionViewData<T>[KeyType];
      case 'owners':
        return this.getOwnersView(viewId) as CollectionViewData<T>[KeyType];
      case 'amountTrackers':
        return this.getApprovalTrackersView(viewId) as CollectionViewData<T>[KeyType];
      case 'challengeTrackers':
        return this.getChallengeTrackersView(viewId) as CollectionViewData<T>[KeyType];
      case 'listings':
        return this.getListingsView(viewId) as CollectionViewData<T>[KeyType];
      case 'badgeFloorPrices':
        return this.getBadgeFloorPricesView(viewId) as CollectionViewData<T>[KeyType];
      default:
        throw new Error(`Unknown view type: ${viewType}`);
    }
  }

  /**
   * Gets the documents for a specific view.
   */
  getActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.activity.find((y) => y._docId === x);
    }) ?? []) as TransferActivityDoc<T>[];
  }

  /**
   * Gets the documents for a specific view.
   */
  getOwnersView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.owners.find((y) => y._docId === x);
    }) ?? []) as BalanceDocWithDetails<T>[];
  }

  /**
   * Gets the documents for a specific view.
   */
  getChallengeTrackersView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.challengeTrackers.find((y) => y._docId === x);
    }) ?? []) as MerkleChallengeTrackerDoc<T>[];
  }

  /**
   * Gets the documents for a specific view.
   */
  getListingsView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.listings.find((y) => y._docId === x);
    }) ?? []) as UtilityPageDoc<T>[];
  }

  /**
   * Gets the documents for a specific view. */
  getApprovalTrackersView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.approvalTrackers.find((y) => y._docId === x);
    }) ?? []) as ApprovalTrackerDoc<T>[];
  }

  /**
   * Gets the documents for a specific view.
   */
  getBadgeFloorPricesView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.badgeFloorPrices?.find((y) => y._docId === x);
    }) ?? []) as BadgeFloorPriceDoc<T>[];
  }

  /**
   * Generates the alias for a specific badge ID. Collection alias is stored in the root of the collection.
   *
   * Wrapper for {@link generateAlias}.
   */
  generateAliasForBadgeId(badgeId: T) {
    const moduleName = 'badges';
    const derivationKeys = getAliasDerivationKeysForBadge(this.collectionId, badgeId);
    return generateAlias(moduleName, derivationKeys);
  }

  /**
   * Returns all the unhandled collection approvals. Unhandled means disapproved.
   *
   * Wrapper for {@link getUnhandledCollectionApprovals}.
   */
  getUnhandledCollectionApprovals() {
    return getUnhandledCollectionApprovals(this.convert(BigIntify).collectionApprovals, true);
  }

  /**
   * Returns all the non-mint collection approvals.
   *
   * Wrapper for {@link getNonMintApprovals}.
   */
  getNonMintCollectionApprovals() {
    return getNonMintApprovals(this.convert(BigIntify).collectionApprovals);
  }

  /**
   * Returns all the mint collection approvals.
   *
   * Wrapper for {@link getMintApprovals}.
   */
  getMintCollectionApprovals() {
    return getMintApprovals(this.convert(BigIntify).collectionApprovals);
  }

  /**
   * Returns the status of this collection in the refresh queue.
   */
  static async GetRefreshStatus<T extends NumberType>(api: BaseBitBadgesApi<T>, collectionId: string) {
    try {
      api.assertPositiveCollectionId(collectionId);

      const response = await api.axios.get<iRefreshStatusSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetRefreshStatusRoute(collectionId)}`
      );
      return new RefreshStatusSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Check the refresh queue status for the collection via the API.
   */
  async getRefreshStatus(api: BaseBitBadgesApi<T>) {
    return await BitBadgesCollection.GetRefreshStatus(api, this.collectionId);
  }

  /**
   * Trigger a refresh for the collection via the API. Note there is a cooldown period for refreshing.
   */
  static async RefreshMetadata<T extends NumberType>(api: BaseBitBadgesApi<T>, collectionId: string, body?: iRefreshMetadataPayload) {
    try {
      const validateRes: typia.IValidation<iRefreshMetadataPayload> = typia.validate<iRefreshMetadataPayload>(body ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      api.assertPositiveCollectionId(collectionId);

      const response = await api.axios.post<iRefreshMetadataSuccessResponse>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.RefreshMetadataRoute(collectionId)}`,
        body
      );
      return new RefreshMetadataSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Trigger a refresh for the collection via the API. Note there is a cooldown period for refreshing.
   */
  async refresh(api: BaseBitBadgesApi<T>) {
    return await BitBadgesCollection.RefreshMetadata(api, this.collectionId);
  }

  /**
   * Gets activity for a specific badge ID. You have to handle the pagination yourself.
   */
  static async GetBadgeActivity<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionId: CollectionId,
    badgeId: NumberType,
    payload?: iGetBadgeActivityPayload
  ) {
    try {
      const validateRes: typia.IValidation<iGetBadgeActivityPayload> = typia.validate<iGetBadgeActivityPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      api.assertPositiveCollectionId(collectionId);
      api.assertPositiveInteger(badgeId);

      const response = await api.axios.get<iGetBadgeActivitySuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetBadgeActivityRoute(collectionId, badgeId)}`,
        { params: payload }
      );
      return new GetBadgeActivitySuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get the badge activity for a specific badge ID. You have to handle the pagination yourself.
   */
  async getBadgeActivity(api: BaseBitBadgesApi<T>, badgeId: T, body: iGetBadgeActivityPayload) {
    return await BitBadgesCollection.GetBadgeActivity(api, this.collectionId, badgeId, body);
  }

  /**
   * Gets owners for a specific badge ID. You have to handle the pagination yourself.
   */
  static async GetOwnersForBadge<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionId: CollectionId,
    badgeId: NumberType,
    payload?: iGetOwnersForBadgePayload
  ) {
    try {
      const validateRes: typia.IValidation<iGetOwnersForBadgePayload> = typia.validate<iGetOwnersForBadgePayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      api.assertPositiveCollectionId(collectionId);
      api.assertPositiveInteger(badgeId);

      const response = await api.axios.get<iGetOwnersForBadgeSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetOwnersForBadgeRoute(collectionId, badgeId)}`,
        { params: payload }
      );
      return new GetOwnersForBadgeSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the owners for a specific badge. You have to handle the pagination yourself.
   */
  async getOwnersForBadge(api: BaseBitBadgesApi<T>, badgeId: T, body: iGetOwnersForBadgePayload) {
    return await BitBadgesCollection.GetOwnersForBadge(api, this.collectionId, badgeId, body);
  }

  /**
   * Execute a filter query for the collection. You have to handle the pagination yourself.
   */
  static async FilterBadgesInCollection<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionId: string,
    body: iFilterBadgesInCollectionPayload
  ) {
    try {
      const validateRes: typia.IValidation<iFilterBadgesInCollectionPayload> = typia.validate<iFilterBadgesInCollectionPayload>(body ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.post<iFilterBadgesInCollectionSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.FilterBadgesInCollectionRoute(collectionId)}`,
        body
      );
      return new FilterBadgesInCollectionSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Execute a filter query for the collection. You have to handle the pagination yourself.
   */
  async filterBadgesInCollection(api: BaseBitBadgesApi<T>, bodyOptions: Omit<iFilterBadgesInCollectionPayload, 'collectionId'>) {
    return await BitBadgesCollection.FilterBadgesInCollection(api, this.collectionId, bodyOptions);
  }
}

type CollectionViewData<T extends NumberType> = {
  transferActivity: TransferActivityDoc<T>[];
  owners: BalanceDocWithDetails<T>[];
  amountTrackers: ApprovalTrackerDoc<T>[];
  challengeTrackers: MerkleChallengeTrackerDoc<T>[];
  listings: UtilityPageDoc<T>[];
  badgeFloorPrices: BadgeFloorPriceDoc<T>[];
};

/**
  @category Indexer
*/
export interface CollectionMap<T extends NumberType> {
  [collectionId: string]: BitBadgesCollection<T> | undefined;
}

/**
 * @category Indexer
 */
export function convertCollectionMap<T extends NumberType, U extends NumberType>(
  item: CollectionMap<T>,
  convertFunction: (item: NumberType) => U
): CollectionMap<U> {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => {
      return [key, value ? value.convert(convertFunction) : undefined];
    })
  );
}

/**
 * Prunes the metadata to fetch based on the cached collection and the metadata fetch request
 */
const pruneMetadataToFetch = <T extends NumberType>(cachedCollection: BitBadgesCollection<T>, metadataFetchReq?: MetadataFetchOptions) => {
  if (!cachedCollection) throw new Error('Collection does not exist');

  const metadataToFetch: Required<MetadataFetchOptions> = {
    doNotFetchCollectionMetadata: cachedCollection.getCollectionMetadata() !== undefined || metadataFetchReq?.doNotFetchCollectionMetadata || false,
    uris: [],
    badgeIds: []
  };

  const allBadgeIdsInMetadata = UintRangeArray.From(
    cachedCollection
      .getCurrentBadgeMetadata()
      .map((x) => x.badgeIds)
      .flat()
  ).convert(BigIntify);
  allBadgeIdsInMetadata.sortAndMerge();
  const allBadgeIdsNotInMetadata = allBadgeIdsInMetadata.toInverted({ start: 1n, end: GO_MAX_UINT_64 });

  if (metadataFetchReq) {
    const badgeMetadata = cachedCollection.getCurrentBadgeMetadata();

    //See if we already have the metadata corresponding to the uris
    if (metadataFetchReq.uris) {
      for (const uri of metadataFetchReq.uris) {
        if (!uri) continue;

        const currentBadgeMetadata = cachedCollection.getCurrentBadgeMetadata();
        let hasMetadata = false;
        for (const metadataDetails of currentBadgeMetadata) {
          if (metadataDetails.fetchedUri === uri && metadataDetails.metadata !== undefined) {
            hasMetadata = true;
            break;
          }
        }

        if (!hasMetadata) {
          metadataToFetch.uris.push(uri);
        }
      }
    }

    //Check if we have all metadata corresponding to the badgeIds
    if (metadataFetchReq.badgeIds) {
      for (const badgeId of metadataFetchReq.badgeIds) {
        const badgeIdCastedAsUintRange = new UintRange(badgeId as iUintRange<NumberType>);
        const badgeIdCastedAsNumber = badgeId as NumberType;

        let badgeIdsLeft: UintRangeArray<bigint>;
        if (typeof badgeIdCastedAsNumber === 'object' && badgeIdCastedAsUintRange.start && badgeIdCastedAsUintRange.end) {
          badgeIdsLeft = UintRangeArray.From([badgeIdCastedAsUintRange.convert(BigIntify)]);
        } else {
          badgeIdsLeft = UintRangeArray.From([{ start: BigInt(badgeIdCastedAsNumber), end: BigInt(badgeIdCastedAsNumber) }]);
        }

        badgeIdsLeft.remove(allBadgeIdsNotInMetadata);
        badgeIdsLeft.sortAndMerge();

        let infiniteLoopPreventer = 0;
        //Intutition: check singular, starting badge ID. If it is same as others, handle all together. Else, just handle that and continue
        while (badgeIdsLeft.length > 0) {
          const currBadgeUintRange = badgeIdsLeft[0];
          if (infiniteLoopPreventer++ > 1000) throw new Error('Infinite loop detected'); //Should never happen

          //At any point, we should only have one badgeId to check because we remove the others
          //And, we should always have it because it will be there even if unpopulated
          const allMatchingBadgeUintRanges = UintRangeArray.From({ start: currBadgeUintRange.start, end: currBadgeUintRange.start });
          let handled = false;
          for (const metadataDetails of badgeMetadata) {
            if (metadataDetails.badgeIds.searchIfExists(BigInt(currBadgeUintRange.start))) {
              handled = true;

              if (metadataDetails.metadata == undefined) {
                //We do not have metadata for this badgeId yet
                //If it has a placeholder, the URI only applies to this badgeId. Else, we can apply it to all badgeIds that map to this metadataId
                if (metadataDetails.uri.includes('{id}')) {
                  metadataToFetch.uris.push(metadataDetails.uri.replace('{id}', currBadgeUintRange.start.toString()));
                  badgeIdsLeft.remove(allMatchingBadgeUintRanges);
                } else {
                  metadataToFetch.uris.push(metadataDetails.uri);
                  allMatchingBadgeUintRanges.push(...UintRangeArray.From(metadataDetails.badgeIds).convert(BigIntify));
                  allMatchingBadgeUintRanges.sortAndMerge();
                  badgeIdsLeft.remove(allMatchingBadgeUintRanges);
                }
              } else {
                //We have metadata already and the fetchedUri applys to all these badgeIds so we can remove them all at once
                allMatchingBadgeUintRanges.push(...UintRangeArray.From(metadataDetails.badgeIds).convert(BigIntify));
                allMatchingBadgeUintRanges.sortAndMerge();
                badgeIdsLeft.remove(allMatchingBadgeUintRanges);
              }

              //else we don't have a metadataId for this badge which means its manually updated and thus doesn't need to be fetched
              break; //First match only
            }
          }

          if (!handled) {
            throw new Error('Badge ID not found in metadata'); //Shouldn't reach here since we handled above
          }

          badgeIdsLeft.sortAndMerge();
        }
      }
    }
  }

  return {
    ...metadataToFetch,
    uris: metadataToFetch.uris ?? []
  } as { doNotFetchCollectionMetadata: boolean; uris: string[] };
};

function updateCollectionWithResponse<T extends NumberType>(
  oldCollection: BitBadgesCollection<T> | undefined,
  newCollectionResponse: BitBadgesCollection<T>
): BitBadgesCollection<T> {
  //TODO: No idea why the deep copy is necessary but it breaks the timeline batch updates for existing collections if not
  //      One place to look: somehow, I think that the indivudal elements in .badgeIds are the same object (cached[0].badgeIds === new[0].badgeIds)
  //      I think the cachedCollection deepCopyPrimitives is the important one, but I'm not sure

  const convertFunction = getConverterFunction(newCollectionResponse.createdBlock);
  let cachedCollection = oldCollection ? oldCollection.convert(convertFunction) : undefined;
  if (!cachedCollection) return newCollectionResponse;

  const newCollection = newCollectionResponse;

  const newBadgeMetadata =
    newCollection.getCurrentBadgeMetadata() && newCollection.getCurrentBadgeMetadata().length > 0
      ? BadgeMetadataDetails.batchUpdateBadgeMetadata(
          cachedCollection.getCurrentBadgeMetadata(),
          newCollection
            .getCurrentBadgeMetadata()
            .map((x) => x.convert(convertFunction))
            .filter((x) => x.metadata) //only update if we have new metadata
        )
      : cachedCollection.getCurrentBadgeMetadata();

  const newViews = cachedCollection?.views || {};

  if (newCollection.views) {
    for (const [key, val] of Object.entries(newCollection.views)) {
      if (!val) continue;
      const oldVal = cachedCollection?.views[key];
      const newVal = val;

      newViews[key] = {
        ids: [...(oldVal?.ids || []), ...(newVal?.ids || [])].filter((val, index, self) => self.findIndex((x) => x === val) === index),
        pagination: newVal.pagination,
        type: val.type
      };
    }
  }

  const activity = cachedCollection.activity || [];
  for (const newActivity of newCollection.activity || []) {
    //If we already have the activity, replace it (we want newer data)
    const existingActivity = activity.findIndex((x) => x._docId === newActivity._docId);
    if (existingActivity !== -1) {
      activity[existingActivity] = newActivity;
    } else {
      activity.push(newActivity);
    }
  }

  const owners = cachedCollection.owners || [];
  for (const newOwner of newCollection.owners || []) {
    //If we already have the owner, replace it (we want newer data)
    const existingOwner = owners.findIndex((x) => x._docId === newOwner._docId);
    if (existingOwner !== -1) {
      owners[existingOwner] = newOwner;
    } else {
      owners.push(newOwner);
    }
  }

  const challengeTrackers = cachedCollection.challengeTrackers || [];
  for (const newChallengeTracker of newCollection.challengeTrackers || []) {
    //If we already have the challengeTracker, replace it (we want newer data)
    const existingChallengeTracker = challengeTrackers.findIndex((x) => x._docId === newChallengeTracker._docId);
    if (existingChallengeTracker !== -1) {
      challengeTrackers[existingChallengeTracker] = newChallengeTracker;
    } else {
      challengeTrackers.push(newChallengeTracker);
    }
  }

  const approvalTrackers = cachedCollection.approvalTrackers || [];
  for (const newApprovalTracker of newCollection.approvalTrackers || []) {
    //If we already have the approvalTracker, replace it (we want newer data)
    const existingApprovalTracker = approvalTrackers.findIndex((x) => x._docId === newApprovalTracker._docId);
    if (existingApprovalTracker !== -1) {
      approvalTrackers[existingApprovalTracker] = newApprovalTracker;
    } else {
      approvalTrackers.push(newApprovalTracker);
    }
  }

  const listings = cachedCollection.listings || [];
  for (const newListing of newCollection.listings || []) {
    //If we already have the listing, replace it (we want newer data)
    const existingListing = listings.findIndex((x) => x._docId === newListing._docId);
    if (existingListing !== -1) {
      listings[existingListing] = newListing;
    } else {
      listings.push(newListing);
    }
  }

  const badgeFloorPrices = cachedCollection.badgeFloorPrices || [];
  for (const newBadgeFloorPrice of newCollection.badgeFloorPrices || []) {
    //If we already have the badgeFloorPrice, replace it (we want newer data)
    const existingBadgeFloorPrice = badgeFloorPrices.findIndex((x) => x._docId === newBadgeFloorPrice._docId);
    if (existingBadgeFloorPrice !== -1) {
      badgeFloorPrices[existingBadgeFloorPrice] = newBadgeFloorPrice;
    } else {
      badgeFloorPrices.push(newBadgeFloorPrice);
    }
  }

  const newCollectionMetadata = newCollection.getCollectionMetadata() || cachedCollection?.getCollectionMetadata();
  const newCollectionMetadataTimeline = newCollection.collectionMetadataTimeline || cachedCollection?.collectionMetadataTimeline;
  for (const timelineTime of newCollectionMetadataTimeline) {
    if (timelineTime.timelineTimes.searchIfExists(BigInt(Date.now()))) {
      timelineTime.collectionMetadata.metadata = newCollectionMetadata;
    }
  }

  const newBadgeMetadataTimeline = newCollection.badgeMetadataTimeline || cachedCollection?.badgeMetadataTimeline;
  for (const timelineTime of newBadgeMetadataTimeline) {
    if (timelineTime.timelineTimes.searchIfExists(BigInt(Date.now()))) {
      timelineTime.badgeMetadata = newBadgeMetadata;
    }
  }

  //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, badgeUris, etc. We just ...spread these from the new response.
  cachedCollection = new BitBadgesCollection({
    ...cachedCollection,
    ...newCollection,
    collectionMetadataTimeline: newCollectionMetadataTimeline,
    badgeMetadataTimeline: newBadgeMetadataTimeline,
    activity,
    owners,
    challengeTrackers,
    approvalTrackers,
    listings,
    views: newViews,
    badgeFloorPrices
  });

  if (cachedCollection.collectionId === NEW_COLLECTION_ID) {
    for (const timelineItem of cachedCollection.collectionMetadataTimeline) {
      delete timelineItem.collectionMetadata?.metadata?.fetchedAt;
      delete timelineItem.collectionMetadata?.metadata?.fetchedAtBlock;
    }

    for (const metadataDetails of cachedCollection.badgeMetadataTimeline) {
      for (const metadata of metadataDetails.badgeMetadata) {
        delete metadata.metadata?.fetchedAt;
        delete metadata.metadata?.fetchedAtBlock;
      }
    }
  }

  return cachedCollection;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionsPayload {
  collectionsToFetch: GetCollectionRequestBody[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionsSuccessResponse<T extends NumberType> {
  collections: (iBitBadgesCollection<T> | undefined)[];
}

export class GetCollectionsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionsSuccessResponse<T>>
  implements iGetCollectionsSuccessResponse<T>
{
  collections: (BitBadgesCollection<T> | undefined)[];

  constructor(data: iGetCollectionsSuccessResponse<T>) {
    super();
    this.collections = data.collections.map((collection) => (collection ? new BitBadgesCollection(collection) : undefined));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetCollectionsSuccessResponse<U> {
    return new GetCollectionsSuccessResponse(
      deepCopyPrimitives({
        collections: this.collections.map((collection) => (collection ? collection.convert(convertFunction) : undefined))
      })
    );
  }
}
