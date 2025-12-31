import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, deepCopyPrimitives, getConverterFunction } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { BigIntify } from '@/common/string-numbers.js';
import { AddressList } from '@/core/addressLists.js';
import { generateAlias, getAliasDerivationKeysForBadge } from '@/core/aliases.js';
import { getMintApprovals, getNonMintApprovals, getUnhandledCollectionApprovals } from '@/core/approval-utils.js';
import { CollectionApprovalWithDetails, iCollectionApprovalWithDetails } from '@/core/approvals.js';
import {
  AliasPathWithDetails,
  CosmosCoinWrapperPathWithDetails,
  TokenMetadata,
  validateCollectionMetadataUpdate,
  validateCustomDataUpdate,
  validateIsArchivedUpdate,
  validateManagerUpdate,
  validateStandardsUpdate,
  validateTokenMetadataUpdate
} from '@/core/misc.js';
import type { PermissionNameString } from '@/core/permission-utils.js';
import { getPermissionVariablesFromName } from '@/core/permission-utils.js';
import {
  ActionPermission,
  CollectionApprovalPermissionWithDetails,
  CollectionPermissionsWithDetails,
  TokenIdsActionPermission
} from '@/core/permissions.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import { UserBalanceStoreWithDetails } from '@/core/userBalances.js';
import type { CollectionId, iAddressList, iCollectionMetadata, iTokenMetadata, iUintRange } from '@/interfaces/types/core.js';
import type { iCollectionPermissionsWithDetails } from '@/interfaces/types/permissions.js';
import type { iUserBalanceStoreWithDetails } from '@/interfaces/types/userBalances.js';
import type { BaseBitBadgesApi, PaginationInfo } from './base.js';
import { TransferActivityDoc } from './docs-types/activity.js';
import {
  ApprovalTrackerDoc,
  BalanceDocWithDetails,
  CollectionDoc,
  CollectionStatsDoc,
  MerkleChallengeTrackerDoc,
  TokenFloorPriceDoc,
  UtilityPageDoc
} from './docs-types/docs.js';
import type {
  BitBadgesAddress,
  iAliasPathWithDetails,
  iApprovalTrackerDoc,
  iBalanceDocWithDetails,
  iClaimDetails,
  iCollectionDoc,
  iCollectionStatsDoc,
  iCosmosCoinWrapperPathWithDetails,
  iMerkleChallengeTrackerDoc,
  iTokenFloorPriceDoc,
  iTransferActivityDoc,
  iUtilityPageDoc,
  NativeAddress
} from './docs-types/interfaces.js';
import {
  CollectionMetadataDetails,
  TokenMetadataDetails,
  type iCollectionMetadataDetails,
  type iTokenMetadataDetails
} from './metadata/tokenMetadata.js';

import { convertToBitBadgesAddress } from '@/address-converter/converter.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';
import { ClaimDetails } from '@/core/approvals.js';
import typia from 'typia';
import {
  CollectionViewKey,
  FilterTokensInCollectionSuccessResponse,
  GetAdditionalCollectionDetailsPayload,
  GetBalanceByAddressSuccessResponse,
  GetCollectionRequestBody,
  GetMetadataForCollectionPayload,
  GetOwnersSuccessResponse,
  GetTokenActivitySuccessResponse,
  iFilterTokensInCollectionPayload,
  iFilterTokensInCollectionSuccessResponse,
  iGetBalanceByAddressPayload,
  iGetBalanceByAddressSuccessResponse,
  iGetOwnersPayload,
  iGetOwnersSuccessResponse,
  iGetTokenActivityPayload,
  iGetTokenActivitySuccessResponse,
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

  /** The collection metadata for this collection, with off-chain metadata populated. */
  collectionMetadata: iCollectionMetadata;
  /** The token metadata for this collection, with off-chain metadata populated. */
  tokenMetadata: iTokenMetadata<T>[];

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

  /** The token IDs in this collection that are marked as NSFW. */
  nsfw?: iCollectionNSFW<T>;
  /** The token IDs in this collection that have been reported. */
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
  tokenFloorPrices?: iTokenFloorPriceDoc<T>[];

  /** The IBC wrapper paths for the collection, with off-chain metadata populated. */
  cosmosCoinWrapperPaths: iCosmosCoinWrapperPathWithDetails<T>[];

  /** The alias (non-wrapping) paths for the collection, with off-chain metadata populated. */
  aliasPaths: iAliasPathWithDetails<T>[];
}

