import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { SupportedChain } from '@/common/types.js';
import { AddressList } from '@/core/addressLists.js';
import { ApprovalInfoDetails, ChallengeDetails, ChallengeTrackerIdDetails, ClaimCachePolicy, CollectionApproval, SatisfyMethod, UserIncomingApproval, UserIncomingApprovalWithDetails, UserOutgoingApproval, UserOutgoingApprovalWithDetails, iApprovalInfoDetails, iChallengeDetails } from '@/core/approvals.js';
import { BalanceArray } from '@/core/balances.js';
import { BatchTokenDetailsArray } from '@/core/batch-utils.js';
import { CosmosCoin } from '@/core/coin.js';
import { AliasPath, CollectionInvariants, CollectionMetadata, CosmosCoinWrapperPath, TokenMetadata, UpdateHistory } from '@/core/misc.js';
import { CollectionPermissions, UserPermissions, UserPermissionsWithDetails } from '@/core/permissions.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import { UserBalanceStore } from '@/core/userBalances.js';
import type { CollectionId, iAmountTrackerIdDetails } from '@/interfaces/types/core.js';
import type { iUserBalanceStore } from '@/interfaces/types/userBalances.js';
import { Map, ValueStore } from '@/transactions/messages/bitbadges/maps/index.js';
import type { Doc } from '../base.js';
import type { iMetadata } from '../metadata/metadata.js';
import { Metadata } from '../metadata/metadata.js';
import { ClaimReward, any, DynamicDataHandlerType, iApiKeyDoc, iApplicationDoc, iApplicationPage, iApprovalItemDoc, iBaseStats, iCollectionStatsDoc, iCreatorCreditsDoc, iDynamicDataDoc, iEstimatedCost, iFloorPriceHistory, iInheritMetadataFrom, iLinkedTo, iListingViewsDoc, iPointsDoc, iTierWithOptionalWeight, iTokenFloorPriceDoc, iUtilityPageContent, iUtilityPageDoc, iUtilityPageLink, type ClaimIntegrationPluginType, type IntegrationPluginParams, type JsonBodyInputSchema, type JsonBodyInputWithValue, type NativeAddress, type OAuthScopeDetails, type PluginPresetType, type UNIXMilliTimestamp, type iAccessTokenDoc, type iAccountDoc, type iAddressListDoc, type iAirdropDoc, type iApprovalTrackerDoc, type iBalanceDoc, type iBalanceDocWithDetails, type iClaimBuilderDoc, type iCollectionDoc, type iComplianceDoc, type iCustomPage, type iDepositBalanceDoc, type iDeveloperAppDoc, type iDynamicStoreDoc, type iDynamicStoreDocWithDetails, type iDynamicStoreValueDoc, type iEmailVerificationStatus, type iFetchDoc, type iIPFSTotalsDoc, type iLatestBlockStatus, type iMapDoc, type iMapWithValues, type iMerkleChallengeTrackerDoc, type iNotificationPreferences, type iPluginDoc, type iPluginVersionConfig, type iProfileDoc, type iQueueDoc, type iRefreshDoc, type iSIWBBRequestDoc, type iSocialConnections, type iStatusDoc, type iTransactionEntry, type iUpdateHistory, type iUsedLeafStatus } from './interfaces.js';

/**
 * @inheritDoc iBaseStats
 * @category Collections
 */
export class BaseStatsDoc extends BaseNumberTypeClass<BaseStatsDoc> implements iBaseStats {
  _docId: string;
  _id?: string;
  /** The overall volume of the collection */
  overallVolume: CosmosCoin[];
  /** The daily volume of the collection */
  dailyVolume: CosmosCoin[];
  /** The weekly volume of the collection */
  weeklyVolume: CosmosCoin[];
  /** The monthly volume of the collection */
  monthlyVolume: CosmosCoin[];
  /** The yearly volume of the collection */
  yearlyVolume: CosmosCoin[];
  /** Last set timestamp */
  lastUpdatedAt: UNIXMilliTimestamp;

  constructor(data: iBaseStats) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.overallVolume = data.overallVolume.map((coin) => new CosmosCoin(coin));
    this.dailyVolume = data.dailyVolume.map((coin) => new CosmosCoin(coin));
    this.weeklyVolume = data.weeklyVolume.map((coin) => new CosmosCoin(coin));
    this.monthlyVolume = data.monthlyVolume.map((coin) => new CosmosCoin(coin));
    this.yearlyVolume = data.yearlyVolume.map((coin) => new CosmosCoin(coin));
    this.lastUpdatedAt = data.lastUpdatedAt;
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdatedAt'];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): BaseStatsDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as BaseStatsDoc;
  }
}

/**
 * @inheritDoc iCollectionStatsDoc
 * @category Collections
 */
export class CollectionStatsDoc extends BaseStatsDoc implements iCollectionStatsDoc {
  collectionId: CollectionId;
  floorPrices?: CosmosCoin[];
  uniqueOwners: BalanceArray;
  floorPriceHistory?: FloorPriceHistory[];
  payoutRewards?: CosmosCoin[];

  constructor(data: iCollectionStatsDoc) {
    super(data);
    this.collectionId = data.collectionId;
    this.floorPrices = data.floorPrices?.map((floorPrice) => new CosmosCoin(floorPrice)) ?? [];
    this.uniqueOwners = BalanceArray.From(data.uniqueOwners);
    this.floorPriceHistory = data.floorPriceHistory ? data.floorPriceHistory.map((floorPriceHistory) => new FloorPriceHistory(floorPriceHistory)) : undefined;
    this.payoutRewards = data.payoutRewards?.map((payoutReward) => new CosmosCoin(payoutReward)) ?? [];
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): CollectionStatsDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionStatsDoc;
  }
}

/**
 * @inheritDoc iFloorPriceHistory
 * @category Collections
 */
export class FloorPriceHistory extends BaseNumberTypeClass<FloorPriceHistory> implements iFloorPriceHistory {
  updatedAt: UNIXMilliTimestamp;
  floorPrice?: CosmosCoin;

  constructor(data: iFloorPriceHistory) {
    super();
    this.updatedAt = data.updatedAt;
    this.floorPrice = data.floorPrice ? new CosmosCoin(data.floorPrice) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['updatedAt'];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): FloorPriceHistory {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as FloorPriceHistory;
  }
}

/**
 * @inheritDoc iApprovalItemDoc
 * @category Approvals
 */
export class TokenFloorPriceDoc extends BaseNumberTypeClass<TokenFloorPriceDoc> implements iTokenFloorPriceDoc {
  collectionId: CollectionId;
  tokenId: string | number;
  _docId: string;
  _id?: string | undefined;
  floorPrices?: CosmosCoin[];
  floorPriceHistory?: iFloorPriceHistory[] | undefined;

  constructor(data: iTokenFloorPriceDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.tokenId = data.tokenId;
    this.floorPrices = data.floorPrices?.map((floorPrice) => new CosmosCoin(floorPrice)) ?? [];
    this.floorPriceHistory = data.floorPriceHistory ? data.floorPriceHistory.map((floorPriceHistory) => new FloorPriceHistory(floorPriceHistory)) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['tokenId'];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): TokenFloorPriceDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as TokenFloorPriceDoc;
  }
}

/**
 * @inheritDoc iApprovalItemDoc
 * @category Approvals
 */
export class ApprovalItemDoc extends BaseNumberTypeClass<ApprovalItemDoc> implements iApprovalItemDoc {
  _docId: string;
  _id?: string;
  collectionId: CollectionId;
  approvalId: string;
  approvalLevel: 'incoming' | 'outgoing';
  approverAddress: BitBadgesAddress;
  approvalType: string;
  price?: string | number;
  tokenId?: string | number;
  used?: boolean;
  sufficientBalances?: boolean;
  deletedAt?: UNIXMilliTimestamp;
  approval: CollectionApproval;
  isActive?: boolean | undefined;
  nextCheckTime?: UNIXMilliTimestamp;
  numTransfersLeft?: string | number;
  denom?: string;

  constructor(data: iApprovalItemDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.approvalId = data.approvalId;
    this.approvalLevel = data.approvalLevel;
    this.approverAddress = data.approverAddress;
    this.approvalType = data.approvalType;
    this.price = data.price;
    this.tokenId = data.tokenId;
    this.deletedAt = data.deletedAt;
    this.approval = new CollectionApproval(data.approval);
    this.used = data.used;
    this.isActive = data.isActive;
    this.sufficientBalances = data.sufficientBalances;
    this.nextCheckTime = data.nextCheckTime;
    this.numTransfersLeft = data.numTransfersLeft;
    this.denom = data.denom;
  }

  getNumberFieldNames(): string[] {
    return ['price', 'tokenId', 'deletedAt', 'numTransfersLeft'];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): ApprovalItemDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApprovalItemDoc;
  }
}

/**
 * @inheritDoc iCollectionDoc
 * @category Collections
 */
