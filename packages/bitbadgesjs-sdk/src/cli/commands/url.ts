/**
 * `bitbadges-cli url` — resolve canonical BitBadges URLs.
 *
 * Subcommands:
 *   - tx <hash>                 EVM Blockscout explorer URL
 *   - tx-cosmos <hash>          ping.pub Cosmos explorer URL (Cosmos-format)
 *   - collection <id>           bitbadges.io collection page
 *   - badge <id> <tokenId>      bitbadges.io badge page (collection + token)
 *   - address <addr>            bitbadges.io account page
 *
 * Pure-formatter — no API call, no signing. `--testnet` flips to testnet
 * URLs across the board.
 */

import { Command } from 'commander';
import * as fs from 'node:fs';

interface OutputFlags { outputFile?: string; condensed?: boolean; raw?: boolean; }
interface NetworkFlags { testnet?: boolean; }

function addNetworkFlag(cmd: Command): Command {
  return cmd.option('--testnet', 'Resolve testnet URLs instead of mainnet', false);
}
function addOutputFlags(cmd: Command): Command {
  return cmd
    .option('--output-file <path>', 'Write output to file')
    .option('--condensed', 'Single-line JSON', false)
    .option('--raw', 'Emit only the URL on stdout (no JSON envelope) — useful for piping into `open` / `xdg-open`.', false);
}
function emit(url: string, payload: Record<string, unknown>, opts: OutputFlags): void {
  if (opts.raw) {
    if (opts.outputFile) {
      fs.writeFileSync(opts.outputFile, url + '\n', 'utf-8');
      process.stderr.write(`Written to ${opts.outputFile}\n`);
    } else {
      process.stdout.write(url + '\n');
    }
    return;
  }
  const formatted = opts.condensed ? JSON.stringify(payload) : JSON.stringify(payload, null, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
  } else {
    process.stdout.write(formatted + '\n');
  }
}
function fail(code: number, message: string): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(code);
}

const APP_BASE = (testnet: boolean) => (testnet ? 'https://testnet.bitbadges.io' : 'https://bitbadges.io');
const EVM_EXPLORER = (testnet: boolean) => (testnet ? 'https://evm-testnet.explorer.bitbadges.io' : 'https://evm.explorer.bitbadges.io');
const PING_PUB_EXPLORER = (testnet: boolean) =>
  testnet ? 'https://explorer.bitbadges.io/BitBadges%20Testnet' : 'https://explorer.bitbadges.io/BitBadges%20Mainnet';

function normalizeEvmHash(hash: string): string {
  const cleaned = hash.replace(/^0x/i, '');
  if (!/^[a-fA-F0-9]+$/.test(cleaned)) fail(2, `tx hash "${hash}" is not valid hex`);
  return `0x${cleaned.toLowerCase()}`;
}
function normalizeCosmosHash(hash: string): string {
  return hash.replace(/^0x/i, '');
}

// ── url (parent) ─────────────────────────────────────────────────────────────

export const urlCommand = new Command('url').description(
  'Resolve canonical BitBadges URLs — explorer links for tx hashes, app links for collections / badges / accounts.'
);

// ── url tx ───────────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlag(
    urlCommand
      .command('tx')
      .description('EVM Blockscout URL for a tx hash. Use `bb url tx-cosmos` for the Cosmos-style ping.pub explorer.')
      .argument('<hash>', 'Transaction hash (with or without 0x prefix)')
  )
).action((hash: string, opts: NetworkFlags & OutputFlags) => {
  const normalized = normalizeEvmHash(hash);
  const url = `${EVM_EXPLORER(!!opts.testnet)}/tx/${normalized}`;
  emit(url, { kind: 'tx', explorer: 'blockscout', hash: normalized, url }, opts);
});

addOutputFlags(
  addNetworkFlag(
    urlCommand
      .command('tx-cosmos')
      .description('ping.pub explorer URL for a Cosmos-format tx hash (no 0x prefix).')
      .argument('<hash>', 'Transaction hash')
  )
).action((hash: string, opts: NetworkFlags & OutputFlags) => {
  const normalized = normalizeCosmosHash(hash);
  const url = `${PING_PUB_EXPLORER(!!opts.testnet)}/tx/${normalized}`;
  emit(url, { kind: 'tx', explorer: 'ping.pub', hash: normalized, url }, opts);
});

// ── url collection ───────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlag(
    urlCommand
      .command('collection')
      .description('Public bitbadges.io page for a collection.')
      .argument('<collection-id>', 'Collection ID')
  )
).action((collectionId: string, opts: NetworkFlags & OutputFlags) => {
  const url = `${APP_BASE(!!opts.testnet)}/collections/${encodeURIComponent(collectionId)}`;
  emit(url, { kind: 'collection', collectionId, url }, opts);
});

// ── url badge ────────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlag(
    urlCommand
      .command('badge')
      .description('Public bitbadges.io page for a specific badge (token) within a collection.')
      .argument('<collection-id>', 'Collection ID')
      .argument('<token-id>', 'Token ID within the collection')
  )
).action((collectionId: string, tokenId: string, opts: NetworkFlags & OutputFlags) => {
  const url = `${APP_BASE(!!opts.testnet)}/collections/${encodeURIComponent(collectionId)}/${encodeURIComponent(tokenId)}`;
  emit(url, { kind: 'badge', collectionId, tokenId, url }, opts);
});

// ── url address ──────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlag(
    urlCommand
      .command('address')
      .description('Public bitbadges.io profile page for an address.')
      .argument('<address>', 'BitBadges (bb1...) address or any chain-equivalent address bitbadges.io accepts')
  )
).action((address: string, opts: NetworkFlags & OutputFlags) => {
  const url = `${APP_BASE(!!opts.testnet)}/account/${encodeURIComponent(address)}`;
  emit(url, { kind: 'address', address, url }, opts);
});