/**
 * @category Collections
 */
export interface iCollectionNSFW<T extends NumberType> {
  tokenIds: UintRangeArray<T>;
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

  collectionMetadata: CollectionMetadataDetails<T>;
  tokenMetadata: TokenMetadataDetails<T>[];
  activity: TransferActivityDoc<T>[];
  owners: BalanceDocWithDetails<T>[];
  challengeTrackers: MerkleChallengeTrackerDoc<T>[];
  approvalTrackers: ApprovalTrackerDoc<T>[];

  listings: UtilityPageDoc<T>[];

  claims: ClaimDetails<T>[];

  nsfw?: { tokenIds: UintRangeArray<T>; reason: string };
  reported?: { tokenIds: UintRangeArray<T>; reason: string };

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

  tokenFloorPrices?: iTokenFloorPriceDoc<T>[] | undefined;

  cosmosCoinWrapperPaths: CosmosCoinWrapperPathWithDetails<T>[];

  aliasPaths: AliasPathWithDetails<T>[];

  constructor(data: iBitBadgesCollection<T>) {
    super(data);
    this.collectionApprovals = data.collectionApprovals.map((collectionApproval) => new CollectionApprovalWithDetails(collectionApproval));
    this.collectionPermissions = new CollectionPermissionsWithDetails(data.collectionPermissions);
    this.defaultBalances = new UserBalanceStoreWithDetails(data.defaultBalances);
    this.collectionMetadata = new CollectionMetadataDetails(data.collectionMetadata);
    this.tokenMetadata = data.tokenMetadata.map((x) => new TokenMetadataDetails(x));
    this.activity = data.activity.map((activityItem) => new TransferActivityDoc(activityItem));
    this.owners = data.owners.map((balance) => new BalanceDocWithDetails(balance));
    this.challengeTrackers = data.challengeTrackers.map((merkleChallenge) => new MerkleChallengeTrackerDoc(merkleChallenge));
    this.approvalTrackers = data.approvalTrackers.map((approvalTracker) => new ApprovalTrackerDoc(approvalTracker));
    this.listings = data.listings.map((listing) => new UtilityPageDoc(listing));
    this.nsfw = data.nsfw ? { ...data.nsfw, tokenIds: UintRangeArray.From(data.nsfw.tokenIds) } : undefined;
    this.reported = data.reported ? { ...data.reported, tokenIds: UintRangeArray.From(data.reported.tokenIds) } : undefined;
    this.views = data.views;
    this.claims = data.claims.map((x) => new ClaimDetails(x));
    this.stats = data.stats ? new CollectionStatsDoc(data.stats) : undefined;
    this.tokenFloorPrices = data.tokenFloorPrices?.map((x) => new TokenFloorPriceDoc(x));
    this.cosmosCoinWrapperPaths = data.cosmosCoinWrapperPaths.map((x) => new CosmosCoinWrapperPathWithDetails(x));
    this.aliasPaths = data.aliasPaths.map((x) => new AliasPathWithDetails(x));
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
    return this.collectionMetadata.metadata;
  }

  getCollectionMetadataDetails() {
    return this.collectionMetadata;
  }

  /**
   * Gets the token metadata at a specific time (Date.now() by default).
   *
   * This gets the timeline value. For the actual fetched value, use `getTokenMetadataForTokenId()` instead.
   */
  getTokenMetadata() {
    return this.tokenMetadata;
  }

  /**
   * Get the metadata for a specific token ID. This is the fetched metadata, not the timeline values.
   *
   * This only returns the metadata object (name, image, etc.) and not the URI or other accompanying details.
   * For those, use getTokenMetadataDetails.
   *
   * @example
   * ```ts
   * const collection: BitBadgesCollection<bigint> = { ... }
   * const tokenId = 123n
   * const metadata = collection.getTokenMetadataForTokenId(tokenId)
   * const metadataImage = metadata.image
   * ```
   */
  getTokenMetadataForTokenId(tokenId: T) {
    return TokenMetadataDetails.getMetadataForTokenId(tokenId, this.getTokenMetadata());
  }

