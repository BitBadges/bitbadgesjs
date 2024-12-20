import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { BigIntify } from '@/common/string-numbers.js';
import type { SupportedChain } from '@/common/types.js';
import {
  ApprovalInfoDetails,
  ChallengeDetails,
  ChallengeTrackerIdDetails,
  CollectionApproval,
  PredeterminedBalances,
  SatisfyMethod,
  UserIncomingApproval,
  UserIncomingApprovalWithDetails,
  UserOutgoingApproval,
  UserOutgoingApprovalWithDetails,
  iApprovalInfoDetails,
  iChallengeDetails
} from '@/core/approvals.js';
import { BalanceArray } from '@/core/balances.js';
import { BatchBadgeDetailsArray } from '@/core/batch-utils.js';
import { CosmosCoin } from '@/core/coin.js';
import { AddressList, AttestationsProof, UintRangeArray, getValueAtTimeForTimeline } from '@/core/index.js';
import {
  BadgeMetadataTimeline,
  CollectionMetadataTimeline,
  CustomDataTimeline,
  IsArchivedTimeline,
  ManagerTimeline,
  OffChainBalancesMetadataTimeline,
  StandardsTimeline,
  UpdateHistory
} from '@/core/misc.js';
import { CollectionPermissions, UserPermissions, UserPermissionsWithDetails } from '@/core/permissions.js';
import type { iOffChainBalancesMap } from '@/core/transfers.js';
import { UserBalanceStore } from '@/core/userBalances.js';
import type { iAmountTrackerIdDetails, iUintRange } from '@/interfaces/badges/core.js';
import type { iUserBalanceStore } from '@/interfaces/badges/userBalances.js';
import { Map, ValueStore } from '@/transactions/messages/bitbadges/maps/index.js';
import type { Doc } from '../base.js';
import type { iMetadata } from '../metadata/metadata.js';
import { Metadata } from '../metadata/metadata.js';
import {
  ClaimReward,
  iDynamicDataDoc,
  DynamicDataHandlerType,
  type BitBadgesAddress,
  type ClaimIntegrationPluginType,
  type IntegrationPluginParams,
  type JsonBodyInputSchema,
  type JsonBodyInputWithValue,
  type NativeAddress,
  type OAuthScopeDetails,
  type PluginPresetType,
  type UNIXMilliTimestamp,
  type iAccessTokenDoc,
  type iAccountDoc,
  type iAddressListDoc,
  type iAirdropDoc,
  type iApprovalTrackerDoc,
  type iAttestationDoc,
  type iBalanceDoc,
  type iBalanceDocWithDetails,
  type iClaimBuilderDoc,
  type iCollectionDoc,
  type iComplianceDoc,
  type iCustomLink,
  type iCustomListPage,
  type iCustomPage,
  type iDepositBalanceDoc,
  type iDeveloperAppDoc,
  type iEmailVerificationStatus,
  type iFetchDoc,
  type iIPFSTotalsDoc,
  type iLatestBlockStatus,
  type iMapDoc,
  type iMapWithValues,
  type iMerkleChallengeDoc,
  type iNotificationPreferences,
  type iPluginDoc,
  type iPluginVersionConfig,
  type iProfileDoc,
  type iQueueDoc,
  type iRefreshDoc,
  type iSIWBBRequestDoc,
  type iSocialConnections,
  type iStatusDoc,
  type iUpdateHistory,
  type iUsedLeafStatus,
  DynamicDataHandlerData,
  iGroupDoc,
  iEvent,
  iGroupPage,
  iPointsDoc,
  iTierWithOptionalWeight
} from './interfaces.js';

/**
 * @inheritDoc iCollectionDoc
 * @category Collections
 */
