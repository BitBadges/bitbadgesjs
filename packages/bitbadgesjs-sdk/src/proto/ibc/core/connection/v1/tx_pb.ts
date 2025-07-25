// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file ibc/core/connection/v1/tx.proto (package ibc.core.connection.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Any, Message, proto3, protoInt64 } from "@bufbuild/protobuf";
import { Counterparty, Params, Version } from "./connection_pb.js";
import { Height } from "../../client/v1/client_pb.js";

/**
 * MsgConnectionOpenInit defines the msg sent by an account on Chain A to
 * initialize a connection with Chain B.
 *
 * @generated from message ibc.core.connection.v1.MsgConnectionOpenInit
 */
export class MsgConnectionOpenInit extends Message<MsgConnectionOpenInit> {
  /**
   * @generated from field: string client_id = 1;
   */
  clientId = "";

  /**
   * @generated from field: ibc.core.connection.v1.Counterparty counterparty = 2;
   */
  counterparty?: Counterparty;

  /**
   * @generated from field: ibc.core.connection.v1.Version version = 3;
   */
  version?: Version;

  /**
   * @generated from field: uint64 delay_period = 4;
   */
  delayPeriod = protoInt64.zero;

  /**
   * @generated from field: string signer = 5;
   */
  signer = "";

  constructor(data?: PartialMessage<MsgConnectionOpenInit>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgConnectionOpenInit";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "client_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "counterparty", kind: "message", T: Counterparty },
    { no: 3, name: "version", kind: "message", T: Version },
    { no: 4, name: "delay_period", kind: "scalar", T: 4 /* ScalarType.UINT64 */ },
    { no: 5, name: "signer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgConnectionOpenInit {
    return new MsgConnectionOpenInit().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgConnectionOpenInit {
    return new MsgConnectionOpenInit().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgConnectionOpenInit {
    return new MsgConnectionOpenInit().fromJsonString(jsonString, options);
  }

  static equals(a: MsgConnectionOpenInit | PlainMessage<MsgConnectionOpenInit> | undefined, b: MsgConnectionOpenInit | PlainMessage<MsgConnectionOpenInit> | undefined): boolean {
    return proto3.util.equals(MsgConnectionOpenInit, a, b);
  }
}

/**
 * MsgConnectionOpenInitResponse defines the Msg/ConnectionOpenInit response
 * type.
 *
 * @generated from message ibc.core.connection.v1.MsgConnectionOpenInitResponse
 */
export class MsgConnectionOpenInitResponse extends Message<MsgConnectionOpenInitResponse> {
  constructor(data?: PartialMessage<MsgConnectionOpenInitResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgConnectionOpenInitResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgConnectionOpenInitResponse {
    return new MsgConnectionOpenInitResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgConnectionOpenInitResponse {
    return new MsgConnectionOpenInitResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgConnectionOpenInitResponse {
    return new MsgConnectionOpenInitResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgConnectionOpenInitResponse | PlainMessage<MsgConnectionOpenInitResponse> | undefined, b: MsgConnectionOpenInitResponse | PlainMessage<MsgConnectionOpenInitResponse> | undefined): boolean {
    return proto3.util.equals(MsgConnectionOpenInitResponse, a, b);
  }
}

/**
 * MsgConnectionOpenTry defines a msg sent by a Relayer to try to open a
 * connection on Chain B.
 *
 * @generated from message ibc.core.connection.v1.MsgConnectionOpenTry
 */
export class MsgConnectionOpenTry extends Message<MsgConnectionOpenTry> {
  /**
   * @generated from field: string client_id = 1;
   */
  clientId = "";

  /**
   * Deprecated: this field is unused. Crossing hellos are no longer supported in core IBC.
   *
   * @generated from field: string previous_connection_id = 2 [deprecated = true];
   * @deprecated
   */
  previousConnectionId = "";

  /**
   * @generated from field: google.protobuf.Any client_state = 3;
   */
  clientState?: Any;

  /**
   * @generated from field: ibc.core.connection.v1.Counterparty counterparty = 4;
   */
  counterparty?: Counterparty;

  /**
   * @generated from field: uint64 delay_period = 5;
   */
  delayPeriod = protoInt64.zero;

  /**
   * @generated from field: repeated ibc.core.connection.v1.Version counterparty_versions = 6;
   */
  counterpartyVersions: Version[] = [];

  /**
   * @generated from field: ibc.core.client.v1.Height proof_height = 7;
   */
  proofHeight?: Height;

  /**
   * proof of the initialization the connection on Chain A: `UNITIALIZED ->
   * INIT`
   *
   * @generated from field: bytes proof_init = 8;
   */
  proofInit = new Uint8Array(0);

  /**
   * proof of client state included in message
   *
   * @generated from field: bytes proof_client = 9;
   */
  proofClient = new Uint8Array(0);

  /**
   * proof of client consensus state
   *
   * @generated from field: bytes proof_consensus = 10;
   */
  proofConsensus = new Uint8Array(0);

  /**
   * @generated from field: ibc.core.client.v1.Height consensus_height = 11;
   */
  consensusHeight?: Height;

  /**
   * @generated from field: string signer = 12;
   */
  signer = "";

  /**
   * optional proof data for host state machines that are unable to introspect their own consensus state
   *
   * @generated from field: bytes host_consensus_state_proof = 13;
   */
  hostConsensusStateProof = new Uint8Array(0);

  constructor(data?: PartialMessage<MsgConnectionOpenTry>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgConnectionOpenTry";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "client_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "previous_connection_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "client_state", kind: "message", T: Any },
    { no: 4, name: "counterparty", kind: "message", T: Counterparty },
    { no: 5, name: "delay_period", kind: "scalar", T: 4 /* ScalarType.UINT64 */ },
    { no: 6, name: "counterparty_versions", kind: "message", T: Version, repeated: true },
    { no: 7, name: "proof_height", kind: "message", T: Height },
    { no: 8, name: "proof_init", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 9, name: "proof_client", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 10, name: "proof_consensus", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 11, name: "consensus_height", kind: "message", T: Height },
    { no: 12, name: "signer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 13, name: "host_consensus_state_proof", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgConnectionOpenTry {
    return new MsgConnectionOpenTry().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgConnectionOpenTry {
    return new MsgConnectionOpenTry().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgConnectionOpenTry {
    return new MsgConnectionOpenTry().fromJsonString(jsonString, options);
  }

  static equals(a: MsgConnectionOpenTry | PlainMessage<MsgConnectionOpenTry> | undefined, b: MsgConnectionOpenTry | PlainMessage<MsgConnectionOpenTry> | undefined): boolean {
    return proto3.util.equals(MsgConnectionOpenTry, a, b);
  }
}

/**
 * MsgConnectionOpenTryResponse defines the Msg/ConnectionOpenTry response type.
 *
 * @generated from message ibc.core.connection.v1.MsgConnectionOpenTryResponse
 */
export class MsgConnectionOpenTryResponse extends Message<MsgConnectionOpenTryResponse> {
  constructor(data?: PartialMessage<MsgConnectionOpenTryResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgConnectionOpenTryResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgConnectionOpenTryResponse {
    return new MsgConnectionOpenTryResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgConnectionOpenTryResponse {
    return new MsgConnectionOpenTryResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgConnectionOpenTryResponse {
    return new MsgConnectionOpenTryResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgConnectionOpenTryResponse | PlainMessage<MsgConnectionOpenTryResponse> | undefined, b: MsgConnectionOpenTryResponse | PlainMessage<MsgConnectionOpenTryResponse> | undefined): boolean {
    return proto3.util.equals(MsgConnectionOpenTryResponse, a, b);
  }
}

/**
 * MsgConnectionOpenAck defines a msg sent by a Relayer to Chain A to
 * acknowledge the change of connection state to TRYOPEN on Chain B.
 *
 * @generated from message ibc.core.connection.v1.MsgConnectionOpenAck
 */
export class MsgConnectionOpenAck extends Message<MsgConnectionOpenAck> {
  /**
   * @generated from field: string connection_id = 1;
   */
  connectionId = "";

  /**
   * @generated from field: string counterparty_connection_id = 2;
   */
  counterpartyConnectionId = "";

  /**
   * @generated from field: ibc.core.connection.v1.Version version = 3;
   */
  version?: Version;

  /**
   * @generated from field: google.protobuf.Any client_state = 4;
   */
  clientState?: Any;

  /**
   * @generated from field: ibc.core.client.v1.Height proof_height = 5;
   */
  proofHeight?: Height;

  /**
   * proof of the initialization the connection on Chain B: `UNITIALIZED ->
   * TRYOPEN`
   *
   * @generated from field: bytes proof_try = 6;
   */
  proofTry = new Uint8Array(0);

  /**
   * proof of client state included in message
   *
   * @generated from field: bytes proof_client = 7;
   */
  proofClient = new Uint8Array(0);

  /**
   * proof of client consensus state
   *
   * @generated from field: bytes proof_consensus = 8;
   */
  proofConsensus = new Uint8Array(0);

  /**
   * @generated from field: ibc.core.client.v1.Height consensus_height = 9;
   */
  consensusHeight?: Height;

  /**
   * @generated from field: string signer = 10;
   */
  signer = "";

  /**
   * optional proof data for host state machines that are unable to introspect their own consensus state
   *
   * @generated from field: bytes host_consensus_state_proof = 11;
   */
  hostConsensusStateProof = new Uint8Array(0);

  constructor(data?: PartialMessage<MsgConnectionOpenAck>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgConnectionOpenAck";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "connection_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "counterparty_connection_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "version", kind: "message", T: Version },
    { no: 4, name: "client_state", kind: "message", T: Any },
    { no: 5, name: "proof_height", kind: "message", T: Height },
    { no: 6, name: "proof_try", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 7, name: "proof_client", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 8, name: "proof_consensus", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 9, name: "consensus_height", kind: "message", T: Height },
    { no: 10, name: "signer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 11, name: "host_consensus_state_proof", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgConnectionOpenAck {
    return new MsgConnectionOpenAck().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgConnectionOpenAck {
    return new MsgConnectionOpenAck().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgConnectionOpenAck {
    return new MsgConnectionOpenAck().fromJsonString(jsonString, options);
  }

  static equals(a: MsgConnectionOpenAck | PlainMessage<MsgConnectionOpenAck> | undefined, b: MsgConnectionOpenAck | PlainMessage<MsgConnectionOpenAck> | undefined): boolean {
    return proto3.util.equals(MsgConnectionOpenAck, a, b);
  }
}

/**
 * MsgConnectionOpenAckResponse defines the Msg/ConnectionOpenAck response type.
 *
 * @generated from message ibc.core.connection.v1.MsgConnectionOpenAckResponse
 */
export class MsgConnectionOpenAckResponse extends Message<MsgConnectionOpenAckResponse> {
  constructor(data?: PartialMessage<MsgConnectionOpenAckResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgConnectionOpenAckResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgConnectionOpenAckResponse {
    return new MsgConnectionOpenAckResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgConnectionOpenAckResponse {
    return new MsgConnectionOpenAckResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgConnectionOpenAckResponse {
    return new MsgConnectionOpenAckResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgConnectionOpenAckResponse | PlainMessage<MsgConnectionOpenAckResponse> | undefined, b: MsgConnectionOpenAckResponse | PlainMessage<MsgConnectionOpenAckResponse> | undefined): boolean {
    return proto3.util.equals(MsgConnectionOpenAckResponse, a, b);
  }
}

/**
 * MsgConnectionOpenConfirm defines a msg sent by a Relayer to Chain B to
 * acknowledge the change of connection state to OPEN on Chain A.
 *
 * @generated from message ibc.core.connection.v1.MsgConnectionOpenConfirm
 */
export class MsgConnectionOpenConfirm extends Message<MsgConnectionOpenConfirm> {
  /**
   * @generated from field: string connection_id = 1;
   */
  connectionId = "";

  /**
   * proof for the change of the connection state on Chain A: `INIT -> OPEN`
   *
   * @generated from field: bytes proof_ack = 2;
   */
  proofAck = new Uint8Array(0);

  /**
   * @generated from field: ibc.core.client.v1.Height proof_height = 3;
   */
  proofHeight?: Height;

  /**
   * @generated from field: string signer = 4;
   */
  signer = "";

  constructor(data?: PartialMessage<MsgConnectionOpenConfirm>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgConnectionOpenConfirm";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "connection_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "proof_ack", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 3, name: "proof_height", kind: "message", T: Height },
    { no: 4, name: "signer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgConnectionOpenConfirm {
    return new MsgConnectionOpenConfirm().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgConnectionOpenConfirm {
    return new MsgConnectionOpenConfirm().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgConnectionOpenConfirm {
    return new MsgConnectionOpenConfirm().fromJsonString(jsonString, options);
  }

  static equals(a: MsgConnectionOpenConfirm | PlainMessage<MsgConnectionOpenConfirm> | undefined, b: MsgConnectionOpenConfirm | PlainMessage<MsgConnectionOpenConfirm> | undefined): boolean {
    return proto3.util.equals(MsgConnectionOpenConfirm, a, b);
  }
}

/**
 * MsgConnectionOpenConfirmResponse defines the Msg/ConnectionOpenConfirm
 * response type.
 *
 * @generated from message ibc.core.connection.v1.MsgConnectionOpenConfirmResponse
 */
export class MsgConnectionOpenConfirmResponse extends Message<MsgConnectionOpenConfirmResponse> {
  constructor(data?: PartialMessage<MsgConnectionOpenConfirmResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgConnectionOpenConfirmResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgConnectionOpenConfirmResponse {
    return new MsgConnectionOpenConfirmResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgConnectionOpenConfirmResponse {
    return new MsgConnectionOpenConfirmResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgConnectionOpenConfirmResponse {
    return new MsgConnectionOpenConfirmResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgConnectionOpenConfirmResponse | PlainMessage<MsgConnectionOpenConfirmResponse> | undefined, b: MsgConnectionOpenConfirmResponse | PlainMessage<MsgConnectionOpenConfirmResponse> | undefined): boolean {
    return proto3.util.equals(MsgConnectionOpenConfirmResponse, a, b);
  }
}

/**
 * MsgUpdateParams defines the sdk.Msg type to update the connection parameters.
 *
 * @generated from message ibc.core.connection.v1.MsgUpdateParams
 */
export class MsgUpdateParams extends Message<MsgUpdateParams> {
  /**
   * signer address
   *
   * @generated from field: string signer = 1;
   */
  signer = "";

  /**
   * params defines the connection parameters to update.
   *
   * NOTE: All parameters must be supplied.
   *
   * @generated from field: ibc.core.connection.v1.Params params = 2;
   */
  params?: Params;

  constructor(data?: PartialMessage<MsgUpdateParams>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgUpdateParams";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "signer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "params", kind: "message", T: Params },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgUpdateParams {
    return new MsgUpdateParams().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgUpdateParams {
    return new MsgUpdateParams().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgUpdateParams {
    return new MsgUpdateParams().fromJsonString(jsonString, options);
  }

  static equals(a: MsgUpdateParams | PlainMessage<MsgUpdateParams> | undefined, b: MsgUpdateParams | PlainMessage<MsgUpdateParams> | undefined): boolean {
    return proto3.util.equals(MsgUpdateParams, a, b);
  }
}

/**
 * MsgUpdateParamsResponse defines the MsgUpdateParams response type.
 *
 * @generated from message ibc.core.connection.v1.MsgUpdateParamsResponse
 */
export class MsgUpdateParamsResponse extends Message<MsgUpdateParamsResponse> {
  constructor(data?: PartialMessage<MsgUpdateParamsResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.core.connection.v1.MsgUpdateParamsResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MsgUpdateParamsResponse {
    return new MsgUpdateParamsResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgUpdateParamsResponse {
    return new MsgUpdateParamsResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgUpdateParamsResponse {
    return new MsgUpdateParamsResponse().fromJsonString(jsonString, options);
  }

  static equals(a: MsgUpdateParamsResponse | PlainMessage<MsgUpdateParamsResponse> | undefined, b: MsgUpdateParamsResponse | PlainMessage<MsgUpdateParamsResponse> | undefined): boolean {
    return proto3.util.equals(MsgUpdateParamsResponse, a, b);
  }
}

