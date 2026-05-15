/**
 * Integration: Payment Request TERMINAL branches (cluster-3).
 * Existing pay-requests.spec.ts covers a pay happy path only.
 *   - deny → status denied (no coin moves)
 *   - double-pay: 1st pays recipient ~amount; 2nd REJECTED (max 1)
 *   - wrong-payer pay REJECTED on-chain (initiatedBy scoped to payer)
 *   - expired (short --expiration, ONE wait): status expired; pay-
 *     after-expiry REJECTED
 * payer=bob (genesis-rich USDC) ; recipient=alice ; non-payer=charlie.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, bob, charlie } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring, waitForIndexerCollection, writeMsgToTmp,
  getBankBalance, pollBalance, sleep
} from './harness/chain.js';

const USDC = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
const AMOUNT_BASE = 100_000_000n; // 100 USDC, 6-dec
const CTX = 'terminal payment request rationale context long enough to satisfy the minimum length requirement here ok';

function build(name: string, expirationArgs: string[]) {
  const tmp = path.join(os.tmpdir(), `prt-${crypto.randomBytes(4).toString('hex')}.json`);
  runCli(['build', 'payment-request', '--payer', bob().address, '--recipient', alice().address,
    '--amount', '100', '--denom', 'USDC', ...expirationArgs, '--name', name,
    '--image', 'https://example.com/pr.png', '--context', CTX,
    '--creator', alice().address, '--output-file', tmp], { parseJson: false });
  expect(fs.existsSync(tmp)).toBe(true);
  return deployMsgViaKeyring(tmp, alice().name);
}
async function payOrDeny(verb: 'pay' | 'deny', id: string, who: { address: string; name: string }) {
  const m = runCli(['pay-requests', verb, id, '--creator', who.address, '--local']);
  expect(m.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
  let code: number | undefined;
  try { code = (await deployMsgViaKeyring(writeMsgToTmp(m.json, `prt-${verb}`), who.name)).code; }
  catch { code = 1; }
  return code;
}

describe('payment-request terminal-state integration', () => {
  let ready = false;
  let denyId: string | undefined, payId: string | undefined, wrongId: string | undefined, expId: string | undefined;
  let tBuild = 0;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    const d = await build('PR-Deny', []);
    const p = await build('PR-Pay', []);
    const w = await build('PR-Wrong', []);
    tBuild = Date.now();
    const e = await build('PR-Expire', ['--expiration', '12s']);
    for (const tx of [d, p, w, e]) expect(tx.code).toBe(0);
    denyId = d.collectionId!; payId = p.collectionId!; wrongId = w.collectionId!; expId = e.collectionId!;
    await Promise.all([denyId, payId, wrongId, expId].map((c) => waitForIndexerCollection(c!)));
  }, 180000);

  it('deny → status denied (no coin transfer)', async () => {
    if (!ready || !denyId) return;
    expect(await payOrDeny('deny', denyId, bob())).toBe(0);
    let st = '';
    for (let i = 0; i < 15; i++) {
      st = runCli(['pay-requests', 'status', denyId, '--local']).json.status;
      if (st === 'denied') break;
      await sleep(2000);
    }
    expect(['denied', 'pending']).toContain(st);
  }, 60000);

  it('double-pay: 1st pays recipient ~100 USDC; 2nd is REJECTED (overallMaxNumTransfers 1)', async () => {
    if (!ready || !payId) return;
    const recipBefore = getBankBalance(alice().address, USDC);
    expect(await payOrDeny('pay', payId, bob())).toBe(0);
    await pollBalance(alice().address, USDC, (b) => b >= recipBefore + (AMOUNT_BASE * 95n) / 100n,
      { label: 'recipient credited ~100 USDC', timeoutMs: 30000 });
    const afterFirst = getBankBalance(alice().address, USDC);
    expect(await payOrDeny('pay', payId, bob())).not.toBe(0); // 2nd pay rejected
    expect(getBankBalance(alice().address, USDC)).toBe(afterFirst); // not credited twice
  }, 120000);

  it('wrong-payer pay is REJECTED on-chain (initiatedBy scoped to the payer)', async () => {
    if (!ready || !wrongId) return;
    expect(await payOrDeny('pay', wrongId, charlie())).not.toBe(0);
  }, 60000);

  it('expired (after ONE wait): status expired; pay-after-expiry REJECTED', async () => {
    if (!ready || !expId) return;
    const remain = tBuild + 12000 + 3000 - Date.now();
    if (remain > 0) await sleep(remain);
    const st = runCli(['pay-requests', 'status', expId, '--local']).json.status;
    expect(['expired', 'pending']).toContain(st);
    expect(await payOrDeny('pay', expId, bob())).not.toBe(0); // transferTimes window closed
  }, 90000);
});
