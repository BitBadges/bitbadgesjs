import type { CustomType } from '@/common/base';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, getConverterFunction } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import type { iAddressList } from '@/interfaces/badges/core';
import type { BaseBitBadgesApi, PaginationInfo } from './base';
import { EmptyResponseClass } from './base';
import { ListActivityDoc } from './docs/activity';
import { AddressListDoc } from './docs/docs';
import type { ClaimIntegrationPluginType, IntegrationPluginDetails, iAddressListDoc, iListActivityDoc } from './docs/interfaces';
import type { iMetadata } from './metadata/metadata';
import { Metadata } from './metadata/metadata';
import { BitBadgesApiRoutes } from './requests/routes';

/**
 * @category Interfaces
 */
export interface iBitBadgesAddressList<T extends NumberType> extends iAddressListDoc<T> {
  /** The metadata of the address list. */
  metadata?: iMetadata<T>;
  /** The activity of the address list. */
  listsActivity: iListActivityDoc<T>[];
  /** The views of the address list. */
  views: {
    [viewId: string]: {
      ids: string[];
      type: string;
      pagination: PaginationInfo;
    };
  };

  editClaims: {
    claimId: string;
    plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  }[];
}

/**
 * @category Address Lists
 */
export class BitBadgesAddressList<T extends NumberType>
  extends AddressListDoc<T>
  implements iBitBadgesAddressList<T>, CustomType<BitBadgesAddressList<T>>
{
  metadata?: Metadata<T>;
  listsActivity: ListActivityDoc<T>[];
  views: {
    [viewId: string]: {
      ids: string[];
      type: string;
      pagination: PaginationInfo;
    };
  };
  editClaims: { plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[]; claimId: string }[];

  constructor(data: iBitBadgesAddressList<T>) {
    super(data);
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.listsActivity = data.listsActivity.map((activity) => new ListActivityDoc(activity));
    this.views = data.views;
    this.editClaims = data.editClaims;
  }

  getNumberFieldNames(): string[] {
    return ['createdBlock', 'lastUpdated'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BitBadgesAddressList<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as BitBadgesAddressList<U>;
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
    return new BitBadgesAddressList(collection.addressLists[0]);
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
    return collection.addressLists.map((account) => new BitBadgesAddressList(account));
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
  async fetchNextForView(api: BaseBitBadgesApi<T>, viewType: 'listActivity', viewId: string) {
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
    if (!this.views[viewId]) {
      this.views[viewId] = {
        ids: [...res.addressLists[0].views[viewId].ids],
        type: 'listActivity',
        pagination: res.addressLists[0].views[viewId].pagination
      };
    } else {
      this.listsActivity.push(...res.addressLists[0].listsActivity);
      this.views[viewId].ids.push(...res.addressLists[0].views[viewId].ids);
      this.views[viewId].pagination = res.addressLists[0].views[viewId].pagination;
    }
  }

  /**
   * Fetches all the documents for a specific view. 1 second delay between each fetch to avoid rate limiting.
   */
  async fetchAllForView(api: BaseBitBadgesApi<T>, viewType: 'listActivity', viewId: string) {
    while (this.viewHasMore(viewId)) {
      await this.fetchNextForView(api, viewType, viewId);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  /**
   * Gets the documents array for a specific view.
   */
  getActivityView(viewId: string) {
    return (this.views[viewId]?.ids.map((x) => {
      return this.listsActivity.find((y) => y._docId === x);
    }) ?? []) as ListActivityDoc<T>[];
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
  static async GetAddressLists<T extends NumberType>(api: BaseBitBadgesApi<T>, options: GetAddressListsRouteRequestBody) {
    try {
      const response = await api.axios.post<iGetAddressListsRouteSuccessResponse<T>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetAddressListsRoute()}`,
        options
      );
      return new GetAddressListsRouteSuccessResponse(response.data);
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
  static async CreateAddressList<T extends NumberType>(api: BaseBitBadgesApi<T>, options: CreateAddressListsRouteRequestBody) {
    try {
      const response = await api.axios.post<iCreateAddressListsRouteSuccessResponse>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.CreateAddressListRoute()}`,
        options
      );
      return new CreateAddressListsRouteSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates an off-chain address list. On-chain lists are updated through blockchain transactions.
   */
  static async UpdateAddressList<T extends NumberType>(api: BaseBitBadgesApi<T>, options: UpdateAddressListsRouteRequestBody<T>) {
    try {
      const response = await api.axios.post<iUpdateAddressListsRouteSuccessResponse>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.UpdateAddressListRoute()}`,
        options
      );
      return new UpdateAddressListsRouteSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an off-chain address list. On-chain lists are deleted through blockchain transactions.
   */
  static async DeleteAddressList<T extends NumberType>(api: BaseBitBadgesApi<T>, options: DeleteAddressListsRouteRequestBody) {
    try {
      const response = await api.axios.post<iDeleteAddressListsRouteSuccessResponse>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.DeleteAddressListRoute()}`,
        options
      );
      return new DeleteAddressListsRouteSuccessResponse(response.data);
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

  const activity = cachedList.listsActivity || [];
  for (const newActivity of newCollection.listsActivity || []) {
    //If we already have the activity, replace it (we want newer data)
    const existingActivity = activity.findIndex((x) => x._docId === newActivity._docId);
    if (existingActivity !== -1) {
      activity[existingActivity] = newActivity;
    } else {
      activity.push(newActivity);
    }
  }

  //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, badgeUris, etc. We just ...spread these from the new response.
  cachedList = new BitBadgesAddressList({
    ...cachedList,
    ...newCollection,
    listsActivity: activity,
    views: newViews
  });

  return cachedList;
};

/**
 * @category API Requests / Responses
 */
export interface GetAddressListsRouteRequestBody {
  /**
   * The lists and accompanyin details to fetch. Supports on-chain, off-chain, and reserved lists.
   */
  listsToFetch: {
    listId: string;
    viewsToFetch?: {
      viewId: string;
      viewType: 'listActivity';
      bookmark: string;
    }[];
    fetchPrivateParams?: boolean;
  }[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetAddressListsRouteSuccessResponse<T extends NumberType> {
  addressLists: iBitBadgesAddressList<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetAddressListsRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetAddressListsRouteSuccessResponse<T>>
  implements iGetAddressListsRouteSuccessResponse<T>, CustomType<GetAddressListsRouteSuccessResponse<T>>
{
  addressLists: BitBadgesAddressList<T>[];

  constructor(data: iGetAddressListsRouteSuccessResponse<T>) {
    super();
    this.addressLists = data.addressLists.map((addressList) => new BitBadgesAddressList(addressList));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): GetAddressListsRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetAddressListsRouteSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface UpdateAddressListsRouteRequestBody<T extends NumberType> {
  /**
   * New address lists to update.
   * Requester must be creator of the lists.
   * Only applicable to off-chain balances.
   */
  addressLists: (iAddressList & {
    //Whether the list is private.
    private?: boolean;

    editClaims: {
      claimId: string;
      plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
    }[];

    viewableWithLink?: boolean;
  })[];
}

/**
 * @category API Requests / Responses
 */
export interface iUpdateAddressListsRouteSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export class UpdateAddressListsRouteSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface CreateAddressListsRouteRequestBody extends UpdateAddressListsRouteRequestBody<NumberType> {}

/**
 * @category API Requests / Responses
 */
export interface iCreateAddressListsRouteSuccessResponse {}

/**
 * @category API Requests / Responses
 */
export class CreateAddressListsRouteSuccessResponse extends EmptyResponseClass {}

/**
 * @category API Requests / Responses
 */
export interface DeleteAddressListsRouteRequestBody {
  /**
   * The list IDs to delete.
   */
  listIds: string[];
}
/**
 * @category API Requests / Responses
 */
export interface iDeleteAddressListsRouteSuccessResponse {}
/**
 * @category API Requests / Responses
 */
export class DeleteAddressListsRouteSuccessResponse extends EmptyResponseClass {}
