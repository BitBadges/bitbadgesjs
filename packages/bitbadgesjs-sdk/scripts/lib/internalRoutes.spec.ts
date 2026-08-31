import { findInternalOperations, stripInternalOperations } from './internalRoutes';

const doc = () => ({
  openapi: '3.0.0',
  tags: [{ name: 'Public' }, { name: 'Ops' }, { name: 'AlreadyOrphaned' }],
  paths: {
    '/public': {
      parameters: [{ name: 'collectionId', in: 'path' }],
      get: { tags: ['Public'], summary: 'public get' },
      post: { tags: ['Ops'], summary: 'internal post', 'x-internal': true }
    },
    '/ops-only': {
      post: { tags: ['Ops'], summary: 'internal', 'x-internal': true }
    },
    '/whole-path-internal': {
      'x-internal': true,
      get: { tags: ['Public'], summary: 'still internal' },
      delete: { tags: ['Public'], summary: 'still internal' }
    },
    '/explicitly-public': {
      get: { tags: ['Public'], summary: 'kept', 'x-internal': false }
    }
  },
  components: { schemas: { Foo: { type: 'object' } } }
});

describe('findInternalOperations', () => {
  it('reports operation-level and path-level internal markings', () => {
    expect(findInternalOperations(doc())).toEqual([
      { method: 'post', path: '/public' },
      { method: 'post', path: '/ops-only' },
      { method: 'get', path: '/whole-path-internal' },
      { method: 'delete', path: '/whole-path-internal' }
    ]);
  });

  it('does not treat x-internal: false as internal', () => {
    expect(findInternalOperations({ paths: { '/a': { get: { 'x-internal': false } } } })).toEqual([]);
  });

  it('does not mistake non-operation path-item keys for operations', () => {
    expect(findInternalOperations({ paths: { '/a': { 'x-internal': true, parameters: [], summary: 'x' } } })).toEqual([]);
  });

  it('tolerates a document with no paths', () => {
    expect(findInternalOperations({})).toEqual([]);
  });
});

describe('stripInternalOperations', () => {
  it('drops the internal operation but keeps its siblings and the path itself', () => {
    const spec = doc();
    stripInternalOperations(spec);

    expect(Object.keys(spec.paths['/public'])).toEqual(['parameters', 'get']);
    expect(spec.paths['/public'].get.summary).toBe('public get');
  });

  it('drops a path once its last remaining operation is internal', () => {
    const spec = doc();
    stripInternalOperations(spec);

    expect(spec.paths['/ops-only']).toBeUndefined();
  });

  it('drops every operation under a path-level x-internal marking', () => {
    const spec = doc();
    stripInternalOperations(spec);

    expect(spec.paths['/whole-path-internal']).toBeUndefined();
  });

  it('keeps operations that are explicitly public', () => {
    const spec = doc();
    stripInternalOperations(spec);

    expect(spec.paths['/explicitly-public'].get.summary).toBe('kept');
  });

  it('leaves the stripped document free of internal operations', () => {
    const spec = doc();
    stripInternalOperations(spec);

    expect(findInternalOperations(spec)).toEqual([]);
  });

  it('reports what it removed', () => {
    const spec = doc();
    const result = stripInternalOperations(spec);

    expect(result.removedOperations).toEqual([
      { method: 'post', path: '/public' },
      { method: 'post', path: '/ops-only' },
      { method: 'get', path: '/whole-path-internal' },
      { method: 'delete', path: '/whole-path-internal' }
    ]);
    expect(result.removedPaths).toEqual(['/ops-only', '/whole-path-internal']);
  });

  it('drops a tag declaration orphaned by the removal', () => {
    const spec = doc();
    const result = stripInternalOperations(spec);

    expect(spec.tags.map((t) => t.name)).not.toContain('Ops');
    expect(result.removedTags).toEqual(['Ops']);
  });

  it('keeps a tag that surviving operations still use', () => {
    const spec = doc();
    stripInternalOperations(spec);

    expect(spec.tags.map((t) => t.name)).toContain('Public');
  });

  it('leaves a tag that was already unused before the strip alone', () => {
    const spec = doc();
    stripInternalOperations(spec);

    expect(spec.tags.map((t) => t.name)).toContain('AlreadyOrphaned');
  });

  it('is a no-op on a document with nothing internal', () => {
    const spec = { tags: [{ name: 'Public' }], paths: { '/a': { get: { tags: ['Public'] } } } };
    const before = JSON.stringify(spec);

    const result = stripInternalOperations(spec);

    expect(JSON.stringify(spec)).toEqual(before);
    expect(result).toEqual({ removedOperations: [], removedPaths: [], removedTags: [] });
  });

  it('does not touch component schemas', () => {
    const spec = doc();
    stripInternalOperations(spec);

    expect(spec.components.schemas.Foo).toEqual({ type: 'object' });
  });
});
