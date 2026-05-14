/**
 * Denom validators for CLI commands.
 *
 * Two parallel validators because BitBadges-side msg flows and Skip:Go
 * cross-chain swap flows have DIFFERENT rules:
 *
 *   - {@link requireBbDenom} — strict on BitBadges-side flags. The only
 *     `u*`-prefix denom valid on BitBadges is `ubadge`. Every other token
 *     (USDC, ATOM, OSMO, …) lives as `ibc/<SHA>` because they're IBC'd in.
 *     A user typing `--denom uusdc` for an auction bid is a category error
 *     — `uusdc` is Noble's native USDC, NOT the form USDC takes on
 *     BitBadges. We reject with a hint pointing at the canonical form.
 *
 *   - {@link requireSkipGoDenom} — permissive on `bb swap *` and any other
 *     Skip:Go cross-chain command. Those commands accept the ORIGIN chain's
 *     native denom (`uusdc` for Noble USDC, `uatom` for Hub ATOM, …)
 *     because the swap is cross-chain by definition. We only check for
 *     obvious malformations here (empty / whitespace) and let Skip resolve
 *     the rest.
 *
 * Both delegate symbol→canonical-denom resolution to `resolveCoin()` so the
 * registry stays the single source of truth.
 */
import { resolveCoin } from '../../core/builders/shared.js';
import { MAINNET_COINS_REGISTRY } from '../../common/constants.js';

const IBC_DENOM_RE = /^ibc\/[A-F0-9]{64}$/i;
const FACTORY_DENOM_RE = /^factory\/[a-zA-Z0-9_:./-]+$/;
const BADGES_DENOM_RE = /^badges:[a-zA-Z0-9_:.-]+$/;
const U_PREFIX_RE = /^u[a-z][a-z0-9]*$/;

/**
 * Validate that `input` is a denom usable on BitBadges and return its
 * canonical baseDenom form. Accepts:
 *
 *   - registered symbols (`BADGE`, `USDC`, `ATOM`, `OSMO`, `CHAOS`, …)
 *   - the literal `ubadge`
 *   - `ibc/<64 hex chars>` IBC denoms
 *   - `badges:*` collection-token denoms
 *   - `factory/*` token-factory denoms
 *
 * REJECTS `u*`-prefix denoms other than `ubadge` (so `uusdc`, `uatom`,
 * `uosmo`, etc. throw with a hint to use the symbol or the canonical
 * `ibc/...` form). The throw is loud on purpose — passing `uusdc` to a
 * BitBadges-side msg flow yields a tx the chain will never recognize.
 *
 * @throws Error with a CLI-friendly message — the caller should let it
 *   bubble to `emitError()` / the top-level try/catch.
 */
export function requireBbDenom(input: string, ctx: string): string {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    throw new Error(`Missing denom for ${ctx}. Pass a symbol (BADGE, USDC, ATOM, …) or canonical denom (ubadge, ibc/...).`);
  }
  const trimmed = input.trim();

  // Direct match against registry baseDenoms (catches ubadge, ibc/...
  // entries, badges:* entries already registered, etc.).
  if (MAINNET_COINS_REGISTRY[trimmed]) {
    return MAINNET_COINS_REGISTRY[trimmed].baseDenom;
  }

  // Symbol lookup (case-insensitive) via resolveCoin — registry is the
  // source of truth.
  const upper = trimmed.toUpperCase();
  for (const details of Object.values(MAINNET_COINS_REGISTRY)) {
    if (details.symbol.toUpperCase() === upper) {
      return details.baseDenom;
    }
  }

  // Accept canonical forms even if not in the registry yet.
  if (IBC_DENOM_RE.test(trimmed)) return trimmed;
  if (FACTORY_DENOM_RE.test(trimmed)) return trimmed;
  if (BADGES_DENOM_RE.test(trimmed)) return trimmed;

  // The `u*` trap: anything starting with `u` followed by lowercase that
  // isn't `ubadge` is almost certainly an origin-chain native denom that
  // a user mistakenly thinks works on BitBadges.
  if (U_PREFIX_RE.test(trimmed) && trimmed !== 'ubadge') {
    throw new Error(
      `"${trimmed}" is not a valid BitBadges denom for ${ctx}. On BitBadges, only "ubadge" uses the u-prefix; other tokens (USDC, ATOM, …) are "ibc/<SHA>" IBC denoms. Try the display symbol (e.g. "USDC") or run \`bb assets show <symbol>\` to see the canonical form.`
    );
  }

  // Anything else — unknown symbol, malformed denom, etc. — throw with
  // the registry-supported list. Mirrors resolveCoin's error shape.
  const supported = Object.values(MAINNET_COINS_REGISTRY)
    .map((c) => c.symbol)
    .filter((s, i, a) => a.indexOf(s) === i)
    .join(', ');
  throw new Error(
    `Unknown denom "${trimmed}" for ${ctx}. Supported symbols: ${supported}. Or pass a canonical denom (ubadge, ibc/<SHA>).`
  );
}

/**
 * Permissive validator for Skip:Go cross-chain swap denoms. The swap
 * surface accepts ORIGIN chain denoms (Noble's `uusdc`, Cosmos Hub's
 * `uatom`, Osmosis's `uosmo`, …) because the swap is by definition
 * cross-chain. We only catch obvious malformations here — empty input,
 * leading/trailing whitespace — and defer the rest to Skip's resolver,
 * which knows about every chain's denom space.
 *
 * Use this on `bb swap *` and any other cross-chain command. Do NOT use
 * on BitBadges-side msg flows — use {@link requireBbDenom} there.
 */
export function requireSkipGoDenom(input: string, ctx: string): string {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    throw new Error(`Missing denom for ${ctx}.`);
  }
  const trimmed = input.trim();
  if (trimmed !== input) {
    throw new Error(`Denom "${input}" for ${ctx} has leading/trailing whitespace.`);
  }
  // Anything else — a u-prefix native denom, an ibc/... hash, a factory
  // path, etc. — is the caller's responsibility. Skip's resolver will
  // reject anything truly bogus.
  return trimmed;
}
