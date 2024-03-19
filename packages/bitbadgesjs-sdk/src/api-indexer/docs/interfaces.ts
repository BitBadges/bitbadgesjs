import type { Doc } from '@/api-indexer/base';
import type { iMetadata } from '@/api-indexer/metadata/metadata';
import type { JSPrimitiveNumberType, NumberType } from '@/common/string-numbers';
import type { SupportedChain } from '@/common/types';
import type { iApprovalInfoDetails, iChallengeDetails, iUserOutgoingApprovalWithDetails } from '@/core/approvals';
import type { iBatchBadgeDetails } from '@/core/batch-utils';
import type { iCosmosCoin } from '@/core/coin';
import type { iOffChainBalancesMap } from '@/core/transfers';
import type { iCollectionApproval, iIncrementedBalances, iUserIncomingApprovalWithDetails } from '@/interfaces/badges/approvals';
import type {
  iAddressList,
  iAmountTrackerIdDetails,
  iApprovalIdentifierDetails,
  iBadgeMetadataTimeline,
  iBalance,
  iCollectionMetadataTimeline,
  iCustomDataTimeline,
  iIsArchivedTimeline,
  iManagerTimeline,
  iOffChainBalancesMetadataTimeline,
  iStandardsTimeline,
  iUintRange
} from '@/interfaces/badges/core';
import type { iCollectionPermissions, iUserPermissionsWithDetails } from '@/interfaces/badges/permissions';
import type { iUserBalanceStore } from '@/interfaces/badges/userBalances';
import type { iProtocol } from '@/transactions/messages/bitbadges/protocols/interfaces';
import type { AndGroup, ChallengeParams, OrGroup, OwnershipRequirements } from 'blockin';
import { BlockinAssetConditionGroup } from '../requests/blockin';

/**
 * @category Interfaces
 */
export interface iNotificationPreferences<T extends NumberType> {
  email?: string;
  emailVerification?: iEmailVerificationStatus<T>;
  preferences?: {
    listActivity?: boolean;
    transferActivity?: boolean;
    claimAlerts?: boolean;
  };
}

/**
 * @category Interfaces
 */
export interface iEmailVerificationStatus<T extends NumberType> {
  verified?: boolean;
  token?: string;
  expiry?: T;
  antiPhishingCode?: string;
}

/**
 * @category Interfaces
 */
export interface iActivityDoc<T extends NumberType> extends Doc {
  /** The timestamp  of the activity. */
  timestamp: T;

  /** The block number of the activity. */
  block: T;

  /** Whether or not the notifications have been handled by the indexer or not. */
  _notificationsHandled?: boolean;
}

/**
 * @category Interfaces
 */
export interface iReviewDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The review text (max 2048 characters). */
  review: string;
  /** The number of stars given (1-5). */
  stars: T;
  /** The cosmos address of the user who gave the review. */
  from: string;
  /** The collection ID of the collection that was reviewed. Only applicable to collection reviews. */
  collectionId?: T;
  /** The cosmos address of the user who the review is for. Only applicable to user reviews. */
  reviewedAddress?: string;
}

/**
 * @category Interfaces
 */
export interface iTransferActivityDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The list of cosmos addresses that were involved in the activity. */
  to: string[];
  /** The list of cosmos addresses that were involved in the activity. */
  from: string;
  /** The list of balances and badge IDs that were transferred. */
  balances: iBalance<T>[];
  /** The collection ID of the collection that was transferred. */
  collectionId: T;
  /** The memo of the transfer. */
  memo?: string;
  /** Which approval to use to precalculate the balances. */
  precalculateBalancesFromApproval?: iApprovalIdentifierDetails;
  /** The prioritized approvals of the transfer. */
  prioritizedApprovals?: iApprovalIdentifierDetails[];
  /** Whether or not to only check prioritized approvals. */
  onlyCheckPrioritizedApprovals?: boolean;
  /** The cosmos address of the user who initiated the activity. */
  initiatedBy: string;
  /** The transaction hash of the activity. */
  txHash?: string;
}

