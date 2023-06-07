import * as badges from '../../../proto/badges/badges'
import * as balances from '../../../proto/badges/balances'
import * as claims from '../../../proto/badges/claims'
import * as ranges from '../../../proto/badges/ranges'
import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'

function deepCopy<T>(obj: T): T {
  return deepCopyWithBigInts(obj);
}

function deepCopyWithBigInts<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    // Base case: return primitive values as-is
    return obj;
  }

  if (Array.isArray(obj)) {
    // Create a deep copy of an array
    return obj.map((item) => deepCopyWithBigInts(item)) as unknown as T;
  }

  // Create a deep copy of an object
  const copiedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copiedObj[key] = deepCopyWithBigInts(obj[key]);
    }
  }
  return copiedObj;
}
/**
 * UserBalance item that serves as the base type for all UserBalance items.
 *
 * @typedef {Object} UserBalance
 * @property {Balance[]} balances - The balances of the user.
 * @property {Approval[]} approvals - The approvals of the user.
 */
export interface UserBalance<T extends NumberType> {
  balances: Balance<T>[];
  approvals: Approval<T>[];
}

export function convertUserBalance<T extends NumberType, U extends NumberType>(balance: UserBalance<T>, convertFunction: (item: T) => U): UserBalance<U> {
  return deepCopy({
    ...balance,
    balances: balance.balances.map((b) => convertBalance(b, convertFunction)),
    approvals: balance.approvals.map((a) => convertApproval(a, convertFunction))
  })
}

/**
 * Approval item that serves as the base type for all Approval items.
 *
 * @typedef {Object} Approval
 * @property {string} address - The address of the user.
 * @property {Balance[]} balances - The approval balances for the address.
 */
export interface Approval<T extends NumberType> {
  address: string;
  balances: Balance<T>[];
}

export function convertApproval<T extends NumberType, U extends NumberType>(approval: Approval<T>, convertFunction: (item: T) => U): Approval<U> {
  return deepCopy({
    ...approval,
    balances: approval.balances.map((b) => convertBalance(b, convertFunction))
  })
}

/**
 * IdRanges are used to represent a range of numbers from some start ID to some end ID.
 *
 * This is typically used to represent a range of badge IDs.
 *
 * @typedef {Object} IdRange
 * @property {NumberType} start - The start of the range.
 * @property {NumberType} end - The end of the range.
 */
export interface IdRange<T extends NumberType> {
  start: T;
  end: T;
}

export function convertIdRange<T extends NumberType, U extends NumberType>(range: IdRange<T>, convertFunction: (item: T) => U): IdRange<U> {
  return deepCopy({
    ...range,
    start: convertFunction(range.start),
    end: convertFunction(range.end)
  })
}

/**
 * BadgeUris are used to represent a URI and a range of badge IDs.
 * If the URI has {id} in it, then the {id} will be replaced with the badge ID.
 *
 * @typedef {Object} BadgeUri
 * @property {string} uri - The URI of the badge.
 * @property {IdRange[]} badgeIds - The badge IDs corresponding to the URI.
 */
export interface BadgeUri<T extends NumberType> {
  uri: string;
  badgeIds: IdRange<T>[]
}

export function convertBadgeUri<T extends NumberType, U extends NumberType>(uri: BadgeUri<T>, convertFunction: (item: T) => U): BadgeUri<U> {
  return deepCopy({
    ...uri,
    badgeIds: uri.badgeIds.map((b) => convertIdRange(b, convertFunction))
  })
}

/**
 * BadgeSupplyAndAmounts are used to represent the amount of a badge to be minted.
 * We create xAMOUNT badges with a supply of xSUPPLY.
 *
 * @typedef {Object} BadgeSupplyAndAmount
 * @property {NumberType} amount - The number of badgea to be minted.
 * @property {NumberType} supply - The supply of the badgea to be minted.
 */
export interface BadgeSupplyAndAmount<T extends NumberType> {
  amount: T;
  supply: T;
}

export function convertBadgeSupplyAndAmount<T extends NumberType, U extends NumberType>(supplyAndAmount: BadgeSupplyAndAmount<T>, convertFunction: (item: T) => U): BadgeSupplyAndAmount<U> {
  return deepCopy({
    ...supplyAndAmount,
    amount: convertFunction(supplyAndAmount.amount),
    supply: convertFunction(supplyAndAmount.supply)
  })
}

