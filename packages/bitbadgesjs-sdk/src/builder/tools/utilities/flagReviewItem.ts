/**
 * Tool: flag_review_item
 *
 * The agent calls this WHENEVER it is not fully confident in a
 * decision — whenever it makes an assumption, substitutes for an
 * unsupported request, resolves ambiguity, or picks one valid answer
 * among many. Flags accumulate on the session and drain into
 * BuildResult.reviewFlags at build end.
 *
 * Always available, no feature flag. Distinct from the post-build
 * LLM auditor (gated by `llmAuditorEnabled`) — this is the builder
 * reflecting on its OWN decisions while building, not a second
 * model reviewing the finished transaction.
 */

import { z } from 'zod';
import { addReviewFlag, getReviewFlags } from '../../session/sessionState.js';
import type { ReviewFlag, ReviewFlagKind, ReviewFlagSeverity } from '../../agent/types.js';

const REVIEW_FLAG_KINDS: ReviewFlagKind[] = [
  'assumption',
  'substitution',
  'unsupported_request',
  'clarification_needed',
  'design_choice',
  'other'
];

const REVIEW_FLAG_SEVERITIES: ReviewFlagSeverity[] = ['low', 'medium', 'high'];

export const flagReviewItemSchema = z.object({
  kind: z.enum(REVIEW_FLAG_KINDS as [ReviewFlagKind, ...ReviewFlagKind[]]),
  severity: z.enum(REVIEW_FLAG_SEVERITIES as [ReviewFlagSeverity, ...ReviewFlagSeverity[]]),
  message: z.string().min(1).max(500),
  chosen: z.string().min(1).max(500),
  alternative: z.string().max(500).optional(),
  fieldPath: z.string().max(200).optional(),
  sessionId: z.string().optional().describe('Session ID for per-request isolation.')
});

export type FlagReviewItemInput = z.infer<typeof flagReviewItemSchema>;

export interface FlagReviewItemResult {
  success: true;
  acknowledged: string;
  totalFlagsThisSession: number;
}

export const flagReviewItemTool = {
  name: 'flag_review_item',
  description:
    'Flag something the user should review before broadcast. Call whenever you are NOT fully confident in a decision: (a) assumptions you made to interpret ambiguous phrasing, (b) user requests the underlying standard cannot fully support so you substituted something, (c) cases where multiple valid interpretations exist and you picked one, (d) defaults you chose without the user specifying a value, (e) any interpretation of loose wording. Better to over-flag than miss. DO NOT flag things that are explicitly stated in the prompt, standards-mandated defaults, or pure style choices (metadata wording, placeholder art).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      kind: {
        type: 'string',
        enum: REVIEW_FLAG_KINDS,
        description:
          'Category of the flag. "assumption" = interpreted ambiguity. "substitution" = user asked for X, closest we support is Y. "unsupported_request" = user asked for X, we could not do it at all. "clarification_needed" = user should confirm the interpretation. "design_choice" = multiple valid answers; picked one. "other" = anything else worth surfacing.'
      },
      severity: {
        type: 'string',
        enum: REVIEW_FLAG_SEVERITIES,
        description:
          '"low" = FYI, likely fine as-is. "medium" = double-check before broadcast. "high" = user probably needs to change something before broadcast.'
      },
      message: {
        type: 'string',
        description: 'One-sentence description of what is being flagged. No preamble, no "I assumed" — just the fact.'
      },
      chosen: {
        type: 'string',
        description: 'The concrete value / interpretation / workaround you picked. Include the actual value where possible.'
      },
      alternative: {
        type: 'string',
        description: 'Optional: the most likely alternative, or what the user might actually have wanted. Helps the user decide quickly.'
      },
      fieldPath: {
        type: 'string',
        description:
          'Optional: dotted path into the transaction where this applies (e.g., "messages[0].value.collectionApprovals[1].approvalCriteria.approvalAmounts"). Lets the UI highlight the affected field.'
      },
      sessionId: {
        type: 'string',
        description: 'Session ID for per-request isolation.'
      }
    },
    required: ['kind', 'severity', 'message', 'chosen']
  }
};

export function handleFlagReviewItem(input: FlagReviewItemInput): FlagReviewItemResult {
  const parsed = flagReviewItemSchema.parse(input);
  const flag: ReviewFlag = {
    kind: parsed.kind,
    severity: parsed.severity,
    message: parsed.message,
    chosen: parsed.chosen,
    alternative: parsed.alternative,
    fieldPath: parsed.fieldPath
  };
  addReviewFlag(parsed.sessionId, flag);
  // Return shape mirrors other session-mutating tools — brief success
  // payload. `totalFlagsThisSession` is informational (helps the
  // agent self-regulate and avoid re-flagging the same concern).
  const total = getReviewFlags(parsed.sessionId).length;
  return {
    success: true,
    acknowledged: `${parsed.severity}/${parsed.kind}: ${parsed.message.slice(0, 80)}`,
    totalFlagsThisSession: total
  };
}
