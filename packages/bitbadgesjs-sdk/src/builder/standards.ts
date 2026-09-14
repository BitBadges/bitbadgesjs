import { listStandardBuilders } from '../core/builders/input-schemas.js';
import { PAYMENT_REQUEST_EXAMPLES } from '../cli/utils/payment-request-examples.js';

export type StandardOperation = {
  id: string;
  cli: string[];
  mcp: string;
  schemaCommand: string[];
  requiredInputs: string[];
};
export type StandardDescriptor = {
  id: string;
  summary: string;
  eligibility: 'not-evaluated';
  frontendFamily?: string;
  validation?: { tagRecognition: 'hint-only'; inputSchema: 'operation-specific'; semanticConformance: 'not-evaluated' };
  builders?: StandardOperation[];
  actions?: StandardOperation[];
  constraints?: string[];
  unsupported?: string[];
  cliHelp?: string[];
  substandards?: { id: string; description: string; exampleCommand?: string[] }[];
};
type Lifecycle = { summary: string; actionGroup?: string; constraints: string[]; unsupported: string[]; cliHelp?: string[] };
const frontendFamilies: Record<string, string> = {
  'custom-2fa': 'custom-2fa',
  quests: 'quests',
  subscription: 'subscriptions',
  'ibc-token': 'ibc-token',
  'smart-token': 'smart-token',
  'credit-token': 'credit-token',
  'address-list': 'address-list',
  'prediction-market': 'prediction-market',
  bounty: 'bounty',
  'payment-request': 'payment-request',
  'payment-request-v2': 'payment-request',
  crowdfund: 'crowdfund',
  auction: 'auction',
  'product-catalog': 'product-catalog',
  vault: 'vault',
  'tradable-fungible': 'tradable-fungible',
  nft: 'nft',
  'one-of-one': 'one-of-one',
  'issuer-controlled': 'issuer-controlled'
};
const lifecycle: Record<string, Lifecycle> = {
  'ibc-token': {
    summary: 'IBC token factory collection family.',
    constraints: [
      'IBC denominations, aliases, and configured backing must be inspected independently. No dedicated one-shot builder is mapped here.'
    ],
    unsupported: ['A dedicated standard builder or lifecycle action adapter in this catalog.']
  },
  'tradable-fungible': {
    summary: 'Tradable fungible token collection family.',
    constraints: ['Use the general collection session tools for supply, approvals, and permissions. Transferability depends on actual rules.'],
    unsupported: ['A dedicated one-shot builder or standard action adapter in this catalog.']
  },
  nft: {
    summary: 'Non-fungible collections with optional marketplace approvals.',
    cliHelp: ['bb', 'nfts', '--help'],
    constraints: [
      'Use general collection session tools to create a collection. Marketplace commands manage user orders and transfers, not collection creation.'
    ],
    unsupported: ['A dedicated NFT collection builder or shared MCP marketplace action adapter in this catalog.']
  },
  'one-of-one': {
    summary: 'Single-token collection family.',
    constraints: ['A display tag alone does not prove immutable single supply. Inspect mint approvals, valid IDs, and permissions.'],
    unsupported: ['A dedicated one-shot builder or standard action adapter in this catalog.']
  },
  'issuer-controlled': {
    summary: 'Tokens with issuer-defined transfer controls.',
    constraints: ['Inspect issuer authority and mutable permissions before accepting custody or transfer restrictions.'],
    unsupported: ['A dedicated one-shot builder or standard action adapter in this catalog.']
  },
  subscription: {
    summary: 'Time-bounded access with separately authorized renewal payments.',
    actionGroup: 'subscriptions',
    constraints: [
      'Paid access and renewal consent are independent. Future access is not current access.',
      'Recorded consent does not guarantee balance, executor availability, or successful renewal.'
    ],
    unsupported: ['Automatic plan switching, prorations, and refunds of paid access.']
  },
  'credit-token': {
    summary: 'Purchase exact credit quantities using fixed or scaled tiers.',
    actionGroup: 'credit_tokens',
    constraints: [
      'Select a tier explicitly when multiple tiers exist. Scaled purchases obey integer increments and maximum multipliers.',
      'Quotes exclude fees and do not prove current eligibility. On-chain balances are not an external service usage ledger.'
    ],
    unsupported: ['Automatic service consumption accounting, refunds, and credit-to-cash redemption.']
  },
  'product-catalog': {
    summary: 'A frozen catalog of separately priced products and payout recipients.',
    actionGroup: 'products',
    constraints: [
      'Creation freezes product approvals. Each product may override the catalog payout recipient.',
      'A purchase records a token transfer; fulfillment remains the merchant responsibility.'
    ],
    unsupported: ['Editing frozen catalog products, delivery verification, automatic returns, and refunds.']
  },
  'payment-request-v2': {
    summary: 'Invoices and payment links with explicit payer rules and tracked obligations.',
    actionGroup: 'pay_requests',
    constraints: [
      'Payments go directly to configured recipients; this is not escrow.',
      'Amounts use base-unit strings. Partial payments use integer payout quanta.',
      'Tracker reads may be unavailable or stale. Reconcile before submitting another payment.',
      'Deny is a legacy payment-request action; invoice v2 and payment links do not expose that lifecycle branch.'
    ],
    unsupported: ['Automatic refunds, prorations, and escrow-based conditional release.']
  },
  'payment-request': {
    summary: 'Legacy single-payment request.',
    actionGroup: 'pay_requests',
    constraints: ['Legacy payment requests differ structurally from invoice v2 and reusable payment links.'],
    unsupported: ['Invoice v2 multi-payer and partial-payment behavior in the legacy builder.']
  },
  auction: {
    summary: 'Timed bidding followed by seller acceptance.',
    actionGroup: 'auctions',
    constraints: ['A bid is an approval, not guaranteed escrow funding. Acceptance must satisfy live approval and balance state.'],
    unsupported: ['Guaranteed bidder funding and autonomous settlement without a submitted transaction.']
  },
  crowdfund: {
    summary: 'Deadline and target based contributions, withdrawal, and refunds.',
    actionGroup: 'crowdfunds',
    constraints: ['Withdrawal and refund eligibility depend on the configured approval branches and live trackers.'],
    unsupported: ['Off-chain project delivery guarantees and dispute arbitration.']
  },
  bounty: {
    summary: 'Acceptance, denial, and expiry branches for a funded reward.',
    actionGroup: 'bounties',
    constraints: ['Acceptance depends on the configured decision authority. Expiry alone does not submit a refund transaction.'],
    unsupported: ['Automatic work verification and external dispute arbitration.']
  },
  'prediction-market': {
    summary: 'Binary outcome positions with a configured resolver.',
    actionGroup: 'prediction_markets',
    constraints: ['Outcome resolution trusts the configured resolver. Settlement requires live approval, outcome, and balance state.'],
    unsupported: ['Trustless external event verification and automatic dispute arbitration.']
  },
  'smart-token': {
    summary: 'Programmable deposit and withdrawal relationships.',
    actionGroup: 'smart_tokens',
    constraints: ['Configured approvals determine backing and transfer eligibility; a standard tag is not proof of collateral or conformance.'],
    unsupported: ['Native interest accrual, lending liquidation, and yield guarantees.']
  },
  vault: {
    summary: 'A vault builder using existing smart-token primitives.',
    constraints: [
      'Review exact spend approvals, recipients, limits, and permissions. Builder availability is not a certification of agent custody safety.'
    ],
    unsupported: ['Unbounded autonomous spending and native interest accrual.']
  },
  quests: {
    summary: 'Claim and reward approval configuration.',
    constraints: ['External task completion requires its configured verification source.'],
    unsupported: ['Automatic verification of arbitrary off-chain tasks.']
  },
  'address-list': {
    summary: 'Membership and address-list collection configuration.',
    constraints: ['Membership rules and manager permissions determine eligibility.'],
    unsupported: ['Identity uniqueness or proof of personhood from an address alone.']
  },
  'custom-2fa': {
    summary: 'A collection used for additional authorization conditions.',
    cliHelp: ['bb', 'custom-2fa', '--help'],
    constraints: ['Authorization strength depends on the configured approval conditions and verification source.'],
    unsupported: ['Universal protection of unrelated wallet transactions.']
  },
  intent: {
    summary: 'User approval for a constrained exchange.',
    cliHelp: ['bb', 'intents', '--help'],
    constraints: ['An intent is not reserved liquidity. Concurrent updates require reading current user approvals.'],
    unsupported: ['Guaranteed fills and atomic compare-and-swap for whole approval-list replacement.']
  },
  listing: {
    summary: 'User outgoing approval for marketplace sales.',
    cliHelp: ['bb', 'nfts', '--help'],
    constraints: ['Listings require current ownership and approval state at execution.'],
    unsupported: ['Guaranteed buyer demand and automatic delivery of off-chain assets.']
  },
  bid: {
    summary: 'User incoming approval for marketplace bids.',
    cliHelp: ['bb', 'nfts', '--help'],
    constraints: ['A bid does not reserve the bidder payment balance.'],
    unsupported: ['Guaranteed bidder liquidity.']
  },
  'pm-buy-intent': {
    summary: 'User incoming approval for prediction outcome purchases.',
    cliHelp: ['bb', 'prediction-markets', '--help'],
    constraints: ['Live outcome state, approvals, and balances govern execution.'],
    unsupported: ['Guaranteed fills.']
  },
  'pm-sell-intent': {
    summary: 'User outgoing approval for prediction outcome sales.',
    cliHelp: ['bb', 'prediction-markets', '--help'],
    constraints: ['Live outcome state, approvals, and balances govern execution.'],
    unsupported: ['Guaranteed fills.']
  }
};

