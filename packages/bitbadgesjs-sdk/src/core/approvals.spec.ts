import {
  ApprovalCriteria,
  OutgoingApprovalCriteria,
  IncomingApprovalCriteria,
  DynamicStoreChallenge,
  CollectionApproval,
  UserOutgoingApproval,
  UserIncomingApproval,
  PredeterminedBalances,
  ManualBalances,
  IncrementedBalances,
  RecurringOwnershipTimes,
  PredeterminedOrderCalculationMethod,
  ApprovalAmounts,
  ResetTimeIntervals,
  MaxNumTransfers,
  AutoDeletionOptions,
  AddressChecks,
  AltTimeChecks,
  UserRoyalties,
  ClaimCachePolicy,
  ChallengeTrackerIdDetails,
  SatisfyMethod,
  ClaimDetails,
  ChallengeDetails,
  ChallengeInfoDetails,
  ApprovalInfoDetails,
  CollectionApprovalWithDetails,
  UserOutgoingApprovalWithDetails,
  UserIncomingApprovalWithDetails,
  ApprovalCriteriaWithDetails,
  IncomingApprovalCriteriaWithDetails,
  OutgoingApprovalCriteriaWithDetails,
  MerkleChallengeWithDetails,
  getFirstMatchOnlyWithApprovalCriteria,
  validateCollectionApprovalsUpdate,
  expandCollectionApprovals
} from './approvals.js';
import { ETHSignatureChallenge, MerkleChallenge } from './misc.js';
import { BigIntify, Stringify } from '../common/string-numbers.js';
import { AddressList } from './addressLists.js';
import { UintRangeArray } from './uintRanges.js';
import { genTestAddress } from './addressLists.spec.js';

