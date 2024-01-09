import {
  AddressList, AmountTrackerIdDetails, BadgeMetadataTimeline, Balance, CollectionApproval, CollectionMetadataTimeline, CollectionPermissions, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, MerkleChallenge, OffChainBalancesMetadataTimeline,
  Protocol,
  StandardsTimeline,
  UintRange,
  UserBalanceStore,
  convertBadgeMetadataTimeline, convertBalance, convertCollectionApproval, convertCollectionMetadataTimeline, convertCollectionPermissions, convertCustomDataTimeline, convertIsArchivedTimeline, convertManagerTimeline, convertMerkleChallenge, convertOffChainBalancesMetadataTimeline, convertStandardsTimeline, convertUintRange, convertUserBalanceStore,
  convertUserIncomingApproval, convertUserOutgoingApproval
} from "bitbadgesjs-proto";
import { ChallengeParams, convertChallengeParams } from "blockin";
import MerkleTree from "merkletreejs";
import { Options as MerkleTreeJsOptions } from "merkletreejs/dist/MerkleTree";
import mongoose from "mongoose";
import { BatchBadgeDetails } from "src/batch-utils";
import { CosmosCoin, convertCosmosCoin } from "./coin";
import { UserPermissionsWithDetails, convertUserPermissionsWithDetails } from "./collections";
import { DocsCache } from "./indexer";
import { Metadata, convertMetadata } from "./metadata";
import { JSPrimitiveNumberType, NumberType } from "./string-numbers";
import { OffChainBalancesMap, convertOffChainBalancesMap } from "./transfers";
import { SupportedChain } from "./types";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails, convertUserIncomingApprovalWithDetails, convertUserOutgoingApprovalWithDetails } from "./users";
import { deepCopy } from "./utils";

export interface Doc {
  //A unique stringified document ID
  _docId: string,

  //A uniuqe document ID (Mongo DB ObjectID compatible)
  _id?: string
}


/**
 * CollectionInfoBase is the type of document stored in the collections database (see documentation for more info)
 *
 * @category API / Indexer
 * @typedef {Object} CollectionInfoBase
 * @property {NumberType} collectionId - The collection ID
 * @property {CollectionMetadataTimeline[]} collectionMetadataTimeline - The collection metadata timeline
 * @property {BadgeMetadataTimeline[]} badgeMetadataTimeline - The badge metadata timeline
 * @property {string} balancesType - The type of balances (i.e. "Standard", "Off-Chain - Indexed", "Inherited, "Off-Chain - Non-Indexed")
 * @property {OffChainBalancesMetadataTimeline[]} offChainBalancesMetadataTimeline - The off-chain balances metadata timeline
 * @property {CustomDataTimeline[]} customDataTimeline - The custom data timeline
 * @property {ManagerTimeline[]} managerTimeline - The manager timeline
 * @property {CollectionPermissions} collectionPermissions - The collection permissions
 * @property {CollectionApproval[]} collectionApprovals - The collection approved transfers timeline
 * @property {StandardsTimeline[]} standardsTimeline - The standards timeline
 * @property {IsArchivedTimeline[]} isArchivedTimeline - The is archived timeline
 * @property {UserBalanceStore} defaultBalances - The default balances for users who have not interacted with the collection yet. Only used if collection has "Standard" balance type.
 * @property {string} createdBy - The cosmos address of the user who created this collection
 * @property {NumberType} createdBlock - The block number when this collection was created
 * @property {NumberType} createdTimestamp - The timestamp when this collection was created (milliseconds since epoch)
 * @property {Object[]} updateHistory - The update history of this collection
 * @property {string} aliasAddress - The alias cosmos address for the collection
 */
export interface CollectionInfoBase<T extends NumberType> {
  collectionId: T;
  collectionMetadataTimeline: CollectionMetadataTimeline<T>[];
  badgeMetadataTimeline: BadgeMetadataTimeline<T>[];
  balancesType: "Standard" | "Off-Chain - Indexed" | "Inherited" | "Off-Chain - Non-Indexed";
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
  updateHistory: {
    txHash: string;
    block: T;
    blockTimestamp: T;
  }[];
  aliasAddress: string;
}
/**
 * @category API / Indexer
 */
export type CollectionDoc<T extends NumberType> = CollectionInfoBase<T> & Doc;

/**
 * @category API / Indexer
 */
export function convertCollectionDoc<T extends NumberType, U extends NumberType>(item: CollectionDoc<T>, convertFunction: (item: T) => U): CollectionDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    collectionMetadataTimeline: item.collectionMetadataTimeline.map((collectionMetadataTimeline) => convertCollectionMetadataTimeline(collectionMetadataTimeline, convertFunction)),
    badgeMetadataTimeline: item.badgeMetadataTimeline.map((badgeMetadataTimeline) => convertBadgeMetadataTimeline(badgeMetadataTimeline, convertFunction)),
    offChainBalancesMetadataTimeline: item.offChainBalancesMetadataTimeline.map((offChainBalancesMetadataTimeline) => convertOffChainBalancesMetadataTimeline(offChainBalancesMetadataTimeline, convertFunction)),
    // inheritedCollectionId: convertFunction(item.inheritedCollectionId),
    customDataTimeline: item.customDataTimeline.map((customDataTimeline) => convertCustomDataTimeline(customDataTimeline, convertFunction)),
    managerTimeline: item.managerTimeline.map((managerTimeline) => convertManagerTimeline(managerTimeline, convertFunction)),
    collectionPermissions: convertCollectionPermissions(item.collectionPermissions, convertFunction),
    collectionApprovals: item.collectionApprovals.map((collectionApprovals) => convertCollectionApproval(collectionApprovals, convertFunction)),
    standardsTimeline: item.standardsTimeline.map((standardsTimeline) => convertStandardsTimeline(standardsTimeline, convertFunction)),
    isArchivedTimeline: item.isArchivedTimeline.map((isArchivedTimeline) => convertIsArchivedTimeline(isArchivedTimeline, convertFunction)),

    defaultBalances: convertUserBalanceStore(item.defaultBalances, convertFunction),
    createdBlock: convertFunction(item.createdBlock),
    createdTimestamp: convertFunction(item.createdTimestamp),
    updateHistory: item.updateHistory.map((updateHistory) => ({
      txHash: updateHistory.txHash,
      block: convertFunction(updateHistory.block),
      blockTimestamp: convertFunction(updateHistory.blockTimestamp),
    })),
  })
}

/**
 * AccountInfoBase represents the account details stored on the blockchain for an address.
 * Everything in here should be deterministic and maintained by the blockchain (as opposed to profile).
 * We update this only upon new TXs that update the fields such as a name change or sequence change.
 *
 * @category API / Indexer
 * @typedef {Object} AccountInfoBase
 * @property {string} publicKey - The public key of the account
 * @property {NumberType} accountNumber - The account number of the account
 * @property {SupportedChain} chain - The chain of the account
 * @property {string} cosmosAddress - The Cosmos address of the account
 * @property {string} ethAddress - The Eth address of the account
 * @property {string} solAddress - The Solana address of the account
 * @property {string} btcAddress - The Bitcoin address of the account
 *
 * @property {NumberType} sequence - The sequence of the account. Note we currently do not store sequence in the DB (it is dynamically fetched).
 * @property {string} [username] - The username of the account
 * @property {CosmosCoin} [balance] - The balance of the account ($BADGE gas token balance not a specific badge)
 *
 */
