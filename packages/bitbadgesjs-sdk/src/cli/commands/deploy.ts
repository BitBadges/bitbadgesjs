/**
 * `bitbadges-cli deploy --burner`
 *
 * Broadcasts a transaction. Today only the `--burner` path is implemented —
 * a throwaway ephemeral wallet is generated per-run, persisted to
 * `~/.bitbadges/burners/`, funded via the indexer faucet (or manually),
 * and signs exactly one create-collection tx. Collection ownership is
 * captured by the `manager` field on the msg, so the burner has no
 * lasting authority. The required `--burner` flag reserves space for
 * future deploy paths without breaking existing scripts.
 *
 * `--with-keyring --from <name>` is the chain-binary path: extract the
 * msg JSON and print the `bitbadgeschaind tx tokenization <verb>`
 * one-liner the user should run. Intentionally prints rather than spawns
 * — see `cli/utils/keyring-command.ts` for the rationale.
 *
 * Input is always JSON — either from `--msg-file <path>`, `--msg-stdin`,
 * or a positional file argument. The canonical happy path is to pipe a
 * builder's stdout straight in:
 *
 *   bitbadges-cli build subscription --interval monthly \
 *     --price 10 --denom USDC --recipient bb1... \
 *     | bitbadges-cli deploy --burner --msg-stdin \
 *         --manager bb1... --local
 */

import { Command } from 'commander';
import { spawnSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import { addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import { runBurnerCreate, pickBurner, type BurnerNetwork } from '../utils/burner.js';
import { buildKeyringCommand, buildKeyringMultiCommand } from '../utils/keyring-command.js';
import {
  extractEntityFromEvents,
  waitForIndexer,
  type ExtractedEntity,
  type WaitForIndexerResult
} from '../utils/wait-for-indexer.js';
import { requireBbDenom } from '../utils/denom.js';

/**
 * Parse the `--wait-for-indexer` flag value. The flag is optional and may
 * appear with or without a value:
 *   absent          → undefined (no wait)
 *   --wait-for-indexer        → 30_000 (default)
 *   --wait-for-indexer 5000   → 5000
 *   --wait-for-indexer=5000   → 5000
 *
 * Commander hands us either `true` (flag with no value), a numeric
 * string, or undefined (flag absent). Anything else is a user typo and
 * we exit with code 2 rather than silently defaulting.
 */
function parseWaitFlag(raw: unknown): number | undefined {
  if (raw === undefined) return undefined;
  if (raw === true || raw === '') return 30_000;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    process.stderr.write(`Error: --wait-for-indexer expects a positive number (ms). Got: ${String(raw)}\n`);
    process.exit(2);
  }
  return Math.floor(n);
}

/**
 * Pull a tx's events from the Cosmos LCD given its hash. Used by the
 * browser path: the /sign flow returns a hash but not the event payload,
 * so we have to round-trip the LCD before we can pluck the entity id.
 * Retries briefly because the LCD is also eventually-consistent on its
 * `/cosmos/tx/v1beta1/txs/<hash>` route (block must be committed +
 * indexed).
 */
async function fetchTxEvents(nodeUrl: string, txHash: string): Promise<any[] | undefined> {
  const attempts = 10;
  const delayMs = 1_500;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${nodeUrl}/cosmos/tx/v1beta1/txs/${txHash}`);
      if (res.ok) {
        const data = await res.json();
        const events = (data as any)?.tx_response?.events;
        if (Array.isArray(events)) return events;
      }
    } catch {
      /* network blip — retry */
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return undefined;
}

/**
 * Render a one-line summary of a successful indexer hit. We intentionally
 * keep this terse — the full body lives in the JSON envelope, and the
 * human-readable note on stderr is just confirmation that the entity is
 * visible.
 */
function summarizeIndexerHit(result: { entity: string; id: string; attempts: number; elapsedMs: number }): string {
  return `Indexer caught up: ${result.entity} ${result.id} visible after ${result.attempts} attempt(s) / ${result.elapsedMs}ms.`;
}

interface ChainTxResult {
  code: number;
  height: number;
  rawLog?: string;
  events: any[];
}

/**
 * Full tx-result fetcher for the `--exec` path: the LCD's
 * `/cosmos/tx/v1beta1/txs/<hash>` returns the same payload `fetchTxEvents`
 * reads, but we need `code` / `height` / `raw_log` too so the JSON envelope
 * matches what burner/browser emit.
 */
async function fetchTxResult(nodeUrl: string, txHash: string): Promise<ChainTxResult | undefined> {
  const attempts = 10;
  const delayMs = 1_500;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${nodeUrl}/cosmos/tx/v1beta1/txs/${txHash}`);
      if (res.ok) {
        const data = await res.json();
        const tr = (data as any)?.tx_response;
        if (tr && (tr.txhash || tr.code !== undefined)) {
          return {
            code: Number(tr.code ?? 0),
            height: Number(tr.height ?? 0),
            rawLog: tr.raw_log,
            events: Array.isArray(tr.events) ? tr.events : []
          };
        }
      }
    } catch {
      /* network blip — retry */
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return undefined;
}

/**
 * Write the chain-binary command line to a tmp script and `bash`-exec it.
 * stdin + stderr are inherited so keyring password prompts and gas
 * estimates surface on the user's TTY; stdout is captured so we can
 * regex out the txhash(es). Matches the harness pattern at
 * `cli/integration/harness/chain.ts`.
 */
