#!/usr/bin/env node

/**
 * BitBadges Builder — Model Context Protocol (MCP) stdio server bin.
 *
 * Entry point when users run `bitbadges-builder` or point Claude Desktop at
 * this package as an MCP server. The actual tool/resource handlers live in
 * `./tools/registry.ts` and `./resources/registry.ts` — this file is just
 * the stdio transport + lifecycle wrapper. For in-process use, import the
 * registry directly or call `bitbadges-cli <verb>` (build/check/tool/...).
 *
 * Example natural-language usage (via an MCP client):
 * > "Create a 1:1 backed USDC stablecoin with 100 USDC/day spend limit"
 *
 * Supported collection types:
 * - Smart Tokens (IBC-backed stablecoins, wrapped assets)
 * - Fungible Tokens (ERC-20 style)
 * - NFT Collections
 * - Subscriptions
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