describe('DynamicStoreChallenges', () => {
  it('should create DynamicStoreChallenge instances', () => {
    const challenge = new DynamicStoreChallenge({
      storeId: 123n
    });

    expect(challenge.storeId).toBe(123n);
    expect(challenge.toProto().storeId).toBe('123');
  });

  it('should convert DynamicStoreChallenge between number types', () => {
    const challenge = new DynamicStoreChallenge({
      storeId: 123n
    });

    const converted = challenge.convert(Stringify);
    expect(converted.storeId).toBe('123');
  });

  it('should include dynamicStoreChallenges in ApprovalCriteria', () => {
    const criteria = new ApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    expect(criteria.dynamicStoreChallenges).toHaveLength(2);
    expect(criteria.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(criteria.dynamicStoreChallenges![1].storeId).toBe(2n);
  });

  it('should include dynamicStoreChallenges in OutgoingApprovalCriteria', () => {
    const criteria = new OutgoingApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    expect(criteria.dynamicStoreChallenges).toHaveLength(2);
    expect(criteria.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(criteria.dynamicStoreChallenges![1].storeId).toBe(2n);
  });

  it('should include dynamicStoreChallenges in IncomingApprovalCriteria', () => {
    const criteria = new IncomingApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    expect(criteria.dynamicStoreChallenges).toHaveLength(2);
    expect(criteria.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(criteria.dynamicStoreChallenges![1].storeId).toBe(2n);
  });

  it('should convert approval criteria with dynamicStoreChallenges', () => {
    const criteria = new ApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    const converted = criteria.convert(Stringify);
    expect(converted.dynamicStoreChallenges).toHaveLength(2);
    expect(converted.dynamicStoreChallenges![0].storeId).toBe('1');
    expect(converted.dynamicStoreChallenges![1].storeId).toBe('2');
  });

  it('should cast OutgoingApprovalCriteria to ApprovalCriteria with dynamicStoreChallenges', () => {
    const outgoingCriteria = new OutgoingApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    const casted = outgoingCriteria.castToCollectionApprovalCriteria();
    expect(casted.dynamicStoreChallenges).toHaveLength(2);
    expect(casted.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(casted.dynamicStoreChallenges![1].storeId).toBe(2n);
  });

  it('should cast IncomingApprovalCriteria to ApprovalCriteria with dynamicStoreChallenges', () => {
    const incomingCriteria = new IncomingApprovalCriteria({
      dynamicStoreChallenges: [{ storeId: 1n }, { storeId: 2n }]
    });

    const casted = incomingCriteria.castToCollectionApprovalCriteria();
    expect(casted.dynamicStoreChallenges).toHaveLength(2);
    expect(casted.dynamicStoreChallenges![0].storeId).toBe(1n);
    expect(casted.dynamicStoreChallenges![1].storeId).toBe(2n);
  });
});

describe('ETHSignatureChallenges', () => {
  it('should create ETHSignatureChallenge instances', () => {
    const ethSignatureChallenge = new ETHSignatureChallenge({
      signer: '0x1234567890123456789012345678901234567890',
      challengeTrackerId: 'test-tracker',
      uri: 'https://example.com',
      customData: 'test-data'
    });

    expect(ethSignatureChallenge.signer).toBe('0x1234567890123456789012345678901234567890');
    expect(ethSignatureChallenge.challengeTrackerId).toBe('test-tracker');
    expect(ethSignatureChallenge.uri).toBe('https://example.com');
    expect(ethSignatureChallenge.customData).toBe('test-data');
  });

  it('should convert ETHSignatureChallenge between number types', () => {
    const ethSignatureChallenge = new ETHSignatureChallenge({
      signer: '0x1234567890123456789012345678901234567890',
      challengeTrackerId: 'test-tracker',
      uri: 'https://example.com',
      customData: 'test-data'
    });

    // ETHSignatureChallenge doesn't have number fields, so conversion should be a no-op
    const converted = ethSignatureChallenge.convert(BigIntify);
    expect(converted.signer).toBe('0x1234567890123456789012345678901234567890');
    expect(converted.challengeTrackerId).toBe('test-tracker');
    expect(converted.uri).toBe('https://example.com');
    expect(converted.customData).toBe('test-data');
  });

  it('should include ethSignatureChallenges in ApprovalCriteria', () => {
    const approvalCriteria = new ApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    expect(approvalCriteria.ethSignatureChallenges).toBeDefined();
    expect(approvalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(approvalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should include ethSignatureChallenges in OutgoingApprovalCriteria', () => {
    const outgoingApprovalCriteria = new OutgoingApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    expect(outgoingApprovalCriteria.ethSignatureChallenges).toBeDefined();
    expect(outgoingApprovalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(outgoingApprovalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should include ethSignatureChallenges in IncomingApprovalCriteria', () => {
    const incomingApprovalCriteria = new IncomingApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    expect(incomingApprovalCriteria.ethSignatureChallenges).toBeDefined();
    expect(incomingApprovalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(incomingApprovalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should convert approval criteria with ethSignatureChallenges', () => {
    const approvalCriteria = new ApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    const converted = approvalCriteria.convert(BigIntify);
    expect(converted.ethSignatureChallenges).toBeDefined();
    expect(converted.ethSignatureChallenges?.length).toBe(1);
    expect(converted.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should cast OutgoingApprovalCriteria to ApprovalCriteria with ethSignatureChallenges', () => {
    const outgoingApprovalCriteria = new OutgoingApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    const approvalCriteria = outgoingApprovalCriteria.castToCollectionApprovalCriteria();
    expect(approvalCriteria.ethSignatureChallenges).toBeDefined();
    expect(approvalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(approvalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should cast IncomingApprovalCriteria to ApprovalCriteria with ethSignatureChallenges', () => {
    const incomingApprovalCriteria = new IncomingApprovalCriteria({
      ethSignatureChallenges: [
        new ETHSignatureChallenge({
          signer: '0x1234567890123456789012345678901234567890',
          challengeTrackerId: 'test-tracker',
          uri: 'https://example.com',
          customData: 'test-data'
        })
      ]
    });

    const approvalCriteria = incomingApprovalCriteria.castToCollectionApprovalCriteria();
    expect(approvalCriteria.ethSignatureChallenges).toBeDefined();
    expect(approvalCriteria.ethSignatureChallenges?.length).toBe(1);
    expect(approvalCriteria.ethSignatureChallenges?.[0].signer).toBe('0x1234567890123456789012345678901234567890');
  });
});

/**
 * allowBackedMinting guardrail documentation tests (backlog #0101)
 *
 * These tests document the chain-enforced validation rules for ApprovalCriteria
 * when allowBackedMinting is true. The SDK freely constructs these objects — the
 * guardrails are enforced on-chain at tx submission. Comments describe what the
 * chain will accept or reject.
 *
 * Chain rules (enforced server-side):
 *   - allowBackedMinting: true requires mustPrioritize: true
 *   - Exactly one of fromListId or toListId must be set to the exact backing address
 *     (not "All", not a combined list)
 *   - Backing pattern  : fromListId = backingAddress, toListId = "All"
 *   - Unbacking pattern: fromListId = "!Mint:<backingAddress>", toListId = backingAddress
 *   - Any other combination is rejected by the chain
 */
describe('allowBackedMinting guardrails', () => {
  const backingAddress = 'cosmos1abcdefghijklmnopqrstuvwxyz0123456789ab';

  it('case 1 (INVALID per chain): allowBackedMinting true with mustPrioritize false — chain rejects this', () => {
    // Chain rule: allowBackedMinting requires mustPrioritize to be true.
    // Without mustPrioritize the approval can be bypassed by ordering, so the
    // chain refuses to accept such a transaction.
    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: false
    });

    expect(criteria.allowBackedMinting).toBe(true);
    expect(criteria.mustPrioritize).toBe(false);
    // Document the invalid combination — chain will reject this approval.
  });

  it('case 2 (VALID): backing pattern — fromListId = backingAddress, toListId = "All"', () => {
    // This is the canonical minting (backing) pattern.
    // The backing address mints tokens outward to any recipient.
    // Chain accepts: allowBackedMinting=true, mustPrioritize=true,
    //   fromListId = exact backing address, toListId = "All".
    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: true
    });

    const approval = new CollectionApproval({
      fromListId: backingAddress,
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'backed-minting-approval',
      version: 0n,
      approvalCriteria: criteria
    });

    expect(approval.approvalCriteria?.allowBackedMinting).toBe(true);
    expect(approval.approvalCriteria?.mustPrioritize).toBe(true);
    expect(approval.fromListId).toBe(backingAddress);
    expect(approval.toListId).toBe('All');
    // Chain accepts this combination — backing address sends to anyone.
  });

  it('case 3 (VALID): unbacking pattern — fromListId = "!Mint:<backingAddress>", toListId = backingAddress', () => {
    // This is the canonical redeeming (unbacking) pattern.
    // Any non-Mint address returns tokens to the backing address.
    // Chain accepts: allowBackedMinting=true, mustPrioritize=true,
    //   fromListId = "!Mint:<backingAddress>" (all except Mint + backing), toListId = exact backing address.
    const fromListId = `!Mint:${backingAddress}`;

    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: true
    });

    const approval = new CollectionApproval({
      fromListId: fromListId,
      toListId: backingAddress,
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'backed-unbacking-approval',
      version: 0n,
      approvalCriteria: criteria
    });

    expect(approval.approvalCriteria?.allowBackedMinting).toBe(true);
    expect(approval.approvalCriteria?.mustPrioritize).toBe(true);
    expect(approval.fromListId).toBe(fromListId);
    expect(approval.toListId).toBe(backingAddress);
    // Chain accepts this combination — anyone (except Mint/backing) sends back to backing address.
  });

  it('case 4 (INVALID per chain): fromListId = "All", toListId = "All" — neither is exact backing address', () => {
    // Chain rule: exactly one of fromListId or toListId must equal the exact backing address.
    // When both are "All" the backing address is not identified, so the chain rejects this.
    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: true
    });

    const approval = new CollectionApproval({
      fromListId: 'All',
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'backed-minting-invalid-all',
      version: 0n,
      approvalCriteria: criteria
    });

    expect(approval.approvalCriteria?.allowBackedMinting).toBe(true);
    expect(approval.approvalCriteria?.mustPrioritize).toBe(true);
    expect(approval.fromListId).toBe('All');
    expect(approval.toListId).toBe('All');
    // Document the invalid combination — chain will reject this approval because
    // neither list is pinned to the exact backing address.
  });

  it('case 5 (INVALID per chain): fromListId = backingAddress, toListId = backingAddress — both are backing address', () => {
    // Chain rule: exactly ONE of fromListId/toListId should be the backing address, not both.
    // If both equal the backing address the approval is ambiguous (backing or unbacking?)
    // and the chain rejects it.
    const criteria = new ApprovalCriteria({
      allowBackedMinting: true,
      mustPrioritize: true
    });

    const approval = new CollectionApproval({
      fromListId: backingAddress,
      toListId: backingAddress,
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'backed-minting-invalid-both',
      version: 0n,
      approvalCriteria: criteria
    });

    expect(approval.approvalCriteria?.allowBackedMinting).toBe(true);
    expect(approval.approvalCriteria?.mustPrioritize).toBe(true);
    expect(approval.fromListId).toBe(backingAddress);
    expect(approval.toListId).toBe(backingAddress);
    // Document the invalid combination — chain will reject this approval because
    // both lists are the backing address (ambiguous direction).
  });
});

// ============================================================
// Proto round-trip tests for approval sub-classes
// ============================================================

describe('ResetTimeIntervals', () => {
  it('should round-trip through proto', () => {
    const original = new ResetTimeIntervals({ startTime: 1000n, intervalLength: 3600n });
    const proto = original.toProto();
    const restored = ResetTimeIntervals.fromProto(proto, BigIntify);
    expect(restored.startTime).toBe(1000n);
    expect(restored.intervalLength).toBe(3600n);
  });

  it('should convert number types', () => {
    const original = new ResetTimeIntervals({ startTime: 1000n, intervalLength: 3600n });
    const stringified = original.convert(Stringify);
    expect(stringified.startTime).toBe('1000');
    expect(stringified.intervalLength).toBe('3600');
  });
});

describe('ApprovalAmounts', () => {
  const makeAmounts = () =>
    new ApprovalAmounts({
      overallApprovalAmount: 100n,
      perToAddressApprovalAmount: 10n,
      perFromAddressApprovalAmount: 5n,
      perInitiatedByAddressApprovalAmount: 2n,
      amountTrackerId: 'tracker-1',
      resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
    });

  it('should round-trip through proto', () => {
    const original = makeAmounts();
    const proto = original.toProto();
    const restored = ApprovalAmounts.fromProto(proto, BigIntify);
    expect(restored.overallApprovalAmount).toBe(100n);
    expect(restored.perToAddressApprovalAmount).toBe(10n);
    expect(restored.perFromAddressApprovalAmount).toBe(5n);
    expect(restored.perInitiatedByAddressApprovalAmount).toBe(2n);
    expect(restored.amountTrackerId).toBe('tracker-1');
  });

  it('should convert number types', () => {
    const converted = makeAmounts().convert(Stringify);
    expect(converted.overallApprovalAmount).toBe('100');
  });
});

describe('MaxNumTransfers', () => {
  const makeMax = () =>
    new MaxNumTransfers({
      overallMaxNumTransfers: 50n,
      perToAddressMaxNumTransfers: 5n,
      perFromAddressMaxNumTransfers: 3n,
      perInitiatedByAddressMaxNumTransfers: 1n,
      amountTrackerId: 'max-tracker',
      resetTimeIntervals: { startTime: 100n, intervalLength: 200n }
    });

  it('should round-trip through proto', () => {
    const original = makeMax();
    const proto = original.toProto();
    const restored = MaxNumTransfers.fromProto(proto, BigIntify);
    expect(restored.overallMaxNumTransfers).toBe(50n);
    expect(restored.amountTrackerId).toBe('max-tracker');
    expect(restored.resetTimeIntervals.startTime).toBe(100n);
  });

  it('should fall back to default resetTimeIntervals when proto has none', () => {
    const proto = new (MaxNumTransfers.prototype.toProto.call(makeMax()).constructor as any)({
      overallMaxNumTransfers: '10',
      perToAddressMaxNumTransfers: '0',
      perFromAddressMaxNumTransfers: '0',
      perInitiatedByAddressMaxNumTransfers: '0',
      amountTrackerId: 'test'
    });
    // Remove resetTimeIntervals to trigger fallback
    proto.resetTimeIntervals = undefined;
    const restored = MaxNumTransfers.fromProto(proto, BigIntify);
    expect(restored.resetTimeIntervals.startTime).toBe(0n);
    expect(restored.resetTimeIntervals.intervalLength).toBe(0n);
  });
});

describe('AutoDeletionOptions', () => {
  it('should round-trip through proto', () => {
    const original = new AutoDeletionOptions({
      afterOneUse: true,
      afterOverallMaxNumTransfers: false,
      allowCounterpartyPurge: true,
      allowPurgeIfExpired: false
    });
    const proto = original.toProto();
    const restored = AutoDeletionOptions.fromProto(proto, BigIntify);
    expect(restored.afterOneUse).toBe(true);
    expect(restored.afterOverallMaxNumTransfers).toBe(false);
    expect(restored.allowCounterpartyPurge).toBe(true);
    expect(restored.allowPurgeIfExpired).toBe(false);
  });
});

describe('RecurringOwnershipTimes', () => {
  it('should round-trip through proto', () => {
    const original = new RecurringOwnershipTimes({ startTime: 10n, intervalLength: 20n, chargePeriodLength: 5n });
    const proto = original.toProto();
    const restored = RecurringOwnershipTimes.fromProto(proto, BigIntify);
    expect(restored.startTime).toBe(10n);
    expect(restored.intervalLength).toBe(20n);
    expect(restored.chargePeriodLength).toBe(5n);
  });
});

describe('IncrementedBalances', () => {
  it('should round-trip through proto', () => {
    const original = new IncrementedBalances({
      startBalances: [],
      incrementTokenIdsBy: 1n,
      incrementOwnershipTimesBy: 0n,
      durationFromTimestamp: 0n,
      allowOverrideTimestamp: false,
      recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n },
      allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
    });
    const proto = original.toProto();
    const restored = IncrementedBalances.fromProto(proto, BigIntify);
    expect(restored.incrementTokenIdsBy).toBe(1n);
    expect(restored.allowOverrideTimestamp).toBe(false);
  });
});

describe('ManualBalances', () => {
  it('should round-trip through proto', () => {
    const original = new ManualBalances({ balances: [] });
    const proto = original.toProto();
    const restored = ManualBalances.fromProto(proto, BigIntify);
    expect(restored.balances).toEqual([]);
  });
});

describe('PredeterminedBalances', () => {
  const makePredetermined = () =>
    new PredeterminedBalances({
      manualBalances: [{ balances: [] }],
      incrementedBalances: {
        startBalances: [],
        incrementTokenIdsBy: 1n,
        incrementOwnershipTimesBy: 0n,
        durationFromTimestamp: 0n,
        allowOverrideTimestamp: false,
        recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n },
        allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
      },
      orderCalculationMethod: {
        useOverallNumTransfers: true,
        usePerToAddressNumTransfers: false,
        usePerFromAddressNumTransfers: false,
        usePerInitiatedByAddressNumTransfers: false,
        useMerkleChallengeLeafIndex: false,
        challengeTrackerId: ''
      }
    });

  it('should round-trip through proto', () => {
    const original = makePredetermined();
    const proto = original.toProto();
    const restored = PredeterminedBalances.fromProto(proto, BigIntify);
    expect(restored.manualBalances).toHaveLength(1);
    expect(restored.orderCalculationMethod.useOverallNumTransfers).toBe(true);
  });

  it('should convert number types', () => {
    const converted = makePredetermined().convert(Stringify);
    expect(converted.incrementedBalances.incrementTokenIdsBy).toBe('1');
  });
});

describe('PredeterminedOrderCalculationMethod', () => {
  it('should round-trip through fromProto', () => {
    const original = new PredeterminedOrderCalculationMethod({
      useOverallNumTransfers: false,
      usePerToAddressNumTransfers: true,
      usePerFromAddressNumTransfers: false,
      usePerInitiatedByAddressNumTransfers: false,
      useMerkleChallengeLeafIndex: true,
      challengeTrackerId: 'tracker-id'
    });
    const proto = original.toProto();
    const restored = PredeterminedOrderCalculationMethod.fromProto(proto);
    expect(restored.usePerToAddressNumTransfers).toBe(true);
    expect(restored.useMerkleChallengeLeafIndex).toBe(true);
    expect(restored.challengeTrackerId).toBe('tracker-id');
  });
});

describe('AddressChecks', () => {
  it('should round-trip through proto', () => {
    const original = new AddressChecks({
      mustBeEvmContract: true,
      mustNotBeEvmContract: false,
      mustBeLiquidityPool: true,
      mustNotBeLiquidityPool: false
    });
    const proto = original.toProto();
    const restored = AddressChecks.fromProto(proto);
    expect(restored.mustBeEvmContract).toBe(true);
    expect(restored.mustNotBeEvmContract).toBe(false);
    expect(restored.mustBeLiquidityPool).toBe(true);
    expect(restored.mustNotBeLiquidityPool).toBe(false);
  });

  it('should handle undefined values in toProto', () => {
    const checks = new AddressChecks({});
    const proto = checks.toProto();
    // Undefined defaults to false in proto
    expect(proto.mustBeEvmContract).toBe(false);
    expect(proto.mustNotBeEvmContract).toBe(false);
  });

  it('should convert (no number fields)', () => {
    const original = new AddressChecks({ mustBeEvmContract: true });
    const converted = original.convert(BigIntify);
    expect(converted.mustBeEvmContract).toBe(true);
  });
});

describe('AltTimeChecks', () => {
  it('should round-trip through proto', () => {
    const original = new AltTimeChecks({
      offlineHours: [{ start: 0n, end: 8n }],
      offlineDays: [{ start: 6n, end: 7n }]
    });
    const proto = original.toProto();
    const restored = AltTimeChecks.fromProto(proto, BigIntify);
    expect(restored.offlineHours).toHaveLength(1);
    expect(restored.offlineHours![0].start).toBe(0n);
    expect(restored.offlineDays).toHaveLength(1);
    expect(restored.offlineDays![0].start).toBe(6n);
  });

  it('should convert number types', () => {
    const original = new AltTimeChecks({ offlineHours: [{ start: 0n, end: 8n }] });
    const converted = original.convert(Stringify);
    expect(converted.offlineHours![0].start).toBe('0');
  });

  it('should handle undefined offlineHours/offlineDays in toProto', () => {
    const original = new AltTimeChecks({});
    const proto = original.toProto();
    expect(proto.offlineHours).toEqual([]);
    expect(proto.offlineDays).toEqual([]);
  });
});

describe('UserRoyalties', () => {
  it('should round-trip through proto', () => {
    const original = new UserRoyalties({ percentage: 500n, payoutAddress: 'bb1abc' });
    const proto = original.toProto();
    const restored = UserRoyalties.fromProto(proto, BigIntify);
    expect(restored.percentage).toBe(500n);
    expect(restored.payoutAddress).toBe('bb1abc');
  });
});

describe('ClaimCachePolicy', () => {
  it('should convert number types', () => {
    const original = new ClaimCachePolicy({ ttl: 3600n, alwaysPermanent: false, permanentAfter: 9999n });
    const converted = original.convert(Stringify);
    expect(converted.ttl).toBe('3600');
    expect(converted.permanentAfter).toBe('9999');
    expect(converted.alwaysPermanent).toBe(false);
  });
});

describe('ChallengeTrackerIdDetails', () => {
  it('should construct and convert', () => {
    const original = new ChallengeTrackerIdDetails({
      collectionId: '1',
      approvalId: 'ap1',
      challengeTrackerId: 'ct1',
      approvalLevel: 'collection',
      approverAddress: 'bb1xyz'
    });
    expect(original.collectionId).toBe('1');
    const converted = original.convert(Stringify);
    expect(converted.collectionId).toBe('1');
  });
});

describe('SatisfyMethod', () => {
  it('should construct with nested conditions', () => {
    const method = new SatisfyMethod({
      type: 'AND',
      conditions: ['cond1', new SatisfyMethod({ type: 'OR', conditions: ['cond2', 'cond3'] })],
      options: { minNumSatisfied: 1 }
    });
    expect(method.type).toBe('AND');
    expect(method.conditions).toHaveLength(2);
    expect(typeof method.conditions[0]).toBe('string');
  });
});

describe('ClaimDetails', () => {
  it('should construct with all fields', () => {
    const details = new ClaimDetails({
      claimId: 'claim1',
      plugins: [],
      _includesPrivateParams: false,
      version: 1n,
      metadata: { name: 'Test', description: 'Test claim', image: 'img.png' } as any,
      satisfyMethod: { type: 'AND', conditions: ['a'] },
      trackerDetails: {
        collectionId: '1',
        approvalId: 'ap1',
        challengeTrackerId: 'ct1',
        approvalLevel: 'collection',
        approverAddress: 'bb1xyz'
      },
      rewards: [{ name: 'r1' }] as any,
      cachePolicy: { ttl: 100n }
    });
    expect(details.claimId).toBe('claim1');
    expect(details.satisfyMethod).toBeDefined();
    expect(details.trackerDetails).toBeDefined();
    expect(details.rewards).toHaveLength(1);
    expect(details.cachePolicy).toBeDefined();
  });

  it('should convert number types', () => {
    const details = new ClaimDetails({
      claimId: 'c1',
      plugins: [],
      _includesPrivateParams: false,
      version: 10n,
      lastUpdated: 999n
    });
    const converted = details.convert(Stringify);
    expect(converted.version).toBe('10');
    expect(converted.lastUpdated).toBe('999');
  });
});

describe('ChallengeDetails', () => {
  it('should construct and convert', () => {
    const details = new ChallengeDetails({
      leaves: ['leaf1', 'leaf2'],
      isHashed: true,
      preimages: ['pre1', 'pre2'],
      numLeaves: 2n
    });
    expect(details.leaves).toHaveLength(2);
    expect(details.isHashed).toBe(true);
    const converted = details.convert(Stringify);
    expect(converted.numLeaves).toBe('2');
  });
});

describe('ChallengeInfoDetails', () => {
  it('should construct with claim', () => {
    const info = new ChallengeInfoDetails({
      challengeDetails: { leaves: [], isHashed: false },
      claim: { claimId: 'c1', plugins: [], _includesPrivateParams: false, version: 1n }
    });
    expect(info.challengeDetails).toBeDefined();
    expect(info.claim).toBeDefined();
    expect(info.claim!.claimId).toBe('c1');
  });

  it('should convert', () => {
    const info = new ChallengeInfoDetails({
      challengeDetails: { leaves: [], isHashed: false, numLeaves: 5n }
    });
    const converted = info.convert(Stringify);
    expect(converted.challengeDetails.numLeaves).toBe('5');
  });
});

describe('ApprovalInfoDetails', () => {
  it('should construct and convert', () => {
    const info = new ApprovalInfoDetails({ name: 'Test', description: 'Desc', image: 'img.png' });
    expect(info.name).toBe('Test');
    const converted = info.convert(BigIntify);
    expect(converted.name).toBe('Test');
  });
});

// ============================================================
// UserOutgoingApproval proto round-trip
// ============================================================

describe('UserOutgoingApproval', () => {
  const makeOutgoing = () =>
    new UserOutgoingApproval({
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'outgoing-1',
      uri: 'https://example.com',
      customData: 'cd',
      version: 0n,
      approvalCriteria: {
        requireToEqualsInitiatedBy: true,
        requireToDoesNotEqualInitiatedBy: false,
        dynamicStoreChallenges: [{ storeId: 1n }]
      }
    });

  it('should round-trip through proto', () => {
    const original = makeOutgoing();
    const proto = original.toProto();
    const restored = UserOutgoingApproval.fromProto(proto, BigIntify);
    expect(restored.approvalId).toBe('outgoing-1');
    expect(restored.toListId).toBe('All');
    expect(restored.transferTimes).toHaveLength(1);
    expect(restored.approvalCriteria).toBeDefined();
    expect(restored.approvalCriteria!.requireToEqualsInitiatedBy).toBe(true);
  });

  it('should castToCollectionTransfer', () => {
    const original = makeOutgoing();
    const casted = original.castToCollectionTransfer('fromList1');
    expect(casted.fromListId).toBe('fromList1');
    expect(casted.toListId).toBe('All');
    expect(casted).toBeInstanceOf(CollectionApproval);
  });

  it('should convert number types', () => {
    const converted = makeOutgoing().convert(Stringify);
    expect(converted.version).toBe('0');
    expect(converted.tokenIds[0].start).toBe('1');
  });
});

describe('UserIncomingApproval', () => {
  const makeIncoming = () =>
    new UserIncomingApproval({
      fromListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'incoming-1',
      version: 0n,
      approvalCriteria: {
        requireFromEqualsInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: true
      }
    });

  it('should round-trip through proto', () => {
    const original = makeIncoming();
    const proto = original.toProto();
    const restored = UserIncomingApproval.fromProto(proto, BigIntify);
    expect(restored.approvalId).toBe('incoming-1');
    expect(restored.fromListId).toBe('All');
    expect(restored.approvalCriteria).toBeDefined();
  });

  it('should castToCollectionTransfer', () => {
    const casted = makeIncoming().castToCollectionTransfer('toAddr');
    expect(casted.toListId).toBe('toAddr');
    expect(casted).toBeInstanceOf(CollectionApproval);
  });
});

describe('CollectionApproval', () => {
  const makeCollectionApproval = () =>
    new CollectionApproval({
      toListId: 'All',
      fromListId: 'Mint',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'col-1',
      version: 0n,
      approvalCriteria: {
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        userApprovalSettings: { userRoyalties: { percentage: 100n, payoutAddress: 'bb1pay' } }
      }
    });

  it('should round-trip through proto', () => {
    const original = makeCollectionApproval();
    const proto = original.toProto();
    const restored = CollectionApproval.fromProto(proto, BigIntify);
    expect(restored.approvalId).toBe('col-1');
    expect(restored.fromListId).toBe('Mint');
    expect(restored.approvalCriteria?.overridesFromOutgoingApprovals).toBe(true);
    expect(restored.approvalCriteria?.userApprovalSettings?.userRoyalties?.percentage).toBe(100n);
  });

  it('should castToOutgoingApproval', () => {
    const casted = makeCollectionApproval().castToOutgoingApproval();
    expect(casted).toBeInstanceOf(UserOutgoingApproval);
    expect(casted.toListId).toBe('All');
  });

  it('should castToIncomingApproval', () => {
    const casted = makeCollectionApproval().castToIncomingApproval();
    expect(casted).toBeInstanceOf(UserIncomingApproval);
    expect(casted.fromListId).toBe('Mint');
  });
});

describe('ApprovalCriteria full round-trip', () => {
  it('should round-trip with all sub-objects', () => {
    const criteria = new ApprovalCriteria({
      merkleChallenges: [],
      mustOwnTokens: [],
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n },
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
        },
        orderCalculationMethod: {
          useOverallNumTransfers: true,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        }
      },
      approvalAmounts: {
        overallApprovalAmount: 100n,
        perToAddressApprovalAmount: 10n,
        perFromAddressApprovalAmount: 5n,
        perInitiatedByAddressApprovalAmount: 2n,
        amountTrackerId: 'at1',
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 50n,
        perToAddressMaxNumTransfers: 5n,
        perFromAddressMaxNumTransfers: 3n,
        perInitiatedByAddressMaxNumTransfers: 1n,
        amountTrackerId: 'mt1',
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      autoDeletionOptions: { afterOneUse: true, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: true },
      requireToEqualsInitiatedBy: false,
      requireFromEqualsInitiatedBy: false,
      requireToDoesNotEqualInitiatedBy: false,
      requireFromDoesNotEqualInitiatedBy: false,
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      senderChecks: { mustBeEvmContract: true },
      recipientChecks: { mustNotBeLiquidityPool: true },
      initiatorChecks: {},
      altTimeChecks: { offlineHours: [{ start: 0n, end: 6n }] },
      mustPrioritize: true,
      allowBackedMinting: false,
      allowSpecialWrapping: false
    });
    const proto = criteria.toProto();
    const restored = ApprovalCriteria.fromProto(proto, BigIntify);
    expect(restored.approvalAmounts?.overallApprovalAmount).toBe(100n);
    expect(restored.maxNumTransfers?.overallMaxNumTransfers).toBe(50n);
    expect(restored.autoDeletionOptions?.afterOneUse).toBe(true);
    expect(restored.overridesFromOutgoingApprovals).toBe(true);
    expect(restored.senderChecks?.mustBeEvmContract).toBe(true);
    expect(restored.altTimeChecks?.offlineHours).toHaveLength(1);
    expect(restored.mustPrioritize).toBe(true);
  });

  it('should toBech32Addresses with coinTransfers', () => {
    const criteria = new ApprovalCriteria({
      coinTransfers: [{ to: 'bb1abc', coins: [], sendFromApproval: false }] as any
    });
    const converted = criteria.toBech32Addresses('bb');
    expect(converted).toBeInstanceOf(ApprovalCriteria);
  });
});

describe('OutgoingApprovalCriteria', () => {
  it('should round-trip through proto with all fields', () => {
    const criteria = new OutgoingApprovalCriteria({
      merkleChallenges: [],
      mustOwnTokens: [],
      requireToEqualsInitiatedBy: true,
      requireToDoesNotEqualInitiatedBy: false,
      recipientChecks: { mustBeEvmContract: true },
      initiatorChecks: { mustNotBeLiquidityPool: true },
      altTimeChecks: { offlineDays: [{ start: 1n, end: 5n }] },
      mustPrioritize: false
    });
    const proto = criteria.toProto();
    const restored = OutgoingApprovalCriteria.fromProto(proto, BigIntify);
    expect(restored.requireToEqualsInitiatedBy).toBe(true);
    expect(restored.recipientChecks?.mustBeEvmContract).toBe(true);
    expect(restored.altTimeChecks?.offlineDays).toHaveLength(1);
  });

  it('should castToCollectionApprovalCriteria', () => {
    const criteria = new OutgoingApprovalCriteria({
      requireToEqualsInitiatedBy: true,
      mustPrioritize: true
    });
    const casted = criteria.castToCollectionApprovalCriteria();
    expect(casted).toBeInstanceOf(ApprovalCriteria);
    expect(casted.requireToEqualsInitiatedBy).toBe(true);
    expect(casted.requireFromEqualsInitiatedBy).toBe(false);
    expect(casted.overridesFromOutgoingApprovals).toBe(false);
  });

  it('should toBech32Addresses', () => {
    const criteria = new OutgoingApprovalCriteria({ requireToEqualsInitiatedBy: false });
    const converted = criteria.toBech32Addresses('bb');
    expect(converted).toBeInstanceOf(OutgoingApprovalCriteria);
  });
});

describe('IncomingApprovalCriteria', () => {
  it('should round-trip through proto with all fields', () => {
    const criteria = new IncomingApprovalCriteria({
      merkleChallenges: [],
      mustOwnTokens: [],
      requireFromEqualsInitiatedBy: true,
      requireFromDoesNotEqualInitiatedBy: false,
      senderChecks: { mustNotBeEvmContract: true },
      initiatorChecks: {},
      altTimeChecks: { offlineHours: [{ start: 12n, end: 18n }] },
      mustPrioritize: true
    });
    const proto = criteria.toProto();
    const restored = IncomingApprovalCriteria.fromProto(proto, BigIntify);
    expect(restored.requireFromEqualsInitiatedBy).toBe(true);
    expect(restored.senderChecks?.mustNotBeEvmContract).toBe(true);
  });

  it('should castToCollectionApprovalCriteria', () => {
    const criteria = new IncomingApprovalCriteria({
      requireFromEqualsInitiatedBy: true,
      mustPrioritize: false
    });
    const casted = criteria.castToCollectionApprovalCriteria();
    expect(casted).toBeInstanceOf(ApprovalCriteria);
    expect(casted.requireFromEqualsInitiatedBy).toBe(true);
    expect(casted.requireToEqualsInitiatedBy).toBe(false);
    expect(casted.overridesToIncomingApprovals).toBe(false);
  });

  it('should toBech32Addresses', () => {
    const criteria = new IncomingApprovalCriteria({});
    const converted = criteria.toBech32Addresses('bb');
    expect(converted).toBeInstanceOf(IncomingApprovalCriteria);
  });
});

// ============================================================
// WithDetails classes
// ============================================================

const makeAddressList = (id: string) =>
  new AddressList({ listId: id, addresses: [], whitelist: false, uri: '', customData: '', createdBy: '' });

describe('CollectionApprovalWithDetails', () => {
  const makeApprovalWithDetails = () =>
    new CollectionApprovalWithDetails({
      toListId: 'All',
      fromListId: 'Mint',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'wd-1',
      version: 0n,
      toList: makeAddressList('All'),
      fromList: makeAddressList('Mint'),
      initiatedByList: makeAddressList('All'),
      details: { name: 'Test', description: 'Test', image: 'img.png' }
    });

  it('should construct with details', () => {
    const approval = makeApprovalWithDetails();
    expect(approval.toList).toBeInstanceOf(AddressList);
    expect(approval.fromList).toBeInstanceOf(AddressList);
    expect(approval.details?.name).toBe('Test');
  });

  it('should convert number types', () => {
    const converted = makeApprovalWithDetails().convert(Stringify);
    expect(converted.version).toBe('0');
  });

  it('should clone', () => {
    const original = makeApprovalWithDetails();
    const cloned = original.clone();
    expect(cloned.approvalId).toBe('wd-1');
    expect(cloned).toBeInstanceOf(CollectionApprovalWithDetails);
  });

  it('should castToOutgoingApproval', () => {
    const casted = makeApprovalWithDetails().castToOutgoingApproval();
    expect(casted).toBeInstanceOf(UserOutgoingApprovalWithDetails);
    expect(casted.toList).toBeInstanceOf(AddressList);
  });

  it('should castToIncomingApproval', () => {
    const casted = makeApprovalWithDetails().castToIncomingApproval();
    expect(casted).toBeInstanceOf(UserIncomingApprovalWithDetails);
    expect(casted.fromList).toBeInstanceOf(AddressList);
  });

  it('should castToUniversalPermission', () => {
    const up = makeApprovalWithDetails().castToUniversalPermission();
    expect(up.usesTokenIds).toBe(true);
    expect(up.usesTransferTimes).toBe(true);
    expect(up.usesToList).toBe(true);
    expect(up.usesFromList).toBe(true);
    expect(up.usesInitiatedByList).toBe(true);
    expect(up.usesOwnershipTimes).toBe(true);
    expect(up.usesApprovalIdList).toBe(true);
  });
});

describe('UserOutgoingApprovalWithDetails', () => {
  it('should construct and castToCollectionTransfer', () => {
    const addr = genTestAddress();
    const approval = new UserOutgoingApprovalWithDetails({
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'uoawd-1',
      version: 0n,
      toList: makeAddressList('All'),
      initiatedByList: makeAddressList('All')
    });
    const casted = approval.castToCollectionTransfer(addr);
    expect(casted).toBeInstanceOf(CollectionApprovalWithDetails);
    expect(casted.fromListId).toBe(addr);
  });

  it('should castToUniversalPermission', () => {
    const addr = genTestAddress();
    const approval = new UserOutgoingApprovalWithDetails({
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'uoawd-1',
      version: 0n,
      toList: makeAddressList('All'),
      initiatedByList: makeAddressList('All')
    });
    const up = approval.castToUniversalPermission(addr);
    expect(up.usesTokenIds).toBe(true);
  });

  it('should clone', () => {
    const approval = new UserOutgoingApprovalWithDetails({
      toListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'clone-test',
      version: 0n,
      toList: makeAddressList('All'),
      initiatedByList: makeAddressList('All')
    });
    const cloned = approval.clone();
    expect(cloned.approvalId).toBe('clone-test');
    expect(cloned).toBeInstanceOf(UserOutgoingApprovalWithDetails);
  });
});

describe('UserIncomingApprovalWithDetails', () => {
  it('should construct and castToCollectionTransfer', () => {
    const addr = genTestAddress();
    const approval = new UserIncomingApprovalWithDetails({
      fromListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'uiawd-1',
      version: 0n,
      fromList: makeAddressList('All'),
      initiatedByList: makeAddressList('All')
    });
    const casted = approval.castToCollectionTransfer(addr);
    expect(casted).toBeInstanceOf(CollectionApprovalWithDetails);
    expect(casted.toListId).toBe(addr);
  });

  it('should clone', () => {
    const approval = new UserIncomingApprovalWithDetails({
      fromListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [],
      tokenIds: [],
      ownershipTimes: [],
      approvalId: 'clone-test',
      version: 0n,
      fromList: makeAddressList('All'),
      initiatedByList: makeAddressList('All')
    });
    const cloned = approval.clone();
    expect(cloned.approvalId).toBe('clone-test');
    expect(cloned).toBeInstanceOf(UserIncomingApprovalWithDetails);
  });
});

describe('MerkleChallengeWithDetails', () => {
  it('should construct and convert', () => {
    const mc = new MerkleChallengeWithDetails({
      root: 'abc',
      expectedProofLength: 3n,
      useCreatorAddressAsLeaf: true,
      maxUsesPerLeaf: 1n,
      uri: '',
      customData: '',
      challengeTrackerId: 'ct1',
      leafSigner: '',
      challengeInfoDetails: {
        challengeDetails: { leaves: ['l1'], isHashed: false, numLeaves: 1n }
      }
    });
    expect(mc.challengeInfoDetails).toBeDefined();
    expect(mc.challengeInfoDetails.challengeDetails.leaves).toEqual(['l1']);
    const converted = mc.convert(Stringify);
    expect(converted.expectedProofLength).toBe('3');
  });

  it('should clone', () => {
    const mc = new MerkleChallengeWithDetails({
      root: 'abc',
      expectedProofLength: 3n,
      useCreatorAddressAsLeaf: false,
      maxUsesPerLeaf: 1n,
      uri: '',
      customData: '',
      challengeTrackerId: 'ct1',
      leafSigner: '',
      challengeInfoDetails: {
        challengeDetails: { leaves: [], isHashed: false }
      }
    });
    const cloned = mc.clone();
    expect(cloned).toBeInstanceOf(MerkleChallengeWithDetails);
    expect(cloned.root).toBe('abc');
  });
});

describe('ApprovalCriteriaWithDetails', () => {
  it('should construct with merkleChallenges', () => {
    const criteria = new ApprovalCriteriaWithDetails({
      merkleChallenges: [
        {
          root: 'abc',
          expectedProofLength: 3n,
          useCreatorAddressAsLeaf: false,
          maxUsesPerLeaf: 1n,
          uri: '',
          customData: '',
          challengeTrackerId: 'ct1',
          leafSigner: '',
          challengeInfoDetails: { challengeDetails: { leaves: [], isHashed: false } }
        }
      ]
    });
    expect(criteria.merkleChallenges).toHaveLength(1);
    expect(criteria.merkleChallenges![0]).toBeInstanceOf(MerkleChallengeWithDetails);
  });

  it('should clone', () => {
    const criteria = new ApprovalCriteriaWithDetails({});
    const cloned = criteria.clone();
    expect(cloned).toBeInstanceOf(ApprovalCriteriaWithDetails);
  });
});

describe('IncomingApprovalCriteriaWithDetails', () => {
  it('should castToCollectionApprovalCriteria', () => {
    const criteria = new IncomingApprovalCriteriaWithDetails({
      requireFromEqualsInitiatedBy: true,
      merkleChallenges: [
        {
          root: 'x',
          expectedProofLength: 1n,
          useCreatorAddressAsLeaf: false,
          maxUsesPerLeaf: 1n,
          uri: '',
          customData: '',
          challengeTrackerId: 'ct',
          leafSigner: '',
          challengeInfoDetails: { challengeDetails: { leaves: [], isHashed: false } }
        }
      ]
    });
    const casted = criteria.castToCollectionApprovalCriteria();
    expect(casted).toBeInstanceOf(ApprovalCriteriaWithDetails);
    expect(casted.requireFromEqualsInitiatedBy).toBe(true);
    expect(casted.requireToEqualsInitiatedBy).toBe(false);
    expect(casted.merkleChallenges).toHaveLength(1);
  });

  it('should clone', () => {
    const criteria = new IncomingApprovalCriteriaWithDetails({});
    expect(criteria.clone()).toBeInstanceOf(IncomingApprovalCriteriaWithDetails);
  });
});

describe('OutgoingApprovalCriteriaWithDetails', () => {
  it('should castToCollectionApprovalCriteria', () => {
    const criteria = new OutgoingApprovalCriteriaWithDetails({
      requireToEqualsInitiatedBy: true,
      merkleChallenges: [
        {
          root: 'y',
          expectedProofLength: 2n,
          useCreatorAddressAsLeaf: true,
          maxUsesPerLeaf: 5n,
          uri: '',
          customData: '',
          challengeTrackerId: 'ct2',
          leafSigner: '',
          challengeInfoDetails: { challengeDetails: { leaves: [], isHashed: false } }
        }
      ]
    });
    const casted = criteria.castToCollectionApprovalCriteria();
    expect(casted).toBeInstanceOf(ApprovalCriteriaWithDetails);
    expect(casted.requireToEqualsInitiatedBy).toBe(true);
    expect(casted.requireFromEqualsInitiatedBy).toBe(false);
  });

  it('should clone', () => {
    const criteria = new OutgoingApprovalCriteriaWithDetails({});
    expect(criteria.clone()).toBeInstanceOf(OutgoingApprovalCriteriaWithDetails);
  });
});

// ============================================================
// expandCollectionApprovals and getFirstMatchOnlyWithApprovalCriteria
// ============================================================

describe('expandCollectionApprovals', () => {
  it('should expand approvals', () => {
    const approval = new CollectionApprovalWithDetails({
      toListId: 'All',
      fromListId: 'Mint',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'expand-test',
      version: 0n,
      toList: makeAddressList('All'),
      fromList: new AddressList({ listId: 'Mint', addresses: ['Mint'], whitelist: true, uri: '', customData: '', createdBy: '' }),
      initiatedByList: makeAddressList('All')
    });
    const expanded = expandCollectionApprovals([approval]);
    expect(expanded).toHaveLength(1);
    expect(expanded[0].toListId).toBe('All');
  });
});

describe('getFirstMatchOnlyWithApprovalCriteria', () => {
  it('should handle empty input', () => {
    const result = getFirstMatchOnlyWithApprovalCriteria([]);
    expect(result).toEqual([]);
  });

  it('should handle single approval', () => {
    const approval = new CollectionApprovalWithDetails({
      toListId: 'All',
      fromListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: 'first-match-test',
      version: 0n,
      toList: makeAddressList('All'),
      fromList: makeAddressList('All'),
      initiatedByList: makeAddressList('All')
    });
    const up = approval.castToUniversalPermission();
    const result = getFirstMatchOnlyWithApprovalCriteria([up]);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================
// validateCollectionApprovalsUpdate
// ============================================================

describe('validateCollectionApprovalsUpdate', () => {
  const makeDetailedApproval = (id: string) =>
    new CollectionApprovalWithDetails({
      toListId: 'All',
      fromListId: 'All',
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: 100n }],
      tokenIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: 50n }],
      approvalId: id,
      version: 0n,
      toList: makeAddressList('All'),
      fromList: makeAddressList('All'),
      initiatedByList: makeAddressList('All')
    });

  it('should return null when old and new are identical', () => {
    const approvals = [makeDetailedApproval('same')];
    const result = validateCollectionApprovalsUpdate(approvals, approvals, []);
    expect(result).toBeNull();
  });

  it('should return null when approvals change but no permissions restrict the change', () => {
    // With empty permissions array, there are no restrictions, so any change is allowed
    const oldApprovals = [makeDetailedApproval('old')];
    const newApprovals = [makeDetailedApproval('new')];
    const result = validateCollectionApprovalsUpdate(oldApprovals, newApprovals, []);
    expect(result).toBeNull();
  });
});
