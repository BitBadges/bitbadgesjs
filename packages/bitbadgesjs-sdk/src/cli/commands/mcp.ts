/**
 * `mcp` command group — reach every bitbadges-builder-mcp tool from the CLI.
 *
 * The MCP tool registry is imported as a plain library (see
 * src/mcp/tools/registry.ts). There is no subprocess, no stdio MCP protocol —
 * we just call the handlers directly.
 *
 * Session state is persisted per-invocation via the file-backed store in
 * src/mcp/session/fileStore.ts so agents can compose a collection across many
 * `mcp call` invocations. This file contains no session persistence logic —
 * it's CLI wiring over library helpers.
 */

import { Command } from 'commander';
import fs from 'fs';

import {
  toolRegistry,
  listTools,
  callTool,
  resourceRegistry,
  listResources,
  readResource
} from '../../mcp/tools/registry.js';
import {
  loadSessionFromDisk,
  saveSessionToDisk,
  listSessionFilesOnDisk,
  readSessionFileRaw,
  resetSessionFile,
  sessionFilePath,
  DEFAULT_SESSIONS_DIR
} from '../../mcp/session/fileStore.js';

function parseArgs(argsJson: string | undefined, argsFile: string | undefined): any {
  if (argsJson && argsFile) {
    throw new Error('Pass either --args or --args-file, not both');
  }
  if (argsFile) {
    const raw = fs.readFileSync(argsFile, 'utf-8');
    return JSON.parse(raw);
  }
  if (argsJson) {
    try {
      return JSON.parse(argsJson);
    } catch (err) {
      throw new Error(`--args is not valid JSON: ${(err as Error).message}`);
    }
  }
  return {};
}

/**
 * If the tool's args mention a session id (via the conventional `sessionId`
 * field that the MCP v2 session tools use), return it. Otherwise fall back to
 * the explicit --session flag. This keeps the default session isolated per
 * CLI user without forcing them to repeat the id on every call.
 */
function resolveSessionId(parsedArgs: any, sessionFlag: string | undefined): string | undefined {
  if (sessionFlag) return sessionFlag;
  if (parsedArgs && typeof parsedArgs.sessionId === 'string') return parsedArgs.sessionId;
  return undefined;
}

export const mcpCommand = new Command('mcp').description(
  'Invoke bitbadges-builder-mcp tools directly (no MCP protocol / no subprocess).'
);

// ── mcp list ─────────────────────────────────────────────────────────────────

mcpCommand
  .command('list')
  .description('List every MCP tool with its schema as JSON.')
  .option('--names', 'Print only tool names, one per line')
  .action((opts: { names?: boolean }) => {
    if (opts.names) {
      for (const name of Object.keys(toolRegistry)) {
        process.stdout.write(`${name}\n`);
      }
      return;
    }
    process.stdout.write(JSON.stringify(listTools(), null, 2) + '\n');
  });

// ── mcp call <tool> ──────────────────────────────────────────────────────────

mcpCommand
  .command('call <tool>')
  .description('Call an MCP tool by name. Args come from --args (JSON) or --args-file.')
  .option('--args <json>', 'Tool arguments as a JSON string')
  .option('--args-file <path>', 'Tool arguments read from a JSON file')
  .option(
    '--session <id>',
    'Session id for stateful tools. Stored under ~/.bitbadges/sessions/<id>.json. Defaults to the id inside --args.sessionId, or the builtin default session.'
  )
  .option('--raw', 'Print the structured result instead of the MCP text block')
  .action(async (toolName: string, opts: { args?: string; argsFile?: string; session?: string; raw?: boolean }) => {
    if (!toolRegistry[toolName]) {
      const available = Object.keys(toolRegistry).sort().join(', ');
      process.stderr.write(`Unknown tool: ${toolName}\nAvailable tools: ${available}\n`);
      process.exitCode = 1;
      return;
    }

    let parsedArgs: any;
    try {
      parsedArgs = parseArgs(opts.args, opts.argsFile);
    } catch (err) {
      process.stderr.write(`${(err as Error).message}\n`);
      process.exitCode = 1;
      return;
    }

    const sessionId = resolveSessionId(parsedArgs, opts.session);

    // Load session from disk into the in-memory Map before dispatch.
    if (sessionId) {
      try {
        loadSessionFromDisk(sessionId);
      } catch (err) {
        process.stderr.write(`${(err as Error).message}\n`);
        process.exitCode = 1;
        return;
      }
      // Make sure the tool sees the id even if the user only passed --session.
      if (parsedArgs && typeof parsedArgs === 'object' && parsedArgs.sessionId === undefined) {
        parsedArgs.sessionId = sessionId;
      }
    }

    const result = await callTool(toolName, parsedArgs);

    // Persist session state back to disk so the next invocation sees it.
    if (sessionId) {
      try {
        saveSessionToDisk(sessionId);
      } catch (err) {
        process.stderr.write(`Warning: failed to save session "${sessionId}": ${(err as Error).message}\n`);
      }
    }

    if (opts.raw) {
      process.stdout.write(JSON.stringify(result.result, null, 2) + '\n');
    } else {
      process.stdout.write(result.text + '\n');
    }

    if (result.isError) {
      process.exitCode = 1;
    }
  });

// ── mcp session ──────────────────────────────────────────────────────────────

const sessionCommand = mcpCommand
  .command('session')
  .description('Inspect, dump, or reset persisted MCP builder sessions.');

sessionCommand
  .command('list')
  .description(`List persisted session ids under ${DEFAULT_SESSIONS_DIR}.`)
  .action(() => {
    for (const id of listSessionFilesOnDisk()) {
      process.stdout.write(id + '\n');
    }
  });

sessionCommand
  .command('show <id>')
  .description('Print a session snapshot as JSON.')
  .action((id: string) => {
    const raw = readSessionFileRaw(id);
    if (raw === null) {
      process.stderr.write(`No session file at ${sessionFilePath(id)}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(raw);
  });

sessionCommand
  .command('reset <id>')
  .description('Delete a persisted session file.')
  .action((id: string) => {
    resetSessionFile(id);
  });

// ── mcp resources ────────────────────────────────────────────────────────────

const resourcesCommand = mcpCommand
  .command('resources')
  .description('Read static MCP resources (token registry, recipes, skills, docs, error patterns, ...).');

resourcesCommand
  .command('list')
  .description('List every resource with its metadata as JSON.')
  .option('--uris', 'Print only resource URIs, one per line')
  .action((opts: { uris?: boolean }) => {
    if (opts.uris) {
      for (const uri of Object.keys(resourceRegistry)) {
        process.stdout.write(`${uri}\n`);
      }
      return;
    }
    process.stdout.write(JSON.stringify(listResources(), null, 2) + '\n');
  });

resourcesCommand
  .command('read <uri>')
  .description('Read a resource body by URI (e.g. bitbadges://recipes/all).')
  .action((uri: string) => {
    const result = readResource(uri);
    process.stdout.write(result.text + '\n');
    if (result.isError) {
      process.exitCode = 1;
    }
  });