  /**
   * Gets the details for a specific token ID. This includes the metadata, URI, and custom data.
   *
   * If you only want the metadata, use getTokenMetadata, or you can access it via result.metadata.
   */
  getTokenMetadataDetails(tokenId: T) {
    return TokenMetadataDetails.getMetadataDetailsForTokenId(tokenId, this.getTokenMetadata());
  }

  /**
   * Gets a UintRangeArray of 1 - Max Token ID for the collection (i.e. [{ start: 1n, end: maxTokenId }]).
   */
  getTokenIdRange() {
    return UintRangeArray.From([{ start: 1n, end: this.getMaxTokenId() }]);
  }

  /**
   * Gets default display currency, if set. Defaults to ubadge.
   */
  getDefaultDisplayCurrency() {
    return (
      this.standards
        ?.find((x) => x.startsWith('DefaultDisplayCurrency'))
        ?.split(':')
        .slice(1)
        .join(':') ?? 'ubadge'
    );
  }

  private getBalanceInfoHelper(address: NativeAddress, throwIfNotFound = true) {
    const convertedAddress = address === 'Mint' || address === 'Total' ? address : convertToBitBadgesAddress(address);
    const owner = this.owners.find((x) => x.bitbadgesAddress === convertedAddress);
    if (!owner && throwIfNotFound)
      throw new Error(`Owner not found for address ${address}. Balance not fetched yet. Missing doc for '${address}' in owners.`);

    return owner;
  }

  /**
   * Gets the balance document for a specific address from the cached owners array. Returns undefined if not fetched yet.
   * The balance document includes the balances, outgoing approvals, and other details. Use getBalances to only get the balances.
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
   * const balance = collection.getBalance(address)
   * console.log(balance?.balances)
   * console.log(balance?.outgoingApprovals)
   * ```
   */
  getBalanceInfo(address: string) {
    return this.getBalanceInfoHelper(address, false);
  }

  /**
   * Wrapper for {@link getBalanceInfo} that throws an error if the balance is not found in the document.
   */
  mustGetBalanceInfo(address: string) {
    return this.getBalanceInfoHelper(address, true) as BalanceDocWithDetails<T>;
  }

  /**
   * Gets the balances for a specific address from the cached owners array. Returns undefined if not fetched yet.
   * This returns the balances only, not the other details. Use getBalanceInfo to get the other details for a user balance store
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
   * const balances = collection.getBalances(address)
   * console.log(balances)
   * ```
   */
  getBalances(address: string) {
    return this.getBalanceInfo(address)?.balances;
  }

  /**
   * Wrapper for {@link getBalances} that throws an error if the balance is not found in the document.
   */
  mustGetBalances(address: string) {
    return this.mustGetBalanceInfo(address).balances;
  }

  /**
   * Gets the maximum token ID for the collection. Checks both the circulating supplys + genesis default balances.
   *
   * Precondition: The Total balance must be fetched.
   */
  getMaxTokenId(): bigint {
    let maxTokenId = 0n;
    for (const tokenIdRange of this.validTokenIds.convert(BigIntify)) {
      if (tokenIdRange.end > maxTokenId) {
        maxTokenId = tokenIdRange.end;
      }
    }

    return maxTokenId;
  }

  /**
   * For a metadata fetch request, prune the request to only request the metadata that is not already fetched.
   *
   * @example
   * ```ts
   * const collection: BitBadgesCollection<bigint> = { ... }
   * const metadataToFetch = collection.pruneMetadataToFetch({ tokenIds: [1n, 2n, 3n], uris: ['ipfs://...'] })
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
   * Validates if a state transition (old token metadata -> new token metadata) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link validateTokenMetadataUpdate}.
   */
  validateTokenMetadataUpdate(newTokenMetadata: iTokenMetadata<T>[]): Error | null {
    const oldTokenMetadata = this.tokenMetadata.map((x) => new TokenMetadata({ uri: x.uri, tokenIds: x.tokenIds, customData: x.customData }));
    const newTokenMetadataConverted = newTokenMetadata.map((x) => new TokenMetadata(x));
    return validateTokenMetadataUpdate(oldTokenMetadata, newTokenMetadataConverted, this.collectionPermissions.canUpdateTokenMetadata);
  }

