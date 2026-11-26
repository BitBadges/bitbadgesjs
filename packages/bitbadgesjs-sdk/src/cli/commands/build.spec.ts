/**
 * Command-tree shape tests for build.ts. Locks the subcommand surface
 * (every standard preset + the approval/send/transfer builders) and
 * required-flag coverage. Builder-output correctness lives in the per-
 * builder specs under `src/core/builders/*.spec.ts`.
 *
 * Locked against the 2026-05-13 build-pipeline e2e smoke — each test
 * below catches a friction point that smoke surfaced.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildCommand, validateCreatorFlag, parseNumericFlag } from './build.js';
import { buildProductCatalog } from '../../core/builders/product-catalog.js';

describe('buildCommand shape', () => {
  it('exposes every documented standard preset', () => {
    // The 17 verbs that `bb build --help` advertises. If a verb is added
    // or removed, this test must be updated in lockstep with --help text.
    const names = buildCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'address-list',
      'auction',
      'bid',
      'bounty',
      'credit-token',
      'crowdfund',
      'custom-2fa',
      'intent',
      'listing',
      'payment-request',
      'payment-request-v2',
      'pm-buy-intent',
      'pm-sell-intent',
      'prediction-market',
      'product-catalog',
      'send',
      'smart-token',
      'spendable-credit',
      'subscription',
      'transfer',
      'vault'
    ]);
  });

  it('every collection-creating verb (except address-list / custom-2fa / approval verbs / send / transfer) requires a coin-related flag', () => {
    // Sanity check that the required-option contract isn't lost. Each
    // verb listed here MUST have at least one required option besides
    // metadata — otherwise an agent calling `bb build vault` with no
    // flags hits a confusing builder-level error instead of commander's
    // standard "missing required option" message.
    const verbsThatRequireCoinFlag = ['vault', 'smart-token'];
    for (const verb of verbsThatRequireCoinFlag) {
      const c = buildCommand.commands.find((cmd) => cmd.name() === verb)!;
      const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
      expect(required).toContain('--backing-coin');
    }
  });

  it('every collection preset that flows through sharedOpts() has --json-only', () => {
    // Locked against the 2026-05-13 smoke: `bb build send` was found
    // NOT to wire through sharedOpts() (no --json-only, --network, etc).
    // Every OTHER preset is expected to have --json-only.
    const shouldHaveJsonOnly = [
      'vault',
      'subscription',
      'bounty',
      'payment-request',
      'crowdfund',
      'auction',
      'product-catalog',
      'prediction-market',
      'smart-token',
      'spendable-credit',
      'credit-token',
      'custom-2fa',
      'address-list',
      'intent',
      'listing',
      'bid',
      'pm-sell-intent',
      'pm-buy-intent',
      'transfer'
    ];
    for (const verb of shouldHaveJsonOnly) {
      const c = buildCommand.commands.find((cmd) => cmd.name() === verb)!;
      const optLongs = (c.options as any[]).map((o) => o.long);
      expect(optLongs).toContain('--json-only');
    }
  });

  it('product-catalog requires --products and --store-address', () => {
    const c = buildCommand.commands.find((cmd) => cmd.name() === 'product-catalog')!;
    const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
    expect(required).toContain('--products');
    expect(required).toContain('--store-address');
  });

  it('smart-token requires --backing-coin', () => {
    const c = buildCommand.commands.find((cmd) => cmd.name() === 'smart-token')!;
    const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
    expect(required).toContain('--backing-coin');
  });

  it('prediction-market requires --verifier (NOTE: the help text calls it "resolver" but the flag is --verifier)', () => {
    // The flag is `--verifier` (chain msg field name) but the human help
    // describes it as "Market resolver address". The naming mismatch is
    // friction — locked here so a future rename surfaces in CI.
    const c = buildCommand.commands.find((cmd) => cmd.name() === 'prediction-market')!;
    const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
    expect(required).toContain('--verifier');
  });

  it('credit-token requires --payment-denom and --recipient', () => {
    // The flag is `--payment-denom`, NOT `--denom` (unlike subscription /
    // bounty / quests which use --denom). Locked because the naming
    // inconsistency tripped the e2e smoke.
    const c = buildCommand.commands.find((cmd) => cmd.name() === 'credit-token')!;
    const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
    expect(required).toContain('--payment-denom');
    expect(required).toContain('--recipient');
  });
});

describe('product-catalog metadata fallback', () => {
  // Locked against the 2026-05-13 smoke fix: when the catalog has --uri
  // and individual products supply only name/price/denom, the builder
  // now falls back to the catalog URI for per-token metadata.
  it('falls back to catalog --uri when products lack their own image', () => {
    const msg = buildProductCatalog({
      products: [
        { name: 'Mug', price: 10, denom: 'USDC' },
        { name: 'Sticker', price: 2, denom: 'USDC' }
      ],
      storeAddress: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
      uri: 'ipfs://catalog-metadata'
    });
    expect(msg).toBeDefined();
    expect(msg.value.tokenMetadata).toHaveLength(2);
    // Each product entry should have the catalog URI (URI mode) since
    // no per-product metadata was supplied.
    for (const entry of msg.value.tokenMetadata) {
      expect(entry.uri).toBe('ipfs://catalog-metadata');
    }
  });

  it('uses per-product uri when supplied (still works after fallback fix)', () => {
    const msg = buildProductCatalog({
      products: [
        { name: 'Mug', price: 10, denom: 'USDC', uri: 'ipfs://mug' },
        { name: 'Sticker', price: 2, denom: 'USDC', uri: 'ipfs://sticker' }
      ],
      storeAddress: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
      uri: 'ipfs://catalog'
    });
    expect(msg.value.tokenMetadata[0].uri).toBe('ipfs://mug');
    expect(msg.value.tokenMetadata[1].uri).toBe('ipfs://sticker');
  });

  it('uses per-product image when supplied (inline metadata mode)', () => {
    const msg = buildProductCatalog({
      products: [
        { name: 'Mug', price: 10, denom: 'USDC', image: 'ipfs://mug.png', description: 'Coffee mug' }
      ],
      storeAddress: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
      uri: 'ipfs://catalog'
    });
    // Inline mode: uri stays empty, customData carries the metadata.
    expect(msg.value.tokenMetadata[0].uri).toBe('');
    const parsed = JSON.parse(msg.value.tokenMetadata[0].customData);
    expect(parsed.name).toBe('Mug');
    expect(parsed.image).toBe('ipfs://mug.png');
    expect(parsed.description).toBe('Coffee mug');
  });
});

describe('build CLI agent ergonomics (BB-312)', () => {
  const cliTs = path.resolve(__dirname, '../index.ts');
  const validBb1 = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
  const validEth = '0x0000000000000000000000000000000000000000';

  function runCliTs(args: string[]) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-build-ergo-'));
    try {
      return spawnSync('bun', [cliTs, ...args], {
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

  it('validateCreatorFlag accepts valid bb1, 0x (normalized), and Mint while rejecting garbage', () => {
    expect(validateCreatorFlag(undefined)).toBeUndefined();
    expect(validateCreatorFlag('Mint')).toBe('Mint');
    expect(validateCreatorFlag(validBb1)).toBe(validBb1);
    expect(validateCreatorFlag(validEth)).toBe(validBb1);
    expect(() => validateCreatorFlag('notanaddress')).toThrow(/Invalid --creator/);
    expect(() => validateCreatorFlag('bb1broken')).toThrow(/Invalid --creator/);
  });

  it('parseNumericFlag rejects non-numeric and missing required values with invalid_input', () => {
    expect(parseNumericFlag('10', '--price', { required: true })).toBe(10);
    expect(parseNumericFlag(undefined, '--limit')).toBeUndefined();
    expect(() => parseNumericFlag(undefined, '--price', { required: true })).toThrow(/--price/);
    expect(() => parseNumericFlag('abc', '--price', { required: true })).toThrow(/Invalid numeric value "abc" for --price/);
  });

  it('bb build rejects --creator notanaddress with invalid_address envelope', () => {
    const res = runCliTs([
      'build',
      'vault',
      '--backing-coin',
      'USDC',
      '--uri',
      'ipfs://meta',
      '--creator',
      'notanaddress'
    ]);
    expect(res.status).not.toBe(0);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('invalid_address');
    expect(env.error.message).toMatch(/--creator/);
  });

  it('bb build subscription without --price emits clean invalid_input message (not raw Zod JSON)', () => {
    const res = runCliTs(['build', 'subscription', '--interval', 'monthly']);
    expect(res.status).not.toBe(0);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('invalid_input');
    expect(env.error.message).toMatch(/--price/);
    expect(env.error.message).not.toMatch(/^\s*\[/);
  });

  it('bb build subscription with --price abc emits clean invalid_input message', () => {
    const res = runCliTs([
      'build',
      'subscription',
      '--interval',
      'monthly',
      '--price',
      'abc',
      '--denom',
      'USDC',
      '--recipient',
      validBb1,
      '--uri',
      'ipfs://meta'
    ]);
    expect(res.status).not.toBe(0);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('invalid_input');
    expect(env.error.message).toMatch(/--price/);
  });

  it('bb build --output-file writes the full envelope to disk AND emits a receipt envelope on stdout', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-outfile-'));
    const outPath = path.join(dir, 'tx.json');
    try {
      const res = runCliTs([
        'build',
        'vault',
        '--backing-coin',
        'USDC',
        '--uri',
        'ipfs://meta',
        '--creator',
        validBb1,
        '--output-file',
        outPath
      ]);
      expect(res.status).toBe(0);
      const stdoutEnv = JSON.parse(res.stdout);
      expect(stdoutEnv.ok).toBe(true);
      expect(stdoutEnv.data.outputFile).toBe(outPath);
      expect(stdoutEnv.data.typeUrl).toBe('/tokenization.MsgCreateCollection');

      const fileEnv = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
      expect(fileEnv.ok).toBe(true);
      expect(fileEnv.data.typeUrl).toBe('/tokenization.MsgCreateCollection');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('bb check reports malformed JSON with a single Accepts hint and no double period', () => {
    const res = runCliTs(['check', '{not json']);
    expect(res.status).toBe(2);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('invalid_input');
    expect((env.error.message.match(/Accepts:/g) ?? []).length).toBe(1);
    expect(env.error.message).not.toContain('..');
  });

  it('bb check rejects invalid creator address as an error (validation_failed)', () => {
    const res = runCliTs([
      'check',
      JSON.stringify({
        typeUrl: '/tokenization.MsgCreateCollection',
        value: { creator: 'notanaddress', validTokenIds: [{ start: '1', end: '1' }] }
      })
    ]);
    expect(res.status).toBe(2);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('validation_failed');
  });
});
