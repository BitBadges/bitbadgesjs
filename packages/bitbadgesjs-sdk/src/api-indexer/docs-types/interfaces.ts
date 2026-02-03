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
import type { iCollectionApproval, iUserIncomingApprovalWithDetails } from '@/interfaces/types/approvals.js';
import type { CollectionId, iAddressList, iAmountTrackerIdDetails, iApprovalIdentifierDetails, iBalance, iCollectionInvariants, iCollectionMetadata, iConversionWithoutDenom, iDenomUnit, iDenomUnitWithDetails, iPathMetadata, iPathMetadataWithDetails, iPrecalculateBalancesFromApprovalDetails, iPrecalculationOptions, iTokenMetadata, iUintRange } from '@/interfaces/types/core.js';
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
export type UNIXMilliTimestamp = string | number;

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
 * A native address is an address that is native to the user's chain.
 * For now, we only support Cosmos / BitBadges 'bb1...' addresses.
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
export interface iSocialConnections {
  discord?: {
    username: string;
    id: string;
    discriminator?: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  twitter?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  google?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  github?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  twitch?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  strava?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  reddit?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  meetup?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  bluesky?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  mailchimp?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  facebook?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  googleCalendar?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  youtube?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  linkedIn?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  shopify?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  telegram?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  farcaster?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
  slack?: {
    username: string;
    id: string;
    lastUpdated: UNIXMilliTimestamp;
  };
}

/**
 * Details about the user's push notification preferences.
 *
 * @category Interfaces
 */
export interface iNotificationPreferences {
  /** The email to receive push notifications. */
  email?: string;
  /** The Discord ID to receive push notifications. */
  discord?: { id: string; username: string; discriminator: string | undefined; token: string } | undefined;
  /** The verification status of the email. */
  emailVerification?: iEmailVerificationStatus;
  /** The preferences for the notifications. What type of notifications does the user want to receive? */
  preferences?: {
    transferActivity?: boolean;
    claimActivity?: boolean;
    ignoreIfInitiator?: boolean;
    signInAlertsEnabled?: boolean;
  };
}

/**
 * The verification status of the user's email.
 *
 * @category Interfaces
 */
export interface iEmailVerificationStatus {
  /** Whether or not the email has been verified. */
  verified?: boolean;
  /** Verified at timestamp. */
  verifiedAt?: UNIXMilliTimestamp;
  /** The email verification token. This is used for verification and unsubscription. */
  token?: string;
  /** The expiry of the token for verification purposes. */
  expiry?: UNIXMilliTimestamp;
  /** A unique code that we will send with all emails to verify that BitBadges is the one sending the email. */
  antiPhishingCode?: string;
}

/**
 * The base document interface for all acitivity types.
 *
 * @category Interfaces
 */
export interface iActivityDoc extends Doc {
  /** The timestamp of the activity. */
  timestamp: UNIXMilliTimestamp;
  /** The block number of the activity. */
  block: string | number;
  /** Whether or not the notifications have been handled by the indexer or not. */
  _notificationsHandled?: boolean;
  /** Only for private purposes? */
  private?: boolean;
}

/**
 * @category Interfaces
 */
export interface iReviewDoc extends iActivityDoc {
  /** The review text (max 2048 characters). */
  review: string;
  /** The number of stars given (1-5). */
  stars: string | number;
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
export interface iCoinTransferItem {
  /** The type of the coin transfer. */
  from: BitBadgesAddress;
  /** The type of the coin transfer. */
  to: BitBadgesAddress;
  /** The amount of the coin transfer. */
  amount: string | number;
  /** The denom of the coin transfer. */
  denom: string;
  /** Is protocol fee? */
  isProtocolFee: boolean;
}

/**
 * @category Interfaces
 */
export interface iTransferActivityDoc extends iActivityDoc {
  /** The list of recipients. */
  to: BitBadgesAddress[];
  /** The sender of the tokens. */
  from: BitBadgesAddress;
  /** The list of balances and token IDs that were transferred. */
  balances: iBalance[];
  /** The collection ID for the tokens that was transferred. */
  collectionId: CollectionId;
  /** The memo of the transfer. */
  memo?: string;
  /** Which approval to use to precalculate the balances? */
  precalculateBalancesFromApproval?: iPrecalculateBalancesFromApprovalDetails;
  /** The prioritized approvals of the transfer. This is used to check certain approvals before others to ensure intended behavior. */
  prioritizedApprovals?: iApprovalIdentifierDetails[];
  /** The user who initiated the transfer transaction. */
  initiatedBy: BitBadgesAddress;
  /** The transaction hash of the activity. */
  txHash?: string;
  /** Precalculation options */
  precalculationOptions?: iPrecalculationOptions;
  /** Coin transfers details */
  coinTransfers?: iCoinTransferItem[];
  /** Approvals used for the transfer */
  approvalsUsed?: iApprovalIdentifierDetails[];
  /** The token ID for the transfer */
  tokenId?: string | number;
  /** The price of the transfer */
  price?: string | number;
  /** The volume of the transfer */
  volume?: string | number;
  /** The denomination of the transfer */
  denom?: string;
}

/**
 * @category Interfaces
 */
export interface iClaimActivityDoc extends iActivityDoc {
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
export interface iPointsActivityDoc extends iActivityDoc {
  /** The BitBadges address of the user who earned the points */
  bitbadgesAddress: BitBadgesAddress;
  /** The amount of points before the activity */
  oldPoints: string | number;
  /** The amount of points after the activity */
  newPoints: string | number;
  /** The application ID of the points activity */
  applicationId: string;
  /** The page ID of the points activity */
  pageId: string;
}

/**
 * @category Interfaces
 */
export interface iBaseStats extends Doc {
  /** The overall volume of the collection */
  overallVolume: iCosmosCoin[];
  /** The daily volume of the collection */
  dailyVolume: iCosmosCoin[];
  /** The weekly volume of the collection */
  weeklyVolume: iCosmosCoin[];
  /** The monthly volume of the collection */
  monthlyVolume: iCosmosCoin[];
  /** The yearly volume of the collection */
  yearlyVolume: iCosmosCoin[];
  /** Last set timestamp */
  lastUpdatedAt: UNIXMilliTimestamp;
}

/**
 * @category Interfaces
 */
export interface iCollectionStatsDoc extends iBaseStats {
  /** The collection ID */
  collectionId: CollectionId;
  /** Floor price of the collection */
  floorPrices?: iCosmosCoin[];
  /** Number of unique owners by time */
  uniqueOwners: iBalance[];
  /** Floor price history */
  floorPriceHistory?: iFloorPriceHistory[];
  /** The payout reward */
  payoutRewards?: iCosmosCoin[];
}

/**
 * @category Interfaces
 */
export interface iFloorPriceHistory {
  /** The floor price */
  floorPrice?: iCosmosCoin;
  /** Updated at tiemstamp */
  updatedAt: UNIXMilliTimestamp;
}

/**
 * @category Interfaces
 */
export interface iTokenFloorPriceDoc extends Doc {
  /** The collection ID */
  collectionId: CollectionId;
  /** The token ID */
  tokenId: string | number;
  /** The floor price */
  floorPrices?: iCosmosCoin[];
  /** Floor price history */
  floorPriceHistory?: iFloorPriceHistory[];
}

/**
 * @category Interfaces */
export interface iApprovalItemDoc extends Doc {
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
  price?: string | number;
  /** Is active currently */
  isActive?: boolean;

