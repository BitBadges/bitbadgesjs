import { Command } from 'commander';
import {
  loadConfig,
  saveConfig,
  getConfigPath,
  SUPPORTED_CONFIG_KEYS,
  type ConfigKey,
} from '../utils/config.js';

export const configCommand = new Command('config').description(
  'Manage CLI configuration (~/.bitbadges/config.json)'
);

// ── config show ──────────────────────────────────────────────────────────────

configCommand
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

// ── config set <key> <value> ─────────────────────────────────────────────────

configCommand
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

    const config = loadConfig();
    (config as any)[key] = value;
    saveConfig(config);
    console.log(`Set ${key} = ${key.startsWith('apiKey') ? maskKey(value) : value}`);
  });

// ── config unset <key> ───────────────────────────────────────────────────────

configCommand
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
