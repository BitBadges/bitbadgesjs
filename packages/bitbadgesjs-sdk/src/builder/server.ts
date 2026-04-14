/**
 * BitBadges Builder — Model Context Protocol (MCP) stdio transport.
 *
 * Wraps the builder tool/resource registry in the MCP protocol so Claude
 * Desktop and other MCP clients can reach it over stdio. Tool handlers
 * themselves live in `src/builder/tools/registry.ts` and are used unchanged
 * by the in-process CLI path (`bitbadges-cli builder`) and by library
 * consumers (indexer, chain binary delegation, etc.) — the MCP server is
 * just one presentation layer among several.
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
 * Create and configure the BitBadges Builder MCP stdio server.
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: 'bitbadges-builder',
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
  // we just wrap its output in the MCP content-block shape expected by the
  // wire protocol.
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