function execKeyringScript(commandLine: string): { stdout: string; status: number } {
  const scriptPath = path.join(os.tmpdir(), `bb-deploy-${crypto.randomBytes(4).toString('hex')}.sh`);
  fs.writeFileSync(scriptPath, commandLine + '\n', { mode: 0o700 });
  try {
    const result = spawnSync('bash', [scriptPath], {
      stdio: ['inherit', 'pipe', 'inherit'],
      encoding: 'utf-8',
      timeout: 120_000
    });
    return { stdout: String(result.stdout ?? ''), status: result.status ?? 1 };
  } finally {
    try {
      fs.unlinkSync(scriptPath);
    } catch {
      /* best-effort cleanup */
    }
  }
}

function readMsgInput(opts: { msgFile?: string; msgStdin?: boolean; input?: string }): any {
  let raw: string;
  if (opts.msgStdin) {
    raw = fs.readFileSync(0, 'utf-8');
  } else if (opts.msgFile) {
    raw = fs.readFileSync(opts.msgFile, 'utf-8');
  } else if (opts.input) {
    if (opts.input === '-') {
      raw = fs.readFileSync(0, 'utf-8');
    } else if (opts.input.startsWith('{')) {
      raw = opts.input;
    } else {
      raw = fs.readFileSync(opts.input, 'utf-8');
    }
  } else {
    // No explicit input and stdin isn't a TTY → assume piped stdin.
    if (!process.stdin.isTTY) {
      raw = fs.readFileSync(0, 'utf-8');
    } else {
      throw new Error(
        'No msg input provided. Pass one of: --msg-file <path>, --msg-stdin, a positional file arg, or pipe JSON via stdin.'
      );
    }
  }
  try {
    const parsed = JSON.parse(raw);
    // Envelope unwrap: if stdin / file is the CLI envelope shape (e.g.
    // the direct output of `bb build` post-#0398), extract the msg from
    // envelope.data. Older inputs that are already `{typeUrl, value}` or
    // `{messages: [...]}` keep working untouched.
    if (parsed && typeof parsed === 'object' && 'ok' in parsed && 'data' in parsed) {
      if (parsed.ok === false) {
        const code = parsed.error?.code ? `[${parsed.error.code}] ` : '';
        throw new Error(
          `Deploy input is an error envelope from a prior CLI step — refusing to broadcast. ${code}${parsed.error?.message ?? 'unknown error'}`
        );
      }
      return parsed.data;
    }
    return parsed;
  } catch (err: any) {
    throw new Error(`Failed to parse msg JSON: ${err?.message || err}`);
  }
}

const LONG_DESCRIPTION = `
Create a new collection using a disposable, single-use "burner" as
the signer so you can ship a collection without bringing your own wallet.

HOW IT WORKS
  The CLI generates a fresh Cosmos keypair on every run, funds it with
  a tiny bit of dust from the indexer faucet (or manually, if you
  prefer), signs exactly one create-collection tx, and walks away.
  Ownership of the new collection is captured by --manager, which MUST
  be a bb1... address you actually control. The throwaway signer has
  no lasting authority over anything.

CRITICAL — SCOPE IS CREATE-ONLY
  This command handles CREATE-COLLECTION transactions ONLY. It will
  hard-reject any other msg type before generating a wallet or
  touching the faucet.

  Do NOT use it for, and do NOT assume it can do any of:
    • Updating an existing collection (metadata, approvals, standards,
      permissions, timelines, token ids — anything)
    • Transferring tokens or balances
    • Setting or modifying approvals of any kind
    • Changing the manager, or modifying manager permissions
    • Future updates to a collection it previously created
    • Anything that requires a persistent signer identity

  The whole reason this flow works is that the collection's "manager"
  is a separate field from the "creator" (tx signer). Every future
  action on that collection has to come from the manager — i.e. YOU,
  not the burner. Once the create tx lands, the burner is
  done; the SDK does not and will not pretend otherwise.

CRITICAL — DUST ONLY, NEVER REAL FUNDS
  Hot wallets are written to disk in PLAINTEXT under
  ~/.bitbadges/burners/ (mode 0600). They exist for one purpose:
  holding just enough to pay for a single broadcast + fees. That is
  the entire security model.

  Do NOT:
    • Send meaningful amounts to these addresses
    • Reuse them as a personal wallet
    • Treat them as anything other than one-shot, fire-and-forget
    • Leave the burner directory in a shared or backed-up location
      you don't fully control

  If you accidentally funded one with more than dust, use
  \`bitbadges-cli burner sweep <selector> --to <your-real-address>\`
  to pull the balance back out immediately.

ADVANTAGES
  • Zero wallet setup — no keys to generate, no seed phrases to guard,
    no browser extension, no \`bitbadgeschaind keys add\`.
  • Works cleanly from agents, CI, and one-shot scripts. Non-TTY runs
    skip the picker and use a fresh wallet each time.
  • Collection ownership lives on YOUR --manager address from the
    very first block — there is no "transfer ownership" follow-up
    step to forget about, and nothing is orphaned if the CLI crashes
    mid-run (state is persisted to disk before every irreversible
    action).
  • Unified auth: fund via the indexer faucet with a single API key
    on testnet/mainnet, or manually from your own wallet if the
    faucet is too stingy.

DISADVANTAGES
  • Plaintext key storage — anyone with read access to your
    ~/.bitbadges/burners/ directory can spend whatever dust is
    left in those wallets. This is a deliberate tradeoff for
    recoverability; it is unacceptable for anything but dust.
  • CREATE ONLY. Full stop. If your flow needs to update, transfer,
    approve, or touch manager permissions, you need a real wallet.
  • Requires a funded faucet (or manual funding) to work, so it's
    not offline-capable.
  • Each run leaves a tiny on-chain footprint (a new account) that
    you can't efficiently clean up.

TYPICAL USAGE
  Pipe a builder's JSON straight in:

    bitbadges-cli build subscription --interval monthly \\
        --price 10 --denom USDC --recipient bb1your-payout... \\
      | bitbadges-cli deploy --burner --msg-stdin \\
          --manager bb1your-real-address... --local

  Or pass a file:

    bitbadges-cli deploy --burner --msg-file col.json \\
        --manager bb1your-real-address... --testnet

RELATED
  bitbadges-cli burner list                 — see every saved
  bitbadges-cli burner resume <selector>    — retry a paused run
  bitbadges-cli burner sweep  <selector>    — recover dust
  bitbadges-cli burner forget <selector>    — delete recovery file
`.trim();

