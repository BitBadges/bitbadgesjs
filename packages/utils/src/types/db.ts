import { AddressMapping, AmountTrackerIdDetails, BadgeMetadataTimeline, Balance, CollectionApproval, CollectionMetadataTimeline, CollectionPermissions, ContractAddressTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, MerkleChallenge, OffChainBalancesMetadataTimeline, StandardsTimeline, UintRange, UserIncomingApproval, UserOutgoingApproval, UserBalance, UserPermissions, convertBadgeMetadataTimeline, convertBalance, convertCollectionApproval, convertCollectionMetadataTimeline, convertCollectionPermissions, convertContractAddressTimeline, convertCustomDataTimeline, convertIsArchivedTimeline, convertManagerTimeline, convertMerkleChallenge, convertOffChainBalancesMetadataTimeline, convertStandardsTimeline, convertUintRange, convertUserIncomingApproval, convertUserOutgoingApproval, convertUserBalance, convertUserPermissions } from "bitbadgesjs-proto";
import MerkleTree from "merkletreejs";
import nano from "nano";
import { CosmosCoin, convertCosmosCoin } from "./coin";
import { DocsCache } from "./indexer";
import { Metadata, convertMetadata } from "./metadata";
import { NumberType } from "./string-numbers";
import { OffChainBalancesMap, convertOffChainBalancesMap } from "./transfers";
import { SupportedChain } from "./types";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails, convertUserIncomingApprovalWithDetails, convertUserOutgoingApprovalWithDetails } from "./users";
import { deepCopy, getCouchDBDetails, removeCouchDBDetails } from "./utils";
import { Options as MerkleTreeJsOptions } from "merkletreejs/dist/MerkleTree";

/**
 * @category API / Indexer
 */
export interface DeletableDocument {
  _deleted?: boolean
}

/**
 * @category API / Indexer
 */
export interface Identified {
  _id: string,
  _rev?: undefined,
  _deleted?: undefined
}

/**
 * CollectionInfoBase is the type of document stored in the collections database (see documentation for more info)
 *
 * @category API / Indexer
 * @typedef {Object} CollectionInfoBase
 * @property {NumberType} collectionId - The collection ID
 * @property {CollectionMetadataTimeline[]} collectionMetadataTimeline - The collection metadata timeline
 * @property {BadgeMetadataTimeline[]} badgeMetadataTimeline - The badge metadata timeline
 * @property {string} balancesType - The type of balances (i.e. "Standard", "Off-Chain", "Inherited")
 * @property {OffChainBalancesMetadataTimeline[]} offChainBalancesMetadataTimeline - The off-chain balances metadata timeline
//  * @property {NumberType} inheritedCollectionId - The inherited collection ID
 * @property {CustomDataTimeline[]} customDataTimeline - The custom data timeline
 * @property {ManagerTimeline[]} managerTimeline - The manager timeline
 * @property {CollectionPermissions} collectionPermissions - The collection permissions
 * @property {CollectionApproval[]} collectionApprovals - The collection approved transfers timeline
 * @property {StandardsTimeline[]} standardsTimeline - The standards timeline
 * @property {IsArchivedTimeline[]} isArchivedTimeline - The is archived timeline
 * @property {ContractAddressTimeline[]} contractAddressTimeline - The contract address timeline
 * @property {UserOutgoingApproval[]} defaultUserOutgoingApprovals - The default user approved outgoing transfers
 * @property {UserIncomingApproval[]} defaultUserIncomingApprovals - The default user approved incoming transfers timeline
 * @property {UserPermissions} defaultUserPermissions - The default user permissions
 * @property {string} createdBy - The cosmos address of the user who created this collection
 * @property {NumberType} createdBlock - The block number when this collection was created
 */
