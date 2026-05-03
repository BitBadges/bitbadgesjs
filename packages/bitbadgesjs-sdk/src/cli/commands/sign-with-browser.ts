/**
 * `bitbadges-cli sign-with-browser <message-or-file>` — hand an arbitrary
 * message off to the user's browser wallet (Keplr / MetaMask / etc.) for
 * signature, then return the signature + address as JSON on stdout.
 *
 * Pairs with #0375. Use cases: piping a Blockin challenge into a third-
 * party signer, signing arbitrary attestation messages from an agent,
 * etc. This command does NOT touch /auth/verify or persist a session —
 * use `auth login --browser` for that.
 */

import * as fs from 'fs';
import { Command } from 'commander';
import { addNetworkOptions, getApiUrl, getApiKeyForNetwork, resolveNetwork } from '../utils/io.js';
import { bridgeSign, resolveFrontendUrl } from '../auth/browser-bridge.js';

function readMessage(opts: { message?: string; messageFile?: string; positional?: string }): string {
  if (opts.message) return opts.message;
  if (opts.messageFile) {
    if (opts.messageFile === '-') return fs.readFileSync(0, 'utf-8');
    return fs.readFileSync(opts.messageFile, 'utf-8');
  }
  if (opts.positional) {
    if (opts.positional === '-') return fs.readFileSync(0, 'utf-8');
    if (opts.positional.startsWith('@')) return fs.readFileSync(opts.positional.slice(1), 'utf-8');
    return opts.positional;
  }
  if (!process.stdin.isTTY) return fs.readFileSync(0, 'utf-8');
  throw new Error('No message provided. Pass --message <text>, --message-file <path>, a positional arg, or pipe via stdin.');
}

export const signWithBrowserCommand = new Command('sign-with-browser')
  .description('Hand an arbitrary message to a browser wallet for signature, return signature + address.')
  .summary('Browser-bridge personal sign for any message.')
  .argument('[input]', 'Inline message, "-" for stdin, or "@path" for a file')
  .option('--message <text>', 'The message to sign (inline)')
  .option('--message-file <path>', 'Read message from file ("-" for stdin)')
  .option('--expected-address <addr>', 'Require the connected wallet to match this address (bb1... / 0x...).')
  .option('--frontend-url <url>', 'Override the frontend base URL.')
  .option('--no-open', 'Print the sign URL instead of auto-launching the browser.')
  .option('--timeout <seconds>', 'How long to wait for the wallet (default 300, max 1800).')
  .option('--port <n>', 'Pin the loopback listener port (default: random ephemeral). Use this when your browser is on a different machine and you need a stable SSH port-forward.');
addNetworkOptions(signWithBrowserCommand);
signWithBrowserCommand.action(async (positional: string | undefined, opts: any) => {
  let message: string;
  try {
    message = readMessage({ message: opts.message, messageFile: opts.messageFile, positional });
  } catch (err: any) {
    process.stderr.write(`${err?.message || err}\n`);
    process.exit(2);
  }

  const networkName = resolveNetwork(opts);
  const baseUrl = getApiUrl(opts);
  const apiKey = getApiKeyForNetwork(opts);
  const frontendUrl = resolveFrontendUrl(networkName, opts.frontendUrl);
  const requestedTimeoutSec = opts.timeout ? Math.min(1800, Math.max(60, Number(opts.timeout))) : 300;

  process.stderr.write(`\nOpening browser to ${frontendUrl}/sign for wallet signature...\n`);

  try {
    const result = await bridgeSign({
      mode: 'msg',
      payload: { message, expectedAddress: opts.expectedAddress },
      baseUrl,
      frontendUrl,
      apiKey,
      timeoutMs: requestedTimeoutSec * 1000,
      noOpen: opts.open === false,
      port: opts.port ? Number(opts.port) : undefined,
    });
    if (result.error) {
      process.stderr.write(`Sign cancelled or rejected: ${result.error}\n`);
      process.exit(1);
    }
    if (!result.signature) {
      process.stderr.write('Browser bridge returned no signature.\n');
      process.exit(1);
    }
    process.stdout.write(JSON.stringify({
      signature: result.signature,
      address: result.address,
      publicKey: result.publicKey,
      chain: result.chain,
    }, null, 2) + '\n');
  } catch (err: any) {
    process.stderr.write(`Browser sign failed: ${err?.message || err}\n`);
    process.exit(1);
  }
});
