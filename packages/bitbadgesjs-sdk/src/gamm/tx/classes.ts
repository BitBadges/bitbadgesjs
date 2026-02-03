import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';

import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { BigIntify, NumberType, Stringify } from '@/common/string-numbers.js';
import { CosmosCoin } from '@/core/coin.js';
import * as protobalancer from '@/proto/gamm/poolmodels/balancer/tx_pb.js';
import * as protogamm from '@/proto/gamm/v1beta1/tx_pb.js';
import * as protopoolmanager from '@/proto/poolmanager/v1beta1/swap_route_pb.js';
import { normalizeMessagesIfNecessary } from '@/transactions/messages/base.js';
import { PoolAsset, PoolParams } from '../classes.js';
import type { iMsgCreateBalancerPool, iMsgCreateBalancerPoolResponse, iMsgExitPool, iMsgExitPoolResponse, iMsgExitSwapExternAmountOut, iMsgExitSwapExternAmountOutResponse, iMsgExitSwapShareAmountIn, iMsgExitSwapShareAmountInResponse, iMsgJoinPool, iMsgJoinPoolResponse, iMsgJoinSwapExternAmountIn, iMsgJoinSwapExternAmountInResponse, iMsgJoinSwapShareAmountOut, iMsgJoinSwapShareAmountOutResponse, iMsgSwapExactAmountIn, iMsgSwapExactAmountInResponse, iIBCTransferInfo, iMsgSwapExactAmountInWithIBCTransfer, iMsgSwapExactAmountInWithIBCTransferResponse, iMsgSwapExactAmountOut, iMsgSwapExactAmountOutResponse, iSwapAmountInRoute, iSwapAmountOutRoute, iAffiliate } from './interfaces.js';

export class SwapAmountInRoute extends BaseNumberTypeClass<SwapAmountInRoute> implements iSwapAmountInRoute {
  poolId: string | number;
  tokenOutDenom: string;

  constructor(data: iSwapAmountInRoute) {
    super();
    this.poolId = data.poolId;
    this.tokenOutDenom = data.tokenOutDenom;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): SwapAmountInRoute {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SwapAmountInRoute;
  }

