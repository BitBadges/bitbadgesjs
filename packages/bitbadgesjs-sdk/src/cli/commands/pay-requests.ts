/**
 * `bitbadges-cli pay-requests` — end-user surface for the PaymentRequest
 * standard, mirroring the frontend's `PaymentRequestView`.
 *
 *   pay-requests list    — browse open PaymentRequest collections
 *   pay-requests show    — render details (amount, payer, recipient, expiry, status)
 *   pay-requests pay     — emit MsgTransferTokens targeting the pay approval
 *   pay-requests deny    — emit MsgTransferTokens targeting the deny approval
 *   pay-requests status  — fetch indexer status (paid / denied / pending / expired)
 *   pay-requests build   — alias for `bb build payment-request`
 *
 * Every subcommand validates standards conformance via the SDK's
 * `doesCollectionFollowPaymentRequestProtocol` + `validatePaymentRequestCollection`
 * before emitting anything. On mismatch we exit 2 with structured errors —
 * same short-circuit gate the frontend uses (lines 196-211 of
 * PaymentRequestView).
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { requireBb1Address } from '../utils/address.js';
import {
  doesCollectionFollowPaymentRequestProtocol,
  validatePaymentRequestCollection,
  extractPaymentRequestDetails,
  derivePaymentRequestStatusFallback,
  buildPaymentRequestPayMsg,
  buildPaymentRequestDenyMsg,
  type PaymentRequestStatus
} from '../../core/payment-requests.js';

// ── Shared flag / output helpers (mirrors swap.ts / balances.ts) ──────────

interface NetworkFlags {
  testnet?: boolean;
  local?: boolean;
  url?: string;
  apiKey?: string;
}

interface OutputFlags {
  outputFile?: string;
  condensed?: boolean;
  json?: boolean;
}

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL (overrides --testnet/--local/config)')
    .option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)');
}

function addOutputFlags(cmd: Command): Command {
  return cmd
    .option('--output-file <path>', 'Write output to file instead of stdout')
    .option('--condensed', 'Emit single-line JSON instead of pretty-printed', false)
    .option('--json', 'Force JSON output (default when piping; auto-disabled in human mode)', false);
}

function emit(result: unknown, opts: OutputFlags): void {
  const formatted = opts.condensed ? JSON.stringify(result) : JSON.stringify(result, null, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
  } else {
    process.stdout.write(formatted + '\n');
  }
}

function emitError(err: unknown): never {
  const e = err as { message?: string; response?: unknown; hint?: string };
  if (e?.response !== undefined) {
    process.stderr.write(JSON.stringify(e.response, null, 2) + '\n');
  } else {
    process.stderr.write(`Error: ${e?.message ?? String(err)}\n`);
  }
  if (e?.hint) {
    process.stderr.write(`Hint: ${e.hint}\n`);
  }
  process.exit(1);
}

async function callApi(
  method: 'GET' | 'POST',
  path: string,
  opts: NetworkFlags,
  body?: unknown
): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  // Indexer returns `{collection: {...}}` for the single-collection GET.
  return res?.collection ?? res;
}

/**
 * Validate that the fetched collection conforms to the PaymentRequest
 * protocol. On failure, write structured errors to stderr and exit 2 —
 * same gate as the frontend view's short-circuit.
 */
function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  const result = validatePaymentRequestCollection(collection);
  if (!result.valid) {
    process.stderr.write(`Error: collection is not a valid PaymentRequest (failed in ${ctx}):\n`);
    for (const e of result.errors) process.stderr.write(`  - ${e}\n`);
    if (result.warnings.length > 0) {
      process.stderr.write('Warnings:\n');
      for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
    }
    process.exit(2);
  }
  if (result.warnings.length > 0 && process.env.BB_QUIET !== '1') {
    process.stderr.write(`Warnings for ${ctx}:\n`);
    for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
  }
}

function resolveStatus(collection: any, expirationTime: bigint): PaymentRequestStatus {
  const indexerStatus = collection?.standardsInfo?.PaymentRequest?.status as PaymentRequestStatus | undefined;
  return indexerStatus ?? derivePaymentRequestStatusFallback(expirationTime);
}

// ── pay-requests (parent) ─────────────────────────────────────────────────

export const payRequestsCommand = new Command('pay-requests').description(
  'End-user surface for the PaymentRequest standard — list / show / pay / deny / status / build. Every action validates conformance before emitting.'
);