export class CollectionDoc<T extends NumberType>
  extends BaseNumberTypeClass<CollectionDoc<T>>
  implements iCollectionDoc<T>, CustomType<CollectionDoc<T>>
{
  _docId: string;
  _id?: string;
  collectionId: T;
  collectionMetadataTimeline: CollectionMetadataTimeline<T>[];
  badgeMetadataTimeline: BadgeMetadataTimeline<T>[];
  balancesType: 'Standard' | 'Off-Chain - Indexed' | 'Non-Public' | 'Off-Chain - Non-Indexed';
  offChainBalancesMetadataTimeline: OffChainBalancesMetadataTimeline<T>[];
  customDataTimeline: CustomDataTimeline<T>[];
  managerTimeline: ManagerTimeline<T>[];
  collectionPermissions: CollectionPermissions<T>;
  collectionApprovals: CollectionApproval<T>[];
  standardsTimeline: StandardsTimeline<T>[];
  isArchivedTimeline: IsArchivedTimeline<T>[];
  defaultBalances: UserBalanceStore<T>;
  createdBy: BitBadgesAddress;
  createdBlock: T;
  createdTimestamp: UNIXMilliTimestamp<T>;
  updateHistory: UpdateHistory<T>[];
  aliasAddress: BitBadgesAddress;
  validBadgeIds: UintRangeArray<T>;

  constructor(data: iCollectionDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.collectionMetadataTimeline = data.collectionMetadataTimeline.map(
      (collectionMetadataTimeline) => new CollectionMetadataTimeline(collectionMetadataTimeline)
    );
    this.badgeMetadataTimeline = data.badgeMetadataTimeline.map((badgeMetadataTimeline) => new BadgeMetadataTimeline(badgeMetadataTimeline));
    this.balancesType = data.balancesType;
    this.offChainBalancesMetadataTimeline = data.offChainBalancesMetadataTimeline.map(
      (offChainBalancesMetadataTimeline) => new OffChainBalancesMetadataTimeline(offChainBalancesMetadataTimeline)
    );
    this.customDataTimeline = data.customDataTimeline.map((customDataTimeline) => new CustomDataTimeline(customDataTimeline));
    this.managerTimeline = data.managerTimeline.map((managerTimeline) => new ManagerTimeline(managerTimeline));
    this.collectionPermissions = new CollectionPermissions(data.collectionPermissions);
    this.collectionApprovals = data.collectionApprovals.map((collectionApproval) => new CollectionApproval(collectionApproval));
    this.standardsTimeline = data.standardsTimeline.map((standardsTimeline) => new StandardsTimeline(standardsTimeline));
    this.isArchivedTimeline = data.isArchivedTimeline.map((isArchivedTimeline) => new IsArchivedTimeline(isArchivedTimeline));
    this.defaultBalances = new UserBalanceStore(data.defaultBalances);
    this.createdBy = data.createdBy;
    this.createdBlock = data.createdBlock;
    this.createdTimestamp = data.createdTimestamp;
    this.updateHistory = data.updateHistory.map((updateHistory) => new UpdateHistory(updateHistory));
    this.aliasAddress = data.aliasAddress;

    this.validBadgeIds = UintRangeArray.From(data.validBadgeIds);
  }

  private getTimelineValuesAtTime(time?: NumberType) {
    const coll = this.convert(BigIntify);
    return {
      manager: getValueAtTimeForTimeline(coll.managerTimeline, time)?.manager,
      collectionMetadata: getValueAtTimeForTimeline(coll.collectionMetadataTimeline, time)?.collectionMetadata,
      badgeMetadata: getValueAtTimeForTimeline(coll.badgeMetadataTimeline, time)?.badgeMetadata ?? [],
      offChainBalancesMetadata: getValueAtTimeForTimeline(coll.offChainBalancesMetadataTimeline, time)?.offChainBalancesMetadata,
      customData: getValueAtTimeForTimeline(coll.customDataTimeline, time)?.customData,
      standards: getValueAtTimeForTimeline(coll.standardsTimeline, time)?.standards,
      isArchived: getValueAtTimeForTimeline(coll.isArchivedTimeline, time)?.isArchived
    };
  }

  /**
   * Gets the manager at a specific time (Date.now() by default).
   */
  getManager(time?: NumberType) {
    return this.getTimelineValuesAtTime(time).manager;
  }

  /**
   * Gets the collection metadata at a specific time (Date.now() by default).
   *
   * This gets the timeline value. For the actual fetched value, use `getCollectionMetadata()` instead.
   */
  getCollectionMetadataTimelineValue(time?: NumberType) {
    return this.getTimelineValuesAtTime(time).collectionMetadata;
  }

  /**
   * Gets the badge metadata at a specific time (Date.now() by default).
   *
   * This gets the timeline value. For the actual fetched value, use `getBadgeMetadata()` instead.
   */
  getBadgeMetadataTimelineValue(time?: NumberType) {
    return this.getTimelineValuesAtTime(time).badgeMetadata;
  }

  /**
   * Gets the off-chain balances metadata at a specific time (Date.now() by default).
   */
  getOffChainBalancesMetadata(time?: NumberType) {
    return this.getTimelineValuesAtTime(time).offChainBalancesMetadata;
  }

  /**
   * Gets the custom data at a specific time (Date.now() by default).
   */
  getCustomData(time?: NumberType) {
    return this.getTimelineValuesAtTime(time).customData;
  }

  /**
   * Gets the standards at a specific time (Date.now() by default).
   */
  getStandards(time?: NumberType) {
    return this.getTimelineValuesAtTime(time).standards;
  }

  /**
   * Gets the is archived at a specific time (Date.now() by default).
   */
  getIsArchived(time?: NumberType) {
    return this.getTimelineValuesAtTime(time).isArchived;
  }

  /**
   * Creates a blank balance object with the genesis default approvals and balances.
   */
  getDefaultUserBalance() {
    return this.defaultBalances.clone();
  }

  getNumberFieldNames(): string[] {
    return ['collectionId', 'createdBlock', 'createdTimestamp'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): CollectionDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionDoc<U>;
  }

  clone(): CollectionDoc<T> {
    return super.clone() as CollectionDoc<T>;
  }
}

/**
 * @inheritDoc iAccountDoc
 * @category Accounts
 */
export class AccountDoc<T extends NumberType> extends BaseNumberTypeClass<AccountDoc<T>> implements iAccountDoc<T> {
  _docId: string;
  _id?: string;
  publicKey: string;
  accountNumber: T;
  pubKeyType: string;
  bitbadgesAddress: BitBadgesAddress;
  ethAddress: string;
  solAddress: string;
  btcAddress: string;
  sequence?: T;
  balance?: CosmosCoin<T>;

  constructor(data: iAccountDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.publicKey = data.publicKey;
    this.accountNumber = data.accountNumber;
    this.pubKeyType = data.pubKeyType;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.ethAddress = data.ethAddress;
    this.solAddress = data.solAddress;
    this.btcAddress = data.btcAddress;
    this.sequence = data.sequence;
    this.balance = data.balance ? new CosmosCoin(data.balance) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['accountNumber', 'sequence'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AccountDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AccountDoc<U>;
  }
}

/**
 * @category Accounts
 */
export class SocialConnectionInfo<T extends NumberType> extends BaseNumberTypeClass<SocialConnectionInfo<T>> {
  username: string;
  id: string;
  lastUpdated: UNIXMilliTimestamp<T>;
  discriminator?: string;

  constructor(data: { username: string; id: string; lastUpdated: UNIXMilliTimestamp<T>; discriminator?: string }) {
    super();
    this.username = data.username;
    this.id = data.id;
    this.lastUpdated = data.lastUpdated;
    this.discriminator = data.discriminator;
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdated'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): SocialConnectionInfo<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SocialConnectionInfo<U>;
  }
}

/**
 * @inheritDoc iSocialConnections
 * @category Accounts
 */
export class SocialConnections<T extends NumberType> extends BaseNumberTypeClass<SocialConnections<T>> implements iSocialConnections<T> {
  discord?: SocialConnectionInfo<T> | undefined;
  twitter?: SocialConnectionInfo<T> | undefined;
  github?: SocialConnectionInfo<T> | undefined;
  google?: SocialConnectionInfo<T> | undefined;
  twitch?: SocialConnectionInfo<T> | undefined;
  strava?: SocialConnectionInfo<T> | undefined;
  reddit?: SocialConnectionInfo<T> | undefined;
  telegram?: SocialConnectionInfo<T> | undefined;
  farcaster?: SocialConnectionInfo<T> | undefined;
  slack?: SocialConnectionInfo<T> | undefined;

