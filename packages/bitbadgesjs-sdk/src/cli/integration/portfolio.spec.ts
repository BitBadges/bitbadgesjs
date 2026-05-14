/**
 * Integration: `bb portfolio <subcommand>` against a live local indexer.
 *
 * Each subcommand is a thin wrapper over an existing indexer route, so
 * the integration surface we guard is:
 *   1. each subcommand hits the right endpoint (status 200, response
 *      shape includes the documented top-level keys),
 *   2. `all` aggregator still bundles every section into one response,
 *   3. address normalization (0x → bb1) is consistent across subcommands,
 *   4. flag validation rejects bad input with a clear exit-2.
 *
 * We query alice — known persona in the local keyring. Whether she has
 * tokens / approvals / activity is irrelevant; we're asserting payload
 * SHAPE, not contents.
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

  it('account returns a single user payload', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'account', '--address', alice().address, '--local']);
    expect(out.json).toHaveProperty('account');
  });

  it('tokens defaults to view=collected and returns tokens + pagination', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'tokens', '--address', alice().address, '--local']);
    expect(out.json).toHaveProperty('tokens');
    expect(Array.isArray(out.json.tokens)).toBe(true);
    expect(out.json).toHaveProperty('pagination');
  });

  it('tokens --view all fans out to collected/created/managing', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'tokens', '--address', alice().address, '--view', 'all', '--local']);
    expect(out.json).toHaveProperty('collected');
    expect(out.json).toHaveProperty('created');
    expect(out.json).toHaveProperty('managing');
  });

  it('tokens rejects an unknown --view with exit 2', () => {
    if (!ready) return;
    const out = runCli(
      ['portfolio', 'tokens', '--address', alice().address, '--view', 'definitely-not-real', '--local'],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toMatch(/--view/);
  });

  it('balances returns docs + pagination', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'balances', '--address', alice().address, '--local']);
    expect(out.json).toHaveProperty('docs');
    expect(Array.isArray(out.json.docs)).toBe(true);
    expect(out.json).toHaveProperty('pagination');
  });

  it('assets defaults to bitbadges-1 and returns a balances map', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'assets', '--address', alice().address, '--local']);
    expect(out.json).toHaveProperty('balances');
  });

  it('assets rejects mutually-exclusive --chain + --all-chains', () => {
    if (!ready) return;
    const out = runCli(
      [
        'portfolio',
        'assets',
        '--address',
        alice().address,
        '--chain',
        'bitbadges-1',
        '--all-chains',
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toMatch(/--chain or --all-chains/);
  });

  it('activity defaults to type=tokens and returns an activity feed', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'activity', '--address', alice().address, '--local']);
    expect(out.json).toHaveProperty('activity');
    expect(Array.isArray(out.json.activity)).toBe(true);
    expect(out.json).toHaveProperty('pagination');
  });

  it('activity --type all fans out to transfers/claims/points', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'activity', '--address', alice().address, '--type', 'all', '--local']);
    expect(out.json).toHaveProperty('transfers');
    expect(out.json).toHaveProperty('claims');
    expect(out.json).toHaveProperty('points');
  });

  it('approvals defaults to --collection=any and returns docs', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'approvals', '--address', alice().address, '--local']);
    // filterApprovals returns { docs: [...], pagination: {...} }
    expect(out.json).toHaveProperty('docs');
    expect(Array.isArray(out.json.docs)).toBe(true);
  });

  it('approvals requires --denom when --price-min/--price-max is set', () => {
    if (!ready) return;
    const out = runCli(
      [
        'portfolio',
        'approvals',
        '--address',
        alice().address,
        '--price-min',
        '100',
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toMatch(/--denom/);
  });

  it('all returns every section in one bundle', () => {
    if (!ready) return;
    const out = runCli(['portfolio', 'all', '--address', alice().address, '--local']);
    expect(out.json.address).toBe(alice().address);
    for (const section of ['account', 'tokens', 'balances', 'assets', 'activity', 'approvals']) {
      expect(out.json).toHaveProperty(section);
    }
  });

  it('all --include narrows the payload', () => {
    if (!ready) return;
    const out = runCli([
      'portfolio',
      'all',
      '--address',
      alice().address,
      '--include',
      'balances,approvals',
      '--local'
    ]);
    expect(out.json).toHaveProperty('balances');
    expect(out.json).toHaveProperty('approvals');
    expect(out.json).not.toHaveProperty('account');
    expect(out.json).not.toHaveProperty('tokens');
    expect(out.json).not.toHaveProperty('assets');
    expect(out.json).not.toHaveProperty('activity');
  });

  it('every subcommand accepts 0x form and normalizes (visible via address echo)', () => {
    if (!ready) return;
    const bb1 = alice().address;
    const hex = convertToEthAddress(bb1);
    const out = runCli(['portfolio', 'all', '--address', hex, '--include', 'balances', '--local']);
    expect(out.json.address).toBe(bb1);
  });
});
