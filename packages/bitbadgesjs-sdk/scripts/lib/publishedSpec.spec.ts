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

describe('published OpenAPI artifacts', () => {
  it('routes.yaml still marks at least one operation x-internal (otherwise this suite proves nothing)', () => {
    expect(findInternalOperations(loadYaml(ROUTES_YAML)).length).toBeGreaterThan(0);
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
  });
});
