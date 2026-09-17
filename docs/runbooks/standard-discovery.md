---
title: Standard discovery
last-verified: 2026-09-14
---

# Standard discovery

Use the installed CLI as the source of supported commands. Discovery is offline and never signs or submits a transaction.

```sh
bb dev standards
bb dev standards subscription
bb dev standards payment-request-v2
bb dev capabilities standard_subscriptions_cancel
bb build payment-request-v2 --example installments
```

The compact catalog lists standard and template IDs. Detail returns builder and lifecycle action references, required input names, constraints, unsupported operations, and invoice display categories. `schemaCommand` points to the existing installed operation schema; it is not a second schema definition. Native command help documents additional options and runtime requirements. A missing adapter is explicit: empty `builders` or `actions` does not mean the underlying token module cannot express a custom design. The NFT family, for example, points to native marketplace CLI help while not claiming a dedicated collection builder or shared MCP action adapter.

`get_standards` exposes the same data over MCP. In-process consumers can import `getStandardCatalog`, `StandardDescriptor`, and `StandardOperation` from `bitbadges/builder/registry`. Use this Node-oriented registry during tooling or documentation generation, not inside a browser bundle. Private applications may attach their own route map by `frontendFamily`; this SDK does not embed application routes.

## Validation boundaries

`validation.tagRecognition` is `hint-only`. A collection advertising a standard is not certified to follow its required approval shape. `inputSchema` is operation-specific structural validation, not proof of transaction success. `semanticConformance` and `eligibility` are `not-evaluated`: catalog discovery has not fetched a collection, trackers, permissions, fees, or balances. Individual builders and action handlers apply their own runtime checks, and more detailed semantic validation may reject a tagged collection.

Fetch current state, review exact recipients and amounts, simulate when available, then separately request the human to sign with the browser flow or use an explicitly authorized agent wallet. Do not infer authority to manage a collection from being able to construct it. Failed or missing balance and tracker reads are not zero balances or absent consent. Unknown transaction outcomes require reconciliation before retrying.

## Approval replacement

Subscription consent commands fetch the current incoming approvals before constructing a replacement and preserve unrelated approvals. Missing approval arrays and failed requests abort instead of generating an empty replacement. Explicit empty arrays are valid state. This is not atomic compare-and-swap: a second writer may change approvals after the read or while a browser signing request waits. Re-read and rebuild after another approval edit; do not replay a stale whole-list replacement. Native per-approval operations or chain-level compare-and-swap need a separate design before claiming race-free replacement.

## Lifecycle distinctions

Canceling subscription renewal consent does not refund paid access. Future prepaid access is not current access, and recorded consent does not guarantee successful renewal. Plan switching and prorations are not implemented by this catalog.

Invoice payments transfer to configured recipients directly. They are not conditional-release escrow. V2 invoices and payment links do not inherit the legacy payment-request deny branch. The custom invoice category combines validated terms and intentionally has no invented example command.

Credit quotes exclude protocol and network fees; minted balances are not an off-chain service usage ledger. Product purchases do not verify delivery or imply refund support. Vault builders expose core configurations without certifying autonomous custody or implementing interest accrual.
