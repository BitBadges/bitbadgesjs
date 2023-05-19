import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import * as claims from '../../../proto/badges/claims'
import * as balances from '../../../proto/badges/balances'
import * as badges from '../../../proto/badges/badges'

export interface UserBalanceBase {
  balances: BalanceBase[];
  approvals: ApprovalBase[];
}

export interface UserBalance extends UserBalanceBase {
  balances: Balance[];
  approvals: Approval[];
}

export interface s_UserBalance extends UserBalanceBase {
  balances: s_Balance[];
  approvals: s_Approval[];
}

export function convertToUserBalance(s_balance: s_UserBalance): UserBalance {
  return {
    ...s_balance,
    balances: s_balance.balances.map(convertToBalance),
    approvals: s_balance.approvals.map(convertToApproval)
  }
}

export function convertFromUserBalance(balance: UserBalance): s_UserBalance {
  return {
    ...balance,
    balances: balance.balances.map(convertFromBalance),
    approvals: balance.approvals.map(convertFromApproval)
  }
}

export interface ApprovalBase {
  address: string;
  balances: BalanceBase[];
}

export interface Approval extends ApprovalBase {
  balances: Balance[];
}

export interface s_Approval extends ApprovalBase {
  balances: s_Balance[];
}

export function convertToApproval(s_approval: s_Approval): Approval {
  return {
    ...s_approval,
    balances: s_approval.balances.map(convertToBalance)
  }
}

export function convertFromApproval(approval: Approval): s_Approval {
  return {
    ...approval,
    balances: approval.balances.map(convertFromBalance)
  }
}

export interface IdRangeBase {
  start: bigint | string;
  end: bigint | string;
}

export interface IdRange extends IdRangeBase {
  start: bigint;
  end: bigint;
}

export interface s_IdRange extends IdRangeBase {
  start: string;
  end: string;
}

export function convertToIdRange(s_range: s_IdRange): IdRange {
  return {
    ...s_range,
    start: BigInt(s_range.start),
    end: BigInt(s_range.end)
  }
}

export function convertFromIdRange(range: IdRange): s_IdRange {
  return {
    ...range,
    start: range.start.toString(),
    end: range.end.toString()
  }
}

export interface BadgeUriBase {
  uri: string
  badgeIds: IdRangeBase[]
}

export interface BadgeUri extends BadgeUriBase {
  badgeIds: IdRange[]
}

export interface s_BadgeUri extends BadgeUriBase {
  badgeIds: s_IdRange[]
}

export function convertToBadgeUri(s_uri: s_BadgeUri): BadgeUri {
  return {
    ...s_uri,
    badgeIds: s_uri.badgeIds.map(convertToIdRange)
  }
}

export function convertFromBadgeUri(uri: BadgeUri): s_BadgeUri {
  return {
    ...uri,
    badgeIds: uri.badgeIds.map(convertFromIdRange)
  }
}

export interface BadgeSupplyAndAmountBase {
  amount: bigint | string;
  supply: bigint | string;
}

export interface BadgeSupplyAndAmount extends BadgeSupplyAndAmountBase {
  amount: bigint;
  supply: bigint;
}

export interface s_BadgeSupplyAndAmount extends BadgeSupplyAndAmountBase {
  amount: string;
  supply: string;
}

export function convertToBadgeSupplyAndAmount(s_supply: s_BadgeSupplyAndAmount): BadgeSupplyAndAmount {
  return {
    ...s_supply,
    amount: BigInt(s_supply.amount),
    supply: BigInt(s_supply.supply)
  }
}

export interface BalanceBase {
  amount: bigint | string;
  badgeIds: IdRangeBase[]
}

export interface Balance extends BalanceBase {
  amount: bigint;
  badgeIds: IdRange[];
}

export interface s_Balance extends BalanceBase {
  amount: string;
  badgeIds: s_IdRange[];
}

export function convertToBalance(s_balance: s_Balance): Balance {
  return {
    ...s_balance,
    amount: BigInt(s_balance.amount),
    badgeIds: s_balance.badgeIds.map(convertToIdRange)
  }
}

export function convertFromBalance(balance: Balance): s_Balance {
  return {
    ...balance,
    amount: balance.amount.toString(),
    badgeIds: balance.badgeIds.map(convertFromIdRange)
  }
}

