# Documentation ownership

The private `BitBadges/bitbadges-monorepo` owns the documentation site. It pins
this public repository at `public/js` and generates the SDK and API reference
after an accepted pin update, with scheduled reconciliation as backup. Public
SDK source, API generation and release workflows stay in this repository.

Activate and verify the parent replacement before merging removal of the old
notifier. Retire `DOCS_DISPATCH_PAT` after that handoff; do not grant a public
workflow credentials for writing to the private parent. The extra indexer route
cross-check runs in the private parent, where both sources are available.
