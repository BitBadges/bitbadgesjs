import * as badges from '../../../proto/badges/badges'
import * as balances from '../../../proto/badges/balances'
import * as claims from '../../../proto/badges/claims'
import * as ranges from '../../../proto/badges/ranges'
import * as tx from '../../../proto/badges/tx'
import { NumberType, StringNumber } from './string-numbers'

/**
 * UserBalance item that serves as the base type for all UserBalance items.
 *
 * @typedef {Object} UserBalanceWithType
 * @property {BalanceWithType[]} balances - The balances of the user.
 * @property {ApprovalWithType[]} approvals - The approvals of the user.
 */
export interface UserBalanceWithType<T extends NumberType> {
  balances: BalanceWithType<T>[];
  approvals: ApprovalWithType<T>[];
}

export type UserBalance = UserBalanceWithType<bigint>;
export type s_UserBalance = UserBalanceWithType<string>;
export type n_UserBalance = UserBalanceWithType<number>;
export type d_UserBalance = UserBalanceWithType<StringNumber>;

export function convertUserBalance<T extends NumberType, U extends NumberType>(balance: UserBalanceWithType<T>, convertFunction: (item: T) => U): UserBalanceWithType<U> {
  return {
    ...balance,
    balances: balance.balances.map((b) => convertBalance(b, convertFunction)),
    approvals: balance.approvals.map((a) => convertApproval(a, convertFunction))
  }
}

/**
 * Approval item that serves as the base type for all Approval items.
 *
 * @typedef {Object} ApprovalWithType
 * @property {string} address - The address of the user.
 * @property {BalanceWithType[]} balances - The approval balances for the address.
 */
export interface ApprovalWithType<T extends NumberType> {
  address: string;
  balances: BalanceWithType<T>[];
}

export type Approval = ApprovalWithType<bigint>;
export type s_Approval = ApprovalWithType<string>;
export type n_Approval = ApprovalWithType<number>;
export type d_Approval = ApprovalWithType<StringNumber>;

export function convertApproval<T extends NumberType, U extends NumberType>(approval: ApprovalWithType<T>, convertFunction: (item: T) => U): ApprovalWithType<U> {
  return {
    ...approval,
    balances: approval.balances.map((b) => convertBalance(b, convertFunction))
  }
}

/**
 * IdRanges are used to represent a range of numbers from some start ID to some end ID.
 *
 * This is typically used to represent a range of badge IDs.
 *
 * @typedef {Object} IdRangeWithType
 * @property {NumberType} start - The start of the range.
 * @property {NumberType} end - The end of the range.
 */
export interface IdRangeWithType<T extends NumberType> {
  start: T;
  end: T;
}

export type IdRange = IdRangeWithType<bigint>;
export type s_IdRange = IdRangeWithType<string>;
export type n_IdRange = IdRangeWithType<number>;
export type d_IdRange = IdRangeWithType<StringNumber>;

export function convertIdRange<T extends NumberType, U extends NumberType>(range: IdRangeWithType<T>, convertFunction: (item: T) => U): IdRangeWithType<U> {
  return {
    ...range,
    start: convertFunction(range.start),
    end: convertFunction(range.end)
  }
}

/**
 * BadgeUris are used to represent a URI and a range of badge IDs.
 * If the URI has {id} in it, then the {id} will be replaced with the badge ID.
 *
 * @typedef {Object} BadgeUriWithType
 * @property {string} uri - The URI of the badge.
 * @property {IdRangeWithType[]} badgeIds - The badge IDs corresponding to the URI.
 */
export interface BadgeUriWithType<T extends NumberType> {
  uri: string;
  badgeIds: IdRangeWithType<T>[]
}

export type BadgeUri = BadgeUriWithType<bigint>;
export type s_BadgeUri = BadgeUriWithType<string>;
export type n_BadgeUri = BadgeUriWithType<number>;
export type d_BadgeUri = BadgeUriWithType<StringNumber>;

export function convertBadgeUri<T extends NumberType, U extends NumberType>(uri: BadgeUriWithType<T>, convertFunction: (item: T) => U): BadgeUriWithType<U> {
  return {
    ...uri,
    badgeIds: uri.badgeIds.map((b) => convertIdRange(b, convertFunction))
  }
}

/**
 * BadgeSupplyAndAmounts are used to represent the amount of a badge to be minted.
 * We create xAMOUNT badges with a supply of xSUPPLY.
 *
 * @typedef {Object} BadgeSupplyAndAmountWithType
 * @property {NumberType} amount - The number of badgea to be minted.
 * @property {NumberType} supply - The supply of the badgea to be minted.
 */
export interface BadgeSupplyAndAmountWithType<T extends NumberType> {
  amount: T;
  supply: T;
}