type OperationSchema = { inputSchema: { required?: string[] } };
export function describeStandards(registry: Record<string, { tool: OperationSchema }>, id?: string) {
  const ids = [...new Set([...listStandardBuilders().map((builder) => builder.id), ...Object.keys(lifecycle)])].sort();
  if (id !== undefined && (typeof id !== 'string' || !ids.includes(id))) throw new Error(`Unknown standard: ${String(id)}. Run bb dev standards.`);
  const operation = (name: string, cli: string[]): StandardOperation => {
    const entry = registry[name];
    if (!entry) throw new Error(`Missing standard operation: ${name}`);
    return {
      id: name,
      cli,
      mcp: name,
      schemaCommand: ['bb', 'dev', 'capabilities', name],
      requiredInputs: [...(entry.tool.inputSchema.required ?? [])]
    };
  };
  return {
    schemaVersion: 1,
    primaryInterface: 'cli',
    scope:
      'Installed tooling and lifecycle limitations, not live collection conformance or transaction eligibility. Tags are discovery hints. Structural schemas do not prove semantic correctness. Read current state, review exact terms and fees, simulate, then request signing separately.',
    standards: ids
      .filter((name) => id === undefined || name === id)
      .map((name): StandardDescriptor => {
        const facts = lifecycle[name];
        if (!facts) throw new Error(`Missing lifecycle documentation: ${name}`);
        const summary: StandardDescriptor = {
          id: name,
          summary: facts.summary,
          eligibility: 'not-evaluated',
          ...(frontendFamilies[name] ? { frontendFamily: frontendFamilies[name] } : {})
        };
        if (id === undefined) return summary;
        const builderName = `build_${name.replace(/-/g, '_')}`;
        return {
          ...summary,
          validation: { tagRecognition: 'hint-only', inputSchema: 'operation-specific', semanticConformance: 'not-evaluated' },
          builders: registry[builderName]
            ? [operation(builderName, name === 'quests' ? ['bb', 'dev', 'tools', 'call', builderName] : ['bb', 'build', name])]
            : [],
          actions: facts.actionGroup
            ? Object.keys(registry)
                .filter(
                  (key) =>
                    key.startsWith(`standard_${facts.actionGroup}_`) && !(name === 'payment-request-v2' && key === 'standard_pay_requests_deny')
                )
                .sort()
                .map((key) =>
                  operation(key, ['bb', facts.actionGroup!.replace(/_/g, '-'), key.slice(`standard_${facts.actionGroup}_`.length).replace(/_/g, '-')])
                )
            : [],
          constraints: [
            ...facts.constraints,
            'Unsigned proposals do not sign or broadcast. Permission to create does not imply permission to manage an existing collection.'
          ],
          unsupported: [...facts.unsupported],
          ...(facts.cliHelp ? { cliHelp: [...facts.cliHelp] } : {}),
          ...(name === 'payment-request-v2'
            ? {
                substandards: [
                  ...PAYMENT_REQUEST_EXAMPLES.map((example) => ({
                    ...example,
                    exampleCommand: ['bb', 'build', 'payment-request-v2', '--example', example.id]
                  })),
                  { id: 'custom', description: 'Validated combinations that do not match one predefined display category.' }
                ]
              }
            : {})
        };
      })
  };
}
