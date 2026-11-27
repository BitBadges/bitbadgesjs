/**
 * Privacy-safe, strictly opt-in handoff telemetry for agent-side receipt verification (BB-292).
 *
 * Contract matches apps/frontend/src/utils/handoffTelemetry.ts and
 * services/indexer/src/routes/handoffTelemetryCore.ts (`POST /api/v0/telemetry/handoff`):
 *   - Exactly four allowlisted fields: `event`, `flow`, `durationBucket`, `recoveries`.
 *   - Zero addresses, transaction hashes, bodies, URLs, query params, request IDs, or secrets.
 *   - Off by default; requires explicit opt-in (`telemetry: true` or `BITBADGES_HANDOFF_TELEMETRY=1`).
 *   - Do Not Track / Global Privacy Control (`DO_NOT_TRACK`, `DNT`, `GPC`, `SEC_GPC`,
 *     `navigator.doNotTrack`, `navigator.globalPrivacyControl`) always override opt-in.
 *   - Network failures are swallowed so telemetry can never fail receipt verification.
 */

export const HANDOFF_TELEMETRY_ENV = 'BITBADGES_HANDOFF_TELEMETRY';
export const HANDOFF_TELEMETRY_PATH = '/api/v0/telemetry/handoff';

export const HANDOFF_EVENTS = ['draft-ready', 'review-open', 'rejected', 'submitted', 'verified-complete'] as const;
export const HANDOFF_FLOWS = ['login', 'msg', 'tx-cosmos', 'tx-evm'] as const;
export const DURATION_BUCKETS = ['lt5s', 'lt30s', 'lt2m', 'lt10m', 'gte10m'] as const;

export type HandoffEventName = (typeof HANDOFF_EVENTS)[number];
export type HandoffFlow = (typeof HANDOFF_FLOWS)[number];
export type DurationBucket = (typeof DURATION_BUCKETS)[number];
export type HandoffEvent = {
  event: HandoffEventName;
  flow: HandoffFlow;
  durationBucket: DurationBucket;
  recoveries: 0 | 1 | 2;
};

export type HandoffPrivacyEnv = Record<string, string | undefined>;
export type HandoffPrivacyNav = { doNotTrack?: string | null; globalPrivacyControl?: boolean };

const ALLOWED_FIELDS = ['durationBucket', 'event', 'flow', 'recoveries'] as const;
const TRUTHY_PRIVACY_VALUES = new Set(['1', 'true', 'yes']);
const OPT_IN_ENV_VALUES = new Set(['1', 'true', 'share']);

function oneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function defaultEnv(): HandoffPrivacyEnv | undefined {
  return typeof process !== 'undefined' && process?.env ? process.env : undefined;
}

function defaultNav(): HandoffPrivacyNav | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator as unknown as HandoffPrivacyNav;
}

/** Validate and return an exact 4-field allowlisted handoff event, or null if anything is out of bounds. */
export function sanitizeHandoffEvent(input: unknown): HandoffEvent | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const keys = Object.keys(input).sort();
  if (keys.length !== ALLOWED_FIELDS.length || keys.some((key, index) => key !== ALLOWED_FIELDS[index])) return null;
  const { event, flow, durationBucket: bucket, recoveries } = input as Record<string, unknown>;
  if (!oneOf(HANDOFF_EVENTS, event) || !oneOf(HANDOFF_FLOWS, flow) || !oneOf(DURATION_BUCKETS, bucket)) return null;
  if (recoveries !== 0 && recoveries !== 1 && recoveries !== 2) return null;
  return { event, flow, durationBucket: bucket, recoveries };
}

/** Coarse duration bucket matching the browser handoff telemetry contract. */
export function durationBucket(ms: number): DurationBucket {
  if (Number.isNaN(ms) || ms < 5_000) return 'lt5s';
  if (ms < 30_000) return 'lt30s';
  if (ms < 120_000) return 'lt2m';
  if (ms < 600_000) return 'lt10m';
  return 'gte10m';
}

/** Clamp an optional recovery count into the allowlisted 0 | 1 | 2 range. */
export function clampHandoffRecoveries(value?: number): 0 | 1 | 2 {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0;
  if (value >= 2) return 2;
  return Math.trunc(value) as 0 | 1 | 2;
}

/** Returns true if any Do Not Track or Global Privacy Control signal is active. */
export function isPrivacySignalEnabled(args: { env?: HandoffPrivacyEnv; nav?: HandoffPrivacyNav } = {}): boolean {
  const env = args.env ?? defaultEnv();
  const nav = args.nav ?? defaultNav();
  if (nav?.doNotTrack === '1' || nav?.doNotTrack === 'yes' || nav?.globalPrivacyControl === true) return true;
  if (env) {
    for (const key of ['DO_NOT_TRACK', 'DNT', 'GPC', 'SEC_GPC'] as const) {
      const raw = env[key];
      if (typeof raw === 'string' && TRUTHY_PRIVACY_VALUES.has(raw.trim().toLowerCase())) return true;
    }
  }
  return false;
}

/**
 * Determine whether opt-in handoff telemetry may be sent.
 * Off by default. Privacy signals (DNT / GPC) and explicit `telemetry: false` always win.
 */
export function isHandoffTelemetryOptedIn(
  args: { telemetry?: boolean; env?: HandoffPrivacyEnv; nav?: HandoffPrivacyNav } = {}
): boolean {
  if (isPrivacySignalEnabled({ env: args.env, nav: args.nav })) return false;
  if (args.telemetry === false) return false;
  if (args.telemetry === true) return true;
  const env = args.env ?? defaultEnv();
  const raw = env?.[HANDOFF_TELEMETRY_ENV];
  return typeof raw === 'string' && OPT_IN_ENV_VALUES.has(raw.trim().toLowerCase());
}

/**
 * Post one strictly allowlisted handoff event to `<indexerUrl>/api/v0/telemetry/handoff`.
 * Never throws; returns true only when the server acknowledges with an OK status.
 */
export async function sendHandoffTelemetryEvent(args: {
  indexerUrl: string;
  event: HandoffEvent;
  apiKey?: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
}): Promise<boolean> {
  const clean = sanitizeHandoffEvent(args.event);
  const doFetch = args.fetch ?? (typeof fetch === 'function' ? fetch : undefined);
  if (!clean || !doFetch || !args.indexerUrl) return false;
  const url = `${args.indexerUrl.replace(/\/$/, '')}${HANDOFF_TELEMETRY_PATH}`;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (args.apiKey) headers['x-api-key'] = args.apiKey;
  try {
    const response = await doFetch(url, {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      ...(args.signal ? { signal: args.signal } : {}),
      headers,
      body: JSON.stringify(clean)
    });
    return Boolean(response?.ok);
  } catch {
    // Telemetry must never break or alter receipt verification.
    return false;
  }
}
