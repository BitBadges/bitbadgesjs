/**
 * TraceEmitter — generic span/trace abstraction for `BitBadgesBuilderAgent`.
 *
 * Modeled loosely on OpenTelemetry semantics but kept dependency-free so
 * it works in browsers, Node, Bun, Deno, and Cloudflare Workers without
 * pulling in the OTel SDK. Concrete implementations bridge spans into
 * whatever observability surface the consumer prefers:
 *
 *   - `NoopEmitter` (default) — zero overhead; agent behaves as if no
 *     tracer was passed.
 *   - `InMemoryEmitter` (for tests + reference) — buffers spans in
 *     memory; useful for assertions and small dashboards.
 *   - Indexer's `SessionLogEmitter` (separate repo) — bridges spans
 *     into the existing Mongo `SessionLogEntry[]` shape, preserving
 *     the in-house `/insights/ai-builder` dashboard with no schema
 *     migration.
 *   - Future vendor adapters (LangFuse, OTEL, Braintrust) — ship as
 *     separate packages, never inside SDK core. Putting them here
 *     re-creates the lock-in this abstraction exists to prevent.
 *
 * Two structural commitments callers can rely on:
 *   1. **Per-span start timestamps.** `Span.startTime` is captured at
 *      `tracer.startSpan(...)` call time. Sequential math
 *      (`endTime - durationMs`) breaks the moment phases overlap;
 *      capturing wall-clock start is free since the agent already
 *      calls `Date.now()` when each phase begins.
 *   2. **Parent-span IDs from a stack.** The agent maintains a span
 *      stack (push on start, pop on end) and emits `parentSpanId`
 *      automatically. Manual annotations on every emit site is a
 *      maintenance trap — auto-inference keeps the contract honest.
 *
 * @category Builder
 */

/** Stable identifier for a single trace (one build = one trace). */
export type TraceId = string;

/** Stable identifier for a single span within a trace. */
export type SpanId = string;

/** Status of a finished span. */
export type SpanStatus = 'ok' | 'error' | 'unset';

/**
 * Attribute bag attached to a span. Keys are dot-namespaced when
 * appropriate (`llm.tokens.input`, `tool.name`, etc) but emitters
 * shouldn't assume any particular schema beyond JSON-serializable values.
 */
export type SpanAttributes = Record<string, string | number | boolean | null | undefined | unknown>;

/**
 * One unit of work inside a trace. Returned by `tracer.startSpan(...)`.
 *
 * Implementations must:
 *   - Capture `startTime` at construction.
 *   - Maintain `parentSpanId` from the tracer's stack at construction
 *     time (NOT at end time — parent must reflect who started it).
 *   - Allow `addEvent` and `setAttributes` calls between start and end.
 *   - Be idempotent on `end()` — double-end is a no-op.
 */
export interface Span {
  /** Span identifier, unique within the trace. */
  readonly spanId: SpanId;
  /** Trace identifier (sessionId for builds). */
  readonly traceId: TraceId;
  /** ID of the parent span; undefined for root spans. */
  readonly parentSpanId?: SpanId;
  /** Human-readable span name (`build.assemble_prompt`, `llm.round`, etc). */
  readonly name: string;
  /** Wall-clock start time, captured at `startSpan(...)` call time. */
  readonly startTime: number;

  /** Attach or merge structured attributes. Multiple calls are additive. */
  setAttributes(attrs: SpanAttributes): void;

  /**
   * Attach a point-in-time event inside the span (e.g. cache-hit, retry).
   * Events are timestamped at call time.
   */
  addEvent(name: string, attrs?: SpanAttributes): void;

  /**
   * Mark the span as failed with an error message + optional structured
   * details. Equivalent to `setAttributes({error: true, ...})` plus a
   * status flip; emitters surface this distinctly (e.g. red in UIs).
   */
  recordError(error: Error | string, attrs?: SpanAttributes): void;

  /**
   * Finalize the span with optional final attributes. After `end()`,
   * the span is immutable; subsequent `setAttributes` / `addEvent`
   * calls are silently ignored. Idempotent.
   *
   * `endTime` defaults to `Date.now()` at call time.
   */
  end(attrs?: SpanAttributes): void;
}

/**
 * The TraceEmitter interface itself. The agent calls `startSpan` at
 * the top of each phase and gets back a Span it ends in a finally
 * block.
 *
 * Tracers maintain their own internal span stack (so consumers don't
 * need to thread parents manually through every call site).
 */
export interface TraceEmitter {
  /**
   * Start a new span. The new span's `parentSpanId` is the most
   * recently-started-still-open span's id (LIFO), or undefined for the
   * very first span in a trace.
   *
   * Pass an explicit `traceId` on the root span to associate the trace
   * with a build session id; subsequent spans inherit the same trace
   * automatically.
   */
  startSpan(name: string, attrs?: SpanAttributes & { traceId?: TraceId }): Span;

  /**
   * Optional flush hook for batching emitters (HTTP exporters, etc).
   * NoopEmitter and synchronous emitters can leave this unimplemented.
   * Callers should `await tracer.flush?.()` once at end-of-build.
   */
  flush?(): Promise<void>;
}
