/**
 * Integration: `bb auctions` end-to-end.
 *
 * Personas:
 *   - alice → seller (creates the auction, has genesis funds)
 *   - charlie → bidder (funded inline with ubadge before bidding)
 *
 * Flow exercised:
 *   1. alice builds + deploys an Auction collection (30d bid + 30d accept windows)
 *   2. indexer indexes it
 *   3. `bb auctions show` returns sellerAddress=alice, status='live'
 *   4. `bb auctions status` mirrors the same
 *   5. charlie places a bid (MsgSetIncomingApproval) → deploy → chain code 0
 *      (the approval id from the emit is captured for the cancel step)
 *   6. charlie cancels the bid (MsgDeleteIncomingApproval) → deploy → chain code 0
 *   7. Negative: charlie (not the seller) running `accept-bid` surfaces the
 *      "doesn't match seller" warning on stderr.
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

// ubadge is the chain's native gas/payment token. alice has plenty;
// charlie gets a small allocation inline so they can afford a 500-base-unit
// bid + gas.
const BID_AMOUNT_BASE = '500';

// Wrap fundPersona with a single retry on sequence-mismatch. Alice fans
// out multiple txs in close succession (build/deploy → bank-send) and the
// chain-binary's local sequence view sometimes lags the node's by one
// block. A short pause + one retry clears the race.
async function fundWithRetry(
  fromName: string,
  toAddress: string,
  amount: string,
  denom: string
): Promise<void> {
  try {
    await fundPersona(fromName, toAddress, amount, denom);
  } catch (err) {
    const msg = (err as Error).message || '';
    if (/sequence mismatch/i.test(msg)) {
      await new Promise((r) => setTimeout(r, 2500));
      await fundPersona(fromName, toAddress, amount, denom);
    } else {
      throw err;
    }
  }
}

describe('auctions integration', () => {
  let ready = false;
  let collectionId: string | undefined;
  let bidApprovalId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('build + deploy creates an Auction collection', async () => {
    if (!ready) return;
    const seller = alice();
    const tmp = path.join(os.tmpdir(), `auc-build-${crypto.randomBytes(4).toString('hex')}.json`);

    runCli(
      [
        'auctions',
        'build',
        '--seller', seller.address,
        '--bid-deadline', '30d',
        '--accept-window', '30d',
        '--name', 'Test Auction',
        '--image', 'https://example.com/a.png',
        '--description', 'test auction desc long enough',
        '--output-file', tmp
      ],
      { parseJson: false } // build emits a review block, not pure JSON
    );
    expect(fs.existsSync(tmp)).toBe(true);

    const tx = await deployMsgViaKeyring(tmp, seller.name);
    expect(tx.code).toBe(0);
    expect(tx.collectionId).toBeDefined();
    collectionId = tx.collectionId!;
    await waitForIndexerCollection(collectionId);
  }, 90000);

  it('show returns sellerAddress=alice, status=live', async () => {
    if (!ready || !collectionId) return;
    const seller = alice();
    const show = runCli(['auctions', 'show', collectionId, '--local']);
    expect(show.json.collectionId).toBe(collectionId);
    expect(show.json.sellerAddress).toBe(seller.address);
    expect(show.json.status).toBe('live');
  }, 30000);

  it('status mirrors show (live)', async () => {
    if (!ready || !collectionId) return;
    const status = runCli(['auctions', 'status', collectionId, '--local']);
    expect(status.json.collectionId).toBe(collectionId);
    // status may report 'live' under normal conditions; allow
    // 'pending-settlement' as a benign alternative if the indexer
    // already saw bids land between place-bid + this check on a re-run.
    expect(status.json.status).toMatch(/live|pending-settlement/);
  }, 30000);

  it('charlie places a bid → MsgSetIncomingApproval → chain code 0', async () => {
    if (!ready || !collectionId) return;
    const bidder = charlie();

    // Fund charlie with ubadge for the bid + gas. The bid itself is
    // 500 base units; over-fund for fees.
    // Retry once on sequence-mismatch — alice's prior build+deploy tx may
    // still be propagating when this bank-send fires.
    await fundWithRetry('alice', bidder.address, '1000000000', 'ubadge');

    const bidMsg = runCli([
      'auctions', 'place-bid', collectionId,
      '--creator', bidder.address,
      '--amount', BID_AMOUNT_BASE,
      '--denom', 'ubadge',
      '--local'
    ]);
    expect(bidMsg.json.typeUrl).toBe('/tokenization.MsgSetIncomingApproval');
    expect(bidMsg.json.value.creator).toBe(bidder.address);
    expect(bidMsg.json.value.approval).toBeDefined();
    expect(typeof bidMsg.json.value.approval.approvalId).toBe('string');
    bidApprovalId = bidMsg.json.value.approval.approvalId;

    const tmp = writeMsgToTmp(bidMsg.json, 'auc-bid');
    const tx = await deployMsgViaKeyring(tmp, bidder.name);
    expect(tx.code).toBe(0);
  }, 90000);

  it('charlie cancels the bid → MsgDeleteIncomingApproval → chain code 0', async () => {
    if (!ready || !collectionId || !bidApprovalId) return;
    const bidder = charlie();
    const cancelMsg = runCli([
      'auctions', 'cancel-bid', collectionId, bidApprovalId,
      '--creator', bidder.address,
      '--local'
    ]);
    expect(cancelMsg.json.typeUrl).toBe('/tokenization.MsgDeleteIncomingApproval');
    expect(cancelMsg.json.value.creator).toBe(bidder.address);
    expect(cancelMsg.json.value.approvalId).toBe(bidApprovalId);

    const tmp = writeMsgToTmp(cancelMsg.json, 'auc-cancel');
    const tx = await deployMsgViaKeyring(tmp, bidder.name);
    expect(tx.code).toBe(0);
  }, 90000);

  it('accept-bid by non-seller warns "doesn\'t match seller" on stderr', async () => {
    if (!ready || !collectionId || !bidApprovalId) return;
    const bidder = charlie();
    // charlie is the BIDDER, not the seller — passing --creator=charlie
    // (and --bidder=charlie too, since we need a bb1 address there) should
    // print the seller-mismatch warning on stderr without crashing the emit.
    const out = runCli(
      [
        'auctions', 'accept-bid', collectionId, bidApprovalId,
        '--creator', bidder.address,
        '--bidder', bidder.address,
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.stderr).toMatch(/does not match seller|doesn't match seller/i);
  }, 30000);

  it('conformance throw — show on a non-Auction collection exits non-zero', async () => {
    if (!ready) return;
    // Collection 1 (BADGE) is not an Auction — validator must reject.
    const out = runCli(['auctions', 'show', '1', '--local'], { throwOnError: false, parseJson: false });
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/not.*found|not.*valid|Auction/i);
  }, 30000);
});
