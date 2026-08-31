# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.44.0]

### Registry image URLs fixed (BB-45)

Both USDC registry entries (and BADGE/ATOM/OSMO) shipped
`github.com/...blob...?raw=true` image URLs; the USDC one now 404s because
the file moved in chain-registry, so consumers falling back to the SDK image
(e.g. the indexer's swap asset list for denoms Skip doesn't serve) rendered a
broken icon. All registry images now use direct, verified-200
`raw.githubusercontent.com` URLs, and a spec forbids the rot-prone
`blob/...?raw=true` style from reappearing in any registry.

### Generated protos regenerated against the v34 dependency set (BB-40)

The generated `src/proto` tree now matches the chain's v34 stack: cosmos-sdk
v0.54.4, ibc-go v11.2.0, cosmos/evm v0.7.2, plus current bitbadgeschain
master modules (tokenization/gamm/poolmanager/managersplitter). Same pipeline
as before: vendored `proto/` tree → `buf generate` with protoc-gen-es v1.10.1.

**New surface (the point of the regen):**

- `TxBody.unordered` (field 4) and `TxBody.timeoutTimestamp` (field 5) —
  cosmos-sdk 0.53+ unordered transactions. Both default to unset; a default
  `TxBody` still serializes to zero bytes, so ordinary txs are wire-identical.
- ibc-go v11 additions: transfer `Denoms`/`Denom` query surface, `token_pb`,
  `denomtrace_pb`; new (unexported) trees for channel/client/commitment v2,
  rate-limiting, packet-forward-middleware, gmp, wasm/attestations light
  clients; cosmos-sdk `epochs`/`protocolpool`/`counter`/`store` protos.
- Tokenization genesis gains `votingChallengeTrackers`,
  `votingChallengeTrackerStoreKeys`, `nextAddressListCounter`,
  `reservedProtocolAddresses` (chain master).

**BREAKING — removed by upstream, hence the minor bump (semver-0):**

- `QueryDenomTrace{,s}Request/Response` are gone from
  `proto/ibc/applications/transfer/v1` (ibc-go v11 removed the queries; the
  chain LCD already returns Not Implemented for them). Use the new
  `QueryDenoms`/`QueryDenom` surface.
- The deprecated `DenomTrace` *type* moved to `denomtrace_pb.ts` and is still
  re-exported from the transfer/v1 barrel — slated for deletion when upstream
  drops it.
- ibc-go v11 also removed the legacy `ClientUpdateProposal`,
  `UpgradeProposal`, `MsgSubmitMisbehaviour(Response)`, and commitment-v1
  `MerklePath` types, and the CometBFT 0.38 protos removed the ABCI
  `Request/ResponseBeginBlock`, `Request/ResponseEndBlock`, and
  `Request/ResponseDeliverTx` types. Nothing in the SDK/CLI/MCP referenced
  any of these.

## [0.43.1]

### Account numbers and sequences larger than 2^53 (BB-34)

Chain v34 (cosmos-sdk 0.54) assigns every NEW account a hash-derived account
number — e.g. `11715262360359940575`, larger than `Number.MAX_SAFE_INTEGER` —
and unordered-tx sequence nonces can be nanosecond timestamps. The signing
pipeline typed both as JS `number`, so `Number()`/`parseInt` silently corrupted
them and every post-v34 account produced invalid signatures (pre-v34 accounts,
with small numbers, kept working and masked the bug).

**Fix — the whole pipeline is widened to `number | string | bigint`:**

- `TxContext.sender` / `Sender`: `accountNumber` and `sequence` accept
  `number | string | bigint` (new `Uint64Like` type).
- `createSignDoc`, `createStdSignDocFromProto`, `createStdSignDigestFromProto`,
  `createTransactionWithMultipleMessages`, `createTransaction`,
  `createSignerInfo`, and the amino `makeSignDoc` all accept `Uint64Like` and
  normalize exactly once via the new exported `toUint64()` helper.
- `WalletAdapter.signDirect` / `GenericCosmosAdapter.signDirect` accept
  `Uint64Like`.
- `BitBadgesSigningClient.getAccountInfo` parses the LCD's string
  `account_number`/`sequence` as bigints (was `parseInt`); `AccountInfo`
  fields are now `number | bigint` and are bigints at runtime.
