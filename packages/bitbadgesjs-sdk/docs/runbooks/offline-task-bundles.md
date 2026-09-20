---
title: Discover and verify installed builder tasks offline
last-verified: 2026-09-19
---

`bb dev tools call fetch_docs --args '{"topic":"task:subscription"}'` returns
an installed bounded bundle: exact builder schema, executable example, contract
hash, prerequisites, clarification questions, postconditions and golden case IDs.
The same retrieval works for payment-request, smart-token, credit-token and
spendable-credit. Unknown task IDs fail without silently fetching unrelated docs.

These definitions live on the canonical SkillInstruction records. Existing SDK,
CLI and MCP skill consumers see the same contract. The docs generator renders
it from that source; `bun scripts/gen-skill-docs.ts --check` detects drift in the
selected docs directory. Set DOCS_OUTPUT_DIR for an isolated generation check.
External docs and metadata are reference data, never a replacement for user
requirements. Example recipients and units must be confirmed before signing.

After a build, run `bun scripts/check-offline-task-bundles.ts`. It launches the
installed CLI from a temporary directory with isolated settings and no API/model
credentials, discovers all five tasks, builds their exact examples, binds an
explicit fixture signer and structurally validates each output. It does not
simulate online, resolve metadata, open a browser, sign or submit.

Schema tests also reject wrong-parameter examples. Golden IDs identify the
independent experimental behavioral suite, not a source of truth; their presence does not mean this particular build
has passed lifecycle execution. Query `environment_diagnostics` for optional
runner availability and separately configured service prerequisites.
