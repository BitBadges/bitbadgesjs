/**
 * list_presets — discovery tool for named approval presets.
 *
 * The agent calls this to enumerate which presets are available for
 * the current skill, along with each preset's params schema. When
 * called without `skill`, returns the full catalog (rarely useful;
 * skill docs usually already tell the agent which presets apply).
 *
 * Intentionally a READ-ONLY query tool — it touches no session state
 * and has no side effects, so the loop summarizer can compress its
 * results aggressively without affecting correctness.
 */

import { z } from 'zod';
import { listPresets } from '../../presets/index.js';

export const listPresetsSchema = z.object({
  skill: z
    .string()
    .optional()
    .describe(
      'Filter to one skill (e.g. "credit-token", "address-list", "bounty"). Omit to see every preset — rarely needed, the skill doc already tells you which apply.'
    )
});

export type ListPresetsInput = z.infer<typeof listPresetsSchema>;

export const listPresetsTool = {
  name: 'list_presets',
  description:
    'List named approval presets available for a skill. Each descriptor includes presetId, name, description, and paramsSchema. Use the presetId with add_preset_approval to build a canonical approval in one tool call instead of hand-writing the 60-line approvalCriteria JSON. Presets are starting points — for non-canonical shapes fall back to add_approval.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      skill: {
        type: 'string',
        description:
          'Skill id to filter by (e.g. "credit-token"). Matches the `skill` field on the case you are building; also matches the `skillId` printed on each preset.'
      }
    }
  }
};

export function handleListPresets(input: ListPresetsInput) {
  const presets = listPresets({ skill: input.skill });
  return {
    success: true,
    count: presets.length,
    presets
  };
}
