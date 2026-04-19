/**
 * Tests for CLI template builders.
 *
 * Verifies that all builders produce valid { typeUrl, value } JSON
 * that passes the SDK's verifyStandardsCompliance checks.
 */
import { verifyStandardsCompliance } from '../../api-indexer/verify-standards.js';

import { buildVault } from './vault.js';
import { buildSubscription } from './subscription.js';
import { buildBounty } from './bounty.js';
import { buildCrowdfund } from './crowdfund.js';
import { buildAuction } from './auction.js';
import { buildProductCatalog } from './product-catalog.js';
import { buildPredictionMarket } from './prediction-market.js';
import { buildSmartAccount } from './smart-account.js';
import { buildCreditToken } from './credit-token.js';
import { buildCustom2FA } from './custom-2fa.js';
import { buildQuests } from './quests.js';
import { buildAddressList } from './address-list.js';
import { buildIntent } from './intent.js';
import { buildRecurringPayment } from './recurring-payment.js';
import { buildListing } from './listing.js';
import { buildBid } from './bid.js';
import { buildPmSellIntent } from './pm-sell-intent.js';
import { buildPmBuyIntent } from './pm-buy-intent.js';
import { resolveCoin, parseDuration, toBaseUnits } from './shared.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Unwrap { typeUrl, value } → value */
const val = (msg: any) => msg.value;

function verifyBuilder(msg: any) {
  return verifyStandardsCompliance({ messages: [msg] });
}

// ── Shared utility tests ─────────────────────────────────────────────────────

describe('shared utilities', () => {
  test('resolveCoin resolves USDC', () => {
    const coin = resolveCoin('USDC');
    expect(coin.symbol).toBe('USDC');
    expect(coin.decimals).toBe(6);
    expect(coin.denom).toContain('ibc/');
  });

  test('resolveCoin resolves BADGE', () => {
    const coin = resolveCoin('BADGE');
    expect(coin.symbol).toBe('BADGE');
    expect(coin.decimals).toBe(9);
    expect(coin.denom).toBe('ubadge');
  });

  test('resolveCoin resolves case-insensitively', () => {
    expect(resolveCoin('usdc').symbol).toBe('USDC');
    expect(resolveCoin('badge').symbol).toBe('BADGE');
  });

  test('resolveCoin throws for unknown coin', () => {
    expect(() => resolveCoin('FAKECOIN')).toThrow('Unknown coin');
    expect(() => resolveCoin('DOGECOIN')).toThrow('Unknown coin');
  });

  test('toBaseUnits converts correctly', () => {
    expect(toBaseUnits(10, 6)).toBe('10000000');
    expect(toBaseUnits(1, 9)).toBe('1000000000');
    expect(toBaseUnits(0.5, 6)).toBe('500000');
  });

  test('parseDuration parses various formats', () => {
    expect(parseDuration('30d')).toBe('2592000000');
    expect(parseDuration('1h')).toBe('3600000');
    expect(parseDuration('monthly')).toBe('2592000000');
    expect(parseDuration('daily')).toBe('86400000');
    expect(parseDuration('annually')).toBe('31536000000');
  });

  test('parseDuration throws for invalid input', () => {
    expect(() => parseDuration('invalid')).toThrow('Invalid duration');
  });
});

// ── Collection builder tests ─────────────────────────────────────────────────