/**
 * @category Interfaces
 */
export interface iListActivityDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The list ID of the list. */
  listId: string;
  /** Whether or not the address is included in the list. Note that this could mean added to an whitelist or a blacklist */
  addedToList?: boolean;
  /** The list of addresses that were added or removed from the list. */
  addresses?: string[];
  /** The transaction hash of the activity. */
  txHash?: string;
}

/**
 * @category Interfaces
 */
export interface iClaimAlertDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The code of the claim alert. */
  code?: string;
  /** The cosmos addresses of the users that have been alerted. */
  cosmosAddresses: string[];
  /** The collection ID of the claim alert. */
  collectionId: T;
  /** The message of the claim alert. */
  message?: string;
}

/**
 * @category Interfaces
 */
export interface iCollectionDoc<T extends NumberType> extends Doc {
  /** The collection ID */
  collectionId: T;
  /** The collection metadata timeline */
  collectionMetadataTimeline: iCollectionMetadataTimeline<T>[];
  /** The badge metadata timeline */
  badgeMetadataTimeline: iBadgeMetadataTimeline<T>[];
  /** The type of balances (i.e. "Standard", "Off-Chain - Indexed", "Inherited, "Off-Chain - Non-Indexed") */
  balancesType: 'Standard' | 'Off-Chain - Indexed' | 'Inherited' | 'Off-Chain - Non-Indexed';
  /** The off-chain balances metadata timeline */
  offChainBalancesMetadataTimeline: iOffChainBalancesMetadataTimeline<T>[];
  /** The custom data timeline */
  customDataTimeline: iCustomDataTimeline<T>[];
  /** The manager timeline */
  managerTimeline: iManagerTimeline<T>[];
  /** The collection permissions */
  collectionPermissions: iCollectionPermissions<T>;
  /** The collection approved transfers timeline */
  collectionApprovals: iCollectionApproval<T>[];
  /** The standards timeline */
  standardsTimeline: iStandardsTimeline<T>[];
  /** The is archived timeline */
  isArchivedTimeline: iIsArchivedTimeline<T>[];
  /** The default balances for users who have not interacted with the collection yet. Only used if collection has "Standard" balance type. */
  defaultBalances: iUserBalanceStore<T>;
  /** The cosmos address of the user who created this collection */
  createdBy: string;
  /** The block number when this collection was created */
  createdBlock: T;
  /** The timestamp when this collection was created (milliseconds since epoch) */
  createdTimestamp: T;
  /** The update history of this collection */
  updateHistory: {
    txHash: string;
    block: T;
    blockTimestamp: T;
  }[];
  /** The alias cosmos address for the collection */
  aliasAddress: string;
}

/**
 * @category Interfaces
 */
export interface iAccountDoc<T extends NumberType> extends Doc {
  /** The public key of the account */
  publicKey: string;
  /** The account number of the account */
  accountNumber: T;
  /** The public key type of the account */
  pubKeyType: string;
  /** The Cosmos address of the account */
  cosmosAddress: string;
  /** The Eth address of the account */
  ethAddress: string;
  /** The Solana address of the account */
  solAddress: string;
  /** The Bitcoin address of the account */
  btcAddress: string;
  /** The sequence of the account */
  sequence?: T;
  /** The balance of the account */
  balance?: iCosmosCoin<T>;
}

/**
 * CustomLinks are custom links that can be added to a profile.
 *
 * @category Interfaces
 */
export interface iCustomLink {
  title: string;
  url: string;
  image: string;
}

/**
 * @category Interfaces
 */
export interface iCustomPage<T extends NumberType> {
  title: string;
  description: string;
  items: iBatchBadgeDetails<T>[];
}

/**
 * CustomListPage is a custom list page that can be added to a profile. The items are valid list IDs.
 *
 * @category Interfaces
 */
