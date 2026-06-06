/**
 * Tests for agent-vaults.ts — validator, extractor, and lifecycle msg builders.
 *
 * Round-trips through buildAgentVault so builder output passes its own
 * detector, and asserts the deposit/withdraw/pay/vote msg shapes.
 */
import {
  validateAgentVaultCollection,
  doesCollectionFollowAgentVaultProtocol,
  extractAgentVaultDetails,
  buildAgentVaultDepositMsg,
  buildAgentVaultWithdrawMsg,
  buildAgentVaultPayMsgs,
  buildAgentVaultRecoverMsgs,
  buildAgentVaultVoteMsg
} from './agent-vaults.js';
import { buildAgentVault } from './builders/agent-vault.js';
import { buildSmartToken } from './builders/smart-token.js';

const META = { name: 'Agent Vault', image: 'https://example.com/i.png', description: 'agent vault' };

/** The builder emits MsgCreateCollection.value, which is iCollectionDoc-shaped. */
const asCollection = (m: any): any => m.value ?? m;

describe('validateAgentVaultCollection', () => {
  it('accepts default builder output', () => {
    const c = asCollection(buildAgentVault({ backingCoin: 'USDC', ...META }));
    const r = validateAgentVaultCollection(c);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects a plain Smart Token (no "Agent Vault" standard)', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    expect(doesCollectionFollowAgentVaultProtocol(c)).toBe(false);
    expect(validateAgentVaultCollection(c).errors).toContain('Missing "Agent Vault" standard');
  });

  it('rejects a collection without the IBC backing path', () => {
    const c = asCollection(buildAgentVault({ backingCoin: 'USDC', ...META }));
    delete c.invariants.cosmosCoinBackedPath;
    expect(doesCollectionFollowAgentVaultProtocol(c)).toBe(false);
  });
});

describe('extractAgentVaultDetails', () => {
  it('extracts approvals + parses gating', () => {
    const c = asCollection(
      buildAgentVault({
        backingCoin: 'USDC',
        withdrawLimit: 5,
        period: 'daily',
        unlockAt: 1700000000000,
        expiresAt: 1800000000000,
        signers: [{ address: 'bb1aaa' }, { address: 'bb1bbb' }],
        threshold: 2,
        ...META
      })
    );
    const d = extractAgentVaultDetails(c)!;
    expect(d).not.toBeNull();
    expect(d.depositApproval.approvalId).toContain('deposit');
    expect(d.withdrawApproval.approvalId).toContain('withdraw');
    expect(d.gating.cap).toEqual({ perPeriodBaseUnits: '5000000', period: 'daily' });
    expect(d.gating.timeWindow).toEqual({ unlockAt: '1700000000000', expiresAt: '1800000000000' });
    expect(d.gating.multisig?.voters).toHaveLength(2);
  });

  it('returns empty gating for an ungated vault', () => {
    const c = asCollection(buildAgentVault({ backingCoin: 'USDC', ...META }));
    const d = extractAgentVaultDetails(c)!;
    expect(d.gating).toEqual({});
  });

  it('exposes the kill-switch recovery approvals only when built with --recovery', () => {
    const without = extractAgentVaultDetails(asCollection(buildAgentVault({ backingCoin: 'USDC', ...META })))!;
    expect(without.recovery).toBeUndefined();

    const withRec = extractAgentVaultDetails(asCollection(buildAgentVault({ backingCoin: 'USDC', recovery: 'bb1recovery', ...META })))!;
    expect(withRec.recovery?.address).toBe('bb1recovery');
    expect(withRec.recovery?.freezeApproval.approvalId).toBe('agent-vault-emergency-freeze');
    expect(withRec.recovery?.exitApproval.approvalId).toBe('agent-vault-emergency-exit');
  });
});

