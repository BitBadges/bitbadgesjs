import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetCustomData } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { ActionPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetCustomData sets the custom data timeline and canUpdateCustomData permission.
 *
 * @category Transactions
 */
export class MsgSetCustomData extends CustomTypeClass<MsgSetCustomData> implements iMsgSetCustomData {
  creator: BitBadgesAddress;
  collectionId: string | number;
  customData: string;
  canUpdateCustomData: ActionPermission[];

  constructor(msg: iMsgSetCustomData) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.customData = msg.customData;
    this.canUpdateCustomData = msg.canUpdateCustomData.map((permission) => new ActionPermission(permission));
  }

  toProto(): protobadges.MsgSetCustomData {
    return new protobadges.MsgSetCustomData({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      customData: this.customData,
      canUpdateCustomData: this.canUpdateCustomData.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetCustomData {
    return MsgSetCustomData.fromProto(protobadges.MsgSetCustomData.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetCustomData {
    return MsgSetCustomData.fromProto(protobadges.MsgSetCustomData.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetCustomData): MsgSetCustomData {
    return new MsgSetCustomData({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      customData: protoMsg.customData,
      canUpdateCustomData: protoMsg.canUpdateCustomData.map((permission) => ActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetCustomData {
    return new MsgSetCustomData({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      customData: this.customData,
      canUpdateCustomData: this.canUpdateCustomData
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setCustomDataMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
