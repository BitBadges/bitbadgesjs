import type { CustomType } from '@/common/base';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import { BigIntify } from '@/common/string-numbers';
import type { SupportedChain } from '@/common/types';
import { AddressList, getValueAtTimeForTimeline } from '@/core';
import { IncrementedBalances, iApprovalInfoDetails } from '@/core/approvals';
import {
  ApprovalInfoDetails,
  CollectionApproval,
  UserIncomingApproval,
  UserIncomingApprovalWithDetails,
  UserOutgoingApproval,
  UserOutgoingApprovalWithDetails
} from '@/core/approvals';
import { BalanceArray } from '@/core/balances';
import { BatchBadgeDetailsArray } from '@/core/batch-utils';
import { CosmosCoin } from '@/core/coin';
import {
  BadgeMetadataTimeline,
  CollectionMetadataTimeline,
  CustomDataTimeline,
  IsArchivedTimeline,
  ManagerTimeline,
  OffChainBalancesMetadataTimeline,
  StandardsTimeline
} from '@/core/misc';
import { CollectionPermissions, UserPermissions, UserPermissionsWithDetails } from '@/core/permissions';
import type { iOffChainBalancesMap } from '@/core/transfers';
import { UserBalanceStore } from '@/core/userBalances';
import { iIncrementedBalances } from '@/interfaces';
import type { iAmountTrackerIdDetails } from '@/interfaces/badges/core';
import type { iUserBalanceStore } from '@/interfaces/badges/userBalances';
import type { Doc } from '../base';
import type { iMetadata } from '../metadata/metadata';
import { Metadata } from '../metadata/metadata';
import { BlockinChallengeParams } from '../requests/blockin';
import type {
  ClaimIntegrationPluginType,
  IntegrationPluginDetails,
  iAccountDoc,
  iAddressListDoc,
  iAddressListEditKey,
  iAirdropDoc,
  iApprovalTrackerDoc,
  iBalanceDoc,
  iBalanceDocWithDetails,
  iBlockinAuthSignatureDoc,
  iChallengeTrackerIdDetails,
  iCollectionDoc,
  iComplianceDoc,
  iCustomLink,
  iCustomListPage,
  iCustomPage,
  iEmailVerificationStatus,
  iFetchDoc,
  iFollowDetailsDoc,
  iIPFSTotalsDoc,
  iLatestBlockStatus,
  iMerkleChallengeDoc,
  iMerkleChallengeIdDetails,
  iNotificationPreferences,
  iClaimBuilderDoc,
  iProfileDoc,
  iProtocolDoc,
  iQueueDoc,
  iRefreshDoc,
  iStatusDoc,
  iUserProtocolCollectionsDoc,
  IntegrationPluginParams
} from './interfaces';

/**
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
  balancesType: 'Standard' | 'Off-Chain - Indexed' | 'Inherited' | 'Off-Chain - Non-Indexed';
  offChainBalancesMetadataTimeline: OffChainBalancesMetadataTimeline<T>[];
  customDataTimeline: CustomDataTimeline<T>[];
  managerTimeline: ManagerTimeline<T>[];
  collectionPermissions: CollectionPermissions<T>;
  collectionApprovals: CollectionApproval<T>[];
  standardsTimeline: StandardsTimeline<T>[];
  isArchivedTimeline: IsArchivedTimeline<T>[];
  defaultBalances: UserBalanceStore<T>;
  createdBy: string;
  createdBlock: T;
  createdTimestamp: T;
  updateHistory: UpdateHistory<T>[];
  aliasAddress: string;

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

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): CollectionDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CollectionDoc<U>;
  }

  clone(): CollectionDoc<T> {
    return super.clone() as CollectionDoc<T>;
  }
}

/**
 * @category Accounts
 */
export class AccountDoc<T extends NumberType> extends BaseNumberTypeClass<AccountDoc<T>> implements iAccountDoc<T> {
  _docId: string;
  _id?: string;
  publicKey: string;
  accountNumber: T;
  pubKeyType: string;
  cosmosAddress: string;
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
    this.cosmosAddress = data.cosmosAddress;
    this.ethAddress = data.ethAddress;
    this.solAddress = data.solAddress;
    this.btcAddress = data.btcAddress;
    this.sequence = data.sequence;
    this.balance = data.balance ? new CosmosCoin(data.balance) : undefined;
  }

  getNumberFieldNames(): string[] {
    return ['accountNumber', 'sequence'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): AccountDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as AccountDoc<U>;
  }
}

/**
 * @category Accounts
 */
