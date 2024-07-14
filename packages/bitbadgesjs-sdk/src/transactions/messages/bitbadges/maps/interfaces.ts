import { CosmosAddress } from '@/api-indexer/index.js';
import { NumberType, Stringify } from '@/common/string-numbers.js';
import { ActionPermission, CollectionMetadata, ManagerTimeline, TimedUpdatePermission, UintRangeArray } from '@/core/index.js';
import {
  BaseNumberTypeClass,
  convertClassPropertiesAndMaintainNumberTypes,
  CustomTypeClass,
  iActionPermission,
  iCollectionMetadata,
  iManagerTimeline,
  iTimedUpdatePermission,
  iUintRange
} from '@/interfaces/index.js';
import * as maps from '@/proto/maps/tx_pb.js';

/**
 * @category Interfaces
 */
export interface iValueStore {
  key: string;
  value: string;
  lastSetBy: CosmosAddress;
}

/**
 * @category Interfaces
 */
export interface iMapUpdateCriteria<T extends NumberType> {
  managerOnly: boolean;
  collectionId: T;
  creatorOnly: boolean;
  firstComeFirstServe: boolean;
}

/**
 * @category Interfaces
 */
export interface iValueOptions {
  noDuplicates: boolean;
  permanentOnceSet: boolean;
  expectUint: boolean;
  expectBoolean: boolean;
  expectAddress: boolean;
  expectUri: boolean;
}

/**
 * @category Interfaces
 */
export interface iMapPermissions<T extends NumberType> {
  canUpdateMetadata: iTimedUpdatePermission<T>[];
  canUpdateManager: iTimedUpdatePermission<T>[];
  canDeleteMap: iActionPermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMap<T extends NumberType> {
  creator: CosmosAddress;
  mapId: string;

  inheritManagerTimelineFrom: T;
  managerTimeline: iManagerTimeline<T>[];

  updateCriteria: iMapUpdateCriteria<T>;

  valueOptions: iValueOptions;
  defaultValue: string;

  permissions: iMapPermissions<T>;

  metadataTimeline: iMapMetadataTimeline<T>[];
}

/**
 * @category Interfaces
 */
export interface iMapMetadataTimeline<T extends NumberType> {
  timelineTimes: iUintRange<T>[];
  metadata: iCollectionMetadata;
}

/**
 * @category Interfaces
 */
export interface iMsgCreateMap<T extends NumberType> {
  creator: CosmosAddress;
  mapId: string;

  inheritManagerTimelineFrom: T;
  managerTimeline: iManagerTimeline<T>[];

  updateCriteria: iMapUpdateCriteria<T>;
  valueOptions: iValueOptions;
  defaultValue: string;

  metadataTimeline: iMapMetadataTimeline<T>[];

  permissions: iMapPermissions<T>;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateMap<T extends NumberType> {
  creator: CosmosAddress;
  mapId: string;

  updateManagerTimeline: boolean;
  managerTimeline: iManagerTimeline<T>[];

  updateMetadataTimeline: boolean;
  metadataTimeline: iMapMetadataTimeline<T>[];

  updatePermissions: boolean;
  permissions: iMapPermissions<T>;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteMap {
  creator: CosmosAddress;
  mapId: string;
}

/**
 * @category Interfaces
 */
export interface iMsgSetValue {
  creator: CosmosAddress;
  mapId: string;
  key: string;
  value: string;
  options: iSetOptions;
}

/**
 * @category Interfaces
 */
export interface iSetOptions {
  useMostRecentCollectionId: boolean;
}

/**
 * @category Maps
 */
export class ValueStore extends CustomTypeClass<ValueStore> implements iValueStore {
  key: string;
  value: string;
  lastSetBy: CosmosAddress;

  constructor(msg: iValueStore) {
    super();
    this.key = msg.key;
    this.value = msg.value;
    this.lastSetBy = msg.lastSetBy;
  }
}

/**
 * @category Maps
 */
export class MapUpdateCriteria<T extends NumberType> extends BaseNumberTypeClass<MapUpdateCriteria<T>> implements iMapUpdateCriteria<T> {
  managerOnly: boolean;
  collectionId: T;
  creatorOnly: boolean;
  firstComeFirstServe: boolean;

  constructor(msg: iMapUpdateCriteria<T>) {
    super();
    this.managerOnly = msg.managerOnly;
    this.collectionId = msg.collectionId;
    this.creatorOnly = msg.creatorOnly;
    this.firstComeFirstServe = msg.firstComeFirstServe;
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): MapUpdateCriteria<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MapUpdateCriteria<U>;
  }
}

/**
 * @category Maps
 */
export class ValueOptions extends CustomTypeClass<ValueOptions> implements iValueOptions {
  noDuplicates: boolean;
  permanentOnceSet: boolean;
  expectUint: boolean;
  expectBoolean: boolean;
  expectAddress: boolean;
  expectUri: boolean;

