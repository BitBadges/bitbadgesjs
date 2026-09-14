---
title: Prediction redemption verification
last-verified: 2026-09-13
---

Run `bun scripts/prediction-redemption-chain.ts /absolute/path/to/accepted/bitbadgeschaind` from the SDK package. Build the binary from the accepted public chain pin, not a feature branch. The runner creates a temporary chain home, generated test keys, isolated loopback ports and synthetic genesis balances; it never opens an existing wallet. All chain state is removed on exit. Repeat with `--presets` to verify the MCP preset recipe.

The executable check requires successful pair, YES, NO and push redemptions. It checks exact wallet payouts and escrow changes, repeated claims, claims after additional positions are minted, preserved losing positions, odd push dust and residual pair redemption. All three markets end with zero collateral remaining. It does not certify oracle finality: each scenario uses one consistent verifier outcome. Independent voting challenges do not enforce mutually exclusive immutable outcomes.

The SDK quote reports policy separately from eligibility. Legacy per-initiator one-shot counters must be loaded before assuming an allowance remains. Current votes, balances, escrow liquidity, fees and other approval criteria need fresh validation before signing. An off-chain quote is not a promise of transaction success.

After `bun run build`, run `bun scripts/prediction-redemption-fixture.ts` for an isolated local HTTP fixture that executes the installed CLI and its MCP action adapter. This verifies both sides of push quotes, odd-unit rejection and winner-only unsigned proposals without any chain or wallet access.