describe('vault builder', () => {
  const msg = buildVault({ backingCoin: 'USDC' });
  const r = val(msg);

  test('produces { typeUrl, value }', () => {
    expect(msg.typeUrl).toBe('/tokenization.MsgUniversalUpdateCollection');
    expect(r.collectionId).toBe('0');
    expect(r.creator).toBe('');
  });

  test('has correct standards', () => {
    expect(r.standards).toContain('Smart Token');
    expect(r.standards).toContain('Vault');
  });

  test('has IBC backing invariants', () => {
    expect(r.invariants.cosmosCoinBackedPath).toBeDefined();
    expect(r.invariants.cosmosCoinBackedPath.conversion.sideA.denom).toContain('ibc/');
  });

  test('has deposit and withdrawal approvals', () => {
    expect(r.collectionApprovals.length).toBe(2);
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    // Vault uses `vault-deposit` + a randomized `vault-withdraw-<hex>`
    // id to match VaultApprovalRegistry's collision-avoidance pattern.
    expect(ids).toContain('vault-deposit');
    expect(ids.some((id: string) => id.startsWith('vault-withdraw-'))).toBe(true);
  });

  test('backing approvals have mustPrioritize and allowBackedMinting', () => {
    for (const a of r.collectionApprovals) {
      expect(a.approvalCriteria.mustPrioritize).toBe(true);
      expect(a.approvalCriteria.allowBackedMinting).toBe(true);
    }
  });

  // Helper: the withdraw approval has a random suffix, so tests find it
  // by prefix rather than exact match.
  const findWithdraw = (approvals: any[]) =>
    approvals.find((a: any) => typeof a.approvalId === 'string' && a.approvalId.startsWith('vault-withdraw-'));

  test('daily withdraw limit adds approvalAmounts', () => {
    const limited = val(buildVault({ backingCoin: 'USDC', dailyWithdrawLimit: 100 }));
    const withdrawal = findWithdraw(limited.collectionApprovals);
    expect(withdrawal.approvalCriteria.approvalAmounts).toBeDefined();
    expect(withdrawal.approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount).toBe('100000000');
  });

  test('require2fa adds mustOwnTokens', () => {
    const twoFa = val(buildVault({ backingCoin: 'USDC', require2fa: '74' }));
    const withdrawal = findWithdraw(twoFa.collectionApprovals);
    expect(withdrawal.approvalCriteria.mustOwnTokens).toBeDefined();
    expect(withdrawal.approvalCriteria.mustOwnTokens[0].collectionId).toBe('74');
  });

  test('emergency recovery adds migration approval', () => {
    const recovery = val(buildVault({ backingCoin: 'USDC', emergencyRecovery: 'bb1recovery' }));
    expect(recovery.collectionApprovals.length).toBe(3);
    const migration = recovery.collectionApprovals.find((a: any) => a.approvalId === 'vault-emergency-migration');
    expect(migration.toListId).toBe('bb1recovery');
  });

  test('passes verification', () => {
    const vr = verifyBuilder(msg);
    expect(vr.violations.filter((vi: any) => vi.standard === 'Vault')).toEqual([]);
    expect(vr.violations.filter((vi: any) => vi.standard === 'Smart Token')).toEqual([]);
  });
});

describe('smart-account builder', () => {
  const msg = buildSmartAccount({ backingCoin: 'USDC' });
  const r = val(msg);

  test('has Smart Token standard', () => { expect(r.standards).toContain('Smart Token'); });
  test('has backing and unbacking', () => {
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    // Renamed in the parity pass to match CollectionApprovalRegistry's
    // smart-account-* naming (frontend source of truth).
    expect(ids).toContain('smart-account-backing');
    expect(ids).toContain('smart-account-unbacking');
  });
  test('tradable adds Liquidity Pools', () => {
    const t = val(buildSmartAccount({ backingCoin: 'USDC', tradable: true }));
    expect(t.standards).toContain('Liquidity Pools');
    expect(t.invariants.disablePoolCreation).toBe(false);
  });
  test('aiAgentVault adds standard', () => {
    const t = val(buildSmartAccount({ backingCoin: 'USDC', aiAgentVault: true }));
    expect(t.standards).toContain('AI Agent Vault');
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Smart Token')).toEqual([]);
  });
});

