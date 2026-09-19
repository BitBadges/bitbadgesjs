import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { runLifecycle, lifecycleDiagnostics } from './lifecycle.js';
const dirs: string[] = [];
function runner(body: string) { const dir = mkdtempSync(join(tmpdir(), 'bb-runner-')); dirs.push(dir); const file = join(dir, 'runner'); writeFileSync(file, '#!/bin/sh\n' + body, { mode: 0o700 }); return file; }
afterEach(() => dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));
const scenario = { version: 1, id: 'test', timeMs: '1', actors: [], steps: [] };
describe('local lifecycle adapter', () => {
  it('reports absent runner without claiming execution', async () => {
    const result = await lifecycleDiagnostics('/missing/bitbadges-lifecycle');
    expect(result.available).toBe(false); expect(result.code).toBe('runner_unavailable');
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
    const path = runner(`if [ "$1" = "--version" ]; then echo '{"protocolVersion":1,"name":"bitbadges-lifecycle","execution":"module","chainCommit":"abc"}'; else cat; fi`);
    await expect(runLifecycle({ scenario: { ...scenario, id: '$(touch /tmp/do-not-run)' } }, { executable: path })).rejects.toThrow(/result/);
  });
  it('binds exact scenario bytes and never passes missing mandatory external coverage', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-runner-')); dirs.push(dir);
    const file = join(dir, 'runner');
    writeFileSync(file, `#!${process.execPath}
if (process.argv.includes('--version')) console.log(JSON.stringify({protocolVersion:1,name:'bitbadges-lifecycle',execution:'module',chainCommit:'fixture'}));
else { const input=require('fs').readFileSync(0,'utf8'); const s=JSON.parse(input); console.log(JSON.stringify({version:1,id:s.id,passed:true,execution:'module',chainCommit:'fixture',scenarioHash:require('crypto').createHash('sha256').update(input).digest('hex'),steps:[{id:'step',passed:true,success:true,timeMs:'1',assertions:[{kind:'coins',passed:true,expected:'1',actual:'1'}]}],coverage:{excluded:['IBC']}})); }
`, { mode: 0o700 });
    const result = await runLifecycle({ scenario: { ...scenario, steps: [{ id: 'step' }] }, requiredCoverage: ['module', 'IBC', 'plugins'] }, { executable: file });
    expect(result.passed).toBe(true);
    expect(result.status).toBe('unverified');
    expect(result.coverage.missingRequired).toEqual(['IBC', 'plugins']);
    await expect(runLifecycle({ scenario: { ...scenario, steps: [{ id: 'different' }] } }, { executable: file })).rejects.toThrow(/bound/);
  });
});
