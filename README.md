# bitbadgesjs

The BitBadges SDK is a JavaScript library that provides all the tools and functions needed for you to interact with the BitBadges API, blockchain, indexer, or build your own frontend.


There are currently four libraries that make up the SDK (address-converter, proto, provider, utils) that can be installed via:
```bash
npm install bitbadgesjs-address-converter
npm install bitbadgesjs-provider
npm install bitbadgesjs-utils
npm install bitbadgesjs-proto
```

bitbadgesjs-utils is a library which provides miscellaneous functionality to help you interact with the BitBadges API and indexer, such as types, managing metadata requests, logic with Uint ranges and balances, etc.
```ts
const doOverlap = checkIfUintRangesOverlap(...);
const metadata = updateMetadataMap(....);
```

address-converter allows you to switch between equivalent addresses
```ts
const cosmosAddress = ethToCosmos(address);
const ethAddress = cosmosToEth(cosmosAddress);
```


proto exports all the types and functions needed for interacting with the BitBadges blockchain, such as transactions, messages, and queries. provider exports functions for broadcasting transactions and interacting with a blockchain node.

bitbadges-proto and bitbadges-provider are typically used together. See Broadcasting Txs on the official documentation for more info and tutorials.

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

## Example

See https://docs.bitbadges.io for more documentation (specifically the developer documentation -> Broadcasting and Signing Txs section).


### Get account information

Get the account number, sequence and pubkey from an address.
NOTE: if the address had not sent any transaction to the blockchain, the pubkey value are going to be empty.

```ts
import { ethToCosmos } from 'bitbadgesjs-address-converter'
import { generateEndpointAccount } from 'bitbadgesjs-provider'

const sender = 'cosmos1...'
let destination = '0x....'
// The address must be bech32 encoded
if (destination.split('0x').length == 2) {
  destination = ethToCosmos(destination)
}

// Query the node
const options = {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
}

let addrRawData = await fetch(
  `http://127.0.0.1:1317${generateEndpointAccount(sender)}`, //TODO: replace with your node's address
  options,
)
// NOTE: the node returns status code 400 if the wallet doesn't exist, catch that error

let addrData = await addRawData.json()

// Response format at bitbadgesjs-provider/rest/account/AccountResponse
/*
  account: {
    '@type': string
    base_account: {
      address: string
      pub_key?: {
        '@type': string
        key: string
      }
      account_number: string
      sequence: string
    }
    code_hash: string
  }
*/
```

### Create a MsgSend Transaction

The transaction can be signed using EIP712 on Metamask and SignDirect on Keplr.

```ts
import { createMessageSend } from 'bitbadgesjs-transactions'

//See BitBadges developer documentation -> Chain Details for the latest up to date IDs for testnet, betanet, and mainnet.
const chain = {
  chainId: 2,
  cosmosChainId: 'bitbadges_1-2',
}

const sender = {
  accountAddress: 'cosmos....',
  sequence: 1,
  accountNumber: 9,
  pubkey: 'AgTw+4v0daIrxsNSW4FcQ+IoingPseFwHO1DnssyoOqZ',
}

const fee = {
  amount: '20',
  denom: 'badge',
  gas: '200000',
}

const memo = ''

const params = {
  destinationAddress: 'cosmos1pmk2r32ssqwps42y3c9d4clqlca403yd9wymgr',
  amount: '1',
  denom: 'badge',
}

const msg = createMessageSend(chain, sender, fee, memo, params)

// msg.signDirect is the transaction in Keplr format
// msg.legacyAmino is the transaction with legacy amino
// msg.eipToSign is the EIP712 data to sign with metamask
```

### Signing with Metamask

After creating the transaction as above, we need to send the payload to metamask so it can be signed. With that signature we are going to add a Web3Extension to the Cosmos Transactions and broadcast it to the Cosmos node.

```ts
// Follow the previous step to generate the msg object
import { cosmosToEth } from 'bitbadgesjs-address-converter'
import {
  generateEndpointBroadcast,
  generatePostBodyBroadcast,
} from 'bitbadgesjs-provider'
import {
  createTxRawEIP712,
  signatureToWeb3Extension,
} from 'bitbadgesjs-proto'

// Init Metamask
await window.ethereum.enable()

// Request the signature
let signature = await window.ethereum.request({
  method: 'eth_signTypedData_v4',
  params: [cosmosToEth(sender.accountAddress), JSON.stringify(msg.eipToSign)],
})

// The chain and sender objects are the same as the previous example
let extension = signatureToWeb3Extension(chain, sender, signature)

// Create the txRaw
let rawTx = createTxRawEIP712(
  msg.legacyAmino.body,
  msg.legacyAmino.authInfo,
  extension,
)

// Broadcast it
const postOptions = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: generatePostBodyBroadcast(rawTx),
}

let broadcastPost = await fetch(
  `http://localhost:1317${generateEndpointBroadcast()}`, //TODO: replace with your node's address
  postOptions,
)
let response = await broadcastPost.json()
```

### Signing with Keplr

```ts
// Follow the previous step to generate the msg object
import { createTxRaw } from 'bitbadgesjs-proto'
import {
  generateEndpointBroadcast,
  generatePostBodyBroadcast,
} from 'bitbadgesjs-provider'

let sign = await window?.keplr?.signDirect(
  chain.cosmosChainId,
  sender.accountAddress,
  {
    bodyBytes: msg.signDirect.body.serializeBinary(),
    authInfoBytes: msg.signDirect.authInfo.serializeBinary(),
    chainId: chain.cosmosChainId,
    accountNumber: new Long(sender.accountNumber),
  },
  // @ts-expect-error the types are not updated on Keplr side
  { isEthereum: true },
)

if (sign !== undefined) {
  let rawTx = createTxRaw(sign.signed.bodyBytes, sign.signed.authInfoBytes, [
    new Uint8Array(Buffer.from(sign.signature.signature, 'base64')),
  ])

  // Broadcast it
  const postOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: generatePostBodyBroadcast(rawTx),
  }

  let broadcastPost = await fetch(
    `http://localhost:1317${generateEndpointBroadcast()}`, //TODO: replace with your node's address
    postOptions,
  )
  let response = await broadcastPost.json()
}
```

## Acknowledgements
This project was forked from [evmosjs](https://github.com/evmos/evmosjs) and adapted for the BitBadges blockchain.
We would like to thank the Evmos team for their work and for making this project possible.

## Other Examples
Because this was forked from evmosjs, please feel free to refer to their examples in their repository.
Note you will have to change everything to the BitBadges equivalent (e.g. evmosjs -> bitbadgesjs, evmos -> bitbadges, aevmos -> badge, new chain details, etc).
