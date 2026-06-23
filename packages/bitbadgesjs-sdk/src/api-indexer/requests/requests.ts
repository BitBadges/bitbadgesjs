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
  ApprovalItemDoc,
  ApprovalTrackerDoc,
  BalanceDoc,
  BalanceDocWithDetails,
  DeveloperAppDoc,
  DynamicDataDoc,
  DynamicStoreDocWithDetails,
  DynamicStoreValueDoc,
  NotificationDoc,
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
  iApprovalItemDoc,
  iApprovalTrackerDoc,
  iBalanceDoc,
  iBalanceDocWithDetails,
  iClaimActivityDoc,
  iDynamicDataDoc,
  iDynamicStoreDocWithDetails,
  iDynamicStoreValueDoc,
  iEstimatedCost,
  iInheritMetadataFrom,
  iLinkedTo,
  iNotificationDoc,
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
  type NotificationType,
  type OAuthScopeDetails,
  type PluginPresetType,
  type SiwbbMessage,
  type UNIXMilliTimestamp,
  type iAccessTokenDoc,
  type iClaimDetails,
  type iClaimReward,
  type iDeveloperAppDoc,
  type iPluginDoc,
  type iPromptSkillDoc,
  type iStatusDoc,
  type iTransferActivityDoc
} from '@/api-indexer/docs-types/interfaces.js';
import type { iMetadata, iMetadataWithoutInternals } from '@/api-indexer/metadata/metadata.js';
import { Metadata } from '@/api-indexer/metadata/metadata.js';
import type { iCollectionMetadataDetails, iTokenMetadataDetails } from '@/api-indexer/metadata/tokenMetadata.js';
import type { AssetConditionGroup, ChallengeParams, VerifyChallengeOptions } from '@/blockin/index.js';
import { BaseNumberTypeClass, ConvertOptions, CustomTypeClass, ParsedQs, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import { type NumberType } from '@/common/string-numbers.js';
import type { SupportedChain } from '@/common/types.js';
import { ClaimDetails, iChallengeDetails, iChallengeInfoDetailsUpdate } from '@/core/approvals.js';
import type { iLiquidityPoolInfoDoc } from '@/gamm/indexer.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import type { iBatchTokenDetails } from '@/core/batch-utils.js';
import { VerifySIWBBOptions, iSiwbbChallenge } from '@/core/blockin.js';
import { UintRangeArray } from '@/core/uintRanges.js';
import type { CollectionId, iUintRange } from '@/interfaces/index.js';
import { BroadcastPostBody } from '@/node-rest-api/index.js';
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
  noTokens?: boolean;
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
  noTokens?: boolean;
  noMaps?: boolean;
  noApplications?: boolean;
  noClaims?: boolean;
  specificCollectionId?: CollectionId;

  constructor(payload: iGetSearchPayload<T>) {
    super();
    this.noCollections = payload.noCollections;
    this.noAccounts = payload.noAccounts;
    this.noTokens = payload.noTokens;
    this.noMaps = payload.noMaps;
    this.noApplications = payload.noApplications;
    this.noClaims = payload.noClaims;
    this.specificCollectionId = payload.specificCollectionId;
  }

  static FromQuery(query: ParsedQs): GetSearchPayload<NumberType> {
    return new GetSearchPayload<NumberType>({
      noCollections: query.noCollections === 'true',
      noAccounts: query.noAccounts === 'true',
      noTokens: query.noTokens === 'true',
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
  tokens: {
    collection: iBitBadgesCollection<T>;
    tokenIds: iUintRange<T>[];
  }[];
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
  tokens: {
    collection: BitBadgesCollection<T>;
    tokenIds: UintRangeArray<T>;
  }[];
  claims?: ClaimDetails<T>[];
  utilityPages?: UtilityPageDoc<T>[];

  constructor(data: iGetSearchSuccessResponse<T>) {
    super();
    this.collections = data.collections.map((collection) => new BitBadgesCollection(collection));
    this.accounts = data.accounts.map((account) => new BitBadgesUserInfo(account));
    this.tokens = data.tokens.map((token) => {
      return {
        collection: new BitBadgesCollection(token.collection),
        tokenIds: UintRangeArray.From(token.tokenIds)
      };
    });
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
}

/**
 * @category API Requests / Responses
 */
export class GetClaimAttemptsPayload extends CustomTypeClass<GetClaimAttemptsPayload> implements iGetClaimAttemptsPayload {
  bookmark?: string;
  includeErrors?: boolean;
  address?: NativeAddress;

  constructor(payload: iGetClaimAttemptsPayload) {
    super();
    this.bookmark = payload.bookmark;
    this.includeErrors = payload.includeErrors;
    this.address = payload.address;
  }

  static FromQuery(query: ParsedQs): GetClaimAttemptsPayload {
    return new GetClaimAttemptsPayload({
      bookmark: query.bookmark?.toString(),
      includeErrors: query.includeErrors === 'true',
      address: query.address?.toString()
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

  constructor(data: iClaimAttempt<T>) {
    super();
    this.success = data.success;
    this.attemptedAt = data.attemptedAt;
    this.claimId = data.claimId;
    this.bitbadgesAddress = data.bitbadgesAddress;
    this.claimAttemptId = data.claimAttemptId;
    this.claimNumber = data.claimNumber;
    this.error = data.error;
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
    preferences?: { transferActivity?: boolean; ignoreIfInitiator?: boolean; signInAlertsEnabled?: boolean };
  };

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
export interface iGetNotificationsPayload {
  /** Pagination bookmark from a prior response. */
  bookmark?: string;
  /** If true, only return unread notifications. */
  unreadOnly?: boolean;
  /** If set, only return notifications of these types. */
  types?: NotificationType[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetNotificationsSuccessResponse<T extends NumberType> {
  /** The notifications for the signed-in user, newest first. */
  notifications: iNotificationDoc<T>[];
  /** Pagination info for fetching the next page. */
  pagination: PaginationInfo;
}

/**
 * @inheritDoc iGetNotificationsSuccessResponse
 * @category API Requests / Responses
 */
export class GetNotificationsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetNotificationsSuccessResponse<T>>
  implements iGetNotificationsSuccessResponse<T>
{
  notifications: NotificationDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetNotificationsSuccessResponse<T>) {
    super();
    this.notifications = data.notifications.map((doc) => new NotificationDoc(doc));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetNotificationsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetNotificationsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetUnreadNotificationCountPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetUnreadNotificationCountSuccessResponse {
  /** The number of unread notifications for the signed-in user. */
  count: number;
}

/**
 * @category API Requests / Responses
 */
export class GetUnreadNotificationCountSuccessResponse
  extends CustomTypeClass<GetUnreadNotificationCountSuccessResponse>
  implements iGetUnreadNotificationCountSuccessResponse
{
  count: number;

  constructor(data: iGetUnreadNotificationCountSuccessResponse) {
    super();
    this.count = data.count;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iMarkNotificationsReadPayload {
  /** Specific notification ids to mark read. Ignored if `all` is true. */
  notificationIds?: string[];
  /** Mark every notification read. */
  all?: boolean;
  /** Mark as read (default true) or unread (false). */
  read?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iMarkNotificationsReadSuccessResponse {
  /** The number of notifications updated. */
  updated: number;
}

/**
 * @category API Requests / Responses
 */
export class MarkNotificationsReadSuccessResponse
  extends CustomTypeClass<MarkNotificationsReadSuccessResponse>
  implements iMarkNotificationsReadSuccessResponse
{
  updated: number;

  constructor(data: iMarkNotificationsReadSuccessResponse) {
    super();
    this.updated = data.updated;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateNotificationPreferencesPayload {
  /** The in-app notification preferences to set. Only provided keys are updated. */
  preferences: {
    inAppEnabled?: boolean;
    inAppTransferActivity?: boolean;
    inAppClaimActivity?: boolean;
    ignoreIfInitiator?: boolean;
  };
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateNotificationPreferencesSuccessResponse {
  success: boolean;
}

/**
 * @category API Requests / Responses
 */
export class UpdateNotificationPreferencesSuccessResponse
  extends CustomTypeClass<UpdateNotificationPreferencesSuccessResponse>
  implements iUpdateNotificationPreferencesSuccessResponse
{
  success: boolean;

  constructor(data: iUpdateNotificationPreferencesSuccessResponse) {
    super();
    this.success = data.success;
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
export interface iVerifySignInSuccessResponse {
  /**
   * Optional informational message returned by the indexer.
   */
  message?: string;
}

/**
 * @inheritDoc iVerifySignInSuccessResponse
 * @category API Requests / Responses
 */
export class VerifySignInSuccessResponse extends CustomTypeClass<VerifySignInSuccessResponse> implements iVerifySignInSuccessResponse {
  message?: string;

  constructor(data: iVerifySignInSuccessResponse) {
    super();
    this.message = data.message;
  }
}

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
    | 'tokens'
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
    | 'tokens'
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
  tokens: {
    [category: string]: {
      collection: iBitBadgesCollection<T>;
      tokenIds: iUintRange<T>[];
    }[];
  };
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
  tokens: {
    [category: string]: {
      collection: BitBadgesCollection<T>;
      tokenIds: UintRangeArray<T>;
    }[];
  };
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
    this.tokens = Object.keys(data.tokens).reduce(
      (acc, category) => {
        acc[category] = data.tokens[category].map((token) => {
          return {
            collection: new BitBadgesCollection(token.collection),
            tokenIds: UintRangeArray.From(token.tokenIds)
          };
        });
        return acc;
      },
      {} as { [category: string]: { collection: BitBadgesCollection<T>; tokenIds: UintRangeArray<T> }[] }
    );
    this.utilityPages = Object.keys(data.utilityPages ?? {}).reduce(
      (acc, category) => {
        acc[category] = (data.utilityPages ?? {})[category].map((utilityPage) => new UtilityPageDoc(utilityPage));
        return acc;
      },
      {} as { [category: string]: UtilityPageDoc<T>[] }
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

  /** This means that the plugin can be used w/o any session cookies or authentication. */
  requiresSessions: boolean;

  userInputsSchema?: Array<JsonBodyInputSchema>;
  publicParamsSchema?: Array<JsonBodyInputSchema>;
  privateParamsSchema?: Array<JsonBodyInputSchema>;

  /** The verification URL */
  verificationCall?: {
    uri: string;
    hardcodedInputs: Array<JsonBodyInputWithValue>;
    passAddress?: boolean;
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

  /** Rotate the plugin secret? */
  rotatePluginSecret?: boolean;

  /** Update an existing version */
  versionUpdates?: {
    /** The version to update */
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
  /** Bookmark for pagination of the plugins (obtained from a previous call to this endpoint). */
  bookmark?: string;
  /** Search value to filter by plugin name. */
  searchValue?: string;
  /** Locale to restrict results to. By default, we assume 'en'. */
  locale?: string;
}

/**
 * @category API Requests / Responses
 */
export class SearchPluginsPayload extends CustomTypeClass<SearchPluginsPayload> implements iSearchPluginsPayload {
  bookmark?: string;
  searchValue?: string;
  locale?: string;

  constructor(payload: iSearchPluginsPayload) {
    super();
    this.bookmark = payload.bookmark;
    this.searchValue = payload.searchValue;
    this.locale = payload.locale;
  }

  static FromQuery(query: ParsedQs): SearchPluginsPayload {
    return new SearchPluginsPayload({
      bookmark: query.bookmark?.toString(),
      searchValue: query.searchValue?.toString(),
      locale: query.locale?.toString()
    });
  }
}

/**
 * Payload for fetching all plugins created/managed by a specific address.
 *
 * Set `returnSensitiveData` to include sensitive fields (pluginSecret). This requires authentication as the creator address.
 * Without the flag, sensitive data is always stripped regardless of authentication.
 *
 * @category API Requests / Responses
 */
export interface iGetCreatorPluginsPayload {
  /** The address of the plugin creator to query. */
  creatorAddress: string;
  /** Bookmark for pagination. */
  bookmark?: string;
  /** If true, include sensitive data (pluginSecret) in the response. Requires authentication as the creator. */
  returnSensitiveData?: boolean;
}

/**
 * @category API Requests / Responses
 */
export class GetCreatorPluginsPayload extends CustomTypeClass<GetCreatorPluginsPayload> implements iGetCreatorPluginsPayload {
  creatorAddress: string;
  bookmark?: string;
  returnSensitiveData?: boolean;

  constructor(payload: iGetCreatorPluginsPayload) {
    super();
    this.creatorAddress = payload.creatorAddress;
    this.bookmark = payload.bookmark;
    this.returnSensitiveData = payload.returnSensitiveData;
  }

  static FromQuery(query: ParsedQs): GetCreatorPluginsPayload {
    return new GetCreatorPluginsPayload({
      creatorAddress: query.creatorAddress?.toString() ?? '',
      bookmark: query.bookmark?.toString(),
      returnSensitiveData: query.returnSensitiveData === 'true'
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginsPayload {
  /** The plugin IDs to fetch. */
  pluginIds: string[];
  /** If true, include sensitive data (pluginSecret) for plugins you own. Requires authentication. */
  returnSensitiveData?: boolean;
}

/**
 * @category API Requests / Responses
 */
export class GetPluginsPayload extends CustomTypeClass<GetPluginsPayload> implements iGetPluginsPayload {
  pluginIds: string[];
  returnSensitiveData?: boolean;

  constructor(payload: iGetPluginsPayload) {
    super();
    this.pluginIds = payload.pluginIds;
    this.returnSensitiveData = payload.returnSensitiveData;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPluginPayload {}

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

/**
 * Get Swap Activities
 * Route: GET /api/:version/swapActivities
 * @category API Requests / Responses
 */
export interface iGetSwapActivitiesPayload {
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetSwapActivitiesPayload extends CustomTypeClass<GetSwapActivitiesPayload> implements iGetSwapActivitiesPayload {
  bookmark?: string;

  constructor(data: iGetSwapActivitiesPayload = {}) {
    super();
    this.bookmark = data.bookmark;
  }

  static FromQuery(query: ParsedQs): GetSwapActivitiesPayload {
    return new GetSwapActivitiesPayload({
      bookmark: query.bookmark?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetSwapActivitiesSuccessResponse<T extends NumberType> {
  swapActivities: Array<{
    _docId: string;
    blockHeight: T;
    timestamp: T;
    txHash: string;
    [key: string]: any;
  }>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetSwapActivitiesSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSwapActivitiesSuccessResponse<T>>
  implements iGetSwapActivitiesSuccessResponse<T>
{
  swapActivities: Array<{
    _docId: string;
    blockHeight: T;
    timestamp: T;
    txHash: string;
    [key: string]: any;
  }>;
  pagination: PaginationInfo;

  constructor(data: iGetSwapActivitiesSuccessResponse<T>) {
    super();
    this.swapActivities = data.swapActivities;
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetSwapActivitiesSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetSwapActivitiesSuccessResponse<U>;
  }
}

/**
 * Get On-Chain Dynamic Store by ID
 * Route: GET /api/:version/onChainDynamicStore/:storeId
 * @category API Requests / Responses
 */
export interface iGetOnChainDynamicStorePayload {
  // No query parameters - storeId is in path
}

/**
 * @category API Requests / Responses
 */
export class GetOnChainDynamicStorePayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetOnChainDynamicStoreSuccessResponse<T extends NumberType> {
  store: iDynamicStoreDocWithDetails<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetOnChainDynamicStoreSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetOnChainDynamicStoreSuccessResponse<T>>
  implements iGetOnChainDynamicStoreSuccessResponse<T>
{
  store: DynamicStoreDocWithDetails<T>;

  constructor(data: iGetOnChainDynamicStoreSuccessResponse<T>) {
    super();
    this.store = new DynamicStoreDocWithDetails(data.store);
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetOnChainDynamicStoreSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetOnChainDynamicStoreSuccessResponse<U>;
  }
}

/**
 * Get On-Chain Dynamic Stores by Creator
 * Route: GET /api/:version/onChainDynamicStores/by-creator/:address
 * @category API Requests / Responses
 */
export interface iGetOnChainDynamicStoresByCreatorPayload {
  // No query parameters - address is in path
}

/**
 * @category API Requests / Responses
 */
export class GetOnChainDynamicStoresByCreatorPayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetOnChainDynamicStoresByCreatorSuccessResponse<T extends NumberType> {
  stores: iDynamicStoreDocWithDetails<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetOnChainDynamicStoresByCreatorSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetOnChainDynamicStoresByCreatorSuccessResponse<T>>
  implements iGetOnChainDynamicStoresByCreatorSuccessResponse<T>
{
  stores: DynamicStoreDocWithDetails<T>[];

  constructor(data: iGetOnChainDynamicStoresByCreatorSuccessResponse<T>) {
    super();
    this.stores = data.stores.map((store) => new DynamicStoreDocWithDetails(store));
  }

  convert<U extends NumberType>(
    convertFunction: (val: NumberType) => U,
    options?: ConvertOptions
  ): GetOnChainDynamicStoresByCreatorSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetOnChainDynamicStoresByCreatorSuccessResponse<U>;
  }
}

/**
 * Get On-Chain Dynamic Store Value
 * Route: GET /api/:version/onChainDynamicStore/:storeId/value/:address
 * @category API Requests / Responses
 */
export interface iGetOnChainDynamicStoreValuePayload {
  // No query parameters - storeId and address are in path
}

/**
 * @category API Requests / Responses
 */
export class GetOnChainDynamicStoreValuePayload extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iGetOnChainDynamicStoreValueSuccessResponse<T extends NumberType> extends iDynamicStoreValueDoc<T> {}

/**
 * @category API Requests / Responses
 */
export class GetOnChainDynamicStoreValueSuccessResponse<T extends NumberType>
  extends DynamicStoreValueDoc<T>
  implements iGetOnChainDynamicStoreValueSuccessResponse<T>
{
  constructor(data: iGetOnChainDynamicStoreValueSuccessResponse<T>) {
    super(data);
  }
}

/**
 * Get On-Chain Dynamic Store Values (Paginated)
 * Route: GET /api/:version/onChainDynamicStore/:storeId/values
 * @category API Requests / Responses
 */
export interface iGetOnChainDynamicStoreValuesPaginatedPayload {
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class GetOnChainDynamicStoreValuesPaginatedPayload
  extends CustomTypeClass<GetOnChainDynamicStoreValuesPaginatedPayload>
  implements iGetOnChainDynamicStoreValuesPaginatedPayload
{
  bookmark?: string;

  constructor(data: iGetOnChainDynamicStoreValuesPaginatedPayload = {}) {
    super();
    this.bookmark = data.bookmark;
  }

  static FromQuery(query: ParsedQs): GetOnChainDynamicStoreValuesPaginatedPayload {
    return new GetOnChainDynamicStoreValuesPaginatedPayload({
      bookmark: query.bookmark?.toString()
    });
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetOnChainDynamicStoreValuesPaginatedSuccessResponse<T extends NumberType> {
  values: iDynamicStoreValueDoc<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetOnChainDynamicStoreValuesPaginatedSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetOnChainDynamicStoreValuesPaginatedSuccessResponse<T>>
  implements iGetOnChainDynamicStoreValuesPaginatedSuccessResponse<T>
{
  values: DynamicStoreValueDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetOnChainDynamicStoreValuesPaginatedSuccessResponse<T>) {
    super();
    this.values = data.values.map((value) => new DynamicStoreValueDoc(value));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(
    convertFunction: (val: NumberType) => U,
    options?: ConvertOptions
  ): GetOnChainDynamicStoreValuesPaginatedSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetOnChainDynamicStoreValuesPaginatedSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iCreatePromptSkillPayload {
  promptText: string;
  name: string;
  image: string;
  description: string;
  category: string;
  tags: string[];
  toPublish?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iCreatePromptSkillSuccessResponse {
  promptSkillId: string;
}

/**
 * @category API Requests / Responses
 */
export class CreatePromptSkillSuccessResponse extends CustomTypeClass<CreatePromptSkillSuccessResponse> implements iCreatePromptSkillSuccessResponse {
  promptSkillId: string;
  constructor(data: iCreatePromptSkillSuccessResponse) {
    super();
    this.promptSkillId = data.promptSkillId;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iUpdatePromptSkillPayload {
  promptSkillId: string;
  promptText?: string;
  name?: string;
  image?: string;
  description?: string;
  category?: string;
  tags?: string[];
  toPublish?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iUpdatePromptSkillSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdatePromptSkillSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iDeletePromptSkillPayload {
  promptSkillId: string;
}

/**
 * @category API Requests / Responses
 */
export interface iDeletePromptSkillSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class DeletePromptSkillSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iSearchPromptSkillsPayload {
  searchValue?: string;
  category?: string;
  bookmark?: string;
  creatorAddress?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iSearchPromptSkillsSuccessResponse {
  promptSkills: iPromptSkillDoc[];
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export class SearchPromptSkillsSuccessResponse extends CustomTypeClass<SearchPromptSkillsSuccessResponse> implements iSearchPromptSkillsSuccessResponse {
  promptSkills: iPromptSkillDoc[];
  bookmark?: string;

  constructor(data: iSearchPromptSkillsSuccessResponse) {
    super();
    this.promptSkills = data.promptSkills;
    this.bookmark = data.bookmark;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skip:Go passthrough types (cross-chain swap routing).
//
// The indexer proxies a subset of Skip:Go endpoints
// (https://docs.skip.build/go/api-reference/prod). Payload + response
// shapes mirror the upstream Skip:Go API verbatim — kept as loose
// `Record<string, unknown>` / `[key: string]: any` index signatures
// because Skip:Go evolves its schema independently of BitBadges and we
// don't want to break SDK consumers when they add a field.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get Skip Assets
 * Route: GET /api/v0/skip/assets
 * @category API Requests / Responses
 */
export interface iGetSkipAssetsPayload {
  /** Include Solana / SVM chain assets. Defaults to false. */
  includeSvm?: boolean;
  /** Include CW20 token assets. Defaults to false. */
  includeCw20?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSkipAssetsSuccessResponse {
  /** Map of chain_id → assets payload (mirrors Skip:Go /v2/fungible/assets). */
  chain_to_assets_map: Record<string, unknown>;
}

/**
 * @category API Requests / Responses
 */
export class GetSkipAssetsSuccessResponse extends CustomTypeClass<GetSkipAssetsSuccessResponse> implements iGetSkipAssetsSuccessResponse {
  chain_to_assets_map: Record<string, unknown>;

  constructor(data: iGetSkipAssetsSuccessResponse) {
    super();
    this.chain_to_assets_map = data.chain_to_assets_map;
  }
}

/**
 * Get Skip Chains
 * Route: GET /api/v0/skip/chains
 * @category API Requests / Responses
 */
export interface iGetSkipChainsPayload {
  /** Include Solana / SVM chains. Defaults to false. */
  includeSvm?: boolean;
  /** Return testnets only. Defaults to false. */
  onlyTestnets?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSkipChainsSuccessResponse {
  /** Chain entries (mirrors Skip:Go /v2/info/chains). */
  chains: Array<{
    chain_id: string;
    [key: string]: unknown;
  }>;
}

/**
 * @category API Requests / Responses
 */
export class GetSkipChainsSuccessResponse extends CustomTypeClass<GetSkipChainsSuccessResponse> implements iGetSkipChainsSuccessResponse {
  chains: Array<{ chain_id: string; [key: string]: unknown }>;

  constructor(data: iGetSkipChainsSuccessResponse) {
    super();
    this.chains = data.chains;
  }
}

/**
 * Get Skip Balances
 * Route: POST /api/v0/skip/balances
 * @category API Requests / Responses
 */
export interface iGetSkipBalancesPayload {
  /**
   * Map of chain_id → either an array of addresses, or an object with an address and optional denoms.
   * Mirrors Skip:Go /v2/info/balances.
   */
  chains: Record<string, string[] | { address: string; denoms?: string[] }>;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSkipBalancesSuccessResponse {
  /** Skip:Go balance payload (shape varies by request). */
  [key: string]: unknown;
}

/**
 * @category API Requests / Responses
 */
export class GetSkipBalancesSuccessResponse extends CustomTypeClass<GetSkipBalancesSuccessResponse> implements iGetSkipBalancesSuccessResponse {
  [key: string]: unknown;

  constructor(data: iGetSkipBalancesSuccessResponse) {
    super();
    Object.assign(this, data);
  }
}

/**
 * Track Skip Tx
 * Route: POST /api/v0/skip/v2/tx/track
 *
 * Initiates Skip:Go tracking for a broadcast tx. Accepts both snake_case
 * (matches Skip:Go) and camelCase (matches SDK conventions); the indexer
 * normalizes either form before forwarding.
 * @category API Requests / Responses
 */
export interface iTrackSkipTxPayload {
  /** Transaction hash to track (snake_case Skip:Go form). */
  tx_hash?: string;
  /** Transaction hash to track (camelCase SDK form). */
  txHash?: string;
  /** Source chain ID (snake_case Skip:Go form). */
  chain_id?: string;
  /** Source chain ID (camelCase SDK form). */
  chainId?: string;
  /** Optional token in amount with denom (e.g. "1000ubadge"). Used to seed the swap event row in the indexer DB. */
  tokenIn?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iTrackSkipTxSuccessResponse {
  /** Skip:Go track-tx response (echoes tx hash + chain id, plus tracking metadata). */
  [key: string]: unknown;
}

/**
 * @category API Requests / Responses
 */
export class TrackSkipTxSuccessResponse extends CustomTypeClass<TrackSkipTxSuccessResponse> implements iTrackSkipTxSuccessResponse {
  [key: string]: unknown;

  constructor(data: iTrackSkipTxSuccessResponse) {
    super();
    Object.assign(this, data);
  }
}

/**
 * Get Skip Tx Status
 * Route: GET /api/v0/skip/v2/tx/status
 * @category API Requests / Responses
 */
export interface iGetSkipTxStatusPayload {
  /** Transaction hash to look up. */
  txHash: string;
  /** Optional source chain ID — required for some tx hashes that aren't globally unique. */
  chainId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSkipTxStatusSuccessResponse {
  /** Skip:Go tx-status payload (transfers, state, etc). Indexer may inject `swapEventInfo` derived from on-chain swap events. */
  transfers?: unknown[];
  swapEventInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * @category API Requests / Responses
 */
export class GetSkipTxStatusSuccessResponse extends CustomTypeClass<GetSkipTxStatusSuccessResponse> implements iGetSkipTxStatusSuccessResponse {
  transfers?: unknown[];
  swapEventInfo?: Record<string, unknown>;
  [key: string]: unknown;

  constructor(data: iGetSkipTxStatusSuccessResponse) {
    super();
    Object.assign(this, data);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Consolidated /swap/* response types.
//
// The new /swap/assets and /swap/balances endpoints merge three sources:
//   1. Skip:Go upstream
//   2. The SDK's CoinsRegistry (BB-side IBC-20 metadata)
//   3. Verified AssetInfoDoc entries (BB-native + wrapped badgeslp:/badges:)
//
// Each asset / balance entry carries a `source` tag so consumers know
// where it came from, and asset entries may carry `isWrapped` for the
// wrapped-badge case.
//
// /swap/chains, /swap/estimate, /swap/track, and /swap/status are
// transparent aliases over the legacy handlers, so they re-use the
// existing iGetSkip*Payload / iEstimateSwapPayload shapes (declared
// elsewhere in this file or in gamm/indexer.ts).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Provenance marker for entries returned by the consolidated /swap/* endpoints.
 *  - `skip` — upstream Skip:Go API
 *  - `coinregistry` — BitBadges SDK's CoinsRegistry (IBC-20 metadata)
 *  - `verified` — verified AssetInfoDoc (BB-native or wrapped badgeslp:/badges:)
 *  - `native` — chain-native denom (e.g. `ubadge`)
 * @category API Requests / Responses
 */
export type SwapAssetSource = 'skip' | 'coinregistry' | 'verified' | 'native';

/**
 * Get Swap Assets
 * Route: GET /api/v0/swap/assets
 *
 * Same query shape as `/skip/assets`. Response merges Skip:Go assets
 * with CoinsRegistry + verified AssetInfoDoc entries for BitBadges chains;
 * other chains pass through unmodified.
 * @category API Requests / Responses
 */
export interface iGetSwapAssetsPayload {
  /** Include Solana / SVM chain assets. Defaults to false. */
  includeSvm?: boolean;
  /** Include CW20 token assets. Defaults to false. */
  includeCw20?: boolean;
}

/**
 * A single asset entry in the consolidated /swap/assets response.
 *
 * Mirrors Skip's asset shape (denom, chain_id, origin_*, symbol, name,
 * logo_uri, decimals) and adds `source` + `isWrapped`.
 * @category API Requests / Responses
 */
export interface iSwapAsset {
  denom: string;
  chain_id: string;
  origin_denom?: string;
  origin_chain_id?: string;
  symbol?: string;
  name?: string;
  logo_uri?: string;
  decimals?: number;
  /** Where this entry came from. */
  source: SwapAssetSource;
  /** True iff this is a wrapped BitBadges denom (badgeslp:/badges:) sourced from a verified AssetInfoDoc. */
  isWrapped?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSwapAssetsSuccessResponse {
  /** Map of chain_id → consolidated assets payload. */
  chain_to_assets_map: Record<string, { assets: iSwapAsset[] }>;
}

/**
 * @category API Requests / Responses
 */
export class GetSwapAssetsSuccessResponse extends CustomTypeClass<GetSwapAssetsSuccessResponse> implements iGetSwapAssetsSuccessResponse {
  chain_to_assets_map: Record<string, { assets: iSwapAsset[] }>;

  constructor(data: iGetSwapAssetsSuccessResponse) {
    super();
    this.chain_to_assets_map = data.chain_to_assets_map;
  }
}

/**
 * Get Swap Chains
 * Route: GET /api/v0/swap/chains
 *
 * Transparent alias of `/skip/chains` — same Skip:Go chain registry response shape.
 * @category API Requests / Responses
 */
export interface iGetSwapChainsPayload {
  /** Include Solana / SVM chains. Defaults to false. */
  includeSvm?: boolean;
  /** Return testnets only. Defaults to false. */
  onlyTestnets?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSwapChainsSuccessResponse {
  /** Chain entries (mirrors Skip:Go /v2/info/chains). */
  chains: Array<{
    chain_id: string;
    [key: string]: unknown;
  }>;
}

/**
 * @category API Requests / Responses
 */
export class GetSwapChainsSuccessResponse extends CustomTypeClass<GetSwapChainsSuccessResponse> implements iGetSwapChainsSuccessResponse {
  chains: Array<{ chain_id: string; [key: string]: unknown }>;

  constructor(data: iGetSwapChainsSuccessResponse) {
    super();
    this.chains = data.chains;
  }
}

/**
 * Get Swap Balances
 * Route: POST /api/v0/swap/balances
 *
 * Same request shape as `/skip/balances`. Response is normalized to
 * `{ balances: { [chainId]: { [address]: iSwapBalance[] } } }`. For
 * BitBadges chains, server-side enrichment adds CoinsRegistry bank
 * balances + computed wrappable amounts for verified badgeslp:/badges: denoms.
 * @category API Requests / Responses
 */
export interface iGetSwapBalancesPayload {
  /**
   * Map of chain_id → either an array of addresses, or an object with an address and optional denoms.
   * Mirrors Skip:Go /v2/info/balances.
   */
  chains: Record<string, string[] | { address: string; denoms?: string[] }>;
}

/**
 * A single balance entry in the consolidated /swap/balances response.
 * @category API Requests / Responses
 */
export interface iSwapBalance {
  denom: string;
  amount: string;
  decimals?: number;
  symbol?: string;
  /** Where this entry came from. Absent for legacy passthrough rows. */
  source?: SwapAssetSource;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSwapBalancesSuccessResponse {
  /** balances[chainId][address] = array of consolidated balance entries. */
  balances: Record<string, Record<string, iSwapBalance[]>>;
}

/**
 * @category API Requests / Responses
 */
export class GetSwapBalancesSuccessResponse extends CustomTypeClass<GetSwapBalancesSuccessResponse> implements iGetSwapBalancesSuccessResponse {
  balances: Record<string, Record<string, iSwapBalance[]>>;

  constructor(data: iGetSwapBalancesSuccessResponse) {
    super();
    this.balances = data.balances;
  }
}

/**
 * Track Swap
 * Route: POST /api/v0/swap/track
 *
 * Transparent alias of `/skip/v2/tx/track`. Same request/response shape.
 * @category API Requests / Responses
 */
export interface iTrackSwapPayload {
  /** Transaction hash to track (snake_case Skip:Go form). */
  tx_hash?: string;
  /** Transaction hash to track (camelCase SDK form). */
  txHash?: string;
  /** Source chain ID (snake_case Skip:Go form). */
  chain_id?: string;
  /** Source chain ID (camelCase SDK form). */
  chainId?: string;
  /** Optional token in amount with denom (e.g. "1000ubadge") — surfaces in the swap-activity row. */
  tokenIn?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iTrackSwapSuccessResponse {
  /** Skip:Go track-tx response (echoes tx hash + chain id, plus tracking metadata). */
  [key: string]: unknown;
}

/**
 * @category API Requests / Responses
 */
export class TrackSwapSuccessResponse extends CustomTypeClass<TrackSwapSuccessResponse> implements iTrackSwapSuccessResponse {
  [key: string]: unknown;

  constructor(data: iTrackSwapSuccessResponse) {
    super();
    Object.assign(this, data);
  }
}

/**
 * Get Swap Status
 * Route: GET /api/v0/swap/status
 *
 * Transparent alias of `/skip/v2/tx/status`. Same response shape — the
 * indexer enriches the upstream payload with `swapEventInfo` when the
 * destination is a BitBadges on-chain swap.
 * @category API Requests / Responses
 */
export interface iGetSwapStatusPayload {
  /** Transaction hash to look up. */
  txHash: string;
  /** Optional source chain ID — required for some tx hashes that aren't globally unique. */
  chainId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetSwapStatusSuccessResponse {
  /** Skip:Go tx-status payload (transfers, state, etc). */
  transfers?: unknown[];
  /** Injected by the indexer when the final destination is a BitBadges on-chain swap. */
  swapEventInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * @category API Requests / Responses
 */
export class GetSwapStatusSuccessResponse extends CustomTypeClass<GetSwapStatusSuccessResponse> implements iGetSwapStatusSuccessResponse {
  transfers?: unknown[];
  swapEventInfo?: Record<string, unknown>;
  [key: string]: unknown;

  constructor(data: iGetSwapStatusSuccessResponse) {
    super();
    Object.assign(this, data);
  }
}

/**
 * Get Intents (Approval Items of approvalType "intent")
 * Route: GET /api/v0/intents (browse all) or GET /api/v0/intents/:address (specific user)
 *
 * "Intents" are pre-signed exchange approvals that swap one denom for
 * another. The browse endpoint (`/intents`) returns only active, funded,
 * non-used intents. The user-scoped endpoint (`/intents/:address`)
 * can return everything when `includeAll=true`.
 * @category API Requests / Responses
 */
export interface iGetIntentsPayload {
  /**
   * When fetching a specific user's intents, set to `true` to include
   * used/expired/inactive/underfunded intents. Server returns 400 if
   * passed without a path-level address.
   */
  includeAll?: boolean;
  /** Filter by the denom the intent pays out. */
  payDenom?: string;
  /** Filter by the denom the intent expects to receive. */
  receiveDenom?: string;
  /** Filter to intents scoped to a specific collection. */
  collectionId?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetIntentsSuccessResponse<T extends NumberType> {
  /** Approval item docs of type `intent`, sorted newest first. */
  intents: Array<iApprovalItemDoc<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetIntentsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetIntentsSuccessResponse<T>>
  implements iGetIntentsSuccessResponse<T>
{
  intents: ApprovalItemDoc<T>[];

  constructor(data: iGetIntentsSuccessResponse<T>) {
    super();
    this.intents = data.intents.map((x) => new ApprovalItemDoc(x));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetIntentsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetIntentsSuccessResponse<U>;
  }
}

/**
 * Filter Collection Approvals
 * Route: POST /api/v0/collection/:collectionId/filterApprovals
 *
 * Free-form mongo-style filter against the approval-item store, scoped
 * to a single collection (or all collections when `collectionId === 'any'`).
 * Returns the balance docs of the approvers that match.
 *
 * The `query` and `sortBy` fields are intentionally untyped — the
 * indexer forwards them to the underlying mongoose query so callers
 * can filter on any indexed field (approverAddress, approvalType,
 * isActive, sufficientBalances, intentPayDenom, etc.).
 * @category API Requests / Responses
 */
export interface iFilterCollectionApprovalsPayload {
  /** Mongo-style filter object (matches the ApprovalItemDoc shape). */
  query: Record<string, unknown>;
  /** Mongo-style sort object (e.g. `{ _id: -1 }`). */
  sortBy: Record<string, unknown>;
}

/**
 * @category API Requests / Responses
 */
export interface iFilterCollectionApprovalsSuccessResponse<T extends NumberType> {
  /** Balance docs (with off-chain details applied) for the approvers matching the filter. */
  docs: iBalanceDocWithDetails<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class FilterCollectionApprovalsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<FilterCollectionApprovalsSuccessResponse<T>>
  implements iFilterCollectionApprovalsSuccessResponse<T>
{
  docs: BalanceDocWithDetails<T>[];
  pagination: PaginationInfo;

  constructor(data: iFilterCollectionApprovalsSuccessResponse<T>) {
    super();
    this.docs = data.docs.map((x) => new BalanceDocWithDetails(x));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(
    convertFunction: (val: NumberType) => U,
    options?: ConvertOptions
  ): FilterCollectionApprovalsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as FilterCollectionApprovalsSuccessResponse<U>;
  }
}

/**
 * Get User Balances
 * Route: GET /api/v0/account/:address/balances
 *
 * Lean alternative to fetching `/users` with a `tokensCollected` view.
 * Returns ONLY the balance docs (no account wrapper, no metadata), so it
 * is the cheapest call for read-side flows that just need balances.
 *
 * Use `getAccounts` / `getAccountsAndUpdate` when you also need account
 * fields (profile, bio, sequence, etc.).
 * @category API Requests / Responses
 */
export interface iGetUserBalancesPayload {
  /** Pagination bookmark from the previous response. */
  bookmark?: string;
  /** Page size. Indexer-enforced max applies. */
  limit?: number;
}

/**
 * @category API Requests / Responses
 */
export class GetUserBalancesPayload implements iGetUserBalancesPayload {
  bookmark?: string;
  limit?: number;

  constructor(data: iGetUserBalancesPayload) {
    this.bookmark = data.bookmark;
    this.limit = data.limit;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetUserBalancesSuccessResponse<T extends NumberType> {
  /** Balance docs for the address — one per (collectionId, address) pair the user holds. */
  docs: iBalanceDoc<T>[];
  pagination: { bookmark: string; hasMore: boolean };
}

/**
 * @category API Requests / Responses
 */
export class GetUserBalancesSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetUserBalancesSuccessResponse<T>>
  implements iGetUserBalancesSuccessResponse<T>
{
  docs: BalanceDoc<T>[];
  pagination: { bookmark: string; hasMore: boolean };

  constructor(data: iGetUserBalancesSuccessResponse<T>) {
    super();
    this.docs = data.docs.map((doc) => new BalanceDoc(doc));
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(
    convertFunction: (val: NumberType) => U,
    options?: ConvertOptions
  ): GetUserBalancesSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetUserBalancesSuccessResponse<U>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DEX / marketplace — per-token + per-collection listings & offers.
// Mirror the indexer handlers in `src/routes/balances.ts`.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @category API Requests / Responses
 */
export interface iGetAllListingsPayload {
  /** Denom to filter listings by (e.g. `ubadge`). */
  denom: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetAllListingsSuccessResponse<T extends NumberType> {
  listings: iApprovalItemDoc<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetAllListingsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAllListingsSuccessResponse<T>>
  implements iGetAllListingsSuccessResponse<T>
{
  listings: ApprovalItemDoc<T>[];

  constructor(data: iGetAllListingsSuccessResponse<T>) {
    super();
    this.listings = data.listings.map((doc) => new ApprovalItemDoc(doc));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetAllListingsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAllListingsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionOffersPayload {
  /** Denom to filter offers by (e.g. `ubadge`). */
  denom: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionOffersSuccessResponse<T extends NumberType> {
  offers: iApprovalItemDoc<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionOffersSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionOffersSuccessResponse<T>>
  implements iGetCollectionOffersSuccessResponse<T>
{
  offers: ApprovalItemDoc<T>[];

  constructor(data: iGetCollectionOffersSuccessResponse<T>) {
    super();
    this.offers = data.offers.map((doc) => new ApprovalItemDoc(doc));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionOffersSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionOffersSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetListingsForTokenIdPayload {
  /** Denom to filter listings by (e.g. `ubadge`). */
  denom: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetListingsForTokenIdSuccessResponse<T extends NumberType> {
  listings: iApprovalItemDoc<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetListingsForTokenIdSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetListingsForTokenIdSuccessResponse<T>>
  implements iGetListingsForTokenIdSuccessResponse<T>
{
  listings: ApprovalItemDoc<T>[];

  constructor(data: iGetListingsForTokenIdSuccessResponse<T>) {
    super();
    this.listings = data.listings.map((doc) => new ApprovalItemDoc(doc));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetListingsForTokenIdSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetListingsForTokenIdSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetOffersForTokenIdPayload {
  /** Denom to filter offers by (e.g. `ubadge`). */
  denom: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetOffersForTokenIdSuccessResponse<T extends NumberType> {
  offers: iApprovalItemDoc<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetOffersForTokenIdSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetOffersForTokenIdSuccessResponse<T>>
  implements iGetOffersForTokenIdSuccessResponse<T>
{
  offers: ApprovalItemDoc<T>[];

  constructor(data: iGetOffersForTokenIdSuccessResponse<T>) {
    super();
    this.offers = data.offers.map((doc) => new ApprovalItemDoc(doc));
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetOffersForTokenIdSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetOffersForTokenIdSuccessResponse<U>;
  }
}

/**
 * Aggregated bid/ask depth for a single (collectionId, tokenId, denom).
 * Indexer side stores the doc keyed by `${collectionId}:${tokenId}:${denom}`.
 * Inner shape is intentionally untyped — bid/listing aggregations evolve
 * independently of this SDK and the doc's `bids` / `listings` are price-keyed
 * maps. Treat as opaque on the client.
 *
 * @category API Requests / Responses
 */
export interface iGetOrderbookDepthPayload {
  /** Denom to filter the orderbook by (e.g. `ubadge`). */
  denom: string;
}

/**
 * @category API Requests / Responses
 */
/**
 * @category API Requests / Responses
 *
 * Mirrors the indexer's OrderbookDepthModel doc shape. `bids` and `listings`
 * are price-keyed maps where the key is a price tier (string-serialized
 * number) and the value is the cumulative depth at that price.
 */
export interface iOrderbookDepth {
  _docId: string;
  collectionId: string;
  tokenId: string;
  denom?: string;
  bids: Record<string, number>;
  listings: Record<string, number>;
}

export interface iGetOrderbookDepthSuccessResponse {
  orderbookDepth: iOrderbookDepth | null;
}

/**
 * @category API Requests / Responses
 */
export class GetOrderbookDepthSuccessResponse extends CustomTypeClass<GetOrderbookDepthSuccessResponse>
  implements iGetOrderbookDepthSuccessResponse
{
  orderbookDepth: iOrderbookDepth | null;

  constructor(data: iGetOrderbookDepthSuccessResponse) {
    super();
    this.orderbookDepth = data.orderbookDepth;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCandlestickDataPayload {
  /** Denom for the candlestick price/volume aggregation (e.g. `ubadge`). */
  denom: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCandlestickDataSuccessResponse<T extends NumberType> {
  candlesticks: Array<{
    timestamp: T;
    open: T;
    high: T;
    low: T;
    close: T;
    volume: T;
    numberOfTrades: T;
  }>;
}

/**
 * @category API Requests / Responses
 */
export class GetCandlestickDataSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCandlestickDataSuccessResponse<T>>
  implements iGetCandlestickDataSuccessResponse<T>
{
  candlesticks: Array<{ timestamp: T; open: T; high: T; low: T; close: T; volume: T; numberOfTrades: T }>;

  constructor(data: iGetCandlestickDataSuccessResponse<T>) {
    super();
    this.candlesticks = data.candlesticks;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCandlestickDataSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCandlestickDataSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetLiquidityPairPriceHistoryPayload {
  /** Asset identifier (e.g. `badgeslp:123:uyes` or `ubadge`). */
  asset: string;
  /** Aggregation timeframe. Defaults to `'10m'` on the indexer when omitted. */
  timeframe?: '10m' | '1h' | '1d' | string;
}

/**
 * @category API Requests / Responses
 *
 * The indexer streams the matching `AssetPriceHistoryDoc` rows verbatim. We
 * leave the inner shape as a structural interface rather than re-using the
 * gamm `iAssetPriceHistoryDoc` class to avoid a circular import cost in
 * this requests file.
 */
export interface iGetLiquidityPairPriceHistorySuccessResponse<T extends NumberType> {
  docs: Array<{
    _id?: string;
    _docId: string;
    asset: string;
    price: number;
    timestamp: T;
    timeframe?: string;
    high?: number;
    low?: number;
    open?: number;
    [k: string]: unknown;
  }>;
}

/**
 * @category API Requests / Responses
 */
export class GetLiquidityPairPriceHistorySuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetLiquidityPairPriceHistorySuccessResponse<T>>
  implements iGetLiquidityPairPriceHistorySuccessResponse<T>
{
  docs: iGetLiquidityPairPriceHistorySuccessResponse<T>['docs'];

  constructor(data: iGetLiquidityPairPriceHistorySuccessResponse<T>) {
    super();
    this.docs = data.docs;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(
    convertFunction: (val: NumberType) => U,
    options?: ConvertOptions
  ): GetLiquidityPairPriceHistorySuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetLiquidityPairPriceHistorySuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPoolsBatchPayload {
  /** Pool IDs to fetch (max 100). */
  poolIds: string[];
}

/**
 * @category API Requests / Responses
 *
 * Inner `pools` shape mirrors the indexer's `LiquidityPoolInfoDoc` rows —
 * left as `unknown` so this requests file doesn't need to depend on the
 * `gamm` module. Typed consumers can cast through `LiquidityPoolInfoDoc<T>`
 * from `bitbadgesjs-sdk/gamm` if needed.
 */
export interface iGetPoolsBatchSuccessResponse<T extends NumberType> {
  pools: iLiquidityPoolInfoDoc<T>[];
  count: number;
  /** Echo of T for variance. */
  _t?: T;
}

/**
 * @category API Requests / Responses
 */
export class GetPoolsBatchSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetPoolsBatchSuccessResponse<T>>
  implements iGetPoolsBatchSuccessResponse<T>
{
  pools: iLiquidityPoolInfoDoc<T>[];
  count: number;

  constructor(data: iGetPoolsBatchSuccessResponse<T>) {
    super();
    this.pools = data.pools;
    this.count = data.count;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetPoolsBatchSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetPoolsBatchSuccessResponse<U>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Governance / voting / prediction markets.
// Mirror indexer handlers in `src/routes/votes.ts` and `src/routes/predictions.ts`.
//
// `VoteDoc` lives in the indexer (not the SDK) — vote payloads here surface
// the recalculated-totals shape the API actually returns. Untyped inner
// fields (`voters`, `votes`) are intentional: their nested shape is dictated
// by the indexer's vote-tally recalculation step, which we don't model here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @category API Requests / Responses
 */
export interface iVoteApiData<T extends NumberType> {
  _docId: string;
  collectionId: string;
  approvalLevel: string;
  approverAddress?: string;
  approvalId: string;
  proposalId: string;
  quorumThreshold: T;
  voters: Array<{ address: string; weight: T }>;
  votes: Array<{ voter: string; yesWeight: T; lastUpdated: T }>;
  totalYesWeight: T;
  totalNoWeight: T;
  totalPossibleWeight: T;
  uri?: string;
  customData?: string;
  lastUpdated: T;
}

/**
 * @category API Requests / Responses
 */
export interface iGetVoteByProposalIdPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetVoteByProposalIdSuccessResponse<T extends NumberType> {
  vote: iVoteApiData<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetVoteByProposalIdSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetVoteByProposalIdSuccessResponse<T>>
  implements iGetVoteByProposalIdSuccessResponse<T>
{
  vote: iVoteApiData<T>;

  constructor(data: iGetVoteByProposalIdSuccessResponse<T>) {
    super();
    this.vote = data.vote;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetVoteByProposalIdSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetVoteByProposalIdSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetVotesByCollectionPayload {
  bookmark?: string;
  limit?: number;
}

/**
 * @category API Requests / Responses
 */
export interface iGetVotesByCollectionSuccessResponse<T extends NumberType> {
  votes: iVoteApiData<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetVotesByCollectionSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetVotesByCollectionSuccessResponse<T>>
  implements iGetVotesByCollectionSuccessResponse<T>
{
  votes: iVoteApiData<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetVotesByCollectionSuccessResponse<T>) {
    super();
    this.votes = data.votes;
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetVotesByCollectionSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetVotesByCollectionSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetVotesByVoterPayload {
  bookmark?: string;
  limit?: number;
}

/**
 * @category API Requests / Responses
 */
export interface iGetVotesByVoterSuccessResponse<T extends NumberType> {
  votes: iVoteApiData<T>[];
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetVotesByVoterSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetVotesByVoterSuccessResponse<T>>
  implements iGetVotesByVoterSuccessResponse<T>
{
  votes: iVoteApiData<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetVotesByVoterSuccessResponse<T>) {
    super();
    this.votes = data.votes;
    this.pagination = data.pagination;
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetVotesByVoterSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetVotesByVoterSuccessResponse<U>;
  }
}

/**
 * Parsed prediction-market data the indexer returns from
 * `parsePredictionMarketData()`. Fields mirror `src/routes/predictions.ts`.
 *
 * @category API Requests / Responses
 */
export interface iPredictionMarketApiData {
  collectionId: string;
  metadataUri: string;
  customData: string;
  verifierAddress: string;
  depositDenom: string;
  depositAmount: string;
  status: 'active' | 'resolved-yes' | 'resolved-no' | 'resolved-push' | string;
  yesPrice: number;
  noPrice: number;
}

/**
 * @category API Requests / Responses
 */
export interface iGetPredictionsPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetPredictionsSuccessResponse {
  predictions: iPredictionMarketApiData[];
}

/**
 * @category API Requests / Responses
 */
export class GetPredictionsSuccessResponse extends CustomTypeClass<GetPredictionsSuccessResponse> implements iGetPredictionsSuccessResponse {
  predictions: iPredictionMarketApiData[];

  constructor(data: iGetPredictionsSuccessResponse) {
    super();
    this.predictions = data.predictions;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPredictionDetailPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetPredictionDetailSuccessResponse {
  /**
   * Parsed prediction-market data plus the collection's approval documents.
   * Approvals arrive over the wire as JSON (BigInts serialized to strings) —
   * use the SDK's `.convert(BigIntify)` to get a `bigint`-typed view.
   */
  prediction: iPredictionMarketApiData & { approvals: iCollectionApproval<string>[] };
}

/**
 * @category API Requests / Responses
 */
export class GetPredictionDetailSuccessResponse
  extends CustomTypeClass<GetPredictionDetailSuccessResponse>
  implements iGetPredictionDetailSuccessResponse
{
  prediction: iPredictionMarketApiData & { approvals: iCollectionApproval<string>[] };

  constructor(data: iGetPredictionDetailSuccessResponse) {
    super();
    this.prediction = data.prediction;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPredictionPricesPayload {
  /** Price-history aggregation timeframe. Defaults to `'1h'` on the indexer. */
  timeframe?: '10m' | '1h' | '1d';
}

/**
 * @category API Requests / Responses
 */
export interface iGetPredictionPricesSuccessResponse {
  prices: {
    yes: Array<{ time: number; value: number }>;
    no: Array<{ time: number; value: number }>;
  };
}

/**
 * @category API Requests / Responses
 */
export class GetPredictionPricesSuccessResponse
  extends CustomTypeClass<GetPredictionPricesSuccessResponse>
  implements iGetPredictionPricesSuccessResponse
{
  prices: { yes: Array<{ time: number; value: number }>; no: Array<{ time: number; value: number }> };

  constructor(data: iGetPredictionPricesSuccessResponse) {
    super();
    this.prices = data.prices;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EVM broadcast / simulate (BitBadges-EVM specific). Cosmos-side broadcast
// is the existing `broadcastTx` / `simulateTx`. These are separate handlers
// that wrap `MsgEthereumTx` and return both EVM and cosmos tx hashes.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @category API Requests / Responses
 */
export interface iBroadcastTxEvmPayload {
  mode: 'evm';
  evmTx?: {
    to: string;
    data: string;
    value?: string;
    signer_address?: string;
    chain_id?: string;
  };
  /** Optional already-broadcast EVM tx hash to track. */
  txHash?: string;
  /** Optional raw EVM-encoded tx bytes (hex string or Uint8Array). */
  tx_bytes?: string | Uint8Array;
}

/**
 * @category API Requests / Responses
 */
export interface iBroadcastTxEvmSuccessResponse {
  /** The EVM keccak256 transaction hash. */
  txhash: string;
  /**
   * The cosmos-side `MsgEthereumTx` wrapping hash. Cosmos tooling (explorer,
   * indexer, Skip Go tracker) must use this hash — `txhash` alone won't
   * resolve there. May be `undefined` if the tx didn't mine in time.
   */
  cosmosTxHash?: string;
  success: boolean;
}

/**
 * @category API Requests / Responses
 */
export class BroadcastTxEvmSuccessResponse
  extends CustomTypeClass<BroadcastTxEvmSuccessResponse>
  implements iBroadcastTxEvmSuccessResponse
{
  txhash: string;
  cosmosTxHash?: string;
  success: boolean;

  constructor(data: iBroadcastTxEvmSuccessResponse) {
    super();
    this.txhash = data.txhash;
    this.cosmosTxHash = data.cosmosTxHash;
    this.success = data.success;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iSimulateTxEvmPayload {
  mode: 'evm';
  evmTx: {
    to: string;
    data: string;
    value?: string;
    signer_address: string;
    chain_id?: string;
  };
}

/**
 * @category API Requests / Responses
 */
export interface iSimulateTxEvmSuccessResponse {
  /** Estimated gas as a decimal string. */
  gas_used: string;
  success: boolean;
}

/**
 * @category API Requests / Responses
 */
export class SimulateTxEvmSuccessResponse
  extends CustomTypeClass<SimulateTxEvmSuccessResponse>
  implements iSimulateTxEvmSuccessResponse
{
  gas_used: string;
  success: boolean;

  constructor(data: iSimulateTxEvmSuccessResponse) {
    super();
    this.gas_used = data.gas_used;
    this.success = data.success;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PromptSkill — individual GET + batch fetch.
// Create / update / delete / search types already exist above.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @category API Requests / Responses
 */
export interface iGetPromptSkillPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetPromptSkillSuccessResponse {
  promptSkill: iPromptSkillDoc;
}

/**
 * @category API Requests / Responses
 */
export class GetPromptSkillSuccessResponse extends CustomTypeClass<GetPromptSkillSuccessResponse> implements iGetPromptSkillSuccessResponse {
  promptSkill: iPromptSkillDoc;

  constructor(data: iGetPromptSkillSuccessResponse) {
    super();
    this.promptSkill = data.promptSkill;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iFetchPromptSkillsPayload {
  /** IDs to fetch (1–25). */
  promptSkillIds: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iFetchPromptSkillsSuccessResponse {
  promptSkills: iPromptSkillDoc[];
}

/**
 * @category API Requests / Responses
 */
export class FetchPromptSkillsSuccessResponse
  extends CustomTypeClass<FetchPromptSkillsSuccessResponse>
  implements iFetchPromptSkillsSuccessResponse
{
  promptSkills: iPromptSkillDoc[];

  constructor(data: iFetchPromptSkillsSuccessResponse) {
    super();
    this.promptSkills = data.promptSkills;
  }
}
