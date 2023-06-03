import { BadgeUri, Balance, Claim, TransferMapping, UserBalance, UserBalanceBase, convertFromApproval, convertFromBalance, convertFromChallenge, convertFromIdRange, convertToApproval, convertToBalance, convertToChallenge, convertToIdRange, s_Claim, s_UserBalance } from "bitbadgesjs-proto";
import MerkleTree from "merkletreejs";
import { Metadata, MetadataBase, s_Metadata } from "./metadata";
import { Permissions } from "./permissions";
import { BalancesMap, SupportedChain } from "./types";

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
  username?: string //from x/nameservice
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

/** STATUS TYPES **/
export interface IndexerStatus {
  status: DbStatus
}

/**
 * QueueItemBase represents an item in the queue
 *
 * @typedef {Object} QueueItemBase
 * @property {string} uri - The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds
 * @property {bigint | string} collectionId - The collection ID of the metadata to be fetched
 * @property {string} type - 'Metadata' or 'Balances'
 */
export interface QueueItemBase {
  uri: string,
  collectionId: bigint | string,
  loadBalanceId: number
  refreshRequestTime: number
  numRetries: number
  lastFetchedAt?: number
  error?: string
  deletedAt?: number
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
  collectionId: bigint
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
  collectionId: string
}

export function convertToQueueItem(s_item: s_QueueItem): QueueItem {
  return {
    ...s_item,
    collectionId: BigInt(s_item.collectionId),
  }
}

export function convertFromQueueItem(item: QueueItem): s_QueueItem {
  return {
    ...item,
    collectionId: item.collectionId.toString(),
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
    txIndex: bigint | string
  };
  nextCollectionId: bigint | string;
  gasPrice: bigint | string;
  lastXGasPrices: (bigint | string)[];
}

export interface DbStatus extends DbStatusBase {
  block: {
    height: bigint
    txIndex: bigint
    timestamp: number
  };
  nextCollectionId: bigint;
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
    txIndex: string
    timestamp: number
  };
  nextCollectionId: string;
  gasPrice: string;
  lastXGasPrices: string[];
}

export function convertToDbStatus(s_status: s_DbStatus): DbStatus {
  return {
    ...s_status,
    block: {
      height: BigInt(s_status.block.height),
      txIndex: BigInt(s_status.block.txIndex),
      timestamp: s_status.block.timestamp,
    },
    nextCollectionId: BigInt(s_status.nextCollectionId),
    gasPrice: BigInt(s_status.gasPrice),
    lastXGasPrices: s_status.lastXGasPrices.map(BigInt),
  }
}

