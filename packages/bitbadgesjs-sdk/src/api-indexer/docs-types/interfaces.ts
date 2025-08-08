//IMPORTANT: Keep all imports type-safe by using the `type` keyword. If not, this will mess up the circular dependency check.

import type { Doc } from '@/api-indexer/base.js';
import type { iMetadata, iMetadataWithoutInternals } from '@/api-indexer/metadata/metadata.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { JSPrimitiveNumberType, NumberType } from '@/common/string-numbers.js';
import type { SupportedChain } from '@/common/types.js';
import type { iApprovalInfoDetails, iChallengeDetails, iUserOutgoingApprovalWithDetails } from '@/core/approvals.js';
import type { iBatchTokenDetails } from '@/core/batch-utils.js';
import type { iCosmosCoin } from '@/core/coin.js';
import type { iOffChainBalancesMap } from '@/core/transfers.js';
import type { iCollectionApproval, iPredeterminedBalances, iUserIncomingApprovalWithDetails } from '@/interfaces/types/approvals.js';
import type {
  CollectionId,
  iAddressList,
  iAmountTrackerIdDetails,
  iApprovalIdentifierDetails,
  iBadgeMetadataTimeline,
  iBalance,
  iCollectionInvariants,
  iCollectionMetadataTimeline,
  iCustomDataTimeline,
  iDenomUnit,
  iDenomUnitWithDetails,
  iIsArchivedTimeline,
  iManagerTimeline,
  iMustOwnBadges,
  iOffChainBalancesMetadataTimeline,
  iStandardsTimeline,
  iUintRange
} from '@/interfaces/types/core.js';
import type { iCollectionPermissions, iUserPermissionsWithDetails } from '@/interfaces/types/permissions.js';
import type { iUserBalanceStore } from '@/interfaces/types/userBalances.js';
import type { iMap, iValueStore } from '@/transactions/messages/bitbadges/maps/index.js';

/**
 * @category API Requests / Responses
 */
export interface OAuthScopeDetails {
  /**
   * The name of the scope. Note: For this, we use the capitalized version of the scope name with spaces.
   *
   * For example, "completeClaims" becomes "Complete Claims"
   */
  scopeName: string;
  /**
   * The options for the scope. Currently, this is not used.
   */
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
 * All supported addresses map to a Bech32 BitBadges address which is used by the BitBadges blockchain behind the scenes.
 * For conversion, see the BitBadges documentation. If this type is used, we must always convert to a BitBadges address before using it.
 *
 * @category Interfaces
 */
export type BitBadgesAddress = string; // `bb1${string}`;

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
 * If this type is used, we support any native address type. We do not require conversion to a BitBadges address like the BitBadgesAddress type.
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
  meetup?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  bluesky?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  mailchimp?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  facebook?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  googleCalendar?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  youtube?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  linkedIn?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp<T>;
  };
  shopify?: {
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
    claimActivity?: boolean;
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
  /** Only for private purposes? */
  private?: boolean;
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
  from: BitBadgesAddress;
  /** The collection ID of the collection that was reviewed. Only applicable to collection reviews. */
  collectionId?: CollectionId;
  /** The BitBadges address of the user who the review is for. Only applicable to user reviews. */
  reviewedAddress?: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iCoinTransferItem<T extends NumberType> {
  /** The type of the coin transfer. */
  from: BitBadgesAddress;
  /** The type of the coin transfer. */
  to: BitBadgesAddress;
  /** The amount of the coin transfer. */
  amount: T;
  /** The denom of the coin transfer. */
  denom: string;
  /** Is protocol fee? */
  isProtocolFee: boolean;
}

/**
 * @category Interfaces
 */
export interface iPrecalculationOptions<T extends NumberType> {
  /** The timestamp to use for the transfer. */
  overrideTimestamp?: T;
  /** The token IDs to use for the transfer. */
  badgeIdsOverride?: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iTransferActivityDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The list of recipients. */
  to: BitBadgesAddress[];
  /** The sender of the tokens. */
  from: BitBadgesAddress;
  /** The list of balances and token IDs that were transferred. */
  balances: iBalance<T>[];
  /** The collection ID for the tokens that was transferred. */
  collectionId: CollectionId;
  /** The memo of the transfer. */
  memo?: string;
  /** Which approval to use to precalculate the balances? */
  precalculateBalancesFromApproval?: iApprovalIdentifierDetails<T>;
  /** The prioritized approvals of the transfer. This is used to check certain approvals before others to ensure intended behavior. */
  prioritizedApprovals?: iApprovalIdentifierDetails<T>[];
  /** The user who initiated the transfer transaction. */
  initiatedBy: BitBadgesAddress;
  /** The transaction hash of the activity. */
  txHash?: string;
  /** Precalculation options */
  precalculationOptions?: iPrecalculationOptions<T>;
  /** Coin transfers details */
  coinTransfers?: iCoinTransferItem<T>[];
  /** Approvals used for the transfer */
  approvalsUsed?: iApprovalIdentifierDetails<T>[];
  /** The token ID for the transfer */
  badgeId?: T;
  /** The price of the transfer */
  price?: T;
  /** The volume of the transfer */
  volume?: T;
  /** The denomination of the transfer */
  denom?: string;
}

/**
 * @category Interfaces
 */
export interface iListActivityDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The list ID. */
  listId: string;
  /** Initiator of the list activity. */
  initiatedBy: BitBadgesAddress;
  /** Whether or not the address was added to the list or removed. */
  addedToList?: boolean;
  /** The list of addresses that were added or removed from the list. */
  addresses?: BitBadgesAddress[];
  /** The transaction hash of the activity. */
  txHash?: string;
}

/**
 * @category Interfaces
 */
