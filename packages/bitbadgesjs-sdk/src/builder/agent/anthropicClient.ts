/**
 * Peer-dependency-safe accessor for `@anthropic-ai/sdk`.
 *
 * BitBadgesAgent does NOT hard-depend on `@anthropic-ai/sdk` — it's a
 * peerDependency (marked optional). Consumers install it themselves,
 * so their Anthropic API keys never touch BitBadges infrastructure.
 *
 * This module dynamically imports the SDK on first use and throws a
 * clear, actionable error if it's missing or outside the supported
 * version range.
 */

import { PeerDependencyError } from './errors.js';

const SUPPORTED_MIN_MAJOR = 0;
const SUPPORTED_MIN_MINOR = 80;
const SUPPORTED_MAX_MAJOR = 1;
const SUPPORTED_RANGE = `>=${SUPPORTED_MIN_MAJOR}.${SUPPORTED_MIN_MINOR}.0 <${SUPPORTED_MAX_MAJOR}.0.0`;

let cachedModule: any | null = null;

/**
 * Parse `x.y.z` from the loaded module's VERSION export and enforce
 * the supported range. Runs once at module load (cachedModule boundary)
 * so the cost is negligible. Silently skips the check if VERSION is
 * absent or unparseable — we'd rather attempt to proceed than hard-fail
 * on a future SDK that renames the field.
 */
function assertSupportedVersion(mod: any): void {
  const raw = mod?.VERSION ?? mod?.default?.VERSION ?? mod?.Anthropic?.VERSION;
  if (typeof raw !== 'string') return;
  const m = raw.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return;
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const tooOld = major < SUPPORTED_MIN_MAJOR || (major === SUPPORTED_MIN_MAJOR && minor < SUPPORTED_MIN_MINOR);
  const tooNew = major >= SUPPORTED_MAX_MAJOR;
  if (tooOld || tooNew) {
    throw new PeerDependencyError(
      `@anthropic-ai/sdk version ${raw} detected; BitBadgesAgent requires ${SUPPORTED_RANGE}. ` +
        `Install a compatible version, e.g. npm install @anthropic-ai/sdk@^0.82`
    );
  }
}

