import fs from 'fs';
import yaml from 'js-yaml';

export interface ExpressRoute {
  method: string;
  path: string;
  hasWebsiteOnlyCors: boolean;
}

export interface OpenAPIRoute {
  method: string;
  path: string;
  internal: boolean;
}

/** HTTP verbs the OpenAPI path-item object may carry as operations. */
export const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const;

/** The subset historically compared against the indexer's Express routes. */
export const COMPARED_METHODS = ['get', 'post', 'put', 'delete'] as const;

export function normalizePathParams(path: string): string {
  // Convert OpenAPI {param} to Express :param
  return path.replace(/\{([^}]+)\}/g, ':$1');
}

export function normalizePathForComparison(path: string): string {
  // Replace both Express :param and OpenAPI {param} with a generic placeholder
  return path.replace(/:[a-zA-Z]+|{[a-zA-Z]+}/g, ':PARAM');
}

export function arePathsEquivalent(path1: string, path2: string): boolean {
  return normalizePathForComparison(path1) === normalizePathForComparison(path2);
}

export function parseExpressRoutesFromSource(content: string): ExpressRoute[] {
  const lines = content.split('\n');
  const routes: ExpressRoute[] = [];
  const routeRegex = /app\.(get|post|put|delete)\(['"]([^'"]+)['"]/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(routeRegex);

    if (match) {
      const [_, method, path] = match;
      let hasWebsiteOnlyCors = false;
      let j = i;
      const searchLimit = Math.min(i + 3, lines.length);

      while (j < searchLimit) {
        if (lines[j].includes('websiteOnlyCors')) {
          hasWebsiteOnlyCors = true;
          break;
        }
        j++;
      }

      routes.push({
        method: method.toUpperCase(),
        path,
        hasWebsiteOnlyCors
      });
    }
  }

  return routes;
}

export function parseExpressRoutes(filePath: string): ExpressRoute[] {
  return parseExpressRoutesFromSource(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Flatten an OpenAPI document's path items into indexer-comparable routes.
 * `internal` is true when either the operation or its parent path item is
 * marked `x-internal: true`.
 */
export function parseOpenAPIRoutesFromDocument(spec: any): OpenAPIRoute[] {
  const routes: OpenAPIRoute[] = [];

  for (const [path, pathObj] of Object.entries(spec?.paths ?? {})) {
    const methodsObj = pathObj as Record<string, any>;
    if (!methodsObj || typeof methodsObj !== 'object') continue;
    const pathIsInternal = methodsObj['x-internal'] === true;

    for (const method of COMPARED_METHODS) {
      if (methodsObj[method]) {
        routes.push({
          method: method.toUpperCase(),
          path: normalizePathParams(`/api/v0${path}`),
          internal: pathIsInternal || methodsObj[method]['x-internal'] === true
        });
      }
    }
  }

  return routes;
}

export function parseOpenAPIRoutes(filePath: string): OpenAPIRoute[] {
  const spec = yaml.load(fs.readFileSync(filePath, 'utf8')) as any;
  return parseOpenAPIRoutesFromDocument(spec);
}
