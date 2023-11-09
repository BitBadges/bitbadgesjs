import * as badges from '../../../../proto/badges/tx'

import { generateFee, generateTypes, MSG_UPDATE_USER_APPROVED_TRANSFERS_TYPES, generateMessage, createEIP712, createEIP712MsgUpdateUserApprovals } from "../../../.."
import { createTransaction } from "../../transaction"
import { Chain, Sender, Fee, SupportedChain } from "../../common"
import { getDefaultDomainWithChainId } from "../../domain"
import { NumberType, UserIncomingApproval, UserOutgoingApproval, UserPermissions, convertUserIncomingApproval, convertUserOutgoingApproval, convertUserPermissions, createMsgUpdateUserApprovals as protoMsgUpdateUserApprovals } from '../../../..'

export interface MsgUpdateUserApprovals<T extends NumberType> {
  creator: string
  collectionId: T
  updateOutgoingApprovals?: boolean
  outgoingApprovals?: UserOutgoingApproval<T>[]
  updateIncomingApprovals?: boolean
  incomingApprovals?: UserIncomingApproval<T>[]
  updateAutoApproveSelfInitiatedOutgoingTransfers?: boolean
  autoApproveSelfInitiatedOutgoingTransfers?: boolean
  updateAutoApproveSelfInitiatedIncomingTransfers?: boolean
  autoApproveSelfInitiatedIncomingTransfers?: boolean
  updateUserPermissions?: boolean
  userPermissions?: UserPermissions<T>
}

export function convertMsgUpdateUserApprovals<T extends NumberType, U extends NumberType>(
  msg: MsgUpdateUserApprovals<T>,
  convertFunction: (item: T) => U
): MsgUpdateUserApprovals<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    outgoingApprovals: msg.outgoingApprovals?.map(x => convertUserOutgoingApproval(x, convertFunction, true)) ?? undefined,
    incomingApprovals: msg.incomingApprovals?.map(x => convertUserIncomingApproval(x, convertFunction, true)) ?? undefined,
    userPermissions: msg.userPermissions ? convertUserPermissions(msg.userPermissions, convertFunction, true) : undefined,
  }
}

export function convertFromProtoToMsgUpdateUserApprovals(
  protoMsg: badges.badges.MsgUpdateUserApprovals,
): MsgUpdateUserApprovals<bigint> {
  const msg = protoMsg.toObject() as MsgUpdateUserApprovals<string>

  return {
    ...msg,
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    updateOutgoingApprovals: msg.updateOutgoingApprovals,
    outgoingApprovals: msg.outgoingApprovals?.map(x => convertUserOutgoingApproval(x, BigInt)),
    updateIncomingApprovals: msg.updateIncomingApprovals,
    incomingApprovals: msg.incomingApprovals?.map(x => convertUserIncomingApproval(x, BigInt)),
    updateUserPermissions: msg.updateUserPermissions,
    userPermissions: msg.userPermissions ? convertUserPermissions(msg.userPermissions, BigInt) : undefined,
  }
}

export function createTxMsgUpdateUserApprovals<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdateUserApprovals<T>,
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

  const msg = createEIP712MsgUpdateUserApprovals(
    params.creator,
    params.collectionId,
    params.updateOutgoingApprovals ?? false,
    params.outgoingApprovals ?? [],
    params.updateIncomingApprovals ?? false,
    params.incomingApprovals ?? [],
    params.updateAutoApproveSelfInitiatedOutgoingTransfers ?? false,
    params.autoApproveSelfInitiatedOutgoingTransfers ?? false,
    params.updateAutoApproveSelfInitiatedIncomingTransfers ?? false,
    params.autoApproveSelfInitiatedIncomingTransfers ?? false,
    params.updateUserPermissions ?? false,
    params.userPermissions ?? {
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
    },
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
  const msgCosmos = protoMsgUpdateUserApprovals(
    params.creator,
    params.collectionId,
    params.updateOutgoingApprovals ?? false,
    params.outgoingApprovals ?? [],
    params.updateIncomingApprovals ?? false,
    params.incomingApprovals ?? [],
    params.updateAutoApproveSelfInitiatedOutgoingTransfers ?? false,
    params.autoApproveSelfInitiatedOutgoingTransfers ?? false,
    params.updateAutoApproveSelfInitiatedIncomingTransfers ?? false,
    params.autoApproveSelfInitiatedIncomingTransfers ?? false,
    params.updateUserPermissions ?? false,
    params.userPermissions ?? {
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
    },
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
