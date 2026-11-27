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

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { toolRegistry, listTools, callTool } from './tools/registry.js';
import { listResources, readResource } from './resources/registry.js';

function findPackageVersionFrom(startDir: string): string | undefined {
  let directory = startDir;
  for (;;) {
    const file = join(directory, 'package.json');
    if (existsSync(file)) {
      try {
        const pkg = JSON.parse(readFileSync(file, 'utf8'));
        if ((pkg.name === 'bitbadges' || pkg.name === 'bitbadgesjs-sdk') && typeof pkg.version === 'string') {
          return pkg.version;
        }
      } catch {
        // Ignore unreadable package.json and continue walking upward.
      }
    }
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

/**
 * Resolve the installed `bitbadges` package version from `package.json`.
 * Works across CJS, ESM, Jest, and globally symlinked CLI bin invocations.
 */
export function getBuilderPackageVersion(entryFile?: string): string {
  const candidates: string[] = [];
  if (entryFile) {
    try {
      candidates.push(dirname(realpathSync(entryFile)));
    } catch {
      candidates.push(dirname(entryFile));
    }
  }
  if (typeof __dirname === 'string') {
    candidates.push(__dirname);
  }
  if (process.argv[1]) {
    try {
      candidates.push(dirname(realpathSync(process.argv[1])));
    } catch {
      candidates.push(dirname(process.argv[1]));
    }
  }
  candidates.push(process.cwd());
  candidates.push(join(process.cwd(), 'packages', 'bitbadgesjs-sdk'));

  for (const dir of candidates) {
    const version = findPackageVersionFrom(dir);
    if (version) return version;
  }
  return '0.0.0';
}

export interface CreateServerOptions {
  /** Optional toolset filter override (defaults to `BITBADGES_MCP_TOOLSETS` env var). */
  toolsets?: string | readonly string[];
}

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
  return `BitBadges MCP adapter. The bb CLI is the primary entry point, including Cosmos chain commands. This server provides unsigned construction, inspection and query tools; it does not sign or broadcast and never needs private keys.

Start with list_skills, then get_skill_instructions with {"skillId":"<id>"}. CLI equivalents are bb dev skills and bb dev skills <id>. Load only the instructions needed for the task. Prefer shipped high-level builders: build_payment_request_v2 supports frozen invoice obligations and repeatable payment links. Other CLI presets are discoverable with bb build --help; do not assume every CLI action has an MCP equivalent.

For advanced session-based construction, read bitbadges://master-prompt. Use a distinct sessionId for each independent build, pass creatorAddress explicitly, and apply mutations in dependency order. Calls without a sessionId share a default session; reset_session before reusing it. Do not reset another build's session.

After construction, use validate_transaction, review_collection and simulate_transaction for the exact proposal and signer. Correct errors and assess warnings. If simulation is unavailable or unsupported, report that instead of claiming success. Export with get_transaction; get_review_url creates a user review handoff, not a confirmed payment. CLI users can continue with bb check, bb simulate and bb deploy --browser with the expected signer. Browser wallet signing requires the user's wallet; agent-owned wallets are a separate authorized CLI signing path.

Inspect isError and structured results. Proposed, signed, submitted, confirmed and indexed are different states. A returned hash is not confirmation, and unknown outcomes must be reconciled before retries.

Follow each tool's schema exactly. Integer amounts, IDs and timestamp bounds generally use decimal strings; schema literals such as PaymentRequestV2 version: 2 are numeric. Direct invoice payments do not provide cancellation, refunds, escrow or prorations. Never imply that descriptive metadata or skill prose enforces a guardrail.`;
}

export function createServer(options: CreateServerOptions = {}): Server {
  const server = new Server(
    {
      name: 'bitbadges-builder',
      version: getBuilderPackageVersion()
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      },
      instructions: getServerInstructions()
    }
  );

  // ListTools — dump registered tools in registry order (honoring BITBADGES_MCP_TOOLSETS).
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: listTools(options.toolsets)
  }));

  // CallTool — dispatch through the registry. The registry never throws, so
  // we just wrap its output in the MCP content-block shape expected by the
  // wire protocol.
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const { text, result, isError, error } = await callTool(name, args);
    const response: any = {
      content: [{ type: 'text', text }],
      ...(error ? { structuredContent: { error } } : {}),
      ...(result !== null && result !== undefined
        ? { structuredContent: typeof result === 'object' && !Array.isArray(result) ? result : { data: result } }
        : {})
    };
    if (isError !== undefined) response.isError = isError;
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
