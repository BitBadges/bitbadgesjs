/**
 * Address List builder — creates a MsgUniversalUpdateCollection for on-chain address lists.
 * @module core/builders/address-list
 */
import {
  FOREVER,
  BURN_ADDRESS,
  buildMsg,
  emptyPermissions,
  mintToBurnBalances,
  defaultBalances
} from './shared.js';

export interface AddressListParams {
  name: string;
  image?: string;
  description?: string;
  manager?: string; // bb1... address that can add/remove members (defaults to creator)
}

export function buildAddressList(params: AddressListParams): any {
  const collectionApprovals = [
    // Manager Add — mint tokens to add addresses
    {
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: params.manager || '',
      approvalId: 'manager-add',
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: mintToBurnBalances(),
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Manager Remove — burn tokens to remove addresses
    {
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: params.manager || '',
      approvalId: 'manager-remove',
      transferTimes: FOREVER,
      tokenIds: [{ start: '1', end: '1' }],
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    }
  ];

  return buildMsg({
    collectionApprovals,
    standards: ['Address List'],
    manager: params.manager || '',
    collectionPermissions: emptyPermissions(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: true
    },
    defaultBalances: defaultBalances({ autoApproveAllIncomingTransfers: true })
  });
}
