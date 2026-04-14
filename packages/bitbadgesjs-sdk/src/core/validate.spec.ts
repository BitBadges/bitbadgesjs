/**
 * Tests for validate.ts — transaction validation utilities.
 *
 * Covers: isValidListId, checkNumbersAreStrings, checkUintRangeFormat,
 * findAndValidateUintRanges, validateOrderCalculationMethod, validateApprovals,
 * validateTokenMetadata, validatePermissions, validateApprovalCriteria,
 * validateMsgConstructorFields, validateTransaction
 */

import {
  isValidListId,
  checkNumbersAreStrings,
  checkUintRangeFormat,
  findAndValidateUintRanges,
  validateOrderCalculationMethod,
  validateApprovals,
  validateTokenMetadata,
  validatePermissions,
  validateApprovalCriteria,
  validateMsgConstructorFields,
  validateTransaction,
  validateSubscriptionApproval,
  type ValidationIssue
} from './validate.js';

// ---------------------------------------------------------------------------
// isValidListId
// ---------------------------------------------------------------------------

describe('isValidListId', () => {
  it('accepts "All"', () => {
    expect(isValidListId('All')).toBe(true);
  });

  it('accepts "Mint"', () => {
    expect(isValidListId('Mint')).toBe(true);
  });

  it('accepts "!Mint"', () => {
    expect(isValidListId('!Mint')).toBe(true);
  });

  it('accepts "AllWithMint"', () => {
    expect(isValidListId('AllWithMint')).toBe(true);
  });

  it('rejects garbage string', () => {
    expect(isValidListId('not-a-valid-list')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidListId('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkNumbersAreStrings
// ---------------------------------------------------------------------------

describe('checkNumbersAreStrings', () => {
  it('no issues for null/undefined', () => {
    const issues: ValidationIssue[] = [];
    checkNumbersAreStrings(null, 'root', issues);
    checkNumbersAreStrings(undefined, 'root', issues);
    expect(issues).toHaveLength(0);
  });

  it('flags a bare number', () => {
    const issues: ValidationIssue[] = [];
    checkNumbersAreStrings(42, 'root', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].message).toContain('"42"');
  });

  it('no issues for string values', () => {
    const issues: ValidationIssue[] = [];
    checkNumbersAreStrings({ amount: '100', name: 'test' }, 'root', issues);
    expect(issues).toHaveLength(0);
  });

  it('flags nested number in object', () => {
    const issues: ValidationIssue[] = [];
    checkNumbersAreStrings({ outer: { inner: 7 } }, 'root', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].path).toBe('root.outer.inner');
  });

  it('flags number inside array', () => {
    const issues: ValidationIssue[] = [];
    checkNumbersAreStrings([1, '2', 3], 'arr', issues);
    expect(issues).toHaveLength(2);
    expect(issues[0].path).toBe('arr[0]');
    expect(issues[1].path).toBe('arr[2]');
  });

  it('skips claimConfig subtrees', () => {
    const issues: ValidationIssue[] = [];
    checkNumbersAreStrings({ claimConfig: { maxUses: 100 } }, 'root', issues);
    expect(issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// checkUintRangeFormat
// ---------------------------------------------------------------------------

describe('checkUintRangeFormat', () => {
  it('no issues for null', () => {
    const issues: ValidationIssue[] = [];
    checkUintRangeFormat(null, 'path', issues);
    expect(issues).toHaveLength(0);
  });

  it('no issues for valid range', () => {
    const issues: ValidationIssue[] = [];
    checkUintRangeFormat({ start: '1', end: '10' }, 'range', issues);
    expect(issues).toHaveLength(0);
  });

  it('flags missing start', () => {
    const issues: ValidationIssue[] = [];
    checkUintRangeFormat({ end: '10' }, 'range', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('missing "start"');
  });

  it('flags missing end', () => {
    const issues: ValidationIssue[] = [];
    checkUintRangeFormat({ start: '1' }, 'range', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('missing "end"');
  });

  it('flags non-string start', () => {
    const issues: ValidationIssue[] = [];
    checkUintRangeFormat({ start: 1, end: '10' }, 'range', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('"start" must be a string');
  });

  it('flags non-string end', () => {
    const issues: ValidationIssue[] = [];
    checkUintRangeFormat({ start: '1', end: 10 }, 'range', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('"end" must be a string');
  });

  it('ignores objects without start or end', () => {
    const issues: ValidationIssue[] = [];
    checkUintRangeFormat({ foo: 'bar' }, 'path', issues);
    expect(issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// findAndValidateUintRanges
// ---------------------------------------------------------------------------

describe('findAndValidateUintRanges', () => {
  it('finds nested invalid range', () => {
    const issues: ValidationIssue[] = [];
    findAndValidateUintRanges({ tokenIds: [{ start: 1, end: '5' }] }, 'root', issues);
    expect(issues.length).toBeGreaterThan(0);
    // Should flag the non-string start
    expect(issues.some((i) => i.message.includes('"start" must be a string'))).toBe(true);
  });

  it('skips claimConfig subtrees', () => {
    const issues: ValidationIssue[] = [];
    findAndValidateUintRanges({ claimConfig: { range: { start: 1, end: 2 } } }, 'root', issues);
    expect(issues).toHaveLength(0);
  });

  it('no issues for primitives', () => {
    const issues: ValidationIssue[] = [];
    findAndValidateUintRanges('hello', 'root', issues);
    findAndValidateUintRanges(null, 'root', issues);
    expect(issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateOrderCalculationMethod
// ---------------------------------------------------------------------------

describe('validateOrderCalculationMethod', () => {
  it('no issues for exactly one true', () => {
    const issues: ValidationIssue[] = [];
    validateOrderCalculationMethod({ useOverallNumTransfers: true }, 'path', issues);
    expect(issues).toHaveLength(0);
  });

  it('error for multiple true', () => {
    const issues: ValidationIssue[] = [];
    validateOrderCalculationMethod(
      { useOverallNumTransfers: true, usePerToAddressNumTransfers: true },
      'path',
      issues
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].message).toContain('exactly ONE');
  });

  it('warning for zero true', () => {
    const issues: ValidationIssue[] = [];
    validateOrderCalculationMethod({}, 'path', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
  });
});

// ---------------------------------------------------------------------------
// validateSubscriptionApproval
// ---------------------------------------------------------------------------

describe('validateSubscriptionApproval', () => {
  it('no issues when no approvalCriteria', () => {
    const issues: ValidationIssue[] = [];
    validateSubscriptionApproval({}, 'path', issues);
    expect(issues).toHaveLength(0);
  });

  it('warns on overrideFromWithApproverAddress: true', () => {
    const issues: ValidationIssue[] = [];
    validateSubscriptionApproval(
      {
        approvalCriteria: {
          coinTransfers: [{ overrideFromWithApproverAddress: true }]
        }
      },
      'path',
      issues
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('overrideFromWithApproverAddress');
  });

  it('warns on overrideToWithInitiator: true', () => {
    const issues: ValidationIssue[] = [];
    validateSubscriptionApproval(
      {
        approvalCriteria: {
          coinTransfers: [{ overrideToWithInitiator: true }]
        }
      },
      'path',
      issues
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('overrideToWithInitiator');
  });

  it('warns on durationFromTimestamp being 0', () => {
    const issues: ValidationIssue[] = [];
    validateSubscriptionApproval(
      {
        approvalCriteria: {
          predeterminedBalances: {
            incrementedBalances: { durationFromTimestamp: '0' }
          }
        }
      },
      'path',
      issues
    );
    expect(issues.some((i) => i.message.includes('durationFromTimestamp'))).toBe(true);
  });

  it('warns when allowOverrideTimestamp is not true', () => {
    const issues: ValidationIssue[] = [];
    validateSubscriptionApproval(
      {
        approvalCriteria: {
          predeterminedBalances: {
            incrementedBalances: { durationFromTimestamp: '1000', allowOverrideTimestamp: false }
          }
        }
      },
      'path',
      issues
    );
    expect(issues.some((i) => i.message.includes('allowOverrideTimestamp'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateApprovals
// ---------------------------------------------------------------------------

describe('validateApprovals', () => {
  it('flags invalid list ID', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals(
      [{ fromListId: 'bogus-id', toListId: 'All', initiatedByListId: 'All', approvalId: 'a1' }],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('Invalid list ID'))).toBe(true);
  });

  it('flags Mint in toListId', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals(
      [{ fromListId: 'All', toListId: 'Mint', initiatedByListId: 'All', approvalId: 'a1' }],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('toListId cannot be "Mint"'))).toBe(true);
  });

  it('flags Mint in initiatedByListId', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals(
      [{ fromListId: 'All', toListId: 'All', initiatedByListId: 'Mint', approvalId: 'a1' }],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('initiatedByListId cannot be "Mint"'))).toBe(true);
  });

  it('flags Mint approval without overridesFromOutgoingApprovals', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals(
      [
        {
          fromListId: 'Mint',
          toListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'mint-1',
          approvalCriteria: { overridesFromOutgoingApprovals: false }
        }
      ],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('overridesFromOutgoingApprovals: true'))).toBe(true);
  });

  it('no issues for valid Mint approval', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals(
      [
        {
          fromListId: 'Mint',
          toListId: 'All',
          initiatedByListId: 'All',
          approvalId: 'mint-1',
          approvalCriteria: { overridesFromOutgoingApprovals: true }
        }
      ],
      'approvals',
      issues
    );
    // No errors about overrides
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('flags missing approvalId', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals([{ fromListId: 'All', toListId: 'All', initiatedByListId: 'All' }], 'approvals', issues);
    expect(issues.some((i) => i.message.includes('approvalId'))).toBe(true);
  });

  it('skips non-object entries', () => {
    const issues: ValidationIssue[] = [];
    validateApprovals([null, undefined, 'string'], 'approvals', issues);
    expect(issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateTokenMetadata
// ---------------------------------------------------------------------------

describe('validateTokenMetadata', () => {
  it('flags entry without tokenIds', () => {
    const issues: ValidationIssue[] = [];
    validateTokenMetadata([{ uri: 'https://example.com' }], 'meta', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('tokenIds');
  });

  it('flags entry with empty tokenIds array', () => {
    const issues: ValidationIssue[] = [];
    validateTokenMetadata([{ tokenIds: [] }], 'meta', issues);
    expect(issues).toHaveLength(1);
  });

  it('no issues for valid entry', () => {
    const issues: ValidationIssue[] = [];
    validateTokenMetadata([{ tokenIds: [{ start: '1', end: '10' }] }], 'meta', issues);
    expect(issues).toHaveLength(0);
  });

  it('skips null entries', () => {
    const issues: ValidationIssue[] = [];
    validateTokenMetadata([null], 'meta', issues);
    expect(issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validatePermissions
// ---------------------------------------------------------------------------

describe('validatePermissions', () => {
  const allPermFields = () => ({
    canDeleteCollection: [],
    canArchiveCollection: [],
    canUpdateStandards: [],
    canUpdateCustomData: [],
    canUpdateManager: [],
    canUpdateCollectionMetadata: [],
    canUpdateValidTokenIds: [],
    canUpdateTokenMetadata: [],
    canUpdateCollectionApprovals: [],
    canAddMoreAliasPaths: [],
    canAddMoreCosmosCoinWrapperPaths: []
  });

  it('no issues for complete permission object', () => {
    const issues: ValidationIssue[] = [];
    validatePermissions(allPermFields(), 'perms', issues);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('flags missing required fields', () => {
    const issues: ValidationIssue[] = [];
    validatePermissions({}, 'perms', issues);
    // Should flag all 11 missing fields
    expect(issues.filter((i) => i.severity === 'error').length).toBe(11);
  });

  it('flags non-array permission field', () => {
    const issues: ValidationIssue[] = [];
    const perms = { ...allPermFields(), canDeleteCollection: 'not-an-array' };
    validatePermissions(perms, 'perms', issues);
    expect(issues.some((i) => i.message.includes('must be an array'))).toBe(true);
  });

  it('passthrough for null/undefined', () => {
    const issues: ValidationIssue[] = [];
    validatePermissions(null, 'perms', issues);
    validatePermissions(undefined, 'perms', issues);
    expect(issues).toHaveLength(0);
  });

  it('warns on both-empty time arrays', () => {
    const issues: ValidationIssue[] = [];
    const perms = {
      ...allPermFields(),
      canDeleteCollection: [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [] }]
    };
    validatePermissions(perms, 'perms', issues);
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('both time arrays empty'))).toBe(true);
  });

  it('flags canUpdateTokenMetadata entry missing tokenIds when times are set', () => {
    const issues: ValidationIssue[] = [];
    const perms = {
      ...allPermFields(),
      canUpdateTokenMetadata: [
        {
          permanentlyPermittedTimes: [{ start: '1', end: '100' }],
          permanentlyForbiddenTimes: []
        }
      ]
    };
    validatePermissions(perms, 'perms', issues);
    expect(issues.some((i) => i.message.includes('MUST include tokenIds'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateApprovalCriteria
// ---------------------------------------------------------------------------

describe('validateApprovalCriteria', () => {
  it('no issues for empty array', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria([], 'approvals', issues);
    expect(issues).toHaveLength(0);
  });

  it('flags more than 1 merkleChallenge', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria(
      [{ approvalCriteria: { merkleChallenges: [{}, {}] } }],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('at most 1 merkleChallenge'))).toBe(true);
  });

  it('flags missing numUses plugin in claim', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria(
      [
        {
          approvalCriteria: {
            merkleChallenges: [
              {
                claimConfig: {
                  plugins: [{ pluginId: 'codes', publicParams: {} }]
                }
              }
            ]
          }
        }
      ],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('numUses plugin'))).toBe(true);
  });

  it('flags numUses maxUses exceeding 50000', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria(
      [
        {
          approvalCriteria: {
            merkleChallenges: [
              {
                claimConfig: {
                  plugins: [{ pluginId: 'numUses', publicParams: { maxUses: 100000 } }]
                }
              }
            ]
          }
        }
      ],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('exceeds 50,000'))).toBe(true);
  });

  it('flags codes numCodes exceeding 50000', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria(
      [
        {
          approvalCriteria: {
            merkleChallenges: [
              {
                claimConfig: {
                  plugins: [
                    { pluginId: 'numUses', publicParams: { maxUses: 100 } },
                    { pluginId: 'codes', publicParams: { numCodes: 60000 } }
                  ]
                }
              }
            ]
          }
        }
      ],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('codes numCodes'))).toBe(true);
  });

  it('warns when off-chain maxUses exceeds on-chain overallMaxNumTransfers', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria(
      [
        {
          approvalCriteria: {
            merkleChallenges: [
              {
                claimConfig: {
                  plugins: [{ pluginId: 'numUses', publicParams: { maxUses: 500 } }]
                }
              }
            ],
            maxNumTransfers: { overallMaxNumTransfers: '100' }
          }
        }
      ],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('exceeds on-chain'))).toBe(true);
  });

  it('warns when overallMaxNumTransfers is 0 but maxUses is set', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria(
      [
        {
          approvalCriteria: {
            merkleChallenges: [
              {
                claimConfig: {
                  plugins: [{ pluginId: 'numUses', publicParams: { maxUses: 10 } }]
                }
              }
            ],
            maxNumTransfers: { overallMaxNumTransfers: '0' }
          }
        }
      ],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('overallMaxNumTransfers is unset or "0"'))).toBe(true);
  });

  it('flags duplicate approvalIds', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria(
      [
        { approvalId: 'dup', approvalCriteria: {} },
        { approvalId: 'dup', approvalCriteria: {} }
      ],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('Duplicate approval IDs'))).toBe(true);
  });

  it('warns when both predeterminedBalances and approvalAmounts are set', () => {
    const issues: ValidationIssue[] = [];
    validateApprovalCriteria(
      [
        {
          approvalCriteria: {
            predeterminedBalances: {
              incrementedBalances: { startBalances: [{ amount: '1' }] }
            },
            approvalAmounts: { overallApprovalAmount: '100' }
          }
        }
      ],
      'approvals',
      issues
    );
    expect(issues.some((i) => i.message.includes('both predeterminedBalances and approvalAmounts'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateMsgConstructorFields
// ---------------------------------------------------------------------------

describe('validateMsgConstructorFields', () => {
  it('flags non-array top-level field', () => {
    const issues: ValidationIssue[] = [];
    validateMsgConstructorFields({ validTokenIds: 'not-array' }, 'msg', issues);
    expect(issues.some((i) => i.message.includes('"validTokenIds" must be an array'))).toBe(true);
  });

  it('flags missing collectionPermissions when updateCollectionPermissions is true', () => {
    const issues: ValidationIssue[] = [];
    validateMsgConstructorFields({ updateCollectionPermissions: true }, 'msg', issues);
    expect(issues.some((i) => i.message.includes('collectionPermissions must be an object'))).toBe(true);
  });

  it('flags missing collectionMetadata when updateCollectionMetadata is true', () => {
    const issues: ValidationIssue[] = [];
    validateMsgConstructorFields({ updateCollectionMetadata: true }, 'msg', issues);
    expect(issues.some((i) => i.message.includes('collectionMetadata must be an object'))).toBe(true);
  });

  it('flags missing defaultBalances fields', () => {
    const issues: ValidationIssue[] = [];
    validateMsgConstructorFields({ defaultBalances: {} }, 'msg', issues);
    // Should flag balances, outgoingApprovals, incomingApprovals, userPermissions
    expect(issues.filter((i) => i.severity === 'error').length).toBeGreaterThanOrEqual(4);
  });

  it('flags missing userPermissions sub-fields', () => {
    const issues: ValidationIssue[] = [];
    validateMsgConstructorFields(
      {
        defaultBalances: {
          balances: [],
          outgoingApprovals: [],
          incomingApprovals: [],
          userPermissions: {}
        }
      },
      'msg',
      issues
    );
    // Should flag all 5 user permission fields
    expect(issues.filter((i) => i.message.includes('userPermissions.')).length).toBe(5);
  });

  it('flags collectionApprovals missing required fields', () => {
    const issues: ValidationIssue[] = [];
    validateMsgConstructorFields({ collectionApprovals: [{}] }, 'msg', issues);
    // Should flag fromListId, toListId, initiatedByListId, approvalId, tokenIds, transferTimes, ownershipTimes, version
    expect(issues.filter((i) => i.message.includes('missing required field')).length).toBe(8);
  });

  it('flags tokenMetadata entries without tokenIds', () => {
    const issues: ValidationIssue[] = [];
    validateMsgConstructorFields({ tokenMetadata: [{ uri: 'https://x.com' }] }, 'msg', issues);
    expect(issues.some((i) => i.message.includes('tokenIds'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTransaction (main orchestrator)
// ---------------------------------------------------------------------------

describe('validateTransaction', () => {
  it('returns error for non-object input', () => {
    const result = validateTransaction(null);
    expect(result.valid).toBe(false);
    expect(result.issues[0].message).toContain('must be a JSON object');
  });

  it('returns error for missing messages array', () => {
    const result = validateTransaction({});
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('"messages" array'))).toBe(true);
  });

  it('returns valid for minimal valid transaction', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgTransferTokens',
          value: {
            creator: 'bb1abc',
            transfers: [{ prioritizedApprovals: [] }]
          }
        }
      ]
    });
    expect(result.valid).toBe(true);
  });

  it('flags message missing typeUrl', () => {
    const result = validateTransaction({ messages: [{ value: {} }] });
    expect(result.issues.some((i) => i.message.includes('typeUrl'))).toBe(true);
  });

  it('flags message missing value', () => {
    const result = validateTransaction({ messages: [{ typeUrl: '/tokenization.MsgTransferTokens' }] });
    expect(result.issues.some((i) => i.message.includes('missing "value"'))).toBe(true);
  });

  it('flags MsgTransferTokens missing creator', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgTransferTokens',
          value: { transfers: [] }
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('MsgTransferTokens missing "creator"'))).toBe(true);
  });

  it('flags MsgTransferTokens missing transfers', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgTransferTokens',
          value: { creator: 'bb1abc' }
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('missing "transfers"'))).toBe(true);
  });

  it('warns when transfer missing prioritizedApprovals', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgTransferTokens',
          value: { creator: 'bb1abc', transfers: [{}] }
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('prioritizedApprovals'))).toBe(true);
  });

  it('flags MsgUniversalUpdateCollection missing creator', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgUniversalUpdateCollection',
          value: {}
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('missing "creator"'))).toBe(true);
  });

  it('warns on non-bb1 creator address', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgUniversalUpdateCollection',
          value: { creator: '0x1234', collectionId: '0' }
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('should start with "bb1"'))).toBe(true);
  });

  it('flags missing collectionId', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgUniversalUpdateCollection',
          value: { creator: 'bb1abc' }
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('missing "collectionId"'))).toBe(true);
  });

  it('flags mintEscrowCoinsToTransfer > 1 entry', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgUniversalUpdateCollection',
          value: {
            creator: 'bb1abc',
            collectionId: '1',
            mintEscrowCoinsToTransfer: [{ denom: 'ubadge', amount: '1' }, { denom: 'ustake', amount: '2' }]
          }
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('at most 1 coin entry'))).toBe(true);
  });

  it('flags new mint collection without autoApproveAllIncomingTransfers', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgUniversalUpdateCollection',
          value: {
            creator: 'bb1abc',
            collectionId: '0',
            collectionApprovals: [
              {
                fromListId: 'Mint',
                toListId: 'All',
                initiatedByListId: 'All',
                approvalId: 'mint-1',
                tokenIds: [{ start: '1', end: '1' }],
                transferTimes: [{ start: '1', end: '18446744073709551615' }],
                ownershipTimes: [{ start: '1', end: '18446744073709551615' }],
                version: '0',
                approvalCriteria: { overridesFromOutgoingApprovals: true }
              }
            ],
            defaultBalances: {
              balances: [],
              outgoingApprovals: [],
              incomingApprovals: [],
              autoApproveAllIncomingTransfers: false,
              userPermissions: {
                canUpdateOutgoingApprovals: [],
                canUpdateIncomingApprovals: [],
                canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
                canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
                canUpdateAutoApproveAllIncomingTransfers: []
              }
            }
          }
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('autoApproveAllIncomingTransfers is not true'))).toBe(true);
  });

  it('flags numbers used where strings expected (recursive)', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgUniversalUpdateCollection',
          value: {
            creator: 'bb1abc',
            collectionId: 0 // number instead of string
          }
        }
      ]
    });
    expect(result.issues.some((i) => i.message.includes('Number value found where string expected'))).toBe(true);
  });

  it('valid is true when only warnings (no errors)', () => {
    const result = validateTransaction({
      messages: [
        {
          typeUrl: '/tokenization.MsgTransferTokens',
          value: {
            creator: 'bb1abc',
            transfers: [{}] // missing prioritizedApprovals is only a warning
          }
        }
      ]
    });
    // prioritizedApprovals warning shouldn't make valid = false
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
