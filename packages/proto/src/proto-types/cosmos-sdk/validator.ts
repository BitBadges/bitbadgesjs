import * as stakingTypes from '../../proto/cosmos/staking/v1beta1/staking_pb'
import * as staking from '../../proto/cosmos/staking/v1beta1/tx_pb'

const NOT_MODIFY = '[do-not-modify]'

export interface MsgEditValidatorProtoInterface {
  path: string
  message: staking.MsgEditValidator
}

export function createMsgEditValidator(
  moniker: string | undefined,
  identity: string | undefined,
  website: string | undefined,
  securityContact: string | undefined,
  details: string | undefined,
  validatorAddress: string | undefined,
  commissionRate: string | undefined,
  minSelfDelegation: string | undefined,
) {
  const message = new staking.MsgEditValidator({
    description: new stakingTypes.Description({
      moniker: moniker || NOT_MODIFY,
      identity: identity || NOT_MODIFY,
      website: website || NOT_MODIFY,
      securityContact: securityContact || NOT_MODIFY,
      details: details || NOT_MODIFY,
    }),
    validatorAddress: validatorAddress,
    commissionRate: commissionRate,
    minSelfDelegation: minSelfDelegation,
  })

  return {
    message,
    path: 'cosmos.staking.v1beta1.MsgEditValidator',
  }
}
