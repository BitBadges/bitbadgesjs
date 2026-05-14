import { BigIntify, NumberType } from '@/common/string-numbers.js';
import { CosmosCoin, iCosmosCoin } from '@/core/coin.js';
import { Pool, PoolAsset, PoolParams } from './classes.js';
import type { iSwapAmountInRoute, iSwapAmountOutRoute } from './tx/interfaces.js';

/**
 * Pagination request for chain LCD queries (Cosmos SDK convention).
 *
 * @category GAMM
 */
export interface iChainPageRequest {
  key?: string;
  offset?: NumberType;
  limit?: NumberType;
  countTotal?: boolean;
  reverse?: boolean;
}

/**
 * Pagination response from chain LCD queries (Cosmos SDK convention).
 *
 * @category GAMM
 */
export interface iChainPageResponse {
  nextKey?: string;
  total?: string;
}

/**
 * @category GAMM
 */
export interface iGammChainQueryClientOptions {
  /** The chain's LCD/REST gateway endpoint (e.g. `https://lcd.bitbadges.io`). Defaults to mainnet. */
  baseUrl?: string;
  /**
   * Optional fetch implementation. Defaults to global `fetch`. Useful for tests
   * or environments without a global `fetch`.
   */
  fetchFn?: typeof fetch;
}

/**
 * @category GAMM
 */
export interface iGetPoolPayload<T extends NumberType> {
  poolId: T;
}

/**
 * @category GAMM
 */
export interface iGetPoolsPayload {
  pagination?: iChainPageRequest;
}

/**
 * @category GAMM
 */
export interface iGetPoolsResponse<T extends NumberType> {
  pools: Pool<T>[];
  pagination: iChainPageResponse;
}

/**
 * @category GAMM
 */
export interface iGetTotalSharesPayload<T extends NumberType> {
  poolId: T;
}

/**
 * @category GAMM
 */
export interface iGetTotalSharesResponse<T extends NumberType> {
  totalShares: CosmosCoin<T>;
}

/**
 * @category GAMM
 */
export interface iGetTotalPoolLiquidityPayload<T extends NumberType> {
  poolId: T;
}

/**
 * @category GAMM
 */
export interface iGetTotalPoolLiquidityResponse<T extends NumberType> {
  liquidity: CosmosCoin<T>[];
}

/**
 * @category GAMM
 */
export interface iGetSpotPricePayload<T extends NumberType> {
  poolId: T;
  baseAssetDenom: string;
  quoteAssetDenom: string;
}

/**
 * @category GAMM
 */
export interface iGetSpotPriceResponse {
  spotPrice: string;
}

/**
 * @category GAMM
 */
export interface iGetTotalLiquidityResponse<T extends NumberType> {
  liquidity: CosmosCoin<T>[];
}

/**
 * @category GAMM
 */
export interface iCalcJoinPoolSharesPayload<T extends NumberType> {
  poolId: T;
  tokensIn: iCosmosCoin<T>[];
}

/**
 * @category GAMM
 */
export interface iCalcJoinPoolSharesResponse<T extends NumberType> {
  shareOutAmount: T;
  tokensOut: CosmosCoin<T>[];
}

/**
 * @category GAMM
 */
export interface iCalcExitPoolCoinsFromSharesPayload<T extends NumberType> {
  poolId: T;
  shareInAmount: T;
}

/**
 * @category GAMM
 */
export interface iCalcExitPoolCoinsFromSharesResponse<T extends NumberType> {
  tokensOut: CosmosCoin<T>[];
}

/**
 * @category GAMM
 */
export interface iCalcJoinPoolNoSwapSharesPayload<T extends NumberType> {
  poolId: T;
  tokensIn: iCosmosCoin<T>[];
}

/**
 * @category GAMM
 */
export interface iCalcJoinPoolNoSwapSharesResponse<T extends NumberType> {
  tokensOut: CosmosCoin<T>[];
  sharesOut: T;
}

