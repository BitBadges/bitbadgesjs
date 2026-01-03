import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions, CustomTypeClass } from '@/common/base.js';
import { NumberType, Stringify } from '@/common/string-numbers.js';
import { CollectionMetadata } from '@/core/misc.js';
import { ActionPermission } from '@/core/permissions.js';
import type { iActionPermission, iCollectionMetadata } from '@/interfaces/index.js';
import * as maps from '@/proto/maps/tx_pb.js';

/**
 * @category Interfaces
 */
export interface iValueStore {
  key: string;
  value: string;
  lastSetBy: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iMapUpdateCriteria<T extends NumberType> {
  managerOnly: boolean;
  collectionId: string;
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
  canUpdateMetadata: iActionPermission<T>[];
  canUpdateManager: iActionPermission<T>[];
  canDeleteMap: iActionPermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMap<T extends NumberType> {
  creator: BitBadgesAddress;
  mapId: string;

  inheritManagerFrom: T;
  manager: string;

  updateCriteria: iMapUpdateCriteria<T>;

  valueOptions: iValueOptions;
  defaultValue: string;

  permissions: iMapPermissions<T>;

  metadata: iCollectionMetadata;
}

/**
 * @category Interfaces
 */
export interface iMsgCreateMap<T extends NumberType> {
  creator: BitBadgesAddress;
  mapId: string;

  inheritManagerFrom: T;
  manager: string;

  updateCriteria: iMapUpdateCriteria<T>;
  valueOptions: iValueOptions;
  defaultValue: string;

  metadata: iCollectionMetadata;

  permissions: iMapPermissions<T>;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateMap<T extends NumberType> {
  creator: BitBadgesAddress;
  mapId: string;

  updateManager: boolean;
  manager: string;

  updateMetadata: boolean;
  metadata: iCollectionMetadata;

  updatePermissions: boolean;
  permissions: iMapPermissions<T>;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteMap {
  creator: BitBadgesAddress;
  mapId: string;
}

/**
 * @category Interfaces
 */
export interface iMsgSetValue {
  creator: BitBadgesAddress;
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
  lastSetBy: BitBadgesAddress;

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
  collectionId: string;
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
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MapUpdateCriteria<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MapUpdateCriteria<U>;
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
  canUpdateMetadata: ActionPermission<T>[];
  canUpdateManager: ActionPermission<T>[];
  canDeleteMap: ActionPermission<T>[];

  constructor(msg: iMapPermissions<T>) {
    super();
    this.canUpdateMetadata = msg.canUpdateMetadata.map((item) => new ActionPermission(item));
    this.canUpdateManager = msg.canUpdateManager.map((item) => new ActionPermission(item));
    this.canDeleteMap = msg.canDeleteMap.map((item) => new ActionPermission(item));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): MapPermissions<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MapPermissions<U>;
  }
}

/**
 * @category Maps
 */
export class Map<T extends NumberType> extends BaseNumberTypeClass<Map<T>> implements iMap<T> {
  creator: BitBadgesAddress;
  mapId: string;

  inheritManagerFrom: T;
  manager: string;

  updateCriteria: MapUpdateCriteria<T>;

  valueOptions: ValueOptions;
  defaultValue: string;
  permissions: MapPermissions<T>;

  metadata: iCollectionMetadata;

  constructor(msg: iMap<T>) {
    super();
    this.creator = msg.creator;
    this.mapId = msg.mapId;
    this.inheritManagerFrom = msg.inheritManagerFrom;
    this.manager = msg.manager;
    this.updateCriteria = new MapUpdateCriteria(msg.updateCriteria);
    this.valueOptions = new ValueOptions(msg.valueOptions);
    this.defaultValue = msg.defaultValue;
    this.permissions = new MapPermissions(msg.permissions);
    this.metadata = new CollectionMetadata(msg.metadata);
  }

  getNumberFieldNames(): string[] {
    return ['inheritManagerFrom'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): Map<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Map<U>;
  }
}

/**
 * @category Transactions
 */
export class MsgCreateMap<T extends NumberType> extends BaseNumberTypeClass<MsgCreateMap<T>> implements iMsgCreateMap<T> {
  creator: BitBadgesAddress;
  mapId: string;

  inheritManagerFrom: T;
  manager: string;

  updateCriteria: MapUpdateCriteria<T>;
  valueOptions: ValueOptions;
  defaultValue: string;

  metadata: iCollectionMetadata;

  permissions: MapPermissions<T>;

  constructor(msg: iMsgCreateMap<T>) {
    super();
    this.creator = msg.creator;
    this.mapId = msg.mapId;
    this.inheritManagerFrom = msg.inheritManagerFrom;
    this.manager = msg.manager;
    this.updateCriteria = new MapUpdateCriteria(msg.updateCriteria);
    this.valueOptions = new ValueOptions(msg.valueOptions);
    this.defaultValue = msg.defaultValue;
    this.metadata = new CollectionMetadata(msg.metadata);
    this.permissions = new MapPermissions(msg.permissions);
  }

  getNumberFieldNames(): string[] {
    return ['inheritManagerFrom'];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): MsgCreateMap<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgCreateMap<U>;
  }

  toProto(): maps.MsgCreateMap {
    return new maps.MsgCreateMap(this.convert(Stringify));
  }
}

/**
 * @category Transactions
 */
export class MsgUpdateMap<T extends NumberType> extends BaseNumberTypeClass<MsgUpdateMap<T>> implements iMsgUpdateMap<T> {
  creator: BitBadgesAddress;
  mapId: string;

  updateManager: boolean;
  manager: string;

  updateMetadata: boolean;
  metadata: iCollectionMetadata;

  updatePermissions: boolean;
  permissions: MapPermissions<T>;

  constructor(msg: iMsgUpdateMap<T>) {
    super();
    this.creator = msg.creator;
    this.mapId = msg.mapId;
    this.updateManager = msg.updateManager;
    this.manager = msg.manager;
    this.updateMetadata = msg.updateMetadata;
    this.metadata = new CollectionMetadata(msg.metadata);
    this.updatePermissions = msg.updatePermissions;
    this.permissions = new MapPermissions(msg.permissions);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (val: NumberType) => U, options?: ConvertOptions): MsgUpdateMap<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgUpdateMap<U>;
  }

  toProto(): maps.MsgUpdateMap {
    return new maps.MsgUpdateMap(this.convert(Stringify));
  }
}

/**
 * @category Transactions
 */
export class MsgDeleteMap extends CustomTypeClass<MsgDeleteMap> implements iMsgDeleteMap {
  creator: BitBadgesAddress;
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
  creator: BitBadgesAddress;
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
