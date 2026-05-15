/**
 * Integration: Address List standard end-to-end (cluster-1, ticket TBD).
 *
 * Address List has NO `bb address-list` action verb — only
 * `bb build address-list`. Add/remove are raw MsgTransferTokens against
 * the builder's `manager-add` (Mint→member, mint membership token 1) and
 * `manager-remove` (member→BURN, burn it) approvals, gated by
 * `initiatedByListId == manager`. We hand-roll those msgs mirroring the
 * canonical `buildPurchaseProductMsg` transfer shape.
 *
 * Personas:
 *   - alice   → creator + manager (genesis funds; signs add/remove)
 *   - charlie → member added then removed
 *   - bob     → non-manager (manager-only-enforcement negative test)
 *
 * Flow / branches covered:
 *   1. build + deploy an Address List collection
 *   2. manager ADD charlie → chain code 0, charlie holds token 1 (indexer)
 *   3. non-manager (bob) ADD → chain REJECTS (initiatedBy gate) tx.code≠0
 *   4. manager REMOVE charlie → chain code 0, charlie holds 0 (indexer)
 *
 * Skipped automatically when preflight fails.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie, bob } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring,
  waitForIndexerCollection,
  writeMsgToTmp,
  fundPersona,
  pollTokenAmount,
  getCollectionTokenAmount
} from './harness/chain.js';

const MAX_UINT64 = '18446744073709551615';
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];

/** Membership add/remove transfer, mirroring buildPurchaseProductMsg's
 *  prioritized-approval transfer shape (explicit balances — the
 *  address-list approvals carry no predeterminedBalances). */
function membershipTransfer(opts: {
  creator: string;
  collectionId: string;
  from: string;
  to: string;
  approvalId: string;
}) {
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator: opts.creator,
      collectionId: String(opts.collectionId),
      transfers: [
        {
          from: opts.from,
          toAddresses: [opts.to],
          balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }],
          prioritizedApprovals: [
            { approvalId: opts.approvalId, approvalLevel: 'collection', approverAddress: '', version: '0' }
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

describe('address-list standard integration', () => {
  let ready = false;
  let collectionId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (ready) {
      // Minimal ubadge gas float so bob's rejected-add fails on the
      // approval gate, not on missing fees.
      await fundPersona('alice', bob().address, '5000000', 'ubadge');
    }
  }, 60000);

  it('build + deploy creates an Address List collection (manager = alice)', async () => {
    if (!ready) return;
    const manager = alice();
    const tmp = path.join(os.tmpdir(), `al-build-${crypto.randomBytes(4).toString('hex')}.json`);
    runCli(
      [
        'build', 'address-list',
        '--name', 'Integration Allowlist',
        '--image', 'https://example.com/al.png',
        '--description', 'E2E address-list membership',
        '--creator', manager.address,
        '--manager', manager.address,
        '--output-file', tmp
      ],
      { parseJson: false }
    );
    expect(fs.existsSync(tmp)).toBe(true);
    const tx = await deployMsgViaKeyring(tmp, manager.name);
    expect(tx.code).toBe(0);
    expect(tx.collectionId).toBeDefined();
    collectionId = tx.collectionId!;
    await waitForIndexerCollection(collectionId);
  }, 90000);

  it('manager ADD charlie → code 0, charlie holds membership token 1', async () => {
    if (!ready || !collectionId) return;
    const manager = alice();
    const member = charlie();
    const tmp = writeMsgToTmp(
      membershipTransfer({
        creator: manager.address,
        collectionId,
        from: 'Mint',
        to: member.address,
        approvalId: 'manager-add'
      }),
      'al-add'
    );
    const tx = await deployMsgViaKeyring(tmp, manager.name);
    expect(tx.code).toBe(0);
    const held = await pollTokenAmount(collectionId, member.address, (a) => a >= 1n, {
      label: 'charlie membership after add'
    });
    expect(held).toBeGreaterThanOrEqual(1n);
  }, 90000);

  it('non-manager (bob) ADD is REJECTED on-chain (initiatedBy = manager gate)', async () => {
    if (!ready || !collectionId) return;
    const attacker = bob();
    const target = bob();
    // bob signs an add msg with himself as creator → the manager-add
    // approval's initiatedByListId is alice, so no approval matches → reject.
    const tmp = writeMsgToTmp(
      membershipTransfer({
        creator: attacker.address,
        collectionId,
        from: 'Mint',
        to: target.address,
        approvalId: 'manager-add'
      }),
      'al-add-attacker'
    );
    let code: number | undefined;
    try {
      const tx = await deployMsgViaKeyring(tmp, attacker.name);
      code = tx.code;
    } catch {
      code = 1; // deploy threw (chain rejected) — also a rejection
    }
    expect(code).not.toBe(0);
    // bob must NOT have been granted membership.
    expect(getCollectionTokenAmount(collectionId, target.address)).toBe(0n);
  }, 90000);

  it('manager REMOVE charlie → code 0, charlie holds 0', async () => {
    if (!ready || !collectionId) return;
    const manager = alice();
    const member = charlie();
    const tmp = writeMsgToTmp(
      membershipTransfer({
        creator: manager.address,
        collectionId,
        from: member.address,
        to: BURN_ADDRESS,
        approvalId: 'manager-remove'
      }),
      'al-remove'
    );
    const tx = await deployMsgViaKeyring(tmp, manager.name);
    expect(tx.code).toBe(0);
    const held = await pollTokenAmount(collectionId, member.address, (a) => a === 0n, {
      label: 'charlie membership after remove'
    });
    expect(held).toBe(0n);
  }, 90000);
});