export type BadgeSupplyAndAmount = BadgeSupplyAndAmountWithType<bigint>;
export type s_BadgeSupplyAndAmount = BadgeSupplyAndAmountWithType<string>;
export type n_BadgeSupplyAndAmount = BadgeSupplyAndAmountWithType<number>;
export type d_BadgeSupplyAndAmount = BadgeSupplyAndAmountWithType<StringNumber>;

export function convertBadgeSupplyAndAmount<T extends NumberType, U extends NumberType>(supplyAndAmount: BadgeSupplyAndAmountWithType<T>, convertFunction: (item: T) => U): BadgeSupplyAndAmountWithType<U> {
  return {
    ...supplyAndAmount,
    amount: convertFunction(supplyAndAmount.amount),
    supply: convertFunction(supplyAndAmount.supply)
  }
}

/**
 * BalanceWithType is used to represent a balance of a badge.
 *
 * @typedef {Object} BalanceWithType
 * @property {NumberType} amount - The amount or balance of the badge.
 * @property {IdRangeWithType[]} badgeIds - The badge IDs corresponding to the balance.
 */
export interface BalanceWithType<T extends NumberType> {
  amount: T;
  badgeIds: IdRangeWithType<T>[]
}

export type Balance = BalanceWithType<bigint>;
export type s_Balance = BalanceWithType<string>;
export type n_Balance = BalanceWithType<number>;
export type d_Balance = BalanceWithType<StringNumber>;

export function convertBalance<T extends NumberType, U extends NumberType>(balance: BalanceWithType<T>, convertFunction: (item: T) => U): BalanceWithType<U> {
  return {
    ...balance,
    amount: convertFunction(balance.amount),
    badgeIds: balance.badgeIds.map((b) => convertIdRange(b, convertFunction))
  }
}

/**
 * This is used to represent a list of addresses.
 * If includeOnlySpecified is true, then only the addresses in the list are included.
 * If includeOnlySpecified is false, then all addresses except the ones in the list are included.
 *
 * Can also specify managerOptions to include or exclude the manager. This is because the manager address is dynamic and
 * can change, so we need to be able to include or exclude it dynamically as well.
 *
 * @typedef {Object} AddressesMappingWithType
 * @property {string[]} addresses - The addresses in the list.
 * @property {boolean} includeOnlySpecified - Whether to include only the addresses in the list or all addresses except the ones in the list.
 * @property {NumberType} managerOptions - The manager options for the addresses mapping. 0 = do nothing. 1 = include manager. 2 = exclude manager.
 */
export interface AddressesMappingWithType<T extends NumberType> {
  addresses: string[]
  includeOnlySpecified: boolean
  managerOptions: T;
}

export type AddressesMapping = AddressesMappingWithType<bigint>;
export type s_AddressesMapping = AddressesMappingWithType<string>;
export type n_AddressesMapping = AddressesMappingWithType<number>;
export type d_AddressesMapping = AddressesMappingWithType<StringNumber>;

export function convertAddressesMapping<T extends NumberType, U extends NumberType>(mapping: AddressesMappingWithType<T>, convertFunction: (item: T) => U): AddressesMappingWithType<U> {
  return {
    ...mapping,
    managerOptions: convertFunction(mapping.managerOptions)
  }
}

/**
 * This is used to represent a mapping of addresses for a transfer from a set of "from" addresses to a set of "to" addresses.
 *
 * @typedef {Object} TransferMappingWithType
 * @property {AddressesMappingWithType} to - The "to" addresses mapping.
 * @property {AddressesMappingWithType} from - The "from" addresses mapping.
 */
export interface TransferMappingWithType<T extends NumberType> {
  to: AddressesMappingWithType<T>
  from: AddressesMappingWithType<T>
}

export type TransferMapping = TransferMappingWithType<bigint>;
export type s_TransferMapping = TransferMappingWithType<string>;
export type n_TransferMapping = TransferMappingWithType<number>;
export type d_TransferMapping = TransferMappingWithType<StringNumber>;

export function convertTransferMapping<T extends NumberType, U extends NumberType>(mapping: TransferMappingWithType<T>, convertFunction: (item: T) => U): TransferMappingWithType<U> {
  return {
    ...mapping,
    to: convertAddressesMapping(mapping.to, convertFunction),
    from: convertAddressesMapping(mapping.from, convertFunction)
  }
}

/**
 * TransferWithType is used to represent a transfer of badges.
 *
 * @typedef {Object} TransferWithType
 * @property {string[]} toAddresses - The addresses to transfer to.
 * @property {BalanceWithType[]} balances - The balances to transfer.
 */
export interface TransferWithType<T extends NumberType> {
  toAddresses: string[]
  balances: BalanceWithType<T>[]
}

export type Transfer = TransferWithType<bigint>;
export type s_Transfer = TransferWithType<string>;
export type n_Transfer = TransferWithType<number>;
export type d_Transfer = TransferWithType<StringNumber>;

