import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, ParsedQs } from '@/common/base.js';
import { NumberType } from '@/common/string-numbers.js';
import { PaginationInfo } from '../base.js';
import { BitBadgesAddressList, iBitBadgesAddressList } from '../BitBadgesAddressList.js';
import { BitBadgesCollection, iBitBadgesCollection } from '../BitBadgesCollection.js';

import { ClaimDetails } from '@/core/approvals.js';
import { ClaimActivityDoc, ClaimAlertDoc, ListActivityDoc, PointsActivityDoc, TransferActivityDoc } from '../docs/activity.js';
import {
  ApprovalTrackerDoc,
  AttestationDoc,
  BalanceDoc,
  BalanceDocWithDetails,
  MerkleChallengeTrackerDoc,
  SIWBBRequestDoc,
  UtilityListingDoc
} from '../docs/docs.js';
import {
  iApprovalTrackerDoc,
  iAttestationDoc,
  iBalanceDoc,
  iBalanceDocWithDetails,
  iClaimActivityDoc,
  iClaimAlertDoc,
  iClaimDetails,
  iListActivityDoc,
  iMerkleChallengeTrackerDoc,
  iPointsActivityDoc,
  iTransferActivityDoc,
  iUtilityListingDoc
} from '../docs/interfaces.js';
import { iMetadata, Metadata } from '../metadata/metadata.js';
import { CollectionViewKey } from './collections.js';

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
  /** Optional badge ID to filter listings by */
  badgeId?: NumberType;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionListingsSuccessResponse<T extends NumberType> {
  listings: Array<iUtilityListingDoc<T>>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionListingsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionListingsSuccessResponse<T>>
  implements iGetCollectionListingsSuccessResponse<T>
{
  listings: UtilityListingDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetCollectionListingsSuccessResponse<T>) {
    super();
    this.listings = data.listings.map((listing) => new UtilityListingDoc(listing));
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
export interface iGetAddressListActivityPayload {
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListActivitySuccessResponse<T extends NumberType> {
  activity: Array<iListActivityDoc<T>>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetAddressListActivitySuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAddressListActivitySuccessResponse<T>>
  implements iGetAddressListActivitySuccessResponse<T>
{
  activity: ListActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetAddressListActivitySuccessResponse<T>) {
    super();
    this.activity = data.activity.map((activity) => new ListActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetAddressListActivitySuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAddressListActivitySuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListListingsPayload {
  bookmark?: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListListingsSuccessResponse<T extends NumberType> {
  listings: Array<iUtilityListingDoc<T>>;
  pagination: PaginationInfo;
}

/**
 * @category API Requests / Responses
 */
export class GetAddressListListingsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAddressListListingsSuccessResponse<T>>
  implements iGetAddressListListingsSuccessResponse<T>
{
  listings: UtilityListingDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetAddressListListingsSuccessResponse<T>) {
    super();
    this.listings = data.listings.map((listing) => new UtilityListingDoc(listing));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetAddressListListingsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAddressListListingsSuccessResponse<U>;
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
  collectionId?: NumberType;
  /**
   * The view type to search for. Default is 'collected'
   *
   * - 'collected' will return the badges the user has a balance of
   * - 'managing' will return the badges the user is managing
   * - 'created' will return the badges the user has created
   */
  viewType?: 'collected' | 'managing' | 'created';
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListsForUserPayload extends iBaseQueryParams {
  /**
   * The view type to search for. Default is 'all'
   * - 'all' will return all address lists the user is a member of (both on whitelist or on blacklist)
   * - 'created' will return all address lists the user has created
   * - 'whitelists' will return all address lists the user is on the whitelist of
   * - 'blacklists' will return all address lists the user is on the blacklist of
   */
  viewType?: 'all' | 'created' | 'whitelists' | 'blacklists';
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
export interface iGetAddressListsForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  lists: Array<iBitBadgesAddressList<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetAddressListsForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAddressListsForUserSuccessResponse<T>>
  implements iGetAddressListsForUserSuccessResponse<T>
{
  lists: BitBadgesAddressList<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetAddressListsForUserSuccessResponse<T>) {
    super();
    this.lists = data.lists.map((list) => new BitBadgesAddressList(list));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetAddressListsForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAddressListsForUserSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetAttestationsForUserPayload extends iBaseQueryParams {
  /**
   * The view type to search for. Default is 'all'
   *
   * - 'all' will return all attestations the user has
   * - 'created' will return all attestations the user has created
   * - 'received' will return all attestations the user has received
   */
  viewType?: 'all' | 'created' | 'received';
}

/**
 * @category API Requests / Responses
 */
export interface iGetAttestationsForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  attestations: Array<iAttestationDoc<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetAttestationsForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAttestationsForUserSuccessResponse<T>>
  implements iGetAttestationsForUserSuccessResponse<T>
{
  attestations: AttestationDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetAttestationsForUserSuccessResponse<T>) {
    super();
    this.attestations = data.attestations.map((attestation) => new AttestationDoc(attestation));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetAttestationsForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAttestationsForUserSuccessResponse<U>;
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
export interface iGetListActivityForUserPayload extends iBaseQueryParams {}

/**
 * @category API Requests / Responses
 */
export interface iGetListActivityForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  listActivity: Array<iListActivityDoc<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetListActivityForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetListActivityForUserSuccessResponse<T>>
  implements iGetListActivityForUserSuccessResponse<T>
{
  listActivity: ListActivityDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetListActivityForUserSuccessResponse<T>) {
    super();
    this.listActivity = data.listActivity.map((activity) => new ListActivityDoc(activity));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetListActivityForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetListActivityForUserSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetClaimAlertsForUserPayload extends iBaseQueryParams {
  /**
   * The view type to search for. Default is 'received'
   *
   * - 'received' will return all claim alerts the user has received
   * - 'sent' will return all claim alerts the user has sent
   */
  viewType?: 'received' | 'sent';
}
/**
 * @category API Requests / Responses
 */
export interface iGetClaimAlertsForUserSuccessResponse<T extends NumberType> extends iBaseSuccessResponse {
  claimAlerts: Array<iClaimAlertDoc<T>>;
}

/**
 * @category API Requests / Responses
 */
export class GetClaimAlertsForUserSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetClaimAlertsForUserSuccessResponse<T>>
  implements iGetClaimAlertsForUserSuccessResponse<T>
{
  claimAlerts: ClaimAlertDoc<T>[];
  pagination: PaginationInfo;

  constructor(data: iGetClaimAlertsForUserSuccessResponse<T>) {
    super();
    this.claimAlerts = data.claimAlerts.map((alert) => new ClaimAlertDoc(alert));
    this.pagination = data.pagination;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetClaimAlertsForUserSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetClaimAlertsForUserSuccessResponse<U>;
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
