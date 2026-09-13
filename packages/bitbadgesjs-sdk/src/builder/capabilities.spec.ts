import { getCapabilityCatalog, callTool } from './tools/registry.js';

describe('agent capability discovery', () => {
  it('returns a compact versioned catalog with CLI and MCP entrypoints', async () => {
    const catalog = getCapabilityCatalog();
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.primaryInterface).toBe('cli');
    const payment = catalog.capabilities.find((item: any) => item.id === 'build_payment_request_v2');
    expect(payment?.cli).toEqual(['bb', 'dev', 'tools', 'call', 'build_payment_request_v2']);
    expect(payment?.mcp).toBe('build_payment_request_v2');
    expect(payment?.inputSchema).toBeUndefined();
    const result = await callTool('get_capabilities', {});
    expect(result.isError).not.toBe(true);
    expect(result.result).toEqual(catalog);
  });

  it('returns the installed operation schema and rejects unknown identifiers', () => {
    const detail = getCapabilityCatalog('build_claim');
    expect(detail.capabilities[0].inputSchema?.required).toEqual(['claimType', 'name', 'maxUses']);
    expect((detail.capabilities[0].inputSchema as any).additionalProperties).toBe(false);
    expect(() => getCapabilityCatalog('invented_operation')).toThrow('Unknown capability');
  });
});
