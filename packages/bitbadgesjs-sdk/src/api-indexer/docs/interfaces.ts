//IMPORTANT: Keep all imports type-safe by using the `type` keyword. If not, this will mess up the circular dependency check.

import type { Doc } from '@/api-indexer/base.js';
import type { iMetadata } from '@/api-indexer/metadata/metadata.js';
import type { JSPrimitiveNumberType, NumberType } from '@/common/string-numbers.js';
import type { SupportedChain } from '@/common/types.js';
import type { iApprovalInfoDetails, iChallengeDetails, iUserOutgoingApprovalWithDetails } from '@/core/approvals.js';
import type { iBatchBadgeDetails } from '@/core/batch-utils.js';
import type { iCosmosCoin } from '@/core/coin.js';
import type { iOffChainBalancesMap } from '@/core/transfers.js';
import type { iCollectionApproval, iPredeterminedBalances, iUserIncomingApprovalWithDetails } from '@/interfaces/badges/approvals.js';
import type {
  iAddressList,
  iAmountTrackerIdDetails,
  iApprovalIdentifierDetails,
  iAttestation,
  iAttestationsProof,
  iBadgeMetadataTimeline,
  iBalance,
  iCollectionMetadataTimeline,
  iCustomDataTimeline,
  iIsArchivedTimeline,
  iManagerTimeline,
  iOffChainBalancesMetadataTimeline,
  iStandardsTimeline,
  iUintRange
} from '@/interfaces/badges/core.js';
import type { iCollectionPermissions, iUserPermissionsWithDetails } from '@/interfaces/badges/permissions.js';
import type { iUserBalanceStore } from '@/interfaces/badges/userBalances.js';
import type { iMap, iValueStore } from '@/transactions/messages/index.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from 'bitbadgesjs-sdk';

/**
 * @category API Requests / Responses
 */
export interface OAuthScopeDetails {
  scopeName: string;
  options?: object;
}

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
 * SiwbbMessage is the sign-in challenge strint to be signed by the user. It extends EIP 4361 Sign-In with Ethereum
 * and adds additional fields for cross-chain compatibility and native asset ownership verification.
 *
 * For example, 'https://bitbadges.io wants you to sign in with your Ethereum address ...'
 *
 * @category Interfaces
 */
