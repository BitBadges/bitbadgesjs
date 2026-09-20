import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { runLifecycle, lifecycleDiagnostics } from './lifecycle.js';
import { callTool } from './tools/registry.js';
const dirs: string[] = [];
function runner(body: string) {
  const dir = mkdtempSync(join(tmpdir(), 'bb-runner-'));
  dirs.push(dir);
  const file = join(dir, 'runner');
  writeFileSync(file, '#!/bin/sh\n' + body, { mode: 0o700 });
  return file;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const scenario = { version: 1, id: 'test', timeMs: '1', actors: [], steps: [] };
describe('local lifecycle adapter', () => {
  const assertion = { kind: 'coins', address: 'fixture', denom: 'ubadge', expected: '1' };
  function reportedRunner(patch: Record<string, unknown> = {}, commit = 'a'.repeat(40)) {
    const dir = mkdtempSync(join(tmpdir(), 'bb-runner-'));
    dirs.push(dir);
    const file = join(dir, 'runner');
    writeFileSync(
      file,
      `#!${process.execPath}
const commit=${JSON.stringify(commit)};
if(process.argv.includes('--version')) console.log(JSON.stringify({protocolVersion:1,name:'bitbadges-lifecycle',execution:'module',chainCommit:commit}));
else { const input=require('fs').readFileSync(0,'utf8'); const s=JSON.parse(input);
const step={id:'step',passed:true,success:true,timeMs:'1',assertions:[{kind:'coins',passed:true,expected:'1',actual:'1'}],...${JSON.stringify(patch)}};
console.log(JSON.stringify({version:1,id:s.id,passed:true,execution:'module',chainCommit:commit,scenarioHash:require('crypto').createHash('sha256').update(input).digest('hex'),steps:[step],coverage:{excluded:['IBC']}})); }
`,
      { mode: 0o700 }
    );
    return file;
  }
  const requested = { ...scenario, steps: [{ id: 'step', expect: { success: true }, assertions: [assertion] }] };
  it('accepts a complete matching report from the configured local runner', async () => {
    expect(await runLifecycle({ scenario: requested }, { executable: reportedRunner() })).toMatchObject({ passed: true, status: 'satisfied' });
  });
  it('treats an expected rejection with matching assertions as a satisfied step', async () => {
    const rejection = { ...requested, steps: [{ ...requested.steps[0], expect: { success: false } }] };
    expect(await runLifecycle({ scenario: rejection }, { executable: reportedRunner({ success: false }) })).toMatchObject({ status: 'satisfied' });
  });
  it('exposes installed capabilities without intent dependencies or caller-selected executables', async () => {
    const previous = process.env.BITBADGES_LIFECYCLE_RUNNER;
    process.env.BITBADGES_LIFECYCLE_RUNNER = reportedRunner();
    try {
      const diagnostics = await callTool('environment_diagnostics', {});
      expect(diagnostics.isError).toBeFalsy();
      expect(diagnostics.result).toMatchObject({ schemas: { lifecycle: 1 }, runner: { available: true } });
      expect((diagnostics.result as any).schemas.intent).toBeUndefined();
      expect((diagnostics.result as any).offline).not.toContain('intent-check');
      expect((await callTool('run_lifecycle', { scenario: requested })).result).toMatchObject({ status: 'satisfied' });
      expect((await callTool('run_lifecycle', { scenario: requested, executable: '/caller-selected' })).isError).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.BITBADGES_LIFECYCLE_RUNNER;
      else process.env.BITBADGES_LIFECYCLE_RUNNER = previous;
    }
  });
  it.each([
    { assertions: [] },
    { assertions: [{ kind: 'manager', passed: true, expected: '1', actual: '1' }] },
    { assertions: [{ kind: 'coins', passed: true, expected: '2', actual: '2' }] },
    { assertions: [{ kind: 'coins', passed: true, expected: '1' }] },
    { success: false }
  ])('rejects omitted or contradictory requested evidence: %j', async (patch) => {
    await expect(runLifecycle({ scenario: requested }, { executable: reportedRunner(patch) })).rejects.toThrow();
  });
  it('rejects reports that omit one of multiple requested assertions', async () => {
    const two = { ...requested, steps: [{ ...requested.steps[0], assertions: [assertion, { ...assertion, expected: '2' }] }] };
    await expect(runLifecycle({ scenario: two }, { executable: reportedRunner() })).rejects.toThrow();
  });
  it.each(['unknown', 'fixture'])('never reports unrecorded source revision %s as verified', async (commit) => {
    expect(await runLifecycle({ scenario: requested }, { executable: reportedRunner({}, commit) })).toMatchObject({
      passed: true,
      status: 'unverified',
      sourceVerified: false
    });
    expect(await lifecycleDiagnostics(reportedRunner({}, commit))).toMatchObject({ available: true, sourceVerified: false });
  });
  it('reports absent runner without claiming execution', async () => {
    const result = await lifecycleDiagnostics('/missing/bitbadges-lifecycle');
    expect(result.available).toBe(false);
    expect(result.code).toBe('runner_unavailable');
  });
  it('rejects incompatible versions', async () => {
    const path = runner(`echo '{"protocolVersion":2,"name":"bitbadges-lifecycle","execution":"module","chainCommit":"abc"}'`);
    await expect(runLifecycle({ scenario }, { executable: path })).rejects.toThrow(/version/);
  });
  it('bounds execution time and output', async () => {
    const slow = runner('exec sleep 10');
    await expect(runLifecycle({ scenario }, { executable: slow, timeoutMs: 30 })).rejects.toThrow(/timeout/);
    const loud = runner('yes x');
    await expect(runLifecycle({ scenario }, { executable: loud, maxOutputBytes: 100 })).rejects.toThrow(/output/);
  });
  it('never executes scenario strings as shell instructions', async () => {
    const path = runner(
      `if [ "$1" = "--version" ]; then echo '{"protocolVersion":1,"name":"bitbadges-lifecycle","execution":"module","chainCommit":"abc"}'; else cat; fi`
    );
    await expect(runLifecycle({ scenario: { ...scenario, id: '$(touch /tmp/do-not-run)' } }, { executable: path })).rejects.toThrow(/result/);
  });
  it('binds exact scenario bytes and never passes missing mandatory external coverage', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-runner-'));
    dirs.push(dir);
    const file = join(dir, 'runner');
    writeFileSync(
      file,
      `#!${process.execPath}
if (process.argv.includes('--version')) console.log(JSON.stringify({protocolVersion:1,name:'bitbadges-lifecycle',execution:'module',chainCommit:'fixture'}));
else { const input=require('fs').readFileSync(0,'utf8'); const s=JSON.parse(input); console.log(JSON.stringify({version:1,id:s.id,passed:true,execution:'module',chainCommit:'fixture',scenarioHash:require('crypto').createHash('sha256').update(input).digest('hex'),steps:[{id:'step',passed:true,success:true,timeMs:'1',assertions:[{kind:'coins',passed:true,expected:'1',actual:'1'}]}],coverage:{excluded:['IBC']}})); }
`,
      { mode: 0o700 }
    );
    const result = await runLifecycle({ scenario: requested, requiredCoverage: ['module', 'IBC', 'plugins'] }, { executable: file });
    expect(result.passed).toBe(true);
    expect(result.status).toBe('unverified');
    expect(result.coverage.missingRequired).toEqual(['IBC', 'plugins']);
    await expect(runLifecycle({ scenario: { ...requested, steps: [{ ...requested.steps[0], id: 'different' }] } }, { executable: file })).rejects.toThrow(/bound/);
  });
});
