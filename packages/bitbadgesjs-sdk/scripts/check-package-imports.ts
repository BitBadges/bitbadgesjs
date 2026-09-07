import { strict as assert } from 'node:assert';
import { createRequire } from 'node:module';

const esm = await import('../dist/esm/index.js');
const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
for (const sdk of [esm, cjs]) {
  assert.equal(typeof sdk.BitBadgesSigningClient, 'function');
  assert.equal(typeof sdk.verifyEip712Tx, 'function');
}
console.log('ESM and CommonJS package imports passed.');
