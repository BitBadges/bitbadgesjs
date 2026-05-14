/**
 * Integration: `bb portfolio` against a live local indexer.
 *
 * Read-only aggregator over five existing routes. The portfolio command
 * doesn't *produce* state — it just bundles reads — so the integration
 * surface we care about is:
 *   1. it actually hits a local indexer (not the default mainnet URL),
 *   2. every requested section appears in the response (or with an
 *      isolated `{error}` payload, never a top-level abort),
 *   3. `--include` correctly narrows the payload,
 *   4. address normalization (0x → bb1) flows through.
 *
 * We query alice's address — she's a known persona in the local keyring
 * and may or may not have any tokens/balances, which is fine. We're
 * asserting the SHAPE of the snapshot, not its contents.
 *
 * Skipped automatically when preflight fails.
 */

import { preflightIntegration } from './harness/preflight.js';
import { alice } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import { convertToEthAddress } from '../../address-converter/converter.js';

describe('portfolio integration', () => {
  let ready = false;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('default returns all five sections', () => {
    if (!ready) return;
    const addr = alice().address;
    const out = runCli(['portfolio', '--address', addr, '--local']);
    expect(out.json.address).toBe(addr);
    for (const section of ['account', 'tokens', 'balances', 'assets', 'activity']) {
      expect(out.json).toHaveProperty(section);
    }
    // tokens fans out to three views
    expect(out.json.tokens).toHaveProperty('collected');
    expect(out.json.tokens).toHaveProperty('created');
    expect(out.json.tokens).toHaveProperty('managing');
    // activity fans out to three feeds
    expect(out.json.activity).toHaveProperty('transfers');
    expect(out.json.activity).toHaveProperty('claims');
    expect(out.json.activity).toHaveProperty('points');
  });

  it('--include narrows the payload to the requested sections', () => {
    if (!ready) return;
    const addr = alice().address;
    const out = runCli(['portfolio', '--address', addr, '--include', 'balances,activity', '--local']);
    expect(out.json.address).toBe(addr);
    expect(out.json).toHaveProperty('balances');
    expect(out.json).toHaveProperty('activity');
    expect(out.json).not.toHaveProperty('account');
    expect(out.json).not.toHaveProperty('tokens');
    expect(out.json).not.toHaveProperty('assets');
  });

  it('--exclude drops the named sections', () => {
    if (!ready) return;
    const addr = alice().address;
    const out = runCli(['portfolio', '--address', addr, '--exclude', 'assets,tokens', '--local']);
    expect(out.json).toHaveProperty('account');
    expect(out.json).toHaveProperty('balances');
    expect(out.json).toHaveProperty('activity');
    expect(out.json).not.toHaveProperty('assets');
    expect(out.json).not.toHaveProperty('tokens');
  });

  it('accepts 0x form and normalizes to bb1 in the output', () => {
    if (!ready) return;
    const bb1 = alice().address;
    const hex = convertToEthAddress(bb1);
    const out = runCli(['portfolio', '--address', hex, '--include', 'balances', '--local']);
    expect(out.json.address).toBe(bb1);
  });

  it('rejects unknown sections in --include with non-zero exit', () => {
    if (!ready) return;
    const out = runCli(
      ['portfolio', '--address', alice().address, '--include', 'not-a-section', '--local'],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toMatch(/not-a-section/);
  });

  it('--chain and --all-chains are mutually exclusive', () => {
    if (!ready) return;
    const out = runCli(
      [
        'portfolio',
        '--address', alice().address,
        '--include', 'assets',
        '--chain', 'bitbadges-1',
        '--all-chains',
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toMatch(/--chain or --all-chains/);
  });
});
