import * as http from 'node:http';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const cliTs = path.resolve(__dirname, '../index.ts');

function runExplain(args: string[], env: Record<string, string> = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-explain-test-'));
  try {
    return spawnSync('bun', [cliTs, 'explain', ...args], {
      encoding: 'utf-8',
      timeout: 15_000,
      env: {
        PATH: process.env.PATH,
        HOME: home,
        BITBADGES_CONFIG_DIR: home,
        BB_QUIET: '1',
        ...env
      }
    });
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}

async function runExplainAsync(
  args: string[],
  env: Record<string, string> = {}
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-explain-async-'));
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn('bun', [cliTs, 'explain', ...args], {
        env: {
          PATH: process.env.PATH,
          HOME: home,
          BITBADGES_CONFIG_DIR: home,
          BB_QUIET: '1',
          ...env
        }
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
      child.on('error', reject);
      child.on('close', (code) => resolve({ status: code, stdout, stderr }));
    });
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}

describe('bb explain error envelopes (BB-296)', () => {
  it('emits missing_api_key JSON envelope on stdout when querying mainnet numeric id without a key', () => {
    const res = runExplain(['1']);
    expect(res.status).toBe(2);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.data).toBeNull();
    expect(env.error.code).toBe('missing_api_key');
    expect(env.error.message).toMatch(/API key/i);
    expect(env.error.message).not.toMatch(/--network local/i);
  });

  it('emits missing_api_key JSON envelope on HTTP 401 without blaming --network local', async () => {
    const server = http.createServer((_req, res) => {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ errorMessage: 'Unauthorized' }));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as { port: number }).port;
    try {
      const res = await runExplainAsync(['1', '--url', `http://127.0.0.1:${port}`, '--api-key', 'bad-key']);
      expect(res.status).toBe(2);
      const env = JSON.parse(res.stdout);
      expect(env.ok).toBe(false);
      expect(env.error.code).toBe('missing_api_key');
      expect(env.error.message).toMatch(/401/);
      expect(env.error.message).toMatch(/API key/i);
      expect(env.error.message).not.toMatch(/--network local/i);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('emits invalid_input JSON envelope on malformed JSON with a single Accepts hint', () => {
    const res = runExplain(['{broken']);
    expect(res.status).toBe(2);
    const env = JSON.parse(res.stdout);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('invalid_input');
    expect((env.error.message.match(/Accepts:/g) ?? []).length).toBe(1);
    expect(env.error.message).not.toContain('..');
  });
});
