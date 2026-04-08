/**
 * Reads the OpenAPI spec (routes.yaml) and generates the ROUTES data array
 * for the BitBadges CLI at src/cli/commands/api-routes.ts.
 *
 * Usage:
 *   bun scripts/generate-api-routes.ts
 *   # or via npm script:
 *   bun run generate-api-routes
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const YAML_PATH = path.join(ROOT, 'openapitypes-helpers', 'routes.yaml');
const OUTPUT_PATH = path.join(ROOT, 'src', 'cli', 'commands', 'api-routes.ts');

/** Map OpenAPI tag names to CLI tag slugs */
const TAG_MAP: Record<string, string> = {
  'Accounts': 'accounts',
  'Tokens': 'tokens',
  'Claims': 'claims',
  'Sign In with BitBadges': 'auth',
  'Transactions': 'tx',
  'Applications': 'apps',
  'Plugins': 'plugins',
  'Dynamic Stores': 'stores',
  'On-Chain Dynamic Stores': 'onchain-stores',
  'Utility Pages': 'pages',
  'Maps and Protocols': 'maps',
  'Assets': 'assets',
  'Miscellaneous': 'misc',
  'Miscellanous': 'misc', // handle typo in spec
};

const TAG_DESCRIPTIONS: Record<string, string> = {
  accounts: 'Account and user routes',
  tokens: 'Collection and token routes',
  claims: 'Claim management routes',
  auth: 'Sign In with BitBadges / OAuth routes',
  tx: 'Transaction broadcast and simulation',
  apps: 'Developer apps and applications',
  plugins: 'Plugin management routes',
  stores: 'Dynamic data store routes',
  'onchain-stores': 'On-chain dynamic store routes',
  pages: 'Utility page routes',
  maps: 'On-chain map and protocol routes',
  assets: 'DEX, pools, and asset pair routes',
  misc: 'Miscellaneous routes',
};

