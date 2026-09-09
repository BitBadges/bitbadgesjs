---
title: Public payment request rollout
last-verified: 2026-09-09
---

The PaymentRequest standard supports two shapes:

| Payer | Approvals | States |
| --- | --- | --- |
| Specific address | Pay and Deny, both scoped to that payer | pending, paid, denied, expired |
| `All` | Pay only | pending, paid, expired |

Public requests have no denial or cancellation approval. Restricting Deny to
the requester would only record a marker: the separate pay approval would
remain usable on-chain. Omitting Deny avoids presenting that marker as a
cancellation. Frozen permissions and the payment deadline remain unchanged.

Existing specific-payer collections keep their behavior. Public collections
with a pay/deny pair are rejected as nonconforming; this does not modify any
existing on-chain approval. They must be recreated as pay-only requests.

Rollout order:

1. Merge and publish the SDK change. `PaymentRequestDetails.denyApproval` is
   optional; consumers must guard it before building denial transactions.
2. Pin that published SDK version in the indexer and update its lockfile.
   Deploy the projection change before enabling public creation. It validates
   the collection and reads the overall tracker using the approval's configured
   `maxNumTransfers.amountTrackerId`.
3. Pin the same SDK release in the frontend and update its lockfile. Deploy
   the Anyone toggle and pay-only view after the indexer supports the shape.

The frontend and indexer changes are tested with the SDK worktree linked
locally. Their draft PRs require the published dependency before merge.
No chain upgrade is needed: the existing approval engine supports a single
pay approval scoped to `All`.

Verification uses local SDK, indexer projection, and frontend component tests.
No funded transaction, production migration, or deployment is part of these PRs.
