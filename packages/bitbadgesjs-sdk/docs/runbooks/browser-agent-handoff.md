---
title: Request browser review and verify completion
last-verified: 2026-09-20
---

Use the existing shared `request_browser_review` operation with an explicit
Cosmos artifact `{messages:[{typeUrl,value}]}`, expectedAddress and network.
CLI: `bb dev tools call request_browser_review --args-file request.json`.
MCP uses identical input and output. This starts the existing version 2 bound
browser bridge in a local background listener and returns pending request ID,
signUrl, expiry and recovery instructions without waiting for a signature.
It does not open the browser automatically: show the user the review link.
The listener survives CLI exit until callback or expiry. Large payloads use the
existing authenticated short-code upload; missing API configuration is explicit.

The matching installed bitbadges-cli must be on PATH, or set BITBADGES_CLI_PATH
to its executable or compiled JavaScript entry. Input travels over stdin, never
shell interpolation. The listener saves the same private request records as the
existing browser deployment flow. `bb dev requests resume <id>` returns the
same URL only while that listener is live. Expiry, interruption or callback loss
does not authorize resubmission; reconcile wallet/chain state first.

An optional review sidecar carries version 1 intent and evidence. Its artifact
hash includes exact message values and metadata; evidence also binds intent,
signer, network and chain. Mutation invalidates the sidecar. Browser consumers
must not treat externally supplied evidence as independently verified fact.
Intent evidence remains experimental and scoped to initial artifact configuration.
Keep these checks on the agent side; users review the existing collection preview,
permissions and wallet confirmation rather than a new audit dashboard.

Use `bb dev requests status <id> --verify` or signing_request_status with
`verify:true` for an independent receipt. Cosmos verification checks configured
chain identity, transaction hash, positive height, explicit result code and exact
protobuf message bytes. EVM checks chain ID, hash, sender, destination, value,
calldata and receipt status. Matching wallet callbacks alone remain submitted.
Signed-only, submitted, confirmed, failed and unknown are distinct.

The exported `verifyBrowserReceipt` supports browser consumers with bounded
network timeout and injectable fetch for controlled tests. RPC responses are
trusted as observations of the configured chain, not cryptographic light-client
proofs. Indexer visibility remains explicitly not-checked. Created collection IDs
are taken only from creation-specific tokenization events, not transfer/update
events containing a collection ID.

After building, `bun scripts/check-browser-handoff.ts` starts real detached
listeners through CLI and MCP, exits both initiating processes, resumes the same
request and delivers bound cancellations. It checks rejection of wrong state,
request ID, outcome and duplicate callback fields, and isolation of concurrent
requests. It needs no wallet or funded broadcast. Unit fixtures cover wrong
chain/message/hash, missing result code, stale evidence and EVM calldata changes.
This smoke uses inline payloads and a local listener; it does not establish hosted
short-code availability, external-wallet compatibility or funded-chain execution.
