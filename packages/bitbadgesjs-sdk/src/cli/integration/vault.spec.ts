/**
 * Integration: Vault standard end-to-end (cluster-1).
 *
 * Vault had ZERO on-chain coverage. No `bb vault` verb — but a Vault IS
 * a Smart Token, and `bb smart-tokens deposit/withdraw` auto-discovers
 * the vault's `vault-deposit` / `vault-withdraw-<hash>` approvals (substring
 * match in extractSmartTokenDetails). Emergency-recovery has no verb and
 * is hand-rolled (mirrors buildPurchaseProductMsg).
 *
 * Branches (all amount/gate-driven — NO real time-wait needed; the
 * daily-limit tracker accumulates within the open interval, so two
 * same-day withdraws trip it without a 24h wait):
 *   A plain        — deposit (USDC↓, vault token↑) → withdraw (USDC↑)
 *   B daily-limit 5 — withdraw 3 ok, 2nd withdraw 3 REJECTED (cumulative
 *                     6 > 5), balances unchanged
 *   C 2FA-gated     — withdraw REJECTED w/o the required 2FA token, then
 *                     PASSES after minting it (separate custom-2fa col)
 *   D emergency-rec — recovery signer (bob) migrates a holder's tokens
 *                     (code 0); a non-recovery signer is REJECTED
 *
 * Skipped automatically when preflight fails.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie, bob, dave } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring,
  waitForIndexerCollection,
  writeMsgToTmp,
  fundMany,
  getBankBalance,
  pollBalance,
  pollTokenAmount,
  getCollectionTokenAmount
} from './harness/chain.js';

const USDC_DENOM = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
const U = 1_000_000n; // 1 USDC, 6 decimals

function buildAndDeploy(args: string[], signerName: string) {
  const tmp = path.join(os.tmpdir(), `v-build-${crypto.randomBytes(4).toString('hex')}.json`);
  runCli([...args, '--output-file', tmp], { parseJson: false });
  expect(fs.existsSync(tmp)).toBe(true);
  return deployMsgViaKeyring(tmp, signerName);
}

/** smart-tokens deposit/withdraw, mirroring the green smart-tokens spec. */
async function depositOrWithdraw(
  verb: 'deposit' | 'withdraw',
  collectionId: string,
  caller: { address: string; name: string },
  amount: number
) {
  const msg = runCli(['smart-tokens', verb, collectionId, '--creator', caller.address, '--amount', String(amount), '--local']);
  expect(msg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
  return deployMsgViaKeyring(writeMsgToTmp(msg.json, `v-${verb}`), caller.name);
}

function emergencyMigrationMsg(creator: string, collectionId: string, from: string, to: string, amount: bigint) {
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from,
          toAddresses: [to],
          balances: [{ amount: String(amount), tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '1', end: '18446744073709551615' }] }],
          prioritizedApprovals: [
            { approvalId: 'vault-emergency-migration', approvalLevel: 'collection', approverAddress: '', version: '0' }
          ],
          onlyCheckPrioritizedCollectionApprovals: true,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  };
}

