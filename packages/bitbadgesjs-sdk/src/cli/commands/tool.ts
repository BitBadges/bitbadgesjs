import { Command } from 'commander';
import fs from 'fs';
import { toolRegistry, callTool } from '../../builder/tools/registry.js';
import {
  loadSessionFromDisk,
  saveSessionToDisk
} from '../../builder/session/fileStore.js';
import { bbError, BBErrorCode } from '../utils/envelope.js';
import { addUnifiedNetworkOptions } from '../utils/network-options.js';

function parseArgs(argsJson: string | undefined, argsFile: string | undefined): any {
  if (argsJson && argsFile) {
    throw bbError(BBErrorCode.INVALID_INPUT, 'Pass either --args or --args-file, not both');
  }
  if (argsFile) {
    const raw = fs.readFileSync(argsFile, 'utf-8');
    return JSON.parse(raw);
  }
  if (argsJson) {
    try {
      return JSON.parse(argsJson);
    } catch (err) {
      throw bbError(BBErrorCode.INVALID_INPUT, `--args is not valid JSON: ${(err as Error).message}`);
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
  .action(async (toolName: string, opts: { args?: string; argsFile?: string; session?: string; raw?: boolean; local?: boolean; testnet?: boolean; url?: string }) => {
    // Resolve indexer URL — tools read BITBADGES_API_URL from env, so we
    // set it for the lifetime of this CLI invocation. Explicit --url wins,
    // then --local, then --testnet, then whatever env is already set.
    if (opts.url) {
      process.env.BITBADGES_API_URL = opts.url;
    } else if (opts.local) {
      process.env.BITBADGES_API_URL = 'http://localhost:3001';
    } else if (opts.testnet) {
      process.env.BITBADGES_API_URL = 'https://api-testnet.bitbadges.io';
    }

    const { emit, emitError } = await import('../utils/envelope.js');

    if (!toolRegistry[toolName]) {
      const available = Object.keys(toolRegistry).sort().join(', ');
      emitError(new Error(`Unknown tool: ${toolName}. Available tools: ${available}`), {
        code: 'unknown_tool',
        exitCode: 1
      });
    }

    let parsedArgs: any;
    try {
      parsedArgs = parseArgs(opts.args, opts.argsFile);
    } catch (err) {
      emitError(err, { code: 'invalid_args', exitCode: 1 });
    }

    const sessionId = resolveSessionId(parsedArgs, opts.session);

    if (sessionId) {
      try {
        loadSessionFromDisk(sessionId);
      } catch (err) {
        emitError(err, { code: 'session_load_failed', exitCode: 1 });
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

    // The tool wraps its return value in `{result, text, isError}`. We
    // surface the structured `result` as the envelope's `data` payload
    // and stash the human-readable `text` on `meta.text` so agents that
    // want either flavor have one shape to parse. `--raw` is preserved
    // as a no-op flag (deprecated; envelope.data IS the structured
    // result now) — keep it accepted for one release to avoid breaking
    // scripts that pass it.
    emit(result.result, {
      meta: result.text ? { text: result.text } : undefined
    });

    // Tools may surface failures two ways:
    //   1. `result.isError = true` (the wrapper throws / rejects)
    //   2. `result.result.success === false` (validator returns a structured
    //      failure but doesn't throw — common for validate_transaction et al)
    // Honor both so `bb tool ... && next` and `set -e` scripts can branch.
    const structuredFail =
      result.result && typeof result.result === 'object' && (result.result as any).success === false;
    if (result.isError || structuredFail) {
      process.exitCode = 1;
    }
  });

// Network flags via the unified helper (0412) — replaces the inline
// --local/--testnet/--url re-declaration. --network/--mainnet/--api-key
// are config'd off so `bb tool`'s flag set is unchanged (tools read
// BITBADGES_API_URL from env; resolution still reads opts.url/local/testnet).
addUnifiedNetworkOptions(toolCommand, {
  includeApiKey: false,
  includeNetworkFlag: false,
  includeMainnetFlag: false
});
