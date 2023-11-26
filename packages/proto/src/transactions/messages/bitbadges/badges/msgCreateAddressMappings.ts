
import { AddressMapping } from "../../../../";
import { Chain, Fee, Sender } from "../../common";

import { createProtoMsg } from "../../../../proto-types/base";
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

/**
 * Creates a new transaction with the MsgCreateAddressMappings message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgCreateAddressMappings} params - The parameters of the CreateAddressMappings message.
 */
export function createTxMsgCreateAddressMappings(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgCreateAddressMappings
) {
  const msgCosmos = createProtoMsg(new badges.MsgCreateAddressMappings(params))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
