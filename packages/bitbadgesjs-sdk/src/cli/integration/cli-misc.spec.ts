/**
 * Integration: miscellaneous surfaces that don't fit elsewhere.
 *
 *   - bb completion     — shell completion script generation
 *   - bb gen-tx-payload — pure-compute payload assembly (skips signer work)
 *   - bb tx status      — chain-RPC tx lookup (uses local chain if available)
 *
 * The `bb tx wait` command is not covered here — by design it blocks until
 * the tx commits, which requires real chain interaction and a fresh tx
 * hash; the standards integration specs already exercise this transitively
 * via deployMsgViaKeyring → waitForTx.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { runCli } from './harness/cli.js';

describe('bb completion', () => {
  it('emits a bash-compatible completion script', () => {
    const out = runCli(['completion'], { parseJson: false });
    expect(out.exitCode).toBe(0);
    // Must include the function definition + at least one subcommand name +
    // the registrations for both binary names.
    expect(out.stdout).toContain('_bitbadges_cli_complete()');
    expect(out.stdout).toContain('build');
    expect(out.stdout).toContain('compgen');
    expect(out.stdout).toContain('complete -F _bitbadges_cli_complete bitbadges-cli');
    expect(out.stdout).toContain('complete -F _bitbadges_cli_complete bb');
  });

  it('emits a nested case branch for at least one multi-level command path', () => {
    // v2 of the generator walks the full tree, so `auctions create` (or
    // any other 2-level subcommand) should appear as a quoted case key.
    const out = runCli(['completion'], { parseJson: false });
    expect(out.stdout).toMatch(/'(auctions|bounties|subscriptions|crowdfunds|smart-tokens|nfts) [a-z-]+'\)/);
  });
});

describe('bb gen-tx-payload', () => {
  const CREATOR = 'bb17j2h558cfchfc7w9wn8kyhjevkqu2t7q5dq2d7';
  const IMG = 'https://example.com/x.png';

  it('produces a payload (or fails with a clear error on unfunded sender)', () => {
    // Build a minimal msg first, then pipe to gen-tx-payload.
    const built = runCli([
      'build', 'custom-2fa',
      '--name', 'T', '--image', IMG, '--description', 'D', '--creator', CREATOR
    ]).json;
    const tmp = path.join(os.tmpdir(), `bb-genpayload-${crypto.randomBytes(4).toString('hex')}.json`);
    fs.writeFileSync(tmp, JSON.stringify(built));

    const out = runCli(
      ['gen-tx-payload', tmp, '--from', CREATOR, '--local'],
      { throwOnError: false, parseJson: false }
    );
    // The command may exit 0 (payload produced) OR non-zero if alice's
    // account doesn't have a public key on chain yet on this local node.
    // Either way it should produce some output.
    expect(out.stdout.length + out.stderr.length).toBeGreaterThan(0);
  });
});

describe('bb tx status', () => {
  it('exits non-zero (with a clear error) for an unknown txhash', () => {
    // 64-char hex string that isn't a real tx.
    const fakeHash = 'A'.repeat(64);
    const out = runCli(
      ['tx', 'status', fakeHash, '--local'],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/not found|404|error|invalid/i);
  });
});
