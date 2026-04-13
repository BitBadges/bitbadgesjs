/**
 * Tool: simulate_transaction
 * Dry-run a transaction to check validity and estimate gas.
 * Returns raw events plus parsed structured output (transfers, net changes).
 */

import { z } from 'zod';
import { simulateTx } from '../../sdk/apiClient.js';
import { parseSimulationEvents, calculateNetChanges } from '../../../core/simulation.js';
import type { SimulationEvent, ParsedSimulationEvents, NetBalanceChanges } from '../../../core/simulation.js';

export const simulateTransactionSchema = z.object({
  transactionJson: z.string().optional().describe('The full transaction JSON to simulate (as a string). Either this or transaction must be provided.'),
  transaction: z.object({}).passthrough().optional().describe('The transaction object to simulate (alternative to transactionJson — pass the object directly without JSON.stringify).')
}).refine(data => data.transactionJson !== undefined || data.transaction !== undefined, {
  message: 'Either transactionJson or transaction must be provided'
});

export type SimulateTransactionInput = z.infer<typeof simulateTransactionSchema>;

export interface SimulateTransactionResult {
  success: boolean;
  valid?: boolean;
  gasUsed?: string;
  events?: unknown[];
  parsedEvents?: unknown;
  netChanges?: unknown;
  simulationError?: string;
  error?: string;
}

export const simulateTransactionTool = {
  name: 'simulate_transaction',
  description: 'Dry-run a transaction to check validity and estimate gas. Returns raw events, parsed transfer events (coin, badge, IBC), and per-address net balance changes. Requires BITBADGES_API_KEY environment variable.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      transactionJson: {
        type: 'string',
        description: 'The full transaction JSON to simulate (as a string). Either this or transaction must be provided.'
      },
      transaction: {
        type: 'object',
        description: 'The transaction object to simulate (alternative to transactionJson — pass the object directly without JSON.stringify).'
      }
    }
  }
};

/**
 * Recursively converts all bigint values to strings for JSON serialization.
 */
function bigintToString(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(bigintToString);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = bigintToString(value);
    }
    return result;
  }
  return obj;
}

/**
 * Reusable simulate helper used by both the MCP tool wrapper above and the
 * CLI's `builder simulate` / templates auto-simulate paths. Accepts a
 * `messages: []` array (already wrapped) plus an optional simulation
 * context — defaults to `bb1simulation` if no creator is known. Returns
 * the same SimulateTransactionResult shape so all callers render
 * identically through the terminal helpers.
 */
export async function simulateMessages(params: {
  messages: unknown[];
  memo?: string;
  fee?: {
    amount: Array<{ denom: string; amount: string }>;
    gas: string;
  };
  creatorAddress?: string;
  chain?: string;
}): Promise<SimulateTransactionResult> {
  try {
    if (!params.messages || !Array.isArray(params.messages) || params.messages.length === 0) {
      return { success: false, error: 'Invalid transaction: empty or missing messages array' };
    }

    const response = await simulateTx({
      txs: [
        {
          context: {
            address: params.creatorAddress || 'bb1simulation',
            chain: params.chain || 'eth'
          },
          messages: params.messages,
          memo: params.memo || '',
          fee:
            params.fee || {
              amount: [{ denom: 'ubadge', amount: '5000' }],
              gas: '500000'
            }
        }
      ]
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    const result = response.data?.results?.[0];
    if (result?.error) {
      return { success: true, valid: false, simulationError: result.error };
    }

    const events = (result?.events || []) as SimulationEvent[];
    let parsedEvents: unknown = undefined;
    let netChanges: unknown = undefined;
    try {
      const parsed: ParsedSimulationEvents = parseSimulationEvents(events, []);
      const net: NetBalanceChanges = calculateNetChanges(parsed);
      parsedEvents = bigintToString(parsed);
      netChanges = bigintToString(net);
    } catch {
      // If parsing fails, still return raw events — don't break the caller
    }

    return {
      success: true,
      valid: true,
      gasUsed: result?.gasUsed,
      events: result?.events,
      parsedEvents,
      netChanges
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to simulate transaction: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

export async function handleSimulateTransaction(input: SimulateTransactionInput): Promise<SimulateTransactionResult> {
  try {
    // Normalize: accept either a pre-parsed object or a JSON string
    const resolvedJson: string = input.transaction !== undefined
      ? JSON.stringify(input.transaction)
      : (input.transactionJson ?? '');

    // Parse the transaction JSON
    let tx: {
      messages: unknown[];
      memo?: string;
      fee?: {
        amount: Array<{ denom: string; amount: string }>;
        gas: string;
      };
    };

    try {
      tx = JSON.parse(resolvedJson);
    } catch {
      return {
        success: false,
        error: 'Invalid JSON: Could not parse transaction JSON'
      };
    }

    return simulateMessages({
      messages: tx.messages,
      memo: tx.memo,
      fee: tx.fee
    });
  } catch (error) {
    return {
      success: false,
      error: 'Failed to simulate transaction: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}
