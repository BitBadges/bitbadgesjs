import { strict as assert } from 'node:assert';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const esm = await import('../dist/esm/index.js');
const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
for (const sdk of [esm, cjs]) {
  assert.equal(typeof sdk.BitBadgesSigningClient, 'function');
  assert.equal(typeof sdk.verifyEip712Tx, 'function');
}
execFileSync('node', ['--input-type=module', '-e', `
  import assert from 'node:assert/strict';
  import { createRequire } from 'node:module';
  const esm = await import(${JSON.stringify(new URL('../dist/esm/index.js', import.meta.url).href)});
  const cjs = createRequire(import.meta.url)(${JSON.stringify(fileURLToPath(new URL('../dist/cjs/index.js', import.meta.url)))});
  for (const sdk of [esm, cjs]) {
    assert.equal(typeof sdk.BitBadgesSigningClient, 'function');
    assert.equal(sdk.listStandardBuilders().length > 0, true);
  }
`], { stdio: 'inherit' });
console.log('Bun and Node ESM/CommonJS package imports passed.');
