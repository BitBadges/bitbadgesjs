import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// TypeScript's CommonJS build cannot accept import attributes in shared source.
for await (const relative of new Bun.Glob('**/*.js').scan('dist/esm')) {
  const file = join('dist/esm', relative);
  const source = readFileSync(file, 'utf8');
  const updated = source.replace(/(\bfrom\s+(['"])[^'"\n]+\.json\2)(\s*;)/g, "$1 with { type: 'json' }$3");
  if (updated !== source) writeFileSync(file, updated);
}
