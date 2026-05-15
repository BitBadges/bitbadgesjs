/**
 * Address-normalization helpers for the CLI.
 *
 * TWO callsite classes, two helpers:
 *
 *   - {@link requireBb1Address} — lenient, auto-converts 0x → bb1 for
 *     LOOKUP routes (`/account/:address/balances`, `/intents/:address`,
 *     converters themselves). Server accepts both forms; client-side
 *     conversion gives the user back a canonical form + fails fast on
 *     malformed input. Keep using this for read-only / converter
 *     commands.
 *
 *   - {@link requireBb1AddressStrict} — strict, REJECTS 0x at msg-emit
 *     boundaries. Every tx that lands on chain ultimately stores the
 *     creator / payer / verifier / recipient as bb1, and the FE always
 *     surfaces bb1. Letting users pass 0x at the msg-emit boundary and
 *     silently converting masks the conversion behind a hint they
 *     might miss — the strict path throws and points them at the
 *     `bb account convert` tool so they make the form change a
 *     conscious step. Set `BB_ADDRESS_AUTO_CONVERT=1` to fall back to
 *     the lenient behavior for one release while callers migrate.
 */

import { convertToBitBadgesAddress } from '../../address-converter/converter.js';
import { splitCsv } from './csv-options.js';

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

/**
 * Strict variant for msg-emit boundaries. Accepts bb1... only and
 * throws on 0x / bbvaloper / any non-bb1 form with a hint pointing at
 * `bb account convert`. Per the v2 input-validation polish (#0399 follow-up),
 * the canonical on-chain form is bb1 and silent auto-conversion at the
 * msg boundary masks the form change.
 *
 * Escape hatch: when `BB_ADDRESS_AUTO_CONVERT=1` is set in the env,
 * falls back to {@link requireBb1Address} silent auto-convert path. We
 * ship the strict path on by default and the env-var preserves the
 * lenient v0.39 behavior for one release while callers migrate.
 *
 * @param address  - User-supplied address.
 * @param flagName - Short flag label (e.g. `--creator`) folded into the
 *                   error message. Pass without the leading `--` if the
 *                   value comes from a positional argument.
 */
export function requireBb1AddressStrict(address: string, flagName: string): string {
  // Env-var escape hatch — preserves v0.39 lenient behavior for one
  // release. Documented in the migration note that ships alongside this
  // change.
  if (process.env.BB_ADDRESS_AUTO_CONVERT === '1') {
    return requireBb1Address(address, flagName);
  }

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    process.stderr.write(`Error: ${flagName} requires a bb1... address (got empty input).\n`);
    process.exit(1);
  }

  // bb1 fast-path. The lenient helper would still validate the bech32
  // shape via the converter; do the same here so a malformed `bb1xxx`
  // doesn't sneak through.
  if (address.startsWith('bb1')) {
    const round = convertToBitBadgesAddress(address);
    if (!round) {
      process.stderr.write(
        `Error: invalid bb1 address "${address}" for ${flagName} (failed bech32 decode).\n`
      );
      process.exit(1);
    }
    return round;
  }

  // Anything else — 0x..., bbvaloper..., other chain bech32, garbage —
  // throws. We attempt a convert to figure out which chain form the
  // input was, purely for the hint text. The throw itself happens
  // regardless of whether the convert succeeded.
  const converted = convertToBitBadgesAddress(address);
  const sourceChain = address.startsWith('0x')
    ? '0x'
    : /^[a-z]+1[02-9ac-hj-np-z]+$/i.test(address) && !address.startsWith('bb1')
    ? address.split('1', 1)[0] // e.g. cosmos / osmo / inj
    : 'invalid';

  if (converted) {
    process.stderr.write(
      `Error: ${flagName} expects a bb1... address, got ${sourceChain} form "${address}". ` +
        `Run \`bb account convert ${address}\` to canonicalize, ` +
        `or set BB_ADDRESS_AUTO_CONVERT=1 to keep the lenient v0.39 behavior for one release.\n`
    );
  } else {
    process.stderr.write(
      `Error: ${flagName} got malformed input "${address}". Expected a bb1... address.\n`
    );
  }
  process.exit(1);
}

/**
 * Split a comma-joined (and/or repeatable) recipient input into a list
 * of canonical bb1 addresses, strictly validating each element via
 * {@link requireBb1AddressStrict}. Replaces the
 * split→trim→filter→map(requireBb1AddressStrict) sequence reimplemented
 * in `custom-2fa` and `dynamic-stores` (ticket 0423). Does not dedupe —
 * downstream builders own that where it matters (e.g. custom-2fa mint).
 */
export function resolveRecipientList(raw: string | string[], flagName: string): string[] {
  const values = Array.isArray(raw) ? raw : [String(raw ?? '')];
  return splitCsv(values).map((tok) => requireBb1AddressStrict(tok, flagName));
}
