/**
 * Reads the OpenAPI spec (routes.yaml) and generates the ROUTES data array
 * for the BitBadges CLI at src/cli/commands/api-routes.ts.
 *
 * All generation logic lives in generate-api-routes-core.ts (pure — the
 * drift-guard spec imports it); this file is just the filesystem runner.
 *
 * Usage:
 *   bun scripts/generate-api-routes.ts
 *   # or via npm script:
 *   bun run generate-api-routes
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildApiRoutesFile, parseRoutes } from './generate-api-routes-core';

const ROOT = path.resolve(__dirname, '..');
const YAML_PATH = path.join(ROOT, 'openapitypes-helpers', 'routes.yaml');
const OUTPUT_PATH = path.join(ROOT, 'src', 'cli', 'commands', 'api-routes.ts');

const yamlRaw = fs.readFileSync(YAML_PATH, 'utf-8');
const routes = parseRoutes(yamlRaw);
fs.writeFileSync(OUTPUT_PATH, buildApiRoutesFile(yamlRaw), 'utf-8');

console.log(`Generated ${OUTPUT_PATH}`);
console.log(`  ${routes.length} routes across ${new Set(routes.map((r) => r.tag)).size} tags`);
