import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protomanagersplitter from '@/proto/managersplitter/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgCreateManagerSplitter } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { ManagerSplitterPermissions } from '@/core/managersplitter.js';

/**
 * MsgCreateManagerSplitter creates a new manager splitter entity.
 *
 * @category Transactions
 */
export class MsgCreateManagerSplitter extends CustomTypeClass<MsgCreateManagerSplitter> implements iMsgCreateManagerSplitter {
  admin: BitBadgesAddress;
  permissions: ManagerSplitterPermissions;

  constructor(msg: iMsgCreateManagerSplitter) {
    super();
    this.admin = msg.admin;
    this.permissions = new ManagerSplitterPermissions(msg.permissions);
  }

  toProto(): protomanagersplitter.MsgCreateManagerSplitter {
    return new protomanagersplitter.MsgCreateManagerSplitter({
      admin: this.admin,
      permissions: this.permissions.toProto()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgCreateManagerSplitter {
    return MsgCreateManagerSplitter.fromProto(protomanagersplitter.MsgCreateManagerSplitter.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgCreateManagerSplitter {
    return MsgCreateManagerSplitter.fromProto(protomanagersplitter.MsgCreateManagerSplitter.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protomanagersplitter.MsgCreateManagerSplitter): MsgCreateManagerSplitter {
    return new MsgCreateManagerSplitter({
      admin: protoMsg.admin,
      permissions: ManagerSplitterPermissions.fromProto(protoMsg.permissions!)
    });
  }

  toBech32Addresses(prefix: string): MsgCreateManagerSplitter {
    return new MsgCreateManagerSplitter({
      admin: getConvertFunctionFromPrefix(prefix)(this.admin),
      permissions: this.permissions
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"createManagerSplitterMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
