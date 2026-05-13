/**
 * Integration: `bb smart-tokens` end-to-end.
 *
 * Personas:
 *   - alice → creator + depositor (has genesis funds for USDC and BADGE)
 *   - charlie → second user (funded inline with USDC before deposit)
 *
 * Flow exercised:
 *   1. alice builds + deploys a Smart Token collection (USDC-backed, default opts)
 *   2. indexer indexes it.
 *   3. `bb smart-tokens show` returns backing address + deposit/withdraw approval ids
 *   4. `bb smart-tokens status` returns active + correct backing denom
 *   5. fundPersona alice with extra USDC
 *   6. alice deposits 5 USDC → chain code 0 (mints 5 Smart Token units)
 *   7. alice withdraws 2 Smart Token units → chain code 0 (releases 2 USDC)
 *   8. Negative path: bb smart-tokens show 1 (BADGE collection) exits non-zero
 *
 * Skipped automatically when preflight fails.
 */

import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import { deployMsgViaKeyring, fundPersona, waitForIndexerCollection, writeMsgToTmp } from './harness/chain.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

// Local-chain USDC IBC denom — same value used by other integration specs.
const USDC_DENOM = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';

describe('smart-tokens integration', () => {
  let ready = false;
  let collectionId: string | undefined;

  beforeAll(async () => { ready = (await preflightIntegration()).ok; }, 30000);

  it('build + deploy creates a Smart Token collection', async () => {
    if (!ready) return;
    const creator = alice();
    const tmp = path.join(os.tmpdir(), `st-build-${crypto.randomBytes(4).toString('hex')}.json`);
    runCli(
      [
        'build', 'smart-token',
        '--backing-coin', 'USDC',
        '--name', 'Test Smart Token',
        '--image', 'https://example.com/st.png',
        '--description', 'A USDC-backed Smart Token',
        '--creator', creator.address,
        '--output-file', tmp
      ],
      { parseJson: false }
    );
    expect(fs.existsSync(tmp)).toBe(true);
    const tx = await deployMsgViaKeyring(tmp, creator.name);
    expect(tx.code).toBe(0);
    expect(tx.collectionId).toBeDefined();
    collectionId = tx.collectionId!;
    await waitForIndexerCollection(collectionId);
  }, 90000);

  it('show returns backing address + deposit/withdraw approval ids', () => {
    if (!ready || !collectionId) return;
    const out = runCli(['smart-tokens', 'show', collectionId, '--local']);
    expect(out.json.collectionId).toBe(collectionId);
    expect(out.json.backingAddress).toMatch(/^bb1/);
    expect(out.json.backingDenom).toBe(USDC_DENOM);
    expect(out.json.depositApprovalId).toBe('smart-token-deposit');
    expect(out.json.withdrawApprovalId).toBe('smart-token-withdraw');
    expect(out.json.tradable).toBe(false);
    expect(out.json.aiAgentVault).toBe(false);
  }, 30000);

  it('status returns active + the correct backing denom', () => {
    if (!ready || !collectionId) return;
    const out = runCli(['smart-tokens', 'status', collectionId, '--local']);
    expect(out.json.status).toBe('active');
    expect(out.json.backingDenom).toBe(USDC_DENOM);
  }, 30000);

  it('alice deposits 5 USDC → chain code 0 (mints 5 Smart Token units)', async () => {
    if (!ready || !collectionId) return;
    const depositor = alice();
    // Ensure alice has enough USDC (top up unconditionally — idempotent).
    try { await fundPersona('alice', depositor.address, '10000000', USDC_DENOM); } catch { /* alice already funded from genesis */ }

    const depositMsg = runCli([
      'smart-tokens', 'deposit', collectionId,
      '--creator', depositor.address,
      '--amount', '5',
      '--local'
    ]);
    expect(depositMsg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect(depositMsg.json.value.transfers[0].prioritizedApprovals[0].approvalId).toBe('smart-token-deposit');

    const tmp = writeMsgToTmp(depositMsg.json, 'st-deposit');
    const tx = await deployMsgViaKeyring(tmp, depositor.name);
    expect(tx.code).toBe(0);
  }, 90000);

  it('alice withdraws 2 Smart Token units → chain code 0 (releases 2 USDC)', async () => {
    if (!ready || !collectionId) return;
    const withdrawer = alice();
    const withdrawMsg = runCli([
      'smart-tokens', 'withdraw', collectionId,
      '--creator', withdrawer.address,
      '--amount', '2',
      '--local'
    ]);
    expect(withdrawMsg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect(withdrawMsg.json.value.transfers[0].prioritizedApprovals[0].approvalId).toBe('smart-token-withdraw');

    const tmp = writeMsgToTmp(withdrawMsg.json, 'st-withdraw');
    const tx = await deployMsgViaKeyring(tmp, withdrawer.name);
    expect(tx.code).toBe(0);
  }, 90000);

  it('conformance throw — show on a non-Smart-Token collection exits non-zero', () => {
    if (!ready) return;
    // Collection 1 (BADGE) is not a Smart Token.
    const out = runCli(['smart-tokens', 'show', '1', '--local'], { throwOnError: false, parseJson: false });
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/not.*found|not.*valid|Smart Token/i);
  }, 30000);

  // ───────────────────────────────────────────────────────────────────────────
  // Multi-persona path — charlie is a brand-new user funded with just enough
  // USDC to round-trip a deposit and a withdraw. Mirrors the real agent
  // flow: alice publishes the vault, third parties join.
  // ───────────────────────────────────────────────────────────────────────────
  it('charlie deposits 3 USDC then withdraws 1 vUSDC against alice\'s vault', async () => {
    if (!ready || !collectionId) return;
    const consumer = charlie();
    // Fund charlie with enough USDC to deposit 3 + chain fees buffer.
    try { await fundPersona('alice', consumer.address, '10000000', USDC_DENOM); } catch { /* already funded */ }

    const depositMsg = runCli([
      'smart-tokens', 'deposit', collectionId,
      '--creator', consumer.address,
      '--amount', '3',
      '--local'
    ]);
    expect(depositMsg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const depositTmp = writeMsgToTmp(depositMsg.json, 'st-charlie-deposit');
    const depositTx = await deployMsgViaKeyring(depositTmp, consumer.name);
    expect(depositTx.code).toBe(0);

    const withdrawMsg = runCli([
      'smart-tokens', 'withdraw', collectionId,
      '--creator', consumer.address,
      '--amount', '1',
      '--local'
    ]);
    const withdrawTmp = writeMsgToTmp(withdrawMsg.json, 'st-charlie-withdraw');
    const withdrawTx = await deployMsgViaKeyring(withdrawTmp, consumer.name);
    expect(withdrawTx.code).toBe(0);
  }, 120000);

  // ───────────────────────────────────────────────────────────────────────────
  // `bb amount` wrap previews — verifies the wrapper-path resolution against
  // a real on-chain Smart Token. Smart Tokens populate `aliasPaths` (not
  // `cosmosCoinWrapperPaths`), so the agent must pass --path-kind alias.
  // ───────────────────────────────────────────────────────────────────────────
  it('amount wrap-preview/unwrap-preview resolve against the smart token alias path', () => {
    if (!ready || !collectionId) return;
    const wrap = runCli(['amount', 'wrap-preview', collectionId, '--coin-amount', '1000000', '--path-kind', 'alias', '--local']);
    expect(wrap.json.coinAmount).toBe('1000000');
    expect(wrap.json.wrappedTokens).toBe('1000000'); // 1:1 conversion
    expect(wrap.json.pathKind).toBe('alias');

    const unwrap = runCli(['amount', 'unwrap-preview', collectionId, '--token-amount', '3', '--path-kind', 'alias', '--local']);
    expect(unwrap.json.tokenAmount).toBe('3');
    expect(unwrap.json.coinAmount).toBe('3');
  }, 30000);

  it('amount max-wrappable returns 0 for an address with no Smart Token balance and surfaces the alias hint on the default path-kind', () => {
    if (!ready || !collectionId) return;
    // Default --path-kind cosmos-coin must fail with an alias hint (Smart
    // Token wrapper data lives in aliasPaths, not cosmosCoinWrapperPaths).
    const out = runCli(
      ['amount', 'max-wrappable', collectionId, '--address', alice().address, '--local'],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toMatch(/--path-kind alias/);

    // With the correct path-kind, alice (no Smart Token balance) → 0.
    const ok = runCli(
      ['amount', 'max-wrappable', collectionId, '--address', alice().address, '--path-kind', 'alias', '--local']
    );
    expect(ok.json.maxWrappable).toBe('0');
  }, 30000);
});
