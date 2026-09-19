---
title: Run local lifecycle scenarios
last-verified: 2026-09-19
---

Build `bitbadges-lifecycle` from the matching chain revision using the chain
repository's lifecycle runbook. Set `BITBADGES_LIFECYCLE_RUNNER` to the binary
path, then use the existing shared interface:

```sh
bb dev tools call environment_diagnostics
bb dev tools call lifecycle_schema
bb dev tools call run_lifecycle --args-file scenario-input.json
```

The input is `{ "scenario": <runner scenario>, "requiredCoverage": ["module"] }`.
MCP exposes the same three operations. No signing, API key, model key, external
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

Verification performed against the real chain runner: six subscription steps
(purchase, exact expiry boundary, renewal and state assertions) passed; adding
IBC to requiredCoverage returned unverified. Fixture executables separately test
timeouts, oversized output, version mismatch, and result/request binding.

Lifecycle execution also caught a session normalization defect:
`updateDefaultBalances` was a builder-only field leaking into MsgCreateCollection.
Normalization now drops that flag while retaining actual defaultBalances.
