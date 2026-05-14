/**
 * Tests for burner.ts — the persistence layer for throwaway signers.
 *
 * Covers the disk-store helpers: saveBurner / updateBurner / listBurners /
 * findBurner / deleteBurner. Wallet generation, network polling, and the
 * runBurnerCreate orchestration touch the chain / signing SDK and live
 * outside this spec.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import {
  saveBurner,
  updateBurner,
  listBurners,
  findBurner,
  deleteBurner,
  type BurnerWalletRecord
} from './burner.js';

const ORIG_CFG_DIR = process.env.BITBADGES_CONFIG_DIR;

beforeEach(() => {
  const tmp = path.join(os.tmpdir(), `bb-burnertest-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(tmp, { recursive: true });
  process.env.BITBADGES_CONFIG_DIR = tmp;
});

afterAll(() => {
  if (ORIG_CFG_DIR === undefined) delete process.env.BITBADGES_CONFIG_DIR;
  else process.env.BITBADGES_CONFIG_DIR = ORIG_CFG_DIR;
});

function makeRecord(overrides: Partial<BurnerWalletRecord> = {}): BurnerWalletRecord {
  return {
    version: 1,
    address: 'bb1abc',
    mnemonic: 'test mnemonic phrase',
    network: 'mainnet',
    chainId: 'bitbadges_1-1',
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...overrides
  };
}

describe('saveBurner', () => {
  it('writes the record to a file under burners/', () => {
    const filePath = saveBurner(makeRecord());
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('burners');
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(parsed.address).toBe('bb1abc');
  });

  it('strips filePath before persisting (it is in-memory only)', () => {
    const filePath = saveBurner({ ...makeRecord(), filePath: '/should/be/stripped' });
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(parsed.filePath).toBeUndefined();
  });

  it('writes mode 0600 (owner-only readable)', () => {
    const filePath = saveBurner(makeRecord());
    const mode = fs.statSync(filePath).mode & 0o777;
    expect(mode).toBe(0o600);
  });
});

describe('updateBurner', () => {
  it('merges patch into the persisted record', () => {
    const filePath = saveBurner(makeRecord());
    const after = updateBurner(filePath, { status: 'broadcast', txHash: 'HASH' });
    expect(after.status).toBe('broadcast');
    expect(after.txHash).toBe('HASH');
    expect(after.address).toBe('bb1abc'); // pre-existing fields preserved
  });

  it('keeps filePath in the returned object but not on disk', () => {
    const filePath = saveBurner(makeRecord());
    const after = updateBurner(filePath, { status: 'funded' });
    expect(after.filePath).toBe(filePath);
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(parsed.filePath).toBeUndefined();
  });
});

describe('listBurners', () => {
  it('returns [] when no burners directory exists', () => {
    expect(listBurners()).toEqual([]);
  });

  it('returns persisted records', () => {
    saveBurner(makeRecord({ address: 'bb1one', createdAt: '2026-01-01T00:00:00.000Z' }));
    saveBurner(makeRecord({ address: 'bb1two', createdAt: '2026-02-01T00:00:00.000Z' }));
    const all = listBurners();
    expect(all).toHaveLength(2);
    expect(all.map((r) => r.address).sort()).toEqual(['bb1one', 'bb1two']);
  });

  it('sorts by createdAt descending (newest first)', () => {
    saveBurner(makeRecord({ address: 'bb1old', createdAt: '2026-01-01T00:00:00.000Z' }));
    saveBurner(makeRecord({ address: 'bb1new', createdAt: '2026-03-01T00:00:00.000Z' }));
    const all = listBurners();
    expect(all[0].address).toBe('bb1new');
    expect(all[1].address).toBe('bb1old');
  });

  it('skips malformed JSON files', () => {
    const filePath = saveBurner(makeRecord({ address: 'bb1good' }));
    const dir = path.dirname(filePath);
    fs.writeFileSync(path.join(dir, 'corrupt.json'), '{not valid', 'utf-8');
    const all = listBurners();
    expect(all).toHaveLength(1);
    expect(all[0].address).toBe('bb1good');
  });
});

describe('findBurner', () => {
  it('finds by absolute file path', () => {
    const filePath = saveBurner(makeRecord());
    expect(findBurner(filePath)?.address).toBe('bb1abc');
  });

  it('finds by address', () => {
    saveBurner(makeRecord({ address: 'bb1target' }));
    expect(findBurner('bb1target')?.address).toBe('bb1target');
  });

  it('returns undefined when nothing matches', () => {
    saveBurner(makeRecord({ address: 'bb1other' }));
    expect(findBurner('bb1missing')).toBeUndefined();
  });
});

describe('deleteBurner', () => {
  it('removes the file', () => {
    const filePath = saveBurner(makeRecord());
    deleteBurner(filePath);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('no-ops on a non-existent file (does not throw)', () => {
    expect(() => deleteBurner('/tmp/nonexistent-burner.json')).not.toThrow();
  });
});
