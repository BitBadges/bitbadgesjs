/**
 * Integration: `bb nfts` pure-emit verification.
 *
 * Personas:
 *   - alice → bidder / lister / buyer / seller (does the emitting)
 *   - charlie → counterparty address in buy / sell fills
 *
 * NFTs aren't a token *standard* — they're an orderbook overlay on any
 * collection. Bid/listing approvals + buy/sell fills are emit-only verbs
 * that don't need a live collection to *emit*; they only need a collection
 * to *deploy against*. Deploying requires standing up a collection first,
 * which is expensive + flaky for a per-PR test.
 *
 * So this spec verifies the EMIT shapes only — the CLI surface, default
 * values, range-expansion for collection-wide bids, prioritized-approval
 * routing on fill messages, and side-flag plumbing on cancel. No
 * `fundPersona` and no `deployMsgViaKeyring`. Fast.
 *
 * The chain-binary preflight still runs (it's part of preflightIntegration)
 * — we skip if the harness can't even resolve personas, since the CLI
 * still needs alice's address as input.
 */

import { preflightIntegration } from './harness/preflight.js';
import { alice, charlie } from './harness/personas.js';
import { runCli } from './harness/cli.js';

const COLLECTION_ID = '1';
const TOKEN_ID = '5';
const UINT64_MAX = '18446744073709551615';

