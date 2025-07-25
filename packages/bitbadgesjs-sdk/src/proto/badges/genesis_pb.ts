// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file badges/genesis.proto (package badges, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Params } from "./params_pb.js";
import { BadgeCollection } from "./collections_pb.js";
import { ApprovalTracker, UserBalanceStore } from "./transfers_pb.js";
import { AddressList } from "./address_lists_pb.js";
import { DynamicStore, DynamicStoreValue } from "./dynamic_stores_pb.js";

/**
 * GenesisState defines the badges module's genesis state.
 *
 * @generated from message badges.GenesisState
 */
export class GenesisState extends Message<GenesisState> {
  /**
   * @generated from field: badges.Params params = 1;
   */
  params?: Params;

  /**
   * @generated from field: string port_id = 2;
   */
  portId = "";

  /**
   * @generated from field: repeated badges.BadgeCollection collections = 3;
   */
  collections: BadgeCollection[] = [];

  /**
   * @generated from field: string nextCollectionId = 4;
   */
  nextCollectionId = "";

  /**
   * @generated from field: repeated badges.UserBalanceStore balances = 5;
   */
  balances: UserBalanceStore[] = [];

  /**
   * @generated from field: repeated string balanceStoreKeys = 6;
   */
  balanceStoreKeys: string[] = [];

  /**
   * @generated from field: repeated string challengeTrackers = 7;
   */
  challengeTrackers: string[] = [];

  /**
   * @generated from field: repeated string challengeTrackerStoreKeys = 8;
   */
  challengeTrackerStoreKeys: string[] = [];

  /**
   * @generated from field: repeated badges.AddressList addressLists = 9;
   */
  addressLists: AddressList[] = [];

  /**
   * @generated from field: repeated badges.ApprovalTracker approvalTrackers = 10;
   */
  approvalTrackers: ApprovalTracker[] = [];

  /**
   * @generated from field: repeated string approvalTrackerStoreKeys = 11;
   */
  approvalTrackerStoreKeys: string[] = [];

  /**
   * @generated from field: repeated string approvalTrackerVersions = 12;
   */
  approvalTrackerVersions: string[] = [];

  /**
   * @generated from field: repeated string approvalTrackerVersionsStoreKeys = 13;
   */
  approvalTrackerVersionsStoreKeys: string[] = [];

  /**
   * @generated from field: repeated badges.DynamicStore dynamicStores = 14;
   */
  dynamicStores: DynamicStore[] = [];

  /**
   * @generated from field: string nextDynamicStoreId = 15;
   */
  nextDynamicStoreId = "";

  /**
   * this line is used by starport scaffolding # genesis/proto/state
   *
   * @generated from field: repeated badges.DynamicStoreValue dynamicStoreValues = 16;
   */
  dynamicStoreValues: DynamicStoreValue[] = [];

  constructor(data?: PartialMessage<GenesisState>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "badges.GenesisState";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "params", kind: "message", T: Params },
    { no: 2, name: "port_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "collections", kind: "message", T: BadgeCollection, repeated: true },
    { no: 4, name: "nextCollectionId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 5, name: "balances", kind: "message", T: UserBalanceStore, repeated: true },
    { no: 6, name: "balanceStoreKeys", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 7, name: "challengeTrackers", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 8, name: "challengeTrackerStoreKeys", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 9, name: "addressLists", kind: "message", T: AddressList, repeated: true },
    { no: 10, name: "approvalTrackers", kind: "message", T: ApprovalTracker, repeated: true },
    { no: 11, name: "approvalTrackerStoreKeys", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 12, name: "approvalTrackerVersions", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 13, name: "approvalTrackerVersionsStoreKeys", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 14, name: "dynamicStores", kind: "message", T: DynamicStore, repeated: true },
    { no: 15, name: "nextDynamicStoreId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 16, name: "dynamicStoreValues", kind: "message", T: DynamicStoreValue, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GenesisState {
    return new GenesisState().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GenesisState {
    return new GenesisState().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GenesisState {
    return new GenesisState().fromJsonString(jsonString, options);
  }

  static equals(a: GenesisState | PlainMessage<GenesisState> | undefined, b: GenesisState | PlainMessage<GenesisState> | undefined): boolean {
    return proto3.util.equals(GenesisState, a, b);
  }
}

