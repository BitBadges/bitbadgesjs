import { AddressList } from '../addressLists.js';
import { UintRangeArray } from '../uintRanges.js';
import { doesCollectionFollowProtocol } from '../quests.js';
import type { RequiredApprovalProps } from '../approval-utils.js';
import type { iUintRange } from '../../interfaces/types/core.js';
import crypto from 'crypto';

const FOREVER: iUintRange<bigint>[] = [{ start: 1n, end: BigInt('18446744073709551615') }];
const TOKEN_BOUNTY: iUintRange<bigint>[] = [{ start: 1n, end: 1n }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

/**
 * Strict validation: does a collection follow the Bounty protocol?
 *
 * Checks:
 * - standards includes "Bounty"
 * - validTokenIds = exactly [{1,1}]
 * - exactly 3 collection approvals
 * - all 3 approvals: fromListId="Mint", toListId=burn address
 * - all 3 approvals: maxNumTransfers.overallMaxNumTransfers = 1
 * - all 3 approvals: overridesFromOutgoingApprovals = true, overridesToIncomingApprovals = true
 * - all 3 approvals: have coinTransfers with overrideFromWithApproverAddress=true
 * - exactly 2 approvals have votingChallenges (accept + deny), 1 has none (expire)
 * - accept + deny have same verifier address
 * - accept + deny transferTimes end at same expiration
 * - expire transferTimes start after that expiration
 * - all coinTransfers use same denom
 * - all coinTransfers have same amount
 */
export function doesCollectionFollowBountyProtocol(collection: any): boolean {
  if (!collection) return false;
  if (!doesCollectionFollowProtocol(collection, 'Bounty')) return false;

  // validTokenIds must be exactly [{1,1}]
  const tokenIds = UintRangeArray.From(collection.validTokenIds ?? []).sortAndMerge().convert(BigInt);
  if (tokenIds.length !== 1 || tokenIds[0]?.start !== 1n || tokenIds[0]?.end !== 1n) return false;

  const approvals = collection.collectionApprovals ?? [];
  if (approvals.length !== 3) return false;

  // All approvals must be Mint → burn
  for (const a of approvals) {
    if (a.fromListId !== 'Mint') return false;
    if (a.toListId !== BURN_ADDRESS) return false;
    if (!a.approvalCriteria) return false;
    if (!a.approvalCriteria.overridesFromOutgoingApprovals) return false;
    if (!a.approvalCriteria.overridesToIncomingApprovals) return false;

    // maxNumTransfers must be 1
    const maxTransfers = BigInt(a.approvalCriteria.maxNumTransfers?.overallMaxNumTransfers ?? 0);
    if (maxTransfers !== 1n) return false;

    // Must have coinTransfers with escrow override
    const ct = a.approvalCriteria.coinTransfers;
    if (!ct || ct.length !== 1) return false;
    if (!ct[0].overrideFromWithApproverAddress) return false;
    if (ct[0].overrideToWithInitiator) return false;
    if (!ct[0].coins?.length || !ct[0].to) return false;
  }

  // Exactly 2 with votingChallenges, 1 without
  const withVoting = approvals.filter((a: any) => (a.approvalCriteria.votingChallenges?.length ?? 0) > 0);
  const withoutVoting = approvals.filter((a: any) => (a.approvalCriteria.votingChallenges?.length ?? 0) === 0);
  if (withVoting.length !== 2 || withoutVoting.length !== 1) return false;

  // Both voting approvals must have same verifier
  const verifier0 = withVoting[0].approvalCriteria.votingChallenges[0]?.voters?.[0]?.address;
  const verifier1 = withVoting[1].approvalCriteria.votingChallenges[0]?.voters?.[0]?.address;
  if (!verifier0 || verifier0 !== verifier1) return false;

  // All coinTransfers must use same denom and amount
  const denoms = approvals.map((a: any) => a.approvalCriteria.coinTransfers[0].coins[0].denom);
  if (new Set(denoms).size !== 1) return false;
  const amounts = approvals.map((a: any) => BigInt(a.approvalCriteria.coinTransfers[0].coins[0].amount));
  if (new Set(amounts.map(String)).size !== 1) return false;

  // Accept/deny must have different payout addresses (one to recipient, one to submitter)
  const votingPayoutAddresses = withVoting.map((a: any) => a.approvalCriteria.coinTransfers[0].to);
  if (votingPayoutAddresses[0] === votingPayoutAddresses[1]) return false;

  // Expire payout must match one of the voting payouts (the submitter)
  const expirePayout = withoutVoting[0].approvalCriteria.coinTransfers[0].to;
  if (!votingPayoutAddresses.includes(expirePayout)) return false;

  return true;
}

interface BountyParams {
  submitterAddress: string;
  recipientAddress: string;
  verifierAddress: string;
  depositDenom: string;
  depositAmount: bigint;
  expirationTime: bigint; // ms timestamp — accept/deny before, expire after
}

const defaultChecks = { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false };
const zeroResetIntervals = { startTime: 0n, intervalLength: 0n };

function defaultApprovalAmounts(trackerId: string) {
  return {
    overallApprovalAmount: 0n,
    perFromAddressApprovalAmount: 0n,
    perToAddressApprovalAmount: 0n,
    perInitiatedByAddressApprovalAmount: 0n,
    amountTrackerId: trackerId,
    resetTimeIntervals: zeroResetIntervals
  };
}

/** Mint 1x token ID 1 directly to burn — token is just a vehicle for the approval engine */
function mintToBurnBalances() {
  return {
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
      startBalances: [{ amount: 1n, tokenIds: TOKEN_BOUNTY, ownershipTimes: UintRangeArray.FullRanges() }],
      incrementTokenIdsBy: 0n,
      incrementOwnershipTimesBy: 0n,
      durationFromTimestamp: 0n,
      allowOverrideTimestamp: false,
      allowOverrideWithAnyValidToken: false,
      allowAmountScaling: false,
      maxScalingMultiplier: 0n,
      recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
    }
  };
}

