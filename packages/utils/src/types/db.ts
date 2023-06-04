import { BadgeUriWithType, BalanceWithType, ClaimWithType, TransferMappingWithType, UserBalanceWithType, convertBadgeUri, convertBalance, convertClaim, convertTransferMapping, convertUserBalance } from "bitbadgesjs-proto";
import MerkleTree from "merkletreejs";
import { CosmosCoinWithType, convertCosmosCoin } from "./coin";
import { MetadataWithType, convertMetadata } from "./metadata";
import { Permissions } from "./permissions";
import { NumberType, StringNumber } from "./string-numbers";
import { SupportedChain } from "./types";

/**
 * CollectionDocWithType is the type of document stored in the collections database (see documentation for more info)
 *
 * @typedef {Object} CollectionDocWithType
 * @property {NumberType} collectionId - The collection ID
 * @property {string} collectionUri - The URI of the collection
 * @property {BadgeUriWithType[]} badgeUris - The list of badge URIs for this collection and their respective badge IDs
 * @property {string} balancesUri - The URI of the balances for this collection (only used for off-chain balances)
 * @property {string} bytes - An arbitrary string of bytes that can be used to store arbitrary data
 * @property {string} manager - The account address of the manager of this collection
 * @property {Permissions} permissions - The permissions of the manager of this collection
 * @property {TransferMappingWithType[]} allowedTransfers - The list of allowed transfers for this collection
 * @property {TransferMappingWithType[]} managerApprovedTransfers - The list of manager approved transfers for this collection
 * @property {NumberType} nextBadgeId - The next badge ID to be minted for this collection
 * @property {NumberType} nextClaimId - The next claim ID to be minted for this collection
 * @property {BalanceWithType[]} unmintedSupplys - The list of unminted supplies for this collection
 * @property {BalanceWithType[]} maxSupplys - The list of max supplies for this collection
 * @property {NumberType} standard - The standard of this collection
 * @property {Challenge[]} managerRequests - The list of manager requests for this collection
 * @property {NumberType} createdBlock - The block number when this collection was created
 */
export interface CollectionDocWithType<T extends NumberType> {
  collectionId: T;
  collectionUri: string;
  badgeUris: BadgeUriWithType<T>[];
  balancesUri: string;
  bytes: string;
  manager: string;
  permissions: Permissions;
  allowedTransfers: TransferMappingWithType<T>[];
  managerApprovedTransfers: TransferMappingWithType<T>[];
  nextBadgeId: T;
  nextClaimId: T;
  unmintedSupplys: BalanceWithType<T>[];
  maxSupplys: BalanceWithType<T>[];
  standard: T;
  managerRequests: string[];
  createdBlock: T;
}

export type CollectionDoc = CollectionDocWithType<bigint>;
export type s_CollectionDoc = CollectionDocWithType<string>;
export type n_CollectionDoc = CollectionDocWithType<number>;
export type d_CollectionDoc = CollectionDocWithType<StringNumber>;

export function convertCollectionDoc<T extends NumberType, U extends NumberType>(item: CollectionDocWithType<T>, convertFunction: (item: T) => U): CollectionDocWithType<U> {
  return {
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
  }
}

/**
 * AccountDoc represents the account details stored on the blockchain for an address.
 * Everything in here should be deterministic and maintained by the blockchain (as opposed to profile).
 * We update this only upon new TXs that update the fields such as a name change or sequence change.
 *
 * @typedef {Object} AccountDocWithType
 * @property {string} publicKey - The public key of the account
 * @property {NumberType} sequence - The sequence of the account. Note we currently do not store sequence in the DB (it is dynamically fetched).
 * @property {SupportedChain} chain - The chain of the account
 * @property {string} cosmosAddress - The Cosmos address of the account
 * @property {string} address - The address of the account
 * @property {string} [username] - The username of the account (from x/nameservice)
 */
export interface AccountDocWithType<T extends NumberType> {
  publicKey: string
  // sequence: bigint | StringNumber //We will add sequence support in the future
  chain: SupportedChain
  cosmosAddress: string
  address: string
  username?: string //from x/nameservice
  sequence?: T
  balance?: CosmosCoinWithType<T>
}

export type AccountDoc = AccountDocWithType<bigint>
export type s_AccountDoc = AccountDocWithType<string>
export type n_AccountDoc = AccountDocWithType<number>
export type d_AccountDoc = AccountDocWithType<StringNumber>

