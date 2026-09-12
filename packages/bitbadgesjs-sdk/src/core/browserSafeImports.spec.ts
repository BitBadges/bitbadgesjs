import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  deriveIntermediateSender,
  generateAlias,
  generateAliasAddressForDenom,
  generateAliasAddressForIBCBackedDenom,
  getAliasDerivationKeysForBadge,
  getAliasDerivationKeysForList
} from './aliases';
import { stableHashId, uniqueId } from './builders/shared';

/**
 * These modules are reachable from the browser bundle through the package
 * root. They must not import Node built-ins (`crypto` alone drags an 82 KB
 * polyfill into every frontend route) — and swapping the hash implementation
 * must not move a single on-chain address, so the vectors below are pinned.
 */

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.ts$/.test(e.name) && !/\.spec\.ts$|\.d\.ts$/.test(e.name) ? [p] : [];
  });
const src = path.join(__dirname, '..');
const browserDirs = ['core', 'transactions', 'eip712', 'api-indexer', 'address-converter', 'common', 'interfaces']
  .map((d) => path.join(src, d))
  .filter(fs.existsSync);

it('browser-reachable modules do not import Node built-ins', () => {
  const offenders = browserDirs
    .flatMap(walk)
    .filter((p) => /^import .* from ['"](node:)?(crypto|fs|path|os|child_process|stream|buffer)['"]/m.test(fs.readFileSync(p, 'utf8')))
    .map((p) => path.relative(src, p));
  expect(offenders).toEqual([]);
});

it('browser-reachable modules import ethers by name, never the whole namespace', () => {
  // `import { ethers } from 'ethers'` defeats tree shaking and ships Wallet/HDNode/wordlists (~117 KB brotli).
  const offenders = browserDirs
    .flatMap(walk)
    .filter((p) => /import \{[^}]*\bethers\b[^}]*\} from ['"]ethers['"]/.test(fs.readFileSync(p, 'utf8')))
    .map((p) => path.relative(src, p));
  expect(offenders).toEqual([]);
});

describe('alias derivation stays byte-identical', () => {
  // Captured from the crypto.createHash implementation before the swap.
  it('pinned vectors', () => {
    expect(generateAlias('tokenization', getAliasDerivationKeysForBadge('1', 1n))).toBe(
      'bb1j2wtm5ww5pex2syvcdacjdmxp8t2y0fdx3vmz3qc6anqpug6jqjs5x4dk6'
    );
    expect(generateAlias('tokenization', getAliasDerivationKeysForList('0'))).toBe(
      'bb1f86qt4rpwxaagkcpskrhdt6gyjyc38fr68vwpxphjfhfl8j8ja7s9ulw2a'
    );
    expect(generateAliasAddressForDenom('ubadge')).toBe('bb1gycvn0nc50lh753dgk4qys5p2sdws8aw7ec9v9gg65pkhm6hqq3qjd3t3n');
    expect(generateAliasAddressForIBCBackedDenom('ibc/E1116484')).toBe('bb1q9dvvexdqmk0gnpnxgk4wj35l0p0hcj20gt5qcch6agscl8zm72sjk9vfw');
    expect(deriveIntermediateSender('channel-0', 'cosmos1qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5lzv7xu', 'bb')).toBe(
      'bb1dkcsj3a0kr7trpa3xsf9kzy0pg5yupsehqzrr7e6rf4dxce8mfqq0e6n5r'
    );
  });

  it('matches an independent sha256(sha256(typ) || key) chain', () => {
    // Cosmos address.Module: Hash("module", moduleName || 0x00 || key0), then Derive for each further key.
    const hash = (typ: Buffer, key: Buffer) => createHash('sha256').update(createHash('sha256').update(typ).digest()).update(key).digest();
    const keys = [Buffer.from([0x08]), Buffer.from('0000000000000007', 'hex')];
    let addr = hash(Buffer.from('module'), Buffer.concat([Buffer.from('tokenization'), Buffer.from([0]), keys[0]]));
    addr = hash(addr, keys[1]);
    const { bech32 } = require('bech32');
    expect(generateAlias('tokenization', keys)).toBe(bech32.encode('bb', bech32.toWords(addr)));
  });
});

describe('builder ids', () => {
  it('stableHashId is sha256 of the seed, pinned', () => {
    expect(stableHashId('approval', { collectionId: '1', tokenIds: [1, 2] })).toBe('approval-1f4d6b13fd9608f9');
    expect(stableHashId('x', 'seed')).toBe('x-' + createHash('sha256').update('seed').digest('hex').slice(0, 16));
  });
  it('uniqueId is 8 random bytes as hex and differs per call', () => {
    const a = uniqueId('p');
    expect(a).toMatch(/^p-[0-9a-f]{16}$/);
    expect(uniqueId()).toMatch(/^[0-9a-f]{16}$/);
    expect(uniqueId('p')).not.toBe(a);
  });
});