describe('nfts integration (pure-emit)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = (await preflightIntegration()).ok;
  }, 30000);

  it('bid on a specific token emits MsgSetIncomingApproval with single token range', () => {
    if (!ready) return;
    const bidder = alice();
    const out = runCli([
      'nfts', 'bid', COLLECTION_ID,
      '--creator', bidder.address,
      '--price', '1000',
      '--denom', 'ubadge',
      '--token-id', '1',
      '--local'
    ]);
    expect(out.json.typeUrl).toBe('/tokenization.MsgSetIncomingApproval');
    expect(out.json.value.creator).toBe(bidder.address);
    expect(out.json.value.collectionId).toBe(COLLECTION_ID);
    const approval = out.json.value.approval;
    expect(approval.tokenIds).toEqual([{ start: '1', end: '1' }]);
    expect(approval.approvalCriteria.coinTransfers[0].coins[0].amount).toBe('1000');
    expect(approval.approvalCriteria.coinTransfers[0].coins[0].denom).toBe('ubadge');
    // Single-token bid → after-one-use auto-delete should be true.
    expect(approval.approvalCriteria.autoDeletionOptions.afterOneUse).toBe(true);
    // Should NOT allow overriding to any token (this is a targeted bid).
    expect(
      approval.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideWithAnyValidToken
    ).toBe(false);
  });

  it('collection-wide bid (no --token-id) emits FullRanges + allowOverrideWithAnyValidToken', () => {
    if (!ready) return;
    const bidder = alice();
    const out = runCli([
      'nfts', 'bid', COLLECTION_ID,
      '--creator', bidder.address,
      '--price', '1000',
      '--denom', 'ubadge',
      '--local'
    ]);
    expect(out.json.typeUrl).toBe('/tokenization.MsgSetIncomingApproval');
    const approval = out.json.value.approval;
    // FullRanges → [{ start: '1', end: '18446744073709551615' }]
    expect(approval.tokenIds).toEqual([{ start: '1', end: UINT64_MAX }]);
    expect(
      approval.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideWithAnyValidToken
    ).toBe(true);
    // Collection-wide → afterOneUse should be false (multiple tokens can match).
    expect(approval.approvalCriteria.autoDeletionOptions.afterOneUse).toBe(false);
  });

  it('list (sell-side) emits MsgSetOutgoingApproval with the specific token range', () => {
    if (!ready) return;
    const seller = alice();
    const out = runCli([
      'nfts', 'list', COLLECTION_ID,
      '--creator', seller.address,
      '--token-id', TOKEN_ID,
      '--price', '5000',
      '--denom', 'ubadge',
      '--local'
    ]);
    expect(out.json.typeUrl).toBe('/tokenization.MsgSetOutgoingApproval');
    expect(out.json.value.creator).toBe(seller.address);
    expect(out.json.value.collectionId).toBe(COLLECTION_ID);
    const approval = out.json.value.approval;
    expect(approval.tokenIds).toEqual([{ start: TOKEN_ID, end: TOKEN_ID }]);
    expect(approval.approvalCriteria.coinTransfers[0].coins[0].amount).toBe('5000');
    expect(approval.approvalCriteria.coinTransfers[0].coins[0].denom).toBe('ubadge');
    expect(typeof approval.approvalId).toBe('string');
    expect(approval.approvalId.length).toBeGreaterThan(0);
  });

  it('cancel --side bid emits MsgDeleteIncomingApproval', () => {
    if (!ready) return;
    const creator = alice();
    const out = runCli([
      'nfts', 'cancel', COLLECTION_ID, 'some-approval-id',
      '--creator', creator.address,
      '--side', 'bid',
      '--local'
    ]);
    expect(out.json).toEqual({
      typeUrl: '/tokenization.MsgDeleteIncomingApproval',
      value: {
        creator: creator.address,
        collectionId: COLLECTION_ID,
        approvalId: 'some-approval-id'
      }
    });
  });

  it('cancel --side listing emits MsgDeleteOutgoingApproval', () => {
    if (!ready) return;
    const creator = alice();
    const out = runCli([
      'nfts', 'cancel', COLLECTION_ID, 'some-approval-id',
      '--creator', creator.address,
      '--side', 'listing',
      '--local'
    ]);
    expect(out.json).toEqual({
      typeUrl: '/tokenization.MsgDeleteOutgoingApproval',
      value: {
        creator: creator.address,
        collectionId: COLLECTION_ID,
        approvalId: 'some-approval-id'
      }
    });
  });

  it('buy emits MsgTransferTokens with seller→buyer + prioritized outgoing', () => {
    if (!ready) return;
    const buyer = alice();
    const seller = charlie();
    const out = runCli([
      'nfts', 'buy', COLLECTION_ID, TOKEN_ID,
      '--creator', buyer.address,
      '--approval-id', 'abc',
      '--seller', seller.address,
      '--local'
    ]);
    expect(out.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect(out.json.value.creator).toBe(buyer.address);
    expect(out.json.value.collectionId).toBe(COLLECTION_ID);
    const transfer = out.json.value.transfers[0];
    expect(transfer.from).toBe(seller.address);
    expect(transfer.toAddresses).toEqual([buyer.address]);
    expect(transfer.balances[0].tokenIds).toEqual([{ start: TOKEN_ID, end: TOKEN_ID }]);
    expect(transfer.balances[0].amount).toBe('1');
    // buy → fire the seller's OUTGOING approval
    expect(transfer.prioritizedApprovals[0].approvalId).toBe('abc');
    expect(transfer.prioritizedApprovals[0].approvalLevel).toBe('outgoing');
    expect(transfer.prioritizedApprovals[0].approverAddress).toBe(seller.address);
    expect(transfer.onlyCheckPrioritizedOutgoingApprovals).toBe(true);
    expect(transfer.onlyCheckPrioritizedIncomingApprovals).toBe(false);
  });

  it('sell emits MsgTransferTokens with seller→bidder + prioritized incoming', () => {
    if (!ready) return;
    const seller = alice();
    const bidder = charlie();
    const out = runCli([
      'nfts', 'sell', COLLECTION_ID, TOKEN_ID,
      '--creator', seller.address,
      '--approval-id', 'abc',
      '--bidder', bidder.address,
      '--local'
    ]);
    expect(out.json.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect(out.json.value.creator).toBe(seller.address);
    expect(out.json.value.collectionId).toBe(COLLECTION_ID);
    const transfer = out.json.value.transfers[0];
    expect(transfer.from).toBe(seller.address);
    expect(transfer.toAddresses).toEqual([bidder.address]);
    expect(transfer.balances[0].tokenIds).toEqual([{ start: TOKEN_ID, end: TOKEN_ID }]);
    expect(transfer.balances[0].amount).toBe('1');
    // sell → fire the bidder's INCOMING approval
    expect(transfer.prioritizedApprovals[0].approvalId).toBe('abc');
    expect(transfer.prioritizedApprovals[0].approvalLevel).toBe('incoming');
    expect(transfer.prioritizedApprovals[0].approverAddress).toBe(bidder.address);
    expect(transfer.onlyCheckPrioritizedIncomingApprovals).toBe(true);
    expect(transfer.onlyCheckPrioritizedOutgoingApprovals).toBe(false);
  });
});
