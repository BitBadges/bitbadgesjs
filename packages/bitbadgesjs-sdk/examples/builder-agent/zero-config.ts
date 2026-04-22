/**
 * BitBadgesAgent — zero-config example.
 *
 * Requires `ANTHROPIC_API_KEY` in the environment (or pass
 * `anthropicKey` explicitly).  `BITBADGES_API_KEY` is optional — only
 * needed if the prompt triggers query/search/simulate tools.
 *
 * Run:
 *   ANTHROPIC_API_KEY=sk-... npx ts-node examples/builder-agent/zero-config.ts
 */

import { BitBadgesAgent } from '../../src/builder/agent/index.js';

async function main() {
  const agent = new BitBadgesAgent({
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    defaultCreatorAddress: 'bb1examplecreator000000000000000000000000'
  });

  const result = await agent.build('Create a subscription token for $10/month. Max 100 subscribers.', {
    selectedSkills: ['subscription']
  });

  console.log(result.toString());
  console.log('\nTransaction:\n', JSON.stringify(result.transaction, null, 2).slice(0, 2000), '...');

  if (!result.valid) {
    console.error('\nErrors:');
    for (const err of result.errors) console.error(`  - [${err.code}] ${err.message}`);
  }
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
