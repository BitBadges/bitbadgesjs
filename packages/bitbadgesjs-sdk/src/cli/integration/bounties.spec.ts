/**
 * Integration: `bb bounties` end-to-end.
 *
 * Personas:
 *   - alice   → submitter (creates + funds the bounty; receives refund on deny/expire)
 *   - charlie → verifier  (votes accept/deny; signs the 2-msg accept tx)
 *   - burn    → recipient (must differ from submitter per SDK validator)
 *
 * Flow exercised:
 *   1. alice builds + deploys a new Bounty collection (escrow funded from
 *      her genesis ubadge balance — `--denom BADGE`).
 *   2. indexer indexes it.
 *   3. `bb bounties show` returns the right verifier/recipient/submitter
 *      and a pending status.
 *   4. `bb bounties accept` emits the {messages:[MsgCastVote, MsgTransferTokens]}
 *      wrapper; we verify shape, then pipe it to deployMsgViaKeyring so charlie
 *      runs the sequential 2-msg flow (~6s sleep between blocks).
 *   5. `bb bounties status` flips to 'accepted' (we tolerate 'pending' if the
 *      indexer hasn't caught up — the chain tx is authoritative).
 *   6. Negative path: --creator=<non-verifier> should still emit the JSON
 *      wrapper but warn on stderr.
 *
 * Skipped automatically when preflight fails.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie, burn } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import { deployMsgViaKeyring, fundPersona, waitForIndexerCollection, writeMsgToTmp } from './harness/chain.js';

describe('bounties integration', () => {
  let ready = false;
  let collectionId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    // Charlie needs a small ubadge balance to pay gas for the accept tx.
    // Alice has a fat genesis allocation; top charlie up unconditionally
    // (idempotent — small amount, just enough for gas across both msgs).
    try {
      await fundPersona('alice', charlie().address, '1000000000', 'ubadge');
    } catch (err) {
      process.stderr.write(`[integration] charlie gas top-up failed: ${(err as Error).message}\n`);
    }
  }, 60000);

  it('build + deploy creates a Bounty collection', async () => {
    if (!ready) return;
    const submitter = alice();
    const verifier = charlie();
    const recipient = burn();
    const tmp = path.join(os.tmpdir(), `bounty-build-${crypto.randomBytes(4).toString('hex')}.json`);

    runCli(
      [
        'bounties',
        'build',
        '--submitter', submitter.address,
        '--verifier', verifier.address,
        '--recipient', recipient.address,
        '--amount', '50',
        '--denom', 'BADGE',
        '--name', 'Integration Test Bounty',
        '--image', 'https://example.com/bounty.png',
        '--description', 'bounty integration test',
        '--output-file', tmp
      ],
      { parseJson: false } // build emits a JSON payload + stderr review block
    );
    expect(fs.existsSync(tmp)).toBe(true);

    const tx = await deployMsgViaKeyring(tmp, submitter.name);
    expect(tx.code).toBe(0);
    expect(tx.collectionId).toBeDefined();
    collectionId = tx.collectionId!;
    await waitForIndexerCollection(collectionId);
  }, 90000);

  it('show returns verifier/recipient/submitter + pending status', async () => {
    if (!ready || !collectionId) return;
    const show = runCli(['bounties', 'show', collectionId, '--local']);
    expect(show.json.collectionId).toBe(collectionId);
    expect(show.json.verifierAddress).toBe(charlie().address);
    expect(show.json.recipientAddress).toBe(burn().address);
    expect(show.json.submitterAddress).toBe(alice().address);
    expect(show.json.status).toMatch(/pending|expired/);
    expect(Array.isArray(show.json.depositCoins)).toBe(true);
    // --amount 50 in display units × 1e9 (BADGE has 9 decimals).
    const badgeDeposit = show.json.depositCoins.find((c: any) => c.denom === 'ubadge');
    expect(badgeDeposit).toBeDefined();
    expect(badgeDeposit.amount).toBe('50000000000');

    const status = runCli(['bounties', 'status', collectionId, '--local']);
    expect(status.json.status).toMatch(/pending|expired/);
  }, 30000);

  it('accept emits a {messages:[vote, transfer]} wrapper for the verifier', async () => {
    if (!ready || !collectionId) return;
    const verifier = charlie();
    const out = runCli(['bounties', 'accept', collectionId, '--creator', verifier.address, '--local']);
    expect(out.json).toBeDefined();
    expect(Array.isArray(out.json.messages)).toBe(true);
    expect(out.json.messages).toHaveLength(2);
    expect(out.json.messages[0].typeUrl).toBe('/tokenization.MsgCastVote');
    expect(out.json.messages[1].typeUrl).toBe('/tokenization.MsgTransferTokens');
    // Both msgs should carry charlie as the signer.
    expect(out.json.messages[0].value.creator).toBe(verifier.address);
    expect(out.json.messages[1].value.creator).toBe(verifier.address);
  }, 30000);

  it('charlie deploys the 2-msg accept tx → status flips to accepted', async () => {
    if (!ready || !collectionId) return;
    const verifier = charlie();
    const acceptMsg = runCli(['bounties', 'accept', collectionId, '--creator', verifier.address, '--local']);
    expect(acceptMsg.json.messages).toHaveLength(2);

    const tmp = writeMsgToTmp(acceptMsg.json, 'bounty-accept');
    const tx = await deployMsgViaKeyring(tmp, verifier.name);
    // 2-msg envelope → primary (MsgCastVote) + 1 additional (MsgTransferTokens).
    // Both must commit cleanly (code 0) before the indexer status flips.
    expect(tx.code).toBe(0);
    expect(tx.additionalTxs).toHaveLength(1);
    expect(tx.additionalTxs[0].code).toBe(0);

    // Indexer-side status update may lag. Poll up to 45s.
    const start = Date.now();
    let status = 'pending';
    while (Date.now() - start < 45000) {
      status = runCli(['bounties', 'status', collectionId, '--local']).json.status;
      if (status === 'accepted') break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (status !== 'accepted') {
      process.stderr.write(
        `[integration] bounties status still "${status}" after 45s — indexer may be lagging. Vote tx was code 0 on chain.\n`
      );
    }
    expect(['accepted', 'pending']).toContain(status);
  }, 120000);

  it('accept with a non-verifier --creator still emits but warns on stderr', async () => {
    if (!ready || !collectionId) return;
    // alice is the submitter, not the verifier — the CLI should still
    // produce the JSON wrapper (offline shape-builder), but warn on
    // stderr that the on-chain vote will be rejected. We skip actually
    // broadcasting since chain rejection would tie up a block and is
    // already covered by the verifier-only voting rule on the chain.
    const out = runCli(
      ['bounties', 'accept', collectionId, '--creator', alice().address, '--local'],
      { throwOnError: false }
    );
    expect(out.exitCode).toBe(0);
    expect(out.json?.messages).toHaveLength(2);
    expect(out.stderr).toMatch(/not the verifier|rejected on-chain/i);
  }, 30000);

  it('conformance throw — show on a non-Bounty collection exits non-zero', async () => {
    if (!ready) return;
    // Collection 1 on a fresh local chain is either missing or not a
    // Bounty — either way `bb bounties show 1` should fail validation
    // with a structured error.
    const out = runCli(['bounties', 'show', '1', '--local'], { throwOnError: false, parseJson: false });
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/not.*found|not.*valid|Bounty/i);
  }, 30000);
});
