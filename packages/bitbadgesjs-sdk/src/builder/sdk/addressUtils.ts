/**
 * Address conversion utilities for the MCP builder.
 *
 * Thin adapter that maps the builder's historical names onto the SDK's
 * canonical `@category Address Utils` exports from
 * `src/address-converter/converter.ts`. No duplicated bech32 plumbing
 * lives in this file anymore.
 *
 * Behaviour shifts versus the pre-adapter implementation (see backlog
 * #0280 — all corrections):
 *
 *   1. Mixed-case `0x` addresses with invalid EIP-55 checksums are now
 *      rejected — matching chain and frontend behaviour.
 *   2. `bbvaloper1...` validator addresses pass through `ensureBb1`
 *      unchanged instead of being dropped/mangled.
 *   3. 32-byte module-derived `bb1` addresses round-trip through
 *      `toEthAddress`/`cosmosToEth` as a non-standard 64-char `0x`
 *      string instead of throwing. The canonical `convertToEthAddress`
 *      path hex-encodes the full bech32 payload, so callers that
 *      previously caught the throw now see a well-formed but
 *      longer-than-20-byte `0x...` value — use `validateAddress` /
 *      `isModuleDerived` if you need to reject it explicitly.
 *   4. `ethToCosmos` (alias of `mustConvertToBitBadgesAddress`) is now
 *      idempotent: passing a valid `bb1...` address returns it
 *      unchanged. The previous implementation threw on any non-`0x`
 *      input. Consumers that relied on `ethToCosmos` as an ETH-only
 *      validator should switch to `validateAddress` or an explicit
 *      `0x` prefix check.
 */
import { bech32 } from 'bech32';

import {
  convertToBitBadgesAddress,
  convertToEthAddress,
  getChainForAddress,
  isAddressValid,
  mustConvertToBitBadgesAddress,
  mustConvertToEthAddress
} from '../../address-converter/converter.js';
import { SupportedChain } from '../../common/types.js';

const BITBADGES_PREFIX = 'bb';

const PASSTHROUGH_SPECIALS = new Set(['Mint', 'All', 'None', 'Total', 'AllWithMint']);

function isSpecialAddressAlias(address: string): boolean {
  return (
    PASSTHROUGH_SPECIALS.has(address) ||
    address.startsWith('!') ||
    address.startsWith('AllWithout') ||
    address.startsWith('bbvaloper')
  );
}

/** True when the bech32 payload under a `bb1...` address is 32 bytes
 *  (module-derived alias address) rather than the standard 20.
 */
function isModuleDerivedBb1(address: string): boolean {
  try {
    const decoded = bech32.decode(address);
    const bytes = Buffer.from(bech32.fromWords(decoded.words));
    return bytes.length === 32;
  } catch {
    return false;
  }
}

/**
 * Convert an Ethereum `0x...` address to a BitBadges `bb1...` address.
 * Delegates to the SDK's canonical `mustConvertToBitBadgesAddress`,
 * which enforces EIP-55 mixed-case checksums and rejects malformed hex.
 *
 * Note: idempotent for valid `bb1...` input — passing an already-
 * converted address returns it unchanged (pre-adapter impl threw).
 * Use `validateAddress` if you need strict ETH-only validation.
 */
export const ethToCosmos = mustConvertToBitBadgesAddress;

/**
 * Convert a BitBadges `bb1...` address to an Ethereum `0x...` address.
 * Delegates to the SDK's canonical `mustConvertToEthAddress`.
 *
 * Throws when the input is not a supported bech32/hex address.
 *
 * For 32-byte module-derived `bb1` payloads the canonical converter
 * hex-encodes the full payload rather than throwing — callers receive
 * a non-standard 64-char `0x...` string. Use `validateAddress` and
 * inspect `isModuleDerived` when a strict 20-byte contract is required.
 */
export const cosmosToEth = mustConvertToEthAddress;

/**
 * Convert any supported address to `bb1...` form. Throws on
 * unconvertible input. Delegates to the SDK canonical converter.
 *
 * Idempotent for valid `bb1...` input.
 */
