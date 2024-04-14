import { AminoTypes as AminoTypesClass, createDefaultAminoConverters as createDefaultCosmosAminoConverters } from '@cosmjs/stargate';
import type { AminoConverters } from '@cosmjs/stargate';
import {
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgDeleteCollection,
  MsgGlobalArchive,
  MsgTransferBadges,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateUserApprovals
} from '@/proto/badges/tx_pb';
import { createAminoConverter } from './objectConverter';
import { MsgExecuteContract, MsgInstantiateContract, MsgStoreCode } from '@/proto/cosmwasm/wasm/v1/tx_pb';
import { MsgExecuteContractCompat, MsgInstantiateContractCompat } from '@/proto/wasmx/tx_pb';
import { MsgAddCustomData } from '@/proto/anchor/tx_pb';
import { MsgCreateMap, MsgDeleteMap, MsgSetValue, MsgUpdateMap } from '@/proto/maps/tx_pb';

export function createBadgesAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgDeleteCollection, 'badges/DeleteCollection'),
    ...createAminoConverter(MsgTransferBadges, 'badges/TransferBadges'),
    ...createAminoConverter(MsgUpdateCollection, 'badges/UpdateCollection'),
    ...createAminoConverter(MsgUpdateUserApprovals, 'badges/UpdateUserApprovals'),
    ...createAminoConverter(MsgCreateAddressLists, 'badges/CreateAddressLists'),
    ...createAminoConverter(MsgCreateCollection, 'badges/CreateCollection'),
    ...createAminoConverter(MsgUniversalUpdateCollection, 'badges/UniversalUpdateCollection'),
    ...createAminoConverter(MsgGlobalArchive, 'badges/GlobalArchive')
  };
}

export function createWasmXAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgExecuteContractCompat, 'wasmx/MsgExecuteContractCompat'),
    ...createAminoConverter(MsgInstantiateContractCompat, 'wasmx/MsgInstantiateContractCompat'),
    ...createAminoConverter(MsgExecuteContract, 'wasm/MsgExecuteContract'),
    ...createAminoConverter(MsgStoreCode, 'wasm/MsgStoreCode'),
    ...createAminoConverter(MsgInstantiateContract, 'wasm/MsgInstantiateContract')
  };
}

export function createMapsAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgCreateMap, 'maps/CreateMap'),
    ...createAminoConverter(MsgDeleteMap, 'maps/DeleteMap'),
    ...createAminoConverter(MsgSetValue, 'maps/SetValue'),
    ...createAminoConverter(MsgUpdateMap, 'maps/UpdateMap')
  };
}

export function createAnchorAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgAddCustomData, 'anchor/AddCustomData')
  };
}

export function createDefaultAminoConverters() {
  return {
    ...createDefaultCosmosAminoConverters(),
    ...createBadgesAminoConverters(),
    ...createWasmXAminoConverters(),
    ...createAnchorAminoConverters(),
    ...createMapsAminoConverters()
  };
}

export const AminoTypes = new AminoTypesClass(createDefaultAminoConverters());
