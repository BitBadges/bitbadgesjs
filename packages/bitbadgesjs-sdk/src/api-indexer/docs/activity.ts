import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import { BalanceArray } from '@/core/balances';
import { ApprovalIdentifierDetails } from '@/proto/badges/transfers_pb';
import type {
  CosmosAddress,
  UNIXMilliTimestamp,
  iActivityDoc,
  iClaimAlertDoc,
  iListActivityDoc,
  iReviewDoc,
  iTransferActivityDoc
} from './interfaces';

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
 * @inheritDoc iReviewDoc
 * @category Indexer
 */
export class ReviewDoc<T extends NumberType> extends ActivityDoc<T> implements iReviewDoc<T> {
  review: string;
  stars: T;
  from: CosmosAddress;
  collectionId?: T;
  reviewedAddress?: CosmosAddress;

  constructor(data: iReviewDoc<T>) {
    super(data);
    this.review = data.review;
    this.stars = data.stars;
    this.from = data.from;
    this.collectionId = data.collectionId;
    this.reviewedAddress = data.reviewedAddress;
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames(), 'stars', 'collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ReviewDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ReviewDoc<U>;
  }
}

/**
 * @inheritDoc iTransferActivityDoc
 * @category Indexer
 */
export class TransferActivityDoc<T extends NumberType> extends ActivityDoc<T> implements iTransferActivityDoc<T> {
  to: CosmosAddress[];
  from: CosmosAddress;
  balances: BalanceArray<T>;
  collectionId: T;
  memo?: string;
  precalculateBalancesFromApproval?: ApprovalIdentifierDetails;
  prioritizedApprovals?: ApprovalIdentifierDetails[];
  initiatedBy: CosmosAddress;
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
  initiatedBy: CosmosAddress;

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
  from: CosmosAddress;
  cosmosAddresses: CosmosAddress[];
  collectionId: T;
  message?: string;

  constructor(data: iClaimAlertDoc<T>) {
    super(data);
    this.from = data.from;
    this.cosmosAddresses = data.cosmosAddresses;
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
