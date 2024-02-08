import { AminoConverters } from '@cosmjs/stargate'
import { createAminoConverter } from '../../amino/objectConverter.js'
import { MsgExecuteContractCompat, MsgInstantiateContractCompat, MsgStoreCodeCompat } from '../../proto/wasmx/tx_pb.js'
import { MsgExecuteContract, MsgInstantiateContract, MsgStoreCode } from '../../proto/cosmwasm/wasm/v1/tx_pb.js'

export function createWasmXAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgExecuteContractCompat, 'wasmx/MsgExecuteContractCompat'),
    ...createAminoConverter(MsgStoreCodeCompat, 'wasmx/MsgStoreCodeCompat'),
    ...createAminoConverter(MsgInstantiateContractCompat, 'wasmx/MsgInstantiateContractCompat'),
    ...createAminoConverter(MsgExecuteContract, "wasm/MsgExecuteContract"),
    ...createAminoConverter(MsgStoreCode, "wasm/MsgStoreCode"),
    ...createAminoConverter(MsgInstantiateContract, "wasm/MsgInstantiateContract"),
  }
}
