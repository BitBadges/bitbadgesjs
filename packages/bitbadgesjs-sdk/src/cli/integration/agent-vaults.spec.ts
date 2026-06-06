/**
 * Integration: `bb agent-vaults` end-to-end against a live local chain + indexer.
 *
 * Two vaults are exercised:
 *
 *  A) Capped vault (no multisig) — the everyday agent-spend path:
 *     1. alice builds + deploys a USDC-backed Agent Vault with a daily cap.
 *     2. show / status / list surface the backing + parsed gating.
 *     3. alice deposits 5 USDC  → mints 5 vault tokens.
 *     4. alice withdraws 2      → releases 2 USDC (within cap).
 *     5. alice `pay`s 1 to charlie → {withdraw, bank send}; charlie's USDC grows.
 *
 *  B) Multisig vault — the one-time-unlock path that exercises the MsgCastVote
 *     fix (camelCase fields; the old snake_case shape crashed the encoder):
 *     6. alice deploys a 2-of-2 (alice, charlie) Agent Vault + deposits.
 *     7. a withdraw BEFORE quorum is rejected on-chain (gating blocks it).
 *     8. alice + charlie cast votes (MsgCastVote) → quorum reached.
 *     9. the same withdraw now succeeds (unlock is sticky — resetAfterExecution:false).
 *
 * Skipped automatically when preflight fails (no local chain/indexer).
 */

import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring,
  fundPersona,
  waitForIndexerCollection,
  writeMsgToTmp,
  getBankBalance,
  pollBalance,
  pollTokenAmount
} from './harness/chain.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

// Local-chain USDC IBC denom — same value used by the smart-tokens spec.
const USDC_DENOM = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';

