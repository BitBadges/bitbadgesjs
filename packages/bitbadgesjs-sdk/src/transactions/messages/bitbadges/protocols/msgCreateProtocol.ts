import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { CustomTypeClass } from '@/common/base';
import * as protocols from '@/proto/protocols/tx_pb';
import type { iMsgCreateProtocol } from './interfaces';

/**
 * Creates a protocol on-chain
 *
 * @category Transactions
 */
export class MsgCreateProtocol extends CustomTypeClass<MsgCreateProtocol> {
  creator: string;
  name: string;
  uri: string;
  customData: string;
  isFrozen: boolean;

  constructor(msg: iMsgCreateProtocol) {
    super();
    this.creator = msg.creator;
    this.name = msg.name;
    this.uri = msg.uri;
    this.customData = msg.customData;
    this.isFrozen = msg.isFrozen;
  }

  toProto(): protocols.MsgCreateProtocol {
    return new protocols.MsgCreateProtocol({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgCreateProtocol {
    return MsgCreateProtocol.fromProto(protocols.MsgCreateProtocol.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgCreateProtocol {
    return MsgCreateProtocol.fromProto(protocols.MsgCreateProtocol.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protocols.MsgCreateProtocol): MsgCreateProtocol {
    return new MsgCreateProtocol({
      creator: protoMsg.creator,
      name: protoMsg.name,
      uri: protoMsg.uri,
      customData: protoMsg.customData,
      isFrozen: protoMsg.isFrozen
    });
  }
}