export interface AddressesMappingBase {
  addresses: string[]
  includeOnlySpecified: boolean
  managerOptions: bigint | string;
}

export interface AddressesMapping extends AddressesMappingBase {
  managerOptions: bigint;
}

export interface s_AddressesMapping extends AddressesMappingBase {
  managerOptions: string;
}

export function convertToAddressesMapping(s_mapping: s_AddressesMapping): AddressesMapping {
  return {
    ...s_mapping,
    managerOptions: BigInt(s_mapping.managerOptions)
  }
}

export function convertFromAddressesMapping(mapping: AddressesMapping): s_AddressesMapping {
  return {
    ...mapping,
    managerOptions: mapping.managerOptions.toString()
  }
}

export interface TransferMappingBase {
  to: AddressesMappingBase
  from: AddressesMappingBase
}

export interface TransferMapping extends TransferMappingBase {
  to: AddressesMapping
  from: AddressesMapping
}

export interface s_TransferMapping extends TransferMappingBase {
  to: s_AddressesMapping
  from: s_AddressesMapping
}

export function convertToTransferMapping(s_mapping: s_TransferMapping): TransferMapping {
  return {
    ...s_mapping,
    to: convertToAddressesMapping(s_mapping.to),
    from: convertToAddressesMapping(s_mapping.from)
  }
}

export function convertFromTransferMapping(mapping: TransferMapping): s_TransferMapping {
  return {
    ...mapping,
    to: convertFromAddressesMapping(mapping.to),
    from: convertFromAddressesMapping(mapping.from)
  }
}

export interface TransferBase {
  toAddresses: string[]
  balances: BalanceBase[]
}

export interface Transfer extends TransferBase {
  balances: Balance[]
}

export interface s_Transfer extends TransferBase {
  balances: s_Balance[]
}

export function convertToTransfer(s_transfer: s_Transfer): Transfer {
  return {
    ...s_transfer,
    balances: s_transfer.balances.map(convertToBalance)
  }
}

export function convertFromTransfer(transfer: Transfer): s_Transfer {
  return {
    ...transfer,
    balances: transfer.balances.map(convertFromBalance)
  }
}

export interface ChallengeBase {
  root: string
  expectedProofLength: bigint | string;
  useCreatorAddressAsLeaf: boolean
}

export interface Challenge extends ChallengeBase {
  expectedProofLength: bigint;
}

export interface s_Challenge extends ChallengeBase {
  expectedProofLength: string;
}

export function convertToChallenge(s_challenge: s_Challenge): Challenge {
  return {
    ...s_challenge,
    expectedProofLength: BigInt(s_challenge.expectedProofLength)
  }
}

export function convertFromChallenge(challenge: Challenge): s_Challenge {
  return {
    ...challenge,
    expectedProofLength: challenge.expectedProofLength.toString()
  }
}

export interface ClaimBase {
  undistributedBalances: BalanceBase[]
  timeRange: IdRangeBase
  uri: string
  numClaimsPerAddress: bigint | string;
  incrementIdsBy: bigint | string;
  currentClaimAmounts: BalanceBase[]
  challenges: ChallengeBase[]
}

export interface Claim extends ClaimBase {
  undistributedBalances: Balance[]
  numClaimsPerAddress: bigint;
  incrementIdsBy: bigint;
  currentClaimAmounts: Balance[]
  challenges: Challenge[]
  timeRange: IdRange
}

export interface s_Claim extends ClaimBase {
  undistributedBalances: s_Balance[]
  numClaimsPerAddress: string;
  incrementIdsBy: string;
  currentClaimAmounts: s_Balance[]
  challenges: s_Challenge[]
  timeRange: s_IdRange
}

export function convertToClaim(s_claim: s_Claim): Claim {
  return {
    ...s_claim,
    undistributedBalances: s_claim.undistributedBalances.map(convertToBalance),
    numClaimsPerAddress: BigInt(s_claim.numClaimsPerAddress),
    incrementIdsBy: BigInt(s_claim.incrementIdsBy),
    currentClaimAmounts: s_claim.currentClaimAmounts.map(convertToBalance),
    challenges: s_claim.challenges.map(convertToChallenge),
    timeRange: convertToIdRange(s_claim.timeRange)
  }
}