export class CollectionDoc extends BaseNumberTypeClass<CollectionDoc> implements iCollectionDoc, CustomType<CollectionDoc> {
  _docId: string;
  _id?: string;
  collectionId: CollectionId;
  collectionMetadata: CollectionMetadata;
  tokenMetadata: TokenMetadata[];
  customData: string;
  manager: BitBadgesAddress;
  collectionPermissions: CollectionPermissions;
  collectionApprovals: CollectionApproval[];
  standards: string[];
  isArchived: boolean;
  defaultBalances: UserBalanceStore;
  createdBy: BitBadgesAddress;
  createdBlock: string | number;
  createdTimestamp: UNIXMilliTimestamp;
  updateHistory: UpdateHistory[];
  validTokenIds: UintRangeArray;
  mintEscrowAddress: string;
  cosmosCoinWrapperPaths: CosmosCoinWrapperPath[];
  aliasPaths: AliasPath[];
  invariants: CollectionInvariants;

  constructor(data: iCollectionDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.collectionMetadata = new CollectionMetadata(data.collectionMetadata);
    this.tokenMetadata = data.tokenMetadata.map((tokenMetadata) => new TokenMetadata(tokenMetadata));
    this.customData = data.customData;
    this.manager = data.manager;
    this.collectionPermissions = new CollectionPermissions(data.collectionPermissions);
    this.collectionApprovals = data.collectionApprovals.map((collectionApproval) => new CollectionApproval(collectionApproval));
    this.standards = data.standards;
    this.isArchived = data.isArchived;
    this.defaultBalances = new UserBalanceStore(data.defaultBalances);
    this.createdBy = data.createdBy;
    this.createdBlock = data.createdBlock;
    this.createdTimestamp = data.createdTimestamp;
    this.updateHistory = data.updateHistory.map((updateHistory) => new UpdateHistory(updateHistory));

    this.mintEscrowAddress = data.mintEscrowAddress;
    this.validTokenIds = UintRangeArray.From(data.validTokenIds);
    this.cosmosCoinWrapperPaths = data.cosmosCoinWrapperPaths.map((cosmosCoinWrapperPaths) => new CosmosCoinWrapperPath(cosmosCoinWrapperPaths));
    this.aliasPaths = data.aliasPaths.map((aliasPath) => new AliasPath(aliasPath));
    this.invariants = new CollectionInvariants(data.invariants);
  }

  /**
   * Creates a blank balance object with the genesis default approvals and balances.
   */
  getDefaultUserBalance() {
    return this.defaultBalances.clone();
  }

  getNumberFieldNames(): string[] {
    return ['createdBlock', 'createdTimestamp'];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): CollectionDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionDoc;
  }

  clone(): CollectionDoc {
    return super.clone() as CollectionDoc;
  }
}

/**
 * @inheritDoc iAccountDoc
 * @category Accounts
 */
export class AccountDoc extends BaseNumberTypeClass<AccountDoc> implements iAccountDoc {
  _docId: string;
  _id?: string;
  publicKey: string;
  accountNumber: string | number;
  pubKeyType: string;
  bitbadgesAddress: BitBadgesAddress;
  sequence?: string | number;
  balances?: CosmosCoin[];

  constructor(data: iAccountDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.publicKey = data.publicKey;
    this.accountNumber = data.accountNumber;
    this.pubKeyType = data.pubKeyType;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.sequence = data.sequence;
    this.balances = data.balances?.map((balance) => new CosmosCoin(balance)) ?? [];
  }

  getNumberFieldNames(): string[] {
    return ['accountNumber', 'sequence'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AccountDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AccountDoc;
  }
}

/**
 * @category Accounts
 */
export class SocialConnectionInfo extends BaseNumberTypeClass<SocialConnectionInfo> {
  username: string;
  id: string;
  lastUpdated: UNIXMilliTimestamp;
  discriminator?: string;

  constructor(data: { username: string; id: string; lastUpdated: UNIXMilliTimestamp; discriminator?: string }) {
    super();
    this.username = data.username;
    this.id = data.id;
    this.lastUpdated = data.lastUpdated;
    this.discriminator = data.discriminator;
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdated'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): SocialConnectionInfo {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SocialConnectionInfo;
  }
}

/**
 * @inheritDoc iSocialConnections
 * @category Accounts
 */
export class SocialConnections extends BaseNumberTypeClass<SocialConnections> implements iSocialConnections {
  discord?: SocialConnectionInfo | undefined;
  twitter?: SocialConnectionInfo | undefined;
  github?: SocialConnectionInfo | undefined;
  google?: SocialConnectionInfo | undefined;
  twitch?: SocialConnectionInfo | undefined;
  strava?: SocialConnectionInfo | undefined;
  reddit?: SocialConnectionInfo | undefined;
  meetup?: SocialConnectionInfo | undefined;
  bluesky?: SocialConnectionInfo | undefined;
  mailchimp?: SocialConnectionInfo | undefined;
  facebook?: SocialConnectionInfo | undefined;
  googleCalendar?: SocialConnectionInfo | undefined;
  youtube?: SocialConnectionInfo | undefined;
  linkedIn?: SocialConnectionInfo | undefined;
  shopify?: SocialConnectionInfo | undefined;
  telegram?: SocialConnectionInfo | undefined;
  farcaster?: SocialConnectionInfo | undefined;
  slack?: SocialConnectionInfo | undefined;

  constructor(data: iSocialConnections) {
    super();
    this.discord = data.discord ? new SocialConnectionInfo(data.discord) : undefined;
    this.twitter = data.twitter ? new SocialConnectionInfo(data.twitter) : undefined;
    this.github = data.github ? new SocialConnectionInfo(data.github) : undefined;
    this.twitch = data.twitch ? new SocialConnectionInfo(data.twitch) : undefined;
    this.google = data.google ? new SocialConnectionInfo(data.google) : undefined;
    this.strava = data.strava ? new SocialConnectionInfo(data.strava) : undefined;
    this.reddit = data.reddit ? new SocialConnectionInfo(data.reddit) : undefined;
    this.bluesky = data.bluesky ? new SocialConnectionInfo(data.bluesky) : undefined;
    this.mailchimp = data.mailchimp ? new SocialConnectionInfo(data.mailchimp) : undefined;
    this.facebook = data.facebook ? new SocialConnectionInfo(data.facebook) : undefined;
    this.telegram = data.telegram ? new SocialConnectionInfo(data.telegram) : undefined;
    this.youtube = data.youtube ? new SocialConnectionInfo(data.youtube) : undefined;
    this.meetup = data.meetup ? new SocialConnectionInfo(data.meetup) : undefined;
    this.farcaster = data.farcaster ? new SocialConnectionInfo(data.farcaster) : undefined;
    this.slack = data.slack ? new SocialConnectionInfo(data.slack) : undefined;
    this.googleCalendar = data.googleCalendar ? new SocialConnectionInfo(data.googleCalendar) : undefined;
    this.linkedIn = data.linkedIn ? new SocialConnectionInfo(data.linkedIn) : undefined;
    this.shopify = data.shopify ? new SocialConnectionInfo(data.shopify) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): SocialConnections {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SocialConnections;
  }
}

/**
 * @inheritDoc iNotificationPreferences
 * @category Accounts
 */
export class NotificationPreferences extends BaseNumberTypeClass<NotificationPreferences> implements iNotificationPreferences {
  email?: string;
  discord?: { id: string; username: string; discriminator: string | undefined; token: string } | undefined;
  emailVerification?: EmailVerificationStatus;
  preferences?: {
    transferActivity?: boolean;
    claimActivity?: boolean;
    ignoreIfInitiator?: boolean;
    signInAlertsEnabled?: boolean;
  };

  constructor(data: iNotificationPreferences) {
    super();
    this.email = data.email;
    this.emailVerification = data.emailVerification ? new EmailVerificationStatus(data.emailVerification) : undefined;
    this.preferences = data.preferences;
    this.discord = data.discord;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): NotificationPreferences {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as NotificationPreferences;
  }
}

/**
 * @inheritDoc iEmailVerificationStatus
 * @category Accounts
 */
export class EmailVerificationStatus extends BaseNumberTypeClass<EmailVerificationStatus> implements iEmailVerificationStatus {
  verified?: boolean;
  verifiedAt?: UNIXMilliTimestamp | undefined;
  token?: string;
  expiry?: UNIXMilliTimestamp;
  antiPhishingCode?: string;

  constructor(data: iEmailVerificationStatus) {
    super();
    this.verified = data.verified;
    this.token = data.token;
    this.expiry = data.expiry;
    this.antiPhishingCode = data.antiPhishingCode;
    this.verifiedAt = data.verifiedAt;
  }

  getNumberFieldNames(): string[] {
    return ['expiry', 'verifiedAt'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): EmailVerificationStatus {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as EmailVerificationStatus;
  }
}

/**
 * @inheritDoc iCustomPage
 * @category Accounts
 */
export class CustomPage extends BaseNumberTypeClass<CustomPage> implements iCustomPage {
  title: string;
  description: string;
  items: BatchTokenDetailsArray;

