import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgIncrementStoreValue } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgIncrementStoreValue is used to increment a usage count for a specific address in a dynamic store.
 *
 * @category Transactions
 */
export class MsgIncrementStoreValue<T extends NumberType> extends CustomTypeClass<MsgIncrementStoreValue<T>> implements iMsgIncrementStoreValue<T> {
  creator: BitBadgesAddress;
  storeId: T;
  address: BitBadgesAddress;
  amount: T;

  constructor(msg: iMsgIncrementStoreValue<T>) {
    super();
    this.creator = msg.creator;
    this.storeId = msg.storeId;
    this.address = msg.address;
    this.amount = msg.amount;
  }

  toProto(): protobadges.MsgIncrementStoreValue {
    return new protobadges.MsgIncrementStoreValue({
      creator: this.creator,
      storeId: this.storeId.toString(),
      address: this.address,
      amount: this.amount.toString()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgIncrementStoreValue<NumberType> {
    return MsgIncrementStoreValue.fromProto(protobadges.MsgIncrementStoreValue.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgIncrementStoreValue<NumberType> {
    return MsgIncrementStoreValue.fromProto(protobadges.MsgIncrementStoreValue.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgIncrementStoreValue): MsgIncrementStoreValue<NumberType> {
    return new MsgIncrementStoreValue({
      creator: protoMsg.creator,
      storeId: protoMsg.storeId,
      address: protoMsg.address,
      amount: protoMsg.amount
    });
  }

  toBech32Addresses(prefix: string): MsgIncrementStoreValue<T> {
    return new MsgIncrementStoreValue({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      storeId: this.storeId,
      address: getConvertFunctionFromPrefix(prefix)(this.address),
      amount: this.amount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"incrementStoreValueMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