export const deployCommand = new Command('deploy')
  .description(LONG_DESCRIPTION)
  .summary('Broadcast a msg. Pick one path: --burner (throwaway signer) or --browser (your wallet via /sign handoff).')
  .usage(' ')
  .argument('[input]', 'Msg JSON file path, "-" for stdin, or inline JSON')
  // Path selection. Exactly one of --burner / --browser must be set;
  // the action handler enforces this. Leaves room for future paths
  // (`--from <key>` for chain-binary signing, `--api-broadcast` for
  // posting a pre-signed tx) without making any of them the silent
  // default.
  .option('--burner', 'Use the throwaway burner-wallet path (CREATE-ONLY). Requires --manager.')
  .option('--browser', 'Hand off to the BitBadges /sign page in the browser; sign with your connected wallet (Keplr / MetaMask / etc.).')
  .option('--with-keyring', 'Emit the `bitbadgeschaind tx ...` one-liner to sign with a chain-binary keyring. Requires --from. Prints rather than spawns by default — pair with --exec to run the command in place.')
  .option('--exec', 'With --with-keyring: actually run the printed `bitbadgeschaind tx ...` command rather than printing it. Inherits your TTY so keyring password prompts work, captures the txhash, and emits the same JSON envelope as --burner/--browser. Multi-msg txs run sequentially (NOT atomic) — see warning at runtime.')
  .option('--from <name>', 'With --with-keyring: keyring identity to sign as (e.g. "alice"). Maps to the binary\'s --from flag.')
  .option('--binary <name>', 'With --with-keyring: chain binary name on PATH', 'bitbadgeschaind')
  .option('--keyring-backend <backend>', 'With --with-keyring: keyring backend (os | file | test | pass | kwallet)', 'os')
  .option('--gas-adjustment <n>', 'With --with-keyring: gas-adjustment passthrough', '1.3')
  .option('--frontend-url <url>', 'With --browser: override the frontend base URL (defaults vary by network).')
  .option('--no-open', 'With --browser: print the sign URL to stderr instead of auto-launching the browser.')
  .option('--timeout <seconds>', 'With --browser: how long to wait for the wallet to confirm (default 300, max 1800).')
  .option('--port <n>', 'With --browser: pin the loopback listener port (default: random). Use this for SSH-forwarded dev setups.')
  .option('--expected-address <addr>', 'With --browser: bb1.../0x... that the connected wallet must match. Defaults to --manager.')
  .option('--sign-only', 'With --browser: have the wallet SIGN the tx but not broadcast. Returns the signed tx bytes to the CLI so the caller can broadcast on its own (retry, batch, custodial submit). Result lands in stdout JSON as `signedTx`.')
  .option('--msg-file <path>', 'Read msg JSON from a file')
  .option('--msg-stdin', 'Read msg JSON from stdin')
  .option('--manager <address>', 'Address that will own the created collection (bb1...). Required for --burner; recommended for --browser.')
  .option('--fund <mode>', 'With --burner: funding source for the burner (faucet | manual)', 'faucet')
  .option('--fee <amount>', 'Fee amount in base units (e.g. "0" or "5000")', '0')
  .option('--fee-denom <symbol|denom>', 'Fee denom. BADGE, USDC, … or canonical denom (ubadge, ibc/...)', 'ubadge')
  .option('--gas <number>', 'Gas limit', '400000')
  .option('--new', 'With --burner: skip the picker and always create a fresh burner')
  .option('--reuse <selector>', 'With --burner: reuse a specific saved burner by address or recovery file path')
  .option('--non-interactive', 'With --burner: never prompt; on any prompt point, save state and exit for later resume. Also forced when stdout is not a TTY.')
  .option('--poll-timeout <seconds>', 'With --burner: seconds to wait for funding to land before prompting/exiting', '60')
  .option(
    '--wait-for-indexer [timeout-ms]',
    'After broadcast: poll the indexer until the created entity (collection / dynamic store) is visible, or until [timeout-ms] elapses (default 30000ms). Skipped when the tx has no recognizable entity id.'
  )
  .option('--dry-run', 'Simulate the tx and print expected gas + balance changes; never broadcast.')
  // --message + --gen-payload: absorbed modes from the v1 standalone
  // `sign-with-browser` and `gen-tx-payload` commands (#0399). The former
  // hands an arbitrary message to a browser wallet for personal-sign;
  // the latter produces a signable tx payload from a msg JSON without
  // signing or broadcasting. Both stay registered as deprecated
  // top-level aliases for one release.
  .option('--message <text>', 'With --browser: hand this message to the wallet for personal sign (no tx). Use with --message-file or a stdin pipe for long messages.')
  .option('--message-file <path>', 'With --browser --message: read the message text from a file ("-" for stdin)')
  .option('--gen-payload', 'Produce a signable tx payload (signDirect / legacyAmino / evmTx) without signing or broadcasting. Output mirrors createTransactionPayload() — pipe into any external signer (ethers, viem, hardware).')
  // gen-payload-specific knobs. Mostly mirror gen-tx-payload's surface;
  // duplication is intentional — keeps `deploy --gen-payload` self-contained
  // and discoverable from one --help.
  .option('--evm-from <0x...>', 'With --gen-payload: use this EVM address for the evmTx payload alongside a bb1 sender. Implies --with-evm-tx.')
  .option('--with-evm-tx', 'With --gen-payload: force-emit the evmTx precompile call alongside Cosmos payloads.')
  .option('--public-key <b64>', 'With --gen-payload: base64 compressed pubkey. Required if --no-fetch or account not yet on-chain.')
  .option('--account-number <n>', 'With --gen-payload: override account number (skip indexer round-trip).')
  .option('--sequence <n>', 'With --gen-payload: override sequence (skip indexer round-trip).')
  .option('--chain-id <id>', 'With --gen-payload: Cosmos chain ID override (default per network).')
  .option('--memo <text>', 'With --gen-payload: optional tx memo', '')
  .option('--no-fetch', 'With --gen-payload: skip the indexer account-info round-trip; require --account-number, --sequence, and --public-key.');
