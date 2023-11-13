import * as authz from '../../../proto/cosmos/authz/v1beta1/tx_pb'
import * as authzUtils from '../../../proto/cosmos/authz/v1beta1/authz_pb'
import { createAnyMessage, MessageGenerated } from '../../utils'

export function createMsgGrant(
  granter: string,
  grantee: string,
  grantMessage: MessageGenerated,
  seconds: number,
) {
  const msg = new authz.MsgGrant({
    granter,
    grantee,
    grant: new authzUtils.Grant({
      authorization: createAnyMessage(grantMessage),
      expiration: {
        seconds: BigInt(seconds),
        nanos: 0,
      }
    }),
  })
  return {
    message: msg,
    path: 'cosmos.authz.v1beta1.MsgGrant',
  }
}

export enum RevokeMessages {
  REVOKE_MSG_DELEGATE = '/cosmos.staking.v1beta1.MsgDelegate',
  REVOKE_MSG_WITHDRAW_DELEGATOR_REWARDS = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
}

export function createMsgRevoke(
  granter: string,
  grantee: string,
  type: string | RevokeMessages,
) {
  const msg = new authz.MsgRevoke({
    granter,
    grantee,
    msgTypeUrl: type,
  })
  return {
    message: msg,
    path: 'cosmos.authz.v1beta1.MsgRevoke',
  }
}
