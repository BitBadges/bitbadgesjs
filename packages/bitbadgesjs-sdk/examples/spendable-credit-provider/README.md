# Spendable credit provider

This runnable Bun example issues an authenticated customer a service request,
verifies their confirmed on-chain consumption, and grants one durable entitlement.
It does not deliver an external service. Integrate delivery using the returned
`entitlementId` as the downstream idempotency key.

## Contract

1. Configure one trusted chain REST node, chain ID, immutable collection,
   provider, service ID and whole-credit cost.
2. Authenticate the customer. `/requests` derives the wallet from that session;
   clients cannot choose the wallet or price. Replace the example's single
   customer API key with your existing authenticated session middleware.
3. Return the issued request ID, terms and private request credential. The wallet
   signs `buildConsumeSpendableCreditsMsg(collection, terms)`. Do not place the
   private credential in the transaction memo or a public URL.
4. Call `/fulfill` with the request ID, credential and transaction hash. The
   provider fetches the transaction itself, checks chain, collection, provider,
   service, wallet, units, request ID and successful inclusion. A client-supplied
   receipt is never evidence.
5. One SQLite transaction inserts both the unique request claim and unique
   receipt claim. Retries return the same entitlement, including after restart.
   A different customer cannot obtain it using the public transaction hash.
   An already fulfilled authenticated request with the same hash returns its
   stored entitlement even while the chain nodes are unavailable.

Cosmos receipts bind the exact native transfer. EVM receipts bind the holder,
chain, successful block receipt and exact SDK-generated calldata, either a direct
transfer or a single-message `executeMultiple` call. They also require the exact
successful tokenization `indexer` event from the native transaction, bound to the
EVM hash and block height. A status-1 call to a disabled precompile is a no-op and
must never grant service. The native node must expose transaction search.
Nested contracts and batches
containing additional messages are unsupported. The provider never infers service
consumption from an arbitrary burn event.

Never grant service from a sign-in balance. These credits are nontransferable,
but repeated sign-ins are still not consumption. Consumption irreversibly removes
whole units. Paid mint replenishes them. Fixed expiry rejects new purchases and
consumption after its inclusive timestamp. A consumption confirmed before expiry
can still be claimed afterward. No delegated merchant debit, revocation, refund,
credit-to-cash redemption, or automatic service delivery exists in this profile.
The customer authorizes each consumption individually. Metadata and all economic
terms are frozen at creation.

If submission, indexing, or the HTTP response is ambiguous, reconcile the same
transaction/request. **Do not burn again.** If an external service fails, retry
delivery with the same entitlement ID. Atomic SQLite claims cannot make an
unrelated external side effect exactly once; the downstream provider must accept
idempotency keys or expose a reconciliation operation. No automatic refund is
promised. A service operator must disclose their delivery/support policy before
the customer consumes.

## Run locally

With Bun 1.4.0 and the SDK dependencies installed, set `CREDIT_LEDGER_PATH`,
`CHAIN_REST_URL`, `CHAIN_ID`, `EVM_RPC_URL`, `EVM_CHAIN_ID`, `COLLECTION_ID`, `PROVIDER_ADDRESS`, `SERVICE_ID`,
`SERVICE_UNITS`, `CUSTOMER_API_KEY`, and `CUSTOMER_WALLET`, then run:

```sh
bun examples/spendable-credit-provider/server.ts
```

The example binds localhost port 3099 (override `PORT`). Both POST routes require
`Authorization: Bearer <CUSTOMER_API_KEY>`. `/requests` takes an empty JSON object;
`/fulfill` takes `{ "requestId": "...", "secret": "...", "txHash": "..." }`.
Use a durable private database path, retain backups, and never reset the claim
ledger while the collection remains usable. One database serves one configured
chain; do not repoint it to a different chain. Production deployments need HTTPS,
normal API authentication/rate limits and durable storage operations.

## Verification

```sh
bun test src/core/builders/spendable-credit.spec.ts src/core/spendable-credits.spec.ts examples/spendable-credit-provider/ledger.spec.ts
bun scripts/spendable-credit-chain.ts /absolute/path/to/bitbadgeschaind
```

The latter starts a disposable funded local chain, performs real purchases and
consumptions, verifies rejected merchant debits/peer transfers/overdrafts, then
tests the provider against real chain REST responses, cross-customer denial,
repeated claims, database reopen, direct EVM precompile purchase, single-message
EVM batch consumption, failed EVM overdraft receipts, and offline entitlement replay. It does not contact a public network.
