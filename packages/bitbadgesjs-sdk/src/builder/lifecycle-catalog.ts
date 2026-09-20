import fixtures from './lifecycle-fixtures.json';
import { describeStandards } from './standards.js';

export const lifecycleExcluded = [
  'signatures',
  'ante-handler fees',
  'sequences',
  'block hooks',
  'live chain state',
  'claims',
  'plugins',
  'indexer',
  'IBC',
  'external services',
  'DEX trading'
];
const references: Record<string, { templates: string[]; limits: string }> = {
  subscription: {
    templates: ['subscription-paid', 'subscription-consent-and-locks', 'subscription'],
    limits: 'Fixed-duration paid access and renewal; no calendar billing or automatic debit. Transfer restrictions are not necessarily immutable.'
  },
  'payment-request': {
    templates: ['invoice', 'invoice-deadline-1896048000000', 'invoice-deadline-1896048000001'],
    limits: 'Direct invoice payment only; no escrow, refund guarantee, or payment-request-v2 coverage.'
  },
  'smart-token': {
    templates: ['backed'],
    limits: 'On-chain reserve deposit/withdrawal only; no off-chain backing or arbitrary smart-token configurations.'
  },
  'credit-token': { templates: ['credits-purchase'], limits: 'Purchase multiples and transfer/burn restrictions only.' },
  'spendable-credit': {
    templates: ['spendable-credits'],
    limits: 'Purchase, holder consumption and expiry restrictions; no proof of service delivery.'
  },
  nft: {
    templates: ['nft', 'batch-rollback'],
    limits: 'Mint cap, authorization, transfer, burn and rollback; burning does not restore mint allowance.'
  },
  'tradable-fungible': { templates: ['fungible'], limits: 'Token rules only; no DEX, pools, pricing, or trading integration.' }
};

export function getLifecycleCapabilities() {
  return {
    version: 1,
    maturity: 'experimental',
    scope: 'supplied-scenario-assertions',
    productVerification: 'not-established',
    referenceChainCommit: fixtures.chainCommit,
    useWhen: ['Checking isolated tokenization rules before deployment', 'Testing expected rejections, time boundaries, and state changes'],
    avoidWhen: [
      'Certifying an arbitrary product or intent',
      'Checking live eligibility, wallet funding, signing or broadcast',
      'Verifying integrations or production readiness'
    ],
    excluded: [...lifecycleExcluded],
    standards: describeStandards({}).standards.map(({ id }) => ({
      id,
      support: references[id] ? 'reference-scenarios' : 'no-reference-coverage',
      templates: [...(references[id]?.templates ?? [])],
      limits: references[id]?.limits ?? 'No shipped reference scenario. Custom module scenarios may run, but product coverage is not established.'
    })),
    nextSteps: ['get_lifecycle_template', 'environment_diagnostics', 'lifecycle_schema', 'run_lifecycle']
  };
}

export function getLifecycleTemplate(id: string) {
  if (!Object.hasOwn(fixtures.fixtures, id)) throw new Error(`Unknown lifecycle template: ${id}. Read get_lifecycle_capabilities.`);
  const fixture = fixtures.fixtures[id as keyof typeof fixtures.fixtures];
  return {
    id,
    maturity: 'experimental',
    source: { chainCommit: fixtures.chainCommit, path: `lifecycle/testdata/scenarios/${id}.json`, sha256: fixture.sourceSha256 },
    guidance:
      'Synthetic local reference only. Adapt messages, actors, actions and assertions together; independently review expected outcomes. Edits become caller-authored scenarios.',
    input: { scenario: structuredClone(fixture.scenario), requiredCoverage: ['module'] }
  };
}

export function lifecycleProvenance(scenario: unknown) {
  const canonical = (value: unknown) =>
    JSON.stringify(value, (_, item) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
        : item
    );
  const encoded = canonical(scenario);
  const match = Object.entries(fixtures.fixtures).find(([, fixture]) => encoded === canonical(fixture.scenario));
  return match ? { origin: 'shipped-reference', templateId: match[0], referenceChainCommit: fixtures.chainCommit } : { origin: 'caller-authored' };
}
