import { parseCases, evaluateArtifact, runCases } from './index.js';

const fixture = {
  version: 1,
  id: 'invoice',
  prompt: 'Pay exactly 5 base units to the merchant.',
  tool: 'build_payment_request',
  input: { amount: 5 },
  clarifications: [{ question: 'Recipient?', answer: 'merchant' }],
  limitations: ['Artifact checks only; no chain execution.'],
  assertions: [
    { id: 'amount', path: '/value/amount', operator: 'equals', expected: '5', requirement: 'Exact payment' },
    { id: 'recipient', path: '/value/recipient', operator: 'equals', expected: 'merchant', requirement: 'Intended recipient' }
  ],
  mutations: [{ id: 'divert-payment', path: '/value/recipient', value: 'attacker', mustFail: ['recipient'] }]
};
const artifact = { value: { amount: '5', recipient: 'merchant' } };

describe('behavioral golden contracts', () => {
  it('rejects empty suites, duplicate IDs and unknown schema fields/operators', () => {
    for (const input of [
      [],
      [fixture, fixture],
      [{ ...fixture, version: 2 }],
      [{ ...fixture, assertions: [] }],
      [{ ...fixture, assertions: [fixture.assertions[0], fixture.assertions[0]] }],
      [{ ...fixture, surprise: true }],
      [{ ...fixture, assertions: [{ ...fixture.assertions[0], operator: 'truthy' }] }],
      [{ ...fixture, mutations: [{ ...fixture.mutations[0], mustFail: ['nonexistent'] }] }],
      [{ ...fixture, mutations: [fixture.mutations[0], fixture.mutations[0]] }],
      [{ ...fixture, assertions: [{ ...fixture.assertions[0], path: '/bad~escape' }] }]
    ])
      expect(() => parseCases(input)).toThrow();
  });

  it('checks exact values without coercing large integers or accepting missing fields', () => {
    const [testCase] = parseCases([fixture]);
    expect(evaluateArtifact(testCase, artifact).every((item) => item.passed)).toBe(true);
    expect(evaluateArtifact(testCase, { value: { amount: 5, recipient: 'merchant' } })[0].passed).toBe(false);
    const missing = evaluateArtifact(testCase, { value: {} });
    expect(missing.every((item) => !item.passed && !item.found)).toBe(true);
    expect(JSON.parse(JSON.stringify(missing))[0].found).toBe(false);
    const [large] = parseCases([{ ...fixture, assertions: [{ ...fixture.assertions[0], expected: '9007199254740993' }], mutations: [] }]);
    expect(evaluateArtifact(large, { value: { amount: '9007199254740992' } })[0].passed).toBe(false);
  });

  it('supports escaped pointers, ignores object key order and refuses inherited properties', () => {
    const [testCase] = parseCases([
      {
        ...fixture,
        mutations: [],
        assertions: [
          { id: 'escaped', requirement: 'Exact nested object', path: '/a~1b/~0', operator: 'equals', expected: { b: 2, a: 1 } },
          { id: 'inherited', requirement: 'Must be an own property', path: '/inherited', operator: 'equals', expected: true }
        ]
      }
    ]);
    const result = evaluateArtifact(testCase, Object.assign(Object.create({ inherited: true }), { 'a/b': { '~': { a: 1, b: 2 } } }));
    expect(result.map((item) => item.passed)).toEqual([true, false]);
  });

  it('does not accept strings or objects as arrays for length/contains checks', () => {
    const [testCase] = parseCases([
      {
        ...fixture,
        mutations: [],
        assertions: [
          { id: 'size', requirement: 'One approval', path: '/items', operator: 'length', expected: 1 },
          { id: 'member', requirement: 'Expected approval', path: '/items', operator: 'contains', expected: 'x' }
        ]
      }
    ]);
    expect(evaluateArtifact(testCase, { items: ['x'] }).every((item) => item.passed)).toBe(true);
    for (const items of ['x', { length: 1, 0: 'x' }, null]) {
      expect(evaluateArtifact(testCase, { items }).every((item) => !item.passed)).toBe(true);
    }
  });

  it('catches specified mutations without modifying output and reports scope honestly', async () => {
    const before = JSON.stringify(artifact);
    const report = await runCases(parseCases([fixture]), async () => artifact);
    expect(report.passed).toBe(true);
    expect(report.scope).toBe('artifact-contracts');
    expect(report.chainExecution).toBe('not-run');
    expect(report.results[0].mutations[0]).toMatchObject({ id: 'divert-payment', caught: true, failedAssertions: ['recipient'] });
    expect(JSON.stringify(artifact)).toBe(before);
  });

  it('fails vacuous mutations and mutations of missing fields', async () => {
    for (const mutation of [
      { ...fixture.mutations[0], value: 'merchant' },
      { ...fixture.mutations[0], path: '/missing/recipient' }
    ]) {
      const report = await runCases(parseCases([{ ...fixture, mutations: [mutation] }]), async () => artifact);
      expect(report.passed).toBe(false);
      expect(report.results[0].mutations[0].caught).toBe(false);
    }
  });

  it('isolates builder failures, cannot mutate acceptance criteria and still grades remaining cases', async () => {
    const cases = parseCases([fixture, { ...fixture, id: 'second' }]);
    const report = await runCases(cases, async (input) => {
      if (input.id === 'invoice') {
        input.assertions[0].expected = '999';
        throw new Error('fixture failure');
      }
      return artifact;
    });
    expect(report.passed).toBe(false);
    expect(report.results[0].error).toBe('fixture failure');
    expect(report.results[1].passed).toBe(true);
    expect(cases[0].assertions[0].expected).toBe('5');
  });

  it('fails a plausible but wrong artifact even if the producer reports success', async () => {
    const report = await runCases(parseCases([fixture]), async () => ({ ...artifact, value: { amount: '5', recipient: 'attacker' } }));
    expect(report.passed).toBe(false);
    expect(report.results[0].assertions.find((item) => item.id === 'recipient')?.passed).toBe(false);
  });

  it('does not count an existing failure as a mutation caught by the oracle', async () => {
    const report = await runCases(parseCases([fixture]), async () => ({ value: { amount: '5', recipient: 'other-attacker' } }));
    expect(report.results[0].mutations[0].caught).toBe(false);
  });

  it('keeps expected outcomes independent when the producer edits its copy', async () => {
    const report = await runCases(parseCases([fixture]), async (input) => {
      input.assertions[1].expected = 'attacker';
      return { value: { amount: '5', recipient: 'attacker' } };
    });
    expect(report.passed).toBe(false);
    expect(report.results[0].assertions[1].expected).toBe('merchant');
  });
});