  constructor(data: iCustomPage) {
    super();
    this.title = data.title;
    this.description = data.description;
    this.items = BatchTokenDetailsArray.From(data.items);
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CustomPage {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CustomPage;
  }
}

/**
 * @inheritDoc iProfileDoc
 * @category Accounts
 */
export class ProfileDoc extends BaseNumberTypeClass<ProfileDoc> implements iProfileDoc {
  _docId: string;
  _id?: string;
  fetchedProfile?: 'full' | 'partial';
  seenActivity?: UNIXMilliTimestamp;
  createdAt?: UNIXMilliTimestamp;
  discord?: string;
  twitter?: string;
  github?: string;
  telegram?: string;
  readme?: string;
  affiliateCode?: string;
  hiddenTokens?: BatchTokenDetailsArray;
  profilePicUrl?: string;
  username?: string;
  latestSignedInChain?: SupportedChain;
  notifications?: NotificationPreferences;
  socialConnections?: SocialConnections;
  publicSocialConnections?: SocialConnections;
  bannerImage?: string;

  constructor(data: iProfileDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.fetchedProfile = data.fetchedProfile;
    this.seenActivity = data.seenActivity;
    this.createdAt = data.createdAt;
    this.discord = data.discord;
    this.twitter = data.twitter;
    this.github = data.github;
    this.telegram = data.telegram;
    this.readme = data.readme;
    this.affiliateCode = data.affiliateCode;
    this.hiddenTokens = data.hiddenTokens ? BatchTokenDetailsArray.From(data.hiddenTokens) : undefined;
    this.profilePicUrl = data.profilePicUrl;
    this.username = data.username;
    this.latestSignedInChain = data.latestSignedInChain;
    this.notifications = data.notifications ? new NotificationPreferences(data.notifications) : undefined;
    this.socialConnections = data.socialConnections ? new SocialConnections(data.socialConnections) : undefined;
    this.publicSocialConnections = data.publicSocialConnections ? new SocialConnections(data.publicSocialConnections) : undefined;
    this.bannerImage = data.bannerImage;
  }

  getNumberFieldNames(): string[] {
    return ['seenActivity', 'createdAt'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ProfileDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ProfileDoc;
  }
}

/**
 * @inheritDoc iQueueDoc
 * @category Indexer
 */
export class QueueDoc extends BaseNumberTypeClass<QueueDoc> implements iQueueDoc {
  _docId: string;
  _id?: string;
  uri: string;
  collectionId: CollectionId;
  loadBalanceId: string | number;
  pending?: boolean;
  refreshRequestTime: UNIXMilliTimestamp;
  numRetries: string | number;
  lastFetchedAt?: UNIXMilliTimestamp;
  error?: string;
  deletedAt?: UNIXMilliTimestamp;
  nextFetchTime?: UNIXMilliTimestamp;
  emailMessage?: string;
  recipientAddress?: string;
  activityDocId?: string;
  notificationType?: string;
  claimInfo?:
    | {
        session: any;
        body: any;
        claimId: string;
        bitbadgesAddress: string;
        ip: string | undefined;
        [key: string]: any;
      }
    | undefined;
  faucetInfo?: { txHash: string; recipient: string; amount: string | number; denom: string } | undefined;
  actionConfig?: any;
  initiatedBy?: string | undefined;

  constructor(data: iQueueDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.uri = data.uri;
    this.collectionId = data.collectionId;
    this.loadBalanceId = data.loadBalanceId;
    this.pending = data.pending;
    this.refreshRequestTime = data.refreshRequestTime;
    this.numRetries = data.numRetries;
    this.lastFetchedAt = data.lastFetchedAt;
    this.error = data.error;
    this.deletedAt = data.deletedAt;
    this.nextFetchTime = data.nextFetchTime;
    this.emailMessage = data.emailMessage;
    this.recipientAddress = data.recipientAddress;
    this.activityDocId = data.activityDocId;
    this.notificationType = data.notificationType;
    this.claimInfo = data.claimInfo;
    this.faucetInfo = data.faucetInfo;
    this.actionConfig = data.actionConfig;
    this.initiatedBy = data.initiatedBy;
  }

  getNumberFieldNames(): string[] {
    return ['loadBalanceId', 'refreshRequestTime', 'numRetries', 'lastFetchedAt', 'deletedAt', 'nextFetchTime'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): QueueDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as QueueDoc;
  }
}

/**
 * @inheritDoc iLatestBlockStatus
 * @category Indexer
 */
export class LatestBlockStatus extends BaseNumberTypeClass<LatestBlockStatus> implements iLatestBlockStatus {
  height: string | number;
  txIndex: string | number;
  timestamp: UNIXMilliTimestamp;

  constructor(data: iLatestBlockStatus) {
    super();
    this.height = data.height;
    this.txIndex = data.txIndex;
    this.timestamp = data.timestamp;
  }

  getNumberFieldNames(): string[] {
    return ['height', 'txIndex', 'timestamp'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): LatestBlockStatus {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as LatestBlockStatus;
  }
}

/**
 * @inheritDoc iStatusDoc
 * @category Indexer
 *
 * @example
 * ```typescript
 * // Create a new StatusDoc with transaction tracking
 * const statusDoc = new StatusDoc({
 *   _docId: 'status',
 *   block: { height: 1000, txIndex: 5, timestamp: Date.now() },
 *   nextCollectionId: 123,
 *   gasPrice: 0.001,
 *   lastXGasAmounts: [0.001, 0.002, 0.0015],
 *   lastXGasLimits: [100000, 150000, 120000],
 *   lastXTxs: []
 * });
 *
 * // Add transactions with timestamps
 * statusDoc.addTransaction(0.001, 100000); // Uses current timestamp
 * statusDoc.addTransaction(0.002, 150000, Date.now() - 60000); // 1 minute ago
 *
 * // Get transactions in the last 5 minutes
 * const recentTxs = statusDoc.getTransactionsInWindow(5 * 60 * 1000);
 *
 * // Calculate average gas price in the last hour
 * const avgGasPrice = statusDoc.getAverageGasPriceInWindow(60 * 60 * 1000);
 *
 * // Get transaction statistics
 * const stats = statusDoc.getTransactionStats(24 * 60 * 60 * 1000); // Last 24 hours
 * console.log(`Total transactions: ${stats.count}`);
 * console.log(`Average amount: ${stats.averageAmount}`);
 *
 * // Clean up old transactions (older than 1 day)
 * const removed = statusDoc.cleanupOldTransactions(24 * 60 * 60 * 1000);
 * console.log(`Removed ${removed} old transactions`);
 * ```
 */
export class StatusDoc extends BaseNumberTypeClass<StatusDoc> implements iStatusDoc {
  _docId: string;
  _id?: string;
  block: LatestBlockStatus;
  nextCollectionId: string | number;
  gasPrice: number;
  lastXTxs?: TransactionEntry[];

  constructor(data: iStatusDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.block = new LatestBlockStatus(data.block);
    this.nextCollectionId = data.nextCollectionId;
    this.gasPrice = data.gasPrice;
    this.lastXTxs = data.lastXTxs?.map((tx) => new TransactionEntry(tx));
  }

  getNumberFieldNames(): string[] {
    return ['nextCollectionId'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): StatusDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as StatusDoc;
  }

  /**
   * Add a new transaction entry to the lastXTxs array
   * @param amount - The transaction amount
   * @param limit - The gas limit
   * @param timestamp - The timestamp (optional, defaults to current time)
   * @param maxEntries - Maximum number of entries to keep (optional, defaults to 100)
   */
  addTransaction(amount: T, limit: T, timestamp?: number, maxEntries: number = 100): void {
    const now = timestamp ?? Date.now();
    const entry = new TransactionEntry({
      amount,
      limit,
      timestamp: now as UNIXMilliTimestamp
    });

    if (!this.lastXTxs) {
      this.lastXTxs = [];
    }

    this.lastXTxs.push(entry);

    // Keep only the last maxEntries
    if (this.lastXTxs.length > maxEntries) {
      this.lastXTxs = this.lastXTxs.slice(-maxEntries);
    }
  }

  /**
   * Get transactions within a time window
   * @param windowMs - Time window in milliseconds
   * @param currentTime - Current timestamp (optional, defaults to Date.now())
   * @returns Array of transactions within the time window
   */
  getTransactionsInWindow(windowMs: number, currentTime?: number, defaultMinimumTxs?: number): TransactionEntry[] {
    if (!this.lastXTxs) {
      return [];
    }

    const now = currentTime ?? Date.now();
    const cutoffTime = now - windowMs;

    const txsInWindow = this.lastXTxs.filter((tx) => Number(tx.timestamp) >= cutoffTime);

    if (!defaultMinimumTxs) {
      return txsInWindow;
    }

    if (txsInWindow.length >= defaultMinimumTxs) {
      return txsInWindow;
    }

    // Default to latest defaultMinimumTxs
    const txsToReturn = Math.min(defaultMinimumTxs, txsInWindow.length);
    return txsInWindow.slice(-txsToReturn);
  }

