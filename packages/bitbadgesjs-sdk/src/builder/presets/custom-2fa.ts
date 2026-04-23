/**
 * Custom-2FA preset. A single mint approval with autoDeletionOptions.allowPurgeIfExpired
 * so tokens with a time-bounded ownershipTime window are auto-cleaned when they expire.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];

const MintParams = z.object({
  managerAddress: z.string().describe('bb1... address that can initiate mints. Use the creator address for simple cases.')
});
type MintParams = z.infer<typeof MintParams>;

function renderMint(p: MintParams): RenderedApproval {
  return {
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: p.managerAddress,
    transferTimes: FOREVER,
    tokenIds: [{ start: '1', end: MAX_UINT64 }],
    ownershipTimes: FOREVER,
    approvalId: '2fa-mint',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {
      overridesFromOutgoingApprovals: true,
      autoDeletionOptions: { allowPurgeIfExpired: true }
    }
  };
}

export const CUSTOM_2FA_PRESETS: Preset<any>[] = [
  {
    presetId: 'custom-2fa.mint',
    skillId: 'custom-2fa',
    name: 'Custom 2FA — mint with auto-purge',
    description:
      'Mint approval with allowPurgeIfExpired:true so time-bounded tokens are auto-cleaned when their ownershipTime window ends. The ownershipTime window is set per-mint via MsgTransferTokens (e.g. now → now + 5*60*1000 ms for a 5-minute 2FA code).',
    paramsSchema: MintParams,
    render: renderMint
  }
];
