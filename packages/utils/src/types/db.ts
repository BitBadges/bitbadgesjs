import { BadgeUri, Balance, Challenge, ChallengeBase, Claim, ClaimBase, IdRange, TransferMapping, UserBalance, UserBalanceBase, convertFromApproval, convertFromBalance, convertFromIdRange, convertToApproval, convertToBalance, convertToIdRange, s_Challenge, s_Claim, s_UserBalance } from "bitbadgesjs-proto";
import MerkleTree from "merkletreejs";
import { Metadata } from "./metadata";
import { Permissions } from "./permissions";
import { SupportedChain } from "./types";

/**
 * CollectionBase is the type of document stored in the collections database (see documentation for more info)
 *
 * @typedef {Object} CollectionBase
 * @property {bigint | string} collectionId - The collection ID
 * @property {string} collectionUri - The URI of the collection
 * @property {BadgeUri[]} badgeUris - The list of badge URIs for this collection and their respective badge IDs
 * @property {string} balancesUri - The URI of the balances for this collection (only used for off-chain balances)
 * @property {string} bytes - An arbitrary string of bytes that can be used to store arbitrary data
 * @property {string} manager - The account address of the manager of this collection
 * @property {Permissions} permissions - The permissions of the manager of this collection
 * @property {TransferMapping[]} allowedTransfers - The list of allowed transfers for this collection
 * @property {TransferMapping[]} managerApprovedTransfers - The list of manager approved transfers for this collection
 * @property {bigint | string} nextBadgeId - The next badge ID to be minted for this collection
 * @property {bigint | string} nextClaimId - The next claim ID to be minted for this collection
 * @property {Balance[]} unmintedSupplys - The list of unminted supplies for this collection
 * @property {Balance[]} maxSupplys - The list of max supplies for this collection
 * @property {bigint | string} standard - The standard of this collection
 * @property {Challenge[]} managerRequests - The list of manager requests for this collection
 * @property {bigint | string} createdBlock - The block number when this collection was created
 */
export interface CollectionBase {
  collectionId: bigint | string;
  collectionUri: string;
  badgeUris: BadgeUri[];
  balancesUri: string;
  bytes: string;
  manager: string;
  permissions: Permissions;
  allowedTransfers: TransferMapping[];
  managerApprovedTransfers: TransferMapping[];
  nextBadgeId: bigint | string;
  nextClaimId: bigint | string;
  unmintedSupplys: Balance[];
  maxSupplys: Balance[];
  standard: bigint | string;
  managerRequests: string[];
  createdBlock: bigint | string;
}

export interface s_Collection extends CollectionBase {
  collectionId: string;
  nextBadgeId: string;
  nextClaimId: string;
  standard: string;
  createdBlock: string;
}

export interface Collection extends CollectionBase {
  collectionId: bigint;
  nextBadgeId: bigint;
  nextClaimId: bigint;
  standard: bigint;
  createdBlock: bigint;
}

export function convertToCollection(s_item: s_Collection): Collection {
  return {
    ...s_item,
    collectionId: BigInt(s_item.collectionId),
    nextBadgeId: BigInt(s_item.nextBadgeId),
    nextClaimId: BigInt(s_item.nextClaimId),
    standard: BigInt(s_item.standard),
    createdBlock: BigInt(s_item.createdBlock),
  }
}

export function convertFromCollection(item: Collection): s_Collection {
  return {
    ...item,
    collectionId: item.collectionId.toString(),
    nextBadgeId: item.nextBadgeId.toString(),
    nextClaimId: item.nextClaimId.toString(),
    standard: item.standard.toString(),
    createdBlock: item.createdBlock.toString(),
  }
}


/**
* The chain will return a similar structure but with a pub_key object and account_number field (see CosmosAccountResponse from bitbadgesjs-utils)
*
* Here, we clean up the response to return a more conventional object for our purposes.
*/


export interface AccountBase {
  publicKey: string
  // sequence: bigint | string //We will add sequence support in the future
  chain: SupportedChain
  cosmosAddress: string
  address: string
}

export interface Account extends AccountBase {
  // sequence: bigint
}

export interface s_Account extends AccountBase {
  // sequence: string
}

