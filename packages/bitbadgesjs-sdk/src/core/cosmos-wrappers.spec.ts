/**
 * Tests for cosmos-wrappers.ts
 *
 * Covers: isWrapperApproval, isUnwrapperApproval, approvalCriteriaHasNoAdditionalRestrictions,
 * approvalCriteriaHasNoAmountRestrictions, approvalCriteriaUsesPredeterminedBalances,
 * approvalHasApprovalAmounts, approvalHasMaxNumTransfers, isAutoScannable
 */

import { AddressList } from './addressLists.js';
import { CollectionApprovalWithDetails } from './approvals.js';
import { UintRange } from './uintRanges.js';
import { ConversionWithoutDenom, PathMetadata } from './ibc-wrappers.js';
import { CosmosCoinWrapperPath } from './misc.js';
import {
  isWrapperApproval,
  isUnwrapperApproval,
  approvalCriteriaHasNoAdditionalRestrictions,
  approvalCriteriaHasNoAmountRestrictions,
  approvalCriteriaUsesPredeterminedBalances,
  approvalHasApprovalAmounts,
  approvalHasMaxNumTransfers,
  isAutoScannable
} from './cosmos-wrappers.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const WRAPPER_ADDRESS = 'bb1wrapperaddressxxxxxxxxxxxxxxxxxxxxx';

function makePathObj(overrides?: Partial<{ address: string; allowOverride: boolean }>): CosmosCoinWrapperPath<bigint> {
  return new CosmosCoinWrapperPath({
    address: overrides?.address ?? WRAPPER_ADDRESS,
    denom: 'ubadge',
    conversion: new ConversionWithoutDenom({
      sideA: { amount: 1000n },
      sideB: [
        {
          amount: 1n,
          tokenIds: [{ start: 1n, end: 1n }],
          ownershipTimes: [{ start: 1n, end: 100n }]
        }
      ]
    }),
    symbol: 'BADGE',
    denomUnits: [],
    allowOverrideWithAnyValidToken: overrides?.allowOverride ?? false,
    metadata: new PathMetadata({ uri: '', customData: '' })
  });
}

function makeApproval(overrides?: {
  toListId?: string;
  toListAddresses?: string[];
  toListWhitelist?: boolean;
  fromListId?: string;
  fromListAddresses?: string[];
  fromListWhitelist?: boolean;
  tokenIds?: { start: bigint; end: bigint }[];
  ownershipTimes?: { start: bigint; end: bigint }[];
  approvalCriteria?: any;
}): CollectionApprovalWithDetails<bigint> {
  const toListId = overrides?.toListId ?? 'custom-to';
  const fromListId = overrides?.fromListId ?? 'All';

  return new CollectionApprovalWithDetails({
    fromListId,
    toListId,
    initiatedByListId: 'All',
    approvalId: 'test-wrapper-approval',
    fromList: overrides?.fromListAddresses
      ? new AddressList({
          listId: fromListId,
          addresses: overrides.fromListAddresses,
          whitelist: overrides.fromListWhitelist ?? true,
          createdBy: '',
          uri: '',
          customData: ''
        })
      : AddressList.AllAddresses(),
    toList: new AddressList({
      listId: toListId,
      addresses: overrides?.toListAddresses ?? [WRAPPER_ADDRESS],
      whitelist: overrides?.toListWhitelist ?? true,
      createdBy: '',
      uri: '',
      customData: ''
    }),
    initiatedByList: AddressList.AllAddresses(),
    transferTimes: [UintRange.FullRange()],
    tokenIds: overrides?.tokenIds ?? [{ start: 1n, end: 1n }],
    ownershipTimes: overrides?.ownershipTimes ?? [{ start: 1n, end: 100n }],
    version: 0n,
    approvalCriteria: overrides?.approvalCriteria
  });
}

// =============================================
// approvalCriteriaHasNoAdditionalRestrictions
// =============================================

