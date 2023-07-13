import {
  createMsgEditValidator as protoMsgEditValidator,
  createTransaction,
} from '../../../'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  MSG_EDIT_VALIDATOR_TYPES,
  createEIP712MsgEditValidator,
} from '../../../eip712'

import { Chain, Fee, Sender } from '../common'

import { getDefaultDomainWithChainId } from '../domain'

export interface MsgEditValidatorParams {
  moniker: string | undefined
  identity: string | undefined
  website: string | undefined
  securityContact: string | undefined
  details: string | undefined
  validatorAddress: string | undefined
  commissionRate: string | undefined
  minSelfDelegation: string | undefined
}

export function createTxMsgEditValidator(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgEditValidatorParams,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_EDIT_VALIDATOR_TYPES)
  const msg = createEIP712MsgEditValidator(
    params.moniker,
    params.identity,
    params.website,
    params.securityContact,
    params.details,
    params.validatorAddress,
    params.commissionRate,
    params.minSelfDelegation,
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
  const protoMessage = protoMsgEditValidator(
    params.moniker,
    params.identity,
    params.website,
    params.securityContact,
    params.details,
    params.validatorAddress,
    params.commissionRate,
    params.minSelfDelegation,
  )
  const tx = createTransaction(
    protoMessage,
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