export class NotificationPreferences<T extends NumberType>
  extends BaseNumberTypeClass<NotificationPreferences<T>>
  implements iNotificationPreferences<T>
{
  email?: string;
  emailVerification?: EmailVerificationStatus<T>;
  preferences?: {
    listActivity?: boolean;
    transferActivity?: boolean;
    claimAlerts?: boolean;
  };

  constructor(data: iNotificationPreferences<T>) {
    super();
    this.email = data.email;
    this.emailVerification = data.emailVerification ? new EmailVerificationStatus(data.emailVerification) : undefined;
    this.preferences = data.preferences;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): NotificationPreferences<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as NotificationPreferences<U>;
  }
}

/**
 * @category Accounts
 */
export class EmailVerificationStatus<T extends NumberType>
  extends BaseNumberTypeClass<EmailVerificationStatus<T>>
  implements iEmailVerificationStatus<T>
{
  verified?: boolean;
  token?: string;
  expiry?: T;
  antiPhishingCode?: string;

  constructor(data: iEmailVerificationStatus<T>) {
    super();
    this.verified = data.verified;
    this.token = data.token;
    this.expiry = data.expiry;
    this.antiPhishingCode = data.antiPhishingCode;
  }

  getNumberFieldNames(): string[] {
    return ['expiry'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): EmailVerificationStatus<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as EmailVerificationStatus<U>;
  }
}

/**
 * CustomPage is a custom page that can be added to a profile.
 * Custom pages allow you to group, sort, and display badges in a custom way.
 *
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CustomPage<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CustomPage<U>;
  }
}

/**
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
 * @category Accounts
 */
export class ProfileDoc<T extends NumberType> extends BaseNumberTypeClass<ProfileDoc<T>> implements iProfileDoc<T> {
  _docId: string;
  _id?: string;
  fetchedProfile?: boolean;
  seenActivity?: T;
  createdAt?: T;
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
  };
  watchlists?: { badges: CustomPage<T>[]; lists: CustomListPage[] };
  profilePicUrl?: string;
  username?: string;
  latestSignedInChain?: SupportedChain;
  solAddress?: string;
  notifications?: NotificationPreferences<T>;
  approvedSignInMethods?: { discord?: { username: string; discriminator?: string | undefined; id: string } | undefined } | undefined;

  constructor(data: iProfileDoc<T>) {
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
    this.customLinks = data.customLinks;
    this.hiddenBadges = data.hiddenBadges ? BatchBadgeDetailsArray.From(data.hiddenBadges) : undefined;
    this.hiddenLists = data.hiddenLists;
    this.customPages = data.customPages
      ? {
          badges: data.customPages.badges.map((customPage) => new CustomPage(customPage)),
          lists: data.customPages.lists.map((customListPage) => new CustomListPage(customListPage))
        }
      : undefined;
    this.watchlists = data.watchlists
      ? {
          badges: data.watchlists.badges.map((customPage) => new CustomPage(customPage)),
          lists: data.watchlists.lists.map((customListPage) => new CustomListPage(customListPage))
        }
      : undefined;
    this.profilePicUrl = data.profilePicUrl;
    this.username = data.username;
    this.latestSignedInChain = data.latestSignedInChain;
    this.solAddress = data.solAddress;
    this.notifications = data.notifications ? new NotificationPreferences(data.notifications) : undefined;
    this.approvedSignInMethods = data.approvedSignInMethods;
  }

  getNumberFieldNames(): string[] {
    return ['seenActivity', 'createdAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ProfileDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ProfileDoc<U>;
  }
}

/**
 * @category Indexer
 */
export class QueueDoc<T extends NumberType> extends BaseNumberTypeClass<QueueDoc<T>> implements iQueueDoc<T> {
  _docId: string;
  _id?: string;
  uri: string;
  collectionId: T;
  loadBalanceId: T;
  refreshRequestTime: T;
  numRetries: T;
  lastFetchedAt?: T;
  error?: string;
  deletedAt?: T;
  nextFetchTime?: T;
  emailMessage?: string;
  recipientAddress?: string;
  activityDocId?: string;
  notificationType?: string;

  constructor(data: iQueueDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.uri = data.uri;
    this.collectionId = data.collectionId;
    this.loadBalanceId = data.loadBalanceId;
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
  }

  getNumberFieldNames(): string[] {
    return ['collectionId', 'loadBalanceId', 'refreshRequestTime', 'numRetries', 'lastFetchedAt', 'deletedAt', 'nextFetchTime'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): QueueDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as QueueDoc<U>;
  }
}

/**
 * @category Indexer
 */
export class LatestBlockStatus<T extends NumberType> extends BaseNumberTypeClass<LatestBlockStatus<T>> implements iLatestBlockStatus<T> {
  height: T;
  txIndex: T;
  timestamp: T;

