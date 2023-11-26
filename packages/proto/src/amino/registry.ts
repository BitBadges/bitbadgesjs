import {
  createDefaultAminoConverters as createDefaultCosmosAminoConverters,
  AminoTypes as AminoTypesClass,
} from '@cosmjs/stargate'
import { createBadgesAminoConverters } from '../proto-types/badges/aminoRegistry'
import { createWasmXAminoConverters } from '../proto-types/wasmx/aminoRegistry'
import {createWasmAminoConverters } from '@cosmjs/cosmwasm-stargate'

export function createDefaultAminoConverters() {
  return {
    ...createDefaultCosmosAminoConverters(),
    ...createBadgesAminoConverters(),
    ...createWasmXAminoConverters(),
    ...createWasmAminoConverters(),
  }
}

export const AminoTypes = new AminoTypesClass(createDefaultAminoConverters())
