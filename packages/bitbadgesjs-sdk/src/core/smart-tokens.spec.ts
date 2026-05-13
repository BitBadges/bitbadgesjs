/**
 * Tests for smart-tokens.ts — validator, extractor, deposit/withdraw msg builders.
 *
 * Covers conformance rules, legacy-naming compatibility, extraction, and
 * the two msg-builders. Round-trips through buildSmartToken to make sure
 * builder output passes its own validator.
 */

import {
  validateSmartTokenCollection,
  doesCollectionFollowSmartTokenProtocol,
  findDepositApproval,
  findWithdrawApproval,
  extractSmartTokenDetails,
  buildSmartTokenDepositMsg,
  buildSmartTokenWithdrawMsg
} from './smart-tokens.js';
import { buildSmartToken } from './builders/smart-token.js';

const META = { name: 'Smart Token', image: 'https://example.com/i.png', description: 'Smart Token vault' };

function asCollection(builderMsg: any): any {
  // The builder emits MsgCreateCollection.value; the validator expects
  // an iCollectionDoc-shaped object. The relevant fields (standards,
  // invariants, validTokenIds, collectionApprovals) live on .value with
  // identical names.
  return builderMsg.value ?? builderMsg;
}

describe('validateSmartTokenCollection (happy path via buildSmartToken)', () => {
  it('accepts the default builder output', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    const r = validateSmartTokenCollection(c);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
    // The default builder sets noForcefulPostMintTransfers=true, so no warning.
    expect(r.warnings).toEqual([]);
  });

  it('accepts a tradable Smart Token', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', tradable: true, ...META }));
    expect(validateSmartTokenCollection(c).valid).toBe(true);
  });

  it('emits a warning when forceful transfers are allowed', () => {
    const c = asCollection(
      buildSmartToken({ backingCoin: 'USDC', allowForcefulPostMintTransfers: true, ...META })
    );
    const r = validateSmartTokenCollection(c);
    expect(r.valid).toBe(true);
    expect(r.warnings.join('|')).toMatch(/noForcefulPostMintTransfers/);
  });

  it('doesCollectionFollowSmartTokenProtocol returns true', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    expect(doesCollectionFollowSmartTokenProtocol(c)).toBe(true);
  });
});

describe('validateSmartTokenCollection — rejection paths', () => {
  it('rejects when "Smart Token" standard is missing', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    c.standards = ['Other'];
    const r = validateSmartTokenCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('Missing "Smart Token" standard');
  });

  it('rejects when cosmosCoinBackedPath invariant is missing', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    delete c.invariants.cosmosCoinBackedPath;
    const r = validateSmartTokenCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors.join('|')).toMatch(/cosmosCoinBackedPath/);
  });

  it('rejects when validTokenIds is wrong', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    c.validTokenIds = [{ start: 1n, end: 5n }];
    const r = validateSmartTokenCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors.join('|')).toMatch(/validTokenIds/);
  });

  it('rejects when deposit approval is missing', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    // Drop the deposit approval (substring "deposit" OR "back")
    c.collectionApprovals = c.collectionApprovals.filter(
      (a: any) => !a.approvalId.toLowerCase().includes('deposit')
    );
    expect(validateSmartTokenCollection(c).errors.join('|')).toMatch(/Missing deposit/);
  });

  it('rejects when withdraw approval is missing', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    c.collectionApprovals = c.collectionApprovals.filter(
      (a: any) => !a.approvalId.toLowerCase().includes('withdraw')
    );
    expect(validateSmartTokenCollection(c).errors.join('|')).toMatch(/Missing withdraw/);
  });
});

