import * as mapping from '../../../proto/badges/address_mappings'
import * as badges from '../../../proto/badges/tx'
import { AddressMapping } from './typeutils/typeUtils'

export function createMsgCreateAddressMappings(
  creator: string,
  addressMappings: AddressMapping[],
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgCreateAddressMappings({
    creator,
    addressMappings: addressMappings.map((addressMapping) => new mapping.bitbadges.bitbadgeschain.badges.AddressMapping({ ...addressMapping })),
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgCreateAddressMappings',
  }
}