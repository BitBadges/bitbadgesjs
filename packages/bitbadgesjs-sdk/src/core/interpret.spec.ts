/**
 * Tests for interpret.ts - interpretCollection function
 */
import { BitBadgesCollection } from '../api-indexer/BitBadgesCollection.js';
import type { iBitBadgesCollection } from '../api-indexer/BitBadgesCollection.js';
import { interpretCollection, timestampToDate, durationToHuman, denomToHuman, amountToHuman } from './interpret.js';

const GO_MAX = 18446744073709551615n;

// Shared helper: minimal empty permission arrays and defaults
function emptyPerms() {
  return {
    canDeleteCollection: [],
    canArchiveCollection: [],
    canUpdateStandards: [],
    canUpdateCustomData: [],
    canUpdateManager: [],
    canUpdateCollectionMetadata: [],
    canUpdateValidTokenIds: [],
    canUpdateTokenMetadata: [],
    canUpdateCollectionApprovals: [],
    canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
    canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
    canUpdateAutoApproveAllIncomingTransfers: [],
    canAddMoreAliasPaths: [],
    canAddMoreCosmosCoinWrapperPaths: []
  };
}

function lockedPerms() {
  const forbidden = [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [{ start: 1n, end: GO_MAX }] }];
  return {
    canDeleteCollection: forbidden,
    canArchiveCollection: forbidden,
    canUpdateStandards: forbidden,
    canUpdateCustomData: forbidden,
    canUpdateManager: forbidden,
    canUpdateCollectionMetadata: forbidden,
    canUpdateValidTokenIds: forbidden.map((f) => ({ ...f, tokenIds: [{ start: 1n, end: GO_MAX }] })),
    canUpdateTokenMetadata: forbidden.map((f) => ({ ...f, tokenIds: [{ start: 1n, end: GO_MAX }] })),
    canUpdateCollectionApprovals: forbidden.map((f) => ({
      ...f,
      fromListId: 'All',
      fromList: { listId: 'All', addresses: [], whitelist: true, uri: '', customData: '', createdBy: '' },
      toListId: 'All',
      toList: { listId: 'All', addresses: [], whitelist: true, uri: '', customData: '', createdBy: '' },
      initiatedByListId: 'All',
      initiatedByList: { listId: 'All', addresses: [], whitelist: true, uri: '', customData: '', createdBy: '' },
      approvalIdListId: 'All',
      approvalIdList: { listId: 'All', addresses: [], whitelist: true, uri: '', customData: '', createdBy: '' },
      amountTrackerIdListId: 'All',
      amountTrackerIdList: { listId: 'All', addresses: [], whitelist: true, uri: '', customData: '', createdBy: '' },
      challengeTrackerIdListId: 'All',
      challengeTrackerIdList: { listId: 'All', addresses: [], whitelist: true, uri: '', customData: '', createdBy: '' },
      transferTimes: [{ start: 1n, end: GO_MAX }],
      tokenIds: [{ start: 1n, end: GO_MAX }],
      ownershipTimes: [{ start: 1n, end: GO_MAX }]
    })),
    canUpdateAutoApproveSelfInitiatedIncomingTransfers: forbidden,
    canUpdateAutoApproveSelfInitiatedOutgoingTransfers: forbidden,
    canUpdateAutoApproveAllIncomingTransfers: forbidden,
    canAddMoreAliasPaths: forbidden,
    canAddMoreCosmosCoinWrapperPaths: forbidden
  };
}

function defaultBalancesObj() {
  return {
    balances: [],
    incomingApprovals: [],
    outgoingApprovals: [],
    userPermissions: {
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveAllIncomingTransfers: []
    },
    autoApproveSelfInitiatedOutgoingTransfers: true,
    autoApproveSelfInitiatedIncomingTransfers: true,
    autoApproveAllIncomingTransfers: false
  };
}