describe('approvalCriteriaHasNoAdditionalRestrictions', () => {
  it('should return true when approvalCriteria is undefined', () => {
    expect(approvalCriteriaHasNoAdditionalRestrictions(undefined)).toBe(true);
  });

  it('should return true when approvalCriteria has no restrictions', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions({
        requireFromEqualsInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        requireToEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        merkleChallenges: [],
        coinTransfers: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: []
      } as any)
    ).toBe(true);
  });

  it('should return false when requireFromEqualsInitiatedBy is true', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions({
        requireFromEqualsInitiatedBy: true,
        requireFromDoesNotEqualInitiatedBy: false,
        requireToEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        merkleChallenges: [],
        coinTransfers: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: []
      } as any)
    ).toBe(false);
  });

  it('should return false when requireToDoesNotEqualInitiatedBy is true', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions({
        requireFromEqualsInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        requireToEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: true,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        merkleChallenges: [],
        coinTransfers: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: []
      } as any)
    ).toBe(false);
  });

  it('should return false when merkleChallenges is non-empty', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions({
        requireFromEqualsInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        requireToEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        merkleChallenges: [{ root: 'abc' }],
        coinTransfers: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: []
      } as any)
    ).toBe(false);
  });

  it('should return false when coinTransfers is non-empty', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions({
        requireFromEqualsInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        requireToEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        merkleChallenges: [],
        coinTransfers: [{ to: 'addr', coins: [] }],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: []
      } as any)
    ).toBe(false);
  });

  it('should return false when mustOwnTokens is non-empty', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions({
        requireFromEqualsInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        requireToEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        merkleChallenges: [],
        coinTransfers: [],
        mustOwnTokens: [{ collectionId: 1n }],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: []
      } as any)
    ).toBe(false);
  });

  it('should return false when overridesFromOutgoingApprovals is true and allowMintOverrides is false', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions(
        {
          requireFromEqualsInitiatedBy: false,
          requireFromDoesNotEqualInitiatedBy: false,
          requireToEqualsInitiatedBy: false,
          requireToDoesNotEqualInitiatedBy: false,
          overridesFromOutgoingApprovals: true,
          overridesToIncomingApprovals: false,
          merkleChallenges: [],
          coinTransfers: [],
          mustOwnTokens: [],
          dynamicStoreChallenges: [],
          ethSignatureChallenges: []
        } as any,
        false,
        false
      )
    ).toBe(false);
  });

  it('should return true when overridesFromOutgoingApprovals is true but allowMintOverrides is true', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions(
        {
          requireFromEqualsInitiatedBy: false,
          requireFromDoesNotEqualInitiatedBy: false,
          requireToEqualsInitiatedBy: false,
          requireToDoesNotEqualInitiatedBy: false,
          overridesFromOutgoingApprovals: true,
          overridesToIncomingApprovals: false,
          merkleChallenges: [],
          coinTransfers: [],
          mustOwnTokens: [],
          dynamicStoreChallenges: [],
          ethSignatureChallenges: []
        } as any,
        true,
        false
      )
    ).toBe(true);
  });

  it('should return true when overridesToIncomingApprovals is true but allowToOverrides is true', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions(
        {
          requireFromEqualsInitiatedBy: false,
          requireFromDoesNotEqualInitiatedBy: false,
          requireToEqualsInitiatedBy: false,
          requireToDoesNotEqualInitiatedBy: false,
          overridesFromOutgoingApprovals: false,
          overridesToIncomingApprovals: true,
          merkleChallenges: [],
          coinTransfers: [],
          mustOwnTokens: [],
          dynamicStoreChallenges: [],
          ethSignatureChallenges: []
        } as any,
        false,
        true
      )
    ).toBe(true);
  });

  it('should return false when ethSignatureChallenges is non-empty', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions({
        requireFromEqualsInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        requireToEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        merkleChallenges: [],
        coinTransfers: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [{ signer: '0x...' }]
      } as any)
    ).toBe(false);
  });

  it('should return false when userRoyalties has non-zero percentage', () => {
    expect(
      approvalCriteriaHasNoAdditionalRestrictions({
        requireFromEqualsInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        requireToEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        merkleChallenges: [],
        coinTransfers: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        userApprovalSettings: { userRoyalties: { percentage: 5n, payoutAddress: 'bb1abc' } }
      } as any)
    ).toBe(false);
  });
});

// =============================================
// approvalHasApprovalAmounts
// =============================================

describe('approvalHasApprovalAmounts', () => {
  it('should return false for undefined', () => {
    expect(approvalHasApprovalAmounts(undefined)).toBe(false);
  });

  it('should return false when all amounts are zero', () => {
    expect(
      approvalHasApprovalAmounts({
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n
      } as any)
    ).toBe(false);
  });

  it('should return true when overallApprovalAmount is non-zero', () => {
    expect(
      approvalHasApprovalAmounts({
        overallApprovalAmount: 100n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n
      } as any)
    ).toBe(true);
  });

  it('should return true when perToAddressApprovalAmount is non-zero', () => {
    expect(
      approvalHasApprovalAmounts({
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 50n,
        perInitiatedByAddressApprovalAmount: 0n
      } as any)
    ).toBe(true);
  });

  it('should return true when perInitiatedByAddressApprovalAmount is non-zero', () => {
    expect(
      approvalHasApprovalAmounts({
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 1n
      } as any)
    ).toBe(true);
  });
});

