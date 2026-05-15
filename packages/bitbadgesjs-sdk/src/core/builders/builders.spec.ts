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
import { buildPaymentRequest } from './payment-request.js';
import { buildCrowdfund } from './crowdfund.js';
import { buildAuction } from './auction.js';
import { buildProductCatalog } from './product-catalog.js';
import { buildPredictionMarket } from './prediction-market.js';
import { buildSmartToken } from './smart-token.js';
import { buildCreditToken } from './credit-token.js';
import {
  buildCustom2FA,
  mintCustom2FA,
  getCustom2FAOwnershipTimes,
  CUSTOM_2FA_TOKEN_EXPIRATION_MS
} from './custom-2fa.js';
import { buildQuests } from './quests.js';
import { buildAddressList } from './address-list.js';
import { buildIntent } from './intent.js';
import { buildListing } from './listing.js';
import { buildBid } from './bid.js';
import { buildPmSellIntent } from './pm-sell-intent.js';
import { buildPmBuyIntent } from './pm-buy-intent.js';
import { resolveCoin, parseDuration, toBaseUnits, sanitizeCosmosPathName } from './shared.js';
import { buildPredictionMarketBuyIntent, buildPredictionMarketSellIntent } from '../prediction-markets.js';
import { buildIntentApproval } from '../intents.js';
import { buildOrderbookBidApproval, buildOrderbookListingApproval } from '../bids.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Unwrap { typeUrl, value } → value */
const val = (msg: any) => msg.value;

function verifyBuilder(msg: any) {
  return verifyStandardsCompliance({ messages: [msg] });
}

/** Every approvalId + amountTrackerId in a built msg, in document order. */
function trackedIds(msg: any): string[] {
  const v = msg.value ?? msg;
  const approvals = [
    ...(v.collectionApprovals ?? []),
    ...(v.incomingApprovals ?? []),
    ...(v.outgoingApprovals ?? [])
  ];
  const ids: string[] = [];
  for (const a of approvals) {
    if (a?.approvalId) ids.push(a.approvalId);
    const t = a?.approvalCriteria?.maxNumTransfers?.amountTrackerId;
    if (t) ids.push(t);
  }
  return ids;
}

/**
 * Asserts the verifier returns zero violations of any kind (not just the
 * builder's own standard). Surfaces the violation list on failure.
 */
function expectCleanVerification(msg: any) {
  const vr = verifyBuilder(msg);
  expect({ valid: vr.valid, violations: vr.violations }).toEqual({ valid: true, violations: [] });
}

/** Required metadata fields for collection-style builders (post-#0371). */
const META = { name: 'Test', description: 'Test description for the spec.', image: 'ipfs://test-image' };

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

  test('toBaseUnits throws on invalid amounts instead of silently coercing', () => {
    expect(() => toBaseUnits(-1, 6)).toThrow(/non-negative/i);
    expect(() => toBaseUnits(Infinity, 6)).toThrow(/finite/i);
    expect(() => toBaseUnits(NaN, 6)).toThrow(/finite/i);
    // Numeric-string tolerance (the old implicit-coercion path) is preserved.
    expect(toBaseUnits('10' as any, 6)).toBe('10000000');
    // Non-numeric / undefined no longer silently become "NaN".
    expect(() => toBaseUnits('abc' as any, 6)).toThrow(/finite/i);
    expect(() => toBaseUnits(undefined as any, 6)).toThrow(/finite/i);
    // Precision-losing magnitudes throw rather than emit a lossy integer.
    expect(() => toBaseUnits(1e30, 18)).toThrow(/precision/i);
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

  test('sanitizeCosmosPathName passes clean input through', () => {
    expect(sanitizeCosmosPathName('vUSDC', 'symbol')).toBe('vUSDC');
    expect(sanitizeCosmosPathName('CREDIT', 'symbol')).toBe('CREDIT');
  });
  test('sanitizeCosmosPathName throws on disallowed chars (no silent strip)', () => {
    expect(() => sanitizeCosmosPathName('vUSDC1', 'symbol')).toThrow(/contains characters the chain rejects/);
    expect(() => sanitizeCosmosPathName('vUSDC1', 'symbol')).toThrow(/vUSDC/); // suggests the cleaned form
    expect(() => sanitizeCosmosPathName('123', 'symbol')).toThrow(/no valid characters/);
  });
});

// ── Collection builder tests ─────────────────────────────────────────────────

describe('vault builder', () => {
  const msg = buildVault({ backingCoin: 'USDC', ...META });
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
    // Vault uses `vault-deposit` + a deterministic `vault-withdraw-<hex>`
    // id. The `vault-withdraw-` prefix is required: the frontend's
    // `isVaultWithdrawalTier` does `startsWith('vault-withdraw-')`.
    expect(ids).toContain('vault-deposit');
    expect(ids.some((id: string) => id.startsWith('vault-withdraw-'))).toBe(true);
  });

  test('backing approvals have mustPrioritize and allowBackedMinting', () => {
    for (const a of r.collectionApprovals) {
      expect(a.approvalCriteria.mustPrioritize).toBe(true);
      expect(a.approvalCriteria.allowBackedMinting).toBe(true);
    }
  });

  // The withdraw approval has a deterministic hash suffix, so tests find
  // it by the (FE-required) `vault-withdraw-` prefix, not exact match.
  const findWithdraw = (approvals: any[]) =>
    approvals.find((a: any) => typeof a.approvalId === 'string' && a.approvalId.startsWith('vault-withdraw-'));

  test('daily withdraw limit adds approvalAmounts', () => {
    const limited = val(buildVault({ backingCoin: 'USDC', dailyWithdrawLimit: 100, ...META }));
    const withdrawal = findWithdraw(limited.collectionApprovals);
    expect(withdrawal.approvalCriteria.approvalAmounts).toBeDefined();
    expect(withdrawal.approvalCriteria.approvalAmounts.perInitiatedByAddressApprovalAmount).toBe('100000000');
  });

  test('require2fa adds mustOwnTokens', () => {
    const twoFa = val(buildVault({ backingCoin: 'USDC', require2fa: '74', ...META }));
    const withdrawal = findWithdraw(twoFa.collectionApprovals);
    expect(withdrawal.approvalCriteria.mustOwnTokens).toBeDefined();
    expect(withdrawal.approvalCriteria.mustOwnTokens[0].collectionId).toBe('74');
  });

  test('emergency recovery adds migration approval', () => {
    const recovery = val(buildVault({ backingCoin: 'USDC', emergencyRecovery: 'bb1recovery', ...META }));
    expect(recovery.collectionApprovals.length).toBe(3);
    const migration = recovery.collectionApprovals.find((a: any) => a.approvalId === 'vault-emergency-migration');
    expect(migration.toListId).toBe('bb1recovery');
  });

  test('deterministic — identical params produce a byte-identical msg', () => {
    expect(buildVault({ backingCoin: 'USDC', ...META })).toEqual(
      buildVault({ backingCoin: 'USDC', ...META })
    );
  });

  test('withdraw id is a stable hash, not Math.random', () => {
    const a = findWithdraw(val(buildVault({ backingCoin: 'USDC', ...META })).collectionApprovals);
    const b = findWithdraw(val(buildVault({ backingCoin: 'USDC', ...META })).collectionApprovals);
    expect(a.approvalId).toBe(b.approvalId);
    expect(a.approvalId.startsWith('vault-withdraw-')).toBe(true);
  });

  test('withdraw approval is locked — canUpdateCollectionApprovals frozen', () => {
    // Was baselinePermissions() (mutable): the manager could revoke the
    // withdraw approval post-deposit and trap funds. Must match the FE
    // vaultHelpers.buildVaultPermissions() fully-frozen shape.
    expect(r.collectionPermissions.canUpdateCollectionApprovals.length).toBeGreaterThan(0);
    expect(r.collectionPermissions.canUpdateManager.length).toBeGreaterThan(0);
  });
  test('passes verification with zero violations', () => {
    expectCleanVerification(msg);
  });
});

