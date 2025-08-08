import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetManager } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { ManagerTimeline } from '@/core/misc.js';
import { TimedUpdatePermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetManager sets the manager timeline and canUpdateManager permission.
 *
 * @category Transactions
 */
export class MsgSetManager<T extends NumberType> extends CustomTypeClass<MsgSetManager<T>> implements iMsgSetManager<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  managerTimeline: ManagerTimeline<T>[];
  canUpdateManager: TimedUpdatePermission<T>[];

  constructor(msg: iMsgSetManager<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.managerTimeline = msg.managerTimeline.map((timeline) => new ManagerTimeline(timeline));
    this.canUpdateManager = msg.canUpdateManager.map((permission) => new TimedUpdatePermission(permission));
  }

  toProto(): protobadges.MsgSetManager {
    return new protobadges.MsgSetManager({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      managerTimeline: this.managerTimeline.map((timeline) => timeline.toProto()),
      canUpdateManager: this.canUpdateManager.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetManager<NumberType> {
    return MsgSetManager.fromProto(protobadges.MsgSetManager.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetManager<NumberType> {
    return MsgSetManager.fromProto(protobadges.MsgSetManager.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetManager): MsgSetManager<NumberType> {
    return new MsgSetManager({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      managerTimeline: protoMsg.managerTimeline.map((timeline) => ManagerTimeline.fromProto(timeline, Stringify)),
      canUpdateManager: protoMsg.canUpdateManager.map((permission) => TimedUpdatePermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetManager<T> {
    return new MsgSetManager({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      managerTimeline: this.managerTimeline,
      canUpdateManager: this.canUpdateManager
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setManagerMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