  constructor(data: iSocialConnections<T>) {
    super();
    this.discord = data.discord ? new SocialConnectionInfo(data.discord) : undefined;
    this.twitter = data.twitter ? new SocialConnectionInfo(data.twitter) : undefined;
    this.github = data.github ? new SocialConnectionInfo(data.github) : undefined;
    this.twitch = data.twitch ? new SocialConnectionInfo(data.twitch) : undefined;
    this.google = data.google ? new SocialConnectionInfo(data.google) : undefined;
    this.strava = data.strava ? new SocialConnectionInfo(data.strava) : undefined;
    this.reddit = data.reddit ? new SocialConnectionInfo(data.reddit) : undefined;
    this.telegram = data.telegram ? new SocialConnectionInfo(data.telegram) : undefined;
    this.farcaster = data.farcaster ? new SocialConnectionInfo(data.farcaster) : undefined;
    this.slack = data.slack ? new SocialConnectionInfo(data.slack) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): SocialConnections<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SocialConnections<U>;
  }
}

/**
 * @inheritDoc iNotificationPreferences
 * @category Accounts
 */
export class NotificationPreferences<T extends NumberType>
  extends BaseNumberTypeClass<NotificationPreferences<T>>
  implements iNotificationPreferences<T>
{
  email?: string;
  discord?: { id: string; username: string; discriminator: string | undefined; token: string } | undefined;
  emailVerification?: EmailVerificationStatus<T>;
  preferences?: {
    listActivity?: boolean;
    transferActivity?: boolean;
    claimAlerts?: boolean;
    claimActivity?: boolean;
    ignoreIfInitiator?: boolean;
  };

  constructor(data: iNotificationPreferences<T>) {
    super();
    this.email = data.email;
    this.emailVerification = data.emailVerification ? new EmailVerificationStatus(data.emailVerification) : undefined;
    this.preferences = data.preferences;
    this.discord = data.discord;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): NotificationPreferences<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as NotificationPreferences<U>;
  }
}

/**
 * @inheritDoc iEmailVerificationStatus
 * @category Accounts
 */
export class EmailVerificationStatus<T extends NumberType>
  extends BaseNumberTypeClass<EmailVerificationStatus<T>>
  implements iEmailVerificationStatus<T>
{
  verified?: boolean;
  verifiedAt?: UNIXMilliTimestamp<T> | undefined;
  token?: string;
  expiry?: UNIXMilliTimestamp<T>;
  antiPhishingCode?: string;

  constructor(data: iEmailVerificationStatus<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): EmailVerificationStatus<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as EmailVerificationStatus<U>;
  }
}

/**
 * @inheritDoc iCustomPage
 * @category Accounts
 */
export class CustomPage<T extends NumberType> extends BaseNumberTypeClass<CustomPage<T>> implements iCustomPage<T> {
  title: string;
  description: string;
  items: BatchBadgeDetailsArray<T>;

  constructor(data: iCustomPage<T>) {
    super();
    this.title = data.title;
    this.description = data.description;
    this.items = BatchBadgeDetailsArray.From(data.items);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CustomPage<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CustomPage<U>;
  }
}

/**
 * @inheritDoc iCustomListPage
 * @category Accounts
 */
export class CustomListPage extends CustomTypeClass<CustomListPage> implements iCustomListPage {
  title: string;
  description: string;
  items: string[];

  constructor(data: iCustomListPage) {
    super();
    this.title = data.title;
    this.description = data.description;
    this.items = data.items;
  }
}

/**
 * @inheritDoc iProfileDoc
 * @category Accounts
 */
export class ProfileDoc<T extends NumberType> extends BaseNumberTypeClass<ProfileDoc<T>> implements iProfileDoc<T> {
  _docId: string;
  _id?: string;
  fetchedProfile?: 'full' | 'partial';
  embeddedWalletAddress?: string;
  seenActivity?: UNIXMilliTimestamp<T>;
  createdAt?: UNIXMilliTimestamp<T>;
  discord?: string;
  twitter?: string;
  github?: string;
  telegram?: string;
  readme?: string;
  customLinks?: iCustomLink[];
  hiddenBadges?: BatchBadgeDetailsArray<T>;
  hiddenLists?: string[];
  customPages?: {
    badges: CustomPage<T>[];
    lists: CustomListPage[];
    attestations: CustomListPage[];
  };
  watchlists?: { badges: CustomPage<T>[]; lists: CustomListPage[]; attestations: CustomListPage[] };
  profilePicUrl?: string;
  username?: string;
  latestSignedInChain?: SupportedChain;
  solAddress?: string;
  notifications?: NotificationPreferences<T>;
  socialConnections?: SocialConnections<T>;
  approvedSignInMethods?:
    | {
        discord?: { scopes: OAuthScopeDetails[]; username: string; discriminator?: string | undefined; id: string } | undefined;
        github?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
        google?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
        twitter?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
        addresses?: {
          address: NativeAddress;
          scopes: OAuthScopeDetails[];
        }[];
        passwords?: {
          passwordHash: string;
          salt: string;
          scopes: OAuthScopeDetails[];
        }[];
      }
    | undefined;
  bannerImage?: string;

  constructor(data: iProfileDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.fetchedProfile = data.fetchedProfile;
    this.embeddedWalletAddress = data.embeddedWalletAddress;
    this.seenActivity = data.seenActivity;
    this.createdAt = data.createdAt;
    this.discord = data.discord;
    this.twitter = data.twitter;
    this.github = data.github;
    this.telegram = data.telegram;
    this.readme = data.readme;
    this.customLinks = data.customLinks;
    this.hiddenBadges = data.hiddenBadges ? BatchBadgeDetailsArray.From(data.hiddenBadges) : undefined;
    this.hiddenLists = data.hiddenLists;
    this.customPages = data.customPages
      ? {
          badges: data.customPages.badges.map((customPage) => new CustomPage(customPage)),
          lists: data.customPages.lists.map((customListPage) => new CustomListPage(customListPage)),
          attestations: data.customPages.attestations.map((customListPage) => new CustomListPage(customListPage))
        }
      : undefined;
    this.watchlists = data.watchlists
      ? {
          badges: data.watchlists.badges.map((customPage) => new CustomPage(customPage)),
          lists: data.watchlists.lists.map((customListPage) => new CustomListPage(customListPage)),
          attestations: data.watchlists.attestations.map((customListPage) => new CustomListPage(customListPage))
        }
      : undefined;
    this.profilePicUrl = data.profilePicUrl;
    this.username = data.username;
    this.latestSignedInChain = data.latestSignedInChain;
    this.solAddress = data.solAddress;
    this.notifications = data.notifications ? new NotificationPreferences(data.notifications) : undefined;
    this.approvedSignInMethods = data.approvedSignInMethods;
    this.socialConnections = data.socialConnections ? new SocialConnections(data.socialConnections) : undefined;
    this.bannerImage = data.bannerImage;
  }

