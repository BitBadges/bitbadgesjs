// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file maps/timelines.proto (package maps, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Metadata } from "./metadata_pb.js";
import { UintRange } from "./balances_pb.js";

/**
 * MapMetadataTimeline defines the metadata for a collection at different timeline times.
 *
 * @generated from message maps.MapMetadataTimeline
 */
export class MapMetadataTimeline extends Message<MapMetadataTimeline> {
  /**
   * The collection metadata for a specific timeline element.
   *
   * @generated from field: maps.Metadata metadata = 1;
   */
  metadata?: Metadata;

  /**
   * The timeline times when the collection metadata is valid. Can not overlap with other timeline elements in same array.
   *
   * @generated from field: repeated maps.UintRange timelineTimes = 2;
   */
  timelineTimes: UintRange[] = [];

  constructor(data?: PartialMessage<MapMetadataTimeline>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "maps.MapMetadataTimeline";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "metadata", kind: "message", T: Metadata },
    { no: 2, name: "timelineTimes", kind: "message", T: UintRange, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MapMetadataTimeline {
    return new MapMetadataTimeline().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MapMetadataTimeline {
    return new MapMetadataTimeline().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MapMetadataTimeline {
    return new MapMetadataTimeline().fromJsonString(jsonString, options);
  }

  static equals(a: MapMetadataTimeline | PlainMessage<MapMetadataTimeline> | undefined, b: MapMetadataTimeline | PlainMessage<MapMetadataTimeline> | undefined): boolean {
    return proto3.util.equals(MapMetadataTimeline, a, b);
  }
}

/**
 * ManagerTimeline defines the manager address at different timeline times.
 *
 * @generated from message maps.ManagerTimeline
 */
export class ManagerTimeline extends Message<ManagerTimeline> {
  /**
   * The manager address for a specific timeline element.
   *
   * @generated from field: string manager = 1;
   */
  manager = "";

  /**
   * The timeline times when the manager address is valid. Can not overlap with other timeline elements in same array.
   *
   * @generated from field: repeated maps.UintRange timelineTimes = 2;
   */
  timelineTimes: UintRange[] = [];

  constructor(data?: PartialMessage<ManagerTimeline>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "maps.ManagerTimeline";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "manager", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "timelineTimes", kind: "message", T: UintRange, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ManagerTimeline {
    return new ManagerTimeline().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ManagerTimeline {
    return new ManagerTimeline().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ManagerTimeline {
    return new ManagerTimeline().fromJsonString(jsonString, options);
  }

  static equals(a: ManagerTimeline | PlainMessage<ManagerTimeline> | undefined, b: ManagerTimeline | PlainMessage<ManagerTimeline> | undefined): boolean {
    return proto3.util.equals(ManagerTimeline, a, b);
  }
}
