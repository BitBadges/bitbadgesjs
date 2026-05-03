/**
 * `InMemoryEmitter` — buffer-everything tracer for tests and small
 * dashboards. Captures full span lifecycle (start, attrs, events, end)
 * with no external dependencies.
 *
 * Intended uses:
 *   - SDK smoke tests that assert `start`/`end` ordering and parent
 *     inference (see `tracing.spec.ts`).
 *   - Local dev replays where the consumer wants the trace tree
 *     in-process without wiring an external sink.
 *   - Reference implementation for adapter authors.
 *
 * Not intended for production volume — buffer grows unbounded.
 *
 * @category Builder
 */
import type { Span, SpanAttributes, SpanStatus, TraceEmitter, TraceId } from './types.js';

let _idCounter = 0;
function nextId(prefix: string): string {
  _idCounter = (_idCounter + 1) & 0x7fffffff;
  return `${prefix}-${_idCounter.toString(36)}-${Date.now().toString(36)}`;
}

export interface SpanRecord {
  spanId: string;
  traceId: TraceId;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: SpanStatus;
  attributes: SpanAttributes;
  events: Array<{ name: string; time: number; attributes?: SpanAttributes }>;
  error?: { message: string; details?: unknown };
}

class InMemorySpan implements Span {
  readonly spanId: string;
  readonly traceId: TraceId;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly startTime: number;

  private readonly record: SpanRecord;
  private ended = false;
  private readonly onEnd: (rec: SpanRecord) => void;

  constructor(name: string, traceId: TraceId, parentSpanId: string | undefined, attrs: SpanAttributes | undefined, onEnd: (rec: SpanRecord) => void) {
    this.spanId = nextId('span');
    this.traceId = traceId;
    this.parentSpanId = parentSpanId;
    this.name = name;
    this.startTime = Date.now();
    this.onEnd = onEnd;
    this.record = {
      spanId: this.spanId,
      traceId: this.traceId,
      parentSpanId: this.parentSpanId,
      name,
      startTime: this.startTime,
      status: 'unset',
      attributes: { ...(attrs || {}) },
      events: []
    };
    // Strip the bookkeeping `traceId` attr from user-visible attributes.
    if ((this.record.attributes as any).traceId !== undefined) {
      delete (this.record.attributes as any).traceId;
    }
  }

  setAttributes(attrs: SpanAttributes): void {
    if (this.ended) return;
    Object.assign(this.record.attributes, attrs);
  }

  addEvent(name: string, attrs?: SpanAttributes): void {
    if (this.ended) return;
    this.record.events.push({ name, time: Date.now(), attributes: attrs ? { ...attrs } : undefined });
  }

  recordError(error: Error | string, attrs?: SpanAttributes): void {
    if (this.ended) return;
    this.record.status = 'error';
    const message = typeof error === 'string' ? error : error.message;
    this.record.error = { message, ...(attrs ? { details: attrs } : {}) };
    if (attrs) Object.assign(this.record.attributes, attrs);
  }

  end(attrs?: SpanAttributes): void {
    if (this.ended) return;
    this.ended = true;
    if (attrs) Object.assign(this.record.attributes, attrs);
    const endTime = Date.now();
    this.record.endTime = endTime;
    this.record.durationMs = endTime - this.record.startTime;
    if (this.record.status === 'unset') this.record.status = this.record.error ? 'error' : 'ok';
    this.onEnd(this.record);
  }
}

export class InMemoryEmitter implements TraceEmitter {
  private readonly _spans: SpanRecord[] = [];
  private readonly stack: InMemorySpan[] = [];
  private rootTraceId: TraceId | undefined;

  /** Read-only snapshot of all completed spans, in completion order. */
  get spans(): readonly SpanRecord[] {
    return this._spans;
  }

  /** Reset the buffer (and stack) — useful between test cases. */
  clear(): void {
    this._spans.length = 0;
    this.stack.length = 0;
    this.rootTraceId = undefined;
  }

  startSpan(name: string, attrs?: SpanAttributes & { traceId?: TraceId }): Span {
    const explicit = attrs && typeof (attrs as any).traceId === 'string' ? (attrs as any).traceId : undefined;
    const traceId = explicit || this.rootTraceId || nextId('trace');
    if (!this.rootTraceId) this.rootTraceId = traceId;
    const parent = this.stack[this.stack.length - 1];
    const span = new InMemorySpan(name, traceId, parent?.spanId, attrs, (rec) => {
      // Pop ourselves off the stack on end. Use lastIndexOf so an
      // unmatched end (consumer bug) doesn't corrupt parent inference
      // for sibling spans.
      const idx = this.stack.lastIndexOf(span);
      if (idx >= 0) this.stack.splice(idx, 1);
      this._spans.push(rec);
    });
    this.stack.push(span);
    return span;
  }
}