export const toBitBadgesAddress = mustConvertToBitBadgesAddress;

/**
 * Convert any supported address to `0x...` form. Throws on
 * unconvertible input. Delegates to the SDK canonical converter.
 *
 * For 32-byte module-derived `bb1` payloads, returns a non-standard
 * 64-char `0x...` string rather than throwing (see `cosmosToEth`).
 */
export const toEthAddress = mustConvertToEthAddress;

/**
 * Ensure address is in `bb1...` form, passing through special values.
 *
 * Pass-through cases:
 *   - Empty/falsy input
 *   - Reserved aliases: `Mint`, `All`, `None`, `Total`, `AllWithMint`
 *   - Negation prefix: `!...`
 *   - `AllWithout*` variants
 *   - Validator addresses: `bbvaloper...`
 *
 * Conversion cases:
 *   - 0x / supported non-bb1 inputs are converted via
 *     `convertToBitBadgesAddress`. If conversion fails (returns empty),
 *     the original string is returned so downstream validation can
 *     surface the bad input.
 */
export function ensureBb1(address: string): string {
  if (!address) return address;
  if (isSpecialAddressAlias(address)) return address;
  if (address.startsWith(BITBADGES_PREFIX + '1')) return address;
  const converted = convertToBitBadgesAddress(address);
  return converted || address;
}

/**
 * Result shape for `validateAddress`. Kept for backward compatibility
 * with existing consumers in the builder subtree.
 */
export interface AddressValidationResult {
  valid: boolean;
  chain: 'eth' | 'cosmos' | 'unknown';
  normalized: string;
  isModuleDerived: boolean;
  error?: string;
}

function chainToString(chain: SupportedChain): 'eth' | 'cosmos' | 'unknown' {
  if (chain === SupportedChain.ETH) return 'eth';
  if (chain === SupportedChain.COSMOS) return 'cosmos';
  return 'unknown';
}

/**
 * Validate an address and report the detected chain.
 *
 * Uses the SDK's canonical `isAddressValid` + `getChainForAddress`, so
 * all builder tools inherit EIP-55 checksum enforcement and any future
 * canonical rules for free.
 */
export function validateAddress(address: string): AddressValidationResult {
  const chain = getChainForAddress(address);
  const chainStr = chainToString(chain);
  const valid = !!address && isAddressValid(address, chain);

  if (!valid) {
    const error =
      chainStr === 'unknown'
        ? `Unknown address format: must start with 0x (ETH) or ${BITBADGES_PREFIX}1 (BitBadges)`
        : `Invalid ${chainStr} address: ${address}`;
    return { valid: false, chain: chainStr, normalized: address, isModuleDerived: false, error };
  }

  const isModuleDerived = chainStr === 'cosmos' && isModuleDerivedBb1(address);
  const normalized =
    chainStr === 'eth'
      ? address.toLowerCase()
      : convertToBitBadgesAddress(address) || address;

  return { valid: true, chain: chainStr, normalized, isModuleDerived };
}

/**
 * Convert 0x-style addresses within a compound list-id string.
 *
 * Handles shapes like:
 *   - `0x742d...`
 *   - `!Mint:0x742d...`
 *   - `!(AllWithout:0x742d...:bb1abc...)`
 *
 * Splits on `:`, normalizes each 0x-prefixed segment via `ensureBb1`,
 * and reassembles — preserving the optional `!` prefix and surrounding
 * parentheses.
 */
export function ensureBb1ListId(listId: string): string {
  if (!listId) return listId;

  let prefix = '';
  let rest = listId;
  if (rest.startsWith('!')) {
    prefix = '!';
    rest = rest.substring(1);
  }

  let parenPrefix = '';
  let parenSuffix = '';
  if (rest.startsWith('(') && rest.endsWith(')')) {
    parenPrefix = '(';
    parenSuffix = ')';
    rest = rest.substring(1, rest.length - 1);
  }

  const parts = rest.split(':').map((part) => {
    if (part.startsWith('0x') && part.length === 42) {
      return ensureBb1(part);
    }
    return part;
  });

  return prefix + parenPrefix + parts.join(':') + parenSuffix;
}