- `bb gen-tx-payload` keeps account numbers/sequences as decimal strings
  end-to-end (was `Number()`), including the `--account-number`/`--sequence`
  flags.
- `CosmosAccountResponse.account_number`/`sequence` typed `number | string`
  (the node REST API serves strings).

**Loud rejection instead of silent corruption:** a `number` above 2^53 (or any
non-integer/malformed input) now throws with a message telling you to pass the
chain's string value unchanged. **Consumers passing ordinary small numbers keep
working. Consumers must stop pre-`Number()`-ifying chain values** — pass the
LCD/indexer string (or a bigint) straight through.

**API/type-conversion layer (audited, docs + tests):** `accountNumber` and
`sequence` are NumberType generics on `iAccountDoc` / `AccountDoc` /
`BitBadgesUserInfo` — converting those docs with `Numberify` silently corrupts
post-v34 values (a pre-existing, now-documented property of `Numberify`, which
is lossy above 2^53 for anything, uint64 range sentinels included). Use
`BigIntify`, `Stringify`, or `NumberifyIfPossible`; tests pin that those three
round-trip `11715262360359940575` exactly. The SDK itself no longer
`Number()`s any account number or sequence anywhere.

## [0.43.0]

### Canonical USDC moves to the Injective route (BB-10)

BitBadges now treats Circle's native USDC on Injective (CCTP-enabled, Injective
bank denom `erc20:0xa00C59fF5a080D2b954d0c75e46E22a0c371235a`) as canonical,
carried one IBC hop over the existing BitBadges <-> Injective channel. IBC
denoms hash the *full* transfer path — with the erc20 segment checksummed
exactly as Injective's bank module spells it, since the hash is case-sensitive
— so the same underlying dollar arriving by a different route is a different
denom. Both routes are first-class registry entries.

| Denom | Trace | Registry label |
|---|---|---|
| `ibc/E1116484B327AEE59CDC3DA73D319834781A13DB2A7DFC1F38A30CD45ABF58B8` | `transfer/channel-40/erc20:0xa00C59fF5a080D2b954d0c75e46E22a0c371235a` | `USDC` (canonical) |
| `ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349` | `transfer/channel-2/uusdc` | `USDC.n` (deprecated) |

