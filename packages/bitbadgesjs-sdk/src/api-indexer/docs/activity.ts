import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { BalanceArray } from '@/core/balances.js';
import { ApprovalIdentifierDetails } from '@/proto/badges/transfers_pb.js';
import type {
  BitBadgesAddress,
  UNIXMilliTimestamp,
  iActivityDoc,
  iClaimAlertDoc,
  iListActivityDoc,
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ActivityDoc<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): TransferActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as TransferActivityDoc<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ListActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ListActivityDoc<U>;
  }
}

/**
 * @inheritDoc iClaimAlertDoc
 * @category Indexer
 */
export class ClaimAlertDoc<T extends NumberType> extends ActivityDoc<T> implements iClaimAlertDoc<T> {
  from: BitBadgesAddress;
  bitbadgesAddresses: BitBadgesAddress[];
  collectionId: T;
  message?: string;

  constructor(data: iClaimAlertDoc<T>) {
    super(data);
    this.from = data.from;
    this.bitbadgesAddresses = data.bitbadgesAddresses;
    this.collectionId = data.collectionId;
    this.message = data.message;
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames(), 'collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ClaimAlertDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ClaimAlertDoc<U>;
  }
}
