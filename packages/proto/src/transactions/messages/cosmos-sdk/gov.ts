import {
  createMsgVote as protoCreateMsgVote,
  createTransaction,
} from '../../../'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createEIP712MsgVote,
  MSG_VOTE_TYPES,
} from '../../../'

import { Chain, Fee, Sender, SupportedChain } from '../common'

import { getDefaultDomainWithChainId } from '../domain'

export interface MsgVote {
  proposalId: number
  option: number
}

export function createTxMsgVote(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgVote,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_VOTE_TYPES, ["MsgVote"])

  const msg = createEIP712MsgVote(
    params.proposalId,
    params.option,
    sender.accountAddress,
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
  const msgCosmos = protoCreateMsgVote(
    params.proposalId,
    params.option,
    sender.accountAddress,
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