  /**
   * Validates if a state transition (old custom data -> new custom data) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link validateCustomDataUpdate}.
   */
  validateCustomDataUpdate(newCustomData: string): Error | null {
    return validateCustomDataUpdate(this.customData, newCustomData, this.collectionPermissions.canUpdateCustomData);
  }

  /**
   * Validates if a state transition (old standards -> new standards) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link validateStandardsUpdate}.
   */
  validateStandardsUpdate(newStandards: string[]): Error | null {
    return validateStandardsUpdate(this.standards, newStandards, this.collectionPermissions.canUpdateStandards);
  }

  /**
   * Validates if a state transition (old isArchived -> new isArchived) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link validateIsArchivedUpdate}.
   */
  validateIsArchivedUpdate(newIsArchived: boolean): Error | null {
    return validateIsArchivedUpdate(this.isArchived, newIsArchived, this.collectionPermissions.canArchiveCollection);
  }

  /**
   * Validates if a state transition (old manager -> new manager) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link validateManagerUpdate}.
   */
  validateManagerUpdate(newManager: BitBadgesAddress): Error | null {
    return validateManagerUpdate(this.manager, newManager, this.collectionPermissions.canUpdateManager);
  }

  /**
   * Validates if a state transition (old collection metadata -> new collection metadata) is valid, given the current state of the collection and its permissions.
   *
   * Wrapper for {@link validateCollectionMetadataUpdate}.
   */
  validateCollectionMetadataUpdate(newCollectionMetadata: iCollectionMetadata): Error | null {
    const oldCollectionMetadata = { uri: this.collectionMetadata.uri, customData: this.collectionMetadata.customData };
    return validateCollectionMetadataUpdate(oldCollectionMetadata, newCollectionMetadata, this.collectionPermissions.canUpdateCollectionMetadata);
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
   * Wrapper for {@link ActionPermission.check}.
   */
  checkCanArchiveCollection(time?: NumberType) {
    return ActionPermission.check(this.convert(BigIntify).collectionPermissions.canArchiveCollection, time ? BigInt(time) : BigInt(Date.now()));
  }

  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link ActionPermission.check}.
   */
  checkCanUpdateManager(time?: NumberType) {
    return ActionPermission.check(this.convert(BigIntify).collectionPermissions.canUpdateManager, time ? BigInt(time) : BigInt(Date.now()));
  }

  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link ActionPermission.check}.
   */
  checkCanUpdateStandards(time?: NumberType) {
    return ActionPermission.check(this.convert(BigIntify).collectionPermissions.canUpdateStandards, time ? BigInt(time) : BigInt(Date.now()));
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link ActionPermission.check}.
   */
  checkCanUpdateCustomData(time?: NumberType) {
    return ActionPermission.check(this.convert(BigIntify).collectionPermissions.canUpdateCustomData, time ? BigInt(time) : BigInt(Date.now()));
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link ActionPermission.check}.
   */
  checkCanUpdateCollectionMetadata(time?: NumberType) {
    return ActionPermission.check(
      this.convert(BigIntify).collectionPermissions.canUpdateCollectionMetadata,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link TimedUpdatePermission.check}.
   */
  checkCanUpdateValidTokenIds(tokenIds: iUintRange<T>[], time?: NumberType) {
    return TokenIdsActionPermission.check(
      tokenIds.map((x) => {
        return { tokenIds: UintRangeArray.From([x]).convert(BigIntify) };
      }),
      this.convert(BigIntify).collectionPermissions.canUpdateValidTokenIds,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }
  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   */
  checkCanUpdateTokenMetadata(tokenIds: iUintRange<T>[], time?: NumberType) {
    return TokenIdsActionPermission.check(
      tokenIds.map((x) => ({
        tokenIds: UintRangeArray.From([x]).convert(BigIntify)
      })),
      this.convert(BigIntify).collectionPermissions.canUpdateTokenMetadata,
      time ? BigInt(time) : BigInt(Date.now())
    );
  }

  /**
   * Checks if this permission is executable for the provided values at a specific time (Date.now() by default).
   *
   * Wrapper for {@link CollectionApprovalPermission.check}.
   */
  checkCanUpdateCollectionApprovals(
    details: {
      timelineTimes: iUintRange<NumberType>[];
      tokenIds: iUintRange<NumberType>[];
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
          tokenIds: UintRangeArray.From(x.tokenIds).convert(BigIntify),
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
   * Gets the balance for a specific address for a specific collection. Must pass in a valid API instance.
   */
  static async GetBalanceByAddress<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionId: CollectionId,
    address: string,
    payload?: iGetBalanceByAddressPayload
  ): Promise<GetBalanceByAddressSuccessResponse<T>> {
    try {
      const validateRes: typia.IValidation<iGetBalanceByAddressPayload> = typia.validate<iGetBalanceByAddressPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      api.assertPositiveCollectionId(collectionId);

      const response = await api.axios.get<iGetBalanceByAddressSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetBalanceByAddressRoute(collectionId, address)}`,
        { params: payload }
      );
      return new GetBalanceByAddressSuccessResponse(response.data).convert(api.ConvertFunction);
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
  async fetchBalances(api: BaseBitBadgesApi<T>, address: NativeAddress, forceful?: boolean) {
    const currOwnerInfo = this.getBalanceInfo(address);
    if (currOwnerInfo && !forceful) return currOwnerInfo;

    const newOwnerInfo = await BitBadgesCollection.GetBalanceByAddress(api, this.collectionId, address);
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
      options.tokenFloorPricesToFetch
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
      case 'tokenFloorPrices':
        return this.getTokenFloorPricesView(viewId) as CollectionViewData<T>[KeyType];
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
  getTokenFloorPricesView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.tokenFloorPrices?.find((y) => y._docId === x);
    }) ?? []) as TokenFloorPriceDoc<T>[];
  }

  /**
   * Generates the alias for a specific token ID. Collection alias is stored in the root of the collection.
   *
   * Wrapper for {@link generateAlias}.
   */
  generateAliasForTokenId(tokenId: T) {
    const moduleName = 'badges';
    const derivationKeys = getAliasDerivationKeysForBadge(this.collectionId, tokenId);
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
   * Gets activity for a specific token ID. You have to handle the pagination yourself.
   */
  static async GetTokenActivity<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionId: CollectionId,
    tokenId: NumberType,
    payload?: iGetTokenActivityPayload
  ) {
    try {
      const validateRes: typia.IValidation<iGetTokenActivityPayload> = typia.validate<iGetTokenActivityPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      api.assertPositiveCollectionId(collectionId);
      api.assertPositiveInteger(tokenId);

      const response = await api.axios.get<iGetTokenActivitySuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetTokenActivityRoute(collectionId, tokenId)}`,
        { params: payload }
      );
      return new GetTokenActivitySuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Get the token activity for a specific token ID. You have to handle the pagination yourself.
   */
  async getTokenActivity(api: BaseBitBadgesApi<T>, tokenId: T, body: iGetTokenActivityPayload) {
    return await BitBadgesCollection.GetTokenActivity(api, this.collectionId, tokenId, body);
  }

  /**
   * Gets owners for a specific token ID. You have to handle the pagination yourself.
   */
  static async GetOwners<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionId: CollectionId,
    tokenId: NumberType,
    payload?: iGetOwnersPayload
  ) {
    try {
      const validateRes: typia.IValidation<iGetOwnersPayload> = typia.validate<iGetOwnersPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      api.assertPositiveCollectionId(collectionId);
      api.assertPositiveInteger(tokenId);

      const response = await api.axios.get<iGetOwnersSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetOwnersRoute(collectionId, tokenId)}`,
        { params: payload }
      );
      return new GetOwnersSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the owners for a specific token. You have to handle the pagination yourself.
   */
  async getOwners(api: BaseBitBadgesApi<T>, tokenId: T, body: iGetOwnersPayload) {
    return await BitBadgesCollection.GetOwners(api, this.collectionId, tokenId, body);
  }

  /**
   * Execute a filter query for the collection. You have to handle the pagination yourself.
   */
  static async FilterTokensInCollection<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    collectionId: string,
    body: iFilterTokensInCollectionPayload
  ) {
    try {
      const validateRes: typia.IValidation<iFilterTokensInCollectionPayload> = typia.validate<iFilterTokensInCollectionPayload>(body ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.post<iFilterTokensInCollectionSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.FilterTokensInCollectionRoute(collectionId)}`,
        body
      );
      return new FilterTokensInCollectionSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Execute a filter query for the collection. You have to handle the pagination yourself.
   */
  async FilterTokensInCollection(api: BaseBitBadgesApi<T>, bodyOptions: Omit<iFilterTokensInCollectionPayload, 'collectionId'>) {
    return await BitBadgesCollection.FilterTokensInCollection(api, this.collectionId, bodyOptions);
  }
}

type CollectionViewData<T extends NumberType> = {
  transferActivity: TransferActivityDoc<T>[];
  owners: BalanceDocWithDetails<T>[];
  amountTrackers: ApprovalTrackerDoc<T>[];
  challengeTrackers: MerkleChallengeTrackerDoc<T>[];
  listings: UtilityPageDoc<T>[];
  tokenFloorPrices: TokenFloorPriceDoc<T>[];
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
    tokenIds: []
  };

  const allTokenIdsInMetadata = UintRangeArray.From(
    cachedCollection
      .getTokenMetadata()
      .map((x) => x.tokenIds)
      .flat()
  ).convert(BigIntify);
  allTokenIdsInMetadata.sortAndMerge();
  const allTokenIdsNotInMetadata = allTokenIdsInMetadata.toInverted({ start: 1n, end: GO_MAX_UINT_64 });

  if (metadataFetchReq) {
    const tokenMetadata = cachedCollection.getTokenMetadata();

    //See if we already have the metadata corresponding to the uris
    if (metadataFetchReq.uris) {
      for (const uri of metadataFetchReq.uris) {
        if (!uri) continue;

        const currentTokenMetadata = cachedCollection.getTokenMetadata();
        let hasMetadata = false;
        for (const metadataDetails of currentTokenMetadata) {
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

    //Check if we have all metadata corresponding to the tokenIds
    if (metadataFetchReq.tokenIds) {
      for (const tokenId of metadataFetchReq.tokenIds) {
        const tokenIdCastedAsUintRange = new UintRange(tokenId as iUintRange<NumberType>);
        const tokenIdCastedAsNumber = tokenId as NumberType;

        let tokenIdsLeft: UintRangeArray<bigint>;
        if (typeof tokenIdCastedAsNumber === 'object' && tokenIdCastedAsUintRange.start && tokenIdCastedAsUintRange.end) {
          tokenIdsLeft = UintRangeArray.From([tokenIdCastedAsUintRange.convert(BigIntify)]);
        } else {
          tokenIdsLeft = UintRangeArray.From([{ start: BigInt(tokenIdCastedAsNumber), end: BigInt(tokenIdCastedAsNumber) }]);
        }

        tokenIdsLeft.remove(allTokenIdsNotInMetadata);
        tokenIdsLeft.sortAndMerge();

        let infiniteLoopPreventer = 0;
        //Intutition: check singular, starting token ID. If it is same as others, handle all together. Else, just handle that and continue
        while (tokenIdsLeft.length > 0) {
          const currBadgeUintRange = tokenIdsLeft[0];
          if (infiniteLoopPreventer++ > 1000) throw new Error('Infinite loop detected'); //Should never happen

          //At any point, we should only have one tokenId to check because we remove the others
          //And, we should always have it because it will be there even if unpopulated
          const allMatchingBadgeUintRanges = UintRangeArray.From({ start: currBadgeUintRange.start, end: currBadgeUintRange.start });
          let handled = false;
          for (const metadataDetails of tokenMetadata) {
            if (UintRangeArray.From(metadataDetails.tokenIds).searchIfExists(BigInt(currBadgeUintRange.start))) {
              handled = true;

              if (metadataDetails.metadata == undefined) {
                //We do not have metadata for this tokenId yet
                //If it has a placeholder, the URI only applies to this tokenId. Else, we can apply it to all tokenIds that map to this metadataId
                if (metadataDetails.uri.includes('{id}')) {
                  metadataToFetch.uris.push(metadataDetails.uri.replace('{id}', currBadgeUintRange.start.toString()));
                  tokenIdsLeft.remove(allMatchingBadgeUintRanges);
                } else {
                  metadataToFetch.uris.push(metadataDetails.uri);
                  allMatchingBadgeUintRanges.push(...UintRangeArray.From(metadataDetails.tokenIds).convert(BigIntify));
                  allMatchingBadgeUintRanges.sortAndMerge();
                  tokenIdsLeft.remove(allMatchingBadgeUintRanges);
                }
              } else {
                //We have metadata already and the fetchedUri applys to all these tokenIds so we can remove them all at once
                allMatchingBadgeUintRanges.push(...UintRangeArray.From(metadataDetails.tokenIds).convert(BigIntify));
                allMatchingBadgeUintRanges.sortAndMerge();
                tokenIdsLeft.remove(allMatchingBadgeUintRanges);
              }

              //else we don't have a metadataId for this token which means its manually updated and thus doesn't need to be fetched
              break; //First match only
            }
          }

          if (!handled) {
            throw new Error('Token ID not found in metadata'); //Shouldn't reach here since we handled above
          }

          tokenIdsLeft.sortAndMerge();
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
  //      One place to look: somehow, I think that the indivudal elements in .tokenIds are the same object (cached[0].tokenIds === new[0].tokenIds)
  //      I think the cachedCollection deepCopyPrimitives is the important one, but I'm not sure

  const convertFunction = getConverterFunction(newCollectionResponse.createdBlock);
  let cachedCollection = oldCollection ? oldCollection.convert(convertFunction) : undefined;
  if (!cachedCollection) return newCollectionResponse;

  const newCollection = newCollectionResponse;

  const newTokenMetadata =
    newCollection.getTokenMetadata() && newCollection.getTokenMetadata().length > 0
      ? TokenMetadataDetails.batchUpdateTokenMetadata(
          cachedCollection.getTokenMetadata(),
          newCollection
            .getTokenMetadata()
            .map((x) => x.convert(convertFunction))
            .filter((x) => x.metadata) //only update if we have new metadata
        )
      : cachedCollection.getTokenMetadata();

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

  const tokenFloorPrices = cachedCollection.tokenFloorPrices || [];
  for (const newTokenFloorPrice of newCollection.tokenFloorPrices || []) {
    //If we already have the tokenFloorPrice, replace it (we want newer data)
    const existingTokenFloorPrice = tokenFloorPrices.findIndex((x) => x._docId === newTokenFloorPrice._docId);
    if (existingTokenFloorPrice !== -1) {
      tokenFloorPrices[existingTokenFloorPrice] = newTokenFloorPrice;
    } else {
      tokenFloorPrices.push(newTokenFloorPrice);
    }
  }

  const newCollectionMetadata = newCollection.getCollectionMetadata() || cachedCollection?.getCollectionMetadata();
  const newCollectionMetadataToSet = newCollection.collectionMetadata || cachedCollection?.collectionMetadata;
  newCollectionMetadataToSet.metadata = newCollectionMetadata;

  //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, tokenUris, etc. We just ...spread these from the new response.
  cachedCollection = new BitBadgesCollection({
    ...cachedCollection,
    ...newCollection,
    collectionMetadata: newCollectionMetadataToSet,
    tokenMetadata: newTokenMetadata,
    activity,
    owners,
    challengeTrackers,
    approvalTrackers,
    listings,
    views: newViews,
    tokenFloorPrices
  });

  if (cachedCollection.collectionId === NEW_COLLECTION_ID) {
    if (cachedCollection.collectionMetadata?.metadata) {
      delete cachedCollection.collectionMetadata.metadata.fetchedAt;
      delete cachedCollection.collectionMetadata.metadata.fetchedAtBlock;
    }

    if (cachedCollection.tokenMetadata) {
      for (const metadata of cachedCollection.tokenMetadata) {
        if (metadata.metadata) {
          delete metadata.metadata.fetchedAt;
          delete metadata.metadata.fetchedAtBlock;
        }
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