export interface iCustomListPage {
  title: string;
  description: string;
  items: string[];
}

/**
 * @category Interfaces
 */
export interface iProfileDoc<T extends NumberType> extends Doc {
  /** Whether we have already fetched the profile or not */
  fetchedProfile?: boolean;

  /** The timestamp of the last activity seen for this account (milliseconds since epoch) */
  seenActivity?: T;
  /** The timestamp of when this account was created (milliseconds since epoch) */
  createdAt?: T;

  /** The Discord username of the account */
  discord?: string;
  /** The Twitter username of the account */
  twitter?: string;
  /** The GitHub username of the account */
  github?: string;
  /** The Telegram username of the account */
  telegram?: string;
  /** The readme of the account */
  readme?: string;

  /** The custom links of the account */
  customLinks?: iCustomLink[];

  /** The hidden badges of the account */
  hiddenBadges?: iBatchBadgeDetails<T>[];
  /** The hidden lists of the account */
  hiddenLists?: string[];

  /** The custom pages of the account */
  customPages?: {
    badges: iCustomPage<T>[];
    lists: iCustomListPage[];
  };

  /** The watched lists of the account's portfolio */
  watchlists?: {
    badges: iCustomPage<T>[];
    lists: iCustomListPage[];
  };

  /** The profile picture URL of the account */
  profilePicUrl?: string;
  /** The username of the account */
  username?: string;

  /** The latest chain the user signed in with */
  latestSignedInChain?: SupportedChain;

  /** The Solana address of the profile, if applicable (bc we need it to convert) */
  solAddress?: string;

  /** The notifications of the account */
  notifications?: iNotificationPreferences<T>;

  /** Approved ways to sign in (rather than Blockin) */
  approvedSignInMethods?: {
    discord?: {
      username: string;
      discriminator?: string;
      id: string;
    };
  };
}

/**
 * @category Interfaces
 */
export interface iQueueDoc<T extends NumberType> extends Doc {
  /** The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds */
  uri: string;
  /** The collection ID of the metadata to be fetched */
  collectionId: T;
  /** The load balance ID of the metadata to be fetched. Only the node with the same load balance ID will fetch this metadata */
  loadBalanceId: T;
  /** The timestamp of when this metadata was requested to be refreshed (milliseconds since epoch) */
  refreshRequestTime: T;
  /** The number of times this metadata has been tried to be fetched but failed */
  numRetries: T;
  /** The timestamp of when this metadata was last fetched (milliseconds since epoch) */
  lastFetchedAt?: T;
  /** The error message if this metadata failed to be fetched */
  error?: string;
  /** The timestamp of when this document was deleted (milliseconds since epoch) */
  deletedAt?: T;
  /** The timestamp of when this document should be fetched next (milliseconds since epoch) */
  nextFetchTime?: T;

  //Only used for failed push notifications
  emailMessage?: string;
  recipientAddress?: string;
  activityDocId?: string;
  notificationType?: string;
}

/**
 * @category Interfaces
 */
export interface iIndexerStatus {
  status: iStatusDoc<bigint>;
}

/**
 * @category Interfaces
 */
export interface iLatestBlockStatus<T extends NumberType> {
  /** The height of the latest block */
  height: T;
  /** The transaction index of the latest block */
  txIndex: T;
  /** The timestamp of the latest block (milliseconds since epoch) */
  timestamp: T;
}

/**
 * @category Interfaces
 */
export interface iStatusDoc<T extends NumberType> extends Doc {
  /** The latest synced block status (i.e. height, txIndex, timestamp) */
  block: iLatestBlockStatus<T>;
  /** The next collection ID to be used */
  nextCollectionId: T;
  /** The current gas price based on the average of the lastXGasAmounts */
  gasPrice: number;
  /** The last X gas prices */
  lastXGasAmounts: T[];
  /** The last X gas limits */
  lastXGasLimits: T[];
}

