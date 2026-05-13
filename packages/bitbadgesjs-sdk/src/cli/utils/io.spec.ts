/**
 * Tests for io.ts — readJsonInput + network/url resolution.
 *
 * Covers:
 *   - readJsonInput (file / @file / inline JSON / stdin not tested here)
 *   - resolveNetwork (precedence)
 *   - getApiUrl (precedence, including --url override, env var, network shortcuts)
 *   - getApiKeyForNetwork (env > network-scoped config > default config)
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { readJsonInput, resolveNetwork, getApiUrl, getApiKeyForNetwork } from './io.js';
import { saveConfig } from './config.js';

// Isolate the config dir so tests don't poison the real config.
const ORIG_CFG_DIR = process.env.BITBADGES_CONFIG_DIR;
const ORIG_API_URL = process.env.BITBADGES_API_URL;
const ORIG_API_KEY = process.env.BITBADGES_API_KEY;

beforeEach(() => {
  const tmp = path.join(os.tmpdir(), `bb-iotest-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(tmp, { recursive: true });
  process.env.BITBADGES_CONFIG_DIR = tmp;
  delete process.env.BITBADGES_API_URL;
  delete process.env.BITBADGES_API_KEY;
});

afterAll(() => {
  if (ORIG_CFG_DIR === undefined) delete process.env.BITBADGES_CONFIG_DIR;
  else process.env.BITBADGES_CONFIG_DIR = ORIG_CFG_DIR;
  if (ORIG_API_URL) process.env.BITBADGES_API_URL = ORIG_API_URL;
  if (ORIG_API_KEY) process.env.BITBADGES_API_KEY = ORIG_API_KEY;
});

describe('readJsonInput', () => {
  it('parses inline JSON object', () => {
    expect(readJsonInput('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses inline JSON array', () => {
    expect(readJsonInput('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('reads from a file path', () => {
    const tmp = path.join(os.tmpdir(), `io-${crypto.randomBytes(4).toString('hex')}.json`);
    fs.writeFileSync(tmp, JSON.stringify({ from: 'file' }));
    expect(readJsonInput(tmp)).toEqual({ from: 'file' });
    fs.unlinkSync(tmp);
  });

  it('strips leading @ from file path', () => {
    const tmp = path.join(os.tmpdir(), `io-${crypto.randomBytes(4).toString('hex')}.json`);
    fs.writeFileSync(tmp, JSON.stringify({ at: true }));
    expect(readJsonInput('@' + tmp)).toEqual({ at: true });
    fs.unlinkSync(tmp);
  });

  it('throws when file does not exist', () => {
    expect(() => readJsonInput('/nonexistent/path.json')).toThrow(/File not found/);
  });

  it('throws on malformed JSON', () => {
    expect(() => readJsonInput('{not valid')).toThrow(/Failed to parse JSON/);
  });
});

describe('resolveNetwork', () => {
  it('--network wins over everything', () => {
    expect(resolveNetwork({ network: 'testnet', local: true, mainnet: true })).toBe('testnet');
  });

  it('--local picks local', () => {
    expect(resolveNetwork({ local: true })).toBe('local');
  });

  it('--testnet picks testnet', () => {
    expect(resolveNetwork({ testnet: true })).toBe('testnet');
  });

  it('--mainnet picks mainnet', () => {
    expect(resolveNetwork({ mainnet: true })).toBe('mainnet');
  });

  it('--local > --testnet > --mainnet', () => {
    expect(resolveNetwork({ local: true, testnet: true, mainnet: true })).toBe('local');
    expect(resolveNetwork({ testnet: true, mainnet: true })).toBe('testnet');
  });

  it('default is mainnet', () => {
    expect(resolveNetwork({})).toBe('mainnet');
  });
});

describe('getApiUrl', () => {
  it('--url wins over everything', () => {
    expect(getApiUrl({ url: 'http://custom', local: true })).toBe('http://custom');
  });

  it('BITBADGES_API_URL env var wins over network', () => {
    process.env.BITBADGES_API_URL = 'http://from-env';
    expect(getApiUrl({ local: true })).toBe('http://from-env');
  });

  it('--local returns localhost:3001', () => {
    expect(getApiUrl({ local: true })).toBe('http://localhost:3001');
  });

  it('--testnet returns the testnet URL', () => {
    // Testnet is gated by assertNetworkAvailable; override for the test.
    const prior = process.env.BITBADGES_TESTNET_OFFLINE;
    process.env.BITBADGES_TESTNET_OFFLINE = 'false';
    try {
      expect(getApiUrl({ testnet: true })).toBe('https://api.testnet.bitbadges.io');
    } finally {
      if (prior === undefined) delete process.env.BITBADGES_TESTNET_OFFLINE;
      else process.env.BITBADGES_TESTNET_OFFLINE = prior;
    }
  });

  it('default mainnet URL', () => {
    expect(getApiUrl({})).toBe('https://api.bitbadges.io');
  });

  it('config url is used when no flag/env is set', () => {
    saveConfig({ url: 'http://config-url/api/v0' });
    // mainnet branch consults config; the /api/v0 suffix is stripped.
    expect(getApiUrl({})).toBe('http://config-url');
  });
});

describe('getApiKeyForNetwork', () => {
  it('env var wins over config', () => {
    process.env.BITBADGES_API_KEY = 'env-key';
    saveConfig({ apiKey: 'config-key' });
    expect(getApiKeyForNetwork({})).toBe('env-key');
  });

  it('falls back to network-scoped config key', () => {
    saveConfig({ apiKey: 'default', apiKeyTestnet: 'tk', apiKeyLocal: 'lk' });
    expect(getApiKeyForNetwork({ local: true })).toBe('lk');
    expect(getApiKeyForNetwork({ testnet: true })).toBe('tk');
  });

  it('falls back to default config apiKey when no scoped key matches', () => {
    saveConfig({ apiKey: 'default' });
    expect(getApiKeyForNetwork({})).toBe('default');
    expect(getApiKeyForNetwork({ local: true })).toBe('default');
  });

  it('returns undefined when nothing is configured', () => {
    expect(getApiKeyForNetwork({})).toBeUndefined();
  });
});