export interface AccountInfoBase<T extends NumberType> {
  //stored in DB and cached for fast access and permanence

  publicKey: string
  chain: SupportedChain
  cosmosAddress: string
  ethAddress: string
  solAddress: string
  btcAddress: string
  accountNumber: T

  //dynamically fetched

  sequence?: T
  balance?: CosmosCoin<T>
}
/**
 * @category API / Indexer
 */
export type AccountDoc<T extends NumberType> = AccountInfoBase<T> & Doc;

/**
 * @category API / Indexer
 */
export function convertAccountDoc<T extends NumberType, U extends NumberType>(item: AccountDoc<T>, convertFunction: (item: T) => U): AccountDoc<U> {
  return deepCopy({
    ...item,
    accountNumber: convertFunction(item.accountNumber),
    sequence: item.sequence ? convertFunction(item.sequence) : undefined,
    balance: item.balance ? convertCosmosCoin(item.balance, convertFunction) : undefined
  })
}


/**
 * CustomLinks are custom links that can be added to a profile.
 *
 * @category API / Indexer
 */
export interface CustomLink {
  title: string,
  url: string,
  image: string,
}

/**
 * CustomPage is a custom page that can be added to a profile.
 * Custom pages allow you to group, sort, and display badges in a custom way.
 */
export interface CustomPage<T extends NumberType> {
  title: string,
  description: string,
  items: BatchBadgeDetails<T>[]
}

export type AddressListId = string;
/**
 * CustomListPage is a custom list page that can be added to a profile. The items are valid list IDs.
 */
export interface CustomListPage {
  title: string,
  description: string,
  items: AddressListId[],
}


/**
 * ProfileInfoBase is the type of document stored in the profile database.
 * This is used for customizable profile info (not stored on the blockchain).
 *
 * @category API / Indexer
 * @typedef {Object} ProfileInfoBase
 * @property {boolean} fetchedProfile - Whether we have already fetched the profile or not
 *
 * @property {NumberType} seenActivity - The timestamp of the last activity seen for this account (milliseconds since epoch)
 * @property {NumberType} createdAt - The timestamp of when this account was created (milliseconds since epoch)
 *
 * @property {string} discord - The Discord username of the account
 * @property {string} twitter - The Twitter username of the account
 * @property {string} github - The GitHub username of the account
 * @property {string} telegram - The Telegram username of the account
 * @property {string} readme - The readme of the account
 *
 * @property {string} profilePicUrl - The profile picture URL of the account
 * @property {string} username - The username of the account
 *
 * @property {SupportedChain} latestSignedInChain - The latest chain the user signed in with
 *
 * @property {Object[]} hiddenBadges - The hidden badges of the account
 * @property {CustomLink[]} customLinks - The custom links of the account
 * @property {CustomPage[]} customPages - The custom badge pages of the account's portfolio
 *
 * @property {CustomListPage[]} customListPages - The custom list pages of the account's portfolio
 * @property {CustomPage[]} watchedBadgePages - The watched badge pages of the account's portfolio
 * @property {CustomListPage[]} watchedListPages - The watched list pages of the account's portfolio
 *
 * @property {string} solAddress - The Solana address of the profile, if applicable (bc we need it to convert)
 *
 * @remarks
 * Other information like resolvedName, avatar, balance, etc are to be loaded dynamically each time the account is fetched
 *
 * @see
 * See UserInfo
 */
export interface ProfileInfoBase<T extends NumberType> {
  fetchedProfile?: boolean

  seenActivity?: T;
  createdAt?: T;

  //ProfileDoc customization
  discord?: string
  twitter?: string
  github?: string
  telegram?: string
  readme?: string

  customLinks?: CustomLink[]

  hiddenBadges?: BatchBadgeDetails<T>[],
  hiddenLists?: string[];

  customPages?: {
    badges: CustomPage<T>[],
    lists: CustomListPage[],
  }

  watchlists?: {
    badges: CustomPage<T>[],
    lists: CustomListPage[],
  }

  profilePicUrl?: string
  username?: string

  latestSignedInChain?: SupportedChain
  solAddress?: string
}


/**
 * @category API / Indexer
 */
export type ProfileDoc<T extends NumberType> = ProfileInfoBase<T> & Doc


/**
 * @category API / Indexer
 */
export function convertProfileDoc<T extends NumberType, U extends NumberType>(item: ProfileDoc<T>, convertFunction: (item: T) => U): ProfileDoc<U> {
  return deepCopy({
    ...item,
    seenActivity: item.seenActivity ? convertFunction(item.seenActivity) : undefined,
    createdAt: item.createdAt ? convertFunction(item.createdAt) : undefined,
    hiddenBadges: item.hiddenBadges ? item.hiddenBadges.map((hiddenBadge) => ({
      collectionId: convertFunction(hiddenBadge.collectionId),
      badgeIds: hiddenBadge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
    })) : undefined,
    customPages: item.customPages ? {
      badges: item.customPages.badges.map((customPage) => ({
        title: customPage.title,
        description: customPage.description,
        items: customPage.items.map((badge) => ({
          collectionId: convertFunction(badge.collectionId),
          badgeIds: badge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
        })),
      })),
      lists: item.customPages.lists.map((customPage) => ({
        title: customPage.title,
        description: customPage.description,
        items: customPage.items,
      })),
    } : undefined,
    watchlists: item.watchlists ? {
      badges: item.watchlists.badges.map((customPage) => ({
        title: customPage.title,
        description: customPage.description,
        items: customPage.items.map((badge) => ({
          collectionId: convertFunction(badge.collectionId),
          badgeIds: badge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
        })),
      })),
      lists: item.watchlists.lists.map((customPage) => ({
        title: customPage.title,
        description: customPage.description,
        items: customPage.items,
      })),
    } : undefined,
  })
}


/** STATUS TYPES **/
export interface IndexerStatus {
  status: StatusDoc<bigint>
}

/**
 * QueueInfoBase represents an item in the queue
 *
 * @category API / Indexer
 * @typedef {Object} QueueInfoBase
 * @property {string} uri - The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds
 * @property {NumberType} collectionId - The collection ID of the metadata to be fetched
 * @property {NumberType} loadBalanceId - The load balance ID of the metadata to be fetched. Only the node with the same load balance ID will fetch this metadata
 * @property {NumberType} refreshRequestTime - The timestamp of when this metadata was requested to be refreshed (milliseconds since epoch)
 * @property {NumberType} numRetries - The number of times this metadata has been tried to be fetched but failed
 * @property {NumberType} [lastFetchedAt] - The timestamp of when this metadata was last fetched (milliseconds since epoch)
 * @property {string} [error] - The error message if this metadata failed to be fetched
 * @property {NumberType} [deletedAt] - The timestamp of when this document was deleted (milliseconds since epoch)
 * @property {NumberType} [nextFetchTime] - The timestamp of when this document should be fetched next (milliseconds since epoch)
 */
export interface QueueInfoBase<T extends NumberType> {
  uri: string,
  collectionId: T,
  loadBalanceId: T
  refreshRequestTime: T
  numRetries: T
  lastFetchedAt?: T
  error?: string
  deletedAt?: T
  nextFetchTime?: T
};
/**
 * @category API / Indexer
 */
