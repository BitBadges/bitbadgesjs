---
title: Inspecting Standard Profiles
last-verified: 2026-09-13
---

# Standard Inspection

Start with `bb standards inspect <collection-id> --family smart-token` (or
`credit-token` / `address-list`). MCP exposes the same read through
`standard_standards_inspect`. These are bounded consumer profiles, not a
certificate of safety for arbitrary collection configurations.

- `recognized`: a discovery tag (or legacy credit approval name) matches.
- `configurationSupported`: the inspected snapshot fits this consumer profile.
- `actions`: supported approval IDs and whether explicit selection is required.
- `issues`: why the configuration cannot use the profile.
- `warnings`: additional authorities, gating or nonstandard behavior to review.
- `eligibility: not-checked`: balances, account approvals, timing, tracker capacity,
  fees and successful transaction execution have not been established.
- `authority`: current manager and approval IDs that override user approvals.
  `approvalUpdates: not-evaluated` deliberately does not certify immutable terms.

Smart Token and Vault inspection supports the one-to-one coin/base-unit wrapper
for token 1 with full ownership times. It verifies the denomination-derived backing
address, conversion and approval routing. Time windows, daily limits and ownership
gates still require execution-time checks. Custom conversions stay discoverable,
but the fixed one-to-one CLI helpers reject them. Generic transaction tooling can
handle custom profiles after reviewing their complete requirements.

For multiple deposit or withdrawal approvals, choose
`bb smart-tokens deposit <id> --approval-id <id> --creator <address> --amount <decimal>`.
The corresponding MCP action exposes `approvalId`. Decimal amounts retain exact
precision; `--base-units` accepts positive integer units. Omitted selection is
allowed only when that action has one supported approval. Approval versions are
preserved in the proposal and collection-level fallback is disabled.

Credit inspection reuses the exact fixed/scaled purchase terms. A positive single
payment, one fixed token-1 balance, and an unambiguous approval identity are required.
Use `bb credit-tokens quote` before `purchase`, and select `--tier` when necessary.
An extra approval can change transferability or authority: the purchase profile
never certifies that the entire collection is non-transferable. Multiple alias
paths do not implicitly choose one path's display precision. Credits remaining
for service usage are an application ledger concern, not the purchased balance.

Address List inspection supports the two canonical manager-issued/revoked
membership approvals. Both must use the same explicit manager, token 1, full
ownership times, and the expected Mint/burn routes. A changed collection manager
that differs from the approval authority is reported as unsupported. Custom
membership policies require their own reviewed action path; the SDK does not
silently select a similarly named or structurally adjacent approval.

Inspection reads a snapshot. Re-read immediately before proposing a transaction,
review every transfer and fee, then simulate and require the intended signer.
No inspection result authorizes signing or guarantees execution.
