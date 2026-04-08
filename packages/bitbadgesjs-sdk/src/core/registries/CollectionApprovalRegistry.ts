import { AddressList } from '../addressLists.js';
import { UintRangeArray } from '../uintRanges.js';
import { CollectionApprovalWithDetails } from '../approvals.js';
import { convertToBitBadgesAddress } from '../../address-converter/converter.js';
import type { RequiredApprovalProps } from '../approval-utils.js';
import type { iCollectionApprovalWithDetails, iMerkleChallengeWithDetails } from '../approvals.js';
import type { iMustOwnTokens, iUintRange } from '../../interfaces/types/core.js';

import { type TFunction, defaultT } from './types.js';

// Constants for subscription intervals
export const MONTHLY_MS = 2629746000n;
export const ANNUAL_MS = 31556952000n;
export const DAILY_MS = 86400000n; // 24 hours in milliseconds

/**
 * Calculates the next midnight timestamp (UTC) for daily reset intervals.
 * This ensures daily rate limits reset at midnight UTC each day.
 * All vaults will reset at the same time (midnight UTC) for consistency.
 */
export const getNextMidnightTimestamp = (): bigint => {
  const now = Date.now();
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);
  const todayMidnightTime = todayMidnight.getTime();

  // If we're past midnight today, use tomorrow's midnight
  // Otherwise use today's midnight (which may be in the past, but that's okay - it will start the next interval)
  if (now >= todayMidnightTime) {
    // Use tomorrow's midnight
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setUTCDate(tomorrowMidnight.getUTCDate() + 1);
    return BigInt(tomorrowMidnight.getTime());
  } else {
    // Use today's midnight (shouldn't happen in practice, but handle it)
    return BigInt(todayMidnightTime);
  }
};

/**
 * Registry for common collection approvals that can be reused across the application.
 * Collection approvals are approvals that govern how tokens can be transferred at the collection level.
 * All functions return new instances to avoid mutation issues.
 */
export class CollectionApprovalRegistry {
  /**
   * Creates a transferable approval that allows transfers from the mint address to all addresses.
   * This is the standard approval for making tokens transferable after minting.
   */
  static transferableApproval(): CollectionApprovalWithDetails<bigint> {
    return new CollectionApprovalWithDetails({
      fromListId: '!Mint',
      fromList: AddressList.getReservedAddressList('!Mint'),
      toListId: 'All',
      toList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      transferTimes: UintRangeArray.FullRanges(),
      ownershipTimes: UintRangeArray.FullRanges(),
      tokenIds: UintRangeArray.FullRanges(),
      approvalId: 'transferable-approval',
      version: 0n
    });
  }

  /**
   * Creates a burnable approval that allows burning tokens from the mint address to the zero address.
   * This is the standard approval for making tokens burnable after minting.
   */
  static burnableApproval(): CollectionApprovalWithDetails<bigint> {
    return new CollectionApprovalWithDetails({
      fromListId: '!Mint',
      fromList: AddressList.getReservedAddressList('!Mint'),
      toListId: convertToBitBadgesAddress('bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv'),
      toList: AddressList.getReservedAddressList(convertToBitBadgesAddress('bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv')),
      initiatedByListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      transferTimes: UintRangeArray.FullRanges(),
      ownershipTimes: UintRangeArray.FullRanges(),
      tokenIds: UintRangeArray.FullRanges(),
      approvalId: 'burnable-approval',
      version: 0n
    });
  }

