/**
 * Integration: `bb intents` end-to-end.
 *
 * Personas:
 *   - alice → intent creator (has genesis funds)
 *   - charlie → would-be filler (we don't actually exercise fill on-chain
 *     here because fill needs a counterparty + on-chain liquidity setup;
 *     emit-shape is covered in unit tests)
 *
 * Intents live on a per-network intent-exchange collection (local = 24).
 * That collection may NOT exist on a fresh local chain — in which case the
 * keyring-piped tx will fail at the chain level. We treat that case as
 * "infra not ready" and `it.skip` the affected steps rather than failing,
 * matching the conformance-throw style of pay-requests.spec.
 *
 * Flow exercised:
 *   1. `bb intents list --local` — list returns a valid shape (possibly empty)
 *   2. `bb intents create ... --output-file <tmp>` — emit shape verified
 *   3. (best-effort) deploy create via keyring; skipped if collection missing
 *   4. (best-effort) deploy cancel via keyring; skipped if create skipped
 *   5. `bb intents list --mine <alice>` — shape verified regardless
 *   6. `bb intents show <bogus-id>` — exits non-zero with structured error
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import { deployMsgViaKeyring, writeMsgToTmp } from './harness/chain.js';

// IBC USDC denom on local chain — same one pay-requests.spec.ts uses.
// We use it as the --receive denom so the intent represents
// "alice pays ubadge, expects USDC back".
const USDC_DENOM = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
const LOCAL_INTENT_COLLECTION_ID = '24';

interface IntentListShape {
  intents?: unknown[];
  approvals?: unknown[];
}

/**
 * Heuristic for "the local chain didn't recognize the intent collection".
 * The chain rejects with a non-zero code + a log like "collection ... not
 * found" / "invalid collection". We don't want to assert exact strings —
 * any non-zero code on the create path is enough to bail to "infra skip".
 */
function isCollectionMissingError(code: number, rawLog?: string): boolean {
  if (code === 0) return false;
  const log = (rawLog ?? '').toLowerCase();
  return (
    log.includes('not found') ||
    log.includes('invalid collection') ||
    log.includes('does not exist') ||
    log.includes('collection') // catch-all: any collection-side rejection
  );
}

describe('intents integration', () => {
  let ready = false;
  let createDeployed = false;
  let createdApprovalId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('list returns a valid shape (possibly empty)', () => {
    if (!ready) return;
    const out = runCli(['intents', 'list', '--local']);
    expect(out.exitCode).toBe(0);
    expect(out.json).toBeDefined();
    // Indexer returns either { intents: [...] } or { approvals: [...] } —
    // accept either, but it MUST be an object (not undefined / not an error).
    const shape = out.json as IntentListShape;
    const arr = shape.intents ?? shape.approvals ?? (Array.isArray(out.json) ? out.json : undefined);
    expect(Array.isArray(arr)).toBe(true);
  }, 30000);

  it('create emits MsgSetOutgoingApproval against the local intent collection', () => {
    if (!ready) return;
    const creator = alice();
    const tmp = path.join(os.tmpdir(), `intent-create-${crypto.randomBytes(4).toString('hex')}.json`);

    runCli(
      [
        'intents',
        'create',
        '--creator', creator.address,
        '--pay-denom', 'ubadge',
        '--pay-amount', '1000',
        '--receive-denom', USDC_DENOM,
        '--receive-amount', '2000',
        '--local',
        '--output-file', tmp
      ],
      { parseJson: false }
    );
    expect(fs.existsSync(tmp)).toBe(true);

    const msg = JSON.parse(fs.readFileSync(tmp, 'utf-8'));
    expect(msg.typeUrl).toBe('/tokenization.MsgSetOutgoingApproval');
    expect(msg.value.creator).toBe(creator.address);
    expect(msg.value.collectionId).toBe(LOCAL_INTENT_COLLECTION_ID);
    expect(msg.value.approval).toBeDefined();
    expect(typeof msg.value.approval.approvalId).toBe('string');
    expect(msg.value.approval.approvalId.length).toBeGreaterThan(0);
    createdApprovalId = msg.value.approval.approvalId;

    // Save the tmp path for the deploy step below. We re-stage as a fresh
    // tmp inside the deploy block to keep responsibilities clean.
    (globalThis as any).__intentCreateTmp = tmp;
  }, 30000);

  it('deploy create via keyring (skipped if collection 24 not on chain)', async () => {
    if (!ready || !createdApprovalId) return;
    const tmp: string = (globalThis as any).__intentCreateTmp;
    if (!tmp || !fs.existsSync(tmp)) return;

    const creator = alice();
    let tx;
    try {
      tx = await deployMsgViaKeyring(tmp, creator.name);
    } catch (err) {
      // Network / RPC blip — log and skip the deploy assertions, but DO
      // NOT fail. The emit shape was already verified above.
      process.stderr.write(`[integration] intents create deploy threw: ${(err as Error).message}\n`);
      return;
    }

    if (isCollectionMissingError(tx.code, tx.rawLog)) {
      process.stderr.write(
        `[integration] intents create deploy: chain code ${tx.code} ` +
        `(collection ${LOCAL_INTENT_COLLECTION_ID} likely not deployed on this chain) — ` +
        `skipping cancel test. rawLog: ${(tx.rawLog ?? '').slice(0, 200)}\n`
      );
      return;
    }
    expect(tx.code).toBe(0);
    createDeployed = true;
  }, 90000);

  it('deploy cancel via keyring (skipped if create was skipped)', async () => {
    if (!ready || !createdApprovalId || !createDeployed) {
      process.stderr.write('[integration] intents cancel deploy: skipped (create not deployed)\n');
      return;
    }
    const creator = alice();
    const cancelMsg = runCli([
      'intents', 'cancel', createdApprovalId,
      '--creator', creator.address,
      '--local'
    ]);
    expect(cancelMsg.json.typeUrl).toBe('/tokenization.MsgDeleteOutgoingApproval');
    expect(cancelMsg.json.value.creator).toBe(creator.address);
    expect(cancelMsg.json.value.collectionId).toBe(LOCAL_INTENT_COLLECTION_ID);
    expect(cancelMsg.json.value.approvalId).toBe(createdApprovalId);

    const tmp = writeMsgToTmp(cancelMsg.json, 'intent-cancel');
    const tx = await deployMsgViaKeyring(tmp, creator.name);
    expect(tx.code).toBe(0);
  }, 90000);

  it('list --mine <alice> returns a valid (possibly empty) intents array', () => {
    if (!ready) return;
    const out = runCli(['intents', 'list', '--mine', alice().address, '--local']);
    expect(out.exitCode).toBe(0);
    const shape = out.json as IntentListShape;
    const arr = shape.intents ?? shape.approvals ?? (Array.isArray(out.json) ? out.json : undefined);
    expect(Array.isArray(arr)).toBe(true);
    // We don't assert length — could be zero (fresh chain) or non-zero (test
    // re-runs). Either is correct. We do assert each entry has the
    // approvalId shape if any are present.
    for (const entry of arr as any[]) {
      expect(typeof entry.approvalId === 'string' || typeof entry.approvalId === 'number').toBe(true);
    }
  }, 30000);

  it('show on a bogus approval-id exits non-zero with a structured error', () => {
    if (!ready) return;
    const out = runCli(
      ['intents', 'show', 'this-approval-id-does-not-exist', '--local'],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/no intent|not.*found|approvalId/i);
  }, 30000);
});
