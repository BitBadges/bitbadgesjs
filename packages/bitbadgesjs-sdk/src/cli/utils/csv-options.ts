/**
 * Shared CSV / repeatable-flag value splitter (ticket 0423).
 *
 * Commander gives a repeatable flag/argument as `string[]`; users also
 * comma-join values within a single occurrence. The normalization
 * "flatten on commas, trim, drop empties" was copy-pasted as two
 * byte-identical private `splitCsv` clones (dynamic-stores, price) and
 * inlined three more times (assets, pools, pairs). One implementation
 * so a future change to the splitting/normalization lands everywhere.
 */

/** Split repeatable + comma-joined flag values into a clean token list. */
export function splitCsv(values: string[]): string[] {
  return values.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
}
