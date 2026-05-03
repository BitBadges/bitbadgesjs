/**
 * API command module for the BitBadges CLI.
 *
 * Registers a commander subcommand for every indexer API route derived from
 * the OpenAPI spec at:
 *   bitbadgesjs/packages/bitbadgesjs-sdk/openapitypes-helpers/routes.yaml
 *
 * Route data is auto-generated in api-routes.ts — see scripts/generate-api-routes.ts.
 *
 * Usage examples:
 *   bitbadges api get-status
 *   bitbadges api get-collection 123
 *   bitbadges api get-accounts --body '{"accountsToFetch":[...]}'
 *   bitbadges api broadcast-tx --body @tx.json --testnet
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import {
  apiRequest,
  resolveApiKey,
  resolveBaseUrl,
} from '../utils/api-client.js';
import { ROUTES, TAG_DESCRIPTIONS, type ApiRoute } from './api-routes.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the --body flag value. Supports:
 *  - @filepath  (reads file from disk)
 *  - JSON string
 *  - stdin (when value is "-")
 */
function resolveBody(raw: string | undefined): any {
  if (raw === undefined) return undefined;

  // Read from file
  if (raw.startsWith('@')) {
    const filePath = raw.slice(1);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  // Read from stdin
  if (raw === '-') {
    const content = fs.readFileSync(0, 'utf-8');
    return JSON.parse(content);
  }

  // Inline JSON
  return JSON.parse(raw);
}

/**
 * Replace {param} placeholders in the path with actual values.
 */
function interpolatePath(
  template: string,
  params: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, encodeURIComponent(value));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Help text builder
// ---------------------------------------------------------------------------

const SDK_DOCS_BASE = 'https://bitbadges.github.io/bitbadgesjs';

function buildAfterHelpText(route: ApiRoute): string {
  const lines: string[] = [];

  // SDK type information
  if (route.sdkLinks) {
    lines.push('');
    lines.push('SDK Types:');
    if (route.sdkLinks.request) {
      lines.push(`  Request:  ${route.sdkLinks.request}`);
      lines.push(`            ${SDK_DOCS_BASE}/interfaces/${route.sdkLinks.request}`);
    }
    if (route.sdkLinks.response) {
      lines.push(`  Response: ${route.sdkLinks.response}`);
      lines.push(`            ${SDK_DOCS_BASE}/interfaces/${route.sdkLinks.response}`);
    }
    if (route.sdkLinks.function) {
      lines.push(`  Function: ${route.sdkLinks.function}`);
    }
  }

  // Inline TypeScript interface schemas
  if (route.requestSchema && route.sdkLinks?.request) {
    lines.push('');
    lines.push(`Request Type (${route.sdkLinks.request}):`);
    for (const schemaLine of route.requestSchema.split('\n')) {
      lines.push(`  ${schemaLine}`);
    }
  }
  if (route.responseSchema && route.sdkLinks?.response) {
    lines.push('');
    lines.push(`Response Type (${route.sdkLinks.response}):`);
    for (const schemaLine of route.responseSchema.split('\n')) {
      lines.push(`  ${schemaLine}`);
    }
  }

  // Query parameters
  if (route.queryParams && route.queryParams.length > 0) {
    lines.push('');
    lines.push('Query Parameters (pass via --query \'{"key":"value"}\'):');
    for (const qp of route.queryParams) {
      const req = qp.required ? ' (required)' : '';
      lines.push(`  ${qp.name}${req} - ${qp.description}`);
    }
  }

  // Body fields
  if (route.bodyFields && route.bodyFields.length > 0) {
    lines.push('');
    lines.push('Body Fields (pass via --body):');
    for (const bf of route.bodyFields) {
      const req = bf.required ? ' (required)' : '';
      lines.push(`  ${bf.name}: ${bf.type}${req}`);
      lines.push(`    ${bf.description}`);
    }
  }

  // Example
  if (route.example) {
    lines.push('');
    lines.push('SDK Example:');
    lines.push(`  ${route.example}`);
  }

  return lines.length > 0 ? lines.join('\n') : '';
}

// ---------------------------------------------------------------------------
// Command builder
// ---------------------------------------------------------------------------

function buildRouteCommand(route: ApiRoute): Command {
  let cmd = new Command(route.name).description(
    `[${route.method}] ${route.path} -- ${route.description}`
  );

  // Positional arguments for path params. Marked optional in commander so
  // `--schema` works without supplying them; the action handler validates
  // they're present for actual API calls and emits the same
  // "missing required argument" error commander would have.
  for (const param of route.pathParams) {
    cmd = cmd.argument(`[${param}]`, `Path parameter: ${param}`);
  }

  // Common options
  cmd
    .option('--body <json>', 'Request body: inline JSON, @file.json, or - for stdin')
    .option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)')
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL (overrides all other URL options)')
    .option('--query <params>', 'Query string params as JSON object (e.g. \'{"bookmark":"x"}\')')
    .option('--condensed', 'Output condensed JSON (no whitespace)', false)
    .option('--dry-run', 'Show request details without sending', false)
    .option('--schema', 'Print the request body + response JSONSchema for this route, no API call', false)
    .option('--output-file <path>', 'Write output to file instead of stdout')
    .option('--with-session', 'Attach the cookie of the active address (set via `auth use`) for the resolved network', false)
    .option('--as-address <addr>', 'Attach the cookie of the given address (overrides --with-session)');

  // Append rich documentation from the OpenAPI spec
  const afterHelp = buildAfterHelpText(route);
  if (afterHelp) {
    cmd.addHelpText('after', afterHelp);
  }

  cmd.action(async (...args: any[]) => {
    // Commander passes positional args first, then the options object, then the command
    const opts = args[route.pathParams.length];

    // --schema short-circuit: print JSONSchema-ish doc without an API call.
    // We don't have full JSONSchema in the registry today; emit the rich
    // metadata we DO have (sdkLinks + bodyFields + queryParams + schemas).
    // Agents get a deterministic shape they can consume; full JSONSchema
    // generation can land alongside the OpenAPI pipeline upgrade.
    if (opts.schema) {
      const schemaPayload = {
        name: route.name,
        method: route.method,
        path: route.path,
        description: route.description,
        pathParams: route.pathParams,
        hasBody: route.hasBody,
        sdkLinks: route.sdkLinks ?? null,
        queryParams: route.queryParams ?? [],
        bodyFields: route.bodyFields ?? [],
        requestSchema: route.requestSchema ?? null,
        responseSchema: route.responseSchema ?? null,
        example: route.example ?? null
      };
      const out = opts.condensed ? JSON.stringify(schemaPayload) : JSON.stringify(schemaPayload, null, 2);
      process.stdout.write(out + '\n');
      return;
    }

    // Validate path params present for non-schema actual API calls.
    // (Schema short-circuit above already returned.)
    for (let i = 0; i < route.pathParams.length; i++) {
      if (args[i] === undefined) {
        process.stderr.write(`error: missing required argument '${route.pathParams[i]}'\n`);
        process.exit(1);
      }
    }

    try {
      const network: 'mainnet' | 'testnet' | 'local' | undefined = opts.testnet
        ? 'testnet'
        : opts.local
          ? 'local'
          : undefined;
      const apiKey = resolveApiKey(opts.apiKey, network);
      const baseUrl = resolveBaseUrl({
        testnet: opts.testnet,
        local: opts.local,
        baseUrl: opts.url,
      });

      // Resolve optional session cookie. Never auto-attach; both --with-session
      // and --as-address are explicit opt-ins to keep silent session injection
      // out of the default code path.
      let cookie: string | undefined;
      let cookieRef: { network: 'mainnet' | 'testnet' | 'local'; address: string } | undefined;
      if (opts.asAddress || opts.withSession) {
        const { getActiveSession, getSession, formatCookieHeader } = await import('../utils/auth-store.js');
        const sessionNetwork: 'mainnet' | 'testnet' | 'local' = network ?? 'mainnet';
        const session = opts.asAddress
          ? getSession(sessionNetwork, opts.asAddress)
          : getActiveSession(sessionNetwork);
        if (!session) {
          throw new Error(
            `No stored session for ${opts.asAddress ?? 'active address'} on ${sessionNetwork}. Run \`bitbadges-cli auth login\`.`,
          );
        }
        if (Date.now() > session.expiresAt) {
          throw new Error(
            `Stored session for ${session.address} on ${sessionNetwork} expired at ${new Date(session.expiresAt).toISOString()}. Re-run \`bitbadges-cli auth login\`.`,
          );
        }
        cookie = formatCookieHeader(session);
        // Ref so apiRequest can persist the rolled Set-Cookie expiry.
        cookieRef = { network: sessionNetwork, address: session.address };
      }

      // Build path params map
      const pathParamValues: Record<string, string> = {};
      for (let i = 0; i < route.pathParams.length; i++) {
        pathParamValues[route.pathParams[i]] = args[i];
      }

      let resolvedPath = interpolatePath(route.path, pathParamValues);

      // Append query params if provided
      if (opts.query) {
        const queryObj = JSON.parse(opts.query);
        const searchParams = new URLSearchParams();
        for (const [k, v] of Object.entries(queryObj)) {
          searchParams.set(k, String(v));
        }
        const qs = searchParams.toString();
        if (qs) {
          resolvedPath += `?${qs}`;
        }
      }

      // Resolve body
      let body: any = undefined;
      if (opts.body) {
        body = resolveBody(opts.body);
      }

      // For GET routes, convert --body to exploded query params (OpenAPI explode: true)
      // GET routes use ?key1=value1&key2=value2 instead of a JSON body
      if (route.method === 'GET' && body !== undefined && typeof body === 'object') {
        const searchParams = new URLSearchParams();
        // First add any existing --query params
        if (opts.query) {
          const queryObj = JSON.parse(opts.query);
          for (const [k, v] of Object.entries(queryObj)) {
            searchParams.set(k, String(v));
          }
        }
        // Then explode the body fields as query params
        for (const [k, v] of Object.entries(body)) {
          if (v !== undefined && v !== null) {
            // For objects/arrays, JSON-encode them
            searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
          }
        }
        const qs = searchParams.toString();
        if (qs) {
          resolvedPath += (resolvedPath.includes('?') ? '&' : '?') + qs;
        }
        body = undefined; // Don't send body on GET
      }

      // Warn when a POST/PUT/DELETE route is called without --body
      if (route.hasBody && body === undefined && route.method !== 'GET' && !opts.dryRun) {
        const typeHint = route.sdkLinks?.request
          ? ` (see ${route.sdkLinks.request} for fields)`
          : '';
        process.stderr.write(
          `Warning: ${route.method} ${route.path} expects a request body but none was provided.${typeHint}\n` +
          `  Use --body '{}' to send an empty body, or --body @file.json to load from file.\n`
        );
      }

      // Dry-run: show request details and exit
      if (opts.dryRun) {
        const dryOutput = {
          method: route.method,
          url: `${baseUrl}${resolvedPath}`,
          headers: {
            'x-api-key': apiKey ? apiKey.slice(0, 4) + '****' : '(none)',
            ...(cookie ? { Cookie: cookie.split('=')[0] + '=****' } : {}),
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body ?? null,
        };
        process.stdout.write(JSON.stringify(dryOutput, null, 2) + '\n');
        return;
      }

      const result = await apiRequest({
        method: route.method,
        path: resolvedPath,
        body,
        apiKey,
        baseUrl,
        cookie,
        cookieRef,
      });

      const formatted = opts.condensed
        ? JSON.stringify(result)
        : JSON.stringify(result, null, 2);

      if (opts.outputFile) {
        fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
        process.stderr.write(`Written to ${opts.outputFile}\n`);
      } else {
        process.stdout.write(formatted + '\n');
      }
    } catch (err: any) {
      // If the error has a response body, print it
      if (err.response) {
        process.stderr.write(JSON.stringify(err.response, null, 2) + '\n');
      } else {
        process.stderr.write(`Error: ${err.message}\n`);
      }
      // Surface the targeted auth hint surfaced by api-client.ts for
      // 401/403 paths. Keeps the on-error UX one line longer than the
      // raw response body, but cuts the agent's retry-loop in half.
      if (err.hint) {
        process.stderr.write(`Hint: ${err.hint}\n`);
      }
      process.exitCode = 1;
    }
  });

  return cmd;
}

export function createApiCommand(): Command {
  const api = new Command('api').description(
    `BitBadges Indexer API client (${ROUTES.length} routes). Call any API endpoint from the CLI.\n\nRoutes are grouped by category. Use "api all <command>" for a flat list.`
  );

  // Discovery: `api --search <kw>` scans the route registry over name,
  // path, tag, and description. Substring match (case-insensitive). Lets
  // agents surface "what route does X" without spawning per-route
  // wrappers. JSON output is direct (no envelope) so it matches the rest
  // of the `api` command's raw-passthrough contract.
  api
    .option('--search <kw>', 'Search routes by keyword (matches name, path, tag, description). Case-insensitive substring.')
    .option('--format <fmt>', 'Output format for --search: json | text', 'text')
    .action((opts: { search?: string; format?: string }) => {
      if (!opts.search) {
        api.outputHelp();
        return;
      }
      const kw = opts.search.toLowerCase();
      const matches = ROUTES.filter((r) => {
        const hay = [r.name, r.path, r.tag, r.description].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(kw);
      }).map((r) => ({
        name: r.name,
        method: r.method,
        path: r.path,
        tag: r.tag,
        description: r.description
      }));
      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(matches, null, 2) + '\n');
        return;
      }
      if (matches.length === 0) {
        process.stdout.write(`No routes match "${opts.search}".\n`);
        return;
      }
      const nameW = Math.max(...matches.map((m) => m.name.length));
      const methodW = Math.max(...matches.map((m) => m.method.length));
      for (const m of matches) {
        process.stdout.write(
          `${m.name.padEnd(nameW)}  ${m.method.padEnd(methodW)}  ${m.path}\n      ${m.description}\n\n`
        );
      }
    });

  // Create tag-based group commands
  const groups: Record<string, Command> = {};
  for (const [tag, desc] of Object.entries(TAG_DESCRIPTIONS)) {
    const tagRoutes = ROUTES.filter((r) => r.tag === tag);
    if (tagRoutes.length === 0) continue;
    groups[tag] = new Command(tag).description(`${desc} (${tagRoutes.length} routes)`);
    api.addCommand(groups[tag]);
  }

  // Create "all" group with every route (flat, backward compat)
  const allCmd = new Command('all').description(`All API routes ungrouped (${ROUTES.length} routes)`);
  api.addCommand(allCmd);

  // Register each route in its tag group AND in "all"
  for (const route of ROUTES) {
    if (groups[route.tag]) {
      groups[route.tag].addCommand(buildRouteCommand(route));
    }
    allCmd.addCommand(buildRouteCommand(route));
  }

  return api;
}
