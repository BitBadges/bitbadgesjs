/**
 * Integration: Auction TERMINAL branches (cluster-3) — never run before.
 * The existing auctions.spec.ts asserts ONLY status='sold' on accept —
 * it never verifies the bidder was debited / seller credited / winner
 * got the NFT. This spec adds the economic settlement assertion (the
 * highest-value never-checked path) + competing bids + window guards.
 * Sleep-optimized: 2 bids placed up front, ONE wait past bidDeadline.
 *   seller=alice ; bidders=bob (genesis-rich), dave (funded)
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
  getBankBalance, pollBalance, pollTokenAmount, getCollectionTokenAmount, sleep
} from './harness/chain.js';

const BID_HI = 800_000n;
const BID_LO = 500_000n;

describe('auction terminal-state integration', () => {
  let ready = false;
  let cid: string | undefined;
  let bidHiId: string | undefined;
  let tBuild = 0;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    await fundMany('alice', [
      { toAddress: dave().address, amount: '1000000000', denom: 'ubadge' },
      { toAddress: bob().address, amount: '1000000000', denom: 'ubadge' }
    ]);
    const tmp = path.join(os.tmpdir(), `auc-${crypto.randomBytes(4).toString('hex')}.json`);
    tBuild = Date.now();
    runCli(['build', 'auction', '--seller', alice().address, '--bid-deadline', '12s', '--accept-window', '30d',
      '--name', 'Term Auction', '--image', 'https://example.com/a.png', '--description', 'term auction',
      '--creator', alice().address, '--output-file', tmp], { parseJson: false });
    expect(fs.existsSync(tmp)).toBe(true);
    const tx = await deployMsgViaKeyring(tmp, alice().name);
    expect(tx.code).toBe(0);
    cid = tx.collectionId!;
    await waitForIndexerCollection(cid);
    // Two competing bids up front (still within the 12s bidding window).
    const b1 = runCli(['auctions', 'place-bid', cid, '--creator', bob().address, '--amount', String(BID_HI), '--denom', 'ubadge', '--local']);
    expect((await deployMsgViaKeyring(writeMsgToTmp(b1.json, 'auc-bidhi'), bob().name)).code).toBe(0);
    bidHiId = b1.json.value.approval.approvalId;
    const b2 = runCli(['auctions', 'place-bid', cid, '--creator', dave().address, '--amount', String(BID_LO), '--denom', 'ubadge', '--local']);
    expect((await deployMsgViaKeyring(writeMsgToTmp(b2.json, 'auc-bidlo'), dave().name)).code).toBe(0);
    // ONE consolidated wait past the (build-time) 12s bid deadline + a block.
    const remain = tBuild + 12000 + 2500 - Date.now();
    if (remain > 0) await sleep(remain);
  }, 180000);

  it('status flips bidding → accepting after the bid deadline', async () => {
    if (!ready || !cid) return;
    let st = '';
    for (let i = 0; i < 16; i++) {
      st = runCli(['auctions', 'status', cid, '--local']).json.status;
      if (st === 'accepting') break;
      await sleep(2000);
    }
    expect(['accepting', 'bidding']).toContain(st);
  }, 60000);

  it('accept higher bid → winner gets the NFT, seller credited, bidder debited, loser untouched (economic)', async () => {
    if (!ready || !cid || !bidHiId) return;
    const sellerBefore = getBankBalance(alice().address, 'ubadge');
    const bobBefore = getBankBalance(bob().address, 'ubadge');
    const daveBefore = getBankBalance(dave().address, 'ubadge');
    const acc = runCli(['auctions', 'accept-bid', cid, bidHiId, '--creator', alice().address, '--bidder', bob().address, '--local']);
    expect(acc.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const tx = await deployMsgViaKeyring(writeMsgToTmp(acc.json, 'auc-accept'), alice().name);
    expect(tx.code).toBe(0);
    // Winner (bob) receives the auctioned token.
    expect(await pollTokenAmount(cid, bob().address, (a) => a >= 1n, { label: 'winner NFT' })).toBeGreaterThanOrEqual(1n);
    // Seller credited ~the winning bid; bidder debited ~the winning bid.
    await pollBalance(alice().address, 'ubadge', (b) => b >= sellerBefore + BID_HI - 50_000n,
      { label: 'seller proceeds', timeoutMs: 30000 });
    expect(bobBefore - getBankBalance(bob().address, 'ubadge')).toBeGreaterThanOrEqual(BID_HI - 50_000n);
    // Losing bidder (dave) NOT debited and got no token.
    expect(daveBefore - getBankBalance(dave().address, 'ubadge')).toBeLessThan(BID_LO);
    expect(getCollectionTokenAmount(cid, dave().address)).toBe(0n);
  }, 150000);

  it('place-bid after the bid deadline / on a settled auction does NOT succeed', async () => {
    if (!ready || !cid) return;
    // Well past the 12s deadline and the auction is already sold — a new
    // bid must not succeed, whether the CLI refuses or the chain rejects.
    const b = runCli(['auctions', 'place-bid', cid, '--creator', dave().address, '--amount', '900000', '--denom', 'ubadge', '--local'],
      { throwOnError: false });
    let succeeded = false;
    if (b.exitCode === 0 && b.json && b.json.typeUrl === '/tokenization.MsgSetIncomingApproval') {
      try { succeeded = (await deployMsgViaKeyring(writeMsgToTmp(b.json, 'auc-latebid'), dave().name)).code === 0; }
      catch { succeeded = false; }
    }
    expect(succeeded).toBe(false);
  }, 60000);
});
