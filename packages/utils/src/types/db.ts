import { BadgeUri, Balance, Claim, TransferMapping, UserBalance, convertBadgeUri, convertBalance, convertClaim, convertTransferMapping, convertUserBalance } from "bitbadgesjs-proto";
import MerkleTree from "merkletreejs";
import { CosmosCoin, convertCosmosCoin } from "./coin";
import { Metadata, convertMetadata } from "./metadata";
import { Permissions } from "./permissions";
import { NumberType } from "./string-numbers";
import { BalancesMap, SupportedChain, convertBalancesMap } from "./types";
import { deepCopy } from "./utils";
import { DocsCache } from "./indexer";
import nano from "nano";

export interface DeletableDocument {
  _deleted?: boolean
}

export interface CouchDBDetailsExcluded {
  _id?: undefined,
  _rev?: undefined,
  _deleted?: undefined
}

/**
 * CollectionInfoBase is the type of document stored in the collections database (see documentation for more info)
 *
 * @typedef {Object} CollectionInfoBase
 * @property {NumberType} collectionId - The collection ID
 * @property {string} collectionUri - The URI of the collection
 * @property {BadgeUri[]} badgeUris - The list of badge URIs for this collection and their respective badge IDs
 * @property {string} balancesUri - The URI of the balances for this collection (only used for off-chain balances)
 * @property {string} bytes - An arbitrary string of bytes that can be used to store arbitrary data
 * @property {string} manager - The account address of the manager of this collection
 * @property {Permissions} permissions - The permissions of the manager of this collection
 * @property {TransferMapping[]} allowedTransfers - The list of allowed transfers for this collection
 * @property {TransferMapping[]} managerApprovedTransfers - The list of manager approved transfers for this collection
 * @property {NumberType} nextBadgeId - The next badge ID to be minted for this collection
 * @property {NumberType} nextClaimId - The next claim ID to be minted for this collection
 * @property {Balance[]} unmintedSupplys - The list of unminted supplies for this collection
 * @property {Balance[]} maxSupplys - The list of max supplies for this collection
 * @property {NumberType} standard - The standard of this collection
 * @property {Challenge[]} managerRequests - The list of manager requests for this collection
 * @property {NumberType} createdBlock - The block number when this collection was created
 */
export interface CollectionInfoBase<T extends NumberType> {
  collectionId: T;
  collectionUri: string;
  badgeUris: BadgeUri<T>[];
  balancesUri: string;
  bytes: string;
  manager: string;
  permissions: Permissions;
  allowedTransfers: TransferMapping<T>[];
  managerApprovedTransfers: TransferMapping<T>[];
  nextBadgeId: T;
  nextClaimId: T;
  unmintedSupplys: Balance<T>[];
  maxSupplys: Balance<T>[];
  standard: T;
  managerRequests: string[];
  createdBlock: T;
}
export type CollectionDoc<T extends NumberType> = CollectionInfoBase<T> & nano.Document & DeletableDocument;
export type CollectionInfo<T extends NumberType> = CollectionInfoBase<T> & CouchDBDetailsExcluded;

export function convertCollectionDoc<T extends NumberType, U extends NumberType>(item: CollectionDoc<T>, convertFunction: (item: T) => U): CollectionDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    badgeUris: item.badgeUris.map((badgeUri) => convertBadgeUri(badgeUri, convertFunction)),
    allowedTransfers: item.allowedTransfers.map((transferMapping) => convertTransferMapping(transferMapping, convertFunction)),
    managerApprovedTransfers: item.managerApprovedTransfers.map((transferMapping) => convertTransferMapping(transferMapping, convertFunction)),
    nextBadgeId: convertFunction(item.nextBadgeId),
    nextClaimId: convertFunction(item.nextClaimId),
    unmintedSupplys: item.unmintedSupplys.map((balance) => convertBalance(balance, convertFunction)),
    maxSupplys: item.maxSupplys.map((balance) => convertBalance(balance, convertFunction)),
    standard: convertFunction(item.standard),
    createdBlock: convertFunction(item.createdBlock),
  })
}

