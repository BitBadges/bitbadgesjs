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
