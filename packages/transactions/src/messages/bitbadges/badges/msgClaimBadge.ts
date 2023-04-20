import {
    createMsgClaimBadge as protoMsgClaimBadge,
    createTransaction,
} from 'bitbadgesjs-proto'

import {
    createEIP712,
    generateFee,
    generateMessage,
    generateTypes,
    createMsgClaimBadge,
    MSG_CLAIM_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import { ClaimProof } from './typeUtils'

export interface MessageMsgClaimBadge {
    creator: string
    collectionId: number
    claimId: number
    whitelistProof: ClaimProof
    codeProof: ClaimProof
}

export function createTxMsgClaimBadge(
    chain: Chain,
    sender: Sender,
    fee: Fee,
    memo: string,
    params: MessageMsgClaimBadge,
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
        params.whitelistProof,
        params.codeProof,
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
        params.whitelistProof,
        params.codeProof,
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
