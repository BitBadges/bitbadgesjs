import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { ValueStore, iValueStore } from '@/transactions/messages/bitbadges/maps/index.js';
import { MapWithValues } from '../docs/docs.js';
import { iMapWithValues } from '../docs/interfaces.js';

/**
 * @category API Requests / Responses
 */
export interface GetMapsPayload {
  /** The IDs of the maps to fetch. */
  mapIds: string[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetMapsSuccessResponse<T extends NumberType> {
  maps: (iMapWithValues<T> | undefined)[];
}

/**
 * @category API Requests / Responses
 */
export class GetMapsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetMapsSuccessResponse<T>>
  implements iGetMapsSuccessResponse<T>, CustomType<GetMapsSuccessResponse<T>>
{
  maps: (MapWithValues<T> | undefined)[];

  constructor(data: iGetMapsSuccessResponse<T>) {
    super();
    this.maps = data.maps.map((map) => (map ? new MapWithValues(map) : undefined));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetMapsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetMapsSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface GetMapValuesPayload {
  /** The values to fetch for each map. */
  valuesToFetch: { mapId: string; keys: string[] }[];
}

/**
 * @category API Requests / Responses
 */
export interface iGetMapValuesSuccessResponse {
  values: ({ mapId: string; values: { [key: string]: iValueStore } } | undefined)[];
}

/**
 * @category API Requests / Responses
 */
export class GetMapValuesSuccessResponse
  extends BaseNumberTypeClass<GetMapValuesSuccessResponse>
  implements iGetMapValuesSuccessResponse, CustomType<GetMapValuesSuccessResponse>
{
  values: ({ mapId: string; values: { [key: string]: ValueStore } } | undefined)[];

  constructor(data: iGetMapValuesSuccessResponse) {
    super();
    this.values = data.values.map((value) => {
      if (!value) return undefined;
      return {
        mapId: value.mapId,
        values: Object.fromEntries(Object.entries(value.values).map(([key, value]) => [key, new ValueStore(value)]))
      };
    });
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetMapValuesSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetMapValuesSuccessResponse;
  }
}
