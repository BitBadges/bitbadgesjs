//TODO: We doubly export a lot that we already export in bitbadgesjs-proto. We should probably just export from one or the other.
import { Permissions } from "./permissions";
import { MerkleTree } from "merkletreejs"

export interface IdRange {
  start: number;
  end: number;
}

export interface BadgeSupplyAndAmount {
  amount: number;
  supply: number;
}

export interface Balance {
  balance: number;
  badgeIds: IdRange[];
}

export interface BadgeUri {
  uri: string;
  badgeIds: IdRange[];
}

export interface TransferMapping {
  to: Addresses;
  from: Addresses;
}

export interface TransferMappingWithUnregisteredUsers extends TransferMapping {
  toUnregisteredUsers: string[];
  fromUnregisteredUsers: string[];
  removeToUsers: boolean;
  removeFromUsers: boolean;
}


export interface Transfers {
  toAddresses: number[];
  balances: Balance[];
}

export interface TransfersExtended extends Transfers {
  toAddressInfo?: (BitBadgesUserInfo)[],
  numCodes?: number,
  numIncrements?: number,
  incrementBy?: number,
  password?: string
  timeRange?: IdRange | undefined;
  toAddressesLength?: number;
  name?: string;
  description?: string;
}

export interface ClaimItemWithTrees extends ClaimItem {
  addressesTree: MerkleTree;
  codeTree: MerkleTree;
}

export interface ClaimItem extends Claims {
  addresses: string[];
  hasPassword: boolean;

  name?: string;
  description?: string;

  codes: string[];
  hashedCodes: string[]; //leaves

  password?: string;
  numCodes?: number;
  numIncrements?: number;
  failedToFetch?: boolean;
}

export interface IndexerStatus {
  status: DbStatus
}

export interface Claims {
  balances: Balance[];
  codeRoot: string;
  whitelistRoot: string;
  uri: string;
  timeRange: IdRange;
  restrictOptions: number;
  amount: number;
  badgeIds: IdRange[];
  incrementIdsBy: number;
  expectedMerkleProofLength: number
}

export interface BitBadgeCollection {
  collectionId: number;
  collectionUri: string;
  badgeUris: BadgeUri[];
  bytes: string;
  manager: BitBadgesUserInfo;
  permissions: Permissions;
  disallowedTransfers: TransferMapping[];
  managerApprovedTransfers: TransferMapping[];
  nextBadgeId: number;
  unmintedSupplys: Balance[];
  maxSupplys: Balance[];
  claims: ClaimItem[];
  standard: number;
  collectionMetadata: BadgeMetadata,
  badgeMetadata: BadgeMetadataMap,
  activity: TransferActivityItem[],
  announcements: AnnouncementActivityItem[],
  reviews: ReviewActivityItem[],
  usedClaims: {
    [claimId: string]: {
      codes: {
        [code: string]: number;
      },
      numUsed: number,
      addresses: {
        [cosmosAddress: string]: number;
      }
    }
  };
  originalClaims: ClaimItem[];
  managerRequests: number[];
  userList: string[];
  balances: BalancesMap,
  createdBlock: number;
}

export interface BalanceObject {
  balance: number,
  idRanges: IdRange[]
}

export interface GetBalanceResponse {
  error?: any;
  balance?: UserBalance;
}

export interface UserBalance {
  balances: Balance[];
  approvals: Approval[];
}

export interface Approval {
  address: number;
  balances: Balance[];
}

export interface PendingTransfer {
  subbadgeRange: IdRange;
  thisPendingNonce: number;
  otherPendingNonce: number;
  amount: number;
  sent: boolean;
  to: number;
  from: number;
  approvedBy: number;
  markedAsAccepted: boolean;
  expirationTime: number;
  cantCancelBeforeTime: number;
}


export interface BadgeMetadata {
  name: string;
  description: string;
  image: string;
  creator?: string;
  validFrom?: IdRange;
  color?: string;
  type?: number;
  category?: string;
  externalUrl?: string;
  tags?: string[];
}

export interface SubassetSupply {
  supply: number;
  amount: number;
}

export interface BitBadgesUserInfo {
  cosmosAddress: string,
  accountNumber: number,
  chain: string,
  address: string,
  name?: string
  resolvedName?: string
  avatar?: string
  discord?: string
  twitter?: string
  github?: string
  telegram?: string
  readme?: string
}

export interface LatestBlockStatus {
  height: number
}

export interface BadgeUri {
  uri: string
  badgeIds: IdRange[];
}