describe('smart-token builder', () => {
  const msg = buildSmartToken({ backingCoin: 'USDC', ...META });
  const r = val(msg);

  test('has Smart Token standard', () => { expect(r.standards).toContain('Smart Token'); });
  test('has deposit and withdraw approvals', () => {
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('smart-token-deposit');
    expect(ids).toContain('smart-token-withdraw');
  });
  test('tradable adds Liquidity Pools', () => {
    const t = val(buildSmartToken({ backingCoin: 'USDC', tradable: true, ...META }));
    expect(t.standards).toContain('Liquidity Pools');
    expect(t.invariants.disablePoolCreation).toBe(false);
  });
  test('aiAgentVault adds standard', () => {
    const t = val(buildSmartToken({ backingCoin: 'USDC', aiAgentVault: true, ...META }));
    expect(t.standards).toContain('AI Agent Vault');
  });
  test('deterministic — identical params produce byte-identical msg', () => {
    expect(buildSmartToken({ backingCoin: 'USDC', ...META })).toEqual(buildSmartToken({ backingCoin: 'USDC', ...META }));
  });
  test('passes verification with zero violations (any standard)', () => {
    expectCleanVerification(msg);
  });
});

describe('subscription builder', () => {
  const msg = buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test', ...META });
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
    const mt = val(buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test', tiers: 3, ...META }));
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
      ],
      ...META
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
  test('deterministic — identical params produce byte-identical msg', () => {
    expect(buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test', ...META }))
      .toEqual(buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test', ...META }));
  });
  test('passes verification with zero violations (any standard)', () => {
    expectCleanVerification(msg);
  });
});

describe('bounty builder', () => {
  const msg = buildBounty({ amount: 100, denom: 'USDC', verifier: 'bb1verifier', recipient: 'bb1recipient', submitter: 'bb1submitter', ...META });
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
  test('deterministic votingChallenges proposalIds (no uniqueId)', () => {
    const p = { amount: 100, denom: 'USDC', verifier: 'bb1v', recipient: 'bb1r', submitter: 'bb1s', ...META };
    const a = val(buildBounty(p)).collectionApprovals;
    const b = val(buildBounty(p)).collectionApprovals;
    const pid = (c: any[], id: string) =>
      c.find((x: any) => x.approvalId === id).approvalCriteria.votingChallenges[0].proposalId;
    expect(pid(a, 'bounty-accept')).toBe(pid(b, 'bounty-accept'));
    expect(pid(a, 'bounty-deny')).toBe(pid(b, 'bounty-deny'));
    expect(pid(a, 'bounty-accept')).not.toBe(pid(a, 'bounty-deny'));
    expect(pid(a, 'bounty-accept').startsWith('bounty-accept-')).toBe(true);
    // distinct params → distinct proposalId
    expect(pid(val(buildBounty({ ...p, amount: 101 })).collectionApprovals, 'bounty-accept'))
      .not.toBe(pid(a, 'bounty-accept'));
  });
  test('deterministic — whole msg byte-identical with the Date.now expiry window normalized out', () => {
    // bounty's `transferTimes.end` is `durationToTimestamp` (Date.now-
    // relative), so a bare toEqual would flake; everything else the
    // builder controls must be byte-identical across calls.
    const p = { amount: 100, denom: 'USDC', verifier: 'bb1v', recipient: 'bb1r', submitter: 'bb1s', ...META };
    const stripTimes = (v: any): any =>
      Array.isArray(v)
        ? v.map(stripTimes)
        : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, val]) => [k, k === 'transferTimes' ? 'WINDOW' : stripTimes(val)]))
        : v;
    expect(stripTimes(buildBounty(p))).toEqual(stripTimes(buildBounty(p)));
  });
  test('passes verification with zero violations (any standard)', () => {
    expectCleanVerification(msg);
  });
});

describe('payment-request builder', () => {
  const msg = buildPaymentRequest({
    amount: 10,
    denom: 'USDC',
    payer: 'bb1payer',
    recipient: 'bb1recipient',
    context: 'Agent X requesting payment for completed task Y on behalf of org Z under approved budget envelope.',
    name: 'Test',
    image: 'ipfs://test-image'
  });
  const r = val(msg);

  test('has PaymentRequest standard', () => { expect(r.standards).toEqual(['PaymentRequest']); });
  test('2 approvals (pay + deny — no expire branch)', () => {
    expect(r.collectionApprovals.length).toBe(2);
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('payment-request-pay');
    expect(ids).toContain('payment-request-deny');
  });
  test('NO mintEscrowCoinsToTransfer (no-escrow inversion vs. Bounty)', () => {
    expect(r.mintEscrowCoinsToTransfer).toEqual([]);
  });
  test('pay approval debits initiator (overrideFromWithApproverAddress=false)', () => {
    const pay = r.collectionApprovals.find((a: any) => a.approvalId === 'payment-request-pay');
    expect(pay.approvalCriteria.coinTransfers.length).toBe(1);
    expect(pay.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress).toBe(false);
    expect(pay.approvalCriteria.coinTransfers[0].to).toBe('bb1recipient');
  });
  test('both approvals gated to payer via initiatedByListId', () => {
    const pay = r.collectionApprovals.find((a: any) => a.approvalId === 'payment-request-pay');
    const deny = r.collectionApprovals.find((a: any) => a.approvalId === 'payment-request-deny');
    expect(pay.initiatedByListId).toBe('bb1payer');
    expect(deny.initiatedByListId).toBe('bb1payer');
  });
  test('no votingChallenges (gating is via initiatedByListId, not voting)', () => {
    for (const a of r.collectionApprovals) {
      expect(a.approvalCriteria.votingChallenges).toBeUndefined();
    }
  });
  test('deterministic approval ids (no random ids; time window aside)', () => {
    const prParams = { amount: 10, denom: 'USDC', payer: 'bb1payer', recipient: 'bb1recipient', context: 'ctx', name: 'Test', image: 'ipfs://test-image' };
    const ids = (m: any) => m.value.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids(buildPaymentRequest(prParams))).toEqual(ids(buildPaymentRequest(prParams)));
  });
  test('passes verification with zero violations (any standard)', () => {
    expectCleanVerification(msg);
  });
});

