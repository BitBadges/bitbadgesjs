/**
 * `bitbadges-cli broadcast-with-hot-wallet`
 *
 * Broadcasts a create-collection msg using a throwaway ephemeral wallet.
 * The hot wallet is generated per-run, persisted to `~/.bitbadges/hot-wallets/`,
 * funded via the indexer faucet (or manually by the user), then signs the
 * tx. Collection ownership is captured by the `manager` field on the msg,
 * so the hot wallet has no lasting authority.
 *
 * Input is always JSON — either from `--msg-file <path>`, `--msg-stdin`,
 * or a positional file argument. The canonical happy path is to pipe a
 * template's stdout straight in:
 *
 *   bitbadges-cli builder templates subscription --interval monthly \
 *     --price 10 --denom USDC --recipient bb1... \
 *     | bitbadges-cli broadcast-with-hot-wallet --msg-stdin \
 *         --manager bb1... --local
 */

import { Command } from 'commander';
import * as fs from 'fs';

import { addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import { runHotWalletBroadcast, pickHotWallet, type HotWalletNetwork } from '../utils/hotWallet.js';

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

export const broadcastWithHotWalletCommand = new Command('broadcast-with-hot-wallet')
  .description(
    'Broadcast a create-collection msg using a throwaway hot wallet. Input is JSON (pipe a template via stdin or pass --msg-file). The hot wallet is generated on demand, funded via faucet or manually, and the collection you create is owned by --manager, not the hot wallet itself.'
  )
  .argument('[input]', 'Msg JSON file path, "-" for stdin, or inline JSON')
  .option('--msg-file <path>', 'Read msg JSON from a file')
  .option('--msg-stdin', 'Read msg JSON from stdin')
  .requiredOption('--manager <address>', 'Address that will own the created collection (bb1...). Required — refuses to create orphaned collections.')
  .option('--fund <mode>', 'Funding source for the hot wallet: faucet | manual', 'faucet')
  .option('--fee <amount>', 'Fee amount in base units (e.g. "0" or "5000")', '0')
  .option('--fee-denom <denom>', 'Fee denom', 'ubadge')
  .option('--gas <number>', 'Gas limit', '400000')
  .option('--new', 'Skip the picker and always create a fresh hot wallet')
  .option('--reuse <selector>', 'Reuse a specific saved hot wallet by address or recovery file path')
  .option('--non-interactive', 'Never prompt; on any prompt point, save state and exit for later resume. Also forced when stdout is not a TTY.')
  .option('--poll-timeout <seconds>', 'Seconds to wait for funding to land before prompting/exiting', '60');
addNetworkOptions(broadcastWithHotWalletCommand);
broadcastWithHotWalletCommand.action(async (input: string | undefined, opts: any) => {
  // 1. Resolve network + endpoints
  const networkName = resolveNetwork(opts);
  // The CLI's `mainnet | local | testnet` types line up 1:1 with the
  // signing client's NetworkMode; assert here so the compiler is happy.
  const network: HotWalletNetwork = networkName as NetworkMode;
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
  const choice = await pickHotWallet({
    network,
    nodeUrl,
    forceNew: Boolean(opts.new),
    reuseSelector: opts.reuse
  });

  // 4. Drive the orchestrator
  try {
    const result = await runHotWalletBroadcast({
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
      collectionId: result.collectionId,
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