describe('agent-vaults integration', () => {
  let ready = false;

  beforeAll(async () => { ready = (await preflightIntegration()).ok; }, 30000);

  // ─── A) Capped vault (no multisig) ──────────────────────────────────────────
  describe('capped vault (deposit / withdraw / pay)', () => {
    let collectionId: string | undefined;

    it('build + deploy creates a capped Agent Vault collection', async () => {
      if (!ready) return;
      const creator = alice();
      const tmp = path.join(os.tmpdir(), `av-build-${crypto.randomBytes(4).toString('hex')}.json`);
      runCli(
        [
          'build', 'agent-vault',
          '--backing-coin', 'USDC',
          '--name', 'Test Agent Vault',
          '--image', 'https://example.com/av.png',
          '--description', 'A USDC-backed Agent Vault with a daily cap',
          '--withdraw-limit', '5',
          '--period', 'daily',
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

    it('show returns backing address/denom, approval ids, and parsed cap', () => {
      if (!ready || !collectionId) return;
      const out = runCli(['agent-vaults', 'show', collectionId, '--local']);
      expect(out.json.collectionId).toBe(collectionId);
      expect(out.json.backingAddress).toMatch(/^bb1/);
      expect(out.json.backingDenom).toBe(USDC_DENOM);
      expect(out.json.depositApprovalId).toBe('agent-vault-deposit');
      expect(out.json.withdrawApprovalId).toMatch(/^agent-vault-withdraw-/);
      expect(out.json.gating.cap).toEqual({ perPeriodBaseUnits: '5000000', period: 'daily' });
      expect(out.json.standards).toEqual(['Smart Token', 'Agent Vault']);
    }, 30000);

    it('status returns active + the correct backing denom and cap', () => {
      if (!ready || !collectionId) return;
      const out = runCli(['agent-vaults', 'status', collectionId, '--local']);
      expect(out.json.status).toBe('active');
      expect(out.json.backingDenom).toBe(USDC_DENOM);
      expect(out.json.cap).toEqual({ perPeriodBaseUnits: '5000000', period: 'daily' });
      expect(out.json.multisig).toBeNull();
    }, 30000);

    it('list runs and returns a (curated) Agent Vault array', () => {
      if (!ready || !collectionId) return;
      // `list` browses the indexer's CURATED "smart-token" category and filters
      // by the Agent Vault validator, so a freshly-created local collection is
      // not expected to appear (the browse set is hand-curated in prod). Assert
      // the command succeeds and returns a well-shaped array.
      const out = runCli(['agent-vaults', 'list', '--local']);
      expect(Array.isArray(out.json)).toBe(true);
    }, 30000);

    it('alice deposits 5 USDC → mints 5 vault tokens', async () => {
      if (!ready || !collectionId) return;
      const depositor = alice();
      try { await fundPersona('alice', depositor.address, '10000000', USDC_DENOM); } catch { /* genesis-funded */ }

      const depositMsg = runCli([
        'agent-vaults', 'deposit', collectionId,
        '--creator', depositor.address, '--amount', '5', '--local'
      ]);
      expect(depositMsg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
      expect(depositMsg.json.value.transfers[0].prioritizedApprovals[0].approvalId).toBe('agent-vault-deposit');

      const tx = await deployMsgViaKeyring(writeMsgToTmp(depositMsg.json, 'av-deposit'), depositor.name);
      expect(tx.code).toBe(0);
      const held = await pollTokenAmount(collectionId, depositor.address, (n) => n >= 5n, { label: 'alice vault tokens' });
      expect(held).toBeGreaterThanOrEqual(5n);
    }, 90000);

    it('alice withdraws 2 vault tokens → releases 2 USDC (within cap)', async () => {
      if (!ready || !collectionId) return;
      const withdrawer = alice();
      const withdrawMsg = runCli([
        'agent-vaults', 'withdraw', collectionId,
        '--creator', withdrawer.address, '--amount', '2', '--local'
      ]);
      expect(withdrawMsg.json.value.transfers[0].prioritizedApprovals[0].approvalId).toMatch(/^agent-vault-withdraw-/);
      const tx = await deployMsgViaKeyring(writeMsgToTmp(withdrawMsg.json, 'av-withdraw'), withdrawer.name);
      expect(tx.code).toBe(0);
    }, 90000);

    it('alice pays 1 USDC to charlie via the gated withdraw + bank send', async () => {
      if (!ready || !collectionId) return;
      const payer = alice();
      const recipient = charlie();
      const before = getBankBalance(recipient.address, USDC_DENOM);

      const payMsg = runCli([
        'agent-vaults', 'pay', collectionId,
        '--creator', payer.address, '--amount', '1', '--to', recipient.address, '--local'
      ]);
      // pay emits a 2-msg envelope: [gated withdraw, bank send].
      expect(Array.isArray(payMsg.json.messages)).toBe(true);
      expect(payMsg.json.messages).toHaveLength(2);
      expect(payMsg.json.messages[0].typeUrl).toBe('/tokenization.MsgTransferTokens');
      expect(payMsg.json.messages[1].typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend');

      const tx = await deployMsgViaKeyring(writeMsgToTmp(payMsg.json, 'av-pay'), payer.name);
      expect(tx.code).toBe(0);
      for (const sub of tx.additionalTxs) expect(sub.code).toBe(0);

      // charlie receives 1 USDC (1e6 base units).
      const after = await pollBalance(recipient.address, USDC_DENOM, (n) => n >= before + 1_000_000n, {
        label: 'charlie USDC after pay'
      });
      expect(after - before).toBeGreaterThanOrEqual(1_000_000n);
    }, 120000);

    it('conformance throw — show on a non-Agent-Vault collection exits non-zero', () => {
      if (!ready) return;
      const out = runCli(['agent-vaults', 'show', '1', '--local'], { throwOnError: false, parseJson: false });
      expect(out.exitCode).not.toBe(0);
      expect(out.stderr + out.stdout).toMatch(/not.*found|not.*valid|Agent Vault/i);
    }, 30000);
  });

  // ─── B) Multisig vault (one-time unlock — exercises the MsgCastVote fix) ─────
  describe('multisig vault (vote-gated withdraw)', () => {
    let collectionId: string | undefined;

    it('build + deploy a 2-of-2 (alice, charlie) Agent Vault and fund it', async () => {
      if (!ready) return;
      const manager = alice();
      const tmp = path.join(os.tmpdir(), `av-ms-build-${crypto.randomBytes(4).toString('hex')}.json`);
      runCli(
        [
          'build', 'agent-vault',
          '--backing-coin', 'USDC',
          '--name', 'Multisig Agent Vault',
          '--image', 'https://example.com/av-ms.png',
          '--description', 'A 2-of-2 vote-gated Agent Vault',
          '--withdraw-limit', '10',
          '--signers', `${alice().address},${charlie().address}`,
          '--threshold', '2',
          '--creator', manager.address,
          '--output-file', tmp
        ],
        { parseJson: false }
      );
      const tx = await deployMsgViaKeyring(tmp, manager.name);
      expect(tx.code).toBe(0);
      collectionId = tx.collectionId!;
      await waitForIndexerCollection(collectionId);

      // status surfaces the 2-voter multisig.
      const status = runCli(['agent-vaults', 'status', collectionId, '--local']);
      expect(status.json.multisig).not.toBeNull();
      expect(status.json.multisig.voters).toBe(2);
      expect(status.json.multisig.quorumThreshold).toBe('100'); // 2-of-2 → 100%

      // alice deposits 6 USDC so there are tokens to withdraw later.
      try { await fundPersona('alice', manager.address, '10000000', USDC_DENOM); } catch { /* ok */ }
      const dep = runCli(['agent-vaults', 'deposit', collectionId, '--creator', manager.address, '--amount', '6', '--local']);
      const depTx = await deployMsgViaKeyring(writeMsgToTmp(dep.json, 'av-ms-deposit'), manager.name);
      expect(depTx.code).toBe(0);
      await pollTokenAmount(collectionId, manager.address, (n) => n >= 6n, { label: 'alice multisig vault tokens' });
    }, 150000);

    it('withdraw BEFORE quorum is rejected on-chain', async () => {
      if (!ready || !collectionId) return;
      const w = runCli(['agent-vaults', 'withdraw', collectionId, '--creator', alice().address, '--amount', '2', '--local']);
      // The msg builds fine; the chain must reject it because the multisig is unmet.
      let threw = false;
      let code = 0;
      try {
        const tx = await deployMsgViaKeyring(writeMsgToTmp(w.json, 'av-ms-early-withdraw'), alice().name);
        code = tx.code;
      } catch {
        threw = true; // chain-binary non-zero exit also counts as "rejected"
      }
      expect(threw || code !== 0).toBe(true);
    }, 90000);

    it('alice + charlie cast votes (MsgCastVote) → quorum reached', async () => {
      if (!ready || !collectionId) return;
      for (const voter of [alice(), charlie()]) {
        const voteMsg = runCli(['agent-vaults', 'vote', collectionId, '--creator', voter.address, '--local']);
        expect(voteMsg.json.typeUrl).toBe('/tokenization.MsgCastVote');
        // Regression guard: the emitted value MUST be camelCase, or the encoder crashes.
        expect(voteMsg.json.value.collectionId).toBe(collectionId);
        expect(voteMsg.json.value.yesWeight).toBe('100');
        expect(voteMsg.json.value.collection_id).toBeUndefined();
        const tx = await deployMsgViaKeyring(writeMsgToTmp(voteMsg.json, 'av-vote'), voter.name);
        expect(tx.code).toBe(0);
      }
    }, 150000);

    it('withdraw AFTER quorum succeeds (sticky one-time unlock)', async () => {
      if (!ready || !collectionId) return;
      const w = runCli(['agent-vaults', 'withdraw', collectionId, '--creator', alice().address, '--amount', '2', '--local']);
      const tx = await deployMsgViaKeyring(writeMsgToTmp(w.json, 'av-ms-withdraw'), alice().name);
      expect(tx.code).toBe(0);
    }, 90000);
  });
});