  constructor(data: iLatestBlockStatus<T>) {
    super();
    this.height = data.height;
    this.txIndex = data.txIndex;
    this.timestamp = data.timestamp;
  }

  getNumberFieldNames(): string[] {
    return ['height', 'txIndex', 'timestamp'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): LatestBlockStatus<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as LatestBlockStatus<U>;
  }
}

/**
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): StatusDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as StatusDoc<U>;
  }
}

/**
 * @category Address Lists
 */
export class AddressListDoc<T extends NumberType> extends AddressList implements iAddressListDoc<T>, CustomType<AddressListDoc<T>> {
  _docId: string;
  _id?: string;
  declare createdBy: string;
  updateHistory: iUpdateHistory<T>[];
  createdBlock: T;
  lastUpdated: T;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): AddressListDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as AddressListDoc<U>;
  }

  clone(): AddressListDoc<T> {
    return super.clone() as AddressListDoc<T>;
  }
}

/**
 * BalanceDoc is the type of document stored in the balances database
 * Partitioned database by cosmosAddress (e.g. 1-cosmosx..., 1-cosmosy..., and so on represent the balances documents for collection 1 and user with cosmos address x and y respectively)
 *
 * @category Balances
 */
export class BalanceDoc<T extends NumberType> extends BaseNumberTypeClass<BalanceDoc<T>> implements iBalanceDoc<T> {
  _docId: string;
  _id?: string;
  collectionId: T;
  cosmosAddress: string;
  onChain: boolean;
  uri?: string;
  fetchedAt?: T;
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
    this.cosmosAddress = data.cosmosAddress;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BalanceDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BalanceDoc<U>;
  }
}

/**
 * @category Interfaces
 */
export interface iUpdateHistory<T extends NumberType> {
  txHash: string;
  block: T;
  blockTimestamp: T;
}

/**
 * @category Indexer
 */
export class UpdateHistory<T extends NumberType> extends BaseNumberTypeClass<UpdateHistory<T>> implements iUpdateHistory<T> {
  txHash: string;
  block: T;
  blockTimestamp: T;

  constructor(data: iUpdateHistory<T>) {
    super();
    this.txHash = data.txHash;
    this.block = data.block;
    this.blockTimestamp = data.blockTimestamp;
  }

  getNumberFieldNames(): string[] {
    return ['block', 'blockTimestamp'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UpdateHistory<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UpdateHistory<U>;
  }
}

/**
 * @category Balances
 */
export class BalanceDocWithDetails<T extends NumberType> extends BaseNumberTypeClass<BalanceDocWithDetails<T>> implements iBalanceDocWithDetails<T> {
  outgoingApprovals: UserOutgoingApprovalWithDetails<T>[];
  incomingApprovals: UserIncomingApprovalWithDetails<T>[];
  userPermissions: UserPermissionsWithDetails<T>;
  _docId: string;
  _id?: string;
  collectionId: T;
  cosmosAddress: string;
  onChain: boolean;
  uri?: string;
  fetchedAt?: T;
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
    this.cosmosAddress = data.cosmosAddress;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BalanceDocWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BalanceDocWithDetails<U>;
  }
}

/**
 * @category Indexer
 */
export class ClaimBuilderDoc<T extends NumberType> extends BaseNumberTypeClass<ClaimBuilderDoc<T>> implements iClaimBuilderDoc<T> {
  _docId: string;
  _id?: string;
  cid: string;
  createdBy: string;
  docClaimed: boolean;
  collectionId: T;
  manualDistribution?: boolean;
  plugins: IntegrationPluginParams<ClaimIntegrationPluginType>[];
  state: { [pluginId: string]: any };
  action: { codes?: string[] | undefined; seedCode?: string; balancesToSet?: IncrementedBalances<T> | undefined; listId?: string };

  constructor(data: iClaimBuilderDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.cid = data.cid;
    this.createdBy = data.createdBy;
    this.docClaimed = data.docClaimed;
    this.collectionId = data.collectionId;
    this.plugins = data.plugins;
    this.state = data.state;
    this.manualDistribution = data.manualDistribution;
    this.action = {
      codes: data.action.codes,
      balancesToSet: data.action.balancesToSet ? new IncrementedBalances(data.action.balancesToSet) : undefined,
      seedCode: data.action.seedCode,
      listId: data.action.listId
    };
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ClaimBuilderDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ClaimBuilderDoc<U>;
  }
}

/**
 * @category Approvals / Transferability
 */
