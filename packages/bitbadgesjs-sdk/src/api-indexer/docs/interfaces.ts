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
  iSecret,
  iSecretsProof,
  iStandardsTimeline,
  iUintRange
} from '@/interfaces/badges/core';
import type { iCollectionPermissions, iUserPermissionsWithDetails } from '@/interfaces/badges/permissions';
import type { iUserBalanceStore } from '@/interfaces/badges/userBalances';
import type { AndGroup, ChallengeParams, OrGroup, OwnershipRequirements } from 'blockin';
import { iMapWithValues } from '../requests/maps';
import { iUpdateHistory } from './docs';

/**
 * Numeric timestamp - value is equal to the milliseconds since the UNIX epoch.
 *
 * @category Interfaces
 */
export type UNIXMilliTimestamp<T extends NumberType> = T;

/**
 *
 * All supported addresses map to a Bech32 Cosmos address which is used by the BitBadges blockchain behind the scenes.
 * For conversion, see the BitBadges documentation. If this type is used, we must always convert to a Cosmos address before using it.
 *
 * @category Interfaces
 */
export type CosmosAddress = string; // `cosmos1${string}`;

/**
 * BlockinMessage is the sign-in challenge strint to be signed by the user. It extends EIP 4361 Sign-In with Ethereum
 * and adds additional fields for cross-chain compatibility and native asset ownership verification.
 *
 * For example, 'https://bitbadges.io wants you to sign in with your Ethereum address ...'
 *
 * @category Interfaces
 */
export type BlockinMessage = string;

/**
 * A native address is an address that is native to the user's chain. For example, an Ethereum address is native to Ethereum (0x...).
 * If this type is used, we support any native address type. We do not require conversion to a Cosmos address like the CosmosAddress type.
 *
 * @category Interfaces
 */
export type NativeAddress = string;

/**
 * Social connections are tracked for each user to provide an enhanced experience.
 * These are kept private from other users or sites using the API.
 * Currently, there is no use for these, but they may be used in the future.
 *
 * @category Interfaces
 */
export interface iSocialConnections<T extends NumberType> {
  discord?: {
    username: string;
    id: string;
    discriminator?: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  twitter?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  google?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  github?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
}

/**
 * Details about the user's push notification preferences.
 *
 * @category Interfaces
 */
export interface iNotificationPreferences<T extends NumberType> {
  /** The email to receive push notifications. */
  email?: string;
  /** The Discord ID to receive push notifications. */
  discord?: { id: string; username: string; discriminator: string | undefined; token: string } | undefined;
  /** The verification status of the email. */
  emailVerification?: iEmailVerificationStatus<T>;
  /** The preferences for the notifications. What type of notifications does the user want to receive? */
  preferences?: {
    listActivity?: boolean;
    transferActivity?: boolean;
    claimAlerts?: boolean;
    ignoreIfInitiator?: boolean;
  };
}

/**
 * The verification status of the user's email.
 *
 * @category Interfaces
 */
export interface iEmailVerificationStatus<T extends NumberType> {
  /** Whether or not the email has been verified. */
  verified?: boolean;
  /** The email verification token. This is used for verification and unsubscription. */
  token?: string;
  /** The expiry of the token for verification purposes. */
  expiry?: UNIXMilliTimestamp<T>;
  /** A unique code that we will send with all emails to verify that BitBadges is the one sending the email. */
  antiPhishingCode?: string;
}

/**
 * The base document interface for all acitivity types.
 *
 * @category Interfaces
 */
export interface iActivityDoc<T extends NumberType> extends Doc {
  /** The timestamp of the activity. */
  timestamp: UNIXMilliTimestamp<T>;
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
  /** The user who gave the review. */
  from: CosmosAddress;
  /** The collection ID of the collection that was reviewed. Only applicable to collection reviews. */
  collectionId?: T;
  /** The Cosmos address of the user who the review is for. Only applicable to user reviews. */
  reviewedAddress?: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iTransferActivityDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The list of recipients. */
  to: CosmosAddress[];
  /** The sender of the badges. */
  from: CosmosAddress;
  /** The list of balances and badge IDs that were transferred. */
  balances: iBalance<T>[];
  /** The collection ID for the badges that was transferred. */
  collectionId: T;
  /** The memo of the transfer. */
  memo?: string;
  /** Which approval to use to precalculate the balances? */
  precalculateBalancesFromApproval?: iApprovalIdentifierDetails;
  /** The prioritized approvals of the transfer. This is used to check certain approvals before others to ensure intended behavior. */
  prioritizedApprovals?: iApprovalIdentifierDetails[];
  /** Whether or not to only check prioritized approvals? If false, we will still check all approvals but prioritize the prioritized approvals. */
  onlyCheckPrioritizedApprovals?: boolean;
  /** The user who initiated the transfer transaction. */
  initiatedBy: CosmosAddress;
  /** The transaction hash of the activity. */
  txHash?: string;
}

/**
 * @category Interfaces
 */
export interface iListActivityDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The list ID. */
  listId: string;
  /** Initiator of the list activity. */
  initiatedBy: CosmosAddress;
  /** Whether or not the address was added to the list or removed. */
  addedToList?: boolean;
  /** The list of addresses that were added or removed from the list. */
  addresses?: CosmosAddress[];
  /** The transaction hash of the activity. */
  txHash?: string;
}

