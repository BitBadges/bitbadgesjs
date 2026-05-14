/**
 * Tests for envelope.ts — uniform output envelope helpers.
 *
 * `resolveFormat` and the `--format json|text` switching machinery were
 * removed in #0398: every data-emitting command now always emits JSON.
 * The tests below cover what's left — envelope shape constructors,
 * isQuiet resolution, and writeJsonEnvelope's indent/condensed branches.
 */

import {
  successEnvelope,
  errorEnvelope,
  isQuiet,
  writeJsonEnvelope
} from './envelope.js';
import { Writable } from 'node:stream';

describe('successEnvelope', () => {
  it('wraps data with ok=true and empty warnings/null error', () => {
    const e = successEnvelope({ x: 1 });
    expect(e.ok).toBe(true);
    expect(e.data).toEqual({ x: 1 });
    expect(e.warnings).toEqual([]);
    expect(e.error).toBeNull();
  });

  it('passes warnings through', () => {
    const e = successEnvelope({}, { warnings: [{ code: 'W', message: 'msg' }] });
    expect(e.warnings).toEqual([{ code: 'W', message: 'msg' }]);
  });

  it('attaches hint when provided', () => {
    const e = successEnvelope({}, { hint: 'try foo' });
    expect(e.hint).toBe('try foo');
  });

  it('omits hint key when absent (not undefined-typed)', () => {
    const e = successEnvelope({});
    expect('hint' in e).toBe(false);
  });
});

describe('errorEnvelope', () => {
  it('returns ok=false with structured error', () => {
    const e = errorEnvelope('CODE', 'message');
    expect(e.ok).toBe(false);
    expect(e.data).toBeNull();
    expect(e.error).toEqual({ code: 'CODE', message: 'message' });
  });

  it('attaches details when provided', () => {
    const e = errorEnvelope('X', 'msg', { foo: 'bar' });
    expect(e.error?.details).toEqual({ foo: 'bar' });
  });

  it('omits details when undefined', () => {
    const e = errorEnvelope('X', 'msg', undefined);
    expect('details' in (e.error ?? {})).toBe(false);
  });

  it('attaches hint when provided', () => {
    const e = errorEnvelope('X', 'msg', undefined, 'try this');
    expect(e.hint).toBe('try this');
  });
});

describe('isQuiet', () => {
  const original = process.env.BB_QUIET;
  afterEach(() => {
    if (original === undefined) delete process.env.BB_QUIET;
    else process.env.BB_QUIET = original;
  });

  it('returns true when --quiet flag is set', () => {
    delete process.env.BB_QUIET;
    expect(isQuiet({ quiet: true })).toBe(true);
  });

  it('returns true when BB_QUIET=1', () => {
    delete process.env.BB_QUIET;
    process.env.BB_QUIET = '1';
    expect(isQuiet()).toBe(true);
  });

  it('returns true when BB_QUIET=true', () => {
    delete process.env.BB_QUIET;
    process.env.BB_QUIET = 'true';
    expect(isQuiet()).toBe(true);
  });

  it('returns false when neither flag nor env is set', () => {
    delete process.env.BB_QUIET;
    expect(isQuiet({})).toBe(false);
  });
});

describe('writeJsonEnvelope', () => {
  it('pretty-prints by default (indented)', () => {
    const chunks: string[] = [];
    const sink = new Writable({ write(c, _e, cb) { chunks.push(c.toString()); cb(); } }) as unknown as NodeJS.WriteStream;
    writeJsonEnvelope(successEnvelope({ a: 1 }), {}, sink);
    expect(chunks.join('')).toContain('\n  ');
  });

  it('condensed strips whitespace', () => {
    const chunks: string[] = [];
    const sink = new Writable({ write(c, _e, cb) { chunks.push(c.toString()); cb(); } }) as unknown as NodeJS.WriteStream;
    writeJsonEnvelope(successEnvelope({ a: 1 }), { condensed: true }, sink);
    const text = chunks.join('');
    expect(text).not.toContain('\n  ');
    expect(text).toContain('"a":1');
  });

  it('BigInt values are stringified safely', () => {
    const chunks: string[] = [];
    const sink = new Writable({ write(c, _e, cb) { chunks.push(c.toString()); cb(); } }) as unknown as NodeJS.WriteStream;
    writeJsonEnvelope(successEnvelope({ n: 123n }), { condensed: true }, sink);
    expect(chunks.join('')).toContain('"n":"123"');
  });
});