export function convertAccountDoc<T extends NumberType, U extends NumberType>(item: AccountDocWithType<T>, convertFunction: (item: T) => U): AccountDocWithType<U> {
  return {
    ...item,
    sequence: item.sequence ? convertFunction(item.sequence) : undefined,
    balance: item.balance ? convertCosmosCoin(item.balance, convertFunction) : undefined
  }
}

/**
 * ProfileDocWithType is the type of document stored in the profile database.
 * This is used for customizable profile info (not stored on the blockchain).
 *
 * @typedef {Object} ProfileDocWithType
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
export interface ProfileDocWithType<T extends NumberType> {
  seenActivity?: T;
  createdAt?: T;

  //ProfileDoc customization
  discord?: string
  twitter?: string
  github?: string
  telegram?: string
  readme?: string
}

export type ProfileDoc = ProfileDocWithType<bigint>
export type s_ProfileDoc = ProfileDocWithType<string>
export type n_ProfileDoc = ProfileDocWithType<number>
export type d_ProfileDoc = ProfileDocWithType<StringNumber>

export function convertProfileDoc<T extends NumberType, U extends NumberType>(item: ProfileDocWithType<T>, convertFunction: (item: T) => U): ProfileDocWithType<U> {
  return {
    ...item,
    seenActivity: item.seenActivity ? convertFunction(item.seenActivity) : undefined,
    createdAt: item.createdAt ? convertFunction(item.createdAt) : undefined,
  }
}

/** STATUS TYPES **/
export interface IndexerStatus {
  status: DbStatus
}

/**
 * QueueDocWithType represents an item in the queue
 *
 * @typedef {Object} QueueDocWithType
 * @property {string} uri - The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds
 * @property {NumberType} collectionId - The collection ID of the metadata to be fetched
 * @property {NumberType} loadBalanceId - The load balance ID of the metadata to be fetched. Only the node with the same load balance ID will fetch this metadata
 * @property {NumberType} refreshRequestTime - The timestamp of when this metadata was requested to be refreshed (milliseconds since epoch)
 * @property {NumberType} numRetries - The number of times this metadata has been tried to be fetched but failed
 * @property {NumberType} [lastFetchedAt] - The timestamp of when this metadata was last fetched (milliseconds since epoch)
 * @property {string} [error] - The error message if this metadata failed to be fetched
 * @property {NumberType} [deletedAt] - The timestamp of when this document was deleted (milliseconds since epoch)
 */
export interface QueueDocWithType<T extends NumberType> {
  uri: string,
  collectionId: T,
  loadBalanceId: T
  refreshRequestTime: T
  numRetries: T
  lastFetchedAt?: T
  error?: string
  deletedAt?: T
}

export type QueueDoc = QueueDocWithType<bigint>
export type s_QueueDoc = QueueDocWithType<string>
export type n_QueueDoc = QueueDocWithType<number>
export type d_QueueDoc = QueueDocWithType<StringNumber>

export function convertQueueDoc<T extends NumberType, U extends NumberType>(item: QueueDocWithType<T>, convertFunction: (item: T) => U): QueueDocWithType<U> {
  return {
    ...item,
    collectionId: convertFunction(item.collectionId),
    loadBalanceId: convertFunction(item.loadBalanceId),
    refreshRequestTime: convertFunction(item.refreshRequestTime),
    numRetries: convertFunction(item.numRetries),
    lastFetchedAt: item.lastFetchedAt ? convertFunction(item.lastFetchedAt) : undefined,
    deletedAt: item.deletedAt ? convertFunction(item.deletedAt) : undefined,
  }
}

/**
 * LatestBlockStatus represents the latest block status
 *
 * @typedef {Object} LatestBlockStatusWithType
 * @property {NumberType} height - The height of the latest block
 * @property {NumberType} txIndex - The transaction index of the latest block
 * @property {NumberType} timestamp - The timestamp of the latest block (milliseconds since epoch)
 */
export interface LatestBlockStatusWithType<T extends NumberType> {
  height: T
  txIndex: T
  timestamp: T
}

export type LatestBlockStatus = LatestBlockStatusWithType<bigint>
export type s_LatestBlockStatus = LatestBlockStatusWithType<string>
export type n_LatestBlockStatus = LatestBlockStatusWithType<number>
export type d_LatestBlockStatus = LatestBlockStatusWithType<StringNumber>

