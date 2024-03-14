import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protocols from '@/proto/protocols/tx_pb';
import { CustomTypeClass } from '@/common/base';
import type { iMsgUnsetCollectionForProtocol } from './interfaces';

/**
 * For a user, unsets the collection for a protocol.
 *
 * @category Transactions
 */
export class MsgUnsetCollectionForProtocol extends CustomTypeClass<MsgUnsetCollectionForProtocol> {
  creator: string;
  name: string;

  constructor(msg: iMsgUnsetCollectionForProtocol) {
    super();
    this.creator = msg.creator;
    this.name = msg.name;
  }

  toProto(): protocols.MsgUnsetCollectionForProtocol {
    return new protocols.MsgUnsetCollectionForProtocol({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgUnsetCollectionForProtocol {
    return MsgUnsetCollectionForProtocol.fromProto(protocols.MsgUnsetCollectionForProtocol.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgUnsetCollectionForProtocol {
    return MsgUnsetCollectionForProtocol.fromProto(protocols.MsgUnsetCollectionForProtocol.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protocols.MsgUnsetCollectionForProtocol): MsgUnsetCollectionForProtocol {
    return new MsgUnsetCollectionForProtocol({
      creator: protoMsg.creator,
      name: protoMsg.name
    });
  }
}
