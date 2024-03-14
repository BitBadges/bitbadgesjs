import type { NumberType } from '@/common/string-numbers';
import type { iProtocol } from '@/transactions/messages/bitbadges/protocols/interfaces';
import type { BaseBitBadgesApi } from '../base';
import { BitBadgesApiRoutes } from './routes';
import type { CustomType } from '@/common/base';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';

/**
 * @category Protocols
 */
export class Protocol extends CustomTypeClass<Protocol> implements Protocol {
  name: string;
  uri: string;
  customData: string;
  createdBy: string;
  isFrozen: boolean;

  constructor(data: iProtocol) {
    super();
    this.name = data.name;
    this.uri = data.uri;
    this.customData = data.customData;
    this.createdBy = data.createdBy;
    this.isFrozen = data.isFrozen;
  }

  /**
   * Fetches and initializes a protocol by name. Must be called with an initialized API.
   */
  static async FetchAndInitializeProtocol<T extends NumberType>(api: BaseBitBadgesApi<T>, name: string): Promise<Protocol> {
    const res = await Protocol.GetProtocols(api, { names: [name] });
    return res.protocols[0];
  }

  /**
   * Gets the collection ID for a protocol for a user. Must be called with an initialized API.
   */
  static async GetCollectionForProtocol<T extends NumberType>(api: BaseBitBadgesApi<T>, body: GetCollectionForProtocolRouteRequestBody) {
    try {
      const response = await api.axios.post<iGetCollectionForProtocolRouteSuccessResponse<string>>(
        `${api.BACKEND_URL}${BitBadgesApiRoutes.GetCollectionForProtocolRoute()}`,
        body
      );
      return new GetCollectionForProtocolRouteSuccessResponse(response.data).convert(api.ConvertFunction);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets the collection ID for a protocol for a specific user. Must be called with an initialized API.
   */
  async getCollectionForProtocol<T extends NumberType>(api: BaseBitBadgesApi<T>, address: string) {
    return Protocol.GetCollectionForProtocol(api, { name: this.name, address });
  }

  /**
   * Gets the protocols by protocol names. Must be called with an initialized API.
   */
  static async GetProtocols<T extends NumberType>(api: BaseBitBadgesApi<T>, body: GetProtocolsRouteRequestBody) {
    try {
      const response = await api.axios.post<iGetProtocolsRouteSuccessResponse>(`${api.BACKEND_URL}${BitBadgesApiRoutes.GetProtocolsRoute()}`, body);
      return new GetProtocolsRouteSuccessResponse(response.data);
    } catch (error) {
      await api.handleApiError(error);
      return Promise.reject(error);
    }
  }

  //CRUD is done on-chain
}

/**
 * @category API Requests / Responses
 */
export interface GetProtocolsRouteRequestBody {
  names: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetProtocolsRouteSuccessResponse {
  protocols: iProtocol[];
}

/**
 * @category API Requests / Responses
 */
export class GetProtocolsRouteSuccessResponse
  extends CustomTypeClass<GetProtocolsRouteSuccessResponse>
  implements iGetProtocolsRouteSuccessResponse, CustomType<GetProtocolsRouteSuccessResponse>
{
  protocols: Protocol[];

  constructor(data: iGetProtocolsRouteSuccessResponse) {
    super();
    this.protocols = data.protocols.map((protocol) => new Protocol(protocol));
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetCollectionForProtocolRouteRequestBody {
  name: string;
  address: string;
}

/**
 * @category API Requests / Responses
 */
export interface iGetCollectionForProtocolRouteSuccessResponse<T extends NumberType> {
  collectionId: T;
}

/**
 * @category API Requests / Responses
 */
export class GetCollectionForProtocolRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetCollectionForProtocolRouteSuccessResponse<T>>
  implements iGetCollectionForProtocolRouteSuccessResponse<T>, CustomType<GetCollectionForProtocolRouteSuccessResponse<T>>
{
  collectionId: T;

  constructor(data: iGetCollectionForProtocolRouteSuccessResponse<T>) {
    super();
    this.collectionId = data.collectionId;
  }
  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): GetCollectionForProtocolRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetCollectionForProtocolRouteSuccessResponse<U>;
  }
}
