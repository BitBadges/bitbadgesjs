const RegisterAddressesMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'addressesToRegister', type: 'string[]' },
]

export const MSG_REGISTER_ADDRESSES_TYPES = {
  MsgValue: RegisterAddressesMsgValueType,
}

export function createMsgRegisterAddresses(
  creator: string,
  addressesToRegister: string[],
) {
  return {
    type: 'badges/RegisterAddresses',
    value: {
      creator,
      addressesToRegister,
    },
  }
}