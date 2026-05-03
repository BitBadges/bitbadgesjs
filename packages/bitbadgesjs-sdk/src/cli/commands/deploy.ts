/**
 * `bitbadges-cli deploy --burner`
 *
 * Broadcasts a transaction. Today only the `--burner` path is implemented —
 * a throwaway ephemeral wallet is generated per-run, persisted to
 * `~/.bitbadges/burners/`, funded via the indexer faucet (or manually),
 * and signs exactly one create-collection tx. Collection ownership is
 * captured by the `manager` field on the msg, so the burner has no
 * lasting authority. The required `--burner` flag reserves space for
 * future deploy paths (`--from <key>` for chain-binary signing,
 * `--api-broadcast` for posting a pre-signed tx) without breaking
 * existing scripts.
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
import * as fs from 'fs';

import { addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import { runBurnerCreate, pickBurner, type BurnerNetwork } from '../utils/burner.js';

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
    return JSON.parse(raw);
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
  .summary('Broadcast a create-collection msg. Today: --burner is the only supported path.')
  .usage(' ')
  .argument('[input]', 'Msg JSON file path, "-" for stdin, or inline JSON')
  // Required path flag. Only `--burner` is implemented today; the flag
  // is required-explicit to leave room for future paths (`--from <key>`
  // for chain-binary signing, `--api-broadcast` for posting a pre-signed
  // tx) without making any of them the silent default.
  .requiredOption('--burner', 'Use the throwaway burner-wallet path. Currently the only supported deploy path.')
  .option('--msg-file <path>', 'Read msg JSON from a file')
  .option('--msg-stdin', 'Read msg JSON from stdin')
  .requiredOption('--manager <address>', 'Address that will own the created collection (bb1...). Required — refuses to create orphaned collections.')
  .option('--fund <mode>', 'Funding source for the burner: faucet | manual', 'faucet')
  .option('--fee <amount>', 'Fee amount in base units (e.g. "0" or "5000")', '0')
  .option('--fee-denom <denom>', 'Fee denom', 'ubadge')
  .option('--gas <number>', 'Gas limit', '400000')
  .option('--new', 'Skip the picker and always create a fresh burner')
  .option('--reuse <selector>', 'Reuse a specific saved burner by address or recovery file path')
  .option('--non-interactive', 'Never prompt; on any prompt point, save state and exit for later resume. Also forced when stdout is not a TTY.')
  .option('--poll-timeout <seconds>', 'Seconds to wait for funding to land before prompting/exiting', '60');
addNetworkOptions(deployCommand);
deployCommand.action(async (input: string | undefined, opts: any) => {
  // 1. Resolve network + endpoints
  const networkName = resolveNetwork(opts);
  // The CLI's `mainnet | local | testnet` types line up 1:1 with the
  // signing client's NetworkMode; assert here so the compiler is happy.
  const network: BurnerNetwork = networkName as NetworkMode;
  const apiUrl = getApiUrl(opts);
  const nodeUrl = opts.nodeUrl || NETWORK_CONFIGS[network].nodeUrl;
  const apiKey = getApiKeyForNetwork(opts);

  if (opts.fund === 'faucet' && !apiKey && network !== 'local') {
    process.stderr.write(
      'Warning: --fund faucet requires an API key on non-local networks. Set BITBADGES_API_KEY or `bitbadges-cli config set apiKey <key>`.\n'
    );
  }

  // 2. Load msg JSON
  let msg: any;
  try {
    msg = readMsgInput({ msgFile: opts.msgFile, msgStdin: opts.msgStdin, input });
  } catch (err: any) {
    process.stderr.write(`${err?.message || err}\n`);
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
      fee: { amount: String(opts.fee), denom: String(opts.feeDenom || 'ubadge') },
      gas: Number(opts.gas),
      reuseRecord: choice.kind === 'reuse' ? choice.record : undefined,
      nonInteractive: Boolean(opts.nonInteractive) || !process.stdout.isTTY,
      pollTimeoutMs: Number(opts.pollTimeout) * 1000
    });

    const payload = {
      success: result.success,
      ephemeralAddress: result.ephemeralAddress,
      recoveryPath: result.recoveryPath,
      txHash: result.txHash,
      collectionId: result.collectionId ?? null,
      paused: result.paused,
      error: result.error
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    if (!result.success && !result.paused) process.exit(1);
    if (result.paused) process.exit(0);
  } catch (err: any) {
    process.stderr.write(`Broadcast failed: ${err?.message || err}\n`);
    process.exit(1);
  }
});
