import { AddressMapping } from "../../../../"

const CreateAddressMappingsMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'addressMappings', type: 'AddressMapping[]' },
]

export const MSG_CREATE_ADDRESS_MAPPING_TYPES = {
  MsgCreateAddressMappings: CreateAddressMappingsMsgValueType,
  AddressMapping: [
    { name: 'mappingId', type: 'string' },
    { name: 'addresses', type: 'string[]' },
    { name: 'includeAddresses', type: 'bool' },
    { name: 'uri', type: 'string' },
    { name: 'customData', type: 'string' },
  ],
}

export function createEIP712MsgCreateAddressMappings(
  creator: string,
  addressMappings: AddressMapping[],
) {
  return {
    type: 'badges/CreateAddressMappings',
    value: {
      creator,
      addressMappings: addressMappings,
    },
  }
}
