import type { iBitBadgesAddressList } from '@/api-indexer/BitBadgesAddressList';
import { BitBadgesAddressList } from '@/api-indexer/BitBadgesAddressList';
import type { iBitBadgesCollection } from '@/api-indexer/BitBadgesCollection';
import { BitBadgesCollection } from '@/api-indexer/BitBadgesCollection';
import type { iBitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo';
import { BitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo';
import type { PaginationInfo } from '@/api-indexer/base';
import { EmptyResponseClass } from '@/api-indexer/base';
import { ClaimAlertDoc, TransferActivityDoc } from '@/api-indexer/docs/activity';
import { SecretDoc, StatusDoc } from '@/api-indexer/docs/docs';
import type {
  BlockinMessage,
  ClaimIntegrationPluginType,
  CosmosAddress,
  IntegrationPluginDetails,
  NativeAddress,
  UNIXMilliTimestamp,
  iClaimAlertDoc,
  iCustomListPage,
  iCustomPage,
  iSecretDoc,
  iSocialConnections,
  iStatusDoc,
  iTransferActivityDoc
} from '@/api-indexer/docs/interfaces';
import type { iBadgeMetadataDetails } from '@/api-indexer/metadata/badgeMetadata';
import type { iMetadata } from '@/api-indexer/metadata/metadata';
import { Metadata } from '@/api-indexer/metadata/metadata';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import type { SupportedChain } from '@/common/types';
import { SecretsProof } from '@/core';
import { IncrementedBalances, iChallengeDetails } from '@/core/approvals';
import type { iBatchBadgeDetails } from '@/core/batch-utils';
import type { iOffChainBalancesMap } from '@/core/transfers';
import { UintRangeArray } from '@/core/uintRanges';
import type { iIncrementedBalances, iSecretsProof, iUintRange } from '@/interfaces';
import type { BroadcastPostBody } from '@/node-rest-api/broadcast';
import type { DeliverTxResponse, Event } from '@cosmjs/stargate';
import type { ChallengeParams, VerifyChallengeOptions } from 'blockin';
import { BlockinChallengeParams } from './blockin';

/**
 * @category API Requests / Responses
 */
export interface GetStatusRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetStatusRouteSuccessResponse<T extends NumberType> {
  /**
   * Status details about the indexer / blockchain.
   */
  status: iStatusDoc<T>;
}

/**
 * @inheritDoc iGetStatusRouteSuccessResponse
 * @category API Requests / Responses
 */
export class GetStatusRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetStatusRouteSuccessResponse<T>>
  implements iGetStatusRouteSuccessResponse<T>
{
  status: StatusDoc<T>;
  constructor(data: iGetStatusRouteSuccessResponse<T>) {
    super();
    this.status = new StatusDoc(data.status);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetStatusRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetStatusRouteSuccessResponse<U>;
  }
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
  specificCollectionId?: NumberType;
}

/**
 *
 * @category API Requests / Responses
 */
export interface iGetSearchRouteSuccessResponse<T extends NumberType> {
  collections: iBitBadgesCollection<T>[];
  accounts: iBitBadgesUserInfo<T>[];
  addressLists: iBitBadgesAddressList<T>[];
  badges: {
    collection: iBitBadgesCollection<T>;
    badgeIds: iUintRange<T>[];
  }[];
}
/**
 * @inheritDoc iGetSearchRouteSuccessResponse
 * @category API Requests / Responses
 */
export class GetSearchRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSearchRouteSuccessResponse<T>>
  implements iGetSearchRouteSuccessResponse<T>
{
  collections: BitBadgesCollection<T>[];
  accounts: BitBadgesUserInfo<T>[];
  addressLists: BitBadgesAddressList<T>[];
  badges: {
    collection: BitBadgesCollection<T>;
    badgeIds: UintRangeArray<T>;
  }[];

  constructor(data: iGetSearchRouteSuccessResponse<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetSearchRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetSearchRouteSuccessResponse<U>;
  }
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
export interface iClaimDetails<T extends NumberType> {
  /** Unique claim ID. */
  claimId: string;
  /** The balances to set for the claim. Only used for claims for collections that have off-chain indexed balances and are assigning balances based on the claim. */
  balancesToSet?: iIncrementedBalances<T>;
  /** Claim plugins. These are the criteria that must pass for a user to claim the badge. */
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  /** If manual distribution is enabled, we do not handle any distribution of claim codes. We leave that up to the claim creator. */
  manualDistribution?: boolean;
}

/**
 * @inheritDoc iClaimDetails
 * @category API Requests / Responses
 */
export class ClaimDetails<T extends NumberType> extends BaseNumberTypeClass<ClaimDetails<T>> implements iClaimDetails<T> {
  claimId: string;
  balancesToSet?: IncrementedBalances<T>;
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  manualDistribution?: boolean;

  constructor(data: iClaimDetails<T>) {
    super();
    this.claimId = data.claimId;
    this.balancesToSet = data.balancesToSet ? new IncrementedBalances(data.balancesToSet) : undefined;
    this.plugins = data.plugins;
    this.manualDistribution = data.manualDistribution;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): ClaimDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as ClaimDetails<U>;
  }
}

/**
 *
 * @category API Requests / Responses
 */
export interface iGetClaimsRouteSuccessResponse<T extends NumberType> {
  claims: iClaimDetails<T>[];
}

/**
 * @inheritDoc iGetClaimsRouteSuccessResponse
 * @category API Requests / Responses
 */
export class GetClaimsRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimsRouteSuccessResponse<T>>
  implements iGetClaimsRouteSuccessResponse<T>
{
  claims: ClaimDetails<T>[];

  constructor(data: iGetClaimsRouteSuccessResponse<T>) {
    super();
    this.claims = data.claims.map((claim) => new ClaimDetails(claim));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): GetClaimsRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetClaimsRouteSuccessResponse<U>;
  }
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
export class CheckAndCompleteClaimRouteSuccessResponse
  extends CustomTypeClass<CheckAndCompleteClaimRouteSuccessResponse>
  implements iCheckAndCompleteClaimRouteSuccessResponse
{
  code?: string;
  prevCodes?: string[] | undefined;

  constructor(data: iCheckAndCompleteClaimRouteSuccessResponse) {
    super();
    this.code = data.code;
    this.prevCodes = data.prevCodes;
  }
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
export class DeleteReviewRouteSuccessResponse extends EmptyResponseClass {}

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
  stars: NumberType;
}

/**
 * @category API Requests / Responses
 */
export interface iAddReviewForCollectionRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class AddReviewForCollectionRouteSuccessResponse extends EmptyResponseClass {}

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
  stars: NumberType;
}

/**
 * @category API Requests / Responses
 */
export interface iAddReviewForUserRouteSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export class AddReviewForUserRouteSuccessResponse extends EmptyResponseClass {}

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
  socialConntections?: iSocialConnections<NumberType>;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAccountInfoRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdateAccountInfoRouteSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface AddBalancesToOffChainStorageRouteRequestBody {
  /**
   * A map of Cosmos addresses or list IDs -> Balance<NumberType>[].
   */
  balances?: iOffChainBalancesMap<NumberType>;

  /**
   * The claim details
   */
  claims?: {
    claimId: string;
    plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
    balancesToSet?: iIncrementedBalances<NumberType>;
  }[];

  /**
   * The method for storing balances (ipfs or centralized).
   */
  method: 'ipfs' | 'centralized';

  /**
   * The collection ID.
   */
  collectionId: NumberType;
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
 * @inheritDoc iAddBalancesToOffChainStorageRouteSuccessResponse
 * @category API Requests / Responses
 */
export class AddBalancesToOffChainStorageRouteSuccessResponse
  extends CustomTypeClass<AddBalancesToOffChainStorageRouteSuccessResponse>
  implements iAddBalancesToOffChainStorageRouteSuccessResponse
{
  uri?: string;
  result: {
    cid?: string;
  };

  constructor(data: iAddBalancesToOffChainStorageRouteSuccessResponse) {
    super();
    this.uri = data.uri;
    this.result = data.result;
  }
}

/**
 * @category API Requests / Responses
 */
export interface AddMetadataToIpfsRouteRequestBody {
  /**
   * The collection metadata to add to IPFS
   */
  collectionMetadata?: iMetadata<NumberType>;
  /**
   * The badge metadata to add to IPFS
   */
  badgeMetadata?: iBadgeMetadataDetails<NumberType>[] | iMetadata<NumberType>[];
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
 * @inheritDoc iAddMetadataToIpfsRouteSuccessResponse
 * @category API Requests / Responses
 */
export class AddMetadataToIpfsRouteSuccessResponse
  extends CustomTypeClass<AddMetadataToIpfsRouteSuccessResponse>
  implements iAddMetadataToIpfsRouteSuccessResponse
{
  collectionMetadataResult?: {
    cid: string;
  };
  badgeMetadataResults: {
    cid: string;
  }[];

  constructor(data: iAddMetadataToIpfsRouteSuccessResponse) {
    super();
    this.collectionMetadataResult = data.collectionMetadataResult;
    this.badgeMetadataResults = data.badgeMetadataResults;
  }
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
  challengeDetails?: iChallengeDetails<NumberType>;

  claims?: {
    /**
     * The plugins for the approval.
     */
    plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
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
 * @inheritDoc iAddApprovalDetailsToOffChainStorageRouteSuccessResponse
 * @category API Requests / Responses
 */
export class AddApprovalDetailsToOffChainStorageRouteSuccessResponse
  extends CustomTypeClass<AddApprovalDetailsToOffChainStorageRouteSuccessResponse>
  implements iAddApprovalDetailsToOffChainStorageRouteSuccessResponse
{
  result: {
    cid: string;
  };

  challengeResult?: { cid: string } | undefined;

  constructor(data: iAddApprovalDetailsToOffChainStorageRouteSuccessResponse) {
    super();
    this.result = data.result;
    this.challengeResult = data.challengeResult;
  }
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
  hours?: NumberType;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSignInChallengeRouteSuccessResponse<T extends NumberType> {
  /**
   * The nonce for the challenge.
   */
  nonce: string;

  /**
   * The challenge parameters.
   */
  params: ChallengeParams<T>;

  /**
   * The Blockin challenge message to sign.
   */
  message: BlockinMessage;
}

/**
 * @inheritDoc iGetSignInChallengeRouteSuccessResponse
 * @category API Requests / Responses
 */
export class GetSignInChallengeRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSignInChallengeRouteSuccessResponse<T>>
  implements iGetSignInChallengeRouteSuccessResponse<T>
{
  nonce: string;
  params: BlockinChallengeParams<T>;
  message: BlockinMessage;

  constructor(data: iGetSignInChallengeRouteSuccessResponse<T>) {
    super();
    this.nonce = data.nonce;
    this.params = new BlockinChallengeParams(data.params);
    this.message = data.message;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetSignInChallengeRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetSignInChallengeRouteSuccessResponse<U>;
  }
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
export class VerifySignInRouteSuccessResponse extends EmptyResponseClass {}

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
 * @inheritDoc iCheckSignInStatusRequestSuccessResponse
 * @category API Requests / Responses
 */
export class CheckSignInStatusRequestSuccessResponse
  extends CustomTypeClass<CheckSignInStatusRequestSuccessResponse>
  implements iCheckSignInStatusRequestSuccessResponse
{
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

  constructor(data: iCheckSignInStatusRequestSuccessResponse) {
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
export class SignOutSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface GetBrowseCollectionsRouteRequestBody {}

/**
 * @category API Requests / Responses
 */
export interface iGetBrowseCollectionsRouteSuccessResponse<T extends NumberType> {
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
export class GetBrowseCollectionsRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBrowseCollectionsRouteSuccessResponse<T>>
  implements iGetBrowseCollectionsRouteSuccessResponse<T>
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

  constructor(data: iGetBrowseCollectionsRouteSuccessResponse<T>) {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetBrowseCollectionsRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetBrowseCollectionsRouteSuccessResponse<U>;
  }
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
export class BroadcastTxRouteSuccessResponse extends CustomTypeClass<BroadcastTxRouteSuccessResponse> implements iBroadcastTxRouteSuccessResponse {
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

  constructor(data: iBroadcastTxRouteSuccessResponse) {
    super();
    this.tx_response = data.tx_response;
  }
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
 * @inheritDoc iSimulateTxRouteSuccessResponse
 * @category API Requests / Responses
 */
export class SimulateTxRouteSuccessResponse extends CustomTypeClass<SimulateTxRouteSuccessResponse> implements iSimulateTxRouteSuccessResponse {
  gas_info: { gas_used: string; gas_wanted: string };
  result: {
    data: string;
    log: string;
    events: { type: string; attributes: { key: string; value: string; index: boolean }[] }[];
  };

  constructor(data: iSimulateTxRouteSuccessResponse) {
    super();
    this.gas_info = data.gas_info;
    this.result = data.result;
  }
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
export interface iFetchMetadataDirectlyRouteSuccessResponse<T extends NumberType> {
  metadata: iMetadata<T>[];
}

/**
 * @inheritDoc iFetchMetadataDirectlyRouteSuccessResponse
 * @category API Requests / Responses
 */
export class FetchMetadataDirectlyRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<FetchMetadataDirectlyRouteSuccessResponse<T>>
  implements iFetchMetadataDirectlyRouteSuccessResponse<T>
{
  metadata: Metadata<T>[];

  constructor(data: iFetchMetadataDirectlyRouteSuccessResponse<T>) {
    super();
    this.metadata = data.metadata.map((metadata) => new Metadata(metadata));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): FetchMetadataDirectlyRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as FetchMetadataDirectlyRouteSuccessResponse<U>;
  }
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
export class GetTokensFromFaucetRouteSuccessResponse
  extends CustomTypeClass<GetTokensFromFaucetRouteSuccessResponse>
  implements iGetTokensFromFaucetRouteSuccessResponse
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

  constructor(data: iGetTokensFromFaucetRouteSuccessResponse) {
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
export interface SendClaimAlertsRouteRequestBody {
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
export interface iSendClaimAlertsRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class SendClaimAlertsRouteSuccessResponse extends EmptyResponseClass {}

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
 * @inheritDoc iVerifySignInRouteSuccessResponse
 * @category API Requests / Responses
 */
export class GenericBlockinVerifyRouteSuccessResponse extends VerifySignInRouteSuccessResponse {}

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
export class CreateSecretRouteSuccessResponse extends CustomTypeClass<CreateSecretRouteSuccessResponse> implements iCreateSecretRouteSuccessResponse {
  secretId: string;

  constructor(data: iCreateSecretRouteSuccessResponse) {
    super();
    this.secretId = data.secretId;
  }
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
export interface iGetSecretRouteSuccessResponse<T extends NumberType> extends iSecretDoc<T> {}

/**
 * @category API Requests / Responses
 */
export class GetSecretRouteSuccessResponse<T extends NumberType> extends SecretDoc<T> {}

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
export class DeleteSecretRouteSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface UpdateSecretRouteRequestBody {
  /** The secret ID. This is the ID that is given to the user to query the secret. Anyone with the ID can query it, so keep this safe and secure. */
  secretId: string;

  /** You can approve specific viewers to view the secret. */
  viewersToSet?: {
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
export class UpdateSecretRouteSuccessResponse extends EmptyResponseClass {}

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
  secretsProofs?: iSecretsProof<NumberType>[];
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
export class CreateBlockinAuthCodeRouteSuccessResponse
  extends CustomTypeClass<CreateBlockinAuthCodeRouteSuccessResponse>
  implements iCreateBlockinAuthCodeRouteSuccessResponse
{
  id: string;

  constructor(data: iCreateBlockinAuthCodeRouteSuccessResponse) {
    super();
    this.id = data.id;
  }
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
export class GetBlockinAuthCodeRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBlockinAuthCodeRouteSuccessResponse<T>>
  implements iGetBlockinAuthCodeRouteSuccessResponse<T>
{
  message: BlockinMessage;
  signature: string;
  verificationResponse: {
    success: boolean;
    errorMessage?: string;
  };
  params: BlockinChallengeParams<NumberType>;
  cosmosAddress: CosmosAddress;
  secretsProofs: SecretsProof<T>[];

  constructor(data: iGetBlockinAuthCodeRouteSuccessResponse<T>) {
    super();
    this.message = data.message;
    this.signature = data.signature;
    this.verificationResponse = data.verificationResponse;
    this.params = new BlockinChallengeParams(data.params);
    this.cosmosAddress = data.cosmosAddress;
    this.secretsProofs = data.secretsProofs ? data.secretsProofs.map((proof) => new SecretsProof(proof)) : [];
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetBlockinAuthCodeRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetBlockinAuthCodeRouteSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetBlockinAuthCodeRouteSuccessResponse<T extends NumberType> {
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
  params: ChallengeParams<NumberType>;
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
  secretsProofs: iSecretsProof<T>[];
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
export class DeleteBlockinAuthCodeRouteSuccessResponse extends EmptyResponseClass {}

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
export class GenerateAppleWalletPassRouteSuccessResponse
  extends CustomTypeClass<GenerateAppleWalletPassRouteSuccessResponse>
  implements iGenerateAppleWalletPassRouteSuccessResponse
{
  type: string;
  data: string;

  constructor(data: iGenerateAppleWalletPassRouteSuccessResponse) {
    super();
    this.type = data.type;
    this.data = data.data;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetClaimAlertsForCollectionRouteRequestBody {
  /** The collection ID to get claim alerts for. */
  collectionId: NumberType;
  /** The pagination bookmark obtained from the previous request. Leave blank for the first request. */
  bookmark: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimAlertsForCollectionRouteSuccessResponse<T extends NumberType> {
  claimAlerts: iClaimAlertDoc<T>[];
  pagination: PaginationInfo;
}

export class GetClaimAlertsForCollectionRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimAlertsForCollectionRouteSuccessResponse<T>>
  implements iGetClaimAlertsForCollectionRouteSuccessResponse<T>
{
  claimAlerts: ClaimAlertDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetClaimAlertsForCollectionRouteSuccessResponse<T>) {
    super();
    this.claimAlerts = data.claimAlerts.map((claimAlert) => new ClaimAlertDoc(claimAlert));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetClaimAlertsForCollectionRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetClaimAlertsForCollectionRouteSuccessResponse<U>;
  }
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
export class GetExternalCallRouteSuccessResponse
  extends CustomTypeClass<GetExternalCallRouteSuccessResponse>
  implements iGetExternalCallRouteSuccessResponse
{
  key: string;
  timestamp: number;

  constructor(data: iGetExternalCallRouteSuccessResponse) {
    super();
    this.key = data.key;
    this.timestamp = data.timestamp;
  }
}