export interface CollectionInfoBase<T extends NumberType> {
  collectionId: T;
  collectionMetadataTimeline: CollectionMetadataTimeline<T>[];
  badgeMetadataTimeline: BadgeMetadataTimeline<T>[];
  balancesType: "Standard" | "Off-Chain" | "Inherited";
  offChainBalancesMetadataTimeline: OffChainBalancesMetadataTimeline<T>[];
  // inheritedCollectionId: T;
  customDataTimeline: CustomDataTimeline<T>[];
  managerTimeline: ManagerTimeline<T>[];
  collectionPermissions: CollectionPermissions<T>;
  collectionApprovals: CollectionApproval<T>[];
  standardsTimeline: StandardsTimeline<T>[];
  isArchivedTimeline: IsArchivedTimeline<T>[];
  contractAddressTimeline: ContractAddressTimeline<T>[];
  defaultUserOutgoingApprovals: UserOutgoingApproval<T>[];
  defaultUserIncomingApprovals: UserIncomingApproval<T>[];
  defaultAutoApproveSelfInitiatedOutgoingTransfers: boolean;
  defaultAutoApproveSelfInitiatedIncomingTransfers: boolean;
  defaultUserPermissions: UserPermissions<T>;
  createdBy: string;
  createdBlock: T;
  createdTimestamp: T;
  updateHistory: {
    txHash: string;
    block: T;
    blockTimestamp: T;
  }[];
}
/**
 * @category API / Indexer
 */
