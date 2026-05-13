import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { assertNetworkAvailable } from '../../signing/types.js';

export interface Config {
  apiKey?: string;
  apiKeyTestnet?: string;
  apiKeyLocal?: string;
  network?: 'mainnet' | 'testnet' | 'local';
  url?: string;
}

// Resolved lazily — tests override via BITBADGES_CONFIG_DIR so they don't
// fight ts-jest's process.env / os.homedir() coupling (which doesn't
// re-read HOME inside the worker after import). Production callers leave
// the env var unset and pick up ~/.bitbadges.
function configDir(): string {
  if (process.env.BITBADGES_CONFIG_DIR) return process.env.BITBADGES_CONFIG_DIR;
  return path.join(os.homedir(), '.bitbadges');
}
function configPath(): string {
  return path.join(configDir(), 'config.json');
}

export const SUPPORTED_CONFIG_KEYS = ['apiKey', 'apiKeyTestnet', 'apiKeyLocal', 'network', 'url'] as const;
export type ConfigKey = (typeof SUPPORTED_CONFIG_KEYS)[number];

/**
 * Reads ~/.bitbadges/config.json. Returns empty object if not found.
 */
export function loadConfig(): Config {
  try {
    const p = configPath();
    if (!fs.existsSync(p)) return {};
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

/**
 * Writes config to ~/.bitbadges/config.json. Creates directory if needed.
 */
export function saveConfig(config: Config): void {
  const dir = configDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Returns the config file path.
 */
export function getConfigPath(): string {
  return configPath();
}

/**
 * Returns config apiKey (used as fallback after env var).
 * If a network is specified, returns the network-specific key first, then the default.
 */
export function getConfigApiKey(network?: 'mainnet' | 'testnet' | 'local'): string | undefined {
  const config = loadConfig();
  if (network === 'testnet' && config.apiKeyTestnet) return config.apiKeyTestnet;
  if (network === 'local' && config.apiKeyLocal) return config.apiKeyLocal;
  return config.apiKey;
}

/**
 * Returns the base URL derived from config network/url settings.
 */
export function getConfigBaseUrl(): string | undefined {
  const config = loadConfig();
  if (config.url) return config.url;
  // Fail fast if the persisted network is currently disabled. Override via
  // BITBADGES_TESTNET_OFFLINE=false. We only assert when the user has actually
  // selected a network in their config — undefined means "default to mainnet".
  if (config.network) assertNetworkAvailable(config.network);
  switch (config.network) {
    case 'testnet':
      return 'https://api.testnet.bitbadges.io/api/v0';
    case 'local':
      return 'http://localhost:3001/api/v0';
    case 'mainnet':
      return 'https://api.bitbadges.io/api/v0';
    default:
      return undefined;
  }
}
