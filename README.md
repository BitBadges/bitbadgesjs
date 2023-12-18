# bitbadgesjs

The BitBadges SDK is a JavaScript library that provides all the tools and functions needed for you to interact with the BitBadges API, blockchain, indexer, or build your own frontend.

There are currently two libraries that make up the SDK (proto, utils) that can be installed via:

```bash
npm install bitbadgesjs-utils
npm install bitbadgesjs-proto
```

bitbadgesjs-utils is a library which provides miscellaneous functionality to help you interact with the BitBadges API and indexer, such as types, managing metadata requests, logic with Uint ranges and balances, etc.

```ts
const doOverlap = checkIfUintRangesOverlap(...);
const metadata = updateMetadataMap(....);
```

It also allows you to switch between equivalent addresses

```ts
const cosmosAddress = ethToCosmos(address);
const ethAddress = cosmosToEth(cosmosAddress);
```

proto exports all the types and functions needed for interacting with the BitBadges blockchain, such as transactions, messages, and queries. provider exports functions for broadcasting transactions and interacting with a blockchain node.

See Broadcasting Txs on the official documentation for more info and tutorials.

```ts
const msg: MsgUpdateCollection = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    collectionUri: collectionUri,
    badgeUris: badgeUris
}
const txMsg = createTxMsgUpdateCollection(
    txDetails.chain,
    txDetails.sender,
    txDetails.fee,
    txDetails.memo,
    msg
)
```

### Generating, Broadcasting, and Signing Txs

We refer you to the official [documentation](https://docs.bitbadges.io/for-developers/create-and-broadcast-txs) for more details and tutorials on how to generate, broadcast, and sign transactions using this repository.

## Acknowledgements

This project was forked from [evmosjs](https://github.com/evmos/evmosjs) and adapted for the BitBadges blockchain.
We would like to thank the Evmos team for their work and for making this project possible.

## Other Examples

Because this was forked from evmosjs, please feel free to refer to their examples in their repository.
Note you will have to change everything to the BitBadges equivalent (e.g. evmosjs -> bitbadgesjs, evmos -> bitbadges, aevmos -> badge, new chain details, etc).
