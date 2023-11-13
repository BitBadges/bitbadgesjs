import * as staking from '../../proto/cosmos/staking/v1beta1/tx_pb'
import * as coin from '../../proto/cosmos/base/v1beta1/coin_pb'
import * as dist from '../../proto/cosmos/distribution/v1beta1/tx_pb'

export function createMsgDelegate(
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
  denom: string,
) {
  const value = new coin.Coin({
    denom,
    amount,
  })

  const message = new staking.MsgDelegate({
    delegatorAddress: delegatorAddress,
    validatorAddress: validatorAddress,
    amount: value,
  })

  return {
    message,
    path: 'cosmos.staking.v1beta1.MsgDelegate',
  }
}

export function createMsgBeginRedelegate(
  delegatorAddress: string,
  validatorSrcAddress: string,
  validatorDstAddress: string,
  amount: string,
  denom: string,
) {
  const value = new coin.Coin({
    denom,
    amount,
  })

  const message = new staking.MsgBeginRedelegate({
    delegatorAddress: delegatorAddress,
    validatorSrcAddress: validatorSrcAddress,
    validatorDstAddress: validatorDstAddress,
    amount: value,
  })

  return {
    message,
    path: 'cosmos.staking.v1beta1.MsgBeginRedelegate',
  }
}

export function createMsgUndelegate(
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
  denom: string,
) {
  const value = new coin.Coin({
    denom,
    amount,
  })

  const message = new staking.MsgUndelegate({
    delegatorAddress: delegatorAddress,
    validatorAddress: validatorAddress,
    amount: value,
  })

  return {
    message,
    path: 'cosmos.staking.v1beta1.MsgUndelegate',
  }
}

export interface MsgWithdrawDelegatorRewardProtoInterface {
  path: string
  message: dist.MsgWithdrawDelegatorReward
}

export function createMsgWithdrawDelegatorReward(
  delegatorAddress: string,
  validatorAddress: string,
) {
  const message =
    new dist.MsgWithdrawDelegatorReward({
      delegatorAddress: delegatorAddress,
      validatorAddress: validatorAddress,
    })

  return {
    message,
    path: 'cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
  }
}

export interface MsgWithdrawValidatorCommissionProtoInterface {
  path: string
  message: dist.MsgWithdrawValidatorCommission
}

export function createMsgWithdrawValidatorCommission(validatorAddress: string) {
  const message =
    new dist.MsgWithdrawValidatorCommission({
      validatorAddress: validatorAddress,
    })

  return {
    message,
    path: 'cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission',
  }
}
