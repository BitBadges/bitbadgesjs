import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  apiKey?: string;
  apiKeyTestnet?: string;
  apiKeyLocal?: string;
  network?: 'mainnet' | 'testnet' | 'local';
  url?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.bitbadges');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export const SUPPORTED_CONFIG_KEYS = ['apiKey', 'apiKeyTestnet', 'apiKeyLocal', 'network', 'url'] as const;
export type ConfigKey = (typeof SUPPORTED_CONFIG_KEYS)[number];

/**
 * Reads ~/.bitbadges/config.json. Returns empty object if not found.
 */
export function loadConfig(): Config {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

/**
 * Writes config to ~/.bitbadges/config.json. Creates directory if needed.
 */
export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Returns the config file path.
 */
export function getConfigPath(): string {
  return CONFIG_PATH;
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
