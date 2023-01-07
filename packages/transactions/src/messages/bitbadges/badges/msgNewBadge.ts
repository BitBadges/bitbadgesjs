import {
  createMsgNewBadge as protoMsgNewBadge,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgNewBadge,
  MSG_NEW_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import {
  IdRange,
  SubassetSupplyAndAmount,
  UriObject,
  WhitelistMintInfo,
} from './typeUtils'

export interface MessageMsgNewBadge {
  creator: string
  uri: UriObject
  arbitraryBytes: string
  permissions: number
  defaultSubassetSupply: number
  freezeAddressRanges: IdRange[]
  standard: number
  subassetSupplysAndAmounts: SubassetSupplyAndAmount[]
  whitelistedRecipients: WhitelistMintInfo[]
}

export function createTxMsgNewBadge(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgNewBadge,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_NEW_BADGE_TYPES)

  const msg = createMsgNewBadge(
    params.creator,
    params.uri,
    params.arbitraryBytes,
    params.permissions,
    params.defaultSubassetSupply,
    params.freezeAddressRanges,
    params.standard,
    params.subassetSupplysAndAmounts,
    params.whitelistedRecipients,
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
  const msgCosmos = protoMsgNewBadge(
    params.creator,
    params.uri,
    params.arbitraryBytes,
    params.permissions,
    params.defaultSubassetSupply,
    params.freezeAddressRanges,
    params.standard,
    params.subassetSupplysAndAmounts,
    params.whitelistedRecipients,
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