export function convertFromClaim(claim: Claim): s_Claim {
  return {
    ...claim,
    undistributedBalances: claim.undistributedBalances.map(convertFromBalance),
    numClaimsPerAddress: claim.numClaimsPerAddress.toString(),
    incrementIdsBy: claim.incrementIdsBy.toString(),
    currentClaimAmounts: claim.currentClaimAmounts.map(convertFromBalance),
    challenges: claim.challenges.map(convertFromChallenge),
    timeRange: convertFromIdRange(claim.timeRange)
  }
}

export interface ChallengeSolution {
  proof: ClaimProof
}

interface ClaimProofItem {
  aunt: string
  onRight: boolean
}

export interface ClaimProof {
  aunts: ClaimProofItem[]
  leaf: string
}

export function getWrappedBadgeIds(badgeIds: IdRange[]) {
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

export function getWrappedBadgeUris(badgeUris: BadgeUri[]) {
  const wrappedBadgeUris: badges.bitbadges.bitbadgeschain.badges.BadgeUri[] = [];
  for (const badgeUri of badgeUris) {
    wrappedBadgeUris.push(
      new badges.bitbadges.bitbadgeschain.badges.BadgeUri({
        uri: badgeUri.uri,
        badgeIds: getWrappedBadgeIds(badgeUri.badgeIds),
      }),
    )
  }

  return wrappedBadgeUris
}


export function getWrappedBalances(balanceArr: Balance[]) {
  const formattedBalances: balances.bitbadges.bitbadgeschain.badges.Balance[] =
    []

  for (const balance of balanceArr) {
    const wrappedBadgeIds = getWrappedBadgeIds(balance.badgeIds)

    formattedBalances.push(
      new balances.bitbadges.bitbadgeschain.badges.Balance({
        badgeIds: wrappedBadgeIds,
        amount: balance.amount.toString(),
      }),
    )
  }
  return formattedBalances
}

export function getWrappedProof(proof: ClaimProof) {
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

export function getWrappedSolutions(solutions: ChallengeSolution[]) {
  const wrappedSolutions: tx.bitbadges.bitbadgeschain.badges.ChallengeSolution[] = [];
  for (const solution of solutions) {
    wrappedSolutions.push(
      new tx.bitbadges.bitbadgeschain.badges.ChallengeSolution({
        proof: getWrappedProof(solution.proof),
      }),
    )
  }
  return wrappedSolutions
}

export function getWrappedTransfers(transfers: Transfer[]) {
  const wrappedTransfers: tx.bitbadges.bitbadgeschain.badges.Transfer[] = []
  for (const transfer of transfers) {
    const formattedBalances = getWrappedBalances(transfer.balances)

    wrappedTransfers.push(
      new tx.bitbadges.bitbadgeschain.badges.Transfer({
        toAddresses: transfer.toAddresses,
        balances: formattedBalances,
      }),
    )
  }
  return wrappedTransfers
}


export function getWrappedClaims(claimsArr: Claim[]) {
  const formattedClaims: claims.bitbadges.bitbadgeschain.badges.Claim[] = []
  for (const claim of claimsArr) {
    formattedClaims.push(
      new claims.bitbadges.bitbadgeschain.badges.Claim({
        undistributedBalances: getWrappedBalances(claim.undistributedBalances),
        challenges: claim.challenges.map((challenge) => {
          return new claims.bitbadges.bitbadgeschain.badges.Challenge({
            root: challenge.root,
            expectedProofLength: challenge.expectedProofLength.toString(),
            useCreatorAddressAsLeaf: challenge.useCreatorAddressAsLeaf,
          })
        }),
        incrementIdsBy: claim.incrementIdsBy.toString(),
        numClaimsPerAddress: claim.numClaimsPerAddress.toString(),
        currentClaimAmounts: getWrappedBalances(claim.currentClaimAmounts),
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

export function getWrappedBadgeSupplysAndAmounts(
  badgeSupplys: BadgeSupplyAndAmount[],
) {
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

export function getWrappedTransferMappings(
  transferMappingsArr: TransferMapping[],
) {
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
