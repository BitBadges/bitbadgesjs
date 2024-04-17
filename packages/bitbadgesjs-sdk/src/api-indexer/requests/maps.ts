import type { CustomType } from '@/common/base';
import { BaseNumberTypeClass, CustomTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import { iMap, iValueStore, Map, ValueStore } from '@/transactions/messages/bitbadges/maps';
import { iMetadata, Metadata } from '../metadata';
import { iUpdateHistory, UpdateHistory } from '../docs/docs';

/**
 * @category API Requests / Responses
 */
export interface GetMapsRouteRequestBody {
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
export interface iGetMapsRouteSuccessResponse<T extends NumberType> {
  maps: iMapWithValues<T>[];
}

/**
 * @category API Requests / Responses
 */
export class GetMapsRouteSuccessResponse<T extends NumberType>
  extends BaseNumberTypeClass<GetMapsRouteSuccessResponse<T>>
  implements iGetMapsRouteSuccessResponse<T>, CustomType<GetMapsRouteSuccessResponse<T>>
{
  maps: MapWithValues<T>[];

  constructor(data: iGetMapsRouteSuccessResponse<T>) {
    super();
    this.maps = data.maps.map((map) => new MapWithValues(map));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): GetMapsRouteSuccessResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as GetMapsRouteSuccessResponse<U>;
  }
}
