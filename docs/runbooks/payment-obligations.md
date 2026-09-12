---
title: Payment obligation standards and verification
last-verified: 2026-09-11
---

`PaymentRequestV2` represents a finite invoice with independently enforced obligations. `PaymentLinkV1` represents reusable fixed payments. Both use `buildPaymentRequestV2`, with `version: 2` and `kind: 'invoice' | 'payment-link'`. Existing `PaymentRequest`, `Invoices` and `Subscriptions` parsers remain separate and backward compatible.

Each obligation has a stable `id`, an immutable `payer` policy, atomic `payouts`, inclusive `startTime`/`endTime`, and optional informational `dueAt`. Amounts are exact base-unit integer strings. No automatic denomination conversion occurs. Multiple denominations mean all are due together, not a choice of currencies.

| Use case | Obligation configuration |
| --- | --- |
| Specific payer | `payer: { kind: 'addresses', addresses: [payer] }` |
| Anyone | `payer: { kind: 'anyone' }`; payout recipients are excluded on chain |
| One of a roster | One obligation with multiple eligible addresses; default payment count 1 |
| Every payer, custom shares | One obligation per payer with its own payout amounts |
| K distinct eligible payers | One roster obligation, `requiredPayments: 'K'`, `distinctPayers: true` |
| Installments | Separate obligations and payment windows; not conditional milestone release |
| Partial payments or shared target | `partial: { targetUnits: 'N' }`; payout amounts are the price of one quantum |
| Reusable link | `kind: 'payment-link'`; omit payment count, partial target and distinct-payer restriction |
| Recipient splits | Multiple payouts in one obligation; all scale by the same integer multiplier |

Partial targets use both `maxScalingMultiplier` for an individual payment and `overallApprovalAmount` for cumulative payment units. The amount tracker counts receipt token units, not coins. For a split of 3 and 2 base units, paying 7 units transfers 21 and 14 base units. Reject non-integral splits rather than rounding. Each obligation uses token ID `index + 1`, approval ID `payment-v2-<id>`, and that approval ID as its configured amount and transfer tracker ID. Exact invoices use the transfer count; partials use the cumulative token amount. Unlimited links keep overall order tracking enabled.

Tracker identity includes collection ID, approval level, approver address, approval ID, configured tracker ID, tracker type and approved address. Two different approvals cannot share a counter merely by sharing `amountTrackerId`. Missing or inconsistent evidence is unknown, never unpaid. Aggregate progress and lifecycle independently so a partially paid expired invoice retains its payment history. Preserve denomination-specific totals and per-obligation receipts.

`extractPaymentRequestV2Details` validates the economic on-chain approval, permission, invariant and conversion-path shape against the terms stored in collection `customData`. Decorative approval URI/customData and indexer enrichment do not affect recognition. Protobuf defaults are normalized, but non-default additional criteria or permissions are rejected. Message inputs must target collection ID zero and enable every required economic update flag; frozen-term update messages are rejected. Builders explicitly emit `mustPrioritize: true`, which the chain materializes for coin-transfer approvals. The fixture `payment-requests-v2.chain-fixture.json` was exported from a real local keeper collection execution, with synthetic addresses and funds.

Use `bb build payment-request-v2 --json terms.json` to emit an unsigned collection. Use `bb pay-requests show`, `status`, and `pay --obligation <id> --units <integer>` with an indexed collection. MCP exposes `build_payment_request_v2`. The default action emits; signing and publication remain separate user actions.

Cancellation, refunds, escrow, conditional release and alternative-currency choices are deliberately rejected by these strict terms. An independent legacy deny tracker records refusal; it does not cancel the payment approval. Recurring billing continues through the existing `Subscriptions` standard and user recurring approvals. Reusable links are not recurring debit consent. Escrow requires a separately verified balance-based state machine; unrelated payment and progress approvals do not establish atomic funding evidence.

Run the focused SDK tests and build before integration. The private application/indexer must consume the published SDK version together; never deploy a local package symlink. No chain migration is introduced by these standards.
