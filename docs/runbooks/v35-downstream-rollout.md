---
title: "v35 downstream gas and ETH proof rollout"
last-verified: 2026-09-05
verification: "Source and local regression tests; live upgrade checks pending"
---

## [1] Scope and coordination

Coordinate this release with [chain v35 PR #119](https://github.com/BitBadges/bitbadgeschain/pull/119).
Companion drafts:

- [Frontend #324](https://github.com/BitBadges/bitbadges-frontend/pull/324)
- [Indexer #238](https://github.com/BitBadges/bitbadges-indexer/pull/238)
- [SDK #287](https://github.com/BitBadges/bitbadgesjs/pull/287)

This runbook covers
frontend signing, indexer simulation/faucet/event handling, and SDK signing/query
guidance. Collection-builder changes, dependency upgrades, historical state
migrations, package publication, deployment, and breaker operations are not
performed by these PRs.

The chain proposal currently sets `min_gas_price = 10 ubadge/gas` and
`block.max_gas = 100000000`. Reconfirm both before release; they remain tunable
in the chain upgrade. The fee is in `ubadge` (9 decimals per BADGE), not wei.
EVM wallets obtain their own EVM gas prices from the node. Do not copy the
Cosmos price directly into EVM wei fields.

## [2] Consumer behavior

- Native simulation stays node-driven. Default fees use the final buffered gas
  limit, not raw simulated usage: `gas = ceil(gasUsed * 1.3)`,
  `fee = gas * 10 ubadge`. For example, `1000001` gas used yields `1300002`
  declared gas and a minimum fee of `13000020 ubadge`.
- The frontend pays native transaction fees in `ubadge`, including BitBadges-source
  IBC sends. Counterparty-chain fee policy is unchanged. Wallet-suggested prices
  also meet the v35 floor; verify cached wallet chain settings during rollout.
- Backend precompile checks use a bounded node block gas limit, capped at
  `100000000`, instead of a fixed `5000000`. Real execution errors remain errors.
  The faucet prices its declared gas at the native floor and bounds batches.
- SDK `BitBadgesSigningClient` simulates by default for **both** Cosmos and EVM.
  Cosmos simulation errors reject before signing; EVM estimation errors return
  an unsuccessful broadcast result without sending. Surface the error and retry
  only after correcting the transaction or restoring the endpoint.
- SDK callers can explicitly set `simulate: false` to use their configured
  `defaultGasLimit` / `evmPrecompileGasLimit`. This is a deliberate caller override,
  not a fallback after failed estimation. Limits must be positive integers at
  most `100000000`. Multipliers must be finite and at least 1. Buffered estimates
  above the cap fail; split the transaction or deliberately choose a smaller
  buffer only after verifying the actual requirement.
- Explicit SDK Cosmos fees must use `ubadge` and cover at least the floor times
  their declared gas. Higher custom fees are preserved. Ten is a **floor**, not
  a guarantee of admission during congestion or under stricter node policy;
  inspect the returned required-fee error and re-simulate/reprice as appropriate.

## [3] ETH proof lookup

Proof submission is unchanged: send the original `nonce` and cryptographic
`signature`. Never replace the signature in a submitted proof with its nonce.

After v35, `QueryGetETHSignatureTrackerRequest.signature` is a legacy field name
whose **value must be the nonce**. All other scope fields must match the approval.
For example, the query payload is:

```json
{
  "collectionId": "123",
  "approvalLevel": "collection",
  "approverAddress": "",
  "approvalId": "example-approval",
  "challengeTrackerId": "example-challenge",
  "signature": "the-original-proof-nonce"
}
```

The same mapping applies to the JSON query passed to the EVM precompile. Passing
raw signature bytes asks for a different tracker key and may misleadingly report
zero usage. Do not rename generated protobuf fields locally. No dedicated
first-party ETH usage mirror was found; this change does not add one.

Indexer Merkle projection now accepts only actual Merkle challenge events with
a valid leaf index. ETH-signature events must never synthesize leaf `0` usage.
This prevents new incorrect records; it does **not** repair existing Mongo data.
If a collection already has incorrect indexed usage, inspect chain events and
plan a scoped replay/rebuild with backups and separate operational approval.
ETH events currently omit the nonce, so do not infer a complete nonce usage
mirror from those events. Historical pre-v35 signature-keyed usage is not migrated;
the chain PR documents the accepted once-more behavior.

## [4] Release order and gates

1. Human reviewers approve and merge the companion PRs. Keep them draft until
   local checks and cross-repo integration verification are acceptable.
2. Build and test the SDK, then have the release owner publish an exact new
   `bitbadges` version. This PR does not publish or bump package versions. External
   SDK consumers must explicitly adopt that release; merging does not upgrade them.
3. Build and deploy the backend and frontend fixes together with the v35 rollout.
   Their direct fixes do not require waiting for the SDK publication, but consumers
   using the signing client need the new release. Deploying native fee changes
   early increases fees before the upgrade; choose the activation window explicitly.
4. Confirm the upgraded chain's parameters and run the checks below against an
   authorized rehearsal/staging node. Do not use production for trial writes.
5. Keep `MsgEthereumTx` circuit-breaker disabled until the separately approved
   post-v35 operational checks are complete. These PRs do not enable it. Use an
   isolated rehearsal chain where EVM submission is explicitly allowed for EVM tests.

Record deployed frontend/backend SHAs, SDK version, chain height and parameters,
and observed transaction hashes in the release record. If a downstream rollback
is necessary after v35, do not restore the old underpriced or fixed-limit senders;
pause affected submission paths and deploy a compatible correction. This runbook
does not authorize chain rollback, DB deletion, publishing, or deployment.

## [5] Verification checklist

- [ ] Inspect an actual signed native payload: final buffered gas within cap,
  `ubadge` fee at least `gas * 10`; test a higher user-selected fee too.
- [ ] Exercise a BitBadges-source IBC transfer with a hash-derived account number
  above `2^53`; verify simulation/signing preserve it. Confirm counterparty sends
  still use their own chain fee policy.
- [ ] Make simulation unavailable and verify no wallet prompt/broadcast occurs.
- [ ] On the rehearsal chain, estimate and execute an authorized precompile call
  requiring more than 5 million gas; the API should not reject it solely due to
  the old ceiling and the SDK must send the buffered estimate. Verify an actual
  revert still fails. Confirm no accepted request exceeds the node/block bound.
- [ ] Submit a bounded faucet batch; inspect its declared gas and fee and confirm
  successful inclusion. An oversized direct batch must fail before signing.
- [ ] Use a fresh ETH proof nonce: query usage before and after execution using
  `signature: nonce`, then verify repeat use is rejected by the chain.
- [ ] Index ETH and real Merkle events (including real leaf `0`) and confirm only
  Merkle events update the Merkle usage document. Check existing affected data
  separately; no automatic cleanup is included.

Local regression tests establish client behavior, not live-chain compatibility.
Unchecked items remain release gates, not completed verification.

## [6] Local checks

Use the existing lockfiles (`bun install --frozen-lockfile`) and do not copy
production secrets into worktrees. Run each command from the indicated root:

| Repository / directory | Commands |
| --- | --- |
| Frontend | `bun run test:unit --runInBand`; `bun run typecheck` |
| Indexer | `bun run test:v35` (build plus isolated route/helper regressions) |
| SDK `packages/bitbadgesjs-sdk` | `bun run test --runInBand`; `bun run build` |

The indexer targeted configuration omits the global Mongo/Redis service bootstrap;
it is not a replacement for the service-backed suite. Frontend production build
and live wallet checks remain separate. The frontend locale-check wrapper refers
to a missing indexer script; check the new en/es key directly until that unrelated
tooling issue is resolved. Indexer full lint has preexisting violations outside
this change. No dependency audit was performed (explicitly out of scope), no new
dependencies were added, and automated SAST was unavailable locally.