export type QueueDoc<T extends NumberType> = QueueInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertQueueDoc<T extends NumberType, U extends NumberType>(item: QueueDoc<T>, convertFunction: (item: T) => U): QueueDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    loadBalanceId: convertFunction(item.loadBalanceId),
    refreshRequestTime: convertFunction(item.refreshRequestTime),
    numRetries: convertFunction(item.numRetries),
    lastFetchedAt: item.lastFetchedAt ? convertFunction(item.lastFetchedAt) : undefined,
    deletedAt: item.deletedAt ? convertFunction(item.deletedAt) : undefined,
    nextFetchTime: item.nextFetchTime ? convertFunction(item.nextFetchTime) : undefined,
  })
}

/**
 * LatestBlockStatus represents the latest block status
 *
 * @category API / Indexer
 * @typedef {Object} LatestBlockStatus
 * @property {NumberType} height - The height of the latest block
 * @property {NumberType} txIndex - The transaction index of the latest block
 * @property {NumberType} timestamp - The timestamp of the latest block (milliseconds since epoch)
 */
export interface LatestBlockStatus<T extends NumberType> {
  height: T
  txIndex: T
  timestamp: T
}

/**
 * @category API / Indexer
 */
export function convertLatestBlockStatus<T extends NumberType, U extends NumberType>(item: LatestBlockStatus<T>, convertFunction: (item: T) => U): LatestBlockStatus<U> {
  return deepCopy({
    ...item,
    height: convertFunction(item.height),
    txIndex: convertFunction(item.txIndex),
    timestamp: convertFunction(item.timestamp),
  })
}

/**
 * StatusDoc represents the status document stored in the database
 *
 * @category API / Indexer
 * @typedef {Object} StatusDoc
 * @property {LatestBlockStatus} block - The latest synced block status (i.e. height, txIndex, timestamp)
 * @property {NumberType} nextCollectionId - The next collection ID to be used
 * @property {NumberType} gasPrice - The current gas price based on the average of the lastXGasPrices
 * @property {(NumberType)[]} lastXGasPrices - The last X gas prices
 * @property {(NumberType)[]} lastXGasLimits - The last X gas limits
 */
export interface StatusInfoBase<T extends NumberType> {
  block: LatestBlockStatus<T>
  nextCollectionId: T;
  gasPrice: number;
  lastXGasLimits: T[];
  lastXGasAmounts: T[];
}

/**
 * @category API / Indexer
 */
export type StatusDoc<T extends NumberType> = StatusInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertStatusDoc<T extends NumberType, U extends NumberType>(item: StatusDoc<T>, convertFunction: (item: T) => U): StatusDoc<U> {
  return deepCopy({
    ...item,
    block: convertLatestBlockStatus(item.block, convertFunction),
    nextCollectionId: convertFunction(item.nextCollectionId),
    lastXGasLimits: item.lastXGasLimits.map((gasLimit) => convertFunction(gasLimit)),
    lastXGasAmounts: item.lastXGasAmounts.map((gasAmount) => convertFunction(gasAmount)),
  })
}


/**
 * An edit key is a feature for off-chain address lists that allows users to create a key that can be used to edit the address list.
 * For example, surveys can be created that allow users to edit their address list.
 *
 * Each use can add one address to the list.
 *
 * @param {string} key - The key that can be used to edit the address list
 * @param {NumberType} expirationDate - The expiration date of the key (milliseconds since epoch)
 * @param {boolean} [mustSignIn] - True if the user can only add their signed in address to the list
 *
 * @category API / Indexer
 */
export interface AddressListEditKey<T extends NumberType> {
  key: string;
  expirationDate: T
  mustSignIn?: boolean
}

/**
 * @category API / Indexer
 */
export interface AddressListEditKeyDoc<T extends NumberType> extends AddressListEditKey<T> {
  _docId: string;
  _rev?: undefined;
  _deleted?: undefined;
}

/**
 * @category API / Indexer
 */
export function convertAddressListEditKey<T extends NumberType, U extends NumberType>(item: AddressListEditKey<T>, convertFunction: (item: T) => U): AddressListEditKey<U> {
  return deepCopy({
    ...item,
    expirationDate: convertFunction(item.expirationDate),
  })
}


/**
 * AddressList is the type of document stored in the address lists database.
 *
 * Docs are stored by list IDs. Note that reserved lists should be obtained from getReservedAddressList.
 *
 * @category API / Indexer
 * @typedef {Object} AddressList
 *
 * @property {string} createdBy - The cosmos address of the user who created this list
 * @property {Object[]} updateHistory - The update history of this list
 * @property {NumberType} createdBlock - The block number when this list was created
 * @property {NumberType} lastUpdated - The timestamp of when this list was last updated (milliseconds since epoch)
 * @property {Object} [nsfw] - The NSFW reason if this list is NSFW
 * @property {Object} [reported] - The reported reason if this list is reported
 * @property {boolean} private - True if this list is private and will not show up in search results
 * @property {AddressListEditKey[]} [editKeys] - The edit keys of this list
 */
export interface AddressListInfoBase<T extends NumberType> extends AddressList {
  createdBy: string
  updateHistory: {
    txHash: string;
    block: T;
    blockTimestamp: T;
  }[];
  createdBlock: T;
  lastUpdated: T

  private?: boolean
  editKeys?: AddressListEditKey<T>[];

  nsfw?: { reason: string };
  reported?: { reason: string };
}


/**
 * @category API / Indexer
 */
export function convertAddressListInfoBase<T extends NumberType, U extends NumberType>(item: AddressListInfoBase<T>, convertFunction: (item: T) => U): AddressListInfoBase<U> {
  return deepCopy({
    ...item,
    updateHistory: item.updateHistory.map((updateHistory) => ({
      txHash: updateHistory.txHash,
      block: convertFunction(updateHistory.block),
      blockTimestamp: convertFunction(updateHistory.blockTimestamp),
    })),
    createdBlock: convertFunction(item.createdBlock),
    lastUpdated: convertFunction(item.lastUpdated),
    editKeys: item.editKeys ? item.editKeys.map((editKey) => convertAddressListEditKey(editKey, convertFunction)) : undefined,
  })
}


/**
 * @category API / Indexer
 */
export type AddressListDoc<T extends NumberType> = AddressListInfoBase<T> & Doc
/**
 * @category API / Indexer
 */
export function convertAddressListDoc<T extends NumberType, U extends NumberType>(item: AddressListDoc<T>, convertFunction: (item: T) => U): AddressListDoc<U> {
  return deepCopy({
    ...item,
    updateHistory: item.updateHistory.map((updateHistory) => ({
      ...updateHistory,
      block: convertFunction(updateHistory.block),
      blockTimestamp: convertFunction(updateHistory.blockTimestamp),
    })),
    createdBlock: convertFunction(item.createdBlock),
    lastUpdated: convertFunction(item.lastUpdated),
    editKeys: item.editKeys ? item.editKeys.map((editKey) => convertAddressListEditKey(editKey, convertFunction)) : undefined,
  })
}