  getNumberFieldNames(): string[] {
    return ['seenActivity', 'createdAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ProfileDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ProfileDoc<U>;
  }
}

/**
 * @inheritDoc iQueueDoc
 * @category Indexer
 */
export class QueueDoc<T extends NumberType> extends BaseNumberTypeClass<QueueDoc<T>> implements iQueueDoc<T> {
  _docId: string;
  _id?: string;
  uri: string;
  collectionId: T;
  loadBalanceId: T;
  pending?: boolean;
  refreshRequestTime: UNIXMilliTimestamp<T>;
  numRetries: T;
  lastFetchedAt?: UNIXMilliTimestamp<T>;
  error?: string;
  deletedAt?: UNIXMilliTimestamp<T>;
  nextFetchTime?: UNIXMilliTimestamp<T>;
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
  faucetInfo?: { txHash: string; recipient: string; amount: NumberType; denom: string } | undefined;
  actionConfig?: any;
  initiatedBy?: string | undefined;

  constructor(data: iQueueDoc<T>) {
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
    return ['collectionId', 'loadBalanceId', 'refreshRequestTime', 'numRetries', 'lastFetchedAt', 'deletedAt', 'nextFetchTime'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): QueueDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as QueueDoc<U>;
  }
}

/**
 * @inheritDoc iLatestBlockStatus
 * @category Indexer
 */
export class LatestBlockStatus<T extends NumberType> extends BaseNumberTypeClass<LatestBlockStatus<T>> implements iLatestBlockStatus<T> {
  height: T;
  txIndex: T;
  timestamp: UNIXMilliTimestamp<T>;

  constructor(data: iLatestBlockStatus<T>) {
    super();
    this.height = data.height;
    this.txIndex = data.txIndex;
    this.timestamp = data.timestamp;
  }

  getNumberFieldNames(): string[] {
    return ['height', 'txIndex', 'timestamp'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): LatestBlockStatus<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as LatestBlockStatus<U>;
  }
}

/**
 * @inheritDoc iStatusDoc
 * @category Indexer
 */
export class StatusDoc<T extends NumberType> extends BaseNumberTypeClass<StatusDoc<T>> implements iStatusDoc<T> {
  _docId: string;
  _id?: string;
  block: LatestBlockStatus<T>;
  nextCollectionId: T;
  gasPrice: number;
  lastXGasAmounts: T[];
  lastXGasLimits: T[];

  constructor(data: iStatusDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.block = new LatestBlockStatus(data.block);
    this.nextCollectionId = data.nextCollectionId;
    this.gasPrice = data.gasPrice;
    this.lastXGasAmounts = data.lastXGasAmounts;
    this.lastXGasLimits = data.lastXGasLimits;
  }

  getNumberFieldNames(): string[] {
    return ['nextCollectionId', 'lastXGasAmounts', 'lastXGasLimits'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): StatusDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as StatusDoc<U>;
  }
}

/**
 * @inheritDoc iAddressListDoc
 * @category Address Lists
 */
export class AddressListDoc<T extends NumberType> extends AddressList implements iAddressListDoc<T>, CustomType<AddressListDoc<T>> {
  _docId: string;
  _id?: string;
  createdBy: BitBadgesAddress;
  updateHistory: iUpdateHistory<T>[];
  createdBlock: T;
  lastUpdated: UNIXMilliTimestamp<T>;
  nsfw?: { reason: string };
  reported?: { reason: string };
  private?: boolean;
  viewableWithLink?: boolean;
  listId: string;
  addresses: string[];
  whitelist: boolean;
  uri: string;
  customData: string;
  aliasAddress?: string | undefined;

  constructor(data: iAddressListDoc<T>) {
    super(data);
    this._docId = data._docId;
    this._id = data._id;
    this.createdBy = data.createdBy;
    this.updateHistory = data.updateHistory;
    this.createdBlock = data.createdBlock;
    this.lastUpdated = data.lastUpdated;
    this.nsfw = data.nsfw;
    this.reported = data.reported;
    this.private = data.private;
    this.viewableWithLink = data.viewableWithLink;
    this.listId = data.listId;
    this.addresses = data.addresses;
    this.whitelist = data.whitelist;
    this.uri = data.uri;
    this.customData = data.customData;
    this.aliasAddress = data.aliasAddress;
  }

  getNumberFieldNames(): string[] {
    return ['createdBlock', 'lastUpdated'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AddressListDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AddressListDoc<U>;
  }

  clone(): AddressListDoc<T> {
    return super.clone() as AddressListDoc<T>;
  }
}

/**
 * @inheritDoc iBalanceDoc
 * @category Balances
 */
export class BalanceDoc<T extends NumberType> extends BaseNumberTypeClass<BalanceDoc<T>> implements iBalanceDoc<T> {
  _docId: string;
  _id?: string;
  collectionId: T;
  bitbadgesAddress: BitBadgesAddress;
  onChain: boolean;
  uri?: string;
  fetchedAt?: UNIXMilliTimestamp<T>;
  fetchedAtBlock?: T;
  isPermanent?: boolean;
  contentHash?: string;
  updateHistory: UpdateHistory<T>[];
  balances: BalanceArray<T>;
  incomingApprovals: UserIncomingApproval<T>[];
  outgoingApprovals: UserOutgoingApproval<T>[];
  userPermissions: UserPermissions<T>;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;

