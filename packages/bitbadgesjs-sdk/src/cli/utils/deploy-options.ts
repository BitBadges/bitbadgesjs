/**
 * Shared deploy flags + executor for every tx-emitting command.
 *
 * Mirrors the `addNetworkOptions` / output-flag helpers: any command
 * that produces a `{ typeUrl, value }` msg attaches `addDeployOptions`
 * and routes its output through `runEmitOrDeploy` (or, for commands that
 * already emit their own envelope, `isDeployRequested` + `executeDeploy`).
 *
 * Default (no deploy flag) → the msg JSON is emitted to stdout, so
 * `... | bb deploy` and scripting keep working unchanged. With
 * `--browser` / `--burner` the same msg is broadcast inline via the
 * canonical paths. Naming is the concise set used by standalone
 * `bb deploy` (`--browser`, `--burner`, …) so the interface is identical
 * everywhere.
 */
import type { Command } from 'commander';
import { getApiUrl, getApiKeyForNetwork, resolveNetwork } from './io.js';
import { tagHelpGroups } from './help-groups.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import { runBurnerCreate, pickBurner, type BurnerNetwork } from './burner.js';
import { requireBbDenom, DEFAULT_FEE_DENOM } from './denom.js';

export interface DeployOpts {
  browser?: boolean;
  burner?: boolean;
  signOnly?: boolean;
  frontendUrl?: string;
  open?: boolean; // commander sets `open: false` for --no-open
  timeout?: string;
  expectedAddress?: string;
  fund?: string;
  fee?: string;
  feeDenom?: string;
  gas?: string;
  new?: boolean;
  reuse?: string;
  nonInteractive?: boolean;
  pollTimeout?: string;
  manager?: string;
  creator?: string;
  nodeUrl?: string;
}

/** Add `--option` only if the command hasn't already declared it. */
function addOptionIfMissing(cmd: Command, flags: string, description: string, defaultValue?: string): Command {
  const longFlag = flags.match(/--[a-z][a-z0-9-]*/)?.[0];
  if (longFlag && (cmd as any)._findOption?.(longFlag)) return cmd;
  return defaultValue !== undefined ? cmd.option(flags, description, defaultValue) : cmd.option(flags, description);
}

/**
 * Attach the standardized deploy flag set + "Deploy" help-group tags.
 * Idempotent per flag — safe on commands that predefine `--manager`,
 * `--gas`, etc.
 */
export function addDeployOptions(cmd: Command): Command {
  addOptionIfMissing(cmd, '--burner', 'Broadcast inline via the throwaway burner flow (CREATE-ONLY). Requires --manager.');
  addOptionIfMissing(cmd, '--browser', 'Broadcast inline by handing off to the BitBadges /sign page; sign with your connected wallet (Keplr, MetaMask, …).');
  addOptionIfMissing(cmd, '--sign-only', 'With --browser: have the wallet sign but not broadcast — returns the signed tx bytes.');
  addOptionIfMissing(cmd, '--frontend-url <url>', 'With --browser: override the frontend base URL.');
  addOptionIfMissing(cmd, '--no-open', 'With --browser: print the sign URL instead of auto-launching the browser.');
  addOptionIfMissing(cmd, '--timeout <seconds>', 'With --browser: how long to wait for the wallet to confirm (default 300, max 1800).');
  addOptionIfMissing(cmd, '--expected-address <addr>', 'With --browser: bb1.../0x... the connected wallet must match. Defaults to --manager / --creator.');
  addOptionIfMissing(cmd, '--fund <mode>', 'With --burner: funding source for the burner (faucet | manual)', 'faucet');
  addOptionIfMissing(cmd, '--fee <amount>', 'When deploying: fee amount in base units', '0');
  addOptionIfMissing(cmd, '--fee-denom <symbol|denom>', 'When deploying: fee denom. BADGE, USDC, … or canonical denom', DEFAULT_FEE_DENOM);
  addOptionIfMissing(cmd, '--gas <number>', 'When deploying: gas limit', '400000');
  addOptionIfMissing(cmd, '--new', 'With --burner: skip the picker and always create a fresh wallet');
  addOptionIfMissing(cmd, '--reuse <selector>', 'With --burner: reuse a specific saved burner by address or recovery file path');
  addOptionIfMissing(cmd, '--non-interactive', 'With --burner: never prompt; on any prompt point save state and exit for later resume');
  addOptionIfMissing(cmd, '--poll-timeout <seconds>', 'With --burner: seconds to wait for funding to land before prompting/exiting', '60');
  tagHelpGroups(cmd, {
    '--burner': 'Deploy',
    '--browser': 'Deploy',
    '--sign-only': 'Deploy',
    '--frontend-url': 'Deploy',
    '--no-open': 'Deploy',
    '--timeout': 'Deploy',
    '--expected-address': 'Deploy',
    '--fund': 'Deploy',
    '--fee': 'Deploy',
    '--fee-denom': 'Deploy',
    '--gas': 'Deploy',
    '--new': 'Deploy',
    '--reuse': 'Deploy',
    '--non-interactive': 'Deploy',
    '--poll-timeout': 'Deploy'
  });
  return cmd;
}

/** True if the user asked for an inline broadcast (vs. emit JSON). */
export function isDeployRequested(opts: DeployOpts): boolean {
  return Boolean(opts.browser || opts.burner);
}

