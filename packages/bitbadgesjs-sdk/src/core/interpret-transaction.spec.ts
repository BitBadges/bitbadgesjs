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
    expect(result).toContain('## Token Backing & Cross-Chain');
    expect(result).toContain('## Invariants');
    expect(result).toContain('## Standards');
    expect(result).toContain('## Key Reference Information');
    expect(result).toContain('## How Tokens Are Created');
    expect(result).toContain('## Transfer & Approval Rules');
    expect(result).toContain('## Permissions -- What Can Change Later');
    expect(result).toContain('## Default Balances & Auto-Approve Settings');

    // Content checks
    expect(result).toContain('Test NFTs');
    expect(result).toContain('NFT Collection');
    expect(result).toContain('10 unique token IDs');
    expect(result).toContain('maximum supply of 1 tokens');
    expect(result).toContain('truly one-of-a-kind');
    expect(result).toContain('Permanently Locked');
    expect(result).toContain('fully immutable');
    expect(result).toContain('mint-all');
    expect(result).toContain('a total cap of 10 tokens');
    expect(result).toContain('a per-user limit of 1 token');
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
    expect(result).toContain('## How Tokens Are Created');
    expect(result).toContain('## Transfer & Approval Rules');
    expect(result).toContain('new-transfer-rule');

    // Should NOT include sections 2, 3, 4, 5, 8, 9
    expect(result).not.toContain('## Collection Overview');
    expect(result).not.toContain('## Token Backing & Cross-Chain');
    expect(result).not.toContain('## Invariants');
    expect(result).not.toContain('## Standards');
    expect(result).not.toContain('## Permissions -- What Can Change Later');
    expect(result).not.toContain('## Default Balances & Auto-Approve Settings');
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
    expect(result).toContain('no active minting approvals configured');
    expect(result).toContain('non-transferable (soulbound)');
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
    expect(result).toContain('1 verification challenge');
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
  // Test: senderChecks, recipientChecks, initiatorChecks
  // -------------------------------------------------------------------------
  it('should describe sender, recipient, and initiator checks', () => {
    const txBody = {
      creator: 'bb1checks',
      manager: 'bb1checks',
      collectionMetadata: { metadata: { name: 'Checks Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'guarded-transfer',
        fromListId: '!Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          senderChecks: { mustNotBeEvmContract: true },
          recipientChecks: { mustNotBeLiquidityPool: true },
          initiatorChecks: { mustBeEvmContract: true }
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Sender Checks');
    expect(result).toContain('must NOT be a smart contract');
    expect(result).toContain('Recipient Checks');
    expect(result).toContain('must NOT be a liquidity pool');
    expect(result).toContain('Initiator Checks');
    expect(result).toContain('must be a smart contract');
  });

  // -------------------------------------------------------------------------
  // Test: altTimeChecks
  // -------------------------------------------------------------------------
  it('should describe alt time checks', () => {
    const txBody = {
      creator: 'bb1time',
      manager: 'bb1time',
      collectionMetadata: { metadata: { name: 'Time Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'business-hours',
        fromListId: '!Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          altTimeChecks: {
            offlineHours: [{ start: '0', end: '8' }, { start: '17', end: '24' }],
            offlineDays: [{ start: '0', end: '0' }, { start: '6', end: '6' }]
          }
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Time Restrictions');
    expect(result).toContain('denied during hours');
    expect(result).toContain('Sunday');
    expect(result).toContain('Saturday');
  });

  // -------------------------------------------------------------------------
  // Test: userRoyalties
  // -------------------------------------------------------------------------
  it('should describe royalties', () => {
    const txBody = {
      creator: 'bb1royalty',
      manager: 'bb1royalty',
      collectionMetadata: { metadata: { name: 'Royalty Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'royalty-transfer',
        fromListId: '!Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          userApprovalSettings: {
            userRoyalties: {
              percentage: '250',
              payoutAddress: 'bb1royaltypayout'
            }
          }
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Royalties');
    expect(result).toContain('2.50%');
    expect(result).toContain('bb1royaltypayout');
  });

  // -------------------------------------------------------------------------
  // Test: advanced challenge types
  // -------------------------------------------------------------------------
  it('should describe advanced challenge types', () => {
    const txBody = {
      creator: 'bb1adv',
      manager: 'bb1adv',
      collectionMetadata: { metadata: { name: 'Advanced Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'multi-challenge',
        fromListId: '!Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          ethSignatureChallenges: [{ someData: true }],
          votingChallenges: [{ someData: true }],
          dynamicStoreChallenges: [{ someData: true }],
          evmQueryChallenges: [{ someData: true }]
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Signature Verification');
    expect(result).toContain('Voting Requirements');
    expect(result).toContain('Dynamic Store Checks');
    expect(result).toContain('On-Chain Verification');
  });

  // -------------------------------------------------------------------------
  // Test: predeterminedBalances with duration (subscriptions)
  // -------------------------------------------------------------------------
  it('should describe predetermined balances with duration', () => {
    const txBody = {
      creator: 'bb1sub',
      manager: 'bb1sub',
      collectionMetadata: { metadata: { name: 'Subscription Collection' } },
      validTokenIds: fullRange(),
      standards: ['Subscription'],
      collectionApprovals: [{
        approvalId: 'subscribe',
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          predeterminedBalances: {
            orderCalculationMethod: { useOverallNumTransfers: true },
            incrementedBalances: {
              incrementTokenIdsBy: '0',
              incrementOwnershipTimesBy: '0',
              durationFromTimestamp: '2592000000',
              allowOverrideTimestamp: false
            }
          },
          requireToEqualsInitiatedBy: true
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Distribution Method');
    expect(result).toContain('30 days');
    expect(result).toContain('self-claim only');
  });

  // -------------------------------------------------------------------------
  // Test: default incoming/outgoing approvals
  // -------------------------------------------------------------------------
  it('should describe default user-level approvals', () => {
    const txBody = {
      creator: 'bb1def',
      manager: 'bb1def',
      collectionMetadata: { metadata: { name: 'Defaults Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [],
      collectionPermissions: {},
      defaultBalances: {
        balances: [{ amount: '5', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: fullRange() }],
        autoApproveSelfInitiatedOutgoingTransfers: true,
        autoApproveSelfInitiatedIncomingTransfers: true,
        autoApproveAllIncomingTransfers: false,
        incomingApprovals: [{
          approvalId: 'default-incoming',
          fromListId: 'All',
          toListId: 'All',
          initiatedByListId: 'All',
          tokenIds: fullRange(),
          transferTimes: fullRange(),
          ownershipTimes: fullRange(),
          approvalCriteria: {}
        }],
        outgoingApprovals: [{
          approvalId: 'default-outgoing',
          fromListId: 'All',
          toListId: 'All',
          initiatedByListId: 'All',
          tokenIds: fullRange(),
          transferTimes: fullRange(),
          ownershipTimes: fullRange(),
          approvalCriteria: {}
        }]
      }
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Default Balances');
    expect(result).toContain('5 tokens');
    expect(result).toContain('Default Incoming Approvals');
    expect(result).toContain('default-incoming');
    expect(result).toContain('Default Outgoing Approvals');
    expect(result).toContain('default-outgoing');
  });

  // -------------------------------------------------------------------------
  // Test: MsgTransferTokens in multi-message transaction
  // -------------------------------------------------------------------------
  it('should describe additional MsgTransferTokens', () => {
    const txBody = {
      creator: 'bb1transfer',
      manager: 'bb1transfer',
      collectionMetadata: { metadata: { name: 'Transfer Test' } },
      validTokenIds: [{ start: '1', end: '10' }],
      standards: [],
      collectionApprovals: [],
      collectionPermissions: {}
    };
    const messages = [
      { typeUrl: '/bitbadges.MsgUniversalUpdateCollection', value: txBody },
      {
        typeUrl: '/bitbadges.MsgTransferTokens',
        value: {
          from: 'bb1sender',
          transfers: [{
            to: 'bb1recipient',
            balances: [{ amount: '5', tokenIds: [{ start: '1', end: '3' }] }]
          }]
        }
      }
    ];
    const result = interpretTransaction(txBody, false, [], messages);
    expect(result).toContain('## Token Transfers');
    expect(result).toContain('bb1sender');
    expect(result).toContain('bb1recipient');
    expect(result).toContain('5 token(s)');
  });

  // -------------------------------------------------------------------------
  // Test: coinTransfers.overrideToWithInitiator
  // -------------------------------------------------------------------------
  it('should describe overrideToWithInitiator on coinTransfers', () => {
    const txBody = {
      creator: 'bb1pay',
      manager: 'bb1pay',
      collectionMetadata: { metadata: { name: 'Payment Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'paid-mint',
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          coinTransfers: [{
            coins: [{ denom: 'ubadge', amount: '1000000' }],
            overrideToWithInitiator: true
          }]
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Payment is sent to the transfer initiator');
  });

  // -------------------------------------------------------------------------
  // Test: autoDeletionOptions
  // -------------------------------------------------------------------------
  it('should describe auto-deletion', () => {
    const txBody = {
      creator: 'bb1auto',
      manager: 'bb1auto',
      collectionMetadata: { metadata: { name: 'Auto-Delete Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'one-time',
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          autoDeletionOptions: { afterOneUse: true }
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Auto-Deletion');
  });

  // -------------------------------------------------------------------------
  // Test: soulbound (no transfer approvals but has mint approvals)
  // -------------------------------------------------------------------------
  it('should detect soulbound when only mint approvals exist', () => {
    const txBody = {
      creator: 'bb1soul',
      manager: 'bb1soul',
      collectionMetadata: { metadata: { name: 'Soulbound Credential' } },
      validTokenIds: [{ start: '1', end: '100' }],
      standards: ['Non-Transferable'],
      collectionApprovals: [{
        approvalId: 'mint-only',
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: 'bb1soul',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {}
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('non-transferable (soulbound)');
    expect(result).toContain('How Tokens Are Created');
    expect(result).toContain('mint-only');
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

    // Should include sections 1, 3 (because updateInvariants includes backing), 4, 6, 8, 9
    expect(result).toContain('## Transaction Summary');
    expect(result).toContain('## Key Reference Information');
    expect(result).toContain('## Permissions -- What Can Change Later');
    expect(result).toContain('## Default Balances & Auto-Approve Settings');
    expect(result).toContain('## Invariants');
    expect(result).toContain('## Token Backing & Cross-Chain');

    // Should NOT include sections 2, 5, 7
    expect(result).not.toContain('## Collection Overview');
    expect(result).not.toContain('## Standards');
    expect(result).not.toContain('## How Tokens Are Created');
    expect(result).not.toContain('## Transfer & Approval Rules');
  });

  // -------------------------------------------------------------------------
  // Test: mustPrioritize flag on approval
  // -------------------------------------------------------------------------
  it('should describe mustPrioritize on an approval', () => {
    const txBody = {
      creator: 'bb1prio',
      manager: 'bb1prio',
      collectionMetadata: { metadata: { name: 'Priority Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'special-transfer',
        fromListId: '!Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          mustPrioritize: true
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Must Be Explicitly Selected');
    expect(result).toContain('explicitly selects it');
  });

  // -------------------------------------------------------------------------
  // Test: allowSpecialWrapping flag
  // -------------------------------------------------------------------------
  it('should describe allowSpecialWrapping on an approval', () => {
    const txBody = {
      creator: 'bb1wrap',
      manager: 'bb1wrap',
      collectionMetadata: { metadata: { name: 'Wrapping Collection' } },
      validTokenIds: fullRange(),
      standards: [],
      collectionApprovals: [{
        approvalId: 'wrap-unwrap',
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          allowSpecialWrapping: true
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Coin Wrapping');
    expect(result).toContain('converted between');
  });

  // -------------------------------------------------------------------------
  // Test: mustOwnTokens (token gating)
  // -------------------------------------------------------------------------
  it('should describe mustOwnTokens requirements', () => {
    const txBody = {
      creator: 'bb1gate',
      manager: 'bb1gate',
      collectionMetadata: { metadata: { name: 'Gated Collection' } },
      validTokenIds: [{ start: '1', end: '10' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'gated-mint',
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          mustOwnTokens: [{
            collectionId: '42',
            amountRange: { start: '1', end: '0' },
            tokenIds: [{ start: '1', end: '5' }],
            ownershipTimes: fullRange(),
            overrideWithCurrentTime: true,
            mustSatisfyForAllAssets: false
          }]
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Ownership Requirements');
    expect(result).toContain('collection 42');
    expect(result).toContain('#1-#5');
    expect(result).toContain('membership or access check');
  });

  // -------------------------------------------------------------------------
  // Test: reset intervals on limits
  // -------------------------------------------------------------------------
  it('should describe reset intervals on approval limits', () => {
    const txBody = {
      creator: 'bb1reset',
      manager: 'bb1reset',
      collectionMetadata: { metadata: { name: 'Reset Collection' } },
      validTokenIds: [{ start: '1', end: '100' }],
      standards: [],
      collectionApprovals: [{
        approvalId: 'recurring-mint',
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        tokenIds: fullRange(),
        transferTimes: fullRange(),
        ownershipTimes: fullRange(),
        approvalCriteria: {
          approvalAmounts: {
            overallApprovalAmount: '0',
            perInitiatedByAddressApprovalAmount: '5',
            perFromAddressApprovalAmount: '0',
            perToAddressApprovalAmount: '0',
            resetTimeIntervals: {
              intervalLength: '604800000'
            }
          },
          maxNumTransfers: {
            overallMaxNumTransfers: '0',
            perInitiatedByAddressMaxNumTransfers: '0',
            perFromAddressMaxNumTransfers: '0',
            perToAddressMaxNumTransfers: '0'
          }
        }
      }],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('reset every 7 days');
    expect(result).toContain('per-user limit of 5');
  });

  // -------------------------------------------------------------------------
  // Test: per-token metadata
  // -------------------------------------------------------------------------
  it('should describe per-token metadata', () => {
    const txBody = {
      creator: 'bb1meta',
      manager: 'bb1meta',
      collectionMetadata: { metadata: { name: 'Multi-Token Collection' } },
      validTokenIds: [{ start: '1', end: '3' }],
      standards: ['NFTs'],
      tokenMetadata: [
        {
          tokenIds: [{ start: '1', end: '1' }],
          metadata: { metadata: { name: 'Gold Badge', description: 'The top tier badge' } }
        },
        {
          tokenIds: [{ start: '2', end: '3' }],
          metadata: { metadata: { name: 'Silver Badge' } }
        }
      ],
      collectionApprovals: [],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Per-Token Metadata');
    expect(result).toContain('Gold Badge');
    expect(result).toContain('The top tier badge');
    expect(result).toContain('Silver Badge');
  });

  // -------------------------------------------------------------------------
  // Test: custom data and archived status
  // -------------------------------------------------------------------------
  it('should describe custom data and archived status', () => {
    const txBody = {
      creator: 'bb1custom',
      manager: 'bb1custom',
      collectionMetadata: { metadata: { name: 'Custom Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      customData: 'some-custom-json-data',
      isArchived: true,
      collectionApprovals: [],
      collectionPermissions: {}
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('Custom Data');
    expect(result).toContain('some-custom-json-data');
    expect(result).toContain('ARCHIVED');
  });

  // -------------------------------------------------------------------------
  // Test: user permissions in default balances
  // -------------------------------------------------------------------------
  it('should describe user permissions in default balances', () => {
    const txBody = {
      creator: 'bb1userperm',
      manager: 'bb1userperm',
      collectionMetadata: { metadata: { name: 'User Perms Collection' } },
      validTokenIds: [{ start: '1', end: '1' }],
      standards: [],
      collectionApprovals: [],
      collectionPermissions: {},
      defaultBalances: {
        balances: [],
        autoApproveSelfInitiatedOutgoingTransfers: true,
        autoApproveSelfInitiatedIncomingTransfers: true,
        autoApproveAllIncomingTransfers: false,
        userPermissions: {
          canUpdateIncomingApprovals: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }],
          canUpdateOutgoingApprovals: [{ permanentlyForbiddenTimes: fullRange(), permanentlyPermittedTimes: [] }]
        }
      }
    };
    const result = interpretTransaction(txBody);
    expect(result).toContain('User Permissions');
    expect(result).toContain('Update incoming approvals: locked');
    expect(result).toContain('Update outgoing approvals: locked');
  });

  // -------------------------------------------------------------------------
  // Test: malformed input does not crash
  // -------------------------------------------------------------------------
  it('should handle malformed input without crashing', () => {
    const txBody = {
      creator: 'bb1bad',
      collectionMetadata: { metadata: { name: 'Bad Collection' } },
      invariants: {
        maxSupplyPerId: { notANumber: true }
      },
      collectionApprovals: 'not-an-array',
      validTokenIds: 'also-not-an-array'
    };
    // Should not throw
    expect(() => interpretTransaction(txBody)).not.toThrow();
    const result = interpretTransaction(txBody);
    expect(result).toContain('Transaction Summary');
  });
});