export function convertToAccount(s_item: s_Account): Account {
  return {
    ...s_item,
    // sequence: BigInt(s_item.sequence),
  }
}

export function convertFromAccount(item: Account): s_Account {
  return {
    ...item,
    // sequence: item.sequence.toString(),
  }
}



/**
 * ProfileBase is the type of document stored in the profile database
 *
 * @typedef {Object} ProfileBase
 * @property {bigint | string} seenActivity - The timestamp of the last activity seen for this account (milliseconds since epoch)
 * @property {bigint | string} createdAt - The timestamp of when this account was created (milliseconds since epoch)
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
 * See UserInfo
 */
export interface ProfileBase {
  seenActivity?: bigint | string;
  createdAt?: bigint | string;

  //Profile customization
  username?: string
  discord?: string
  twitter?: string
  github?: string
  telegram?: string
  readme?: string
}

export interface Profile extends ProfileBase {
  seenActivity?: bigint;
  createdAt?: bigint;
}

export interface s_Profile extends ProfileBase {
  seenActivity?: string;
  createdAt?: string;
}

export function convertToProfile(s_item: s_Profile): Profile {
  return {
    ...s_item,
    seenActivity: s_item.seenActivity ? BigInt(s_item.seenActivity) : undefined,
    createdAt: s_item.createdAt ? BigInt(s_item.createdAt) : undefined,
  }
}

export function convertFromProfile(item: Profile): s_Profile {
  return {
    ...item,
    seenActivity: item.seenActivity ? item.seenActivity.toString() : undefined,
    createdAt: item.createdAt ? item.createdAt.toString() : undefined,
  }
}

/**
 * Metadata document stored in the metadata database
 * Partitioned database by collection ID (e.g. 1-0, 1-1, and so on represent the metadata documents for collection 1)
 *
 * @typedef {Object} MetadataDocBase
 * @property {Metadata} metadata - The metadata object
 * @property {IdRange[]} badgeIds - The range of badge IDs that this metadata document is responsible for
 * @property {boolean} isCollection - True if this is a collection metadata document
 * @property {bigint | string} metadataId - The metadata ID for the document. The id for the metadata document is calculated deterministically from badgeUris field (see metadata.ts).
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
export interface MetadataDocBase {
  metadata: Metadata
  badgeIds: IdRange[]
  isCollection: boolean
  metadataId: bigint | string
  uri: string
}

/**
 * MetadataDoc fields
 *
 * @typedef {Object} MetadataDoc
 * @extends MetadataDocBase
 *
 * @see MetadataDocBase
 */
export interface MetadataDoc extends MetadataDocBase {
  metadataId: bigint
}

/**
 * s_MetadataDoc fields. Has strings instead of bigints.
 *
 * @typedef {Object} s_MetadataDoc
 * @extends MetadataDocBase
 *
 * @see MetadataDocBase
 */
export interface s_MetadataDoc extends MetadataDocBase {
  metadataId: string
}

export function convertToMetadataDoc(s_item: s_MetadataDoc): MetadataDoc {
  return {
    ...s_item,
    metadataId: BigInt(s_item.metadataId),
  }
}

export function convertFromMetadataDoc(item: MetadataDoc): s_MetadataDoc {
  return {
    ...item,
    metadataId: item.metadataId.toString(),
  }
}

/** STATUS TYPES **/
export interface IndexerStatus {
  status: DbStatus
}

/**
 * QueueItemBase represents an item in the queue
 *
 * @typedef {Object} QueueItemBase
 * @property {bigint | string} startMetadataId - The starting metadata ID for this queue item (doesn't change).
 * @property {bigint | string} currentMetadataId - The current metadata ID for this queue item (increments as each ID is processed).
 * @property {string} uri - The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds
 * @property {bigint | string} collectionId - The collection ID of the metadata to be fetched
 * @property {boolean} collection - True if this is a collection metadata
 * @property {IdRange[]} badgeIds - The range of badge IDs that this queue item should fetch
 * @property {bigint | string} numCalls - The number of times this queue item has been called
 * @property {bigint | string} specificId - The specific badge ID to be fetched (used if you only want to fetch a specific badge ID)
 * @property {boolean} purge - True if we should purge excess metadata documents from the database
 */