/**
 * Execute the inline broadcast for an already-built `{ typeUrl, value }`
 * msg. Behavior is verbatim the build.ts `--deploy-with-*` blocks it
 * replaces — only the flag NAMES changed (`--deploy-with-browser` →
 * `--browser`, etc.). Process-exits on completion/failure like the
 * original (does not return on the deploy paths).
 */
export async function executeDeploy(
  builtMsg: { typeUrl: string; value: any },
  opts: DeployOpts,
  ctx: { expectedAddress?: string } = {}
): Promise<void> {
  if (opts.browser && opts.burner) {
    process.stderr.write('\nError: --browser and --burner are mutually exclusive.\n');
    process.exit(2);
  }

  // ── --browser ───────────────────────────────────────────────────────
  if (opts.browser) {
    const networkName = resolveNetwork(opts as any);
    const apiUrl = getApiUrl(opts as any);
    const apiKey = getApiKeyForNetwork(opts as any);
    const { bridgeSign, resolveFrontendUrl } = await import('../auth/browser-bridge.js');
    const frontendUrl = resolveFrontendUrl(networkName, opts.frontendUrl);
    const expectedAddress = opts.expectedAddress ?? ctx.expectedAddress ?? opts.manager ?? opts.creator;
    const requestedTimeoutSec = opts.timeout ? Math.min(1800, Math.max(60, Number(opts.timeout))) : 300;
    process.stderr.write(`\nOpening browser to ${frontendUrl}/sign for wallet signature + broadcast...\n`);
    try {
      const result = await bridgeSign({
        mode: 'tx',
        payload: {
          chain: 'cosmos',
          txsInfo: [{ type: builtMsg.typeUrl, msg: builtMsg.value }],
          expectedAddress,
          signOnly: !!opts.signOnly,
        },
        baseUrl: apiUrl,
        frontendUrl,
        apiKey,
        timeoutMs: requestedTimeoutSec * 1000,
        noOpen: opts.open === false,
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
      process.stdout.write('\n' + JSON.stringify(payload, null, 2) + '\n');
      process.exit(payload.success ? 0 : 1);
    } catch (err: any) {
      process.stderr.write(`Browser broadcast failed: ${err?.message || err}\n`);
      process.exit(1);
    }
  }

  // ── --burner (CREATE-ONLY) ──────────────────────────────────────────
  if (opts.burner) {
    if (!opts.manager) {
      process.stderr.write(
        '\nError: --burner requires --manager <bb1...>. The burner is a throwaway signer; the manager address captures lasting collection ownership.\n'
      );
      process.exit(2);
    }
    const networkName = resolveNetwork(opts as any);
    const network: BurnerNetwork = networkName as NetworkMode;
    const apiUrl = getApiUrl(opts as any);
    const nodeUrl = opts.nodeUrl || NETWORK_CONFIGS[network].nodeUrl;
    const apiKey = getApiKeyForNetwork(opts as any);

    if ((opts.fund ?? 'faucet') === 'faucet' && !apiKey && network !== 'local') {
      process.stderr.write(
        'Warning: --fund faucet requires an API key on non-local networks. Pass --api-key or run `bb settings set apiKey <key>`.\n'
      );
    }

    const choice = await pickBurner({
      network,
      nodeUrl,
      forceNew: Boolean(opts.new),
      reuseSelector: opts.reuse
    });

    try {
      const result = await runBurnerCreate({
        msg: builtMsg,
        network,
        apiUrl,
        nodeUrl,
        manager: opts.manager,
        fund: opts.fund === 'manual' ? 'manual' : 'faucet',
        apiKey,
        fee: { amount: String(opts.fee ?? '0'), denom: requireBbDenom(String(opts.feeDenom ?? DEFAULT_FEE_DENOM), '--fee-denom') },
        gas: Number(opts.gas ?? 400000),
        reuseRecord: choice.kind === 'reuse' ? choice.record : undefined,
        nonInteractive: Boolean(opts.nonInteractive) || !process.stdout.isTTY,
        pollTimeoutMs: Number(opts.pollTimeout ?? 60) * 1000
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
      process.stdout.write('\n' + JSON.stringify(payload, null, 2) + '\n');
      if (!result.success && !result.paused) process.exit(1);
      process.exit(0);
    } catch (err: any) {
      process.stderr.write(`Burner deploy failed: ${err?.message || err}\n`);
      process.exit(1);
    }
  }
}

/**
 * Emit the msg as JSON (default; keeps `| bb deploy` working) UNLESS a
 * deploy flag was passed, in which case broadcast inline. For commands
 * whose only output is the tx msg. Commands that emit a richer envelope
 * (e.g. `bb build`) should call `isDeployRequested` + `executeDeploy`
 * themselves so they keep emitting their envelope first.
 */
export async function runEmitOrDeploy(
  builtMsg: { typeUrl: string; value: any },
  opts: DeployOpts,
  ctx: { emit: (msg: any) => void; expectedAddress?: string }
): Promise<void> {
  if (!isDeployRequested(opts)) {
    ctx.emit(builtMsg);
    return;
  }
  await executeDeploy(builtMsg, opts, { expectedAddress: ctx.expectedAddress });
}
