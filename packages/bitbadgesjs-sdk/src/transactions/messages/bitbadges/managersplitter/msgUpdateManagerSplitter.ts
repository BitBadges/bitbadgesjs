import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protomanagersplitter from '@/proto/managersplitter/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgUpdateManagerSplitter } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { ManagerSplitterPermissions } from '@/core/managersplitter.js';

/**
 * MsgUpdateManagerSplitter updates an existing manager splitter entity.
 *
 * @category Transactions
 */
export class MsgUpdateManagerSplitter extends CustomTypeClass<MsgUpdateManagerSplitter> implements iMsgUpdateManagerSplitter {
  admin: BitBadgesAddress;
  address: BitBadgesAddress;
  permissions: ManagerSplitterPermissions;

  constructor(msg: iMsgUpdateManagerSplitter) {
    super();
    this.admin = msg.admin;
    this.address = msg.address;
    this.permissions = new ManagerSplitterPermissions(msg.permissions);
  }

  toProto(): protomanagersplitter.MsgUpdateManagerSplitter {
    return new protomanagersplitter.MsgUpdateManagerSplitter({
      admin: this.admin,
      address: this.address,
      permissions: this.permissions.toProto()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgUpdateManagerSplitter {
    return MsgUpdateManagerSplitter.fromProto(protomanagersplitter.MsgUpdateManagerSplitter.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgUpdateManagerSplitter {
    return MsgUpdateManagerSplitter.fromProto(protomanagersplitter.MsgUpdateManagerSplitter.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protomanagersplitter.MsgUpdateManagerSplitter): MsgUpdateManagerSplitter {
    return new MsgUpdateManagerSplitter({
      admin: protoMsg.admin,
      address: protoMsg.address,
      permissions: ManagerSplitterPermissions.fromProto(protoMsg.permissions!)
    });
  }

  toBech32Addresses(prefix: string): MsgUpdateManagerSplitter {
    return new MsgUpdateManagerSplitter({
      admin: getConvertFunctionFromPrefix(prefix)(this.admin),
      address: getConvertFunctionFromPrefix(prefix)(this.address),
      permissions: this.permissions
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"updateManagerSplitterMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
