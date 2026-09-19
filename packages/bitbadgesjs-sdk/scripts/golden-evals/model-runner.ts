import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { z } from 'zod';
import { gradeBehavior, publicCase, type BehavioralCase } from './catalog.js';
import { redactTrace, summarizeTrials, type Trial } from './reports.js';

const positive = z.number().int().positive();
export const configSchema = z
  .object({
    executable: z.string().refine(isAbsolute, 'Executable must be an absolute path'),
    args: z.array(z.string()),
    provider: z.string().min(1),
    model: z.string().min(1),
    repetitions: positive.max(20),
    maxAttempts: positive.max(5),
    timeoutMs: positive.max(600000),
    maxOutputBytes: positive.max(10000000),
    maxInputTokens: positive,
    maxOutputTokens: positive,
    maxRunMs: positive,
    maxCostUsd: z.number().finite().nonnegative(),
    inputUsdPerMillion: z.number().finite().nonnegative(),
    outputUsdPerMillion: z.number().finite().nonnegative(),
    environment: z.record(z.string()).default({})
  })
  .strict()
  .refine(
    (value) => value.provider === 'fixture' || value.inputUsdPerMillion + value.outputUsdPerMillion > 0,
    'Live providers require explicit nonzero token prices'
  );
export type AgentEvalConfig = z.infer<typeof configSchema>;
type WorkerConfig = Pick<AgentEvalConfig, 'executable' | 'args' | 'timeoutMs' | 'maxOutputBytes' | 'environment'> & { acceptedExitCodes?: number[] };

