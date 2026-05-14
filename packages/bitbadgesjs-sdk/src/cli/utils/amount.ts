/**
 * Amount-flex helpers for CLI commands.
 *
 * Every msg-emit command that takes a `--amount / --price / --pay-amount /
 * --receive-amount / --token-amount / --payment-amount` flag PAIRED with
 * a `--denom` flag now accepts BOTH display-units (`10 BADGE` → auto-
 * converted via the registry's decimals) AND base-units (`10000000
 * ubadge`, with --base-units forcing base-units interpretation even for
 * symbols).
 *
 * Auto-rule:
 *   - registered symbol (BADGE, USDC, …) → display units; multiply by
 *     10^decimals via toBaseUnits()
 *   - canonical baseDenom (ubadge, ibc/<SHA>, factory/*, badges:*,
 *     badgeslp:*) → base units; pass through verbatim
 *   - --base-units flag → base-units interpretation regardless of denom
 *     form
 *
 * Returns a `{ denom, amount }` pair ready to drop into msg construction.
 * `denom` is always the canonical baseDenom; `amount` is always base
 * units as a decimal string.
 */
import { resolveCoin, toBaseUnits } from '../../core/builders/shared.js';
import { MAINNET_COINS_REGISTRY } from '../../common/constants.js';
import { requireBbDenom } from './denom.js';

export interface ResolvedAmount {
  /** Canonical baseDenom (`ubadge`, `ibc/...`, etc.) */
  denom: string;
  /** Amount in base units, as a decimal string */
  amount: string;
}

/**
 * Resolve an `(amount, denom, baseUnits?)` triple into a canonical
 * `{ denom, amount }` pair. See module docstring for the auto-rule.
 *
 * @throws Error with a CLI-friendly message on invalid input. Caller
 *   should let it bubble through emitError / the top-level try/catch.
 */
export function resolveAmount(
  rawAmount: string,
  rawDenom: string,
  baseUnits: boolean,
  ctx: { amountFlag: string; denomFlag: string }
): ResolvedAmount {
  // Validate the denom first — same throw + hint behavior as everywhere
  // else. `validated` is always the canonical baseDenom.
  const validated = requireBbDenom(rawDenom, ctx.denomFlag);

  // Strip underscores / commas commonly used as thousands separators
  // in CLI input (`1_000_000`, `1,000,000`).
  const cleaned = String(rawAmount).replace(/[_,]/g, '');

  // Detect whether the user passed a symbol or a canonical baseDenom.
  // The auto-rule: registered symbol → display units, canonical
  // baseDenom → base units. We re-resolve via resolveCoin to get the
  // decimals when display units are needed.
  const trimmed = rawDenom.trim();
  const isDirectBaseDenom =
    !!MAINNET_COINS_REGISTRY[trimmed] || // ubadge, ibc/... already in registry
    trimmed.startsWith('ibc/') ||
    trimmed.startsWith('factory/') ||
    trimmed.startsWith('badges:') ||
    trimmed.startsWith('badgeslp:');

  // --base-units flag wins. If set, the amount is already base units;
  // we just validate the integer shape and pass through.
  if (baseUnits) {
    if (!/^\d+$/.test(cleaned)) {
      throw new Error(
        `${ctx.amountFlag} must be a non-negative integer when --base-units is set, got "${rawAmount}".`
      );
    }
    return { denom: validated, amount: cleaned };
  }

  if (isDirectBaseDenom) {
    // Canonical baseDenom + no --base-units → still base units (the
    // user passed a chain denom so they're already speaking chain
    // language). Same integer-shape requirement as --base-units.
    if (!/^\d+$/.test(cleaned)) {
      throw new Error(
        `${ctx.amountFlag} must be a non-negative integer when ${ctx.denomFlag} is a chain denom (got "${rawAmount}"). Use --base-units to be explicit, or pass a symbol like BADGE / USDC to use display units.`
      );
    }
    return { denom: validated, amount: cleaned };
  }

  // Symbol input → display units. resolveCoin gives us decimals; we
  // accept decimal input (e.g. "1.5") and round to base units.
  const resolved = resolveCoin(validated);
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(
      `${ctx.amountFlag} must be a non-negative number (got "${rawAmount}").`
    );
  }
  return { denom: resolved.denom, amount: toBaseUnits(num, resolved.decimals) };
}
