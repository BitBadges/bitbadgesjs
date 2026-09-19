import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { NETWORK_CONFIGS } from '../../signing/types.js';
import { browserReviewSchema, parseBrowserTxRequest, parseBrowserTxResult, type BrowserTxRequestV2 } from '../../core/browser-signing.js';
import { bridgeSign, resolveFrontendUrl } from '../auth/browser-bridge.js';
import { getApiUrl, getApiKeyForNetwork } from './io.js';
import { saveSigningRequest, setSigningRequestUrl, finishSigningRequest } from './signing-requests.js';

export const browserReviewInputSchema = z.object({
  artifact: z.object({ messages: z.array(z.object({ typeUrl: z.string().min(1), value: z.record(z.unknown()) }).strict()).min(1).max(100) }).strict(),
  expectedAddress: z.string(), network: z.enum(['mainnet', 'testnet', 'local']), signOnly: z.boolean().optional(),
  timeoutSeconds: z.number().int().min(60).max(1800).optional(), review: browserReviewSchema.optional()
}).strict();
export function prepareBrowserReviewRequest(input: unknown): BrowserTxRequestV2 {
  const value = browserReviewInputSchema.parse(input);
  const config = NETWORK_CONFIGS[value.network];
  return parseBrowserTxRequest({ version: 2, requestId: randomBytes(16).toString('hex'), expectedAddress: value.expectedAddress,
    network: value.network, chain: 'cosmos', chainId: config.cosmosChainId, evmChainId: String(config.evmChainId),
    expiresAt: Date.now() + (value.timeoutSeconds ?? 300) * 1000, signOnly: value.signOnly ?? false,
    txsInfo: value.artifact.messages.map(message => ({ type: message.typeUrl, msg: message.value })), ...(value.review ? { review: value.review } : {}) });
}

export async function requestBrowserReview(input: unknown) {
  const request = prepareBrowserReviewRequest(input);
  return new Promise<{ requestId: string; outcome: 'pending'; signUrl: string; expiresAt: number; confirmed: false; retrySafe: false; nextStep: string }>((resolve, reject) => {
    const cli = process.env.BITBADGES_CLI_PATH || 'bitbadges-cli';
    const script = /\.[cm]?js$/.test(cli);
    const child = spawn(script ? process.execPath : cli, [...(script ? [cli] : []), 'dev', 'requests', '_listen'], { detached: true, shell: false, stdio: ['pipe', 'pipe', 'ignore'], env: { ...process.env, BB_QUIET: '1' } });
    let done = false;
    let output = '';
    const finish = (error?: Error) => {
      if (done) return;
      done = true; clearTimeout(timer);
      child.stdin.destroy(); child.stdout.destroy();
      if (error) { child.kill(); reject(error); } else child.unref();
    };
    const timer = setTimeout(() => finish(new Error('Browser request listener did not become ready. Inspect saved requests before retrying.')), 15_000);
    child.on('error', () => finish(new Error('Install the matching bitbadges-cli or set BITBADGES_CLI_PATH before requesting browser review.')));
    child.on('close', () => { if (!done) finish(new Error('Browser request could not start. Large payloads require configured API access; inspect saved requests before retrying.')); });
    child.stdin.on('error', () => { /* Process close reports startup failure. */ });
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      if (output.length > 128 * 1024) return finish(new Error('Invalid browser listener output.'));
      if (!output.includes('\n')) return;
      try {
        const pending = JSON.parse(output.slice(0, output.indexOf('\n')));
        if (pending.requestId !== request.requestId || pending.outcome !== 'pending' || typeof pending.signUrl !== 'string') throw new Error('Mismatched browser listener');
        finish();
        resolve({ ...pending, confirmed: false, retrySafe: false, nextStep: 'Open signUrl for human review and signing. Inspect signing_request_status; pending/browser-open is not completion. The original listener survives CLI exit until expiry.' });
      } catch { finish(new Error('Invalid browser listener handoff.')); }
    });
    child.stdin.end(JSON.stringify(request));
  });
}

export async function listenForBrowserReview(input: unknown): Promise<void> {
  const request = parseBrowserTxRequest(input);
  saveSigningRequest(request);
  try {
    const options = { network: request.network };
    const result = parseBrowserTxResult(await bridgeSign({ mode: 'tx', payload: request, baseUrl: getApiUrl(options), apiKey: getApiKeyForNetwork(options),
      frontendUrl: resolveFrontendUrl(request.network), timeoutMs: request.expiresAt - Date.now(), noOpen: true, printUrl: false,
      onReady: signUrl => {
        setSigningRequestUrl(request.requestId, signUrl);
        process.stdout.write(JSON.stringify({ requestId: request.requestId, outcome: 'pending', signUrl, expiresAt: request.expiresAt }) + '\n');
      }
    }), request);
    finishSigningRequest(request.requestId, result);
  } catch {
    try { finishSigningRequest(request.requestId, { requestId: request.requestId, outcome: 'unknown', error: 'Listener ended without a verified result. Reconcile wallet and chain state before retrying.' }); } catch { /* Existing final result is authoritative. */ }
    process.exitCode = 1;
  }
}
