import type { iBitBadgesAddressList } from '@/api-indexer/BitBadgesAddressList';
import { BitBadgesAddressList } from '@/api-indexer/BitBadgesAddressList';
import type { iBitBadgesCollection } from '@/api-indexer/BitBadgesCollection';
import { BitBadgesCollection } from '@/api-indexer/BitBadgesCollection';
import type { iBitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo';
import { BitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo';
import type { PaginationInfo } from '@/api-indexer/base';
import { EmptyResponseClass } from '@/api-indexer/base';
import { ClaimAlertDoc, TransferActivityDoc } from '@/api-indexer/docs/activity';
import { StatusDoc } from '@/api-indexer/docs/docs';
import type {
  ClaimIntegrationPluginType,
  IntegrationPluginDetails,
  iClaimAlertDoc,
  iCustomListPage,
  iCustomPage,
  iStatusDoc,
  iTransferActivityDoc
} from '@/api-indexer/docs/interfaces';
import type { iBadgeMetadataDetails } from '@/api-indexer/metadata/badgeMetadata';
import type { iMetadata } from '@/api-indexer/metadata/metadata';
import { Metadata } from '@/api-indexer/metadata/metadata';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import type { SupportedChain } from '@/common/types';
import { IncrementedBalances, iChallengeDetails } from '@/core/approvals';
import type { iBatchBadgeDetails } from '@/core/batch-utils';
import type { iOffChainBalancesMap } from '@/core/transfers';
import { UintRangeArray } from '@/core/uintRanges';
import type { iIncrementedBalances, iUintRange } from '@/interfaces';
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
   * Includes status details about the indexer / blockchain.
   */
  status: iStatusDoc<T>;
}

/**
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
 * Type to allow specifying codes and passwords for a merkle challenge.
 *
 * We only support storing codes and passwords for merkle challenges created by BitBadges via IPFS.
 * The IPFS CID of the merkle challenge is used to identify the merkle challenge.
 *
 * Note that we only support storing a set of codes and passwords once per unique CID.
 *
 * @category API Requests / Responses
 */
export interface CodesAndPasswords {
  /**
   * The IPFS CID of the merkle challenge.
   */
  cid: string;
  codes: string[];
  password: string;
}

/**
 * @category API Requests / Responses
 */
export interface GetClaimsRouteRequestBody {
  claimIds: string[];
  listId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimsRouteSuccessResponse<T extends NumberType> {
  claims: {
    claimId: string;
    balancesToSet?: iIncrementedBalances<T>;
    plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
    manualDistribution?: boolean;
  }[];
}

/**
 * @category API Requests / Responses
 */
export class GetClaimsRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimsRouteSuccessResponse<T>>
  implements iGetClaimsRouteSuccessResponse<T>
{
  claims: {
    claimId: string;
    balancesToSet?: IncrementedBalances<T>;
    plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
    manualDistribution?: boolean;
  }[];

  constructor(data: iGetClaimsRouteSuccessResponse<T>) {
    super();
    this.claims = data.claims.map((claim) => {
      return {
        claimId: claim.claimId,
        balancesToSet: claim.balancesToSet ? new IncrementedBalances(claim.balancesToSet) : undefined,
        plugins: claim.plugins,
        manualDistribution: claim.manualDistribution
      };
    });
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): GetClaimsRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetClaimsRouteSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface CheckAndCompleteClaimRouteRequestBody {
  [pluginId: string]: any;
  prevCodesOnly?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iCheckAndCompleteClaimRouteSuccessResponse {
  code?: string;
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
  seenActivity?: NumberType;

  /**
   * The README details.
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
   * The profile picture image file. We will then upload to our CDN.
   */
  profilePicImageFile?: any;

  /**
   * The notification preferences for the user.
   */
  notifications?: {
    email?: string;
    antiPhishingCode?: string;
    preferences?: {};
  };

  /**
   * Approved sign in methods
   */
  approvedSignInMethods?: {
    discord?: {
      username: string;
      discriminator?: string;
      id: string;
    };
  };
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
  offChainClaims?: {
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

  offChainClaims?: {
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
}

/**
 * @category API Requests / Responses
 */
export class AddApprovalDetailsToOffChainStorageRouteSuccessResponse
  extends CustomTypeClass<AddApprovalDetailsToOffChainStorageRouteSuccessResponse>
  implements iAddApprovalDetailsToOffChainStorageRouteSuccessResponse
{
  result: {
    cid: string;
  };

  constructor(data: iAddApprovalDetailsToOffChainStorageRouteSuccessResponse) {
    super();
    this.result = data.result;
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
   * The user's blockchain address (their native L1 address).
   */
  address: string;

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
  message: string;
}

/**
 * @category API Requests / Responses
 */
export class GetSignInChallengeRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSignInChallengeRouteSuccessResponse<T>>
  implements iGetSignInChallengeRouteSuccessResponse<T>
{
  nonce: string;
  params: BlockinChallengeParams<T>;
  message: string;

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
   * The original Blockin message
   */
  message: string;

  /**
   * The signature of the Blockin message
   */
  signature: string;

  /**
   * Required for some chains. The public key of the signer.
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
  message: string;

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

  // stripe?: {
  //   id: string;
  //   username: string;
  // };
  github?: {
    id: string;
    username: string;
  };

  google?: {
    id: string;
    username: string;
  };
}

/**
 * @category API Requests / Responses
 */
export class CheckSignInStatusRequestSuccessResponse
  extends CustomTypeClass<CheckSignInStatusRequestSuccessResponse>
  implements iCheckSignInStatusRequestSuccessResponse
{
  signedIn: boolean;
  message: string;
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
  signOutDiscord: boolean;
  signOutTwitter: boolean;
  signOutBlockin: boolean;
  signOutGoogle: boolean;
  signOutGithub: boolean;
  // signOutStripe: boolean;
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
   * See Cosmos SDK documentation for what each field means.
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
export class BroadcastTxRouteSuccessResponse extends CustomTypeClass<BroadcastTxRouteSuccessResponse> implements iBroadcastTxRouteSuccessResponse {
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
  claimAlerts: {
    collectionId: NumberType;
    message?: string;
    recipientAddress: string;
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
 * information returned by the REST API getAccount route.
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
  address: string;
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
 * @category API Requests / Responses
 */
export interface iGenericBlockinVerifyRouteSuccessResponse extends iVerifySignInRouteSuccessResponse {}

/**
 * Generic route to verify any Blockin request. Does not sign you in with the API. Used for custom Blockin integrations.
 *
 * @category API Requests / Responses
 */
export class GenericBlockinVerifyRouteSuccessResponse extends VerifySignInRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export interface CreateBlockinAuthCodeRouteRequestBody {
  name: string;
  description: string;
  image: string;

  message: string;
  signature: string;
  publicKey?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iCreateBlockinAuthCodeRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class CreateBlockinAuthCodeRouteSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface GetBlockinAuthCodeRouteRequestBody {
  signature: string;
  options?: VerifyChallengeOptions;
}

/**
 * @category API Requests / Responses
 */
export class GetBlockinAuthCodeRouteSuccessResponse
  extends CustomTypeClass<GetBlockinAuthCodeRouteSuccessResponse>
  implements iGetBlockinAuthCodeRouteSuccessResponse
{
  message: string;
  verificationResponse: {
    success: boolean;
    errorMessage?: string;
  };
  params: BlockinChallengeParams<NumberType>;
  cosmosAddress: string;

  constructor(data: iGetBlockinAuthCodeRouteSuccessResponse) {
    super();
    this.message = data.message;
    this.verificationResponse = data.verificationResponse;
    this.params = new BlockinChallengeParams(data.params);
    this.cosmosAddress = data.cosmosAddress;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetBlockinAuthCodeRouteSuccessResponse {
  /**
   * The corresponding message that was signed to obtain the signature.
   */
  message: string;
  /**
   * The converted Blockin params fort the message
   */
  params: BlockinChallengeParams<NumberType>;
  /**
   * The converted Cosmos address of params.address. This can be used as the
   * unique identifier for the user (e.g. avoid duplicate sign ins from equivalent 0x and cosmos1 addresses).
   */
  cosmosAddress: string;
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
}

/**
 * @category API Requests / Responses
 */
export interface DeleteBlockinAuthCodeRouteRequestBody {
  signature: string;
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
  name: string;
  description: string;
  message: string;
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
  collectionId: NumberType;
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
