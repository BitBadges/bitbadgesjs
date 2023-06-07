import {
  ChallengeSolution,
  NumberType,
  createTransaction,
  createMsgClaimBadge as protoMsgClaimBadge
} from 'bitbadgesjs-proto'

import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  MSG_CLAIM_BADGE_TYPES,
  createEIP712,
  createMsgClaimBadge,
  generateFee,
  generateMessage,
  generateTypes,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MsgClaimBadge<T extends NumberType> {
  creator: string
  collectionId: T
  claimId: T
  solutions: ChallengeSolution[]
}

export function convertMsgClaimBadge<T extends NumberType, U extends NumberType>(
  msg: MsgClaimBadge<T>,
  convertFunction: (item: T) => U
): MsgClaimBadge<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    claimId: convertFunction(msg.claimId),
  }
}

export function convertFromProtoToMsgClaimBadge(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgClaimBadge,
): MsgClaimBadge<bigint> {
  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    claimId: BigInt(msg.claimId),
    solutions: msg.solutions
  }
}

export function createTxMsgClaimBadge<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgClaimBadge<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_CLAIM_BADGE_TYPES)

  const msg = createMsgClaimBadge(
    params.creator,
    params.claimId,
    params.collectionId,
    params.solutions,
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
  const msgCosmos = protoMsgClaimBadge(
    params.creator,
    params.claimId,
    params.collectionId,
    params.solutions,
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
