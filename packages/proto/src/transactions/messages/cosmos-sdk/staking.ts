import {
  createMsgBeginRedelegate as protoMsgBeginRedelegate,
  createMsgDelegate as protoMsgDelegate,
  createMsgUndelegate as protoMsgUndelegate,
  createMsgWithdrawDelegatorReward as protoeMsgWithdrawDelegatorReward,
  createMsgWithdrawValidatorCommission as protoMsgWithdrawValidatorCommission,
  MsgWithdrawDelegatorRewardProtoInterface,
  createTransaction,
  createTransactionWithMultipleMessages,
} from '../../../'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateMessageWithMultipleTransactions,
  generateTypes,
  MSG_DELEGATE_TYPES,
  createEIP712MsgDelegate,
  MSG_UNDELEGATE_TYPES,
  createEIP712MsgUndelegate,
  MSG_BEGIN_REDELEGATE_TYPES,
  createEIP712MsgBeginRedelegate,
  MSG_WITHDRAW_DELEGATOR_REWARD_TYPES,
  createEIP712MsgWithdrawDelegatorReward,
  MsgWithdrawDelegatorRewardInterface,
  MSG_WITHDRAW_VALIDATOR_COMMISSION_TYPES,
  createEIP712MsgWithdrawValidatorCommission,
} from '../../../'

import { Chain, Fee, Sender, SupportedChain } from '../common'

import { getDefaultDomainWithChainId } from '../domain'

export interface MsgDelegateParams {
  validatorAddress: string
  amount: string
  denom: string
}

export function createTxMsgDelegate(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgDelegateParams,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_DELEGATE_TYPES)
  const msg = createEIP712MsgDelegate(
    sender.accountAddress,
    params.validatorAddress,
    params.amount,
    params.denom,
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
  const protoMessage = protoMsgDelegate(
    sender.accountAddress,
    params.validatorAddress,
    params.amount,
    params.denom,
  )
  const tx = createTransaction(
    protoMessage,
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

export interface MsgBeginRedelegateParams {
  validatorSrcAddress: string
  validatorDstAddress: string
  amount: string
  denom: string
}

export function createTxMsgBeginRedelegate(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgBeginRedelegateParams,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_BEGIN_REDELEGATE_TYPES)
  const msg = createEIP712MsgBeginRedelegate(
    sender.accountAddress,
    params.validatorSrcAddress,
    params.validatorDstAddress,
    params.amount,
    params.denom,
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
  const protoMessage = protoMsgBeginRedelegate(
    sender.accountAddress,
    params.validatorSrcAddress,
    params.validatorDstAddress,
    params.amount,
    params.denom,
  )
  const tx = createTransaction(
    protoMessage,
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

export interface MsgUndelegateParams {
  validatorAddress: string
  amount: string
  denom: string
}

export function createTxMsgUndelegate(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUndelegateParams,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UNDELEGATE_TYPES)
  const msg = createEIP712MsgUndelegate(
    sender.accountAddress,
    params.validatorAddress,
    params.amount,
    params.denom,
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
  const protoMessage = protoMsgUndelegate(
    sender.accountAddress,
    params.validatorAddress,
    params.amount,
    params.denom,
  )
  const tx = createTransaction(
    protoMessage,
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

export interface MsgWithdrawDelegatorRewardParams {
  validatorAddress: string
}

export function createTxMsgWithdrawDelegatorReward(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgWithdrawDelegatorRewardParams,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_WITHDRAW_DELEGATOR_REWARD_TYPES)
  const msg = createEIP712MsgWithdrawDelegatorReward(
    sender.accountAddress,
    params.validatorAddress,
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
  const protoMessage = protoeMsgWithdrawDelegatorReward(
    sender.accountAddress,
    params.validatorAddress,
  )
  const tx = createTransaction(
    protoMessage,
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

// Multiple WithdrawRewards
export interface MsgMultipleWithdrawDelegatorRewardParams {
  validatorAddresses: string[]
}

export function createTxMsgMultipleWithdrawDelegatorReward(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgMultipleWithdrawDelegatorRewardParams,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_WITHDRAW_DELEGATOR_REWARD_TYPES)
  // EIP712
  const msgs: MsgWithdrawDelegatorRewardInterface[] = []
  // Cosmos
  const protoMsgs: MsgWithdrawDelegatorRewardProtoInterface[] = []
  params.validatorAddresses.forEach((validator) => {
    msgs.push(
      createEIP712MsgWithdrawDelegatorReward(sender.accountAddress, validator),
    )

    protoMsgs.push(
      protoeMsgWithdrawDelegatorReward(sender.accountAddress, validator),
    )
  })

  const messages = generateMessageWithMultipleTransactions(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msgs,
  )
  let domainObj = domain
  if (!domain) {
    domainObj = getDefaultDomainWithChainId(chain.chainId)
  }
  const eipToSign = createEIP712(types, messages, domainObj)

  // Cosmos
  const tx = createTransactionWithMultipleMessages(
    protoMsgs,
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

export interface MsgWithdrawValidatorCommissionParams {
  validatorAddress: string
}

export function createTxMsgWithdrawValidatorCommission(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgWithdrawValidatorCommissionParams,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_WITHDRAW_VALIDATOR_COMMISSION_TYPES)
  const msg = createEIP712MsgWithdrawValidatorCommission(params.validatorAddress)
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
  const protoMessage = protoMsgWithdrawValidatorCommission(
    params.validatorAddress,
  )
  const tx = createTransaction(
    protoMessage,
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
