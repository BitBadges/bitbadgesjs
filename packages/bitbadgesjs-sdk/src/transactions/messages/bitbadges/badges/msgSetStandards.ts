import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetStandards } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { ActionPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetStandards sets the standards timeline and canUpdateStandards permission.
 *
 * @category Transactions
 */
export class MsgSetStandards extends CustomTypeClass<MsgSetStandards> implements iMsgSetStandards {
  creator: BitBadgesAddress;
  collectionId: string | number;
  standards: string[];
  canUpdateStandards: ActionPermission[];

  constructor(msg: iMsgSetStandards) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.standards = msg.standards;
    this.canUpdateStandards = msg.canUpdateStandards.map((permission) => new ActionPermission(permission));
  }

  toProto(): protobadges.MsgSetStandards {
    return new protobadges.MsgSetStandards({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      standards: this.standards,
      canUpdateStandards: this.canUpdateStandards.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetStandards {
    return MsgSetStandards.fromProto(protobadges.MsgSetStandards.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetStandards {
    return MsgSetStandards.fromProto(protobadges.MsgSetStandards.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetStandards): MsgSetStandards {
    return new MsgSetStandards({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      standards: protoMsg.standards,
      canUpdateStandards: protoMsg.canUpdateStandards.map((permission) => ActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetStandards {
    return new MsgSetStandards({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      standards: this.standards,
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
