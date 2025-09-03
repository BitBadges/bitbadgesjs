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
import type {
  iMsgCreateBalancerPool,
  iMsgCreateBalancerPoolResponse,
  iMsgExitPool,
  iMsgExitPoolResponse,
  iMsgExitSwapExternAmountOut,
  iMsgExitSwapExternAmountOutResponse,
  iMsgExitSwapShareAmountIn,
  iMsgExitSwapShareAmountInResponse,
  iMsgJoinPool,
  iMsgJoinPoolResponse,
  iMsgJoinSwapExternAmountIn,
  iMsgJoinSwapExternAmountInResponse,
  iMsgJoinSwapShareAmountOut,
  iMsgJoinSwapShareAmountOutResponse,
  iMsgSwapExactAmountIn,
  iMsgSwapExactAmountInResponse,
  iMsgSwapExactAmountOut,
  iMsgSwapExactAmountOutResponse,
  iSwapAmountInRoute,
  iSwapAmountOutRoute
} from './interfaces.js';

export class SwapAmountInRoute<T extends NumberType> extends BaseNumberTypeClass<SwapAmountInRoute<T>> implements iSwapAmountInRoute<T> {
  poolId: T;
  tokenOutDenom: string;

  constructor(data: iSwapAmountInRoute<T>) {
    super();
    this.poolId = data.poolId;
    this.tokenOutDenom = data.tokenOutDenom;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): SwapAmountInRoute<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SwapAmountInRoute<U>;
  }

  toProto(): protopoolmanager.SwapAmountInRoute {
    return new protopoolmanager.SwapAmountInRoute({
      poolId: BigIntify(this.poolId),
      tokenOutDenom: this.tokenOutDenom
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): SwapAmountInRoute<U> {
    return SwapAmountInRoute.fromProto(protopoolmanager.SwapAmountInRoute.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): SwapAmountInRoute<U> {
    return SwapAmountInRoute.fromProto(protopoolmanager.SwapAmountInRoute.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protopoolmanager.SwapAmountInRoute, convertFunction: (item: NumberType) => U): SwapAmountInRoute<U> {
    return new SwapAmountInRoute<U>({
      poolId: convertFunction(BigInt(item.poolId)),
      tokenOutDenom: item.tokenOutDenom
    });
  }

  toBech32Addresses(prefix: string): SwapAmountInRoute<T> {
    return new SwapAmountInRoute<T>({
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

export class SwapAmountOutRoute<T extends NumberType> extends BaseNumberTypeClass<SwapAmountOutRoute<T>> implements iSwapAmountOutRoute<T> {
  poolId: T;
  tokenInDenom: string;

  constructor(data: iSwapAmountOutRoute<T>) {
    super();
    this.poolId = data.poolId;
    this.tokenInDenom = data.tokenInDenom;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): SwapAmountOutRoute<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as SwapAmountOutRoute<U>;
  }

  toProto(): protopoolmanager.SwapAmountOutRoute {
    return new protopoolmanager.SwapAmountOutRoute({
      poolId: BigIntify(this.poolId),
      tokenInDenom: this.tokenInDenom
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): SwapAmountOutRoute<U> {
    return SwapAmountOutRoute.fromProto(protopoolmanager.SwapAmountOutRoute.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): SwapAmountOutRoute<U> {
    return SwapAmountOutRoute.fromProto(protopoolmanager.SwapAmountOutRoute.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protopoolmanager.SwapAmountOutRoute, convertFunction: (item: NumberType) => U): SwapAmountOutRoute<U> {
    return new SwapAmountOutRoute<U>({
      poolId: convertFunction(BigInt(item.poolId)),
      tokenInDenom: item.tokenInDenom
    });
  }

  toBech32Addresses(prefix: string): SwapAmountOutRoute<T> {
    return new SwapAmountOutRoute<T>({
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

export class MsgJoinPool<T extends NumberType> extends BaseNumberTypeClass<MsgJoinPool<T>> implements iMsgJoinPool<T> {
  sender: string;
  poolId: T;
  shareOutAmount: string;
  tokenInMaxs: CosmosCoin<T>[];

  constructor(data: iMsgJoinPool<T>) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId;
    this.shareOutAmount = data.shareOutAmount;
    this.tokenInMaxs = data.tokenInMaxs.map((coin) => new CosmosCoin<T>(coin));
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgJoinPool<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinPool<U>;
  }

  toProto(): protogamm.MsgJoinPool {
    return new protogamm.MsgJoinPool({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      shareOutAmount: this.shareOutAmount,
      tokenInMaxs: this.tokenInMaxs.map((coin) => new CosmosCoin(coin).convert(Stringify))
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinPool<U> {
    return MsgJoinPool.fromProto(protogamm.MsgJoinPool.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinPool<U> {
    return MsgJoinPool.fromProto(protogamm.MsgJoinPool.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.MsgJoinPool, convertFunction: (item: NumberType) => U): MsgJoinPool<U> {
    return new MsgJoinPool<U>({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      shareOutAmount: item.shareOutAmount,
      tokenInMaxs: item.tokenInMaxs.map((coin) =>
        new CosmosCoin<U>({
          amount: convertFunction(BigInt(coin.amount)),
          denom: coin.denom
        }).convert(convertFunction)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgJoinPool<T> {
    return new MsgJoinPool<T>({
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

export class MsgJoinPoolResponse<T extends NumberType> extends BaseNumberTypeClass<MsgJoinPoolResponse<T>> implements iMsgJoinPoolResponse<T> {
  shareOutAmount: string;
  tokenIn: CosmosCoin<T>[];

  constructor(data: iMsgJoinPoolResponse<T>) {
    super();
    this.shareOutAmount = data.shareOutAmount;
    this.tokenIn = data.tokenIn.map((coin) => new CosmosCoin<T>(coin));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgJoinPoolResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinPoolResponse<U>;
  }

  toProto(): protogamm.MsgJoinPoolResponse {
    return new protogamm.MsgJoinPoolResponse({
      shareOutAmount: this.shareOutAmount,
      tokenIn: this.tokenIn.map((coin) => new CosmosCoin(coin).convert(Stringify))
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinPoolResponse<U> {
    return MsgJoinPoolResponse.fromProto(protogamm.MsgJoinPoolResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinPoolResponse<U> {
    return MsgJoinPoolResponse.fromProto(protogamm.MsgJoinPoolResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.MsgJoinPoolResponse, convertFunction: (item: NumberType) => U): MsgJoinPoolResponse<U> {
    return new MsgJoinPoolResponse<U>({
      shareOutAmount: item.shareOutAmount,
      tokenIn: item.tokenIn.map((coin) =>
        new CosmosCoin<U>({
          amount: convertFunction(BigInt(coin.amount)),
          denom: coin.denom
        }).convert(convertFunction)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgJoinPoolResponse<T> {
    return new MsgJoinPoolResponse<T>({
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

export class MsgExitPool<T extends NumberType> extends BaseNumberTypeClass<MsgExitPool<T>> implements iMsgExitPool<T> {
  sender: string;
  poolId: T;
  shareInAmount: string;
  tokenOutMins: CosmosCoin<T>[];

  constructor(data: iMsgExitPool<T>) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId;
    this.shareInAmount = data.shareInAmount;
    this.tokenOutMins = data.tokenOutMins.map((coin) => new CosmosCoin<T>(coin));
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgExitPool<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitPool<U>;
  }

  toProto(): protogamm.MsgExitPool {
    return new protogamm.MsgExitPool({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      shareInAmount: this.shareInAmount,
      tokenOutMins: this.tokenOutMins.map((coin) => new CosmosCoin(coin).convert(Stringify))
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitPool<U> {
    return MsgExitPool.fromProto(protogamm.MsgExitPool.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitPool<U> {
    return MsgExitPool.fromProto(protogamm.MsgExitPool.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.MsgExitPool, convertFunction: (item: NumberType) => U): MsgExitPool<U> {
    return new MsgExitPool<U>({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      shareInAmount: item.shareInAmount,
      tokenOutMins: item.tokenOutMins.map((coin) =>
        new CosmosCoin<U>({
          amount: convertFunction(BigInt(coin.amount)),
          denom: coin.denom
        }).convert(convertFunction)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgExitPool<T> {
    return new MsgExitPool<T>({
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

export class MsgExitPoolResponse<T extends NumberType> extends BaseNumberTypeClass<MsgExitPoolResponse<T>> implements iMsgExitPoolResponse<T> {
  tokenOut: CosmosCoin<T>[];

  constructor(data: iMsgExitPoolResponse<T>) {
    super();
    this.tokenOut = data.tokenOut.map((coin) => new CosmosCoin<T>(coin));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgExitPoolResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitPoolResponse<U>;
  }

  toProto(): protogamm.MsgExitPoolResponse {
    return new protogamm.MsgExitPoolResponse({
      tokenOut: this.tokenOut.map((coin) => new CosmosCoin(coin).convert(Stringify))
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitPoolResponse<U> {
    return MsgExitPoolResponse.fromProto(protogamm.MsgExitPoolResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitPoolResponse<U> {
    return MsgExitPoolResponse.fromProto(protogamm.MsgExitPoolResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.MsgExitPoolResponse, convertFunction: (item: NumberType) => U): MsgExitPoolResponse<U> {
    return new MsgExitPoolResponse<U>({
      tokenOut: item.tokenOut.map((coin) =>
        new CosmosCoin<U>({
          amount: convertFunction(BigInt(coin.amount)),
          denom: coin.denom
        }).convert(convertFunction)
      )
    });
  }

  toBech32Addresses(prefix: string): MsgExitPoolResponse<T> {
    return new MsgExitPoolResponse<T>({
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

export class MsgSwapExactAmountIn<T extends NumberType> extends BaseNumberTypeClass<MsgSwapExactAmountIn<T>> implements iMsgSwapExactAmountIn<T> {
  sender: string;
  routes: SwapAmountInRoute<T>[];
  tokenIn: CosmosCoin<T>;
  tokenOutMinAmount: string;

  constructor(data: iMsgSwapExactAmountIn<T>) {
    super();
    this.sender = data.sender;
    this.routes = data.routes.map((route) => new SwapAmountInRoute(route));
    this.tokenIn = new CosmosCoin<T>(data.tokenIn);
    this.tokenOutMinAmount = data.tokenOutMinAmount;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgSwapExactAmountIn<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountIn<U>;
  }

  toProto(): protogamm.MsgSwapExactAmountIn {
    return new protogamm.MsgSwapExactAmountIn({
      sender: this.sender,
      routes: this.routes.map((route) => new SwapAmountInRoute(route).toProto()),
      tokenIn: new CosmosCoin(this.tokenIn).convert(Stringify),
      tokenOutMinAmount: this.tokenOutMinAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSwapExactAmountIn<U> {
    return MsgSwapExactAmountIn.fromProto(protogamm.MsgSwapExactAmountIn.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSwapExactAmountIn<U> {
    return MsgSwapExactAmountIn.fromProto(protogamm.MsgSwapExactAmountIn.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.MsgSwapExactAmountIn, convertFunction: (item: NumberType) => U): MsgSwapExactAmountIn<U> {
    return new MsgSwapExactAmountIn<U>({
      sender: item.sender,
      routes: item.routes.map((route) => SwapAmountInRoute.fromProto(route, convertFunction)),
      tokenIn: new CosmosCoin<U>({
        amount: convertFunction(BigInt(item.tokenIn!.amount)),
        denom: item.tokenIn!.denom
      }).convert(convertFunction),
      tokenOutMinAmount: item.tokenOutMinAmount
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountIn<T> {
    return new MsgSwapExactAmountIn<T>({
      sender: getConvertFunctionFromPrefix(prefix)(this.sender),
      routes: this.routes,
      tokenIn: this.tokenIn,
      tokenOutMinAmount: this.tokenOutMinAmount
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

export class MsgSwapExactAmountInResponse<T extends NumberType>
  extends BaseNumberTypeClass<MsgSwapExactAmountInResponse<T>>
  implements iMsgSwapExactAmountInResponse<T>
{
  tokenOutAmount: string;

  constructor(data: iMsgSwapExactAmountInResponse<T>) {
    super();
    this.tokenOutAmount = data.tokenOutAmount;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgSwapExactAmountInResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountInResponse<U>;
  }

  toProto(): protogamm.MsgSwapExactAmountInResponse {
    return new protogamm.MsgSwapExactAmountInResponse({
      tokenOutAmount: this.tokenOutAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSwapExactAmountInResponse<U> {
    return MsgSwapExactAmountInResponse.fromProto(protogamm.MsgSwapExactAmountInResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSwapExactAmountInResponse<U> {
    return MsgSwapExactAmountInResponse.fromProto(protogamm.MsgSwapExactAmountInResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgSwapExactAmountInResponse,
    convertFunction: (item: NumberType) => U
  ): MsgSwapExactAmountInResponse<U> {
    return new MsgSwapExactAmountInResponse<U>({
      tokenOutAmount: item.tokenOutAmount
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountInResponse<T> {
    return new MsgSwapExactAmountInResponse<T>({
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

export class MsgSwapExactAmountOut<T extends NumberType> extends BaseNumberTypeClass<MsgSwapExactAmountOut<T>> implements iMsgSwapExactAmountOut<T> {
  sender: string;
  routes: SwapAmountOutRoute<T>[];
  tokenInMaxAmount: string;
  tokenOut: CosmosCoin<T>;

  constructor(data: iMsgSwapExactAmountOut<T>) {
    super();
    this.sender = data.sender;
    this.routes = data.routes.map((route) => new SwapAmountOutRoute(route));
    this.tokenInMaxAmount = data.tokenInMaxAmount;
    this.tokenOut = new CosmosCoin<T>(data.tokenOut);
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgSwapExactAmountOut<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountOut<U>;
  }

  toProto(): protogamm.MsgSwapExactAmountOut {
    return new protogamm.MsgSwapExactAmountOut({
      sender: this.sender,
      routes: this.routes.map((route) => new SwapAmountOutRoute(route).toProto()),
      tokenInMaxAmount: this.tokenInMaxAmount,
      tokenOut: new CosmosCoin(this.tokenOut).convert(Stringify)
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSwapExactAmountOut<U> {
    return MsgSwapExactAmountOut.fromProto(protogamm.MsgSwapExactAmountOut.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSwapExactAmountOut<U> {
    return MsgSwapExactAmountOut.fromProto(protogamm.MsgSwapExactAmountOut.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.MsgSwapExactAmountOut, convertFunction: (item: NumberType) => U): MsgSwapExactAmountOut<U> {
    return new MsgSwapExactAmountOut<U>({
      sender: item.sender,
      routes: item.routes.map((route) => SwapAmountOutRoute.fromProto(route, convertFunction)),
      tokenInMaxAmount: item.tokenInMaxAmount,
      tokenOut: new CosmosCoin<U>({
        amount: convertFunction(BigInt(item.tokenOut!.amount)),
        denom: item.tokenOut!.denom
      }).convert(convertFunction)
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountOut<T> {
    return new MsgSwapExactAmountOut<T>({
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

export class MsgSwapExactAmountOutResponse<T extends NumberType>
  extends BaseNumberTypeClass<MsgSwapExactAmountOutResponse<T>>
  implements iMsgSwapExactAmountOutResponse<T>
{
  tokenInAmount: string;

  constructor(data: iMsgSwapExactAmountOutResponse<T>) {
    super();
    this.tokenInAmount = data.tokenInAmount;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgSwapExactAmountOutResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgSwapExactAmountOutResponse<U>;
  }

  toProto(): protogamm.MsgSwapExactAmountOutResponse {
    return new protogamm.MsgSwapExactAmountOutResponse({
      tokenInAmount: this.tokenInAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSwapExactAmountOutResponse<U> {
    return MsgSwapExactAmountOutResponse.fromProto(protogamm.MsgSwapExactAmountOutResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSwapExactAmountOutResponse<U> {
    return MsgSwapExactAmountOutResponse.fromProto(protogamm.MsgSwapExactAmountOutResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgSwapExactAmountOutResponse,
    convertFunction: (item: NumberType) => U
  ): MsgSwapExactAmountOutResponse<U> {
    return new MsgSwapExactAmountOutResponse<U>({
      tokenInAmount: item.tokenInAmount
    });
  }

  toBech32Addresses(prefix: string): MsgSwapExactAmountOutResponse<T> {
    return new MsgSwapExactAmountOutResponse<T>({
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

export class MsgJoinSwapExternAmountIn<T extends NumberType>
  extends BaseNumberTypeClass<MsgJoinSwapExternAmountIn<T>>
  implements iMsgJoinSwapExternAmountIn<T>
{
  sender: string;
  poolId: T;
  tokenIn: CosmosCoin<T>;
  shareOutMinAmount: string;

  constructor(data: iMsgJoinSwapExternAmountIn<T>) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId as T;
    this.tokenIn = new CosmosCoin<T>(data.tokenIn);
    this.shareOutMinAmount = data.shareOutMinAmount;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgJoinSwapExternAmountIn<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinSwapExternAmountIn<U>;
  }

  toProto(): protogamm.MsgJoinSwapExternAmountIn {
    return new protogamm.MsgJoinSwapExternAmountIn({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      tokenIn: new CosmosCoin(this.tokenIn).convert(Stringify),
      shareOutMinAmount: this.shareOutMinAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinSwapExternAmountIn<U> {
    return MsgJoinSwapExternAmountIn.fromProto(protogamm.MsgJoinSwapExternAmountIn.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinSwapExternAmountIn<U> {
    return MsgJoinSwapExternAmountIn.fromProto(protogamm.MsgJoinSwapExternAmountIn.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgJoinSwapExternAmountIn,
    convertFunction: (item: NumberType) => U
  ): MsgJoinSwapExternAmountIn<U> {
    return new MsgJoinSwapExternAmountIn<U>({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      tokenIn: new CosmosCoin<U>({
        amount: convertFunction(BigInt(item.tokenIn!.amount)),
        denom: item.tokenIn!.denom
      }).convert(convertFunction),
      shareOutMinAmount: item.shareOutMinAmount
    });
  }

  toBech32Addresses(prefix: string): MsgJoinSwapExternAmountIn<T> {
    return new MsgJoinSwapExternAmountIn<T>({
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

export class MsgJoinSwapExternAmountInResponse<T extends NumberType>
  extends BaseNumberTypeClass<MsgJoinSwapExternAmountInResponse<T>>
  implements iMsgJoinSwapExternAmountInResponse<T>
{
  shareOutAmount: string;

  constructor(data: iMsgJoinSwapExternAmountInResponse<T>) {
    super();
    this.shareOutAmount = data.shareOutAmount;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgJoinSwapExternAmountInResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinSwapExternAmountInResponse<U>;
  }

  toProto(): protogamm.MsgJoinSwapExternAmountInResponse {
    return new protogamm.MsgJoinSwapExternAmountInResponse({
      shareOutAmount: this.shareOutAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinSwapExternAmountInResponse<U> {
    return MsgJoinSwapExternAmountInResponse.fromProto(protogamm.MsgJoinSwapExternAmountInResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinSwapExternAmountInResponse<U> {
    return MsgJoinSwapExternAmountInResponse.fromProto(
      protogamm.MsgJoinSwapExternAmountInResponse.fromJsonString(jsonString, options),
      convertFunction
    );
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgJoinSwapExternAmountInResponse,
    convertFunction: (item: NumberType) => U
  ): MsgJoinSwapExternAmountInResponse<U> {
    return new MsgJoinSwapExternAmountInResponse<U>({
      shareOutAmount: item.shareOutAmount
    });
  }

  toBech32Addresses(prefix: string): MsgJoinSwapExternAmountInResponse<T> {
    return new MsgJoinSwapExternAmountInResponse<T>({
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

export class MsgJoinSwapShareAmountOut<T extends NumberType>
  extends BaseNumberTypeClass<MsgJoinSwapShareAmountOut<T>>
  implements iMsgJoinSwapShareAmountOut<T>
{
  sender: string;
  poolId: T;
  tokenInDenom: string;
  shareOutAmount: string;
  tokenInMaxAmount: string;

  constructor(data: iMsgJoinSwapShareAmountOut<T>) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId as T;
    this.tokenInDenom = data.tokenInDenom;
    this.shareOutAmount = data.shareOutAmount;
    this.tokenInMaxAmount = data.tokenInMaxAmount;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgJoinSwapShareAmountOut<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinSwapShareAmountOut<U>;
  }

  toProto(): protogamm.MsgJoinSwapShareAmountOut {
    return new protogamm.MsgJoinSwapShareAmountOut({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      tokenInDenom: this.tokenInDenom,
      shareOutAmount: this.shareOutAmount,
      tokenInMaxAmount: this.tokenInMaxAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinSwapShareAmountOut<U> {
    return MsgJoinSwapShareAmountOut.fromProto(protogamm.MsgJoinSwapShareAmountOut.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinSwapShareAmountOut<U> {
    return MsgJoinSwapShareAmountOut.fromProto(protogamm.MsgJoinSwapShareAmountOut.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgJoinSwapShareAmountOut,
    convertFunction: (item: NumberType) => U
  ): MsgJoinSwapShareAmountOut<U> {
    return new MsgJoinSwapShareAmountOut<U>({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      tokenInDenom: item.tokenInDenom,
      shareOutAmount: item.shareOutAmount,
      tokenInMaxAmount: item.tokenInMaxAmount
    });
  }

  toBech32Addresses(prefix: string): MsgJoinSwapShareAmountOut<T> {
    return new MsgJoinSwapShareAmountOut<T>({
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

export class MsgJoinSwapShareAmountOutResponse<T extends NumberType>
  extends BaseNumberTypeClass<MsgJoinSwapShareAmountOutResponse<T>>
  implements iMsgJoinSwapShareAmountOutResponse<T>
{
  tokenInAmount: string;

  constructor(data: iMsgJoinSwapShareAmountOutResponse<T>) {
    super();
    this.tokenInAmount = data.tokenInAmount;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgJoinSwapShareAmountOutResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgJoinSwapShareAmountOutResponse<U>;
  }

  toProto(): protogamm.MsgJoinSwapShareAmountOutResponse {
    return new protogamm.MsgJoinSwapShareAmountOutResponse({
      tokenInAmount: this.tokenInAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinSwapShareAmountOutResponse<U> {
    return MsgJoinSwapShareAmountOutResponse.fromProto(protogamm.MsgJoinSwapShareAmountOutResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgJoinSwapShareAmountOutResponse<U> {
    return MsgJoinSwapShareAmountOutResponse.fromProto(
      protogamm.MsgJoinSwapShareAmountOutResponse.fromJsonString(jsonString, options),
      convertFunction
    );
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgJoinSwapShareAmountOutResponse,
    convertFunction: (item: NumberType) => U
  ): MsgJoinSwapShareAmountOutResponse<U> {
    return new MsgJoinSwapShareAmountOutResponse<U>({
      tokenInAmount: item.tokenInAmount
    });
  }

  toBech32Addresses(prefix: string): MsgJoinSwapShareAmountOutResponse<T> {
    return new MsgJoinSwapShareAmountOutResponse<T>({
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

export class MsgExitSwapShareAmountIn<T extends NumberType>
  extends BaseNumberTypeClass<MsgExitSwapShareAmountIn<T>>
  implements iMsgExitSwapShareAmountIn<T>
{
  sender: string;
  poolId: T;
  tokenOutDenom: string;
  shareInAmount: string;
  tokenOutMinAmount: string;

  constructor(data: iMsgExitSwapShareAmountIn<T>) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId as T;
    this.tokenOutDenom = data.tokenOutDenom;
    this.shareInAmount = data.shareInAmount;
    this.tokenOutMinAmount = data.tokenOutMinAmount;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgExitSwapShareAmountIn<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitSwapShareAmountIn<U>;
  }

  toProto(): protogamm.MsgExitSwapShareAmountIn {
    return new protogamm.MsgExitSwapShareAmountIn({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      tokenOutDenom: this.tokenOutDenom,
      shareInAmount: this.shareInAmount,
      tokenOutMinAmount: this.tokenOutMinAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitSwapShareAmountIn<U> {
    return MsgExitSwapShareAmountIn.fromProto(protogamm.MsgExitSwapShareAmountIn.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitSwapShareAmountIn<U> {
    return MsgExitSwapShareAmountIn.fromProto(protogamm.MsgExitSwapShareAmountIn.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgExitSwapShareAmountIn,
    convertFunction: (item: NumberType) => U
  ): MsgExitSwapShareAmountIn<U> {
    return new MsgExitSwapShareAmountIn<U>({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      tokenOutDenom: item.tokenOutDenom,
      shareInAmount: item.shareInAmount,
      tokenOutMinAmount: item.tokenOutMinAmount
    });
  }

  toBech32Addresses(prefix: string): MsgExitSwapShareAmountIn<T> {
    return new MsgExitSwapShareAmountIn<T>({
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

export class MsgExitSwapShareAmountInResponse<T extends NumberType>
  extends BaseNumberTypeClass<MsgExitSwapShareAmountInResponse<T>>
  implements iMsgExitSwapShareAmountInResponse<T>
{
  tokenOutAmount: string;

  constructor(data: iMsgExitSwapShareAmountInResponse<T>) {
    super();
    this.tokenOutAmount = data.tokenOutAmount;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgExitSwapShareAmountInResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitSwapShareAmountInResponse<U>;
  }

  toProto(): protogamm.MsgExitSwapShareAmountInResponse {
    return new protogamm.MsgExitSwapShareAmountInResponse({
      tokenOutAmount: this.tokenOutAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitSwapShareAmountInResponse<U> {
    return MsgExitSwapShareAmountInResponse.fromProto(protogamm.MsgExitSwapShareAmountInResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitSwapShareAmountInResponse<U> {
    return MsgExitSwapShareAmountInResponse.fromProto(
      protogamm.MsgExitSwapShareAmountInResponse.fromJsonString(jsonString, options),
      convertFunction
    );
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgExitSwapShareAmountInResponse,
    convertFunction: (item: NumberType) => U
  ): MsgExitSwapShareAmountInResponse<U> {
    return new MsgExitSwapShareAmountInResponse<U>({
      tokenOutAmount: item.tokenOutAmount
    });
  }

  toBech32Addresses(prefix: string): MsgExitSwapShareAmountInResponse<T> {
    return new MsgExitSwapShareAmountInResponse<T>({
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

export class MsgExitSwapExternAmountOut<T extends NumberType>
  extends BaseNumberTypeClass<MsgExitSwapExternAmountOut<T>>
  implements iMsgExitSwapExternAmountOut<T>
{
  sender: string;
  poolId: T;
  tokenOut: CosmosCoin<T>;
  shareInMaxAmount: string;

  constructor(data: iMsgExitSwapExternAmountOut<T>) {
    super();
    this.sender = data.sender;
    this.poolId = data.poolId as T;
    this.tokenOut = new CosmosCoin<T>(data.tokenOut);
    this.shareInMaxAmount = data.shareInMaxAmount;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgExitSwapExternAmountOut<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitSwapExternAmountOut<U>;
  }

  toProto(): protogamm.MsgExitSwapExternAmountOut {
    return new protogamm.MsgExitSwapExternAmountOut({
      sender: this.sender,
      poolId: BigIntify(this.poolId),
      tokenOut: new CosmosCoin(this.tokenOut).convert(Stringify),
      shareInMaxAmount: this.shareInMaxAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitSwapExternAmountOut<U> {
    return MsgExitSwapExternAmountOut.fromProto(protogamm.MsgExitSwapExternAmountOut.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitSwapExternAmountOut<U> {
    return MsgExitSwapExternAmountOut.fromProto(protogamm.MsgExitSwapExternAmountOut.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgExitSwapExternAmountOut,
    convertFunction: (item: NumberType) => U
  ): MsgExitSwapExternAmountOut<U> {
    return new MsgExitSwapExternAmountOut<U>({
      sender: item.sender,
      poolId: convertFunction(BigInt(item.poolId)),
      tokenOut: new CosmosCoin<U>({
        amount: convertFunction(BigInt(item.tokenOut!.amount)),
        denom: item.tokenOut!.denom
      }).convert(convertFunction),
      shareInMaxAmount: item.shareInMaxAmount
    });
  }

  toBech32Addresses(prefix: string): MsgExitSwapExternAmountOut<T> {
    return new MsgExitSwapExternAmountOut<T>({
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

export class MsgExitSwapExternAmountOutResponse<T extends NumberType>
  extends BaseNumberTypeClass<MsgExitSwapExternAmountOutResponse<T>>
  implements iMsgExitSwapExternAmountOutResponse<T>
{
  shareInAmount: string;

  constructor(data: iMsgExitSwapExternAmountOutResponse<T>) {
    super();
    this.shareInAmount = data.shareInAmount;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgExitSwapExternAmountOutResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgExitSwapExternAmountOutResponse<U>;
  }

  toProto(): protogamm.MsgExitSwapExternAmountOutResponse {
    return new protogamm.MsgExitSwapExternAmountOutResponse({
      shareInAmount: this.shareInAmount
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitSwapExternAmountOutResponse<U> {
    return MsgExitSwapExternAmountOutResponse.fromProto(protogamm.MsgExitSwapExternAmountOutResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgExitSwapExternAmountOutResponse<U> {
    return MsgExitSwapExternAmountOutResponse.fromProto(
      protogamm.MsgExitSwapExternAmountOutResponse.fromJsonString(jsonString, options),
      convertFunction
    );
  }

  static fromProto<U extends NumberType>(
    item: protogamm.MsgExitSwapExternAmountOutResponse,
    convertFunction: (item: NumberType) => U
  ): MsgExitSwapExternAmountOutResponse<U> {
    return new MsgExitSwapExternAmountOutResponse<U>({
      shareInAmount: item.shareInAmount
    });
  }

  toBech32Addresses(prefix: string): MsgExitSwapExternAmountOutResponse<T> {
    return new MsgExitSwapExternAmountOutResponse<T>({
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

export class MsgCreateBalancerPool<T extends NumberType> extends BaseNumberTypeClass<MsgCreateBalancerPool<T>> implements iMsgCreateBalancerPool<T> {
  sender: string;
  poolParams: PoolParams<T>;
  poolAssets: PoolAsset<T>[];

  constructor(data: iMsgCreateBalancerPool<T>) {
    super();
    this.sender = data.sender;
    this.poolParams = new PoolParams<T>(data.poolParams);
    this.poolAssets = data.poolAssets.map((asset) => new PoolAsset<T>(asset));
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgCreateBalancerPool<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgCreateBalancerPool<U>;
  }

  toProto(): protobalancer.MsgCreateBalancerPool {
    return new protobalancer.MsgCreateBalancerPool({
      sender: this.sender,
      poolParams: new PoolParams(this.poolParams).toProto(),
      poolAssets: this.poolAssets.map((asset) => new PoolAsset(asset).toProto())
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgCreateBalancerPool<U> {
    return MsgCreateBalancerPool.fromProto(protobalancer.MsgCreateBalancerPool.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgCreateBalancerPool<U> {
    return MsgCreateBalancerPool.fromProto(protobalancer.MsgCreateBalancerPool.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protobalancer.MsgCreateBalancerPool,
    convertFunction: (item: NumberType) => U
  ): MsgCreateBalancerPool<U> {
    return new MsgCreateBalancerPool<U>({
      sender: item.sender,
      poolParams: item.poolParams
        ? PoolParams.fromProto(item.poolParams, convertFunction)
        : {
            swapFee: 0,
            exitFee: 0
          },
      poolAssets: item.poolAssets.map((asset) => PoolAsset.fromProto(asset, convertFunction))
    });
  }

  toBech32Addresses(prefix: string): MsgCreateBalancerPool<T> {
    return new MsgCreateBalancerPool<T>({
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

export class MsgCreateBalancerPoolResponse<T extends NumberType>
  extends BaseNumberTypeClass<MsgCreateBalancerPoolResponse<T>>
  implements iMsgCreateBalancerPoolResponse<T>
{
  poolId: T;

  constructor(data: iMsgCreateBalancerPoolResponse<T>) {
    super();
    this.poolId = data.poolId as T;
  }

  getNumberFieldNames(): string[] {
    return ['poolId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgCreateBalancerPoolResponse<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgCreateBalancerPoolResponse<U>;
  }

  toProto(): protobalancer.MsgCreateBalancerPoolResponse {
    return new protobalancer.MsgCreateBalancerPoolResponse({
      poolId: BigIntify(this.poolId)
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgCreateBalancerPoolResponse<U> {
    return MsgCreateBalancerPoolResponse.fromProto(protobalancer.MsgCreateBalancerPoolResponse.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgCreateBalancerPoolResponse<U> {
    return MsgCreateBalancerPoolResponse.fromProto(protobalancer.MsgCreateBalancerPoolResponse.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    item: protobalancer.MsgCreateBalancerPoolResponse,
    convertFunction: (item: NumberType) => U
  ): MsgCreateBalancerPoolResponse<U> {
    return new MsgCreateBalancerPoolResponse<U>({
      poolId: convertFunction(BigInt(item.poolId))
    });
  }

  toBech32Addresses(prefix: string): MsgCreateBalancerPoolResponse<T> {
    return new MsgCreateBalancerPoolResponse<T>({
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