  /**
   * Calculate average gas price from transactions in a time window
   * @param windowMs - Time window in milliseconds
   * @param currentTime - Current timestamp (optional, defaults to Date.now())
   * @returns Average gas price or 0 if no transactions
   */
  getAverageGasPriceInWindow(windowMs: number, currentTime?: number): number {
    const transactions = this.getTransactionsInWindow(windowMs, currentTime, 10);

    if (transactions.length === 0) {
      return 0;
    }

    const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalLimit = transactions.reduce((sum, tx) => sum + Number(tx.limit), 0);

    // Gas price = total amount / total gas limit
    return totalLimit > 0 ? totalAmount / totalLimit : 0;
  }

  /**
   * Clean up old transactions beyond a certain age
   * @param maxAgeMs - Maximum age in milliseconds
   * @param currentTime - Current timestamp (optional, defaults to Date.now())
   * @returns Number of transactions removed
   */
  cleanupOldTransactions(maxAgeMs: number, currentTime?: number): number {
    if (!this.lastXTxs) {
      return 0;
    }

    const now = currentTime ?? Date.now();
    const cutoffTime = now - maxAgeMs;
    const initialLength = this.lastXTxs.length;

    this.lastXTxs = this.lastXTxs.filter((tx) => Number(tx.timestamp) >= cutoffTime);

    return initialLength - this.lastXTxs.length;
  }

  /**
   * Get the most recent transaction
   * @returns The most recent transaction entry or null if none exist
   */
  getLatestTransaction(): TransactionEntry | null {
    if (!this.lastXTxs || this.lastXTxs.length === 0) {
      return null;
    }

    return this.lastXTxs[this.lastXTxs.length - 1];
  }

  /**
   * Get transaction statistics in a time window
   * @param windowMs - Time window in milliseconds
   * @param currentTime - Current timestamp (optional, defaults to Date.now())
   * @returns Object with transaction statistics
   */
  getTransactionStats(
    windowMs: number,
    currentTime?: number
  ): {
    count: number;
    totalAmount: number;
    totalLimit: number;
    averageAmount: number;
    averageLimit: number;
    minAmount: number;
    maxAmount: number;
  } {
    const transactions = this.getTransactionsInWindow(windowMs, currentTime);

    if (transactions.length === 0) {
      return {
        count: 0,
        totalAmount: 0,
        totalLimit: 0,
        averageAmount: 0,
        averageLimit: 0,
        minAmount: 0,
        maxAmount: 0
      };
    }

    const amounts = transactions.map((tx) => Number(tx.amount));
    const limits = transactions.map((tx) => Number(tx.limit));

    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const totalLimit = limits.reduce((sum, limit) => sum + limit, 0);

    return {
      count: transactions.length,
      totalAmount,
      totalLimit,
      averageAmount: totalAmount / transactions.length,
      averageLimit: totalLimit / transactions.length,
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts)
    };
  }
}

/**
 * @inheritDoc iAddressListDoc
 * @category Address Lists
 */
export class AddressListDoc extends AddressList implements iAddressListDoc, CustomType<AddressListDoc> {
  _docId: string;
  _id?: string;
  createdBy: BitBadgesAddress;
  managedBy: BitBadgesAddress;
  updateHistory: iUpdateHistory[];
  createdBlock: string | number;
  lastUpdated: UNIXMilliTimestamp;
  nsfw?: { reason: string };
  reported?: { reason: string };
  listId: string;
  addresses: string[];
  whitelist: boolean;
  uri: string;
  customData: string;

  constructor(data: iAddressListDoc) {
    super(data);
    this._docId = data._docId;
    this._id = data._id;
    this.createdBy = data.createdBy;
    this.managedBy = data.managedBy;
    this.updateHistory = data.updateHistory;
    this.createdBlock = data.createdBlock;
    this.lastUpdated = data.lastUpdated;
    this.nsfw = data.nsfw;
    this.reported = data.reported;
    this.listId = data.listId;
    this.addresses = data.addresses;
    this.whitelist = data.whitelist;
    this.uri = data.uri;
    this.customData = data.customData;
  }

  getNumberFieldNames(): string[] {
    return ['createdBlock', 'lastUpdated'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AddressListDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AddressListDoc;
  }

  clone(): AddressListDoc {
    return super.clone() as AddressListDoc;
  }
}

/**
 * @inheritDoc iBalanceDoc
 * @category Balances
 */
export class BalanceDoc extends BaseNumberTypeClass<BalanceDoc> implements iBalanceDoc {
  _docId: string;
  _id?: string;
  collectionId: CollectionId;
  bitbadgesAddress: BitBadgesAddress;
  updateHistory: UpdateHistory[];
  balances: BalanceArray;
  incomingApprovals: UserIncomingApproval[];
  outgoingApprovals: UserOutgoingApproval[];
  userPermissions: UserPermissions;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveAllIncomingTransfers: boolean;
  tags?: string[];

  constructor(data: iBalanceDoc & Doc & iUserBalanceStore) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.updateHistory = data.updateHistory.map((updateHistory) => new UpdateHistory(updateHistory));
    this.balances = BalanceArray.From(data.balances);
    this.incomingApprovals = data.incomingApprovals.map((incomingApproval) => new UserIncomingApproval(incomingApproval));
    this.outgoingApprovals = data.outgoingApprovals.map((outgoingApproval) => new UserOutgoingApproval(outgoingApproval));
    this.userPermissions = new UserPermissions(data.userPermissions);
    this.autoApproveSelfInitiatedIncomingTransfers = data.autoApproveSelfInitiatedIncomingTransfers;
    this.autoApproveSelfInitiatedOutgoingTransfers = data.autoApproveSelfInitiatedOutgoingTransfers;
    this.autoApproveAllIncomingTransfers = data.autoApproveAllIncomingTransfers;
    this.tags = data.tags;
  }

  getNumberFieldNames(): string[] {
    return ['fetchedAt', 'fetchedAtBlock'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): BalanceDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as BalanceDoc;
  }
}

/**
 * @inheritDoc iBalanceDocWithDetails
 * @category Balances
 */
export class BalanceDocWithDetails extends BaseNumberTypeClass<BalanceDocWithDetails> implements iBalanceDocWithDetails {
  outgoingApprovals: UserOutgoingApprovalWithDetails[];
  incomingApprovals: UserIncomingApprovalWithDetails[];
  userPermissions: UserPermissionsWithDetails;
  _docId: string;
  _id?: string;
  collectionId: CollectionId;
  bitbadgesAddress: BitBadgesAddress;
  updateHistory: UpdateHistory[];
  balances: BalanceArray;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  autoApproveAllIncomingTransfers: boolean;
  tags?: string[];

  constructor(data: iBalanceDocWithDetails) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.outgoingApprovals = data.outgoingApprovals.map((outgoingApproval) => new UserOutgoingApprovalWithDetails(outgoingApproval));
    this.incomingApprovals = data.incomingApprovals.map((incomingApproval) => new UserIncomingApprovalWithDetails(incomingApproval));
    this.userPermissions = new UserPermissionsWithDetails(data.userPermissions);
    this.collectionId = data.collectionId;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.updateHistory = data.updateHistory.map((updateHistory) => new UpdateHistory(updateHistory));
    this.balances = BalanceArray.From(data.balances);
    this.autoApproveSelfInitiatedIncomingTransfers = data.autoApproveSelfInitiatedIncomingTransfers;
    this.autoApproveSelfInitiatedOutgoingTransfers = data.autoApproveSelfInitiatedOutgoingTransfers;
    this.autoApproveAllIncomingTransfers = data.autoApproveAllIncomingTransfers;
    this.tags = data.tags;
  }

  getNumberFieldNames(): string[] {
    return ['fetchedAt', 'fetchedAtBlock'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): BalanceDocWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as BalanceDocWithDetails;
  }
}

/**
 * @inheritDoc iPointsDoc
 * @category Indexer
 */
export class PointsDoc extends BaseNumberTypeClass<PointsDoc> implements iPointsDoc {
  _docId: string;
  _id?: string;
  address: BitBadgesAddress;
  points: string | number;
  lastCalculatedAt: UNIXMilliTimestamp;
  applicationId: string;
  pageId: string;
  claimSuccessCounts?: { [claimId: string]: number };

  constructor(data: iPointsDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.address = data.address;
    this.points = data.points;
    this.lastCalculatedAt = data.lastCalculatedAt;
    this.applicationId = data.applicationId;
    this.pageId = data.pageId;
    this.claimSuccessCounts = data.claimSuccessCounts;
  }

  getNumberFieldNames(): string[] {
    return ['points', 'lastCalculatedAt'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PointsDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PointsDoc;
  }
}

/**
 * @inheritDoc iTierWithOptionalWeight
 * @category Indexer
 */
export class TierWithOptionalWeight extends BaseNumberTypeClass<TierWithOptionalWeight> implements iTierWithOptionalWeight {
  claimId: string;
  weight?: string | number;
  uncheckable?: boolean;
  pointsCalculationMethod?: string | undefined;

