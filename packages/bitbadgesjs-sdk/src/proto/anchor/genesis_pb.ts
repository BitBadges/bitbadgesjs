// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file anchor/genesis.proto (package anchor, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Params } from "./params_pb.js";
import { AnchorData } from "./tx_pb.js";

/**
 * GenesisState defines the anchor module's genesis state.
 *
 * @generated from message anchor.GenesisState
 */
export class GenesisState extends Message<GenesisState> {
  /**
   * @generated from field: anchor.Params params = 1;
   */
  params?: Params;

  /**
   * @generated from field: string port_id = 2;
   */
  portId = "";

  /**
   * @generated from field: string nextLocationId = 3;
   */
  nextLocationId = "";

  /**
   * @generated from field: repeated anchor.AnchorData anchorData = 4;
   */
  anchorData: AnchorData[] = [];

  constructor(data?: PartialMessage<GenesisState>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "anchor.GenesisState";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "params", kind: "message", T: Params },
    { no: 2, name: "port_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "nextLocationId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 4, name: "anchorData", kind: "message", T: AnchorData, repeated: true },
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