function baseCollection(overrides: Partial<iBitBadgesCollection<bigint>> = {}): iBitBadgesCollection<bigint> {
  return {
    _docId: '1',
    collectionId: '1',
    collectionMetadata: { uri: 'ipfs://metadata', customData: '', metadata: { name: 'Test Collection', description: 'A test', image: 'ipfs://img', fetchedAt: 0n, fetchedAtBlock: 0n, _isUpdating: false } } as any,
    tokenMetadata: [],
    customData: '',
    manager: 'bb1manager123456789',
    collectionPermissions: emptyPerms() as any,
    collectionApprovals: [],
    standards: [],
    isArchived: false,
    defaultBalances: defaultBalancesObj() as any,
    createdBy: 'bb1creator123',
    createdBlock: 1n,
    createdTimestamp: 1000n,
    updateHistory: [],
    validTokenIds: [{ start: 1n, end: 10n }],
    mintEscrowAddress: '',
    cosmosCoinWrapperPaths: [],
    aliasPaths: [],
    invariants: {
      noCustomOwnershipTimes: false,
      maxSupplyPerId: 0n,
      noForcefulPostMintTransfers: false,
      disablePoolCreation: false
    } as any,
    activity: [],
    owners: [],
    challengeTrackers: [],
    approvalTrackers: [],
    listings: [],
    claims: [],
    views: {},
    ...overrides
  };
}

function addressList(id: string) {
  if (id === 'All') {
    return { listId: 'All', addresses: [], whitelist: false, uri: '', customData: '', createdBy: '' };
  }
  if (id.startsWith('!')) {
    return { listId: id, addresses: [id.slice(1)], whitelist: false, uri: '', customData: '', createdBy: '' };
  }
  return { listId: id, addresses: [id], whitelist: true, uri: '', customData: '', createdBy: '' };
}

function mintApproval(id: string, extras: Record<string, any> = {}) {
  return {
    approvalId: id,
    fromListId: 'Mint',
    fromList: addressList('Mint'),
    toListId: 'All',
    toList: addressList('All'),
    initiatedByListId: 'All',
    initiatedByList: addressList('All'),
    transferTimes: [{ start: 1n, end: GO_MAX }],
    tokenIds: [{ start: 1n, end: 10n }],
    ownershipTimes: [{ start: 1n, end: GO_MAX }],
    version: 0n,
    uri: '',
    customData: '',
    ...extras
  };
}