  constructor(data: iTierWithOptionalWeight) {
    super();
    this.claimId = data.claimId;
    this.weight = data.weight;
    this.uncheckable = data.uncheckable;
    this.pointsCalculationMethod = data.pointsCalculationMethod;
  }

  getNumberFieldNames(): string[] {
    return ['weight'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): TierWithOptionalWeight {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as TierWithOptionalWeight;
  }
}

/**
 * @inheritDoc iApplicationPage
 * @category Indexer
 */
export class ApplicationPage extends BaseNumberTypeClass<ApplicationPage> implements iApplicationPage {
  metadata: Metadata;
  pageId: string;
  type?: string;
  points?: TierWithOptionalWeight[];

  constructor(data: iApplicationPage) {
    super();
    this.metadata = new Metadata(data.metadata);
    this.pageId = data.pageId;
    this.type = data.type;
    this.points = data.points?.map((point) => new TierWithOptionalWeight(point));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ApplicationPage {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApplicationPage;
  }

  clone(): ApplicationPage {
    return super.clone() as ApplicationPage;
  }
}

/**
 * @inheritDoc iApiKeyDoc
 * @category Indexer
 */
export class ApiKeyDoc extends CustomTypeClass<ApiKeyDoc> implements iApiKeyDoc {
  _docId: string;
  _id?: string;
  tier?: string;
  label: string;
  apiKey: string;
  bitbadgesAddress: BitBadgesAddress;
  numRequests: number;
  lastRequest: number;
  createdAt: number;
  expiry: number;
  intendedUse: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;

  constructor(data: iApiKeyDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.tier = data.tier;
    this.label = data.label;
    this.apiKey = data.apiKey;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.numRequests = data.numRequests;
    this.lastRequest = data.lastRequest;
    this.createdAt = data.createdAt;
    this.expiry = data.expiry;
    this.intendedUse = data.intendedUse;
    this.stripeSubscriptionId = data.stripeSubscriptionId;
    this.subscriptionStatus = data.subscriptionStatus;
    this.currentPeriodEnd = data.currentPeriodEnd;
    this.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
  }
}

/**
 * @inheritDoc iApplicationDoc
 * @category Indexer
 */
export class ApplicationDoc extends BaseNumberTypeClass<ApplicationDoc> implements iApplicationDoc {
  _docId: string;
  _id?: string;
  applicationId: string;
  createdAt: UNIXMilliTimestamp;
  lastUpdated?: UNIXMilliTimestamp;
  createdBy: BitBadgesAddress;
  managedBy: BitBadgesAddress;
  metadata: iMetadata;
  type: string;

  pages: ApplicationPage[];

  constructor(data: iApplicationDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.applicationId = data.applicationId;
    this.createdAt = data.createdAt;
    this.lastUpdated = data.lastUpdated;
    this.createdBy = data.createdBy;
    this.managedBy = data.managedBy;
    this.metadata = data.metadata;
    this.pages = data.pages.map((page) => new ApplicationPage(page));
    this.type = data.type;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt', 'lastUpdated'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ApplicationDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApplicationDoc;
  }
}

/**
 * @inheritDoc iUtilityPageContent
 * @category Indexer
 */
export class UtilityPageContent extends CustomTypeClass<UtilityPageContent> implements iUtilityPageContent {
  label: string;
  content: string;
  type: string;

  constructor(data: iUtilityPageContent) {
    super();
    this.label = data.label;
    this.content = data.content;
    this.type = data.type;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  clone(): UtilityPageContent {
    return super.clone() as UtilityPageContent;
  }
}

/**
 * @inheritDoc iUtilityPageLink
 * @category Indexer
 */
export class UtilityPageLink extends CustomTypeClass<UtilityPageLink> implements iUtilityPageLink {
  url: string;
  claimId?: string | undefined;
  applicationId?: string | undefined;
  collectionId?: CollectionId | undefined;
  mapId?: string | undefined;
  metadata?: iMetadata | undefined;

  constructor(data: iUtilityPageLink) {
    super();
    this.url = data.url;
    this.claimId = data.claimId;
    this.applicationId = data.applicationId;
    this.collectionId = data.collectionId;
    this.mapId = data.mapId;
    this.metadata = data.metadata;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UtilityPageLink {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UtilityPageLink;
  }
}

/**
 * @inheritDoc iListingViewsDoc
 * @category Indexer
 */
export class ListingViewsDoc extends BaseNumberTypeClass<ListingViewsDoc> implements iListingViewsDoc {
  _docId: string;
  _id?: string;
  listingId: string;
  viewCount: string | number;
  lastUpdated: UNIXMilliTimestamp;
  viewsByPeriod?: { hourly: number; daily: number; weekly: number; monthly: number } | undefined;

  constructor(data: iListingViewsDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.listingId = data.listingId;
    this.viewCount = data.viewCount;
    this.lastUpdated = data.lastUpdated;
    this.viewsByPeriod = data.viewsByPeriod;
  }

  getNumberFieldNames(): string[] {
    return ['viewCount', 'lastUpdated'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ListingViewsDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ListingViewsDoc;
  }
}

/**
 * @inheritDoc iLinkedTo
 * @category Indexer
 */
export class LinkedTo extends CustomTypeClass<LinkedTo> implements iLinkedTo {
  collectionId?: CollectionId;
  tokenIds?: UintRangeArray;

  constructor(data: iLinkedTo) {
    super();
    this.collectionId = data.collectionId;
    this.tokenIds = data.tokenIds ? UintRangeArray.From(data.tokenIds) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): LinkedTo {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as LinkedTo;
  }
}

/**
 * @inheritDoc iInheritMetadataFrom
 * @category Indexer
 */
export class InheritMetadataFrom extends CustomTypeClass<InheritMetadataFrom> implements iInheritMetadataFrom {
  claimId?: string;
  applicationId?: string;
  collectionId?: CollectionId;
  mapId?: string;
  tokenId?: string;

  constructor(data: iInheritMetadataFrom) {
    super();
    this.claimId = data.claimId;
    this.applicationId = data.applicationId;
    this.collectionId = data.collectionId;
    this.mapId = data.mapId;
    this.tokenId = data.tokenId;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): InheritMetadataFrom {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as InheritMetadataFrom;
  }
}

/**
 * @inheritDoc iEstimatedCost
 * @category Indexer
 */
export class EstimatedCost extends CustomTypeClass<EstimatedCost> implements iEstimatedCost {
  amount: string | number;
  denom: string;

  constructor(data: iEstimatedCost) {
    super();
    this.amount = data.amount;
    this.denom = data.denom;
  }

  getNumberFieldNames(): string[] {
    return ['amount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): EstimatedCost {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as EstimatedCost;
  }
}

/**
 * @inheritDoc iUtilityPageDoc
 * @category Indexer
 */
export class UtilityPageDoc extends BaseNumberTypeClass<UtilityPageDoc> implements iUtilityPageDoc {
  _docId: string;
  _id?: string;
  listingId: string;
  type: string;
  categories: string[];
  directLink?: string | undefined;
  createdBy: BitBadgesAddress;
  managedBy: BitBadgesAddress;
  createdAt: UNIXMilliTimestamp;
  content: UtilityPageContent[];
  links: UtilityPageLink[];
  metadata: iMetadata;
  visibility: 'public' | 'private' | 'unlisted';
  lastUpdated?: UNIXMilliTimestamp;
  approvalStatus: {
    isApproved: boolean;
    isFeatured?: boolean;
    featuredPriority?: number;
    rejected?: boolean;
    reason?: string;
    updatedBy?: BitBadgesAddress;
  };
  displayTimes?: UintRange | undefined;
  viewCount?: T | undefined;
  viewsByPeriod?: { hourly: number; daily: number; weekly: number; monthly: number } | undefined;
  linkedTo?: LinkedTo;
  inheritMetadataFrom?: InheritMetadataFrom;
  locale?: string;
  estimatedCost?: EstimatedCost;
  estimatedTime?: string;
  homePageView?: {
    type: 'tokens' | 'lists' | 'claims' | 'applications';
    category: string;
  };

