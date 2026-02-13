import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as prototokenization from '@/proto/tokenization/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iMsgSetManager } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../utils.js';
import { ActionPermission } from '@/core/permissions.js';
import { Stringify } from '@/common/string-numbers.js';

/**
 * MsgSetManager sets the manager timeline and canUpdateManager permission.
 *
 * @category Transactions
 */
export class MsgSetManager<T extends NumberType> extends CustomTypeClass<MsgSetManager<T>> implements iMsgSetManager<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  manager: BitBadgesAddress;
  canUpdateManager: ActionPermission<T>[];

  constructor(msg: iMsgSetManager<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.manager = msg.manager;
    this.canUpdateManager = msg.canUpdateManager.map((permission) => new ActionPermission(permission));
  }

  toProto(): prototokenization.MsgSetManager {
    return new prototokenization.MsgSetManager({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      manager: this.manager,
      canUpdateManager: this.canUpdateManager.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetManager<NumberType> {
    return MsgSetManager.fromProto(prototokenization.MsgSetManager.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetManager<NumberType> {
    return MsgSetManager.fromProto(prototokenization.MsgSetManager.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: prototokenization.MsgSetManager): MsgSetManager<NumberType> {
    return new MsgSetManager({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      manager: protoMsg.manager,
      canUpdateManager: protoMsg.canUpdateManager.map((permission) => ActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetManager<T> {
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