/**
 * Balance is used to represent a balance of a badge.
 *
 * @typedef {Object} Balance
 * @property {NumberType} amount - The amount or balance of the badge.
 * @property {IdRange[]} badgeIds - The badge IDs corresponding to the balance.
 */
export interface Balance<T extends NumberType> {
  amount: T;
  badgeIds: IdRange<T>[]
}

export function convertBalance<T extends NumberType, U extends NumberType>(balance: Balance<T>, convertFunction: (item: T) => U): Balance<U> {
  return deepCopy({
    ...balance,
    amount: convertFunction(balance.amount),
    badgeIds: balance.badgeIds.map((b) => convertIdRange(b, convertFunction))
  })
}

/**
 * This is used to represent a list of addresses.
 * If includeOnlySpecified is true, then only the addresses in the list are included.
 * If includeOnlySpecified is false, then all addresses except the ones in the list are included.
 *
 * Can also specify managerOptions to include or exclude the manager. This is because the manager address is dynamic and
 * can change, so we need to be able to include or exclude it dynamically as well.
 *
 * @typedef {Object} AddressesMapping
 * @property {string[]} addresses - The addresses in the list.
 * @property {boolean} includeOnlySpecified - Whether to include only the addresses in the list or all addresses except the ones in the list.
 * @property {NumberType} managerOptions - The manager options for the addresses mapping. 0 = do nothing. 1 = include manager. 2 = exclude manager.
 */
export interface AddressesMapping<T extends NumberType> {
  addresses: string[]
  includeOnlySpecified: boolean
  managerOptions: T;
}

export function convertAddressesMapping<T extends NumberType, U extends NumberType>(mapping: AddressesMapping<T>, convertFunction: (item: T) => U): AddressesMapping<U> {
  return deepCopy({
    ...mapping,
    managerOptions: convertFunction(mapping.managerOptions)
  })
}

/**
 * This is used to represent a mapping of addresses for a transfer from a set of "from" addresses to a set of "to" addresses.
 *
 * @typedef {Object} TransferMapping
 * @property {AddressesMapping} to - The "to" addresses mapping.
 * @property {AddressesMapping} from - The "from" addresses mapping.
 */
export interface TransferMapping<T extends NumberType> {
  to: AddressesMapping<T>
  from: AddressesMapping<T>
}

export function convertTransferMapping<T extends NumberType, U extends NumberType>(mapping: TransferMapping<T>, convertFunction: (item: T) => U): TransferMapping<U> {
  return deepCopy({
    ...mapping,
    to: convertAddressesMapping(mapping.to, convertFunction),
    from: convertAddressesMapping(mapping.from, convertFunction)
  })
}

/**
 * Transfer is used to represent a transfer of badges.
 *
 * @typedef {Object} Transfer
 * @property {string[]} toAddresses - The addresses to transfer to.
 * @property {Balance[]} balances - The balances to transfer.
 */
export interface Transfer<T extends NumberType> {
  toAddresses: string[]
  balances: Balance<T>[]
}

export function convertTransfer<T extends NumberType, U extends NumberType>(transfer: Transfer<T>, convertFunction: (item: T) => U): Transfer<U> {
  return deepCopy({
    ...transfer,
    balances: transfer.balances.map((b) => convertBalance(b, convertFunction))
  })
}

/**
 * Challenge represents a challenge for a claim. For a user to claim a badge, they must provide a solution for all challenges.
 *
 * @typedef {Object} Challenge
 * @property {string} root - The root of the Merkle tree for the challenge.
 * @property {NumberType} expectedProofLength - The expected length of the proof for the challenge. IMPORTANT to prevent preimage attacks.
 * @property {boolean} useCreatorAddressAsLeaf - Whether to use the creator address as the leaf for the challenge.
 */
export interface Challenge<T extends NumberType> {
  expectedProofLength: T;
  root: string
  useCreatorAddressAsLeaf: boolean
}

export function convertChallenge<T extends NumberType, U extends NumberType>(challenge: Challenge<T>, convertFunction: (item: T) => U): Challenge<U> {
  return deepCopy({
    ...challenge,
    expectedProofLength: convertFunction(challenge.expectedProofLength)
  })
}

/**
 * Represents a claim for a badge.
 *
 * @typedef {Object} Claim
 * @property {Balance[]} undistributedBalances - The undistributed balances for the claim.
 * @property {IdRange} timeRange - The time range where users can claim the badge.
 * @property {string} uri - The URI of the badge, providing extra accompanying details.
 * @property {NumberType} numClaimsPerAddress - The maximum number of claims per address.
 * @property {NumberType} incrementIdsBy - The amount to increment the claim IDs in currentClaimAmounts by after each claim.
 * @property {Balance[]} currentClaimAmounts - A counter of the current amounts for the current (next) claim.
 * @property {Challenge[]} challenges - The challenges for the claim. For a user to claim a badge, they must provide a solution for all challenges.
 */
