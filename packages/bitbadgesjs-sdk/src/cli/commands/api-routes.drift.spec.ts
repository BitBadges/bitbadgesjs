/**
 * BB-45 — mechanical drift guard for the generated CLI route table.
 *
 * src/cli/commands/api-routes.ts is generated from
 * openapitypes-helpers/routes.yaml by scripts/generate-api-routes.ts, but
 * nothing enforced that: routes were added to the yaml for months without a
 * regen and the checked-in file silently rotted 34 routes behind (106 vs
 * 140). This spec regenerates from the yaml via the generator's pure core
 * and demands byte identity with the checked-in file — any yaml change
 * without `bun run generate-api-routes` (or any hand edit to the generated
 * file) fails the suite. Deterministic (pure function of the yaml text) and
 * fast (single parse + string compare).
 */
import * as fs from 'fs';
import * as path from 'path';
import { buildApiRoutesFile } from '../../../scripts/generate-api-routes-core.js';

const ROOT = path.resolve(__dirname, '..', '..', '..');
const YAML_PATH = path.join(ROOT, 'openapitypes-helpers', 'routes.yaml');
const GENERATED_PATH = path.join(ROOT, 'src', 'cli', 'commands', 'api-routes.ts');

describe('api-routes.ts drift guard (BB-45)', () => {
  it('checked-in file is byte-identical to a fresh regeneration from routes.yaml', () => {
    const expected = buildApiRoutesFile(fs.readFileSync(YAML_PATH, 'utf-8'));
    const actual = fs.readFileSync(GENERATED_PATH, 'utf-8');
    if (actual !== expected) {
      // Fail with a diagnosis instead of a 400KB string diff.
      const countOf = (s: string) => (s.match(/^\/\/ Routes \((\d+) total\)$/m) || [])[1] ?? '?';
      throw new Error(
        `src/cli/commands/api-routes.ts is out of date with openapitypes-helpers/routes.yaml ` +
          `(checked-in: ${countOf(actual)} routes, regenerated: ${countOf(expected)}). ` +
          `Run \`bun run generate-api-routes\` and commit the result. ` +
          `If you edited api-routes.ts by hand: don't — it is generated.`
      );
    }
  });
});
