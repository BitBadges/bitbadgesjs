---
title: Browser transaction handoff contract
last-verified: 2026-09-12
---

The CLI builds a transaction and the user signs it with their main wallet. A separate agent wallet is optional and is not required for this flow.

For example, `bb build send --from <main-wallet> --to <recipient> --amount 5 --denom USDC --mainnet --browser` resolves the asset and amount using the CLI denomination registry, then hands the transaction to the browser. The frontend must display the canonical asset, base units, recipient, signer and network before approval. The `send` command uses `--from` as the expected signer. Other browser actions use `--expected-address`, their explicit creator, or the configured manager; a generic transaction with no signer selection is rejected.

## Request and approval

Transaction mode uses the version 2 contract exported from `core/browser-signing.ts`: request identity, signer, deployment network, Cosmos/EVM chain IDs, expiry and messages. Local and mainnet share a Cosmos chain ID in the presets, so the deployment name and EVM chain ID are also required. Login and personal-message signing retain their existing transport.

`parseBrowserTxRequest` validates transport shape and returns detached JSON. It does not validate every module's transaction semantics. The frontend signing registry must reject unsupported types, preserve explicit senders, fill only omitted signer fields, and validate the same normalized messages that it displays and signs. `assertBrowserRequestBinding` must run immediately before signing, including after a wallet or network change. Request expiry prevents a new wallet invocation; it is not a chain-level expiry on already signed bytes.

Browser fees and gas are selected in the frontend/wallet review. CLI `--fee`, `--fee-denom` and `--gas` are not applied to the browser path. The handoff prints this distinction. Payment amount and fees must be reviewed separately.

`parseLegacyBrowserTxRequest` separately validates transaction envelopes from older CLI versions. It never infers an omitted signer or deployment and rejects versioned payloads. A compatible frontend must pin those missing values from its displayed deployment and connected wallet once when opening the review, then apply the same message and wallet checks. Such a legacy request cannot attest which network the originating CLI selected when that information was omitted. Login and personal-message payloads do not use this transaction parser.

## Results and retry

Callbacks must echo the request identity and successful outcomes must match the signer, deployment and chain. The CLI distinguishes `signed`, `submitted`, `cancelled` and `error`. A browser hash is reported as `outcome: submitted`, `confirmed: false`, `verification: unverified`; it is not independent proof of execution. A successful signing callback likewise does not independently verify the signature or compare decoded transaction bytes against the request. Confirm execution through the selected chain's transaction lookup before treating a payment as complete.

Timeout after the browser launches, or a browser-reported uncertain submission, produces `outcome: unknown`, `success: false`, `confirmed: false`, `verification: unverified`, and `retrySafe: false`. A wallet may already have submitted the transaction. Check wallet activity and transaction status before building another payment; closing the CLI listener cannot revoke a transaction. The browser must settle a request only once and report cancellation separately from an uncertain submission. Other failure outcomes do not imply that an automatic retry is safe.

## Sign-only capability and size limits

Sign-only requires an adapter that actually returns raw signed Cosmos bytes without sending. Direct EVM requests are rejected for sign-only. The frontend must also reject Cosmos-message requests routed through an EVM adapter before invoking that adapter, because some EVM signing adapters send immediately.

The loopback return currently uses a URL, not a bulk upload. Signed bytes are limited to 4096 base64 characters (at most 3072 raw bytes), leaving room for percent-encoding and request identity within ordinary HTTP header limits. The frontend must validate the result before redirecting. If signed bytes exceed this limit, return a small, bound error explaining that the bytes could not be returned; do not truncate bytes or claim success. Use another supported signing flow for larger transactions. Callback error messages are limited to 500 UTF-16 characters.

No signing or broadcasting is performed by the contract unit tests. Loopback tests use local HTTP callbacks and mocked wallet outcomes. The private frontend/indexer consumer changes are required alongside this SDK contract; an old transaction approval page cannot return a valid version 2 result.
