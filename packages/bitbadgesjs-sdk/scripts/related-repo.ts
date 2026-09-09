import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function resolveRelatedRepo(
  name: 'indexer' | 'docs',
  override?: string,
  sdkRoot = resolve(import.meta.dir, '../../..')
): string {
  const candidates = override
    ? [resolve(override)]
    : [resolve(sdkRoot, '../..', name === 'indexer' ? 'services/indexer' : 'apps/docs'), resolve(sdkRoot, `../bitbadges-${name}`)];
  const found = candidates.find(existsSync);
  if (!found) throw new Error(`${name} checkout does not exist. Set ${name.toUpperCase()}_DIR to its path.`);
  return found;
}

if (import.meta.main) {
  const name = process.argv[2];
  if (name !== 'indexer' && name !== 'docs') throw new Error('Expected indexer or docs');
  console.log(resolveRelatedRepo(name, process.env[`${name.toUpperCase()}_DIR`]));
}
