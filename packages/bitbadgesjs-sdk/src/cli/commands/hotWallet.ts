/**
 * `bitbadges-cli hot-wallet` — manage persisted throwaway hot wallets.
 *
 * Subcommands:
 *   - list            : print all saved hot wallets (status, balance on request)
 *   - show <selector> : print one record
 *   - resume <selector>: re-enter the broadcast flow for a pending wallet
 *   - sweep <selector> --to bb1... : bank-send remaining dust out
 *   - forget <selector>: delete the recovery file
 */

import { Command } from 'commander';

import { addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import {
  listHotWallets,
  findHotWallet,
  deleteHotWallet,
  loadHotWalletAdapter,
  fetchBalance,
  runHotWalletBroadcast,
  type HotWalletRecord,
  type HotWalletNetwork
} from '../utils/hotWallet.js';
import { BitBadgesSigningClient } from '../../signing/BitBadgesSigningClient.js';

export const hotWalletCommand = new Command('hot-wallet').description(
  'Manage throwaway hot wallets used by `broadcast-with-hot-wallet` — list, resume, sweep, forget.'
);

// ── list ─────────────────────────────────────────────────────────────────────

hotWalletCommand
  .command('list')
  .description('List all saved hot wallets')
  .option('--network <name>', 'Only show wallets for a specific network')
  .option('--json', 'Emit as JSON instead of a table')
  .action((opts: any) => {
    let wallets = listHotWallets();
    if (opts.network) wallets = wallets.filter((w) => w.network === opts.network);
    if (opts.json) {
      process.stdout.write(JSON.stringify(wallets, null, 2) + '\n');
      return;
    }
    if (wallets.length === 0) {
      process.stderr.write('No hot wallets saved.\n');
      return;
    }
    for (const w of wallets) {
      process.stdout.write(
        `${w.createdAt}  ${w.network.padEnd(7)}  ${w.status.padEnd(9)}  ${w.address}  ${w.txHash ? `tx=${w.txHash.slice(0, 12)}…` : ''}\n`
      );
    }
  });

// ── show ─────────────────────────────────────────────────────────────────────

hotWalletCommand
  .command('show')
  .description('Show the raw record for one hot wallet')
  .argument('<selector>', 'Address or recovery file path')
  .action((selector: string) => {
    const rec = findHotWallet(selector);
    if (!rec) {
      process.stderr.write(`No hot wallet found for selector: ${selector}\n`);
      process.exit(1);
    }
    // Intentionally prints the mnemonic — it's a throwaway and the user
    // may want to recover via Keplr or similar.
    process.stdout.write(JSON.stringify(rec, null, 2) + '\n');
  });

// ── resume ───────────────────────────────────────────────────────────────────

const resumeCmd = hotWalletCommand
  .command('resume')
  .description('Resume a pending hot-wallet broadcast (reuses the funded wallet, re-fetches sequence).')
  .argument('<selector>', 'Address or recovery file path')
  .requiredOption('--msg-file <path>', 'Path to the msg JSON to broadcast (same msg you originally intended)')
  .requiredOption('--manager <address>', 'Collection manager address (bb1...)')
  .option('--fund <mode>', 'Funding mode if the wallet is still unfunded', 'faucet')
  .option('--fee <amount>', 'Fee amount in base units', '0')
  .option('--fee-denom <denom>', 'Fee denom', 'ubadge')
  .option('--gas <number>', 'Gas limit', '400000')
  .option('--poll-timeout <seconds>', 'Seconds to wait for funding', '60');
addNetworkOptions(resumeCmd);
resumeCmd.action(async (selector: string, opts: any) => {
  const rec = findHotWallet(selector);
  if (!rec) {
    process.stderr.write(`No hot wallet found for selector: ${selector}\n`);
    process.exit(1);
  }
  const fs = await import('fs');
  const msg = JSON.parse(fs.readFileSync(opts.msgFile, 'utf-8'));

  const networkName = resolveNetwork({ ...opts, network: opts.network || rec.network });
  const network = networkName as HotWalletNetwork;
  if (network !== rec.network) {
    process.stderr.write(
      `Refusing to resume: wallet is on "${rec.network}" but you asked for "${network}".\n`
    );
    process.exit(1);
  }
  const apiUrl = getApiUrl({ ...opts, network });
  const nodeUrl = NETWORK_CONFIGS[network as NetworkMode].nodeUrl;
  const apiKey = getApiKeyForNetwork({ ...opts, network });

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
    reuseRecord: rec,
    nonInteractive: !process.stdout.isTTY,
    pollTimeoutMs: Number(opts.pollTimeout) * 1000
  });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.success && !result.paused) process.exit(1);
});