/**
 * AccountInfoBase represents the account details stored on the blockchain for an address.
 * Everything in here should be deterministic and maintained by the blockchain (as opposed to profile).
 * We update this only upon new TXs that update the fields such as a name change or sequence change.
 *
 * @typedef {Object} AccountInfoBase
 * @property {string} publicKey - The public key of the account
 * @property {NumberType} sequence - The sequence of the account. Note we currently do not store sequence in the DB (it is dynamically fetched).
 * @property {SupportedChain} chain - The chain of the account
 * @property {string} cosmosAddress - The Cosmos address of the account
 * @property {string} address - The address of the account
 * @property {string} [username] - The username of the account (from x/nameservice)
 */
export interface AccountInfoBase<T extends NumberType> {
  publicKey: string
  // sequence: bigint | JSPrimitiveNumberType //We will add sequence support in the future
  chain: SupportedChain
  cosmosAddress: string
  address: string
  username?: string //from x/nameservice
  sequence?: T
  balance?: CosmosCoin<T>
}
export type AccountDoc<T extends NumberType> = AccountInfoBase<T> & nano.Document & DeletableDocument;
export type AccountInfo<T extends NumberType> = AccountInfoBase<T> & CouchDBDetailsExcluded;

export function convertAccountDoc<T extends NumberType, U extends NumberType>(item: AccountDoc<T>, convertFunction: (item: T) => U): AccountDoc<U> {
  return deepCopy({
    ...item,
    sequence: item.sequence ? convertFunction(item.sequence) : undefined,
    balance: item.balance ? convertCosmosCoin(item.balance, convertFunction) : undefined
  })
}

/**
 * ProfileInfoBase is the type of document stored in the profile database.
 * This is used for customizable profile info (not stored on the blockchain).
 *
 * @typedef {Object} ProfileInfoBase
 * @property {NumberType} seenActivity - The timestamp of the last activity seen for this account (milliseconds since epoch)
 * @property {NumberType} createdAt - The timestamp of when this account was created (milliseconds since epoch)
 *
 * @property {string} discord - The Discord username of the account
 * @property {string} twitter - The Twitter username of the account
 * @property {string} github - The GitHub username of the account
 * @property {string} telegram - The Telegram username of the account
 * @property {string} readme - The readme of the account
 *
 * @remarks
 * Other information like resolvedName, avatar, balance, etc are to be loaded dynamically each time the account is fetched
 *
 * @see
 * See UserInfo
 */
export interface ProfileInfoBase<T extends NumberType> {
  seenActivity?: T;
  createdAt?: T;

  //ProfileDoc customization
  discord?: string
  twitter?: string
  github?: string
  telegram?: string
  readme?: string
}
export type ProfileDoc<T extends NumberType> = ProfileInfoBase<T> & nano.Document & DeletableDocument;
export type ProfileInfo<T extends NumberType> = ProfileInfoBase<T> & CouchDBDetailsExcluded;

export function convertProfileDoc<T extends NumberType, U extends NumberType>(item: ProfileDoc<T>, convertFunction: (item: T) => U): ProfileDoc<U> {
  return deepCopy({
    ...item,
    seenActivity: item.seenActivity ? convertFunction(item.seenActivity) : undefined,
    createdAt: item.createdAt ? convertFunction(item.createdAt) : undefined,
  })
}

/** STATUS TYPES **/
export interface IndexerStatus {
  status: StatusDoc<bigint>
}