  /** The token ID */
  tokenId?: string | number;
  /** Approval itself */
  approval: iCollectionApproval;
  /** Deleted at timestamp */
  deletedAt?: UNIXMilliTimestamp;
  /** Next check time */
  nextCheckTime?: UNIXMilliTimestamp;
  /** Number of transfers left */
  numTransfersLeft?: string | number;
  /** Denom */
  denom?: string;
}

/**
 * @category Interfaces
 */
export interface iCollectionDoc extends Doc {
  /** The collection ID */
  collectionId: CollectionId;
  /** The collection metadata */
  collectionMetadata: iCollectionMetadata;
  /** The token metadata */
  tokenMetadata: iTokenMetadata[];
  /** The custom data */
  customData: string;
  /** The manager */
  manager: BitBadgesAddress;
  /** The collection permissions */
  collectionPermissions: iCollectionPermissions;
  /** The collection approved transfers timeline */
  collectionApprovals: iCollectionApproval[];
  /** The standards */
  standards: string[];
  /** The is archived flag */
  isArchived: boolean;
  /** The default balances for users who have not interacted with the collection yet. Only used if collection has "Standard" balance type. */
  defaultBalances: iUserBalanceStore;
  /** The BitBadges address of the user who created this collection */
  createdBy: BitBadgesAddress;
  /** The block number when this collection was created */
  createdBlock: string | number;
  /** The timestamp when this collection was created (milliseconds since epoch) */
  createdTimestamp: UNIXMilliTimestamp;
  /** The update history of this collection */
  updateHistory: iUpdateHistory[];
  /** Valid token IDs for the collection */
  validTokenIds: iUintRange[];
  /** Mint escrow address */
  mintEscrowAddress: string;
  /** The IBC wrapper paths for the collection */
  cosmosCoinWrapperPaths: iCosmosCoinWrapperPath[];
  /** The alias (non-wrapping) paths for the collection */
  aliasPaths: iAliasPath[];
  /** Collection-level invariants that cannot be broken. These are set upon genesis and cannot be modified. */
  invariants: iCollectionInvariants;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinWrapperPath {
  address: string;
  denom: string;
  conversion: iConversionWithoutDenom;
  symbol: string;
  denomUnits: iDenomUnit[];
  allowOverrideWithAnyValidToken: boolean;
  /** The metadata for this wrapper path. */
  metadata: iPathMetadata;
}

/**
 * @category Interfaces
 */
export interface iPoolInfo {
  poolId: string;
  address: string;
  allAssetDenoms: string[];
  poolParams?: {
    swapFee: string;
    exitFee: string;
  };
  volume: iPoolInfoVolume;
  lastVolumeUpdate: number;
  liquidity: iCosmosCoin[];
  lastLiquidityUpdate: number;
}

/**
 * @category Interfaces
 */
export interface iAssetInfoDoc extends Doc {
  asset: string;
  symbol: string;
  price: number;
  lastUpdated: string | number;
  totalLiquidity: iCosmosCoin[];
  volume24h: number;
  volume7d: number;
  percentageChange24h: number;
  percentageChange7d: number;
  /** Recent price trend data points for charting (last 7 days) */
  recentPriceTrend?: {
    /** Array of price data points with timestamps */
    pricePoints: Array<{
      price: number;
      timestamp: string | number;
    }>;
  };
  /** Whether this asset is verified */
  verified?: boolean;
  /** Calculation type for the asset */
  calculationType?: string;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoinWrapperPathWithDetails extends iCosmosCoinWrapperPath {
  /** Metadata object containing uri, customData, and fetched metadata. */
  metadata: iPathMetadataWithDetails;
  /** The denomination units with metadata details populated. */
  denomUnits: iDenomUnitWithDetails[];
  /** Pool Infos */
  poolInfos?: iPoolInfo[];
  /** Asset Pair Infos */
  assetPairInfos?: iAssetInfoDoc[];
}

/**
 * @category Interfaces
 */
export interface iAliasPath {
  denom: string;
  conversion: iConversionWithoutDenom;
  symbol: string;
  denomUnits: iDenomUnit[];
  /** The metadata for this alias path. */
  metadata: iPathMetadata;
}

/**
 * @category Interfaces
 */
export interface iAliasPathWithDetails extends iAliasPath {
  /** Metadata object containing uri, customData, and fetched metadata. */
  metadata: iPathMetadataWithDetails;
  /** The denomination units with metadata details populated. */
  denomUnits: iDenomUnitWithDetails[];
  /** Pool Infos */
  poolInfos?: iPoolInfo[];
  /** Asset Pair Infos */
  assetPairInfos?: iAssetInfoDoc[];
}

/**
 * @category Interfaces
 */
export interface iPoolInfoVolume {
  daily: iCosmosCoin[];
  weekly: iCosmosCoin[];
  monthly: iCosmosCoin[];
  allTime: iCosmosCoin[];
}

/**
 * @category Interfaces
 */
export interface iAccountDoc extends Doc {
  /** The public key of the account */
  publicKey: string;
  /** The account number of the account. This is the account number registered on the BitBadges blockchain.*/
  accountNumber: string | number;
  /** The public key type of the account */
  pubKeyType: string;
  /** The BitBadges address of the account */
  bitbadgesAddress: BitBadgesAddress;
  /** The sequence of the account. This is the nonce for the blockchain for this account */
  sequence?: string | number;
  /** The BADGE balance of the account and other sdk.coin balances */
  balances?: iCosmosCoin[];
}

/**
 * @category Interfaces
 */
export interface iCustomPage {
  /** The title of the custom page */
  title: string;
  /** The description of the custom page */
  description: string;
  /** The token IDs to display on the custom page */
  items: iBatchTokenDetails[];
}

/**
 * @category Interfaces
 */
export interface iProfileDoc extends Doc {
  /** Whether we have already fetched the profile or not */
  fetchedProfile?: 'full' | 'partial';

