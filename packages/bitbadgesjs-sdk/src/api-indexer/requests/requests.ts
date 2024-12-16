import type { iBitBadgesAddressList } from '@/api-indexer/BitBadgesAddressList.js';
import { BitBadgesAddressList } from '@/api-indexer/BitBadgesAddressList.js';
import type { iBitBadgesCollection } from '@/api-indexer/BitBadgesCollection.js';
import { BitBadgesCollection } from '@/api-indexer/BitBadgesCollection.js';
import type { iBitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo.js';
import { BitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo.js';
import type { PaginationInfo } from '@/api-indexer/base.js';
import { EmptyResponseClass } from '@/api-indexer/base.js';
import { ClaimActivityDoc, ClaimAlertDoc, TransferActivityDoc } from '@/api-indexer/docs/activity.js';
import {
  AccessTokenDoc,
  AttestationDoc,
  DeveloperAppDoc,
  DynamicDataDoc,
  GroupDoc,
  MapWithValues,
  PluginDoc,
  StatusDoc
} from '@/api-indexer/docs/docs.js';
import {
  ClaimReward,
  DynamicDataHandlerType,
  iClaimActivityDoc,
  iDynamicDataDoc,
  iEvent,
  iGroupDoc,
  type BitBadgesAddress,
  type ClaimIntegrationPluginCustomBodyType,
  type ClaimIntegrationPluginType,
  type IntegrationPluginDetails,
  type JsonBodyInputSchema,
  type JsonBodyInputWithValue,
  type NativeAddress,
  type OAuthScopeDetails,
  type PluginPresetType,
  type SiwbbMessage,
  type UNIXMilliTimestamp,
  type iAccessTokenDoc,
  type iClaimAlertDoc,
  type iClaimDetails,
  type iClaimReward,
  type iCustomLink,
  type iCustomListPage,
  type iCustomPage,
  type iDeveloperAppDoc,
  type iMapWithValues,
  type iPluginDoc,
  type iSocialConnections,
  type iStatusDoc,
  type iTransferActivityDoc
} from '@/api-indexer/docs/interfaces.js';
import type { iBadgeMetadataDetails, iCollectionMetadataDetails } from '@/api-indexer/metadata/badgeMetadata.js';
import type { iMetadata } from '@/api-indexer/metadata/metadata.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { SupportedChain } from '@/common/types.js';
import { ClaimDetails, iChallengeDetails, iChallengeInfoDetails } from '@/core/approvals.js';
import type { iBatchBadgeDetails } from '@/core/batch-utils.js';
import { SiwbbChallenge, VerifySIWBBOptions, iSiwbbChallenge } from '@/core/blockin.js';
import { AttestationsProof } from '@/core/secrets.js';
import type { iOffChainBalancesMap } from '@/core/transfers.js';
import { UintRangeArray } from '@/core/uintRanges.js';
import type { iAttestationsProof, iPredeterminedBalances, iUintRange } from '@/interfaces/index.js';
import { BroadcastPostBody } from '@/node-rest-api/index.js';
import { AndGroup, OrGroup, type AssetConditionGroup, type ChallengeParams, type VerifyChallengeOptions } from 'blockin';
import { OwnershipRequirements, SiwbbAndGroup, SiwbbAssetConditionGroup, SiwbbChallengeParams, SiwbbOrGroup } from './blockin.js';

/**
 * The response after successfully broadcasting a transaction.
 * Success or failure refer to the execution result.
 */
export interface DeliverTxResponse {
  readonly height: number;
  /** The position of the transaction within the block. This is a 0-based index. */
  readonly txIndex: number;
  /** Error code. The transaction suceeded if and only if code is 0. */
  readonly code: number;
  readonly transactionHash: string;
  readonly events: readonly CosmosEvent[];
  /**
   * A string-based log document.
   *
   * This currently seems to merge attributes of multiple events into one event per type
   * (https://github.com/tendermint/tendermint/issues/9595). You might want to use the `events`
   * field instead.
   *
   * @deprecated This field is not filled anymore in Cosmos SDK 0.50+ (https://github.com/cosmos/cosmos-sdk/pull/15845).
   * Please consider using `events` instead.
   */
  readonly rawLog?: string;
  /** @deprecated Use `msgResponses` instead. */
  readonly data?: readonly {
    msgType: string;
    data: Uint8Array;
  }[];
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
}

/**
 * An event attribute.
 *
 * This is the same attribute type as tendermint34.Attribute and tendermint35.EventAttribute
 * but `key` and `value` are unified to strings. The conversion
 * from bytes to string in the Tendermint 0.34 case should be done by performing
 * [lossy] UTF-8 decoding.
 *
 * [lossy]: https://doc.rust-lang.org/stable/std/string/struct.String.html#method.from_utf8_lossy
 *
 *
 *
 *  @category API Requests / Responses
 */
export interface Attribute {
  readonly key: string;
  readonly value: string;
}

/**
 * The same event type as tendermint34.Event and tendermint35.Event
 * but attribute keys and values are unified to strings. The conversion
 * from bytes to string in the Tendermint 0.34 case should be done by performing
 * [lossy] UTF-8 decoding.
 *
 * [lossy]: https://doc.rust-lang.org/stable/std/string/struct.String.html#method.from_utf8_lossy
 *
 * @category API Requests / Responses
 */
export interface CosmosEvent {
  readonly type: string;
  readonly attributes: readonly Attribute[];
}

/**
 * @category API Requests / Responses
 */
export interface GetStatusPayload {
  /** If true, we will check if the indexer is out of sync with the blockchain. */
  withOutOfSyncCheck?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetStatusSuccessResponse<T extends NumberType> {
  /**
   * Status details about the indexer / blockchain.
   */
  status: iStatusDoc<T>;

  /**
   * If true, we are out of sync with the blockchain.
   * If undefined, we did not check for out of sync.
   */
  outOfSync?: boolean;
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
  outOfSync?: boolean;

  constructor(data: iGetStatusSuccessResponse<T>) {
    super();
    this.status = new StatusDoc(data.status);
    this.outOfSync = data.outOfSync;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetStatusSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetStatusSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetSearchPayload {
  /** If true, we will skip all collection queries. */
  noCollections?: boolean;
  /** If true, we will skip all account queries. */
  noAccounts?: boolean;
  /** If true, we will skip all address list queries. */
  noAddressLists?: boolean;
  /** If true, we will skip all badge queries. */
  noBadges?: boolean;
  /** If true, we will skip all map queries. */
  noMaps?: boolean;
  /** If true, we will skip all group queries. */
  noGroups?: boolean;
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
  maps: iMapWithValues<T>[];
  groups?: iGroupDoc<T>[];
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
  maps: MapWithValues<T>[];
  groups?: GroupDoc<T>[];

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
    this.maps = data.maps.map((map) => new MapWithValues(map));
    this.groups = data.groups?.map((group) => new GroupDoc(group));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetSearchSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetSearchSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetClaimsPayload {
  /** The claim IDs to fetch. */
  claimIds?: string[];
  /** If the address list is private and viewable with the link only, you must also specify the address list ID to prove knowledge of the link. */
  listId?: string;
  /** If true, we will return all claims that were created by the signed in address. */
  siwbbClaimsOnly?: boolean;
  /** Bookmark to start from. Obtained from previours request. Leave blank to start from the beginning. Only applicable when no additional criteria is specified. */
  bookmark?: string;
  /** Fetch private parameters for the claim. Only applicable if you are the creator / manager of the claim. */
  fetchPrivateParams?: boolean;
}

/**
 *
 * @category API Requests / Responses
 */
export interface iGetClaimsSuccessResponse<T extends NumberType> {
  claims: iClaimDetails<T>[];
  bookmark?: string;
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
  bookmark?: string;

  constructor(data: iGetClaimsSuccessResponse<T>) {
    super();
    this.claims = data.claims.map((claim) => new ClaimDetails(claim));
    this.bookmark = data.bookmark;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): GetClaimsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetClaimsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface CompleteClaimPayload {
  /** Needs to be provided so we check that no plugins or claims have been updated since the claim was fetched. */
  _expectedVersion: number;

  /** If provided, we will only complete the claim for the specific plugins w/ the provided instance IDs. Must be compatible with the satisfaction logic. */
  _specificInstanceIds?: string[];

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
export interface GetClaimAttemptStatusPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimAttemptStatusSuccessResponse {
  success: boolean;
  error: string;
  code?: string;
  bitbadgesAddress: string;
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
  bitbadgesAddress: string;

  constructor(data: iGetClaimAttemptStatusSuccessResponse) {
    super();
    this.success = data.success;
    this.error = data.error;

    this.code = data.code;
    this.bitbadgesAddress = data.bitbadgesAddress;
  }
}

/**
 * @category API Requests / Responses
 */
export interface SimulateClaimPayload {
  /** Will fail if the claim version is not the expected version.*/
  _expectedVersion: number;

  /** If provided, we will only simulate the claim for the specific plugins w/ the provided instance IDs. */
  _specificInstanceIds?: string[];

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
export interface GetReservedClaimCodesPayload {}

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
export interface UpdateAccountInfoPayload {
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
    attestations: iCustomListPage[];
  };

  /**
   * The watchlist of badges / lists
   */
  watchlists?: {
    badges: iCustomPage<NumberType>[];
    lists: iCustomListPage[];
    attestations: iCustomListPage[];
  };

  /**
   * The profile picture URL.
   */
  profilePicUrl?: string;

  /**
   * The banner image URL.
   */
  bannerImage?: string;

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
    discord?: { scopes: OAuthScopeDetails[]; username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    google?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    twitter?: { scopes: OAuthScopeDetails[]; username: string; id: string } | undefined;
    addresses?: {
      address: NativeAddress;
      scopes: OAuthScopeDetails[];
    }[];
    passwords?: {
      passwordHash: string;
      salt: string;
      password?: string;
      scopes: OAuthScopeDetails[];
    }[];
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
export interface AddBalancesToOffChainStoragePayload {
  /**
   * A map of BitBadges addresses or list IDs -> Balance<NumberType>[].
   * This will be set first. If undefined, we leave the existing balances map as is.
   * For genesis, this must be set (even if empty {}), so we create the unique URL.
   *
   * If defined, this will overwrite for the entire collection. You must provide ALL balances for the collection.
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
    rewards?: iClaimReward<NumberType>[];
    estimatedCost?: string;
    estimatedTime?: string;
    showInSearchResults?: boolean;
    categories?: string[];
    balancesToSet?: iPredeterminedBalances<NumberType>;
    approach?: string;
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
export interface AddToIpfsPayload {
  /**
   * The stuff to add to IPFS
   */
  contents?: (iBadgeMetadataDetails<NumberType> | iMetadata<NumberType> | iCollectionMetadataDetails<NumberType> | iChallengeDetails<NumberType>)[];

  method: 'ipfs' | 'centralized';
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
    uri?: string;
  }[];
}

/**
 * @inheritDoc iAddToIpfsSuccessResponse
 * @category API Requests / Responses
 */
export class AddToIpfsSuccessResponse extends CustomTypeClass<AddToIpfsSuccessResponse> implements iAddToIpfsSuccessResponse {
  results: {
    cid: string;
    uri?: string;
  }[];

  constructor(data: iAddToIpfsSuccessResponse) {
    super();

    this.results = data.results;
  }
}

/**
 * @category API Requests / Responses
 */
export interface AddApprovalDetailsToOffChainStoragePayload {
  approvalDetails: {
    /**
     * The name of the approval.
     */
    name: string;

    /**
     * The description of the approval.
     */
    description: string;

    /**
     * The image of the approval.
     */
    image: string;

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
export interface GetSignInChallengePayload {
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
  message: SiwbbMessage;
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
  params: SiwbbChallengeParams<T>;
  message: SiwbbMessage;

  constructor(data: iGetSignInChallengeSuccessResponse<T>) {
    super();
    this.nonce = data.nonce;
    this.params = new SiwbbChallengeParams(data.params);
    this.message = data.message;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetSignInChallengeSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetSignInChallengeSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface VerifySignInPayload {
  /**
   * The original message that was signed.
   */
  message: SiwbbMessage;

  /**
   * The signature of the message
   */
  signature: string;

  /**
   * The address that signed the message on behalf of another address.
   */
  altSigner?: NativeAddress;

  /**
   * Selected social to attempt to sign in with.
   */
  socialSignIn?: string;

  /**
   * The password to sign in with.
   */
  password?: string;

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
export interface CheckSignInStatusPayload {
  validateAccessTokens?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iCheckSignInStatusSuccessResponse {
  /**
   * Indicates whether the user is signed in.
   */
  signedIn: boolean;

  /**
   * Approved scopes
   */
  scopes: OAuthScopeDetails[];

  /**
   * The message that was signed.
   */
  message: SiwbbMessage;

  /**
   * The email of the session.
   */
  email?: string | undefined;

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

  /**
   * Signed in with Twitch?
   */
  twitch?: {
    id: string;
    username: string;
  };

  /**
   * Signed in with Strava?
   */
  strava?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Reddit?
   */
  reddit?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Telegram?
   */
  telegram?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Farcaster?
   */
  farcaster?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Slack?
   */
  slack?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Youtube?
   */
  youtube?: {
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
  message: SiwbbMessage;
  scopes: OAuthScopeDetails[];
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
  twitch?: { id: string; username: string } | undefined;
  strava?: { username: string; id: string } | undefined;
  youtube?: { id: string; username: string } | undefined;
  reddit?: { username: string; id: string } | undefined;
  telegram?: { username: string; id: string } | undefined;
  farcaster?: { username: string; id: string } | undefined;
  slack?: { username: string; id: string } | undefined;
  email?: string | undefined;

  constructor(data: iCheckSignInStatusSuccessResponse) {
    super();
    this.signedIn = data.signedIn;
    this.message = data.message;
    this.discord = data.discord;
    this.twitter = data.twitter;
    this.scopes = data.scopes;
    this.github = data.github;
    this.google = data.google;
    this.twitch = data.twitch;
    this.strava = data.strava;
    this.youtube = data.youtube;
    this.reddit = data.reddit;
    this.telegram = data.telegram;
    this.farcaster = data.farcaster;
    this.slack = data.slack;
    this.email = data.email;
  }
}

/**
 * @category API Requests / Responses
 */
export interface SignOutPayload {
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
  /** Sign out of Twitch. */
  signOutTwitch?: boolean;
  /** Sign out of Strava. */
  signOutStrava?: boolean;
  /** Sign out of Youtube */
  signOutYoutube?: boolean;
  /** Sign out of Reddit */
  signOutReddit?: boolean;
  /** Sign out of Telegram */
  signOutTelegram?: boolean;
  /** Sign out of Farcaster */
  signOutFarcaster?: boolean;
  /** Sign out of Slack */
  signOutSlack?: boolean;
  /** Sign out of email */
  signOutEmail?: boolean;
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
export interface GetBrowsePayload {
  type: 'collections' | 'badges' | 'addressLists' | 'maps' | 'attestations' | 'claims' | 'activity' | 'groups' | 'claimActivity';
  filters?: {
    category?: string;
    sortBy?: string;
    timeFrame?: string;
    searchTerm?: string;
  };
}

/**
 * @category API Requests / Responses
 */
interface ClaimAttempt {
  success: boolean;
  attemptedAt: number;
  claimId: string;
  bitbadgesAddress: string;
  claimAttemptId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetBrowseSuccessResponse<T extends NumberType> {
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
  groups?: { [category: string]: iGroupDoc<T>[] };
  maps: { [category: string]: iMapWithValues<T>[] };
  claims?: { [category: string]: iClaimDetails<T>[] };
  claimActivity?: iClaimActivityDoc<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetBrowseSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBrowseSuccessResponse<T>>
  implements iGetBrowseSuccessResponse<T>
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
  groups?: { [category: string]: GroupDoc<T>[] };
  maps: { [category: string]: MapWithValues<T>[] };
  claims?: { [category: string]: ClaimDetails<T>[] };
  claimActivity?: ClaimActivityDoc<T>[];

  constructor(data: iGetBrowseSuccessResponse<T>) {
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
    this.groups = Object.keys(data.groups ?? {}).reduce(
      (acc, category) => {
        acc[category] = (data.groups ?? {})[category].map((group) => new GroupDoc(group));
        return acc;
      },
      {} as { [category: string]: GroupDoc<T>[] }
    );
    this.maps = Object.keys(data.maps).reduce(
      (acc, category) => {
        acc[category] = data.maps[category].map((map) => new MapWithValues(map));
        return acc;
      },
      {} as { [category: string]: MapWithValues<T>[] }
    );
    this.claims = data.claims
      ? Object.keys(data.claims).reduce(
          (acc, category) => {
            if (data.claims) {
              acc[category] = data.claims[category].map((claim) => new ClaimDetails(claim));
            }
            return acc;
          },
          {} as { [category: string]: ClaimDetails<T>[] }
        )
      : undefined;
    this.claimActivity = data.claimActivity?.map((claimActivity) => new ClaimActivityDoc(claimActivity));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetBrowseSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetBrowseSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export type BroadcastTxPayload = BroadcastPostBody;

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
export type SimulateTxPayload = BroadcastPostBody;

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
export interface FetchMetadataDirectlyPayload {
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
export interface GetTokensFromFaucetPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetTokensFromFaucetSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class GetTokensFromFaucetSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface SendClaimAlertsPayload {
  /** The claim alerts to send to users. */
  claimAlerts: {
    /** The collection ID to associate with the claim alert. If specified, you (the sender) must be the manager of the collection. This is typically used
     * for sending claim codes. Set to 0 for unspecified. */
    collectionId: NumberType;
    /** The message to send to the user. */
    message?: string;
    /** The addresses to send the claim alert to. */
    bitbadgesAddresses: BitBadgesAddress[];
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
  address: BitBadgesAddress;
}

/**
 * Generic route to verify any asset ownership requirements.
 *
 * @category API Requests / Responses
 */
export interface GenericVerifyAssetsPayload {
  /**
   * The address to check
   */
  address: NativeAddress;

  /**
   * The asset requirements to verify.
   */
  assetOwnershipRequirements: AssetConditionGroup<NumberType>;
}

/**
 * @category API Requests / Responses
 */
export interface iGenericVerifyAssetsSuccessResponse {
  /**
   * Success response of the verification check. Use this to determine if the verification was successful.
   *
   * Status code will be 200 both if the user meets or does not meet requirements, so you must check this success field to determine the result.
   */
  success: boolean;

  errorMessage?: string;
}

/**
 * @category API Requests / Responses
 */
export class GenericVerifyAssetsSuccessResponse
  extends CustomTypeClass<GenericVerifyAssetsSuccessResponse>
  implements iGenericVerifyAssetsSuccessResponse
{
  success: boolean;
  errorMessage?: string;

  constructor(data: iGenericVerifyAssetsSuccessResponse) {
    super();
    this.success = data.success;
    this.errorMessage = data.errorMessage;
  }
}

/**
 * Generic route to verify any SIWBB request. Does not sign you in with the API. Used for custom SIWBB implementations.
 *
 * @category API Requests / Responses
 */
export interface GenericBlockinVerifyPayload extends VerifySignInPayload {
  /**
   * Additional options for verifying the challenge.
   */
  options?: VerifyChallengeOptions;

  /**
   * Additional attestations to verify in the challenge.
   */
  attestationsPresentations?: iAttestationsProof<NumberType>[];
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
export interface CreateAttestationPayload
  extends Pick<
    AttestationDoc<NumberType>,
    | 'originalProvider'
    | 'proofOfIssuance'
    | 'messageFormat'
    | 'scheme'
    | 'messages'
    | 'dataIntegrityProof'
    | 'name'
    | 'image'
    | 'description'
    | 'publicVisibility'
  > {
  /** Blockchain anchors to add to the attestation. These are on-chain transactions that can be used to prove stuff about the attestation, like
   * existence at a certain point in time or to maintain data integrity. */
  anchors?: {
    txHash?: string;
    message?: string;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iCreateAttestationSuccessResponse {
  /** The attestation invite code. This is the code that is given to the user to query the attestation. Anyone with the code can query it, so keep this safe and secure. */
  inviteCode: string;

  /** The attestation ID. */
  id: string;
}

/**
 * @category API Requests / Responses
 */
export class CreateAttestationSuccessResponse extends CustomTypeClass<CreateAttestationSuccessResponse> implements iCreateAttestationSuccessResponse {
  inviteCode: string;
  id: string;

  constructor(data: iCreateAttestationSuccessResponse) {
    super();
    this.inviteCode = data.inviteCode;
    this.id = data.id;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetAttestationsPayload {
  /** The attestation key received from the original attestation creation.  */
  inviteCode?: string;

  /** The attestation ID. You can use this if you are the creator or a holder of the attestation. */
  attestationIds?: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetAttestationsSuccessResponse<T extends NumberType> {
  attestations: (AttestationDoc<T> | undefined)[];
}

/**
 * @category API Requests / Responses
 */
export class GetAttestationsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAttestationsSuccessResponse<T>>
  implements iGetAttestationsSuccessResponse<T>
{
  attestations: (AttestationDoc<T> | undefined)[];

  constructor(data: iGetAttestationsSuccessResponse<T>) {
    super();
    this.attestations = data.attestations.map((attestation) => (attestation ? new AttestationDoc<T>(attestation) : undefined));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetAttestationsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetAttestationsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface DeleteAttestationPayload {
  /** The attestation ID. This is the ID that is given to the user to query the attestation. Anyone with the ID can query it, so keep this safe and secure. */
  attestationId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteAttestationSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteAttestationSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface UpdateAttestationPayload {
  /** The attestation ID. If you are the owner, you can simply use the attestationId to update the attestation. One of inviteCode or attestationId must be provided. */
  attestationId?: string;

  /** The key to add oneself as a holder to the attestation. This is given to the holder themselves. One of inviteCode or attestationId must be provided. */
  inviteCode?: string;

  /** Whether or not to rotate the invite code. */
  rotateInviteCode?: boolean;

  /** Holders can use the attestation to prove something about themselves. This is a list of holders that have added this attestation to their profile. */
  holdersToSet?: {
    bitbadgesAddress: BitBadgesAddress;
    delete?: boolean;
  }[];

  /** Blockchain anchors to add to the attestation. These are on-chain transactions that can be used to prove stuff about the attestation, like
   * existence at a certain point in time or to maintain data integrity. */
  anchorsToAdd?: {
    txHash?: string;
    message?: string;
  }[];

  /**
   * Proof of issuance is used for BBS+ signatures (scheme = bbs) only.
   * BBS+ signatures are signed with a BBS+ key pair, but you would often want the issuer to be a native address.
   * The prooofOfIssuance establishes a link saying that "I am the issuer of this attestation signed with BBS+ key pair ___".
   *
   * Fields can be left blank for standard signatures.
   */
  proofOfIssuance?: {
    message: string;
    signer: string;
    signature: string;
    publicKey?: string;
  };

  /** The message format of the messages. */
  messageFormat?: 'plaintext' | 'json';
  /**
   * The scheme of the attestation. BBS+ signatures are supported and can be used where selective disclosure is a requirement.
   * Otherwise, you can simply use your native blockchain's signature scheme.
   */
  scheme?: 'bbs' | 'standard' | 'custom' | string;

  /** The original provider of the attestation. Used for third-party attestation providers. */
  originalProvider?: string;

  /**
   * Thesse are the attestations that are signed.
   * For BBS+ signatures, there can be >1 messages, and the signer can selectively disclose the attestations.
   * For standard signatures, there is only 1 attestationMessage.
   */
  messages?: string[];

  /**
   * This is the signature and accompanying details of the messages. The siganture maintains the integrity of the messages.
   *
   * This should match the expected scheme. For example, if the scheme is BBS+, the signature should be a BBS+ signature and signer should be a BBS+ public key.
   */
  dataIntegrityProof?: {
    signature: string;
    signer: string;
    publicKey?: string;
    derivedProof?: boolean;
  };

  /** Whether or not the attestation is displayable on the user's profile. if true, the attestation can be queried by anyone with the ID. */
  publicVisibility?: boolean;

  /** Metadata for the attestation for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  name?: string;
  /** Metadata for the attestation for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  image?: string;
  /** Metadata for the attestation for display purposes. Note this should not contain anything sensitive. It may be displayed to verifiers. */
  description?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAttestationSuccessResponse {
  inviteCode: string;
}

/**
 * @category API Requests / Responses
 */
export class UpdateAttestationSuccessResponse extends CustomTypeClass<UpdateAttestationSuccessResponse> implements iUpdateAttestationSuccessResponse {
  inviteCode: string;

  constructor(data: iUpdateAttestationSuccessResponse) {
    super();
    this.inviteCode = data.inviteCode;
  }
}

/**
 * @category API Requests / Responses
 */
export interface VerifyAttestationPayload {
  attestation: AttestationDoc<NumberType>;
}

/**
 * @category API Requests / Responses
 */
export interface iVerifyAttestationSuccessResponse {
  success: boolean;
}

/**
 * @category API Requests / Responses
 */
export class VerifyAttestationSuccessResponse extends CustomTypeClass<VerifyAttestationSuccessResponse> implements iVerifyAttestationSuccessResponse {
  success: boolean;

  constructor(data: iVerifyAttestationSuccessResponse) {
    super();
    this.success = data.success;
  }
}

/**
 * @category API Requests / Responses
 */
export interface CreateSIWBBRequestPayload {
  /** The response type for the SIWBB request. */
  response_type: string;
  /** The scopes to request. */
  scopes: OAuthScopeDetails[];

  /** The name of the SIWBB request for display purposes. */
  name?: string;
  /** The description of the SIWBB request for display purposes. */
  description?: string;
  /** The image of the SIWBB request for display purposes. */
  image?: string;

  /**
   * If required, you can additionally add proof of attestations to the authentication flow.
   * This proves sensitive information (e.g. GPAs, SAT scores, etc.) without revealing the information itself.
   */
  attestationsPresentations?: iAttestationsProof<NumberType>[];

  /** Client ID for the SIWBB request. */
  client_id: string;

  /** If defined, we will store the current sign-in details for these web2 connections along with the code */
  otherSignIns?: ('discord' | 'twitter' | 'google' | 'github')[];

  /** Redirect URI if redirected after successful sign-in. */
  redirect_uri?: string;

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
export interface RotateSIWBBRequestPayload {
  /** The code of the SIWBB request to rotate. */
  code: string;
}

/**
 * @category API Requests / Responses
 */
export interface iRotateSIWBBRequestSuccessResponse {
  /** The new code for the SIWBB request. */
  code: string;
}

/**
 * @category API Requests / Responses
 */
export class RotateSIWBBRequestSuccessResponse
  extends CustomTypeClass<RotateSIWBBRequestSuccessResponse>
  implements iRotateSIWBBRequestSuccessResponse
{
  code: string;

  constructor(data: iRotateSIWBBRequestSuccessResponse) {
    super();
    this.code = data.code;
  }
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
export interface GetSIWBBRequestsForDeveloperAppPayload {
  /** The bookmark for pagination. */
  bookmark?: string;
  /** The client ID to fetch for */
  clientId: string;

  //TODO: Add client secret to allow non-creator to fetch it?
}

/**
 * @category API Requests / Responses
 */
export interface iGetSIWBBRequestsForDeveloperAppSuccessResponse<T extends NumberType> {
  siwbbRequests: iSiwbbChallenge<T>[];

  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetSIWBBRequestsForDeveloperAppSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSIWBBRequestsForDeveloperAppSuccessResponse<T>>
  implements iGetSIWBBRequestsForDeveloperAppSuccessResponse<T>
{
  siwbbRequests: SiwbbChallenge<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetSIWBBRequestsForDeveloperAppSuccessResponse<T>) {
    super();
    this.siwbbRequests = data.siwbbRequests.map((SIWBBRequest) => new SiwbbChallenge<T>(SIWBBRequest));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetSIWBBRequestsForDeveloperAppSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetSIWBBRequestsForDeveloperAppSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface ExchangeSIWBBAuthorizationCodePayload {
  /** The SIWBB request. */
  code?: string;
  /** We attempt to verify the current status with each request. You can provide additional options for verification here. */
  options?: VerifySIWBBOptions;

  /** Client secret for the SIWBB request. */
  client_secret?: string;
  /** Client ID for the SIWBB request. */
  client_id?: string;
  /** The redirect URI for the SIWBB request. Only required if the code was created with a redirect URI. */
  redirect_uri?: string;
  /** The grant type for the SIWBB request. */
  grant_type?: 'authorization_code' | 'refresh_token';
  /** The refresh token to use for the SIWBB request. */
  refresh_token?: string;
}

/**
 * @category API Requests / Responses
 */
export class ExchangeSIWBBAuthorizationCodeSuccessResponse<T extends NumberType> extends BaseNumberTypeClass<
  ExchangeSIWBBAuthorizationCodeSuccessResponse<T>
> {
  address: string;
  chain: SupportedChain;
  ownershipRequirements?: SiwbbAssetConditionGroup<T>;
  bitbadgesAddress: BitBadgesAddress;
  verificationResponse?: {
    success: boolean;
    errorMessage?: string;
  };
  attestationsPresentations?: AttestationsProof<T>[];
  otherSignIns?: {
    discord?: { username: string; discriminator?: string | undefined; id: string } | undefined;
    github?: { username: string; id: string } | undefined;
    google?: { username: string; id: string } | undefined;
    twitter?: { username: string; id: string } | undefined;
  };

  access_token: string;
  token_type: string = 'Bearer';
  access_token_expires_at?: UNIXMilliTimestamp<T>;

  refresh_token?: string;
  refresh_token_expires_at?: UNIXMilliTimestamp<T>;

  constructor(data: iExchangeSIWBBAuthorizationCodeSuccessResponse<T>) {
    super();
    this.access_token = data.access_token;
    this.token_type = 'Bearer';
    this.access_token_expires_at = data.access_token_expires_at;
    this.refresh_token = data.refresh_token;
    this.refresh_token_expires_at = data.refresh_token_expires_at ? data.refresh_token_expires_at : undefined;
    this.address = data.address;
    this.chain = data.chain;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.verificationResponse = data.verificationResponse;
    this.attestationsPresentations = data.attestationsPresentations?.map((proof) => new AttestationsProof(proof));
    if (data.ownershipRequirements) {
      if ((data.ownershipRequirements as AndGroup<T>)['$and']) {
        this.ownershipRequirements = new SiwbbAndGroup(data.ownershipRequirements as AndGroup<T>);
      } else if ((data.ownershipRequirements as OrGroup<T>)['$or']) {
        this.ownershipRequirements = new SiwbbOrGroup(data.ownershipRequirements as OrGroup<T>);
      } else {
        this.ownershipRequirements = new OwnershipRequirements(data.ownershipRequirements as OwnershipRequirements<T>);
      }
    }
    this.otherSignIns = data.otherSignIns;
  }

  getNumberFieldNames(): string[] {
    return ['access_token_expires_at', 'refresh_token_expires_at'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ExchangeSIWBBAuthorizationCodeSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ExchangeSIWBBAuthorizationCodeSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iExchangeSIWBBAuthorizationCodeSuccessResponse<T extends NumberType> extends iSiwbbChallenge<T> {
  /**
   * The access token to use for the SIWBB request.
   */
  access_token: string;

  /** The token type */
  token_type: string;

  /** The time at which the access token expires. */
  access_token_expires_at?: UNIXMilliTimestamp<T>;

  /** The refresh token to use for the SIWBB request. */
  refresh_token?: string;

  /** The time at which the refresh token expires. */
  refresh_token_expires_at?: UNIXMilliTimestamp<T>;
}

/**
 * @category API Requests / Responses
 */
export interface DeleteSIWBBRequestPayload {
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
export interface GenerateAppleWalletPassPayload {
  /** The authentication code. */
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
export interface GenerateGoogleWalletPayload {
  /** The authentication code. */
  code: string;
}
/**
 * @category API Requests / Responses
 */
export interface iGenerateGoogleWalletSuccessResponse {
  saveUrl: string;
}
/**
 * @category API Requests / Responses
 */
export class GenerateGoogleWalletSuccessResponse
  extends CustomTypeClass<GenerateGoogleWalletSuccessResponse>
  implements iGenerateGoogleWalletSuccessResponse
{
  saveUrl: string;

  constructor(data: iGenerateGoogleWalletSuccessResponse) {
    super();
    this.saveUrl = data.saveUrl;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetClaimAlertsForCollectionPayload {
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
export interface GetExternalCallPayload {
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
export interface CreateDeveloperAppPayload {
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
export interface GetActiveAuthorizationsPayload {}

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
export interface GetDeveloperAppPayload {
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
export interface DeleteDeveloperAppPayload {
  /** The client ID of the app to delete. */
  clientId: string;
  /**
   * The client secret of the app to delete. This is only needed for temporary developer apps (not linked to a user).
   * For non-temporary developer apps, the client secret is not needed, but you must be signed in and the owner of the app.
   */
  clientSecret?: string;
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
export interface UpdateDeveloperAppPayload {
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
  /** Rotate the client secret? */
  rotateClientSecret?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateDeveloperAppSuccessResponse {
  success: boolean;
  clientSecret?: string;
}

/**
 * @category API Requests / Responses
 */
export class UpdateDeveloperAppSuccessResponse
  extends CustomTypeClass<UpdateDeveloperAppSuccessResponse>
  implements iUpdateDeveloperAppSuccessResponse
{
  success: boolean;
  clientSecret?: string;

  constructor(data: iUpdateDeveloperAppSuccessResponse) {
    super();
    this.success = data.success;
    this.clientSecret = data.clientSecret;
  }
}

/**
 * @category API Requests / Responses
 */
export interface PluginVersionConfigPayload {
  /** Finalized */
  finalized: boolean;

  /** Preset type for how the plugin state is to be maintained. */
  stateFunctionPreset: PluginPresetType;

  /** Whether it makes sense for multiple of this plugin to be allowed */
  duplicatesAllowed: boolean;

  /** Whether the plugin should receive status webhooks */
  receiveStatusWebhook: boolean;

  /** Whether the plugin should skip processing webhooks. We will just auto-treat it as successful. */
  skipProcessingWebhook?: boolean;

  /** Ignore simulations? */
  ignoreSimulations?: boolean;

  /** Reuse for non-indexed? */
  reuseForNonIndexed: boolean;

  /** This is a flag for being compatible with auto-triggered claims, meaning no user interaction is needed. */
  requiresUserInputs: boolean;

  userInputRedirect?: {
    baseUri: string;
  };

  userInputsSchema?: Array<JsonBodyInputSchema>;

  claimCreatorRedirect?: {
    toolUri?: string;
    tutorialUri?: string;
  };

  publicParamsSchema?: Array<JsonBodyInputSchema>;
  privateParamsSchema?: Array<JsonBodyInputSchema>;

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
    passStrava?: boolean;
    passTwitch?: boolean;
    passReddit?: boolean;
    passTelegram?: boolean;
    passFarcaster?: boolean;
    passSlack?: boolean;

    postProcessingJs: string;
  };
}

/**
 * @category API Requests / Responses
 */
export interface CreatePluginPayload {
  /** The unique plugin ID */
  pluginId: string;

  /** Invite code for the plugin */
  inviteCode?: string;

  metadata: {
    /** The name of the plugin */
    name: string;
    /** Description of the plugin */
    description: string;
    /** The image of the plugin */
    image: string;
    /** Documentation for the plugin */
    documentation?: string;
    /** Parent app of the plugin. If blank, treated as its own app / entity. */
    parentApp?: string;
    /** Source code for the plugin */
    sourceCode?: string;
    /** Support link for the plugin */
    supportLink?: string;
    /** The creator of the plugin */
    createdBy: BitBadgesAddress;
  };

  /** To publish in the directory. This will trigger the start of the review process. */
  toPublish: boolean;

  /** The addresses that are allowed to use this plugin. */
  approvedUsers?: NativeAddress[];

  /** The initial version configuration */
  initialVersion: PluginVersionConfigPayload;
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
export interface UpdatePluginPayload {
  /** The unique plugin ID */
  pluginId: string;

  /** Invite code for the plugin */
  inviteCode?: string;

  /** Remove self from approved users? */
  removeSelfFromApprovedUsers?: boolean;

  metadata?: {
    /** The name of the plugin */
    name: string;
    /** Description of the plugin */
    description: string;
    /** The image of the plugin */
    image: string;
    /** Documentation for the plugin */
    documentation?: string;
    /** Parent app of the plugin. If blank, treated as its own app / entity. */
    parentApp?: string;
    /** Source code for the plugin */
    sourceCode?: string;
    /** Support link for the plugin */
    supportLink?: string;
    /** Creator of the plugin */
    createdBy?: string;
  };

  /** To publish in the directory. This will trigger the start of the review process. */
  toPublish?: boolean;

  /** The addresses that are allowed to use this plugin. */
  approvedUsers?: NativeAddress[];

  /** Rotate the plugin secret? */
  rotatePluginSecret?: boolean;

  /** Update an existing version */
  versionUpdates?: {
    /** The version to update or create */
    version: NumberType;
    /** The configuration for this version */
    config: Partial<PluginVersionConfigPayload>;
  }[];

  /** Create a new version */
  versionCreate?: PluginVersionConfigPayload;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdatePluginSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdatePluginSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface DeletePluginPayload {
  /** The unique plugin ID */
  pluginId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeletePluginSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeletePluginSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface GetPluginPayload {
  /** If true, we will fetch all plugins for the authenticated user (with plugin secrets). */
  createdPluginsOnly?: boolean;
  /** If true, we will fetch only the specific plugin with the plugin ID (no secrets). */
  pluginIds?: string[];
  /** Invite code to fetch the plugin with. */
  inviteCode?: string;
  /** Bookmark for pagination of the plugins. */
  bookmark?: string;
  /** Search value */
  searchValue?: string;
}

/**
 * @category API Requests / Responses
 */
export interface CreatePaymentIntentPayload {
  /** The amount in USD to pay */
  amount: number;
  /** Purpose of the payment */
  purpose: 'credits' | 'deposit';
}

/**
 * @category API Requests / Responses
 */
export interface iCreatePaymentIntentSuccessResponse {
  /** The payment intent client secret */
  clientSecret: string;
}

/**
 * @category API Requests / Responses
 */
export class CreatePaymentIntentSuccessResponse
  extends CustomTypeClass<CreatePaymentIntentSuccessResponse>
  implements iCreatePaymentIntentSuccessResponse
{
  clientSecret: string;

  constructor(data: iCreatePaymentIntentSuccessResponse) {
    super();
    this.clientSecret = data.clientSecret;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginSuccessResponse<T extends NumberType> {
  plugins: iPluginDoc<T>[];

  /** Bookmark for pagination of the plugins. Only applicable if fetching the directory. */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetPluginSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetPluginSuccessResponse<T>>
  implements iGetPluginSuccessResponse<T>
{
  plugins: PluginDoc<T>[];
  bookmark?: string;

  constructor(data: iGetPluginSuccessResponse<T>) {
    super();
    this.plugins = data.plugins.map((developerApp) => new PluginDoc(developerApp));
    this.bookmark = data.bookmark;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetPluginSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetPluginSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface DeleteClaimPayload {
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
export interface UpdateClaimPayload {
  claims: Omit<iClaimDetails<NumberType>, '_includesPrivateParams' | 'seedCode' | 'version'>[];
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
 * @category Interfaces
 */
export type ManagePluginRequest = Omit<IntegrationPluginDetails<ClaimIntegrationPluginType>, 'publicState' | 'privateState'>;

/**
 * @category Interfaces
 */
export type CreateClaimRequest<T extends NumberType> = Omit<iClaimDetails<T>, 'plugins' | 'version' | '_includesPrivateParams'> & {
  cid?: string;
} & {
  plugins: ManagePluginRequest[];
};

/**
 * @category Interfaces
 */
export type UpdateClaimRequest<T extends NumberType> = Omit<iClaimDetails<T>, 'seedCode' | 'plugins' | 'version' | '_includesPrivateParams'> & {
  cid?: string;
} & {
  plugins: ManagePluginRequest[];
};

/**
 * @category API Requests / Responses
 */
export interface CreateClaimPayload {
  claims: CreateClaimRequest<NumberType>[];

  testClaims?: boolean;

  siwbbClaim?: boolean;
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
 *
 * @category API Requests / Responses
 */
export interface OauthRevokePayload {
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

/**
 * @category API Requests / Responses
 */
export interface GetGatedContentForClaimPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetGatedContentForClaimSuccessResponse<T extends NumberType> {
  rewards: iClaimReward<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetGatedContentForClaimSuccessResponse<T extends NumberType>
  extends CustomTypeClass<GetGatedContentForClaimSuccessResponse<T>>
  implements iGetGatedContentForClaimSuccessResponse<T>
{
  rewards: ClaimReward<T>[];

  constructor(data: iGetGatedContentForClaimSuccessResponse<T>) {
    super();
    this.rewards = data.rewards.map((reward) => new ClaimReward(reward));
  }
}

/**
 * @category API Requests / Responses
 */
export interface CreateDynamicDataBinPayload {
  /** The handler ID for the dynamic data bin */
  handlerId: string;
  /** The label of the dynamic data bin */
  label: string;
}

/**
 * @category API Requests / Responses
 */
export interface iCreateDynamicDataBinSuccessResponse<Q extends DynamicDataHandlerType> {
  doc: iDynamicDataDoc<Q>;
}

/**
 * @category API Requests / Responses
 */
export class CreateDynamicDataBinSuccessResponse<Q extends DynamicDataHandlerType>
  extends CustomTypeClass<CreateDynamicDataBinSuccessResponse<Q>>
  implements iCreateDynamicDataBinSuccessResponse<Q>
{
  doc: DynamicDataDoc<Q>;

  constructor(data: iCreateDynamicDataBinSuccessResponse<Q>) {
    super();
    this.doc = new DynamicDataDoc(data.doc);
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetDynamicDataBinsPayload {
  /** The IDs to fetch. If not provided, all dynamic data stores will be fetched for the current signed in address without any data populated. */
  dynamicDataId?: string;
  /** The data secret to fetch. Only needed if you are not signed in as creator. */
  dataSecret?: string;
  /** The pagination bookmark to start from. Only applicable if a single dynamic data ID is provided. */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataBinsSuccessResponse<Q extends DynamicDataHandlerType> {
  docs: iDynamicDataDoc<Q>[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export class GetDynamicDataBinsSuccessResponse<Q extends DynamicDataHandlerType>
  extends CustomTypeClass<GetDynamicDataBinsSuccessResponse<Q>>
  implements iGetDynamicDataBinsSuccessResponse<Q>
{
  docs: DynamicDataDoc<Q>[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };

  constructor(data: iGetDynamicDataBinsSuccessResponse<Q>) {
    super();
    this.docs = data.docs.map((doc) => new DynamicDataDoc(doc));
    this.pagination = data.pagination;
  }
}

/**
 * @category API Requests / Responses
 */
export interface UpdateDynamicDataBinPayload {
  /** The dynamic data ID to update */
  dynamicDataId: string;
  /** Whether to rotate the data secret */
  rotateDataSecret?: boolean;
  /** The label of the dynamic data bin to update */
  label?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateDynamicDataBinSuccessResponse<Q extends DynamicDataHandlerType> {
  doc: iDynamicDataDoc<Q>;
}

/**
 * @category API Requests / Responses
 */
export class UpdateDynamicDataBinSuccessResponse<Q extends DynamicDataHandlerType>
  extends CustomTypeClass<UpdateDynamicDataBinSuccessResponse<Q>>
  implements iUpdateDynamicDataBinSuccessResponse<Q>
{
  doc: DynamicDataDoc<Q>;

  constructor(data: iUpdateDynamicDataBinSuccessResponse<Q>) {
    super();
    this.doc = new DynamicDataDoc<Q>(data.doc);
  }
}

/**
 * @category API Requests / Responses
 */
export interface DeleteDynamicDataBinPayload {
  /** The dynamic data ID to delete */
  dynamicDataId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteDynamicDataBinSuccessResponse {
  message: string;
}

/**
 * @category API Requests / Responses
 */
export class DeleteDynamicDataBinSuccessResponse
  extends CustomTypeClass<DeleteDynamicDataBinSuccessResponse>
  implements iDeleteDynamicDataBinSuccessResponse
{
  message: string;

  constructor(data: iDeleteDynamicDataBinSuccessResponse) {
    super();
    this.message = data.message;
  }
}

/**
 * @category API Requests / Responses
 */
export interface PerformBinActionSingleWithBodyAuthPayload {
  /** The dynamic data ID */
  dynamicDataId: string;
  /** The data secret */
  dataSecret: string;
  /** The name of the action to perform */
  actionName: string;
  /** The payload for this specific action */
  payload: PerformBinActionPayload;
}

/**
 * @category API Requests / Responses
 */
export interface iPerformBinActionSingleWithBodyAuthSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class PerformBinActionSingleWithBodyAuthSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface PerformBinActionBatchWithBodyAuthPayload {
  /** The dynamic data ID */
  dynamicDataId: string;
  /** The data secret */
  dataSecret: string;
  /** The actions to perform */
  actions: {
    /** The name of the action to perform */
    actionName: string;
    /** The payload for this specific action */
    payload: PerformBinActionPayload;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iPerformBinActionBatchWithBodyAuthSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class PerformBinActionBatchWithBodyAuthSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface PerformBinActionPayload {
  /** Any custom payload data needed for the action */
  [key: string]: any;
}

/**
 * @category API Requests / Responses
 */
export interface PerformBinActionBodyAuthPayload {
  /**
   *
   */
  /** The data secret to perform the action with */
  dataSecret: string;
}

/**
 * @category API Requests / Responses
 */
export interface iPerformBinActionSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class PerformBinActionSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface BatchBinActionPayload {
  /** Array of actions to perform */
  actions: {
    /** The name of the action to perform */
    actionName: string;
    /** The payload for this specific action */
    payload: any;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iBatchBinActionSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class BatchBinActionSuccessResponse extends EmptyResponseClass {}

// You might also want to add a type for individual actions in the batch
/**
 * @category API Requests / Responses
 */
export interface BinAction {
  /** The name of the action to perform */
  actionName: string;
  /** The payload for this specific action */
  payload: PerformBinActionPayload;
}

/**
 * @category API Requests / Responses
 */
export interface GetDynamicDataActivityPayload {
  /** The dynamic data ID to fetch activity for */
  dynamicDataId: string;
  /** The pagination bookmark to start from */
  bookmark?: string;
  /** The data secret to fetch activity for */
  dataSecret: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataActivitySuccessResponse {
  pending: {
    dynamicDataId: string;
    handlerId: string;
    actions: any[];
    lastFetchedAt: number;
    numRetries: number;
    nextFetchTime: number;
    error: string;
  }[];
  history: {
    docs: {
      dynamicDataId: string;
      updatedAt: number;
      actions: any[];
    }[];
    pagination: {
      bookmark: string;
      hasMore: boolean;
    };
  };
}

/**
 * @category API Requests / Responses
 */
export class GetDynamicDataActivitySuccessResponse
  extends CustomTypeClass<GetDynamicDataActivitySuccessResponse>
  implements iGetDynamicDataActivitySuccessResponse
{
  pending: {
    dynamicDataId: string;
    handlerId: string;
    actions: any[];
    lastFetchedAt: number;
    numRetries: number;
    nextFetchTime: number;
    error: string;
  }[];
  history: {
    docs: {
      dynamicDataId: string;
      updatedAt: number;
      actions: any[];
    }[];
    pagination: {
      bookmark: string;
      hasMore: boolean;
    };
  };

  constructor(data: iGetDynamicDataActivitySuccessResponse) {
    super();
    this.pending = data.pending;
    this.history = data.history;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetGroupsPayload {
  /** The pagination bookmark to start from */
  bookmark?: string;

  /** The specific IDs to fetch */
  groupIds?: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetGroupsSuccessResponse<T extends NumberType> {
  docs: iGroupDoc<T>[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export class GetGroupsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetGroupsSuccessResponse<T>>
  implements iGetGroupsSuccessResponse<T>
{
  docs: GroupDoc<T>[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };

  constructor(data: iGetGroupsSuccessResponse<T>) {
    super();
    this.docs = data.docs.map((doc) => new GroupDoc<T>(doc));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetGroupsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetGroupsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface CreateGroupPayload {
  /** The overall metadata for the group */
  metadata: iMetadata<NumberType>;

  /** The events in the group */
  events: iEvent<NumberType>[];

  /** The collection IDs in the group */
  collectionIds: NumberType[];

  /** The claim  IDs in the group */
  claimIds: string[];

  /** The address list IDs in the group */
  listIds: string[];

  /** Mapping IDs in the group */
  mapIds: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iCreateGroupSuccessResponse<T extends NumberType> {
  doc: iGroupDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class CreateGroupSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<CreateGroupSuccessResponse<T>>
  implements iCreateGroupSuccessResponse<T>
{
  doc: GroupDoc<T>;

  constructor(data: iCreateGroupSuccessResponse<T>) {
    super();
    this.doc = new GroupDoc<T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CreateGroupSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CreateGroupSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface UpdateGroupPayload {
  /** The group ID to update */
  groupId: string;

  /** The overall metadata for the group */
  metadata: iMetadata<NumberType>;

  /** The events in the group */
  events: iEvent<NumberType>[];

  /** The collection IDs in the group */
  collectionIds: NumberType[];

  /** The claim  IDs in the group */
  claimIds: string[];

  /** The address list IDs in the group */
  listIds: string[];

  /** Mapping IDs in the group */
  mapIds: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateGroupSuccessResponse<T extends NumberType> {
  doc: iGroupDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class UpdateGroupSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<UpdateGroupSuccessResponse<T>>
  implements iUpdateGroupSuccessResponse<T>
{
  doc: GroupDoc<T>;

  constructor(data: iUpdateGroupSuccessResponse<T>) {
    super();
    this.doc = new GroupDoc<T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UpdateGroupSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UpdateGroupSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface DeleteGroupPayload {
  /** The group ID to delete */
  groupId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteGroupSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteGroupSuccessResponse extends EmptyResponseClass {}
