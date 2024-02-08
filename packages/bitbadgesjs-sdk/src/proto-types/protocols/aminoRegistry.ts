import { AminoConverters } from '@cosmjs/stargate'
import { createAminoConverter } from '../../amino/objectConverter.js'
import { MsgCreateProtocol, MsgDeleteProtocol, MsgSetCollectionForProtocol, MsgUpdateProtocol, MsgUnsetCollectionForProtocol } from '../../proto/protocols/tx_pb.js'

export function createProtocolsAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgCreateProtocol, 'protocols/CreateProtocol'),
    ...createAminoConverter(MsgDeleteProtocol, 'protocols/DeleteProtocol'),
    ...createAminoConverter(MsgSetCollectionForProtocol, 'protocols/SetCollectionForProtocol'),
    ...createAminoConverter(MsgUnsetCollectionForProtocol, 'protocols/UnsetCollectionForProtocol'),
    ...createAminoConverter(MsgUpdateProtocol, 'protocols/UpdateProtocol'),
  }
}
