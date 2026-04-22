/**
 * BitBadgesBuilderAgent — customization example.
 *
 * Demonstrates the bounded-customization surface: skill filter,
 * system prompt append, hooks, file-backed session store, model
 * selection, validation strictness. All QoL-friendly — typed errors,
 * parsed tool output, cost reporting.
 */

import {
  BitBadgesBuilderAgent,
  FileStore,
  ValidationFailedError,
  QuotaExceededError
} from '../../src/builder/agent/index.js';

async function main() {
  const agent = new BitBadgesBuilderAgent({
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    bitbadgesApiKey: process.env.BITBADGES_API_KEY, // optional
    model: 'sonnet',
    validation: 'strict',
    skills: ['subscription', 'fungible-token', 'nft'],
    systemPromptAppend: 'Always include a season tag in custom data. Always set manager permissions to "locked-approvals".',
    maxRounds: 8,
    fixLoopMaxRounds: 3,
    sessionStore: new FileStore({ dir: './.agent-sessions' }),
    hooks: {
      onTokenUsage: (u) => console.log(`  [tokens] round=${u.round} in=${u.inputTokens} out=${u.outputTokens} cost=$${u.cumulativeCostUsd.toFixed(4)}`),
      onToolCall:   (e) => console.log(`  [tool] ${e.name} (${e.durationMs}ms)`),
      onStatusUpdate: (s) => console.log(`  [status] ${s}`),
      onCompletion: (trace) => console.log(`  [done] rounds=${trace.rounds} fixRounds=${trace.fixRounds} promptHash=${trace.systemPromptHash}`)
    },
    debug: false,
    defaultCreatorAddress: 'bb1examplecreator000000000000000000000000'
  });

  // Quick credentials check
  const health = await agent.healthCheck();
  console.log('Health:', health);
  if (!health.anthropic.ok) process.exit(1);

  try {
    const result = await agent.build('Create a quarterly subscription for $30/quarter. Allow up to 500 subscribers.', {
      sessionId: 'demo-session',
      selectedSkills: ['subscription']
    });
    console.log(result.toString());
    console.log('valid:', result.valid, 'cost:', `$${result.costUsd.toFixed(4)}`, 'tokens:', result.tokensUsed);
  } catch (err) {
    if (err instanceof ValidationFailedError) {
      console.error('\nValidation failed:');
      for (const e of err.errors) console.error(`  - [${e.code}] ${e.message}`);
      console.error('Advisory:', err.advisoryNotes);
    } else if (err instanceof QuotaExceededError) {
      console.error('Token quota exceeded');
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
