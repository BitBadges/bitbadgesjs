import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, CustomTypeClass, parseArrayString, ParsedQs } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { iValueStore, ValueStore } from '@/transactions/messages/bitbadges/maps/index.js';
import { MapWithValues } from '../docs-types/docs.js';
import { iMapWithValues } from '../docs-types/interfaces.js';

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
export interface iGetMapsSuccessResponse {
  maps: (iMapWithValues | undefined)[];
}

/**
 * @category API Requests / Responses
 */
export class GetMapsSuccessResponse extends BaseNumberTypeClass<GetMapsSuccessResponse> implements iGetMapsSuccessResponse, CustomType<GetMapsSuccessResponse> {
  maps: (MapWithValues | undefined)[];

  constructor(data: iGetMapsSuccessResponse) {
    super();
    this.maps = data.maps.map((map) => (map ? new MapWithValues(map) : undefined));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetMapsSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetMapsSuccessResponse;
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
export class GetMapValuesSuccessResponse extends BaseNumberTypeClass<GetMapValuesSuccessResponse> implements iGetMapValuesSuccessResponse, CustomType<GetMapValuesSuccessResponse> {
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

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetMapValuesSuccessResponse {
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
export interface iGetMapSuccessResponse {
  map: iMapWithValues | undefined;
}

/**
 * @category API Requests / Responses
 */
export class GetMapSuccessResponse extends BaseNumberTypeClass<GetMapSuccessResponse> implements iGetMapSuccessResponse, CustomType<GetMapSuccessResponse> {
  map: MapWithValues | undefined;

  constructor(data: iGetMapSuccessResponse) {
    super();
    this.map = data.map ? new MapWithValues(data.map) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetMapSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetMapSuccessResponse;
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
export interface iGetMapValueSuccessResponse extends iValueStore {}
/**
 * @category API Requests / Responses
 */
export class GetMapValueSuccessResponse extends BaseNumberTypeClass<GetMapValueSuccessResponse> implements iGetMapValueSuccessResponse, CustomType<GetMapValueSuccessResponse> {
  lastSetBy: string;
  key: string;
  value: string;

  constructor(data: iGetMapValueSuccessResponse) {
    super();
    this.lastSetBy = data.lastSetBy;
    this.key = data.key;
    this.value = data.value;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): GetMapValueSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as GetMapValueSuccessResponse;
  }
}
