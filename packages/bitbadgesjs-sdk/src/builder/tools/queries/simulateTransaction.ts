/**
 * Tool: simulate_transaction
 * Dry-run a transaction to check validity and estimate gas.
 * Returns raw events plus parsed structured output (transfers, net changes).
 */

import { z } from 'zod';
import { simulateTx } from '../../sdk/apiClient.js';
import { parseSimulationEvents, calculateNetChanges } from '../../../core/simulation.js';
import type { SimulationEvent, ParsedSimulationEvents, NetBalanceChanges } from '../../../core/simulation.js';
import { getTransaction as getTransactionFromSession, ensureStringNumbers } from '../../session/sessionState.js';
import { normalizeTxMessages } from '../../../cli/utils/normalizeMsg.js';

export const simulateTransactionSchema = z.object({
  transactionJson: z.string().optional().describe('The full transaction JSON to simulate (as a string). If omitted, the current session transaction is used.'),
  transaction: z.object({}).passthrough().optional().describe('The transaction object to simulate (alternative to transactionJson — pass the object directly without JSON.stringify). If omitted, the current session transaction is used.'),
  sessionId: z.string().optional().describe('Session ID for per-request isolation (only needed when auto-filling from session state).'),
  creatorAddress: z.string().optional().describe('Creator bb1... address (only needed when auto-filling from session state).')
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
  description: 'Dry-run a transaction to check validity and estimate gas. Returns raw events, parsed transfer events (coin, badge, IBC), and per-address net balance changes. If you omit transactionJson/transaction, the tool auto-fills from the current session state (same source as get_transaction). Requires BITBADGES_API_KEY environment variable.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      transactionJson: {
        type: 'string',
        description: 'The full transaction JSON to simulate (as a string). If omitted, the current session transaction is used.'
      },
      transaction: {
        type: 'object',
        description: 'The transaction object to simulate (alternative to transactionJson). If omitted, the current session transaction is used.'
      },
      sessionId: {
        type: 'string',
        description: 'Session ID for per-request isolation (only needed when auto-filling).'
      },
      creatorAddress: {
        type: 'string',
        description: 'Creator address (bb1... or 0x...) (only needed when auto-filling).'
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
 * CLI's `builder simulate` / templates auto-simulate paths. Sends the
 * agent-JSON single-tx shape (`{messages, memo, fee, creatorAddress}`)
 * to the indexer's `/api/v0/simulate` endpoint and normalizes the raw
 * LCD response into a `SimulateTransactionResult` so all callers render
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
  /** Override the resolved API key (e.g. CLI `--network local` flow). */
  apiKey?: string;
  /** Override the resolved API base URL (e.g. CLI `--url http://...`). */
  apiUrl?: string;
}): Promise<SimulateTransactionResult> {
  try {
    if (!params.messages || !Array.isArray(params.messages) || params.messages.length === 0) {
      return { success: false, error: 'Invalid transaction: empty or missing messages array' };
    }

    const response = await simulateTx(
      {
        messages: params.messages,
        memo: params.memo || '',
        fee: params.fee || { amount: [{ denom: 'ubadge', amount: '5000' }], gas: '500000' },
        creatorAddress: params.creatorAddress
      },
      // Pass per-call override config through to apiRequest so the
      // CLI's --network/--url flags can hit a local indexer without
      // requiring environment variables.
      params.apiKey || params.apiUrl ? { apiKey: params.apiKey, apiUrl: params.apiUrl } : undefined
    );

    if (!response.success) {
      return { success: false, error: response.error };
    }

    // Path 2 response is the raw LCD simulate shape:
    //   { gas_info: { gas_used, gas_wanted }, result: { events: [...] } }
    // On a chain-level rejection the indexer surfaces the message as
    // response.data.error (via BitBadgesError passthrough) or as an
    // error field on data itself.
    const data: any = response.data;
    const chainError = data?.error || data?.message;
    if (chainError && !data?.gas_info && !data?.result) {
      return { success: true, valid: false, simulationError: chainError };
    }

    const gasUsed: string | undefined = data?.gas_info?.gas_used;
    const events = ((data?.result?.events || []) as SimulationEvent[]);
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
      gasUsed,
      events,
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
    // Resolve the transaction: explicit input first, then fall back to
    // the current session state — same source get_transaction reads. The
    // LLM frequently forgets to pass transactionJson because the build
    // state "feels" implicit; auto-filling eliminates that class of
    // snag without changing semantics when it IS passed explicitly.
    let tx: {
      messages: unknown[];
      memo?: string;
      fee?: { amount: Array<{ denom: string; amount: string }>; gas: string };
    } | null = null;

    if (input.transaction !== undefined) {
      tx = input.transaction as unknown as typeof tx;
    } else if (input.transactionJson !== undefined && input.transactionJson !== '') {
      try {
        tx = JSON.parse(input.transactionJson);
      } catch {
        return {
          success: false,
          error: 'Invalid JSON: Could not parse the transactionJson string. Pass the transaction object directly via the `transaction` field, or omit both to auto-fill from session state.'
        };
      }
    } else {
      // Neither field provided — auto-fill from session state.
      const sessionTx = getTransactionFromSession(input.sessionId, input.creatorAddress);
      if (!sessionTx || !sessionTx.messages || sessionTx.messages.length === 0) {
        return {
          success: false,
          error: 'No transaction to simulate: session state is empty and neither transactionJson nor transaction was provided. Build the collection first, then call simulate_transaction.'
        };
      }
      const sanitized = ensureStringNumbers(sessionTx);
      const normalized = normalizeTxMessages(sanitized);
      tx = normalized as typeof tx;
    }

    if (!tx || !Array.isArray(tx.messages) || tx.messages.length === 0) {
      return {
        success: false,
        error: 'Invalid transaction: empty or missing messages array.'
      };
    }

    // Strip the verbose `events` (raw LCD output, often 60-80KB) and
    // `parsedEvents` (redundant with netChanges) before returning to the
    // LLM. The agent only needs to know: did it pass, how much gas, and
    // on failure why. `netChanges` is the compact semantic summary worth
    // keeping. CLI/external callers that want raw events should call
    // simulateMessages() directly.
    const raw = await simulateMessages({
      messages: tx.messages,
      memo: tx.memo,
      fee: tx.fee,
      creatorAddress: input.creatorAddress
    });
    return {
      success: raw.success,
      valid: raw.valid,
      gasUsed: raw.gasUsed,
      netChanges: raw.netChanges,
      simulationError: raw.simulationError,
      error: raw.error
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to simulate transaction: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}
