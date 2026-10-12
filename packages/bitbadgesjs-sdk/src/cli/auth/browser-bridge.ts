/**
 * Browser-bridge signing helper for the BitBadges CLI.
 *
 * Spins up a loopback HTTP listener on a random ephemeral port, opens the
 * user's default browser to the BitBadges /sign page with the request
 * encoded in the URL (or as a short code if too large), waits for the
 * wallet to redirect back with a signature/tx hash, and returns the
 * result.
 *
 * Security model:
 *   - State nonce echoed back on every redirect for CSRF-style binding —
 *     a forged callback from another tab can't return a result because
 *     it doesn't know the nonce.
 *   - Loopback-only (`127.0.0.1`); the /sign page enforces this on its
 *     end too. RFC 8252 §7.3 native-app loopback exception.
 */

import { BRAND_LOGO_SVG } from './brand.js';
import http from 'http';
import { AddressInfo } from 'net';
import crypto from 'crypto';
import { bbError, BBErrorCode } from '../utils/envelope.js';
import { parseBrowserTxRequest, parseBrowserTxResult } from '../../core/browser-signing.js';

export type BridgeMode = 'login' | 'msg' | 'tx';

export interface BridgePayload {
  version?: 2;
  requestId?: string;
  network?: 'mainnet' | 'testnet' | 'local';
  evmChainId?: string;
  expiresAt?: number;
  /** Required for login/msg; cosmos uses txsInfo, evm uses tx. */
  message?: string;
  chain?: 'cosmos' | 'evm';
  txsInfo?: Array<{ type: string; msg: object }>;
  tx?: { to: string; value?: string; data?: string };
  /** bb1.../0x... — the /sign page blocks signing if the connected wallet doesn't match. */
  expectedAddress?: string;
  /** Optional chain-id hint for tx mode (mainnet/testnet/stagenet selection). */
  chainId?: string;
  /**
   * When true (tx mode only): the page signs the tx but does NOT broadcast.
   * Returns the signed tx_bytes (base64) to the loopback listener so the CLI
   * can submit/retry/batch on its own. Useful for caller-controlled
   * broadcast (custodial signers, retry-with-backoff, parallel sequencing).
   */
  signOnly?: boolean;
}

export interface BridgeResult {
  requestId?: string;
  network?: 'mainnet' | 'testnet' | 'local';
  chainId?: string;
  outcome?: 'signed' | 'submitted' | 'cancelled' | 'error' | 'unknown';
  signature?: string;
  address?: string;
  publicKey?: string;
  hash?: string;
  chain?: 'cosmos' | 'evm';
  /** Sign-only mode: base64-encoded TxRaw bytes, ready to POST to /api/v0/broadcast. */
  signedTx?: string;
  /** When set, the user cancelled or the page reported an error. */
  error?: string;
}

export interface BridgeOptions {
  mode: BridgeMode;
  payload: BridgePayload;
  baseUrl: string; // indexer base, e.g. https://api.bitbadges.io/api/v0
  frontendUrl: string; // e.g. https://bitbadges.io
  apiKey?: string;
  timeoutMs?: number; // default 5min
  /** Set to true to skip auto-launching the browser (print URL instead). */
  noOpen?: boolean;
  /** Pin the loopback listener port. Default: random ephemeral. Useful for SSH-forwarded dev setups. */
  port?: number;
  /** Hostname to embed in the return URL (default 127.0.0.1). Use 'localhost' or a custom hostname when the browser is remote and reaches the listener via tunnel. */
  loopbackHost?: string;
}

const INLINE_PAYLOAD_THRESHOLD = 2 * 1024;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

function randomState(): string {
  return crypto.randomBytes(16).toString('base64url');
}

function base64UrlEncodeJson(obj: unknown): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json, 'utf8').toString('base64url');
}

