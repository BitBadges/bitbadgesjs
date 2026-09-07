---
title: EIP-712 GAMM and sendmanager interoperability
last-verified: 2026-09-07
---

The frontend payload factory exposes EIP-712 for the ten routed GAMM messages
and both sendmanager messages. GAMM converters already existed; sendmanager
requires the chain companion's LegacyAmino registration and this SDK's generated
proto classes, Amino converters and ProtoTypeRegistry entries. No frontend
signing-selection change is needed. The published SDK 0.45.0 and v35 binaries
are unchanged by these PRs.

From packages/bitbadgesjs-sdk, run `bun run test --runInBand src/eip712/module-messages.spec.ts`.
It covers payload generation, signature verification and tampered memo rejection.
Its JSON fixture is shared with the chain's app/testdata/eip712-module-messages.json,
where SDK-signed envelopes are decoded and verified by the app ante handler.
To regenerate, prefix the test command with UPDATE_EIP712_MODULE_FIXTURES=1,
then copy the fixture to the chain and run both suites. This does not claim live
pool/IBC execution for every message.

Use scaled integer strings for balancer protobuf fee fields. Stableswap message
services remain disabled in the chain; signing support does not enable them.
Publish/adopt this SDK with the subsequent chain release that enables sendmanager
EIP-712. Keep the already published v35 tag/assets immutable.
