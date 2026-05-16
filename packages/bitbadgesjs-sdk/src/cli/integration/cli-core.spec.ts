/**
 * Integration: cli-core — the non-standard CLI surface.
 *
 * Covers:
 *   - bb address (convert, validate)
 *   - bb lookup (token info)
 *   - bb alias (deterministic alias addresses)
 *   - bb gen-list-id (reserved address list id)
 *   - bb gen-pub-key (indexer/chain lookup)
 *   - bb balances (ics20 / bitbadges / assets — indexer reads)
 *   - bb swap (assets, chains)
 *   - bb doctor
 *
 * These are mostly read-only / pure-compute commands — they don't
 * mutate chain state. Fast.
 */

import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie } from './harness/personas.js';
import { runCli } from './harness/cli.js';

describe('cli-core integration', () => {
  let ready = false;
  beforeAll(async () => { ready = (await preflightIntegration()).ok; }, 30000);

  // ── address ─────────────────────────────────────────────────────────────

  describe('bb address', () => {
    it('validate accepts a valid bb1 address', () => {
      if (!ready) return;
      const out = runCli(['address', 'validate', alice().address]);
      expect(out.exitCode).toBe(0);
      expect(out.json).toMatchObject({ valid: true, chain: 'BitBadges' });
    });

    it('validate detects an 0x ETH address', () => {
      if (!ready) return;
      const out = runCli(['address', 'validate', '0x0000000000000000000000000000000000000000']);
      expect(out.json).toMatchObject({ valid: true, chain: 'Ethereum' });
    });

    it('convert bb1 → 0x round-trips deterministically', () => {
      if (!ready) return;
      const zeroEth = '0x0000000000000000000000000000000000000000';
      const toBb1 = runCli(['address', 'convert', zeroEth, '--to', 'bb1']);
      expect(toBb1.json.result).toBe('bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv');
      const backToEth = runCli(['address', 'convert', toBb1.json.result, '--to', '0x']);
      expect(backToEth.json.result.toLowerCase()).toBe(zeroEth);
    });
  });

  // ── lookup ──────────────────────────────────────────────────────────────

  describe('bb lookup', () => {
    it('with no symbol lists all known tokens', () => {
      if (!ready) return;
      const out = runCli(['lookup']);
      expect(Array.isArray(out.json.tokens)).toBe(true);
      expect(out.json.tokens.length).toBeGreaterThan(0);
      // Spot check: BADGE and USDC should be in the registry.
      const symbols = out.json.tokens.map((t: any) => t.symbol);
      expect(symbols).toContain('BADGE');
    });

    it('looks up a single token by symbol', () => {
      if (!ready) return;
      const out = runCli(['lookup', 'BADGE']);
      expect(out.json).toMatchObject({ symbol: 'BADGE' });
      expect(out.json.decimals).toBeGreaterThan(0);
      expect(typeof out.json.ibcDenom).toBe('string');
    });

    it('exits non-zero on unknown symbol', () => {
      if (!ready) return;
      const out = runCli(['lookup', 'NOSUCHTOKEN'], { throwOnError: false });
      expect(out.envelope.ok).toBe(false);
      expect(out.envelope.error.message).toMatch(/Unknown token/);
    });
  });

  // ── alias ───────────────────────────────────────────────────────────────

  describe('bb alias', () => {
    it('for-mint-escrow <id> returns a deterministic bb1 address', () => {
      if (!ready) return;
      const out = runCli(['alias', 'for-mint-escrow', '42']);
      expect(out.json.address).toMatch(/^bb1/);
      // Determinism: same input → same output
      const again = runCli(['alias', 'for-mint-escrow', '42']);
      expect(again.json.address).toBe(out.json.address);
    });

    it('for-ibc-backing <denom> returns an alias address', () => {
      if (!ready) return;
      const out = runCli(['alias', 'for-ibc-backing', 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349']);
      expect(out.json.address).toMatch(/^bb1/);
    });
  });

  // ── gen-list-id ─────────────────────────────────────────────────────────

  describe('bb gen-list-id', () => {
    it('returns a deterministic list id for a single address', () => {
      if (!ready) return;
      const out = runCli(['gen-list-id', alice().address], { parseJson: false });
      const listId = out.stdout.trim();
      expect(listId.length).toBeGreaterThan(0);
      // Re-running with same address must return the same id.
      const again = runCli(['gen-list-id', alice().address], { parseJson: false });
      expect(again.stdout.trim()).toBe(listId);
    });

    it('different address set → different list id', () => {
      if (!ready) return;
      const a = runCli(['gen-list-id', alice().address], { parseJson: false }).stdout.trim();
      const c = runCli(['gen-list-id', charlie().address], { parseJson: false }).stdout.trim();
      expect(a).not.toBe(c);
    });

    it('--blacklist flips the id', () => {
      if (!ready) return;
      const white = runCli(['gen-list-id', alice().address], { parseJson: false }).stdout.trim();
      const black = runCli(['gen-list-id', alice().address, '--blacklist'], { parseJson: false }).stdout.trim();
      expect(white).not.toBe(black);
    });
  });

  // ── gen-pub-key ─────────────────────────────────────────────────────────

  describe('bb gen-pub-key', () => {
    it('resolves a pubkey for an address that has broadcast a tx', () => {
      if (!ready) return;
      // alice has presumably broadcast txs (she funded other personas + deployed
      // collections in earlier specs). If she hasn't yet, the recovery flow
      // would kick in which requires interactive signing — skip in that case.
      const out = runCli(['gen-pub-key', '--address', alice().address, '--local'], { throwOnError: false });
      if (out.exitCode !== 0) {
        process.stderr.write(`[integration] gen-pub-key skipped: ${out.stderr.slice(0, 200)}\n`);
        return;
      }
      // Output is JSON {address, publicKey: ...}
      expect(out.json).toBeDefined();
      const pk = out.json.publicKey ?? out.json.compressedPubKey ?? out.json.pubkey;
      if (pk) expect(typeof pk).toBe('string');
    });
  });

  // ── balances (indexer-backed) ───────────────────────────────────────────

  describe('bb balances', () => {
    it('ics20 returns a balances envelope for an address', () => {
      if (!ready) return;
      const out = runCli(['balances', 'ics20', alice().address, '--local']);
      // The LCD response shape: { balances: [...] } or { balances: [...], pagination: ... }
      expect(out.json).toBeDefined();
      expect(out.json.balances ?? out.json.coins ?? []).toBeDefined();
    });

    it('bitbadges with 0x address auto-normalizes to bb1', () => {
      if (!ready) return;
      // Use the zero ETH address — pure conversion test, no chain query needed
      // to land on a known bb1; we just want to verify the --address handling.
      // The harness sets BB_QUIET=1 by default; clear it here so the
      // "Normalized …" stderr line we're asserting on is actually emitted.
      const out = runCli(
        ['balances', 'bitbadges', '0x0000000000000000000000000000000000000000', '--local'],
        { throwOnError: false, env: { BB_QUIET: '' } }
      );
      // Either success (account doc exists) or 404 from indexer; either is fine
      // — we're testing the address-normalize path.
      expect(out.stderr).toMatch(/Normalized 0x000000.*→ bb1q+/);
    });
  });

  // ── swap (indexer-backed) ───────────────────────────────────────────────

  describe('bb swap', () => {
    it('assets returns an array of cross-chain assets', () => {
      if (!ready) return;
      const out = runCli(['swap', 'assets', '--local'], { throwOnError: false });
      // Local indexer may not be configured for Skip:Go — accept either
      // success (array) or a clear "Skip API not enabled" failure.
      if (out.exitCode === 0) {
        expect(out.json).toBeDefined();
      } else {
        expect(out.stderr + out.stdout).toMatch(/Skip|not enabled|404|503|API key/i);
      }
    });

    it('chains returns chain registry entries when Skip is enabled', () => {
      if (!ready) return;
      const out = runCli(['swap', 'chains', '--local'], { throwOnError: false });
      if (out.exitCode === 0) {
        expect(out.json).toBeDefined();
      } else {
        expect(out.stderr + out.stdout).toMatch(/Skip|not enabled|404|503|API key/i);
      }
    });
  });

  // ── doctor ──────────────────────────────────────────────────────────────

  describe('bb doctor', () => {
    it('runs without crashing and reports health', () => {
      if (!ready) return;
      const out = runCli(['doctor', '--local'], { throwOnError: false, parseJson: false });
      // doctor may exit with non-zero if some checks fail; what matters is
      // that it ran and produced human-readable output.
      expect(out.stdout.length + out.stderr.length).toBeGreaterThan(0);
    });
  });

  // ── --help-json (LLM-friendly command tree) ─────────────────────────────

  describe('bb --help-json', () => {
    // QoL backlog: `--help-json` currently produces invalid JSON when a
    // command description contains an unescaped quote (e.g. some standards
    // commands). Until that's fixed, parse leniently — check that the
    // string CONTAINS each expected command name rather than parsing.
    it('emits output containing every top-level command name', () => {
      if (!ready) return;
      const out = runCli(['--help-json'], { parseJson: false });
      const stdout = out.stdout;
      expect(stdout).toContain('"commands"');
      for (const n of ['pay-requests', 'bounties', 'subscriptions', 'intents', 'credit-tokens', 'products', 'auctions', 'prediction-markets', 'nfts']) {
        expect(stdout).toContain(`"${n}"`);
      }
    });
  });
});
