import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as prototokenization from '@/proto/tokenization/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgDeleteDynamicStore } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgDeleteDynamicStore is used to delete a dynamic store.
 *
 * @category Transactions
 */
export class MsgDeleteDynamicStore<T extends NumberType> extends CustomTypeClass<MsgDeleteDynamicStore<T>> implements iMsgDeleteDynamicStore<T> {
  creator: BitBadgesAddress;
  storeId: T;

  constructor(msg: iMsgDeleteDynamicStore<T>) {
    super();
    this.creator = msg.creator;
    this.storeId = msg.storeId;
  }

  toProto(): prototokenization.MsgDeleteDynamicStore {
    return new prototokenization.MsgDeleteDynamicStore({
      creator: this.creator,
      storeId: this.storeId.toString()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgDeleteDynamicStore<NumberType> {
    return MsgDeleteDynamicStore.fromProto(prototokenization.MsgDeleteDynamicStore.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgDeleteDynamicStore<NumberType> {
    return MsgDeleteDynamicStore.fromProto(prototokenization.MsgDeleteDynamicStore.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: prototokenization.MsgDeleteDynamicStore): MsgDeleteDynamicStore<NumberType> {
    return new MsgDeleteDynamicStore({
      creator: protoMsg.creator,
      storeId: protoMsg.storeId
    });
  }

  toBech32Addresses(prefix: string): MsgDeleteDynamicStore<T> {
    return new MsgDeleteDynamicStore({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      storeId: this.storeId
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"deleteDynamicStoreMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
