/**
 * BitBadges Builder MCP Server Configuration
 *
 * Tool handlers live in `src/tools/registry.ts` — this file is just the MCP
 * protocol shim. ListTools and CallTool both read from the same registry, so
 * the CLI and any other library consumers see exactly the same tool surface.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { toolRegistry, listTools, callTool } from './tools/registry.js';
import { listResources, readResource } from './resources/registry.js';

/**
 * Create and configure the MCP server.
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: 'bitbadges-builder-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );

  // ListTools — dump every registered tool in registry order.
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: listTools()
  }));

  // CallTool — dispatch through the registry. The registry never throws, so
  // we just wrap its output in the MCP content-block shape.
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const { text, isError } = await callTool(name, args);
    const response: any = {
      content: [{ type: 'text', text }]
    };
    if (isError) response.isError = true;
    return response;
  });

  // Touch the registry at boot so any import-time errors surface immediately
  // rather than on first tool call.
  void toolRegistry;

  // Register resource list handler — delegates to the resource registry.
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: listResources()
  }));

  // Register resource read handler — delegates to the resource registry.
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const result = readResource(uri);
    if (result.isError) {
      throw new Error(result.text);
    }
    return {
      contents: [{ uri: result.uri, mimeType: result.mimeType, text: result.text }]
    };
  });

  return server;
}
