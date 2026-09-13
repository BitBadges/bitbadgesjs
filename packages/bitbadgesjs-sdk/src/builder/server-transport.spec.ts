import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from './server.js';

describe('MCP structured transport', () => {
  it('returns machine-readable skill data alongside compatible text content', async () => {
    const server = createServer();
    const client = new Client({ name: 'contract-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const response = await client.callTool({ name: 'get_skill_instructions', arguments: { skillId: 'payment-obligations' } });
      expect(response.isError).toBeFalsy();
      expect(response.structuredContent).toEqual(expect.objectContaining({ id: 'payment-obligations' }));
      expect(JSON.parse((response.content as any[])[0].text)).toEqual(response.structuredContent);
      const invalid = await client.callTool({ name: 'get_skill_instructions', arguments: { id: 'payment-obligations' } });
      expect(invalid.isError).toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
