import { Claims, IdRange, TransferMapping, Transfers, UserBalance } from "bitbadgesjs-proto";
import { MerkleTree } from "merkletreejs";
import { BitBadgesUserInfo, CollectionResponse } from "./api";
import { Metadata } from "./metadata";
import { ClaimDocument } from "./db";

/**
 * Many of the core types are loaded from the bitbadgesjs-proto package.
 * This is to avoid doubly exporting types.
 */


/**
 * DistributionDetails is used when generating a Msg for creating claims or distributing badges.
 *
 * We use the same type for both claims and direct transfers because they are very similar. For direct transfers, we just ignore
 * some of the fields.
 *
 * We can then use the methods in claims.ts to convert the DistributionDetails into a Claims[] or Transfers[].
 *
 * distributionMethod = DirectTransfer: Will be a direct transfer, and the badges will be sent directly to the addresses.
 * distributionMethod != DirectTransfer: Will be a claim, and the badges will be able to be claimed by users, according to the distributionMethod.
 *
 * Inherits all base fields from Claims.
 *
 * addressesTree and codeTree are used to generate the Merkle Trees for the claims.
 * addresses are the whitelist of addresses that can claim the badges, if any.
 * codes are the list of codes that are redeemable for badges, if any.
 *    These codes are to be kept secret and only given to the intended recipients.
 * hashedCodes are the list of hashed codes, if any (aka merkle tree leaves layer - 1).
 *    The hashed codes are stored in the DB in order to create the Merkle Tree.
 *    When a valid code is provided, we can then find the corresponding hashed code to generate the Merkle Proof.
 * numCodes is the number of codes to generate. This takes priority over codes.length or hashedCodes.length if defined.
 *    This is used for buffer time between num codes entered and code generation.
 * hasPassword is whether or not the claim requires a password to be entered.
 * password is the password required to claim the badges. This is to be kept secret.
 *
 * name and description are metadata details provided about the claim.
 */
export interface DistributionDetails extends Claims {
  addressesTree?: MerkleTree;
  codeTree?: MerkleTree;

  addresses: string[];
  codes: string[];
  hashedCodes: string[];

  //This takes priority over codes.length or hashedCodes.length if defined (used for buffer time between num codes entered and code generation)
  numCodes?: number;

  hasPassword?: boolean;
  password?: string;

  name?: string;
  description?: string;

  distributionMethod: DistributionMethod;
}



/**
 * This is a type that is used to better handle batch transfers, potentially with incremented badgeIDs for claims.
 *
 * Inherits all base fields from Transfers.
 * toAddressesLength is the number of addresses to send the badges to.
 *    This takes priority over toAddresses.length (used when you don't know exact addresses (i.e. codes))
 * incrementIdsBy is the number to increment the badgeIDs by for each transfer.
 *
 * For example, if you have 100 addresses and want to send 1 badge to each address,
 * you would set toAddressesLength to 100 and incrementIdsBy to 1. This would send badgeIDs 1 to the first address,
 * 2 to the second, and so on.
 */
export interface TransfersExtended extends Transfers {
  toAddressesLength?: number; //This takes priority over toAddresses.length (used when you don't know exact addresses (i.e. codes))
  incrementIdsBy?: number;
}


/**
 * If the Merkle trees are needed to be generated, we can use this type along with MerkleTree.js to generate the trees.
 * Note trees are to be generated on the frontend. This type will leave the trees undefined initially when returned from the API.
 *
 * Inherits all base fields from ClaimDocument.
 *
 * Adds the addressesTree and codeTree fields, which are used to generate the Merkle Trees for the claims.
 */
export interface ClaimDocumentWithTrees extends ClaimDocument {
  addressesTree?: MerkleTree;
  codeTree?: MerkleTree;
}

/**
 * This is used to handle transfer mappings with unregistered users.
 * If a user is not registered, we cannot create the TransferMapping until they are registered.
 * This type is used to cache the unregistered users and describe how to handle them when they are registered.
 *
 * Inherits all base fields from TransferMapping.
 *
 * toUnregisteredUsers is the list of unregistered users that are in the to part of the mapping
 * fromUnregisteredUsers is the list of unregistered users that are in the from part of the mapping
 * removeToUsers is whether or not to remove the users in toUnregisteredUsers from the mapping. Else, we add them.
 * removeFromUsers is whether or not to remove the users in fromUnregisteredUsers from the mapping. Else, we add them.
 */
export interface TransferMappingWithUnregisteredUsers extends TransferMapping {
  toUnregisteredUsers: string[];
  fromUnregisteredUsers: string[];
  removeToUsers: boolean; //If true, remove the users in toUnregisteredUsers from the mapping. Else, add them.
  removeFromUsers: boolean; //If true, remove the users in fromUnregisteredUsers from the mapping. Else, add them.
}

/*
  Used by the frontend for dynamically fetching data from the DB as needed
*/
export interface CollectionMap {
  [collectionId: string]: CollectionResponse | undefined
}

export interface AccountMap {
  [cosmosAddress: string]: BitBadgesUserInfo | undefined;
}

export interface BalancesMap {
  [accountNumber: string]: UserBalance | undefined;
}

export interface MetadataMap {
  [metadataId: string]: {
    badgeIds: IdRange[],
    metadata: Metadata,
    uri: string
  } | undefined;
}

export enum SupportedChain {
  ETH = 'Ethereum',
  COSMOS = 'Cosmos',
  UNKNOWN = 'Unknown'
}

export enum TransactionStatus {
  None = 0,
  AwaitingSignatureOrBroadcast = 1,
}

/**
 * DistributionMethod is used to determine how badges are distributed.
 *
 * None: No distribution method is set
 * FirstComeFirstServe: Badges are distributed on a first come first serve basis
 * Whitelist: Badges are distributed to a whitelist of addresses
 * Codes: Badges are distributed to addresses that have a code / password
 * Unminted: Do nothing. Badges are not distributed.
 * JSON: Upload a JSON file to specify how to distribute badges
 * DirectTransfer: Transfer badges directly to users (no claim)
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
