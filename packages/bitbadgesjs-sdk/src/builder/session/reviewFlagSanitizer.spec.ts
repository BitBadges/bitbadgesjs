import { sanitizeReviewFlag } from './reviewFlagSanitizer.js';

describe('sanitizeReviewFlag', () => {
  it('replaces raw bb1 address with human-readable text', () => {
    const out = sanitizeReviewFlag({
      kind: 'clarification_needed',
      severity: 'medium',
      message: 'Payment goes to bb1w63npeee74ewuudzf8cgvy6at4jn4mjr0a9r5p by default.',
      chosen: 'Payments to bb1w63npeee74ewuudzf8cgvy6at4jn4mjr0a9r5p'
    });
    expect(out.message).not.toContain('bb1w63np');
    expect(out.chosen).not.toContain('bb1w63np');
    expect(out.chosen).toContain('BitBadges address');
  });

  it('replaces initiatedByListId identifier with plain language', () => {
    const out = sanitizeReviewFlag({
      kind: 'design_choice',
      severity: 'low',
      message: 'Anyone can subscribe.',
      chosen: 'initiatedByListId: All'
    });
    expect(out.chosen).not.toContain('initiatedByListId');
    expect(out.chosen).toContain('open to anyone');
  });

  it('rewrites requiresTokenGating and related compound jargon', () => {
    const out = sanitizeReviewFlag({
      kind: 'design_choice',
      severity: 'low',
      message: 'Restrict to a whitelist via requiresTokenGating if you want certain addresses only.',
      chosen: 'no token-gating'
    });
    expect(out.message).not.toContain('requiresTokenGating');
    expect(out.message).toContain('token-gate');
  });

  it('replaces IBC denoms', () => {
    const out = sanitizeReviewFlag({
      kind: 'assumption',
      severity: 'low',
      message: 'Denom is ibc/A4DB47A9D3CF9A068D454513891B526702455D3EF08FB9EB558C561F9DC2B701',
      chosen: 'ATOM'
    });
    expect(out.message).not.toContain('ibc/');
    expect(out.message).toContain('IBC coin');
  });

  it('replaces IPFS CIDs and placeholder URIs', () => {
    const out = sanitizeReviewFlag({
      kind: 'assumption',
      severity: 'low',
      message: 'Used ipfs://QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E as image.',
      chosen: 'ipfs://METADATA_COLLECTION'
    });
    expect(out.message).not.toContain('Qm');
    expect(out.message).toContain('IPFS image');
    expect(out.chosen).not.toContain('METADATA_');
    expect(out.chosen).toContain('placeholder image');
  });

  it('leaves fieldPath untouched (UI-only)', () => {
    const out = sanitizeReviewFlag({
      kind: 'design_choice',
      severity: 'low',
      message: 'Some cleanup needed',
      chosen: 'value',
      fieldPath: 'messages[0].value.collectionApprovals[0].initiatedByListId'
    });
    expect(out.fieldPath).toBe('messages[0].value.collectionApprovals[0].initiatedByListId');
  });

  it('does not over-scrub non-jargon strings', () => {
    const out = sanitizeReviewFlag({
      kind: 'assumption',
      severity: 'low',
      message: 'Treated month as 30 days.',
      chosen: '30-day renewal period'
    });
    expect(out.message).toBe('Treated month as 30 days.');
    expect(out.chosen).toBe('30-day renewal period');
  });
});
