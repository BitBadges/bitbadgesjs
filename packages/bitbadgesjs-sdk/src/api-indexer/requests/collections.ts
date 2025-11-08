import {
  BaseNumberTypeClass,
  convertClassPropertiesAndMaintainNumberTypes,
  ConvertOptions,
  CustomTypeClass,
  deepCopyPrimitives,
  ParsedQs
} from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { UintRangeArray } from '@/core/uintRanges.js';
import type { CollectionId, iAmountTrackerIdDetails, iUintRange } from '@/interfaces/types/core.js';
import type { PaginationInfo } from '../base.js';
import { EmptyResponseClass } from '../base.js';
import { TransferActivityDoc } from '../docs-types/activity.js';
import { BalanceDocWithDetails, QueueDoc, RefreshDoc } from '../docs-types/docs.js';
import type { iBalanceDocWithDetails, iChallengeTrackerIdDetails, iQueueDoc, iRefreshDoc, iTransferActivityDoc } from '../docs-types/interfaces.js';

/**
 * @category API Requests / Responses
 */
export interface iFilterSuggestionsPayload {}

/**
 * @category API Requests / Responses
 */
export interface iFilterSuggestionsSuccessResponse {
  attributes: {
    name: string;
    value: string | number | boolean;
    count: number;
    type: string;
    floorPrice?: { amount: NumberType; denom: string };
  }[];
}

/**
 * @category API Requests / Responses
 */
