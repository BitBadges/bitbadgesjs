import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import * as claims from '../../../proto/badges/claims'
import * as balances from '../../../proto/badges/balances'

export interface IdRange {
  start: number
  end?: number
}

export interface BadgeSupplyAndAmount {
  amount: number
  supply: number
}

export interface Balance {
  balance: number
  badgeIds: IdRange[]
}

export interface Addresses {
  accountNums: IdRange[]
  options: number
}

export interface TransferMapping {
  to: Addresses
  from: Addresses
}

export interface Transfers {
  toAddresses: number[]
  balances: Balance[]
}

export interface Claims {
  balances: Balance[]
  amountPerClaim: number
  badgeIds: IdRange[]
  incrementIdsBy: number
  type: number
  data: string
  uri: string
  timeRange: IdRange
}

interface ProofItem {
  aunt: string
  onRight: boolean
}

export interface Proof {
  aunts: ProofItem[]
  leaf: string
}

export function getWrappedBadgeIds(badgeIds: IdRange[]) {
  const wrappedBadgeIds: ranges.bitbadges.bitbadgeschain.badges.IdRange[] = []
  for (const range of badgeIds) {
    wrappedBadgeIds.push(
      new ranges.bitbadges.bitbadgeschain.badges.IdRange(range),
    )
  }

  return wrappedBadgeIds
}

export function getWrappedBalances(balanceArr: Balance[]) {
  const formattedBalances: balances.bitbadges.bitbadgeschain.badges.Balance[] =
    []

  for (const balance of balanceArr) {
    const wrappedBadgeIds = getWrappedBadgeIds(balance.badgeIds)

    formattedBalances.push(
      new balances.bitbadges.bitbadgeschain.badges.Balance({
        badgeIds: wrappedBadgeIds,
        balance: balance.balance,
      }),
    )
  }
  return formattedBalances
}

export function getWrappedProof(proof: Proof) {
  const wrappedAunts: tx.bitbadges.bitbadgeschain.badges.ProofItem[] = []
  for (const aunt of proof.aunts) {
    wrappedAunts.push(
      new tx.bitbadges.bitbadgeschain.badges.ProofItem({
        aunt: aunt.aunt,
        onRight: aunt.onRight,
      }),
    )
  }

  const wrappedProof: tx.bitbadges.bitbadgeschain.badges.Proof =
    new tx.bitbadges.bitbadgeschain.badges.Proof({
      aunts: wrappedAunts,
      leaf: proof.leaf,
    })
  return wrappedProof
}

export function getWrappedTransfers(transfers: Transfers[]) {
  const wrappedTransfers: tx.bitbadges.bitbadgeschain.badges.Transfers[] = []
  for (const transfer of transfers) {
    const formattedBalances = getWrappedBalances(transfer.balances)

    wrappedTransfers.push(
      new tx.bitbadges.bitbadgeschain.badges.Transfers({
        toAddresses: transfer.toAddresses,
        balances: formattedBalances,
      }),
    )
  }
  return wrappedTransfers
}

export function getWrappedClaims(claimsArr: Claims[]) {
  const formattedClaims: claims.bitbadges.bitbadgeschain.badges.Claim[] = []
  for (const claim of claimsArr) {
    formattedClaims.push(
      new claims.bitbadges.bitbadgeschain.badges.Claim({
        badgeIds: getWrappedBadgeIds(claim.badgeIds),
        incrementIdsBy: claim.incrementIdsBy,
        balances: getWrappedBalances(claim.balances),

        amountPerClaim: claim.amountPerClaim,
        type: claim.type,
        data: claim.data,
        uri: claim.uri,
        timeRange: new ranges.bitbadges.bitbadgeschain.badges.IdRange({
          start: claim.timeRange.start,
          end: claim.timeRange.end,
        }),
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
      new tx.bitbadges.bitbadgeschain.badges.BadgeSupplyAndAmount(supplyObj),
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
        to: new ranges.bitbadges.bitbadgeschain.badges.Addresses({
          accountNums: getWrappedBadgeIds(transferMapping.to.accountNums),
          options: transferMapping.to.options,
        }),
        from: new ranges.bitbadges.bitbadgeschain.badges.Addresses({
          accountNums: getWrappedBadgeIds(transferMapping.from.accountNums),
          options: transferMapping.from.options,
        }),
      }),
    )
  }
  return wrappedTransferMappings
}