describe('crowdfund builder', () => {
  const params = { goal: 1000, denom: 'USDC', crowdfunder: 'bb1fund', ...META };
  const msg = buildCrowdfund(params);
  const r = val(msg);

  test('has Crowdfund standard', () => { expect(r.standards).toEqual(['Crowdfund']); });
  test('2 token IDs', () => { expect(r.validTokenIds).toEqual([{ start: '1', end: '2' }]); });
  test('at least 4 approvals', () => { expect(r.collectionApprovals.length).toBeGreaterThanOrEqual(4); });
  test('crowdfunder address used', () => {
    const progress = r.collectionApprovals.find((a: any) => a.approvalId === 'deposit-progress');
    expect(progress.toListId).toBe('bb1fund');
  });

  test('throws without a payout address (no crowdfunder/creator)', () => {
    expect(() => buildCrowdfund({ goal: 1000, denom: 'USDC', ...META })).toThrow(
      /requires a payout address/
    );
  });
  test('falls back to creator when crowdfunder omitted', () => {
    const viaCreator = val(buildCrowdfund({ goal: 1000, denom: 'USDC', creator: 'bb1creator', ...META }));
    const progress = viaCreator.collectionApprovals.find((a: any) => a.approvalId === 'deposit-progress');
    expect(progress.toListId).toBe('bb1creator');
  });
  test('success + refund gate on the crowdfunder via ownershipCheckParty', () => {
    for (const idName of ['success', 'refund']) {
      const a = r.collectionApprovals.find((x: any) => x.approvalId === idName);
      expect(a.approvalCriteria.mustOwnTokens[0].ownershipCheckParty).toBe('bb1fund');
    }
  });
  test('deterministic — stable ids + payout gate across calls', () => {
    // deadlineTs is Date.now()-relative (pre-existing), so compare the
    // parts the builder controls deterministically.
    const a = val(buildCrowdfund(params));
    const b = val(buildCrowdfund(params));
    expect(a.collectionApprovals.map((x: any) => x.approvalId))
      .toEqual(b.collectionApprovals.map((x: any) => x.approvalId));
    expect(a.collectionApprovals.find((x: any) => x.approvalId === 'refund').approvalCriteria.mustOwnTokens[0].ownershipCheckParty)
      .toBe(b.collectionApprovals.find((x: any) => x.approvalId === 'refund').approvalCriteria.mustOwnTokens[0].ownershipCheckParty);
  });
  test('passes verification with zero violations', () => {
    expectCleanVerification(msg);
  });
});

describe('auction builder', () => {
  const msg = buildAuction({ ...META });
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
  test('deterministic approval ids — no Math.random', () => {
    // transferTimes are Date.now()-relative (pre-existing, out of scope),
    // so assert id determinism rather than full-msg deep-equal.
    expect(trackedIds(buildAuction({ ...META }))).toEqual(trackedIds(buildAuction({ ...META })));
    expect(r.collectionApprovals.map((a: any) => a.approvalId)).toEqual([
      'auction-mint-to-winner', 'auction-burn'
    ]);
  });
  test('passes verification with zero violations', () => {
    expectCleanVerification(msg);
  });
});