export class ApprovalTrackerDoc<T extends NumberType> extends BaseNumberTypeClass<ApprovalTrackerDoc<T>> implements iApprovalTrackerDoc<T> {
  _docId: string;
  _id?: string;
  numTransfers: T;
  amounts: BalanceArray<T>;
  collectionId: T;
  amountTrackerId: string;
  approvalLevel: string;
  approverAddress: string;
  trackerType: string;
  approvedAddress: string;

  constructor(data: iApprovalTrackerDoc<T> & Doc & iAmountTrackerIdDetails<T>) {
    super();
    this.numTransfers = data.numTransfers;
    this.amounts = BalanceArray.From(data.amounts);
    this._docId = data._docId;
    this._id = data._id;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ApprovalTrackerDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ApprovalTrackerDoc<U>;
  }
}

/**
 * @category Approvals / Transferability
 */
export class ChallengeTrackerIdDetails<T extends NumberType>
  extends BaseNumberTypeClass<ChallengeTrackerIdDetails<T>>
  implements iChallengeTrackerIdDetails<T>
{
  collectionId: T;
  challengeId: string;
  challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
  approverAddress: string;

  constructor(data: iChallengeTrackerIdDetails<T>) {
    super();
    this.collectionId = data.collectionId;
    this.challengeId = data.challengeId;
    this.challengeLevel = data.challengeLevel;
    this.approverAddress = data.approverAddress;
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ChallengeTrackerIdDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ChallengeTrackerIdDetails<U>;
  }
}

/**
 * @category Approvals / Transferability
 */
export class MerkleChallengeDoc<T extends NumberType> extends BaseNumberTypeClass<MerkleChallengeDoc<T>> implements iMerkleChallengeDoc<T> {
  _docId: string;
  _id?: string;
  collectionId: T;
  challengeId: string;
  challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
  approverAddress: string;
  usedLeafIndices: T[];

  constructor(data: iMerkleChallengeDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.collectionId = data.collectionId;
    this.challengeId = data.challengeId;
    this.challengeLevel = data.challengeLevel;
    this.approverAddress = data.approverAddress;
    this.usedLeafIndices = data.usedLeafIndices;
  }

  getNumberFieldNames(): string[] {
    return ['collectionId', 'usedLeafIndices'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): MerkleChallengeDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MerkleChallengeDoc<U>;
  }
}

/**
 * @category Approvals / Transferability
 */
export class MerkleChallengeIdDetails<T extends NumberType>
  extends BaseNumberTypeClass<MerkleChallengeIdDetails<T>>
  implements iMerkleChallengeIdDetails<T>
{
  collectionId: T;
  challengeId: string;
  challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
  approverAddress: string;
  usedLeafIndices: T[];

  constructor(data: iMerkleChallengeIdDetails<T>) {
    super();
    this.collectionId = data.collectionId;
    this.challengeId = data.challengeId;
    this.challengeLevel = data.challengeLevel;
    this.approverAddress = data.approverAddress;
    this.usedLeafIndices = data.usedLeafIndices;
  }

  getNumberFieldNames(): string[] {
    return ['collectionId', 'usedLeafIndices'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): MerkleChallengeIdDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MerkleChallengeIdDetails<U>;
  }
}

/**
 * @category Indexer
 */
export class FetchDoc<T extends NumberType> extends BaseNumberTypeClass<FetchDoc<T>> implements iFetchDoc<T> {
  _docId: string;
  _id?: string;
  content?:
    | Metadata<T>
    | ApprovalInfoDetails<T>
    | {
        [cosmosAddressOrListId: string]: BalanceArray<T>;
      };
  fetchedAt: T;
  fetchedAtBlock: T;
  db: 'ApprovalInfo' | 'Metadata' | 'Balances';
  isPermanent: boolean;

  constructor(data: iFetchDoc<T>) {
    super();
    this.content =
      data.db === 'Metadata'
        ? new Metadata(data.content as iMetadata<T>)
        : data.db === 'ApprovalInfo'
          ? new ApprovalInfoDetails(data.content as iApprovalInfoDetails<T>)
          : data.db === 'Balances'
            ? Object.keys(data.content ?? {}).reduce(
                (acc, key) => {
                  if (data.content) {
                    acc[key] = BalanceArray.From((data.content as iOffChainBalancesMap<T>)[key]);
                    return acc;
                  }

                  throw new Error('Content is undefined');
                },
                {} as { [cosmosAddressOrListId: string]: BalanceArray<T> }
              )
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): FetchDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as FetchDoc<U>;
  }
}

/**
 * @category Indexer
 */
