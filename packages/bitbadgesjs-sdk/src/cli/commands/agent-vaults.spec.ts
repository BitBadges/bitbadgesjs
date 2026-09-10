import { Command } from 'commander';
import { agentVaultsCommand } from './agent-vaults.js';
import { assertAgentVaultAtomicSigning } from '../utils/agent-vault-signing.js';

describe('Agent Vault CLI', () => {
  it('provides the full lifecycle with explicit base-unit inputs', () => {
    expect(agentVaultsCommand.commands.map((c) => c.name())).toEqual(
      expect.arrayContaining(['list', 'show', 'status', 'deposit', 'withdraw', 'pay', 'vote', 'recover'])
    );
    const pay = agentVaultsCommand.commands.find((c) => c.name() === 'pay')!;
    expect(pay.options.find((o) => o.long === '--amount')?.description).toMatch(/base units/i);
    expect(pay.options.find((o) => o.long === '--to')?.mandatory).toBe(true);
    expect(new Command().addCommand(agentVaultsCommand)).toBeDefined();
  });
  it('rejects sequential signing before either payment or recovery is submitted', () => {
    const transfer = (approvalId: string) => ({
      typeUrl: '/tokenization.MsgTransferTokens',
      value: {
        transfers: [{ prioritizedApprovals: [{ approvalId }] }]
      }
    });
    for (const first of ['agent-vault-withdraw', 'agent-vault-recover']) {
      const messages = [transfer(first), { typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: {} }];
      expect(() => assertAgentVaultAtomicSigning(messages, true)).toThrow(/atomic/);
      expect(() => assertAgentVaultAtomicSigning(messages, false)).not.toThrow();
    }
    expect(() => assertAgentVaultAtomicSigning([transfer('agent-vault-withdraw')], true)).not.toThrow();
  });
});
