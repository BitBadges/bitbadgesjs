/**
 * Tests for CLI template builders.
 *
 * Verifies that all 12 collection builders produce valid JSON
 * that passes the SDK's verifyStandardsCompliance checks.
 */
import { verifyStandardsCompliance } from '../verify-standards.js';

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
import { resolveCoin, parseDuration, toBaseUnits } from './shared.js';

// ── Helper ───────────────────────────────────────────────────────────────────

function wrapAsTx(value: any) {
  return {
    messages: [{ typeUrl: '/tokenization.MsgUniversalUpdateCollection', value }]
  };
}

function verifyBuilder(value: any) {
  const tx = wrapAsTx(value);
  return verifyStandardsCompliance(tx);
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
  const result = buildVault({ backingCoin: 'USDC' });

  test('produces valid MsgUniversalUpdateCollection', () => {
    expect(result.collectionId).toBe('0');
    expect(result.creator).toBe('');
    expect(result.updateCollectionApprovals).toBe(true);
  });

  test('has correct standards', () => {
    expect(result.standards).toContain('Smart Token');
    expect(result.standards).toContain('Vault');
  });

  test('has IBC backing invariants', () => {
    expect(result.invariants.cosmosCoinBackedPath).toBeDefined();
    expect(result.invariants.cosmosCoinBackedPath.conversion.sideA.denom).toContain('ibc/');
  });

  test('has deposit and withdrawal approvals', () => {
    expect(result.collectionApprovals.length).toBe(2);
    const ids = result.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('deposit');
    expect(ids).toContain('withdrawal');
  });

  test('backing approvals have mustPrioritize and allowBackedMinting', () => {
    for (const a of result.collectionApprovals) {
      expect(a.approvalCriteria.mustPrioritize).toBe(true);
      expect(a.approvalCriteria.allowBackedMinting).toBe(true);
    }
  });

  test('has alias path', () => {
    expect(result.aliasPathsToAdd.length).toBe(1);
    expect(result.aliasPathsToAdd[0].denom).toBe('uvault');
  });

  test('passes Vault standard verification', () => {
    const verification = verifyBuilder(result);
    const vaultViolations = verification.violations.filter((v) => v.standard === 'Vault');
    expect(vaultViolations).toEqual([]);
  });

  test('passes Smart Token standard verification', () => {
    const verification = verifyBuilder(result);
    const stViolations = verification.violations.filter((v) => v.standard === 'Smart Token');
    expect(stViolations).toEqual([]);
  });
});

describe('smart-account builder', () => {
  const result = buildSmartAccount({ backingCoin: 'USDC' });

  test('has Smart Token standard', () => {
    expect(result.standards).toContain('Smart Token');
  });

  test('has backing and unbacking approvals', () => {
    const ids = result.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('smart-token-backing');
    expect(ids).toContain('smart-token-unbacking');
  });

  test('tradable version adds Liquidity Pools standard', () => {
    const tradable = buildSmartAccount({ backingCoin: 'USDC', tradable: true });
    expect(tradable.standards).toContain('Liquidity Pools');
    expect(tradable.invariants.disablePoolCreation).toBe(false);
  });

  test('passes Smart Token verification', () => {
    const verification = verifyBuilder(result);
    const stViolations = verification.violations.filter((v) => v.standard === 'Smart Token');
    expect(stViolations).toEqual([]);
  });
});

describe('subscription builder', () => {
  const result = buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test' });

  test('has Subscriptions standard', () => {
    expect(result.standards).toEqual(['Subscriptions']);
  });

  test('has subscription faucet approval with durationFromTimestamp', () => {
    const approval = result.collectionApprovals[0];
    const ib = approval.approvalCriteria.predeterminedBalances.incrementedBalances;
    expect(ib.durationFromTimestamp).toBe('2592000000');
    expect(ib.allowOverrideTimestamp).toBe(true);
  });

  test('has coin transfer to recipient', () => {
    const ct = result.collectionApprovals[0].approvalCriteria.coinTransfers[0];
    expect(ct.to).toBe('bb1test');
  });

  test('noCustomOwnershipTimes is false', () => {
    expect(result.invariants.noCustomOwnershipTimes).toBe(false);
  });

  test('multi-tier produces correct validTokenIds', () => {
    const multiTier = buildSubscription({ interval: 'monthly', price: 10, denom: 'USDC', recipient: 'bb1test', tiers: 3 });
    expect(multiTier.validTokenIds).toEqual([{ start: '1', end: '3' }]);
    expect(multiTier.collectionApprovals.length).toBe(3);
  });

  test('passes Subscription verification', () => {
    const verification = verifyBuilder(result);
    const subViolations = verification.violations.filter((v) => v.standard === 'Subscription');
    expect(subViolations).toEqual([]);
  });
});

