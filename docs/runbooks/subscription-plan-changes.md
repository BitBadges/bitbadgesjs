---
title: Review a future subscription renewal change
last-verified: 2026-09-17
---

`planSubscriptionChange` prepares a change of renewal consent between two subscription tiers. It preserves purchased access and unrelated incoming approvals. Its first new ownership interval begins after the latest remaining source ownership interval, including prepaid future periods. Its result includes the first payment-window start; a charge can precede the new access date.

```sh
bb subscriptions change-renewal 28 --creator bb1subscriber... \
  --tier subscription-tier-1 --to-tier subscription-tier-2 --tip 0
```

Review `renewalChange.effectiveAt`, `chargeStartsAt`, target coin transfers, and the single `MsgUpdateUserApprovals` before deploying the returned `messages` through the normal signing workflow. The MCP equivalent is `standard_subscriptions_change_renewal` with `collectionId`, `creator`, `tier`, `toTier`, and optional `tip` and `approvalId`. The tip uses target denomination base units. This command does not sign or broadcast.

The caller supplies known balances, incoming approvals and matching source/target collection approvals to the SDK helper. Inputs and results use bigint units. Missing state, duplicate approval identities, identical tiers, no finite remaining paid access, an existing target position/consent, and unavailable first charge windows are rejected. All same-denomination payout entries are included in the new reimbursement.

Consent is not a successful charge: an operator must execute and pass on-chain checks. Revoke the target tier's consent with `bb subscriptions cancel` to stop subsequent renewals; that does not refund target periods already purchased or reinstate the original consent.

## Race and review limits

Re-read access, approvals and target terms immediately before signing. The emitted 60-second review deadline is advisory; `MsgUpdateUserApprovals` does not enforce it or compare prior balances/approval lists. An old renewal mined before the change preserves its purchased access and can overlap the new tier at the reviewed fixed date. Concurrent whole-list approval updates can overwrite one another. Coordinate changes by one account and inspect confirmed chain state afterward.

This feature does not provide immediate entitlement exchange, proration, automatic refunds, account credits, cross-collection switching or sponsor/beneficiary separation. A refund requires a funded authorized payer; current ownership does not prove original payment, refundable consumption or the refund recipient. Frozen faucet terms cannot be rewritten to update existing signed consent.

Verification: `bun run test:unit --runInBand src/core/subscriptionPlanChange.spec.ts src/cli/commands/subscription-change.spec.ts src/builder/tools/standardActions.spec.ts`. The private consumer's disposable chain test verifies paid-access preservation, target minting at the reviewed boundary, duplicate rejection and the overlapping-renewal race.
