import type { NumberType } from '@/common/string-numbers.js';
import type { iAmountTrackerIdDetails, iUintRange } from '@/interfaces/badges/core.js';
import type { PaginationInfo } from '../base.js';
import { EmptyResponseClass } from '../base.js';
import { UintRangeArray } from '@/core/uintRanges.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, deepCopyPrimitives } from '@/common/base.js';
import { BalanceDocWithDetails, QueueDoc, RefreshDoc } from '../docs/docs.js';
import { TransferActivityDoc } from '../docs/activity.js';
import type { iBalanceDocWithDetails, iChallengeTrackerIdDetails, iQueueDoc, iRefreshDoc, iTransferActivityDoc } from '../docs/interfaces.js';

/**
 * @category API Requests / Responses
 */
export interface FilterSuggestionsPayload {}

/**
 * @category API Requests / Responses
 */
export interface iFilterSuggestionsSuccessResponse {
  attributes: {
    name: string;
    value: string | number | boolean;
    count: number;
    type: string;
  }[];
}

/**
 * @category API Requests / Responses
 */
export class FilterSuggestionsSuccessResponse
  extends BaseNumberTypeClass<FilterSuggestionsSuccessResponse>
  implements iFilterSuggestionsSuccessResponse
{
  attributes: { name: string; value: string | number | boolean; count: number; type: string }[];

  constructor(data: iFilterSuggestionsSuccessResponse) {
    super();
    this.attributes = data.attributes;
  }
}

/**
 * @category API Requests / Responses
 */
export interface FilterBadgesInCollectionPayload {
  /** Limit to specific badge IDs. Leave undefined to not filter by badge ID. */
  badgeIds?: iUintRange<NumberType>[];
  /** Limit to specific lists. Leave undefined to not filter by list. */
  categories?: string[];
  /** Limit to specific lists. Leave undefined to not filter by list. */
  tags?: string[];

  /** mostViewed is a special view that sorts by most viewed badges. May be incompatible with other filters. */
  mostViewed?: 'daily' | 'allTime' | 'weekly' | 'monthly' | 'yearly';
  /** Pagination bookmark. Leave undefined or "" for first request. */
  bookmark?: string;

