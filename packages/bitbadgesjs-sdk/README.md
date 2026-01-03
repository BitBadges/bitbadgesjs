# Overview

The BitBadges SDK is a bundle of TypeScript libraries that provide all the tools and functions needed for you to build your own frontend or interact with the BitBadges API, blockchain, and indexer.

GitHub: [https://github.com/bitbadges/bitbadgesjs](https://github.com/bitbadges/bitbadgesjs)

Reference repositories that use the SDK:

- [BitBadges Frontend](https://github.com/BitBadges/bitbadges-frontend)
- [BitBadges Indexer / API](https://github.com/BitBadges/bitbadges-indexer)

See [full documentation](full-documentation.md) for complete documentation on each library. Also, the BitBadges official indexer source code and BitBadges official frontend code both use the SDK, so please feel free to reference them.

## Version Compatibility

This SDK is designed to be compatible with specific BitBadges chain versions. Use the following mapping to ensure compatibility:

| BitBadges Chain Version | SDK Version Range | Status     |
| ----------------------- | ----------------- | ---------- |
| v12                     | 0.18.x            | ✅ Current |
| v13                     | 0.19.x            | ✅ Current |
| v14                     | 0.20.x            | ✅ Current |
| v15                     | 0.20.x            | ✅ Current |
| v16                     | 0.21.x            | ✅ Current |
| v18                     | 0.23.x            | ✅ Current |
| v19                     | 0.24.x            | ✅ Current |
| v20                     | 0.25.x            | ✅ Current |
| v21                     | 0.26.x            | ✅ Current |
| v22                     | 0.27.x            | ✅ Current |

**Recommendation:** Always use the latest patch version within your compatible major.minor version range. For example, if you're using BitBadges v12, use the latest `0.18.x` version.

> 📖 **For detailed version information, see [VERSION_COMPATIBILITY.md](./VERSION_COMPATIBILITY.md)**

### Installation

```bash
# For specific version
npm install bitbadgesjs-sdk@^0.19.0

# For latest version
npm install bitbadgesjs-sdk
```

This library provides miscellaneous functionality to help you interact with BitBadges, such as types, API routes, managing metadata requests, logic with ID ranges and balances, etc.

```typescript
const bitbadgesAddress = convertToBitBadgesAddress(address);
const ethAddress = bitbadgesToEth(bitbadgesAddress);
```

It also exports functions for broadcasting transactions and interacting with the blockchain. See [Broadcasting Txs](../create-and-broadcast-txs/) for how to use.

```typescript
// Find a node URL from a network endpoint:
// https://docs.evmos.org/develop/api/networks.
const nodeUrl = ...

const postOptions = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: generatePostBodyBroadcast(signedTx),
}

const broadcastEndpoint = `${nodeUrl}${generateEndpointBroadcast()}`
const broadcastPost = await fetch(
  broadcastEndpoint,
  postOptions,
)

const response = await broadcastPost.json()
```

For most use cases, you will not need to broadcast transactions. If you do, consider first exploring the helper broadcast tool at [https://bitbadges.io/dev/broadcast](https://bitbadges.io/dev/broadcast).
