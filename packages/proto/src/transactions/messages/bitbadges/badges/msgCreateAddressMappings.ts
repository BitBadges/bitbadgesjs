
import { AddressMapping, createMsgCreateAddressMappings as protoMsgCreateAddressMappings } from "../../../../";
import { MSG_CREATE_ADDRESS_MAPPING_TYPES, createEIP712, createEIP712MsgCreateAddressMappings, generateFee, generateMessage, generateTypes } from "../../../../"
import { createTransaction } from "../../transaction"
import { Chain, Fee, Sender } from "../../common"
import { getDefaultDomainWithChainId } from "../../domain"

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

// export function convertMsgCreateAddressMappings<T extends NumberType, U extends NumberType>(
//   msg: MsgCreateAddressMappings<T>,
//   convertFunction: (item: T) => U
// ): MsgCreateAddressMappings<U> {
//   return {
//     ...msg,
//     collectionId: convertFunction(msg.collectionId),
//     addressMappings: msg.addressMappings,
//   }
// }


// export function convertFromProtoToMsgCreateAddressMappings(
//   msg: badges.bitbadges.bitbadgeschain.badges.MsgCreateAddressMappings,
// ): MsgCreateAddressMappings<bigint> {
//   return {
//     creator: msg.creator,
//     addressMappings: msg.addressMappings,
//   }
// }

export function createTxMsgCreateAddressMappings(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgCreateAddressMappings,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_CREATE_ADDRESS_MAPPING_TYPES)

  const msg = createEIP712MsgCreateAddressMappings(
    params.creator,
    params.addressMappings,
  )
  const messages = generateMessage(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msg,
  )
  let domainObj = domain;
  if (!domain) {
    domainObj = getDefaultDomainWithChainId(chain.chainId);
  }
  const eipToSign = createEIP712(types, messages, domainObj);

  // Cosmos
  const msgCosmos = protoMsgCreateAddressMappings(
    params.creator,
    params.addressMappings,
  )
  const tx = createTransaction(
    msgCosmos,
    memo,
    fee.amount,
    fee.denom,
    parseInt(fee.gas, 10),
    'ethsecp256',
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId,
  )

  return {
    signDirect: tx.signDirect,
    legacyAmino: tx.legacyAmino,
    eipToSign,
  }
}
