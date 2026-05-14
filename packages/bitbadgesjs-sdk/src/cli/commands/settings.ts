import { Command } from 'commander';
import {
  loadConfig,
  saveConfig,
  getConfigPath,
  SUPPORTED_CONFIG_KEYS,
  type ConfigKey,
} from '../utils/config.js';
import { assertNetworkAvailable } from '../../signing/types.js';
import {
  addOutputOptions,
  bbError,
  BBErrorCode,
  emit,
  emitError,
  type EmitOptions,
} from '../utils/envelope.js';

// CLI v2 (#0399) renamed `bb config` → `bb settings` to free the
// `config` slot for the chain binary's client.toml management once the
// flat namespace ships. The internal export name `settingsCommand` and
// the public command name `settings` mirror the docs; the old top-level
// `bb config ...` form is registered as a deprecated alias in
// cli/index.ts for one release.
//
// Output contract: every subcommand emits a JSON envelope on stdout
// (success path via `emit()`, error path via `emitError()`). This
// supersedes the v1 plain-text print model. Humans pipe through
// `jq -r` for the same human-readable shape they had before; agents
// get a stable `{ok, data, error}` envelope they can parse like every
// other `bb` verb.

type OutputFlags = { condensed?: boolean; outputFile?: string };

function emitOpts(opts: OutputFlags): EmitOptions {
  return {
    ...(opts.condensed ? { condensed: true } : {}),
    ...(opts.outputFile ? { outputFile: opts.outputFile } : {}),
  };
}

export const settingsCommand = new Command('settings').description(
  'Manage CLI settings (~/.bitbadges/config.json)'
);

// ── settings show ───────────────────────────────────────────────────────────

addOutputOptions(
  settingsCommand
    .command('show')
    .description('Print current configuration')
).action((opts: OutputFlags) => {
  const config = loadConfig();
  const configPath = getConfigPath();

  // Mask any apiKey* field so the envelope is safe to paste / log.
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    masked[key] =
      key.startsWith('apiKey') && typeof value === 'string' ? maskKey(value) : value;
  }
  emit({ configPath, config: masked }, emitOpts(opts));
});

// ── settings set <key> <value> ─────────────────────────────────────────────────

addOutputOptions(
  settingsCommand
    .command('set <key> <value>')
    .description(`Set a config value. Supported keys: ${SUPPORTED_CONFIG_KEYS.join(', ')}`)
).action((key: string, value: string, opts: OutputFlags) => {
  if (!SUPPORTED_CONFIG_KEYS.includes(key as ConfigKey)) {
    emitError(
      bbError(
        BBErrorCode.INVALID_INPUT,
        `Unknown config key "${key}". Supported keys: ${SUPPORTED_CONFIG_KEYS.join(', ')}`
      ),
      emitOpts(opts)
    );
  }

  if (key === 'network' && !['mainnet', 'testnet', 'local'].includes(value)) {
    emitError(
      bbError(
        BBErrorCode.INVALID_INPUT,
        'Invalid network value. Must be one of: mainnet, testnet, local'
      ),
      emitOpts(opts)
    );
  }

  // Fail fast if the user tries to persist a currently-disabled network
  // (e.g. testnet is temporarily offline). This catches misconfiguration
  // at config-write time rather than at every later command.
  if (key === 'network') {
    try {
      assertNetworkAvailable(value);
    } catch (err) {
      emitError(
        bbError(BBErrorCode.INVALID_INPUT, (err as Error).message),
        emitOpts(opts)
      );
    }
  }

  const config = loadConfig();
  (config as any)[key] = value;
  saveConfig(config);
  emit(
    {
      configPath: getConfigPath(),
      key,
      value: key.startsWith('apiKey') ? maskKey(value) : value,
    },
    emitOpts(opts)
  );
});

// ── settings unset <key> ───────────────────────────────────────────────────────

addOutputOptions(
  settingsCommand
    .command('unset <key>')
    .description('Remove a config value')
).action((key: string, opts: OutputFlags) => {
  if (!SUPPORTED_CONFIG_KEYS.includes(key as ConfigKey)) {
    emitError(
      bbError(
        BBErrorCode.INVALID_INPUT,
        `Unknown config key "${key}". Supported keys: ${SUPPORTED_CONFIG_KEYS.join(', ')}`
      ),
      emitOpts(opts)
    );
  }

  const config = loadConfig();
  delete (config as any)[key];
  saveConfig(config);
  emit({ configPath: getConfigPath(), removed: key }, emitOpts(opts));
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}
