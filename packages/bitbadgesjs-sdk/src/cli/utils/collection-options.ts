/**
 * Shared single-collection fetch normalization + validate-or-exit
 * scaffolding for the standard command files (ticket 0429).
 *
 *  - `normalizeCollection` — unwrap an indexer `/collection` response
 *    and convert uint64 strings → bigint via the SDK class. This was
 *    copy-pasted in 5 command files and **silently skipped in 4**
 *    (credit-tokens, pay-requests, bounties, prediction-markets), which
 *    handed string-typed amounts to bigint-comparing validators — a
 *    latent boundary bug. One implementation; always normalize.
 *  - `validateCollectionOrExit` — the byte-identical "not found → exit
 *    2 / collect validator errors+warnings → print → exit / echo
 *    warnings unless BB_QUIET" block reimplemented in 7 files,
 *    parameterized only by the per-standard validator + label.
 *
 * The boolean-protocol `validateOrExit` variants (subscriptions,
 * credit-tokens) carry bespoke hint text and are only 2 sites — left
 * as-is per the no-churn philosophy.
 */
import { BitBadgesCollection } from '../../api-indexer/BitBadgesCollection.js';
import { BigIntify } from '../../common/string-numbers.js';

/** Unwrap `{collection}|raw` and normalize numeric strings → bigint. */
export function normalizeCollection(res: any): any {
  const raw = res?.collection ?? res;
  if (!raw) return raw;
  try {
    return new BitBadgesCollection(raw).convert(BigIntify);
  } catch {
    return raw;
  }
}

export interface CollectionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Shared not-found + validator-result print/exit gate (exit code 2). */
export function validateCollectionOrExit(
  collection: any,
  ctx: string,
  validate: (c: any) => CollectionValidationResult,
  label: string
): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  const result = validate(collection);
  if (!result.valid) {
    process.stderr.write(`Error: collection is not a valid ${label} (failed in ${ctx}):\n`);
    for (const e of result.errors) process.stderr.write(`  - ${e}\n`);
    if (result.warnings.length > 0) {
      process.stderr.write('Warnings:\n');
      for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
    }
    process.exit(2);
  }
  if (result.warnings.length > 0 && process.env.BB_QUIET !== '1') {
    process.stderr.write(`Warnings for ${ctx}:\n`);
    for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
  }
}
