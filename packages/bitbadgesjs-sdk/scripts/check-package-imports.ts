import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const esmDir = fileURLToPath(new URL('../dist/esm', import.meta.url));
const esm = await import('../dist/esm/index.js');
const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
for (const sdk of [esm, cjs]) {
  assert.equal(typeof sdk.BitBadgesSigningClient, 'function');
  assert.equal(typeof sdk.verifyEip712Tx, 'function');
  assert.equal(typeof sdk.cosmosAddressFromPublicKey, 'function');
}

function walkJs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) return walkJs(p);
    return entry.name.endsWith('.js') ? [p] : [];
  });
}

/** Strip block and line comments so documented `require(` samples do not fail the smoke check. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
}

const requireOffenders = walkJs(esmDir)
  .filter((p) => !/\.spec\.js$/.test(p))
  .filter((p) => /(?<![.\w$])require\s*\(/.test(stripComments(readFileSync(p, 'utf8'))))
  .map((p) => relative(esmDir, p));
assert.deepEqual(requireOffenders, [], `dist/esm contains bare require( outside specs: ${requireOffenders.join(', ')}`);

const compressedPubKeyHex = '0293a9c4c92c9a8a70d5b029c3db0d9e209d051fe1933adcdb6da1342264b2c4c3';
const esmAddress = esm.cosmosAddressFromPublicKey(compressedPubKeyHex);
const cjsAddress = cjs.cosmosAddressFromPublicKey(compressedPubKeyHex);
assert.equal(esmAddress, cjsAddress);
assert.match(esmAddress, /^bb1[a-z0-9]+$/);

const mnemonic = 'test test test test test test test test test test test junk';
const esmAdapter = await esm.GenericCosmosAdapter.fromMnemonic(mnemonic, 'bitbadges-1');
const cjsAdapter = await cjs.GenericCosmosAdapter.fromMnemonic(mnemonic, 'bitbadges-1');
assert.equal(esmAdapter.address, cjsAdapter.address);
assert.match(esmAdapter.address, /^bb1[a-z0-9]+$/);

execFileSync(
  'node',
  [
    '--input-type=module',
    '-e',
    `
  import assert from 'node:assert/strict';
  import { createRequire } from 'node:module';
  const esm = await import(${JSON.stringify(new URL('../dist/esm/index.js', import.meta.url).href)});
  const cjs = createRequire(import.meta.url)(${JSON.stringify(fileURLToPath(new URL('../dist/cjs/index.js', import.meta.url)))});
  for (const sdk of [esm, cjs]) {
    assert.equal(typeof sdk.BitBadgesSigningClient, 'function');
    assert.equal(sdk.listStandardBuilders().length > 0, true);
  }
`
  ],
  { stdio: 'inherit' }
);
console.log('Bun and Node ESM/CommonJS package imports passed.');
