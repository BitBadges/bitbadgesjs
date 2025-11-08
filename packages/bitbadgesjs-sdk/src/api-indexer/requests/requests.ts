import type { iBitBadgesCollection } from '@/api-indexer/BitBadgesCollection.js';
import { BitBadgesCollection } from '@/api-indexer/BitBadgesCollection.js';
import type { iBitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo.js';
import { BitBadgesUserInfo } from '@/api-indexer/BitBadgesUserInfo.js';
import type { PaginationInfo } from '@/api-indexer/base.js';
import { EmptyResponseClass } from '@/api-indexer/base.js';
import { ClaimActivityDoc, PointsActivityDoc, TransferActivityDoc } from '@/api-indexer/docs-types/activity.js';
import {
  AccessTokenDoc,
  ApiKeyDoc,
  ApplicationDoc,
  ApprovalTrackerDoc,
  DeveloperAppDoc,
  DynamicDataDoc,
  MapWithValues,
  PluginDoc,
  SIWBBRequestDoc,
  StatusDoc,
  UtilityPageDoc
} from '@/api-indexer/docs-types/docs.js';
import {
  ClaimReward,
  CreateClaimRequest,
  DynamicDataHandlerType,
  UpdateClaimRequest,
  iApiKeyDoc,
  iApplicationDoc,
  iApplicationPage,
  iApprovalTrackerDoc,
  iClaimActivityDoc,
  iDynamicDataDoc,
  iEstimatedCost,
  iInheritMetadataFrom,
  iLinkedTo,
  iPointsActivityDoc,
  iSIWBBRequestDoc,
  iUtilityPageContent,
  iUtilityPageDoc,
  iUtilityPageLink,
  type BitBadgesAddress,
  type ClaimIntegrationPluginCustomBodyType,
  type ClaimIntegrationPluginType,
  type JsonBodyInputSchema,
  type JsonBodyInputWithValue,
  type NativeAddress,
  type OAuthScopeDetails,
  type PluginPresetType,
  type SiwbbMessage,
  type UNIXMilliTimestamp,
  type iAccessTokenDoc,
  type iClaimDetails,
  type iClaimReward,
  type iCustomLink,
  type iCustomPage,
  type iDeveloperAppDoc,
  type iMapWithValues,
  type iPluginDoc,
  type iSocialConnections,
  type iStatusDoc,
  type iTransferActivityDoc
} from '@/api-indexer/docs-types/interfaces.js';
import type { iTokenMetadataDetails, iCollectionMetadataDetails } from '@/api-indexer/metadata/tokenMetadata.js';
import type { iMetadata, iMetadataWithoutInternals } from '@/api-indexer/metadata/metadata.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';
import { BaseNumberTypeClass, ConvertOptions, CustomTypeClass, ParsedQs, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import { type NumberType } from '@/common/string-numbers.js';
import type { SupportedChain } from '@/common/types.js';
import { ClaimDetails, iChallengeDetails, iChallengeInfoDetailsUpdate } from '@/core/approvals.js';
import type { iBatchTokenDetails } from '@/core/batch-utils.js';
import { VerifySIWBBOptions, iSiwbbChallenge } from '@/core/blockin.js';
import { UintRangeArray } from '@/core/uintRanges.js';
import type { CollectionId, iUintRange } from '@/interfaces/index.js';
import { BroadcastPostBody } from '@/node-rest-api/index.js';
import { type AssetConditionGroup, type ChallengeParams, type VerifyChallengeOptions } from 'blockin';
import { SiwbbChallengeParams } from './blockin.js';

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
export interface iGetStatusPayload {
  /**
   * If true, we will check if the indexer is out of sync with the blockchain.
   */
  withOutOfSyncCheck?: boolean;

  /** Chain to check? Defaults to BitBadges poller. */
  chain?: 'Thorchain' | 'BitBadges';
}

/**
 * @category API Requests / Responses
 */
export class GetStatusPayload extends CustomTypeClass<GetStatusPayload> implements iGetStatusPayload {
  withOutOfSyncCheck?: boolean;
  chain?: 'Thorchain' | 'BitBadges';

  constructor(payload: iGetStatusPayload) {
    super();
    this.withOutOfSyncCheck = payload.withOutOfSyncCheck;
    this.chain = payload.chain;
  }

  static FromQuery(query: ParsedQs): GetStatusPayload {
    return new GetStatusPayload({
      withOutOfSyncCheck: query.withOutOfSyncCheck === 'true',
      chain: query.chain?.toString() as 'Thorchain' | 'BitBadges'
    });
  }
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

  /**
   * Prices for the assets
   */
  prices?: Record<string, number>;
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
  prices?: Record<string, number>;

  constructor(data: iGetStatusSuccessResponse<T>) {
    super();
    this.status = new StatusDoc(data.status);
    this.outOfSync = data.outOfSync;
    this.prices = data.prices;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetStatusSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetStatusSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetSearchPayload<T extends NumberType> {
  /** If true, we will skip all collection queries. */
  noCollections?: boolean;
  /** If true, we will skip all account queries. */
  noAccounts?: boolean;
  /** If true, we will skip all badge queries. */
  noBadges?: boolean;
  /** If true, we will skip all map queries. */
  noMaps?: boolean;
  /** If true, we will skip all application queries. */
  noApplications?: boolean;
  /** If true, we will skip all claim queries. */
  noClaims?: boolean;
  /** If true, we will limit collection-based results to a single collection. */
  specificCollectionId?: CollectionId;
}

/**
 * @category API Requests / Responses
 */
export class GetSearchPayload<T extends NumberType> extends BaseNumberTypeClass<GetSearchPayload<T>> implements iGetSearchPayload<T> {
  noCollections?: boolean;
  noAccounts?: boolean;
  noBadges?: boolean;
  noMaps?: boolean;
  noApplications?: boolean;
  noClaims?: boolean;
  specificCollectionId?: CollectionId;

  constructor(payload: iGetSearchPayload<T>) {
    super();
    this.noCollections = payload.noCollections;
    this.noAccounts = payload.noAccounts;
    this.noBadges = payload.noBadges;
    this.noMaps = payload.noMaps;
    this.noApplications = payload.noApplications;
    this.noClaims = payload.noClaims;
    this.specificCollectionId = payload.specificCollectionId;
  }

  static FromQuery(query: ParsedQs): GetSearchPayload<NumberType> {
    return new GetSearchPayload<NumberType>({
      noCollections: query.noCollections === 'true',
      noAccounts: query.noAccounts === 'true',
      noBadges: query.noBadges === 'true',
      noMaps: query.noMaps === 'true',
      noApplications: query.noApplications === 'true',
      noClaims: query.noClaims === 'true',
      specificCollectionId: query.specificCollectionId?.toString()
    });
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetSearchPayload<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetSearchPayload<U>;
  }

  getNumberFieldNames(): string[] {
    return ['specificCollectionId'];
  }
}

/*
 *
 * @category API Requests / Responses
 */
export interface iGetSearchSuccessResponse<T extends NumberType> {
  collections: iBitBadgesCollection<T>[];
  accounts: iBitBadgesUserInfo<T>[];
  badges: {
    collection: iBitBadgesCollection<T>;
    tokenIds: iUintRange<T>[];
  }[];
  maps: iMapWithValues<T>[];
  applications?: iApplicationDoc<T>[];
  claims?: iClaimDetails<T>[];
  utilityPages?: iUtilityPageDoc<T>[];
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
  badges: {
    collection: BitBadgesCollection<T>;
    tokenIds: UintRangeArray<T>;
  }[];
  maps: MapWithValues<T>[];
  applications?: ApplicationDoc<T>[];
  claims?: ClaimDetails<T>[];
  utilityPages?: UtilityPageDoc<T>[];

  constructor(data: iGetSearchSuccessResponse<T>) {
    super();
    this.collections = data.collections.map((collection) => new BitBadgesCollection(collection));
    this.accounts = data.accounts.map((account) => new BitBadgesUserInfo(account));
    this.badges = data.badges.map((badge) => {
      return {
        collection: new BitBadgesCollection(badge.collection),
        tokenIds: UintRangeArray.From(badge.tokenIds)
      };
    });
    this.maps = data.maps.map((map) => new MapWithValues(map));
    this.applications = data.applications?.map((group) => new ApplicationDoc(group));
    this.claims = data.claims?.map((claim) => new ClaimDetails(claim));
    this.utilityPages = data.utilityPages?.map((utilityPage) => new UtilityPageDoc(utilityPage));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetSearchSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetSearchSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchClaimsPayload {
  /** Bookmark to start from. Obtained from previous request. Leave blank to start from the beginning. Only applicable when no additional criteria is specified. */
  bookmark?: string;
  /** Fetch private parameters for the claim. Only applicable if you are the creator / manager of the claim. Otherwise, it will be the public read-only view. */
  fetchPrivateParams?: boolean;
  /** If provided, we will only return claims with names that regex match the search value. */
  searchValue?: string;
}

/**
 * @category API Requests / Responses
 */
export class SearchClaimsPayload extends CustomTypeClass<SearchClaimsPayload> implements iSearchClaimsPayload {
  bookmark?: string;
  fetchPrivateParams?: boolean;
  searchValue?: string;

  constructor(payload: iSearchClaimsPayload) {
    super();
    this.bookmark = payload.bookmark;
    this.fetchPrivateParams = payload.fetchPrivateParams;
    this.searchValue = payload.searchValue;
  }

  static FromQuery(query: ParsedQs): SearchClaimsPayload {
    return new SearchClaimsPayload({
      bookmark: query.bookmark?.toString(),
      fetchPrivateParams: query.fetchPrivateParams === 'true',
      searchValue: query.searchValue?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimsPayload {
  /** The claim IDs to fetch. */
  claimIds: string[];

  /** Fetch private parameters for the claim. Only applicable if you are the creator / manager of the claim. */
  fetchPrivateParams?: boolean;

  /** Which private state instance IDs to fetch. claimId and instanceId are required and must match a claimId in claimIds and the claim must have the corresponding instanceId. */
  privateStatesToFetch?: {
    claimId: string;
    instanceId: string;
  }[];

  /**
   * Fetch all claimed users for the claim. If true, you will be able to find all { [bitbadgesAddress]: [...zeroIndexedClaimNumbers] }
   * on the numUses plugin's publicState.
   */
  fetchAllClaimedUsers?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimsPayloadV1 {
  /** The claims to fetch. */
  claimsToFetch: {
    /** The claim ID to fetch. */
    claimId: string;
    /** The private state instance IDs to fetch. By default, we do not fetch any private states. */
    privateStatesToFetch?: string[];
    /**
     * Fetch all claimed users for the claim. If true, you will be able to find all { [bitbadgesAddress]: [...zeroIndexedClaimNumbers] }
     * on the numUses plugin's publicState.
     */
    fetchAllClaimedUsers?: boolean;
    /** Fetch private parameters for the claim. Only applicable if you are the creator / manager of the claim. */
    fetchPrivateParams?: boolean;
  }[];
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

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetClaimsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetClaimsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimPayload {
  /** Fetch private parameters for the claim. Only applicable if you are the creator / manager of the claim. */
  fetchPrivateParams?: boolean;
  /** Fetch all claimed users for the claim.  If true, you will be able to find all { [bitbadgesAddress]: [...zeroIndexedClaimNumbers] }
   * on the numUses plugin's publicState. */
  fetchAllClaimedUsers?: boolean;
  /** The private state instance IDs to fetch. By default, we do not fetch any private states. */
  privateStatesToFetch?: string[];
}

/**
 * @category API Requests / Responses
 */
export class GetClaimPayload extends CustomTypeClass<GetClaimPayload> implements iGetClaimPayload {
  fetchPrivateParams?: boolean;
  fetchAllClaimedUsers?: boolean;
  privateStatesToFetch?: string[];

  constructor(payload: iGetClaimPayload) {
    super();
    this.fetchPrivateParams = payload.fetchPrivateParams;
    this.fetchAllClaimedUsers = payload.fetchAllClaimedUsers;
    this.privateStatesToFetch = payload.privateStatesToFetch;
  }

  static FromQuery(query: ParsedQs): GetClaimPayload {
    return new GetClaimPayload({
      fetchPrivateParams: query.fetchPrivateParams === 'true',
      fetchAllClaimedUsers: query.fetchAllClaimedUsers === 'true',
      privateStatesToFetch: query.privateStatesToFetch?.toString().split(',')
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimSuccessResponse<T extends NumberType> {
  claim: iClaimDetails<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetClaimSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimSuccessResponse<T>>
  implements iGetClaimSuccessResponse<T>
{
  claim: ClaimDetails<T>;

  constructor(data: iGetClaimSuccessResponse<T>) {
    super();
    this.claim = new ClaimDetails(data.claim);
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetClaimSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetClaimSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export class GetClaimActivityPayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iSearchClaimsSuccessResponse<T extends NumberType> extends iGetClaimsSuccessResponse<T> {}

/**
 * @category API Requests / Responses
 */
export class SearchClaimsSuccessResponse<T extends NumberType> extends GetClaimsSuccessResponse<T> implements iSearchClaimsSuccessResponse<T> {
  constructor(data: iSearchClaimsSuccessResponse<T>) {
    super(data);
  }
}

/**
 * @category API Requests / Responses
 */
export interface iCompleteClaimPayload {
  /** Needs to be provided so we check that no plugins or claims have been updated since the claim was fetched. To override, set to -1. */
  _expectedVersion: number;

  /** If provided, we will only complete the claim for the specific plugins w/ the provided instance IDs. Must be compatible with the satisfaction logic. */
  _specificInstanceIds?: string[];

  /** The claim body for each unique plugin. */
  [customInstanceId: string]: ClaimIntegrationPluginCustomBodyType<ClaimIntegrationPluginType> | any | undefined;
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
export interface iGetClaimAttemptStatusPayload {}

/**
 * @category API Requests / Responses
 */
export class GetClaimAttemptStatusPayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimAttemptStatusSuccessResponse {
  success: boolean;
  error: string;
  /** The code for the on-chain transaction. Only provided if you have permissions and this is an on-chain token claim. */
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
export interface iGetClaimAttemptsPayload {
  /** The bookmark to start from. */
  bookmark?: string;
  /** Whether to include errors or not. */
  includeErrors?: boolean;
  /** The specific address to fetch claims for. If blank, we fetch most recent claims. */
  address?: NativeAddress;
  /**
   * Include the cached payload data for requestBin plugin. Must be claim creator to view.
   *
   * You can also use the individual GET route to fetch this data.
   */
  includeRequestBinAttemptData?: boolean;
}

/**
 * @category API Requests / Responses
 */
export class GetClaimAttemptsPayload extends CustomTypeClass<GetClaimAttemptsPayload> implements iGetClaimAttemptsPayload {
  bookmark?: string;
  includeErrors?: boolean;
  address?: NativeAddress;
  includeRequestBinAttemptData?: boolean;

  constructor(payload: iGetClaimAttemptsPayload) {
    super();
    this.bookmark = payload.bookmark;
    this.includeErrors = payload.includeErrors;
    this.address = payload.address;
    this.includeRequestBinAttemptData = payload.includeRequestBinAttemptData;
  }

  static FromQuery(query: ParsedQs): GetClaimAttemptsPayload {
    return new GetClaimAttemptsPayload({
      bookmark: query.bookmark?.toString(),
      includeErrors: query.includeErrors === 'true',
      address: query.address?.toString(),
      includeRequestBinAttemptData: query.includeRequestBinAttemptData === 'true'
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimAttemptsSuccessResponse<T extends NumberType> {
  docs: {
    success: boolean;
    attemptedAt: UNIXMilliTimestamp<T>;
    claimId: string;
    bitbadgesAddress: NativeAddress;
    claimAttemptId: string;
    /** Zero-based index claim number */
    claimNumber: number;
    error?: string;
    /**
     * This is in the format of { [instanceId: string]: Record<string, any> }
     * where the object is what was configured via the plugin.
     */
    attemptData?: {
      [instanceId: string]: Record<string, any>;
    };
  }[];
  bookmark?: string;
  total?: number;
}

/**
 * @category API Requests / Responses
 */
export interface iClaimAttempt<T extends NumberType> {
  success: boolean;
  attemptedAt: UNIXMilliTimestamp<T>;
  claimId: string;
  bitbadgesAddress: NativeAddress;
  claimAttemptId: string;
  claimNumber: number;
  error?: string;
  /** This is in the format of { [instanceId: string]: Record<string, any> }
   * where the object is what was configured via the plugin.
   *
   * The instanceId is for the requestBin plugin's instance ID.
   */
  attemptData?: {
    [instanceId: string]: Record<string, any>;
  };
}

/**
 * @category API Requests / Responses
 */
export class ClaimAttempt<T extends NumberType> extends BaseNumberTypeClass<ClaimAttempt<T>> implements iClaimAttempt<T> {
  success: boolean;
  attemptedAt: UNIXMilliTimestamp<T>;
  claimId: string;
  bitbadgesAddress: NativeAddress;
  claimAttemptId: string;
  claimNumber: number;
  error?: string;
  attemptData?: {
    [instanceId: string]: Record<string, any>;
  };

  constructor(data: iClaimAttempt<T>) {
    super();
    this.success = data.success;
    this.attemptedAt = data.attemptedAt;
    this.claimId = data.claimId;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.claimAttemptId = data.claimAttemptId;
    this.claimNumber = data.claimNumber;
    this.error = data.error;
    this.attemptData = data.attemptData;
  }

  getNumberFieldNames(): string[] {
    return ['attemptedAt'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ClaimAttempt<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ClaimAttempt<U>;
  }
}

/**
 * @inheritDoc iGetClaimAttemptsSuccessResponse
 * @category API Requests / Responses
 */
export class GetClaimAttemptsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimAttemptsSuccessResponse<T>>
  implements iGetClaimAttemptsSuccessResponse<T>
{
  docs: ClaimAttempt<T>[];
  bookmark?: string;
  total?: number;

  constructor(data: iGetClaimAttemptsSuccessResponse<T>) {
    super();
    this.docs = data.docs.map((doc) => new ClaimAttempt(doc));
    this.bookmark = data.bookmark;
    this.total = data.total;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetClaimAttemptsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetClaimAttemptsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSimulateClaimPayload {
  /** Will fail if the claim version is not the expected version. To override, set to -1. */
  _expectedVersion: number;

  /** If provided, we will only simulate the claim for the specific plugins w/ the provided instance IDs. */
  _specificInstanceIds?: string[];

  /** The claim body for each unique plugin. */
  [customInstanceId: string]: ClaimIntegrationPluginCustomBodyType<ClaimIntegrationPluginType> | any | undefined;
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
export interface iGetReservedClaimCodesPayload {}

/**
 * @category API Requests / Responses
 */
export class GetReservedClaimCodesPayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetReservedClaimCodesSuccessResponse {
  /**
   * The previously reserved claim codes for the user. These are
   * what are used in the eventual on-chain merkle proof to complete
   * the transaction.
   */
  reservedCodes?: string[];

  /**
   * The leaf signatures for the reserved claim codes to prove address <-> leaf mapping.
   */
  leafSignatures?: string[];
}

/**
 * @inheritDoc iGetReservedClaimCodesSuccessResponse
 * @category API Requests / Responses
 */
export class GetReservedClaimCodesSuccessResponse
  extends CustomTypeClass<GetReservedClaimCodesSuccessResponse>
  implements iGetReservedClaimCodesSuccessResponse
{
  reservedCodes?: string[] | undefined;
  leafSignatures?: string[] | undefined;

  constructor(data: iGetReservedClaimCodesSuccessResponse) {
    super();
    this.reservedCodes = data.reservedCodes;
    this.leafSignatures = data.leafSignatures;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAccountInfoPayload {
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
   * The Bluesky username.
   */
  bluesky?: string;

  /**
   * The affiliate code of the referrer  that sent them?
   */
  affiliateCode?: string;

  /**
   * The last seen activity timestamp.
   */
  seenActivity?: UNIXMilliTimestamp<NumberType>;

  /**
   * The README details (markdown supported).
   */
  readme?: string;

  /**
   * The tokens to hide and not view for this profile's portfolio
   */
  hiddenTokens?: iBatchTokenDetails<NumberType>[];

  /**
   * Custom URL links to display on the user's portfolio.
   */
  customLinks?: iCustomLink[];

  /**
   * An array of custom pages on the user's portolio. Used to customize, sort, and group badges / lists into pages.
   */
  customPages?: {
    badges: iCustomPage<NumberType>[];
  };

  /**
   * The watchlist of tokens / lists
   */
  watchlists?: {
    badges: iCustomPage<NumberType>[];
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
    preferences?: { transferActivity?: boolean; ignoreIfInitiator?: boolean };
  };

  /**
   * The social connections for the user. Only returned if user is authenticated with full access.
   */
  socialConnections?: iSocialConnections<NumberType>;

  /**
   * The public social connections for the user. Will be returned for all queries and may be publicly displayed on profile
   */
  publicSocialConnectionsToSet?: { appName: string; toDelete?: boolean }[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAccountInfoSuccessResponse {
  /** Verificatiom email sent? */
  verificationEmailSent?: boolean;
}

/**
 * @category API Requests / Responses
 */
export class UpdateAccountInfoSuccessResponse extends CustomTypeClass<UpdateAccountInfoSuccessResponse> implements iUpdateAccountInfoSuccessResponse {
  verificationEmailSent?: boolean;

  constructor(data: iUpdateAccountInfoSuccessResponse) {
    super();
    this.verificationEmailSent = data.verificationEmailSent;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetAttemptDataFromRequestBinPayload {
  /**
   * The instance ID of the request bin plugin.
   *
   * Only needed if there are duplicates. Else, we default to first instance found.
   */
  instanceId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetAttemptDataFromRequestBinSuccessResponse {
  /**
   * The attempt payload we cached. This will be in the format configured for the request bin plugin.
   */
  payload: Record<string, any>;
}

/**
 * @category API Requests / Responses
 */
export class GetAttemptDataFromRequestBinSuccessResponse
  extends CustomTypeClass<GetAttemptDataFromRequestBinSuccessResponse>
  implements iGetAttemptDataFromRequestBinSuccessResponse
{
  payload: Record<string, any>;

  constructor(data: iGetAttemptDataFromRequestBinSuccessResponse) {
    super();
    this.payload = data.payload;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iAddToIpfsPayload {
  /**
   * The stuff to add to IPFS
   */
  contents?: (iTokenMetadataDetails<NumberType> | iMetadata<NumberType> | iCollectionMetadataDetails<NumberType> | iChallengeDetails<NumberType>)[];

  method: 'ipfs' | 'centralized';
}

/**
 * @category API Requests / Responses
 */
export interface iAddToIpfsSuccessResponse {
  /**
   * An array of token metadata results, if applicable.
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
export interface iAddApprovalDetailsToOffChainStoragePayload {
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
    challengeInfoDetails?: iChallengeInfoDetailsUpdate<NumberType>[];
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
export interface iGetSignInChallengePayload {
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
export class GetSignInChallengePayload extends CustomTypeClass<GetSignInChallengePayload> implements iGetSignInChallengePayload {
  chain: SupportedChain;
  address: NativeAddress;

  constructor(payload: iGetSignInChallengePayload) {
    super();
    this.chain = payload.chain;
    this.address = payload.address;
  }

  static FromQuery(query: ParsedQs): GetSignInChallengePayload {
    return new GetSignInChallengePayload({
      chain: (query.chain?.toString() ?? '') as SupportedChain,
      address: (query.address?.toString() ?? '') as NativeAddress
    });
  }
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetSignInChallengeSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetSignInChallengeSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iVerifySignInPayload {
  /**
   * The original message that was signed.
   */
  message: SiwbbMessage;

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
export interface iCheckSignInStatusPayload {}

/**
 * @category API Requests / Responses
 */
export interface iCheckSignInStatusSuccessResponse {
  /**
   * Indicates whether the user is signed in.
   */
  signedIn: boolean;

  address: NativeAddress;
  bitbadgesAddress: BitBadgesAddress;
  chain: SupportedChain;

  /**
   * Approved scopes
   */
  scopes: OAuthScopeDetailsWithId[];

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
   * Signed in with Meetup?
   */
  meetup?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Bluesky?
   */
  bluesky?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Mailchimp?
   */
  mailchimp?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Facebook?
   */
  facebook?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with LinkedIn?
   */
  linkedIn?: {
    username: string;
    id: string;
  };

  /**
   * Signed in with Shopify?
   */
  shopify?: {
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

  /**
   * Signed in with Google Calendar?
   */
  googleCalendar?: {
    id: string;
    username: string;
  };
}

/**
 * @category API Requests / Responses
 */
export type OAuthScopeDetailsWithId = OAuthScopeDetails & {
  /**  Camel case version of the scope name. */
  scopeId: string;
};

/**
 * @inheritDoc iCheckSignInStatusSuccessResponse
 * @category API Requests / Responses
 */
export class CheckSignInStatusSuccessResponse extends CustomTypeClass<CheckSignInStatusSuccessResponse> implements iCheckSignInStatusSuccessResponse {
  signedIn: boolean;
  message: SiwbbMessage;
  scopes: OAuthScopeDetailsWithId[];
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
  googleCalendar?: { id: string; username: string } | undefined;
  twitch?: { id: string; username: string } | undefined;
  strava?: { username: string; id: string } | undefined;
  youtube?: { id: string; username: string } | undefined;
  reddit?: { username: string; id: string } | undefined;
  meetup?: { username: string; id: string } | undefined;
  bluesky?: { username: string; id: string } | undefined;
  mailchimp?: { username: string; id: string } | undefined;
  facebook?: { username: string; id: string } | undefined;
  telegram?: { username: string; id: string } | undefined;
  farcaster?: { username: string; id: string } | undefined;
  slack?: { username: string; id: string } | undefined;
  linkedIn?: { username: string; id: string } | undefined;
  shopify?: { username: string; id: string } | undefined;
  email?: string | undefined;
  address: string;
  bitbadgesAddress: string;
  chain: SupportedChain;

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
    this.meetup = data.meetup;
    this.facebook = data.facebook;
    this.bluesky = data.bluesky;
    this.mailchimp = data.mailchimp;
    this.googleCalendar = data.googleCalendar;

    this.telegram = data.telegram;
    this.farcaster = data.farcaster;
    this.slack = data.slack;
    this.email = data.email;
    this.linkedIn = data.linkedIn;
    this.shopify = data.shopify;
    this.address = data.address;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.chain = data.chain;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSignOutPayload {
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
  /** Sign out of Meetup */
  signOutMeetup?: boolean;
  /** Sign out of Bluesky */
  signOutBluesky?: boolean;
  /** Sign out of Mailchimp */
  signOutMailchimp?: boolean;
  /** Sign out of Google Calendar */
  signOutGoogleCalendar?: boolean;
  /** Sign out of Telegram */
  signOutTelegram?: boolean;
  /** Sign out of Farcaster */
  signOutFarcaster?: boolean;
  /** Sign out of Slack */
  signOutSlack?: boolean;
  /** Sign out of email */
  signOutEmail?: boolean;
  /** Sign out of Facebook */
  signOutFacebook?: boolean;
  /** Sign out of LinkedIn */
  signOutLinkedIn?: boolean;
  /** Sign out of Shopify */
  signOutShopify?: boolean;
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
export interface iGetBrowsePayload {
  type:
    | 'collections'
    | 'badges'
    | 'addressLists'
    | 'maps'
    | 'claims'
    | 'activity'
    | 'utilityPages'
    | 'applications'
    | 'claimActivity'
    | 'pointsActivity';
  category?: string;
  sortBy?: string;
  timeFrame?: string;
  searchTerm?: string;
  locale?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetBrowsePayload extends CustomTypeClass<GetBrowsePayload> implements iGetBrowsePayload {
  type:
    | 'collections'
    | 'badges'
    | 'addressLists'
    | 'maps'
    | 'claims'
    | 'activity'
    | 'utilityPages'
    | 'applications'
    | 'claimActivity'
    | 'pointsActivity';
  category?: string;
  sortBy?: string;
  timeFrame?: string;
  searchTerm?: string;
  locale?: string;

  constructor(payload: iGetBrowsePayload) {
    super();
    this.type = payload.type;
    this.category = payload.category;
    this.sortBy = payload.sortBy;
    this.timeFrame = payload.timeFrame;
    this.searchTerm = payload.searchTerm;
    this.locale = payload.locale;
  }

  static FromQuery(query: ParsedQs): GetBrowsePayload {
    return new GetBrowsePayload({
      type: query.type?.toString() as any,
      category: query.category?.toString(),
      sortBy: query.sortBy?.toString(),
      timeFrame: query.timeFrame?.toString(),
      searchTerm: query.searchTerm?.toString(),
      locale: query.locale?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetBrowseSuccessResponse<T extends NumberType> {
  collections: { [category: string]: iBitBadgesCollection<T>[] };
  profiles: { [category: string]: iBitBadgesUserInfo<T>[] };
  activity: iTransferActivityDoc<T>[];
  badges: {
    [category: string]: {
      collection: iBitBadgesCollection<T>;
      tokenIds: iUintRange<T>[];
    }[];
  };
  applications?: { [category: string]: iApplicationDoc<T>[] };
  maps: { [category: string]: iMapWithValues<T>[] };
  claims?: { [category: string]: iClaimDetails<T>[] };
  claimActivity?: iClaimActivityDoc<T>[];
  pointsActivity?: iPointsActivityDoc<T>[];
  utilityPages?: { [category: string]: iUtilityPageDoc<T>[] };
}

/**
 * @category API Requests / Responses
 */
export class GetBrowseSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBrowseSuccessResponse<T>>
  implements iGetBrowseSuccessResponse<T>
{
  collections: { [category: string]: BitBadgesCollection<T>[] };
  profiles: { [category: string]: BitBadgesUserInfo<T>[] };
  activity: TransferActivityDoc<T>[];
  badges: {
    [category: string]: {
      collection: BitBadgesCollection<T>;
      tokenIds: UintRangeArray<T>;
    }[];
  };
  applications?: { [category: string]: ApplicationDoc<T>[] };
  maps: { [category: string]: MapWithValues<T>[] };
  claims?: { [category: string]: ClaimDetails<T>[] };
  claimActivity?: ClaimActivityDoc<T>[];
  pointsActivity?: PointsActivityDoc<T>[];
  utilityPages?: { [category: string]: UtilityPageDoc<T>[] };

  constructor(data: iGetBrowseSuccessResponse<T>) {
    super();
    this.collections = Object.keys(data.collections).reduce(
      (acc, category) => {
        acc[category] = data.collections[category].map((collection) => new BitBadgesCollection(collection));
        return acc;
      },
      {} as { [category: string]: BitBadgesCollection<T>[] }
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
            tokenIds: UintRangeArray.From(badge.tokenIds)
          };
        });
        return acc;
      },
      {} as { [category: string]: { collection: BitBadgesCollection<T>; tokenIds: UintRangeArray<T> }[] }
    );
    this.applications = Object.keys(data.applications ?? {}).reduce(
      (acc, category) => {
        acc[category] = (data.applications ?? {})[category].map((group) => new ApplicationDoc(group));
        return acc;
      },
      {} as { [category: string]: ApplicationDoc<T>[] }
    );
    this.utilityPages = Object.keys(data.utilityPages ?? {}).reduce(
      (acc, category) => {
        acc[category] = (data.utilityPages ?? {})[category].map((utilityPage) => new UtilityPageDoc(utilityPage));
        return acc;
      },
      {} as { [category: string]: UtilityPageDoc<T>[] }
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
    this.pointsActivity = data.pointsActivity?.map((pointsActivity) => new PointsActivityDoc(pointsActivity));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetBrowseSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetBrowseSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export type iBroadcastTxPayload = BroadcastPostBody;

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
export type iSimulateTxPayload = BroadcastPostBody;

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
export interface iFetchMetadataDirectlyPayload {
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): FetchMetadataDirectlySuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as FetchMetadataDirectlySuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetTokensFromFaucetPayload {}

/**
 * @category API Requests / Responses
 */
export class GetTokensFromFaucetPayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetTokensFromFaucetSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class GetTokensFromFaucetSuccessResponse extends EmptyResponseClass {}

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
export interface iGenericVerifyAssetsPayload {
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
export interface iGenericBlockinVerifyPayload extends iVerifySignInPayload {
  /**
   * Additional options for verifying the challenge.
   */
  options?: VerifyChallengeOptions;
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
export interface iCreateSIWBBRequestPayload {
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

  /** Client ID for the SIWBB request. */
  client_id: string;

  /** Redirect URI if redirected after successful sign-in. */
  redirect_uri?: string;

  /** State to be passed back to the redirect URI. */
  state?: string;

  /** The code challenge for the SIWBB request. */
  code_challenge?: string;
  /** The code challenge method for the SIWBB request. */
  code_challenge_method?: 'S256' | 'plain';
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
export interface iRotateSIWBBRequestPayload {
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
export interface iGetSIWBBRequestsForDeveloperAppPayload {
  /** The bookmark for pagination. */
  bookmark?: string;
  /** The client ID to fetch for */
  clientId: string;

  //TODO: Add client secret to allow non-creator to fetch it?
}

/**
 * @category API Requests / Responses
 */
export class GetSIWBBRequestsForDeveloperAppPayload
  extends CustomTypeClass<GetSIWBBRequestsForDeveloperAppPayload>
  implements iGetSIWBBRequestsForDeveloperAppPayload
{
  bookmark?: string;
  clientId: string;

  constructor(payload: iGetSIWBBRequestsForDeveloperAppPayload) {
    super();
    this.bookmark = payload.bookmark;
    this.clientId = payload.clientId;
  }

  static FromQuery(query: ParsedQs): GetSIWBBRequestsForDeveloperAppPayload {
    return new GetSIWBBRequestsForDeveloperAppPayload({
      bookmark: query.bookmark?.toString(),
      clientId: query.clientId?.toString() ?? ''
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetSIWBBRequestsForDeveloperAppSuccessResponse<T extends NumberType> {
  siwbbRequests: iSIWBBRequestDoc<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetSIWBBRequestsForDeveloperAppSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSIWBBRequestsForDeveloperAppSuccessResponse<T>>
  implements iGetSIWBBRequestsForDeveloperAppSuccessResponse<T>
{
  siwbbRequests: SIWBBRequestDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetSIWBBRequestsForDeveloperAppSuccessResponse<T>) {
    super();
    this.siwbbRequests = data.siwbbRequests.map((SIWBBRequest) => new SIWBBRequestDoc(SIWBBRequest));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(
    convertFunction: (item: NumberType) => U,
    options?: ConvertOptions
  ): GetSIWBBRequestsForDeveloperAppSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetSIWBBRequestsForDeveloperAppSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iExchangeSIWBBAuthorizationCodePayload {
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

  /** The code verifier for the SIWBB request (if used with PKCE). */
  code_verifier?: string;
}

/**
 * @category API Requests / Responses
 */
export class ExchangeSIWBBAuthorizationCodeSuccessResponse<T extends NumberType> extends BaseNumberTypeClass<
  ExchangeSIWBBAuthorizationCodeSuccessResponse<T>
> {
  address: string;
  chain: SupportedChain;
  bitbadgesAddress: BitBadgesAddress;
  verificationResponse?: {
    success: boolean;
    errorMessage?: string;
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
  }

  getNumberFieldNames(): string[] {
    return ['access_token_expires_at', 'refresh_token_expires_at'];
  }

  convert<U extends NumberType>(
    convertFunction: (item: NumberType) => U,
    options?: ConvertOptions
  ): ExchangeSIWBBAuthorizationCodeSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as ExchangeSIWBBAuthorizationCodeSuccessResponse<U>;
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
export interface iDeleteSIWBBRequestPayload {
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
export interface iCreateDeveloperAppPayload {
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
export interface iGetActiveAuthorizationsPayload {}

/**
 * @category API Requests / Responses
 */
export class GetActiveAuthorizationsPayload extends EmptyResponseClass {
  static FromQuery(query: ParsedQs): GetActiveAuthorizationsPayload {
    return new GetActiveAuthorizationsPayload({});
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetActiveAuthorizationsSuccessResponse<T extends NumberType> {
  authorizations: iAccessTokenDoc[];
  /**
   * Developer app docs for each authorization.
   *
   * Undefined if deleted.
   */
  developerApps: (iDeveloperAppDoc<T> | undefined)[];
}

/**
 * @category API Requests / Responses
 */
export class GetActiveAuthorizationsSuccessResponse<T extends NumberType>
  extends CustomTypeClass<GetActiveAuthorizationsSuccessResponse<T>>
  implements iGetActiveAuthorizationsSuccessResponse<T>
{
  authorizations: AccessTokenDoc[];
  developerApps: (DeveloperAppDoc<T> | undefined)[];

  constructor(data: iGetActiveAuthorizationsSuccessResponse<T>) {
    super();
    this.authorizations = data.authorizations.map((authorization) => new AccessTokenDoc(authorization));
    this.developerApps = data.developerApps.map((developerApp) => (developerApp ? new DeveloperAppDoc(developerApp) : undefined));
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchDeveloperAppsPayload {
  /** Bookmark for pagination of the apps. Not compatible with clientId. */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class SearchDeveloperAppsPayload extends CustomTypeClass<SearchDeveloperAppsPayload> implements iSearchDeveloperAppsPayload {
  bookmark?: string;

  constructor(payload: iSearchDeveloperAppsPayload) {
    super();
    this.bookmark = payload.bookmark;
  }

  static FromQuery(query: ParsedQs): SearchDeveloperAppsPayload {
    return new SearchDeveloperAppsPayload({
      bookmark: query.bookmark?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetDeveloperAppPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetDeveloperAppSuccessResponse<T extends NumberType> {
  developerApp: iDeveloperAppDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetDeveloperAppSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetDeveloperAppSuccessResponse<T>>
  implements iGetDeveloperAppSuccessResponse<T>
{
  developerApp: DeveloperAppDoc<T>;

  constructor(data: iGetDeveloperAppSuccessResponse<T>) {
    super();
    this.developerApp = new DeveloperAppDoc(data.developerApp);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetDeveloperAppSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetDeveloperAppSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetDeveloperAppsPayload {
  /** If you want to get a specific app, specify the client ID here (will not return the client secret). */
  clientId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetDeveloperAppsSuccessResponse<T extends NumberType> {
  developerApps: iDeveloperAppDoc<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetDeveloperAppsSuccessResponse<T extends NumberType>
  extends CustomTypeClass<GetDeveloperAppsSuccessResponse<T>>
  implements iGetDeveloperAppsSuccessResponse<T>
{
  developerApps: DeveloperAppDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetDeveloperAppsSuccessResponse<T>) {
    super();
    this.developerApps = data.developerApps.map((developerApp) => new DeveloperAppDoc(developerApp));
    this.pagination = data.pagination;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchDeveloperAppsSuccessResponse<T extends NumberType> extends iGetDeveloperAppsSuccessResponse<T> {}

/**
 * @category API Requests / Responses
 */
export class SearchDeveloperAppsSuccessResponse<T extends NumberType>
  extends GetDeveloperAppsSuccessResponse<T>
  implements iSearchDeveloperAppsSuccessResponse<T>
{
  constructor(data: iSearchDeveloperAppsSuccessResponse<T>) {
    super(data);
  }
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteDeveloperAppPayload {
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
export interface iUpdateDeveloperAppPayload {
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

  /** The redirect URI for user inputs. */
  userInputRedirect?: {
    /** The base URI for user inputs. Note: This is experimental and not fully supported yet. */
    baseUri?: string;
    /** The tutorial URI for user inputs. */
    tutorialUri?: string;
  };

  userInputsSchema?: Array<JsonBodyInputSchema>;

  /** The redirect URI for claim creators. */
  claimCreatorRedirect?: {
    /** The tool URI for claim creators. Note: This is experimental and not fully supported yet. */
    toolUri?: string;
    /** The tutorial URI for claim creators. */
    tutorialUri?: string;
    /** The tester URI for claim creators. Note: This is experimental and not fully supported yet. */
    testerUri?: string;
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
    passYoutube?: boolean;
    passGithub?: boolean;
    passStrava?: boolean;
    passTwitch?: boolean;
    passReddit?: boolean;
    passMeetup?: boolean;
    passFacebook?: boolean;
    passTelegram?: boolean;
    passFarcaster?: boolean;
    passSlack?: boolean;
    passShopify?: boolean;
    passBluesky?: boolean;
    postProcessingJs: string;
  };

  /** Require BitBadges sign-in to use the plugin? */
  requireSignIn?: boolean;

  /** Custom details display for the plugin. Use {{publicParamKey}} to dynamically display the values of public parameters. */
  customDetailsDisplay?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iCreatePluginPayload {
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

  /** Locale that is supported by the plugin. By default, we assume 'en' is supported if not specified. */
  locale?: string;
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
export interface iUpdatePluginPayload {
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

  /** Locale that is supported by the plugin. By default, we assume 'en' is supported if not specified. */
  locale?: string;
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
export interface iDeletePluginPayload {
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
export interface iSearchPluginsPayload {
  /**
   * If true, we will fetch all plugins for the authenticated user (with plugin secrets).
   *
   * This will include plugins created by the signed in user and also those where they are explicitly approved / invited.
   */
  pluginsForSignedInUser?: boolean;
  /** Bookmark for pagination of the plugins (obtained from a previous call to this endpoint). */
  bookmark?: string;
  /** Search value */
  searchValue?: string;
  /** Locale to restrict results to. By default, we assume 'en'. This is not applicable if you specify createdPluginsOnly, speciifc pluginIds, or an invite code. */
  locale?: string;
}

/**
 * @category API Requests / Responses
 */
export class SearchPluginsPayload extends CustomTypeClass<SearchPluginsPayload> implements iSearchPluginsPayload {
  pluginsForSignedInUser?: boolean;
  bookmark?: string;
  searchValue?: string;
  locale?: string;

  constructor(payload: iSearchPluginsPayload) {
    super();
    this.pluginsForSignedInUser = payload.pluginsForSignedInUser;
    this.bookmark = payload.bookmark;
    this.searchValue = payload.searchValue;
    this.locale = payload.locale;
  }

  static FromQuery(query: ParsedQs): SearchPluginsPayload {
    return new SearchPluginsPayload({
      pluginsForSignedInUser: query.pluginsForSignedInUser === 'true',
      bookmark: query.bookmark?.toString(),
      searchValue: query.searchValue?.toString(),
      locale: query.locale?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginsPayload {
  /** If true, we will fetch only the specific plugin with the plugin ID (no secrets). */
  pluginIds: string[];
  /** Invite code to fetch the plugin with.  */
  inviteCode?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginPayload {}

/**
 * @category API Requests / Responses
 */
export interface iCreatePaymentIntentPayload {
  /** The amount in USD to pay */
  amount: number;
  /** Purpose of the payment */
  purpose: 'credits' | 'deposit';
  /** The affiliate code to use for the payment */
  affiliateCode?: string;
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
  plugin: iPluginDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetPluginSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetPluginSuccessResponse<T>>
  implements iGetPluginSuccessResponse<T>
{
  plugin: PluginDoc<T>;

  constructor(data: iGetPluginSuccessResponse<T>) {
    super();
    this.plugin = new PluginDoc(data.plugin);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetPluginSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetPluginSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginsSuccessResponse<T extends NumberType> {
  plugins: iPluginDoc<T>[];

  /** Bookmark for pagination of the plugins. Only applicable if fetching the directory. */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetPluginsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetPluginsSuccessResponse<T>>
  implements iGetPluginsSuccessResponse<T>
{
  plugins: PluginDoc<T>[];
  bookmark?: string;

  constructor(data: iGetPluginsSuccessResponse<T>) {
    super();
    this.plugins = data.plugins.map((developerApp) => new PluginDoc(developerApp));
    this.bookmark = data.bookmark;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetPluginsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetPluginsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchPluginsSuccessResponse<T extends NumberType> extends iGetPluginsSuccessResponse<T> {}

/**
 * @category API Requests / Responses
 */
export class SearchPluginsSuccessResponse<T extends NumberType> extends GetPluginsSuccessResponse<T> implements iSearchPluginsSuccessResponse<T> {
  constructor(data: iSearchPluginsSuccessResponse<T>) {
    super(data);
  }
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteClaimPayload {
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
export interface iUpdateClaimPayload {
  claims: UpdateClaimRequest<NumberType>[];
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
export interface iCreateClaimPayload {
  /**
   * The claims to create.
   *
   * By default, it will create standalone (non-test claims) or  collection linked claims if the
   * corresponding fields are specified in the claim.
   *
   * Note that collection / list linked claims require the proper permissions and have special setup
   * required.
   *
   * For test claims, you must specify the `testClaims` field to be true.
   */
  claims: CreateClaimRequest<NumberType>[];

  /**
   * Create test claims (e.g. the claim tester). Used for frontend testing. Test claims are auto-deleted
   * after the browser session is terminated and do not show up in search results.
   */
  testClaims?: boolean;
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
export interface iOauthRevokePayload {
  /** The OAuth token to revoke. */
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
export interface iGetGatedContentForClaimPayload {}

/**
 * @category API Requests / Responses
 */
export class GetGatedContentForClaimPayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetGatedContentForClaimSuccessResponse<T extends NumberType> {
  rewards: (iClaimReward<T> | undefined)[];
}

/**
 * @category API Requests / Responses
 */
export class GetGatedContentForClaimSuccessResponse<T extends NumberType>
  extends CustomTypeClass<GetGatedContentForClaimSuccessResponse<T>>
  implements iGetGatedContentForClaimSuccessResponse<T>
{
  rewards: (ClaimReward<T> | undefined)[];

  constructor(data: iGetGatedContentForClaimSuccessResponse<T>) {
    super();
    this.rewards = data.rewards.map((reward) => (reward ? new ClaimReward(reward) : undefined));
  }
}

/**
 * @category API Requests / Responses
 */
export interface iCreateDynamicDataStorePayload {
  /** The handler ID for the dynamic data store */
  handlerId: string;
  /** The label of the dynamic data store */
  label: string;
  /** Whether the dynamic data store should be public. If true, the data can be accessed without authentication. Defaults to false (private). */
  publicUseInClaims?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iCreateDynamicDataStoreSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType> {
  doc: iDynamicDataDoc<Q, T>;
}

/**
 * @category API Requests / Responses
 */
export class CreateDynamicDataStoreSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType>
  extends BaseNumberTypeClass<CreateDynamicDataStoreSuccessResponse<Q, T>>
  implements iCreateDynamicDataStoreSuccessResponse<Q, T>
{
  doc: DynamicDataDoc<Q, T>;

  constructor(data: iCreateDynamicDataStoreSuccessResponse<Q, T>) {
    super();
    this.doc = new DynamicDataDoc<Q, T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CreateDynamicDataStoreSuccessResponse<Q, U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CreateDynamicDataStoreSuccessResponse<Q, U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchDynamicDataStoresPayload {
  /** The pagination bookmark to start from */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class SearchDynamicDataStoresPayload extends CustomTypeClass<SearchDynamicDataStoresPayload> implements iSearchDynamicDataStoresPayload {
  bookmark?: string;

  constructor(payload: iSearchDynamicDataStoresPayload) {
    super();
    this.bookmark = payload.bookmark;
  }

  static FromQuery(query: ParsedQs): SearchDynamicDataStoresPayload {
    return new SearchDynamicDataStoresPayload({
      bookmark: query.bookmark?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataStoreValuesPaginatedPayload {
  /** The data secret to fetch. Only needed if you are not signed in as creator. Not applicable to public stores */
  dataSecret?: string;
  /** The pagination bookmark to start from */
  bookmark?: string;
  /** The lookup type to fetch (if you need to specify). */
  lookupType?: 'id' | 'username';
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataStoreValuesPaginatedSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType> {
  /** The lookup values for the dynamic data store */
  lookupValues: {
    /** The key of the lookup value */
    key: string;
    /** The lookup type of the lookup value */
    lookupType?: 'id' | 'username';
    /** Whether the lookup value is in the store */
    inStore: boolean;
  }[];

  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetDynamicDataStoreValuesPaginatedSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType>
  extends BaseNumberTypeClass<GetDynamicDataStoreValuesPaginatedSuccessResponse<Q, T>>
  implements iGetDynamicDataStoreValuesPaginatedSuccessResponse<Q, T>
{
  lookupValues: {
    key: string;
    lookupType?: 'id' | 'username';
    inStore: boolean;
  }[];

  pagination: PaginationInfo;

  constructor(data: iGetDynamicDataStoreValuesPaginatedSuccessResponse<Q, T>) {
    super();
    this.lookupValues = data.lookupValues;
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(
    convertFunction: (item: NumberType) => U,
    options?: ConvertOptions
  ): GetDynamicDataStoreValuesPaginatedSuccessResponse<Q, U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetDynamicDataStoreValuesPaginatedSuccessResponse<Q, U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataStoreValuePayload {
  /** The key to fetch. */
  key: string;
  /** The data secret to fetch. Only needed if you are not signed in as creator. Not applicable to public stores */
  dataSecret?: string;
  /** The lookup type to fetch (if you need to specify). */
  lookupType?: 'id' | 'username';
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataStoreValueSuccessResponse {
  key: string;
  lookupType?: 'id' | 'username';
  inStore: boolean;
}

/**
 * @category API Requests / Responses
 */
export class GetDynamicDataStoreValueSuccessResponse
  extends CustomTypeClass<GetDynamicDataStoreValueSuccessResponse>
  implements iGetDynamicDataStoreValueSuccessResponse
{
  key: string;
  lookupType?: 'id' | 'username';
  inStore: boolean;

  constructor(data: iGetDynamicDataStoreValueSuccessResponse) {
    super();
    this.key = data.key;
    this.lookupType = data.lookupType;
    this.inStore = data.inStore;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataStorePayload {
  /** The data secret to fetch. Only needed if you are not signed in as creator. Not applicable to public stores */
  dataSecret?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataStoreSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType> {
  doc: iDynamicDataDoc<Q, T>;
}

/**
 * @category API Requests / Responses
 */
export class GetDynamicDataStoreSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType>
  extends BaseNumberTypeClass<GetDynamicDataStoreSuccessResponse<Q, T>>
  implements iGetDynamicDataStoreSuccessResponse<Q, T>
{
  doc: DynamicDataDoc<Q, T>;

  constructor(data: iGetDynamicDataStoreSuccessResponse<Q, T>) {
    super();
    this.doc = new DynamicDataDoc<Q, T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetDynamicDataStoreSuccessResponse<Q, U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetDynamicDataStoreSuccessResponse<Q, U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataStoresPayload {
  /** The IDs to fetch. If not provided, all dynamic data stores will be fetched for the current signed in address without any data populated. */
  dynamicDataIds: string[];
  /** The data secret to fetch. Only needed if you are not signed in as creator. Not applicable to public stores */
  dataSecret?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataStoresSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType> {
  docs: (iDynamicDataDoc<Q, T> | undefined)[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export class GetDynamicDataStoresSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType>
  extends BaseNumberTypeClass<GetDynamicDataStoresSuccessResponse<Q, T>>
  implements iGetDynamicDataStoresSuccessResponse<Q, T>
{
  docs: (DynamicDataDoc<Q, T> | undefined)[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };

  constructor(data: iGetDynamicDataStoresSuccessResponse<Q, T>) {
    super();
    this.docs = data.docs.map((doc) => (doc ? new DynamicDataDoc<Q, T>(doc) : undefined));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetDynamicDataStoresSuccessResponse<Q, U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetDynamicDataStoresSuccessResponse<Q, U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchDynamicDataStoresSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType>
  extends iGetDynamicDataStoresSuccessResponse<Q, T> {}

/**
 * @category API Requests / Responses
 */
export class SearchDynamicDataStoresSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType>
  extends GetDynamicDataStoresSuccessResponse<Q, T>
  implements iSearchDynamicDataStoresSuccessResponse<Q, T>
{
  constructor(data: iSearchDynamicDataStoresSuccessResponse<Q, T>) {
    super(data);
  }
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateDynamicDataStorePayload {
  /** The dynamic data ID to update */
  dynamicDataId: string;
  /** Whether to rotate the data secret */
  rotateDataSecret?: boolean;
  /** The new label */
  label?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateDynamicDataStoreSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType> {
  doc: iDynamicDataDoc<Q, T>;
}

/**
 * @category API Requests / Responses
 */
export class UpdateDynamicDataStoreSuccessResponse<Q extends DynamicDataHandlerType, T extends NumberType>
  extends BaseNumberTypeClass<UpdateDynamicDataStoreSuccessResponse<Q, T>>
  implements iUpdateDynamicDataStoreSuccessResponse<Q, T>
{
  doc: DynamicDataDoc<Q, T>;

  constructor(data: iUpdateDynamicDataStoreSuccessResponse<Q, T>) {
    super();
    this.doc = new DynamicDataDoc<Q, T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UpdateDynamicDataStoreSuccessResponse<Q, U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UpdateDynamicDataStoreSuccessResponse<Q, U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteDynamicDataStorePayload {
  /** The dynamic data ID to delete */
  dynamicDataId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteDynamicDataStoreSuccessResponse {
  message: string;
}

/**
 * @category API Requests / Responses
 */
export class DeleteDynamicDataStoreSuccessResponse
  extends CustomTypeClass<DeleteDynamicDataStoreSuccessResponse>
  implements iDeleteDynamicDataStoreSuccessResponse
{
  message: string;

  constructor(data: iDeleteDynamicDataStoreSuccessResponse) {
    super();
    this.message = data.message;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iPerformStoreActionSingleWithBodyAuthPayload {
  /** Whether to simulate the action */
  _isSimulation?: boolean;
  /** The dynamic data ID */
  dynamicDataId: string;
  /** The data secret. Needed if you are not signed in as creator. Not applicable to public stores */
  dataSecret?: string;
  /** The name of the action to perform */
  actionName: string;
  /** The payload for this specific action */
  payload: iPerformStoreActionPayload;
}

/**
 * @category API Requests / Responses
 */
export interface iPerformStoreActionSingleWithBodyAuthSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class PerformStoreActionSingleWithBodyAuthSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iPerformStoreActionBatchWithBodyAuthPayload {
  /** Whether to simulate the action */
  _isSimulation?: boolean;
  /** The dynamic data ID */
  dynamicDataId: string;
  /** The data secret. Needed if you are not signed in as creator. Not applicable to public stores */
  dataSecret?: string;
  /** The actions to perform */
  actions: {
    /** The name of the action to perform */
    actionName: string;
    /** The payload for this specific action */
    payload: iPerformStoreActionPayload;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iPerformStoreActionBatchWithBodyAuthSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class PerformStoreActionBatchWithBodyAuthSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iPerformStoreActionPayload {
  /** Any custom payload data needed for the action */
  [key: string]: any;
}

/**
 * @category API Requests / Responses
 */
export interface iPerformStoreActionSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class PerformStoreActionSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iBatchStoreActionSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class BatchStoreActionSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetDynamicDataActivityPayload {
  /** The dynamic data ID to fetch activity for */
  dynamicDataId: string;
  /** The pagination bookmark to start from */
  bookmark?: string;
  /** The data secret to fetch activity for. Needed if you are not signed in as creator. Not applicable to public stores */
  dataSecret?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetDynamicDataActivityPayload extends CustomTypeClass<GetDynamicDataActivityPayload> implements iGetDynamicDataActivityPayload {
  dynamicDataId: string;
  bookmark?: string;
  dataSecret?: string;

  constructor(payload: iGetDynamicDataActivityPayload) {
    super();
    this.dynamicDataId = payload.dynamicDataId;
    this.bookmark = payload.bookmark;
    this.dataSecret = payload.dataSecret;
  }

  static FromQuery(query: ParsedQs): GetDynamicDataActivityPayload {
    return new GetDynamicDataActivityPayload({
      dynamicDataId: query.dynamicDataId?.toString() ?? '',
      bookmark: query.bookmark?.toString(),
      dataSecret: query.dataSecret?.toString() ?? ''
    });
  }
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
export interface iGetApiKeysPayload {
  /** The pagination bookmark to start from */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetApiKeysPayload extends CustomTypeClass<GetApiKeysPayload> implements iGetApiKeysPayload {
  bookmark?: string;

  constructor(payload: iGetApiKeysPayload) {
    super();
    this.bookmark = payload.bookmark;
  }

  static FromQuery(query: ParsedQs): GetApiKeysPayload {
    return new GetApiKeysPayload({
      bookmark: query.bookmark?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetApiKeysSuccessResponse {
  docs: iApiKeyDoc[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export class GetApiKeysSuccessResponse extends CustomTypeClass<GetApiKeysSuccessResponse> implements iGetApiKeysSuccessResponse {
  docs: ApiKeyDoc[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };

  constructor(data: iGetApiKeysSuccessResponse) {
    super();
    this.docs = data.docs.map((doc) => new ApiKeyDoc(doc));
    this.pagination = data.pagination;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iCreateApiKeyPayload {
  /** The label for the API key */
  label: string;
  /** The intended use for the API key */
  intendedUse: string;
}

/**
 * @category API Requests / Responses
 */
export interface iCreateApiKeySuccessResponse {
  key: string;
}

/**
 * @category API Requests / Responses
 */
export class CreateApiKeySuccessResponse extends CustomTypeClass<CreateApiKeySuccessResponse> implements iCreateApiKeySuccessResponse {
  key: string;

  constructor(data: iCreateApiKeySuccessResponse) {
    super();
    this.key = data.key;
  }
}
/**
 * @category API Requests / Responses
 */
export interface iRotateApiKeyPayload {
  /** The doc ID to rotate */
  docId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iRotateApiKeySuccessResponse {
  key: string;
}

/**
 * @category API Requests / Responses
 */
export class RotateApiKeySuccessResponse extends CustomTypeClass<RotateApiKeySuccessResponse> implements iRotateApiKeySuccessResponse {
  key: string;

  constructor(data: iRotateApiKeySuccessResponse) {
    super();
    this.key = data.key;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteApiKeyPayload {
  /** The API key to delete */
  key?: string;
  /** The doc ID to delete */
  _docId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteApiKeySuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteApiKeySuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iSearchApplicationsPayload {
  /** The search value to search for */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class SearchApplicationsPayload extends CustomTypeClass<SearchApplicationsPayload> implements iSearchApplicationsPayload {
  bookmark?: string;

  constructor(payload: iSearchApplicationsPayload) {
    super();
    this.bookmark = payload.bookmark;
  }

  static FromQuery(query: ParsedQs): SearchApplicationsPayload {
    return new SearchApplicationsPayload({
      bookmark: query.bookmark?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetApplicationPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetApplicationSuccessResponse<T extends NumberType> {
  application: iApplicationDoc<T> | undefined;
}

/**
 * @category API Requests / Responses
 */
export class GetApplicationSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetApplicationSuccessResponse<T>>
  implements iGetApplicationSuccessResponse<T>
{
  application: ApplicationDoc<T> | undefined;

  constructor(data: iGetApplicationSuccessResponse<T>) {
    super();
    this.application = data.application ? new ApplicationDoc<T>(data.application) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetApplicationSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetApplicationSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetApplicationsPayload {
  /** The specific IDs to fetch */
  applicationIds: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetApplicationsSuccessResponse<T extends NumberType> {
  docs: (iApplicationDoc<T> | undefined)[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export class GetApplicationsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetApplicationsSuccessResponse<T>>
  implements iGetApplicationsSuccessResponse<T>
{
  docs: (ApplicationDoc<T> | undefined)[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };

  constructor(data: iGetApplicationsSuccessResponse<T>) {
    super();
    this.docs = data.docs.map((doc) => (doc ? new ApplicationDoc<T>(doc) : undefined));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetApplicationsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetApplicationsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchApplicationsSuccessResponse<T extends NumberType> extends iGetApplicationsSuccessResponse<T> {}

/**
 * @category API Requests / Responses
 */
export class SearchApplicationsSuccessResponse<T extends NumberType>
  extends GetApplicationsSuccessResponse<T>
  implements iSearchApplicationsSuccessResponse<T>
{
  constructor(data: iSearchApplicationsSuccessResponse<T>) {
    super(data);
  }
}

/**
 * @category API Requests / Responses
 */
export interface iCreateApplicationPayload {
  /** The overall metadata for the application */
  metadata: iMetadataWithoutInternals<NumberType>;

  /** The pages in the application */
  pages: iApplicationPage<NumberType>[];
}

/**
 * @category API Requests / Responses
 */
export interface iCreateApplicationSuccessResponse<T extends NumberType> {
  doc: iApplicationDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class CreateApplicationSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<CreateApplicationSuccessResponse<T>>
  implements iCreateApplicationSuccessResponse<T>
{
  doc: ApplicationDoc<T>;

  constructor(data: iCreateApplicationSuccessResponse<T>) {
    super();
    this.doc = new ApplicationDoc<T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CreateApplicationSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CreateApplicationSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateApplicationPayload {
  /** The application ID to update */
  applicationId: string;

  /** The overall metadata for the application */
  metadata: iMetadataWithoutInternals<NumberType>;

  /** The pages in the application */
  pages: iApplicationPage<NumberType>[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateApplicationSuccessResponse<T extends NumberType> {
  doc: iApplicationDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class UpdateApplicationSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<UpdateApplicationSuccessResponse<T>>
  implements iUpdateApplicationSuccessResponse<T>
{
  doc: ApplicationDoc<T>;

  constructor(data: iUpdateApplicationSuccessResponse<T>) {
    super();
    this.doc = new ApplicationDoc<T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UpdateApplicationSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UpdateApplicationSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteApplicationPayload {
  /** The application ID to delete */
  applicationId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteApplicationSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteApplicationSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iCalculatePointsPayload {
  /** The application ID to calculate points for */
  applicationId: string;
  /** The page ID to calculate points for */
  pageId: string;
  /** The address to calculate points for */
  address?: NativeAddress;
  /** The pagination bookmark to start from */
  bookmark?: string;
  /** Skip the cache and calculate points from scratch */
  skipCache?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iPointsValue {
  address: BitBadgesAddress;
  points: number;
  lastCalculatedAt: number;
  claimSuccessCounts?: { [claimId: string]: number };
}

/**
 * @category API Requests / Responses
 */
export interface iCalculatePointsSuccessResponse {
  values: iPointsValue[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export class CalculatePointsSuccessResponse extends CustomTypeClass<CalculatePointsSuccessResponse> implements iCalculatePointsSuccessResponse {
  values: iPointsValue[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };

  constructor(data: iCalculatePointsSuccessResponse) {
    super();
    this.values = data.values;
    this.pagination = data.pagination;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPointsActivityPayload {
  /** The application ID to get points activity for */
  applicationId: string;
  /** The page ID to get points activity for */
  pageId: string;
  /** The pagination bookmark to start from */
  bookmark?: string;
  /** The specific address to get points activity for */
  address?: NativeAddress;
}

/**
 * @category API Requests / Responses
 */
export class GetPointsActivityPayload extends CustomTypeClass<GetPointsActivityPayload> implements iGetPointsActivityPayload {
  applicationId: string;
  pageId: string;
  bookmark?: string;
  address?: NativeAddress;

  constructor(payload: iGetPointsActivityPayload) {
    super();
    this.applicationId = payload.applicationId;
    this.pageId = payload.pageId;
    this.bookmark = payload.bookmark;
    this.address = payload.address;
  }

  static FromQuery(query: ParsedQs): GetPointsActivityPayload {
    return new GetPointsActivityPayload({
      applicationId: query.applicationId?.toString() ?? '',
      pageId: query.pageId?.toString() ?? '',
      bookmark: query.bookmark?.toString(),
      address: (query.address?.toString() ?? '') as NativeAddress
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPointsActivitySuccessResponse<T extends NumberType> {
  docs: iPointsActivityDoc<T>[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export class GetPointsActivitySuccessResponse<T extends NumberType>
  extends CustomTypeClass<GetPointsActivitySuccessResponse<T>>
  implements iGetPointsActivitySuccessResponse<T>
{
  docs: PointsActivityDoc<T>[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };

  constructor(data: iGetPointsActivitySuccessResponse<T>) {
    super();
    this.docs = data.docs.map((doc) => new PointsActivityDoc<T>(doc));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetPointsActivitySuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetPointsActivitySuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchUtilityPagesPayload {
  /** The pagination bookmark to start from */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class SearchUtilityPagesPayload extends CustomTypeClass<SearchUtilityPagesPayload> implements iSearchUtilityPagesPayload {
  bookmark?: string;

  constructor(payload: iSearchUtilityPagesPayload) {
    super();
    this.bookmark = payload.bookmark;
  }

  static FromQuery(query: ParsedQs): SearchUtilityPagesPayload {
    return new SearchUtilityPagesPayload({
      bookmark: query.bookmark?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetUtilityPagePayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetUtilityPageSuccessResponse<T extends NumberType> {
  listing: iUtilityPageDoc<T> | undefined;
}

/**
 * @category API Requests / Responses
 */
export class GetUtilityPageSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetUtilityPageSuccessResponse<T>>
  implements iGetUtilityPageSuccessResponse<T>
{
  listing: UtilityPageDoc<T> | undefined;

  constructor(data: iGetUtilityPageSuccessResponse<T>) {
    super();
    this.listing = data.listing ? new UtilityPageDoc<T>(data.listing) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetUtilityPageSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetUtilityPageSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetUtilityPagesPayload {
  /** The specific IDs to fetch */
  listingIds: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetUtilityPagesSuccessResponse<T extends NumberType> {
  docs: (iUtilityPageDoc<T> | undefined)[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export class GetUtilityPagesSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetUtilityPagesSuccessResponse<T>>
  implements iGetUtilityPagesSuccessResponse<T>
{
  docs: (UtilityPageDoc<T> | undefined)[];
  pagination: {
    bookmark: string;
    hasMore: boolean;
  };

  constructor(data: iGetUtilityPagesSuccessResponse<T>) {
    super();
    this.docs = data.docs.map((doc) => (doc ? new UtilityPageDoc<T>(doc) : undefined));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetUtilityPagesSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetUtilityPagesSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSearchUtilityPagesSuccessResponse<T extends NumberType> extends iGetUtilityPagesSuccessResponse<T> {}

/**
 * @category API Requests / Responses
 */
export class SearchUtilityPagesSuccessResponse<T extends NumberType>
  extends GetUtilityPagesSuccessResponse<T>
  implements iSearchUtilityPagesSuccessResponse<T>
{
  constructor(data: iSearchUtilityPagesSuccessResponse<T>) {
    super(data);
  }
}

/**
 * @category API Requests / Responses
 */
export interface iCreateUtilityPagePayload<T extends NumberType> {
  /** The overall metadata for the listing */
  metadata: iMetadataWithoutInternals<T>;

  /** The content for the listing */
  content: iUtilityPageContent[];

  /** The links for the listing */
  links: iUtilityPageLink<T>[];

  /** The type of the listing */
  type: string;

  /** The visibility of the listing */
  visibility: 'public' | 'private' | 'unlisted';

  /** The display times of the listing. Optionally specify when to show vs not show the listing. */
  displayTimes?: iUintRange<T>;

  /** The direct link for the listing. If specified, we will skip the entire content / listing page. Thus, content and links should be empty []. */
  directLink?: string;

  /** The categories of the listing */
  categories: string[];

  /** The details for if this listing is linked to a specific collection or list (displayed in Utility tab) */
  linkedTo?: iLinkedTo<T>;

  /** Where to inherit metadata from? Only one can be specified. */
  inheritMetadataFrom?: iInheritMetadataFrom<T>;

  /** Locale (ex: es, fr, etc.). If not specified, we assume en. */
  locale?: string;

  /** The estimated cost for this utility/service */
  estimatedCost?: iEstimatedCost<T>;

  /** The estimated time to complete or deliver this utility/service */
  estimatedTime?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iCreateUtilityPageSuccessResponse<T extends NumberType> {
  doc: iUtilityPageDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class CreateUtilityPageSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<CreateUtilityPageSuccessResponse<T>>
  implements iCreateUtilityPageSuccessResponse<T>
{
  doc: UtilityPageDoc<T>;

  constructor(data: iCreateUtilityPageSuccessResponse<T>) {
    super();
    this.doc = new UtilityPageDoc<T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CreateUtilityPageSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CreateUtilityPageSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateUtilityPagePayload<T extends NumberType> {
  /** The listing ID to update */
  listingId: string;

  /** The overall metadata for the listing */
  metadata: iMetadataWithoutInternals<T>;

  /** The content for the listing. This is only used for a dedicated listing page (not compatible with direct link or inherited metadata). */
  content: iUtilityPageContent[];

  /** The links for the listing. This is only used for a dedicated listing page (not compatible with direct link or inherited metadata). */
  links: iUtilityPageLink<T>[];

  /** The visibility of the listing */
  visibility: 'public' | 'private' | 'unlisted';

  /** The display times of the listing. Optionally specify when to show vs not show the listing. */
  displayTimes?: iUintRange<T>;

  /**
   * The direct link for the listing. If specified, we will skip the entire content / listing page. Thus, content and links should be empty [].
   *
   * This is incompatible with inherited metadata.
   */
  directLink?: string;

  /** The categories of the listing */
  categories: string[];

  /** The details for if this listing is linked to a specific collection or list (displayed in Utility tab) */
  linkedTo?: iLinkedTo<T>;

  /**
   * Where to inherit metadata from? Only one can be specified.
   *
   * If specified, we automatically override the metadata from what is specified and
   * automatically set a direct link to the page.
   *
   * Ex: Inherit claim metadata and direct link to the claim page.
   */
  inheritMetadataFrom?: iInheritMetadataFrom<T>;

  /** Locale (ex: es, fr, etc.). If not specified, we assume "en" (English). */
  locale?: string;

  /** The estimated cost for this utility/service */
  estimatedCost?: iEstimatedCost<T>;

  /** The estimated time to complete or deliver this utility/service */
  estimatedTime?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateUtilityPageSuccessResponse<T extends NumberType> {
  doc: iUtilityPageDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class UpdateUtilityPageSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<UpdateUtilityPageSuccessResponse<T>>
  implements iUpdateUtilityPageSuccessResponse<T>
{
  doc: UtilityPageDoc<T>;

  constructor(data: iUpdateUtilityPageSuccessResponse<T>) {
    super();
    this.doc = new UtilityPageDoc<T>(data.doc);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UpdateUtilityPageSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UpdateUtilityPageSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteUtilityPagePayload {
  /** The listing ID to delete */
  listingId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteUtilityPageSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeleteUtilityPageSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetPostActionStatusesPayload {}

/**
 * @category API Requests / Responses
 */
export class GetPostActionStatusesPayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetPostActionStatusesSuccessResponse {
  postActionStatuses: {
    lastFetchedAt: UNIXMilliTimestamp<NumberType>;
    claimId: string;
    bitbadgesAddress: string;
    pluginId: string;
    claimAttemptId: string;
    numRetries: NumberType;
    nextFetchTime: UNIXMilliTimestamp<NumberType>;
  }[];
}

/**
 * @category API Requests / Responses
 */
export class GetPostActionStatusesSuccessResponse
  extends CustomTypeClass<GetPostActionStatusesSuccessResponse>
  implements iGetPostActionStatusesSuccessResponse
{
  postActionStatuses: {
    lastFetchedAt: UNIXMilliTimestamp<NumberType>;
    claimId: string;
    bitbadgesAddress: string;
    pluginId: string;
    claimAttemptId: string;
    numRetries: NumberType;
    nextFetchTime: UNIXMilliTimestamp<NumberType>;
  }[];

  constructor(data: iGetPostActionStatusesSuccessResponse) {
    super();
    this.postActionStatuses = data.postActionStatuses;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginErrorsPayload {
  /** The plugin ID to get errors for */
  pluginId: string;
  /** The pagination bookmark to start from */
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetPluginErrorsPayload extends CustomTypeClass<GetPluginErrorsPayload> implements iGetPluginErrorsPayload {
  pluginId: string;
  bookmark?: string;

  constructor(payload: iGetPluginErrorsPayload) {
    super();
    this.pluginId = payload.pluginId;
    this.bookmark = payload.bookmark;
  }

  static FromQuery(query: ParsedQs): GetPluginErrorsPayload {
    return new GetPluginErrorsPayload({
      pluginId: query.pluginId?.toString() ?? '',
      bookmark: query.bookmark?.toString()
    });
  }
}

export interface PluginErrorDoc {
  _docId: string;
  _id?: string;
  pluginId: string;
  timestamp: number;
  error: string;
  context?: Record<string, any>;
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginErrorsSuccessResponse {
  docs: PluginErrorDoc[];
  bookmark?: string;
  total?: number;
}

/**
 * @category API Requests / Responses
 */
export class GetPluginErrorsSuccessResponse extends CustomTypeClass<GetPluginErrorsSuccessResponse> implements iGetPluginErrorsSuccessResponse {
  docs: PluginErrorDoc[];
  bookmark?: string;
  total?: number;

  constructor(data: iGetPluginErrorsSuccessResponse) {
    super();
    this.docs = data.docs;
    this.bookmark = data.bookmark;
    this.total = data.total;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iScheduleTokenRefreshPayload {
  provider: string;
  claimId?: string;
  instanceId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iScheduleTokenRefreshSuccessResponse {
  message: string;
  docId: string;
}

/**
 * @category API Requests / Responses
 */
export class ScheduleTokenRefreshSuccessResponse
  extends CustomTypeClass<ScheduleTokenRefreshSuccessResponse>
  implements iScheduleTokenRefreshSuccessResponse
{
  message: string;
  docId: string;

  constructor(data: iScheduleTokenRefreshSuccessResponse) {
    super();
    this.message = data.message;
    this.docId = data.docId;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iCheckClaimSuccessPayload {}

/**
 * @category API Requests / Responses
 */
export class CheckClaimSuccessPayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iCheckClaimSuccessSuccessResponse {
  successCount: number;
  /** If indexed, the claim numbers that were successfully completed (zero-based) */
  claimNumbers?: number[];
}

/**
 * @category API Requests / Responses
 */
export class CheckClaimSuccessSuccessResponse extends CustomTypeClass<CheckClaimSuccessSuccessResponse> implements iCheckClaimSuccessSuccessResponse {
  successCount: number;
  claimNumbers?: number[];

  constructor(data: iCheckClaimSuccessSuccessResponse) {
    super();
    this.successCount = data.successCount;
    this.claimNumbers = data.claimNumbers;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionAmountTrackerByIdPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionAmountTrackerByIdSuccessResponse<T extends NumberType> {
  amountTracker: iApprovalTrackerDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionAmountTrackerByIdSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionAmountTrackerByIdSuccessResponse<T>>
  implements iGetCollectionAmountTrackerByIdSuccessResponse<T>
{
  amountTracker: ApprovalTrackerDoc<T>;

  constructor(data: iGetCollectionAmountTrackerByIdSuccessResponse<T>) {
    super();
    this.amountTracker = new ApprovalTrackerDoc(data.amountTracker);
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionAmountTrackerByIdSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionAmountTrackerByIdSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionChallengeTrackerByIdPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionChallengeTrackerByIdSuccessResponse<T extends NumberType> {
  challengeTracker: iApprovalTrackerDoc<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionChallengeTrackerByIdSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionChallengeTrackerByIdSuccessResponse<T>>
  implements iGetCollectionChallengeTrackerByIdSuccessResponse<T>
{
  challengeTracker: ApprovalTrackerDoc<T>;

  constructor(data: iGetCollectionChallengeTrackerByIdSuccessResponse<T>) {
    super();
    this.challengeTracker = new ApprovalTrackerDoc(data.challengeTracker);
  }

  convert<U extends NumberType>(
    convertFunction: (val: NumberType) => U,
    options?: ConvertOptions
  ): GetCollectionChallengeTrackerByIdSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionChallengeTrackerByIdSuccessResponse<U>;
  }
}
