/**
 * `builder` command group — reach every BitBadges Builder tool from the CLI.
 *
 * The builder tool registry is imported as a plain library (see
 * src/builder/tools/registry.ts). Handlers are invoked directly — no
 * subprocess and no MCP protocol on this path. The same registry is also
 * exposed over stdio by src/builder/index.ts (see src/builder/server.ts) for
 * Claude Desktop and other MCP clients, but that's a separate transport.
 *
 * Session state is persisted per-invocation via the file-backed store in
 * src/builder/session/fileStore.ts so agents can compose a collection across
 * many `builder call` invocations. This file contains no session persistence
 * logic — it's CLI wiring over library helpers.
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
} from '../../builder/tools/registry.js';
import {
  loadSessionFromDisk,
  saveSessionToDisk,
  listSessionFilesOnDisk,
  readSessionFileRaw,
  resetSessionFile,
  sessionFilePath,
  DEFAULT_SESSIONS_DIR
} from '../../builder/session/fileStore.js';
import { templatesCommand } from './templates.js';

/**
 * Normalize loose CLI input into a transaction body with a `messages` array.
 *
 * Accepts any of: a full `{messages: [...]}` tx body (returned as-is), a bare
 * `{typeUrl, value}` Msg (wrapped into a single-message tx body), or anything
 * else (passed through untouched so `reviewCollection`'s own tolerant
 * `extractCollectionValue` can handle raw collection objects and numeric ID
 * fetch results).
 */
function ensureTxWrapper(input: any): any {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input.messages)) return input;
  if (typeof input.typeUrl === 'string' && input.value) return { messages: [input] };
  return input;
}

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
 * field that the builder v2 session tools use), return it. Otherwise fall back to
 * the explicit --session flag. This keeps the default session isolated per
 * CLI user without forcing them to repeat the id on every call.
 */
function resolveSessionId(parsedArgs: any, sessionFlag: string | undefined): string | undefined {
  if (sessionFlag) return sessionFlag;
  if (parsedArgs && typeof parsedArgs.sessionId === 'string') return parsedArgs.sessionId;
  return undefined;
}

export const builderCommand = new Command('builder').description(
  'BitBadges Builder — deterministic templates, fine-grained tools, docs resources, and session state for composing token transactions.'
);

// ── builder templates ──────────────────────────────────────────────────────
//
// Deterministic flag-based template generators (vault, nft, subscription,
// bounty, …). Imported from ./templates.ts so the large template surface
// lives in its own file.

builderCommand.addCommand(templatesCommand);

// ── builder tools ──────────────────────────────────────────────────────────
//
// Fine-grained tool registry — the in-process twin of the BitBadges Builder
// MCP stdio server. Every tool available to Claude Desktop via the builder
// bin is reachable here as a plain function call.

const toolsCommand = builderCommand
  .command('tools')
  .description('Fine-grained builder tool registry (session builders, queries, reviews, utilities).');

toolsCommand
  .command('list')
  .description('List every builder tool with its schema as JSON.')
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

toolsCommand
  .command('call <tool>')
  .description('Call a builder tool by name. Args come from --args (JSON) or --args-file.')
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

// ── builder review <input> ───────────────────────────────────────────────────
//
// Top-level alias for `sdk review`. Runs reviewCollection() over a
// transaction, collection, or on-chain collection ID and prints the grouped
// findings. The review phase is the natural companion to the build phase,
// so it lives under the same umbrella.

builderCommand
  .command('review <input>')
  .description(
    'Review a built transaction or collection for issues. Input: JSON file, inline JSON, numeric collection ID, or - for stdin.'
  )
  .option('--json', 'Output the full ReviewResult as JSON')
  .option('--strict', 'Exit 1 on warnings (critical always exits 2)')
  .option('--testnet', 'Use testnet API URL (for numeric collection IDs)')
  .option('--local', 'Use local API URL (http://localhost:3001)')
  .option('--url <url>', 'Custom API base URL')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(
    async (
      input: string,
      opts: { json?: boolean; strict?: boolean; testnet?: boolean; local?: boolean; url?: string; outputFile?: string }
    ) => {
      const { readJsonInput, output, getApiUrl } = await import('../utils/io.js');
      let data: unknown;
      if (/^\d+$/.test(input)) {
        const baseUrl = getApiUrl(opts);
        const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
          headers: { 'x-api-key': process.env.BITBADGES_API_KEY || '' }
        });
        if (!response.ok) throw new Error(`Failed to fetch collection ${input}: HTTP ${response.status}`);
        data = await response.json();
      } else {
        data = readJsonInput(input);
      }

      const { reviewCollection } = await import('../../core/review.js');
      const result = reviewCollection(ensureTxWrapper(data));

      if (opts.json) {
        output(result, { ...opts, human: false });
      } else {
        const lines: string[] = [];
        const byLevel: Record<string, typeof result.findings> = { critical: [], warning: [], info: [] };
        for (const f of result.findings) byLevel[f.severity].push(f);
        for (const level of ['critical', 'warning', 'info'] as const) {
          for (const f of byLevel[level]) {
            lines.push(`[${level.toUpperCase()}] ${f.code} — ${f.messageEn}`);
            if (f.recommendationEn) lines.push(`  -> ${f.recommendationEn}`);
          }
        }
        lines.push('');
        lines.push(
          `Summary: ${result.summary.critical} critical, ${result.summary.warning} warning, ${result.summary.info} info — verdict: ${result.summary.verdict}`
        );
        const text = lines.join('\n');
        if (opts.outputFile) {
          const fsMod = await import('fs');
          fsMod.writeFileSync(opts.outputFile, text + '\n', 'utf-8');
          process.stderr.write(`Written to ${opts.outputFile}\n`);
        } else {
          console.log(text);
        }
      }

      if (result.summary.critical > 0) process.exit(2);
      if (opts.strict && result.summary.warning > 0) process.exit(1);
    }
  );

