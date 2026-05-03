/**
 * Tests for the TraceEmitter abstraction. Verifies the two structural
 * commitments the agent relies on:
 *
 *   1. Per-span start timestamps captured at `startSpan(...)` time
 *      (not derived from end + duration).
 *   2. Parent-span IDs auto-inferred from the emitter's LIFO stack
 *      (consumers don't manually thread parents through every call).
 *
 * Plus the basic Span lifecycle (attrs, events, errors, idempotent end).
 */
import { InMemoryEmitter } from './inMemory.js';
import { NoopEmitter } from './noop.js';

describe('NoopEmitter', () => {
  test('returns spans with stable identifiers but performs no I/O', () => {
    const tracer = new NoopEmitter();
    const root = tracer.startSpan('root');
    expect(root.spanId).toMatch(/^noop-/);
    expect(root.traceId).toMatch(/^noop-trace-/);
    expect(root.parentSpanId).toBeUndefined();
    // No-ops shouldn't throw.
    root.setAttributes({ k: 'v' });
    root.addEvent('event-1');
    root.recordError(new Error('boom'));
    root.end({ done: true });
    // Idempotent end.
    root.end();
  });

  test('child span inherits parentSpanId via stack inference', () => {
    const tracer = new NoopEmitter();
    const root = tracer.startSpan('root');
    const child = tracer.startSpan('child');
    expect(child.parentSpanId).toBe(root.spanId);
    expect(child.traceId).toBe(root.traceId);
    child.end();
    const sibling = tracer.startSpan('sibling');
    expect(sibling.parentSpanId).toBe(root.spanId);
    sibling.end();
    root.end();
  });
});

describe('InMemoryEmitter', () => {
  test('captures startTime, endTime, and durationMs from real wall clock', async () => {
    const tracer = new InMemoryEmitter();
    const span = tracer.startSpan('phase', { traceId: 'trace-1' });
    const startedAt = span.startTime;
    expect(startedAt).toBeGreaterThan(0);
    // Sleep to ensure end > start. Allow a small floor below the
    // sleep duration to absorb timer-resolution jitter on Linux+Bun
    // where setTimeout(15) sometimes resolves at 14.9ms.
    await new Promise((r) => setTimeout(r, 15));
    span.end();
    const records = tracer.spans;
    expect(records).toHaveLength(1);
    expect(records[0].startTime).toBe(startedAt);
    expect(records[0].endTime).toBeGreaterThan(startedAt);
    expect(records[0].durationMs).toBeGreaterThanOrEqual(5);
  });

  test('rootTraceId binds every subsequent span to the same trace', () => {
    const tracer = new InMemoryEmitter();
    const root = tracer.startSpan('root', { traceId: 'session-abc' });
    const child = tracer.startSpan('child');
    child.end();
    const after = tracer.startSpan('after-root-end');
    after.end();
    root.end();
    for (const r of tracer.spans) {
      expect(r.traceId).toBe('session-abc');
    }
  });

  test('parent inference: nested spans get correct parentSpanId, siblings share parent', () => {
    const tracer = new InMemoryEmitter();
    const root = tracer.startSpan('root');
    const a = tracer.startSpan('a');
    a.end();
    const b = tracer.startSpan('b');
    const bChild = tracer.startSpan('b.child');
    bChild.end();
    b.end();
    root.end();

    const byName = (n: string) => tracer.spans.find((s) => s.name === n)!;
    expect(byName('root').parentSpanId).toBeUndefined();
    expect(byName('a').parentSpanId).toBe(byName('root').spanId);
    expect(byName('b').parentSpanId).toBe(byName('root').spanId);
    expect(byName('b.child').parentSpanId).toBe(byName('b').spanId);
  });

  test('attributes accumulate; end() takes a final attribute snapshot', () => {
    const tracer = new InMemoryEmitter();
    const span = tracer.startSpan('t', { initial: 1 } as any);
    span.setAttributes({ k1: 'v1' });
    span.setAttributes({ k2: 2 });
    span.end({ final: true });
    const r = tracer.spans[0];
    expect(r.attributes.initial).toBe(1);
    expect(r.attributes.k1).toBe('v1');
    expect(r.attributes.k2).toBe(2);
    expect(r.attributes.final).toBe(true);
    // Bookkeeping `traceId` doesn't leak into user-visible attributes.
    expect(r.attributes.traceId).toBeUndefined();
  });

  test('events captured with timestamps', () => {
    const tracer = new InMemoryEmitter();
    const span = tracer.startSpan('t');
    span.addEvent('cache_hit', { source: 'prompt' });
    span.addEvent('retry');
    span.end();
    const events = tracer.spans[0].events;
    expect(events).toHaveLength(2);
    expect(events[0].name).toBe('cache_hit');
    expect(events[0].attributes).toEqual({ source: 'prompt' });
    expect(events[0].time).toBeGreaterThan(0);
  });

  test('recordError flips status to error and stores message', () => {
    const tracer = new InMemoryEmitter();
    const span = tracer.startSpan('t');
    span.recordError(new Error('boom'), { hint: 'retry' });
    span.end();
    const r = tracer.spans[0];
    expect(r.status).toBe('error');
    expect(r.error?.message).toBe('boom');
  });

  test('end() is idempotent — second call does not duplicate the record', () => {
    const tracer = new InMemoryEmitter();
    const span = tracer.startSpan('t');
    span.end();
    span.end();
    span.setAttributes({ ignored: true });
    expect(tracer.spans).toHaveLength(1);
    expect((tracer.spans[0].attributes as any).ignored).toBeUndefined();
  });

  test('clear() resets buffer and stack between cases', () => {
    const tracer = new InMemoryEmitter();
    const a = tracer.startSpan('a');
    a.end();
    expect(tracer.spans).toHaveLength(1);
    tracer.clear();
    expect(tracer.spans).toHaveLength(0);
    const b = tracer.startSpan('b');
    expect(b.parentSpanId).toBeUndefined();
    b.end();
  });
});
