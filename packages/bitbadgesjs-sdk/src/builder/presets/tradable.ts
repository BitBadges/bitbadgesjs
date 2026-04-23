/**
 * Tradable NFTs preset — the single "transferable" approval that
 * enables peer-to-peer transfers on an NFT collection.
 *
 * Tradable is a SHAPE modifier applied on top of an NFT collection —
 * the skill prescribes standards + this approval. Per-token mint
 * approvals (if any) belong to the underlying nft-collection skill.
 */

import { z } from 'zod';
import type { Preset, RenderedApproval } from './types.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];

function renderTransferable(_: Record<string, never>): RenderedApproval {
  return {
    fromListId: '!Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    tokenIds: [{ start: '1', end: MAX_UINT64 }],
    ownershipTimes: FOREVER,
    approvalId: 'transferable-approval',
    uri: '',
    customData: '',
    version: '0',
    approvalCriteria: {}
  };
}

export const TRADABLE_PRESETS: Preset<any>[] = [
  {
    presetId: 'tradable.transferable',
    skillId: 'tradable',
    name: 'Tradable — free peer-to-peer transfer',
    description:
      'The canonical "transferable-approval" that enables marketplace orderbook + user-to-user transfers on NFT collections. fromListId !Mint → toListId All, no criteria. approvalId MUST be exactly "transferable-approval".',
    paramsSchema: z.object({}),
    render: renderTransferable
  }
];
