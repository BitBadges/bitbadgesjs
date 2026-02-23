# BitBadges SDK

The official TypeScript SDK for BitBadges — the most feature-rich tokenization standard built on Cosmos SDK.

## Overview

The BitBadges SDK provides all the tools needed to interact with the BitBadges blockchain, API, and indexer. Build tokenization applications with 20+ compliance primitives, time-dependent balances, and full EVM compatibility — all without writing smart contracts.

```bash
npm install bitbadgesjs-sdk
```

## Key Features

- **Transaction Building** — Create and broadcast transactions to the BitBadges blockchain
- **API Integration** — Query collections, balances, approvals, and user data
- **Type Safety** — Full TypeScript support with comprehensive type definitions
- **Balance Management** — Handle complex balance operations with time-dependent ownership
- **Approval Logic** — Work with multi-tiered approval systems (collection, sender, recipient)
- **Address Handling** — Support for Cosmos, Ethereum, Bitcoin, and Solana addresses
- **Metadata Management** — Fetch and manage on-chain and off-chain metadata

## Quick Start

```typescript
import { BitBadgesAPI } from 'bitbadgesjs-sdk';

// Initialize the API client
const api = new BitBadgesAPI({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.bitbadges.io'
});

// Fetch a collection
const collection = await api.getCollection({ collectionId: 1n });

// Check balances
const balances = await api.getBalances({
  collectionId: 1n,
  address: 'cosmos1...'
});
```

## Documentation

- **Full SDK Documentation**: [docs.bitbadges.io](https://docs.bitbadges.io)
- **API Reference**: [full-documentation.md](full-documentation.md)
- **Broadcasting Transactions**: [Create and Broadcast Txs](https://docs.bitbadges.io/for-developers/bitbadges-blockchain/create-and-broadcast-txs)

## Reference Implementations

These repositories use the SDK and serve as reference implementations:

- [BitBadges Frontend](https://github.com/BitBadges/bitbadges-frontend) — Official web application
- [BitBadges Indexer / API](https://github.com/BitBadges/bitbadges-indexer) — Indexer and API service

## Core Concepts

### Collections & Tokens

Collections are the top-level entity containing tokens with shared configuration:
- Manager controls and permissions
- Collection-wide approval rules
- Metadata and supply settings

### Multi-Tiered Approvals

Every transfer must satisfy three levels of approval:
1. **Collection-level** — Issuer-defined rules (compliance, KYC, restrictions)
2. **Sender-level** — Outgoing transfer approvals (listings, delegations)
3. **Recipient-level** — Incoming transfer approvals (bids, subscriptions)

### Time-Dependent Balances

Balances include ownership time ranges — enabling native vesting, auto-expiring subscriptions, and time-locked ownership without future transactions.

```typescript
interface Balance {
  amount: bigint;
  tokenIds: UintRange[];      // Which tokens
  ownershipTimes: UintRange[]; // When owned (UNIX ms)
}
```

## Broadcasting Transactions

```typescript
import { generatePostBodyBroadcast, generateEndpointBroadcast } from 'bitbadgesjs-sdk';

const postOptions = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: generatePostBodyBroadcast(signedTx),
};

const response = await fetch(
  `${nodeUrl}${generateEndpointBroadcast()}`,
  postOptions
);
```

For most use cases, consider using the helper broadcast tool at [bitbadges.io/dev/broadcast](https://bitbadges.io/dev/broadcast).

## Links

- **Documentation**: [docs.bitbadges.io](https://docs.bitbadges.io)
- **Website**: [bitbadges.io](https://bitbadges.io)
- **GitHub**: [github.com/bitbadges/bitbadgesjs](https://github.com/bitbadges/bitbadgesjs)
- **npm**: [npmjs.com/package/bitbadgesjs-sdk](https://www.npmjs.com/package/bitbadgesjs-sdk)

## Contact

For questions or support: **trevor@bitbadges.io**

## License

MIT License - see LICENSE file for details.
