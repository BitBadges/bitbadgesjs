// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file ibc/applications/fee/v1/ack.proto (package ibc.applications.fee.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * IncentivizedAcknowledgement is the acknowledgement format to be used by applications wrapped in the fee middleware
 *
 * @generated from message ibc.applications.fee.v1.IncentivizedAcknowledgement
 */
export class IncentivizedAcknowledgement extends Message<IncentivizedAcknowledgement> {
  /**
   * the underlying app acknowledgement bytes
   *
   * @generated from field: bytes app_acknowledgement = 1;
   */
  appAcknowledgement = new Uint8Array(0);

  /**
   * the relayer address which submits the recv packet message
   *
   * @generated from field: string forward_relayer_address = 2;
   */
  forwardRelayerAddress = "";

  /**
   * success flag of the base application callback
   *
   * @generated from field: bool underlying_app_success = 3;
   */
  underlyingAppSuccess = false;

  constructor(data?: PartialMessage<IncentivizedAcknowledgement>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "ibc.applications.fee.v1.IncentivizedAcknowledgement";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "app_acknowledgement", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 2, name: "forward_relayer_address", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "underlying_app_success", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): IncentivizedAcknowledgement {
    return new IncentivizedAcknowledgement().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): IncentivizedAcknowledgement {
    return new IncentivizedAcknowledgement().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): IncentivizedAcknowledgement {
    return new IncentivizedAcknowledgement().fromJsonString(jsonString, options);
  }

  static equals(a: IncentivizedAcknowledgement | PlainMessage<IncentivizedAcknowledgement> | undefined, b: IncentivizedAcknowledgement | PlainMessage<IncentivizedAcknowledgement> | undefined): boolean {
    return proto3.util.equals(IncentivizedAcknowledgement, a, b);
  }
}

