import {
  AminoTypes as AminoTypesClass,
  createDefaultAminoConverters as createDefaultCosmosAminoConverters,
} from '@cosmjs/stargate'
import { createBadgesAminoConverters } from '../proto-types/badges/aminoRegistry'
import { createProtocolsAminoConverters } from '../proto-types/protocols/aminoRegistry'
import { createWasmXAminoConverters } from '../proto-types/wasmx/aminoRegistry'

export function createDefaultAminoConverters() {
  return {
    ...createDefaultCosmosAminoConverters(),
    ...createBadgesAminoConverters(),
    ...createWasmXAminoConverters(),
    ...createProtocolsAminoConverters(),
  }
}

export const AminoTypes = new AminoTypesClass(createDefaultAminoConverters())