describe('vault standard integration', () => {
  let ready = false;
  const id: Record<string, string> = {};

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    await fundMany('alice', [
      { toAddress: charlie().address, amount: '5000000', denom: 'ubadge' },
      { toAddress: dave().address, amount: '5000000', denom: 'ubadge' },
      { toAddress: bob().address, amount: '5000000', denom: 'ubadge' },
      { toAddress: charlie().address, amount: '100000000', denom: USDC_DENOM },
      { toAddress: dave().address, amount: '50000000', denom: USDC_DENOM }
    ]);
  }, 120000);

  it('build + deploy: a 2FA collection + 4 vault variants', async () => {
    if (!ready) return;
    const a = alice();
    const META = ['--image', 'https://example.com/v.png', '--description', 'E2E vault'];

    const twofa = await buildAndDeploy(
      ['build', 'custom-2fa', '--name', 'Vault 2FA', ...META, '--creator', a.address],
      a.name
    );
    expect(twofa.code).toBe(0);
    id.twofa = twofa.collectionId!;

    const A = await buildAndDeploy(['build', 'vault', '--backing-coin', 'USDC', '--name', 'Vault A', ...META, '--creator', a.address], a.name);
    const B = await buildAndDeploy(['build', 'vault', '--backing-coin', 'USDC', '--daily-withdraw-limit', '5', '--name', 'Vault B', ...META, '--creator', a.address], a.name);
    const C = await buildAndDeploy(['build', 'vault', '--backing-coin', 'USDC', '--require-2fa', id.twofa, '--name', 'Vault C', ...META, '--creator', a.address], a.name);
    const D = await buildAndDeploy(['build', 'vault', '--backing-coin', 'USDC', '--emergency-recovery', bob().address, '--name', 'Vault D', ...META, '--creator', a.address], a.name);
    for (const [k, tx] of [['A', A], ['B', B], ['C', C], ['D', D]] as const) {
      expect(tx.code).toBe(0);
      id[k] = tx.collectionId!;
    }
    await Promise.all(Object.values(id).map((c) => waitForIndexerCollection(c)));
  }, 180000);

  it('A: deposit mints vault tokens (USDC debited); withdraw releases USDC', async () => {
    if (!ready || !id.A) return;
    const u = charlie();
    const usdc0 = getBankBalance(u.address, USDC_DENOM);
    expect((await depositOrWithdraw('deposit', id.A, u, 10)).code).toBe(0);
    expect(await pollTokenAmount(id.A, u.address, (a) => a >= 10n, { label: 'A vault tokens after deposit' })).toBeGreaterThanOrEqual(10n);
    await pollBalance(u.address, USDC_DENOM, (b) => b <= usdc0 - 10n * U + 1n, { label: 'A USDC debited by deposit' });

    const usdc1 = getBankBalance(u.address, USDC_DENOM);
    expect((await depositOrWithdraw('withdraw', id.A, u, 5)).code).toBe(0);
    const usdc2 = await pollBalance(u.address, USDC_DENOM, (b) => b >= usdc1 + 5n * U - 1n, { label: 'A USDC credited by withdraw' });
    expect(usdc2 - usdc1).toBeGreaterThanOrEqual(5n * U - 1n);
  }, 120000);

  it('B: daily-withdraw-limit — within passes, cumulative over is REJECTED, balances unchanged', async () => {
    if (!ready || !id.B) return;
    const u = charlie();
    expect((await depositOrWithdraw('deposit', id.B, u, 10)).code).toBe(0);
    await pollTokenAmount(id.B, u.address, (a) => a >= 10n, { label: 'B vault tokens' });

    expect((await depositOrWithdraw('withdraw', id.B, u, 3)).code).toBe(0); // 3 ≤ 5 limit
    const usdcAfterFirst = await pollBalance(u.address, USDC_DENOM, () => true, { timeoutMs: 4000, label: 'B post-1st' });

    let code: number | undefined;
    try {
      code = (await depositOrWithdraw('withdraw', id.B, u, 3)).code; // cumulative 6 > 5 → reject
    } catch {
      code = 1;
    }
    expect(code).not.toBe(0);
    expect(getBankBalance(u.address, USDC_DENOM)).toBe(usdcAfterFirst); // no leak past the daily limit
  }, 120000);

  it('C: 2FA-gated withdraw — REJECTED without the 2FA token, PASSES after minting it', async () => {
    if (!ready || !id.C || !id.twofa) return;
    const a = alice();
    const u = dave();
    expect((await depositOrWithdraw('deposit', id.C, u, 10)).code).toBe(0);
    await pollTokenAmount(id.C, u.address, (x) => x >= 10n, { label: 'C vault tokens' });

    // No 2FA token yet → withdraw must be rejected by the mustOwnTokens gate.
    let blocked: number | undefined;
    try {
      blocked = (await depositOrWithdraw('withdraw', id.C, u, 4)).code;
    } catch {
      blocked = 1;
    }
    expect(blocked).not.toBe(0);

    // Manager mints the required 2FA token (collection id.twofa, token 1) to dave.
    const mint = runCli(['custom-2fa', 'mint', id.twofa, '--creator', a.address, '--to', u.address, '--local']);
    expect(mint.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect((await deployMsgViaKeyring(writeMsgToTmp(mint.json, 'v-2fa-mint'), a.name)).code).toBe(0);
    await pollTokenAmount(id.twofa, u.address, (x) => x >= 1n, { label: 'dave holds 2FA token' });

    // Now the gate is satisfied → withdraw passes and releases USDC.
    const usdc0 = getBankBalance(u.address, USDC_DENOM);
    expect((await depositOrWithdraw('withdraw', id.C, u, 4)).code).toBe(0);
    await pollBalance(u.address, USDC_DENOM, (b) => b >= usdc0 + 4n * U - 1n, { label: 'C USDC released after 2FA' });
  }, 150000);

  it('D: emergency-recovery — recovery signer migrates holder tokens; non-recovery signer REJECTED', async () => {
    if (!ready || !id.D) return;
    const holder = charlie();
    const recovery = bob();
    expect((await depositOrWithdraw('deposit', id.D, holder, 10)).code).toBe(0);
    const held = await pollTokenAmount(id.D, holder.address, (a) => a >= 10n, { label: 'D holder tokens' });

    // Non-recovery signer (holder himself) attempting the migration → reject.
    let bad: number | undefined;
    try {
      bad = (
        await deployMsgViaKeyring(
          writeMsgToTmp(emergencyMigrationMsg(holder.address, id.D, holder.address, recovery.address, held), 'v-mig-bad'),
          holder.name
        )
      ).code;
    } catch {
      bad = 1;
    }
    expect(bad).not.toBe(0);

    // Recovery address signs (creator = initiatedBy = to = bob) → migration succeeds.
    const tx = await deployMsgViaKeyring(
      writeMsgToTmp(emergencyMigrationMsg(recovery.address, id.D, holder.address, recovery.address, held), 'v-mig-ok'),
      recovery.name
    );
    expect(tx.code).toBe(0);
    expect(
      await pollTokenAmount(id.D, recovery.address, (a) => a >= held, { label: 'recovery received migrated tokens' })
    ).toBeGreaterThanOrEqual(held);
    expect(getCollectionTokenAmount(id.D, holder.address)).toBe(0n);
  }, 150000);
});
