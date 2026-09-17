# Spendable credits

`Spendable Credit` is an immutable, nontransferable service-credit profile.
It is separate from the existing `Credit Token` standard. A sign-in balance is
never proof that a service request has been paid: the holder must consume whole
credits, then the provider must verify and durably accept the receipt.

## Create and use

```sh
bb build spendable-credit --payment-denom USDC \
  --provider bb1YOUR_PROVIDER --service-id images \
  --price-per-pack 1000000 --credits-per-pack 10 --uri ipfs://YOUR_METADATA
bb spendable-credits show COLLECTION_ID
bb spendable-credits purchase COLLECTION_ID --creator bb1YOUR_WALLET --units 2
bb spendable-credits consume COLLECTION_ID --creator bb1YOUR_WALLET \
  --units 3 --request-id PROVIDER_ISSUED_REQUEST_ID
```

Replace the address and ID placeholders. These commands prepare unsigned
transactions by default; normal CLI review/sign/deploy options apply. Price is
in payment base units (1,000,000 for one USDC); credits and packs are whole units.
`--expires-at` is an optional inclusive Unix-millisecond deadline. Both purchase
and consumption stop afterward, while prior confirmed receipts remain claimable.

SDK equivalents are `buildSpendableCredit`, `inspectSpendableCredit`,
`buildPurchaseSpendableCreditsMsg` and `buildConsumeSpendableCreditsMsg`.
The builder MCP exposes this builder through `build_standard` and the show,
purchase and consume actions through the standard-action registry. All surfaces
use the same immutable-profile validation and unsigned transaction builders.

## Authorization and lifecycle

- Paid mint adds credits; each holder-authorized burn removes credits on chain.
- The provider cannot debit a customer's wallet. There is no standing consent
  to revoke, peer transfer, withdrawal, or automatic refund in this profile.
- Price, provider, service, expiry and approval permissions are frozen. Create
  a new collection to offer different terms.
- A consumption memo contains the public provider, service and request ID.
  The signed creator, burn recipient, collection and amount bind the receipt.
- The chain prevents overspending a balance. The provider's durable unique
  request and receipt claims prevent granting the same entitlement twice.
  The chain does not enforce uniqueness of a service request ID: burning again
  can spend more credits without buying another fulfillment of that request.
- If submission or delivery is ambiguous, reconcile the same transaction and
  request. Never submit another consumption merely because a response was lost.

## Provider integration

See the runnable [provider example](../examples/spendable-credit-provider/README.md).
It authenticates the customer, issues private request credentials, reads trusted
chain responses, and atomically records an entitlement in SQLite. It verifies
native Cosmos transfers or direct/single-message-batch EVM precompile calls.
EVM verification additionally requires the matching successful tokenization
execution event; receipt status alone would accept calls to disabled precompiles.

The returned entitlement ID is an idempotency key for actual service delivery.
An on-chain burn and an external HTTP side effect are not one atomic operation.
The service must implement idempotent delivery/reconciliation and disclose its
failure/support policy before consumption. Never accept client-supplied receipts,
infer payment from an arbitrary burn, or return private fulfillment data to a
caller who merely knows a public transaction hash.
