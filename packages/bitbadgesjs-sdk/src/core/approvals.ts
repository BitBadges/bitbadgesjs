import {
  BitBadgesAddress,
  ClaimIntegrationPluginType,
  ClaimReward,
  CreateClaimRequest,
  IntegrationPluginDetails,
  UNIXMilliTimestamp,
  iChallengeTrackerIdDetails,
  iClaimCachePolicy,
  iClaimDetails,
  iSatisfyMethod
} from '@/api-indexer/docs/interfaces.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';
import {
  BaseNumberTypeClass,
  ConvertOptions,
  CustomTypeClass,
  convertClassPropertiesAndMaintainNumberTypes,
  deepCopyPrimitives
} from '@/common/base.js';
import type {
  iApprovalAmounts,
  iApprovalCriteria,
  iCollectionApproval,
  iIncomingApprovalCriteria,
  iIncrementedBalances,
  iManualBalances,
  iMaxNumTransfers,
  iOutgoingApprovalCriteria,
  iPredeterminedBalances,
  iPredeterminedOrderCalculationMethod,
  iUserIncomingApproval,
  iUserIncomingApprovalWithDetails,
  iUserOutgoingApproval
} from '@/interfaces/badges/approvals.js';
import type { CollectionId, iAddressList, iMerkleChallenge } from '@/interfaces/badges/core.js';
import * as badges from '@/proto/badges/index.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type MerkleTree from 'merkletreejs';
import type { Options as MerkleTreeJsOptions } from 'merkletreejs/dist/MerkleTree';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers.js';
import { AddressList, convertListIdToBech32 } from './addressLists.js';
import { Balance, BalanceArray } from './balances.js';
import { CoinTransfer, MerkleChallenge } from './misc.js';
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
export class ClaimCachePolicy<T extends NumberType> extends BaseNumberTypeClass<ClaimCachePolicy<T>> implements iClaimCachePolicy<T> {
  ttl?: T;
  alwaysPermanent?: boolean;
  permanentAfter?: UNIXMilliTimestamp<T>;

  constructor(data: iClaimCachePolicy<T>) {
    super();
    this.ttl = data.ttl;
    this.alwaysPermanent = data.alwaysPermanent;
    this.permanentAfter = data.permanentAfter;
  }