export interface Claim<T extends NumberType> {
  undistributedBalances: Balance<T>[]
  timeRange: IdRange<T>
  numClaimsPerAddress: T;
  incrementIdsBy: T;
  currentClaimAmounts: Balance<T>[]
  challenges: Challenge<T>[]
  uri: string
}

export function convertClaim<T extends NumberType, U extends NumberType>(claim: Claim<T>, convertFunction: (item: T) => U): Claim<U> {
  return deepCopy({
    ...claim,
    undistributedBalances: claim.undistributedBalances.map((b) => convertBalance(b, convertFunction)),
    timeRange: convertIdRange(claim.timeRange, convertFunction),
    numClaimsPerAddress: convertFunction(claim.numClaimsPerAddress),
    incrementIdsBy: convertFunction(claim.incrementIdsBy),
    currentClaimAmounts: claim.currentClaimAmounts.map((b) => convertBalance(b, convertFunction)),
    challenges: claim.challenges.map((c) => convertChallenge(c, convertFunction))
  })
}

/**
 * ChallengeSolution represents a solution to a challenge.
 *
 * @typedef {Object} ChallengeSolution
 * @property {ClaimProof} proof - The proof for the challenge's Merkle tree.
 */
export interface ChallengeSolution {
  proof: ClaimProof
}

/**
 * ClaimProofItem represents an item in a claim Merkle proof.
 *
 * @typedef {Object} ClaimProofItem
 * @property {string} aunt - The aunt of the item.
 * @property {boolean} onRight - Whether the aunt is on the right or left.
 */
export interface ClaimProofItem {
  aunt: string
  onRight: boolean
}

/**
 * ClaimProof represents a Merkle proof for a claim.
 *
 * @typedef {Object} ClaimProof
 * @property {ClaimProofItem[]} aunts - The aunts of the Merkle proof.
 * @property {string} leaf - The leaf of the Merkle proof.
 */
export interface ClaimProof {
  aunts: ClaimProofItem[]
  leaf: string
}

export function convertToProtoBadgeIds<T extends NumberType>(badgeIds: IdRange<T>[]): ranges.bitbadges.bitbadgeschain.badges.IdRange[] {
  const wrappedBadgeIds: ranges.bitbadges.bitbadgeschain.badges.IdRange[] = []
  for (const range of badgeIds) {
    wrappedBadgeIds.push(
      new ranges.bitbadges.bitbadgeschain.badges.IdRange({
        start: range.start.toString(),
        end: range.end.toString(),
      }),
    )
  }

  return wrappedBadgeIds
}

export function convertToProtoBadgeUris<T extends NumberType>(badgeUris: BadgeUri<T>[]): badges.bitbadges.bitbadgeschain.badges.BadgeUri[] {
  const wrappedBadgeUris: badges.bitbadges.bitbadgeschain.badges.BadgeUri[] = [];
  for (const badgeUri of badgeUris) {
    wrappedBadgeUris.push(
      new badges.bitbadges.bitbadgeschain.badges.BadgeUri({
        uri: badgeUri.uri,
        badgeIds: convertToProtoBadgeIds(badgeUri.badgeIds),
      }),
    )
  }

  return wrappedBadgeUris
}


export function convertToProtoBalances<T extends NumberType>(balanceArr: Balance<T>[]): balances.bitbadges.bitbadgeschain.badges.Balance[] {
  const formattedBalances: balances.bitbadges.bitbadgeschain.badges.Balance[] =
    []

  for (const balance of balanceArr) {
    const wrappedBadgeIds = convertToProtoBadgeIds(balance.badgeIds)

    formattedBalances.push(
      new balances.bitbadges.bitbadgeschain.badges.Balance({
        badgeIds: wrappedBadgeIds,
        amount: balance.amount.toString(),
      }),
    )
  }
  return formattedBalances
}

export function convertToProtoProof(proof: ClaimProof) {
  const wrappedAunts: tx.bitbadges.bitbadgeschain.badges.ClaimProofItem[] = []
  for (const aunt of proof.aunts) {
    wrappedAunts.push(
      new tx.bitbadges.bitbadgeschain.badges.ClaimProofItem({
        aunt: aunt.aunt,
        onRight: aunt.onRight,
      }),
    )
  }

  const wrappedProof: tx.bitbadges.bitbadgeschain.badges.ClaimProof =
    new tx.bitbadges.bitbadgeschain.badges.ClaimProof({
      aunts: wrappedAunts,
      leaf: proof.leaf,
    })
  return wrappedProof
}

