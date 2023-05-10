import { BadgeUri, Balance, Challenge, Claim, IdRange, TransferMapping, UserBalance } from "bitbadgesjs-proto";
import { Metadata } from "./metadata";
import { Permissions } from "./permissions";
import MerkleTree from "merkletreejs";
import { SupportedChain } from "./types";

/**
 * CollectionDocument is the type of document stored in the collections database (see documentation for more info)
 *
 * @typedef {Object} CollectionDocument
 * @property {bigint} collectionId - The collection ID
 * @property {string} collectionUri - The URI of the collection
 * @property {BadgeUri[]} badgeUris - The list of badge URIs for this collection and their respective badge IDs
 * @property {string} balancesUri - The URI of the balances for this collection (only used for off-chain balances)
 * @property {string} bytes - An arbitrary string of bytes that can be used to store arbitrary data
 * @property {string} manager - The account address of the manager of this collection
 * @property {Permissions} permissions - The permissions of the manager of this collection
 * @property {TransferMapping[]} allowedTransfers - The list of allowed transfers for this collection
 * @property {TransferMapping[]} managerApprovedTransfers - The list of manager approved transfers for this collection
 * @property {bigint} nextBadgeId - The next badge ID to be minted for this collection
 * @property {bigint} nextClaimId - The next claim ID to be minted for this collection
 * @property {Balance[]} unmintedSupplys - The list of unminted supplies for this collection
 * @property {Balance[]} maxSupplys - The list of max supplies for this collection
 * @property {bigint} standard - The standard of this collection
 * @property {Challenge[]} managerRequests - The list of manager requests for this collection
 * @property {bigint} createdBlock - The block number when this collection was created
 */
export interface CollectionDocument {
  collectionId: bigint;
  collectionUri: string;
  badgeUris: BadgeUri[];
  balancesUri: string;
  bytes: string;
  manager: string;
  permissions: Permissions;
  allowedTransfers: TransferMapping[];
  managerApprovedTransfers: TransferMapping[];
  nextBadgeId: bigint;
  nextClaimId: bigint;
  unmintedSupplys: Balance[];
  maxSupplys: Balance[];
  standard: bigint;
  managerRequests: bigint[];
  createdBlock: bigint;
}

/**
 * AccountDocument is the type of document stored in the accounts database
 *
 * @typedef {Object} AccountDocument
 * @property {string} cosmosAddress - The Cosmos address of the account
 * @property {bigint} accountNumber - The account number of the account
 * @property {string} address - The native chain's address of the account
 * @property {SupportedChain} chain - The native chain of the account
 * @property {bigint} seenActivity - The timestamp of the last activity seen for this account (milliseconds since epoch)
 * @property {bigint} createdAt - The timestamp of when this account was created (milliseconds since epoch)
 *
 * @property {string} username - The username of the account
 * @property {string} discord - The Discord username of the account
 * @property {string} twitter - The Twitter username of the account
 * @property {string} github - The GitHub username of the account
 * @property {string} telegram - The Telegram username of the account
 * @property {string} readme - The readme of the account
 *
 *
 * @remarks
 * Other information like resolvedName, avatar, balance, etc are to be loaded dynamically each time the account is fetched
 *
 * @see
 * See BitBadgesUserInfo
 */
export interface AccountDocument {
  cosmosAddress: string,
  accountNumber: bigint;
  chain: SupportedChain,
  address: string,
  seenActivity?: bigint;
  createdAt?: bigint;

  //Profile customization
  username?: string
  discord?: string
  twitter?: string
  github?: string
  telegram?: string
  readme?: string
}

/**
 * Metadata document stored in the metadata database
 * Partitioned database by collection ID (e.g. 1-0, 1-1, and so on represent the metadata documents for collection 1)
 *
 * @typedef {Object} MetadataDocument
 * @property {Metadata} metadata - The metadata object
 * @property {IdRange[]} badgeIds - The range of badge IDs that this metadata document is responsible for
 * @property {boolean} isCollection - True if this is a collection metadata document
 * @property {bigint} metadataId - The metadata ID for the document. The id for the metadata document is calculated deterministically from badgeUris field (see metadata.ts).
 * @property {string} uri - The URI of the metadata
 *
 *
 * @remarks
 * The metadataId for the metadata document is calculated deterministically from badgeUris field (see metadata.ts).
 * metadataId == 0 - collection metadata
 * metadataId > 0 - badge metadata
 *
 * Pseudocode for calculating metadataId:
 * metadataId = 1
 * for each badgeUri in badgeUris: //Linear iteration
 *  if badgeUri.uri.contains("{id}"):
 *    for each id in badgeUri.badgeIds:
 *      fetch metadata from badgeUri.uri.replace("{id}", id)
 *      store metadata in database with metadataId = metadataId and badgeIds = [{start: id, end: id}]
 *  else:
 *   fetch metadata from badgeUri.uri
 *   store metadata in database with metadataId = metadataId and badgeIds = badgeUri.badgeIds
 *  metadataId++
 */
export interface MetadataDocument {
  metadata: Metadata
  badgeIds: IdRange[]
  isCollection: boolean
  metadataId: bigint
  uri: string
}

/** STATUS TYPES **/
export interface IndexerStatus {
  status: DbStatus
}

export interface LatestBlockStatus {
  height: bigint
}