function normalizeIndexerBase(baseUrl: string): string {
  // Some callers pass the indexer root (`http://localhost:3001`) and others
  // pass it with the `/api/v0` suffix already attached. Normalize so the
  // bridge always hits `<root>/api/v0/sign/payload` regardless of which
  // shape the caller supplied.
  const trimmed = baseUrl.replace(/\/$/, '');
  return /\/api\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/api/v0`;
}

async function uploadPayload(baseUrl: string, apiKey: string | undefined, payload: BridgePayload, deadline: number): Promise<string> {
  if (!apiKey) {
    throw bbError(
      BBErrorCode.MISSING_API_KEY,
      'Cannot upload large sign payload: no API key. Pass --api-key, or run `bb settings set apiKey <key>`.'
    );
  }
  const url = `${normalizeIndexerBase(baseUrl)}/sign/payload`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, deadline - Date.now()));
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ payload }),
    });
    const text = await res.text();
    let body: any;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
    if (!res.ok || typeof body?.code !== 'string') {
      throw new Error(`Failed to upload sign payload: ${body?.errorMessage || body?.error || `HTTP ${res.status}`}`);
    }
    return body.code as string;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Signing payload upload timed out; the browser was not opened.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Theme-aware HTML pages served by the loopback listener. Uses
// `prefers-color-scheme` so light + dark browsers both render
// readable text on a sensible background. No JS — no auto-close
// (the user closes the tab themselves once they see the result).
const PAGE_STYLES = `
  :root {
    color-scheme: light dark;
    --bg: #f4f6fb; --card: #ffffff; --border: #e4e7ef; --text: #0f1220; --muted: #5b6275;
    --ok: #15803d; --ok-bg: #dcfce7; --err: #b42318; --err-bg: #fee4e2; --neutral: #475467; --neutral-bg: #eef0f6;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: var(--text);
    background: radial-gradient(900px 420px at 15% -10%, rgba(2,173,238,.14), transparent 60%), radial-gradient(900px 420px at 95% 110%, rgba(235,1,140,.12), transparent 60%), var(--bg);
  }
  .card {
    position: relative; overflow: hidden; width: min(440px, 100%); text-align: center; padding: 40px 32px 28px;
    background: var(--card); border: 1px solid var(--border); border-radius: 20px; box-shadow: 0 18px 50px rgba(15, 18, 32, .10);
  }
  .card::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 4px; background: linear-gradient(90deg, #02adee, #7c3aed, #eb018c); }
  .brand { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 28px; }
  .brand svg { width: 36px; height: 36px; }
  .wordmark { font-size: 20px; font-weight: 700; letter-spacing: -.01em; background: linear-gradient(90deg, #02adee, #eb018c); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .icon { width: 56px; height: 56px; margin: 0 auto 18px; border-radius: 50%; display: grid; place-items: center; }
  .icon svg { width: 28px; height: 28px; }
  .icon.ok { background: var(--ok-bg); color: var(--ok); }
  .icon.err { background: var(--err-bg); color: var(--err); }
  .icon.neutral { background: var(--neutral-bg); color: var(--neutral); }
  h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: -.01em; }
  p { margin: 0; color: var(--muted); line-height: 1.55; }
  .link { display: inline-block; margin-top: 14px; padding: 8px 16px; border-radius: 10px; border: 1px solid var(--border); color: var(--text); font-size: 14px; font-weight: 600; text-decoration: none; }
  .link:hover { border-color: #7c3aed; }
  .hint { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 13px; }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #080a12; --card: #12141d; --border: #232736; --text: #eceef6; --muted: #a3a9bc;
      --ok: #4ade80; --ok-bg: rgba(74,222,128,.14); --err: #f87171; --err-bg: rgba(248,113,113,.14); --neutral: #b4bacb; --neutral-bg: rgba(180,186,203,.12);
    }
    .card { box-shadow: 0 18px 50px rgba(0, 0, 0, .45); }
  }
`;

const ICONS = {
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 7v6.5M12 17.2v.1"/></svg>',
  neutral: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M7 12h10"/></svg>'
};

function pageHtml(title: string, statusClass: string, statusText: string, body: string): string {
  const tone = statusClass === 'ok' || statusClass === 'err' ? statusClass : 'neutral';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${PAGE_STYLES}</style></head><body><main class="card"><div class="brand">${BRAND_LOGO_SVG}<span class="wordmark">BitBadges</span></div><div class="icon ${tone}">${ICONS[tone]}</div><h1>${statusText}</h1>${body}<p class="hint">You can close this tab.</p></main></body></html>`;
}

/**
 * Public block-explorer link for a sent transaction. Local chains have no explorer, and anything that is
 * not a plain hex hash gets no link at all, so the value is always safe to place in an attribute.
 */
export function explorerTxUrl(network: string, chain: string, hash: string | undefined): string | undefined {
  const plain = hash?.replace(/^0x/i, '');
  if (!plain || !/^[0-9a-fA-F]{16,128}$/.test(plain) || network === 'local') return undefined;
  const testnet = network === 'testnet';
  if (chain === 'evm') return `https://${testnet ? 'evm-testnet' : 'evm'}.explorer.bitbadges.io/tx/0x${plain.toLowerCase()}`;
  if (chain === 'cosmos') return `https://explorer.bitbadges.io/${testnet ? 'BitBadges%20Testnet' : 'BitBadges%20Mainnet'}/tx/${plain.toUpperCase()}`;
  return undefined;
}

function successPage(outcome?: string, explorerUrl?: string): string {
  if (outcome === 'submitted') {
    const link = explorerUrl ? `<p><a class="link" href="${explorerUrl}" target="_blank" rel="noopener noreferrer">View on explorer</a></p>` : '';
    return pageHtml('BitBadges CLI', 'ok', 'Transaction sent', `<p>Your agent has it from here.</p>${link}`);
  }
  if (outcome === 'signed') return pageHtml('BitBadges CLI', 'ok', 'Signed', '<p>Nothing has been sent yet. Your agent has the signature.</p>');
  return pageHtml('BitBadges CLI', 'ok', 'Signed', '<p>The result was returned to the terminal that opened this tab.</p>');
}

function cancelledPage(): string {
  return pageHtml('BitBadges CLI', '', 'Cancelled', '<p>Nothing was sent.</p>');
}

function errorPage(msg: string, statusText = 'Sign request rejected'): string {
  const safe = msg.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c]);
  return pageHtml('BitBadges CLI — error', 'err', statusText, `<p>${safe}</p>`);
}

