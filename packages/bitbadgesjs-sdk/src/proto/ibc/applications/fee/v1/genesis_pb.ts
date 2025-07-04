// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file ibc/applications/fee/v1/genesis.proto (package ibc.applications.fee.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { IdentifiedPacketFees } from "./fee_pb.js";
import { PacketId } from "../../../core/channel/v1/channel_pb.js";

/**
 * GenesisState defines the ICS29 fee middleware genesis state
 *
 * @generated from message ibc.applications.fee.v1.GenesisState
 */
export class GenesisState extends Message<GenesisState> {
  /**
   * list of identified packet fees
   *
   * @generated from field: repeated ibc.applications.fee.v1.IdentifiedPacketFees identified_fees = 1;
   */
  identifiedFees: IdentifiedPacketFees[] = [];

  /**
   * list of fee enabled channels
   *
   * @generated from field: repeated ibc.applications.fee.v1.FeeEnabledChannel fee_enabled_channels = 2;
   */
  feeEnabledChannels: FeeEnabledChannel[] = [];

  /**
   * list of registered payees
   *
   * @generated from field: repeated ibc.applications.fee.v1.RegisteredPayee registered_payees = 3;
   */
  registeredPayees: RegisteredPayee[] = [];

  /**
   * list of registered counterparty payees
   *
   * @generated from field: repeated ibc.applications.fee.v1.RegisteredCounterpartyPayee registered_counterparty_payees = 4;
   */
  registeredCounterpartyPayees: RegisteredCounterpartyPayee[] = [];

  /**
   * list of forward relayer addresses
   *
   * @generated from field: repeated ibc.applications.fee.v1.ForwardRelayerAddress forward_relayers = 5;
   */
  forwardRelayers: ForwardRelayerAddress[] = [];

  constructor(data?: PartialMessage<GenesisState>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.GenesisState";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "identified_fees", kind: "message", T: IdentifiedPacketFees, repeated: true },
    { no: 2, name: "fee_enabled_channels", kind: "message", T: FeeEnabledChannel, repeated: true },
    { no: 3, name: "registered_payees", kind: "message", T: RegisteredPayee, repeated: true },
    { no: 4, name: "registered_counterparty_payees", kind: "message", T: RegisteredCounterpartyPayee, repeated: true },
    { no: 5, name: "forward_relayers", kind: "message", T: ForwardRelayerAddress, repeated: true },
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

/**
 * FeeEnabledChannel contains the PortID & ChannelID for a fee enabled channel
 *
 * @generated from message ibc.applications.fee.v1.FeeEnabledChannel
 */
export class FeeEnabledChannel extends Message<FeeEnabledChannel> {
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

  constructor(data?: PartialMessage<FeeEnabledChannel>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.FeeEnabledChannel";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "port_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "channel_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): FeeEnabledChannel {
    return new FeeEnabledChannel().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): FeeEnabledChannel {
    return new FeeEnabledChannel().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): FeeEnabledChannel {
    return new FeeEnabledChannel().fromJsonString(jsonString, options);
  }

  static equals(a: FeeEnabledChannel | PlainMessage<FeeEnabledChannel> | undefined, b: FeeEnabledChannel | PlainMessage<FeeEnabledChannel> | undefined): boolean {
    return proto3.util.equals(FeeEnabledChannel, a, b);
  }
}

/**
 * RegisteredPayee contains the relayer address and payee address for a specific channel
 *
 * @generated from message ibc.applications.fee.v1.RegisteredPayee
 */
export class RegisteredPayee extends Message<RegisteredPayee> {
  /**
   * unique channel identifier
   *
   * @generated from field: string channel_id = 1;
   */
  channelId = "";

  /**
   * the relayer address
   *
   * @generated from field: string relayer = 2;
   */
  relayer = "";

  /**
   * the payee address
   *
   * @generated from field: string payee = 3;
   */
  payee = "";

  constructor(data?: PartialMessage<RegisteredPayee>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.RegisteredPayee";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "channel_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "relayer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "payee", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RegisteredPayee {
    return new RegisteredPayee().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RegisteredPayee {
    return new RegisteredPayee().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RegisteredPayee {
    return new RegisteredPayee().fromJsonString(jsonString, options);
  }

  static equals(a: RegisteredPayee | PlainMessage<RegisteredPayee> | undefined, b: RegisteredPayee | PlainMessage<RegisteredPayee> | undefined): boolean {
    return proto3.util.equals(RegisteredPayee, a, b);
  }
}

/**
 * RegisteredCounterpartyPayee contains the relayer address and counterparty payee address for a specific channel (used
 * for recv fee distribution)
 *
 * @generated from message ibc.applications.fee.v1.RegisteredCounterpartyPayee
 */
export class RegisteredCounterpartyPayee extends Message<RegisteredCounterpartyPayee> {
  /**
   * unique channel identifier
   *
   * @generated from field: string channel_id = 1;
   */
  channelId = "";

  /**
   * the relayer address
   *
   * @generated from field: string relayer = 2;
   */
  relayer = "";

  /**
   * the counterparty payee address
   *
   * @generated from field: string counterparty_payee = 3;
   */
  counterpartyPayee = "";

  constructor(data?: PartialMessage<RegisteredCounterpartyPayee>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.RegisteredCounterpartyPayee";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "channel_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "relayer", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "counterparty_payee", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): RegisteredCounterpartyPayee {
    return new RegisteredCounterpartyPayee().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): RegisteredCounterpartyPayee {
    return new RegisteredCounterpartyPayee().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): RegisteredCounterpartyPayee {
    return new RegisteredCounterpartyPayee().fromJsonString(jsonString, options);
  }

  static equals(a: RegisteredCounterpartyPayee | PlainMessage<RegisteredCounterpartyPayee> | undefined, b: RegisteredCounterpartyPayee | PlainMessage<RegisteredCounterpartyPayee> | undefined): boolean {
    return proto3.util.equals(RegisteredCounterpartyPayee, a, b);
  }
}

/**
 * ForwardRelayerAddress contains the forward relayer address and PacketId used for async acknowledgements
 *
 * @generated from message ibc.applications.fee.v1.ForwardRelayerAddress
 */
export class ForwardRelayerAddress extends Message<ForwardRelayerAddress> {
  /**
   * the forward relayer address
   *
   * @generated from field: string address = 1;
   */
  address = "";

  /**
   * unique packet identifer comprised of the channel ID, port ID and sequence
   *
   * @generated from field: ibc.core.channel.v1.PacketId packet_id = 2;
   */
  packetId?: PacketId;

  constructor(data?: PartialMessage<ForwardRelayerAddress>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.ForwardRelayerAddress";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "address", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "packet_id", kind: "message", T: PacketId },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ForwardRelayerAddress {
    return new ForwardRelayerAddress().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ForwardRelayerAddress {
    return new ForwardRelayerAddress().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ForwardRelayerAddress {
    return new ForwardRelayerAddress().fromJsonString(jsonString, options);
  }

  static equals(a: ForwardRelayerAddress | PlainMessage<ForwardRelayerAddress> | undefined, b: ForwardRelayerAddress | PlainMessage<ForwardRelayerAddress> | undefined): boolean {
    return proto3.util.equals(ForwardRelayerAddress, a, b);
  }
}

