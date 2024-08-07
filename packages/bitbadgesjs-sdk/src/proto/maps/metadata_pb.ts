// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file maps/metadata.proto (package maps, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 *
 * This message defines the metadata for the map.
 * The interpretation of this metadata should follow the map standard.
 *
 * @generated from message maps.Metadata
 */
export class Metadata extends Message<Metadata> {
  /**
   * The URI (Uniform Resource Identifier) associated with the map metadata.
   *
   * @generated from field: string uri = 1;
   */
  uri = "";

  /**
   * Custom data or additional information related to the map metadata.
   *
   * @generated from field: string customData = 2;
   */
  customData = "";

  constructor(data?: PartialMessage<Metadata>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "maps.Metadata";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "uri", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "customData", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Metadata {
    return new Metadata().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Metadata {
    return new Metadata().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Metadata {
    return new Metadata().fromJsonString(jsonString, options);
  }

  static equals(a: Metadata | PlainMessage<Metadata> | undefined, b: Metadata | PlainMessage<Metadata> | undefined): boolean {
    return proto3.util.equals(Metadata, a, b);
  }
}