describe('product-catalog builder', () => {
  const msg = buildProductCatalog({
    products: [{ name: 'T-Shirt', price: 25, denom: 'USDC' }, { name: 'Mug', price: 15, denom: 'USDC', maxSupply: 50 }],
    storeAddress: 'bb1store',
    ...META
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
  test('deterministic — identical params produce a byte-identical msg', () => {
    const p = {
      products: [{ name: 'T-Shirt', price: 25, denom: 'USDC' }, { name: 'Mug', price: 15, denom: 'USDC', maxSupply: 50 }],
      storeAddress: 'bb1store',
      ...META
    };
    expect(buildProductCatalog(p)).toEqual(buildProductCatalog(p));
  });
  test('purchase ids are 1-based index, burn id is stable', () => {
    expect(r.collectionApprovals.map((a: any) => a.approvalId)).toEqual([
      'product-purchase-1', 'product-purchase-2', 'product-burn'
    ]);
  });
  test('passes verification with zero violations', () => {
    expectCleanVerification(msg);
  });
  test('maxSupply: present cap emits overallMaxNumTransfers; omitted = unlimited', () => {
    const cap = val(buildProductCatalog({
      products: [{ name: 'Capped', price: 1, denom: 'USDC', maxSupply: 50 }],
      storeAddress: 'bb1store', ...META
    })).collectionApprovals.find((a: any) => a.approvalId === 'product-purchase-1');
    expect(cap.approvalCriteria.maxNumTransfers.overallMaxNumTransfers).toBe('50');

    const unlimited = val(buildProductCatalog({
      products: [{ name: 'Unl', price: 1, denom: 'USDC' }],
      storeAddress: 'bb1store', ...META
    })).collectionApprovals.find((a: any) => a.approvalId === 'product-purchase-1');
    expect(unlimited.approvalCriteria.maxNumTransfers.overallMaxNumTransfers).toBe('0');
  });
  test('maxSupply: rejects negative / non-integer instead of silently going unlimited', () => {
    expect(() => buildProductCatalog({
      products: [{ name: 'Bad', price: 1, denom: 'USDC', maxSupply: -1 }],
      storeAddress: 'bb1store', ...META
    })).toThrow(/maxSupply/i);
    expect(() => buildProductCatalog({
      products: [{ name: 'Bad', price: 1, denom: 'USDC', maxSupply: 1.5 }],
      storeAddress: 'bb1store', ...META
    })).toThrow(/maxSupply/i);
  });
});

describe('prediction-market builder', () => {
  const msg = buildPredictionMarket({ verifier: 'bb1verifier', ...META });
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
  test('deterministic — identical params produce a byte-identical msg', () => {
    expect(buildPredictionMarket({ verifier: 'bb1verifier', ...META })).toEqual(
      buildPredictionMarket({ verifier: 'bb1verifier', ...META })
    );
  });
  test('seven distinct pm-<role>-<hash> approval ids, stable across calls', () => {
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids.length).toBe(7);
    expect(new Set(ids).size).toBe(7);
    expect(ids.every((id: string) => /^pm-(mint|transfer|redeem|settle-(yes|no|push-yes|push-no))-[0-9a-f]{16}$/.test(id))).toBe(true);
  });
  test('passes verification with zero violations', () => {
    expectCleanVerification(msg);
  });
});

describe('credit-token builder', () => {
  const msg = buildCreditToken({ paymentDenom: 'USDC', recipient: 'bb1recipient', ...META });
  const r = val(msg);

  test('has Credit Token standard', () => { expect(r.standards).toEqual(['Credit Token']); });
  test('amount scaling', () => {
    expect(r.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling).toBe(true);
  });
  test('deterministic — identical params produce byte-identical msg', () => {
    expect(buildCreditToken({ paymentDenom: 'USDC', recipient: 'bb1recipient', ...META }))
      .toEqual(buildCreditToken({ paymentDenom: 'USDC', recipient: 'bb1recipient', ...META }));
  });
  test('passes verification with zero violations (any standard)', () => {
    expectCleanVerification(msg);
  });
});

describe('custom-2fa builder', () => {
  const META2FA = { name: 'My 2FA Token', description: 'A 2FA token for testing.', image: 'ipfs://test-image' };
  const msg = buildCustom2FA({ ...META2FA, creator: 'bb1manager' });
  const r = val(msg);

  test('has Custom-2FA standard', () => { expect(r.standards).toEqual(['Custom-2FA']); });
  test('allowPurgeIfExpired', () => { expect(r.collectionApprovals[0].approvalCriteria.autoDeletionOptions.allowPurgeIfExpired).toBe(true); });
  test('disablePoolCreation', () => { expect(r.invariants.disablePoolCreation).toBe(true); });
  test('burnable adds burn approval', () => {
    expect(val(buildCustom2FA({ ...META2FA, creator: 'bb1manager', burnable: true })).collectionApprovals.length).toBe(2);
  });

  test('mint approval restricted to manager (not All)', () => {
    const mint = r.collectionApprovals.find((a: any) => a.approvalId === 'custom-2fa-mint');
    expect(mint.initiatedByListId).toBe('bb1manager');
    expect(mint.initiatedByListId).not.toBe('All');
  });
  test('throws without a manager address (no creator)', () => {
    expect(() => buildCustom2FA({ ...META2FA })).toThrow(/requires a manager address/);
  });
  test('deterministic — identical params produce a byte-identical msg', () => {
    const p = { ...META2FA, creator: 'bb1manager' };
    expect(buildCustom2FA(p)).toEqual(buildCustom2FA(p));
  });
  test('passes verification with zero violations', () => {
    expectCleanVerification(msg);
  });
});

describe('mintCustom2FA (mint-side expiry helper, ticket 0407)', () => {
  test('default lifetime window is exactly 5 minutes (300000ms)', () => {
    const msg = mintCustom2FA({ creator: 'bb1mgr', collectionId: '84', recipients: ['bb1user'] });
    expect(msg.typeUrl).toBe('/tokenization.MsgTransferTokens');
    const ot = msg.value.transfers[0].balances[0].ownershipTimes[0];
    expect(Number(ot.end) - Number(ot.start)).toBe(CUSTOM_2FA_TOKEN_EXPIRATION_MS);
    expect(CUSTOM_2FA_TOKEN_EXPIRATION_MS).toBe(300000);
  });
  test('custom lifetime is honored', () => {
    const msg = mintCustom2FA({ creator: 'bb1mgr', collectionId: '84', recipients: ['bb1user'], expirationMs: 600000 });
    const ot = msg.value.transfers[0].balances[0].ownershipTimes[0];
    expect(Number(ot.end) - Number(ot.start)).toBe(600000);
  });
  test('getCustom2FAOwnershipTimes round-trips the FE window', () => {
    const [t] = getCustom2FAOwnershipTimes();
    expect(Number(t.end) - Number(t.start)).toBe(300000);
  });
  test('mints token id 1, amount 1, from Mint', () => {
    const t = mintCustom2FA({ creator: 'bb1mgr', collectionId: '84', recipients: ['bb1a', 'bb1b'] }).value.transfers[0];
    expect(t.from).toBe('Mint');
    expect(t.toAddresses).toEqual(['bb1a', 'bb1b']);
    expect(t.balances[0].amount).toBe('1');
    expect(t.balances[0].tokenIds).toEqual([{ start: '1', end: '1' }]);
  });
  test('de-dupes recipients', () => {
    const t = mintCustom2FA({ creator: 'bb1mgr', collectionId: '84', recipients: ['bb1a', 'bb1a', 'bb1b'] }).value.transfers[0];
    expect(t.toAddresses).toEqual(['bb1a', 'bb1b']);
  });
  test('throws without a manager (creator)', () => {
    expect(() => mintCustom2FA({ creator: '', collectionId: '84', recipients: ['bb1a'] })).toThrow(/manager/i);
  });
  test('throws without recipients', () => {
    expect(() => mintCustom2FA({ creator: 'bb1mgr', collectionId: '84', recipients: [] })).toThrow(/recipient/i);
  });
  test('throws on non-positive lifetime', () => {
    expect(() => mintCustom2FA({ creator: 'bb1mgr', collectionId: '84', recipients: ['bb1a'], expirationMs: 0 })).toThrow(/positive/i);
  });
});

describe('quests builder', () => {
  const msg = buildQuests({ reward: 10, denom: 'BADGE', maxClaims: 100, ...META });
  const r = val(msg);

  test('has Quests standard', () => { expect(r.standards).toEqual(['Quests']); });
  test('correct escrow', () => { expect(r.mintEscrowCoinsToTransfer[0].amount).toBe('1000000000000'); });
  test('quest approval with escrow payout', () => {
    const q = r.collectionApprovals.find((a: any) => a.approvalId === 'quests-approval');
    expect(q.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress).toBe(true);
    expect(q.approvalCriteria.coinTransfers[0].overrideToWithInitiator).toBe(true);
  });
  test('emits exactly one classifiable merkleChallenge', () => {
    // `merkleChallenges: []` made the approval unrecognizable as a quest
    // (isQuestApproval requires exactly one challenge, maxUsesPerLeaf 1,
    // useCreatorAddressAsLeaf false). Open challenge (empty root) keeps
    // the streamlined "anyone can claim, capped by maxClaims" behavior.
    const q = r.collectionApprovals.find((a: any) => a.approvalId === 'quests-approval');
    const mc = q.approvalCriteria.merkleChallenges;
    expect(mc.length).toBe(1);
    expect(mc[0].maxUsesPerLeaf).toBe('1');
    expect(mc[0].useCreatorAddressAsLeaf).toBe(false);
    expect(mc[0].challengeTrackerId).toBe('quests-approval');
  });
  test('deterministic — identical params produce a byte-identical msg', () => {
    const p = { reward: 10, denom: 'BADGE', maxClaims: 100, ...META };
    expect(buildQuests(p)).toEqual(buildQuests(p));
  });
  test('passes verification with zero violations', () => {
    expectCleanVerification(msg);
  });
});

describe('address-list builder', () => {
  const msg = buildAddressList({ name: 'My List', description: 'A test list.', image: 'ipfs://test-image' });
  const r = val(msg);

  test('has Address List standard', () => { expect(r.standards).toEqual(['Address List']); });
  test('manager-add and manager-remove', () => {
    const ids = r.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('manager-add');
    expect(ids).toContain('manager-remove');
  });
  test('deterministic — identical params produce byte-identical msg', () => {
    expect(buildAddressList({ name: 'My List', description: 'A test list.', image: 'ipfs://test-image' }))
      .toEqual(buildAddressList({ name: 'My List', description: 'A test list.', image: 'ipfs://test-image' }));
  });
  test('passes verification with zero violations (any standard)', () => {
    expectCleanVerification(msg);
  });
});

// ── Approval builder tests ───────────────────────────────────────────────────

describe('intent builder (delegates to canonical)', () => {
  const msg = buildIntent({ address: 'bb1creator', collectionId: '99', payDenom: 'USDC', payAmount: 100, receiveDenom: 'BADGE', receiveAmount: 50 });

  test('emits MsgSetOutgoingApproval — same envelope as bb intents create', () => {
    expect(msg.typeUrl).toBe('/tokenization.MsgSetOutgoingApproval');
    expect(msg.value.creator).toBe('bb1creator');
    expect(msg.value.collectionId).toBe('99');
  });
  test('fromListId scoped to creator (FE-canonical — old slim builder omitted it)', () => {
    expect(msg.value.approval.fromListId).toBe('bb1creator');
  });
  test('dual coin transfers; first pays creator, second is escrow', () => {
    const cts = msg.value.approval.approvalCriteria.coinTransfers;
    expect(cts.length).toBe(2);
    expect(cts[0].to).toBe('bb1creator');
    expect(cts[1].overrideFromWithApproverAddress).toBe(true);
    expect(cts[1].overrideToWithInitiator).toBe(true);
  });
  test('no requireToEqualsInitiatedBy — must stay fillable', () => {
    expect(msg.value.approval.approvalCriteria.requireToEqualsInitiatedBy).toBeUndefined();
  });
  test('no _meta — byte-identical to the intents-create path', () => {
    expect((msg as any)._meta).toBeUndefined();
  });
  test('approval == buildIntentApproval for equivalent args (delegation parity)', () => {
    const a = msg.value.approval;
    const cts = a.approvalCriteria.coinTransfers;
    const canonical = buildIntentApproval({
      address: 'bb1creator',
      payDenom: cts[1].coins[0].denom,
      payAmount: BigInt(cts[1].coins[0].amount),
      receiveDenom: cts[0].coins[0].denom,
      receiveAmount: BigInt(cts[0].coins[0].amount),
      transferTimes: a.transferTimes,
      approvalId: a.approvalId
    });
    expect(a).toEqual(canonical);
  });
  test('deterministic approval id for identical params', () => {
    const p = { address: 'bb1c', collectionId: '5', payDenom: 'USDC', payAmount: 7, receiveDenom: 'BADGE', receiveAmount: 3 };
    expect(buildIntent(p).value.approval.approvalId).toBe(buildIntent(p).value.approval.approvalId);
  });
  test('throws on same pay/receive denom', () => {
    expect(() => buildIntent({ address: 'bb1a', collectionId: '1', payDenom: 'BADGE', payAmount: 10, receiveDenom: 'BADGE', receiveAmount: 5 }))
      .toThrow(/denoms must differ/);
    expect(() => buildIntent({ address: 'bb1a', collectionId: '1', payDenom: 'USDC', payAmount: 10, receiveDenom: 'usdc', receiveAmount: 5 }))
      .toThrow(/denoms must differ/);
  });
  test('accepts ms-since-epoch expiration (parity with bb intents create; durationToTimestamp rejected it)', () => {
    const a = buildIntent({ address: 'bb1c', collectionId: '5', payDenom: 'USDC', payAmount: 7, receiveDenom: 'BADGE', receiveAmount: 3, expiration: '1798765432000' }).value.approval;
    expect(a.transferTimes).toEqual([{ start: 1n, end: 1798765432000n }]);
  });
});

// `recurring-payment builder` block removed — buildRecurringPayment was
// an orphan that emitted a shape `isUserRecurringApproval` rejects. The
// canonical subscriber-side recurring approval is `userRecurringApproval`
// in core/subscriptions.ts (covered by subscriptions tests).

describe('listing builder (delegates to canonical)', () => {
  const msg = buildListing({ address: 'bb1seller', collectionId: '1', tokenIds: '4', price: 50, denom: 'USDC' });

  test('emits MsgSetOutgoingApproval — same envelope as bb nfts list', () => {
    expect(msg.typeUrl).toBe('/tokenization.MsgSetOutgoingApproval');
    expect(msg.value.creator).toBe('bb1seller');
    expect(msg.value.collectionId).toBe('1');
  });
  test('single token id (canonical bigint shape)', () => {
    expect(msg.value.approval.tokenIds).toEqual([{ start: 4n, end: 4n }]);
  });
  test('pays seller', () => {
    expect(msg.value.approval.approvalCriteria.coinTransfers[0].to).toBe('bb1seller');
  });
  test('rejects a true token range (orderbook listings are single-token)', () => {
    expect(() => buildListing({ address: 'bb1s', collectionId: '1', tokenIds: '1-5', price: 1, denom: 'USDC' }))
      .toThrow(/single token id/);
  });
  test('approval == buildOrderbookListingApproval for equivalent args (delegation parity)', () => {
    const a = msg.value.approval;
    const canonical = buildOrderbookListingApproval({
      address: 'bb1seller',
      tokenId: 4n,
      paymentAmount: BigInt(a.approvalCriteria.coinTransfers[0].coins[0].amount),
      paymentDenom: a.approvalCriteria.coinTransfers[0].coins[0].denom,
      tokenAmount: 1n,
      transferTimes: a.transferTimes,
      approvalId: a.approvalId,
      maxNumTransfers: 1n
    });
    expect(a).toEqual(canonical);
  });
  test('deterministic approval id; no _meta', () => {
    const p = { address: 'bb1seller', collectionId: '1', tokenIds: '4', price: 50, denom: 'USDC' };
    expect(buildListing(p).value.approval.approvalId).toBe(buildListing(p).value.approval.approvalId);
    expect((msg as any)._meta).toBeUndefined();
  });
  test('accepts ms-since-epoch expiration (parity with bb nfts list; durationToTimestamp rejected it)', () => {
    const a = buildListing({ address: 'bb1seller', collectionId: '1', tokenIds: '4', price: 50, denom: 'USDC', expiration: '1798765432000' }).value.approval;
    expect(a.transferTimes).toEqual([{ start: 1n, end: 1798765432000n }]);
  });
});

describe('bid builder (delegates to canonical)', () => {
  const msg = buildBid({ address: 'bb1bidder', collectionId: '1', tokenIds: '3', price: 25, denom: 'BADGE' });

  test('emits MsgSetIncomingApproval — same envelope as bb nfts bid', () => {
    expect(msg.typeUrl).toBe('/tokenization.MsgSetIncomingApproval');
    expect(msg.value.creator).toBe('bb1bidder');
    expect(msg.value.collectionId).toBe('1');
  });
  test('single token id (canonical bigint shape)', () => {
    expect(msg.value.approval.tokenIds).toEqual([{ start: 3n, end: 3n }]);
  });
  test('escrow-funded', () => {
    const ct = msg.value.approval.approvalCriteria.coinTransfers[0];
    expect(ct.overrideFromWithApproverAddress).toBe(true);
    expect(ct.overrideToWithInitiator).toBe(true);
  });
  test('rejects a true token range', () => {
    expect(() => buildBid({ address: 'bb1b', collectionId: '1', tokenIds: '1-5', price: 1, denom: 'BADGE' }))
      .toThrow(/single token id/);
  });
  test('deterministic approval id for identical params', () => {
    const p = { address: 'bb1bidder', collectionId: '1', tokenIds: '3', price: 25, denom: 'BADGE' };
    const a = buildBid({ ...p }).value.approval;
    const b = buildBid({ ...p }).value.approval;
    expect(a.approvalId).toBe(b.approvalId);
    expect(a.approvalId.startsWith('bid-')).toBe(true);
    expect(a.approvalCriteria.maxNumTransfers.amountTrackerId).toBe(a.approvalId);
    expect(buildBid({ ...p, price: 26 }).value.approval.approvalId).not.toBe(a.approvalId);
  });
  test('approval == buildOrderbookBidApproval for equivalent args (delegation parity)', () => {
    const a = msg.value.approval;
    const canonical = buildOrderbookBidApproval({
      address: 'bb1bidder',
      tokenId: 3n,
      paymentAmount: BigInt(a.approvalCriteria.coinTransfers[0].coins[0].amount),
      paymentDenom: a.approvalCriteria.coinTransfers[0].coins[0].denom,
      tokenAmount: 1n,
      transferTimes: a.transferTimes,
      approvalId: a.approvalId,
      maxNumTransfers: 1n
    });
    expect(a).toEqual(canonical);
  });
  test('collection-wide bid when token-ids omitted (parity with bb nfts bid)', () => {
    const cw = buildBid({ address: 'bb1bidder', collectionId: '1', price: 25, denom: 'BADGE' }).value.approval;
    const inc = cw.approvalCriteria.predeterminedBalances.incrementedBalances;
    expect(inc.allowOverrideWithAnyValidToken).toBe(true);
    expect(cw.approvalCriteria.autoDeletionOptions.afterOneUse).toBe(false);
    const canonical = buildOrderbookBidApproval({
      address: 'bb1bidder',
      tokenId: undefined,
      paymentAmount: BigInt(cw.approvalCriteria.coinTransfers[0].coins[0].amount),
      paymentDenom: cw.approvalCriteria.coinTransfers[0].coins[0].denom,
      tokenAmount: 1n,
      transferTimes: cw.transferTimes,
      approvalId: cw.approvalId,
      maxNumTransfers: 1n
    });
    expect(cw).toEqual(canonical);
  });
  test('--token-amount flows into the canonical start balance', () => {
    const a = buildBid({ address: 'bb1bidder', collectionId: '1', tokenIds: '3', tokenAmount: 5, price: 25, denom: 'BADGE' }).value.approval;
    expect(a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount).toBe(5n);
  });
  test('accepts ms-since-epoch expiration (parity with bb nfts bid; durationToTimestamp rejected it)', () => {
    const a = buildBid({ address: 'bb1bidder', collectionId: '1', tokenIds: '3', price: 25, denom: 'BADGE', expiration: '1798765432000' }).value.approval;
    expect(a.transferTimes).toEqual([{ start: 1n, end: 1798765432000n }]);
  });
  test('deterministic — byte-identical msg for identical params (fixed ms expiry)', () => {
    const p = { address: 'bb1bidder', collectionId: '1', tokenIds: '3', price: 25, denom: 'BADGE', expiration: '1798765432000' };
    expect(buildBid({ ...p })).toEqual(buildBid({ ...p }));
  });
});

describe('pm-sell-intent builder (delegates to canonical)', () => {
  const msg = buildPmSellIntent({ address: 'bb1seller', collectionId: '42', token: 'yes', amount: 100, price: 50, denom: 'USDC' });

  test('emits MsgSetOutgoingApproval — same envelope as bb prediction-markets sell-yes', () => {
    expect(msg.typeUrl).toBe('/tokenization.MsgSetOutgoingApproval');
    expect(msg.value.creator).toBe('bb1seller');
    expect(msg.value.collectionId).toBe('42');
  });
  test('YES = token ID 1 (canonical bigint shape)', () => {
    expect(msg.value.approval.tokenIds).toEqual([{ start: 1n, end: 1n }]);
    expect(msg.value.approval.toListId).toBe('All');
  });
  test('NO = token ID 2', () => {
    const no = buildPmSellIntent({ address: 'bb1', collectionId: '42', token: 'no', amount: 1, price: 1, denom: 'USDC' });
    expect(no.value.approval.tokenIds).toEqual([{ start: 2n, end: 2n }]);
  });
  test('pays seller', () => { expect(msg.value.approval.approvalCriteria.coinTransfers[0].to).toBe('bb1seller'); });
  test('no _meta — byte-identical to the prediction-markets path', () => {
    expect((msg as any)._meta).toBeUndefined();
  });
  test('approval == buildPredictionMarketSellIntent for equivalent args (delegation parity)', () => {
    const a = msg.value.approval;
    const canonical = buildPredictionMarketSellIntent({
      address: 'bb1seller', collectionId: '42', tokenId: 1n, tokenAmount: 100n,
      paymentDenom: a.approvalCriteria.coinTransfers[0].coins[0].denom,
      paymentAmount: BigInt(a.approvalCriteria.coinTransfers[0].coins[0].amount),
      transferTimes: a.transferTimes, approvalId: a.approvalId
    });
    expect(a).toEqual(canonical);
  });
  test('deterministic approval id for identical params', () => {
    const a = buildPmSellIntent({ address: 'bb1s', collectionId: '7', token: 'yes', amount: 3, price: 9, denom: 'USDC' });
    const b = buildPmSellIntent({ address: 'bb1s', collectionId: '7', token: 'yes', amount: 3, price: 9, denom: 'USDC' });
    expect(a.value.approval.approvalId).toBe(b.value.approval.approvalId);
  });
  test('accepts ms-since-epoch expiration; defaults to a 24h window (parity with bb prediction-markets sell)', () => {
    const fixed = buildPmSellIntent({ address: 'bb1s', collectionId: '7', token: 'yes', amount: 3, price: 9, denom: 'USDC', expiration: '1798765432000' }).value.approval;
    expect(fixed.transferTimes).toEqual([{ start: 1n, end: 1798765432000n }]);
    const def = buildPmSellIntent({ address: 'bb1s', collectionId: '7', token: 'yes', amount: 3, price: 9, denom: 'USDC' }).value.approval;
    const span = Number(def.transferTimes[0].end) - Date.now();
    expect(span).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(span).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 5000);
  });
});

