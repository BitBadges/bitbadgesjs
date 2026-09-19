import { isDeepStrictEqual } from 'node:util';
import cases from './cases.json';

type Mutation = { path: string[]; value: unknown };
type BenchmarkCase = {
  id: string;
  seed: string;
  classification: 'detectable' | 'benign' | 'intent-only';
  reason: string;
  mutations: Mutation[];
  expectedCodes: string[];
  allowedWarnings: string[];
};
const unlock = { path: ['value', 'collectionPermissions', 'canUpdateCollectionApprovals'], value: [] };
const mintRisk = 'review.audit.supply.mint_approvals_can_be_modified_unlimited_supply_risk';
const row = (id: string, seed: string, reason: string, mutations: Mutation[], expectedCodes: string[]): BenchmarkCase => ({
  id,
  seed,
  reason,
  mutations,
  expectedCodes,
  allowedWarnings: [],
  classification: 'detectable'
});
export const auditorCases: BenchmarkCase[] = [
  ...cases.map((seed): BenchmarkCase => ({
    id: 'benign-' + seed.id,
    seed: seed.id,
    classification: 'benign',
    reason: 'Intentional canonical configuration; unresolved IPFS metadata is outside this static check.',
    mutations: [],
    expectedCodes: [],
    allowedWarnings: []
  })),
  {
    id: 'intentional-manager-pricing',
    seed: 'subscription-fixed-price',
    classification: 'benign',
    reason: 'User explicitly retains manager pricing authority. The mint-authority warning is expected disclosure, not a false positive.',
    mutations: [unlock],
    expectedCodes: [mintRisk],
    allowedWarnings: [mintRisk]
  },
  row('unlocked-subscription', 'subscription-fixed-price', 'Manager can change mint pricing.', [unlock], [mintRisk]),
  row(
    'unlocked-backing',
    'backed-token',
    'Manager can change backing mint approvals.',
    [unlock],
    ['review.audit.supply.backing_approvals_can_be_modified_unlimited_supply_risk']
  ),
  row('unlocked-credit-purchase', 'purchasable-credits', 'Manager can change purchase terms.', [unlock], [mintRisk]),
  row('unlocked-service-credit', 'spendable-service-credits', 'Manager can change purchase and consume approvals.', [unlock], [mintRisk]),
  row(
    'missing-deposit',
    'backed-token',
    'Plausible approval name cannot substitute for an actual backing source.',
    [{ path: ['value', 'collectionApprovals', '0', 'fromListId'], value: 'All' }],
    ['review.audit.smart_token.missing_backing_approval_deposit']
  ),
  row(
    'missing-withdrawal',
    'backed-token',
    'Plausible approval name cannot substitute for a backing destination.',
    [{ path: ['value', 'collectionApprovals', '1', 'toListId'], value: 'All' }],
    ['review.audit.smart_token.missing_unbacking_approval_withdrawal']
  ),
  row(
    'mint-to-mint',
    'subscription-fixed-price',
    'Mint must not also be the destination.',
    [{ path: ['value', 'collectionApprovals', '0', 'toListId'], value: 'Mint' }],
    ['review.audit.approval_bug.approval_subscription_tier_1_sends_from_mint_to_mint']
  ),
  ...[
    ['subscription-fixed-price', 'wrong-recipient'],
    ['subscription-fixed-price', 'wrong-duration'],
    ['invoice-direct-payment', 'public-payer'],
    ['invoice-direct-payment', 'late-payment'],
    ['backed-token', 'wrong-ratio'],
    ['purchasable-credits', 'wrong-ratio'],
    ['spendable-service-credits', 'unbounded-packs']
  ].map(([seedId, mutationId]): BenchmarkCase => {
    const mutation = cases.find((seed) => seed.id === seedId)!.mutations.find((item) => item.id === mutationId)!;
    return {
      id: 'intent-' + seedId + '-' + mutationId,
      seed: seedId,
      classification: 'intent-only',
      reason: 'Structurally valid change; detecting the mismatch requires the original user intent or execution oracle.',
      mutations: [{ path: mutation.path.slice(1).split('/'), value: mutation.value }],
      expectedCodes: [],
      allowedWarnings: []
    };
  })
];

export async function runAuditorBenchmark(
  produce: (tool: string, input: Record<string, unknown>) => Promise<unknown>,
  review: (artifact: unknown) => { findings: { code: string; severity: string }[] }
) {
  const results = [];
  for (const test of auditorCases) {
    try {
      const seed = cases.find((item) => item.id === test.seed)!;
      const artifact = await produce(seed.tool, { ...structuredClone(seed.input), uri: 'ipfs://METADATA_GOLDEN' });
      const before = structuredClone(artifact);
      for (const mutation of test.mutations) {
        let target: any = artifact;
        for (const part of mutation.path.slice(0, -1)) {
          if (!target || !Object.prototype.hasOwnProperty.call(target, part)) throw new Error('Missing mutation target');
          target = target[part];
        }
        const key = mutation.path.at(-1)!;
        if (!target || !Object.prototype.hasOwnProperty.call(target, key)) throw new Error('Missing mutation target');
        target[key] = structuredClone(mutation.value);
      }
      if (test.mutations.length && isDeepStrictEqual(before, artifact)) throw new Error('No-op mutation');
      const findings = review(artifact).findings;
      const missingCodes = test.expectedCodes.filter((code) => !findings.some((finding) => finding.code === code));
      const unexpectedWarnings =
        test.classification === 'benign'
          ? findings
              .filter((finding) => ['critical', 'warning'].includes(finding.severity) && !test.allowedWarnings.includes(finding.code))
              .map((finding) => finding.code)
          : [];
      results.push({
        id: test.id,
        classification: test.classification,
        reason: test.reason,
        passed: !missingCodes.length && !unexpectedWarnings.length,
        findings,
        missingCodes,
        unexpectedWarnings,
        error: undefined as string | undefined
      });
    } catch (error) {
      results.push({
        id: test.id,
        classification: test.classification,
        reason: test.reason,
        passed: false,
        findings: [],
        missingCodes: test.expectedCodes,
        unexpectedWarnings: [],
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  const detectable = results.filter((result) => result.classification === 'detectable');
  const benign = results.filter((result) => result.classification === 'benign');
  return {
    version: 1,
    scope: 'static-reviewer',
    chainExecution: 'not-run',
    passed: results.every((result) => result.passed),
    summary: {
      total: results.length,
      detectable: detectable.length,
      detected: detectable.filter((result) => result.passed).length,
      benign: benign.length,
      falsePositives: benign.filter((result) => result.unexpectedWarnings.length > 0).length,
      intentOnly: results.filter((result) => result.classification === 'intent-only').length,
      infrastructureErrors: results.filter((result) => result.error).length
    },
    results
  };
}
