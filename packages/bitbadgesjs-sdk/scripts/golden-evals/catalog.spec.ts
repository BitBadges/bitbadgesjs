import { behavioralCases, gradeBehavior, publicCase } from './catalog.js';

describe('behavioral golden catalog', () => {
  it('checks each decision oracle independently and rejects a contradictory proposal', () => {
    for (const test of behavioralCases.filter((item) => !('assertions' in item.oracle))) {
      expect(gradeBehavior(test, { ...test.oracle, explanation: 'Fixture response.' }).passed).toBe(true);
      expect(gradeBehavior(test, { ...test.oracle, disposition: 'propose', artifact: {}, explanation: 'Sign this instead.' }).passed).toBe(false);
    }
  });
  it('contains 30 unique cases across disjoint development and held-out partitions', () => {
    expect(behavioralCases).toHaveLength(30);
    expect(new Set(behavioralCases.map((item) => item.id)).size).toBe(30);
    expect(behavioralCases.filter((item) => item.partition === 'held-out').length).toBeGreaterThanOrEqual(10);
    for (const tag of ['compose', 'update', 'ambiguity', 'unsupported', 'boundary', 'recovery']) {
      expect(behavioralCases.some((item) => item.tags.includes(tag))).toBe(true);
    }
  });
  it('withholds all evaluator checks and reference artifacts from model requests', () => {
    for (const test of behavioralCases) {
      const request = publicCase(test);
      expect(Object.keys(request).sort()).toEqual(['context', 'id', 'prompt']);
      expect(request).not.toHaveProperty('oracle');
      expect(request).not.toHaveProperty('reference');
    }
  });
  it('accepts explicit clarification or refusal and rejects artifact-bearing false assurances', () => {
    const ambiguous = behavioralCases.find((item) => item.id === 'ambiguous-recipient')!;
    expect(
      gradeBehavior(ambiguous, {
        disposition: 'clarify',
        reasonCode: 'missing-recipient',
        fields: ['recipient'],
        explanation: 'Who should receive payment?'
      }).passed
    ).toBe(true);
    expect(gradeBehavior(ambiguous, { disposition: 'propose', artifact: {}, explanation: 'Safe and ready.' }).passed).toBe(false);
    const frozen = behavioralCases.find((item) => item.id === 'update-frozen-price')!;
    expect(
      gradeBehavior(frozen, {
        disposition: 'unsupported',
        reasonCode: 'immutable-permission',
        explanation: 'The mint approval is permanently forbidden to update.'
      }).passed
    ).toBe(true);
    expect(
      gradeBehavior(frozen, { disposition: 'unsupported', reasonCode: 'immutable-permission', artifact: {}, explanation: 'But sign this.' }).passed
    ).toBe(false);
  });
  it('requires the correct recovery action and rejects a model-authored passing flag', () => {
    const pending = behavioralCases.find((item) => item.id === 'recover-broadcast-pending')!;
    expect(gradeBehavior(pending, { disposition: 'recover', nextAction: 'poll-existing-hash', explanation: 'Check the existing hash.' }).passed).toBe(
      true
    );
    expect(gradeBehavior(pending, { passed: true, disposition: 'recover', nextAction: 'rebroadcast', explanation: 'Send again.' }).passed).toBe(
      false
    );
  });
});
