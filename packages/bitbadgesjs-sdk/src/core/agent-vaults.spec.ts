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

  it('vote: MsgCastVote on the withdraw approval proposal (snake_case fields)', () => {
    const m = buildAgentVaultVoteMsg({ creator: 'bb1signer', collectionId: '42', details });
    expect(m.typeUrl).toBe('/tokenization.MsgCastVote');
    const v = m.value as any;
    expect(v.approval_id).toBe(details.withdrawApproval.approvalId);
    expect(v.proposal_id).toBe(details.gating.multisig?.proposalId);
    expect(v.yes_weight).toBe('100');
  });
});