export class RefreshDoc<T extends NumberType> extends BaseNumberTypeClass<RefreshDoc<T>> implements iRefreshDoc<T> {
  _docId: string;
  _id?: string;
  collectionId: T;
  refreshRequestTime: T;

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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): RefreshDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as RefreshDoc<U>;
  }
}

/**
 * @category Indexer
 */
export class AirdropDoc<T extends NumberType> extends BaseNumberTypeClass<AirdropDoc<T>> implements iAirdropDoc<T> {
  _docId: string;
  _id?: string;
  airdropped: boolean;
  timestamp: T;
  hash?: string;

  constructor(data: iAirdropDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.airdropped = data.airdropped;
    this.timestamp = data.timestamp;
    this.hash = data.hash;
  }

  getNumberFieldNames(): string[] {
    return ['timestamp'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): AirdropDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as AirdropDoc<U>;
  }
}

/**
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): IPFSTotalsDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as IPFSTotalsDoc<U>;
  }
}

/**
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
    nsfw: { cosmosAddress: string; reason: string }[];
    reported: { cosmosAddress: string; reason: string }[];
  };

  constructor(data: iComplianceDoc<T>) {
    super();
    this.badges = {
      nsfw: BatchBadgeDetailsArray.From(data.badges.nsfw),
      reported: BatchBadgeDetailsArray.From(data.badges.reported)
    };
    this.addressLists = data.addressLists;
    this.accounts = data.accounts;
    this._docId = data._docId;
    this._id = data._id;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ComplianceDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ComplianceDoc<U>;
  }
}

/**
 * @category Blockin
 */
export class BlockinAuthSignatureDoc<T extends NumberType>
  extends BaseNumberTypeClass<BlockinAuthSignatureDoc<T>>
  implements iBlockinAuthSignatureDoc<T>
{
  _docId: string;
  _id?: string;
  signature: string;
  name: string;
  description: string;
  image: string;
  cosmosAddress: string;
  params: BlockinChallengeParams<T>;
  createdAt: T;
  deletedAt?: T;

  constructor(data: iBlockinAuthSignatureDoc<T>) {
    super();
    this.signature = data.signature;
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
    this.cosmosAddress = data.cosmosAddress;
    this.params = new BlockinChallengeParams(data.params);
    this.createdAt = data.createdAt;
    this.deletedAt = data.deletedAt;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return ['createdAt', 'deletedAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BlockinAuthSignatureDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BlockinAuthSignatureDoc<U>;
  }
}

/**
 * Follow details specify the number of followers and following for a user, according to the BitBadges multi-chain follow protocol.
 *
 * @category Protocols
 */
export class FollowDetailsDoc<T extends NumberType> extends BaseNumberTypeClass<FollowDetailsDoc<T>> implements iFollowDetailsDoc<T> {
  _docId: string;
  _id?: string;
  cosmosAddress: string;
  followingCount: T;
  followersCount: T;
  followers: string[];
  following: string[];
  followingCollectionId: T;

  constructor(data: iFollowDetailsDoc<T>) {
    super();
    this.cosmosAddress = data.cosmosAddress;
    this.followingCount = data.followingCount;
    this.followersCount = data.followersCount;
    this.followers = data.followers;
    this.following = data.following;
    this.followingCollectionId = data.followingCollectionId;
    this._docId = data._docId;
    this._id = data._id;
  }

  getNumberFieldNames(): string[] {
    return ['followingCount', 'followersCount', 'followingCollectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): FollowDetailsDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as FollowDetailsDoc<U>;
  }
}

/**
 * @category Protocols
 */
export class ProtocolDoc extends CustomTypeClass<ProtocolDoc> implements iProtocolDoc {
  _docId: string;
  _id?: string;
  name: string;
  uri: string;
  customData: string;
  createdBy: string;
  isFrozen: boolean;

  constructor(data: iProtocolDoc) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.name = data.name;
    this.uri = data.uri;
    this.customData = data.customData;
    this.createdBy = data.createdBy;
    this.isFrozen = data.isFrozen;
  }
}

/**
 * @category Protocols
 */
export class UserProtocolCollectionsDoc<T extends NumberType>
  extends BaseNumberTypeClass<UserProtocolCollectionsDoc<T>>
  implements iUserProtocolCollectionsDoc<T>
{
  _docId: string;
  _id?: string;
  /** The protocols set by the user */
  protocols: {
    [protocolName: string]: T;
  };

  constructor(data: iUserProtocolCollectionsDoc<T>) {
    super();
    this._docId = data._docId;
    this._id = data._id;
    this.protocols = data.protocols;
  }

  getNumberFieldNames(): string[] {
    return ['protocols'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserProtocolCollectionsDoc<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserProtocolCollectionsDoc<U>;
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