export async function invokeWorker(config: WorkerConfig, request: unknown): Promise<unknown> {
  const directory = mkdtempSync(join(tmpdir(), 'bb-agent-eval-'));
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(config.executable, config.args, {
        cwd: directory,
        env: { ...config.environment, HOME: directory, TMPDIR: directory, BITBADGES_CONFIG_DIR: directory },
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: process.platform !== 'win32'
      });
      let output = '';
      let bytes = 0;
      let failure: Error | undefined;
      const stop = (message: string) => {
        if (failure) return;
        failure = new Error(message);
        if (child.pid) {
          try {
            process.platform === 'win32' ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL');
          } catch {
            child.kill('SIGKILL');
          }
        }
      };
      const timer = setTimeout(() => stop('Worker timeout'), config.timeoutMs);
      const collect = (chunk: Buffer, stdout: boolean) => {
        bytes += chunk.length;
        if (bytes > config.maxOutputBytes) stop('Worker output limit exceeded');
        else if (stdout) output += chunk.toString('utf8');
      };
      child.stdout.on('data', (chunk) => collect(chunk, true));
      child.stderr.on('data', (chunk) => collect(chunk, false));
      child.on('error', () => {
        clearTimeout(timer);
        reject(new Error('Worker could not start'));
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (failure) return reject(failure);
        if (code === null || !(config.acceptedExitCodes ?? [0]).includes(code)) return reject(new Error('Worker exited with code ' + code));
        try {
          resolve(JSON.parse(output));
        } catch {
          reject(new Error('Worker did not return one JSON result'));
        }
      });
      child.stdin.on('error', () => {});
      child.stdin.end(JSON.stringify(request));
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const usageCount = z.number().int().nonnegative().nullable();
const workerResult = z
  .object({
    response: z.unknown(),
    usage: z.object({ inputTokens: usageCount, outputTokens: usageCount, toolCalls: usageCount }).strict(),
    trace: z.array(z.unknown()).default([])
  })
  .strict();
export type ExecutionEvidence = { passed: boolean; scope: string; sourceCommit: string; scenarioHash: string; excluded: string[] };
type Execute = (test: BehavioralCase, artifact: unknown, timeoutMs: number) => Promise<ExecutionEvidence>;

export async function runAgentTrials(cases: BehavioralCase[], input: AgentEvalConfig, execute?: Execute) {
  const config = configSchema.parse(input);
  if (!cases.length || cases.length > 100 || new Set(cases.map((test) => test.id)).size !== cases.length)
    throw new Error('Expected unique nonempty case set (maximum 100)');
  const immutableCases: BehavioralCase[] = JSON.parse(JSON.stringify(cases));
  const caseSetSha256 = createHash('sha256').update(JSON.stringify(immutableCases)).digest('hex');
  const start = Date.now();
  const reservation = (config.maxInputTokens * config.inputUsdPerMillion + config.maxOutputTokens * config.outputUsdPerMillion) / 1000000;
  let reservedCostUsd = 0;
  const trials: Trial[] = [];
  const evidence: { caseId: string; trial: number; attempts: unknown[]; execution?: ExecutionEvidence; error?: string }[] = [];
  for (const test of immutableCases) {
    for (let trial = 0; trial < config.repetitions; trial++) {
      const began = Date.now();
      const row: Trial = {
        caseId: test.id,
        trial,
        status: 'fail',
        firstAttemptPassed: false,
        repairs: 0,
        falseAssurance: false,
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        toolCalls: 0,
        costUsd: 0
      };
      const record: (typeof evidence)[number] = { caseId: test.id, trial, attempts: [] };
      const history: unknown[] = [];
      let observedUsage = false;
      let awaitingUsage = false;
      try {
        for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
          if (Date.now() - start >= config.maxRunMs) throw new Error('Run time budget exhausted');
          if (reservedCostUsd + reservation > config.maxCostUsd) throw new Error('Cost reservation budget exhausted');
          reservedCostUsd += reservation;
          awaitingUsage = true;
          const raw = await invokeWorker(
            { ...config, timeoutMs: Math.min(config.timeoutMs, config.maxRunMs - (Date.now() - start)) },
            {
              version: 1,
              task: publicCase(test),
              history,
              settings: {
                provider: config.provider,
                model: config.model,
                maxInputTokens: config.maxInputTokens,
                maxOutputTokens: config.maxOutputTokens
              }
            }
          );
          const result = workerResult.parse(raw);
          awaitingUsage = false;
          observedUsage = true;
          for (const key of ['inputTokens', 'outputTokens', 'toolCalls'] as const) {
            row[key] = row[key] === null || result.usage[key] === null ? null : row[key]! + result.usage[key]!;
          }
          row.costUsd =
            row.inputTokens === null || row.outputTokens === null
              ? null
              : (row.inputTokens * config.inputUsdPerMillion + row.outputTokens * config.outputUsdPerMillion) / 1000000;
          if ((result.usage.inputTokens ?? 0) > config.maxInputTokens || (result.usage.outputTokens ?? 0) > config.maxOutputTokens)
            throw new Error('Worker exceeded token budget');
          const grade = gradeBehavior(test, result.response);
          row.falseAssurance ||= grade.falseAssurance;
          let passed = grade.passed;
          if (passed && test.lifecycle) {
            if (!execute) throw new Error('Required lifecycle executor is unavailable');
            const remaining = config.maxRunMs - (Date.now() - start);
            if (remaining <= 0) throw new Error('Run time budget exhausted');
            const execution = await execute(test, (result.response as { artifact: unknown }).artifact, Math.min(config.timeoutMs, remaining));
            record.execution = execution;
            passed = execution.passed;
            row.falseAssurance ||= !passed && (result.response as { assured?: boolean }).assured === true;
            if (!passed) grade.failures.push('lifecycle-execution');
          }
          row.firstAttemptPassed = attempt === 0 ? passed : row.firstAttemptPassed;
          row.repairs = attempt;
          record.attempts.push(redactTrace({ passed, failures: grade.failures, trace: result.trace }, Object.values(config.environment)));
          if (passed) {
            row.status = 'pass';
            break;
          }
          history.push({ response: result.response, feedback: { failures: grade.failures } });
        }
      } catch (error) {
        row.status = 'infrastructure-error';
        record.error = String(redactTrace(error instanceof Error ? error.message : String(error), Object.values(config.environment)));
      }
      if (!observedUsage || awaitingUsage) {
        row.inputTokens = null;
        row.outputTokens = null;
        row.toolCalls = null;
        row.costUsd = null;
      }
      row.latencyMs = Date.now() - began;
      trials.push(row);
      evidence.push(record);
    }
  }
  const metrics = summarizeTrials(trials);
  return {
    version: 1,
    scope: 'fresh-agent-behavior',
    passed: trials.every((trial) => trial.status === 'pass') && metrics.falseAssurances === 0,
    provenance: {
      caseSetSha256,
      provider: config.provider,
      model: config.model,
      repetitions: config.repetitions,
      settings: {
        maxAttempts: config.maxAttempts,
        maxInputTokens: config.maxInputTokens,
        maxOutputTokens: config.maxOutputTokens,
        timeoutMs: config.timeoutMs,
        maxRunMs: config.maxRunMs,
        maxCostUsd: config.maxCostUsd,
        inputUsdPerMillion: config.inputUsdPerMillion,
        outputUsdPerMillion: config.outputUsdPerMillion
      },
      harnessSha256: createHash('sha256').update(readFileSync(config.executable)).digest('hex'),
      argumentFileHashes: config.args.filter((arg) => isAbsolute(arg)).map((arg) => createHash('sha256').update(readFileSync(arg)).digest('hex'))
    },
    reservedCostUsd,
    metrics,
    perCase: cases.map((test) => ({ id: test.id, ...summarizeTrials(trials.filter((trial) => trial.caseId === test.id)) })),
    trials,
    evidence,
    limitations: [
      'Fresh working directory and explicit environment; this is process isolation, not an OS security sandbox.',
      'Only cases with recorded execution evidence ran on the local chain. No live-chain broadcasts or external service delivery verification.',
      'Cost uses configured rates; reservations bound trusted-worker attempts. Infrastructure failures may have unreported provider charges.'
    ]
  };
}
