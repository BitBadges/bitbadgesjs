import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { invokeWorker, type ExecutionEvidence } from './model-runner.js';
import type { BehavioralCase } from './catalog.js';

const scenarios: Record<string, string[]> = {
  'subscription-fixed-price': ['subscription-paid', 'subscription-consent-and-locks'],
  'invoice-direct-payment': ['invoice', 'invoice-evidence', 'invoice-deadline-1896048000000', 'invoice-deadline-1896048000001'],
  'backed-token': ['backed'],
  'purchasable-credits': ['credits-purchase'],
  'spendable-service-credits': ['spendable-credits'],
  nft: ['nft'],
  fungible: ['fungible']
};
const scenarioSchema = z
  .object({
    id: z.string().optional(),
    actors: z.array(z.object({ name: z.string(), address: z.string() }).passthrough()).optional(),
    steps: z
      .array(
        z
          .object({
            id: z.string(),
            actor: z.string().optional(),
            message: z.object({ typeUrl: z.string(), value: z.record(z.unknown()) }).optional(),
            expect: z.object({ success: z.boolean() }).passthrough().optional(),
            assertions: z.array(z.object({ kind: z.string() }).passthrough()).min(1)
          })
          .passthrough()
      )
      .min(1)
  })
  .passthrough();
const reportSchema = z
  .object({
    version: z.literal(1),
    id: z.string(),
    passed: z.boolean(),
    execution: z.literal('module'),
    chainCommit: z.string().regex(/^[a-f0-9]{40}$/),
    scenarioHash: z.string().regex(/^[a-f0-9]{64}$/),
    coverage: z.object({ excluded: z.array(z.string()) }).passthrough(),
    steps: z.array(
      z
        .object({
          id: z.string(),
          passed: z.boolean(),
          success: z.boolean(),
          assertions: z.array(z.object({ kind: z.string(), passed: z.boolean() }).passthrough())
        })
        .passthrough()
    )
  })
  .passthrough();

export function verifyExecutionReport(input: unknown, output: unknown): ExecutionEvidence {
  const scenario = scenarioSchema.parse(input);
  const report = reportSchema.parse(output);
  if (
    report.scenarioHash !== createHash('sha256').update(JSON.stringify(input)).digest('hex') ||
    (scenario.id && scenario.id !== report.id) ||
    report.steps.length !== scenario.steps.length
  )
    throw new Error('Execution evidence does not match scenario');
  for (let i = 0; i < scenario.steps.length; i++) {
    const expected = scenario.steps[i];
    const actual = report.steps[i];
    if (
      actual.id !== expected.id ||
      actual.assertions.length !== expected.assertions.length ||
      actual.assertions.some((check, j) => check.kind !== expected.assertions[j].kind)
    )
      throw new Error('Execution evidence omitted or changed checks');
    const passed =
      actual.assertions.every((check) => check.passed) && (expected.expect ? actual.success === expected.expect.success : actual.success);
    if (actual.passed !== passed) throw new Error('Execution verdict contradicts assertions');
  }
  if (report.passed !== report.steps.every((step) => step.passed)) throw new Error('Execution summary contradicts steps');
  return {
    passed: report.passed,
    scope: report.execution,
    sourceCommit: report.chainCommit,
    scenarioHash: report.scenarioHash,
    excluded: report.coverage.excluded
  };
}

export function lifecycleExecutor(executable: string, scenarioDirectory: string) {
  return async (test: BehavioralCase, artifact: unknown, timeoutMs = 60000): Promise<ExecutionEvidence> => {
    const files = scenarios[test.lifecycle ?? ''];
    if (!files) throw new Error('No trusted lifecycle scenario for ' + test.id);
    const evidence: ExecutionEvidence[] = [];
    const started = Date.now();
    for (const file of files) {
      const scenario = JSON.parse(readFileSync(join(scenarioDirectory, file + '.json'), 'utf8'));
      scenarioSchema.parse(scenario);
      const create = scenario.steps.find((step: any) => step.id === 'create');
      if (!create?.message) throw new Error('Trusted scenario has no create step');
      const message = z
        .object({ typeUrl: z.string(), value: z.record(z.unknown()) })
        .strict()
        .parse(JSON.parse(JSON.stringify(artifact)));
      const actor = scenario.actors.find((entry: any) => entry.name === create.actor)?.address;
      if (!actor) throw new Error('Trusted scenario is missing creation actor');
      if (!message.value.creator) message.value.creator = actor;
      if (!message.value.manager) message.value.manager = actor;
      create.message = message;
      const remaining = timeoutMs - (Date.now() - started);
      if (remaining <= 0) throw new Error('Lifecycle time budget exhausted');
      const report = await invokeWorker(
        { executable, args: [], timeoutMs: remaining, maxOutputBytes: 10000000, environment: {}, acceptedExitCodes: [0, 1] },
        scenario
      );
      evidence.push(verifyExecutionReport(scenario, report));
    }
    return {
      passed: evidence.every((item) => item.passed),
      scope: 'module',
      sourceCommit: evidence[0].sourceCommit,
      scenarioHash: createHash('sha256')
        .update(JSON.stringify(evidence.map((item) => item.scenarioHash)))
        .digest('hex'),
      excluded: [...new Set(evidence.flatMap((item) => item.excluded))]
    };
  };
}