  constructor(data: iUtilityPageDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.listingId = data.listingId;
    this.type = data.type;
    this.directLink = data.directLink;
    this.categories = data.categories;
    this.createdBy = data.createdBy;
    this.managedBy = data.managedBy;
    this.createdAt = data.createdAt;
    this.content = data.content.map((content) => new UtilityPageContent(content));
    this.links = data.links.map((link) => new UtilityPageLink(link));
    this.metadata = data.metadata;
    this.visibility = data.visibility;
    this.approvalStatus = data.approvalStatus;
    this.displayTimes = data.displayTimes ? new UintRange(data.displayTimes) : undefined;
    this.viewCount = data.viewCount;
    this.viewsByPeriod = data.viewsByPeriod;
    this.linkedTo = data.linkedTo ? new LinkedTo(data.linkedTo) : undefined;
    this.inheritMetadataFrom = data.inheritMetadataFrom ? new InheritMetadataFrom(data.inheritMetadataFrom) : undefined;
    this.lastUpdated = data.lastUpdated;
    this.locale = data.locale;
    this.estimatedCost = data.estimatedCost ? new EstimatedCost(data.estimatedCost) : undefined;
    this.estimatedTime = data.estimatedTime;
    this.homePageView = data.homePageView;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt', 'viewCount', 'lastUpdated'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UtilityPageDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UtilityPageDoc;
  }
}

/**
 * @inheritDoc iClaimBuilderDoc
 * @category Indexer
 */
export class ClaimBuilderDoc extends BaseNumberTypeClass<ClaimBuilderDoc> implements iClaimBuilderDoc {
  _docId: string;
  _id?: string;
  cid: string;
  createdBy: BitBadgesAddress;
  managedBy: BitBadgesAddress;
  docClaimed: boolean;
  collectionId: CollectionId;
  deletedAt?: T | undefined;
  approach?: string;
  manualDistribution?: boolean;
  plugins: IntegrationPluginParams[];
  pluginIds?: string[];
  state: { [pluginId: string]: any };
  action: {
    seedCode?: string;
    siwbbClaim?: boolean;
  };
  trackerDetails?: ChallengeTrackerIdDetails | undefined;
  metadata?: Metadata | undefined;
  lastUpdated: string | number;
  createdAt: string | number;
  assignMethod?: string | undefined;
  version: string | number;
  testOnly?: boolean;
  rewards?: ClaimReward[] | undefined;
  estimatedCost?: string | undefined;

  showInSearchResults?: boolean;
  categories?: string[];
  estimatedTime?: string | undefined;
  satisfyMethod?: SatisfyMethod;
  cachePolicy?: ClaimCachePolicy;

  constructor(data: iClaimBuilderDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.cid = data.cid;
    this.deletedAt = data.deletedAt;
    this.createdBy = data.createdBy;
    this.docClaimed = data.docClaimed;
    this.collectionId = data.collectionId;
    this.plugins = data.plugins;
    this.pluginIds = data.pluginIds;
    this.state = data.state;
    this.approach = data.approach;
    this.lastUpdated = data.lastUpdated;
    this.manualDistribution = data.manualDistribution;
    this.action = {
      seedCode: data.action.seedCode,
      siwbbClaim: data.action.siwbbClaim
    };
    this.trackerDetails = data.trackerDetails ? new ChallengeTrackerIdDetails(data.trackerDetails) : undefined;
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.createdAt = data.createdAt;
    this.version = data.version;
    this.testOnly = data.testOnly;
    this.rewards = data.rewards?.map((reward) => new ClaimReward(reward));
    this.estimatedCost = data.estimatedCost;
    this.showInSearchResults = data.showInSearchResults;
    this.categories = data.categories;
    this.estimatedTime = data.estimatedTime;
    this.assignMethod = data.assignMethod;
    this.satisfyMethod = data.satisfyMethod ? new SatisfyMethod(data.satisfyMethod) : undefined;
    this.managedBy = data.managedBy;
    this.cachePolicy = data.cachePolicy ? new ClaimCachePolicy(data.cachePolicy) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['deletedAt', 'lastUpdated', 'createdAt', 'version'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ClaimBuilderDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimBuilderDoc;
  }
}

/**
 * @inheritDoc iApprovalTrackerDoc
 * @category Approvals / Transferability
 */
export class ApprovalTrackerDoc extends BaseNumberTypeClass<ApprovalTrackerDoc> implements iApprovalTrackerDoc {
  _docId: string;
  _id?: string;
  numTransfers: string | number;
  amounts: BalanceArray;
  collectionId: CollectionId;
  approvalId: string;
  amountTrackerId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  trackerType: string;
  approvedAddress: BitBadgesAddress;
  lastUpdatedAt: UNIXMilliTimestamp;

  constructor(data: iApprovalTrackerDoc & Doc & iAmountTrackerIdDetails) {
    super();
    this.numTransfers = data.numTransfers;
    this.amounts = BalanceArray.From(data.amounts);
    this._docId = data._docId;
    this._id = data._id;
    this.approvalId = data.approvalId;
    this.collectionId = data.collectionId;
    this.amountTrackerId = data.amountTrackerId;
    this.approvalLevel = data.approvalLevel;
    this.approverAddress = data.approverAddress;
    this.trackerType = data.trackerType;
    this.approvedAddress = data.approvedAddress;
    this.lastUpdatedAt = data.lastUpdatedAt;
  }

  getNumberFieldNames(): string[] {
    return ['numTransfers', 'lastUpdatedAt'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ApprovalTrackerDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApprovalTrackerDoc;
  }
}

/**
 * @inheritDoc iMerkleChallengeTrackerDoc
 * @category Approvals / Transferability
 */
export class UsedLeafStatus extends BaseNumberTypeClass<UsedLeafStatus> implements iUsedLeafStatus {
  leafIndex: string | number;
  usedBy: BitBadgesAddress;

  constructor(data: iUsedLeafStatus) {
    super();
    this.leafIndex = data.leafIndex;
    this.usedBy = data.usedBy;
  }

  getNumberFieldNames(): string[] {
    return ['leafIndex'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): UsedLeafStatus {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UsedLeafStatus;
  }
}

/**
 * @inheritDoc iMerkleChallengeTrackerDoc
 * @category Approvals / Transferability
 */
export class MerkleChallengeTrackerDoc extends BaseNumberTypeClass<MerkleChallengeTrackerDoc> implements iMerkleChallengeTrackerDoc {
  _docId: string;
  _id?: string;
  collectionId: CollectionId;
  challengeTrackerId: string;
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  approverAddress: BitBadgesAddress;
  usedLeafIndices: UsedLeafStatus[];
  approvalId: string;

  constructor(data: iMerkleChallengeTrackerDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.challengeTrackerId = data.challengeTrackerId;
    this.approvalLevel = data.approvalLevel;
    this.approverAddress = data.approverAddress;
    this.usedLeafIndices = data.usedLeafIndices.map((usedLeafStatus) => new UsedLeafStatus(usedLeafStatus));
    this.approvalId = data.approvalId;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MerkleChallengeTrackerDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MerkleChallengeTrackerDoc;
  }
}

/**
 * @inheritDoc iFetchDoc
 * @category Indexer
 */
export class FetchDoc extends BaseNumberTypeClass<FetchDoc> implements iFetchDoc {
  _docId: string;
  _id?: string;
  content?:
    | Metadata
    | ApprovalInfoDetails
    | {
        [bitbadgesAddressOrListId: string]: BalanceArray;
      }
    | ChallengeDetails;
  fetchedAt: UNIXMilliTimestamp;
  fetchedAtBlock: string | number;
  db: 'ApprovalInfo' | 'Metadata' | 'Balances' | 'ChallengeInfo';
  isPermanent: boolean;

  constructor(data: iFetchDoc) {
    super();
    this.content =
      data.db === 'Metadata'
        ? new Metadata(data.content as iMetadata)
        : data.db === 'ApprovalInfo'
          ? new ApprovalInfoDetails(data.content as iApprovalInfoDetails)
          : data.db === 'Balances'
            ? Object.keys(data.content ?? {}).reduce(
                (acc, key) => {
                  if (data.content) {
                    acc[key] = BalanceArray.From((data.content as any)[key]);
                    return acc;
                  }

                  throw new Error('Content is undefined');
                },
                {} as { [bitbadgesAddressOrListId: string]: BalanceArray }
              )
            : data.db === 'ChallengeInfo'
              ? new ChallengeDetails(data.content as iChallengeDetails)
              : undefined;
    this.fetchedAt = data.fetchedAt;
    this.fetchedAtBlock = data.fetchedAtBlock;
    this.db = data.db;
    this.isPermanent = data.isPermanent;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return ['fetchedAt', 'fetchedAtBlock'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): FetchDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as FetchDoc;
  }
}

/**
 * @inheritDoc iRefreshDoc
 * @category Indexer
 */
export class RefreshDoc extends BaseNumberTypeClass<RefreshDoc> implements iRefreshDoc {
  _docId: string;
  _id?: string;
  collectionId: CollectionId;
  refreshRequestTime: UNIXMilliTimestamp;

  constructor(data: iRefreshDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.refreshRequestTime = data.refreshRequestTime;
  }

  getNumberFieldNames(): string[] {
    return ['refreshRequestTime'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): RefreshDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as RefreshDoc;
  }
}

/**
 * @inheritDoc iAirdropDoc
 * @category Indexer
 */
export class AirdropDoc extends BaseNumberTypeClass<AirdropDoc> implements iAirdropDoc {
  _docId: string;
  _id?: string;
  airdropped: boolean;
  timestamp: UNIXMilliTimestamp;
  hash?: string;
  ip?: string;

  constructor(data: iAirdropDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.airdropped = data.airdropped;
    this.timestamp = data.timestamp;
    this.hash = data.hash;
    this.ip = data.ip;
  }

