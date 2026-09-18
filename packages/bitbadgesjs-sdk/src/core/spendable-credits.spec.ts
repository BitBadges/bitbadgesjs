import { detectType, buildTypeExplanation, buildStandardExplanations } from './interpret-shared.js';
import { getTokenTypeSkillIds, inferFromStandards } from '../builder/agent/tokenTypeInference.js';
import { inspectStandardCollection } from './standard-inspection.js';
import { verifyStandardsCompliance } from '../api-indexer/verify-standards.js';
import { BitBadgesCollection } from '../api-indexer/BitBadgesCollection.js';
import { AddressList } from './addressLists.js';
import { buildSpendableCredit } from './builders/spendable-credit.js';
import { BURN_ADDRESS } from './builders/shared.js';
import {
  inspectSpendableCredit,
  buildConsumeSpendableCreditsMsg,
  buildPurchaseSpendableCreditsMsg,
  quoteSpendableCreditPurchase,
  verifySpendableCreditReceipt
} from './spendable-credits.js';

const collection = () => ({
  ...buildSpendableCredit({
    paymentDenom: 'USDC',
    provider: BURN_ADDRESS,
    serviceId: 'images',
    pricePerPack: '1000000',
    creditsPerPack: '10',
    name: 'Credits',
    description: 'Images',
    image: 'ipfs://image'
  }).value,
  collectionId: '9'
});
const context = { provider: BURN_ADDRESS, serviceId: 'images', wallet: BURN_ADDRESS, requestId: 'request-123', units: '2' };
const receipt = () => ({
  height: '12',
  txhash: 'A'.repeat(64),
  code: 0,
  tx: {
    body: {
      messages: [buildConsumeSpendableCreditsMsg(collection(), context).value].map((value) => ({
        '@type': '/tokenization.MsgTransferTokens',
        ...value
      }))
    }
  }
});

describe('spendable consumption', () => {
  test('accepts indexed SDK collection enrichment without relaxing economic terms', () => {
    function enrich(value: any): any {
      if (Array.isArray(value)) return value.map(enrich);
      if (!value || typeof value !== 'object') return value;
      const result = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, enrich(entry)]));
      for (const list of ['fromList', 'toList', 'initiatedByList'])
        if (typeof value[`${list}Id`] === 'string') result[list] = AddressList.getReservedAddressList(value[`${list}Id`]);
      return result;
    }
    const indexed = new BitBadgesCollection({
      ...enrich(collection()),
      cosmosCoinWrapperPaths: [],
      aliasPaths: [],
      _docId: '9',
      createdBlock: '1',
      createdTimestamp: '1',
      updateHistory: [],
      activity: [],
      owners: [],
      challengeTrackers: [],
      approvalTrackers: [],
      listings: [],
      claims: [],
      views: {}
    }).convert(BigInt);
    expect(inspectSpendableCredit(indexed).creditsPerPack).toBe('10');
  });
  test('rejects collections that add a peer-transfer or free mint path', () => {
    const value = collection();
    value.collectionApprovals.push({ ...value.collectionApprovals[1], approvalId: 'extra', toListId: 'All' });
    expect(() => inspectSpendableCredit(value)).toThrow();
  });
  test('rejects mutable approval permissions', () => {
    const value = collection();
    value.collectionPermissions.canUpdateCollectionApprovals = [];
    expect(() => inspectSpendableCredit(value)).toThrow();
  });
  test('binds a consumption to a wallet, service and request', () => {
    const msg = buildConsumeSpendableCreditsMsg(collection(), context);
    expect(msg.value.transfers[0].balances[0].amount).toBe('2');
    expect(JSON.parse(msg.value.transfers[0].memo)).toMatchObject({ requestId: 'request-123', serviceId: 'images', provider: BURN_ADDRESS });
    expect(verifySpendableCreditReceipt(collection(), receipt(), context).receiptId).toBe(`${'A'.repeat(64)}:0:0`);
  });
  test.each(['wallet', 'provider', 'serviceId', 'requestId', 'units'])('rejects receipt with wrong %s', (key) => {
    expect(() => verifySpendableCreditReceipt(collection(), receipt(), { ...context, [key]: 'different' })).toThrow();
  });
  test('never treats failed, pending or malformed transactions as consumption', () => {
    for (const tx of [
      { ...receipt(), code: 7 },
      { ...receipt(), height: '0' },
      { ...receipt(), code: undefined },
      { ...receipt(), txhash: '' }
    ]) {
      expect(() => verifySpendableCreditReceipt(collection(), tx, context)).toThrow();
    }
  });
  test('rejects extra recipients, balances, and ambiguous duplicate transfers', () => {
    for (const mutate of [
      (transfer: any) => transfer.toAddresses.push(BURN_ADDRESS),
      (transfer: any) => transfer.balances.push(transfer.balances[0])
    ]) {
      const tx = receipt();
      mutate(tx.tx.body.messages[0].transfers[0]);
      expect(() => verifySpendableCreditReceipt(collection(), tx, context)).toThrow();
    }
    const duplicate = receipt();
    duplicate.tx.body.messages[0].transfers.push(duplicate.tx.body.messages[0].transfers[0]);
    expect(() => verifySpendableCreditReceipt(collection(), duplicate, context)).toThrow();
  });
  test('rejects purchase multiplication that overflows payment units', () => {
    expect(() => buildPurchaseSpendableCreditsMsg(collection(), BURN_ADDRESS, '1844674407370955')).toThrow();
  });
});

