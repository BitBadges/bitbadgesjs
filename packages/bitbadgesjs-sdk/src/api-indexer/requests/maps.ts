import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, CustomTypeClass, parseArrayString, ParsedQs } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { iValueStore, ValueStore } from '@/transactions/messages/bitbadges/maps/index.js';
import { MapWithValues } from '../docs/docs.js';
import { iMapWithValues } from '../docs/interfaces.js';

/**
 * @category API Requests / Responses
 */
export interface iGetMapsPayload {
  /** The IDs of the maps to fetch. */
  mapIds: string[];
}

/**
 * @category API Requests / Responses
 */
export class GetMapsPayload extends CustomTypeClass<GetMapsPayload> implements iGetMapsPayload {
  mapIds: string[];

  constructor(payload: iGetMapsPayload) {
    super();
    this.mapIds = payload.mapIds;
  }

  static FromQuery(query: ParsedQs): GetMapsPayload {
    return new GetMapsPayload({
      mapIds: parseArrayString(query.mapIds) ?? []
    });
  }
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
export interface iGetMapValuesPayload {
  /** The map ID to fetch. */
  mapId: string;
  /** The values to fetch for each map. */
  keys: string[];
}

/**
 * @category API Requests / Responses
 */
export class GetMapValuesPayload extends CustomTypeClass<GetMapValuesPayload> implements iGetMapValuesPayload {
  mapId: string;
  keys: string[];

  constructor(payload: iGetMapValuesPayload) {
    super();
    this.mapId = payload.mapId;
    this.keys = payload.keys;
  }

  static FromQuery(query: ParsedQs): GetMapValuesPayload {
    return new GetMapValuesPayload({
      mapId: query.mapId?.toString() ?? '',
      keys: parseArrayString(query.keys) ?? []
    });
  }
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

/**
 * @category API Requests / Responses
 */
export interface iGetMapPayload {}

/**
 * @category API Requests / Responses
 */
export class GetMapPayload extends CustomTypeClass<GetMapPayload> implements iGetMapPayload {
  constructor(payload: iGetMapPayload) {
    super();
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetMapSuccessResponse<T extends NumberType> {
  map: iMapWithValues<T> | undefined;
}

/**
 * @category API Requests / Responses
 */
export class GetMapSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetMapSuccessResponse<T>>
  implements iGetMapSuccessResponse<T>, CustomType<GetMapSuccessResponse<T>>
{
  map: MapWithValues<T> | undefined;

  constructor(data: iGetMapSuccessResponse<T>) {
    super();
    this.map = data.map ? new MapWithValues(data.map) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetMapSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetMapSuccessResponse<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetMapValuePayload {}

/**
 * @category API Requests / Responses
 */
export class GetMapValuePayload extends CustomTypeClass<GetMapValuePayload> implements iGetMapValuePayload {
  constructor(payload: iGetMapValuePayload) {
    super();
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetMapValueSuccessResponse {
  value: { mapId: string; value: iValueStore } | undefined;
}

/**
 * @category API Requests / Responses
 */
export class GetMapValueSuccessResponse
  extends BaseNumberTypeClass<GetMapValueSuccessResponse>
  implements iGetMapValueSuccessResponse, CustomType<GetMapValueSuccessResponse>
{
  value: { mapId: string; value: ValueStore } | undefined;

  constructor(data: iGetMapValueSuccessResponse) {
    super();
    this.value = data.value
      ? {
          mapId: data.value.mapId,
          value: new ValueStore(data.value.value)
        }
      : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): GetMapValueSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetMapValueSuccessResponse;
  }
}