  getNumberFieldNames(): string[] {
    return ['timestamp'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AirdropDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AirdropDoc;
  }
}

/**
 * @inheritDoc iCreatorCreditsDoc
 * @category Indexer
 */
export class CreatorCreditsDoc extends BaseNumberTypeClass<CreatorCreditsDoc> implements iCreatorCreditsDoc {
  _docId: string;
  _id?: string;
  credits: string | number;
  creditsLimit?: string | number;

  constructor(data: iCreatorCreditsDoc) {
    super();
    this.credits = data.credits;
    this.creditsLimit = data.creditsLimit;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return ['credits', 'creditsLimit'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): CreatorCreditsDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CreatorCreditsDoc;
  }
}

/**
 * @inheritDoc iIPFSTotalsDoc
 * @category Indexer
 */
export class IPFSTotalsDoc extends BaseNumberTypeClass<IPFSTotalsDoc> implements iIPFSTotalsDoc {
  _docId: string;
  _id?: string;
  bytesUploaded: string | number;

  constructor(data: iIPFSTotalsDoc) {
    super();
    this.bytesUploaded = data.bytesUploaded;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return ['bytesUploaded'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): IPFSTotalsDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as IPFSTotalsDoc;
  }
}

/**
 * @inheritDoc iComplianceDoc
 * @category Indexer
 */
export class ComplianceDoc extends BaseNumberTypeClass<ComplianceDoc> implements iComplianceDoc {
  _docId: string;
  _id?: string;
  tokens: {
    nsfw: BatchTokenDetailsArray;
    reported: BatchTokenDetailsArray;
  };
  accounts: {
    nsfw: { bitbadgesAddress: BitBadgesAddress; reason: string }[];
    reported: { bitbadgesAddress: BitBadgesAddress; reason: string }[];
  };
  applications: {
    nsfw: { applicationId: string; reason: string }[];
    reported: { applicationId: string; reason: string }[];
  };
  claims?: {
    nsfw: { claimId: string; reason: string }[];
    reported: { claimId: string; reason: string }[];
  };
  maps?: {
    nsfw: { mapId: string; reason: string }[];
    reported: { mapId: string; reason: string }[];
  };

  constructor(data: iComplianceDoc) {
    super();
    this.tokens = {
      nsfw: BatchTokenDetailsArray.From(data.tokens.nsfw),
      reported: BatchTokenDetailsArray.From(data.tokens.reported)
    };
    this.accounts = data.accounts;
    this.applications = data.applications ?? { nsfw: [], reported: [] };
    this._docId = data._docId;
    this._id = data._id;
    this.claims = data.claims ?? { nsfw: [], reported: [] };
    this.maps = data.maps ?? { nsfw: [], reported: [] };
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ComplianceDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ComplianceDoc;
  }
}

/**
 * @inheritDoc iAccessTokenDoc
 * @category OAuth
 */
export class AccessTokenDoc extends CustomTypeClass<AccessTokenDoc> implements iAccessTokenDoc {
  _docId: string;
  _id?: string;
  accessToken: string;
  clientId: string;
  tokenType: string;
  refreshToken: string;
  bitbadgesAddress: string;
  address: string;
  scopes: OAuthScopeDetails[];
  refreshTokenExpiresAt: number;
  accessTokenExpiresAt: number;

  constructor(data: iAccessTokenDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.accessToken = data.accessToken;
    this.tokenType = data.tokenType;
    this.clientId = data.clientId;
    this.refreshToken = data.refreshToken;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.address = data.address;
    this.refreshTokenExpiresAt = data.refreshTokenExpiresAt;
    this.accessTokenExpiresAt = data.accessTokenExpiresAt;
    this.scopes = data.scopes;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): AccessTokenDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AccessTokenDoc;
  }

  clone(): AccessTokenDoc {
    return super.clone() as AccessTokenDoc;
  }
}

/**
 * @inheritDoc iDynamicDataDoc
 * @category Hook Bins
 */
export class DynamicDataDoc extends BaseNumberTypeClass<DynamicDataDoc> implements iDynamicDataDoc {
  _docId: string;
  _id?: string;
  handlerId: string;
  label: string;
  dynamicDataId: string;
  dataSecret: string;
  data: any;
  createdBy: BitBadgesAddress;
  managedBy: BitBadgesAddress;
  publicUseInClaims?: boolean;
  createdAt?: UNIXMilliTimestamp;
  lastUpdated?: UNIXMilliTimestamp;

  constructor(data: iDynamicDataDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.handlerId = data.handlerId;
    this.label = data.label;
    this.dynamicDataId = data.dynamicDataId;
    this.dataSecret = data.dataSecret;
    this.data = data.data;
    this.createdBy = data.createdBy;
    this.managedBy = data.managedBy;
    this.publicUseInClaims = data.publicUseInClaims;
    this.createdAt = data.createdAt;
    this.lastUpdated = data.lastUpdated;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt', 'lastUpdated'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): DynamicDataDoc<Q, U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicDataDoc<Q, U>;
  }

  clone(): DynamicDataDoc {
    return super.clone() as DynamicDataDoc;
  }
}

/**
 * @inheritDoc iDeveloperAppDoc
 * @category SIWBB
 */
export class DeveloperAppDoc extends BaseNumberTypeClass<DeveloperAppDoc> implements iDeveloperAppDoc {
  _docId: string;
  _id?: string | undefined;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  createdBy: BitBadgesAddress;
  managedBy: BitBadgesAddress;
  description: string;
  image: string;
  lastUpdated?: UNIXMilliTimestamp;
  createdAt?: UNIXMilliTimestamp;

  constructor(data: iDeveloperAppDoc) {
    super();
    this.description = data.description;
    this.image = data.image;
    this.name = data.name;
    this.clientId = data.clientId;
    this.clientSecret = data.clientSecret;
    this.redirectUris = data.redirectUris;
    this._docId = data._docId;
    this.createdBy = data.createdBy;
    this.managedBy = data.managedBy;
    this._id = data._id;
    this.lastUpdated = data.lastUpdated;
    this.createdAt = data.createdAt;
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdated', 'createdAt'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): DeveloperAppDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DeveloperAppDoc;
  }

  clone(): DeveloperAppDoc {
    return super.clone() as DeveloperAppDoc;
  }
}

/**
 * @inheritDoc iDepositBalanceDoc
 * @category Indexer
 */
export class DepositBalanceDoc extends BaseNumberTypeClass<DepositBalanceDoc> implements iDepositBalanceDoc {
  _docId: string;
  _id?: string;
  bitbadgesAddress: BitBadgesAddress;

  constructor(data: iDepositBalanceDoc) {
    super();
    this.bitbadgesAddress = data.bitbadgesAddress;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): DepositBalanceDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DepositBalanceDoc;
  }

  clone(): DepositBalanceDoc {
    return super.clone() as DepositBalanceDoc;
  }
}

/**
 * @inheritDoc iPluginVersionConfig
 * @category Plugins
 */
export class PluginVersionConfig extends BaseNumberTypeClass<PluginVersionConfig> implements iPluginVersionConfig {
  version: string | number;
  finalized: boolean;
  stateFunctionPreset: PluginPresetType;
  duplicatesAllowed: boolean;
  requiresSessions: boolean;
  requiresUserInputs: boolean;
  reuseForNonIndexed: boolean;
  skipProcessingWebhook?: boolean;
  receiveStatusWebhook: boolean;
  ignoreSimulations?: boolean;
  userInputsSchema: Array<JsonBodyInputSchema>;
  publicParamsSchema: Array<JsonBodyInputSchema>;
  privateParamsSchema: Array<JsonBodyInputSchema>;
  customDetailsDisplay?: string;
  verificationCall?: {
    uri: string;
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
    hardcodedInputs: Array<JsonBodyInputWithValue>;
    passAddress?: boolean;
    passDiscord?: boolean;
    passEmail?: boolean;
    passTwitter?: boolean;
    passGoogle?: boolean;
    passYoutube?: boolean;
    passGithub?: boolean;
    passTwitch?: boolean;
    passStrava?: boolean;
    passReddit?: boolean;
    passMeetup?: boolean;
    passBluesky?: boolean;
    passShopify?: boolean;
    passFacebook?: boolean;
    passTelegram?: boolean;
    passFarcaster?: boolean;
    passSlack?: boolean;
    passMailchimp?: boolean;
    postProcessingJs: string;
  };
  claimCreatorRedirect?: { toolUri?: string; tutorialUri?: string; testerUri?: string };
  userInputRedirect?: { baseUri?: string; tutorialUri?: string };
  createdAt: UNIXMilliTimestamp;
  lastUpdated: UNIXMilliTimestamp;
  requireSignIn?: boolean;