export interface DbStatus {
  block: LatestBlockStatus;
  nextCollectionId: 1;
  queue: {
    startingBatchId: number,
    uri: string,
    collectionId: number,
    collection: boolean,
    badgeIds: IdRange[],
    batchId: number | 'collection',
    numCalls: number,
    specificId?: number,
    purge?: boolean
  }[],
  gasPrice: number;
  lastXGasPrices: number[];
}

export interface StoredBadgeCollection {
  collectionId: number;
  collectionUri: string;
  badgeUris: BadgeUri[];
  bytes: string;
  manager: number;
  permissions: number;
  disallowedTransfers: TransferMapping[];
  managerApprovedTransfers: TransferMapping[];
  nextBadgeId: number;
  unmintedSupplys: Balance[];
  maxSupplys: Balance[];
  claims: Claims[];
  standard: number;
  collectionMetadata: BadgeMetadata,
  badgeMetadata: BadgeMetadataMap,
  usedClaims: {
    [claimId: string]: {
      codes: {
        [code: string]: number;
      },
      numUsed: number,
      addresses: {
        [cosmosAddress: string]: number;
      }
    }
  };
  originalClaims: Claims[];
  managerRequests: number[];
  balances: BalancesMap;
  createdBlock: number;
  userList: string[];
}

export interface ActivityItem {
  method: string;
  users: IdRange[];
  timestamp: number;
  block: number;

}

export interface ReviewActivityItem extends ActivityItem {
  review: string;
  stars: number;
  from: number;
  collectionId?: number;
  cosmosAddress?: string;
}

export interface AnnouncementActivityItem extends ActivityItem {
  announcement: string;
  from: number;
  collectionId: number;
}

export interface TransferActivityItem extends ActivityItem {
  to: number[];
  from: (number | 'Mint')[];
  balances: Balance[];
  collectionId: number;
}

export interface CollectionMap {
  [collectionId: string]: {
    collection: BitBadgeCollection,
    pagination: {
      activity: PaginationInfo
      announcements: PaginationInfo
      reviews: PaginationInfo
    },
  } | undefined
}

export interface AccountMap {
  [cosmosAddress: string]: BitBadgesUserInfo;
}

export interface BalancesMap {
  [accountNumber: number]: UserBalance;
}

export interface BadgeMetadataMap {
  [batchId: string]: {
    badgeIds: IdRange[],
    metadata: BadgeMetadata,
    uri: string
  }
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


export interface IdRange {
  start: number;
  end: number;
}
export interface BadgeSupplyAndAmount {
  amount: number;
  supply: number;
}
export interface Balance {
  balance: number;
  badgeIds: IdRange[];
}
export interface Addresses {
  accountIds: IdRange[];
  options: number;
}
export interface Transfers {
  toAddresses: number[];
  balances: Balance[];
}

export enum DistributionMethod {
  None,
  FirstComeFirstServe,
  Whitelist,
  Codes,
  Unminted,
  JSON
}

export enum MetadataAddMethod {
  None = 'None',
  Manual = 'Manual',
  UploadUrl = 'Insert Custom Metadata Url (Advanced)',
  CSV = 'CSV',
}



export interface Proof {
  total: number;
  index: number;
  leafHash: string;
  proof: string[];
}


export interface BalanceObject {
  balance: number,
  idRanges: IdRange[]
}

export interface BitBadgeMintObject {
  standard?: number;
  permissions?: number;
  metadata?: BadgeMetadata;
  badgeSupplys?: SubassetSupply[];
}

export interface GetBalanceResponse {
  error?: any;
  balance?: UserBalance;
}

export interface UserBalance {
  balances: Balance[];
  approvals: Approval[];
}

export interface Approval {
  address: number;
  balances: Balance[];
}

export interface PendingTransfer {
  subbadgeRange: IdRange;
  thisPendingNonce: number;
  otherPendingNonce: number;
  amount: number;
  sent: boolean;
  to: number;
  from: number;
  approvedBy: number;
  markedAsAccepted: boolean;
  expirationTime: number;
  cantCancelBeforeTime: number;
}


export interface BadgeMetadata {
  name: string;
  description: string;
  image: string;
  creator?: string;
  validFrom?: IdRange;
  color?: string;
  type?: number;
  category?: string;
  externalUrl?: string;
  tags?: string[];
}

export interface SubassetSupply {
  supply: number;
  amount: number;
}

export interface CosmosAccountInformation {
  account_number: number;
  sequence: number;
  pub_key: {
    key: string;
  }
  address: string;
}


export interface PaginationInfo {
  bookmark: string,
  hasMore: boolean,
}