/**
 * @category Interfaces
 */
export interface iClaimAlertDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The sender */
  from: string;
  /** The cosmos addresses of the users that have been alerted. */
  cosmosAddresses: CosmosAddress[];
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
  /** The type of balances (i.e. "Standard", "Off-Chain - Indexed", "Non-Public, "Off-Chain - Non-Indexed") */
  balancesType: 'Standard' | 'Off-Chain - Indexed' | 'Non-Public' | 'Off-Chain - Non-Indexed';
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
  createdBy: CosmosAddress;
  /** The block number when this collection was created */
  createdBlock: T;
  /** The timestamp when this collection was created (milliseconds since epoch) */
  createdTimestamp: UNIXMilliTimestamp<T>;
  /** The update history of this collection */
  updateHistory: iUpdateHistory<T>[];
  /** The alias cosmos address for the collection */
  aliasAddress: CosmosAddress;
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
  cosmosAddress: CosmosAddress;
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
  /** Title of the link */
  title: string;
  /** URL of the link */
  url: string;
  /** Description of the link */
  image: string;
}

/**
 * @category Interfaces
 */
export interface iCustomPage<T extends NumberType> {
  /** The title of the custom page */
  title: string;
  /** The description of the custom page */
  description: string;
  /** The badge IDs to display on the custom page */
  items: iBatchBadgeDetails<T>[];
}

/**
 * CustomListPage is a custom list page that can be added to a profile. The items are valid list IDs.
 *
 * @category Interfaces
 */
export interface iCustomListPage {
  /** The title of the custom list page */
  title: string;
  /** The description of the custom list page */
  description: string;
  /** The list IDs to display on the custom list page */
  items: string[];
}

/**
 * @category Interfaces
 */
export interface iProfileDoc<T extends NumberType> extends Doc {
  /** Whether we have already fetched the profile or not */
  fetchedProfile?: boolean;

  /** The timestamp of the last activity seen for this account (milliseconds since epoch) */
  seenActivity?: UNIXMilliTimestamp<T>;
  /** The timestamp of when this account was created (milliseconds since epoch) */
  createdAt?: UNIXMilliTimestamp<T>;

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

  /** Social connections stored for the account */
  socialConnections?: iSocialConnections<T>;

  /** Approved ways to sign in (rather than Blockin) */
  approvedSignInMethods?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
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
  refreshRequestTime: UNIXMilliTimestamp<T>;
  /** The number of times this metadata has been tried to be fetched but failed */
  numRetries: T;
  /** The timestamp of when this metadata was last fetched (milliseconds since epoch) */
  lastFetchedAt?: UNIXMilliTimestamp<T>;
  /** The error message if this metadata failed to be fetched */
  error?: string;
  /** The timestamp of when this document was deleted (milliseconds since epoch) */
  deletedAt?: UNIXMilliTimestamp<T>;
  /** The timestamp of when this document should be fetched next (milliseconds since epoch) */
  nextFetchTime?: UNIXMilliTimestamp<T>;

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
  timestamp: UNIXMilliTimestamp<T>;
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
  expirationDate: UNIXMilliTimestamp<T>;
  /** True if the user can only add their signed in address to the list */
  mustSignIn?: boolean;
}

/**
 * @category Interfaces
 */
export interface iAddressListDoc<T extends NumberType> extends iAddressList, Doc {
  /** The cosmos address of the user who created this list */
  createdBy: CosmosAddress;
  /** The update history of this list */
  updateHistory: iUpdateHistory<T>[];
  /** The block number when this list was created */
  createdBlock: T;
  /** The timestamp of when this list was last updated (milliseconds since epoch) */
  lastUpdated: UNIXMilliTimestamp<T>;
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
  cosmosAddress: CosmosAddress;

