import {
  BALANCE_OBJECT_TYPE,
  IdRange,
  ID_RANGE_TYPE,
  SubassetAmountAndSupply,
  SUBASSET_AMOUNT_AND_SUPPLY_TYPE,
  UriObject,
  URI_OBJECT_TYPE,
  WhitelistMintInfo,
  WHITELIST_MINT_INFO_TYPE,
} from './typeUtils'

const NewBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'uri', type: 'UriObject' },
  { name: 'arbitraryBytes', type: 'string' },
  { name: 'permissions', type: 'uint64' },
  { name: 'defaultSubassetSupply', type: 'uint64' },
  { name: 'freezeAddressRanges', type: 'IdRange[]' },
  { name: 'standard', type: 'uint64' },
  { name: 'subassetSupplysAndAmounts', type: 'SubassetAmountAndSupply[]' },
  { name: 'whitelistedRecipients', type: 'WhitelistMintInfo[]' },
]

export const MSG_NEW_BADGE_TYPES = {
  UriObject: URI_OBJECT_TYPE,
  IdRange: ID_RANGE_TYPE,
  MsgValue: NewBadgeMsgValueType,
  WhitelistMintInfo: WHITELIST_MINT_INFO_TYPE,
  BalanceObject: BALANCE_OBJECT_TYPE,
  SubassetAmountAndSupply: SUBASSET_AMOUNT_AND_SUPPLY_TYPE,
}

export function createMsgNewBadge(
  creator: string,
  uri: UriObject,
  arbitraryBytes: string,
  permissions: number,
  defaultSubassetSupply: number,
  freezeAddressRanges: IdRange[],
  standard: number,
  subassetSupplysAndAmounts: SubassetAmountAndSupply[],
  whitelistedRecipients: WhitelistMintInfo[],
) {
  return {
    type: 'badges/NewBadge',
    value: {
      creator,
      uri,
      arbitraryBytes,
      permissions,
      defaultSubassetSupply,
      freezeAddressRanges,
      standard,
      subassetSupplysAndAmounts,
      whitelistedRecipients,
    },
  }
}