// ── builder explain <input> ──────────────────────────────────────────────────
//
// Human-readable explanation of a transaction body or a collection. Auto-
// detects which shape was passed: a MsgUniversalUpdateCollection tx body
// goes through interpretTransaction(); a raw collection goes through
// interpretCollection(). Numeric input is treated as a collection id and
// fetched from the API.

builderCommand
  .command('explain <input>')
  .description(
    'Explain a transaction or collection in plain English. Input: JSON file, inline JSON, numeric collection ID, or - for stdin.'
  )
  .option('--testnet', 'Use testnet API URL (for numeric collection IDs)')
  .option('--local', 'Use local API URL')
  .option('--url <url>', 'Custom API base URL')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(
    async (input: string, opts: { testnet?: boolean; local?: boolean; url?: string; outputFile?: string }) => {
      const { readJsonInput, getApiUrl } = await import('../utils/io.js');
      let data: any;
      let fetchedCollection = false;
      if (/^\d+$/.test(input)) {
        const baseUrl = getApiUrl(opts);
        const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
          headers: { 'x-api-key': process.env.BITBADGES_API_KEY || '' }
        });
        if (!response.ok) throw new Error(`Failed to fetch collection ${input}: HTTP ${response.status}`);
        data = await response.json();
        fetchedCollection = true;
      } else {
        data = readJsonInput(input);
      }

      // Auto-detect shape: if it has a top-level `value` that looks like a
      // MsgUniversalUpdateCollection, interpret as tx; otherwise interpret as
      // a collection. API-fetched collections always take the collection path.
      let text: string;
      if (fetchedCollection || (data && typeof data === 'object' && !data.typeUrl && !data.value)) {
        const { interpretCollection } = await import('../../core/interpret.js');
        text = interpretCollection(data);
      } else {
        const txBody = data.value ?? data;
        const { interpretTransaction } = await import('../../core/interpret-transaction.js');
        text = interpretTransaction(txBody);
      }

      if (opts.outputFile) {
        const fsMod = await import('fs');
        fsMod.writeFileSync(opts.outputFile, text + '\n', 'utf-8');
        process.stderr.write(`Written to ${opts.outputFile}\n`);
      } else {
        console.log(text);
      }
    }
  );

// ── builder validate <input> ─────────────────────────────────────────────────
//
// Pure static validation of a transaction body — no API calls, no review
// framework. Runs the low-level validateTransaction() from core/validate.ts
// and prints each issue with its path and level. Useful as a fast "is this
// JSON even shaped right" check before running the fuller review.

builderCommand
  .command('validate <input>')
  .description(
    'Run static validation over a transaction JSON (structure, uint ranges, approval criteria, …). Input: JSON file, inline JSON, or - for stdin.'
  )
  .option('--json', 'Output the full ValidationResult as JSON')
  .option('--output-file <path>', 'Write output to file instead of stdout')
  .action(async (input: string, opts: { json?: boolean; outputFile?: string }) => {
    const { readJsonInput, output } = await import('../utils/io.js');
    const data = ensureTxWrapper(readJsonInput(input));
    const { validateTransaction } = await import('../../core/validate.js');
    const result = validateTransaction(data);

    if (opts.json) {
      output(result, { ...opts, human: false });
    } else {
      const lines: string[] = [];
      if (result.issues.length === 0) {
        lines.push('✓ No validation issues found');
      } else {
        for (const issue of result.issues) {
          lines.push(`[${issue.severity.toUpperCase()}] ${issue.path}: ${issue.message}`);
        }
        lines.push('');
        lines.push(`Summary: ${result.issues.length} issue(s)`);
      }
      const text = lines.join('\n');
      if (opts.outputFile) {
        const fsMod = await import('fs');
        fsMod.writeFileSync(opts.outputFile, text + '\n', 'utf-8');
        process.stderr.write(`Written to ${opts.outputFile}\n`);
      } else {
        console.log(text);
      }
    }

    if (!result.valid) process.exitCode = 1;
  });

// ── builder session ──────────────────────────────────────────────────────────────

const sessionCommand = builderCommand
  .command('session')
  .description('Inspect, dump, or reset persisted builder sessions.');

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

// ── builder resources ────────────────────────────────────────────────────────────

const resourcesCommand = builderCommand
  .command('resources')
  .description('Read static builder resources (token registry, recipes, skills, docs, error patterns, ...).');

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
