import { z } from 'zod';
import { artifactIdentity, verifyIntent } from '../core/intent.js';
import { runLifecycle, type RunnerOptions } from './lifecycle.js';

const message = z.object({ typeUrl: z.string(), value: z.record(z.unknown()) }).strict();
export const lifecycleIntentSchema = z.object({
  artifact: z.object({ messages: z.array(message).min(1) }).strict(),
  intent: z.unknown(),
  scenario: z.object({ steps: z.array(z.object({ message: message.optional(), messages: z.array(message).optional() }).passthrough()).min(1) }).passthrough(),
  requiredCoverage: z.array(z.string()).max(30).optional()
}).strict();

export async function verifyLifecycleIntent(input: unknown, opts: RunnerOptions = {}) {
  const args = lifecycleIntentSchema.parse(input);
  const first = args.scenario.steps[0];
  if (first.message && first.messages) throw new Error('The first scenario step must contain one artifact message representation.');
  const initialMessages = first.message ? [first.message] : first.messages;
  if (!initialMessages || artifactIdentity({ messages: initialMessages }) !== artifactIdentity(args.artifact)) {
    throw new Error('The first scenario step must execute the exact artifact messages. Bind fixture addresses explicitly before checking; no implicit substitutions are performed.');
  }
  const staticEvidence = verifyIntent(args.artifact, args.intent);
  const lifecycle = await runLifecycle({ scenario: args.scenario, requiredCoverage: args.requiredCoverage }, opts);
  const requirements = staticEvidence.requirements.map(requirement => requirement.status === 'violated' ? requirement : ({
    requirementId: requirement.requirementId, status: 'unverified' as const, source: 'none' as const, paths: requirement.paths,
    reason: 'Static findings are retained separately. Supplied scenario assertions do not establish complete coverage of this requirement or manager bypasses.'
  }));
  return {
    version: 1, artifactId: staticEvidence.artifactId, intentId: staticEvidence.intentId,
    status: staticEvidence.status === 'violated' || lifecycle.status === 'violated' ? 'violated' : 'unverified',
    requirements, staticEvidence, lifecycle,
    coverage: { executed: ['static-artifact', 'module-scenario'], unverified: [...new Set([...staticEvidence.coverage.unverified.filter(scope => scope !== 'lifecycle'), ...lifecycle.coverage.excluded, 'requirement-to-scenario-coverage'])] },
    nextAction: 'Inspect observed scenario results against independent requirement oracles. A passing supplied scenario does not prove complete intent or manager-bypass coverage.'
  };
}
