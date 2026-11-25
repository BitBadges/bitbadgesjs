/**
 * Regression: the indexer returns `validTokenIds` and `collectionMetadata`
 * (not the pre-rename `validBadgeIds` / `collectionMetadataTimeline`).
 * build_transfer defaulted to token 1 only and analyze_collection reported
 * name "Unnamed" / tokenIds "none" for every live collection.
 */
import { handleBuildTransfer } from './buildTransfer.js';
import { handleAnalyzeCollection } from './analyzeCollection.js';

const getCollectionsMock = jest.fn();
jest.mock('../../sdk/apiClient.js', () => ({
  getCollections: (req: unknown) => getCollectionsMock(req)
}));

const FOREVER = [{ start: '1', end: '18446744073709551615' }];
const liveCollection = {
  collectionId: '1',
  manager: 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7',
  standards: [],
  validTokenIds: [{ start: '1', end: '20' }],
  collectionMetadata: { uri: 'ipfs://x', customData: '', metadata: { name: 'BitBadges Examples', description: 'Examples' } },
  invariants: {},
  collectionPermissions: {},
  collectionApprovals: [
    {
      approvalId: 'public-mint',
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '20' }],
      ownershipTimes: FOREVER,
      approvalCriteria: {}
    }
  ]
};

beforeEach(() => {
  getCollectionsMock.mockResolvedValue({ success: true, data: { collections: [liveCollection] } });
});

test('build_transfer defaults to every valid token ID from validTokenIds', async () => {
  const result: any = await handleBuildTransfer({
    collectionId: '1',
    fromAddress: 'Mint',
    toAddress: 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7'
  } as any);
  expect(result.success).toBe(true);
  const balances = result.transaction.messages[0].value.transfers[0].balances;
  expect(balances[0].tokenIds).toEqual([{ start: '1', end: '20' }]);
});

test('analyze_collection reads collectionMetadata and validTokenIds', async () => {
  const result: any = await handleAnalyzeCollection({ collectionId: '1' });
  expect(result.success).toBe(true);
  expect(result.analysis.name).toBe('BitBadges Examples');
  expect(result.analysis.description).toBe('Examples');
  expect(result.analysis.tokenIds).not.toBe('none');
  expect(result.analysis.tokenIds).toContain('20');
});