  /** The timestamp of the last activity seen for this account (milliseconds since epoch) */
  seenActivity?: UNIXMilliTimestamp;
  /** The timestamp of when this account was created (milliseconds since epoch) */
  createdAt?: UNIXMilliTimestamp;

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

  /** Affiliate code */
  affiliateCode?: string;

  /** The hidden badges of the account */
  hiddenTokens?: iBatchTokenDetails[];

  /** The profile picture URL of the account */
  profilePicUrl?: string;
  /** The banner image URL of the account */
  bannerImage?: string;

  /** The username of the account */
  username?: string;

  /** The latest chain the user signed in with */
  latestSignedInChain?: SupportedChain;

  /** The notifications of the account */
  notifications?: iNotificationPreferences;

  /** Social connections stored for the account */
  socialConnections?: iSocialConnections;

  /** Public social connections stored for the account */
  publicSocialConnections?: iSocialConnections;
}

/**
 * @category Interfaces
 */
export interface iQueueDoc extends Doc {
  /** The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in tokenIds */
  uri: string;
  /** The collection ID of the metadata to be fetched */
  collectionId: CollectionId;
  /** The load balance ID of the metadata to be fetched. Only the node with the same load balance ID will fetch this metadata */
  loadBalanceId: string | number;
  /** The timestamp of when this metadata was requested to be refreshed (milliseconds since epoch) */
  refreshRequestTime: UNIXMilliTimestamp;
  /** The number of times this metadata has been tried to be fetched but failed */
  numRetries: string | number;
  /** The timestamp of when this metadata was last fetched (milliseconds since epoch) */
  lastFetchedAt?: UNIXMilliTimestamp;
  /** The error message if this metadata failed to be fetched */
  error?: string;
  /** The timestamp of when this document was deleted (milliseconds since epoch) */
  deletedAt?: UNIXMilliTimestamp;
  /** The timestamp of when this document should be fetched next (milliseconds since epoch) */
  nextFetchTime?: UNIXMilliTimestamp;
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
    amount: string | number;
    recipient: BitBadgesAddress;
    denom: string;
  };
}

/**
 * @category Interfaces
 */
export interface iIndexerStatus {
  status: iStatusDoc;
}

/**
 * @category Interfaces
 */
export interface iTransactionEntry {
  /** The amount of the transaction */
  amount: string | number;
  /** The gas limit of the transaction */
  limit: string | number;
  /** The timestamp when the transaction occurred (milliseconds since epoch) */
  timestamp: UNIXMilliTimestamp;
}

/**
 * @category Interfaces
 */
export interface iLatestBlockStatus {
  /** The height of the latest block */
  height: string | number;
  /** The transaction index of the latest block */
  txIndex: string | number;
  /** The timestamp of the latest block (milliseconds since epoch) */
  timestamp: UNIXMilliTimestamp;
}

/**
 * @category Interfaces
 */
export interface iStatusDoc extends Doc {
  /** The latest synced block status (i.e. height, txIndex, timestamp) */
  block: iLatestBlockStatus;
  /** The next collection ID to be used */
  nextCollectionId: string | number;
  /** The current gas price based on the average of recent transactions */
  gasPrice: number;
  /** The last X transactions with timestamps for dynamic reset functionality */
  lastXTxs?: iTransactionEntry[];
}

/**
 * @category Interfaces
 */
export interface iAddressListDoc extends iAddressList, Doc {
  /** The BitBadges address of the user who created this list */
  createdBy: BitBadgesAddress;
  /** The BitBadges address of the user who is currently managing this */
  managedBy: BitBadgesAddress;
  /** The update history of this list */
  updateHistory: iUpdateHistory[];
  /** The block number when this list was created */
  createdBlock: string | number;
  /** The timestamp of when this list was last updated (milliseconds since epoch) */
  lastUpdated: UNIXMilliTimestamp;
  /** The NSFW reason if this list is NSFW */
  nsfw?: { reason: string };
  /** The reported reason if this list is reported */
  reported?: { reason: string };
}

/**
 * @category Interfaces
 */
export interface iBalanceDoc extends iUserBalanceStore, Doc {
  /** The collection ID */
  collectionId: CollectionId;

