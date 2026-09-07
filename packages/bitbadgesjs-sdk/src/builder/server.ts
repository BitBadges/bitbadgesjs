/**
 * BitBadges Builder — Model Context Protocol (MCP) stdio transport.
 *
 * Wraps the builder tool/resource registry in the MCP protocol so Claude
 * Desktop and other MCP clients can reach it over stdio. Tool handlers
 * themselves live in `src/builder/tools/registry.ts` and are used unchanged
 * by the in-process CLI path (`bitbadges-cli build/check/explain/...`) and by library
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

/**
 * Steering injected into the model's context by MCP clients on `initialize`.
 *
 * Without this a cold agent sees 53 tool names and 11 resource URIs and has to
 * infer the build order, that sessions are stateful, and that it must never
 * sign. All of that guidance existed only in the programmatic agent's system
 * prompt, which the MCP surface never reads. Keep it short: it is prepended to
 * every conversation, and the depth lives in `bitbadges://master-prompt`.
 */
export function getServerInstructions(): string {
  return `BitBadges builder. You assemble a token collection in a stateful session, then hand the user a link to review and sign. You never sign or broadcast, and you never need their keys.

Read the resource bitbadges://master-prompt once per conversation before your first build, then call get_skill_instructions for the closest skill (its description lists every id).

Happy path for a new collection:
1. get_skill_instructions(<skill>) — read before building.
2. generate_unique_id — one per approval you intend to add. Never hand-write an approvalId for a new approval.
3. Build, in one parallel round: set_standards, set_valid_token_ids, set_invariants, set_permissions, set_default_balances, set_collection_metadata, set_token_metadata, add_approval (or add_preset_approval when a preset fits — call list_presets first, presets are far cheaper than hand-written criteria). Pass creatorAddress on your FIRST session call; it sets creator and manager, and later calls reuse the stored value.
4. Verify, in parallel and with no arguments — they read the session: validate_transaction, review_collection, simulate_transaction.
5. Fix findings the review marks critical, then re-verify. Warnings are advisory.
6. get_transaction for the final JSON, then get_review_url. Give the user the returned reviewUrl and stop. That link is the handoff: they open bitbadges.io, review it, and sign with their own wallet. Do not paste raw transaction JSON unless they ask for it.

Session state is global and survives across builds. Call reset_session before starting a second collection in the same conversation, or you will inherit the first one's approvals and metadata.

Conventions: every number is a string. Ranges are {start, end} with string bounds. Leave an image as "" when the user gave you no art and get_transaction fills it. You describe collections as MsgUniversalUpdateCollection, but get_transaction narrows the output to /tokenization.MsgCreateCollection for a new collection and MsgUpdateCollection for an edit. That is expected.`;
}

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
      },
      instructions: getServerInstructions()
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
