import {
    createMsgNewCollection as protoMsgNewCollection,
    createTransaction,
} from 'bitbadgesjs-proto'

import {
    createEIP712,
    generateFee,
    generateMessage,
    generateTypes,
    createMsgNewCollection,
    MSG_NEW_COLLECTION_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import {
    BadgeSupplyAndAmount,
    BadgeUri,
    Claims,
    TransferMapping,
    Transfers,
} from './typeUtils'

export interface MessageMsgNewCollection {
    creator: string
    collectionUri: string
    badgeUris: BadgeUri[],
    permissions: number
    bytes: string
    disallowedTransfers: TransferMapping[]
    managerApprovedTransfers: TransferMapping[]
    standard: number
    badgeSupplys: BadgeSupplyAndAmount[]
    transfers: Transfers[]
    claims: Claims[]
}

export function createTxMsgNewCollection(
    chain: Chain,
    sender: Sender,
    fee: Fee,
    memo: string,
    params: MessageMsgNewCollection,
    domain?: object,
) {
    // EIP712
    const feeObject = generateFee(
        fee.amount,
        fee.denom,
        fee.gas,
        sender.accountAddress,
    )
    const types = generateTypes(MSG_NEW_COLLECTION_TYPES)

    const msg = createMsgNewCollection(
        params.creator,
        params.collectionUri,
        params.badgeUris,
        params.bytes,
        params.permissions,
        params.disallowedTransfers,
        params.managerApprovedTransfers,
        params.standard,

        params.badgeSupplys,
        params.transfers,
        params.claims,
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
    const msgCosmos = protoMsgNewCollection(
        params.creator,
        params.collectionUri,
        params.badgeUris,
        params.bytes,
        params.permissions,
        params.disallowedTransfers,
        params.managerApprovedTransfers,
        params.standard,

        params.badgeSupplys,
        params.transfers,
        params.claims,
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
