import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgStoreCodeCompat } from './interfaces';
import * as wasmx from '@/proto/wasmx/tx_pb';
import { CustomTypeClass } from '@/common/base';

/**
 * MsgStoreCodeCompat defines a StoreCodeCompat message. This is a wrapper for MsgStoreCode that allows for compatibility with the different signatures.
 *
 * @category Transactions
 */
export class MsgStoreCodeCompat extends CustomTypeClass<MsgStoreCodeCompat> implements iMsgStoreCodeCompat {
  sender: string;
  hexWasmByteCode: string;

  constructor(msg: iMsgStoreCodeCompat) {
    super();
    this.sender = msg.sender;
    this.hexWasmByteCode = msg.hexWasmByteCode;
  }

  toProto(): wasmx.MsgStoreCodeCompat {
    return new wasmx.MsgStoreCodeCompat({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgStoreCodeCompat {
    return MsgStoreCodeCompat.fromProto(wasmx.MsgStoreCodeCompat.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgStoreCodeCompat {
    return MsgStoreCodeCompat.fromProto(wasmx.MsgStoreCodeCompat.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: wasmx.MsgStoreCodeCompat): MsgStoreCodeCompat {
    return new MsgStoreCodeCompat({
      sender: protoMsg.sender,
      hexWasmByteCode: protoMsg.hexWasmByteCode
    });
  }
}
