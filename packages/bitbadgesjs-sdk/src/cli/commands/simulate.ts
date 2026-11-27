import { Command } from 'commander';
import { addNetworkOptions } from '../utils/io.js';
import { emitError, isQuiet, BBErrorCode } from '../utils/envelope.js';

/**
 * Normalize loose CLI input into a transaction body with a `messages` array.
 * Accepts: `{messages: [...]}` (returned as-is), a bare `{typeUrl, value}`
 * Msg (wrapped into a single-message tx body), or anything else (passed
 * through untouched).
 */
import { ensureTxWrapper } from '../utils/txInput.js';
export { ensureTxWrapper };

/**
 * Whether this invocation needs a BitBadges API key.
 *
 * The local indexer serves `/api/v0/simulate` without one, so requiring a key
 * there made the command impossible to run locally — and its own error text
 * pointed at `--network local`, so following the advice reproduced the error.
 * An agent cannot recover from a loop like that.
 */
export function requiresApiKey(opts: { network?: string; local?: boolean; testnet?: boolean; url?: string }): boolean {
  if (opts.network === 'local' || opts.local) return false;
  if (opts.url && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(opts.url)) return false;
  return true;
}

export const simulateCommand = addNetworkOptions(
  new Command('simulate')
    .description(
      'Dry-run a built tx against the BitBadges API simulate endpoint. Returns gas + per-address net balance changes. Input: JSON file, inline JSON, or - for stdin.'
    )
    .argument('<input>', 'Tx JSON file path, inline JSON, or "-" for stdin')
    .option('--creator <address>', 'Override the simulation context address (default: bb1simulation)')
    .option('--events', 'Dump the full raw chain events array in the rendered output (default: just the count)')
    .option('--condensed', 'Single-line JSON (smaller pipe payload)', false)
    .option('--output-file <path>', 'Write the envelope to file instead of stdout')
).action(
  async (
    input: string,
    opts: {
      creator?: string;
      events?: boolean;
      condensed?: boolean;
      outputFile?: string;
      network?: 'mainnet' | 'local' | 'testnet';
      testnet?: boolean;
      local?: boolean;
      url?: string;
    }
  ) => {
    const { readJsonInput, output, getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');
    const { simulateMessages } = await import('../../builder/tools/queries/simulateTransaction.js');
    const { renderSimulate } = await import('../utils/terminal.js');
    const { prefetchSimulateCollections } = await import('../utils/simulateSymbols.js');

    // Network-aware API key + URL resolution.
    const apiKey = getApiKeyForNetwork(opts);
    if (!apiKey && requiresApiKey(opts)) {
      const msg =
        'No API key configured. Pass --api-key, set BITBADGES_API_KEY, run `bb settings set apiKey <key>`, or pass --network local against a key-less local indexer.';
      if (!isQuiet()) {
        process.stderr.write(renderSimulate({ success: false, error: msg }, { stream: process.stderr }) + '\n');
      }
      emitError(new Error(msg), {
        code: BBErrorCode.MISSING_API_KEY,
        hint: 'Set BITBADGES_API_KEY, pass --api-key <key>, or run `bb settings set apiKey <key>`.',
        condensed: opts.condensed,
        exitCode: 2
      });
    }

    let raw: any;
    try {
      raw = readJsonInput(input);
    } catch (err: any) {
      emitError(err, {
        code: BBErrorCode.INVALID_INPUT,
        condensed: opts.condensed,
        exitCode: 2
      });
    }
    const wrapped = ensureTxWrapper(raw);
    const messages = Array.isArray(wrapped?.messages) ? wrapped.messages : [];
    if (messages.length === 0) {
      // Match `check`'s level of detail on shape mismatches — agents
      // shouldn't have to guess what was wrong with their input.
      const got =
        wrapped == null
          ? String(wrapped)
          : Array.isArray(wrapped)
            ? `array (length ${wrapped.length})`
            : typeof wrapped === 'object'
              ? `object with keys [${Object.keys(wrapped).join(', ')}]`
              : typeof wrapped;
      const msg =
        'Simulate input has an unexpected shape — expected `{messages: [{typeUrl, value}, ...]}` or a single Msg `{typeUrl, value}`. ' +
        `Got: ${got}.`;
      if (!isQuiet()) {
        process.stderr.write(renderSimulate({ success: false, error: msg }, { stream: process.stderr }) + '\n');
      }
      emitError(new Error(msg), {
        code: BBErrorCode.INVALID_INPUT,
        condensed: opts.condensed,
        exitCode: 2
      });
    }

    // Refuse to simulate user-level approval messages — see check command for
    // structural validation of those instead.
    const APPROVAL_RE =
      /\.(MsgUpdateUserApprovals|MsgSetIncomingApproval|MsgSetOutgoingApproval|MsgDeleteIncomingApproval|MsgDeleteOutgoingApproval|MsgPurgeApprovals)$/;
    const firstApprovalMsg = messages.find((m: any) => typeof m?.typeUrl === 'string' && APPROVAL_RE.test(m.typeUrl));
    if (firstApprovalMsg) {
      const msg =
        `Cannot simulate user-level approval message (${firstApprovalMsg.typeUrl}). ` +
        'Use `check` to validate it, or include it inside an alternative approval message that wraps a full collection transaction.';
      if (!isQuiet()) {
        process.stderr.write(renderSimulate({ success: false, error: msg }, { stream: process.stderr }) + '\n');
      }
      emitError(new Error(msg), {
        code: 'unsupported_message',
        hint: 'Use `bb check <input>` to validate user-level approval messages.',
        condensed: opts.condensed,
        exitCode: 2
      });
    }

    const result = await simulateMessages({
      messages,
      memo: wrapped.memo,
      fee: wrapped.fee,
      creatorAddress: opts.creator,
      apiKey,
      apiUrl: getApiUrl(opts)
    });

    // Per-msg breakdown to stderr as commentary (unless --quiet); envelope
    // to stdout always so pipes always see structured data.
    if (!isQuiet()) {
      const collectionCache = await prefetchSimulateCollections(result, {
        apiKey,
        apiUrl: getApiUrl(opts)
      });
      process.stderr.write(
        renderSimulate(result, {
          stream: process.stderr,
          events: opts.events ? 'full' : 'count',
          collectionCache
        }) + '\n'
      );
    }
    // A failed simulation is an envelope error, not `ok: true` with a buried
    // `success: false`. Agents branch on `ok` and on the exit code; both must
    // agree with each other.
    const simulationFailed = !result.success || result.valid === false;
    if (simulationFailed) {
      const errMsg = result.error || result.simulationError || 'Simulation reported the transaction as invalid.';
      const isAuthErr = /\b(401|403|unauthorized|api key)\b/i.test(errMsg);
      emitError(new Error(errMsg), {
        code: isAuthErr ? BBErrorCode.MISSING_API_KEY : 'simulation_failed',
        meta: { simulation: result },
        hint: isAuthErr
          ? 'Set BITBADGES_API_KEY, pass --api-key <key>, or run `bb settings set apiKey <key>`.'
          : 'Fix the reported error and re-run. `bb check <input>` explains the transaction without touching the network.',
        condensed: opts.condensed,
        exitCode: 2
      });
    }

    output(result, { ...opts });
  }
);
