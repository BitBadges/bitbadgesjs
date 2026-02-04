import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as prototokenization from '@/proto/tokenization/tx_pb.js';

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
export class MsgSetStandards<T extends NumberType> extends CustomTypeClass<MsgSetStandards<T>> implements iMsgSetStandards<T> {
  creator: BitBadgesAddress;
  collectionId: T;
  standards: string[];
  canUpdateStandards: ActionPermission<T>[];

  constructor(msg: iMsgSetStandards<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.standards = msg.standards;
    this.canUpdateStandards = msg.canUpdateStandards.map((permission) => new ActionPermission(permission));
  }

  toProto(): prototokenization.MsgSetStandards {
    return new prototokenization.MsgSetStandards({
      creator: this.creator,
      collectionId: this.collectionId.toString(),
      standards: this.standards,
      canUpdateStandards: this.canUpdateStandards.map((permission) => permission.toProto())
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetStandards<NumberType> {
    return MsgSetStandards.fromProto(prototokenization.MsgSetStandards.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetStandards<NumberType> {
    return MsgSetStandards.fromProto(prototokenization.MsgSetStandards.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: prototokenization.MsgSetStandards): MsgSetStandards<NumberType> {
    return new MsgSetStandards({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      standards: protoMsg.standards,
      canUpdateStandards: protoMsg.canUpdateStandards.map((permission) => ActionPermission.fromProto(permission, Stringify))
    });
  }

  toBech32Addresses(prefix: string): MsgSetStandards<T> {
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
