import { AminoTypes as AminoTypesClass, createDefaultAminoConverters as createDefaultCosmosAminoConverters } from '@cosmjs/stargate';
import type { AminoConverters } from '@cosmjs/stargate';
import {
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgDeleteCollection,
  MsgTransferBadges,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateUserApprovals
} from '@/proto/badges/tx_pb';
import { createAminoConverter } from './objectConverter';
import { MsgExecuteContract, MsgInstantiateContract, MsgStoreCode } from '@/proto/cosmwasm/wasm/v1/tx_pb';
import {
  MsgCreateProtocol,
  MsgDeleteProtocol,
  MsgSetCollectionForProtocol,
  MsgUnsetCollectionForProtocol,
  MsgUpdateProtocol
} from '@/proto/protocols/tx_pb';
import { MsgExecuteContractCompat, MsgStoreCodeCompat, MsgInstantiateContractCompat } from '@/proto/wasmx/tx_pb';

export function createBadgesAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgDeleteCollection, 'badges/DeleteCollection'),
    ...createAminoConverter(MsgTransferBadges, 'badges/TransferBadges'),
    ...createAminoConverter(MsgUpdateCollection, 'badges/UpdateCollection'),
    ...createAminoConverter(MsgUpdateUserApprovals, 'badges/UpdateUserApprovals'),
    ...createAminoConverter(MsgCreateAddressLists, 'badges/CreateAddressLists'),
    ...createAminoConverter(MsgCreateCollection, 'badges/CreateCollection'),
    ...createAminoConverter(MsgUniversalUpdateCollection, 'badges/UniversalUpdateCollection')
  };
}

export function createWasmXAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgExecuteContractCompat, 'wasmx/MsgExecuteContractCompat'),
    ...createAminoConverter(MsgStoreCodeCompat, 'wasmx/MsgStoreCodeCompat'),
    ...createAminoConverter(MsgInstantiateContractCompat, 'wasmx/MsgInstantiateContractCompat'),
    ...createAminoConverter(MsgExecuteContract, 'wasm/MsgExecuteContract'),
    ...createAminoConverter(MsgStoreCode, 'wasm/MsgStoreCode'),
    ...createAminoConverter(MsgInstantiateContract, 'wasm/MsgInstantiateContract')
  };
}

export function createProtocolsAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgCreateProtocol, 'protocols/CreateProtocol'),
    ...createAminoConverter(MsgDeleteProtocol, 'protocols/DeleteProtocol'),
    ...createAminoConverter(MsgSetCollectionForProtocol, 'protocols/SetCollectionForProtocol'),
    ...createAminoConverter(MsgUnsetCollectionForProtocol, 'protocols/UnsetCollectionForProtocol'),
    ...createAminoConverter(MsgUpdateProtocol, 'protocols/UpdateProtocol')
  };
}

export function createDefaultAminoConverters() {
  return {
    ...createDefaultCosmosAminoConverters(),
    ...createBadgesAminoConverters(),
    ...createWasmXAminoConverters(),
    ...createProtocolsAminoConverters()
  };
}

export const AminoTypes = new AminoTypesClass(createDefaultAminoConverters());
