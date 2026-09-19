import { auditCollection } from './audit.js';
import { buildSmartToken } from './builders/smart-token.js';

const missingDeposit = 'Missing backing approval (deposit)';
const missingWithdraw = 'Missing unbacking approval (withdrawal)';
const build = () => buildSmartToken({ backingCoin: 'BADGE', uri: 'ipfs://METADATA_GOLDEN' }).value;
const titles = (collection: Record<string, unknown>) => auditCollection({ collection }).findings.map((finding) => finding.title);

describe('backing approval audit uses execution structure', () => {
  it('recognizes canonical builder deposit/withdraw without a redundant derived address field', () => {
    const value = build();
    expect(value.invariants.cosmosCoinBackedPath.address).toBeUndefined();
    expect(titles(value)).not.toEqual(expect.arrayContaining([missingDeposit, missingWithdraw]));
    expect(titles(value)).not.toContain(missingDeposit);
    expect(titles(value)).not.toContain(missingWithdraw);
  });

  it('does not let approval names impersonate missing execution paths', () => {
    const value = build();
    value.collectionApprovals[0] = { ...value.collectionApprovals[0], approvalId: 'vault-deposit', fromListId: 'All' };
    value.collectionApprovals[1] = { ...value.collectionApprovals[1], approvalId: 'unbacking', toListId: 'All' };
    expect(titles(value)).toEqual(expect.arrayContaining([missingDeposit, missingWithdraw]));
  });

  it('rejects negated/compound addresses as an exact backing side', () => {
    const value = build();
    const address = value.collectionApprovals[0].fromListId;
    value.collectionApprovals[0].fromListId = '!' + address;
    value.collectionApprovals[1].toListId = address + ':All';
    expect(titles(value)).toEqual(expect.arrayContaining([missingDeposit, missingWithdraw]));
  });

  it('does not count a circular backing path as deposit or withdrawal', () => {
    const value = build();
    const address = value.collectionApprovals[0].fromListId;
    value.collectionApprovals = [
      {
        ...value.collectionApprovals[0],
        fromListId: address,
        toListId: address
      }
    ];
    expect(titles(value)).toEqual(expect.arrayContaining([missingDeposit, missingWithdraw]));
  });

  it('requires allowBackedMinting even when the approval IDs sound correct', () => {
    const value = build();
    value.collectionApprovals[0].approvalId = 'backing';
    value.collectionApprovals[1].approvalId = 'unbacking';
    for (const approval of value.collectionApprovals) approval.approvalCriteria.allowBackedMinting = false;
    expect(titles(value)).toEqual(expect.arrayContaining([missingDeposit, missingWithdraw]));
  });
});
