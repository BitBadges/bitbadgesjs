// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file protocols/packet.proto (package protocols, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * @generated from message protocols.ProtocolsPacketData
 */
export class ProtocolsPacketData extends Message<ProtocolsPacketData> {
  /**
   * @generated from oneof protocols.ProtocolsPacketData.packet
   */
  packet: {
    /**
     * @generated from field: protocols.NoData noData = 1;
     */
    value: NoData;
    case: "noData";
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<ProtocolsPacketData>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "protocols.ProtocolsPacketData";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "noData", kind: "message", T: NoData, oneof: "packet" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ProtocolsPacketData {
    return new ProtocolsPacketData().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ProtocolsPacketData {
    return new ProtocolsPacketData().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ProtocolsPacketData {
    return new ProtocolsPacketData().fromJsonString(jsonString, options);
  }

  static equals(a: ProtocolsPacketData | PlainMessage<ProtocolsPacketData> | undefined, b: ProtocolsPacketData | PlainMessage<ProtocolsPacketData> | undefined): boolean {
    return proto3.util.equals(ProtocolsPacketData, a, b);
  }
}

/**
 * @generated from message protocols.NoData
 */
export class NoData extends Message<NoData> {
  constructor(data?: PartialMessage<NoData>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "protocols.NoData";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): NoData {
    return new NoData().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): NoData {
    return new NoData().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): NoData {
    return new NoData().fromJsonString(jsonString, options);
  }

  static equals(a: NoData | PlainMessage<NoData> | undefined, b: NoData | PlainMessage<NoData> | undefined): boolean {
    return proto3.util.equals(NoData, a, b);
  }
}