  constructor(data: iBalanceDoc<T> & Doc & iUserBalanceStore<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.onChain = data.onChain;
    this.uri = data.uri;
    this.fetchedAt = data.fetchedAt;
    this.fetchedAtBlock = data.fetchedAtBlock;
    this.isPermanent = data.isPermanent;
    this.contentHash = data.contentHash;
    this.updateHistory = data.updateHistory.map((updateHistory) => new UpdateHistory(updateHistory));
    this.balances = BalanceArray.From(data.balances);
    this.incomingApprovals = data.incomingApprovals.map((incomingApproval) => new UserIncomingApproval(incomingApproval));
    this.outgoingApprovals = data.outgoingApprovals.map((outgoingApproval) => new UserOutgoingApproval(outgoingApproval));
    this.userPermissions = new UserPermissions(data.userPermissions);
    this.autoApproveSelfInitiatedIncomingTransfers = data.autoApproveSelfInitiatedIncomingTransfers;
    this.autoApproveSelfInitiatedOutgoingTransfers = data.autoApproveSelfInitiatedOutgoingTransfers;
  }

  getNumberFieldNames(): string[] {
    return ['fetchedAt', 'fetchedAtBlock', 'collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BalanceDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as BalanceDoc<U>;
  }
}

/**
 * @inheritDoc iBalanceDocWithDetails
 * @category Balances
 */
export class BalanceDocWithDetails<T extends NumberType> extends BaseNumberTypeClass<BalanceDocWithDetails<T>> implements iBalanceDocWithDetails<T> {
  outgoingApprovals: UserOutgoingApprovalWithDetails<T>[];
  incomingApprovals: UserIncomingApprovalWithDetails<T>[];
  userPermissions: UserPermissionsWithDetails<T>;
  _docId: string;
  _id?: string;
  collectionId: T;
  bitbadgesAddress: BitBadgesAddress;
  onChain: boolean;
  uri?: string;
  fetchedAt?: UNIXMilliTimestamp<T>;
  fetchedAtBlock?: T;
  isPermanent?: boolean;
  contentHash?: string;
  updateHistory: UpdateHistory<T>[];
  balances: BalanceArray<T>;
  autoApproveSelfInitiatedIncomingTransfers: boolean;
  autoApproveSelfInitiatedOutgoingTransfers: boolean;

  constructor(data: iBalanceDocWithDetails<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.outgoingApprovals = data.outgoingApprovals.map((outgoingApproval) => new UserOutgoingApprovalWithDetails(outgoingApproval));
    this.incomingApprovals = data.incomingApprovals.map((incomingApproval) => new UserIncomingApprovalWithDetails(incomingApproval));
    this.userPermissions = new UserPermissionsWithDetails(data.userPermissions);
    this.collectionId = data.collectionId;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.onChain = data.onChain;
    this.uri = data.uri;
    this.fetchedAt = data.fetchedAt;
    this.fetchedAtBlock = data.fetchedAtBlock;
    this.isPermanent = data.isPermanent;
    this.contentHash = data.contentHash;
    this.updateHistory = data.updateHistory.map((updateHistory) => new UpdateHistory(updateHistory));
    this.balances = BalanceArray.From(data.balances);
    this.autoApproveSelfInitiatedIncomingTransfers = data.autoApproveSelfInitiatedIncomingTransfers;
    this.autoApproveSelfInitiatedOutgoingTransfers = data.autoApproveSelfInitiatedOutgoingTransfers;
  }

  getNumberFieldNames(): string[] {
    return ['fetchedAt', 'fetchedAtBlock', 'collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BalanceDocWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as BalanceDocWithDetails<U>;
  }
}

/**
 * @inheritDoc iPointsDoc
 * @category Indexer
 */
export class PointsDoc<T extends NumberType> extends BaseNumberTypeClass<PointsDoc<T>> implements iPointsDoc<T> {
  _docId: string;
  _id?: string;
  address: BitBadgesAddress;
  points: T;
  lastCalculatedAt: UNIXMilliTimestamp<T>;
  groupId: string;
  pageId: string;

  constructor(data: iPointsDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.address = data.address;
    this.points = data.points;
    this.lastCalculatedAt = data.lastCalculatedAt;
    this.groupId = data.groupId;
    this.pageId = data.pageId;
  }

  getNumberFieldNames(): string[] {
    return ['points', 'lastCalculatedAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PointsDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PointsDoc<U>;
  }
}

/**
 * @inheritDoc iEvent
 * @category Indexer
 */
export class Event<T extends NumberType> extends BaseNumberTypeClass<Event<T>> implements iEvent<T> {
  metadata: iMetadata<T>;
  eventTimes: UintRangeArray<T>;
  eventId: string;

  constructor(data: iEvent<T>) {
    super();
    this.metadata = data.metadata;
    this.eventTimes = UintRangeArray.From(data.eventTimes);
    this.eventId = data.eventId;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): Event<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Event<U>;
  }
}

/**
 * @inheritDoc iTierWithOptionalWeight
 * @category Indexer
 */
export class TierWithOptionalWeight<T extends NumberType>
  extends BaseNumberTypeClass<TierWithOptionalWeight<T>>
  implements iTierWithOptionalWeight<T>
{
  claimId: string;
  weight?: T;

  constructor(data: iTierWithOptionalWeight<T>) {
    super();
    this.claimId = data.claimId;
    this.weight = data.weight;
  }

  getNumberFieldNames(): string[] {
    return ['weight'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): TierWithOptionalWeight<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as TierWithOptionalWeight<U>;
  }
}

/**
 * @inheritDoc iGroupPage
 * @category Indexer
 */
export class GroupPage<T extends NumberType> extends BaseNumberTypeClass<GroupPage<T>> implements iGroupPage<T> {
  metadata: Metadata<T>;
  pageId: string;
  points?: TierWithOptionalWeight<T>[];
  tiers?: TierWithOptionalWeight<T>[];
  quests?: TierWithOptionalWeight<T>[];
  events?: Event<T>[];
  collectionIds?: T[];
  claimIds?: string[];
  listIds?: string[];
  mapIds?: string[];

  constructor(data: iGroupPage<T>) {
    super();
    this.metadata = new Metadata(data.metadata);
    this.pageId = data.pageId;
    this.tiers = data.tiers?.map((tier) => new TierWithOptionalWeight(tier));
    this.quests = data.quests?.map((quest) => new TierWithOptionalWeight(quest));
    this.points = data.points?.map((point) => new TierWithOptionalWeight(point));
    this.events = data.events?.map((event) => new Event(event));
    this.collectionIds = data.collectionIds;
    this.claimIds = data.claimIds;
    this.listIds = data.listIds;
    this.mapIds = data.mapIds;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GroupPage<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GroupPage<U>;
  }

