
import { AddressList } from "../../../..";
import { Chain, Fee, Sender } from "../../common";

import { createProtoMsg } from "../../../../proto-types/base";
import * as badges from '../../../../proto/badges/tx_pb';
import { createTransactionPayload } from "../../base";

/**
 * MsgCreateAddressLists defines a CreateAddressLists message.
 * AddressLists must be validly formatted and have a unique ID not used before.
 * Note that some such as ("Mint", "Manager", etc) are reserved.
 *
 * @typedef {Object} MsgCreateAddressLists
 * @property {string} creator - The creator of the transaction.
 * @property {AddressList[]} addressLists - The address lists to create.
 */
export interface MsgCreateAddressLists {
  creator: string;
  addressLists: AddressList[];
}

export function convertFromProtoToMsgCreateAddressLists(
  protoMsg: badges.MsgCreateAddressLists,
): MsgCreateAddressLists {
  const msg = (protoMsg.toJson({ emitDefaultValues: true }) as any) as MsgCreateAddressLists;

  return {
    creator: msg.creator,
    addressLists: msg.addressLists,
  }
}

/**
 * Creates a new transaction with the MsgCreateAddressLists message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgCreateAddressLists} params - The parameters of the CreateAddressLists message.
 */
export function createTxMsgCreateAddressLists(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgCreateAddressLists
) {
  const msgCosmos = createProtoMsg(new badges.MsgCreateAddressLists(params))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
