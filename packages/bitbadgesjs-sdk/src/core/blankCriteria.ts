import type { iApprovalCriteriaWithDetails } from './approvals.js';

export const blankCriteria = (id: string): Required<iApprovalCriteriaWithDetails<bigint>> => {
  return {
    senderChecks: {
      mustBeEvmContract: false,
      mustNotBeEvmContract: false,
      mustBeLiquidityPool: false,
      mustNotBeLiquidityPool: false
    },
    recipientChecks: {
      mustBeEvmContract: false,
      mustNotBeEvmContract: false,
      mustBeLiquidityPool: false,
      mustNotBeLiquidityPool: false
    },
    initiatorChecks: {
      mustBeEvmContract: false,
      mustNotBeEvmContract: false,
      mustBeLiquidityPool: false,
      mustNotBeLiquidityPool: false
    },
    autoDeletionOptions: {
      afterOneUse: false,
      afterOverallMaxNumTransfers: false,
      allowCounterpartyPurge: false,
      allowPurgeIfExpired: false
    },
    requireToDoesNotEqualInitiatedBy: false,
    requireFromDoesNotEqualInitiatedBy: false,
    coinTransfers: [],
    predeterminedBalances: {
      manualBalances: [],
      orderCalculationMethod: {
        useOverallNumTransfers: false,
        usePerToAddressNumTransfers: false,
        usePerFromAddressNumTransfers: false,
        usePerInitiatedByAddressNumTransfers: false,
        useMerkleChallengeLeafIndex: false,
        challengeTrackerId: ''
      },
      incrementedBalances: {
        startBalances: [],
        incrementTokenIdsBy: 0n,
        incrementOwnershipTimesBy: 0n,

        //monthly in milliseconds
        durationFromTimestamp: 0n,
        allowOverrideTimestamp: false,
        allowOverrideWithAnyValidToken: false,
        allowAmountScaling: false, maxScalingMultiplier: 0n,
        recurringOwnershipTimes: {
          startTime: 0n,
          intervalLength: 0n,
          chargePeriodLength: 0n
        }
      }
    },
    maxNumTransfers: {
      overallMaxNumTransfers: 0n,
      perToAddressMaxNumTransfers: 0n,
      perFromAddressMaxNumTransfers: 0n,
      perInitiatedByAddressMaxNumTransfers: 0n,
      amountTrackerId: id,
      resetTimeIntervals: {
        startTime: 0n,
        intervalLength: 0n
      }
    },
    approvalAmounts: {
      overallApprovalAmount: 0n,
      perFromAddressApprovalAmount: 0n,
      perToAddressApprovalAmount: 0n,
      perInitiatedByAddressApprovalAmount: 0n,
      amountTrackerId: id,
      resetTimeIntervals: {
        startTime: 0n,
        intervalLength: 0n
      }
    },
    merkleChallenges: [],
    mustOwnTokens: [],
    dynamicStoreChallenges: [],
    ethSignatureChallenges: [],
    votingChallenges: [],
    evmQueryChallenges: [],
    requireToEqualsInitiatedBy: false,
    requireFromEqualsInitiatedBy: false,
    overridesFromOutgoingApprovals: false,
    overridesToIncomingApprovals: false,
    altTimeChecks: {
      offlineHours: [],
      offlineDays: []
    },
    userRoyalties: {
      percentage: 0n,
      payoutAddress: ''
    },
    mustPrioritize: false,
    allowBackedMinting: false,
    allowSpecialWrapping: false
  };
};
