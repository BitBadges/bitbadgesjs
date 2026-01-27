# BitBadges SDK - AI Agent Guide

This guide provides comprehensive information for AI agents working with the BitBadges TypeScript SDK. It covers high-level architecture, common patterns, and practical examples.

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Core Concepts](#core-concepts)
4. [API Client Usage](#api-client-usage)
5. [Transaction Building](#transaction-building)
6. [Address Conversion](#address-conversion)
7. [Module Structure](#module-structure)
8. [Common Patterns](#common-patterns)
9. [Best Practices](#best-practices)

---

## Overview

The BitBadges SDK (`bitbadgesjs-sdk`) is a TypeScript library that provides tools for interacting with the BitBadges blockchain, API, and indexer. It's designed to work with multiple BitBadges chain versions and provides type-safe interfaces for all operations.

### Key Features

- **Type-safe API client** for interacting with the BitBadges indexer/API
- **Transaction building** for creating and broadcasting blockchain transactions
- **Address utilities** for working with BitBadges addresses (Cosmos-based, bb-prefixed)
- **Core utilities** for badges, balances, approvals, permissions, and more
- **Protocol buffer support** for blockchain message types
- **Number type flexibility** supporting `bigint`, `number`, and `string`

### Version Compatibility

The SDK is versioned to match BitBadges chain versions:

| BitBadges Chain Version | SDK Version Range |
| ----------------------- | ----------------- |
| v12                     | 0.18.x            |
| v13                     | 0.19.x            |
| v14                     | 0.20.x            |
| v15                     | 0.20.x            |
| v16                     | 0.21.x            |
| v18                     | 0.23.x            |
| v19                     | 0.24.x            |
| v20                     | 0.25.x            |
| v21                     | 0.26.x            |
| v22                     | 0.27.x            |
| v23                     | 0.28.x            |

**Current SDK Version**: 0.28.0 (compatible with BitBadges v23)

---

## Installation & Setup

### Installation

```bash
# Using npm
npm install bitbadgesjs-sdk@^0.28.0

# Using bun (recommended for this repository)
bun add bitbadgesjs-sdk@^0.28.0
```

### Basic Import

```typescript
import {
  BitBadgesAPI,
  BigIntify,
  Stringify,
  Numberify,
  convertToBitBadgesAddress,
  MsgTransferTokens
  // ... other exports
} from 'bitbadgesjs-sdk';
```

### Main Entry Points

The SDK exports from several main modules:

```typescript
// Core functionality
export * from './core/index.js';

// API client and indexer
export * from './api-indexer/index.js';

// Common utilities
export * from './common/index.js';

// Type interfaces
export * from './interfaces/index.js';

// Protocol buffers
export * as proto from './proto/index.js';

// Transaction building
export * from './transactions/index.js';

// Address conversion
export * from './address-converter/index.js';

// Node REST API utilities
export * from './node-rest-api/index.js';

// GAMM (Cosmos pool) utilities
export * from './gamm/index.js';
```

---

## Core Concepts

### NumberType System

The SDK uses a flexible `NumberType` system that supports `bigint`, `number`, and `string`. This allows you to work with large numbers safely (JavaScript's `number` type has precision issues with large integers).

```typescript
type NumberType = bigint | number | string;
```

#### Conversion Functions

```typescript
import { BigIntify, Stringify, Numberify } from 'bitbadgesjs-sdk';

// Convert to bigint (recommended for large numbers)
const collectionId = BigIntify('12345678901234567890'); // bigint

// Convert to string (for JSON serialization)
const collectionIdStr = Stringify(12345678901234567890n); // string

// Convert to number (only safe for numbers < Number.MAX_SAFE_INTEGER)
const collectionIdNum = Numberify('1000'); // number
```

**Important**: Always use `BigIntify` when working with collection IDs, token IDs, or any large numbers to avoid precision loss.

### Type System: Interfaces, Classes, and Protocol Buffers

The SDK uses three distinct type systems that serve different purposes. Understanding the differences is crucial for working with the SDK effectively.

#### 1. Interface Types (`iType`)

**Purpose**: Plain TypeScript interfaces that define the shape of data structures.

**Characteristics**:

- Pure type definitions (no runtime code)
- Used for type checking and function parameters
- Cannot be instantiated
- All numbers use `NumberType` (flexible: `bigint | number | string`)

**Example**:

```typescript
import type { iBalance, iUintRange } from 'bitbadgesjs-sdk';

// This is just a type - cannot be instantiated
const balanceData: iBalance<bigint> = {
  amount: 100n,
  tokenIds: [{ start: 1n, end: 10n }],
  ownershipTimes: [{ start: 1n, end: 1000n }]
};

// ❌ Cannot do: new iBalance(...) - interfaces cannot be instantiated
```

**When to use**:

- Type annotations for function parameters
- Type definitions for plain objects
- When you just need type checking

#### 2. Class Types (`TypeClass`)

**Purpose**: Runtime classes with methods for manipulation, conversion, and serialization.

**Characteristics**:

- Extend `BaseNumberTypeClass`
- Can be instantiated with `new`
- Have utility methods: `toProto()`, `fromProto()`, `convert()`, `clone()`
- Support flexible `NumberType` conversions
- Used for most SDK operations

**Example**:

```typescript
import { Balance, UintRange } from 'bitbadgesjs-sdk';

// Create an instance
const balance = new Balance({
  amount: 100n,
  tokenIds: [{ start: 1n, end: 10n }],
  ownershipTimes: [{ start: 1n, end: 1000n }]
});

// Convert number types
const stringBalance = balance.convert(Stringify); // Convert to string numbers

// Convert to protocol buffer format
const protoBalance = balance.toProto();

// Clone
const cloned = balance.clone();
```

**When to use**:

- Creating new instances of data structures
- When you need utility methods (conversion, cloning, etc.)
- Most common use case in the SDK

#### 3. Protocol Buffer Types (`proto.badges.*`)

**Purpose**: Auto-generated classes from `.proto` files used for blockchain serialization.

**Characteristics**:

- Generated from Protocol Buffer definitions
- All numbers are **strings** (not `NumberType`)
- Methods: `fromBinary()`, `fromJson()`, `toBinary()`, `toJson()`
- Used for blockchain transaction serialization
- Required format for broadcasting transactions

**Example**:

```typescript
import * as protobadges from 'bitbadgesjs-sdk/proto/badges';

// Protocol buffer types use strings for numbers
const protoBalance = new protobadges.Balance({
  amount: '100', // String, not number!
  tokenIds: [new protobadges.UintRange({ start: '1', end: '10' })],
  ownershipTimes: [new protobadges.UintRange({ start: '1', end: '1000' })]
});

// Serialize to binary for blockchain
const binary = protoBalance.toBinary();

// Serialize to JSON
const json = protoBalance.toJson();
```

**When to use**:

- Converting to/from blockchain format
- Serializing transactions for broadcasting
- Working with binary data
- Interfacing with the blockchain directly

#### Conversion Between Types

The SDK provides conversion methods between these type systems:

```typescript
import { Balance } from 'bitbadgesjs-sdk';
import * as protobadges from 'bitbadgesjs-sdk/proto/badges';
import { Stringify } from 'bitbadgesjs-sdk';

// 1. Interface → Class
const balanceData: iBalance<bigint> = {
  /* ... */
};
const balance = new Balance(balanceData);

// 2. Class → Protocol Buffer
const protoBalance = balance.toProto(); // Automatically converts to strings

// 3. Protocol Buffer → Class
const balanceFromProto = Balance.fromProto(
  protoBalance,
  BigIntify // Convert function for numbers
);

// 4. Class → Different NumberType
const stringBalance = balance.convert(Stringify); // bigint → string
const bigintBalance = stringBalance.convert(BigIntify); // string → bigint
```

#### Key Differences Summary

| Feature           | Interface (`iType`)     | Class (`TypeClass`)            | Protocol Buffer (`proto.*`)      |
| ----------------- | ----------------------- | ------------------------------ | -------------------------------- |
| **Instantiation** | ❌ No                   | ✅ Yes (`new Type()`)          | ✅ Yes (`new proto.Type()`)      |
| **Number Types**  | `NumberType` (flexible) | `NumberType` (flexible)        | `string` only                    |
| **Methods**       | None                    | `toProto()`, `convert()`, etc. | `toBinary()`, `fromJson()`, etc. |
| **Use Case**      | Type definitions        | SDK operations                 | Blockchain serialization         |
| **Runtime Code**  | None                    | Yes                            | Yes (generated)                  |

#### Best Practices

1. **Use Classes for most operations**: Classes provide the most functionality and are the primary API

   ```typescript
   // ✅ Preferred
   const balance = new Balance({ amount: 100n, ... });

   // ❌ Avoid (unless just for typing)
   const balance: iBalance<bigint> = { amount: 100n, ... };
   ```

2. **Use Interfaces for type annotations**: When you just need type checking

   ```typescript
   // ✅ Good for function parameters
   function processBalance(balance: iBalance<bigint>) { ... }
   ```

3. **Convert to Protocol Buffers only when needed**: Usually just before broadcasting

   ```typescript
   // ✅ Convert at the last moment
   const protoMsg = transferMsg.toProto();
   await api.broadcastTx(protoMsg);
   ```

4. **Always use `toProto()` for blockchain operations**: Never manually create protocol buffer objects

   ```typescript
   // ✅ Correct
   const proto = balance.toProto();

   // ❌ Wrong - don't manually create proto objects
   const proto = new protobadges.Balance({ amount: "100", ... });
   ```

### API Client Initialization

The `BitBadgesAPI` class requires a `convertFunction` to specify how numbers should be converted in API responses:

```typescript
import { BitBadgesAPI, BigIntify } from 'bitbadgesjs-sdk';

// Initialize with BigInt conversion (recommended)
const api = new BitBadgesAPI({
  convertFunction: BigIntify,
  apiKey: 'your-api-key-here', // Optional, can also use env var BITBADGES_API_KEY
  apiUrl: 'https://api.bitbadges.io' // Optional, defaults to production API
});

// Initialize with string conversion (for JSON serialization)
import { Stringify } from 'bitbadgesjs-sdk';
const apiString = new BitBadgesAPI({
  convertFunction: Stringify,
  apiKey: 'your-api-key'
});
```

---

## API Client Usage

### Basic API Calls

#### Fetching Collections

```typescript
import { BitBadgesAPI, BigIntify } from 'bitbadgesjs-sdk';

const api = new BitBadgesAPI({
  convertFunction: BigIntify,
  apiKey: 'your-api-key'
});

// Fetch a single collection
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

console.log(response.collections[0].collection);
```

#### Fetching User Balances

```typescript
// Get balance for a specific address
const balanceResponse = await api.getBalanceByAddress(
  '1', // collectionId
  'bb1abc...', // address
  {
    // Optional payload
    fetchPrivateParams: false,
    forceful: false
  }
);

// Response is a single BalanceDocWithDetails object
console.log('Amount:', balanceResponse.amount);
console.log('Badge IDs:', balanceResponse.badgeIds);
console.log('Ownership Times:', balanceResponse.ownershipTimes);
```

#### Fetching Token Activity

```typescript
const activityResponse = await api.getTokenActivity(
  '1', // collectionId
  '1', // tokenId
  {
    bookmark: '', // Pagination bookmark, empty string for first request
    bitbadgesAddress: undefined // Optional: filter by address
  }
);

console.log(activityResponse.activity);
console.log('Has more:', activityResponse.pagination.hasMore);
console.log('Next bookmark:', activityResponse.pagination.bookmark);
```

### Authentication

For authenticated endpoints, set an access token:

```typescript
// Set access token for authenticated requests
api.setAccessToken('your-access-token');

// Make authenticated request
const accountInfo = await api.getAccount({
  address: 'bb1abc...'
});

// Clear access token
api.unsetAccessToken();
```

### Error Handling

All API methods return promises that reject with an `ErrorResponse` on failure:

```typescript
try {
  const response = await api.getCollections({
    collectionsToFetch: [{ collectionId: '1' }]
  });
} catch (error) {
  if (error.errorMessage) {
    // User-friendly error message
    console.error('API Error:', error.errorMessage);
  }
  if (error.unauthorized) {
    // Authentication error
    console.error('Not authenticated');
  }
  if (error.error) {
    // Technical error details for debugging
    console.error('Technical error:', error.error);
  }
}
```

### Pagination

Pagination works differently depending on the endpoint:

#### View-based Pagination (for Collections)

Collections use views for pagination. Each view (like `transferActivity`, `owners`, etc.) has its own bookmark:

```typescript
// First request - fetch collection with a view
let bookmark = ''; // Empty string for first request
let hasMore = true;

while (hasMore) {
  const response = await api.getCollections({
    collectionsToFetch: [
      {
        collectionId: '1',
        viewsToFetch: [
          {
            viewType: 'transferActivity', // or 'owners', 'amountTrackers', etc.
            viewId: 'my-view-id', // Unique ID for this view
            bookmark: bookmark // Pagination bookmark
          }
        ]
      }
    ]
  });

  const collection = response.collections[0]?.collection;
  if (collection) {
    // Access the view data
    const view = collection.views['my-view-id'];
    if (view) {
      console.log('Activity IDs:', view.ids);
      hasMore = view.pagination.hasMore;
      bookmark = view.pagination.bookmark;
    }
  }
}
```

#### Direct Pagination (for other endpoints)

Other endpoints like `getTokenActivity` and `getOwners` use direct bookmark pagination:

```typescript
let bookmark: string | undefined = '';
let hasMore = true;

while (hasMore) {
  const response = await api.getTokenActivity(
    '1', // collectionId
    '1', // tokenId
    { bookmark: bookmark || '' }
  );

  // Process activity
  for (const activity of response.activity) {
    console.log(activity);
  }

  // Check pagination
  hasMore = response.pagination.hasMore;
  bookmark = response.pagination.bookmark;
}
```

---

## Transaction Building

### Creating Transaction Messages

#### Transfer Tokens

```typescript
import { MsgTransferTokens, Transfer, Balance, PrecalculateBalancesFromApprovalDetails } from 'bitbadgesjs-sdk';

// Create a transfer message
const transferMsg = new MsgTransferTokens({
  creator: 'bb1abc...', // Sender address
  collectionId: '1',
  transfers: [
    new Transfer({
      from: 'bb1abc...',
      toAddresses: ['bb1def...'], // Note: toAddresses is an array
      balances: [
        new Balance({
          amount: '100',
          badgeIds: [{ start: 1n, end: 10n }],
          ownershipTimes: [{ start: 1n, end: 1000n }]
        })
      ],
      memo: 'Transfer 10 badges',
      // Optional: Precalculate balances from an approval
      precalculateBalancesFromApproval: new PrecalculateBalancesFromApprovalDetails({
        approvalId: 'approval-id',
        approvalLevel: 'collection', // or 'incoming', 'outgoing'
        approverAddress: '', // Empty string for collection-level approvals
        version: 1n,
        // Optional precalculation options
        precalculationOptions: {
          overrideTimestamp: undefined, // Optional timestamp override
          tokenIdsOverride: undefined // Optional token IDs override
        }
      })
    })
  ]
});

// Convert to protocol buffer format
const protoMsg = transferMsg.toProto();
```

#### Create Collection

```typescript
import { MsgCreateCollection } from 'bitbadgesjs-sdk';

const createMsg = new MsgCreateCollection({
  creator: 'bb1abc...',
  collectionId: '1'
  // ... other collection properties
});
```

### Building Transaction Context

To broadcast a transaction, you need to create a transaction context and sign it:

```typescript
import { createTxBroadcastBody, TxContext } from 'bitbadgesjs-sdk';

// Create transaction context
const txContext: TxContext = {
  testnet: false, // Use mainnet by default
  sender: {
    address: 'bb1abc...', // Must be a BitBadges address (bb-prefixed)
    accountNumber: 0,
    sequence: 0,
    publicKey: 'base64-encoded-public-key' // Required for Cosmos signatures
  },
  fee: {
    amount: '1000',
    denom: 'badge',
    gas: '200000'
  },
  memo: 'My transaction memo'
};

// Create broadcast body (requires signature)
// Note: You need to sign the transaction first
const broadcastBody = createTxBroadcastBody(txContext, transferMsg.toProto(), 'hex-encoded-signature');
```

### Broadcasting Transactions

#### Using the API Client

```typescript
// Build and sign your transaction
const signedTx = /* ... your signed transaction ... */;

// Broadcast via API
const broadcastResponse = await api.broadcastTx(signedTx);

console.log('Transaction hash:', broadcastResponse.txHash);
```

#### Simulating Transactions

Always simulate before broadcasting to check gas usage and errors:

```typescript
const simulateResponse = await api.simulateTx({
  // Transaction payload (without signature)
  txBytes: 'base64-encoded-transaction'
});

console.log('Gas used:', simulateResponse.gasUsed);
console.log('Simulation successful:', !simulateResponse.error);
```

### Transaction Signing

The SDK provides utilities for creating sign documents, but actual signing must be done with a wallet or signing library:

```typescript
import { createTransactionPayload } from 'bitbadgesjs-sdk';

// Create transaction payload
const payload = createTransactionPayload(txContext, [transferMsg.toProto()]);

// Sign the payload with your private key/wallet
// This step depends on your signing method (Keplr, Cosmos wallet, etc.)
const signature = await signTransaction(payload);

// Create broadcast body
const broadcastBody = createTxBroadcastBody(txContext, [transferMsg.toProto()], signature);
```

---

## Address Conversion

The SDK provides utilities for working with BitBadges addresses (Cosmos-based, `bb`-prefixed addresses).

### Converting to BitBadges Address

```typescript
import { convertToBitBadgesAddress } from 'bitbadgesjs-sdk';

// Only accepts addresses that already start with 'bb' or 'bbvaloper'
const bitbadgesAddress = convertToBitBadgesAddress('bb1abc...');
// Result: 'bb1abc...' (if valid) or '' (if invalid)

// For validator addresses
const validatorAddress = convertToBitBadgesAddress('bbvaloper1abc...');
// Result: 'bbvaloper1abc...'
```

### Address Validation

```typescript
import { isAddressValid } from 'bitbadgesjs-sdk';

const isValid = isAddressValid('bb1abc...');
console.log('Address valid:', isValid);
```

### Supported Chains

The SDK only supports Cosmos-based BitBadges addresses:

- BitBadges (bb-prefixed addresses)

---

## Module Structure

### Core Module (`core/`)

Provides core data structures and utilities:

- **Balances**: `Balance`, `BalanceArray` - Token balance representations
- **Ranges**: `UintRange`, `UintRangeArray` - ID range utilities
- **Address Lists**: `AddressList` - For approval criteria
- **Approvals**: `CollectionApproval`, `UserIncomingApproval`, etc.
- **Permissions**: `CollectionPermissions`, `UserPermissions`
- **Metadata**: `CollectionMetadata`, `TokenMetadata`
- **Transfers**: `Transfer` - Transfer operation structures

```typescript
import { Balance, UintRange, AddressList, CollectionApproval } from 'bitbadgesjs-sdk';

// Create a balance
const balance = new Balance({
  amount: '100',
  tokenIds: [{ start: 1n, end: 10n }],
  ownershipTimes: [{ start: 1n, end: 1000n }]
});

// Create an ID range
const range = new UintRange({ start: 1n, end: 100n });
```

### API Indexer Module (`api-indexer/`)

Provides typed API client and response classes:

- **BitBadgesAPI**: Main API client class
- **BitBadgesCollection**: Collection data structures
- **BitBadgesUserInfo**: User account information
- **Request/Response Types**: Typed interfaces for all API endpoints

### Transactions Module (`transactions/`)

Transaction building and broadcasting:

- **Message Classes**: `MsgTransferTokens`, `MsgCreateCollection`, etc.
- **Transaction Utilities**: `createTxBroadcastBody`, `createTransactionPayload`
- **Signing**: Sign document creation utilities

### Interfaces Module (`interfaces/`)

TypeScript interfaces for all BitBadges data structures:

- Core interfaces: `iBalance`, `iUintRange`, etc.
- Badge interfaces: `iCollectionApproval`, `iUserIncomingApproval`, etc.
- Type definitions: `CollectionId`, `BitBadgesAddress`, etc.

### Proto Module (`proto/`)

Protocol buffer definitions and generated TypeScript classes:

```typescript
import * as badges from 'bitbadgesjs-sdk/proto/badges';

// Use protocol buffer message types
const protoMsg = new badges.MsgTransferTokens({
  creator: 'bb1abc...'
  // ...
});
```

---

## Common Patterns

### Pattern 1: Fetch and Display Collection

```typescript
import { BitBadgesAPI, BigIntify } from 'bitbadgesjs-sdk';

const api = new BitBadgesAPI({
  convertFunction: BigIntify,
  apiKey: process.env.BITBADGES_API_KEY
});

async function displayCollection(collectionId: string) {
  const response = await api.getCollections({
    collectionsToFetch: [
      {
        collectionId,
        metadataToFetch: {
          tokenIds: [{ start: 1n, end: 1000n }] // Fetch metadata for tokens 1-1000
        }
      }
    ]
  });

  const collection = response.collections[0]?.collection;
  if (!collection) {
    console.log('Collection not found');
    return;
  }

  console.log('Collection Name:', collection.metadata?.name);
  console.log('Total Badges:', collection.badges.length);
  console.log('Collection ID:', collection.collectionId);
}
```

### Pattern 2: Check User Balance

```typescript
async function checkUserBalance(address: string, collectionId: string) {
  const response = await api.getBalanceByAddress(collectionId, address, {
    fetchPrivateParams: false,
    forceful: false
  });

  // getBalanceByAddress returns a single BalanceDocWithDetails object
  // Access balance properties directly
  console.log(`Token IDs: ${response.badgeIds.map((r) => `${r.start}-${r.end}`).join(', ')}`);
  console.log(`Amount: ${response.amount}`);
  console.log(`Ownership Times: ${response.ownershipTimes.map((r) => `${r.start}-${r.end}`).join(', ')}`);
}
```

### Pattern 3: Create and Broadcast Transfer

```typescript
import {
  MsgTransferTokens,
  Transfer,
  Balance,
  createTxBroadcastBody,
  BitBadgesAPI,
  BigIntify,
  PrecalculateBalancesFromApprovalDetails
} from 'bitbadgesjs-sdk';

async function transferBadges(from: string, to: string, collectionId: string, tokenIds: { start: bigint; end: bigint }[], amount: string) {
  const api = new BitBadgesAPI({
    convertFunction: BigIntify,
    apiKey: process.env.BITBADGES_API_KEY
  });

  // Create transfer message
  const transferMsg = new MsgTransferTokens({
    creator: from,
    collectionId,
    transfers: [
      new Transfer({
        from,
        toAddresses: [to], // Note: toAddresses is an array
        balances: [
          new Balance({
            amount,
            badgeIds: tokenIds,
            ownershipTimes: [{ start: 1n, end: 1000n }] // Adjust as needed
          })
        ],
        memo: `Transfer ${amount} badges`
        // Optional: Only include if you need to precalculate from an approval
        // precalculateBalancesFromApproval: new PrecalculateBalancesFromApprovalDetails({...})
      })
    ]
  });

  // Build transaction context (you need to fetch account info first)
  const accountInfo = await api.getAccount({
    address: from
  });

  const txContext: TxContext = {
    testnet: false, // Use mainnet by default
    sender: {
      address: from, // Must be a BitBadges address (bb-prefixed)
      accountNumber: Number(accountInfo.account.accountNumber), // Convert to number
      sequence: accountInfo.account.sequence ? Number(accountInfo.account.sequence) : 0,
      publicKey: accountInfo.account.publicKey // Base64 encoded public key, required for Cosmos signatures
    },
    fee: {
      amount: '1000',
      denom: 'badge',
      gas: '200000'
    },
    memo: ''
  };

  // Sign transaction (implementation depends on your wallet)
  const signature = await signWithWallet(txContext, transferMsg);

  // Create broadcast body
  const broadcastBody = createTxBroadcastBody(txContext, transferMsg.toProto(), signature);

  // Broadcast
  const result = await api.broadcastTx(broadcastBody);
  console.log('Transaction hash:', result.txHash);
}
```

### Pattern 4: Paginated Data Fetching

```typescript
async function fetchAllTokenActivity(collectionId: string, tokenId: string) {
  const api = new BitBadgesAPI({
    convertFunction: BigIntify,
    apiKey: process.env.BITBADGES_API_KEY
  });

  const allActivity = [];
  let bookmark = '';
  let hasMore = true;

  while (hasMore) {
    const response = await api.getTokenActivity(collectionId, tokenId, { bookmark });

    allActivity.push(...response.activity);

    hasMore = response.pagination.hasMore;
    bookmark = response.pagination.bookmark;
  }

  return allActivity;
}

// Example: Fetching collection owners with pagination
async function fetchAllOwners(collectionId: string, tokenId: string) {
  const api = new BitBadgesAPI({
    convertFunction: BigIntify,
    apiKey: process.env.BITBADGES_API_KEY
  });

  const allOwners = [];
  let bookmark = '';
  let hasMore = true;

  while (hasMore) {
    const response = await api.getOwners(collectionId, tokenId, { bookmark, sortBy: 'amount' });

    allOwners.push(...response.owners);

    hasMore = response.pagination.hasMore;
    bookmark = response.pagination.bookmark;
  }

  return allOwners;
}
```

### Pattern 5: Working with Metadata

```typescript
import { Metadata } from 'bitbadgesjs-sdk';

async function fetchAndParseMetadata(uri: string) {
  // Fetch metadata from URI
  const response = await fetch(uri);
  const metadataJson = await response.json();

  // Parse with SDK Metadata class
  const metadata = new Metadata(metadataJson);

  return {
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    attributes: metadata.attributes
  };
}
```

---

## Best Practices

### 1. Always Use BigIntify for Large Numbers

```typescript
// ✅ Good
const api = new BitBadgesAPI({
  convertFunction: BigIntify
});

// ❌ Bad (precision loss with large numbers)
const api = new BitBadgesAPI({
  convertFunction: Numberify
});
```

### 2. Handle Errors Gracefully

```typescript
try {
  const response = await api.getCollections({
    /* ... */
  });
} catch (error) {
  if (error.errorMessage) {
    // Show user-friendly error
    showError(error.errorMessage);
  } else {
    // Log technical error
    console.error('Unexpected error:', error);
  }
}
```

### 3. Simulate Before Broadcasting

```typescript
// Always simulate first
const simulation = await api.simulateTx(txPayload);
if (simulation.error) {
  throw new Error(`Transaction will fail: ${simulation.error}`);
}

// Adjust gas if needed
if (simulation.gasUsed > expectedGas) {
  // Update transaction with higher gas limit
}

// Then broadcast
const result = await api.broadcastTx(signedTx);
```

### 4. Use TypeScript Types

The SDK is fully typed. Leverage TypeScript for type safety:

```typescript
import type { GetCollectionsSuccessResponse, CollectionDoc } from 'bitbadgesjs-sdk';

function processCollection(response: GetCollectionsSuccessResponse): CollectionDoc[] {
  return response.collections.map((c) => c.collection);
}
```

### 5. Cache API Responses When Appropriate

```typescript
const collectionCache = new Map<string, CollectionDoc>();

async function getCachedCollection(collectionId: string) {
  if (collectionCache.has(collectionId)) {
    return collectionCache.get(collectionId);
  }

  const response = await api.getCollections({
    collectionsToFetch: [{ collectionId }]
  });

  const collection = response.collections[0]?.collection;
  if (collection) {
    collectionCache.set(collectionId, collection);
  }

  return collection;
}
```

### 6. Use Environment Variables for Configuration

```typescript
const api = new BitBadgesAPI({
  convertFunction: BigIntify,
  apiKey: process.env.BITBADGES_API_KEY || '',
  apiUrl: process.env.BITBADGES_API_URL || 'https://api.bitbadges.io'
});
```

### 7. Batch Operations When Possible

```typescript
// ✅ Good: Fetch multiple collections in one request
const response = await api.getCollections({
  collectionsToFetch: [{ collectionId: '1' }, { collectionId: '2' }, { collectionId: '3' }]
});

// ❌ Bad: Multiple separate requests
const col1 = await api.getCollections({ collectionsToFetch: [{ collectionId: '1' }] });
const col2 = await api.getCollections({ collectionsToFetch: [{ collectionId: '2' }] });
const col3 = await api.getCollections({ collectionsToFetch: [{ collectionId: '3' }] });
```

---

## Additional Resources

### Official Documentation

- **SDK GitHub**: https://github.com/bitbadges/bitbadgesjs
- **API Documentation**: https://docs.bitbadges.io/for-developers/bitbadges-api/api
- **Reference Implementations**:
  - [BitBadges Frontend](https://github.com/BitBadges/bitbadges-frontend)
  - [BitBadges Indexer](https://github.com/BitBadges/bitbadges-indexer)

### Key Files to Reference

- **Main Entry**: `packages/bitbadgesjs-sdk/src/index.ts`
- **API Client**: `packages/bitbadgesjs-sdk/src/api-indexer/BitBadgesApi.ts`
- **Base API**: `packages/bitbadgesjs-sdk/src/api-indexer/base.ts`
- **Transaction Utils**: `packages/bitbadgesjs-sdk/src/transactions/messages/base.ts`
- **Address Converter**: `packages/bitbadgesjs-sdk/src/address-converter/converter.ts`

### Common Exports Reference

```typescript
// API Client
import { BitBadgesAPI, BaseBitBadgesApi } from 'bitbadgesjs-sdk';

// Number Conversion
import { BigIntify, Stringify, Numberify } from 'bitbadgesjs-sdk';

// Address Conversion
import { convertToBitBadgesAddress, isAddressValid } from 'bitbadgesjs-sdk';

// Core Classes
import { Balance, UintRange, AddressList, Transfer, CollectionApproval } from 'bitbadgesjs-sdk';

// Transaction Messages
import { MsgTransferTokens, MsgCreateCollection, MsgUpdateCollection } from 'bitbadgesjs-sdk';

// Transaction Utilities
import { createTxBroadcastBody, createTransactionPayload } from 'bitbadgesjs-sdk';

// Types
import type { NumberType, CollectionId, BitBadgesAddress } from 'bitbadgesjs-sdk';
```

---

## Troubleshooting

### Common Issues

1. **Precision Loss with Large Numbers**

   - Always use `BigIntify` instead of `Numberify`
   - Use `bigint` or `string` for collection IDs and token IDs

2. **Authentication Errors**

   - Ensure API key is set correctly
   - Check if endpoint requires authentication
   - Verify access token is set for authenticated endpoints

3. **Transaction Broadcasting Failures**

   - Always simulate first to catch errors
   - Verify account has sufficient balance for fees
   - Check sequence number is correct
   - Ensure transaction is properly signed

4. **Address Format Issues**
   - Only BitBadges addresses (bb-prefixed) are supported
   - Use `convertToBitBadgesAddress` to validate addresses
   - Validate addresses with `isAddressValid` before use

---

## Summary

The BitBadges SDK provides a comprehensive, type-safe interface for interacting with the BitBadges blockchain and API. Key takeaways:

1. **Use `BigIntify`** for number conversion to avoid precision issues
2. **Initialize API client** with appropriate conversion function and API key
3. **Leverage TypeScript types** for type safety
4. **Always simulate transactions** before broadcasting
5. **Handle errors gracefully** with proper error checking
6. **Use batch operations** when possible for efficiency

For specific implementation details, refer to the TypeScript documentation generated in the `docs/` directory or the official BitBadges documentation.
