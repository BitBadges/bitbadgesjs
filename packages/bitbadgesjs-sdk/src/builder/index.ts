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

import { realpathSync } from 'node:fs';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer, getBuilderPackageVersion } from './server.js';
import { MCP_TOOLSET_NAMES } from './tools/registry.js';

export function formatBuilderHelp(version: string = getBuilderPackageVersion()): string {
  return [
    `bitbadges-builder v${version} — BitBadges Builder MCP stdio server`,
    '',
    'Usage:',
    '  bitbadges-builder            Start the MCP server over stdio',
    '  bitbadges-builder --version  Print package version and exit',
    '  bitbadges-builder --help     Show this help message and exit',
    '',
    'Options:',
    '  -v, --version                Print package version and exit',
    '  -h, --help                   Show this help message and exit',
    '',
    'Environment Variables:',
    `  BITBADGES_MCP_TOOLSETS       Optional comma-separated toolset filter for tools/list`,
    `                               (default: unset = all tools). Available toolsets:`,
    `                               ${MCP_TOOLSET_NAMES.join(', ')}`,
    '  BITBADGES_API_KEY            API key for query / simulation tools',
    '  BITBADGES_API_URL            Optional custom indexer API base URL',
    ''
  ].join('\n');
}

export function handleBuilderCliArgs(args: readonly string[], entryFile?: string): { exit: boolean; stdout?: string } {
  if (args.includes('--version') || args.includes('-v')) {
    return { exit: true, stdout: getBuilderPackageVersion(entryFile) + '\n' };
  }
  if (args.includes('--help') || args.includes('-h')) {
    return { exit: true, stdout: formatBuilderHelp(getBuilderPackageVersion(entryFile)) };
  }
  return { exit: false };
}

async function main() {
  const handled = handleBuilderCliArgs(process.argv.slice(2), process.argv[1]);
  if (handled.exit) {
    if (handled.stdout) process.stdout.write(handled.stdout);
    process.exit(0);
  }

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

// Only start the stdio server when executed directly as the bin entry point
// (not when imported in unit tests or library code).
const isDirectExecution = (() => {
  if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    return true;
  }
  if (typeof process === 'undefined' || !Array.isArray(process.argv) || typeof process.argv[1] !== 'string') {
    return false;
  }
  let resolved = process.argv[1];
  try {
    resolved = realpathSync(resolved);
  } catch {
    // Keep original argv[1] if realpath fails.
  }
  return /(?:^|[\\/])builder[\\/]index\.(?:[cm]?js|ts)$|(?:^|[\\/])bitbadges-builder$/.test(resolved);
})();

if (isDirectExecution) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