/**
 * QueueInfoBase represents an item in the queue
 *
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
};
export type QueueDoc<T extends NumberType> = QueueInfoBase<T> & nano.Document & DeletableDocument;
export type QueueInfo<T extends NumberType> = QueueInfoBase<T> & CouchDBDetailsExcluded;

export function convertQueueDoc<T extends NumberType, U extends NumberType>(item: QueueDoc<T>, convertFunction: (item: T) => U): QueueDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    loadBalanceId: convertFunction(item.loadBalanceId),
    refreshRequestTime: convertFunction(item.refreshRequestTime),
    numRetries: convertFunction(item.numRetries),
    lastFetchedAt: item.lastFetchedAt ? convertFunction(item.lastFetchedAt) : undefined,
    deletedAt: item.deletedAt ? convertFunction(item.deletedAt) : undefined,
  })
}

/**
 * LatestBlockStatus represents the latest block status
 *
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
  gasPrice: T;
  lastXGasPrices: (T)[];
}
export type StatusDoc<T extends NumberType> = StatusInfoBase<T> & nano.Document & DeletableDocument;
export type StatusInfo<T extends NumberType> = StatusInfoBase<T> & CouchDBDetailsExcluded;

export function convertStatusDoc<T extends NumberType, U extends NumberType>(item: StatusDoc<T>, convertFunction: (item: T) => U): StatusDoc<U> {
  return deepCopy({
    ...item,
    block: convertLatestBlockStatus(item.block, convertFunction),
    nextCollectionId: convertFunction(item.nextCollectionId),
    gasPrice: convertFunction(item.gasPrice),
    lastXGasPrices: item.lastXGasPrices.map(convertFunction),
  })
}

/**
 * BalanceInfoBase is the type of document stored in the balances database
 * Partitioned database by cosmosAddress (e.g. 1-cosmosx..., 1-cosmosy..., and so on represent the balances documents for collection 1 and user with cosmos address x and y respectively)
 *
 * @typedef {Object} BalanceInfoBase
 * @extends {UserBalance}
 *
 * @property {NumberType} collectionId - The collection ID
 * @property {string} cosmosAddress - The Cosmos address of the user
 */
export interface BalanceInfoBase<T extends NumberType> extends UserBalance<T> {
  collectionId: T;
  cosmosAddress: string;
  onChain: boolean;

  //used if off-chain balances
  uri?: string,
  fetchedAt?: T, //Date.now()
  isPermanent?: boolean
}
export type BalanceDoc<T extends NumberType> = BalanceInfoBase<T> & nano.Document & DeletableDocument;
export type BalanceInfo<T extends NumberType> = BalanceInfoBase<T> & CouchDBDetailsExcluded;

export function convertBalanceDoc<T extends NumberType, U extends NumberType>(item: BalanceDoc<T>, convertFunction: (item: T) => U): BalanceDoc<U> {
  return deepCopy({
    ...item,
    ...convertUserBalance(item, convertFunction),
    collectionId: convertFunction(item.collectionId),
    fetchedAt: item.fetchedAt ? convertFunction(item.fetchedAt) : undefined,
  })
}


/**
 * PasswordInfoBase represents a document for a password or code-based claim.
 *
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
 *
 */
export interface PasswordInfoBase<T extends NumberType> {
  password: string
  codes: string[]
  isHashed: boolean

  currCode: T
  claimedUsers: {
    [cosmosAddress: string]: T
  }

  cid: string
  docClaimedByCollection: boolean
  claimId: T
  collectionId: T
  challengeId: T
}
export type PasswordDoc<T extends NumberType> = PasswordInfoBase<T> & nano.Document & DeletableDocument;
export type PasswordInfo<T extends NumberType> = PasswordInfoBase<T> & CouchDBDetailsExcluded;

