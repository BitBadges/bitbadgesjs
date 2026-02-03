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
export interface iMapUpdateCriteria {
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
export interface iMapPermissions {
  canUpdateMetadata: iActionPermission[];
  canUpdateManager: iActionPermission[];
  canDeleteMap: iActionPermission[];
}

/**
 * @category Interfaces
 */
export interface iMap {
  creator: BitBadgesAddress;
  mapId: string;

  inheritManagerFrom: string | number;
  manager: string;

  updateCriteria: iMapUpdateCriteria;

  valueOptions: iValueOptions;
  defaultValue: string;

  permissions: iMapPermissions;

  metadata: iCollectionMetadata;
}

/**
 * @category Interfaces
 */
export interface iMsgCreateMap {
  creator: BitBadgesAddress;
  mapId: string;

  inheritManagerFrom: string | number;
  manager: string;

  updateCriteria: iMapUpdateCriteria;
  valueOptions: iValueOptions;
  defaultValue: string;

  metadata: iCollectionMetadata;

  permissions: iMapPermissions;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateMap {
  creator: BitBadgesAddress;
  mapId: string;

  updateManager: boolean;
  manager: string;

  updateMetadata: boolean;
  metadata: iCollectionMetadata;

  updatePermissions: boolean;
  permissions: iMapPermissions;
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
export class MapUpdateCriteria extends BaseNumberTypeClass<MapUpdateCriteria> implements iMapUpdateCriteria {
  managerOnly: boolean;
  collectionId: string;
  creatorOnly: boolean;
  firstComeFirstServe: boolean;

  constructor(msg: iMapUpdateCriteria) {
    super();
    this.managerOnly = msg.managerOnly;
    this.collectionId = msg.collectionId;
    this.creatorOnly = msg.creatorOnly;
    this.firstComeFirstServe = msg.firstComeFirstServe;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MapUpdateCriteria {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MapUpdateCriteria;
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
export class MapPermissions extends BaseNumberTypeClass<MapPermissions> implements iMapPermissions {
  canUpdateMetadata: ActionPermission[];
  canUpdateManager: ActionPermission[];
  canDeleteMap: ActionPermission[];

  constructor(msg: iMapPermissions) {
    super();
    this.canUpdateMetadata = msg.canUpdateMetadata.map((item) => new ActionPermission(item));
    this.canUpdateManager = msg.canUpdateManager.map((item) => new ActionPermission(item));
    this.canDeleteMap = msg.canDeleteMap.map((item) => new ActionPermission(item));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): MapPermissions {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MapPermissions;
  }
}

/**
 * @category Maps
 */
export class Map extends BaseNumberTypeClass<Map> implements iMap {
  creator: BitBadgesAddress;
  mapId: string;

  inheritManagerFrom: string | number;
  manager: string;

  updateCriteria: MapUpdateCriteria;

  valueOptions: ValueOptions;
  defaultValue: string;
  permissions: MapPermissions;

  metadata: iCollectionMetadata;

  constructor(msg: iMap) {
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

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): Map {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Map;
  }
}

/**
 * @category Transactions
 */
export class MsgCreateMap extends BaseNumberTypeClass<MsgCreateMap> implements iMsgCreateMap {
  creator: BitBadgesAddress;
  mapId: string;

  inheritManagerFrom: string | number;
  manager: string;

  updateCriteria: MapUpdateCriteria;
  valueOptions: ValueOptions;
  defaultValue: string;

  metadata: iCollectionMetadata;

  permissions: MapPermissions;

  constructor(msg: iMsgCreateMap) {
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

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): MsgCreateMap {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgCreateMap;
  }

  toProto(): maps.MsgCreateMap {
    return new maps.MsgCreateMap(this.convert(Stringify));
  }
}

/**
 * @category Transactions
 */
export class MsgUpdateMap extends BaseNumberTypeClass<MsgUpdateMap> implements iMsgUpdateMap {
  creator: BitBadgesAddress;
  mapId: string;

  updateManager: boolean;
  manager: string;

  updateMetadata: boolean;
  metadata: iCollectionMetadata;

  updatePermissions: boolean;
  permissions: MapPermissions;

  constructor(msg: iMsgUpdateMap) {
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

  convert(convertFunction: (val: string | number) => U, options?: ConvertOptions): MsgUpdateMap {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgUpdateMap;
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
