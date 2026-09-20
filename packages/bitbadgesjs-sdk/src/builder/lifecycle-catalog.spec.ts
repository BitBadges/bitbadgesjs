import { getLifecycleCapabilities, getLifecycleTemplate, lifecycleProvenance } from './lifecycle-catalog.js';
import { describeStandards } from './standards.js';
import { callTool } from './tools/registry.js';

describe('experimental lifecycle coverage', () => {
  it('accounts for every installed standard without treating execution as product certification', () => {
    const catalog = getLifecycleCapabilities();
    expect(catalog.maturity).toBe('experimental');
    expect(catalog.standards.map((x) => x.id)).toEqual(describeStandards({}).standards.map((x) => x.id));
    expect(catalog.standards.filter((x) => x.support === 'reference-scenarios')).toHaveLength(7);
    expect(catalog.standards.find((x) => x.id === 'vault')?.support).toBe('no-reference-coverage');
    expect(catalog.excluded).toContain('signatures');
  });
  it('returns isolated runnable inputs and only recognizes unchanged references', () => {
    const template = getLifecycleTemplate('subscription-paid');
    expect(lifecycleProvenance(template.input.scenario).origin).toBe('shipped-reference');
    template.input.scenario.id = 'modified';
    expect(lifecycleProvenance(template.input.scenario).origin).toBe('caller-authored');
    expect(getLifecycleTemplate('subscription-paid').input.scenario.id).not.toBe('modified');
    expect(() => getLifecycleTemplate('../unknown')).toThrow(/Unknown/);
  });
  it('exposes discovery and templates through the shared CLI/MCP registry', async () => {
    expect((await callTool('get_lifecycle_capabilities', {})).result).toMatchObject({ maturity: 'experimental' });
    expect((await callTool('get_lifecycle_template', { id: 'subscription-paid' })).result).toMatchObject({ input: { requiredCoverage: ['module'] } });
    expect((await callTool('get_lifecycle_template', { id: 'missing' })).isError).toBe(true);
  });
});