function transferApproval(id: string, extras: Record<string, any> = {}) {
  return {
    approvalId: id,
    fromListId: 'All',
    fromList: addressList('All'),
    toListId: 'All',
    toList: addressList('All'),
    initiatedByListId: 'All',
    initiatedByList: addressList('All'),
    transferTimes: [{ start: 1n, end: GO_MAX }],
    tokenIds: [{ start: 1n, end: GO_MAX }],
    ownershipTimes: [{ start: 1n, end: GO_MAX }],
    version: 0n,
    uri: '',
    customData: '',
    ...extras
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('interpretCollection', () => {
  it('should return a string for a minimal NFT collection', () => {
    const col = baseCollection({
      standards: ['NFTs'],
      collectionPermissions: lockedPerms() as any,
      collectionApprovals: [
        mintApproval('mint-all', {
          approvalCriteria: {
            approvalAmounts: {
              overallApprovalAmount: 10n,
              perToAddressApprovalAmount: 0n,
              perFromAddressApprovalAmount: 0n,
              perInitiatedByAddressApprovalAmount: 1n,
              amountTrackerId: 'mint-all',
              resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
            }
          }
        })
      ] as any
    });

    const result = interpretCollection(col);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);
    expect(result).toContain('NFT Collection');
    expect(result).toContain('## Collection Overview');
    expect(result).toContain('## How Tokens Are Created');
    expect(result).toContain('## Transfer & Approval Rules');
    expect(result).toContain('## Permissions');
    expect(result).toContain('## Invariants');
    expect(result).toContain('Permanently Locked');
    expect(result).toContain('Test Collection');
  });

  it('should handle a fungible token with transfer approvals', () => {
    const col = baseCollection({
      standards: ['Fungible Tokens'],
      validTokenIds: [{ start: 1n, end: 1n }],
      invariants: {
        noCustomOwnershipTimes: true,
        maxSupplyPerId: 1000000n,
        noForcefulPostMintTransfers: true,
        disablePoolCreation: false
      } as any,
      collectionApprovals: [
        mintApproval('public-mint', {
          approvalCriteria: {
            coinTransfers: [
              {
                to: 'bb1manager123456789',
                coins: [{ amount: 100n, denom: 'ubadge' }],
                overrideFromWithApproverAddress: false,
                overrideToWithInitiator: false
              }
            ]
          }
        }),
        transferApproval('free-transfer')
      ] as any
    });

    const result = interpretCollection(col);
    expect(result).toContain('Fungible Token');
    expect(result).toContain('1,000,000');
    expect(result).toContain('BADGE');
    expect(result).toContain('public-mint');
    expect(result).toContain('free-transfer');
    expect(result).toContain('forcefully moving tokens');
  });

  it('should handle a smart token (IBC-backed)', () => {
    const col = baseCollection({
      standards: ['Smart Token'],
      invariants: {
        noCustomOwnershipTimes: true,
        maxSupplyPerId: 0n,
        noForcefulPostMintTransfers: true,
        disablePoolCreation: false,
        cosmosCoinBackedPath: {
          address: 'bb1backingaddr',
          conversion: {
            sideA: { amount: 1n, denom: 'ibc/USDC' },
            sideB: [{ amount: 1n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: GO_MAX }] }]
          }
        }
      } as any
    });

    const result = interpretCollection(col);
    expect(result).toContain('Smart Token (IBC-backed)');
    expect(result).toContain('USDC');
    expect(result).toContain('bb1backingaddr');
    expect(result).toContain('IBC');
  });

  it('should NEVER include private fields in the output', () => {
    const col = baseCollection({
      claims: [
        {
          _includesPrivateParams: true,
          claimId: 'claim-1',
          plugins: [
            {
              instanceId: 'inst1',
              pluginId: 'codes' as any,
              version: '1',
              publicParams: { numCodes: 100 },
              privateParams: { codes: ['SECRET_CODE_123'] },
              publicState: {},
              privateState: { usedCodes: ['SECRET_CODE_123'] }
            }
          ],
          version: 1n,
          approach: 'codes',
          seedCode: 'SUPER_SECRET_SEED',
          _templateInfo: { pluginId: 'codes', completedTemplateStep: true },
          manualDistribution: false
        }
      ] as any,
      collectionApprovals: [
        mintApproval('claim-mint', {
          approvalCriteria: {
            merkleChallenges: [
              {
                root: 'abc123root',
                expectedProofLength: 3n,
                useCreatorAddressAsLeaf: false,
                maxUsesPerLeaf: 1n,
                uri: '',
                customData: '',
                challengeTrackerId: 'tracker-1',
                challengeInfoDetails: {
                  challengeDetails: {
                    leaves: ['leaf1'],
                    isHashed: true,
                    preimages: ['PRIVATE_PREIMAGE_1', 'PRIVATE_PREIMAGE_2'],
                    seedCode: 'MERKLE_SECRET_SEED'
                  }
                }
              }
            ]
          }
        })
      ] as any
    });

    const result = interpretCollection(col);

    // These private values should NEVER appear
    expect(result).not.toContain('SUPER_SECRET_SEED');
    expect(result).not.toContain('SECRET_CODE_123');
    expect(result).not.toContain('PRIVATE_PREIMAGE_1');
    expect(result).not.toContain('PRIVATE_PREIMAGE_2');
    expect(result).not.toContain('MERKLE_SECRET_SEED');
    expect(result).not.toContain('_includesPrivateParams');
    expect(result).not.toContain('_templateInfo');
    expect(result).not.toContain('privateParams');
    expect(result).not.toContain('privateState');

    // But the claim should still be described
    expect(result).toContain('claim-1');
    expect(result).toContain('## Claims');
  });

  it('should detect soulbound (non-transferable) collections', () => {
    const col = baseCollection({
      standards: ['NFTs'],
      collectionApprovals: [mintApproval('mint-only')] as any
    });

    const result = interpretCollection(col);
    expect(result).toContain('non-transferable');
    expect(result).toContain('soulbound');
  });

  it('should show all required markdown sections', () => {
    const col = baseCollection({
      standards: ['NFTs'],
      collectionApprovals: [mintApproval('mint'), transferApproval('transfer')] as any
    });

    const result = interpretCollection(col);
    expect(result).toContain('## Collection Overview');
    expect(result).toContain('## Token Backing & Cross-Chain');
    expect(result).toContain('## How Tokens Are Created');
    expect(result).toContain('## Transfer & Approval Rules');
    expect(result).toContain('## Default Balances & Auto-Approve Settings');
    expect(result).toContain('## Permissions');
    expect(result).toContain('## Invariants');
    expect(result).toContain('## Claims');
    expect(result).toContain('## Key Reference Information');
  });

  it('should accept a BitBadgesCollection class instance', () => {
    const data = baseCollection({ standards: ['NFTs'] });
    const instance = new BitBadgesCollection(data);
    const result = interpretCollection(instance);
    expect(result).toContain('NFT Collection');
  });

  it('should describe archived collections', () => {
    const col = baseCollection({ isArchived: true });
    const result = interpretCollection(col);
    expect(result).toContain('ARCHIVED');
  });

  it('should describe default balance auto-approve settings', () => {
    const col = baseCollection();
    const result = interpretCollection(col);
    expect(result).toContain('Auto-approve self-initiated outgoing transfers**: Yes');
    expect(result).toContain('Auto-approve self-initiated incoming transfers**: Yes');
    expect(result).toContain('Auto-approve all incoming transfers**: No');
  });

  it('should use markdown headings (##) not ALL CAPS section headers', () => {
    const col = baseCollection({
      standards: ['NFTs'],
      collectionApprovals: [mintApproval('mint'), transferApproval('transfer')] as any
    });

    const result = interpretCollection(col);
    // Markdown headings should be present
    const headings = result.match(/^## .+$/gm) || [];
    expect(headings.length).toBeGreaterThanOrEqual(7);

    // Old ALL CAPS headers should NOT be present
    expect(result).not.toMatch(/^OVERVIEW$/m);
    expect(result).not.toMatch(/^METADATA$/m);
    expect(result).not.toMatch(/^HOW TOKENS ARE CREATED \/ OBTAINED$/m);
    expect(result).not.toMatch(/^TRANSFERABILITY$/m);
    expect(result).not.toMatch(/^PERMISSIONS$/m);
    expect(result).not.toMatch(/^INVARIANTS \(ON-CHAIN GUARANTEES\)$/m);
    expect(result).not.toMatch(/^CLAIMS$/m);
    expect(result).not.toMatch(/^IBC \/ CROSS-CHAIN$/m);
  });

  it('should produce prose paragraphs, not just bullet lists', () => {
    const col = baseCollection({
      standards: ['NFTs'],
      collectionPermissions: lockedPerms() as any,
      collectionApprovals: [
        mintApproval('mint-all', {
          approvalCriteria: {
            approvalAmounts: {
              overallApprovalAmount: 100n,
              perToAddressApprovalAmount: 0n,
              perFromAddressApprovalAmount: 0n,
              perInitiatedByAddressApprovalAmount: 5n,
              amountTrackerId: 'mint-all',
              resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
            }
          }
        }),
        transferApproval('free-transfer')
      ] as any
    });

    const result = interpretCollection(col);
    // Should contain full sentences, not just "Key: value" pairs
    expect(result).toContain('This approval controls');
    expect(result).toContain('permanently locked');
    // Should have proper bold markdown
    expect(result).toMatch(/\*\*[^*]+\*\*/);
  });
});

