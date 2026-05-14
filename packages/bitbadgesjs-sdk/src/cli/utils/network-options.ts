/**
 * Unified network-flag surface for every CLI command that touches an
 * external service (indexer, chain RPC, or both).
 *
 * History: before this module existed there were TWO parallel helpers:
 *
 *   - `addIndexerNetworkOptions` in `./indexer-options.ts` (used by
 *     ~28 commands) — emitted `--testnet`, `--local`, `--url`,
 *     `--api-key` and grouped them under `helpGroup('Network')`.
 *
 *   - `addNetworkOptions` in `./io.ts` (used by ~6 commands: `auth`,
 *     `burner`, `deploy`, `tx`, `simulate`, `preview`) — emitted
 *     `--network`, `--mainnet`, `--testnet`, `--local`, `--url`. No
 *     `--api-key` and no help-group styling.
 *
 * They drifted: indexer commands didn't accept `--network mainnet`,
 * while the burner/deploy side didn't accept `--api-key` (instead
 * relying on the BITBADGES_API_KEY env var). Users hit footguns when
 * they piped `bb api ... --network local` into `bb deploy --network
 * local` and one of the two flags errored.
 *
 * This module exports a single helper that unions BOTH surfaces:
 *   --network <mainnet|testnet|local>   — canonical, long-form
 *   --mainnet                            — equivalent to --network mainnet
 *   --testnet                            — equivalent to --network testnet
 *   --local                              — equivalent to --network local
 *   --url <url>                          — manual base-URL override
 *   --api-key <key>                      — manual API-key override
 *
 * The old helpers still exist as `@deprecated` aliases that delegate
 * here, so the 34 existing call sites keep working during the
 * transition. Migration to the unified helper happens incrementally
 * (out-of-scope verbs can stay on the alias).
 */
import type { Command } from 'commander';

export interface UnifiedNetworkFlags {
  /** Canonical network selector — `mainnet` | `testnet` | `local`. */
  network?: 'mainnet' | 'testnet' | 'local';
  /** Boolean shortcut. Equivalent to `--network mainnet`. */
  mainnet?: boolean;
  /** Boolean shortcut. Equivalent to `--network testnet`. */
  testnet?: boolean;
  /** Boolean shortcut. Equivalent to `--network local`. */
  local?: boolean;
  /** Custom API base URL override. Wins over every other selector. */
  url?: string;
  /** API key override. Wins over `BITBADGES_API_KEY` env var. */
  apiKey?: string;
}

/**
 * Options for {@link addUnifiedNetworkOptions} — control which subset
 * of the union surface a given command actually exposes.
 *
 * Defaults to the full surface. Pass `{ includeApiKey: false }` for
 * commands that genuinely don't talk to the indexer (e.g. chain-RPC-only
 * verbs like `bb tx <hash>`), so the `--api-key` flag doesn't show up
 * in their help.
 */
export interface AddNetworkOptionsConfig {
  /** Whether to expose `--api-key`. Default `true`. */
  includeApiKey?: boolean;
  /** Whether to expose long-form `--network <name>`. Default `true`. */
  includeNetworkFlag?: boolean;
  /** Whether to expose `--mainnet` boolean shortcut. Default `true`. */
  includeMainnetFlag?: boolean;
}

/**
 * Add the unified network-selection flags to a Command.
 *
 * All flags are optional. The defaults match the union of what
 * `addIndexerNetworkOptions` + `addNetworkOptions` used to expose —
 * passing no config gives every command both surfaces.
 *
 * Output grouping: all added flags are tagged with
 * `helpGroup('Network')` so they cluster together in
 * `--help` (matches the indexer-side styling).
 */
export function addUnifiedNetworkOptions(
  cmd: Command,
  config: AddNetworkOptionsConfig = {}
): Command {
  const includeApiKey = config.includeApiKey ?? true;
  const includeNetworkFlag = config.includeNetworkFlag ?? true;
  const includeMainnetFlag = config.includeMainnetFlag ?? true;

  if (includeNetworkFlag) {
    cmd.option(
      '--network <name>',
      'Network: mainnet | testnet | local. Picks the matching API base URL and config apiKey.'
    );
  }
  if (includeMainnetFlag) {
    cmd.option('--mainnet', 'Shortcut for --network mainnet');
  }
  cmd
    .option('--testnet', 'Shortcut for --network testnet (use testnet API)', false)
    .option('--local', 'Shortcut for --network local (http://localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL (overrides --network/--testnet/--local/config)');
  if (includeApiKey) {
    cmd.option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)');
  }

  // Help-group every added flag under "Network" so it clusters in
  // --help. We tolerate missing entries — `helpGroup` is a no-op on
  // older Commander versions and `_findOption` may be undefined on
  // some commander forks.
  const flags = ['--network', '--mainnet', '--testnet', '--local', '--url', '--api-key'];
  for (const flag of flags) {
    (cmd as any)._findOption?.(flag)?.helpGroup('Network');
  }
  return cmd;
}
