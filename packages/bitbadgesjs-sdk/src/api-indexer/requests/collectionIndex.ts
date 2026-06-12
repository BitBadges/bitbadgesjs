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
}

/**
 * Server-side query over the CollectionIndex. ALL filtering/searching/faceting/
 * pagination happens in the indexer over the indexed docs — the client sends this
 * and renders the page. Results are ordered newest-first. Standard-agnostic: scope
 * to one `standard` (the dashboard case — pay, prediction markets, auctions, …) or
 * omit it for a cross-standard query.
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
  /** Case-insensitive name search. */
  name?: string;
  /** Exact-match payer address (e.g. invoices where the connected user is the payer → "sending"). */
  payerAddress?: string;
  /** Exact-match recipient address (e.g. invoices where the connected user is the recipient → "receiving"). */
  recipientAddress?: string;
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
  name?: string;
  payerAddress?: string;
  recipientAddress?: string;
  bookmark?: string;

  constructor(payload: iGetCollectionIndexPayload) {
    super();
    this.createdBy = payload.createdBy;
    this.standard = payload.standard;
    this.status = payload.status;
    this.name = payload.name;
    this.payerAddress = payload.payerAddress;
    this.recipientAddress = payload.recipientAddress;
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
      name: query.name?.toString(),
      payerAddress: query.payerAddress?.toString(),
      recipientAddress: query.recipientAddress?.toString(),
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