/** Loads @anthropic-ai/sdk dynamically. Throws PeerDependencyError if missing or out of range. */
export async function loadAnthropicSdk(): Promise<any> {
  if (cachedModule) return cachedModule;

  // Step 1: resolve the module. We try multiple strategies because
  // peer-dep resolution breaks under bun-link / npm-link scenarios:
  // the SDK lives at `bitbadgesjs/packages/bitbadgesjs-sdk/` which
  // has no `@anthropic-ai/sdk` of its own, but the consumer (e.g.
  // the indexer) has it in their node_modules. A naive dynamic
  // import resolves from the SDK's own URL and misses the consumer's
  // installation.
  //
  // Strategy:
  //   1. Try bare dynamic import — works when SDK is installed
  //      normally (non-symlinked) and the dep sits alongside it.
  //   2. Fallback: createRequire anchored at the consumer's CWD —
  //      works when SDK is bun-linked and the consumer has the dep.
  //   3. Fallback: createRequire anchored at the SDK's own file —
  //      covers hoisted monorepos.
  //
  // Only "all resolution strategies failed" falls into the generic
  // "please install" message, so the version-check error from step 2
  // doesn't get swallowed and re-labeled as missing.
  let mod: any;
  let lastError: unknown = null;

  const tryStrategies: Array<() => Promise<any> | any> = [
    // Strategy 1: bare dynamic import (runtime-resolved string so TS
    // + bundlers don't follow this peer dep).
    async () => {
      const modSpecifier = '@anthropic-ai/sdk';
      return await (Function('s', 'return import(s)') as any)(modSpecifier);
    },
    // Strategy 2: createRequire from the consumer's CWD. This is the
    // bun-link / npm-link fix — resolves `@anthropic-ai/sdk` against
    // wherever the consumer's `node_modules` tree starts.
    async () => {
      if (typeof process === 'undefined') throw new Error('no process');
      const mod = await import('module');
      const createRequire = (mod as any).createRequire ?? (mod as any).default?.createRequire;
      const req = createRequire(process.cwd() + '/package.json');
      return req('@anthropic-ai/sdk');
    },
    // Strategy 3: createRequire anchored at the SDK's own file. Works
    // in CJS (where __filename is defined) and covers hoisted
    // monorepos. Skipped in pure-ESM contexts — strategies 1 + 2 are
    // enough to cover ESM consumers.
    async () => {
      // Use eval so TS doesn't error on __filename in strict mode.
      // eslint-disable-next-line no-eval
      const fn: string | undefined = (0, eval)(`typeof __filename !== 'undefined' ? __filename : undefined`);
      if (!fn) throw new Error('no CJS anchor');
      const mod = await import('module');
      const createRequire = (mod as any).createRequire ?? (mod as any).default?.createRequire;
      const req = createRequire(fn);
      return req('@anthropic-ai/sdk');
    }
  ];

  for (const strategy of tryStrategies) {
    try {
      mod = await strategy();
      if (mod) break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!mod) {
    throw new PeerDependencyError(
      `@anthropic-ai/sdk is required to use BitBadgesAgent but could not be resolved from any ` +
        `known location (bare import, consumer CWD, SDK location). Install it in your project: ` +
        `npm install @anthropic-ai/sdk (supported range: ${SUPPORTED_RANGE}). ` +
        (lastError ? `Last resolution error: ${(lastError as any)?.message ?? String(lastError)}` : '')
    );
  }

  // Step 2: enforce the supported range. Lets the caller see the real
  // "version X detected; requires Y" message instead of a misleading
  // "not installed" message.
  assertSupportedVersion(mod);

  cachedModule = mod.default ?? mod;
  return cachedModule;
}

/**
 * Builds an Anthropic client from the given options. If `client` is
 * provided, returns it as-is. Otherwise auto-resolves credentials from
 * (in order): explicit `authToken` (OAuth) → explicit `apiKey` →
 * `ANTHROPIC_AUTH_TOKEN` env → `ANTHROPIC_OAUTH_TOKEN` env (Claude
 * Code / Claude Pro dev compat) → `ANTHROPIC_API_KEY` env.
 */
export async function getAnthropicClient(opts: {
  client?: any;
  apiKey?: string;
  /** OAuth bearer token — alternative to apiKey. Set when using Claude OAuth / Claude Code. */
  authToken?: string;
  baseURL?: string;
}): Promise<any> {
  if (opts.client) return opts.client;

  // `loadAnthropicSdk` returns `mod.default ?? mod`. That IS the
  // Anthropic constructor (verified: .name === "Anthropic", has
  // .messages on instance). DO NOT descend into `.Anthropic` on the
  // class — that property exists but points at BaseAnthropic (an
  // internal parent with no `.messages` resource). Previous code did
  // `Anthropic.Anthropic ?? Anthropic` and accidentally landed on
  // BaseAnthropic, producing "Cannot read properties of undefined
  // (reading 'create')" the moment any build ran.
  const ctor = await loadAnthropicSdk();

  const authToken =
    opts.authToken ??
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_OAUTH_TOKEN : undefined);
  const apiKey =
    opts.apiKey ??
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined);

  if (!authToken && !apiKey) {
    throw new PeerDependencyError(
      'No Anthropic credentials found. Provide one of: `anthropicKey` (API key), `anthropicAuthToken` (OAuth token, e.g. from Claude Code), or a pre-built `anthropicClient`. Env fallbacks: ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_OAUTH_TOKEN.'
    );
  }

  // Anthropic v0.80+ rejects OAuth bearer tokens unless the
  // `anthropic-beta: oauth-2025-04-20` header is explicitly set.
  // API keys do not need it. We detect OAuth-vs-key by which credential
  // was supplied and add the header only for the OAuth path.
  const clientOpts: Record<string, unknown> = { baseURL: opts.baseURL };
  if (authToken) {
    clientOpts.authToken = authToken;
    clientOpts.defaultHeaders = { 'anthropic-beta': 'oauth-2025-04-20' };
  } else {
    clientOpts.apiKey = apiKey;
  }

  return new ctor(clientOpts);
}
