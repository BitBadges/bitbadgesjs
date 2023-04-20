# bitbadgesjs

The BitBadges SDK is a JavaScript library that provides all the tools and functions needed for you to interact with the BitBadges API, blockchain, indexer, or build your own frontend.


There are currently five libraries that make up the SDK (address-converter, proto, provider, transactions, utils) that can be installed via:
```bash
npm install bitbadgesjs-address-converter
npm install bitbadgesjs-transactions
npm install bitbadgesjs-provider
npm install bitbadges-sdk
npm install bitbadgesjs-proto
```

bitbadgesjs-utils is a library which provides miscellaneous functionality to help you interact with the BitBadges API and indexer, such as types, managing metadata requests, logic with ID ranges and balances, etc.
```ts
const idRangesOverlap = checkIfIdRangesOverlap(balances[0].badgeIds);
const metadata = updateMetadataMap(metadata, currentMetadata, { start: badgeId, end: badgeId }, uri);
```

address-converter allows you to switch between equivalent addresses
```ts
const cosmosAddress = ethToCosmos(address);
const ethAddress = cosmosToEth(cosmosAddress);
```

transactions exports the functions to create blockchain transactions in the BitBadges Msg formats. See Broadcasting Txs for more info and tutorials.
```ts
const updateUrisMsg: MessageMsgUpdateUris = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    collectionUri: collectionUri,
    badgeUris: badgeUris
}
const txMsg = createTxMsgUpdateUris(
    txDetails.chain,
    txDetails.sender,
    txDetails.fee,
    txDetails.memo,
    msg
)
```

proto exports the Protocol Buffer types. You will typically not need this, unless you plan to interact with the blockchain at a more technical level. The transaction types from the proto library are used in the transactions library.

provider exports functions for broadcasting transactions and interacting with the blockchain. See below for how to use.

## Example

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
  `http://127.0.0.1:1317${generateEndpointAccount(sender)}`,
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

const chain = {
  chainId: 9000,
  cosmosChainId: 'bitbadges_1-1',
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

After creating the transaction we need to send the payload to metamask so it can be signed. With that signature we are going to add a Web3Extension to the Cosmos Transactions and broadcast it to the Cosmos node.

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
} from 'bitbadgesjs-transactions'

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
  `http://localhost:1317${generateEndpointBroadcast()}`,
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
    `http://localhost:1317${generateEndpointBroadcast()}`,
    postOptions,
  )
  let response = await broadcastPost.json()
}
```

## Acknowledgements
This project was forked from [EvmosJS](https://github.com/evmos/evmosjs) and adapted for the BitBadges blockchain.
We would like to thank the Evmos team for their work and for making this project possible.
