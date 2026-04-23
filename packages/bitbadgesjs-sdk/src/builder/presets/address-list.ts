/**
 * Address List presets.
 *
 * Address-list collections represent list membership as token ownership
 * (owning x1 of token ID 1 = on the list). Two approvals form the
 * canonical shape:
 *   - manager-add    — Mint → anyone, minted by creator
 *   - manager-remove — anyone (!Mint) → burn address, forced by creator
 *
 * Frontend depends on the exact approvalId strings and the exact
 * shapes; these presets encode both.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];
const TOKEN_ID_1 = [{ start: '1', end: '1' }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

const CreatorOnlyParams = z.object({
  creatorAddress: z
    .string()
    .describe('bb1... address of the list manager. Used as the singleton initiatedByListId — only this address can add/remove members.')
});
type CreatorOnlyParams = z.infer<typeof CreatorOnlyParams>;

function renderManagerAdd(p: CreatorOnlyParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: p.creatorAddress,
    transferTimes: FOREVER,
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER,
    uri: 'ipfs://METADATA_APPROVAL_manager-add',
    customData: '',
    approvalId: 'manager-add',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true
    }
  };
}

function renderManagerRemove(p: CreatorOnlyParams): RenderedApproval {
  return {
    fromListId: '!Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: p.creatorAddress,
    transferTimes: FOREVER,
    tokenIds: TOKEN_ID_1,
    ownershipTimes: FOREVER,
    uri: 'ipfs://METADATA_APPROVAL_manager-remove',
    customData: '',
    approvalId: 'manager-remove',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true
    }
  };
}

export const ADDRESS_LIST_PRESETS: Preset<any>[] = [
  {
    presetId: 'address-list.manager-add',
    skillId: 'address-list',
    name: 'Address List — manager-add approval',
    description:
      'Approval that lets the manager mint x1 of token ID 1 to any address = add that address to the list. fromListId=Mint, toListId=All, initiatedByListId=creator.',
    paramsSchema: CreatorOnlyParams,
    render: renderManagerAdd
  },
  {
    presetId: 'address-list.manager-remove',
    skillId: 'address-list',
    name: 'Address List — manager-remove approval',
    description:
      'Approval that lets the manager forcefully burn x1 of token ID 1 from any holder = remove that address from the list. fromListId=!Mint, toListId=burn-address, initiatedByListId=creator. Requires overridesFromOutgoingApprovals:true; pair with an invariants config that does NOT set noForcefulPostMintTransfers (that invariant blocks this override).',
    paramsSchema: CreatorOnlyParams,
    render: renderManagerRemove
  }
];
