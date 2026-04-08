import { AddressList } from '../addressLists.js';
import { UintRangeArray } from '../uintRanges.js';
import type { iUintRange } from '../../interfaces/types/core.js';
import crypto from 'crypto';
import { RequiredApprovalProps } from '../approval-utils.js';

const FOREVER: iUintRange<bigint>[] = [{ start: 1n, end: BigInt('18446744073709551615') }];
const MAX_UINT64 = BigInt('18446744073709551615');
const TOKEN_YES: iUintRange<bigint>[] = [{ start: 1n, end: 1n }];
const TOKEN_NO: iUintRange<bigint>[] = [{ start: 2n, end: 2n }];
const TOKEN_BOTH: iUintRange<bigint>[] = [{ start: 1n, end: 2n }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

interface PredictionMarketParams {
  creatorAddress: string;
  depositDenom: string;
  depositAmount: bigint; // smallest base unit per pair (e.g., 1 for 1 micro-unit, scales up via allowAmountScaling)
  verifierAddress: string;
  transferTimes: UintRangeArray<bigint>; // market active window
}

/**
 * Builds the 5 collection-level approvals for a prediction market.
 *
 * 1. Paired mint: deposit USDC -> receive 1 YES + 1 NO
 * 2. Pre-settlement redeem: burn 1 YES + 1 NO -> receive USDC
 * 3. YES wins: burn YES -> receive USDC (vote-gated)
 * 4. NO wins: burn NO -> receive USDC (vote-gated)
 * 5a. Push YES: burn YES -> receive 0.5 USDC (vote-gated)
 * 5b. Push NO: burn NO -> receive 0.5 USDC (vote-gated)
 */
export class PredictionMarketRegistry {

  /** Paired mint: deposit -> YES + NO */
  static pairedMintApproval(params: PredictionMarketParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Deposit', description: 'Deposit to receive equal YES and NO outcome tokens', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.AllAddresses(),
      toListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: params.transferTimes,
      tokenIds: TOKEN_BOTH,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `pm-mint-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        recipientChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        initiatorChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        coinTransfers: [{
          to: 'Mint', // Chain auto-resolves "Mint" to collection.MintEscrowAddress at execution time
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false,
          coins: [{ denom: params.depositDenom, amount: params.depositAmount }]
        }],
        predeterminedBalances: {
          manualBalances: [],
          orderCalculationMethod: {
            useOverallNumTransfers: true,
            usePerToAddressNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
            useMerkleChallengeLeafIndex: false,
            challengeTrackerId: ''
          },
          incrementedBalances: {
            startBalances: [
              { amount: params.depositAmount, tokenIds: TOKEN_YES, ownershipTimes: UintRangeArray.FullRanges() },
              { amount: params.depositAmount, tokenIds: TOKEN_NO, ownershipTimes: UintRangeArray.FullRanges() }
            ],
            incrementTokenIdsBy: 0n,
            incrementOwnershipTimesBy: 0n,
            durationFromTimestamp: 0n,
            allowOverrideTimestamp: false,
            allowOverrideWithAnyValidToken: false,
            allowAmountScaling: true,
            maxScalingMultiplier: MAX_UINT64,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: {
          overallMaxNumTransfers: 0n, // unlimited
          perToAddressMaxNumTransfers: 0n,
          perFromAddressMaxNumTransfers: 0n,
          perInitiatedByAddressMaxNumTransfers: 0n,
          amountTrackerId: id,
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: 0n,
          amountTrackerId: id,
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        merkleChallenges: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        autoDeletionOptions: { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false },
        altTimeChecks: { offlineHours: [], offlineDays: [] },
        userApprovalSettings: { userRoyalties: { percentage: 0n, payoutAddress: '' } },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Pre-settlement redeem: burn YES + NO pair -> USDC */
  static preSettlementRedeemApproval(params: PredictionMarketParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Redeem Pair', description: 'Burn equal YES and NO tokens to reclaim your deposit before settlement', image: '' },
      version: 0n,
      fromList: AddressList.AllAddresses(),
      fromListId: '!Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: params.transferTimes,
      tokenIds: TOKEN_BOTH,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `pm-redeem-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        recipientChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        initiatorChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        coinTransfers: [{
          to: '',
          overrideFromWithApproverAddress: true, // pays from escrow
          overrideToWithInitiator: true, // pays the person initiating
          coins: [{ denom: params.depositDenom, amount: params.depositAmount }]
        }],
        predeterminedBalances: {
          manualBalances: [],
          orderCalculationMethod: {
            useOverallNumTransfers: true,
            usePerToAddressNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
            useMerkleChallengeLeafIndex: false,
            challengeTrackerId: ''
          },
          incrementedBalances: {
            startBalances: [
              { amount: params.depositAmount, tokenIds: TOKEN_YES, ownershipTimes: UintRangeArray.FullRanges() },
              { amount: params.depositAmount, tokenIds: TOKEN_NO, ownershipTimes: UintRangeArray.FullRanges() }
            ],
            incrementTokenIdsBy: 0n,
            incrementOwnershipTimesBy: 0n,
            durationFromTimestamp: 0n,
            allowOverrideTimestamp: false,
            allowOverrideWithAnyValidToken: false,
            allowAmountScaling: true,
            maxScalingMultiplier: MAX_UINT64,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: {
          overallMaxNumTransfers: MAX_UINT64, // Required: overrideFromWithApproverAddress=true needs non-zero
          perToAddressMaxNumTransfers: 0n,
          perFromAddressMaxNumTransfers: 0n,
          perInitiatedByAddressMaxNumTransfers: 0n,
          amountTrackerId: id,
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: 0n,
          amountTrackerId: id,
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        merkleChallenges: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        autoDeletionOptions: { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false },
        altTimeChecks: { offlineHours: [], offlineDays: [] },
        userApprovalSettings: { userRoyalties: { percentage: 0n, payoutAddress: '' } },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Settlement approval: burn one side -> receive USDC (vote-gated) */
  static settlementApproval(
    params: PredictionMarketParams,
    outcome: 'yes' | 'no' | 'push-yes' | 'push-no',
  ): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    const isPush = outcome.startsWith('push');
    const isYesSide = outcome === 'yes' || outcome === 'push-yes';
    const tokenIds = isYesSide ? TOKEN_YES : TOKEN_NO;
    // Push = 2:1 ratio (burn 2 micro-tokens -> get 1 micro-denom). Non-push = 1:1.
    const burnAmount = isPush ? params.depositAmount * 2n : params.depositAmount;
    const payoutAmount = params.depositAmount;
    const proposalId = `pm-settle-${outcome}-${id}`;

    const outcomeLabel = isPush ? `Push (${isYesSide ? 'YES' : 'NO'} side)` : `${isYesSide ? 'YES' : 'NO'} wins`;
    const outcomeDescription = isPush
      ? `Burn ${isYesSide ? 'YES' : 'NO'} tokens to claim half payout after push (draw) outcome`
      : `Burn ${isYesSide ? 'YES' : 'NO'} tokens to claim full payout after ${isYesSide ? 'YES' : 'NO'} outcome is confirmed`;

    return {
      details: { name: outcomeLabel, description: outcomeDescription, image: '' },
      version: 0n,
      fromList: AddressList.AllAddresses(),
      fromListId: '!Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: FOREVER as any,
      tokenIds,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: proposalId,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        recipientChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        initiatorChecks: { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false },
        coinTransfers: [{
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ denom: params.depositDenom, amount: payoutAmount }]
        }],
        predeterminedBalances: {
          manualBalances: [],
          orderCalculationMethod: {
            useOverallNumTransfers: true,
            usePerToAddressNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
            useMerkleChallengeLeafIndex: false,
            challengeTrackerId: ''
          },
          incrementedBalances: {
            startBalances: [{ amount: burnAmount, tokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
            incrementTokenIdsBy: 0n,
            incrementOwnershipTimesBy: 0n,
            durationFromTimestamp: 0n,
            allowOverrideTimestamp: false,
            allowOverrideWithAnyValidToken: false,
            allowAmountScaling: true,
            maxScalingMultiplier: MAX_UINT64,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: {
          overallMaxNumTransfers: MAX_UINT64, // Required: overrideFromWithApproverAddress=true needs non-zero
          perToAddressMaxNumTransfers: 0n,
          perFromAddressMaxNumTransfers: 0n,
          perInitiatedByAddressMaxNumTransfers: 0n,
          amountTrackerId: id,
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: 0n,
          amountTrackerId: id,
          resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
        },
        merkleChallenges: [],
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [{
          proposalId,
          quorumThreshold: 100n as any,
          voters: [{ address: params.verifierAddress, weight: 1n as any }],
          uri: '',
          customData: ''
        }],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        autoDeletionOptions: { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false },
        altTimeChecks: { offlineHours: [], offlineDays: [] },
        userApprovalSettings: { userRoyalties: { percentage: 0n, payoutAddress: '' } },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Freely transferable approval -- allows transfers between users/pools (no coinTransfers) */
  static transferableApproval(): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Transferable', description: 'Freely trade YES and NO tokens between any addresses', image: '' },
      version: 0n,
      fromList: AddressList.AllAddresses(),
      fromListId: '!Mint',
      toList: AddressList.AllAddresses(),
      toListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: FOREVER as any,
      tokenIds: TOKEN_BOTH,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `pm-transfer-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        mustPrioritize: false
      } as any
    };
  }

  /** Build all 7 approvals for a prediction market */
  static allApprovals(params: PredictionMarketParams): RequiredApprovalProps[] {
    return [
      this.pairedMintApproval(params),
      this.transferableApproval(),
      this.preSettlementRedeemApproval(params),
      this.settlementApproval(params, 'yes'),
      this.settlementApproval(params, 'no'),
      this.settlementApproval(params, 'push-yes'),
      this.settlementApproval(params, 'push-no'),
    ];
  }

  /** Build alias paths for YES (token ID 1) and NO (token ID 2) */
  static aliasPaths(image?: string, decimals = '6') {
    const img = image || '';
    return [
      {
        denom: 'uyes',
        symbol: 'uyes',
        conversion: {
          sideA: { amount: '1' },
          sideB: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '1', end: '18446744073709551615' }] }]
        },
        denomUnits: [{ symbol: 'YES', decimals, isDefaultDisplay: true, metadata: { image: img, uri: '', customData: '' } }],
        metadata: { image: img, uri: '', customData: '' }
      },
      {
        denom: 'uno',
        symbol: 'uno',
        conversion: {
          sideA: { amount: '1' },
          sideB: [{ amount: '1', tokenIds: [{ start: '2', end: '2' }], ownershipTimes: [{ start: '1', end: '18446744073709551615' }] }]
        },
        denomUnits: [{ symbol: 'NO', decimals, isDefaultDisplay: true, metadata: { image: img, uri: '', customData: '' } }],
        metadata: { image: img, uri: '', customData: '' }
      }
    ];
  }

  /** Fully frozen permissions -- nothing can change after creation */
  static frozenPermissions() {
    const frozen = [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const frozenTokens = [{ tokenIds: FOREVER, permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const allList = AddressList.AllAddresses();
    const frozenApprovals = [{
      approvalId: 'All',
      fromListId: 'All',
      fromList: allList,
      toListId: 'All',
      toList: allList,
      initiatedByListId: 'All',
      initiatedByList: allList,
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: FOREVER
    }];

    return {
      canDeleteCollection: frozen,
      canArchiveCollection: frozen,
      canUpdateStandards: frozen,
      canUpdateCustomData: frozen,
      canUpdateManager: frozen,
      canUpdateCollectionMetadata: frozen,
      canUpdateValidTokenIds: frozenTokens,
      canUpdateTokenMetadata: frozenTokens,
      canUpdateCollectionApprovals: frozenApprovals,
      canAddMoreAliasPaths: frozen,
      canAddMoreCosmosCoinWrapperPaths: frozen
    };
  }
}
