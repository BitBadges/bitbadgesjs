import type { NumberType } from '@/common/string-numbers';
import type { iBitBadgesCollection } from '../BitBadgesCollection';
import { BitBadgesCollection } from '../BitBadgesCollection';
import type { iAmountTrackerIdDetails, iUintRange } from '@/interfaces/badges/core';
import type { PaginationInfo } from '../base';
import { EmptyResponseClass } from '../base';
import { UintRangeArray } from '@/core/uintRanges';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, deepCopyPrimitives } from '@/common/base';
import { BalanceDocWithDetails, QueueDoc, RefreshDoc } from '../docs/docs';
import { TransferActivityDoc } from '../docs/activity';
import type { iBalanceDocWithDetails, iChallengeTrackerIdDetails, iQueueDoc, iRefreshDoc, iTransferActivityDoc } from '../docs/interfaces';

/**
 * @category API Requests / Responses
 */
export interface FilterBadgesInCollectionRequestBody {
  /** The collection ID to filter */
  collectionId: NumberType;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): FilterBadgesInCollectionSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as FilterBadgesInCollectionSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetOwnersForBadgeRouteRequestBody {
  /**
   * The pagination bookmark for where to start the request. Bookmarks are obtained via the previous response. "" for first request.
   */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetOwnersForBadgeRouteSuccessResponse<T extends NumberType> {
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
export class GetOwnersForBadgeRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetOwnersForBadgeRouteSuccessResponse<T>>
  implements iGetOwnersForBadgeRouteSuccessResponse<T>
{
  owners: BalanceDocWithDetails<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetOwnersForBadgeRouteSuccessResponse<T>) {
    super();
    this.owners = data.owners.map((balance) => new BalanceDocWithDetails(balance));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetOwnersForBadgeRouteSuccessResponse<U> {
    return new GetOwnersForBadgeRouteSuccessResponse(
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
export interface GetBadgeBalanceByAddressRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetBadgeBalanceByAddressRouteSuccessResponse<T extends NumberType> extends iBalanceDocWithDetails<T> {}

export class GetBadgeBalanceByAddressRouteSuccessResponse<T extends NumberType> extends BalanceDocWithDetails<T> {}

/**
 * @category API Requests / Responses
 */
export interface GetBadgeActivityRouteRequestBody {
  /**
   * An optional bookmark for pagination. Bookmarks are obtained via the previous response. "" for first request.
   */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetBadgeActivityRouteSuccessResponse<T extends NumberType> {
  /**
   * Array of transfer activity information.
   */
  activity: iTransferActivityDoc<T>[];
  /**
   * Pagination information.
   */
  pagination: PaginationInfo;
}

export class GetBadgeActivityRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBadgeActivityRouteSuccessResponse<T>>
  implements iGetBadgeActivityRouteSuccessResponse<T>
{
  activity: TransferActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetBadgeActivityRouteSuccessResponse<T>) {
    super();
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetBadgeActivityRouteSuccessResponse<U> {
    return new GetBadgeActivityRouteSuccessResponse(
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
   * If present, the metadata corresponding to the specified metadata IDs will be fetched.
   * Metadata IDs are helpful when determining UNQIUE URIs to be fetched.
   *
   * If badges 1-10000 all share the same URI, they will have the same single metadata ID.
   * If badge 1 has a different URI than badges 2-10000, badge 1 will have a different metadata ID than the rest/
   *
   * We scan in increasing order of badge IDs, so metadata ID 1 will be for badge 1-X, metadata ID 2 will be for badge X+1-Y, etc.
   *
   * ID 0 = Collection metadata fetch
   * ID 1 = First badge metadata fetch
   * ID 2 = Second badge metadata fetch (if present)
   * And so on
   * Learn more in documentation.
   */
  metadataIds?: NumberType[] | iUintRange<NumberType>[];
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
export type CollectionViewKey = 'transferActivity' | 'reviews' | 'owners' | 'amountTrackers' | 'challengeTrackers';

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
 * @typedef {Object} GetAdditionalCollectionDetailsRequestBody
 * @property {{ viewType: string, bookmark: string }[]} [viewsToFetch] - If present, the specified views will be fetched.
 * @property {boolean} [fetchTotalAndMintBalances] - If true, the total and mint balances will be fetched.
 * @property {string[]} [challengeTrackersToFetch] - If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
 * @property {AmountTrackerIdDetails<NumberType>[]} [approvalTrackersToFetch] - If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
 * @category API Requests / Responses
 */
export interface GetAdditionalCollectionDetailsRequestBody {
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
  }[];

  /**
   * If true, the total and mint balances will be fetched and will be put in owners[].
   *
   * collection.owners.find(x => x.cosmosAddresss === 'Mint')
   */
  fetchTotalAndMintBalances?: boolean;
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
export interface GetMetadataForCollectionRequestBody {
  /**
   * If present, we will fetch the metadata corresponding to the specified options.
   *
   * Consider using pruneMetadataToFetch for filtering out previously fetched metadata.
   */
  metadataToFetch?: MetadataFetchOptions;
}

/**
 * @category API Requests / Responses
 */
export interface GetCollectionsRouteRequestBody {
  collectionsToFetch: ({
    /**
     * The ID of the collection to fetch.
     */
    collectionId: NumberType;
  } & GetMetadataForCollectionRequestBody &
    GetAdditionalCollectionDetailsRequestBody)[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionsRouteSuccessResponse<T extends NumberType> {
  collections: iBitBadgesCollection<T>[];
}

export class GetCollectionsRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionsRouteSuccessResponse<T>>
  implements iGetCollectionsRouteSuccessResponse<T>
{
  collections: BitBadgesCollection<T>[];

  constructor(data: iGetCollectionsRouteSuccessResponse<T>) {
    super();
    this.collections = data.collections.map((collection) => new BitBadgesCollection(collection));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetCollectionsRouteSuccessResponse<U> {
    return new GetCollectionsRouteSuccessResponse(
      deepCopyPrimitives({
        collections: this.collections.map((collection) => collection.convert(convertFunction))
      })
    );
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetCollectionByIdRouteRequestBody extends GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionByIdRouteSuccessResponse<T extends NumberType> {
  collection: iBitBadgesCollection<T>;
}

export class GetCollectionByIdRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionByIdRouteSuccessResponse<T>>
  implements iGetCollectionByIdRouteSuccessResponse<T>
{
  collection: BitBadgesCollection<T>;

  constructor(data: iGetCollectionByIdRouteSuccessResponse<T>) {
    super();
    this.collection = new BitBadgesCollection(data.collection);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetCollectionByIdRouteSuccessResponse<U> {
    return new GetCollectionByIdRouteSuccessResponse(
      deepCopyPrimitives({
        collection: this.collection.convert(convertFunction)
      })
    );
  }
}

/**
 * @category API Requests / Responses
 */
export interface RefreshMetadataRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iRefreshMetadataRouteSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export class RefreshMetadataRouteSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface RefreshStatusRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iRefreshStatusRouteSuccessResponse<T extends NumberType> {
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
export class RefreshStatusRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<RefreshStatusRouteSuccessResponse<T>>
  implements iRefreshStatusRouteSuccessResponse<T>
{
  inQueue: boolean;
  errorDocs: QueueDoc<T>[];
  refreshDoc: RefreshDoc<T>;

  constructor(data: iRefreshStatusRouteSuccessResponse<T>) {
    super();
    this.inQueue = data.inQueue;
    this.errorDocs = data.errorDocs.map((errorDoc) => new QueueDoc(errorDoc));
    this.refreshDoc = new RefreshDoc(data.refreshDoc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): RefreshStatusRouteSuccessResponse<U> {
    return new RefreshStatusRouteSuccessResponse(
      deepCopyPrimitives({
        inQueue: this.inQueue,
        errorDocs: this.errorDocs.map((errorDoc) => errorDoc.convert(convertFunction)),
        refreshDoc: this.refreshDoc.convert(convertFunction)
      })
    );
  }
}
