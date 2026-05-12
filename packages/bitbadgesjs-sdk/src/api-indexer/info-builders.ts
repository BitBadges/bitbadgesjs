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
 * Contract for a per-standard info builder. Implementations live in the
 * indexer (where extra fetches are available) and are registered into the
 * builders map passed to `buildStandardsInfo`.
 *
 * @category Standards Info
 */
export interface StandardInfoBuilder<TInfo> {
  readonly standardName: string;
  build(collection: BitBadgesCollection<bigint>, ctx: StandardInfoCtx): Promise<TInfo | null>;
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
