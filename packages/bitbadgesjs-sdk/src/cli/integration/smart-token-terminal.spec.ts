/**
 * Integration: Smart Token TERMINAL branches (cluster-3).
 * Existing smart-tokens.spec.ts only covers plain USDC deposit/withdraw.
 *   - --tradable: show tradable:true; hand-rolled holder→holder P2P via
 *     the smart-token-transferable approval (the flag's whole point)
 *   - --ai-agent-vault: show aiAgentVault:true
 *   - over-withdraw REJECTED
 *   - BADGE backing deposit/withdraw
 * holder1=alice (genesis USDC/ubadge) ; holder2=bob (genesis-rich)
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { preflightIntegration } from './harness/preflight.js';
import { alice, bob } from './harness/personas.js';
import { runCli } from './harness/cli.js';
import {
  deployMsgViaKeyring, waitForIndexerCollection, writeMsgToTmp,
  pollTokenAmount, getCollectionTokenAmount
} from './harness/chain.js';

function build(args: string[], signer: string) {
  const tmp = path.join(os.tmpdir(), `stt-${crypto.randomBytes(4).toString('hex')}.json`);
  runCli([...args, '--output-file', tmp], { parseJson: false });
  expect(fs.existsSync(tmp)).toBe(true);
  return deployMsgViaKeyring(tmp, signer);
}
async function st(verb: 'deposit' | 'withdraw', id: string, who: { address: string; name: string }, amount: number) {
  const m = runCli(['smart-tokens', verb, id, '--creator', who.address, '--amount', String(amount), '--local']);
  let code: number | undefined;
  try { code = (await deployMsgViaKeyring(writeMsgToTmp(m.json, `stt-${verb}`), who.name)).code; }
  catch { code = 1; }
  return code;
}
const META = (n: string) => ['--name', n, '--image', 'https://example.com/s.png', '--description', `${n} smart token terminal`];

describe('smart-token terminal-state integration', () => {
  let ready = false;
  const id: Record<string, string> = {};

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    const T = await build(['build', 'smart-token', '--backing-coin', 'USDC', '--tradable', ...META('STT-Tradable'), '--creator', alice().address], alice().name);
    const V = await build(['build', 'smart-token', '--backing-coin', 'USDC', '--ai-agent-vault', ...META('STT-AIVault'), '--creator', alice().address], alice().name);
    const P = await build(['build', 'smart-token', '--backing-coin', 'USDC', ...META('STT-Plain'), '--creator', alice().address], alice().name);
    const B = await build(['build', 'smart-token', '--backing-coin', 'BADGE', ...META('STT-Badge'), '--creator', alice().address], alice().name);
    for (const [k, tx] of [['T', T], ['V', V], ['P', P], ['B', B]] as const) {
      expect(tx.code).toBe(0);
      id[k] = tx.collectionId!;
    }
    await Promise.all(Object.values(id).map((c) => waitForIndexerCollection(c)));
  }, 180000);

  it('--tradable: show tradable:true; holder→holder P2P via smart-token-transferable works', async () => {
    if (!ready || !id.T) return;
    expect(runCli(['smart-tokens', 'show', id.T, '--local']).json.tradable).toBe(true);
    expect(await st('deposit', id.T, alice(), 10)).toBe(0);
    await pollTokenAmount(id.T, alice().address, (a) => a >= 10n, { label: 'alice vST' });
    const p2p = {
      typeUrl: '/tokenization.MsgTransferTokens',
      value: {
        creator: alice().address, collectionId: id.T,
        transfers: [{
          from: alice().address, toAddresses: [bob().address],
          balances: [{ amount: '4', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '1', end: '18446744073709551615' }] }],
          prioritizedApprovals: [{ approvalId: 'smart-token-transferable', approvalLevel: 'collection', approverAddress: '', version: '0' }],
          onlyCheckPrioritizedCollectionApprovals: true, onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false, memo: ''
        }]
      }
    };
    const tx = await deployMsgViaKeyring(writeMsgToTmp(p2p, 'stt-p2p'), alice().name);
    expect(tx.code).toBe(0);
    expect(await pollTokenAmount(id.T, bob().address, (a) => a >= 4n, { label: 'bob received vST P2P' })).toBeGreaterThanOrEqual(4n);
  }, 150000);

  it('--ai-agent-vault: show aiAgentVault:true (tradable:false)', async () => {
    if (!ready || !id.V) return;
    const s = runCli(['smart-tokens', 'show', id.V, '--local']).json;
    expect(s.aiAgentVault).toBe(true);
    expect(s.tradable).toBe(false);
  }, 60000);

  it('over-withdraw is REJECTED (withdraw more than held)', async () => {
    if (!ready || !id.P) return;
    expect(await st('deposit', id.P, alice(), 5)).toBe(0);
    expect(await st('withdraw', id.P, alice(), 999)).not.toBe(0);
  }, 120000);

  it('BADGE-backed deposit/withdraw both commit (non-USDC backing)', async () => {
    if (!ready || !id.B) return;
    expect(runCli(['smart-tokens', 'show', id.B, '--local']).json.backingDenom).toBe('ubadge');
    expect(await st('deposit', id.B, alice(), 2)).toBe(0);
    await pollTokenAmount(id.B, alice().address, (a) => a >= 2n, { label: 'alice BADGE-ST' });
    expect(await st('withdraw', id.B, alice(), 1)).toBe(0);
  }, 120000);
});