export interface QueueItemBase {
  startMetadataId: bigint | string,
  currentMetadataId: bigint | string | 'collection',
  uri: string,
  collectionId: bigint | string,
  collection: boolean,
  badgeIds: IdRange[],
  numCalls: bigint | string,
  specificId?: bigint | string,
  purge?: boolean
}

/**
 * QueueItem represents an item in the queue
 *
 * @typedef {Object} QueueItem
 * @extends QueueItemBase
 *
 * @see QueueItemBase
 */
export interface QueueItem extends QueueItemBase {
  startMetadataId: bigint,
  currentMetadataId: bigint | 'collection',
  collectionId: bigint,
  numCalls: bigint
  specificId?: bigint
}

/**
 * s_QueueItem represents an item in the queue
 *
 * Has strings instead of bigints
 *
 * @typedef {Object} s_QueueItem
 * @extends QueueItemBase
 *
 * @see QueueItemBase
 */
export interface s_QueueItem extends QueueItemBase {
  startMetadataId: string,
  currentMetadataId: string | 'collection',
  collectionId: string,
  numCalls: string
  specificId?: string
}

export function convertToQueueItem(s_item: s_QueueItem): QueueItem {
  return {
    ...s_item,
    startMetadataId: BigInt(s_item.startMetadataId),
    currentMetadataId: s_item.currentMetadataId === 'collection' ? s_item.currentMetadataId : BigInt(s_item.currentMetadataId),
    collectionId: BigInt(s_item.collectionId),
    numCalls: BigInt(s_item.numCalls),
    specificId: s_item.specificId ? BigInt(s_item.specificId) : undefined,
  }
}

export function convertFromQueueItem(item: QueueItem): s_QueueItem {
  return {
    ...item,
    startMetadataId: item.startMetadataId.toString(),
    currentMetadataId: item.currentMetadataId === 'collection' ? item.currentMetadataId : item.currentMetadataId.toString(),
    collectionId: item.collectionId.toString(),
    numCalls: item.numCalls.toString(),
    specificId: item.specificId ? item.specificId.toString() : undefined,
  }
}

/**
 * DbStatus represents the status document stored in the database
 *
 * @typedef {Object} DbStatusBase
 * @property {LatestBlockStatus} block - The latest synced block status (i.e. height)
 * @property {bigint | string} nextCollectionId - The next collection ID to be used
 * @property {QueueItem[]} queue - The queue of metadata to be fetched / handled
 * @property {bigint | string} gasPrice - The current gas price based on the average of the lastXGasPrices
 * @property {(bigint | string)[]} lastXGasPrices - The last X gas prices
 */
export interface DbStatusBase {
  block: {
    height: bigint | string
  };
  nextCollectionId: bigint | string;
  queue: QueueItemBase[],
  gasPrice: bigint | string;
  lastXGasPrices: (bigint | string)[];
}

export interface DbStatus extends DbStatusBase {
  block: {
    height: bigint
  };
  nextCollectionId: bigint;
  queue: QueueItem[],
  gasPrice: bigint;
  lastXGasPrices: bigint[];
}

/**
 * s_DbStatus represents the status document stored in the database
 *
 * Has strings instead of bigints
 *
 * @typedef {Object} s_DbStatus
 * @extends DbStatusBase
 *
 * @see DbStatusBase
 */
export interface s_DbStatus extends DbStatusBase {
  block: {
    height: string
  };
  nextCollectionId: string;
  queue: s_QueueItem[],
  gasPrice: string;
  lastXGasPrices: string[];
}

export function convertToDbStatus(s_status: s_DbStatus): DbStatus {
  return {
    ...s_status,
    block: {
      height: BigInt(s_status.block.height),
    },
    nextCollectionId: BigInt(s_status.nextCollectionId),
    queue: s_status.queue.map(convertToQueueItem),
    gasPrice: BigInt(s_status.gasPrice),
    lastXGasPrices: s_status.lastXGasPrices.map(BigInt),
  }
}