export function convertLatestBlockStatus<T extends NumberType, U extends NumberType>(item: LatestBlockStatusWithType<T>, convertFunction: (item: T) => U): LatestBlockStatusWithType<U> {
  return {
    ...item,
    height: convertFunction(item.height),
    txIndex: convertFunction(item.txIndex),
    timestamp: convertFunction(item.timestamp),
  }
}

/**
 * DbStatus represents the status document stored in the database
 *
 * @typedef {Object} DbStatusWithType
 * @property {LatestBlockStatus} block - The latest synced block status (i.e. height, txIndex, timestamp)
 * @property {NumberType} nextCollectionId - The next collection ID to be used
 * @property {QueueDoc[]} queue - The queue of metadata to be fetched / handled
 * @property {NumberType} gasPrice - The current gas price based on the average of the lastXGasPrices
 * @property {(NumberType)[]} lastXGasPrices - The last X gas prices
 */
export interface DbStatusWithType<T extends NumberType> {
  block: LatestBlockStatusWithType<T>
  nextCollectionId: T;
  gasPrice: T;
  lastXGasPrices: (T)[];
}

export type DbStatus = DbStatusWithType<bigint>
export type s_DbStatus = DbStatusWithType<string>
export type n_DbStatus = DbStatusWithType<number>
export type d_DbStatus = DbStatusWithType<StringNumber>

export function convertDbStatus<T extends NumberType, U extends NumberType>(item: DbStatusWithType<T>, convertFunction: (item: T) => U): DbStatusWithType<U> {
  return {
    ...item,
    block: convertLatestBlockStatus(item.block, convertFunction),
    nextCollectionId: convertFunction(item.nextCollectionId),
    gasPrice: convertFunction(item.gasPrice),
    lastXGasPrices: item.lastXGasPrices.map(convertFunction),
  }
}

/**
 * BalanceDocWithType is the type of document stored in the balances database
 * Partitioned database by cosmosAddress (e.g. 1-cosmosx..., 1-cosmosy..., and so on represent the balances documents for collection 1 and user with cosmos address x and y respectively)
 *
 * @typedef {Object} BalanceDocWithType
 * @extends {UserBalanceWithType}
 *
 * @property {NumberType} collectionId - The collection ID
 * @property {string} cosmosAddress - The Cosmos address of the user
 */
export interface BalanceDocWithType<T extends NumberType> extends UserBalanceWithType<T> {
  collectionId: T;
  cosmosAddress: string;
  onChain: boolean;

  //used if off-chain balances
  uri?: string,
  fetchedAt?: T, //Date.now()
  isPermanent?: boolean
}

export type BalanceDoc = BalanceDocWithType<bigint>
export type s_BalanceDoc = BalanceDocWithType<string>
export type n_BalanceDoc = BalanceDocWithType<number>
export type d_BalanceDoc = BalanceDocWithType<StringNumber>

export function convertBalanceDoc<T extends NumberType, U extends NumberType>(item: BalanceDocWithType<T>, convertFunction: (item: T) => U): BalanceDocWithType<U> {
  return {
    ...item,
    ...convertUserBalance(item, convertFunction),
    collectionId: convertFunction(item.collectionId),
    fetchedAt: item.fetchedAt ? convertFunction(item.fetchedAt) : undefined,
  }
}


/**
 * PasswordDoc represents a document for a password or code-based claim.
 *
 * @typedef {Object} PasswordDocWithType
 * @property {string} password - The password or code
 * @property {string[]} codes - The list of codes
 *
 * @property {NumberType} currCode - The current code idx
 * @property {{[cosmosAddress: string]: NumberType}} claimedUsers - The list of users that have claimed this password
 * @property {string} cid - The CID of the password document
 * @property {boolean} docClaimedByCollection - True if the password document is claimed by the collection
 * @property {NumberType} claimId - The claim ID of the password document
 * @property {NumberType} collectionId - The collection ID of the password document
 *
 */
export interface PasswordDocWithType<T extends NumberType> {
  password: string
  codes: string[]

  currCode: T
  claimedUsers: {
    [cosmosAddress: string]: T
  }

  cid: string
  docClaimedByCollection: boolean
  claimId: T
  collectionId: T
}