// =============================================
// approvalHasMaxNumTransfers
// =============================================

describe('approvalHasMaxNumTransfers', () => {
  it('should return false for undefined', () => {
    expect(approvalHasMaxNumTransfers(undefined)).toBe(false);
  });

  it('should return false when all max nums are zero', () => {
    expect(
      approvalHasMaxNumTransfers({
        overallMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perToAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n
      } as any)
    ).toBe(false);
  });

  it('should return true when overallMaxNumTransfers is non-zero', () => {
    expect(
      approvalHasMaxNumTransfers({
        overallMaxNumTransfers: 5n,
        perFromAddressMaxNumTransfers: 0n,
        perToAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n
      } as any)
    ).toBe(true);
  });

  it('should return true when perFromAddressMaxNumTransfers is non-zero', () => {
    expect(
      approvalHasMaxNumTransfers({
        overallMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 1n,
        perToAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n
      } as any)
    ).toBe(true);
  });
});

// =============================================
// approvalCriteriaUsesPredeterminedBalances
// =============================================

describe('approvalCriteriaUsesPredeterminedBalances', () => {
  it('should return false for undefined criteria', () => {
    expect(approvalCriteriaUsesPredeterminedBalances(undefined)).toBe(false);
  });

  it('should return false when predeterminedBalances is undefined', () => {
    expect(approvalCriteriaUsesPredeterminedBalances({} as any)).toBe(false);
  });

  it('should return false when both startBalances and manualBalances are empty', () => {
    expect(
      approvalCriteriaUsesPredeterminedBalances({
        predeterminedBalances: {
          incrementedBalances: { startBalances: [] },
          manualBalances: []
        }
      } as any)
    ).toBe(false);
  });

  it('should return true when startBalances is non-empty', () => {
    expect(
      approvalCriteriaUsesPredeterminedBalances({
        predeterminedBalances: {
          incrementedBalances: { startBalances: [{ amount: 1n }] },
          manualBalances: []
        }
      } as any)
    ).toBe(true);
  });

  it('should return true when manualBalances is non-empty', () => {
    expect(
      approvalCriteriaUsesPredeterminedBalances({
        predeterminedBalances: {
          incrementedBalances: { startBalances: [] },
          manualBalances: [{ balances: [] }]
        }
      } as any)
    ).toBe(true);
  });
});

// =============================================
// approvalCriteriaHasNoAmountRestrictions
// =============================================

describe('approvalCriteriaHasNoAmountRestrictions', () => {
  it('should return true for undefined criteria', () => {
    expect(approvalCriteriaHasNoAmountRestrictions(undefined)).toBe(true);
  });

  it('should return true when no amounts, no max transfers, no predetermined', () => {
    expect(
      approvalCriteriaHasNoAmountRestrictions({
        approvalAmounts: undefined,
        maxNumTransfers: undefined,
        predeterminedBalances: undefined
      } as any)
    ).toBe(true);
  });

  it('should return false when approval amounts are set', () => {
    expect(
      approvalCriteriaHasNoAmountRestrictions({
        approvalAmounts: {
          overallApprovalAmount: 100n,
          perFromAddressApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: 0n
        },
        maxNumTransfers: undefined,
        predeterminedBalances: undefined
      } as any)
    ).toBe(false);
  });

  it('should return false when max num transfers are set', () => {
    expect(
      approvalCriteriaHasNoAmountRestrictions({
        approvalAmounts: undefined,
        maxNumTransfers: {
          overallMaxNumTransfers: 1n,
          perFromAddressMaxNumTransfers: 0n,
          perToAddressMaxNumTransfers: 0n,
          perInitiatedByAddressMaxNumTransfers: 0n
        },
        predeterminedBalances: undefined
      } as any)
    ).toBe(false);
  });

  it('should return false when predetermined balances are set', () => {
    expect(
      approvalCriteriaHasNoAmountRestrictions({
        approvalAmounts: undefined,
        maxNumTransfers: undefined,
        predeterminedBalances: {
          incrementedBalances: { startBalances: [{ amount: 1n }] },
          manualBalances: []
        }
      } as any)
    ).toBe(false);
  });
});

