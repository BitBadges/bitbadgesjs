---
title: Bind lifecycle observations to an exact artifact
last-verified: 2026-09-19
---

`bb dev tools call verify_lifecycle_intent --args-file input.json` uses the same operation as MCP. Discover the installed command syntax with `bb dev --help` and its schema through `bb dev capabilities verify_lifecycle_intent`.

Input contains `artifact: { messages: [{ typeUrl, value }] }`, a version 1 `intent`, a runner `scenario`, and optional `requiredCoverage`. The first scenario step must execute those exact messages, in order, via `message` or `messages`. Resolve fixture addresses before submitting both inputs. The operation never replaces addresses, strips metadata, repairs messages or changes the requested intent.

The result retains `staticEvidence` and the actual `lifecycle` report, with content identities and runner provenance. A static violation or failed scenario makes the combined report violated. Otherwise it remains unverified: a caller-supplied scenario may omit an important counterexample, use an irrelevant assertion, or fail to exercise manager bypasses. The operation does not turn arbitrary passing assertions into proof that the entire original request is met. Independent golden scenario oracles supply that missing coverage; inspect per-requirement and per-step evidence separately.

This is local module execution only. Signatures, transaction fees, sequences, IBC and external/indexer/plugin behavior retain their explicit coverage exclusions. No wallet, API key or funded broadcast is required. Install the chain runner as described in `local-lifecycle.md`.