  /**
   * Creates a quests approval for quest-based token distribution.
   * Allows users to claim tokens by completing quests with Merkle challenges.
   * This is a collection-level approval that governs quest behavior.
   */
  static questsApproval = ({
    rewardUbadgeAmount,
    merkleChallenges,
    approvalId,
    denom = 'ubadge',
    t = defaultT
  }: {
    rewardUbadgeAmount: bigint;
    merkleChallenges: iMerkleChallengeWithDetails<bigint>[];
    approvalId: string;
    denom: string;
    t?: TFunction;
  }) => {
    const id = approvalId;
    const tokenIds = [{ start: 1n, end: 1n }];

    const maxNumTransfers = merkleChallenges?.[0]?.challengeInfoDetails.challengeDetails.numLeaves ?? 1n;

    return {
      fromListId: 'Mint',
      fromList: AddressList.getReservedAddressList('Mint'),
      toList: AddressList.AllAddresses(),
      toListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: tokenIds,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: id,
      approvalCriteria: {
        merkleChallenges: merkleChallenges,
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [],
        evmQueryChallenges: [],
        coinTransfers:
          rewardUbadgeAmount > 0n
            ? [
                {
                  to: '',
                  overrideFromWithApproverAddress: true,
                  overrideToWithInitiator: true,
                  coins: [
                    {
                      amount: rewardUbadgeAmount,
                      denom: denom
                    }
                  ]
                }
              ]
            : [],
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
            // We override the start balances to be the token ids from the subscription approval
            // This is to get the correct token IDs and amounts. Times will be overridden by the recurring approval
            startBalances: [{ amount: 1n, tokenIds: tokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
            incrementTokenIdsBy: 0n,
            incrementOwnershipTimesBy: 0n,
            durationFromTimestamp: 0n,
            allowOverrideTimestamp: false,
            allowOverrideWithAnyValidToken: false,
            allowAmountScaling: false, maxScalingMultiplier: 0n,
            recurringOwnershipTimes: {
              startTime: 0n,
              intervalLength: 0n,
              //1 week in milliseconds
              chargePeriodLength: 0n
            }
          }
        },
        maxNumTransfers: {
          overallMaxNumTransfers: BigInt(maxNumTransfers),
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
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        overridesFromOutgoingApprovals: true,
        userApprovalSettings: { userRoyalties: {
          percentage: 0n,
          payoutAddress: ''
        } },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      },
      details: {
        name: t('Quests_Approval', { ns: 'common' }),
        description: t('quests_approval_description', { ns: 'common' }),
        image: ''
      },
      version: 0n
    } as iCollectionApprovalWithDetails<bigint>;
  };

  /**
   * Creates a subscription faucet approval for recurring token distribution.
   * Allows users to receive tokens on a recurring basis based on subscription criteria.
   * This is a collection-level approval that governs subscription behavior.
   */
  static subscriptionFaucet = ({
    payouts,
    defaultApprovalToAdd,
    validTokenIds,
    intervalDuration = MONTHLY_MS,
    approvalId,
    mustOwnTokens,
    t = defaultT
  }: {
    payouts: {
      payoutAddress: string;
      ubadgeAmount: bigint;
      denom: string;
    }[];
    defaultApprovalToAdd: RequiredApprovalProps;
    validTokenIds: iUintRange<bigint>[];
    intervalDuration?: bigint;
    approvalId: string;
    mustOwnTokens: iMustOwnTokens<bigint>[] | undefined;
    t?: TFunction;
  }): RequiredApprovalProps => {
    const id = approvalId;
    const toSet: RequiredApprovalProps = {
      ...defaultApprovalToAdd,
      details: {
        ...defaultApprovalToAdd.details,
        name: t('Subscription_Faucet', { ns: 'common' }),
        description: t('subscription_faucet_description', { ns: 'common' })
      },
      initiatedByListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: validTokenIds,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: id,
      approvalCriteria: {
        ...defaultApprovalToAdd.approvalCriteria,
        coinTransfers: payouts.map((payout) => ({
          to: payout.payoutAddress,
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false,
          coins: [
            {
              amount: payout.ubadgeAmount,
              denom: payout.denom
            }
          ]
        })),
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
            startBalances: [{ amount: 1n, tokenIds: validTokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
            incrementTokenIdsBy: 0n,
            incrementOwnershipTimesBy: 0n,

            //monthly in milliseconds
            durationFromTimestamp: intervalDuration ? intervalDuration : MONTHLY_MS,
            allowOverrideTimestamp: true,
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
        mustOwnTokens: mustOwnTokens ?? [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: false,
        userApprovalSettings: { userRoyalties: {
          percentage: 0n,
          payoutAddress: ''
        } },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };

    return toSet;
  };

  /**
   * Creates a smart account "No Questions Asked" tier approval with daily rate limit.
   * This is the basic tier that allows transfers with only a daily rate limit restriction.
   */
  static vaultNoQuestionsApproval = ({
    defaultApprovalToAdd,
    validTokenIds,
    dailyRateLimit,
    approvalId,
    userAddress,
    ibcBackedPathAddress,
    t = defaultT
  }: {
    defaultApprovalToAdd: RequiredApprovalProps;
    validTokenIds: iUintRange<bigint>[];
    dailyRateLimit: bigint;
    approvalId: string;
    userAddress: string;
    ibcBackedPathAddress: string;
    t?: TFunction;
  }): RequiredApprovalProps => {
    const id = approvalId;
    const userAddressList = new AddressList({
      addresses: [userAddress],
      whitelist: true,
      listId: userAddress,
      uri: '',
      customData: ''
    });
    const ibcBackedPathAddressList = new AddressList({
      addresses: [ibcBackedPathAddress],
      whitelist: true,
      listId: ibcBackedPathAddress,
      uri: '',
      customData: ''
    });

    return {
      ...defaultApprovalToAdd,
      fromListId: userAddress,
      fromList: userAddressList,
      toListId: ibcBackedPathAddress,
      toList: ibcBackedPathAddressList,
      initiatedByListId: userAddress,
      initiatedByList: userAddressList,
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: validTokenIds,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: id,
      approvalCriteria: {
        ...defaultApprovalToAdd.approvalCriteria,
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: dailyRateLimit,
          amountTrackerId: id,
          resetTimeIntervals: {
            startTime: getNextMidnightTimestamp(),
            intervalLength: DAILY_MS
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
        userApprovalSettings: { userRoyalties: {
          percentage: 0n,
          payoutAddress: ''
        } },
        mustPrioritize: false,
        allowBackedMinting: true,
        allowSpecialWrapping: false
      },
      details: {
        ...defaultApprovalToAdd.details,
        name: t('No_Questions_Asked_Tier', { ns: 'common' }),
        description: t('no_questions_asked_tier_description', { ns: 'common' })
      },
      version: 0n
    } as RequiredApprovalProps;
  };

  /**
   * Creates a smart account "2FA Tier" approval with daily rate limit and BitBadges claim via merkle challenge.
   * This tier requires 2FA (BitBadges claim) for every transfer, in addition to the daily rate limit.
   */
  static vault2FATierApproval = ({
    defaultApprovalToAdd,
    validTokenIds,
    dailyRateLimit,
    merkleChallenges,
    approvalId,
    userAddress,
    ibcBackedPathAddress,
    t = defaultT
  }: {
    defaultApprovalToAdd: RequiredApprovalProps;
    validTokenIds: iUintRange<bigint>[];
    dailyRateLimit: bigint;
    merkleChallenges: iMerkleChallengeWithDetails<bigint>[];
    approvalId: string;
    userAddress: string;
    ibcBackedPathAddress: string;
    t?: TFunction;
  }): RequiredApprovalProps => {
    const id = approvalId;
    const userAddressList = new AddressList({
      addresses: [userAddress],
      whitelist: true,
      listId: userAddress,
      uri: '',
      customData: ''
    });
    const ibcBackedPathAddressList = new AddressList({
      addresses: [ibcBackedPathAddress],
      whitelist: true,
      listId: ibcBackedPathAddress,
      uri: '',
      customData: ''
    });

    return {
      ...defaultApprovalToAdd,
      fromListId: userAddress,
      fromList: userAddressList,
      toListId: ibcBackedPathAddress,
      toList: ibcBackedPathAddressList,
      initiatedByListId: userAddress,
      initiatedByList: userAddressList,
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: validTokenIds,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: id,
      approvalCriteria: {
        ...defaultApprovalToAdd.approvalCriteria,
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: dailyRateLimit,
          amountTrackerId: id,
          resetTimeIntervals: {
            startTime: getNextMidnightTimestamp(),
            intervalLength: DAILY_MS
          }
        },
        merkleChallenges: merkleChallenges,
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        userApprovalSettings: { userRoyalties: {
          percentage: 0n,
          payoutAddress: ''
        } },
        mustPrioritize: false,
        allowBackedMinting: true,
        allowSpecialWrapping: false
      },
      details: {
        ...defaultApprovalToAdd.details,
        name: t('2FA_Tier', { ns: 'common' }),
        description: t('2fa_tier_description', { ns: 'common' })
      },
      version: 0n
    } as RequiredApprovalProps;
  };

  /**
   * Creates a smart account "Emergency Recovery Protocol" approval with higher daily rate limit and different 2FA criteria.
   * This is the emergency tier with higher limits but still requires 2FA with different criteria.
   */
  static vaultEmergencyRecoveryApproval = ({
    defaultApprovalToAdd,
    validTokenIds,
    dailyRateLimit,
    merkleChallenges,
    approvalId,
    userAddress,
    ibcBackedPathAddress,
    t = defaultT
  }: {
    defaultApprovalToAdd: RequiredApprovalProps;
    validTokenIds: iUintRange<bigint>[];
    dailyRateLimit: bigint;
    merkleChallenges: iMerkleChallengeWithDetails<bigint>[];
    approvalId: string;
    userAddress: string;
    ibcBackedPathAddress: string;
    t?: TFunction;
  }): RequiredApprovalProps => {
    const id = approvalId;
    const userAddressList = new AddressList({
      addresses: [userAddress],
      whitelist: true,
      listId: userAddress,
      uri: '',
      customData: ''
    });
    const ibcBackedPathAddressList = new AddressList({
      addresses: [ibcBackedPathAddress],
      whitelist: true,
      listId: ibcBackedPathAddress,
      uri: '',
      customData: ''
    });

    return {
      ...defaultApprovalToAdd,
      fromListId: userAddress,
      fromList: userAddressList,
      toListId: ibcBackedPathAddress,
      toList: ibcBackedPathAddressList,
      initiatedByListId: userAddress,
      initiatedByList: userAddressList,
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: validTokenIds,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: id,
      approvalCriteria: {
        ...defaultApprovalToAdd.approvalCriteria,
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: dailyRateLimit,
          amountTrackerId: id,
          resetTimeIntervals: {
            startTime: getNextMidnightTimestamp(),
            intervalLength: DAILY_MS
          }
        },
        merkleChallenges: merkleChallenges,
        mustOwnTokens: [],
        dynamicStoreChallenges: [],
        ethSignatureChallenges: [],
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        overridesFromOutgoingApprovals: false,
        overridesToIncomingApprovals: false,
        userApprovalSettings: { userRoyalties: {
          percentage: 0n,
          payoutAddress: ''
        } },
        mustPrioritize: false,
        allowBackedMinting: true,
        allowSpecialWrapping: false
      },
      details: {
        ...defaultApprovalToAdd.details,
        name: t('Emergency_Recovery_Protocol', { ns: 'common' }),
        description: t('emergency_recovery_protocol_description', { ns: 'common' })
      },
      version: 0n
    } as RequiredApprovalProps;
  };

  /**
   * Creates a smart tokens backing approval that allows tokens to be sent from the IBC backed path address.
   * This is for backing purposes (sending tokens from the IBC address).
   */
  static smartAccountBackingApproval = ({
    defaultApprovalToAdd,
    validTokenIds,
    approvalId,
    ibcBackedPathAddress,
    t = defaultT
  }: {
    defaultApprovalToAdd: RequiredApprovalProps;
    validTokenIds: iUintRange<bigint>[];
    approvalId: string;
    ibcBackedPathAddress: string;
    t?: TFunction;
  }): RequiredApprovalProps => {
    // Backing: IBC address can send FROM itself (backing it)
    const bitbadgesAddress = convertToBitBadgesAddress(ibcBackedPathAddress);
    const ibcBackedPathAddressList = new AddressList({
      addresses: [bitbadgesAddress],
      whitelist: true,
      listId: bitbadgesAddress,
      uri: '',
      customData: ''
    });
    const allButIbcAddressListId = `!${bitbadgesAddress}`;

    return {
      ...defaultApprovalToAdd,
      fromListId: bitbadgesAddress,
      fromList: ibcBackedPathAddressList,
      toListId: allButIbcAddressListId,
      toList: AddressList.getReservedAddressList(allButIbcAddressListId),
      initiatedByListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: validTokenIds,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: approvalId,
      approvalCriteria: {
        ...defaultApprovalToAdd.approvalCriteria,
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: 0n,
          amountTrackerId: '',
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
        userApprovalSettings: { userRoyalties: {
          percentage: 0n,
          payoutAddress: ''
        } },
        mustPrioritize: true,
        allowBackedMinting: true,
        allowSpecialWrapping: false
      },
      details: {
        ...defaultApprovalToAdd.details,
        name: t('Smart_Tokens_Backing_Approval', { ns: 'common' }),
        description: t('smart_tokens_backing_approval_description', { ns: 'common' })
      },
      version: 0n
    } as RequiredApprovalProps;
  };

  /**
   * Creates a smart tokens unbacking approval that allows anyone to send tokens to the IBC backed path address.
   * This is for unbacking purposes (sending tokens to the IBC address).
   */
  static smartAccountUnbackingApproval = ({
    defaultApprovalToAdd,
    validTokenIds,
    approvalId,
    ibcBackedPathAddress,
    t = defaultT
  }: {
    defaultApprovalToAdd: RequiredApprovalProps;
    validTokenIds: iUintRange<bigint>[];
    approvalId: string;
    ibcBackedPathAddress: string;
    t?: TFunction;
  }): RequiredApprovalProps => {
    // Unbacking: anyone can send TO the IBC backed path address (unbacking it)
    const bitbadgesAddress = convertToBitBadgesAddress(ibcBackedPathAddress);
    const ibcBackedPathAddressList = new AddressList({
      addresses: [bitbadgesAddress],
      whitelist: true,
      listId: bitbadgesAddress,
      uri: '',
      customData: ''
    });

    const allButMintAndIbcAddressListId = `!Mint:${bitbadgesAddress}`;

    return {
      ...defaultApprovalToAdd,
      fromListId: allButMintAndIbcAddressListId,
      fromList: AddressList.getReservedAddressList(allButMintAndIbcAddressListId),
      toListId: bitbadgesAddress,
      toList: ibcBackedPathAddressList,
      initiatedByListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: validTokenIds,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: approvalId,
      approvalCriteria: {
        ...defaultApprovalToAdd.approvalCriteria,
        approvalAmounts: {
          overallApprovalAmount: 0n,
          perToAddressApprovalAmount: 0n,
          perFromAddressApprovalAmount: 0n,
          perInitiatedByAddressApprovalAmount: 0n,
          amountTrackerId: '',
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
        userApprovalSettings: { userRoyalties: {
          percentage: 0n,
          payoutAddress: ''
        } },
        mustPrioritize: true,
        allowBackedMinting: true,
        allowSpecialWrapping: false
      },
      details: {
        ...defaultApprovalToAdd.details,
        name: t('Smart_Tokens_Unbacking_Approval', { ns: 'common' }),
        description: t('smart_tokens_unbacking_approval_description', { ns: 'common' })
      },
      version: 0n
    } as RequiredApprovalProps;
  };

  // NOTE: custom2FAApproval has been removed from the SDK migration.
  // The 2FA protocol is experimental and depends on frontend-specific code.
  // If needed in the future, it can be re-added once the 2FA protocol stabilizes.
}
