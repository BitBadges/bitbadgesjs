/**
 * KVStore — pluggable session-state backend.
 *
 * BitBadgesBuilderAgent uses this to persist conversation messages and
 * running token counts across requests (so refinement works even
 * when the agent is instantiated per-request).
 *
 * Three implementations ship with the SDK:
 *   - MemoryStore: in-process Map. Default. Single-process only.
 *   - FileStore: one JSON file per session under a configured dir.
 *   - (consumers can bring their own — Redis, DynamoDB, etc.)
 *
 * The interface is intentionally minimal: get/set/delete with optional TTL.
 * Anything more complex (atomic counters, pub/sub) belongs in the consumer.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface KVStoreSetOptions {
  /** Seconds until the entry expires. Optional — stores may ignore. */
  ttlSeconds?: number;
}

export interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: KVStoreSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
}

// ============================================================
// MemoryStore
// ============================================================

interface MemoryEntry {
  value: string;
  expiresAt?: number;
}

export class MemoryStore implements KVStore {
  private readonly store = new Map<string, MemoryEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, opts?: KVStoreSetOptions): Promise<void> {
    const entry: MemoryEntry = { value };
    if (opts?.ttlSeconds && opts.ttlSeconds > 0) {
      entry.expiresAt = Date.now() + opts.ttlSeconds * 1000;
    }
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /** Test helper: clear everything. */
  clear() {
    this.store.clear();
  }
}

// ============================================================
// FileStore
// ============================================================

export interface FileStoreOptions {
  /** Directory to store session files in. Default: ~/.bitbadges/agent-sessions */
  dir?: string;
}

export class FileStore implements KVStore {
  readonly dir: string;

  constructor(opts?: FileStoreOptions) {
    const home = process.env.HOME || process.env.USERPROFILE || '/tmp';
    this.dir = opts?.dir ?? path.join(home, '.bitbadges', 'agent-sessions');
    try {
      fs.mkdirSync(this.dir, { recursive: true });
    } catch {
      // ignore — we'll fail on set() if the dir truly isn't writable
    }
  }

  private pathFor(key: string): string {
    const safe = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
    return path.join(this.dir, `${safe}.json`);
  }

  async get(key: string): Promise<string | null> {
    try {
      const raw = await fs.promises.readFile(this.pathFor(key), 'utf8');
      const parsed = JSON.parse(raw) as { value: string; expiresAt?: number };
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        await this.delete(key).catch(() => {});
        return null;
      }
      return parsed.value;
    } catch (err: any) {
      if (err?.code === 'ENOENT') return null;
      throw err;
    }
  }

  async set(key: string, value: string, opts?: KVStoreSetOptions): Promise<void> {
    const payload: { value: string; expiresAt?: number } = { value };
    if (opts?.ttlSeconds && opts.ttlSeconds > 0) {
      payload.expiresAt = Date.now() + opts.ttlSeconds * 1000;
    }
    await fs.promises.writeFile(this.pathFor(key), JSON.stringify(payload), 'utf8');
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.promises.unlink(this.pathFor(key));
    } catch (err: any) {
      if (err?.code !== 'ENOENT') throw err;
    }
  }
}
