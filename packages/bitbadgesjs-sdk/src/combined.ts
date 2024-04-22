import { DeliverTxResponse } from '@cosmjs/stargate';
import MerkleTree from 'merkletreejs';
import { BlockinAndGroup, BlockinOrGroup } from './api-indexer';
import { Options as MerkleTreeJsOptions } from 'merkletreejs/dist/MerkleTree';

export type SupportedChain = 'Bitcoin' | 'Ethereum' | 'Cosmos' | 'Solana' | 'Unknown';

export interface AssetDetails {
  chain: string;
  collectionId: string | number;
  assetIds: (string | iUintRange)[];
  ownershipTimes: iUintRange[];
  mustOwnAmounts: iUintRange;
  additionalCriteria?: string;
}
export interface AndGroup {
  $and: AssetConditionGroup[];
}
export interface OrGroup {
  $or: AssetConditionGroup[];
}
export type AssetConditionGroup = AndGroup | OrGroup | OwnershipRequirements;
export interface OwnershipRequirements {
  assets: AssetDetails[];
  options?: {
    numMatchesForVerification?: string | number;
  };
}
export interface ChallengeParams {
  domain: string;
  statement: string;
  address: NativeAddress;
  uri: string;
  nonce: string;
  version?: string;
  chainId?: string;
  issuedAt?: string;
  expirationDate?: string;
  notBefore?: string;
  resources?: string[];
  assetOwnershipRequirements?: AssetConditionGroup;
}
export interface VerifyChallengeOptions {
  /**
   * Optionally define the expected details to check. If the challenge was edited and the details
   * do not match, the challenge will fail verification.
   */
  expectedChallengeParams?: Partial<ChallengeParams>;
  /**
   * For verification of assets, instead of dynamically fetching the assets, you can specify a snapshot of the assets.
   *
   * This is useful if you have a snapshot, balances will not change, or you are verifying in an offline manner.
   */
  balancesSnapshot?: object;
  /**
   * If true, we do not check timestamps (expirationDate / notBefore). This is useful if you are verifying a challenge that is expected to be verified at a future time.
   */
  skipTimestampVerification?: boolean;
  /**
   * If true, we do not check asset ownership. This is useful if you are verifying a challenge that is expected to be verified at a future time.
   */
  skipAssetVerification?: boolean;
  /**
   * The earliest issued At ISO date string that is valid. For example, if you want to verify a challenge that was issued within the last minute, you can specify this to be 1 minute ago.
   */
  earliestIssuedAt?: string;
  /**
   * If set, we will verify the issuedAt is within this amount of ms ago (i.e. issuedAt >= Date.now() - issuedAtTimeWindowMs)
   */
  issuedAtTimeWindowMs?: number;
  /**
   * If true, we do not check the signature. You can pass in an undefined ChainDriver
   */
  skipSignatureVerification?: boolean;
}

/**
 * @category Indexer
 */
export interface Doc {
  /** A unique stringified document ID */
  _docId: string;

  /** A unique document ID (Mongo DB ObjectID) */
  _id?: string;
}

/**
 * If an error occurs, the response will be an ErrorResponse.
 *
 * 400 - Bad Request (e.g. invalid request body)
 * 401 - Unauthorized (e.g. invalid session cookie; must sign in with Blockin)
 * 500 - Internal Server Error
 *
 * @category API Requests / Responses
 */
export interface ErrorResponse {
  /**
   * Serialized error object for debugging purposes. Technical users can use this to debug issues.
   */
  error?: string;
  /**
   * UX-friendly error message that can be displayed to the user. Always present if error.
   */
  errorMessage: string;
  /**
   * Authentication error. Present if the user is not authenticated.
   */
  unauthorized?: boolean;
}

/**
 * Type for pagination information.
 *
 * @category Indexer
 */
export interface PaginationInfo {
  /** The bookmark for the next page of results. Obtained from previous response. */
  bookmark: string;
  /** Whether there are more results to fetch. */
  hasMore: boolean;
}

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
 * @category Indexer
 */
export interface ErrorDoc {
  _docId: string;
  _id?: string;
  error: string;
  function: string;
}

/**
 * Numeric timestamp - value is equal to the milliseconds since the UNIX epoch.
 *
 * @category Interfaces
 */
export type UNIXMilliTimestamp = string | number;

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
}

/**
 * Details about the user's push notification preferences.
 *
 * @category Interfaces
 */