describe('bounty builder', () => {
  const result = buildBounty({ amount: 100, denom: 'USDC', verifier: 'bb1verifier', recipient: 'bb1recipient' });

  test('has Bounty standard', () => {
    expect(result.standards).toEqual(['Bounty']);
  });

  test('has 3 approvals (accept, deny, expire)', () => {
    expect(result.collectionApprovals.length).toBe(3);
    const ids = result.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('bounty-accept');
    expect(ids).toContain('bounty-deny');
    expect(ids).toContain('bounty-expire');
  });

  test('accept and deny have voting challenges', () => {
    const accept = result.collectionApprovals.find((a: any) => a.approvalId === 'bounty-accept');
    const deny = result.collectionApprovals.find((a: any) => a.approvalId === 'bounty-deny');
    expect(accept.approvalCriteria.votingChallenges.length).toBe(1);
    expect(deny.approvalCriteria.votingChallenges.length).toBe(1);
  });

  test('expire has no voting challenges', () => {
    const expire = result.collectionApprovals.find((a: any) => a.approvalId === 'bounty-expire');
    expect(expire.approvalCriteria.votingChallenges).toBeUndefined();
  });

  test('has mint escrow coins', () => {
    expect(result.mintEscrowCoinsToTransfer.length).toBe(1);
    expect(result.mintEscrowCoinsToTransfer[0].amount).toBe('100000000'); // 100 USDC = 100 * 10^6
  });

  test('passes Bounty verification', () => {
    const verification = verifyBuilder(result);
    const bountyViolations = verification.violations.filter((v) => v.standard === 'Bounty');
    expect(bountyViolations).toEqual([]);
  });
});

describe('crowdfund builder', () => {
  const result = buildCrowdfund({ goal: 1000, denom: 'USDC' });

  test('has Crowdfund standard', () => {
    expect(result.standards).toEqual(['Crowdfund']);
  });

  test('has 2 token IDs (refund + progress)', () => {
    expect(result.validTokenIds).toEqual([{ start: '1', end: '2' }]);
  });

  test('has at least 4 approvals', () => {
    expect(result.collectionApprovals.length).toBeGreaterThanOrEqual(4);
  });

  test('passes Crowdfund verification', () => {
    const verification = verifyBuilder(result);
    const cfViolations = verification.violations.filter((v) => v.standard === 'Crowdfund');
    expect(cfViolations).toEqual([]);
  });
});

describe('auction builder', () => {
  const result = buildAuction({});

  test('has Auction standard', () => {
    expect(result.standards).toEqual(['Auction']);
  });

  test('mint-to-winner has bounded transfer times', () => {
    const mint = result.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    expect(mint.transferTimes[0].start).not.toBe('1');
  });

  test('mint-to-winner has maxNumTransfers = 1', () => {
    const mint = result.collectionApprovals.find((a: any) => a.fromListId === 'Mint');
    expect(mint.approvalCriteria.maxNumTransfers.overallMaxNumTransfers).toBe('1');
  });

  test('passes Auction verification', () => {
    const verification = verifyBuilder(result);
    const auctionViolations = verification.violations.filter((v) => v.standard === 'Auction');
    expect(auctionViolations).toEqual([]);
  });
});