  /** The BitBadges address of the user */
  bitbadgesAddress: BitBadgesAddress;

  /** The update history of this balance */
  updateHistory: iUpdateHistory[];

  /** Optional tags for this balance */
  tags?: string[];
}

/**
 * @category Interfaces
 */
export interface iPointsDoc extends Doc {
  /** The address to calculate points for */
  address: BitBadgesAddress;
  /** The points for the address */
  points: string | number;
  /** The timestamp of when the points were last calculated (milliseconds since epoch) */
  lastCalculatedAt: UNIXMilliTimestamp;
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
export interface iBalanceDocWithDetails extends iBalanceDoc {
  /** The outgoing approvals with details like metadata and address lists. */
  outgoingApprovals: iUserOutgoingApprovalWithDetails[];
  /** The incoming approvals with details like metadata and address lists. */
  incomingApprovals: iUserIncomingApprovalWithDetails[];
  /** The user permissions with details like metadata and address lists. */
  userPermissions: iUserPermissionsWithDetails;
}

/**
 * @category Claims
 */
export type ClaimIntegrationPluginType = 'password' | 'numUses' | 'discord' | 'codes' | 'github' | 'google' | 'twitch' | 'twitter' | 'strava' | 'googleCalendar' | 'youtube' | 'reddit' | 'bluesky' | 'mailchimp' | 'facebook' | 'linkedIn' | 'telegram' | 'shopify' | 'farcaster' | 'slack' | 'transferTimes' | 'initiatedBy' | 'whitelist' | 'email' | 'ip' | 'webhooks' | 'successWebhooks' | 'payments' | string;

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

type OauthAppName = 'twitter' | 'github' | 'google' | 'email' | 'discord' | 'twitch' | 'strava' | 'youtube' | 'reddit' | 'facebook' | 'mailchimp' | 'bluesky' | 'googleCalendar' | 'telegram' | 'farcaster' | 'slack' | 'linkedIn' | 'shopify';

/**
 * @category Claims
 */
export type any = T extends 'codes'
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
export type any = T extends 'numUses'
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
                transferTimes: iUintRange[];
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
export type any = T extends 'password'
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
            : Record<string, any>;

/**
 * Public state is the current state of the claim integration that is visible to the public. For example, the number of times a claim code has been used.
 *
 * @category Claims
 */
export type any = T extends 'numUses'
  ? {
      numUses?: number;
      usedClaimNumbers?: iUintRange[];
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
        usedCodeRanges?: iUintRange[];
      }
    : Record<string, any>;

/**
 * Private state is the current state of the claim integration that is visible to only those who can fetch private parameters.
 *
 * @category Claims
 */
export type any = T extends OauthAppName
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
export interface IntegrationPluginParams {
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
  pluginId: string | number;
  /** The version of the plugin */
  version: string;
  /** The parameters of the plugin that are visible to the public. These are custom per plugin type. */
  publicParams: any;
  /** The parameters of the plugin that are not visible to the public. These are custom per plugin type. */
  privateParams: any;
  /** Custom display metadata for the plugin. This will override the default metadata for the plugin. */
  metadata?: { name: string; description: string; image?: string };
}

/**
 * @category Claims
 */
export interface IntegrationPluginDetails extends IntegrationPluginParams {
  /** The current state of the plugin. This is returned by BitBadges for information purposes. This is altered to not reveal sensitive information. */
  publicState: any;
  /** The private state of the plugin. This is the exact state used by BitBadges behind the scenes. */
  privateState?: any;
}

/**
 * @category Claims
 */
export interface IntegrationPluginDetailsUpdate extends IntegrationPluginParams {
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
  newState?: any;
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
export type ManagePluginRequest = IntegrationPluginDetailsUpdate;

/**
 * @category Interfaces
 */
export type CreateClaimRequest = Omit<iClaimDetails, 'plugins' | 'version' | 'trackerDetails' | '_includesPrivateParams' | '_templateInfo' | 'managedBy' | 'createdBy' | 'standaloneClaim' | 'lastUpdated'> & {
  cid?: string;
  plugins: ManagePluginRequest[];
  metadata?: iMetadataWithoutInternals;
};

/**
 * @category Interfaces
 */
export type UpdateClaimRequest = Omit<iClaimDetails, 'plugins' | 'version' | 'trackerDetails' | '_includesPrivateParams' | '_templateInfo' | 'managedBy' | 'createdBy' | 'standaloneClaim' | 'lastUpdated' | 'seedCode'> & {
  cid?: string;
  plugins: ManagePluginRequest[];
  metadata?: iMetadataWithoutInternals;
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
export interface iEvent {
  /** The event ID */
  eventId: string;

  /** The event metadata */
  metadata: iMetadata;

  /** Other event specific metadata */
  eventTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iTierWithOptionalWeight {
  /** The claim ID to satisfy the tier */
  claimId: string;
  /** The weight of the tier */
  weight?: string | number;
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
export interface iApplicationPage {
  /** The page ID */
  pageId: string;

  /** The type of the page */
  type?: string;

  /** Metadata for the page */
  metadata: iMetadata;

  /** Points to display in the page */
  points?: iTierWithOptionalWeight[];
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
export interface iApplicationDoc extends Doc {
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
  createdAt: UNIXMilliTimestamp;

  /** The last updated timestamp */
  lastUpdated?: UNIXMilliTimestamp;

  /** The overall metadata for the application */
  metadata: iMetadata;

  /** The pages for the application */
  pages: iApplicationPage[];
}

/**
 * @category Interfaces
 */
export interface iInheritMetadataFrom {
  /** The claim ID to link to */
  claimId?: string;
  /** The application ID to link to */
  applicationId?: string;
  /** The collection ID to link to */
  collectionId?: CollectionId;
  /** The map ID to link to */
  mapId?: string;
  /** The token ID to link to "collectionId: CollectionIddgeId" */
  tokenId?: string;
}

/**
 * @category Interfaces
 */
export interface iUtilityPageDoc extends Doc {
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
  createdAt: UNIXMilliTimestamp;

  /** The last updated timestamp */
  lastUpdated?: UNIXMilliTimestamp;

  /** The overall metadata for the listing */
  metadata: iMetadata;

  /** Where to inherit metadata from? Only one can be specified. */
  inheritMetadataFrom?: iInheritMetadataFrom;

  /** The paginated content for the listing */
  content: iUtilityPageContent[];

  /** The relevant links for the listing */
  links: iUtilityPageLink[];

  /** Optional time range for when the listing should be shown */
  displayTimes?: iUintRange | undefined;

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
  viewCount?: string | number;

  /** The estimated cost for this utility/service */
  estimatedCost?: iEstimatedCost;

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
  linkedTo?: iLinkedTo;

  /** Locale (ex: es, fr, etc.). If not specified, we assume en. */
  locale?: string;

  /** Home page view */
  homePageView?: {
    type: 'tokens' | 'lists' | 'claims' | 'applications';
    category: string;
  };
}

/**
 * @category Interfaces
 */
export interface iLinkedTo {
  /** The collection ID */
  collectionId?: CollectionId;
  /** The token IDs */
  tokenIds?: iUintRange[];
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
export interface iUtilityPageLink {
  /** The URL of the link */
  url: string;
  /** The claim ID to link to */
  claimId?: string;
  /** The application ID to link to */
  applicationId?: string;
  /** The collection ID to link to */
  collectionId?: CollectionId;
  /** The map ID to link to */
  mapId?: string;
  /** Metadata for the link. Only applicable if the link is to a non-BitBadges entity. In other words, not tied to a specific claim, application, collection, etc. */
  metadata?: iMetadata;
}

/**
 * @category Interfaces
 */
export interface iListingViewsDoc extends Doc {
  /** The listing ID this view count is for */
  listingId: string;

  /** The total number of views */
  viewCount: string | number;

  /** The last time this view count was updated */
  lastUpdated: UNIXMilliTimestamp;

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
export interface iClaimBuilderDoc extends Doc {
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
  trackerDetails?: iChallengeTrackerIdDetails;

  /** Deleted at timestamp */
  deletedAt?: UNIXMilliTimestamp;

  /** Dynamic checks to run in the form of plugins */
  plugins: IntegrationPluginParams[];

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
  metadata?: iMetadata;

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
    siwbbClaim?: boolean;
  };

  /**
   * Rewards to be shown upon a successful claim. If you need further gating, you can do this in two-steps.
   */
  rewards?: iClaimReward[];

  /** Estimated cost for the user */
  estimatedCost?: string;
  /** Estimated time to satisfy the claim's requirements */
  estimatedTime?: string;

  /** If true, the claim will be shown in search results */
  showInSearchResults?: boolean;
  /** The categories of the claim */
  categories?: string[];

  lastUpdated: UNIXMilliTimestamp;
  createdAt: UNIXMilliTimestamp;

  version: string | number;

  testOnly?: boolean;

  /**
   * For on-demand claims, we cache the result per user for a short period.
   *
   * To help optimize performance, please provide a cache policy.
   *
   * This is only applicable to on-demand claims.
   */
  cachePolicy?: iClaimCachePolicy;
}

/**
 * @category Interfaces
 */
export interface iClaimCachePolicy {
  /**
   * The number of seconds to cache the result. Default is 5 minutes (300 seconds) if none is specified.
   *
   * Note: This may be overridden by other options
   */
  ttl?: string | number;
  /**
   * Permanent once the claim is calculated once. We will cache results indefinitely.
   */
  alwaysPermanent?: boolean;
  /**
   * Permanent after a specific timestamp. Until then, we use the ttl. We will cache results indefinitely after this timestamp.
   */
  permanentAfter?: UNIXMilliTimestamp;
}

/**
 * @category Interfaces */
export interface iClaimReward {
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
export class ClaimReward extends BaseNumberTypeClass<ClaimReward> implements iClaimReward {
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

  constructor(data: iClaimReward) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ClaimReward {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimReward;
  }
}

/**
 * @category Interfaces
 */
export interface iApprovalTrackerDoc extends iAmountTrackerIdDetails, Doc {
  /** The number of transfers. Is an incrementing tally. */
  numTransfers: string | number;
  /** A tally of the amounts transferred for this approval. */
  amounts: iBalance[];
  /** Last updated timestamp */
  lastUpdatedAt: UNIXMilliTimestamp;
}

/**
 * @category Interfaces
 */
export interface iChallengeTrackerIdDetails {
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
export interface iMerkleChallengeTrackerDoc extends Doc {
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
  usedLeafIndices: iUsedLeafStatus[];
}

/**
 * @category Interfaces
 */
export interface iUsedLeafStatus {
  /** The leaf index */
  leafIndex: string | number;
  /** The address that used the leaf */
  usedBy: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iFetchDoc extends Doc {
  /** The content of the fetch document. Note that we store balances in BALANCES_DB and not here to avoid double storage. */
  content?: iMetadata | iApprovalInfoDetails | iOffChainBalancesMap | iChallengeDetails;
  /** The time the document was fetched */
  fetchedAt: UNIXMilliTimestamp;
  /** The block the document was fetched */
  fetchedAtBlock: string | number;
  /** The type of content fetched. This is used for querying purposes */
  db: 'ApprovalInfo' | 'Metadata' | 'Balances' | 'ChallengeInfo';
  /** True if the document is permanent (i.e. fetched from a permanent URI like IPFS) */
  isPermanent: boolean;
}

/**
 * @category Interfaces
 */
export interface iRefreshDoc extends Doc {
  /** The collection ID */
  collectionId: CollectionId;
  /** The time the refresh was requested (Unix timestamp in milliseconds) */
  refreshRequestTime: UNIXMilliTimestamp;
}

/**
 * @category Interfaces
 */
export interface iAirdropDoc extends Doc {
  /** True if the airdrop has been completed */
  airdropped: boolean;
  /** The timestamp of when the airdrop was completed (milliseconds since epoch) */
  timestamp: UNIXMilliTimestamp;
  /** The hash of the airdrop transaction */
  hash?: string;

  ip?: string;
}

/**
 * @category Interfaces
 */
export interface iIPFSTotalsDoc extends Doc {
  /** The total bytes uploaded */
  bytesUploaded: string | number;
}

/**
 * @category Interfaces
 */
export interface iCreatorCreditsDoc extends Doc {
  /** The total credits */
  credits: string | number;
  /** The limit of credits */
  creditsLimit?: string | number;
}

/**
 * @category Interfaces
 */
export interface iComplianceDoc extends Doc {
  tokens: {
    nsfw: iBatchTokenDetails[];
    reported: iBatchTokenDetails[];
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
export interface iDeveloperAppDoc extends Doc {
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
  lastUpdated?: UNIXMilliTimestamp;
  /** The time the app was created */
  createdAt?: UNIXMilliTimestamp;
}

/**
 * @category Interfaces
 */
export type DynamicDataHandlerType = OauthAppName | 'addresses';

/**
 * @category Interfaces
 */
export type any = Q extends 'email' ? { emails: string[] } : Q extends OauthAppName ? { ids: string[]; usernames: string[] } : Q extends 'addresses' ? { addresses: string[] } : never;

/**
 * @category Interfaces
 */
export type any = Q extends 'email' ? { email: string } : Q extends OauthAppName ? { id: string; username: string } : Q extends 'addresses' ? { address: string } : never;

/**
 * @category Interfaces
 */
export type ActionName = string;
/**
 * @category Interfaces
 */
export type DynamicDataHandlerActionRequest = { actionName: ActionName; payload: any<DynamicDataHandlerType> };

/**
 * @category Interfaces
 */
export interface iDynamicDataDoc extends Doc {
  /** The handler ID. Can also be thought of as the type of dynamic data ("addresses", "email", ...) */
  handlerId: string;
  /** The dynamic data ID. The ID of the store. */
  dynamicDataId: string;
  /** The label of the data store */
  label: string;
  /** The data secret. Used in cases where you are not signed in as creator. This authenticates the request. Not applicable to public stores */
  dataSecret: string;
  /** The data itself. */
  data: any;
  /** The creator of the dynamic data store */
  createdBy: BitBadgesAddress;
  /** The manager of the dynamic data store */
  managedBy: BitBadgesAddress;
  /** Whether the dynamic data store is public. If true, the data can be accessed without authentication. */
  publicUseInClaims?: boolean;
  /** The time the dynamic data store was created */
  createdAt?: UNIXMilliTimestamp;
  /** The time the dynamic data store was last updated */
  lastUpdated?: UNIXMilliTimestamp;
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
export interface iPluginDoc extends Doc {
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

  lastUpdated: UNIXMilliTimestamp;

  createdAt: UNIXMilliTimestamp;
  deletedAt?: UNIXMilliTimestamp;

  approvedUsers: NativeAddress[];

  /** Array of version-controlled plugin configurations */
  versions: iPluginVersionConfig[];
}

/**
 * @category Interfaces
 */
export interface iPluginVersionConfig {
  /** Version of the plugin */
  version: string | number;

  /** True if the version is finalized */
  finalized: boolean;

  /** The time the version was created */
  createdAt: UNIXMilliTimestamp;

  /** The time the version was last updated */
  lastUpdated: UNIXMilliTimestamp;

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
export interface iDepositBalanceDoc extends Doc {
  /** The BitBadges address of the user */
  bitbadgesAddress: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iSIWBBRequestDoc extends Doc {
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
  expiresAt: UNIXMilliTimestamp;

  /** The timestamp of when the signature was created (milliseconds since epoch) */
  createdAt: UNIXMilliTimestamp;
  /** If deleted, we still store temporarily for a period of time. We use a deletedAt timestamp to determine when to delete. */
  deletedAt?: UNIXMilliTimestamp;

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
export interface iMapDoc extends Doc, iMapWithValues {}

/**
 * @category Interfaces
 */
export interface iUpdateHistory {
  /** The transaction hash of the on-chain transaction that updated this. */
  txHash: string;
  /** The block number of the on-chain transaction that updated this. */
  block: string | number;
  /** The timestamp of the block of the on-chain transaction that updated this. */
  blockTimestamp: UNIXMilliTimestamp;
  /** The indexer's timestamp of the update. This is provided in some cases because the time of indexing may be inconsistent with the time of the block. */
  timestamp: UNIXMilliTimestamp;
}

/**
 * @inheritDoc iMap
 * @category Interfaces
 */
export interface iMapWithValues extends iMap {
  /** The (key, value) pairs for the maps that are set. */
  values: { [key: string]: iValueStore };
  /** The fetched/populated metadata for the map (if any). This is the actual metadata object with name, image, description, etc. */
  populatedMetadata?: iMetadata;
  /** The update history for the map. Maps are maintained through blockchain transactions. */
  updateHistory: iUpdateHistory[];
}

/**
 * @category Interfaces
 */
export interface iClaimDetails {
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
  /** The tracker details for the claim (if applicable - collection claims). */
  trackerDetails?: iChallengeTrackerIdDetails;
  /** Claim plugins. These are the criteria that must pass for a user to claim. */
  plugins: IntegrationPluginDetails[];
  /** Rewards for the claim. */
  rewards?: iClaimReward[];
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
  metadata?: iMetadata;
  /**
   * Algorithm to determine the claim number order. Blank is just incrementing claim numbers.
   *
   * For most cases, you will not need to specify this.
   */
  assignMethod?: string;
  /** Last updated timestamp for the claim. */
  lastUpdated?: string | number;
  /** The version of the claim. */
  version: string | number;
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
  cachePolicy?: iClaimCachePolicy;
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
export interface iEstimatedCost {
  /** The amount of the cost */
  amount: string | number;
  /** The denomination of the cost (e.g. 'USD', 'ETH', etc.) */
  denom: string;
}

/**
 * DynamicStoreDoc represents an on-chain dynamic store document from the API indexer.
 *
 * @category Interfaces
 */
export interface iDynamicStoreDoc extends Doc {
  storeId: string | number;
  createdBy: string;
  defaultValue: boolean;
  globalEnabled: boolean;
  uri?: string;
  customData?: string;
}

/**
 * DynamicStoreDocWithDetails extends DynamicStoreDoc with populated metadata.
 *
 * @category Interfaces
 */
export interface iDynamicStoreDocWithDetails extends iDynamicStoreDoc {
  metadata?: iMetadata;
}

/**
 * DynamicStoreValueDoc represents a value stored in an on-chain dynamic store for a specific address.
 *
 * @category Interfaces
 */
export interface iDynamicStoreValueDoc extends Doc {
  storeId: string | number;
  address: string;
  value: boolean;
}
