import * as coin from '../../../proto/cosmos/base/v1beta1/coin_pb'
import * as authzStake from '../../../proto/cosmos/staking/v1beta1/authz_pb'

export const stakeAuthTypes =
  authzStake.AuthorizationType

export function createStakeAuthorization(
  allowAddress: string,
  denom: string,
  maxTokens: string | undefined,
  authorizationType: authzStake.AuthorizationType,
) {
  const msg = new authzStake.StakeAuthorization({

    validators: {
      case: 'allowList',
      value: {
        address: [allowAddress],
      },
    },
    maxTokens: maxTokens
      ? new coin.Coin({
        denom,
        amount: maxTokens,
      })
      : undefined,
    authorizationType: authorizationType,
  })

  return {
    message: msg,
    path: 'cosmos.staking.v1beta1.StakeAuthorization',
  }
}
