import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgUpdateDynamicStore } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgUpdateDynamicStore is used to update an existing dynamic store.
 *
 * @category Transactions
 */
export class MsgUpdateDynamicStore extends CustomTypeClass<MsgUpdateDynamicStore> implements iMsgUpdateDynamicStore {
  creator: BitBadgesAddress;
  storeId: string | number;
  defaultValue?: boolean;
  globalEnabled?: boolean;
  uri?: string;
  customData?: string;

  constructor(msg: iMsgUpdateDynamicStore) {
    super();
    this.creator = msg.creator;
    this.storeId = msg.storeId;
    this.defaultValue = msg.defaultValue;
    this.globalEnabled = msg.globalEnabled;
    this.uri = msg.uri;
    this.customData = msg.customData;
  }

  toProto(): protobadges.MsgUpdateDynamicStore {
    return new protobadges.MsgUpdateDynamicStore({
      creator: this.creator,
      storeId: this.storeId.toString(),
      defaultValue: this.defaultValue,
      globalEnabled: this.globalEnabled,
      uri: this.uri,
      customData: this.customData
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgUpdateDynamicStore {
    return MsgUpdateDynamicStore.fromProto(protobadges.MsgUpdateDynamicStore.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgUpdateDynamicStore {
    return MsgUpdateDynamicStore.fromProto(protobadges.MsgUpdateDynamicStore.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgUpdateDynamicStore): MsgUpdateDynamicStore {
    return new MsgUpdateDynamicStore({
      creator: protoMsg.creator,
      storeId: protoMsg.storeId,
      defaultValue: protoMsg.defaultValue,
      globalEnabled: protoMsg.globalEnabled,
      uri: protoMsg.uri,
      customData: protoMsg.customData
    });
  }

  toBech32Addresses(prefix: string): MsgUpdateDynamicStore {
    return new MsgUpdateDynamicStore({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      storeId: this.storeId,
      defaultValue: this.defaultValue,
      globalEnabled: this.globalEnabled,
      uri: this.uri,
      customData: this.customData
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
