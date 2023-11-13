
import { AddressMapping, createMsgCreateAddressMappings as protoMsgCreateAddressMappings } from "../../../../";
import { Chain, Fee, Sender } from "../../common";

import * as badges from '../../../../proto/badges/tx_pb';
import { createTransactionPayload } from "../../base";

/**
 * MsgCreateAddressMappings defines a CreateAddressMappings message.
 * AddressMappings must be validly formatted and have a unique ID not used before. Note that some such as ("Mint", "Manager", etc) are reserved.
 *
 * @typedef {Object} MsgCreateAddressMappings
 * @property {string} creator - The creator of the transaction.
 * @property {AddressMapping[]} addressMappings - The address mappings to create.
 */
export interface MsgCreateAddressMappings {
  creator: string;
  addressMappings: AddressMapping[];
}

export function convertFromProtoToMsgCreateAddressMappings(
  protoMsg: badges.MsgCreateAddressMappings,
): MsgCreateAddressMappings {
  const msg = (protoMsg.toJson({ emitDefaultValues: true }) as any) as MsgCreateAddressMappings;

  return {
    creator: msg.creator,
    addressMappings: msg.addressMappings,
  }
}

export function createTxMsgCreateAddressMappings(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgCreateAddressMappings
) {
  // Cosmos
  const msgCosmos = protoMsgCreateAddressMappings(
    params.creator,
    params.addressMappings,
  )
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
