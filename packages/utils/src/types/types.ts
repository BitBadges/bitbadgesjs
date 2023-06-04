import { IdRangeWithType, NumberType, StringNumber, UserBalanceWithType, convertIdRange, convertUserBalance } from "bitbadgesjs-proto";
import { CollectionResponse } from "./api";
import { MetadataWithType, convertMetadata } from "./metadata";
import { BitBadgesUserInfoWithType, convertBitBadgesUserInfo } from "./users";

/**
 * Many of the core types are loaded from the bitbadgesjs-proto package.
 * This is to avoid doubly exporting types.
 */

/*
  Used by the frontend for dynamically fetching data from the DB as needed
*/
export interface CollectionMap {
  [collectionId: string]: CollectionResponse | undefined
}

/**
 * AccountMap is used to store the user information by address.
 *
 * @typedef {Object} AccountMapWithType
 */
export interface AccountMapWithType<T extends NumberType> {
  [cosmosAddress: string]: BitBadgesUserInfoWithType<T> | undefined;
}

export type AccountMap = AccountMapWithType<bigint>;
export type s_AccountMap = AccountMapWithType<string>;
export type n_AccountMap = AccountMapWithType<number>;
export type d_AccountMap = AccountMapWithType<StringNumber>;

export function convertAccountMap<T extends NumberType, U extends NumberType>(item: AccountMapWithType<T>, convertFunction: (item: T) => U): AccountMapWithType<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? convertBitBadgesUserInfo(value, convertFunction) : undefined];
  }));
}


/**
 * BalanceMap is used to store the balances of users by address.
 *
 * @typedef {Object} BalanceMapWithType
 */
export interface BalancesMapWithType<T extends NumberType> {
  [cosmosAddress: string]: UserBalanceWithType<T> | undefined;
}

export type BalancesMap = BalancesMapWithType<bigint>;
export type s_BalancesMap = BalancesMapWithType<string>;
export type n_BalancesMap = BalancesMapWithType<number>;
export type d_BalancesMap = BalancesMapWithType<StringNumber>;

export function convertBalancesMap<T extends NumberType, U extends NumberType>(item: BalancesMapWithType<T>, convertFunction: (item: T) => U): BalancesMapWithType<U> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    return [key, value ? convertUserBalance(value, convertFunction) : undefined];
  }));
}

/**
 * MetadataMap is used to store the metadata of badges by metadataId.
 *
 * @typedef {Object} MetadataMapWithType
 */
export interface MetadataMapWithType<T extends NumberType> {
  [metadataId: string]: {
    badgeIds: IdRangeWithType<T>[],
    metadata: MetadataWithType<T>,
    uri: string
  } | undefined;
}

export type MetadataMap = MetadataMapWithType<bigint>;
export type s_MetadataMap = MetadataMapWithType<string>;
export type n_MetadataMap = MetadataMapWithType<number>;
export type d_MetadataMap = MetadataMapWithType<StringNumber>;

export function convertMetadataMap<T extends NumberType, U extends NumberType>(item: MetadataMapWithType<T>, convertFunction: (item: T) => U): MetadataMapWithType<U> {
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
