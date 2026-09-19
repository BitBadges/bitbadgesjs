---
title: Repeated agent evaluations against independent contracts
last-verified: 2026-09-19
---

Run from the SDK package after `bun install --frozen-lockfile` and `bun run build`.

```sh
bun run test:agent-behavior > references.json
bun run test:agent-behavior --chain-binary /absolute/path/bitbadges-lifecycle \
  --chain-scenarios /absolute/path/chain/lifecycle/testdata/scenarios > executed-references.json
bun run eval:agents --config /absolute/path/config.json --partition all \
  --chain-binary /absolute/path/bitbadges-lifecycle \
  --chain-scenarios /absolute/path/chain/lifecycle/testdata/scenarios > agents.json
bun run eval:compare --baseline previous-agents.json --candidate agents.json --format text
```

Use `scripts/golden-evals/model-config.example.json` as the configuration shape.
Its placeholder model and zero prices/budget intentionally cannot authorize a live
run. Set an explicit model version, verified token prices and a finite budget.
Use `credentialEnv` names; do not put keys in JSON. The built-in Anthropic adapter
reuses the SDK's existing provider abstraction; its optional peer is pinned as a
development dependency for this evaluator. OpenAI requires its supported optional
peer installed, or use a trusted external harness executable with the same wire
contract. No provider is contacted by deterministic reference checks.

The 30 cases comprise 15 artifact proposals and 15 clarification, unsupported and
recovery decisions. They include composed payments, time boundaries, NFT/fungible
authority, metadata-only updates, immutable-permission failures and stale signing
reviews. Three artifact cases include hostile retrieved metadata while their
recipient/authority oracles stay unchanged. Development and held-out partitions
are disjoint; held-out is a public partition convention, not proof of model
training exclusion. Assertions and reference artifacts never enter worker input.

Seven proposal families run full trusted lifecycle scenarios against the local
chain. Only an omitted/empty creator and manager are bound to the fixture actor;
the evaluator makes no other proposal repairs. It checks the runner's scenario
hash, exact step/assertion coverage, verdict consistency and known source commit.
The other eight proposal variants remain artifact-only, and decisions have no
chain-execution claim. Local module execution excludes signatures, ante gas fees,
sequences, IBC, block hooks and external service delivery; the separate chain
conformance tests cover selected signed Cosmos transactions. Protocol transfer
fees are included in the lifecycle balance assertions.

Each attempt is a fresh process with a fresh temporary working directory and an
explicit environment. Repairs receive prior responses and failing check IDs, not
expected values or mutable acceptance checks. The parent snapshots its oracle in
memory and verifies evaluator files did not change. This is not an OS sandbox:
the configured harness is trusted executable code and must not grant arbitrary
filesystem or shell tools to the model. The built-in worker exposes an offline
tool allowlist, no signing/network tools, at most eight provider rounds and 30
tool calls. It conservatively bounds upcoming input by UTF-8 bytes before calls,
then counts provider-reported input/output/cache usage. Per-attempt token, time,
output and run-wide cost reservations bound execution. Exhaustion remains a
recorded failure for every remaining trial; no silent skipping.

External worker stdin is `{version:1,task:{id,prompt,context},history,settings}`.
Stdout is one JSON object `{response,usage:{inputTokens,outputTokens,toolCalls},trace}`;
usage fields may be null when unavailable. `response` uses the versioned contract
in `provider-worker.ts`. The worker never grades itself. Provider/harness failures
are infrastructure errors, while independent artifact or execution mismatches are
product failures. A repaired false assurance remains visible and fails the gate.
Unknown usage never becomes zero cost. Configured prices are estimates, not an
invoice; provider failures may incur charges with missing usage.

Reports include source/build/evaluator/skill-doc hashes, provider settings, case
hash, per-case and aggregate counts, Wilson intervals, first-pass/repair rates,
redacted tool traces and exact chain evidence. Stored report comparisons reject
changed case/trial sets, budgets or models and contradictory metrics. They do not
cryptographically attest the producer; retain reports in a controlled artifact
store and review baseline changes explicitly. Private CI owns scheduled paid runs
and dedicated credentials. Public CI runs credential-free references/lifecycles.

Fixture-worker tests verify harness mechanics only. No live-model success score
has been established by those tests or by the reference corpus.
