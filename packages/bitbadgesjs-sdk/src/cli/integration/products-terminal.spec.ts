/**
 * Integration: Products TERMINAL branches (cluster-2 remainder).
 * Self-contained; does not touch the green products.spec.ts.
 *
 * First economic-outcome coverage for Products. (An earlier suspected
 * "free products" finding was DISPROVEN by direct chain-balance checks
 * — the store IS credited and the buyer IS debited; the false signal
 * came from pollBalance baselines on accumulated shared-devnet state.
 * Assertions below are delta-based with tolerance against that.)
 *   - funded purchase → store credited ~price AND buyer debited ~price
 *   - maxSupply:1 → 2nd purchase of the same token REJECTED (token cap)
 *   - burn:true product → transfer routes to the chain burn address
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
  getBankBalance, pollBalance, pollTokenAmount
} from './harness/chain.js';

const USDC = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
const U = 1_000_000n; // 1 USDC, 6-dec
const BURN = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
// price - 5% tolerates rounding/decimals without being flaky on exact base units
const floorFor = (priceUsdc: bigint) => (priceUsdc * U * 95n) / 100n;
const PRODUCTS = JSON.stringify([
  { name: 'Limited', denom: 'USDC', price: 10, maxSupply: 1, description: 'capped sku', image: 'https://example.com/l.png' },
  { name: 'Standard', denom: 'USDC', price: 20, description: 'sku2', image: 'https://example.com/s.png' },
  { name: 'Consumable', denom: 'USDC', price: 5, burn: true, description: 'burns', image: 'https://example.com/c.png' }
]);

async function purchase(id: string, who: { address: string; name: string }, tokenId: string) {
  const m = runCli(['products', 'purchase', id, '--creator', who.address, '--token-id', tokenId, '--local']);
  expect(m.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
  let code: number | undefined;
  try { code = (await deployMsgViaKeyring(writeMsgToTmp(m.json, `pc-buy-${tokenId}`), who.name)).code; }
  catch { code = 1; }
  return { code, msg: m.json };
}

describe('products terminal-state integration', () => {
  let ready = false;
  let cid: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
    if (!ready) return;
    await fundMany('alice', [
      { toAddress: dave().address, amount: '5000000', denom: 'ubadge' },
      { toAddress: dave().address, amount: '60000000', denom: USDC }
    ]);
    const tmp = path.join(os.tmpdir(), `pc-${crypto.randomBytes(4).toString('hex')}.json`);
    runCli(['build', 'product-catalog', '--store-address', bob().address, '--products', PRODUCTS,
      '--name', 'Term Shop', '--image', 'https://example.com/shop.png', '--description', 'term shop desc',
      '--creator', alice().address, '--output-file', tmp], { parseJson: false });
    expect(fs.existsSync(tmp)).toBe(true);
    const tx = await deployMsgViaKeyring(tmp, alice().name);
    expect(tx.code).toBe(0);
    cid = tx.collectionId!;
    await waitForIndexerCollection(cid);
  }, 120000);

  it('funded purchase (token 1, 10 USDC) → token minted, store credited ~10, buyer debited ~10', async () => {
    if (!ready || !cid) return;
    const buyer = dave();
    const store0 = getBankBalance(bob().address, USDC);
    const buyer0 = getBankBalance(buyer.address, USDC);
    const r = await purchase(cid, buyer, '1');
    expect(r.code).toBe(0);
    expect(r.msg.value.transfers[0].toAddresses).toEqual([buyer.address]);
    expect(await pollTokenAmount(cid, buyer.address, (a) => a >= 1n, { tokenId: 1, label: 'buyer holds product' }))
      .toBeGreaterThanOrEqual(1n);
    await pollBalance(bob().address, USDC, (b) => b >= store0 + floorFor(10n),
      { label: 'store credited ~10 USDC', timeoutMs: 30000 });
    expect(buyer0 - getBankBalance(buyer.address, USDC)).toBeGreaterThanOrEqual(floorFor(10n)); // buyer debited
  }, 120000);

  it('maxSupply:1 — a 2nd purchase of the same token is REJECTED (token-level cap)', async () => {
    if (!ready || !cid) return;
    const r = await purchase(cid, alice(), '1'); // token 1 already bought above (maxSupply 1)
    expect(r.code).not.toBe(0); // overallMaxNumTransfers=1 exhausted
  }, 90000);

  it('burn:true product (token 3) → transfer routes to the chain burn address; store credited ~5', async () => {
    if (!ready || !cid) return;
    const store0 = getBankBalance(bob().address, USDC);
    const r = await purchase(cid, dave(), '3');
    expect(r.msg.value.transfers[0].toAddresses).toEqual([BURN]);
    expect(r.code).toBe(0);
    await pollBalance(bob().address, USDC, (b) => b >= store0 + floorFor(5n),
      { label: 'store credited ~5 USDC (burn sku)', timeoutMs: 30000 });
  }, 90000);

  it('multi-product — token 2 (20 USDC) purchased by a second buyer; store credited ~20', async () => {
    if (!ready || !cid) return;
    const store0 = getBankBalance(bob().address, USDC);
    const r = await purchase(cid, alice(), '2');
    expect(r.msg.value.transfers[0].toAddresses).toEqual([alice().address]);
    expect(r.code).toBe(0);
    await pollBalance(bob().address, USDC, (b) => b >= store0 + floorFor(20n),
      { label: 'store credited ~20 USDC (token 2)', timeoutMs: 30000 });
  }, 90000);
});
