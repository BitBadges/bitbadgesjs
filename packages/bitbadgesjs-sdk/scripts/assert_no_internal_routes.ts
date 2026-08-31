/**
 * Publish guard: refuse to ship a spec that still exposes internal routes.
 *
 * Two assertions, both hard failures (exit 1 — never a warning):
 *   A. the assembled spec contains ZERO operations marked `x-internal: true`
 *      (operation-level or inherited from the path item).
 *   B. no route the indexer serves behind `websiteOnlyCors` appears as a
 *      public operation in the spec. Requires an indexer checkout; skipped
 *      with an explicit note when `--indexer` is not supplied.
 *
 *   bun ./scripts/assert_no_internal_routes.ts ./openapitypes/combined_processed.yaml \
 *     [--indexer ../../../bitbadges-indexer/src/indexer.ts]
 */
import { existsSync, readFileSync } from 'fs';
import yaml from 'js-yaml';

import { findInternalOperations, formatOperationRef } from './lib/internalRoutes';
import { arePathsEquivalent, parseExpressRoutes, parseOpenAPIRoutesFromDocument } from './lib/routeAnalysis';

const args = process.argv.slice(2);
const indexerFlag = args.indexOf('--indexer');
const indexerPath = indexerFlag === -1 ? undefined : args[indexerFlag + 1];
const positional = args.filter((_, i) => indexerFlag === -1 || (i !== indexerFlag && i !== indexerFlag + 1));
const specPath = positional[0];

if (!specPath) {
  console.error('Usage: bun ./scripts/assert_no_internal_routes.ts <spec.yaml|spec.json> [--indexer <indexer.ts>]');
  process.exit(1);
}

if (!existsSync(specPath)) {
  console.error(`FAIL: ${specPath} missing — assembly did not produce a spec.`);
  process.exit(1);
}

const raw = readFileSync(specPath, 'utf8');
const doc: any = specPath.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);

const failures: string[] = [];

// A. nothing marked internal may survive into the published spec.
const internal = findInternalOperations(doc);
for (const operation of internal) {
  failures.push(`x-internal operation present in the spec to be published: ${formatOperationRef(operation)}`);
}

// B. nothing the indexer gates behind websiteOnlyCors may be documented as public.
if (indexerPath) {
  if (!existsSync(indexerPath)) {
    console.error(`FAIL: indexer source ${indexerPath} not found.`);
    process.exit(1);
  }

  const websiteOnly = parseExpressRoutes(indexerPath).filter((route) => route.hasWebsiteOnlyCors);
  const publicRoutes = parseOpenAPIRoutesFromDocument(doc).filter((route) => !route.internal);

  for (const route of websiteOnly) {
    const exposed = publicRoutes.find((r) => r.method === route.method && arePathsEquivalent(r.path, route.path));
    if (exposed) {
      failures.push(`website-only indexer route documented as public: ${route.method} ${route.path}`);
    }
  }

  console.log(`Cross-checked ${websiteOnly.length} websiteOnlyCors indexer routes against ${publicRoutes.length} public spec operations.`);
} else {
  console.log('No --indexer supplied: skipping the website-only cross-check (assertion A still enforced).');
}

if (failures.length > 0) {
  console.error('FAIL: internal API surface would leak into the published docs.');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error('Run `bun ./scripts/strip_internal_routes.ts <spec>` in the publish path before pushing.');
  process.exit(1);
}

console.log(`Internal-route guard OK: ${Object.keys(doc.paths ?? {}).length} paths, 0 internal operations.`);
