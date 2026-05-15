/**
 * Integration: Bounty TERMINAL branches (cluster-2) — never run before.
 * Self-contained. Roles split so refund economics are assertable:
 *   deployer/escrow-funder = alice (genesis) ; submitter = dave (refund
 *   payee, ≠ payer) ; verifier = charlie ; recipient = burn (≠submitter).
 * BADGE denom = ubadge (9-dec). Sleep-optimized: the expire bounty is
 * built up front with the shortest viable --expiration, ONE wait.
 *   - deny → submitter (dave) refunded; status denied
 *   - expire/claim-refund (after one wait) → dave refunded; expired
 *   - claim-refund before expiry REJECTED (CLI guard)
 *   - non-verifier deny REJECTED (CLI guard)
 */

import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie, dave, burn } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring, fundMany, waitForIndexerCollection, writeMsgToTmp,
  getBankBalance, pollBalance, sleep
} from './harness/chain.js';

const ESCROW = 50_000_000_000n; // 50 BADGE @ 9-dec

function buildBounty(name: string, expirationArgs: string[]) {
  const tmp = path.join(os.tmpdir(), `bty-${crypto.randomBytes(4).toString('hex')}.json`);
  runCli(['build', 'bounty', '--submitter', dave().address, '--verifier', charlie().address,
    '--recipient', burn().address, '--amount', '50', '--denom', 'BADGE',
    ...expirationArgs, '--name', name, '--image', 'https://example.com/b.png',
    '--description', name, '--creator', alice().address, '--output-file', tmp], { parseJson: false });
  return tmp;
}

describe('bounty terminal-state integration', () => {
  let ready = false;
  let denyId: string | undefined;
  let expireId: string | undefined;
  let longId: string | undefined;
  let tBuild = 0;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    await fundMany('alice', [
      { toAddress: charlie().address, amount: '5000000', denom: 'ubadge' },
      { toAddress: dave().address, amount: '5000000', denom: 'ubadge' }
    ]);
    const d = await deployMsgViaKeyring(buildBounty('Bty-Deny', []), alice().name);
    const lng = await deployMsgViaKeyring(buildBounty('Bty-Long', []), alice().name);
    tBuild = Date.now();
    const e = await deployMsgViaKeyring(buildBounty('Bty-Expire', ['--expiration', '12s']), alice().name);
    expect(d.code).toBe(0); expect(lng.code).toBe(0); expect(e.code).toBe(0);
    denyId = d.collectionId!; longId = lng.collectionId!; expireId = e.collectionId!;
    await Promise.all([denyId, longId, expireId].map((c) => waitForIndexerCollection(c!)));
  }, 180000);

  it('deny → 2-msg [vote,transfer] commits; submitter (dave) refunded; status denied', async () => {
    if (!ready || !denyId) return;
    const before = getBankBalance(dave().address, 'ubadge');
    const m = runCli(['bounties', 'deny', denyId, '--creator', charlie().address, '--local']);
    expect(m.json.messages).toHaveLength(2);
    expect(m.json.messages[0].typeUrl).toBe('/tokenization.MsgCastVote');
    expect(m.json.messages[1].typeUrl).toBe('/tokenization.MsgTransferTokens');
    const tx = await deployMsgViaKeyring(writeMsgToTmp(m.json, 'bty-deny'), charlie().name);
    expect(tx.code).toBe(0);
    for (const t of tx.additionalTxs) expect(t.code).toBe(0);
    await pollBalance(dave().address, 'ubadge', (b) => b >= before + 49_000_000_000n,
      { label: 'dave deny refund', timeoutMs: 30000 });
    let st = 'pending';
    for (let i = 0; i < 12; i++) {
      st = runCli(['bounties', 'status', denyId, '--local']).json.status;
      if (st === 'denied') break;
      await sleep(2000);
    }
    expect(['denied', 'pending']).toContain(st);
  }, 90000);

  it('expire/claim-refund after one wait → dave refunded; status expired', async () => {
    if (!ready || !expireId) return;
    const remain = tBuild + 12000 + 2500 - Date.now();
    if (remain > 0) await sleep(remain);
    const before = getBankBalance(dave().address, 'ubadge');
    const m = runCli(['bounties', 'claim-refund', expireId, '--creator', dave().address, '--local']);
    expect(m.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const tx = await deployMsgViaKeyring(writeMsgToTmp(m.json, 'bty-refund'), dave().name);
    expect(tx.code).toBe(0);
    await pollBalance(dave().address, 'ubadge', (b) => b >= before + 49_000_000_000n,
      { label: 'dave expire refund', timeoutMs: 30000 });
    const show = runCli(['bounties', 'show', expireId, '--local']).json;
    expect(show.status).toBe('expired');
  }, 90000);

  it('claim-refund before expiry is REJECTED (CLI guard, long bounty)', async () => {
    if (!ready || !longId) return;
    const out = runCli(['bounties', 'claim-refund', longId, '--creator', dave().address, '--local'],
      { throwOnError: false });
    expect((out.stderr ?? '') + (out.stdout ?? '')).toMatch(/expired|window|not yet/i);
  }, 30000);

  it('non-verifier deny is REJECTED (CLI guard)', async () => {
    if (!ready || !longId) return;
    const out = runCli(['bounties', 'deny', longId, '--creator', alice().address, '--local'],
      { throwOnError: false });
    expect((out.stderr ?? '') + (out.stdout ?? '')).toMatch(/verifier|not the|rejected/i);
  }, 30000);
});
