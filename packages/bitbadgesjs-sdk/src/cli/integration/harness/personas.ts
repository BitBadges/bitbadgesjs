/**
 * Persona registry for integration tests. Wraps `<binary> keys list`
 * once at module load and exposes addresses by name. Required personas:
 * alice, charlie. Optional: bob, dave, verifier — tests pick the role
 * that fits their flow.
 */

import { execSync } from 'node:child_process';
import { loadIntegrationEnv } from './preflight.js';

interface KeyEntry {
  name: string;
  address: string;
}

let cachedKeys: KeyEntry[] | null = null;

function loadKeys(): KeyEntry[] {
  if (cachedKeys) return cachedKeys;
  const env = loadIntegrationEnv();
  const raw = execSync(`${env.chainBin} keys list --keyring-backend ${env.keyringBackend} --output=json`, {
    stdio: 'pipe',
    timeout: 5000
  }).toString();
  const parsed: Array<{ name: string; address: string }> = JSON.parse(raw);
  cachedKeys = parsed.map((k) => ({ name: k.name, address: k.address }));
  return cachedKeys;
}

export interface Persona {
  name: string;
  address: string;
}

export function persona(name: string): Persona {
  const k = loadKeys().find((x) => x.name === name);
  if (!k) {
    throw new Error(
      `Persona "${name}" not found in keyring. Available: ${loadKeys().map((x) => x.name).join(', ')}`
    );
  }
  return k;
}

export function allPersonas(): Persona[] {
  return loadKeys();
}

/** Convenience getters — throws if missing. */
export const alice = (): Persona => persona('alice');
export const charlie = (): Persona => persona('charlie');
export const burn = (): Persona => persona('burn');

/** A persona that exists OR a fallback. Useful for optional roles like bob. */
export function personaOr(name: string, fallback: Persona): Persona {
  try { return persona(name); } catch { return fallback; }
}
