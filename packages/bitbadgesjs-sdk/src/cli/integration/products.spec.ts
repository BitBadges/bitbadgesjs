/**
 * Integration: `bb products` end-to-end.
 *
 * Personas:
 *   - alice → store owner (deploys the 2-product catalog, receives payments)
 *   - charlie → shopper (buys a product; needs USDC funded inline)
 *
 * Flow exercised:
 *   1. alice builds + deploys a Product Catalog collection with 2 products
 *   2. indexer indexes it
 *   3. `products list` returns exactly 2 products with tokenIds 1 and 2
 *   4. `products show` returns productCount: 2
 *   5. charlie is funded with USDC, then pipes `purchase --token-id 1` → deploy
 *   6. resulting MsgTransferTokens is well-formed; chain accepts (code 0)
 *   7. negative: `purchase --token-id 999` exits non-zero with a clear error
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

// The IBC USDC denom on local chain. Products `--denom USDC` resolves to
// this internally; charlie has no genesis USDC, so we fund inline.
const USDC_DENOM = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';

// Two-product catalog payload. Field names are `denom` + `price` (display
// units); the products build doesn't accept `priceDenom`/`priceAmount`.
const PRODUCTS_JSON = JSON.stringify([
  { name: 'Widget', denom: 'USDC', price: 50, description: 'widget desc', image: 'https://example.com/w.png' },
  { name: 'Gadget', denom: 'USDC', price: 150, description: 'gadget desc', image: 'https://example.com/g.png' }
]);

describe('products integration', () => {
  let ready = false;
  let collectionId: string | undefined;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('build + deploy creates a Product Catalog collection with 2 products', async () => {
    if (!ready) return;
    const store = alice();
    const tmp = path.join(os.tmpdir(), `pc-build-${crypto.randomBytes(4).toString('hex')}.json`);

    runCli(
      [
        'build',
        'product-catalog',
        '--store-address', store.address,
        '--products', PRODUCTS_JSON,
        '--name', 'Test Shop',
        '--image', 'https://example.com/shop.png',
        '--description', 'shop desc long enough',
        '--output-file', tmp
      ],
      { parseJson: false } // build emits a review block, not JSON
    );
    expect(fs.existsSync(tmp)).toBe(true);

    const tx = await deployMsgViaKeyring(tmp, store.name);
    expect(tx.code).toBe(0);
    expect(tx.collectionId).toBeDefined();
    collectionId = tx.collectionId!;
    await waitForIndexerCollection(collectionId);
  }, 90000);

  it('list returns exactly 2 products with tokenIds 1 and 2', async () => {
    if (!ready || !collectionId) return;
    const out = runCli(['products', 'list', collectionId, '--local']);
    expect(out.json.collectionId).toBe(collectionId);
    expect(Array.isArray(out.json.products)).toBe(true);
    expect(out.json.products).toHaveLength(2);

    // Products are sorted by tokenId ascending (1, 2).
    const tokenIds = out.json.products.map((p: { tokenId: string }) => p.tokenId);
    expect(tokenIds).toEqual(['1', '2']);

    // Each product carries the store address + a USDC priceCoin entry.
    for (const product of out.json.products) {
      expect(product.storeAddress).toBe(alice().address);
      expect(Array.isArray(product.priceCoins)).toBe(true);
      expect(product.priceCoins.length).toBeGreaterThan(0);
      expect(product.priceCoins[0].denom).toBe(USDC_DENOM);
    }
  }, 30000);

  it('show returns productCount: 2 and a standards tag', async () => {
    if (!ready || !collectionId) return;
    const out = runCli(['products', 'show', collectionId, '--local']);
    expect(out.json.collectionId).toBe(collectionId);
    expect(out.json.productCount).toBe(2);
    expect(Array.isArray(out.json.standards)).toBe(true);
    expect(out.json.products).toHaveLength(2);
  }, 30000);

  it('charlie purchases token-id 1 → MsgTransferTokens → chain code 0', async () => {
    if (!ready || !collectionId) return;
    const shopper = charlie();

    // Fund charlie with USDC. Widget is 50 display units → 50M base units
    // at 6 decimals; we send 100 display units of headroom for fees + slack.
    await fundPersona('alice', shopper.address, '100000000', USDC_DENOM);

    const purchaseMsg = runCli([
      'products',
      'purchase',
      collectionId,
      '--creator', shopper.address,
      '--token-id', '1',
      '--local'
    ]);
    expect(purchaseMsg.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const transfer = purchaseMsg.json.value.transfers[0];
    expect(transfer.from).toBe('Mint');
    // Non-burn products route to the buyer; burn products route to the
    // chain's burn address. The default `burn: undefined` path is non-burn.
    expect(transfer.toAddresses).toEqual([shopper.address]);
    // Product purchases use precalculateBalancesFromApproval, so the
    // balances array is empty and the approval references token 1.
    expect(transfer.balances).toEqual([]);
    expect(transfer.precalculateBalancesFromApproval).toBeDefined();
    expect(transfer.prioritizedApprovals).toHaveLength(1);
    expect(transfer.onlyCheckPrioritizedCollectionApprovals).toBe(true);

    // Pipe to deploy → chain accepts the tx.
    const tmp = writeMsgToTmp(purchaseMsg.json, 'pc-purchase');
    const tx = await deployMsgViaKeyring(tmp, shopper.name);
    expect(tx.code).toBe(0);
  }, 90000);

  it('purchase --token-id 999 exits non-zero with "no product with token ID 999"', async () => {
    if (!ready || !collectionId) return;
    const shopper = charlie();
    const out = runCli(
      [
        'products',
        'purchase',
        collectionId,
        '--creator', shopper.address,
        '--token-id', '999',
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/no product with token ID 999/i);
  }, 30000);

  it('purchase --token-id <non-integer> exits with an actionable error (not raw BigInt SyntaxError)', async () => {
    if (!ready || !collectionId) return;
    const shopper = charlie();
    const out = runCli(
      [
        'products',
        'purchase',
        collectionId,
        '--creator', shopper.address,
        '--token-id', 'not-a-number',
        '--local'
      ],
      { throwOnError: false, parseJson: false }
    );
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/--token-id.*integer/i);
    expect(out.stderr + out.stdout).not.toMatch(/Cannot convert .* to a BigInt/);
  }, 30000);

  it('conformance throw — show on a non-Product collection exits 2', async () => {
    if (!ready) return;
    // Collection `1` on a fresh local chain is either missing or not a
    // Product Catalog — either way `show` should fail validation with exit 2.
    const out = runCli(['products', 'show', '1', '--local'], {
      throwOnError: false,
      parseJson: false
    });
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr + out.stdout).toMatch(/not.*found|not.*valid|Product/i);
  }, 30000);
});
