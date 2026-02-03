import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { BalanceArray } from '@/core/balances.js';
import { ApprovalIdentifierDetails, PrecalculateBalancesFromApprovalDetails, PrecalculationOptions } from '@/core/misc.js';
import { CollectionId } from '@/interfaces/types/core.js';
import type { BitBadgesAddress, iActivityDoc, iClaimActivityDoc, iCoinTransferItem, iPointsActivityDoc, iTransferActivityDoc, UNIXMilliTimestamp } from './interfaces.js';

/**
 * @inheritDoc iActivityDoc
 * @category Indexer
 */
export class ActivityDoc extends BaseNumberTypeClass<ActivityDoc> implements iActivityDoc {
  timestamp: UNIXMilliTimestamp;
  block: string | number;
  _notificationsHandled?: boolean;
  _docId: string;
  _id?: string;

  constructor(data: iActivityDoc) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ActivityDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ActivityDoc;
  }
}

/**
 * @category Indexer
 */
export class CoinTransferItem extends BaseNumberTypeClass<CoinTransferItem> implements iCoinTransferItem {
  amount: string | number;
  denom: string;
  from: BitBadgesAddress;
  to: BitBadgesAddress;
  isProtocolFee: boolean;

  constructor(data: iCoinTransferItem) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CoinTransferItem {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CoinTransferItem;
  }
}

/**
 * @inheritDoc iTransferActivityDoc
 * @category Indexer
 */
export class TransferActivityDoc extends ActivityDoc implements iTransferActivityDoc {
  to: BitBadgesAddress[];
  from: BitBadgesAddress;
  balances: BalanceArray;
  collectionId: CollectionId;
  initiatedBy: BitBadgesAddress;
  txHash?: string;

  memo?: string;
  precalculateBalancesFromApproval?: PrecalculateBalancesFromApprovalDetails;
  prioritizedApprovals?: ApprovalIdentifierDetails[];

  private?: boolean | undefined;
  precalculationOptions?: PrecalculationOptions;
  coinTransfers?: CoinTransferItem[];
  approvalsUsed?: ApprovalIdentifierDetails[];
  tokenId?: string | number;
  price?: string | number;
  volume?: string | number;
  denom?: string;

  constructor(data: iTransferActivityDoc) {
    super(data);
    this.to = data.to;
    this.from = data.from;
    this.balances = BalanceArray.From(data.balances);
    this.collectionId = data.collectionId;
    this.memo = data.memo;
    this.precalculateBalancesFromApproval = data.precalculateBalancesFromApproval ? new PrecalculateBalancesFromApprovalDetails(data.precalculateBalancesFromApproval) : undefined;
    this.prioritizedApprovals = data.prioritizedApprovals ? data.prioritizedApprovals.map((x) => new ApprovalIdentifierDetails(x)) : undefined;
    this.initiatedBy = data.initiatedBy;
    this.txHash = data.txHash;
    this.private = data.private;
    this.precalculationOptions = data.precalculationOptions ? new PrecalculationOptions(data.precalculationOptions) : undefined;
    this.coinTransfers = data.coinTransfers ? data.coinTransfers.map((x) => new CoinTransferItem(x)) : undefined;
    this.approvalsUsed = data.approvalsUsed ? data.approvalsUsed.map((x) => new ApprovalIdentifierDetails(x)) : undefined;
    this.tokenId = data.tokenId;
    this.price = data.price;
    this.volume = data.volume;
    this.denom = data.denom;
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames(), 'tokenId', 'price', 'volume'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): TransferActivityDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as TransferActivityDoc;
  }
}

/**
 * @inheritDoc iClaimActivityDoc
 * @category Indexer
 */
export class ClaimActivityDoc extends ActivityDoc implements iClaimActivityDoc {
  success: boolean;
  claimId: string;
  bitbadgesAddress: BitBadgesAddress;
  claimAttemptId: string;
  private?: boolean;
  claimType?: 'standalone' | 'collection' | 'list';

  constructor(data: iClaimActivityDoc) {
    super(data);
    this.success = data.success;
    this.claimId = data.claimId;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.claimAttemptId = data.claimAttemptId;
    this.private = data.private;
    this.claimType = data.claimType;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ClaimActivityDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimActivityDoc;
  }
}

/**
 * @inheritDoc iPointsActivityDoc
 * @category Indexer
 */
export class PointsActivityDoc extends ActivityDoc implements iPointsActivityDoc {
  bitbadgesAddress: BitBadgesAddress;
  oldPoints: string | number;
  newPoints: string | number;
  applicationId: string;
  pageId: string;

  constructor(data: iPointsActivityDoc) {
    super(data);
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.oldPoints = data.oldPoints;
    this.newPoints = data.newPoints;
    this.applicationId = data.applicationId;
    this.pageId = data.pageId;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PointsActivityDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PointsActivityDoc;
  }
}