export type PasswordDoc = PasswordDocWithType<bigint>
export type s_PasswordDoc = PasswordDocWithType<string>
export type n_PasswordDoc = PasswordDocWithType<number>
export type d_PasswordDoc = PasswordDocWithType<StringNumber>

export function convertPasswordDoc<T extends NumberType, U extends NumberType>(item: PasswordDocWithType<T>, convertFunction: (item: T) => U): PasswordDocWithType<U> {
  return {
    ...item,
    currCode: convertFunction(item.currCode),
    claimedUsers: Object.keys(item.claimedUsers).reduce((acc, cosmosAddress) => {
      acc[cosmosAddress] = convertFunction(item.claimedUsers[cosmosAddress])
      return acc
    }, {}),
    claimId: convertFunction(item.claimId),
    collectionId: convertFunction(item.collectionId),
  }
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
 * ChallengeDetailsWithType represents a challenge for a claim with additional specified details.
 * The base Challenge is what is stored on-chain, but this is the full challenge with additional details.
 *
 * @typedef {Object} ChallengeDetailsWithType
 * @extends {Challenge}
 *
 * @property {LeavesDetails} leaves - The leaves of the Merkle tree with accompanying details
 * @property {boolean} areLeavesHashed - True if the leaves are hashed
 * @property {(number)[]} usedLeafIndices - The indices of the leaves that have been used
 * @property {MerkleTree} tree - The Merkle tree
 * @property {NumberType} numLeaves - The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select)
 */
export interface ChallengeDetailsWithType<T extends NumberType> {
  leavesDetails: LeavesDetails
  tree?: MerkleTree

  numLeaves?: T;
}

export type ChallengeDetails = ChallengeDetailsWithType<bigint>
export type s_ChallengeDetails = ChallengeDetailsWithType<string>
export type n_ChallengeDetails = ChallengeDetailsWithType<number>
export type d_ChallengeDetails = ChallengeDetailsWithType<StringNumber>

export function convertChallengeDetails<T extends NumberType, U extends NumberType>(item: ChallengeDetailsWithType<T>, convertFunction: (item: T) => U): ChallengeDetailsWithType<U> {
  return {
    ...item,
    numLeaves: item.numLeaves ? convertFunction(item.numLeaves) : undefined,
  }
}

/**
 * ClaimDocWithType is the type of document stored in the claims database
 * partitioned database by collection ID (e.g. 1-1, 1-2, and so on represent the claims collection 1 for claims with ID 1, 2, etc)
 *
 * @typedef {Object} ClaimDocWithType
 * @extends {ClaimWithType}
 *
 * @property {NumberType} collectionId - The collection ID
 * @property {NumberType} claimId - The claim ID
 * @property {NumberType} totalClaimsProcessed - The total number of claims processed for this collection
 * @property {{[cosmosAddress: string]: number}} claimsPerAddressCount - A running count for the number of claims processed for each address
 * @property {(number)[][]} usedLeafIndices - The used leaf indices for each challenge. A leaf index is the leaf location in Merkle tree
 */
export interface ClaimDocWithType<T extends NumberType> extends ClaimWithType<T> {
  collectionId: T;
  claimId: T;
  totalClaimsProcessed: T;
  claimsPerAddressCount: {
    [cosmosAddress: string]: T;
  },
  usedLeafIndices: (T)[][]; //2D array of used leaf indices by challenge index
}

export type ClaimDoc = ClaimDocWithType<bigint>
export type s_ClaimDoc = ClaimDocWithType<string>
export type n_ClaimDoc = ClaimDocWithType<number>
export type d_ClaimDoc = ClaimDocWithType<StringNumber>

export function convertClaimDoc<T extends NumberType, U extends NumberType>(item: ClaimDocWithType<T>, convertFunction: (item: T) => U): ClaimDocWithType<U> {
  return {
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
  }
}

/**
 * ClaimInfo extends claims and provides additional details.
 *
 * @typedef {Object} ClaimInfoWithType
 * @extends {ClaimDocWithType}
 *
 * @property {ClaimDetails} details - The details of the claim
 */
export interface ClaimInfoWithType<T extends NumberType> extends ClaimDocWithType<T> {
  details: ClaimDetailsWithType<T>
}

