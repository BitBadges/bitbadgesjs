import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runAgentTrials, invokeWorker } from './model-runner.js';
import { behavioralCases } from './catalog.js';

describe('fresh-process agent evaluations', () => {
  const directory = mkdtempSync(join(tmpdir(), 'bb-eval-worker-test-'));
  const worker = join(directory, 'worker.cjs');
  const config = {
    executable: process.execPath,
    args: [worker],
    model: 'fixture-v1',
    provider: 'fixture',
    repetitions: 2,
    maxAttempts: 2,
    timeoutMs: 1500,
    maxOutputBytes: 65536,
    maxInputTokens: 2000,
    maxOutputTokens: 2000,
    maxRunMs: 10000,
    maxCostUsd: 1,
    inputUsdPerMillion: 1,
    outputUsdPerMillion: 1,
    environment: {}
  };
  beforeAll(() =>
    writeFileSync(
      worker,
      `let input='';process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{
    const r=JSON.parse(input); const repaired=r.history.length>0;
    if(require('fs').existsSync('state')) throw Error('state leaked'); require('fs').writeFileSync('state','one');
    console.log(JSON.stringify({response:{disposition:'recover',nextAction:repaired?'poll-existing-hash':'rebroadcast',explanation:'fixture',assured:!repaired},
      usage:{inputTokens:10,outputTokens:5,toolCalls:0},trace:[{apiKey:'DO_NOT_PERSIST',note:'fixture'}]}));
  });`
    )
  );
  afterAll(() => rmSync(directory, { recursive: true, force: true }));
  it('repeats isolated runs, grades independently and records successful bounded repairs', async () => {
    const test = behavioralCases.find((item) => item.id === 'recover-broadcast-pending')!;
    const report = await runAgentTrials([test], config);
    expect(report.metrics).toMatchObject({ attempts: 2, evaluated: 2, successRate: 1, firstPassRate: 0, repairSuccessRate: 1, falseAssurances: 2 });
    expect(report.trials.every((trial) => trial.repairs === 1)).toBe(true);
    expect(JSON.stringify(report)).not.toContain('DO_NOT_PERSIST');
    expect(report.provenance.model).toBe('fixture-v1');
  });
  it('enforces time/output limits and returns explicit infrastructure failures', async () => {
    await expect(invokeWorker({ ...config, args: ['-e', 'setInterval(()=>{},1000)'], timeoutMs: 30 }, {})).rejects.toThrow(/timeout/i);
    await expect(invokeWorker({ ...config, args: ['-e', 'process.stdout.write("x".repeat(10000))'], maxOutputBytes: 100 }, {})).rejects.toThrow(
      /output/i
    );
    const test = behavioralCases.find((item) => item.id === 'recover-broadcast-pending')!;
    const report = await runAgentTrials([test], { ...config, args: ['-e', 'process.exit(3)'] });
    expect(report.metrics).toMatchObject({ infrastructureErrors: 2, evaluated: 0, successRate: null });
    expect(report.passed).toBe(false);
  });
  it('counts assurances contradicted by real execution as product failures', async () => {
    const test = JSON.parse(JSON.stringify(behavioralCases[0]));
    test.oracle.assertions = [{ id: 'message', path: '/typeUrl', operator: 'equals', expected: '/fixture.Msg', requirement: 'fixture' }];
    const response = {
      response: { disposition: 'propose', artifact: { typeUrl: '/fixture.Msg' }, explanation: 'Ready.', assured: true },
      usage: { inputTokens: 1, outputTokens: 1, toolCalls: 0 },
      trace: []
    };
    const report = await runAgentTrials(
      [test],
      { ...config, repetitions: 1, maxAttempts: 1, args: ['-e', 'console.log(' + JSON.stringify(JSON.stringify(response)) + ')'] },
      async () => ({ passed: false, scope: 'module', sourceCommit: 'a'.repeat(40), scenarioHash: 'b'.repeat(64), excluded: [] })
    );
    expect(report.metrics).toMatchObject({ evaluated: 1, successes: 0, falseAssurances: 1, infrastructureErrors: 0 });
  });
  it('fails closed on exhausted reservations instead of silently skipping cases', async () => {
    const report = await runAgentTrials([behavioralCases[0]], { ...config, maxCostUsd: 0 });
    expect(report.trials).toHaveLength(2);
    expect(report.trials.every((trial) => trial.status === 'infrastructure-error')).toBe(true);
    expect(report.passed).toBe(false);
  });
  it('marks usage incomplete if a later invoked attempt cannot report usage', async () => {
    const script = `let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const r=JSON.parse(s);if(r.history.length)process.exit(2);console.log(JSON.stringify({response:null,usage:{inputTokens:10,outputTokens:5,toolCalls:0}}));});`;
    const report = await runAgentTrials([behavioralCases[0]], { ...config, repetitions: 1, args: ['-e', script] });
    expect(report.trials[0]).toMatchObject({ status: 'infrastructure-error', inputTokens: null, outputTokens: null, toolCalls: null, costUsd: null });
  });
  it('repairs malformed response envelopes as product failures without losing usage', async () => {
    const script = `let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const r=JSON.parse(s);console.log(JSON.stringify({response:r.history.length?{disposition:'recover',nextAction:'poll-existing-hash',explanation:'Poll.'}:null,usage:{inputTokens:10,outputTokens:5,toolCalls:0}}));});`;
    const test = behavioralCases.find((item) => item.id === 'recover-broadcast-pending')!;
    const report = await runAgentTrials([test], { ...config, repetitions: 1, args: ['-e', script] });
    expect(report.trials[0]).toMatchObject({ status: 'pass', repairs: 1, firstAttemptPassed: false, inputTokens: 20, outputTokens: 10 });
    expect(report.metrics).toMatchObject({ evaluated: 1, infrastructureErrors: 0, repairSuccessRate: 1 });
  });
});
