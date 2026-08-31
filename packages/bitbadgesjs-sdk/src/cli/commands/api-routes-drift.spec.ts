/**
 * CI guard: fails when the checked-in generated file
 * src/cli/commands/api-routes.ts drifts from openapitypes-helpers/routes.yaml.
 *
 * api-routes.ts is AUTO-GENERATED and checked in. Before this guard existed it
 * silently went stale (106 routes checked in vs 140 in routes.yaml as of
 * 2026-08-30). This spec regenerates the file content in memory via the same
 * logic the generator script uses and compares it byte-for-byte.
 *
 * If this test fails, run (from packages/bitbadgesjs-sdk):
 *   bun run generate-api-routes
 * and commit the updated src/cli/commands/api-routes.ts.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { generateApiRoutesFileContent } from './api-routes-generator';

const PKG_ROOT = path.resolve(__dirname, '..', '..', '..');
const YAML_PATH = path.join(PKG_ROOT, 'openapitypes-helpers', 'routes.yaml');
const GENERATED_PATH = path.join(PKG_ROOT, 'src', 'cli', 'commands', 'api-routes.ts');

const REGEN_HINT =
  'api-routes.ts is out of date with routes.yaml. ' +
  'Regenerate it with `bun run generate-api-routes` (from packages/bitbadgesjs-sdk) and commit the result.';

describe('api-routes.ts drift guard', () => {
  it('checked-in api-routes.ts matches what the generator produces from routes.yaml', () => {
    const yamlRaw = fs.readFileSync(YAML_PATH, 'utf-8');
    const expected = generateApiRoutesFileContent(yamlRaw);
    const actual = fs.readFileSync(GENERATED_PATH, 'utf-8');

    if (actual !== expected) {
      // Dump the expected content so a failing dev/CI run can be diffed.
      const dumpPath = path.join(os.tmpdir(), 'api-routes.expected.ts');
      fs.writeFileSync(dumpPath, expected, 'utf-8');

      const actualLines = actual.split('\n');
      const expectedLines = expected.split('\n');
      let firstDiff = 0;
      while (
        firstDiff < Math.min(actualLines.length, expectedLines.length) &&
        actualLines[firstDiff] === expectedLines[firstDiff]
      ) {
        firstDiff++;
      }

      throw new Error(
        `${REGEN_HINT}\n\n` +
          `First difference at line ${firstDiff + 1}:\n` +
          `  checked-in: ${JSON.stringify(actualLines[firstDiff] ?? '<EOF>')}\n` +
          `  generated:  ${JSON.stringify(expectedLines[firstDiff] ?? '<EOF>')}\n\n` +
          `Full expected output written to: ${dumpPath}\n` +
          `Diff with: diff ${dumpPath} ${GENERATED_PATH}`,
      );
    }
  });

  it('every openapi tag declared in routes.yaml is used by at least one route', () => {
    // Mirror guard for the Applications-tag bug: a tag declared in the
    // top-level `tags:` block that no operation references is dead spec.
    const yamlRaw = fs.readFileSync(YAML_PATH, 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const YAML = require('yaml');
    const doc = YAML.parse(yamlRaw);

    const declared: string[] = (doc.tags ?? []).map((t: { name: string }) => t.name);
    const used = new Set<string>();
    for (const methods of Object.values(doc.paths ?? {})) {
      for (const spec of Object.values(methods as Record<string, any>)) {
        for (const tag of (spec as any)?.tags ?? []) used.add(tag);
      }
    }

    const unused = declared.filter((t) => !used.has(t));
    expect(unused).toEqual([]);

    const undeclared = [...used].filter((t) => !declared.includes(t));
    expect(undeclared).toEqual([]);
  });
});