  /** True if the balances are on-chain */
  onChain: boolean;

  /** The URI of the off-chain balances */
  uri?: string;

  /** The timestamp of when the off-chain balances were fetched (milliseconds since epoch). For BitBadges indexer, we only populate this for Mint and Total docs. */
  fetchedAt?: UNIXMilliTimestamp<T>;

  /** The block number of when the off-chain balances were fetched. For BitBadges indexer, we only populate this for Mint and Total docs. */
  fetchedAtBlock?: T;

  /** True if the off-chain balances are using permanent storage */
  isPermanent?: boolean;

  /** The content hash of the off-chain balances */
  contentHash?: string;

  /** The update history of this balance */
  updateHistory: iUpdateHistory<T>[];
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

/**
 * @category Claims
 */
export type ClaimIntegrationPluginType =
  | 'password'
  | 'numUses'
  | 'discord'
  | 'codes'
  | 'github'
  | 'google'
  | 'twitter'
  | 'transferTimes'
  | 'requiresProofOfAddress'
  | 'whitelist'
  | 'mustOwnBadges'
  | 'api'
  | 'email';

/**
 * @category Claims
 */
export type JsonBodyInputWithValue = {
  key: string;
  label: string;
  type?: 'date' | 'url';
  value: string | number | boolean;
};

/**
 * @category Claims
 */
export type JsonBodyInputSchema = { key: string; label: string; type: 'date' | 'url' | 'string' | 'number' | 'boolean'; helper?: string };

type OauthAppName = 'twitter' | 'stripe' | 'github' | 'google' | 'email' | 'discord';

/**
 * Public params are params that are visible to the public. For example, the number of uses for a claim code.
 *
 * @category Claims
 */
export type ClaimIntegrationPublicParamsType<T extends ClaimIntegrationPluginType> = T extends 'numUses'
  ? {
      maxUses: number;
      maxUsesPerAddress?: number;
      assignMethod: 'firstComeFirstServe' | 'codeIdx';
    }
  : T extends 'codes'
    ? {
        numCodes: number;
      }
    : T extends OauthAppName
      ? {
          hasPrivateList: boolean;
          users?: string[];
          maxUsesPerUser?: number;
          listUrl?: string;
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

/**
 * @category Claims
 */
export interface ClaimApiCallInfo {
  /** The method of the API call */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** The URI to call */
  uri: string;
  name: string;
  description?: string;
  /** Whether or not to pass the user's address to this call */
  passAddress?: boolean;
  /** Whether or not to pass the user's email to this call */
  passEmail?: boolean;
  /** Whether or not to pass the user's Discord to this call */
  passDiscord?: boolean;
  /** Whether or not to pass the user's Twitter to this call */
  passTwitter?: boolean;
  /** Whether or not to pass the user's Github to this call */
  passGithub?: boolean;
  /** Whether or not to pass the user's Google to this call */
  passGoogle?: boolean;
  /** The body parameters to pass to the API call. These are the hardcoded values passed to every call. */
  bodyParams?: any;
  /** The expected user inputs for the API call. */
  userInputsSchema: Array<JsonBodyInputSchema>;
}

/**
 * Private params are params that are not visible to the public. For example, the password for a claim code.
 *
 * @category Claims
 */
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
      : T extends OauthAppName
        ? {
            users?: string[];
          }
        : T extends 'mustOwnBadges'
          ? {
              ownershipRequirements?: AndGroup<NumberType> | OrGroup<NumberType> | OwnershipRequirements<NumberType>;
            }
          : {};

/**
 * Public state is the current state of the claim integration that is visible to the public. For example, the number of times a claim code has been used.
 *
 * @category Claims
 */
export type ClaimIntegrationPublicStateType<T extends ClaimIntegrationPluginType> = T extends 'numUses'
  ? {
      numUses: number;
      claimedUsers: {
        [cosmosAddress: string]: number[];
      };
    }
  : T extends 'codes'
    ? {
        usedCodeIndices: string[];
      }
    : {};

/**
 * @category Claims
 */
export interface IntegrationPluginParams<T extends ClaimIntegrationPluginType> {
  /** The ID of the plugin */
  id: T;
  /** The parameters of the plugin that are visible to the public */
  publicParams: ClaimIntegrationPublicParamsType<T>;
  /** The parameters of the plugin that are not visible to the public */
  privateParams: ClaimIntegrationPrivateParamsType<T>;
}

/**
 * @category Claims
 */
export interface IntegrationPluginDetails<T extends ClaimIntegrationPluginType> extends IntegrationPluginParams<T> {
  /** The current state of the plugin */
  publicState: ClaimIntegrationPublicStateType<T>;
  /** If resetState = true, we will reset the state of the plugin back to default. If false, we will keep the current state. */
  resetState?: boolean;
}

/**
 * @category Interfaces
 */
export interface iClaimBuilderDoc<T extends NumberType> extends Doc {
  /** The CID of the password document */
  cid: string;
  /** The cosmos address of the user who created this password */
  createdBy: CosmosAddress;
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
  /**
   * The approval ID
   */
  approvalId: string;
  /** The challenge ID */
  challengeTrackerId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if approvalLevel = "collection") */
  approverAddress: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iMerkleChallengeDoc<T extends NumberType> extends Doc {
  /** The collection ID */
  collectionId: T;
  /** The challenge ID */
  challengeTrackerId: string;
  /** The approval ID */
  approvalId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if approvalLevel = "collection") */
  approverAddress: CosmosAddress;
  /** The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree */
  usedLeafIndices: T[];
}

/**
 * @category Interfaces
 */
export interface iMerklechallengeTrackerIdDetails<T extends NumberType> {
  /** The collection ID */
  collectionId: T;
  /** The challenge ID */
  challengeTrackerId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if approvalLevel = "collection") */
  approverAddress: CosmosAddress;
  /** The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree */
  usedLeafIndices: T[];
}

