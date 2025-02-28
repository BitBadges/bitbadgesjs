import fs from 'fs';
import yaml from 'js-yaml';
import { BitBadgesApiRoutes } from '../src/api-indexer/requests/routes';

interface Route {
  method: string;
  path: string;
  hasWebsiteOnlyCors: boolean;
}

interface OpenAPIRoute {
  method: string;
  path: string;
  internal: boolean;
}

function normalizePathParams(path: string): string {
  // Convert OpenAPI {param} to Express :param
  return path.replace(/\{([^}]+)\}/g, ':$1');
}

function parseExpressRoutes(filePath: string): Route[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const routes: Route[] = [];
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

function parseOpenAPIRoutes(filePath: string): OpenAPIRoute[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const spec = yaml.load(content) as any;
  const routes: OpenAPIRoute[] = [];

  for (const [path, pathObj] of Object.entries(spec.paths)) {
    // Handle all HTTP methods for this path
    const methodsObj = pathObj as Record<string, any>;
    for (const method of ['get', 'post', 'put', 'delete']) {
      if (methodsObj[method]) {
        routes.push({
          method: method.toUpperCase(),
          path: normalizePathParams(`/api/v0${path}`),
          internal: methodsObj[method]['x-internal'] === true
        });
      }
    }
  }

  return routes;
}

function normalizePathForComparison(path: string): string {
  // Replace both Express :param and OpenAPI {param} with a generic placeholder
  return path.replace(/:[a-zA-Z]+|{[a-zA-Z]+}/g, ':PARAM');
}

function arePathsEquivalent(path1: string, path2: string): boolean {
  return normalizePathForComparison(path1) === normalizePathForComparison(path2);
}

// Main execution
const indexerPath = process.argv[2] || './indexer.ts';
const yamlPath = process.argv[3] || '../openapitypes-helpers/routes.yaml';

const expressRoutes = parseExpressRoutes(indexerPath);
const openAPIRoutes = parseOpenAPIRoutes(yamlPath);

// Compare routes
console.log('\nRoute Comparison:');
console.log('================');

// Check Express routes against OpenAPI
console.log('\nExpress routes not in OpenAPI spec:');
expressRoutes.forEach((expressRoute) => {
  if (expressRoute.path.startsWith('/api/v0')) {
    const matchingOpenAPIRoute = openAPIRoutes.find((r) => arePathsEquivalent(r.path, expressRoute.path) && r.method === expressRoute.method);

    if (!matchingOpenAPIRoute) {
      console.log(`${expressRoute.method} ${expressRoute.path}`);
      console.log(`Website Only: ${expressRoute.hasWebsiteOnlyCors ? '✓' : '✗'}`);
    }
  }
});

// Check OpenAPI routes against Express
console.log('\nOpenAPI routes not in Express:');
openAPIRoutes.forEach((openAPIRoute) => {
  const matchingExpressRoute = expressRoutes.find((r) => arePathsEquivalent(r.path, openAPIRoute.path) && r.method === openAPIRoute.method);

  if (!matchingExpressRoute) {
    console.log(`${openAPIRoute.method} ${openAPIRoute.path}`);
    console.log(`Internal: ${openAPIRoute.internal ? '✓' : '✗'}`);
  }
});

// Method mismatches
console.log('\nMethod mismatches:');
expressRoutes.forEach((expressRoute) => {
  if (expressRoute.path.startsWith('/api/v0')) {
    const matchingOpenAPIRoute = openAPIRoutes.find((r) => arePathsEquivalent(r.path, expressRoute.path) && r.method === expressRoute.method);
    if (matchingOpenAPIRoute && matchingOpenAPIRoute.method !== expressRoute.method) {
      console.log(`${expressRoute.path}:`);
      console.log(`  Express: ${expressRoute.method}`);
      console.log(`  OpenAPI: ${matchingOpenAPIRoute.method}`);
      console.log(`  OpenAPI path: ${matchingOpenAPIRoute.path}`);
    }
  }
});

// Statistics
console.log('\nStatistics:');
console.log('===========');
console.log(`Express Routes: ${expressRoutes.length}`);
console.log(`OpenAPI Routes: ${openAPIRoutes.length}`);
console.log(`Express API Routes: ${expressRoutes.filter((r) => r.path.startsWith('/api/v0')).length}`);
console.log(`Website Only Routes: ${expressRoutes.filter((r) => r.hasWebsiteOnlyCors).length}`);

// Optional: Add a helper function to group routes by path for better visualization
function printRouteComparison(expressRoutes: Route[], openAPIRoutes: OpenAPIRoute[]) {
  const routesByPath = new Map<string, { express: Route[]; openAPI: OpenAPIRoute[] }>();

  // Group Express routes
  expressRoutes.forEach((route) => {
    const normalizedPath = normalizePathForComparison(route.path);
    if (!routesByPath.has(normalizedPath)) {
      routesByPath.set(normalizedPath, { express: [], openAPI: [] });
    }
    routesByPath.get(normalizedPath)!.express.push(route);
  });

  // Group OpenAPI routes
  openAPIRoutes.forEach((route) => {
    const normalizedPath = normalizePathForComparison(route.path);
    if (!routesByPath.has(normalizedPath)) {
      routesByPath.set(normalizedPath, { express: [], openAPI: [] });
    }
    routesByPath.get(normalizedPath)!.openAPI.push(route);
  });

  // Print comparison
  console.log('\nDetailed Route Comparison:');
  console.log('========================');

  const socials = ['github', 'twitter', 'twitch', 'reddit'];
  const okayToIgnore = [
    ...socials.map((social) => `/api/v0/${social}/user`),
    '/api/v0/telegram/check-bot-in-channel',
    '/api/v0/discord/servers/:PARAM/roles',
    '/api/v0/discord/servers',
    '/api/v0/report',
    '/api/v0/admin',
    '/api/v0/test',
    '/test',
    '/testplugin',
    '/numUsers',
    '/api/v0/metadata',
    '/api/v0/ethFirstTx',
    '/api/v0/plugins/numActiveUsers',
    '/claims-browse',

    //These I can probably add
    '/api/v0/claims/:PARAM/attempts',
    '/api/v0/plugins/errors',
    '/api/v0/claims/:PARAM/postActions/:PARAM'
  ];

  let hasMissingRoutes = false;
  for (const [path, routes] of routesByPath) {
    if (okayToIgnore.some((ignore) => path.includes(ignore))) {
      continue;
    }

    if (path === '/') {
      continue;
    }

    if (path.includes('/callback') || path.includes('/webhook') || path.includes('/auth')) {
      continue;
    }

    //Ignore website only routes
    if (routes.express.some((r) => r.hasWebsiteOnlyCors)) {
      continue;
    }

    // if (routes.express.length > 0) {
    //   console.log('Express methods:', routes.express.map((r) => r.method).join(', '));
    // }

    // if (routes.openAPI.length > 0) {
    //   console.log('OpenAPI methods:', routes.openAPI.map((r) => r.method).join(', '));
    // }

    // Check for mismatches
    const expressMethods = new Set(routes.express.map((r) => r.method));
    const openAPIMethods = new Set(routes.openAPI.map((r) => r.method));

    const missingInOpenAPI = [...expressMethods].filter((m) => !openAPIMethods.has(m));
    const missingInExpress = [...openAPIMethods].filter((m) => !expressMethods.has(m));

    if (missingInOpenAPI.length > 0 || missingInExpress.length > 0) {
      console.log(`\nPath: ${path}`);
      hasMissingRoutes = true;
    }

    if (missingInOpenAPI.length > 0) {
      console.log('Methods missing in OpenAPI:', missingInOpenAPI.join(', '));
    }
    if (missingInExpress.length > 0) {
      console.log('Methods missing in Express:', missingInExpress.join(', '));
    }
  }

  // Check routes against BitBadgesApiRoutes class
  console.log('\nChecking routes against BitBadgesApiRoutes class:');
  console.log('============================================');

  const classRoutes = getRoutesFromClass();
  const normalizedOpenAPIRoutes = openAPIRoutes.map((r) => normalizePathForComparison(r.path));

  const missingInClass = normalizedOpenAPIRoutes.filter((openAPIRoute) => !classRoutes.some((classRoute) => classRoute.includes(openAPIRoute)));

  if (missingInClass.length > 0) {
    console.log('\nRoutes in OpenAPI but missing in BitBadgesApiRoutes class:');
    missingInClass.forEach((route) => {
      console.log(`- ${route}`);
    });
    hasMissingRoutes = true;
  }

  if (hasMissingRoutes) {
    console.log('\n\nThere are missing routes. Please add them to the OpenAPI spec or BitBadgesApiRoutes class.');
    process.exit(1);
  }
}

// Use the new comparison function
printRouteComparison(expressRoutes, openAPIRoutes);

function getRoutesFromClass(): string[] {
  const routes: string[] = [];
  const routesClass = BitBadgesApiRoutes;

  // Get all static methods
  const methods = Object.getOwnPropertyNames(routesClass)
    .filter((name) => name.endsWith('Route'))
    .filter((name) => typeof routesClass[name as keyof typeof routesClass] === 'function');

  // Call each method and collect the routes
  for (const method of methods) {
    try {
      // Handle methods with required parameters by providing dummy values
      const route = (routesClass[method as keyof typeof routesClass] as Function)?.(':PARAM', ':PARAM');
      if (route && typeof route === 'string') {
        routes.push(normalizePathForComparison(route));
      }
    } catch (e) {
      // If the method requires parameters, try with some dummy values
      try {
        const route = (routesClass[method as keyof typeof routesClass] as Function)?.(':PARAM', ':PARAM');
        if (route && typeof route === 'string') {
          routes.push(normalizePathForComparison(route));
        }
      } catch (e) {
        console.warn(`Warning: Couldn't get route for ${method}`);
      }
    }
  }

  return routes;
}
