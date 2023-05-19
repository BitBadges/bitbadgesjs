import {
  createMsgMintAndDistributeBadges as protoMsgMintAndDistributeBadges,
  createTransaction,
  BadgeSupplyAndAmount, BadgeUri, Claim, Transfer
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgMintAndDistributeBadges,
  MSG_MINT_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgMintAndDistributeBadges {
  creator: string
  collectionId: bigint
  badgeSupplys: BadgeSupplyAndAmount[]
  transfers: Transfer[]
  claims: Claim[]
  collectionUri: string
  badgeUris: BadgeUri[]
  balancesUri: string
}

export function createTxMsgMintAndDistributeBadges(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgMintAndDistributeBadges,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_MINT_BADGE_TYPES)

  const msg = createMsgMintAndDistributeBadges(
    params.creator,
    params.collectionId,
    params.badgeSupplys,
    params.transfers,
    params.claims,
    params.collectionUri,
    params.badgeUris,
    params.balancesUri,
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
  const msgCosmos = protoMsgMintAndDistributeBadges(
    params.creator,
    params.collectionId,
    params.badgeSupplys,
    params.transfers,
    params.claims,
    params.collectionUri,
    params.badgeUris,
    params.balancesUri,
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
