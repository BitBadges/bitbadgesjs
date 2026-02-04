import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as prototokenization from '@/proto/tokenization/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import { AddressList } from '@/core/addressLists.js';
import type { iMsgCreateAddressLists } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { AddressListInput } from '@/proto/tokenization/address_lists_pb.js';

/**
 * MsgCreateAddressLists defines address lists on-chain.
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

  toProto(): prototokenization.MsgCreateAddressLists {
    return new prototokenization.MsgCreateAddressLists({
      creator: this.creator,
      addressLists: this.addressLists.map(
        (x) =>
          new AddressListInput({
            listId: x.listId,
            addresses: x.addresses,
            whitelist: x.whitelist,
            uri: x.uri,
            customData: x.customData
          })
      )
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgCreateAddressLists {
    return MsgCreateAddressLists.fromProto(prototokenization.MsgCreateAddressLists.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgCreateAddressLists {
    return MsgCreateAddressLists.fromProto(prototokenization.MsgCreateAddressLists.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: prototokenization.MsgCreateAddressLists): MsgCreateAddressLists {
    return new MsgCreateAddressLists({
      creator: protoMsg.creator,
      addressLists: protoMsg.addressLists.map(
        (x) =>
          new AddressList({
            listId: x.listId,
            addresses: x.addresses,
            whitelist: x.whitelist,
            uri: x.uri,
            customData: x.customData
          })
      )
    });
  }

  toBech32Addresses(prefix: string): MsgCreateAddressLists {
    return new MsgCreateAddressLists({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      addressLists: this.addressLists.map(
        (x) =>
          new AddressList({
            listId: x.listId,
            addresses: x.addresses.map((y) => getConvertFunctionFromPrefix(prefix)(y)),
            whitelist: x.whitelist,
            uri: x.uri,
            customData: x.customData
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
