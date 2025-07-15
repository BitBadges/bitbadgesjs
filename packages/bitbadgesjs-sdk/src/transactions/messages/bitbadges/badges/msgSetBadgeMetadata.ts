import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetBadgeMetadata } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { BadgeMetadataTimeline } from '@/core/misc.js';
import { TimedUpdateWithBadgeIdsPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetBadgeMetadata sets the badge metadata timeline and canUpdateBadgeMetadata permission.
 *
 * @category Transactions
 */
export class MsgSetBadgeMetadata<T extends NumberType> extends CustomTypeClass<MsgSetBadgeMetadata<T>> implements iMsgSetBadgeMetadata<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  badgeMetadataTimeline: BadgeMetadataTimeline<T>[];
  canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermission<T>[];

  constructor(msg: iMsgSetBadgeMetadata<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.badgeMetadataTimeline = msg.badgeMetadataTimeline.map((timeline) => new BadgeMetadataTimeline(timeline));
    this.canUpdateBadgeMetadata = msg.canUpdateBadgeMetadata.map((permission) => new TimedUpdateWithBadgeIdsPermission(permission));
  }

  toProto(): badges.MsgSetBadgeMetadata {
    return new badges.MsgSetBadgeMetadata({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      badgeMetadataTimeline: this.badgeMetadataTimeline.map((timeline) => timeline.toProto()),
      canUpdateBadgeMetadata: this.canUpdateBadgeMetadata.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetBadgeMetadata<NumberType> {
    return MsgSetBadgeMetadata.fromProto(badges.MsgSetBadgeMetadata.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetBadgeMetadata<NumberType> {
    return MsgSetBadgeMetadata.fromProto(badges.MsgSetBadgeMetadata.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgSetBadgeMetadata): MsgSetBadgeMetadata<NumberType> {
    return new MsgSetBadgeMetadata({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      badgeMetadataTimeline: protoMsg.badgeMetadataTimeline.map((timeline) => BadgeMetadataTimeline.fromProto(timeline, Stringify)),
      canUpdateBadgeMetadata: protoMsg.canUpdateBadgeMetadata.map((permission) => TimedUpdateWithBadgeIdsPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetBadgeMetadata<T> {
    return new MsgSetBadgeMetadata({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      badgeMetadataTimeline: this.badgeMetadataTimeline,
      canUpdateBadgeMetadata: this.canUpdateBadgeMetadata
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setBadgeMetadataMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
