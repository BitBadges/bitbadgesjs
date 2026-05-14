/**
 * Tests for config.ts — ~/.bitbadges/config.json persistence + lookups.
 *
 * Each test isolates HOME to a tmpdir so the suite never touches a real
 * user's config file.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import {
  loadConfig,
  saveConfig,
  getConfigPath,
  getConfigApiKey,
  getConfigBaseUrl
} from './config.js';

const ORIG_CFG_DIR = process.env.BITBADGES_CONFIG_DIR;

beforeEach(() => {
  const tmp = path.join(os.tmpdir(), `bb-cfgtest-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(tmp, { recursive: true });
  process.env.BITBADGES_CONFIG_DIR = tmp;
});

afterAll(() => {
  if (ORIG_CFG_DIR === undefined) delete process.env.BITBADGES_CONFIG_DIR;
  else process.env.BITBADGES_CONFIG_DIR = ORIG_CFG_DIR;
});

describe('loadConfig', () => {
  it('returns {} when the config file is missing', () => {
    expect(loadConfig()).toEqual({});
  });

  it('returns {} on malformed JSON instead of throwing', () => {
    const cfgPath = getConfigPath();
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
    fs.writeFileSync(cfgPath, '{not json', 'utf-8');
    expect(loadConfig()).toEqual({});
  });

  it('round-trips a saved config', () => {
    saveConfig({ apiKey: 'k', network: 'testnet' });
    expect(loadConfig()).toEqual({ apiKey: 'k', network: 'testnet' });
  });
});

describe('saveConfig', () => {
  it('creates the ~/.bitbadges directory if missing', () => {
    saveConfig({ apiKey: 'k' });
    expect(fs.existsSync(getConfigPath())).toBe(true);
  });

  it('overwrites prior content', () => {
    saveConfig({ apiKey: 'first' });
    saveConfig({ apiKey: 'second' });
    expect(loadConfig()).toEqual({ apiKey: 'second' });
  });
});

describe('getConfigApiKey', () => {
  it('returns the network-scoped key when set', () => {
    saveConfig({ apiKey: 'default', apiKeyTestnet: 'tk', apiKeyLocal: 'lk' });
    expect(getConfigApiKey('testnet')).toBe('tk');
    expect(getConfigApiKey('local')).toBe('lk');
  });

  it('falls back to default key when scoped one is missing', () => {
    saveConfig({ apiKey: 'default' });
    expect(getConfigApiKey('testnet')).toBe('default');
    expect(getConfigApiKey('local')).toBe('default');
  });

  it('returns undefined when nothing is set', () => {
    expect(getConfigApiKey()).toBeUndefined();
  });
});

describe('getConfigBaseUrl', () => {
  it('returns explicit config.url when set', () => {
    saveConfig({ url: 'http://custom/api/v0' });
    expect(getConfigBaseUrl()).toBe('http://custom/api/v0');
  });

  it('derives the URL from config.network when url is unset', () => {
    saveConfig({ network: 'mainnet' });
    expect(getConfigBaseUrl()).toBe('https://api.bitbadges.io/api/v0');
    saveConfig({ network: 'local' });
    expect(getConfigBaseUrl()).toBe('http://localhost:3001/api/v0');
  });

  it('returns undefined when neither url nor network is set', () => {
    expect(getConfigBaseUrl()).toBeUndefined();
  });
});