describe('pm-buy-intent builder (delegates to canonical)', () => {
  const msg = buildPmBuyIntent({ address: 'bb1buyer', collectionId: '42', token: 'no', amount: 200, price: 30, denom: 'USDC' });

  test('emits MsgSetIncomingApproval — same envelope as bb prediction-markets buy-no', () => {
    expect(msg.typeUrl).toBe('/tokenization.MsgSetIncomingApproval');
    expect(msg.value.creator).toBe('bb1buyer');
    expect(msg.value.collectionId).toBe('42');
  });
  test('NO = token ID 2 (canonical bigint shape)', () => {
    expect(msg.value.approval.tokenIds).toEqual([{ start: 2n, end: 2n }]);
    expect(msg.value.approval.fromListId).toBe('All');
  });
  test('escrow-funded', () => {
    const ct = msg.value.approval.approvalCriteria.coinTransfers[0];
    expect(ct.overrideFromWithApproverAddress).toBe(true);
    expect(ct.overrideToWithInitiator).toBe(true);
  });
  test('approval == buildPredictionMarketBuyIntent for equivalent args (delegation parity)', () => {
    const a = msg.value.approval;
    const canonical = buildPredictionMarketBuyIntent({
      address: 'bb1buyer', collectionId: '42', tokenId: 2n, tokenAmount: 200n,
      paymentDenom: a.approvalCriteria.coinTransfers[0].coins[0].denom,
      paymentAmount: BigInt(a.approvalCriteria.coinTransfers[0].coins[0].amount),
      transferTimes: a.transferTimes, approvalId: a.approvalId
    });
    expect(a).toEqual(canonical);
  });
  test('deterministic approval id for identical params', () => {
    const p = { address: 'bb1buyer', collectionId: '42', token: 'no' as const, amount: 200, price: 30, denom: 'USDC' };
    const a = buildPmBuyIntent({ ...p });
    const b = buildPmBuyIntent({ ...p });
    expect(a.value.approval.approvalId).toBe(b.value.approval.approvalId);
    expect(buildPmBuyIntent({ ...p, price: 31 }).value.approval.approvalId).not.toBe(a.value.approval.approvalId);
  });
  test('accepts ms-since-epoch expiration; defaults to a 24h window (parity with bb prediction-markets buy)', () => {
    const fixed = buildPmBuyIntent({ address: 'bb1buyer', collectionId: '42', token: 'no', amount: 200, price: 30, denom: 'USDC', expiration: '1798765432000' }).value.approval;
    expect(fixed.transferTimes).toEqual([{ start: 1n, end: 1798765432000n }]);
    const def = buildPmBuyIntent({ address: 'bb1buyer', collectionId: '42', token: 'no', amount: 200, price: 30, denom: 'USDC' }).value.approval;
    const span = Number(def.transferTimes[0].end) - Date.now();
    expect(span).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(span).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 5000);
  });
});