/**
 * QueueItem represents an item in the queue
 *
 * @typedef {Object} QueueItem
 * @property {bigint} startMetadataId - The starting metadata ID for this queue item (doesn't change).
 * @property {bigint} currentMetadataId - The current metadata ID for this queue item (increments as each ID is processed).
 * @property {string} uri - The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds
 * @property {bigint} collectionId - The collection ID of the metadata to be fetched
 * @property {boolean} collection - True if this is a collection metadata
 * @property {IdRange[]} badgeIds - The range of badge IDs that this queue item should fetch
 * @property {bigint} numCalls - The number of times this queue item has been called
 * @property {bigint} specificId - The specific badge ID to be fetched (used if you only want to fetch a specific badge ID)
 * @property {boolean} purge - True if we should purge excess metadata documents from the database
 */
export interface QueueItem {
  startMetadataId: bigint,
  currentMetadataId: bigint | 'collection',
  uri: string,
  collectionId: bigint,
  collection: boolean,
  badgeIds: IdRange[],
  numCalls: bigint,
  specificId?: bigint,
  purge?: boolean
}


/**
 * DbStatus represents the status document stored in the database
 *
 * @typedef {Object} DbStatus
 * @property {LatestBlockStatus} block - The latest synced block status (i.e. height)
 * @property {bigint} nextCollectionId - The next collection ID to be used
 * @property {QueueItem[]} queue - The queue of metadata to be fetched / handled
 * @property {bigint} gasPrice - The current gas price based on the average of the lastXGasPrices
 * @property {bigint[]} lastXGasPrices - The last X gas prices
 */
export interface DbStatus {
  block: LatestBlockStatus;
  nextCollectionId: bigint;
  queue: QueueItem[],
  gasPrice: bigint;
  lastXGasPrices: bigint[];
}

/**
 * BalanceDocument is the type of document stored in the balances database
 * Partitioned database by cosmosAddress (e.g. 1-cosmosx..., 1-cosmosy..., and so on represent the balances documents for collection 1 and user with cosmos address x and y respectively)
 *
 * @typedef {Object} BalanceDocument
 * @extends {UserBalance}
 *
 * @property {bigint} collectionId - The collection ID
 * @property {string} cosmosAddress - The Cosmos address of the user
 */
export interface BalanceDocument extends UserBalance {
  collectionId: bigint;
  cosmosAddress: string;
}

/**
 * TODO: rework this
 */
export interface PasswordDocument {
  password: string
  codes: string[]

  currCode: bigint
  claimedUsers: {
    [cosmosAddress: string]: bigint
  }

  cid: string
  docClaimedByCollection: boolean
  claimId: bigint
  collectionId: bigint
}

/**
 * ChallengesWithDetails represents a challenge for a claim with additional specified details.
 * The base Challenge is what is stored on-chain, but this is the full challenge with additional details.
 *
 * @typedef {Object} ChallengesWithDetails
 * @extends {Challenge}
 *
 * @property {string[]} leaves - The leaves of the Merkle tree
 * @property {boolean} areLeavesHashed - True if the leaves are hashed
 * @property {bigint[]} usedLeafIndices - The indices of the leaves that have been used
 * @property {MerkleTree} tree - The Merkle tree
 * @property {bigint} numLeaves - The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select)
 */
export interface ChallengesWithDetails extends Challenge {
  leaves: string[]
  areLeavesHashed: boolean
  usedLeafIndices: bigint[]
  tree?: MerkleTree

  numLeaves?: bigint;
}

/**
 * ClaimDocument is the type of document stored in the claims database
 * partitioned database by collection ID (e.g. 1-1, 1-2, and so on represent the claims collection 1 for claims with ID 1, 2, etc)
 *
 * @typedef {Object} ClaimDocument
 * @extends {ClaimWithDetails}
 *
 * @property {bigint} collectionId - The collection ID
 * @property {bigint} claimId - The claim ID
 * @property {bigint} totalClaimsProcessed - The total number of claims processed for this collection
 * @property {{[cosmosAddress: string]: bigint}} claimsPerAddressCount - A running count for the number of claims processed for each address
 * @property {ChallengesWithDetails[]} challenges - The list of challenges for this claim (with extra helper details)
 * @property {boolean} failedToFetch - True if the claim failed to fetch the URI and inserted blank values
 */
export interface ClaimDocument extends ClaimWithDetails {
  collectionId: bigint;
  claimId: bigint;
  totalClaimsProcessed: bigint;
  claimsPerAddressCount: {
    [cosmosAddress: string]: bigint;
  },
  failedToFetch?: boolean;
}

/**
 * Extends a base Claim with additional details.
 * The base Claim is what is stored on-chain, but this is the full claim with additional details stored in the indexer.
 *
 * @typedef {Object} ClaimWithDetails
 * @extends {Claim}
 *
 * @property {string} name - The name of the claim
 * @property {string} description - The description of the claim. This describes how to earn and claim the badge.
 * @property {boolean} hasPassword - True if the claim has a password
 * @property {string} password - The password of the claim (if it has one)
 * @property {ChallengesWithDetails[]} challenges - The list of challenges for this claim (with extra helper details)
 */
export interface ClaimWithDetails extends Claim {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challenges: ChallengesWithDetails[];
}