/**
 * @category GAMM
 */
export interface iEstimateSwapExactAmountInPayload<T extends NumberType> {
  sender: string;
  poolId: T;
  /** Formatted Cosmos coin string, e.g. `"1000ubadge"`. */
  tokenIn: string;
  routes: iSwapAmountInRoute<T>[];
}

/**
 * @category GAMM
 */
export interface iEstimateSwapExactAmountInResponse<T extends NumberType> {
  tokenOutAmount: T;
}

/**
 * @category GAMM
 */
export interface iEstimateSwapExactAmountOutPayload<T extends NumberType> {
  sender: string;
  poolId: T;
  routes: iSwapAmountOutRoute<T>[];
  /** Formatted Cosmos coin string, e.g. `"1000ubadge"`. */
  tokenOut: string;
}

/**
 * @category GAMM
 */
export interface iEstimateSwapExactAmountOutResponse<T extends NumberType> {
  tokenInAmount: T;
}

// ============================================================================
// Helpers — snake_case ↔ camelCase recursive translation
// ============================================================================

const SNAKE_RE = /_([a-z0-9])/g;
const CAMEL_RE = /([A-Z])/g;

/** Convert a single string from snake_case to camelCase. Preserves leading/internal `@` (e.g. `@type`). */
export function snakeToCamelKey(key: string): string {
  if (key.startsWith('@')) return key;
  return key.replace(SNAKE_RE, (_, c: string) => c.toUpperCase());
}

