import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgCreateDynamicStore } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgCreateDynamicStore is used to create a new dynamic store.
 *
 * @category Transactions
 */
export class MsgCreateDynamicStore extends CustomTypeClass<MsgCreateDynamicStore> implements iMsgCreateDynamicStore {
  creator: BitBadgesAddress;

  constructor(msg: iMsgCreateDynamicStore) {
    super();
    this.creator = msg.creator;
  }

  toProto(): badges.MsgCreateDynamicStore {
    return new badges.MsgCreateDynamicStore({ creator: this.creator });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgCreateDynamicStore {
    return MsgCreateDynamicStore.fromProto(badges.MsgCreateDynamicStore.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgCreateDynamicStore {
    return MsgCreateDynamicStore.fromProto(badges.MsgCreateDynamicStore.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgCreateDynamicStore): MsgCreateDynamicStore {
    return new MsgCreateDynamicStore({ creator: protoMsg.creator });
  }

  toBech32Addresses(prefix: string): MsgCreateDynamicStore {
    return new MsgCreateDynamicStore({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator)
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"createDynamicStoreMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
