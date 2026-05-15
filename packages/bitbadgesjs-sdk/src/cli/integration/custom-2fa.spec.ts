/**
 * Integration: `bb custom-2fa mint` end-to-end (ticket 0420).
 *
 * Personas:
 *   - alice → collection manager + minter (genesis funds)
 *   - charlie → 2FA token recipient
 *
 * Flow:
 *   1. alice builds + deploys a Custom-2FA collection (--creator=alice)
 *   2. alice mints a 2FA token to charlie via `bb custom-2fa mint`
 *      → assert the emitted MsgTransferTokens encodes a bounded
 *        (5-min) ownershipTimes window, NOT FullRanges (the #0407
 *        forever-token regression this command exists to prevent)
 *   3. broadcast the mint → chain accepts the bounded-window transfer
 *      (code 0) — proves the helper works end-to-end on-chain.
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
import { deployMsgViaKeyring, waitForIndexerCollection, writeMsgToTmp } from './harness/chain.js';

describe('custom-2fa mint integration', () => {
  let ready = false;
  let collectionId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('build + deploy creates a Custom-2FA collection', async () => {
    if (!ready) return;
    const manager = alice();
    const tmp = path.join(os.tmpdir(), `c2fa-build-${crypto.randomBytes(4).toString('hex')}.json`);

    runCli(
      [
        'build',
        'custom-2fa',
        '--name', 'Test 2FA',
        '--image', 'https://example.com/2fa.png',
        '--description', 'Short-lived 2FA token',
        '--creator', manager.address,
        '--output-file', tmp
      ],
      { parseJson: false } // build emits a review block, not JSON
    );
    expect(fs.existsSync(tmp)).toBe(true);

    const tx = await deployMsgViaKeyring(tmp, manager.name);
    expect(tx.code).toBe(0);
    expect(tx.collectionId).toBeDefined();
    collectionId = tx.collectionId!;
    await waitForIndexerCollection(collectionId);
  }, 90000);

  it('mint encodes a bounded 5-min ownership window (not FullRanges) and the chain accepts it', async () => {
    if (!ready || !collectionId) return;
    const manager = alice();
    const recipient = charlie();

    const mintMsg = runCli([
      'custom-2fa', 'mint', collectionId,
      '--creator', manager.address,
      '--to', recipient.address,
      '--local'
    ]);
    expect(mintMsg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const bal = mintMsg.json.value.transfers[0].balances[0];
    expect(bal.tokenIds).toEqual([{ start: '1', end: '1' }]);
    // The whole point of #0407: a 5-minute window, NOT a forever token.
    const ot = bal.ownershipTimes[0];
    expect(Number(ot.end) - Number(ot.start)).toBe(300000);
    expect(bal.ownershipTimes.length).toBe(1);

    const tmp = writeMsgToTmp(mintMsg.json, 'c2fa-mint');
    const tx = await deployMsgViaKeyring(tmp, manager.name);
    expect(tx.code).toBe(0);
  }, 90000);
});