const defaultAutoDeletion = { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false };
const defaultAltTimeChecks = { offlineHours: [], offlineDays: [] };
const defaultRoyalties = { percentage: 0n, payoutAddress: '' };
const emptyArrayFields = {
  merkleChallenges: [] as any[],
  mustOwnTokens: [] as any[],
  dynamicStoreChallenges: [] as any[],
  ethSignatureChallenges: [] as any[],
  evmQueryChallenges: [] as any[],
};

function maxOneTransfer(trackerId: string) {
  return {
    overallMaxNumTransfers: 1n,
    perToAddressMaxNumTransfers: 0n,
    perFromAddressMaxNumTransfers: 0n,
    perInitiatedByAddressMaxNumTransfers: 0n,
    amountTrackerId: trackerId,
    resetTimeIntervals: zeroResetIntervals
  };
}

/**
 * Builds the 3 collection-level approvals for a bounty.
 * Each approval mints 1x token ID 1 from Mint → burn as a vehicle
 * to trigger the coinTransfer. Escrow is pre-funded at creation.
 *
 * 1. Accept: verifier votes → mint-to-burn → coins to recipient
 * 2. Deny: verifier votes → mint-to-burn → coins to submitter
 * 3. Expire: after expiration → mint-to-burn → coins to submitter
 */
export class BountyRegistry {
  /** Accept: verifier votes → mint token to burn → coins to recipient */
  static acceptApproval(params: BountyParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    const proposalId = `bounty-accept-${id}`;
    return {
      details: { name: 'Accept', description: 'Verifier accepts bounty — payout to recipient', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: params.expirationTime }],
      tokenIds: TOKEN_BOUNTY,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: proposalId,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [{
          to: params.recipientAddress,
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: false,
          coins: [{ denom: params.depositDenom, amount: params.depositAmount }]
        }],
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: maxOneTransfer(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
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
        autoDeletionOptions: defaultAutoDeletion,
        altTimeChecks: defaultAltTimeChecks,
        userApprovalSettings: { userRoyalties: defaultRoyalties },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Deny: verifier votes → mint token to burn → coins back to submitter */
  static denyApproval(params: BountyParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    const proposalId = `bounty-deny-${id}`;
    return {
      details: { name: 'Deny', description: 'Verifier denies bounty — refund to submitter', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: params.expirationTime }],
      tokenIds: TOKEN_BOUNTY,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: proposalId,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [{
          to: params.submitterAddress,
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: false,
          coins: [{ denom: params.depositDenom, amount: params.depositAmount }]
        }],
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: maxOneTransfer(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
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
        autoDeletionOptions: defaultAutoDeletion,
        altTimeChecks: defaultAltTimeChecks,
        userApprovalSettings: { userRoyalties: defaultRoyalties },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Expire: after expiration → mint token to burn → coins back to submitter (no vote) */
  static expireApproval(params: BountyParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Expire', description: 'Bounty expired — refund to submitter', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: [{ start: params.expirationTime + 1n, end: BigInt('18446744073709551615') }],
      tokenIds: TOKEN_BOUNTY,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `bounty-expire-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [{
          to: params.submitterAddress,
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: false,
          coins: [{ denom: params.depositDenom, amount: params.depositAmount }]
        }],
        predeterminedBalances: mintToBurnBalances(),
        maxNumTransfers: maxOneTransfer(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        autoDeletionOptions: defaultAutoDeletion,
        altTimeChecks: defaultAltTimeChecks,
        userApprovalSettings: { userRoyalties: defaultRoyalties },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Build all 3 approvals for a bounty */
  static allApprovals(params: BountyParams): RequiredApprovalProps[] {
    return [
      this.acceptApproval(params),
      this.denyApproval(params),
      this.expireApproval(params)
    ];
  }

  /** Fully frozen permissions — nothing can change after creation */
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