/**
 * @category Interfaces
 */
export interface iAddressListEditKey<T extends NumberType> {
  /** The key that can be used to edit the address list */
  key: string;
  /** The expiration date of the key (milliseconds since epoch) */
  expirationDate: T;
  /** True if the user can only add their signed in address to the list */
  mustSignIn?: boolean;
}

/**
 * @category Interfaces
 */
export interface iAddressListDoc<T extends NumberType> extends iAddressList, Doc {
  /** The cosmos address of the user who created this list */
  createdBy: string;
  /** The update history of this list */
  updateHistory: {
    txHash: string;
    block: T;
    blockTimestamp: T;
  }[];
  /** The block number when this list was created */
  createdBlock: T;
  /** The timestamp of when this list was last updated (milliseconds since epoch) */
  lastUpdated: T;
  /** The NSFW reason if this list is NSFW */
  nsfw?: { reason: string };
  /** The reported reason if this list is reported */
  reported?: { reason: string };
  /** True if this list is private and will not show up in search results */
  private?: boolean;
  /** True if this list is viewable if queried by the list ID directly */
  viewableWithLink?: boolean;
}

/**
 * @category Interfaces
 */
export interface iBalanceDoc<T extends NumberType> extends iUserBalanceStore<T>, Doc {
  /** The collection ID */
  collectionId: T;

  /** The Cosmos address of the user */
  cosmosAddress: string;

  /** True if the balances are on-chain */
  onChain: boolean;

  /** The URI of the off-chain balances */
  uri?: string;

  /** The timestamp of when the off-chain balances were fetched (milliseconds since epoch). For BitBadges indexer, we only populate this for Mint and Total docs. */
  fetchedAt?: T;

  /** The block number of when the off-chain balances were fetched. For BitBadges indexer, we only populate this for Mint and Total docs. */
  fetchedAtBlock?: T;

  /** True if the off-chain balances are using permanent storage */
  isPermanent?: boolean;

  /** The content hash of the off-chain balances */
  contentHash?: string;

  /** The update history of this balance */
  updateHistory: {
    txHash: string;
    block: T;
    blockTimestamp: T;
  }[];
}

/**
 * @category Interfaces
 */
export interface iBalanceDocWithDetails<T extends NumberType> extends iBalanceDoc<T> {
  /** The outgoing approvals with details like metadata and address lists. */
  outgoingApprovals: iUserOutgoingApprovalWithDetails<T>[];
  /** The incoming approvals with details like metadata and address lists. */
  incomingApprovals: iUserIncomingApprovalWithDetails<T>[];
  /** The user permissions with details like metadata and address lists. */
  userPermissions: iUserPermissionsWithDetails<T>;
}

export type ClaimIntegrationPluginType =
  | 'password'
  | 'numUses'
  | 'greaterThanXBADGEBalance'
  | 'discord'
  | 'codes'
  | 'twitter'
  | 'transferTimes'
  | 'requiresProofOfAddress'
  | 'whitelist'
  | 'mustOwnBadges'
  | 'api';

export type JsonBodyInputWithValue = {
  key: string;
  label: string;
  type?: 'date' | 'url';
  value: string | number | boolean;
};
export type JsonBodyInputSchema = { key: string; label: string; type: 'date' | 'url' | 'string' | 'number' | 'boolean'; helper?: string };

