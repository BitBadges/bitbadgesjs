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

const SUPPORTED_RANGE = '>=0.80.0 <1.0.0';

let cachedModule: any | null = null;

/** Loads @anthropic-ai/sdk dynamically. Throws PeerDependencyError if missing. */
export async function loadAnthropicSdk(): Promise<any> {
  if (cachedModule) return cachedModule;
  try {
    // Use a runtime-resolved string so bundlers + TS don't follow this
    // peer dep. Importing '@anthropic-ai/sdk' directly would require
    // consumers to have @types/@anthropic-ai/sdk installed during SDK
    // build, defeating the peer-dep design.
    const modSpecifier = '@anthropic-ai/sdk';
    const mod: any = await (Function('s', 'return import(s)') as any)(modSpecifier);
    cachedModule = mod.default ?? mod;
    return cachedModule;
  } catch (err) {
    throw new PeerDependencyError(
      `@anthropic-ai/sdk is required to use BitBadgesAgent but is not installed. ` +
        `Install it with: npm install @anthropic-ai/sdk (supported range: ${SUPPORTED_RANGE})`
    );
  }
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
  const Anthropic = await loadAnthropicSdk();
  const ctor = Anthropic.Anthropic ?? Anthropic;

  const authToken =
    opts.authToken ??
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_OAUTH_TOKEN : undefined);
  const apiKey =
    opts.apiKey ??
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined);

  if (!authToken && !apiKey) {
    throw new PeerDependencyError(
      'No Anthropic credentials found. Provide one of: `anthropicKey` (API key), `anthropicAuthToken` (OAuth), or set ANTHROPIC_API_KEY / ANTHROPIC_OAUTH_TOKEN in the environment.'
    );
  }

  // The Anthropic SDK accepts either apiKey or authToken. Prefer OAuth when both are set.
  const clientOpts: Record<string, unknown> = { baseURL: opts.baseURL };
  if (authToken) clientOpts.authToken = authToken;
  else clientOpts.apiKey = apiKey;

  return new ctor(clientOpts);
}
