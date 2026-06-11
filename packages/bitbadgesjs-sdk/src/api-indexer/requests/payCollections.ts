import { BaseNumberTypeClass, ConvertOptions, CustomTypeClass, deepCopyPrimitives, ParsedQs } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { CosmosCoin } from '@/core/coin.js';
import type { iCosmosCoin } from '@/core/coin.js';
import type { PaginationInfo } from '../base.js';
import { PayIndexDoc } from '../docs-types/docs.js';
import type { iPayIndexDoc } from '../docs-types/interfaces.js';

/** A single facet bucket: a distinct value present in the full filtered set + its count. */
export interface iPayFacet {
  value: string;
  count: number;
}

/** Facet options for the active query — computed server-side over the FULL match set. */
export interface iPayFacets {
  statuses: iPayFacet[];
  denoms: iPayFacet[];
  tags: iPayFacet[];
}

/** Pay standards backing the dashboard. */
export type PayStandard = 'PaymentRequest' | 'Subscriptions' | 'Products' | 'Vault';

/**
 * Server-side query for a merchant's pay collections of one standard. ALL
 * filtering/sorting/searching/faceting/pagination happens in the indexer over
 * the indexed PayIndex docs — the client sends this and renders the page.
 *
 * @category API Requests / Responses
 */
export interface iGetPayCollectionsPayload {
  /** Merchant/creator bech32 address (required — dashboard is per-merchant). */
  createdBy: string;
  /** Pay standard to scope to. Omit for cross-standard (overview) queries. */
  standard?: PayStandard;
  /** Status keys to include (OR). 'expired' is resolved at query time from expiry. */
  status?: string[];
  /** Denoms to include (OR). */
  denom?: string[];
  /** Tags to include (ANY match). */
  tags?: string[];
  /** Case-insensitive name/tag search. */
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
export class GetPayCollectionsPayload extends CustomTypeClass<GetPayCollectionsPayload> implements iGetPayCollectionsPayload {
  createdBy: string;
  standard?: PayStandard;
  status?: string[];
  denom?: string[];
  tags?: string[];
  name?: string;
  amountMin?: number;
  amountMax?: number;
  sortBy?: 'date' | 'amount';
  sortDir?: 'asc' | 'desc';
  bookmark?: string;

  constructor(payload: iGetPayCollectionsPayload) {
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

  static FromQuery(query: ParsedQs): GetPayCollectionsPayload {
    const csv = (v: ParsedQs[string]): string[] | undefined => {
      if (Array.isArray(v)) return v.map((x) => x.toString());
      if (typeof v === 'string') return v.split(',').filter(Boolean);
      return undefined;
    };
    return new GetPayCollectionsPayload({
      createdBy: query.createdBy?.toString() ?? '',
      standard: query.standard?.toString() as PayStandard | undefined,
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
export interface iGetPayCollectionsSuccessResponse<T extends NumberType> {
  collections: iPayIndexDoc<T>[];
  pagination: PaginationInfo;
  /** The total number of docs matching the filter (across all pages). */
  totalMatching: number;
  facets: iPayFacets;
}

/**
 * @category API Requests / Responses
 */
export class GetPayCollectionsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetPayCollectionsSuccessResponse<T>>
  implements iGetPayCollectionsSuccessResponse<T>
{
  collections: PayIndexDoc<T>[];
  pagination: PaginationInfo;
  totalMatching: number;
  facets: iPayFacets;

  constructor(data: iGetPayCollectionsSuccessResponse<T>) {
    super();
    this.collections = data.collections.map((c) => new PayIndexDoc(c));
    this.pagination = data.pagination;
    this.totalMatching = data.totalMatching;
    this.facets = data.facets;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetPayCollectionsSuccessResponse<U> {
    return new GetPayCollectionsSuccessResponse(
      deepCopyPrimitives({
        collections: this.collections.map((c) => c.convert(convertFunction, options)),
        pagination: this.pagination,
        totalMatching: this.totalMatching,
        facets: this.facets
      })
    );
  }
}

/** Per-standard headline KPIs for the cross-standard overview. */
export interface iPayOwnerKpis<T extends NumberType> {
  /** Overview total = invoiceRevenue + productRevenue (summed per denom). */
  revenue: iCosmosCoin<T>[];
  /** Paid invoices only (for the invoices stat card). */
  invoiceRevenue: iCosmosCoin<T>[];
  /** Product sales only (for the products stat card). */
  productRevenue: iCosmosCoin<T>[];
  outstanding: iCosmosCoin<T>[];
  mrr: iCosmosCoin<T>[];
  tvl: iCosmosCoin<T>[];
}

/** Aggregate numeric totals for the per-standard stat cards (server-computed). */
export interface iPayOwnerTotals {
  activeSubscribers: number;
  products: number;
  unitsSold: number;
  depositors: number;
}

/**
 * @category API Requests / Responses
 */
export interface iGetPayOwnerStatsPayload {}

/**
 * Cross-standard overview for a merchant — counts per standard + aggregate KPIs,
 * all computed server-side (no client summing of loaded pages).
 *
 * @category API Requests / Responses
 */
export interface iGetPayOwnerStatsSuccessResponse<T extends NumberType> {
  /** Per-standard total counts, keyed by dashboard object key (invoices/subscriptions/products/vaults). */
  counts: Record<string, number>;
  kpis: iPayOwnerKpis<T>;
  totals: iPayOwnerTotals;
}

/**
 * @category API Requests / Responses
 */
export class GetPayOwnerStatsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetPayOwnerStatsSuccessResponse<T>>
  implements iGetPayOwnerStatsSuccessResponse<T>
{
  counts: Record<string, number>;
  kpis: {
    revenue: CosmosCoin<T>[];
    invoiceRevenue: CosmosCoin<T>[];
    productRevenue: CosmosCoin<T>[];
    outstanding: CosmosCoin<T>[];
    mrr: CosmosCoin<T>[];
    tvl: CosmosCoin<T>[];
  };
  totals: iPayOwnerTotals;

  constructor(data: iGetPayOwnerStatsSuccessResponse<T>) {
    super();
    this.counts = data.counts;
    this.kpis = {
      revenue: data.kpis.revenue.map((c) => new CosmosCoin(c)),
      invoiceRevenue: data.kpis.invoiceRevenue.map((c) => new CosmosCoin(c)),
      productRevenue: data.kpis.productRevenue.map((c) => new CosmosCoin(c)),
      outstanding: data.kpis.outstanding.map((c) => new CosmosCoin(c)),
      mrr: data.kpis.mrr.map((c) => new CosmosCoin(c)),
      tvl: data.kpis.tvl.map((c) => new CosmosCoin(c))
    };
    this.totals = data.totals;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetPayOwnerStatsSuccessResponse<U> {
    return new GetPayOwnerStatsSuccessResponse(
      deepCopyPrimitives({
        counts: this.counts,
        kpis: {
          revenue: this.kpis.revenue.map((c) => c.convert(convertFunction)),
          invoiceRevenue: this.kpis.invoiceRevenue.map((c) => c.convert(convertFunction)),
          productRevenue: this.kpis.productRevenue.map((c) => c.convert(convertFunction)),
          outstanding: this.kpis.outstanding.map((c) => c.convert(convertFunction)),
          mrr: this.kpis.mrr.map((c) => c.convert(convertFunction)),
          tvl: this.kpis.tvl.map((c) => c.convert(convertFunction))
        },
        totals: this.totals
      })
    );
  }
}