// ── pay-requests list ─────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('list')
      .description('Browse PaymentRequest collections. Optional filters scope to the active set.')
      .option('--mine <address>', 'Restrict to requests addressed to this payer (bb1.../0x — auto-normalized)')
      .option('--open', 'Only return pending (not paid/denied/expired) requests', false)
  )
).action(async (opts: NetworkFlags & OutputFlags & { mine?: string; open?: boolean }) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'paymentRequest' });
    const all: any[] = res?.collections?.paymentRequest ?? res?.collections ?? [];
    let collections = all.filter((c: any) => doesCollectionFollowPaymentRequestProtocol(c));

    if (opts.mine) {
      const bb1 = requireBb1Address(opts.mine, '--mine');
      collections = collections.filter((c: any) => {
        const details = extractPaymentRequestDetails(c.collectionApprovals);
        return details?.payerAddress === bb1;
      });
    }
    if (opts.open) {
      collections = collections.filter((c: any) => {
        const details = extractPaymentRequestDetails(c.collectionApprovals);
        if (!details) return false;
        return resolveStatus(c, details.expirationTime) === 'pending';
      });
    }

    const summary = collections.map((c: any) => {
      const details = extractPaymentRequestDetails(c.collectionApprovals)!;
      return {
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        payerAddress: details.payerAddress,
        recipientAddress: details.recipientAddress,
        paymentCoins: details.paymentCoins.map((coin) => ({ denom: coin.denom, amount: coin.amount.toString() })),
        expirationTime: details.expirationTime.toString(),
        status: resolveStatus(c, details.expirationTime)
      };
    });
    emit(summary, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── pay-requests show ─────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('show')
      .description('Render a PaymentRequest collection — amount, payer, recipient, expiry, status.')
      .argument('<collection-id>', 'PaymentRequest collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests show');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    emit(
      {
        collectionId: String(collectionId),
        payerAddress: details.payerAddress,
        recipientAddress: details.recipientAddress,
        paymentCoins: details.paymentCoins.map((coin) => ({
          denom: coin.denom,
          amount: coin.amount.toString()
        })),
        expirationTime: details.expirationTime.toString(),
        status: resolveStatus(collection, details.expirationTime)
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

// ── pay-requests status ───────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('status')
      .description('Resolve the current status: paid / denied / pending / expired.')
      .argument('<collection-id>', 'PaymentRequest collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests status');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    const status = resolveStatus(collection, details.expirationTime);
    emit({ collectionId: String(collectionId), status }, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── pay-requests pay ──────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('pay')
      .description(
        'Emit MsgTransferTokens targeting the pay approval. Pipe the output to `bb deploy` to sign + broadcast.'
      )
      .argument('<collection-id>', 'PaymentRequest collection ID')
      .requiredOption('--creator <address>', 'Payer address (bb1.../0x — auto-normalized)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests pay');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    if (creator !== details.payerAddress) {
      process.stderr.write(
        `Warning: --creator ${creator} does not match the request's payer ${details.payerAddress}. The on-chain approval will reject this tx.\n`
      );
    }
    const msg = buildPaymentRequestPayMsg(creator, String(collectionId), details.payApproval);
    emit(msg, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── pay-requests deny ─────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    payRequestsCommand
      .command('deny')
      .description(
        'Emit MsgTransferTokens targeting the deny approval. Pipe the output to `bb deploy` to sign + broadcast.'
      )
      .argument('<collection-id>', 'PaymentRequest collection ID')
      .requiredOption('--creator <address>', 'Payer address (bb1.../0x — auto-normalized)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'pay-requests deny');
    const details = extractPaymentRequestDetails(collection.collectionApprovals)!;
    if (creator !== details.payerAddress) {
      process.stderr.write(
        `Warning: --creator ${creator} does not match the request's payer ${details.payerAddress}. The on-chain approval will reject this tx.\n`
      );
    }
    const msg = buildPaymentRequestDenyMsg(creator, String(collectionId), details.denyApproval);
    emit(msg, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── pay-requests build (alias) ────────────────────────────────────────────

payRequestsCommand
  .command('build')
  .description(
    'Alias for `bb build payment-request` — creator-side: construct a CREATE-COLLECTION tx for a new PaymentRequest. All flags pass through (including --help).'
  )
  // Disable the alias's own --help so `bb pay-requests build --help` flows
  // through to `bb build payment-request --help` (the real flag surface).
  .helpOption(false)
  .allowUnknownOption()
  .allowExcessArguments()
  .action(async () => {
    const { buildCommand } = await import('./build.js');
    // Forward everything after `pay-requests build` in argv to the
    // underlying `bb build payment-request` command.
    const argv = process.argv;
    const startIdx = argv.findIndex((a, i) => a === 'build' && argv[i - 1] === 'pay-requests');
    const forward = startIdx >= 0 ? argv.slice(startIdx + 1) : [];
    await buildCommand.parseAsync(['payment-request', ...forward], { from: 'user' });
  });
