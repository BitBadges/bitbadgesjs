import type { iBitBadgesAddressList } from '@/api-indexer/BitBadgesAddressList';
import { BitBadgesAddressList } from '@/api-indexer/BitBadgesAddressList';
import type { iBitBadgesCollection } from '@/api-indexer/BitBadgesCollection';
import { BitBadgesCollection } from '@/api-indexer/BitBadgesCollection';
import type { iBitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo';
import { BitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo';
import type { PaginationInfo } from '@/api-indexer/base';
import { EmptyResponseClass } from '@/api-indexer/base';
import { ClaimAlertDoc, TransferActivityDoc } from '@/api-indexer/docs/activity';
import { AccessTokenDoc, DeveloperAppDoc, PluginDoc, SecretDoc, StatusDoc } from '@/api-indexer/docs/docs';
import type {
  BlockinMessage,
  ClaimIntegrationPluginCustomBodyType,
  ClaimIntegrationPluginType,
  CosmosAddress,
  IntegrationPluginDetails,
  JsonBodyInputSchema,
  JsonBodyInputWithValue,
  NativeAddress,
  PluginPresetType,
  UNIXMilliTimestamp,
  iAccessTokenDoc,
  iDeveloperAppDoc,
  iClaimAlertDoc,
  iCustomLink,
  iCustomListPage,
  iCustomPage,
  iPluginDoc,
  iSecretDoc,
  iSocialConnections,
  iStatusDoc,
  iTransferActivityDoc
} from '@/api-indexer/docs/interfaces';
import type { iBadgeMetadataDetails, iCollectionMetadataDetails } from '@/api-indexer/metadata/badgeMetadata';
import type { iMetadata } from '@/api-indexer/metadata/metadata';
import { Metadata } from '@/api-indexer/metadata/metadata';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import type { SupportedChain } from '@/common/types';
import { PredeterminedBalances, iChallengeDetails, iChallengeInfoDetails } from '@/core/approvals';
import type { iBatchBadgeDetails } from '@/core/batch-utils';
import { BlockinChallenge, iBlockinChallenge } from '@/core/blockin';
import { SecretsProof } from '@/core/secrets';
import type { iOffChainBalancesMap } from '@/core/transfers';
import { UintRangeArray } from '@/core/uintRanges';
import type { iPredeterminedBalances, iSecretsProof, iUintRange } from '@/interfaces';
import type { BroadcastPostBody } from '@/node-rest-api/broadcast';
import type { DeliverTxResponse, Event } from '@cosmjs/stargate';
import type { AssetConditionGroup, ChallengeParams, VerifyChallengeOptions } from 'blockin';
import { BlockinChallengeParams } from './blockin';

/**
 * @category API Requests / Responses
 */
export interface GetStatusBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetStatusSuccessResponse<T extends NumberType> {
  /**
   * Status details about the indexer / blockchain.
   */
  status: iStatusDoc<T>;
}

/**
 * @inheritDoc iGetStatusSuccessResponse
 * @category API Requests / Responses
 */
export class GetStatusSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetStatusSuccessResponse<T>>
  implements iGetStatusSuccessResponse<T>
{
  status: StatusDoc<T>;
  constructor(data: iGetStatusSuccessResponse<T>) {
    super();
    this.status = new StatusDoc(data.status);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetStatusSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetStatusSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetSearchBody {
  /** If true, we will skip all collection queries. */
  noCollections?: boolean;
  /** If true, we will skip all account queries. */
  noAccounts?: boolean;
  /** If true, we will skip all address list queries. */
  noAddressLists?: boolean;
  /** If true, we will skip all badge queries. */
  noBadges?: boolean;
  /** If true, we will limit collection results to a single collection. */
  specificCollectionId?: NumberType;
}

/**
 *
 * @category API Requests / Responses
 */
export interface iGetSearchSuccessResponse<T extends NumberType> {
  collections: iBitBadgesCollection<T>[];
  accounts: iBitBadgesUserInfo<T>[];
  addressLists: iBitBadgesAddressList<T>[];
  badges: {
    collection: iBitBadgesCollection<T>;
    badgeIds: iUintRange<T>[];
  }[];
}
/**
 * @inheritDoc iGetSearchSuccessResponse
 * @category API Requests / Responses
 */
export class GetSearchSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSearchSuccessResponse<T>>
  implements iGetSearchSuccessResponse<T>
{
  collections: BitBadgesCollection<T>[];
  accounts: BitBadgesUserInfo<T>[];
  addressLists: BitBadgesAddressList<T>[];
  badges: {
    collection: BitBadgesCollection<T>;
    badgeIds: UintRangeArray<T>;
  }[];

  constructor(data: iGetSearchSuccessResponse<T>) {
    super();
    this.collections = data.collections.map((collection) => new BitBadgesCollection(collection));
    this.accounts = data.accounts.map((account) => new BitBadgesUserInfo(account));
    this.addressLists = data.addressLists.map((addressList) => new BitBadgesAddressList(addressList));
    this.badges = data.badges.map((badge) => {
      return {
        collection: new BitBadgesCollection(badge.collection),
        badgeIds: UintRangeArray.From(badge.badgeIds)
      };
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetSearchSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetSearchSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetClaimsBody {
  /** The claim IDs to fetch. */
  claimIds: string[];
  /** If the address list is private and viewable with the link only, you must also specify the address list ID to prove knowledge of the link. */
  listId?: string;
}

/**
 * @category Interfaces
 */
export interface iClaimDetails<T extends NumberType> {
  /** Unique claim ID. */
  claimId: string;
  /** The balances to set for the claim. Only used for claims for collections that have off-chain indexed balances and are assigning balances based on the claim. */
  balancesToSet?: iPredeterminedBalances<T>;
  /** Claim plugins. These are the criteria that must pass for a user to claim the badge. */
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  /** If manual distribution is enabled, we do not handle any distribution of claim codes. We leave that up to the claim creator. */
  manualDistribution?: boolean;
  /** Whether the claim is expected to be automatically triggered by someone (not the user). */
  automatic?: boolean;
  /** Seed code for the claim. */
  seedCode?: string;
  /** Metadata for the claim. */
  metadata?: iMetadata<T>;
}

/**
 * @inheritDoc iClaimDetails
 * @category API Requests / Responses
 */
export class ClaimDetails<T extends NumberType> extends BaseNumberTypeClass<ClaimDetails<T>> implements iClaimDetails<T> {
  claimId: string;
  balancesToSet?: PredeterminedBalances<T>;
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  manualDistribution?: boolean;
  automatic?: boolean;
  seedCode?: string | undefined;
  metadata?: Metadata<T> | undefined;

  constructor(data: iClaimDetails<T>) {
    super();
    this.claimId = data.claimId;
    this.balancesToSet = data.balancesToSet ? new PredeterminedBalances(data.balancesToSet) : undefined;
    this.plugins = data.plugins;
    this.manualDistribution = data.manualDistribution;
    this.automatic = data.automatic;
    this.seedCode = data.seedCode;
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): ClaimDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ClaimDetails<U>;
  }
}

/**
 *
 * @category API Requests / Responses
 */
export interface iGetClaimsSuccessResponse<T extends NumberType> {
  claims: iClaimDetails<T>[];
}

/**
 * @inheritDoc iGetClaimsSuccessResponse
 * @category API Requests / Responses
 */
export class GetClaimsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimsSuccessResponse<T>>
  implements iGetClaimsSuccessResponse<T>
{
  claims: ClaimDetails<T>[];

  constructor(data: iGetClaimsSuccessResponse<T>) {
    super();
    this.claims = data.claims.map((claim) => new ClaimDetails(claim));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): GetClaimsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetClaimsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface CompleteClaimBody {
  /** If provided, we will check that no plugins or claims have been updated since the last time the user fetched the claim. */
  _fetchedAt?: number;

  /** The claim body for each unique plugin. */
  [customPluginId: string]: ClaimIntegrationPluginCustomBodyType<ClaimIntegrationPluginType> | any | undefined;
}

/**
 * @category API Requests / Responses
 */
export interface iCompleteClaimSuccessResponse {
  /** The transaction ID to track the claim. */
  claimAttemptId: string;
}

/**
 * @category API Requests / Responses
 */
export class CompleteClaimSuccessResponse extends CustomTypeClass<CompleteClaimSuccessResponse> implements iCompleteClaimSuccessResponse {
  claimAttemptId: string;

  constructor(data: iCompleteClaimSuccessResponse) {
    super();
    this.claimAttemptId = data.claimAttemptId;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetClaimAttemptStatusBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimAttemptStatusSuccessResponse {
  success: boolean;
  error: string;
  code?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetClaimAttemptStatusSuccessResponse
  extends CustomTypeClass<GetClaimAttemptStatusSuccessResponse>
  implements iGetClaimAttemptStatusSuccessResponse
{
  success: boolean;
  error: string;
  code?: string;

  constructor(data: iGetClaimAttemptStatusSuccessResponse) {
    super();
    this.success = data.success;
    this.error = data.error;
    this.code = data.code;
  }
}

/**
 * @category API Requests / Responses
 */
export interface SimulateClaimBody {
  /** If provided, we will check that no plugins or claims have been updated since the last time the user fetched the claim. */
  _fetchedAt?: number;

  /** The claim body for each unique plugin. */
  [customPluginId: string]: ClaimIntegrationPluginCustomBodyType<ClaimIntegrationPluginType> | any | undefined;
}

/**
 * @category API Requests / Responses
 */
export interface iSimulateClaimSuccessResponse {
  /** The transaction ID to track the claim. This is just a simulated value for compatibility purposes. */
  claimAttemptId: string;
}

/**
 * @inheritDoc iSimulateClaimSuccessResponse
 * @category API Requests / Responses
 */
export class SimulateClaimSuccessResponse extends CustomTypeClass<SimulateClaimSuccessResponse> implements iSimulateClaimSuccessResponse {
  claimAttemptId: string;

  constructor(data: iSimulateClaimSuccessResponse) {
    super();
    this.claimAttemptId = data.claimAttemptId;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetReservedClaimCodesBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetReservedClaimCodesSuccessResponse {
  /** The new claim code for the user if the claim was successful. */
  code?: string;
  /** The previous claim codes for the user. */
  prevCodes?: string[];
}

/**
 * @inheritDoc iGetReservedClaimCodesSuccessResponse
 * @category API Requests / Responses
 */
export class GetReservedClaimCodesSuccessResponse
  extends CustomTypeClass<GetReservedClaimCodesSuccessResponse>
  implements iGetReservedClaimCodesSuccessResponse
{
  code?: string;
  prevCodes?: string[] | undefined;

  constructor(data: iGetReservedClaimCodesSuccessResponse) {
    super();
    this.code = data.code;
    this.prevCodes = data.prevCodes;
  }
}

/**
 * @category API Requests / Responses
 */
export interface DeleteReviewBody {
  /**
   * The review ID to delete.
   */
  reviewId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteReviewSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteReviewSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface AddReviewBody {
  /**
   * The review text (1 to 2048 characters).
   */
  review: string;

  /**
   * The star rating (1 to 5).
   */
  stars: NumberType;

  /**
   * The address you are reviewing. One of cosmosAddress or collectionId must be provided.
   */
  cosmosAddress?: CosmosAddress;

  /**
   * The collection ID that you are reviewing. One of cosmosAddress or collectionId must be provided.
   */
  collectionId?: NumberType;
}

/**
 * @category API Requests / Responses
 */
export interface iAddReviewSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class AddReviewSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface UpdateAccountInfoBody {
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
  seenActivity?: UNIXMilliTimestamp<NumberType>;

  /**
   * The README details (markdown supported).
   */
  readme?: string;

  /**
   * The badges to hide and not view for this profile's portfolio
   */
  hiddenBadges?: iBatchBadgeDetails<NumberType>[];

  /**
   * The lists to hide and not view for this profile's portfolio
   */
  hiddenLists?: string[];

  /**
   * Custom URL links to display on the user's portfolio.
   */
  customLinks?: iCustomLink[];

  /**
   * An array of custom pages on the user's portolio. Used to customize, sort, and group badges / lists into pages.
   */
  customPages?: {
    badges: iCustomPage<NumberType>[];
    lists: iCustomListPage[];
  };

  /**
   * The watchlist of badges / lists
   */
  watchlists?: {
    badges: iCustomPage<NumberType>[];
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
    preferences?: { listActivity?: boolean; transferActivity?: boolean; claimAlerts?: boolean; ignoreIfInitiator?: boolean };
  };

  /**
   * Approved sign in methods. Only returned if user is authenticated with full access.
   */
  approvedSignInMethods?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
  };

  /**
   * The social connections for the user. Only returned if user is authenticated with full access.
   */
  socialConnections?: iSocialConnections<NumberType>;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAccountInfoSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdateAccountInfoSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface AddBalancesToOffChainStorageBody {
  /**
   * A map of Cosmos addresses or list IDs -> Balance<NumberType>[].
   * This will be set first. If undefined, we leave the existing balances map as is.
   * For genesis, this must be set (even if empty {}), so we create the unique URL.
   */
  balances?: iOffChainBalancesMap<NumberType>;

  /**
   * The new set of claims for the collection. This should be ALL claims. We currently do not support fine-grained claim updates.
   *
   * If undefined, we leave the existing claims as is. If defined, we set the new claims to what is provided.
   *
   * If a claim has existing state, you can reset the individual plugin's state
   * with plugin.resetState = true. Or, claims with new, unique IDs have blank state for all plugins.
   *
   * We soft delete any claims that are no longer in the claims array. By soft delete, we mean that we will flag it as deleted,
   * but if you want to reinstate it, you can do so by adding it back with the same claim ID.
   */
  claims?: {
    claimId: string;
    plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
    balancesToSet?: iPredeterminedBalances<NumberType>;
  }[];

  /**
   * The method for storing balances (ipfs or centralized).
   */
  method: 'ipfs' | 'centralized';

  /**
   * The collection ID.
   */
  collectionId: NumberType;

  /**
   * Whether this is for a non-indexed collection. Bypasses some validation.
   */
  isNonIndexed?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iAddBalancesToOffChainStorageSuccessResponse {
  /**
   * The URI of the stored data.
   */
  uri?: string;
}

/**
 * @inheritDoc iAddBalancesToOffChainStorageSuccessResponse
 * @category API Requests / Responses
 */
export class AddBalancesToOffChainStorageSuccessResponse
  extends CustomTypeClass<AddBalancesToOffChainStorageSuccessResponse>
  implements iAddBalancesToOffChainStorageSuccessResponse
{
  uri?: string;

  constructor(data: iAddBalancesToOffChainStorageSuccessResponse) {
    super();
    this.uri = data.uri;
  }
}

/**
 * @category API Requests / Responses
 */
export interface AddToIpfsBody {
  /**
   * The stuff to add to IPFS
   */
  contents?: (iBadgeMetadataDetails<NumberType> | iMetadata<NumberType> | iCollectionMetadataDetails<NumberType> | iChallengeDetails<NumberType>)[];
}

/**
 * @category API Requests / Responses
 */
export interface iAddToIpfsSuccessResponse {
  /**
   * An array of badge metadata results, if applicable.
   */
  results: {
    cid: string;
  }[];
}

/**
 * @inheritDoc iAddToIpfsSuccessResponse
 * @category API Requests / Responses
 */
export class AddToIpfsSuccessResponse extends CustomTypeClass<AddToIpfsSuccessResponse> implements iAddToIpfsSuccessResponse {
  results: {
    cid: string;
  }[];

  constructor(data: iAddToIpfsSuccessResponse) {
    super();

    this.results = data.results;
  }
}

/**
 * @category API Requests / Responses
 */
export interface AddApprovalDetailsToOffChainStorageBody {
  approvalDetails: {
    /**
     * The name of the approval.
     */
    name: string;

    /**
     * The description of the approval.
     */
    description: string;

    /** For any merkle challenge claims that we are implementing */
    challengeInfoDetails?: iChallengeInfoDetails<NumberType>[];
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iAddApprovalDetailsToOffChainStorageSuccessResponse {
  approvalResults: {
    /**
     * The result for name / description (if applicable).
     */
    metadataResult: {
      cid: string;
    };

    /**
     * The result for the approval challenge details (if applicable).
     */
    challengeResults?: {
      cid: string;
    }[];
  }[];
}

/**
 * @inheritDoc iAddApprovalDetailsToOffChainStorageSuccessResponse
 * @category API Requests / Responses
 */
export class AddApprovalDetailsToOffChainStorageSuccessResponse
  extends CustomTypeClass<AddApprovalDetailsToOffChainStorageSuccessResponse>
  implements iAddApprovalDetailsToOffChainStorageSuccessResponse
{
  approvalResults: {
    metadataResult: {
      cid: string;
    };
    challengeResults?: {
      cid: string;
    }[];
  }[];

  constructor(data: iAddApprovalDetailsToOffChainStorageSuccessResponse) {
    super();
    this.approvalResults = data.approvalResults.map((approvalResult) => {
      return {
        metadataResult: approvalResult.metadataResult,
        challengeResults: approvalResult.challengeResults
      };
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetSignInChallengeBody {
  /**
   * The blockchain to be signed in with.
   */
  chain: SupportedChain;

  /**
   * The user's blockchain address. This can be their native address.
   */
  address: NativeAddress;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSignInChallengeSuccessResponse<T extends NumberType> {
  /**
   * The nonce for the challenge.
   */
  nonce: string;

  /**
   * The challenge parameters.
   */
  params: ChallengeParams<T>;

  /**
   * The challenge message to sign.
   */
  message: BlockinMessage;
}

/**
 * @inheritDoc iGetSignInChallengeSuccessResponse
 * @category API Requests / Responses
 */
export class GetSignInChallengeSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSignInChallengeSuccessResponse<T>>
  implements iGetSignInChallengeSuccessResponse<T>
{
  nonce: string;
  params: BlockinChallengeParams<T>;
  message: BlockinMessage;

  constructor(data: iGetSignInChallengeSuccessResponse<T>) {
    super();
    this.nonce = data.nonce;
    this.params = new BlockinChallengeParams(data.params);
    this.message = data.message;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetSignInChallengeSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetSignInChallengeSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface VerifySignInBody {
  /**
   * The original message that was signed.
   */
  message: BlockinMessage;

  /**
   * The signature of the message
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
export interface iVerifySignInSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class VerifySignInSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface CheckSignInStatusBody {}

/**
 * @category API Requests / Responses
 */
export interface iCheckSignInStatusSuccessResponse {
  /**
   * Indicates whether the user is signed in.
   */
  signedIn: boolean;

  /**
   * The message that was signed.
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
 * @inheritDoc iCheckSignInStatusSuccessResponse
 * @category API Requests / Responses
 */
export class CheckSignInStatusSuccessResponse extends CustomTypeClass<CheckSignInStatusSuccessResponse> implements iCheckSignInStatusSuccessResponse {
  signedIn: boolean;
  message: BlockinMessage;
  discord?: {
    username: string;
    discriminator: string;
    id: string;
  };
  twitter?: {
    username: string;
    id: string;
  };
  github?: {
    username: string;
    id: string;
  };
  google?: {
    id: string;
    username: string;
  };

  constructor(data: iCheckSignInStatusSuccessResponse) {
    super();
    this.signedIn = data.signedIn;
    this.message = data.message;
    this.discord = data.discord;
    this.twitter = data.twitter;
    this.github = data.github;
    this.google = data.google;
  }
}

/**
 * @category API Requests / Responses
 */
export interface SignOutBody {
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
export class SignOutSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface GetBrowseCollectionsBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetBrowseCollectionsSuccessResponse<T extends NumberType> {
  collections: { [category: string]: iBitBadgesCollection<T>[] };
  addressLists: { [category: string]: iBitBadgesAddressList<T>[] };
  profiles: { [category: string]: iBitBadgesUserInfo<T>[] };
  activity: iTransferActivityDoc<T>[];
  badges: {
    [category: string]: {
      collection: iBitBadgesCollection<T>;
      badgeIds: iUintRange<T>[];
    }[];
  };
}

/**
 * @category API Requests / Responses
 */
export class GetBrowseCollectionsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBrowseCollectionsSuccessResponse<T>>
  implements iGetBrowseCollectionsSuccessResponse<T>
{
  collections: { [category: string]: BitBadgesCollection<T>[] };
  addressLists: { [category: string]: BitBadgesAddressList<T>[] };
  profiles: { [category: string]: BitBadgesUserInfo<T>[] };
  activity: TransferActivityDoc<T>[];
  badges: {
    [category: string]: {
      collection: BitBadgesCollection<T>;
      badgeIds: UintRangeArray<T>;
    }[];
  };

  constructor(data: iGetBrowseCollectionsSuccessResponse<T>) {
    super();
    this.collections = Object.keys(data.collections).reduce(
      (acc, category) => {
        acc[category] = data.collections[category].map((collection) => new BitBadgesCollection(collection));
        return acc;
      },
      {} as { [category: string]: BitBadgesCollection<T>[] }
    );
    this.addressLists = Object.keys(data.addressLists).reduce(
      (acc, category) => {
        acc[category] = data.addressLists[category].map((addressList) => new BitBadgesAddressList(addressList));
        return acc;
      },
      {} as { [category: string]: BitBadgesAddressList<T>[] }
    );
    this.profiles = Object.keys(data.profiles).reduce(
      (acc, category) => {
        acc[category] = data.profiles[category].map((profile) => new BitBadgesUserInfo(profile));
        return acc;
      },
      {} as { [category: string]: BitBadgesUserInfo<T>[] }
    );
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.badges = Object.keys(data.badges).reduce(
      (acc, category) => {
        acc[category] = data.badges[category].map((badge) => {
          return {
            collection: new BitBadgesCollection(badge.collection),
            badgeIds: UintRangeArray.From(badge.badgeIds)
          };
        });
        return acc;
      },
      {} as { [category: string]: { collection: BitBadgesCollection<T>; badgeIds: UintRangeArray<T> }[] }
    );
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetBrowseCollectionsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetBrowseCollectionsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export type BroadcastTxBody = BroadcastPostBody;

/**
 * @category API Requests / Responses
 */
export interface iBroadcastTxSuccessResponse {
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
export class BroadcastTxSuccessResponse extends CustomTypeClass<BroadcastTxSuccessResponse> implements iBroadcastTxSuccessResponse {
  tx_response: {
    code: number;
    codespace: string;
    data: string;
    events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
    gas_wanted: string;
    gas_used: string;
    height: string;
    logs: {
      events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
    }[];
    raw_log: string;
    timestamp: string;
    tx: object | null;
    txhash: string;
  };

  constructor(data: iBroadcastTxSuccessResponse) {
    super();
    this.tx_response = data.tx_response;
  }
}

/**
 * @category API Requests / Responses
 */
export type SimulateTxBody = BroadcastPostBody;

/**
 * @category API Requests / Responses
 */
export interface iSimulateTxSuccessResponse {
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
 * @inheritDoc iSimulateTxSuccessResponse
 * @category API Requests / Responses
 */
export class SimulateTxSuccessResponse extends CustomTypeClass<SimulateTxSuccessResponse> implements iSimulateTxSuccessResponse {
  gas_info: { gas_used: string; gas_wanted: string };
  result: {
    data: string;
    log: string;
    events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
  };

  constructor(data: iSimulateTxSuccessResponse) {
    super();
    this.gas_info = data.gas_info;
    this.result = data.result;
  }
}

/**
 * @category API Requests / Responses
 */
export interface FetchMetadataDirectlyBody {
  uris: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iFetchMetadataDirectlySuccessResponse<T extends NumberType> {
  metadata: iMetadata<T>[];
}

/**
 * @inheritDoc iFetchMetadataDirectlySuccessResponse
 * @category API Requests / Responses
 */
export class FetchMetadataDirectlySuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<FetchMetadataDirectlySuccessResponse<T>>
  implements iFetchMetadataDirectlySuccessResponse<T>
{
  metadata: Metadata<T>[];

  constructor(data: iFetchMetadataDirectlySuccessResponse<T>) {
    super();
    this.metadata = data.metadata.map((metadata) => new Metadata(metadata));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): FetchMetadataDirectlySuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as FetchMetadataDirectlySuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetTokensFromFaucetBody {}

/**
 * @category API Requests / Responses
 */
export type iGetTokensFromFaucetSuccessResponse = DeliverTxResponse;

/**
 * @category API Requests / Responses
 */
export class GetTokensFromFaucetSuccessResponse
  extends CustomTypeClass<GetTokensFromFaucetSuccessResponse>
  implements iGetTokensFromFaucetSuccessResponse
{
  readonly height: number;
  /** The position of the transaction within the block. This is a 0-based index. */
  readonly txIndex: number;
  /** Error code. The transaction suceeded iff code is 0. */
  readonly code: number;
  readonly transactionHash: string;
  readonly events: readonly Event[];
  /**
   * A string-based log document.
   *
   * This currently seems to merge attributes of multiple events into one event per type
   * (https://github.com/tendermint/tendermint/issues/9595). You might want to use the `events`
   * field instead.
   */
  readonly rawLog?: string;
  /**
   * The message responses of the [TxMsgData](https://github.com/cosmos/cosmos-sdk/blob/v0.46.3/proto/cosmos/base/abci/v1beta1/abci.proto#L128-L140)
   * as `Any`s.
   * This field is an empty list for chains running Cosmos SDK < 0.46.
   */
  readonly msgResponses: Array<{
    readonly typeUrl: string;
    readonly value: Uint8Array;
  }>;
  readonly gasUsed: bigint;
  readonly gasWanted: bigint;

  constructor(data: iGetTokensFromFaucetSuccessResponse) {
    super();
    this.height = data.height;
    this.txIndex = data.txIndex;
    this.code = data.code;
    this.transactionHash = data.transactionHash;
    this.events = data.events;
    this.rawLog = data.rawLog;
    this.msgResponses = data.msgResponses;
    this.gasUsed = data.gasUsed;
    this.gasWanted = data.gasWanted;
  }
}

/**
 * @category API Requests / Responses
 */
export interface SendClaimAlertsBody {
  /** The claim alerts to send to users. */
  claimAlerts: {
    /** The collection ID to associate with the claim alert. If specified, you (the sender) must be the manager of the collection. This is typically used
     * for sending claim codes. Set to 0 for unspecified. */
    collectionId: NumberType;
    /** The message to send to the user. */
    message?: string;
    /** The addresses to send the claim alert to. */
    cosmosAddresses: CosmosAddress[];
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iSendClaimAlertsSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class SendClaimAlertsSuccessResponse extends EmptyResponseClass {}

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
 * Generic route to verify any asset ownership requirements.
 *
 * @category API Requests / Responses
 */
export interface GenericVerifyAssetsBody {
  /**
   * The address to check
   */
  cosmosAddress: CosmosAddress;

  /**
   * The asset requirements to verify.
   */
  assetOwnershipRequirements: AssetConditionGroup<NumberType>;
}

/**
 * @category API Requests / Responses
 */
export interface iGenericVerifyAssetsSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class GenericVerifyAssetsSuccessResponse extends EmptyResponseClass {}

/**
 * Generic route to verify any SIWBB request. Does not sign you in with the API. Used for custom SIWBB implementations.
 *
 * @category API Requests / Responses
 */
export interface GenericBlockinVerifyBody extends VerifySignInBody {
  /**
   * Additional options for verifying the challenge.
   */
  options?: VerifyChallengeOptions;

  /**
   * Additional secrets to verify in the challenge.
   */
  secretsPresentations?: SecretsProof<NumberType>[];
}

/**
 * @inheritDoc iVerifySignInSuccessResponse
 * @category API Requests / Responses
 */
export interface iGenericBlockinVerifySuccessResponse extends iVerifySignInSuccessResponse {}

/**
 * @inheritDoc iVerifySignInSuccessResponse
 * @category API Requests / Responses
 */
export class GenericBlockinVerifySuccessResponse extends VerifySignInSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface CreateSecretBody {
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
export interface iCreateSecretSuccessResponse {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;
}

/**
 * @category API Requests / Responses
 */
export class CreateSecretSuccessResponse extends CustomTypeClass<CreateSecretSuccessResponse> implements iCreateSecretSuccessResponse {
  secretId: string;

  constructor(data: iCreateSecretSuccessResponse) {
    super();
    this.secretId = data.secretId;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetSecretBody {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSecretSuccessResponse<T extends NumberType> extends iSecretDoc<T> {}

/**
 * @category API Requests / Responses
 */
export class GetSecretSuccessResponse<T extends NumberType> extends SecretDoc<T> {}

/**
 * @category API Requests / Responses
 */
export interface DeleteSecretBody {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteSecretSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteSecretSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface UpdateSecretBody {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;

  /** Holders can use the secret to prove something about themselves. This is a list of holders that have added this secret to their profile. */
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
export interface iUpdateSecretSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdateSecretSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface CreateSIWBBRequestBody {
  /** The name of the SIWBB request for display purposes. */
  name: string;
  /** The description of the SIWBB request for display purposes. */
  description: string;
  /** The image of the SIWBB request for display purposes. */
  image: string;

  /** The original message that was signed. */
  message: BlockinMessage;
  /** The signature of the message */
  signature: string;
  /** The public key of the signer (if needed). Only certain chains require this. */
  publicKey?: string;

  /**
   * If required, you can additionally add proof of secrets to the authentication flow.
   * This proves sensitive information (e.g. GPAs, SAT scores, etc.) without revealing the information itself.
   */
  secretsPresentations?: iSecretsProof<NumberType>[];

  /** Client ID for the SIWBB request. */
  clientId: string;

  /** If defined, we will store the current sign-in details for these web2 connections along with the code */
  otherSignIns?: ('discord' | 'twitter' | 'google' | 'github')[];

  /** Redirect URI if redirected after successful sign-in. */
  redirectUri?: string;

  /** State to be passed back to the redirect URI. */
  state?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iCreateSIWBBRequestSuccessResponse {
  /** Secret code which can be exchanged for the SIWBB request details. */
  code: string;
}

/**
 * @category API Requests / Responses
 */
export class CreateSIWBBRequestSuccessResponse
  extends CustomTypeClass<CreateSIWBBRequestSuccessResponse>
  implements iCreateSIWBBRequestSuccessResponse
{
  code: string;

  constructor(data: iCreateSIWBBRequestSuccessResponse) {
    super();
    this.code = data.code;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetAndVerifySIWBBRequestsForDeveloperAppBody {
  /** The bookmark for pagination. */
  bookmark?: string;
  /** The client ID to fetch for */
  clientId: string;

  //TODO: Add client secret to allow non-creator to fetch it?
}

/**
 * @category API Requests / Responses
 */
export interface iGetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<T extends NumberType> {
  siwbbRequests: iBlockinChallenge<T>[];

  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<T>>
  implements iGetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<T>
{
  siwbbRequests: BlockinChallenge<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<T>) {
    super();
    this.siwbbRequests = data.siwbbRequests.map((SIWBBRequest) => new BlockinChallenge<T>(SIWBBRequest));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetAndVerifySIWBBRequestsForDeveloperAppSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetAndVerifySIWBBRequestBody {
  /** The SIWBB request. */
  code: string;
  /** We attempt to verify the current status with each request. You can provide additional options for verification here. */
  options?: VerifyChallengeOptions;

  /** Client secret for the SIWBB request. */
  clientSecret?: string;
  /** Client ID for the SIWBB request. */
  clientId?: string;
  /** The redirect URI for the SIWBB request. Only required if the code was created with a redirect URI. */
  redirectUri?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetAndVerifySIWBBRequestSuccessResponse<T extends NumberType> extends BaseNumberTypeClass<GetAndVerifySIWBBRequestSuccessResponse<T>> {
  blockin: BlockinChallenge<NumberType>;

  constructor(data: iGetAndVerifySIWBBRequestSuccessResponse<T>) {
    super();
    this.blockin = new BlockinChallenge(data.blockin);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetAndVerifySIWBBRequestSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetAndVerifySIWBBRequestSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetAndVerifySIWBBRequestSuccessResponse<T extends NumberType> {
  /**
   * Class that contains all details about the SIWBB request.
   */
  blockin: iBlockinChallenge<T>;
}

/**
 * @category API Requests / Responses
 */
export interface DeleteSIWBBRequestBody {
  code: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteSIWBBRequestSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteSIWBBRequestSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface GenerateAppleWalletPassBody {
  /** The signature of the message. */
  code: string;
}
/**
 * @category API Requests / Responses
 */
export interface iGenerateAppleWalletPassSuccessResponse {
  type: string;
  data: string;
}
/**
 * @category API Requests / Responses
 */
export class GenerateAppleWalletPassSuccessResponse
  extends CustomTypeClass<GenerateAppleWalletPassSuccessResponse>
  implements iGenerateAppleWalletPassSuccessResponse
{
  type: string;
  data: string;

  constructor(data: iGenerateAppleWalletPassSuccessResponse) {
    super();
    this.type = data.type;
    this.data = data.data;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetClaimAlertsForCollectionBody {
  /** The collection ID to get claim alerts for. */
  collectionId: NumberType;
  /** The pagination bookmark obtained from the previous request. Leave blank for the first request. */
  bookmark: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimAlertsForCollectionSuccessResponse<T extends NumberType> {
  claimAlerts: iClaimAlertDoc<T>[];
  pagination: PaginationInfo;
}

export class GetClaimAlertsForCollectionSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimAlertsForCollectionSuccessResponse<T>>
  implements iGetClaimAlertsForCollectionSuccessResponse<T>
{
  claimAlerts: ClaimAlertDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetClaimAlertsForCollectionSuccessResponse<T>) {
    super();
    this.claimAlerts = data.claimAlerts.map((claimAlert) => new ClaimAlertDoc(claimAlert));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetClaimAlertsForCollectionSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetClaimAlertsForCollectionSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetExternalCallBody {
  uri: string;
  key: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetExternalCallSuccessResponse {
  key: string;
  timestamp: number;
}

/**
 * @category API Requests / Responses
 */
export class GetExternalCallSuccessResponse extends CustomTypeClass<GetExternalCallSuccessResponse> implements iGetExternalCallSuccessResponse {
  key: string;
  timestamp: number;

  constructor(data: iGetExternalCallSuccessResponse) {
    super();
    this.key = data.key;
    this.timestamp = data.timestamp;
  }
}

/**
 * @category API Requests / Responses
 */
export interface CreateDeveloperAppBody {
  /** Metadata for the secret for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  name: string;
  /** Description of the app. */
  description: string;
  /** Image for the app. */
  image: string;
  /** Redirect URIs for the app. */
  redirectUris: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iCreateDeveloperAppSuccessResponse {
  /** Client ID for the app. */
  clientId: string;
  /** Client secret for the app. */
  clientSecret: string;
}

/**
 * @category API Requests / Responses
 */
export class CreateDeveloperAppSuccessResponse
  extends CustomTypeClass<CreateDeveloperAppSuccessResponse>
  implements iCreateDeveloperAppSuccessResponse
{
  clientId: string;
  clientSecret: string;

  constructor(data: iCreateDeveloperAppSuccessResponse) {
    super();
    this.clientId = data.clientId;
    this.clientSecret = data.clientSecret;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetActiveAuthorizationsBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetActiveAuthorizationsSuccessResponse {
  authorizations: iAccessTokenDoc[];
  developerApps: iDeveloperAppDoc[];
}

/**
 * @category API Requests / Responses
 */
export class GetActiveAuthorizationsSuccessResponse
  extends CustomTypeClass<GetActiveAuthorizationsSuccessResponse>
  implements iGetActiveAuthorizationsSuccessResponse
{
  authorizations: AccessTokenDoc[];
  developerApps: DeveloperAppDoc[];

  constructor(data: iGetActiveAuthorizationsSuccessResponse) {
    super();
    this.authorizations = data.authorizations.map((authorization) => new AccessTokenDoc(authorization));
    this.developerApps = data.developerApps.map((developerApp) => new DeveloperAppDoc(developerApp));
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetDeveloperAppBody {
  /** If you want to get a specific app, specify the client ID here (will not return the client secret). */
  clientId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetDeveloperAppSuccessResponse {
  developerApps: iDeveloperAppDoc[];
}

/**
 * @category API Requests / Responses
 */
export class GetDeveloperAppSuccessResponse extends CustomTypeClass<GetDeveloperAppSuccessResponse> implements iGetDeveloperAppSuccessResponse {
  developerApps: DeveloperAppDoc[];

  constructor(data: iGetDeveloperAppSuccessResponse) {
    super();
    this.developerApps = data.developerApps.map((developerApp) => new DeveloperAppDoc(developerApp));
  }
}

/**
 * @category API Requests / Responses
 */
export interface DeleteDeveloperAppBody {
  /** The client ID of the app to delete. */
  clientId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteDeveloperAppSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteDeveloperAppSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface UpdateDeveloperAppBody {
  /** Client ID for the app to update. */
  clientId: string;
  /** Metadata for for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  name?: string;
  /** Description of the app. */
  description?: string;
  /** Image for the app. */
  image?: string;
  /** Redirect URIs for the app. */
  redirectUris?: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateDeveloperAppSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdateDeveloperAppSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface CreatePluginBody {
  /** The unique plugin ID */
  pluginId: string;

  /** Preset type for how the plugin state is to be maintained. */
  stateFunctionPreset: PluginPresetType;

  /** Whether it makes sense for multiple of this plugin to be allowed */
  duplicatesAllowed: boolean;

  /** This means that the plugin can be used w/o any session cookies or authentication. */
  requiresSessions: boolean;

  /** Reuse for non-indexed? */
  reuseForNonIndexed: boolean;

  /** This is a flag for being compatible with auto-triggered claims, meaning no user interaction is needed. */
  requiresUserInputs: boolean;

  metadata: {
    /** The name of the plugin */
    name: string;
    /** Description of the plugin */
    description: string;
    /** The image of the plugin */
    image: string;
    /** Documentation for the plugin */
    documentation?: string;
    /** Source code for the plugin */
    sourceCode?: string;
    /** Support link for the plugin */
    supportLink?: string;
    /** The creator of the plugin */
    createdBy: CosmosAddress;
  };

  userInputsSchema: Array<JsonBodyInputSchema>;
  publicParamsSchema: Array<JsonBodyInputSchema | { key: string; label: string; type: 'ownershipRequirements' }>;
  privateParamsSchema: Array<JsonBodyInputSchema | { key: string; label: string; type: 'ownershipRequirements' }>;

  /** The verification URL */
  verificationCall?: {
    uri: string;
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
    hardcodedInputs: Array<JsonBodyInputWithValue>;

    passAddress: boolean;
    passDiscord: boolean;
    // passEmail: boolean;
    passTwitter: boolean;
    passGoogle: boolean;
    passGithub: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export interface iCreatePluginSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class CreatePluginSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface GetPluginBody {
  createdPluginsOnly?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginSuccessResponse<T extends NumberType> {
  plugins: iPluginDoc<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetPluginSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetPluginSuccessResponse<T>>
  implements iGetPluginSuccessResponse<T>
{
  plugins: PluginDoc<T>[];

  constructor(data: iGetPluginSuccessResponse<T>) {
    super();
    this.plugins = data.plugins.map((developerApp) => new PluginDoc(developerApp));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetPluginSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetPluginSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface DeleteClaimBody {
  /** The claim ID to delete. */
  claimIds: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteClaimSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteClaimSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface UpdateClaimBody<T extends NumberType> {
  claims: Omit<iClaimDetails<T>, 'seedCode'>[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateClaimSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdateClaimSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface CreateClaimBody<T extends NumberType> {
  claims: (iClaimDetails<T> & { listId?: string; collectionId?: T; cid?: string })[];
}

/**
 * @category API Requests / Responses
 */
export interface iCreateClaimSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class CreateClaimSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface OauthAuthorizeBody {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iOauthAuthorizeSuccessResponse {
  code: string;
}

/**
 * @category API Requests / Responses
 */
export class OauthAuthorizeSuccessResponse extends CustomTypeClass<OauthAuthorizeSuccessResponse> implements iOauthAuthorizeSuccessResponse {
  code: string;

  constructor(data: iOauthAuthorizeSuccessResponse) {
    super();
    this.code = data.code;
  }
}

/**
 * @category API Requests / Responses
 */
export interface OauthTokenBody {
  grant_type: string;
  client_id: string;
  client_secret: string;
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iOauthTokenSuccessResponse extends iAccessTokenDoc {}

/**
 * @category API Requests / Responses
 */
export class OauthTokenSuccessResponse extends AccessTokenDoc {}

/**
 *
 * @category API Requests / Responses
 */
export interface OauthRevokeBody {
  token: string;
}

/**
 * @category API Requests / Responses
 */
export interface iOauthRevokeSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class OauthRevokeSuccessResponse extends EmptyResponseClass {}
