/**
 * Preset registry — single source of truth for all named approval
 * presets. Each skill contributes its own file (`./<skill-id>.ts`)
 * exporting a `Preset[]`; this module aggregates them.
 *
 * Consumers:
 *   - `add_preset_approval` tool — resolves presetId → Preset, validates
 *     params, renders, optionally deep-merges overrides, hands to the
 *     session's approval-append path.
 *   - `list_presets` tool — returns descriptors (filtered by skillId).
 *   - Frontend mint forms — import specific presets directly for
 *     parity with what the agent would produce.
 */

import type { Preset, PresetDescriptor, RenderedApproval } from './types.js';
import { CREDIT_TOKEN_PRESETS } from './credit-token.js';
import { ADDRESS_LIST_PRESETS } from './address-list.js';
import { BOUNTY_PRESETS } from './bounty.js';
import { PAYMENT_REQUEST_PRESETS } from './payment-request.js';
import { PREDICTION_MARKET_PRESETS } from './prediction-market.js';
import { SUBSCRIPTION_PRESETS } from './subscription.js';
import { CUSTOM_2FA_PRESETS } from './custom-2fa.js';
import { TRADABLE_PRESETS } from './tradable.js';
import { AUCTION_PRESETS } from './auction.js';
import { PRODUCTS_PRESETS } from './products.js';
import { PAYMENT_PROTOCOL_PRESETS } from './payment-protocol.js';
import { CROWDFUND_PRESETS } from './crowdfund.js';

/**
 * Aggregate every preset in the SDK. Add a new skill's presets by
 * importing + spreading below. Order is irrelevant — presetIds are
 * globally unique.
 */
const ALL_PRESETS: Preset<any>[] = [
  ...CREDIT_TOKEN_PRESETS,
  ...ADDRESS_LIST_PRESETS,
  ...BOUNTY_PRESETS,
  ...PAYMENT_REQUEST_PRESETS,
  ...PREDICTION_MARKET_PRESETS,
  ...SUBSCRIPTION_PRESETS,
  ...CUSTOM_2FA_PRESETS,
  ...TRADABLE_PRESETS,
  ...AUCTION_PRESETS,
  ...PRODUCTS_PRESETS,
  ...PAYMENT_PROTOCOL_PRESETS,
  ...CROWDFUND_PRESETS
];

// Duplicate-id guard — surfaces at import time, not runtime, so preset
// authoring mistakes fail loudly in CI.
const idSet = new Set<string>();
for (const p of ALL_PRESETS) {
  if (idSet.has(p.presetId)) {
    throw new Error(`Duplicate presetId: "${p.presetId}". Every preset must have a globally unique id.`);
  }
  idSet.add(p.presetId);
}

/** Look up one preset by id. Returns undefined if unknown. */
export function getPreset(presetId: string): Preset<any> | undefined {
  return ALL_PRESETS.find((p) => p.presetId === presetId);
}

/**
 * List presets, optionally scoped to one skill. The agent's discovery
 * tool calls this. Returns descriptors (the `render` function isn't
 * serializable); `paramsSchema` is rendered via `zodToShape` into a
 * minimal JSON-schema-ish object the agent can reason about.
 */
export function listPresets(filter?: { skill?: string }): PresetDescriptor[] {
  const filtered = filter?.skill
    ? ALL_PRESETS.filter((p) => p.skillId === filter.skill)
    : ALL_PRESETS;
  return filtered.map((p) => ({
    presetId: p.presetId,
    skillId: p.skillId,
    name: p.name,
    description: p.description,
    paramsSchema: zodToShape(p.paramsSchema)
  }));
}

/**
 * Deep-merge an overrides object onto a rendered approval.
 *
 * Semantics (chosen to be least-surprising for the agent):
 *   - objects merge recursively — missing keys in override leave the
 *     rendered value in place; present keys replace that subtree
 *     (recursively)
 *   - arrays REPLACE wholesale — `overrides.coins = [...]` replaces
 *     `rendered.coins`, doesn't concat. Array-index-based merge would
 *     silently corrupt ordered fields (coinTransfers[0] vs [1])
 *   - primitives replace
 *   - `undefined` in an override is ignored (lets callers pass sparse
 *     override objects without wiping fields)
 *   - `null` in an override is respected (explicit nulling)
 */
export function deepMergeOverrides(
  rendered: RenderedApproval,
  overrides: RenderedApproval | undefined | null
): RenderedApproval {
  if (!overrides || typeof overrides !== 'object') return rendered;
  const out: RenderedApproval = Array.isArray(rendered) ? ([...rendered] as any) : { ...rendered };
  for (const [key, overrideValue] of Object.entries(overrides)) {
    if (overrideValue === undefined) continue;
    const base = (out as any)[key];
    if (
      overrideValue !== null &&
      !Array.isArray(overrideValue) &&
      typeof overrideValue === 'object' &&
      base !== null &&
      !Array.isArray(base) &&
      typeof base === 'object'
    ) {
      (out as any)[key] = deepMergeOverrides(base, overrideValue as RenderedApproval);
    } else {
      (out as any)[key] = overrideValue;
    }
  }
  return out;
}

/**
 * Convert a zod schema into a minimal JSON-schema-ish object the agent
 * can render in tool descriptions. We don't need full JSON Schema
 * fidelity — just enough to surface field names, types, and whether
 * fields are required. Falls back to `{type:"object"}` on unsupported
 * schema shapes.
 */
function zodToShape(schema: unknown): Record<string, unknown> {
  try {
    // Zod v3 carries a `_def` with `typeName` we can discriminate on.
    const def = (schema as any)?._def;
    if (!def) return { type: 'object' };
    if (def.typeName === 'ZodObject') {
      const shape = def.shape();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, inner] of Object.entries(shape)) {
        const innerDef = (inner as any)?._def;
        const innerType = simpleZodType(innerDef);
        const desc = typeof innerDef?.description === 'string' ? innerDef.description : undefined;
        properties[key] = desc ? { type: innerType, description: desc } : { type: innerType };
        // ZodOptional wraps with typeName === 'ZodOptional'
        if (innerDef?.typeName !== 'ZodOptional' && innerDef?.typeName !== 'ZodDefault') {
          required.push(key);
        }
      }
      return { type: 'object', properties, required };
    }
  } catch {
    // fall through
  }
  return { type: 'object' };
}

function simpleZodType(def: any): string {
  const t = def?.typeName;
  if (t === 'ZodString') return 'string';
  if (t === 'ZodNumber') return 'number';
  if (t === 'ZodBoolean') return 'boolean';
  if (t === 'ZodArray') return 'array';
  if (t === 'ZodObject') return 'object';
  if (t === 'ZodOptional' || t === 'ZodDefault') return simpleZodType(def.innerType?._def);
  return 'string'; // sensible default for union/enum/etc.
}

export type { Preset, PresetDescriptor, RenderedApproval } from './types.js';
