---
title: Validate agent-facing builder contracts
last-verified: 2026-09-13
---

The tool registry owns shared CLI/MCP operation discovery. `getCapabilityCatalog` returns compact summaries by default and the installed schema for a requested operation. The catalog hash changes with tool definitions; it is not an authorization token or proof of chain compatibility.

Standard builder input schemas are generated from the local TypeScript parameter interfaces. Change the interface and runtime rules together, then run:

```sh
bun scripts/generate-builder-schemas.ts
bun run build
bun run test:unit --runInBand
bun run test:agent-contracts
bun run test:agent-workflows
```

Commit `src/core/builders/input-schemas.generated.json`. Build checks reject stale generation. The generator deliberately fails on unsupported type shapes rather than emitting an unconstrained schema. JSON types and unknown fields are validated at the producer; on-chain authorization, cross-field rules, and current-state requirements still need runtime validation, review and simulation.

`input-examples.json` supplies one unsigned fixture per generated builder. The built-artifact checks run the real CLI in an isolated home with a test-only fixed clock, compare CLI and MCP proposals, load every canonical skill, exercise all invoice examples, and check malformed input failures. No wallet, API credentials, signing, or broadcast is used. These deterministic checks complement fresh-agent evaluations; they do not substitute for them.

MCP output must be JSON-safe independently of Jest setup. Some approval builders produce `bigint`; the adapter converts these to decimal strings before transport. Keep that boundary covered through the built CLI, since test-environment BigInt serialization can hide a broken distributable.

Claim generation validates its gating type and rejects fields belonging to another mode. The local builder caps generated code arrays at 10,000 to bound one tool response; this is a builder resource limit, not a new token-standard limit. Larger claim usage limits remain possible with an explicitly bounded code count or a different gating mode.

The action workflow check starts a loopback API fixture and connects a real MCP client to the built server. It compares unsigned CLI/MCP proposals across nine standard families and every invoice example, checks preservation of unrelated subscription consent, propagates failed balance lookups, and inspects a persisted request whose listener is absent. No production API or wallet is involved.

Standard action inputs come from an explicit allowlist of CLI commands and business options. The adapter launches the installed CLI with `execFile`, never a shell, and rejects mismatched capability catalogs. CLI process isolation preserves existing command behavior without importing process-exit or stdout handling into an MCP request. `BITBADGES_CLI_PATH` is trusted operator configuration; callers cannot select executables, signing flags, credentials, endpoints, or output paths.

Browser transaction records live under the configured CLI directory with 0700 directories and 0600 files on POSIX. Windows relies on the account's directory ACLs, following the existing credential-store convention; use a private configuration directory. `bb dev requests status` is local inspection, not chain verification. `resume` returns the original URL only after a nonce-bound check of the live listener; there is no background daemon or automatic replacement transaction. Expiry and listener loss remain unknown outcomes until independently reconciled.