  getNumberFieldNames(): string[] {
    return ['ttl', 'permanentAfter'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ClaimCachePolicy<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimCachePolicy<U>;
  }
}

/**
 * @inheritDoc iChallengeTrackerIdDetails
 * @category Approvals / Transferability
 */
export class ChallengeTrackerIdDetails<T extends NumberType>
  extends BaseNumberTypeClass<ChallengeTrackerIdDetails<T>>
  implements iChallengeTrackerIdDetails<T>
{
  collectionId: CollectionId;
  approvalId: string;
  challengeTrackerId: string;
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  approverAddress: BitBadgesAddress;

  constructor(data: iChallengeTrackerIdDetails<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ChallengeTrackerIdDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ChallengeTrackerIdDetails<U>;
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
export class ClaimDetails<T extends NumberType> extends BaseNumberTypeClass<ClaimDetails<T>> implements iClaimDetails<T> {
  claimId: string;
  balancesToSet?: PredeterminedBalances<T>;
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  manualDistribution?: boolean;
  approach?: string;
  seedCode?: string | undefined;
  metadata?: Metadata<T> | undefined;
  assignMethod?: string | undefined;
  satisfyMethod?: SatisfyMethod;
  lastUpdated?: T | undefined;
  version: T;
  collectionId?: CollectionId;
  standaloneClaim?: boolean;
  listId?: string;
  rewards?: ClaimReward<T>[];
  estimatedCost?: string;
  estimatedTime?: string;
  showInSearchResults?: boolean;
  categories?: string[];
  trackerDetails?: ChallengeTrackerIdDetails<T>;
  createdBy?: BitBadgesAddress;
  managedBy?: BitBadgesAddress;
  _includesPrivateParams: boolean;
  _templateInfo?: {
    supportedApproaches?: string[];
    pluginId?: string;
    completedTemplateStep?: boolean;
  };
  cachePolicy?: ClaimCachePolicy<T>;

  constructor(data: iClaimDetails<T>) {
    super();
    this._templateInfo = data._templateInfo;
    this._includesPrivateParams = data._includesPrivateParams;
    this.claimId = data.claimId;
    this.balancesToSet = data.balancesToSet ? new PredeterminedBalances(data.balancesToSet) : undefined;
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
    this.listId = data.listId;
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

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): ClaimDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimDetails<U>;
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
export class UserOutgoingApproval<T extends NumberType> extends BaseNumberTypeClass<UserOutgoingApproval<T>> implements iUserOutgoingApproval<T> {
  toListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray<T>;
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  approvalId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: OutgoingApprovalCriteria<T>;
  version: T;

  constructor(msg: iUserOutgoingApproval<T>) {
    super();
    this.toListId = msg.toListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.badgeIds = UintRangeArray.From(msg.badgeIds);
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserOutgoingApproval<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserOutgoingApproval<U>;
  }

  toProto(): badges.UserOutgoingApproval {
    return new badges.UserOutgoingApproval(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserOutgoingApproval<U> {
    return UserOutgoingApproval.fromProto(badges.UserOutgoingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserOutgoingApproval<U> {
    return UserOutgoingApproval.fromProto(badges.UserOutgoingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.UserOutgoingApproval, convertFunction: (item: NumberType) => U): UserOutgoingApproval<U> {
    return new UserOutgoingApproval<U>({
      toListId: item.toListId,
      initiatedByListId: item.initiatedByListId,
      transferTimes: item.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: item.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: item.approvalId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? OutgoingApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined,
      version: convertFunction(item.version)
    });
  }

  toBech32Addresses(prefix: string): UserOutgoingApproval<T> {
    return new UserOutgoingApproval({
      ...this,
      toListId: convertListIdToBech32(this.toListId, prefix),
      initiatedByListId: convertListIdToBech32(this.initiatedByListId, prefix),
      approvalCriteria: this.approvalCriteria?.toBech32Addresses(prefix)
    });
  }
}

/**
 * OutgoingApprovalCriteria represents the details of an outgoing approval.
 *
 * @category Approvals / Transferability
 */
export class OutgoingApprovalCriteria<T extends NumberType>
  extends BaseNumberTypeClass<OutgoingApprovalCriteria<T>>
  implements iOutgoingApprovalCriteria<T>
{
  merkleChallenges?: MerkleChallenge<T>[];
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;
  requireToEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;
  coinTransfers?: CoinTransfer<T>[] | undefined;

  constructor(msg: iOutgoingApprovalCriteria<T>) {
    super();
    this.merkleChallenges = msg.merkleChallenges?.map((x) => new MerkleChallenge(x));
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireToEqualsInitiatedBy = msg.requireToEqualsInitiatedBy;
    this.requireToDoesNotEqualInitiatedBy = msg.requireToDoesNotEqualInitiatedBy;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): OutgoingApprovalCriteria<U> {
    return new OutgoingApprovalCriteria(
      deepCopyPrimitives({
        merkleChallenges: this.merkleChallenges?.map((x) => x.convert(convertFunction)),
        predeterminedBalances: this.predeterminedBalances?.convert(convertFunction),
        approvalAmounts: this.approvalAmounts?.convert(convertFunction),
        maxNumTransfers: this.maxNumTransfers?.convert(convertFunction),
        requireToEqualsInitiatedBy: this.requireToEqualsInitiatedBy,
        requireToDoesNotEqualInitiatedBy: this.requireToDoesNotEqualInitiatedBy,
        coinTransfers: this.coinTransfers?.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.OutgoingApprovalCriteria {
    return new badges.OutgoingApprovalCriteria(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): OutgoingApprovalCriteria<U> {
    return OutgoingApprovalCriteria.fromProto(badges.OutgoingApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): OutgoingApprovalCriteria<U> {
    return OutgoingApprovalCriteria.fromProto(badges.OutgoingApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: badges.OutgoingApprovalCriteria,
    convertFunction: (item: NumberType) => U
  ): OutgoingApprovalCriteria<U> {
    return new OutgoingApprovalCriteria<U>({
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      requireToEqualsInitiatedBy: item.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: item.requireToDoesNotEqualInitiatedBy,
      coinTransfers: item.coinTransfers ? item.coinTransfers.map((x) => CoinTransfer.fromProto(x, convertFunction)) : undefined
    });
  }

  castToCollectionApprovalCriteria(): ApprovalCriteria<T> {
    return new ApprovalCriteria({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      requireToEqualsInitiatedBy: this.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: this.requireToDoesNotEqualInitiatedBy,
      merkleChallenges: this.merkleChallenges,
      coinTransfers: this.coinTransfers,

      requireFromEqualsInitiatedBy: false,
      requireFromDoesNotEqualInitiatedBy: false,
      overridesFromOutgoingApprovals: false,
      overridesToIncomingApprovals: false
    });
  }

  toBech32Addresses(prefix: string): OutgoingApprovalCriteria<T> {
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
export class PredeterminedBalances<T extends NumberType> extends BaseNumberTypeClass<PredeterminedBalances<T>> implements iPredeterminedBalances<T> {
  manualBalances: ManualBalances<T>[];
  incrementedBalances: IncrementedBalances<T>;
  orderCalculationMethod: PredeterminedOrderCalculationMethod;

  constructor(msg: iPredeterminedBalances<T>) {
    super();
    this.manualBalances = msg.manualBalances.map((x) => new ManualBalances(x));
    this.incrementedBalances = new IncrementedBalances(msg.incrementedBalances);
    this.orderCalculationMethod = new PredeterminedOrderCalculationMethod(msg.orderCalculationMethod);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PredeterminedBalances<U> {
    return new PredeterminedBalances(
      deepCopyPrimitives({
        manualBalances: this.manualBalances.map((x) => x.convert(convertFunction)),
        incrementedBalances: this.incrementedBalances.convert(convertFunction),
        orderCalculationMethod: this.orderCalculationMethod
      })
    );
  }

  toProto(): badges.PredeterminedBalances {
    return new badges.PredeterminedBalances(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PredeterminedBalances<U> {
    return PredeterminedBalances.fromProto(badges.PredeterminedBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PredeterminedBalances<U> {
    return PredeterminedBalances.fromProto(badges.PredeterminedBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.PredeterminedBalances, convertFunction: (item: NumberType) => U): PredeterminedBalances<U> {
    return new PredeterminedBalances<U>({
      manualBalances: item.manualBalances.map((x) => ManualBalances.fromProto(x, convertFunction)),
      incrementedBalances: item.incrementedBalances
        ? IncrementedBalances.fromProto(item.incrementedBalances, convertFunction)
        : new IncrementedBalances({
            startBalances: [],
            incrementBadgeIdsBy: convertFunction(0),
            incrementOwnershipTimesBy: convertFunction(0),
            approvalDurationFromNow: convertFunction(0)
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
export class ManualBalances<T extends NumberType> extends BaseNumberTypeClass<ManualBalances<T>> implements iManualBalances<T> {
  /** The list of balances for each transfer. Order number corresponds to the index of the balance in the array. */
  balances: BalanceArray<T>;

  constructor(msg: iManualBalances<T>) {
    super();
    this.balances = BalanceArray.From(msg.balances);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ManualBalances<U> {
    return new ManualBalances(
      deepCopyPrimitives({
        balances: this.balances.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.ManualBalances {
    return new badges.ManualBalances(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ManualBalances<U> {
    return ManualBalances.fromProto(badges.ManualBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ManualBalances<U> {
    return ManualBalances.fromProto(badges.ManualBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.ManualBalances, convertFunction: (item: NumberType) => U): ManualBalances<U> {
    return new ManualBalances<U>({
      balances: item.balances.map((x) => Balance.fromProto(x, convertFunction))
    });
  }
}

/**
 * IncrementedBalances represents predetermined incremented balances for transfers of an approval.
 * You can define a starting balance and increment the badge IDs and owned times by a certain amount.
 *
 * @category Approvals / Transferability
 */
export class IncrementedBalances<T extends NumberType> extends BaseNumberTypeClass<IncrementedBalances<T>> implements iIncrementedBalances<T> {
  startBalances: BalanceArray<T>;
  incrementBadgeIdsBy: T;
  incrementOwnershipTimesBy: T;
  approvalDurationFromNow: T;

  constructor(msg: iIncrementedBalances<T>) {
    super();
    this.startBalances = BalanceArray.From(msg.startBalances);
    this.incrementBadgeIdsBy = msg.incrementBadgeIdsBy;
    this.incrementOwnershipTimesBy = msg.incrementOwnershipTimesBy;
    this.approvalDurationFromNow = msg.approvalDurationFromNow;
  }

  getNumberFieldNames(): string[] {
    return ['incrementBadgeIdsBy', 'incrementOwnershipTimesBy', 'approvalDurationFromNow'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): IncrementedBalances<U> {
    return new IncrementedBalances(
      deepCopyPrimitives({
        startBalances: this.startBalances.map((x) => x.convert(convertFunction)),
        incrementBadgeIdsBy: convertFunction(this.incrementBadgeIdsBy),
        incrementOwnershipTimesBy: convertFunction(this.incrementOwnershipTimesBy),
        approvalDurationFromNow: convertFunction(this.approvalDurationFromNow)
      })
    );
  }

  toProto(): badges.IncrementedBalances {
    return new badges.IncrementedBalances(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IncrementedBalances<U> {
    return IncrementedBalances.fromProto(badges.IncrementedBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IncrementedBalances<U> {
    return IncrementedBalances.fromProto(badges.IncrementedBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.IncrementedBalances, convertFunction: (item: NumberType) => U): IncrementedBalances<U> {
    return new IncrementedBalances<U>({
      startBalances: item.startBalances.map((x) => Balance.fromProto(x, convertFunction)),
      incrementBadgeIdsBy: convertFunction(item.incrementBadgeIdsBy),
      incrementOwnershipTimesBy: convertFunction(item.incrementOwnershipTimesBy),
      approvalDurationFromNow: convertFunction(item.approvalDurationFromNow)
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
export class PredeterminedOrderCalculationMethod
  extends CustomTypeClass<PredeterminedOrderCalculationMethod>
  implements iPredeterminedOrderCalculationMethod
{
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

  toProto(): badges.PredeterminedOrderCalculationMethod {
    return new badges.PredeterminedOrderCalculationMethod(this.toJson());
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PredeterminedOrderCalculationMethod {
    return PredeterminedOrderCalculationMethod.fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PredeterminedOrderCalculationMethod {
    return PredeterminedOrderCalculationMethod.fromJsonString(jsonString, options);
  }

  static fromProto(item: badges.PredeterminedOrderCalculationMethod): PredeterminedOrderCalculationMethod {
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
 * ApprovalAmounts represents the maximum approved amounts for the badge IDs / ownership times of this approval.
 * Can be set to 0 to represent an unlimited amount is approved.
 * If set to non-zero value, we track the running tally of the amount approved for each badge ID / ownership time.
 * Once it reaches the max, no more transfers are allowed.
 *
 * Note that we only track the approval amounts if the approval is defined and not unlimited. If it is unlimited, we do not tally.
 *
 * @category Approvals / Transferability
 */
export class ApprovalAmounts<T extends NumberType> extends BaseNumberTypeClass<ApprovalAmounts<T>> implements iApprovalAmounts<T> {
  overallApprovalAmount: T;
  perToAddressApprovalAmount: T;
  perFromAddressApprovalAmount: T;
  perInitiatedByAddressApprovalAmount: T;
  amountTrackerId: string;

  constructor(msg: iApprovalAmounts<T>) {
    super();
    this.overallApprovalAmount = msg.overallApprovalAmount;
    this.perToAddressApprovalAmount = msg.perToAddressApprovalAmount;
    this.perFromAddressApprovalAmount = msg.perFromAddressApprovalAmount;
    this.perInitiatedByAddressApprovalAmount = msg.perInitiatedByAddressApprovalAmount;
    this.amountTrackerId = msg.amountTrackerId;
  }
  getNumberFieldNames(): string[] {
    return ['overallApprovalAmount', 'perToAddressApprovalAmount', 'perFromAddressApprovalAmount', 'perInitiatedByAddressApprovalAmount'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ApprovalAmounts<U> {
    return new ApprovalAmounts(
      deepCopyPrimitives({
        overallApprovalAmount: convertFunction(this.overallApprovalAmount),
        perToAddressApprovalAmount: convertFunction(this.perToAddressApprovalAmount),
        perFromAddressApprovalAmount: convertFunction(this.perFromAddressApprovalAmount),
        perInitiatedByAddressApprovalAmount: convertFunction(this.perInitiatedByAddressApprovalAmount),
        amountTrackerId: this.amountTrackerId
      })
    );
  }

  toProto(): badges.ApprovalAmounts {
    return new badges.ApprovalAmounts(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalAmounts<U> {
    return ApprovalAmounts.fromProto(badges.ApprovalAmounts.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalAmounts<U> {
    return ApprovalAmounts.fromProto(badges.ApprovalAmounts.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.ApprovalAmounts, convertFunction: (item: NumberType) => U): ApprovalAmounts<U> {
    return new ApprovalAmounts<U>({
      overallApprovalAmount: convertFunction(item.overallApprovalAmount),
      perToAddressApprovalAmount: convertFunction(item.perToAddressApprovalAmount),
      perFromAddressApprovalAmount: convertFunction(item.perFromAddressApprovalAmount),
      perInitiatedByAddressApprovalAmount: convertFunction(item.perInitiatedByAddressApprovalAmount),
      amountTrackerId: item.amountTrackerId
    });
  }
}

/**
 * MaxNumTransfers represents the maximum number of transfers for the badge IDs and ownershipTimes of this approval.
 *
 * Can be set to 0 to represent an unlimited number of transfers.
 * If set to non-zero value, we track the running tally of the number of transfers for each badge ID / ownership time. Once it reaches the max, no more transfers are allowed.
 *
 * Note that we only track the max num transfers if a) the max num transfers here is defined and not unlimited OR b) we need it for calculating the predetermined balances order (i.e. useXYZNumTransfers is set in the PredeterminedOrderCalculationMethod).
 * Otherwise, we do not track the respective number of transfers
 *
 * @category Approvals / Transferability
 */
export class MaxNumTransfers<T extends NumberType> extends BaseNumberTypeClass<MaxNumTransfers<T>> implements iMaxNumTransfers<T> {
  overallMaxNumTransfers: T;
  perToAddressMaxNumTransfers: T;
  perFromAddressMaxNumTransfers: T;
  perInitiatedByAddressMaxNumTransfers: T;
  amountTrackerId: string;

  constructor(msg: iMaxNumTransfers<T>) {
    super();
    this.overallMaxNumTransfers = msg.overallMaxNumTransfers;
    this.perToAddressMaxNumTransfers = msg.perToAddressMaxNumTransfers;
    this.perFromAddressMaxNumTransfers = msg.perFromAddressMaxNumTransfers;
    this.perInitiatedByAddressMaxNumTransfers = msg.perInitiatedByAddressMaxNumTransfers;
    this.amountTrackerId = msg.amountTrackerId;
  }

  getNumberFieldNames(): string[] {
    return ['overallMaxNumTransfers', 'perToAddressMaxNumTransfers', 'perFromAddressMaxNumTransfers', 'perInitiatedByAddressMaxNumTransfers'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MaxNumTransfers<U> {
    return new MaxNumTransfers(
      deepCopyPrimitives({
        overallMaxNumTransfers: convertFunction(this.overallMaxNumTransfers),
        perToAddressMaxNumTransfers: convertFunction(this.perToAddressMaxNumTransfers),
        perFromAddressMaxNumTransfers: convertFunction(this.perFromAddressMaxNumTransfers),
        perInitiatedByAddressMaxNumTransfers: convertFunction(this.perInitiatedByAddressMaxNumTransfers),
        amountTrackerId: this.amountTrackerId
      })
    );
  }

  toProto(): badges.MaxNumTransfers {
    return new badges.MaxNumTransfers(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MaxNumTransfers<U> {
    return MaxNumTransfers.fromProto(badges.MaxNumTransfers.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MaxNumTransfers<U> {
    return MaxNumTransfers.fromProto(badges.MaxNumTransfers.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.MaxNumTransfers, convertFunction: (item: NumberType) => U): MaxNumTransfers<U> {
    return new MaxNumTransfers<U>({
      overallMaxNumTransfers: convertFunction(item.overallMaxNumTransfers),
      perToAddressMaxNumTransfers: convertFunction(item.perToAddressMaxNumTransfers),
      perFromAddressMaxNumTransfers: convertFunction(item.perFromAddressMaxNumTransfers),
      perInitiatedByAddressMaxNumTransfers: convertFunction(item.perInitiatedByAddressMaxNumTransfers),
      amountTrackerId: item.amountTrackerId
    });
  }
}

/**
 * UserIncomingApproval represents a user's approved incoming transfer.
 *
 * @category Approvals / Transferability
 */
export class UserIncomingApproval<T extends NumberType> extends BaseNumberTypeClass<UserIncomingApproval<T>> implements iUserIncomingApproval<T> {
  fromListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray<T>;
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  approvalId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: IncomingApprovalCriteria<T>;
  version: T;

  constructor(msg: iUserIncomingApproval<T>) {
    super();
    this.fromListId = msg.fromListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.badgeIds = UintRangeArray.From(msg.badgeIds);
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserIncomingApproval<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserIncomingApproval<U>;
  }

  toProto(): badges.UserIncomingApproval {
    return new badges.UserIncomingApproval(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserIncomingApproval<U> {
    return UserIncomingApproval.fromProto(badges.UserIncomingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserIncomingApproval<U> {
    return UserIncomingApproval.fromProto(badges.UserIncomingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.UserIncomingApproval, convertFunction: (item: NumberType) => U): UserIncomingApproval<U> {
    return new UserIncomingApproval<U>({
      fromListId: item.fromListId,
      initiatedByListId: item.initiatedByListId,
      transferTimes: item.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: item.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: item.approvalId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? IncomingApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined,
      version: convertFunction(item.version)
    });
  }

  castToCollectionTransfer(toAddress: string): CollectionApproval<T> {
    return new CollectionApproval({
      ...this,
      toListId: toAddress,
      approvalCriteria: this.approvalCriteria?.castToCollectionApprovalCriteria()
    });
  }

  toBech32Addresses(prefix: string): UserIncomingApproval<T> {
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
export class IncomingApprovalCriteria<T extends NumberType>
  extends BaseNumberTypeClass<IncomingApprovalCriteria<T>>
  implements iIncomingApprovalCriteria<T>
{
  merkleChallenges?: MerkleChallenge<T>[];
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;
  requireFromEqualsInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;
  coinTransfers?: CoinTransfer<T>[] | undefined;

  constructor(msg: iIncomingApprovalCriteria<T>) {
    super();
    this.merkleChallenges = msg.merkleChallenges?.map((x) => new MerkleChallenge(x));
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireFromEqualsInitiatedBy = msg.requireFromEqualsInitiatedBy;
    this.requireFromDoesNotEqualInitiatedBy = msg.requireFromDoesNotEqualInitiatedBy;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): IncomingApprovalCriteria<U> {
    return new IncomingApprovalCriteria(
      deepCopyPrimitives({
        merkleChallenge: this.merkleChallenges?.map((x) => x.convert(convertFunction)),
        predeterminedBalances: this.predeterminedBalances ? this.predeterminedBalances.convert(convertFunction) : undefined,
        approvalAmounts: this.approvalAmounts ? this.approvalAmounts.convert(convertFunction) : undefined,
        maxNumTransfers: this.maxNumTransfers ? this.maxNumTransfers.convert(convertFunction) : undefined,
        requireFromEqualsInitiatedBy: this.requireFromEqualsInitiatedBy,
        requireFromDoesNotEqualInitiatedBy: this.requireFromDoesNotEqualInitiatedBy,
        coinTransfers: this.coinTransfers?.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.IncomingApprovalCriteria {
    return new badges.IncomingApprovalCriteria(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IncomingApprovalCriteria<U> {
    return IncomingApprovalCriteria.fromProto(badges.IncomingApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IncomingApprovalCriteria<U> {
    return IncomingApprovalCriteria.fromProto(badges.IncomingApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: badges.IncomingApprovalCriteria,
    convertFunction: (item: NumberType) => U
  ): IncomingApprovalCriteria<U> {
    return new IncomingApprovalCriteria<U>({
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      requireFromEqualsInitiatedBy: item.requireFromEqualsInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: item.requireFromDoesNotEqualInitiatedBy,

      coinTransfers: item.coinTransfers ? item.coinTransfers.map((x) => CoinTransfer.fromProto(x, convertFunction)) : undefined
    });
  }

  castToCollectionApprovalCriteria(): ApprovalCriteria<T> {
    return new ApprovalCriteria({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      requireFromEqualsInitiatedBy: this.requireFromEqualsInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: this.requireFromDoesNotEqualInitiatedBy,
      predeterminedBalances: this.predeterminedBalances,
      merkleChallenges: this.merkleChallenges,
      coinTransfers: this.coinTransfers,

      requireToEqualsInitiatedBy: false,
      requireToDoesNotEqualInitiatedBy: false,
      overridesFromOutgoingApprovals: false,
      overridesToIncomingApprovals: false
    });
  }

  toBech32Addresses(prefix: string): IncomingApprovalCriteria<T> {
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
export class CollectionApproval<T extends NumberType> extends BaseNumberTypeClass<CollectionApproval<T>> implements iCollectionApproval<T> {
  toListId: string;
  fromListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray<T>;
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  approvalId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: ApprovalCriteria<T>;
  version: T;

  constructor(msg: iCollectionApproval<T>) {
    super();
    this.toListId = msg.toListId;
    this.fromListId = msg.fromListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.badgeIds = UintRangeArray.From(msg.badgeIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.uri = msg.uri;
    this.customData = msg.customData;
    this.approvalCriteria = msg.approvalCriteria ? new ApprovalCriteria(msg.approvalCriteria) : undefined;
    this.version = msg.version;
  }

  static validateUpdate<U extends NumberType>(
    oldApprovals: CollectionApprovalWithDetails<U>[],
    newApprovals: CollectionApprovalWithDetails<U>[],
    canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails<U>[]
  ): Error | null {
    return validateCollectionApprovalsUpdate(
      oldApprovals.map((x) => x.convert(BigIntify)),
      newApprovals.map((x) => x.convert(BigIntify)),
      canUpdateCollectionApprovals.map((x) => x.convert(BigIntify))
    );
  }

  getNumberFieldNames(): string[] {
    return ['version'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionApproval<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionApproval<U>;
  }

  toProto(): badges.CollectionApproval {
    return new badges.CollectionApproval(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionApproval<U> {
    return CollectionApproval.fromProto(badges.CollectionApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionApproval<U> {
    return CollectionApproval.fromProto(badges.CollectionApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.CollectionApproval, convertFunction: (item: NumberType) => U): CollectionApproval<U> {
    return new CollectionApproval<U>({
      toListId: item.toListId,
      fromListId: item.fromListId,
      initiatedByListId: item.initiatedByListId,
      transferTimes: item.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: item.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: item.approvalId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? ApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined,
      version: convertFunction(item.version)
    });
  }

  castToOutgoingApproval(): UserOutgoingApproval<T> {
    return new UserOutgoingApproval({
      ...this,
      toListId: this.toListId,
      initiatedByListId: this.initiatedByListId,
      transferTimes: this.transferTimes,
      badgeIds: this.badgeIds,
      ownershipTimes: this.ownershipTimes,
      approvalCriteria: this.approvalCriteria,
      version: this.version
    });
  }

  castToIncomingApproval(): UserIncomingApproval<T> {
    return new UserIncomingApproval({
      ...this,
      fromListId: this.fromListId,
      initiatedByListId: this.initiatedByListId,
      transferTimes: this.transferTimes,
      badgeIds: this.badgeIds,
      ownershipTimes: this.ownershipTimes,
      approvalCriteria: this.approvalCriteria,
      version: this.version
    });
  }

  toBech32Addresses(prefix: string): CollectionApproval<T> {
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
 *
 * ApprovalCriteria represents the criteria for an approval. The approvee must satisfy all of the criteria to be approved.
 *
 * @category Approvals / Transferability
 */
export class ApprovalCriteria<T extends NumberType> extends BaseNumberTypeClass<ApprovalCriteria<T>> implements iApprovalCriteria<T> {
  merkleChallenges?: MerkleChallenge<T>[];
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;
  requireToEqualsInitiatedBy?: boolean;
  requireFromEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;
  overridesFromOutgoingApprovals?: boolean;
  overridesToIncomingApprovals?: boolean;
  coinTransfers?: CoinTransfer<T>[] | undefined;

  constructor(msg: iApprovalCriteria<T>) {
    super();
    this.merkleChallenges = msg.merkleChallenges?.map((x) => new MerkleChallenge(x));
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireToEqualsInitiatedBy = msg.requireToEqualsInitiatedBy;
    this.requireFromEqualsInitiatedBy = msg.requireFromEqualsInitiatedBy;
    this.requireToDoesNotEqualInitiatedBy = msg.requireToDoesNotEqualInitiatedBy;
    this.requireFromDoesNotEqualInitiatedBy = msg.requireFromDoesNotEqualInitiatedBy;
    this.overridesFromOutgoingApprovals = msg.overridesFromOutgoingApprovals;
    this.overridesToIncomingApprovals = msg.overridesToIncomingApprovals;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ApprovalCriteria<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApprovalCriteria<U>;
  }

  toProto(): badges.ApprovalCriteria {
    return new badges.ApprovalCriteria(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalCriteria<U> {
    return ApprovalCriteria.fromProto(badges.ApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalCriteria<U> {
    return ApprovalCriteria.fromProto(badges.ApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: badges.ApprovalCriteria, convertFunction: (item: NumberType) => U): ApprovalCriteria<U> {
    return new ApprovalCriteria<U>({
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      coinTransfers: item.coinTransfers ? item.coinTransfers.map((x) => CoinTransfer.fromProto(x, convertFunction)) : undefined,
      requireToEqualsInitiatedBy: item.requireToEqualsInitiatedBy,
      requireFromEqualsInitiatedBy: item.requireFromEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: item.requireToDoesNotEqualInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: item.requireFromDoesNotEqualInitiatedBy,
      overridesFromOutgoingApprovals: item.overridesFromOutgoingApprovals,
      overridesToIncomingApprovals: item.overridesToIncomingApprovals
    });
  }

  toBech32Addresses(prefix: string): ApprovalCriteria<T> {
    return new ApprovalCriteria({
      ...this,
      coinTransfers: this.coinTransfers?.map((x) => x.toBech32Addresses(prefix))
    });
  }
}

/**
 * @category Approvals / Transferability
 */
export interface iUserOutgoingApprovalWithDetails<T extends NumberType> extends iUserOutgoingApproval<T> {
  /** The populated address list for the toListId */
  toList: iAddressList;
  /** The populated address list for the initiatedByListId */
  initiatedByList: iAddressList;
  approvalCriteria?: iOutgoingApprovalCriteriaWithDetails<T>;
  details?: iApprovalInfoDetails;
}

/**
 * @category Approvals / Transferability
 */
export class UserOutgoingApprovalWithDetails<T extends NumberType> extends UserOutgoingApproval<T> implements iUserOutgoingApprovalWithDetails<T> {
  toList: AddressList;
  initiatedByList: AddressList;
  approvalCriteria?: OutgoingApprovalCriteriaWithDetails<T> | undefined;
  details?: iApprovalInfoDetails | undefined;

  constructor(data: iUserOutgoingApprovalWithDetails<T>) {
    super(data);
    this.toList = new AddressList(data.toList);
    this.initiatedByList = new AddressList(data.initiatedByList);
    this.approvalCriteria = data.approvalCriteria ? new OutgoingApprovalCriteriaWithDetails(data.approvalCriteria) : undefined;
    this.details = data.details ? new ApprovalInfoDetails(data.details) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserOutgoingApprovalWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserOutgoingApprovalWithDetails<U>;
  }

  clone(): UserOutgoingApprovalWithDetails<T> {
    return super.clone() as UserOutgoingApprovalWithDetails<T>;
  }

  castToCollectionTransfer(fromAddress: string): CollectionApprovalWithDetails<T> {
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
export class UserIncomingApprovalWithDetails<T extends NumberType> extends UserIncomingApproval<T> implements iUserIncomingApprovalWithDetails<T> {
  details?: ApprovalInfoDetails<T>;
  fromList: AddressList;
  initiatedByList: AddressList;
  approvalCriteria?: IncomingApprovalCriteriaWithDetails<T> | undefined;

  constructor(data: iUserIncomingApprovalWithDetails<T>) {
    super(data);
    this.details = data.details ? new ApprovalInfoDetails(data.details) : undefined;
    this.fromList = new AddressList(data.fromList);
    this.initiatedByList = new AddressList(data.initiatedByList);
    this.approvalCriteria = data.approvalCriteria ? new IncomingApprovalCriteriaWithDetails(data.approvalCriteria) : undefined;
  }

  clone(): UserIncomingApprovalWithDetails<T> {
    return super.clone() as UserIncomingApprovalWithDetails<T>;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserIncomingApprovalWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserIncomingApprovalWithDetails<U>;
  }

  castToCollectionTransfer(toAddress: string): CollectionApprovalWithDetails<T> {
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
export interface iChallengeDetails<T extends NumberType> {
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
  numLeaves?: T;
  /** The current code being used for the challenge. Used behind the scenes */
  currCode?: T;
}

/**
 * @category Approvals / Transferability
 */
export class ChallengeDetails<T extends NumberType> extends BaseNumberTypeClass<ChallengeDetails<T>> implements iChallengeDetails<T> {
  treeOptions?: MerkleTreeJsOptions;
  numLeaves?: T;
  leaves: string[];
  isHashed: boolean;
  preimages?: string[] | undefined;
  seedCode?: string | undefined;
  tree?: MerkleTree | undefined;

  constructor(data: iChallengeDetails<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ChallengeDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ChallengeDetails<U>;
  }
}

/**
 * @category Interfaces
 */
export interface iChallengeInfoDetails<T extends NumberType> {
  /** The challenge details of the claim / approval */
  challengeDetails: iChallengeDetails<T>;

  claim?: iClaimDetails<T>;
}

/**
 * @category Interfaces
 */
export interface iChallengeInfoDetailsUpdate<T extends NumberType> {
  /** The challenge details of the claim / approval */
  challengeDetails: iChallengeDetails<T>;

  claim?: CreateClaimRequest<T>;
}

/**
 * @category Interfaces
 */
export interface iApprovalInfoDetails {
  /** The name of the claim */
  name: string;

  /** The description of the claim. This describes how to earn and claim the badge. */
  description: string;

  /** The image of the claim */
  image: string;
}

/**
 * @category Approvals / Transferability
 */
export class ChallengeInfoDetails<T extends NumberType> extends BaseNumberTypeClass<ChallengeInfoDetails<T>> implements iChallengeInfoDetails<T> {
  challengeDetails: ChallengeDetails<T>;
  claim?: ClaimDetails<T>;

  constructor(data: iChallengeInfoDetails<T>) {
    super();
    this.challengeDetails = new ChallengeDetails(data.challengeDetails);
    this.claim = data.claim ? new ClaimDetails(data.claim) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ChallengeInfoDetails<U> {
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
export class ApprovalInfoDetails<T extends NumberType> extends BaseNumberTypeClass<ApprovalInfoDetails<T>> implements iApprovalInfoDetails {
  name: string;
  description: string;
  image: string;

  constructor(data: iApprovalInfoDetails) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ApprovalInfoDetails<U> {
    return new ApprovalInfoDetails(deepCopyPrimitives({ ...this }));
  }
}

/**
 * @category Interfaces
 */
export interface iMerkleChallengeWithDetails<T extends NumberType> extends iMerkleChallenge<T> {
  challengeInfoDetails: iChallengeInfoDetails<T>;
}

/**
 * @category Approvals / Transferability
 */
export class MerkleChallengeWithDetails<T extends NumberType> extends MerkleChallenge<T> implements iMerkleChallengeWithDetails<T> {
  challengeInfoDetails: ChallengeInfoDetails<T>;

  constructor(data: iMerkleChallengeWithDetails<T>) {
    super(data);
    this.challengeInfoDetails = new ChallengeInfoDetails(data.challengeInfoDetails);
  }

  getNumberFieldNames(): string[] {
    return super.getNumberFieldNames().concat(this.challengeInfoDetails.challengeDetails.getNumberFieldNames());
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MerkleChallengeWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MerkleChallengeWithDetails<U>;
  }

  clone(): MerkleChallengeWithDetails<T> {
    return super.clone() as MerkleChallengeWithDetails<T>;
  }
}

/**
 * @category Interfaces
 */
export interface iApprovalCriteriaWithDetails<T extends NumberType> extends iApprovalCriteria<T> {
  merkleChallenges?: iMerkleChallengeWithDetails<T>[];
}

/**
 * @category Approvals / Transferability
 */
export class ApprovalCriteriaWithDetails<T extends NumberType> extends ApprovalCriteria<T> implements iApprovalCriteriaWithDetails<T> {
  merkleChallenges?: MerkleChallengeWithDetails<T>[];

  constructor(data: iApprovalCriteriaWithDetails<T>) {
    super(data);
    this.merkleChallenges = data.merkleChallenges?.map((x) => new MerkleChallengeWithDetails(x));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ApprovalCriteriaWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApprovalCriteriaWithDetails<U>;
  }

  clone(): ApprovalCriteriaWithDetails<T> {
    return super.clone() as ApprovalCriteriaWithDetails<T>;
  }
}

/**
 * @category Interfaces
 */
export interface iIncomingApprovalCriteriaWithDetails<T extends NumberType> extends iIncomingApprovalCriteria<T> {
  merkleChallenges?: iMerkleChallengeWithDetails<T>[];
}

/**
 * @category Approvals / Transferability
 */
export class IncomingApprovalCriteriaWithDetails<T extends NumberType>
  extends IncomingApprovalCriteria<T>
  implements iIncomingApprovalCriteriaWithDetails<T>
{
  merkleChallenges?: MerkleChallengeWithDetails<T>[];

  constructor(data: iIncomingApprovalCriteriaWithDetails<T>) {
    super(data);
    this.merkleChallenges = data.merkleChallenges?.map((x) => new MerkleChallengeWithDetails(x));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): IncomingApprovalCriteriaWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as IncomingApprovalCriteriaWithDetails<U>;
  }

  clone(): IncomingApprovalCriteriaWithDetails<T> {
    return super.clone() as IncomingApprovalCriteriaWithDetails<T>;
  }

  castToCollectionApprovalCriteria(): ApprovalCriteriaWithDetails<T> {
    return new ApprovalCriteriaWithDetails({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      predeterminedBalances: this.predeterminedBalances,
      merkleChallenges: this.merkleChallenges,
      coinTransfers: this.coinTransfers,

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
export interface iOutgoingApprovalCriteriaWithDetails<T extends NumberType> extends iOutgoingApprovalCriteria<T> {
  merkleChallenges?: iMerkleChallengeWithDetails<T>[];
}

/**
 * @category Approvals / Transferability
 */
export class OutgoingApprovalCriteriaWithDetails<T extends NumberType>
  extends OutgoingApprovalCriteria<T>
  implements iOutgoingApprovalCriteriaWithDetails<T>
{
  merkleChallenges?: MerkleChallengeWithDetails<T>[];

  constructor(data: iOutgoingApprovalCriteriaWithDetails<T>) {
    super(data);
    this.merkleChallenges = data.merkleChallenges?.map((x) => new MerkleChallengeWithDetails(x));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): OutgoingApprovalCriteriaWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as OutgoingApprovalCriteriaWithDetails<U>;
  }

  clone(): OutgoingApprovalCriteriaWithDetails<T> {
    return super.clone() as OutgoingApprovalCriteriaWithDetails<T>;
  }

  castToCollectionApprovalCriteria(): ApprovalCriteriaWithDetails<T> {
    return new ApprovalCriteriaWithDetails({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      predeterminedBalances: this.predeterminedBalances,
      merkleChallenges: this.merkleChallenges,
      coinTransfers: this.coinTransfers,

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
export interface iCollectionApprovalWithDetails<T extends NumberType> extends iCollectionApproval<T> {
  /** The approval metadata details */
  details?: iApprovalInfoDetails;
  /** The populated address list for the toListId */
  toList: iAddressList;
  /** The populated address list for the fromListId */
  fromList: iAddressList;
  /** The populated address list for the initiatedByListId */
  initiatedByList: iAddressList;
  approvalCriteria?: iApprovalCriteriaWithDetails<T>;
}

/**
 * @category Approvals / Transferability
 */
export class CollectionApprovalWithDetails<T extends NumberType> extends CollectionApproval<T> implements iCollectionApprovalWithDetails<T> {
  details?: ApprovalInfoDetails<T>;
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;
  approvalCriteria?: ApprovalCriteriaWithDetails<T>;

  constructor(data: iCollectionApprovalWithDetails<T>) {
    super(data);
    this.details = data.details ? new ApprovalInfoDetails(data.details) : undefined;
    this.toList = new AddressList(data.toList);
    this.fromList = new AddressList(data.fromList);
    this.initiatedByList = new AddressList(data.initiatedByList);
    this.approvalCriteria = data.approvalCriteria ? new ApprovalCriteriaWithDetails(data.approvalCriteria) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionApprovalWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionApprovalWithDetails<U>;
  }

  clone(): CollectionApprovalWithDetails<T> {
    return super.clone() as CollectionApprovalWithDetails<T>;
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      badgeIds: this.badgeIds.convert(BigIntify),
      transferTimes: this.transferTimes.convert(BigIntify),
      ownershipTimes: this.ownershipTimes.convert(BigIntify),
      fromList: this.fromList,
      toList: this.toList,
      initiatedByList: this.initiatedByList,
      approvalIdList: getReservedTrackerList(this.approvalId),
      usesApprovalIdList: true,
      usesBadgeIds: true,
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

  castToOutgoingApproval(): UserOutgoingApprovalWithDetails<T> {
    return new UserOutgoingApprovalWithDetails({
      ...this,
      toListId: this.toListId,
      toList: this.toList,
      initiatedByList: this.initiatedByList,
      initiatedByListId: this.initiatedByListId,
      transferTimes: this.transferTimes,
      badgeIds: this.badgeIds,
      ownershipTimes: this.ownershipTimes,
      approvalCriteria: this.approvalCriteria
    });
  }

  castToIncomingApproval(): UserIncomingApprovalWithDetails<T> {
    return new UserIncomingApprovalWithDetails({
      ...this,
      fromList: this.fromList,
      fromListId: this.fromListId,
      initiatedByListId: this.initiatedByListId,
      transferTimes: this.transferTimes,
      badgeIds: this.badgeIds,
      ownershipTimes: this.ownershipTimes,
      approvalCriteria: this.approvalCriteria
    });
  }

  static validateUpdate<U extends NumberType>(
    oldApprovals: CollectionApprovalWithDetails<U>[],
    newApprovals: CollectionApprovalWithDetails<U>[],
    canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails<U>[]
  ): Error | null {
    return validateCollectionApprovalsUpdate(
      oldApprovals.map((x) => x.convert(BigIntify)),
      newApprovals.map((x) => x.convert(BigIntify)),
      canUpdateCollectionApprovals.map((x) => x.convert(BigIntify))
    );
  }
}

interface ApprovalCriteriaWithIsApproved {
  isApproved: boolean;
  approvalCriteria: (ApprovalCriteria<bigint> | null)[];
}

/**
 * @category Approvals / Transferability
 *
 * @hidden
 */
export function getFirstMatchOnlyWithApprovalCriteria(permissions: UniversalPermission[]): UniversalPermissionDetails[] {
  let handled: UniversalPermissionDetails[] = [];

  for (const permission of permissions) {
    const badgeIds = GetUintRangesWithOptions(permission.badgeIds, permission.usesBadgeIds);
    const timelineTimes = GetUintRangesWithOptions(permission.timelineTimes, permission.usesTimelineTimes);
    const transferTimes = GetUintRangesWithOptions(permission.transferTimes, permission.usesTransferTimes);
    const ownershipTimes = GetUintRangesWithOptions(permission.ownershipTimes, permission.usesOwnershipTimes);
    const permanentlyPermittedTimes = GetUintRangesWithOptions(permission.permanentlyPermittedTimes, true);
    const permanentlyForbiddenTimes = GetUintRangesWithOptions(permission.permanentlyForbiddenTimes, true);

    for (const badgeId of badgeIds) {
      for (const timelineTime of timelineTimes) {
        for (const transferTime of transferTimes) {
          for (const ownershipTime of ownershipTimes) {
            const approvalCriteria: ApprovalCriteria<bigint>[] = [permission.arbitraryValue.approvalCriteria ?? null];

            const isApproved: boolean = permission.arbitraryValue.isApproved;
            const arbValue: ApprovalCriteriaWithIsApproved = {
              isApproved: isApproved,
              approvalCriteria: approvalCriteria
            };

            const brokenDown: UniversalPermissionDetails[] = [
              {
                badgeId: badgeId,
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
              const mergedApprovalCriteria: (ApprovalCriteria<bigint> | null)[] = overlap.secondDetails.arbitraryValue.approvalCriteria.concat(
                overlap.firstDetails.arbitraryValue.approvalCriteria
              );

              const isApprovedFirst: boolean = overlap.firstDetails.arbitraryValue.isApproved;
              const isApprovedSecond: boolean = overlap.secondDetails.arbitraryValue.isApproved;
              const isApproved: boolean = isApprovedFirst && isApprovedSecond;

              const newArbValue: ApprovalCriteriaWithIsApproved = {
                isApproved: isApproved,
                approvalCriteria: mergedApprovalCriteria
              };

              handled.push({
                timelineTime: overlap.overlap.timelineTime,
                badgeId: overlap.overlap.badgeId,
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

    while (idxToInsert < returnArr.length && handledItem.badgeId.start > returnArr[idxToInsert].badgeId.start) {
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
export function validateCollectionApprovalsUpdate<T extends NumberType>(
  oldApprovals: CollectionApprovalWithDetails<T>[],
  newApprovals: CollectionApprovalWithDetails<T>[],
  canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails<T>[]
): Error | null {
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
      if (
        (oldDetails.arbitraryValue === null && newDetails.arbitraryValue !== null) ||
        (oldDetails.arbitraryValue !== null && newDetails.arbitraryValue === null)
      ) {
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
      badgeIds: UintRangeArray.From([x.badgeId]),
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
export function expandCollectionApprovals(approvals: CollectionApprovalWithDetails<bigint>[]): CollectionApprovalWithDetails<bigint>[] {
  const newCurrApprovals: CollectionApprovalWithDetails<bigint>[] = [];
  for (const approval of approvals) {
    const badgeIds = GetUintRangesWithOptions(approval.badgeIds, true);
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
        badgeIds: badgeIds,
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