/**
 * BalanceInfoBase is the type of document stored in the balances database
 * Partitioned database by cosmosAddress (e.g. 1-cosmosx..., 1-cosmosy..., and so on represent the balances documents for collection 1 and user with cosmos address x and y respectively)
 *
 * @category API / Indexer
 * @typedef {Object} BalanceInfoBase
 * @extends {UserBalance}
 *
 * @property {NumberType} collectionId - The collection ID
 * @property {string} cosmosAddress - The Cosmos address of the user
 *
 * @property {boolean} onChain - True if the balances are on-chain
 * @property {string} [uri] - The URI of the off-chain balances.
 * @property {NumberType} [fetchedAt] - The timestamp of when the off-chain balances were fetched (milliseconds since epoch). For BitBadges indexer, we only populate this for Mint and Total docs.
 * @property {NumberType} [fetchedAtBlock] - The block number of when the off-chain balances were fetched. For BitBadges indexer, we only populate this for Mint and Total docs.
 * @property {boolean} [isPermanent] - True if the off-chain balances are using permanent storage
 * @property {string} [contentHash] - The content hash of the off-chain balances
 *
 * @property {Object[]} updateHistory - The update history of this balance
 */
export interface BalanceInfoBase<T extends NumberType> extends UserBalanceStore<T> {

  collectionId: T;
  cosmosAddress: string;
  onChain: boolean;

  //used if off-chain balances
  uri?: string,
  fetchedAt?: T, //Date.now()
  fetchedAtBlock?: T,
  contentHash?: string,
  isPermanent?: boolean

  updateHistory: {
    txHash: string;
    block: T;
    blockTimestamp: T;
  }[];
}
/**
 * @category API / Indexer
 */
export type BalanceDoc<T extends NumberType> = BalanceInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertBalanceDoc<T extends NumberType, U extends NumberType>(item: BalanceDoc<T>, convertFunction: (item: T) => U): BalanceDoc<U> {
  return deepCopy({
    ...item,
    ...convertUserBalanceStore(item, convertFunction),
    incomingApprovals: item.incomingApprovals.map(x => convertUserIncomingApproval(x, convertFunction)),
    outgoingApprovals: item.outgoingApprovals.map(x => convertUserOutgoingApproval(x, convertFunction)),
    collectionId: convertFunction(item.collectionId),
    fetchedAt: item.fetchedAt ? convertFunction(item.fetchedAt) : undefined,
    fetchedAtBlock: item.fetchedAtBlock ? convertFunction(item.fetchedAtBlock) : undefined,
    updateHistory: item.updateHistory.map((updateHistory) => ({
      txHash: updateHistory.txHash,
      block: convertFunction(updateHistory.block),
      blockTimestamp: convertFunction(updateHistory.blockTimestamp),
    })),
  })
}

/**
 * @category API / Indexer
 *
 * @typedef {Object} BalanceDocWithDetails
 * @extends {BalanceInfo}
 *
 * @property {UserOutgoingApprovalWithDetails[]} outgoingApprovals - The outgoing approvals with details like metadata and address lists
 * @property {UserIncomingApprovalWithDetails[]} incomingApprovals - The incoming approvals with details like metadata and address lists
 * @property {UserPermissionsWithDetails} userPermissions - The user permissions with details like metadata and address lists
 */
export interface BalanceDocWithDetails<T extends NumberType> extends BalanceDoc<T> {
  outgoingApprovals: UserOutgoingApprovalWithDetails<T>[];
  incomingApprovals: UserIncomingApprovalWithDetails<T>[];
  userPermissions: UserPermissionsWithDetails<T>;
}

/**
 * @category API / Indexer
 */
export function convertBalanceDocWithDetails<T extends NumberType, U extends NumberType>(item: BalanceDocWithDetails<T>, convertFunction: (item: T) => U): BalanceDocWithDetails<U> {
  return deepCopy({
    ...convertBalanceDoc(item, convertFunction),
    incomingApprovals: item.incomingApprovals.map(x => convertUserIncomingApprovalWithDetails(x, convertFunction)),
    outgoingApprovals: item.outgoingApprovals.map(x => convertUserOutgoingApprovalWithDetails(x, convertFunction)),
    userPermissions: convertUserPermissionsWithDetails(item.userPermissions, convertFunction),
  })
}


/**
 * PasswordInfoBase represents a document for a password or code-based claim.
 *
 * @category API / Indexer
 * @typedef {Object} PasswordInfoBase
 *
 * @property {{[cosmosAddress: string]: NumberType}} claimedUsers - The list of users that have claimed this password
 * @property {string} cid - The CID of the password document
 * @property {boolean} docClaimedByCollection - True if the password document is claimed by the collection
 * @property {NumberType} collectionId - The collection ID of the password document
 * @property {string} createdBy - The cosmos address of the user who created this password
 * @property {ChallengeDetails} [challengeDetails] - The challenge details of the password
 */
export interface PasswordInfoBase<T extends NumberType> {
  cid: string
  createdBy: string
  docClaimedByCollection: boolean
  collectionId: T

  claimedUsers: {
    [cosmosAddress: string]: T
  }

  challengeDetails?: ChallengeDetails<T>;
}
/**
 * @category API / Indexer
 */
export type PasswordDoc<T extends NumberType> = PasswordInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertPasswordDoc<T extends NumberType, U extends NumberType>(item: PasswordDoc<T>, convertFunction: (item: T) => U): PasswordDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    challengeDetails: item.challengeDetails ? convertChallengeDetails(item.challengeDetails, convertFunction) : undefined,
    claimedUsers: Object.fromEntries(Object.entries(item.claimedUsers).map(([key, value]) => [key, convertFunction(value)])),
  })
}

/**
 * ClaimAlertInfoBase represents a document for a claim alert.
 * This is used to alert users of a claim that has been made for them.
 *
 * @category API / Indexer
 *
 *@typedef {Object} ClaimAlertInfoBase
 *
 * @property {string} code - The code of the claim alert
 * @property {string[]} cosmosAddresses - The cosmos addresses of the users that have been alerted
 * @property {NumberType} collectionId - The collection ID of the claim alert
 * @property {NumberType} createdTimestamp - The timestamp of when this claim alert was created (milliseconds since epoch)
 * @property {string} [message] - The message of the claim alert
 */
export interface ClaimAlertInfoBase<T extends NumberType> {
  code?: string;
  cosmosAddresses: string[];
  collectionId: T;
  createdTimestamp: T;
  message?: string;
}

/**
 * @category API / Indexer
 */
export type ClaimAlertDoc<T extends NumberType> = ClaimAlertInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertClaimAlertDoc<T extends NumberType, U extends NumberType>(item: ClaimAlertDoc<T>, convertFunction: (item: T) => U): ClaimAlertDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    createdTimestamp: convertFunction(item.createdTimestamp),
  })
}


