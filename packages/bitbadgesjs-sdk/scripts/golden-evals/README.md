# Behavioral builder cases

These are independent, versioned constraints for canonical unsigned builder
proposals. They extend the CLI/MCP parity checks with required properties and
deliberately corrupted outputs. They are development tooling, not SDK exports.

Run from the package directory after building:

```sh
bun run test:agent-golden > agent-golden-report.json
bun run test:agent-golden --artifacts /path/to/artifacts.json
bun run test:unit --runInBand scripts/golden-evals
```

The artifacts file is an object keyed by case ID, each containing the normalized
message (`typeUrl` and `value`), not an MCP envelope. Missing artifacts fail;
unknown IDs are errors. Supplying artifacts never invokes a builder as fallback.
An evaluator owns the cases; the evaluated agent may supply only artifacts.
`--cases` selects a trusted, independently authored suite.

Each case contains a natural-language prompt, explicit clarification answers,
builder input fixtures, assertions, mutations, and limitations. The fixture clock
is 2030-01-01T00:00:00.000Z. Decimal amounts and time boundaries in expected
artifacts are strings; comparisons never round or coerce them.

Assertions use JSON pointers and exact equality, array membership, or array
length. These checks target the canonical builders' current artifact shape;
equivalent arbitrary approval layouts may fail and need independent semantic
or execution graders. Whole-transaction snapshots are not the oracle. Expected
values must not be generated from builder output or imported from its helpers.

Mutations replace an existing field and name the assertions that must change
from passing to failing. A missing target, unchanged artifact, missed mutation,
builder error, or failed assertion fails the run. Exit codes are 0 for pass,
1 for evaluated failure, and 2 for invalid input or runner failure.

Reports include per-assertion evidence, mutation results, source commit and dirty
flag, SDK version, fixture time, case hash and built-artifact or supplied-artifact
hash. The manual `Golden builder evaluations` workflow archives the report.
Evaluation runs require explicit `workflow_dispatch`; PR/push CI only runs
ordinary regression tests, never these evaluation commands. Reports may contain supplied transaction values;
use synthetic fixtures and keep private run artifacts out of public CI.

Passing means **only the listed artifact constraints passed**. Chain execution,
ante/signatures/fees, live eligibility, browser signing, external services, and
model quality are not tested here. The seed subscription intentionally retains
manager control over non-mint approvals: it does not promise immutable
non-transferability or automatic renewal.

The five seed families are subscriptions, direct invoices, backed tokens,
purchasable credits, and spendable service credits. NFT/fungible scenarios,
real chain lifecycle execution, auditor recall, semantic acceptance of alternate
layouts, held-out model trials and longitudinal comparison remain separate work.
