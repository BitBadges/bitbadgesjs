import { buildAgentVault, type AgentVaultParams } from '../../../core/builders/agent-vault.js';
import { getOrCreateSession } from '../../session/sessionState.js';

export const buildAgentVaultTool = {
  name: 'build_agent_vault',
  description:
    'Replace the current creation draft with a verified Agent Vault v1 budget. Requires explicit agent, human manager and metadata. Does not sign or broadcast. Refuses existing collection updates. Load the agent-vault skill first.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: { type: 'string', description: 'Builder session ID' },
      params: {
        type: 'object',
        required: ['agent', 'manager', 'backingCoin'],
        additionalProperties: false,
        properties: {
          agent: { type: 'string' },
          manager: { type: 'string' },
          backingCoin: { type: 'string' },
          symbol: { type: 'string', description: 'Receipt symbol; default AV' },
          uri: { type: 'string' },
          name: { type: 'string' },
          image: { type: 'string' },
          description: { type: 'string' },
          recovery: { type: 'string', description: 'Optional unrestricted recovery account; disclose custody override before setting' },
          cap: {
            type: 'object',
            required: ['amount', 'startTime', 'intervalLength'],
            additionalProperties: false,
            properties: { amount: { type: 'string' }, startTime: { type: 'string' }, intervalLength: { type: 'string' } }
          },
          window: {
            type: 'object',
            required: ['start', 'end'],
            additionalProperties: false,
            properties: { start: { type: 'string' }, end: { type: 'string' } }
          },
          activation: {
            type: 'object',
            required: ['voters', 'threshold'],
            additionalProperties: false,
            properties: {
              threshold: { type: 'integer', minimum: 1, maximum: 100 },
              voters: {
                type: 'array',
                minItems: 1,
                maxItems: 100,
                items: {
                  type: 'object',
                  required: ['address', 'weight'],
                  additionalProperties: false,
                  properties: { address: { type: 'string' }, weight: { type: 'integer', minimum: 1, maximum: 100 } }
                }
              }
            }
          }
        }
      }
    },
    required: ['params']
  }
};

export function handleBuildAgentVault(input: { sessionId?: string; params: AgentVaultParams }) {
  const message = buildAgentVault(input.params);
  const session = getOrCreateSession(input.sessionId, input.params.manager);
  if (session.messages.some((m) => m.value.collectionId && String(m.value.collectionId) !== '0')) {
    throw new Error('Agent Vault creation cannot replace an existing collection update. Start a new session.');
  }
  session.messages = [message];
  return { success: true, transaction: session, nextSteps: ['audit_collection', 'validate_transaction', 'review_collection'] };
}
