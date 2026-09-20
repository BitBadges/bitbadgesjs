---
title: Reproduce the agent evaluation baseline
last-verified: 2026-09-19
---

**Experimental evaluations — not a source of truth.** These checks provide
limited diagnostic and comparison signals. A passing score is not proof of
correctness, security, production readiness, or successful real-agent behavior.
Use independent review and scenario-specific verification for those decisions.
Run evaluations on demand; they must not run on PRs, pushes, or schedules.

Revisit this label only after independently reviewing the oracles, testing known
good and bad outcomes, and establishing repeated live-model baselines with
measured coverage and error rates. Document that evidence and an explicit
maintainer decision before changing the label; it does not expire automatically.

The baseline source is public SDK main
`8c6306c43e5153359b684c7bd8dca4999276a6ec`, package version 0.45.6.
This identifies source, not the registry publication or deployed frontend.
The older private-parent SDK pin is not the current public main baseline.

Use Bun 1.4.0 and the package's frozen lockfile:

```sh
bun install --frozen-lockfile
bun run build
bun run test:unit --runInBand
bun run test:agent-contracts
bun run test:agent-workflows
bun run test:agent-golden > agent-golden-report.json
```

The baseline build passes CJS/ESM generation, schema consistency, package import
checks and circular dependency checks. Existing agent contracts exercise 98 CLI
invocations, 25 canonical skills and nine payment examples. Existing workflows
exercise 29 CLI/MCP proposal comparisons across nine standard families and all
nine invoice examples, plus approval preservation, error propagation and
lost-listener recovery using local HTTP fixtures.

With the first golden-case implementation, 213 suites / 3,937 unit tests pass.
The five golden cases pass 45 artifact assertions and detect all 19 authored
mutations. The dependency audit reports no vulnerabilities across 875 packages.
No dependency versions or lockfile entries changed.

These existing checks validate construction and transport consistency, not
execution of token lifecycles or statistical model quality. The new golden cases
add independent artifact requirements and negative mutations. See
[`scripts/golden-evals`](../../scripts/golden-evals/README.md) for scope,
report identity, input contracts and limits.

Current signing request recovery already distinguishes listener loss and unknown
outcomes. The browser UX work should extend that bridge. This baseline does not
establish deployed UI behavior, publication status, chain compatibility, or live
signing success; those require separately recorded evidence.
