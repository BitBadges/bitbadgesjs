import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as wasmx from '@/proto/wasmx/tx_pb';
import { CustomTypeClass } from '@/common/base';
import type { iMsgExecuteContractCompat } from './interfaces';

/**
 * MsgExecuteContractCompat defines a ExecuteContractCompat message.
 * This is a wrapper for MsgExecuteContract that allows for compatibility with the different signatures.
 *
 * @category Transactions
 */
export class MsgExecuteContractCompat extends CustomTypeClass<MsgExecuteContractCompat> implements iMsgExecuteContractCompat {
  sender: string;
  contract: string;
  msg: string;
  funds: string;

  constructor(msg: iMsgExecuteContractCompat) {
    super();
    this.sender = msg.sender;
    this.contract = msg.contract;
    this.msg = msg.msg;
    this.funds = msg.funds;
  }

  toProto(): wasmx.MsgExecuteContractCompat {
    return new wasmx.MsgExecuteContractCompat({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgExecuteContractCompat {
    return MsgExecuteContractCompat.fromProto(wasmx.MsgExecuteContractCompat.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgExecuteContractCompat {
    return MsgExecuteContractCompat.fromProto(wasmx.MsgExecuteContractCompat.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: wasmx.MsgExecuteContractCompat): MsgExecuteContractCompat {
    return new MsgExecuteContractCompat({
      sender: protoMsg.sender,
      contract: protoMsg.contract,
      msg: protoMsg.msg,
      funds: protoMsg.funds
    });
  }
}
