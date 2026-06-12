import { BaseNumberTypeClass, ConvertOptions, CustomTypeClass, deepCopyPrimitives, ParsedQs } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { PaginationInfo } from '../base.js';
import { CollectionIndexDoc } from '../docs-types/docs.js';
import type { iCollectionIndexDoc } from '../docs-types/interfaces.js';

/** A single facet bucket: a distinct value present in the full filtered set + its count. */
export interface iCollectionIndexFacet {
  value: string;
  count: number;
}

/** Facet options for the active query — computed server-side over the FULL match set. */
export interface iCollectionIndexFacets {
  statuses: iCollectionIndexFacet[];
  denoms: iCollectionIndexFacet[];
  tags: iCollectionIndexFacet[];
}

/**
 * Server-side query over the CollectionIndex. ALL filtering/sorting/searching/
 * faceting/pagination happens in the indexer over the indexed docs — the client
 * sends this and renders the page. Standard-agnostic: scope to one `standard`
 * (the dashboard case — pay, prediction markets, auctions, …) or omit it for a
 * cross-standard query.
 *
 * @category API Requests / Responses
 */
export interface iGetCollectionIndexPayload {
  /** Creator bech32 address. Required for per-creator dashboards; omit for global browse. */
  createdBy?: string;
  /** Standard to scope to (e.g. 'PaymentRequest', 'Prediction Market'). Omit for cross-standard. */
  standard?: string;
  /** Status keys to include (OR). Clock-only statuses (e.g. 'expired') are resolved at query time. */
  status?: string[];
  /** Denoms to include (OR). */
  denom?: string[];
  /** Tags to include (ANY match). */
  tags?: string[];
  /** Case-insensitive name search. */
  name?: string;
  /** Inclusive headline-amount lower bound (pair with a single denom to be meaningful). */
  amountMin?: number;
  /** Inclusive headline-amount upper bound. */
  amountMax?: number;
  /** Sort key. Default 'date'. */
  sortBy?: 'date' | 'amount';
  /** Sort direction. Default 'desc'. */
  sortDir?: 'asc' | 'desc';
  /** Pagination bookmark ("" / omitted for first page). */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionIndexPayload extends CustomTypeClass<GetCollectionIndexPayload> implements iGetCollectionIndexPayload {
  createdBy?: string;
  standard?: string;
  status?: string[];
  denom?: string[];
  tags?: string[];
  name?: string;
  amountMin?: number;
  amountMax?: number;
  sortBy?: 'date' | 'amount';
  sortDir?: 'asc' | 'desc';
  bookmark?: string;

  constructor(payload: iGetCollectionIndexPayload) {
    super();
    this.createdBy = payload.createdBy;
    this.standard = payload.standard;
    this.status = payload.status;
    this.denom = payload.denom;
    this.tags = payload.tags;
    this.name = payload.name;
    this.amountMin = payload.amountMin;
    this.amountMax = payload.amountMax;
    this.sortBy = payload.sortBy;
    this.sortDir = payload.sortDir;
    this.bookmark = payload.bookmark;
  }

  static FromQuery(query: ParsedQs): GetCollectionIndexPayload {
    const csv = (v: ParsedQs[string]): string[] | undefined => {
      if (Array.isArray(v)) return v.map((x) => x.toString());
      if (typeof v === 'string') return v.split(',').filter(Boolean);
      return undefined;
    };
    return new GetCollectionIndexPayload({
      createdBy: query.createdBy?.toString(),
      standard: query.standard?.toString(),
      status: csv(query.status),
      denom: csv(query.denom),
      tags: csv(query.tags),
      name: query.name?.toString(),
      amountMin: query.amountMin !== undefined ? Number(query.amountMin) : undefined,
      amountMax: query.amountMax !== undefined ? Number(query.amountMax) : undefined,
      sortBy: query.sortBy === 'amount' ? 'amount' : query.sortBy === 'date' ? 'date' : undefined,
      sortDir: query.sortDir === 'asc' ? 'asc' : query.sortDir === 'desc' ? 'desc' : undefined,
      bookmark: query.bookmark?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionIndexSuccessResponse<T extends NumberType> {
  collections: iCollectionIndexDoc<T>[];
  pagination: PaginationInfo;
  /** The total number of docs matching the filter (across all pages). */
  totalMatching: number;
  facets: iCollectionIndexFacets;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionIndexSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionIndexSuccessResponse<T>>
  implements iGetCollectionIndexSuccessResponse<T>
{
  collections: CollectionIndexDoc<T>[];
  pagination: PaginationInfo;
  totalMatching: number;
  facets: iCollectionIndexFacets;

  constructor(data: iGetCollectionIndexSuccessResponse<T>) {
    super();
    this.collections = data.collections.map((c) => new CollectionIndexDoc(c));
    this.pagination = data.pagination;
    this.totalMatching = data.totalMatching;
    this.facets = data.facets;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetCollectionIndexSuccessResponse<U> {
    return new GetCollectionIndexSuccessResponse(
      deepCopyPrimitives({
        collections: this.collections.map((c) => c.convert(convertFunction, options)),
        pagination: this.pagination,
        totalMatching: this.totalMatching,
        facets: this.facets
      })
    );
  }
}