// =============================================
// isAutoScannable
// =============================================

describe('isAutoScannable', () => {
  it('should return true for undefined criteria', () => {
    expect(isAutoScannable(undefined)).toBe(true);
  });

  it('should return true when approval has no side effects', () => {
    expect(
      isAutoScannable({
        mustPrioritize: false,
        coinTransfers: [],
        merkleChallenges: [],
        ethSignatureChallenges: [],
        predeterminedBalances: undefined
      } as any)
    ).toBe(true);
  });

  it('should return false when mustPrioritize is true', () => {
    expect(
      isAutoScannable({
        mustPrioritize: true,
        coinTransfers: [],
        merkleChallenges: [],
        ethSignatureChallenges: []
      } as any)
    ).toBe(false);
  });

  it('should return false when coinTransfers is non-empty', () => {
    expect(
      isAutoScannable({
        mustPrioritize: false,
        coinTransfers: [{ to: 'addr', coins: [] }],
        merkleChallenges: [],
        ethSignatureChallenges: []
      } as any)
    ).toBe(false);
  });

  it('should return false when merkleChallenges is non-empty', () => {
    expect(
      isAutoScannable({
        mustPrioritize: false,
        coinTransfers: [],
        merkleChallenges: [{ root: 'abc' }],
        ethSignatureChallenges: []
      } as any)
    ).toBe(false);
  });

  it('should return false when ethSignatureChallenges is non-empty', () => {
    expect(
      isAutoScannable({
        mustPrioritize: false,
        coinTransfers: [],
        merkleChallenges: [],
        ethSignatureChallenges: [{ signer: '0x...' }]
      } as any)
    ).toBe(false);
  });

  it('should return false when predeterminedBalances has non-nil incremented balances', () => {
    expect(
      isAutoScannable({
        mustPrioritize: false,
        coinTransfers: [],
        merkleChallenges: [],
        ethSignatureChallenges: [],
        predeterminedBalances: {
          incrementedBalances: {
            startBalances: [{ amount: 1n }],
            allowOverrideWithAnyValidToken: false,
            allowOverrideTimestamp: false,
            incrementTokenIdsBy: 0n,
            incrementOwnershipTimesBy: 0n,
            durationFromTimestamp: 0n,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n }
          },
          manualBalances: [],
          orderCalculationMethod: {}
        }
      } as any)
    ).toBe(false);
  });
});

// =============================================
// isWrapperApproval
// =============================================

describe('isWrapperApproval', () => {
  it('should return true for a valid wrapper approval', () => {
    const approval = makeApproval();
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj)).toBe(true);
  });

  it('should return false when sideB has more than 1 balance', () => {
    const pathObj = new CosmosCoinWrapperPath({
      address: WRAPPER_ADDRESS,
      denom: 'ubadge',
      conversion: new ConversionWithoutDenom({
        sideA: { amount: 1000n },
        sideB: [
          { amount: 1n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: 100n }] },
          { amount: 2n, tokenIds: [{ start: 2n, end: 2n }], ownershipTimes: [{ start: 1n, end: 100n }] }
        ]
      }),
      symbol: 'BADGE',
      denomUnits: [],
      allowOverrideWithAnyValidToken: false,
      metadata: new PathMetadata({ uri: '', customData: '' })
    });
    const approval = makeApproval();
    expect(isWrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when toList does not contain wrapper address', () => {
    const approval = makeApproval({
      toListAddresses: ['bb1someotheraddress'],
      toListWhitelist: true
    });
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when tokenIds do not match', () => {
    const approval = makeApproval({
      tokenIds: [{ start: 5n, end: 10n }]
    });
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when ownershipTimes length does not match', () => {
    const approval = makeApproval({
      ownershipTimes: [
        { start: 1n, end: 50n },
        { start: 51n, end: 100n }
      ]
    });
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when ownershipTimes values do not match', () => {
    const approval = makeApproval({
      ownershipTimes: [{ start: 1n, end: 200n }]
    });
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when overridesToIncomingApprovals is true', () => {
    const approval = makeApproval({
      approvalCriteria: { overridesToIncomingApprovals: true }
    });
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when allowSpecialWrapping is false', () => {
    const approval = makeApproval({
      approvalCriteria: { allowSpecialWrapping: false }
    });
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when approval has additional restrictions (merkleChallenges)', () => {
    const approval = makeApproval();
    // Mutate after construction to avoid WithDetails constructor validation
    (approval as any).approvalCriteria = { merkleChallenges: [{ root: 'abc' }], coinTransfers: [], mustOwnTokens: [], dynamicStoreChallenges: [], ethSignatureChallenges: [] };
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should skip path validation when skipPathValidation is true', () => {
    const approval = makeApproval({
      toListAddresses: ['bb1someotheraddress'],
      toListWhitelist: true,
      tokenIds: [{ start: 999n, end: 999n }]
    });
    const pathObj = makePathObj();
    expect(isWrapperApproval(approval, pathObj, { skipPathValidation: true })).toBe(true);
  });

  it('should use validTokenIds when allowOverrideWithAnyValidToken is true', () => {
    const pathObj = makePathObj({ allowOverride: true });
    const approval = makeApproval({
      tokenIds: [{ start: 1n, end: 50n }]
    });
    expect(
      isWrapperApproval(approval, pathObj, { validTokenIds: [{ start: 1n, end: 50n }] })
    ).toBe(true);
  });

  it('should return false when allowOverride is true and validTokenIds do not match', () => {
    const pathObj = makePathObj({ allowOverride: true });
    const approval = makeApproval({
      tokenIds: [{ start: 1n, end: 50n }]
    });
    expect(
      isWrapperApproval(approval, pathObj, { validTokenIds: [{ start: 1n, end: 100n }] })
    ).toBe(false);
  });
});