describe('subscription builder', () => {
  const msg = buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test' });
  const r = val(msg);

  test('has Subscriptions standard', () => { expect(r.standards).toEqual(['Subscriptions']); });
  test('has durationFromTimestamp', () => {
    const ib = r.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances;
    expect(ib.durationFromTimestamp).toBe('2592000000');
    expect(ib.allowOverrideTimestamp).toBe(true);
  });
  test('coin transfer to recipient', () => {
    expect(r.collectionApprovals[0].approvalCriteria.coinTransfers[0].to).toBe('bb1test');
  });
  test('noCustomOwnershipTimes is false', () => { expect(r.invariants.noCustomOwnershipTimes).toBe(false); });
  test('multi-tier', () => {
    const mt = val(buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test', tiers: 3 }));
    expect(mt.validTokenIds).toEqual([{ start: '1', end: '3' }]);
    expect(mt.collectionApprovals.length).toBe(3);
  });
  test('multiple payouts (single denom)', () => {
    // Subscription protocol requires all coin transfers to share a denom.
    // Treasury splits across multiple recipients with the same coin are
    // legitimate; mixed denoms throw at build time (see builder.ts).
    const mp = val(buildSubscription({
      interval: 'monthly',
      payouts: [
        { recipient: 'bb1a', amount: 5, denom: 'USDC' },
        { recipient: 'bb1b', amount: 3, denom: 'USDC' }
      ]
    }));
    const cts = mp.collectionApprovals[0].approvalCriteria.coinTransfers;
    expect(cts.length).toBe(2);
    expect(cts[0].to).toBe('bb1a');
    expect(cts[1].to).toBe('bb1b');
  });

  test('multiple payouts with mixed denoms throws', () => {
    expect(() =>
      buildSubscription({
        interval: 'monthly',
        payouts: [
          { recipient: 'bb1a', amount: 5, denom: 'USDC' },
          { recipient: 'bb1b', amount: 3, denom: 'BADGE' }
        ]
      })
    ).toThrow(/single denom/);
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Subscription')).toEqual([]);
  });
});

describe('bounty builder', () => {
  const msg = buildBounty({ amount: 100, denom: 'USDC', verifier: 'bb1verifier', recipient: 'bb1recipient' });
  const r = val(msg);

  test('has Bounty standard', () => { expect(r.standards).toEqual(['Bounty']); });
  test('3 approvals', () => {
    expect(r.collectionApprovals.length).toBe(3);
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('bounty-accept');
    expect(ids).toContain('bounty-deny');
    expect(ids).toContain('bounty-expire');
  });
  test('accept/deny have voting, expire does not', () => {
    expect(r.collectionApprovals.find((a: any) => a.approvalId === 'bounty-accept').approvalCriteria.votingChallenges.length).toBe(1);
    expect(r.collectionApprovals.find((a: any) => a.approvalId === 'bounty-deny').approvalCriteria.votingChallenges.length).toBe(1);
    expect(r.collectionApprovals.find((a: any) => a.approvalId === 'bounty-expire').approvalCriteria.votingChallenges).toBeUndefined();
  });
  test('escrow coins', () => {
    expect(r.mintEscrowCoinsToTransfer[0].amount).toBe('100000000');
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Bounty')).toEqual([]);
  });
});

describe('crowdfund builder', () => {
  const msg = buildCrowdfund({ goal: 1000, denom: 'USDC' });
  const r = val(msg);

  test('has Crowdfund standard', () => { expect(r.standards).toEqual(['Crowdfund']); });
  test('2 token IDs', () => { expect(r.validTokenIds).toEqual([{ start: '1', end: '2' }]); });
  test('at least 4 approvals', () => { expect(r.collectionApprovals.length).toBeGreaterThanOrEqual(4); });
  test('crowdfunder address used', () => {
    const cf = val(buildCrowdfund({ goal: 1000, denom: 'USDC', crowdfunder: 'bb1fund' }));
    const progress = cf.collectionApprovals.find((a: any) => a.approvalId === 'deposit-progress');
    expect(progress.toListId).toBe('bb1fund');
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Crowdfund')).toEqual([]);
  });
});

describe('auction builder', () => {
  const msg = buildAuction({});
  const r = val(msg);

  test('has Auction standard', () => { expect(r.standards).toEqual(['Auction']); });
  test('bounded transfer times', () => {
    const mint = r.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    expect(mint.transferTimes[0].start).not.toBe('1');
  });
  test('maxNumTransfers = 1', () => {
    const mint = r.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    expect(mint.approvalCriteria.maxNumTransfers.overallMaxNumTransfers).toBe('1');
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Auction')).toEqual([]);
  });
});

describe('product-catalog builder', () => {
  const msg = buildProductCatalog({
    products: [{ name: 'T-Shirt', price: 25, denom: 'USDC' }, { name: 'Mug', price: 15, denom: 'USDC', maxSupply: 50 }],
    storeAddress: 'bb1store'
  });
  const r = val(msg);

  test('has Products standard', () => { expect(r.standards).toEqual(['Products']); });
  test('correct token IDs', () => { expect(r.validTokenIds).toEqual([{ start: '1', end: '2' }]); });
  test('purchase + burn approvals', () => { expect(r.collectionApprovals.length).toBe(3); });
  test('coin transfers to store', () => {
    for (const p of r.collectionApprovals.filter((a: any) => a.fromListId === 'Mint')) {
      expect(p.approvalCriteria.coinTransfers[0].to).toBe('bb1store');
    }
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Products')).toEqual([]);
  });
});

describe('prediction-market builder', () => {
  const msg = buildPredictionMarket({ verifier: 'bb1verifier' });
  const r = val(msg);

  test('has Prediction Market standard', () => { expect(r.standards).toEqual(['Prediction Market']); });
  test('YES/NO tokens', () => { expect(r.validTokenIds).toEqual([{ start: '1', end: '2' }]); });
  test('alias paths', () => {
    expect(r.aliasPathsToAdd.length).toBe(2);
    expect(r.aliasPathsToAdd.map((a: any) => a.denom)).toContain('uyes');
    expect(r.aliasPathsToAdd.map((a: any) => a.denom)).toContain('uno');
  });
  test('settlement voting challenges', () => {
    expect(r.collectionApprovals.filter((a: any) => a.approvalCriteria?.votingChallenges?.length > 0).length).toBeGreaterThanOrEqual(2);
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Prediction Market')).toEqual([]);
  });
});

describe('credit-token builder', () => {
  const msg = buildCreditToken({ paymentDenom: 'USDC', recipient: 'bb1recipient' });
  const r = val(msg);

  test('has Credit Token standard', () => { expect(r.standards).toEqual(['Credit Token']); });
  test('amount scaling', () => {
    expect(r.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling).toBe(true);
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Credit Token')).toEqual([]);
  });
});

describe('custom-2fa builder', () => {
  const msg = buildCustom2FA({ name: 'My 2FA Token' });
  const r = val(msg);

  test('has Custom-2FA standard', () => { expect(r.standards).toEqual(['Custom-2FA']); });
  test('allowPurgeIfExpired', () => { expect(r.collectionApprovals[0].approvalCriteria.autoDeletionOptions.allowPurgeIfExpired).toBe(true); });
  test('disablePoolCreation', () => { expect(r.invariants.disablePoolCreation).toBe(true); });
  test('burnable adds burn approval', () => {
    expect(val(buildCustom2FA({ name: 'Test', burnable: true })).collectionApprovals.length).toBe(2);
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Custom-2FA')).toEqual([]);
  });
});

describe('quests builder', () => {
  const msg = buildQuests({ reward: 10, denom: 'BADGE', maxClaims: 100 });
  const r = val(msg);

  test('has Quests standard', () => { expect(r.standards).toEqual(['Quests']); });
  test('correct escrow', () => { expect(r.mintEscrowCoinsToTransfer[0].amount).toBe('1000000000000'); });
  test('quest approval with escrow payout', () => {
    const q = r.collectionApprovals.find((a: any) => a.approvalId === 'quests-approval');
    expect(q.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress).toBe(true);
    expect(q.approvalCriteria.coinTransfers[0].overrideToWithInitiator).toBe(true);
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Quest')).toEqual([]);
  });
});

describe('address-list builder', () => {
  const msg = buildAddressList({ name: 'My List' });
  const r = val(msg);

  test('has Address List standard', () => { expect(r.standards).toEqual(['Address List']); });
  test('manager-add and manager-remove', () => {
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('manager-add');
    expect(ids).toContain('manager-remove');
  });
  test('passes verification', () => {
    expect(verifyBuilder(msg).violations.filter((vi: any) => vi.standard === 'Address List')).toEqual([]);
  });
});

// ── Approval builder tests ───────────────────────────────────────────────────

describe('intent builder', () => {
  const msg = buildIntent({ address: 'bb1creator', collectionId: '99', payDenom: 'USDC', payAmount: 100, receiveDenom: 'BADGE', receiveAmount: 50 });

  test('has MsgUpdateUserApprovals typeUrl', () => {
    expect(msg.typeUrl).toBe('/tokenization.MsgUpdateUserApprovals');
  });
  test('outgoing approval', () => { expect(msg.value.updateOutgoingApprovals).toBe(true); });
  test('dual coin transfers', () => {
    expect(msg.value.outgoingApprovals[0].approvalCriteria.coinTransfers.length).toBe(2);
  });
  test('first transfer pays creator', () => {
    expect(msg.value.outgoingApprovals[0].approvalCriteria.coinTransfers[0].to).toBe('bb1creator');
  });
  test('second from escrow to filler', () => {
    const ct = msg.value.outgoingApprovals[0].approvalCriteria.coinTransfers[1];
    expect(ct.overrideFromWithApproverAddress).toBe(true);
    expect(ct.overrideToWithInitiator).toBe(true);
  });
  test('auto-deletes', () => { expect(msg.value.outgoingApprovals[0].approvalCriteria.autoDeletionOptions.afterOneUse).toBe(true); });
  test('collectionId in meta', () => { expect(msg._meta.collectionId).toBe('99'); });
});

describe('recurring-payment builder', () => {
  const msg = buildRecurringPayment({ collectionId: '42', amount: 10, denom: 'USDC', interval: 'monthly', recipient: 'bb1recipient' });

  test('incoming approval', () => { expect(msg.value.updateIncomingApprovals).toBe(true); });
  test('recurring times', () => {
    const ib = msg.value.incomingApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances;
    expect(ib.durationFromTimestamp).toBe('2592000000');
    expect(ib.allowOverrideTimestamp).toBe(true);
  });
  test('coin transfer to recipient', () => {
    expect(msg.value.incomingApprovals[0].approvalCriteria.coinTransfers[0].to).toBe('bb1recipient');
  });
  test('collectionId in meta', () => { expect(msg._meta.collectionId).toBe('42'); });
});

describe('listing builder', () => {
  const msg = buildListing({ address: 'bb1seller', collectionId: '1', tokenIds: '1-5', price: 50, denom: 'USDC' });

  test('outgoing approval', () => { expect(msg.value.updateOutgoingApprovals).toBe(true); });
  test('token range', () => { expect(msg.value.outgoingApprovals[0].tokenIds).toEqual([{ start: '1', end: '5' }]); });
  test('pays seller', () => { expect(msg.value.outgoingApprovals[0].approvalCriteria.coinTransfers[0].to).toBe('bb1seller'); });
  test('auto-deletes after max', () => { expect(msg.value.outgoingApprovals[0].approvalCriteria.autoDeletionOptions.afterOverallMaxNumTransfers).toBe(true); });
});

describe('bid builder', () => {
  const msg = buildBid({ address: 'bb1bidder', collectionId: '1', tokenIds: '3', price: 25, denom: 'BADGE' });

  test('incoming approval', () => { expect(msg.value.updateIncomingApprovals).toBe(true); });
  test('single token ID', () => { expect(msg.value.incomingApprovals[0].tokenIds).toEqual([{ start: '3', end: '3' }]); });
  test('escrow-funded', () => {
    const ct = msg.value.incomingApprovals[0].approvalCriteria.coinTransfers[0];
    expect(ct.overrideFromWithApproverAddress).toBe(true);
    expect(ct.overrideToWithInitiator).toBe(true);
  });
  test('auto-deletes', () => { expect(msg.value.incomingApprovals[0].approvalCriteria.autoDeletionOptions.afterOneUse).toBe(true); });
});

describe('pm-sell-intent builder', () => {
  const msg = buildPmSellIntent({ address: 'bb1seller', collectionId: '42', token: 'yes', amount: 100, price: 50, denom: 'USDC' });

  test('outgoing approval', () => { expect(msg.value.updateOutgoingApprovals).toBe(true); });
  test('YES = token ID 1', () => { expect(msg.value.outgoingApprovals[0].tokenIds).toEqual([{ start: '1', end: '1' }]); });
  test('NO = token ID 2', () => {
    const no = buildPmSellIntent({ address: 'bb1', collectionId: '42', token: 'no', amount: 1, price: 1, denom: 'USDC' });
    expect(no.value.outgoingApprovals[0].tokenIds).toEqual([{ start: '2', end: '2' }]);
  });
  test('pays seller', () => { expect(msg.value.outgoingApprovals[0].approvalCriteria.coinTransfers[0].to).toBe('bb1seller'); });
  test('meta', () => { expect(msg._meta.collectionId).toBe('42'); expect(msg._meta.token).toBe('yes'); });
});

describe('pm-buy-intent builder', () => {
  const msg = buildPmBuyIntent({ address: 'bb1buyer', collectionId: '42', token: 'no', amount: 200, price: 30, denom: 'USDC' });

  test('incoming approval', () => { expect(msg.value.updateIncomingApprovals).toBe(true); });
  test('NO = token ID 2', () => { expect(msg.value.incomingApprovals[0].tokenIds).toEqual([{ start: '2', end: '2' }]); });
  test('escrow-funded', () => {
    const ct = msg.value.incomingApprovals[0].approvalCriteria.coinTransfers[0];
    expect(ct.overrideFromWithApproverAddress).toBe(true);
    expect(ct.overrideToWithInitiator).toBe(true);
  });
  test('meta', () => { expect(msg._meta.collectionId).toBe('42'); expect(msg._meta.escrowCoins.length).toBe(1); });
});

// ── Zero-violations suite: every builder must pass ALL standard checks ───────

describe('all collection builders pass verifyStandardsCompliance with zero violations', () => {
  const builders: [string, any][] = [
    ['vault', buildVault({ backingCoin: 'USDC' })],
    ['vault (with limits)', buildVault({ backingCoin: 'USDC', dailyWithdrawLimit: 100, require2fa: '74', emergencyRecovery: 'bb1recovery' })],
    ['smart-account', buildSmartAccount({ backingCoin: 'USDC' })],
    ['smart-account (tradable)', buildSmartAccount({ backingCoin: 'USDC', tradable: true })],
    ['smart-account (ai-agent)', buildSmartAccount({ backingCoin: 'BADGE', aiAgentVault: true })],
    ['subscription (single)', buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test' })],
    ['subscription (multi-tier)', buildSubscription({ interval: 'daily', price: 5, denom: 'BADGE', recipient: 'bb1r', tiers: 3 })],
    // Subscription faucet approvals must use a SINGLE denom — see
    // buildSubscription's runtime check and the proto-level
    // `doesCollectionFollowSubscriptionProtocol()` rule. Multiple
    // recipients sharing one denom is valid (treasury split); mixing
    // denoms is not.
    ['subscription (multi-payout)', buildSubscription({ interval: 'monthly', payouts: [{ recipient: 'bb1a', amount: 5, denom: 'USDC' }, { recipient: 'bb1b', amount: 3, denom: 'USDC' }] })],
    ['bounty', buildBounty({ amount: 100, denom: 'USDC', verifier: 'bb1v', recipient: 'bb1r' })],
    ['bounty (BADGE)', buildBounty({ amount: 50, denom: 'BADGE', verifier: 'bb1v', recipient: 'bb1r', expiration: '7d' })],
    ['crowdfund', buildCrowdfund({ goal: 1000, denom: 'USDC' })],
    ['crowdfund (with crowdfunder)', buildCrowdfund({ goal: 500, denom: 'BADGE', crowdfunder: 'bb1fund', deadline: '14d' })],
    ['auction', buildAuction({})],
    ['auction (custom times)', buildAuction({ bidDeadline: '3d', acceptWindow: '1d' })],
    ['product-catalog', buildProductCatalog({ products: [{ name: 'Item', price: 10, denom: 'USDC' }], storeAddress: 'bb1s' })],
    ['product-catalog (multi)', buildProductCatalog({ products: [{ name: 'A', price: 5, denom: 'BADGE' }, { name: 'B', price: 10, denom: 'USDC', maxSupply: 50, burn: true }], storeAddress: 'bb1s' })],
    ['prediction-market', buildPredictionMarket({ verifier: 'bb1v' })],
    ['credit-token', buildCreditToken({ paymentDenom: 'USDC', recipient: 'bb1r' })],
    ['credit-token (custom)', buildCreditToken({ paymentDenom: 'BADGE', recipient: 'bb1r', symbol: 'CRED', tokensPerUnit: 50 })],
    ['custom-2fa', buildCustom2FA({ name: 'My 2FA' })],
    ['custom-2fa (burnable)', buildCustom2FA({ name: 'Burnable 2FA', burnable: true })],
    ['quests', buildQuests({ reward: 10, denom: 'BADGE', maxClaims: 100 })],
    ['address-list', buildAddressList({ name: 'My List' })],
  ];

  for (const [name, msg] of builders) {
    test(`${name}: zero violations`, () => {
      const result = verifyBuilder(msg);
      if (result.violations.length > 0) {
        const details = result.violations.map((v: any) => `[${v.standard}] ${v.field}: ${v.message}`).join('\n');
        throw new Error(`${name} has ${result.violations.length} violation(s):\n${details}`);
      }
    });
  }
});

// ── Negative / edge-case tests ───────────────────────────────────────────────

describe('error handling', () => {
  test('resolveCoin throws for unknown symbol', () => {
    expect(() => resolveCoin('FAKECOIN')).toThrow('Unknown coin');
  });

  test('parseDuration throws for garbage input', () => {
    expect(() => parseDuration('notaduration')).toThrow('Invalid duration');
    expect(() => parseDuration('')).toThrow('Invalid duration');
    expect(() => parseDuration('abc123')).toThrow('Invalid duration');
  });

  test('buildSubscription throws without price or payouts', () => {
    expect(() => buildSubscription({ interval: 'monthly' } as any)).toThrow();
  });

  test('buildBounty with zero amount still produces valid structure', () => {
    const msg = buildBounty({ amount: 0, denom: 'BADGE', verifier: 'bb1v', recipient: 'bb1r' });
    expect(msg.typeUrl).toBe('/tokenization.MsgUniversalUpdateCollection');
    expect(msg.value.collectionApprovals.length).toBe(3);
  });

  test('buildProductCatalog with empty products produces burn-only collection', () => {
    const msg = buildProductCatalog({ products: [], storeAddress: 'bb1s' });
    // Only burn approval, no purchase approvals
    expect(msg.value.collectionApprovals.length).toBe(1);
  });

  test('buildCrowdfund goal of 1 base unit works', () => {
    const msg = buildCrowdfund({ goal: 0.000001, denom: 'USDC' });
    expect(msg.value.collectionApprovals.length).toBeGreaterThanOrEqual(4);
  });

  test('buildAuction with very short windows works', () => {
    const msg = buildAuction({ bidDeadline: '1m', acceptWindow: '1m' });
    expect(msg.typeUrl).toBe('/tokenization.MsgUniversalUpdateCollection');
  });

  test('buildIntent with same pay/receive denom works', () => {
    const msg = buildIntent({ address: 'bb1a', collectionId: '1', payDenom: 'BADGE', payAmount: 10, receiveDenom: 'BADGE', receiveAmount: 5 });
    expect(msg.typeUrl).toBe('/tokenization.MsgUpdateUserApprovals');
  });

  test('buildListing parses single token ID', () => {
    const msg = buildListing({ address: 'bb1a', collectionId: '1', tokenIds: '42', price: 10, denom: 'BADGE' });
    expect(msg.value.outgoingApprovals[0].tokenIds).toEqual([{ start: '42', end: '42' }]);
  });

  test('buildPmSellIntent invalid token value still works', () => {
    // TypeScript would catch this, but runtime should not crash
    const msg = buildPmSellIntent({ address: 'bb1a', collectionId: '1', token: 'yes', amount: 1, price: 1, denom: 'BADGE' });
    expect(msg.value.outgoingApprovals[0].tokenIds).toEqual([{ start: '1', end: '1' }]);
  });
});