test('standards audit enforces spendable terms instead of treating the profile as unchecked', () => {
  const value = collection();
  expect(verifyStandardsCompliance(value).standardsChecked).toContain('Spendable Credit');
  value.collectionPermissions.canUpdateCollectionApprovals = [];
  expect(verifyStandardsCompliance(value).valid).toBe(false);
});

test('quotes and selects immutable fixed and scaled purchase tiers', () => {
  const c = {
    ...buildSpendableCredit({
      provider: BURN_ADDRESS,
      serviceId: 'test',
      paymentDenom: 'USDC',
      uri: 'ipfs://test',
      purchaseOptions: [
        { pricePerPack: '10', creditsPerPack: '3', purchaseType: 'fixed' },
        { pricePerPack: '20', creditsPerPack: '8', purchaseType: 'scaled', maxPacks: '4' }
      ]
    }).value,
    collectionId: '9'
  };
  expect(inspectSpendableCredit(c).purchaseOptions).toHaveLength(2);
  expect(() => quoteSpendableCreditPurchase(c, '1')).toThrow('Select');
  expect(() => quoteSpendableCreditPurchase(c, '2', 'spendable-purchase')).toThrow('maximum');
  expect(() => quoteSpendableCreditPurchase(c, '5', 'spendable-purchase-2')).toThrow('maximum');
  expect(() => quoteSpendableCreditPurchase(c, '0.5', 'spendable-purchase-2')).toThrow('whole');
  expect(quoteSpendableCreditPurchase(c, '4', 'spendable-purchase-2')).toMatchObject({ paymentAmount: '80', creditsAmount: '32', unlimited: false });
  expect(buildPurchaseSpendableCreditsMsg(c, BURN_ADDRESS, '2', 'spendable-purchase-2').value.transfers[0].prioritizedApprovals[0].approvalId).toBe(
    'spendable-purchase-2'
  );
  const bad = structuredClone(c);
  bad.collectionApprovals[1].approvalCriteria.coinTransfers[0].to = 'All';
  expect(() => inspectSpendableCredit(bad)).toThrow();
});

test('spendable credits have distinct discovery, interpretation and inspection', () => {
  expect(getTokenTypeSkillIds()).toContain('spendable-credit');
  expect(JSON.stringify(inferFromStandards(['Spendable Credit'], new Set(getTokenTypeSkillIds())))).toContain('spendable-credit');
  expect(detectType(['Spendable Credit'], false)).toBe('Spendable Credit');
  expect(buildTypeExplanation('Spendable Credit', 0n)).toContain('consume');
  expect(buildStandardExplanations(['Spendable Credit'])[0]).toContain('receipt');
  const result = inspectStandardCollection(collection() as any, 'spendable-credit');
  expect(result.configurationSupported).toBe(true);
  expect(result.actions.consume.approvalIds).toEqual(['spendable-consume']);
  const malformed = collection();
  malformed.collectionApprovals.push({ ...malformed.collectionApprovals[0], approvalId: 'free-mint' });
  expect(inspectStandardCollection(malformed as any, 'spendable-credit').configurationSupported).toBe(false);
});
