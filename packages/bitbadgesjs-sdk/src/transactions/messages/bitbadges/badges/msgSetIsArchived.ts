import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetIsArchived } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { IsArchivedTimeline } from '@/core/misc.js';
import { TimedUpdatePermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetIsArchived sets the isArchived timeline and canArchiveCollection permission.
 *
 * @category Transactions
 */
export class MsgSetIsArchived<T extends NumberType> extends CustomTypeClass<MsgSetIsArchived<T>> implements iMsgSetIsArchived<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  isArchivedTimeline: IsArchivedTimeline<T>[];
  canArchiveCollection: TimedUpdatePermission<T>[];

  constructor(msg: iMsgSetIsArchived<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.isArchivedTimeline = msg.isArchivedTimeline.map((timeline) => new IsArchivedTimeline(timeline));
    this.canArchiveCollection = msg.canArchiveCollection.map((permission) => new TimedUpdatePermission(permission));
  }

  toProto(): protobadges.MsgSetIsArchived {
    return new protobadges.MsgSetIsArchived({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      isArchivedTimeline: this.isArchivedTimeline.map((timeline) => timeline.toProto()),
      canArchiveCollection: this.canArchiveCollection.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetIsArchived<NumberType> {
    return MsgSetIsArchived.fromProto(protobadges.MsgSetIsArchived.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetIsArchived<NumberType> {
    return MsgSetIsArchived.fromProto(protobadges.MsgSetIsArchived.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetIsArchived): MsgSetIsArchived<NumberType> {
    return new MsgSetIsArchived({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      isArchivedTimeline: protoMsg.isArchivedTimeline.map((timeline) => IsArchivedTimeline.fromProto(timeline, Stringify)),
      canArchiveCollection: protoMsg.canArchiveCollection.map((permission) => TimedUpdatePermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetIsArchived<T> {
    return new MsgSetIsArchived({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      isArchivedTimeline: this.isArchivedTimeline,
      canArchiveCollection: this.canArchiveCollection
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setIsArchivedMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
