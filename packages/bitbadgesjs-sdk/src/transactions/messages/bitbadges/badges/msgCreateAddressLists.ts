import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import { AddressList } from '@/core/addressLists.js';
import type { iMsgCreateAddressLists } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgCreateAddressLists defines address lists on-chain. For off-chain lists, use the API, not this Msg.
 *
 * AddressLists must be validly formatted and have a unique ID not used before. Note that some such as ("Mint", etc) are reserved as well.
 *
 * @category Transactions
 */
export class MsgCreateAddressLists extends CustomTypeClass<MsgCreateAddressLists> implements MsgCreateAddressLists {
  creator: BitBadgesAddress;
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

  toBech32Addresses(prefix: string): MsgCreateAddressLists {
    return new MsgCreateAddressLists({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      addressLists: this.addressLists.map(
        (x) =>
          new AddressList({
            ...x,
            createdBy: getConvertFunctionFromPrefix(prefix)(x.createdBy ?? ''),
            addresses: x.addresses.map((y) => getConvertFunctionFromPrefix(prefix)(y))
          })
      )
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"createAddressListsMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
