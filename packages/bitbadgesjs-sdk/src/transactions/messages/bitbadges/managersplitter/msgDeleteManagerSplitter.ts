import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protomanagersplitter from '@/proto/managersplitter/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgDeleteManagerSplitter } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../utils.js';

/**
 * MsgDeleteManagerSplitter deletes a manager splitter entity.
 *
 * @category Transactions
 */
export class MsgDeleteManagerSplitter extends CustomTypeClass<MsgDeleteManagerSplitter> implements iMsgDeleteManagerSplitter {
  admin: BitBadgesAddress;
  address: BitBadgesAddress;

  constructor(msg: iMsgDeleteManagerSplitter) {
    super();
    this.admin = msg.admin;
    this.address = msg.address;
  }

  toProto(): protomanagersplitter.MsgDeleteManagerSplitter {
    return new protomanagersplitter.MsgDeleteManagerSplitter({
      admin: this.admin,
      address: this.address
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgDeleteManagerSplitter {
    return MsgDeleteManagerSplitter.fromProto(protomanagersplitter.MsgDeleteManagerSplitter.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgDeleteManagerSplitter {
    return MsgDeleteManagerSplitter.fromProto(protomanagersplitter.MsgDeleteManagerSplitter.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protomanagersplitter.MsgDeleteManagerSplitter): MsgDeleteManagerSplitter {
    return new MsgDeleteManagerSplitter({
      admin: protoMsg.admin,
      address: protoMsg.address
    });
  }

  toBech32Addresses(prefix: string): MsgDeleteManagerSplitter {
    return new MsgDeleteManagerSplitter({
      admin: getConvertFunctionFromPrefix(prefix)(this.admin),
      address: getConvertFunctionFromPrefix(prefix)(this.address)
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"deleteManagerSplitterMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
