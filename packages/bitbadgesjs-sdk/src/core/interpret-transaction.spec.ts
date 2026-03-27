import { interpretTransaction } from './interpret-transaction.js';

const MAX_UINT64 = '18446744073709551615';

// Minimal helper to create a full-range time entry (1 to MAX_UINT64)
const fullRange = () => [{ start: '1', end: MAX_UINT64 }];

describe('interpretTransaction', () => {
  // -------------------------------------------------------------------------
  // 1. Basic create — Simple NFT collection with 1 mint approval, locked permissions
  // -------------------------------------------------------------------------
  it('should produce all sections for a basic NFT create', () => {
    const txBody = {
      creator: 'bb1abc123',
      manager: 'bb1abc123',
      collectionMetadata: {
        metadata: {
          name: 'Test NFTs',
          description: 'A simple test NFT collection'
        }
      },
      validTokenIds: [{ start: '1', end: '10' }],
      standards: ['NFTs'],
      invariants: {
        maxSupplyPerId: '1',
        noForcefulPostMintTransfers: true
      },
      collectionApprovals: [
        {
          approvalId: 'mint-all',
          fromListId: 'Mint',
          toListId: 'All',
          initiatedByListId: 'All',
          tokenIds: fullRange(),
          transferTimes: fullRange(),
          ownershipTimes: fullRange(),
          approvalCriteria: {
            approvalAmounts: {
              overallApprovalAmount: '10',
              perInitiatedByAddressApprovalAmount: '1',
              perFromAddressApprovalAmount: '0',
              perToAddressApprovalAmount: '0'
            },
            maxNumTransfers: {
              overallMaxNumTransfers: '0',
              perInitiatedByAddressMaxNumTransfers: '0',
              perFromAddressMaxNumTransfers: '0',
              perToAddressMaxNumTransfers: '0'
            }
          }
        }
      ],
      collectionPermissions: {
        canDeleteCollection: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canArchiveCollection: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateStandards: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateCustomData: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateManager: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateCollectionMetadata: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateValidTokenIds: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateTokenMetadata: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateCollectionApprovals: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateAutoApproveSelfInitiatedIncomingTransfers: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canUpdateAutoApproveAllIncomingTransfers: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canAddMoreAliasPaths: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
        canAddMoreCosmosCoinWrapperPaths: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }]
      },
      defaultBalances: {
        balances: [],
        autoApproveSelfInitiatedOutgoingTransfers: true,
        autoApproveSelfInitiatedIncomingTransfers: true,
        autoApproveAllIncomingTransfers: false
      }
    };

    const result = interpretTransaction(txBody);

    // Verify all section headers appear
    expect(result).toContain('## Transaction Summary');
    expect(result).toContain('## Collection Overview');
    expect(result).toContain('## Token Backing & Paths');
    expect(result).toContain('## Invariants');
    expect(result).toContain('## Standards');
    expect(result).toContain('## Key Reference Information');
    expect(result).toContain('## Transfer & Approval Rules');
    expect(result).toContain('## Permissions -- What Can Change Later');
    expect(result).toContain('## Default User Balances');

    // Content checks
    expect(result).toContain('Test NFTs');
    expect(result).toContain('NFT Collection');
    expect(result).toContain('10 unique token IDs');
    expect(result).toContain('maximum supply of 1 tokens');
    expect(result).toContain('Permanently Locked');
    expect(result).toContain('fully immutable');
    expect(result).toContain('mint-all');
    expect(result).toContain('a total cap of 10 tokens');
    expect(result).toContain('a per-user limit of 1 tokens');
  });

  // -------------------------------------------------------------------------
  // 2. Smart token create — IBC-backed with backing path, alias path
  // -------------------------------------------------------------------------
  it('should describe IBC-backed smart token with alias and wrapper paths', () => {
    const txBody = {
      creator: 'bb1creator',
      manager: 'bb1manager',
      collectionMetadata: {
        metadata: {
          name: 'Wrapped USDC',
          description: 'USDC-backed smart token'
        }
      },
      validTokenIds: fullRange(),
      standards: ['Smart Token'],
      invariants: {
        maxSupplyPerId: '0',
        cosmosCoinBackedPath: {
          address: 'bb1backingaddr',
          conversion: {
            sideA: { denom: 'ubadge', amount: '1000000000' },
            sideB: [{ amount: '1' }]
          }
        }
      },
      aliasPaths: [
        {
          denom: 'badges:1:wusdc',
          symbol: 'wUSDC',
          metadata: { metadata: { name: 'Wrapped USDC Alias' } }
        }
      ],
      cosmosCoinWrapperPaths: [
        {
          denom: 'badges:1:wrapper',
          symbol: 'wUSDC-IBC',
          metadata: { metadata: { name: 'USDC Wrapper' } }
        }
      ],
      collectionApprovals: [
        {
          approvalId: 'deposit',
          fromListId: 'Mint',
          toListId: 'All',
          initiatedByListId: 'All',
          tokenIds: fullRange(),
          transferTimes: fullRange(),
          ownershipTimes: fullRange(),
          approvalCriteria: {
            allowBackedMinting: true
          }
        },
        {
          approvalId: 'withdraw',
          fromListId: 'All',
          toListId: 'bb1backingaddr',
          initiatedByListId: 'All',
          tokenIds: fullRange(),
          transferTimes: fullRange(),
          ownershipTimes: fullRange(),
          approvalCriteria: {
            allowBackedMinting: true
          }
        }
      ],
      collectionPermissions: {},
      defaultBalances: {
        balances: [],
        autoApproveSelfInitiatedOutgoingTransfers: true,
        autoApproveSelfInitiatedIncomingTransfers: true,
        autoApproveAllIncomingTransfers: true
      }
    };

    const result = interpretTransaction(txBody);

    // Backing info
    expect(result).toContain('IBC-backed');
    expect(result).toContain('bb1backingaddr');
    expect(result).toContain('BADGE');

    // Alias path
    expect(result).toContain('Alias Paths');
    expect(result).toContain('Wrapped USDC Alias');

    // Wrapper path
    expect(result).toContain('Cosmos Coin Wrapper Paths');
    expect(result).toContain('USDC Wrapper');

    // Approvals
    expect(result).toContain('deposit');
    expect(result).toContain('withdraw');
    expect(result).toContain('IBC Backing');
  });

  // -------------------------------------------------------------------------
  // 3. Update mode — Only updateCollectionApprovals flag set
  // -------------------------------------------------------------------------
  it('should only include relevant sections in update mode', () => {
    const txBody = {
      creator: 'bb1creator',
      manager: 'bb1manager',
      collectionMetadata: {
        metadata: { name: 'My Collection' }
      },
      validTokenIds: [{ start: '1', end: '5' }],
      standards: ['NFTs'],
      collectionApprovals: [
        {
          approvalId: 'new-transfer-rule',
          fromListId: '!Mint',
          toListId: 'All',
          initiatedByListId: 'All',
          tokenIds: fullRange(),
          transferTimes: fullRange(),
          ownershipTimes: fullRange(),
          approvalCriteria: {}
        }
      ],
      collectionPermissions: {}
    };

    const result = interpretTransaction(txBody, true, ['updateCollectionApprovals']);

    // Should include sections 1 (summary), 6 (key reference), and 7 (approvals)
    expect(result).toContain('## Transaction Summary');
    expect(result).toContain('Update collection');
    expect(result).toContain('transfer and minting rules');
    expect(result).toContain('## Key Reference Information');
    expect(result).toContain('## Transfer & Approval Rules');
    expect(result).toContain('new-transfer-rule');

    // Should NOT include sections 2, 3, 4, 5, 8, 9
    expect(result).not.toContain('## Collection Overview');
    expect(result).not.toContain('## Token Backing & Paths');
    expect(result).not.toContain('## Invariants');
    expect(result).not.toContain('## Standards');
    expect(result).not.toContain('## Permissions -- What Can Change Later');
    expect(result).not.toContain('## Default User Balances');
  });

  // -------------------------------------------------------------------------
  // 4. Empty/minimal — Transaction with minimal fields
  // -------------------------------------------------------------------------
  it('should handle minimal transaction with no approvals or permissions gracefully', () => {
    const txBody = {
      creator: 'bb1min',
      collectionMetadata: {
        metadata: { name: 'Empty Collection' }
      }
    };

    const result = interpretTransaction(txBody);

    expect(result).toContain('## Transaction Summary');
    expect(result).toContain('Empty Collection');
    expect(result).toContain('No token IDs have been defined yet');
    expect(result).toContain('No collection-level approvals are configured');
    expect(result).toContain('No invariants are set');
    expect(result).toContain('No standards are declared');
  });

  // -------------------------------------------------------------------------
  // 5. Claims — Approval with merkleChallenges and plugins
  // -------------------------------------------------------------------------
  it('should describe merkle challenges and claim plugins', () => {
    const txBody = {
      creator: 'bb1claims',
      manager: 'bb1claims',
      collectionMetadata: { metadata: { name: 'Claim Collection' } },
      validTokenIds: [{ start: '1', end: '100' }],
      standards: [],
      collectionApprovals: [
        {
          approvalId: 'claim-mint',
          fromListId: 'Mint',
          toListId: 'All',
          initiatedByListId: 'All',
          tokenIds: fullRange(),
          transferTimes: fullRange(),
          ownershipTimes: fullRange(),
          approvalCriteria: {
            merkleChallenges: [
              {
                challengeInfoDetails: {
                  claim: {
                    claimId: 'whitelist-claim-1',
                    metadata: { name: 'Early Access Claim' },
                    plugins: [
                      {
                        pluginId: 'whitelist',
                        publicParams: { maxUses: 100 }
                      },
                      {
                        pluginId: 'discord',
                        publicParams: {}
                      },
                      {
                        pluginId: 'numUses',
                        publicParams: { maxUsesPerAddress: 1 }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      ],
      collectionPermissions: {}
    };

    const result = interpretTransaction(txBody);

    expect(result).toContain('Verification Challenges');
    expect(result).toContain('1 Merkle proof challenge');
    expect(result).toContain('whitelist-claim-1');
    expect(result).toContain('Early Access Claim');
    expect(result).toContain('Whitelist (user must be on an approved address list)');
    expect(result).toContain('Discord Verification');
    expect(result).toContain('Usage Limit');
  });

  // -------------------------------------------------------------------------
  // 6. Forceful override — Approval with overridesFromOutgoingApprovals
  // -------------------------------------------------------------------------
  it('should warn about forceful override approvals', () => {
    const txBody = {
      creator: 'bb1force',
      manager: 'bb1force',
      collectionMetadata: { metadata: { name: 'Forceful Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [
        {
          approvalId: 'force-transfer',
          fromListId: 'All',
          toListId: 'All',
          initiatedByListId: 'All',
          tokenIds: fullRange(),
          transferTimes: fullRange(),
          ownershipTimes: fullRange(),
          approvalCriteria: {
            overridesFromOutgoingApprovals: true,
            overridesToIncomingApprovals: true
          }
        }
      ],
      collectionPermissions: {}
    };

    const result = interpretTransaction(txBody);

    expect(result).toContain('Forceful Behavior');
    expect(result).toContain("overrides the sender's personal outgoing approval");
    expect(result).toContain("overrides the recipient's personal incoming approval");
    expect(result).toContain('Warning');
    expect(result).toContain('forceful transfers or seizure');
  });

  // -------------------------------------------------------------------------
  // Additional: update with multiple flags
  // -------------------------------------------------------------------------
  it('should include multiple sections when multiple update flags are set', () => {
    const txBody = {
      creator: 'bb1multi',
      manager: 'bb1multi',
      collectionMetadata: { metadata: { name: 'Multi Update' } },
      validTokenIds: [{ start: '1', end: '5' }],
      standards: ['NFTs'],
      invariants: { maxSupplyPerId: '10' },
      collectionApprovals: [],
      collectionPermissions: {
        canDeleteCollection: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }]
      },
      defaultBalances: {
        balances: [],
        autoApproveSelfInitiatedOutgoingTransfers: true,
        autoApproveSelfInitiatedIncomingTransfers: false,
        autoApproveAllIncomingTransfers: false
      }
    };

    const result = interpretTransaction(txBody, true, ['updateCollectionPermissions', 'updateDefaultBalances', 'updateInvariants']);

    // Should include sections 1, 4, 6, 8, 9
    expect(result).toContain('## Transaction Summary');
    expect(result).toContain('## Key Reference Information');
    expect(result).toContain('## Permissions -- What Can Change Later');
    expect(result).toContain('## Default User Balances');
    expect(result).toContain('## Invariants');

    // Should NOT include sections 2, 3, 5, 7
    expect(result).not.toContain('## Collection Overview');
    expect(result).not.toContain('## Token Backing & Paths');
    expect(result).not.toContain('## Standards');
    expect(result).not.toContain('## Transfer & Approval Rules');
  });
});
