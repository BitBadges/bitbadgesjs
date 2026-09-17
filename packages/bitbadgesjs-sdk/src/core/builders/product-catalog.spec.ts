import { buildProductCatalog } from './product-catalog.js';
import { convertToBitBadgesAddress } from '../../address-converter/converter.js';
import { callTool } from '../../builder/tools/registry.js';
import { normalizeToCreateOrUpdate } from '../../cli/utils/normalizeMsg.js';

const storeAddress = convertToBitBadgesAddress('0x1111111111111111111111111111111111111111');
const recipient = convertToBitBadgesAddress('0x2222222222222222222222222222222222222222');
const base = { storeAddress, uri: 'ipfs://catalog' };

it('routes each product to its own recipient with a catalog fallback, without changing trackers or supply caps', () => {
  const msg = buildProductCatalog({
    ...base,
    products: [
      { name: 'Default', price: 1, denom: 'BADGE', maxSupply: 3 },
      { name: 'Partner', price: 2, denom: 'BADGE', maxSupply: 5, storeAddress: recipient }
    ]
  } as any).value;
  const approvals = msg.collectionApprovals.filter((a: any) => a.fromListId === 'Mint');
  expect(approvals.map((a: any) => a.approvalCriteria.coinTransfers[0].to)).toEqual([storeAddress, recipient]);
  expect(approvals.map((a: any) => a.approvalCriteria.maxNumTransfers.amountTrackerId)).toEqual(['product-purchase-1', 'product-purchase-2']);
  expect(approvals.map((a: any) => a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers)).toEqual(['3', '5']);
  expect(msg.collectionPermissions.canUpdateCollectionApprovals[0].permanentlyForbiddenTimes).toHaveLength(1);
});

it.each(['', 'not-an-address', 'Mint'])('rejects invalid explicit per-product recipients (%s)', (address) => {
  expect(() => buildProductCatalog({ ...base, products: [{ name: 'Partner', price: 2, denom: 'BADGE', storeAddress: address }] } as any)).toThrow(
    /product .* storeAddress/
  );
});

it('normalizes a per-product EVM recipient to its BitBadges address', () => {
  const msg = buildProductCatalog({
    ...base,
    products: [{ name: 'Partner', price: 2, denom: 'BADGE', storeAddress: '0x2222222222222222222222222222222222222222' }]
  } as any).value;
  expect(msg.collectionApprovals[0].approvalCriteria.coinTransfers[0].to).toBe(recipient);
});

it('exposes the same per-product recipient through the CLI/MCP shared builder adapter', async () => {
  const params = { ...base, products: [{ name: 'Partner', price: 2, denom: 'BADGE', storeAddress: recipient }] };
  const result = await callTool('build_product_catalog', params);
  expect(result.isError).not.toBe(true);
  expect(result.result).toEqual(normalizeToCreateOrUpdate(buildProductCatalog(params)));
});
