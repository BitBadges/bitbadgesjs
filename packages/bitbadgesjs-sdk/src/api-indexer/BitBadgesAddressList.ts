import type { ConvertOptions, CustomType, ParsedQs } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, getConverterFunction } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { ClaimDetails } from '@/core/approvals.js';
import type { iAddressList } from '@/interfaces/badges/core.js';
import typia from 'typia';
import type { BaseBitBadgesApi, PaginationInfo } from './base.js';
import { EmptyResponseClass } from './base.js';
import { ListActivityDoc } from './docs/activity.js';
import { AddressListDoc, UtilityListingDoc } from './docs/docs.js';
import type { CreateClaimRequest, iAddressListDoc, iClaimDetails, iListActivityDoc, iUtilityListingDoc } from './docs/interfaces.js';
import type { iMetadata, iMetadataWithoutInternals } from './metadata/metadata.js';
import { Metadata } from './metadata/metadata.js';
import { BitBadgesApiRoutes } from './requests/routes.js';
/**
 * @inheritDoc iAddressListDoc
 * @category Interfaces
 */
export interface iBitBadgesAddressList<T extends NumberType> extends iAddressListDoc<T> {
  /** The metadata of the address list. */
  metadata?: iMetadata<T>;
  /** The activity of the address list. */
  listActivity: iListActivityDoc<T>[];
  /** The views of the address list. */
  views: {
    [viewId: string]: {
      ids: string[];
      type: string;
      pagination: PaginationInfo;
    };
  };
  /** The linked claims of the address list. */
  claims: iClaimDetails<T>[];
  /** The listings of the address list. */
  listings?: iUtilityListingDoc<T>[];
}

/**
 * @inheritDoc iBitBadgesAddressList
 * @category Address Lists
 */
