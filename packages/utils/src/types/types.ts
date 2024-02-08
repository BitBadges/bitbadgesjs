import { NumberType, UserBalanceStore, convertUserBalanceStore } from "bitbadgesjs-proto";
import { BitBadgesCollection, convertBitBadgesCollection } from "./collections";
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./users";

/**
  Used by the frontend for dynamically fetching data from the DB as neede

  @category API / Indexer
*/
export interface CollectionMap<T extends NumberType> {
  [collectionId: string]: BitBadgesCollection<T> | undefined
}

/**
 * @category API / Indexer
 */
export function convertCollectionMap<T extends NumberType, U extends NumberType>(item: CollectionMap<T>, convertFunction: (item: T) => U): CollectionMap<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? convertBitBadgesCollection(value, convertFunction) : undefined];
  }));
}

/**
 * AccountMap is used to store the user information by address.
 *
 * @typedef {Object} AccountMap
 *
 * @category API / Indexer
 */
export interface AccountMap<T extends NumberType> {
  [cosmosAddress: string]: BitBadgesUserInfo<T> | undefined;
}

/**
 * @category API / Indexer
 */
export function convertAccountMap<T extends NumberType, U extends NumberType>(item: AccountMap<T>, convertFunction: (item: T) => U): AccountMap<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? convertBitBadgesUserInfo(value, convertFunction) : undefined];
  }));
}


/**
 * BalanceMap is used to store the balances of users by address.
 *
 * @typedef {Object} BalanceMap
 *
 * @category API / Indexer
 */
export interface BalancesMap<T extends NumberType> {
  [cosmosAddress: string]: UserBalanceStore<T> | undefined;
}

/**
 * @category API / Indexer
 */
export function convertBalancesMap<T extends NumberType, U extends NumberType>(item: BalancesMap<T>, convertFunction: (item: T) => U): BalancesMap<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? convertUserBalanceStore(value, convertFunction) : undefined];
  }));
}

/**
 * SupportedChain is an enum of all the supported chains.
 *
 * Has an UNKNOWN value for when we don't know the chain yet.
 *
 * @typedef {string} SupportedChain
 *
 * @category API / Indexer
 */
export enum SupportedChain {
  BTC = 'Bitcoin',
  ETH = 'Ethereum',
  COSMOS = 'Cosmos',
  SOLANA = 'Solana',
  UNKNOWN = 'Unknown' //If unknown address, we don't officially know the chain yet. For now, we assume it's Ethereum
}

/**
 * @category API / Indexer
 */
export enum TransactionStatus {
  None = 0,
  AwaitingSignatureOrBroadcast = 1,
}

/**
 * DistributionMethod is used to determine how badges are distributed.
 *
 * @typedef {string} DistributionMethod
 * @enum {string}
 *
 * @property {string} None - No distribution method is set
 * @property {string} FirstComeFirstServe - Badges are distributed on a first come first serve basis
 * @property {string} Whitelist - Badges are distributed to a whitelist of addresses
 * @property {string} Codes - Badges are distributed to addresses that have a code / password
 * @property {string} Unminted - Do nothing. Badges are not distributed.
 * @property {string} JSON - Upload a JSON file to specify how to distribute badges
 * @property {string} DirectTransfer - Transfer badges directly to users (no claim)
 *
 * @category API / Indexer
 */
export enum DistributionMethod {
  None = 'None',
  FirstComeFirstServe = 'First Come First Serve',
  Whitelist = 'Whitelist',
  Codes = 'Codes',
  Unminted = 'Unminted',
  JSON = 'JSON',
  DirectTransfer = 'Direct Transfer',
  OffChainBalances = 'Off-Chain Balances'
}

/**
 * MetadataAddMethod is used to determine how metadata is entered.
 *
 * @typedef {string} MetadataAddMethod
 *
 * Manual: Manually enter the metadata for each badge
 * UploadUrl: Enter a URL that will be used to fetch the metadata for each badge
 * CSV: Upload a CSV file that will be used to fetch the metadata for each badge
 *
 * @category API / Indexer
 */
export enum MetadataAddMethod {
  None = 'None',
  Manual = 'Manual',
  UploadUrl = 'Insert Custom Metadata Url (Advanced)'
}
