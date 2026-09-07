/**
 * Tool: reset_session
 *
 * Session state is global and persists across builds. Without a way to clear
 * it, a second collection in the same conversation silently inherited the
 * first one's approvals, alias paths, metadata placeholders, and transfers —
 * and the agent had no signal that it happened. `resetSession` already existed
 * and the CLI exposed it as `bb session reset`; MCP did not.
 */
import { z } from 'zod';
import { resetSession } from '../../session/sessionState.js';

export const resetSessionSchema = z.object({
  sessionId: z.string().optional().describe('Session ID to clear. Omit to clear the default session.')
});

export type ResetSessionInput = z.infer<typeof resetSessionSchema>;

export const resetSessionTool = {
  name: 'reset_session',
  description:
    'Clear all session state and start from a blank collection. Call this BEFORE building a second collection in the same conversation: session state is global and persists, so without it the new collection inherits the previous one\'s approvals, metadata, alias paths, and transfers. Takes an optional sessionId; omit it for the default session.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: { type: 'string', description: 'Session ID to clear. Omit for the default session.' }
    }
  }
};

export function handleResetSession(input: ResetSessionInput): { success: true; message: string } {
  resetSession(input?.sessionId);
  return {
    success: true,
    message: 'Session cleared. The next set_* / add_* call starts a blank collection.'
  };
}
