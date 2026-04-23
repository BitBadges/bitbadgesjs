# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