// ---------------------------------------------------------------------------
// Helper function tests
// ---------------------------------------------------------------------------

describe('timestampToDate', () => {
  it('should return boundary text for 0 and max', () => {
    expect(timestampToDate(0n)).toBe('the beginning of time');
    expect(timestampToDate(GO_MAX)).toBe('the end of time');
  });

  it('should format a known date correctly', () => {
    // Jan 1, 2025 00:00:00 UTC = 1735689600000 ms
    const result = timestampToDate(1735689600000n);
    expect(result).toContain('January');
    expect(result).toContain('2025');
  });
});

describe('durationToHuman', () => {
  it('should convert common durations', () => {
    expect(durationToHuman(86400000n)).toBe('24 hours');
    expect(durationToHuman(604800000n)).toBe('7 days (weekly)');
    expect(durationToHuman(3600000n)).toBe('1 hour');
  });

  it('should handle boundary values', () => {
    expect(durationToHuman(0n)).toBe('instant');
    expect(durationToHuman(GO_MAX)).toBe('forever');
  });
});

describe('denomToHuman', () => {
  it('should map ubadge to BADGE', () => {
    expect(denomToHuman('ubadge')).toBe('BADGE');
  });

  it('should pass through unknown denoms', () => {
    expect(denomToHuman('some-random-denom')).toBe('some-random-denom');
  });
});

describe('amountToHuman', () => {
  it('should convert ubadge amounts with 9 decimals', () => {
    const result = amountToHuman(1000000000n, 'ubadge');
    expect(result).toContain('1');
    expect(result).toContain('BADGE');
  });

  it('should handle fractional amounts', () => {
    const result = amountToHuman(1500000000n, 'ubadge');
    expect(result).toContain('1.5');
    expect(result).toContain('BADGE');
  });
});
