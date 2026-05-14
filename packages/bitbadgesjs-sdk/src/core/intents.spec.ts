import {
  buildIntentApproval,
  buildIntentFillTx,
  intentExchangeCollectionId,
  INTENT_EXCHANGE_COLLECTION_IDS
} from './intents.js';
import { UintRangeArray } from './uintRanges.js';

const ALICE = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const BOB = 'bb1pkqancsabcabcabcabcabcabcabcabcabcabcs';

describe('intentExchangeCollectionId', () => {
  it('returns 81 for mainnet, 24 for testnet, 24 for local', () => {
    expect(intentExchangeCollectionId('mainnet')).toBe('81');
    expect(intentExchangeCollectionId('testnet')).toBe('24');
    expect(intentExchangeCollectionId('local')).toBe('24');
    expect(INTENT_EXCHANGE_COLLECTION_IDS.mainnet).toBe('81');
  });
});

describe('buildIntentApproval', () => {
  const args = {
    address: ALICE,
    payDenom: 'ubadge',
    payAmount: 1000n,
    receiveDenom: 'uusdc',
    receiveAmount: 2000n,
    transferTimes: UintRangeArray.From([{ start: 1n, end: 9999n }]),
    approvalId: 'test-intent'
  };

  it('produces an outgoing approval with fromListId=creator + toListId=All + initiatedByListId=All', () => {
    const approval = buildIntentApproval(args);
    // fromListId must be the creator's address — pinning the shape so a
    // future refactor can't silently drop it back to the proto default of
    // "" (the lifted FE original had this invariant baked in).
    expect(approval.fromListId).toBe(ALICE);
    expect(approval.toListId).toBe('All');
    expect(approval.initiatedByListId).toBe('All');
    expect(approval.approvalId).toBe('test-intent');
  });

  it('emits 2 coinTransfers: filler→creator (receive) and creator→filler (pay)', () => {
    const approval = buildIntentApproval(args);
    const transfers = (approval.approvalCriteria as any).coinTransfers;
    expect(transfers).toHaveLength(2);
    // Filler pays creator (the receive side from creator's perspective)
    expect(transfers[0].to).toBe(ALICE);
    expect(transfers[0].overrideFromWithApproverAddress).toBe(false);
    expect(transfers[0].coins[0].denom).toBe('uusdc');
    expect(transfers[0].coins[0].amount).toBe(2000n);
    // Creator pays filler (the pay side)
    expect(transfers[1].to).toBe('');
    expect(transfers[1].overrideFromWithApproverAddress).toBe(true);
    expect(transfers[1].overrideToWithInitiator).toBe(true);
    expect(transfers[1].coins[0].denom).toBe('ubadge');
    expect(transfers[1].coins[0].amount).toBe(1000n);
  });

  it('does NOT emit FE-only fields the chain proto rejects (toList, requireFromEquals*)', () => {
    const approval = buildIntentApproval(args);
    expect((approval as any).toList).toBeUndefined();
    expect((approval as any).initiatedByList).toBeUndefined();
    expect((approval as any).fromList).toBeUndefined();
    expect((approval.approvalCriteria as any).requireFromEqualsInitiatedBy).toBeUndefined();
    expect((approval.approvalCriteria as any).requireFromDoesNotEqualInitiatedBy).toBeUndefined();
  });

  it('sets overallMaxNumTransfers to 1 (fill-once) and afterOneUse auto-deletion', () => {
    const approval = buildIntentApproval(args);
    expect((approval.approvalCriteria as any).maxNumTransfers.overallMaxNumTransfers).toBe(1n);
    expect((approval.approvalCriteria as any).autoDeletionOptions.afterOneUse).toBe(true);
  });
});

describe('buildIntentFillTx', () => {
  const intent = { approvalId: 'intent-xyz', approverAddress: ALICE };

  it('emits exactly 3 messages: mint → fire approval → burn', () => {
    const tx = buildIntentFillTx(BOB, intent, '81');
    expect(tx.messages).toHaveLength(3);
    expect(tx.messages[0].typeUrl).toBe('/tokenization.MsgTransferTokens');
    // 1. Mint vehicle to creator
    const t0 = tx.messages[0].value as any;
    expect(t0.transfers[0].from).toBe('Mint');
    expect(t0.transfers[0].toAddresses).toEqual([ALICE]);
    // 2. Fire the creator outgoing approval
    const t1 = tx.messages[1].value as any;
    expect(t1.transfers[0].from).toBe(ALICE);
    expect(t1.transfers[0].toAddresses).toEqual([BOB]);
    expect(t1.transfers[0].prioritizedApprovals[0].approvalId).toBe('intent-xyz');
    expect(t1.transfers[0].prioritizedApprovals[0].approvalLevel).toBe('outgoing');
    expect(t1.transfers[0].onlyCheckPrioritizedOutgoingApprovals).toBe(true);
    // 3. Burn the vehicle
    const t2 = tx.messages[2].value as any;
    expect(t2.transfers[0].from).toBe(BOB);
    expect(t2.transfers[0].toAddresses[0]).toMatch(/^bb1q+/);
  });

  it('uses the configured intent exchange collection id in every msg', () => {
    const tx = buildIntentFillTx(BOB, intent, '24');
    for (const m of tx.messages) {
      expect((m.value as any).collectionId).toBe('24');
    }
  });

  it('output is JSON-stringifiable (uint64s as strings)', () => {
    const tx = buildIntentFillTx(BOB, intent, '81');
    expect(() => JSON.stringify(tx)).not.toThrow();
  });
});