export class BitBadgesAddressList<T extends NumberType>
  extends AddressListDoc<T>
  implements iBitBadgesAddressList<T>, CustomType<BitBadgesAddressList<T>>
{
  metadata?: Metadata<T>;
  listActivity: ListActivityDoc<T>[];
  views: {
    [viewId: string]: {
      ids: string[];
      type: string;
      pagination: PaginationInfo;
    };
  };
  listings?: UtilityListingDoc<T>[];
  claims: ClaimDetails<T>[];

  constructor(data: iBitBadgesAddressList<T>) {
    super(data);
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.listActivity = data.listActivity.map((activity) => new ListActivityDoc(activity));
    this.views = data.views;
    this.claims = data.claims.map((claim) => new ClaimDetails(claim));
    this.listings = data.listings?.map((listing) => new UtilityListingDoc(listing));
  }

  getNumberFieldNames(): string[] {
    return [...super.getNumberFieldNames(), 'createdBlock', 'lastUpdated'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): BitBadgesAddressList<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as BitBadgesAddressList<U>;
  }

  clone(): BitBadgesAddressList<T> {
    return super.clone() as BitBadgesAddressList<T>;
  }

  /**
   * Fetches and initializes a BitBadgesAddressList from the API. Must pass in a valid BitBadgesApi instance.
   */
  static async FetchAndInitialize<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    options: {
      listId: string;
      viewsToFetch?: {
        viewId: string;
        viewType: 'listActivity';
        bookmark: string;
      }[];
    }
  ) {
    const collection = await BitBadgesAddressList.GetAddressLists(api, { listsToFetch: [options] });
    const list = collection.addressLists[0];
    if (!list) throw new Error('No list found');

    return new BitBadgesAddressList(list);
  }

  /**
   * Fetches and initializes a batch of BitBadgesAddressList from the API. Must pass in a valid BitBadgesApi instance.
   */
  static async FetchAndInitializeBatch<T extends NumberType>(
    api: BaseBitBadgesApi<T>,
    options: {
      listId: string;
      viewsToFetch?: {
        viewId: string;
        viewType: 'listActivity';
        bookmark: string;
      }[];
    }[]
  ) {
    const collection = await BitBadgesAddressList.GetAddressLists(api, { listsToFetch: options });
    return collection.addressLists.map((account) => (account ? new BitBadgesAddressList(account) : undefined));
  }

  /**
   * Returns if the view has more pages to be fetched. If we have reached the end of the view, this will return false.
   */
  viewHasMore(viewId: string) {
    return this.views[viewId]?.pagination?.hasMore ?? true;
  }

  /**
   * Gets the pagination for a specific view ({ bookmark, hasMore }).
   */
  getViewPagination(viewId: string) {
    return this.views[viewId]?.pagination;
  }

  /**
   * Gets the bookmark for a specific view. This is to be passed into the fetchNextForView method.
   */
  getViewBookmark(viewId: string) {
    return this.views[viewId]?.pagination?.bookmark;
  }

  /**
   * Fetches the next batch of documents for a specific view. 25 documents are fetched at a time.
   * This updates the view in the class instance, as well as handling the pagination.
   */
  async fetchNextForView(api: BaseBitBadgesApi<T>, viewType: AddressListViewKey, viewId: string) {
    if (!this.viewHasMore(viewId)) return;

    const res = await BitBadgesAddressList.GetAddressLists(api, {
      listsToFetch: [
        {
          listId: this._docId,
          viewsToFetch: [
            {
              viewId,
              viewType,
              bookmark: this.getViewBookmark(viewId)
            }
          ]
        }
      ]
    });
    const list = res.addressLists[0];
    if (!list) throw new Error('No list found');
    const type = viewType === 'listings' ? 'listings' : 'listActivity';

    if (!this.views[viewId]) {
      this.views[viewId] = {
        ids: [...list.views[viewId].ids],
        type: type,
        pagination: list.views[viewId].pagination
      };
    } else {
      if (viewType === 'listings') {
        this.listings = [...(this.listings || []), ...(list.listings || [])];
      } else {
        this.listActivity.push(...list.listActivity);
      }
      this.views[viewId].ids.push(...list.views[viewId].ids);
      this.views[viewId].pagination = list.views[viewId].pagination;
    }
  }

  /**
   * Fetches all the documents for a specific view. 1 second delay between each fetch to avoid rate limiting.
   */
  async fetchAllForView(api: BaseBitBadgesApi<T>, viewType: AddressListViewKey, viewId: string) {
    while (this.viewHasMore(viewId)) {
      await this.fetchNextForView(api, viewType, viewId);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  /**
   * Type safe method to get the documents array for a specific view.
   */
  getView(viewType: AddressListViewKey, viewId: string): ListActivityDoc<T>[] | UtilityListingDoc<T>[] {
    return viewType === 'listActivity' ? this.getActivityView(viewId) : this.getListingsView(viewId);
  }

  /**
   * Gets the documents array for a specific view.
   */
  getActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.listActivity.find((y) => y._docId === x);
    }) ?? []) as ListActivityDoc<T>[];
  }

  getListingsView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.listings?.find((y) => y._docId === x);
    }) ?? []) as UtilityListingDoc<T>[];
  }

  /**
   * Returns true if the address list is stored off-chain. Off-chain lists are stored in the database and are not part of the blockchain.
   * They are updatable, deletable, and can be used for surveys. On-chain lists are immutable and are created through blockchain transactions.
   */
  isStoredOffChain() {
    return this._docId.includes('_');
  }

  /**
   * Updates the current list with a new response
   */
  updateWithNewResponse(newResponse: BitBadgesAddressList<T>, forceful?: boolean) {
    if (forceful) {
      const newInfo = new BitBadgesAddressList(newResponse);
      Object.assign(this, newInfo);
      return;
    } else {
      const newInfo = updateAddressListWithResponse(this, newResponse);
      Object.assign(this, newInfo);
      return;
    }
  }

  /**
   * Gets address lists from the API.
   */
  static async GetAddressLists<T extends NumberType>(api: BaseBitBadgesApi<T>, payload: iGetAddressListsPayload) {
    try {
      const validateRes: typia.IValidation<iGetAddressListsPayload> = typia.validate<iGetAddressListsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.post<iGetAddressListsSuccessResponse<T>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetAddressListsRoute()}`,
        payload
      );
      return new GetAddressListsSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates a new address list off-chain. On-chain lists are created through blockchain transactions.
   *
   * Behind the scenes, this is just an alias for UpdateAddressList.
   */
  static async CreateAddressList<T extends NumberType>(api: BaseBitBadgesApi<T>, payload: iCreateAddressListsPayload<T>) {
    try {
      const validateRes: typia.IValidation<iCreateAddressListsPayload<T>> = typia.validate<iCreateAddressListsPayload<T>>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.post<iCreateAddressListsSuccessResponse>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.CRUDAddressListsRoute()}`,
        payload
      );
      return new CreateAddressListsSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates an off-chain address list. On-chain lists are updated through blockchain transactions.
   */
  static async UpdateAddressList<T extends NumberType>(api: BaseBitBadgesApi<T>, payload: iUpdateAddressListsPayload<T>) {
    try {
      const validateRes: typia.IValidation<iUpdateAddressListsPayload<T>> = typia.validate<iUpdateAddressListsPayload<T>>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.put<iUpdateAddressListsSuccessResponse>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.CRUDAddressListsRoute()}`,
        payload
      );
      return new UpdateAddressListsSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates the core details of an off-chain address list.
   */
  static async UpdateAddressListCoreDetails<T extends NumberType>(api: BaseBitBadgesApi<T>, payload: iUpdateAddressListCoreDetailsPayload<T>) {
    try {
      const validateRes: typia.IValidation<iUpdateAddressListCoreDetailsPayload<T>> = typia.validate<iUpdateAddressListCoreDetailsPayload<T>>(
        payload ?? {}
      );
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.put<iUpdateAddressListCoreDetailsSuccessResponse>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.UpdateAddressListCoreDetailsRoute()}`,
        payload
      );
      return new UpdateAddressListCoreDetailsSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates the addresses of an off-chain address list. On-chain lists are updated through blockchain transactions.
   */
  static async UpdateAddressListAddresses<T extends NumberType>(api: BaseBitBadgesApi<T>, payload: iUpdateAddressListAddressesPayload) {
    try {
      const validateRes: typia.IValidation<iUpdateAddressListAddressesPayload> = typia.validate<iUpdateAddressListAddressesPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.put<iUpdateAddressListAddressesSuccessResponse>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.UpdateAddressListAddressesRoute()}`,
        payload
      );
      return new UpdateAddressListAddressesSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an off-chain address list. On-chain lists are deleted through blockchain transactions.
   */
  static async DeleteAddressList<T extends NumberType>(api: BaseBitBadgesApi<T>, payload: iDeleteAddressListsPayload) {
    try {
      const validateRes: typia.IValidation<iDeleteAddressListsPayload> = typia.validate<iDeleteAddressListsPayload>(payload ?? {});
      if (!validateRes.success) {
        throw new Error('Invalid payload: ' + JSON.stringify(validateRes.errors));
      }

      const response = await api.axios.delete<iDeleteAddressListsSuccessResponse>(`${api.BACKEND_URL}${BitBadgesApiRoutes.CRUDAddressListsRoute()}`, {
        data: payload
      });
      return new DeleteAddressListsSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }
}

const updateAddressListWithResponse = <T extends NumberType>(
  oldList: BitBadgesAddressList<T>,
  newResponse: BitBadgesAddressList<T>
): BitBadgesAddressList<T> => {
  const convertFunction = getConverterFunction(newResponse.createdBlock);
  let cachedList = oldList ? oldList.convert(convertFunction) : undefined;
  if (!cachedList) return newResponse;

  const newCollection = newResponse;
  const newViews = cachedList?.views || {};

  if (newCollection.views) {
    for (const [key, val] of Object.entries(newCollection.views)) {
      if (!val) continue;
      const oldVal = cachedList?.views[key];
      const newVal = val;

      newViews[key] = {
        ids: [...(oldVal?.ids || []), ...(newVal?.ids || [])].filter((val, index, self) => self.findIndex((x) => x === val) === index),
        pagination: newVal.pagination,
        type: val.type
      };
    }
  }

  const activity = cachedList.listActivity || [];
  for (const newActivity of newCollection.listActivity || []) {
    //If we already have the activity, replace it (we want newer data)
    const existingActivity = activity.findIndex((x) => x._docId === newActivity._docId);
    if (existingActivity !== -1) {
      activity[existingActivity] = newActivity;
    } else {
      activity.push(newActivity);
    }
  }

  const listings = cachedList.listings || [];
  for (const newListing of newCollection.listings || []) {
    const existingListing = listings.findIndex((x) => x._docId === newListing._docId);
    if (existingListing !== -1) {
      listings[existingListing] = newListing;
    } else {
      listings.push(newListing);
    }
  }

  //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, badgeUris, etc. We just ...spread these from the new response.
  cachedList = new BitBadgesAddressList({
    ...cachedList,
    ...newCollection,
    listActivity: activity,
    listings: listings,
    views: newViews
  });

  return cachedList;
};

/**
 * @category API Requests / Responses
 */
export type AddressListViewKey = 'listActivity' | 'listings';

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListPayload {}

/**
 * @category API Requests / Responses
 * @inheritDoc iGetAddressListPayload
 */
export class GetAddressListPayload implements iGetAddressListPayload {
  constructor(data: iGetAddressListPayload) {}

  static FromQuery(query: ParsedQs): GetAddressListPayload {
    return new GetAddressListPayload({});
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListSuccessResponse<T extends NumberType> {
  addressList: iBitBadgesAddressList<T>;
}

/**
 * @category API Requests / Responses
 */
export class GetAddressListSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAddressListSuccessResponse<T>>
  implements iGetAddressListSuccessResponse<T>, CustomType<GetAddressListSuccessResponse<T>>
{
  addressList: BitBadgesAddressList<T>;

  constructor(data: iGetAddressListSuccessResponse<T>) {
    super();
    this.addressList = new BitBadgesAddressList(data.addressList);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetAddressListSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAddressListSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListsPayload {
  /**
   * The lists and accompanying details to fetch. Supports on-chain, off-chain, and reserved lists.
   */
  listsToFetch: {
    listId: string;
    viewsToFetch?: {
      viewId: string;
      viewType: AddressListViewKey;
      bookmark: string;
    }[];
    /** Certain views and details are private. If you are the creator of the list, you can fetch these details. By default, we do not fetch them. */
    fetchPrivateParams?: boolean;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListsSuccessResponse<T extends NumberType> {
  addressLists: (iBitBadgesAddressList<T> | undefined)[];
}

/**
 * @category API Requests / Responses
 */
export class GetAddressListsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAddressListsSuccessResponse<T>>
  implements iGetAddressListsSuccessResponse<T>, CustomType<GetAddressListsSuccessResponse<T>>
{
  addressLists: (BitBadgesAddressList<T> | undefined)[];

  constructor(data: iGetAddressListsSuccessResponse<T>) {
    super();
    this.addressLists = data.addressLists.map((addressList) => (addressList ? new BitBadgesAddressList(addressList) : undefined));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): GetAddressListsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetAddressListsSuccessResponse<U>;
  }
}

/**
 * @category Interfaces
 */
export type iAddressListCreateObject<T extends NumberType> = Omit<iAddressList, 'createdBy'> & {
  /**
   * Flag to update addresses?. Because w/ claims there can be race conditions,
   * we have this flag.
   *
   * If true, we overwrite with provided addresses. If false, we leave addresses untouched.
   */
  updateAddresses?: boolean;

  /** The linked claims of the address list. */
  claims: CreateClaimRequest<NumberType>[];

  /** Metadata of the address list to upload. This will override and set the uri parameter. */
  metadata?: iMetadataWithoutInternals<T>;
};

/**
 * @category API Requests / Responses
 */
export interface iUpdateAddressListsPayload<T extends NumberType> {
  addressLists: iAddressListCreateObject<T>[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAddressListsSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export class UpdateAddressListsSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iCreateAddressListsPayload<T extends NumberType> extends iUpdateAddressListsPayload<T> {}

/**
 * @category API Requests / Responses
 */
export interface iCreateAddressListsSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class CreateAddressListsSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iDeleteAddressListsPayload {
  /**
   * The list IDs to delete.
   */
  listIds: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iDeleteAddressListsSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export class DeleteAddressListsSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export type iUpdateAddressListCoreDetailsPayload<T extends NumberType> = Omit<iAddressList, 'createdBy' | 'addresses'> & {
  /**
   * The new metadata of the address list.
   *
   * If provided, we upload this to our databases and this will override the uri parameter.
   */
  metadata?: iMetadataWithoutInternals<T>;
};

/**
 * @category API Requests / Responses
 */
export interface iUpdateAddressListCoreDetailsSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdateAddressListCoreDetailsSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAddressListAddressesPayload {
  /**
   * The list ID to update.
   */
  listId: string;
  /**
   * The addresses to update. This is a full overwrite for ALL addresses.
   *
   * If you have active claims, ensure this does not conflict via race conditions.
   */
  addresses: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAddressListAddressesSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class UpdateAddressListAddressesSuccessResponse extends EmptyResponseClass {}
