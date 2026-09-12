import { PAYMENT_REQUEST_PRESETS } from './payment-request.js';

describe('payment request presets', () => {
  it('allows All for pay without changing who funds the payment', () => {
    const preset = PAYMENT_REQUEST_PRESETS.find((p) => p.presetId === 'payment-request.pay')!;
    const params = preset.paramsSchema.parse({
      approvalId: 'pay', payer: 'All', recipient: 'bb1recipient', denom: 'ubadge', amount: '10', expirationMs: '1000'
    });
    const approval = preset.render(params);
    expect(approval.initiatedByListId).toBe('All');
    expect(approval.approvalCriteria).toMatchObject({ coinTransfers: [{ overrideFromWithApproverAddress: false }] });
  });

  it('rejects All for deny and preserves specific-payer denial', () => {
    const preset = PAYMENT_REQUEST_PRESETS.find((p) => p.presetId === 'payment-request.deny')!;
    expect(preset.paramsSchema.safeParse({ approvalId: 'deny', payer: 'All', expirationMs: '1000' }).success).toBe(false);
    expect(preset.paramsSchema.safeParse({ approvalId: 'deny', payer: 'bb1payer', expirationMs: '1000' }).success).toBe(true);
  });
});
