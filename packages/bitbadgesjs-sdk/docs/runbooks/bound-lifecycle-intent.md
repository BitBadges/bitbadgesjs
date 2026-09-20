---
title: Bind lifecycle observations to an exact artifact
last-verified: 2026-09-20
---

`bb dev tools call verify_lifecycle_intent --args-file input.json` uses the same operation as MCP. Discover the installed command syntax with `bb dev --help` and its schema through `bb dev capabilities verify_lifecycle_intent`.

**Experimental — scenario evidence, not a source of truth or product certification.**

Input contains `artifact: { messages: [{ typeUrl, value }] }`, a version 1 `intent`, a runner `scenario`, and optional `requiredCoverage`. Exactly one artifact message is supported. The first scenario step must execute that exact message via `message`; batch `messages` are unsupported by the installed runner. Resolve fixture addresses before submitting both inputs. The operation never replaces addresses, strips metadata, repairs messages or changes the requested intent.

The result retains `staticEvidence` and the actual `lifecycle` report, with content identities and runner provenance. A static violation or failed scenario makes the combined report violated. Otherwise it remains unverified: a caller-supplied scenario may omit an important counterexample, use an irrelevant assertion, or fail to exercise manager bypasses. The operation does not turn arbitrary passing assertions into proof that the entire original request is met. Independent golden scenario oracles supply that missing coverage; inspect per-requirement and per-step evidence separately.

This is local module execution only. Signatures, transaction fees, sequences, IBC and external/indexer/plugin behavior retain their explicit coverage exclusions. No wallet, API key or funded broadcast is required. Install the chain runner as described in `local-lifecycle.md`.

Use `get_lifecycle_template` for a synthetic reference and `get_lifecycle_capabilities`
for product coverage boundaries. Copy the template's first message into the
artifact and author explicit intent requirements independently. Use this tool to
catch artifact substitution or a concrete scenario violation before deployment;
do not use it as approval of arbitrary user requirements or deployed state.
Even exact reference scenarios do not establish complete intent coverage.
