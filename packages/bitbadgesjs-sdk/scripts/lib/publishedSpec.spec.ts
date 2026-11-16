import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

import { findInternalOperations, formatOperationRef } from './internalRoutes';

const PACKAGE_ROOT = join(__dirname, '..', '..');
const ROUTES_YAML = join(PACKAGE_ROOT, 'openapitypes-helpers', 'routes.yaml');
const HOSTED_JSON = join(PACKAGE_ROOT, 'openapi-hosted', 'openapi.json');
const HOSTED_YAML = join(PACKAGE_ROOT, 'openapi-hosted', 'openapi.yaml');

const loadYaml = (path: string) => yaml.load(readFileSync(path, 'utf8')) as any;

const publishedArtifacts: [string, () => any][] = [
  ['openapi-hosted/openapi.json', () => JSON.parse(readFileSync(HOSTED_JSON, 'utf8'))],
  ['openapi-hosted/openapi.yaml', () => loadYaml(HOSTED_YAML)]
];

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);
const TEMPLATE = /\{([^}]+)\}/g;
/** BB-298 tracks this leftover `/api/v0` prefix; do not expand the allowlist. */
const API_PREFIX_ALLOWLIST = ['/api/v0/requestBin/attemptData/{claimId}/{claimAttemptId}'];

type PathParam = { name?: string; in?: string };
type PathItem = Record<string, unknown> & { parameters?: PathParam[] };

function pathParamNames(item: PathItem, operation: { parameters?: PathParam[] }): Set<string> {
  const names = new Set<string>();
  for (const param of [...(item.parameters ?? []), ...(operation.parameters ?? [])]) {
    if (param && param.in === 'path' && typeof param.name === 'string') names.add(param.name);
  }
  return names;
}

describe('published OpenAPI artifacts', () => {
  it('routes.yaml still marks at least one operation x-internal (otherwise this suite proves nothing)', () => {
    expect(findInternalOperations(loadYaml(ROUTES_YAML)).length).toBeGreaterThan(0);
  });

  it('routes.yaml path keys are relative to servers[0].url (no /api/ prefix)', () => {
    const prefixed = Object.keys(loadYaml(ROUTES_YAML).paths ?? {}).filter((route) => route.startsWith('/api/'));
    expect(prefixed).toEqual([]);
  });

  describe.each(publishedArtifacts)('%s', (_name, load) => {
    it('carries no operation marked x-internal', () => {
      expect(findInternalOperations(load()).map(formatOperationRef)).toEqual([]);
    });

    it('omits every operation routes.yaml marks internal', () => {
      const published = load();
      const internal = findInternalOperations(loadYaml(ROUTES_YAML));

      const leaked = internal.filter(({ method, path }) => published.paths?.[path]?.[method] !== undefined);

      expect(leaked.map(formatOperationRef)).toEqual([]);
    });

    it('server URL already ends in /api/v0, so no path is prefixed with /api/', () => {
      const published = load();
      expect(published.servers[0].url).toMatch(/\/api\/v0$/);
      const prefixed = Object.keys(published.paths ?? {}).filter((route) => route.startsWith('/api/'));
      expect(prefixed).toEqual(API_PREFIX_ALLOWLIST);
    });

    it('every {param} in a path has a matching in: path parameter', () => {
      const published = load();
      const missing: string[] = [];
      for (const [route, item] of Object.entries(published.paths ?? {}) as [string, PathItem][]) {
        const required = [...route.matchAll(TEMPLATE)].map((m) => m[1]);
        if (required.length === 0) continue;
        for (const [method, operation] of Object.entries(item)) {
          if (!HTTP_METHODS.has(method) || !operation || typeof operation !== 'object') continue;
          const names = pathParamNames(item, operation as { parameters?: PathParam[] });
          for (const name of required) {
            if (!names.has(name)) missing.push(`${method.toUpperCase()} ${route} missing path param ${name}`);
          }
        }
      }
      expect(missing).toEqual([]);
    });

    it('DEX/pool/swap and specific-token balance operations sit on the live relative paths', () => {
      const paths = load().paths;
      expect(paths['/pools']?.get).toMatchObject({ operationId: 'getAllPools' });
      expect(paths['/pools/byDenom']?.get).toMatchObject({ operationId: 'getPoolInfosByDenom' });
      expect(paths['/pools/byAssets']?.get).toMatchObject({ operationId: 'getPoolInfosByAssets' });
      expect(paths['/pools/{poolId}']?.get).toMatchObject({ operationId: 'getPoolInfoById' });
      expect(paths['/swaps/estimate']?.post).toMatchObject({ operationId: 'estimateSwap' });
      expect(paths['/assetPairs']?.get).toMatchObject({ operationId: 'getAssetPairs' });
      expect(paths['/assetPairs/topGainers']?.get).toMatchObject({ operationId: 'getTopGainers' });
      expect(paths['/assetPairs/topLosers']?.get).toMatchObject({ operationId: 'getTopLosers' });
      expect(paths['/assetPairs/highestVolume']?.get).toMatchObject({ operationId: 'getHighestVolume' });
      expect(paths['/assetPairs/priceSorted']?.get).toMatchObject({ operationId: 'getByPrice' });
      expect(paths['/assetPairs/weeklyTopGainers']?.get).toMatchObject({ operationId: 'getWeeklyTopGainers' });
      expect(paths['/assetPairs/weeklyTopLosers']?.get).toMatchObject({ operationId: 'getWeeklyTopLosers' });
      expect(paths['/assetPairs/search']?.get).toMatchObject({ operationId: 'searchAssetPairsByText' });
      expect(paths['/assetPairs/byDenoms']?.post).toMatchObject({ operationId: 'getByDenoms' });
      expect(paths['/collection/{collectionId}/{tokenId}/balance/{address}']?.get).toMatchObject({
        operationId: 'getBalanceByAddressSpecificToken'
      });
      expect(paths['/collection/{collectionId}/balance/{address}/{tokenId}']).toBeUndefined();
      expect(paths['/collection/{collectionId}/amountTracker']?.get).toMatchObject({
        operationId: 'getCollectionAmountTrackerById'
      });
      expect(paths['/collection/{collectionId}/challengeTracker']?.get).toMatchObject({
        operationId: 'getCollectionChallengeTrackerById'
      });
    });
  });
});
