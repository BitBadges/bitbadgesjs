---
title: Run local lifecycle scenarios
last-verified: 2026-09-20
---

**Experimental — scenario evidence, not a source of truth or product certification.**
Use this tool for isolated tokenization rules, expected rejections, time boundaries,
and state assertions before deployment. Do not use it to approve arbitrary product
requirements, check live eligibility, or replace transaction simulation, signing,
integration tests, or an independent review of the expected outcomes.

The capability catalog accounts for every installed standard. Currently seven
families have reference scenarios; all others explicitly have no reference coverage.
This is a bounded local module tool, not an all-products lifecycle verifier.

| Standard | Reference scope | Not established |
| --- | --- | --- |
| subscription | Paid purchase, consent, expiry boundary, renewal, unpaid rejection | Calendar billing, automatic debit, immutable restrictions |
| payment-request | Direct invoice, payer/recipient checks, duplicate payment, deadline boundaries | Escrow, refunds, payment-request-v2 |
| smart-token | On-chain backing, deposits, withdrawals, over-withdrawal | Off-chain reserves or arbitrary configurations |
| credit-token | Purchase multiples, transfer/burn restrictions | Every credit product configuration |
| spendable-credit | Purchase cap, holder consumption, expiry | Actual service delivery |
| nft | Mint caps, authorization, transfer, burn, failed-batch rollback | All NFT configurations; burn does not restore mint allowance |
| tradable-fungible | Mint caps, authorization, transfer, burn | DEX, pools, price or trading integrations |

Discover and obtain a runnable synthetic reference without installing a runner:

```sh
bb dev tools call get_lifecycle_capabilities
bb dev tools call get_lifecycle_template --args '{"id":"subscription-paid"}'
```

Save the returned `input` object as `scenario-input.json`. Preserve its actors,
messages, actions and assertions when reproducing the reference. Adapt all four
together for a real design; independently check that assertions express the user's
requirements. Editing any part makes the scenario `caller-authored`. Exact matches
are labeled `shipped-reference`; this label does not transfer to similar products.

Build `bitbadges-lifecycle` from the matching chain revision using the chain
repository's lifecycle runbook. Set `BITBADGES_LIFECYCLE_RUNNER` to the binary
path, then use the existing shared interface:

```sh
bb dev tools call environment_diagnostics
bb dev tools call lifecycle_schema
bb dev tools call run_lifecycle --args-file scenario-input.json
```

The input is `{ "scenario": <runner scenario>, "requiredCoverage": ["module"] }`.
MCP exposes the same operations. No signing, API key, model key, external
RPC or funded wallet is needed. The optional runner is never downloaded or
executed from a scenario-provided path. Input goes over stdin without a shell.
The runner inherits only PATH, HOME and Windows SystemRoot where applicable.

The adapter checks protocol version, exact stdin SHA256, scenario ID, step IDs,
assertion outcomes and exit code. Version mismatch, missing executable, invalid
result, a 30-second timeout or output beyond 2 MiB fail explicitly. The exported
adapter accepts bounded overrides up to two minutes and 8 MiB for local callers.
The public CLI/MCP operation does not accept arbitrary executable paths or flags.

`passed` reports runner assertions. `status` also checks mandatory coverage:
requesting IBC, claims, plugins, indexing or external services produces
`unverified` even when all module assertions pass. Module execution does not
test transaction signatures, ante-handler fees/sequences or block hooks.
Coin transfers may include module protocol fees distinct from gas fees.
Unknown chainCommit is explicitly `sourceVerified: false`.

Reports explicitly include `maturity: experimental`,
`scope: supplied-scenario-assertions`, and `productVerification: not-established`.
`satisfied` means the supplied checks passed with requested coverage; `violated`
means a check failed; `unverified` means missing coverage or unknown source revision
despite passing checks. A violation takes precedence over missing coverage.
Errors mean no trustworthy report was produced. Even a satisfied reference is not
evidence that a different artifact, deployed collection, or intent is correct.

Twelve snapshots are pinned to chain revision
`86ec7e8a8bcd67173e4b1ab2548c49c0be74df66`. Template metadata includes the original
chain path and source-file SHA256. The bundled JSON preserves parsed source
scenarios; its whitespace differs from the source files. Runner revision and
reference revision are reported separately: a different runner can execute the
same scenario, but that is not a replay of the pinned reference environment.

From the SDK package, manually replay every shipped reference against that runner:

```sh
BITBADGES_LIFECYCLE_RUNNER=/absolute/path/bitbadges-lifecycle bun scripts/check-lifecycle-references.ts
```

This explicit integration command is not an automatic evaluation workflow. To
refresh snapshots, review chain scenario changes at a new immutable revision,
copy parsed scenarios and source hashes into `src/builder/lifecycle-fixtures.json`,
update the coverage descriptions, and replay all references. Never update only
the revision or bless changed expectations without reviewing them.

A well-formed recorded chain revision is required for `status: satisfied`.
`sourceVerified` means a revision was reported consistently, not binary attestation:
install the runner from a trusted checkout and retain its binary hash. Unknown or
malformed revision strings produce `sourceVerified: false` and `unverified`.
The adapter also checks the exact number, kinds and expected values of requested
assertions, observed-value presence, and each expected success/rejection. An
omitted assertion or contradictory outcome is an error, not a passing result.
The adapter also checks accumulated scenario time and requested rejection reasons.

This adapter depends only on the installed chain runner; it does not require
intent contracts, a browser handoff, or user-facing signing changes. Assertions
are authored by the caller: satisfied means this particular scenario passed,
not that all real-world requirements were covered. Experimental model evaluations
are separate and remain manual-only.

The session-export normalization fix (removing builder-only update flags) is
tracked separately in SDK PR338. The runner accepts canonical chain messages;
it does not silently repair invalid messages.

Keep the experimental label until coverage has independently reviewed requirements,
representative positive and negative scenarios, reproducible revision-bound runs,
and a documented compatibility policy. Expand coverage one product at a time;
adding a builder alone must never imply verified lifecycle support.
