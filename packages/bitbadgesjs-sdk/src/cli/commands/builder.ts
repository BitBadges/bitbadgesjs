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
import { addNetworkOptions } from '../utils/io.js';

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

addNetworkOptions(
  builderCommand
    .command('review <input>')
    .description(
      'Review a built transaction or collection for issues. Input: JSON file, inline JSON, numeric collection ID, or - for stdin.'
    )
    .option('--json', 'Output the full ReviewResult as JSON')
    .option('--strict', 'Exit 1 on warnings (critical always exits 2)')
    .option('--output-file <path>', 'Write output to file instead of stdout')
)
  .action(
    async (
      input: string,
      opts: {
        json?: boolean;
        strict?: boolean;
        network?: 'mainnet' | 'local' | 'testnet';
        testnet?: boolean;
        local?: boolean;
        url?: string;
        outputFile?: string;
      }
    ) => {
      const { readJsonInput, output, getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');
      let data: unknown;
      // Defensive input handling — both the numeric-id fetch and JSON
      // parse used to throw uncaught Node errors on bad input. Wrap
      // both so we get a friendly one-liner instead of a stack dump.
      if (/^\d+$/.test(input)) {
        const baseUrl = getApiUrl(opts);
        const apiKey = getApiKeyForNetwork(opts) || '';
        try {
          const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
            headers: { 'x-api-key': apiKey }
          });
          if (!response.ok) {
            process.stderr.write(
              `Could not fetch collection ${input} from ${baseUrl} — HTTP ${response.status}.\n` +
                `Hint: --network local may not have a wired collection-by-id endpoint.\n` +
                `Try passing the collection JSON directly instead of a numeric id.\n`
            );
            process.exit(2);
          }
          data = await response.json();
        } catch (err: any) {
          process.stderr.write(
            `Could not reach ${baseUrl}/api/v0/collection/${input}: ${err?.message || err}\n`
          );
          process.exit(2);
        }
      } else {
        try {
          data = readJsonInput(input);
        } catch (err: any) {
          process.stderr.write(
            `Failed to parse input JSON: ${err?.message || err}\n` +
              `Accepts: file path, @file.json, inline JSON, numeric collection id, or - for stdin.\n`
          );
          process.exit(2);
        }
      }

      const { reviewCollection } = await import('../../core/review.js');
      let result;
      try {
        result = reviewCollection(ensureTxWrapper(data));
      } catch (err: any) {
        process.stderr.write(
          `Could not review input: ${err?.message || err}\n` +
            `\`builder review\` expects a transaction (with messages[]), a single Msg ({typeUrl,value}), ` +
            `or a complete on-chain collection document.\n`
        );
        process.exit(2);
      }

      if (opts.json) {
        output(result, { ...opts, human: false });
      } else {
        const { renderReview } = await import('../utils/terminal.js');
        // When writing to a file, target the "plain" rendering path by
        // lying about the stream's TTY-ness — createWriteStream isn't a
        // TTY, so makeColor() inside renderReview naturally drops ANSI.
        const text = renderReview(result, { stream: process.stdout });
        if (opts.outputFile) {
          const fsMod = await import('fs');
          // Strip any ANSI that snuck in (defensive — renderReview already
          // disables colour when stdout isn't a TTY).
          const plain = text.replace(/\x1b\[[0-9;]*m/g, '');
          fsMod.writeFileSync(opts.outputFile, plain + '\n', 'utf-8');
          process.stderr.write(`Written to ${opts.outputFile}\n`);
        } else {
          console.log(text);
        }
      }

      if (result.summary.critical > 0) process.exit(2);
      if (opts.strict && result.summary.warning > 0) process.exit(1);
    }
  );

// ── builder verify <input> ───────────────────────────────────────────────────
//
// Aggregate command — runs validate + review + metadata-coverage scan on
// any saved tx file (or stdin) and renders all three sections with the
// same terminal renderer the templates auto-review uses. Exit non-zero
// if anything failed.
//
// Saves agents 3+ separate calls per build. Also gives humans a one-stop
// diligence command for tx files they didn't build through templates.

