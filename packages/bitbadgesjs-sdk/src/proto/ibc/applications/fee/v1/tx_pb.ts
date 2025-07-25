// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file ibc/applications/fee/v1/tx.proto (package ibc.applications.fee.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Fee, PacketFee } from "./fee_pb.js";
import { PacketId } from "../../../core/channel/v1/channel_pb.js";

/**
 * MsgRegisterPayee defines the request type for the RegisterPayee rpc
 *
 * @generated from message ibc.applications.fee.v1.MsgRegisterPayee
 */
export class MsgRegisterPayee extends Message<MsgRegisterPayee> {
  /**
   * unique port identifier
   *
   * @generated from field: string port_id = 1;
   */
  portId = "";

  /**
   * unique channel identifier
   *
   * @generated from field: string channel_id = 2;
   */
  channelId = "";

  /**
   * the relayer address
   *
   * @generated from field: string relayer = 3;
   */
  relayer = "";

  /**
   * the payee address
   *
   * @generated from field: string payee = 4;
   */
  payee = "";

  constructor(data?: PartialMessage<MsgRegisterPayee>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.MsgRegisterPayee";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "port_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "channel_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "relayer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 4, name: "payee", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgRegisterPayee {
    return new MsgRegisterPayee().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgRegisterPayee {
    return new MsgRegisterPayee().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgRegisterPayee {
    return new MsgRegisterPayee().fromJsonString(jsonString, options);
  }

  static equals(a: MsgRegisterPayee | PlainMessage<MsgRegisterPayee> | undefined, b: MsgRegisterPayee | PlainMessage<MsgRegisterPayee> | undefined): boolean {
    return proto3.util.equals(MsgRegisterPayee, a, b);
  }
}

/**
 * MsgRegisterPayeeResponse defines the response type for the RegisterPayee rpc
 *
 * @generated from message ibc.applications.fee.v1.MsgRegisterPayeeResponse
 */
export class MsgRegisterPayeeResponse extends Message<MsgRegisterPayeeResponse> {
  constructor(data?: PartialMessage<MsgRegisterPayeeResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.MsgRegisterPayeeResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgRegisterPayeeResponse {
    return new MsgRegisterPayeeResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgRegisterPayeeResponse {
    return new MsgRegisterPayeeResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgRegisterPayeeResponse {
    return new MsgRegisterPayeeResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgRegisterPayeeResponse | PlainMessage<MsgRegisterPayeeResponse> | undefined, b: MsgRegisterPayeeResponse | PlainMessage<MsgRegisterPayeeResponse> | undefined): boolean {
    return proto3.util.equals(MsgRegisterPayeeResponse, a, b);
  }
}

/**
 * MsgRegisterCounterpartyPayee defines the request type for the RegisterCounterpartyPayee rpc
 *
 * @generated from message ibc.applications.fee.v1.MsgRegisterCounterpartyPayee
 */
export class MsgRegisterCounterpartyPayee extends Message<MsgRegisterCounterpartyPayee> {
  /**
   * unique port identifier
   *
   * @generated from field: string port_id = 1;
   */
  portId = "";

  /**
   * unique channel identifier
   *
   * @generated from field: string channel_id = 2;
   */
  channelId = "";

  /**
   * the relayer address
   *
   * @generated from field: string relayer = 3;
   */
  relayer = "";

  /**
   * the counterparty payee address
   *
   * @generated from field: string counterparty_payee = 4;
   */
  counterpartyPayee = "";

  constructor(data?: PartialMessage<MsgRegisterCounterpartyPayee>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.MsgRegisterCounterpartyPayee";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "port_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "channel_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "relayer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 4, name: "counterparty_payee", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgRegisterCounterpartyPayee {
    return new MsgRegisterCounterpartyPayee().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgRegisterCounterpartyPayee {
    return new MsgRegisterCounterpartyPayee().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgRegisterCounterpartyPayee {
    return new MsgRegisterCounterpartyPayee().fromJsonString(jsonString, options);
  }

  static equals(a: MsgRegisterCounterpartyPayee | PlainMessage<MsgRegisterCounterpartyPayee> | undefined, b: MsgRegisterCounterpartyPayee | PlainMessage<MsgRegisterCounterpartyPayee> | undefined): boolean {
    return proto3.util.equals(MsgRegisterCounterpartyPayee, a, b);
  }
}

/**
 * MsgRegisterCounterpartyPayeeResponse defines the response type for the RegisterCounterpartyPayee rpc
 *
 * @generated from message ibc.applications.fee.v1.MsgRegisterCounterpartyPayeeResponse
 */
export class MsgRegisterCounterpartyPayeeResponse extends Message<MsgRegisterCounterpartyPayeeResponse> {
  constructor(data?: PartialMessage<MsgRegisterCounterpartyPayeeResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.MsgRegisterCounterpartyPayeeResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgRegisterCounterpartyPayeeResponse {
    return new MsgRegisterCounterpartyPayeeResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgRegisterCounterpartyPayeeResponse {
    return new MsgRegisterCounterpartyPayeeResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgRegisterCounterpartyPayeeResponse {
    return new MsgRegisterCounterpartyPayeeResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgRegisterCounterpartyPayeeResponse | PlainMessage<MsgRegisterCounterpartyPayeeResponse> | undefined, b: MsgRegisterCounterpartyPayeeResponse | PlainMessage<MsgRegisterCounterpartyPayeeResponse> | undefined): boolean {
    return proto3.util.equals(MsgRegisterCounterpartyPayeeResponse, a, b);
  }
}

/**
 * MsgPayPacketFee defines the request type for the PayPacketFee rpc
 * This Msg can be used to pay for a packet at the next sequence send & should be combined with the Msg that will be
 * paid for
 *
 * @generated from message ibc.applications.fee.v1.MsgPayPacketFee
 */
export class MsgPayPacketFee extends Message<MsgPayPacketFee> {
  /**
   * fee encapsulates the recv, ack and timeout fees associated with an IBC packet
   *
   * @generated from field: ibc.applications.fee.v1.Fee fee = 1;
   */
  fee?: Fee;

  /**
   * the source port unique identifier
   *
   * @generated from field: string source_port_id = 2;
   */
  sourcePortId = "";

  /**
   * the source channel unique identifer
   *
   * @generated from field: string source_channel_id = 3;
   */
  sourceChannelId = "";

  /**
   * account address to refund fee if necessary
   *
   * @generated from field: string signer = 4;
   */
  signer = "";

  /**
   * optional list of relayers permitted to the receive packet fees
   *
   * @generated from field: repeated string relayers = 5;
   */
  relayers: string[] = [];

  constructor(data?: PartialMessage<MsgPayPacketFee>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.MsgPayPacketFee";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "fee", kind: "message", T: Fee },
    { no: 2, name: "source_port_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "source_channel_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 4, name: "signer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 5, name: "relayers", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgPayPacketFee {
    return new MsgPayPacketFee().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgPayPacketFee {
    return new MsgPayPacketFee().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgPayPacketFee {
    return new MsgPayPacketFee().fromJsonString(jsonString, options);
  }

  static equals(a: MsgPayPacketFee | PlainMessage<MsgPayPacketFee> | undefined, b: MsgPayPacketFee | PlainMessage<MsgPayPacketFee> | undefined): boolean {
    return proto3.util.equals(MsgPayPacketFee, a, b);
  }
}

/**
 * MsgPayPacketFeeResponse defines the response type for the PayPacketFee rpc
 *
 * @generated from message ibc.applications.fee.v1.MsgPayPacketFeeResponse
 */
export class MsgPayPacketFeeResponse extends Message<MsgPayPacketFeeResponse> {
  constructor(data?: PartialMessage<MsgPayPacketFeeResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.MsgPayPacketFeeResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgPayPacketFeeResponse {
    return new MsgPayPacketFeeResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgPayPacketFeeResponse {
    return new MsgPayPacketFeeResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgPayPacketFeeResponse {
    return new MsgPayPacketFeeResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgPayPacketFeeResponse | PlainMessage<MsgPayPacketFeeResponse> | undefined, b: MsgPayPacketFeeResponse | PlainMessage<MsgPayPacketFeeResponse> | undefined): boolean {
    return proto3.util.equals(MsgPayPacketFeeResponse, a, b);
  }
}

/**
 * MsgPayPacketFeeAsync defines the request type for the PayPacketFeeAsync rpc
 * This Msg can be used to pay for a packet at a specified sequence (instead of the next sequence send)
 *
 * @generated from message ibc.applications.fee.v1.MsgPayPacketFeeAsync
 */
export class MsgPayPacketFeeAsync extends Message<MsgPayPacketFeeAsync> {
  /**
   * unique packet identifier comprised of the channel ID, port ID and sequence
   *
   * @generated from field: ibc.core.channel.v1.PacketId packet_id = 1;
   */
  packetId?: PacketId;

  /**
   * the packet fee associated with a particular IBC packet
   *
   * @generated from field: ibc.applications.fee.v1.PacketFee packet_fee = 2;
   */
  packetFee?: PacketFee;

  constructor(data?: PartialMessage<MsgPayPacketFeeAsync>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.MsgPayPacketFeeAsync";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "packet_id", kind: "message", T: PacketId },
    { no: 2, name: "packet_fee", kind: "message", T: PacketFee },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgPayPacketFeeAsync {
    return new MsgPayPacketFeeAsync().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgPayPacketFeeAsync {
    return new MsgPayPacketFeeAsync().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgPayPacketFeeAsync {
    return new MsgPayPacketFeeAsync().fromJsonString(jsonString, options);
  }

  static equals(a: MsgPayPacketFeeAsync | PlainMessage<MsgPayPacketFeeAsync> | undefined, b: MsgPayPacketFeeAsync | PlainMessage<MsgPayPacketFeeAsync> | undefined): boolean {
    return proto3.util.equals(MsgPayPacketFeeAsync, a, b);
  }
}

/**
 * MsgPayPacketFeeAsyncResponse defines the response type for the PayPacketFeeAsync rpc
 *
 * @generated from message ibc.applications.fee.v1.MsgPayPacketFeeAsyncResponse
 */
export class MsgPayPacketFeeAsyncResponse extends Message<MsgPayPacketFeeAsyncResponse> {
  constructor(data?: PartialMessage<MsgPayPacketFeeAsyncResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.MsgPayPacketFeeAsyncResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgPayPacketFeeAsyncResponse {
    return new MsgPayPacketFeeAsyncResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgPayPacketFeeAsyncResponse {
    return new MsgPayPacketFeeAsyncResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgPayPacketFeeAsyncResponse {
    return new MsgPayPacketFeeAsyncResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgPayPacketFeeAsyncResponse | PlainMessage<MsgPayPacketFeeAsyncResponse> | undefined, b: MsgPayPacketFeeAsyncResponse | PlainMessage<MsgPayPacketFeeAsyncResponse> | undefined): boolean {
    return proto3.util.equals(MsgPayPacketFeeAsyncResponse, a, b);
  }
}