export function convertFromDbStatus(status: DbStatus): s_DbStatus {
  return {
    ...status,
    block: {
      height: status.block.height.toString(),
    },
    nextCollectionId: status.nextCollectionId.toString(),
    queue: status.queue.map(convertFromQueueItem),
    gasPrice: status.gasPrice.toString(),
    lastXGasPrices: status.lastXGasPrices.map((price) => price.toString()),
  }
}


/**
 * BalanceDocumentBase is the type of document stored in the balances database
 * Partitioned database by cosmosAddress (e.g. 1-cosmosx..., 1-cosmosy..., and so on represent the balances documents for collection 1 and user with cosmos address x and y respectively)
 *
 * @typedef {Object} BalanceDocumentBase
 * @extends {UserBalanceBase}
 *
 * @property {bigint | string} collectionId - The collection ID
 * @property {string} cosmosAddress - The Cosmos address of the user
 */
export interface BalanceDocumentBase extends UserBalanceBase {
  collectionId: bigint | string;
  cosmosAddress: string;
}

/**
 * BalanceDocument is the type of document stored in the balances database
 *
 * Has bigints instead of strings
 *
 * @typedef {Object} BalanceDocument
 * @extends {UserBalance}
 * @extends {BalanceDocumentBase}
 *
 * @see BalanceDocumentBase
 */
export interface BalanceDocument extends UserBalance {
  collectionId: bigint;
  cosmosAddress: string;
}

/**
 * s_BalanceDocument is the type of document stored in the balances database
 *
 * Has strings instead of bigints
 *
 * @typedef {Object} s_BalanceDocument
 * @extends {UserBalance}
 * @extends {s_BalanceDocument}
 *
 * @see BalanceDocumentBase
 */
export interface s_BalanceDocument extends s_UserBalance {
  collectionId: string;
  cosmosAddress: string;
}

export function convertToBalanceDocument(s_doc: s_BalanceDocument): BalanceDocument {
  return {
    ...s_doc,
    collectionId: BigInt(s_doc.collectionId),
    balances: s_doc.balances.map(convertToBalance),
    approvals: s_doc.approvals.map(convertToApproval),
  }
}

export function convertFromBalanceDocument(doc: BalanceDocument): s_BalanceDocument {
  return {
    ...doc,
    collectionId: doc.collectionId.toString(),
    balances: doc.balances.map(convertFromBalance),
    approvals: doc.approvals.map(convertFromApproval),
  }
}


export interface PasswordDocumentBase {
  password: string
  codes: string[]

  currCode: bigint | string
  claimedUsers: {
    [cosmosAddress: string]: bigint | string
  }

  cid: string
  docClaimedByCollection: boolean
  claimId: bigint | string
  collectionId: bigint | string
}

export interface PasswordDocument extends PasswordDocumentBase {
  currCode: bigint
  claimedUsers: {
    [cosmosAddress: string]: bigint
  }
  claimId: bigint
  collectionId: bigint
}

export interface s_PasswordDocument extends PasswordDocumentBase {
  currCode: string
  claimedUsers: {
    [cosmosAddress: string]: string
  }
  claimId: string
  collectionId: string
}

export function convertToPasswordDocument(s_doc: s_PasswordDocument): PasswordDocument {
  return {
    ...s_doc,
    currCode: BigInt(s_doc.currCode),
    claimedUsers: Object.entries(s_doc.claimedUsers).reduce((acc, [key, value]) => {
      acc[key] = BigInt(value)
      return acc
    }, {} as { [cosmosAddress: string]: bigint }),
    claimId: BigInt(s_doc.claimId),
    collectionId: BigInt(s_doc.collectionId),
  }
}

