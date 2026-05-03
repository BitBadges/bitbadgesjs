/**
 * Browser-bridge signing helper for the BitBadges CLI.
 *
 * Spins up a loopback HTTP listener on a random ephemeral port, opens the
 * user's default browser to the BitBadges /sign page with the request
 * encoded in the URL (or as a short code if too large), waits for the
 * wallet to redirect back with a signature/tx hash, and returns the
 * result.
 *
 * Inspired by `gh auth login --web` and `npm login --auth-type=web`:
 *   - State nonce echoed back on every redirect for CSRF-style binding.
 *   - 6-digit PIN displayed in the terminal AND on the /sign page so the
 *     user can cross-verify they're looking at the page their CLI just
 *     launched (defense against ambient phishing tabs).
 *   - Loopback-only (`127.0.0.1`); the /sign page enforces this on its
 *     end too. RFC 8252 §7.3 native-app loopback exception.
 */

import http from 'http';
import { AddressInfo } from 'net';
import crypto from 'crypto';

export type BridgeMode = 'login' | 'msg' | 'tx';

export interface BridgePayload {
  /** Required for login/msg; cosmos uses txsInfo, evm uses tx. */
  message?: string;
  chain?: 'cosmos' | 'evm';
  txsInfo?: Array<{ type: string; msg: object }>;
  tx?: { to: string; value?: string; data?: string };
  /** bb1.../0x... — the /sign page blocks signing if the connected wallet doesn't match. */
  expectedAddress?: string;
  /** Optional chain-id hint for tx mode (mainnet/testnet/stagenet selection). */
  chainId?: string;
}

export interface BridgeResult {
  signature?: string;
  address?: string;
  publicKey?: string;
  hash?: string;
  chain?: 'cosmos' | 'evm';
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
}

const INLINE_PAYLOAD_THRESHOLD = 2 * 1024;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const PIN_LENGTH = 6;

function randomState(): string {
  return crypto.randomBytes(16).toString('base64url');
}

function randomPin(): string {
  let out = '';
  for (let i = 0; i < PIN_LENGTH; i++) {
    out += crypto.randomInt(0, 10).toString();
  }
  return out;
}

function base64UrlEncodeJson(obj: unknown): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json, 'utf8').toString('base64url');
}

async function uploadPayload(baseUrl: string, apiKey: string | undefined, payload: BridgePayload): Promise<string> {
  if (!apiKey) {
    throw new Error('Cannot upload large sign payload: no API key. Set BITBADGES_API_KEY or pass --api-key.');
  }
  const res = await fetch(`${baseUrl}/sign/payload`, {
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
}

// Theme-aware HTML pages served by the loopback listener. Uses
// `prefers-color-scheme` so light + dark browsers both render
// readable text on a sensible background. No JS — no auto-close
// (the user closes the tab themselves once they see the result).
const PAGE_STYLES = `
  :root { color-scheme: light dark; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 520px;
    margin: 80px auto;
    text-align: center;
    padding: 0 16px;
    background: #fff;
    color: #111;
  }
  h2 { margin-bottom: 12px; }
  p { color: #444; }
  .ok { color: #1e8a4a; }
  .err { color: #c2360b; }
  .muted { color: #777; font-size: 13px; margin-top: 24px; }
  @media (prefers-color-scheme: dark) {
    body { background: #15161a; color: #e8e8ec; }
    p { color: #b8b8bf; }
    .ok { color: #4ade80; }
    .err { color: #f87171; }
    .muted { color: #888; }
  }
`;

function pageHtml(title: string, statusClass: string, statusText: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${PAGE_STYLES}</style></head><body><h2 class="${statusClass}">${statusText}</h2>${body}<p class="muted">You can close this tab.</p></body></html>`;
}

function successPage(): string {
  return pageHtml('BitBadges CLI', 'ok', 'Signed', '<p>The result was returned to the terminal that opened this tab.</p>');
}

function errorPage(msg: string): string {
  const safe = msg.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c]);
  return pageHtml('BitBadges CLI — error', 'err', 'Sign request rejected', `<p>${safe}</p>`);
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
  /** Stream the PIN + URL to stderr before opening. Default true. */
  printPin?: boolean;
}

export async function bridgeSign(opts: BridgeStartOptions): Promise<BridgeResult> {
  const state = randomState();
  const pin = randomPin();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Encode payload — inline base64 for small, short-code upload for large.
  const inlineEncoded = base64UrlEncodeJson(opts.payload);
  const useUpload = inlineEncoded.length > INLINE_PAYLOAD_THRESHOLD;
  let payloadParam: string;
  let payloadKind: 'inline' | 'code';
  if (useUpload) {
    const code = await uploadPayload(opts.baseUrl, opts.apiKey, opts.payload);
    payloadParam = `payload=${encodeURIComponent(code)}`;
    payloadKind = 'code';
  } else {
    payloadParam = `payload_inline=${encodeURIComponent(inlineEncoded)}`;
    payloadKind = 'inline';
  }

  // Spin up loopback listener.
  return new Promise<BridgeResult>((resolve, reject) => {
    let resolved = false;
    let timer: NodeJS.Timeout | undefined;

    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url ?? '/', `http://127.0.0.1`);

      // Single-shot: any subsequent request after we've resolved gets 410.
      if (resolved) {
        res.statusCode = 410;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(gonePage());
        return;
      }

      // Only accept the /callback path. Everything else is 404 to keep
      // the surface tiny.
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

    server.listen(0, '127.0.0.1', async () => {
      const addr = server.address() as AddressInfo;
      const port = addr.port;
      const returnUrl = `http://127.0.0.1:${port}/callback`;
      const fullUrl =
        `${opts.frontendUrl.replace(/\/$/, '')}/sign?mode=${encodeURIComponent(opts.mode)}` +
        `&${payloadParam}` +
        `&return=${encodeURIComponent(returnUrl)}` +
        `&state=${encodeURIComponent(state)}` +
        `&pin=${encodeURIComponent(pin)}`;

      if (opts.printPin !== false) {
        process.stderr.write(`\nFirst, copy your one-time code: ${pin}\n`);
        process.stderr.write(`Press Enter to open the browser, or paste this URL manually:\n${fullUrl}\n\n`);
      }

      timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        reject(new Error(`Sign request timed out after ${Math.round(timeoutMs / 1000)}s. Re-run the command.`));
      }, timeoutMs);

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
