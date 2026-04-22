/**
 * BitBadgesBuilderAgent — DIY example using `bitbadges/builder/internals`.
 *
 * The /internals subpath is UNSTABLE and may break in minor releases.
 * Use it when you want to run your own agent loop (different LLM,
 * custom validation strategy, fine-tuning, etc.) on top of the
 * BitBadges tool registry.
 */

import {
  buildSystemPrompt,
  DOMAIN_KNOWLEDGE,
  assemblePromptParts,
  runAgentLoop,
  runValidationGate,
  createAgentToolRegistry,
  getAnthropicClient
} from '../../src/builder/agent/internals.js';
import { resolveModel } from '../../src/builder/agent/index.js';

async function main() {
  // The full system prompt + domain knowledge constants are public here.
  console.log('System prompt bytes:', buildSystemPrompt('create').length);
  console.log('Domain-knowledge bytes:', DOMAIN_KNOWLEDGE.length);

  const client = await getAnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY });
  const registry = createAgentToolRegistry({ defaultArgs: { apiKey: process.env.BITBADGES_API_KEY } });
  const model = resolveModel('sonnet');

  const prompt = await assemblePromptParts({
    prompt: 'Create an NFT collection with 50 pieces',
    creatorAddress: 'bb1examplecreator000000000000000000000000',
    selectedSkills: ['nft'],
    promptSkillIds: [],
    isRefinement: false,
    isUpdate: false
  });

  const sessionId = `diy-${Date.now()}`;
  const loop = await runAgentLoop({
    client,
    systemPrompt: prompt.systemPrompt,
    userMessage: prompt.userMessage,
    registry,
    sessionId,
    creatorAddress: 'bb1examplecreator000000000000000000000000',
    model,
    maxRounds: 8,
    maxTokensPerBuild: 500_000,
    anthropicTimeoutMs: 120_000
  });

  // Pull the composed transaction out of the SDK session and validate.
  const { handleGetTransaction } = await import('../../src/builder/tools/index.js');
  const txResp = await handleGetTransaction({ sessionId } as any);
  const transaction = (txResp as any)?.transaction ?? txResp;

  const gate = await runValidationGate({
    transaction,
    creatorAddress: 'bb1examplecreator000000000000000000000000'
  });

  console.log(`\nBuild: ${loop.rounds} rounds, ${loop.totalTokens} tokens, valid=${gate.valid}`);
  if (!gate.valid) {
    console.log('Errors:', gate.hardErrors);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