export function convertPasswordDoc<T extends NumberType, U extends NumberType>(item: PasswordDoc<T>, convertFunction: (item: T) => U): PasswordDoc<U> {
  return deepCopy({
    ...item,
    currCode: convertFunction(item.currCode),
    claimedUsers: Object.keys(item.claimedUsers).reduce((acc, cosmosAddress) => {
      acc[cosmosAddress] = convertFunction(item.claimedUsers[cosmosAddress])
      return acc
    }, {}),
    claimId: convertFunction(item.claimId),
    collectionId: convertFunction(item.collectionId),
    challengeId: convertFunction(item.challengeId),
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
 * @typedef {Object} LeavesDetails
 *
 * @property {string[]} leaves - The values of the leaves
 * @property {boolean} isHashed - True if the leaves are hashed
 *
 */
export interface LeavesDetails {
  leaves: string[]
  isHashed: boolean
}

/**
 * ChallengeDetails represents a challenge for a claim with additional specified details.
 * The base Challenge is what is stored on-chain, but this is the full challenge with additional details.
 *
 * @typedef {Object} ChallengeDetails
 * @extends {Challenge}
 *
 * @property {LeavesDetails} leaves - The leaves of the Merkle tree with accompanying details
 * @property {boolean} areLeavesHashed - True if the leaves are hashed
 * @property {(number)[]} usedLeafIndices - The indices of the leaves that have been used
 * @property {MerkleTree} tree - The Merkle tree
 * @property {NumberType} numLeaves - The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select)
 */
export interface ChallengeDetails<T extends NumberType> {
  leavesDetails: LeavesDetails
  tree?: MerkleTree

  numLeaves?: T;
}

export function convertChallengeDetails<T extends NumberType, U extends NumberType>(item: ChallengeDetails<T>, convertFunction: (item: T) => U): ChallengeDetails<U> {
  return deepCopy({
    ...item,
    numLeaves: item.numLeaves ? convertFunction(item.numLeaves) : undefined,
  })
}

/**
 * ClaimInfoBase is the type of document stored in the claims database
 * partitioned database by collection ID (e.g. 1-1, 1-2, and so on represent the claims collection 1 for claims with ID 1, 2, etc)
 *
 * @typedef {Object} ClaimInfoBase
 * @extends {Claim}
 *
 * @property {NumberType} collectionId - The collection ID
 * @property {NumberType} claimId - The claim ID
 * @property {NumberType} totalClaimsProcessed - The total number of claims processed for this collection
 * @property {{[cosmosAddress: string]: number}} claimsPerAddressCount - A running count for the number of claims processed for each address
 * @property {(number)[][]} usedLeafIndices - The used leaf indices for each challenge. A leaf index is the leaf location in Merkle tree
 */
export interface ClaimInfoBase<T extends NumberType> extends Claim<T> {
  collectionId: T;
  claimId: T;
  totalClaimsProcessed: T;
  claimsPerAddressCount: {
    [cosmosAddress: string]: T;
  },
  usedLeafIndices: (T)[][]; //2D array of used leaf indices by challenge index
}
export type ClaimDoc<T extends NumberType> = ClaimInfoBase<T> & nano.Document & DeletableDocument;
export type ClaimInfo<T extends NumberType> = ClaimInfoBase<T> & CouchDBDetailsExcluded;

export function convertClaimDoc<T extends NumberType, U extends NumberType>(item: ClaimDoc<T>, convertFunction: (item: T) => U): ClaimDoc<U> {
  return deepCopy({
    ...item,
    ...convertClaim(item, convertFunction),
    collectionId: convertFunction(item.collectionId),
    claimId: convertFunction(item.claimId),
    totalClaimsProcessed: convertFunction(item.totalClaimsProcessed),
    claimsPerAddressCount: Object.keys(item.claimsPerAddressCount).reduce((acc, cosmosAddress) => {
      acc[cosmosAddress] = convertFunction(item.claimsPerAddressCount[cosmosAddress])
      return acc
    }, {}),
    usedLeafIndices: item.usedLeafIndices.map((usedLeafIndices) => usedLeafIndices.map(convertFunction)),
  })
}

/**
 * ClaimInfoWithDetails extends claims and provides additional details.
 *
 * @typedef {Object} ClaimInfoWithDetails
 * @extends {ClaimDoc}
 *
 * @property {ClaimDetails} details - The details of the claim
 */
export interface ClaimInfoWithDetails<T extends NumberType> extends ClaimInfoBase<T> {
  details?: ClaimDetails<T>
}

export function convertClaimInfoWithDetails<T extends NumberType, U extends NumberType>(item: ClaimInfoWithDetails<T>, convertFunction: (item: T) => U): ClaimInfoWithDetails<U> {
  return deepCopy({
    ...item,
    ...convertClaimDoc({ ...item, _id: '', _rev: '' }, convertFunction),
    details: item.details ? convertClaimDetails(item.details, convertFunction) : undefined,
    _id: undefined,
    _rev: undefined,
  })
}

/**
 * Extends a base Claim with additional details.
 * The base Claim is what is stored on-chain, but this is the full claim with additional details stored in the indexer.
 *
 * @typedef {Object} ClaimDetails
 *
 * @property {string} name - The name of the claim
 * @property {string} description - The description of the claim. This describes how to earn and claim the badge.
 * @property {boolean} hasPassword - True if the claim has a password
 * @property {string} password - The password of the claim (if it has one)
 * @property {ChallengeDetails[]} challenges - The list of challenges for this claim (with extra helper details)
 */
export interface ClaimDetails<T extends NumberType> {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challengeDetails: ChallengeDetails<T>[];
}

export function convertClaimDetails<T extends NumberType, U extends NumberType>(item: ClaimDetails<T>, convertFunction: (item: T) => U): ClaimDetails<U> {
  return deepCopy({
    ...item,
    challengeDetails: item.challengeDetails.map((challengeDetails) => convertChallengeDetails(challengeDetails, convertFunction)),
  })
}

/**
 * FetchInfoBase is the type of document stored in the fetch database
 *
 * This represents the returned JSON value from fetching a URI.
 *
 * @typedef {Object} FetchInfoBase
 * @property {Metadata | ClaimDetails} content - The content of the fetch document. Note that we store balances in BALANCES_DB and not here to avoid double storage.
 * @property {NumberType} fetchedAt - The time the document was fetched
 * @property {'Claim' | 'Metadata' | 'Balances'} db - The type of content fetched. This is used for querying purposes
 * @property {boolean} isPermanent - True if the document is permanent (i.e. fetched from a permanent URI like IPFS)
 * @property {string} uri - The URI of the document
 */
export interface FetchInfoBase<T extends NumberType> {
  content?: Metadata<T> | ClaimDetails<T> | BalancesMap<T>
  fetchedAt: T, //Date.now()
  db: 'Claim' | 'Metadata' | 'Balances'
  isPermanent: boolean
}
export type FetchDoc<T extends NumberType> = FetchInfoBase<T> & nano.Document & DeletableDocument;
export type FetchInfo<T extends NumberType> = FetchInfoBase<T> & CouchDBDetailsExcluded;

export function convertFetchDoc<T extends NumberType, U extends NumberType>(item: FetchDoc<T>, convertFunction: (item: T) => U): FetchDoc<U> {
  return deepCopy({
    ...item,
    content: item.db === 'Metadata' ? convertMetadata(item.content as Metadata<T>, convertFunction) : item.db === 'Claim' ? convertClaimDetails(item.content as ClaimDetails<T>, convertFunction) : convertBalancesMap(item.content as BalancesMap<T>, convertFunction),
    fetchedAt: convertFunction(item.fetchedAt),
  })
}

export interface RefreshInfoBase<T extends NumberType> {
  collectionId: T
  refreshRequestTime: T
}
export type RefreshDoc<T extends NumberType> = RefreshInfoBase<T> & nano.Document & DeletableDocument;
export type RefreshInfo<T extends NumberType> = RefreshInfoBase<T> & CouchDBDetailsExcluded;

export function convertRefreshDoc<T extends NumberType, U extends NumberType>(item: RefreshDoc<T>, convertFunction: (item: T) => U): RefreshDoc<U> {
  return deepCopy({
    ...item,
    collectionId: convertFunction(item.collectionId),
    refreshRequestTime: convertFunction(item.refreshRequestTime),
  })
}

export interface ErrorDoc {
  error: string
  function: string
  docs?: DocsCache
}

export interface AirdropInfoBase<T extends NumberType> {
  airdropped: boolean
  timestamp: T
  hash?: string
}
export type AirdropDoc<T extends NumberType> = AirdropInfoBase<T> & nano.Document & DeletableDocument;
export type AirdropInfo<T extends NumberType> = AirdropInfoBase<T> & CouchDBDetailsExcluded;

export function convertAirdropDoc<T extends NumberType, U extends NumberType>(item: AirdropDoc<T>, convertFunction: (item: T) => U): AirdropDoc<U> {
  return deepCopy({
    ...item,
    timestamp: convertFunction(item.timestamp),
  })
}

export interface IPFSTotalsInfoBase<T extends NumberType> {
  kbUploaded: T
}
export type IPFSTotalsDoc<T extends NumberType> = IPFSTotalsInfoBase<T> & nano.Document & DeletableDocument;
export type IPFSTotalsInfo<T extends NumberType> = IPFSTotalsInfoBase<T> & CouchDBDetailsExcluded;

export function convertIPFSTotalsDoc<T extends NumberType, U extends NumberType>(item: IPFSTotalsDoc<T>, convertFunction: (item: T) => U): IPFSTotalsDoc<U> {
  return deepCopy({
    ...item,
    kbUploaded: convertFunction(item.kbUploaded),
  })
}