export type ClaimInfo = ClaimInfoWithType<bigint>
export type s_ClaimInfo = ClaimInfoWithType<string>
export type n_ClaimInfo = ClaimInfoWithType<number>
export type d_ClaimInfo = ClaimInfoWithType<StringNumber>

export function convertClaimInfo<T extends NumberType, U extends NumberType>(item: ClaimInfoWithType<T>, convertFunction: (item: T) => U): ClaimInfoWithType<U> {
  return {
    ...item,
    ...convertClaimDoc(item, convertFunction),
    details: convertClaimDetails(item.details, convertFunction),
  }
}

/**
 * Extends a base Claim with additional details.
 * The base Claim is what is stored on-chain, but this is the full claim with additional details stored in the indexer.
 *
 * @typedef {Object} ClaimDetailsWithType
 *
 * @property {string} name - The name of the claim
 * @property {string} description - The description of the claim. This describes how to earn and claim the badge.
 * @property {boolean} hasPassword - True if the claim has a password
 * @property {string} password - The password of the claim (if it has one)
 * @property {ChallengeDetails[]} challenges - The list of challenges for this claim (with extra helper details)
 */
export interface ClaimDetailsWithType<T extends NumberType> {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challengeDetails: ChallengeDetailsWithType<T>[];
}

export type ClaimDetails = ClaimDetailsWithType<bigint>
export type s_ClaimDetails = ClaimDetailsWithType<string>
export type n_ClaimDetails = ClaimDetailsWithType<number>
export type d_ClaimDetails = ClaimDetailsWithType<StringNumber>

export function convertClaimDetails<T extends NumberType, U extends NumberType>(item: ClaimDetailsWithType<T>, convertFunction: (item: T) => U): ClaimDetailsWithType<U> {
  return {
    ...item,
    challengeDetails: item.challengeDetails.map((challengeDetails) => convertChallengeDetails(challengeDetails, convertFunction)),
  }
}

/**
 * FetchDocWithType is the type of document stored in the fetch database
 *
 * This represents the returned JSON value from fetching a URI.
 *
 * @typedef {Object} FetchDocWithType
 * @property {MetadataWithType | ClaimDetailsWithType} content - The content of the fetch document. Note that we store balances in BALANCES_DB and not here to avoid double storage.
 * @property {NumberType} fetchedAt - The time the document was fetched
 * @property {'Claim' | 'Metadata' | 'Balances'} db - The type of content fetched. This is used for querying purposes
 * @property {boolean} isPermanent - True if the document is permanent (i.e. fetched from a permanent URI like IPFS)
 * @property {string} uri - The URI of the document
 */
export interface FetchDocWithType<T extends NumberType> {
  content?: MetadataWithType<T> | ClaimDetailsWithType<T>
  fetchedAt: T, //Date.now()
  db: 'Claim' | 'Metadata' | 'Balances'
  isPermanent: boolean
}

export type FetchDoc = FetchDocWithType<bigint>
export type s_FetchDoc = FetchDocWithType<string>
export type n_FetchDoc = FetchDocWithType<number>
export type d_FetchDoc = FetchDocWithType<StringNumber>

export function convertFetchDoc<T extends NumberType, U extends NumberType>(item: FetchDocWithType<T>, convertFunction: (item: T) => U): FetchDocWithType<U> {
  return {
    ...item,
    content: item.db === 'Metadata' ? convertMetadata(item.content as MetadataWithType<T>, convertFunction) : item.db === 'Claim' ? convertClaimDetails(item.content as ClaimDetailsWithType<T>, convertFunction) : undefined,
    fetchedAt: convertFunction(item.fetchedAt),
  }
}

export interface RefreshDocWithType<T extends NumberType> {
  collectionId: T
  refreshRequestTime: T
}

export type RefreshDoc = RefreshDocWithType<bigint>
export type s_RefreshDoc = RefreshDocWithType<string>
export type n_RefreshDoc = RefreshDocWithType<number>
export type d_RefreshDoc = RefreshDocWithType<StringNumber>

export function convertRefreshDoc<T extends NumberType, U extends NumberType>(item: RefreshDocWithType<T>, convertFunction: (item: T) => U): RefreshDocWithType<U> {
  return {
    ...item,
    collectionId: convertFunction(item.collectionId),
    refreshRequestTime: convertFunction(item.refreshRequestTime),
  }
}