  clone(): GroupPage<T> {
    return super.clone() as GroupPage<T>;
  }
}

/**
 * @inheritDoc iGroupDoc
 * @category Indexer
 */
export class GroupDoc<T extends NumberType> extends BaseNumberTypeClass<GroupDoc<T>> implements iGroupDoc<T> {
  _docId: string;
  _id?: string;
  groupId: string;
  createdAt: UNIXMilliTimestamp<T>;
  createdBy: BitBadgesAddress;
  metadata: iMetadata<T>;
  type: string;

  pages: GroupPage<T>[];

  constructor(data: iGroupDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.groupId = data.groupId;
    this.createdAt = data.createdAt;
    this.createdBy = data.createdBy;
    this.metadata = data.metadata;
    this.pages = data.pages.map((page) => new GroupPage(page));
    this.type = data.type;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GroupDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GroupDoc<U>;
  }
}

/**
 * @inheritDoc iClaimBuilderDoc
 * @category Indexer
 */
export class ClaimBuilderDoc<T extends NumberType> extends BaseNumberTypeClass<ClaimBuilderDoc<T>> implements iClaimBuilderDoc<T> {
  _docId: string;
  _id?: string;
  cid: string;
  createdBy: BitBadgesAddress;
  docClaimed: boolean;
  collectionId: T;
  deletedAt?: T | undefined;
  approach?: string;
  manualDistribution?: boolean;
  plugins: IntegrationPluginParams<ClaimIntegrationPluginType>[];
  pluginIds?: string[];
  state: { [pluginId: string]: any };
  action: {
    seedCode?: string;
    siwbbClaim?: boolean;
    balancesToSet?: PredeterminedBalances<T> | undefined;
    listId?: string;
  };
  trackerDetails?: ChallengeTrackerIdDetails<T> | undefined;
  metadata?: Metadata<T> | undefined;
  lastUpdated: T;
  createdAt: T;
  assignMethod?: string | undefined;
  version: T;
  testOnly?: boolean;
  rewards?: ClaimReward<T>[] | undefined;
  estimatedCost?: string | undefined;

  showInSearchResults?: boolean;
  categories?: string[];
  estimatedTime?: string | undefined;
  satisfyMethod?: SatisfyMethod;

  constructor(data: iClaimBuilderDoc<T>) {
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
      balancesToSet: data.action.balancesToSet ? new PredeterminedBalances(data.action.balancesToSet) : undefined,
      seedCode: data.action.seedCode,
      listId: data.action.listId,
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
  }

  getNumberFieldNames(): string[] {
    return ['collectionId', 'deletedAt', 'lastUpdated', 'createdAt', 'version'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ClaimBuilderDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimBuilderDoc<U>;
  }
}

/**
 * @inheritDoc iApprovalTrackerDoc
 * @category Approvals / Transferability
 */
export class ApprovalTrackerDoc<T extends NumberType> extends BaseNumberTypeClass<ApprovalTrackerDoc<T>> implements iApprovalTrackerDoc<T> {
  _docId: string;
  _id?: string;
  numTransfers: T;
  amounts: BalanceArray<T>;
  collectionId: T;
  approvalId: string;
  amountTrackerId: string;
  approvalLevel: string;
  approverAddress: BitBadgesAddress;
  trackerType: string;
  approvedAddress: BitBadgesAddress;

  constructor(data: iApprovalTrackerDoc<T> & Doc & iAmountTrackerIdDetails<T>) {
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
  }

  getNumberFieldNames(): string[] {
    return ['numTransfers', 'collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ApprovalTrackerDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ApprovalTrackerDoc<U>;
  }
}

/**
 * @inheritDoc iMerkleChallengeDoc
 * @category Approvals / Transferability
 */
export class UsedLeafStatus<T extends NumberType> extends BaseNumberTypeClass<UsedLeafStatus<T>> implements iUsedLeafStatus<T> {
  leafIndex: T;
  usedBy: BitBadgesAddress;

  constructor(data: iUsedLeafStatus<T>) {
    super();
    this.leafIndex = data.leafIndex;
    this.usedBy = data.usedBy;
  }

  getNumberFieldNames(): string[] {
    return ['leafIndex'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UsedLeafStatus<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UsedLeafStatus<U>;
  }
}

/**
 * @inheritDoc iMerkleChallengeDoc
 * @category Approvals / Transferability
 */
export class MerkleChallengeDoc<T extends NumberType> extends BaseNumberTypeClass<MerkleChallengeDoc<T>> implements iMerkleChallengeDoc<T> {
  _docId: string;
  _id?: string;
  collectionId: T;
  challengeTrackerId: string;
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  approverAddress: BitBadgesAddress;
  usedLeafIndices: UsedLeafStatus<T>[];
  approvalId: string;

  constructor(data: iMerkleChallengeDoc<T>) {
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
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MerkleChallengeDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MerkleChallengeDoc<U>;
  }
}

/**
 * @inheritDoc iFetchDoc
 * @category Indexer
 */
export class FetchDoc<T extends NumberType> extends BaseNumberTypeClass<FetchDoc<T>> implements iFetchDoc<T> {
  _docId: string;
  _id?: string;
  content?:
    | Metadata<T>
    | ApprovalInfoDetails<T>
    | {
        [bitbadgesAddressOrListId: string]: BalanceArray<T>;
      }
    | ChallengeDetails<T>;
  fetchedAt: UNIXMilliTimestamp<T>;
  fetchedAtBlock: T;
  db: 'ApprovalInfo' | 'Metadata' | 'Balances' | 'ChallengeInfo';
  isPermanent: boolean;

