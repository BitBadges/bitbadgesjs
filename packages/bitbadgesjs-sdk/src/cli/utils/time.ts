/**
 * Time-flag parser for CLI commands.
 *
 * Every msg-emit command that takes an `--expiry / --valid-until /
 * --deadline / --end-time / --start-time / --time` flag now accepts
 * EITHER raw ms-since-epoch OR a duration shorthand (`24h`, `7d`,
 * `monthly`). The duration form is delta-from-now → ms-since-epoch.
 *
 * Heuristic for raw-vs-duration detection: pure-digit input ≥ 10
 * digits is treated as an absolute timestamp; anything else falls into
 * the duration parser. 10-digit is the seconds-since-epoch threshold
 * (Date.now() returns ms which is always 13 digits as of 2026, but the
 * boundary at 10 avoids ambiguity with short numeric durations like
 * "7d" — a bare `7` would be parsed as 7ms in the past, which is never
 * what the user wanted).
 */

import { parseDuration } from '../../core/builders/shared.js';

/**
 * Parse a time flag value into ms-since-epoch as a bigint.
 *
 * Accepts:
 *   - raw integer ms-since-epoch (pure digits, ≥ 10 chars)
 *   - duration shorthand: `30d`, `7d`, `24h`, `1h`, `5m`, `monthly`,
 *     `annually`, `daily`  → Date.now() + parsed-ms
 *
 * @throws Error with a CLI-friendly message on malformed input.
 */
export function parseTimeFlag(input: string, ctx: string): bigint {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    throw new Error(`Missing time value for ${ctx}.`);
  }
  const trimmed = input.trim();

  // Pure-digit input ≥ 10 chars → raw ms-since-epoch. Below 10 chars
  // we treat as a bare numeric duration the user almost certainly
  // didn't mean, so fall through to parseDuration which throws.
  if (/^\d+$/.test(trimmed) && trimmed.length >= 10) {
    return BigInt(trimmed);
  }

  // Otherwise — duration shorthand. parseDuration returns a string of
  // milliseconds; add to now to get the absolute timestamp.
  let deltaMs: bigint;
  try {
    deltaMs = BigInt(parseDuration(trimmed));
  } catch (err: any) {
    throw new Error(
      `Invalid time value "${input}" for ${ctx}. Accepts: ms-since-epoch (e.g. 1748140800000) or duration shorthand (e.g. 24h, 7d, 30d, monthly). ${err?.message ?? ''}`
    );
  }
  return BigInt(Date.now()) + deltaMs;
}