addNetworkOptions(
  builderCommand
    .command('verify <input>')
    .description(
      'Aggregate validate + review + metadata coverage check. Input: JSON file, inline JSON, or - for stdin.'
    )
    .option('--json', 'Output a structured aggregate JSON instead of rendered sections')
    .option('--strict', 'Exit 1 on warnings (criticals always exit 2)')
    .option('--no-validate', 'Skip the structural validation section')
    .option('--no-review', 'Skip the design review section')
    .option('--no-metadata', 'Skip the metadata coverage section')
    .option('--output-file <path>', 'Write the rendered sections to a file instead of stdout')
)
  .action(
    async (
      input: string,
      opts: {
        json?: boolean;
        strict?: boolean;
        validate?: boolean;
        review?: boolean;
        metadata?: boolean;
        outputFile?: string;
      }
    ) => {
      const { readJsonInput, output } = await import('../utils/io.js');
      const {
        renderValidate,
        renderReview,
        renderMetadataPlaceholders,
        collectMetadataPlaceholders
      } = await import('../utils/terminal.js');

      const raw = readJsonInput(input);
      const wrapped = ensureTxWrapper(raw);

      // Locate the first collection message (Create / Update / Universal)
      // so the metadata scan + review pass operate on collection state,
      // not whatever happens to be at index 0. This makes verify
      // msg-type-agnostic: a tx like `[MsgTransferTokens, MsgCreateCollection]`
      // (transfer first, e.g. via add_transfer + post-fact create) still
      // correctly identifies the collection for review purposes. Falls
      // back to messages[0] only when there's no collection msg at all,
      // in which case the metadata + review sections will be skipped
      // anyway (gated on `firstIsCollection` below).
      const { isCollectionMsg } = await import('../utils/normalizeMsg.js');
      const firstMsg = Array.isArray(wrapped?.messages) && wrapped.messages.length > 0
        ? wrapped.messages.find((m: any) => isCollectionMsg(m)) ?? wrapped.messages[0]
        : wrapped;

      // `review` and the metadata placeholder scan are collection-CRUD
      // specific — they walk collectionApprovals, standards, etc. that
      // only exist on MsgCreateCollection / MsgUpdateCollection / legacy
      // MsgUniversalUpdateCollection. For user-level approval msgs,
      // transfers, dynamic stores, and every other tokenization msg type,
      // validate + simulate are the useful signal and review should stay
      // silent (empty findings would be misleading).
      const firstIsCollection = isCollectionMsg(firstMsg);

      let validation: any = null;
      if (opts.validate !== false) {
        const { validateTransaction } = await import('../../core/validate.js');
        validation = validateTransaction(wrapped);
      }

      let review: any = null;
      if (opts.review !== false && firstIsCollection) {
        const { reviewCollection } = await import('../../core/review.js');
        review = reviewCollection(wrapped);
      }

      let placeholders: ReturnType<typeof collectMetadataPlaceholders> = [];
      if (opts.metadata !== false && firstIsCollection) {
        placeholders = collectMetadataPlaceholders(firstMsg);
      }

      // JSON output mode — single structured payload for tool consumers.
      if (opts.json) {
        output(
          {
            validate: validation,
            review,
            metadata: {
              placeholders,
              filled: firstMsg?._meta?.metadataPlaceholders || {}
            }
          },
          { ...opts, human: false }
        );
      } else {
        const lines: string[] = [];
        if (validation) {
          lines.push(renderValidate(validation, { stream: process.stdout }));
          lines.push('');
        }
        if (review) {
          lines.push(renderReview(review, { stream: process.stdout }));
          lines.push('');
        }
        if (placeholders.length > 0) {
          lines.push(
            renderMetadataPlaceholders(placeholders, firstMsg?._meta?.metadataPlaceholders, {
              stream: process.stdout
            })
          );
        }
        const text = lines.join('\n');

        if (opts.outputFile) {
          const fsMod = await import('fs');
          // Strip ANSI when writing to a file (defensive — the helpers
          // already disable colour when stdout isn't a TTY).
          const plain = text.replace(/\x1b\[[0-9;]*m/g, '');
          fsMod.writeFileSync(opts.outputFile, plain + '\n', 'utf-8');
          process.stderr.write(`Written to ${opts.outputFile}\n`);
        } else {
          console.log(text);
        }
      }

      // Exit codes: 2 if anything is critically broken, 1 if --strict and
      // there are warnings, 0 otherwise.
      const hasValidationErrors = validation && validation.issues?.some((i: any) => i.severity === 'error');
      const hasCritical = review && review.summary?.critical > 0;
      if (hasValidationErrors || hasCritical) {
        process.exit(2);
      }
      const hasValidationWarnings = validation && validation.issues?.some((i: any) => i.severity === 'warning');
      const hasReviewWarnings = review && review.summary?.warning > 0;
      if (opts.strict && (hasValidationWarnings || hasReviewWarnings)) {
        process.exit(1);
      }
    }
  );

// ── builder doctor ───────────────────────────────────────────────────────────
//
// One-shot environment + session health check. Six independent probes:
//
//   1. Node version (must be ≥ 18)
//   2. SDK package + version (loaded from bitbadgesjs-sdk's own package.json)
//   3. CLI config file at ~/.bitbadges/config.json
//   4. API key reachable (pings /api/v0/simulate with a no-op request)
//   5. MCP stdio bin presence + smoke launch
//   6. Persisted sessions parse
//
// Each probe reports PASS / FAIL / WARN / SKIP via the same color sigils
// the rest of the renderer family uses. Exit non-zero only if any probe
// is a hard FAIL — warnings and skips are informational.

interface DoctorCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  detail?: string;
}