// ── Zero-violations suite: every builder must pass ALL standard checks ───────

describe('all collection builders pass verifyStandardsCompliance with zero violations', () => {
  const builders: [string, any][] = [
    ['vault', buildVault({ backingCoin: 'USDC', ...META })],
    ['vault (with limits)', buildVault({ backingCoin: 'USDC', dailyWithdrawLimit: 100, require2fa: '74', emergencyRecovery: 'bb1recovery', ...META })],
    ['smart-token', buildSmartToken({ backingCoin: 'USDC', ...META })],
    ['smart-token (tradable)', buildSmartToken({ backingCoin: 'USDC', tradable: true, ...META })],
    ['smart-token (ai-agent)', buildSmartToken({ backingCoin: 'BADGE', aiAgentVault: true, ...META })],
    ['subscription (single)', buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test', ...META })],
    ['subscription (multi-tier)', buildSubscription({ interval: 'daily', price: 5, denom: 'BADGE', recipient: 'bb1r', tiers: 3, ...META })],
    // Subscription faucet approvals must use a SINGLE denom — see
    // buildSubscription's runtime check and the proto-level
    // `doesCollectionFollowSubscriptionProtocol()` rule. Multiple
    // recipients sharing one denom is valid (treasury split); mixing
    // denoms is not.
    ['subscription (multi-payout)', buildSubscription({ interval: 'monthly', payouts: [{ recipient: 'bb1a', amount: 5, denom: 'USDC' }, { recipient: 'bb1b', amount: 3, denom: 'USDC' }], ...META })],
    ['bounty', buildBounty({ amount: 100, denom: 'USDC', verifier: 'bb1v', recipient: 'bb1r', submitter: 'bb1s', ...META })],
    ['bounty (BADGE)', buildBounty({ amount: 50, denom: 'BADGE', verifier: 'bb1v', recipient: 'bb1r', submitter: 'bb1s', expiration: '7d', ...META })],
    ['crowdfund', buildCrowdfund({ goal: 1000, denom: 'USDC', crowdfunder: 'bb1fund', ...META })],
    ['crowdfund (with crowdfunder)', buildCrowdfund({ goal: 500, denom: 'BADGE', crowdfunder: 'bb1fund', deadline: '14d', ...META })],
    ['auction', buildAuction({ ...META })],
    ['auction (custom times)', buildAuction({ bidDeadline: '3d', acceptWindow: '1d', ...META })],
    ['product-catalog', buildProductCatalog({ products: [{ name: 'Item', price: 10, denom: 'USDC' }], storeAddress: 'bb1s', ...META })],
    ['product-catalog (multi)', buildProductCatalog({ products: [{ name: 'A', price: 5, denom: 'BADGE' }, { name: 'B', price: 10, denom: 'USDC', maxSupply: 50, burn: true }], storeAddress: 'bb1s', ...META })],
    ['prediction-market', buildPredictionMarket({ verifier: 'bb1v', ...META })],
    ['credit-token', buildCreditToken({ paymentDenom: 'USDC', recipient: 'bb1r', ...META })],
    ['credit-token (custom)', buildCreditToken({ paymentDenom: 'BADGE', recipient: 'bb1r', symbol: 'CRED', tokensPerUnit: 50, ...META })],
    ['custom-2fa', buildCustom2FA({ name: 'My 2FA', description: 'A 2FA token.', image: 'ipfs://test-image', creator: 'bb1manager' })],
    ['custom-2fa (burnable)', buildCustom2FA({ name: 'Burnable 2FA', burnable: true, description: 'A burnable 2FA token.', image: 'ipfs://test-image', creator: 'bb1manager' })],
    ['quests', buildQuests({ reward: 10, denom: 'BADGE', maxClaims: 100, ...META })],
    ['address-list', buildAddressList({ name: 'My List', description: 'A test list.', image: 'ipfs://test-image' })],
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

  test('buildBounty with zero amount: the zero propagates (not silently dropped) + verifier-clean', () => {
    const msg = buildBounty({ amount: 0, denom: 'BADGE', verifier: 'bb1v', recipient: 'bb1r', submitter: 'bb1s', ...META });
    expect(msg.typeUrl).toBe('/tokenization.MsgUniversalUpdateCollection');
    expect(msg.value.collectionApprovals.length).toBe(3);
    // Proves amount:0 flowed through to the escrow coin rather than being
    // silently coerced/dropped (the masking-bug class).
    expect(val(msg).mintEscrowCoinsToTransfer[0].amount).toBe('0');
    expectCleanVerification(msg);
  });

  test('amount-taking builders reject negative / non-finite amounts at the producer', () => {
    expect(() => buildBounty({ amount: -5, denom: 'BADGE', verifier: 'bb1v', recipient: 'bb1r', submitter: 'bb1s', ...META })).toThrow(/non-negative/i);
    expect(() => buildCrowdfund({ goal: Infinity, denom: 'USDC', crowdfunder: 'bb1fund', ...META } as any)).toThrow(/finite/i);
    expect(() => buildPaymentRequest({ amount: NaN, denom: 'USDC', payer: 'bb1p', recipient: 'bb1r', ...META } as any)).toThrow(/finite/i);
  });

  test('buildProductCatalog with empty products: burn-only, well-formed, verifier-clean', () => {
    const msg = buildProductCatalog({ products: [], storeAddress: 'bb1s', ...META });
    expect(msg.value.collectionApprovals.length).toBe(1);
    // The lone approval must be a real burn approval, not a mangled
    // placeholder a silent-drop bug would also yield length 1.
    const only = msg.value.collectionApprovals[0];
    expect(typeof only.approvalId).toBe('string');
    expect(only.approvalId.length).toBeGreaterThan(0);
    expect(only.toListId).toBeTruthy();
    expectCleanVerification(msg);
  });

  test('buildCrowdfund goal of 1 base unit: goal converts to 1 base unit + verifier-clean', () => {
    const msg = buildCrowdfund({ goal: 0.000001, denom: 'USDC', crowdfunder: 'bb1fund', ...META });
    expect(msg.value.collectionApprovals.length).toBeGreaterThanOrEqual(4);
    // USDC has 6 decimals → 0.000001 must resolve to exactly "1" base
    // unit somewhere in the emitted coin amounts (not 0 from a silent
    // truncation, not display-units).
    const coinAmounts = JSON.stringify(msg).match(/"amount":"\d+"/g) ?? [];
    expect(coinAmounts).toContain('"amount":"1"');
    expectCleanVerification(msg);
  });

  test('buildAuction with very short windows: well-formed + verifier-clean', () => {
    const msg = buildAuction({ bidDeadline: '1m', acceptWindow: '1m', ...META });
    expect(msg.typeUrl).toBe('/tokenization.MsgUniversalUpdateCollection');
    expect(msg.value.collectionApprovals.length).toBeGreaterThan(0);
    expectCleanVerification(msg);
  });

  test('buildIntent rejects same pay/receive denom (no-op approval)', () => {
    expect(() => buildIntent({ address: 'bb1a', collectionId: '1', payDenom: 'BADGE', payAmount: 10, receiveDenom: 'BADGE', receiveAmount: 5 }))
      .toThrow(/denoms must differ/);
  });

  test('buildListing parses single token ID (canonical shape)', () => {
    const msg = buildListing({ address: 'bb1a', collectionId: '1', tokenIds: '42', price: 10, denom: 'BADGE' });
    expect(msg.value.approval.tokenIds).toEqual([{ start: 42n, end: 42n }]);
  });

  test('buildPmSellIntent emits canonical token ids', () => {
    const msg = buildPmSellIntent({ address: 'bb1a', collectionId: '1', token: 'yes', amount: 1, price: 1, denom: 'BADGE' });
    expect(msg.value.approval.tokenIds).toEqual([{ start: 1n, end: 1n }]);
  });
});