export type ClaimIntegrationPublicParamsType<T extends ClaimIntegrationPluginType> = T extends 'numUses'
  ? {
      maxUses: number;
      maxUsesPerAddress?: number;
      assignMethod: 'firstComeFirstServe' | 'codeIdx';
    }
  : T extends 'greaterThanXBADGEBalance'
    ? {
        minBalance: number;
      }
    : T extends 'discord'
      ? {
          users?: string[];
          serverId?: string;
          serverName?: string;
          maxUsesPerUser?: number;
        }
      : T extends 'codes'
        ? {
            numCodes: number;
          }
        : T extends 'twitter'
          ? {
              users?: string[];
              maxUsesPerUser?: number;
            }
          : T extends 'transferTimes'
            ? {
                transferTimes: iUintRange<JSPrimitiveNumberType>[];
              }
            : T extends 'whitelist'
              ? {
                  listId?: string;
                  list?: iAddressList;
                }
              : T extends 'mustOwnBadges'
                ? {
                    ownershipRequirements?: AndGroup<NumberType> | OrGroup<NumberType> | OwnershipRequirements<NumberType>;
                  }
                : T extends 'api'
                  ? {
                      apiCalls: ClaimApiCallInfo[];
                    }
                  : {};

export interface ClaimApiCallInfo {
  uri: string;
  name: string;
  description?: string;
  passDiscord?: boolean;
  passTwitter?: boolean;
  bodyParams?: object;
  userInputsSchema: Array<JsonBodyInputSchema>;
}

export type ClaimIntegrationPrivateParamsType<T extends ClaimIntegrationPluginType> = T extends 'password'
  ? {
      password: string;
    }
  : T extends 'codes'
    ? {
        codes: string[];
        seedCode: string;
      }
    : T extends 'whitelist'
      ? {
          listId?: string;
          list?: iAddressList;
        }
      : T extends 'twitter'
        ? {
            users?: string[];
          }
        : T extends 'discord'
          ? {
              users?: string[];
              serverId?: string;
              serverName?: string;
            }
          : T extends 'mustOwnBadges'
            ? {
                ownershipRequirements?: AndGroup<NumberType> | OrGroup<NumberType> | OwnershipRequirements<NumberType>;
              }
            : {};

export type ClaimIntegrationPublicStateType<T extends ClaimIntegrationPluginType> = T extends 'numUses'
  ? {
      numUses: number;
      claimedUsers: {
        [cosmosAddress: string]: number[];
      };
    }
  : T extends 'codes'
    ? {
        usedCodes: string[];
      }
    : {};

export interface IntegrationPluginParams<T extends ClaimIntegrationPluginType> {
  id: T;
  publicParams: ClaimIntegrationPublicParamsType<T>;
  privateParams: ClaimIntegrationPrivateParamsType<T>;
}

export interface IntegrationPluginDetails<T extends ClaimIntegrationPluginType> extends IntegrationPluginParams<T> {
  publicState: ClaimIntegrationPublicStateType<T>;
  resetState?: boolean;
}

/**
 * @category Interfaces
 */
export interface iClaimBuilderDoc<T extends NumberType> extends Doc {
  /** The CID of the password document */
  cid: string;
  /** The cosmos address of the user who created this password */
  createdBy: string;
  /** True if the password document is claimed by the collection */
  docClaimed: boolean;
  /** The collection ID of the password document */
  collectionId: T;

  /** Dynamic checks to run in the form of plugins */
  plugins: IntegrationPluginParams<ClaimIntegrationPluginType>[];

  /** If true, the claim codes are to be distributed manually. This doc will only be used for storage purposes. */
  manualDistribution?: boolean;

  /** The current state of each plugin */
  state: {
    [pluginId: string]: any;
  };

  /** Details for the action to perform if the criteria is correct */
  action: {
    codes?: string[];
    seedCode?: string;
    balancesToSet?: iIncrementedBalances<T>;
    listId?: string;
  };
}

/**
 * @category Interfaces
 */
export interface iApprovalTrackerDoc<T extends NumberType> extends iAmountTrackerIdDetails<T>, Doc {
  /** The number of transfers. Is an incrementing tally. */
  numTransfers: T;
  /** A tally of the amounts transferred for this approval. */
  amounts: iBalance<T>[];
}

/**
 * @category Interfaces
 */
