import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetStandards } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { StandardsTimeline } from '@/core/misc.js';
import { TimedUpdatePermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetStandards sets the standards timeline and canUpdateStandards permission.
 *
 * @category Transactions
 */
export class MsgSetStandards<T extends NumberType> extends CustomTypeClass<MsgSetStandards<T>> implements iMsgSetStandards<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  standardsTimeline: StandardsTimeline<T>[];
  canUpdateStandards: TimedUpdatePermission<T>[];

  constructor(msg: iMsgSetStandards<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.standardsTimeline = msg.standardsTimeline.map((timeline) => new StandardsTimeline(timeline));
    this.canUpdateStandards = msg.canUpdateStandards.map((permission) => new TimedUpdatePermission(permission));
  }

  toProto(): protobadges.MsgSetStandards {
    return new protobadges.MsgSetStandards({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      standardsTimeline: this.standardsTimeline.map((timeline) => timeline.toProto()),
      canUpdateStandards: this.canUpdateStandards.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetStandards<NumberType> {
    return MsgSetStandards.fromProto(protobadges.MsgSetStandards.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetStandards<NumberType> {
    return MsgSetStandards.fromProto(protobadges.MsgSetStandards.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetStandards): MsgSetStandards<NumberType> {
    return new MsgSetStandards({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      standardsTimeline: protoMsg.standardsTimeline.map((timeline) => StandardsTimeline.fromProto(timeline, Stringify)),
      canUpdateStandards: protoMsg.canUpdateStandards.map((permission) => TimedUpdatePermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetStandards<T> {
    return new MsgSetStandards({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      standardsTimeline: this.standardsTimeline,
      canUpdateStandards: this.canUpdateStandards
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setStandardsMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
