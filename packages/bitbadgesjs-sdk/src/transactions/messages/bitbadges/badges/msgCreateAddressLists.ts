import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb';

import { CustomTypeClass } from '@/common/base';
import { AddressList } from '@/core/addressLists';
import type { iMsgCreateAddressLists } from './interfaces';

/**
 * MsgCreateAddressLists defines address lists on-chain. For off-chain lists, use the API, not this Msg.
 *
 * AddressLists must be validly formatted and have a unique ID not used before. Note that some such as ("Mint", etc) are reserved as well.
 *
 * @category Transactions
 */
export class MsgCreateAddressLists extends CustomTypeClass<MsgCreateAddressLists> implements MsgCreateAddressLists {
  creator: string;
  addressLists: AddressList[];

  constructor(msg: iMsgCreateAddressLists) {
    super();
    this.creator = msg.creator;
    this.addressLists = msg.addressLists.map((x) => new AddressList(x));
  }

  toProto(): badges.MsgCreateAddressLists {
    return new badges.MsgCreateAddressLists({ ...this });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgCreateAddressLists {
    return MsgCreateAddressLists.fromProto(badges.MsgCreateAddressLists.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgCreateAddressLists {
    return MsgCreateAddressLists.fromProto(badges.MsgCreateAddressLists.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgCreateAddressLists): MsgCreateAddressLists {
    return new MsgCreateAddressLists({
      creator: protoMsg.creator,
      addressLists: protoMsg.addressLists.map((x) => AddressList.fromProto(x))
    });
  }
}
