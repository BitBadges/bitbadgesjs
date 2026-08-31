/**
 * Remove every `x-internal: true` operation from an assembled OpenAPI spec.
 *
 * This runs in the publish path *before* the Stoplight push and before the
 * hosted JSON/YAML artifacts are produced, so internal routes never reach the
 * published docs at all. `x-internal` used to be honoured only by
 * `check_routes_consistency.ts` (a lint), which meant marking a route internal
 * did nothing to what actually shipped.
 *
 *   bun ./scripts/strip_internal_routes.ts ./openapitypes/combined.yaml [...]
 */
import { readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';

import { formatOperationRef, stripInternalOperations } from './lib/internalRoutes';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('Usage: bun ./scripts/strip_internal_routes.ts <spec.yaml|spec.json> [...]');
  process.exit(1);
}

for (const file of files) {
  const isJson = file.endsWith('.json');
  const raw = readFileSync(file, 'utf8');
  const doc: any = isJson ? JSON.parse(raw) : yaml.load(raw);

  if (!doc || !doc.paths || Object.keys(doc.paths).length === 0) {
    console.error(`FAIL: ${file} has no paths — refusing to rewrite a spec that upstream assembly did not fill in.`);
    process.exit(1);
  }

  const before = Object.keys(doc.paths).length;
  const { removedOperations, removedPaths, removedTags } = stripInternalOperations(doc);
  const after = Object.keys(doc.paths).length;

  writeFileSync(file, isJson ? `${JSON.stringify(doc, null, 2)}\n` : yaml.dump(doc, { lineWidth: -1 }), 'utf8');

  console.log(`${file}: paths ${before} -> ${after}`);
  for (const operation of removedOperations) console.log(`  removed operation: ${formatOperationRef(operation)}`);
  for (const path of removedPaths) console.log(`  removed empty path: ${path}`);
  for (const tag of removedTags) console.log(`  removed orphaned tag: ${tag}`);
}
