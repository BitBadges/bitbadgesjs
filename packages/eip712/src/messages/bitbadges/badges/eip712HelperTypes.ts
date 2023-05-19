export const BADGE_URI_TYPES = [
  { name: 'uri', type: 'string' },
  { name: 'badgeIds', type: 'IdRange[]' },
]

export const TRANSFER_MAPPING_TYPES = [
  { name: 'from', type: 'Addresses' },
  { name: 'to', type: 'Addresses' },
]

export const ADDRESSES_MAPPING_TYPES = [
  { name: 'addresses', type: 'string[]' },
  { name: 'includeOnlySpecified', type: 'bool' },
  { name: 'managerOptions', type: 'string' },
]

export const ID_RANGE_TYPES = [
  { name: 'start', type: 'string' },
  { name: 'end', type: 'string' },
]

export const BALANCE_TYPES = [
  { name: 'amount', type: 'string' },
  { name: 'badgeIds', type: 'IdRange[]' },
]

export const BADGE_SUPPLY_AND_AMOUNT_TYPES = [
  { name: 'supply', type: 'string' },
  { name: 'amount', type: 'string' },
]

export const TRANSFERS_TYPES = [
  { name: 'toAddresses', type: 'string[]' },
  { name: 'balances', type: 'Balance[]' },
]

export const CHALLENGE_SOLUTION_TYPES = [
  { name: 'proof', type: 'ClaimProof' },
]

export const CHALLENGE_TYPES = [
  { name: 'root', type: 'string' },
  { name: 'expectedProofLength', type: 'string' },
  { name: 'useCreatorAddressAsLeaf', type: 'bool' },
]

export const CLAIMS_TYPES = [
  { name: 'undistributedBalances', type: 'Balance[]' },
  { name: 'timeRange', type: 'IdRange' },
  { name: 'uri', type: 'string' },
  { name: 'numClaimsPerAddress', type: 'string' },
  { name: 'incrementIdsBy', type: 'string' },
  { name: 'currentClaimAmounts', type: 'Balance[]' },
  { name: 'challenges', type: 'Challenge[]' },
]

export const CLAIM_PROOF_TYPES = [
  { name: 'aunts', type: 'ClaimProofItem[]' },
  { name: 'leaf', type: 'string' },
]

export const CLAIM_PROOF_ITEM_TYPES = [
  { name: 'aunt', type: 'string' },
  { name: 'onRight', type: 'bool' },
]