/**
 * @category Interfaces
 */
export interface iFetchDoc<T extends NumberType> extends Doc {
  /** The content of the fetch document. Note that we store balances in BALANCES_DB and not here to avoid double storage. */
  content?: iMetadata<T> | iApprovalInfoDetails | iOffChainBalancesMap<T> | iChallengeDetails<T>;
  /** The time the document was fetched */
  fetchedAt: UNIXMilliTimestamp<T>;
  /** The block the document was fetched */
  fetchedAtBlock: T;
  /** The type of content fetched. This is used for querying purposes */
  db: 'ApprovalInfo' | 'Metadata' | 'Balances' | 'ChallengeInfo';
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
  refreshRequestTime: UNIXMilliTimestamp<T>;
}

/**
 * @category Interfaces
 */
export interface iAirdropDoc<T extends NumberType> extends Doc {
  /** True if the airdrop has been completed */
  airdropped: boolean;
  /** The timestamp of when the airdrop was completed (milliseconds since epoch) */
  timestamp: UNIXMilliTimestamp<T>;
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
    nsfw: { cosmosAddress: CosmosAddress; reason: string }[];
    reported: { cosmosAddress: CosmosAddress; reason: string }[];
  };
}

/**
 * @category Interfaces
 */
export interface iBlockinAuthSignatureDoc<T extends NumberType> extends Doc {
  /** The signature of the Blockin message with the Blockin params as the params field */
  signature: string;
  /** The public key for the signed. Only needed for certain chains (Cosmos). */
  publicKey?: string;

  name: string;
  description: string;
  image: string;

  /** The Cosmos address of the signer */
  cosmosAddress: CosmosAddress;
  /** The sign-in params. These are all the details in the message that was signed. */
  params: ChallengeParams<T>;

  /** If required, you can additionally attach proof of secrets ot the auth flow. These can be used to prove sensitive information to verifiers. */
  secretsProofs: iSecretsProof<T>[];

  /** The timestamp of when the signature was created (milliseconds since epoch) */
  createdAt: UNIXMilliTimestamp<T>;
  /** If deleted, we still store temporarily for a period of time. We use a deletedAt timestamp to determine when to delete. */
  deletedAt?: UNIXMilliTimestamp<T>;
}

/**
 * @category Interfaces
 */
export interface iSecretDoc<T extends NumberType> extends Doc, iSecret {
  updateHistory: iUpdateHistory<T>[];
}

/**
 * @category Interfaces
 */
export interface iFollowDetailsDoc<T extends NumberType> extends Doc {
  /** The Cosmos address of the user */
  cosmosAddress: CosmosAddress;
  /** The number of users that the user is following */
  followingCount: T;
  /** The number of users that are following the user */
  followersCount: T;
  /** The followers of the user */
  followers: CosmosAddress[];
  /** The following of the user */
  following: CosmosAddress[];
  /** The collection ID of the following collection */
  followingCollectionId: T;
}

/**
 * @category Interfaces
 */
export interface iMapDoc<T extends NumberType> extends Doc, iMapWithValues<T> {}