  constructor(data: iFetchDoc<T>) {
    super();
    this.content =
      data.db === 'Metadata'
        ? new Metadata(data.content as iMetadata<T>)
        : data.db === 'ApprovalInfo'
          ? new ApprovalInfoDetails(data.content as iApprovalInfoDetails)
          : data.db === 'Balances'
            ? Object.keys(data.content ?? {}).reduce(
                (acc, key) => {
                  if (data.content) {
                    acc[key] = BalanceArray.From((data.content as iOffChainBalancesMap<T>)[key]);
                    return acc;
                  }

                  throw new Error('Content is undefined');
                },
                {} as { [bitbadgesAddressOrListId: string]: BalanceArray<T> }
              )
            : data.db === 'ChallengeInfo'
              ? new ChallengeDetails(data.content as iChallengeDetails<T>)
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): FetchDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as FetchDoc<U>;
  }
}

/**
 * @inheritDoc iRefreshDoc
 * @category Indexer
 */
export class RefreshDoc<T extends NumberType> extends BaseNumberTypeClass<RefreshDoc<T>> implements iRefreshDoc<T> {
  _docId: string;
  _id?: string;
  collectionId: T;
  refreshRequestTime: UNIXMilliTimestamp<T>;

  constructor(data: iRefreshDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.refreshRequestTime = data.refreshRequestTime;
  }

  getNumberFieldNames(): string[] {
    return ['refreshRequestTime', 'collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): RefreshDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as RefreshDoc<U>;
  }
}

/**
 * @inheritDoc iAirdropDoc
 * @category Indexer
 */
export class AirdropDoc<T extends NumberType> extends BaseNumberTypeClass<AirdropDoc<T>> implements iAirdropDoc<T> {
  _docId: string;
  _id?: string;
  airdropped: boolean;
  timestamp: UNIXMilliTimestamp<T>;
  hash?: string;
  ip?: string;

  constructor(data: iAirdropDoc<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AirdropDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AirdropDoc<U>;
  }
}

/**
 * @inheritDoc iIPFSTotalsDoc
 * @category Indexer
 */
export class IPFSTotalsDoc<T extends NumberType> extends BaseNumberTypeClass<IPFSTotalsDoc<T>> implements iIPFSTotalsDoc<T> {
  _docId: string;
  _id?: string;
  bytesUploaded: T;

  constructor(data: iIPFSTotalsDoc<T>) {
    super();
    this.bytesUploaded = data.bytesUploaded;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return ['bytesUploaded'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): IPFSTotalsDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as IPFSTotalsDoc<U>;
  }
}

/**
 * @inheritDoc iComplianceDoc
 * @category Indexer
 */
export class ComplianceDoc<T extends NumberType> extends BaseNumberTypeClass<ComplianceDoc<T>> implements iComplianceDoc<T> {
  _docId: string;
  _id?: string;
  badges: {
    nsfw: BatchBadgeDetailsArray<T>;
    reported: BatchBadgeDetailsArray<T>;
  };
  addressLists: {
    nsfw: { listId: string; reason: string }[];
    reported: { listId: string; reason: string }[];
  };
  accounts: {
    nsfw: { bitbadgesAddress: BitBadgesAddress; reason: string }[];
    reported: { bitbadgesAddress: BitBadgesAddress; reason: string }[];
  };
  groups: {
    nsfw: { groupId: string; reason: string }[];
    reported: { groupId: string; reason: string }[];
  };

