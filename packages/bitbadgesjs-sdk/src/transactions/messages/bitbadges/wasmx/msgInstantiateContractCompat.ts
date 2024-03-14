import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as wasmx from '@/proto/wasmx/tx_pb';
import { CustomTypeClass } from '@/common/base';
import type { iMsgInstantiateContractCompat } from './interfaces';

/**
 * MsgInstantiateContractCompat defines a InstantiateContractCompat message.
 * This is a wrapper for MsgInstantiateContract that allows for compatibility with the different signatures.
 *
 * @category Transactions
 */
export class MsgInstantiateContractCompat extends CustomTypeClass<MsgInstantiateContractCompat> implements iMsgInstantiateContractCompat {
  sender: string;
  codeId: string;
  label: string;
  funds: string;

  constructor(msg: iMsgInstantiateContractCompat) {
    super();
    this.sender = msg.sender;
    this.codeId = msg.codeId;
    this.label = msg.label;
    this.funds = msg.funds;
  }

  toProto(): wasmx.MsgInstantiateContractCompat {
    return new wasmx.MsgInstantiateContractCompat({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgInstantiateContractCompat {
    return MsgInstantiateContractCompat.fromProto(wasmx.MsgInstantiateContractCompat.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgInstantiateContractCompat {
    return MsgInstantiateContractCompat.fromProto(wasmx.MsgInstantiateContractCompat.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: wasmx.MsgInstantiateContractCompat): MsgInstantiateContractCompat {
    return new MsgInstantiateContractCompat({
      sender: protoMsg.sender,
      codeId: protoMsg.codeId,
      label: protoMsg.label,
      funds: protoMsg.funds
    });
  }
}