describe('product-catalog builder', () => {
  const result = buildProductCatalog({
    products: [
      { name: 'T-Shirt', price: 25, denom: 'USDC' },
      { name: 'Mug', price: 15, denom: 'USDC', maxSupply: 50 }
    ],
    storeAddress: 'bb1store'
  });

  test('has Products standard', () => {
    expect(result.standards).toEqual(['Products']);
  });

  test('has correct number of token IDs', () => {
    expect(result.validTokenIds).toEqual([{ start: '1', end: '2' }]);
  });

  test('has purchase approval per product + burn', () => {
    // 2 purchase + 1 burn = 3
    expect(result.collectionApprovals.length).toBe(3);
  });

  test('each purchase approval has coin transfer to store', () => {
    const purchases = result.collectionApprovals.filter((a: any) => a.fromListId === 'Mint');
    for (const p of purchases) {
      expect(p.approvalCriteria.coinTransfers[0].to).toBe('bb1store');
    }
  });

  test('passes Products verification', () => {
    const verification = verifyBuilder(result);
    const prodViolations = verification.violations.filter((v) => v.standard === 'Products');
    expect(prodViolations).toEqual([]);
  });
});

describe('prediction-market builder', () => {
  const result = buildPredictionMarket({ verifier: 'bb1verifier' });

  test('has Prediction Market standard', () => {
    expect(result.standards).toEqual(['Prediction Market']);
  });

  test('has YES/NO token IDs', () => {
    expect(result.validTokenIds).toEqual([{ start: '1', end: '2' }]);
  });

  test('has alias paths for YES and NO', () => {
    expect(result.aliasPathsToAdd.length).toBe(2);
    const denoms = result.aliasPathsToAdd.map((a: any) => a.denom);
    expect(denoms).toContain('uyes');
    expect(denoms).toContain('uno');
  });

  test('has settlement approvals with voting challenges', () => {
    const settlements = result.collectionApprovals.filter(
      (a: any) => a.approvalCriteria?.votingChallenges?.length > 0
    );
    expect(settlements.length).toBeGreaterThanOrEqual(2);
  });

  test('passes Prediction Market verification', () => {
    const verification = verifyBuilder(result);
    const pmViolations = verification.violations.filter((v) => v.standard === 'Prediction Market');
    expect(pmViolations).toEqual([]);
  });
});

describe('credit-token builder', () => {
  const result = buildCreditToken({ paymentDenom: 'USDC', recipient: 'bb1recipient' });

  test('has Credit Token standard', () => {
    expect(result.standards).toEqual(['Credit Token']);
  });

  test('has amount scaling on mint approval', () => {
    const mint = result.collectionApprovals[0];
    const ib = mint.approvalCriteria.predeterminedBalances.incrementedBalances;
    expect(ib.allowAmountScaling).toBe(true);
  });

  test('passes Credit Token verification', () => {
    const verification = verifyBuilder(result);
    const ctViolations = verification.violations.filter((v) => v.standard === 'Credit Token');
    expect(ctViolations).toEqual([]);
  });
});

describe('custom-2fa builder', () => {
  const result = buildCustom2FA({ name: 'My 2FA Token' });

  test('has Custom-2FA standard', () => {
    expect(result.standards).toEqual(['Custom-2FA']);
  });

  test('has allowPurgeIfExpired', () => {
    const approval = result.collectionApprovals[0];
    expect(approval.approvalCriteria.autoDeletionOptions.allowPurgeIfExpired).toBe(true);
  });

  test('disablePoolCreation is true', () => {
    expect(result.invariants.disablePoolCreation).toBe(true);
  });

  test('burnable version adds burn approval', () => {
    const burnable = buildCustom2FA({ name: 'My 2FA Token', burnable: true });
    expect(burnable.collectionApprovals.length).toBe(2);
  });

  test('passes Custom-2FA verification', () => {
    const verification = verifyBuilder(result);
    const tfaViolations = verification.violations.filter((v) => v.standard === 'Custom-2FA');
    expect(tfaViolations).toEqual([]);
  });
});

describe('quests builder', () => {
  const result = buildQuests({ reward: 10, denom: 'BADGE', maxClaims: 100 });

  test('has Quests standard', () => {
    expect(result.standards).toEqual(['Quests']);
  });

  test('has correct escrow amount', () => {
    expect(result.mintEscrowCoinsToTransfer.length).toBe(1);
    // 10 BADGE * 100 claims * 10^9 = 1000000000000
    expect(result.mintEscrowCoinsToTransfer[0].amount).toBe('1000000000000');
  });

  test('has quest approval with coin transfers', () => {
    const quest = result.collectionApprovals.find((a: any) => a.approvalId === 'quest-approval');
    expect(quest).toBeDefined();
    expect(quest.approvalCriteria.coinTransfers.length).toBe(1);
    expect(quest.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress).toBe(true);
    expect(quest.approvalCriteria.coinTransfers[0].overrideToWithInitiator).toBe(true);
  });

  test('passes Quests verification', () => {
    const verification = verifyBuilder(result);
    const questViolations = verification.violations.filter((v) => v.standard === 'Quest');
    expect(questViolations).toEqual([]);
  });
});

