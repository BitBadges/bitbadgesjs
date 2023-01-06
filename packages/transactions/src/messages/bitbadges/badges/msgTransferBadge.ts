// @ts-nocheck
/* eslint-disable */
import {
    createMsgTransferBadge as protoMsgTransferBadge,
    createTransaction,
} from 'bitbadgesjs-proto'

import {
    createEIP712,
    generateFee,
    generateMessage,
    generateTypes,
    createMsgTransferBadge,
    MSG_TRANSFER_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import { IdRange } from './typeUtils'

export interface MessageMsgTransferBadge {
    creator: string;
    from: number;
    toAddresses: number[];
    amounts: number[];
    badgeId: number;
    subbadgeRanges: IdRange[];
    expirationTime: number;
    cantCancelBeforeTime: number;
}

export function createTxMsgTransferBadge(
    chain: Chain,
    sender: Sender,
    fee: Fee,
    memo: string,
    params: MessageMsgTransferBadge,
    domain?: object,
) {
    // EIP712
    const feeObject = generateFee(
        fee.amount,
        fee.denom,
        fee.gas,
        sender.accountAddress,
    )
    const types = generateTypes(MSG_TRANSFER_BADGE_TYPES)

    const msg = createMsgTransferBadge(
        params.creator,
        params.from,
        params.toAddresses,
        params.amounts,
        params.badgeId,
        params.subbadgeRanges,
        params.expirationTime,
        params.cantCancelBeforeTime,
    )
    const messages = generateMessage(
        sender.accountNumber.toString(),
        sender.sequence.toString(),
        chain.cosmosChainId,
        memo,
        feeObject,
        msg,
    )
    let domainObj = domain;
    if (!domain) {
        domainObj = getDefaultDomainWithChainId(chain.chainId);
    }
    const eipToSign = createEIP712(types, messages, domainObj);

    // Cosmos
    const msgCosmos = protoMsgTransferBadge(
        params.creator,
        params.from,
        params.toAddresses,
        params.amounts,
        params.badgeId,
        params.subbadgeRanges,
        params.expirationTime,
        params.cantCancelBeforeTime,
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
