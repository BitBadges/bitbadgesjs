import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as {
  bin: Record<string, string>;
};

const CLI_ENTRY = 'dist/cjs/cli/index.js';

it('exposes `bb` as a package.bin alias of `bitbadges-cli`', () => {
  expect(pkg.bin['bitbadges-cli']).toBe(CLI_ENTRY);
  expect(pkg.bin.bb).toBe(pkg.bin['bitbadges-cli']);
  expect(pkg.bin.bitbadges).toBe(pkg.bin['bitbadges-cli']);
  expect(pkg.bin['bitbadges-builder']).toBe('dist/cjs/builder/index.js');
});
