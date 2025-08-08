import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetCustomData } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { CustomDataTimeline } from '@/core/misc.js';
import { TimedUpdatePermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetCustomData sets the custom data timeline and canUpdateCustomData permission.
 *
 * @category Transactions
 */
export class MsgSetCustomData<T extends NumberType> extends CustomTypeClass<MsgSetCustomData<T>> implements iMsgSetCustomData<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  customDataTimeline: CustomDataTimeline<T>[];
  canUpdateCustomData: TimedUpdatePermission<T>[];

  constructor(msg: iMsgSetCustomData<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.customDataTimeline = msg.customDataTimeline.map((timeline) => new CustomDataTimeline(timeline));
    this.canUpdateCustomData = msg.canUpdateCustomData.map((permission) => new TimedUpdatePermission(permission));
  }

  toProto(): protobadges.MsgSetCustomData {
    return new protobadges.MsgSetCustomData({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      customDataTimeline: this.customDataTimeline.map((timeline) => timeline.toProto()),
      canUpdateCustomData: this.canUpdateCustomData.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetCustomData<NumberType> {
    return MsgSetCustomData.fromProto(protobadges.MsgSetCustomData.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetCustomData<NumberType> {
    return MsgSetCustomData.fromProto(protobadges.MsgSetCustomData.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetCustomData): MsgSetCustomData<NumberType> {
    return new MsgSetCustomData({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      customDataTimeline: protoMsg.customDataTimeline.map((timeline) => CustomDataTimeline.fromProto(timeline, Stringify)),
      canUpdateCustomData: protoMsg.canUpdateCustomData.map((permission) => TimedUpdatePermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetCustomData<T> {
    return new MsgSetCustomData({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      customDataTimeline: this.customDataTimeline,
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
