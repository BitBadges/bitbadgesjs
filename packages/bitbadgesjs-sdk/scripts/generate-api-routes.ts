/**
 * Reads the OpenAPI spec (routes.yaml) and generates the ROUTES data array
 * for the BitBadges CLI at src/cli/commands/api-routes.ts.
 *
 * The actual generation logic lives in
 * src/cli/commands/api-routes-generator.ts so the api-routes-drift.spec.ts
 * CI guard can reuse it verbatim.
 *
 * Usage:
 *   bun scripts/generate-api-routes.ts
 *   # or via npm script:
 *   bun run generate-api-routes
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateApiRoutesFileContent, parseRoutes } from '../src/cli/commands/api-routes-generator';

const ROOT = path.resolve(__dirname, '..');
const YAML_PATH = path.join(ROOT, 'openapitypes-helpers', 'routes.yaml');
const OUTPUT_PATH = path.join(ROOT, 'src', 'cli', 'commands', 'api-routes.ts');

const yamlRaw = fs.readFileSync(YAML_PATH, 'utf-8');
const routes = parseRoutes(yamlRaw);
fs.writeFileSync(OUTPUT_PATH, generateApiRoutesFileContent(yamlRaw), 'utf-8');

console.log(`Generated ${OUTPUT_PATH}`);
console.log(`  ${routes.length} routes across ${new Set(routes.map((r) => r.tag)).size} tags`);
