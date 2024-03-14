import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgUpdateProtocol } from './interfaces';
import * as protocols from '@/proto/protocols/tx_pb';
import { CustomTypeClass } from '@/common/base';

/**
 * Updates a protocol on-chain. Must be the creator of the protocol, and the protocol must be unfrozen.
 *
 * @category Transactions
 */
export class MsgUpdateProtocol extends CustomTypeClass<MsgUpdateProtocol> {
  creator: string;
  name: string;
  uri: string;
  customData: string;
  isFrozen: boolean;

  constructor(msg: iMsgUpdateProtocol) {
    super();
    this.creator = msg.creator;
    this.name = msg.name;
    this.uri = msg.uri;
    this.customData = msg.customData;
    this.isFrozen = msg.isFrozen;
  }

  toProto(): protocols.MsgUpdateProtocol {
    return new protocols.MsgUpdateProtocol({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgUpdateProtocol {
    return MsgUpdateProtocol.fromProto(protocols.MsgUpdateProtocol.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgUpdateProtocol {
    return MsgUpdateProtocol.fromProto(protocols.MsgUpdateProtocol.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protocols.MsgUpdateProtocol): MsgUpdateProtocol {
    return new MsgUpdateProtocol({
      creator: protoMsg.creator,
      name: protoMsg.name,
      uri: protoMsg.uri,
      customData: protoMsg.customData,
      isFrozen: protoMsg.isFrozen
    });
  }
}