/** Convert a single string from camelCase to snake_case. Preserves leading `@`. */
export function camelToSnakeKey(key: string): string {
  if (key.startsWith('@')) return key;
  return key.replace(CAMEL_RE, (_, c: string) => `_${c.toLowerCase()}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively convert all keys in an object/array tree from snake_case to camelCase.
 * Numeric string fields are preserved as strings (no parseInt/parseFloat).
 */
export function convertSnakeToCamel<T = any>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => convertSnakeToCamel(item)) as unknown as T;
  }
  if (isPlainObject(input)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      out[snakeToCamelKey(key)] = convertSnakeToCamel(value);
    }
    return out as T;
  }
  return input as T;
}

/**
 * Recursively convert all keys in an object/array tree from camelCase to snake_case.
 * Used at the wire boundary when serializing request bodies. Bigints are stringified.
 */
export function convertCamelToSnake<T = any>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => convertCamelToSnake(item)) as unknown as T;
  }
  if (isPlainObject(input)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      out[camelToSnakeKey(key)] = convertCamelToSnake(value);
    }
    return out as T;
  }
  if (typeof input === 'bigint') {
    return input.toString() as unknown as T;
  }
  return input as T;
}

/**
 * Stringify a NumberType for use in URL path/query segments.
 */
function numberToString(value: NumberType): string {
  if (typeof value === 'bigint') return value.toString();
  return String(value);
}

/**
 * Build a Cosmos SDK pagination query string from a camelCase pagination object.
 * Cosmos REST accepts `pagination.key`, `pagination.offset`, `pagination.limit`,
 * `pagination.count_total`, `pagination.reverse`.
 */
function appendPaginationParams(url: URL, pagination?: iChainPageRequest): void {
  if (!pagination) return;
  if (pagination.key !== undefined) url.searchParams.append('pagination.key', pagination.key);
  if (pagination.offset !== undefined) url.searchParams.append('pagination.offset', numberToString(pagination.offset));
  if (pagination.limit !== undefined) url.searchParams.append('pagination.limit', numberToString(pagination.limit));
  if (pagination.countTotal !== undefined) url.searchParams.append('pagination.count_total', String(pagination.countTotal));
  if (pagination.reverse !== undefined) url.searchParams.append('pagination.reverse', String(pagination.reverse));
}

const DEFAULT_BASE_URL = 'https://lcd.bitbadges.io';

/**
 * Typed query client for the BitBadges chain's GAMM module via its LCD REST gateway.
 *
 * Mirrors the proto-REST query surface (`/osmosis/gamm/v1beta1/...`) but exposes
 * camelCase params + responses to match the rest of the BitBadges SDK. Snake_case
 * translation happens at the wire boundary in {@link convertSnakeToCamel} /
 * {@link convertCamelToSnake}.
 *
 * The generic `T extends NumberType` controls the runtime type of numeric fields
 * in responses. Pass a `convertFunction` (e.g. `BigIntify`, `Stringify`, `Numberify`)
 * to the constructor or per-method to control conversion. Defaults to `BigIntify`.
 *
 * @example
 * ```ts
 * const client = new GammChainQueryClient({ baseUrl: 'https://lcd.bitbadges.io' });
 * const { pool } = await client.getPool({ poolId: 1n });
 * const { totalShares } = await client.getTotalShares({ poolId: 1n });
 * ```
 *
 * @category GAMM
 */
export class GammChainQueryClient<T extends NumberType = bigint> {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private convertFunction: (val: NumberType) => T;

  constructor(opts: iGammChainQueryClientOptions & { convertFunction?: (val: NumberType) => T } = {}) {
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.fetchFn = opts.fetchFn ?? (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (undefined as any));
    if (!this.fetchFn) {
      throw new Error('GammChainQueryClient: no fetch implementation available. Provide one via `fetchFn`.');
    }
    this.convertFunction = (opts.convertFunction ?? (BigIntify as unknown as (val: NumberType) => T));
  }

  /** Internal — perform a GET and return the camelCase-translated body. */
  private async get<R = any>(path: string, search?: (url: URL) => void): Promise<R> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (search) search(url);
    const res = await this.fetchFn(url.toString(), { method: 'GET' });
    if (!res.ok) {
      let body = '';
      try {
        body = await res.text();
      } catch {
        /* noop */
      }
      throw new Error(`GammChainQueryClient: GET ${url.pathname}${url.search} failed with ${res.status} ${res.statusText}: ${body}`);
    }
    const json = await res.json();
    return convertSnakeToCamel<R>(json);
  }

  // ==========================================================================
  // Helpers — typed response reconstruction
  // ==========================================================================

  private convertCoin(raw: { amount: string; denom: string }): CosmosCoin<T> {
    return new CosmosCoin<T>({
      amount: this.convertFunction(raw.amount),
      denom: raw.denom
    });
  }

  private convertCoins(raw: { amount: string; denom: string }[] | undefined): CosmosCoin<T>[] {
    return (raw ?? []).map((c) => this.convertCoin(c));
  }

  /**
   * Reconstruct a {@link Pool} from a camelCase-translated LCD `Any`-wrapped pool object.
   *
   * The LCD wraps gamm balancer pools as:
   * ```
   * { "@type": "/osmosis.gamm.v1beta1.Pool", "address": ..., "id": "1", "poolParams": {...}, "poolAssets": [...], "totalShares": {...}, "totalWeight": "..." }
   * ```
   * (after snake→camel translation).
   */
  private convertPool(raw: any): Pool<T> {
    const params = raw.poolParams ?? { swapFee: '0', exitFee: '0' };
    const totalShares = raw.totalShares
      ? this.convertCoin(raw.totalShares)
      : new CosmosCoin<T>({ amount: this.convertFunction(0), denom: '' });
    const poolAssets = (raw.poolAssets ?? []).map((a: any) =>
      new PoolAsset<T>({
        token: this.convertCoin(a.token),
        weight: this.convertFunction(a.weight ?? '0')
      })
    );
    return new Pool<T>({
      address: raw.address ?? '',
      id: this.convertFunction(raw.id ?? '0'),
      poolParams: new PoolParams<T>({
        swapFee: String(params.swapFee ?? '0'),
        exitFee: String(params.exitFee ?? '0')
      }),
      totalShares,
      poolAssets,
      totalWeight: this.convertFunction(raw.totalWeight ?? '0')
    });
  }

  // ==========================================================================
  // Queries
  // ==========================================================================

  /**
   * GET /osmosis/gamm/v1beta1/pools/{poolId}
   */
  async getPool(payload: iGetPoolPayload<NumberType>): Promise<{ pool: Pool<T> }> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ pool: any }>(`/osmosis/gamm/v1beta1/pools/${encodeURIComponent(poolId)}`);
    return { pool: this.convertPool(raw.pool) };
  }

  /**
   * GET /osmosis/gamm/v1beta1/pools
   */
  async getPools(payload: iGetPoolsPayload = {}): Promise<iGetPoolsResponse<T>> {
    const raw = await this.get<{ pools: any[]; pagination: iChainPageResponse }>(
      '/osmosis/gamm/v1beta1/pools',
      (url) => appendPaginationParams(url, payload.pagination)
    );
    return {
      pools: (raw.pools ?? []).map((p) => this.convertPool(p)),
      pagination: raw.pagination ?? {}
    };
  }

  /**
   * GET /osmosis/gamm/v1beta1/pools/{poolId}/total_shares
   */
  async getTotalShares(payload: iGetTotalSharesPayload<NumberType>): Promise<iGetTotalSharesResponse<T>> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ totalShares: { amount: string; denom: string } }>(
      `/osmosis/gamm/v1beta1/pools/${encodeURIComponent(poolId)}/total_shares`
    );
    return { totalShares: this.convertCoin(raw.totalShares) };
  }

  /**
   * GET /osmosis/gamm/v1beta1/pools/{poolId}/total_pool_liquidity
   */
  async getTotalPoolLiquidity(payload: iGetTotalPoolLiquidityPayload<NumberType>): Promise<iGetTotalPoolLiquidityResponse<T>> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ liquidity: { amount: string; denom: string }[] }>(
      `/osmosis/gamm/v1beta1/pools/${encodeURIComponent(poolId)}/total_pool_liquidity`
    );
    return { liquidity: this.convertCoins(raw.liquidity) };
  }

  /**
   * GET /osmosis/gamm/v1beta1/pools/{poolId}/prices?base_asset_denom=...&quote_asset_denom=...
   */
  async getSpotPrice(payload: iGetSpotPricePayload<NumberType>): Promise<iGetSpotPriceResponse> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ spotPrice: string }>(
      `/osmosis/gamm/v1beta1/pools/${encodeURIComponent(poolId)}/prices`,
      (url) => {
        url.searchParams.append('base_asset_denom', payload.baseAssetDenom);
        url.searchParams.append('quote_asset_denom', payload.quoteAssetDenom);
      }
    );
    return { spotPrice: String(raw.spotPrice ?? '') };
  }

  /**
   * GET /osmosis/gamm/v1beta1/total_liquidity
   */
  async getTotalLiquidity(): Promise<iGetTotalLiquidityResponse<T>> {
    const raw = await this.get<{ liquidity: { amount: string; denom: string }[] }>('/osmosis/gamm/v1beta1/total_liquidity');
    return { liquidity: this.convertCoins(raw.liquidity) };
  }

  /**
   * GET /osmosis/gamm/v1beta1/pools/{poolId}/join_swap_exact_in?tokens_in=...
   */
  async calcJoinPoolShares(payload: iCalcJoinPoolSharesPayload<NumberType>): Promise<iCalcJoinPoolSharesResponse<T>> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ shareOutAmount: string; tokensOut: { amount: string; denom: string }[] }>(
      `/osmosis/gamm/v1beta1/pools/${encodeURIComponent(poolId)}/join_swap_exact_in`,
      (url) => {
        for (const c of payload.tokensIn) {
          url.searchParams.append('tokens_in', `${numberToString(c.amount)}${c.denom}`);
        }
      }
    );
    return {
      shareOutAmount: this.convertFunction(raw.shareOutAmount ?? '0'),
      tokensOut: this.convertCoins(raw.tokensOut)
    };
  }

  /**
   * GET /osmosis/gamm/v1beta1/pools/{poolId}/exit_swap_share_amount_in?share_in_amount=...
   */
  async calcExitPoolCoinsFromShares(
    payload: iCalcExitPoolCoinsFromSharesPayload<NumberType>
  ): Promise<iCalcExitPoolCoinsFromSharesResponse<T>> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ tokensOut: { amount: string; denom: string }[] }>(
      `/osmosis/gamm/v1beta1/pools/${encodeURIComponent(poolId)}/exit_swap_share_amount_in`,
      (url) => {
        url.searchParams.append('share_in_amount', numberToString(payload.shareInAmount));
      }
    );
    return { tokensOut: this.convertCoins(raw.tokensOut) };
  }

  /**
   * Calc join-pool no-swap shares. The chain proto for this query has no HTTP
   * gateway annotation; we use the same path style as `calcJoinPoolShares` with
   * the trailing segment `join_pool_no_swap`. If your chain build does not
   * expose this route, the call will surface a 404 from {@link get}.
   */
  async calcJoinPoolNoSwapShares(payload: iCalcJoinPoolNoSwapSharesPayload<NumberType>): Promise<iCalcJoinPoolNoSwapSharesResponse<T>> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ tokensOut: { amount: string; denom: string }[]; sharesOut: string }>(
      `/osmosis/gamm/v1beta1/pools/${encodeURIComponent(poolId)}/join_pool_no_swap`,
      (url) => {
        for (const c of payload.tokensIn) {
          url.searchParams.append('tokens_in', `${numberToString(c.amount)}${c.denom}`);
        }
      }
    );
    return {
      tokensOut: this.convertCoins(raw.tokensOut),
      sharesOut: this.convertFunction(raw.sharesOut ?? '0')
    };
  }

  /**
   * GET /osmosis/gamm/v1beta1/{poolId}/estimate/swap_exact_amount_in
   */
  async estimateSwapExactAmountIn(
    payload: iEstimateSwapExactAmountInPayload<NumberType>
  ): Promise<iEstimateSwapExactAmountInResponse<T>> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ tokenOutAmount: string }>(
      `/osmosis/gamm/v1beta1/${encodeURIComponent(poolId)}/estimate/swap_exact_amount_in`,
      (url) => {
        url.searchParams.append('sender', payload.sender);
        url.searchParams.append('token_in', payload.tokenIn);
        for (const r of payload.routes) {
          // Cosmos REST encodes each route's fields as repeated query params.
          url.searchParams.append('routes.pool_id', numberToString(r.poolId));
          url.searchParams.append('routes.token_out_denom', r.tokenOutDenom);
        }
      }
    );
    return { tokenOutAmount: this.convertFunction(raw.tokenOutAmount ?? '0') };
  }

  /**
   * GET /osmosis/gamm/v1beta1/{poolId}/estimate/swap_exact_amount_out
   */
  async estimateSwapExactAmountOut(
    payload: iEstimateSwapExactAmountOutPayload<NumberType>
  ): Promise<iEstimateSwapExactAmountOutResponse<T>> {
    const poolId = numberToString(payload.poolId);
    const raw = await this.get<{ tokenInAmount: string }>(
      `/osmosis/gamm/v1beta1/${encodeURIComponent(poolId)}/estimate/swap_exact_amount_out`,
      (url) => {
        url.searchParams.append('sender', payload.sender);
        url.searchParams.append('token_out', payload.tokenOut);
        for (const r of payload.routes) {
          url.searchParams.append('routes.pool_id', numberToString(r.poolId));
          url.searchParams.append('routes.token_in_denom', r.tokenInDenom);
        }
      }
    );
    return { tokenInAmount: this.convertFunction(raw.tokenInAmount ?? '0') };
  }
}
