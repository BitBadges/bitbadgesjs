import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { getCliPackageVersion } from './package-version.js';

it('reads the same package version from source, both build formats, and a bin symlink', () => {
  const root = mkdtempSync(join(tmpdir(), 'bb-version-'));
  try {
    const pkg = join(root, 'package');
    mkdirSync(pkg);
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'bitbadges', version: '12.34.56' }));
    for (const entry of ['src/cli/index.ts', 'dist/cjs/cli/index.js', 'dist/esm/cli/index.js']) {
      const file = join(pkg, entry);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, '');
      expect(getCliPackageVersion(file)).toBe('12.34.56');
    }
    writeFileSync(join(pkg, 'dist/cjs/package.json'), JSON.stringify({ type: 'commonjs' }));
    writeFileSync(join(pkg, 'dist/esm/package.json'), JSON.stringify({ type: 'module' }));
    const alias = join(root, 'bb');
    symlinkSync(join(pkg, 'dist/cjs/cli/index.js'), alias);
    expect(getCliPackageVersion(alias)).toBe('12.34.56');
    expect(getCliPackageVersion(join(pkg, 'dist/esm/cli/index.js'))).toBe('12.34.56');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
