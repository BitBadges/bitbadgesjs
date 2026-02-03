import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';

import * as protogamm from '@/proto/gamm/poolmodels/balancer/balancerPool_pb.js';
import type { iPool, iPoolAsset, iPoolParams } from './interfaces.js';
import { BigIntify, NumberType, Stringify } from '@/common/string-numbers.js';
import { CosmosCoin, iCosmosCoin } from '@/core/coin.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';

export class PoolParams extends BaseNumberTypeClass<PoolParams> implements iPoolParams {
  swapFee: string;
  exitFee: string;

  constructor(data: iPoolParams) {
    super();
    this.swapFee = data.swapFee;
    this.exitFee = data.exitFee;
  }

  getNumberFieldNames(): string[] {
    return []; // These should stay numbers, not converted to strings
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PoolParams {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PoolParams;
  }

  toProto(): protogamm.PoolParams {
    return new protogamm.PoolParams({
      ...this.convert(Stringify),
      swapFee: this.swapFee.toString(),
      exitFee: this.exitFee.toString()
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): PoolParams {
    return PoolParams.fromProto(protogamm.PoolParams.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): PoolParams {
    return PoolParams.fromProto(protogamm.PoolParams.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.PoolParams, convertFunction: (item: string | number) => U): PoolParams {
    return new PoolParams({
      swapFee: item.swapFee,
      exitFee: item.exitFee
    });
  }
}

export class PoolAsset extends BaseNumberTypeClass<PoolAsset> implements iPoolAsset {
  token: CosmosCoin;
  weight: string | number;

  constructor(data: iPoolAsset) {
    super();
    this.token = new CosmosCoin(data.token);
    this.weight = data.weight;
  }

  getNumberFieldNames(): string[] {
    return ['weight'];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PoolAsset {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as PoolAsset;
  }

  toProto(): protogamm.PoolAsset {
    return new protogamm.PoolAsset(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): PoolAsset {
    return PoolAsset.fromProto(protogamm.PoolAsset.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): PoolAsset {
    return PoolAsset.fromProto(protogamm.PoolAsset.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.PoolAsset, convertFunction: (item: string | number) => U): PoolAsset {
    return new PoolAsset({
      token: item.token
        ? new CosmosCoin({
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

export class Pool extends BaseNumberTypeClass<Pool> implements iPool {
  address: string;
  id: string | number;
  poolParams: iPoolParams;
  totalShares: iCosmosCoin;
  poolAssets: iPoolAsset[];
  totalWeight: string | number;

  constructor(data: iPool) {
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

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): Pool {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as Pool;
  }

  toProto(): protogamm.Pool {
    return new protogamm.Pool({
      ...this.convert(Stringify),
      id: BigIntify(this.id),
      poolParams: this.poolParams ? new PoolParams(this.poolParams).toProto() : undefined
    });
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): Pool {
    return Pool.fromProto(protogamm.Pool.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): Pool {
    return Pool.fromProto(protogamm.Pool.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto(item: protogamm.Pool, convertFunction: (item: string | number) => U): Pool {
    return new Pool({
      address: item.address,
      id: convertFunction(BigInt(item.id)),
      poolParams: item.poolParams
        ? PoolParams.fromProto(item.poolParams, convertFunction)
        : {
            swapFee: '0',
            exitFee: '0'
          },
      totalShares: item.totalShares
        ? new CosmosCoin({
            amount: convertFunction(BigInt(item.totalShares.amount)),
            denom: item.totalShares.denom
          }).convert(convertFunction)
        : new CosmosCoin({
            amount: convertFunction(0n),
            denom: ''
          }).convert(convertFunction),
      poolAssets: item.poolAssets.map((asset) => PoolAsset.fromProto(asset, convertFunction)),
      totalWeight: convertFunction(BigInt(item.totalWeight))
    });
  }
}