export interface iClaimActivityDoc<T extends NumberType> extends iActivityDoc<T> {
  /** Whether the claim attempt was successful or not */
  success: boolean;
  /** The claim ID of the claim attempt */
  claimId: string;
  /** The claim attempt ID of the claim attempt */
  claimAttemptId: string;
  /** The BitBadges address of the user who attempted the claim */
  bitbadgesAddress: BitBadgesAddress;
  /** The claim type of the claim attempt */
  claimType?: 'standalone' | 'collection' | 'list';
}

/**
 * @category Interfaces
 */
export interface iPointsActivityDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The BitBadges address of the user who earned the points */
  bitbadgesAddress: BitBadgesAddress;
  /** The amount of points before the activity */
  oldPoints: T;
  /** The amount of points after the activity */
  newPoints: T;
  /** The application ID of the points activity */
  applicationId: string;
  /** The page ID of the points activity */
  pageId: string;
}

/**
 * @category Interfaces
 */
export interface iClaimAlertDoc<T extends NumberType> extends iActivityDoc<T> {
  /** The sender */
  from: string;
  /** The BitBadges addresses of the users that have been alerted. */
  bitbadgesAddresses: BitBadgesAddress[];
  /**
   * The collection ID of the claim alert.
   *
   * @deprecated Not supported anymore.
   */
  collectionId: CollectionId;
  /** The message of the claim alert. */
  message?: string;
}

/**
 * @category Interfaces
 */
export interface iBaseStats<T extends NumberType> extends Doc {
  /** The overall volume of the collection */
  overallVolume: iCosmosCoin<T>[];
  /** The daily volume of the collection */
  dailyVolume: iCosmosCoin<T>[];
  /** The weekly volume of the collection */
  weeklyVolume: iCosmosCoin<T>[];
  /** The monthly volume of the collection */
  monthlyVolume: iCosmosCoin<T>[];
  /** The yearly volume of the collection */
  yearlyVolume: iCosmosCoin<T>[];
  /** Last set timestamp */
  lastUpdatedAt: UNIXMilliTimestamp<T>;
}

/**
 * @category Interfaces
 */
export interface iCollectionStatsDoc<T extends NumberType> extends iBaseStats<T> {
  /** The collection ID */
  collectionId: CollectionId;
  /** Floor price of the collection */
  floorPrices?: iCosmosCoin<T>[];
  /** Number of unique owners by time */
  uniqueOwners: iBalance<T>[];
  /** Floor price history */
  floorPriceHistory?: iFloorPriceHistory<T>[];
  /** The payout reward */
  payoutRewards?: iCosmosCoin<T>[];
}

/**
 * @category Interfaces
 */
export interface iFloorPriceHistory<T extends NumberType> {
  /** The floor price */
  floorPrice?: iCosmosCoin<T>;
  /** Updated at tiemstamp */
  updatedAt: UNIXMilliTimestamp<T>;
}

/**
 * @category Interfaces
 */
export interface iBadgeFloorPriceDoc<T extends NumberType> extends Doc {
  /** The collection ID */
  collectionId: CollectionId;
  /** The token ID */
  badgeId: T;
  /** The floor price */
  floorPrices?: iCosmosCoin<T>[];
  /** Floor price history */
  floorPriceHistory?: iFloorPriceHistory<T>[];
}

/**
 * @category Interfaces */
export interface iApprovalItemDoc<T extends NumberType> extends Doc {
  /** The collection ID */
  collectionId: CollectionId;
  /** The approval ID */
  approvalId: string;
  /** The approval level */
  approvalLevel: 'incoming' | 'outgoing';
  /** The approver address */
  approverAddress: string;
  /** The approval type */
  approvalType: string;

  /** Explicitly marked as used or expired */
  used?: boolean;
  /** Owner has sufficient balances */
  sufficientBalances?: boolean;
  /** The price of the listing */
  price?: T;
  /** Is active currently */
  isActive?: boolean;

  /** The token ID */
  badgeId?: T;
  /** Approval itself */
  approval: iCollectionApproval<T>;
  /** Deleted at timestamp */
  deletedAt?: UNIXMilliTimestamp<T>;
  /** Next check time */
  nextCheckTime?: UNIXMilliTimestamp<T>;
  /** Number of transfers left */
  numTransfersLeft?: T;
  /** Denom */
  denom?: string;
}

/**
 * @category Interfaces
 */
