/**
 * Integration: Prediction Market TERMINAL branches (cluster-2) — the
 * redeem/resolve-no/resolve-push paths were NEVER run on-chain. No real
 * sleep (settlement approvals are FOREVER). Self-contained.
 *   creator/verifier = charlie ; depositors = bob (winner), dave (loser)
 *   - resolve yes → bob (YES holder) redeem yes-wins → USDC payout
 *   - loser redeem (wrong state) → bbError non-zero
 *   - resolve no  → single MsgCastVote, code 0
 *   - resolve push → 2-msg, all sub-txs code 0
 *   - non-verifier resolve → chain REJECTS
 */

import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie, bob, dave } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring, fundMany, waitForIndexerCollection, writeMsgToTmp,
  getBankBalance, pollBalance, pollTokenAmount
} from './harness/chain.js';

const USDC = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';

function buildMarket(name: string) {
  const tmp = path.join(os.tmpdir(), `pm-${crypto.randomBytes(4).toString('hex')}.json`);
  runCli(['build', 'prediction-market', '--verifier', charlie().address,
    '--name', name, '--image', 'https://example.com/pm.png', '--description', name,
    '--creator', charlie().address, '--output-file', tmp], { parseJson: false });
  return tmp;
}
async function deposit(id: string, who: { address: string; name: string }, amount: string) {
  const m = runCli(['prediction-markets', 'deposit', id, '--creator', who.address, '--amount', amount, '--local']);
  return deployMsgViaKeyring(writeMsgToTmp(m.json, 'pm-deposit'), who.name);
}
async function resolve(id: string, signer: { address: string; name: string }, outcome: string) {
  const m = runCli(['prediction-markets', 'resolve', id, '--creator', signer.address, '--outcome', outcome, '--local']);
  return deployMsgViaKeyring(writeMsgToTmp(m.json, `pm-res-${outcome}`), signer.name);
}

describe('prediction-market terminal-state integration', () => {
  let ready = false;
  let mYes: string | undefined, mNo: string | undefined, mPush: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    await fundMany('alice', [
      { toAddress: charlie().address, amount: '8000000', denom: 'ubadge' },
      { toAddress: bob().address, amount: '6000000', denom: 'ubadge' },
      { toAddress: dave().address, amount: '6000000', denom: 'ubadge' },
      { toAddress: bob().address, amount: '120000000', denom: USDC },
      { toAddress: dave().address, amount: '120000000', denom: USDC }
    ]);
    const y = await deployMsgViaKeyring(buildMarket('PM-Yes'), charlie().name);
    const n = await deployMsgViaKeyring(buildMarket('PM-No'), charlie().name);
    const p = await deployMsgViaKeyring(buildMarket('PM-Push'), charlie().name);
    expect(y.code).toBe(0); expect(n.code).toBe(0); expect(p.code).toBe(0);
    mYes = y.collectionId!; mNo = n.collectionId!; mPush = p.collectionId!;
    await Promise.all([mYes, mNo, mPush].map((c) => waitForIndexerCollection(c!)));
  }, 180000);

  it('resolve yes → winner (bob) redeems yes-wins → USDC payout; loser redeem yields nothing', async () => {
    if (!ready || !mYes) return;
    expect((await deposit(mYes, bob(), '50000000')).code).toBe(0);
    expect((await deposit(mYes, dave(), '50000000')).code).toBe(0);
    const bobYes = await pollTokenAmount(mYes, bob().address, (a) => a > 0n, { tokenId: 1, label: 'bob YES' });

    expect((await resolve(mYes, charlie(), 'yes')).code).toBe(0);

    const before = getBankBalance(bob().address, USDC);
    const red = runCli(['prediction-markets', 'redeem', mYes, '--creator', bob().address,
      '--state', 'yes-wins', '--yes-balance', String(bobYes), '--local']);
    const rtx = await deployMsgViaKeyring(writeMsgToTmp(red.json, 'pm-redeem-win'), bob().name);
    expect(rtx.code).toBe(0);
    await pollBalance(bob().address, USDC, (b) => b > before, { label: 'winner payout', timeoutMs: 30000 });

    // Loser: wrong-state redeem with no winning balance → bbError non-zero exit.
    const lose = runCli(['prediction-markets', 'redeem', mYes, '--creator', dave().address,
      '--state', 'no-wins', '--local'], { throwOnError: false });
    expect(lose.exitCode).not.toBe(0);
  }, 180000);

  it('resolve no → single MsgCastVote, chain code 0', async () => {
    if (!ready || !mNo) return;
    expect((await deposit(mNo, bob(), '10000000')).code).toBe(0);
    const tx = await resolve(mNo, charlie(), 'no');
    expect(tx.code).toBe(0);
    for (const t of tx.additionalTxs) expect(t.code).toBe(0);
  }, 120000);

  it('resolve push → multi-msg, all sub-txs code 0', async () => {
    if (!ready || !mPush) return;
    expect((await deposit(mPush, bob(), '10000000')).code).toBe(0);
    const tx = await resolve(mPush, charlie(), 'push');
    expect(tx.code).toBe(0);
    for (const t of tx.additionalTxs) expect(t.code).toBe(0);
  }, 120000);

  it('non-verifier resolve is REJECTED on-chain', async () => {
    if (!ready || !mPush) return;
    let code: number | undefined;
    try {
      const m = runCli(['prediction-markets', 'resolve', mPush, '--creator', alice().address, '--outcome', 'yes', '--local']);
      code = (await deployMsgViaKeyring(writeMsgToTmp(m.json, 'pm-res-bad'), alice().name)).code;
    } catch { code = 1; }
    expect(code).not.toBe(0);
  }, 90000);
});
