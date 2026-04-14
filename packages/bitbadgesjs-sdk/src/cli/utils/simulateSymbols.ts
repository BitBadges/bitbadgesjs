/**
 * Symbol + alias resolution helpers for the simulate renderer.
 *
 * Two jobs:
 *  1. Map a Cosmos coin denom (`ubadge`, `ibc/…`) → human symbol via
 *     the SDK `MAINNET_COINS_REGISTRY`. Used to suffix net-change and
 *     transfer lines with `(BADGE)` / `(ATOM)` / etc.
 *  2. Given a balance array for a collection, detect whether it
 *     cleanly maps to one of the collection's `aliasPaths` or
 *     `cosmosCoinWrapperPaths` — i.e. represents exactly N units of
 *     that alias's `conversion.sideB` recipe for some positive integer
 *     N. If so, return the alias symbol.
 *
 * Both stages are best-effort: a failed lookup or a non-matching
 * balance shape just returns null and the renderer prints the raw
 * denom / raw JSON with no suffix — same behavior as before the
 * feature existed.
 *
 * Only mainnet symbols are registered today; the single
 * `MAINNET_COINS_REGISTRY` is the source of truth even on testnet/
 * local because local dev forks mainnet denoms. If a distinct
 * testnet registry is added later, branch here.
 */

import { getCoinDetails } from '../../builder/sdk/coinRegistry.js';
import { getCollections } from '../../builder/sdk/apiClient.js';

export interface CoinSymbolInfo {
  symbol: string;
  /** Decimals for the display unit. 0 if unknown / native micro-unit. */
  decimals: number;
}

export interface AliasSymbolInfo {
  symbol: string;
  /**
   * Signed count of alias base units encoded by the balance array.
   * Negative if the underlying balance amounts were negative (e.g. the
   * Mint side of a net-change). Format with `decimals` to get the
   * human-readable display amount.
   */
  amount: bigint;
  /** Decimals for the alias's default-display denomUnit. 0 if none set. */
  decimals: number;
}

export interface SimulateRenderCollection {
  aliasPaths?: SimulatePath[];
  cosmosCoinWrapperPaths?: SimulatePath[];
}

interface SimulatePath {
  symbol?: string;
  denomUnits?: Array<{ symbol?: string; isDefaultDisplay?: boolean; decimals?: string | number }>;
  conversion?: {
    sideB?: Array<{
      amount: string | number | bigint;
      tokenIds: Array<{ start: string | number | bigint; end: string | number | bigint }>;
      ownershipTimes: Array<{ start: string | number | bigint; end: string | number | bigint }>;
    }>;
  };
}

/** Loose balance shape — amounts may be strings (post bigintToString) or bigints. */
interface LooseBalance {
  amount: string | number | bigint;
  tokenIds: Array<{ start: string | number | bigint; end: string | number | bigint }>;
  ownershipTimes: Array<{ start: string | number | bigint; end: string | number | bigint }>;
}

/**
 * Look up the human symbol + decimals for a Cosmos coin denom.
 * Returns null if the denom isn't in the registry. Never throws.
 */
export function resolveCoinSymbol(denom: string): CoinSymbolInfo | null {
  if (!denom) return null;
  const details = getCoinDetails(denom);
  if (details?.symbol && details.symbol !== 'UNKNOWN') {
    const dec = parseInt(details.decimals, 10);
    return {
      symbol: details.symbol,
      decimals: Number.isFinite(dec) && dec > 0 ? dec : 0
    };
  }
  return null;
}

/**
 * Format a raw integer amount into a human decimal string. Preserves
 * every non-zero fractional digit — no rounding — and strips trailing
 * zeros. `decimals <= 0` falls back to the integer representation.
 */
export function formatHumanAmount(raw: bigint, decimals: number): string {
  if (decimals <= 0) return raw.toString();
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const s = abs.toString();
  const padded = s.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, padded.length - decimals);
  const fracPartRaw = padded.slice(padded.length - decimals);
  const fracPart = fracPartRaw.replace(/0+$/, '');
  const out = fracPart ? `${intPart}.${fracPart}` : intPart;
  return negative ? '-' + out : out;
}

function toBigIntOrNull(v: unknown): bigint | null {
  try {
    if (typeof v === 'bigint') return v;
    if (typeof v === 'number') return BigInt(v);
    if (typeof v === 'string' && v.length > 0) return BigInt(v);
  } catch {
    return null;
  }
  return null;
}

function rangesEqual(
  a: Array<{ start: unknown; end: unknown }> | undefined,
  b: Array<{ start: unknown; end: unknown }> | undefined
): boolean {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const as = toBigIntOrNull(a[i].start);
    const ae = toBigIntOrNull(a[i].end);
    const bs = toBigIntOrNull(b[i].start);
    const be = toBigIntOrNull(b[i].end);
    if (as === null || ae === null || bs === null || be === null) return false;
    if (as !== bs || ae !== be) return false;
  }
  return true;
}

