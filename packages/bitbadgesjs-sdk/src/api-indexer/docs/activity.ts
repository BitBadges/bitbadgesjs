import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { BalanceArray } from '@/core/balances.js';
import { ApprovalIdentifierDetails } from '@/proto/badges/transfers_pb.js';
import type {
  BitBadgesAddress,
  UNIXMilliTimestamp,
  iActivityDoc,
  iClaimActivityDoc,
  iClaimAlertDoc,
  iListActivityDoc,
  iPointsActivityDoc,
  iTransferActivityDoc
} from './interfaces.js';

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
 * @inheritDoc iTransferActivityDoc
 * @category Indexer
 */
export class TransferActivityDoc<T extends NumberType> extends ActivityDoc<T> implements iTransferActivityDoc<T> {
  to: BitBadgesAddress[];
  from: BitBadgesAddress;
  balances: BalanceArray<T>;
  collectionId: T;
  memo?: string;
  precalculateBalancesFromApproval?: ApprovalIdentifierDetails;
  prioritizedApprovals?: ApprovalIdentifierDetails[];
  initiatedBy: BitBadgesAddress;
  txHash?: string;

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
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames(), 'collectionId'];
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
  collectionId: T;
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
    return [...super.getNumberFieldNames(), 'collectionId'];
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
