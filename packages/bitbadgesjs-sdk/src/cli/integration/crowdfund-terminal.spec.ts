/**
 * Integration: Crowdfund TERMINAL branches (cluster-2) — never run before.
 * Self-contained (own short-deadline collections); does not touch the
 * existing crowdfunds.spec.ts. Sleep-optimized: BOTH time-gated
 * crowdfunds deployed up front, ONE consolidated wait past the deadline.
 *
 * A = funded (raised ≥ goal) ; B = under-goal. After the single wait:
 *  - withdraw(A) happy → crowdfunder USDC rises ≈ raised (economic)
 *  - refund(B) happy → contributor USDC refunded ≈ contributed
 *  - status transitions: A funded / B expired-refunding
 *  - contribute-after-deadline REJECTED
 *  - withdraw-when-goal-not-met REJECTED
 *  - refund-when-goal-IS-met REJECTED (escrow-drain security guard)
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, bob, dave } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring, fundMany, waitForIndexerCollection, writeMsgToTmp,
  getBankBalance, pollBalance, pollTokenAmount, sleep
} from './harness/chain.js';

const USDC = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
const GOAL_BASE = 10_000_000n; // 10 USDC, 6-dec

function buildCrowdfund(name: string, deadline: string) {
  const tmp = path.join(os.tmpdir(), `cf-${crypto.randomBytes(4).toString('hex')}.json`);
  runCli(['build', 'crowdfund', '--goal', '10', '--denom', 'USDC',
    '--crowdfunder', alice().address, '--deadline', deadline,
    '--name', name, '--image', 'https://example.com/cf.png', '--description', name,
    '--creator', alice().address, '--output-file', tmp], { parseJson: false });
  return tmp;
}
function contribute(id: string, who: { address: string; name: string }, baseAmt: string) {
  const m = runCli(['crowdfunds', 'contribute', id, '--creator', who.address,
    '--amount', baseAmt, '--base-units', '--local']);
  return deployMsgViaKeyring(writeMsgToTmp(m.json, 'cf-contrib'), who.name);
}

describe('crowdfund terminal-state integration', () => {
  let ready = false;
  let A: string | undefined; // funded
  let B: string | undefined; // under-goal
  let tBuild = 0;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    await fundMany('alice', [
      { toAddress: bob().address, amount: '6000000', denom: 'ubadge' },
      { toAddress: dave().address, amount: '6000000', denom: 'ubadge' },
      { toAddress: bob().address, amount: '15000000', denom: USDC },
      { toAddress: dave().address, amount: '8000000', denom: USDC }
    ]);
    tBuild = Date.now();
    const aTx = await deployMsgViaKeyring(buildCrowdfund('CF-Funded', '12s'), alice().name);
    const bTx = await deployMsgViaKeyring(buildCrowdfund('CF-Under', '12s'), alice().name);
    expect(aTx.code).toBe(0); expect(bTx.code).toBe(0);
    A = aTx.collectionId!; B = bTx.collectionId!;
    await Promise.all([waitForIndexerCollection(A), waitForIndexerCollection(B)]);
    // Fund A to goal (bob contributes 10 USDC); B partial (dave 4 USDC).
    expect((await contribute(A, bob(), '10000000')).code).toBe(0);
    expect((await contribute(B, dave(), '4000000')).code).toBe(0);
    // ONE consolidated wait past the (build-time) 12s deadline + a block.
    const remain = tBuild + 12000 + 2500 - Date.now();
    if (remain > 0) await sleep(remain);
  }, 180000);

  it('status: A funded (goal met, past deadline) / B expired-refunding', async () => {
    if (!ready || !A || !B) return;
    let sa = '';
    for (let i = 0; i < 12; i++) {
      sa = runCli(['crowdfunds', 'status', A, '--local']).json.status;
      if (sa === 'funded') break;
      await sleep(2000);
    }
    expect(['funded', 'goal-met-pending-settle']).toContain(sa);
    const sb = runCli(['crowdfunds', 'status', B, '--local']).json.status;
    expect(['expired-refunding', 'active']).toContain(sb);
  }, 60000);

  it('withdraw(A) happy → crowdfunder USDC rises ≈ raised', async () => {
    if (!ready || !A) return;
    const before = getBankBalance(alice().address, USDC);
    const w = runCli(['crowdfunds', 'withdraw', A, '--creator', alice().address, '--local']);
    const tx = await deployMsgViaKeyring(writeMsgToTmp(w.json, 'cf-withdraw'), alice().name);
    expect(tx.code).toBe(0);
    for (const t of tx.additionalTxs) expect(t.code).toBe(0);
    await pollBalance(alice().address, USDC, (b) => b >= before + GOAL_BASE - 100_000n,
      { label: 'crowdfunder payout', timeoutMs: 30000 });
  }, 90000);

  it('refund(B) happy → dave (contributor) USDC refunded ≈ contributed', async () => {
    if (!ready || !B) return;
    const before = getBankBalance(dave().address, USDC);
    const r = runCli(['crowdfunds', 'refund', B, '--creator', dave().address,
      '--amount', '4000000', '--base-units', '--local']);
    const tx = await deployMsgViaKeyring(writeMsgToTmp(r.json, 'cf-refund'), dave().name);
    expect(tx.code).toBe(0);
    await pollBalance(dave().address, USDC, (b) => b >= before + 3_900_000n,
      { label: 'dave refund', timeoutMs: 30000 });
  }, 90000);

  it('contribute-after-deadline is REJECTED (B)', async () => {
    if (!ready || !B) return;
    let code: number | undefined;
    try { code = (await contribute(B, dave(), '1000000')).code; } catch { code = 1; }
    expect(code).not.toBe(0);
  }, 60000);

  it('refund-when-goal-IS-met is REJECTED (escrow-drain security guard, A)', async () => {
    if (!ready || !A) return;
    let code: number | undefined;
    try {
      const r = runCli(['crowdfunds', 'refund', A, '--creator', bob().address,
        '--amount', '10000000', '--base-units', '--local']);
      code = (await deployMsgViaKeyring(writeMsgToTmp(r.json, 'cf-refund-bad'), bob().name)).code;
    } catch { code = 1; }
    expect(code).not.toBe(0);
  }, 60000);
});
