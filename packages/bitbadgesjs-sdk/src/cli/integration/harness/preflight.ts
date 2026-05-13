/**
 * Preflight checks for the integration test runner.
 *
 * Integration tests assume a live BitBadges chain + indexer on localhost.
 * This module asserts the assumptions OR skips the suite cleanly with a
 * descriptive reason, so CI / cold-checkout developers don't see 50 red
 * tests when the chain isn't running.
 *
 * Env vars:
 *   BB_INTEGRATION_RPC_URL      default: http://localhost:26657
 *   BB_INTEGRATION_INDEXER_URL  default: http://localhost:3001
 *   BB_INTEGRATION_CHAIN_BIN    default: bitbadgeschaind (must be on PATH)
 *   BB_INTEGRATION_KEYRING      default: test
 *   BB_INTEGRATION_SKIP=1       force-skip the suite (override health checks)
 */

import { execSync } from 'node:child_process';

export interface IntegrationEnv {
  rpcUrl: string;
  indexerUrl: string;
  chainBin: string;
  keyringBackend: string;
  chainId: string;
}

export function loadIntegrationEnv(): IntegrationEnv {
  return {
    rpcUrl: process.env.BB_INTEGRATION_RPC_URL ?? 'http://localhost:26657',
    indexerUrl: process.env.BB_INTEGRATION_INDEXER_URL ?? 'http://localhost:3001',
    chainBin: process.env.BB_INTEGRATION_CHAIN_BIN ?? 'bitbadgeschaind',
    keyringBackend: process.env.BB_INTEGRATION_KEYRING ?? 'test',
    chainId: process.env.BB_INTEGRATION_CHAIN_ID ?? 'bitbadges-1'
  };
}

export interface PreflightResult {
  ok: boolean;
  reason?: string;
  env: IntegrationEnv;
}

async function probe(url: string, timeoutMs = 2000): Promise<number> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal as any });
    return res.status;
  } catch {
    return 0;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Run all preflight checks. Resolves with `ok: true` when ready, or
 * `ok: false` with a human-readable reason — caller (`describe.skip`)
 * decides what to do.
 */
export async function preflightIntegration(): Promise<PreflightResult> {
  const env = loadIntegrationEnv();
  if (process.env.BB_INTEGRATION_SKIP === '1') {
    return { ok: false, reason: 'BB_INTEGRATION_SKIP=1', env };
  }

  // 1. RPC up
  const rpcStatus = await probe(`${env.rpcUrl}/status`);
  if (rpcStatus !== 200) {
    return { ok: false, reason: `RPC ${env.rpcUrl}/status returned ${rpcStatus}`, env };
  }

  // 2. Indexer up (POST /browse — known-cheap route that doesn't require auth)
  let indexerStatus = 0;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${env.indexerUrl}/api/v0/browse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'collections' }),
      signal: ctrl.signal as any
    });
    indexerStatus = res.status;
    clearTimeout(t);
  } catch {
    indexerStatus = 0;
  }
  if (indexerStatus !== 200) {
    return { ok: false, reason: `Indexer ${env.indexerUrl}/api/v0/browse returned ${indexerStatus}`, env };
  }

  // 3. Chain binary on PATH
  try {
    execSync(`${env.chainBin} version --output=json 2>&1`, { stdio: 'pipe', timeout: 3000 });
  } catch (err) {
    return { ok: false, reason: `Chain binary "${env.chainBin}" not runnable: ${(err as Error).message}`, env };
  }

  // 4. Keyring has alice + charlie (the default personas)
  let keys: string;
  try {
    keys = execSync(`${env.chainBin} keys list --keyring-backend ${env.keyringBackend} --output=json`, {
      stdio: 'pipe',
      timeout: 3000
    }).toString();
  } catch (err) {
    return { ok: false, reason: `\`${env.chainBin} keys list\` failed: ${(err as Error).message}`, env };
  }
  let parsed: Array<{ name: string }>;
  try {
    parsed = JSON.parse(keys);
  } catch {
    return { ok: false, reason: `Could not parse keyring output: ${keys.slice(0, 200)}`, env };
  }
  const names = new Set(parsed.map((k) => k.name));
  for (const required of ['alice', 'charlie']) {
    if (!names.has(required)) {
      return {
        ok: false,
        reason: `Keyring missing required persona "${required}". Add with: ${env.chainBin} keys add ${required} --keyring-backend ${env.keyringBackend}`,
        env
      };
    }
  }

  return { ok: true, env };
}

/**
 * Convenience wrapper for `describe.skip`-style guard at the top of a
 * spec file. Returns `describe.skip` when preflight failed (with a
 * descriptive describe-string carrying the reason) and `describe`
 * otherwise.
 *
 * Usage:
 *   const d = await maybeDescribe('subscription flow');
 *   d('subscription flow', () => { ... });
 */
export async function maybeDescribe(name: string): Promise<jest.Describe> {
  const r = await preflightIntegration();
  if (r.ok) return describe;
  process.stderr.write(`[integration] SKIP "${name}" — ${r.reason}\n`);
  return describe.skip;
}
