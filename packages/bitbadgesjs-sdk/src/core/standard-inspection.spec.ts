import { inspectStandardCollection } from './standard-inspection.js';
import { buildAddressList } from './builders/address-list.js';
import { buildCreditToken } from './builders/credit-token.js';
import { buildVault } from './builders/vault.js';
const metadata = { name: 'Example', image: 'https://example.com/i.png', description: 'Example' };
const manager = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';

describe('bounded standard inspection', () => {
  it('keeps canonical vault limits and 2FA supported without asserting eligibility', () => {
    const c = buildVault({ backingCoin: 'BADGE', dailyWithdrawLimit: 3, require2fa: '2', ...metadata }).value;
    const inspection = inspectStandardCollection(c, 'smart-token');
    expect(inspection.configurationSupported).toBe(true);
    expect(inspection.eligibility).toBe('not-checked');
  });
  it('distinguishes tagged credit collections with unsupported economics', () => {
    const c = buildCreditToken({ paymentDenom: 'BADGE', recipient: manager, ...metadata }).value;
    expect(inspectStandardCollection(c, 'credit-token').configurationSupported).toBe(true);
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].amount = '0';
    const result = inspectStandardCollection(c, 'credit-token');
    expect(result.recognized).toBe(true);
    expect(result.configurationSupported).toBe(false);
    expect(result.actions.purchase.approvalIds).toEqual([]);
  });
  it('does not misrepresent duplicate credit IDs or malformed inputs as usable tiers', () => {
    const c = buildCreditToken({ paymentDenom: 'BADGE', recipient: manager, ...metadata }).value;
    c.collectionApprovals.push({ ...c.collectionApprovals[0] });
    expect(inspectStandardCollection(c, 'credit-token').configurationSupported).toBe(false);
    c.collectionApprovals[0].approvalCriteria.coinTransfers[0].coins[0].amount = 'invalid';
    expect(() => inspectStandardCollection(c, 'credit-token')).not.toThrow();
  });
  it('recognizes address-list routing and explains custom membership profiles', () => {
    const c = buildAddressList({ manager, ...metadata }).value;
    expect(inspectStandardCollection(c, 'address-list').configurationSupported).toBe(true);
    c.collectionApprovals[1].initiatedByListId = 'All';
    expect(inspectStandardCollection(c, 'address-list').configurationSupported).toBe(false);
    c.collectionApprovals[1].initiatedByListId = manager;
    c.collectionApprovals.push({ ...c.collectionApprovals[0], approvalId: 'open-add', initiatedByListId: 'All' });
    expect(inspectStandardCollection(c, 'address-list').configurationSupported).toBe(false);
  });
  it('does not authorize the new manager using the old manager approval', () => {
    const c = buildAddressList({manager,...metadata}).value;
    c.manager = 'bb1p0rrel3365scadq5k9pv0x0zp9j22js6dnw70d';
    const result = inspectStandardCollection(c,'address-list');
    expect(result.configurationSupported).toBe(false);
    expect(result.actions.add.approvalIds).toEqual([]);
    expect(result.issues.join(' ')).toMatch(/differs/);
  });
  it('rejects archived profiles while leaving discovery available', () => {
    const c = buildVault({backingCoin:'BADGE',...metadata}).value;
    c.isArchived = true;
    const result = inspectStandardCollection(c,'smart-token');
    expect(result.recognized).toBe(true);
    expect(result.configurationSupported).toBe(false);
    expect(result.actions.deposit.approvalIds).toEqual([]);
  });

});