The legacy symbol is `USDC.n`, matching Skip Go's ecosystem-wide name for the
Noble voucher (including Skip's own `bitbadges-1` registry entry). The
pre-release `USDC.noble` spelling stays accepted as typed input
(`SYMBOL_INPUT_ALIASES`), but everything displayed or emitted is `USDC.n`.

**This change is additive, never substitutive.** The legacy Noble-direct denom
stays in `MAINNET_COINS_REGISTRY`, stays `skipGoSupported: true`, and keeps its
own separate balance. `USDC.n` exists only for backwards compatibility with
existing balances and collections — nothing new should be steered toward it.
There is no in-place migration: `USDC.n` holders reach canonical USDC by
exiting to Noble and swapping/CCTP-ing into native USDC on Injective, then one
IBC hop in — not IBC forwarding. Skip support is kept on for both so that swap
works. Existing collections with a backed path against the legacy denom cannot
be repointed — the backed-path escrow address is derived from the denom string
itself — so nothing recomputes those addresses.

**New exports** (`bitbadges/common/constants`):

- `USDC_DENOM` — canonical, Injective-routed.
- `USDC_NOBLE_DENOM` — legacy, Noble-direct.
- `SYMBOL_INPUT_ALIASES` — accepted typed-input symbol aliases (upper-cased
  alias → denom); currently maps the pre-release `USDC.noble` spelling to the
  legacy denom.

**New optional `CoinDetails` fields:**

- `deprecated?: boolean` — the coin still works but should not be offered for
  new activity. Consumers keep rendering balances and allow swapping out, while
  excluding it from pickers, defaults and quote destinations. Not the same as
  hiding: hiding a deprecated asset strands whoever holds it.
- `deprecationNote?: string` — human-readable reason rendered next to the coin.

**Defaults stay on canonical `USDC`.** Every default, example, and help text —
including `bb build prediction-market --denom` and the programmatic
`buildPredictionMarket` — targets canonical USDC. The Injective channel is
proven on mainnet (native USDC bridged; the canonical denom minted), and the
governance allowlist for it lands before this release publishes.

Downstream consumers (indexer, frontend) must depend on `>=0.43.0` to see the
canonical denom at all; a `^0.42.1` range will not resolve it.

## [0.36.0]

### Breaking Changes — `bitbadges-cli` flat verb-first redesign

The CLI surface was flattened — the `sdk` and `builder` umbrella nouns are gone. Every former `bitbadges-cli sdk <verb>` and `bitbadges-cli builder <verb>` is now `bitbadges-cli <verb>`. Clean break, no back-compat aliases — beta status earned the rename.

**Folded duplicates:**

| Before | After |
|---|---|
| `sdk review` + `builder review` + `builder verify` + `builder validate` | `check` (with `--depth structural \| review \| full`; default `full`) |
| `sdk interpret-tx` + `sdk interpret-collection` + `builder explain` | `explain` (auto-detects tx vs collection from input shape) |
| `sdk status` + `builder doctor` | `doctor` |

**Generalized:**

- `builder create-with-burner` → `deploy --burner` (required `--burner` flag — reserves space for future `--from <key>` and `--api-broadcast` paths without making any of them the silent default).

**Hoisted out of `builder`:**

- `builder templates <name>` → `build <name>`
- `builder tools list` → `tools` (plural, lists)
- `builder tools call <name>` → `tool <name>` (singular, invokes — kubectl-style)
- `builder burner` → `burner`
- `builder session` → `session`
- `builder resources` → `resources`

**Hoisted out of `sdk`:**

- `sdk docs` / `sdk skills` → `docs` / `skills`
- `sdk address` / `sdk alias` → `address` / `alias`
- `sdk lookup-token` → `lookup`
- `sdk gen-list-id` → `gen-list-id`

**`bitbadges-cli --help`** emits a sectioned overview (Build & Ship / Indexer / Local State / Discovery / Address & lookup / Misc). The tree itself is flat — group structure exists only in the help renderer.

Tracked in [bitbadges-autopilot backlog #0376](https://github.com/trevormil/bitbadges-autopilot/blob/main/backlog/0376-cli-flat-verb-first-redesign.md). Companion PRs: [bitbadgeschain#89](https://github.com/BitBadges/bitbadgeschain/pull/89), [bitbadges-frontend#193](https://github.com/BitBadges/bitbadges-frontend/pull/193), [bitbadges-plugin#2](https://github.com/BitBadges/bitbadges-plugin/pull/2), [bitbadges-docs#61](https://github.com/trevormil/bitbadges-docs/pull/61), [bitbadges-indexer#154](https://github.com/BitBadges/bitbadges-indexer/pull/154).

### Migration

Drop the umbrella prefix on every CLI invocation; everything else is the same flag set.

```bash
# Before
bitbadges-cli builder templates vault --backing-coin USDC
bitbadges-cli sdk review tx.json
bitbadges-cli sdk status
bitbadges-cli builder create-with-burner --msg-file col.json --manager bb1...

# After
bitbadges-cli build vault --backing-coin USDC
bitbadges-cli check tx.json
bitbadges-cli doctor
bitbadges-cli deploy --burner --msg-file col.json --manager bb1...
```

### Installation

```bash
npm install bitbadges@0.36.0
```

## [0.35.3]

### Breaking Changes

- **Removed Stripe surface area entirely.** BitBadges billing has migrated from Stripe tiers / subscriptions to on-chain APITOKEN credits (ticket #0333). If you were using any of these, migrate off before upgrading:
  - `BitBadgesAdminAPI.createPaymentIntent()`, `getConnectedAccounts()`, `deleteConnectedAccount()` — methods removed
  - `CreatePaymentIntentRoute`, `GetConnectedAccountsRoute`, `DeleteConnectedAccountRoute` — route helpers removed
  - `iCreatePaymentIntentPayload`, `iCreatePaymentIntentSuccessResponse`, `CreatePaymentIntentSuccessResponse` — request/response types removed
  - `GetConnectedAccountsSuccessResponse`, `DeleteConnectedAccountSuccessResponse` — response types removed (`responses/stripe.ts` deleted)
- **Removed Stripe-related fields from `iApiKeyDoc` / `ApiKeyDoc`**: `tier`, `stripeSubscriptionId`, `subscriptionStatus`, `currentPeriodEnd`, `cancelAtPeriodEnd`. Access-control is now address-level; the API key is a pure lookup token, and billing reads from `iCreatorCreditsDoc.apiTokensUsed` against the on-chain APITOKEN balance.
- **Unified `iCreatorCreditsDoc` counter**: dropped the separate `aiTokensUsed` and `apiRequestsUsed` fields in favor of a single `apiTokensUsed` that captures combined spend across the AI Builder and the main API-metering middleware.

### Installation

```bash
npm install bitbadges@0.35.3
```

## [0.35.1]

### New Features

- **Smart token-type inference** (`BitBadgesBuilderAgent`): When the caller's `selectedSkills` has no token-type entry, the agent auto-classifies the prompt and prepends a single high-confidence token-type skill. Two signals: deterministic standards → skill lookup (for refine/update flows with an existing collection) and a haiku classifier fallback. Returns `null` when confidence is low — freestyle build is a valid outcome. Surfaced as `result.inferredTokenType` / `inferredTokenTypeSource` / `inferredTokenTypeReasoning`.
  - New constructor option `autoInferTokenType?: boolean` (default `true`) and per-build `BuildOptions.autoInferTokenType` override.
  - New exports: `inferTokenTypeFromPrompt`, `getTokenTypeSkillIds`, `getTokenTypeSkills`, `STANDARD_TO_TOKEN_TYPE`, `extractStandards`, `inferFromStandards`.
  - `liquidity-pools` skill recategorized from `'standard'` to `'token-type'` to match the frontend marketplace grouping.

- **Deterministic SVG placeholder-art generator**: Replaces the hardcoded BitBadges default logo fallback with `data:image/svg+xml;base64,...` art seeded by the collection name. Five center-aligned presets (`gradient-mono`, `geometric-tile`, `orbital`, `mesh`, `glyph`; `letterform` remains callable via explicit pin) × 24 curated palettes.
  - New MCP tool `generate_placeholder_art({ seed, style?, symbol?, vibe?, paletteName? })` — returns `imageUri`.
  - `get_transaction` post-step now fills unresolved `IMAGE_N` placeholders, scrubs legacy default-logo URIs, and fills empty-string images on non-approval sidecar entries — all reusing one generated piece of art per build.
  - System prompt mandates calling `generate_placeholder_art` as the first tool call when no images are uploaded.

### Installation

```bash
npm install bitbadges@0.35.1
```

## [0.31.0] - BREAKING CHANGES

### Breaking Changes

- **Removed `iSocialConnections`**: The `iSocialConnections` interface and `socialConnections`/`publicSocialConnections` fields on `iProfileDoc` have been removed. Social connection tracking is no longer part of the SDK.
- **Removed `OauthAppName` type**: Individual OAuth app name union type removed; plugins now handle auth generically.
- **Simplified `ClaimIntegrationPluginType`**: Removed hardcoded plugin types (`discord`, `github`, `google`, `twitch`, `twitter`, `strava`, `email`, `ip`, `webhooks`, `successWebhooks`, `payments`, etc.). The type now uses a minimal set plus `string` for custom plugins.
- **Removed `OAuthAppParams` interface**: OAuth configuration is no longer part of claim plugin params.
- **Removed `captcha` from `ClaimIntegrationPluginCustomBodyType`**: Captcha is no longer a built-in claim body type.
- **Removed `GetAttemptDataFromRequestBin` route and types**: `GetAttemptDataFromRequestBinRoute` removed from `BitBadgesApiRoutes`.
- **Removed `signOutEmail` from `iSignOutPayload`**: Email sign-out is no longer a separate option.
- **PromptSkillDoc breaking field renames**: `title` → `name`, added `image`, removed `rating`/`numRatings`, added `toPublish`.
- **Plugin management renames**: `iCreatePromptSkillPayload` and `iUpdatePromptSkillPayload` updated with `name`/`image`/`toPublish` fields replacing `title`.

### New Features

- **`GetCreatorPluginsRoute`**: New route `/api/v0/plugins/creator` and `getCreatorPlugins()` API method to fetch all plugins by creator address.
- **`aiTokensUsed` on `iCreatorCreditsDoc`**: Track AI Builder token usage per billing period.
- **`GetPluginErrors` fix**: Now correctly passes query params to the API.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.31.0
```

## [0.30.0]

### Version Compatibility

- **BitBadges Chain v25**: 0.30.0 corresponds to BitBadges chain v25 upgrades

### What's New

- **EVM query challenges**: URI and custom data are now correctly handled for all EVM query challenge flows:
  - Collection invariants (`CollectionInvariants`, `CollectionInvariantsWithDetails`) and their proto serialization
  - `InvariantsAddObject` for create/update collection messages (previously `evmQueryChallenges` were not supported; now full round-trip with `uri` and `customData`)
  - Approval criteria (`ApprovalCriteria`, `OutgoingApprovalCriteria`, `IncomingApprovalCriteria`) when serializing to proto
- Added `toProto()` on `EVMQueryChallenge` and explicit mapping in approval criteria so `uri`/`customData` are always included when building protobuf messages
- See [BitBadges Chain v25 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v25) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.30.0
```

## [0.29.0]

### Version Compatibility

- **BitBadges Chain v24**: 0.29.0 corresponds to BitBadges chain v24 upgrades

### What's New

- Updated EVM chain IDs for v24 chain upgrade:
  - Mainnet chain ID changed from `90124` to `50024`
  - Testnet chain ID changed from `90125` to `50025`
- See [BitBadges Chain v24 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v24) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.29.0
```

## [0.28.0]

### Version Compatibility

- **BitBadges Chain v23**: 0.28.0 corresponds to BitBadges chain v23 upgrades

### What's New

- See [BitBadges Chain v23 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v23) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.28.0
```

## [0.27.0]

### Version Compatibility

- **BitBadges Chain v22**: 0.27.0 corresponds to BitBadges chain v22 upgrades

### What's New

- Added support for swap activities API endpoints
- Added support for on-chain dynamic store API endpoints
- See [BitBadges Chain v22 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v22) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.27.0
```

## [0.26.0]

### Version Compatibility

- **BitBadges Chain v21**: 0.26.0 corresponds to BitBadges chain v21 upgrades

### What's New

- See [BitBadges Chain v21 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v21) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.26.0
```

## [0.24.0]

### Version Compatibility

- **BitBadges Chain v19**: 0.24.0 corresponds to BitBadges chain v19 upgrades

### What's New

- Added `assetPath` field to `iEstimateSwapSuccessResponse` with support for `denom`, `chainId`, and `how` properties
- See [BitBadges Chain v19 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v19) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.24.0
```

## [0.23.0]

### Version Compatibility

- **BitBadges Chain v18**: 0.23.0 corresponds to BitBadges chain v18 upgrades

### What's New

- Updated sorting logic to match proto marshal's byte-order comparison (prioritizing capital letters over lowercase)
- Added support for `MsgSwapExactAmountInWithIBCTransfer` message type
- See [BitBadges Chain v18 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v18) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.23.0
```

## [0.21.0]

### Version Compatibility

- **BitBadges Chain v16**: 0.21.0 corresponds to BitBadges chain v16 upgrades

### What's New

- See [BitBadges Chain v16 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v16) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.21.0
```

## [0.20.0]

### Version Compatibility

- **BitBadges Chain v14**: 0.20.0 corresponds to BitBadges chain v14 upgrades
- **BitBadges Chain v15**: 0.20.0 corresponds to BitBadges chain v15 upgrades

### What's New

- See [BitBadges Chain v14 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v14) for more details.
- See [BitBadges Chain v15 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v15) for more details.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.20.0
```

## [0.19.0]

### Version Compatibility

- **BitBadges Chain v13**: 0.19.0 corresponds to BitBadges chain v13 upgrades

### What's New

- See [BitBadges Chain v13 release information](https://github.com/BitBadges/bitbadgeschain/releases/tag/v13) for more details.

TLDR: We expanded the functionality of mustOwnTokens to include different checks and handled some edge cases.

### Installation

```bash
npm install bitbadgesjs-sdk@^0.19.0
```