export type SiwbbMessage = string;

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
  twitch?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  strava?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  reddit?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  telegram?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  farcaster?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  slack?: {
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
  /** Verified at timestamp. */
  verifiedAt?: UNIXMilliTimestamp<T>;
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
  /** Valid badge IDs for the collection */
  validBadgeIds: iUintRange<T>[];
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
    attestations: iCustomListPage[];
  };

  /** The watched lists of the account's portfolio */
  watchlists?: {
    badges: iCustomPage<T>[];
    lists: iCustomListPage[];
    attestations: iCustomListPage[];
  };

  /** The profile picture URL of the account */
  profilePicUrl?: string;
  /** The banner image URL of the account */
  bannerImage?: string;

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

  /** Approved ways to sign in */
  approvedSignInMethods?: {
    discord?: { scopes: OAuthScopeDetails[]; username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    google?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    twitter?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    addresses?: {
      address: NativeAddress;
      scopes: OAuthScopeDetails[];
    }[];
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
  /** Whether this document is pending to be fetched or not */
  pending?: boolean;

  //Only used for failed push notifications
  emailMessage?: string;
  recipientAddress?: string;
  activityDocId?: string;
  notificationType?: string;

  actionConfig?: any;

  claimInfo?: {
    session: any;
    body: any;
    claimId: string;
    cosmosAddress: CosmosAddress;
    ip: string | undefined;
  };

  faucetInfo?: {
    txHash: string;
    amount: NumberType;
    recipient: CosmosAddress;
  };
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
  | 'twitch'
  | 'twitter'
  | 'strava'
  | 'reddit'
  | 'telegram'
  | 'farcaster'
  | 'slack'
  | 'transferTimes'
  | 'initiatedBy'
  | 'whitelist'
  | 'email'
  | 'ip'
  | 'webhooks'
  | 'successWebhooks'
  | 'payments'
  | string;

/**
 * @category Claims
 */
export type JsonBodyInputWithValue = {
  key: string;
  label: string;
  type: string;
  value: string | number | boolean;
  headerField?: boolean;
};

/**
 * @category Claims
 */
export type JsonBodyInputSchema = {
  key: string;
  label: string;
  type: string;
  hyperlink?: {
    url: string;
    showAsGenericView?: boolean;
  };
  helper?: string;
  headerField?: boolean;
  required?: boolean;

  defaultValue?: string | number | boolean;
  options?: {
    label: string;
    value: string | number | boolean;
  }[];
  arrayField?: boolean;
};

type OauthAppName =
  | 'twitter'
  | 'github'
  | 'google'
  | 'email'
  | 'discord'
  | 'twitch'
  | 'strava'
  | 'youtube'
  | 'reddit'
  | 'telegram'
  | 'farcaster'
  | 'slack';

/**
 * @category Claims
 */
export type ClaimIntegrationPluginCustomBodyType<T extends ClaimIntegrationPluginType> = T extends 'codes'
  ? {
      code: string;
    }
  : T extends 'password'
    ? {
        password: string;
      }
    : T extends 'email'
      ? {
          token?: string;
        }
      : Record<string, any>;

/**
 * Public params are params that are visible to the public. For example, the number of uses for a claim code.
 *
 * @category Claims
 */
export type ClaimIntegrationPublicParamsType<T extends ClaimIntegrationPluginType> = T extends 'numUses'
  ? {
      maxUses: number;
      hideCurrentState?: boolean;
      displayAsUnlimited?: boolean;
    }
  : T extends 'codes'
    ? {
        numCodes: number;
        hideCurrentState?: boolean;
      }
    : T extends 'ip'
      ? {
          maxUsesPerIp: number;
        }
      : T extends OauthAppName
        ? {
            hasPrivateList: boolean;
            maxUsesPerUser?: number;
            blacklist?: boolean;
          }
        : T extends 'transferTimes'
          ? {
              transferTimes: iUintRange<JSPrimitiveNumberType>[];
            }
          : T extends 'whitelist'
            ? {
                listId?: string;
                list?: iAddressList;
                maxUsesPerAddress?: number;
              }
            : T extends 'geolocation'
              ? {
                  pindrop?: { latitude: number; longitude: number; radius: number };
                  allowedCountryCodes?: string[];
                  disallowedCountryCodes?: string[];
                }
              : T extends 'payments'
                ? {
                    usdAmount: number;
                    paymentAddress: CosmosAddress;
                  }
                : T extends 'webhooks' | 'successWebhooks'
                  ? {
                      passAddress?: boolean;
                      passDiscord?: boolean;
                      passEmail?: boolean;
                      passTwitter?: boolean;
                      passGoogle?: boolean;
                      passGithub?: boolean;
                      passTwitch?: boolean;
                      passStrava?: boolean;
                      passReddit?: boolean;
                      passTelegram?: boolean;
                      passFarcaster?: boolean;
                      passSlack?: boolean;
                      userInputsSchema?: Array<JsonBodyInputSchema>;
                    }
                  : Record<string, any>;

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
            usernames?: string[];
            ids?: string[];
          }
        : T extends 'webhooks' | 'successWebhooks'
          ? {
              webhookUrl: string;
              webhookSecret: string;
            }
          : T extends 'claimAlerts'
            ? {
                message: string;
              }
            : Record<string, any>;

/**
 * Public state is the current state of the claim integration that is visible to the public. For example, the number of times a claim code has been used.
 *
 * @category Claims
 */
export type ClaimIntegrationPublicStateType<T extends ClaimIntegrationPluginType> = T extends 'numUses'
  ? {
      numUses?: number;
      claimedUsers?: {
        [cosmosAddress: string]: number[];
      };
    }
  : T extends 'codes'
    ? {
        usedCodeIndices?: string[];
      }
    : Record<string, any>;

/**
 * Private state is the current state of the claim integration that is visible to only those who can fetch private parameters.
 *
 * @category Claims
 */
export type ClaimIntegrationPrivateStateType<T extends ClaimIntegrationPluginType> = T extends OauthAppName
  ? {
      ids: { [id: string]: number };
      usernames: { [username: string]: string };
    }
  : T extends 'whitelist'
    ? {
        addresses: { [address: string]: number };
      }
    : Record<string, any>;

/**
 * @category Claims
 */
export interface IntegrationPluginParams<T extends ClaimIntegrationPluginType> {
  /**
   * The ID of the plugin instance. This is a unique identifier for referencing this instance of the plugin within this claim
   * (e.g. differentiate between duplicates of the same plugin type).
   *
   * This is different from the pluginId, which is a unique identifier for the plugin itself. All instances of the same plugin
   * will have the same pluginId.
   */
  instanceId: string;
  /** The type of the plugin */
  pluginId: T;
  /** The version of the plugin */
  version: string;
  /** The parameters of the plugin that are visible to the public */
  publicParams: ClaimIntegrationPublicParamsType<T>;
  /** The parameters of the plugin that are not visible to the public */
  privateParams: ClaimIntegrationPrivateParamsType<T>;
  /** Custom display metadata for the plugin */
  metadata?: { name: string; description: string; image?: string };
}

/**
 * @category Claims
 */
export interface IntegrationPluginDetails<T extends ClaimIntegrationPluginType> extends IntegrationPluginParams<T> {
  /** The current state of the plugin */
  publicState: ClaimIntegrationPublicStateType<T>;
  /** The private state of the plugin */
  privateState?: ClaimIntegrationPrivateStateType<T>;
  /** If resetState = true, we will reset the state of the plugin back to default. If false, we will keep the current state. Incompatible with newState. */
  resetState?: boolean;
  /**
   * If newState is present, we will set the state to the new state. Incompatible with resetState. Can be used alongside onlyUpdateProvidedNewState.
   * By default, we will overwrite the whole state. If onlyUpdateProvidedNewState is true, we will only update the specific provided fields.
   *
   * Warning: This is an advanced feature and should be used with caution. Misconfiguring this can lead to unexpected behavior of this plugin.
   */
  newState?: ClaimIntegrationPublicStateType<T>;
  /**
   * If true, we will only update the specific fields provided in newState. If falsy, we will overwrite the whole state with newState.
   *
   * Only applicable if newState is present.
   *
   * Note that we do this on a recursive level. If you have nested objects, we will only update the specific fields provided for those nested objects
   * and leave all else as-is.
   */
  onlyUpdateProvidedNewState?: boolean;
}

/**
 * @inheritDoc iSatisfyMethod
 * @category Indexer
 */
export interface iSatisfyMethod {
  type: 'AND' | 'OR' | 'NOT';
  /** Conditions can either be the instance ID string of the plugin to check success for or another satisfyMethod object. */
  conditions: Array<string | iSatisfyMethod>;
  options?: {
    /** Only applicable to OR logic. Implements M of N logic. */
    minNumSatisfied?: number;
  };
}

/**
 * @category Interfaces
 */
export interface iClaimBuilderDoc<T extends NumberType> extends Doc {
  /** The CID (content ID) of the document. This is used behind the scenes to handle off-chain vs on-chain data races. */
  cid: string;

  /** The cosmos address of the user who created this password */
  createdBy: CosmosAddress;
  /** True if the document is claimed by the collection */
  docClaimed: boolean;
  /** The collection ID of the document */
  collectionId: T;

  /** Which challenge tracker is it tied to */
  trackerDetails?: iChallengeTrackerIdDetails<T>;

  /** Deleted at timestamp */
  deletedAt?: UNIXMilliTimestamp<T>;

  /** Dynamic checks to run in the form of plugins */
  plugins: IntegrationPluginParams<ClaimIntegrationPluginType>[];

  /** For query purposes, the plugin IDs */
  pluginIds?: string[];

  /** If true, the claim codes are to be distributed manually. This doc will only be used for storage purposes. */
  manualDistribution?: boolean;

  /** If the claim has been designated to be completed automatically for users. */
  approach?: string;

  /** Metadata for the claim */
  metadata?: iMetadata<T>;

  /** The current state of each plugin */
  state: {
    [pluginId: string]: any;
  };

  /** Algorithm to determine the claaim number indices */
  assignMethod?: string;

  /** Custom success logic. If not provided, we will default to AND logic with all plugins. */
  satisfyMethod?: iSatisfyMethod;

  /** Details for the action to perform if the criteria is correct */
  action: {
    seedCode?: string;
    balancesToSet?: iPredeterminedBalances<T>;
    listId?: string;
    siwbbClaim?: boolean;
  };

  /**
   * Rewards to be shown upon a successful claim. If you need further gating, you can do this in two-steps.
   */
  rewards?: iClaimReward<T>[];

  /** Estimated cost for the user */
  estimatedCost?: string;
  /** Estimated time to satisfy the claim's requirements */
  estimatedTime?: string;

  /** If true, the claim will be shown in search results */
  showInSearchResults?: boolean;
  /** The categories of the claim */
  categories?: string[];

  lastUpdated: UNIXMilliTimestamp<T>;
  createdAt: UNIXMilliTimestamp<T>;

  version: T;

  testOnly?: boolean;
}

/**
 * @category Interfaces
 */
export interface iClaimReward<T extends NumberType> {
  /** The ID of the reward (either a pre-configured one or "custom") */
  rewardId: string;
  /** The instance ID of the reward */
  instanceId: string;

  /** Metadata for the reward. This is public-facing, so do not include any gated content here. By default, we use the associated rewardId. */
  metadata?: {
    name: string;
    description: string;
    image: string;
  };

  /** If true, the reward is automatically given to the user upon completion. */
  automatic?: boolean;

  /** The gated content to display upon completion. */
  gatedContent: iClaimGatedContent;
}

/**
 * @category Indexer
 */
export interface iClaimGatedContent {
  /** The content (markdown supported) to be shown to successful claimers */
  content?: string;
  /** The URL to be shown to successful claimers */
  url?: string;
  /** The params to be shown to successful claimers. Only used for pre-configured rewards. */
  params?: {
    [key: string]: any;
  };
}

/**
 * @inheritDoc iClaimReward
 * @category Indexer
 */
export class ClaimReward<T extends NumberType> extends BaseNumberTypeClass<ClaimReward<T>> implements iClaimReward<T> {
  rewardId: string;
  instanceId: string;
  metadata?: {
    name: string;
    description: string;
    image: string;
  };
  gatedContent: {
    content?: string;
    url?: string;
    params?: {
      [key: string]: any;
    };
  };
  automatic?: boolean;

  constructor(data: iClaimReward<T>) {
    super();
    this.rewardId = data.rewardId;
    this.instanceId = data.instanceId;
    this.metadata = data.metadata;
    this.gatedContent = data.gatedContent;
    this.automatic = data.automatic;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ClaimReward<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ClaimReward<U>;
  }
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
  usedLeafIndices: iUsedLeafStatus<T>[];
}

/**
 * @category Interfaces
 */
export interface iUsedLeafStatus<T extends NumberType> {
  /** The leaf index */
  leafIndex: T;
  /** The address that used the leaf */
  usedBy: CosmosAddress;
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

  ip?: string;
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
export interface iDeveloperAppDoc extends Doc {
  /** Creator of the app */
  createdBy: CosmosAddress;
  /** The name of the app */
  name: string;
  /** The description of the app */
  description: string;
  /** The image of the app */
  image: string;
  /** The client ID of the app */
  clientId: string;
  /** The client secret of the app */
  clientSecret: string;
  /** The redirect URI of the app */
  redirectUris: string[];
}

/**
 * @category Interfaces
 */
export interface iAccessTokenDoc extends Doc {
  accessToken: string;
  tokenType: string;
  clientId: string;
  accessTokenExpiresAt: number;

  refreshToken: string;
  refreshTokenExpiresAt: number;

  cosmosAddress: string;
  address: string;
  scopes: OAuthScopeDetails[];
}

/**
 * @category Claims
 */
export enum PluginPresetType {
  Stateless = 'Stateless',
  Usernames = 'Usernames',
  ClaimToken = 'ClaimToken',
  CustomResponseHandler = 'CustomResponseHandler',
  CompletelyCustom = 'CompletelyCustom',
  ClaimNumbers = 'ClaimNumbers',
  StateTransitions = 'StateTransitions'
}

/**
 * @category Interfaces
 */
export interface iPluginDoc<T extends NumberType> extends Doc {
  /** The Cosmos address who created the plugin doc */
  createdBy: CosmosAddress;

  /** The unique plugin ID */
  pluginId: string;

  /** The secret of the plugin */
  pluginSecret?: string;

  /** Invite code for the plugin */
  inviteCode?: string;

  /** To publish to directory? */
  toPublish: boolean;

  /** Review process completed */
  reviewCompleted: boolean;

  metadata: {
    /** Creator of the plugin */
    createdBy: string;
    /** The name of the plugin */
    name: string;
    /** Description of the plugin */
    description: string;
    /** The image of the plugin */
    image: string;
    /** Parent app of the plugin. If blank, treated as its own app / entity. */
    parentApp?: string;
    /** Documentation for the plugin */
    documentation?: string;
    /** Source code for the plugin */
    sourceCode?: string;
    /** Support link for the plugin */
    supportLink?: string;
  };

  lastUpdated: UNIXMilliTimestamp<T>;

  createdAt: UNIXMilliTimestamp<T>;
  deletedAt?: UNIXMilliTimestamp<T>;

  approvedUsers: NativeAddress[];

  /** Array of version-controlled plugin configurations */
  versions: iPluginVersionConfig<T>[];
}

/**
 * @category Interfaces
 */
export interface iPluginVersionConfig<T extends NumberType> {
  /** Version of the plugin */
  version: T;

  /** True if the version is finalized */
  finalized: boolean;

  /** The time the version was created */
  createdAt: UNIXMilliTimestamp<T>;

  /** The time the version was last updated */
  lastUpdated: UNIXMilliTimestamp<T>;

  /** Reuse for nonindexed balances? Only applicable if is stateless, requires no user inputs, and requires no sessions. */
  reuseForNonIndexed: boolean;

  /** Whether the plugin should receive status webhooks */
  receiveStatusWebhook: boolean;

  /** Preset type for how the plugin state is to be maintained. */
  stateFunctionPreset: PluginPresetType;

  /** Whether it makes sense for multiple of this plugin to be allowed */
  duplicatesAllowed: boolean;

  /** This means that the plugin can be used w/o any session cookies or authentication. */
  requiresSessions: boolean;

  /** This is a flag for being compatible with auto-triggered claims, meaning no user interaction is needed. */
  requiresUserInputs: boolean;

  userInputsSchema: Array<JsonBodyInputSchema>;
  publicParamsSchema: Array<JsonBodyInputSchema>;
  privateParamsSchema: Array<JsonBodyInputSchema>;

  userInputRedirect?: {
    baseUri: string;
  };

  claimCreatorRedirect?: {
    toolUri?: string;
    tutorialUri?: string;
  };

  /** The verification URL */
  verificationCall?: {
    uri: string;
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
    hardcodedInputs: Array<JsonBodyInputWithValue>;

    passAddress?: boolean;
    passDiscord?: boolean;
    passEmail?: boolean;
    passTwitter?: boolean;
    passGoogle?: boolean;
    passGithub?: boolean;
    passTwitch?: boolean;
    passStrava?: boolean;
    passReddit?: boolean;
    passTelegram?: boolean;
    passFarcaster?: boolean;
    passSlack?: boolean;
    postProcessingJs: string;
  };
}

/**
 * @category Interfaces
 */
export interface iDepositBalanceDoc<T extends NumberType> extends Doc {
  /** The cosmos address of the user */
  cosmosAddress: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iSIWBBRequestDoc<T extends NumberType> extends Doc {
  /** The actual code itself */
  code: string;

  /** The Cosmos address of the signer */
  cosmosAddress: CosmosAddress;
  /**The native address of the signer */
  address: NativeAddress;
  /** The native chain for the user */
  chain: SupportedChain;

  name?: string;
  description?: string;
  image?: string;

  scopes: OAuthScopeDetails[];
  expiresAt: UNIXMilliTimestamp<T>;

  /** If required, you can additionally attach proof of attestations ot the auth flow. These can be used to prove sensitive information to verifiers. */
  attestationsPresentations: iAttestationsProof<T>[];

  /** The timestamp of when the signature was created (milliseconds since epoch) */
  createdAt: UNIXMilliTimestamp<T>;
  /** If deleted, we still store temporarily for a period of time. We use a deletedAt timestamp to determine when to delete. */
  deletedAt?: UNIXMilliTimestamp<T>;

  /** The client ID of the app that requested the signature */
  clientId: string;

  /** Other approved sign-ins at the time of this sign-in */
  otherSignIns?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
  };

  /** The redirect URI of the app  */
  redirectUri?: string;
}

/**
 * @category Interfaces
 */
export interface iAttestationDoc<T extends NumberType> extends Doc, iAttestation<T> {
  updateHistory: iUpdateHistory<T>[];
}

/**
 * @category Interfaces
 */
export interface iAttestationProofDoc<T extends NumberType> extends Doc, iAttestationsProof<T> {
  displayOnProfile: boolean;
}

/**
 * @category Interfaces
 */
export interface iMapDoc<T extends NumberType> extends Doc, iMapWithValues<T> {}

/**
 * @category Interfaces
 */
export interface iEventDoc<T extends NumberType> extends Doc {
  name: string;
  description: string;
  image: string;
  createdBy: CosmosAddress;

  externalUrl: string;

  createdAt: UNIXMilliTimestamp<T>;
}

/**
 * @category Interfaces
 */
export interface iInternalActionsDoc extends Doc {
  /** Creator of the internal action */
  createdBy: CosmosAddress;
  /** The name of the internal action */
  name: string;
  /** The description of the internal action */
  description: string;
  /** The image of the internal action */
  image: string;
  /** The client secret of the internal action */
  clientSecret: string;
  /** Actions associated with the internal action */
  actions: {
    discord?: {
      serverId: string;
    };
  };
}

/**
 * @category Interfaces
 */
export interface iUpdateHistory<T extends NumberType> {
  /** The transaction hash of the on-chain transaction that updated this. */
  txHash: string;
  /** The block number of the on-chain transaction that updated this. */
  block: T;
  /** The timestamp of the block of the on-chain transaction that updated this. */
  blockTimestamp: UNIXMilliTimestamp<T>;
  /** The indexer's timestamp of the update. This is provided in some cases because the time of indexing may be inconsistent with the time of the block. */
  timestamp: UNIXMilliTimestamp<T>;
}

/**
 * @inheritDoc iMap
 * @category Interfaces
 */
export interface iMapWithValues<T extends NumberType> extends iMap<T> {
  /** The (key, value) pairs for the maps that are set. */
  values: { [key: string]: iValueStore };
  /** The fetched metadata for the map (if any). */
  metadata?: iMetadata<T>;
  /** The update history for the map. Maps are maintained through blockchain transactions. */
  updateHistory: iUpdateHistory<T>[];
}

/**
 * @category Interfaces
 */
export interface iClaimDetails<T extends NumberType> {
  /** Unique claim ID. */
  claimId: string;
  /** Collection ID that the claim is for (if applicable). */
  collectionId?: T;
  /** Is intended to be used for Sign In with BitBadges. */
  siwbbClaim?: boolean;
  /** Address list ID that the claim is for (if applicable). */
  listId?: string;
  /** The tracker details for the claim. */
  trackerDetails?: iChallengeTrackerIdDetails<T>;
  /** The balances to set for the claim. Only used for claims for collections that have off-chain indexed balances and are assigning balances based on the claim. */
  balancesToSet?: iPredeterminedBalances<T>;
  /** Claim plugins. These are the criteria that must pass for a user to claim the badge. */
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  /** Rewards for the claim. */
  rewards?: iClaimReward<T>[];
  /** Estimated cost for the claim. */
  estimatedCost?: string;
  /** If true, the claim will be shown in search results */
  showInSearchResults?: boolean;
  /** The categories of the claim */
  categories?: string[];
  /** Estimated time to satisfy the claim's requirements. */
  estimatedTime?: string;
  /** If manual distribution is enabled, we do not handle any distribution of claim codes. We leave that up to the claim creator. */
  manualDistribution?: boolean;
  /** Whether the claim is expected to be automatically triggered by someone (not the user). */
  approach?: string; // 'in-site' | 'api' | 'zapier';
  /** Seed code for the claim. */
  seedCode?: string;
  /** Metadata for the claim. */
  metadata?: iMetadata<T>;
  /** Algorithm to determine the claim number order. Blank is just incrementing claim numbers. */
  assignMethod?: string;
  /** Last updated timestamp for the claim. */
  lastUpdated?: T;
  /** The version of the claim. */
  version: T;
  /** Custom satisfaction logic */
  satisfyMethod?: iSatisfyMethod;
}