  /** Attribute queries */
  attributes?: {
    name: string;
    value: string | number | boolean;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iFilterBadgesInCollectionSuccessResponse<T extends NumberType> {
  badgeIds: iUintRange<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class FilterBadgesInCollectionSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<FilterBadgesInCollectionSuccessResponse<T>>
  implements iFilterBadgesInCollectionSuccessResponse<T>
{
  badgeIds: UintRangeArray<T>;
  pagination: PaginationInfo;

  constructor(data: iFilterBadgesInCollectionSuccessResponse<T>) {
    super();
    this.badgeIds = UintRangeArray.From(data.badgeIds);
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): FilterBadgesInCollectionSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as FilterBadgesInCollectionSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetOwnersForBadgePayload {
  /**
   * The pagination bookmark for where to start the request. Bookmarks are obtained via the previous response. "" for first request.
   */
  bookmark?: string;
  /**
   * Sort by amount descending.
   */
  sortBy?: 'amount';
}

/**
 * @category API Requests / Responses
 */
export interface iGetOwnersForBadgeSuccessResponse<T extends NumberType> {
  /**
   * Represents a list of owners balance details.
   */
  owners: iBalanceDocWithDetails<T>[];
  /**
   * Represents pagination information.
   */
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetOwnersForBadgeSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetOwnersForBadgeSuccessResponse<T>>
  implements iGetOwnersForBadgeSuccessResponse<T>
{
  owners: BalanceDocWithDetails<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetOwnersForBadgeSuccessResponse<T>) {
    super();
    this.owners = data.owners.map((balance) => new BalanceDocWithDetails(balance));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetOwnersForBadgeSuccessResponse<U> {
    return new GetOwnersForBadgeSuccessResponse(
      deepCopyPrimitives({
        owners: this.owners.map((balance) => balance.convert(convertFunction)),
        pagination: this.pagination
      })
    );
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetBadgeBalanceByAddressPayload {
  fetchPrivateParams?: boolean;

  /**
   * If true, we will forcefully fetch the balance even if it is already cached. Only applicable to non-indexed / on-demand collections.
   */
  forceful?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetBadgeBalanceByAddressSuccessResponse<T extends NumberType> extends iBalanceDocWithDetails<T> {}

export class GetBadgeBalanceByAddressSuccessResponse<T extends NumberType> extends BalanceDocWithDetails<T> {}

/**
 * @category API Requests / Responses
 */
export interface GetBadgeActivityPayload {
  /**
   * An optional bookmark for pagination. Bookmarks are obtained via the previous response. "" for first request.
   */
  bookmark?: string;
  /**
   * Specific address to filter by. If not present, all activity will be returned.
   */
  bitbadgesAddress?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetBadgeActivitySuccessResponse<T extends NumberType> {
  /**
   * Array of transfer activity information.
   */
  activity: iTransferActivityDoc<T>[];
  /**
   * Pagination information.
   */
  pagination: PaginationInfo;
}

export class GetBadgeActivitySuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBadgeActivitySuccessResponse<T>>
  implements iGetBadgeActivitySuccessResponse<T>
{
  activity: TransferActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetBadgeActivitySuccessResponse<T>) {
    super();
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetBadgeActivitySuccessResponse<U> {
    return new GetBadgeActivitySuccessResponse(
      deepCopyPrimitives({
        activity: this.activity.map((activity) => activity.convert(convertFunction)),
        pagination: this.pagination
      })
    );
  }
}

/**
 * Defines the options for fetching metadata.
 *
 * @typedef {Object} MetadataFetchOptions
 * @property {boolean} [doNotFetchCollectionMetadata] - If true, collection metadata will not be fetched.
 * @property {NumberType[] | UintRange<NumberType>[]} [metadataIds] - If present, the metadata corresponding to the specified metadata IDs will be fetched. See documentation for how to determine metadata IDs.
 * @property {string[]} [uris] - If present, the metadata corresponding to the specified URIs will be fetched.
 * @property {NumberType[] | UintRange<NumberType>[]} [badgeIds] - If present, the metadata corresponding to the specified badge IDs will be fetched.
 *
 * @category API Requests / Responses
 */
export interface MetadataFetchOptions {
  /**
   * If true, collection metadata will not be fetched.
   */
  doNotFetchCollectionMetadata?: boolean;
  /**
   * If present, the metadata corresponding to the specified URIs will be fetched.
   */
  uris?: string[];
  /**
   * If present, the metadata corresponding to the specified badge IDs will be fetched.
   */
  badgeIds?: NumberType[] | iUintRange<NumberType>[];
}

/**
 * Supported view keys for fetching additional collection details.
 *
 * @category API Requests / Responses
 */
export type CollectionViewKey = 'transferActivity' | 'owners' | 'amountTrackers' | 'challengeTrackers' | 'listings';

/**
 * Defines the options for fetching additional collection details.
 *
 * A view is a way of fetching additional details about a collection, and these will be queryable in the response via the `views` property.
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 * If the bookmark is not supplied, the first page will be returned.
 *
 * We support the following views:
 * - `transferActivity` - Fetches the latest activity for the collection.
 * - `latestAnnouncements` - Fetches the latest announcements for the collection.
 * - `reviews` - Fetches the latest reviews for the collection.
 * - `owners` - Fetches the owners of the collection sequentially in random order.
 * - `merkleChallenges` - Fetches the merkle challenges for the collection in random order.
 * - `approvalTrackers` - Fetches the approvals trackers for the collection in random order.
 *
 * @typedef {Object} GetAdditionalCollectionDetailsBody
 * @property {{ viewType: string, bookmark: string }[]} [viewsToFetch] - If present, the specified views will be fetched.
 * @property {boolean} [fetchTotalBalances] - If true, the total and mint balances will be fetched.
 * @property {string[]} [challengeTrackersToFetch] - If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
 * @property {AmountTrackerIdDetails<NumberType>[]} [approvalTrackersToFetch] - If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
 * @category API Requests / Responses
 */
export interface GetAdditionalCollectionDetailsPayload {
  /**
   * If present, the specified views will be fetched.
   */
  viewsToFetch?: {
    /** The base view type to fetch. */
    viewType: CollectionViewKey;
    /** A unique view ID. This is used for pagination. All fetches w/ same ID should be made with same criteria. */
    viewId: string;
    /** A bookmark to pass in for pagination. "" for first request. */
    bookmark: string;
    /** If defined, we will return the oldest items first. */
    oldestFirst?: boolean;
    /** If specified, we will only fetch this users' activity. */
    address?: string;
    /** IF specified, we will filter to this abdge ID (only applicable to utiity listings view currently) */
    badgeId?: NumberType;
  }[];

  /**
   * If true, the total and mint balances will be fetched and will be put in owners[].
   *
   * collection.owners.find(x => x.bitbadgesAddresss === 'Mint')
   */
  fetchTotalBalances?: boolean;
  /**
   * If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
   */
  challengeTrackersToFetch?: iChallengeTrackerIdDetails<NumberType>[];
  /**
   * If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
   */
  approvalTrackersToFetch?: iAmountTrackerIdDetails<NumberType>[];
  /**
   * If true, we will append defaults with empty values.
   */
  handleAllAndAppendDefaults?: boolean;
  /**
   * Fetches private parameters for any claims in addition to public parameters.
   */
  fetchPrivateParams?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface GetMetadataForCollectionPayload {
  /**
   * If present, we will fetch the metadata corresponding to the specified options.
   *
   * Consider using pruneMetadataToFetch for filtering out previously fetched metadata.
   */
  metadataToFetch?: MetadataFetchOptions;
}

/**
 * @category Interfaces
 */
export type GetCollectionRequestBody = GetAdditionalCollectionDetailsPayload & GetMetadataForCollectionPayload & { collectionId: NumberType };

/**
 * @category API Requests / Responses
 */
export interface RefreshMetadataPayload {}

/**
 * @category API Requests / Responses
 */
export interface iRefreshMetadataSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export class RefreshMetadataSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface RefreshStatusPayload {}

/**
 * @category API Requests / Responses
 */
export interface iRefreshStatusSuccessResponse<T extends NumberType> {
  /**
   * Boolean indicating if the collection is currently in the queue.
   */
  inQueue: boolean;
  /**
   * Array of error documents corresponding to the collection.
   */
  errorDocs: iQueueDoc<T>[];
  /**
   * The status information corresponding to the collection.
   */
  refreshDoc: iRefreshDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class RefreshStatusSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<RefreshStatusSuccessResponse<T>>
  implements iRefreshStatusSuccessResponse<T>
{
  inQueue: boolean;
  errorDocs: QueueDoc<T>[];
  refreshDoc: RefreshDoc<T>;

  constructor(data: iRefreshStatusSuccessResponse<T>) {
    super();
    this.inQueue = data.inQueue;
    this.errorDocs = data.errorDocs.map((errorDoc) => new QueueDoc(errorDoc));
    this.refreshDoc = new RefreshDoc(data.refreshDoc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): RefreshStatusSuccessResponse<U> {
    return new RefreshStatusSuccessResponse(
      deepCopyPrimitives({
        inQueue: this.inQueue,
        errorDocs: this.errorDocs.map((errorDoc) => errorDoc.convert(convertFunction)),
        refreshDoc: this.refreshDoc.convert(convertFunction)
      })
    );
  }
}
