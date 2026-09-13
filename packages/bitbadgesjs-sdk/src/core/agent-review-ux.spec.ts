import { buildSubscription } from './builders/subscription.js';
import { buildPaymentRequestV2 } from './payment-requests-v2.js';
import { interpretTransaction } from './interpret-transaction.js';
import { buildApprovalParagraph } from './interpret-shared.js';
import { reviewCollection } from './review.js';
import { normalizeForReview } from './review-normalize.js';

const merchant = 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm';
const subscription = (updatableMint = false) =>
  buildSubscription({
    interval: 'monthly',
    price: 1,
    denom: 'BADGE',
    recipient: merchant,
    name: 'Pro membership',
    description: 'One period',
    image: 'https://example.com/pro.png',
    updatableMint
  });

describe('agent review UX', () => {
  it('recognizes inline collection, token and approval names without mutating the proposal', () => {
    const msg = subscription();
    const before = JSON.stringify(msg);
    const explanation = interpretTransaction(msg.value);
    expect(explanation).toContain('"Pro membership"');
    expect(explanation).not.toContain('Unnamed Collection');
    expect(explanation).not.toContain('**"unnamed"**');
    expect(explanation).toContain('Subscription Faucet');
    expect(reviewCollection(msg).findings.map((f) => f.code)).not.toContain('review.ux.unnamed_approvals');
    expect(normalizeForReview(msg).collectionMetadata.metadata.name).toBe('Pro membership');
    expect(JSON.stringify(msg)).toBe(before);
  });

  it('treats frozen subscription terms as informational while preserving editable-mint risks', () => {
    const frozen = reviewCollection(subscription());
    const finding = frozen.findings.find((f) => f.code === 'review.audit.context.subscription_with_frozen_approvals');
    expect(finding?.severity).toBe('info');
    expect(finding?.recommendation.en).not.toContain('PERMITTED');
    expect(reviewCollection(subscription(true)).findings.some((f) => f.severity === 'critical')).toBe(true);
  });

  it('explains Mint-to-burn invoice overrides without claiming payer consent is bypassed', () => {
    const msg = buildPaymentRequestV2({
      version: 2,
      kind: 'invoice',
      name: 'Invoice',
      image: 'https://example.com/invoice.png',
      description: 'One payment',
      obligations: [
        {
          id: 'one',
          payer: { kind: 'addresses', addresses: ['bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7'] },
          payouts: [{ recipient: merchant, denom: 'ubadge', amount: '1000000' }],
          startTime: '1',
          endTime: '9999999999999'
        }
      ]
    });
    const text = interpretTransaction(msg.value);
    expect(text).toContain('Mint');
    expect(text).toContain('burn address');
    expect(text).not.toContain('Tokens can be moved from a holder without');
    expect(text).not.toContain('Tokens can be deposited into any address');
    expect(text).toContain('does not authorize debiting the payer');
  });

  it('retains warnings for actual holder transfers with outgoing overrides', () => {
    const text = buildApprovalParagraph(
      {
        fromListId: '!Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        approvalCriteria: { overridesFromOutgoingApprovals: true, overridesToIncomingApprovals: true }
      },
      false
    );
    expect(text).toContain('Tokens can be moved from a holder without their explicit per-transfer consent');
    expect(text).toContain('Tokens can be deposited into any address');
  });

  it('does not use customData as metadata when a hosted URI is selected', () => {
    const msg = subscription();
    msg.value.collectionMetadata.uri = 'https://example.com/hosted.json';
    msg.value.collectionApprovals[0].uri = 'https://example.com/approval.json';
    const normalized = normalizeForReview(msg);
    expect(normalized.collectionMetadata.metadata).toBeUndefined();
    expect(normalized.collectionApprovals[0].details).toBeUndefined();
    expect(interpretTransaction(msg.value)).toContain('called "Unnamed Collection"');
    expect(interpretTransaction(msg.value)).not.toContain('Subscription Faucet');
  });
});
