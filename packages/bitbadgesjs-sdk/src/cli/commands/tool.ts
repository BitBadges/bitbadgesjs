import { Command } from 'commander';
import fs from 'fs';
import { toolRegistry, callTool } from '../../builder/tools/registry.js';
import {
  loadSessionFromDisk,
  saveSessionToDisk
} from '../../builder/session/fileStore.js';

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
 * field that the builder v2 session tools use), return it. Otherwise fall
 * back to the explicit --session flag.
 */
function resolveSessionId(parsedArgs: any, sessionFlag: string | undefined): string | undefined {
  if (sessionFlag) return sessionFlag;
  if (parsedArgs && typeof parsedArgs.sessionId === 'string') return parsedArgs.sessionId;
  return undefined;
}

export const toolCommand = new Command('tool')
  .description('Invoke a single fine-grained builder tool by name. Use `tools` to list every tool.')
  .argument('<name>', 'Tool name (e.g. set_collection_metadata, query_collection)')
  .option('--args <json>', 'Tool arguments as a JSON string')
  .option('--args-file <path>', 'Tool arguments read from a JSON file')
  .option(
    '--session <id>',
    'Session id for stateful tools. Stored under ~/.bitbadges/sessions/<id>.json. Defaults to the id inside --args.sessionId, or the builtin default session.'
  )
  .option('--raw', 'Print the structured result instead of the formatted text block')
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

    if (sessionId) {
      try {
        loadSessionFromDisk(sessionId);
      } catch (err) {
        process.stderr.write(`${(err as Error).message}\n`);
        process.exitCode = 1;
        return;
      }
      if (parsedArgs && typeof parsedArgs === 'object' && parsedArgs.sessionId === undefined) {
        parsedArgs.sessionId = sessionId;
      }
    }

    const result = await callTool(toolName, parsedArgs);

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
