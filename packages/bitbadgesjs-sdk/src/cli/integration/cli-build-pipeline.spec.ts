/**
 * Integration: the foundational `bb` verb pipeline.
 *
 *   bb build <subcommand>  → emits a {typeUrl, value} (or wrapper) JSON
 *   bb check <msg>         → analyzes the built msg
 *   bb explain <msg>       → plain-English render
 *
 * Standards-specific builds (bounty, products, subscription, etc.) are
 * already covered by their per-standard integration specs. This spec
 * fills the gap: every NON-standards `bb build` subcommand (smart-token,
 * vault, custom-2fa, quests, address-list, listing, bid, etc.) plus the
 * cross-cutting `check` / `explain` verbs.
 *
 * Pure compute — no chain, no indexer. Runs fast.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { runCli } from './harness/cli.js';

const CREATOR = 'bb17j2h558cfchfc7w9wn8kyhjevkqu2t7q5dq2d7'; // alice on local chain
const IMG = 'https://example.com/x.png';

function writeTmp(data: any): string {
  const p = path.join(os.tmpdir(), `bb-build-${crypto.randomBytes(4).toString('hex')}.json`);
  fs.writeFileSync(p, JSON.stringify(data), 'utf-8');
  return p;
}

describe('cli build pipeline integration', () => {
  // No chain dependency — preflight is overkill. We do need the built
  // dist/cjs CLI though; the harness already requires it.

  // ── Non-standard collection builders ───────────────────────────────────

  describe('bb build smart-token', () => {
    it('emits MsgCreateCollection', () => {
      const out = runCli([
        'build', 'smart-token',
        '--backing-coin', 'USDC',
        '--symbol', 'vUSDC',
        '--name', 'Test SA',
        '--image', IMG,
        '--description', 'A test smart account',
        '--creator', CREATOR
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgCreateCollection');
      expect(out.json.value.creator).toBe(CREATOR);
    });

    it('--tradable flag adds the trading approval', () => {
      const out = runCli([
        'build', 'smart-token',
        '--backing-coin', 'USDC', '--tradable',
        '--name', 'T', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]);
      expect(out.json.value.collectionApprovals.length).toBeGreaterThan(0);
    });
  });

  describe('bb build vault', () => {
    it('emits MsgCreateCollection with backing-coin alias path', () => {
      const out = runCli([
        'build', 'vault',
        '--backing-coin', 'USDC',
        '--name', 'V', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgCreateCollection');
      expect(out.json.value.aliasPathsToAdd?.length ?? 0).toBeGreaterThan(0);
    });
  });

  describe('bb build custom-2fa', () => {
    it('emits MsgCreateCollection tagged "Custom-2FA"', () => {
      const out = runCli([
        'build', 'custom-2fa',
        '--name', 'C', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgCreateCollection');
      expect(out.json.value.standards).toContain('Custom-2FA');
    });
  });

  // `bb custom-2fa mint` parse/guard coverage (ticket 0420) — emit-only,
  // no devnet. The on-chain broadcast is in integration/custom-2fa.spec.ts.
  describe('bb custom-2fa mint (parse + guards)', () => {
    const BURN = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

    it('emits MsgTransferTokens with a default 5-minute (300000ms) ownership window', () => {
      const out = runCli(['custom-2fa', 'mint', '84', '--creator', CREATOR, '--to', BURN, '--local']);
      expect(out.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
      const t = out.json.value.transfers[0];
      expect(t.from).toBe('Mint');
      expect(t.toAddresses).toEqual([BURN]);
      const ot = t.balances[0].ownershipTimes[0];
      expect(Number(ot.end) - Number(ot.start)).toBe(300000);
    });

    it('honors a custom --expiration duration (10m → 600000ms)', () => {
      const out = runCli(['custom-2fa', 'mint', '84', '--creator', CREATOR, '--to', BURN, '--expiration', '10m', '--local']);
      const ot = out.json.value.transfers[0].balances[0].ownershipTimes[0];
      expect(Number(ot.end) - Number(ot.start)).toBe(600000);
    });

    it('comma-splits + de-dupes recipients', () => {
      const out = runCli(['custom-2fa', 'mint', '84', '--creator', CREATOR, '--to', `${CREATOR},${CREATOR},${BURN}`, '--local']);
      expect(out.json.value.transfers[0].toAddresses).toEqual([CREATOR, BURN]);
    });

    it('rejects a non-bb1 recipient (strict)', () => {
      const out = runCli(
        ['custom-2fa', 'mint', '84', '--creator', CREATOR, '--to', '0x0000000000000000000000000000000000000000', '--local'],
        { throwOnError: false, parseJson: false }
      );
      expect(out.exitCode).not.toBe(0);
    });

    it('rejects a valid-but-past --expiration (future-window guard)', () => {
      // 1577836800000 = 2020-01-01 UTC: a valid ms-since-epoch (parses
      // fine) that is firmly in the past, so it reaches and trips the
      // command's `expirationMs <= 0` guard.
      const out = runCli(
        ['custom-2fa', 'mint', '84', '--creator', CREATOR, '--to', BURN, '--expiration', '1577836800000', '--local'],
        { throwOnError: false, parseJson: false }
      );
      expect(out.exitCode).not.toBe(0);
      expect(out.stderr + out.stdout).toMatch(/future/i);
    });

    it('rejects an unparseable --expiration value', () => {
      const out = runCli(
        ['custom-2fa', 'mint', '84', '--creator', CREATOR, '--to', BURN, '--expiration', 'not-a-time', '--local'],
        { throwOnError: false, parseJson: false }
      );
      expect(out.exitCode).not.toBe(0);
      expect(out.stderr + out.stdout).toMatch(/invalid (time|duration)/i);
    });
  });

  describe('bb build quests', () => {
    it('emits MsgCreateCollection with the quest standard', () => {
      const out = runCli([
        'build', 'quests',
        '--reward', '10', '--denom', 'BADGE', '--max-claims', '100',
        '--name', 'Q', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgCreateCollection');
    });
  });

  describe('bb build address-list', () => {
    it('emits a create-style msg', () => {
      const out = runCli([
        'build', 'address-list',
        '--name', 'L', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]);
      expect(out.json.typeUrl).toMatch(/MsgCreate(Collection|AddressList)/);
    });
  });

  // ── Approval builders (user-level) ─────────────────────────────────────

  describe('bb build listing', () => {
    it('emits MsgSetOutgoingApproval — identical shape to bb nfts list', () => {
      const out = runCli([
        'build', 'listing',
        '--address', CREATOR, '--collection-id', '1', '--token-ids', '1',
        '--price', '10', '--denom', 'USDC'
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgSetOutgoingApproval');
      expect(out.json.value.creator).toBe(CREATOR);
      expect(out.json.value.collectionId).toBe('1');
      expect(out.json.value.approval.toListId).toBe('All');
    });
  });

  describe('bb build bid', () => {
    it('emits MsgSetIncomingApproval — identical shape to bb nfts bid', () => {
      const out = runCli([
        'build', 'bid',
        '--address', CREATOR, '--collection-id', '1', '--token-ids', '1',
        '--price', '5', '--denom', 'USDC'
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgSetIncomingApproval');
      expect(out.json.value.creator).toBe(CREATOR);
      expect(out.json.value.approval.fromListId).toBe('All');
    });
  });

  describe('bb build intent', () => {
    it('emits MsgSetOutgoingApproval — identical shape to bb intents create', () => {
      const out = runCli([
        'build', 'intent',
        '--address', CREATOR, '--collection-id', '24',
        '--pay-denom', 'USDC', '--pay-amount', '10',
        '--receive-denom', 'BADGE', '--receive-amount', '100'
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgSetOutgoingApproval');
      expect(out.json.value.creator).toBe(CREATOR);
      expect(out.json.value.approval.fromListId).toBe(CREATOR);
    });
  });

  describe('bb build pm-buy-intent', () => {
    it('emits MsgSetIncomingApproval — identical shape to bb prediction-markets buy-yes', () => {
      const out = runCli([
        'build', 'pm-buy-intent',
        '--address', CREATOR, '--collection-id', '1',
        '--token', 'yes', '--amount', '10',
        '--price', '5', '--denom', 'USDC'
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgSetIncomingApproval');
      expect(out.json.value.creator).toBe(CREATOR);
      expect(out.json.value.collectionId).toBe('1');
      expect(out.json.value.approval.fromListId).toBe('All');
    });
  });

  describe('bb build send (cosmos.bank MsgSend)', () => {
    const RECIPIENT = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

    it('symbol denom converts display → base units', () => {
      const out = runCli([
        'build', 'send',
        '--from', CREATOR, '--to', RECIPIENT,
        '--amount', '10', '--denom', 'BADGE'
      ]);
      expect(out.json.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend');
      expect(out.json.value.fromAddress).toBe(CREATOR);
      expect(out.json.value.toAddress).toBe(RECIPIENT);
      expect(out.json.value.amount).toHaveLength(1);
      // BADGE has 9 decimals → 10 * 10^9 = 10000000000
      expect(out.json.value.amount[0]).toEqual({ denom: 'ubadge', amount: '10000000000' });
    });

    it('--base-units treats amount as raw base units', () => {
      const out = runCli([
        'build', 'send',
        '--from', CREATOR, '--to', RECIPIENT,
        '--amount', '42', '--denom', 'ubadge', '--base-units'
      ]);
      expect(out.json.value.amount[0]).toEqual({ denom: 'ubadge', amount: '42' });
    });

    it('USDC symbol resolves to its IBC denom', () => {
      const out = runCli([
        'build', 'send',
        '--from', CREATOR, '--to', RECIPIENT,
        '--amount', '1', '--denom', 'USDC'
      ]);
      expect(out.json.value.amount[0].denom).toMatch(/^ibc\//);
      // USDC has 6 decimals → 1 → 1000000
      expect(out.json.value.amount[0].amount).toBe('1000000');
    });

    it('0x address rejects strictly with a `bb account convert` hint', () => {
      // Post-v2.1 strict mode: msg-emit address flags throw on 0x input.
      const out = runCli(
        [
          'build', 'send',
          '--from', '0x0000000000000000000000000000000000000000',
          '--to', RECIPIENT,
          '--amount', '1', '--denom', 'BADGE'
        ],
        { throwOnError: false, parseJson: false }
      );
      expect(out.exitCode).not.toBe(0);
      expect(out.stderr).toMatch(/bb1\.\.\. address/);
      expect(out.stderr).toMatch(/bb account convert/);
    });

    it('BB_ADDRESS_AUTO_CONVERT=1 restores lenient 0x→bb1 normalization', () => {
      // Back-compat escape hatch for one release.
      const out = runCli(
        [
          'build', 'send',
          '--from', '0x0000000000000000000000000000000000000000',
          '--to', RECIPIENT,
          '--amount', '1', '--denom', 'BADGE'
        ],
        { env: { BB_ADDRESS_AUTO_CONVERT: '1' } }
      );
      expect(out.json.value.fromAddress).toBe('bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv');
    });

    it('rejects an unknown denom symbol with a clear error', () => {
      const out = runCli(
        ['build', 'send', '--from', CREATOR, '--to', RECIPIENT, '--amount', '1', '--denom', 'NOSUCHCOIN'],
        { throwOnError: false, parseJson: false }
      );
      expect(out.exitCode).not.toBe(0);
      expect(out.stderr).toMatch(/Unknown denom|Unknown coin/i);
    });

    it('rejects non-integer base-units amount', () => {
      const out = runCli(
        ['build', 'send', '--from', CREATOR, '--to', RECIPIENT, '--amount', '1.5', '--denom', 'ubadge', '--base-units'],
        { throwOnError: false, parseJson: false }
      );
      expect(out.exitCode).not.toBe(0);
      expect(out.stderr).toMatch(/non-negative integer/i);
    });
  });

  describe('bb build pm-sell-intent', () => {
    it('emits MsgSetOutgoingApproval — identical shape to bb prediction-markets sell-no', () => {
      const out = runCli([
        'build', 'pm-sell-intent',
        '--address', CREATOR, '--collection-id', '1',
        '--token', 'no', '--amount', '10',
        '--price', '5', '--denom', 'USDC'
      ]);
      expect(out.json.typeUrl).toBe('/tokenization.MsgSetOutgoingApproval');
      expect(out.json.value.creator).toBe(CREATOR);
      expect(out.json.value.collectionId).toBe('1');
      expect(out.json.value.approval.toListId).toBe('All');
    });
  });

  // ── Cross-cutting verbs: check / explain ──────────────────────────────

  describe('bb check', () => {
    it('structural check is clean on a freshly built smart-token', () => {
      const built = runCli([
        'build', 'smart-token',
        '--backing-coin', 'USDC',
        '--name', 'T', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]).json;
      const tmp = writeTmp(built);
      // Use --depth structural; full check on a default smart-token flags
      // a CRITICAL "forceful transfers not locked" review finding which
      // would exit 2 even though the validate section is clean.
      const out = runCli(['check', tmp, '--depth', 'structural']);
      expect(out.exitCode).toBe(0);
      // structural depth returns the validate section directly (not wrapped).
      expect(out.json.valid).toBe(true);
      expect(out.json.issues).toEqual([]);
    });

    it('full check returns valid:true even when review flags critical', () => {
      const built = runCli([
        'build', 'smart-token',
        '--backing-coin', 'USDC',
        '--name', 'T', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]).json;
      const tmp = writeTmp(built);
      const out = runCli(['check', tmp], { throwOnError: false });
      // Validate section must be clean — the noForcefulPostMintTransfers
      // critical comes from the review section, not validate.
      expect(out.json.validate.valid).toBe(true);
    });

    it('--depth structural runs the lightweight check', () => {
      const built = runCli([
        'build', 'custom-2fa',
        '--name', 'T', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]).json;
      const tmp = writeTmp(built);
      const out = runCli(['check', tmp, '--depth', 'structural']);
      expect(out.exitCode).toBe(0);
    });

    it('--strict on a structural-clean msg still exits 0', () => {
      // Structural-only depth skips the review section entirely, so
      // --strict has no warnings to promote. Exits 0.
      const built = runCli([
        'build', 'custom-2fa',
        '--name', 'T', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]).json;
      const tmp = writeTmp(built);
      const out = runCli(['check', tmp, '--strict', '--depth', 'structural'], {
        throwOnError: false, parseJson: false
      });
      expect(out.exitCode).toBe(0);
    });

    it('rejects malformed JSON input', () => {
      const tmp = path.join(os.tmpdir(), `bb-check-bad-${crypto.randomBytes(4).toString('hex')}.json`);
      fs.writeFileSync(tmp, '{not valid', 'utf-8');
      const out = runCli(['check', tmp], { throwOnError: false, parseJson: false });
      expect(out.exitCode).not.toBe(0);
    });
  });

  describe('bb explain', () => {
    it('renders a plain-English description of a built msg', () => {
      const built = runCli([
        'build', 'smart-token',
        '--backing-coin', 'USDC',
        '--name', 'T', '--image', IMG, '--description', 'D', '--creator', CREATOR
      ]).json;
      const tmp = writeTmp(built);
      const out = runCli(['explain', tmp], { parseJson: false });
      expect(out.exitCode).toBe(0);
      expect(out.stdout.length).toBeGreaterThan(0);
    });
  });
});
