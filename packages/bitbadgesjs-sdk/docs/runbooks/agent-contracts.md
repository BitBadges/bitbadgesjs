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
```

Commit `src/core/builders/input-schemas.generated.json`. Build checks reject stale generation. The generator deliberately fails on unsupported type shapes rather than emitting an unconstrained schema. JSON types and unknown fields are validated at the producer; on-chain authorization, cross-field rules, and current-state requirements still need runtime validation, review and simulation.

`input-examples.json` supplies one unsigned fixture per generated builder. The built-artifact checks run the real CLI in an isolated home with a test-only fixed clock, compare CLI and MCP proposals, load every canonical skill, exercise all invoice examples, and check malformed input failures. No wallet, API credentials, signing, or broadcast is used. These deterministic checks complement fresh-agent evaluations; they do not substitute for them.

MCP output must be JSON-safe independently of Jest setup. Some approval builders produce `bigint`; the adapter converts these to decimal strings before transport. Keep that boundary covered through the built CLI, since test-environment BigInt serialization can hide a broken distributable.

Claim generation validates its gating type and rejects fields belonging to another mode. The local builder caps generated code arrays at 10,000 to bound one tool response; this is a builder resource limit, not a new token-standard limit. Larger claim usage limits remain possible with an explicitly bounded code count or a different gating mode.
