import { callTool, getCapabilityCatalog } from '../builder/tools/registry.js';
import { buildPurchaseProductMsg, extractAllProducts } from './products.js';
import { buildBountyAcceptTx, extractBountyDetails } from './bounties.js';
import { buildContributeCrowdfundTx, buildRefundCrowdfundMsg, extractCrowdfundDetails } from './crowdfunds.js';
import { buildAcceptAuctionBidMsg, extractAuctionDetails } from './auctions.js';

const creator = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';
function numeric(value: any): any {
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  if (Array.isArray(value)) return value.map(numeric);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, numeric(item)]));
  return value;
}
it.each(['product_catalog', 'bounty', 'crowdfund', 'auction'])('preserves observed approval versions in %s actions', async (family) => {
  const name = `build_${family}`;
  const example = (getCapabilityCatalog(name).capabilities[0].inputSchema as any).examples[0];
  const result = await callTool(name, example);
  const collection = numeric((result.result as any).value);
  for (const approval of collection.collectionApprovals) approval.version = 7n;
  let proposals: any[];
  if (family === 'product_catalog') proposals = [buildPurchaseProductMsg(creator, '1', extractAllProducts(collection.collectionApprovals)[0])];
  else if (family === 'bounty') proposals = [buildBountyAcceptTx(creator, '1', extractBountyDetails(collection.collectionApprovals)!.acceptApproval)];
  else if (family === 'crowdfund') {
    const details = extractCrowdfundDetails(collection.collectionApprovals)!;
    proposals = [buildContributeCrowdfundTx(creator, '1', details, 1n), buildRefundCrowdfundMsg(creator, '1', details, 1n)];
  } else {
    const details = extractAuctionDetails(collection.collectionApprovals)!;
    proposals = [(buildAcceptAuctionBidMsg as any)(creator, '1', 'bid', creator, details.mintApproval!.approvalId, 1n, details.mintApproval!.version)];
  }
  const transfers = proposals.flatMap((proposal) => proposal.messages ?? [proposal]).flatMap((message) => message.value.transfers ?? []);
  const priorities = transfers.flatMap((transfer) => transfer.prioritizedApprovals).filter((approval) => approval.approvalLevel === 'collection');
  expect(priorities.length).toBeGreaterThan(0);
  expect(priorities.every((approval) => approval.version === '7')).toBe(true);
  for (const transfer of transfers) if (transfer.precalculateBalancesFromApproval) expect(transfer.precalculateBalancesFromApproval.version).toBe('7');
});
