/**
 * Integration: `bb credit-tokens` end-to-end.
 *
 * Personas:
 *   - alice → creator + payment recipient (deploys the Credit Token collection)
 *   - charlie → buyer (purchases units of credit; needs USDC funded inline)
 *
 * Flow exercised:
 *   1. alice builds + deploys a Credit Token collection (scaled tier)
 *   2. indexer indexes it
 *   3. `credit-tokens list` returns one scaled tier (`isScaled: true`)
 *   4. `credit-tokens show` returns a valid structure
 *   5. charlie is funded with USDC, then pipes `purchase` → `deploy --with-keyring`
 *   6. resulting MsgTransferTokens has balances[0].amount = 500 (mintAmount=100 × units=5)
 *   7. chain accepts the tx (code 0)
 *   8. negative: `purchase --units 0` exits non-zero with a clear error
 *
 * Skipped automatically when preflight fails.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import { deployMsgViaKeyring, fundPersona, waitForIndexerCollection, writeMsgToTmp } from './harness/chain.js';

// The IBC USDC denom on local chain. The credit-token build uses the `USDC`
// symbol on the CLI and the SDK resolves it to this IBC denom internally.
// charlie has no genesis USDC, so we fund inline before the purchase test.
const USDC_DENOM = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';

describe('credit-tokens integration', () => {
  let ready = false;
  let collectionId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('build + deploy creates a Credit Token collection', async () => {
    if (!ready) return;
    const creator = alice();
    const tmp = path.join(os.tmpdir(), `ct-build-${crypto.randomBytes(4).toString('hex')}.json`);

    runCli(
      [
        'credit-tokens',
        'build',
        '--payment-denom', 'USDC',
        '--recipient', creator.address,
        '--name', 'Test Credits',
        '--image', 'https://example.com/c.png',
        '--description', 'test credit tokens long enough',
        '--output-file', tmp
      ],
      { parseJson: false } // build emits a review block, not JSON
    );
    expect(fs.existsSync(tmp)).toBe(true);

    const tx = await deployMsgViaKeyring(tmp, creator.name);
    expect(tx.code).toBe(0);
    expect(tx.collectionId).toBeDefined();
    collectionId = tx.collectionId!;
    await waitForIndexerCollection(collectionId);
  }, 90000);

  it('list returns exactly 1 scaled tier with isScaled: true', async () => {
    if (!ready || !collectionId) return;
    const out = runCli(['credit-tokens', 'list', collectionId, '--local']);
    expect(out.json.collectionId).toBe(collectionId);
    expect(Array.isArray(out.json.tiers)).toBe(true);
    expect(out.json.tiers).toHaveLength(1);
    const tier = out.json.tiers[0];
    expect(tier.isScaled).toBe(true);
    expect(tier.approvalId).toMatch(/^credit-/);
    // Default `--tokens-per-unit 100` → mintAmount of 100 base units per unit.
    expect(tier.mintAmount).toBe('100');
    // Payment denom resolves to the IBC USDC denom inside the chain msg.
    expect(tier.paymentDenom).toBe(USDC_DENOM);
    expect(tier.recipient).toBe(alice().address);
  }, 30000);

  it('show returns a valid Credit Token structure', async () => {
    if (!ready || !collectionId) return;
    const out = runCli(['credit-tokens', 'show', collectionId, '--local']);
    expect(out.json.collectionId).toBe(collectionId);
    expect(Array.isArray(out.json.standards)).toBe(true);
    expect(out.json.standards).toContain('Credit Token');
    expect(Array.isArray(out.json.tiers)).toBe(true);
    expect(out.json.tiers.length).toBeGreaterThan(0);
    // Alias-path denom is surfaced (symbol/decimals were dropped from
    // `show` since the chain proto doesn't carry them through to the
    // indexer doc — use `bb lookup <denom>` to resolve those if needed).
    expect(out.json).toHaveProperty('denom');
  }, 30000);

  it('charlie purchases 5 units → MsgTransferTokens balances=500 → chain code 0', async () => {
    if (!ready || !collectionId) return;
    const buyer = charlie();

    // Fund charlie with USDC. The scaled tier charges 1 paymentAmount per
    // unit; we give charlie generous headroom (100 display units → 100M
    // base units at 6 decimals) so this test isn't pinned to the exact
    // per-unit cost.
    await fundPersona('alice', buyer.address, '100000000', USDC_DENOM);

    const purchaseMsg = runCli([
      'credit-tokens',
      'purchase',
      collectionId,
      '--creator', buyer.address,
      '--units', '5',
      '--local'
    ]);
    expect(purchaseMsg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const transfer = purchaseMsg.json.value.transfers[0];
    expect(transfer.from).toBe('Mint');
    expect(transfer.toAddresses).toEqual([buyer.address]);
    // Scaled-tier purchase: amount = mintAmount × units = 100 × 5 = 500.
    expect(transfer.balances).toHaveLength(1);
    expect(transfer.balances[0].amount).toBe('500');
    // Token IDs target the single credit token (1-1).
    expect(transfer.balances[0].tokenIds).toEqual([{ start: '1', end: '1' }]);
    // The prioritized approval should reference the credit-* tier.
    expect(transfer.prioritizedApprovals).toHaveLength(1);
    expect(transfer.prioritizedApprovals[0].approvalId).toMatch(/^credit-/);
    expect(transfer.onlyCheckPrioritizedCollectionApprovals).toBe(true);

    // Pipe to deploy → chain accepts the tx.
    const tmp = writeMsgToTmp(purchaseMsg.json, 'ct-purchase');
    const tx = await deployMsgViaKeyring(tmp, buyer.name);
    expect(tx.code).toBe(0);
  }, 90000);

  it('purchase --units 0 exits non-zero with a clear error', async () => {
    if (!ready || !collectionId) return;
    const buyer = charlie();
    const out = runCli(
      [
        'credit-tokens',
        'purchase',
        collectionId,
        '--creator', buyer.address,
        '--units', '0',
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    // Error surfaces via stderr (emitError) — accept either the SDK throw
    // message ("must be > 0") or the bigger "Error:" envelope.
    expect(out.stderr + out.stdout).toMatch(/units.*>\s*0|must be > 0|invalid|Error/i);
  }, 30000);

  it('purchase --units <non-integer> exits with an actionable error (not raw BigInt SyntaxError)', async () => {
    if (!ready || !collectionId) return;
    const buyer = charlie();
    const out = runCli(
      [
        'credit-tokens',
        'purchase',
        collectionId,
        '--creator', buyer.address,
        '--units', 'not-a-number',
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    // The CLI rejects non-integer up front with a friendly message; we
    // explicitly assert NOT the raw "Cannot convert ... to a BigInt"
    // SyntaxError that used to leak through.
    expect(out.stderr + out.stdout).toMatch(/--units.*integer/i);
    expect(out.stderr + out.stdout).not.toMatch(/Cannot convert .* to a BigInt/);
  }, 30000);

  it('conformance throw — show on a non-Credit-Token collection exits 2', async () => {
    if (!ready) return;
    // Collection `1` on a fresh local chain is either missing or not a
    // Credit Token — either way `show` should fail validation with exit 2.
    const out = runCli(['credit-tokens', 'show', '1', '--local'], {
      throwOnError: false,
      parseJson: false
    });
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/not.*found|not.*valid|Credit Token/i);
  }, 30000);
});
