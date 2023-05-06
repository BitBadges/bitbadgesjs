import { BadgeUri, Balance, Claims, IdRange, TransferMapping, UserBalance } from "bitbadgesjs-proto";
import { Metadata } from "./metadata";
import { Permissions } from "./permissions";

/**
 * CollectionDocument is the type of document stored in the collections database (see documentation for more info)
 *
 * collectionId is the collection ID
 * collectionUri is the URI of the collection
 * badgeUris is the list of badge URIs for this collection and their respective badge IDs
 * bytes is an arbitrary string of bytes that can be used to store arbitrary data
 * manager is the account number of the manager of this collection
 * permissions is the permissions of the manager of this collection
 * disallowedTransfers is the list of disallowed transfers for this collection
 * managerApprovedTransfers is the list of manager approved transfers for this collection
 * nextBadgeId is the next badge ID to be minted for this collection
 * unmintedSupplys is the list of unminted supplies for this collection
 * maxSupplys is the list of max supplies for this collection
 * standard is the standard of this collection
 * managerRequests is the list of manager requests for this collection
 * createdBlock is the block number when this collection was created
 */
export interface CollectionDocument {
  collectionId: number;
  collectionUri: string;
  badgeUris: BadgeUri[];
  bytes: string;
  manager: number;
  permissions: Permissions;
  disallowedTransfers: TransferMapping[];
  managerApprovedTransfers: TransferMapping[];
  nextBadgeId: number;
  unmintedSupplys: Balance[];
  maxSupplys: Balance[];
  standard: number;
  managerRequests: number[];
  createdBlock: number;
}

/**
 * AccountDocument is the type of document stored in the accounts database
 *
 * cosmosAddress, accountNumber, address, and chain are the account information
 * seenActivity is the timestamp of the last activity seen for this account (via Date.now())
 * createdAt is the timestamp of when this account was created (via Date.now())
 * accountNumber will be -1 if the account is not yet registered on the chain
 *
 * username, discord, twitter, github, telegram, and readme are the profile customization fields
 *
 *
 * Other information like resolvedName, avatar, balance, etc are loaded dynamically each time the account is fetched (see BitBadgesUserInfo)
 */
export interface AccountDocument {
  cosmosAddress: string,
  accountNumber: number,
  chain: string,
  address: string,
  seenActivity?: number,
  createdAt?: number,

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
 * metadataId is the metadata ID for the respective collection.
 * The id for the metadata document is calculated deterministically from badgeUris field (see metadata.ts).
 * metadataId == 0 - collection metadata
 * metadataId > 0 - badge metadata
 *
 * uri is the URI of the metadata
 * badgeIds is the range of badge IDs that this metadata document is responsible for
 * isCollection is true if this is a collection metadata document
 * metadata is the metadata object
 */
export interface MetadataDocument {
  metadata: Metadata
  badgeIds: IdRange[]
  isCollection: boolean
  metadataId: number
  uri: string
}

/** STATUS TYPES **/
export interface IndexerStatus {
  status: DbStatus
}

export interface LatestBlockStatus {
  height: number
}

/**
 * DbStatus represents the status document stored in the database
 *
 * block is the latest synced block status (i.e. height).
 * nextCollectionId is the next collection ID to be used.
 * queue is the queue of metadata to be fetched / handled
 * gasPrice is the current gas price based on the lastXGasPrices
 */
export interface DbStatus {
  block: LatestBlockStatus;
  nextCollectionId: 1;
  /**
   * Represents the queue of metadata to be fetched / handled
   *
   * startingMetadataId is the metadata ID that the queue started at
   * currentMetadataId is the metadata ID that the queue is currently at
   * uri is the URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds
   * collectionId is the collection ID of the metadata to be fetched
   * collection is true if the metadata to be fetched is collection metadata
   * badgeIds is the range of badge IDs that the metadata is responsible for
   * numCalls is the number of times this queue item has been called (after X times, it will be sent to the back of the queue)
   * purge is true if we should purge excess documents for this collection from the database (e.g. if a collection is deleted or metadata is updated)
   */
  queue: {
    startMetadataId: number,
    currentMetadataId: number | 'collection',
    uri: string,
    collectionId: number,
    collection: boolean,
    badgeIds: IdRange[],
    numCalls: number,
    specificId?: number,
    purge?: boolean
  }[],
  gasPrice: number;
  lastXGasPrices: number[];
}

/**
 * BalanceDocument is the type of document stored in the balances database
 * Partitioned database by collection ID (e.g. 1-1...-0, 1-2...-1, and so on represent the balances documents for collection 1 and user with account number 1, 2, etc)
 *
 * collectionId is the collection ID
 * cosmosAddress is the Cosmos address of the user
 * accountNumber is the account number of the user
 * balances is the list of balances for this user
 * approvals is the list of approvals for this user
 */
export interface BalanceDocument extends UserBalance {
  collectionId: number;
  cosmosAddress: string;
}

/**
 * TODO: rework this
 */
export interface PasswordDocument {
  password: string
  codes: string[]

  currCode: number
  claimedUsers: {
    [cosmosAddress: string]: number
  }

  cid: string
  docClaimedByCollection: boolean
  claimId: number
  collectionId: number
}


/**
 * ClaimDocument is the type of document stored in the claims database
 * partitioned database by collection ID (e.g. 1-1, 1-2, and so on represent the claims collection 1 for claims with ID 1, 2, etc)
 *
 * collectionId is the collection ID
 * claimId is the claim ID
 *
 * addresses is the list of whitelisted addresses
 * hashedCodes is the list of hashed codes for this claim
 *
 * name is the name of the claim
 * description is the description of the claim
 *
 * hasPassword is true if this claim has a password (which is stored in the password database (if created through this indexer))
 *
 * failedToFetch is true if the claim failed to fetch the URI and inserted blank values (e.g. if the claim was deleted)
 *
 * usedClaims is the list of used claims for this claim
 */
export interface ClaimDocument extends Claims {
  collectionId: number;
  claimId: number;

  addresses: string[];
  hashedCodes: string[]; //leaves layer - 1

  name: string;
  description: string;
  hasPassword: boolean;

  failedToFetch?: boolean;

  usedClaims: {
    codes: {
      [code: string]: number;
    },
    numUsed: number,
    addresses: {
      [cosmosAddress: string]: number;
    }
  }
}
