import { Command } from 'commander';
import { addNetworkOptions } from '../utils/io.js';

/**
 * Normalize loose CLI input into a transaction body with a `messages` array.
 * Accepts: `{messages: [...]}` (returned as-is), a bare `{typeUrl, value}`
 * Msg (wrapped into a single-message tx body), or anything else (passed
 * through untouched).
 */
export function ensureTxWrapper(input: any): any {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input.messages)) return input;
  if (typeof input.typeUrl === 'string' && input.value) return { messages: [input] };
  return input;
}

export const simulateCommand = addNetworkOptions(
  new Command('simulate')
    .description('Dry-run a built tx against the BitBadges API simulate endpoint. Returns gas + per-address net balance changes. Input: JSON file, inline JSON, or - for stdin.')
    .argument('<input>', 'Tx JSON file path, inline JSON, or "-" for stdin')
    .option('--creator <address>', 'Override the simulation context address (default: bb1simulation)')
    .option('--events', 'Dump the full raw chain events array in the rendered output (default: just the count)')
    .option('--condensed', 'Single-line JSON (smaller pipe payload)', false)
    .option('--output-file <path>', 'Write the envelope to file instead of stdout')
).action(async (
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
  if (!apiKey) {
    process.stderr.write(
      renderSimulate(
        {
          success: false,
          error: 'No API key. Pass --api-key, run `bb settings set apiKey <key>`, or pass --network local against a key-less local indexer.'
        },
        { stream: process.stderr }
      ) + '\n'
    );
    process.exit(2);
  }

  const raw = readJsonInput(input);
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
    process.stderr.write(
      renderSimulate(
        {
          success: false,
          error:
            'Simulate input has an unexpected shape — expected `{messages: [{typeUrl, value}, ...]}` or a single Msg `{typeUrl, value}`. ' +
            `Got: ${got}.`
        },
        { stream: process.stderr }
      ) + '\n'
    );
    process.exit(2);
  }

  // Refuse to simulate user-level approval messages — see check command for
  // structural validation of those instead.
  const APPROVAL_RE =
    /\.(MsgUpdateUserApprovals|MsgSetIncomingApproval|MsgSetOutgoingApproval|MsgDeleteIncomingApproval|MsgDeleteOutgoingApproval|MsgPurgeApprovals)$/;
  const firstApprovalMsg = messages.find((m: any) => typeof m?.typeUrl === 'string' && APPROVAL_RE.test(m.typeUrl));
  if (firstApprovalMsg) {
    process.stderr.write(
      renderSimulate(
        {
          success: false,
          error:
            `Cannot simulate user-level approval message (${firstApprovalMsg.typeUrl}). ` +
            'Use `check` to validate it, or include it inside an alternative approval message that wraps a full collection transaction.'
        },
        { stream: process.stderr }
      ) + '\n'
    );
    process.exit(2);
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
  const { isQuiet } = await import('../utils/envelope.js');
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
  output(result, { ...opts });

  if (!result.success || result.valid === false) process.exit(2);
});
