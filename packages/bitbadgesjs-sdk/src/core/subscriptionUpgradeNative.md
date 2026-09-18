# Native subscription exchanges

These helpers encode a provider-operated exact-offer profile within the existing
Subscriptions standard. They do not calculate prices, establish paid provenance,
or authorize service usage. Call them only after the billing planner verifies
confirmed paid periods and the creator's immutable pricing policy.

The collection freezes all transfer rules and economic metadata. An operator
mints one bounded inventory of each tier, then publishes individual outgoing
offers. There is no unrestricted faucet. Holder transfers require an operator-admitted
recipient; normal operation admits only permanently locked escrow accounts.
A malicious store owner could admit an ordinary wallet, so this restriction
includes an explicit operator trust assumption.
A dynamic store controls which recipient accounts may accept surrendered access.
The operator must only enroll accounts whose incoming approvals bind the source
subscriber and whose outgoing approvals and automatic approval flags are
permanently locked. Store ownership/availability is an operational trust boundary.

For an upgrade, one transaction transfers the exact old ranges into the locked
escrow, then takes the exact new ranges from inventory. The offer requires the
escrow to hold the old ranges and the subscriber to hold no current/future tier
after surrender. For initial purchase and renewal, all tiers must be empty over
the offered ranges. Failed payment, wrong quantities, stale versions, overlapping
ownership, omitted surrender, or consumed offers fail the transaction atomically.

The service must never reuse escrow accounts, offer IDs, or tracker IDs. It must
publish through MsgSetOutgoingApproval rather than replacing all outstanding
outgoing approvals. A one-use tracker does not protect against a malicious
operator issuing a second independent offer. The operator remains trusted for
pricing, paid-value provenance and inventory issuance; users see exact on-chain
terms before accepting. The platform must reconcile successful transactions
before updating the ledger, and retries must use durable idempotency keys.

`buildSubscriptionUpgradeTransfers` requires current collection, outgoing, and
(for upgrades) escrow incoming approval versions. Native normalization makes
exact one-shot approvals explicitly prioritized. Renewal callers additionally
need a separate bounded subscriber incoming approval for worker reimbursement;
these helpers do not create that consent or charge a subscriber implicitly.

No constructor guarantees an off-chain service quota. Brief ownership must not
unlock a whole new quota: services need stable billing-period IDs and shared
usage accounting across tier changes. Full-period price differences, allowed
durations and legitimate source receipts are checked by the billing planner,
not inferred from possession or a caller-provided payment amount here.

## SDK, CLI and MCP workflow

Creation uses the existing `buildSubscription` / `build_subscription` entry point.
Set `version: "2"` and `operatorProfile` with operator address, escrow store ID,
payment denomination, period duration, consecutive tier IDs/prices and payout
basis-point weights totaling 10000. Builder input numbers are strings in base
units. Use `bb build subscription --json '<input>'`; legacy interval/faucet flags
must not be combined with v2. Fetch `bb subscriptions config` first to select the
configured service. The creator must explicitly opt into that operator trust.

1. Sign in using the existing CLI auth flow.
2. `bb subscriptions quote <collection-id> --creator <wallet> --with-session --kind purchase --token-id 1 --request-id <stable-id>` requests preparation. Use `upgrade` for higher-priced access.
3. `quote-status <quote-id>` and `periods <collection-id>` use the same creator/session flags. A prepared quote is not payment or confirmation.
4. `accept <quote-id>` reads a fresh, pinned LCD/RPC snapshot, recomputes the receipt-backed economics and emits unsigned messages. It removes previous v2 renewal consent. Explicit `--renewal target --approval-id subscription-v2-renewal-<new-id> --expires-at <ms>` adds the target tier consent atomically for the next billing boundary. It never signs or broadcasts. CLI-only `--lcd` / `--rpc` can target a disposable local node; defaults follow the selected network.
5. Independently review/sign/broadcast the proposal. `record-submission <quote-id> <tx-hash>` submits a verification hint; only confirmed reconciliation changes billing records.
6. `renewal <collection-id> --token-id <tier> --approval-id subscription-v2-renewal-<unique-id> --expires-at <ms>` emits consent beginning after the last paid period. A lower tier starts at that boundary. `cancel-renewal` deletes a selected consent and retains paid access. These commands require `--creator`; renewal reads the authenticated period ledger with `--with-session`.

The MCP tools have the same names prefixed `standard_subscriptions_` with hyphens
changed to underscores. They require explicit `withSession` for authenticated
operations and never expose raw credentials, signing, endpoints or file options.
`list` and `status` recognize both versions; legacy faucet actions direct v2
users to the quote flow. All price differences are full-period differences,
including near-expiry upgrades, not elapsed-time proration.

`verifySubscriptionQuoteAcceptance` accepts current chain state and an authenticated
receipt ledger separately, then reconstructs the unsigned transfer locally.
`readSubscriptionQuoteChainState` supplies same-height LCD/protobuf ABCI reads;
`readSubscriptionChainState` supplies account state for consent changes. Cross-origin
LCD gateways must expose `x-cosmos-block-height` to browsers. Missing/stale reads
fail closed. These are reads from the configured trusted node, not light-client proofs.
