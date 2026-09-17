import { buildCommand } from '../cli/commands/build.js';
import { getStandardCatalog, callTool, toolRegistry } from './tools/registry.js';
import { listStandardBuilders } from '../core/builders/input-schemas.js';

describe('standard lifecycle discovery', () => {
  it('covers every installed builder and keeps compact discovery offline', () => {
    const catalog = getStandardCatalog();
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.primaryInterface).toBe('cli');
    for (const { id } of listStandardBuilders()) expect(catalog.standards.some((item) => item.id === id)).toBe(true);
    expect(catalog.standards.every((item) => !('actions' in item))).toBe(true);
  });
  it('covers all frontend families while keeping missing adapters explicit', () => {
    expect(
      new Set(
        getStandardCatalog()
          .standards.map((entry) => entry.frontendFamily)
          .filter(Boolean)
      ).size
    ).toBe(18);
    const nft = getStandardCatalog('nft').standards[0];
    expect(nft.builders).toEqual([]);
    expect(nft.actions).toEqual([]);
    expect(nft.cliHelp).toEqual(['bb', 'nfts', '--help']);
    expect(nft.validation?.semanticConformance).toBe('not-evaluated');
    expect(getStandardCatalog('payment-request-v2').standards[0].actions?.some((action) => action.id.endsWith('_deny'))).toBe(false);
  });
  it('links real operation schemas and reports required inputs without duplicating schemas', () => {
    for (const summary of getStandardCatalog().standards) {
      const detail = getStandardCatalog(summary.id).standards[0];
      expect(detail.eligibility).toBe('not-evaluated');
      for (const operation of [...detail.builders!, ...detail.actions!]) {
        if (!operation.mcp) continue;
        const schema = toolRegistry[operation.mcp].tool.inputSchema;
        expect(operation.requiredInputs).toEqual(schema.required ?? []);
        expect(operation.schemaCommand).toEqual(['bb', 'dev', 'capabilities', operation.mcp]);
        expect(operation).not.toHaveProperty('inputSchema');
      }
    }
  });
  it('advertises only real native build commands and uses the tool adapter for quests', () => {
    for (const summary of getStandardCatalog().standards) {
      for (const operation of getStandardCatalog(summary.id).standards[0].builders!) {
        if (operation.cli[1] === 'build') expect(buildCommand.commands.some((command) => command.name() === operation.cli[2])).toBe(true);
      }
    }
    expect(getStandardCatalog('quests').standards[0].builders![0].cli).toEqual(['bb', 'dev', 'tools', 'call', 'build_quests']);
  });
  it.each([
    ['address-list', 'address-list'],
    ['credit-token', 'credit-token'],
    ['smart-token', 'smart-token'],
    ['vault', 'smart-token']
  ])('discovers shared inspection for %s using the supported %s family', (id, family) => {
    const detail = getStandardCatalog(id).standards[0];
    const inspection = detail.actions?.find((action) => action.id === 'standard_standards_inspect');
    expect(inspection).toBeDefined();
    expect(inspection?.cli).toEqual(['bb', 'standards', 'inspect', '--family', family]);
    const schema = toolRegistry.standard_standards_inspect.tool.inputSchema;
    expect(inspection?.requiredInputs).toEqual(schema.required);
    expect(schema.required).toEqual(expect.arrayContaining(['collectionId', 'family']));
    expect((schema.properties!.family as { enum: string[] }).enum).toContain(family);
    expect((schema.properties!.family as { enum: string[] }).enum).not.toContain('vault');
    expect(inspection?.schemaCommand).toEqual(['bb', 'dev', 'capabilities', 'standard_standards_inspect']);
    expect(detail.validation?.semanticConformance).toBe('not-evaluated');
  });
  it('documents all invoice categories without inventing a custom example', () => {
    const detail = getStandardCatalog('payment-request-v2').standards[0];
    expect(detail.substandards?.map((entry) => entry.id)).toEqual([
      'specific',
      'anyone',
      'one',
      'all',
      'threshold',
      'installments',
      'partial',
      'target',
      'link',
      'custom'
    ]);
    expect(detail.substandards?.find((entry) => entry.id === 'custom')?.exampleCommand).toBeUndefined();
    expect(detail.unsupported).toContain('Automatic refunds, prorations, and escrow-based conditional release.');
  });
  it('does not let consumers mutate later discovery or installed requirements', () => {
    const first = getStandardCatalog('subscription').standards[0];
    const original = JSON.parse(JSON.stringify(getStandardCatalog('subscription')));
    first.unsupported!.length = 0;
    first.builders![0].requiredInputs.length = 0;
    expect(getStandardCatalog('subscription')).toEqual(original);
  });
  it('returns identical CLI-source and MCP discovery and rejects invalid identifiers', async () => {
    expect((await callTool('get_standards', { id: 'subscription' })).result).toEqual(getStandardCatalog('subscription'));
    expect(() => getStandardCatalog('__proto__')).toThrow('Unknown standard');
    expect((await callTool('get_standards', { id: 'subscription', sign: true })).isError).toBe(true);
  });
});
