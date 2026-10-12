import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listenForBrowserReview, prepareBrowserReviewRequest, requestBrowserReview } from './browser-review.js';
import { artifactIdentity, verifyIntent } from '../../core/intent.js';
import { NETWORK_CONFIGS } from '../../signing/types.js';
const address = 'bb1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zql3w7';
const artifact = { messages: [{ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: { fromAddress: address, toAddress: address, amount: [{ denom: 'ubadge', amount: '1' }] } }] };
const intent = { version: 1, requirements: [], unresolvedDecisions: [] };
const review = { version: 1, artifactId: artifactIdentity(artifact), intent, evidence: verifyIntent(artifact, intent), binding: { expectedAddress: address, network: 'local', chainId: NETWORK_CONFIGS.local.cosmosChainId } };
describe('browser request review binding', () => {
  it('keeps existing v2 request identity and includes only matching review context', () => {
    const request = prepareBrowserReviewRequest({ artifact, expectedAddress: address, network: 'local', review });
    expect(request.version).toBe(2); expect(request.requestId).toMatch(/^[a-f0-9]{32}$/);
    expect(request.review?.artifactId).toBe(artifactIdentity(artifact));
  });
  it('rejects stale evidence, changed artifact and changed network', () => {
    expect(() => prepareBrowserReviewRequest({ artifact, expectedAddress: address, network: 'local', review: { ...review, evidence: { ...review.evidence, intentId: 'f'.repeat(64) } } })).toThrow(/evidence/);
    expect(() => prepareBrowserReviewRequest({ artifact: { messages: [...artifact.messages, ...artifact.messages] }, expectedAddress: address, network: 'local', review })).toThrow(/stale/);
    expect(() => prepareBrowserReviewRequest({ artifact, expectedAddress: address, network: 'testnet', review })).toThrow(/stale/);
  });
});

describe('starting a browser review without an API key', () => {
  const big = { messages: [{ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: { ...artifact.messages[0].value, memo: 'x'.repeat(6000) } }] };
  let dir: string;
  const saved = { cfg: process.env.BITBADGES_CONFIG_DIR, key: process.env.BITBADGES_API_KEY, cli: process.env.BITBADGES_CLI_PATH };
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'bb-review-')); process.env.BITBADGES_CONFIG_DIR = dir; delete process.env.BITBADGES_API_KEY; });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    for (const [name, value] of [['BITBADGES_CONFIG_DIR', saved.cfg], ['BITBADGES_API_KEY', saved.key], ['BITBADGES_CLI_PATH', saved.cli]] as const) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });

  it('the listener reports how to fix a missing API key instead of exiting silently', async () => {
    const request = prepareBrowserReviewRequest({ artifact: big, expectedAddress: address, network: 'local' });
    const lines: string[] = [];
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(((chunk: string) => { lines.push(String(chunk)); return true; }) as any);
    const previousExit = process.exitCode;
    try { await listenForBrowserReview(request); } finally { spy.mockRestore(); process.exitCode = previousExit; }
    const report = JSON.parse(lines.join('').split('\n')[0]);
    expect(report).toMatchObject({ requestId: request.requestId, outcome: 'error', code: 'missing_api_key' });
    expect(report.message).toContain('bb settings set apiKey');
    expect(report.message).toContain('BITBADGES_API_KEY');
  });

  it('request_browser_review surfaces the listener\'s reason to the caller', async () => {
    const fake = join(dir, 'fake-cli.js');
    writeFileSync(fake, "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const r=JSON.parse(d);process.stdout.write(JSON.stringify({requestId:r.requestId,outcome:'error',code:'missing_api_key',message:'Run bb settings set apiKey first.'})+'\\n');});");
    process.env.BITBADGES_CLI_PATH = fake;
    await expect(requestBrowserReview({ artifact: big, expectedAddress: address, network: 'local' })).rejects.toThrow('Run bb settings set apiKey first.');
  }, 30_000);
});
