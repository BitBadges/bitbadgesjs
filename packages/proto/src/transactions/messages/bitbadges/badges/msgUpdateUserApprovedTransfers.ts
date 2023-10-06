import * as badges from '../../../../proto/badges/tx'

import { generateFee, generateTypes, MSG_UPDATE_USER_APPROVED_TRANSFERS_TYPES, generateMessage, createEIP712, createEIP712MsgUpdateUserApprovedTransfers } from "../../../../"
import { createTransaction } from "../../transaction"
import { Chain, Sender, Fee, SupportedChain } from "../../common"
import { getDefaultDomainWithChainId } from "../../domain"
import { NumberType, UserApprovedIncomingTransfer, UserApprovedOutgoingTransfer, UserPermissions, convertUserApprovedIncomingTransfer, convertUserApprovedOutgoingTransfer, convertUserPermissions, createMsgUpdateUserApprovedTransfers as protoMsgUpdateUserApprovedTransfers } from '../../../../'

export interface MsgUpdateUserApprovedTransfers<T extends NumberType> {
  creator: string
  collectionId: T
  updateApprovedOutgoingTransfers: boolean
  approvedOutgoingTransfers: UserApprovedOutgoingTransfer<T>[]
  updateApprovedIncomingTransfers: boolean
  approvedIncomingTransfers: UserApprovedIncomingTransfer<T>[]
  updateUserPermissions: boolean
  userPermissions: UserPermissions<T>
}

export function convertMsgUpdateUserApprovedTransfers<T extends NumberType, U extends NumberType>(
  msg: MsgUpdateUserApprovedTransfers<T>,
  convertFunction: (item: T) => U
): MsgUpdateUserApprovedTransfers<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    approvedOutgoingTransfers: msg.approvedOutgoingTransfers.map(x => convertUserApprovedOutgoingTransfer(x, convertFunction, true)),
    approvedIncomingTransfers: msg.approvedIncomingTransfers.map(x => convertUserApprovedIncomingTransfer(x, convertFunction, true)),
    userPermissions: convertUserPermissions(msg.userPermissions, convertFunction, true),
  }
}

export function convertFromProtoToMsgUpdateUserApprovedTransfers(
  protoMsg: badges.bitbadges.bitbadgeschain.badges.MsgUpdateUserApprovedTransfers,
): MsgUpdateUserApprovedTransfers<bigint> {
  const msg = protoMsg.toObject() as MsgUpdateUserApprovedTransfers<string>

  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    updateApprovedOutgoingTransfers: msg.updateApprovedOutgoingTransfers,
    approvedOutgoingTransfers: msg.approvedOutgoingTransfers.map(x => convertUserApprovedOutgoingTransfer(x, BigInt)),
    updateApprovedIncomingTransfers: msg.updateApprovedIncomingTransfers,
    approvedIncomingTransfers: msg.approvedIncomingTransfers.map(x => convertUserApprovedIncomingTransfer(x, BigInt)),
    updateUserPermissions: msg.updateUserPermissions,
    userPermissions: convertUserPermissions(msg.userPermissions, BigInt),
  }
}

export function createTxMsgUpdateUserApprovedTransfers<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdateUserApprovedTransfers<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_USER_APPROVED_TRANSFERS_TYPES)

  const msg = createEIP712MsgUpdateUserApprovedTransfers(
    params.creator,
    params.collectionId,
    params.updateApprovedOutgoingTransfers,
    params.approvedOutgoingTransfers,
    params.updateApprovedIncomingTransfers,
    params.approvedIncomingTransfers,
    params.updateUserPermissions,
    params.userPermissions,
  )
  const messages = generateMessage(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msg,
  )
  let domainObj = domain
  if (!domain) {
    domainObj = getDefaultDomainWithChainId(chain.chainId)
  }
  const eipToSign = createEIP712(types, messages, domainObj)

  // Cosmos
  const msgCosmos = protoMsgUpdateUserApprovedTransfers(
    params.creator,
    params.collectionId,
    params.updateApprovedOutgoingTransfers,
    params.approvedOutgoingTransfers,
    params.updateApprovedIncomingTransfers,
    params.approvedIncomingTransfers,
    params.updateUserPermissions,
    params.userPermissions,
  )
  const tx = createTransaction(
    msgCosmos,
    memo,
    fee.amount,
    fee.denom,
    parseInt(fee.gas, 10),
    chain.chain === SupportedChain.ETH ? 'ethsecp256' : 'secp256k1',
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