function pathSymbol(path: SimulatePath): string | null {
  if (path.symbol) return path.symbol;
  const display = path.denomUnits?.find((u) => u.isDefaultDisplay)?.symbol;
  if (display) return display;
  return path.denomUnits?.[0]?.symbol || null;
}

function pathDecimals(path: SimulatePath): number {
  const units = path.denomUnits || [];
  const display = units.find((u) => u.isDefaultDisplay) || units[0];
  if (!display?.decimals) return 0;
  const n = typeof display.decimals === 'number' ? display.decimals : parseInt(display.decimals, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Check whether `balances` cleanly encodes N units of `path.conversion.sideB`
 * for some integer N. "Cleanly" means:
 *   - balances.length === sideB.length
 *   - each balance's tokenIds + ownershipTimes ranges equal the
 *     corresponding sideB entry exactly
 *   - every (balance.amount / sideB.amount) ratio is the same integer
 *     with no remainder, and all entries share the same sign
 *
 * Returns the signed ratio N — negative if the balance amounts were
 * negative (e.g. the Mint side of a net-change).
 */
function matchesPath(balances: LooseBalance[], path: SimulatePath): bigint | null {
  const sideB = path.conversion?.sideB;
  if (!sideB || sideB.length === 0) return null;
  if (balances.length !== sideB.length) return null;

  let ratio: bigint | null = null;
  for (let i = 0; i < sideB.length; i++) {
    const b = balances[i];
    const s = sideB[i];
    if (!rangesEqual(b.tokenIds, s.tokenIds)) return null;
    if (!rangesEqual(b.ownershipTimes, s.ownershipTimes)) return null;

    const bAmt = toBigIntOrNull(b.amount);
    const sAmt = toBigIntOrNull(s.amount);
    if (bAmt === null || sAmt === null || sAmt === 0n) return null;

    // sideB amounts are always positive by construction; preserve sign
    // from the balance so negative net-change lines render as negative.
    const negative = bAmt < 0n;
    const absB = negative ? -bAmt : bAmt;
    if (absB % sAmt !== 0n) return null;
    const absRatio = absB / sAmt;
    if (absRatio === 0n) return null;
    const thisRatio = negative ? -absRatio : absRatio;
    if (ratio === null) ratio = thisRatio;
    else if (ratio !== thisRatio) return null;
  }
  return ratio;
}

/**
 * Given a balance array and a pre-fetched collection, return the
 * alias or wrapper-path symbol + signed base-unit amount + decimals
 * if the balances cleanly map to one. Returns null on any mismatch
 * (ranges don't align, amounts aren't evenly divisible, etc.) —
 * callers then render the raw JSON without a suffix.
 */
export function detectBalanceAliasSymbol(
  balances: unknown,
  collection: SimulateRenderCollection | undefined
): AliasSymbolInfo | null {
  if (!collection) return null;
  if (!Array.isArray(balances) || balances.length === 0) return null;
  const looseBalances = balances as LooseBalance[];

  const paths: SimulatePath[] = [
    ...(collection.aliasPaths || []),
    ...(collection.cosmosCoinWrapperPaths || [])
  ];
  for (const path of paths) {
    const ratio = matchesPath(looseBalances, path);
    if (ratio === null) continue;
    const sym = pathSymbol(path);
    if (!sym) continue;
    return { symbol: sym, amount: ratio, decimals: pathDecimals(path) };
  }
  return null;
}

/**
 * Pre-fetch every collection referenced by a simulate result so the
 * synchronous `renderSimulate()` can do alias lookups without doing
 * I/O. Errors are swallowed — a missing collection fetch just
 * degrades the rendered output to "no alias suffix", identical to
 * pre-feature behavior.
 */
export async function prefetchSimulateCollections(
  result: { netChanges?: any; parsedEvents?: any } | undefined,
  opts: { apiKey?: string; apiUrl?: string }
): Promise<Map<string, SimulateRenderCollection>> {
  const cache = new Map<string, SimulateRenderCollection>();
  if (!result) return cache;

  const ids = new Set<string>();
  const badgeChanges = result.netChanges?.badgeChanges || {};
  for (const addrEntry of Object.values(badgeChanges)) {
    for (const collectionId of Object.keys(addrEntry as Record<string, unknown>)) {
      if (collectionId) ids.add(String(collectionId));
    }
  }
  const badgeXfers = result.parsedEvents?.badgeTransferEvents;
  if (Array.isArray(badgeXfers)) {
    for (const t of badgeXfers) {
      if (t?.collectionId != null) ids.add(String(t.collectionId));
    }
  }
  if (ids.size === 0) return cache;

  try {
    const response = await getCollections(
      {
        collectionsToFetch: Array.from(ids).map((collectionId) => ({ collectionId }))
      },
      { apiKey: opts.apiKey, apiUrl: opts.apiUrl }
    );
    if (response.success && response.data?.collections) {
      for (const col of response.data.collections) {
        const id = String((col as any).collectionId);
        cache.set(id, col as SimulateRenderCollection);
      }
    }
  } catch {
    // best-effort — leave cache partial or empty
  }
  return cache;
}
