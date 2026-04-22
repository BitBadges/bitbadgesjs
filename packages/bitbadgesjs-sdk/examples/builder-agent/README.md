# BitBadgesAgent examples

Three scripts showing how to use the programmatic BitBadges AI builder.

## Setup

```sh
npm install bitbadges @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-...
# optional — only needed if prompts trigger query/search tools
export BITBADGES_API_KEY=bb-...
```

## Scripts

### 1. `zero-config.ts` — simplest possible usage

```ts
const agent = new BitBadgesAgent({ anthropicKey: process.env.ANTHROPIC_API_KEY });
const result = await agent.build('create a subscription for $10/mo');
console.log(result.transaction);
```

### 2. `middle-tier.ts` — bounded customization

Shows skill filters, system prompt additions, hooks, file-backed session
store, model selection, typed error handling, health checks, and the
`onCompletion` data-collection hook.

### 3. `diy-internals.ts` — unstable low-level primitives

For users who want to wire their own loop — different LLM, custom
validation, fine-tuning. Imports from `bitbadges/builder/internals`.
**Not covered by semver — may break between minor releases.**

## Running

```sh
npx ts-node examples/builder-agent/zero-config.ts
npx ts-node examples/builder-agent/middle-tier.ts
npx ts-node examples/builder-agent/diy-internals.ts
```