function gonePage(): string {
  return pageHtml('BitBadges CLI', '', 'Already received', '<p>This sign request already returned a result.</p>');
}

/**
 * Open the system default browser. Uses the `open` package via dynamic
 * import (it's ESM-only). Falls back to printing the URL if anything
 * goes wrong.
 */
async function tryOpen(url: string): Promise<void> {
  try {
    const mod = await import('open');
    const openFn = (mod as any).default ?? (mod as any);
    await openFn(url);
  } catch (err: any) {
    process.stderr.write(`(could not auto-launch browser: ${err?.message || err})\n`);
  }
}

export interface BridgeStartOptions extends BridgeOptions {
  /** Stream the launch URL to stderr before opening. Default true. */
  printUrl?: boolean;
  onReady?: (url: string) => void;
}

export async function bridgeSign(opts: BridgeStartOptions): Promise<BridgeResult> {
  const state = randomState();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 1800000) throw new Error('Invalid signing timeout');
  const startedAt = Date.now();
  const txRequest = opts.mode === 'tx' ? parseBrowserTxRequest(opts.payload) : undefined;
  const deadline = Math.min(startedAt + timeoutMs, txRequest?.expiresAt ?? Infinity);

  // Encode payload — inline base64 for small, short-code upload for large.
  const inlineEncoded = base64UrlEncodeJson(txRequest ?? opts.payload);
  if (Buffer.byteLength(JSON.stringify(txRequest ?? opts.payload), 'utf8') > 64 * 1024) {
    throw new Error('Signing payload exceeds the 64 KiB size limit.');
  }
  const useUpload = inlineEncoded.length > INLINE_PAYLOAD_THRESHOLD;
  let payloadParam: string;
  let payloadKind: 'inline' | 'code';
  if (useUpload) {
    const code = await uploadPayload(opts.baseUrl, opts.apiKey, txRequest ?? opts.payload, deadline);
    payloadParam = `payload=${encodeURIComponent(code)}`;
    payloadKind = 'code';
  } else {
    payloadParam = `payload_inline=${encodeURIComponent(inlineEncoded)}`;
    payloadKind = 'inline';
  }
  if (Date.now() >= deadline) throw new Error('Signing request expired before the browser was opened.');

  // Spin up loopback listener.
  return new Promise<BridgeResult>((resolve, reject) => {
    let resolved = false;
    let timer: NodeJS.Timeout | undefined;

    const server = http.createServer((req, res) => {
      res.setHeader('Connection', 'close');
      const reqUrl = new URL(req.url ?? '/', `http://127.0.0.1`);

      // Single-shot: any subsequent request after we've resolved gets 410.
      if (resolved) {
        res.statusCode = 410;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(gonePage());
        return;
      }

      if (reqUrl.pathname === '/status' && txRequest && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        if (reqUrl.searchParams.get('state') !== state) {
          res.statusCode = 403;
          res.end('{}');
        } else res.end(JSON.stringify({ requestId: txRequest.requestId, pending: !resolved }));
        return;
      }
      if (reqUrl.pathname !== '/callback') {
        res.statusCode = 404;
        res.end();
        return;
      }

      const params = reqUrl.searchParams;
      const gotState = params.get('state');
      if (gotState !== state) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(errorPage('State nonce did not match. The request may have come from a different CLI session.'));
        return;
      }

      if (txRequest) {
        try {
          const fields: Record<string, string> = {};
          for (const [key, value] of params) {
            if (key === 'state') continue;
            if (key in fields) throw new Error('Duplicate result field');
            fields[key] = value;
          }
          const result = parseBrowserTxResult(fields, txRequest);
          resolved = true;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          const error = result.outcome === 'cancelled' ? result.error || 'User cancelled signing' : result.outcome === 'error' || result.outcome === 'unknown' ? result.error : undefined;
          res.end(
            result.outcome === 'cancelled'
              ? cancelledPage()
              : error
                ? errorPage(error, result.outcome === 'unknown' ? 'Submission status unknown' : undefined)
                : successPage(result.outcome, result.outcome === 'submitted' ? explorerTxUrl(txRequest.network, txRequest.chain, result.hash) : undefined)
          );
          cleanup();
          resolve({ ...result, ...(error ? { error } : {}) });
        } catch {
          res.statusCode = 400;
          res.end(errorPage('Invalid result: request, signer, network and outcome must match.'));
        }
        return;
      }

      const errParam = params.get('error');
      if (errParam) {
        resolved = true;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(errorPage(errParam));
        cleanup();
        resolve({ error: errParam });
        return;
      }

      const result: BridgeResult = {
        signature: params.get('signature') ?? undefined,
        address: params.get('address') ?? undefined,
        publicKey: params.get('publicKey') ?? undefined,
        hash: params.get('hash') ?? undefined,
        signedTx: params.get('signedTx') ?? undefined,
        chain: (params.get('chain') as 'cosmos' | 'evm' | null) ?? undefined,
      };

      resolved = true;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(successPage());
      cleanup();
      resolve(result);
    });

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      server.close();
    };

    server.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(err);
      }
    });

    const bindPort = opts.port ?? 0;
    const loopbackHost = opts.loopbackHost ?? '127.0.0.1';
    server.listen(bindPort, '127.0.0.1', async () => {
      const addr = server.address() as AddressInfo;
      const port = addr.port;
      const returnUrl = `http://${loopbackHost}:${port}/callback`;
      const fullUrl =
        `${opts.frontendUrl.replace(/\/$/, '')}/sign?mode=${encodeURIComponent(opts.mode)}` +
        `&${payloadParam}` +
        `&return=${encodeURIComponent(returnUrl)}` +
        `&state=${encodeURIComponent(state)}`;

      try { opts.onReady?.(fullUrl); }
      catch (error) { resolved = true; cleanup(); reject(error); return; }

      if (opts.printUrl !== false) {
        process.stderr.write(`\nOpening browser to sign. If it doesn't open, paste this URL manually:\n${fullUrl}\n\n`);
      }

      timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        if (txRequest) resolve({
          requestId: txRequest.requestId, outcome: 'unknown',
          error: 'Signing timed out. Submission status is unknown; a transaction may already have been submitted. Check wallet activity and chain status before retrying.'
        });
        else reject(new Error(`Sign request timed out after ${Math.round(timeoutMs / 1000)}s. Re-run the command.`));
      }, Math.max(1, deadline - Date.now()));

      if (!opts.noOpen) {
        await tryOpen(fullUrl);
      }
    });

    // payloadKind is informational — surface it in debug logs.
    if (process.env.BITBADGES_BRIDGE_DEBUG === '1') {
      process.stderr.write(`(bridge: payload via ${payloadKind})\n`);
    }
  });
}

/**
 * Resolve the BitBadges frontend URL for a given network. Honors
 * BITBADGES_FRONTEND_URL env override.
 */
export function resolveFrontendUrl(network: 'mainnet' | 'testnet' | 'local', explicit?: string): string {
  if (explicit) return explicit;
  if (process.env.BITBADGES_FRONTEND_URL) return process.env.BITBADGES_FRONTEND_URL;
  if (network === 'testnet') return 'https://testnet.bitbadges.io';
  if (network === 'local') return 'http://localhost:3000';
  return 'https://bitbadges.io';
}
