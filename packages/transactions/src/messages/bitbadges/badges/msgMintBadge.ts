import {
    createMsgMintBadge as protoMsgMintBadge,
    createTransaction,
} from 'bitbadgesjs-proto'

import {
    createEIP712,
    generateFee,
    generateMessage,
    generateTypes,
    createMsgMintBadge,
    MSG_MINT_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import { BadgeSupplyAndAmount, BadgeUri, Claims, Transfers } from './typeUtils'

export interface MessageMsgMintBadge {
    creator: string
    collectionId: number
    badgeSupplys: BadgeSupplyAndAmount[]
    transfers: Transfers[]
    claims: Claims[]
    collectionUri: string
    badgeUris: BadgeUri[]
}

export function createTxMsgMintBadge(
    chain: Chain,
    sender: Sender,
    fee: Fee,
    memo: string,
    params: MessageMsgMintBadge,
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

    const msg = createMsgMintBadge(
        params.creator,
        params.collectionId,
        params.badgeSupplys,
        params.transfers,
        params.claims,
        params.collectionUri,
        params.badgeUris,
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
    const msgCosmos = protoMsgMintBadge(
        params.creator,
        params.collectionId,
        params.badgeSupplys,
        params.transfers,
        params.claims,
        params.collectionUri,
        params.badgeUris,
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