/**
 * LeavesDetails represents details about the leaves of a claims tree.
 * This is used as helpers for storing leaves and for UI purposes.
 *
 * This is used to check if an entered claim value is valid. If the leaves are hashed, then the value entered by the user will be hashed before being checked against the provided leaf values.
 * If the leaves are not hashed, then the value entered by the user will be checked directly against the provided leaf values.
 *
 * IMPORTANT: The leaf values here are to be publicly stored on IPFS, so they should not contain any sensitive information (i.e. codes, passwords, etc.)
 * Only use this with the non-hashed option when the values do not contain any sensitive information (i.e. a public allowlist of addresses).
 *
 * @example Codes
 * 1. Generate N codes privately
 * 2. Hash each code
 * 3. Store the hashed codes publicly on IPFS via this struct
 * 4. When a user enters a code, we hash it and check if it matches any of the hashed codes. This way, the codes are never stored publicly on IPFS and only known by the generator of the codes.
 *
 * @example Allowlist
 * For storing a public allowlist of addresses (with useCreatorAddressAsLeaf = true), hashing complicates everything because the allowlist can be stored publicly.
 * 1. Generate N allowlist addresses
 * 2. Store the addresses publicly on IPFS via this struct
 * 3. When a user enters an address, we check if it matches any of the addresses.
 *
 *
 * @category API / Indexer
 * @typedef {Object} LeavesDetails
 *
 * @property {string[]} leaves - The values of the leaves
 * @property {boolean} isHashed - True if the leaves are hashed
 * @property {string[]} preimages - The preimages of the leaves (only used if isHashed = true). Oftentimes, this is used for secret codes so shoul dnot be present when user-facing.
 */
export interface LeavesDetails {
  leaves: string[]
  isHashed: boolean

  preimages?: string[];
}

/**
 * ChallengeDetails represents a challenge for a claim with additional specified details.
 * The base Challenge is what is stored on-chain, but this is the full challenge with additional details.
 *
 * @category API / Indexer
 * @typedef {Object} ChallengeDetails
 * @extends {Challenge}
 *
 * @property {LeavesDetails} leavesDetails - The leaves of the Merkle tree with accompanying details
 * @property {MerkleTree} tree - The Merkle tree
 * @property {MerkleTreeJsOptions} treeOptions - The Merkle tree options for how to build it
 * @property {NumberType} numLeaves - The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select)
 *
 * @property {NumberType} currCode - The current code being used for the challenge. Used behind the scenes
 * @property {boolean} hasPassword - True if the challenge has a password
 * @property {string} password - The password of the challenge. Used behind the scenes
 */
export interface ChallengeDetails<T extends NumberType> {
  leavesDetails: LeavesDetails
  tree?: MerkleTree
  treeOptions?: MerkleTreeJsOptions

  numLeaves?: T;
  currCode?: T;

  hasPassword?: boolean
  password?: string
}

/**
 * @category API / Indexer
 */
export function convertChallengeDetails<T extends NumberType, U extends NumberType>(item: ChallengeDetails<T>, convertFunction: (item: T) => U): ChallengeDetails<U> {
  return deepCopy({
    ...item,
    numLeaves: item.numLeaves ? convertFunction(item.numLeaves) : undefined,
    currCode: item.currCode !== undefined && BigInt(item.currCode ?? -1n) >= 0 ? convertFunction(item.currCode) : undefined,
  })
}

/**
 * ApprovalTrackerInfoBase is the type of document stored in the approvals tracker database
 *
 * @category API / Indexer
 * @typedef {Object} ApprovalTrackerInfoBase
 * @property {NumberType} numTransfers - The number of transfers. Is an incrementing tally.
 * @property {Balance[]} amounts - A tally of the amounts transferred for this approval.
 */
export interface ApprovalTrackerInfoBase<T extends NumberType> extends AmountTrackerIdDetails<T> {
  numTransfers: T;
  amounts: Balance<T>[];
}

/**
 * @category API / Indexer
 */
export type ApprovalTrackerDoc<T extends NumberType> = ApprovalTrackerInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertApprovalTrackerDoc<T extends NumberType, U extends NumberType>(item: ApprovalTrackerDoc<T>, convertFunction: (item: T) => U): ApprovalTrackerDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    numTransfers: convertFunction(item.numTransfers),
    amounts: item.amounts.map((amount) => convertBalance(amount, convertFunction)),
  })
}

/**
 * ChallengeTrackerIdDetails holds the fields used to identify a specific merkle challenge tracker
 *
 * @category API / Indexer
 * @typedef {Object} ChallengeTrackerIdDetails
 * @property {NumberType} collectionId - The collection ID
 * @property {string} challengeId - The challenge ID
 * @property {string} challengeLevel - The challenge level (i.e. "collection", "incoming", "outgoing")
 * @property {string} approverAddress - The approver address (leave blank if challengeLevel = "collection")
 */
export interface ChallengeTrackerIdDetails<T extends NumberType> {
  collectionId: T;
  challengeId: string;
  challengeLevel: "collection" | "incoming" | "outgoing" | "";
  approverAddress: string; //Leave blank if challengeLevel = "collection"
}

/**
 * @category API / Indexer
 */
export function convertChallengeTrackerIdDetails<T extends NumberType, U extends NumberType>(item: ChallengeTrackerIdDetails<T>, convertFunction: (item: T) => U): ChallengeTrackerIdDetails<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
  })
}

/**
 * MerkleChallengeInfoBase is the type of document stored in the claims database
 * partitioned database by collection ID (e.g. 1-1, 1-2, and so on represent the claims collection 1 for claims with ID 1, 2, etc)
 *
 * @category API / Indexer
 * @typedef {Object} MerkleChallengeInfoBase
 *
 * @property {NumberType} collectionId - The collection ID
 * @property {string} challengeId - The challenge ID
 * @property {string} challengeLevel - The challenge level (i.e. "collection", "incoming", "outgoing")
 * @property {string} approverAddress - The approver address (leave blank if challengeLevel = "collection")
 * @property {(number)[]} usedLeafIndices - The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree
 */
export interface MerkleChallengeInfoBase<T extends NumberType> {
  collectionId: T;
  challengeId: string;
  challengeLevel: "collection" | "incoming" | "outgoing" | "";
  approverAddress: string; //Leave blank if challengeLevel = "collection"

  usedLeafIndices: (T)[];
}

/**
 * @category API / Indexer
 */
export type MerkleChallengeDoc<T extends NumberType> = MerkleChallengeInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertMerkleChallengeDoc<T extends NumberType, U extends NumberType>(item: MerkleChallengeDoc<T>, convertFunction: (item: T) => U): MerkleChallengeDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    usedLeafIndices: item.usedLeafIndices.map(convertFunction),
  })
}

/**
 * @category API / Indexer
 *
 * @typedef {Object} MerkleChallengeIdDetails
 *
 * @property {NumberType} collectionId - The collection ID
 * @property {string} challengeId - The challenge ID
 * @property {string} challengeLevel - The challenge level (i.e. "collection", "incoming", "outgoing")
 * @property {string} approverAddress - The approver address (leave blank if challengeLevel = "collection")
 */
export interface MerkleChallengeIdDetails<T extends NumberType> {
  collectionId: T;
  challengeId: string;
  challengeLevel: "collection" | "incoming" | "outgoing" | "";
  approverAddress: string; //Leave blank if challengeLevel = "collection"
}

/**
 * @category API / Indexer
 */
export function convertMerkleChallengeIdDetails<T extends NumberType, U extends NumberType>(item: MerkleChallengeIdDetails<T>, convertFunction: (item: T) => U): MerkleChallengeIdDetails<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
  })
}

/**
 * MerkleChallengeWithDetails extends claims and provides additional details.
 *
 * @category API / Indexer
 * @typedef {Object} MerkleChallengeWithDetails
 * @extends {MerkleChallengeDoc}
 *
 * @property {ApprovalInfoDetails} details - The details of the claim / approval
 */
export interface MerkleChallengeWithDetails<T extends NumberType> extends MerkleChallenge<T> {
  details?: ApprovalInfoDetails<T>
}

/**
 * @category API / Indexer
 */