describe('findDepositApproval / findWithdrawApproval (legacy compatibility)', () => {
  const makeApproval = (id: string): any => ({ approvalId: id });

  it('finds the new "smart-token-deposit" / "-withdraw" naming', () => {
    const approvals = [makeApproval('smart-token-deposit'), makeApproval('smart-token-withdraw')];
    expect(findDepositApproval(approvals)?.approvalId).toBe('smart-token-deposit');
    expect(findWithdrawApproval(approvals)?.approvalId).toBe('smart-token-withdraw');
  });

  it('finds the legacy "smart-account-backing" / "-unbacking" naming', () => {
    const approvals = [makeApproval('smart-account-backing'), makeApproval('smart-account-unbacking')];
    expect(findDepositApproval(approvals)?.approvalId).toBe('smart-account-backing');
    expect(findWithdrawApproval(approvals)?.approvalId).toBe('smart-account-unbacking');
  });

  it('finds the intermediate "smart-token-backing" / "-unbacking" naming', () => {
    const approvals = [makeApproval('smart-token-backing'), makeApproval('smart-token-unbacking')];
    expect(findDepositApproval(approvals)?.approvalId).toBe('smart-token-backing');
    expect(findWithdrawApproval(approvals)?.approvalId).toBe('smart-token-unbacking');
  });

  it('does NOT confuse "unbacking" for the deposit approval', () => {
    // If approvals are out of order, the substring matcher must still
    // pick the right one. Reversed order:
    const approvals = [makeApproval('smart-token-unbacking'), makeApproval('smart-token-backing')];
    expect(findDepositApproval(approvals)?.approvalId).toBe('smart-token-backing');
    expect(findWithdrawApproval(approvals)?.approvalId).toBe('smart-token-unbacking');
  });

  it('returns undefined when nothing matches', () => {
    expect(findDepositApproval([makeApproval('other-approval')])).toBeUndefined();
    expect(findWithdrawApproval([makeApproval('other-approval')])).toBeUndefined();
  });
});

describe('extractSmartTokenDetails', () => {
  it('extracts backing address + denom + approvals', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    const d = extractSmartTokenDetails(c)!;
    expect(d).not.toBeNull();
    expect(d.backingAddress).toMatch(/^bb1/);
    expect(d.backingDenom).toMatch(/^ibc\//);
    expect(d.depositApproval.approvalId).toBe('smart-token-deposit');
    expect(d.withdrawApproval.approvalId).toBe('smart-token-withdraw');
    expect(d.tradable).toBe(false);
    expect(d.aiAgentVault).toBe(false);
  });

  it('flags tradable + aiAgentVault when those standards are present', () => {
    const c = asCollection(
      buildSmartToken({ backingCoin: 'USDC', tradable: true, aiAgentVault: true, ...META })
    );
    const d = extractSmartTokenDetails(c)!;
    expect(d.tradable).toBe(true);
    expect(d.aiAgentVault).toBe(true);
  });

  it('returns null on a non-conformant collection', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    delete c.invariants.cosmosCoinBackedPath;
    expect(extractSmartTokenDetails(c)).toBeNull();
  });
});

describe('buildSmartTokenDepositMsg', () => {
  it('emits MsgTransferTokens with from=backingAddress, to=caller', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    const details = extractSmartTokenDetails(c)!;
    const msg = buildSmartTokenDepositMsg({
      creator: 'bb1user',
      collectionId: '42',
      amount: '1000000',
      details
    });
    expect(msg.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const v = msg.value as any;
    expect(v.creator).toBe('bb1user');
    expect(v.collectionId).toBe('42');
    expect(v.transfers[0].from).toBe(details.backingAddress);
    expect(v.transfers[0].toAddresses).toEqual(['bb1user']);
    expect(v.transfers[0].balances[0].amount).toBe('1000000');
    expect(v.transfers[0].prioritizedApprovals[0].approvalId).toBe('smart-token-deposit');
    expect(v.transfers[0].onlyCheckPrioritizedCollectionApprovals).toBe(true);
  });
});

describe('buildSmartTokenWithdrawMsg', () => {
  it('emits MsgTransferTokens with from=caller, to=backingAddress', () => {
    const c = asCollection(buildSmartToken({ backingCoin: 'USDC', ...META }));
    const details = extractSmartTokenDetails(c)!;
    const msg = buildSmartTokenWithdrawMsg({
      creator: 'bb1user',
      collectionId: '42',
      amount: '1000000',
      details
    });
    expect(msg.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const v = msg.value as any;
    expect(v.transfers[0].from).toBe('bb1user');
    expect(v.transfers[0].toAddresses).toEqual([details.backingAddress]);
    expect(v.transfers[0].prioritizedApprovals[0].approvalId).toBe('smart-token-withdraw');
  });
});