  constructor(data: iComplianceDoc<T>) {
    super();
    this.badges = {
      nsfw: BatchBadgeDetailsArray.From(data.badges.nsfw),
      reported: BatchBadgeDetailsArray.From(data.badges.reported)
    };
    this.addressLists = data.addressLists;
    this.accounts = data.accounts;
    this.groups = data.groups ?? { nsfw: [], reported: [] };
    this._docId = data._docId;
    this._id = data._id;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ComplianceDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ComplianceDoc<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AccessTokenDoc {
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
export class DynamicDataDoc<Q extends DynamicDataHandlerType> extends CustomTypeClass<DynamicDataDoc<Q>> implements iDynamicDataDoc<Q> {
  _docId: string;
  _id?: string;
  handlerId: Q;
  label: string;
  dynamicDataId: string;
  dataSecret: string;
  data: DynamicDataHandlerData<Q>;
  createdBy: string;

  constructor(data: iDynamicDataDoc<Q>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.handlerId = data.handlerId;
    this.label = data.label;
    this.dynamicDataId = data.dynamicDataId;
    this.dataSecret = data.dataSecret;
    this.data = data.data;
    this.createdBy = data.createdBy;
  }

  clone(): DynamicDataDoc<Q> {
    return super.clone() as DynamicDataDoc<Q>;
  }
}

/**
 * @inheritDoc iDeveloperAppDoc
 * @category SIWBB
 */
export class DeveloperAppDoc extends CustomTypeClass<DeveloperAppDoc> implements iDeveloperAppDoc {
  _docId: string;
  _id?: string | undefined;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  createdBy: string;
  description: string;
  image: string;

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
    this._id = data._id;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): DeveloperAppDoc {
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
export class DepositBalanceDoc<T extends NumberType> extends BaseNumberTypeClass<DepositBalanceDoc<T>> implements iDepositBalanceDoc<T> {
  _docId: string;
  _id?: string;
  bitbadgesAddress: BitBadgesAddress;

  constructor(data: iDepositBalanceDoc<T>) {
    super();
    this.bitbadgesAddress = data.bitbadgesAddress;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): DepositBalanceDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as DepositBalanceDoc<U>;
  }

  clone(): DepositBalanceDoc<T> {
    return super.clone() as DepositBalanceDoc<T>;
  }
}

/**
 * @inheritDoc iPluginVersionConfig
 * @category Plugins
 */
export class PluginVersionConfig<T extends NumberType> extends BaseNumberTypeClass<PluginVersionConfig<T>> implements iPluginVersionConfig<T> {
  version: T;
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
  verificationCall?: {
    uri: string;
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
    hardcodedInputs: Array<JsonBodyInputWithValue>;
    passAddress?: boolean;
    passDiscord?: boolean;
    passEmail?: boolean;
    passTwitter?: boolean;
    passGoogle?: boolean;
    passGithub?: boolean;
    passTwitch?: boolean;
    passStrava?: boolean;
    passReddit?: boolean;
    passTelegram?: boolean;
    passFarcaster?: boolean;
    passSlack?: boolean;
    postProcessingJs: string;
  };
  claimCreatorRedirect?: { toolUri?: string; tutorialUri?: string };
  userInputRedirect?: { baseUri: string };
  createdAt: UNIXMilliTimestamp<T>;
  lastUpdated: UNIXMilliTimestamp<T>;

  constructor(data: iPluginVersionConfig<T>) {
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
    this.publicParamsSchema = data.publicParamsSchema;
    this.privateParamsSchema = data.privateParamsSchema;
    this.verificationCall = data.verificationCall;
    this.claimCreatorRedirect = data.claimCreatorRedirect;
    this.userInputRedirect = data.userInputRedirect;
    this.createdAt = data.createdAt;
    this.lastUpdated = data.lastUpdated;
  }

  getNumberFieldNames(): string[] {
    return ['version', 'createdAt', 'lastUpdated'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PluginVersionConfig<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PluginVersionConfig<U>;
  }

  clone(): PluginVersionConfig<T> {
    return super.clone() as PluginVersionConfig<T>;
  }
}

/**
 * @inheritDoc iPluginDoc
 * @category Plugins
 */
export class PluginDoc<T extends NumberType> extends BaseNumberTypeClass<PluginDoc<T>> implements iPluginDoc<T> {
  _docId: string;
  _id?: string | undefined;
  pluginId: string;
  pluginSecret?: string;
  toPublish: boolean;
  reviewCompleted: boolean;
  inviteCode?: string | undefined;
  approvedUsers: NativeAddress[];
  createdBy: BitBadgesAddress;
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
  lastUpdated: UNIXMilliTimestamp<T>;
  createdAt: UNIXMilliTimestamp<T>;
  deletedAt?: UNIXMilliTimestamp<T>;
  versions: PluginVersionConfig<T>[];

  constructor(data: iPluginDoc<T>) {
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
  }

  getNumberFieldNames(): string[] {
    return ['lastUpdated', 'createdAt', 'deletedAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PluginDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PluginDoc<U>;
  }

  clone(): PluginDoc<T> {
    return super.clone() as PluginDoc<T>;
  }

  getLatestVersion(): PluginVersionConfig<T> {
    return this.versions[this.versions.length - 1];
  }
}

/**
 * @inheritDoc iSIWBBRequestDoc
 * @category SIWBB
 */
export class SIWBBRequestDoc<T extends NumberType> extends BaseNumberTypeClass<SIWBBRequestDoc<T>> implements iSIWBBRequestDoc<T> {
  _docId: string;
  _id?: string;
  code: string;
  clientId: string;
  name?: string;
  description?: string;
  image?: string;
  bitbadgesAddress: BitBadgesAddress;
  attestationsPresentations: AttestationsProof<T>[];
  createdAt: UNIXMilliTimestamp<T>;
  scopes: OAuthScopeDetails[];
  expiresAt: UNIXMilliTimestamp<T>;
  deletedAt?: UNIXMilliTimestamp<T>;
  otherSignIns?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitch?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
  };
  redirectUri?: string | undefined;
  address: string;
  chain: SupportedChain;

  constructor(data: iSIWBBRequestDoc<T>) {
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
    this.attestationsPresentations = data.attestationsPresentations.map((attestationsProof) => new AttestationsProof(attestationsProof));
    this.clientId = data.clientId;
    this.scopes = data.scopes;
    this.expiresAt = data.expiresAt;
    this.otherSignIns = data.otherSignIns;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.redirectUri = data.redirectUri;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt', 'deletedAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): SIWBBRequestDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SIWBBRequestDoc<U>;
  }
}

/**
 * @inheritDoc iAttestationDoc
 * @category Off-Chain Attestations
 */
export class AttestationDoc<T extends NumberType> extends BaseNumberTypeClass<AttestationDoc<T>> implements iAttestationDoc<T> {
  _docId: string;
  _id?: string;
  messageFormat: 'plaintext' | 'json';
  updateHistory: UpdateHistory<T>[];

  createdBy: string;
  createdAt: UNIXMilliTimestamp<T>;

  proofOfIssuance?: {
    message: string;
    signature: string;
    signer: string;
    publicKey?: string;
  };

  attestationId: string;
  inviteCode: string;

  originalProvider?: string;
  scheme: 'bbs' | 'standard' | 'custom' | string;
  messages: string[];

  dataIntegrityProof?: {
    signature: string;
    signer: string;
    publicKey?: string;
    isDerived?: boolean;
  };

  name: string;
  image: string;
  description: string;

  holders: string[];
  allHolders?: string[];
  anchors: {
    txHash?: string;
    message?: string;
  }[];

  entropies: string[];
  publicVisibility?: boolean | undefined;

  constructor(data: iAttestationDoc<T>) {
    super();
    this.allHolders = data.allHolders;
    this.updateHistory = data.updateHistory?.map((updateHistory) => new UpdateHistory(updateHistory));
    this._docId = data._docId;
    this._id = data._id;
    this.createdBy = data.createdBy;
    this.messageFormat = data.messageFormat;
    this.attestationId = data.attestationId;
    this.inviteCode = data.inviteCode;
    this.scheme = data.scheme;
    this.dataIntegrityProof = data.dataIntegrityProof;
    this.holders = data.holders;
    this.name = data.name;
    this.image = data.image;
    this.description = data.description;
    this.proofOfIssuance = data.proofOfIssuance;
    this.anchors = data.anchors;
    this.messages = data.messages;
    this.createdAt = data.createdAt;
    this.originalProvider = data.originalProvider;
    this.entropies = data.entropies;
    this.publicVisibility = data.publicVisibility;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): AttestationDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as AttestationDoc<U>;
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
export class MapWithValues<T extends NumberType> extends Map<T> implements iMapWithValues<T> {
  values: { [key: string]: ValueStore };
  metadata?: Metadata<T>;
  updateHistory: UpdateHistory<T>[];

  constructor(data: iMapWithValues<T>) {
    super(data);
    this.values = Object.fromEntries(Object.entries(data.values).map(([key, value]) => [key, new ValueStore(value)]));
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.updateHistory = data.updateHistory.map((update) => new UpdateHistory(update));
  }

  getNumberFieldNames(): string[] {
    return super.getNumberFieldNames();
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): MapWithValues<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MapWithValues<U>;
  }
}

/**
 * @inheritDoc iMapDoc
 * @category Maps
 */
export class MapDoc<T extends NumberType> extends MapWithValues<T> implements iMapDoc<T> {
  _docId: string;
  _id?: string;

  constructor(data: iMapDoc<T>) {
    super(data);
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return super.getNumberFieldNames();
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MapDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MapDoc<U>;
  }
}