addNetworkOptions(
  builderCommand
    .command('doctor')
    .description('Environment + session health check. Verifies Node/SDK/config/API key/MCP bin/session integrity.')
    .option('--json', 'Output the full DoctorReport as JSON')
).action(async (opts: { json?: boolean; network?: 'mainnet' | 'local' | 'testnet'; testnet?: boolean; local?: boolean; url?: string }) => {
    const checks: DoctorCheck[] = [];

    // 1. Node version
    const nodeVersion = process.versions.node;
    const nodeMajor = parseInt(nodeVersion.split('.')[0], 10);
    if (nodeMajor >= 18) {
      checks.push({ name: 'Node version', status: 'pass', detail: `v${nodeVersion}` });
    } else {
      checks.push({
        name: 'Node version',
        status: 'fail',
        detail: `v${nodeVersion} — bitbadgesjs-sdk requires Node 18+`
      });
    }

    // 2. SDK version (best-effort lookup via process.argv[1] → walk up
    // for nearest bitbadgesjs-sdk/package.json). Compatible with both the
    // CJS and ESM dist builds since neither __dirname nor import.meta.url
    // would reliably resolve the same way across the two.
    try {
      const pathMod = await import('path');
      const fsMod = await import('fs');
      // Start from the bin entry script when available, else process.cwd()
      const startFrom = pathMod.dirname(process.argv[1] || process.cwd());
      let dir = startFrom;
      let pkgPath: string | null = null;
      for (let i = 0; i < 8; i++) {
        const candidate = pathMod.join(dir, 'package.json');
        if (fsMod.existsSync(candidate)) {
          try {
            const pkg = JSON.parse(fsMod.readFileSync(candidate, 'utf-8'));
            if (pkg.name === 'bitbadgesjs-sdk') {
              pkgPath = candidate;
              break;
            }
          } catch {
            // Not JSON or unreadable — keep walking
          }
        }
        const parent = pathMod.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
      if (pkgPath) {
        const pkg = JSON.parse(fsMod.readFileSync(pkgPath, 'utf-8'));
        checks.push({ name: 'SDK package', status: 'pass', detail: `bitbadgesjs-sdk@${pkg.version}` });
      } else {
        checks.push({
          name: 'SDK package',
          status: 'warn',
          detail: 'Could not locate bitbadgesjs-sdk package.json from CLI entry'
        });
      }
    } catch (err) {
      checks.push({ name: 'SDK package', status: 'warn', detail: (err as Error).message });
    }

    // 3. Config file
    try {
      const fsMod = await import('fs');
      const pathMod = await import('path');
      const osMod = await import('os');
      const configPath = pathMod.join(osMod.homedir(), '.bitbadges', 'config.json');
      if (fsMod.existsSync(configPath)) {
        try {
          JSON.parse(fsMod.readFileSync(configPath, 'utf-8'));
          checks.push({ name: 'Config file', status: 'pass', detail: configPath });
        } catch {
          checks.push({ name: 'Config file', status: 'fail', detail: `${configPath} exists but is not valid JSON` });
        }
      } else {
        checks.push({ name: 'Config file', status: 'skip', detail: 'no ~/.bitbadges/config.json (env vars also OK)' });
      }
    } catch (err) {
      checks.push({ name: 'Config file', status: 'fail', detail: (err as Error).message });
    }

    // 4. API key reachable. Probe the network the user selected via
    // --network/--local/--testnet (or mainnet by default), so `doctor`
    // tells you whether THIS network is reachable instead of always
    // hitting prod.
    try {
      const { getApiUrl, getApiKeyForNetwork, resolveNetwork } = await import('../utils/io.js');
      const key = getApiKeyForNetwork(opts);
      const network = resolveNetwork(opts);
      if (!key) {
        checks.push({
          name: `API key (${network})`,
          status: 'skip',
          detail: `no key set (BITBADGES_API_KEY or config.apiKey${network !== 'mainnet' ? `/apiKey${network[0].toUpperCase() + network.slice(1)}` : ''})`
        });
      } else {
        const url = `${getApiUrl(opts)}/api/v0/simulate`;
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({ txs: [] })
          });
          // Any 2xx/4xx is "reachable" — only network failures are FAIL.
          // 4xx with a clear message is expected for an empty txs array.
          if (response.status >= 200 && response.status < 500) {
            checks.push({
              name: `API key (${network})`,
              status: 'pass',
              detail: `${url} responded with HTTP ${response.status}`
            });
          } else {
            checks.push({ name: `API key (${network})`, status: 'warn', detail: `HTTP ${response.status} from ${url}` });
          }
        } catch (err) {
          checks.push({
            name: `API key (${network})`,
            status: 'warn',
            detail: `network error pinging ${url}: ${(err as Error).message}`
          });
        }
      }
    } catch (err) {
      checks.push({ name: 'API key', status: 'fail', detail: (err as Error).message });
    }

    // 5. MCP stdio bin — try the same package-walk approach to find the
    // SDK root, then check for dist/cjs/builder/index.js inside it.
    try {
      const fsMod = await import('fs');
      const pathMod = await import('path');
      const startFrom = pathMod.dirname(process.argv[1] || process.cwd());
      let dir = startFrom;
      let pkgRoot: string | null = null;
      for (let i = 0; i < 8; i++) {
        const candidate = pathMod.join(dir, 'package.json');
        if (fsMod.existsSync(candidate)) {
          try {
            const pkg = JSON.parse(fsMod.readFileSync(candidate, 'utf-8'));
            if (pkg.name === 'bitbadgesjs-sdk') {
              pkgRoot = dir;
              break;
            }
          } catch {
            // continue
          }
        }
        const parent = pathMod.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
      if (!pkgRoot) {
        checks.push({
          name: 'MCP stdio bin',
          status: 'warn',
          detail: 'Could not locate SDK root from CLI entry'
        });
      } else {
        const binCandidates = [
          pathMod.join(pkgRoot, 'dist', 'cjs', 'builder', 'index.js'),
          pathMod.join(pkgRoot, 'dist', 'esm', 'builder', 'index.js')
        ];
        const found = binCandidates.find((p) => fsMod.existsSync(p));
        if (found) {
          checks.push({ name: 'MCP stdio bin', status: 'pass', detail: found });
        } else {
          checks.push({
            name: 'MCP stdio bin',
            status: 'warn',
            detail: 'dist/cjs/builder/index.js not found — run `npm run build` in bitbadgesjs-sdk'
          });
        }
      }
    } catch (err) {
      checks.push({ name: 'MCP stdio bin', status: 'fail', detail: (err as Error).message });
    }

    // 6. Persisted sessions
    try {
      const { listSessionFilesOnDisk, readSessionFileRaw } = await import('../../builder/session/fileStore.js');
      const ids = listSessionFilesOnDisk();
      let parseable = 0;
      let corrupt = 0;
      for (const id of ids) {
        const raw = readSessionFileRaw(id);
        if (!raw) continue;
        try {
          JSON.parse(raw);
          parseable++;
        } catch {
          corrupt++;
        }
      }
      if (corrupt > 0) {
        checks.push({
          name: 'Sessions',
          status: 'warn',
          detail: `${parseable} parseable, ${corrupt} corrupt — run \`bitbadges-cli builder session reset <id>\` on broken ones`
        });
      } else {
        checks.push({ name: 'Sessions', status: 'pass', detail: `${parseable} session(s) on disk` });
      }
    } catch (err) {
      checks.push({ name: 'Sessions', status: 'fail', detail: (err as Error).message });
    }

    // Render
    if (opts.json) {
      const { output: outputFn } = await import('../utils/io.js');
      outputFn(checks, { ...opts, human: false });
    } else {
      const { makeColor, rule } = await import('../utils/terminal.js');
      const { c } = makeColor(process.stdout);
      const width = Math.min(80, (process.stdout as any).columns || 80);
      const lines: string[] = [];
      lines.push(c('gray', rule('━', width, 'Doctor')));
      lines.push('');
      const sigil = { pass: '✓', fail: '■', warn: '▲', skip: '·' } as const;
      const colorFor = { pass: 'green', fail: 'red', warn: 'yellow', skip: 'gray' } as const;
      const labelFor = { pass: 'PASS', fail: 'FAIL', warn: 'WARN', skip: 'SKIP' } as const;
      for (const ch of checks) {
        const badge = `${sigil[ch.status]} ${labelFor[ch.status]}`;
        lines.push(`  ${c(colorFor[ch.status], c('bold', badge))}  ${c('bold', ch.name)}`);
        if (ch.detail) {
          lines.push(`        ${c('dim', ch.detail)}`);
        }
      }
      lines.push('');
      const counts = checks.reduce(
        (acc, ch) => ({ ...acc, [ch.status]: (acc[ch.status] || 0) + 1 }),
        {} as Record<string, number>
      );
      lines.push(c('gray', rule('━', width)));
      lines.push(
        `  ${c('bold', 'Summary')}  ${counts.pass || 0} pass · ${
          counts.fail
            ? c('red', `${counts.fail} fail`)
            : c('gray', '0 fail')
        } · ${counts.warn ? c('yellow', `${counts.warn} warn`) : c('gray', '0 warn')} · ${
          counts.skip || 0
        } skip`
      );
      lines.push(c('gray', rule('━', width)));
      console.log(lines.join('\n'));
    }

    if (checks.some((ch) => ch.status === 'fail')) process.exit(2);
  });

