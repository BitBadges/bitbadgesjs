import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, ParsedQs } from '@/common/base.js';
import { NumberType } from '@/common/string-numbers.js';
import { PaginationInfo } from '../base.js';
import { BitBadgesCollection, iBitBadgesCollection } from '../BitBadgesCollection.js';

import { ClaimDetails } from '@/core/approvals.js';
import { CollectionId } from '@/interfaces/index.js';
import { ClaimActivityDoc, PointsActivityDoc, TransferActivityDoc } from '../docs-types/activity.js';
import { ApprovalTrackerDoc, BalanceDoc, BalanceDocWithDetails, MerkleChallengeTrackerDoc, SIWBBRequestDoc, UtilityPageDoc } from '../docs-types/docs.js';
import { iApprovalTrackerDoc, iBalanceDoc, iBalanceDocWithDetails, iClaimActivityDoc, iClaimDetails, iMerkleChallengeTrackerDoc, iPointsActivityDoc, iTransferActivityDoc, iUtilityPageDoc } from '../docs-types/interfaces.js';
import { iMetadata, Metadata } from '../metadata/metadata.js';

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionOwnersPayload {
  bookmark?: string;
  oldestFirst?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionOwnersSuccessResponse {
  owners: Array<iBalanceDoc>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionOwnersSuccessResponse extends BaseNumberTypeClass<GetCollectionOwnersSuccessResponse> implements iGetCollectionOwnersSuccessResponse {
  owners: BalanceDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionOwnersSuccessResponse) {
    super();
    this.owners = data.owners.map((owner) => new BalanceDoc(owner));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetCollectionOwnersSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionOwnersSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionTransferActivityPayload {
  bookmark?: string;
  oldestFirst?: boolean;
  /** Optional address to filter activity by */
  address?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionTransferActivitySuccessResponse {
  activity: Array<iTransferActivityDoc>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionTransferActivitySuccessResponse extends BaseNumberTypeClass<GetCollectionTransferActivitySuccessResponse> implements iGetCollectionTransferActivitySuccessResponse {
  activity: TransferActivityDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionTransferActivitySuccessResponse) {
    super();
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetCollectionTransferActivitySuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionTransferActivitySuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionChallengeTrackersPayload {
  bookmark?: string;
  oldestFirst?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionChallengeTrackersSuccessResponse {
  challengeTrackers: Array<iMerkleChallengeTrackerDoc>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionChallengeTrackersSuccessResponse extends BaseNumberTypeClass<GetCollectionChallengeTrackersSuccessResponse> implements iGetCollectionChallengeTrackersSuccessResponse {
  challengeTrackers: MerkleChallengeTrackerDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionChallengeTrackersSuccessResponse) {
    super();
    this.challengeTrackers = data.challengeTrackers.map((challengeTracker) => new MerkleChallengeTrackerDoc(challengeTracker));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetCollectionChallengeTrackersSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionChallengeTrackersSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionAmountTrackersPayload {
  bookmark?: string;
  oldestFirst?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionAmountTrackersSuccessResponse {
  amountTrackers: Array<iApprovalTrackerDoc>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionAmountTrackersSuccessResponse extends BaseNumberTypeClass<GetCollectionAmountTrackersSuccessResponse> implements iGetCollectionAmountTrackersSuccessResponse {
  amountTrackers: ApprovalTrackerDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionAmountTrackersSuccessResponse) {
    super();
    this.amountTrackers = data.amountTrackers.map((amountTracker) => new ApprovalTrackerDoc(amountTracker));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetCollectionAmountTrackersSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionAmountTrackersSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionListingsPayload {
  bookmark?: string;
  oldestFirst?: boolean;
  /** Optional token ID to filter listings by */
  tokenId?: string | number;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionListingsSuccessResponse {
  listings: Array<iUtilityPageDoc>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionListingsSuccessResponse extends BaseNumberTypeClass<GetCollectionListingsSuccessResponse> implements iGetCollectionListingsSuccessResponse {
  listings: UtilityPageDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionListingsSuccessResponse) {
    super();
    this.listings = data.listings.map((listing) => new UtilityPageDoc(listing));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetCollectionListingsSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionListingsSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
interface iBaseQueryParams {
  bookmark?: string;
  oldestFirst?: boolean;
}

/**
 * @category API Requests / Responses
 */
export interface iGetTransferActivityForUserPayload extends iBaseQueryParams {}

/**
 * @category API Requests / Responses
 */
export interface iGetTokensViewForUserPayload extends iBaseQueryParams {
  /** Optional collection ID to filter by */
  collectionId?: CollectionId;
  /**
   * The view type to search for. Default is 'collected'
   *
   * - 'collected' will return the tokens the user has a balance of
   * - 'managing' will return the tokens the user is managing
   * - 'created' will return the tokens the user has created
   */
  viewType?: 'collected' | 'managing' | 'created';
  /** The standard to filter by for the view. */
  standard?: string;
}

// Success response interfaces
interface iBaseSuccessResponse {
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export interface iGetTransferActivityForUserSuccessResponse extends iBaseSuccessResponse {
  activity: Array<iTransferActivityDoc>;
}

/**
 * @category API Requests / Responses
 */
export class GetTransferActivityForUserSuccessResponse extends BaseNumberTypeClass<GetTransferActivityForUserSuccessResponse> implements iGetTransferActivityForUserSuccessResponse {
  activity: TransferActivityDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetTransferActivityForUserSuccessResponse) {
    super();
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetTransferActivityForUserSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetTransferActivityForUserSuccessResponse;
  }
}

/**
 * @category API Requests / Responses */
export interface iGetTokensViewForUserSuccessResponse extends iBaseSuccessResponse {
  tokens: Array<iBalanceDocWithDetails>;
}

/**
 * @category API Requests / Responses
 */
export class GetTokensViewForUserSuccessResponse extends BaseNumberTypeClass<GetTokensViewForUserSuccessResponse> implements iGetTokensViewForUserSuccessResponse {
  tokens: BalanceDocWithDetails[];
  pagination: PaginationInfo;

  constructor(data: iGetTokensViewForUserSuccessResponse) {
    super();
    this.tokens = data.tokens.map((token) => new BalanceDocWithDetails(token));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetTokensViewForUserSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetTokensViewForUserSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimActivityForUserPayload extends iBaseQueryParams {
  /**
   * The view type to search for. Default is 'public'
   *
   * - 'all' will return all claim activity even private (must have permission to view private activity)
   * - 'public' will only return public claim activity
   */
  viewType?: 'all' | 'public';
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimActivityForUserSuccessResponse extends iBaseSuccessResponse {
  activity: Array<iClaimActivityDoc>;
}

/**
 * @category API Requests / Responses
 */
export class GetClaimActivityForUserSuccessResponse extends BaseNumberTypeClass<GetClaimActivityForUserSuccessResponse> implements iGetClaimActivityForUserSuccessResponse {
  activity: ClaimActivityDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetClaimActivityForUserSuccessResponse) {
    super();
    this.activity = data.activity.map((activity) => new ClaimActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetClaimActivityForUserSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetClaimActivityForUserSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetSiwbbRequestsForUserPayload extends iBaseQueryParams {}

/**
 * @category API Requests / Responses
 */
export interface iGetSiwbbRequestsForUserSuccessResponse extends iBaseSuccessResponse {
  requests: Array<SIWBBRequestDoc>;
}

/**
 * @category API Requests / Responses
 */
export class GetSiwbbRequestsForUserSuccessResponse extends BaseNumberTypeClass<GetSiwbbRequestsForUserSuccessResponse> implements iGetSiwbbRequestsForUserSuccessResponse {
  requests: SIWBBRequestDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetSiwbbRequestsForUserSuccessResponse) {
    super();
    this.requests = data.requests.map((request) => new SIWBBRequestDoc(request));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetSiwbbRequestsForUserSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetSiwbbRequestsForUserSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPointsActivityForUserPayload extends iBaseQueryParams {}

/**
 * @category API Requests / Responses
 */
export interface iGetPointsActivityForUserSuccessResponse extends iBaseSuccessResponse {
  activity: Array<iPointsActivityDoc>;
}

/**
 * @category API Requests / Responses
 */
export class GetPointsActivityForUserSuccessResponse extends BaseNumberTypeClass<GetPointsActivityForUserSuccessResponse> implements iGetPointsActivityForUserSuccessResponse {
  activity: PointsActivityDoc[];
  pagination: PaginationInfo;

  constructor(data: iGetPointsActivityForUserSuccessResponse) {
    super();
    this.activity = data.activity.map((activity) => new PointsActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetPointsActivityForUserSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetPointsActivityForUserSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionPayload {}

/**
 * @category API Requests / Responses
 */
export class GetCollectionPayload {
  constructor(data: iGetCollectionPayload) {}

  static FromQuery(query: ParsedQs): GetCollectionPayload {
    return new GetCollectionPayload({});
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionSuccessResponse {
  /** The collection details */
  collection: iBitBadgesCollection;
  /** The current collection metadata */
  metadata: iMetadata;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionSuccessResponse extends BaseNumberTypeClass<GetCollectionSuccessResponse> implements iGetCollectionSuccessResponse {
  collection: BitBadgesCollection;
  metadata: Metadata;

  constructor(data: iGetCollectionSuccessResponse) {
    super();
    this.collection = new BitBadgesCollection(data.collection);
    this.metadata = new Metadata(data.metadata);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetCollectionSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetTokenMetadataPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetTokenMetadataSuccessResponse {
  metadata: iMetadata;
}

/**
 * @category API Requests / Responses
 */
export class GetTokenMetadataSuccessResponse extends BaseNumberTypeClass<GetTokenMetadataSuccessResponse> implements iGetTokenMetadataSuccessResponse {
  metadata: Metadata;

  constructor(data: iGetTokenMetadataSuccessResponse) {
    super();
    this.metadata = new Metadata(data.metadata);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetTokenMetadataSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetTokenMetadataSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetCollectionClaimsPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionClaimsSuccessResponse extends iBaseSuccessResponse {
  claims: Array<iClaimDetails>;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionClaimsSuccessResponse extends BaseNumberTypeClass<GetCollectionClaimsSuccessResponse> implements iGetCollectionClaimsSuccessResponse {
  claims: ClaimDetails[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionClaimsSuccessResponse) {
    super();
    this.claims = data.claims.map((claim) => new ClaimDetails(claim));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetCollectionClaimsSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionClaimsSuccessResponse;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetAddressListClaimsPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListClaimsSuccessResponse extends iBaseSuccessResponse {
  claims: Array<iClaimDetails>;
}

/**
 * @category API Requests / Responses
 */
export class GetAddressListClaimsSuccessResponse extends BaseNumberTypeClass<GetAddressListClaimsSuccessResponse> implements iGetAddressListClaimsSuccessResponse {
  claims: ClaimDetails[];
  pagination: PaginationInfo;

  constructor(data: iGetAddressListClaimsSuccessResponse) {
    super();
    this.claims = data.claims.map((claim) => new ClaimDetails(claim));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetAddressListClaimsSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAddressListClaimsSuccessResponse;
  }
}
