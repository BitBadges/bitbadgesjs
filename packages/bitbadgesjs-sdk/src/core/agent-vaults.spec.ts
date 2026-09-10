import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { buildAgentVault, type AgentVaultParams } from './builders/agent-vault.js';
import { validateAgentVaultCollection, buildAgentVaultTransaction, getAgentVaultStatus } from './agent-vaults.js';
import { MsgUniversalUpdateCollection } from '../transactions/messages/bitbadges/tokenization/msgUniversalUpdateCollection.js';
import { Stringify } from '../common/string-numbers.js';
import { verifyStandardsCompliance } from '../api-indexer/verify-standards.js';

const address = (n: number) => convertToBitBadgesAddress(`0x${n.toString(16).padStart(40, '0')}`);
const agent = address(1);
const manager = address(2);
const recovery = address(3);
const params: AgentVaultParams = {
  agent,
  manager,
  backingCoin: 'BADGE',
  uri: 'ipfs://vault-metadata',
  cap: { amount: '9007199254740993', startTime: '1000', intervalLength: '86400000' }
};
const collection = (overrides: Partial<AgentVaultParams> = {}) => ({ ...buildAgentVault({ ...params, ...overrides }).value, collectionId: '7' });

describe('Agent Vault policy', () => {
  it('satisfies both declared standards at the creation review boundary', () => {
    expect(verifyStandardsCompliance(buildAgentVault(params)).valid).toBe(true);
  });
  it('recognizes protobuf defaults and the chain-inserted Mint restriction', () => {
    const c = collection({ recovery });
    const roundTrip = MsgUniversalUpdateCollection.fromProto(new MsgUniversalUpdateCollection(c).toProto(), Stringify);
    expect(validateAgentVaultCollection(roundTrip).valid).toBe(true);
    const permission = { ...c.collectionPermissions.canUpdateCollectionApprovals[0], fromListId: 'Mint' };
    c.collectionPermissions.canUpdateCollectionApprovals.unshift(permission);
    expect(validateAgentVaultCollection(c).valid).toBe(true);
  });
  it('funds only the named agent and restricts ordinary redemption to that agent', () => {
    const c = collection();
    expect(c.collectionApprovals[0].toListId).toBe(agent);
    expect(c.collectionApprovals[1].fromListId).toBe(agent);
    expect(c.collectionApprovals[1].initiatedByListId).toBe(agent);
    expect(c.collectionApprovals[1].approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount).toBe('9007199254740993');
    expect(c.manager).toBe(manager);
    expect(buildAgentVault(params)).toEqual(buildAgentVault(params));
    expect(validateAgentVaultCollection(c).valid).toBe(true);
  });

  it.each(['0', '-1', '1.1', '1e6', '01'])('rejects invalid cap %s', (amount) => {
    expect(() => collection({ cap: { ...params.cap!, amount } })).toThrow();
  });

  it('rejects agent control of manager, recovery or activation', () => {
    expect(() => collection({ manager: agent })).toThrow();
    expect(() => collection({ recovery: agent })).toThrow();
    expect(() => collection({ activation: { voters: [{ address: agent, weight: 1 }], threshold: 1 } })).toThrow();
  });

  it('compiles exact weighted activation and rejects unsupported weight precision', () => {
    const c = collection({
      activation: {
        voters: [
          { address: manager, weight: 2 },
          { address: recovery, weight: 1 }
        ],
        threshold: 2
      }
    });
    expect(c.collectionApprovals[1].approvalCriteria.votingChallenges[0].quorumThreshold).toBe('66');
    expect(c.collectionApprovals[1].approvalCriteria.votingChallenges[0].resetAfterExecution).toBe(false);
    expect(() => collection({ activation: { voters: [{ address: manager, weight: 101 }], threshold: 50 } })).toThrow();
    expect(() =>
      collection({
        activation: {
          voters: [
            { address: manager, weight: 1 },
            { address: manager, weight: 1 }
          ],
          threshold: 1
        }
      })
    ).toThrow();
  });

  it('rejects unknown authority, policy mutation and incomplete recovery', () => {
    const mutations = [
      (c: any) => {
        c.collectionApprovals.push({ ...c.collectionApprovals[1], approvalId: 'extra' });
      },
      (c: any) => {
        c.collectionApprovals[1].initiatedByListId = 'All';
      },
      (c: any) => {
        c.collectionApprovals[1].approvalCriteria.overridesFromOutgoingApprovals = true;
      },
      (c: any) => {
        c.collectionPermissions.canUpdateCollectionApprovals = [];
      },
      (c: any) => {
        c.invariants.cosmosCoinBackedPath.conversion.sideA.amount = '2';
      },
      (c: any) => {
        c.collectionApprovals.pop();
      }
    ];
    for (const mutate of mutations) {
      const c = collection({ recovery });
      mutate(c);
      expect(validateAgentVaultCollection(c).valid).toBe(false);
    }
  });

  it('emits one transaction for payment and checks the acting identity', () => {
    const c = collection();
    const tx = buildAgentVaultTransaction({ action: 'pay', collection: c, creator: agent, amount: '42', to: manager });
    expect(tx.messages).toHaveLength(2);
    expect(tx.messages[0].value.transfers[0].balances[0].amount).toBe('42');
    expect(tx.messages[1].value.amount).toEqual([{ denom: 'ubadge', amount: '42' }]);
    expect(() => buildAgentVaultTransaction({ action: 'withdraw', collection: c, creator: manager, amount: '42' })).toThrow();
    expect(() => buildAgentVaultTransaction({ action: 'recover', collection: collection({ recovery }), creator: manager, amount: '42' })).toThrow();
    expect(
      buildAgentVaultTransaction({ action: 'deposit', collection: c, creator: manager, amount: '42' }).messages[0].value.transfers[0].toAddresses
    ).toEqual([agent]);
  });

  it('keeps absent status data unknown and uses exact remaining budget', () => {
    const c = collection();
    expect(getAgentVaultStatus(c, { now: '2000' }).status).toBe('unknown');
    const status = getAgentVaultStatus(c, { now: '2000', balance: '100', spent: '9007199254740980', trackerWindowStart: '1000' });
    expect(status.withdrawable).toBe('13');
    expect(status.nextReset).toBe('86401000');
    expect(getAgentVaultStatus(c, { now: '86401000', balance: '100', spent: '9007199254740993', trackerWindowStart: '1000' }).withdrawable).toBe(
      '100'
    );
  });
});
