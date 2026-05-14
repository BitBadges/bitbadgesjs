import { Command } from 'commander';
import {
  loadConfig,
  saveConfig,
  getConfigPath,
  SUPPORTED_CONFIG_KEYS,
  type ConfigKey,
} from '../utils/config.js';
import { assertNetworkAvailable } from '../../signing/types.js';

// CLI v2 (#0399) renamed `bb config` → `bb settings` to free the
// `config` slot for the chain binary's client.toml management once the
// flat namespace ships. The internal export name `settingsCommand` and
// the public command name `settings` mirror the docs; the old top-level
// `bb config ...` form is registered as a deprecated alias in
// cli/index.ts for one release.

export const settingsCommand = new Command('settings').description(
  'Manage CLI settings (~/.bitbadges/config.json)'
);

// ── settings show ───────────────────────────────────────────────────────────

settingsCommand
  .command('show')
  .description('Print current configuration')
  .action(() => {
    const config = loadConfig();
    const configPath = getConfigPath();

    console.log(`Config file: ${configPath}\n`);

    if (Object.keys(config).length === 0) {
      console.log('(no configuration set)');
      return;
    }

    for (const [key, value] of Object.entries(config)) {
      const display = key.startsWith('apiKey') && typeof value === 'string'
        ? maskKey(value)
        : value;
      console.log(`  ${key} = ${display}`);
    }
  });

// ── settings set <key> <value> ─────────────────────────────────────────────────

settingsCommand
  .command('set <key> <value>')
  .description(`Set a config value. Supported keys: ${SUPPORTED_CONFIG_KEYS.join(', ')}`)
  .action((key: string, value: string) => {
    if (!SUPPORTED_CONFIG_KEYS.includes(key as ConfigKey)) {
      console.error(
        `Unknown config key "${key}". Supported keys: ${SUPPORTED_CONFIG_KEYS.join(', ')}`
      );
      process.exitCode = 1;
      return;
    }

    if (key === 'network' && !['mainnet', 'testnet', 'local'].includes(value)) {
      console.error('Invalid network value. Must be one of: mainnet, testnet, local');
      process.exitCode = 1;
      return;
    }

    // Fail fast if the user tries to persist a currently-disabled network
    // (e.g. testnet is temporarily offline). This catches misconfiguration
    // at config-write time rather than at every later command.
    if (key === 'network') {
      try {
        assertNetworkAvailable(value);
      } catch (err) {
        console.error((err as Error).message);
        process.exitCode = 1;
        return;
      }
    }

    const config = loadConfig();
    (config as any)[key] = value;
    saveConfig(config);
    console.log(`Set ${key} = ${key.startsWith('apiKey') ? maskKey(value) : value}`);
  });

// ── settings unset <key> ───────────────────────────────────────────────────────

settingsCommand
  .command('unset <key>')
  .description('Remove a config value')
  .action((key: string) => {
    if (!SUPPORTED_CONFIG_KEYS.includes(key as ConfigKey)) {
      console.error(
        `Unknown config key "${key}". Supported keys: ${SUPPORTED_CONFIG_KEYS.join(', ')}`
      );
      process.exitCode = 1;
      return;
    }

    const config = loadConfig();
    delete (config as any)[key];
    saveConfig(config);
    console.log(`Removed ${key}`);
  });

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}
