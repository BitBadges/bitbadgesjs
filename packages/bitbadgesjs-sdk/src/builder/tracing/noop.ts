/**
 * `NoopEmitter` — zero-overhead default tracer.
 *
 * Agent constructs one of these when no `tracer` option is passed.
 * Spans returned by `startSpan` capture identifiers correctly so any
 * code that reads `span.spanId` / `span.traceId` keeps working, but
 * `setAttributes`/`addEvent`/`recordError`/`end` are all no-ops.
 *
 * @category Builder
 */
import type { Span, SpanAttributes, TraceEmitter, TraceId } from './types.js';

let _spanCounter = 0;
function nextSpanId(): string {
  _spanCounter = (_spanCounter + 1) & 0x7fffffff;
  return `noop-${_spanCounter.toString(36)}`;
}

class NoopSpan implements Span {
  readonly spanId: string;
  readonly traceId: TraceId;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly startTime: number;

  constructor(name: string, traceId: TraceId, parentSpanId?: string) {
    this.spanId = nextSpanId();
    this.traceId = traceId;
    this.parentSpanId = parentSpanId;
    this.name = name;
    this.startTime = Date.now();
  }

  setAttributes(_attrs: SpanAttributes): void {
    /* noop */
  }
  addEvent(_name: string, _attrs?: SpanAttributes): void {
    /* noop */
  }
  recordError(_error: Error | string, _attrs?: SpanAttributes): void {
    /* noop */
  }
  end(_attrs?: SpanAttributes): void {
    /* noop */
  }
}

export class NoopEmitter implements TraceEmitter {
  private readonly stack: NoopSpan[] = [];
  private rootTraceId: TraceId | undefined;

  startSpan(name: string, attrs?: SpanAttributes & { traceId?: TraceId }): Span {
    const explicitTraceId = attrs && typeof (attrs as any).traceId === 'string' ? (attrs as any).traceId : undefined;
    const traceId = explicitTraceId || this.rootTraceId || `noop-trace-${nextSpanId()}`;
    if (!this.rootTraceId) this.rootTraceId = traceId;
    const parent = this.stack[this.stack.length - 1];
    const span = new NoopSpan(name, traceId, parent?.spanId);
    this.stack.push(span);
    // Make end() pop from the stack so parent inference works for nested
    // spans even on the noop emitter (consumers might rely on the side
    // effect to manage their own state).
    const originalEnd = span.end.bind(span);
    (span as any).end = (a?: SpanAttributes) => {
      const idx = this.stack.lastIndexOf(span);
      if (idx >= 0) this.stack.splice(idx, 1);
      originalEnd(a);
    };
    return span;
  }
}