export function convertFromPasswordDocument(doc: PasswordDocument): s_PasswordDocument {
  return {
    ...doc,

    currCode: doc.currCode.toString(),
    claimedUsers: Object.entries(doc.claimedUsers).reduce((acc, [key, value]) => {
      acc[key] = value.toString()
      return acc
    }, {} as { [cosmosAddress: string]: string }),
    claimId: doc.claimId.toString(),
    collectionId: doc.collectionId.toString(),
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
 * ChallengeWithDetailsBase represents a challenge for a claim with additional specified details.
 * The base Challenge is what is stored on-chain, but this is the full challenge with additional details.
 *
 * @typedef {Object} ChallengeWithDetailsBase
 * @extends {Challenge}
 *
 * @property {LeavesDetails} leaves - The leaves of the Merkle tree with accompanying details
 * @property {boolean} areLeavesHashed - True if the leaves are hashed
 * @property {(bigint | string)[]} usedLeafIndices - The indices of the leaves that have been used
 * @property {MerkleTree} tree - The Merkle tree
 * @property {bigint | string} numLeaves - The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select)
 */
export interface ChallengeWithDetailsBase extends ChallengeBase {
  leavesDetails: LeavesDetails
  usedLeafIndices: (bigint | string)[]
  tree?: MerkleTree

  numLeaves?: bigint | string;
}

/**
 * ChallengeWithDetails represents a challenge for a claim with additional specified details.
 *
 * Has bigints instead of strings
 *
 * @typedef {Object} ChallengeWithDetails
 * @extends {ChallengeWithDetailsBase}
 *
 * @see ChallengeWithDetailsBase
 */
export interface ChallengeWithDetails extends Challenge {
  leavesDetails: LeavesDetails
  tree?: MerkleTree

  usedLeafIndices: bigint[]
  numLeaves?: bigint;
}

export interface s_ChallengeWithDetails extends s_Challenge {
  leavesDetails: LeavesDetails
  tree?: MerkleTree

  usedLeafIndices: string[]
  numLeaves?: string;
}

export function convertToChallengeWithDetails(s_challenge: s_ChallengeWithDetails): ChallengeWithDetails {
  return {
    ...s_challenge,
    usedLeafIndices: s_challenge.usedLeafIndices.map(BigInt),
    numLeaves: s_challenge.numLeaves ? BigInt(s_challenge.numLeaves) : undefined,
    expectedProofLength: BigInt(s_challenge.expectedProofLength),
  }
}

export function convertFromChallengeWithDetails(challenge: ChallengeWithDetails): s_ChallengeWithDetails {
  return {
    ...challenge,
    usedLeafIndices: challenge.usedLeafIndices.map((index) => index.toString()),
    numLeaves: challenge.numLeaves ? challenge.numLeaves.toString() : undefined,
    expectedProofLength: challenge.expectedProofLength.toString(),
  }
}

/**
 * ClaimDocumentBase is the type of document stored in the claims database
 * partitioned database by collection ID (e.g. 1-1, 1-2, and so on represent the claims collection 1 for claims with ID 1, 2, etc)
 *
 * @typedef {Object} ClaimDocumentBase
 * @extends {ClaimWithDetails}
 *
 * @property {bigint | string} collectionId - The collection ID
 * @property {bigint | string} claimId - The claim ID
 * @property {bigint | string} totalClaimsProcessed - The total number of claims processed for this collection
 * @property {{[cosmosAddress: string]: bigint | string}} claimsPerAddressCount - A running count for the number of claims processed for each address
 * @property {ChallengeWithDetails[]} challenges - The list of challenges for this claim (with extra helper details)
 * @property {boolean} failedToFetch - True if the claim failed to fetch the URI and inserted blank values
 */
export interface ClaimDocumentBase extends ClaimWithDetails {
  collectionId: bigint | string;
  claimId: bigint | string;
  totalClaimsProcessed: bigint | string;
  claimsPerAddressCount: {
    [cosmosAddress: string]: bigint | string;
  },
  failedToFetch?: boolean;
}

/**
 * ClaimDocument is the type of document stored in the claims database
 *
 * Has bigints instead of strings
 *
 * @typedef {Object} ClaimDocument
 * @extends {ClaimWithDetails}
 *
 * @see ClaimDocumentBase
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

export interface s_ClaimDocument extends s_ClaimWithDetails {
  collectionId: string;
  claimId: string;
  totalClaimsProcessed: string;
  claimsPerAddressCount: {
    [cosmosAddress: string]: string;
  },
  failedToFetch?: boolean;
}

export function convertToClaimDocument(s_doc: s_ClaimDocument): ClaimDocument {
  return {
    ...s_doc,
    collectionId: BigInt(s_doc.collectionId),
    claimId: BigInt(s_doc.claimId),
    totalClaimsProcessed: BigInt(s_doc.totalClaimsProcessed),
    claimsPerAddressCount: Object.fromEntries(Object.entries(s_doc.claimsPerAddressCount).map(([key, value]) => [key, BigInt(value)])),
    challenges: s_doc.challenges.map(convertToChallengeWithDetails),
    undistributedBalances: s_doc.undistributedBalances.map(convertToBalance),
    numClaimsPerAddress: BigInt(s_doc.numClaimsPerAddress),
    incrementIdsBy: BigInt(s_doc.incrementIdsBy),
    currentClaimAmounts: s_doc.currentClaimAmounts.map(convertToBalance),
    timeRange: convertToIdRange(s_doc.timeRange),
  }
}

export function convertFromClaimDocument(doc: ClaimDocument): s_ClaimDocument {
  return {
    ...doc,
    collectionId: doc.collectionId.toString(),
    claimId: doc.claimId.toString(),
    totalClaimsProcessed: doc.totalClaimsProcessed.toString(),
    claimsPerAddressCount: Object.fromEntries(Object.entries(doc.claimsPerAddressCount).map(([key, value]) => [key, value.toString()])),
    challenges: doc.challenges.map(convertFromChallengeWithDetails),
    undistributedBalances: doc.undistributedBalances.map(convertFromBalance),
    numClaimsPerAddress: doc.numClaimsPerAddress.toString(),
    incrementIdsBy: doc.incrementIdsBy.toString(),
    currentClaimAmounts: doc.currentClaimAmounts.map(convertFromBalance),
    timeRange: convertFromIdRange(doc.timeRange),
  }
}

/**
 * Extends a base Claim with additional details.
 * The base Claim is what is stored on-chain, but this is the full claim with additional details stored in the indexer.
 *
 * @typedef {Object} ClaimWithDetailsBase
 * @extends {Claim}
 *
 * @property {string} name - The name of the claim
 * @property {string} description - The description of the claim. This describes how to earn and claim the badge.
 * @property {boolean} hasPassword - True if the claim has a password
 * @property {string} password - The password of the claim (if it has one)
 * @property {ChallengeWithDetails[]} challenges - The list of challenges for this claim (with extra helper details)
 */
export interface ClaimWithDetailsBase extends ClaimBase {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challenges: ChallengeWithDetailsBase[];
}

/**
 * Extends a base Claim with additional details.
 *
 * Has bigints instead of strings
 *
 * @typedef {Object} ClaimWithDetails
 * @extends {ClaimWithDetailsBase}
 *
 * @see ClaimWithDetailsBase
 */
export interface ClaimWithDetails extends Claim {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challenges: ChallengeWithDetails[];
}

/**
 * Extends a base Claim with additional details.
 *
 * Has strings instead of bigints
 * @typedef {Object} s_ClaimWithDetails
 * @extends {ClaimWithDetailsBase}
 *
 * @see ClaimWithDetailsBase
 */
export interface s_ClaimWithDetails extends s_Claim {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challenges: s_ChallengeWithDetails[];
}

export function convertToClaimWithDetails(s_claim: s_ClaimWithDetails): ClaimWithDetails {
  return {
    ...s_claim,
    challenges: s_claim.challenges.map(convertToChallengeWithDetails),
    undistributedBalances: s_claim.undistributedBalances.map(convertToBalance),
    numClaimsPerAddress: BigInt(s_claim.numClaimsPerAddress),
    incrementIdsBy: BigInt(s_claim.incrementIdsBy),
    currentClaimAmounts: s_claim.currentClaimAmounts.map(convertToBalance),
    timeRange: convertToIdRange(s_claim.timeRange),
  }
}

export function convertFromClaimWithDetails(claim: ClaimWithDetails): s_ClaimWithDetails {
  return {
    ...claim,
    challenges: claim.challenges.map(convertFromChallengeWithDetails),
    undistributedBalances: claim.undistributedBalances.map(convertFromBalance),
    numClaimsPerAddress: claim.numClaimsPerAddress.toString(),
    incrementIdsBy: claim.incrementIdsBy.toString(),
    currentClaimAmounts: claim.currentClaimAmounts.map(convertFromBalance),
    timeRange: convertFromIdRange(claim.timeRange),
  }
}
