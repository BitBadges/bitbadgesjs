import { AddressList } from '../addressLists.js';
import { UintRangeArray } from '../uintRanges.js';
import type { iUintRange } from '../../interfaces/types/core.js';
import { RequiredApprovalProps } from '../approval-utils.js';

const FOREVER: iUintRange<bigint>[] = [{ start: 1n, end: BigInt('18446744073709551615') }];
const TOKEN_IDS: iUintRange<bigint>[] = [{ start: 1n, end: 1n }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

interface AddressListParams {
  managerAddress: string;
}

/**
 * Builds the 2 collection-level approvals for an address list.
 *
 * 1. manager-add: Mint -> All (manager-initiated) -- add addresses to list
 * 2. manager-remove: All -> burn (manager-initiated) -- remove addresses from list
 */
export class AddressListRegistry {
  static managerAddApproval(params: AddressListParams): RequiredApprovalProps {
    const managerList = new AddressList({
      addresses: [params.managerAddress],
      whitelist: true,
      listId: params.managerAddress,
      uri: '',
      customData: ''
    });

    return {
      details: { name: 'Add to List', description: 'Allows the manager to add addresses by minting membership tokens', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.AllAddresses(),
      toListId: 'All',
      initiatedByList: managerList,
      initiatedByListId: params.managerAddress,
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: TOKEN_IDS,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: 'manager-add',
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: false,
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        merkleChallenges: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [],
        evmQueryChallenges: [],
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
            durationFromTimestamp: 0n,
            allowOverrideTimestamp: false,
            allowOverrideWithAnyValidToken: false,
            allowAmountScaling: false,
            maxScalingMultiplier: 0n,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: {
          overallMaxNumTransfers: 0n,
          perToAddressMaxNumTransfers: 0n,
          perFromAddressMaxNumTransfers: 0n,
          perInitiatedByAddressMaxNumTransfers: 0n,
          amountTrackerId: '',
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: 0n,
          amountTrackerId: '',
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        autoDeletionOptions: { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false },
        senderChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        recipientChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        initiatorChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        altTimeChecks: { offlineHours: [], offlineDays: [] },
        userApprovalSettings: { userRoyalties: { percentage: 0n, payoutAddress: '' } },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  static managerRemoveApproval(params: AddressListParams): RequiredApprovalProps {
    const managerList = new AddressList({
      addresses: [params.managerAddress],
      whitelist: true,
      listId: params.managerAddress,
      uri: '',
      customData: ''
    });

    return {
      details: { name: 'Remove from List', description: 'Allows the manager to remove addresses by burning membership tokens', image: '' },
      version: 0n,
      fromList: AddressList.getReservedAddressList('!Mint'),
      fromListId: '!Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: managerList,
      initiatedByListId: params.managerAddress,
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: TOKEN_IDS,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: 'manager-remove',
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: false,
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        merkleChallenges: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [],
        evmQueryChallenges: [],
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
            durationFromTimestamp: 0n,
            allowOverrideTimestamp: false,
            allowOverrideWithAnyValidToken: false,
            allowAmountScaling: false,
            maxScalingMultiplier: 0n,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: {
          overallMaxNumTransfers: 0n,
          perToAddressMaxNumTransfers: 0n,
          perFromAddressMaxNumTransfers: 0n,
          perInitiatedByAddressMaxNumTransfers: 0n,
          amountTrackerId: '',
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: 0n,
          amountTrackerId: '',
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        autoDeletionOptions: { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false },
        senderChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        recipientChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        initiatorChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        altTimeChecks: { offlineHours: [], offlineDays: [] },
        userApprovalSettings: { userRoyalties: { percentage: 0n, payoutAddress: '' } },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  static allApprovals(params: AddressListParams): RequiredApprovalProps[] {
    return [
      this.managerAddApproval(params),
      this.managerRemoveApproval(params)
    ];
  }

  /** Permissions: lock standards, validTokenIds, deletion. Leave others updatable by manager. */
  static permissions() {
    const frozen = [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const frozenTokens = [{ tokenIds: TOKEN_IDS, permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];

    return {
      canDeleteCollection: frozen,
      canArchiveCollection: [],
      canUpdateStandards: frozen,
      canUpdateCustomData: [],
      canUpdateManager: [],
      canUpdateCollectionMetadata: [],
      canUpdateValidTokenIds: frozenTokens,
      canUpdateTokenMetadata: [],
      canUpdateCollectionApprovals: [],
      canAddMoreAliasPaths: [],
      canAddMoreCosmosCoinWrapperPaths: []
    };
  }
}
