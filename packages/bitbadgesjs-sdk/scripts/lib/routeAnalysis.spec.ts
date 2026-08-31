import { arePathsEquivalent, normalizePathParams, parseExpressRoutesFromSource, parseOpenAPIRoutesFromDocument } from './routeAnalysis';

describe('parseExpressRoutesFromSource', () => {
  it('flags a route whose websiteOnlyCors middleware is on the same line', () => {
    const source = `app.post('/api/v0/depth', websiteOnlyCors, async (req, res) => {});`;

    expect(parseExpressRoutesFromSource(source)).toEqual([{ method: 'POST', path: '/api/v0/depth', hasWebsiteOnlyCors: true }]);
  });

  it('flags a route whose websiteOnlyCors middleware sits on one of the next two lines', () => {
    const source = ["app.get('/api/v0/codes',", '  authorizeBitBadgesRequest([]),', '  websiteOnlyCors,'].join('\n');

    expect(parseExpressRoutesFromSource(source)).toEqual([{ method: 'GET', path: '/api/v0/codes', hasWebsiteOnlyCors: true }]);
  });

  it('misses a registration whose path is not on the app.<verb>( line — a known limitation of this parser', () => {
    const source = ['app.get(', "  '/api/v0/codes',", '  websiteOnlyCors,'].join('\n');

    expect(parseExpressRoutesFromSource(source)).toEqual([]);
  });

  it('does not flag a route with no websiteOnlyCors nearby', () => {
    const source = `app.get('/api/v0/status', async (req, res) => {});`;

    expect(parseExpressRoutesFromSource(source)).toEqual([{ method: 'GET', path: '/api/v0/status', hasWebsiteOnlyCors: false }]);
  });

  it('ignores lines that are not route registrations', () => {
    expect(parseExpressRoutesFromSource('const app = express();\nconst x = 1;')).toEqual([]);
  });

  it('does not distinguish a commented-out registration — pre-existing behaviour, kept deliberately', () => {
    expect(parseExpressRoutesFromSource('// app.get("/api/v0/nope")')).toEqual([{ method: 'GET', path: '/api/v0/nope', hasWebsiteOnlyCors: false }]);
  });
});

describe('parseOpenAPIRoutesFromDocument', () => {
  it('prefixes spec paths with the api base and converts params to express style', () => {
    expect(normalizePathParams('/collection/{collectionId}/refresh')).toBe('/collection/:collectionId/refresh');

    expect(parseOpenAPIRoutesFromDocument({ paths: { '/collection/{collectionId}': { get: {} } } })).toEqual([
      { method: 'GET', path: '/api/v0/collection/:collectionId', internal: false }
    ]);
  });

  it('marks an operation internal when the operation says so', () => {
    const routes = parseOpenAPIRoutesFromDocument({ paths: { '/a': { get: {}, post: { 'x-internal': true } } } });

    expect(routes).toEqual([
      { method: 'GET', path: '/api/v0/a', internal: false },
      { method: 'POST', path: '/api/v0/a', internal: true }
    ]);
  });

  it('inherits an internal marking from the path item', () => {
    const routes = parseOpenAPIRoutesFromDocument({ paths: { '/a': { 'x-internal': true, get: {} } } });

    expect(routes).toEqual([{ method: 'GET', path: '/api/v0/a', internal: true }]);
  });
});

describe('arePathsEquivalent', () => {
  it('matches express and openapi parameter syntax', () => {
    expect(arePathsEquivalent('/api/v0/collection/:collectionId/refresh', '/api/v0/collection/{collectionId}/refresh')).toBe(true);
  });

  it('does not match different paths', () => {
    expect(arePathsEquivalent('/api/v0/collection/:id/refresh', '/api/v0/collection/:id/refreshStatus')).toBe(false);
  });
});
