/**
 * Preset approval system — types and registry contract.
 *
 * A Preset is a pure function that turns a small, skill-specific params
 * object into a full collectionApproval shape. It exists so the agent
 * can build canonical skill approvals with a single short tool call
 * (`add_preset_approval`) instead of regurgitating 60-line JSON
 * templates per approval.
 *
 * Design rules:
 *   - Presets are STARTING POINTS, not prescriptions. The agent can
 *     always fall back to `add_approval` with full fields for
 *     customization the preset doesn't anticipate.
 *   - Presets encode only CHAIN-MANDATED defaults (required flags, id
 *     conventions, reserved fields). Product decisions (amounts,
 *     addresses, metadata) stay in `params`.
 *   - Presets are SCOPED TO A SKILL. `list_presets({skill})` filters
 *     to the current skill's presets so the agent isn't tempted to
 *     cross-pollinate (e.g. use a subscription preset while building a
 *     credit token).
 *   - Presets NEVER bypass validation. Rendered output flows through
 *     the same validators as hand-written approvals.
 *   - Skill `.md` docs keep the FULL explicit JSON template. Presets
 *     are documented as a shortcut, not a replacement. Skills have to
 *     be readable by humans and by non-agent consumers (CLI, docs,
 *     frontend forms) where the explicit shape is useful.
 */

import type { z } from 'zod';

/**
 * Rendered approval shape — matches what `add_approval` accepts. Kept
 * as a structural type (not a strict import of MsgUpdateCollection's
 * CollectionApproval) so preset definitions can evolve without
 * re-importing proto classes; the add_approval handler coerces it
 * the same way it coerces hand-authored inputs.
 */
export type RenderedApproval = Record<string, unknown>;

/**
 * One preset. Pure render, no I/O. All determinism lives here.
 *
 * @template P — params schema inferred from `paramsSchema`.
 */
export interface Preset<P = unknown> {
  /** Preset ID — globally unique, kebab-case. Referenced by agent. E.g. "credit-token.scaled". */
  presetId: string;
  /** Which skill this preset belongs to. `list_presets({skill})` filters on this. */
  skillId: string;
  /** Short human-readable name shown in discovery output. */
  name: string;
  /** One-sentence description of when to use this preset. */
  description: string;
  /** Zod schema for the params object. Validated before `render` runs. */
  paramsSchema: z.ZodType<P>;
  /**
   * Pure render: params → full approval shape. Must be deterministic;
   * same params must always produce the same output (golden-output
   * tests rely on this).
   */
  render: (params: P) => RenderedApproval;
}

/** Registry entry as returned by `list_presets` — schema is serialized for the agent. */
export interface PresetDescriptor {
  presetId: string;
  skillId: string;
  name: string;
  description: string;
  /** JSON-schema-ish serialized params (from the zod schema via zod-to-json-schema or a manual shape). */
  paramsSchema: Record<string, unknown>;
}
