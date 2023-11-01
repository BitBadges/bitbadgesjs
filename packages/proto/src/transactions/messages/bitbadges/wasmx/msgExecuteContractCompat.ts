
import { createMsgExecuteContractCompat } from "../../../../";
import { MSG_EXECUTE_CONTRACT_COMPAT_TYPES, createEIP712, createEIP712MsgExecuteContractCompat, generateFee, generateMessage, generateTypes } from "../../../../";
import { createTransaction } from "../../transaction";
import { Chain, Fee, Sender, SupportedChain } from "../../common";
import { getDefaultDomainWithChainId } from "../../domain";

export interface MsgExecuteContractCompat {
  sender: string
  contract: string
  msg: string
  funds: string
}

export function createTxMsgExecuteContractCompat(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgExecuteContractCompat,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_EXECUTE_CONTRACT_COMPAT_TYPES)

  const msg = createEIP712MsgExecuteContractCompat(
    params.sender,
    params.contract,
    params.msg,
    params.funds,
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
  const msgCosmos = createMsgExecuteContractCompat(
    params.sender,
    params.contract,
    params.msg,
    params.funds,
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
