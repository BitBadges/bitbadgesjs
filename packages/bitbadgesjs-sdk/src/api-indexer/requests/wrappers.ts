import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, ParsedQs } from '@/common/base.js';
import { NumberType } from '@/common/string-numbers.js';
import { PaginationInfo } from '../base.js';
import { BitBadgesCollection, iBitBadgesCollection } from '../BitBadgesCollection.js';

import { ClaimDetails } from '@/core/approvals.js';
import { CollectionId } from '@/interfaces/index.js';
import { ClaimActivityDoc, PointsActivityDoc, TransferActivityDoc } from '../docs-types/activity.js';
import {
  ApprovalTrackerDoc,
  BalanceDoc,
  BalanceDocWithDetails,
  MerkleChallengeTrackerDoc,
  SIWBBRequestDoc,
  UtilityPageDoc
} from '../docs-types/docs.js';
import {
  iApprovalTrackerDoc,
  iBalanceDoc,
  iBalanceDocWithDetails,
  iClaimActivityDoc,
  iClaimDetails,
  iMerkleChallengeTrackerDoc,
  iPointsActivityDoc,
  iTransferActivityDoc,
  iUtilityPageDoc
} from '../docs-types/interfaces.js';
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
export interface iGetCollectionOwnersSuccessResponse<T extends NumberType> {
  owners: Array<iBalanceDoc<T>>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionOwnersSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionOwnersSuccessResponse<T>>
  implements iGetCollectionOwnersSuccessResponse<T>
{
  owners: BalanceDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionOwnersSuccessResponse<T>) {
    super();
    this.owners = data.owners.map((owner) => new BalanceDoc(owner));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionOwnersSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionOwnersSuccessResponse<U>;
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
export interface iGetCollectionTransferActivitySuccessResponse<T extends NumberType> {
  activity: Array<iTransferActivityDoc<T>>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionTransferActivitySuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionTransferActivitySuccessResponse<T>>
  implements iGetCollectionTransferActivitySuccessResponse<T>
{
  activity: TransferActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionTransferActivitySuccessResponse<T>) {
    super();
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionTransferActivitySuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionTransferActivitySuccessResponse<U>;
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
export interface iGetCollectionChallengeTrackersSuccessResponse<T extends NumberType> {
  challengeTrackers: Array<iMerkleChallengeTrackerDoc<T>>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionChallengeTrackersSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionChallengeTrackersSuccessResponse<T>>
  implements iGetCollectionChallengeTrackersSuccessResponse<T>
{
  challengeTrackers: MerkleChallengeTrackerDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionChallengeTrackersSuccessResponse<T>) {
    super();
    this.challengeTrackers = data.challengeTrackers.map((challengeTracker) => new MerkleChallengeTrackerDoc(challengeTracker));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionChallengeTrackersSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionChallengeTrackersSuccessResponse<U>;
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
export interface iGetCollectionAmountTrackersSuccessResponse<T extends NumberType> {
  amountTrackers: Array<iApprovalTrackerDoc<T>>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionAmountTrackersSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionAmountTrackersSuccessResponse<T>>
  implements iGetCollectionAmountTrackersSuccessResponse<T>
{
  amountTrackers: ApprovalTrackerDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionAmountTrackersSuccessResponse<T>) {
    super();
    this.amountTrackers = data.amountTrackers.map((amountTracker) => new ApprovalTrackerDoc(amountTracker));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionAmountTrackersSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionAmountTrackersSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionListingsPayload {
  bookmark?: string;
  oldestFirst?: boolean;
  /** Optional token ID to filter listings by */
  badgeId?: NumberType;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionListingsSuccessResponse<T extends NumberType> {
  listings: Array<iUtilityPageDoc<T>>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionListingsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionListingsSuccessResponse<T>>
  implements iGetCollectionListingsSuccessResponse<T>
{
  listings: UtilityPageDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionListingsSuccessResponse<T>) {
    super();
    this.listings = data.listings.map((listing) => new UtilityPageDoc(listing));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionListingsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionListingsSuccessResponse<U>;
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
export interface iGetBadgesViewForUserPayload extends iBaseQueryParams {
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
export interface iGetTransferActivityForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  activity: Array<iTransferActivityDoc<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetTransferActivityForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetTransferActivityForUserSuccessResponse<T>>
  implements iGetTransferActivityForUserSuccessResponse<T>
{
  activity: TransferActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetTransferActivityForUserSuccessResponse<T>) {
    super();
    this.activity = data.activity.map((activity) => new TransferActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetTransferActivityForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetTransferActivityForUserSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses */
export interface iGetBadgesViewForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  badges: Array<iBalanceDocWithDetails<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetBadgesViewForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBadgesViewForUserSuccessResponse<T>>
  implements iGetBadgesViewForUserSuccessResponse<T>
{
  badges: BalanceDocWithDetails<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetBadgesViewForUserSuccessResponse<T>) {
    super();
    this.badges = data.badges.map((badge) => new BalanceDocWithDetails(badge));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetBadgesViewForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetBadgesViewForUserSuccessResponse<U>;
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
export interface iGetClaimActivityForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  activity: Array<iClaimActivityDoc<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetClaimActivityForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimActivityForUserSuccessResponse<T>>
  implements iGetClaimActivityForUserSuccessResponse<T>
{
  activity: ClaimActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetClaimActivityForUserSuccessResponse<T>) {
    super();
    this.activity = data.activity.map((activity) => new ClaimActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetClaimActivityForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetClaimActivityForUserSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetSiwbbRequestsForUserPayload extends iBaseQueryParams {}

/**
 * @category API Requests / Responses
 */
export interface iGetSiwbbRequestsForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  requests: Array<SIWBBRequestDoc<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetSiwbbRequestsForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetSiwbbRequestsForUserSuccessResponse<T>>
  implements iGetSiwbbRequestsForUserSuccessResponse<T>
{
  requests: SIWBBRequestDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetSiwbbRequestsForUserSuccessResponse<T>) {
    super();
    this.requests = data.requests.map((request) => new SIWBBRequestDoc(request));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetSiwbbRequestsForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetSiwbbRequestsForUserSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetPointsActivityForUserPayload extends iBaseQueryParams {}

/**
 * @category API Requests / Responses
 */
export interface iGetPointsActivityForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  activity: Array<iPointsActivityDoc<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetPointsActivityForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetPointsActivityForUserSuccessResponse<T>>
  implements iGetPointsActivityForUserSuccessResponse<T>
{
  activity: PointsActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetPointsActivityForUserSuccessResponse<T>) {
    super();
    this.activity = data.activity.map((activity) => new PointsActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetPointsActivityForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetPointsActivityForUserSuccessResponse<U>;
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
export interface iGetCollectionSuccessResponse<T extends NumberType> {
  /** The collection details */
  collection: iBitBadgesCollection<T>;
  /** The current collection metadata */
  metadata: iMetadata<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionSuccessResponse<T>>
  implements iGetCollectionSuccessResponse<T>
{
  collection: BitBadgesCollection<T>;
  metadata: Metadata<T>;

  constructor(data: iGetCollectionSuccessResponse<T>) {
    super();
    this.collection = new BitBadgesCollection(data.collection);
    this.metadata = new Metadata(data.metadata);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetBadgeMetadataPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetBadgeMetadataSuccessResponse<T extends NumberType> {
  metadata: iMetadata<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetBadgeMetadataSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetBadgeMetadataSuccessResponse<T>>
  implements iGetBadgeMetadataSuccessResponse<T>
{
  metadata: Metadata<T>;

  constructor(data: iGetBadgeMetadataSuccessResponse<T>) {
    super();
    this.metadata = new Metadata(data.metadata);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetBadgeMetadataSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetBadgeMetadataSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetCollectionClaimsPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionClaimsSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  claims: Array<iClaimDetails<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionClaimsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionClaimsSuccessResponse<T>>
  implements iGetCollectionClaimsSuccessResponse<T>
{
  claims: ClaimDetails<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionClaimsSuccessResponse<T>) {
    super();
    this.claims = data.claims.map((claim) => new ClaimDetails(claim));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetCollectionClaimsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetCollectionClaimsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetAddressListClaimsPayload {}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListClaimsSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  claims: Array<iClaimDetails<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetAddressListClaimsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAddressListClaimsSuccessResponse<T>>
  implements iGetAddressListClaimsSuccessResponse<T>
{
  claims: ClaimDetails<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetAddressListClaimsSuccessResponse<T>) {
    super();
    this.claims = data.claims.map((claim) => new ClaimDetails(claim));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetAddressListClaimsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAddressListClaimsSuccessResponse<U>;
  }
}