// =============================================
// isUnwrapperApproval
// =============================================

describe('isUnwrapperApproval', () => {
  it('should return true for a valid unwrapper approval', () => {
    const approval = makeApproval({
      fromListId: 'custom-from',
      fromListAddresses: [WRAPPER_ADDRESS],
      fromListWhitelist: true
    });
    const pathObj = makePathObj();
    expect(isUnwrapperApproval(approval, pathObj)).toBe(true);
  });

  it('should return false when fromList does not contain wrapper address', () => {
    const approval = makeApproval({
      fromListId: 'custom-from',
      fromListAddresses: ['bb1someotheraddress'],
      fromListWhitelist: true
    });
    const pathObj = makePathObj();
    expect(isUnwrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when overridesFromOutgoingApprovals is true', () => {
    const approval = makeApproval({
      fromListId: 'custom-from',
      fromListAddresses: [WRAPPER_ADDRESS],
      fromListWhitelist: true,
      approvalCriteria: { overridesFromOutgoingApprovals: true }
    });
    const pathObj = makePathObj();
    expect(isUnwrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should return false when allowSpecialWrapping is false', () => {
    const approval = makeApproval({
      fromListId: 'custom-from',
      fromListAddresses: [WRAPPER_ADDRESS],
      fromListWhitelist: true,
      approvalCriteria: { allowSpecialWrapping: false }
    });
    const pathObj = makePathObj();
    expect(isUnwrapperApproval(approval, pathObj)).toBe(false);
  });

  it('should skip path validation when skipPathValidation is true', () => {
    const approval = makeApproval({
      fromListId: 'custom-from',
      fromListAddresses: ['bb1someotheraddress'],
      fromListWhitelist: true,
      tokenIds: [{ start: 999n, end: 999n }]
    });
    const pathObj = makePathObj();
    expect(isUnwrapperApproval(approval, pathObj, { skipPathValidation: true })).toBe(true);
  });

  it('should return false when sideB has more than 1 balance (unwrapper)', () => {
    const pathObj = new CosmosCoinWrapperPath({
      address: WRAPPER_ADDRESS,
      denom: 'ubadge',
      conversion: new ConversionWithoutDenom({
        sideA: { amount: 1000n },
        sideB: [
          { amount: 1n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: 100n }] },
          { amount: 2n, tokenIds: [{ start: 2n, end: 2n }], ownershipTimes: [{ start: 1n, end: 100n }] }
        ]
      }),
      symbol: 'BADGE',
      denomUnits: [],
      allowOverrideWithAnyValidToken: false,
      metadata: new PathMetadata({ uri: '', customData: '' })
    });
    const approval = makeApproval({
      fromListId: 'custom-from',
      fromListAddresses: [WRAPPER_ADDRESS],
      fromListWhitelist: true
    });
    expect(isUnwrapperApproval(approval, pathObj)).toBe(false);
  });
});