describe('address-list builder', () => {
  const result = buildAddressList({ name: 'My List' });

  test('has Address List standard', () => {
    expect(result.standards).toEqual(['Address List']);
  });

  test('has manager-add and manager-remove approvals', () => {
    const ids = result.collectionApprovals.map((a: any) => a.approvalId);
    expect(ids).toContain('manager-add');
    expect(ids).toContain('manager-remove');
  });

  test('passes Address List verification', () => {
    const verification = verifyBuilder(result);
    const alViolations = verification.violations.filter((v) => v.standard === 'Address List');
    expect(alViolations).toEqual([]);
  });
});

// ── Approval builder tests ───────────────────────────────────────────────────

describe('intent builder', () => {
  const result = buildIntent({
    address: 'bb1creator',
    payDenom: 'USDC',
    payAmount: 100,
    receiveDenom: 'BADGE',
    receiveAmount: 50
  });

  test('produces outgoing approval', () => {
    expect(result.type).toBe('outgoing');
  });

  test('has dual coin transfers', () => {
    expect(result.approvalCriteria.coinTransfers.length).toBe(2);
  });

  test('first transfer pays creator', () => {
    expect(result.approvalCriteria.coinTransfers[0].to).toBe('bb1creator');
    expect(result.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress).toBe(false);
  });

  test('second transfer pays filler from escrow', () => {
    expect(result.approvalCriteria.coinTransfers[1].overrideFromWithApproverAddress).toBe(true);
    expect(result.approvalCriteria.coinTransfers[1].overrideToWithInitiator).toBe(true);
  });

  test('auto-deletes after one use', () => {
    expect(result.approvalCriteria.autoDeletionOptions.afterOneUse).toBe(true);
  });
});

describe('recurring-payment builder', () => {
  const result = buildRecurringPayment({
    amount: 10,
    denom: 'USDC',
    interval: 'monthly',
    recipient: 'bb1recipient'
  });

  test('produces incoming approval', () => {
    expect(result.type).toBe('incoming');
  });

  test('has recurring ownership times', () => {
    const ib = result.approvalCriteria.predeterminedBalances.incrementedBalances;
    expect(ib.durationFromTimestamp).toBe('2592000000');
    expect(ib.allowOverrideTimestamp).toBe(true);
  });

  test('has coin transfer to recipient', () => {
    expect(result.approvalCriteria.coinTransfers[0].to).toBe('bb1recipient');
  });
});

describe('listing builder', () => {
  const result = buildListing({
    address: 'bb1seller',
    collectionId: '1',
    tokenIds: '1-5',
    price: 50,
    denom: 'USDC'
  });

  test('produces outgoing approval', () => {
    expect(result.type).toBe('outgoing');
  });

  test('parses token ID range', () => {
    expect(result.tokenIds).toEqual([{ start: '1', end: '5' }]);
  });

  test('has coin transfer to seller', () => {
    expect(result.approvalCriteria.coinTransfers[0].to).toBe('bb1seller');
  });

  test('auto-deletes after max sales', () => {
    expect(result.approvalCriteria.autoDeletionOptions.afterOverallMaxNumTransfers).toBe(true);
  });
});

describe('bid builder', () => {
  const result = buildBid({
    address: 'bb1bidder',
    collectionId: '1',
    tokenIds: '3',
    price: 25,
    denom: 'BADGE'
  });

  test('produces incoming approval', () => {
    expect(result.type).toBe('incoming');
  });

  test('parses single token ID', () => {
    expect(result.tokenIds).toEqual([{ start: '3', end: '3' }]);
  });

  test('has escrow-funded coin transfer', () => {
    expect(result.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress).toBe(true);
    expect(result.approvalCriteria.coinTransfers[0].overrideToWithInitiator).toBe(true);
  });

  test('auto-deletes after one use', () => {
    expect(result.approvalCriteria.autoDeletionOptions.afterOneUse).toBe(true);
  });
});
