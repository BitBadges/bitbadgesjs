import type { CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Map, ValueStore, iMap, iValueStore } from '@/transactions/messages/bitbadges/maps/index.js';
import { UpdateHistory, iUpdateHistory } from '../docs/docs.js';
import { Metadata, iMetadata } from '../metadata/index.js';

/**
 * @category API Requests / Responses
 */
export interface GetMapsPayload {
  /** The IDs of the maps to fetch. */
  mapIds: string[];
}

/**
 * @inheritDoc iMap
 * @category Interfaces
 */
export interface iMapWithValues<T extends NumberType> extends iMap<T> {
  /** The (key, value) pairs for the maps that are set. */
  values: { [key: string]: iValueStore };
  /** The fetched metadata for the map (if any). */
  metadata?: iMetadata<T>;
  /** The update history for the map. Maps are maintained through blockchain transactions. */
  updateHistory: iUpdateHistory<T>[];
}

/**
 * @inheritDoc iMapWithValues
 * @category Maps
 */
export class MapWithValues<T extends NumberType> extends Map<T> implements iMapWithValues<T> {
  values: { [key: string]: ValueStore };
  metadata?: Metadata<T>;
  updateHistory: UpdateHistory<T>[];

  constructor(data: iMapWithValues<T>) {
    super(data);
    this.values = Object.fromEntries(Object.entries(data.values).map(([key, value]) => [key, new ValueStore(value)]));
    this.metadata = data.metadata ? new Metadata(data.metadata) : undefined;
    this.updateHistory = data.updateHistory.map((update) => new UpdateHistory(update));
  }

  getNumberFieldNames(): string[] {
    return super.getNumberFieldNames();
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): MapWithValues<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MapWithValues<U>;
  }
}

/**
 * @category API Requests / Responses
 */
export interface iGetMapsSuccessResponse<T extends NumberType> {
  maps: iMapWithValues<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetMapsSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetMapsSuccessResponse<T>>
  implements iGetMapsSuccessResponse<T>, CustomType<GetMapsSuccessResponse<T>>
{
  maps: MapWithValues<T>[];

  constructor(data: iGetMapsSuccessResponse<T>) {
    super();
    this.maps = data.maps.map((map) => new MapWithValues(map));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): GetMapsSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetMapsSuccessResponse<U>;
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
  values: { mapId: string; values: { [key: string]: iValueStore } }[];
}

/**
 * @category API Requests / Responses
 */
export class GetMapValuesSuccessResponse
  extends BaseNumberTypeClass<GetMapValuesSuccessResponse>
  implements iGetMapValuesSuccessResponse, CustomType<GetMapValuesSuccessResponse>
{
  values: { mapId: string; values: { [key: string]: ValueStore } }[];

  constructor(data: iGetMapValuesSuccessResponse) {
    super();
    this.values = data.values.map((value) => ({
      mapId: value.mapId,
      values: Object.fromEntries(Object.entries(value.values).map(([key, value]) => [key, new ValueStore(value)]))
    }));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): GetMapValuesSuccessResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetMapValuesSuccessResponse;
  }
}