describe('buildAgentVaultRecoverMsgs (admin kill-switch)', () => {
  it('emits [freeze (holder→recovery), exit (recovery→backing)]', () => {
    const c = asCollection(buildAgentVault({ backingCoin: 'USDC', recovery: 'bb1recovery', ...META }));
    const details = extractAgentVaultDetails(c)!;
    const [freeze, exit] = buildAgentVaultRecoverMsgs({
      creator: 'bb1recovery',
      collectionId: '42',
      from: 'bb1agent',
      amount: '1000000',
      details
    });
    const f = (freeze.value as any).transfers[0];
    expect(f.from).toBe('bb1agent');
    expect(f.toAddresses).toEqual(['bb1recovery']);
    expect(f.prioritizedApprovals[0].approvalId).toBe('agent-vault-emergency-freeze');
    const e = (exit.value as any).transfers[0];
    expect(e.from).toBe('bb1recovery');
    expect(e.toAddresses).toEqual([details.backingAddress]);
    expect(e.prioritizedApprovals[0].approvalId).toBe('agent-vault-emergency-exit');
  });

  it('throws for a vault with no kill-switch', () => {
    const c = asCollection(buildAgentVault({ backingCoin: 'USDC', ...META }));
    const details = extractAgentVaultDetails(c)!;
    expect(() =>
      buildAgentVaultRecoverMsgs({ creator: 'bb1r', collectionId: '42', from: 'bb1agent', amount: '1', details })
    ).toThrow(/no admin kill-switch/);
  });
});

describe('lifecycle msg builders', () => {
  const c = asCollection(buildAgentVault({ backingCoin: 'USDC', withdrawLimit: 5, signers: [{ address: 'bb1signer' }], ...META }));
  const details = extractAgentVaultDetails(c)!;
  const args = { creator: 'bb1agent', collectionId: '42', amount: '1000000', details };

  it('deposit: from backing → creator, prioritizes deposit approval', () => {
    const m = buildAgentVaultDepositMsg(args);
    expect(m.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const t = (m.value as any).transfers[0];
    expect(t.from).toBe(details.backingAddress);
    expect(t.toAddresses).toEqual(['bb1agent']);
    expect(t.prioritizedApprovals[0].approvalId).toBe(details.depositApproval.approvalId);
  });

  it('withdraw: from creator → backing, prioritizes withdraw approval', () => {
    const m = buildAgentVaultWithdrawMsg(args);
    const t = (m.value as any).transfers[0];
    expect(t.from).toBe('bb1agent');
    expect(t.toAddresses).toEqual([details.backingAddress]);
    expect(t.prioritizedApprovals[0].approvalId).toBe(details.withdrawApproval.approvalId);
  });

  it('pay: [gated withdraw, bank send] in the released backing denom', () => {
    const [withdraw, send] = buildAgentVaultPayMsgs({ ...args, to: 'bb1vendor' });
    expect(withdraw.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect(send.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend');
    expect((send.value as any).toAddress).toBe('bb1vendor');
    expect((send.value as any).amount).toEqual([{ denom: details.backingDenom, amount: '1000000' }]);
  });

  it('vote: MsgCastVote on the withdraw approval proposal (camelCase, matching the MsgCastVote encoder)', () => {
    const m = buildAgentVaultVoteMsg({ creator: 'bb1signer', collectionId: '42', details });
    expect(m.typeUrl).toBe('/tokenization.MsgCastVote');
    const v = m.value as any;
    expect(v.creator).toBe('bb1signer');
    expect(v.collectionId).toBe('42');
    expect(v.approvalLevel).toBe('collection');
    expect(v.approverAddress).toBe('');
    expect(v.approvalId).toBe(details.withdrawApproval.approvalId);
    expect(v.proposalId).toBe(details.gating.multisig?.proposalId);
    expect(v.yesWeight).toBe('100');
    // Guard against a snake_case regression — the `new MsgCastVote(v)` encoder
    // in `bb deploy` reads camelCase only and would drop these.
    expect(v.collection_id).toBeUndefined();
    expect(v.yes_weight).toBeUndefined();
  });
});
