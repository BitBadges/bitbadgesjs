import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgUpdateDynamicStore } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgUpdateDynamicStore is used to update an existing dynamic store.
 *
 * @category Transactions
 */
export class MsgUpdateDynamicStore<T extends NumberType> extends CustomTypeClass<MsgUpdateDynamicStore<T>> implements iMsgUpdateDynamicStore<T> {
  creator: BitBadgesAddress;
  storeId: T;

  constructor(msg: iMsgUpdateDynamicStore<T>) {
    super();
    this.creator = msg.creator;
    this.storeId = msg.storeId;
  }

  toProto(): badges.MsgUpdateDynamicStore {
    return new badges.MsgUpdateDynamicStore({
      creator: this.creator,
      storeId: this.storeId.toString()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgUpdateDynamicStore<NumberType> {
    return MsgUpdateDynamicStore.fromProto(badges.MsgUpdateDynamicStore.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgUpdateDynamicStore<NumberType> {
    return MsgUpdateDynamicStore.fromProto(badges.MsgUpdateDynamicStore.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgUpdateDynamicStore): MsgUpdateDynamicStore<NumberType> {
    return new MsgUpdateDynamicStore({
      creator: protoMsg.creator,
      storeId: protoMsg.storeId
    });
  }

  toBech32Addresses(prefix: string): MsgUpdateDynamicStore<T> {
    return new MsgUpdateDynamicStore({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      storeId: this.storeId
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"updateDynamicStoreMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
