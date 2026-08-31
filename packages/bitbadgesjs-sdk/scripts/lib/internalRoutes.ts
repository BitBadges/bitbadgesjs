import { HTTP_METHODS } from './routeAnalysis';

export interface OperationRef {
  method: string;
  path: string;
}

export interface StripResult {
  removedOperations: OperationRef[];
  removedPaths: string[];
  removedTags: string[];
}

function isPathItem(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function operationEntries(pathItem: Record<string, any>): [string, any][] {
  return HTTP_METHODS.filter((m) => isPathItem(pathItem[m])).map((m) => [m, pathItem[m]] as [string, any]);
}

function collectUsedTags(doc: any): Set<string> {
  const used = new Set<string>();
  for (const pathItem of Object.values<any>(doc?.paths ?? {})) {
    if (!isPathItem(pathItem)) continue;
    for (const [, operation] of operationEntries(pathItem)) {
      for (const tag of operation.tags ?? []) used.add(tag);
    }
  }
  return used;
}

/**
 * Every operation the document exposes that is marked internal, either on the
 * operation itself or on its parent path item.
 */
export function findInternalOperations(doc: any): OperationRef[] {
  const found: OperationRef[] = [];

  for (const [path, pathItem] of Object.entries<any>(doc?.paths ?? {})) {
    if (!isPathItem(pathItem)) continue;
    const pathIsInternal = pathItem['x-internal'] === true;

    for (const [method, operation] of operationEntries(pathItem)) {
      if (pathIsInternal || operation['x-internal'] === true) {
        found.push({ method, path });
      }
    }
  }

  return found;
}

/**
 * Remove every internal operation from an assembled OpenAPI document, in
 * place. Paths left with no operations are dropped, and tag declarations
 * orphaned *by this removal* are dropped with them (a tag that was already
 * unused before the strip is left alone — that is a separate defect, not
 * ours to silently rewrite).
 */
export function stripInternalOperations(doc: any): StripResult {
  const result: StripResult = { removedOperations: [], removedPaths: [], removedTags: [] };
  if (!doc?.paths || typeof doc.paths !== 'object') return result;

  const tagsUsedBefore = collectUsedTags(doc);

  for (const [path, pathItem] of Object.entries<any>(doc.paths)) {
    if (!isPathItem(pathItem)) continue;
    const pathIsInternal = pathItem['x-internal'] === true;

    for (const [method, operation] of operationEntries(pathItem)) {
      if (pathIsInternal || operation['x-internal'] === true) {
        result.removedOperations.push({ method, path });
        delete pathItem[method];
      }
    }

    if (pathIsInternal || operationEntries(pathItem).length === 0) {
      result.removedPaths.push(path);
      delete doc.paths[path];
    }
  }

  if (result.removedOperations.length === 0 && result.removedPaths.length === 0) {
    return result;
  }

  const tagsUsedAfter = collectUsedTags(doc);
  if (Array.isArray(doc.tags)) {
    const orphaned = new Set([...tagsUsedBefore].filter((tag) => !tagsUsedAfter.has(tag)));
    if (orphaned.size > 0) {
      doc.tags = doc.tags.filter((tag: any) => {
        if (tag && typeof tag === 'object' && orphaned.has(tag.name)) {
          result.removedTags.push(tag.name);
          return false;
        }
        return true;
      });
    }
  }

  return result;
}

export function formatOperationRef({ method, path }: OperationRef): string {
  return `${method.toUpperCase()} ${path}`;
}
