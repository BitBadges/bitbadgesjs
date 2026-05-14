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
 *   3. `bb auctions show` returns sellerAddress=alice, status='bidding'|'accepting'
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

  it('show returns sellerAddress=alice, status=bidding|accepting', async () => {
    if (!ready || !collectionId) return;
    const seller = alice();
    const show = runCli(['auctions', 'show', collectionId, '--local']);
    expect(show.json.collectionId).toBe(collectionId);
    expect(show.json.sellerAddress).toBe(seller.address);
    expect(['bidding', 'accepting']).toContain(show.json.status);
  }, 30000);

  it('status mirrors show (active)', async () => {
    if (!ready || !collectionId) return;
    const status = runCli(['auctions', 'status', collectionId, '--local']);
    expect(status.json.collectionId).toBe(collectionId);
    // status reports 'bidding' (pre-bidDeadline) or 'accepting' (between
    // bidDeadline and acceptDeadline) for a live auction. Either is fine
    // depending on test timing.
    expect(status.json.status).toMatch(/bidding|accepting/);
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

/**
 * Second describe block: accept-bid HAPPY PATH on a fresh auction.
 *
 * The original spec above runs bid → cancel, leaving the auction with no
 * outstanding bid. This block creates a separate auction and exercises:
 *   1. bid     (charlie)
 *   2. accept  (alice — seller)         → status='sold'
 *   3. re-accept attempt (post-settle)  → exit 2, "already settled"
 *
 * Verifies the 4-state AuctionStatus enum + the nullable mintApproval
 * shape introduced when AuctionDetails was broadened.
 */
describe('auctions accept-bid happy path (sold transition)', () => {
  let ready = false;
  let collectionId: string | undefined;
  let bidApprovalId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('alice creates fresh auction → charlie bids → bid deadline passes → alice accepts → status=sold', async () => {
    if (!ready) return;
    const seller = alice();
    const bidder = charlie();

    // 1. Fresh auction by alice. Short bid deadline (10s) so the chain
    //    enters the accept-window quickly — without this, the chain
    //    rejects accept-bid with "transfer time not in range" because the
    //    mint-approval's window doesn't open until after the bid deadline.
    const buildTmp = path.join(os.tmpdir(), `auc-accept-build-${crypto.randomBytes(4).toString('hex')}.json`);
    runCli(
      [
        'auctions', 'build',
        '--seller', seller.address,
        '--bid-deadline', '10s',
        '--accept-window', '30d',
        '--name', 'Accept-Bid Happy Path',
        '--image', 'https://example.com/a.png',
        '--description', 'fresh auction for accept-bid coverage',
        '--output-file', buildTmp
      ],
      { parseJson: false }
    );
    const createTx = await deployMsgViaKeyring(buildTmp, seller.name);
    expect(createTx.code).toBe(0);
    expect(createTx.collectionId).toBeDefined();
    collectionId = createTx.collectionId!;
    await waitForIndexerCollection(collectionId);

    // 2. Pre-bid status — should still be 'bidding' immediately after create
    const preBid = runCli(['auctions', 'status', collectionId, '--local']);
    expect(['bidding', 'accepting']).toContain(preBid.json.status);

    // 3. Fund charlie + place bid (still in bidding window)
    await fundWithRetry('alice', bidder.address, '1000000000', 'ubadge');
    const bidMsg = runCli([
      'auctions', 'place-bid', collectionId,
      '--creator', bidder.address,
      '--amount', BID_AMOUNT_BASE,
      '--denom', 'ubadge',
      '--local'
    ]);
    bidApprovalId = bidMsg.json.value.approval.approvalId;
    expect(typeof bidApprovalId).toBe('string');
    const bidTmp = writeMsgToTmp(bidMsg.json, 'auc-accept-bid');
    const bidTx = await deployMsgViaKeyring(bidTmp, bidder.name);
    expect(bidTx.code).toBe(0);

    // 4. Wait for bid deadline to pass + a couple of block times so the
    //    chain's transfer-time gate opens.
    await new Promise((r) => setTimeout(r, 15000));

    // 5. Status should now report 'accepting' (bid placed, deadline passed)
    let acceptingStatus = '';
    for (let i = 0; i < 20; i++) {
      const cur = runCli(['auctions', 'status', collectionId, '--local']);
      acceptingStatus = cur.json.status;
      if (acceptingStatus === 'accepting') break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(acceptingStatus).toBe('accepting');

    // 6. alice (seller) accepts — happy path, no stderr warning
    const acceptMsg = runCli(
      [
        'auctions', 'accept-bid', collectionId, bidApprovalId!,
        '--creator', seller.address,
        '--bidder', bidder.address,
        '--local'
      ]
    );
    expect(acceptMsg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect(acceptMsg.stderr).not.toMatch(/does not match seller|doesn't match seller/i);
    const acceptTmp = writeMsgToTmp(acceptMsg.json, 'auc-accept');
    const acceptTx = await deployMsgViaKeyring(acceptTmp, seller.name);
    expect(acceptTx.code).toBe(0);

    // 7. Status must transition to 'sold' once the indexer catches up
    let postStatus = '';
    for (let i = 0; i < 20; i++) {
      const cur = runCli(['auctions', 'status', collectionId, '--local']);
      postStatus = cur.json.status;
      if (postStatus === 'sold') break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(postStatus).toBe('sold');
  }, 180000);

  it('post-settlement accept-bid attempt → exit 2 with "already settled"', async () => {
    if (!ready || !collectionId || !bidApprovalId) return;
    const seller = alice();
    const bidder = charlie();
    // After the previous test settled the auction, mintApproval is now null —
    // accept-bid should refuse to emit and exit 2.
    const out = runCli(
      [
        'auctions', 'accept-bid', collectionId, bidApprovalId,
        '--creator', seller.address,
        '--bidder', bidder.address,
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).toBe(2);
    expect(out.stderr).toMatch(/already settled|no mint approval/i);
  }, 30000);
});

/**
 * Third describe block: 'expired' state — fourth and final entry in the
 * 4-state AuctionStatus enum that AuctionDetails was broadened to support.
 *
 * Flow:
 *   1. alice builds an auction with very short bid + accept windows
 *   2. no bid is placed
 *   3. after both windows close, `bb auctions status` resolves to 'expired'
 */
describe('auctions expired state (no bid, both windows closed)', () => {
  let ready = false;
  let collectionId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('auction with short windows + no bid → status=expired', async () => {
    if (!ready) return;
    const seller = alice();

    const buildTmp = path.join(os.tmpdir(), `auc-expired-${crypto.randomBytes(4).toString('hex')}.json`);
    runCli(
      [
        'auctions', 'build',
        '--seller', seller.address,
        '--bid-deadline', '5s',
        '--accept-window', '5s',
        '--name', 'Expired Auction',
        '--image', 'https://example.com/a.png',
        '--description', 'auction that expires unbid for status=expired coverage',
        '--output-file', buildTmp
      ],
      { parseJson: false }
    );
    const createTx = await deployMsgViaKeyring(buildTmp, seller.name);
    expect(createTx.code).toBe(0);
    collectionId = createTx.collectionId!;
    expect(collectionId).toBeDefined();
    await waitForIndexerCollection(collectionId);

    // Wait past bid deadline (5s) + accept window (5s) + a small buffer.
    await new Promise((r) => setTimeout(r, 13000));

    let finalStatus = '';
    for (let i = 0; i < 20; i++) {
      const cur = runCli(['auctions', 'status', collectionId, '--local']);
      finalStatus = cur.json.status;
      if (finalStatus === 'expired') break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(finalStatus).toBe('expired');
  }, 60000);
});
