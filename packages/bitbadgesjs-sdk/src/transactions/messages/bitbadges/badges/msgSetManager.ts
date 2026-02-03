import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetManager } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { ActionPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetManager sets the manager timeline and canUpdateManager permission.
 *
 * @category Transactions
 */
export class MsgSetManager extends CustomTypeClass<MsgSetManager> implements iMsgSetManager {
  creator: BitBadgesAddress;
  collectionId: string | number;
  manager: BitBadgesAddress;
  canUpdateManager: ActionPermission[];

  constructor(msg: iMsgSetManager) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.manager = msg.manager;
    this.canUpdateManager = msg.canUpdateManager.map((permission) => new ActionPermission(permission));
  }

  toProto(): protobadges.MsgSetManager {
    return new protobadges.MsgSetManager({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      manager: this.manager,
      canUpdateManager: this.canUpdateManager.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetManager {
    return MsgSetManager.fromProto(protobadges.MsgSetManager.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetManager {
    return MsgSetManager.fromProto(protobadges.MsgSetManager.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgSetManager): MsgSetManager {
    return new MsgSetManager({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      manager: protoMsg.manager,
      canUpdateManager: protoMsg.canUpdateManager.map((permission) => ActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetManager {
    return new MsgSetManager({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      manager: getConvertFunctionFromPrefix(prefix)(this.manager),
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
