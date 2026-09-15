/** Shared collection normalization and validation for standard command boundaries. */
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

/** Throw validation failures so the command catch emits the structured error envelope. */
export function validateCollectionOrExit(
  collection: any,
  ctx: string,
  validate: (c: any) => CollectionValidationResult,
  label: string
): void {
  if (!collection) throw new Error(`collection not found while running ${ctx}. Re-read the collection before retrying.`);
  const result = validate(collection);
  if (!result.valid) {
    throw new Error(`collection is not a valid ${label} (failed in ${ctx}): ${result.errors.join('; ')}. Inspect the collection and choose a supported standard action.`);
  }
  if (result.warnings.length > 0 && process.env.BB_QUIET !== '1') {
    process.stderr.write(`Warnings for ${ctx}:\n`);
    for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
  }
}
