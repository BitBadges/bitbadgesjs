import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgCreateDynamicStore } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgCreateDynamicStore is used to create a new dynamic store.
 *
 * @category Transactions
 */
export class MsgCreateDynamicStore extends CustomTypeClass<MsgCreateDynamicStore> implements iMsgCreateDynamicStore {
  creator: BitBadgesAddress;
  defaultValue: boolean;
  uri?: string;
  customData?: string;

  constructor(msg: iMsgCreateDynamicStore) {
    super();
    this.creator = msg.creator;
    this.defaultValue = msg.defaultValue;
    this.uri = msg.uri;
    this.customData = msg.customData;
  }

  toProto(): protobadges.MsgCreateDynamicStore {
    return new protobadges.MsgCreateDynamicStore({
      creator: this.creator,
      defaultValue: this.defaultValue,
      uri: this.uri,
      customData: this.customData
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgCreateDynamicStore {
    return MsgCreateDynamicStore.fromProto(protobadges.MsgCreateDynamicStore.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgCreateDynamicStore {
    return MsgCreateDynamicStore.fromProto(protobadges.MsgCreateDynamicStore.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgCreateDynamicStore): MsgCreateDynamicStore {
    return new MsgCreateDynamicStore({
      creator: protoMsg.creator,
      defaultValue: protoMsg.defaultValue,
      uri: protoMsg.uri,
      customData: protoMsg.customData
    });
  }

  toBech32Addresses(prefix: string): MsgCreateDynamicStore {
    return new MsgCreateDynamicStore({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      defaultValue: this.defaultValue,
      uri: this.uri,
      customData: this.customData
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
