/**
 * Integration: Credit Token TERMINAL branches (cluster-3).
 * Existing credit-tokens.spec.ts covers a scaled purchase happy path.
 *   - purchase N units → buyer holds N×tokensPerUnit credit tokens
 *   - credits are NON-transferable (hand-rolled holder→holder P2P
 *     REJECTED — no holder transfer approval exists)
 *   - --units 0 / negative rejected at the CLI (deterministic guard)
 * buyer=bob (genesis-rich USDC) ; recipient=alice.
 * (insufficient-funds intentionally omitted — not reliably isolatable
 *  on the shared devnet's accumulated balances.)
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, bob, dave } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring, waitForIndexerCollection, writeMsgToTmp,
  pollTokenAmount, getCollectionTokenAmount
} from './harness/chain.js';

const TOKENS_PER_UNIT = 100;
const UNITS = 5;

describe('credit-token terminal-state integration', () => {
  let ready = false;
  let cid: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    const tmp = path.join(os.tmpdir(), `ctt-${crypto.randomBytes(4).toString('hex')}.json`);
    runCli(['build', 'credit-token', '--payment-denom', 'USDC', '--recipient', alice().address,
      '--tokens-per-unit', String(TOKENS_PER_UNIT), '--name', 'Term Credits',
      '--image', 'https://example.com/c.png', '--description', 'credit token terminal',
      '--creator', alice().address, '--output-file', tmp], { parseJson: false });
    expect(fs.existsSync(tmp)).toBe(true);
    const tx = await deployMsgViaKeyring(tmp, alice().name);
    expect(tx.code).toBe(0);
    cid = tx.collectionId!;
    await waitForIndexerCollection(cid);
  }, 120000);

  it(`purchase ${UNITS} units → buyer holds ${UNITS * TOKENS_PER_UNIT} credit tokens`, async () => {
    if (!ready || !cid) return;
    const m = runCli(['credit-tokens', 'purchase', cid, '--creator', bob().address, '--units', String(UNITS), '--local']);
    expect(m.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const tx = await deployMsgViaKeyring(writeMsgToTmp(m.json, 'ctt-buy'), bob().name);
    expect(tx.code).toBe(0);
    expect(await pollTokenAmount(cid, bob().address, (a) => a >= BigInt(UNITS * TOKENS_PER_UNIT), { label: 'bob credit balance' }))
      .toBeGreaterThanOrEqual(BigInt(UNITS * TOKENS_PER_UNIT));
  }, 120000);

  it('credits are NON-transferable — a holder→holder P2P is REJECTED on-chain', async () => {
    if (!ready || !cid) return;
    const p2p = {
      typeUrl: '/tokenization.MsgTransferTokens',
      value: {
        creator: bob().address, collectionId: cid,
        transfers: [{
          from: bob().address, toAddresses: [dave().address],
          balances: [{ amount: '50', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '1', end: '18446744073709551615' }] }],
          memo: ''
        }]
      }
    };
    let code: number | undefined;
    try { code = (await deployMsgViaKeyring(writeMsgToTmp(p2p, 'ctt-p2p'), bob().name)).code; }
    catch { code = 1; }
    expect(code).not.toBe(0);
    expect(getCollectionTokenAmount(cid, dave().address)).toBe(0n);
  }, 90000);

  it('--units 0 and negative are rejected at the CLI', async () => {
    if (!ready || !cid) return;
    const zero = runCli(['credit-tokens', 'purchase', cid, '--creator', bob().address, '--units', '0', '--local'],
      { throwOnError: false });
    expect(zero.exitCode).not.toBe(0);
    const neg = runCli(['credit-tokens', 'purchase', cid, '--creator', bob().address, '--units', '-3', '--local'],
      { throwOnError: false });
    expect(neg.exitCode).not.toBe(0);
  }, 60000);
});
