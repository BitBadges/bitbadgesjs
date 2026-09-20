import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

describe('evaluation workflow policy', () => {
  const root = resolve(__dirname, '../../..');
  it('runs lifecycle evaluations only by explicit dispatch', () => {
    const workflow = parse(readFileSync(resolve(root, '.github/workflows/agent-lifecycle.yml'), 'utf8'));
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
  });
  it('runs golden evaluations only by explicit dispatch', () => {
    const workflow = parse(readFileSync(resolve(root, '.github/workflows/agent-evals.yml'), 'utf8'));
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
    expect(JSON.stringify(workflow)).toContain('test:agent-golden');
  });
  it('does not execute evaluation suites in normal PR checks', () => {
    const workflow = readFileSync(resolve(root, '.github/workflows/test.yml'), 'utf8');
    expect(workflow).not.toMatch(/test:agent-(golden|auditor|behavior)|eval:agents/);
  });
});
