// @generated by protoc-gen-es v1.7.2 with parameter "target=ts"
// @generated from file anchor/query.proto (package anchor, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Params } from "./params_pb.js";
import { AnchorData } from "./tx_pb.js";

/**
 * QueryParamsRequest is request type for the Query/Params RPC method.
 *
 * @generated from message anchor.QueryParamsRequest
 */
export class QueryParamsRequest extends Message<QueryParamsRequest> {
  constructor(data?: PartialMessage<QueryParamsRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "anchor.QueryParamsRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): QueryParamsRequest {
    return new QueryParamsRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): QueryParamsRequest {
    return new QueryParamsRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): QueryParamsRequest {
    return new QueryParamsRequest().fromJsonString(jsonString, options);
  }

  static equals(a: QueryParamsRequest | PlainMessage<QueryParamsRequest> | undefined, b: QueryParamsRequest | PlainMessage<QueryParamsRequest> | undefined): boolean {
    return proto3.util.equals(QueryParamsRequest, a, b);
  }
}

/**
 * QueryParamsResponse is response type for the Query/Params RPC method.
 *
 * @generated from message anchor.QueryParamsResponse
 */
export class QueryParamsResponse extends Message<QueryParamsResponse> {
  /**
   * params holds all the parameters of this module.
   *
   * @generated from field: anchor.Params params = 1;
   */
  params?: Params;

  constructor(data?: PartialMessage<QueryParamsResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "anchor.QueryParamsResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "params", kind: "message", T: Params },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): QueryParamsResponse {
    return new QueryParamsResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): QueryParamsResponse {
    return new QueryParamsResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): QueryParamsResponse {
    return new QueryParamsResponse().fromJsonString(jsonString, options);
  }

  static equals(a: QueryParamsResponse | PlainMessage<QueryParamsResponse> | undefined, b: QueryParamsResponse | PlainMessage<QueryParamsResponse> | undefined): boolean {
    return proto3.util.equals(QueryParamsResponse, a, b);
  }
}

/**
 * @generated from message anchor.QueryGetValueAtLocationRequest
 */
export class QueryGetValueAtLocationRequest extends Message<QueryGetValueAtLocationRequest> {
  /**
   * @generated from field: string locationId = 1;
   */
  locationId = "";

  constructor(data?: PartialMessage<QueryGetValueAtLocationRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "anchor.QueryGetValueAtLocationRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "locationId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): QueryGetValueAtLocationRequest {
    return new QueryGetValueAtLocationRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): QueryGetValueAtLocationRequest {
    return new QueryGetValueAtLocationRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): QueryGetValueAtLocationRequest {
    return new QueryGetValueAtLocationRequest().fromJsonString(jsonString, options);
  }

  static equals(a: QueryGetValueAtLocationRequest | PlainMessage<QueryGetValueAtLocationRequest> | undefined, b: QueryGetValueAtLocationRequest | PlainMessage<QueryGetValueAtLocationRequest> | undefined): boolean {
    return proto3.util.equals(QueryGetValueAtLocationRequest, a, b);
  }
}

/**
 * @generated from message anchor.QueryGetValueAtLocationResponse
 */
export class QueryGetValueAtLocationResponse extends Message<QueryGetValueAtLocationResponse> {
  /**
   * @generated from field: anchor.AnchorData anchorData = 1;
   */
  anchorData?: AnchorData;

  constructor(data?: PartialMessage<QueryGetValueAtLocationResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "anchor.QueryGetValueAtLocationResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "anchorData", kind: "message", T: AnchorData },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): QueryGetValueAtLocationResponse {
    return new QueryGetValueAtLocationResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): QueryGetValueAtLocationResponse {
    return new QueryGetValueAtLocationResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): QueryGetValueAtLocationResponse {
    return new QueryGetValueAtLocationResponse().fromJsonString(jsonString, options);
  }

  static equals(a: QueryGetValueAtLocationResponse | PlainMessage<QueryGetValueAtLocationResponse> | undefined, b: QueryGetValueAtLocationResponse | PlainMessage<QueryGetValueAtLocationResponse> | undefined): boolean {
    return proto3.util.equals(QueryGetValueAtLocationResponse, a, b);
  }
}