  constructor(data: iPluginVersionConfig) {
    super();
    this.finalized = data.finalized;
    this.version = data.version;
    this.stateFunctionPreset = data.stateFunctionPreset;
    this.duplicatesAllowed = data.duplicatesAllowed;
    this.requiresSessions = data.requiresSessions;
    this.requiresUserInputs = data.requiresUserInputs;
    this.reuseForNonIndexed = data.reuseForNonIndexed;
    this.ignoreSimulations = data.ignoreSimulations;
    this.receiveStatusWebhook = data.receiveStatusWebhook;
    this.skipProcessingWebhook = data.skipProcessingWebhook;
    this.userInputsSchema = data.userInputsSchema;
    this.customDetailsDisplay = data.customDetailsDisplay;
    this.publicParamsSchema = data.publicParamsSchema;
    this.privateParamsSchema = data.privateParamsSchema;
    this.verificationCall = data.verificationCall;
    this.claimCreatorRedirect = data.claimCreatorRedirect;
    this.userInputRedirect = data.userInputRedirect;
    this.createdAt = data.createdAt;
    this.lastUpdated = data.lastUpdated;
    this.requireSignIn = data.requireSignIn;
  }

  getNumberFieldNames(): string[] {
    return ['version', 'createdAt', 'lastUpdated'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PluginVersionConfig {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PluginVersionConfig;
  }

  clone(): PluginVersionConfig {
    return super.clone() as PluginVersionConfig;
  }
}

/**
 * @inheritDoc iPluginDoc
 * @category Plugins
 */
export class PluginDoc extends BaseNumberTypeClass<PluginDoc> implements iPluginDoc {
  _docId: string;
  _id?: string | undefined;
  pluginId: string;
  pluginSecret?: string;
  toPublish: boolean;
  reviewCompleted: boolean;
  inviteCode?: string | undefined;
  approvedUsers: NativeAddress[];
  createdBy: BitBadgesAddress;
  managedBy: BitBadgesAddress;
  metadata: {
    createdBy: string;
    name: string;
    description: string;
    image: string;
    parentApp?: string;
    documentation?: string;
    sourceCode?: string;
    supportLink?: string;
  };
  lastUpdated: UNIXMilliTimestamp;
  createdAt: UNIXMilliTimestamp;
  deletedAt?: UNIXMilliTimestamp;
  versions: PluginVersionConfig[];
  locale?: string;

  constructor(data: iPluginDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.pluginId = data.pluginId;
    this.pluginSecret = data.pluginSecret;
    this.toPublish = data.toPublish;
    this.reviewCompleted = data.reviewCompleted;
    this.inviteCode = data.inviteCode;
    this.approvedUsers = data.approvedUsers;
    this.createdBy = data.createdBy;
    this.managedBy = data.managedBy;
    this.metadata = {
      createdBy: data.metadata.createdBy,
      name: data.metadata.name,
      description: data.metadata.description,
      image: data.metadata.image,
      documentation: data.metadata.documentation,
      sourceCode: data.metadata.sourceCode,
      supportLink: data.metadata.supportLink,
      parentApp: data.metadata.parentApp
    };
    this.lastUpdated = data.lastUpdated;
    this.createdAt = data.createdAt;
    this.deletedAt = data.deletedAt;
    this.versions = data.versions.map((version) => new PluginVersionConfig(version));
    this.locale = data.locale;
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdated', 'createdAt', 'deletedAt'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PluginDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PluginDoc;
  }

  clone(): PluginDoc {
    return super.clone() as PluginDoc;
  }

  getLatestVersion(): PluginVersionConfig {
    return this.versions[this.versions.length - 1];
  }
}

/**
 * @inheritDoc iSIWBBRequestDoc
 * @category SIWBB
 */
export class SIWBBRequestDoc extends BaseNumberTypeClass<SIWBBRequestDoc> implements iSIWBBRequestDoc {
  _docId: string;
  _id?: string;
  code: string;
  clientId: string;
  name?: string;
  description?: string;
  image?: string;
  bitbadgesAddress: BitBadgesAddress;
  createdAt: UNIXMilliTimestamp;
  scopes: OAuthScopeDetails[];
  expiresAt: UNIXMilliTimestamp;
  deletedAt?: UNIXMilliTimestamp;
  redirectUri?: string | undefined;
  address: string;
  chain: SupportedChain;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';

  constructor(data: iSIWBBRequestDoc) {
    super();
    this.address = data.address;
    this.chain = data.chain;
    this.code = data.code;
    this.createdAt = data.createdAt;
    this.deletedAt = data.deletedAt;
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
    this._docId = data._docId;
    this._id = data._id;
    this.clientId = data.clientId;
    this.scopes = data.scopes;
    this.expiresAt = data.expiresAt;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.redirectUri = data.redirectUri;
    this.codeChallenge = data.codeChallenge;
    this.codeChallengeMethod = data.codeChallengeMethod;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt', 'deletedAt'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): SIWBBRequestDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SIWBBRequestDoc;
  }
}

/**
 * @category Indexer
 */
export interface ErrorDoc {
  _docId: string;
  _id?: string;
  error: string;
  function: string;
}

/**
 * @inheritDoc iMapWithValues
 * @category Maps
 */
export class MapWithValues extends Map implements iMapWithValues {
  values: { [key: string]: ValueStore };
  populatedMetadata?: Metadata;
  updateHistory: UpdateHistory[];

  constructor(data: iMapWithValues) {
    super(data);
    this.values = Object.fromEntries(Object.entries(data.values).map(([key, value]) => [key, new ValueStore(value)]));
    this.populatedMetadata = data.populatedMetadata ? new Metadata(data.populatedMetadata) : undefined;
    this.updateHistory = data.updateHistory.map((update) => new UpdateHistory(update));
  }

  getNumberFieldNames(): string[] {
    return super.getNumberFieldNames();
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): MapWithValues {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MapWithValues;
  }
}

/**
 * @inheritDoc iMapDoc
 * @category Maps
 */
export class MapDoc extends MapWithValues implements iMapDoc {
  _docId: string;
  _id?: string;

  constructor(data: iMapDoc) {
    super(data);
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return super.getNumberFieldNames();
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MapDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MapDoc;
  }
}

/**
 * @inheritDoc iTransactionEntry
 * @category Transaction Tracking
 */
export class TransactionEntry extends BaseNumberTypeClass<TransactionEntry> implements iTransactionEntry {
  amount: string | number;
  limit: string | number;
  timestamp: UNIXMilliTimestamp;

  constructor(data: iTransactionEntry) {
    super();
    this.amount = data.amount;
    this.limit = data.limit;
    this.timestamp = data.timestamp;
  }

  getNumberFieldNames(): string[] {
    return ['amount', 'limit', 'timestamp'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): TransactionEntry {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as TransactionEntry;
  }
}

/**
 * @inheritDoc iDynamicStoreDoc
 * @category Collections
 */
export class DynamicStoreDoc extends BaseNumberTypeClass<DynamicStoreDoc> implements iDynamicStoreDoc {
  _id?: string;
  _docId: string;
  storeId: string | number;
  createdBy: string;
  defaultValue: boolean;
  globalEnabled: boolean;
  uri?: string;
  customData?: string;

  constructor(doc: iDynamicStoreDoc) {
    super();
    this._id = doc._id;
    this._docId = doc._docId;
    this.storeId = doc.storeId;
    this.createdBy = doc.createdBy;
    this.defaultValue = doc.defaultValue;
    this.globalEnabled = doc.globalEnabled;
    this.uri = doc.uri;
    this.customData = doc.customData;
  }

  getNumberFieldNames(): string[] {
    return ['storeId'];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): DynamicStoreDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicStoreDoc;
  }
}

/**
 * @inheritDoc iDynamicStoreDocWithDetails
 * @category Collections
 */
export class DynamicStoreDocWithDetails extends BaseNumberTypeClass<DynamicStoreDocWithDetails> implements iDynamicStoreDocWithDetails {
  _id?: string;
  _docId: string;
  storeId: string | number;
  createdBy: string;
  defaultValue: boolean;
  globalEnabled: boolean;
  uri?: string;
  customData?: string;
  metadata?: Metadata;

  constructor(doc: iDynamicStoreDocWithDetails) {
    super();
    this._id = doc._id;
    this._docId = doc._docId;
    this.storeId = doc.storeId;
    this.createdBy = doc.createdBy;
    this.defaultValue = doc.defaultValue;
    this.globalEnabled = doc.globalEnabled;
    this.uri = doc.uri;
    this.customData = doc.customData;
    this.metadata = doc.metadata ? new Metadata(doc.metadata) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['storeId'];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): DynamicStoreDocWithDetails {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicStoreDocWithDetails;
  }
}

/**
 * @inheritDoc iDynamicStoreValueDoc
 * @category Collections
 */
export class DynamicStoreValueDoc extends BaseNumberTypeClass<DynamicStoreValueDoc> implements iDynamicStoreValueDoc {
  _id?: string;
  _docId: string;
  storeId: string | number;
  address: string;
  value: boolean;

  constructor(doc: iDynamicStoreValueDoc) {
    super();
    this._id = doc._id;
    this._docId = doc._docId;
    this.storeId = doc.storeId;
    this.address = doc.address;
    this.value = doc.value;
  }

  getNumberFieldNames(): string[] {
    return ['storeId'];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): DynamicStoreValueDoc {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DynamicStoreValueDoc;
  }
}