export function convertToProtoSolutions(solutions: ChallengeSolution[]) {
  const wrappedSolutions: tx.bitbadges.bitbadgeschain.badges.ChallengeSolution[] = [];
  for (const solution of solutions) {
    wrappedSolutions.push(
      new tx.bitbadges.bitbadgeschain.badges.ChallengeSolution({
        proof: convertToProtoProof(solution.proof),
      }),
    )
  }
  return wrappedSolutions
}

export function convertToProtoTransfers<T extends NumberType>(transfers: Transfer<T>[]): tx.bitbadges.bitbadgeschain.badges.Transfer[] {
  const wrappedTransfers: tx.bitbadges.bitbadgeschain.badges.Transfer[] = []
  for (const transfer of transfers) {
    const formattedBalances = convertToProtoBalances(transfer.balances)

    wrappedTransfers.push(
      new tx.bitbadges.bitbadgeschain.badges.Transfer({
        toAddresses: transfer.toAddresses,
        balances: formattedBalances,
      }),
    )
  }
  return wrappedTransfers
}


export function convertToProtoClaims<T extends NumberType>(claimsArr: Claim<T>[]): claims.bitbadges.bitbadgeschain.badges.Claim[] {
  const formattedClaims: claims.bitbadges.bitbadgeschain.badges.Claim[] = []
  for (const claim of claimsArr) {
    formattedClaims.push(
      new claims.bitbadges.bitbadgeschain.badges.Claim({
        undistributedBalances: convertToProtoBalances(claim.undistributedBalances),
        challenges: claim.challenges.map((challenge) => {
          return new claims.bitbadges.bitbadgeschain.badges.Challenge({
            root: challenge.root,
            expectedProofLength: challenge.expectedProofLength.toString(),
            useCreatorAddressAsLeaf: challenge.useCreatorAddressAsLeaf,
          })
        }),
        incrementIdsBy: claim.incrementIdsBy.toString(),
        numClaimsPerAddress: claim.numClaimsPerAddress.toString(),
        currentClaimAmounts: convertToProtoBalances(claim.currentClaimAmounts),
        timeRange: new ranges.bitbadges.bitbadgeschain.badges.IdRange({
          start: claim.timeRange.start.toString(),
          end: claim.timeRange.end.toString(),
        }),
        uri: claim.uri,

      }),
    )
  }
  return formattedClaims
}

export function convertToProtoBadgeSupplysAndAmounts<T extends NumberType>(badgeSupplys: BadgeSupplyAndAmount<T>[]): tx.bitbadges.bitbadgeschain.badges.BadgeSupplyAndAmount[] {
  const wrappedSupplys: tx.bitbadges.bitbadgeschain.badges.BadgeSupplyAndAmount[] =
    []
  for (const supplyObj of badgeSupplys) {
    wrappedSupplys.push(
      new tx.bitbadges.bitbadgeschain.badges.BadgeSupplyAndAmount({
        amount: supplyObj.amount.toString(),
        supply: supplyObj.supply.toString(),
      }),
    )
  }
  return wrappedSupplys
}

export function convertToProtoTransferMappings<T extends NumberType>(transferMappingsArr: TransferMapping<T>[]): ranges.bitbadges.bitbadgeschain.badges.TransferMapping[] {
  const wrappedTransferMappings: ranges.bitbadges.bitbadgeschain.badges.TransferMapping[] =
    []
  for (const transferMapping of transferMappingsArr) {
    wrappedTransferMappings.push(
      new ranges.bitbadges.bitbadgeschain.badges.TransferMapping({
        to: new ranges.bitbadges.bitbadgeschain.badges.AddressesMapping({
          addresses: transferMapping.to.addresses,
          includeOnlySpecified: transferMapping.to.includeOnlySpecified,
          managerOptions: transferMapping.to.managerOptions.toString(),
        }),
        from: new ranges.bitbadges.bitbadgeschain.badges.AddressesMapping({
          addresses: transferMapping.from.addresses,
          includeOnlySpecified: transferMapping.from.includeOnlySpecified,
          managerOptions: transferMapping.from.managerOptions.toString(),
        }),
      }),
    )
  }
  return wrappedTransferMappings
}
