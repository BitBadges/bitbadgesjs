import { BitBadgesAddress, ClaimIntegrationPluginType, ClaimReward, CreateClaimRequest, IntegrationPluginDetails, UNIXMilliTimestamp, iChallengeTrackerIdDetails, iClaimCachePolicy, iClaimDetails, iSatisfyMethod } from '@/api-indexer/docs-types/interfaces.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';
import { BaseNumberTypeClass, ConvertOptions, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes, deepCopyPrimitives } from '@/common/base.js';
import type { iAddressChecks, iAltTimeChecks, iApprovalAmounts, iApprovalCriteria, iAutoDeletionOptions, iCollectionApproval, iDynamicStoreChallenge, iIncomingApprovalCriteria, iIncrementedBalances, iManualBalances, iMaxNumTransfers, iOutgoingApprovalCriteria, iPredeterminedBalances, iPredeterminedOrderCalculationMethod, iRecurringOwnershipTimes, iResetTimeIntervals, iUserIncomingApproval, iUserIncomingApprovalWithDetails, iUserOutgoingApproval, iUserRoyalties } from '@/interfaces/types/approvals.js';
import type { CollectionId, iAddressList, iMerkleChallenge } from '@/interfaces/types/core.js';
import * as protobadges from '@/proto/badges/index.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type MerkleTree from 'merkletreejs';
import type { Options as MerkleTreeJsOptions } from 'merkletreejs/dist/MerkleTree';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers.js';
import { AddressList, convertListIdToBech32 } from './addressLists.js';
import { Balance, BalanceArray } from './balances.js';
import { CoinTransfer, ETHSignatureChallenge, MerkleChallenge, MustOwnTokens, VotingChallenge } from './misc.js';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps.js';
import { GetListIdWithOptions, GetListWithOptions, GetUintRangesWithOptions, getOverlapsAndNonOverlaps } from './overlaps.js';
import type { CollectionApprovalPermissionWithDetails } from './permissions.js';
import { CollectionApprovalPermission } from './permissions.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { AllDefaultValues, getPotentialUpdatesForTimelineValues, getUpdateCombinationsToCheck } from './validate-utils.js';

const { getReservedAddressList, getReservedTrackerList } = AddressList;

/**
 * @inheritDoc iClaimCachePolicy
 * @category Indexer
 */
export class ClaimCachePolicy extends BaseNumberTypeClass<ClaimCachePolicy> implements iClaimCachePolicy {
  ttl?: string | number;
  alwaysPermanent?: boolean;
  permanentAfter?: UNIXMilliTimestamp;

  constructor(data: iClaimCachePolicy) {
    super();
    this.ttl = data.ttl;
    this.alwaysPermanent = data.alwaysPermanent;
    this.permanentAfter = data.permanentAfter;
  }

  getNumberFieldNames(): string[] {
    return ['ttl', 'permanentAfter'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ClaimCachePolicy {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimCachePolicy;
  }
}

/**
 * @inheritDoc iChallengeTrackerIdDetails
 * @category Approvals / Transferability
 */
export class ChallengeTrackerIdDetails extends BaseNumberTypeClass<ChallengeTrackerIdDetails> implements iChallengeTrackerIdDetails {
  collectionId: CollectionId;
  approvalId: string;
  challengeTrackerId: string;
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  approverAddress: BitBadgesAddress;

  constructor(data: iChallengeTrackerIdDetails) {
    super();
    this.collectionId = data.collectionId;
    this.challengeTrackerId = data.challengeTrackerId;
    this.approvalId = data.approvalId;
    this.approvalLevel = data.approvalLevel;
    this.approverAddress = data.approverAddress;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ChallengeTrackerIdDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ChallengeTrackerIdDetails;
  }
}

/**
 * @inheritDoc iSatisfyMethod
 * @category Indexer
 */
export class SatisfyMethod implements iSatisfyMethod {
  type: 'AND' | 'OR' | 'NOT';
  conditions: Array<string | SatisfyMethod>;
  options?: {
    minNumSatisfied?: number;
  };

  constructor(data: iSatisfyMethod) {
    this.type = data.type;
    this.options = data.options;
    this.conditions = data.conditions.map((condition) => (condition instanceof SatisfyMethod ? new SatisfyMethod(condition) : condition));
  }
}

/**
 * @inheritDoc iClaimDetails
 * @category API Requests / Responses
 */
export class ClaimDetails extends BaseNumberTypeClass<ClaimDetails> implements iClaimDetails {
  claimId: string;
  plugins: IntegrationPluginDetails[];
  manualDistribution?: boolean;
  approach?: string;
  seedCode?: string | undefined;
  metadata?: Metadata | undefined;
  assignMethod?: string | undefined;
  satisfyMethod?: SatisfyMethod;
  lastUpdated?: T | undefined;
  version: string | number;
  collectionId?: CollectionId;
  standaloneClaim?: boolean;
  rewards?: ClaimReward[];
  estimatedCost?: string;
  estimatedTime?: string;
  showInSearchResults?: boolean;
  categories?: string[];
  trackerDetails?: ChallengeTrackerIdDetails;
  createdBy?: BitBadgesAddress;
  managedBy?: BitBadgesAddress;
  _includesPrivateParams: boolean;
  _templateInfo?: {
    supportedApproaches?: string[];
    pluginId?: string;
    completedTemplateStep?: boolean;
  };
  cachePolicy?: ClaimCachePolicy;

  constructor(data: iClaimDetails) {
    super();
    this._templateInfo = data._templateInfo;
    this._includesPrivateParams = data._includesPrivateParams;
    this.claimId = data.claimId;
    this.plugins = data.plugins;
    this.manualDistribution = data.manualDistribution;
    this.approach = data.approach;
    this.seedCode = data.seedCode;
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.assignMethod = data.assignMethod;
    this.lastUpdated = data.lastUpdated;
    this.version = data.version;
    this.collectionId = data.collectionId;
    this.standaloneClaim = data.standaloneClaim;
    this.rewards = data.rewards?.map((reward) => new ClaimReward(reward));
    this.estimatedCost = data.estimatedCost;
    this.estimatedTime = data.estimatedTime;
    this.showInSearchResults = data.showInSearchResults;
    this.categories = data.categories;
    this.satisfyMethod = data.satisfyMethod ? new SatisfyMethod(data.satisfyMethod) : undefined;
    this.trackerDetails = data.trackerDetails ? new ChallengeTrackerIdDetails(data.trackerDetails) : undefined;
    this.createdBy = data.createdBy;
    this.managedBy = data.managedBy;
    this.cachePolicy = data.cachePolicy ? new ClaimCachePolicy(data.cachePolicy) : undefined;
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): ClaimDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimDetails;
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdated', 'version'];
  }
}

/**
 * UserOutgoingApproval defines the rules for the approval of an outgoing transfer from a user.
 *
 * @category Approvals / Transferability
 */
export class UserOutgoingApproval extends BaseNumberTypeClass<UserOutgoingApproval> implements iUserOutgoingApproval {
  toListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray;
  tokenIds: UintRangeArray;
  ownershipTimes: UintRangeArray;
  approvalId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: OutgoingApprovalCriteria;
  version: string | number;