export class FilterSuggestionsSuccessResponse
  extends BaseNumberTypeClass<FilterSuggestionsSuccessResponse>
  implements iFilterSuggestionsSuccessResponse
{
  attributes: { name: string; value: string | number | boolean; count: number; type: string; floorPrice?: { amount: NumberType; denom: string } }[];

  constructor(data: iFilterSuggestionsSuccessResponse) {
    super();
    this.attributes = data.attributes;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iFilterTokensInCollectionPayload {
  /** Limit to specific token IDs. Leave undefined to not filter by token ID. */
  tokenIds?: iUintRange<NumberType>[];
  /** Limit to specific lists. Leave undefined to not filter by list. */
  categories?: string[];
  /** Limit to specific lists. Leave undefined to not filter by list. */
  tags?: string[];

  /** mostViewed is a special view that sorts by most viewed tokens. May be incompatible with other filters. */
  mostViewed?: 'daily' | 'allTime' | 'weekly' | 'monthly' | 'yearly';
  /** Pagination bookmark. Leave undefined or "" for first request. */
  bookmark?: string;

  /** Attribute queries */
  attributes?: {
    name: string;
    value: string | number | boolean;
  }[];

  /** The listing prices */
  priceRange?: iUintRange<NumberType>;
  /** Denom for the price range. Defaults to ubadge. */
  denom?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iFilterTokensInCollectionSuccessResponse<T extends NumberType> {
  tokenIds: iUintRange<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class FilterTokensInCollectionSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<FilterTokensInCollectionSuccessResponse<T>>
  implements iFilterTokensInCollectionSuccessResponse<T>
{
  tokenIds: UintRangeArray<T>;
  pagination: PaginationInfo;

  constructor(data: iFilterTokensInCollectionSuccessResponse<T>) {
    super();
    this.tokenIds = UintRangeArray.From(data.tokenIds);
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): FilterTokensInCollectionSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as FilterTokensInCollectionSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetOwnersPayload {
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
export class GetOwnersPayload extends CustomTypeClass<GetOwnersPayload> implements iGetOwnersPayload {
  bookmark?: string;
  sortBy?: 'amount';

  constructor(payload: iGetOwnersPayload) {
    super();
    this.bookmark = payload.bookmark;
    this.sortBy = payload.sortBy;
  }

  static FromQuery(query: ParsedQs): GetOwnersPayload {
    return new GetOwnersPayload({
      bookmark: query.bookmark?.toString(),
      sortBy: query.sortBy === 'amount' ? 'amount' : undefined
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetOwnersSuccessResponse<T extends NumberType> {
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
export class GetOwnersSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetOwnersSuccessResponse<T>>
  implements iGetOwnersSuccessResponse<T>
{
  owners: BalanceDocWithDetails<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetOwnersSuccessResponse<T>) {
    super();
    this.owners = data.owners.map((balance) => new BalanceDocWithDetails(balance));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetOwnersSuccessResponse<U> {
    return new GetOwnersSuccessResponse(
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
export interface iGetBalanceByAddressSpecificTokenPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetBalanceByAddressSpecificTokenSuccessResponse<T extends NumberType> {
  balance: T;
}

/**
 * @category API Requests / Responses
 */
export class GetBalanceByAddressSpecificTokenSuccessResponse<T extends NumberType> extends BaseNumberTypeClass<
  GetBalanceByAddressSpecificTokenSuccessResponse<T>
> {
  balance: T;

  constructor(data: iGetBalanceByAddressSpecificTokenSuccessResponse<T>) {
    super();
    this.balance = data.balance;
  }

  getNumberFieldNames(): string[] {
    return ['balance'];
  }

  convert<U extends NumberType>(
    convertFunction: (item: NumberType) => U,
    options?: ConvertOptions
  ): GetBalanceByAddressSpecificTokenSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetBalanceByAddressSpecificTokenSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetBalanceByAddressPayload {
  /**
   * If true, we will fetch private parameters for any claims / approvals. Must be creator.
   *
   * This is only applicable to incoming / outgoing approvals with claims.
   */
  fetchPrivateParams?: boolean;

  /**
   * If true, we will forcefully fetch the balance even if it is already cached. Only applicable to non-indexed / on-demand collections.
   */
  forceful?: boolean;
}

/**
 * @category API Requests / Responses
 */
export class GetBalanceByAddressPayload extends CustomTypeClass<GetBalanceByAddressPayload> implements iGetBalanceByAddressPayload {
  fetchPrivateParams?: boolean;
  forceful?: boolean;

  constructor(payload: iGetBalanceByAddressPayload) {
    super();
    this.fetchPrivateParams = payload.fetchPrivateParams;
    this.forceful = payload.forceful;
  }

  static FromQuery(query: ParsedQs): GetBalanceByAddressPayload {
    return new GetBalanceByAddressPayload({
      fetchPrivateParams: query.fetchPrivateParams === 'true',
      forceful: query.forceful === 'true'
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetBalanceByAddressSuccessResponse<T extends NumberType> extends iBalanceDocWithDetails<T> {}

export class GetBalanceByAddressSuccessResponse<T extends NumberType> extends BalanceDocWithDetails<T> {}

/**
 * @category API Requests / Responses
 */
export interface iGetTokenActivityPayload {
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
export class GetTokenActivityPayload extends CustomTypeClass<GetTokenActivityPayload> implements iGetTokenActivityPayload {
  bookmark?: string;
  bitbadgesAddress?: string;

  constructor(payload: iGetTokenActivityPayload) {
    super();
    this.bookmark = payload.bookmark;
    this.bitbadgesAddress = payload.bitbadgesAddress;
  }

  static FromQuery(query: ParsedQs): GetTokenActivityPayload {
    return new GetTokenActivityPayload({
      bookmark: query.bookmark?.toString(),
      bitbadgesAddress: query.bitbadgesAddress?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetTokenActivitySuccessResponse<T extends NumberType> {
  /**
   * Array of transfer activity information.
   */
  activity: iTransferActivityDoc<T>[];
  /**
   * Pagination information.
   */
  pagination: PaginationInfo;
}

export class GetTokenActivitySuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetTokenActivitySuccessResponse<T>>
  implements iGetTokenActivitySuccessResponse<T>
{
  activity: TransferActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetTokenActivitySuccessResponse<T>) {
    super();
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetTokenActivitySuccessResponse<U> {
    return new GetTokenActivitySuccessResponse(
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
 * @property {NumberType[] | UintRange<NumberType>[]} [tokenIds] - If present, the metadata corresponding to the specified token IDs will be fetched.
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
   * If present, the metadata corresponding to the specified token IDs will be fetched.
   */
  tokenIds?: NumberType[] | iUintRange<NumberType>[];
}

/**
 * Supported view keys for fetching additional collection details.
 *
 * @category API Requests / Responses
 */
export type CollectionViewKey = 'transferActivity' | 'owners' | 'amountTrackers' | 'challengeTrackers' | 'listings' | 'tokenFloorPrices';

/**
 * Defines the options for fetching additional collection details.
 *
 * A view is a way of fetching additional details about a collection, and these will be queryable in the response via the `views` property.
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 * If the bookmark is not supplied, the first page will be returned.
 *
 * @typedef {Object} GetAdditionalCollectionDetailsBody
 * @property {{ viewType: string, bookmark: string }[]} [viewsToFetch] - If present, the specified views will be fetched.
 * @property {boolean} [fetchTotalBalances] - If true, the total and mint balances will be fetched.
 * @property {string[]} [challengeTrackersToFetch] - If present, the merkle challenge trackers corresponding to the specified merkle challenge IDs will be fetched.
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
    tokenId?: NumberType;
  }[];

  /**
   * If true, the total and mint balances will be fetched and will be put in owners[].
   *
   * collection.owners.find(x => x.bitbadgesAddresss === 'Mint')
   */
  fetchTotalBalances?: boolean;
  /**
   * If present, the merkle challenge trackers corresponding to the specified merkle challenge IDs will be fetched.
   */
  challengeTrackersToFetch?: iChallengeTrackerIdDetails<NumberType>[];
  /**
   * Disable appending default approvals.
   */
  disableDefaults?: boolean;
  /**
   * If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
   */
  approvalTrackersToFetch?: iAmountTrackerIdDetails<NumberType>[];
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

  /**
   * If present, we will fetch the floor price for the specified token IDs.
   */
  tokenFloorPricesToFetch?: NumberType[] | iUintRange<NumberType>[];
}

/**
 * @category Interfaces
 */
export type GetCollectionRequestBody = GetAdditionalCollectionDetailsPayload & GetMetadataForCollectionPayload & { collectionId: CollectionId };

/**
 * @category API Requests / Responses
 */
export interface iRefreshMetadataPayload {}

/**
 * @category API Requests / Responses
 */
export class RefreshMetadataPayload extends EmptyResponseClass {}

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
export interface iRefreshStatusPayload {}

/**
 * @category API Requests / Responses
 */
export class RefreshStatusPayload extends EmptyResponseClass {}

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
