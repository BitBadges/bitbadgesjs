import { expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveRelatedRepo } from './related-repo';

test('generators locate both monorepo and standalone checkouts without creating targets', () => {
  const root = mkdtempSync(join(tmpdir(), 'sdk-related-repos-'));
  try {
    const sdk = join(root, 'mono/public/js');
    mkdirSync(sdk, { recursive: true });
    expect(() => resolveRelatedRepo('docs', undefined, sdk)).toThrow('DOCS_DIR');
    for (const [name, relative] of [['docs', 'apps/docs'], ['indexer', 'services/indexer']] as const) {
      const target = join(root, 'mono', relative);
      mkdirSync(target, { recursive: true });
      expect(resolveRelatedRepo(name, undefined, sdk)).toBe(target);
      const sibling = join(root, `bitbadges-${name}`);
      mkdirSync(sibling);
      expect(resolveRelatedRepo(name, undefined, join(root, 'bitbadgesjs'))).toBe(sibling);
      expect(resolveRelatedRepo(name, sibling, sdk)).toBe(sibling);
      expect(() => resolveRelatedRepo(name, join(root, 'missing'), sdk)).toThrow('does not exist');
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
