import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes, deepCopyPrimitives } from '@/common/base';
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
} from '@/interfaces/badges/approvals';
import type { iAddressList, iMerkleChallenge } from '@/interfaces/badges/core';
import * as proto from '@/proto';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type MerkleTree from 'merkletreejs';
import type { Options as MerkleTreeJsOptions } from 'merkletreejs/dist/MerkleTree';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers';
import { AddressList } from './addressLists';
import { Balance, BalanceArray } from './balances';
import { MerkleChallenge, MustOwnBadges } from './misc';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps';
import { GetListIdWithOptions, GetListWithOptions, GetUintRangesWithOptions, getOverlapsAndNonOverlaps } from './overlaps';
import type { CollectionApprovalPermissionWithDetails } from './permissions';
import { CollectionApprovalPermission } from './permissions';
import { UintRange, UintRangeArray } from './uintRanges';
import { AllDefaultValues, getPotentialUpdatesForTimelineValues, getUpdateCombinationsToCheck } from './validate-utils';
import { IntegrationPluginDetails, ClaimIntegrationPluginType } from '..';

const { getReservedAddressList, getReservedTrackerList } = AddressList;

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
  amountTrackerId: string;
  challengeTrackerId: string;
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
    this.amountTrackerId = msg.amountTrackerId;
    this.challengeTrackerId = msg.challengeTrackerId;
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
      amountTrackerId: item.amountTrackerId,
      challengeTrackerId: item.challengeTrackerId,
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
  merkleChallenge?: MerkleChallenge<T>;
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;
  requireToEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;

  constructor(msg: iOutgoingApprovalCriteria<T>) {
    super();
    this.mustOwnBadges = msg.mustOwnBadges?.map((x) => new MustOwnBadges(x));
    this.merkleChallenge = msg.merkleChallenge ? new MerkleChallenge(msg.merkleChallenge) : undefined;
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireToEqualsInitiatedBy = msg.requireToEqualsInitiatedBy;
    this.requireToDoesNotEqualInitiatedBy = msg.requireToDoesNotEqualInitiatedBy;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): OutgoingApprovalCriteria<U> {
    return new OutgoingApprovalCriteria(
      deepCopyPrimitives({
        mustOwnBadges: this.mustOwnBadges?.map((x) => x.convert(convertFunction)),
        merkleChallenge: this.merkleChallenge?.convert(convertFunction),
        predeterminedBalances: this.predeterminedBalances?.convert(convertFunction),
        approvalAmounts: this.approvalAmounts?.convert(convertFunction),
        maxNumTransfers: this.maxNumTransfers?.convert(convertFunction),
        requireToEqualsInitiatedBy: this.requireToEqualsInitiatedBy,
        requireToDoesNotEqualInitiatedBy: this.requireToDoesNotEqualInitiatedBy
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
      merkleChallenge: item.merkleChallenge ? MerkleChallenge.fromProto(item.merkleChallenge, convertFunction) : undefined,
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      requireToEqualsInitiatedBy: item.requireToEqualsInitiatedBy,
      requireToDoesNotEqualInitiatedBy: item.requireToDoesNotEqualInitiatedBy
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
      merkleChallenge: this.merkleChallenge,

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
            useMerkleChallengeLeafIndex: false
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

  constructor(msg: iPredeterminedOrderCalculationMethod) {
    super();
    this.useOverallNumTransfers = msg.useOverallNumTransfers;
    this.usePerToAddressNumTransfers = msg.usePerToAddressNumTransfers;
    this.usePerFromAddressNumTransfers = msg.usePerFromAddressNumTransfers;
    this.usePerInitiatedByAddressNumTransfers = msg.usePerInitiatedByAddressNumTransfers;
    this.useMerkleChallengeLeafIndex = msg.useMerkleChallengeLeafIndex;
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
      useMerkleChallengeLeafIndex: item.useMerkleChallengeLeafIndex
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

  constructor(msg: iApprovalAmounts<T>) {
    super();
    this.overallApprovalAmount = msg.overallApprovalAmount;
    this.perToAddressApprovalAmount = msg.perToAddressApprovalAmount;
    this.perFromAddressApprovalAmount = msg.perFromAddressApprovalAmount;
    this.perInitiatedByAddressApprovalAmount = msg.perInitiatedByAddressApprovalAmount;
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
        perInitiatedByAddressApprovalAmount: convertFunction(this.perInitiatedByAddressApprovalAmount)
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
      perInitiatedByAddressApprovalAmount: convertFunction(item.perInitiatedByAddressApprovalAmount)
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

  constructor(msg: iMaxNumTransfers<T>) {
    super();
    this.overallMaxNumTransfers = msg.overallMaxNumTransfers;
    this.perToAddressMaxNumTransfers = msg.perToAddressMaxNumTransfers;
    this.perFromAddressMaxNumTransfers = msg.perFromAddressMaxNumTransfers;
    this.perInitiatedByAddressMaxNumTransfers = msg.perInitiatedByAddressMaxNumTransfers;
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
        perInitiatedByAddressMaxNumTransfers: convertFunction(this.perInitiatedByAddressMaxNumTransfers)
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
      perInitiatedByAddressMaxNumTransfers: convertFunction(item.perInitiatedByAddressMaxNumTransfers)
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
  amountTrackerId: string;
  challengeTrackerId: string;
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
    this.amountTrackerId = msg.amountTrackerId;
    this.challengeTrackerId = msg.challengeTrackerId;
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
      amountTrackerId: item.amountTrackerId,
      challengeTrackerId: item.challengeTrackerId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? IncomingApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined
    });
  }

  /**
   * Convert this UserIncomingApproval to a UserIncomingApprovalWithDetails.
   */
  toWithDetails(fromList: iAddressList, initiatedByList: iAddressList): UserIncomingApprovalWithDetails<T> {
    return new UserIncomingApprovalWithDetails({
      ...this,
      fromList,
      initiatedByList
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
  merkleChallenge?: MerkleChallenge<T>;
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;
  requireFromEqualsInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;

  constructor(msg: iIncomingApprovalCriteria<T>) {
    super();
    this.mustOwnBadges = msg.mustOwnBadges?.map((x) => new MustOwnBadges(x));
    this.merkleChallenge = msg.merkleChallenge ? new MerkleChallenge(msg.merkleChallenge) : undefined;
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireFromEqualsInitiatedBy = msg.requireFromEqualsInitiatedBy;
    this.requireFromDoesNotEqualInitiatedBy = msg.requireFromDoesNotEqualInitiatedBy;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): IncomingApprovalCriteria<U> {
    return new IncomingApprovalCriteria(
      deepCopyPrimitives({
        mustOwnBadges: this.mustOwnBadges?.map((x) => x.convert(convertFunction)),
        merkleChallenge: this.merkleChallenge ? this.merkleChallenge.convert(convertFunction) : undefined,
        predeterminedBalances: this.predeterminedBalances ? this.predeterminedBalances.convert(convertFunction) : undefined,
        approvalAmounts: this.approvalAmounts ? this.approvalAmounts.convert(convertFunction) : undefined,
        maxNumTransfers: this.maxNumTransfers ? this.maxNumTransfers.convert(convertFunction) : undefined,
        requireFromEqualsInitiatedBy: this.requireFromEqualsInitiatedBy,
        requireFromDoesNotEqualInitiatedBy: this.requireFromDoesNotEqualInitiatedBy
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
      merkleChallenge: item.merkleChallenge ? MerkleChallenge.fromProto(item.merkleChallenge, convertFunction) : undefined,
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
      requireFromEqualsInitiatedBy: item.requireFromEqualsInitiatedBy,
      requireFromDoesNotEqualInitiatedBy: item.requireFromDoesNotEqualInitiatedBy
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
      merkleChallenge: this.merkleChallenge,

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
  amountTrackerId: string;
  challengeTrackerId: string;
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
    this.amountTrackerId = msg.amountTrackerId;
    this.challengeTrackerId = msg.challengeTrackerId;
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
      amountTrackerId: item.amountTrackerId,
      challengeTrackerId: item.challengeTrackerId,
      uri: item.uri,
      customData: item.customData,
      approvalCriteria: item.approvalCriteria ? ApprovalCriteria.fromProto(item.approvalCriteria, convertFunction) : undefined
    });
  }

  toWithDetails(toList: iAddressList, fromList: iAddressList, initiatedByList: iAddressList): CollectionApprovalWithDetails<T> {
    return new CollectionApprovalWithDetails({
      ...this,
      toList,
      fromList,
      initiatedByList
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
  merkleChallenge?: MerkleChallenge<T>;
  predeterminedBalances?: PredeterminedBalances<T>;
  approvalAmounts?: ApprovalAmounts<T>;
  maxNumTransfers?: MaxNumTransfers<T>;
  requireToEqualsInitiatedBy?: boolean;
  requireFromEqualsInitiatedBy?: boolean;
  requireToDoesNotEqualInitiatedBy?: boolean;
  requireFromDoesNotEqualInitiatedBy?: boolean;
  overridesFromOutgoingApprovals?: boolean;
  overridesToIncomingApprovals?: boolean;

  constructor(msg: iApprovalCriteria<T>) {
    super();
    this.mustOwnBadges = msg.mustOwnBadges?.map((x) => new MustOwnBadges(x));
    this.merkleChallenge = msg.merkleChallenge ? new MerkleChallenge(msg.merkleChallenge) : undefined;
    this.predeterminedBalances = msg.predeterminedBalances ? new PredeterminedBalances(msg.predeterminedBalances) : undefined;
    this.approvalAmounts = msg.approvalAmounts ? new ApprovalAmounts(msg.approvalAmounts) : undefined;
    this.maxNumTransfers = msg.maxNumTransfers ? new MaxNumTransfers(msg.maxNumTransfers) : undefined;
    this.requireToEqualsInitiatedBy = msg.requireToEqualsInitiatedBy;
    this.requireFromEqualsInitiatedBy = msg.requireFromEqualsInitiatedBy;
    this.requireToDoesNotEqualInitiatedBy = msg.requireToDoesNotEqualInitiatedBy;
    this.requireFromDoesNotEqualInitiatedBy = msg.requireFromDoesNotEqualInitiatedBy;
    this.overridesFromOutgoingApprovals = msg.overridesFromOutgoingApprovals;
    this.overridesToIncomingApprovals = msg.overridesToIncomingApprovals;
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
      merkleChallenge: item.merkleChallenge ? MerkleChallenge.fromProto(item.merkleChallenge, convertFunction) : undefined,
      predeterminedBalances: item.predeterminedBalances ? PredeterminedBalances.fromProto(item.predeterminedBalances, convertFunction) : undefined,
      approvalAmounts: item.approvalAmounts ? ApprovalAmounts.fromProto(item.approvalAmounts, convertFunction) : undefined,
      maxNumTransfers: item.maxNumTransfers ? MaxNumTransfers.fromProto(item.maxNumTransfers, convertFunction) : undefined,
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
  toList: iAddressList;
  initiatedByList: iAddressList;
}

/**
 * @category Approvals / Transferability
 */
export class UserOutgoingApprovalWithDetails<T extends NumberType> extends UserOutgoingApproval<T> implements iUserOutgoingApprovalWithDetails<T> {
  toList: AddressList;
  initiatedByList: AddressList;

  constructor(data: iUserOutgoingApprovalWithDetails<T>) {
    super(data);
    this.toList = new AddressList(data.toList);
    this.initiatedByList = new AddressList(data.initiatedByList);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserOutgoingApprovalWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserOutgoingApprovalWithDetails<U>;
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
  fromList: AddressList;
  initiatedByList: AddressList;

  constructor(data: iUserIncomingApprovalWithDetails<T>) {
    super(data);
    this.fromList = new AddressList(data.fromList);
    this.initiatedByList = new AddressList(data.initiatedByList);
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
 * LeavesDetails represents details about the leaves of a claims tree.
 * This is used as helpers for storing leaves and for UI purposes.
 *
 * This is used to check if an entered claim value is valid. If the leaves are hashed, then the value entered by the user will be hashed before being checked against the provided leaf values.
 * If the leaves are not hashed, then the value entered by the user will be checked directly against the provided leaf values.
 *
 * IMPORTANT: The leaf values here are to be publicly stored on IPFS, so they should not contain any sensitive information (i.e. codes, passwords, etc.)
 * Only use this with the non-hashed option when the values do not contain any sensitive information (i.e. a public whitelist of addresses).
 *
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
 *
 * @category Approvals / Transferability
 * @typedef {Object} LeavesDetails
 *
 * @property {string[]} leaves - The values of the leaves
 * @property {boolean} isHashed - True if the leaves are hashed
 * @property {string[]} preimages - The preimages of the leaves (only used if isHashed = true). Oftentimes, this is used for secret codes so shoul dnot be present when user-facing.
 */
export interface LeavesDetails {
  leaves: string[];
  isHashed: boolean;

  preimages?: string[];
  seedCode?: string;
}

/**
 * @category Interfaces
 */
export interface iChallengeDetails<T extends NumberType> {
  /** The leaves of the Merkle tree with accompanying details */
  leavesDetails: LeavesDetails;
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
  leavesDetails: LeavesDetails;
  tree?: MerkleTree;
  treeOptions?: MerkleTreeJsOptions;
  numLeaves?: T;
  currCode?: T;

  constructor(data: iChallengeDetails<T>) {
    super();
    this.leavesDetails = data.leavesDetails;
    this.tree = data.tree;
    this.treeOptions = data.treeOptions;
    this.numLeaves = data.numLeaves;
    this.currCode = data.currCode;
  }

  getNumberFieldNames(): string[] {
    return ['numLeaves', 'currCode'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ChallengeDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ChallengeDetails<U>;
  }
}

/**
 * @category Interfaces
 */
export interface iApprovalInfoDetails<T extends NumberType> {
  /** The name of the claim */
  name: string;

  /** The description of the claim. This describes how to earn and claim the badge. */
  description: string;

  /** The challenge details of the claim / approval */
  challengeDetails?: iChallengeDetails<T>;

  offChainClaims?: {
    /** The plugins of the claim / approval */
    plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
    claimId: string;
    manualDistribution?: boolean;
  }[];
}

/**
 * @category Approvals / Transferability
 */
export class ApprovalInfoDetails<T extends NumberType> extends BaseNumberTypeClass<ApprovalInfoDetails<T>> implements iApprovalInfoDetails<T> {
  name: string;
  description: string;
  challengeDetails?: ChallengeDetails<T>;
  offChainClaims?: {
    /** The plugins of the claim / approval */
    plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
    manualDistribution?: boolean;
    claimId: string;
  }[];

  constructor(data: iApprovalInfoDetails<T>) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.challengeDetails = data.challengeDetails ? new ChallengeDetails(data.challengeDetails) : undefined;
    this.offChainClaims = data.offChainClaims;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ApprovalInfoDetails<U> {
    return new ApprovalInfoDetails(
      deepCopyPrimitives({
        ...this,
        challengeDetails: this.challengeDetails ? this.challengeDetails.convert(convertFunction) : undefined
      })
    );
  }
}

/**
 * @category Interfaces
 */
export interface iCollectionApprovalWithDetails<T extends NumberType> extends iCollectionApproval<T> {
  details?: iApprovalInfoDetails<T>;
  toList: iAddressList;
  fromList: iAddressList;
  initiatedByList: iAddressList;
}

/**
 * @category Approvals / Transferability
 */
export class CollectionApprovalWithDetails<T extends NumberType> extends CollectionApproval<T> implements iCollectionApprovalWithDetails<T> {
  details?: ApprovalInfoDetails<T>;
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;

  constructor(data: iCollectionApprovalWithDetails<T>) {
    super(data);
    this.details = data.details ? new ApprovalInfoDetails(data.details) : undefined;
    this.toList = new AddressList(data.toList);
    this.fromList = new AddressList(data.fromList);
    this.initiatedByList = new AddressList(data.initiatedByList);
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
      amountTrackerIdList: getReservedTrackerList(this.amountTrackerId),
      challengeTrackerIdList: getReservedTrackerList(this.challengeTrackerId),
      usesAmountTrackerIdList: true,
      usesChallengeTrackerIdList: true,
      usesApprovalIdList: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesToList: true,
      usesFromList: true,
      usesInitiatedByList: true,
      usesOwnershipTimes: true,
      arbitraryValue: {
        approvalId: this.approvalId,
        amountTrackerId: this.amountTrackerId,
        challengeTrackerId: this.challengeTrackerId,
        approvalCriteria: this.approvalCriteria
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
  const handled: UniversalPermissionDetails[] = [];

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
                amountTrackerIdList: permission.amountTrackerIdList,
                challengeTrackerIdList: permission.challengeTrackerIdList,
                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,
                arbitraryValue: arbValue
              }
            ];

            const [overlaps, inBrokenDownButNotHandled, inHandledButNotBrokenDown] = getOverlapsAndNonOverlaps(brokenDown, handled);
            handled.length = 0;

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
                amountTrackerIdList: overlap.overlap.amountTrackerIdList,
                challengeTrackerIdList: overlap.overlap.challengeTrackerIdList,
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
      timelineTimes: UintRangeArray.From([x.timelineTime]),
      badgeIds: UintRangeArray.From([x.badgeId]),
      ownershipTimes: UintRangeArray.From([x.ownershipTime]),
      transferTimes: UintRangeArray.From([x.transferTime]),
      toList: x.toList,
      fromList: x.fromList,
      initiatedByList: x.initiatedByList,
      approvalIdList: x.approvalIdList,
      amountTrackerIdList: x.amountTrackerIdList,
      challengeTrackerIdList: x.challengeTrackerIdList
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
        approvalId: approval.approvalId,
        amountTrackerId: approval.amountTrackerId,
        challengeTrackerId: approval.challengeTrackerId
      })
    );
  }

  return newCurrApprovals;
}
