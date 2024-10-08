// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file wasmx/params.proto (package wasmx, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, protoInt64 } from "@bufbuild/protobuf";

/**
 * Params defines the parameters for the module.
 *
 * @generated from message wasmx.Params
 */
export class Params extends Message<Params> {
  /**
   * Set the status to active to indicate that contracts can be executed in begin blocker.
   *
   * @generated from field: bool is_execution_enabled = 1;
   */
  isExecutionEnabled = false;

  /**
   * Maximum aggregate total gas to be used for the contract executions in the BeginBlocker.
   *
   * @generated from field: uint64 max_begin_block_total_gas = 2;
   */
  maxBeginBlockTotalGas = protoInt64.zero;

  /**
   * the maximum gas limit each individual contract can consume in the BeginBlocker.
   *
   * @generated from field: uint64 max_contract_gas_limit = 3;
   */
  maxContractGasLimit = protoInt64.zero;

  /**
   * min_gas_price defines the minimum gas price the contracts must pay to be executed in the BeginBlocker.
   *
   * @generated from field: uint64 min_gas_price = 4;
   */
  minGasPrice = protoInt64.zero;

  constructor(data?: PartialMessage<Params>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "wasmx.Params";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "is_execution_enabled", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    { no: 2, name: "max_begin_block_total_gas", kind: "scalar", T: 4 /* ScalarType.UINT64 */ },
    { no: 3, name: "max_contract_gas_limit", kind: "scalar", T: 4 /* ScalarType.UINT64 */ },
    { no: 4, name: "min_gas_price", kind: "scalar", T: 4 /* ScalarType.UINT64 */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Params {
    return new Params().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Params {
    return new Params().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Params {
    return new Params().fromJsonString(jsonString, options);
  }

  static equals(a: Params | PlainMessage<Params> | undefined, b: Params | PlainMessage<Params> | undefined): boolean {
    return proto3.util.equals(Params, a, b);
  }
}

