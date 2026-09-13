import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function getCliPackageVersion(entryFile: string): string {
  let directory = dirname(realpathSync(entryFile));
  for (;;) {
    const file = join(directory, 'package.json');
    if (existsSync(file)) {
      const pkg = JSON.parse(readFileSync(file, 'utf8'));
      if ((pkg.name === 'bitbadges' || pkg.name === 'bitbadgesjs-sdk') && typeof pkg.version === 'string') {
        return pkg.version;
      }
    }
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Could not locate the CLI package version');
    directory = parent;
  }
}