// ── builder preview <input> ──────────────────────────────────────────────────
//
// Upload a built tx to the indexer and print a shareable bitbadges.io preview
// URL. Lets agents/humans hand off a tx to a non-CLI reviewer for visual
// inspection without giving them edit/submit rights. The endpoint is open
// (no API key required); the unguessable code in the URL is the secret.
// Lives 1 hour in the indexer's Redis cache.

addNetworkOptions(
  builderCommand
    .command('preview <input>')
    .description(
      'Upload a tx to the indexer and print a shareable bitbadges.io preview URL. Input: JSON file, inline JSON, or - for stdin.'
    )
    .option(
      '--frontend-url <url>',
      'Override the bitbadges.io frontend base for the printed preview URL',
      'https://bitbadges.io'
    )
    .option('--json', 'Output the structured upload result as JSON instead of just the URL')
).action(
    async (
      input: string,
      opts: { network?: 'mainnet' | 'local' | 'testnet'; testnet?: boolean; local?: boolean; url?: string; frontendUrl?: string; json?: boolean }
    ) => {
      const { readJsonInput, getApiUrl } = await import('../utils/io.js');

      // Read + normalize. Templates emit a single Msg; verify/simulate
      // wrap into {messages: [...]}. Preview accepts either shape.
      const raw = readJsonInput(input);
      const wrapped = ensureTxWrapper(raw);

      // Lift `_meta.metadataPlaceholders` into a top-level sibling on the
      // upload payload, then strip `_meta` from the messages so the
      // indexer never sees the CLI annotation. Sidecar lookup priority:
      // wrapper-level _meta first, then inner-Msg _meta (templates emit
      // here).
      const sidecar: Record<string, any> = {
        ...((wrapped._meta && wrapped._meta.metadataPlaceholders) || {})
      };
      const { normalizeToCreateOrUpdate: _normalize } = await import('../utils/normalizeMsg.js');
      const cleanedMessages = (wrapped.messages || []).map((m: any) => {
        let cleaned = m;
        if (m && typeof m === 'object' && m._meta) {
          if (m._meta.metadataPlaceholders) {
            for (const [k, v] of Object.entries(m._meta.metadataPlaceholders)) {
              if (!sidecar[k]) sidecar[k] = v;
            }
          }
          const { _meta: _drop, ...rest } = m;
          void _drop;
          cleaned = rest;
        }
        // Narrow Universal → MsgCreateCollection / MsgUpdateCollection so the
        // shareable preview link shows the agent-facing message type.
        return _normalize(cleaned);
      });

      const payload = {
        transaction: {
          messages: cleanedMessages,
          ...(wrapped.memo ? { memo: wrapped.memo } : {}),
          ...(wrapped.fee ? { fee: wrapped.fee } : {})
        },
        metadataPlaceholders: sidecar
      };

      // Direct fetch — apiRequest() requires an API key, but the preview
      // endpoint is intentionally open.
      const apiUrl = getApiUrl(opts);
      const url = `${apiUrl}/api/v0/builder/preview`;
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        process.stderr.write(`Preview upload failed: ${err instanceof Error ? err.message : String(err)}\n`);
        process.exit(2);
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        process.stderr.write(`Preview upload failed: HTTP ${response.status} ${text}\n`);
        process.exit(2);
      }

      const result = (await response.json()) as {
        success: boolean;
        code: string;
        expiresAt: number;
        expiresIn: string;
      };

      const frontendBase = opts.frontendUrl || 'https://bitbadges.io';
      const previewUrl = `${frontendBase.replace(/\/$/, '')}/builder/preview?code=${encodeURIComponent(result.code)}`;

      if (opts.json) {
        process.stdout.write(
          JSON.stringify(
            {
              code: result.code,
              url: previewUrl,
              expiresAt: result.expiresAt,
              expiresIn: result.expiresIn
            },
            null,
            2
          ) + '\n'
        );
      } else {
        // URL on stdout so it's pipe-friendly. TTL reminder on stderr.
        process.stdout.write(previewUrl + '\n');
        process.stderr.write(`Expires in ${result.expiresIn}.\n`);
      }
    }
  );