export function convertMerkleChallengeWithDetails<T extends NumberType, U extends NumberType>(item: MerkleChallengeWithDetails<T>, convertFunction: (item: T) => U): MerkleChallengeWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertMerkleChallenge(item, convertFunction),
    details: item.details ? convertApprovalInfoDetails(item.details, convertFunction) : undefined,
    _rev: undefined,
  })
}


/**
 * Extends a base Claim with additional details.
 * The base Claim is what is stored on-chain, but this is the full claim with additional details stored in the indexer.
 *
 * @category API / Indexer
 * @typedef {Object} ApprovalInfoDetails
 *
 * @property {string} name - The name of the claim
 * @property {string} description - The description of the claim. This describes how to earn and claim the badge.
 * @property {boolean} hasPassword - True if the claim has a password
 * @property {string} password - The password of the claim (if it has one)
 * @property {ChallengeDetails[]} challengeDetails - The challenge details of the claim / approval
 */
export interface ApprovalInfoDetails<T extends NumberType> {
  name: string;
  description: string;
  hasPassword?: boolean;
  password?: string;

  challengeDetails: ChallengeDetails<T>;
}

/**
 * @category API / Indexer
 */
export function convertApprovalInfoDetails<T extends NumberType, U extends NumberType>(item: ApprovalInfoDetails<T>, convertFunction: (item: T) => U): ApprovalInfoDetails<U> {
  return deepCopy({
    ...item,
    challengeDetails: convertChallengeDetails(item.challengeDetails, convertFunction),
  })
}

/**
 * FetchInfoBase is the type of document stored in the fetch database
 *
 * This represents the returned JSON value from fetching a URI.
 *
 * @category API / Indexer
 * @typedef {Object} FetchInfoBase
 * @property {Metadata | ApprovalInfoDetails} content - The content of the fetch document. Note that we store balances in BALANCES_DB and not here to avoid double storage.
 * @property {NumberType} fetchedAt - The time the document was fetched
 * @property {NumberType} fetchedAtBlock - The block the document was fetched
 * @property {"ApprovalInfo" | "Metadata" | "Balances"} db - The type of content fetched. This is used for querying purposes
 * @property {boolean} isPermanent - True if the document is permanent (i.e. fetched from a permanent URI like IPFS)
 */
export interface FetchInfoBase<T extends NumberType> {
  content?: Metadata<T> | ApprovalInfoDetails<T> | OffChainBalancesMap<T>
  fetchedAt: T, //Date.now()
  fetchedAtBlock: T,
  db: 'ApprovalInfo' | 'Metadata' | 'Balances'
  isPermanent: boolean
}
/**
 * @category API / Indexer
 */
export type FetchDoc<T extends NumberType> = FetchInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertFetchDoc<T extends NumberType, U extends NumberType>(item: FetchDoc<T>, convertFunction: (item: T) => U): FetchDoc<U> {
  return deepCopy({
    ...item,
    content: item.content ? item.db === 'Metadata' ? convertMetadata(item.content as Metadata<T>, convertFunction) : item.db === 'ApprovalInfo' ? convertApprovalInfoDetails(item.content as ApprovalInfoDetails<T>, convertFunction) : convertOffChainBalancesMap(item.content as OffChainBalancesMap<T>, convertFunction) : undefined,
    fetchedAt: convertFunction(item.fetchedAt),
    fetchedAtBlock: convertFunction(item.fetchedAtBlock),
  })
}

/**
 * @category API / Indexer
 *
 * @typedef {Object} RefreshInfoBase
 * @property {NumberType} collectionId - The collection ID
 * @property {NumberType} refreshRequestTime - The time the refresh was requested (Unix timestamp in milliseconds)
 */
export interface RefreshInfoBase<T extends NumberType> {
  collectionId: T
  refreshRequestTime: T
}
/**
 * @category API / Indexer
 */
export type RefreshDoc<T extends NumberType> = RefreshInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertRefreshDoc<T extends NumberType, U extends NumberType>(item: RefreshDoc<T>, convertFunction: (item: T) => U): RefreshDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    refreshRequestTime: convertFunction(item.refreshRequestTime),
  })
}

/**
 * @category API / Indexer
 */
export interface ErrorDoc {
  _docId: string,
  _id?: string,
  error: string,
  function: string,
  docs?: DocsCache
}

/**
 * @category API / Indexer
 *
 * @typedef {Object} AirdropInfoBase
 * @property {boolean} airdropped - True if the airdrop has been completed
 * @property {NumberType} timestamp - The timestamp of when the airdrop was completed (milliseconds since epoch)
 * @property {string} [hash] - The hash of the airdrop transaction
 */
export interface AirdropInfoBase<T extends NumberType> {
  airdropped: boolean
  timestamp: T
  hash?: string
}
/**
 * @category API / Indexer
 */
export type AirdropDoc<T extends NumberType> = AirdropInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertAirdropDoc<T extends NumberType, U extends NumberType>(item: AirdropDoc<T>, convertFunction: (item: T) => U): AirdropDoc<U> {
  return deepCopy({
    ...item,
    timestamp: convertFunction(item.timestamp),
  })
}

/**
 * @category API / Indexer
 *
 * @typedef {Object} IPFSTotalsInfoBase
 * @property {NumberType} bytesUploaded - The total bytes uploaded
 */
export interface IPFSTotalsInfoBase<T extends NumberType> {
  bytesUploaded: T
}
/**
 * @category API / Indexer
 */
export type IPFSTotalsDoc<T extends NumberType> = IPFSTotalsInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertIPFSTotalsDoc<T extends NumberType, U extends NumberType>(item: IPFSTotalsDoc<T>, convertFunction: (item: T) => U): IPFSTotalsDoc<U> {
  return deepCopy({
    ...item,
    bytesUploaded: convertFunction(item.bytesUploaded),
  })
}

/**
 * @category API / Indexer
 *
 * @typedef {Object} ComplianceInfoBase
 * @property {Object} badges - The badges that are NSFW or reported
 * @property {Object} addressLists - The address lists that are NSFW or reported
 * @property {Object} accounts - The accounts that are NSFW or reported
 *
 */
export interface ComplianceInfoBase<T extends NumberType> {
  badges: {
    nsfw: { collectionId: T; badgeIds: UintRange<T>[], reason: string }[];
    reported: { collectionId: T; badgeIds: UintRange<T>[], reason: string }[];
  },
  addressLists: {
    nsfw: { listId: AddressListId; reason: string }[];
    reported: { listId: AddressListId; reason: string }[];
  },
  accounts: {
    nsfw: { cosmosAddress: string; reason: string }[];
    reported: { cosmosAddress: string; reason: string }[];
  },
}

/**
 * @category API / Indexer
 */
export type ComplianceDoc<T extends NumberType> = ComplianceInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertComplianceDoc<T extends NumberType, U extends NumberType>(item: ComplianceDoc<T>, convertFunction: (item: T) => U): ComplianceDoc<U> {
  return deepCopy({
    ...item,
    badges: {
      nsfw: item.badges.nsfw.map(x => { return { ...x, collectionId: convertFunction(x.collectionId), badgeIds: x.badgeIds.map(y => convertUintRange(y, convertFunction)) } }),
      reported: item.badges.reported.map(x => { return { ...x, collectionId: convertFunction(x.collectionId), badgeIds: x.badgeIds.map(y => convertUintRange(y, convertFunction)) } }),
    },
  })
}