// ── sweep ────────────────────────────────────────────────────────────────────

const sweepCmd = hotWalletCommand
  .command('sweep')
  .description('Send the hot wallet\'s remaining balance to another address and mark it swept.')
  .argument('<selector>', 'Address or recovery file path')
  .requiredOption('--to <address>', 'Recipient address (bb1...)')
  .option('--denom <denom>', 'Coin denom to sweep', 'ubadge')
  .option('--fee <amount>', 'Fee amount', '0')
  .option('--gas <number>', 'Gas limit', '200000');
addNetworkOptions(sweepCmd);
sweepCmd.action(async (selector: string, opts: any) => {
  const rec = findHotWallet(selector);
  if (!rec) {
    process.stderr.write(`No hot wallet found for selector: ${selector}\n`);
    process.exit(1);
  }
  const network = rec.network;
  const nodeUrl = NETWORK_CONFIGS[network as NetworkMode].nodeUrl;
  const apiUrl = getApiUrl({ ...opts, network });
  const apiKey = getApiKeyForNetwork({ ...opts, network });

  const balance = await fetchBalance(nodeUrl, rec.address, opts.denom);
  if (balance === 0n) {
    process.stderr.write(`Hot wallet ${rec.address} has zero ${opts.denom} balance — nothing to sweep.\n`);
    return;
  }
  // Reserve the fee from the swept amount.
  const feeAmount = BigInt(opts.fee || '0');
  const sendAmount = balance - feeAmount;
  if (sendAmount <= 0n) {
    process.stderr.write(
      `Balance (${balance}) is not enough to cover fee (${feeAmount}) — refusing to sweep.\n`
    );
    process.exit(1);
  }

  const adapter = await loadHotWalletAdapter(rec);
  const client = new BitBadgesSigningClient({
    adapter,
    network: network as NetworkMode,
    apiUrl,
    nodeUrl,
    apiKey
  });
  client.clearCache();

  // Build a raw MsgSend shape. The signing client normalizes via
  // encodeMsgFromJson path for unknown proto msg types; MsgSend lives in
  // the cosmos.bank.v1beta1 namespace and is handled by the proto encoder
  // in createTxBroadcastBody. We pass a { typeUrl, value } shape so it
  // flows through the same JSON path the broadcast-with-hot-wallet
  // command uses.
  const { encodeMsgFromJson } = await import('../../transactions/messages/fromJson.js');
  let protoMsg;
  try {
    protoMsg = encodeMsgFromJson({
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: rec.address,
        toAddress: opts.to,
        amount: [{ denom: opts.denom, amount: sendAmount.toString() }]
      }
    });
  } catch (err: any) {
    process.stderr.write(
      `Sweep is only supported for tokenization-module msgs today; MsgSend encoding failed: ${err?.message || err}\n` +
        `Workaround: import the mnemonic from ${rec.filePath} into Keplr and transfer manually.\n`
    );
    process.exit(1);
  }

  const result = await client.signAndBroadcast([protoMsg], {
    fee: { amount: opts.fee || '0', denom: opts.denom, gas: String(opts.gas) },
    simulate: false
  });
  if (!result.success) {
    process.stderr.write(`Sweep failed: ${result.error}\n`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify({ success: true, txHash: result.txHash, swept: sendAmount.toString() }, null, 2) + '\n');
});

// ── forget ───────────────────────────────────────────────────────────────────

hotWalletCommand
  .command('forget')
  .description('Delete the recovery file for a hot wallet (the on-chain wallet still exists).')
  .argument('<selector>', 'Address or recovery file path')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (selector: string, opts: any) => {
    const rec = findHotWallet(selector);
    if (!rec || !rec.filePath) {
      process.stderr.write(`No hot wallet found for selector: ${selector}\n`);
      process.exit(1);
    }
    if (!opts.yes) {
      const readline = await import('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
      const answer = await new Promise<string>((resolve) => {
        rl.question(`Delete recovery file ${rec.filePath}? [y/N] `, (a: string) => resolve(a.trim().toLowerCase()));
      });
      rl.close();
      if (answer !== 'y' && answer !== 'yes') {
        process.stderr.write('Aborted.\n');
        return;
      }
    }
    deleteHotWallet(rec.filePath!);
    process.stderr.write(`Deleted ${rec.filePath}\n`);
  });

// Reference these to silence unused-import lint for types that downstream
// consumers may want to pull off the command module.
export type { HotWalletRecord };
