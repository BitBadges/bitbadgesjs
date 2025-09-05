import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';

import * as protogamm from '@/proto/gamm/poolmodels/balancer/balancerPool_pb.js';
import type { iPool, iPoolAsset, iPoolParams } from './interfaces.js';
import { BigIntify, NumberType, Stringify } from '@/common/string-numbers.js';
import { CosmosCoin, iCosmosCoin } from '@/core/coin.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';

export class PoolParams<T extends NumberType> extends BaseNumberTypeClass<PoolParams<T>> implements iPoolParams<T> {
  swapFee: string;
  exitFee: string;

  constructor(data: iPoolParams<T>) {
    super();
    this.swapFee = data.swapFee;
    this.exitFee = data.exitFee;
  }

  getNumberFieldNames(): string[] {
    return []; // These should stay numbers, not converted to strings
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PoolParams<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PoolParams<U>;
  }

  toProto(): protogamm.PoolParams {
    return new protogamm.PoolParams({
      ...this.convert(Stringify),
      swapFee: this.swapFee.toString(),
      exitFee: this.exitFee.toString()
    });
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PoolParams<U> {
    return PoolParams.fromProto(protogamm.PoolParams.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PoolParams<U> {
    return PoolParams.fromProto(protogamm.PoolParams.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.PoolParams, convertFunction: (item: NumberType) => U): PoolParams<U> {
    return new PoolParams<U>({
      swapFee: item.swapFee,
      exitFee: item.exitFee
    });
  }
}

export class PoolAsset<T extends NumberType> extends BaseNumberTypeClass<PoolAsset<T>> implements iPoolAsset<T> {
  token: CosmosCoin<T>;
  weight: T;

  constructor(data: iPoolAsset<T>) {
    super();
    this.token = new CosmosCoin<T>(data.token);
    this.weight = data.weight;
  }

  getNumberFieldNames(): string[] {
    return ['weight'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): PoolAsset<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PoolAsset<U>;
  }

  toProto(): protogamm.PoolAsset {
    return new protogamm.PoolAsset(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PoolAsset<U> {
    return PoolAsset.fromProto(protogamm.PoolAsset.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): PoolAsset<U> {
    return PoolAsset.fromProto(protogamm.PoolAsset.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.PoolAsset, convertFunction: (item: NumberType) => U): PoolAsset<U> {
    return new PoolAsset<U>({
      token: item.token
        ? new CosmosCoin<U>({
            amount: convertFunction(BigInt(item.token.amount)),
            denom: item.token.denom
          }).convert(convertFunction)
        : new CosmosCoin({
            amount: 0n,
            denom: ''
          }).convert(convertFunction),
      weight: convertFunction(BigInt(item.weight))
    });
  }
}

export class Pool<T extends NumberType> extends BaseNumberTypeClass<Pool<T>> implements iPool<T> {
  address: string;
  id: T;
  poolParams: iPoolParams<T>;
  totalShares: iCosmosCoin<T>;
  poolAssets: iPoolAsset<T>[];
  totalWeight: T;

  constructor(data: iPool<T>) {
    super();
    this.address = data.address;
    this.id = data.id;
    this.poolParams = data.poolParams;
    this.totalShares = data.totalShares;
    this.poolAssets = data.poolAssets;
    this.totalWeight = data.totalWeight;
  }

  getNumberFieldNames(): string[] {
    return ['id', 'totalWeight'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): Pool<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Pool<U>;
  }

  toProto(): protogamm.Pool {
    return new protogamm.Pool({
      ...this.convert(Stringify),
      id: BigIntify(this.id),
      poolParams: this.poolParams ? new PoolParams(this.poolParams).toProto() : undefined
    });
  }

  static fromJson<U extends NumberType>(jsonValue: JsonValue, convertFunction: (item: NumberType) => U, options?: Partial<JsonReadOptions>): Pool<U> {
    return Pool.fromProto(protogamm.Pool.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): Pool<U> {
    return Pool.fromProto(protogamm.Pool.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(item: protogamm.Pool, convertFunction: (item: NumberType) => U): Pool<U> {
    return new Pool<U>({
      address: item.address,
      id: convertFunction(BigInt(item.id)),
      poolParams: item.poolParams
        ? PoolParams.fromProto(item.poolParams, convertFunction)
        : {
            swapFee: '0',
            exitFee: '0'
          },
      totalShares: item.totalShares
        ? new CosmosCoin<U>({
            amount: convertFunction(BigInt(item.totalShares.amount)),
            denom: item.totalShares.denom
          }).convert(convertFunction)
        : new CosmosCoin<U>({
            amount: convertFunction(0n),
            denom: ''
          }).convert(convertFunction),
      poolAssets: item.poolAssets.map((asset) => PoolAsset.fromProto(asset, convertFunction)),
      totalWeight: convertFunction(BigInt(item.totalWeight))
    });
  }
}
