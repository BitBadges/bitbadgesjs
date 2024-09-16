import { ClaimIntegrationPluginType, iClaimDetails, IntegrationPluginDetails } from '@/api-indexer/docs/interfaces.js';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes, deepCopyPrimitives } from '@/common/base.js';
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
import type { iAddressList, iCoinTransfer, iMerkleChallenge } from '@/interfaces/badges/core.js';
import * as proto from '@/proto/index.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type MerkleTree from 'merkletreejs';
import type { Options as MerkleTreeJsOptions } from 'merkletreejs/dist/MerkleTree';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers.js';
import { AddressList } from './addressLists.js';
import { Balance, BalanceArray } from './balances.js';
import { CoinTransfer, MerkleChallenge, MustOwnBadges, ZkProof } from './misc.js';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps.js';
import { GetListIdWithOptions, GetListWithOptions, GetUintRangesWithOptions, getOverlapsAndNonOverlaps } from './overlaps.js';
import type { CollectionApprovalPermissionWithDetails } from './permissions.js';
import { CollectionApprovalPermission } from './permissions.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { AllDefaultValues, getPotentialUpdatesForTimelineValues, getUpdateCombinationsToCheck } from './validate-utils.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';

const { getReservedAddressList, getReservedTrackerList } = AddressList;

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
  lastUpdated?: T | undefined;
  version: T;
  collectionId?: T;
  siwbbClaim?: boolean;
  listId?: string;

  constructor(data: iClaimDetails<T>) {
    super();
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
    this.siwbbClaim = data.siwbbClaim;
    this.listId = data.listId;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): ClaimDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ClaimDetails<U>;
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdated', 'version', 'collectionId'];
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
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserOutgoingApproval<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserOutgoingApproval<U>;
  }

  toProto(): proto.badges.UserOutgoingApproval {
    return new proto.badges.UserOutgoingApproval(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserOutgoingApproval<U> {
    return UserOutgoingApproval.fromProto(proto.badges.UserOutgoingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserOutgoingApproval<U> {
    return UserOutgoingApproval.fromProto(proto.badges.UserOutgoingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.UserOutgoingApproval, convertFunction: (item: NumberType) => U): UserOutgoingApproval<U> {
    return new UserOutgoingApproval<U>({
      toListId: item.toListId,
      initiatedByListId: item.initiatedByListId,
      transferTimes: item.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: item.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: item.approvalId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? OutgoingApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined
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
  mustOwnBadges?: MustOwnBadges<T>[];
  merkleChallenges?: MerkleChallenge<T>[];
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;
  requireToEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;
  zkProofs?: ZkProof[];
  coinTransfers?: CoinTransfer<T>[] | undefined;

  constructor(msg: iOutgoingApprovalCriteria<T>) {
    super();
    this.mustOwnBadges = msg.mustOwnBadges?.map((x) => new MustOwnBadges(x));
    this.merkleChallenges = msg.merkleChallenges?.map((x) => new MerkleChallenge(x));
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireToEqualsInitiatedBy = msg.requireToEqualsInitiatedBy;
    this.requireToDoesNotEqualInitiatedBy = msg.requireToDoesNotEqualInitiatedBy;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
    this.zkProofs = msg.zkProofs ? msg.zkProofs.map((x) => new ZkProof(x)) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): OutgoingApprovalCriteria<U> {
    return new OutgoingApprovalCriteria(
      deepCopyPrimitives({
        mustOwnBadges: this.mustOwnBadges?.map((x) => x.convert(convertFunction)),
        merkleChallenges: this.merkleChallenges?.map((x) => x.convert(convertFunction)),
        predeterminedBalances: this.predeterminedBalances?.convert(convertFunction),
        approvalAmounts: this.approvalAmounts?.convert(convertFunction),
        maxNumTransfers: this.maxNumTransfers?.convert(convertFunction),
        requireToEqualsInitiatedBy: this.requireToEqualsInitiatedBy,
        requireToDoesNotEqualInitiatedBy: this.requireToDoesNotEqualInitiatedBy,
        zkProofs: this.zkProofs?.map((x) => x),
        coinTransfers: this.coinTransfers?.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): proto.badges.OutgoingApprovalCriteria {
    return new proto.badges.OutgoingApprovalCriteria(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): OutgoingApprovalCriteria<U> {
    return OutgoingApprovalCriteria.fromProto(proto.badges.OutgoingApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): OutgoingApprovalCriteria<U> {
    return OutgoingApprovalCriteria.fromProto(proto.badges.OutgoingApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: proto.badges.OutgoingApprovalCriteria,
    convertFunction: (item: NumberType) => U
  ): OutgoingApprovalCriteria<U> {
    return new OutgoingApprovalCriteria<U>({
      mustOwnBadges: item.mustOwnBadges.map((x) => MustOwnBadges.fromProto(x, convertFunction)),
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      requireToEqualsInitiatedBy: item.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: item.requireToDoesNotEqualInitiatedBy,
      zkProofs: item.zkProofs,
      coinTransfers: item.coinTransfers ? item.coinTransfers.map((x) => CoinTransfer.fromProto(x, convertFunction)) : undefined
    });
  }

  castToCollectionApprovalCriteria(): ApprovalCriteria<T> {
    return new ApprovalCriteria({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      requireToEqualsInitiatedBy: this.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: this.requireToDoesNotEqualInitiatedBy,
      predeterminedBalances: this.predeterminedBalances,
      mustOwnBadges: this.mustOwnBadges,
      merkleChallenges: this.merkleChallenges,
      zkProofs: this.zkProofs,
      coinTransfers: this.coinTransfers,

      requireFromEqualsInitiatedBy: false,
      requireFromDoesNotEqualInitiatedBy: false,
      overridesFromOutgoingApprovals: false,
      overridesToIncomingApprovals: false
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): PredeterminedBalances<U> {
    return new PredeterminedBalances(
      deepCopyPrimitives({
        manualBalances: this.manualBalances.map((x) => x.convert(convertFunction)),
        incrementedBalances: this.incrementedBalances.convert(convertFunction),
        orderCalculationMethod: this.orderCalculationMethod
      })
    );
  }

  toProto(): proto.badges.PredeterminedBalances {
    return new proto.badges.PredeterminedBalances(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PredeterminedBalances<U> {
    return PredeterminedBalances.fromProto(proto.badges.PredeterminedBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PredeterminedBalances<U> {
    return PredeterminedBalances.fromProto(proto.badges.PredeterminedBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: proto.badges.PredeterminedBalances,
    convertFunction: (item: NumberType) => U
  ): PredeterminedBalances<U> {
    return new PredeterminedBalances<U>({
      manualBalances: item.manualBalances.map((x) => ManualBalances.fromProto(x, convertFunction)),
      incrementedBalances: item.incrementedBalances
        ? IncrementedBalances.fromProto(item.incrementedBalances, convertFunction)
        : new IncrementedBalances({
            startBalances: [],
            incrementBadgeIdsBy: convertFunction(0),
            incrementOwnershipTimesBy: convertFunction(0)
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ManualBalances<U> {
    return new ManualBalances(
      deepCopyPrimitives({
        balances: this.balances.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): proto.badges.ManualBalances {
    return new proto.badges.ManualBalances(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ManualBalances<U> {
    return ManualBalances.fromProto(proto.badges.ManualBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ManualBalances<U> {
    return ManualBalances.fromProto(proto.badges.ManualBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.ManualBalances, convertFunction: (item: NumberType) => U): ManualBalances<U> {
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

  constructor(msg: iIncrementedBalances<T>) {
    super();
    this.startBalances = BalanceArray.From(msg.startBalances);
    this.incrementBadgeIdsBy = msg.incrementBadgeIdsBy;
    this.incrementOwnershipTimesBy = msg.incrementOwnershipTimesBy;
  }

  getNumberFieldNames(): string[] {
    return ['incrementBadgeIdsBy', 'incrementOwnershipTimesBy'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): IncrementedBalances<U> {
    return new IncrementedBalances(
      deepCopyPrimitives({
        startBalances: this.startBalances.map((x) => x.convert(convertFunction)),
        incrementBadgeIdsBy: convertFunction(this.incrementBadgeIdsBy),
        incrementOwnershipTimesBy: convertFunction(this.incrementOwnershipTimesBy)
      })
    );
  }

  toProto(): proto.badges.IncrementedBalances {
    return new proto.badges.IncrementedBalances(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IncrementedBalances<U> {
    return IncrementedBalances.fromProto(proto.badges.IncrementedBalances.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IncrementedBalances<U> {
    return IncrementedBalances.fromProto(proto.badges.IncrementedBalances.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.IncrementedBalances, convertFunction: (item: NumberType) => U): IncrementedBalances<U> {
    return new IncrementedBalances<U>({
      startBalances: item.startBalances.map((x) => Balance.fromProto(x, convertFunction)),
      incrementBadgeIdsBy: convertFunction(item.incrementBadgeIdsBy),
      incrementOwnershipTimesBy: convertFunction(item.incrementOwnershipTimesBy)
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

  toProto(): proto.badges.PredeterminedOrderCalculationMethod {
    return new proto.badges.PredeterminedOrderCalculationMethod(this.toJson());
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PredeterminedOrderCalculationMethod {
    return PredeterminedOrderCalculationMethod.fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PredeterminedOrderCalculationMethod {
    return PredeterminedOrderCalculationMethod.fromJsonString(jsonString, options);
  }

  static fromProto(item: proto.badges.PredeterminedOrderCalculationMethod): PredeterminedOrderCalculationMethod {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ApprovalAmounts<U> {
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

  toProto(): proto.badges.ApprovalAmounts {
    return new proto.badges.ApprovalAmounts(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalAmounts<U> {
    return ApprovalAmounts.fromProto(proto.badges.ApprovalAmounts.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalAmounts<U> {
    return ApprovalAmounts.fromProto(proto.badges.ApprovalAmounts.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.ApprovalAmounts, convertFunction: (item: NumberType) => U): ApprovalAmounts<U> {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): MaxNumTransfers<U> {
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

  toProto(): proto.badges.MaxNumTransfers {
    return new proto.badges.MaxNumTransfers(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MaxNumTransfers<U> {
    return MaxNumTransfers.fromProto(proto.badges.MaxNumTransfers.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MaxNumTransfers<U> {
    return MaxNumTransfers.fromProto(proto.badges.MaxNumTransfers.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.MaxNumTransfers, convertFunction: (item: NumberType) => U): MaxNumTransfers<U> {
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
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserIncomingApproval<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserIncomingApproval<U>;
  }

  toProto(): proto.badges.UserIncomingApproval {
    return new proto.badges.UserIncomingApproval(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserIncomingApproval<U> {
    return UserIncomingApproval.fromProto(proto.badges.UserIncomingApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserIncomingApproval<U> {
    return UserIncomingApproval.fromProto(proto.badges.UserIncomingApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.UserIncomingApproval, convertFunction: (item: NumberType) => U): UserIncomingApproval<U> {
    return new UserIncomingApproval<U>({
      fromListId: item.fromListId,
      initiatedByListId: item.initiatedByListId,
      transferTimes: item.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: item.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: item.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: item.approvalId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? IncomingApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined
    });
  }

  castToCollectionTransfer(toAddress: string): CollectionApproval<T> {
    return new CollectionApproval({
      ...this,
      toListId: toAddress,
      approvalCriteria: this.approvalCriteria?.castToCollectionApprovalCriteria()
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
  mustOwnBadges?: MustOwnBadges<T>[];
  merkleChallenges?: MerkleChallenge<T>[];
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;
  requireFromEqualsInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;
  zkProofs?: ZkProof[];
  coinTransfers?: CoinTransfer<T>[] | undefined;

  constructor(msg: iIncomingApprovalCriteria<T>) {
    super();
    this.mustOwnBadges = msg.mustOwnBadges?.map((x) => new MustOwnBadges(x));
    this.merkleChallenges = msg.merkleChallenges?.map((x) => new MerkleChallenge(x));
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireFromEqualsInitiatedBy = msg.requireFromEqualsInitiatedBy;
    this.requireFromDoesNotEqualInitiatedBy = msg.requireFromDoesNotEqualInitiatedBy;
    this.zkProofs = msg.zkProofs ? msg.zkProofs.map((x) => new ZkProof(x)) : undefined;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): IncomingApprovalCriteria<U> {
    return new IncomingApprovalCriteria(
      deepCopyPrimitives({
        mustOwnBadges: this.mustOwnBadges?.map((x) => x.convert(convertFunction)),
        merkleChallenge: this.merkleChallenges?.map((x) => x.convert(convertFunction)),
        predeterminedBalances: this.predeterminedBalances ? this.predeterminedBalances.convert(convertFunction) : undefined,
        approvalAmounts: this.approvalAmounts ? this.approvalAmounts.convert(convertFunction) : undefined,
        maxNumTransfers: this.maxNumTransfers ? this.maxNumTransfers.convert(convertFunction) : undefined,
        requireFromEqualsInitiatedBy: this.requireFromEqualsInitiatedBy,
        requireFromDoesNotEqualInitiatedBy: this.requireFromDoesNotEqualInitiatedBy,
        zkProofs: this.zkProofs?.map((x) => x),
        coinTransfers: this.coinTransfers?.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): proto.badges.IncomingApprovalCriteria {
    return new proto.badges.IncomingApprovalCriteria(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IncomingApprovalCriteria<U> {
    return IncomingApprovalCriteria.fromProto(proto.badges.IncomingApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): IncomingApprovalCriteria<U> {
    return IncomingApprovalCriteria.fromProto(proto.badges.IncomingApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: proto.badges.IncomingApprovalCriteria,
    convertFunction: (item: NumberType) => U
  ): IncomingApprovalCriteria<U> {
    return new IncomingApprovalCriteria<U>({
      mustOwnBadges: item.mustOwnBadges.map((x) => MustOwnBadges.fromProto(x, convertFunction)),
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      requireFromEqualsInitiatedBy: item.requireFromEqualsInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: item.requireFromDoesNotEqualInitiatedBy,
      zkProofs: item.zkProofs?.map((x) => ZkProof.fromProto(x)),
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
      mustOwnBadges: this.mustOwnBadges,
      zkProofs: this.zkProofs,
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CollectionApproval<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CollectionApproval<U>;
  }

  toProto(): proto.badges.CollectionApproval {
    return new proto.badges.CollectionApproval(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionApproval<U> {
    return CollectionApproval.fromProto(proto.badges.CollectionApproval.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionApproval<U> {
    return CollectionApproval.fromProto(proto.badges.CollectionApproval.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.CollectionApproval, convertFunction: (item: NumberType) => U): CollectionApproval<U> {
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
      approvalCriteria: item.approvalCriteria ? ApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined
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
      approvalCriteria: this.approvalCriteria
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
      approvalCriteria: this.approvalCriteria
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
  mustOwnBadges?: MustOwnBadges<T>[];
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
  zkProofs?: ZkProof[];
  coinTransfers?: iCoinTransfer<T>[] | undefined;

  constructor(msg: iApprovalCriteria<T>) {
    super();
    this.mustOwnBadges = msg.mustOwnBadges?.map((x) => new MustOwnBadges(x));
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
    this.zkProofs = msg.zkProofs ? msg.zkProofs.map((x) => new ZkProof(x)) : undefined;
    this.coinTransfers = msg.coinTransfers ? msg.coinTransfers.map((x) => new CoinTransfer(x)) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ApprovalCriteria<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ApprovalCriteria<U>;
  }

  toProto(): proto.badges.ApprovalCriteria {
    return new proto.badges.ApprovalCriteria(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalCriteria<U> {
    return ApprovalCriteria.fromProto(proto.badges.ApprovalCriteria.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ApprovalCriteria<U> {
    return ApprovalCriteria.fromProto(proto.badges.ApprovalCriteria.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: proto.badges.ApprovalCriteria, convertFunction: (item: NumberType) => U): ApprovalCriteria<U> {
    return new ApprovalCriteria<U>({
      mustOwnBadges: item.mustOwnBadges.map((x) => MustOwnBadges.fromProto(x, convertFunction)),
      merkleChallenges: item.merkleChallenges.map((x) => MerkleChallenge.fromProto(x, convertFunction)),
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      zkProofs: item.zkProofs.map((x) => ZkProof.fromProto(x)),
      coinTransfers: item.coinTransfers ? item.coinTransfers.map((x) => CoinTransfer.fromProto(x, convertFunction)) : undefined,
      requireToEqualsInitiatedBy: item.requireToEqualsInitiatedBy,
      requireFromEqualsInitiatedBy: item.requireFromEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: item.requireToDoesNotEqualInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: item.requireFromDoesNotEqualInitiatedBy,
      overridesFromOutgoingApprovals: item.overridesFromOutgoingApprovals,
      overridesToIncomingApprovals: item.overridesToIncomingApprovals
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserOutgoingApprovalWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserOutgoingApprovalWithDetails<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserIncomingApprovalWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserIncomingApprovalWithDetails<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ChallengeDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ChallengeDetails<U>;
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
export interface iApprovalInfoDetails {
  /** The name of the claim */
  name: string;

  /** The description of the claim. This describes how to earn and claim the badge. */
  description: string;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ChallengeInfoDetails<U> {
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

  constructor(data: iApprovalInfoDetails) {
    super();
    this.name = data.name;
    this.description = data.description;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ApprovalInfoDetails<U> {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): MerkleChallengeWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MerkleChallengeWithDetails<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ApprovalCriteriaWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ApprovalCriteriaWithDetails<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): IncomingApprovalCriteriaWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as IncomingApprovalCriteriaWithDetails<U>;
  }

  clone(): IncomingApprovalCriteriaWithDetails<T> {
    return super.clone() as IncomingApprovalCriteriaWithDetails<T>;
  }

  castToCollectionApprovalCriteria(): ApprovalCriteriaWithDetails<T> {
    return new ApprovalCriteriaWithDetails({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      predeterminedBalances: this.predeterminedBalances,
      mustOwnBadges: this.mustOwnBadges,
      zkProofs: this.zkProofs,
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): OutgoingApprovalCriteriaWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as OutgoingApprovalCriteriaWithDetails<U>;
  }

  clone(): OutgoingApprovalCriteriaWithDetails<T> {
    return super.clone() as OutgoingApprovalCriteriaWithDetails<T>;
  }

  castToCollectionApprovalCriteria(): ApprovalCriteriaWithDetails<T> {
    return new ApprovalCriteriaWithDetails({
      approvalAmounts: this.approvalAmounts,
      maxNumTransfers: this.maxNumTransfers,
      predeterminedBalances: this.predeterminedBalances,
      mustOwnBadges: this.mustOwnBadges,
      zkProofs: this.zkProofs,
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CollectionApprovalWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CollectionApprovalWithDetails<U>;
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