addNetworkOptions(deployCommand);
deployCommand.action(async (input: string | undefined, opts: any) => {
  // 0a. --gen-payload mode (absorbed from v1 `gen-tx-payload`) — produce
  // a fully-populated signable tx payload from a msg JSON and exit. No
  // wallet, no broadcast. Forwards to the gen-tx-payload action below so
  // the implementation stays in one place.
  if (opts.genPayload) {
    if (opts.burner || opts.browser || opts.withKeyring) {
      process.stderr.write('Error: --gen-payload does not sign or broadcast; cannot combine with --burner / --browser / --with-keyring.\n');
      process.exit(2);
    }
    if (!opts.from) {
      process.stderr.write('Error: --gen-payload requires --from <address>. Pass a bb1.../0x... signer; account info is auto-fetched from the indexer.\n');
      process.exit(2);
    }
    const { runGenPayload } = await import('./gen-tx-payload.js');
    await runGenPayload(input, opts);
    return;
  }

  // 0b. --browser --message mode (absorbed from v1 `sign-with-browser`)
  // — hand an arbitrary message to a connected wallet for personal-sign
  // and return the signature/address as JSON. No tx, no chain side-effect.
  if (opts.message || opts.messageFile) {
    if (!opts.browser) {
      process.stderr.write('Error: --message / --message-file require --browser. Personal-sign is the browser-bridge path.\n');
      process.exit(2);
    }
    if (opts.burner || opts.withKeyring) {
      process.stderr.write('Error: --message combined with --browser is mutually exclusive with --burner / --with-keyring.\n');
      process.exit(2);
    }
    const { runBrowserPersonalSign } = await import('./sign-with-browser.js');
    await runBrowserPersonalSign(input, opts);
    return;
  }

  // 0. Path selection — exactly one of --burner / --browser / --with-keyring.
  const useBurner = Boolean(opts.burner);
  const useBrowser = Boolean(opts.browser);
  const useKeyring = Boolean(opts.withKeyring);
  const pathsPicked = [useBurner, useBrowser, useKeyring].filter(Boolean).length;
  if (pathsPicked > 1) {
    process.stderr.write('Error: --burner, --browser, and --with-keyring are mutually exclusive.\n');
    process.exit(2);
  }
  if (pathsPicked === 0 && !opts.dryRun) {
    process.stderr.write(
      'Error: pick a deploy path — --burner (throwaway signer), --browser (connected wallet via /sign), --with-keyring --from <name> (chain-binary keyring), or --gen-payload (offline signing).\n'
    );
    process.exit(2);
  }
  if (useBurner && !opts.manager) {
    process.stderr.write('Error: --burner requires --manager <bb1...>. The burner is a throwaway signer; the manager captures lasting collection ownership.\n');
    process.exit(2);
  }
  if (useKeyring && !opts.from) {
    process.stderr.write('Error: --with-keyring requires --from <name>. Pass the keyring identity to sign as.\n');
    process.exit(2);
  }
  if (opts.exec && !useKeyring) {
    process.stderr.write('Error: --exec only applies to --with-keyring. The --burner and --browser paths already broadcast.\n');
    process.exit(2);
  }

  // 1. Resolve network + endpoints. `getApiUrl` asserts network
  // availability (testnet-offline gate), which the keyring path doesn't
  // need — keyring talks to the chain RPC directly, never the indexer.
  // Resolve lazily so `--with-keyring --testnet` works against a private
  // testnet RPC without flipping BITBADGES_TESTNET_OFFLINE.
  const networkName = resolveNetwork(opts);
  // The CLI's `mainnet | local | testnet` types line up 1:1 with the
  // signing client's NetworkMode; assert here so the compiler is happy.
  const network: BurnerNetwork = networkName as NetworkMode;
  const apiUrl = useKeyring ? '' : getApiUrl(opts);
  const nodeUrl = opts.nodeUrl || NETWORK_CONFIGS[network].nodeUrl;
  const apiKey = useKeyring ? undefined : getApiKeyForNetwork(opts);

  if (useBurner && opts.fund === 'faucet' && !apiKey && network !== 'local') {
    process.stderr.write(
      'Warning: --fund faucet requires an API key on non-local networks. Set BITBADGES_API_KEY or `bitbadges-cli config set apiKey <key>`.\n'
    );
  }

  // 2. Load msg JSON. Accept two shapes:
  //   - Single Msg:   { typeUrl, value }
  //   - Tx wrapper:   { messages: [{typeUrl, value}, ...] }
  // Internally we normalize to an array. Single-msg actions (most of the
  // CLI) emit shape 1; multi-msg actions (bounty accept/deny) emit shape 2.
  let rawInput: any;
  try {
    rawInput = readMsgInput({ msgFile: opts.msgFile, msgStdin: opts.msgStdin, input });
  } catch (err: any) {
    process.stderr.write(`${err?.message || err}\n`);
    process.exit(2);
  }

  let messages: any[];
  if (rawInput && typeof rawInput === 'object' && Array.isArray(rawInput.messages)) {
    messages = rawInput.messages;
    if (messages.length === 0) {
      process.stderr.write('Deploy input has an empty `messages` array — nothing to broadcast.\n');
      process.exit(2);
    }
  } else if (
    rawInput &&
    typeof rawInput === 'object' &&
    typeof rawInput.typeUrl === 'string' &&
    rawInput.value
  ) {
    messages = [rawInput];
  } else {
    const got =
      rawInput == null
        ? String(rawInput)
        : Array.isArray(rawInput)
          ? `array (length ${rawInput.length})`
          : typeof rawInput === 'object'
            ? `object with keys [${Object.keys(rawInput).join(', ')}]`
            : typeof rawInput;
    process.stderr.write(
      `Deploy input has an unexpected shape — expected a single Msg \`{typeUrl, value}\` or a tx wrapper \`{messages: [{typeUrl, value}, ...]}\`.\n` +
        `Got: ${got}.\n`
    );
    process.exit(2);
  }

  // Validate each msg in the array has the {typeUrl, value} shape.
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m !== 'object' || typeof m.typeUrl !== 'string' || !m.value) {
      process.stderr.write(
        `Deploy input: message[${i}] is missing \`typeUrl\` or \`value\`. Got: ${JSON.stringify(m)?.slice(0, 100) ?? String(m)}\n`
      );
      process.exit(2);
    }
  }

  // Most legacy paths (burner, dry-run, browser) take a single msg.
  // Keep `msg` as the first one for those branches; the keyring branch
  // handles the full array.
  const msg: any = messages[0];
  const isMultiMsg = messages.length > 1;

  // 2.5 --dry-run short-circuit: simulate the tx and exit before any
  // wallet is generated, funding is requested, or broadcast happens.
  // Backfill the manager so the simulation matches what `runBurnerCreate`
  // would broadcast (the orchestrator does the same backfill internally).
  if (opts.dryRun) {
    if (!apiKey && network !== 'local') {
      process.stderr.write(
        '--dry-run requires an API key on non-local networks (simulate hits the BitBadges API). ' +
          'Set BITBADGES_API_KEY or `bitbadges-cli config set apiKey <key>`.\n'
      );
      process.exit(2);
    }
    if (msg && msg.value && opts.manager && !msg.value.manager) {
      msg.value.manager = opts.manager;
    }

    const { simulateMessages } = await import('../../builder/tools/queries/simulateTransaction.js');
    const { renderSimulate } = await import('../utils/terminal.js');
    const { prefetchSimulateCollections } = await import('../utils/simulateSymbols.js');
    try {
      const result = await simulateMessages({
        messages: [msg],
        apiKey: apiKey || '',
        apiUrl
      });
      const { emit, commentary, isQuiet } = await import('../utils/envelope.js');
      if (!isQuiet()) {
        const collectionCache = await prefetchSimulateCollections(result, { apiKey: apiKey || '', apiUrl });
        commentary(renderSimulate(result, { stream: process.stderr, events: 'count', collectionCache }));
      }
      emit({ dryRun: true, ...result });
      if (!result.success || result.valid === false) process.exit(1);
      process.exit(0);
    } catch (err: any) {
      const { emitError } = await import('../utils/envelope.js');
      emitError(err, { code: 'dry_run_failed', exitCode: 1 });
    }
  }

  // 2.7 --browser short-circuit: hand off to the BitBadges /sign page,
  // let the user's connected wallet sign and broadcast, capture the tx
  // hash on the loopback listener. Frontend-side TxModal handles
  // account number / sequence / gas / fees auto-fetch from the indexer.
  // Multi-msg txs are passed through as-is — /sign supports the array.
  if (useBrowser) {
    // Backfill manager only on a single-msg create-collection (legacy
    // single-msg shape). Multi-msg txs are application-built and
    // shouldn't be mutated post-hoc.
    if (!isMultiMsg && msg && msg.value && opts.manager && !msg.value.manager) {
      msg.value.manager = opts.manager;
    }
    const { bridgeSign, resolveFrontendUrl } = await import('../auth/browser-bridge.js');
    const frontendUrl = resolveFrontendUrl(networkName, opts.frontendUrl);
    const expectedAddress = opts.expectedAddress ?? opts.manager;
    const requestedTimeoutSec = opts.timeout ? Math.min(1800, Math.max(60, Number(opts.timeout))) : 300;
    process.stderr.write(`\nOpening browser to ${frontendUrl}/sign for wallet signature + broadcast...\n`);
    try {
      const result = await bridgeSign({
        mode: 'tx',
        payload: {
          chain: 'cosmos',
          txsInfo: messages.map((m: any) => ({ type: m.typeUrl, msg: m.value })),
          expectedAddress,
          signOnly: !!opts.signOnly,
        },
        baseUrl: apiUrl,
        frontendUrl,
        apiKey,
        timeoutMs: requestedTimeoutSec * 1000,
        noOpen: opts.open === false,
        port: opts.port ? Number(opts.port) : undefined,
      });
      if (result.error) {
        process.stderr.write(`Browser broadcast cancelled or rejected: ${result.error}\n`);
        process.exit(1);
      }
      const payload: any = opts.signOnly
        ? {
            success: !!result.signedTx,
            path: 'browser',
            mode: 'sign-only',
            signedTx: result.signedTx ?? null,
            chain: result.chain ?? 'cosmos',
          }
        : {
            success: !!result.hash,
            path: 'browser',
            mode: 'sign-and-broadcast',
            txHash: result.hash ?? null,
            chain: result.chain ?? 'cosmos',
          };

      // Optional: hold the CLI open until the indexer surfaces whatever
      // the tx created. Browser flow doesn't return tx events inline, so
      // we re-fetch the tx from the Cosmos LCD using the returned hash,
      // pull the first recognizable entity id (collection / store), and
      // poll the indexer for it. Sign-only short-circuits — there is no
      // broadcast to wait on.
      const waitTimeoutMsBrowser = parseWaitFlag(opts.waitForIndexer);
      if (
        waitTimeoutMsBrowser !== undefined &&
        !opts.signOnly &&
        payload.success &&
        result.hash &&
        result.chain !== 'evm'
      ) {
        const waitStart = Date.now();
        const events = await fetchTxEvents(nodeUrl, result.hash);
        const target = extractEntityFromEvents(events);
        if (target) {
          const remaining = Math.max(1_000, waitTimeoutMsBrowser - (Date.now() - waitStart));
          process.stderr.write(
            `Waiting for indexer to surface ${target.entity} ${target.id} (timeout ${remaining}ms)...\n`
          );
          const waited = await waitForIndexer(target, { apiUrl, apiKey, timeoutMs: remaining });
          if (waited.ok) {
            process.stderr.write(summarizeIndexerHit(waited) + '\n');
          } else {
            process.stderr.write(
              `Indexer didn't catch up within ${waitTimeoutMsBrowser}ms — the tx broadcast succeeded, your ${target.entity} may show up shortly.\n`
            );
          }
          payload.waited = {
            entity: waited.entity,
            id: waited.id,
            attempts: waited.attempts,
            elapsedMs: waited.elapsedMs,
            ok: waited.ok,
            ...(waited.ok ? { body: waited.body } : { lastStatus: waited.lastStatus })
          };
        } else {
          process.stderr.write(
            `--wait-for-indexer: no recognizable entity id in tx events (likely a non-create msg). Skipping wait.\n`
          );
        }
      }

      const { emit, emitError } = await import('../utils/envelope.js');
      emit(payload);
      process.exit(payload.success ? 0 : 1);
      // (emitError unreachable below; reserved for catch.)
      void emitError;
    } catch (err: any) {
      const { emitError } = await import('../utils/envelope.js');
      emitError(err, { code: 'browser_broadcast_failed', exitCode: 1 });
    }
  }

  // 2.8 --with-keyring short-circuit: emit the bitbadgeschaind tx
  // one-liner the user should run. Does not spawn the binary, sign, or
  // broadcast — see cli/utils/keyring-command.ts for rationale.
  if (useKeyring) {
    // Honor an explicit --gas if the user set it; otherwise default to
    // `auto` so --gas-adjustment is meaningful. The deploy-level default
    // of '400000' is the right value for in-process burner signing, not
    // for the chain binary's estimation flow.
    const gasSource = deployCommand.getOptionValueSource('gas');
    const gas = gasSource === 'default' || gasSource === undefined ? 'auto' : String(opts.gas);
    const sharedKeyringOpts = {
      from: String(opts.from),
      network: networkName,
      binary: String(opts.binary ?? 'bitbadgeschaind'),
      keyringBackend: String(opts.keyringBackend ?? 'os'),
      gas,
      gasAdjustment: String(opts.gasAdjustment ?? '1.3'),
      manager: opts.manager ? String(opts.manager) : undefined
    };

    let commandLine: string;
    let msgFilePaths: string[];
    try {
      if (isMultiMsg) {
        const r = buildKeyringMultiCommand({ ...sharedKeyringOpts, messages });
        commandLine = r.commandLine;
        msgFilePaths = r.msgFilePaths;
      } else {
        const r = buildKeyringCommand({ msg, ...sharedKeyringOpts });
        commandLine = r.commandLine;
        msgFilePaths = [r.msgFilePath];
      }
    } catch (err: any) {
      process.stderr.write(`${err?.message || err}\n`);
      process.exit(2);
    }

    const useExec = Boolean(opts.exec);

    // Print-only path (legacy default): emit the command + helper notes
    // and exit. The user copy/pastes to broadcast.
    if (!useExec) {
      const { emit, commentary } = await import('../utils/envelope.js');
      if (isMultiMsg) {
        const filesNote =
          msgFilePaths.length > 0
            ? `Wrote ${msgFilePaths.length} msg JSON file(s):\n  ${msgFilePaths.join('\n  ')}\n`
            : '';
        commentary(`\n${filesNote}Multi-msg tx — chain-binary's tx subcommands only take one msg, so the\nbelow runs them in sequence with a 6s sleep between blocks to avoid\nsequence-skew. NOT atomic: if a later step fails, earlier steps remain\non-chain. For atomic multi-msg, use --burner or --browser.\n\nRun:`);
      } else {
        commentary(`\nWrote msg JSON to ${msgFilePaths[0]}\nRun:`);
      }
      const flagsHint = isMultiMsg
        ? 'Append extra flags inside any step (e.g. --fees 5000ubadge --memo "...").'
        : 'Append extra flags after the line (e.g. --fees 5000ubadge --memo "...").';
      commentary(commandLine);
      commentary(
        `  ${flagsHint}\n  Use --keyring-backend test for non-interactive CI signing.\n  Or pass --exec to run the command in place (TTY-friendly).`
      );
      emit({ commandLine, msgFilePaths, mode: 'print-only', multiMsg: isMultiMsg });
      process.exit(0);
    }

    // --exec path: run the printed command in place and emit a JSON
    // envelope that matches the burner/browser shape. stdin + stderr
    // inherit so keyring password prompts work; stdout is captured so
    // we can pluck the txhash(es). Multi-msg note still applies — the
    // sub-txs are sequenced with 6s sleeps, NOT atomic.
    if (isMultiMsg && !process.env.BB_QUIET) {
      process.stderr.write(
        '\nMulti-msg --exec: running ' + messages.length + ' sequential tx(s) with 6s sleeps between blocks.\n' +
          'NOT atomic — if a later step fails on-chain, earlier steps stay committed.\n' +
          'For atomic multi-msg, use --browser instead.\n\n'
      );
    } else if (!process.env.BB_QUIET) {
      process.stderr.write(`\nExecuting (msg JSON at ${msgFilePaths[0]})...\n\n`);
    }

    const execResult = execKeyringScript(commandLine);
    const txHashMatches = [...execResult.stdout.matchAll(/txhash:\s*([A-F0-9]+)/gi)];
    const hashes = txHashMatches.map((m) => m[1]);

    if (execResult.status !== 0 || hashes.length === 0) {
      process.stderr.write(
        `\n--exec failed (chain-binary exit ${execResult.status}, ${hashes.length} txhash(es) parsed from stdout).\n` +
          (execResult.stdout ? `--- stdout (first 800 chars) ---\n${execResult.stdout.slice(0, 800)}\n` : '')
      );
      process.exit(1);
    }

    // Fetch the full tx result for each broadcasted tx so the envelope
    // carries code / height / events. The chain-binary's exit code only
    // reflects broadcast success — the tx itself may still have a
    // non-zero on-chain `code`.
    const [primaryHash, ...extraHashes] = hashes;
    const primaryResult = await fetchTxResult(nodeUrl, primaryHash);
    const additionalTxs: Array<{ txHash: string; code: number; height: number; rawLog?: string }> = [];
    for (const h of extraHashes) {
      const r = await fetchTxResult(nodeUrl, h);
      additionalTxs.push({
        txHash: h,
        code: r?.code ?? -1,
        height: r?.height ?? 0,
        rawLog: r?.rawLog
      });
    }

    const allCodesOk = (primaryResult?.code ?? -1) === 0 && additionalTxs.every((t) => t.code === 0);
    const payload: any = {
      success: allCodesOk,
      path: 'keyring',
      mode: 'sign-and-broadcast',
      txHash: primaryHash,
      chain: 'cosmos',
      code: primaryResult?.code,
      height: primaryResult?.height,
      rawLog: primaryResult?.rawLog,
      ...(additionalTxs.length > 0 ? { additionalTxs } : {})
    };

    // Optional indexer wait (matches burner/browser parity). Uses events
    // from the primary tx to extract the entity id.
    const waitTimeoutMsKeyring = parseWaitFlag(opts.waitForIndexer);
    if (waitTimeoutMsKeyring !== undefined && payload.success && primaryResult?.events) {
      const target = extractEntityFromEvents(primaryResult.events);
      if (target) {
        const realApiUrl = getApiUrl(opts);
        const realApiKey = getApiKeyForNetwork(opts);
        process.stderr.write(
          `Waiting for indexer to surface ${target.entity} ${target.id} (timeout ${waitTimeoutMsKeyring}ms)...\n`
        );
        const waited = await waitForIndexer(target, {
          apiUrl: realApiUrl,
          apiKey: realApiKey,
          timeoutMs: waitTimeoutMsKeyring
        });
        if (waited.ok) {
          process.stderr.write(summarizeIndexerHit(waited) + '\n');
        } else {
          process.stderr.write(
            `Indexer didn't catch up within ${waitTimeoutMsKeyring}ms — the tx broadcast succeeded, your ${target.entity} may show up shortly.\n`
          );
        }
        payload.waited = {
          entity: waited.entity,
          id: waited.id,
          attempts: waited.attempts,
          elapsedMs: waited.elapsedMs,
          ok: waited.ok,
          ...(waited.ok ? { body: waited.body } : { lastStatus: waited.lastStatus })
        };
      } else {
        process.stderr.write(
          `--wait-for-indexer: no recognizable entity id in tx events (likely a non-create msg). Skipping wait.\n`
        );
      }
    }

    const { emit } = await import('../utils/envelope.js');
    emit(payload);
    process.exit(payload.success ? 0 : 1);
  }

  // Burner path is CREATE-ONLY (the wallet is throwaway and dust-funded
  // exactly for one create-collection tx). Multi-msg txs aren't part of
  // that flow and would silently use the wrong gas / wrong manager
  // backfill if we let them through.
  if (useBurner && isMultiMsg) {
    process.stderr.write(
      'Error: --burner does not support multi-msg txs (it is CREATE-ONLY).\n' +
        'For multi-msg actions like bounty accept/deny, use --browser (atomic) or --with-keyring (sequential).\n'
    );
    process.exit(2);
  }

  // 3. Wallet picker (interactive on TTY, bypassed otherwise or via flags)
  const choice = await pickBurner({
    network,
    nodeUrl,
    forceNew: Boolean(opts.new),
    reuseSelector: opts.reuse
  });

  // 4. Drive the orchestrator
  try {
    const result = await runBurnerCreate({
      msg,
      network,
      apiUrl,
      nodeUrl,
      manager: opts.manager,
      fund: opts.fund === 'manual' ? 'manual' : 'faucet',
      apiKey,
      fee: { amount: String(opts.fee), denom: requireBbDenom(String(opts.feeDenom || 'ubadge'), '--fee-denom') },
      gas: Number(opts.gas),
      reuseRecord: choice.kind === 'reuse' ? choice.record : undefined,
      nonInteractive: Boolean(opts.nonInteractive) || !process.stdout.isTTY,
      pollTimeoutMs: Number(opts.pollTimeout) * 1000
    });

    // Targeted hint:" — when the burner failed because the hot wallet
    // came up short on dust (faucet refused, manual funding too small,
    // or the wallet got swept between funding and broadcast), the
    // recovery path is always the same: pull what's left out via
    // `burner sweep` so it doesn't get lost in a one-shot wallet.
    const errStr = String(result.error ?? '').toLowerCase();
    const looksLikeInsufficient =
      errStr.includes('insufficient') || errStr.includes('not enough') || errStr.includes('balance');
    const hint = looksLikeInsufficient && result.ephemeralAddress
      ? `Run \`bitbadges-cli burner sweep ${result.ephemeralAddress} --to <your-real-address>\` to recover dust, or wait for the faucet to refill.`
      : undefined;

    // Optional: hold the CLI open until the indexer has caught up with
    // the broadcast. The burner flow is CREATE-COLLECTION-only, so the
    // entity is always `collection` keyed by the returned collectionId
    // (which itself comes from a brief LCD poll inside runBurnerCreate).
    // If no id surfaced, skip — we'd be polling for an entity the chain
    // never emitted.
    let waited: WaitForIndexerResult | undefined;
    const waitTimeoutMs = parseWaitFlag(opts.waitForIndexer);
    if (result.success && waitTimeoutMs !== undefined && result.collectionId) {
      const target: ExtractedEntity = { entity: 'collection', id: result.collectionId };
      process.stderr.write(
        `Waiting for indexer to surface ${target.entity} ${target.id} (timeout ${waitTimeoutMs}ms)...\n`
      );
      waited = await waitForIndexer(target, { apiUrl, apiKey, timeoutMs: waitTimeoutMs });
      if (waited.ok) {
        process.stderr.write(summarizeIndexerHit(waited) + '\n');
      } else {
        process.stderr.write(
          `Indexer didn't catch up within ${waitTimeoutMs}ms — the tx broadcast succeeded, your ${target.entity} may show up shortly.\n`
        );
      }
    }

    const payload: any = {
      success: result.success,
      ephemeralAddress: result.ephemeralAddress,
      recoveryPath: result.recoveryPath,
      txHash: result.txHash,
      collectionId: result.collectionId ?? null,
      paused: result.paused,
      error: result.error,
      ...(hint ? { hint } : {})
    };
    if (waited) {
      payload.waited = {
        entity: waited.entity,
        id: waited.id,
        attempts: waited.attempts,
        elapsedMs: waited.elapsedMs,
        ok: waited.ok,
        ...(waited.ok ? { body: waited.body } : { lastStatus: waited.lastStatus })
      };
    }
    const { emit } = await import('../utils/envelope.js');
    emit(payload);
    if (!result.success && !result.paused) process.exit(1);
    if (result.paused) process.exit(0);
  } catch (err: any) {
    const { emitError } = await import('../utils/envelope.js');
    emitError(err, { code: 'broadcast_failed', exitCode: 1 });
  }
});
