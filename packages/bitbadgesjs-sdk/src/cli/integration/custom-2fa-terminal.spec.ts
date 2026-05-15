/**
 * Integration: Custom-2FA TERMINAL branches (cluster-2 remainder).
 * Self-contained; does not touch the green custom-2fa.spec.ts.
 *   - non-manager mint REJECTED on-chain (initiatedBy = manager gate)
 *   - REAL expiry enforced on-chain, proven via a vault `--require-2fa`
 *     gate (mustOwnTokens.overrideWithCurrentTime): a withdraw passes
 *     within the 2FA token's ownershipTimes window and FAILS after it
 *     elapses. (getCollectionTokenAmount ignores ownershipTimes, so the
 *     vault consumer is the authoritative current-time check.)
 * Sleep-optimized: a single consolidated sleep past the short window.
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
  getBankBalance, pollBalance, pollTokenAmount, sleep
} from './harness/chain.js';

const USDC = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
const WINDOW_MS = 12000;

function build(args: string[], signer: string) {
  const tmp = path.join(os.tmpdir(), `c2t-${crypto.randomBytes(4).toString('hex')}.json`);
  runCli([...args, '--output-file', tmp], { parseJson: false });
  expect(fs.existsSync(tmp)).toBe(true);
  return deployMsgViaKeyring(tmp, signer);
}
async function stWithdraw(vaultId: string, who: { address: string; name: string }, amount: number) {
  const m = runCli(['smart-tokens', 'withdraw', vaultId, '--creator', who.address, '--amount', String(amount), '--local']);
  return deployMsgViaKeyring(writeMsgToTmp(m.json, 'c2t-wd'), who.name);
}

describe('custom-2fa terminal-state integration', () => {
  let ready = false;
  let twofaId: string | undefined;
  let vaultId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    await fundMany('alice', [
      { toAddress: bob().address, amount: '5000000', denom: 'ubadge' },
      { toAddress: dave().address, amount: '5000000', denom: 'ubadge' },
      { toAddress: dave().address, amount: '60000000', denom: USDC }
    ]);
    const META = ['--image', 'https://example.com/2fa.png', '--description', 'custom-2fa terminal'];
    const t = await build(['build', 'custom-2fa', '--name', 'Term 2FA', ...META, '--creator', alice().address], alice().name);
    expect(t.code).toBe(0);
    twofaId = t.collectionId!;
    const v = await build(['build', 'vault', '--backing-coin', 'USDC', '--require-2fa', twofaId,
      '--name', 'Vault 2FA-Exp', '--image', 'https://example.com/v.png', '--description', 'expiry vault',
      '--creator', alice().address], alice().name);
    expect(v.code).toBe(0);
    vaultId = v.collectionId!;
    await Promise.all([waitForIndexerCollection(twofaId), waitForIndexerCollection(vaultId)]);
  }, 180000);

  it('non-manager mint is REJECTED on-chain (initiatedBy = manager gate)', async () => {
    if (!ready || !twofaId) return;
    const m = runCli(['custom-2fa', 'mint', twofaId, '--creator', bob().address, '--to', bob().address, '--local']);
    expect(m.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    let code: number | undefined;
    try { code = (await deployMsgViaKeyring(writeMsgToTmp(m.json, 'c2t-badmint'), bob().name)).code; }
    catch { code = 1; }
    expect(code).not.toBe(0);
  }, 90000);

  it('REAL expiry: 2FA-gated withdraw passes in-window, FAILS after the window elapses', async () => {
    if (!ready || !twofaId || !vaultId) return;
    const u = dave();
    // dave deposits backing → holds vault tokens to withdraw.
    const dep = runCli(['smart-tokens', 'deposit', vaultId, '--creator', u.address, '--amount', '10', '--local']);
    expect((await deployMsgViaKeyring(writeMsgToTmp(dep.json, 'c2t-dep'), u.name)).code).toBe(0);
    await pollTokenAmount(vaultId, u.address, (a) => a >= 10n, { label: 'dave vault tokens' });

    // Manager mints a SHORT-window 2FA token to dave.
    const mint = runCli(['custom-2fa', 'mint', twofaId, '--creator', alice().address, '--to', u.address,
      '--expiration', '12s', '--local']);
    const ot = mint.json.value.transfers[0].balances[0].ownershipTimes[0];
    expect(Number(ot.end) - Number(ot.start)).toBe(WINDOW_MS);
    expect((await deployMsgViaKeyring(writeMsgToTmp(mint.json, 'c2t-mint'), alice().name)).code).toBe(0);
    await pollTokenAmount(twofaId, u.address, (x) => x >= 1n, { label: 'dave holds 2FA token' });

    // In-window: gate satisfied → withdraw passes.
    expect((await stWithdraw(vaultId, u, 3)).code).toBe(0);
    const usdcMid = await pollBalance(u.address, USDC, () => true, { timeoutMs: 4000, label: 'post in-window wd' });

    // ONE consolidated wait past the 2FA token's ownershipTimes window.
    await sleep(WINDOW_MS + 4000);

    // Post-window: 2FA token expired → mustOwnTokens(overrideWithCurrentTime) fails → withdraw REJECTED.
    let code: number | undefined;
    try { code = (await stWithdraw(vaultId, u, 3)).code; } catch { code = 1; }
    expect(code).not.toBe(0);
    // No USDC released past expiry.
    expect(getBankBalance(u.address, USDC)).toBe(usdcMid);
  }, 180000);
});
