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
  /**
   * Creator address — used as the default manager when `manager` isn't
   * specified. The CLI passes this through from `--creator`. If neither
   * `manager` nor `creator` is provided, the builder leaves the field
   * empty and the CLI emit()'s defensive pass will fill it in from the
   * post-build `creator` it sets on the message itself.
   */
  creator?: string;
}

export function buildAddressList(params: AddressListParams): any {
  // Default the list manager to the creator when not explicitly set.
  // An address-list MUST have a non-empty initiatedByListId on its
  // approvals — the chain rejects "" with "initiated by list id is
  // uninitialized" — so we have to pick a sensible default rather than
  // leave it blank.
  const initiatedBy = params.manager || params.creator || '';
  const collectionApprovals = [
    // Manager Add — mint tokens to add addresses
    {
      fromListId: 'Mint',
      toListId: 'All',
      initiatedByListId: initiatedBy,
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
    // Manager Remove — burn tokens to remove addresses. fromListId is
    // `'!Mint'` (NOT `'All'`) because the chain rejects `'All'` here
    // with "Mint address cannot be included in address list with other
    // addresses" (validate at msg_server_universal_update_collection.go:146).
    // The earlier skill-audit suggestion to use `'All'` was wrong; the
    // chain enforces the exclusion of Mint from address-list approvals.
    {
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: initiatedBy,
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