export interface iNotificationPreferences {
  /** The email to receive push notifications. */
  email?: string;
  /** The Discord username to receive notifications */
  discord?: { id: string; username: string; discriminator: string | undefined } | undefined;
  /** The verification status of the email. */
  emailVerification?: iEmailVerificationStatus;
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
export interface iEmailVerificationStatus {
  /** Whether or not the email has been verified. */
  verified?: boolean;
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
  from: CosmosAddress;
  /** The collection ID of the collection that was reviewed. Only applicable to collection reviews. */
  collectionId?: string | number;
  /** The Cosmos address of the user who the review is for. Only applicable to user reviews. */
  reviewedAddress?: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iTransferActivityDoc extends iActivityDoc {
  /** The list of recipients. */
  to: CosmosAddress[];
  /** The sender of the badges. */
  from: CosmosAddress;
  /** The list of balances and badge IDs that were transferred. */
  balances: iBalance[];
  /** The collection ID for the badges that was transferred. */
  collectionId: string | number;
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
export interface iListActivityDoc extends iActivityDoc {
  /** The list ID. */
  listId: string;
  /** Initiator of the activity. */
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
export interface iClaimAlertDoc extends iActivityDoc {
  /** The sender */
  from: string;
  /** The cosmos addresses of the users that have been alerted. */
  cosmosAddresses: CosmosAddress[];
  /** The collection ID of the claim alert. */
  collectionId: string | number;
  /** The message of the claim alert. */
  message?: string;
}

/**
 * @category Interfaces
 */
export interface iCollectionDoc extends Doc {
  /** The collection ID */
  collectionId: string | number;
  /** The collection metadata timeline */
  collectionMetadataTimeline: iCollectionMetadataTimeline[];
  /** The badge metadata timeline */
  badgeMetadataTimeline: iBadgeMetadataTimeline[];
  /** The type of balances (i.e. "Standard", "Off-Chain - Indexed", "Non-Public, "Off-Chain - Non-Indexed") */
  balancesType: 'Standard' | 'Off-Chain - Indexed' | 'Non-Public' | 'Off-Chain - Non-Indexed';
  /** The off-chain balances metadata timeline */
  offChainBalancesMetadataTimeline: iOffChainBalancesMetadataTimeline[];
  /** The custom data timeline */
  customDataTimeline: iCustomDataTimeline[];
  /** The manager timeline */
  managerTimeline: iManagerTimeline[];
  /** The collection approved transfers timeline */
  collectionApprovals: iCollectionApproval[];
  /** The standards timeline */
  standardsTimeline: iStandardsTimeline[];
  /** The is archived timeline */
  isArchivedTimeline: iIsArchivedTimeline[];
  /** The cosmos address of the user who created this collection */
  createdBy: CosmosAddress;
  /** The block number when this collection was created */
  createdBlock: string | number;
  /** The timestamp when this collection was created (milliseconds since epoch) */
  createdTimestamp: UNIXMilliTimestamp;
  /** The update history of this collection */
  updateHistory: iUpdateHistory[];
  /** The alias cosmos address for the collection */
  aliasAddress: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iAccountDoc extends Doc {
  /** The public key of the account */
  publicKey: string;
  /** The account number of the account */
  accountNumber: string | number;
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
  sequence?: string | number;
  /** The balance of the account */
  balance?: iCosmosCoin;
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
export interface iCustomPage {
  /** The title of the custom page */
  title: string;
  /** The description of the custom page */
  description: string;
  /** The badge IDs to display on the custom page */
  items: iBatchBadgeDetails[];
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
export interface iProfileDoc extends Doc {
  /** Whether we have already fetched the profile or not */
  fetchedProfile?: boolean;

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

  /** The custom links of the account */
  customLinks?: iCustomLink[];

  /** The hidden badges of the account */
  hiddenBadges?: iBatchBadgeDetails[];
  /** The hidden lists of the account */
  hiddenLists?: string[];

  /** The custom pages of the account */
  customPages?: {
    badges: iCustomPage[];
    lists: iCustomListPage[];
  };

  /** The watched lists of the account's portfolio */
  watchlists?: {
    badges: iCustomPage[];
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
  notifications?: iNotificationPreferences;

  /** Social connections stored for the account */
  socialConnections?: iSocialConnections;

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
export interface iQueueDoc extends Doc {
  /** The URI of the metadata to be fetched. If {id} is present, it will be replaced with each individual ID in badgeIds */
  uri: string;
  /** The collection ID of the metadata to be fetched */
  collectionId: string | number;
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
  status: iStatusDoc;
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
  /** The current gas price based on the average of the lastXGasAmounts */
  gasPrice: number;
  /** The last X gas prices */
  lastXGasAmounts: (string | number)[];
  /** The last X gas limits */
  lastXGasLimits: (string | number)[];
}

/**
 * @category Interfaces
 */
export interface iAddressListEditKey {
  /** The key that can be used to edit the address list */
  key: string;
  /** The expiration date of the key (milliseconds since epoch) */
  expirationDate: UNIXMilliTimestamp;
  /** True if the user can only add their signed in address to the list */
  mustSignIn?: boolean;
}

/**
 * @category Interfaces
 */
export interface iAddressListDoc extends iAddressList, Doc {
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
  /** True if this list is private and will not show up in search results */
  private?: boolean;
  /** True if this list is viewable if queried by the list ID directly */
  viewableWithLink?: boolean;
}

/**
 * @category Interfaces
 */
export interface iBalanceDoc extends iUserBalanceStore, Doc {
  /** The collection ID */
  collectionId: string | number;

  /** The Cosmos address of the user */
  cosmosAddress: CosmosAddress;

  /** True if the balances are on-chain */
  onChain: boolean;

  /** The URI of the off-chain balances */
  uri?: string;

  /** The timestamp of when the off-chain balances were fetched (milliseconds since epoch). For BitBadges indexer, we only populate this for Mint and Total docs. */
  fetchedAt?: UNIXMilliTimestamp;

  /** The block number of when the off-chain balances were fetched. For BitBadges indexer, we only populate this for Mint and Total docs. */
  fetchedAtBlock?: string | number;

  /** True if the off-chain balances are using permanent storage */
  isPermanent?: boolean;

  /** The content hash of the off-chain balances */
  contentHash?: string;

  /** The update history of this balance */
  updateHistory: iUpdateHistory[];
}

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
 * @category Interfaces
 */
export interface iClaimBuilderDoc extends Doc {
  /** The CID of the password document */
  cid: string;
  /** The cosmos address of the user who created this password */
  createdBy: CosmosAddress;
  /** True if the password document is claimed by the collection */
  docClaimed: boolean;
  /** The collection ID of the password document */
  collectionId: string | number;

  /** Dynamic checks to run in the form of plugins */
  plugins: any[];

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
    balancesToSet?: iIncrementedBalances;
    listId?: string;
  };
}

/**
 * @category Interfaces
 */
export interface iApprovalTrackerDoc extends iAmountTrackerIdDetails, Doc {
  /** The number of transfers. Is an incrementing tally. */
  numTransfers: string | number;
  /** A tally of the amounts transferred for this approval. */
  amounts: iBalance[];
}

/**
 * @category Interfaces
 */
export interface iChallengeTrackerIdDetails {
  /** The collection ID */
  collectionId: string | number;
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
export interface iMerkleChallengeDoc extends Doc {
  /** The collection ID */
  collectionId: string | number;
  /** The challenge ID */
  challengeTrackerId: string;
  /** The approval ID */
  approvalId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if approvalLevel = "collection") */
  approverAddress: CosmosAddress;
  /** The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree */
  usedLeafIndices: (string | number)[];
}

/**
 * @category Interfaces
 */
export interface iMerklechallengeTrackerIdDetails {
  /** The collection ID */
  collectionId: string | number;
  /** The challenge ID */
  challengeTrackerId: string;
  /** The challenge level (i.e. "collection", "incoming", "outgoing") */
  approvalLevel: 'collection' | 'incoming' | 'outgoing' | '';
  /** The approver address (leave blank if approvalLevel = "collection") */
  approverAddress: CosmosAddress;
  /** The used leaf indices for each challenge. A leaf index is the leaf location in the bottommost layer of the Merkle tree */
  usedLeafIndices: (string | number)[];
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
  collectionId: string | number;
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
export interface iComplianceDoc extends Doc {
  badges: {
    nsfw: iBatchBadgeDetails[];
    reported: iBatchBadgeDetails[];
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
export interface iBlockinAuthSignatureDoc extends Doc {
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
  params: ChallengeParams;

  /** If required, you can additionally attach proof of secrets ot the auth flow. These can be used to prove sensitive information to verifiers. */
  secretsProofs: iSecretsProof[];

  /** The timestamp of when the signature was created (milliseconds since epoch) */
  createdAt: UNIXMilliTimestamp;
  /** If deleted, we still store temporarily for a period of time. We use a deletedAt timestamp to determine when to delete. */
  deletedAt?: UNIXMilliTimestamp;
}

/**
 * @category Interfaces
 */
export interface iSecretDoc extends Doc, iSecret {
  updateHistory: iUpdateHistory[];
}

/**
 * @category Interfaces
 */
export interface iFollowDetailsDoc extends Doc {
  /** The Cosmos address of the user */
  cosmosAddress: CosmosAddress;
  /** The number of users that the user is following */
  followingCount: string | number;
  /** The number of users that are following the user */
  followersCount: string | number;
  /** The followers of the user */
  followers: CosmosAddress[];
  /** The following of the user */
  following: CosmosAddress[];
  /** The collection ID of the following collection */
  followingCollectionId: string | number;
}

/**
 * @category Interfaces
 */
export interface iMapDoc extends Doc, iMapWithValues {}

/**
 * @category Interfaces
 */
export interface iBadgeMetadataDetails {
  /** The metadata ID for the fetched URI. Metadata IDs map an ID to each unique URI. See BitBadges Docs for more information. */
  metadataId?: string | number;
  /** The badge IDs that correspond to the metadata */
  badgeIds: iUintRange[];
  /** The metadata fetched by the URI */
  metadata?: iMetadata;
  /** The URI that the metadata was fetched from */
  uri?: string;
  /** Custom data */
  customData?: string;
  /** Flag to denote if the metadata is new and should be updated. Used internally. */
  toUpdate?: boolean;
}

/**
 * @category Interfaces
 */
export interface iMetadata {
  /** The name of the badge or badge collection. */
  name: string;
  /** The description of the badge or badge collection. Supports markdown. */
  description: string;
  /** The image of the badge or badge collection. */
  image: string;
  /** The video of the badge or badge collection. If a standard video is used, this should be a link to the video. We will use image as the poster image. If a youtube video is used, we embed it as an iframe. */
  video?: string;
  /** The category of the badge or badge collection (e.g. "Education", "Attendance"). */
  category?: string;
  /** The external URL of the badge or badge collection. */
  externalUrl?: string;
  /** The tags of the badge or badge collection */
  tags?: string[];

  /** The socials of the badge or badge collection */
  socials?: {
    [key: string]: string;
  };

  /** The off-chain transferability info of the badge or badge collection */
  offChainTransferabilityInfo?: {
    host: string;
    assignMethod: string;
  };

  /** The attributes of the badge or badge collection */
  attributes?: {
    type?: 'date' | 'url';
    name: string;
    value: string | number | boolean;
  }[];

  /** The block the metadata was fetched at. */
  fetchedAtBlock?: string | number;
  /** The time the metadata was fetched. */
  fetchedAt?: UNIXMilliTimestamp;
  /** Whether the metadata is currently being updated. */
  _isUpdating?: boolean;
}

/**
 * @inheritDoc iAddressListDoc
 * @category Interfaces
 */
export interface iBitBadgesAddressList extends iAddressListDoc {
  /** The metadata of the address list. */
  metadata?: iMetadata;
  /** The activity of the address list. */
  listsActivity: iListActivityDoc[];
  /** The views of the address list. */
  views: {
    [viewId: string]: {
      ids: string[];
      type: string;
      pagination: PaginationInfo;
    };
  };
  /** The claims of the address list. */
  claims: {
    claimId: string;
    /** Plugins are the criteria for the claim. */
    plugins: any[];
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface GetAddressListsRouteRequestBody {
  /**
   * The lists and accompanyin details to fetch. Supports on-chain, off-chain, and reserved lists.
   */
  listsToFetch: {
    listId: string;
    viewsToFetch?: {
      viewId: string;
      viewType: 'listActivity';
      bookmark: string;
    }[];
    /** Certain views and details are private. If you are the creator of the list, you can fetch these details. By default, we do not fetch them. */
    fetchPrivateParams?: boolean;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListsRouteSuccessResponse {
  addressLists: iBitBadgesAddressList[];
}

/**
 * @category API Requests / Responses
 */
export interface UpdateAddressListsRouteRequestBody {
  addressLists: (iAddressList & {
    /** Private lists will not show up in any search results. */
    private?: boolean;
    /**
     * If the list is viewable with a link, anyone with the lisst ID can view details. Only applicable if private = true as well.
     * If not viewable with a link, only the creator can view the list.
     */
    viewableWithLink?: boolean;

    /** The claims of the address list. Use resetState on updates for resetting individual plugin state (if applicable). */
    claims: {
      claimId: string;
      plugins: any[];
    }[];
  })[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAddressListsRouteSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export interface CreateAddressListsRouteRequestBody extends UpdateAddressListsRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iCreateAddressListsRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface DeleteAddressListsRouteRequestBody {
  /**
   * The list IDs to delete.
   */
  listIds: string[];
}
/**
 * @category API Requests / Responses
 */
export interface iDeleteAddressListsRouteSuccessResponse {}
/**
 * @category Interfaces
 */
export interface iBitBadgesUserInfo extends Doc {
  /** The public key of the account */
  publicKey: string;
  /** The account number of the account */
  accountNumber: string | number;
  /** The public key type of the account */
  pubKeyType: string;
  /** The Cosmos address of the account */
  cosmosAddress: CosmosAddress;
  /** The Eth address of the account */
  ethAddress: string;
  /** The Bitcoin address of the account */
  btcAddress: string;
  /** The sequence of the account */
  sequence?: string | number;
  /** The balance of the account */
  balance?: iCosmosCoin;
  /** Whether we have already fetched the profile or not */
  fetchedProfile?: boolean;

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

  /** The custom links of the account */
  customLinks?: iCustomLink[];

  /** The hidden badges of the account */
  hiddenBadges?: iBatchBadgeDetails[];
  /** The hidden lists of the account */
  hiddenLists?: string[];

  /** The custom pages of the account */
  customPages?: {
    badges: iCustomPage[];
    lists: iCustomListPage[];
  };

  /** The watched lists of the account's portfolio */
  watchlists?: {
    badges: iCustomPage[];
    lists: iCustomListPage[];
  };

  /** The profile picture URL of the account */
  profilePicUrl?: string;
  /** The username of the account */
  username?: string;

  /** The latest chain the user signed in with */
  latestSignedInChain?: SupportedChain;

  /** The notifications of the account */
  notifications?: iNotificationPreferences;

  /** Social connections stored for the account */
  socialConnections?: iSocialConnections;

  /** Approved ways to sign in (rather than Blockin) */
  approvedSignInMethods?: {
    discord?: {
      username: string;
      discriminator?: string;
      id: string;
    };
  };
  /** The resolved name of the account (e.g. ENS name). */
  resolvedName?: string;
  /** The avatar of the account. */
  avatar?: string;
  /** The Solana address of the account. */
  solAddress: string;
  /** The chain of the account. */
  chain: SupportedChain;
  /** Indicates whether the account has claimed their airdrop. */
  airdropped?: boolean;
  /** A list of badges that the account has collected. Paginated and fetched as needed. To be used in conjunction with views. */
  collected: iBalanceDoc[];
  /** A list of transfer activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  activity: iTransferActivityDoc[];
  /** A list of list activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  listsActivity: iListActivityDoc[];
  /** A list of review activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  reviews: iReviewDoc[];
  /** A list of merkle challenge activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  merkleChallenges: iMerkleChallengeDoc[];
  /** A list of approvals tracker activity items for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  approvalTrackers: iApprovalTrackerDoc[];
  /** A list of address lists for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  addressLists: iBitBadgesAddressList[];
  /** A list of claim alerts for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  claimAlerts: iClaimAlertDoc[];
  /** A list of auth codes for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  authCodes: iBlockinAuthSignatureDoc[];
  /** A list of user secrets for the account. Paginated and fetched as needed. To be used in conjunction with views. */
  secrets: iSecretDoc[];

  /** The reserved map for the account. This is created and managed on-chain through the x/maps module. */
  reservedMap?: iMapDoc;

  /** The native address of the account */
  address: NativeAddress;

  /** Indicates whether the account is NSFW. */
  nsfw?: { [badgeId: string]: string };
  /** Indicates whether the account has been reported. */
  reported?: { [badgeId: string]: string };

  /** The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more. To be used in conjunction with activity, announcements, reviews, owners, merkleChallenges, and approvalTrackers. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs. */
  views: {
    [viewId: string]:
      | {
          ids: string[];
          type: string;
          pagination: PaginationInfo;
        }
      | undefined;
  };

  /** The alias for the account. */
  alias?: {
    collectionId?: string | number;
    listId?: string;
  };
}

/**
 * The supported view keys for fetching account details.
 *
 * @category API Requests / Responses
 */
export type AccountViewKey =
  | 'createdLists'
  | 'privateLists'
  | 'authCodes'
  | 'transferActivity'
  | 'reviews'
  | 'badgesCollected'
  | 'claimAlerts'
  | 'sentClaimAlerts'
  | 'allLists'
  | 'whitelists'
  | 'blacklists'
  | 'createdBadges'
  | 'managingBadges'
  | 'listsActivity'
  | 'createdSecrets'
  | 'receivedSecrets';

/**
 * This defines the options for fetching additional account details.
 *
 * A view is a way of fetching additional details about an account, and these will be queryable in the response via the `views` property.
 *
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 *
 * We support the following views:
 * - `transferActivity` - Fetches the latest activity for the account.
 * - `latestAnnouncements` - Fetches the latest announcements for the account.
 * - `reviews` - Fetches the latest reviews for the account.
 * - `badgesCollected` - Fetches the badges collected by the account sequentially in random order.
 *
 * @typedef {Object} AccountFetchDetails
 *
 * @property {string} [address] - If present, the account corresponding to the specified address will be fetched. Please only specify one of `address` or `username`.
 * @property {string} [username] - If present, the account corresponding to the specified username will be fetched. Please only specify one of `address` or `username`.
 * @property {boolean} [fetchSequence] - If true, the sequence will be fetched from the blockchain.
 * @property {boolean} [fetchBalance] - If true, the $BADGE balance will be fetched from the blockchain.
 * @property {boolean} [noExternalCalls] - If true, only fetches local information stored in DB. Nothing external like resolved names, avatars, etc.
 * @property {Array<{ viewType: string, bookmark: string }>} [viewsToFetch] - An array of views to fetch with associated bookmarks.
 *
 * @category API Requests / Responses
 */
export type AccountFetchDetails = {
  /** The address of the user. This can be their native address. Only one of address or username should be specified. */
  address?: string;
  /** The username of the user. Only one of address or username should be specified. */
  username?: string;
  /** If true, we will fetch the sequence from the blockchain. */
  fetchSequence?: boolean;
  /** If true, we will fetch the $BADGE balance from the blockchain. */
  fetchBalance?: boolean;
  /** If true, we will avoid external API calls. */
  noExternalCalls?: boolean;
  /** An array of views to fetch */
  viewsToFetch?: {
    /** Unique view ID. Used for pagination. All fetches w/ same ID should be made with same criteria. */
    viewId: string;
    /** The base view type to fetch. */
    viewType: AccountViewKey;
    /** If defined, we will filter the view to only include the specified collections. */
    specificCollections?: iBatchBadgeDetails[];
    /** If defined, we will filter the view to only include the specified lists. */
    specificLists?: string[];
    /** Oldest first. By default, we fetch newest */
    oldestFirst?: boolean;
    /** A bookmark to pass in for pagination. "" for first request. */
    bookmark: string;
  }[];
};

/**
 * @category API Requests / Responses
 */
export interface GetAccountsRouteRequestBody {
  accountsToFetch: AccountFetchDetails[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetAccountsRouteSuccessResponse {
  accounts: iBitBadgesUserInfo[];
}

/**
 * @category API Requests / Responses
 */
export interface GetFollowDetailsRouteRequestBody {
  cosmosAddress: string;

  followingBookmark?: string;
  followersBookmark?: string;

  protocol?: string;
  activityBookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetFollowDetailsRouteSuccessResponse extends iFollowDetailsDoc {
  followersPagination: PaginationInfo;
  followingPagination: PaginationInfo;

  activity: iTransferActivityDoc[];
  activityPagination: PaginationInfo;
}
/**
 * @category API Requests / Responses
 */
export interface FilterBadgesInCollectionRequestBody {
  /** The collection ID to filter */
  collectionId: string | number;
  /** Limit to specific badge IDs. Leave undefined to not filter by badge ID. */
  badgeIds?: iUintRange[];
  /** Limit to specific lists. Leave undefined to not filter by list. */
  categories?: string[];
  /** Limit to specific lists. Leave undefined to not filter by list. */
  tags?: string[];

  /** mostViewed is a special view that sorts by most viewed badges. May be incompatible with other filters. */
  mostViewed?: 'daily' | 'allTime' | 'weekly' | 'monthly' | 'yearly';
  /** Pagination bookmark. Leave undefined or "" for first request. */
  bookmark?: string;

  /** Attribute queries */
  attributes?: {
    name: string;
    value: string | number | boolean;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iFilterBadgesInCollectionSuccessResponse {
  badgeIds: iUintRange[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export interface GetOwnersForBadgeRouteRequestBody {
  /**
   * The pagination bookmark for where to start the request. Bookmarks are obtained via the previous response. "" for first request.
   */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetOwnersForBadgeRouteSuccessResponse {
  /**
   * Represents a list of owners balance details.
   */
  owners: iBalanceDoc[];
  /**
   * Represents pagination information.
   */
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export interface GetBadgeBalanceByAddressRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetBadgeBalanceByAddressRouteSuccessResponse extends iBalanceDoc {}

/**
 * @category API Requests / Responses
 */
export interface GetBadgeActivityRouteRequestBody {
  /**
   * An optional bookmark for pagination. Bookmarks are obtained via the previous response. "" for first request.
   */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetBadgeActivityRouteSuccessResponse {
  /**
   * Array of transfer activity information.
   */
  activity: iTransferActivityDoc[];
  /**
   * Pagination information.
   */
  pagination: PaginationInfo;
}

/**
 * Defines the options for fetching metadata.
 *
 * @typedef {Object} MetadataFetchOptions
 * @property {boolean} [doNotFetchCollectionMetadata] - If true, collection metadata will not be fetched.
 * @property {NumberType[] | UintRange[]} [metadataIds] - If present, the metadata corresponding to the specified metadata IDs will be fetched. See documentation for how to determine metadata IDs.
 * @property {string[]} [uris] - If present, the metadata corresponding to the specified URIs will be fetched.
 * @property {NumberType[] | UintRange[]} [badgeIds] - If present, the metadata corresponding to the specified badge IDs will be fetched.
 *
 * @category API Requests / Responses
 */
export interface MetadataFetchOptions {
  /**
   * If true, collection metadata will not be fetched.
   */
  doNotFetchCollectionMetadata?: boolean;
  /**
   * If present, the metadata corresponding to the specified metadata IDs will be fetched.
   * Metadata IDs are helpful when determining UNQIUE URIs to be fetched.
   *
   * If badges 1-10000 all share the same URI, they will have the same single metadata ID.
   * If badge 1 has a different URI than badges 2-10000, badge 1 will have a different metadata ID than the rest/
   *
   * We scan in increasing order of badge IDs, so metadata ID 1 will be for badge 1-X, metadata ID 2 will be for badge X+1-Y, etc.
   *
   * ID 0 = Collection metadata fetch
   * ID 1 = First badge metadata fetch
   * ID 2 = Second badge metadata fetch (if present)
   * And so on
   * Learn more in documentation.
   */
  metadataIds?: string | number[] | iUintRange[];
  /**
   * If present, the metadata corresponding to the specified URIs will be fetched.
   */
  uris?: string[];
  /**
   * If present, the metadata corresponding to the specified badge IDs will be fetched.
   */
  badgeIds?: string | number[] | iUintRange[];
}

/**
 * Supported view keys for fetching additional collection details.
 *
 * @category API Requests / Responses
 */
export type CollectionViewKey = 'transferActivity' | 'reviews' | 'owners' | 'amountTrackers' | 'challengeTrackers';

/**
 * Defines the options for fetching additional collection details.
 *
 * A view is a way of fetching additional details about a collection, and these will be queryable in the response via the `views` property.
 * Each view has a bookmark that is used for pagination and must be supplied to get the next page.
 * If the bookmark is not supplied, the first page will be returned.
 *
 * We support the following views:
 * - `transferActivity` - Fetches the latest activity for the collection.
 * - `latestAnnouncements` - Fetches the latest announcements for the collection.
 * - `reviews` - Fetches the latest reviews for the collection.
 * - `owners` - Fetches the owners of the collection sequentially in random order.
 * - `merkleChallenges` - Fetches the merkle challenges for the collection in random order.
 * - `approvalTrackers` - Fetches the approvals trackers for the collection in random order.
 *
 * @typedef {Object} GetAdditionalCollectionDetailsRequestBody
 * @property {{ viewType: string, bookmark: string }[]} [viewsToFetch] - If present, the specified views will be fetched.
 * @property {boolean} [fetchTotalAndMintBalances] - If true, the total and mint balances will be fetched.
 * @property {string[]} [challengeTrackersToFetch] - If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
 * @property {AmountTrackerIdDetails[]} [approvalTrackersToFetch] - If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
 * @category API Requests / Responses
 */
export interface GetAdditionalCollectionDetailsRequestBody {
  /**
   * If present, the specified views will be fetched.
   */
  viewsToFetch?: {
    /** The base view type to fetch. */
    viewType: CollectionViewKey;
    /** A unique view ID. This is used for pagination. All fetches w/ same ID should be made with same criteria. */
    viewId: string;
    /** A bookmark to pass in for pagination. "" for first request. */
    bookmark: string;
    /** If defined, we will return the oldest items first. */
    oldestFirst?: boolean;
  }[];

  /**
   * If true, the total and mint balances will be fetched and will be put in owners[].
   *
   * collection.owners.find(x => x.cosmosAddresss === 'Mint')
   */
  fetchTotalAndMintBalances?: boolean;
  /**
   * If present, the merkle challenges corresponding to the specified merkle challenge IDs will be fetched.
   */
  challengeTrackersToFetch?: iChallengeTrackerIdDetails[];
  /**
   * If present, the approvals trackers corresponding to the specified approvals tracker IDs will be fetched.
   */
  approvalTrackersToFetch?: iAmountTrackerIdDetails[];
  /**
   * If true, we will append defaults with empty values.
   */
  handleAllAndAppendDefaults?: boolean;
  /**
   * Fetches private parameters for any claims in addition to public parameters.
   */
  fetchPrivateParams?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface GetMetadataForCollectionRequestBody {
  /**
   * If present, we will fetch the metadata corresponding to the specified options.
   *
   * Consider using pruneMetadataToFetch for filtering out previously fetched metadata.
   */
  metadataToFetch?: MetadataFetchOptions;
}

/**
 * @category API Requests / Responses
 */
export interface GetCollectionsRouteRequestBody {
  collectionsToFetch: ({
    /**
     * The ID of the collection to fetch.
     */
    collectionId: string | number;
  } & GetMetadataForCollectionRequestBody &
    GetAdditionalCollectionDetailsRequestBody)[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionsRouteSuccessResponse {
  collections: iBitBadgesCollection[];
}

/**
 * @category API Requests / Responses
 */
export interface GetCollectionByIdRouteRequestBody extends GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionByIdRouteSuccessResponse {
  collection: iBitBadgesCollection;
}

/**
 * @category API Requests / Responses
 */
export interface RefreshMetadataRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iRefreshMetadataRouteSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export interface RefreshStatusRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iRefreshStatusRouteSuccessResponse {
  /**
   * Boolean indicating if the collection is currently in the queue.
   */
  inQueue: boolean;
  /**
   * Array of error documents corresponding to the collection.
   */
  errorDocs: iQueueDoc[];
  /**
   * The status information corresponding to the collection.
   */
  refreshDoc: iRefreshDoc;
}

/**
 * @category API Requests / Responses
 */
export interface GetStatusRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetStatusRouteSuccessResponse {
  /**
   * Status details about the indexer / blockchain.
   */
  status: iStatusDoc;
}

/**
 * @category API Requests / Responses
 */
export interface GetSearchRouteRequestBody {
  /** If true, we will skip all collection queries. */
  noCollections?: boolean;
  /** If true, we will skip all account queries. */
  noAccounts?: boolean;
  /** If true, we will skip all address list queries. */
  noAddressLists?: boolean;
  /** If true, we will skip all badge queries. */
  noBadges?: boolean;
  /** If true, we will limit collection results to a single collection. */
  specificCollectionId?: string | number;
}

/**
 *
 * @category API Requests / Responses
 */
export interface iGetSearchRouteSuccessResponse {
  collections: iBitBadgesCollection[];
  accounts: iBitBadgesUserInfo[];
  addressLists: iBitBadgesAddressList[];
  badges: {
    collection: iBitBadgesCollection;
    badgeIds: iUintRange[];
  }[];
}
/**
 * @category API Requests / Responses
 */
export interface GetClaimsRouteRequestBody {
  /** The claim IDs to fetch. */
  claimIds: string[];
  /** If the address list is private and viewable with the link only, you must also specify the address list ID to prove knowledge of the link. */
  listId?: string;
}

/**
 * @category Interfaces
 */
export interface iClaimDetails {
  /** Unique claim ID. */
  claimId: string;
  /** The balances to set for the claim. Only used for claims for collections that have off-chain indexed balances and are assigning balances based on the claim. */
  balancesToSet?: iIncrementedBalances;
  /** Claim plugins. These are the criteria that must pass for a user to claim the badge. */
  plugins: any[];
  /** If manual distribution is enabled, we do not handle any distribution of claim codes. We leave that up to the claim creator. */
  manualDistribution?: boolean;
}

/**
 *
 * @category API Requests / Responses
 */
export interface iGetClaimsRouteSuccessResponse {
  claims: iClaimDetails[];
}

/**
 * @category API Requests / Responses
 */
export interface CheckAndCompleteClaimRouteRequestBody {
  /** The claim body for each unique plugin. */
  [pluginId: string]: any;
  /** If true, we will only return the user's previous claim codes. */
  prevCodesOnly?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iCheckAndCompleteClaimRouteSuccessResponse {
  /** The new claim code for the user if the claim was successful. */
  code?: string;
  /** The previous claim codes for the user. */
  prevCodes?: string[];
}

/**
 * @category API Requests / Responses
 */
export interface DeleteReviewRouteRequestBody {
  /**
   * The review ID to delete.
   */
  reviewId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteReviewRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface AddReviewForCollectionRouteRequestBody {
  /**
   * The review text (1 to 2048 characters).
   */
  review: string;

  /**
   * The star rating (1 to 5).
   */
  stars: string | number;

  /**
   * The address you are reviewing.
   */
  cosmosAddress: CosmosAddress;

  /**
   * The collection ID that you are reviewing
   */
  collectionId: string | number;
}

/**
 * @category API Requests / Responses
 */
export interface iAddReviewForCollectionRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface AddReviewForUserRouteRequestBody {
  /**
   * The review text (1 to 2048 characters).
   */
  review: string;

  /**
   * The number of stars (1 to 5) for the review.
   */
  stars: string | number;
}

/**
 * @category API Requests / Responses
 */
export interface iAddReviewForUserRouteSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export interface UpdateAccountInfoRouteRequestBody {
  /**
   * The Discord username.
   */
  discord?: string;

  /**
   * The Twitter username.
   */
  twitter?: string;

  /**
   * The GitHub username.
   */
  github?: string;

  /**
   * The Telegram username.
   */
  telegram?: string;

  /**
   * The last seen activity timestamp.
   */
  seenActivity?: UNIXMilliTimestamp;

  /**
   * The README details (markdown supported).
   */
  readme?: string;

  /**
   * The badges to hide and not view for this profile's portfolio
   */
  hiddenBadges?: iBatchBadgeDetails[];

  /**
   * The lists to hide and not view for this profile's portfolio
   */
  hiddenLists?: string[];

  /**
   * An array of custom pages on the user's portolio. Used to customize, sort, and group badges / lists into pages.
   */
  customPages?: {
    badges: iCustomPage[];
    lists: iCustomListPage[];
  };

  /**
   * The watchlist of badges / lists
   */
  watchlists?: {
    badges: iCustomPage[];
    lists: iCustomListPage[];
  };

  /**
   * The profile picture URL.
   */
  profilePicUrl?: string;

  /**
   * The username.
   */
  username?: string;

  /**
   * The profile picture image file to set. We will then upload to our CDN.
   */
  profilePicImageFile?: any;

  /**
   * The notification preferences for the user. Will only be returned if user is authenticated with full access.
   */
  notifications?: {
    email?: string;
    discord?: { id: string; username: string; discriminator: string | undefined } | undefined;
    antiPhishingCode?: string;
    preferences?: {};
  };

  /**
   * Approved sign in methods. Only returned if user is authenticated with full access.
   */
  approvedSignInMethods?: {
    discord?: {
      username: string;
      discriminator?: string;
      id: string;
    };
  };

  /**
   * The social connections for the user. Only returned if user is authenticated with full access.
   */
  socialConntections?: iSocialConnections;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAccountInfoRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface AddBalancesToOffChainStorageRouteRequestBody {
  /**
   * A map of Cosmos addresses or list IDs -> Balance[].
   */
  balances?: iOffChainBalancesMap;

  /**
   * The claim details
   */
  claims?: {
    claimId: string;
    plugins: any[];
    balancesToSet?: iIncrementedBalances;
  }[];

  /**
   * The method for storing balances (ipfs or centralized).
   */
  method: 'ipfs' | 'centralized';

  /**
   * The collection ID.
   */
  collectionId: string | number;
}

/**
 * @category API Requests / Responses
 */
export interface iAddBalancesToOffChainStorageRouteSuccessResponse {
  /**
   * The URI of the stored data.
   */
  uri?: string;

  /**
   * The result object with CID.
   */
  result: {
    cid?: string;
  };
}

/**
 * @category API Requests / Responses
 */
export interface AddMetadataToIpfsRouteRequestBody {
  /**
   * The collection metadata to add to IPFS
   */
  collectionMetadata?: iMetadata;
  /**
   * The badge metadata to add to IPFS
   */
  badgeMetadata?: iBadgeMetadataDetails[] | iMetadata[];
}

/**
 * @category API Requests / Responses
 */
export interface iAddMetadataToIpfsRouteSuccessResponse {
  /**
   * The result for collection metadata.
   */
  collectionMetadataResult?: {
    cid: string;
  };

  /**
   * An array of badge metadata results, if applicable.
   */
  badgeMetadataResults: {
    cid: string;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface AddApprovalDetailsToOffChainStorageRouteRequestBody {
  /**
   * The name of the approval.
   */
  name: string;

  /**
   * The description of the approval.
   */
  description: string;

  /**
   * The challenge details.
   */
  challengeDetails?: iChallengeDetails;

  claims?: {
    /**
     * The plugins for the approval.
     */
    plugins: any[];
    claimId: string;
    manualDistribution?: boolean;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iAddApprovalDetailsToOffChainStorageRouteSuccessResponse {
  /**
   * The result with CID for IPFS.
   */
  result: {
    cid: string;
  };

  /**
   * The result for the approval challenge details.
   */
  challengeResult?: {
    cid: string;
  };
}

/**
 * @category API Requests / Responses
 */
export interface GetSignInChallengeRouteRequestBody {
  /**
   * The blockchain to be signed in with.
   */
  chain: SupportedChain;

  /**
   * The user's blockchain address. This can be their native address.
   */
  address: NativeAddress;

  /**
   * The number of hours to be signed in for.
   */
  hours?: string | number;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSignInChallengeRouteSuccessResponse {
  /**
   * The nonce for the challenge.
   */
  nonce: string;

  /**
   * The challenge parameters.
   */
  params: ChallengeParams;

  /**
   * The Blockin challenge message to sign.
   */
  message: BlockinMessage;
}

/**
 * @category API Requests / Responses
 */
export interface VerifySignInRouteRequestBody {
  /**
   * The original Blockin message that was signed.
   */
  message: BlockinMessage;

  /**
   * The signature of the Blockin message
   */
  signature: string;

  /**
   * Required for some chains (Cosmos) to verify signature. The public key of the signer.
   */
  publicKey?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iVerifySignInRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface CheckSignInStatusRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iCheckSignInStatusRequestSuccessResponse {
  /**
   * Indicates whether the user is signed in.
   */
  signedIn: boolean;

  /**
   * The Blockin message that was signed.
   */
  message: BlockinMessage;

  /**
   * Signed in with Discord username and discriminator?
   */
  discord?: {
    username: string;
    discriminator: string;
    id: string;
  };

  /**
   * Signed in with Twitter username?
   */
  twitter?: {
    id: string;
    username: string;
  };

  /**
   * Signed in with GitHub username?
   */
  github?: {
    id: string;
    username: string;
  };

  /**
   * Signed in with Google username?
   */
  google?: {
    id: string;
    username: string;
  };
}

/**
 * @category API Requests / Responses
 */
export interface SignOutRequestBody {
  /** Sign out of Blockin, and thus the entire API. */
  signOutBlockin: boolean;
  /** Sign out of Discord. */
  signOutDiscord?: boolean;
  /** Sign out of Twitter. */
  signOutTwitter?: boolean;
  /** Sign out of Google. */
  signOutGoogle?: boolean;
  /** Sign out of GitHub. */
  signOutGithub?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iSignOutSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export interface GetBrowseCollectionsRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetBrowseCollectionsRouteSuccessResponse {
  collections: { [category: string]: iBitBadgesCollection[] };
  addressLists: { [category: string]: iBitBadgesAddressList[] };
  profiles: { [category: string]: iBitBadgesUserInfo[] };
  activity: iTransferActivityDoc[];
  badges: {
    [category: string]: {
      collection: iBitBadgesCollection;
      badgeIds: iUintRange[];
    }[];
  };
}

/**
 * @category API Requests / Responses
 */
export type BroadcastTxRouteRequestBody = BroadcastPostBody;

/**
 * @category API Requests / Responses
 */
export interface iBroadcastTxRouteSuccessResponse {
  /**
   * The response from the blockchain for the broadcasted tx.
   */
  tx_response: {
    code: number;
    codespace: string;
    data: string;
    events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
    gas_wanted: string;
    gas_used: string;
    height: string;
    Doc: string;
    logs: {
      events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
    }[];
    raw_log: string;
    timestamp: string;
    tx: object | null;
    txhash: string;
  };
}

/**
 * @category API Requests / Responses
 */
export type SimulateTxRouteRequestBody = BroadcastPostBody;

/**
 * @category API Requests / Responses
 */
export interface iSimulateTxRouteSuccessResponse {
  /**
   * How much gas was used in the simulation.
   */
  gas_info: { gas_used: string; gas_wanted: string };
  /**
   * The result of the simulation.
   */
  result: {
    data: string;
    log: string;
    events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
  };
}

/**
 * @category API Requests / Responses
 */
export interface FetchMetadataDirectlyRouteRequestBody {
  uris: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iFetchMetadataDirectlyRouteSuccessResponse {
  metadata: iMetadata[];
}

/**
 * @category API Requests / Responses
 */
export interface GetTokensFromFaucetRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export type iGetTokensFromFaucetRouteSuccessResponse = DeliverTxResponse;

/**
 * @category API Requests / Responses
 */
export interface SendClaimAlertsRouteRequestBody {
  /** The claim alerts to send to users. */
  claimAlerts: {
    /** The collection ID to associate with the claim alert. If specified, you (the sender) must be the manager of the collection. This is typically used
     * for sending claim codes. Set to 0 for unspecified. */
    collectionId: string | number;
    /** The message to send to the user. */
    message?: string;
    /** The addresses to send the claim alert to. */
    cosmosAddresses: CosmosAddress[];
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iSendClaimAlertsRouteSuccessResponse {}

/**
 * Information returned by the REST API getAccount route.
 *
 * Note this should be converted into AccountDoc or BitBadgesUserInfo before being returned by the BitBadges API for consistency.
 *
 * @category API Requests / Responses
 */
export interface CosmosAccountResponse {
  account_number: number;
  sequence: number;
  pub_key: {
    key: string;
  };
  address: CosmosAddress;
}

/**
 * Generic route to verify any Blockin request. Does not sign you in with the API. Used for custom Blockin integrations.
 *
 * @category API Requests / Responses
 */
export interface GenericBlockinVerifyRouteRequestBody extends VerifySignInRouteRequestBody {
  /**
   * Additional options for verifying the challenge.
   */
  options?: VerifyChallengeOptions;
}

/**
 * @inheritDoc iVerifySignInRouteSuccessResponse
 * @category API Requests / Responses
 */
export interface iGenericBlockinVerifyRouteSuccessResponse extends iVerifySignInRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface CreateSecretRouteRequestBody {
  /**
   * Proof of issuance is used for BBS+ signatures (scheme = bbs) only.
   * BBS+ signatures are signed with a BBS+ key pair, but you would often want the issuer to be a native address.
   * The prooofOfIssuance establishes a link saying that "I am the issuer of this secret signed with BBS+ key pair ___".
   *
   * Fields can be left blank for standard signatures.
   */
  proofOfIssuance: {
    message: string;
    signature: string;
    signer: string;
    publicKey?: string;
  };

  /** The message format of the secretMessages. */
  messageFormat: 'plaintext' | 'json';
  /**
   * The scheme of the secret. BBS+ signatures are supported and can be used where selective disclosure is a requirement.
   * Otherwise, you can simply use your native blockchain's signature scheme.
   */
  scheme: 'bbs' | 'standard';
  /** The type of the secret (e.g. credential). */
  type: string;
  /**
   * Thesse are the secrets that are signed.
   * For BBS+ signatures, there can be >1 secretMessages, and the signer can selectively disclose the secrets.
   * For standard signatures, there is only 1 secretMessage.
   */
  secretMessages: string[];

  /**
   * This is the signature and accompanying details of the secretMessages. The siganture maintains the integrity of the secretMessages.
   *
   * This should match the expected scheme. For example, if the scheme is BBS+, the signature should be a BBS+ signature and signer should be a BBS+ public key.
   */
  dataIntegrityProof: {
    signature: string;
    signer: string;
    publicKey?: string;
  };

  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  name: string;
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  image: string;
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  description: string;
}

/**
 * @category API Requests / Responses
 */
export interface iCreateSecretRouteSuccessResponse {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;
}

/**
 * @category API Requests / Responses
 */
export interface GetSecretRouteRequestBody {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSecretRouteSuccessResponse extends iSecretDoc {}

/**
 * @category API Requests / Responses
 */
export interface DeleteSecretRouteRequestBody {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteSecretRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface UpdateSecretRouteRequestBody {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;

  /** Holders can be added or removed from the secret. They can use the secret to prove something about themselves to verifiers. */
  holdersToSet?: {
    cosmosAddress: CosmosAddress;
    delete?: boolean;
  }[];

  /** Blockchain anchors to add to the secret. These are on-chain transactions that can be used to prove stuff about the secret, like
   * existence at a certain point in time or to maintain data integrity. */
  anchorsToAdd?: {
    txHash?: string;
    message?: string;
  }[];

  /**
   * Proof of issuance is used for BBS+ signatures (scheme = bbs) only.
   * BBS+ signatures are signed with a BBS+ key pair, but you would often want the issuer to be a native address.
   * The prooofOfIssuance establishes a link saying that "I am the issuer of this secret signed with BBS+ key pair ___".
   *
   * Fields can be left blank for standard signatures.
   */
  proofOfIssuance?: {
    message: string;
    signer: string;
    signature: string;
    publicKey?: string;
  };

  /** The message format of the secretMessages. */
  messageFormat?: 'plaintext' | 'json';
  /**
   * The scheme of the secret. BBS+ signatures are supported and can be used where selective disclosure is a requirement.
   * Otherwise, you can simply use your native blockchain's signature scheme.
   */
  scheme?: 'bbs' | 'standard';
  /** The type of the secret (e.g. credential). */
  type?: string;
  /**
   * Thesse are the secrets that are signed.
   * For BBS+ signatures, there can be >1 secretMessages, and the signer can selectively disclose the secrets.
   * For standard signatures, there is only 1 secretMessage.
   */
  secretMessages?: string[];

  /**
   * This is the signature and accompanying details of the secretMessages. The siganture maintains the integrity of the secretMessages.
   *
   * This should match the expected scheme. For example, if the scheme is BBS+, the signature should be a BBS+ signature and signer should be a BBS+ public key.
   */
  dataIntegrityProof?: {
    signature: string;
    signer: string;
    publicKey?: string;
  };

  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  name?: string;
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  image?: string;
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  description?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateSecretRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface CreateBlockinAuthCodeRouteRequestBody {
  /** The name of the Blockin auth code for display purposes. */
  name: string;
  /** The description of the Blockin auth code for display purposes. */
  description: string;
  /** The image of the Blockin auth code for display purposes. */
  image: string;

  /** The original Blockin message that was signed. */
  message: BlockinMessage;
  /** The signature of the Blockin message */
  signature: string;
  /** The public key of the signer (if needed). Only certain chains require this. */
  publicKey?: string;

  /**
   * If required, you can additionally add proof of secrets to the authentication flow.
   * This proves sensitive information (e.g. GPAs, SAT scores, etc.) without revealing the information itself.
   */
  secretsProofs?: iSecretsProof[];
}

/**
 * @category API Requests / Responses
 */
export interface iCreateBlockinAuthCodeRouteSuccessResponse {
  /** Secret ID only to be given to queriers */
  id: string;
}

/**
 * @category API Requests / Responses
 */
export interface GetBlockinAuthCodeRouteRequestBody {
  /** The ID of the Blockin auth code. */
  id: string;
  /** We attempt to verify the current status with each request. You can provide additional options for verification here. */
  options?: VerifyChallengeOptions;
}

/**
 * @category API Requests / Responses
 */
export interface iGetBlockinAuthCodeRouteSuccessResponse {
  /**
   * The corresponding message that was signed to obtain the signature.
   */
  message: BlockinMessage;
  /**
   * The signature of the message.
   */
  signature: string;
  /**
   * The converted Blockin params fort the message
   */
  params: ChallengeParams;
  /**
   * The converted Cosmos address of params.address. This can be used as the
   * unique identifier for the user (e.g. avoid duplicate sign ins from equivalent 0x and cosmos1 addresses).
   */
  cosmosAddress: CosmosAddress;
  /**
   * Verification response
   */
  verificationResponse: {
    /**
     * Returns whether the current (message, signature) pair is valid and verified (i.e. signature is valid and any assets are owned).
     */
    success: boolean;
    /**
     * Returns the response message returned from Blockin verification.
     */
    errorMessage?: string;
  };

  /**
   * Derived data integrity proofs for any secrets requested.
   */
  secretsProofs: iSecretsProof[];
}

/**
 * @category API Requests / Responses
 */
export interface DeleteBlockinAuthCodeRouteRequestBody {
  id: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteBlockinAuthCodeRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface GenerateAppleWalletPassRouteRequestBody {
  /** The name to be displayed on the pass. */
  name: string;
  /** The description to be displayed on the pass. */
  description: string;
  /** The Blockin message of the authentication code to create the pass for. */
  message: BlockinMessage;
  /** The signature of the Blockin message. */
  signature: string;
}
/**
 * @category API Requests / Responses
 */
export interface iGenerateAppleWalletPassRouteSuccessResponse {
  type: string;
  data: string;
}
/**
 * @category API Requests / Responses
 */
export interface GetClaimAlertsForCollectionRouteRequestBody {
  /** The collection ID to get claim alerts for. */
  collectionId: string | number;
  /** The pagination bookmark obtained from the previous request. Leave blank for the first request. */
  bookmark: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimAlertsForCollectionRouteSuccessResponse {
  claimAlerts: iClaimAlertDoc[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export interface GetExternalCallRouteRequestBody {
  uri: string;
  key: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetExternalCallRouteSuccessResponse {
  key: string;
  timestamp: number;
}

/**
 * @category API Requests / Responses
 */
export interface GetMapsRouteRequestBody {
  /** The IDs of the maps to fetch. */
  mapIds: string[];
}

/**
 * @inheritDoc iMap
 * @category Interfaces
 */
export interface iMapWithValues extends iMap {
  /** The (key, value) pairs for the maps that are set. */
  values: { [key: string]: iValueStore };
  /** The fetched metadata for the map (if any). */
  metadata?: iMetadata;
  /** The update history for the map. Maps are maintained through blockchain transactions. */
  updateHistory: iUpdateHistory[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetMapsRouteSuccessResponse {
  maps: iMapWithValues[];
}

/**
 * @category Interfaces
 */
export interface iBitBadgesCollection extends iCollectionDoc {
  /** The collection approvals for this collection, with off-chain metadata populated. */
  collectionApprovals: iCollectionApproval[];
  /** The collection permissions for this collection, with off-chain metadata populated. */
  collectionPermissions: iCollectionPermissions;

  /** The fetched collection metadata for this collection. Will only be fetched if requested. It is your responsibility to join this data. */
  cachedCollectionMetadata?: iMetadata;
  /** The fetched badge metadata for this collection. Will only be fetched if requested. It is your responsibility to join this data. */
  cachedBadgeMetadata: iBadgeMetadataDetails[];
  /** The default balances for users upon genesis, with off-chain metadata populated. */
  defaultBalances: iUserBalanceStore;
  /** The fetched activity for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  activity: iTransferActivityDoc[];
  /** The fetched reviews for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  reviews: iReviewDoc[];
  /** The fetched owners of this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  owners: iBalanceDoc[];
  /** The fetched merkle challenges for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  merkleChallenges: iMerkleChallengeDoc[];
  /** The fetched approval trackers for this collection. Returned collections will only fetch the current page. Use the pagination to fetch more. To be used in conjunction with views. */
  approvalTrackers: iApprovalTrackerDoc[];

  /** The badge IDs in this collection that are marked as NSFW. */
  nsfw?: { badgeIds: iUintRange[]; reason: string };
  /** The badge IDs in this collection that have been reported. */
  reported?: { badgeIds: iUintRange[]; reason: string };
  /** The reserved map for the account. This is created and managed on-chain through the x/maps module. */
  reservedMap?: iMapDoc;

  /** The views for this collection and their pagination Doc. Views will only include the doc _ids. Use the pagination to fetch more. To be used in conjunction with activity, announcements, reviews, owners, merkleChallenges, and approvalTrackers. For example, if you want to fetch the activity for a view, you would use the view's pagination to fetch the doc _ids, then use the corresponding activity array to find the matching docs. */
  views: {
    [viewId: string]:
      | {
          ids: string[];
          type: string;
          pagination: PaginationInfo;
        }
      | undefined;
  };

  /** Details about any off-chain claims for this collection. Only applicable when outsourced to BitBadges. */
  claims: iClaimDetails[];
}

/**
  Used by the frontend for dynamically fetching data from the DB as needed

  @category Indexer
*/

/**
 * @category Interfaces
 */
export interface iOffChainBalancesMap {
  [cosmosAddressOrListId: string]: iBalance[];
}

/**
 * @category Interfaces
 */
export interface iTransferWithIncrements extends iTransfer {
  /** The number of addresses to send the badges to. This takes priority over toAddresses.length (used when you don't know exact addresses (i.e. you know number of codes)). */
  toAddressesLength?: string | number;

  /** The number to increment the badgeIDs by for each transfer. */
  incrementBadgeIdsBy?: string | number;

  /** The number to increment the ownershipTimes by for each transfer. */
  incrementOwnershipTimesBy?: string | number;
}

/**
 * @category Interfaces
 */
export interface iBatchBadgeDetails {
  /** The collection ID of this element's badge details. */
  collectionId: string | number;
  /** The corresponding badge IDs for this collection ID. */
  badgeIds: iUintRange[];
}

/**
 * @example Codes
 * 1. Generate N codes privately
 * 2. Hash each code
 * 3. Store the hashed codes publicly on IPFS via this struct
 * 4. When a user enters a code, we hash it and check if it matches any of the hashed codes. This way, the codes are never stored publicly on IPFS and only known by the generator of the codes.
 *
 * @example Whitelist
 * For storing a public whitelist of addresses (with useCreatorAddressAsLeaf = true), hashing complicates everything because the whitelist can be stored publicly.
 * 1. Generate N whitelist addresses
 * 2. Store the addresses publicly on IPFS via this struct
 * 3. When a user enters an address, we check if it matches any of the addresses.
 *
 * @category Interfaces
 */
export interface iChallengeDetails {
  /** The leaves of the Merkle tree. Leaves should be considered public. Use preimages for the secrets + isHashed. For whitelist trees, these can be the plaintext Cosmos addresses. */
  leaves: string[];
  /** True if the leaves are hashed. Hash(preimage[i]) = leaves[i] */
  isHashed: boolean;

  /** The preimages of the leaves (only used if isHashed = true). Oftentimes, this is used for secret codes so should not be present when user-facing. */
  preimages?: string[];
  /** Seed code for generating the leaves */
  seedCode?: string;
  /** The Merkle tree */
  tree?: MerkleTree;
  /** The Merkle tree options for how to build it */
  treeOptions?: MerkleTreeJsOptions;
  /** The number of leaves in the Merkle tree. This takes priority over leaves.length if defined (used for buffer time between leaf generation and leaf length select) */
  numLeaves?: string | number;
  /** The current code being used for the challenge. Used behind the scenes */
  currCode?: string | number;
}

/**
 * @category Interfaces
 */
export interface iChallengeInfoDetails {
  /** The challenge details of the claim / approval */
  challengeDetails: iChallengeDetails;

  claim?: iClaimDetails;
}

/**
 * @category Interfaces
 */
export interface iApprovalInfoDetails {
  /** The name of the claim */
  name: string;

  /** The description of the claim. This describes how to earn and claim the badge. */
  description: string;
}

/**
 * @category Interfaces
 */
export interface iCosmosCoin {
  /** The amount of the coin. */
  amount: string | number;
  /** The denomination of the coin (e.g. "badge"). */
  denom: string;
}

/**
 * @category Permissions
 */
export type PermissionNameString =
  | 'canDeleteCollection'
  | 'canArchiveCollection'
  | 'canUpdateOffChainBalancesMetadata'
  | 'canUpdateBadgeMetadata'
  | 'canUpdateCollectionMetadata'
  | 'canCreateMoreBadges'
  | 'canUpdateCollectionApprovals'
  | 'canUpdateAutoApproveSelfInitiatedIncomingTransfers'
  | 'canUpdateAutoApproveSelfInitiatedOutgoingTransfers'
  | 'canUpdateStandards'
  | 'canUpdateCustomData'
  | 'canUpdateManager';

/* eslint-disable camelcase */

/* eslint-disable camelcase */
export interface Validator {
  commission: {
    commission_rates: {
      max_change_rate: string;
      max_rate: string;
      rate: string;
    };
    update_time: string;
  };
  consensus_pubkey: {
    '@type': string;
    key: string;
  };
  delegator_shares: string;
  description: {
    details: string;
    identity: string;
    moniker: string;
    security_contact: string;
    website: string;
  };
  jailed: boolean;
  min_self_delegation: string;
  operator_address: string;
  status: string;
  tokens: string;
  unbonding_height: string;
  unbonding_time: string;
}

/* eslint-disable camelcase */
export interface GetValidatorsResponse {
  validators: Validator[];
  pagination: {
    next_key: string;
    total: number;
  };
}

/* eslint-disable camelcase */

/* eslint-disable camelcase */

/* eslint-disable camelcase */
export interface UndelegationResponse {
  delegator_address: string;
  validator_address: string;
  entries: [
    {
      creation_height: string;
      completion_time: string;
      initial_balance: string;
      balance: string;
    }
  ];
}

/* eslint-disable camelcase */
export interface GetUndelegationsResponse {
  unbonding_responses: UndelegationResponse[];
  pagination: {
    next_key: string;
    total: string;
  };
}

/* eslint-disable camelcase */
export interface CounterParty {
  port_id: string;
  channel_id: string;
}

/* eslint-disable camelcase */
export interface Channel {
  state: string;
  ordering: string;
  counterparty: CounterParty;
  connection_hops: string[];
  version: string;
  port_id: string;
  channel_id: string;
}

/* eslint-disable camelcase */
export interface ChannelsResponse {
  channels: Channel[];
  pagination: {
    next_key?: string;
    total: string;
  };
  height: {
    revision_number: string;
    revision_height: string;
  };
}

/* eslint-disable camelcase */

/* eslint-disable camelcase */

export interface TallyResponse {
  tally: {
    yes: string;
    abstain: string;
    no: string;
    no_with_veto: string;
  };
}

/* eslint-disable camelcase */
export interface AccountResponse {
  account: {
    '@type': string;
    base_account: {
      address: string;
      pub_key?: {
        '@type': string;
        key: string;
      };
      account_number: string;
      sequence: string;
    };
  };
}

export enum BroadcastMode {
  Unspecified = 'BROADCAST_MODE_UNSPECIFIED',
  // Block = 'BROADCAST_MODE_BLOCK', // No longer supported
  Sync = 'BROADCAST_MODE_SYNC',
  Async = 'BROADCAST_MODE_ASYNC'
}

/* eslint-disable camelcase */
export interface BroadcastPostBody {
  tx_bytes: Uint8Array;
  mode: string;
}

/* eslint-disable camelcase */

type AnyJSON = any;

interface ProtobufObject {
  typeUrl: string;
  value: AnyJSON;
}

/**
 * TxContext is the transaction context for a SignDoc that is independent
 * from the transaction payload.
 *
 * @category Transactions
 */
export interface TxContext {
  chain: Chain;
  sender: Sender;
  fee: Fee;
  memo: string;
}

/**
 * EI712ToSign represents a signable EIP-712 payload that can be signed using MetaMask or Keplr.
 *
 * @category Transactions
 */
export interface EIP712ToSign {
  types: object;
  primaryType: string;
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
    salt: string;
  };
  message: object;
}

/**
 * Fee represents a Cosmos SDK transaction fee object.
 *
 * @category Transactions
 */
export interface Fee {
  amount: string;
  denom: string;
  gas: string;
}

/**
 * Sender represents a Cosmos SDK Transaction signer.
 *
 * @remarks
 * A sender object is used to populate the Cosmos SDK's SignerInfo field,
 * which is used to declare transaction signers.
 *
 * @category Transactions
 */
export interface Sender {
  accountAddress: CosmosAddress;
  sequence: number;
  accountNumber: number;
  pubkey: string;
}

/**
 * Chain represents the base chain's chainID.
 *
 * @remarks
 * chainId corresponds to a numerical Ethereum ChainID (e.g. 9001)
 * cosmosChainId corresponds to a Cosmos SDK string ChainID (e.g. 'bitbadges_1-1')
 *
 * @category Transactions
 */
export interface Chain {
  chainId: number;
  cosmosChainId: string;
  chain: SupportedChain;
}

/**
 * @category Interfaces
 */
export interface iMsgInstantiateContractCompat {
  /** The sender of the transaction. */
  sender: string;
  /** The code ID of the contract to instantiate. */
  codeId: string;
  /** The human-readable label of the contract. */
  label: string;
  /** The amount of funds to send to the contract on instantiation. */
  funds: string;
}

/**
 * @category Interfaces
 */
export interface iMsgStoreCodeCompat {
  /** The sender of the transaction. */
  sender: string;
  /** The contract byte code in hexadecimal format. See BitBadges CosmWASM tutorial for more details. */
  hexWasmByteCode: string;
}

/**
 * @category Interfaces
 */
export interface iMsgExecuteContractCompat {
  /** The sender of the transaction. */
  sender: string;
  /** The contract address to execute. */
  contract: string;
  /** The message to pass to the contract. Must be a valid JSON string. */
  msg: string;
  /** The funds to send to the contract. Must be a valid JSON string. */
  funds: string;
}

/**
 * @category Interfaces
 */
export interface iValueStore {
  key: string;
  value: string;
  lastSetBy: string;
}

/**
 * @category Interfaces
 */
export interface iMapUpdateCriteria {
  managerOnly: boolean;
  collectionId: string | number;
  creatorOnly: boolean;
  firstComeFirstServe: boolean;
}

/**
 * @category Interfaces
 */
export interface iValueOptions {
  noDuplicates: boolean;
  permanentOnceSet: boolean;
  expectUint: boolean;
  expectBoolean: boolean;
  expectAddress: boolean;
  expectUri: boolean;
}

/**
 * @category Interfaces
 */
export interface iMapPermissions {
  canUpdateMetadata: iTimedUpdatePermission[];
  canUpdateManager: iTimedUpdatePermission[];
  canDeleteMap: iActionPermission[];
}

/**
 * @category Interfaces
 */
export interface iMap {
  creator: CosmosAddress;
  mapId: string;

  inheritManagerTimelineFrom: string | number;
  managerTimeline: iManagerTimeline[];

  updateCriteria: iMapUpdateCriteria;

  valueOptions: iValueOptions;
  defaultValue: string;

  permissions: iMapPermissions;

  metadataTimeline: iMapMetadataTimeline[];
}

/**
 * @category Interfaces
 */
export interface iMapMetadataTimeline {
  timelineTimes: iUintRange[];
  metadata: iCollectionMetadata;
}

/**
 * @category Interfaces
 */
export interface iMsgCreateMap {
  creator: CosmosAddress;
  mapId: string;

  inheritManagerTimelineFrom: string | number;
  managerTimeline: iManagerTimeline[];

  updateCriteria: iMapUpdateCriteria;
  valueOptions: iValueOptions;
  defaultValue: string;

  metadataTimeline: iMapMetadataTimeline[];

  permissions: iMapPermissions;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateMap {
  creator: CosmosAddress;
  mapId: string;

  updateManagerTimeline: boolean;
  managerTimeline: iManagerTimeline[];

  updateMetadataTimeline: boolean;
  metadataTimeline: iMapMetadataTimeline[];

  updatePermissions: boolean;
  permissions: iMapPermissions;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteMap {
  creator: CosmosAddress;
  mapId: string;
}

/**
 * @category Interfaces
 */
export interface iMsgSetValue {
  creator: CosmosAddress;
  mapId: string;
  key: string;
  value: string;
  options: iSetOptions;
}

/**
 * @category Interfaces
 */
export interface iSetOptions {
  useMostRecentCollectionId: boolean;
}

/**
 * @category Interfaces
 */
export interface iMsgCreateAddressLists {
  /** The creator of the transaction. */
  creator: CosmosAddress;
  /** The address lists to create. */
  addressLists: iAddressList[];
}

/**
 * @category Interfaces
 */
export interface iMsgCreateCollection {
  /** The creator of the transaction. */
  creator: CosmosAddress;

  /** The balances type. Either "Standard", "Off-Chain - Indexed", "Off-Chain - Non-Indexed" or "Non-Public" */
  balancesType?: string;

  /** The default balances for users who have not interacted with the collection yet. Only can be set on initial creation. Only used if collection has "Standard" balance type. */
  defaultBalances?: iUserBalanceStore;

  /** The badges to create. Newly created badges will be sent to the "Mint" address. Must have necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Only used if collection has "Standard" balance type. */
  badgesToCreate?: iBalance[];

  /** The new collection permissions. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  collectionPermissions?: iCollectionPermissions;

  /** The new manager timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  managerTimeline?: iManagerTimeline[];

  /** The new collection metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  collectionMetadataTimeline?: iCollectionMetadataTimeline[];

  /** The new badge metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Note we take first-match only for badge IDs, so do not define duplicates. */
  badgeMetadataTimeline?: iBadgeMetadataTimeline[];

  /** The new off-chain balances metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Only used if "Off-Chain - Indexed" or "Off-Chain - Non-Indexed" balance type. */
  offChainBalancesMetadataTimeline?: iOffChainBalancesMetadataTimeline[];

  /** The new custom data timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  customDataTimeline?: iCustomDataTimeline[];

  /** The new collection approved transfers timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  collectionApprovals?: iCollectionApproval[];

  /** The new standards timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  standardsTimeline?: iStandardsTimeline[];

  /** The new is archived timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  isArchivedTimeline?: iIsArchivedTimeline[];
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteCollection {
  /** The creator of the transaction. */
  creator: CosmosAddress;
  /** The ID of the collection to delete. */
  collectionId: string | number;
}

/**
 * @category Interfaces
 */
export interface iMsgTransferBadges {
  /** The creator of the transaction. */
  creator: CosmosAddress;
  /** The ID of the collection to transfer badges from. */
  collectionId: string | number;
  /** The transfers to perform. */
  transfers: iTransfer[];
}

/**
 * @category Interfaces
 */
export interface iMsgUniversalUpdateCollection extends iMsgCreateCollection {
  /** The ID of the collection to update. */
  collectionId: string | number;
  /** Whether or not to update the collection permissions. */
  updateCollectionPermissions?: boolean;
  /** Whether or not to update the manager timeline. */
  updateManagerTimeline?: boolean;
  /** Whether or not to update the collection metadata timeline. */
  updateCollectionMetadataTimeline?: boolean;
  /** Whether or not to update the badge metadata timeline. */
  updateBadgeMetadataTimeline?: boolean;
  /** Whether or not to update the off-chain balances metadata timeline. */
  updateOffChainBalancesMetadataTimeline?: boolean;
  /** Whether or not to update the custom data timeline. */
  updateCustomDataTimeline?: boolean;
  /** Whether or not to update the collection approved transfers timeline. */
  updateCollectionApprovals?: boolean;
  /** Whether or not to update the standards timeline. */
  updateStandardsTimeline?: boolean;
  /** Whether or not to update the is archived timeline. */
  updateIsArchivedTimeline?: boolean;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateCollection extends Omit<iMsgUniversalUpdateCollection, 'defaultBalances' | 'balancesType'> {}

/**
 * @category Interfaces
 */
export interface iMsgUpdateUserApprovals {
  /** The creator of the transaction. */
  creator: CosmosAddress;
  /** The ID of the collection to transfer badges from. */
  collectionId: string | number;
  /** Whether or not to update the outgoing approvals. */
  updateOutgoingApprovals?: boolean;
  /** The new outgoing approvals. Must have the necessary permissions to update. */
  outgoingApprovals?: iUserOutgoingApproval[];
  /** Whether or not to update the incoming approvals. */
  updateIncomingApprovals?: boolean;
  /** The new incoming approvals. Must have the necessary permissions to update. */
  incomingApprovals?: iUserIncomingApproval[];
  /** Whether or not to update the auto approve self initiated outgoing transfers (i.e. from == the user and initiator == the user). */
  updateAutoApproveSelfInitiatedOutgoingTransfers?: boolean;
  /** The new auto approve self initiated outgoing transfers. Must have the necessary permissions to update. */
  autoApproveSelfInitiatedOutgoingTransfers?: boolean;
  /** Whether or not to update the auto approve self initiated incoming transfers (i.e. to == the user and initiator == the user). */
  updateAutoApproveSelfInitiatedIncomingTransfers?: boolean;
  /** The new auto approve self initiated incoming transfers. Must have the necessary permissions to update. */
  autoApproveSelfInitiatedIncomingTransfers?: boolean;
  /** Whether or not to update the user permissions. */
  updateUserPermissions?: boolean;
  /** The new user permissions. Must have the necessary permissions to update. */
  userPermissions?: iUserPermissions;
}

/**
 * DataType defines the type of solo machine proof being created. This is done
 * to preserve uniqueness of different data sign byte encodings.
 *
 * @generated from enum ibc.lightclients.solomachine.v2.DataType
 */

/**
 * DataType defines the type of solo machine proof being created. This is done
 * to preserve uniqueness of different data sign byte encodings.
 *
 * @generated from enum ibc.lightclients.solomachine.v1.DataType
 */

/**
 * State defines if a connection is in one of the following states:
 * INIT, TRYOPEN, OPEN or UNINITIALIZED.
 *
 * @generated from enum ibc.core.connection.v1.State
 */

/**
 * State defines if a channel is in one of the following states:
 * CLOSED, INIT, TRYOPEN, OPEN or UNINITIALIZED.
 *
 * @generated from enum ibc.core.channel.v1.State
 */

/**
 * Type defines a classification of message issued from a controller chain to
 * its associated interchain accounts host
 *
 * @generated from enum ibc.applications.interchain_accounts.v1.Type
 */

/**
 * @generated from enum cosmos_proto.ScalarType
 */

/**
 * @generated from enum google.protobuf.FieldDescriptorProto.Type
 */

/**
 * Generated classes can be optimized for speed or code size.
 *
 * @generated from enum google.protobuf.FileOptions.OptimizeMode
 */

/**
 * @generated from enum google.protobuf.FieldOptions.CType
 */

/**
 * Is this method side-effect-free (or safe in HTTP parlance), or idempotent,
 * or neither? HTTP based RPC implementation may choose GET verb for safe
 * methods, and PUT verb for idempotent methods instead of the default POST.
 *
 * @generated from enum google.protobuf.MethodOptions.IdempotencyLevel
 */

/**
 * StorageType
 *
 * @generated from enum cosmos.orm.v1alpha1.StorageType
 */

/**
 * VoteOption enumerates the valid vote options for a given governance proposal.
 *
 * @generated from enum cosmos.gov.v1.VoteOption
 */

/**
 * VoteOption enumerates the valid vote options for a given governance proposal.
 *
 * @generated from enum cosmos.gov.v1beta1.VoteOption
 */

/**
 * AuthorizationType defines the type of staking module authorization type
 *
 * Since: cosmos-sdk 0.43
 *
 * @generated from enum cosmos.staking.v1beta1.AuthorizationType
 */

/**
 * BondStatus is the status of a validator.
 *
 * @generated from enum cosmos.staking.v1beta1.BondStatus
 */

/**
 * Exec defines modes of execution of a proposal on creation or on new vote.
 *
 * @generated from enum cosmos.group.v1.Exec
 */

/**
 * VoteOption enumerates the valid vote options for a given proposal.
 *
 * @generated from enum cosmos.group.v1.VoteOption
 */

/**
 * SignMode represents a signing mode with its own security guarantees.
 *
 * This enum should be considered a registry of all known sign modes
 * in the Cosmos ecosystem. Apps are not expected to support all known
 * sign modes. Apps that would like to support custom  sign modes are
 * encouraged to open a small PR against this file to add a new case
 * to this SignMode enum describing their sign mode so that different
 * apps have a consistent version of this enum.
 *
 * @generated from enum cosmos.tx.signing.v1beta1.SignMode
 */

/**
 * OrderBy defines the sorting order
 *
 * @generated from enum cosmos.tx.v1beta1.OrderBy
 */

/**
 * @generated from enum ics23.HashOp
 */

/**
 * @generated from enum tendermint.abci.CheckTxType
 */

/**
 * @generated from enum tendermint.abci.ResponseOfferSnapshot.Result
 */

/**
 * @generated from enum tendermint.abci.ResponseApplySnapshotChunk.Result
 */

/**
 * @generated from enum tendermint.abci.ResponseProcessProposal.ProposalStatus
 */

/**
 * BlockIdFlag indicates which BlcokID the signature is for
 *
 * @generated from enum tendermint.types.BlockIDFlag
 */

/**
 * AccessType permission types
 *
 * @generated from enum cosmwasm.wasm.v1.AccessType
 */

BigInt.prototype.toJSON = function () {
  return this.toString();
};

export type SupportedChainType = 'Bitcoin' | 'Ethereum' | 'Cosmos' | 'Solana' | 'Unknown';

/**
 * NumberType is a type that can be used to represent a number in JavaScript in multiple ways.
 * Because the blockchain supports numbers > 2^53, we need to use BigInts or strings to represent them.
 *
 * NumberType is a union of all the types that can be used to represent a number in JavaScript.
 *
 * @category Number Types
 */
export type NumberType = bigint | number | string;

/**
 * JSPrimitiveNumberType is a type that can be used to represent a number in JavaScript in multiple ways.
 * Because the blockchain supports numbers > 2^53, we need to use BigInts or strings to represent them.
 *
 * JSPrimitiveNumberType is a union of all the types that can be used to represent a number in JavaScript.
 * This is the same as NumberType, but without BigInts because they are not a primitive.
 *
 * @category Number Types
 */
export type JSPrimitiveNumberType = string | number;

/**
 * @category Interfaces
 */
export interface iUserPermissions {
  /** The list of permissions for updating approved outgoing transfers. */
  canUpdateOutgoingApprovals: iUserOutgoingApprovalPermission[];
  /** The list of permissions for updating approved incoming transfers. */
  canUpdateIncomingApprovals: iUserIncomingApprovalPermission[];
  /** The permissions for updating auto-approving self-initiated outgoing transfers. If auto-approve is enabled, then the user will be approved by default for all outgoing transfers that are self-initiated. */
  canUpdateAutoApproveSelfInitiatedOutgoingTransfers: iActionPermission[];
  /** The permissions for updating auto-approving self-initiated incoming transfers. If auto-approve is enabled, then the user will be approved by default for all incoming transfers that are self-initiated. */
  canUpdateAutoApproveSelfInitiatedIncomingTransfers: iActionPermission[];
}

/**
 * @category Interfaces
 */
export interface iUserOutgoingApprovalPermission {
  /** The list ID of the to addresses of the approved outgoing transfers. */
  toListId: string;
  toList: iAddressList;
  /** The list ID of the initiatedBy addresses of the approved outgoing transfers. */
  initiatedByListId: string;
  initiatedByList: iAddressList;
  /** The transfer times of the approved outgoing transfers. */
  transferTimes: iUintRange[];
  /** The badge IDs of the approved outgoing transfers. */
  badgeIds: iUintRange[];
  /** The owned times of the approved outgoing transfers. */
  ownershipTimes: iUintRange[];
  /** The approval ID of the approved outgoing transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of the approved outgoing transfers. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the approved outgoing transfers. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iUserIncomingApprovalPermission {
  /** The list ID of the from addresses of the approved incoming transfers. */
  fromListId: string;
  fromList: iAddressList;
  /** The list ID of the initiatedBy addresses of the approved incoming transfers. */
  initiatedByListId: string;
  initiatedByList: iAddressList;
  /** The transfer times of the approved incoming transfers. */
  transferTimes: iUintRange[];
  /** The badge IDs of the approved incoming transfers. */
  badgeIds: iUintRange[];
  /** The owned times of the approved incoming transfers. */
  ownershipTimes: iUintRange[];
  /** The approval ID of the approved incoming transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of the approved incoming transfers. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the approved incoming transfers. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iCollectionPermissions {
  /** The permissions for deleting the collection. */
  canDeleteCollection: iActionPermission[];
  /** The permissions for archiving the collection. */
  canArchiveCollection: iTimedUpdatePermission[];
  /** The permissions for updating the off-chain balances metadata. */
  canUpdateOffChainBalancesMetadata: iTimedUpdatePermission[];
  /** The permissions for updating the standards. */
  canUpdateStandards: iTimedUpdatePermission[];
  /** The permissions for updating the custom data. */
  canUpdateCustomData: iTimedUpdatePermission[];
  /** The permissions for updating the manager. */
  canUpdateManager: iTimedUpdatePermission[];
  /** The permissions for updating the collection metadata. */
  canUpdateCollectionMetadata: iTimedUpdatePermission[];
  /** The permissions for creating more badges. */
  canCreateMoreBadges: iBalancesActionPermission[];
  /** The permissions for updating the badge metadata. */
  canUpdateBadgeMetadata: iTimedUpdateWithBadgeIdsPermission[];
  /** The permissions for updating the collection approved transfers. */
  canUpdateCollectionApprovals: iCollectionApprovalPermission[];
}

/**
 * @category Interfaces
 */
export interface iActionPermission {
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iTimedUpdatePermission {
  /** The timeline times that the permission applies to. */
  timelineTimes: iUintRange[];
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iBalancesActionPermission {
  /** The badge IDs that the permission applies to. */
  badgeIds: iUintRange[];
  /** The owned times of the permission. */
  ownershipTimes: iUintRange[];
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iTimedUpdateWithBadgeIdsPermission {
  /** The timeline times that the permission applies to. */
  timelineTimes: iUintRange[];
  /** The badge IDs that the permission applies to. */
  badgeIds: iUintRange[];
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iCollectionApprovalPermission {
  /** The list ID of the from addresses of the approved transfers. */
  fromListId: string;
  fromList: iAddressList;
  /** The list ID of the to addresses of the approved transfers. */
  toListId: string;
  toList: iAddressList;
  /** The list ID of the initiatedBy addresses of the approved transfers. */
  initiatedByListId: string;
  initiatedByList: iAddressList;
  /** The transfer times of the approved transfers. */
  transferTimes: iUintRange[];
  /** The badge IDs of the approved transfers. */
  badgeIds: iUintRange[];
  /** The owned times of the approved transfers. */
  ownershipTimes: iUintRange[];
  /** The approval ID of the approved transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of this permission. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of this permission. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iUintRange {
  /**
   * The start of the range.
   */
  start: string | number;

  /**
   * The end of the range, inclusive.
   */
  end: string | number;
}

/**
 * @category Interfaces
 */
export interface iBadgeMetadata {
  /**
   * The URI where to fetch the badge metadata from.
   */
  uri: string;

  /**
   * The badge IDs corresponding to the URI.
   */
  badgeIds: iUintRange[];

  /**
   * Arbitrary custom data that can be stored on-chain
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iCollectionMetadata {
  /**
   * The URI where to fetch the collection metadata from.
   */
  uri: string;

  /**
   * Arbitrary custom data that can be stored on-chain
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iOffChainBalancesMetadata {
  /**
   * The URI where to fetch the off-chain balances metadata from.
   */
  uri: string;

  /**
   * Arbitrary custom data that can be stored on-chain
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iSecretsProof {
  /** Entropies used for certain data integrity proofs on-chain (e.g. HASH(message + entropy) = on-chain value) */
  entropies?: string[];

  updateHistory?: iUpdateHistory[];

  /** The message format of the secretMessages. */
  messageFormat: 'plaintext' | 'json';
  /** The address of the user who created the secret. */
  createdBy: CosmosAddress;

  /**
   * Proof of issuance is used for BBS+ signatures (scheme = bbs) only.
   * BBS+ signatures are signed with a BBS+ key pair, but you would often want the issuer to be a native address.
   * The prooofOfIssuance establishes a link saying that "I am the issuer of this secret signed with BBS+ key pair ___".
   *
   * Fields can be left blank for standard signatures.
   */
  proofOfIssuance: {
    message: string;
    signature: string;
    signer: string;
    publicKey?: string;
  };

  /**
   * The scheme of the secret. BBS+ signatures are supported and can be used where selective disclosure is a requirement.
   * Otherwise, you can simply use your native blockchain's signature scheme.
   */
  scheme: 'bbs' | 'standard';

  /**
   * Thesse are the secrets that are signed.
   * For BBS+ signatures, there can be >1 secretMessages, and the signer can selectively disclose the secrets.
   * For standard signatures, there is only 1 secretMessage.
   */
  secretMessages: string[];

  /**
   * This is the signature and accompanying details of the secretMessages. The siganture maintains the integrity of the secretMessages.
   *
   * This should match the expected scheme. For example, if the scheme is BBS+, the signature should be a BBS+ signature and signer should be a BBS+ public key.
   */
  dataIntegrityProof: {
    signature: string;
    signer: string;
    publicKey?: string;
  };

  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  name: string;
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  image: string;
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  description: string;

  /**
   * Anchors are on-chain transactions used to prove certain things
   * about the secret. For example, you can anchor the secret to a
   * transaction hash to prove that the secret existed at a certain time.
   */
  anchors?: {
    txHash?: string;
    message?: string;
  }[];
}

/**
 * @category Interfaces
 */
export interface iSecret {
  /** The message format of the secretMessages. */
  messageFormat: 'plaintext' | 'json';
  /** The address of the user who created the secret. */
  createdBy: CosmosAddress;

  /**
   * Proof of issuance is used for BBS+ signatures (scheme = bbs) only.
   * BBS+ signatures are signed with a BBS+ key pair, but you would often want the issuer to be a native address.
   * The prooofOfIssuance establishes a link saying that "I am the issuer of this secret signed with BBS+ key pair ___".
   *
   * Fields can be left blank for standard signatures.
   */
  proofOfIssuance: {
    message: string;
    signature: string;
    signer: string;
    publicKey?: string;
  };

  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;

  /**
   * The scheme of the secret. BBS+ signatures are supported and can be used where selective disclosure is a requirement.
   * Otherwise, you can simply use your native blockchain's signature scheme.
   */
  scheme: 'bbs' | 'standard';
  /** The type of the secret (e.g. credential). */
  type: string;
  /**
   * Thesse are the secrets that are signed.
   * For BBS+ signatures, there can be >1 secretMessages, and the signer can selectively disclose the secrets.
   * For standard signatures, there is only 1 secretMessage.
   */
  secretMessages: string[];

  /**
   * This is the signature and accompanying details of the secretMessages. The siganture maintains the integrity of the secretMessages.
   *
   * This should match the expected scheme. For example, if the scheme is BBS+, the signature should be a BBS+ signature and signer should be a BBS+ public key.
   */
  dataIntegrityProof: {
    signature: string;
    signer: string;
    publicKey?: string;
  };

  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  name: string;
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  image: string;
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  description: string;

  /**
   * Holders for query purposes. These are the addresses that "hold" the secret (i.e. have it added to their account
   */
  holders: string[];

  /**
   * Anchors are on-chain transactions used to prove certain things
   * about the secret. For example, you can anchor the secret to a
   * transaction hash to prove that the secret existed at a certain time.
   */
  anchors: {
    txHash?: string;
    message?: string;
  }[];
}

/**
 * @category Interfaces
 */
export interface iZkProof {
  /**
   * The verification key of the zkProof.
   */
  verificationKey: string;

  /**
   * The URI where to fetch the zkProof metadata from.
   */
  uri: string;

  /**
   * Arbitrary custom data that can be stored on-chain.
   */
  customData: string;

  /**
   * ZKP tracker ID.
   */
  zkpTrackerId: string;
}

/**
 * @category Interfaces
 */
export interface iZkProofSolution {
  /**
   * The proof of the zkProof.
   */
  proof: string;

  /**
   * The public inputs of the zkProof.
   */
  publicInputs: string;
}

/**
 * @category Interfaces
 */
export interface iMustOwnBadges {
  /**
   * The collection ID of the badges to own.
   */
  collectionId: string | number;

  /**
   * The min/max acceptable amount of badges that must be owned (can be any values, including 0-0).
   */
  amountRange: iUintRange;

  /**
   * The range of the times that the badges must be owned.
   */
  ownershipTimes: iUintRange[];

  /**
   * The range of the badge IDs that must be owned.
   */
  badgeIds: iUintRange[];

  /**
   * Whether or not to override the ownershipTimes with the current time.
   */
  overrideWithCurrentTime: boolean;

  /**
   * Whether or not the user must own all the specified badges. If false, we will accept if they meet criteria for at least one badge.
   */
  mustSatisfyForAllAssets: boolean;
}

/**
 * @category Interfaces
 */
export interface iBalance {
  /**
   * The amount or balance of the owned badge.
   */
  amount: string | number;

  /**
   * The badge IDs corresponding to the balance.
   */
  badgeIds: iUintRange[];

  /**
   * The times that the badge is owned from.
   */
  ownershipTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iAddressList {
  /**
   * The ID of the address list.
   */
  listId: string;

  /**
   * The addresses of the address list. If this is a tracker list, the addresses are the tracker IDs.
   */
  addresses: string[];

  /**
   * Whether or not to include ONLY the addresses or include all EXCEPT the addresses.
   */
  whitelist: boolean;

  /**
   * The URI where to fetch the address list metadata from.
   */
  uri: string;

  /**
   * Arbitrary custom data that can be stored on-chain.
   */
  customData: string;

  /**
   * The address that created the address list.
   */
  createdBy?: CosmosAddress;

  /**
   * The alias cosmos address of the address list.
   */
  aliasAddress?: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iTransfer {
  /**
   * The address to transfer from.
   */
  from: CosmosAddress;

  /**
   * The addresses to transfer to.
   */
  toAddresses: CosmosAddress[];

  /**
   * The balances to transfer.
   */
  balances: iBalance[];

  /**
   * If specified, we will precalculate from this approval and override the balances. This can only be used when the specified approval has predeterminedBalances set.
   */
  precalculateBalancesFromApproval?: iApprovalIdentifierDetails;

  /**
   * The merkle proofs that satisfy the mkerkle challenges in the approvals. If the transfer deducts from multiple approvals, we check all the merkle proofs and assert at least one is valid for every challenge.
   */
  merkleProofs?: iMerkleProof[];

  /**
   * Arbitrary memo for the transfer.
   */
  memo?: string;

  /**
   * The prioritized approvals to use for the transfer. If specified, we will check these first.
   */
  prioritizedApprovals?: iApprovalIdentifierDetails[];

  /**
   * Whether or not to only check the prioritized approvals. If false, we will check all approvals with any prioritized first.
   */
  onlyCheckPrioritizedApprovals?: boolean;

  /**
   * The zk proof solutions for approvals.
   */
  zkProofSolutions?: iZkProofSolution[];
}

/**
 * @category Interfaces
 */
export interface iApprovalIdentifierDetails {
  /**
   * The approval ID of the approval.
   */
  approvalId: string;

  /**
   * The approval level of the approval "collection", "incoming", or "outgoing".
   */
  approvalLevel: string;

  /**
   * The address of the approval to check. If approvalLevel is "collection", this is blank "".
   */
  approverAddress: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iCoinTransfer {
  /**
   * The recipient of the coin transfer. This should be a Bech32 Cosmos address.
   */
  to: CosmosAddress;
  /**
   * The coins
   */
  coins: iCosmosCoin[];
}

/**
 * @category Interfaces
 */
export interface iAmountTrackerIdDetails {
  /**
   * The collection ID for the approval.
   */
  collectionId: string | number;

  /**
   * The approval ID
   */
  approvalId: string;

  /**
   * The amount tracker ID of the approval.
   */
  amountTrackerId: string;

  /**
   * The approval level of the approval "collection", "incoming", or "outgoing".
   */
  approvalLevel: string;

  /**
   * The address of the approval to check.
   */
  approverAddress: CosmosAddress;

  /**
   * The type of tracker to check "overall", "to", "from", or "initiatedBy".
   */
  trackerType: string;

  /**
   * The address to check for the approval.
   */
  approvedAddress: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iMerkleChallenge {
  /**
   * The root of the merkle tree.
   */
  root: string;

  /**
   * The expected proof length of the merkle proof.
   */
  expectedProofLength: string | number;

  /**
   * Whether or not to override any leaf value and use the creator address as the leaf. Used for whitelist trees.
   */
  useCreatorAddressAsLeaf: boolean;

  /**
   * Whether or not to enforce max uses per leaf. Used to prevent replay attacks.
   */
  maxUsesPerLeaf: string | number;

  /**
   * The URI where to fetch the merkle challenge metadata from.
   */
  uri: string;

  /**
   * Arbitrary custom data that can be stored on-chain.
   */
  customData: string;

  /**
   * Tracker ID details for the merkle challenge.
   */
  challengeTrackerId: string;
}

/**
 * @category Interfaces
 */
export interface iMerklePathItem {
  /**
   * The aunt of the merkle path item.
   */
  aunt: string;

  /**
   * Indicates whether the aunt node is on the right side of the path.
   */
  onRight: boolean;
}

/**
 * @category Interfaces
 */
export interface iMerkleProof {
  /**
   * The aunts of the merkle proof.
   */
  aunts: iMerklePathItem[];

  /**
   * The leaf of the merkle proof. If useCreatorAddressAsLeaf is true, this will be populated with the creator Cosmos address.
   */
  leaf: string;
}

/**
 * @category Interfaces
 */
export interface iTimelineItem {
  /**
   * The times of the timeline item. Times in a timeline cannot overlap.
   */
  timelineTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iManagerTimeline extends iTimelineItem {
  /**
   * The manager of the collection.
   */
  manager: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iCollectionMetadataTimeline extends iTimelineItem {
  /**
   * The collection metadata.
   */
  collectionMetadata: iCollectionMetadata;
}

/**
 * @category Interfaces
 */
export interface iBadgeMetadataTimeline extends iTimelineItem {
  /**
   * The badge metadata.
   */
  badgeMetadata: iBadgeMetadata[];
}

/**
 * @category Interfaces
 */
export interface iOffChainBalancesMetadataTimeline extends iTimelineItem {
  /**
   * The off-chain balances metadata.
   */
  offChainBalancesMetadata: iOffChainBalancesMetadata;
}

/**
 * @category Interfaces
 */
export interface iCustomDataTimeline extends iTimelineItem {
  /**
   * Arbitrary custom data.
   */
  customData: string;
}

/**
 * @category Interfaces
 */
export interface iStandardsTimeline extends iTimelineItem {
  /**
   * The standards.
   */
  standards: string[];
}

/**
 * @category Interfaces
 */
export interface iIsArchivedTimeline extends iTimelineItem {
  /**
   * Whether the collection is archived.
   */
  isArchived: boolean;
}

/**
 * @category Interfaces
 */
export interface iUserOutgoingApproval {
  toListId: string;
  toList: iAddressList;
  initiatedByListId: string;
  initiatedByList: iAddressList;
  transferTimes: iUintRange[];
  badgeIds: iUintRange[];
  ownershipTimes: iUintRange[];
  approvalId: string;
  uri?: string;
  customData?: string;
  approvalCriteria?: iOutgoingApprovalCriteria;
}

/**
 * @category Interfaces
 */
export interface iOutgoingApprovalCriteria {
  /** The list of must own badges to be approved. */
  mustOwnBadges?: iMustOwnBadges[];
  /** The list of ZK proofs that need to be satisfied. One use per proof solution. */
  zkProofs?: iZkProof[];
  /** The $BADGE transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer[];

  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge[];
  /** The predetermined balances for each transfer. */
  predeterminedBalances?: iPredeterminedBalances;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers;
  /** Whether the to address must equal the initiatedBy address. */
  requireToEqualsInitiatedBy?: boolean;
  /** Whether the to address must not equal the initiatedBy address. */
  requireToDoesNotEqualInitiatedBy?: boolean;
}

/**
 * @category Interfaces
 */
export interface iPredeterminedBalances {
  /** Manually define the balances for each transfer. Cannot be used with incrementedBalances. Order number corresponds to the index of the balance in the array. */
  manualBalances: iManualBalances[];
  /** Define a starting balance and increment the badge IDs and owned times by a certain amount after each transfer. Cannot be used with manualBalances. Order number corresponds to number of times we increment. */
  incrementedBalances: iIncrementedBalances;
  /** The order calculation method. */
  orderCalculationMethod: iPredeterminedOrderCalculationMethod;
}

/**
 * @category Interfaces
 */
export interface iManualBalances {
  /** The list of balances for each transfer. Order number corresponds to the index of the balance in the array. */
  balances: iBalance[];
}

/**
 * @category Interfaces
 */
export interface iIncrementedBalances {
  /** The starting balances for each transfer. Order number corresponds to the number of times we increment. */
  startBalances: iBalance[];
  /** The amount to increment the badge IDs by after each transfer. */
  incrementBadgeIdsBy: string | number;
  /** The amount to increment the owned times by after each transfer. */
  incrementOwnershipTimesBy: string | number;
}

/**
 * @category Interfaces
 */
export interface iPredeterminedOrderCalculationMethod {
  /** Use the overall number of transfers this approval has been used with as the order number. Ex: If this approval has been used 2 times by ANY address, then the order number for the next transfer will be 3. */
  useOverallNumTransfers: boolean;
  /** Use the number of times this approval has been used by each to address as the order number. Ex: If this approval has been used 2 times by to address A, then the order number for the next transfer by to address A will be 3. */
  usePerToAddressNumTransfers: boolean;
  /** Use the number of times this approval has been used by each from address as the order number. Ex: If this approval has been used 2 times by from address A, then the order number for the next transfer by from address A will be 3. */
  usePerFromAddressNumTransfers: boolean;
  /** Use the number of times this approval has been used by each initiated by address as the order number. Ex: If this approval has been used 2 times by initiated by address A, then the order number for the next transfer by initiated by address A will be 3. */
  usePerInitiatedByAddressNumTransfers: boolean;
  /** Use the merkle challenge leaf index as the order number. Must specify ONE merkle challenge with the useLeafIndexForTransferOrder flag set to true. If so, we will use the leaf index of each merkle proof to calculate the order number. This is used to reserve specific balances for specific leaves (such as codes or whitelist address leafs) */
  useMerkleChallengeLeafIndex: boolean;
  /** Use the merkle challenge leaf index as the order number. Must specify ONE merkle challenge with the useLeafIndexForTransferOrder flag set to true. If so, we will use the leaf index of each merkle proof to calculate the order number. This is used to reserve specific balances for specific leaves (such as codes or whitelist address leafs) */
  challengeTrackerId: string;
}

/**
 * @category Interfaces
 */
export interface iApprovalAmounts {
  /** The overall maximum amount approved for the badgeIDs and ownershipTimes. Running tally that includes all transfers that match this approval. */
  overallApprovalAmount: string | number;
  /** The maximum amount approved for the badgeIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval. */
  perToAddressApprovalAmount: string | number;
  /** The maximum amount approved for the badgeIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval. */
  perFromAddressApprovalAmount: string | number;
  /** The maximum amount approved for the badgeIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval. */
  perInitiatedByAddressApprovalAmount: string | number;
  /** The ID of the approval tracker. This is the key used to track tallies. */
  amountTrackerId: string;
}

/**
 * @category Interfaces
 */
export interface iMaxNumTransfers {
  /** The overall maximum number of transfers for the badgeIDs and ownershipTimes. Running tally that includes all transfers that match this approval. */
  overallMaxNumTransfers: string | number;
  /** The maximum number of transfers for the badgeIDs and ownershipTimes for each to address. Running tally that includes all transfers from each unique to address that match this approval. */
  perToAddressMaxNumTransfers: string | number;
  /** The maximum number of transfers for the badgeIDs and ownershipTimes for each from address. Running tally that includes all transfers from each unique from address that match this approval. */
  perFromAddressMaxNumTransfers: string | number;
  /** The maximum number of transfers for the badgeIDs and ownershipTimes for each initiated by address. Running tally that includes all transfers from each unique initiated by address that match this approval. */
  perInitiatedByAddressMaxNumTransfers: string | number;
  /** The ID of the approval tracker. This is the key used to track tallies. */
  amountTrackerId: string;
}

/**
 * @category Interfaces
 */
export interface iUserIncomingApproval {
  /** The list ID for the user(s) who is sending the badges. */
  fromListId: string;
  fromList: iAddressList;
  /** The list ID for the user(s) who initiate the transfer. */
  initiatedByListId: string;
  initiatedByList: iAddressList;
  /** The times of the transfer transaction. */
  transferTimes: iUintRange[];
  /** The badge IDs to be transferred. */
  badgeIds: iUintRange[];
  /** The ownership times of the badges being transferred. */
  ownershipTimes: iUintRange[];
  /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
  approvalId: string;
  /** The URI of the approval. */
  uri?: string;
  /** Arbitrary custom data of the approval */
  customData?: string;
  /** For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc. */
  approvalCriteria?: iIncomingApprovalCriteria;
}

/**
 * @category Interfaces
 */
export interface iIncomingApprovalCriteria {
  /** The list of must own badges to be approved. */
  mustOwnBadges?: iMustOwnBadges[];
  /** The list of ZK proofs that need to be satisfied. One use per proof solution. */
  zkProofs?: iZkProof[];
  /** The $BADGE transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer[];
  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge[];
  /** The predetermined balances for each transfer using this approval. */
  predeterminedBalances?: iPredeterminedBalances;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers;
  /** Whether the from address must equal the initiatedBy address. */
  requireFromEqualsInitiatedBy?: boolean;
  /** Whether the from address must not equal the initiatedBy address. */
  requireFromDoesNotEqualInitiatedBy?: boolean;
}

/**
 * @category Interfaces
 */
export interface iCollectionApproval {
  /** The list ID for the user(s) who is receiving the badges. */
  toListId: string;
  toList: iAddressList;
  /** The list ID for the user(s) who is sending the badges. */
  fromListId: string;
  fromList: iAddressList;
  /** The list ID for the user(s) who initiate the transfer. */
  initiatedByListId: string;
  initiatedByList: iAddressList;
  /** The times of the transfer transaction. */
  transferTimes: iUintRange[];
  /** The badge IDs to be transferred. */
  badgeIds: iUintRange[];
  /** The ownership times of the badges being transferred. */
  ownershipTimes: iUintRange[];
  /** The ID of the approval. Must not be a duplicate of another approval ID in the same timeline. */
  approvalId: string;
  /** The URI of the approval. */
  uri?: string;
  /** Arbitrary custom data of the approval */
  customData?: string;
  /** For allowed combinations, we also must check the details of the approval. These represent the restrictions that must be obeyed such as the total amount approved, max num transfers, merkle challenges, must own badges, etc. */
  approvalCriteria?: iApprovalCriteria;
}

/**
 * @category Interfaces
 */
export interface iApprovalCriteria {
  /** The list of must own badges to be approved. */
  mustOwnBadges?: iMustOwnBadges[];
  /** The list of ZK proofs that need to be satisfied. One use per proof solution. */
  zkProofs?: iZkProof[];
  /** The $BADGE transfers to be executed upon every approval. */
  coinTransfers?: iCoinTransfer[];
  /** The list of merkle challenges that need valid proofs to be approved. */
  merkleChallenges?: iMerkleChallenge[];
  /** The predetermined balances for each transfer. */
  predeterminedBalances?: iPredeterminedBalances;
  /** The maximum approved amounts for this approval. */
  approvalAmounts?: iApprovalAmounts;
  /** The max num transfers for this approval. */
  maxNumTransfers?: iMaxNumTransfers;
  /** Whether the to address must equal the initiatedBy address. */
  requireToEqualsInitiatedBy?: boolean;
  /** Whether the from address must equal the initiatedBy address. */
  requireFromEqualsInitiatedBy?: boolean;
  /** Whether the to address must not equal the initiatedBy address. */
  requireToDoesNotEqualInitiatedBy?: boolean;
  /** Whether the from address must not equal the initiatedBy address. */
  requireFromDoesNotEqualInitiatedBy?: boolean;
  /** Whether this approval overrides the from address's approved outgoing transfers. */
  overridesFromOutgoingApprovals?: boolean;
  /** Whether this approval overrides the to address's approved incoming transfers. */
  overridesToIncomingApprovals?: boolean;
}

/**
 * This stores everythign about a user's balances for a specific collection ID.
 * This includes their balances, incoming approvals, outgoing approvals, and permissions.
 *
 * @category Interfaces
 */
export interface iUserBalanceStore {
  /** The user's balances. */
  balances: iBalance[];
  /** The user's incoming approvals. */
  incomingApprovals: iUserIncomingApproval[];
  /** The user's outgoing approvals. */
  outgoingApprovals: iUserOutgoingApproval[];
  /** The user's permissions. */
  userPermissions: iUserPermissions;
  /** Whether the user's self-initiated outgoing transfers are auto-approved. If not, they must be explicitly approved using the outgoing approvals. */
  autoApproveSelfInitiatedOutgoingTransfers: boolean;
  /** Whether the user's self-initiated incoming transfers are auto-approved. If not, they must be explicitly approved using the incoming approvals. */
  autoApproveSelfInitiatedIncomingTransfers: boolean;
}
