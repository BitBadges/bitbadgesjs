import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { BalanceArray } from '@/core/balances.js';
import { ApprovalIdentifierDetails } from '@/core/misc.js';
import { UintRangeArray } from '@/core/uintRanges.js';
import { CollectionId } from '@/interfaces/badges/core.js';
import { badges } from '@/proto/index.js';
import type {
  BitBadgesAddress,
  iActivityDoc,
  iClaimActivityDoc,
  iClaimAlertDoc,
  iCoinTransferItem,
  iListActivityDoc,
  iPointsActivityDoc,
  iPrecalculationOptions,
  iTransferActivityDoc,
  UNIXMilliTimestamp
} from './interfaces.js';
import { CollectionApprovalWithDetails, iCollectionApprovalWithDetails } from '@/core/approvals.js';

/**
 * @inheritDoc iActivityDoc
 * @category Indexer
 */
export class ActivityDoc<T extends NumberType> extends BaseNumberTypeClass<ActivityDoc<T>> implements iActivityDoc<T> {
  timestamp: UNIXMilliTimestamp<T>;
  block: T;
  _notificationsHandled?: boolean;
  _docId: string;
  _id?: string;

  constructor(data: iActivityDoc<T>) {
    super();
    this.timestamp = data.timestamp;
    this.block = data.block;
    this._notificationsHandled = data._notificationsHandled;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return ['timestamp', 'block'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ActivityDoc<U>;
  }
}

/**
 * @category Indexer
 */
export class CoinTransferItem<T extends NumberType> extends BaseNumberTypeClass<CoinTransferItem<T>> implements iCoinTransferItem<T> {
  amount: T;
  denom: string;
  from: BitBadgesAddress;
  to: BitBadgesAddress;
  isProtocolFee: boolean;

  constructor(data: iCoinTransferItem<T>) {
    super();
    this.amount = data.amount;
    this.denom = data.denom;
    this.from = data.from;
    this.to = data.to;
    this.isProtocolFee = data.isProtocolFee;
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CoinTransferItem<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CoinTransferItem<U>;
  }
}

/**
 * @inheritDoc iPrecalculationOptions
 * @category Indexer
 */
export class PrecalculationOptions<T extends NumberType> extends BaseNumberTypeClass<PrecalculationOptions<T>> implements iPrecalculationOptions<T> {
  overrideTimestamp?: T;
  badgeIdsOverride?: UintRangeArray<T>;

  constructor(data: iPrecalculationOptions<T>) {
    super();
    this.overrideTimestamp = data.overrideTimestamp;
    this.badgeIdsOverride = data.badgeIdsOverride ? UintRangeArray.From(data.badgeIdsOverride) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['overrideTimestamp'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PrecalculationOptions<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PrecalculationOptions<U>;
  }

  static fromProto<U extends NumberType>(proto: badges.PrecalculationOptions, convertFunction: (item: NumberType) => U): PrecalculationOptions<U> {
    return new PrecalculationOptions({
      overrideTimestamp: convertFunction(proto.overrideTimestamp),
      badgeIdsOverride: proto.badgeIdsOverride ? UintRangeArray.From(proto.badgeIdsOverride).convert(convertFunction) : undefined
    });
  }
}

/**
 * @inheritDoc iTransferActivityDoc
 * @category Indexer
 */
export class TransferActivityDoc<T extends NumberType> extends ActivityDoc<T> implements iTransferActivityDoc<T> {
  to: BitBadgesAddress[];
  from: BitBadgesAddress;
  balances: BalanceArray<T>;
  collectionId: CollectionId;
  initiatedBy: BitBadgesAddress;
  txHash?: string;

  memo?: string;
  precalculateBalancesFromApproval?: ApprovalIdentifierDetails<T>;
  prioritizedApprovals?: ApprovalIdentifierDetails<T>[];

  private?: boolean | undefined;
  precalculationOptions?: PrecalculationOptions<T>;
  coinTransfers?: CoinTransferItem<T>[];
  approvalsUsed?: ApprovalIdentifierDetails<T>[];
  badgeId?: T;
  price?: T;
  volume?: T;
  denom?: string;