/**
 * @category API / Indexer
 */
export interface BlockinAuthSignatureInfoBase<T extends NumberType> {
  signature: string;

  name: string;
  description: string;
  image: string;

  cosmosAddress: string;
  params: ChallengeParams<T>;

  createdAt: T
}

/**
 * @category API / Indexer
 */
export type BlockinAuthSignatureDoc<T extends NumberType> = BlockinAuthSignatureInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertBlockinAuthSignatureDoc<T extends NumberType, U extends NumberType>(item: BlockinAuthSignatureDoc<T>, convertFunction: (item: T) => U): BlockinAuthSignatureDoc<U> {
  return deepCopy({
    ...item,
    createdAt: convertFunction(item.createdAt),
    params: convertChallengeParams(item.params, convertFunction),
  })
}


/**
 * Follow details specify the number of followers and following for a user, according to the BitBadges multi-chain follow protocol.
 *
 * @param {string} cosmosAddress - The Cosmos address of the user
 * @param {NumberType} followingCount - The number of users that the user is following
 * @param {NumberType} followersCount - The number of users that are following the user
 * @param {NumberType} followingCollectionId - The collection ID of the collection for where to fetch following information
 *
 * @category API / Indexer
 */
export interface FollowDetailsInfoBase<T extends NumberType> {
  cosmosAddress: string;
  followingCount: T;
  followersCount: T;
}

/**
 * @category API / Indexer
 */
export type FollowDetailsDoc<T extends NumberType> = FollowDetailsInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertFollowDetailsDoc<T extends NumberType, U extends NumberType>(item: FollowDetailsDoc<T>, convertFunction: (item: T) => U): FollowDetailsDoc<U> {
  return deepCopy({
    ...item,
    followingCount: convertFunction(item.followingCount),
    followersCount: convertFunction(item.followersCount),
  })
}

/**
 * @category API / Indexer
 */
export interface ProtocolInfoBase<T extends NumberType> extends Protocol {
}

/**
 * @category API / Indexer
 */
export type ProtocolDoc<T extends NumberType> = ProtocolInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertProtocolDoc<T extends NumberType, U extends NumberType>(item: ProtocolDoc<T>, convertFunction: (item: T) => U): ProtocolDoc<U> {
  return deepCopy({
    ...item,
  })
}

/**
 * @category API / Indexer
 */
export interface UserProtocolCollectionsInfoBase<T extends NumberType> {
  protocols: {
    [protocolName: string]: T;
  }
}

/**
 * @category API / Indexer
 */
export type UserProtocolCollectionsDoc<T extends NumberType> = UserProtocolCollectionsInfoBase<T> & Doc

/**
 * @category API / Indexer
 */
export function convertUserProtocolCollectionsDoc<T extends NumberType, U extends NumberType>(item: UserProtocolCollectionsDoc<T>, convertFunction: (item: T) => U): UserProtocolCollectionsDoc<U> {
  return deepCopy({
    ...item,
    protocols: Object.fromEntries(Object.entries(item.protocols).map(([key, value]) => [key, convertFunction(value)])),
  })
}

const { Schema } = mongoose;

export const ProtocolSchema = new Schema<ProtocolDoc<JSPrimitiveNumberType>>({
  _docId: String,
  name: String,
  uri: String,
  customData: String,
  createdBy: String,
  isFrozen: Boolean
});

export const UserProtocolCollectionsSchema = new Schema<UserProtocolCollectionsDoc<JSPrimitiveNumberType>>({
  _docId: String,
  protocols: Schema.Types.Mixed,
});


export const CollectionSchema = new Schema<CollectionDoc<JSPrimitiveNumberType>>({
  _docId: String,
  collectionId: Schema.Types.Mixed,
  collectionMetadataTimeline: [Schema.Types.Mixed],
  badgeMetadataTimeline: [Schema.Types.Mixed],
  balancesType: String,
  offChainBalancesMetadataTimeline: [Schema.Types.Mixed],
  customDataTimeline: [Schema.Types.Mixed],
  managerTimeline: [Schema.Types.Mixed],
  collectionPermissions: Schema.Types.Mixed,
  collectionApprovals: [Schema.Types.Mixed],
  standardsTimeline: [Schema.Types.Mixed],
  isArchivedTimeline: [Schema.Types.Mixed],
  defaultBalances: Schema.Types.Mixed,
  createdBy: String, // Not set as Mixed, as you mentioned it can be a string
  createdBlock: Schema.Types.Mixed,
  createdTimestamp: Schema.Types.Mixed,
  updateHistory: [Schema.Types.Mixed],
  aliasAddress: String, // Not set as Mixed, as you mentioned it can be a string
});

export const AccountSchema = new Schema<AccountDoc<JSPrimitiveNumberType>>({
  _docId: String,
  publicKey: String, // String type for publicKey
  chain: String, // String type for chain (assuming it's a string)
  cosmosAddress: String, // String type for cosmosAddress
  ethAddress: String, // String type for ethAddress
  solAddress: String, // String type for solAddress
  btcAddress: String, // String type for btcAddress
  accountNumber: Schema.Types.Mixed, // Mixed type for accountNumber (number type)

  // Dynamically fetched fields
  sequence: Schema.Types.Mixed, // Mixed type for sequence (number type)
  balance: Schema.Types.Mixed, // Mixed type for balance (CosmosCoin type or other)

  // Add any other fields as needed
});

export const ProfileSchema = new Schema<ProfileDoc<JSPrimitiveNumberType>>({
  _docId: String,
  fetchedProfile: Boolean, // Boolean type for fetchedProfile
  seenActivity: Schema.Types.Mixed, // Mixed type for seenActivity (number type)
  createdAt: Schema.Types.Mixed, // Mixed type for createdAt (number type)
  discord: String, // String type for discord
  twitter: String, // String type for twitter
  github: String, // String type for github
  telegram: String, // String type for telegram
  readme: String, // String type for readme
  customLinks: [Schema.Types.Mixed], // Array of CustomLink
  hiddenBadges: [
    {
      collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
      badgeIds: [{ /* Define the structure of UintRange here */ }], // Array of UintRange
    },
  ],
  hiddenLists: [String], // Array of string
  customPages: [Schema.Types.Mixed], // Array of CustomPage
  watchlists: [Schema.Types.Mixed], // Array of Watchlist

  profilePicUrl: String, // String type for profilePicUrl
  username: String, // String type for username
  latestSignedInChain: String, // String type for latestSignedInChain
  solAddress: String, // String type for solAddress
});

export const QueueSchema = new Schema<QueueDoc<JSPrimitiveNumberType>>({
  _docId: String,
  uri: String, // String type for uri
  collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
  loadBalanceId: Schema.Types.Mixed, // Mixed type for loadBalanceId (number type)
  refreshRequestTime: Schema.Types.Mixed, // Mixed type for refreshRequestTime (number type)
  numRetries: Schema.Types.Mixed, // Mixed type for numRetries (number type)
  lastFetchedAt: Schema.Types.Mixed, // Mixed type for lastFetchedAt (number type)
  error: String, // String type for error
  deletedAt: Schema.Types.Mixed, // Mixed type for deletedAt (number type)
  nextFetchTime: Schema.Types.Mixed, // Mixed type for nextFetchTime (number type)
});

