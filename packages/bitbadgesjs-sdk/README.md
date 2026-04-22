# BitBadges SDK

The official TypeScript SDK for interacting with the BitBadges blockchain, API, and indexer.

[![npm version](https://badge.fury.io/js/bitbadges.svg)](https://www.npmjs.com/package/bitbadges)

> Previously published as `bitbadgesjs-sdk`. If you have old imports or install commands referencing that name, update them to `bitbadges`.

## Installation

```bash
npm install bitbadges
# or
bun add bitbadges
```

## AI agents — three ways to build

Pick the path that fits your use case. All three produce the same on-chain collection transactions.

### 1. Programmatic agent (BYO Anthropic key)

Scriptable from Node / TypeScript. You bring your own Anthropic API key; BitBadges never sees it.

```bash
npm install bitbadges @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-...
```

```ts
import { BitBadgesBuilderAgent } from 'bitbadges/builder/agent';

const agent = new BitBadgesBuilderAgent({ anthropicKey: process.env.ANTHROPIC_API_KEY });
const result = await agent.build('create a subscription token for $10/month');
console.log(result.transaction);
```

Supports OAuth tokens (`anthropicAuthToken` or `ANTHROPIC_OAUTH_TOKEN` env), a
BitBadges API key for query/search tools (`bitbadgesApiKey` or `BITBADGES_API_KEY`
env), skills filter, system prompt additions, hooks, pluggable session store,
typed errors, cost reporting, image placeholder substitution, health checks,
and a `/internals` escape hatch for DIY loops.

Examples: `examples/builder-agent/`. Full guide:
<https://docs.bitbadges.io/for-developers/ai-agents/programmatic-agent>

### 2. MCP builder (Claude Desktop / Cursor / Claude Code)

Zero-code path for human-in-the-loop builds. Point your MCP client at the
bundled `bitbadges-builder` stdio server:

```bash
claude mcp add bitbadges-builder bitbadges-builder
```

Full walkthrough, tool reference, and skill instructions:
<https://docs.bitbadges.io/for-developers/ai-agents/builder-tools>

### 3. Hand-rolled transactions via SDK classes

For non-AI workflows, import the message builders directly — see the Quick Start below.

The package ships three bins:
- `bitbadges` / `bitbadges-cli` — interactive CLI helpers
- `bitbadges-builder` — the stdio MCP server (entry point: `src/builder/index.ts`)

## Quick Start

### 1. Initialize the API Client

```typescript
import { BitBadgesAPI, BigIntify } from 'bitbadges';

const api = new BitBadgesAPI({
  convertFunction: BigIntify,
  apiKey: 'your-api-key', // Get from https://bitbadges.io/developer
  apiUrl: 'https://api.bitbadges.io' // Optional, defaults to production
});
```

### 2. Fetch a Collection

```typescript
const response = await api.getCollections({
  collectionsToFetch: [
    {
      collectionId: '1',
      metadataToFetch: {
        tokenIds: [{ start: 1n, end: 10n }]
      }
    }
  ]
});

const collection = response.collections[0]?.collection;
console.log('Name:', collection?.collectionMetadataTimeline?.[0]?.collectionMetadata?.name);
```

### 3. Check a User's Balance

```typescript
const balance = await api.getBalanceByAddress(
  '1',           // collectionId
  'bb1abc...',   // address
  {}
);

console.log('Token IDs:', balance.balances.map(b => b.badgeIds));
console.log('Amounts:', balance.balances.map(b => b.amount));
```

### 4. Get Token Activity

```typescript
const activity = await api.getTokenActivity('1', '1', { bookmark: '' });

for (const item of activity.activity) {
  console.log(`${item.from} -> ${item.to}: ${item.balances}`);
}
```

## Browser vs Node.js Usage

The SDK works in both browser and Node.js environments. Environment detection is handled automatically.

### Node.js

```typescript
// API key can be set via environment variable
process.env.BITBADGES_API_KEY = 'your-api-key';

const api = new BitBadgesAPI({
  convertFunction: BigIntify
  // apiKey will be read from BITBADGES_API_KEY env var
});
```

### Browser

```typescript
// In browsers, you MUST pass the apiKey explicitly
const api = new BitBadgesAPI({
  convertFunction: BigIntify,
  apiKey: 'your-api-key' // Required in browser - no env var access
});
```

> **Note**: The SDK uses defensive checks (`typeof process !== 'undefined'`) to support both environments. No polyfills needed.

## Core Concepts

### Number Types

The SDK uses a flexible `NumberType` system supporting `bigint`, `number`, and `string` to handle large blockchain values safely.

```typescript
import { BigIntify, Stringify, Numberify } from 'bitbadges';

// Always use BigIntify for large numbers (recommended)
const collectionId = BigIntify('12345678901234567890');

// Stringify for JSON serialization
const idString = Stringify(12345678901234567890n);

// Numberify only for small, safe integers
const smallNum = Numberify('100');
```

### Type System

The SDK has three type layers:

| Type | Example | Use Case |
|------|---------|----------|
| **Interface** (`iType`) | `iBalance<bigint>` | Type annotations, function parameters |
| **Class** | `Balance` | Most SDK operations - has utility methods |
| **Proto** | `proto.Balance` | Blockchain serialization (strings only) |

```typescript
import { Balance, UintRange } from 'bitbadges';

// Create instances with classes
const balance = new Balance({
  amount: 100n,
  badgeIds: [{ start: 1n, end: 10n }],
  ownershipTimes: [{ start: 1n, end: 1000n }]
});

// Convert between number types
const stringBalance = balance.convert(Stringify);

// Convert to proto for blockchain
const protoBalance = balance.toProto();
```

## Common Patterns

### Pagination

```typescript
let bookmark = '';
let hasMore = true;

while (hasMore) {
  const response = await api.getTokenActivity('1', '1', { bookmark });

  // Process results
  console.log(response.activity);

  // Get next page
  hasMore = response.pagination.hasMore;
  bookmark = response.pagination.bookmark;
}
```

### Error Handling

```typescript
try {
  const response = await api.getCollections({ collectionsToFetch: [{ collectionId: '1' }] });
} catch (error) {
  if (error.errorMessage) {
    console.error('API Error:', error.errorMessage);
  }
  if (error.unauthorized) {
    console.error('Authentication required');
  }
}
```

### Address Utilities

```typescript
import { convertToBitBadgesAddress, isAddressValid } from 'bitbadges';

// Validate a BitBadges address
const isValid = isAddressValid('bb1abc...');

// Convert to BitBadges format (bb-prefixed only)
const bbAddress = convertToBitBadgesAddress('bb1abc...');
```

## Module Structure

```
bitbadges/
├── core/           # Balance, UintRange, Approvals, Permissions
├── api-indexer/    # BitBadgesAPI client and response types
├── transactions/   # Message builders (MsgTransferTokens, etc.)
├── address-converter/  # Address utilities
├── interfaces/     # TypeScript type definitions
├── proto/          # Protocol buffer types
├── common/         # Number conversion utilities
└── gamm/           # AMM pool utilities
```

### Key Exports

```typescript
// API Client
import { BitBadgesAPI } from 'bitbadges';

// Number Conversion
import { BigIntify, Stringify, Numberify } from 'bitbadges';

// Core Classes
import { Balance, UintRange, Transfer, CollectionApproval } from 'bitbadges';

// Address Utilities
import { convertToBitBadgesAddress, isAddressValid } from 'bitbadges';

// Transaction Messages
import { MsgTransferTokens, MsgCreateCollection } from 'bitbadges';
```

## Version Compatibility

| BitBadges Chain | SDK Version | Status |
|-----------------|-------------|--------|
| v25             | 0.30.x      | Current |
| v24             | 0.29.x      | Supported |
| v23             | 0.28.x      | Supported |
| v22             | 0.27.x      | Supported |
| v21             | 0.26.x      | Supported |
| v20             | 0.25.x      | Supported |
| v19             | 0.24.x      | Supported |
| v18             | 0.23.x      | Supported |
| v16             | 0.21.x      | Supported |
| v14-15          | 0.20.x      | Supported |
| v13             | 0.19.x      | Supported |
| v12             | 0.18.x      | Supported |

```bash
# Install specific version for your chain
npm install bitbadges@^0.30.0
```

## Troubleshooting

### "BigInt is not defined"
Ensure you're running Node.js 10.4+ or a modern browser. BigInt is required.

### Precision loss with large numbers
Always use `BigIntify` instead of `Numberify` for collection IDs and token IDs.

### Browser: "process is not defined"
This shouldn't occur - the SDK checks for `process` existence. If it does, ensure you're using the latest SDK version.

### API authentication errors
- Verify your API key at https://bitbadges.io/developer
- In browsers, pass `apiKey` explicitly (env vars don't work)
- For authenticated endpoints, use `api.setAccessToken(token)`

### Transaction failures
1. Always simulate first: `await api.simulateTx(payload)`
2. Verify account has sufficient balance for fees
3. Check sequence number is correct

## Additional Resources

- **Detailed Patterns & Examples**: See [AI_AGENT_GUIDE.md](./AI_AGENT_GUIDE.md) for comprehensive patterns
- **API Documentation**: https://docs.bitbadges.io/for-developers/bitbadges-api/api
- **GitHub**: https://github.com/bitbadges/bitbadgesjs
- **Broadcast Helper**: https://bitbadges.io/dev/broadcast

### Reference Implementations

- [BitBadges Frontend](https://github.com/BitBadges/bitbadges-frontend) - Next.js web app
- [BitBadges Indexer](https://github.com/BitBadges/bitbadges-indexer) - Express.js API

## License

See [LICENSE](./LICENSE) for details.
