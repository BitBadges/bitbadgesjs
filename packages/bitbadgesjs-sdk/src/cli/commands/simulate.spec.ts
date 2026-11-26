/**
 * simulate.ts coverage (ticket 0430) — previously zero specs anywhere.
 * ensureTxWrapper is the load-bearing input-normalization helper; the
 * command surface guards flag drift. Network paths are integration
 * territory (no runCli in unit specs, per project convention).
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { simulateCommand, ensureTxWrapper, requiresApiKey } from './simulate.js';

describe('simulate ensureTxWrapper', () => {
  it('returns a {messages:[...]} body unchanged', () => {
    const tx = { messages: [{ typeUrl: '/x.Msg', value: { a: 1 } }], memo: 'm' };
    expect(ensureTxWrapper(tx)).toBe(tx);
  });
  it('wraps a bare {typeUrl,value} Msg into a single-message body', () => {
    const msg = { typeUrl: '/x.Msg', value: { a: 1 } };
    expect(ensureTxWrapper(msg)).toEqual({ messages: [msg] });
  });
  it('passes a non-object through untouched', () => {
    expect(ensureTxWrapper(null)).toBeNull();
    expect(ensureTxWrapper('-')).toBe('-');
    expect(ensureTxWrapper(42 as any)).toBe(42);
  });
  it('passes an object that is neither messages-shaped nor a Msg through untouched (→ shape error downstream)', () => {
    const weird = { foo: 'bar' };
    expect(ensureTxWrapper(weird)).toBe(weird);
    // typeUrl present but no value → NOT a valid Msg, passthrough
    const noValue = { typeUrl: '/x.Msg' };
    expect(ensureTxWrapper(noValue)).toBe(noValue);
  });
});

describe('simulateCommand shape', () => {
  it('takes a single <input> argument', () => {
    expect(simulateCommand.name()).toBe('simulate');
    expect((simulateCommand as any)._args.map((a: any) => a.name())).toEqual(['input']);
  });
  it('exposes the documented flags', () => {
    const flags = (simulateCommand as any).options.map((o: any) => o.long);
    for (const f of ['--creator', '--events', '--condensed', '--output-file']) {
      expect(flags).toContain(f);
    }
  });
});

describe('simulate API-key gating', () => {
  // The local indexer serves /api/v0/simulate without an API key, and the
  // command's own error text tells the user to "pass --network local".
  // Gating local on a key made that advice a dead end: following it produced
  // the same error, which an agent cannot recover from.
  it('does not require a key on local', () => {
    expect(requiresApiKey({ network: 'local' })).toBe(false);
    expect(requiresApiKey({ local: true })).toBe(false);
  });

  it('does not require a key when --url points at a local indexer', () => {
    expect(requiresApiKey({ url: 'http://localhost:3001' })).toBe(false);
    expect(requiresApiKey({ url: 'http://127.0.0.1:3001' })).toBe(false);
  });

  it('still requires a key on mainnet and testnet', () => {
    expect(requiresApiKey({})).toBe(true);
    expect(requiresApiKey({ network: 'mainnet' })).toBe(true);
    expect(requiresApiKey({ testnet: true })).toBe(true);
    expect(requiresApiKey({ url: 'https://api.bitbadges.io' })).toBe(true);
  });
});

describe('bb simulate error envelopes (BB-296)', () => {
  const cliTs = path.resolve(__dirname, '../index.ts');

  function runSimulate(args: string[]) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-simulate-test-'));
    try {
      return spawnSync('bun', [cliTs, 'simulate', ...args], {
        encoding: 'utf-8',
        timeout: 15_000,
        env: {
          PATH: process.env.PATH,
          HOME: home,
          BITBADGES_CONFIG_DIR: home,
          BB_QUIET: '1'
        }
      });
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  }

  it('emits missing_api_key JSON envelope on stdout when no API key is configured on mainnet', () => {
    const res = runSimulate(['{"messages":[{"typeUrl":"/tokenization.MsgCreateCollection","value":{}}]}']);
    expect(res.status).toBe(2);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.data).toBeNull();
    expect(env.error.code).toBe('missing_api_key');
  });

  it('emits invalid_input JSON envelope on stdout for unexpected input shape', () => {
    const res = runSimulate(['{"foo":"bar"}', '--local']);
    expect(res.status).toBe(2);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('invalid_input');
    expect(env.error.message).toMatch(/unexpected shape/i);
  });

  it('emits unsupported_message JSON envelope on stdout for user-level approval messages', () => {
    const res = runSimulate([
      '{"typeUrl":"/tokenization.MsgSetOutgoingApproval","value":{"creator":"bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv"}}',
      '--local'
    ]);
    expect(res.status).toBe(2);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('unsupported_message');
  });
});
