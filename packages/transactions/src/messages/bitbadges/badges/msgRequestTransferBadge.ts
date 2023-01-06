// @ts-nocheck
/* eslint-disable */
import {
    createMsgRequestTransferBadge as protoMsgRequestTransferBadge,
    createTransaction,
} from 'bitbadgesjs-proto'

import {
    createEIP712,
    generateFee,
    generateMessage,
    generateTypes,
    createMsgRequestTransferBadge,
    MSG_REQUEST_TRANSFER_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import { IdRange } from './typeUtils'

export interface MessageMsgRequestTransferBadge {
    creator: string;
    from: number;
    amount: number;
    badgeId: number;
    subbadgeRanges: IdRange[];
    expirationTime: number;
    cantCancelBeforeTime: number;
}

export function createTxMsgRequestTransferBadge(
    chain: Chain,
    sender: Sender,
    fee: Fee,
    memo: string,
    params: MessageMsgRequestTransferBadge,
    domain?: object,
) {
    // EIP712
    const feeObject = generateFee(
        fee.amount,
        fee.denom,
        fee.gas,
        sender.accountAddress,
    )
    const types = generateTypes(MSG_REQUEST_TRANSFER_BADGE_TYPES)

    const msg = createMsgRequestTransferBadge(
        params.creator,
        params.from,
        params.amount,
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
    const msgCosmos = protoMsgRequestTransferBadge(
        params.creator,
        params.from,
        params.amount,
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
