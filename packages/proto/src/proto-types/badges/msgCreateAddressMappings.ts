import * as badges from '../../proto/badges/tx_pb'
import { AddressMapping } from './typeutils/typeUtils'

export function createMsgCreateAddressMappings(
  creator: string,
  addressMappings: AddressMapping[],
) {
  const message = new badges.MsgCreateAddressMappings({
    creator,
    addressMappings: addressMappings,
  })
  return {
    message: message,
    path: message.getType().typeName
  }
}