export type CollectionDoc<T extends NumberType> = CollectionInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type CollectionInfo<T extends NumberType> = CollectionInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertCollectionInfo<T extends NumberType, U extends NumberType>(item: CollectionInfo<T>, convertFunction: (item: T) => U): CollectionInfo<U> {
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
    contractAddressTimeline: item.contractAddressTimeline.map((contractAddressTimeline) => convertContractAddressTimeline(contractAddressTimeline, convertFunction)),
    defaultUserOutgoingApprovals: item.defaultUserOutgoingApprovals.map((defaultUserOutgoingApprovals) => convertUserOutgoingApproval(defaultUserOutgoingApprovals, convertFunction)),
    defaultUserIncomingApprovals: item.defaultUserIncomingApprovals.map((defaultUserIncomingApprovals) => convertUserIncomingApproval(defaultUserIncomingApprovals, convertFunction)),
    defaultUserPermissions: convertUserPermissions(item.defaultUserPermissions, convertFunction),
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
 * @category API / Indexer
 */
export function convertCollectionDoc<T extends NumberType, U extends NumberType>(item: CollectionDoc<T>, convertFunction: (item: T) => U): CollectionDoc<U> {
  return deepCopy({
    ...convertCollectionInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
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
 * @property {NumberType} sequence - The sequence of the account. Note we currently do not store sequence in the DB (it is dynamically fetched).
 * @property {SupportedChain} chain - The chain of the account
 * @property {string} cosmosAddress - The Cosmos address of the account
 * @property {string} ethAddress - The Eth address of the account
 * @property {string} [username] - The username of the account (from x/nameservice)
 * @property {CosmosCoin} [balance] - The balance of the account ($BADGE gas token balance not a specific badge)
 */
export interface AccountInfoBase<T extends NumberType> {
  publicKey: string
  // sequence: bigint | JSPrimitiveNumberType //We will add sequence support in the future
  chain: SupportedChain
  cosmosAddress: string
  ethAddress: string
  accountNumber: T
  username?: string //from x/nameservice
  sequence?: T
  balance?: CosmosCoin<T>
}
/**
 * @category API / Indexer
 */
export type AccountDoc<T extends NumberType> = AccountInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type AccountInfo<T extends NumberType> = AccountInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertAccountInfo<T extends NumberType, U extends NumberType>(item: AccountInfo<T>, convertFunction: (item: T) => U): AccountInfo<U> {
  return deepCopy({
    ...item,
    accountNumber: convertFunction(item.accountNumber),
    sequence: item.sequence ? convertFunction(item.sequence) : undefined,
    balance: item.balance ? convertCosmosCoin(item.balance, convertFunction) : undefined
  })
}

/**
 * @category API / Indexer
 */
export function convertAccountDoc<T extends NumberType, U extends NumberType>(item: AccountDoc<T>, convertFunction: (item: T) => U): AccountDoc<U> {
  return deepCopy({
    ...convertAccountInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
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
 * @property {string} profilePicUrl - The profile picture URL of the account
 * @property {string} username - The username of the account
 *
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

  customLinks?: {
    title: string,
    url: string,
    image: string,
  }[]

  onlyShowApproved?: boolean
  shownBadges?: {
    collectionId: T,
    badgeIds: UintRange<T>[],
  }[],

  hiddenBadges?: {
    collectionId: T,
    badgeIds: UintRange<T>[],
  }[],

  customPages?: {
    title: string,
    description: string,
    badges: {
      collectionId: T,
      badgeIds: UintRange<T>[],
    }[]
  }[]

  profilePicUrl?: string
  username?: string

  latestSignedInChain?: SupportedChain
}


/**
 * @category API / Indexer
 */
export type ProfileDoc<T extends NumberType> = ProfileInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type ProfileInfo<T extends NumberType> = ProfileInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertProfileInfo<T extends NumberType, U extends NumberType>(item: ProfileInfo<T>, convertFunction: (item: T) => U): ProfileInfo<U> {
  return deepCopy({
    ...item,
    seenActivity: item.seenActivity ? convertFunction(item.seenActivity) : undefined,
    createdAt: item.createdAt ? convertFunction(item.createdAt) : undefined,
    shownBadges: item.shownBadges ? item.shownBadges.map((shownBadge) => ({
      collectionId: convertFunction(shownBadge.collectionId),
      badgeIds: shownBadge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
    })) : undefined,
    hiddenBadges: item.hiddenBadges ? item.hiddenBadges.map((hiddenBadge) => ({
      collectionId: convertFunction(hiddenBadge.collectionId),
      badgeIds: hiddenBadge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
    })) : undefined,
    customPages: item.customPages ? item.customPages.map((customPage) => ({
      title: customPage.title,
      description: customPage.description,
      badges: customPage.badges.map((badge) => ({
        collectionId: convertFunction(badge.collectionId),
        badgeIds: badge.badgeIds.map((badgeId) => convertUintRange(badgeId, convertFunction)),
      })),
    })) : undefined,
  })
}

/**
 * @category API / Indexer
 */
export function convertProfileDoc<T extends NumberType, U extends NumberType>(item: ProfileDoc<T>, convertFunction: (item: T) => U): ProfileDoc<U> {
  return deepCopy({
    ...convertProfileInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
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
export type QueueDoc<T extends NumberType> = QueueInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type QueueInfo<T extends NumberType> = QueueInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertQueueItem<T extends NumberType, U extends NumberType>(item: QueueInfo<T>, convertFunction: (item: T) => U): QueueInfo<U> {
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
 * @category API / Indexer
 */
export function convertQueueDoc<T extends NumberType, U extends NumberType>(item: QueueDoc<T>, convertFunction: (item: T) => U): QueueDoc<U> {
  return deepCopy({
    ...convertQueueItem(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
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
 * @property {QueueDoc[]} queue - The queue of metadata to be fetched / handled
 * @property {NumberType} gasPrice - The current gas price based on the average of the lastXGasPrices
 * @property {(NumberType)[]} lastXGasPrices - The last X gas prices
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
export type StatusDoc<T extends NumberType> = StatusInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type StatusInfo<T extends NumberType> = StatusInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertStatusInfo<T extends NumberType, U extends NumberType>(item: StatusInfo<T>, convertFunction: (item: T) => U): StatusInfo<U> {
  return deepCopy({
    ...item,
    block: convertLatestBlockStatus(item.block, convertFunction),
    nextCollectionId: convertFunction(item.nextCollectionId),
    // gasPrice: convertFunction(item.gasPrice),
    lastXGasLimits: item.lastXGasLimits.map((gasLimit) => convertFunction(gasLimit)),
    lastXGasAmounts: item.lastXGasAmounts.map((gasAmount) => convertFunction(gasAmount)),
  })
}

/**
 * @category API / Indexer
 */
export function convertStatusDoc<T extends NumberType, U extends NumberType>(item: StatusDoc<T>, convertFunction: (item: T) => U): StatusDoc<U> {
  return deepCopy({
    ...convertStatusInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * AddressMapping is the type of document stored in the address mappings database.
 *
 * Docs are stored by mapping IDs. Note that reserved mappings should be obtained from getReservedAddressMapping.
 */
export interface AddressMappingInfoBase<T extends NumberType> extends AddressMapping {
  createdBy: string
  updateHistory: {
    txHash: string;
    block: T;
    blockTimestamp: T;
  }[];
  createdBlock: T;
  lastUpdated: T
}
/**
 * @category API / Indexer
 */
export type AddressMappingDoc<T extends NumberType> = AddressMappingInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type AddressMappingInfo<T extends NumberType> = AddressMappingInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertAddressMappingInfo<T extends NumberType, U extends NumberType>(item: AddressMappingInfo<T>, convertFunction: (item: T) => U): AddressMappingInfo<U> {
  return deepCopy({
    ...item,
    updateHistory: item.updateHistory.map((updateHistory) => ({
      ...updateHistory,
      block: convertFunction(updateHistory.block),
      blockTimestamp: convertFunction(updateHistory.blockTimestamp),
    })),
    createdBlock: convertFunction(item.createdBlock),
    lastUpdated: convertFunction(item.lastUpdated),
  })
}

/**
 * @category API / Indexer
 */
export function convertAddressMappingDoc<T extends NumberType, U extends NumberType>(item: AddressMappingDoc<T>, convertFunction: (item: T) => U): AddressMappingDoc<U> {
  return deepCopy({
    ...convertAddressMappingInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * BalanceInfoBase is the type of document stored in the balances database
 * Partitioned database by cosmosAddress (e.g. 1-cosmosx..., 1-cosmosy..., and so on represent the balances documents for collection 1 and user with cosmos address x and y respectively)
 *
 *
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
 */
export interface BalanceInfoBase<T extends NumberType> extends UserBalance<T> {

  collectionId: T;
  cosmosAddress: string;
  onChain: boolean;

  //used if off-chain balances
  uri?: string,
  fetchedAt?: T, //Date.now()
  fetchedAtBlock?: T,
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
export type BalanceDoc<T extends NumberType> = BalanceInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type BalanceInfo<T extends NumberType> = BalanceInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertBalanceInfo<T extends NumberType, U extends NumberType>(item: BalanceInfo<T>, convertFunction: (item: T) => U): BalanceInfo<U> {
  return deepCopy({
    ...item,
    ...convertUserBalance(item, convertFunction),
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
 */
export function convertBalanceDoc<T extends NumberType, U extends NumberType>(item: BalanceDoc<T>, convertFunction: (item: T) => U): BalanceDoc<U> {
  return deepCopy({
    ...convertBalanceInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * @category API / Indexer
 */
export interface BalanceInfoWithDetails<T extends NumberType> extends BalanceInfo<T> {
  outgoingApprovals: UserOutgoingApprovalWithDetails<T>[];
  incomingApprovals: UserIncomingApprovalWithDetails<T>[];
}

/**
 * @category API / Indexer
 */
export function convertBalanceInfoWithDetails<T extends NumberType, U extends NumberType>(item: BalanceInfoWithDetails<T>, convertFunction: (item: T) => U): BalanceInfoWithDetails<U> {
  return deepCopy({
    ...convertBalanceInfo(item, convertFunction),
    incomingApprovals: item.incomingApprovals.map(x => convertUserIncomingApprovalWithDetails(x, convertFunction)),
    outgoingApprovals: item.outgoingApprovals.map(x => convertUserOutgoingApprovalWithDetails(x, convertFunction)),
  })
}


/**
 * PasswordInfoBase represents a document for a password or code-based claim.
 *
 * @category API / Indexer
 * @typedef {Object} PasswordInfoBase
 * @property {string} password - The password or code
 * @property {string[]} codes - The list of codes
 *
 * @property {NumberType} currCode - The current code idx
 * @property {{[cosmosAddress: string]: NumberType}} claimedUsers - The list of users that have claimed this password
 * @property {string} cid - The CID of the password document
 * @property {boolean} docClaimedByCollection - True if the password document is claimed by the collection
 * @property {NumberType} claimId - The claim ID of the password document
 * @property {NumberType} collectionId - The collection ID of the password document
 * @property {NumberType} challengeId - The challenge ID of the password document
 * @property {boolean} isHashed - True if the codes / password are already hashed
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
export type PasswordDoc<T extends NumberType> = PasswordInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type PasswordInfo<T extends NumberType> = PasswordInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertPasswordInfo<T extends NumberType, U extends NumberType>(item: PasswordInfo<T>, convertFunction: (item: T) => U): PasswordInfo<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    challengeDetails: item.challengeDetails ? convertChallengeDetails(item.challengeDetails, convertFunction) : undefined,
    claimedUsers: Object.fromEntries(Object.entries(item.claimedUsers).map(([key, value]) => [key, convertFunction(value)])),
  })
}

/**
 * @category API / Indexer
 */
export function convertPasswordDoc<T extends NumberType, U extends NumberType>(item: PasswordDoc<T>, convertFunction: (item: T) => U): PasswordDoc<U> {
  return deepCopy({
    ...convertPasswordInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * ClaimAlertInfoBase represents a document for a claim alert.
 * This is used to alert users of a claim that has been made for them.
 *
 * @category API / Indexer
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
export type ClaimAlertDoc<T extends NumberType> = ClaimAlertInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;

/**
 * @category API / Indexer
 */
export type ClaimAlertInfo<T extends NumberType> = ClaimAlertInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertClaimAlertInfo<T extends NumberType, U extends NumberType>(item: ClaimAlertInfo<T>, convertFunction: (item: T) => U): ClaimAlertInfo<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    createdTimestamp: convertFunction(item.createdTimestamp),
  })
}

/**
 * @category API / Indexer
 */
export function convertClaimAlertDoc<T extends NumberType, U extends NumberType>(item: ClaimAlertDoc<T>, convertFunction: (item: T) => U): ClaimAlertDoc<U> {
  return deepCopy({
    ...convertClaimAlertInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
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
 * Only use this with the non-hashed option when the values do not contain any sensitive information (i.e. a public whitelist of addresses).
 *
 * @example Codes
 * 1. Generate N codes privately
 * 2. Hash each code
 * 3. Store the hashed codes publicly on IPFS via this struct
 * 4. When a user enters a code, we hash it and check if it matches any of the hashed codes. This way, the codes are never stored publicly on IPFS and only known by the generator of the codes.
 *
 * @example Whitelist
 * For storing a public whitelist of addresses (with useCreatorAddressAsLeaf = true), hashing complicates everything because the whitelist can be stored publicly.
 * 1. Generate N whitelist addresses
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
 * @property {LeavesDetails} leaves - The leaves of the Merkle tree with accompanying details
 * @property {boolean} areLeavesHashed - True if the leaves are hashed
 * @property {(number)[]} usedLeafIndices - The indices of the leaves that have been used
 * @property {MerkleTree} tree - The Merkle tree
 * @property {MerkleTreeJsOptions} treeOptions - The Merkle tree options for how to build it
 * @property {NumberType} numLeaves - The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select)
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
    currCode: item.currCode ? convertFunction(item.currCode) : undefined,
  })
}

/**
 * ApprovalsTrackerInfoBase is the type of document stored in the approvals tracker database
 *
 * @category API / Indexer
 * @typedef {Object} ApprovalsTrackerInfoBase
 * @property {NumberType} numTransfers - The number of transfers. Is an incrementing tally.
 * @property {Balance[]} amounts - A tally of the amounts transferred for this approval.
 * @property {string} trackerType - The type of tracker (i.e. "overall", "to", "from", "initiatedBy")
 */
export interface ApprovalsTrackerInfoBase<T extends NumberType> extends AmountTrackerIdDetails<T> {
  numTransfers: T;
  amounts: Balance<T>[];
}

/**
 * @category API / Indexer
 */
export type ApprovalsTrackerDoc<T extends NumberType> = ApprovalsTrackerInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type ApprovalsTrackerInfo<T extends NumberType> = ApprovalsTrackerInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertApprovalsTrackerInfo<T extends NumberType, U extends NumberType>(item: ApprovalsTrackerInfo<T>, convertFunction: (item: T) => U): ApprovalsTrackerInfo<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    numTransfers: convertFunction(item.numTransfers),
    amounts: item.amounts.map((amount) => convertBalance(amount, convertFunction)),
  })
}

/**
 * @category API / Indexer
 */
export function convertApprovalsTrackerDoc<T extends NumberType, U extends NumberType>(item: ApprovalsTrackerDoc<T>, convertFunction: (item: T) => U): ApprovalsTrackerDoc<U> {
  return deepCopy({
    ...convertApprovalsTrackerInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * MerkleChallengeTrackerIdDetails holds the fields used to identify a specific merkle challenge tracker
 *
 * @category API / Indexer
 * @typedef {Object} MerkleChallengeTrackerIdDetails
 * @property {NumberType} collectionId - The collection ID
 * @property {string} challengeId - The challenge ID
 * @property {string} challengeLevel - The challenge level (i.e. "collection", "incoming", "outgoing")
 * @property {string} approverAddress - The approver address (leave blank if challengeLevel = "collection")
 */
export interface MerkleChallengeTrackerIdDetails<T extends NumberType> {
  collectionId: T;
  challengeId: string;
  challengeLevel: "collection" | "incoming" | "outgoing" | "";
  approverAddress: string; //Leave blank if challengeLevel = "collection"
}

/**
 * @category API / Indexer
 */
export function convertMerkleChallengeTrackerIdDetails<T extends NumberType, U extends NumberType>(item: MerkleChallengeTrackerIdDetails<T>, convertFunction: (item: T) => U): MerkleChallengeTrackerIdDetails<U> {
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
 * @property {NumberType} claimId - The claim ID
 * @property {NumberType} totalClaimsProcessed - The total number of claims processed for this collection
 * @property {{[cosmosAddress: string]: number}} claimsPerAddressCount - A running count for the number of claims processed for each address
 * @property {(number)[][]} usedLeafIndices - The used leaf indices for each challenge. A leaf index is the leaf location in Merkle tree
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
export type MerkleChallengeDoc<T extends NumberType> = MerkleChallengeInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type MerkleChallengeInfo<T extends NumberType> = MerkleChallengeInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertMerkleChallengeInfo<T extends NumberType, U extends NumberType>(item: MerkleChallengeInfo<T>, convertFunction: (item: T) => U): MerkleChallengeInfo<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    usedLeafIndices: item.usedLeafIndices.map(convertFunction),
  })
}

/**
 * @category API / Indexer
 */
export function convertMerkleChallengeDoc<T extends NumberType, U extends NumberType>(item: MerkleChallengeDoc<T>, convertFunction: (item: T) => U): MerkleChallengeDoc<U> {
  return deepCopy({
    ...convertMerkleChallengeInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * @category API / Indexer
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
 * @property {ApprovalInfoDetails} details - The details of the claim
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
 * @property {ChallengeDetails[]} challenges - The list of challenges for this claim (with extra helper details)
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
 * @property {string} uri - The URI of the document
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
export type FetchDoc<T extends NumberType> = FetchInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type FetchInfo<T extends NumberType> = FetchInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertFetchInfo<T extends NumberType, U extends NumberType>(item: FetchInfo<T>, convertFunction: (item: T) => U): FetchInfo<U> {
  return deepCopy({
    ...item,
    content: item.content ? item.db === 'Metadata' ? convertMetadata(item.content as Metadata<T>, convertFunction) : item.db === 'ApprovalInfo' ? convertApprovalInfoDetails(item.content as ApprovalInfoDetails<T>, convertFunction) : convertOffChainBalancesMap(item.content as OffChainBalancesMap<T>, convertFunction) : undefined,
    fetchedAt: convertFunction(item.fetchedAt),
    fetchedAtBlock: convertFunction(item.fetchedAtBlock),
  })
}


/**
 * @category API / Indexer
 */
export function convertFetchDoc<T extends NumberType, U extends NumberType>(item: FetchDoc<T>, convertFunction: (item: T) => U): FetchDoc<U> {
  return deepCopy({
    ...convertFetchInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * @category API / Indexer
 */
export interface RefreshInfoBase<T extends NumberType> {
  collectionId: T
  refreshRequestTime: T
}
/**
 * @category API / Indexer
 */
export type RefreshDoc<T extends NumberType> = RefreshInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type RefreshInfo<T extends NumberType> = RefreshInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertRefreshInfo<T extends NumberType, U extends NumberType>(item: RefreshInfo<T>, convertFunction: (item: T) => U): RefreshInfo<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    refreshRequestTime: convertFunction(item.refreshRequestTime),
  })
}

/**
 * @category API / Indexer
 */
export function convertRefreshDoc<T extends NumberType, U extends NumberType>(item: RefreshDoc<T>, convertFunction: (item: T) => U): RefreshDoc<U> {
  return deepCopy({
    ...convertRefreshInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * @category API / Indexer
 */
export interface ErrorDoc {
  error: string
  function: string
  docs?: DocsCache
}

/**
 * @category API / Indexer
 */
export interface AirdropInfoBase<T extends NumberType> {
  airdropped: boolean
  timestamp: T
  hash?: string
}
/**
 * @category API / Indexer
 */
export type AirdropDoc<T extends NumberType> = AirdropInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type AirdropInfo<T extends NumberType> = AirdropInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertAirdropInfo<T extends NumberType, U extends NumberType>(item: AirdropInfo<T>, convertFunction: (item: T) => U): AirdropInfo<U> {
  return deepCopy({
    ...item,
    timestamp: convertFunction(item.timestamp),
  })
}

/**
 * @category API / Indexer
 */
export function convertAirdropDoc<T extends NumberType, U extends NumberType>(item: AirdropDoc<T>, convertFunction: (item: T) => U): AirdropDoc<U> {
  return deepCopy({
    ...convertAirdropInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}

/**
 * @category API / Indexer
 */
export interface IPFSTotalsInfoBase<T extends NumberType> {
  bytesUploaded: T
}
/**
 * @category API / Indexer
 */
export type IPFSTotalsDoc<T extends NumberType> = IPFSTotalsInfoBase<T> & nano.IdentifiedDocument & nano.MaybeRevisionedDocument & DeletableDocument;
/**
 * @category API / Indexer
 */
export type IPFSTotalsInfo<T extends NumberType> = IPFSTotalsInfoBase<T> & Identified;

/**
 * @category API / Indexer
 */
export function convertIPFSTotalsInfo<T extends NumberType, U extends NumberType>(item: IPFSTotalsInfo<T>, convertFunction: (item: T) => U): IPFSTotalsInfo<U> {
  return deepCopy({
    ...item,
    bytesUploaded: convertFunction(item.bytesUploaded),
  })
}

/**
 * @category API / Indexer
 */
export function convertIPFSTotalsDoc<T extends NumberType, U extends NumberType>(item: IPFSTotalsDoc<T>, convertFunction: (item: T) => U): IPFSTotalsDoc<U> {
  return deepCopy({
    ...convertIPFSTotalsInfo(removeCouchDBDetails(item), convertFunction),
    ...getCouchDBDetails(item),
  })
}
