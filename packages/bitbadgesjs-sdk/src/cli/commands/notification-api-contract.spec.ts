import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import path from 'node:path';
import YAML from 'yaml';
import { parseRoutes } from './api-routes-generator.js';
import { ROUTES } from './api-routes.js';
import { createApiCommand } from './api.js';
const root = path.resolve(__dirname, '../../..');
const canonical = YAML.parse(readFileSync(path.join(root, 'openapitypes-helpers/routes.yaml'), 'utf8'));
const hosted = JSON.parse(readFileSync(path.join(root, 'openapi-hosted/openapi.json'), 'utf8'));
const operations = [
  ['/notifications', 'get', 'getNotifications'],
  ['/notifications/unreadCount', 'get', 'getUnreadNotificationCount'],
  ['/notifications/read', 'post', 'markNotificationsRead'],
  ['/notifications/preferences', 'post', 'updateNotificationPreferences']
];
it.each(operations)('publishes authenticated self-only operation %s', (url, method, id) => {
  const op = canonical.paths[url]?.[method];
  expect(op).toBeDefined();
  expect(op.security).toEqual([{ apiKey: [], userSignedIn: [] }]);
  expect(op.description).toMatch(/Full Access/);
  expect(op.description).toMatch(/authenticated/);
  expect(hosted.paths[url][method]).toEqual(op);
  const route = parseRoutes(readFileSync(path.join(root, 'openapitypes-helpers/routes.yaml'), 'utf8')).find((r) => r.path === url);
  expect(route?.sdkLinks?.function).toBe(`BitBadgesAdminAPI.${id}`);
  expect(ROUTES.find((r) => r.path === url)?.hasBody).toBe(method === 'post');
});
it('documents real query and body limits, without a selectable recipient', () => {
  const params = canonical.paths['/notifications'].get.parameters;
  expect(params.find((p: any) => p.name === 'types')).toMatchObject({
    style: 'form',
    explode: true,
    schema: { type: 'array', items: { enum: ['transfer', 'bank_send', 'claim', 'list', 'system', 'intent_satisfied'] } }
  });
  expect(params.find((p: any) => p.name === 'bookmark').schema.maxLength).toBe(2048);
  expect(params.some((p: any) => p.name === 'address' || p.name === 'bitbadgesAddress')).toBe(false);
  expect(canonical.components.schemas.iMarkNotificationsReadPayload.properties.notificationIds).toMatchObject({
    maxItems: 100,
    items: { maxLength: 1024 }
  });
  expect(canonical.components.schemas.iUpdateNotificationPreferencesPayload.properties.preferences.additionalProperties).toBe(false);
});
it.each([false, true])('serializes repeated query keys through actual CLI (body override: %s)', async (bodyOverride) => {
  const output: string[] = [];
  const write = jest.spyOn(process.stdout, 'write').mockImplementation((value: any) => {
    output.push(String(value));
    return true;
  });
  try {
    await createApiCommand().parseAsync(
      [
        'all',
        'get-notifications',
        '--query',
        JSON.stringify({ types: ['bank_send', 'claim'], unreadOnly: true, bookmark: 'cursor' }),
        ...(bodyOverride ? ['--body', JSON.stringify({ types: ['bank_send', 'claim'] })] : []),
        '--dry-run',
        '--api-key',
        'local-fixture-key'
      ],
      { from: 'user' }
    );
    const result = JSON.parse(output.join('')).data;
    const url = new URL(result.url);
    expect(url.searchParams.getAll('types')).toEqual(['bank_send', 'claim']);
    expect(url.searchParams.get('unreadOnly')).toBe('true');
  } finally {
    write.mockRestore();
  }
});

it('retains explicit endpoint constraints through schema assembly', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'notification-schemas-'));
  const file = path.join(directory, 'input.yaml');
  try {
    writeFileSync(file, YAML.stringify({ paths: {}, components: { schemas: { iMarkNotificationsReadPayload: { type: 'object' } } } }));
    execFileSync('bun', ['scripts/normalize_yml.ts', file], { cwd: root, stdio: 'pipe' });
    const assembled = YAML.parse(readFileSync(file, 'utf8'));
    expect(assembled.components.schemas.iMarkNotificationsReadPayload).toEqual(canonical.components.schemas.iMarkNotificationsReadPayload);
    expect(assembled.components.schemas.iUpdateNotificationPreferencesPayload).toEqual(
      canonical.components.schemas.iUpdateNotificationPreferencesPayload
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
it('keeps hosted JSON/YAML notification paths and response schemas in sync', () => {
  for (const file of ['openapi-hosted/openapi.yaml', 'openapitypes/combined_processed.yaml']) {
    const assembled = YAML.parse(readFileSync(path.join(root, file), 'utf8'));
    for (const [url] of operations) expect(assembled.paths[url]).toEqual(hosted.paths[url]);
    for (const name of Object.keys(canonical.components.schemas)) expect(assembled.components.schemas[name]).toEqual(hosted.components.schemas[name]);
  }
});

it('sends repeated filters and JSON mutations over real local HTTP without implicit cookies', async () => {
  const seen: { url: string; body: string; cookie: string | undefined }[] = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      seen.push({ url: req.url ?? '', body, cookie: req.headers.cookie });
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ updated: 1 }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  try {
    const common = ['--url', `http://127.0.0.1:${port}`, '--api-key', 'local-fixture-key'];
    await createApiCommand().parseAsync(
      ['all', 'get-notifications', '--query', JSON.stringify({ types: ['bank_send', 'claim'], unreadOnly: true }), ...common],
      { from: 'user' }
    );
    await createApiCommand().parseAsync(
      ['all', 'mark-notifications-read', '--body', JSON.stringify({ notificationIds: ['event'], read: false }), ...common],
      { from: 'user' }
    );
    expect(new URL(seen[0].url, 'http://local').searchParams.getAll('types')).toEqual(['bank_send', 'claim']);
    expect(JSON.parse(seen[1].body)).toEqual({ notificationIds: ['event'], read: false });
    expect(seen.every((request) => request.cookie === undefined)).toBe(true);
  } finally {
    write.mockRestore();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
