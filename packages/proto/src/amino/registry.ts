import {
  createDefaultAminoConverters as createDefaultCosmosAminoConverters,
  AminoTypes as AminoTypesClass,
} from '@cosmjs/stargate'
import { createBadgesAminoConverters } from '../proto-types/badges/aminoRegistry'

// TODO: Add missing Amino types (see x/**/codec.go)

export function createDefaultAminoConverters() {
  return {
    ...createDefaultCosmosAminoConverters(),
    ...createBadgesAminoConverters(),
  }
}

export const AminoTypes = new AminoTypesClass(createDefaultAminoConverters())
