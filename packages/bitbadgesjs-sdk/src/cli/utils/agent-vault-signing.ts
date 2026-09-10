import { AGENT_VAULT_IDS } from '../../core/builders/agent-vault.js';

export function assertAgentVaultAtomicSigning(messages: any[], sequential: boolean): void {
  if (!sequential || messages.length < 2) return;
  const vaultOperation = messages.some(
    (m) =>
      m.typeUrl === '/tokenization.MsgTransferTokens' &&
      m.value?.transfers?.some((t: any) =>
        t.prioritizedApprovals?.some((a: any) => a.approvalId === AGENT_VAULT_IDS.withdraw || a.approvalId === AGENT_VAULT_IDS.recover)
      )
  );
  if (vaultOperation)
    throw new Error('Agent Vault payment and recovery require atomic signing. Use --browser; the keyring adapter sends sequential transactions.');
}
