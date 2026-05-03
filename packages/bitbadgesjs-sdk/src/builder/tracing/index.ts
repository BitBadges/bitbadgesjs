/**
 * `BitBadgesBuilderAgent` observability primitives. Vendor-agnostic by
 * design — concrete adapters (LangFuse, OTEL, indexer's Mongo bridge)
 * live outside SDK core.
 *
 * @category Builder
 */
export type { Span, SpanAttributes, SpanId, SpanStatus, TraceEmitter, TraceId } from './types.js';
export { NoopEmitter } from './noop.js';
export { InMemoryEmitter, type SpanRecord } from './inMemory.js';
