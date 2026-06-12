import type { BitBadgesCollection } from './BitBadgesCollection.js';

/**
 * Pre-fetched context passed to each standard's info builder. The indexer
 * populates this before calling builders; SDK callers can pass `{}` to skip
 * extra-fetch sections (those builders will return `null` or partial data).
 *
 * @category Standards Info
 */
export interface StandardInfoCtx {
  /**
   * Optional pre-fetched prediction market state (used by Prediction Market).
   * Indexer fills with the typed shape; SDK interface stays loose to avoid a
   * circular dep with the indexer-side state model.
   */
  predictionState?: unknown;
  /** Optional override for "now" in ms — used by tests. Defaults to `Date.now()` at builder time. */
  nowMs?: bigint;
}

/**
 * The small, flat, indexable projection of a standard's computed `info`.
 * Materialized into the persisted `CollectionIndex` so the server-side
 * collection-index query can filter/sort/facet by these scalars. Anything
 * heavy (approvals, metadata) stays off this — the full `info` rides along
 * as `extras` purely for display.
 *
 * @category Standards Info
 */
export interface CollectionIndexProjection {
  /** Durable, tx-derived status enum for this standard (filterable/facetable). */
  status?: string;
  /** Primary numeric sort/range key — the standard's headline amount (price, TVL, …). */
  amountNum?: number;
  /** Exact bigint string companion to `amountNum` (range math stays lossless). */
  amountStr?: string;
  /** Denom paired with the amount (range filters are only meaningful per-denom). */
  denom?: string;
  /** Deadline in ms, for the query-time clock transition (see `expiry` below). */
  endTime?: number;
  /** The full computed `info` blob, carried verbatim for client display. */
  extras?: unknown;
}

/**
 * A clock-only status transition: a row whose status is `activeStatus` and
 * whose `endTime` has passed is treated as `expiredStatus` at query time —
 * no tx fires for this (e.g. a PaymentRequest auto-expiring). Standards that
 * only transition via on-chain tx (which already triggers a rebuild) omit it.
 *
 * @category Standards Info
 */
export interface StandardExpiryRule {
  activeStatus: string;
  expiredStatus: string;
}

/**
 * Contract for a per-standard info builder. Implementations live in the
 * indexer (where extra fetches are available) and are registered into the
 * builders map passed to `buildStandardsInfo`.
 *
 * A builder owns EVERYTHING about its standard:
 *  - `build()` produces the live `standardsInfo` (fetch-time, attached to the
 *    collection response).
 *  - `index()` maps that same computed `info` into the persisted, indexable
 *    {@link CollectionIndexProjection}. Omit it to fall back to a
 *    status-only projection (`{ status: info.status, extras: info }`).
 *  - `expiry` declares the standard's clock-only status transition, if any.
 *
 * @category Standards Info
 */
export interface StandardInfoBuilder<TInfo> {
  readonly standardName: string;
  build(collection: BitBadgesCollection<bigint>, ctx: StandardInfoCtx): Promise<TInfo | null>;
  /** Map the built `info` → persisted, indexable projection. */
  index?(collection: BitBadgesCollection<bigint>, info: TInfo, ctx: StandardInfoCtx): CollectionIndexProjection;
  /** Clock-only status transition for the query layer, if this standard has one. */
  readonly expiry?: StandardExpiryRule;
}

/**
 * Project a standard's computed `info` into its {@link CollectionIndexProjection},
 * using the builder's `index()` when present and a status-only default otherwise.
 * Single source of the default so every indexed standard behaves consistently.
 *
 * @category Standards Info
 */
export function projectStandardIndex(
  builder: StandardInfoBuilder<unknown>,
  collection: BitBadgesCollection<bigint>,
  info: unknown,
  ctx: StandardInfoCtx
): CollectionIndexProjection {
  if (builder.index) return builder.index(collection, info, ctx);
  const status = (info as { status?: string } | null)?.status;
  return { status, extras: info };
}

/**
 * Iterate `collection.standards`, run each registered builder, and return the
 * aggregated info object. Builders that return `null` are dropped. A builder
 * that throws is logged and skipped — one bad standard must not poison the
 * whole response.
 *
 * @category Standards Info
 */
export async function buildStandardsInfo(
  collection: BitBadgesCollection<bigint>,
  ctx: StandardInfoCtx,
  registry: Record<string, StandardInfoBuilder<unknown>>
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  await Promise.all(
    (collection.standards ?? []).map(async (standardName) => {
      const builder = registry[standardName];
      if (!builder) return;
      try {
        const info = await builder.build(collection, ctx);
        if (info != null) result[standardName] = info;
      } catch (err) {
        console.warn(`standards-info builder for "${standardName}" threw:`, err);
      }
    })
  );
  return result;
}