export function convertTransfer<T extends NumberType, U extends NumberType>(transfer: TransferWithType<T>, convertFunction: (item: T) => U): TransferWithType<U> {
  return {
    ...transfer,
    balances: transfer.balances.map((b) => convertBalance(b, convertFunction))
  }
}

/**
 * ChallengeWithType represents a challenge for a claim. For a user to claim a badge, they must provide a solution for all challenges.
 *
 * @typedef {Object} ChallengeWithType
 * @property {string} root - The root of the Merkle tree for the challenge.
 * @property {NumberType} expectedProofLength - The expected length of the proof for the challenge. IMPORTANT to prevent preimage attacks.
 * @property {boolean} useCreatorAddressAsLeaf - Whether to use the creator address as the leaf for the challenge.
 */
export interface ChallengeWithType<T extends NumberType> {
  expectedProofLength: T;
  root: string
  useCreatorAddressAsLeaf: boolean
}

export type Challenge = ChallengeWithType<bigint>;
export type s_Challenge = ChallengeWithType<string>;
export type n_Challenge = ChallengeWithType<number>;
export type d_Challenge = ChallengeWithType<StringNumber>;

export function convertChallenge<T extends NumberType, U extends NumberType>(challenge: ChallengeWithType<T>, convertFunction: (item: T) => U): ChallengeWithType<U> {
  return {
    ...challenge,
    expectedProofLength: convertFunction(challenge.expectedProofLength)
  }
}

/**
 * Represents a claim for a badge.
 *
 * @typedef {Object} ClaimWithType
 * @property {BalanceWithType[]} undistributedBalances - The undistributed balances for the claim.
 * @property {IdRangeWithType} timeRange - The time range where users can claim the badge.
 * @property {string} uri - The URI of the badge, providing extra accompanying details.
 * @property {NumberType} numClaimsPerAddress - The maximum number of claims per address.
 * @property {NumberType} incrementIdsBy - The amount to increment the claim IDs in currentClaimAmounts by after each claim.
 * @property {BalanceWithType[]} currentClaimAmounts - A counter of the current amounts for the current (next) claim.
 * @property {ChallengeWithType[]} challenges - The challenges for the claim. For a user to claim a badge, they must provide a solution for all challenges.
 */
export interface ClaimWithType<T extends NumberType> {
  undistributedBalances: BalanceWithType<T>[]
  timeRange: IdRangeWithType<T>
  numClaimsPerAddress: T;
  incrementIdsBy: T;
  currentClaimAmounts: BalanceWithType<T>[]
  challenges: ChallengeWithType<T>[]
  uri: string
}

export type Claim = ClaimWithType<bigint>;
export type s_Claim = ClaimWithType<string>;
export type n_Claim = ClaimWithType<number>;
export type d_Claim = ClaimWithType<StringNumber>;

export function convertClaim<T extends NumberType, U extends NumberType>(claim: ClaimWithType<T>, convertFunction: (item: T) => U): ClaimWithType<U> {
  return {
    ...claim,
    undistributedBalances: claim.undistributedBalances.map((b) => convertBalance(b, convertFunction)),
    timeRange: convertIdRange(claim.timeRange, convertFunction),
    numClaimsPerAddress: convertFunction(claim.numClaimsPerAddress),
    incrementIdsBy: convertFunction(claim.incrementIdsBy),
    currentClaimAmounts: claim.currentClaimAmounts.map((b) => convertBalance(b, convertFunction)),
    challenges: claim.challenges.map((c) => convertChallenge(c, convertFunction))
  }
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

export function convertToProtoBadgeIds<T extends NumberType>(badgeIds: IdRangeWithType<T>[]): ranges.bitbadges.bitbadgeschain.badges.IdRange[] {
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

export function convertToProtoBadgeUris<T extends NumberType>(badgeUris: BadgeUriWithType<T>[]): badges.bitbadges.bitbadgeschain.badges.BadgeUri[] {
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


export function convertToProtoBalances<T extends NumberType>(balanceArr: BalanceWithType<T>[]): balances.bitbadges.bitbadgeschain.badges.Balance[] {
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

export function convertToProtoTransfers<T extends NumberType>(transfers: TransferWithType<T>[]): tx.bitbadges.bitbadgeschain.badges.Transfer[] {
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


export function convertToProtoClaims<T extends NumberType>(claimsArr: ClaimWithType<T>[]): claims.bitbadges.bitbadgeschain.badges.Claim[] {
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

export function convertToProtoBadgeSupplysAndAmounts<T extends NumberType>(badgeSupplys: BadgeSupplyAndAmountWithType<T>[]): tx.bitbadges.bitbadgeschain.badges.BadgeSupplyAndAmount[] {
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

export function convertToProtoTransferMappings<T extends NumberType>(transferMappingsArr: TransferMappingWithType<T>[]): ranges.bitbadges.bitbadgeschain.badges.TransferMapping[] {
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
