import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgDeleteProtocol } from './interfaces';
import * as protocols from '@/proto/protocols/tx_pb';
import { CustomTypeClass } from '@/common/base';

/**
 * Deletes a protocol on-chain
 *
 * @category Transactions
 */
export class MsgDeleteProtocol extends CustomTypeClass<MsgDeleteProtocol> {
  creator: string;
  name: string;

  constructor(msg: iMsgDeleteProtocol) {
    super();
    this.creator = msg.creator;
    this.name = msg.name;
  }

  toProto(): protocols.MsgDeleteProtocol {
    return new protocols.MsgDeleteProtocol({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgDeleteProtocol {
    return MsgDeleteProtocol.fromProto(protocols.MsgDeleteProtocol.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgDeleteProtocol {
    return MsgDeleteProtocol.fromProto(protocols.MsgDeleteProtocol.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protocols.MsgDeleteProtocol): MsgDeleteProtocol {
    return new MsgDeleteProtocol({
      creator: protoMsg.creator,
      name: protoMsg.name
    });
  }
}