  toProto(): protopoolmanager.SwapAmountInRoute {
    return new protopoolmanager.SwapAmountInRoute({
      poolId: BigIntify(this.poolId),
      tokenOutDenom: this.tokenOutDenom
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): SwapAmountInRoute {
    return SwapAmountInRoute.fromProto(protopoolmanager.SwapAmountInRoute.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): SwapAmountInRoute {
    return SwapAmountInRoute.fromProto(protopoolmanager.SwapAmountInRoute.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protopoolmanager.SwapAmountInRoute, convertFunction: (item: string | number) => U): SwapAmountInRoute {
    return new SwapAmountInRoute({
      poolId: convertFunction(BigInt(item.poolId)),
      tokenOutDenom: item.tokenOutDenom
    });
  }

  toBech32Addresses(prefix: string): SwapAmountInRoute {
    return new SwapAmountInRoute({
      poolId: this.poolId,
      tokenOutDenom: this.tokenOutDenom
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"swapAmountInRoute":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class Affiliate extends BaseNumberTypeClass<Affiliate> implements iAffiliate {
  /** basis_points_fee is the fee in basis points (1/10000, e.g., 100 = 1%) */
  basisPointsFee: string;
  /** address is the affiliate recipient address */
  address: string;

  constructor(data: iAffiliate) {
    super();
    this.basisPointsFee = data.basisPointsFee;
    this.address = data.address;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): Affiliate {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Affiliate;
  }

  toProto(): protopoolmanager.Affiliate {
    return new protopoolmanager.Affiliate({
      basisPointsFee: this.basisPointsFee,
      address: this.address
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Affiliate {
    return Affiliate.fromProto(protopoolmanager.Affiliate.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Affiliate {
    return Affiliate.fromProto(protopoolmanager.Affiliate.fromJsonString(jsonString, options));
  }

  static fromProto(item: protopoolmanager.Affiliate): Affiliate {
    return new Affiliate({
      basisPointsFee: item.basisPointsFee,
      address: item.address
    });
  }

  toBech32Addresses(prefix: string): Affiliate {
    return new Affiliate({
      basisPointsFee: this.basisPointsFee,
      address: getConvertFunctionFromPrefix(prefix)(this.address)
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"affiliate":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class SwapAmountOutRoute extends BaseNumberTypeClass<SwapAmountOutRoute> implements iSwapAmountOutRoute {
  poolId: string | number;
  tokenInDenom: string;

  constructor(data: iSwapAmountOutRoute) {
    super();
    this.poolId = data.poolId;
    this.tokenInDenom = data.tokenInDenom;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): SwapAmountOutRoute {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SwapAmountOutRoute;
  }

  toProto(): protopoolmanager.SwapAmountOutRoute {
    return new protopoolmanager.SwapAmountOutRoute({
      poolId: BigIntify(this.poolId),
      tokenInDenom: this.tokenInDenom
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): SwapAmountOutRoute {
    return SwapAmountOutRoute.fromProto(protopoolmanager.SwapAmountOutRoute.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): SwapAmountOutRoute {
    return SwapAmountOutRoute.fromProto(protopoolmanager.SwapAmountOutRoute.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protopoolmanager.SwapAmountOutRoute, convertFunction: (item: string | number) => U): SwapAmountOutRoute {
    return new SwapAmountOutRoute({
      poolId: convertFunction(BigInt(item.poolId)),
      tokenInDenom: item.tokenInDenom
    });
  }

  toBech32Addresses(prefix: string): SwapAmountOutRoute {
    return new SwapAmountOutRoute({
      poolId: this.poolId,
      tokenInDenom: this.tokenInDenom
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"swapAmountOutRoute":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgJoinPool extends BaseNumberTypeClass<MsgJoinPool> implements iMsgJoinPool {
  sender: string;
  poolId: string | number;
  shareOutAmount: string | number;
  tokenInMaxs: CosmosCoin[];

  constructor(data: iMsgJoinPool) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId;
    this.shareOutAmount = data.shareOutAmount;
    this.tokenInMaxs = data.tokenInMaxs.map((coin) => new CosmosCoin(coin));
  }

  getNumberFieldNames(): string[] {
    return ['poolId', 'shareOutAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgJoinPool {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinPool;
  }

  toProto(): protogamm.MsgJoinPool {
    return new protogamm.MsgJoinPool({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      shareOutAmount: Stringify(this.shareOutAmount),
      tokenInMaxs: this.tokenInMaxs.map((coin) => new CosmosCoin(coin).convert(Stringify))
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinPool {
    return MsgJoinPool.fromProto(protogamm.MsgJoinPool.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinPool {
    return MsgJoinPool.fromProto(protogamm.MsgJoinPool.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgJoinPool, convertFunction: (item: string | number) => U): MsgJoinPool {
    return new MsgJoinPool({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      shareOutAmount: convertFunction(BigInt(item.shareOutAmount)),
      tokenInMaxs: item.tokenInMaxs.map((coin) =>
        new CosmosCoin({
          amount: convertFunction(BigInt(coin.amount)),
          denom: coin.denom
        }).convert(convertFunction)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgJoinPool {
    return new MsgJoinPool({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      poolId: this.poolId,
      shareOutAmount: this.shareOutAmount,
      tokenInMaxs: this.tokenInMaxs
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"joinPoolMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgJoinPoolResponse extends BaseNumberTypeClass<MsgJoinPoolResponse> implements iMsgJoinPoolResponse {
  shareOutAmount: string | number;
  tokenIn: CosmosCoin[];

  constructor(data: iMsgJoinPoolResponse) {
    super();
    this.shareOutAmount = data.shareOutAmount;
    this.tokenIn = data.tokenIn.map((coin) => new CosmosCoin(coin));
  }

  getNumberFieldNames(): string[] {
    return ['shareOutAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgJoinPoolResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinPoolResponse;
  }

  toProto(): protogamm.MsgJoinPoolResponse {
    return new protogamm.MsgJoinPoolResponse({
      shareOutAmount: Stringify(this.shareOutAmount),
      tokenIn: this.tokenIn.map((coin) => new CosmosCoin(coin).convert(Stringify))
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinPoolResponse {
    return MsgJoinPoolResponse.fromProto(protogamm.MsgJoinPoolResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinPoolResponse {
    return MsgJoinPoolResponse.fromProto(protogamm.MsgJoinPoolResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgJoinPoolResponse, convertFunction: (item: string | number) => U): MsgJoinPoolResponse {
    return new MsgJoinPoolResponse({
      shareOutAmount: convertFunction(BigInt(item.shareOutAmount)),
      tokenIn: item.tokenIn.map((coin) =>
        new CosmosCoin({
          amount: convertFunction(BigInt(coin.amount)),
          denom: coin.denom
        }).convert(convertFunction)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgJoinPoolResponse {
    return new MsgJoinPoolResponse({
      shareOutAmount: this.shareOutAmount,
      tokenIn: this.tokenIn
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"joinPoolResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgExitPool extends BaseNumberTypeClass<MsgExitPool> implements iMsgExitPool {
  sender: string;
  poolId: string | number;
  shareInAmount: string | number;
  tokenOutMins: CosmosCoin[];

  constructor(data: iMsgExitPool) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId;
    this.shareInAmount = data.shareInAmount;
    this.tokenOutMins = data.tokenOutMins.map((coin) => new CosmosCoin(coin));
  }

  getNumberFieldNames(): string[] {
    return ['poolId', 'shareInAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgExitPool {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitPool;
  }

  toProto(): protogamm.MsgExitPool {
    return new protogamm.MsgExitPool({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      shareInAmount: Stringify(this.shareInAmount),
      tokenOutMins: this.tokenOutMins.map((coin) => new CosmosCoin(coin).convert(Stringify))
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitPool {
    return MsgExitPool.fromProto(protogamm.MsgExitPool.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitPool {
    return MsgExitPool.fromProto(protogamm.MsgExitPool.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgExitPool, convertFunction: (item: string | number) => U): MsgExitPool {
    return new MsgExitPool({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      shareInAmount: convertFunction(BigInt(item.shareInAmount)),
      tokenOutMins: item.tokenOutMins.map((coin) =>
        new CosmosCoin({
          amount: convertFunction(BigInt(coin.amount)),
          denom: coin.denom
        }).convert(convertFunction)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgExitPool {
    return new MsgExitPool({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      poolId: this.poolId,
      shareInAmount: this.shareInAmount,
      tokenOutMins: this.tokenOutMins
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"exitPoolMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgExitPoolResponse extends BaseNumberTypeClass<MsgExitPoolResponse> implements iMsgExitPoolResponse {
  tokenOut: CosmosCoin[];

  constructor(data: iMsgExitPoolResponse) {
    super();
    this.tokenOut = data.tokenOut.map((coin) => new CosmosCoin(coin));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgExitPoolResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitPoolResponse;
  }

  toProto(): protogamm.MsgExitPoolResponse {
    return new protogamm.MsgExitPoolResponse({
      tokenOut: this.tokenOut.map((coin) => new CosmosCoin(coin).convert(Stringify))
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitPoolResponse {
    return MsgExitPoolResponse.fromProto(protogamm.MsgExitPoolResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitPoolResponse {
    return MsgExitPoolResponse.fromProto(protogamm.MsgExitPoolResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgExitPoolResponse, convertFunction: (item: string | number) => U): MsgExitPoolResponse {
    return new MsgExitPoolResponse({
      tokenOut: item.tokenOut.map((coin) =>
        new CosmosCoin({
          amount: convertFunction(BigInt(coin.amount)),
          denom: coin.denom
        }).convert(convertFunction)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgExitPoolResponse {
    return new MsgExitPoolResponse({
      tokenOut: this.tokenOut
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"exitPoolResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgSwapExactAmountIn extends BaseNumberTypeClass<MsgSwapExactAmountIn> implements iMsgSwapExactAmountIn {
  sender: string;
  routes: SwapAmountInRoute[];
  tokenIn: CosmosCoin;
  tokenOutMinAmount: string | number;
  affiliates: Affiliate[];

  constructor(data: iMsgSwapExactAmountIn) {
    super();
    this.sender = data.sender;
    this.routes = data.routes.map((route) => new SwapAmountInRoute(route));
    this.tokenIn = new CosmosCoin(data.tokenIn);
    this.tokenOutMinAmount = data.tokenOutMinAmount;
    this.affiliates = (data.affiliates || []).map((affiliate) => new Affiliate(affiliate));
  }

  getNumberFieldNames(): string[] {
    return ['tokenOutMinAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgSwapExactAmountIn {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountIn;
  }

  toProto(): protogamm.MsgSwapExactAmountIn {
    return new protogamm.MsgSwapExactAmountIn({
      sender: this.sender,
      routes: this.routes.map((route) => new SwapAmountInRoute(route).toProto()),
      tokenIn: new CosmosCoin(this.tokenIn).convert(Stringify),
      tokenOutMinAmount: Stringify(this.tokenOutMinAmount),
      affiliates: this.affiliates.map((affiliate) => affiliate.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountIn {
    return MsgSwapExactAmountIn.fromProto(protogamm.MsgSwapExactAmountIn.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountIn {
    return MsgSwapExactAmountIn.fromProto(protogamm.MsgSwapExactAmountIn.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgSwapExactAmountIn, convertFunction: (item: string | number) => U): MsgSwapExactAmountIn {
    return new MsgSwapExactAmountIn({
      sender: item.sender,
      routes: item.routes.map((route) => SwapAmountInRoute.fromProto(route, convertFunction)),
      tokenIn: new CosmosCoin({
        amount: convertFunction(BigInt(item.tokenIn!.amount)),
        denom: item.tokenIn!.denom
      }).convert(convertFunction),
      tokenOutMinAmount: convertFunction(BigInt(item.tokenOutMinAmount)),
      affiliates: (item.affiliates || []).map((affiliate) => Affiliate.fromProto(affiliate))
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountIn {
    return new MsgSwapExactAmountIn({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      routes: this.routes,
      tokenIn: this.tokenIn,
      tokenOutMinAmount: this.tokenOutMinAmount,
      affiliates: this.affiliates.map((affiliate) => affiliate.toBech32Addresses(prefix))
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"swapExactAmountInMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgSwapExactAmountInResponse extends BaseNumberTypeClass<MsgSwapExactAmountInResponse> implements iMsgSwapExactAmountInResponse {
  tokenOutAmount: string | number;

  constructor(data: iMsgSwapExactAmountInResponse) {
    super();
    this.tokenOutAmount = data.tokenOutAmount;
  }

  getNumberFieldNames(): string[] {
    return ['tokenOutAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgSwapExactAmountInResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountInResponse;
  }

  toProto(): protogamm.MsgSwapExactAmountInResponse {
    return new protogamm.MsgSwapExactAmountInResponse({
      tokenOutAmount: Stringify(this.tokenOutAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountInResponse {
    return MsgSwapExactAmountInResponse.fromProto(protogamm.MsgSwapExactAmountInResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountInResponse {
    return MsgSwapExactAmountInResponse.fromProto(protogamm.MsgSwapExactAmountInResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgSwapExactAmountInResponse, convertFunction: (item: string | number) => U): MsgSwapExactAmountInResponse {
    return new MsgSwapExactAmountInResponse({
      tokenOutAmount: convertFunction(BigInt(item.tokenOutAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountInResponse {
    return new MsgSwapExactAmountInResponse({
      tokenOutAmount: this.tokenOutAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"swapExactAmountInResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class IBCTransferInfo extends BaseNumberTypeClass<IBCTransferInfo> implements iIBCTransferInfo {
  sourceChannel: string;
  receiver: string;
  memo: string;
  timeoutTimestamp: string | number;

  constructor(data: iIBCTransferInfo) {
    super();
    this.sourceChannel = data.sourceChannel;
    this.receiver = data.receiver;
    this.memo = data.memo;
    this.timeoutTimestamp = data.timeoutTimestamp;
  }

  getNumberFieldNames(): string[] {
    return ['timeoutTimestamp'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): IBCTransferInfo {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as IBCTransferInfo;
  }

  toProto(): protogamm.IBCTransferInfo {
    return new protogamm.IBCTransferInfo({
      sourceChannel: this.sourceChannel,
      receiver: this.receiver,
      memo: this.memo,
      timeoutTimestamp: BigIntify(this.timeoutTimestamp)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): IBCTransferInfo {
    return IBCTransferInfo.fromProto(protogamm.IBCTransferInfo.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): IBCTransferInfo {
    return IBCTransferInfo.fromProto(protogamm.IBCTransferInfo.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.IBCTransferInfo, convertFunction: (item: string | number) => U): IBCTransferInfo {
    return new IBCTransferInfo({
      sourceChannel: item.sourceChannel,
      receiver: item.receiver,
      memo: item.memo,
      timeoutTimestamp: convertFunction(BigInt(item.timeoutTimestamp))
    });
  }

  toBech32Addresses(prefix: string): IBCTransferInfo {
    return new IBCTransferInfo({
      sourceChannel: this.sourceChannel,
      receiver: this.receiver,
      memo: this.memo,
      timeoutTimestamp: this.timeoutTimestamp
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"ibcTransferInfo":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgSwapExactAmountInWithIBCTransfer extends BaseNumberTypeClass<MsgSwapExactAmountInWithIBCTransfer> implements iMsgSwapExactAmountInWithIBCTransfer {
  sender: string;
  routes: SwapAmountInRoute[];
  tokenIn: CosmosCoin;
  tokenOutMinAmount: string | number;
  ibcTransferInfo: IBCTransferInfo;
  affiliates: Affiliate[];

  constructor(data: iMsgSwapExactAmountInWithIBCTransfer) {
    super();
    this.sender = data.sender;
    this.routes = data.routes.map((route) => new SwapAmountInRoute(route));
    this.tokenIn = new CosmosCoin(data.tokenIn);
    this.tokenOutMinAmount = data.tokenOutMinAmount;
    this.ibcTransferInfo = new IBCTransferInfo(data.ibcTransferInfo);
    this.affiliates = (data.affiliates || []).map((affiliate) => new Affiliate(affiliate));
  }

  getNumberFieldNames(): string[] {
    return ['tokenOutMinAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgSwapExactAmountInWithIBCTransfer {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountInWithIBCTransfer;
  }

  toProto(): protogamm.MsgSwapExactAmountInWithIBCTransfer {
    return new protogamm.MsgSwapExactAmountInWithIBCTransfer({
      sender: this.sender,
      routes: this.routes.map((route) => new SwapAmountInRoute(route).toProto()),
      tokenIn: new CosmosCoin(this.tokenIn).convert(Stringify),
      tokenOutMinAmount: Stringify(this.tokenOutMinAmount),
      ibcTransferInfo: this.ibcTransferInfo.toProto(),
      affiliates: this.affiliates.map((affiliate) => affiliate.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountInWithIBCTransfer {
    return MsgSwapExactAmountInWithIBCTransfer.fromProto(protogamm.MsgSwapExactAmountInWithIBCTransfer.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountInWithIBCTransfer {
    return MsgSwapExactAmountInWithIBCTransfer.fromProto(protogamm.MsgSwapExactAmountInWithIBCTransfer.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgSwapExactAmountInWithIBCTransfer, convertFunction: (item: string | number) => U): MsgSwapExactAmountInWithIBCTransfer {
    return new MsgSwapExactAmountInWithIBCTransfer({
      sender: item.sender,
      routes: item.routes.map((route) => SwapAmountInRoute.fromProto(route, convertFunction)),
      tokenIn: new CosmosCoin({
        amount: convertFunction(BigInt(item.tokenIn!.amount)),
        denom: item.tokenIn!.denom
      }).convert(convertFunction),
      tokenOutMinAmount: convertFunction(BigInt(item.tokenOutMinAmount)),
      ibcTransferInfo: item.ibcTransferInfo
        ? IBCTransferInfo.fromProto(item.ibcTransferInfo, convertFunction)
        : {
            sourceChannel: '',
            receiver: '',
            memo: '',
            timeoutTimestamp: convertFunction(0n)
          },
      affiliates: (item.affiliates || []).map((affiliate) => Affiliate.fromProto(affiliate))
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountInWithIBCTransfer {
    return new MsgSwapExactAmountInWithIBCTransfer({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      routes: this.routes,
      tokenIn: this.tokenIn,
      tokenOutMinAmount: this.tokenOutMinAmount,
      ibcTransferInfo: this.ibcTransferInfo,
      affiliates: this.affiliates.map((affiliate) => affiliate.toBech32Addresses(prefix))
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"swapExactAmountInWithIBCTransferMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgSwapExactAmountInWithIBCTransferResponse extends BaseNumberTypeClass<MsgSwapExactAmountInWithIBCTransferResponse> implements iMsgSwapExactAmountInWithIBCTransferResponse {
  tokenOutAmount: string | number;

  constructor(data: iMsgSwapExactAmountInWithIBCTransferResponse) {
    super();
    this.tokenOutAmount = data.tokenOutAmount;
  }

  getNumberFieldNames(): string[] {
    return ['tokenOutAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgSwapExactAmountInWithIBCTransferResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountInWithIBCTransferResponse;
  }

  toProto(): protogamm.MsgSwapExactAmountInWithIBCTransferResponse {
    return new protogamm.MsgSwapExactAmountInWithIBCTransferResponse({
      tokenOutAmount: Stringify(this.tokenOutAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountInWithIBCTransferResponse {
    return MsgSwapExactAmountInWithIBCTransferResponse.fromProto(protogamm.MsgSwapExactAmountInWithIBCTransferResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountInWithIBCTransferResponse {
    return MsgSwapExactAmountInWithIBCTransferResponse.fromProto(protogamm.MsgSwapExactAmountInWithIBCTransferResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgSwapExactAmountInWithIBCTransferResponse, convertFunction: (item: string | number) => U): MsgSwapExactAmountInWithIBCTransferResponse {
    return new MsgSwapExactAmountInWithIBCTransferResponse({
      tokenOutAmount: convertFunction(BigInt(item.tokenOutAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountInWithIBCTransferResponse {
    return new MsgSwapExactAmountInWithIBCTransferResponse({
      tokenOutAmount: this.tokenOutAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"swapExactAmountInWithIBCTransferResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgSwapExactAmountOut extends BaseNumberTypeClass<MsgSwapExactAmountOut> implements iMsgSwapExactAmountOut {
  sender: string;
  routes: SwapAmountOutRoute[];
  tokenInMaxAmount: string | number;
  tokenOut: CosmosCoin;

  constructor(data: iMsgSwapExactAmountOut) {
    super();
    this.sender = data.sender;
    this.routes = data.routes.map((route) => new SwapAmountOutRoute(route));
    this.tokenInMaxAmount = data.tokenInMaxAmount;
    this.tokenOut = new CosmosCoin(data.tokenOut);
  }

  getNumberFieldNames(): string[] {
    return ['tokenInMaxAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgSwapExactAmountOut {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountOut;
  }

  toProto(): protogamm.MsgSwapExactAmountOut {
    return new protogamm.MsgSwapExactAmountOut({
      sender: this.sender,
      routes: this.routes.map((route) => new SwapAmountOutRoute(route).toProto()),
      tokenInMaxAmount: Stringify(this.tokenInMaxAmount),
      tokenOut: new CosmosCoin(this.tokenOut).convert(Stringify)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountOut {
    return MsgSwapExactAmountOut.fromProto(protogamm.MsgSwapExactAmountOut.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountOut {
    return MsgSwapExactAmountOut.fromProto(protogamm.MsgSwapExactAmountOut.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgSwapExactAmountOut, convertFunction: (item: string | number) => U): MsgSwapExactAmountOut {
    return new MsgSwapExactAmountOut({
      sender: item.sender,
      routes: item.routes.map((route) => SwapAmountOutRoute.fromProto(route, convertFunction)),
      tokenInMaxAmount: convertFunction(BigInt(item.tokenInMaxAmount)),
      tokenOut: new CosmosCoin({
        amount: convertFunction(BigInt(item.tokenOut!.amount)),
        denom: item.tokenOut!.denom
      }).convert(convertFunction)
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountOut {
    return new MsgSwapExactAmountOut({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      routes: this.routes,
      tokenInMaxAmount: this.tokenInMaxAmount,
      tokenOut: this.tokenOut
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"swapExactAmountOutMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgSwapExactAmountOutResponse extends BaseNumberTypeClass<MsgSwapExactAmountOutResponse> implements iMsgSwapExactAmountOutResponse {
  tokenInAmount: string | number;

  constructor(data: iMsgSwapExactAmountOutResponse) {
    super();
    this.tokenInAmount = data.tokenInAmount;
  }

  getNumberFieldNames(): string[] {
    return ['tokenInAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgSwapExactAmountOutResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountOutResponse;
  }

  toProto(): protogamm.MsgSwapExactAmountOutResponse {
    return new protogamm.MsgSwapExactAmountOutResponse({
      tokenInAmount: Stringify(this.tokenInAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountOutResponse {
    return MsgSwapExactAmountOutResponse.fromProto(protogamm.MsgSwapExactAmountOutResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgSwapExactAmountOutResponse {
    return MsgSwapExactAmountOutResponse.fromProto(protogamm.MsgSwapExactAmountOutResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgSwapExactAmountOutResponse, convertFunction: (item: string | number) => U): MsgSwapExactAmountOutResponse {
    return new MsgSwapExactAmountOutResponse({
      tokenInAmount: convertFunction(BigInt(item.tokenInAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountOutResponse {
    return new MsgSwapExactAmountOutResponse({
      tokenInAmount: this.tokenInAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"swapExactAmountOutResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgJoinSwapExternAmountIn extends BaseNumberTypeClass<MsgJoinSwapExternAmountIn> implements iMsgJoinSwapExternAmountIn {
  sender: string;
  poolId: string | number;
  tokenIn: CosmosCoin;
  shareOutMinAmount: string | number;

  constructor(data: iMsgJoinSwapExternAmountIn) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId as T;
    this.tokenIn = new CosmosCoin(data.tokenIn);
    this.shareOutMinAmount = data.shareOutMinAmount;
  }

  getNumberFieldNames(): string[] {
    return ['poolId', 'shareOutMinAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgJoinSwapExternAmountIn {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinSwapExternAmountIn;
  }

  toProto(): protogamm.MsgJoinSwapExternAmountIn {
    return new protogamm.MsgJoinSwapExternAmountIn({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      tokenIn: new CosmosCoin(this.tokenIn).convert(Stringify),
      shareOutMinAmount: Stringify(this.shareOutMinAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinSwapExternAmountIn {
    return MsgJoinSwapExternAmountIn.fromProto(protogamm.MsgJoinSwapExternAmountIn.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinSwapExternAmountIn {
    return MsgJoinSwapExternAmountIn.fromProto(protogamm.MsgJoinSwapExternAmountIn.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgJoinSwapExternAmountIn, convertFunction: (item: string | number) => U): MsgJoinSwapExternAmountIn {
    return new MsgJoinSwapExternAmountIn({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      tokenIn: new CosmosCoin({
        amount: convertFunction(BigInt(item.tokenIn!.amount)),
        denom: item.tokenIn!.denom
      }).convert(convertFunction),
      shareOutMinAmount: convertFunction(BigInt(item.shareOutMinAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgJoinSwapExternAmountIn {
    return new MsgJoinSwapExternAmountIn({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      poolId: this.poolId,
      tokenIn: this.tokenIn,
      shareOutMinAmount: this.shareOutMinAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"joinSwapExternAmountInMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgJoinSwapExternAmountInResponse extends BaseNumberTypeClass<MsgJoinSwapExternAmountInResponse> implements iMsgJoinSwapExternAmountInResponse {
  shareOutAmount: string | number;

  constructor(data: iMsgJoinSwapExternAmountInResponse) {
    super();
    this.shareOutAmount = data.shareOutAmount;
  }

  getNumberFieldNames(): string[] {
    return ['shareOutAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgJoinSwapExternAmountInResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinSwapExternAmountInResponse;
  }

  toProto(): protogamm.MsgJoinSwapExternAmountInResponse {
    return new protogamm.MsgJoinSwapExternAmountInResponse({
      shareOutAmount: Stringify(this.shareOutAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinSwapExternAmountInResponse {
    return MsgJoinSwapExternAmountInResponse.fromProto(protogamm.MsgJoinSwapExternAmountInResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinSwapExternAmountInResponse {
    return MsgJoinSwapExternAmountInResponse.fromProto(protogamm.MsgJoinSwapExternAmountInResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgJoinSwapExternAmountInResponse, convertFunction: (item: string | number) => U): MsgJoinSwapExternAmountInResponse {
    return new MsgJoinSwapExternAmountInResponse({
      shareOutAmount: convertFunction(BigInt(item.shareOutAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgJoinSwapExternAmountInResponse {
    return new MsgJoinSwapExternAmountInResponse({
      shareOutAmount: this.shareOutAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"joinSwapExternAmountInResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgJoinSwapShareAmountOut extends BaseNumberTypeClass<MsgJoinSwapShareAmountOut> implements iMsgJoinSwapShareAmountOut {
  sender: string;
  poolId: string | number;
  tokenInDenom: string;
  shareOutAmount: string | number;
  tokenInMaxAmount: string | number;

  constructor(data: iMsgJoinSwapShareAmountOut) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId as T;
    this.tokenInDenom = data.tokenInDenom;
    this.shareOutAmount = data.shareOutAmount;
    this.tokenInMaxAmount = data.tokenInMaxAmount;
  }

  getNumberFieldNames(): string[] {
    return ['poolId', 'shareOutAmount', 'tokenInMaxAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgJoinSwapShareAmountOut {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinSwapShareAmountOut;
  }

  toProto(): protogamm.MsgJoinSwapShareAmountOut {
    return new protogamm.MsgJoinSwapShareAmountOut({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      tokenInDenom: this.tokenInDenom,
      shareOutAmount: Stringify(this.shareOutAmount),
      tokenInMaxAmount: Stringify(this.tokenInMaxAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinSwapShareAmountOut {
    return MsgJoinSwapShareAmountOut.fromProto(protogamm.MsgJoinSwapShareAmountOut.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinSwapShareAmountOut {
    return MsgJoinSwapShareAmountOut.fromProto(protogamm.MsgJoinSwapShareAmountOut.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgJoinSwapShareAmountOut, convertFunction: (item: string | number) => U): MsgJoinSwapShareAmountOut {
    return new MsgJoinSwapShareAmountOut({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      tokenInDenom: item.tokenInDenom,
      shareOutAmount: convertFunction(BigInt(item.shareOutAmount)),
      tokenInMaxAmount: convertFunction(BigInt(item.tokenInMaxAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgJoinSwapShareAmountOut {
    return new MsgJoinSwapShareAmountOut({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      poolId: this.poolId,
      tokenInDenom: this.tokenInDenom,
      shareOutAmount: this.shareOutAmount,
      tokenInMaxAmount: this.tokenInMaxAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"joinSwapShareAmountOutMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgJoinSwapShareAmountOutResponse extends BaseNumberTypeClass<MsgJoinSwapShareAmountOutResponse> implements iMsgJoinSwapShareAmountOutResponse {
  tokenInAmount: string | number;

  constructor(data: iMsgJoinSwapShareAmountOutResponse) {
    super();
    this.tokenInAmount = data.tokenInAmount;
  }

  getNumberFieldNames(): string[] {
    return ['tokenInAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgJoinSwapShareAmountOutResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinSwapShareAmountOutResponse;
  }

  toProto(): protogamm.MsgJoinSwapShareAmountOutResponse {
    return new protogamm.MsgJoinSwapShareAmountOutResponse({
      tokenInAmount: Stringify(this.tokenInAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinSwapShareAmountOutResponse {
    return MsgJoinSwapShareAmountOutResponse.fromProto(protogamm.MsgJoinSwapShareAmountOutResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgJoinSwapShareAmountOutResponse {
    return MsgJoinSwapShareAmountOutResponse.fromProto(protogamm.MsgJoinSwapShareAmountOutResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgJoinSwapShareAmountOutResponse, convertFunction: (item: string | number) => U): MsgJoinSwapShareAmountOutResponse {
    return new MsgJoinSwapShareAmountOutResponse({
      tokenInAmount: convertFunction(BigInt(item.tokenInAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgJoinSwapShareAmountOutResponse {
    return new MsgJoinSwapShareAmountOutResponse({
      tokenInAmount: this.tokenInAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"joinSwapShareAmountOutResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgExitSwapShareAmountIn extends BaseNumberTypeClass<MsgExitSwapShareAmountIn> implements iMsgExitSwapShareAmountIn {
  sender: string;
  poolId: string | number;
  tokenOutDenom: string;
  shareInAmount: string | number;
  tokenOutMinAmount: string | number;

  constructor(data: iMsgExitSwapShareAmountIn) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId as T;
    this.tokenOutDenom = data.tokenOutDenom;
    this.shareInAmount = data.shareInAmount;
    this.tokenOutMinAmount = data.tokenOutMinAmount;
  }

  getNumberFieldNames(): string[] {
    return ['poolId', 'shareInAmount', 'tokenOutMinAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgExitSwapShareAmountIn {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitSwapShareAmountIn;
  }

  toProto(): protogamm.MsgExitSwapShareAmountIn {
    return new protogamm.MsgExitSwapShareAmountIn({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      tokenOutDenom: this.tokenOutDenom,
      shareInAmount: Stringify(this.shareInAmount),
      tokenOutMinAmount: Stringify(this.tokenOutMinAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitSwapShareAmountIn {
    return MsgExitSwapShareAmountIn.fromProto(protogamm.MsgExitSwapShareAmountIn.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitSwapShareAmountIn {
    return MsgExitSwapShareAmountIn.fromProto(protogamm.MsgExitSwapShareAmountIn.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgExitSwapShareAmountIn, convertFunction: (item: string | number) => U): MsgExitSwapShareAmountIn {
    return new MsgExitSwapShareAmountIn({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      tokenOutDenom: item.tokenOutDenom,
      shareInAmount: convertFunction(BigInt(item.shareInAmount)),
      tokenOutMinAmount: convertFunction(BigInt(item.tokenOutMinAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgExitSwapShareAmountIn {
    return new MsgExitSwapShareAmountIn({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      poolId: this.poolId,
      tokenOutDenom: this.tokenOutDenom,
      shareInAmount: this.shareInAmount,
      tokenOutMinAmount: this.tokenOutMinAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"exitSwapShareAmountInMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgExitSwapShareAmountInResponse extends BaseNumberTypeClass<MsgExitSwapShareAmountInResponse> implements iMsgExitSwapShareAmountInResponse {
  tokenOutAmount: string | number;

  constructor(data: iMsgExitSwapShareAmountInResponse) {
    super();
    this.tokenOutAmount = data.tokenOutAmount;
  }

  getNumberFieldNames(): string[] {
    return ['tokenOutAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgExitSwapShareAmountInResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitSwapShareAmountInResponse;
  }

  toProto(): protogamm.MsgExitSwapShareAmountInResponse {
    return new protogamm.MsgExitSwapShareAmountInResponse({
      tokenOutAmount: Stringify(this.tokenOutAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitSwapShareAmountInResponse {
    return MsgExitSwapShareAmountInResponse.fromProto(protogamm.MsgExitSwapShareAmountInResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitSwapShareAmountInResponse {
    return MsgExitSwapShareAmountInResponse.fromProto(protogamm.MsgExitSwapShareAmountInResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgExitSwapShareAmountInResponse, convertFunction: (item: string | number) => U): MsgExitSwapShareAmountInResponse {
    return new MsgExitSwapShareAmountInResponse({
      tokenOutAmount: convertFunction(BigInt(item.tokenOutAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgExitSwapShareAmountInResponse {
    return new MsgExitSwapShareAmountInResponse({
      tokenOutAmount: this.tokenOutAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"exitSwapShareAmountInResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgExitSwapExternAmountOut extends BaseNumberTypeClass<MsgExitSwapExternAmountOut> implements iMsgExitSwapExternAmountOut {
  sender: string;
  poolId: string | number;
  tokenOut: CosmosCoin;
  shareInMaxAmount: string | number;

  constructor(data: iMsgExitSwapExternAmountOut) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId as T;
    this.tokenOut = new CosmosCoin(data.tokenOut);
    this.shareInMaxAmount = data.shareInMaxAmount;
  }

  getNumberFieldNames(): string[] {
    return ['poolId', 'shareInMaxAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgExitSwapExternAmountOut {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitSwapExternAmountOut;
  }

  toProto(): protogamm.MsgExitSwapExternAmountOut {
    return new protogamm.MsgExitSwapExternAmountOut({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      tokenOut: new CosmosCoin(this.tokenOut).convert(Stringify),
      shareInMaxAmount: Stringify(this.shareInMaxAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitSwapExternAmountOut {
    return MsgExitSwapExternAmountOut.fromProto(protogamm.MsgExitSwapExternAmountOut.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitSwapExternAmountOut {
    return MsgExitSwapExternAmountOut.fromProto(protogamm.MsgExitSwapExternAmountOut.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgExitSwapExternAmountOut, convertFunction: (item: string | number) => U): MsgExitSwapExternAmountOut {
    return new MsgExitSwapExternAmountOut({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      tokenOut: new CosmosCoin({
        amount: convertFunction(BigInt(item.tokenOut!.amount)),
        denom: item.tokenOut!.denom
      }).convert(convertFunction),
      shareInMaxAmount: convertFunction(BigInt(item.shareInMaxAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgExitSwapExternAmountOut {
    return new MsgExitSwapExternAmountOut({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      poolId: this.poolId,
      tokenOut: this.tokenOut,
      shareInMaxAmount: this.shareInMaxAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"exitSwapExternAmountOutMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgExitSwapExternAmountOutResponse extends BaseNumberTypeClass<MsgExitSwapExternAmountOutResponse> implements iMsgExitSwapExternAmountOutResponse {
  shareInAmount: string | number;

  constructor(data: iMsgExitSwapExternAmountOutResponse) {
    super();
    this.shareInAmount = data.shareInAmount;
  }

  getNumberFieldNames(): string[] {
    return ['shareInAmount'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgExitSwapExternAmountOutResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitSwapExternAmountOutResponse;
  }

  toProto(): protogamm.MsgExitSwapExternAmountOutResponse {
    return new protogamm.MsgExitSwapExternAmountOutResponse({
      shareInAmount: Stringify(this.shareInAmount)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitSwapExternAmountOutResponse {
    return MsgExitSwapExternAmountOutResponse.fromProto(protogamm.MsgExitSwapExternAmountOutResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgExitSwapExternAmountOutResponse {
    return MsgExitSwapExternAmountOutResponse.fromProto(protogamm.MsgExitSwapExternAmountOutResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.MsgExitSwapExternAmountOutResponse, convertFunction: (item: string | number) => U): MsgExitSwapExternAmountOutResponse {
    return new MsgExitSwapExternAmountOutResponse({
      shareInAmount: convertFunction(BigInt(item.shareInAmount))
    });
  }

  toBech32Addresses(prefix: string): MsgExitSwapExternAmountOutResponse {
    return new MsgExitSwapExternAmountOutResponse({
      shareInAmount: this.shareInAmount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"exitSwapExternAmountOutResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgCreateBalancerPool extends BaseNumberTypeClass<MsgCreateBalancerPool> implements iMsgCreateBalancerPool {
  sender: string;
  poolParams: PoolParams;
  poolAssets: PoolAsset[];

  constructor(data: iMsgCreateBalancerPool) {
    super();
    this.sender = data.sender;
    this.poolParams = new PoolParams(data.poolParams);
    this.poolAssets = data.poolAssets.map((asset) => new PoolAsset(asset));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgCreateBalancerPool {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgCreateBalancerPool;
  }

  toProto(): protobalancer.MsgCreateBalancerPool {
    return new protobalancer.MsgCreateBalancerPool({
      sender: this.sender,
      poolParams: new PoolParams(this.poolParams).toProto(),
      poolAssets: this.poolAssets.map((asset) => new PoolAsset(asset).toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgCreateBalancerPool {
    return MsgCreateBalancerPool.fromProto(protobalancer.MsgCreateBalancerPool.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgCreateBalancerPool {
    return MsgCreateBalancerPool.fromProto(protobalancer.MsgCreateBalancerPool.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobalancer.MsgCreateBalancerPool, convertFunction: (item: string | number) => U): MsgCreateBalancerPool {
    return new MsgCreateBalancerPool({
      sender: item.sender,
      poolParams: item.poolParams
        ? PoolParams.fromProto(item.poolParams, convertFunction)
        : {
            swapFee: '0',
            exitFee: '0'
          },
      poolAssets: item.poolAssets.map((asset) => PoolAsset.fromProto(asset, convertFunction))
    });
  }

  toBech32Addresses(prefix: string): MsgCreateBalancerPool {
    return new MsgCreateBalancerPool({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      poolParams: this.poolParams,
      poolAssets: this.poolAssets
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"createBalancerPoolMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}

export class MsgCreateBalancerPoolResponse extends BaseNumberTypeClass<MsgCreateBalancerPoolResponse> implements iMsgCreateBalancerPoolResponse {
  poolId: string | number;

  constructor(data: iMsgCreateBalancerPoolResponse) {
    super();
    this.poolId = data.poolId as T;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgCreateBalancerPoolResponse {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgCreateBalancerPoolResponse;
  }

  toProto(): protobalancer.MsgCreateBalancerPoolResponse {
    return new protobalancer.MsgCreateBalancerPoolResponse({
      poolId: BigIntify(this.poolId)
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgCreateBalancerPoolResponse {
    return MsgCreateBalancerPoolResponse.fromProto(protobalancer.MsgCreateBalancerPoolResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgCreateBalancerPoolResponse {
    return MsgCreateBalancerPoolResponse.fromProto(protobalancer.MsgCreateBalancerPoolResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protobalancer.MsgCreateBalancerPoolResponse, convertFunction: (item: string | number) => U): MsgCreateBalancerPoolResponse {
    return new MsgCreateBalancerPoolResponse({
      poolId: convertFunction(BigInt(item.poolId))
    });
  }

  toBech32Addresses(prefix: string): MsgCreateBalancerPoolResponse {
    return new MsgCreateBalancerPoolResponse({
      poolId: this.poolId
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"createBalancerPoolResponseMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
