import {
  DURATION_BUCKETS,
  HANDOFF_EVENTS,
  HANDOFF_FLOWS,
  HANDOFF_TELEMETRY_ENV,
  durationBucket,
  isHandoffTelemetryOptedIn,
  isPrivacySignalEnabled,
  sanitizeHandoffEvent,
  sendHandoffTelemetryEvent
} from './handoff-telemetry.js';

describe('handoff telemetry allowlist and privacy gates (BB-292)', () => {
  it('matches the exact allowlist contract shared with frontend and indexer', () => {
    expect([...HANDOFF_EVENTS]).toEqual(['draft-ready', 'review-open', 'rejected', 'submitted', 'verified-complete']);
    expect([...HANDOFF_FLOWS]).toEqual(['login', 'msg', 'tx-cosmos', 'tx-evm']);
    expect([...DURATION_BUCKETS]).toEqual(['lt5s', 'lt30s', 'lt2m', 'lt10m', 'gte10m']);
  });

  it('buckets durations identically to the browser recorder', () => {
    expect(durationBucket(Number.NaN)).toBe('lt5s');
    expect(durationBucket(-100)).toBe('lt5s');
    expect(durationBucket(0)).toBe('lt5s');
    expect(durationBucket(4_999)).toBe('lt5s');
    expect(durationBucket(5_000)).toBe('lt30s');
    expect(durationBucket(29_999)).toBe('lt30s');
    expect(durationBucket(30_000)).toBe('lt2m');
    expect(durationBucket(119_999)).toBe('lt2m');
    expect(durationBucket(120_000)).toBe('lt10m');
    expect(durationBucket(599_999)).toBe('lt10m');
    expect(durationBucket(600_000)).toBe('gte10m');
  });

  it('accepts only exact four-field allowlisted events and rejects extra fields or arbitrary data', () => {
    const valid = { event: 'verified-complete', flow: 'tx-cosmos', durationBucket: 'lt30s', recoveries: 0 } as const;
    expect(sanitizeHandoffEvent(valid)).toEqual(valid);
    expect(sanitizeHandoffEvent({ ...valid, flow: 'tx-evm', recoveries: 2 })).toEqual({
      event: 'verified-complete',
      flow: 'tx-evm',
      durationBucket: 'lt30s',
      recoveries: 2
    });

    const invalidCases: unknown[] = [
      null,
      undefined,
      [],
      'verified-complete',
      { ...valid, address: 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7' },
      { ...valid, url: 'https://bitbadges.io/sign?state=secret' },
      { ...valid, txHash: 'a'.repeat(64) },
      { event: 'verified-complete', flow: 'tx-cosmos', durationBucket: 'lt30s' },
      { ...valid, event: 'unknown' },
      { ...valid, flow: 'tx-solana' },
      { ...valid, durationBucket: 'lt1h' },
      { ...valid, recoveries: 3 },
      { ...valid, recoveries: -1 },
      { ...valid, recoveries: '0' },
      JSON.parse('{"event":"verified-complete","flow":"tx-cosmos","durationBucket":"lt30s","recoveries":0,"__proto__":{"x":1}}')
    ];
    for (const candidate of invalidCases) {
      expect(sanitizeHandoffEvent(candidate)).toBeNull();
    }
  });

  it('is disabled by default and requires explicit opt-in', () => {
    expect(isHandoffTelemetryOptedIn({ env: {}, nav: {} })).toBe(false);
    expect(isHandoffTelemetryOptedIn({ env: { [HANDOFF_TELEMETRY_ENV]: '' }, nav: {} })).toBe(false);
    expect(isHandoffTelemetryOptedIn({ env: { [HANDOFF_TELEMETRY_ENV]: '0' }, nav: {} })).toBe(false);
    expect(isHandoffTelemetryOptedIn({ env: { [HANDOFF_TELEMETRY_ENV]: 'off' }, nav: {} })).toBe(false);
    // "on" is local-only in the browser contract; network sharing requires explicit "1", "true", or "share"
    expect(isHandoffTelemetryOptedIn({ env: { [HANDOFF_TELEMETRY_ENV]: 'on' }, nav: {} })).toBe(false);

    expect(isHandoffTelemetryOptedIn({ telemetry: true, env: {}, nav: {} })).toBe(true);
    expect(isHandoffTelemetryOptedIn({ env: { [HANDOFF_TELEMETRY_ENV]: '1' }, nav: {} })).toBe(true);
    expect(isHandoffTelemetryOptedIn({ env: { [HANDOFF_TELEMETRY_ENV]: 'true' }, nav: {} })).toBe(true);
    expect(isHandoffTelemetryOptedIn({ env: { [HANDOFF_TELEMETRY_ENV]: 'share' }, nav: {} })).toBe(true);
  });

  it('always honors explicit opt-out and DO_NOT_TRACK / DNT / GPC / navigator privacy signals', () => {
    expect(isHandoffTelemetryOptedIn({ telemetry: false, env: { [HANDOFF_TELEMETRY_ENV]: '1' }, nav: {} })).toBe(false);

    for (const privacyEnv of [
      { DO_NOT_TRACK: '1' },
      { DO_NOT_TRACK: 'true' },
      { DO_NOT_TRACK: 'yes' },
      { DNT: '1' },
      { GPC: '1' },
      { SEC_GPC: '1' }
    ]) {
      expect(isPrivacySignalEnabled({ env: privacyEnv, nav: {} })).toBe(true);
      expect(isHandoffTelemetryOptedIn({ telemetry: true, env: { [HANDOFF_TELEMETRY_ENV]: '1', ...privacyEnv }, nav: {} })).toBe(false);
    }

    for (const nav of [{ doNotTrack: '1' }, { doNotTrack: 'yes' }, { globalPrivacyControl: true }]) {
      expect(isPrivacySignalEnabled({ env: {}, nav })).toBe(true);
      expect(isHandoffTelemetryOptedIn({ telemetry: true, env: { [HANDOFF_TELEMETRY_ENV]: '1' }, nav })).toBe(false);
    }
  });

  it('posts only the four allowlisted fields and swallows network failures', async () => {
    const fetcher = jest.fn(async () => new Response(null, { status: 204 }));
    const ok = await sendHandoffTelemetryEvent({
      indexerUrl: 'http://indexer.invalid/',
      apiKey: 'fixture-key',
      fetch: fetcher as any,
      event: { event: 'verified-complete', flow: 'tx-cosmos', durationBucket: 'lt5s', recoveries: 0 }
    });
    expect(ok).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://indexer.invalid/api/v0/telemetry/handoff');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('omit');
    expect(init.referrerPolicy).toBe('no-referrer');
    expect(init.redirect).toBe('error');
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('fixture-key');
    expect(JSON.parse(String(init.body))).toEqual({
      event: 'verified-complete',
      flow: 'tx-cosmos',
      durationBucket: 'lt5s',
      recoveries: 0
    });

    const failingFetch = jest.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(
      sendHandoffTelemetryEvent({
        indexerUrl: 'http://indexer.invalid',
        fetch: failingFetch as any,
        event: { event: 'verified-complete', flow: 'tx-evm', durationBucket: 'lt2m', recoveries: 1 }
      })
    ).resolves.toBe(false);
  });
});