/** Desired tag ordering for the output file */
const TAG_ORDER = [
  'accounts', 'tokens', 'claims', 'auth', 'tx', 'apps',
  'plugins', 'stores', 'onchain-stores', 'pages', 'maps', 'assets', 'misc',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert camelCase/PascalCase operationId to kebab-case CLI command name */
function toKebab(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/** Extract the type name from a $ref like "#/components/schemas/iFoo" */
function refName(ref: string | null | undefined): string | undefined {
  if (!ref) return undefined;
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

/** Escape backticks and backslashes for template literal embedding */
function escapeForTemplate(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// ---------------------------------------------------------------------------
// Route interface for internal use
// ---------------------------------------------------------------------------

interface ParsedRoute {
  name: string;
  tag: string;
  method: string;
  path: string;
  description: string;
  pathParams: string[];
  hasBody: boolean;
  queryParams?: { name: string; description: string; required: boolean }[];
  sdkLinks?: {
    request?: string;
    response?: string;
    function?: string;
  };
}

// ---------------------------------------------------------------------------
// Parse the OpenAPI spec
// ---------------------------------------------------------------------------

function parseRoutes(): ParsedRoute[] {
  const raw = fs.readFileSync(YAML_PATH, 'utf-8');
  const doc = YAML.parse(raw);
  const paths: Record<string, any> = doc.paths || {};

  const routes: ParsedRoute[] = [];

  for (const [routePath, methods] of Object.entries(paths)) {
    for (const [method, spec] of Object.entries(methods as Record<string, any>)) {
      if (!['get', 'post', 'put', 'delete'].includes(method)) continue;

      const operationId: string = spec.operationId;
      const summary: string = spec.summary || operationId;
      const tags: string[] = spec.tags || [];

      // Resolve tag
      const rawTag = tags[0] || 'Miscellaneous';
      const tag = TAG_MAP[rawTag] || 'misc';

      // CLI command name from operationId
      const name = toKebab(operationId);

      // Path parameters
      const params = (spec.parameters || []) as any[];
      const pathParams = params
        .filter((p: any) => p.in === 'path')
        .map((p: any) => p.name as string);

      // Query parameters (non-header, non-path)
      const queryParamsRaw = params.filter(
        (p: any) => p.in === 'query'
      );

      // Check for request body
      const reqBodyRef = spec.requestBody?.content?.['application/json']?.schema?.['$ref'] || null;
      const hasBody = !!reqBodyRef;

      // Response $ref
      const respRef = spec.responses?.['200']?.content?.['application/json']?.schema?.['$ref'] || null;

      // Query payload ref (for GET routes with explode: true)
      const payloadParam = queryParamsRaw.find((p: any) => p.name === 'payload');
      const payloadRef = payloadParam?.schema?.['$ref'] || null;

      // Individual query params (non-payload, non-header-key)
      const individualQueryParams = queryParamsRaw
        .filter((p: any) => p.name !== 'payload')
        .map((p: any) => ({
          name: p.name as string,
          description: (p.description || '') as string,
          required: !!p.required,
        }));

      // Build description from summary
      let description = summary;

      // Special notes for broadcast/simulate
      if (operationId === 'broadcastTx') {
        description = 'Broadcast a transaction via the indexer API. NOTE: If using the chain CLI, prefer `bitbadgeschaind tx` for direct node broadcast.';
      } else if (operationId === 'simulateTx') {
        description = 'Simulate a transaction via the indexer API. NOTE: If using the chain CLI, prefer `bitbadgeschaind tx ... --dry-run` for direct node simulation.';
      }

      // SDK links
      const requestType = refName(reqBodyRef) || refName(payloadRef);
      const responseType = refName(respRef);

      // Derive SDK function name from operationId
      // e.g. getAccount -> BitBadgesAPI.getAccount
      const sdkFunctionName = `BitBadgesAPI.${operationId}`;

      const sdkLinks: ParsedRoute['sdkLinks'] = {};
      if (requestType) sdkLinks.request = requestType;
      if (responseType) sdkLinks.response = responseType;
      sdkLinks.function = sdkFunctionName;

      const route: ParsedRoute = {
        name,
        tag,
        method: method.toUpperCase(),
        path: routePath,
        description,
        pathParams,
        hasBody,
      };

      // Only add queryParams if there are individual ones
      if (individualQueryParams.length > 0) {
        route.queryParams = individualQueryParams;
      }

      // Only add sdkLinks if we have at least one field
      if (sdkLinks.request || sdkLinks.response || sdkLinks.function) {
        route.sdkLinks = sdkLinks;
      }

      routes.push(route);
    }
  }

  return routes;
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

function generateQueryParams(params: { name: string; description: string; required: boolean }[]): string {
  const lines = params.map((p) => {
    const desc = escapeForTemplate(p.description);
    return `      { name: '${p.name}', description: '${desc}', required: ${p.required} },`;
  });
  return `[\n${lines.join('\n')}\n    ]`;
}

function generateSdkLinks(links: ParsedRoute['sdkLinks']): string {
  if (!links) return '';
  const parts: string[] = [];
  if (links.request) parts.push(`      request: '${links.request}',`);
  if (links.response) parts.push(`      response: '${links.response}',`);
  if (links.function) parts.push(`      function: '${links.function}',`);
  return `{\n${parts.join('\n')}\n    }`;
}

function generateRouteEntry(route: ParsedRoute): string {
  const lines: string[] = [];
  lines.push(`  {`);
  lines.push(`    name: '${route.name}',`);
  lines.push(`    tag: '${route.tag}',`);
  lines.push(`    method: '${route.method}',`);
  lines.push(`    path: '${route.path}',`);
  lines.push(`    description: '${escapeForTemplate(route.description)}',`);
  lines.push(`    pathParams: [${route.pathParams.map((p) => `'${p}'`).join(', ')}],`);
  lines.push(`    hasBody: ${route.hasBody},`);

  if (route.queryParams && route.queryParams.length > 0) {
    lines.push(`    queryParams: ${generateQueryParams(route.queryParams)},`);
  }

  if (route.sdkLinks) {
    lines.push(`    sdkLinks: ${generateSdkLinks(route.sdkLinks)},`);
  }

  lines.push(`  }`);
  return lines.join('\n');
}

function generateFile(routes: ParsedRoute[]): string {
  const sections: string[] = [];

  // File header
  sections.push(`// AUTO-GENERATED by scripts/generate-api-routes.ts — regenerate with: bun run generate-api-routes
// Do not edit this file manually. Changes will be overwritten.
`);

  // Interfaces
  sections.push(`// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SdkLinks {
  /** SDK request/payload type name */
  request?: string;
  /** SDK response type name */
  response?: string;
  /** SDK API function name */
  function?: string;
}

export interface ParamInfo {
  name: string;
  description: string;
  required: boolean;
}

export interface FieldInfo {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface ApiRoute {
  /** CLI command name (kebab-case) */
  name: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** API path template with {param} placeholders */
  path: string;
  /** Short description shown in --help */
  description: string;
  /** Ordered list of path parameters (maps to positional CLI args) */
  pathParams: string[];
  /** Whether the route accepts a JSON request body */
  hasBody: boolean;
  /** Tag for grouping in CLI help */
  tag: string;
  /** Query parameters (for GET routes with exploded payload) */
  queryParams?: ParamInfo[];
  /** Key body fields (for POST/PUT/DELETE routes) */
  bodyFields?: FieldInfo[];
  /** SDK usage example */
  example?: string;
  /** Links to SDK type docs */
  sdkLinks?: SdkLinks;
  /** Compact TypeScript-like schema for the request type */
  requestSchema?: string;
  /** Compact TypeScript-like schema for the response type */
  responseSchema?: string;
}
`);

  // TAG_DESCRIPTIONS
  const tagDescLines = Object.entries(TAG_DESCRIPTIONS)
    .map(([k, v]) => `  '${k}': '${v}',`)
    .join('\n');
  sections.push(`// ---------------------------------------------------------------------------
// Tag descriptions
// ---------------------------------------------------------------------------

export const TAG_DESCRIPTIONS: Record<string, string> = {
${tagDescLines}
};
`);

  // Group routes by tag
  const routesByTag = new Map<string, ParsedRoute[]>();
  for (const route of routes) {
    const existing = routesByTag.get(route.tag) || [];
    existing.push(route);
    routesByTag.set(route.tag, existing);
  }

  // Build ROUTES array with section comments
  const routeEntries: string[] = [];
  for (const tag of TAG_ORDER) {
    const tagRoutes = routesByTag.get(tag);
    if (!tagRoutes || tagRoutes.length === 0) continue;

    const label = TAG_DESCRIPTIONS[tag] || tag;
    routeEntries.push(`  // =========================================================================`);
    routeEntries.push(`  // ${label}`);
    routeEntries.push(`  // =========================================================================`);

    for (const route of tagRoutes) {
      routeEntries.push(generateRouteEntry(route) + ',');
    }
  }

  sections.push(`// ---------------------------------------------------------------------------
// Routes (${routes.length} total)
// ---------------------------------------------------------------------------

export const ROUTES: ApiRoute[] = [
${routeEntries.join('\n')}
];
`);

  return sections.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const routes = parseRoutes();
const output = generateFile(routes);
fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');

console.log(`Generated ${OUTPUT_PATH}`);
console.log(`  ${routes.length} routes across ${new Set(routes.map((r) => r.tag)).size} tags`);