export interface iChallengeTrackerIdDetails<T extends NumberType> {
  /** The collection ID */
  collectionId: T;
  /** The challenge ID */
  challengeId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if challengeLevel = "collection") */
  approverAddress: string;
}

/**
 * @category Interfaces
 */
export interface iMerkleChallengeDoc<T extends NumberType> extends Doc {
  /** The collection ID */
  collectionId: T;
  /** The challenge ID */
  challengeId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if challengeLevel = "collection") */
  approverAddress: string;
  /** The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree */
  usedLeafIndices: T[];
}

/**
 * @category Interfaces
 */
export interface iMerkleChallengeIdDetails<T extends NumberType> {
  /** The collection ID */
  collectionId: T;
  /** The challenge ID */
  challengeId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  challengeLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if challengeLevel = "collection") */
  approverAddress: string;
  /** The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree */
  usedLeafIndices: T[];
}

/**
 * @category Interfaces
 */
export interface iFetchDoc<T extends NumberType> extends Doc {
  /** The content of the fetch document. Note that we store balances in BALANCES_DB and not here to avoid double storage. */
  content?: iMetadata<T> | iApprovalInfoDetails<T> | iOffChainBalancesMap<T>;
  /** The time the document was fetched */
  fetchedAt: T;
  /** The block the document was fetched */
  fetchedAtBlock: T;
  /** The type of content fetched. This is used for querying purposes */
  db: 'ApprovalInfo' | 'Metadata' | 'Balances';
  /** True if the document is permanent (i.e. fetched from a permanent URI like IPFS) */
  isPermanent: boolean;
}

/**
 * @category Interfaces
 */
export interface iRefreshDoc<T extends NumberType> extends Doc {
  /** The collection ID */
  collectionId: T;
  /** The time the refresh was requested (Unix timestamp in milliseconds) */
  refreshRequestTime: T;
}

/**
 * @category Interfaces
 */
export interface iAirdropDoc<T extends NumberType> extends Doc {
  /** True if the airdrop has been completed */
  airdropped: boolean;
  /** The timestamp of when the airdrop was completed (milliseconds since epoch) */
  timestamp: T;
  /** The hash of the airdrop transaction */
  hash?: string;
}

/**
 * @category Interfaces
 */
export interface iIPFSTotalsDoc<T extends NumberType> extends Doc {
  /** The total bytes uploaded */
  bytesUploaded: T;
}

/**
 * @category Interfaces
 */
export interface iComplianceDoc<T extends NumberType> extends Doc {
  badges: {
    nsfw: iBatchBadgeDetails<T>[];
    reported: iBatchBadgeDetails<T>[];
  };
  addressLists: {
    nsfw: { listId: string; reason: string }[];
    reported: { listId: string; reason: string }[];
  };
  accounts: {
    nsfw: { cosmosAddress: string; reason: string }[];
    reported: { cosmosAddress: string; reason: string }[];
  };
}

/**
 * @category Interfaces
 */
export interface iBlockinAuthSignatureDoc<T extends NumberType> extends Doc {
  signature: string;

  name: string;
  description: string;
  image: string;

  cosmosAddress: string;
  params: ChallengeParams<T>;

  createdAt: T;
  deletedAt?: T;
}

/**
 * @category Interfaces
 */
export interface iFollowDetailsDoc<T extends NumberType> extends Doc {
  /** The Cosmos address of the user */
  cosmosAddress: string;
  /** The number of users that the user is following */
  followingCount: T;
  /** The number of users that are following the user */
  followersCount: T;
  /** The followers of the user */
  followers: string[];
  /** The following of the user */
  following: string[];

  /** The collection ID of the following collection */
  followingCollectionId: T;
}

/**
 * @category Interfaces
 */
export interface iProtocolDoc extends iProtocol, Doc {}

/**
 * @category Interfaces
 */
export interface iUserProtocolCollectionsDoc<T extends NumberType> extends Doc {
  protocols: {
    [protocolName: string]: T;
  };
}
