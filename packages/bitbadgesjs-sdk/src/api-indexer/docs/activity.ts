import { BalanceArray } from '@/core/balances';
import type { NumberType } from '@/common/string-numbers';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import { ApprovalIdentifierDetails, ZkProofSolution } from '@/proto/badges/transfers_pb';
import type { iActivityDoc, iClaimAlertDoc, iListActivityDoc, iReviewDoc, iTransferActivityDoc } from './interfaces';
import { iZkProofSolution } from '@/interfaces';

/**
 * Base activity item interface. All activity items should extend this interface.
 *
 * @category Indexer
 */
export class ActivityDoc<T extends NumberType> extends BaseNumberTypeClass<ActivityDoc<T>> implements iActivityDoc<T> {
  timestamp: T;
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
 * Type for review activity items that extends the base ActivityDoc interface.
 *
 * @category Indexer
 */
export class ReviewDoc<T extends NumberType> extends ActivityDoc<T> implements iReviewDoc<T> {
  review: string;
  stars: T;
  from: string;
  collectionId?: T;
  reviewedAddress?: string;

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
 * Type for transfer activity items that extends the base ActivityDoc interface.
 *
 * @category Indexer
 */
export class TransferActivityDoc<T extends NumberType> extends ActivityDoc<T> implements iTransferActivityDoc<T> {
  to: string[];
  from: string;
  balances: BalanceArray<T>;
  collectionId: T;
  memo?: string;
  precalculateBalancesFromApproval?: ApprovalIdentifierDetails;
  prioritizedApprovals?: ApprovalIdentifierDetails[];
  onlyCheckPrioritizedApprovals?: boolean;
  zkProofSolutions?: ZkProofSolution[];
  initiatedBy: string;
  txHash?: string;

  constructor(data: iTransferActivityDoc<T>) {
    super(data);
    this.to = data.to;
    this.from = data.from;
    this.balances = BalanceArray.From(data.balances);
    this.collectionId = data.collectionId;
    this.memo = data.memo;
    this.zkProofSolutions = data.zkProofSolutions ? data.zkProofSolutions.map((x) => new ZkProofSolution(x)) : undefined;
    this.precalculateBalancesFromApproval = data.precalculateBalancesFromApproval
      ? new ApprovalIdentifierDetails(data.precalculateBalancesFromApproval)
      : undefined;
    this.prioritizedApprovals = data.prioritizedApprovals ? data.prioritizedApprovals.map((x) => new ApprovalIdentifierDetails(x)) : undefined;
    this.onlyCheckPrioritizedApprovals = data.onlyCheckPrioritizedApprovals;
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
 * Type for list activity items that extends the base ActivityDoc interface.
 *
 * @category Indexer
 */
export class ListActivityDoc<T extends NumberType> extends ActivityDoc<T> implements iListActivityDoc<T> {
  listId: string;
  addedToList?: boolean;
  addresses?: string[];
  txHash?: string;

  constructor(data: iListActivityDoc<T>) {
    super(data);
    this.listId = data.listId;
    this.addedToList = data.addedToList;
    this.addresses = data.addresses;
    this.txHash = data.txHash;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ListActivityDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ListActivityDoc<U>;
  }
}

/**
 * Type for claim alert activity items that extends the base ActivityDoc interface.
 *
 * @category Indexer
 */
export class ClaimAlertDoc<T extends NumberType> extends ActivityDoc<T> implements iClaimAlertDoc<T> {
  from: string;
  code?: string;
  cosmosAddresses: string[];
  collectionId: T;
  message?: string;

  constructor(data: iClaimAlertDoc<T>) {
    super(data);
    this.from = data.from;
    this.code = data.code;
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
