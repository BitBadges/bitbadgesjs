import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetValidTokenIds } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { UintRange } from '@/core/uintRanges.js';
import { TokenIdsActionPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetValidTokenIds sets the validTokenIds and canUpdateValidTokenIds permission.
 *
 * @category Transactions
 */
export class MsgSetValidTokenIds extends CustomTypeClass<MsgSetValidTokenIds> implements iMsgSetValidTokenIds {
  creator: BitBadgesAddress;
  collectionId: string | number;
  validTokenIds: UintRange[];
  canUpdateValidTokenIds: TokenIdsActionPermission[];

  constructor(msg: iMsgSetValidTokenIds) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.validTokenIds = msg.validTokenIds.map((range) => new UintRange(range));
    this.canUpdateValidTokenIds = msg.canUpdateValidTokenIds.map((permission) => new TokenIdsActionPermission(permission));
  }

  toProto(): protobadges.MsgSetValidTokenIds {
    return new protobadges.MsgSetValidTokenIds({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      validTokenIds: this.validTokenIds.map((range) => range.toProto()),
      canUpdateValidTokenIds: this.canUpdateValidTokenIds.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetValidTokenIds {
    return MsgSetValidTokenIds.fromProto(protobadges.MsgSetValidTokenIds.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetValidTokenIds {
    return MsgSetValidTokenIds.fromProto(protobadges.MsgSetValidTokenIds.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetValidTokenIds): MsgSetValidTokenIds {
    return new MsgSetValidTokenIds({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      validTokenIds: protoMsg.validTokenIds.map((range) => UintRange.fromProto(range, Stringify)),
      canUpdateValidTokenIds: protoMsg.canUpdateValidTokenIds.map((permission) => TokenIdsActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetValidTokenIds {
    return new MsgSetValidTokenIds({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      validTokenIds: this.validTokenIds,
      canUpdateValidTokenIds: this.canUpdateValidTokenIds
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setValidTokenIdsMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
