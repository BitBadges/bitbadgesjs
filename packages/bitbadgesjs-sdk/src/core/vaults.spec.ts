import { buildVault } from './builders/vault.js';
import { buildSmartToken } from './builders/smart-token.js';
import {
  inspectVaultCollection,
  validateVaultCollection,
  doesCollectionFollowVaultProtocol,
  selectVaultApproval,
  buildVaultDepositMsg,
  buildVaultWithdrawMsg,
  buildVaultEmergencyMigrateMsg
} from './vaults.js';

const META = { name: 'Example Vault', image: 'https://example.com/v.png', description: 'Vault fixture' };
const ALICE = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';
const RECOVERY = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';

describe('vault standard helpers (BB-303)', () => {
  it('inspects canonical vaults with daily limits, 2FA, and emergency recovery', () => {
    const col = buildVault({
      backingCoin: 'USDC',
      dailyWithdrawLimit: 25,
      require2fa: '77',
      emergencyRecovery: RECOVERY,
      ...META
    }).value;

    const inspection = inspectVaultCollection(col);
    expect(inspection.recognized).toBe(true);
    expect(inspection.isVaultTag).toBe(true);
    expect(inspection.configurationSupported).toBe(true);
    expect(inspection.depositApprovalId).toBe('vault-deposit');
    expect(inspection.withdrawApprovalId).toMatch(/^vault-withdraw-/);
    expect(inspection.withdrawTiers).toHaveLength(1);
    expect(inspection.withdrawTiers[0].dailyLimitBaseUnits).toBe('25000000');
    expect(inspection.withdrawTiers[0].resetIntervalMs).toBe('86400000');
    expect(inspection.withdrawTiers[0].requires2faCollectionIds).toEqual(['77']);
    expect(inspection.emergencyRecovery).toEqual({
      approvalId: 'vault-emergency-migration',
      recoveryAddress: RECOVERY,
      version: '0'
    });
    expect(doesCollectionFollowVaultProtocol(col)).toBe(true);
  });

  it('rejects plain Smart Tokens that lack the Vault tag and rejects archived vaults', () => {
    const plainSmartToken = buildSmartToken({ backingCoin: 'BADGE', ...META }).value;
    const res = validateVaultCollection(plainSmartToken);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Missing "Vault" standard');
    expect(selectVaultApproval(plainSmartToken, 'deposit')).toBeUndefined();

    const archived = buildVault({ backingCoin: 'BADGE', ...META }).value;
    archived.isArchived = true;
    expect(doesCollectionFollowVaultProtocol(archived)).toBe(false);
  });

  it('builds deposit, withdraw, and emergency-migrate messages cleanly', () => {
    const col = buildVault({ backingCoin: 'BADGE', emergencyRecovery: RECOVERY, ...META }).value;
    const inspection = inspectVaultCollection(col);
    const depositApproval = selectVaultApproval(col, 'deposit')!;
    const withdrawApproval = selectVaultApproval(col, 'withdraw')!;

    const dep = buildVaultDepositMsg({
      creator: ALICE,
      collectionId: '42',
      amount: '1000000000',
      details: { backingAddress: inspection.backingAddress, backingDenom: inspection.backingDenom, depositApproval }
    });
    expect(dep.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect((dep.value.transfers as any)[0].from).toBe(inspection.backingAddress);
    expect((dep.value.transfers as any)[0].toAddresses).toEqual([ALICE]);

    const wd = buildVaultWithdrawMsg({
      creator: ALICE,
      collectionId: '42',
      amount: '500000000',
      details: { backingAddress: inspection.backingAddress, backingDenom: inspection.backingDenom, withdrawApproval }
    });
    expect((wd.value.transfers as any)[0].from).toBe(ALICE);
    expect((wd.value.transfers as any)[0].toAddresses).toEqual([inspection.backingAddress]);

    const mig = buildVaultEmergencyMigrateMsg({
      creator: RECOVERY,
      from: ALICE,
      collectionId: '42',
      amount: '500000000',
      recovery: inspection.emergencyRecovery!
    });
    expect(mig.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect((mig.value.transfers as any)[0]).toMatchObject({
      from: ALICE,
      toAddresses: [RECOVERY],
      prioritizedApprovals: [{ approvalId: 'vault-emergency-migration', approvalLevel: 'collection', version: '0' }],
      onlyCheckPrioritizedCollectionApprovals: true
    });

    expect(() =>
      buildVaultEmergencyMigrateMsg({
        creator: ALICE,
        from: ALICE,
        collectionId: '42',
        amount: '500000000',
        recovery: inspection.emergencyRecovery!
      })
    ).toThrow(/recovery address/i);
  });
});
