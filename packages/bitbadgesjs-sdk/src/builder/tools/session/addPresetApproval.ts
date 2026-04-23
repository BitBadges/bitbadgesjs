/**
 * add_preset_approval — render a canonical approval from a named preset
 * and append it to the session (via the existing add_approval path,
 * with all its validation / address normalization / claim-secret
 * handling intact).
 *
 * Mental model for the agent:
 *   - "I want the canonical skill approval with these params" →
 *     add_preset_approval
 *   - "I want full control over every field, or the preset doesn't
 *     quite fit" → add_approval (the raw tool)
 *
 * The preset encodes only CHAIN-MANDATED defaults. Product decisions
 * (amounts, addresses, time windows) come from `params`. If the LLM
 * needs a one-off tweak on top of a preset (e.g. custom transferTimes
 * on an otherwise-standard credit-scaled approval), it passes an
 * `overrides` object that deep-merges onto the rendered shape.
 *
 * Discovery: call `list_presets({skill})` to enumerate preset IDs
 * + their params schemas.
 */

import { z } from 'zod';
import { getPreset, deepMergeOverrides } from '../../presets/index.js';
import { handleAddApproval } from './addApproval.js';

export const addPresetApprovalSchema = z.object({
  sessionId: z.string().optional().describe('Session ID for per-request isolation.'),
  creatorAddress: z.string().optional().describe('Creator bb1... address.'),
  presetId: z
    .string()
    .describe(
      'Preset identifier (e.g. "credit-token.scaled"). Call list_presets({skill: "..."}) for the menu available to the current skill.'
    ),
  params: z
    .record(z.any())
    .describe(
      'Skill-specific params required by the preset. Each preset declares its own params schema — see list_presets output for fields.'
    ),
  overrides: z
    .record(z.any())
    .optional()
    .describe(
      "Optional deep-merged overrides onto the rendered approval. Use sparingly — when the preset's shape fits but one field needs tweaking (e.g. custom transferTimes window). Arrays REPLACE wholesale; objects merge recursively. If your deviation is large, prefer the raw add_approval tool — presets are starting points, not prescriptions."
    )
});

export type AddPresetApprovalInput = z.infer<typeof addPresetApprovalSchema>;

export const addPresetApprovalTool = {
  name: 'add_preset_approval',
  description:
    'Add a collection approval using a named preset (canonical skill shape) instead of hand-writing the 60-line approvalCriteria JSON. Cheaper in tokens than add_approval when the preset fits; falls back to add_approval for non-canonical shapes. Output is structurally identical to add_approval — all validators and downstream tools treat preset-built and hand-built approvals the same way.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: { type: 'string', description: 'Session ID.' },
      creatorAddress: { type: 'string', description: 'Creator bb1... address.' },
      presetId: {
        type: 'string',
        description:
          'Preset id (e.g. "credit-token.scaled"). Call list_presets({skill: "..."}) to see available presets for the current skill.'
      },
      params: {
        type: 'object',
        description:
          "Skill-specific params. Each preset declares its own schema; see list_presets output for the exact fields and which are required."
      },
      overrides: {
        type: 'object',
        description:
          "Optional deep-merged overrides. Arrays REPLACE, objects merge recursively. Use sparingly; prefer raw add_approval when the preset doesn't fit."
      }
    },
    required: ['presetId', 'params']
  }
};

export function handleAddPresetApproval(input: AddPresetApprovalInput) {
  const preset = getPreset(input.presetId);
  if (!preset) {
    return {
      success: false,
      error: `Unknown presetId "${input.presetId}". Call list_presets({skill: "..."}) to see the menu available for the current skill, or use the raw add_approval tool if no preset matches.`
    };
  }

  // Validate params against the preset's declared schema. Returns a
  // descriptive zod error so the agent sees exactly which field is
  // missing or malformed.
  const parsed = preset.paramsSchema.safeParse(input.params);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    return {
      success: false,
      error: `Invalid params for preset "${input.presetId}": ${issues}`
    };
  }

  // Render + merge overrides + hand to the existing add_approval path
  // so all downstream machinery (address normalization, list-id
  // validation, claim-secret population, session state update) runs.
  const rendered = preset.render(parsed.data);
  const merged = input.overrides
    ? deepMergeOverrides(rendered, input.overrides as Record<string, unknown>)
    : rendered;

  return handleAddApproval({
    sessionId: input.sessionId,
    creatorAddress: input.creatorAddress,
    ...(merged as any)
  });
}