  constructor(msg: iUserOutgoingApproval) {
    super();
    this.toListId = msg.toListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.tokenIds = UintRangeArray.From(msg.tokenIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.uri = msg.uri;
    this.customData = msg.customData;
    this.approvalCriteria = msg.approvalCriteria ? new OutgoingApprovalCriteria(msg.approvalCriteria) : undefined;
    this.version = msg.version;
  }

  getNumberFieldNames(): string[] {
    return ['version'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UserOutgoingApproval {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserOutgoingApproval;
  }

  toProto(): protobadges.UserOutgoingApproval {
    return new protobadges.UserOutgoingApproval(this.convert(Stringify) as any);
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): UserOutgoingApproval {
    return UserOutgoingApproval.fromProto(protobadges.UserOutgoingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): UserOutgoingApproval {
    return UserOutgoingApproval.fromProto(protobadges.UserOutgoingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.UserOutgoingApproval, convertFunction: (item: string | number) => U): UserOutgoingApproval {
    return new UserOutgoingApproval({
      toListId: item.toListId,
      initiatedByListId: item.initiatedByListId,
      transferTimes: item.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      tokenIds: item.tokenIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: item.approvalId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? OutgoingApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined,
      version: convertFunction(item.version)
    });
  }

  toBech32Addresses(prefix: string): UserOutgoingApproval {
    return new UserOutgoingApproval({
      ...this,
      toListId: convertListIdToBech32(this.toListId, prefix),
      initiatedByListId: convertListIdToBech32(this.initiatedByListId, prefix),
      approvalCriteria: this.approvalCriteria?.toBech32Addresses(prefix)
    });
  }

  castToCollectionTransfer(fromListId: string): CollectionApproval {
    return new CollectionApproval({
      ...this,
      fromListId,
      approvalCriteria: this.approvalCriteria?.castToCollectionApprovalCriteria()
    });
  }
}

/**
 * OutgoingApprovalCriteria represents the details of an outgoing approval.
 *
 * @category Approvals / Transferability
 */
export class OutgoingApprovalCriteria extends BaseNumberTypeClass<OutgoingApprovalCriteria> implements iOutgoingApprovalCriteria {
  merkleChallenges?: MerkleChallenge[];
  mustOwnTokens?: MustOwnTokens[];
  predeterminedBalances?: PredeterminedBalances;
  approvalAmounts?: ApprovalAmounts;
  maxNumTransfers?: MaxNumTransfers;
  autoDeletionOptions?: AutoDeletionOptions;

  requireToEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;
  coinTransfers?: CoinTransfer[] | undefined;
  dynamicStoreChallenges?: DynamicStoreChallenge[];
  ethSignatureChallenges?: ETHSignatureChallenge[];
  recipientChecks?: AddressChecks;
  initiatorChecks?: AddressChecks;
  altTimeChecks?: AltTimeChecks;
  mustPrioritize?: boolean;
  votingChallenges?: VotingChallenge[];

  constructor(msg: iOutgoingApprovalCriteria) {
    super();
    this.merkleChallenges = msg.merkleChallenges?.map((x) => new MerkleChallenge(x));
    this.mustOwnTokens = msg.mustOwnTokens?.map((x) => new MustOwnTokens(x));
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireToEqualsInitiatedBy = msg.requireToEqualsInitiatedBy;
    this.requireToDoesNotEqualInitiatedBy = msg.requireToDoesNotEqualInitiatedBy;
    this.autoDeletionOptions = msg.autoDeletionOptions ? new AutoDeletionOptions(msg.autoDeletionOptions) : undefined;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
    this.dynamicStoreChallenges = msg.dynamicStoreChallenges?.map((x) => new DynamicStoreChallenge(x));
    this.ethSignatureChallenges = msg.ethSignatureChallenges?.map((x) => new ETHSignatureChallenge(x));
    this.recipientChecks = msg.recipientChecks ? new AddressChecks(msg.recipientChecks) : undefined;
    this.initiatorChecks = msg.initiatorChecks ? new AddressChecks(msg.initiatorChecks) : undefined;
    this.altTimeChecks = msg.altTimeChecks ? new AltTimeChecks(msg.altTimeChecks) : undefined;
    this.mustPrioritize = msg.mustPrioritize;
    this.votingChallenges = msg.votingChallenges?.map((x) => new VotingChallenge(x));
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): OutgoingApprovalCriteria {
    return new OutgoingApprovalCriteria({
      merkleChallenges: this.merkleChallenges?.map((x) => x.convert(convertFunction)),
      mustOwnTokens: this.mustOwnTokens?.map((x) => x.convert(convertFunction)),
      predeterminedBalances: this.predeterminedBalances?.convert(convertFunction),
      approvalAmounts: this.approvalAmounts?.convert(convertFunction),
      maxNumTransfers: this.maxNumTransfers?.convert(convertFunction),
      requireToEqualsInitiatedBy: this.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: this.requireToDoesNotEqualInitiatedBy,
      autoDeletionOptions: this.autoDeletionOptions?.convert(convertFunction),
      coinTransfers: this.coinTransfers?.map((x) => x.convert(convertFunction)),
      dynamicStoreChallenges: this.dynamicStoreChallenges?.map((x) => x.convert(convertFunction)),
      ethSignatureChallenges: this.ethSignatureChallenges,
      recipientChecks: this.recipientChecks?.convert(convertFunction),
      initiatorChecks: this.initiatorChecks?.convert(convertFunction),
      altTimeChecks: this.altTimeChecks?.convert(convertFunction),
      mustPrioritize: this.mustPrioritize
    });
  }

  toProto(): protobadges.OutgoingApprovalCriteria {
    return new protobadges.OutgoingApprovalCriteria(this.convert(Stringify) as any);
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): OutgoingApprovalCriteria {
    return OutgoingApprovalCriteria.fromProto(protobadges.OutgoingApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): OutgoingApprovalCriteria {
    return OutgoingApprovalCriteria.fromProto(protobadges.OutgoingApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.OutgoingApprovalCriteria, convertFunction: (item: string | number) => U): OutgoingApprovalCriteria {
    return new OutgoingApprovalCriteria({
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      mustOwnTokens: item.mustOwnTokens.map((x) => MustOwnTokens.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      autoDeletionOptions: item.autoDeletionOptions ? AutoDeletionOptions.fromProto(item.autoDeletionOptions, convertFunction) : undefined,
      requireToEqualsInitiatedBy: item.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: item.requireToDoesNotEqualInitiatedBy,
      coinTransfers: item.coinTransfers ? item.coinTransfers.map((x) => CoinTransfer.fromProto(x, convertFunction)) : undefined,
      dynamicStoreChallenges: item.dynamicStoreChallenges ? item.dynamicStoreChallenges.map((x) => DynamicStoreChallenge.fromProto(x, convertFunction)) : undefined,
      ethSignatureChallenges: item.ethSignatureChallenges ? item.ethSignatureChallenges.map((x) => ETHSignatureChallenge.fromProto(x)) : undefined,
      recipientChecks: item.recipientChecks ? AddressChecks.fromProto(item.recipientChecks) : undefined,
      initiatorChecks: item.initiatorChecks ? AddressChecks.fromProto(item.initiatorChecks) : undefined,
      altTimeChecks: item.altTimeChecks ? AltTimeChecks.fromProto(item.altTimeChecks, convertFunction) : undefined,
      mustPrioritize: item.mustPrioritize,
      votingChallenges: item.votingChallenges ? item.votingChallenges.map((x) => VotingChallenge.fromProto(x, convertFunction)) : undefined
    });
  }

  castToCollectionApprovalCriteria(): ApprovalCriteria {
    return new ApprovalCriteria({
      predeterminedBalances: this.predeterminedBalances,
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      autoDeletionOptions: this.autoDeletionOptions,
      requireToEqualsInitiatedBy: this.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: this.requireToDoesNotEqualInitiatedBy,
      merkleChallenges: this.merkleChallenges,
      mustOwnTokens: this.mustOwnTokens,
      coinTransfers: this.coinTransfers,
      dynamicStoreChallenges: this.dynamicStoreChallenges,
      ethSignatureChallenges: this.ethSignatureChallenges,
      recipientChecks: this.recipientChecks,
      initiatorChecks: this.initiatorChecks,
      altTimeChecks: this.altTimeChecks,
      mustPrioritize: this.mustPrioritize,
      votingChallenges: this.votingChallenges,

      requireFromEqualsInitiatedBy: false,
      requireFromDoesNotEqualInitiatedBy: false,
      overridesFromOutgoingApprovals: false,
      overridesToIncomingApprovals: false
    });
  }

  toBech32Addresses(prefix: string): OutgoingApprovalCriteria {
    return new OutgoingApprovalCriteria({
      ...this,
      coinTransfers: this.coinTransfers?.map((x) => x.toBech32Addresses(prefix))
    });
  }
}

/**
 * PredeterminedBalances represents the predetermined balances for an approval.
 * This allows you to define an approval where Transfer A happens first, then Transfer B, then Transfer C, etc.
 * The order of the transfers is defined by the orderCalculationMethod. The order number 0 represents the first transfer, 1 represents the second transfer, etc.
 *
 * IMPORTANT: if the balances of the transfer do not exactly match the predetermined balances, then the transfer will fail.
 *
 * @category Approvals / Transferability
 */
export class PredeterminedBalances extends BaseNumberTypeClass<PredeterminedBalances> implements iPredeterminedBalances {
  manualBalances: ManualBalances[];
  incrementedBalances: IncrementedBalances;
  orderCalculationMethod: PredeterminedOrderCalculationMethod;

  constructor(msg: iPredeterminedBalances) {
    super();
    this.manualBalances = msg.manualBalances.map((x) => new ManualBalances(x));
    this.incrementedBalances = new IncrementedBalances(msg.incrementedBalances);
    this.orderCalculationMethod = new PredeterminedOrderCalculationMethod(msg.orderCalculationMethod);
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PredeterminedBalances {
    return new PredeterminedBalances(
      deepCopyPrimitives({
        manualBalances: this.manualBalances.map((x) => x.convert(convertFunction)),
        incrementedBalances: this.incrementedBalances.convert(convertFunction),
        orderCalculationMethod: this.orderCalculationMethod
      })
    );
  }

  toProto(): protobadges.PredeterminedBalances {
    return new protobadges.PredeterminedBalances(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): PredeterminedBalances {
    return PredeterminedBalances.fromProto(protobadges.PredeterminedBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): PredeterminedBalances {
    return PredeterminedBalances.fromProto(protobadges.PredeterminedBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.PredeterminedBalances, convertFunction: (item: string | number) => U): PredeterminedBalances {
    return new PredeterminedBalances({
      manualBalances: item.manualBalances.map((x) => ManualBalances.fromProto(x, convertFunction)),
      incrementedBalances: item.incrementedBalances
        ? IncrementedBalances.fromProto(item.incrementedBalances, convertFunction)
        : new IncrementedBalances({
            startBalances: [],
            incrementTokenIdsBy: convertFunction(0),
            incrementOwnershipTimesBy: convertFunction(0),
            durationFromTimestamp: convertFunction(0),
            allowOverrideTimestamp: false,
            recurringOwnershipTimes: new RecurringOwnershipTimes({ startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }).convert(convertFunction),
            allowOverrideWithAnyValidToken: false
          }),
      orderCalculationMethod: item.orderCalculationMethod
        ? PredeterminedOrderCalculationMethod.fromProto(item.orderCalculationMethod)
        : new PredeterminedOrderCalculationMethod({
            useOverallNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerToAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
            useMerkleChallengeLeafIndex: false,
            challengeTrackerId: ''
          })
    });
  }
}

/**
 * ManualBalances represents predetermined manually specified balances for transfers of an approval with predetermined balances.
 *
 * @category Approvals / Transferability
 */
export class ManualBalances extends BaseNumberTypeClass<ManualBalances> implements iManualBalances {
  /** The list of balances for each transfer. Order number corresponds to the index of the balance in the array. */
  balances: BalanceArray;

  constructor(msg: iManualBalances) {
    super();
    this.balances = BalanceArray.From(msg.balances);
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ManualBalances {
    return new ManualBalances(
      deepCopyPrimitives({
        balances: this.balances.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): protobadges.ManualBalances {
    return new protobadges.ManualBalances(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ManualBalances {
    return ManualBalances.fromProto(protobadges.ManualBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ManualBalances {
    return ManualBalances.fromProto(protobadges.ManualBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.ManualBalances, convertFunction: (item: string | number) => U): ManualBalances {
    return new ManualBalances({
      balances: item.balances.map((x) => Balance.fromProto(x, convertFunction))
    });
  }
}

/**
 * RecurringOwnershipTimes represents the recurring ownership times for an approval.
 *
 * @category Approvals / Transferability
 */
export class RecurringOwnershipTimes extends BaseNumberTypeClass<RecurringOwnershipTimes> implements iRecurringOwnershipTimes {
  startTime: string | number;
  intervalLength: string | number;
  chargePeriodLength: string | number;

  constructor(msg: iRecurringOwnershipTimes) {
    super();
    this.startTime = msg.startTime;
    this.intervalLength = msg.intervalLength;
    this.chargePeriodLength = msg.chargePeriodLength;
  }

  getNumberFieldNames(): string[] {
    return ['startTime', 'intervalLength', 'chargePeriodLength'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): RecurringOwnershipTimes {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as RecurringOwnershipTimes;
  }

  toProto(): protobadges.RecurringOwnershipTimes {
    return new protobadges.RecurringOwnershipTimes(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): RecurringOwnershipTimes {
    return RecurringOwnershipTimes.fromProto(protobadges.RecurringOwnershipTimes.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): RecurringOwnershipTimes {
    return RecurringOwnershipTimes.fromProto(protobadges.RecurringOwnershipTimes.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.RecurringOwnershipTimes, convertFunction: (item: string | number) => U): RecurringOwnershipTimes {
    return new RecurringOwnershipTimes({
      startTime: convertFunction(item.startTime),
      intervalLength: convertFunction(item.intervalLength),
      chargePeriodLength: convertFunction(item.chargePeriodLength)
    });
  }
}

/**
 * IncrementedBalances represents predetermined incremented balances for transfers of an approval.
 * You can define a starting balance and increment the token IDs and owned times by a certain amount.
 *
 * @category Approvals / Transferability
 */
export class IncrementedBalances extends BaseNumberTypeClass<IncrementedBalances> implements iIncrementedBalances {
  startBalances: BalanceArray;
  incrementTokenIdsBy: string | number;
  incrementOwnershipTimesBy: string | number;
  durationFromTimestamp: string | number;
  allowOverrideTimestamp: boolean;
  recurringOwnershipTimes: RecurringOwnershipTimes;
  allowOverrideWithAnyValidToken: boolean;

  constructor(msg: iIncrementedBalances) {
    super();
    this.startBalances = BalanceArray.From(msg.startBalances);
    this.incrementTokenIdsBy = msg.incrementTokenIdsBy;
    this.incrementOwnershipTimesBy = msg.incrementOwnershipTimesBy;
    this.durationFromTimestamp = msg.durationFromTimestamp;
    this.allowOverrideTimestamp = msg.allowOverrideTimestamp;
    this.recurringOwnershipTimes = new RecurringOwnershipTimes(msg.recurringOwnershipTimes);
    this.allowOverrideWithAnyValidToken = msg.allowOverrideWithAnyValidToken;
  }

  getNumberFieldNames(): string[] {
    return ['incrementTokenIdsBy', 'incrementOwnershipTimesBy', 'durationFromTimestamp'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): IncrementedBalances {
    return new IncrementedBalances(
      deepCopyPrimitives({
        startBalances: this.startBalances.map((x) => x.convert(convertFunction)),
        incrementTokenIdsBy: convertFunction(this.incrementTokenIdsBy),
        incrementOwnershipTimesBy: convertFunction(this.incrementOwnershipTimesBy),
        durationFromTimestamp: convertFunction(this.durationFromTimestamp),
        allowOverrideTimestamp: this.allowOverrideTimestamp,
        recurringOwnershipTimes: this.recurringOwnershipTimes.convert(convertFunction),
        allowOverrideWithAnyValidToken: this.allowOverrideWithAnyValidToken
      })
    );
  }

  toProto(): protobadges.IncrementedBalances {
    return new protobadges.IncrementedBalances(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): IncrementedBalances {
    return IncrementedBalances.fromProto(protobadges.IncrementedBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): IncrementedBalances {
    return IncrementedBalances.fromProto(protobadges.IncrementedBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.IncrementedBalances, convertFunction: (item: string | number) => U): IncrementedBalances {
    return new IncrementedBalances({
      startBalances: item.startBalances.map((x) => Balance.fromProto(x, convertFunction)),
      incrementTokenIdsBy: convertFunction(item.incrementTokenIdsBy),
      incrementOwnershipTimesBy: convertFunction(item.incrementOwnershipTimesBy),
      durationFromTimestamp: convertFunction(item.durationFromTimestamp),
      allowOverrideTimestamp: item.allowOverrideTimestamp,
      allowOverrideWithAnyValidToken: item.allowOverrideWithAnyValidToken,
      recurringOwnershipTimes: item.recurringOwnershipTimes ? new RecurringOwnershipTimes(item.recurringOwnershipTimes).convert(convertFunction) : new RecurringOwnershipTimes({ startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }).convert(convertFunction)
    });
  }
}

/**
 * PredeterminedOrderCalculationMethod represents the order calculation method for the predetermined balances. Only one option can be set to true.
 * For manual balances, the order number corresponds to the index of the balance in the array.
 * For incremented balances, the order number corresponds to the number of times we increment.
 *
 * @category Approvals / Transferability
 */
export class PredeterminedOrderCalculationMethod extends CustomTypeClass<PredeterminedOrderCalculationMethod> implements iPredeterminedOrderCalculationMethod {
  useOverallNumTransfers: boolean;
  usePerToAddressNumTransfers: boolean;
  usePerFromAddressNumTransfers: boolean;
  usePerInitiatedByAddressNumTransfers: boolean;
  useMerkleChallengeLeafIndex: boolean;
  challengeTrackerId: string;

  constructor(msg: iPredeterminedOrderCalculationMethod) {
    super();
    this.useOverallNumTransfers = msg.useOverallNumTransfers;
    this.usePerToAddressNumTransfers = msg.usePerToAddressNumTransfers;
    this.usePerFromAddressNumTransfers = msg.usePerFromAddressNumTransfers;
    this.usePerInitiatedByAddressNumTransfers = msg.usePerInitiatedByAddressNumTransfers;
    this.useMerkleChallengeLeafIndex = msg.useMerkleChallengeLeafIndex;
    this.challengeTrackerId = msg.challengeTrackerId;
  }

  toProto(): protobadges.PredeterminedOrderCalculationMethod {
    return new protobadges.PredeterminedOrderCalculationMethod(this.toJson());
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PredeterminedOrderCalculationMethod {
    return PredeterminedOrderCalculationMethod.fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PredeterminedOrderCalculationMethod {
    return PredeterminedOrderCalculationMethod.fromJsonString(jsonString, options);
  }

  static fromProto(item: protobadges.PredeterminedOrderCalculationMethod): PredeterminedOrderCalculationMethod {
    return new PredeterminedOrderCalculationMethod({
      useOverallNumTransfers: item.useOverallNumTransfers,
      usePerToAddressNumTransfers: item.usePerToAddressNumTransfers,
      usePerFromAddressNumTransfers: item.usePerFromAddressNumTransfers,
      usePerInitiatedByAddressNumTransfers: item.usePerInitiatedByAddressNumTransfers,
      useMerkleChallengeLeafIndex: item.useMerkleChallengeLeafIndex,
      challengeTrackerId: item.challengeTrackerId
    });
  }
}

/**
 * ApprovalAmounts represents the maximum approved amounts for the token IDs / ownership times of this approval.
 * Can be set to 0 to represent an unlimited amount is approved.
 * If set to non-zero value, we track the running tally of the amount approved for each token ID / ownership time.
 * Once it reaches the max, no more transfers are allowed.
 *
 * Note that we only track the approval amounts if the approval is defined and not unlimited. If it is unlimited, we do not tally.
 *
 * @category Approvals / Transferability
 */
export class ApprovalAmounts extends BaseNumberTypeClass<ApprovalAmounts> implements iApprovalAmounts {
  overallApprovalAmount: string | number;
  perToAddressApprovalAmount: string | number;
  perFromAddressApprovalAmount: string | number;
  perInitiatedByAddressApprovalAmount: string | number;
  amountTrackerId: string;
  resetTimeIntervals: ResetTimeIntervals;

  constructor(msg: iApprovalAmounts) {
    super();
    this.overallApprovalAmount = msg.overallApprovalAmount;
    this.perToAddressApprovalAmount = msg.perToAddressApprovalAmount;
    this.perFromAddressApprovalAmount = msg.perFromAddressApprovalAmount;
    this.perInitiatedByAddressApprovalAmount = msg.perInitiatedByAddressApprovalAmount;
    this.amountTrackerId = msg.amountTrackerId;
    this.resetTimeIntervals = new ResetTimeIntervals(msg.resetTimeIntervals);
  }

  getNumberFieldNames(): string[] {
    return ['overallApprovalAmount', 'perToAddressApprovalAmount', 'perFromAddressApprovalAmount', 'perInitiatedByAddressApprovalAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ApprovalAmounts {
    return new ApprovalAmounts(
      deepCopyPrimitives({
        overallApprovalAmount: convertFunction(this.overallApprovalAmount),
        perToAddressApprovalAmount: convertFunction(this.perToAddressApprovalAmount),
        perFromAddressApprovalAmount: convertFunction(this.perFromAddressApprovalAmount),
        perInitiatedByAddressApprovalAmount: convertFunction(this.perInitiatedByAddressApprovalAmount),
        amountTrackerId: this.amountTrackerId,
        resetTimeIntervals: this.resetTimeIntervals.convert(convertFunction, options)
      })
    );
  }

  toProto(): protobadges.ApprovalAmounts {
    return new protobadges.ApprovalAmounts(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ApprovalAmounts {
    return ApprovalAmounts.fromProto(protobadges.ApprovalAmounts.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ApprovalAmounts {
    return ApprovalAmounts.fromProto(protobadges.ApprovalAmounts.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.ApprovalAmounts, convertFunction: (item: string | number) => U): ApprovalAmounts {
    return new ApprovalAmounts({
      overallApprovalAmount: convertFunction(item.overallApprovalAmount),
      perToAddressApprovalAmount: convertFunction(item.perToAddressApprovalAmount),
      perFromAddressApprovalAmount: convertFunction(item.perFromAddressApprovalAmount),
      perInitiatedByAddressApprovalAmount: convertFunction(item.perInitiatedByAddressApprovalAmount),
      amountTrackerId: item.amountTrackerId,
      resetTimeIntervals: item.resetTimeIntervals ? new ResetTimeIntervals(item.resetTimeIntervals).convert(convertFunction) : new ResetTimeIntervals({ startTime: 0n, intervalLength: 0n }).convert(convertFunction)
    });
  }
}

/**
 * ResetTimeIntervals represents the time intervals to reset the tracker at.
 *
 * @category Approvals / Transferability
 */
export class ResetTimeIntervals extends BaseNumberTypeClass<ResetTimeIntervals> implements iResetTimeIntervals {
  startTime: string | number;
  intervalLength: string | number;

  constructor(msg: iResetTimeIntervals) {
    super();
    this.startTime = msg.startTime;
    this.intervalLength = msg.intervalLength;
  }

  getNumberFieldNames(): string[] {
    return ['startTime', 'intervalLength'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ResetTimeIntervals {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ResetTimeIntervals;
  }

  toProto(): protobadges.ResetTimeIntervals {
    return new protobadges.ResetTimeIntervals(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ResetTimeIntervals {
    return ResetTimeIntervals.fromProto(protobadges.ResetTimeIntervals.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ResetTimeIntervals {
    return ResetTimeIntervals.fromProto(protobadges.ResetTimeIntervals.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.ResetTimeIntervals, convertFunction: (item: string | number) => U): ResetTimeIntervals {
    return new ResetTimeIntervals({
      startTime: convertFunction(item.startTime),
      intervalLength: convertFunction(item.intervalLength)
    });
  }
}

/**
 * MaxNumTransfers represents the maximum number of transfers for the token IDs and ownershipTimes of this approval.
 *
 * Can be set to 0 to represent an unlimited number of transfers.
 * If set to non-zero value, we track the running tally of the number of transfers for each token ID / ownership time. Once it reaches the max, no more transfers are allowed.
 *
 * Note that we only track the max num transfers if a) the max num transfers here is defined and not unlimited OR b) we need it for calculating the predetermined balances order (i.e. useXYZNumTransfers is set in the PredeterminedOrderCalculationMethod).
 * Otherwise, we do not track the respective number of transfers
 *
 * @category Approvals / Transferability
 */
export class MaxNumTransfers extends BaseNumberTypeClass<MaxNumTransfers> implements iMaxNumTransfers {
  overallMaxNumTransfers: string | number;
  perToAddressMaxNumTransfers: string | number;
  perFromAddressMaxNumTransfers: string | number;
  perInitiatedByAddressMaxNumTransfers: string | number;
  amountTrackerId: string;
  resetTimeIntervals: ResetTimeIntervals;

  constructor(msg: iMaxNumTransfers) {
    super();
    this.overallMaxNumTransfers = msg.overallMaxNumTransfers;
    this.perToAddressMaxNumTransfers = msg.perToAddressMaxNumTransfers;
    this.perFromAddressMaxNumTransfers = msg.perFromAddressMaxNumTransfers;
    this.perInitiatedByAddressMaxNumTransfers = msg.perInitiatedByAddressMaxNumTransfers;
    this.amountTrackerId = msg.amountTrackerId;
    this.resetTimeIntervals = new ResetTimeIntervals(msg.resetTimeIntervals);
  }

  getNumberFieldNames(): string[] {
    return ['overallMaxNumTransfers', 'perToAddressMaxNumTransfers', 'perFromAddressMaxNumTransfers', 'perInitiatedByAddressMaxNumTransfers'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MaxNumTransfers {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MaxNumTransfers;
  }

  toProto(): protobadges.MaxNumTransfers {
    return new protobadges.MaxNumTransfers(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MaxNumTransfers {
    return MaxNumTransfers.fromProto(protobadges.MaxNumTransfers.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MaxNumTransfers {
    return MaxNumTransfers.fromProto(protobadges.MaxNumTransfers.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.MaxNumTransfers, convertFunction: (item: string | number) => U): MaxNumTransfers {
    return new MaxNumTransfers({
      overallMaxNumTransfers: convertFunction(item.overallMaxNumTransfers),
      perToAddressMaxNumTransfers: convertFunction(item.perToAddressMaxNumTransfers),
      perFromAddressMaxNumTransfers: convertFunction(item.perFromAddressMaxNumTransfers),
      perInitiatedByAddressMaxNumTransfers: convertFunction(item.perInitiatedByAddressMaxNumTransfers),
      amountTrackerId: item.amountTrackerId,
      resetTimeIntervals: item.resetTimeIntervals ? new ResetTimeIntervals(item.resetTimeIntervals).convert(convertFunction) : new ResetTimeIntervals({ startTime: 0n, intervalLength: 0n }).convert(convertFunction)
    });
  }
}

/**
 * @category Approvals / Transferability
 */
export class AutoDeletionOptions extends BaseNumberTypeClass<AutoDeletionOptions> implements iAutoDeletionOptions {
  afterOneUse: boolean;
  afterOverallMaxNumTransfers: boolean;
  allowCounterpartyPurge: boolean;
  allowPurgeIfExpired: boolean;

  constructor(msg: iAutoDeletionOptions) {
    super();
    this.afterOneUse = msg.afterOneUse;
    this.afterOverallMaxNumTransfers = msg.afterOverallMaxNumTransfers;
    this.allowCounterpartyPurge = msg.allowCounterpartyPurge;
    this.allowPurgeIfExpired = msg.allowPurgeIfExpired;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AutoDeletionOptions {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AutoDeletionOptions;
  }

  toProto(): protobadges.AutoDeletionOptions {
    return new protobadges.AutoDeletionOptions(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): AutoDeletionOptions {
    return AutoDeletionOptions.fromProto(protobadges.AutoDeletionOptions.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): AutoDeletionOptions {
    return AutoDeletionOptions.fromProto(protobadges.AutoDeletionOptions.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.AutoDeletionOptions, convertFunction: (item: string | number) => U): AutoDeletionOptions {
    return new AutoDeletionOptions({
      afterOneUse: item.afterOneUse,
      afterOverallMaxNumTransfers: item.afterOverallMaxNumTransfers,
      allowCounterpartyPurge: item.allowCounterpartyPurge,
      allowPurgeIfExpired: item.allowPurgeIfExpired
    });
  }
}

/**
 * UserIncomingApproval represents a user's approved incoming transfer.
 *
 * @category Approvals / Transferability
 */
export class UserIncomingApproval extends BaseNumberTypeClass<UserIncomingApproval> implements iUserIncomingApproval {
  fromListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray;
  tokenIds: UintRangeArray;
  ownershipTimes: UintRangeArray;
  approvalId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: IncomingApprovalCriteria;
  version: string | number;

  constructor(msg: iUserIncomingApproval) {
    super();
    this.fromListId = msg.fromListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.tokenIds = UintRangeArray.From(msg.tokenIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.uri = msg.uri;
    this.customData = msg.customData;
    this.approvalCriteria = msg.approvalCriteria ? new IncomingApprovalCriteria(msg.approvalCriteria) : undefined;
    this.version = msg.version;
  }

  getNumberFieldNames(): string[] {
    return ['version'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UserIncomingApproval {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserIncomingApproval;
  }

  toProto(): protobadges.UserIncomingApproval {
    return new protobadges.UserIncomingApproval(this.convert(Stringify) as any);
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): UserIncomingApproval {
    return UserIncomingApproval.fromProto(protobadges.UserIncomingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): UserIncomingApproval {
    return UserIncomingApproval.fromProto(protobadges.UserIncomingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.UserIncomingApproval, convertFunction: (item: string | number) => U): UserIncomingApproval {
    return new UserIncomingApproval({
      fromListId: item.fromListId,
      initiatedByListId: item.initiatedByListId,
      transferTimes: item.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      tokenIds: item.tokenIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: item.approvalId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? IncomingApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined,
      version: convertFunction(item.version)
    });
  }

  castToCollectionTransfer(toAddress: string): CollectionApproval {
    return new CollectionApproval({
      ...this,
      toListId: toAddress,
      approvalCriteria: this.approvalCriteria?.castToCollectionApprovalCriteria()
    });
  }

  toBech32Addresses(prefix: string): UserIncomingApproval {
    return new UserIncomingApproval({
      ...this,
      fromListId: convertListIdToBech32(this.fromListId, prefix),
      initiatedByListId: convertListIdToBech32(this.initiatedByListId, prefix),
      approvalCriteria: this.approvalCriteria?.toBech32Addresses(prefix)
    });
  }
}

/**
 * IncomingApprovalCriteria represents the details of an incoming approval.
 *
 * @category Approvals / Transferability
 */
export class IncomingApprovalCriteria extends BaseNumberTypeClass<IncomingApprovalCriteria> implements iIncomingApprovalCriteria {
  merkleChallenges?: MerkleChallenge[];
  mustOwnTokens?: MustOwnTokens[];
  predeterminedBalances?: PredeterminedBalances;
  approvalAmounts?: ApprovalAmounts;
  maxNumTransfers?: MaxNumTransfers;
  autoDeletionOptions?: AutoDeletionOptions;
  requireFromEqualsInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;
  coinTransfers?: CoinTransfer[] | undefined;
  dynamicStoreChallenges?: DynamicStoreChallenge[];
  ethSignatureChallenges?: ETHSignatureChallenge[];
  senderChecks?: AddressChecks;
  initiatorChecks?: AddressChecks;
  altTimeChecks?: AltTimeChecks;
  mustPrioritize?: boolean;
  votingChallenges?: VotingChallenge[];

  constructor(msg: iIncomingApprovalCriteria) {
    super();
    this.merkleChallenges = msg.merkleChallenges?.map((x) => new MerkleChallenge(x));
    this.mustOwnTokens = msg.mustOwnTokens?.map((x) => new MustOwnTokens(x));
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.autoDeletionOptions = msg.autoDeletionOptions ? new AutoDeletionOptions(msg.autoDeletionOptions) : undefined;
    this.requireFromEqualsInitiatedBy = msg.requireFromEqualsInitiatedBy;
    this.requireFromDoesNotEqualInitiatedBy = msg.requireFromDoesNotEqualInitiatedBy;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
    this.dynamicStoreChallenges = msg.dynamicStoreChallenges?.map((x) => new DynamicStoreChallenge(x));
    this.ethSignatureChallenges = msg.ethSignatureChallenges?.map((x) => new ETHSignatureChallenge(x));
    this.senderChecks = msg.senderChecks ? new AddressChecks(msg.senderChecks) : undefined;
    this.initiatorChecks = msg.initiatorChecks ? new AddressChecks(msg.initiatorChecks) : undefined;
    this.altTimeChecks = msg.altTimeChecks ? new AltTimeChecks(msg.altTimeChecks) : undefined;
    this.mustPrioritize = msg.mustPrioritize;
    this.votingChallenges = msg.votingChallenges?.map((x) => new VotingChallenge(x));
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): IncomingApprovalCriteria {
    return new IncomingApprovalCriteria({
      merkleChallenges: this.merkleChallenges?.map((x) => x.convert(convertFunction)),
      mustOwnTokens: this.mustOwnTokens?.map((x) => x.convert(convertFunction)),
      predeterminedBalances: this.predeterminedBalances?.convert(convertFunction),
      approvalAmounts: this.approvalAmounts?.convert(convertFunction),
      maxNumTransfers: this.maxNumTransfers?.convert(convertFunction),
      autoDeletionOptions: this.autoDeletionOptions?.convert(convertFunction),
      requireFromEqualsInitiatedBy: this.requireFromEqualsInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: this.requireFromDoesNotEqualInitiatedBy,
      coinTransfers: this.coinTransfers?.map((x) => x.convert(convertFunction)),
      dynamicStoreChallenges: this.dynamicStoreChallenges?.map((x) => x.convert(convertFunction)),
      ethSignatureChallenges: this.ethSignatureChallenges,
      senderChecks: this.senderChecks?.convert(convertFunction),
      initiatorChecks: this.initiatorChecks?.convert(convertFunction),
      altTimeChecks: this.altTimeChecks?.convert(convertFunction),
      mustPrioritize: this.mustPrioritize
    });
  }

  toProto(): protobadges.IncomingApprovalCriteria {
    return new protobadges.IncomingApprovalCriteria(this.convert(Stringify) as any);
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): IncomingApprovalCriteria {
    return IncomingApprovalCriteria.fromProto(protobadges.IncomingApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): IncomingApprovalCriteria {
    return IncomingApprovalCriteria.fromProto(protobadges.IncomingApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.IncomingApprovalCriteria, convertFunction: (item: string | number) => U): IncomingApprovalCriteria {
    return new IncomingApprovalCriteria({
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      mustOwnTokens: item.mustOwnTokens.map((x) => MustOwnTokens.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      autoDeletionOptions: item.autoDeletionOptions ? AutoDeletionOptions.fromProto(item.autoDeletionOptions, convertFunction) : undefined,
      requireFromEqualsInitiatedBy: item.requireFromEqualsInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: item.requireFromDoesNotEqualInitiatedBy,
      coinTransfers: item.coinTransfers ? item.coinTransfers.map((x) => CoinTransfer.fromProto(x, convertFunction)) : undefined,
      dynamicStoreChallenges: item.dynamicStoreChallenges ? item.dynamicStoreChallenges.map((x) => DynamicStoreChallenge.fromProto(x, convertFunction)) : undefined,
      ethSignatureChallenges: item.ethSignatureChallenges ? item.ethSignatureChallenges.map((x) => ETHSignatureChallenge.fromProto(x)) : undefined,
      senderChecks: item.senderChecks ? AddressChecks.fromProto(item.senderChecks) : undefined,
      initiatorChecks: item.initiatorChecks ? AddressChecks.fromProto(item.initiatorChecks) : undefined,
      altTimeChecks: item.altTimeChecks ? AltTimeChecks.fromProto(item.altTimeChecks, convertFunction) : undefined,
      mustPrioritize: item.mustPrioritize,
      votingChallenges: item.votingChallenges ? item.votingChallenges.map((x) => VotingChallenge.fromProto(x, convertFunction)) : undefined
    });
  }

  castToCollectionApprovalCriteria(): ApprovalCriteria {
    return new ApprovalCriteria({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      requireFromEqualsInitiatedBy: this.requireFromEqualsInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: this.requireFromDoesNotEqualInitiatedBy,
      predeterminedBalances: this.predeterminedBalances,
      merkleChallenges: this.merkleChallenges,
      coinTransfers: this.coinTransfers,
      autoDeletionOptions: this.autoDeletionOptions,
      mustOwnTokens: this.mustOwnTokens,
      dynamicStoreChallenges: this.dynamicStoreChallenges,
      ethSignatureChallenges: this.ethSignatureChallenges,
      senderChecks: this.senderChecks,
      initiatorChecks: this.initiatorChecks,
      altTimeChecks: this.altTimeChecks,
      mustPrioritize: this.mustPrioritize,
      votingChallenges: this.votingChallenges,

      requireToEqualsInitiatedBy: false,
      requireToDoesNotEqualInitiatedBy: false,
      overridesFromOutgoingApprovals: false,
      overridesToIncomingApprovals: false
    });
  }

  toBech32Addresses(prefix: string): IncomingApprovalCriteria {
    return new IncomingApprovalCriteria({
      ...this,
      coinTransfers: this.coinTransfers?.map((x) => x.toBech32Addresses(prefix))
    });
  }
}

/**
 * CollectionApproval represents a collection's approved transfer.
 *
 * @category Approvals / Transferability
 */
export class CollectionApproval extends BaseNumberTypeClass<CollectionApproval> implements iCollectionApproval {
  toListId: string;
  fromListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray;
  tokenIds: UintRangeArray;
  ownershipTimes: UintRangeArray;
  approvalId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: ApprovalCriteria;
  version: string | number;

  constructor(msg: iCollectionApproval) {
    super();
    this.toListId = msg.toListId;
    this.fromListId = msg.fromListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.tokenIds = UintRangeArray.From(msg.tokenIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.uri = msg.uri;
    this.customData = msg.customData;
    this.approvalCriteria = msg.approvalCriteria ? new ApprovalCriteria(msg.approvalCriteria) : undefined;
    this.version = msg.version;
  }

  static validateUpdate(oldApprovals: CollectionApprovalWithDetails[], newApprovals: CollectionApprovalWithDetails[], canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails[]): Error | null {
    return validateCollectionApprovalsUpdate(
      oldApprovals.map((x) => x.convert(BigIntify)),
      newApprovals.map((x) => x.convert(BigIntify)),
      canUpdateCollectionApprovals.map((x) => x.convert(BigIntify))
    );
  }

  getNumberFieldNames(): string[] {
    return ['version'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CollectionApproval {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionApproval;
  }

  toProto(): protobadges.CollectionApproval {
    return new protobadges.CollectionApproval(this.convert(Stringify) as any);
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): CollectionApproval {
    return CollectionApproval.fromProto(protobadges.CollectionApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): CollectionApproval {
    return CollectionApproval.fromProto(protobadges.CollectionApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.CollectionApproval, convertFunction: (item: string | number) => U): CollectionApproval {
    return new CollectionApproval({
      toListId: item.toListId,
      fromListId: item.fromListId,
      initiatedByListId: item.initiatedByListId,
      transferTimes: item.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      tokenIds: item.tokenIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: item.approvalId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? ApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined,
      version: convertFunction(item.version)
    });
  }

  castToOutgoingApproval(): UserOutgoingApproval {
    return new UserOutgoingApproval({
      ...this,
      toListId: this.toListId,
      initiatedByListId: this.initiatedByListId,
      transferTimes: this.transferTimes,
      tokenIds: this.tokenIds,
      ownershipTimes: this.ownershipTimes,
      approvalCriteria: this.approvalCriteria,
      version: this.version
    });
  }

  castToIncomingApproval(): UserIncomingApproval {
    return new UserIncomingApproval({
      ...this,
      fromListId: this.fromListId,
      initiatedByListId: this.initiatedByListId,
      transferTimes: this.transferTimes,
      tokenIds: this.tokenIds,
      ownershipTimes: this.ownershipTimes,
      approvalCriteria: this.approvalCriteria,
      version: this.version
    });
  }

  toBech32Addresses(prefix: string): CollectionApproval {
    return new CollectionApproval({
      ...this,
      fromListId: convertListIdToBech32(this.fromListId, prefix),
      toListId: convertListIdToBech32(this.toListId, prefix),
      initiatedByListId: convertListIdToBech32(this.initiatedByListId, prefix),
      approvalCriteria: this.approvalCriteria?.toBech32Addresses(prefix),
      version: this.version
    });
  }
}

/**
 * @inheritDoc iDynamicStoreChallenge
 * @category Approvals / Transferability
 */
export class DynamicStoreChallenge extends BaseNumberTypeClass<DynamicStoreChallenge> implements iDynamicStoreChallenge {
  storeId: string | number;
  ownershipCheckParty?: string;

  constructor(msg: iDynamicStoreChallenge) {
    super();
    this.storeId = msg.storeId;
    this.ownershipCheckParty = msg.ownershipCheckParty;
  }

  getNumberFieldNames(): string[] {
    return ['storeId'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): DynamicStoreChallenge {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicStoreChallenge;
  }

  toProto(): protobadges.DynamicStoreChallenge {
    return new protobadges.DynamicStoreChallenge(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): DynamicStoreChallenge {
    return DynamicStoreChallenge.fromProto(protobadges.DynamicStoreChallenge.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): DynamicStoreChallenge {
    return DynamicStoreChallenge.fromProto(protobadges.DynamicStoreChallenge.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.DynamicStoreChallenge, convertFunction: (item: string | number) => U): DynamicStoreChallenge {
    return new DynamicStoreChallenge({
      storeId: convertFunction(item.storeId),
      ownershipCheckParty: item.ownershipCheckParty
    });
  }
}

/**
 * AddressChecks defines checks for address types (WASM contract, liquidity pool, etc.)
 *
 * @category Approvals / Transferability
 */
export class AddressChecks extends CustomTypeClass<AddressChecks> implements iAddressChecks {
  mustBeWasmContract?: boolean;
  mustNotBeWasmContract?: boolean;
  mustBeLiquidityPool?: boolean;
  mustNotBeLiquidityPool?: boolean;

  constructor(msg: iAddressChecks) {
    super();
    this.mustBeWasmContract = msg.mustBeWasmContract;
    this.mustNotBeWasmContract = msg.mustNotBeWasmContract;
    this.mustBeLiquidityPool = msg.mustBeLiquidityPool;
    this.mustNotBeLiquidityPool = msg.mustNotBeLiquidityPool;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AddressChecks {
    return new AddressChecks({
      mustBeWasmContract: this.mustBeWasmContract,
      mustNotBeWasmContract: this.mustNotBeWasmContract,
      mustBeLiquidityPool: this.mustBeLiquidityPool,
      mustNotBeLiquidityPool: this.mustNotBeLiquidityPool
    });
  }

  toProto(): protobadges.AddressChecks {
    return new protobadges.AddressChecks({
      mustBeWasmContract: this.mustBeWasmContract ?? false,
      mustNotBeWasmContract: this.mustNotBeWasmContract ?? false,
      mustBeLiquidityPool: this.mustBeLiquidityPool ?? false,
      mustNotBeLiquidityPool: this.mustNotBeLiquidityPool ?? false
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AddressChecks {
    return AddressChecks.fromProto(protobadges.AddressChecks.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AddressChecks {
    return AddressChecks.fromProto(protobadges.AddressChecks.fromJsonString(jsonString, options));
  }

  static fromProto(item: protobadges.AddressChecks): AddressChecks {
    return new AddressChecks({
      mustBeWasmContract: item.mustBeWasmContract,
      mustNotBeWasmContract: item.mustNotBeWasmContract,
      mustBeLiquidityPool: item.mustBeLiquidityPool,
      mustNotBeLiquidityPool: item.mustNotBeLiquidityPool
    });
  }
}

/**
 * AltTimeChecks defines alternative time-based checks for approval denial.
 * If the transfer time falls within any of the specified offline hours or days, the approval is denied.
 * Uses UTC timezone for neutral timezone approach.
 *
 * @category Approvals / Transferability
 */
export class AltTimeChecks extends BaseNumberTypeClass<AltTimeChecks> implements iAltTimeChecks {
  offlineHours?: UintRangeArray;
  offlineDays?: UintRangeArray;

  constructor(msg: iAltTimeChecks) {
    super();
    this.offlineHours = msg.offlineHours ? UintRangeArray.From(msg.offlineHours) : undefined;
    this.offlineDays = msg.offlineDays ? UintRangeArray.From(msg.offlineDays) : undefined;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AltTimeChecks {
    return new AltTimeChecks({
      offlineHours: this.offlineHours?.map((x) => x.convert(convertFunction)),
      offlineDays: this.offlineDays?.map((x) => x.convert(convertFunction))
    });
  }

  toProto(): protobadges.AltTimeChecks {
    return new protobadges.AltTimeChecks({
      offlineHours: this.offlineHours?.map((x) => x.convert(Stringify).toProto()) ?? [],
      offlineDays: this.offlineDays?.map((x) => x.convert(Stringify).toProto()) ?? []
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): AltTimeChecks {
    return AltTimeChecks.fromProto(protobadges.AltTimeChecks.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): AltTimeChecks {
    return AltTimeChecks.fromProto(protobadges.AltTimeChecks.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.AltTimeChecks, convertFunction: (item: string | number) => U): AltTimeChecks {
    return new AltTimeChecks({
      offlineHours: item.offlineHours.map((x) => UintRange.fromProto(x, convertFunction)),
      offlineDays: item.offlineDays.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }
}

/**
 * @category Approvals / Transferability
 */
export class UserRoyalties extends BaseNumberTypeClass<UserRoyalties> implements iUserRoyalties {
  percentage: string | number;
  payoutAddress: string;

  constructor(msg: iUserRoyalties) {
    super();
    this.percentage = msg.percentage;
    this.payoutAddress = msg.payoutAddress;
  }

  getNumberFieldNames(): string[] {
    return ['percentage'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UserRoyalties {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserRoyalties;
  }

  toProto(): protobadges.UserRoyalties {
    return new protobadges.UserRoyalties(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): UserRoyalties {
    return UserRoyalties.fromProto(protobadges.UserRoyalties.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): UserRoyalties {
    return UserRoyalties.fromProto(protobadges.UserRoyalties.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.UserRoyalties, convertFunction: (item: string | number) => U): UserRoyalties {
    return new UserRoyalties({ percentage: convertFunction(item.percentage), payoutAddress: item.payoutAddress });
  }
}

/**
 *
 * ApprovalCriteria represents the criteria for an approval. The approvee must satisfy all of the criteria to be approved.
 *
 * @category Approvals / Transferability
 */
export class ApprovalCriteria extends BaseNumberTypeClass<ApprovalCriteria> implements iApprovalCriteria {
  merkleChallenges?: MerkleChallenge[];
  mustOwnTokens?: MustOwnTokens[];
  predeterminedBalances?: PredeterminedBalances;
  approvalAmounts?: ApprovalAmounts;
  maxNumTransfers?: MaxNumTransfers;
  autoDeletionOptions?: AutoDeletionOptions;
  requireToEqualsInitiatedBy?: boolean;
  requireFromEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;
  overridesFromOutgoingApprovals?: boolean;
  overridesToIncomingApprovals?: boolean;
  coinTransfers?: CoinTransfer[] | undefined;
  userRoyalties?: UserRoyalties;
  dynamicStoreChallenges?: DynamicStoreChallenge[];
  ethSignatureChallenges?: ETHSignatureChallenge[];
  senderChecks?: AddressChecks;
  recipientChecks?: AddressChecks;
  initiatorChecks?: AddressChecks;
  altTimeChecks?: AltTimeChecks;
  mustPrioritize?: boolean;
  votingChallenges?: VotingChallenge[];
  allowBackedMinting?: boolean;
  allowSpecialWrapping?: boolean;

  constructor(msg: iApprovalCriteria) {
    super();
    this.merkleChallenges = msg.merkleChallenges?.map((x) => new MerkleChallenge(x));
    this.mustOwnTokens = msg.mustOwnTokens?.map((x) => new MustOwnTokens(x));
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.autoDeletionOptions = msg.autoDeletionOptions ? new AutoDeletionOptions(msg.autoDeletionOptions) : undefined;
    this.requireToEqualsInitiatedBy = msg.requireToEqualsInitiatedBy;
    this.requireFromEqualsInitiatedBy = msg.requireFromEqualsInitiatedBy;
    this.requireToDoesNotEqualInitiatedBy = msg.requireToDoesNotEqualInitiatedBy;
    this.requireFromDoesNotEqualInitiatedBy = msg.requireFromDoesNotEqualInitiatedBy;
    this.overridesFromOutgoingApprovals = msg.overridesFromOutgoingApprovals;
    this.overridesToIncomingApprovals = msg.overridesToIncomingApprovals;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
    this.userRoyalties = msg.userRoyalties ? new UserRoyalties(msg.userRoyalties) : undefined;
    this.dynamicStoreChallenges = msg.dynamicStoreChallenges?.map((x) => new DynamicStoreChallenge(x));
    this.ethSignatureChallenges = msg.ethSignatureChallenges?.map((x) => new ETHSignatureChallenge(x));
    this.senderChecks = msg.senderChecks ? new AddressChecks(msg.senderChecks) : undefined;
    this.recipientChecks = msg.recipientChecks ? new AddressChecks(msg.recipientChecks) : undefined;
    this.initiatorChecks = msg.initiatorChecks ? new AddressChecks(msg.initiatorChecks) : undefined;
    this.altTimeChecks = msg.altTimeChecks ? new AltTimeChecks(msg.altTimeChecks) : undefined;
    this.mustPrioritize = msg.mustPrioritize;
    this.votingChallenges = msg.votingChallenges?.map((x) => new VotingChallenge(x));
    this.allowBackedMinting = msg.allowBackedMinting;
    this.allowSpecialWrapping = msg.allowSpecialWrapping;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ApprovalCriteria {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApprovalCriteria;
  }

  toProto(): protobadges.ApprovalCriteria {
    return new protobadges.ApprovalCriteria(this.convert(Stringify) as any);
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ApprovalCriteria {
    return ApprovalCriteria.fromProto(protobadges.ApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): ApprovalCriteria {
    return ApprovalCriteria.fromProto(protobadges.ApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobadges.ApprovalCriteria, convertFunction: (item: string | number) => U): ApprovalCriteria {
    return new ApprovalCriteria({
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      mustOwnTokens: item.mustOwnTokens.map((x) => MustOwnTokens.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      autoDeletionOptions: item.autoDeletionOptions ? AutoDeletionOptions.fromProto(item.autoDeletionOptions, convertFunction) : undefined,
      coinTransfers: item.coinTransfers ? item.coinTransfers.map((x) => CoinTransfer.fromProto(x, convertFunction)) : undefined,
      requireToEqualsInitiatedBy: item.requireToEqualsInitiatedBy,
      requireFromEqualsInitiatedBy: item.requireFromEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: item.requireToDoesNotEqualInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: item.requireFromDoesNotEqualInitiatedBy,
      overridesFromOutgoingApprovals: item.overridesFromOutgoingApprovals,
      overridesToIncomingApprovals: item.overridesToIncomingApprovals,
      userRoyalties: item.userRoyalties ? UserRoyalties.fromProto(item.userRoyalties, convertFunction) : undefined,
      dynamicStoreChallenges: item.dynamicStoreChallenges ? item.dynamicStoreChallenges.map((x) => DynamicStoreChallenge.fromProto(x, convertFunction)) : undefined,
      ethSignatureChallenges: item.ethSignatureChallenges ? item.ethSignatureChallenges.map((x) => ETHSignatureChallenge.fromProto(x)) : undefined,
      senderChecks: item.senderChecks ? AddressChecks.fromProto(item.senderChecks) : undefined,
      recipientChecks: item.recipientChecks ? AddressChecks.fromProto(item.recipientChecks) : undefined,
      initiatorChecks: item.initiatorChecks ? AddressChecks.fromProto(item.initiatorChecks) : undefined,
      altTimeChecks: item.altTimeChecks ? AltTimeChecks.fromProto(item.altTimeChecks, convertFunction) : undefined,
      mustPrioritize: item.mustPrioritize,
      votingChallenges: item.votingChallenges ? item.votingChallenges.map((x) => VotingChallenge.fromProto(x, convertFunction)) : undefined,
      allowBackedMinting: item.allowBackedMinting,
      allowSpecialWrapping: item.allowSpecialWrapping
    });
  }

  toBech32Addresses(prefix: string): ApprovalCriteria {
    return new ApprovalCriteria({
      ...this,
      coinTransfers: this.coinTransfers?.map((x) => x.toBech32Addresses(prefix))
    });
  }
}

/**
 * @category Approvals / Transferability
 */
export interface iUserOutgoingApprovalWithDetails extends iUserOutgoingApproval {
  /** The populated address list for the toListId */
  toList: iAddressList;
  /** The populated address list for the initiatedByListId */
  initiatedByList: iAddressList;
  approvalCriteria?: iOutgoingApprovalCriteriaWithDetails;
  details?: iApprovalInfoDetails;
}

/**
 * @category Approvals / Transferability
 */
export class UserOutgoingApprovalWithDetails extends UserOutgoingApproval implements iUserOutgoingApprovalWithDetails {
  toList: AddressList;
  initiatedByList: AddressList;
  approvalCriteria?: OutgoingApprovalCriteriaWithDetails | undefined;
  details?: iApprovalInfoDetails | undefined;

  constructor(data: iUserOutgoingApprovalWithDetails) {
    super(data);
    this.toList = new AddressList(data.toList);
    this.initiatedByList = new AddressList(data.initiatedByList);
    this.approvalCriteria = data.approvalCriteria ? new OutgoingApprovalCriteriaWithDetails(data.approvalCriteria) : undefined;
    this.details = data.details ? new ApprovalInfoDetails(data.details) : undefined;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UserOutgoingApprovalWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserOutgoingApprovalWithDetails;
  }

  clone(): UserOutgoingApprovalWithDetails {
    return super.clone() as UserOutgoingApprovalWithDetails;
  }

  castToCollectionTransfer(fromAddress: string): CollectionApprovalWithDetails {
    return new CollectionApprovalWithDetails({
      ...this,
      fromListId: fromAddress,
      fromList: getReservedAddressList(fromAddress) as AddressList,
      approvalCriteria: this.approvalCriteria?.castToCollectionApprovalCriteria()
    });
  }

  castToUniversalPermission(fromAddress: string): UniversalPermission {
    return this.castToCollectionTransfer(fromAddress).castToUniversalPermission();
  }
}

/**
 * @category Approvals / Transferability
 */
export class UserIncomingApprovalWithDetails extends UserIncomingApproval implements iUserIncomingApprovalWithDetails {
  details?: ApprovalInfoDetails;
  fromList: AddressList;
  initiatedByList: AddressList;
  approvalCriteria?: IncomingApprovalCriteriaWithDetails | undefined;

  constructor(data: iUserIncomingApprovalWithDetails) {
    super(data);
    this.details = data.details ? new ApprovalInfoDetails(data.details) : undefined;
    this.fromList = new AddressList(data.fromList);
    this.initiatedByList = new AddressList(data.initiatedByList);
    this.approvalCriteria = data.approvalCriteria ? new IncomingApprovalCriteriaWithDetails(data.approvalCriteria) : undefined;
  }

  clone(): UserIncomingApprovalWithDetails {
    return super.clone() as UserIncomingApprovalWithDetails;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UserIncomingApprovalWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserIncomingApprovalWithDetails;
  }

  castToCollectionTransfer(toAddress: string): CollectionApprovalWithDetails {
    return new CollectionApprovalWithDetails({
      ...this,
      toList: getReservedAddressList(toAddress) as AddressList,
      toListId: toAddress,
      approvalCriteria: this.approvalCriteria?.castToCollectionApprovalCriteria()
    });
  }

  castToUniversalPermission(toAddress: string): UniversalPermission {
    return this.castToCollectionTransfer(toAddress).castToUniversalPermission();
  }
}

/**
 * @example Codes
 * 1. Generate N codes privately
 * 2. Hash each code
 * 3. Store the hashed codes publicly on IPFS via this struct
 * 4. When a user enters a code, we hash it and check if it matches any of the hashed codes. This way, the codes are never stored publicly on IPFS and only known by the generator of the codes.
 *
 * @example Whitelist
 * For storing a public whitelist of addresses (with useCreatorAddressAsLeaf = true), hashing complicates everything because the whitelist can be stored publicly.
 * 1. Generate N whitelist addresses
 * 2. Store the addresses publicly on IPFS via this struct
 * 3. When a user enters an address, we check if it matches any of the addresses.
 *
 * @category Interfaces
 */
export interface iChallengeDetails {
  /** The leaves of the Merkle tree. Leaves should be considered public. Use preimages for the private codes + isHashed. For whitelist trees, these can be the plaintext BitBadges addresses. */
  leaves: string[];
  /** True if the leaves are hashed. Hash(preimage[i]) = leaves[i] */
  isHashed: boolean;

  /** The preimages of the leaves (only used if isHashed = true). Oftentimes, this is used for private codes so should not be present when user-facing. */
  preimages?: string[];
  /** Seed code for generating the leaves */
  seedCode?: string;
  /** The Merkle tree */
  tree?: MerkleTree;
  /** The Merkle tree options for how to build it */
  treeOptions?: MerkleTreeJsOptions;
  /** The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select) */
  numLeaves?: string | number;
  /** The current code being used for the challenge. Used behind the scenes */
  currCode?: string | number;
}

/**
 * @category Approvals / Transferability
 */
export class ChallengeDetails extends BaseNumberTypeClass<ChallengeDetails> implements iChallengeDetails {
  treeOptions?: MerkleTreeJsOptions;
  numLeaves?: string | number;
  leaves: string[];
  isHashed: boolean;
  preimages?: string[] | undefined;
  seedCode?: string | undefined;
  tree?: MerkleTree | undefined;

  constructor(data: iChallengeDetails) {
    super();
    this.treeOptions = data.treeOptions;
    this.numLeaves = data.numLeaves;
    this.leaves = data.leaves;
    this.isHashed = data.isHashed;
    this.preimages = data.preimages;
    this.seedCode = data.seedCode;
  }

  getNumberFieldNames(): string[] {
    return ['numLeaves'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ChallengeDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ChallengeDetails;
  }
}

/**
 * @category Interfaces
 */
export interface iChallengeInfoDetails {
  /** The challenge details of the claim / approval */
  challengeDetails: iChallengeDetails;

  claim?: iClaimDetails;
}

/**
 * @category Interfaces
 */
export interface iChallengeInfoDetailsUpdate {
  /** The challenge details of the claim / approval */
  challengeDetails: iChallengeDetails;

  claim?: CreateClaimRequest;
}

/**
 * @category Interfaces
 */
export interface iApprovalInfoDetails {
  name: string;
  description: string;
  image: string;
}

/**
 * @category Approvals / Transferability
 */
export class ChallengeInfoDetails extends BaseNumberTypeClass<ChallengeInfoDetails> implements iChallengeInfoDetails {
  challengeDetails: ChallengeDetails;
  claim?: ClaimDetails;

  constructor(data: iChallengeInfoDetails) {
    super();
    this.challengeDetails = new ChallengeDetails(data.challengeDetails);
    this.claim = data.claim ? new ClaimDetails(data.claim) : undefined;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ChallengeInfoDetails {
    return new ChallengeInfoDetails(
      deepCopyPrimitives({
        ...this,
        challengeDetails: this.challengeDetails.convert(convertFunction),
        claim: this.claim ? this.claim.convert(convertFunction) : undefined
      })
    );
  }
}

/**
 * @category Approvals / Transferability
 */
export class ApprovalInfoDetails extends BaseNumberTypeClass<ApprovalInfoDetails> implements iApprovalInfoDetails {
  name: string;
  description: string;
  image: string;

  constructor(data: iApprovalInfoDetails) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ApprovalInfoDetails {
    return new ApprovalInfoDetails(deepCopyPrimitives({ ...this }));
  }
}

/**
 * @category Interfaces
 */
export interface iMerkleChallengeWithDetails extends iMerkleChallenge {
  challengeInfoDetails: iChallengeInfoDetails;
}

/**
 * @category Approvals / Transferability
 */
export class MerkleChallengeWithDetails extends MerkleChallenge implements iMerkleChallengeWithDetails {
  challengeInfoDetails: ChallengeInfoDetails;

  constructor(data: iMerkleChallengeWithDetails) {
    super(data);
    this.challengeInfoDetails = new ChallengeInfoDetails(data.challengeInfoDetails);
  }

  getNumberFieldNames(): string[] {
    return super.getNumberFieldNames().concat(this.challengeInfoDetails.challengeDetails.getNumberFieldNames());
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MerkleChallengeWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MerkleChallengeWithDetails;
  }

  clone(): MerkleChallengeWithDetails {
    return super.clone() as MerkleChallengeWithDetails;
  }
}

/**
 * @category Interfaces
 */
export interface iApprovalCriteriaWithDetails extends iApprovalCriteria {
  merkleChallenges?: iMerkleChallengeWithDetails[];
}

/**
 * @category Approvals / Transferability
 */
export class ApprovalCriteriaWithDetails extends ApprovalCriteria implements iApprovalCriteriaWithDetails {
  merkleChallenges?: MerkleChallengeWithDetails[];

  constructor(data: iApprovalCriteriaWithDetails) {
    super(data);
    this.merkleChallenges = data.merkleChallenges?.map((x) => new MerkleChallengeWithDetails(x));
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ApprovalCriteriaWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApprovalCriteriaWithDetails;
  }

  clone(): ApprovalCriteriaWithDetails {
    return super.clone() as ApprovalCriteriaWithDetails;
  }
}

/**
 * @category Interfaces
 */
export interface iIncomingApprovalCriteriaWithDetails extends iIncomingApprovalCriteria {
  merkleChallenges?: iMerkleChallengeWithDetails[];
}

/**
 * @category Approvals / Transferability
 */
export class IncomingApprovalCriteriaWithDetails extends IncomingApprovalCriteria implements iIncomingApprovalCriteriaWithDetails {
  merkleChallenges?: MerkleChallengeWithDetails[];

  constructor(data: iIncomingApprovalCriteriaWithDetails) {
    super(data);
    this.merkleChallenges = data.merkleChallenges?.map((x) => new MerkleChallengeWithDetails(x));
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): IncomingApprovalCriteriaWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as IncomingApprovalCriteriaWithDetails;
  }

  clone(): IncomingApprovalCriteriaWithDetails {
    return super.clone() as IncomingApprovalCriteriaWithDetails;
  }

  castToCollectionApprovalCriteria(): ApprovalCriteriaWithDetails {
    return new ApprovalCriteriaWithDetails({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      requireFromEqualsInitiatedBy: this.requireFromEqualsInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: this.requireFromDoesNotEqualInitiatedBy,
      predeterminedBalances: this.predeterminedBalances,
      merkleChallenges: this.merkleChallenges,
      coinTransfers: this.coinTransfers,
      autoDeletionOptions: this.autoDeletionOptions,
      mustOwnTokens: this.mustOwnTokens,
      dynamicStoreChallenges: this.dynamicStoreChallenges,
      ethSignatureChallenges: this.ethSignatureChallenges,
      senderChecks: this.senderChecks,
      initiatorChecks: this.initiatorChecks,
      altTimeChecks: this.altTimeChecks,

      requireToEqualsInitiatedBy: false,
      requireToDoesNotEqualInitiatedBy: false,
      overridesFromOutgoingApprovals: false,
      overridesToIncomingApprovals: false
    });
  }
}

/**
 * @category Interfaces
 */
export interface iOutgoingApprovalCriteriaWithDetails extends iOutgoingApprovalCriteria {
  merkleChallenges?: iMerkleChallengeWithDetails[];
}

/**
 * @category Approvals / Transferability
 */
export class OutgoingApprovalCriteriaWithDetails extends OutgoingApprovalCriteria implements iOutgoingApprovalCriteriaWithDetails {
  merkleChallenges?: MerkleChallengeWithDetails[];

  constructor(data: iOutgoingApprovalCriteriaWithDetails) {
    super(data);
    this.merkleChallenges = data.merkleChallenges?.map((x) => new MerkleChallengeWithDetails(x));
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): OutgoingApprovalCriteriaWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as OutgoingApprovalCriteriaWithDetails;
  }

  clone(): OutgoingApprovalCriteriaWithDetails {
    return super.clone() as OutgoingApprovalCriteriaWithDetails;
  }

  castToCollectionApprovalCriteria(): ApprovalCriteriaWithDetails {
    return new ApprovalCriteriaWithDetails({
      predeterminedBalances: this.predeterminedBalances,
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      autoDeletionOptions: this.autoDeletionOptions,
      requireToEqualsInitiatedBy: this.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: this.requireToDoesNotEqualInitiatedBy,
      merkleChallenges: this.merkleChallenges,
      mustOwnTokens: this.mustOwnTokens,
      coinTransfers: this.coinTransfers,
      dynamicStoreChallenges: this.dynamicStoreChallenges,
      ethSignatureChallenges: this.ethSignatureChallenges,
      recipientChecks: this.recipientChecks,
      initiatorChecks: this.initiatorChecks,
      altTimeChecks: this.altTimeChecks,

      requireFromEqualsInitiatedBy: false,
      requireFromDoesNotEqualInitiatedBy: false,
      overridesFromOutgoingApprovals: false,
      overridesToIncomingApprovals: false
    });
  }
}

/**
 * @category Interfaces
 */
export interface iCollectionApprovalWithDetails extends iCollectionApproval {
  /** The approval metadata details */
  details?: iApprovalInfoDetails;
  /** The populated address list for the toListId */
  toList: iAddressList;
  /** The populated address list for the fromListId */
  fromList: iAddressList;
  /** The populated address list for the initiatedByListId */
  initiatedByList: iAddressList;
  approvalCriteria?: iApprovalCriteriaWithDetails;
}

/**
 * @category Approvals / Transferability
 */
export class CollectionApprovalWithDetails extends CollectionApproval implements iCollectionApprovalWithDetails {
  details?: ApprovalInfoDetails;
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;
  approvalCriteria?: ApprovalCriteriaWithDetails;

  constructor(data: iCollectionApprovalWithDetails) {
    super(data);
    this.details = data.details ? new ApprovalInfoDetails(data.details) : undefined;
    this.toList = new AddressList(data.toList);
    this.fromList = new AddressList(data.fromList);
    this.initiatedByList = new AddressList(data.initiatedByList);
    this.approvalCriteria = data.approvalCriteria ? new ApprovalCriteriaWithDetails(data.approvalCriteria) : undefined;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CollectionApprovalWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionApprovalWithDetails;
  }

  clone(): CollectionApprovalWithDetails {
    return super.clone() as CollectionApprovalWithDetails;
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      tokenIds: this.tokenIds.convert(BigIntify),
      transferTimes: this.transferTimes.convert(BigIntify),
      ownershipTimes: this.ownershipTimes.convert(BigIntify),
      fromList: this.fromList,
      toList: this.toList,
      initiatedByList: this.initiatedByList,
      approvalIdList: getReservedTrackerList(this.approvalId),
      usesApprovalIdList: true,
      usesTokenIds: true,
      usesTransferTimes: true,
      usesToList: true,
      usesFromList: true,
      usesInitiatedByList: true,
      usesOwnershipTimes: true,
      arbitraryValue: {
        approvalId: this.approvalId,
        //Don't want to include the off-chain additional details we have because these are not on-chain and
        //will not be checked on-chain for comparisons
        approvalCriteria: {
          ...this.approvalCriteria,
          merkleChallenges: this.approvalCriteria?.merkleChallenges
            ?.map((x) => x.convert(BigIntify))
            .map((x) => {
              return {
                ...x,
                challengeInfoDetails: undefined
              };
            })
        },
        approvalCriteriaWithDetails: this.approvalCriteria?.convert(BigIntify)
      }
    };
  }

  castToOutgoingApproval(): UserOutgoingApprovalWithDetails {
    return new UserOutgoingApprovalWithDetails({
      ...this,
      toListId: this.toListId,
      toList: this.toList,
      initiatedByList: this.initiatedByList,
      initiatedByListId: this.initiatedByListId,
      transferTimes: this.transferTimes,
      tokenIds: this.tokenIds,
      ownershipTimes: this.ownershipTimes,
      approvalCriteria: this.approvalCriteria
    });
  }

  castToIncomingApproval(): UserIncomingApprovalWithDetails {
    return new UserIncomingApprovalWithDetails({
      ...this,
      fromList: this.fromList,
      fromListId: this.fromListId,
      initiatedByListId: this.initiatedByListId,
      transferTimes: this.transferTimes,
      tokenIds: this.tokenIds,
      ownershipTimes: this.ownershipTimes,
      approvalCriteria: this.approvalCriteria
    });
  }

  static validateUpdate(oldApprovals: CollectionApprovalWithDetails[], newApprovals: CollectionApprovalWithDetails[], canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails[]): Error | null {
    return validateCollectionApprovalsUpdate(
      oldApprovals.map((x) => x.convert(BigIntify)),
      newApprovals.map((x) => x.convert(BigIntify)),
      canUpdateCollectionApprovals.map((x) => x.convert(BigIntify))
    );
  }
}

interface ApprovalCriteriaWithIsApproved {
  isApproved: boolean;
  approvalCriteria: (ApprovalCriteria | null)[];
}

/**
 * @category Approvals / Transferability
 *
 * @hidden
 */
export function getFirstMatchOnlyWithApprovalCriteria(permissions: UniversalPermission[]): UniversalPermissionDetails[] {
  let handled: UniversalPermissionDetails[] = [];

  for (const permission of permissions) {
    const tokenIds = GetUintRangesWithOptions(permission.tokenIds, permission.usesTokenIds);
    const timelineTimes = GetUintRangesWithOptions(permission.timelineTimes, permission.usesTimelineTimes);
    const transferTimes = GetUintRangesWithOptions(permission.transferTimes, permission.usesTransferTimes);
    const ownershipTimes = GetUintRangesWithOptions(permission.ownershipTimes, permission.usesOwnershipTimes);
    const permanentlyPermittedTimes = GetUintRangesWithOptions(permission.permanentlyPermittedTimes, true);
    const permanentlyForbiddenTimes = GetUintRangesWithOptions(permission.permanentlyForbiddenTimes, true);

    for (const tokenId of tokenIds) {
      for (const timelineTime of timelineTimes) {
        for (const transferTime of transferTimes) {
          for (const ownershipTime of ownershipTimes) {
            const approvalCriteria: ApprovalCriteria[] = [permission.arbitraryValue.approvalCriteria ?? null];

            const isApproved: boolean = permission.arbitraryValue.isApproved;
            const arbValue: ApprovalCriteriaWithIsApproved = {
              isApproved: isApproved,
              approvalCriteria: approvalCriteria
            };

            const brokenDown: UniversalPermissionDetails[] = [
              {
                tokenId: tokenId,
                timelineTime: timelineTime,
                transferTime: transferTime,
                ownershipTime: ownershipTime,
                toList: permission.toList,
                fromList: permission.fromList,
                initiatedByList: permission.initiatedByList,
                approvalIdList: permission.approvalIdList,
                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,
                arbitraryValue: arbValue
              }
            ];

            const [overlaps, inBrokenDownButNotHandled, inHandledButNotBrokenDown] = getOverlapsAndNonOverlaps(brokenDown, handled);
            handled = [];

            handled.push(...inHandledButNotBrokenDown);
            handled.push(...inBrokenDownButNotHandled);

            for (const overlap of overlaps) {
              const mergedApprovalCriteria: (ApprovalCriteria | null)[] = overlap.secondDetails.arbitraryValue.approvalCriteria.concat(overlap.firstDetails.arbitraryValue.approvalCriteria);

              const isApprovedFirst: boolean = overlap.firstDetails.arbitraryValue.isApproved;
              const isApprovedSecond: boolean = overlap.secondDetails.arbitraryValue.isApproved;
              const isApproved: boolean = isApprovedFirst && isApprovedSecond;

              const newArbValue: ApprovalCriteriaWithIsApproved = {
                isApproved: isApproved,
                approvalCriteria: mergedApprovalCriteria
              };

              handled.push({
                timelineTime: overlap.overlap.timelineTime,
                tokenId: overlap.overlap.tokenId,
                transferTime: overlap.overlap.transferTime,
                ownershipTime: overlap.overlap.ownershipTime,
                toList: overlap.overlap.toList,
                fromList: overlap.overlap.fromList,
                initiatedByList: overlap.overlap.initiatedByList,
                approvalIdList: overlap.overlap.approvalIdList,
                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,
                arbitraryValue: newArbValue
              });
            }
          }
        }
      }
    }
  }

  const returnArr: UniversalPermissionDetails[] = [];

  for (const handledItem of handled) {
    let idxToInsert: number = 0;

    while (idxToInsert < returnArr.length && handledItem.tokenId.start > returnArr[idxToInsert].tokenId.start) {
      idxToInsert++;
    }

    returnArr.push(null as any);
    returnArr.copyWithin(idxToInsert + 1, idxToInsert);
    returnArr[idxToInsert] = handledItem;
  }

  return returnArr;
}

/**
 * Validates if a state transition (old approvals -> new approvals) is valid, given the current permissions.
 *
 * @category Approvals / Transferability
 */
export function validateCollectionApprovalsUpdate(oldApprovals: CollectionApprovalWithDetails[], newApprovals: CollectionApprovalWithDetails[], canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails[]): Error | null {
  const dummyRanges = [UintRangeArray.From([{ start: 1n, end: 1n }])]; //dummy for compatibility with getPotentialUpdatesForTimelineValues
  const oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(
    dummyRanges.map((x) => x.clone()),
    [oldApprovals.map((x) => x.convert(BigIntify))]
  );
  const newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(
    dummyRanges.map((x) => x.clone()),
    [newApprovals.map((x) => x.convert(BigIntify))]
  );

  const detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, [], function (oldValue: any, newValue: any) {
    const expandedOldApprovals = expandCollectionApprovals(oldValue);
    const expandedNewApprovals = expandCollectionApprovals(newValue);

    const oldApprovals = expandedOldApprovals.map((x) => x.castToUniversalPermission());
    if (!oldApprovals) {
      throw new Error('InvalidOldValue');
    }
    const newApprovals = expandedNewApprovals.map((x) => x.castToUniversalPermission());
    if (!newApprovals) {
      throw new Error('InvalidNewValue');
    }

    const firstMatchesForOld = getFirstMatchOnlyWithApprovalCriteria(oldApprovals);
    const firstMatchesForNew = getFirstMatchOnlyWithApprovalCriteria(newApprovals);

    const detailsToReturn: UniversalPermissionDetails[] = [];
    const [overlapObjects, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(firstMatchesForOld, firstMatchesForNew);
    for (const overlapObject of overlapObjects) {
      const overlap = overlapObject.overlap;
      const oldDetails = overlapObject.firstDetails;
      const newDetails = overlapObject.secondDetails;
      let different = false;
      if ((oldDetails.arbitraryValue === null && newDetails.arbitraryValue !== null) || (oldDetails.arbitraryValue !== null && newDetails.arbitraryValue === null)) {
        different = true;
      } else {
        const oldArbVal: ApprovalCriteriaWithIsApproved = oldDetails.arbitraryValue as ApprovalCriteriaWithIsApproved;
        const newArbVal: ApprovalCriteriaWithIsApproved = newDetails.arbitraryValue as ApprovalCriteriaWithIsApproved;

        const oldVal = oldArbVal.approvalCriteria;
        const newVal = newArbVal.approvalCriteria;

        if (oldArbVal.isApproved !== newArbVal.isApproved) {
          different = true;
        }

        if (oldVal.length !== newVal.length) {
          different = true;
        } else {
          for (let i = 0; i < oldVal.length; i++) {
            if (JSON.stringify(oldVal[i]) !== JSON.stringify(newVal[i])) {
              different = true;
            }
          }
        }
      }

      if (different) {
        detailsToReturn.push(overlap);
      }
    }

    detailsToReturn.push(...inOldButNotNew);
    detailsToReturn.push(...inNewButNotOld);

    return detailsToReturn;
  });

  const details = detailsToCheck.map((x) => {
    const result = {
      tokenIds: UintRangeArray.From([x.tokenId]),
      ownershipTimes: UintRangeArray.From([x.ownershipTime]),
      transferTimes: UintRangeArray.From([x.transferTime]),
      toList: x.toList,
      fromList: x.fromList,
      initiatedByList: x.initiatedByList,
      approvalIdList: x.approvalIdList
    };
    return result;
  });

  const err = CollectionApprovalPermission.check(
    details,
    canUpdateCollectionApprovals.map((x) => x.convert(BigIntify))
  );
  if (err) {
    return err;
  }

  return null;
}

/**
 * Expands the collection approvals to include the correct lists and ranges.
 *
 * @category Approvals / Transferability
 * @hidden
 */
export function expandCollectionApprovals(approvals: CollectionApprovalWithDetails[]): CollectionApprovalWithDetails[] {
  const newCurrApprovals: CollectionApprovalWithDetails[] = [];
  for (const approval of approvals) {
    const tokenIds = GetUintRangesWithOptions(approval.tokenIds, true);
    const ownershipTimes = GetUintRangesWithOptions(approval.ownershipTimes, true);
    const times = GetUintRangesWithOptions(approval.transferTimes, true);
    const toListId = GetListIdWithOptions(approval.toListId, true);
    const fromListId = GetListIdWithOptions(approval.fromListId, true);
    const initiatedByListId = GetListIdWithOptions(approval.initiatedByListId, true);

    const toList = GetListWithOptions(approval.toList, true);
    const fromList = GetListWithOptions(approval.fromList, true);
    const initiatedByList = GetListWithOptions(approval.initiatedByList, true);

    newCurrApprovals.push(
      new CollectionApprovalWithDetails({
        ...approval,
        toListId: toListId,
        fromListId: fromListId,
        initiatedByListId: initiatedByListId,
        transferTimes: times,
        tokenIds: tokenIds,
        ownershipTimes: ownershipTimes,
        toList: toList,
        fromList: fromList,
        initiatedByList: initiatedByList,
        approvalCriteria: approval.approvalCriteria,
        approvalId: approval.approvalId
      })
    );
  }

  return newCurrApprovals;
}
