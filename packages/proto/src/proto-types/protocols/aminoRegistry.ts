import { AminoConverters } from '@cosmjs/stargate'
import { createAminoConverter } from '../../amino/objectConverter.js'
import { MsgCreateProtocol, MsgDeleteProtocol, MsgSetCollectionForProtocol, MsgUpdateProtocol } from '../../proto/protocols/tx_pb.js'

export function createProtocolsAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgCreateProtocol, 'protocols/CreateProtocol'),
    ...createAminoConverter(MsgDeleteProtocol, 'protocols/DeleteProtocol'),
    ...createAminoConverter(MsgSetCollectionForProtocol, 'protocols/SetCollectionForProtocol'),
    ...createAminoConverter(MsgUpdateProtocol, 'protocols/UpdateProtocol'),
  }
}
