import { BURN_ADDRESS } from './builders/shared.js';
import {
  inspectIssuerControlledCollection,
  validateIssuerControlledCollection,
  doesCollectionFollowIssuerControlledProtocol,
  selectIssuerControlledApproval,
  buildIssuerControlledMintMsg,
  buildIssuerControlledTransferMsg,
  buildIssuerControlledRevokeMsg,
  buildIssuerControlledFreezeMsg
} from './issuer-controlled.js';

const MANAGER = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';
const HOLDER = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';
const RECIPIENT = 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';

function issuerCollectionFixture(overrides: Record<string, any> = {}): any {
  return {
    collectionId: '55',
    manager: MANAGER,
    isArchived: false,
    standards: ['Issuer-Controlled Tokens'],
    validTokenIds: [{ start: 1n, end: 10n }],
    collectionPermissions: {
      canUpdateManager: [],
      canUpdateCollectionApprovals: []
    },
    collectionApprovals: [
      {
        approvalId: 'issuer-mint',
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: MANAGER,
        version: 1n,
        approvalCriteria: { overridesFromOutgoingApprovals: true, overridesToIncomingApprovals: true }
      },
      {
        approvalId: 'issuer-transfer',
        fromListId: '!Mint',
        toListId: 'All',
        initiatedByListId: MANAGER,
        version: 3n,
        approvalCriteria: { overridesFromOutgoingApprovals: true, overridesToIncomingApprovals: true }
      }
    ],
    ...overrides
  };
}

describe('issuer-controlled standard helpers (BB-303)', () => {
  it('inspects manager authority, approvals, override warnings, and mutable permissions', () => {
    const col = issuerCollectionFixture();
    const inspection = inspectIssuerControlledCollection(col);
    expect(inspection.recognized).toBe(true);
    expect(inspection.configurationSupported).toBe(true);
    expect(inspection.manager).toBe(MANAGER);
    expect(inspection.isFrozen).toBe(false);
    expect(inspection.actions.mint).toEqual({ approvalIds: ['issuer-mint'], requiresSelection: false, available: true });
    expect(inspection.actions.transfer).toEqual({ approvalIds: ['issuer-transfer'], requiresSelection: false, available: true });
    expect(inspection.actions.revoke).toEqual({ approvalIds: ['issuer-transfer'], requiresSelection: false, available: true });
    expect(inspection.actions.freeze.available).toBe(true);
    expect(inspection.authority.overrideApprovalIds).toEqual(['issuer-mint', 'issuer-transfer']);
    expect(inspection.mutablePermissions).toContain('canUpdateManager');
    expect(doesCollectionFollowIssuerControlledProtocol(col)).toBe(true);
  });

  it('detects frozen state and rejects missing standard or archived collections', () => {
    const frozen = issuerCollectionFixture({ manager: '', collectionApprovals: [] });
    const inspection = inspectIssuerControlledCollection(frozen);
    expect(inspection.isFrozen).toBe(true);
    expect(inspection.actions.mint.available).toBe(false);
    expect(inspection.actions.freeze.available).toBe(false);

    expect(validateIssuerControlledCollection(issuerCollectionFixture({ standards: [] })).valid).toBe(false);
    expect(validateIssuerControlledCollection(issuerCollectionFixture({ isArchived: true })).valid).toBe(false);
  });

  it('builds mint, transfer, revoke, and freeze messages and enforces manager authority', () => {
    const col = issuerCollectionFixture();
    const mintApproval = selectIssuerControlledApproval(col, 'mint');
    const transferApproval = selectIssuerControlledApproval(col, 'transfer');
    const revokeApproval = selectIssuerControlledApproval(col, 'revoke');

    const mintMsg = buildIssuerControlledMintMsg({
      creator: MANAGER,
      manager: MANAGER,
      collectionId: '55',
      recipients: [HOLDER, RECIPIENT],
      tokenId: '2',
      amount: '5',
      approval: mintApproval
    });
    expect(mintMsg.typeUrl).toBe('/tokenization.MsgTransferTokens');
    expect((mintMsg.value.transfers as any)[0]).toMatchObject({
      from: 'Mint',
      toAddresses: [HOLDER, RECIPIENT],
      balances: [{ amount: '5', tokenIds: [{ start: '2', end: '2' }] }],
      prioritizedApprovals: [{ approvalId: 'issuer-mint', version: '1' }]
    });

    const transferMsg = buildIssuerControlledTransferMsg({
      creator: MANAGER,
      manager: MANAGER,
      collectionId: '55',
      from: HOLDER,
      recipients: [RECIPIENT],
      tokenId: '2',
      amount: '3',
      approval: transferApproval
    });
    expect((transferMsg.value.transfers as any)[0]).toMatchObject({
      from: HOLDER,
      toAddresses: [RECIPIENT],
      prioritizedApprovals: [{ approvalId: 'issuer-transfer', version: '3' }]
    });

    const revokeMsg = buildIssuerControlledRevokeMsg({
      creator: MANAGER,
      manager: MANAGER,
      collectionId: '55',
      from: HOLDER,
      tokenId: '2',
      amount: '1',
      approval: revokeApproval
    });
    expect((revokeMsg.value.transfers as any)[0]).toMatchObject({
      from: HOLDER,
      toAddresses: [BURN_ADDRESS]
    });

    const freezeMsg = buildIssuerControlledFreezeMsg({ creator: MANAGER, manager: MANAGER, collectionId: '55' });
    expect(freezeMsg.typeUrl).toBe('/tokenization.MsgUniversalUpdateCollection');
    expect(freezeMsg.value).toMatchObject({
      creator: MANAGER,
      collectionId: '55',
      updateManager: true,
      manager: '',
      updateCollectionApprovals: true,
      collectionApprovals: [],
      updateCollectionPermissions: true
    });

    expect(() =>
      buildIssuerControlledMintMsg({
        creator: HOLDER,
        manager: MANAGER,
        collectionId: '55',
        recipients: [RECIPIENT],
        approval: mintApproval
      })
    ).toThrow(/collection manager/i);
  });
});