export function convertFromDbStatus(status: DbStatus): s_DbStatus {
  return {
    ...status,
    block: {
      height: status.block.height.toString(),
      txIndex: status.block.txIndex.toString(),
      timestamp: status.block.timestamp,
    },
    nextCollectionId: status.nextCollectionId.toString(),
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
  onChain: boolean;

  //used if off-chain balances
  uri?: string,
  fetchedAt?: number, //Date.now()
  isPermanent?: boolean
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
  onChain: boolean;

  //used if off-chain balances
  uri?: string,
  fetchedAt?: number, //Date.now()
  isPermanent?: boolean
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
  onChain: boolean;

  //used if off-chain balances
  uri?: string,
  fetchedAt?: number, //Date.now()
  isPermanent?: boolean
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
 * ChallengeDetailsBase represents a challenge for a claim with additional specified details.
 * The base Challenge is what is stored on-chain, but this is the full challenge with additional details.
 *
 * @typedef {Object} ChallengeDetailsBase
 * @extends {Challenge}
 *
 * @property {LeavesDetails} leaves - The leaves of the Merkle tree with accompanying details
 * @property {boolean} areLeavesHashed - True if the leaves are hashed
 * @property {(bigint | string)[]} usedLeafIndices - The indices of the leaves that have been used
 * @property {MerkleTree} tree - The Merkle tree
 * @property {bigint | string} numLeaves - The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select)
 */
export interface ChallengeDetailsBase {
  leavesDetails: LeavesDetails
  tree?: MerkleTree

  numLeaves?: bigint | string;
}

/**
 * ChallengeDetails represents a challenge for a claim with additional specified details.
 *
 * Has bigints instead of strings
 *
 * @typedef {Object} ChallengeDetails
 * @extends {ChallengeDetailsBase}
 *
 * @see ChallengeDetailsBase
 */
export interface ChallengeDetails {
  leavesDetails: LeavesDetails
  tree?: MerkleTree

  numLeaves?: bigint;
}

export interface s_ChallengeDetails {
  leavesDetails: LeavesDetails
  tree?: MerkleTree

  numLeaves?: string;
}

export function convertToChallengeDetails(s_challenge: s_ChallengeDetails): ChallengeDetails {
  return {
    ...s_challenge,
    numLeaves: s_challenge.numLeaves ? BigInt(s_challenge.numLeaves) : undefined,
  }
}

export function convertFromChallengeDetails(challenge: ChallengeDetails): s_ChallengeDetails {
  return {
    ...challenge,
    numLeaves: challenge.numLeaves ? challenge.numLeaves.toString() : undefined,
  }
}

/**
 * ClaimDocumentBase is the type of document stored in the claims database
 * partitioned database by collection ID (e.g. 1-1, 1-2, and so on represent the claims collection 1 for claims with ID 1, 2, etc)
 *
 * @typedef {Object} ClaimDocumentBase
 * @extends {Claim}
 *
 * @property {bigint | string} collectionId - The collection ID
 * @property {bigint | string} claimId - The claim ID
 * @property {bigint | string} totalClaimsProcessed - The total number of claims processed for this collection
 * @property {{[cosmosAddress: string]: bigint | string}} claimsPerAddressCount - A running count for the number of claims processed for each address
 * @property {ChallengeDetails[]} challenges - The list of challenges for this claim (with extra helper details)
 * @property {boolean} failedToFetch - True if the claim failed to fetch the URI and inserted blank values
 */
export interface ClaimDocumentBase extends Claim {
  collectionId: bigint | string;
  claimId: bigint | string;
  totalClaimsProcessed: bigint | string;
  claimsPerAddressCount: {
    [cosmosAddress: string]: bigint | string;
  },
  usedLeafIndices: (bigint | string)[][]; //2D array of used leaf indices by challenge index
}

/**
 * ClaimDocument is the type of document stored in the claims database
 *
 * Has bigints instead of strings
 *
 * @typedef {Object} ClaimDocument
 * @extends {Claim}
 *
 * @see ClaimDocumentBase
 */
export interface ClaimDocument extends Claim {
  collectionId: bigint;
  claimId: bigint;
  totalClaimsProcessed: bigint;
  claimsPerAddressCount: {
    [cosmosAddress: string]: bigint;
  }
  usedLeafIndices: bigint[][]; //2D array of used leaf indices by challenge index
}

export interface s_ClaimDocument extends s_Claim {
  collectionId: string;
  claimId: string;
  totalClaimsProcessed: string;
  claimsPerAddressCount: {
    [cosmosAddress: string]: string;
  },
  usedLeafIndices: string[][]; //2D array of used leaf indices by challenge index
}

export function convertToClaimDocument(s_doc: s_ClaimDocument): ClaimDocument {
  return {
    ...s_doc,
    collectionId: BigInt(s_doc.collectionId),
    claimId: BigInt(s_doc.claimId),
    totalClaimsProcessed: BigInt(s_doc.totalClaimsProcessed),
    claimsPerAddressCount: Object.fromEntries(Object.entries(s_doc.claimsPerAddressCount).map(([key, value]) => [key, BigInt(value)])),
    challenges: s_doc.challenges.map(convertToChallenge),
    undistributedBalances: s_doc.undistributedBalances.map(convertToBalance),
    numClaimsPerAddress: BigInt(s_doc.numClaimsPerAddress),
    incrementIdsBy: BigInt(s_doc.incrementIdsBy),
    currentClaimAmounts: s_doc.currentClaimAmounts.map(convertToBalance),
    timeRange: convertToIdRange(s_doc.timeRange),
    usedLeafIndices: s_doc.usedLeafIndices.map((indices) => indices.map(BigInt)),
  }
}

export function convertFromClaimDocument(doc: ClaimDocument): s_ClaimDocument {
  return {
    ...doc,
    collectionId: doc.collectionId.toString(),
    claimId: doc.claimId.toString(),
    totalClaimsProcessed: doc.totalClaimsProcessed.toString(),
    claimsPerAddressCount: Object.fromEntries(Object.entries(doc.claimsPerAddressCount).map(([key, value]) => [key, value.toString()])),
    challenges: doc.challenges.map(convertFromChallenge),
    undistributedBalances: doc.undistributedBalances.map(convertFromBalance),
    numClaimsPerAddress: doc.numClaimsPerAddress.toString(),
    incrementIdsBy: doc.incrementIdsBy.toString(),
    currentClaimAmounts: doc.currentClaimAmounts.map(convertFromBalance),
    timeRange: convertFromIdRange(doc.timeRange),
    usedLeafIndices: doc.usedLeafIndices.map((indices) => indices.map((index) => index.toString())),
  }
}

export interface ClaimInfoBase extends ClaimDocumentBase {
  details: ClaimDetailsBase
}

export interface ClaimInfo extends ClaimDocument {
  details: ClaimDetails
}

export interface s_ClaimInfo extends s_ClaimDocument {
  details: s_ClaimDetails
}

export function convertToClaimInfo(s_doc: s_ClaimInfo): ClaimInfo {
  return {
    ...convertToClaimDocument(s_doc),
    details: convertToClaimDetails(s_doc.details),
  }
}

export function convertFromClaimInfo(doc: ClaimInfo): s_ClaimInfo {
  return {
    ...convertFromClaimDocument(doc),
    details: convertFromClaimDetails(doc.details),
  }
}


/**
 * Extends a base Claim with additional details.
 * The base Claim is what is stored on-chain, but this is the full claim with additional details stored in the indexer.
 *
 * @typedef {Object} ClaimDetailsBase
 * @extends {Claim}
 *
 * @property {string} name - The name of the claim
 * @property {string} description - The description of the claim. This describes how to earn and claim the badge.
 * @property {boolean} hasPassword - True if the claim has a password
 * @property {string} password - The password of the claim (if it has one)
 * @property {ChallengeDetails[]} challenges - The list of challenges for this claim (with extra helper details)
 */
export interface ClaimDetailsBase {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challengeDetails: ChallengeDetailsBase[];
}

/**
 * Extends a base Claim with additional details.
 *
 * Has bigints instead of strings
 *
 * @typedef {Object} ClaimDetails
 * @extends {ClaimDetailsBase}
 *
 * @see ClaimDetailsBase
 */
export interface ClaimDetails {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challengeDetails: ChallengeDetails[];
}

/**
 * Extends a base Claim with additional details.
 *
 * Has strings instead of bigints
 * @typedef {Object} s_ClaimDetails
 * @extends {ClaimDetailsBase}
 *
 * @see ClaimDetailsBase
 */
export interface s_ClaimDetails {
  name: string;
  description: string;
  hasPassword: boolean;
  password?: string;

  challengeDetails: s_ChallengeDetails[];
}

export function convertToClaimDetails(s_claim: s_ClaimDetails): ClaimDetails {
  return {
    ...s_claim,
    challengeDetails: s_claim.challengeDetails.map(convertToChallengeDetails),
  }
}

export function convertFromClaimDetails(claim: ClaimDetails): s_ClaimDetails {
  return {
    ...claim,
    challengeDetails: claim.challengeDetails.map(convertFromChallengeDetails),
  }
}

export interface FetchDocumentBase {
  content: MetadataBase | ClaimDetailsBase | BalancesMap
  fetchedAt: number, //Date.now()
  db: 'Claim' | 'Metadata' | 'Balances'
  isPermanent: boolean
}

export interface FetchDocument extends FetchDocumentBase {
  content: Metadata | ClaimDetails | BalancesMap
}

export interface s_FetchDocument extends FetchDocumentBase {
  content: s_Metadata | s_ClaimDetails | BalancesMap
}

export function convertToFetchDocument(s_doc: s_FetchDocument): FetchDocument {
  return {
    ...s_doc,
    content: s_doc.db === 'Claim' ? convertToClaimDetails(s_doc.content as s_ClaimDetails) : s_doc.content as BalancesMap | Metadata,
  }
}

export function convertFromFetchDocument(doc: FetchDocument): s_FetchDocument {
  return {
    ...doc,
    content: doc.db === 'Claim' ? convertFromClaimDetails(doc.content as ClaimDetails) : doc.content as BalancesMap | Metadata,
  }
}


export interface RefreshDocumentBase {
  collectionId: string,
  refreshRequestTime: number //Date.now()
}

export interface RefreshDocument extends RefreshDocumentBase { }

export interface s_RefreshDocument extends RefreshDocumentBase { }

export function convertToRefreshDocument(s_doc: s_RefreshDocument): RefreshDocument {
  return {
    ...s_doc,
  }
}

export function convertFromRefreshDocument(doc: RefreshDocument): s_RefreshDocument {
  return {
    ...doc,
  }
}