  constructor(msg: iValueOptions) {
    super();
    this.noDuplicates = msg.noDuplicates;
    this.permanentOnceSet = msg.permanentOnceSet;
    this.expectUint = msg.expectUint;
    this.expectBoolean = msg.expectBoolean;
    this.expectAddress = msg.expectAddress;
    this.expectUri = msg.expectUri;
  }
}

/**
 * @category Maps
 */
export class MapPermissions<T extends NumberType> extends BaseNumberTypeClass<MapPermissions<T>> implements iMapPermissions<T> {
  canUpdateMetadata: TimedUpdatePermission<T>[];
  canUpdateManager: TimedUpdatePermission<T>[];
  canDeleteMap: ActionPermission<T>[];

  constructor(msg: iMapPermissions<T>) {
    super();
    this.canUpdateMetadata = msg.canUpdateMetadata.map((item) => new TimedUpdatePermission(item));
    this.canUpdateManager = msg.canUpdateManager.map((item) => new TimedUpdatePermission(item));
    this.canDeleteMap = msg.canDeleteMap.map((item) => new ActionPermission(item));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): MapPermissions<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MapPermissions<U>;
  }
}

/**
 * @category Maps
 */
export class MapMetadataTimeline<T extends NumberType> extends BaseNumberTypeClass<MapMetadataTimeline<T>> implements iMapMetadataTimeline<T> {
  timelineTimes: UintRangeArray<T>;
  metadata: CollectionMetadata;

  constructor(msg: iMapMetadataTimeline<T>) {
    super();
    this.timelineTimes = UintRangeArray.From(msg.timelineTimes);
    this.metadata = new CollectionMetadata(msg.metadata);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): MapMetadataTimeline<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MapMetadataTimeline<U>;
  }
}

/**
 * @category Maps
 */
export class Map<T extends NumberType> extends BaseNumberTypeClass<Map<T>> implements iMap<T> {
  creator: CosmosAddress;
  mapId: string;

  inheritManagerTimelineFrom: T;
  managerTimeline: ManagerTimeline<T>[];

  updateCriteria: MapUpdateCriteria<T>;

  valueOptions: ValueOptions;
  defaultValue: string;
  permissions: MapPermissions<T>;

  metadataTimeline: MapMetadataTimeline<T>[];

  constructor(msg: iMap<T>) {
    super();
    this.creator = msg.creator;
    this.mapId = msg.mapId;
    this.inheritManagerTimelineFrom = msg.inheritManagerTimelineFrom;
    this.managerTimeline = msg.managerTimeline.map((item) => new ManagerTimeline(item));
    this.updateCriteria = new MapUpdateCriteria(msg.updateCriteria);
    this.valueOptions = new ValueOptions(msg.valueOptions);
    this.defaultValue = msg.defaultValue;
    this.permissions = new MapPermissions(msg.permissions);
    this.metadataTimeline = msg.metadataTimeline.map((item) => new MapMetadataTimeline(item));
  }

  getNumberFieldNames(): string[] {
    return ['inheritManagerTimelineFrom'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): Map<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as Map<U>;
  }
}

