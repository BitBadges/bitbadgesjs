/**
 * File-backed session persistence.
 *
 * The in-memory session store (`sessionState.ts`) is ephemeral — it lives for
 * the lifetime of one process. CLI consumers run many one-shot processes, one
 * per tool call, and need session state to survive across them. These helpers
 * bridge the two: snapshot the in-memory session to `~/.bitbadges/sessions/<id>.json`
 * after each call, restore it from disk before the next.
 *
 * All functions default to `DEFAULT_SESSIONS_DIR` but accept an override so
 * agents can isolate sessions per workspace, tests can point at a tmpdir, and
 * no caller has to hardcode the path.
 *
 * These helpers never throw for "no session found" — missing files are a
 * normal condition (first call on a fresh id). They do throw on corrupt JSON
 * and I/O failures, since those are real problems a caller should see.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

import { exportSession, importSession } from './sessionState.js';

/** Default on-disk location for persisted session snapshots. */
export const DEFAULT_SESSIONS_DIR = path.join(os.homedir(), '.bitbadges', 'sessions');

/** Resolve the JSON file path for a session id under the given directory. */
export function sessionFilePath(id: string, dir: string = DEFAULT_SESSIONS_DIR): string {
  return path.join(dir, `${id}.json`);
}

/**
 * Load a persisted session snapshot from disk into the in-memory store.
 *
 * If no file exists at the expected path, this is a no-op — the caller will
 * fall through to `getOrCreateSession` which initializes a blank template on
 * first mutation. Throws on corrupt JSON or read failures so the caller can
 * surface the error.
 */
export function loadSessionFromDisk(id: string, dir: string = DEFAULT_SESSIONS_DIR): void {
  const file = sessionFilePath(id, dir);
  if (!fs.existsSync(file)) return;
  let snapshot: any;
  try {
    snapshot = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    throw new Error(`Failed to load session "${id}" from ${file}: ${(err as Error).message}`);
  }
  importSession(id, snapshot);
}

/**
 * Snapshot the in-memory session for the given id and write it to disk.
 *
 * No-op if the session doesn't exist in memory — a tool call that never
 * touched session state shouldn't create an empty file on disk. Creates the
 * target directory if it doesn't exist yet.
 */
export function saveSessionToDisk(id: string, dir: string = DEFAULT_SESSIONS_DIR): void {
  const snapshot = exportSession(id);
  if (snapshot === null) return;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(sessionFilePath(id, dir), JSON.stringify(snapshot, null, 2));
}

/** List persisted session ids under the given directory. Empty array if dir doesn't exist. */
export function listSessionFilesOnDisk(dir: string = DEFAULT_SESSIONS_DIR): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
}

/**
 * Read the raw JSON body of a persisted session snapshot, or null if not
 * present. Returns the string as-is so callers can either pretty-print or
 * re-parse.
 */
export function readSessionFileRaw(id: string, dir: string = DEFAULT_SESSIONS_DIR): string | null {
  const file = sessionFilePath(id, dir);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf-8');
}

/** Delete the persisted session file for the given id. No-op if absent. */
export function resetSessionFile(id: string, dir: string = DEFAULT_SESSIONS_DIR): void {
  const file = sessionFilePath(id, dir);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}
