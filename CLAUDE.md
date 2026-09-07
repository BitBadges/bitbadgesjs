# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BitBadges JS is the TypeScript SDK monorepo for BitBadges.
Covers API clients, tx signing, addresses, proto, builder MCP, and bb CLI.

Short maintainer map for day-to-day repo work.

## Repository Layout

- packages/bitbadgesjs-sdk/ only package; run install/build/test there
- .github/workflows/: test.yml, CodeQL, OpenAPI gen, docs notify

- no root package.json; do not invent root workspace scripts

### SDK source (packages/bitbadgesjs-sdk/src/)

- api-indexer/, transactions/, signing/, proto/, address-converter/
- core/, builder/ (MCP bitbadges-builder), cli/ (bb), blockin/
- eip712/, gamm/, common/, interfaces/, node-rest-api/

## Common Development Commands

Run from packages/bitbadgesjs-sdk. Prefer Bun (CI: oven-sh/setup-bun + frozen-lockfile).

- bun install --frozen-lockfile
- bun run build | clean | prepare
- bun run test | test:ci | test:unit | test:integration | format
- bun run gen:customtypes | generate-api-routes
- bitbadges-builder ; bb --help

CI Run Tests: Node 18 + Bun, then bun install and bun run test in packages/bitbadgesjs-sdk.

## Architecture Notes

- Publish/import as bitbadges
- Prefer MCP bitbadges-builder emitting MsgUniversalUpdateCollection for collection flows
- Number converters: BigIntify / Numberify / Stringify
- Do not weaken tests; no secrets in commits

## Related Repos

- BitBadges/bitbadges-frontend
- BitBadges/bitbadges-indexer
- BitBadges/bitbadgeschain
- trevormil/bitbadges-docs
