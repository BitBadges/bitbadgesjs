/**
 * Parameterized tests for KVStore implementations: MemoryStore + FileStore.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileStore, MemoryStore, type KVStore } from './sessionStore.js';

interface StoreHarness {
  name: string;
  make: () => { store: KVStore; cleanup: () => void };
  /** TTL expiry simulation strategy — MemoryStore uses fake timers, FileStore mutates payload. */
  expire: (store: KVStore, key: string) => Promise<void>;
}

const harnesses: StoreHarness[] = [
  {
    name: 'MemoryStore',
    make: () => ({ store: new MemoryStore(), cleanup: () => {} }),
    // MemoryStore expiry is handled inline in the TTL test — it mocks
    // Date.now directly rather than going through this helper.
    expire: async () => {}
  },
  {
    name: 'FileStore',
    make: () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-agent-filestore-'));
      const store = new FileStore({ dir });
      return {
        store,
        cleanup: () => {
          try {
            fs.rmSync(dir, { recursive: true, force: true });
          } catch {
            /* ignore */
          }
        }
      };
    },
    // FileStore: rewrite the payload on disk with an expired expiresAt.
    expire: async (store, key) => {
      const fs_ = fs as typeof import('fs');
      const dir = (store as FileStore).dir;
      const safe = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const p = path.join(dir, `${safe}.json`);
      const raw = JSON.parse(fs_.readFileSync(p, 'utf8'));
      raw.expiresAt = Date.now() - 10_000;
      fs_.writeFileSync(p, JSON.stringify(raw));
    }
  }
];

describe.each(harnesses)('KVStore: $name', ({ make, expire, name }) => {
  let harness: { store: KVStore; cleanup: () => void };

  beforeEach(() => {
    harness = make();
  });

  afterEach(() => {
    harness.cleanup();
  });

  it('get-missing returns null', async () => {
    expect(await harness.store.get('not-there')).toBeNull();
  });

  it('set then get round-trips the value', async () => {
    await harness.store.set('k1', 'hello world');
    expect(await harness.store.get('k1')).toBe('hello world');
  });

  it('delete removes the entry', async () => {
    await harness.store.set('to-del', 'bye');
    expect(await harness.store.get('to-del')).toBe('bye');
    await harness.store.delete('to-del');
    expect(await harness.store.get('to-del')).toBeNull();
  });

  it('delete of missing key does not throw', async () => {
    await expect(harness.store.delete('nonexistent')).resolves.not.toThrow();
  });

  it('TTL expiry → get returns null after TTL passes', async () => {
    if (name === 'MemoryStore') {
      // Mock Date.now only — don't replace setImmediate / Promise microtasks,
      // which would deadlock the async test.
      const origNow = Date.now;
      const base = origNow();
      let advance = 0;
      Date.now = () => base + advance;
      try {
        await harness.store.set('ttl-key', 'transient', { ttlSeconds: 1 });
        advance = 2000; // jump 2s forward
        expect(await harness.store.get('ttl-key')).toBeNull();
      } finally {
        Date.now = origNow;
      }
    } else {
      await harness.store.set('ttl-key', 'transient', { ttlSeconds: 1 });
      await expire(harness.store, 'ttl-key');
      expect(await harness.store.get('ttl-key')).toBeNull();
    }
  });

  it('large-value (>100KB) round-trip', async () => {
    const big = 'x'.repeat(150_000); // 150KB
    await harness.store.set('big', big);
    const roundTripped = await harness.store.get('big');
    expect(roundTripped).toBe(big);
    expect(roundTripped!.length).toBe(150_000);
  });

  it('overwrite replaces previous value', async () => {
    await harness.store.set('k', 'first');
    await harness.store.set('k', 'second');
    expect(await harness.store.get('k')).toBe('second');
  });
});

describe('FileStore — construction', () => {
  it('creates its dir if missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-agent-fs-ctor-'));
    const child = path.join(dir, 'nested', 'deeper');
    const store = new FileStore({ dir: child });
    expect(store.dir).toBe(child);
    expect(fs.existsSync(child)).toBe(true);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('sanitizes keys with special characters', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-agent-fs-sanitize-'));
    const store = new FileStore({ dir });
    try {
      // Slashes / colons should be sanitized into the file name.
      await store.set('path/with:weird?chars', 'ok');
      expect(await store.get('path/with:weird?chars')).toBe('ok');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('MemoryStore — clear helper', () => {
  it('clear() wipes everything', async () => {
    const store = new MemoryStore();
    await store.set('a', '1');
    await store.set('b', '2');
    store.clear();
    expect(await store.get('a')).toBeNull();
    expect(await store.get('b')).toBeNull();
  });
});
