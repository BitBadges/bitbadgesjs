/**
 * Tests for the Agent Vault builder.
 *
 * Verifies the standards tag, deposit/withdraw approvals, the gating
 * compilation (per-period cap → approvalAmounts, time window → transferTimes,
 * multisig → votingChallenges), determinism, and standards-compliance.
 */
import { verifyStandardsCompliance } from '../../api-indexer/verify-standards.js';
import { buildAgentVault, AGENT_VAULT_DEPOSIT_APPROVAL_ID, AGENT_VAULT_WITHDRAW_PROPOSAL_ID } from './agent-vault.js';

const val = (msg: any) => msg.value;
const META = { name: 'Agent Vault', description: 'An agent budget vault.', image: 'ipfs://test-image' };

function withdrawApproval(msg: any): any {
  return val(msg).collectionApprovals.find((a: any) => a.approvalId.includes('withdraw'));
}

describe('buildAgentVault', () => {
  test('carries the Smart Token + Agent Vault standards', () => {
    const r = val(buildAgentVault({ backingCoin: 'USDC', ...META }));
    expect(r.standards).toEqual(['Smart Token', 'Agent Vault']);
  });

  test('has a deposit approval and a prefixed withdraw approval', () => {
    const r = val(buildAgentVault({ backingCoin: 'USDC', ...META }));
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain(AGENT_VAULT_DEPOSIT_APPROVAL_ID);
    expect(ids.some((id: string) => id.startsWith('agent-vault-withdraw-'))).toBe(true);
  });

  test('ungated by default — withdraw approval has no cap/time/multisig', () => {
    const w = withdrawApproval(buildAgentVault({ backingCoin: 'USDC', ...META }));
    expect(w.approvalCriteria.approvalAmounts).toBeUndefined();
    expect(w.approvalCriteria.votingChallenges).toBeUndefined();
    // FOREVER transfer window
    expect(w.transferTimes).toEqual([{ start: '1', end: '18446744073709551615' }]);
  });

  test('withdrawLimit + period → approvalAmounts (per-initiator, periodic reset)', () => {
    const w = withdrawApproval(buildAgentVault({ backingCoin: 'USDC', withdrawLimit: 5, period: 'weekly', ...META }));
    const aa = w.approvalCriteria.approvalAmounts;
    expect(aa.perInitiatedByAddressApprovalAmount).toBe('5000000'); // 5 USDC @ 6dp
    expect(aa.amountTrackerId).toBe('withdrawal-weekly');
    expect(aa.resetTimeIntervals.intervalLength).toBe('604800000');
  });

  test('unlockAt/expiresAt → restricted transferTimes window', () => {
    const w = withdrawApproval(buildAgentVault({ backingCoin: 'USDC', unlockAt: 1700000000000, expiresAt: 1800000000000, ...META }));
    expect(w.transferTimes).toEqual([{ start: '1700000000000', end: '1800000000000' }]);
  });

  test('signers + threshold → votingChallenges (N-of-M → percentage quorum)', () => {
    const w = withdrawApproval(
      buildAgentVault({
        backingCoin: 'USDC',
        signers: [{ address: 'bb1aaa' }, { address: 'bb1bbb' }, { address: 'bb1ccc' }],
        threshold: 2,
        ...META
      })
    );
    const vc = w.approvalCriteria.votingChallenges[0];
    expect(vc.proposalId).toBe(AGENT_VAULT_WITHDRAW_PROPOSAL_ID);
    // 2 of 3 equal-weight voters → floor(2/3 * 100) = 66
    expect(vc.quorumThreshold).toBe('66');
    expect(vc.voters).toHaveLength(3);
    expect(vc.voters[0]).toEqual({ address: 'bb1aaa', weight: '1' });
    expect(vc.resetAfterExecution).toBe(false);
  });

  test('throws when --threshold exceeds the total signer weight (e.g. 5-of-3)', () => {
    expect(() =>
      buildAgentVault({
        backingCoin: 'USDC',
        signers: [{ address: 'bb1aaa' }, { address: 'bb1bbb' }, { address: 'bb1ccc' }],
        threshold: 5,
        ...META
      })
    ).toThrow(/threshold must be between 1 and the total signer weight/);
  });

  test('throws when --threshold is below 1', () => {
    expect(() =>
      buildAgentVault({ backingCoin: 'USDC', signers: [{ address: 'bb1aaa' }], threshold: 0, ...META })
    ).toThrow(/threshold must be between 1 and the total signer weight/);
  });

  test('threshold defaults to unanimous (100%)', () => {
    const w = withdrawApproval(
      buildAgentVault({ backingCoin: 'USDC', signers: [{ address: 'bb1aaa' }, { address: 'bb1bbb' }], ...META })
    );
    expect(w.approvalCriteria.votingChallenges[0].quorumThreshold).toBe('100');
  });

  test('deterministic — identical params produce byte-identical msg', () => {
    const p = { backingCoin: 'USDC', withdrawLimit: 5, period: 'daily' as const, ...META };
    expect(buildAgentVault(p)).toEqual(buildAgentVault(p));
  });

  test('passes standards-compliance verification', () => {
    const msg = buildAgentVault({ backingCoin: 'USDC', withdrawLimit: 5, period: 'daily', ...META });
    const vr = verifyStandardsCompliance({ messages: [msg] });
    expect({ valid: vr.valid, violations: vr.violations }).toEqual({ valid: true, violations: [] });
  });
});