export const StatusSchema = new Schema<StatusDoc<JSPrimitiveNumberType>>({
  _docId: String,
  block: Schema.Types.Mixed, // Mixed type for block (number type)
  nextCollectionId: Schema.Types.Mixed, // Mixed type for nextCollectionId (number type)
  gasPrice: Number, // Number type for gasPrice
  lastXGasLimits: [Schema.Types.Mixed], // Array of Mixed type for lastXGasLimits (number type)
  lastXGasAmounts: [Schema.Types.Mixed], // Array of Mixed type for lastXGasAmounts (number type)
});

export const AddressListSchema = new Schema<AddressListDoc<JSPrimitiveNumberType>>({
  _docId: String,
  listId: String, // String type for listId
  addresses: [String], // Array of string for addresses
  allowlist: Boolean, // Boolean type for allowlist
  uri: String, // String type for uri
  customData: String, // String type for customData
  createdBy: String, // String type for createdBy
  aliasAddress: String, // String type for aliasAddress
  updateHistory: [Schema.Types.Mixed],
  createdBlock: Schema.Types.Mixed, // Mixed type for createdBlock (number type)
  lastUpdated: Schema.Types.Mixed, // Mixed type for lastUpdated (number type)
  private: Boolean, // Boolean type for private
  editKeys: [Schema.Types.Mixed], // Array of Mixed type for editKeys (AddressListEditKey type)
  nsfw: { reason: String }, // Object with string type property for nsfw
  reported: { reason: String }, // Object with string type property for reported
});

export const BalanceSchema = new Schema<BalanceDoc<JSPrimitiveNumberType>>({
  _docId: String,
  collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
  cosmosAddress: String, // String type for cosmosAddress
  balances: [Schema.Types.Mixed], // Array of Mixed type for balances (UserBalance type)
  incomingApprovals: [Schema.Types.Mixed], // Array of Mixed type for incomingApprovals (UserIncomingApproval type)
  outgoingApprovals: [Schema.Types.Mixed], // Array of Mixed type for outgoingApprovals (UserOutgoingApproval type)
  autoApproveSelfInitiatedIncomingTransfers: Boolean, // Boolean type for autoApproveSelfInitiatedIncomingTransfers
  autoApproveSelfInitiatedOutgoingTransfers: Boolean, // Boolean type for autoApproveSelfInitiatedOutgoingTransfers
  userPermissions: Schema.Types.Mixed, // Mixed type for userPermissions (UserPermissions type)
  onChain: Boolean, // Boolean type for onChain
  uri: String, // String type for uri
  fetchedAt: Schema.Types.Mixed, // Mixed type for fetchedAt (number type)
  fetchedAtBlock: Schema.Types.Mixed, // Mixed type for fetchedAtBlock (number type)
  contentHash: String, // String type for contentHash
  isPermanent: Boolean, // Boolean type for isPermanent
  updateHistory: [Schema.Types.Mixed],
});

export const PasswordSchema = new Schema<PasswordDoc<JSPrimitiveNumberType>>({
  _docId: String,
  cid: String, // String type for cid
  createdBy: String, // String type for createdBy
  docClaimedByCollection: Boolean, // Boolean type for docClaimedByCollection
  collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
  claimedUsers: Schema.Types.Mixed, // Mixed type for claimedUsers
  challengeDetails: Schema.Types.Mixed, // Mixed type for challengeDetails (ChallengeDetails type)
});

export const ClaimAlertSchema = new Schema<ClaimAlertDoc<JSPrimitiveNumberType>>({
  _docId: String,
  code: String, // String type for code
  cosmosAddresses: [String], // Array of string for cosmosAddresses
  collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
  createdTimestamp: Schema.Types.Mixed, // Mixed type for createdTimestamp (number type)
  message: String, // String type for message
});

export const ChallengeSchema = new Schema<MerkleChallengeDoc<JSPrimitiveNumberType>>({
  _docId: String,
  collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
  challengeId: String, // String type for challengeId
  challengeLevel: String, // String type for challengeLevel
  approverAddress: String, // String type for approverAddress
  usedLeafIndices: [Schema.Types.Mixed], // Array of Mixed type for usedLeafIndices (number type)
});

export const ApprovalTrackerSchema = new Schema<ApprovalTrackerDoc<JSPrimitiveNumberType>>({
  _docId: String,
  collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
  numTransfers: Schema.Types.Mixed, // Mixed type for numTransfers (number type)
  amounts: [Schema.Types.Mixed], // Array of Mixed type for amounts (Balance type)
  approvalLevel: String, // String type for approvalLevel
  approverAddress: String, // String type for approverAddress
  amountTrackerId: String, // String type for amountTrackerId
  trackerType: String, // String type for trackerType
  approvedAddress: String, // String type for approvedAddress
});

export const FetchSchema = new Schema<FetchDoc<JSPrimitiveNumberType>>({
  _docId: String,
  content: Schema.Types.Mixed, // Mixed type for content
  fetchedAt: Schema.Types.Mixed, // Mixed type for fetchedAt (number type)
  fetchedAtBlock: Schema.Types.Mixed, // Mixed type for fetchedAtBlock (number type)
  db: String, // String type for db
  isPermanent: Boolean, // Boolean type for isPermanent
});

export const RefreshSchema = new Schema<RefreshDoc<JSPrimitiveNumberType>>({
  _docId: String,
  collectionId: Schema.Types.Mixed, // Mixed type for collectionId (number type)
  refreshRequestTime: Schema.Types.Mixed, // Mixed type for refreshRequestTime (number type)
});

export const AirdropSchema = new Schema<AirdropDoc<JSPrimitiveNumberType>>({
  _docId: String,
  airdropped: Boolean, // Boolean type for airdropped
  timestamp: Schema.Types.Mixed, // Mixed type for timestamp (number type)
  hash: String, // String type for hash
});

export const IPFSTotalsSchema = new Schema<IPFSTotalsDoc<JSPrimitiveNumberType>>({
  _docId: String,
  bytesUploaded: Schema.Types.Mixed, // Mixed type for bytesUploaded (number type)
});

export const ComplianceSchema = new Schema<ComplianceDoc<JSPrimitiveNumberType>>({
  _docId: String,
  badges: Schema.Types.Mixed, // Mixed type for badges
  addressLists: Schema.Types.Mixed, // Mixed type for addressLists
  accounts: Schema.Types.Mixed, // Mixed type for accounts
});


export const BlockinAuthSignatureSchema = new Schema<BlockinAuthSignatureDoc<JSPrimitiveNumberType>>({
  _docId: String,
  signature: String, // String type for signature
  name: String, // String type for name
  description: String, // String type for description
  image: String, // String type for image
  cosmosAddress: String, // String type for cosmosAddress
  params: Schema.Types.Mixed, // Mixed type for params (ChallengeParams type)
  createdAt: Schema.Types.Mixed, // Mixed type for createdAt (number type)
});

export const FollowDetailsSchema = new Schema<FollowDetailsDoc<JSPrimitiveNumberType>>({
  _docId: String,
  cosmosAddress: String, // String type for cosmosAddress
  followingCount: Schema.Types.Mixed, // Mixed type for followingCount (number type)
  followersCount: Schema.Types.Mixed, // Mixed type for followersCount (number type)
});