export interface iCollectionDoc<T extends NumberType> extends Doc {
  /** The collection ID */
  collectionId: CollectionId;
  /** The collection metadata timeline */
  collectionMetadataTimeline: iCollectionMetadataTimeline<T>[];
  /** The token metadata timeline */
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
  /** The BitBadges address of the user who created this collection */
  createdBy: BitBadgesAddress;
  /** The block number when this collection was created */
  createdBlock: T;
  /** The timestamp when this collection was created (milliseconds since epoch) */
  createdTimestamp: UNIXMilliTimestamp<T>;
  /** The update history of this collection */
  updateHistory: iUpdateHistory<T>[];
  /** Valid token IDs for the collection */
  validBadgeIds: iUintRange<T>[];
  /** Mint escrow address */
  mintEscrowAddress: string;
  /** The IBC wrapper paths for the collection */
  cosmosCoinWrapperPaths: iCosmosCoinWrapperPath<T>[];
  /** Collection-level invariants that cannot be broken. These are set upon genesis and cannot be modified. */
  invariants: iCollectionInvariants;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinWrapperPath<T extends NumberType> {
  address: string;
  denom: string;
  balances: iBalance<T>[];
  symbol: string;
  denomUnits: iDenomUnit<T>[];
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinWrapperPathWithDetails<T extends NumberType> extends iCosmosCoinWrapperPath<T> {
  /** Optional base-level metadata for this cosmos coin wrapper path. */
  metadata?: iMetadata<T>;
  /** The denomination units with metadata details populated. */
  denomUnits: iDenomUnitWithDetails<T>[];
}

/**
 * @category Interfaces
 */
export interface iAccountDoc<T extends NumberType> extends Doc {
  /** The public key of the account */
  publicKey: string;
  /** The account number of the account. This is the account number registered on the BitBadges blockchain.*/
  accountNumber: T;
  /** The public key type of the account */
  pubKeyType: string;
  /** The BitBadges address of the account */
  bitbadgesAddress: BitBadgesAddress;
  /** The Eth address of the account */
  ethAddress: string;
  /** The Solana address of the account. Note: This may be empty if we do not have it yet. Solana -> BitBadges address conversions are one-way, and we cannot convert a BitBadges address to a Solana address without prior knowledge. */
  solAddress: string;
  /** The Bitcoin address of the account */
  btcAddress: string;
  /** The Thorchain address of the account */
  thorAddress: string;
  /** The sequence of the account. This is the nonce for the blockchain for this account */
  sequence?: T;
  /** The BADGE balance of the account and other sdk.coin balances */
  balances?: iCosmosCoin<T>[];
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
  /** The token IDs to display on the custom page */
  items: iBatchTokenDetails<T>[];
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
  fetchedProfile?: 'full' | 'partial';

  /** Embedded wallet address */
  embeddedWalletAddress?: string;

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
  /** The Bluesky username of the account */
  bluesky?: string;
  /** The readme of the account */
  readme?: string;

  /** The custom links of the account */
  customLinks?: iCustomLink[];

  /** The hidden badges of the account */
  hiddenBadges?: iBatchTokenDetails<T>[];
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

  /** Public social connections stored for the account */
  publicSocialConnections?: iSocialConnections<T>;

  /** Approved ways to sign in */
  approvedSignInMethods?: {
    discord?: { scopes: OAuthScopeDetails[]; username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    google?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    twitter?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    facebook?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    addresses?: {
      address: NativeAddress;
      scopes: OAuthScopeDetails[];
    }[];
    passwords?: {
      passwordHash: string;
      salt: string;
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
  collectionId: CollectionId;
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
  /** Type of the doc / purpose */
  notificationType?: string;

  /** The BitBadges address of the user who initiated this fetch */
  initiatedBy?: BitBadgesAddress;

  /** For use for post-claim actions */
  actionConfig?: any;

  /** For use for claim completion */
  claimInfo?: {
    session: any;
    body: any;
    claimId: string;
    bitbadgesAddress: BitBadgesAddress;
    ip: string | undefined;
    [key: string]: any;
  };

  /** For use for airdrops */
  faucetInfo?: {
    txHash: string;
    amount: NumberType;
    recipient: BitBadgesAddress;
    denom: string;
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
export interface iTransactionEntry<T extends NumberType> {
  /** The amount of the transaction */
  amount: T;
  /** The gas limit of the transaction */
  limit: T;
  /** The timestamp when the transaction occurred (milliseconds since epoch) */
  timestamp: UNIXMilliTimestamp<T>;
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
  /** The current gas price based on the average of recent transactions */
  gasPrice: number;
  /** The last X transactions with timestamps for dynamic reset functionality */
  lastXTxs?: iTransactionEntry<T>[];
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
  /** The BitBadges address of the user who created this list */
  createdBy: BitBadgesAddress;
  /** The BitBadges address of the user who is currently managing this */
  managedBy: BitBadgesAddress;
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
}

/**
 * @category Interfaces
 */
export interface iBalanceDoc<T extends NumberType> extends iUserBalanceStore<T>, Doc {
  /** The collection ID */
  collectionId: CollectionId;

  /** The BitBadges address of the user */
  bitbadgesAddress: BitBadgesAddress;

  /** True if the balances are on-chain */
  onChain: boolean;

  /** The URI of the off-chain balances */
  uri?: string;

  /** The timestamp of when the off-chain balances were fetched (milliseconds since epoch). For BitBadges indexer, we only populate this for the Total docs. */
  fetchedAt?: UNIXMilliTimestamp<T>;

  /** The block number of when the off-chain balances were fetched. For BitBadges indexer, we only populate this for the Total docs. */
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
export interface iPointsDoc<T extends NumberType> extends Doc {
  /** The address to calculate points for */
  address: BitBadgesAddress;
  /** The points for the address */
  points: T;
  /** The timestamp of when the points were last calculated (milliseconds since epoch) */
  lastCalculatedAt: UNIXMilliTimestamp<T>;
  /** The application ID */
  applicationId: string;
  /** The page ID */
  pageId: string;
  /** Claim success counts. These were the claim success counts calculated for this points calculation. */
  claimSuccessCounts?: { [claimId: string]: number };
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
  | 'googleCalendar'
  | 'youtube'
  | 'reddit'
  | 'bluesky'
  | 'mailchimp'
  | 'facebook'
  | 'linkedIn'
  | 'telegram'
  | 'shopify'
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

  /** Note only applicable for public parameters input schemas */
  hideFromDetailsDisplay?: boolean;

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
  | 'facebook'
  | 'mailchimp'
  | 'bluesky'
  | 'googleCalendar'
  | 'telegram'
  | 'farcaster'
  | 'slack'
  | 'linkedIn'
  | 'shopify';

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
      : T extends 'captcha'
        ? {
            captchaToken: string;
          }
        : Record<string, any>;

interface OAuthAppParams {
  hasPrivateList: boolean;
  maxUsesPerUser?: number;
  blacklist?: boolean;
}

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
      : T extends 'email'
        ? OAuthAppParams
        : T extends OauthAppName
          ? OAuthAppParams
          : T extends 'transferTimes'
            ? {
                transferTimes: iUintRange<JSPrimitiveNumberType>[];
              }
            : T extends 'whitelist'
              ? {
                  listId?: string;
                  list?: iAddressList;
                  maxUsesPerAddress?: number;
                  hasPrivateList?: boolean;
                }
              : T extends 'geolocation'
                ? {
                    pindrop?: { latitude: number; longitude: number; radius: number };
                    allowedCountryCodes?: string[];
                    disallowedCountryCodes?: string[];
                  }
                : T extends 'webhooks' | 'successWebhooks' | 'zapierAiAction'
                  ? {
                      tutorialUri?: string;
                      ignoreSimulations?: boolean;
                      passAddress?: boolean;
                      passDiscord?: boolean;
                      passEmail?: boolean;
                      passTwitter?: boolean;
                      passGoogle?: boolean;
                      passYoutube?: boolean;
                      passGithub?: boolean;
                      passTwitch?: boolean;
                      passStrava?: boolean;
                      passReddit?: boolean;
                      passMeetup?: boolean;
                      passBluesky?: boolean;
                      passTelegram?: boolean;
                      passFarcaster?: boolean;
                      passSlack?: boolean;
                      passFacebook?: boolean;
                      passShopify?: boolean;
                      passMailchimp?: boolean;
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
          useDynamicStore?: boolean;
          dynamicDataId?: string;
          dataSecret?: string;

          listId?: string;
          list?: iAddressList;
        }
      : T extends OauthAppName
        ? {
            useDynamicStore?: boolean;
            dynamicDataId?: string;
            dataSecret?: string;

            usernames?: string[];
            ids?: string[];
          }
        : T extends 'webhooks' | 'successWebhooks'
          ? {
              webhookUrl: string;
              webhookSecret: string;
            }
          : T extends 'zapierAiAction'
            ? {
                action: string;
                instructions: string;
                apiKey: string;
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
      usedClaimNumbers?: iUintRange<JSPrimitiveNumberType>[];
      /**
       * Note: This currently returns all users, but in the future, we will only return relevant users requested.
       */
      claimedUsers?: {
        [bitbadgesAddress: string]: number[];
      };
    }
  : T extends 'codes'
    ? {
        /** The ranges of the codes that have been used */
        usedCodeRanges?: iUintRange<JSPrimitiveNumberType>[];
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
  /**
   * The ID of the plugin (e.g. "numUses"). This is the reusable plugin ID.
   * Do not use this as a unique identifier for the plugin instance as there could be duplicate pluginIds. Use instanceId instead.
   */
  pluginId: T;
  /** The version of the plugin */
  version: string;
  /** The parameters of the plugin that are visible to the public. These are custom per plugin type. */
  publicParams: ClaimIntegrationPublicParamsType<T>;
  /** The parameters of the plugin that are not visible to the public. These are custom per plugin type. */
  privateParams: ClaimIntegrationPrivateParamsType<T>;
  /** Custom display metadata for the plugin. This will override the default metadata for the plugin. */
  metadata?: { name: string; description: string; image?: string };
}

/**
 * @category Claims
 */
export interface IntegrationPluginDetails<T extends ClaimIntegrationPluginType> extends IntegrationPluginParams<T> {
  /** The current state of the plugin. This is returned by BitBadges for information purposes. This is altered to not reveal sensitive information. */
  publicState: ClaimIntegrationPublicStateType<T>;
  /** The private state of the plugin. This is the exact state used by BitBadges behind the scenes. */
  privateState?: ClaimIntegrationPrivateStateType<T>;
}

/**
 * @category Claims
 */
export interface IntegrationPluginDetailsUpdate<T extends ClaimIntegrationPluginType> extends IntegrationPluginParams<T> {
  /** If resetState = true, we will reset the state of the plugin back to default. If false, we will keep the current state. Incompatible with newState. */
  resetState?: boolean;
  /**
   * If newState is present, we will set the state to the new state. Incompatible with resetState. Can be used alongside onlyUpdateProvidedNewState.
   * By default, we will overwrite the whole state. If onlyUpdateProvidedNewState is true, we will only update the specific provided fields.
   *
   * Warning: This is an advanced feature and should be used with caution. Misconfiguring this can lead to unexpected behavior of this plugin.
   *
   * Note: Each plugin may have different state schemas. Please refer to the documentation of the plugin you are updating for more information.
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
 * @category Interfaces
 */
export type ManagePluginRequest = IntegrationPluginDetailsUpdate<ClaimIntegrationPluginType>;

/**
 * @category Interfaces
 */
export type CreateClaimRequest<T extends NumberType> = Omit<
  iClaimDetails<T>,
  | 'plugins'
  | 'version'
  | 'trackerDetails'
  | '_includesPrivateParams'
  | '_templateInfo'
  | 'managedBy'
  | 'createdBy'
  | 'standaloneClaim'
  | 'lastUpdated'
> & {
  cid?: string;
  plugins: ManagePluginRequest[];
  metadata?: iMetadataWithoutInternals<T>;
};

/**
 * @category Interfaces
 */
export type UpdateClaimRequest<T extends NumberType> = Omit<
  iClaimDetails<T>,
  | 'plugins'
  | 'version'
  | 'trackerDetails'
  | '_includesPrivateParams'
  | '_templateInfo'
  | 'managedBy'
  | 'createdBy'
  | 'standaloneClaim'
  | 'lastUpdated'
  | 'seedCode'
> & {
  cid?: string;
  plugins: ManagePluginRequest[];
  metadata?: iMetadataWithoutInternals<T>;
};

/**
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
export interface iEvent<T extends NumberType> {
  /** The event ID */
  eventId: string;

  /** The event metadata */
  metadata: iMetadata<T>;

  /** Other event specific metadata */
  eventTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iTierWithOptionalWeight<T extends NumberType> {
  /** The claim ID to satisfy the tier */
  claimId: string;
  /** The weight of the tier */
  weight?: T;
  /**
   * Uncheckable? If so, we will not display success or failure for this tier.
   *
   * We will just display the claim criteria and metadata.
   */
  uncheckable?: boolean;
  /**
   * The calculation method to use for this tier. This is used for calculating the tier weight.
   *
   * By default, we check if the user has met the criteria for non-indexed and for indexed, we check claimed successfully at least one time.
   */
  pointsCalculationMethod?: string | undefined;
}

/**
 * @category Interfaces
 */
export interface iApplicationPage<T extends NumberType> {
  /** The page ID */
  pageId: string;

  /** The type of the page */
  type?: string;

  /** Metadata for the page */
  metadata: iMetadata<T>;

  /** Points to display in the page */
  points?: iTierWithOptionalWeight<T>[];
}

/**
 * @category Interfaces
 */
export interface iApiKeyDoc extends Doc {
  tier?: string;
  label: string;
  apiKey: string;
  bitbadgesAddress: string;
  numRequests: number;
  lastRequest: number;
  createdAt: number;
  expiry: number;
  intendedUse: string;

  // Stripe-related fields
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

/**
 * @category Interfaces
 */
export interface iApplicationDoc<T extends NumberType> extends Doc {
  /** The application ID */
  applicationId: string;

  /**
   * Type of the application
   */
  type: string;

  /** The BitBadges address of the user who created this application */
  createdBy: BitBadgesAddress;

  /** The BitBadges address of the user who is currently managing this */
  managedBy: BitBadgesAddress;

  /** The time the application was created */
  createdAt: UNIXMilliTimestamp<T>;

  /** The last updated timestamp */
  lastUpdated?: UNIXMilliTimestamp<T>;

  /** The overall metadata for the application */
  metadata: iMetadata<T>;

  /** The pages for the application */
  pages: iApplicationPage<T>[];
}

/**
 * @category Interfaces
 */
export interface iInheritMetadataFrom<T extends NumberType> {
  /** The claim ID to link to */
  claimId?: string;
  /** The application ID to link to */
  applicationId?: string;
  /** The collection ID to link to */
  collectionId?: CollectionId;
  /** The address list ID to link to */
  listId?: string;
  /** The map ID to link to */
  mapId?: string;
  /** The token ID to link to "collectionId: CollectionId<T>dgeId" */
  badgeId?: string;
}

/**
 * @category Interfaces
 */
export interface iUtilityPageDoc<T extends NumberType> extends Doc {
  /** The listing ID */
  listingId: string;

  /**
   * Type of the listing
   */
  type: string;

  /** The BitBadges address of the user who created this listing */
  createdBy: BitBadgesAddress;

  /** The BitBadges address of the user who is currently managing this */
  managedBy: BitBadgesAddress;

  /** The direct link for the listing. If specified, we will skip the entire content / listing page. Thus, content and links should be empty []. */
  directLink?: string | undefined;

  /** The time the listing was created */
  createdAt: UNIXMilliTimestamp<T>;

  /** The last updated timestamp */
  lastUpdated?: UNIXMilliTimestamp<T>;

  /** The overall metadata for the listing */
  metadata: iMetadata<T>;

  /** Where to inherit metadata from? Only one can be specified. */
  inheritMetadataFrom?: iInheritMetadataFrom<T>;

  /** The paginated content for the listing */
  content: iUtilityPageContent[];

  /** The relevant links for the listing */
  links: iUtilityPageLink<T>[];

  /** Optional time range for when the listing should be shown */
  displayTimes?: iUintRange<T> | undefined;

  /** Visibility state of the listing */
  visibility: 'public' | 'private' | 'unlisted';

  /** The categories of the listing */
  categories: string[];

  /** Approval status - can be used for moderation */
  approvalStatus: {
    /** Whether the listing is approved */
    isApproved: boolean;
    /** Is  Featured */
    isFeatured?: boolean;
    /** Featured Priority */
    featuredPriority?: number;
    /** Rejected or just pending */
    rejected?: boolean;
    /** Optional reason if not approved */
    reason?: string;
    /** Address of who last updated the approval status */
    updatedBy?: BitBadgesAddress;
  };

  /** The total view count for this listing. This is updated periodically from the view tracking document. */
  viewCount?: T;

  /** The estimated cost for this utility/service */
  estimatedCost?: iEstimatedCost<T>;

  /** The estimated time to complete or deliver this utility/service */
  estimatedTime?: string;

  /** Optional breakdown of views by time period for trending calculations */
  viewsByPeriod?: {
    /** Views in the last hour */
    hourly: number;
    /** Views in the last 24 hours */
    daily: number;
    /** Views in the last 7 days */
    weekly: number;
    /** Views in the last 30 days */
    monthly: number;
  };

  /** Linked details */
  linkedTo?: iLinkedTo<T>;

  /** Locale (ex: es, fr, etc.). If not specified, we assume en. */
  locale?: string;

  /** Home page view */
  homePageView?: {
    type: 'badges' | 'lists' | 'claims' | 'applications';
    category: string;
  };
}

/**
 * @category Interfaces
 */
export interface iLinkedTo<T extends NumberType> {
  /** The collection ID */
  collectionId?: CollectionId;
  /** The token IDs */
  badgeIds?: iUintRange<T>[];
  /** The list ID */
  listId?: string;
}

/**
 * @category Interfaces */
export interface iUtilityPageContent {
  /** The type of content */
  type: string;
  /** Label for the content page */
  label: string;
  /** The content - markdown supported */
  content: string;
}

/**
 * @category Interfaces
 */
export interface iUtilityPageLink<T extends NumberType> {
  /** The URL of the link */
  url: string;
  /** The claim ID to link to */
  claimId?: string;
  /** The application ID to link to */
  applicationId?: string;
  /** The collection ID to link to */
  collectionId?: CollectionId;
  /** The address list ID to link to */
  listId?: string;
  /** The map ID to link to */
  mapId?: string;
  /** Metadata for the link. Only applicable if the link is to a non-BitBadges entity. In other words, not tied to a specific claim, application, collection, etc. */
  metadata?: iMetadata<T>;
}

/**
 * @category Interfaces
 */
export interface iListingViewsDoc<T extends NumberType> extends Doc {
  /** The listing ID this view count is for */
  listingId: string;

  /** The total number of views */
  viewCount: T;

  /** The last time this view count was updated */
  lastUpdated: UNIXMilliTimestamp<T>;

  /** Optional breakdown of views by time period for trending calculations */
  viewsByPeriod?: {
    /** Views in the last hour */
    hourly: number;
    /** Views in the last 24 hours */
    daily: number;
    /** Views in the last 7 days */
    weekly: number;
    /** Views in the last 30 days */
    monthly: number;
  };
}

/**
 * @category Interfaces
 */
export interface iClaimBuilderDoc<T extends NumberType> extends Doc {
  /** The CID (content ID) of the document. This is used behind the scenes to handle off-chain vs on-chain data races. */
  cid: string;

  /** The BitBadges address of the user who created this password */
  createdBy: BitBadgesAddress;
  /** True if the document is claimed by the collection */
  docClaimed: boolean;

  /** The collection ID of the document */
  collectionId: CollectionId;

  /** The BitBadges address of the user who is currently managing this */
  managedBy: BitBadgesAddress;

  /** Which challenge tracker is it tied to */
  trackerDetails?: iChallengeTrackerIdDetails<T>;

  /** Deleted at timestamp */
  deletedAt?: UNIXMilliTimestamp<T>;

  /** Dynamic checks to run in the form of plugins */
  plugins: IntegrationPluginParams<ClaimIntegrationPluginType>[];

  /** For query purposes, the plugin IDs */
  pluginIds?: string[];

  /**
   * If true, the claim codes are to be distributed manually. This doc will only be used for storage purposes.
   * Only in use for legacy on-chain claims.
   *
   * @deprecated
   */
  manualDistribution?: boolean;

  /**
   * The expected approach for the claim. This is for display purposes for the frontend.
   *
   * Available options:
   * - in-site: The claim is expected to be completed in-site.
   * - api: The claim is expected to be completed via an API call.
   * - zapier: The claim is expected to be completed via Zapier auto-completion.
   */
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

  /**
   * For on-demand claims, we cache the result per user for a short period.
   *
   * To help optimize performance, please provide a cache policy.
   *
   * This is only applicable to on-demand claims.
   */
  cachePolicy?: iClaimCachePolicy<T>;
}

/**
 * @category Interfaces
 */
export interface iClaimCachePolicy<T extends NumberType> {
  /**
   * The number of seconds to cache the result. Default is 5 minutes (300 seconds) if none is specified.
   *
   * Note: This may be overridden by other options
   */
  ttl?: T;
  /**
   * Permanent once the claim is calculated once. We will cache results indefinitely.
   */
  alwaysPermanent?: boolean;
  /**
   * Permanent after a specific timestamp. Until then, we use the ttl. We will cache results indefinitely after this timestamp.
   */
  permanentAfter?: UNIXMilliTimestamp<T>;
}

/**
 * @category Interfaces */
export interface iClaimReward<T extends NumberType> {
  /** The ID of the reward (either a pre-configured one or "custom"). Currently, this is not used for anything. */
  rewardId: string;

  /** The instance ID of the reward. A unique identifier for the reward. */
  instanceId: string;

  /** Metadata for the reward. This is public-facing, so do not include any gated content here. By default, we use the associated rewardId. */
  metadata?: {
    name: string;
    description: string;
    image: string;
  };

  /** If true, the reward is automatically given to the user upon completion. No in-site logic is required. */
  automatic?: boolean;

  /** The gated content to display upon completion. */
  gatedContent: iClaimGatedContent;

  /**
   * Calculation method to use for the gated content. This is used to determine who is shown the gated content.
   *
   * By default, we check min 1 claim success for indexed claims and criteria met for non-indexed claims.
   */
  calculationMethod?: {
    alwaysShow?: boolean;
    minClaimSuccesses?: number;
  };
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
  gatedContent: iClaimGatedContent;
  automatic?: boolean;
  calculationMethod?: {
    alwaysShow?: boolean;
    minClaimSuccesses?: number;
  };

  constructor(data: iClaimReward<T>) {
    super();
    this.rewardId = data.rewardId;
    this.instanceId = data.instanceId;
    this.metadata = data.metadata;
    this.gatedContent = data.gatedContent;
    this.automatic = data.automatic;
    this.calculationMethod = data.calculationMethod;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ClaimReward<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimReward<U>;
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
  /** Last updated timestamp */
  lastUpdatedAt: UNIXMilliTimestamp<T>;
}

/**
 * @category Interfaces
 */
export interface iChallengeTrackerIdDetails<T extends NumberType> {
  /** The collection ID */
  collectionId: CollectionId;
  /**
   * The approval ID
   */
  approvalId: string;
  /** The challenge ID */
  challengeTrackerId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if approvalLevel = "collection") */
  approverAddress: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iMerkleChallengeTrackerDoc<T extends NumberType> extends Doc {
  /** The collection ID */
  collectionId: CollectionId;
  /** The challenge ID */
  challengeTrackerId: string;
  /** The approval ID */
  approvalId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if approvalLevel = "collection") */
  approverAddress: BitBadgesAddress;
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
  usedBy: BitBadgesAddress;
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
  collectionId: CollectionId;
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
export interface iCreatorCreditsDoc<T extends NumberType> extends Doc {
  /** The total credits */
  credits: T;
  /** The limit of credits */
  creditsLimit?: T;
}

/**
 * @category Interfaces
 */
export interface iComplianceDoc<T extends NumberType> extends Doc {
  badges: {
    nsfw: iBatchTokenDetails<T>[];
    reported: iBatchTokenDetails<T>[];
  };
  addressLists: {
    nsfw: { listId: string; reason: string }[];
    reported: { listId: string; reason: string }[];
  };
  accounts: {
    nsfw: { bitbadgesAddress: BitBadgesAddress; reason: string }[];
    reported: { bitbadgesAddress: BitBadgesAddress; reason: string }[];
  };
  applications?: {
    nsfw: { applicationId: string; reason: string }[];
    reported: { applicationId: string; reason: string }[];
  };
  claims?: {
    nsfw: { claimId: string; reason: string }[];
    reported: { claimId: string; reason: string }[];
  };
  maps?: {
    nsfw: { mapId: string; reason: string }[];
    reported: { mapId: string; reason: string }[];
  };
}

/**
 * @category Interfaces
 */
export interface iDeveloperAppDoc<T extends NumberType> extends Doc {
  /** Creator of the app */
  createdBy: BitBadgesAddress;
  /** The BitBadges address of the user who is currently managing this */
  managedBy: BitBadgesAddress;
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
  /** The last updated timestamp */
  lastUpdated?: UNIXMilliTimestamp<T>;
  /** The time the app was created */
  createdAt?: UNIXMilliTimestamp<T>;
}

/**
 * @category Interfaces
 */
export type DynamicDataHandlerType = OauthAppName | 'addresses';

/**
 * @category Interfaces
 */
export type DynamicDataHandlerData<Q extends DynamicDataHandlerType> = Q extends 'email'
  ? { emails: string[] }
  : Q extends OauthAppName
    ? { ids: string[]; usernames: string[] }
    : Q extends 'addresses'
      ? { addresses: string[] }
      : never;

/**
 * @category Interfaces
 */
export type DynamicDataHandlerActionPayload<Q extends DynamicDataHandlerType> = Q extends 'email'
  ? { email: string }
  : Q extends OauthAppName
    ? { id: string; username: string }
    : Q extends 'addresses'
      ? { address: string }
      : never;

/**
 * @category Interfaces
 */
export type ActionName = string;
/**
 * @category Interfaces
 */
export type DynamicDataHandlerActionRequest = { actionName: ActionName; payload: DynamicDataHandlerActionPayload<DynamicDataHandlerType> };

/**
 * @category Interfaces
 */
export interface iDynamicDataDoc<Q extends DynamicDataHandlerType, T extends NumberType> extends Doc {
  /** The handler ID. Can also be thought of as the type of dynamic data ("addresses", "email", ...) */
  handlerId: Q;
  /** The dynamic data ID. The ID of the store. */
  dynamicDataId: string;
  /** The label of the data store */
  label: string;
  /** The data secret. Used in cases where you are not signed in as creator. This authenticates the request. Not applicable to public stores */
  dataSecret: string;
  /** The data itself. */
  data: DynamicDataHandlerData<Q>;
  /** The creator of the dynamic data store */
  createdBy: BitBadgesAddress;
  /** The manager of the dynamic data store */
  managedBy: BitBadgesAddress;
  /** Whether the dynamic data store is public. If true, the data can be accessed without authentication. */
  publicUseInClaims?: boolean;
  /** The time the dynamic data store was created */
  createdAt?: UNIXMilliTimestamp<T>;
  /** The time the dynamic data store was last updated */
  lastUpdated?: UNIXMilliTimestamp<T>;
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

  bitbadgesAddress: string;
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
  ClaimNumbers = 'ClaimNumbers'
}

/**
 * @category Interfaces
 */
export interface iPluginDoc<T extends NumberType> extends Doc {
  /** The BitBadges address who created the plugin doc */
  createdBy: BitBadgesAddress;

  /** The BitBadges address of the user who is currently managing this */
  managedBy: BitBadgesAddress;

  /** The unique plugin ID */
  pluginId: string;

  /** The secret of the plugin. Used to verify BitBadges as origin of request. */
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

  /** Locale that is supported by the plugin. By default, we assume 'en' is supported if not specified. */
  locale?: string;

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

  /** Whether the plugin should skip processing webhooks. We will just auto-treat it as successful. */
  skipProcessingWebhook?: boolean;

  /** Ignore simulations? */
  ignoreSimulations?: boolean;

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

  /** The redirect URI for user inputs. */
  userInputRedirect?: {
    /** The base URI for user inputs. Note: This is experimental and not fully supported yet. */
    baseUri?: string;
    /** The tutorial URI for user inputs. */
    tutorialUri?: string;
  };

  /** The redirect URI for claim creators. */
  claimCreatorRedirect?: {
    /** The tool URI for claim creators. Note: This is experimental and not fully supported yet. */
    toolUri?: string;
    /** The tutorial URI for claim creators. */
    tutorialUri?: string;
    /** The tester URI for claim creators. Note: This is experimental and not fully supported yet. */
    testerUri?: string;
  };

  /** The verification URL config. This lets us know what should be passed to the plugin payload. */
  verificationCall?: {
    uri: string;
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
    hardcodedInputs: Array<JsonBodyInputWithValue>;

    passAddress?: boolean;
    passDiscord?: boolean;
    passEmail?: boolean;
    passTwitter?: boolean;
    passGoogle?: boolean;
    passYoutube?: boolean;
    passGithub?: boolean;
    passTwitch?: boolean;
    passStrava?: boolean;
    passReddit?: boolean;
    passBluesky?: boolean;
    passShopify?: boolean;
    passFacebook?: boolean;
    passTelegram?: boolean;
    passFarcaster?: boolean;
    passSlack?: boolean;
    passMeetup?: boolean;
    passMailchimp?: boolean;
    postProcessingJs: string;
  };

  /**
   * Custom details display for the plugin. Use {{publicParamKey}} to dynamically display the values of public parameters.
   *
   * Example: "This plugin checks for a minimum of {{publicBalanceParam}} balance."
   */
  customDetailsDisplay?: string;

  /**
   * Require BitBadges sign-in to use the plugin?
   * This will ensure that any addresss received is actually verified by BitBadges.
   * Otherwise, the address will be the claimee's address but it could be manually entered (if configuration allows).
   *
   * We recommend keeping this false to allow for non-indexed support and also be more flexible
   * for the claim creator's implementation.
   */
  requireSignIn?: boolean;
}

/**
 * @category Interfaces
 */
export interface iDepositBalanceDoc<T extends NumberType> extends Doc {
  /** The BitBadges address of the user */
  bitbadgesAddress: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iSIWBBRequestDoc<T extends NumberType> extends Doc {
  /** The actual code itself */
  code: string;

  /** The BitBadges address of the signer */
  bitbadgesAddress: BitBadgesAddress;
  /**The native address of the signer */
  address: NativeAddress;
  /** The native chain for the user */
  chain: SupportedChain;

  name?: string;
  description?: string;
  image?: string;

  scopes: OAuthScopeDetails[];
  expiresAt: UNIXMilliTimestamp<T>;

  /** The timestamp of when the signature was created (milliseconds since epoch) */
  createdAt: UNIXMilliTimestamp<T>;
  /** If deleted, we still store temporarily for a period of time. We use a deletedAt timestamp to determine when to delete. */
  deletedAt?: UNIXMilliTimestamp<T>;

  /** The client ID of the app that requested the signature */
  clientId: string;

  /** The redirect URI of the app  */
  redirectUri?: string;

  /** The code challenge for the SIWBB request (if used with PKCE). */
  codeChallenge?: string;

  /** The code challenge method for the SIWBB request (if used with PKCE). */
  codeChallengeMethod?: 'S256' | 'plain';
}

/**
 * @category Interfaces
 */
export interface iMapDoc<T extends NumberType> extends Doc, iMapWithValues<T> {}

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
  /** Whether the claim fetch includes private params */
  _includesPrivateParams: boolean;
  /** Unique claim ID. */
  claimId: string;
  /** The original creator of the claim */
  createdBy?: BitBadgesAddress;
  /** The BitBadges address of the user who is currently managing this */
  managedBy?: BitBadgesAddress;
  /** Collection ID that the claim is for (if applicable - collection claims). */
  collectionId?: CollectionId;
  /** Standalone claims are not linked with a token or list. */
  standaloneClaim?: boolean;
  /** Address list ID that the claim is for (if applicable - list claims). */
  listId?: string;
  /** The tracker details for the claim (if applicable - collection claims). */
  trackerDetails?: iChallengeTrackerIdDetails<T>;
  /**
   * The balances to set for the claim.
   *
   * Only used for claims for collections that have off-chain indexed balances and are assigning balances based on the claim.
   */
  balancesToSet?: iPredeterminedBalances<T>;
  /** Claim plugins. These are the criteria that must pass for a user to claim. */
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
  /** If manual distribution is enabled, we do not handle any distribution of claim codes.
   * We leave that up to the claim creator.
   *
   * Only applicable for on-chain token claims. This is only used in advanced self-hosted cases.
   */
  manualDistribution?: boolean;
  /**
   * How the claim is expected to be completed. This is for display purposes for the frontend.
   *
   * Available options:
   * - in-site (default): The claim is expected to be completed in-site.
   * - api: The claim is expected to be completed via an API call.
   * - zapier: The claim is expected to be completed via Zapier auto-completion.
   *
   * Typically, you will use the in-site approach
   */
  approach?: string;
  /**
   * Seed code for the claim. Only used for on-chain token claims.
   *
   * This is how we produce all reserved codes for the on-chain merkle challenge / proofs.
   */
  seedCode?: string;
  /** Metadata for the claim. */
  metadata?: iMetadata<T>;
  /**
   * Algorithm to determine the claim number order. Blank is just incrementing claim numbers.
   *
   * For most cases, you will not need to specify this.
   */
  assignMethod?: string;
  /** Last updated timestamp for the claim. */
  lastUpdated?: T;
  /** The version of the claim. */
  version: T;
  /**
   * Custom satisfaction logic.
   *
   * If left blank, all plugins must pass for the claim to be satisfied.
   * Otherwise, you can specify a custom method to determine if the claim is satisfied.
   */
  satisfyMethod?: iSatisfyMethod;
  /**
   * Cache policy for the claim. Only needed for on-demand claims.
   */
  cachePolicy?: iClaimCachePolicy<T>;
  /**
   * For internal use by the frontend.
   *
   * @internal
   */
  _templateInfo?: {
    supportedApproaches?: string[];
    pluginId?: string;
    completedTemplateStep?: boolean;
  };
}

/**
 * A cost estimate with an amount and denomination, similar to CosmosCoin but for display purposes only.
 *
 * @category Interfaces
 */
export interface iEstimatedCost<T extends NumberType> {
  /** The amount of the cost */
  amount: T;
  /** The denomination of the cost (e.g. 'USD', 'ETH', etc.) */
  denom: string;
}