  constructor(data: iTransferActivityDoc<T>) {
    super(data);
    this.to = data.to;
    this.from = data.from;
    this.balances = BalanceArray.From(data.balances);
    this.collectionId = data.collectionId;
    this.memo = data.memo;
    this.precalculateBalancesFromApproval = data.precalculateBalancesFromApproval
      ? new ApprovalIdentifierDetails(data.precalculateBalancesFromApproval)
      : undefined;
    this.prioritizedApprovals = data.prioritizedApprovals ? data.prioritizedApprovals.map((x) => new ApprovalIdentifierDetails(x)) : undefined;
    this.initiatedBy = data.initiatedBy;
    this.txHash = data.txHash;
    this.private = data.private;
    this.precalculationOptions = data.precalculationOptions ? new PrecalculationOptions(data.precalculationOptions) : undefined;
    this.coinTransfers = data.coinTransfers ? data.coinTransfers.map((x) => new CoinTransferItem(x)) : undefined;
    this.approvalsUsed = data.approvalsUsed ? data.approvalsUsed.map((x) => new ApprovalIdentifierDetails(x)) : undefined;
    this.badgeId = data.badgeId;
    this.price = data.price;
    this.volume = data.volume;
    this.denom = data.denom;
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames(), 'badgeId', 'price', 'volume'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): TransferActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as TransferActivityDoc<U>;
  }
}

/**
 * @inheritDoc iListActivityDoc
 * @category Indexer
 */
export class ListActivityDoc<T extends NumberType> extends ActivityDoc<T> implements iListActivityDoc<T> {
  listId: string;
  addedToList?: boolean;
  addresses?: string[];
  txHash?: string;
  initiatedBy: BitBadgesAddress;

  constructor(data: iListActivityDoc<T>) {
    super(data);
    this.listId = data.listId;
    this.addedToList = data.addedToList;
    this.addresses = data.addresses;
    this.txHash = data.txHash;
    this.initiatedBy = data.initiatedBy;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ListActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ListActivityDoc<U>;
  }
}

/**
 * @inheritDoc iClaimAlertDoc
 * @category Indexer
 */
export class ClaimAlertDoc<T extends NumberType> extends ActivityDoc<T> implements iClaimAlertDoc<T> {
  collectionId: CollectionId;
  from: BitBadgesAddress;
  bitbadgesAddresses: BitBadgesAddress[];
  message?: string;

  constructor(data: iClaimAlertDoc<T>) {
    super(data);
    this.collectionId = data.collectionId;
    this.from = data.from;
    this.bitbadgesAddresses = data.bitbadgesAddresses;
    this.message = data.message;
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames()];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ClaimAlertDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimAlertDoc<U>;
  }
}

/**
 * @inheritDoc iClaimActivityDoc
 * @category Indexer
 */
export class ClaimActivityDoc<T extends NumberType> extends ActivityDoc<T> implements iClaimActivityDoc<T> {
  success: boolean;
  claimId: string;
  bitbadgesAddress: BitBadgesAddress;
  claimAttemptId: string;
  private?: boolean;
  claimType?: 'standalone' | 'collection' | 'list';

  constructor(data: iClaimActivityDoc<T>) {
    super(data);
    this.success = data.success;
    this.claimId = data.claimId;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.claimAttemptId = data.claimAttemptId;
    this.private = data.private;
    this.claimType = data.claimType;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ClaimActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimActivityDoc<U>;
  }
}

/**
 * @inheritDoc iPointsActivityDoc
 * @category Indexer
 */
export class PointsActivityDoc<T extends NumberType> extends ActivityDoc<T> implements iPointsActivityDoc<T> {
  bitbadgesAddress: BitBadgesAddress;
  oldPoints: T;
  newPoints: T;
  applicationId: string;
  pageId: string;

  constructor(data: iPointsActivityDoc<T>) {
    super(data);
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.oldPoints = data.oldPoints;
    this.newPoints = data.newPoints;
    this.applicationId = data.applicationId;
    this.pageId = data.pageId;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PointsActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PointsActivityDoc<U>;
  }
}