// ── builder simulate <input> ─────────────────────────────────────────────────
//
// Standalone simulator. Posts the tx to the BitBadges API's /api/v0/simulate
// endpoint via simulateMessages(), parses events through
// parseSimulationEvents → calculateNetChanges, and renders the same
// Auto-Simulate section the templates use when invoked with --simulate.
// Requires BITBADGES_API_KEY (or `bitbadges-cli config set apiKey`).

addNetworkOptions(
  builderCommand
    .command('simulate <input>')
    .description(
      'Dry-run a built tx against the BitBadges API simulate endpoint. Returns gas + per-address net balance changes. Input: JSON file, inline JSON, or - for stdin.'
    )
    .option('--json', 'Output the structured SimulateResult as JSON instead of a rendered section')
    .option('--creator <address>', 'Override the simulation context address (default: bb1simulation)')
    .option('--events', 'Dump the full raw chain events array in the rendered output (default: just the count)')
).action(async (
    input: string,
    opts: {
      json?: boolean;
      creator?: string;
      events?: boolean;
      network?: 'mainnet' | 'local' | 'testnet';
      testnet?: boolean;
      local?: boolean;
      url?: string;
    }
  ) => {
    const { readJsonInput, output, getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');
    const { simulateMessages } = await import('../../builder/tools/queries/simulateTransaction.js');
    const { renderSimulate } = await import('../utils/terminal.js');

    // Network-aware API key + URL resolution. The simulate endpoint is
    // gated on an API key on mainnet/testnet but most local indexers
    // accept any (or no) key — we still pass it through if present so
    // local routes that DO check it (premium gates) keep working.
    const apiKey = getApiKeyForNetwork(opts);
    if (!apiKey) {
      process.stderr.write(
        renderSimulate(
          {
            success: false,
            error: 'No API key. Set BITBADGES_API_KEY, run `bitbadges-cli config set apiKey <key>`, or pass --network local against a key-less local indexer.'
          },
          { stream: process.stderr }
        ) + '\n'
      );
      process.exit(2);
    }

    const raw = readJsonInput(input);
    const wrapped = ensureTxWrapper(raw);
    const messages = Array.isArray(wrapped?.messages) ? wrapped.messages : [];
    if (messages.length === 0) {
      process.stderr.write(
        renderSimulate(
          { success: false, error: 'No messages found in input. Expected `{messages: [...]}` or a single Msg.' },
          { stream: process.stderr }
        ) + '\n'
      );
      process.exit(2);
    }

    // Refuse to simulate user-level approval messages. They describe a
    // state mutation on an existing collection's user-approval list, not
    // a self-contained tx — set/append/delete semantics vary at runtime
    // and dry-running against a fresh account isn't meaningful. Use
    // `validate` + `review` instead.
    const APPROVAL_RE =
      /\.(MsgUpdateUserApprovals|MsgSetIncomingApproval|MsgSetOutgoingApproval|MsgDeleteIncomingApproval|MsgDeleteOutgoingApproval|MsgPurgeApprovals)$/;
    const firstApprovalMsg = messages.find((m: any) => typeof m?.typeUrl === 'string' && APPROVAL_RE.test(m.typeUrl));
    if (firstApprovalMsg) {
      process.stderr.write(
        renderSimulate(
          {
            success: false,
            error:
              `Cannot simulate user-level approval message (${firstApprovalMsg.typeUrl}). ` +
              'Use `builder validate` and `builder review` to check it, or include it inside an ' +
              'alternative approval message that wraps a full collection transaction.'
          },
          { stream: process.stderr }
        ) + '\n'
      );
      process.exit(2);
    }

    const result = await simulateMessages({
      messages,
      memo: wrapped.memo,
      fee: wrapped.fee,
      creatorAddress: opts.creator,
      apiKey,
      apiUrl: getApiUrl(opts)
    });

    if (opts.json) {
      output(result, { ...opts, human: false });
    } else {
      console.log(renderSimulate(result, { stream: process.stdout, events: opts.events ? 'full' : 'count' }));
    }

    if (!result.success || result.valid === false) process.exit(2);
  });

// ── builder explain <input> ──────────────────────────────────────────────────
//
// Human-readable explanation of a transaction body or a collection. Auto-
// detects which shape was passed: a MsgUniversalUpdateCollection tx body
// goes through interpretTransaction(); a raw collection goes through
// interpretCollection(). Numeric input is treated as a collection id and
// fetched from the API.

addNetworkOptions(
  builderCommand
    .command('explain <input>')
    .description(
      'Explain a transaction or collection in plain English. Input: JSON file, inline JSON, numeric collection ID, or - for stdin.'
    )
    .option('--output-file <path>', 'Write output to file instead of stdout')
).action(
    async (input: string, opts: { network?: 'mainnet' | 'local' | 'testnet'; testnet?: boolean; local?: boolean; url?: string; outputFile?: string }) => {
      const { readJsonInput, getApiUrl, getApiKeyForNetwork } = await import('../utils/io.js');
      let data: any;
      let fetchedCollection = false;

      // Numeric input: try to fetch a collection by id from the indexer.
      // Wrap in try/catch so a 404 / network failure produces a friendly
      // error instead of a raw stack trace.
      if (/^\d+$/.test(input)) {
        const baseUrl = getApiUrl(opts);
        const apiKey = getApiKeyForNetwork(opts) || '';
        try {
          const response = await fetch(`${baseUrl}/api/v0/collection/${input}`, {
            headers: { 'x-api-key': apiKey }
          });
          if (!response.ok) {
            process.stderr.write(
              `Could not fetch collection ${input} from ${baseUrl} — HTTP ${response.status}.\n` +
                `Hint: the indexer's collection-by-id endpoint may not be wired on --network local.\n` +
                `Try passing the collection JSON directly (file or inline) instead of a numeric id.\n`
            );
            process.exit(2);
          }
          data = await response.json();
          fetchedCollection = true;
        } catch (err: any) {
          process.stderr.write(
            `Could not reach ${baseUrl}/api/v0/collection/${input}: ${err?.message || err}.\n` +
              `Check that the network is reachable, or pass the collection JSON directly.\n`
          );
          process.exit(2);
        }
      } else {
        try {
          data = readJsonInput(input);
        } catch (err: any) {
          process.stderr.write(
            `Failed to parse input JSON: ${err?.message || err}.\n` +
              `Accepts: file path, @file.json, inline JSON, numeric collection id, or - for stdin.\n`
          );
          process.exit(2);
        }
      }

      // Auto-detect shape. Accepts three input shapes and unwraps each
      // down to the collection `value` that `interpretTransaction` expects:
      //
      //   1. Single Msg  — `{ typeUrl, value: {...} }`                   → .value
      //   2. Tx wrapper  — `{ messages: [{ typeUrl, value }, ...] }`     → first collection msg's value
      //   3. Raw collection — no typeUrl, no messages, no value          → interpretCollection
      //
      // API-fetched collections always take the raw-collection path.
      // Both interpret paths are wrapped in try/catch — they expect
      // proto-shaped objects with required fields, and missing fields
      // (e.g. minimal `{collectionId:"1"}` ad-hoc inputs) used to crash
      // with `Cannot read properties of undefined (reading 'uri')`.
      let text: string;
      const { isCollectionMsg } = await import('../utils/normalizeMsg.js');
      const hasMessages = Array.isArray(data?.messages);
      const firstCollectionMsg = hasMessages ? data.messages.find((m: any) => isCollectionMsg(m)) : null;

      try {
        if (
          fetchedCollection ||
          (data && typeof data === 'object' && !data.typeUrl && !hasMessages && !data.value)
        ) {
          const { interpretCollection } = await import('../../core/interpret.js');
          text = interpretCollection(data);
        } else {
          const txBody = firstCollectionMsg?.value ?? data.value ?? data;
          const { interpretTransaction } = await import('../../core/interpret-transaction.js');
          text = interpretTransaction(txBody);
        }
      } catch (err: any) {
        process.stderr.write(
          `Could not interpret input: ${err?.message || err}.\n` +
            `Hint: \`builder explain\` expects either a full transaction (with messages[]),\n` +
            `a single Msg ({typeUrl, value}), a complete on-chain collection document\n` +
            `(returned by query_collection), or a numeric collection id. Minimal ad-hoc\n` +
            `JSON like {collectionId:"1"} is not a valid input — it lacks the fields the\n` +
            `interpreter needs (collectionMetadata.uri, validTokenIds, etc).\n`
        );
        process.exit(2);
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
    let data: any;
    try {
      data = ensureTxWrapper(readJsonInput(input));
    } catch (err: any) {
      // Catch the readJsonInput parse error so we don't dump a raw Node
      // stack on bad JSON. Output as a clean validation result so JSON
      // mode stays consumable by tools.
      const friendly = err?.message || String(err);
      if (opts.json) {
        const { output: outFn } = await import('../utils/io.js');
        outFn(
          { valid: false, issues: [{ severity: 'error', path: '(input)', message: friendly }] },
          { ...opts, human: false }
        );
      } else {
        process.stderr.write(`✗ Could not parse input: ${friendly}\n`);
      }
      process.exit(2);
    }

    // Empty messages array isn't a structural error per se but it's almost
    // never what the user wanted. Surface as a warning so quiet-on-empty
    // tx files don't slip through.
    if (Array.isArray(data?.messages) && data.messages.length === 0) {
      const result = {
        valid: true,
        issues: [
          {
            severity: 'warning' as const,
            path: 'messages',
            message: 'Transaction has an empty messages array. Did you forget to add any messages?'
          }
        ]
      };
      if (opts.json) {
        output(result, { ...opts, human: false });
      } else {
        process.stderr.write('▲ WARNING  messages: Transaction has an empty messages array.\n');
      }
      process.exitCode = 1;
      return;
    }

    const { validateTransaction } = await import('../../core/validate.js');
    const result = validateTransaction(data);

    if (opts.json) {
      output(result, { ...opts, human: false });
    } else {
      const { makeColor, rule } = await import('../utils/terminal.js');
      const { c } = makeColor(process.stdout);
      const width = Math.min(80, (process.stdout as any).columns || 80);
      const lines: string[] = [];
      lines.push(c('gray', rule('━', width, 'Validate')));
      if (result.issues.length === 0) {
        lines.push('');
        lines.push(`  ${c('green', '✓')} ${c('bold', 'Clean')} — no structural issues`);
        lines.push('');
      } else {
        lines.push('');
        for (const issue of result.issues) {
          const levelColor = issue.severity === 'error' ? 'red' : 'yellow';
          const badge = issue.severity === 'error' ? '■ ERROR  ' : '▲ WARNING';
          lines.push(`  ${c(levelColor, c('bold', badge))}  ${c('dim', issue.path || '(root)')}`);
          lines.push(`      ${issue.message}`);
          lines.push('');
        }
      }
      lines.push(c('gray', rule('━', width)));
      const errCount = result.issues.filter((i) => i.severity === 'error').length;
      const warnCount = result.issues.filter((i) => i.severity === 'warning').length;
      lines.push(
        `  ${c('bold', 'Summary')}  ${errCount > 0 ? c('red', `${errCount} error`) : c('gray', `${errCount} error`)}  ·  ${
          warnCount > 0 ? c('yellow', `${warnCount} warning`) : c('gray', `${warnCount} warning`)
        }`
      );
      lines.push(c('gray', rule('━', width)));
      const text = lines.join('\n');
      if (opts.outputFile) {
        const fsMod = await import('fs');
        const plain = text.replace(/\x1b\[[0-9;]*m/g, '');
        fsMod.writeFileSync(opts.outputFile, plain + '\n', 'utf-8');
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
