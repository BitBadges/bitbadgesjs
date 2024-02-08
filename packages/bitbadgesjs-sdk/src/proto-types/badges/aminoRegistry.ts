import { AminoConverters } from '@cosmjs/stargate'
import { createAminoConverter } from '../../amino/objectConverter.js'
import { MsgCreateAddressLists, MsgCreateCollection, MsgDeleteCollection, MsgTransferBadges, MsgUniversalUpdateCollection, MsgUpdateCollection, MsgUpdateUserApprovals } from '../../proto/badges/tx_pb.js'

export function createBadgesAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgDeleteCollection, 'badges/DeleteCollection'),
    ...createAminoConverter(MsgTransferBadges, 'badges/TransferBadges'),
    ...createAminoConverter(MsgUpdateCollection, 'badges/UpdateCollection'),
    ...createAminoConverter(MsgUpdateUserApprovals, 'badges/UpdateUserApprovals'),
    ...createAminoConverter(MsgCreateAddressLists, 'badges/CreateAddressLists'),
    ...createAminoConverter(MsgCreateCollection, 'badges/CreateCollection'),
    ...createAminoConverter(MsgUniversalUpdateCollection, 'badges/UniversalUpdateCollection'),
  }
}
