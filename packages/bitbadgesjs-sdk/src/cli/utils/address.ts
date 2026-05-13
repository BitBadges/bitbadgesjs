/**
 * Address-normalization helpers for the CLI. Indexer routes that key off
 * Cosmos addresses (e.g. `/account/:address/balances`, `/intents/:address`)
 * accept both 0x and bb1 forms server-side, but normalizing client-side
 * gives the user a clear canonical form back and lets the CLI fail fast
 * on truly malformed input instead of waiting for an HTTP 400.
 */

import { convertToBitBadgesAddress } from '../../address-converter/converter.js';

/**
 * Convert any supported address form (0x, bb1, bbvaloper) to its canonical
 * bb1 form. Returns the empty string on failure — caller decides how to
 * react. Use {@link requireBb1Address} when the failure path should exit
 * with a formatted error.
 */
export function tryBb1Address(address: string): string {
  return convertToBitBadgesAddress(address);
}

/**
 * Convert any supported address form (0x, bb1, bbvaloper) to bb1 or exit
 * with a CLI-friendly error.
 *
 * When the input is converted from 0x and stderr commentary is allowed
 * (`BB_QUIET` not set), prints a short normalization notice so the user
 * sees the canonical form being queried.
 *
 * @param address - User-supplied address (0x or bb1 or bbvaloper).
 * @param usage   - Short label of where the address came from (e.g.
 *                  `--mine`, `<address> argument to bb balances bitbadges`)
 *                  — folded into the error message for context.
 */
export function requireBb1Address(address: string, usage: string): string {
  const bb1 = convertToBitBadgesAddress(address);
  if (!bb1) {
    process.stderr.write(
      `Error: invalid address "${address}" for ${usage}. Expected bb1... or 0x... format.\n`
    );
    process.exit(1);
  }
  if (bb1 !== address && !process.env.BB_QUIET) {
    process.stderr.write(`Normalized ${address} → ${bb1}\n`);
  }
  return bb1;
}
