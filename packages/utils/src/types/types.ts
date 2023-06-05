import { IdRange, NumberType, StringNumber, UserBalance, convertIdRange, convertUserBalance } from "bitbadgesjs-proto";
import { Metadata, convertMetadata } from "./metadata";
import { BitBadgesUserInfo, convertBitBadgesUserInfo } from "./users";
import { BitBadgesCollection, convertBitBadgesCollection } from "./collections";

/**
 * Many of the core types are loaded from the bitbadgesjs-proto package.
 * This is to avoid doubly exporting types.
 */

/*
  Used by the frontend for dynamically fetching data from the DB as needed
*/
export interface CollectionMap<T extends NumberType> {
  [collectionId: string]: BitBadgesCollection<T> | undefined
}

export type b_CollectionMap = CollectionMap<bigint>;
export type s_CollectionMap = CollectionMap<string>;
export type n_CollectionMap = CollectionMap<number>;
export type d_CollectionMap = CollectionMap<StringNumber>;

export function convertCollectionMap<T extends NumberType, U extends NumberType>(item: CollectionMap<T>, convertFunction: (item: T) => U): CollectionMap<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? convertBitBadgesCollection(value, convertFunction) : undefined];
  }));
}

/**
 * AccountMap is used to store the user information by address.
 *
 * @typedef {Object} AccountMap
 */
export interface AccountMap<T extends NumberType> {
  [cosmosAddress: string]: BitBadgesUserInfo<T> | undefined;
}

export type b_AccountMap = AccountMap<bigint>;
export type s_AccountMap = AccountMap<string>;
export type n_AccountMap = AccountMap<number>;
export type d_AccountMap = AccountMap<StringNumber>;

export function convertAccountMap<T extends NumberType, U extends NumberType>(item: AccountMap<T>, convertFunction: (item: T) => U): AccountMap<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? convertBitBadgesUserInfo(value, convertFunction) : undefined];
  }));
}


/**
 * BalanceMap is used to store the balances of users by address.
 *
 * @typedef {Object} BalanceMap
 */
export interface BalancesMap<T extends NumberType> {
  [cosmosAddress: string]: UserBalance<T> | undefined;
}

export type b_BalancesMap = BalancesMap<bigint>;
export type s_BalancesMap = BalancesMap<string>;
export type n_BalancesMap = BalancesMap<number>;
export type d_BalancesMap = BalancesMap<StringNumber>;

export function convertBalancesMap<T extends NumberType, U extends NumberType>(item: BalancesMap<T>, convertFunction: (item: T) => U): BalancesMap<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? convertUserBalance(value, convertFunction) : undefined];
  }));
}

/**
 * MetadataMap is used to store the metadata of badges by metadataId.
 *
 * @typedef {Object} MetadataMap
 */
export interface MetadataMap<T extends NumberType> {
  [metadataId: string]: {
    badgeIds: IdRange<T>[],
    metadata: Metadata<T>,
    uri: string
  } | undefined;
}

export type b_MetadataMap = MetadataMap<bigint>;
export type s_MetadataMap = MetadataMap<string>;
export type n_MetadataMap = MetadataMap<number>;
export type d_MetadataMap = MetadataMap<StringNumber>;

export function convertMetadataMap<T extends NumberType, U extends NumberType>(item: MetadataMap<T>, convertFunction: (item: T) => U): MetadataMap<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? {
      badgeIds: value.badgeIds.map((badgeId) => convertIdRange(badgeId, convertFunction)),
      metadata: convertMetadata(value.metadata, convertFunction),
      uri: value.uri
    } : undefined];
  }));
}

/**
 * SupportedChain is an enum of all the supported chains.
 * Currently, we only support Ethereum and Cosmos.
 *
 * Has an UNKNOWN value for when we don't know the chain yet.
 *
 * @typedef {string} SupportedChain
 */
export enum SupportedChain {
  ETH = 'Ethereum',
  COSMOS = 'Cosmos',
  UNKNOWN = 'Unknown' //If unknown address, we don't officially know the chain yet. For now, we assume it's Ethereum
}

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
 */
export enum DistributionMethod {
  None = 'None',
  FirstComeFirstServe = 'First Come First Serve',
  Whitelist = 'Whitelist',
  Codes = 'Codes',
  Unminted = 'Unminted',
  JSON = 'JSON',
  DirectTransfer = 'Direct Transfer',
}

/**
 * MetadataAddMethod is used to determine how metadata is entered.
 *
 * @typedef {string} MetadataAddMethod
 *
 * Manual: Manually enter the metadata for each badge
 * UploadUrl: Enter a URL that will be used to fetch the metadata for each badge
 * CSV: Upload a CSV file that will be used to fetch the metadata for each badge
 */
export enum MetadataAddMethod {
  None = 'None',
  Manual = 'Manual',
  UploadUrl = 'Insert Custom Metadata Url (Advanced)',
  CSV = 'CSV',
}
