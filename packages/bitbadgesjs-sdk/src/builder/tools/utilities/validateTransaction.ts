/**
 * Tool: validate_transaction
 * Validate BitBadges transaction JSON against critical rules.
 *
 * Logic delegated to bitbadgesjs-sdk's validateTransaction().
 *
 * Like `simulate_transaction` and `review_collection`, this tool
 * auto-fills from the current session state when neither
 * `transactionJson` nor `transaction` is supplied. The master prompt
 * relies on this contract ("validate_transaction … reads session state
 * directly — does not need the tx JSON as input"); without auto-fill,
 * agents that follow the prompt hit `JSON.parse('')` → "Unexpected
 * EOF" and loop indefinitely until the build budget runs out (see
 * backlog #0326).
 */

import { z } from 'zod';
import { validateTransaction, type ValidationIssue, type ValidationResult } from '../../../core/validate.js';
import { getTransaction as getTransactionFromSession, ensureStringNumbers } from '../../session/sessionState.js';

export const validateTransactionSchema = z.object({
  transactionJson: z.string().optional().describe('The transaction JSON to validate (as a string). If omitted, the current session transaction is used.'),
  transaction: z.object({}).passthrough().optional().describe('The transaction object to validate (alternative to transactionJson). If omitted, the current session transaction is used.'),
  sessionId: z.string().optional().describe('Session ID for per-request isolation (only needed when auto-filling from session state).'),
  creatorAddress: z.string().optional().describe('Creator bb1... address (only needed when auto-filling from session state).')
});

export type ValidateTransactionInput = z.infer<typeof validateTransactionSchema>;

export type { ValidationIssue, ValidationResult };

export interface ValidateTransactionResult extends ValidationResult {}

export const validateTransactionTool = {
  name: 'validate_transaction',
  description: 'Validate BitBadges transaction JSON against critical rules. Checks for common errors like numbers not being strings, missing required fields, and invalid list IDs. If you omit transactionJson/transaction, the tool auto-fills from the current session state (same source as simulate_transaction and review_collection).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      transactionJson: {
        type: 'string',
        description: 'The transaction JSON to validate (as a string). If omitted, the current session transaction is used.'
      },
      transaction: {
        type: 'object',
        description: 'The transaction object to validate (alternative to transactionJson — pass the object directly without JSON.stringify). If omitted, the current session transaction is used.'
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

export function handleValidateTransaction(input: ValidateTransactionInput): ValidateTransactionResult {
  // Resolve the transaction: explicit input first, then fall back to
  // session state. This mirrors `handleSimulateTransaction` (see
  // tools/queries/simulateTransaction.ts). The master prompt tells
  // agents that validate/review/simulate all read session state —
  // without this branch, a prompt-compliant call like
  // `{ creatorAddress }` falls through to `JSON.parse('')` →
  // "Unexpected EOF", which the agent cannot recover from and loops on.
  let tx: unknown = null;

  if (input.transaction !== undefined) {
    tx = input.transaction;
  } else if (input.transactionJson !== undefined && input.transactionJson !== '') {
    try {
      tx = JSON.parse(input.transactionJson);
    } catch (error) {
      return {
        valid: false,
        issues: [{
          severity: 'error',
          message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}. Pass the transaction object directly via the \`transaction\` field, or omit both to auto-fill from session state.`
        }]
      };
    }
  } else {
    // Neither field provided — auto-fill from session state, same
    // source `get_transaction`, `simulate_transaction`, and
    // `review_collection` read.
    const sessionTx = getTransactionFromSession(input.sessionId, input.creatorAddress);
    if (!sessionTx || !sessionTx.messages || sessionTx.messages.length === 0) {
      return {
        valid: false,
        issues: [{
          severity: 'error',
          message: 'No transaction to validate: session state is empty and neither transactionJson nor transaction was provided. Build the collection first, then call validate_transaction.'
        }]
      };
    }
    tx = ensureStringNumbers(sessionTx);
  }

  if (!tx || typeof tx !== 'object') {
    return {
      valid: false,
      issues: [{
        severity: 'error',
        message: 'Transaction must be a JSON object'
      }]
    };
  }

  // Delegate to SDK
  return validateTransaction(tx);
}
