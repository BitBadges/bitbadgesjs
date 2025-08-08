import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetValidBadgeIds } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { UintRange } from '@/core/uintRanges.js';
import { BadgeIdsActionPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetValidBadgeIds sets the validBadgeIds and canUpdateValidBadgeIds permission.
 *
 * @category Transactions
 */
export class MsgSetValidBadgeIds<T extends NumberType> extends CustomTypeClass<MsgSetValidBadgeIds<T>> implements iMsgSetValidBadgeIds<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  validBadgeIds: UintRange<T>[];
  canUpdateValidBadgeIds: BadgeIdsActionPermission<T>[];

  constructor(msg: iMsgSetValidBadgeIds<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.validBadgeIds = msg.validBadgeIds.map((range) => new UintRange(range));
    this.canUpdateValidBadgeIds = msg.canUpdateValidBadgeIds.map((permission) => new BadgeIdsActionPermission(permission));
  }

  toProto(): protobadges.MsgSetValidBadgeIds {
    return new protobadges.MsgSetValidBadgeIds({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      validBadgeIds: this.validBadgeIds.map((range) => range.toProto()),
      canUpdateValidBadgeIds: this.canUpdateValidBadgeIds.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetValidBadgeIds<NumberType> {
    return MsgSetValidBadgeIds.fromProto(protobadges.MsgSetValidBadgeIds.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetValidBadgeIds<NumberType> {
    return MsgSetValidBadgeIds.fromProto(protobadges.MsgSetValidBadgeIds.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetValidBadgeIds): MsgSetValidBadgeIds<NumberType> {
    return new MsgSetValidBadgeIds({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      validBadgeIds: protoMsg.validBadgeIds.map((range) => UintRange.fromProto(range, Stringify)),
      canUpdateValidBadgeIds: protoMsg.canUpdateValidBadgeIds.map((permission) => BadgeIdsActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetValidBadgeIds<T> {
    return new MsgSetValidBadgeIds({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      validBadgeIds: this.validBadgeIds,
      canUpdateValidBadgeIds: this.canUpdateValidBadgeIds
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setValidBadgeIdsMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
