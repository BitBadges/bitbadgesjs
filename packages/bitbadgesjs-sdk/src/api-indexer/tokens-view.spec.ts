import { BitBadgesAPI } from './BitBadgesApi.js';
import { BitBadgesUserInfo } from './BitBadgesUserInfo.js';
import { BalanceDocWithDetails } from './docs-types/docs.js';
import { GetTokensViewForUserSuccessResponse } from './requests/wrappers.js';
import { BigIntify } from '../common/string-numbers.js';

describe('User token views: created, managing, collected (BB-346)', () => {
  const sampleBalanceDoc = {
    _docId: '1:bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
    collectionId: '1',
    bitbadgesAddress: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
    cosmosAddress: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
    ethAddress: '0x0000000000000000000000000000000000000000',
    balances: [
      {
        amount: '5',
        tokenIds: [{ start: '1', end: '1' }],
        ownershipTimes: [{ start: '1', end: '10' }]
      }
    ],
    outgoingApprovals: [],
    incomingApprovals: [],
    autoApproveSelfInitiatedOutgoingTransfers: true,
    autoApproveSelfInitiatedIncomingTransfers: true,
    autoApproveAllIncomingTransfers: true,
    userPermissions: {
      canUpdateOutgoingApprovals: [],
      canUpdateIncomingApprovals: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveAllIncomingTransfers: []
    },
    updateHistory: [],
    fetchedAt: '0',
    onChainBalances: true,
    lastUpdated: '0'
  };

  it('GetTokensViewForUserSuccessResponse preserves string collection IDs across construct and convert', () => {
    const res = new GetTokensViewForUserSuccessResponse({
      tokens: ['12', '34', '56'],
      pagination: { bookmark: 'next', hasMore: true }
    }).convert(BigIntify);

    expect(res.tokens).toEqual(['12', '34', '56']);
    expect(res.pagination).toEqual({ bookmark: 'next', hasMore: true });
  });

  it('api.getTokensViewForUser handles created, managing (string[]), and collected (BalanceDocWithDetails[])', async () => {
    const api = new BitBadgesAPI({
      apiUrl: 'https://api.bitbadges.io',
      apiKey: 'test-key',
      convertFunction: BigIntify
    });
    const getSpy = jest.spyOn(api.axios, 'get');

    try {
      getSpy.mockResolvedValueOnce({
        data: { tokens: ['7', '8'], pagination: { bookmark: '', hasMore: false } }
      });
      const created = await api.getTokensViewForUser('bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv', {
        viewType: 'created'
      });
      expect(created.tokens).toEqual(['7', '8']);

      getSpy.mockResolvedValueOnce({
        data: { tokens: ['9'], pagination: { bookmark: '', hasMore: false } }
      });
      const managing = await api.getTokensViewForUser('bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv', {
        viewType: 'managing'
      });
      expect(managing.tokens).toEqual(['9']);

      getSpy.mockResolvedValueOnce({
        data: { tokens: [sampleBalanceDoc], pagination: { bookmark: '', hasMore: false } }
      });
      const collected = await api.getTokensViewForUser('bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv', {
        viewType: 'collected'
      });
      expect(collected.tokens).toHaveLength(1);
      expect(collected.tokens[0]).toBeInstanceOf(BalanceDocWithDetails);
      expect(collected.tokens[0].collectionId).toBe('1');
      expect(collected.tokens[0].balances[0].amount).toBe(5n);
    } finally {
      getSpy.mockRestore();
    }
  });

  it('BitBadgesUserInfo.getView returns string[] for createdTokens and managingTokens and BalanceDocWithDetails[] for tokensCollected', () => {
    const acct = new BitBadgesUserInfo({
      ...BitBadgesUserInfo.MintAccount().convert(String),
      collected: [sampleBalanceDoc as any],
      views: {
        createdView: {
          ids: ['101', '102'],
          pagination: { bookmark: '', hasMore: false },
          type: 'createdTokens'
        },
        managingView: {
          ids: ['201'],
          pagination: { bookmark: '', hasMore: false },
          type: 'managingTokens'
        },
        collectedView: {
          ids: [sampleBalanceDoc._docId],
          pagination: { bookmark: '', hasMore: false },
          type: 'tokensCollected'
        }
      }
    }).convert(BigIntify);

    expect(acct.getView('createdTokens', 'createdView')).toEqual(['101', '102']);
    expect(acct.getView('managingTokens', 'managingView')).toEqual(['201']);
    expect(acct.getView('createdTokens', 'missingView')).toEqual([]);

    const collected = acct.getView('tokensCollected', 'collectedView');
    expect(collected).toHaveLength(1);
    expect(collected[0]).toBeInstanceOf(BalanceDocWithDetails);
    expect(collected[0]._docId).toBe(sampleBalanceDoc._docId);
  });
});
