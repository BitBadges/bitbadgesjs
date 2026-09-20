---
title: Agent evaluation comparisons and reviewer benchmark
last-verified: 2026-09-19
---

**Experimental — not a source of truth.** Passing comparisons and reviewer
benchmarks do not establish correctness or production readiness. Run manually;
never use these scores as automatic merge or deployment approval. See the
[baseline runbook](agent-evaluation-baseline.md) for the evidence and maintainer
review required before revisiting this label.

Run from `packages/bitbadgesjs-sdk` after `bun run build`:

```sh
bun run test:agent-golden > candidate.json
bun run eval:compare --baseline baseline.json --candidate candidate.json
bun run eval:compare --baseline baseline.json --candidate candidate.json --format text
bun run test:agent-auditor > reviewer.json
```

Comparisons require matching source mode, case hash, fixture time and case IDs.
An incompatible baseline is a failure, never a pass. Missing, duplicated and
internally contradictory results are rejected. Review the oracle changes before
replacing a baseline; never automatically bless a failing candidate. Exit codes
are 0 for pass, 1 for evaluated failure/incompatibility and 2 for invalid input.

The static benchmark distinguishes known reviewer-detectable mutations, benign
configurations and intent-only mismatches. It checks exact expected finding codes,
counts unexpected warning/critical findings, and records builder errors separately.
Intentional manager pricing authority expects an explicit warning; this is not a
false positive. Structurally valid recipient, duration, ratio and cap changes are
reported separately because static review without user intent cannot establish
that they satisfy the request. No recall score implies chain execution or safety
outside the listed cases. Metadata uses an unresolved IPFS fixture; hosting and
image availability are not tested.

The backing regression checks the real derived backing address and criteria.
Approval names, negated addresses and circular backing transfers do not establish
valid deposit or withdrawal paths.

`summarizeTrials` separates infrastructure failures from evaluated product results,
retains all attempts in completion rate, and reports a Wilson 95% interval for
success rate. Missing tokens/cost are null with observed/missing counts, never free
usage. First-pass and repair-success rates have explicit denominators; the latter
uses evaluated trials that initially failed. The helper redacts credential fields,
raw transactions and configured secret values before trace persistence.