/**
 * @category Transactions
 */
export class MsgCreateMap<T extends NumberType> extends BaseNumberTypeClass<MsgCreateMap<T>> implements iMsgCreateMap<T> {
  creator: CosmosAddress;
  mapId: string;

  inheritManagerTimelineFrom: T;
  managerTimeline: ManagerTimeline<T>[];

  updateCriteria: MapUpdateCriteria<T>;
  valueOptions: ValueOptions;
  defaultValue: string;

  metadataTimeline: MapMetadataTimeline<T>[];

  permissions: MapPermissions<T>;

  constructor(msg: iMsgCreateMap<T>) {
    super();
    this.creator = msg.creator;
    this.mapId = msg.mapId;
    this.inheritManagerTimelineFrom = msg.inheritManagerTimelineFrom;
    this.managerTimeline = msg.managerTimeline.map((item) => new ManagerTimeline(item));
    this.updateCriteria = new MapUpdateCriteria(msg.updateCriteria);
    this.valueOptions = new ValueOptions(msg.valueOptions);
    this.defaultValue = msg.defaultValue;
    this.metadataTimeline = msg.metadataTimeline.map((item) => new MapMetadataTimeline(item));
    this.permissions = new MapPermissions(msg.permissions);
  }

  getNumberFieldNames(): string[] {
    return ['inheritManagerTimelineFrom'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): MsgCreateMap<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MsgCreateMap<U>;
  }

  toProto(): maps.MsgCreateMap {
    return new maps.MsgCreateMap(this.convert(Stringify));
  }
}

/**
 * @category Transactions
 */
export class MsgUpdateMap<T extends NumberType> extends BaseNumberTypeClass<MsgUpdateMap<T>> implements iMsgUpdateMap<T> {
  creator: CosmosAddress;
  mapId: string;

  updateManagerTimeline: boolean;
  managerTimeline: ManagerTimeline<T>[];

  updateMetadataTimeline: boolean;
  metadataTimeline: MapMetadataTimeline<T>[];

  updatePermissions: boolean;
  permissions: MapPermissions<T>;

  constructor(msg: iMsgUpdateMap<T>) {
    super();
    this.creator = msg.creator;
    this.mapId = msg.mapId;
    this.updateManagerTimeline = msg.updateManagerTimeline;
    this.managerTimeline = msg.managerTimeline.map((item) => new ManagerTimeline(item));
    this.updateMetadataTimeline = msg.updateMetadataTimeline;
    this.metadataTimeline = msg.metadataTimeline.map((item) => new MapMetadataTimeline(item));
    this.updatePermissions = msg.updatePermissions;
    this.permissions = new MapPermissions(msg.permissions);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U): MsgUpdateMap<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MsgUpdateMap<U>;
  }

  toProto(): maps.MsgUpdateMap {
    return new maps.MsgUpdateMap(this.convert(Stringify));
  }
}

/**
 * @category Transactions
 */
export class MsgDeleteMap extends CustomTypeClass<MsgDeleteMap> implements iMsgDeleteMap {
  creator: CosmosAddress;
  mapId: string;

  constructor(msg: iMsgDeleteMap) {
    super();
    this.creator = msg.creator;
    this.mapId = msg.mapId;
  }

  toProto(): maps.MsgDeleteMap {
    return new maps.MsgDeleteMap(this);
  }
}

/**
 * @category Transactions
 */
export class MsgSetValue extends CustomTypeClass<MsgSetValue> implements iMsgSetValue {
  creator: CosmosAddress;
  mapId: string;
  key: string;
  value: string;
  options: iSetOptions;

  constructor(msg: iMsgSetValue) {
    super();
    this.creator = msg.creator;
    this.mapId = msg.mapId;
    this.key = msg.key;
    this.value = msg.value;
    this.options = msg.options;
  }

  toProto(): maps.MsgSetValue {
    return new maps.MsgSetValue(this);
  }
}
